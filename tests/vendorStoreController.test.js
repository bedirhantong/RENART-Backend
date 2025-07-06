const vendorStoreController = require('../src/controllers/vendorStoreController');
const logger = require('../src/utils/logger');
const vendorStoreService = require('../src/services/vendorStoreService');

// Mock dependencies
jest.mock('../src/utils/logger');
jest.mock('../src/services/vendorStoreService');

describe('Vendor Store Controller', () => {
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

  describe('getVendorStore', () => {
    it('should return store information successfully', async () => {
      const mockStore = {
        id: 1,
        vendor_id: 'vendor-123',
        store_name: 'Elegant Jewelry',
        description: 'Premium jewelry store',
        logo_url: 'https://example.com/logo.jpg',
        banner_url: 'https://example.com/banner.jpg',
        contact_email: 'contact@elegantjewelry.com',
        contact_phone: '+1234567890',
        address: '123 Main St, City, State',
        website_url: 'https://elegantjewelry.com',
        social_links: {
          facebook: 'https://facebook.com/elegantjewelry',
          instagram: 'https://instagram.com/elegantjewelry'
        },
        business_hours: {
          monday: '9:00 AM - 6:00 PM',
          tuesday: '9:00 AM - 6:00 PM'
        },
        shipping_policy: 'Free shipping on orders over $100',
        return_policy: '30-day return policy',
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      vendorStoreService.getVendorStore.mockResolvedValue(mockStore);

      await vendorStoreController.getVendorStore(req, res);

      expect(vendorStoreService.getVendorStore).toHaveBeenCalledWith('vendor-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: mockStore,
        data: null
      });
    });

    it('should handle store not found', async () => {
      vendorStoreService.getVendorStore.mockResolvedValue(null);

      await vendorStoreController.getVendorStore(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Store not found',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      vendorStoreService.getVendorStore.mockRejectedValue(error);

      await vendorStoreController.getVendorStore(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error fetching vendor store:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch store information',
        data: null
      });
    });
  });

  describe('updateVendorStore', () => {
    it('should update store information successfully', async () => {
      const storeData = {
        store_name: 'Updated Jewelry Store',
        description: 'Updated description',
        contact_email: 'newemail@store.com',
        contact_phone: '+9876543210'
      };
      const mockUpdatedStore = {
        id: 1,
        vendor_id: 'vendor-123',
        ...storeData,
        updated_at: '2024-01-02T00:00:00Z'
      };

      req.body = storeData;
      vendorStoreService.updateVendorStore.mockResolvedValue(mockUpdatedStore);

      await vendorStoreController.updateVendorStore(req, res);

      expect(vendorStoreService.updateVendorStore).toHaveBeenCalledWith(
        'vendor-123', storeData
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Store information updated successfully',
        data: mockUpdatedStore
      });
    });

    it('should handle store not found during update', async () => {
      const storeData = { store_name: 'Updated Store' };
      req.body = storeData;
      vendorStoreService.updateVendorStore.mockResolvedValue(null);

      await vendorStoreController.updateVendorStore(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Store not found or unauthorized',
        data: null
      });
    });

    it('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      error.code = '23502'; // PostgreSQL not null violation
      req.body = { contact_email: 'invalid-email' };
      vendorStoreService.updateVendorStore.mockRejectedValue(error);

      await vendorStoreController.updateVendorStore(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error updating vendor store:', error);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid store data',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      req.body = { store_name: 'Test Store' };
      vendorStoreService.updateVendorStore.mockRejectedValue(error);

      await vendorStoreController.updateVendorStore(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update store information',
        data: null
      });
    });
  });

  describe('getVendorDashboard', () => {
    it('should return dashboard statistics successfully', async () => {
      const mockDashboardStats = {
        totalProducts: 45,
        totalOrders: 120,
        totalRevenue: 15750.50,
        pendingOrders: 8,
        lowStockProducts: 3,
        recentOrders: [
          {
            id: 1,
            order_number: 'ORD-001',
            total_amount: 299.99,
            status: 'pending',
            created_at: '2024-01-15T10:30:00Z'
          },
          {
            id: 2,
            order_number: 'ORD-002',
            total_amount: 149.99,
            status: 'completed',
            created_at: '2024-01-14T16:45:00Z'
          }
        ],
        monthlyRevenue: [
          { month: 'Jan', revenue: 5250.25 },
          { month: 'Feb', revenue: 4800.75 },
          { month: 'Mar', revenue: 5699.50 }
        ],
        topProducts: [
          {
            id: 1,
            name: 'Diamond Ring',
            sales_count: 25,
            revenue: 7500.00
          },
          {
            id: 2,
            name: 'Gold Necklace',
            sales_count: 18,
            revenue: 5400.00
          }
        ]
      };

      vendorStoreService.getVendorDashboard.mockResolvedValue(mockDashboardStats);

      await vendorStoreController.getVendorDashboard(req, res);

      expect(vendorStoreService.getVendorDashboard).toHaveBeenCalledWith('vendor-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: mockDashboardStats,
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database query failed');
      vendorStoreService.getVendorDashboard.mockRejectedValue(error);

      await vendorStoreController.getVendorDashboard(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error fetching vendor dashboard:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch dashboard data',
        data: null
      });
    });

    it('should handle empty dashboard data', async () => {
      const emptyDashboardStats = {
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        lowStockProducts: 0,
        recentOrders: [],
        monthlyRevenue: [],
        topProducts: []
      };

      vendorStoreService.getVendorDashboard.mockResolvedValue(emptyDashboardStats);

      await vendorStoreController.getVendorDashboard(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: emptyDashboardStats,
        data: null
      });
    });
  });

  describe('Edge cases and security', () => {
    it('should handle missing user in request', async () => {
      req.user = undefined;

      await vendorStoreController.getVendorStore(req, res);

      // Should fail gracefully - this would typically be caught by auth middleware
      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle invalid vendor ID format', async () => {
      req.user.id = null;

      await vendorStoreController.getVendorStore(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('should handle extremely large store data', async () => {
      const largeStoreData = {
        store_name: 'A'.repeat(1000), // Very long store name
        description: 'B'.repeat(5000), // Very long description
        social_links: {
          facebook: 'https://facebook.com/' + 'c'.repeat(500)
        }
      };

      req.body = largeStoreData;
      const error = new Error('Data too large');
      error.code = '22001'; // PostgreSQL string data too long
      vendorStoreService.updateVendorStore.mockRejectedValue(error);

      await vendorStoreController.updateVendorStore(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid store data',
        data: null
      });
    });
  });
});
