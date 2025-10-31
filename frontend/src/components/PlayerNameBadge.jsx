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
  const badgeHeight = (height || 2.2) * modelScale
  
  return (
    <Html
      position={[0, badgeHeight, 0]}
      center
      distanceFactor={10}
      style={{
        pointerEvents: 'none',
        transform: 'translate3d(-50%, -50%, 0)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 30, 40, 0.95) 0%, rgba(20, 20, 30, 0.95) 100%)',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '12px',
          fontSize: '10px',
          fontWeight: '600',
          border: '2px solid rgba(100, 150, 255, 0.6)',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), 0 0 8px rgba(100, 150, 255, 0.3)',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.8)',
          textAlign: 'center',
          whiteSpace: 'nowrap',
          backdropFilter: 'blur(4px)',
          transform: 'translateZ(0)', // Enable hardware acceleration
          letterSpacing: '0.5px',
        }}
      >
        {playerName}
      </div>
    </Html>
  )
}

