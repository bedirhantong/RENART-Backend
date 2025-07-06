const express = require('express');
const vendorAuthController = require('../controllers/vendorAuthController');
const { validateVendorRegistration, validateVendorLogin } = require('../middleware/validators');
const { authenticateVendor } = require('../middleware/vendorAuthMiddleware');

const router = express.Router();

/**
 * @swagger
 * /api/v1/vendor-auth/register:
 *   post:
 *     summary: Register a new vendor account
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - businessName
 *               - businessType
 *               - contactName
 *               - contactPhone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               businessName:
 *                 type: string
 *               businessType:
 *                 type: string
 *                 enum: [artist, gallery, craft_maker, other]
 *               contactName:
 *                 type: string
 *               contactPhone:
 *                 type: string
 *               businessAddress:
 *                 type: string
 *               description:
 *                 type: string
 *               website:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Email already exists
 */
router.post('/register', validateVendorRegistration, vendorAuthController.registerVendor);

/**
 * @swagger
 * /api/v1/vendor-auth/login:
 *   post:
 *     summary: Login vendor account
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Invalid credentials
 *       401:
 *         description: Account not verified or suspended
 *       404:
 *         description: Vendor not found
 */
router.post('/login', validateVendorLogin, vendorAuthController.loginVendor);

/**
 * @swagger
 * /api/v1/vendor-auth/logout:
 *   post:
 *     summary: Logout vendor account
 *     tags: [Vendor Authentication]
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', vendorAuthController.logoutVendor);

/**
 * @swagger
 * /api/v1/vendor-auth/refresh:
 *   post:
 *     summary: Refresh vendor access token
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       400:
 *         description: Invalid refresh token
 *       401:
 *         description: Refresh token expired
 */
router.post('/refresh', vendorAuthController.refreshVendorToken);

/**
 * @swagger
 * /api/v1/vendor-auth/change-password:
 *   post:
 *     summary: Change vendor password
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Invalid current password
 *       401:
 *         description: Authentication required
 */
router.post('/change-password', authenticateVendor, vendorAuthController.changeVendorPassword);

/**
 * @swagger
 * /api/v1/vendor-auth/forgot-password:
 *   post:
 *     summary: Request password reset for vendor account
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       404:
 *         description: Vendor not found
 */
router.post('/forgot-password', vendorAuthController.forgotVendorPassword);

/**
 * @swagger
 * /api/v1/vendor-auth/reset-password:
 *   post:
 *     summary: Reset vendor password using reset token
 *     tags: [Vendor Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - newPassword
 *             properties:
 *               token:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired reset token
 */
router.post('/reset-password', vendorAuthController.resetVendorPassword);

module.exports = router;
