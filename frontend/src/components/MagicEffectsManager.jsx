import React from 'react'
import MagicEffect from './MagicEffect'
import { useEffectsStore } from '../stores/effectsStore'
import StatusEffects from './effects/StatusEffects'

export default function MagicEffectsManager() {
  const effects = useEffectsStore((s) => s.effects)
  const removeEffect = useEffectsStore((s) => s.removeEffect)

  return (
    <>
      {effects.map(effect => (
        <group key={effect.id}>
          <MagicEffect
            position={effect.position}
            magicType={effect.magicType}
            duration={effect.duration}
            radius={effect.radius}
            onComplete={() => removeEffect(effect.id)}
          />
          {(['freeze', 'blizzard', 'poison', 'slow'].includes(effect.magicType)) && (
            <group position={[effect.position[0], effect.position[1], effect.position[2]]}>
              <StatusEffects
                statusEffects={[
                  effect.magicType === 'blizzard'
                    ? { type: 'freeze', duration: Math.max(5000, effect.duration || 5000), appliedAt: Date.now() }
                    : { type: effect.magicType, duration: effect.duration || 2000, appliedAt: Date.now() }
                ]}
              />
            </group>
          )}
        </group>
      ))}
    </>
  )
}
