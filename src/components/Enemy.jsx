import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Box, Text } from '@react-three/drei'
import useGameStore from '../stores/gameStore'

export default function Enemy({ enemy, playerPosition }) {
  const meshRef = useRef()
  const { enemyAttackPlayer } = useGameStore()
  
  const attackRange = 3 // Attack range
  const magicRange = 8 // Magic range
  
  useFrame((state, delta) => {
    if (!enemy.alive) return
    
    // Calculate distance to player (inside useFrame so it updates)
    const distanceToPlayer = Math.sqrt(
      Math.pow(enemy.position[0] - playerPosition[0], 2) +
      Math.pow(enemy.position[2] - playerPosition[2], 2)
    )
    
    const now = Date.now()
    
    // Debug logging every 2 seconds
    if (now % 2000 < 50) {
      // console.log(`Enemy ${enemy.id} (${enemy.name}) - Distance: ${distanceToPlayer.toFixed(2)}m, Attack Range: ${attackRange}m, Magic Range: ${magicRange}m`)
      // console.log(`Enemy pos: [${enemy.position[0]}, ${enemy.position[2]}], Player pos: [${playerPosition[0]}, ${playerPosition[2]}]`)
    }
    
    // Enemy AI behavior
    if (distanceToPlayer <= attackRange) {
      // In melee range - attack
      if (now - enemy.lastAttack > enemy.attackCooldown) {
        const damage = Math.max(1, enemy.attack - 5) // Basic damage calculation
        console.log(`Enemy ${enemy.id} attacking player! Distance: ${distanceToPlayer.toFixed(2)}m, Damage: ${damage}`)
        enemyAttackPlayer(enemy.id, damage)
        
        // Update enemy's last attack time
        useGameStore.setState((state) => ({
          enemies: state.enemies.map(e => 
            e.id === enemy.id 
              ? { ...e, lastAttack: now }
              : e
          )
        }))
      }
    } else if (distanceToPlayer <= magicRange && enemy.magicTypes.length > 0) {
      // In magic range - cast magic (simplified)
      if (now - enemy.lastAttack > enemy.attackCooldown) {
        const magicDamage = Math.max(1, enemy.attack + 5) // Magic damage calculation
        console.log(`Enemy ${enemy.id} casting magic! Distance: ${distanceToPlayer.toFixed(2)}m, Damage: ${magicDamage}`)
        enemyAttackPlayer(enemy.id, magicDamage)
        
        // Update enemy's last attack time
        useGameStore.setState((state) => ({
          enemies: state.enemies.map(e => 
            e.id === enemy.id 
              ? { ...e, lastAttack: now }
              : e
          )
        }))
      }
    }
  })
  
  if (!enemy.alive) {
    return null
  }
  
  return (
    <group position={enemy.position}>
      {/* Debug: Show actual enemy position */}
      <Text
        position={[0, 4, 0]}
        fontSize={0.15}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        Actual: [{enemy.position[0]}, {enemy.position[2]}]
      </Text>
      
      {/* Enemy body */}
      <Box
        ref={meshRef}
        args={[1, 2, 1]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial 
          color={enemy.type === 'melee' ? '#8B4513' : enemy.type === 'caster' ? '#4B0082' : '#2F4F4F'}
        />
      </Box>
      
      {/* Health bar */}
      <group position={[0, 1.5, 0]}>
        <Box args={[1.2, 0.1, 0.1]} position={[0, 0, 0]}>
          <meshBasicMaterial color="#ff0000" />
        </Box>
        <Box args={[1.2 * (enemy.health / enemy.maxHealth), 0.1, 0.1]} position={[0, 0, 0.01]}>
          <meshBasicMaterial color="#00ff00" />
        </Box>
      </group>
      
      {/* Enemy name */}
      <Text
        position={[0, 2.5, 0]}
        fontSize={0.3}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {enemy.name}
      </Text>
      
      {/* Power bar */}
      <group position={[0, 1.3, 0]}>
        <Box args={[1.2, 0.05, 0.1]} position={[0, 0, 0]}>
          <meshBasicMaterial color="#333333" />
        </Box>
        <Box args={[1.2 * (enemy.power / enemy.maxPower), 0.05, 0.1]} position={[0, 0, 0.01]}>
          <meshBasicMaterial color="#4444ff" />
        </Box>
      </group>
      
      {/* Range indicator (for debugging) */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[attackRange - 0.1, attackRange + 0.1, 32]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
      
      {/* Distance text (for debugging) */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.2}
        color="yellow"
        anchorX="center"
        anchorY="middle"
      >
        {Math.round(Math.sqrt(
          Math.pow(enemy.position[0] - playerPosition[0], 2) +
          Math.pow(enemy.position[2] - playerPosition[2], 2)
        ) * 10) / 10}m
      </Text>
    </group>
  )
}
