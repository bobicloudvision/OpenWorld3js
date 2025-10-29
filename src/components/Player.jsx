import React, { useRef } from 'react'
import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
 
import { useAvatarAnimations } from '../hooks/useAvatarAnimations'

export default function Player({ onPositionChange }) {
  const group = useRef()
  
  // Use shared avatar animations hook
  const { clone, animationActions, setAction, updateMixer } = useAvatarAnimations()
  
  // Get keyboard controls state
  const [, get] = useKeyboardControls()
  
  const currentAnimation = useRef('idle')
  const lastMovementState = useRef(false)
  const lastJumpState = useRef(false)
  const lastPosition = useRef([0, 0, 0])
  const isMoving = useRef(false)
  
  // Function to get current player position
  const getCurrentPosition = () => {
    if (!group.current) return [0, 0, 0]
    const worldPosition = new THREE.Vector3()
    worldPosition.setFromMatrixPosition(group.current.matrixWorld)
    return [worldPosition.x, worldPosition.y, worldPosition.z]
  }
  
  useFrame((state, delta) => {
    if (!clone || animationActions.current.length === 0) return
    
    // Update the mixer
    updateMixer(delta)
    
    // Check if any movement keys are pressed
    const { forward, backward, leftward, rightward, jump } = get()
    const currentlyMoving = forward || backward || leftward || rightward
    const isJumping = jump
    
    // Update position when moving or when movement state changes
    if (currentlyMoving && onPositionChange) {
      // Update position continuously while moving
      const newPosition = getCurrentPosition()
      lastPosition.current = newPosition
      onPositionChange(newPosition)
    } else if (!currentlyMoving && isMoving.current && onPositionChange) {
      // Update position when stopping movement
      const newPosition = getCurrentPosition()
      lastPosition.current = newPosition
      onPositionChange(newPosition)
      console.log(`Player stopped moving: [${newPosition[0].toFixed(2)}, ${newPosition[1].toFixed(2)}, ${newPosition[2].toFixed(2)}]`)
    }
    
    // Track movement state changes
    if (currentlyMoving !== isMoving.current) {
      isMoving.current = currentlyMoving
      if (currentlyMoving) {
        console.log(`Player started moving`)
      }
    }
    
    // Default to appropriate state
    if (isJumping && animationActions.current.length > 2) {
      currentAnimation.current = 'jump'
      setAction(animationActions.current[2], 1)
    } else if (currentlyMoving && animationActions.current.length > 1) {
      currentAnimation.current = 'walk'
      setAction(animationActions.current[1], 1)
    } else {
      currentAnimation.current = 'idle'
      setAction(animationActions.current[0], 1)
    }
    // Handle jump animation transitions
    if (isJumping !== lastJumpState.current) {
      if (isJumping && animationActions.current.length > 2) {
        // Switch to jump animation (third animation)
        currentAnimation.current = 'jump'
        setAction(animationActions.current[2], 1)
      } else if (!isJumping) {
        // Return to previous state when jump ends
        if (currentlyMoving && animationActions.current.length > 1) {
          currentAnimation.current = 'walk'
          setAction(animationActions.current[1], 1)
        } else {
          currentAnimation.current = 'idle'
          setAction(animationActions.current[0], 1)
        }
      }
      lastJumpState.current = isJumping
    }
    // Handle movement animations
    if (currentlyMoving !== lastMovementState.current) {
      if (currentlyMoving) {
        // Switch to walk animation
        if (animationActions.current.length > 1) {
          currentAnimation.current = 'walk'
          setAction(animationActions.current[1], 1)
        }
      } else {
        // Player stopped moving - switch to idle
        currentAnimation.current = 'idle'
        setAction(animationActions.current[0], 1)
      }
      lastMovementState.current = currentlyMoving
    }
    
  })
  

  return (
    <group ref={group} position={[0, -0.94, 0]}>
      <primitive 
        object={clone} 
        castShadow 
        receiveShadow
        scale={1} 
      />
    </group>
  )
}

