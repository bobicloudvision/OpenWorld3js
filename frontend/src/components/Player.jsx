import React, { useEffect, useRef } from 'react'
import { useKeyboardControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
 
import { useAvatarAnimations } from '../hooks/useAvatarAnimations'
import useGameStore from '../stores/gameStore'

export default function Player({ onPositionChange, heroModel, heroModelScale, heroModelRotation, socket }) {
  const group = useRef()
  
  // Use shared avatar animations hook with dynamic model path
  // Default to NightshadeJFriedrich if no hero model is provided
  const defaultModel = '/models/avatars/NightshadeJFriedrich.glb'
  const modelPath = heroModel || defaultModel
  const { clone, animationActions, setAction, updateMixer, getAnimationByName } = useAvatarAnimations(modelPath)
  
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
  
  // Function to get current player rotation from world matrix (Ecctrl's rotation)
  // We need to get the rotation without the model offset since we apply that separately
  const getCurrentRotation = () => {
    if (!group.current) return [0, 0, 0]
    
    // Get world rotation from matrixWorld
    const worldRotation = new THREE.Euler()
    worldRotation.setFromRotationMatrix(group.current.matrixWorld)
    
    // Remove local rotation (model offset) to get just the controller rotation
    const modelRot = heroModelRotation ?? [0, 0, 0]
    const localRotation = new THREE.Euler(...modelRot, 'XYZ')
    const localQuat = new THREE.Quaternion().setFromEuler(localRotation)
    const worldQuat = new THREE.Quaternion().setFromEuler(worldRotation)
    
    // Subtract local rotation: controllerRot = worldRot * inverse(localRot)
    const controllerQuat = worldQuat.multiply(localQuat.invert())
    const controllerEuler = new THREE.Euler().setFromQuaternion(controllerQuat, 'XYZ')
    
    return [controllerEuler.x, controllerEuler.y, controllerEuler.z]
  }
  
  const attackUntil = useRef(0)
  const playerAttackingAt = useGameStore((s) => s.playerAttackingAt)
  const lastPositionUpdate = useRef(0)
  const lastSentPosition = useRef(null)
  const lastSentRotation = useRef(null)
  const POSITION_UPDATE_INTERVAL = 100 // Send position updates every 100ms
  const POSITION_THRESHOLD = 0.1 // Minimum distance change to send update
  const ROTATION_THRESHOLD = 0.1 // Minimum rotation change (in radians) to send update

  useEffect(() => {
    if (!playerAttackingAt) return
    attackUntil.current = Date.now() + 700 // play attack for ~0.7s
    setAction(animationActions.current[3], 0.1)
  }, [playerAttackingAt, setAction])

  useFrame((state, delta) => {
    if (!clone || animationActions.current.length === 0) return
    
    // Update the mixer
    updateMixer(delta)
    
    // If currently in attack window, force attack animation
    if (Date.now() < attackUntil.current) {
      setAction(animationActions.current[3], 0.05)
      return
    }

    // Check if any movement keys are pressed
    const { forward, backward, leftward, rightward, jump } = get()
    const currentlyMoving = forward || backward || leftward || rightward
    
    const currentPos = getCurrentPosition()
    const now = Date.now()
    
    // Update position when moving or when movement state changes
    if (currentlyMoving && onPositionChange) {
      onPositionChange(currentPos)
    } else if (!currentlyMoving && isMoving.current && onPositionChange) {
      onPositionChange(currentPos)
    }
    
    // Send position and rotation updates to server for multiplayer
    if (socket && (now - lastPositionUpdate.current > POSITION_UPDATE_INTERVAL || currentlyMoving)) {
      const currentRot = getCurrentRotation()
      
      // Calculate position change
      let positionChanged = false
      if (!lastSentPosition.current) {
        positionChanged = true // First update, always send
      } else {
        const posDiff = new THREE.Vector3(
          currentPos[0] - lastSentPosition.current[0],
          currentPos[1] - lastSentPosition.current[1],
          currentPos[2] - lastSentPosition.current[2]
        )
        const distance = posDiff.length()
        positionChanged = distance > POSITION_THRESHOLD
      }
      
      // Calculate rotation change
      let rotationChanged = false
      if (!lastSentRotation.current) {
        rotationChanged = true // First update, always send
      } else {
        const rotDiff = new THREE.Vector3(
          currentRot[0] - lastSentRotation.current[0],
          currentRot[1] - lastSentRotation.current[1],
          currentRot[2] - lastSentRotation.current[2]
        )
        const rotationDistance = rotDiff.length()
        rotationChanged = rotationDistance > ROTATION_THRESHOLD
      }
      
      // Only send if position or rotation changed significantly
      if (positionChanged || rotationChanged) {
        socket.emit('player:position:update', {
          position: currentPos,
          rotation: currentRot,
        })
        lastPositionUpdate.current = now
        lastSentPosition.current = [...currentPos]
        lastSentRotation.current = [...currentRot]
      }
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
  

  // Apply hero model scale and rotation
  const modelScale = heroModelScale ?? 1
  const rotation = heroModelRotation ?? [0, 0, 0]
  
  return (
    <group 
      ref={group} 
      position={[0, -0.94, 0]}
      rotation={rotation}
    >
      <primitive 
        object={clone} 
        castShadow 
        receiveShadow
        scale={modelScale} 
      />
    </group>
  )
}

