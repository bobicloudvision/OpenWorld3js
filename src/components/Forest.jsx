import React, { useMemo } from 'react'
import { useGLTF } from '@react-three/drei'
import { RigidBody, CylinderCollider } from '@react-three/rapier'
import { Box3, Vector3 } from 'three'

/**
 * Forest component that generates and renders trees within a defined area
 * Trees are dynamically scaled based on forest size for natural proportions
 * @param {Object} props
 * @param {Array} props.position - Forest center position [x, y, z]
 * @param {Array} props.size - Forest size [width, height, depth]
 * @param {String} props.name - Forest name for logging
 * @param {Number} props.density - Trees per square unit (default: 0.3)
 * @param {Number} props.spacingMin - Minimum distance between trees (default: 2)
 * @param {Number} props.treeColliderRadius - Base radius of tree collider (default: 0.5)
 * @param {Number} props.scaleVariation - How much trees can vary in size (0-1, default: 0.4 = ±40%)
 * @param {Boolean} props.showWireframe - Show forest boundary wireframe (default: false)
 * @param {Boolean} props.showDebugMarkers - Show debug markers at tree positions (default: false)
 */
export default function Forest({
  position,
  size,
  name = 'forest',
  density = 0.3,
  spacingMin = 2,
  treeColliderRadius = 0.5,
  scaleVariation = 0.4,
  showWireframe = false,
  showDebugMarkers = false
}) {
  const { scene: treeModel } = useGLTF('/models/forest/tree1.glb')
  
  // Measure the actual tree model size
  const treeModelSize = useMemo(() => {
    const box = new Box3().setFromObject(treeModel)
    const size = new Vector3()
    const center = new Vector3()
    box.getSize(size)
    box.getCenter(center)
    
    // Calculate how far the model's bottom is from its origin
    const modelBottom = box.min.y
    
    console.log('🌲 Tree Model Measurements:', {
      width: size.x.toFixed(2),
      height: size.y.toFixed(2),
      depth: size.z.toFixed(2),
      centerY: center.y.toFixed(2),
      bottomY: modelBottom.toFixed(2),
      originOffset: Math.abs(modelBottom).toFixed(2)
    })
    
    return {
      width: size.x,
      height: size.y,
      depth: size.z,
      bottomY: modelBottom,
      centerY: center.y
    }
  }, [treeModel])
  
  // Calculate dynamic tree scaling based on forest size
  const treeScaling = useMemo(() => {
    const radius = size[0] / 2
    const forestHeight = size[1]
    
    // Base scale: larger forests = larger trees (scaled by forest height)
    // Typical tree should be about 60-80% of forest height
    const baseScale = (forestHeight * 0.7) / treeModelSize.height
    
    // Min/max scale with variation
    const minScale = baseScale * (1 - scaleVariation)
    const maxScale = baseScale * (1 + scaleVariation)
    
    // Tree collider height should match the scaled tree height
    const avgTreeHeight = forestHeight * 0.7
    
    console.log(`🌲 Dynamic tree scaling for ${name}:`, {
      forestRadius: radius.toFixed(2),
      forestHeight: forestHeight.toFixed(2),
      treeModelHeight: treeModelSize.height.toFixed(2),
      baseTreeScale: baseScale.toFixed(2),
      scaleRange: `${minScale.toFixed(2)} - ${maxScale.toFixed(2)}`,
      avgTreeHeight: avgTreeHeight.toFixed(2)
    })
    
    return {
      baseScale,
      minScale,
      maxScale,
      treeHeight: avgTreeHeight
    }
  }, [size, name, scaleVariation, treeModelSize])
  
  // Generate tree positions for the forest area
  const trees = useMemo(() => {
    const generatedTrees = []
    const radius = size[0] / 2 // Forest cylinder radius
    const area = Math.PI * radius * radius
    const treeCount = Math.floor(area * density)
    
    console.log(`🌲 Generating ${treeCount} trees for ${name} (radius: ${radius.toFixed(2)}, area: ${area.toFixed(2)})`)
    
    // Use deterministic random based on position for consistent generation
    const seed = position[0] + position[2] * 1000
    const seededRandom = (index) => {
      const x = Math.sin(seed + index * 12.9898) * 43758.5453123
      return x - Math.floor(x)
    }
    
    let attempts = 0
    const maxAttempts = treeCount * 10 // Prevent infinite loops
    
    while (generatedTrees.length < treeCount && attempts < maxAttempts) {
      attempts++
      
      // Generate random position within circular area using polar coordinates
      const angle = seededRandom(attempts) * Math.PI * 2
      const distance = Math.sqrt(seededRandom(attempts + 1000)) * (radius - 1) // -1 for edge padding
      
      const x = Math.cos(angle) * distance
      const z = Math.sin(angle) * distance
      
      // Check minimum spacing from other trees
      const tooClose = generatedTrees.some(tree => {
        const dx = tree.position[0] - x
        const dz = tree.position[2] - z
        const dist = Math.sqrt(dx * dx + dz * dz)
        return dist < spacingMin
      })
      
      if (!tooClose) {
        // Random scale and rotation for variety (using dynamic scaling)
        const scale = treeScaling.minScale + seededRandom(attempts + 2000) * (treeScaling.maxScale - treeScaling.minScale)
        const rotationY = seededRandom(attempts + 3000) * Math.PI * 2
        
        generatedTrees.push({
          position: [x, 0, z], // Relative to forest center
          scale: scale,
          rotation: [0, rotationY, 0]
        })
      }
    }
    
    console.log(`✅ Generated ${generatedTrees.length} trees for ${name}`)
    return generatedTrees
  }, [position, size, name, density, spacingMin, treeScaling])
  
  // Calculate ground level: bottom of forest cylinder (relative to forest center which is at Y=0)
  // The forest cylinder height is size[1], so ground is at -size[1]/2
  const forestGroundY = -size[1] / 2
  
  // Use dynamic tree height for colliders
  const dynamicTreeColliderHeight = treeScaling.treeHeight
  
  console.log(`🌲 Forest "${name}" positioning:`, {
    forestCylinderHeight: size[1].toFixed(2),
    forestGroundY: forestGroundY.toFixed(2),
    treeColliderHeight: dynamicTreeColliderHeight.toFixed(2)
  })
  
  return (
    <group>
      {/* Optional wireframe boundary for debugging */}
      {showWireframe && (
        <>
          <mesh>
            <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 16]} />
            <meshBasicMaterial 
              color="#00ff00"
              wireframe={true}
              transparent={true}
              opacity={0.3}
            />
          </mesh>
          <mesh>
            <cylinderGeometry args={[size[0] / 2, size[0] / 2, size[1], 16]} />
            <meshBasicMaterial 
              color="#00ff00"
              transparent={true}
              opacity={0.05}
            />
          </mesh>
        </>
      )}
      
      {/* Render generated trees with individual colliders */}
      {trees.map((tree, treeIndex) => {
        // Calculate tree-specific collider height based on this tree's scale
        const treeSpecificHeight = dynamicTreeColliderHeight * (tree.scale / treeScaling.baseScale)
        
        // Calculate the offset needed to place the tree model's bottom at ground level
        // The model's bottom is at treeModelSize.bottomY (usually negative if origin is at base)
        const scaledModelBottom = treeModelSize.bottomY * tree.scale
        
        // Position collider so its bottom is at forest ground
        const treeColliderCenterY = forestGroundY + (treeSpecificHeight / 2)
        
        const treePos = [
          tree.position[0],
          treeColliderCenterY,
          tree.position[2]
        ]
        
        // The tree model needs to be offset so its bottom aligns with the collider bottom
        // Collider bottom is at Y = -treeSpecificHeight/2 (relative to collider center)
        // Model bottom is at scaledModelBottom (relative to model origin)
        // So we need to offset by: -treeSpecificHeight/2 - scaledModelBottom
        const modelYOffset = -treeSpecificHeight / 2 - scaledModelBottom
        
        if (treeIndex === 0) {
          console.log(`  First tree positioning:`, {
            treeScale: tree.scale.toFixed(2),
            treeHeight: treeSpecificHeight.toFixed(2),
            modelBottomY: treeModelSize.bottomY.toFixed(2),
            scaledModelBottom: scaledModelBottom.toFixed(2),
            forestGroundY: forestGroundY.toFixed(2),
            colliderCenterY: treeColliderCenterY.toFixed(2),
            colliderBottomY: (treeColliderCenterY - treeSpecificHeight / 2).toFixed(2),
            modelYOffset: modelYOffset.toFixed(2),
            finalModelBottomY: (treeColliderCenterY + modelYOffset + scaledModelBottom).toFixed(2)
          })
        }
        
        return (
          <RigidBody
            key={`tree-${name}-${treeIndex}`}
            type="fixed"
            colliders={false}
            position={treePos}
            friction={1}
            restitution={0}
          >
            {/* Cylinder collider for tree trunk - scaled to match tree size */}
            <CylinderCollider 
              args={[treeSpecificHeight / 2, treeColliderRadius * tree.scale]} 
            />
            
            <group>
              {/* Debug markers */}
              {showDebugMarkers && (
                <>
                  {/* Collider visualization */}
                  <mesh position={[0, 0, 0]}>
                    <cylinderGeometry args={[treeColliderRadius * tree.scale, treeColliderRadius * tree.scale, treeSpecificHeight, 8]} />
                    <meshBasicMaterial color="#ff00ff" wireframe transparent opacity={0.5} />
                  </mesh>
                  {/* Ground marker - at the bottom of collider (should match tree bottom) */}
                  <mesh position={[0, -treeSpecificHeight / 2, 0]}>
                    <sphereGeometry args={[0.5, 8, 8]} />
                    <meshBasicMaterial color="#ff0000" />
                  </mesh>
                  {/* Top marker */}
                  <mesh position={[0, treeSpecificHeight / 2, 0]}>
                    <sphereGeometry args={[0.3, 8, 8]} />
                    <meshBasicMaterial color="#0000ff" />
                  </mesh>
                  {/* Model origin marker (yellow) */}
                  <mesh position={[0, modelYOffset, 0]}>
                    <sphereGeometry args={[0.3, 8, 8]} />
                    <meshBasicMaterial color="#ffff00" />
                  </mesh>
                </>
              )}
              
              {/* Actual tree model - positioned so its bottom aligns with collider bottom */}
              <primitive
                object={treeModel.clone()}
                position={[0, modelYOffset, 0]}
                rotation={tree.rotation}
                scale={tree.scale}
              />
            </group>
          </RigidBody>
        )
      })}
    </group>
  )
}

// Preload the tree model
useGLTF.preload('/models/forest/tree1.glb')

