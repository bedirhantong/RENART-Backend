const express = require('express');
const router = express.Router();

// Controllers
const vendorProductsController = require('../controllers/vendorProductsController');
const vendorStoreController = require('../controllers/vendorStoreController');

// Middleware
const { authenticateVendor } = require('../middleware/auth');
const { validateBody, validateQuery, validateParams } = require('../middleware/validate');
const { vendorLimiter } = require('../middleware/rateLimiter');

// Validation schemas
const {
  createProductSchema,
  updateProductSchema,
  updateVendorSchema,
  productQuerySchema,
  uuidSchema
} = require('../validators/schemas');

// Apply vendor authentication and rate limiting to all routes
router.use(authenticateVendor);
router.use(vendorLimiter);

// Vendor profile routes
router.get('/profile', vendorStoreController.getStoreInfo);
router.put('/profile', validateBody(updateVendorSchema), vendorStoreController.updateStoreInfo);
router.get('/dashboard', vendorStoreController.getDashboardStats);

// Product management routes
router.get('/products', validateQuery(productQuerySchema), vendorProductsController.getVendorProducts);
router.get('/products/:id', validateParams({ id: uuidSchema }), vendorProductsController.getVendorProductById);
router.post('/products', validateBody(createProductSchema), vendorProductsController.createProduct);
router.put('/products/:id', validateParams({ id: uuidSchema }), validateBody(updateProductSchema), vendorProductsController.updateProduct);
router.delete('/products/:id', validateParams({ id: uuidSchema }), vendorProductsController.deleteProduct);

module.exports = router;
