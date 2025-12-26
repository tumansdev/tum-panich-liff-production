/**
 * Environment Configuration
 * Validates and exports type-safe environment variables
 */

require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
];

const optionalEnvVars = {
  PORT: '5001',
  NODE_ENV: 'development',
  CORS_ORIGINS: 'http://localhost:5173,https://liff.line.me',
  RATE_LIMIT_WINDOW_MS: '900000', // 15 minutes
  RATE_LIMIT_MAX: '100',
  ENABLE_DEV_AUTH: 'false', // Only set to true for local development!
};

// Validate required environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:');
  missingVars.forEach(varName => console.error(`   - ${varName}`));
  process.exit(1);
}

// Build config object with defaults
const config = {
  // Server
  port: parseInt(process.env.PORT || optionalEnvVars.PORT, 10),
  nodeEnv: process.env.NODE_ENV || optionalEnvVars.NODE_ENV,
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV !== 'production',

  // Database
  databaseUrl: process.env.DATABASE_URL,

  // Authentication
  jwtSecret: process.env.JWT_SECRET,
  enableDevAuth: process.env.ENABLE_DEV_AUTH === 'true',

  // CORS
  corsOrigins: (process.env.CORS_ORIGINS || optionalEnvVars.CORS_ORIGINS)
    .split(',')
    .map(origin => origin.trim()),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || optionalEnvVars.RATE_LIMIT_WINDOW_MS, 10),
  rateLimitMax: parseInt(process.env.RATE_LIMIT_MAX || optionalEnvVars.RATE_LIMIT_MAX, 10),
};

// Log config in development (without secrets)
if (config.isDevelopment) {
  console.log('📋 Config loaded:');
  console.log(`   - Port: ${config.port}`);
  console.log(`   - Environment: ${config.nodeEnv}`);
  console.log(`   - CORS Origins: ${config.corsOrigins.join(', ')}`);
  console.log(`   - Dev Auth: ${config.enableDevAuth ? '⚠️ ENABLED' : '✅ Disabled'}`);
}

module.exports = config;
