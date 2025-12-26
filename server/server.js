/**
 * Tum Panich LIFF API Server
 * 
 * Security Features:
 * - Rate limiting
 * - CORS protection
 * - Helmet security headers
 * - Input validation
 * - Environment validation
 * 
 * Real-time Features:
 * - WebSocket for order updates
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config/env');
const { logger, requestLogger, errorLogger } = require('./config/logger');
const { generalLimiter, authLimiter, orderLimiter, uploadLimiter } = require('./middleware/rateLimit');
const { initWebSocket, getStats } = require('./websocket');

const app = express();

// Trust proxy (required for Nginx + Rate Limiting)
app.set('trust proxy', 1);

// Create HTTP server for both Express and WebSocket
const server = http.createServer(app);

// Initialize WebSocket
initWebSocket(server);

// ==================== SECURITY MIDDLEWARE ====================

// Helmet - Security headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }, // Allow serving images
}));

// CORS - Restrict origins
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if origin is allowed
    if (config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
      callback(null, true);
    } else {
      console.warn(`⚠️ CORS blocked request from: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-LINE-USERID', 'X-LINE-TOKEN'],
};
app.use(cors(corsOptions));

// Rate limiting - General
app.use(generalLimiter);

// Request logging
app.use(requestLogger);

// Body parsing with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================== STATIC FILES ====================

// Static files for uploads (slips, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ==================== ROUTES ====================

// Public routes (no auth required)
app.use('/api/menu', require('./routes/menuRoutes'));
app.use('/api/categories', require('./routes/categoryRoutes'));

// Protected routes (LIFF auth required)
app.use('/api/orders', orderLimiter, require('./routes/orderRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/coupons', require('./routes/couponRoutes'));

// Admin routes (JWT auth required)
app.use('/api/admin', authLimiter, require('./routes/adminRoutes'));

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  const wsStats = getStats();
  res.json({ 
    status: 'OK', 
    service: 'Tum Panich LIFF API',
    version: '1.2.0',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()),
    websocket: wsStats,
  });
});

// ==================== ERROR HANDLING ====================

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    path: req.originalUrl,
  });
});

// Error logging middleware
app.use(errorLogger);

// Global error handler
app.use((err, req, res, next) => {
  // CORS errors
  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({
      success: false,
      error: 'CORS policy: Origin not allowed',
    });
  }

  // Send response
  res.status(err.status || 500).json({
    success: false,
    error: config.isProduction ? 'Internal Server Error' : err.message,
  });
});

// ==================== START SERVER ====================

server.listen(config.port, () => {
  console.log('');
  console.log('🍜 ======================================');
  console.log(`🍜  Tum Panich API v1.2.0`);
  console.log(`🍜  Running on port ${config.port}`);
  console.log(`🍜  Environment: ${config.nodeEnv}`);
  console.log(`🍜  WebSocket: ws://localhost:${config.port}/ws`);
  console.log('🍜 ======================================');
  console.log('');
  
  if (config.enableDevAuth) {
    console.log('⚠️  WARNING: Dev auth mode is ENABLED!');
    console.log('⚠️  Set ENABLE_DEV_AUTH=false in production!');
    console.log('');
  }
});

module.exports = { app, server };
