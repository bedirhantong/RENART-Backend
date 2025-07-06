const { supabase } = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const goldPriceService = require('../services/goldPriceService');
const logger = require('../utils/logger');

/**
 * Get all active products with filtering and pagination
 */
const getProducts = asyncHandler(async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      color,
      minPrice,
      maxPrice,
      minWeight,
      maxWeight,
      minPopularity,
      maxPopularity,
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        vendors (
          id,
          name,
          logo_url
        ),
        product_images (
          id,
          color,
          image_url
        )
      `)
      .eq('is_active', true);

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply weight filters
    if (minWeight) {
      query = query.gte('weight', minWeight);
    }
    if (maxWeight) {
      query = query.lte('weight', maxWeight);
    }

    // Apply popularity filters
    if (minPopularity) {
      query = query.gte('popularity_score', minPopularity);
    }
    if (maxPopularity) {
      query = query.lte('popularity_score', maxPopularity);
    }

    // Apply color filter if specified
    if (color) {
      // Filter products that have images with the specified color
      const { data: colorProducts } = await supabase
        .from('product_images')
        .select('product_id')
        .eq('color', color);
      
      if (colorProducts && colorProducts.length > 0) {
        const productIds = colorProducts.map(p => p.product_id);
        query = query.in('id', productIds);
      } else {
        // No products found with this color
        return success(res, 'Products retrieved successfully', {
          products: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          },
          goldPrice: goldPriceService.getCurrentPrice(),
          lastPriceUpdate: goldPriceService.getLastUpdateTime()
        });
      }
    }

    // Get total count for pagination
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Apply sorting
    let orderColumn = 'name';
    switch (sortBy) {
      case 'weight':
        orderColumn = 'weight';
        break;
      case 'popularity':
        orderColumn = 'popularity_score';
        break;
      case 'name':
      default:
        orderColumn = 'name';
        break;
    }

    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data: products, error: queryError } = await query;

    if (queryError) {
      logger.error('Database query error:', queryError);
      return error(res, 'Failed to retrieve products', 500);
    }

    // Calculate dynamic prices for each product
    const productsWithPrices = products.map(product => {
      const calculatedPrice = goldPriceService.calculateProductPrice(
        product.popularity_score,
        product.weight
      );

      return {
        ...product,
        calculatedPrice
      };
    });

    // Apply price filters after calculation
    let filteredProducts = productsWithPrices;
    if (minPrice || maxPrice) {
      filteredProducts = productsWithPrices.filter(product => {
        const price = product.calculatedPrice;
        if (minPrice && price < minPrice) return false;
        if (maxPrice && price > maxPrice) return false;
        return true;
      });
    }

    // If we filtered by price, we need to recalculate pagination
    let finalCount = count;
    if (minPrice || maxPrice) {
      finalCount = filteredProducts.length;
      // Apply pagination to filtered results
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      filteredProducts = filteredProducts.slice(startIndex, endIndex);
    }

    // Sort by price if requested (after calculation)
    if (sortBy === 'price') {
      filteredProducts.sort((a, b) => {
        return sortOrder === 'asc' 
          ? a.calculatedPrice - b.calculatedPrice
          : b.calculatedPrice - a.calculatedPrice;
      });
    }

    return success(res, 'Products retrieved successfully', {
      products: filteredProducts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: finalCount || 0,
        pages: Math.ceil((finalCount || 0) / limit)
      },
      goldPrice: goldPriceService.getCurrentPrice(),
      lastPriceUpdate: goldPriceService.getLastUpdateTime()
    });

  } catch (err) {
    logger.error('Get products error:', err);
    return error(res, 'Failed to retrieve products', 500);
  }
});

/**
 * Get single product by ID
 */
const getProductById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const { data: product, error: queryError } = await supabase
      .from('products')
      .select(`
        *,
        vendors (
          id,
          name,
          description,
          logo_url
        ),
        product_images (
          id,
          color,
          image_url
        )
      `)
      .eq('id', id)
      .eq('is_active', true)
      .single();

    if (queryError || !product) {
      logger.warn(`Product not found: ${id}`);
      return error(res, 'Product not found', 404);
    }

    // Calculate dynamic price
    const calculatedPrice = goldPriceService.calculateProductPrice(
      product.popularity_score,
      product.weight
    );

    const productWithPrice = {
      ...product,
      calculatedPrice
    };

    return success(res, 'Product retrieved successfully', {
      product: productWithPrice,
      goldPrice: goldPriceService.getCurrentPrice(),
      lastPriceUpdate: goldPriceService.getLastUpdateTime()
    });

  } catch (err) {
    logger.error('Get product by ID error:', err);
    return error(res, 'Failed to retrieve product', 500);
  }
});

module.exports = {
  getProducts,
  getProductById
};
