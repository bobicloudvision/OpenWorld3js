import React, { useState } from 'react'
import MagicEffect from './MagicEffect'

export default function MagicEffectsManager() {
  const [effects, setEffects] = useState([])
  
  const addEffect = (position, magicType, radius = 3) => {
    const id = Date.now() + Math.random()
    const newEffect = {
      id,
      position,
      magicType,
      radius,
      duration: 2000
    }
    
    setEffects(prev => [...prev, newEffect])
    
    // Auto-remove after duration
    setTimeout(() => {
      setEffects(prev => prev.filter(effect => effect.id !== id))
    }, newEffect.duration)
  }
  
  // Expose addEffect globally
  React.useEffect(() => {
    window.addMagicEffect = addEffect
    return () => {
      delete window.addMagicEffect
    }
  }, [])
  
  return (
    <>
      {effects.map(effect => (
        <MagicEffect
          key={effect.id}
          position={effect.position}
          magicType={effect.magicType}
          duration={effect.duration}
          radius={effect.radius}
          onComplete={() => {
            setEffects(prev => prev.filter(e => e.id !== effect.id))
          }}
        />
      ))}
    </>
  )
}
