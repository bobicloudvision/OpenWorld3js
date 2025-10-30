import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const MAGIC_CLICK_COLORS = {
  fire: '#ff4444',
  ice: '#44aaff', 
  lightning: '#ffff44',
  heal: '#44ff44',
  meteor: '#ff8800',
  shield: '#8888ff',
  default: '#00ffff'
}

export default function ClickEffect({ position, magicType, onComplete }) {
  const groupRef = useRef()
  const startTime = useRef(Date.now())

  useFrame(() => {
    const elapsed = Date.now() - startTime.current
    const duration = magicType ? 1500 : 1000 // Magic clicks last longer
    const progress = elapsed / duration

    if (progress >= 1) {
      onComplete()
      return
    }

    // Different animations based on magic type
    let scale, opacity, rotation
    
    if (magicType) {
      // Magic click effects - more dramatic
      scale = 0.1 + progress * 3 // Grow from 0.1 to 3.1
      opacity = 1 - progress * 0.7 // Fade to 30% opacity
      rotation = progress * Math.PI * 4 // Faster spin
    } else {
      // Regular click effects - subtle
      scale = 0.2 + progress * 2 // Grow from 0.2 to 2.2
      opacity = 1 - progress // Fade out completely
      rotation = progress * Math.PI * 2 // Normal spin
    }

    if (groupRef.current) {
      groupRef.current.scale.set(scale, scale, scale)
      groupRef.current.rotation.z = rotation
      groupRef.current.children.forEach(child => {
        if (child.material) {
          child.material.opacity = opacity
        }
      })
    }
  })

  const color = MAGIC_CLICK_COLORS[magicType] || MAGIC_CLICK_COLORS.default
  const isMagicClick = !!magicType

  return (
    <group ref={groupRef} position={[position[0], position[1] + 0.05, position[2]]}>
      {isMagicClick ? (
        // Magic click effect - more complex
        <>
          {/* Outer magic ring */}
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[1.2, 1.5, 32]} />
            <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
          {/* Middle magic ring */}
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.6, 0.9, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
          {/* Inner magic ring */}
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.2, 0.5, 32]} />
            <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
          {/* Center magic circle */}
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial color={color} transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
          {/* Magic particles */}
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.05, 8]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
        </>
      ) : (
        // Regular click effect - simple
        <>
          {/* Outer ring */}
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.8, 1.0, 32]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
          {/* Inner ring */}
          <mesh rotation-x={-Math.PI / 2}>
            <ringGeometry args={[0.4, 0.6, 32]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
          {/* Center circle */}
          <mesh rotation-x={-Math.PI / 2}>
            <circleGeometry args={[0.3, 32]} />
            <meshBasicMaterial color="#00ffff" transparent opacity={1} side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  )
}
