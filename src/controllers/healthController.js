const supabase = require('../config/supabase');
const goldPriceService = require('../services/goldPriceService');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');

/**
 * Health check endpoint
 */
const healthCheck = asyncHandler(async (req, res) => {
  const healthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: 'unknown',
      goldPriceService: 'unknown'
    }
  };

  try {
    // Check database connection
    const { data, error: dbError } = await supabase
      .from('vendors')
      .select('count', { count: 'exact', head: true })
      .limit(1);

    healthStatus.services.database = dbError ? 'unhealthy' : 'healthy';

    // Check gold price service
    const goldPrice = goldPriceService.getCurrentPrice();
    const lastUpdate = goldPriceService.getLastUpdateTime();
    
    healthStatus.services.goldPriceService = goldPrice > 0 ? 'healthy' : 'unhealthy';
    healthStatus.goldPrice = {
      current: goldPrice,
      lastUpdate
    };

    // Determine overall health
    const allServicesHealthy = Object.values(healthStatus.services).every(
      status => status === 'healthy'
    );

    if (!allServicesHealthy) {
      healthStatus.status = 'degraded';
    }

    const statusCode = healthStatus.status === 'healthy' ? 200 : 503;
    
    return success(res, 'Health check completed', healthStatus, statusCode);

  } catch (err) {
    healthStatus.status = 'unhealthy';
    healthStatus.error = err.message;
    
    return error(res, 'Health check failed', 503, healthStatus);
  }
});

/**
 * Detailed system information
 */
const systemInfo = asyncHandler(async (req, res) => {
  const systemData = {
    server: {
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    },
    environment: {
      nodeEnv: process.env.NODE_ENV,
      port: process.env.PORT,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    },
    services: {
      supabase: {
        url: process.env.SUPABASE_URL ? 'configured' : 'missing',
        keyConfigured: process.env.SUPABASE_ANON_KEY ? true : false
      },
      goldPriceService: {
        currentPrice: goldPriceService.getCurrentPrice(),
        lastUpdate: goldPriceService.getLastUpdateTime(),
        apiUrl: process.env.GOLD_PRICE_API_URL
      }
    }
  };

  return success(res, 'System information retrieved', systemData);
});

module.exports = {
  healthCheck,
  systemInfo
};
