# Physics Architecture

This document explains how physics is integrated into the game engine through the **PhysicsManager** class.

## 🎯 Design Principles

### 1. **Not Hardcoded in Scenes**
Physics logic is completely separate from game scenes. The `PhysicsManager` is a standalone system that can be used by any scene without coupling.

### 2. **Optional & Opt-In**
Physics is disabled by default. Games that don't need physics won't load Cannon.js, keeping your bundle small and performance high.

### 3. **Clean API**
The PhysicsManager wraps Cannon.js with a clean, game-engine-friendly API. You don't need to know Cannon.js internals to use physics.

### 4. **Engine Integration**
PhysicsManager is a core engine system that updates automatically in the game loop, just like InputManager and CameraManager.

## 📁 File Structure

```
src/
├── physics/
│   └── PhysicsManager.js   ← All physics logic here
├── core/
│   └── GameEngine.js        ← Initializes PhysicsManager
└── index.js                 ← Exports PhysicsManager
```

## 🔧 How It Works

### 1. Enable Physics in Engine

Physics is **opt-in**. Enable it when creating the engine:

```javascript
const engine = new GameEngine({
  physics: true,           // Enable physics system
  physicsConfig: {
    gravity: -9.82,        // World gravity
    iterations: 10,        // Solver iterations
    tolerance: 0.001       // Solver tolerance
  }
});
```

If `physics: false` (default), Cannon.js won't be loaded and `engine.physicsManager` will be `null`.

### 2. Access PhysicsManager from Scene

```javascript
class MyGameScene extends Scene {
  async load() {
    // Get physics manager from engine
    const physics = this.engine.physicsManager;
    
    if (!physics) {
      console.warn('Physics not enabled!');
      return;
    }

    // Use physics...
  }
}
```

### 3. Create Physics Bodies

The PhysicsManager provides high-level methods for creating physics bodies:

```javascript
// Ground plane (static)
const groundBody = physics.createPlane({
  mass: 0,  // 0 = static (doesn't move)
  position: { x: 0, y: 0, z: 0 },
  rotation: { x: -Math.PI / 2, y: 0, z: 0 }
});

// Box (dynamic)
const boxBody = physics.createBox({
  width: 2,
  height: 2,
  depth: 2,
  mass: 5,  // >0 = dynamic (affected by forces)
  position: { x: 0, y: 10, z: 0 }
});

// Sphere (dynamic)
const sphereBody = physics.createSphere({
  radius: 1,
  mass: 3,
  position: { x: 5, y: 10, z: 5 }
});

// Cylinder (dynamic)
const cylinderBody = physics.createCylinder({
  radiusTop: 1,
  radiusBottom: 1,
  height: 3,
  mass: 4,
  position: { x: -5, y: 10, z: -5 }
});
```

### 4. Add Physics to Entities

You can automatically create and attach physics bodies to entities:

```javascript
// Create an actor
const player = new Actor({
  name: 'Player',
  speed: 8
});

// Add physics to the actor
const playerBody = physics.addToEntity(player, {
  type: 'box',
  width: 1,
  height: 2,
  depth: 1,
  mass: 5
});

// Access physics body via entity
player.physicsBody.velocity.y = 10;
```

### 5. Apply Forces and Impulses

```javascript
// Apply impulse (instant force, good for jumping)
physics.applyImpulse(body, { 
  x: 0, 
  y: 50,  // Jump!
  z: 0 
});

// Apply force (continuous force, good for pushing)
physics.applyForce(body, { 
  x: 10, 
  y: 0, 
  z: 0 
});
```

### 6. Sync Visual with Physics

The physics simulation runs automatically, but you need to sync your visual meshes:

```javascript
update(deltaTime) {
  super.update(deltaTime);

  // Sync mesh position with physics body
  this.player.position.copy(body.position);
  this.player.mesh.position.copy(body.position);
  this.player.mesh.quaternion.copy(body.quaternion);
}
```

## 🏗️ Architecture Flow

```
┌─────────────────┐
│   GameEngine    │
│                 │
│ ┌─────────────┐ │
│ │PhysicsManager│ │ ← Created if physics: true
│ └─────────────┘ │
└────────┬────────┘
         │
         │ Updates every frame
         ▼
┌─────────────────┐
│ Cannon.js World │ ← Wrapped by PhysicsManager
│                 │
│ • Bodies        │
│ • Shapes        │
│ • Constraints   │
│ • Collisions    │
└─────────────────┘
         │
         │ Physics state
         ▼
┌─────────────────┐
│     Scenes      │ ← Access via this.engine.physicsManager
│                 │
│ • Create bodies │
│ • Apply forces  │
│ • Sync meshes   │
└─────────────────┘
```

## 📊 Update Loop

```
GameEngine.update()
  ├── InputManager.update()
  ├── NetworkManager.update()
  ├── PhysicsManager.update()  ← Physics runs here
  │     └── world.step()        ← Cannon.js simulation
  ├── SceneManager.update()     ← Scenes sync meshes here
  └── CameraManager.update()
```

## 🎮 Complete Example

```javascript
import { GameEngine, Scene, Actor, MeshBuilder, Color } from './engine';

class PhysicsGameScene extends Scene {
  async load() {
    const physics = this.engine.physicsManager;

    // 1. Create ground
    const groundMesh = MeshBuilder.createPlane({
      width: 100,
      height: 100,
      color: Color.GRASS
    });
    groundMesh.rotation.x = -Math.PI / 2;
    this.add(groundMesh);

    physics.createPlane({ mass: 0 });

    // 2. Create player with physics
    const playerMesh = MeshBuilder.createBox({
      width: 1,
      height: 2,
      depth: 1,
      color: Color.BLUE
    });

    this.player = new Actor({ name: 'Player', speed: 8 });
    this.player.mesh = playerMesh;
    
    const playerBody = physics.addToEntity(this.player, {
      type: 'box',
      width: 1,
      height: 2,
      depth: 1,
      mass: 5
    });

    playerBody.fixedRotation = true; // Don't tip over
    this.addEntity(this.player);

    // 3. Create dynamic box
    const boxMesh = MeshBuilder.createBox({
      width: 2,
      height: 2,
      depth: 2,
      color: Color.RED
    });
    boxMesh.position.set(5, 10, 5);
    this.add(boxMesh);

    this.dynamicBox = physics.createBox({
      width: 2,
      height: 2,
      depth: 2,
      mass: 3,
      position: { x: 5, y: 10, z: 5 }
    });

    this.boxMesh = boxMesh;
  }

  update(deltaTime) {
    super.update(deltaTime);

    const input = this.engine.inputManager;
    const physics = this.engine.physicsManager;

    // Move player with physics
    if (input.isActionDown('forward')) {
      this.player.physicsBody.velocity.z = -8;
    }
    if (input.isActionDown('backward')) {
      this.player.physicsBody.velocity.z = 8;
    }

    // Jump
    if (input.isActionPressed('jump')) {
      physics.applyImpulse(this.player.physicsBody, { 
        x: 0, 
        y: 50, 
        z: 0 
      });
    }

    // Sync meshes with physics
    this.player.position.copy(this.player.physicsBody.position);
    this.player.mesh.position.copy(this.player.physicsBody.position);
    
    this.boxMesh.position.copy(this.dynamicBox.position);
    this.boxMesh.quaternion.copy(this.dynamicBox.quaternion);
  }
}

// Initialize engine with physics
const engine = new GameEngine({
  physics: true,
  physicsConfig: {
    gravity: -9.82
  }
});

engine.loadScene(PhysicsGameScene);
engine.start();
```

## 🔬 Advanced Features

### Materials and Friction

```javascript
// Create materials
const playerMaterial = physics.createMaterial({
  friction: 0.3,
  restitution: 0.3  // Bounciness
});

const groundMaterial = physics.createMaterial({
  friction: 0.8,
  restitution: 0.1
});

// Define how materials interact
physics.createContactMaterial(playerMaterial, groundMaterial, {
  friction: 0.5,
  restitution: 0.2
});

// Assign material to body
body.material = playerMaterial;
```

### Raycasting

```javascript
const result = physics.raycast(
  { x: 0, y: 10, z: 0 },  // From
  { x: 0, y: -10, z: 0 }  // To
);

if (result.hit) {
  console.log('Hit body:', result.body);
  console.log('Hit point:', result.point);
  console.log('Hit normal:', result.normal);
  console.log('Distance:', result.distance);
}
```

### Remove Physics Bodies

```javascript
// Remove body from entity
physics.removeFromEntity(entity);

// Remove standalone body
physics.removeBody(body);

// Clear all bodies
physics.clear();
```

### Enable/Disable Physics

```javascript
// Temporarily disable physics
physics.disable();

// Re-enable physics
physics.enable();
```

## ✅ Benefits of This Architecture

### 1. **Separation of Concerns**
- Physics logic is NOT in your scenes
- PhysicsManager handles all Cannon.js complexity
- Scenes just create bodies and apply forces

### 2. **Optional & Lightweight**
- Physics is opt-in (disabled by default)
- Games without physics don't load Cannon.js
- No performance cost if not used

### 3. **Engine-Managed**
- Updates automatically in game loop
- Integrates with other engine systems
- Consistent with InputManager, CameraManager, etc.

### 4. **Easy to Replace**
- Want to switch to Rapier or Ammo.js?
- Just change PhysicsManager implementation
- Your game code stays the same!

### 5. **Clean API**
- Simple methods for common tasks
- No need to learn Cannon.js internals
- Game-engine-friendly interface

## 📝 Best Practices

### 1. Check if Physics is Enabled

```javascript
const physics = this.engine.physicsManager;
if (!physics) {
  console.warn('Physics not enabled!');
  return;
}
```

### 2. Use Static Bodies for Non-Moving Objects

```javascript
// Static (mass: 0) - faster, doesn't move
physics.createBox({ mass: 0, ... });

// Dynamic (mass > 0) - affected by forces
physics.createBox({ mass: 5, ... });
```

### 3. Lock Rotation for Players

```javascript
playerBody.fixedRotation = true;
playerBody.updateMassProperties();
```

### 4. Sync Meshes Every Frame

```javascript
update(deltaTime) {
  // Sync visual mesh with physics body
  mesh.position.copy(body.position);
  mesh.quaternion.copy(body.quaternion);
}
```

### 5. Use Impulses for Jumping

```javascript
// Impulse (instant) - good for jumping
physics.applyImpulse(body, { x: 0, y: 50, z: 0 });

// Force (continuous) - good for pushing
physics.applyForce(body, { x: 10, y: 0, z: 0 });
```

## 🚀 What's Next?

1. **Try the physics demo**: `examples/physics-demo/`
2. **Experiment with forces**: Try different impulse values
3. **Add constraints**: Connect bodies with springs/hinges
4. **Build a puzzle game**: Create physics-based challenges
5. **Implement vehicle physics**: Use cylinders for wheels

## 📚 Related Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Overall engine architecture
- [ENGINE_INDEPENDENCE.md](./ENGINE_INDEPENDENCE.md) - Why engine is game-agnostic
- [examples/physics-demo/README.md](./examples/physics-demo/README.md) - Physics demo guide

Enjoy building physics-based games! 🎮⚙️

