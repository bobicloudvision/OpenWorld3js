import React from 'react'
import { Sphere, Text } from '@react-three/drei'

function hasEffect(effects, type) {
  return effects?.some((e) => e.type === type)
}

export default function PoisonEffect({ statusEffects }) {
  if (!hasEffect(statusEffects, 'poison')) return null

  return (
    <group>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Sphere
          key={i}
          args={[0.1, 8, 8]}
          position={[
            Math.cos(i * Math.PI / 4 + Date.now() / 1000) * 0.6,
            1 + Math.sin(Date.now() / 800 + i) * 0.5,
            Math.sin(i * Math.PI / 4 + Date.now() / 1000) * 0.6
          ]}
        >
          <meshBasicMaterial 
            color="#88ff00"
            transparent
            opacity={0.6}
          />
        </Sphere>
      ))}

      <Text
        position={[0, 3.5, 0]}
        fontSize={0.3}
        color="#88ff00"
        anchorX="center"
        anchorY="middle"
      >
        ☠️ POISONED
      </Text>
    </group>
  )
}


