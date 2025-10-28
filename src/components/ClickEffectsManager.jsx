import React, { useState, useEffect, useRef } from 'react'
import ClickEffect from './ClickEffect'

export default function ClickEffectsManager() {
  const [effects, setEffects] = useState([])
  const nextId = useRef(0)

  useEffect(() => {
    // Expose function globally for other components to use
    window.addClickEffect = (position, magicType = null) => {
      console.log('ClickEffectsManager: Adding click effect at', position, magicType ? `(${magicType})` : '(regular)')
      setEffects((prevEffects) => [
        ...prevEffects,
        { id: nextId.current++, position, magicType },
      ])
    }

    return () => {
      delete window.addClickEffect
    }
  }, [])

  const handleEffectComplete = (id) => {
    setEffects((prevEffects) => prevEffects.filter((effect) => effect.id !== id))
  }

  return (
    <>
      {effects.map((effect) => (
        <ClickEffect
          key={effect.id}
          position={effect.position}
          magicType={effect.magicType}
          onComplete={() => handleEffectComplete(effect.id)}
        />
      ))}
    </>
  )
}
