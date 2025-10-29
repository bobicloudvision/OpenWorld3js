import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
import { Box, Text, Sphere, Ring } from '@react-three/drei'
import * as THREE from 'three'
import useGameStore from '../stores/gameStore'

export default function Enemy({ enemy, playerPositionRef }) {
  const groupRef = useRef()
  const { enemyAttackPlayer, updateStatusEffects } = useGameStore()
  const [poisonTickTime, setPoisonTickTime] = useState(0)
  
  const attackRange = 3 // Attack range
  const magicRange = 8 // Magic range
  const detectionRange = 25 // Detection/scanning range
  
  // Helper function to check if enemy has a specific status effect
  const hasStatusEffect = (effectType) => {
    return enemy.statusEffects?.some(effect => effect.type === effectType) || false
  }
  
  // Get status effect data
  const getStatusEffect = (effectType) => {
    return enemy.statusEffects?.find(effect => effect.type === effectType)
  }
  
  // Random wandering state
  const wanderDirection = useRef({
    x: Math.random() * 2 - 1, // Random between -1 and 1
    z: Math.random() * 2 - 1,
    changeTime: Date.now() + Math.random() * 3000 + 2000 // Change direction every 2-5 seconds
  })
  
  // Enemy facing direction (rotation in radians)
  const facingAngle = useRef(Math.random() * Math.PI * 2)
  
  // Track if player is currently visible
  const playerVisibleRef = useRef(false)
  
  // Field of view settings
  const fovAngle = Math.PI * 0.75 // 135 degrees FOV (realistic peripheral vision)
  
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
  const wanderSpeed = movementSpeed * 0.4 // Slower when wandering
  
  // Check if player is in field of view
  const isPlayerInFOV = (enemyPos, playerPos, facingAngle) => {
    // Calculate direction to player
    const toPlayerX = playerPos[0] - enemyPos[0]
    const toPlayerZ = playerPos[2] - enemyPos[2]
    
    // Calculate angle to player
    const angleToPlayer = Math.atan2(toPlayerZ, toPlayerX)
    
    // Calculate angle difference (normalized to -PI to PI)
    let angleDiff = angleToPlayer - facingAngle
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2
    
    // Check if player is within FOV cone
    return Math.abs(angleDiff) <= fovAngle / 2
  }
  
  useFrame((state, delta) => {
    if (!enemy.alive) return
    
    const playerPosition = playerPositionRef.current
    const distanceToPlayer = Math.sqrt(
      Math.pow(enemy.position[0] - playerPosition[0], 2) +
      Math.pow(enemy.position[2] - playerPosition[2], 2)
    )
    
    const now = Date.now()
    
    // Update status effects (remove expired ones)
    updateStatusEffects()
    
    // Check for freeze effect
    const isFrozen = hasStatusEffect('freeze')
    
    // Check for slow effect
    const slowEffect = getStatusEffect('slow')
    const slowMultiplier = slowEffect ? (1 - (slowEffect.slowPercent || 50) / 100) : 1
    
    // Handle poison damage over time
    const poisonEffect = getStatusEffect('poison')
    if (poisonEffect && now - poisonTickTime >= (poisonEffect.tickRate || 1000)) {
      const poisonDamage = poisonEffect.tickDamage || 5
      useGameStore.setState((state) => ({
        enemies: state.enemies.map(e => 
          e.id === enemy.id 
            ? { 
                ...e, 
                health: Math.max(0, e.health - poisonDamage),
                alive: e.health - poisonDamage > 0
              }
            : e
        ),
        combatLog: [
          ...state.combatLog.slice(-9),
          { 
            type: 'damage', 
            message: `Enemy ${enemy.id} takes ${poisonDamage} poison damage`,
            timestamp: now
          }
        ]
      }))
      setPoisonTickTime(now)
    }
    
    // If frozen, skip all movement and actions
    if (isFrozen) {
      return
    }
    
    // Check if player is visible (in FOV and within detection range)
    const playerVisible = distanceToPlayer <= detectionRange && 
                          isPlayerInFOV(enemy.position, playerPosition, facingAngle.current)
    
    // Store for use in render
    playerVisibleRef.current = playerVisible
    
    // Debug logging every 2 seconds
    if (now % 2000 < 50) {
      // console.log(`Enemy ${enemy.id} (${enemy.name}) - Distance: ${distanceToPlayer.toFixed(2)}m, Attack Range: ${attackRange}m, Magic Range: ${magicRange}m`)
      // console.log(`Enemy world pos: [${enemy.position[0].toFixed(2)}, ${enemy.position[2].toFixed(2)}], Player pos: [${playerPosition[0].toFixed(2)}, ${playerPosition[2].toFixed(2)}]`)
    }
    
    // Enemy AI behavior with scanning and movement
    if (playerVisible) {
      // Player detected by eyes - scan and react
      
      if (distanceToPlayer <= attackRange) {
        // In melee range - stop and attack, face player
        const angleToPlayer = Math.atan2(
          playerPosition[2] - enemy.position[2],
          playerPosition[0] - enemy.position[0]
        )
        facingAngle.current = angleToPlayer
        
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
        // In magic range - stop and cast magic, face player
        const angleToPlayer = Math.atan2(
          playerPosition[2] - enemy.position[2],
          playerPosition[0] - enemy.position[0]
        )
        facingAngle.current = angleToPlayer
        
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
        // Move towards player (chasing)
        const directionX = playerPosition[0] - enemy.position[0]
        const directionZ = playerPosition[2] - enemy.position[2]
        const magnitude = Math.sqrt(directionX * directionX + directionZ * directionZ)
        
        if (magnitude > 0) {
          // Update facing direction to movement direction
          facingAngle.current = Math.atan2(directionZ, directionX)
          
          // Normalize direction
          const normalizedX = directionX / magnitude
          const normalizedZ = directionZ / magnitude
          
          // Calculate movement (apply slow effect)
          const moveX = normalizedX * movementSpeed * slowMultiplier * delta
          const moveZ = normalizedZ * movementSpeed * slowMultiplier * delta
          
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
    } else {
      // Player not detected - wander randomly to scan terrain
      
      // Change wander direction periodically
      if (now >= wanderDirection.current.changeTime) {
        wanderDirection.current = {
          x: Math.random() * 2 - 1, // Random between -1 and 1
          z: Math.random() * 2 - 1,
          changeTime: now + Math.random() * 3000 + 2000 // Change direction every 2-5 seconds
        }
      }
      
      // Normalize wander direction
      const magnitude = Math.sqrt(
        wanderDirection.current.x * wanderDirection.current.x +
        wanderDirection.current.z * wanderDirection.current.z
      )
      
      if (magnitude > 0) {
        const normalizedX = wanderDirection.current.x / magnitude
        const normalizedZ = wanderDirection.current.z / magnitude
        
        // Update facing direction to wander direction
        facingAngle.current = Math.atan2(normalizedZ, normalizedX)
        
        // Calculate wandering movement (apply slow effect)
        const moveX = normalizedX * wanderSpeed * slowMultiplier * delta
        const moveZ = normalizedZ * wanderSpeed * slowMultiplier * delta
        
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
  })
  
  if (!enemy.alive) {
    return null
  }
  
  return (
    <group ref={groupRef} position={enemy.position} rotation={[0, facingAngle.current, 0]}>
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
s          color={
            hasStatusEffect('freeze') ? '#00ffff' : // Cyan when frozen
            hasStatusEffect('poison') ? '#88ff00' : // Green when poisoned
            hasStatusEffect('slow') ? '#8844ff' : // Purple when slowed
            enemy.type === 'melee' ? '#8B4513' : 
            enemy.type === 'caster' ? '#4B0082' : 
            '#2F4F4F'
          }
        />
      </Box>
      
      {/* Freeze effect - Ice crystals */}
      {hasStatusEffect('freeze') && (
        <group>
          {/* Ice cubes around enemy */}
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Box
              key={i}
              args={[0.2, 0.2, 0.2]}
              position={[
                Math.cos(i * Math.PI / 3) * 0.8,
                0.5 + Math.sin(Date.now() / 500 + i) * 0.3,
                Math.sin(i * Math.PI / 3) * 0.8
              ]}
              rotation={[
                Math.sin(Date.now() / 1000 + i) * 0.5,
                Date.now() / 1000 + i,
                Math.cos(Date.now() / 1000 + i) * 0.5
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
          
          {/* Blizzard effect - Bigger ice crystals */}
          {getStatusEffect('freeze')?.appliedAt && (() => {
            const freezeEffect = getStatusEffect('freeze')
            // Check if this was applied by blizzard (longer duration = blizzard)
            const isBlizzard = freezeEffect.duration >= 5000
            
            if (isBlizzard) {
              return (
                <>
                  {/* Additional larger ice crystals for blizzard */}
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                    <Box
                      key={`blizzard-${i}`}
                      args={[0.3, 0.3, 0.3]}
                      position={[
                        Math.cos(i * Math.PI / 4.5) * 1.2,
                        0.8 + Math.sin(Date.now() / 300 + i) * 0.4,
                        Math.sin(i * Math.PI / 4.5) * 1.2
                      ]}
                      rotation={[
                        Math.sin(Date.now() / 800 + i) * 0.8,
                        Date.now() / 800 + i,
                        Math.cos(Date.now() / 800 + i) * 0.8
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
                  
                  {/* Blizzard indicator text */}
                  <Text
                    position={[0, 4, 0]}
                    fontSize={0.4}
                    color="#88ddff"
                    anchorX="center"
                    anchorY="middle"
                  >
                    ❄️ BLIZZARD
                  </Text>
                </>
              )
            } else {
              return (
                <Text
                  position={[0, 3.5, 0]}
                  fontSize={0.3}
                  color="#00ffff"
                  anchorX="center"
                  anchorY="middle"
                >
                  ❄️ FROZEN
                </Text>
              )
            }
          })()}
        </group>
      )}
      
      {/* Poison effect - Toxic particles */}
      {hasStatusEffect('poison') && (
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
          
          {/* Poison indicator text */}
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
      )}
      
      {/* Slow effect - Time distortion rings */}
      {hasStatusEffect('slow') && (
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
          
          {/* Slow indicator text */}
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
      )}
      
      {/* Eyes - two glowing spheres on front of body */}
      <group position={[0.45, 0.3, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00" 
            emissiveIntensity={playerVisibleRef.current ? 2.0 : 0.5}
          />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00" 
            emissiveIntensity={playerVisibleRef.current ? 2.0 : 0.5}
          />
        </mesh>
      </group>
      
      {/* Vision cone visualization - rotated to point forward (along X axis) */}
      <mesh position={[detectionRange / 2, 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <coneGeometry args={[
          detectionRange * Math.tan(fovAngle / 2), // radius at base
          detectionRange, // height (length of vision)
          32, // radial segments
          1, // height segments
          false, // open ended
          -fovAngle / 2, // theta start
          fovAngle // theta length (FOV arc)
        ]} />
        <meshBasicMaterial 
          color={playerVisibleRef.current ? "#ff4444" : "#4444ff"} 
          transparent 
          opacity={0.15} 
          side={THREE.DoubleSide}
        />
      </mesh>
      
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
        
        if (!playerVisibleRef.current) {
          textColor = "cyan"
          aiState = "SCANNING"
          textContent = `${aiState} (${roundedDistance}m)`
        } else if (distance <= attackRange) {
          textColor = "red"
          aiState = "ATTACKING"
          textContent = `👁️ ${aiState} (${roundedDistance}m)`
        } else if (distance <= magicRange && enemy.magicTypes.length > 0) {
          textColor = "orange"
          aiState = "CASTING"
          textContent = `👁️ ${aiState} (${roundedDistance}m)`
        } else {
          textColor = "lime"
          aiState = "CHASING"
          textContent = `👁️ ${aiState} (${roundedDistance}m)`
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
