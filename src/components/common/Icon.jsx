import React from 'react';

const Icon = ({ name, className = '', filled = false, style }) => (
  <span
    className={`${filled ? 'material-symbols-filled' : 'material-symbols-outlined'} ${className}`}
    style={style}
  >
    {name}
  </span>
);

export default Icon;
