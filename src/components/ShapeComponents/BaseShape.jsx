import { useCallback, useRef, useState } from "react"
import { useTexture } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { PHYSICS_CONFIGS, getPhysicsProps, getFaceDirections, getColliderComponent, getDefaultDimensions, snapToGrid } from "../../utils/physics"
import useShapeStore from "../../stores/shapeStore"
import useMaterialStore from "../../stores/materialStore"
import { DEFAULT_MATERIAL } from "../../utils/materials"

// Base shape component that handles common functionality
export const BaseShape = ({ 
  id, 
  mass = 1000, 
  shapeType = 'cube', 
  dimensions = { size: 0.5 },
  material = DEFAULT_MATERIAL,
  ...props 
}) => {
  const ref = useRef()
  const [hover, set] = useState(null)
  const addShape = useShapeStore((state) => state.addShape)
  const removeShapeById = useShapeStore((state) => state.removeShapeById)
  const selectedMaterial = useMaterialStore((state) => state.selectedMaterial)
  const texture = useTexture(material.texture)
  
  const config = PHYSICS_CONFIGS[shapeType]
  const physicsProps = getPhysicsProps(shapeType, mass)
  
  const onMove = useCallback((e) => {
    e.stopPropagation()
    set(Math.floor(e.faceIndex / 2))
  }, [])
  
  const onOut = useCallback(() => set(null), [])
  
  const onClick = useCallback((e) => {
    e.stopPropagation()
    const { x, y, z } = ref.current.translation()
    
    // Check if Shift key is held for delete mode
    const isDeleteMode = e.nativeEvent.shiftKey
    const isReplace = e.nativeEvent.altKey
    
    if (isDeleteMode) {
      // Delete this shape by id
      removeShapeById(id)
    } else if (isReplace) {
      // Replace this cube at the same position
      const newDims = getDefaultDimensions()
      removeShapeById(id)
      addShape(x, y, z, newDims, selectedMaterial)
    } else {
      // Add cube adjacent to clicked face
      const newDims = getDefaultDimensions()
      const faceIndex = Math.floor(e.faceIndex / 2)
      const faceDirections = getFaceDirections(shapeType, [x, y, z], dimensions)
      
      if (faceDirections[faceIndex]) {
        const [newX, newY, newZ] = faceDirections[faceIndex]
        const [snappedX, snappedY, snappedZ] = snapToGrid([newX, newY, newZ])
        addShape(snappedX, snappedY, snappedZ, newDims, selectedMaterial)
      }
    }
  }, [addShape, removeShapeById, id, shapeType, dimensions, selectedMaterial])
  
  // Create geometry for cube
  const createGeometry = () => {
    const { geometryArgs } = config
    return <boxGeometry args={geometryArgs(dimensions.size)} />
  }
  
  // Create materials for each face
  const createMaterials = () => {
    const faceCount = config.faces
    
    return [...Array(faceCount)].map((_, index) => (
      <meshStandardMaterial 
        attach={`material-${index}`} 
        key={index} 
        map={texture} 
        color={hover === index ? "hotpink" : material.color} 
        roughness={material.roughness}
        metalness={material.metalness}
        transparent={material.transparent}
        opacity={material.opacity}
      />
    ))
  }
  
  return (
    <RigidBody
      {...props}
      {...physicsProps}
      ref={ref}
    >
      <mesh receiveShadow castShadow onPointerMove={onMove} onPointerOut={onOut} onClick={onClick}>
        {createMaterials()}
        {createGeometry()}
      </mesh>
      {getColliderComponent(shapeType, config, mass, dimensions)}
    </RigidBody>
  )
}
