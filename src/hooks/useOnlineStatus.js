/**
 * Online Status Hook
 * Detects online/offline status and provides network quality info
 */

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook to detect online/offline status
 * @returns {{ isOnline: boolean, effectiveType: string, checkConnection: () => Promise<boolean> }}
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [effectiveType, setEffectiveType] = useState('4g');

  // Check real connectivity by making a request
  const checkConnection = useCallback(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const online = response.ok;
      setIsOnline(online);
      return online;
    } catch {
      setIsOnline(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Verify with actual request
      checkConnection();
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get network information if available
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection) {
      setEffectiveType(connection.effectiveType || '4g');

      const handleConnectionChange = () => {
        setEffectiveType(connection.effectiveType || '4g');
      };

      connection.addEventListener('change', handleConnectionChange);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [checkConnection]);

  return { isOnline, effectiveType, checkConnection };
}

export default useOnlineStatus;
