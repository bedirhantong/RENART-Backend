const express = require('express');
const router = express.Router();

// Controllers
const authController = require('../controllers/authController');
const publicProductsController = require('../controllers/publicProductsController');
const favoritesController = require('../controllers/favoritesController');
const testController = require('../controllers/testController');

// Middleware
const { authenticate, optionalAuth } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');

// Validation schemas
const {
  loginSchema,
  registerSchema,
  productQuerySchema,
  addFavoriteSchema,
  uuidSchema
} = require('../validators/schemas');

// Auth routes
router.post('/auth/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/auth/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/auth/logout', authenticate, authController.logout);
router.get('/auth/profile', authenticate, authController.getProfile);
router.post('/auth/refresh', authController.refreshToken);

// Public product routes
router.get('/products', validateQuery(productQuerySchema), publicProductsController.getProducts);
router.get('/products/:id', validateParams({ id: uuidSchema }), publicProductsController.getProductById);

// Favorites routes (require authentication)
router.get('/favorites', authenticate, favoritesController.getFavorites);
router.post('/favorites', authenticate, validateBody(addFavoriteSchema), favoritesController.addFavorite);
router.delete('/favorites/:id', authenticate, validateParams({ id: uuidSchema }), favoritesController.removeFavorite);
router.get('/favorites/check/:productId', authenticate, validateParams({ productId: uuidSchema }), favoritesController.checkFavorite);

// Test routes
router.get('/test', testController.simpleTest);
router.get('/test/auth', authenticate, testController.authTest);
router.get('/test/cors', testController.corsTest);

module.exports = router;
