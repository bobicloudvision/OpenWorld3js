# Engine Abstraction Levels

The engine supports **two approaches** for building games:

## Approach 1: Pure Engine API (Recommended for Beginners) ✅

Use **ONLY engine classes** - no Three.js knowledge required!

### What You Import
```javascript
import { 
  GameEngine,
  Scene,
  Actor,
  MeshBuilder,    // ← Abstracts Three.js meshes
  Color,          // ← Abstracts Three.js colors
  Vector3         // ← Abstracts Three.js vectors
} from './src/index.js';

// ✅ NO Three.js import needed!
```

### Example: Creating a Player
```javascript
// ✅ Using engine abstraction
const mesh = MeshBuilder.createBox({
  width: 1,
  height: 2,
  depth: 1,
  color: Color.BLUE,
  castShadow: true
});

const player = new Actor({ speed: 8 });
player.mesh = mesh;
```

### Benefits
- ✅ **Simple** - No Three.js knowledge required
- ✅ **Clean** - High-level API
- ✅ **Quick** - Faster prototyping
- ✅ **Protected** - Engine can change Three.js version without breaking your game

### Available Abstractions

#### MeshBuilder
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

#### Color
```javascript
Color.WHITE, Color.BLACK, Color.RED, Color.GREEN, Color.BLUE
Color.YELLOW, Color.CYAN, Color.MAGENTA, Color.ORANGE
Color.PURPLE, Color.PINK

// Terrain
Color.GRASS, Color.DIRT, Color.STONE, Color.SAND, Color.WATER

// UI
Color.SKY_BLUE, Color.DARK_GRAY, Color.LIGHT_GRAY

// Custom
Color.fromRGB(255, 128, 0)
Color.random()
```

#### Vector3 (Optional - Actor handles most cases)
```javascript
const v = new Vector3(x, y, z);
v.add(other);
v.subtract(other);
v.multiply(scalar);
v.normalize();
v.length();
v.distanceTo(other);

// Static helpers
Vector3.zero(), Vector3.one()
Vector3.up(), Vector3.down()
Vector3.left(), Vector3.right()
Vector3.forward(), Vector3.backward()
```

## Approach 2: Direct Three.js (Advanced Users) 🔧

Use Three.js directly for **full control** and advanced features.

### What You Import
```javascript
import * as THREE from 'three';
import { GameEngine, Scene, Actor } from './src/index.js';
```

### Example: Creating a Player
```javascript
// 🔧 Using Three.js directly
const geometry = new THREE.BoxGeometry(1, 2, 1);
const material = new THREE.MeshStandardMaterial({ 
  color: 0x0000ff,
  roughness: 0.5,
  metalness: 0.3
});
const mesh = new THREE.Mesh(geometry, material);

const player = new Actor({ speed: 8 });
player.mesh = mesh;
```

### Benefits
- ✅ **Powerful** - Full Three.js capabilities
- ✅ **Flexible** - Custom materials, shaders, etc.
- ✅ **Advanced** - Complex graphics features
- ✅ **Familiar** - If you already know Three.js

### When to Use Direct Three.js
- Custom shaders
- Advanced materials (PBR, etc.)
- Post-processing effects
- Complex geometry manipulation
- Custom loaders
- Performance optimization

## Comparison

### Pure Engine API
```javascript
// Simple, high-level
const player = MeshBuilder.createBox({
  width: 1,
  height: 2,
  depth: 1,
  color: Color.BLUE
});
```

### Direct Three.js
```javascript
// Powerful, low-level
const geometry = new THREE.BoxGeometry(1, 2, 1);
const material = new THREE.MeshStandardMaterial({
  color: 0x0000ff,
  roughness: 0.5,
  metalness: 0.3,
  envMap: envTexture,
  normalMap: normalTexture
});
const player = new THREE.Mesh(geometry, material);
```

## Examples Provided

### 1. `/examples/engine-only/` - Pure Engine API ✅
```javascript
// NO Three.js imports!
import { GameEngine, Scene, Actor, MeshBuilder, Color } from '../../src/index.js';

const mesh = MeshBuilder.createBox({ color: Color.BLUE });
```

### 2. `/examples/basic/` - Mixed Approach 🔀
```javascript
// Uses Three.js for advanced features
import * as THREE from 'three';
import { GameEngine, Scene, Actor } from '../../src/index.js';

const mesh = new THREE.Mesh(geometry, material);
```

### 3. `/examples/multiplayer/` - Mixed Approach 🔀
```javascript
// Uses Three.js for complex scenes
import * as THREE from 'three';
import { GameEngine, Scene, Actor } from '../../src/index.js';
```

## Recommendations

### For Beginners
Start with **Pure Engine API**:
- Use `MeshBuilder` for all shapes
- Use `Color` for all colors
- Use engine classes only
- No Three.js knowledge needed

### For Advanced Users
Use **Direct Three.js** when you need:
- Custom shaders
- Advanced materials
- Complex effects
- Performance tweaks

### Hybrid Approach
Mix both approaches:
```javascript
import * as THREE from 'three';
import { GameEngine, Scene, Actor, MeshBuilder, Color } from './src/index.js';

// Use engine API for simple stuff
const obstacle = MeshBuilder.createBox({ color: Color.RED });

// Use Three.js for advanced stuff
const customMaterial = new THREE.ShaderMaterial({
  vertexShader: myVertexShader,
  fragmentShader: myFragmentShader
});
const advancedMesh = new THREE.Mesh(geometry, customMaterial);
```

## Future Abstraction Expansion

We can add more abstractions as needed:
- `MaterialBuilder` - Pre-configured materials
- `LightBuilder` - Easy lighting setup
- `ParticleBuilder` - Particle effects
- `EffectBuilder` - Post-processing
- `AnimationBuilder` - Animation helpers

## Summary

| Feature | Pure Engine API | Direct Three.js |
|---------|----------------|-----------------|
| **Difficulty** | Easy | Medium-Hard |
| **Control** | High-level | Full control |
| **Learning Curve** | Minimal | Steep |
| **Code Verbosity** | Concise | Verbose |
| **Three.js Knowledge** | Not needed | Required |
| **Best For** | Beginners, Prototypes | Advanced users, Complex features |

**Bottom Line:** 
- Want to build games quickly? Use **Pure Engine API** ✅
- Need advanced graphics? Use **Direct Three.js** 🔧
- Want both? Use **Hybrid Approach** 🔀

The engine supports all three approaches - **choose what works best for you!**

