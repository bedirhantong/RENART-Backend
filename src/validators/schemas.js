const { z } = require('zod');

// Auth schemas
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required')
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').optional(),
  lastName: z.string().min(1, 'Last name is required').optional()
});

// Product schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  weight: z.number().positive('Weight must be a positive number'),
  popularityScore: z.number().min(0).max(10, 'Popularity score must be between 0 and 10'),
  isActive: z.boolean().optional().default(true),
  colors: z.array(z.enum(['yellow', 'white', 'rose'])).min(1, 'At least one color is required')
});

const updateProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').optional(),
  weight: z.number().positive('Weight must be a positive number').optional(),
  popularityScore: z.number().min(0).max(10, 'Popularity score must be between 0 and 10').optional(),
  isActive: z.boolean().optional(),
  colors: z.array(z.enum(['yellow', 'white', 'rose'])).min(1, 'At least one color is required').optional()
});

// Vendor schemas
const updateVendorSchema = z.object({
  name: z.string().min(1, 'Vendor name is required').optional(),
  description: z.string().optional(),
  logoUrl: z.string().url('Invalid logo URL').optional().nullable()
});

// Vendor auth schemas
const vendorRegisterSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  businessName: z.string().min(1, 'Business name is required'),
  businessType: z.string().min(1, 'Business type is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactPhone: z.string().min(1, 'Contact phone is required'),
  businessAddress: z.string().min(1, 'Business address is required'),
  taxId: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url('Invalid URL').optional().or(z.literal(''))
});

const vendorLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

// Query schemas
const productQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  color: z.enum(['yellow', 'white', 'rose']).optional(),
  minPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  maxPrice: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  minWeight: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  maxWeight: z.string().regex(/^\d+(\.\d{1,2})?$/).transform(Number).optional(),
  minPopularity: z.string().regex(/^\d+$/).transform(Number).optional(),
  maxPopularity: z.string().regex(/^\d+$/).transform(Number).optional(),
  search: z.string().optional(),
  sortBy: z.enum(['name', 'price', 'weight', 'popularity']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc')
});

// Favorites schema
const addFavoriteSchema = z.object({
  productId: z.string().uuid('Invalid product ID')
});

// UUID validation
const uuidSchema = z.string().uuid('Invalid ID format');

module.exports = {
  loginSchema,
  registerSchema,
  updateProfileSchema,
  createProductSchema,
  updateProductSchema,
  updateVendorSchema,
  vendorRegisterSchema,
  vendorLoginSchema,
  productQuerySchema,
  addFavoriteSchema,
  uuidSchema
};
