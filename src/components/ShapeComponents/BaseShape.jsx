import { useCallback, useRef, useState, useEffect } from "react"
import { useTexture } from "@react-three/drei"
import { RigidBody } from "@react-three/rapier"
import { PHYSICS_CONFIGS, getPhysicsProps, getFaceDirections, getColliderComponent, getDefaultDimensions, getTopGridPositions, snapToGrid } from "../../utils/physics"
import { GridOverlay } from "../GridOverlay"
import useShapeStore from "../../stores/shapeStore"
import dirt from "/textures/Material.010_diffuse.png"

// Base shape component that handles common functionality
export const BaseShape = ({ 
  id, 
  mass = 1000, 
  shapeType = 'cube', 
  dimensions = { size: 0.5 },
  ...props 
}) => {
  const ref = useRef()
  const [hover, set] = useState(null)
  const [showGrid, setShowGrid] = useState(false)
  const addShape = useShapeStore((state) => state.addShape)
  const defaultShapeType = useShapeStore((state) => state.defaultShapeType)
  const removeShapeById = useShapeStore((state) => state.removeShapeById)
  const texture = useTexture(dirt)
  
  const config = PHYSICS_CONFIGS[shapeType]
  const physicsProps = getPhysicsProps(shapeType, mass)
  
  // Hide grid when clicking elsewhere
  useEffect(() => {
    const handleClickOutside = () => {
      if (showGrid) {
        setShowGrid(false)
      }
    }
    
    if (showGrid) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showGrid])
  
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
      // Replace this shape with the currently selected sidebar shape at the same position
      const newType = defaultShapeType
      const newDims = getDefaultDimensions(newType)
      removeShapeById(id)
      addShape(x, y, z, newType, newDims)
    } else {
      // Determine if top face was clicked using face normal
      const faceIndex = Math.floor(e.faceIndex / 2)
      const isTopByIndex = faceIndex === 2
      const isTopByNormal = e.face && e.face.normal && e.face.normal.y > 0.9
      
      if (isTopByIndex || isTopByNormal) {
        // Top face clicked - show grid overlay for precise placement
        setShowGrid(true)
      } else {
        // Side face clicked - add shape adjacent
        const newType = defaultShapeType
        const newDims = getDefaultDimensions(newType)
        const faceDirections = getFaceDirections(shapeType, [x, y, z], dimensions)
        
        if (faceDirections[faceIndex]) {
          const [newX, newY, newZ] = faceDirections[faceIndex]
          const [snappedX, snappedY, snappedZ] = snapToGrid([newX, newY, newZ])
          addShape(snappedX, snappedY, snappedZ, newType, newDims)
        }
      }
    }
  }, [addShape, removeShapeById, id, shapeType, dimensions, defaultShapeType])
  
  // Handle grid cell click
  const handleGridClick = useCallback((gridPosition) => {
    const newType = defaultShapeType
    const newDims = getDefaultDimensions(newType)
    addShape(...gridPosition, newType, newDims)
    setShowGrid(false)
  }, [addShape, defaultShapeType])
  
  // Create geometry based on shape type
  const createGeometry = () => {
    const { geometry, geometryArgs } = config
    
    switch (geometry) {
      case 'boxGeometry':
        return <boxGeometry args={geometryArgs(...Object.values(dimensions))} />
      case 'cylinderGeometry':
        return <cylinderGeometry args={geometryArgs(...Object.values(dimensions))} />
      case 'coneGeometry':
        return <coneGeometry args={geometryArgs(...Object.values(dimensions))} />
      default:
        return <boxGeometry args={geometryArgs(...Object.values(dimensions))} />
    }
  }
  
  // Create materials for each face
  const createMaterials = () => {
    const faceCount = config.faces
    
    return [...Array(faceCount)].map((_, index) => (
      <meshStandardMaterial 
        attach={`material-${index}`} 
        key={index} 
        map={texture} 
        color={hover === index ? "hotpink" : "white"} 
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
      
      {/* Grid overlay for precise placement */}
      
      <GridOverlay
        shapePosition={props.position || [0, 0, 0]}
        shapeType={shapeType}
        dimensions={dimensions}
        onGridClick={handleGridClick}
        visible={showGrid}
      /> 
    </RigidBody>
  )
}
