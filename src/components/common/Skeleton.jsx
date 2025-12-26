import React from 'react';

const Skeleton = ({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-gray-200 rounded-lg ${className}`}
    {...props}
  />
);

export default Skeleton;
