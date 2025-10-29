import React, { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { Sphere } from '@react-three/drei'

export default function MagicProjectile({ 
  startPosition, 
  targetPosition, 
  magicType, 
  damage, 
  onHit, 
  speed = 10 
}) {
  const meshRef = useRef()
  const startTime = useRef(Date.now())
  
  useFrame((state, delta) => {
    if (!meshRef.current) return
    
    const elapsed = (Date.now() - startTime.current) / 1000
    const progress = Math.min(1, elapsed * speed / 10) // Normalize progress
    
    // Interpolate position
    const currentPosition = [
      startPosition[0] + (targetPosition[0] - startPosition[0]) * progress,
      startPosition[1] + (targetPosition[1] - startPosition[1]) * progress,
      startPosition[2] + (targetPosition[2] - startPosition[2]) * progress
    ]
    
    meshRef.current.position.set(...currentPosition)
    
    // Check if projectile reached target
    if (progress >= 1) {
      onHit(targetPosition, damage)
      // Remove projectile (this will be handled by parent component)
    }
    
    // Add some rotation for visual effect
    meshRef.current.rotation.x += delta * 2
    meshRef.current.rotation.y += delta * 2
  })
  
  const getMagicColor = (type) => {
    switch (type) {
      case 'fire': return '#ff4444'
      case 'ice': return '#44aaff'
      case 'freeze': return '#00ffff'
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
  
  return (
    <Sphere ref={meshRef} args={[0.1]} position={startPosition}>
      <meshBasicMaterial 
        color={getMagicColor(magicType)}
        transparent
        opacity={0.8}
      />
    </Sphere>
  )
}
