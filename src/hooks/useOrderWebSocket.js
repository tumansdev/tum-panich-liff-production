/**
 * WebSocket Hook for Real-time Order Updates
 * 
 * Usage:
 * const { isConnected, orderStatus, subscribe, unsubscribe } = useOrderWebSocket(orderNumber);
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Get WebSocket URL based on environment
const getWebSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  const wsProtocol = apiUrl.startsWith('https') ? 'wss' : 'ws';
  const baseUrl = apiUrl.replace(/^https?/, wsProtocol).replace('/api', '');
  return `${baseUrl}/ws`;
};

/**
 * Hook for subscribing to order updates
 */
export function useOrderWebSocket(orderNumber) {
  const [isConnected, setIsConnected] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${getWebSocketUrl()}?type=customer`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 WebSocket connected');
        setIsConnected(true);
        reconnectAttempts.current = 0;

        // Subscribe to order if provided
        if (orderNumber) {
          wsRef.current.send(JSON.stringify({
            type: 'subscribe',
            orderNumber,
          }));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 WebSocket disconnected');
        setIsConnected(false);
        scheduleReconnect();
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
      scheduleReconnect();
    }
  }, [orderNumber]);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'connected':
        console.log('WebSocket authenticated:', data.clientId);
        break;

      case 'subscribed':
        console.log('Subscribed to order:', data.orderNumber);
        break;

      case 'order_update':
        console.log('Order update received:', data);
        setOrderStatus(data.data);
        setLastUpdate(new Date(data.timestamp));
        break;

      case 'pong':
        // Heartbeat response
        break;

      default:
        console.log('Unknown message type:', data.type);
    }
  }, []);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttempts.current >= maxReconnectAttempts) {
      console.log('Max reconnect attempts reached');
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 30000);
    reconnectAttempts.current += 1;

    console.log(`Reconnecting in ${delay}ms (attempt ${reconnectAttempts.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect]);

  const subscribe = useCallback((newOrderNumber) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'subscribe',
        orderNumber: newOrderNumber,
      }));
    }
  }, []);

  const unsubscribe = useCallback((orderNumberToUnsub) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'unsubscribe',
        orderNumber: orderNumberToUnsub,
      }));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();

    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // Subscribe to order when it changes
  useEffect(() => {
    if (orderNumber && isConnected) {
      subscribe(orderNumber);
    }
  }, [orderNumber, isConnected, subscribe]);

  // Ping to keep connection alive
  useEffect(() => {
    if (!isConnected) return;

    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'ping' }));
      }
    }, 25000);

    return () => clearInterval(pingInterval);
  }, [isConnected]);

  return {
    isConnected,
    orderStatus,
    lastUpdate,
    subscribe,
    unsubscribe,
    reconnect: connect,
  };
}

/**
 * Hook for admin to receive all order updates
 */
export function useAdminWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [newOrders, setNewOrders] = useState([]);
  const [orderUpdates, setOrderUpdates] = useState([]);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const wsUrl = `${getWebSocketUrl()}?type=admin`;
      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log('🔌 Admin WebSocket connected');
        setIsConnected(true);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleMessage(data);
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      wsRef.current.onclose = () => {
        console.log('🔌 Admin WebSocket disconnected');
        setIsConnected(false);
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };
    } catch (error) {
      console.error('WebSocket connection error:', error);
    }
  }, []);

  const handleMessage = useCallback((data) => {
    switch (data.type) {
      case 'new_order':
        console.log('🆕 New order:', data.data);
        setNewOrders((prev) => [data, ...prev].slice(0, 50)); // Keep last 50
        // Play notification sound
        playNotificationSound();
        break;

      case 'order_status_changed':
        console.log('📝 Order status changed:', data);
        setOrderUpdates((prev) => [data, ...prev].slice(0, 50));
        break;

      default:
        break;
    }
  }, []);

  const clearNewOrders = useCallback(() => {
    setNewOrders([]);
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    newOrders,
    orderUpdates,
    clearNewOrders,
    reconnect: connect,
  };
}

// Play notification sound for new orders
function playNotificationSound() {
  try {
    // Create audio context for notification sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.1;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.2);

    // Second beep
    setTimeout(() => {
      const osc2 = audioContext.createOscillator();
      osc2.connect(gainNode);
      osc2.frequency.value = 1000;
      osc2.type = 'sine';
      osc2.start();
      osc2.stop(audioContext.currentTime + 0.2);
    }, 250);
  } catch (error) {
    console.error('Audio notification error:', error);
  }
}

export default useOrderWebSocket;
