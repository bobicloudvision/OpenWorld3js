import React from 'react'
import { Html } from '@react-three/drei'

/**
 * Reusable player name badge component
 * Displays above the player model, always facing the camera (billboard style)
 * @param {string} playerName - The player's name to display
 * @param {number} height - Height offset above the model (scales with modelScale)
 * @param {number} modelScale - Scale of the model to adjust badge height proportionally
 */
export default function PlayerNameBadge({ playerName, height, modelScale = 1 }) {
  // Calculate badge height above model
  const badgeHeight = (height || 2.2) * modelScale - 0.4;
  
  return (
    <Html
      position={[0, badgeHeight, 0]}
      center
      distanceFactor={10}
      style={{
        pointerEvents: 'none',
        transform: 'translate3d(-50%, -50%, 0)',
        zIndex: 1, // Keep badge behind UI elements (UI elements use z-[1000]+)
      }}
      wrapperClass="player-name-badge-wrapper"
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.25) 0%, rgba(101, 67, 33, 0.25) 100%)',
          color: '#fbbf24',
          padding: '2px 7px',
          borderRadius: '8px',
          fontSize: '9px',
          border: '2px solid rgba(217, 119, 6, 0.6)',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.4), 0 4px 12px rgba(0,0,0,0.6), 0 0 20px rgba(217, 119, 6, 0.3)',
          textShadow: '1px 1px 3px rgba(0,0,0,0.9), 0 0 8px rgba(217, 119, 6, 0.5)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)',
          transform: 'translateZ(0)', // Enable hardware acceleration
          letterSpacing: '1px',
          position: 'relative',
        }}
      >
        {/* Inner decorative border similar to FantasyCard */}
        <div
          style={{
            position: 'absolute',
            pointerEvents: 'none',
          }}
        />
        <span style={{ position: 'relative', zIndex: 1 }}>
          {playerName}
        </span>
      </div>
    </Html>
  )
}

