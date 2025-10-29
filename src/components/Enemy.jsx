import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Box, Text } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../stores/gameStore'

export default function Enemy({ enemy, playerPositionRef }) {
  const groupRef = useRef()
  const { enemyAttackPlayer } = useGameStore()
  
  const attackRange = 3 // Attack range
  const magicRange = 8 // Magic range
  const detectionRange = 25 // Detection/scanning range
  
  // Movement speed based on enemy type
  const getMovementSpeed = (enemyType) => {
    switch(enemyType) {
      case 'melee': return 2.5 // Fast melee
      case 'caster': return 1.5 // Slow caster
      case 'tank': return 1.8 // Medium tank
      default: return 2.0
    }
  }
  
  const movementSpeed = getMovementSpeed(enemy.type)
  
  useFrame((state, delta) => {
    if (!enemy.alive) return
    
    const playerPosition = playerPositionRef.current
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
    
    // Enemy AI behavior with scanning and movement
    if (distanceToPlayer <= detectionRange) {
      // Player detected - scan and react
      
      if (distanceToPlayer <= attackRange) {
        // In melee range - stop and attack
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
        // In magic range - stop and cast magic
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
      } else {
        // Move towards player
        const directionX = playerPosition[0] - enemy.position[0]
        const directionZ = playerPosition[2] - enemy.position[2]
        const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ)
        
        if (magnitude > 0) {
          // Normalize direction
          const normalizedX = directionX / magnitude
          const normalizedZ = directionZ / magnitude
          
          // Calculate movement
          const moveX = normalizedX * movementSpeed * delta
          const moveZ = normalizedZ * movementSpeed * delta
          
          // Update enemy position in store
          const newPosition = [
            enemy.position[0] + moveX,
            enemy.position[1],
            enemy.position[2] + moveZ
          ]
          
          useGameStore.setState((state) => ({
            enemies: state.enemies.map(e => 
              e.id === enemy.id 
                ? { ...e, position: newPosition }
                : e
            )
          }))
        }
      }
    }
    // If player is outside detection range, enemy stays idle
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
      
      {/* Attack range indicator (for debugging) */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[attackRange - 0.1, attackRange + 0.1, 32]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.3} />
      </mesh>
      
      {/* Magic range indicator (for debugging) */}
      {enemy.magicTypes.length > 0 && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[magicRange - 0.1, magicRange + 0.1, 32]} />
          <meshBasicMaterial color="#ff8800" transparent opacity={0.2} />
        </mesh>
      )}
      
      {/* Detection range indicator (for debugging) */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[detectionRange - 0.2, detectionRange + 0.2, 64]} />
        <meshBasicMaterial color="#44aaff" transparent opacity={0.15} />
      </mesh>
      
      {/* Distance and AI state text (for debugging) */}
      {groupRef.current && (() => {
        const playerPosition = playerPositionRef.current
        const distance = Math.sqrt(
          Math.pow(groupRef.current.matrixWorld.elements[12] - playerPosition[0], 2) +
          Math.pow(groupRef.current.matrixWorld.elements[14] - playerPosition[2], 2)
        )
        const roundedDistance = Math.round(distance * 10) / 10
        
        let textColor = "yellow"
        let textContent = ""
        let aiState = ""
        
        if (distance > detectionRange) {
          textColor = "gray"
          aiState = "IDLE"
          textContent = `${aiState} (${roundedDistance}m)`
        } else if (distance <= attackRange) {
          textColor = "red"
          aiState = "ATTACKING"
          textContent = `${aiState} (${roundedDistance}m)`
        } else if (distance <= magicRange && enemy.magicTypes.length > 0) {
          textColor = "orange"
          aiState = "CASTING"
          textContent = `${aiState} (${roundedDistance}m)`
        } else {
          textColor = "lime"
          aiState = "CHASING"
          textContent = `${aiState} (${roundedDistance}m)`
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
