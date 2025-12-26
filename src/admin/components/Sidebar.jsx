import React from 'react';
import { useAuth } from '../context/AuthContext';

const Sidebar = ({ currentPage, onNavigate }) => {
  const { admin } = useAuth();

  const menuItems = [
    { id: 'pos', label: 'จุดขาย (POS)', icon: 'point_of_sale' },
    { id: 'orders', label: 'ประวัติออเดอร์', icon: 'history' },
    { id: 'menu', label: 'จัดการเมนู', icon: 'restaurant_menu' },
    { id: 'reports', label: 'รายงาน', icon: 'bar_chart' },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-full" />
          <div>
            <h1 className="font-bold">ตั้มพานิช</h1>
            <p className="text-xs text-gray-400">Admin Panel</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`w-full px-6 py-3 flex items-center gap-3 transition-colors ${currentPage === item.id
              ? 'bg-primary text-white'
              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Admin Info */}
      <div className="p-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-2">
          <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-white">person</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{admin?.displayName || 'Admin'}</p>
            <p className="text-xs text-gray-400">{admin?.role || 'admin'}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
