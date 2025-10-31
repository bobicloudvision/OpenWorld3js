import { useEffect, useRef, useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

/**
 * Helper function to validate animation clip against model skeleton
 * Removes tracks that reference non-existent bones to prevent console warnings
 * @param {THREE.AnimationClip} clip - Animation clip to validate
 * @param {THREE.Object3D} model - Model with skeleton to validate against
 * @returns {THREE.AnimationClip} Cleaned animation clip
 */
function sanitizeAnimationClip(clip, model) {
  if (!clip || !model) return clip
  
  // Get all bone names from the model
  const boneNames = new Set()
  model.traverse((node) => {
    if (node.isBone || node.isSkinnedMesh) {
      boneNames.add(node.name)
    }
  })
  
  // Filter tracks to only include those that reference existing bones
  const validTracks = clip.tracks.filter(track => {
    // Track names are in format: "boneName.property"
    const boneName = track.name.split('.')[0]
    const isValid = boneNames.has(boneName) || boneName === 'Scene' || boneName.startsWith('Root')
    
    if (!isValid) {
      // Silently skip invalid tracks (no console warnings)
      return false
    }
    return true
  })
  
  // Create a new clip with only valid tracks
  if (validTracks.length < clip.tracks.length) {
    return new THREE.AnimationClip(clip.name, clip.duration, validTracks)
  }
  
  return clip
}

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
  const { animations: attackAnimations } = useGLTF('/models/animations/Attack2.glb') 
  
  // Initialize mixer and animations when clone is ready or when model changes
  useEffect(() => {
    if (!clone) return
    
    // Reset mixer and actions when model changes
    if (mixer.current) {
      // Stop all actions and release mixer
      animationActions.current.forEach(action => {
        if (action) {
          action.stop()
          action.reset()
        }
      })
      animationActions.current = []
      activeAction.current = null
      lastAction.current = null
    }
    
    // Create mixer for the cloned scene
    mixer.current = new THREE.AnimationMixer(clone)
    
    // Add idle animation (sanitized to remove invalid tracks)
    if (idleAnimations && idleAnimations.length > 0) {
      const sanitizedClip = sanitizeAnimationClip(idleAnimations[0], clone)
      const idleAction = mixer.current.clipAction(sanitizedClip)
      animationActions.current.push(idleAction)
    }
    
    // Add walk animation (sanitized to remove invalid tracks)
    if (walkAnimations && walkAnimations.length > 0) {
      const sanitizedClip = sanitizeAnimationClip(walkAnimations[0], clone)
      const walkAction = mixer.current.clipAction(sanitizedClip)
      walkAction.setEffectiveTimeScale(2)
      animationActions.current.push(walkAction)
    }
    
    // Add jump animation (sanitized to remove invalid tracks)
    if (jumpAnimations && jumpAnimations.length > 0) {
      const sanitizedClip = sanitizeAnimationClip(jumpAnimations[0], clone)
      const jumpAction = mixer.current.clipAction(sanitizedClip)
      jumpAction.setEffectiveTimeScale(2)
      animationActions.current.push(jumpAction)
    }

    // Add attack animation (sanitized to remove invalid tracks)
    if (attackAnimations && attackAnimations.length > 0) {
      const sanitizedClip = sanitizeAnimationClip(attackAnimations[0], clone)
      const attackAction = mixer.current.clipAction(sanitizedClip)
      attackAction.setEffectiveTimeScale(2)
      animationActions.current.push(attackAction)
    }

    // Start with idle animation
    if (animationActions.current.length > 0) {
      activeAction.current = animationActions.current[0]
      activeAction.current.reset().play()
    }
  }, [clone, idleAnimations, walkAnimations, jumpAnimations, attackAnimations, modelPath])
  
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
      case 'attack':
        return animationActions.current[3]
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
useGLTF.preload('/models/animations/Attack2.glb')
useGLTF.preload('/models/animations/ManIdle1.glb')
useGLTF.preload('/models/animations/PohodkaTarikat.glb')
useGLTF.preload('/models/animations/Jump.glb')


// Preload enemy avatar models
useGLTF.preload('/models/avatars/Avatar1.glb')
useGLTF.preload('/models/avatars/DemonTWiezzorek.glb')
useGLTF.preload('/models/avatars/GanfaulMAure.glb')
useGLTF.preload('/models/avatars/Mutant.glb')
useGLTF.preload('/models/avatars/NightshadeJFriedrich.glb')
useGLTF.preload('/models/avatars/WarrokWKurniawan.glb')
