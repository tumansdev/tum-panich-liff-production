import React from 'react';

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon,
  iconRight,
  className = '',
  type = 'button',
  ...props
}) => {
  const baseClasses = 'flex items-center justify-center gap-2 font-bold transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl';

  const variants = {
    primary: 'bg-primary text-white shadow-lg shadow-primary/30 hover:bg-primary-hover',
    secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200',
    outline: 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100',
    danger: 'bg-red-500 text-white shadow-lg shadow-red-500/30 hover:bg-red-600',
  };

  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-11 px-5 text-base',
    lg: 'h-14 px-6 text-lg',
    xl: 'h-16 px-8 text-xl',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {loading ? (
        <span className="material-symbols-outlined animate-spin text-lg">progress_activity</span>
      ) : icon ? (
        <span className="material-symbols-outlined text-lg">{icon}</span>
      ) : null}
      {children}
      {iconRight && !loading && (
        <span className="material-symbols-outlined text-lg">{iconRight}</span>
      )}
    </button>
  );
};

export default Button;
