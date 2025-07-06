require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

// Import utilities and middleware
const logger = require('./utils/logger');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Import routes
const routes = require('./routes');

// Import services (this will start the gold price service)
// Wrap in try-catch to prevent startup failures
try {
  require('./services/goldPriceService');
  logger.info('Gold price service initialized successfully');
} catch (error) {
  logger.error('Failed to initialize gold price service:', error.message);
  logger.warn('Continuing without gold price service...');
}

// Import Swagger configuration
const { specs, swaggerUi } = require('./config/swagger');

// Create Express app
const app = express();

// Trust proxy (for rate limiting and IP detection)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || [
      'http://localhost:3000',
      'http://localhost:3001', 
      'http://localhost:3002',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      'http://127.0.0.1:3002'
    ];
    
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // In development, be more permissive
    if (process.env.NODE_ENV === 'development') {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      const error = new Error(`CORS Error: Origin ${origin} not allowed`);
      error.statusCode = 403;
      callback(error);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// Rate limiting
app.use(generalLimiter);

// Request logging
app.use((req, res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`, {
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    body: req.method === 'POST' || req.method === 'PUT' ? req.body : undefined
  });
  next();
});

// Routes
app.use(routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'RENART Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    documentation: '/api-docs',
    endpoints: {
      api: '/api',
      public: '/api/v1/public',
      vendor: '/api/v1/vendor',
      health: '/api/health'
    }
  });
});

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Server startup
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 RENART Backend Server running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 API Documentation: http://localhost:${PORT}/api-docs`);
  logger.info(`❤️  Health Check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('Uncaught Exception:', err);
  process.exit(1);
});

module.exports = app;
