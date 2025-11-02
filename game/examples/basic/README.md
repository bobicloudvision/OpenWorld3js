# Basic Game Example - Pure Engine API

This example demonstrates building a complete 3D game using **ONLY engine classes** - no Three.js knowledge required!

## ✅ Key Feature: NO Three.js Imports!

Notice the imports:
```javascript
import { 
  GameEngine, 
  Scene, 
  Actor, 
  MeshBuilder,
  Color 
} from '../../src/index.js';

// ✅ NO "import * as THREE from 'three'" needed!
```

## How to Run

### Option 1: From Project Root

```bash
# Make sure you're in the game directory
cd /Users/bozhidar/PhpstormProjects/OpenWorld3js/game

# Install dependencies (first time only)
npm install

# Run the example
npm run dev
```

Then open your browser to the URL shown (usually `http://localhost:5173`)

### Option 2: From Example Directory

```bash
# Navigate to the example
cd examples/basic

# Install dependencies if needed (from game root)
cd ../..
npm install
cd examples/basic

# Run dev server from root
cd ../..
npm run dev
```

### Option 3: Serve the Files

If you have a simple HTTP server:

```bash
# From game root
npx vite

# Or use any HTTP server
python3 -m http.server 3000
```

## Controls

- **WASD** or **Arrow Keys** - Move player
- **Mouse Movement** - Rotate camera
- **Mouse Wheel** - Zoom in/out
- **Space** - Jump

## What This Example Shows

### Pure Engine API Usage

**Creating the Ground:**
```javascript
const ground = MeshBuilder.createTerrain({
  width: 200,
  height: 200,
  color: Color.GRASS,
  heightVariation: 0.5
});
```

**Creating the Player:**
```javascript
const mesh = MeshBuilder.createBox({
  width: 1,
  height: 2,
  depth: 1,
  color: 0x4a90e2,
  castShadow: true
});

const player = new Actor({ speed: 8 });
player.mesh = mesh;
```

**Creating Obstacles:**
```javascript
const colors = [Color.RED, Color.ORANGE, Color.PURPLE, Color.CYAN];

const obstacle = MeshBuilder.createBox({
  width: size,
  height: size * 2,
  depth: size,
  color: colors[Math.floor(Math.random() * colors.length)]
});
```

## Code Structure

```
basic/
├── index.html     - HTML page with canvas
├── main.js        - Game code (NO Three.js!)
└── README.md      - This file
```

## Features Demonstrated

✅ Scene creation  
✅ Player with movement  
✅ Third-person camera  
✅ Input handling  
✅ Entity system  
✅ Mesh creation with MeshBuilder  
✅ Named colors with Color class  
✅ Terrain generation  
✅ Shadow casting  
✅ Fog effects  

## Customization Ideas

Try modifying the code:

1. **Change player color:**
```javascript
const mesh = MeshBuilder.createBox({
  color: Color.RED  // or Color.PURPLE, etc.
});
```

2. **Add more shapes:**
```javascript
const sphere = MeshBuilder.createSphere({
  radius: 2,
  color: Color.YELLOW
});
this.add(sphere);
```

3. **Change terrain:**
```javascript
const ground = MeshBuilder.createTerrain({
  color: Color.SAND,     // Desert theme
  heightVariation: 2.0   // More hills
});
```

4. **Adjust player speed:**
```javascript
const player = new Actor({ 
  speed: 15  // Faster movement
});
```

## No Three.js Knowledge Required!

This example uses **ONLY** engine abstractions:
- `GameEngine` - Main game engine
- `Scene` - Scene management
- `Actor` - Player with movement
- `ThirdPersonCamera` - Camera controller
- `MeshBuilder` - Create 3D shapes
- `Color` - Named colors

You don't need to know anything about Three.js to modify or extend this game!

## Next Steps

1. **Modify this example** - Change colors, speeds, sizes
2. **Check `/examples/engine-only/`** - Even more pure engine examples
3. **Add components** - See `/examples/rpg-with-components/` for health/combat
4. **Go multiplayer** - See `/examples/multiplayer/` for networking

## Troubleshooting

**Port already in use?**
```bash
# Kill the process using the port
lsof -ti:5173 | xargs kill -9

# Or use a different port
npx vite --port 3001
```

**Dependencies not installed?**
```bash
# From game root
npm install
```

**Module not found?**
Make sure you're running the dev server from the **game root directory**, not from the examples folder.

## Learn More

- **ENGINE_ABSTRACTION.md** - Understanding the abstraction layers
- **GETTING_STARTED.md** - Complete tutorial
- **README.md** - Full API reference

Enjoy building your game! 🎮

