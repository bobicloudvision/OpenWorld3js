import React, { useMemo, useState, useEffect } from 'react'
import { useGLTF, Html, Box } from '@react-three/drei'
import { RigidBody, CuboidCollider, CylinderCollider } from '@react-three/rapier'
import { Box3, Vector3 } from 'three'
import Forest from './Forest'

/**
 * Component that visualizes specific elements from world1.glb as wireframe placeholders
 * Detects elements by name patterns (house, forest, etc.) regardless of visibility
 * These placeholders show where elements are located and provide collision boxes
 * so they can be replaced dynamically in the future
 */
export default function HiddenElementPlaceholders() {
  const { scene } = useGLTF('/models/world1.glb')
  const { scene: houseModel } = useGLTF('/models/houses/house1.glb')
  const showBoundingBox = false
  
  // Forest generation settings (can be passed to Forest component)
  const TREE_DENSITY = 0.3 // Trees per square unit (adjust for more/fewer trees)
  const TREE_SPACING_MIN = 2 // Minimum distance between trees
  const TREE_SCALE_VARIATION = 0.4 // How much trees vary in size (0.4 = ±40%)
  const TREE_COLLIDER_RADIUS = 0.5 // Base radius of tree collision cylinder
  const SHOW_FOREST_WIREFRAME = false // Toggle to show/hide forest boundary wireframe
  const DEBUG_TREE_MARKERS = false // Show colored spheres where trees should be
  
  // World Y offset - must match Ground component's position Y value
  // Ground.jsx line ~137: position={[0, -10, 0]}
  // If Ground position changes, update this constant to match
  const WORLD_Y_OFFSET = -10
  
  // Calculate house model original size for scaling
  const houseModelSize = useMemo(() => {
    const box = new Box3().setFromObject(houseModel)
    const size = new Vector3()
    box.getSize(size)
    console.log('🏠 House Model Original Size:', {
      width: size.x.toFixed(2),
      height: size.y.toFixed(2),
      depth: size.z.toFixed(2)
    })
    return size
  }, [houseModel])
  
  // Regex patterns for elements we want to visualize (detects by name, not visibility)
  const elementPatterns = {
    forest: /^forest(\.\d+|\d+)?$/i,  // Matches: forest, forest001, forest.001, etc.
    house: /^house(\.\d+|\d+)?$/i      // Matches: house, house001, house.001, etc.
  }
  
  // Check if element name matches any pattern
  const isTargetElement = (name) => {
    return Object.values(elementPatterns).some(pattern => pattern.test(name))
  }
  
  // Get element type (house or forest)
  const getElementType = (name) => {
    if (elementPatterns.forest.test(name)) return 'forest'
    if (elementPatterns.house.test(name)) return 'house'
    return 'unknown'
  }
  
  // Extract positions and sizes of hidden elements
  const placeholders = useMemo(() => {
    const foundElements = []
    
    if (!scene) {
      console.warn('Scene not loaded yet')
      return foundElements
    }
    
    scene.traverse((child) => {
      // Check if this object matches our element patterns (by name, not visibility)
      if (isTargetElement(child.name)) {
        try {
          // Store original visibility state
          const wasVisible = child.visible
          
          // Temporarily make visible to calculate bounding box correctly
          child.visible = true
          
          // Force update world matrix
          if (child.updateWorldMatrix) {
            child.updateWorldMatrix(true, true)
          }
          
          // Calculate bounding box to get size and position
          const box = new Box3().setFromObject(child)
          const size = new Vector3()
          const center = new Vector3()
          
          box.getSize(size)
          box.getCenter(center)
          
          // Get world position directly from the object
          const worldPos = new Vector3()
          child.getWorldPosition(worldPos)
          
          // Restore original visibility state
          child.visible = wasVisible
          
          // Calculate size - use bounding box if available, otherwise use scale
          const hasValidSize = size.x > 0 || size.y > 0 || size.z > 0
          let finalSize = [size.x, size.y, size.z]
          
          if (!hasValidSize) {
            // Empty container - use scale values to determine size
            const scaleX = child.scale.x || 1
            const scaleY = child.scale.y || 1
            const scaleZ = child.scale.z || 1
            
            // Apply minimum height for houses
            const elementType = getElementType(child.name)
            const minHeight = elementType === 'house' ? 4 : 2
            
            finalSize = [
              scaleX * 2,
              Math.max(scaleY * 2, minHeight),
              scaleZ * 2
            ]
            console.log(`  Using scale-based size (scale × 2, min height: ${minHeight}): [${finalSize[0].toFixed(2)}, ${finalSize[1].toFixed(2)}, ${finalSize[2].toFixed(2)}]`)
          }
          
          // Use world position as the primary position (not bounding box center if it's 0,0,0)
          const useWorldPos = !hasValidSize || (center.x === 0 && center.y === 0 && center.z === 0)
          const finalPosition = useWorldPos 
            ? [worldPos.x, worldPos.y + WORLD_Y_OFFSET, worldPos.z]
            : [center.x, center.y + WORLD_Y_OFFSET, center.z]
          
          // Calculate ground level Y position (bottom of the cube, not center)
          const groundLevelY = (worldPos.y - finalSize[1] / 2) + WORLD_Y_OFFSET
          
          foundElements.push({
            name: child.name,
            position: finalPosition,
            worldPosition: [worldPos.x, worldPos.y + WORLD_Y_OFFSET, worldPos.z],
            originalYPosition: groundLevelY, // Bottom Y position for ground level
            size: finalSize,
            rotation: [child.rotation.x, child.rotation.y, child.rotation.z], // Store rotation in radians
            originalObject: child,
            wasHidden: !wasVisible,
            isEmptyContainer: !hasValidSize,
            // Store bounding box info for visualization
            boundingBox: {
              center: [center.x, center.y + WORLD_Y_OFFSET, center.z],
              size: [size.x, size.y, size.z],
              hasSize: hasValidSize
            }
          })
          
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log(`🏠 FOUND ELEMENT: ${child.name}`)
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
          console.log('📊 Element Properties:')
          console.log(`  Name Pattern Match: ${getElementType(child.name)}`)
          console.log(`  Type: ${child.type}`)
          console.log(`  Visible: ${wasVisible}`)
          console.log(`  Has Geometry: ${!!child.geometry}`)
          console.log(`  Has Material: ${!!child.material}`)
          console.log(`  Is Empty Container: ${!hasValidSize}`)
          
          if (!hasValidSize) {
            console.log('  Size Source: Scale (empty container)')
          } else {
            console.log('  Size Source: Direct Bounding Box')
          }
          
          console.log('\n📍 Position Data:')
          console.log('  Local Position:', {
            x: child.position.x,
            y: child.position.y,
            z: child.position.z
          })
          console.log('  World Position:', {
            x: worldPos.x,
            y: worldPos.y,
            z: worldPos.z
          })
          console.log('  World Position (adjusted):', {
            x: worldPos.x,
            y: worldPos.y + WORLD_Y_OFFSET,
            z: worldPos.z
          })
          console.log('  Bounding Box Center:', {
            x: center.x,
            y: center.y,
            z: center.z
          })
          console.log('  Bounding Box Center (adjusted):', {
            x: center.x,
            y: center.y + WORLD_Y_OFFSET,
            z: center.z
          })
          
          console.log(`\n✅ USING: ${useWorldPos ? 'World Position' : 'Bounding Box Center'} for placement`)
          console.log('  Final Position (center):', {
            x: finalPosition[0],
            y: finalPosition[1],
            z: finalPosition[2]
          })
          console.log('  Ground Level Y:', {
            centerY: (worldPos.y + WORLD_Y_OFFSET).toFixed(2),
            halfHeight: (finalSize[1] / 2).toFixed(2),
            groundY: groundLevelY.toFixed(2)
          })
          
          console.log('\n📏 Size & Scale:')
          console.log('  Bounding Box Size:', {
            width: size.x,
            height: size.y,
            depth: size.z
          })
          console.log('  Final Size (used for placeholder):', {
            width: finalSize[0],
            height: finalSize[1],
            depth: finalSize[2]
          })
          console.log('  Object Scale (property):', {
            x: child.scale.x,
            y: child.scale.y,
            z: child.scale.z
          })
          
          // Extract scale from matrix for comparison
          if (child.matrix) {
            const matrixElements = child.matrix.elements
            console.log('  Matrix Scale (extracted):', {
              x: Math.sqrt(matrixElements[0] * matrixElements[0] + matrixElements[1] * matrixElements[1] + matrixElements[2] * matrixElements[2]),
              y: Math.sqrt(matrixElements[4] * matrixElements[4] + matrixElements[5] * matrixElements[5] + matrixElements[6] * matrixElements[6]),
              z: Math.sqrt(matrixElements[8] * matrixElements[8] + matrixElements[9] * matrixElements[9] + matrixElements[10] * matrixElements[10])
            })
          }
          console.log('  Object Rotation (Radians):', {
            x: child.rotation.x.toFixed(4),
            y: child.rotation.y.toFixed(4),
            z: child.rotation.z.toFixed(4)
          })
          console.log('  Object Rotation (Degrees):', {
            x: (child.rotation.x * 180 / Math.PI).toFixed(2) + '°',
            y: (child.rotation.y * 180 / Math.PI).toFixed(2) + '°',
            z: (child.rotation.z * 180 / Math.PI).toFixed(2) + '°'
          })
          
          if (child.geometry) {
            console.log('\n🔷 Geometry Info:')
            console.log(`  Type: ${child.geometry.type}`)
            if (child.geometry.parameters) {
              console.log('  Parameters:', child.geometry.parameters)
            }
          }
          
          console.log('\n🌳 Hierarchy:')
          console.log(`  Parent: ${child.parent?.name || 'none'}`)
          if (child.parent) {
            console.log('  Parent Position:', {
              x: child.parent.position.x,
              y: child.parent.position.y,
              z: child.parent.position.z
            })
          }
          console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
        } catch (error) {
          console.error(`Error processing element ${child.name}:`, error)
        }
      }
    })
    
    // Summary log
    console.log('╔════════════════════════════════════════════╗')
    console.log('║      PLACEHOLDER ELEMENTS SUMMARY          ║')
    console.log('╚════════════════════════════════════════════╝')
    console.log(`Found ${foundElements.length} elements by name pattern:\n`)
    foundElements.forEach((elem, idx) => {
      const elemType = getElementType(elem.name)
      console.log(`${idx + 1}. ${elem.name}${elem.isEmptyContainer ? ' 📦 (empty container)' : ''}`)
      console.log(`   Type: ${elemType}`)
      console.log(`   Position: [${elem.position[0].toFixed(2)}, ${elem.position[1].toFixed(2)}, ${elem.position[2].toFixed(2)}]`)
      console.log(`   Size [W×H×D]: [${elem.size[0].toFixed(2)} × ${elem.size[1].toFixed(2)} × ${elem.size[2].toFixed(2)}]`)
      if (elemType !== 'forest') {
        console.log(`   Rotation (°): [${(elem.rotation[0] * 180 / Math.PI).toFixed(1)}°, ${(elem.rotation[1] * 180 / Math.PI).toFixed(1)}°, ${(elem.rotation[2] * 180 / Math.PI).toFixed(1)}°]`)
      } else {
        console.log(`   Rotation: Not applied (forest stays vertical)`)
      }
      
      // Verify the size values
      if (elem.size[0] && elem.size[1] && elem.size[2]) {
        console.log(`   ✅ Size values are valid`)
      } else {
        console.warn(`   ⚠️ Size values may be invalid:`, elem.size)
      }
      console.log('')
    })
    console.log('════════════════════════════════════════════\n')
    
    return foundElements
  }, [scene])
  
  // Keep original objects hidden
  useEffect(() => {
    placeholders.forEach(placeholder => {
      if (placeholder.originalObject) {
        placeholder.originalObject.visible = false
      }
    })
  }, [placeholders])
  
  // Color mapping for different element types
  const getColorForElement = (name) => {
    const type = getElementType(name)
    if (type === 'forest') return '#00ff00' // Green for forests
    if (type === 'house') return '#ff6600' // Orange for houses
    return '#ffff00' // Yellow for others
  }
  
  // Check if element is a forest (using regex)
  const isForest = (name) => elementPatterns.forest.test(name)
  
  return (
    <>
      {/* Placeholder visualizations */}
      {placeholders && placeholders.length > 0 && (
        <group>
          {placeholders.map((placeholder, index) => {
            // Debug log for rendering
            if (placeholder && placeholder.position && placeholder.size) {
              if (isForest(placeholder.name)) {
                console.log(`Rendering ${placeholder.name} (forest cylinder) with size:`, placeholder.size)
              } else {
                const scaleX = placeholder.size[0] / houseModelSize.x
                const scaleY = placeholder.size[1] / houseModelSize.y
                const scaleZ = placeholder.size[2] / houseModelSize.z
                const uniformScale = Math.min(scaleX, scaleY, scaleZ)
                const relativeY = placeholder.originalYPosition - placeholder.position[1]
                console.log(`Rendering ${placeholder.name} (house model) scale: ${uniformScale.toFixed(2)}, Y: ${relativeY.toFixed(2)} (using original position)`)
              }
            }
            
            return placeholder && placeholder.position && placeholder.size && (
              <React.Fragment key={index}>
                {isForest(placeholder.name) ? (
                  // Forest - use Forest component (handles its own colliders for each tree)
                  <group position={placeholder.position}>
                    <Forest 
                      position={placeholder.position}
                      size={placeholder.size}
                      name={placeholder.name}
                      density={TREE_DENSITY}
                      spacingMin={TREE_SPACING_MIN}
                      scaleVariation={TREE_SCALE_VARIATION}
                      treeColliderRadius={TREE_COLLIDER_RADIUS}
                      showWireframe={SHOW_FOREST_WIREFRAME}
                      showDebugMarkers={DEBUG_TREE_MARKERS}
                    />
                    
                    {/* Origin marker and label for forest */}
                    <group>
                      <mesh position={[0, 0, 0]}>
                        {/* <sphereGeometry args={[0.5, 16, 16]} /> */}
                        <meshBasicMaterial color={getColorForElement(placeholder.name)} />
                      </mesh>
                      
                      {/* <TextLabel 
                        text={`${placeholder.name}\nSize: [${placeholder.size[0].toFixed(1)} × ${placeholder.size[1].toFixed(1)} × ${placeholder.size[2].toFixed(1)}]\nPos: [${placeholder.position[0].toFixed(1)}, ${placeholder.position[1].toFixed(1)}, ${placeholder.position[2].toFixed(1)}]`} 
                        position={[0, placeholder.size[1] / 2 + 0.5, 0]}
                        color={getColorForElement(placeholder.name)}
                      /> */}
                    </group>
                  </group>
                ) : (
                  // Houses and other elements - use RigidBody with collider
                  <RigidBody 
                    type="fixed" 
                    colliders={false}
                    position={placeholder.position}
                    rotation={placeholder.rotation}
                    friction={1}
                    restitution={0}
                    lockTranslations={true}
                    lockRotations={true}
                    canSleep={false}
                  >
                    {/* Cuboid collider for houses */}
                    <CuboidCollider 
                      args={[placeholder.size[0] / 2, placeholder.size[1] / 2, placeholder.size[2] / 2]}
                    />
                    
                    <group>
                      {/* House - use actual 3D model scaled proportionally at original position */}
                      {(() => {
                        // Calculate uniform scale to fit in placeholder while maintaining proportions
                        const scaleX = placeholder.size[0] / houseModelSize.x
                        const scaleY = placeholder.size[1] / houseModelSize.y
                        const scaleZ = placeholder.size[2] / houseModelSize.z
                        const uniformScale = Math.min(scaleX, scaleY, scaleZ)
                        
                        // Use original element's Y position (already at ground level)
                        // Relative to placeholder's center position
                        const relativeY = placeholder.originalYPosition - placeholder.position[1]
                        
                        return (
                          <primitive 
                            object={houseModel.clone()} 
                            scale={uniformScale}
                            position={[0, relativeY, 0]} // Centered horizontally, original Y position
                          />
                        )
                      })()}
                      
                      {/* Origin marker - small sphere at center */}
                      <mesh position={[0, 0, 0]}>
                        <sphereGeometry args={[0.5, 16, 16]} />
                        <meshBasicMaterial 
                          color={getColorForElement(placeholder.name)}
                        />
                      </mesh>
                      
                      {/* Bounding Box visualization - shows the actual computed bounding box */}
                      {showBoundingBox && placeholder.boundingBox && placeholder.boundingBox.hasSize && (
                        <group position={[
                          placeholder.boundingBox.center[0] - placeholder.position[0],
                          placeholder.boundingBox.center[1] - placeholder.position[1],
                          placeholder.boundingBox.center[2] - placeholder.position[2]
                        ]}>
                          {/* Thin wireframe for bounding box */}
                          <mesh>
                            <boxGeometry args={placeholder.boundingBox.size} />
                            <meshBasicMaterial 
                              color="#00FFFF"
                              wireframe={true}
                              transparent={true}
                              opacity={0.9}
                            />
                          </mesh>
                          {/* Cyan corner markers for bounding box */}
                          <mesh>
                            <boxGeometry args={placeholder.boundingBox.size} />
                            <meshBasicMaterial 
                              color="#00FFFF"
                              transparent={true}
                              opacity={0.1}
                            />
                          </mesh>
                        </group>
                      )}
                      
                      {/* Visual axis helpers */}
                      {/* X axis - red */}
                      {/* <mesh position={[placeholder.size[0] / 2, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                        <cylinderGeometry args={[0.1, 0.1, placeholder.size[0], 8]} />
                        <meshBasicMaterial color="#ff0000" transparent={true} opacity={0.5} />
                      </mesh> */}
                      {/* Y axis - green */}
                      {/* <mesh position={[0, placeholder.size[1] / 2, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, placeholder.size[1], 8]} />
                        <meshBasicMaterial color="#00ff00" transparent={true} opacity={0.5} />
                      </mesh> */}
                      {/* Z axis - blue */}
                      {/* <mesh position={[0, 0, placeholder.size[2] / 2]} rotation={[Math.PI / 2, 0, 0]}>
                        <cylinderGeometry args={[0.1, 0.1, placeholder.size[2], 8]} />
                        <meshBasicMaterial color="#0000ff" transparent={true} opacity={0.5} />
                      </mesh> */}
                      
                      {/* Label to show element name and size */}
                      <TextLabel
                        text={`${placeholder.name}${placeholder.isEmptyContainer ? ' 📦' : ''}\nSize: [${placeholder.size[0].toFixed(1)} × ${placeholder.size[1].toFixed(1)} × ${placeholder.size[2].toFixed(1)}]\nPos: [${placeholder.position[0].toFixed(1)}, ${placeholder.position[1].toFixed(1)}, ${placeholder.position[2].toFixed(1)}]\nRot: [${(placeholder.rotation[0] * 180 / Math.PI).toFixed(0)}°, ${(placeholder.rotation[1] * 180 / Math.PI).toFixed(0)}°, ${(placeholder.rotation[2] * 180 / Math.PI).toFixed(0)}°]`} 
                        position={[0, placeholder.size[1]/2, 0]}
                        color={getColorForElement(placeholder.name)}
                      />
                    </group>
                  </RigidBody>
                )}
              </React.Fragment>
          )})}
        </group>
      )}
    </>
  )
}

/**
 * Simple text label component using HTML
 */
function TextLabel({ text, position, color }) {
  const lines = text.split('\n')
  
  return (
    <Html position={position} center distanceFactor={10}>
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        color: color,
        padding: '8px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        pointerEvents: 'none',
        border: `2px solid ${color}`,
        textShadow: '0 0 4px rgba(0,0,0,0.8)',
        textAlign: 'center'
      }}>
        {lines.map((line, index) => (
          <div key={index} style={{ 
            whiteSpace: 'nowrap',
            ...(index > 0 && { fontSize: '12px', opacity: 0.8, marginTop: '2px' })
          }}>
            {line}
          </div>
        ))}
      </div>
    </Html>
  )
}

// Preload the models
useGLTF.preload('/models/world1.glb')
useGLTF.preload('/models/houses/house1.glb')

