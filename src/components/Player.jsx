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
    
    // Update position when moving or when movement state changes
    if (currentlyMoving && onPositionChange) {
      onPositionChange(getCurrentPosition())
    } else if (!currentlyMoving && isMoving.current && onPositionChange) {
      onPositionChange(getCurrentPosition())
    }
    
    // Track movement state
    isMoving.current = currentlyMoving
    
    // Handle animations: jump > walk > idle
    if (jump && animationActions.current.length > 2) {
      setAction(animationActions.current[2], 1) // jump
    } else if (currentlyMoving && animationActions.current.length > 1) {
      setAction(animationActions.current[1], 1) // walk
    } else {
      setAction(animationActions.current[0], 1) // idle
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

