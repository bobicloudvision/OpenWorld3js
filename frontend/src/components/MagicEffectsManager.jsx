import React from 'react'
import MagicEffect from './MagicEffect'
import { useEffectsStore } from '../stores/effectsStore'

export default function MagicEffectsManager() {
  const effects = useEffectsStore((s) => s.effects)
  const removeEffect = useEffectsStore((s) => s.removeEffect)

  return (
    <>
      {effects.map(effect => (
        <MagicEffect
          key={effect.id}
          position={effect.position}
          magicType={effect.magicType}
          duration={effect.duration}
          radius={effect.radius}
          onComplete={() => removeEffect(effect.id)}
        />
      ))}
    </>
  )
}
