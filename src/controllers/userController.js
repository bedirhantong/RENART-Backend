const { supabase } = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    return success(res, 'Profile retrieved successfully', {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name,
        lastName: user.user_metadata?.last_name,
        createdAt: user.created_at
      }
    });

  } catch (err) {
    logger.error('Get profile error:', err);
    return error(res, 'Failed to retrieve profile', 500);
  }
});

/**
 * Update user profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  try {
    const { firstName, lastName } = req.body;
    const userId = req.user.id;

    // Update user metadata in Supabase Auth
    const { data: updatedUser, error: updateError } = await supabase.auth.updateUser({
      data: {
        first_name: firstName,
        last_name: lastName
      }
    });

    if (updateError) {
      logger.error('Update profile error:', updateError);
      return error(res, 'Failed to update profile', 500);
    }

    logger.info(`User profile updated: ${req.user.email}`);

    return success(res, 'Profile updated successfully', {
      user: {
        id: updatedUser.user.id,
        email: updatedUser.user.email,
        firstName: updatedUser.user.user_metadata?.first_name,
        lastName: updatedUser.user.user_metadata?.last_name,
        createdAt: updatedUser.user.created_at
      }
    });

  } catch (err) {
    logger.error('Update profile error:', err);
    return error(res, 'Failed to update profile', 500);
  }
});

/**
 * Get vendor profile by ID
 */
const getVendorProfile = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;

    const { data: vendor, error: queryError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .eq('is_active', true)
      .single();

    if (queryError || !vendor) {
      logger.warn(`Vendor not found: ${vendorId}`);
      return error(res, 'Vendor not found', 404);
    }

    return success(res, 'Vendor profile retrieved successfully', {
      vendor: {
        id: vendor.id,
        name: vendor.name,
        description: vendor.description,
        logoUrl: vendor.logo_url,
        email: vendor.email,
        createdAt: vendor.created_at
      }
    });

  } catch (err) {
    logger.error('Get vendor profile error:', err);
    return error(res, 'Failed to retrieve vendor profile', 500);
  }
});

/**
 * Get vendor products by vendor ID
 */
const getVendorProducts = asyncHandler(async (req, res) => {
  try {
    const { vendorId } = req.params;
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

    // First check if vendor exists and is active
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, name')
      .eq('id', vendorId)
      .eq('is_active', true)
      .single();

    if (vendorError || !vendor) {
      logger.warn(`Vendor not found: ${vendorId}`);
      return error(res, 'Vendor not found', 404);
    }

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
      .eq('vendor_id', vendorId)
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
      const { data: colorProducts } = await supabase
        .from('product_images')
        .select('product_id')
        .eq('color', color);
      
      if (colorProducts && colorProducts.length > 0) {
        const productIds = colorProducts.map(p => p.product_id);
        query = query.in('id', productIds);
      } else {
        return success(res, 'Products retrieved successfully', {
          products: [],
          vendor: {
            id: vendor.id,
            name: vendor.name
          },
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            pages: 0
          }
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
    const goldPriceService = require('../services/goldPriceService');
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

    return success(res, 'Vendor products retrieved successfully', {
      products: filteredProducts,
      vendor: {
        id: vendor.id,
        name: vendor.name
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: finalCount || 0,
        pages: Math.ceil((finalCount || 0) / limit)
      }
    });

  } catch (err) {
    logger.error('Get vendor products error:', err);
    return error(res, 'Failed to retrieve vendor products', 500);
  }
});

module.exports = {
  getProfile,
  updateProfile,
  getVendorProfile,
  getVendorProducts
};
