const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Generate JWT tokens for vendor
 */
const generateVendorTokens = (vendorId, email) => {
  const accessToken = jwt.sign(
    { 
      id: vendorId, 
      email, 
      type: 'vendor' 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { 
      id: vendorId, 
      email, 
      type: 'vendor' 
    },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

/**
 * Register vendor
 */
const registerVendor = asyncHandler(async (req, res) => {
  const { 
    email, 
    password, 
    businessName, 
    businessType,
    contactName, 
    contactPhone, 
    businessAddress,
    taxId,
    description,
    website
  } = req.body;

  // Validate required fields
  if (!email || !password || !businessName || !contactName) {
    return error(res, 'Email, password, business name, and contact name are required', 400);
  }

  try {
    // Check if vendor already exists
    const { data: existingVendor, error: checkError } = await supabase
      .from('vendors')
      .select('id, email')
      .eq('email', email)
      .single();

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows returned
      logger.error('Error checking existing vendor:', checkError);
      return error(res, 'Registration failed. Please try again.', 500);
    }

    if (existingVendor) {
      return error(res, 'A vendor account with this email already exists. Please try logging in instead.', 409);
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new vendor
    const { data: newVendor, error: insertError } = await supabase
      .from('vendors')
      .insert([
        {
          email,
          password_hash: hashedPassword,
          business_name: businessName,
          contact_person_name: contactName,
          phone_number: contactPhone,
          business_address: businessAddress,
          business_type: businessType,
          tax_id: taxId,
          description: description,
          website: website,
          status: 'active', // Auto-approve new vendors
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single();

    if (insertError) {
      logger.error('Error creating vendor:', insertError);
      return error(res, 'Registration failed. Please try again.', 500);
    }

    logger.info(`Vendor registered successfully: ${email}`);

    // Return success without sensitive data
    return success(res, {
      message: 'Vendor registration successful! Your account is now active.',
      vendor: {
        id: newVendor.id,
        email: newVendor.email,
        businessName: newVendor.business_name,
        contactPersonName: newVendor.contact_person_name,
        status: newVendor.status
      }
    }, 201);

  } catch (err) {
    logger.error('Unexpected vendor registration error:', err);
    return error(res, 'An unexpected error occurred during registration.', 500);
  }
});

/**
 * Login vendor
 */
const loginVendor = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return error(res, 'Email and password are required', 400);
  }

  try {
    // Get vendor from database
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('*')
      .eq('email', email)
      .single();

    if (fetchError || !vendor) {
      logger.warn(`Login attempt for non-existent vendor: ${email}`);
      return error(res, 'Invalid email or password. Please check your credentials and try again.', 401);
    }

    // Check if vendor account is active
    if (vendor.status !== 'active') {
      logger.warn(`Login attempt for ${vendor.status} vendor account: ${email}`);
      
      if (vendor.status === 'pending') {
        return error(res, 'Your vendor account is pending approval. Please wait for approval before logging in.', 403);
      } else if (vendor.status === 'suspended') {
        return error(res, 'Your vendor account has been suspended. Please contact support for assistance.', 403);
      } else {
        return error(res, 'Your vendor account is not active. Please contact support for assistance.', 403);
      }
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, vendor.password_hash);
    if (!isPasswordValid) {
      logger.warn(`Invalid password attempt for vendor: ${email}`);
      return error(res, 'Invalid email or password. Please check your credentials and try again.', 401);
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateVendorTokens(vendor.id, vendor.email);

    // Update last login
    await supabase
      .from('vendors')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', vendor.id);

    logger.info(`Vendor logged in successfully: ${email}`);

    return success(res, {
      message: 'Login successful',
      vendor: {
        id: vendor.id,
        email: vendor.email,
        businessName: vendor.business_name,
        contactPersonName: vendor.contact_person_name,
        phoneNumber: vendor.phone_number,
        businessAddress: vendor.business_address,
        businessType: vendor.business_type,
        status: vendor.status
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '1h'
      }
    });

  } catch (err) {
    logger.error('Unexpected vendor login error:', err);
    return error(res, 'An unexpected error occurred during login.', 500);
  }
});

/**
 * Logout vendor
 */
const logoutVendor = asyncHandler(async (req, res) => {
  try {
    // For JWT-based auth, logout is typically handled client-side by removing the token
    // We could implement a token blacklist here if needed
    
    logger.info(`Vendor logged out: ${req.vendor?.email}`);
    return success(res, { message: 'Logout successful' });

  } catch (err) {
    logger.error('Unexpected vendor logout error:', err);
    return error(res, 'An unexpected error occurred during logout.', 500);
  }
});

/**
 * Refresh vendor token
 */
const refreshVendorToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return error(res, 'Refresh token is required', 400);
  }

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    if (decoded.type !== 'vendor') {
      return error(res, 'Invalid token type', 401);
    }

    // Check if vendor still exists and is active
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('id, email, status')
      .eq('id', decoded.id)
      .single();

    if (fetchError || !vendor) {
      logger.warn(`Refresh token attempt for non-existent vendor: ${decoded.email}`);
      return error(res, 'Token refresh failed. Please login again.', 401);
    }

    if (vendor.status !== 'active') {
      logger.warn(`Refresh token attempt for ${vendor.status} vendor: ${vendor.email}`);
      return error(res, 'Token refresh failed. Account is not active.', 401);
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateVendorTokens(vendor.id, vendor.email);

    logger.info(`Vendor token refreshed successfully: ${vendor.email}`);

    return success(res, {
      message: 'Token refreshed successfully',
      tokens: {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: '1h'
      }
    });

  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      logger.warn('Invalid or expired refresh token:', err.message);
      return error(res, 'Token refresh failed. Please login again.', 401);
    }
    
    logger.error('Unexpected token refresh error:', err);
    return error(res, 'An unexpected error occurred during token refresh.', 500);
  }
});

/**
 * Change vendor password
 */
const changeVendorPassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const vendorId = req.vendor.id;

  if (!currentPassword || !newPassword) {
    return error(res, 'Current password and new password are required', 400);
  }

  if (newPassword.length < 6) {
    return error(res, 'New password must be at least 6 characters long', 400);
  }

  try {
    // Get current vendor data
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('password_hash')
      .eq('id', vendorId)
      .single();

    if (fetchError || !vendor) {
      return error(res, 'Vendor not found', 404);
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, vendor.password_hash);
    if (!isCurrentPasswordValid) {
      return error(res, 'Current password is incorrect', 401);
    }

    // Hash new password
    const saltRounds = 12;
    const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password in database
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ 
        password_hash: hashedNewPassword,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendorId);

    if (updateError) {
      logger.error('Error updating vendor password:', updateError);
      return error(res, 'Password change failed. Please try again.', 500);
    }

    logger.info(`Vendor password changed successfully: ${req.vendor.email}`);
    return success(res, { message: 'Password changed successfully' });

  } catch (err) {
    logger.error('Unexpected password change error:', err);
    return error(res, 'An unexpected error occurred during password change.', 500);
  }
});

/**
 * Forgot vendor password (stub implementation)
 * TODO: Implement email-based password reset functionality
 */
const forgotVendorPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return error(res, 'Email is required', 400);
  }

  try {
    // Check if vendor exists
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('id, email')
      .eq('email', email)
      .single();

    // Always return success for security (don't reveal if email exists)
    logger.info(`Password reset requested for vendor email: ${email}`);
    
    return success(res, {
      message: 'If a vendor account with that email exists, password reset instructions have been sent.'
    });

  } catch (err) {
    logger.error('Unexpected forgot password error:', err);
    return error(res, 'An unexpected error occurred. Please try again.', 500);
  }
});

/**
 * Reset vendor password (stub implementation)
 * TODO: Implement token-based password reset functionality
 */
const resetVendorPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    return error(res, 'Reset token and new password are required', 400);
  }

  if (newPassword.length < 6) {
    return error(res, 'New password must be at least 6 characters long', 400);
  }

  try {
    // TODO: Implement token verification and password reset logic
    logger.warn('Password reset attempted but not yet implemented');
    
    return error(res, 'Password reset functionality is not yet implemented. Please contact support.', 501);

  } catch (err) {
    logger.error('Unexpected reset password error:', err);
    return error(res, 'An unexpected error occurred. Please try again.', 500);
  }
});

module.exports = {
  registerVendor,
  loginVendor,
  logoutVendor,
  refreshVendorToken,
  changeVendorPassword,
  forgotVendorPassword,
  resetVendorPassword
};
