const { supabase } = require('../config/supabase');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Authentication middleware for protecting routes
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return error(res, 'Authorization header missing. Please include Authorization header with Bearer token.', 401);
    }
    
    if (!authHeader.startsWith('Bearer ')) {
      return error(res, 'Invalid authorization format. Use: Authorization: Bearer <token>', 401);
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return error(res, 'Authentication token missing. Please provide a valid JWT token.', 401);
    }

    // Verify the JWT token with Supabase
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      logger.warn('Authentication failed:', authError?.message || 'Invalid token');
      
      if (authError?.message?.includes('expired')) {
        return error(res, 'Token has expired. Please login again.', 401);
      } else if (authError?.message?.includes('invalid')) {
        return error(res, 'Invalid token format. Please login again.', 401);
      } else {
        return error(res, 'Authentication failed. Please login again.', 401);
      }
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    next();
  } catch (err) {
    logger.error('Authentication middleware error:', err);
    return error(res, 'Authentication failed', 401);
  }
};

/**
 * Vendor-specific authentication middleware
 * Ensures the authenticated user is a vendor
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const authenticateVendor = async (req, res, next) => {
  try {
    // First run the regular authentication
    await authenticate(req, res, async () => {
      // Check if user is a vendor
      const { data: vendor, error: vendorError } = await supabase
        .from('vendors')
        .select('*')
        .eq('email', req.user.email)
        .eq('is_active', true)
        .single();

      if (vendorError || !vendor) {
        logger.warn(`Vendor access denied for user: ${req.user.email}`);
        return error(res, 'Vendor access required. This endpoint is only available for registered vendors.', 403);
      }

      // Add vendor info to request
      req.vendor = vendor;
      next();
    });
  } catch (err) {
    logger.error('Vendor authentication error:', err);
    return error(res, 'Authentication failed', 401);
  }
};

/**
 * Optional authentication middleware
 * Adds user info to request if token is provided, but doesn't require it
 * @param {object} req - Express request object
 * @param {object} res - Express response object
 * @param {function} next - Express next function
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next();
    }

    // Try to verify the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (!authError && user) {
      req.user = user;
      req.token = token;
    }
    
    next();
  } catch (err) {
    logger.warn('Optional auth middleware error:', err);
    // Continue without authentication on error
    next();
  }
};

module.exports = {
  authenticate,
  authenticateVendor,
  optionalAuth
};
