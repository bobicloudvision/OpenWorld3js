import React from 'react';
import useZoneStore from '../stores/zoneStore';

/**
 * Zone Transition Component
 * Displays loading screen during zone transitions
 */
export default function ZoneTransition() {
  const { isTransitioning, transitionMessage } = useZoneStore();

  if (!isTransitioning) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0, 0, 0, 0.95)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      animation: 'fadeIn 0.3s ease-in-out'
    }}>
      {/* Animated spinner */}
      <div style={{
        width: '60px',
        height: '60px',
        border: '4px solid #374151',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite',
        marginBottom: '24px'
      }} />

      {/* Message */}
      <div style={{
        color: '#e5e7eb',
        fontSize: '20px',
        fontWeight: 'bold',
        marginBottom: '8px'
      }}>
        {transitionMessage}
      </div>

      <div style={{
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        Please wait...
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

