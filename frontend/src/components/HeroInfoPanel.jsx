import React from 'react'

export default function HeroInfoPanel({ activeHero }) {
  if (!activeHero) {
    return (
      <div style={{
        position: 'fixed',
        top: 80,
        left: 20,
        zIndex: 1000,
        background: 'rgba(17, 24, 39, 0.85)',
        padding: '15px',
        borderRadius: '8px',
        border: '1px solid #374151',
        color: '#e5e7eb',
        fontSize: '14px',
        pointerEvents: 'auto'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          No Hero
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: 80,
      left: 20,
      zIndex: 1000,
      background: 'rgba(17, 24, 39, 0.85)',
      padding: '15px',
      borderRadius: '8px',
      border: '1px solid #374151',
      color: '#e5e7eb',
      fontSize: '14px',
      pointerEvents: 'auto'
    }}>
      {/* Hero Name */}
      <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
        {activeHero.heroName || 'Unknown Hero'}
      </div>

      {/* Hero Level */}
      <div style={{ color: '#fbbf24', fontSize: '12px' }}>
        Level {activeHero.level || 1}
      </div>

      {/* Health */}
      <div style={{ fontSize: '12px', marginTop: '8px' }}>
        <span style={{ color: '#9ca3af' }}>Health: </span>
        <span style={{ color: '#ef4444', fontWeight: 'bold' }}>
          {activeHero.health || 0}
        </span>
        <span style={{ color: '#9ca3af' }}> / </span>
        <span style={{ color: '#ef4444' }}>{activeHero.maxHealth || 0}</span>
      </div>

      {/* Power */}
      <div style={{ fontSize: '12px' }}>
        <span style={{ color: '#9ca3af' }}>Power: </span>
        <span style={{ color: '#3b82f6', fontWeight: 'bold' }}>
          {activeHero.power || 0}
        </span>
        <span style={{ color: '#9ca3af' }}> / </span>
        <span style={{ color: '#3b82f6' }}>{activeHero.maxPower || 0}</span>
      </div>

      {/* Combat Stats */}
      <div style={{ color: '#9ca3af', fontSize: '12px', marginTop: '4px' }}>
        ATK: {activeHero.attack || 0} | DEF: {activeHero.defense || 0}
      </div>
    </div>
  )
}

