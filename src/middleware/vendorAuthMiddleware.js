const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { error } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate vendor JWT tokens
 */
const authenticateVendor = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, 'Access token is required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return error(res, 'Access token has expired. Please refresh your token.', 401);
      } else if (jwtError.name === 'JsonWebTokenError') {
        return error(res, 'Invalid access token', 401);
      } else {
        throw jwtError;
      }
    }

    // Check if token is for vendor
    if (decoded.type !== 'vendor') {
      return error(res, 'Invalid token type', 401);
    }

    // Get vendor from database to verify they still exist and are active
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('id, email, business_name, contact_person_name, status')
      .eq('id', decoded.id)
      .single();

    if (fetchError || !vendor) {
      logger.warn(`Token verification failed - vendor not found: ${decoded.email}`);
      return error(res, 'Invalid access token - vendor not found', 401);
    }

    // Check if vendor account is active
    if (vendor.status !== 'active') {
      logger.warn(`Token verification failed - vendor account ${vendor.status}: ${vendor.email}`);
      
      if (vendor.status === 'pending') {
        return error(res, 'Your vendor account is pending approval', 403);
      } else if (vendor.status === 'suspended') {
        return error(res, 'Your vendor account has been suspended', 403);
      } else {
        return error(res, 'Your vendor account is not active', 403);
      }
    }

    // Attach vendor data to request object for use in route handlers
    req.vendor = {
      id: vendor.id,
      email: vendor.email,
      businessName: vendor.business_name,
      contactPersonName: vendor.contact_person_name,
      status: vendor.status
    };

    next();

  } catch (err) {
    logger.error('Vendor authentication middleware error:', err);
    return error(res, 'Authentication failed', 500);
  }
};

/**
 * Optional vendor authentication middleware
 * Attaches vendor data if valid token is provided, but doesn't fail if no token
 */
const optionalVendorAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // No token provided, continue without authentication
      return next();
    }

    const token = authHeader.substring(7);

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Invalid token, continue without authentication
      return next();
    }

    // Check if token is for vendor
    if (decoded.type !== 'vendor') {
      return next();
    }

    // Get vendor from database
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('id, email, business_name, contact_person_name, status')
      .eq('id', decoded.id)
      .single();

    if (!fetchError && vendor && vendor.status === 'active') {
      // Attach vendor data to request object
      req.vendor = {
        id: vendor.id,
        email: vendor.email,
        businessName: vendor.business_name,
        contactPersonName: vendor.contact_person_name,
        status: vendor.status
      };
    }

    next();

  } catch (err) {
    logger.error('Optional vendor authentication middleware error:', err);
    // Continue without authentication on error
    next();
  }
};

module.exports = {
  authenticateVendor,
  optionalVendorAuth
};
