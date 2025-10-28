// Material definitions with texture paths and properties
export const MATERIALS = {
  dirt: {
    id: 'dirt',
    name: 'Dirt',
    texture: '/textures/Material.010_diffuse.png',
    color: '#8B4513',
    roughness: 0.8,
    metalness: 0.1
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    texture: '/textures/Material.001_diffuse.png',
    color: '#696969',
    roughness: 0.9,
    metalness: 0.0
  },
  grass: {
    id: 'grass',
    name: 'Grass',
    texture: '/textures/Material.002_diffuse.png',
    color: '#228B22',
    roughness: 0.7,
    metalness: 0.0
  },
  wood: {
    id: 'wood',
    name: 'Wood',
    texture: '/textures/Material.003_diffuse.png',
    color: '#8B4513',
    roughness: 0.6,
    metalness: 0.0
  },
  metal: {
    id: 'metal',
    name: 'Metal',
    texture: '/textures/Material.004_diffuse.png',
    color: '#C0C0C0',
    roughness: 0.2,
    metalness: 0.8
  },
  brick: {
    id: 'brick',
    name: 'Brick',
    texture: '/textures/Material.005_diffuse.png',
    color: '#B22222',
    roughness: 0.7,
    metalness: 0.0
  },
  concrete: {
    id: 'concrete',
    name: 'Concrete',
    texture: '/textures/Material.006_diffuse.png',
    color: '#A9A9A9',
    roughness: 0.8,
    metalness: 0.0
  },
  sand: {
    id: 'sand',
    name: 'Sand',
    texture: '/textures/Material.007_diffuse.png',
    color: '#F4A460',
    roughness: 0.9,
    metalness: 0.0
  },
  water: {
    id: 'water',
    name: 'Water',
    texture: '/textures/Material.008_diffuse.png',
    color: '#4169E1',
    roughness: 0.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.8
  },
  glass: {
    id: 'glass',
    name: 'Glass',
    texture: '/textures/Material.009_diffuse.png',
    color: '#FFFFFF',
    roughness: 0.0,
    metalness: 0.0,
    transparent: true,
    opacity: 0.3
  },
  marble: {
    id: 'marble',
    name: 'Marble',
    texture: '/textures/Material.011_diffuse.png',
    color: '#F5F5DC',
    roughness: 0.1,
    metalness: 0.0
  },
  gold: {
    id: 'gold',
    name: 'Gold',
    texture: '/textures/Material.012_diffuse.png',
    color: '#FFD700',
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
