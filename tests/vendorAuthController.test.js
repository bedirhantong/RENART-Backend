const vendorAuthController = require('../src/controllers/vendorAuthController');
const logger = require('../src/utils/logger');
const vendorAuthService = require('../src/services/vendorAuthService');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../src/utils/logger');
jest.mock('../src/services/vendorAuthService');
jest.mock('express-validator');

describe('Vendor Auth Controller', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      clearCookie: jest.fn()
    };
    jest.clearAllMocks();
    
    // Mock validation result to return no errors by default
    validationResult.mockReturnValue({
      isEmpty: () => true,
      array: () => []
    });
  });

  describe('register', () => {
    it('should register a vendor successfully', async () => {
      const vendorData = {
        email: 'vendor@example.com',
        password: 'SecurePass123!',
        business_name: 'Example Jewelry Store',
        contact_person: 'John Doe',
        phone: '+1234567890',
        address: '123 Business St, City, State'
      };
      const mockResponse = {
        vendor: {
          id: 'vendor-123',
          email: 'vendor@example.com',
          business_name: 'Example Jewelry Store',
          contact_person: 'John Doe',
          phone: '+1234567890',
          address: '123 Business St, City, State',
          is_verified: false,
          status: 'pending',
          created_at: '2024-01-01T00:00:00Z'
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      };

      req.body = vendorData;
      vendorAuthService.registerVendor.mockResolvedValue(mockResponse);

      await vendorAuthController.register(req, res);

      expect(vendorAuthService.registerVendor).toHaveBeenCalledWith(vendorData);
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token-123', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Vendor registered successfully',
        data: {
          vendor: mockResponse.vendor,
          accessToken: mockResponse.accessToken
        }
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { msg: 'Email is required', param: 'email' },
          { msg: 'Password must be at least 8 characters', param: 'password' }
        ]
      });

      await vendorAuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        data: [
          { msg: 'Email is required', param: 'email' },
          { msg: 'Password must be at least 8 characters', param: 'password' }
        ]
      });
    });

    it('should handle duplicate email error', async () => {
      const error = new Error('Email already exists');
      error.code = '23505'; // PostgreSQL unique violation
      req.body = { email: 'existing@example.com', password: 'password123' };
      vendorAuthService.registerVendor.mockRejectedValue(error);

      await vendorAuthController.register(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email already registered',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      req.body = { email: 'vendor@example.com', password: 'password123' };
      vendorAuthService.registerVendor.mockRejectedValue(error);

      await vendorAuthController.register(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error registering vendor:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Registration failed',
        data: null
      });
    });
  });

  describe('login', () => {
    it('should login vendor successfully', async () => {
      const loginData = {
        email: 'vendor@example.com',
        password: 'SecurePass123!'
      };
      const mockResponse = {
        vendor: {
          id: 'vendor-123',
          email: 'vendor@example.com',
          business_name: 'Example Jewelry Store',
          is_verified: true,
          status: 'active'
        },
        accessToken: 'access-token-123',
        refreshToken: 'refresh-token-123'
      };

      req.body = loginData;
      vendorAuthService.loginVendor.mockResolvedValue(mockResponse);

      await vendorAuthController.login(req, res);

      expect(vendorAuthService.loginVendor).toHaveBeenCalledWith(
        loginData.email, 
        loginData.password
      );
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-token-123', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Login successful',
        data: {
          vendor: mockResponse.vendor,
          accessToken: mockResponse.accessToken
        }
      });
    });

    it('should handle invalid credentials', async () => {
      const error = new Error('Invalid credentials');
      req.body = { email: 'vendor@example.com', password: 'wrongpassword' };
      vendorAuthService.loginVendor.mockRejectedValue(error);

      await vendorAuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    });

    it('should handle inactive vendor account', async () => {
      const error = new Error('Account is inactive');
      req.body = { email: 'vendor@example.com', password: 'password123' };
      vendorAuthService.loginVendor.mockRejectedValue(error);

      await vendorAuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
        data: null
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { msg: 'Email is required', param: 'email' }
        ]
      });

      await vendorAuthController.login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        data: [{ msg: 'Email is required', param: 'email' }]
      });
    });
  });

  describe('logout', () => {
    it('should logout vendor successfully', async () => {
      req.user = { id: 'vendor-123' };
      vendorAuthService.logoutVendor.mockResolvedValue(true);

      await vendorAuthController.logout(req, res);

      expect(vendorAuthService.logoutVendor).toHaveBeenCalledWith('vendor-123');
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
        data: null
      });
    });

    it('should handle service errors during logout', async () => {
      const error = new Error('Database error');
      req.user = { id: 'vendor-123' };
      vendorAuthService.logoutVendor.mockRejectedValue(error);

      await vendorAuthController.logout(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error logging out vendor:', error);
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
        data: null
      });
    });

    it('should handle missing user', async () => {
      req.user = null;

      await vendorAuthController.logout(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully',
        data: null
      });
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const mockResponse = {
        vendor: {
          id: 'vendor-123',
          email: 'vendor@example.com',
          business_name: 'Example Jewelry Store'
        },
        accessToken: 'new-access-token-123',
        refreshToken: 'new-refresh-token-123'
      };

      req.cookies = { refreshToken: 'old-refresh-token' };
      vendorAuthService.refreshToken.mockResolvedValue(mockResponse);

      await vendorAuthController.refreshToken(req, res);

      expect(vendorAuthService.refreshToken).toHaveBeenCalledWith('old-refresh-token');
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'new-refresh-token-123', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Token refreshed successfully',
        data: {
          vendor: mockResponse.vendor,
          accessToken: mockResponse.accessToken
        }
      });
    });

    it('should handle missing refresh token', async () => {
      req.cookies = {};

      await vendorAuthController.refreshToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Refresh token required',
        data: null
      });
    });

    it('should handle invalid refresh token', async () => {
      const error = new Error('Invalid refresh token');
      req.cookies = { refreshToken: 'invalid-token' };
      vendorAuthService.refreshToken.mockRejectedValue(error);

      await vendorAuthController.refreshToken(req, res);

      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid or expired refresh token',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database connection failed');
      req.cookies = { refreshToken: 'valid-token' };
      vendorAuthService.refreshToken.mockRejectedValue(error);

      await vendorAuthController.refreshToken(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error refreshing token:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token refresh failed',
        data: null
      });
    });
  });

  describe('getProfile', () => {
    it('should get vendor profile successfully', async () => {
      const mockVendor = {
        id: 'vendor-123',
        email: 'vendor@example.com',
        business_name: 'Example Jewelry Store',
        contact_person: 'John Doe',
        phone: '+1234567890',
        address: '123 Business St, City, State',
        is_verified: true,
        status: 'active',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z'
      };

      req.user = { id: 'vendor-123' };
      vendorAuthService.getVendorProfile.mockResolvedValue(mockVendor);

      await vendorAuthController.getProfile(req, res);

      expect(vendorAuthService.getVendorProfile).toHaveBeenCalledWith('vendor-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: mockVendor,
        data: null
      });
    });

    it('should handle vendor not found', async () => {
      req.user = { id: 'vendor-123' };
      vendorAuthService.getVendorProfile.mockResolvedValue(null);

      await vendorAuthController.getProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Vendor not found',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      req.user = { id: 'vendor-123' };
      vendorAuthService.getVendorProfile.mockRejectedValue(error);

      await vendorAuthController.getProfile(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error fetching vendor profile:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to fetch profile',
        data: null
      });
    });
  });

  describe('updateProfile', () => {
    it('should update vendor profile successfully', async () => {
      const updateData = {
        business_name: 'Updated Jewelry Store',
        contact_person: 'Jane Doe',
        phone: '+9876543210'
      };
      const mockUpdatedVendor = {
        id: 'vendor-123',
        email: 'vendor@example.com',
        ...updateData,
        updated_at: '2024-01-02T00:00:00Z'
      };

      req.user = { id: 'vendor-123' };
      req.body = updateData;
      vendorAuthService.updateVendorProfile.mockResolvedValue(mockUpdatedVendor);

      await vendorAuthController.updateProfile(req, res);

      expect(vendorAuthService.updateVendorProfile).toHaveBeenCalledWith(
        'vendor-123', updateData
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Profile updated successfully',
        data: mockUpdatedVendor
      });
    });

    it('should handle validation errors', async () => {
      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => [
          { msg: 'Business name is required', param: 'business_name' }
        ]
      });

      await vendorAuthController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        data: [{ msg: 'Business name is required', param: 'business_name' }]
      });
    });

    it('should handle vendor not found', async () => {
      req.user = { id: 'vendor-123' };
      req.body = { business_name: 'Updated Store' };
      vendorAuthService.updateVendorProfile.mockResolvedValue(null);

      await vendorAuthController.updateProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Vendor not found',
        data: null
      });
    });

    it('should handle service errors', async () => {
      const error = new Error('Database error');
      req.user = { id: 'vendor-123' };
      req.body = { business_name: 'Updated Store' };
      vendorAuthService.updateVendorProfile.mockRejectedValue(error);

      await vendorAuthController.updateProfile(req, res);

      expect(logger.error).toHaveBeenCalledWith('Error updating vendor profile:', error);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Failed to update profile',
        data: null
      });
    });
  });
});
