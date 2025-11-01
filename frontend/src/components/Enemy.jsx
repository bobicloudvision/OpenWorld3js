import React, { useRef, useEffect, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Box, Text, Sphere, Ring } from '@react-three/drei'
import * as THREE from 'three'
import StatusEffects from './effects/StatusEffects'
import { useAvatarAnimations } from '../hooks/useAvatarAnimations'

export default function Enemy({ enemy, playerPositionRef }) {
  const groupRef = useRef()
  const [currentAnimation, setCurrentAnimation] = useState(enemy.currentAnimation || 'idle')
  
  // Load the 3D model with animations using the hook
  const { clone, updateMixer, getAnimationByName, setAction } = useAvatarAnimations(enemy.model)
  
  // Configure shadows on the model
  useEffect(() => {
    if (clone) {
      clone.traverse((child) => {
        if (child.isMesh) {
          child.castShadow = true
          child.receiveShadow = true
        }
      })
    }
  }, [clone])
  
  const attackRange = 3 // Attack range
  const magicRange = 8 // Magic range
  const detectionRange = 25 // Detection/scanning range
  
  // Helper function to check if enemy has a specific status effect
  const hasStatusEffect = (effectType) => {
    return enemy.statusEffects?.some(effect => effect.type === effectType) || false
  }
  
  // Field of view settings
  const fovAngle = Math.PI * 0.75 // 135 degrees FOV (realistic peripheral vision)
  
  // Update animation when enemy state changes
  useEffect(() => {
    if (enemy.currentAnimation && enemy.currentAnimation !== currentAnimation) {
      const action = getAnimationByName(enemy.currentAnimation)
      if (action) {
        setAction(action, 0.3)
        setCurrentAnimation(enemy.currentAnimation)
      }
    }
  }, [enemy.currentAnimation, currentAnimation, getAnimationByName, setAction])
  
  useFrame((state, delta) => {
    if (!enemy.alive) return
    
    // Update animation mixer
    updateMixer(delta)
    
    // Update group position and rotation to match enemy state from backend
    // Apply Y offset to match Player component offset (accounts for model origin)
    // Player uses -0.94, but enemy models might need different offset
    const MODEL_Y_OFFSET = -0.94 // Match player offset to keep enemies on ground
    if (groupRef.current) {
      groupRef.current.position.set(
        enemy.position[0], 
        enemy.position[1] + MODEL_Y_OFFSET, // Adjust Y to keep on ground
        enemy.position[2]
      )
      // Use facingAngle from backend state
      if (enemy.facingAngle !== undefined) {
        groupRef.current.rotation.y = enemy.facingAngle
      }
    }
  })
  
  if (!enemy.alive) {
    return null
  }
  
  // Use playerVisible from backend state
  const playerVisible = enemy.playerVisible || false
  
  return (
    <group ref={groupRef}>
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
      {clone ? (
        <group 
          position={[0, 0, 0]} 
          rotation={enemy.modelRotation || [0, -Math.PI / 2, 0]}
        >
          <primitive 
            object={clone} 
            scale={enemy.modelScale || 1}
          />
        </group>
      ) : (
        <Box
          args={[1, 2, 1]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial 
            color={
              hasStatusEffect('freeze') ? '#00ffff' : // Cyan when frozen
              hasStatusEffect('poison') ? '#88ff00' : // Green when poisoned
              hasStatusEffect('slow') ? '#8844ff' : // Purple when slowed
              enemy.type === 'melee' ? '#8B4513' : 
              enemy.type === 'caster' ? '#4B0082' : 
              '#2F4F4F'
            }
          />
        </Box>
      )}
      
      <StatusEffects statusEffects={enemy.statusEffects} />
      
      {/* Eyes - two glowing spheres on front of body */}
      <group position={[0.45, 0.3, 0]}>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00" 
            emissiveIntensity={playerVisible ? 2.0 : 0.5}
          />
        </mesh>
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.08, 16, 16]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00" 
            emissiveIntensity={playerVisible ? 2.0 : 0.5}
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
          color={playerVisible ? "#ff4444" : "#4444ff"} 
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
      {enemy.magicTypes && enemy.magicTypes.length > 0 && (
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
        if (!playerPosition) return null
        
        const distance = Math.sqrt(
          Math.pow(groupRef.current.matrixWorld.elements[12] - playerPosition[0], 2) +
          Math.pow(groupRef.current.matrixWorld.elements[14] - playerPosition[2], 2)
        )
        const roundedDistance = Math.round(distance * 10) / 10
        
        let textColor = "yellow"
        let textContent = ""
        let aiState = ""
        
        if (!playerVisible) {
          textColor = "cyan"
          aiState = "SCANNING"
          textContent = `${aiState} (${roundedDistance}m)`
        } else if (distance <= attackRange) {
          textColor = "red"
          aiState = "ATTACKING"
          textContent = `👁️ ${aiState} (${roundedDistance}m)`
        } else if (distance <= magicRange && enemy.magicTypes && enemy.magicTypes.length > 0) {
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
