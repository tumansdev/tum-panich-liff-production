/**
 * Offline Indicator Component
 * Shows a banner when the app is offline
 */

import React from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { Icon } from './common';

export function OfflineIndicator() {
  const { isOnline, checkConnection } = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-red-500 text-white py-2 px-4 z-50 safe-area-top">
      <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
        <Icon name="wifi_off" className="text-lg" />
        <span className="text-sm font-medium">ไม่มีการเชื่อมต่ออินเตอร์เน็ต</span>
        <button
          onClick={checkConnection}
          className="ml-2 px-3 py-1 bg-white/20 rounded-lg text-xs hover:bg-white/30 transition-colors"
        >
          ลองใหม่
        </button>
      </div>
    </div>
  );
}

/**
 * Slow Connection Indicator
 * Shows when connection is slow (2g/slow-2g)
 */
export function SlowConnectionIndicator() {
  const { effectiveType, isOnline } = useOnlineStatus();

  const isSlowConnection = isOnline && ['slow-2g', '2g'].includes(effectiveType);

  if (!isSlowConnection) return null;

  return (
    <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white py-1 px-4 z-50 safe-area-top">
      <div className="flex items-center justify-center gap-2 max-w-lg mx-auto">
        <Icon name="signal_cellular_alt_1_bar" className="text-lg" />
        <span className="text-xs">สัญญาณอ่อน อาจโหลดช้า</span>
      </div>
    </div>
  );
}

export default OfflineIndicator;
