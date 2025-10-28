import React, { useMemo } from 'react'
import { RepeatWrapping, SRGBColorSpace } from 'three'
import { useTexture } from '@react-three/drei'
import { RigidBody, CuboidCollider } from '@react-three/rapier'

export default function Ground() {
  const texture = useTexture('/textures/Material.001_diffuse.png')

  useMemo(() => {
    if (!texture) return
    texture.wrapS = RepeatWrapping
    texture.wrapT = RepeatWrapping
    texture.repeat.set(100, 100)
    texture.colorSpace = SRGBColorSpace
    texture.anisotropy = 8
  }, [texture])

  return (
    <RigidBody type="fixed">
      <mesh position={[0, -1.5, 0]} receiveShadow>
        <boxGeometry args={[200, 1, 200]} />
        <meshStandardMaterial map={texture} color="#ffffff" />
      </mesh>
      <CuboidCollider args={[100, 0.5, 100]} />
    </RigidBody>
  )
}


