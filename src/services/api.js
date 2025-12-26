/**
 * Tum Panich API Client
 * 
 * Features:
 * - Automatic retry on failure (3 attempts)
 * - LINE token authentication
 * - Request timeout handling
 * - Thai-friendly error messages
 */

import {
  ORDER_STATUS,
  DELIVERY_OPTIONS,
  BANK_INFO,
  SHOP_INFO,
  ERROR_MESSAGES
} from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const REQUEST_TIMEOUT = 15000; // 15 seconds
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

// Sleep helper
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Enhanced fetch with timeout
 */
async function fetchWithTimeout(url, options, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error(ERROR_MESSAGES.timeout);
    }
    throw error;
  }
}

/**
 * Main API call function with retry logic
 * @param {string} endpoint - API endpoint
 * @param {object} options - Fetch options
 * @param {object|string} auth - Auth object { lineUserId, accessToken } or just userId string
 * @param {number} retries - Number of retry attempts
 */
async function apiCall(endpoint, options = {}, auth = null, retries = MAX_RETRIES) {
  const url = `${API_URL}${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add LINE authentication headers
  if (auth) {
    // Support both new format { lineUserId, accessToken } and legacy string format
    if (typeof auth === 'string') {
      headers['X-LINE-USERID'] = auth;
    } else if (auth.lineUserId) {
      headers['X-LINE-USERID'] = auth.lineUserId;
      // Add access token for secure verification
      if (auth.accessToken) {
        headers['X-LINE-TOKEN'] = auth.accessToken;
      }
    }
  }

  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, {
        headers,
        ...options,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle specific error codes
        if (response.status === 401) {
          throw new Error(ERROR_MESSAGES.auth);
        }
        if (response.status === 400) {
          throw new Error(data.error || ERROR_MESSAGES.validation);
        }
        if (response.status === 429) {
          throw new Error(ERROR_MESSAGES.rateLimit);
        }
        if (response.status >= 500) {
          throw new Error(ERROR_MESSAGES.server);
        }
        throw new Error(data.error || ERROR_MESSAGES.unknown);
      }

      return data;
    } catch (error) {
      lastError = error;
      console.error(`API Error [${endpoint}] (attempt ${attempt}/${retries}):`, error.message);

      // Don't retry on certain errors
      const noRetryErrors = [
        ERROR_MESSAGES.auth,
        ERROR_MESSAGES.validation,
        ERROR_MESSAGES.rateLimit,
      ];
      if (noRetryErrors.includes(error.message)) {
        throw error;
      }

      // Wait before retry (exponential backoff)
      if (attempt < retries) {
        await sleep(RETRY_DELAY * attempt);
      }
    }
  }

  // All retries failed
  if (lastError.message.includes('fetch')) {
    throw new Error(ERROR_MESSAGES.network);
  }
  throw lastError;
}


// ==================== MENU ====================

export async function getMenu() {
  return apiCall('/menu');
}

export async function getMenuItemById(id) {
  return apiCall(`/menu/${id}`);
}

export async function getCategories() {
  return apiCall('/categories');
}

// ==================== ORDERS ====================

export async function createOrder(orderData, auth) {
  return apiCall('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData),
  }, auth);
}

export async function getOrderByNumber(orderNumber, auth) {
  return apiCall(`/orders/${orderNumber}`, {}, auth);
}

export async function getOrdersByUser(lineUserId, auth, options = {}) {
  const { limit = 20, offset = 0 } = options;
  return apiCall(`/orders/user/${lineUserId}?limit=${limit}&offset=${offset}`, {}, auth);
}

export async function uploadSlip(orderId, slipFile, auth) {
  const formData = new FormData();
  formData.append('slip', slipFile);

  const url = `${API_URL}/orders/${orderId}/slip`;

  const headers = {};
  if (auth) {
    if (typeof auth === 'string') {
      headers['X-LINE-USERID'] = auth;
    } else {
      if (auth.lineUserId) headers['X-LINE-USERID'] = auth.lineUserId;
      if (auth.accessToken) headers['X-LINE-TOKEN'] = auth.accessToken;
    }
  }

  const response = await fetchWithTimeout(url, {
    method: 'POST',
    body: formData,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'ไม่สามารถอัพโหลดสลิปได้');
  }

  return data;
}

export async function getOrderTracking(orderIdOrNumber, auth) {
  return apiCall(`/orders/${orderIdOrNumber}/track`, {}, auth);
}

// ==================== COUPONS ====================

export async function validateCoupon(code, orderTotal, lineUserId) {
  return apiCall('/coupons/validate', {
    method: 'POST',
    body: JSON.stringify({ code, orderTotal, lineUserId }),
  });
}

// ==================== USERS ====================

export async function registerUser(lineUserId, displayName, pictureUrl) {
  return apiCall('/users/register', {
    method: 'POST',
    body: JSON.stringify({ lineUserId, displayName, pictureUrl }),
  });
}

export async function getUserByLineId(lineUserId, auth) {
  return apiCall(`/users/${lineUserId}`, {}, auth);
}

export async function updateUser(lineUserId, userData, auth) {
  return apiCall(`/users/${lineUserId}`, {
    method: 'PATCH',
    body: JSON.stringify(userData),
  }, auth);
}

export async function getUserAddresses(lineUserId, auth) {
  return apiCall(`/users/${lineUserId}/addresses`, {}, auth);
}

export async function addUserAddress(lineUserId, addressData, auth) {
  return apiCall(`/users/${lineUserId}/addresses`, {
    method: 'POST',
    body: JSON.stringify(addressData),
  }, auth);
}

export async function deleteUserAddress(lineUserId, addressId, auth) {
  return apiCall(`/users/${lineUserId}/addresses/${addressId}`, {
    method: 'DELETE',
  }, auth);
}

export async function getUserProfile(lineUserId, auth) {
  return apiCall(`/users/${lineUserId}`, {}, auth);
}

export async function updateUserProfile(lineUserId, profileData, auth) {
  return apiCall(`/users/${lineUserId}`, {
    method: 'PATCH',
    body: JSON.stringify(profileData),
  }, auth);
}

// Re-export constants
export {
  ORDER_STATUS,
  DELIVERY_OPTIONS,
  BANK_INFO,
  SHOP_INFO
};

export default {
  getMenu,
  getMenuItemById,
  getCategories,
  createOrder,
  getOrderByNumber,
  getOrdersByUser,
  uploadSlip,
  getOrderTracking,
  validateCoupon,
  registerUser,
  getUserByLineId,
  updateUser,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
  DELIVERY_OPTIONS,
  ORDER_STATUS,
  BANK_INFO,
  SHOP_INFO,
};
