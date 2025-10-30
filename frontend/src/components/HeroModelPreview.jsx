import React, { Suspense, useEffect, useRef, useState } from 'react'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { useGLTF, OrbitControls } from '@react-three/drei'
import * as THREE from 'three'

/**
 * Component that renders a hero 3D model in a preview canvas
 * @param {string} modelPath - Path to the GLB model file
 * @param {number} modelScale - Scale multiplier for the model
 * @param {Array<number>} modelRotation - Rotation array [x, y, z] in radians
 */
function HeroModel({ modelPath, modelScale = 1, modelRotation = [0, 0, 0], onModelCentered }) {
  const { scene } = useGLTF(modelPath)
  const groupRef = useRef()
  const meshRef = useRef()
  const { camera } = useThree()
  const [isCentered, setIsCentered] = useState(false)
  const hasAdjustedCamera = useRef(false)
  
  // Clone the scene to avoid modifying the original
  const clonedScene = React.useMemo(() => {
    const clone = scene.clone()
    return clone
  }, [scene])
  
  // Apply rotation
  const rotation = React.useMemo(() => {
    return new THREE.Euler(modelRotation[0], modelRotation[1], modelRotation[2])
  }, [modelRotation])
  
  // Center the model on first load and when model changes
  useEffect(() => {
    if (!clonedScene) return
    
    // Reset state when model parameters change
    setIsCentered(false)
    hasAdjustedCamera.current = false
    
    // Calculate bounding box from the original model
    const originalBox = new THREE.Box3().setFromObject(clonedScene)
    const originalCenter = new THREE.Vector3()
    originalBox.getCenter(originalCenter)
    
    // Center the model at origin
    clonedScene.position.x = -originalCenter.x
    clonedScene.position.y = -originalCenter.y
    clonedScene.position.z = -originalCenter.z
    setIsCentered(true)
  }, [clonedScene, modelScale, modelRotation])
  
  // Adjust camera after model is rendered with transformations
  useFrame(() => {
    if (!groupRef.current || !isCentered || hasAdjustedCamera.current) return
    
    // Calculate bounding box from the actual rendered group (with scale and rotation)
    const box = new THREE.Box3().setFromObject(groupRef.current)
    const size = new THREE.Vector3()
    box.getSize(size)
    
    // Make sure we have a valid bounding box
    if (size.x === 0 && size.y === 0 && size.z === 0) return
    
    // Focus on upper 75% of the model (head/torso area)
    // After centering, model's Y bounds are from box.min.y to box.max.y
    // Upper focus: box.min.y + (size.y * 0.75)
    const upperFocusHeight = box.min.y + (size.y * 0.75)
    
    // Calculate camera distance based on width/depth, not height
    // For tall models, we want to zoom based on the cross-section (X/Z) to fit the upper part
    const horizontalSize = Math.max(size.x, size.z)
    
    // If model is very tall relative to width, adjust the zoom factor
    const aspectRatio = size.y / horizontalSize
    let zoomFactor = 1.2
    
    // For very tall models (aspect ratio > 2), zoom in more to focus on the upper part
    if (aspectRatio > 2) {
      // Scale down the distance for tall models to get better framing
      zoomFactor = 1.0 + (0.5 / aspectRatio)
    }
    
    // Calculate distance based on horizontal size for proper framing
    // Add a bit extra for taller models to show more of the upper body
    const distance = horizontalSize * zoomFactor
    
    camera.position.set(0, upperFocusHeight, distance)
    camera.lookAt(0, upperFocusHeight, 0)
    camera.updateProjectionMatrix()
    
    // Notify parent about the target height for OrbitControls
    if (onModelCentered) {
      onModelCentered(upperFocusHeight)
    }
    
    hasAdjustedCamera.current = true
  })
  
  return (
    <group ref={groupRef}>
      <primitive
        ref={meshRef}
        object={clonedScene}
        scale={modelScale}
        rotation={rotation}
      />
    </group>
  )
}

/**
 * Preview component that renders a hero model in a small canvas
 */
function ControlsWithTarget({ targetHeight }) {
  const controlsRef = useRef()
  
  useEffect(() => {
    if (controlsRef.current && targetHeight !== undefined) {
      controlsRef.current.target.set(0, targetHeight, 0)
      controlsRef.current.update()
    }
  }, [targetHeight])
  
  return (
    <OrbitControls
      ref={controlsRef}
      enableZoom={true}
      enablePan={false}
      autoRotate
      autoRotateSpeed={1}
      minPolarAngle={Math.PI / 3}
      maxPolarAngle={Math.PI / 2.2}
      minDistance={0.5}
      maxDistance={8}
      target={targetHeight !== undefined ? [0, targetHeight, 0] : [0, 0, 0]}
    />
  )
}

export default function HeroModelPreview({ 
  modelPath, 
  modelScale = 1, 
  modelRotation = [0, -1.5707963267948966, 0] 
}) {
  const [targetHeight, setTargetHeight] = React.useState(0)
  
  if (!modelPath) {
    return (
      <div style={{
        width: '100%',
        height: '200px',
        background: 'rgba(0, 0, 0, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#9ca3af',
        fontSize: '0.9em',
        borderRadius: '8px',
      }}>
        No model
      </div>
    )
  }
  
  return (
    <div style={{
      width: '100%',
      height: '200px',
      background: 'rgba(0, 0, 0, 0.3)',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '12px',
    }}>
      <Canvas
        camera={{ position: [0, 0, 3], fov: 50 }}
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <Suspense fallback={null}>
          <HeroModel
            modelPath={modelPath}
            modelScale={modelScale}
            modelRotation={modelRotation}
            onModelCentered={setTargetHeight}
          />
        </Suspense>
        <ControlsWithTarget targetHeight={targetHeight} />
      </Canvas>
    </div>
  )
}

