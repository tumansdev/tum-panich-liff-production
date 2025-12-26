/**
 * WebSocket Server for Real-time Order Updates
 * 
 * Features:
 * - Order status change notifications
 * - New order alerts for admin
 * - Room-based subscriptions (per order)
 * - Auto-reconnection support
 */

const WebSocket = require('ws');
const url = require('url');

// Store connected clients
const clients = new Map(); // Map<clientId, { ws, subscriptions: Set<orderNumber>, type: 'customer' | 'admin' }>
const orderRooms = new Map(); // Map<orderNumber, Set<clientId>>
const adminClients = new Set(); // Set<clientId>

let wss = null;

/**
 * Generate unique client ID
 */
function generateClientId() {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Initialize WebSocket server
 * @param {http.Server} server - HTTP server instance
 */
function initWebSocket(server) {
  wss = new WebSocket.Server({ 
    server,
    path: '/ws',
  });

  console.log('🔌 WebSocket server initialized on /ws');

  wss.on('connection', (ws, req) => {
    const clientId = generateClientId();
    const query = url.parse(req.url, true).query;
    const clientType = query.type || 'customer'; // 'customer' or 'admin'

    // Store client
    clients.set(clientId, {
      ws,
      subscriptions: new Set(),
      type: clientType,
    });

    // Add to admin set if admin
    if (clientType === 'admin') {
      adminClients.add(clientId);
      console.log(`👤 Admin connected: ${clientId}`);
    } else {
      console.log(`👤 Customer connected: ${clientId}`);
    }

    // Send welcome message
    sendToClient(clientId, {
      type: 'connected',
      clientId,
      message: 'Connected to Tum Panich real-time updates',
    });

    // Handle messages
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        handleMessage(clientId, data);
      } catch (error) {
        console.error('WebSocket message parse error:', error);
      }
    });

    // Handle disconnect
    ws.on('close', () => {
      handleDisconnect(clientId);
    });

    // Handle errors
    ws.on('error', (error) => {
      console.error(`WebSocket error for ${clientId}:`, error.message);
    });

    // Ping to keep alive
    ws.isAlive = true;
    ws.on('pong', () => {
      ws.isAlive = true;
    });
  });

  // Heartbeat interval
  const heartbeatInterval = setInterval(() => {
    wss.clients.forEach((ws) => {
      if (ws.isAlive === false) {
        return ws.terminate();
      }
      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}

/**
 * Handle incoming messages from clients
 */
function handleMessage(clientId, data) {
  const { type, orderNumber } = data;

  switch (type) {
    case 'subscribe':
      // Subscribe to order updates
      if (orderNumber) {
        subscribeToOrder(clientId, orderNumber);
      }
      break;

    case 'unsubscribe':
      // Unsubscribe from order updates
      if (orderNumber) {
        unsubscribeFromOrder(clientId, orderNumber);
      }
      break;

    case 'ping':
      // Respond to ping
      sendToClient(clientId, { type: 'pong' });
      break;

    default:
      console.log(`Unknown message type: ${type}`);
  }
}

/**
 * Subscribe client to order updates
 */
function subscribeToOrder(clientId, orderNumber) {
  const client = clients.get(clientId);
  if (!client) return;

  // Add to client's subscriptions
  client.subscriptions.add(orderNumber);

  // Add to order room
  if (!orderRooms.has(orderNumber)) {
    orderRooms.set(orderNumber, new Set());
  }
  orderRooms.get(orderNumber).add(clientId);

  console.log(`📌 Client ${clientId} subscribed to order ${orderNumber}`);

  sendToClient(clientId, {
    type: 'subscribed',
    orderNumber,
  });
}

/**
 * Unsubscribe client from order updates
 */
function unsubscribeFromOrder(clientId, orderNumber) {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove from client's subscriptions
  client.subscriptions.delete(orderNumber);

  // Remove from order room
  const room = orderRooms.get(orderNumber);
  if (room) {
    room.delete(clientId);
    if (room.size === 0) {
      orderRooms.delete(orderNumber);
    }
  }

  console.log(`📌 Client ${clientId} unsubscribed from order ${orderNumber}`);
}

/**
 * Handle client disconnection
 */
function handleDisconnect(clientId) {
  const client = clients.get(clientId);
  if (!client) return;

  // Remove from all order rooms
  client.subscriptions.forEach((orderNumber) => {
    const room = orderRooms.get(orderNumber);
    if (room) {
      room.delete(clientId);
      if (room.size === 0) {
        orderRooms.delete(orderNumber);
      }
    }
  });

  // Remove from admin set
  adminClients.delete(clientId);

  // Remove client
  clients.delete(clientId);

  console.log(`👋 Client disconnected: ${clientId}`);
}

/**
 * Send message to specific client
 */
function sendToClient(clientId, data) {
  const client = clients.get(clientId);
  if (client && client.ws.readyState === WebSocket.OPEN) {
    client.ws.send(JSON.stringify(data));
  }
}

/**
 * Broadcast order status update to subscribed clients
 * Called when order status changes
 */
function broadcastOrderUpdate(orderNumber, orderData) {
  const room = orderRooms.get(orderNumber);
  if (!room) return;

  const message = {
    type: 'order_update',
    orderNumber,
    data: orderData,
    timestamp: new Date().toISOString(),
  };

  room.forEach((clientId) => {
    sendToClient(clientId, message);
  });

  console.log(`📢 Broadcasted update for order ${orderNumber} to ${room.size} clients`);
}

/**
 * Notify all admin clients about new order
 */
function notifyNewOrder(orderData) {
  const message = {
    type: 'new_order',
    data: orderData,
    timestamp: new Date().toISOString(),
  };

  adminClients.forEach((clientId) => {
    sendToClient(clientId, message);
  });

  console.log(`📢 Notified ${adminClients.size} admins about new order ${orderData.orderNumber}`);
}

/**
 * Notify all admin clients about order status change
 */
function notifyAdminOrderUpdate(orderNumber, newStatus, orderData) {
  const message = {
    type: 'order_status_changed',
    orderNumber,
    status: newStatus,
    data: orderData,
    timestamp: new Date().toISOString(),
  };

  adminClients.forEach((clientId) => {
    sendToClient(clientId, message);
  });
}

/**
 * Get WebSocket server stats
 */
function getStats() {
  return {
    totalClients: clients.size,
    adminClients: adminClients.size,
    customerClients: clients.size - adminClients.size,
    activeRooms: orderRooms.size,
  };
}

module.exports = {
  initWebSocket,
  broadcastOrderUpdate,
  notifyNewOrder,
  notifyAdminOrderUpdate,
  getStats,
};
