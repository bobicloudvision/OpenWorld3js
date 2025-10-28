import { RigidBody, CuboidCollider, CylinderCollider, BallCollider } from "@react-three/rapier"

// Physics configuration for different shapes
export const PHYSICS_CONFIGS = {
  cube: {
    collider: CuboidCollider,
    colliderArgs: (size) => [size / 2, size / 2, size / 2],
    geometry: 'boxGeometry',
    geometryArgs: (size) => [size, size, size],
    faces: 6
  },
  cuboid: {
    collider: CuboidCollider,
    colliderArgs: (width, height, depth) => [width / 2, height / 2, depth / 2],
    geometry: 'boxGeometry',
    geometryArgs: (width, height, depth) => [width, height, depth],
    faces: 6
  },
  cylinder: {
    collider: CylinderCollider,
    colliderArgs: (radius, height) => [radius, height / 2],
    geometry: 'cylinderGeometry',
    geometryArgs: (radius, height) => [radius, radius, height, 8],
    faces: 3 // top, bottom, side
  },
  cone: {
    collider: CylinderCollider, // Using cylinder collider for cone approximation
    colliderArgs: (radius, height) => [radius, height / 2],
    geometry: 'coneGeometry',
    geometryArgs: (radius, height) => [radius, height, 8],
    faces: 2 // base, side
  }
}

// Default dimensions per shape type
export const getDefaultDimensions = (shapeType) => {
  switch (shapeType) {
    case 'cube':
      return { size: 0.5 }
    case 'cuboid':
      return { width: 1, height: 0.5, depth: 0.5 }
    case 'cylinder':
      return { radius: 0.25, height: 1 }
    case 'cone':
      return { radius: 0.25, height: 1 }
    default:
      return { size: 0.5 }
  }
}

// Grid system for subdivision
export const GRID_UNIT = 0.5 // Base cube size

// Calculate how many grid units a shape occupies
export const getGridUnits = (shapeType, dimensions) => {
  switch (shapeType) {
    case 'cube': {
      const { size = 0.5 } = dimensions
      return {
        x: Math.round(size / GRID_UNIT),
        y: Math.round(size / GRID_UNIT),
        z: Math.round(size / GRID_UNIT)
      }
    }
    case 'cuboid': {
      const { width = 1, height = 0.5, depth = 0.5 } = dimensions
      return {
        x: Math.round(width / GRID_UNIT),
        y: Math.round(height / GRID_UNIT),
        z: Math.round(depth / GRID_UNIT)
      }
    }
    case 'cylinder': {
      const { radius = 0.25, height = 1 } = dimensions
      const diameter = radius * 2
      return {
        x: Math.round(diameter / GRID_UNIT),
        y: Math.round(height / GRID_UNIT),
        z: Math.round(diameter / GRID_UNIT)
      }
    }
    case 'cone': {
      const { radius = 0.25, height = 1 } = dimensions
      const diameter = radius * 2
      return {
        x: Math.round(diameter / GRID_UNIT),
        y: Math.round(height / GRID_UNIT),
        z: Math.round(diameter / GRID_UNIT)
      }
    }
    default:
      return { x: 1, y: 1, z: 1 }
  }
}

// Get grid positions for placing shapes on top of another shape
export const getTopGridPositions = (basePosition, baseShapeType, baseDimensions) => {
  const [x, y, z] = basePosition
  const gridUnits = getGridUnits(baseShapeType, baseDimensions)
  const positions = []
  
  // Calculate the top Y position
  const halfHeight = (baseDimensions.height ?? baseDimensions.size ?? 1) / 2
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

// Common physics properties for all shapes
export const getPhysicsProps = (shapeType, mass = 1000, size = 0.5) => ({
  type: "dynamic",
  colliders: false,
  linearDamping: 0.5,
  angularDamping: 2.0,
  enabledTranslations: [false, true, false],
  enabledRotations: [false, false, false],
  canSleep: true
})

// Calculate face directions for different shapes
export const getFaceDirections = (shapeType, position, dimensions) => {
  const [x, y, z] = position

  // Compute full extents per axis for the current shape
  let dx = 0, dy = 0, dz = 0
  switch (shapeType) {
    case 'cube': {
      const { size = 0.5 } = dimensions || {}
      dx = size
      dy = size
      dz = size
      break
    }
    case 'cuboid': {
      const { width = 1, height = 0.5, depth = 0.5 } = dimensions || {}
      dx = width
      dy = height
      dz = depth
      break
    }
    case 'cylinder': {
      const { radius = 0.25, height = 1 } = dimensions || {}
      dx = radius * 2
      dy = height
      dz = radius * 2
      break
    }
    case 'cone': {
      const { radius = 0.25, height = 1 } = dimensions || {}
      dx = radius * 2
      dy = height
      dz = radius * 2
      break
    }
    default: {
      const { size = 0.5 } = dimensions || {}
      dx = dy = dz = size
      break
    }
  }

  return [
    [x + dx, y, z],      // right
    [x - dx, y, z],      // left
    [x, y + dy, z],      // top
    [x, y - dy, z],      // bottom
    [x, y, z + dz],      // front
    [x, y, z - dz],      // back
  ]
}

// Get the appropriate collider component for a shape
export const getColliderComponent = (shapeType, config, mass, dimensions) => {
  const { collider: ColliderComponent, colliderArgs } = config
  
  // Call the colliderArgs function with the appropriate dimensions
  const args = colliderArgs(...Object.values(dimensions))
  
  return <ColliderComponent args={args} mass={mass} friction={1} restitution={0} />
}
