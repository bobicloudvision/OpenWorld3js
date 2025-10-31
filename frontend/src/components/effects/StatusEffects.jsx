import React from 'react'
import FreezeEffect from './FreezeEffect'
import PoisonEffect from './PoisonEffect'
import SlowEffect from './SlowEffect'

export default function StatusEffects({ statusEffects }) {
  if (!statusEffects || statusEffects.length === 0) return null
  return (
    <group>
      <FreezeEffect statusEffects={statusEffects} />
      <PoisonEffect statusEffects={statusEffects} />
      <SlowEffect statusEffects={statusEffects} />
    </group>
  )
}


