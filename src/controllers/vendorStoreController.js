const { supabase } = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get vendor store information
 */
const getStoreInfo = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    const { data: vendor, error: queryError } = await supabase
      .from('vendors')
      .select('*')
      .eq('id', vendorId)
      .single();

    if (queryError || !vendor) {
      logger.error('Get store info error:', queryError);
      return error(res, 'Failed to retrieve store information', 500);
    }

    // Get product statistics
    const { data: productStats } = await supabase
      .from('products')
      .select('is_active')
      .eq('vendor_id', vendorId);

    const totalProducts = productStats?.length || 0;
    const activeProducts = productStats?.filter(p => p.is_active).length || 0;
    const inactiveProducts = totalProducts - activeProducts;

    return success(res, 'Store information retrieved successfully', {
      store: {
        id: vendor.id,
        name: vendor.name,
        description: vendor.description,
        logoUrl: vendor.logo_url,
        email: vendor.email,
        isActive: vendor.is_active,
        createdAt: vendor.created_at,
        updatedAt: vendor.updated_at
      },
      statistics: {
        totalProducts,
        activeProducts,
        inactiveProducts
      }
    });

  } catch (err) {
    logger.error('Get store info error:', err);
    return error(res, 'Failed to retrieve store information', 500);
  }
});

/**
 * Update vendor store information
 */
const updateStoreInfo = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;
    const updateData = req.body;

    // Remove fields that shouldn't be updated directly
    const allowedFields = ['name', 'description', 'logoUrl'];
    const filteredData = {};
    
    Object.keys(updateData).forEach(key => {
      if (allowedFields.includes(key)) {
        // Convert camelCase to snake_case for database
        if (key === 'logoUrl') {
          filteredData['logo_url'] = updateData[key];
        } else {
          filteredData[key] = updateData[key];
        }
      }
    });

    if (Object.keys(filteredData).length === 0) {
      return error(res, 'No valid fields to update', 400);
    }

    // Add updated timestamp
    filteredData.updated_at = new Date().toISOString();

    // Update vendor information
    const { data: updatedVendor, error: updateError } = await supabase
      .from('vendors')
      .update(filteredData)
      .eq('id', vendorId)
      .select()
      .single();

    if (updateError) {
      logger.error('Update store info error:', updateError);
      return error(res, 'Failed to update store information', 500);
    }

    logger.info(`Store information updated for vendor ${vendorId}`);

    return success(res, 'Store information updated successfully', {
      store: {
        id: updatedVendor.id,
        name: updatedVendor.name,
        description: updatedVendor.description,
        logoUrl: updatedVendor.logo_url,
        email: updatedVendor.email,
        isActive: updatedVendor.is_active,
        createdAt: updatedVendor.created_at,
        updatedAt: updatedVendor.updated_at
      }
    });

  } catch (err) {
    logger.error('Update store info error:', err);
    return error(res, 'Failed to update store information', 500);
  }
});

/**
 * Get vendor dashboard statistics
 */
const getDashboardStats = asyncHandler(async (req, res) => {
  try {
    const vendorId = req.vendor.id;

    // Get product statistics
    const { data: products } = await supabase
      .from('products')
      .select('id, is_active, created_at')
      .eq('vendor_id', vendorId);

    const totalProducts = products?.length || 0;
    const activeProducts = products?.filter(p => p.is_active).length || 0;
    const inactiveProducts = totalProducts - activeProducts;

    // Get recent products (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentProducts = products?.filter(p => 
      new Date(p.created_at) > thirtyDaysAgo
    ).length || 0;

    // Get favorite counts for vendor products
    const { data: favoriteStats } = await supabase
      .from('favorites')
      .select(`
        id,
        products!inner (
          vendor_id
        )
      `)
      .eq('products.vendor_id', vendorId);

    const totalFavorites = favoriteStats?.length || 0;

    // Get top products by favorites
    const { data: topProducts } = await supabase
      .from('products')
      .select(`
        id,
        name,
        favorites (id)
      `)
      .eq('vendor_id', vendorId)
      .eq('is_active', true)
      .limit(5);

    const topProductsByFavorites = topProducts
      ?.map(product => ({
        id: product.id,
        name: product.name,
        favoriteCount: product.favorites?.length || 0
      }))
      .sort((a, b) => b.favoriteCount - a.favoriteCount)
      .slice(0, 5) || [];

    return success(res, 'Dashboard statistics retrieved successfully', {
      statistics: {
        products: {
          total: totalProducts,
          active: activeProducts,
          inactive: inactiveProducts,
          recent: recentProducts
        },
        favorites: {
          total: totalFavorites
        }
      },
      topProducts: topProductsByFavorites
    });

  } catch (err) {
    logger.error('Get dashboard stats error:', err);
    return error(res, 'Failed to retrieve dashboard statistics', 500);
  }
});

module.exports = {
  getStoreInfo,
  updateStoreInfo,
  getDashboardStats
};
