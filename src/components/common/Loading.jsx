import React from 'react';
import Icon from './Icon';

const Loading = ({ message = 'กำลังโหลด...' }) => (
  <div className="h-screen flex flex-col items-center justify-center bg-background-light">
    <div className="relative">
      <div className="w-20 h-20 rounded-full bg-primary/20 animate-ping absolute"></div>
      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white relative shadow-xl">
        <Icon name="restaurant" className="text-4xl" />
      </div>
    </div>
    <p className="mt-8 text-gray-600 font-medium animate-pulse">{message}</p>
  </div>
);

export default Loading;
