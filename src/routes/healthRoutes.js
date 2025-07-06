const express = require('express');
const router = express.Router();

// Controllers
const healthController = require('../controllers/healthController');

// Health check routes
router.get('/health', healthController.healthCheck);
router.get('/system', healthController.systemInfo);

module.exports = router;
