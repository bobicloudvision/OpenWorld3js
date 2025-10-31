import React, { useEffect } from 'react'
import useGameStore from '../stores/gameStore'

export default function MagicPalette({ activeHero }) {
  const { 
    player, 
    magicTypes, 
    setMagicTypes,
    castingMode, 
    enterCastingMode, 
    exitCastingMode,
    castMagicAtPosition,
    targetPosition,
    setTargetPosition,
    healPlayer,
    attackEnemy,
    enemies
  } = useGameStore()
  
  // Sync magic types with active hero's spells
  useEffect(() => {
    if (activeHero && Array.isArray(activeHero.spells)) {
      const mapped = activeHero.spells.reduce((acc, s) => {
        acc[s.key] = {
          name: s.name,
          damage: s.damage,
          powerCost: s.powerCost,
          cooldown: s.cooldown,
          color: s.color || '#ffffff',
          description: s.description || '',
          range: s.range ?? 10,
          affectRange: s.affectRange ?? 0,
          icon: s.icon || '✨' 
        }
        return acc
      }, {})
      setMagicTypes(mapped)
    }
  }, [activeHero, setMagicTypes])
  
  const handleMagicClick = (magicType) => {
    if (castingMode) {
      exitCastingMode()
    } else {
      enterCastingMode(magicType)
    }
  }
  
  
  const getCooldownProgress = (magicType) => {
    const magic = magicTypes[magicType]
    const cooldownTime = player.magicCooldowns[magicType]
    const now = Date.now()
    const remaining = Math.max(0, magic.cooldown - (now - cooldownTime))
    return Math.max(0, 1 - (remaining / magic.cooldown))
  }
  
  const isOnCooldown = (magicType) => {
    const magic = magicTypes[magicType]
    const cooldownTime = player.magicCooldowns[magicType]
    const now = Date.now()
    return (now - cooldownTime) < magic.cooldown
  }
  
  const canAfford = (magicType) => {
    return player.power >= magicTypes[magicType].powerCost
  }
  
  const getBorderColor = (magicType) => {
    const magic = magicTypes[magicType]
    const opacity = canAfford(magicType) ? 0.3 : 0.1
    
    // Convert hex color to rgba with opacity
    const color = magic.color
    if (color.startsWith('#')) {
      const hex = color.replace('#', '')
      const r = parseInt(hex.substring(0, 2), 16)
      const g = parseInt(hex.substring(2, 4), 16)
      const b = parseInt(hex.substring(4, 6), 16)
      return `rgba(${r}, ${g}, ${b}, ${opacity})`
    }
    // If already rgb/rgba, modify opacity
    if (color.startsWith('rgb')) {
      return color.replace(/rgba?\(([^)]+)\)/, (match, values) => {
        const parts = values.split(',').map(v => v.trim())
        return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, ${opacity})`
      })
    }
    return color
  }
  
  return (
    <>
      {/* Magic Palette */}
      <div className="magic-palette">
        <div className="palette-row">
          {Object.entries(magicTypes).map(([key, magic]) => (
            <div
              key={key}
              className={`magic-slot ${castingMode && player.selectedMagic === key ? 'casting' : ''} ${!canAfford(key) ? 'insufficient-power' : ''}`}
              onClick={() => handleMagicClick(key)}
              style={{ 
                border: `2px solid ${getBorderColor(key)}`,
                opacity: canAfford(key) ? 1 : 0.5
              }}
            >
              <div className="magic-icon">
                {typeof magic.icon === 'string' && (magic.icon.startsWith('/') || magic.icon.startsWith('http'))
                  ? (
                    <img src={magic.icon} alt={magic.name} style={{ width: 24, height: 24 }} />
                  ) : (
                    magic.icon
                  )}
              </div>
              <div className="magic-hotkey">{Object.keys(magicTypes).indexOf(key) + 1}</div>
              
              {/* Cooldown overlay */}
              {isOnCooldown(key) && (
                <div 
                  className="cooldown-overlay"
                  style={{
                    background: `conic-gradient(from 0deg, transparent 0deg, rgba(0,0,0,0.7) ${getCooldownProgress(key) * 360}deg, transparent ${getCooldownProgress(key) * 360}deg)`
                  }}
                />
              )}
              
              {/* Power cost indicator */}
              <div className="power-cost">{magic.powerCost}</div>
            </div>
          ))}
        </div>
        
        {/* Casting indicator */}
        {castingMode && (
          <div className="casting-indicator">
            <div className="casting-text">
              Click anywhere to cast {magicTypes[player.selectedMagic].name} around you
            </div>
            <div className="casting-range">
              Range: {magicTypes[player.selectedMagic].range}m
            </div>
            <button className="cancel-cast" onClick={exitCastingMode}>
              Cancel (ESC)
            </button>
          </div>
        )}
      </div>
    </>
  )
}
