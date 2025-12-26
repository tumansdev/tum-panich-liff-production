import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { logout, apiCall } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const result = await apiCall('/admin/notifications?limit=5');
      if (result.success) {
        setNotifications(result.data.notifications);
        setUnreadCount(result.data.unreadCount);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Title */}
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            {new Date().toLocaleDateString('th-TH', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </h2>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50">
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-bold">การแจ้งเตือน</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div key={notif.id} className="p-4 border-b border-gray-50 hover:bg-gray-50">
                        <p className="text-sm text-gray-900">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(notif.created_at).toLocaleString('th-TH')}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      ไม่มีการแจ้งเตือน
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-red-50 hover:text-red-600 rounded-xl transition-colors"
          >
            <span className="material-symbols-outlined">logout</span>
            <span className="font-medium">ออกจากระบบ</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
