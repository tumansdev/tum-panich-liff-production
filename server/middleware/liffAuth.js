/**
 * LIFF Authentication Middleware
 * Verifies that the request comes from an authenticated LINE user
 * by validating the access token with LINE API
 * 
 * SECURITY: Legacy auth fallback has been REMOVED for production safety.
 * Use ENABLE_DEV_AUTH=true only for local development!
 */

const axios = require('axios');
const config = require('../config/env');

// Cache for verified tokens (avoid calling LINE API on every request)
const tokenCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Clean expired cache entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      tokenCache.delete(key);
    }
  }
}, 60 * 1000); // Clean every minute

/**
 * Verify LIFF access token with LINE API
 */
async function verifyLineToken(accessToken) {
  // Check cache first
  const cached = tokenCache.get(accessToken);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    return cached.data;
  }

  try {
    // Verify token with LINE API
    const response = await axios.get('https://api.line.me/oauth2/v2.1/verify', {
      params: { access_token: accessToken }
    });

    // Check if token is valid and not expired
    if (response.data.expires_in && response.data.expires_in > 0) {
      // Get user profile
      const profileResponse = await axios.get('https://api.line.me/v2/profile', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const userData = {
        userId: profileResponse.data.userId,
        displayName: profileResponse.data.displayName,
        pictureUrl: profileResponse.data.pictureUrl
      };

      // Cache the result
      tokenCache.set(accessToken, {
        data: userData,
        timestamp: Date.now()
      });

      return userData;
    }
    
    return null;
  } catch (error) {
    console.error('LINE token verification failed:', error.response?.data || error.message);
    return null;
  }
}

/**
 * Middleware to verify LINE access token
 * Requires 'x-line-token' header with LIFF access token
 * 
 * SECURITY NOTE: 
 * - In PRODUCTION: Always requires valid LINE access token
 * - In DEVELOPMENT with ENABLE_DEV_AUTH=true: Allows X-LINE-USERID header (for testing only!)
 */
const liffAuth = async (req, res, next) => {
  try {
    const accessToken = req.headers['x-line-token'];
    const lineUserId = req.headers['x-line-userid'];

    // Primary: Verify with LINE API if access token is provided
    if (accessToken) {
      const userData = await verifyLineToken(accessToken);
      
      if (!userData) {
        return res.status(401).json({ 
          success: false, 
          error: 'Invalid or expired LINE token. Please login again.' 
        });
      }

      req.lineUserId = userData.userId;
      req.lineUser = userData;
      return next();
    }

    // DEVELOPMENT ONLY: Allow X-LINE-USERID header for local testing
    // This is controlled by ENABLE_DEV_AUTH environment variable
    if (config.enableDevAuth && lineUserId) {
      console.warn('⚠️  DEV AUTH MODE: Request authenticated with X-LINE-USERID (no token verification)');
      console.warn('⚠️  This should NEVER happen in production!');
      req.lineUserId = lineUserId;
      req.lineUser = {
        userId: lineUserId,
        displayName: 'Dev User',
        pictureUrl: null,
      };
      return next();
    }

    // No valid authentication provided
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication required. Please login via LIFF.' 
    });
  } catch (error) {
    console.error('LIFF Auth error:', error.message);
    return res.status(401).json({ 
      success: false, 
      error: 'Authentication failed' 
    });
  }
};

/**
 * Middleware to verify user owns the resource
 */
const verifyOwner = (paramName = 'lineUserId') => {
  return (req, res, next) => {
    const resourceLineUserId = req.params[paramName];
    const requestingUserId = req.lineUserId;

    if (resourceLineUserId !== requestingUserId) {
      return res.status(403).json({ 
        success: false, 
        error: 'Access denied. You can only access your own resources.' 
      });
    }

    next();
  };
};

module.exports = { liffAuth, verifyOwner };
