import React from 'react';

/**
 * Fantasy-themed Card Component
 * A reusable card with ornate fantasy styling
 */
export default function FantasyCard({
  children,
  title,
  onClick,
  hoverable = false,
  className = ''
}) {
  return (
    <div
      className={`relative bg-gradient-to-b from-amber-900/70 to-amber-950/80 border-[3px] border-amber-700/60 rounded-lg p-6 transition-all duration-300 ${hoverable ? 'cursor-pointer' : ''} ${className}`}
      style={{
        boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.6), 0 0 20px rgba(217, 119, 6, 0.2)'
      }}
      onClick={onClick}
      onMouseEnter={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = 'rgba(245, 158, 11, 0.8)';
          e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.5), 0 6px 20px rgba(0,0,0,0.7), 0 0 30px rgba(245, 158, 11, 0.5)';
          e.currentTarget.style.transform = 'translateY(-2px)';
        }
      }}
      onMouseLeave={(e) => {
        if (hoverable) {
          e.currentTarget.style.borderColor = 'rgba(217, 119, 6, 0.6)';
          e.currentTarget.style.boxShadow = 'inset 0 2px 10px rgba(0,0,0,0.5), 0 4px 15px rgba(0,0,0,0.6), 0 0 20px rgba(217, 119, 6, 0.2)';
          e.currentTarget.style.transform = 'translateY(0)';
        }
      }}
    >
      {/* Inner decorative border */}
      <div className="absolute inset-2 border border-amber-600/30 rounded pointer-events-none"></div>

      {/* Title */}
      {title && (
        <h3 
          className="m-0 mb-4 text-amber-200 text-xl font-bold relative z-10"
          style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
            fontFamily: 'Georgia, serif',
            letterSpacing: '1px'
          }}
        >
          {title}
        </h3>
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

