const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Simple test endpoint to check API connectivity
 */
const simpleTest = asyncHandler(async (req, res) => {
  return success(res, 'API is working! 🚀', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
});

/**
 * Test endpoint that requires authentication
 */
const authTest = asyncHandler(async (req, res) => {
  return success(res, 'Authentication successful! 🔐', {
    user: {
      id: req.user.id,
      email: req.user.email
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * Test CORS functionality
 */
const corsTest = asyncHandler(async (req, res) => {
  res.set('Access-Control-Allow-Origin', req.get('Origin') || '*');
  return success(res, 'CORS test successful! 🌐', {
    origin: req.get('Origin'),
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

module.exports = {
  simpleTest,
  authTest,
  corsTest
};
