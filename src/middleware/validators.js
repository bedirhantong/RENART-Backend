const { validateBody } = require('./validate');
const { vendorRegisterSchema, vendorLoginSchema } = require('../validators/schemas');

// Vendor registration validation middleware
const validateVendorRegistration = (req, res, next) => {
  return validateBody(vendorRegisterSchema)(req, res, next);
};

// Vendor login validation middleware
const validateVendorLogin = (req, res, next) => {
  return validateBody(vendorLoginSchema)(req, res, next);
};

module.exports = {
  validateVendorRegistration,
  validateVendorLogin
};
