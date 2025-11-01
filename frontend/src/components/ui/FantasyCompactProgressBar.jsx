import React from 'react';
import FantasyTooltip from './FantasyTooltip';

/**
 * Fantasy-themed Compact Progress Bar Component
 * A compact, inline progress bar with icon and tooltip support
 */
export default function FantasyCompactProgressBar({ icon, current, max, variant, label, tooltipContent }) {
  const percentage = Math.max(0, Math.min(100, (current / max) * 100));
  
  const variantStyles = {
    health: {
      bg: 'rgba(239, 68, 68, 0.2)',
      border: 'border-red-500/40',
      fill: current <= 0 
        ? 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)' 
        : 'linear-gradient(90deg, #ef4444 0%, #dc2626 100%)',
      textColor: current <= 0 ? '#ef4444' : '#fff'
    },
    power: {
      bg: 'rgba(59, 130, 246, 0.2)',
      border: 'border-blue-500/40',
      fill: 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
      textColor: '#fff'
    },
    experience: {
      bg: 'rgba(217, 119, 6, 0.2)',
      border: 'border-amber-500/40',
      fill: 'linear-gradient(90deg, #fbbf24 0%, #f59e0b 100%)',
      textColor: '#fff'
    }
  };
  
  const style = variantStyles[variant] || variantStyles.health;
  
  return (
    <FantasyTooltip content={tooltipContent}>
      <div className="flex items-center gap-2 min-w-[120px]">
        <span className="text-base">{icon}</span>
        <div className="flex-1 relative">
          <div 
            className={`h-3 rounded border ${style.border}`}
            style={{ background: style.bg }}
          >
            <div 
              className="h-full transition-all duration-300 rounded"
              style={{ 
                width: `${percentage}%`,
                background: style.fill,
                boxShadow: 'inset 0 0 5px rgba(255, 255, 255, 0.3)'
              }}
            />
          </div>
          <div 
            className="absolute inset-0 flex items-center justify-center text-[10px] font-bold leading-none"
            style={{ 
              color: style.textColor,
              textShadow: '1px 1px 2px rgba(0,0,0,0.9)'
            }}
          >
            {label}
          </div>
        </div>
      </div>
    </FantasyTooltip>
  );
}

