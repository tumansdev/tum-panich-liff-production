/**
 * Winston Logger Configuration
 * 
 * Features:
 * - Console logging with colors in development
 * - File logging in production (error.log, combined.log)
 * - Request logging middleware
 * - Structured JSON format
 */

const winston = require('winston');
const path = require('path');
const config = require('./env');

// Custom format for console
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} ${level}: ${message} ${metaStr}`;
  })
);

// JSON format for files
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports based on environment
const transports = [];

// Console transport (always)
transports.push(
  new winston.transports.Console({
    format: config.isDevelopment ? consoleFormat : fileFormat,
    level: config.isDevelopment ? 'debug' : 'info',
  })
);

// File transports (production only)
if (config.isProduction) {
  const logsDir = path.join(__dirname, '../logs');

  // Error log - only errors
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log - all levels
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: fileFormat,
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 5,
    })
  );
}

// Create logger
const logger = winston.createLogger({
  level: config.isDevelopment ? 'debug' : 'info',
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

// Request logging middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();

  // Skip health check requests
  if (req.path === '/api/health') {
    return next();
  }

  // Log on response finish
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const logData = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('user-agent'),
    };

    // Add user info if authenticated
    if (req.lineUserId) {
      logData.lineUserId = req.lineUserId;
    }

    // Log level based on status code
    if (res.statusCode >= 500) {
      logger.error('Request failed', logData);
    } else if (res.statusCode >= 400) {
      logger.warn('Request error', logData);
    } else {
      logger.info('Request completed', logData);
    }
  });

  next();
};

// Error logging middleware
const errorLogger = (err, req, res, next) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    method: req.method,
    path: req.path,
    body: config.isDevelopment ? req.body : undefined,
  });
  next(err);
};

module.exports = {
  logger,
  requestLogger,
  errorLogger,
};
