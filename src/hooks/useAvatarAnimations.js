import { useEffect, useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

/**
 * Custom hook to handle avatar animations
 * Encapsulates common animation logic used by both Player and RemotePlayer
 * @param {string} modelPath - Path to the avatar model (optional, defaults to Avatar1)
 */
export function useAvatarAnimations(modelPath = '/models/avatars/NightshadeJFriedrich.glb') {
  const mixer = useRef()
  const animationActions = useRef([])
  const activeAction = useRef()
  const lastAction = useRef()
  
  // Load avatar model (base model without animations)
  const { scene } = useGLTF(modelPath)
  
  // Clone the scene properly with its skeleton
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  
  // Load animation files separately
  const { animations: idleAnimations } = useGLTF('/models/animations/ManIdle1.glb')
  const { animations: walkAnimations } = useGLTF('/models/animations/PohodkaTarikat.glb')
  const { animations: jumpAnimations } = useGLTF('/models/animations/Jump.glb')
  
  // Initialize mixer and animations when clone is ready
  useEffect(() => {
    if (clone && !mixer.current) {
      // Create mixer for the cloned scene
      mixer.current = new THREE.AnimationMixer(clone)
      
      // Add idle animation
      if (idleAnimations && idleAnimations.length > 0) {
        const idleAction = mixer.current.clipAction(idleAnimations[0])
        animationActions.current.push(idleAction)
      }
      
      // Add walk animation
      if (walkAnimations && walkAnimations.length > 0) {
        const walkAction = mixer.current.clipAction(walkAnimations[0])
        walkAction.setEffectiveTimeScale(2)
        animationActions.current.push(walkAction)
      }
      
      // Add jump animation
      if (jumpAnimations && jumpAnimations.length > 0) {
        const jumpAction = mixer.current.clipAction(jumpAnimations[0])
        jumpAction.setEffectiveTimeScale(2)
        animationActions.current.push(jumpAction)
      }

      // Start with idle animation
      if (animationActions.current.length > 0) {
        activeAction.current = animationActions.current[0]
        activeAction.current.reset().play()
      }
    }
  }, [clone, idleAnimations, walkAnimations, jumpAnimations])
  
  // Animation switching function
  const setAction = (toAction, fadeTime = 0.5) => {
    if (toAction !== activeAction.current && toAction) {
      lastAction.current = activeAction.current
      activeAction.current = toAction
      
      if (lastAction.current) {
        lastAction.current.fadeOut(fadeTime)
      }
      
      activeAction.current.reset()
      activeAction.current.fadeIn(fadeTime)
      activeAction.current.play()
    }
  }
  
  // Function to get animation action by name
  const getAnimationByName = (name) => {
    switch (name) {
      case 'idle':
        return animationActions.current[0]
      case 'walk':
        return animationActions.current[1]
      case 'jump':
        return animationActions.current[2]
      default:
        return animationActions.current[0]
    }
  }
  
  // Update mixer function (to be called in useFrame)
  const updateMixer = (delta) => {
    if (mixer.current) {
      mixer.current.update(delta)
    }
  }
  
  return {
    clone,
    mixer,
    animationActions,
    activeAction,
    setAction,
    getAnimationByName,
    updateMixer
  }
}

// Preload models
useGLTF.preload('/models/avatars/Avatar1.glb')
useGLTF.preload('/models/animations/ManIdle1.glb')
useGLTF.preload('/models/animations/PohodkaTarikat.glb')
useGLTF.preload('/models/animations/Jump.glb')

// Preload enemy avatar models
useGLTF.preload('/models/avatars/DemonTWiezzorek.glb')
useGLTF.preload('/models/avatars/GanfaulMAure.glb')
useGLTF.preload('/models/avatars/Mutant.glb')
useGLTF.preload('/models/avatars/NightshadeJFriedrich.glb')
useGLTF.preload('/models/avatars/WarrokWKurniawan.glb')
