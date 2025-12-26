import React from 'react';
import { Icon } from '../common';

const BottomNav = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'menu', label: 'เมนู', icon: 'restaurant' },
    { id: 'orders', label: 'ออเดอร์', icon: 'receipt_long' },
    { id: 'story', label: 'เรื่องราว', icon: 'auto_stories' },
    { id: 'profile', label: 'โปรไฟล์', icon: 'person' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-6 py-3 flex justify-around items-center z-40 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] safe-area-bottom">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-primary scale-110' : 'text-gray-400'
            }`}
        >
          <Icon name={tab.icon} className="text-2xl" filled={activeTab === tab.id} />
          <span className="text-[10px] font-bold">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default BottomNav;
