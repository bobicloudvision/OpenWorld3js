import React from 'react';

/**
 * Fantasy-themed Badge Component
 * A reusable badge with ornate fantasy styling
 */
export default function FantasyBadge({
  children,
  variant = 'default', // 'default', 'primary', 'success', 'warning', 'danger', 'rank-1', 'rank-2', 'rank-3'
  size = 'md', // 'sm', 'md', 'lg'
  className = '',
  style = {}
}) {
  const variants = {
    default: {
      background: 'rgba(139, 69, 19, 0.2)',
      border: 'border-amber-600/50',
      textColor: 'text-amber-200'
    },
    primary: {
      background: 'rgba(217, 119, 6, 0.2)',
      border: 'border-amber-500/60',
      textColor: 'text-amber-300'
    },
    success: {
      background: 'rgba(16, 185, 129, 0.2)',
      border: 'border-green-500/50',
      textColor: 'text-green-400'
    },
    warning: {
      background: 'rgba(245, 158, 11, 0.2)',
      border: 'border-amber-500/50',
      textColor: 'text-amber-400'
    },
    danger: {
      background: 'rgba(239, 68, 68, 0.2)',
      border: 'border-red-500/50',
      textColor: 'text-red-400'
    },
    'rank-1': {
      background: '#fbbf24',
      border: 'border-yellow-500',
      textColor: 'text-black',
      fontWeight: 'bold'
    },
    'rank-2': {
      background: '#94a3b8',
      border: 'border-gray-400',
      textColor: 'text-black',
      fontWeight: 'bold'
    },
    'rank-3': {
      background: '#cd7f32',
      border: 'border-amber-700',
      textColor: 'text-black',
      fontWeight: 'bold'
    }
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const variantStyle = variants[variant] || variants.default;
  const sizeStyle = sizes[size] || sizes.md;

  return (
    <span
      className={`inline-flex items-center rounded border ${variantStyle.border} ${variantStyle.textColor} ${sizeStyle} ${variantStyle.fontWeight || 'font-semibold'} ${className}`}
      style={{
        background: style.background || variantStyle.background,
        borderColor: style.borderColor || undefined,
        textShadow: variant === 'rank-1' || variant === 'rank-2' || variant === 'rank-3' 
          ? 'none' 
          : '1px 1px 2px rgba(0,0,0,0.8)',
        boxShadow: variant === 'rank-1' || variant === 'rank-2' || variant === 'rank-3'
          ? '0 2px 4px rgba(0,0,0,0.3)'
          : 'inset 0 1px 2px rgba(0,0,0,0.2)',
        ...style
      }}
    >
      {children}
    </span>
  );
}

