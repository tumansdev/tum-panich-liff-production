import React from 'react';
import { Icon } from '../common';

const CategoryFilter = ({ categories, selected, onSelect }) => {
  // Default "All" category
  const allCategories = [
    { id: 'all', name: 'ทั้งหมด', icon: 'restaurant' },
    ...categories,
  ];

  return (
    <div className="mb-6 overflow-x-auto hide-scrollbar -mx-4 px-4">
      <div className="flex gap-2 w-max">
        {allCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => onSelect(cat.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all active:scale-95 ${selected === cat.id
                ? 'bg-primary text-white shadow-lg shadow-primary/30'
                : 'bg-white text-gray-700 border border-gray-200 hover:border-primary'
              }`}
          >
            <Icon name={cat.icon || 'restaurant'} className="text-lg" />
            {cat.name}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
