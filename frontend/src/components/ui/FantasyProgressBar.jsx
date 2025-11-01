import React from 'react';

/**
 * Fantasy-themed Progress Bar Component
 * A reusable progress bar with ornate fantasy styling
 */
export default function FantasyProgressBar({
  label,
  current,
  max,
  variant = 'health', // 'health', 'power', 'experience', 'custom'
  showLabel = true,
  height = 'h-6', // Tailwind height classes
  className = ''
}) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));

  const getVariantStyle = (variantType) => {
    const baseVariants = {
      health: {
        background: 'rgba(239, 68, 68, 0.2)',
        border: 'border-red-500/40',
        fill: current <= 0 
          ? 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)'
          : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
        labelColor: current <= 0 ? '#ef4444' : '#fff'
      },
      power: {
        background: 'rgba(59, 130, 246, 0.2)',
        border: 'border-blue-500/40',
        fill: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
        labelColor: '#fff'
      },
      experience: {
        background: 'rgba(217, 119, 6, 0.2)',
        border: 'border-amber-500/40',
        fill: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
        labelColor: '#fff'
      },
      custom: {
        background: 'rgba(139, 69, 19, 0.2)',
        border: 'border-amber-600/40',
        fill: 'linear-gradient(90deg, #d97706 0%, #b45309 100%)',
        labelColor: '#fff'
      }
    };
    return baseVariants[variantType] || baseVariants.health;
  };

  const variantStyle = getVariantStyle(variant);

  return (
    <div className={`mb-3 ${className}`}>
      {showLabel && label && (
        <label 
          className="block mb-1 text-sm font-bold"
          style={{
            color: variantStyle.labelColor,
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          {label}
        </label>
      )}
      <div 
        className={`bar ${height} rounded-xl overflow-hidden border ${variantStyle.border}`}
        style={{ 
          background: variantStyle.background
        }}
      >
        <div 
          className="bar-fill h-full transition-all duration-300" 
          style={{ 
            width: `${percentage}%`,
            background: variantStyle.fill,
            boxShadow: 'inset 0 0 10px rgba(255, 255, 255, 0.3)'
          }}
        />
      </div>
    </div>
  );
}

