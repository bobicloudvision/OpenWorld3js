import React from 'react'
import { Box, Text } from '@react-three/drei'

function getStatusEffect(effects, type) {
  return effects?.find((e) => e.type === type)
}

export default function FreezeEffect({ statusEffects }) {
  const freeze = getStatusEffect(statusEffects, 'freeze')
  if (!freeze) return null

  const isBlizzard = (freeze.duration || 0) >= 5000

  return (
    <group>
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box
          key={i}
          args={[0.2, 0.2, 0.2]}
          position={[
            Math.cos((i * Math.PI) / 3) * 0.8,
            0.5 + Math.sin(Date.now() / 500 + i) * 0.3,
            Math.sin((i * Math.PI) / 3) * 0.8,
          ]}
          rotation={[
            Math.sin(Date.now() / 1000 + i) * 0.5,
            Date.now() / 1000 + i,
            Math.cos(Date.now() / 1000 + i) * 0.5,
          ]}
        >
          <meshStandardMaterial
            color="#00ffff"
            transparent
            opacity={0.7}
            emissive="#00ffff"
            emissiveIntensity={0.5}
          />
        </Box>
      ))}

      {isBlizzard ? (
        <>
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Box
              key={`blizzard-${i}`}
              args={[0.3, 0.3, 0.3]}
              position={[
                Math.cos((i * Math.PI) / 4.5) * 1.2,
                0.8 + Math.sin(Date.now() / 300 + i) * 0.4,
                Math.sin((i * Math.PI) / 4.5) * 1.2,
              ]}
              rotation={[
                Math.sin(Date.now() / 800 + i) * 0.8,
                Date.now() / 800 + i,
                Math.cos(Date.now() / 800 + i) * 0.8,
              ]}
            >
              <meshStandardMaterial
                color="#88ddff"
                transparent
                opacity={0.8}
                emissive="#88ddff"
                emissiveIntensity={0.7}
              />
            </Box>
          ))}

          <Text position={[0, 4, 0]} fontSize={0.4} color="#88ddff" anchorX="center" anchorY="middle">
            ❄️ BLIZZARD
          </Text>
        </>
      ) : (
        <Text position={[0, 3.5, 0]} fontSize={0.3} color="#00ffff" anchorX="center" anchorY="middle">
          ❄️ FROZEN
        </Text>
      )}
    </group>
  )
}


