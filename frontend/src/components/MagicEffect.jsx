import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Ring } from '@react-three/drei'

export default function MagicEffect({ 
  position, 
  magicType, 
  duration = 2000, 
  radius = 3,
  onComplete 
}) {
  const ringRef = useRef()
  const startTime = useRef(Date.now())
  
  const getMagicColor = (type) => {
    switch (type) {
      case 'fire': return '#ff4444'
      case 'ice': return '#44aaff'
      case 'freeze': return '#00ffff'
      case 'blizzard': return '#88ddff'
      case 'lightning': return '#ffff44'
      case 'bomb': return '#ff00ff'
      case 'poison': return '#88ff00'
      case 'chain': return '#4444ff'
      case 'drain': return '#ff0088'
      case 'slow': return '#8844ff'
      case 'heal': return '#44ff44'
      case 'meteor': return '#ff8800'
      case 'shield': return '#8888ff'
      default: return '#ffffff'
    }
  }
  
  useFrame((state, delta) => {
    if (!ringRef.current) return
    
    const elapsed = Date.now() - startTime.current
    const progress = Math.min(1, elapsed / duration)
    
    // Animate the ring
    ringRef.current.scale.setScalar(0.5 + progress * 1.5) // Grow from 0.5 to 2
    ringRef.current.material.opacity = 1 - progress // Fade out
    
    // Add some rotation
    ringRef.current.rotation.y += delta * 2
    
    // Complete the effect
    if (progress >= 1 && onComplete) {
      onComplete()
    }
  })
  
  return (
    <group position={position}>
      {/* Main ring */}
      <Ring
        ref={ringRef}
        args={[radius * 0.8, radius, 32]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial 
          color={getMagicColor(magicType)}
          transparent
          opacity={0.8}
        />
      </Ring>
      
      {/* Inner ring */}
      <Ring
        args={[radius * 0.3, radius * 0.6, 16]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <meshBasicMaterial 
          color={getMagicColor(magicType)}
          transparent
          opacity={0.6}
        />
      </Ring>
      
      {/* Center effect */}
      <mesh position={[0, 0.1, 0]}>
        <circleGeometry args={[radius * 0.2, 16]} />
        <meshBasicMaterial 
          color={getMagicColor(magicType)}
          transparent
          opacity={0.9}
        />
      </mesh>
    </group>
  )
}
