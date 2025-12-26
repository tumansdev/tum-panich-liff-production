import React from 'react';
import { Icon } from '../common';

const PromoBanner = ({ title, subtitle, tag, onAction }) => {
  return (
    <div className="mx-4 mt-4 mb-6 relative overflow-hidden rounded-2xl bg-primary text-white shadow-xl shadow-primary/20">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl"></div>
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-black/10 blur-3xl"></div>
      <div className="relative z-10 p-6">
        <div className="flex items-center gap-2 mb-2">
          <Icon name="campaign" className="text-xl animate-pulse" />
          {tag && (
            <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase">
              {tag}
            </span>
          )}
        </div>
        <h3 className="text-xl font-bold mb-1">{title}</h3>
        <p className="text-sm text-white/80">{subtitle}</p>
        {onAction && (
          <button
            onClick={onAction}
            className="mt-4 bg-white text-primary px-4 py-2 rounded-xl text-sm font-bold shadow-lg hover:bg-gray-50 transition-colors"
          >
            ดูรายละเอียด
          </button>
        )}
      </div>
    </div>
  );
};

export default PromoBanner;
