const supabase = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const goldPriceService = require('../services/goldPriceService');
const logger = require('../utils/logger');

/**
 * Get vendor's products
 */
const getVendorProducts = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          color,
          image_url
        )
      `)
      .eq('vendor_id', vendorId);

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply active status filter
    if (isActive !== undefined) {
      query = query.eq('is_active', isActive === 'true');
    }

    // Get total count for pagination
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Apply sorting
    let orderColumn = 'created_at';
    switch (sortBy) {
      case 'name':
        orderColumn = 'name';
        break;
      case 'weight':
        orderColumn = 'weight';
        break;
      case 'popularity':
        orderColumn = 'popularity_score';
        break;
      case 'created_at':
      default:
        orderColumn = 'created_at';
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

    return success(res, 'Vendor products retrieved successfully', {
      products: productsWithPrices,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      },
      goldPrice: goldPriceService.getCurrentPrice(),
      lastPriceUpdate: goldPriceService.getLastUpdateTime()
    });

  } catch (err) {
    logger.error('Get vendor products error:', err);
    return error(res, 'Failed to retrieve products', 500);
  }
});

/**
 * Get single vendor product by ID
 */
const getVendorProductById = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { id } = req.params;

    const { data: product, error: queryError } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          color,
          image_url
        )
      `)
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .single();

    if (queryError || !product) {
      logger.warn(`Product not found for vendor ${vendorId}: ${id}`);
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
    logger.error('Get vendor product by ID error:', err);
    return error(res, 'Failed to retrieve product', 500);
  }
});

/**
 * Create new product
 */
const createProduct = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { name, weight, popularityScore, isActive = true, colors } = req.body;

    // Create product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        vendor_id: vendorId,
        name,
        weight,
        popularity_score: popularityScore,
        is_active: isActive
      })
      .select()
      .single();

    if (productError) {
      logger.error('Create product error:', productError);
      return error(res, 'Failed to create product', 500);
    }

    // Create product images for each color
    const imageInserts = colors.map(color => ({
      product_id: product.id,
      color,
      image_url: null // Will be updated when images are uploaded
    }));

    const { error: imageError } = await supabase
      .from('product_images')
      .insert(imageInserts);

    if (imageError) {
      logger.error('Create product images error:', imageError);
      // Try to rollback product creation
      await supabase.from('products').delete().eq('id', product.id);
      return error(res, 'Failed to create product images', 500);
    }

    // Fetch the complete product with images
    const { data: fullProduct } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          color,
          image_url
        )
      `)
      .eq('id', product.id)
      .single();

    // Calculate dynamic price
    const calculatedPrice = goldPriceService.calculateProductPrice(
      product.popularity_score,
      product.weight
    );

    logger.info(`Product created successfully by vendor ${vendorId}: ${product.id}`);

    return success(res, 'Product created successfully', {
      product: {
        ...fullProduct,
        calculatedPrice
      }
    }, 201);

  } catch (err) {
    logger.error('Create product error:', err);
    return error(res, 'Failed to create product', 500);
  }
});

/**
 * Update product
 */
const updateProduct = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { id } = req.params;
    const updateData = req.body;

    // Check if product belongs to vendor
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .single();

    if (fetchError || !existingProduct) {
      return error(res, 'Product not found', 404);
    }

    // Extract colors from updateData if present
    const { colors, ...productUpdateData } = updateData;

    // Update product
    const { data: product, error: updateError } = await supabase
      .from('products')
      .update(productUpdateData)
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .select()
      .single();

    if (updateError) {
      logger.error('Update product error:', updateError);
      return error(res, 'Failed to update product', 500);
    }

    // Update colors if provided
    if (colors && Array.isArray(colors)) {
      // Delete existing product images
      await supabase
        .from('product_images')
        .delete()
        .eq('product_id', id);

      // Insert new product images
      const imageInserts = colors.map(color => ({
        product_id: id,
        color,
        image_url: null
      }));

      const { error: imageError } = await supabase
        .from('product_images')
        .insert(imageInserts);

      if (imageError) {
        logger.error('Update product images error:', imageError);
        return error(res, 'Failed to update product colors', 500);
      }
    }

    // Fetch updated product with images
    const { data: updatedProduct } = await supabase
      .from('products')
      .select(`
        *,
        product_images (
          id,
          color,
          image_url
        )
      `)
      .eq('id', id)
      .single();

    // Calculate dynamic price
    const calculatedPrice = goldPriceService.calculateProductPrice(
      updatedProduct.popularity_score,
      updatedProduct.weight
    );

    logger.info(`Product updated successfully by vendor ${vendorId}: ${id}`);

    return success(res, 'Product updated successfully', {
      product: {
        ...updatedProduct,
        calculatedPrice
      }
    });

  } catch (err) {
    logger.error('Update product error:', err);
    return error(res, 'Failed to update product', 500);
  }
});

/**
 * Soft delete product (set is_active to false)
 */
const deleteProduct = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const { id } = req.params;

    // Check if product belongs to vendor
    const { data: existingProduct, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', id)
      .eq('vendor_id', vendorId)
      .single();

    if (fetchError || !existingProduct) {
      return error(res, 'Product not found', 404);
    }

    // Soft delete (set is_active to false)
    const { error: deleteError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', id)
      .eq('vendor_id', vendorId);

    if (deleteError) {
      logger.error('Delete product error:', deleteError);
      return error(res, 'Failed to delete product', 500);
    }

    logger.info(`Product soft deleted by vendor ${vendorId}: ${id}`);

    return success(res, 'Product deleted successfully');

  } catch (err) {
    logger.error('Delete product error:', err);
    return error(res, 'Failed to delete product', 500);
  }
});

module.exports = {
  getVendorProducts,
  getVendorProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
