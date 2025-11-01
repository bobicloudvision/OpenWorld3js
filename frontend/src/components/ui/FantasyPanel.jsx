import React from 'react';

/**
 * Fantasy-themed Panel Component
 * A container panel with ornate fantasy styling for grouping content
 */
export default function FantasyPanel({
  children,
  title,
  className = ''
}) {
  return (
    <div 
      className={`bg-gradient-to-b from-amber-900/60 to-amber-950/80 p-6 rounded-md border-2 border-amber-700/50 ${className}`}
      style={{
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 0 15px rgba(217, 119, 6, 0.3)'
      }}
    >
      {title && (
        <div 
          className="text-amber-200 mb-4 text-sm font-semibold uppercase tracking-wider"
          style={{
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)'
          }}
        >
          {title}
        </div>
      )}
      {children}
    </div>
  );
}

