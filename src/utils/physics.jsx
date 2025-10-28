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

// Calculate the adjacent center position given a base shape and a target shape for a face index
// faceIndex mapping follows three.js box faces grouping (pairs):
// 0: +X (right), 1: -X (left), 2: +Y (top), 3: -Y (bottom), 4: +Z (front), 5: -Z (back)
export const getAdjacentPosition = (baseShapeType, baseDimensions, targetShapeType, targetDimensions, basePosition, faceIndex) => {
  const [x, y, z] = basePosition

  // helper to compute full extents for a shape
  const getExtents = (shapeType, dims) => {
    switch (shapeType) {
      case 'cube': {
        const { size = 0.5 } = dims || {}
        return { dx: size, dy: size, dz: size }
      }
      case 'cuboid': {
        const { width = 1, height = 0.5, depth = 0.5 } = dims || {}
        return { dx: width, dy: height, dz: depth }
      }
      case 'cylinder': {
        const { radius = 0.25, height = 1 } = dims || {}
        const d = radius * 2
        return { dx: d, dy: height, dz: d }
      }
      case 'cone': {
        const { radius = 0.25, height = 1 } = dims || {}
        const d = radius * 2
        return { dx: d, dy: height, dz: d }
      }
      default: {
        const { size = 0.5 } = dims || {}
        return { dx: size, dy: size, dz: size }
      }
    }
  }

  const base = getExtents(baseShapeType, baseDimensions)
  const target = getExtents(targetShapeType, targetDimensions)

  switch (faceIndex) {
    case 0: // right +X
      return [x + (base.dx / 2) + (target.dx / 2), y, z]
    case 1: // left -X
      return [x - (base.dx / 2) - (target.dx / 2), y, z]
    case 2: // top +Y
      return [x, y + (base.dy / 2) + (target.dy / 2), z]
    case 3: // bottom -Y
      return [x, y - (base.dy / 2) - (target.dy / 2), z]
    case 4: // front +Z
      return [x, y, z + (base.dz / 2) + (target.dz / 2)]
    case 5: // back -Z
      return [x, y, z - (base.dz / 2) - (target.dz / 2)]
    default:
      return [x, y, z]
  }
}

// Compute half extents for a shape type and dimensions
export const getHalfExtents = (shapeType, dimensions) => {
  switch (shapeType) {
    case 'cube': {
      const { size = 0.5 } = dimensions || {}
      const h = size / 2
      return { hx: h, hy: h, hz: h }
    }
    case 'cuboid': {
      const { width = 1, height = 0.5, depth = 0.5 } = dimensions || {}
      return { hx: width / 2, hy: height / 2, hz: depth / 2 }
    }
    case 'cylinder': {
      const { radius = 0.25, height = 1 } = dimensions || {}
      return { hx: radius, hy: height / 2, hz: radius }
    }
    case 'cone': {
      const { radius = 0.25, height = 1 } = dimensions || {}
      return { hx: radius, hy: height / 2, hz: radius }
    }
    default: {
      const { size = 0.5 } = dimensions || {}
      const h = size / 2
      return { hx: h, hy: h, hz: h }
    }
  }
}

// Axis-aligned bounding box from center position
export const getAABB = (center, shapeType, dimensions) => {
  const [cx, cy, cz] = center
  const { hx, hy, hz } = getHalfExtents(shapeType, dimensions)
  return {
    min: [cx - hx, cy - hy, cz - hz],
    max: [cx + hx, cy + hy, cz + hz]
  }
}

// AABB overlap test
export const aabbOverlaps = (a, b) => {
  return !(
    a.max[0] <= b.min[0] || a.min[0] >= b.max[0] ||
    a.max[1] <= b.min[1] || a.min[1] >= b.max[1] ||
    a.max[2] <= b.min[2] || a.min[2] >= b.max[2]
  )
}

// Resolve a non-overlapping position by stepping along direction in GRID_UNIT increments
export const resolveNonOverlappingPosition = (candidateCenter, targetShapeType, targetDimensions, existingShapes, direction, maxSteps = 20) => {
  const norm = Math.hypot(direction[0], direction[1], direction[2]) || 1
  const step = [
    (direction[0] / norm) * GRID_UNIT,
    (direction[1] / norm) * GRID_UNIT,
    (direction[2] / norm) * GRID_UNIT,
  ]

  let current = [...candidateCenter]
  const targetAABB = (center) => getAABB(center, targetShapeType, targetDimensions)

  const overlapsAny = (center) => {
    const aabb = targetAABB(center)
    for (const s of existingShapes) {
      const b = getAABB(s.position, s.type, s.dimensions)
      if (aabbOverlaps(aabb, b)) return true
    }
    return false
  }

  if (!overlapsAny(current)) return current

  for (let i = 0; i < maxSteps; i++) {
    current = [current[0] + step[0], current[1] + step[1], current[2] + step[2]]
    if (!overlapsAny(current)) return current
  }
  return current
}

// Get the appropriate collider component for a shape
export const getColliderComponent = (shapeType, config, mass, dimensions) => {
  const { collider: ColliderComponent, colliderArgs } = config
  
  // Call the colliderArgs function with the appropriate dimensions
  const args = colliderArgs(...Object.values(dimensions))
  
  return <ColliderComponent args={args} mass={mass} friction={1} restitution={0} />
}
