import React from 'react'
import { Ring, Text } from '@react-three/drei'
import * as THREE from 'three'

function hasEffect(effects, type) {
  return effects?.some((e) => e.type === type)
}

export default function SlowEffect({ statusEffects }) {
  if (!hasEffect(statusEffects, 'slow')) return null

  return (
    <group>
      {[0, 1, 2].map((i) => (
        <Ring
          key={i}
          args={[0.5 + i * 0.3, 0.6 + i * 0.3, 32]}
          position={[0, 1 + i * 0.3, 0]}
          rotation={[Math.PI / 2, 0, Date.now() / 1000 + i]}
        >
          <meshBasicMaterial 
            color="#8844ff"
            transparent
            opacity={0.4 - i * 0.1}
            side={THREE.DoubleSide}
          />
        </Ring>
      ))}

      <Text
        position={[0, 3.5, 0]}
        fontSize={0.3}
        color="#8844ff"
        anchorX="center"
        anchorY="middle"
      >
        ⏰ SLOWED
      </Text>
    </group>
  )
}


