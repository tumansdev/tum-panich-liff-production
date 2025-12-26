import React from 'react';
import { Icon } from '../common';
import { useUser } from '../../context/UserContext';

const Header = ({ title = 'ตั้มพานิช', showBack = false, onBack }) => {
  const { user } = useUser();

  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-100 px-4 py-3 safe-area-top">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        <div className="flex items-center gap-3">
          {showBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <Icon name="arrow_back_ios_new" className="text-xl" />
            </button>
          ) : (
            <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-white">
              <Icon name="restaurant" className="text-xl" />
            </div>
          )}
          <h1 className="font-bold text-lg text-gray-900">{title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <img
              src={user.pictureUrl}
              alt={user.displayName}
              className="w-9 h-9 rounded-full border-2 border-white shadow-sm"
            />
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
