/**
 * Utility functions for consistent API responses
 */

/**
 * Success response
 * @param {object} res - Express response object
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {number} statusCode - HTTP status code
 * @returns {object} Response object
 */
const success = (res, message = 'Success', data = null, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

/**
 * Error response
 * @param {object} res - Express response object
 * @param {string} message - Error message
 * @param {number} statusCode - HTTP status code
 * @param {any} error - Error details
 * @returns {object} Response object
 */
const error = (res, message = 'Internal Server Error', statusCode = 500, error = null) => {
  const response = {
    success: false,
    message,
    data: null
  };

  // Add helpful hints for common errors
  if (statusCode === 401) {
    response.hint = 'Authentication required. Please login and include the token in Authorization header: Bearer <token>';
  } else if (statusCode === 403) {
    response.hint = 'Access forbidden. You may not have the required permissions for this resource.';
  } else if (statusCode === 404) {
    response.hint = 'Resource not found. Please check the URL and try again.';
  } else if (statusCode === 422) {
    response.hint = 'Invalid request data. Please check the request format and required fields.';
  }

  // Include error details in development environment
  if (process.env.NODE_ENV === 'development' && error) {
    response.error = error;
    response.timestamp = new Date().toISOString();
  }

  return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {object} res - Express response object
 * @param {string} message - Validation error message
 * @param {any} errors - Validation errors
 * @returns {object} Response object
 */
const validationError = (res, message = 'Validation Error', errors = null) => {
  return res.status(400).json({
    success: false,
    message,
    data: null,
    errors
  });
};

module.exports = {
  success,
  error,
  validationError
};
