import React from 'react';

/**
 * Fantasy-themed Button Component
 * A reusable button with ornate fantasy styling
 */
export default function FantasyButton({
  children,
  onClick,
  variant = 'primary', // 'primary', 'secondary', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  fullWidth = false,
  disabled = false,
  className = '',
  type = 'button'
}) {
  const variants = {
    primary: {
      background: 'linear-gradient(to bottom, #fbbf24, #d97706, #b45309)',
      hoverBackground: 'linear-gradient(to bottom, #fcd34d, #f59e0b, #d97706)',
      border: 'border-amber-600'
    },
    secondary: {
      background: 'linear-gradient(to bottom, #6b7280, #4b5563, #374151)',
      hoverBackground: 'linear-gradient(to bottom, #9ca3af, #6b7280, #4b5563)',
      border: 'border-gray-600'
    },
    danger: {
      background: 'linear-gradient(to bottom, #ef4444, #dc2626, #b91c1c)',
      hoverBackground: 'linear-gradient(to bottom, #f87171, #ef4444, #dc2626)',
      border: 'border-red-600'
    }
  };

  const sizes = {
    sm: 'py-2 px-6 text-sm',
    md: 'py-3 px-8 text-base',
    lg: 'py-4 px-10 text-lg'
  };

  const variantStyle = variants[variant] || variants.primary;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`relative font-bold text-amber-950 border-2 ${variantStyle.border} rounded cursor-pointer transition-all duration-200 uppercase tracking-wider ${fullWidth ? 'w-full' : ''} ${sizeStyle} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      style={{
        background: disabled ? variantStyle.background : variantStyle.background,
        boxShadow: '0 4px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)',
        textShadow: '0 1px 2px rgba(255,255,255,0.3)',
        fontFamily: 'Georgia, serif'
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.target.style.background = variantStyle.hoverBackground;
          e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -1px 0 rgba(0,0,0,0.3)';
          e.target.style.transform = 'scale(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.target.style.background = variantStyle.background;
          e.target.style.boxShadow = '0 4px 8px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.3), inset 0 -1px 0 rgba(0,0,0,0.3)';
          e.target.style.transform = 'scale(1)';
        }
      }}
    >
      {children}
    </button>
  );
}

