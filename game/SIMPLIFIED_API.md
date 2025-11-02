# ⚡ Simplified API Guide

This document explains the **simplified API** that makes game creation **90% easier**!

## 🎯 The Problem

Creating games with the raw engine requires a lot of boilerplate code:
- 15+ lines to create ground with physics
- 20+ lines to create a player with physics  
- 30+ lines to create walls
- 10+ lines to setup camera
- Lots of repetitive physics setup

## ✅ The Solution

Two new classes that drastically simplify game creation:

### 1. `PhysicsScene` - Extended Scene Class
### 2. `GameHelpers` - Utility Functions

## 📚 Quick Start

### Before (Complex):

```javascript
import { GameEngine, Scene, Actor, MeshBuilder, Color } from './engine';

class MyGame extends Scene {
  async load() {
    // Ground - 15 lines
    const ground = MeshBuilder.createPlane({ 
      width: 100, 
      height: 100, 
      color: Color.GRASS,
      receiveShadow: true 
    });
    ground.rotation.x = -Math.PI / 2;
    this.add(ground);
    
    const physics = this.engine.physicsManager;
    physics.createPlane({
      mass: 0,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 }
    });
    
    // Player - 20+ lines
    const mesh = MeshBuilder.createBox({
      width: 1,
      height: 2,
      depth: 1,
      color: Color.BLUE,
      castShadow: true
    });
    
    this.player = new Actor({
      name: 'Player',
      speed: 8
    });
    this.player.mesh = mesh;
    this.player.setPosition(0, 2, 0);
    
    const body = physics.addToEntity(this.player, {
      type: 'box',
      width: 1,
      height: 2,
      depth: 1,
      mass: 5
    });
    body.fixedRotation = true;
    body.updateMassProperties();
    body.linearDamping = 0.1;
    
    this.addEntity(this.player);
    
    // ... more boilerplate
  }
}
```

### After (Simple!):

```javascript
import { GameEngine, PhysicsScene, Color } from './engine';

class MyGame extends PhysicsScene {  // ← Use PhysicsScene!
  async load() {
    // Ground - 1 line!
    this.addGround({ size: 100, showGrid: true });
    
    // Player - 1 line!
    this.player = this.addPlayer({ 
      position: { x: 0, y: 2, z: 0 },
      color: Color.BLUE 
    });
    
    // Walls - 1 line!
    this.addWalls({ size: 50 });
    
    // Camera - 1 line!
    this.camera = this.setupCamera(this.player);
    
    // Input - 1 line!
    this.setupInput();
  }
}
```

**Result: 90% less code!** 🎉

## 🛠️ PhysicsScene API

### Creating Objects

#### `addGround(options)`
Create ground plane with physics and optional grid.

```javascript
this.addGround({
  size: 100,           // Ground size (default: 100)
  color: Color.GRASS,  // Ground color (default: GRASS)
  showGrid: true       // Show grid helper (default: true)
});
```

#### `addPlayer(options)`
Create player actor with physics body.

```javascript
this.player = this.addPlayer({
  position: { x: 0, y: 2, z: 0 },
  shape: 'box',        // 'box', 'sphere', 'capsule'
  color: Color.BLUE,
  speed: 8,            // Movement speed
  mass: 5,             // Physics mass
  size: {              // Custom size
    width: 1,
    height: 2,
    depth: 1
  }
});
```

#### `addCollectible(options)`
Create collectible object (coin, power-up, goal, etc.).

```javascript
const item = this.addCollectible({
  position: { x: 10, y: 2, z: 10 },
  shape: 'cylinder',   // 'box', 'sphere', 'cylinder'
  color: Color.YELLOW,
  glow: true,          // Makes it glow!
  isTrigger: true,     // No collision, just detection
  size: {
    radius: 2,
    height: 5
  }
});

// Returns: { mesh, body, position, collected: false }
```

#### `addWalls(options)`
Create boundary walls around the arena.

```javascript
this.addWalls({
  size: 50,            // Arena size
  height: 3,           // Wall height
  thickness: 1,        // Wall thickness
  color: Color.GRAY
});
```

### Setup Methods

#### `setupCamera(target, options)`
Setup third-person camera following a target.

```javascript
this.camera = this.setupCamera(this.player, {
  distance: 15,        // Camera distance
  height: 8,           // Camera height
  smoothness: 0.15     // Follow smoothness
});

// Don't forget to update in your update() method:
this.camera.update(deltaTime);
```

#### `setupInput(customBindings)`
Setup common input bindings (WASD, Space, E, R).

```javascript
// Default bindings
this.setupInput();

// Custom bindings
this.setupInput({
  forward: ['KeyW', 'ArrowUp'],
  backward: ['KeyS', 'ArrowDown'],
  left: ['KeyA', 'ArrowLeft'],
  right: ['KeyD', 'ArrowRight'],
  jump: ['Space'],
  action: ['KeyE'],
  reset: ['KeyR'],
  special: ['KeyF']  // Add custom actions
});
```

### Helper Methods

#### `isNear(obj1, obj2, distance)`
Check if two objects are within distance.

```javascript
if (this.isNear(this.player, collectible, 3)) {
  // Player is within 3 units of collectible
  this.collectItem(collectible);
}
```

#### `pushActor(actor, direction, force)`
Apply force to move an actor (physics-based).

```javascript
const direction = { x: 1, y: 0, z: 0 };
this.pushActor(this.player, direction, 15);
```

#### `jumpActor(actor, force)`
Make an actor jump (with ground check).

```javascript
if (input.isActionPressed('jump')) {
  const didJump = this.jumpActor(this.player, 80);
  if (didJump) {
    console.log('Jumped!');
  }
}
```

## 📊 Code Reduction Comparison

| Task | Without Helpers | With Helpers | Reduction |
|------|----------------|--------------|-----------|
| Ground + Physics | 15 lines | **1 line** | 93% |
| Player + Physics | 20 lines | **1 line** | 95% |
| Walls (4 sides) | 30 lines | **1 line** | 97% |
| Camera Setup | 10 lines | **1 line** | 90% |
| Input Setup | 8 lines | **1 line** | 87% |
| **Total** | **~83 lines** | **~5 lines** | **94%** |

## 🎮 Complete Example

Here's a complete game in ~100 lines:

```javascript
import { GameEngine, PhysicsScene, Color } from './engine';

class CollectGame extends PhysicsScene {
  constructor(engine) {
    super(engine);
    this.backgroundColor = Color.SKY_BLUE;
    this.score = 0;
    this.collectibles = [];
  }

  async load() {
    // Create world - 3 lines!
    this.addGround({ size: 100, showGrid: true });
    this.player = this.addPlayer({ color: Color.BLUE });
    this.addWalls({ size: 50 });

    // Create 5 collectibles - loop
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const item = this.addCollectible({
        position: { 
          x: Math.cos(angle) * 20, 
          y: 2.5, 
          z: Math.sin(angle) * 20 
        },
        color: Color.YELLOW,
        glow: true
      });
      this.collectibles.push(item);
    }

    // Setup camera and input - 2 lines!
    this.camera = this.setupCamera(this.player);
    this.setupInput();
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Movement
    const input = this.engine.inputManager;
    const forward = this.camera.getForwardDirection();
    const right = this.camera.getRightDirection();

    const dir = { x: 0, y: 0, z: 0 };
    if (input.isActionDown('forward')) { 
      dir.x += forward.x; 
      dir.z += forward.z; 
    }
    if (input.isActionDown('backward')) { 
      dir.x -= forward.x; 
      dir.z -= forward.z; 
    }
    if (input.isActionDown('left')) { 
      dir.x -= right.x; 
      dir.z -= right.z; 
    }
    if (input.isActionDown('right')) { 
      dir.x += right.x; 
      dir.z += right.z; 
    }

    // Push and jump - easy!
    if (dir.x !== 0 || dir.z !== 0) {
      this.pushActor(this.player, dir, 15);
    }
    if (input.isActionPressed('jump')) {
      this.jumpActor(this.player, 80);
    }

    // Check collectibles - easy distance check!
    this.collectibles.forEach(item => {
      if (!item.collected && this.isNear(this.player, item, 3)) {
        item.collected = true;
        this.score += 10;
        item.mesh.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => this.remove(item.mesh), 300);
      }
    });

    // Update
    this.camera.update(deltaTime);
    this.player.mesh.position.copy(this.player.physicsBody.position);
  }
}

// Start game
const engine = new GameEngine({
  canvas: document.getElementById('game-canvas'),
  physics: true,
  physicsConfig: { gravity: -25 }
});

engine.loadScene(CollectGame);
engine.start();
```

**That's it! A complete game in ~100 lines!**

## 🔧 Advanced Usage

### Mix with Manual Code

You can still use manual code when needed:

```javascript
class MyGame extends PhysicsScene {
  async load() {
    // Use helpers for simple stuff
    this.addGround();
    this.player = this.addPlayer();

    // Use manual code for custom stuff
    const customMesh = MeshBuilder.createBox({
      width: 5,
      height: 1,
      depth: 5,
      color: 0xff0000
    });
    customMesh.position.y = 10;
    this.add(customMesh);

    // Still have access to everything
    const physics = this.engine.physicsManager;
    const body = physics.createBox({
      width: 5,
      height: 1,
      depth: 5,
      mass: 10,
      position: { x: 0, y: 10, z: 0 }
    });
  }
}
```

### Access Underlying Systems

Everything is still accessible:

```javascript
// Access helpers directly
this.helpers.createCollectible({...});

// Access engine systems
this.engine.physicsManager
this.engine.inputManager
this.engine.cameraManager

// Use parent Scene methods
this.add(mesh)
this.addEntity(entity)
this.remove(mesh)
```

## 💡 When to Use What

### Use `PhysicsScene` when:
- ✅ Building a simple game
- ✅ Rapid prototyping
- ✅ Learning the engine
- ✅ You need physics
- ✅ You want less boilerplate

### Use `Scene` when:
- ✅ Need full control
- ✅ Building complex systems
- ✅ Custom physics setup
- ✅ No physics needed
- ✅ Optimizing performance

### Use `GameHelpers` directly when:
- ✅ Not using PhysicsScene
- ✅ Want helpers in regular Scene
- ✅ Building custom scene base class

```javascript
import { Scene, GameHelpers } from './engine';

class MyScene extends Scene {
  async load() {
    this.helpers = new GameHelpers(this);
    
    // Use helpers
    this.helpers.createGround({...});
    this.helpers.createPlayer({...});
  }
}
```

## 🎯 Best Practices

1. **Start with PhysicsScene** - Use it for initial development
2. **Optimize later** - If performance matters, optimize specific parts
3. **Mix as needed** - Combine helpers with manual code
4. **Read the code** - Check `src/helpers/` to learn implementation
5. **Extend it** - Create your own helper methods

## 📚 Files

- `src/helpers/PhysicsScene.js` - Extended scene class
- `src/helpers/GameHelpers.js` - Helper functions
- `examples/simple-game/` - Complete example

## 🚀 Try It!

```bash
npm run dev
# Open: http://localhost:5173/examples/simple-game/
```

---

**Now you can build games FAST!** ⚡🎮

The simplified API reduces boilerplate by 90% while keeping all the power and flexibility of the full engine!

