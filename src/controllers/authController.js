const { supabase, supabaseAdmin } = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Register user
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        }
      }
    });

    if (authError) {
      logger.error('Registration error:', authError);
      
      // Handle specific Supabase registration errors
      if (authError.message.includes('User already registered')) {
        return error(res, 'An account with this email already exists. Please try logging in instead.', 409);
      } else if (authError.message.includes('Invalid email')) {
        return error(res, 'Please provide a valid email address.', 400);
      } else if (authError.message.includes('Password should be at least')) {
        return error(res, 'Password must be at least 6 characters long.', 400);
      } else {
        return error(res, 'Registration failed. Please try again.', 500);
      }
    }

    // If user signup was successful
    if (authData.user) {
      logger.info(`User registered successfully: ${authData.user.email}`);
      
      // Auto-confirm user if email confirmation is enabled but we don't want it
      if (!authData.user.email_confirmed_at && supabaseAdmin) {
        try {
          logger.info(`Auto-confirming user: ${authData.user.email}`);
          const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
            authData.user.id,
            {
              email_confirmed_at: new Date().toISOString()
            }
          );
          
          if (confirmError) {
            logger.warn('Failed to auto-confirm user:', confirmError);
          } else {
            logger.info(`User auto-confirmed: ${authData.user.email}`);
          }
        } catch (confirmErr) {
          logger.warn('Error during auto-confirmation:', confirmErr);
        }
      }
      
      return success(res, {
        message: 'Registration successful! You can now login.',
        user: {
          id: authData.user.id,
          email: authData.user.email,
          firstName: authData.user.user_metadata.first_name,
          lastName: authData.user.user_metadata.last_name,
          emailVerified: authData.user.email_confirmed_at ? true : false
        }
      }, 201);
    }
  } catch (err) {
    logger.error('Unexpected registration error:', err);
    return error(res, 'An unexpected error occurred during registration.', 500);
  }
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      logger.error('Login error:', authError);
      
      // Handle specific Supabase login errors
      if (authError.message.includes('Invalid login credentials')) {
        return error(res, 'Invalid email or password. Please check your credentials and try again.', 401);
      } else if (authError.message.includes('Email not confirmed')) {
        return error(res, 'Please verify your email address before logging in.', 401);
      } else if (authError.message.includes('Account not found')) {
        return error(res, 'No account found with this email address. Please register first.', 404);
      } else if (authError.message.includes('Too many requests')) {
        return error(res, 'Too many login attempts. Please wait a moment before trying again.', 429);
      } else {
        return error(res, 'Login failed. Please try again.', 500);
      }
    }

    if (data.user && data.session) {
      logger.info(`User logged in successfully: ${data.user.email}`);
      return success(res, {
        message: 'Login successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          firstName: data.user.user_metadata.first_name,
          lastName: data.user.user_metadata.last_name,
          emailVerified: data.user.email_confirmed_at ? true : false
        },
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });
    }
  } catch (err) {
    logger.error('Unexpected login error:', err);
    return error(res, 'An unexpected error occurred during login.', 500);
  }
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  try {
    const { error: signOutError } = await supabase.auth.signOut();
    
    if (signOutError) {
      logger.error('Logout error:', signOutError);
      return error(res, 'Logout failed. Please try again.', 500);
    }

    logger.info('User logged out successfully');
    return success(res, { message: 'Logout successful' });
  } catch (err) {
    logger.error('Unexpected logout error:', err);
    return error(res, 'An unexpected error occurred during logout.', 500);
  }
});

/**
 * Refresh token
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return error(res, 'Refresh token is required', 400);
  }

  try {
    const { data, error: refreshError } = await supabase.auth.refreshSession({
      refresh_token
    });

    if (refreshError) {
      logger.error('Token refresh error:', refreshError);
      return error(res, 'Token refresh failed. Please login again.', 401);
    }

    if (data.session) {
      logger.info('Token refreshed successfully');
      return success(res, {
        message: 'Token refreshed successfully',
        session: {
          access_token: data.session.access_token,
          refresh_token: data.session.refresh_token,
          expires_at: data.session.expires_at
        }
      });
    }
  } catch (err) {
    logger.error('Unexpected token refresh error:', err);
    return error(res, 'An unexpected error occurred during token refresh.', 500);
  }
});

module.exports = {
  register,
  login,
  logout,
  refreshToken
};
