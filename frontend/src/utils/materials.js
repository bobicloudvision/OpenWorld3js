// Material definitions with texture paths and properties
export const MATERIALS = {
  dirt: {
    id: 'dirt',
    name: 'Dirt',
    texture: '/textures/sand.png',
    color: '#8B7355',
    roughness: 0.8,
    metalness: 0.1
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    texture: '/textures/stone.png',
    color: '#6B6B6B',
    roughness: 0.9,
    metalness: 0.0
  },
  grass: {
    id: 'grass',
    name: 'Grass',
    texture: '/textures/grass.png',
    color: '#4A7C59',
    roughness: 0.7,
    metalness: 0.0
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    texture: '/textures/wood.png',
    color: '#8B4513',
    roughness: 0.6,
    metalness: 0.0
  },
  metal: {
    id: 'metal',
    name: 'Metal',
    texture: '/textures/stone2.png',
    color: '#B8B8B8',
    roughness: 0.2,
    metalness: 0.8
  },
  brick: {
    id: 'brick',
    name: 'Brick',
    texture: '/textures/stone.png',
    color: '#CD5C5C',
    roughness: 0.7,
    metalness: 0.0
  },
  concrete: {
    id: 'concrete',
    name: 'Concrete',
    texture: '/textures/stone2.png',
    color: '#9E9E9E',
    roughness: 0.8,
    metalness: 0.0
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    texture: '/textures/sand.png',
    color: '#D2B48C',
    roughness: 0.9,
    metalness: 0.0
  },
  water: {
    id: 'water',
    name: 'Water',
    texture: '/textures/water.png',
    color: '#4682B4',
    roughness: 0.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    texture: '/textures/water.png',
    color: '#E6F3FF',
    roughness: 0.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.3
  },
  marble: {
    id: 'marble',
    name: 'Marble',
    texture: '/textures/stone2.png',
    color: '#F8F8FF',
    roughness: 0.1,
    metalness: 0.0
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    texture: '/textures/stone2.png',
    color: '#DAA520',
    roughness: 0.1,
    metalness: 1.0
  }
}

// Default material
export const DEFAULT_MATERIAL = MATERIALS.dirt

// Get material by ID
export const getMaterialById = (id) => {
  return MATERIALS[id] || DEFAULT_MATERIAL
}

// Get all material IDs
export const getAllMaterialIds = () => {
  return Object.keys(MATERIALS)
}

// Get all materials as array
export const getAllMaterials = () => {
  return Object.values(MATERIALS)
}
