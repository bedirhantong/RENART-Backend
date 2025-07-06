const { supabase, supabaseAdmin } = require('../config/supabase');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Register a new user
 */
const register = asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName } = req.body;

  try {
    // Register with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName
        },
        emailRedirectTo: undefined // Explicitly disable email confirmation redirect
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
      } else if (authError.message.includes('Signup is disabled')) {
        return error(res, 'User registration is currently disabled. Please contact support.', 503);
      } else {
        return error(res, `Registration failed: ${authError.message}`, 400);
      }
    }

    if (!authData.user) {
      return error(res, 'Registration failed', 400);
    }

    logger.info(`User registered successfully: ${email}`);
    
    // Auto-confirm user if email confirmation is enabled but we don't want it
    if (authData.user && !authData.user.email_confirmed_at && supabaseAdmin) {
      try {
        logger.info(`Auto-confirming user: ${email}`);
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
          authData.user.id,
          {
            email_confirmed_at: new Date().toISOString()
          }
        );
        
        if (confirmError) {
          logger.warn('Failed to auto-confirm user:', confirmError);
        } else {
          logger.info(`User auto-confirmed: ${email}`);
        }
      } catch (confirmErr) {
        logger.warn('Error during auto-confirmation:', confirmErr);
      }
    }
    
    return success(res, 'Registration successful. You can now login.', {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName,
        lastName
      }
    }, 201);

  } catch (err) {
    logger.error('Registration error:', err);
    return error(res, 'Registration failed', 500);
  }
});

/**
 * Login user
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      logger.warn(`Login failed for ${email}:`, authError.message);
      
      // Provide more specific error messages
      if (authError.message.includes('Invalid login credentials')) {
        return error(res, 'Invalid email or password. Please check your credentials and try again.', 401);
      } else if (authError.message.includes('Email not confirmed')) {
        // If email confirmation is required but we don't want it, provide a helpful message
        return error(res, 'Account created but requires email confirmation. Since email confirmation is disabled in development, please contact support or try again in a few moments.', 401);
      } else if (authError.message.includes('Account not found')) {
        return error(res, 'No account found with this email address. Please register first.', 404);
      } else if (authError.message.includes('Too many requests')) {
        return error(res, 'Too many login attempts. Please wait a moment before trying again.', 429);
      } else {
        return error(res, `Login failed: ${authError.message}`, 401);
      }
    }

    if (!authData.user || !authData.session) {
      return error(res, 'Login failed: No session created', 401);
    }

    logger.info(`User logged in successfully: ${email}`);

    return success(res, 'Login successful', {
      user: {
        id: authData.user.id,
        email: authData.user.email,
        firstName: authData.user.user_metadata?.first_name,
        lastName: authData.user.user_metadata?.last_name
      },
      token: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      expiresAt: authData.session.expires_at
    });

  } catch (err) {
    logger.error('Login error:', err);
    return error(res, 'Login failed due to server error', 500);
  }
});

/**
 * Logout user
 */
const logout = asyncHandler(async (req, res) => {
  try {
    const { error: logoutError } = await supabase.auth.signOut();

    if (logoutError) {
      logger.error('Logout error:', logoutError);
      return error(res, 'Logout failed', 500);
    }

    logger.info(`User logged out: ${req.user?.email}`);
    return success(res, 'Logout successful');

  } catch (err) {
    logger.error('Logout error:', err);
    return error(res, 'Logout failed', 500);
  }
});


/**
 * Refresh token
 */
const refreshToken = asyncHandler(async (req, res) => {
  try {
    const { data: sessionData, error: refreshError } = await supabase.auth.refreshSession();

    if (refreshError || !sessionData.session) {
      logger.warn('Token refresh failed:', refreshError?.message);
      return error(res, 'Token refresh failed', 401);
    }

    return success(res, 'Token refreshed successfully', {
      token: sessionData.session.access_token,
      expiresAt: sessionData.session.expires_at
    });

  } catch (err) {
    logger.error('Token refresh error:', err);
    return error(res, 'Token refresh failed', 500);
  }
});

module.exports = {
  register,
  login,
  logout,
  refreshToken
};
