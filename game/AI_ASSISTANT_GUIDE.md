# AI Assistant Guide - OpenWorld3D Game Engine

> **For AI Assistants**: This guide explains how to help users build games with the OpenWorld3D engine. Read this file to understand the architecture, patterns, and best practices.

---

## Engine Name: **OpenWorld3D**

A Unity-inspired 3D game engine built on Three.js with a GameObject-Component architecture.

---

## Core Architecture

### 1. **GameObject** - The Foundation

Every object in the game is a `GameObject`. Think Unity's GameObject.

```javascript
import { GameObjectFactory } from './src/index.js';

// Create GameObjects using the factory
const player = GameObjectFactory.createCube({
  name: 'Player',
  color: 0x0000ff,
  position: { x: 0, y: 1, z: 0 }
});
```

**Key Concepts:**
- GameObjects have: position, rotation, scale, mesh (3D visual)
- GameObjects can have multiple Components attached
- GameObjects have lifecycle hooks: `awake()`, `start()`, `update()`, `onDestroy()`

### 2. **Component** - Behavior System

Components add functionality to GameObjects. Think Unity's MonoBehaviour.

```javascript
import { Component } from './src/index.js';

class PlayerController extends Component {
  constructor(config = {}) {
    super();
    this.speed = config.speed || 5;
  }

  awake() {
    // Called once when component is created
  }

  start() {
    // Called before first update
  }

  update(deltaTime) {
    // Called every frame
    const input = this.entity.scene.engine.inputManager;
    if (input.isKeyDown('KeyW')) {
      this.entity.velocity.z = -this.speed;
    }
  }

  onDestroy() {
    // Called when component is destroyed
  }
}

// Attach to GameObject
player.addComponent(PlayerController, { speed: 10 });
```

**Component Lifecycle:**
1. `awake()` - Initialization
2. `start()` - Setup with other objects
3. `update(deltaTime)` - Every frame
4. `onDestroy()` - Cleanup

### 3. **GameScene** - Scene Management

Scenes contain and manage GameObjects.

```javascript
import { GameScene } from './src/index.js';

class MyGame extends GameScene {
  async load() {
    // Create and add GameObjects
    const player = GameObjectFactory.createCube({ name: 'Player' });
    player.addTag('player');
    this.addEntity(player);
    
    await super.load();
  }

  update(deltaTime) {
    super.update(deltaTime);
    
    // Find objects
    const player = this.findWithTag('player');
    const enemies = this.findGameObjectsWithTag('enemy');
  }
}
```

---

## How to Build a Game

### Step 1: Create Custom Components

```javascript
class HealthComponent extends Component {
  constructor(config = {}) {
    super();
    this.maxHealth = config.maxHealth || 100;
    this.health = this.maxHealth;
  }

  takeDamage(amount) {
    this.health -= amount;
    if (this.health <= 0) {
      this.entity.destroy();
    }
  }
}
```

### Step 2: Create GameObjects with Components

```javascript
// Using Builder Pattern (RECOMMENDED)
const enemy = GameObjectFactory.builder()
  .name('Enemy')
  .withTag('enemy')
  .withMesh(MeshBuilder.createCube({ color: 0xff0000 }))
  .at(5, 0, 0)
  .withComponent(HealthComponent, { maxHealth: 50 })
  .withComponent(EnemyAI)
  .build();
```

### Step 3: Create Prefabs for Reusable Objects

```javascript
import { PrefabManager } from './src/index.js';

// Register a prefab
PrefabManager.register('Enemy', (config = {}) => {
  const enemy = GameObjectFactory.createCube({ color: 0xff0000 });
  enemy.addTag('enemy');
  enemy.addComponent(HealthComponent, { maxHealth: 50 });
  enemy.addComponent(EnemyAI);
  return enemy;
});

// Instantiate multiple times
const enemy1 = PrefabManager.instantiate('Enemy');
const enemy2 = PrefabManager.instantiate('Enemy', { position: { x: 10, y: 0, z: 0 } });
```

### Step 4: Create Game Scene

```javascript
class MyGame extends GameScene {
  async load() {
    // Ground
    const ground = MeshBuilder.createPlane({
      width: 50,
      height: 50,
      color: Color.GRASS
    });
    ground.rotation.x = -Math.PI / 2;
    this.threeScene.add(ground);

    // Player
    const player = GameObjectFactory.builder()
      .name('Player')
      .withTag('player')
      .withMesh(MeshBuilder.createCapsule({ color: 0x0000ff }))
      .at(0, 1, 0)
      .withComponent(PlayerController)
      .build();
    this.addEntity(player);

    // Spawn enemies
    for (let i = 0; i < 5; i++) {
      const enemy = PrefabManager.instantiate('Enemy');
      enemy.setPosition(Math.random() * 20 - 10, 0, Math.random() * 20 - 10);
      this.addEntity(enemy);
    }

    await super.load();
  }
}
```

### Step 5: Start Engine

```javascript
import { GameEngine } from './src/index.js';

const engine = new GameEngine({
  physics: false  // Note: Physics currently disabled due to bugs
});

engine.start();
engine.loadScene(MyGame);
```

---

## Factory Methods (GameObject Creation)

### Creating GameObjects

```javascript
import { GameObjectFactory } from './src/index.js';

// Primitives
const cube = GameObjectFactory.createCube({ width: 1, height: 1, depth: 1, color: 0xff0000 });
const sphere = GameObjectFactory.createSphere({ radius: 1, color: 0x00ff00 });
const cylinder = GameObjectFactory.createCylinder({ radiusTop: 1, radiusBottom: 1, height: 2 });
const capsule = GameObjectFactory.createCapsule({ radius: 0.5, height: 2 });
const plane = GameObjectFactory.createPlane({ width: 10, height: 10 });

// Empty GameObject
const empty = GameObjectFactory.createEmpty({ name: 'Manager' });

// Builder Pattern (BEST for complex objects)
const player = GameObjectFactory.builder()
  .name('Player')
  .withTag('player')
  .withMesh(mesh)
  .at(0, 5, 0)
  .withRotation(0, Math.PI / 4, 0)
  .withScale(1.5)
  .withComponent(HealthComponent, { maxHealth: 100 })
  .withComponent(PlayerController)
  .build();
```

---

## Scene Query Methods (Finding Objects)

```javascript
// By name
const player = scene.find('Player');

// By tag (single)
const player = scene.findWithTag('player');

// By tag (all)
const enemies = scene.findGameObjectsWithTag('enemy');

// By component type (single)
const firstWithHealth = scene.findObjectOfType(HealthComponent);

// By component type (all)
const allDamageable = scene.findObjectsOfType(HealthComponent);

// Spatial queries
const nearest = scene.findClosest(player.position, 'enemy');
const nearby = scene.findInRadius(player.position, 10);

// Multiple components
const objects = scene.findObjectsWithComponents(HealthComponent, CombatComponent);
```

---

## Input System

```javascript
const input = this.entity.scene.engine.inputManager;

// Keyboard (continuous)
if (input.isKeyDown('KeyW')) {
  // Move forward while W is held
}

// Keyboard (single press)
if (input.isKeyPressed('Space')) {
  // Jump once when Space is pressed
}

// Key codes
// Letters: 'KeyA', 'KeyB', 'KeyW', etc.
// Numbers: 'Digit1', 'Digit2', etc.
// Special: 'Space', 'Enter', 'Escape'
// Arrows: 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'
```

---

## Component Communication

### 1. Get Other Components on Same GameObject

```javascript
class MyComponent extends Component {
  start() {
    // Get another component
    this.health = this.getComponent(HealthComponent);
  }

  update(deltaTime) {
    if (this.health.health < 50) {
      // Do something
    }
  }
}
```

### 2. Events (Recommended for loose coupling)

```javascript
class HealthComponent extends Component {
  takeDamage(amount) {
    this.health -= amount;
    this.emit('damaged', { amount, current: this.health });
    
    if (this.health <= 0) {
      this.emit('died');
    }
  }
}

class PlayerController extends Component {
  start() {
    const health = this.getComponent(HealthComponent);
    health.on('damaged', (data) => {
      console.log(`Took ${data.amount} damage!`);
    });
    health.on('died', () => {
      console.log('Game Over!');
    });
  }
}
```

### 3. Send Message

```javascript
// Send to all components on same GameObject
this.entity.sendMessage('takeDamage', 10);

// Broadcast to children
this.entity.broadcastMessage('alert', player);
```

---

## Best Practices for AI Assistants

### ✅ DO

1. **Always use GameObjectFactory or builder pattern**
   ```javascript
   const obj = GameObjectFactory.builder()
     .name('MyObject')
     .withComponent(MyComponent)
     .build();
   ```

2. **Use GameScene instead of Scene**
   ```javascript
   class MyGame extends GameScene { }
   ```

3. **Components should accept config objects**
   ```javascript
   constructor(config = {}) {
     super();
     this.speed = config.speed || 5;
   }
   ```

4. **Use tags for querying**
   ```javascript
   player.addTag('player');
   const player = scene.findWithTag('player');
   ```

5. **Use Prefabs for reusable objects**
   ```javascript
   PrefabManager.register('Enemy', () => { ... });
   const enemy = PrefabManager.instantiate('Enemy');
   ```

6. **Always call `super.load()` in scene load**
   ```javascript
   async load() {
     // Your code
     await super.load();
   }
   ```

### ❌ DON'T

1. **Don't use Actor/Entity directly** - Use GameObject instead
2. **Don't use Scene directly** - Use GameScene instead
3. **Don't enable physics** - It's currently broken (causes NaN positions)
4. **Don't use ThirdPersonCamera.update()** - It's broken (causes NaN camera positions)
5. **Don't create GameObjects without adding to scene**
   ```javascript
   const obj = GameObjectFactory.createCube();
   scene.addEntity(obj); // Required!
   ```

---

## Current Known Issues

### ⚠️ Physics System - DISABLED
**Issue**: Causes NaN positions
**Workaround**: Set `physics: false` in GameEngine config
```javascript
const engine = new GameEngine({ physics: false });
```

### ⚠️ ThirdPersonCamera - DISABLED
**Issue**: Mouse handling causes NaN camera positions
**Workaround**: Use static camera position
```javascript
camera.position.set(0, 8, 15);
camera.lookAt(0, 1, 0);
// Don't call camera.update()
```

### ⚠️ Capsule Physics Shape - NOT SUPPORTED
**Available**: box, sphere, cylinder
**Workaround**: Use cylinder for characters

---

## Complete Working Example

```javascript
import {
  GameEngine,
  GameScene,
  GameObject,
  GameObjectFactory,
  PrefabManager,
  Component,
  MeshBuilder,
  Color
} from './src/index.js';

// 1. Create Components
class PlayerController extends Component {
  constructor(config = {}) {
    super();
    this.speed = config.speed || 5;
  }

  update(deltaTime) {
    const input = this.entity.scene.engine.inputManager;
    
    let moveX = 0, moveZ = 0;
    if (input.isKeyDown('KeyW')) moveZ = -1;
    if (input.isKeyDown('KeyS')) moveZ = 1;
    if (input.isKeyDown('KeyA')) moveX = -1;
    if (input.isKeyDown('KeyD')) moveX = 1;

    this.entity.velocity.x = moveX * this.speed;
    this.entity.velocity.z = moveZ * this.speed;
  }
}

class HealthComponent extends Component {
  constructor(config = {}) {
    super();
    const maxHealth = typeof config === 'number' ? config : (config.maxHealth || 100);
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.emit('damaged', { amount, current: this.health });
  }
}

// 2. Register Prefabs
PrefabManager.register('Enemy', () => {
  const enemy = GameObjectFactory.createCube({ color: 0xff0000 });
  enemy.addTag('enemy');
  enemy.addComponent(HealthComponent, { maxHealth: 50 });
  return enemy;
});

// 3. Create Game Scene
class MyGame extends GameScene {
  async load() {
    // Ground
    const ground = MeshBuilder.createPlane({
      width: 50,
      height: 50,
      color: Color.GRASS
    });
    ground.rotation.x = -Math.PI / 2;
    this.threeScene.add(ground);

    // Player
    const player = GameObjectFactory.builder()
      .name('Player')
      .withTag('player')
      .withMesh(MeshBuilder.createCapsule({ color: 0x0000ff }))
      .at(0, 1, 0)
      .withComponent(HealthComponent, { maxHealth: 100 })
      .withComponent(PlayerController, { speed: 8 })
      .build();
    this.addEntity(player);

    // Camera
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.set(0, 8, 15);
    camera.lookAt(0, 1, 0);

    // Enemies
    for (let i = 0; i < 5; i++) {
      const enemy = PrefabManager.instantiate('Enemy');
      const angle = (i / 5) * Math.PI * 2;
      enemy.setPosition(Math.cos(angle) * 10, 0.5, Math.sin(angle) * 10);
      this.addEntity(enemy);
    }

    await super.load();
  }

  update(deltaTime) {
    super.update(deltaTime);
    
    // Game logic here
  }
}

// 4. Start Engine
const engine = new GameEngine({ physics: false });
engine.start();
engine.loadScene(MyGame);

console.log('Game Started!');
```

---

## File Locations

- **Core**: `src/core/GameEngine.js`
- **GameObject**: `src/entities/GameObject.js`
- **Factory**: `src/entities/GameObjectFactory.js`
- **Component**: `src/entities/Component.js`
- **Prefabs**: `src/entities/Prefab.js`
- **GameScene**: `src/scenes/GameScene.js`
- **Input**: `src/input/InputManager.js`
- **Examples**: `examples/gameobject-demo/`

---

## Summary for AI Assistants

When helping users build games with **OpenWorld3D**:

1. **Use GameObject-Component architecture** (like Unity)
2. **Create objects with GameObjectFactory.builder()**
3. **Components handle behavior** (movement, health, AI, etc.)
4. **GameScene manages objects** (with Find/FindWithTag queries)
5. **Prefabs for reusable objects**
6. **Avoid physics and ThirdPersonCamera** (currently broken)
7. **Always use config objects in component constructors**
8. **Use tags for easy object finding**

**Key Pattern:**
```
GameObject (container) + Components (behavior) = Game Object
Scene (manages) → multiple GameObjects
Engine (runs) → Scenes
```

This architecture makes games organized, maintainable, and familiar to Unity developers! 🎮

