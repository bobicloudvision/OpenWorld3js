import React, { useState } from 'react';

/**
 * Fantasy-themed Tooltip Component
 * A reusable tooltip with ornate fantasy styling that appears on hover
 */
export default function FantasyTooltip({ children, content, className = '' }) {
  const [show, setShow] = useState(false);
  
  return (
    <div 
      className={`relative ${className}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && content && (
        <div 
          className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-[2000] pointer-events-none"
        >
          <div 
            className="bg-gray-900/95 border border-amber-700/60 rounded px-3 py-2 text-xs text-amber-200 shadow-lg"
            style={{
              textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              boxShadow: '0 4px 15px rgba(0,0,0,0.6), 0 0 10px rgba(217, 119, 6, 0.3)',
              whiteSpace: content.includes('\n') ? 'pre-line' : 'nowrap',
              maxWidth: '300px'
            }}
          >
            {content}
          </div>
          <div 
            className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1"
            style={{
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: '6px solid rgba(217, 119, 6, 0.6)'
            }}
          />
        </div>
      )}
    </div>
  );
}

