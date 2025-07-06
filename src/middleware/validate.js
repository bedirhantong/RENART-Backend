const { validationError } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Validation middleware factory
 * @param {object} schema - Zod schema
 * @param {string} source - Source of data to validate ('body', 'query', 'params')
 * @returns {function} Validation middleware
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      let dataToValidate;
      
      switch (source) {
        case 'body':
          dataToValidate = req.body;
          break;
        case 'query':
          dataToValidate = req.query;
          break;
        case 'params':
          dataToValidate = req.params;
          break;
        default:
          dataToValidate = req.body;
      }

      const result = schema.safeParse(dataToValidate);
      
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message
        }));
        
        logger.warn('Validation failed:', errors);
        return validationError(res, 'Validation failed', errors);
      }

      // Replace the original data with the validated and transformed data
      if (source === 'body') {
        req.body = result.data;
      } else if (source === 'query') {
        req.query = result.data;
      } else if (source === 'params') {
        req.params = result.data;
      }

      next();
    } catch (error) {
      logger.error('Validation middleware error:', error);
      return validationError(res, 'Validation error occurred');
    }
  };
};

/**
 * Validate request body
 * @param {object} schema - Zod schema
 * @returns {function} Validation middleware
 */
const validateBody = (schema) => validate(schema, 'body');

/**
 * Validate query parameters
 * @param {object} schema - Zod schema
 * @returns {function} Validation middleware
 */
const validateQuery = (schema) => validate(schema, 'query');

/**
 * Validate route parameters
 * @param {object} schema - Zod schema
 * @returns {function} Validation middleware
 */
const validateParams = (schema) => validate(schema, 'params');

module.exports = {
  validate,
  validateBody,
  validateQuery,
  validateParams
};
