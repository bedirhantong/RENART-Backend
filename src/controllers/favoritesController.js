const { supabase } = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const goldPriceService = require('../services/goldPriceService');
const logger = require('../utils/logger');

/**
 * Get user's favorite products
 */
const getFavorites = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: favorites, error: queryError } = await supabase
      .from('favorites')
      .select(`
        id,
        created_at,
        products (
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
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (queryError) {
      logger.error('Get favorites error:', queryError);
      return error(res, 'Failed to retrieve favorites', 500);
    }

    // Calculate dynamic prices for each favorite product
    const favoritesWithPrices = favorites.map(favorite => {
      const product = favorite.products;
      const calculatedPrice = goldPriceService.calculateProductPrice(
        product.popularity_score,
        product.weight
      );

      // Group images by color
      const imagesByColor = product.product_images ? product.product_images.reduce((acc, img) => {
        if (!acc[img.color]) {
          acc[img.color] = [];
        }
        acc[img.color].push(img.image_url);
        return acc;
      }, {}) : {};
      
      const images = product.product_images ? product.product_images.map(img => img.image_url) : [];

      return {
        id: favorite.id,
        createdAt: favorite.created_at,
        productId: product.id,
        product: {
          ...product,
          calculatedPrice,
          images,
          imagesByColor,
          availableColors: Object.keys(imagesByColor)
        }
      };
    });

    return success(res, 'Favorites retrieved successfully', {
      favorites: favoritesWithPrices,
      total: favoritesWithPrices.length,
      goldPrice: goldPriceService.getCurrentPrice(),
      lastPriceUpdate: goldPriceService.getLastUpdateTime()
    });

  } catch (err) {
    logger.error('Get favorites error:', err);
    return error(res, 'Failed to retrieve favorites', 500);
  }
});

/**
 * Add product to favorites
 */
const addFavorite = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    // Check if product exists and is active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, name')
      .eq('id', productId)
      .eq('is_active', true)
      .single();

    if (productError || !product) {
      return error(res, 'Product not found or inactive', 404);
    }

    // Check if already in favorites
    const { data: existingFavorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    if (existingFavorite) {
      return error(res, 'Product already in favorites', 409);
    }

    // Add to favorites
    const { data: newFavorite, error: insertError } = await supabase
      .from('favorites')
      .insert({
        user_id: userId,
        product_id: productId
      })
      .select('id, created_at')
      .single();

    if (insertError) {
      logger.error('Add favorite error:', insertError);
      
      // Handle foreign key constraint errors
      if (insertError.message.includes('foreign key constraint')) {
        return error(res, 'Database configuration error. Please contact support.', 500);
      }
      
      return error(res, `Failed to add to favorites: ${insertError.message}`, 500);
    }

    logger.info(`User ${userId} added product ${productId} to favorites`);

    return success(res, 'Product added to favorites successfully', {
      favorite: {
        id: newFavorite.id,
        productId,
        productName: product.name,
        createdAt: newFavorite.created_at
      }
    }, 201);

  } catch (err) {
    logger.error('Add favorite error:', err);
    return error(res, 'Failed to add to favorites', 500);
  }
});

/**
 * Remove product from favorites
 */
const removeFavorite = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Check if favorite exists and belongs to user
    const { data: favorite, error: fetchError } = await supabase
      .from('favorites')
      .select('id, product_id')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchError || !favorite) {
      return error(res, 'Favorite not found', 404);
    }

    // Remove from favorites
    const { error: deleteError } = await supabase
      .from('favorites')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (deleteError) {
      logger.error('Remove favorite error:', deleteError);
      return error(res, 'Failed to remove from favorites', 500);
    }

    logger.info(`User ${userId} removed favorite ${id}`);

    return success(res, 'Product removed from favorites successfully');

  } catch (err) {
    logger.error('Remove favorite error:', err);
    return error(res, 'Failed to remove from favorites', 500);
  }
});

/**
 * Check if product is in user's favorites
 */
const checkFavorite = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.params;

    const { data: favorite } = await supabase
      .from('favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('product_id', productId)
      .single();

    return success(res, 'Favorite status checked', {
      isFavorite: !!favorite,
      favoriteId: favorite?.id || null
    });

  } catch (err) {
    logger.error('Check favorite error:', err);
    return error(res, 'Failed to check favorite status', 500);
  }
});

module.exports = {
  getFavorites,
  addFavorite,
  removeFavorite,
  checkFavorite
};
