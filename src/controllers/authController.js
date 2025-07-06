const supabase = require('../config/supabase');
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
        }
      }
    });

    if (authError) {
      logger.error('Registration error:', authError);
      return error(res, authError.message, 400);
    }

    if (!authData.user) {
      return error(res, 'Registration failed', 400);
    }

    logger.info(`User registered successfully: ${email}`);
    
    return success(res, 'Registration successful. Please check your email for verification.', {
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
      return error(res, 'Invalid credentials', 401);
    }

    if (!authData.user || !authData.session) {
      return error(res, 'Login failed', 401);
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
      expiresAt: authData.session.expires_at
    });

  } catch (err) {
    logger.error('Login error:', err);
    return error(res, 'Login failed', 500);
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
 * Get current user profile
 */
const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    return success(res, 'Profile retrieved successfully', {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.first_name,
      lastName: user.user_metadata?.last_name,
      emailConfirmed: user.email_confirmed_at !== null,
      createdAt: user.created_at
    });

  } catch (err) {
    logger.error('Get profile error:', err);
    return error(res, 'Failed to retrieve profile', 500);
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
  getProfile,
  refreshToken
};
