const express = require('express');
const router = express.Router();

// Import route modules
const publicRoutes = require('./publicRoutes');
const vendorRoutes = require('./vendorRoutes');
const vendorAuthRoutes = require('./vendorAuthRoutes');
const healthRoutes = require('./healthRoutes');

// API v1 routes
router.use('/api/v1/public', publicRoutes);
router.use('/api/v1/vendor', vendorRoutes);
router.use('/api/v1/vendor-auth', vendorAuthRoutes);

// Health and system routes (no versioning)
router.use('/api', healthRoutes);

// API documentation route (will be added when we create Swagger config)
router.get('/api', (req, res) => {
  res.json({
    message: 'RENART API',
    version: '1.0.0',
    documentation: '/api-docs',
    endpoints: {
      public: '/api/v1/public',
      vendor: '/api/v1/vendor',
      health: '/api/health',
      system: '/api/system'
    }
  });
});

module.exports = router;
