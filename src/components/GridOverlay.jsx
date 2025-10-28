import { useRef, useState } from "react"
import { useFrame } from "@react-three/fiber"
import { getTopGridPositions, getGridUnits, GRID_UNIT } from "../utils/physics"

export const GridOverlay = ({ 
  shapePosition, 
  shapeType, 
  dimensions, 
  onGridClick,
  visible = false 
}) => {
  const groupRef = useRef()
  const [hoveredCell, setHoveredCell] = useState(null)
  
  const gridUnits = getGridUnits(shapeType, dimensions)
  const gridPositions = getTopGridPositions(shapePosition, shapeType, dimensions)
  
  if (!visible || gridPositions.length === 0) return null
  
  return (
    <group ref={groupRef}>
      {gridPositions.map((position, index) => (
        <GridCell
          key={index}
          position={position}
          isHovered={hoveredCell === index}
          onClick={() => onGridClick(position)}
          onHover={(hovered) => setHoveredCell(hovered ? index : null)}
        />
      ))}
    </group>
  )
}

const GridCell = ({ position, isHovered, onClick, onHover }) => {
  const meshRef = useRef()
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.material.opacity = isHovered ? 0.8 : 0.3
    }
  })
  
  return (
    <mesh
      ref={meshRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      onClick={onClick}
      onPointerOver={() => onHover(true)}
      onPointerOut={() => onHover(false)}
    >
      <planeGeometry args={[GRID_UNIT * 0.9, GRID_UNIT * 0.9]} />
      <meshBasicMaterial 
        color={isHovered ? "#00ff00" : "#ffffff"} 
        transparent 
        opacity={0.3}
      />
    </mesh>
  )
}
