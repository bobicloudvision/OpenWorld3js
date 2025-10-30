import { CuboidCollider } from "@react-three/rapier"

// Physics configuration for cubes
export const PHYSICS_CONFIGS = {
  cube: {
    collider: CuboidCollider,
    colliderArgs: (size) => [size / 2, size / 2, size / 2],
    geometry: 'boxGeometry',
    geometryArgs: (size) => [size, size, size],
    faces: 6
  }
}

// Default dimensions for cubes
export const getDefaultDimensions = () => {
  return { size: 0.5 }
}

// Grid system for subdivision
export const GRID_UNIT = 0.5 // Base cube size

// Calculate how many grid units a cube occupies
export const getGridUnits = (shapeType, dimensions) => {
  const { size = 0.5 } = dimensions
  return {
    x: Math.round(size / GRID_UNIT),
    y: Math.round(size / GRID_UNIT),
    z: Math.round(size / GRID_UNIT)
  }
}

// Get grid positions for placing cubes on top of another cube
export const getTopGridPositions = (basePosition, baseShapeType, baseDimensions) => {
  const [x, y, z] = basePosition
  const gridUnits = getGridUnits(baseShapeType, baseDimensions)
  const positions = []
  
  // Calculate the top Y position
  const { size = 0.5 } = baseDimensions
  const halfHeight = size / 2
  const topY = y + halfHeight + GRID_UNIT / 2
  
  // Generate grid positions on the top face
  for (let gx = 0; gx < gridUnits.x; gx++) {
    for (let gz = 0; gz < gridUnits.z; gz++) {
      const gridX = x - (gridUnits.x - 1) * GRID_UNIT / 2 + gx * GRID_UNIT
      const gridZ = z - (gridUnits.z - 1) * GRID_UNIT / 2 + gz * GRID_UNIT
      positions.push([gridX, topY, gridZ])
    }
  }
  
  return positions
}

// Snap position to grid
export const snapToGrid = (position) => {
  const [x, y, z] = position
  return [
    Math.round(x / GRID_UNIT) * GRID_UNIT,
    Math.round(y / GRID_UNIT) * GRID_UNIT,
    Math.round(z / GRID_UNIT) * GRID_UNIT
  ]
}

// Common physics properties for cubes
export const getPhysicsProps = (shapeType, mass = 1000) => ({
  type: "dynamic",
  colliders: false,
  linearDamping: 0.5,
  angularDamping: 2.0,
  enabledTranslations: [false, true, false],
  enabledRotations: [false, false, false],
  canSleep: true
})

// Calculate face directions for cubes
export const getFaceDirections = (shapeType, position, dimensions) => {
  const [x, y, z] = position
  const { size = 0.5 } = dimensions || {}
  
  return [
    [x + size, y, z],      // right
    [x - size, y, z],      // left
    [x, y + size, z],      // top
    [x, y - size, z],      // bottom
    [x, y, z + size],      // front
    [x, y, z - size],      // back
  ]
}

// Get the collider component for a cube
export const getColliderComponent = (shapeType, config, mass, dimensions) => {
  const { collider: ColliderComponent, colliderArgs } = config
  
  // Call the colliderArgs function with the cube size
  const args = colliderArgs(dimensions.size)
  
  return <ColliderComponent args={args} mass={mass} friction={1} restitution={0} />
}
