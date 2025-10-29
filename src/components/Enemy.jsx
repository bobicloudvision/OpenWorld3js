import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Box, Text } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../stores/gameStore'

export default function Enemy({ enemy, playerPosition }) {
  const groupRef = useRef()
  const { enemyAttackPlayer } = useGameStore()
  
  const attackRange = 3 // Attack range
  const magicRange = 8 // Magic range
  
  useFrame((state, delta) => {
    if (!enemy.alive) return
    
    const distanceToPlayer = Math.sqrt(
      Math.pow(enemy.position[0] - playerPosition[0], 2) +
      Math.pow(enemy.position[2] - playerPosition[2], 2)
    )
    
    const now = Date.now()
    
    // Debug logging every 2 seconds
    if (now % 2000 < 50) {
      // console.log(`Enemy ${enemy.id} (${enemy.name}) - Distance: ${distanceToPlayer.toFixed(2)}m, Attack Range: ${attackRange}m, Magic Range: ${magicRange}m`)
      // console.log(`Enemy world pos: [${enemy.position[0].toFixed(2)}, ${enemy.position[2].toFixed(2)}], Player pos: [${playerPosition[0].toFixed(2)}, ${playerPosition[2].toFixed(2)}]`)
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
    <group ref={groupRef} position={enemy.position}>
      {/* Debug: Show actual enemy position */}
      <Text
        position={[0, 4, 0]}
        fontSize={0.15}
        color="red"
        anchorX="center"
        anchorY="middle"
      >
        World: [{enemy.position[0].toFixed(1)}, {enemy.position[2].toFixed(1)}]
      </Text>
      
      {/* Enemy body */}
      <Box
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
      {groupRef.current && (() => {
        const distance = Math.sqrt(
          Math.pow(groupRef.current.matrixWorld.elements[12] - playerPosition[0], 2) +
          Math.pow(groupRef.current.matrixWorld.elements[14] - playerPosition[2], 2)
        )
        const roundedDistance = Math.round(distance * 10) / 10
        
        let textColor = "yellow"
        let textContent = ""
        
        if (distance <= attackRange) {
          textColor = "red"
          textContent = `VERY CLOSE (${roundedDistance}m)`
        } else if (distance <= magicRange) {
          textColor = "orange"
          textContent = `CLOSE (${roundedDistance}m)`
        } else if (distance <= 15) {
          textColor = "yellow"
          textContent = `NEARBY (${roundedDistance}m)`
        } else {
          textColor = "lightblue"
          textContent = `FAR (${roundedDistance}m)`
        }
        
        return (
          <Text
            position={[0, 3, 0]}
            fontSize={0.2}
            color={textColor}
            anchorX="center"
            anchorY="middle"
          >
            {textContent}
          </Text>
        )
      })()}
    </group>
  )
}
