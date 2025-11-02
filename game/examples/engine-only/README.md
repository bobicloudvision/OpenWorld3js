# Engine-Only Example

This example demonstrates building a game using **ONLY engine classes** - no Three.js code!

## Key Point

**Notice there's NO `import * as THREE from 'three'` in the game code!**

## What This Example Uses

### Engine Classes Only
```javascript
import { 
  GameEngine,      // ✅ Engine core
  Scene,           // ✅ Scene management
  Actor,           // ✅ Moving entities
  ThirdPersonCamera, // ✅ Camera controller
  MeshBuilder,     // ✅ Create meshes (NO THREE.Mesh)
  Color,           // ✅ Colors (NO 0xffffff)
  Vector3          // ✅ Vectors (NO THREE.Vector3)
} from '../../src/index.js';
```

### No Three.js Imports
```javascript
// ❌ NO THIS:
// import * as THREE from 'three';

// ✅ JUST THIS:
import { GameEngine, MeshBuilder, Color } from '../../src/index.js';
```

## Code Comparison

### This Example (Engine-Only)
```javascript
// Create player mesh
const mesh = MeshBuilder.createBox({
  width: 1,
  height: 2,
  depth: 1,
  color: Color.BLUE,
  castShadow: true
});

// Create terrain
const ground = MeshBuilder.createTerrain({
  width: 200,
  height: 200,
  color: Color.GRASS,
  heightVariation: 0.5
});
```

### Other Examples (With Three.js)
```javascript
// Create player mesh
const geometry = new THREE.BoxGeometry(1, 2, 1);
const material = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const mesh = new THREE.Mesh(geometry, material);

// Create terrain
const geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
const material = new THREE.MeshStandardMaterial({ color: 0x3a8c3a });
const ground = new THREE.Mesh(geometry, material);
```

## What You Can Create

### Shapes
```javascript
MeshBuilder.createBox({ width, height, depth, color })
MeshBuilder.createSphere({ radius, color })
MeshBuilder.createCylinder({ radiusTop, radiusBottom, height, color })
MeshBuilder.createPlane({ width, height, color })
MeshBuilder.createCapsule({ radius, length, color })
MeshBuilder.createTorus({ radius, tube, color })
MeshBuilder.createCone({ radius, height, color })
MeshBuilder.createTerrain({ width, height, color, heightVariation })
```

### Colors
```javascript
Color.WHITE, Color.BLACK
Color.RED, Color.GREEN, Color.BLUE
Color.YELLOW, Color.CYAN, Color.MAGENTA
Color.ORANGE, Color.PURPLE, Color.PINK
Color.GRASS, Color.DIRT, Color.STONE, Color.SAND, Color.WATER
Color.SKY_BLUE, Color.DARK_GRAY, Color.LIGHT_GRAY

Color.fromRGB(255, 128, 0)
Color.random()
```

## Running This Example

```bash
cd examples/engine-only
npm run dev
```

## Why This Approach?

### Benefits
1. **No Three.js Knowledge Required**
   - You don't need to learn Three.js
   - Just learn the engine API

2. **Simpler Code**
   - One import line vs multiple
   - High-level abstractions
   - Less boilerplate

3. **Engine Can Evolve**
   - Engine can change Three.js versions
   - Engine can optimize internally
   - Your game code stays the same

4. **Faster Development**
   - Less code to write
   - Clearer intent
   - Easier to maintain

### When to Use Direct Three.js Instead

Use Three.js directly (like other examples) when you need:
- Custom shaders
- Advanced materials (PBR, etc.)
- Post-processing effects
- Complex geometry manipulation
- Performance optimization
- Advanced Three.js features

## File Structure

```
engine-only/
├── index.html     - Simple HTML
├── main.js        - Game code (NO Three.js imports!)
└── README.md      - This file
```

## The Main Point

**You can build complete 3D games using ONLY the engine API!**

No need to touch Three.js unless you want advanced features.

The engine provides everything you need:
- ✅ Shape creation
- ✅ Colors
- ✅ Entities
- ✅ Scenes
- ✅ Cameras
- ✅ Input
- ✅ Physics
- ✅ Networking
- ✅ Everything!

## Compare With Other Examples

| Example | Three.js Import? | Difficulty | Best For |
|---------|-----------------|------------|----------|
| **engine-only/** | ❌ NO | Easy | Beginners, Quick prototypes |
| basic/ | ✅ YES | Medium | General games |
| multiplayer/ | ✅ YES | Medium | Multiplayer games |
| rpg-with-components/ | ✅ YES | Medium | RPG games |

Try this example first, then explore others for advanced features!

