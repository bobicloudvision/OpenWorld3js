import React, { useRef } from 'react'
import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
 
 
import { useAvatarAnimations } from '../hooks/useAvatarAnimations'

export default function Player({ onPositionReset }) {
  const group = useRef()
  
  // Use shared avatar animations hook
  const { clone, animationActions, setAction, updateMixer } = useAvatarAnimations()
  
  
  
  // Get keyboard controls state
  const [, get] = useKeyboardControls()
  
  const currentAnimation = useRef('idle')
  const lastMovementState = useRef(false)
  const lastJumpState = useRef(false)
  
  useFrame((state, delta) => {
    if (!clone || animationActions.current.length === 0) return
    
    // Update the mixer
    updateMixer(delta)
    
    // Check if any movement keys are pressed
    const { forward, backward, leftward, rightward, jump } = get()
    const isMoving = forward || backward || leftward || rightward
    const isJumping = jump
    
    // Default to appropriate state
    if (isJumping && animationActions.current.length > 2) {
      currentAnimation.current = 'jump'
      setAction(animationActions.current[2], 1)
    } else if (isMoving && animationActions.current.length > 1) {
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
        if (isMoving && animationActions.current.length > 1) {
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
    if (isMoving !== lastMovementState.current) {
      if (isMoving) {
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
      lastMovementState.current = isMoving
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

