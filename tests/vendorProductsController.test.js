const vendorProductsController = require('../src/controllers/vendorProductsController');
const logger = require('../src/utils/logger');
const vendorProductsService = require('../src/services/vendorProductsService');

// Mock dependencies
jest.mock('../src/utils/logger');
jest.mock('../src/services/vendorProductsService');

describe('Vendor Products Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      query: {},
      user: { id: 'vendor-123' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    jest.clearAllMocks();
  });

  describe('getVendorProducts', () => {
    it('should return products successfully with pagination', async () => {
      const mockProducts = [
        { id: 1, name: 'Gold Ring', price: 500 },
        { id: 2, name: 'Silver Necklace', price: 300 }
      ];
      
      req.query = { page: '1', limit: '10' };
      vendorProductsService.getVendorProducts.mockResolvedValue({
        products: mockProducts,
        totalCount: 25,
        totalPages: 3,
        currentPage: 1
      });

      await vendorProductsController.getVendorProducts(req, res);

      expect(vendorProductsService.getVendorProducts).toHaveBeenCalledWith(
        'vendor-123', 1, 10, undefined
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: {
          products: mockProducts,
          pagination: {
            totalCount: 25,
            totalPages: 3,
            currentPage: 1,
            hasNextPage: true,
            hasPreviousPage: false
          }
        },
        data: null
      });
    });

    it('should handle search query', async () => {
      req.query = { page: '1', limit: '10', search: 'ring' };
      vendorProductsService.getVendorProducts.mockResolvedValue({
        products: [],
        totalCount: 0,
        totalPages: 0,
        currentPage: 1
      });

      await vendorProductsController.getVendorProducts(req, res);

      expect(vendorProductsService.getVendorProducts).toHaveBeenCalledWith(
        'vendor-123', 1, 10, 'ring'
      );
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      vendorProductsService.getVendorProducts.mockRejectedValue(error);

      await vendorProductsController.getVendorProducts(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error fetching vendor products:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch products',
        data: null
      });
    });
  });

  describe('getVendorProductById', () => {
    it('should return product successfully', async () => {
      const mockProduct = { id: 1, name: 'Gold Ring', price: 500 };
      req.params.id = '1';
      vendorProductsService.getVendorProductById.mockResolvedValue(mockProduct);

      await vendorProductsController.getVendorProductById(req, res);

      expect(vendorProductsService.getVendorProductById).toHaveBeenCalledWith(
        'vendor-123', '1'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: mockProduct,
        data: null
      });
    });

    it('should handle product not found', async () => {
      req.params.id = '999';
      vendorProductsService.getVendorProductById.mockResolvedValue(null);

      await vendorProductsController.getVendorProductById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      req.params.id = '1';
      vendorProductsService.getVendorProductById.mockRejectedValue(error);

      await vendorProductsController.getVendorProductById(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error fetching vendor product by ID:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch product',
        data: null
      });
    });
  });

  describe('createVendorProduct', () => {
    it('should create product successfully', async () => {
      const productData = {
        name: 'Diamond Ring',
        description: 'Beautiful diamond ring',
        category: 'rings',
        price: 1000,
        stock_quantity: 5
      };
      const mockCreatedProduct = { id: 3, ...productData };
      
      req.body = productData;
      vendorProductsService.createVendorProduct.mockResolvedValue(mockCreatedProduct);

      await vendorProductsController.createVendorProduct(req, res);

      expect(vendorProductsService.createVendorProduct).toHaveBeenCalledWith(
        'vendor-123', productData
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product created successfully',
        data: mockCreatedProduct
      });
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      error.code = '23502'; // PostgreSQL not null violation
      req.body = { name: 'Invalid Product' };
      vendorProductsService.createVendorProduct.mockRejectedValue(error);

      await vendorProductsController.createVendorProduct(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error creating vendor product:', error);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid product data',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      req.body = { name: 'Test Product' };
      vendorProductsService.createVendorProduct.mockRejectedValue(error);

      await vendorProductsController.createVendorProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to create product',
        data: null
      });
    });
  });

  describe('updateVendorProduct', () => {
    it('should update product successfully', async () => {
      const productData = { name: 'Updated Ring', price: 600 };
      const mockUpdatedProduct = { id: 1, ...productData };
      
      req.params.id = '1';
      req.body = productData;
      vendorProductsService.updateVendorProduct.mockResolvedValue(mockUpdatedProduct);

      await vendorProductsController.updateVendorProduct(req, res);

      expect(vendorProductsService.updateVendorProduct).toHaveBeenCalledWith(
        'vendor-123', '1', productData
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product updated successfully',
        data: mockUpdatedProduct
      });
    });

    it('should handle product not found', async () => {
      req.params.id = '999';
      req.body = { name: 'Updated Ring' };
      vendorProductsService.updateVendorProduct.mockResolvedValue(null);

      await vendorProductsController.updateVendorProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found or unauthorized',
        data: null
      });
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      error.code = '23502';
      req.params.id = '1';
      req.body = { price: 'invalid' };
      vendorProductsService.updateVendorProduct.mockRejectedValue(error);

      await vendorProductsController.updateVendorProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid product data',
        data: null
      });
    });
  });

  describe('deleteVendorProduct', () => {
    it('should delete product successfully', async () => {
      req.params.id = '1';
      vendorProductsService.deleteVendorProduct.mockResolvedValue(true);

      await vendorProductsController.deleteVendorProduct(req, res);

      expect(vendorProductsService.deleteVendorProduct).toHaveBeenCalledWith(
        'vendor-123', '1'
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Product deleted successfully',
        data: null
      });
    });

    it('should handle product not found', async () => {
      req.params.id = '999';
      vendorProductsService.deleteVendorProduct.mockResolvedValue(false);

      await vendorProductsController.deleteVendorProduct(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Product not found or unauthorized',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      req.params.id = '1';
      vendorProductsService.deleteVendorProduct.mockRejectedValue(error);

      await vendorProductsController.deleteVendorProduct(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error deleting vendor product:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to delete product',
        data: null
      });
    });
  });
});
