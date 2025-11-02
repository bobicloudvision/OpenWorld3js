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

## Project Architecture & File Organization

### Recommended Project Structure

For clean, maintainable games, organize your project into separate files:

```
your-game/
├── components/          # Reusable component behaviors
│   ├── PlayerController.js
│   ├── EnemyAI.js
│   ├── HealthComponent.js
│   └── CollectibleComponent.js
│
├── systems/            # Game-wide systems (managers)
│   ├── GameManager.js
│   ├── SpawnManager.js
│   └── ScoreManager.js
│
├── scenes/             # Scene definitions
│   ├── MainMenuScene.js
│   ├── GameScene.js
│   └── GameOverScene.js
│
├── prefabs/            # Prefab definitions (optional)
│   ├── EnemyPrefabs.js
│   └── PowerUpPrefabs.js
│
├── main.js             # Entry point
├── index.html          # HTML page
└── README.md           # Documentation
```

### Component Files

Each component should be in its own file and export a single class:

**components/PlayerController.js**
```javascript
import { Component } from '../../../src/index.js';

export class PlayerController extends Component {
  constructor(config = {}) {
    super();
    this.speed = config.speed || 5;
    this.jumpForce = config.jumpForce || 10;
  }

  update(deltaTime) {
    const input = this.entity.scene.engine.inputManager;
    
    if (input.isKeyDown('KeyW')) {
      this.entity.velocity.z = -this.speed;
    }
    if (input.isKeyDown('Space')) {
      this.jump();
    }
  }

  jump() {
    if (this.isGrounded) {
      this.entity.velocity.y = this.jumpForce;
    }
  }
}
```

### System Files

Systems are components that manage game-wide state:

**systems/GameManager.js**
```javascript
import { Component } from '../../../src/index.js';

export class GameManager extends Component {
  constructor(config = {}) {
    super();
    this.score = 0;
    this.gameSpeed = 10;
    this.isGameOver = false;
  }

  start() {
    // Set up event listeners
    const player = this.entity.scene.findWithTag('player');
    player.on('died', () => this.gameOver());
  }

  update(deltaTime) {
    if (this.isGameOver) return;
    
    // Update game state
    this.score += deltaTime * 10;
    this.updateUI();
  }

  updateUI() {
    document.getElementById('score').textContent = Math.floor(this.score);
  }

  gameOver() {
    this.isGameOver = true;
    // Show game over screen
  }
}
```

### Scene Files

Scenes compose GameObjects and components together:

**scenes/GameScene.js**
```javascript
import { GameScene, GameObjectFactory } from '../../../src/index.js';
import { PlayerController } from '../components/PlayerController.js';
import { EnemyAI } from '../components/EnemyAI.js';
import { GameManager } from '../systems/GameManager.js';

export class MyGameScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'MyGame';
    this.backgroundColor = 0x87CEEB;
  }

  async load() {
    // Setup lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(10, 20, 10);
    
    // Create player
    const player = GameObjectFactory.createCapsule({
      name: 'Player',
      color: 0x0000ff
    });
    player.addTag('player');
    player.setPosition(0, 1, 0);
    player.addComponent(PlayerController, { speed: 8 });
    this.addEntity(player);
    
    // Create game manager
    const gameManager = GameObjectFactory.createEmpty({ name: 'GameManager' });
    gameManager.addComponent(GameManager);
    this.addEntity(gameManager);
    
    await super.load();
  }
}
```

### Main Entry Point

Keep the main file clean and simple:

**main.js**
```javascript
import { GameEngine } from '../../src/index.js';
import { MyGameScene } from './scenes/GameScene.js';

// Initialize and start
const engine = new GameEngine({ physics: false });
engine.start();
engine.loadScene(MyGameScene);

console.log('Game Started!');
```

### Why This Architecture?

**Benefits:**
- ✅ **Modularity**: Each file has one clear responsibility
- ✅ **Reusability**: Components can be used across projects
- ✅ **Maintainability**: Easy to find and fix bugs
- ✅ **Scalability**: Simple to add new features
- ✅ **Team Collaboration**: Multiple developers can work without conflicts
- ✅ **Testing**: Components can be tested independently

**Example: Adding a New Feature**

Want to add power-ups? Just create a new component file:

```javascript
// components/PowerUpComponent.js
export class PowerUpComponent extends Component {
  activate(player) {
    // Power-up logic here
  }
}
```

No need to modify existing files!

### Component Communication Between Files

**Method 1: Events (Recommended)**
```javascript
// In HealthComponent.js
this.emit('died');

// In GameManager.js
const health = player.getComponent(HealthComponent);
health.on('died', () => this.gameOver());
```

**Method 2: Scene Queries**
```javascript
// Any component can find objects
const player = this.entity.scene.findWithTag('player');
const enemies = this.entity.scene.findGameObjectsWithTag('enemy');
```

**Method 3: Direct Component Access**
```javascript
// Get component from same GameObject
const health = this.getComponent(HealthComponent);

// Get component from another GameObject
const player = this.entity.scene.findWithTag('player');
const playerHealth = player.getComponent(HealthComponent);
```

### Real-World Example: Ball Game

See `examples/ball-game/` for a complete modular game:

```
ball-game/
├── components/
│   ├── BallController.js           (182 lines) - With collision detection
│   ├── CameraFollowComponent.js    (48 lines)
│   ├── CollectibleComponent.js     (83 lines)
│   ├── PushableComponent.js        (84 lines)
│   └── RotateComponent.js          (35 lines)
├── systems/
│   ├── GameManager.js              (149 lines)
│   └── PlatformManager.js          (130 lines)
├── scenes/
│   └── RollingBallScene.js         (109 lines)
├── main.js                         (39 lines) - Custom physics
├── main-with-physics.js            (323 lines) - Real physics
├── index.html                      (272 lines)
└── index-physics.html              (226 lines) - With debug toggle
```

**Features demonstrated:**
- ✅ Custom collision detection (main.js)
- ✅ Real physics engine (main-with-physics.js)
- ✅ Physics debug visualization (Press P)
- ✅ Pushable objects with mass
- ✅ Component-based architecture

**Compare to monolithic:**
- ❌ Single file: 820+ lines - hard to maintain
- ✅ Modular: 11 files - easy to understand and modify

### Prefab Organization

For complex prefabs, use dedicated files:

**prefabs/EnemyPrefabs.js**
```javascript
import { GameObjectFactory, PrefabManager } from '../../../src/index.js';
import { EnemyAI } from '../components/EnemyAI.js';
import { HealthComponent } from '../components/HealthComponent.js';

export function registerEnemyPrefabs() {
  PrefabManager.register('FastEnemy', () => {
    const enemy = GameObjectFactory.createCube({ color: 0xff0000 });
    enemy.addTag('enemy');
    enemy.addComponent(HealthComponent, { maxHealth: 30 });
    enemy.addComponent(EnemyAI, { speed: 10, aggressive: true });
    return enemy;
  });

  PrefabManager.register('TankEnemy', () => {
    const enemy = GameObjectFactory.createCube({ color: 0x880000 });
    enemy.addTag('enemy');
    enemy.addComponent(HealthComponent, { maxHealth: 100 });
    enemy.addComponent(EnemyAI, { speed: 3, aggressive: false });
    return enemy;
  });
}

// In main.js or scene
import { registerEnemyPrefabs } from './prefabs/EnemyPrefabs.js';
registerEnemyPrefabs();
```

---

## Best Practices for AI Assistants

### ✅ DO

1. **Organize games into modular file structure**
   ```
   your-game/
   ├── components/     # One component per file
   ├── systems/        # Game managers
   ├── scenes/         # Scene definitions
   └── main.js         # Entry point
   ```

2. **Always use GameObjectFactory or builder pattern**
   ```javascript
   const obj = GameObjectFactory.builder()
     .name('MyObject')
     .withComponent(MyComponent)
     .build();
   ```

3. **Use GameScene instead of Scene**
   ```javascript
   class MyGame extends GameScene { }
   ```

4. **Components should accept config objects**
   ```javascript
   constructor(config = {}) {
     super();
     this.speed = config.speed || 5;
   }
   ```

5. **Export components from their own files**
   ```javascript
   // components/PlayerController.js
   export class PlayerController extends Component { ... }
   ```

6. **Use tags for querying**
   ```javascript
   player.addTag('player');
   const player = scene.findWithTag('player');
   ```

7. **Use Prefabs for reusable objects**
   ```javascript
   PrefabManager.register('Enemy', () => { ... });
   const enemy = PrefabManager.instantiate('Enemy');
   ```

8. **Always call `super.load()` in scene load**
   ```javascript
   async load() {
     // Your code
     await super.load();
   }
   ```

9. **Keep files small and focused (< 100 lines when possible)**
   - One component = one file
   - One scene = one file
   - Group related prefabs in one file

### ❌ DON'T

1. **Don't create monolithic single-file games** - Split into components/systems/scenes
2. **Don't use Actor/Entity directly** - Use GameObject instead
3. **Don't use Scene directly** - Use GameScene instead
4. **Don't use ThirdPersonCamera.update()** - It's broken (causes NaN camera positions)
6. **Don't create GameObjects without adding to scene**
   ```javascript
   const obj = GameObjectFactory.createCube();
   scene.addEntity(obj); // Required!
   ```
7. **Don't put all code in main.js** - Extract components to separate files

---

## Current Known Issues

### ✅ Physics System - FIXED!
**Status**: NaN validation added - physics now works reliably!
**What was fixed**: 
- Added NaN validation in `Actor.syncPhysicsToVisual()`
- Added physics body validation in `PhysicsManager.update()`
- Added validation when creating physics bodies
- Added extreme value detection to prevent NaN

**You can now use physics safely:**
```javascript
const engine = new GameEngine({ 
  physics: true,  // ✅ Works now!
  physicsConfig: {
    gravity: -9.82,
    iterations: 10,
    debug: false  // Enable debug visualization
  }
});

// ⚠️ IMPORTANT: Add to scene BEFORE enabling physics
const player = GameObjectFactory.createSphere({ radius: 1 });
this.addEntity(player);  // ✅ Add first
player.enablePhysics({   // ✅ Then enable physics
  shape: 'sphere',
  mass: 1
});
```

**Common mistake:**
```javascript
// ❌ DON'T do this
const player = GameObjectFactory.createSphere({ radius: 1 });
player.enablePhysics({ shape: 'sphere' }); // ❌ Physics manager not available yet!
this.addEntity(player);
```

### 🔍 Physics Debug Visualization

**See collision shapes in real-time!**

```javascript
// Toggle debug visualization with key press
if (input.isKeyPressed('KeyP')) {
  engine.physicsManager.toggleDebug();
}

// Or enable via API
engine.physicsManager.enableDebug();   // Show wireframes
engine.physicsManager.disableDebug();  // Hide wireframes
```

**What you see:**
- 🟢 **Green wireframes** = Static bodies (mass = 0) - walls, ground
- 🟣 **Magenta wireframes** = Dynamic bodies (mass > 0) - player, objects
- Wireframes update in real-time with physics simulation

**Use debug when:**
- ✅ Debugging collision issues
- ✅ Tuning collision shapes
- ✅ Verifying body positions
- ✅ Understanding physics behavior

**Example:**
```javascript
class MyGame extends GameScene {
  async load() {
    // Create physics objects
    const player = GameObjectFactory.createSphere({ radius: 1 });
    this.addEntity(player);
    player.enablePhysics({ shape: 'sphere', mass: 1 });
    
    await super.load();
  }
  
  update(deltaTime) {
    super.update(deltaTime);
    
    // Press D to toggle debug
    if (this.engine.inputManager.isKeyPressed('KeyD')) {
      this.engine.physicsManager.toggleDebug();
    }
  }
}
```

See `PHYSICS_DEBUG.md` for complete documentation.

### 🎯 Complete Physics Parameters Reference

**The PhysicsManager now supports ALL Cannon.js body parameters!**

#### Material Properties
```javascript
player.enablePhysics({
  shape: 'sphere',
  mass: 1,
  restitution: 0.7,  // Bounciness (0 = no bounce, 1 = perfect bounce)
  friction: 0.5      // Surface friction (0 = ice, 1 = rubber)
});
```

#### Damping (Resistance)
```javascript
player.enablePhysics({
  shape: 'box',
  mass: 1,
  linearDamping: 0.3,   // Velocity reduction (higher = more drag)
  angularDamping: 0.2   // Rotation reduction (higher = less spin)
});
```

#### Movement Restrictions
```javascript
// Character controller - no rotation, only XZ movement
player.enablePhysics({
  shape: 'box',
  mass: 1,
  fixedRotation: true,  // Prevent ALL rotation
  linearFactor: { x: 1, y: 1, z: 1 }  // Allow all movement
});

// Platform - moves only vertically
platform.enablePhysics({
  shape: 'box',
  mass: 2,
  linearFactor: { x: 0, y: 1, z: 0 },  // Only Y movement
  angularFactor: { x: 0, y: 0, z: 0 }  // No rotation
});
```

#### Performance Optimization
```javascript
obstacle.enablePhysics({
  shape: 'box',
  mass: 5,
  allowSleep: true,        // Enable sleep optimization (default: true)
  sleepSpeedLimit: 0.1,    // Speed below which body can sleep
  sleepTimeLimit: 1        // Time before body sleeps (seconds)
});
```

#### Collision Filtering (Layers)
```javascript
// Define collision groups
const PLAYER_GROUP = 1;
const ENEMY_GROUP = 2;
const GROUND_GROUP = 4;
const COLLECTIBLE_GROUP = 8;

// Player collides with enemies and ground
player.enablePhysics({
  shape: 'sphere',
  mass: 1,
  collisionFilterGroup: PLAYER_GROUP,
  collisionFilterMask: ENEMY_GROUP | GROUND_GROUP  // Bitwise OR
});

// Collectible - trigger only (no physical collision)
collectible.enablePhysics({
  shape: 'sphere',
  mass: 0,
  isTrigger: true,
  collisionResponse: false,
  collisionFilterGroup: COLLECTIBLE_GROUP,
  collisionFilterMask: PLAYER_GROUP
});
```

#### Common Use Cases

**Bouncy Ball:**
```javascript
ball.enablePhysics({
  shape: 'sphere',
  radius: 1,
  mass: 1,
  restitution: 0.7,      // Very bouncy
  friction: 0.5,
  linearDamping: 0.1,    // Low drag
  angularDamping: 0.1
});
```

**Character Controller:**
```javascript
player.enablePhysics({
  shape: 'box',
  width: 1, height: 2, depth: 1,
  mass: 1,
  fixedRotation: true,   // No tipping over
  friction: 0.0,         // Smooth movement
  linearDamping: 0.9     // Quick stops
});
```

**Trigger Zone:**
```javascript
zone.enablePhysics({
  shape: 'box',
  width: 10, height: 5, depth: 10,
  mass: 0,               // Static
  isTrigger: true,       // No collision response
  collisionResponse: false
});
```

**Heavy Crate:**
```javascript
crate.enablePhysics({
  shape: 'box',
  width: 2, height: 2, depth: 2,
  mass: 50,              // Heavy!
  restitution: 0.1,      // Doesn't bounce much
  friction: 0.9,         // Hard to push
  linearDamping: 0.5     // Slows down quickly
});
```

**See:** `PhysicsManager.js` has complete documentation with all parameters.

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
- **Physics**: `src/physics/PhysicsManager.js`
- **Examples**: `examples/gameobject-demo/`, `examples/ball-game/`

## Documentation Files

- **AI_ASSISTANT_GUIDE.md** - This file (main guide)
- **PHYSICS_FIX.md** - NaN bug fix details
- **PHYSICS_DEBUG.md** - Debug visualization guide
- **GETTING_STARTED.md** - Quick start tutorial
- **ARCHITECTURE.md** - System architecture

---

## Summary for AI Assistants

When helping users build games with **OpenWorld3D**:

### Core Principles

1. **Use GameObject-Component architecture** (like Unity)
2. **Organize into modular file structure** (components/, systems/, scenes/)
3. **One component per file** - Keep files small and focused
4. **Create objects with GameObjectFactory.builder()**
5. **Components handle behavior** (movement, health, AI, etc.)
6. **GameScene manages objects** (with Find/FindWithTag queries)
7. **Prefabs for reusable objects**
8. **Avoid physics and ThirdPersonCamera** (currently broken)
9. **Always use config objects in component constructors**
10. **Use tags for easy object finding**

### Key Pattern

```
GameObject (container) + Components (behavior) = Game Object
Scene (manages) → multiple GameObjects
Engine (runs) → Scenes
```

### File Organization Pattern

```
your-game/
├── components/          # Reusable behaviors (one per file)
├── systems/            # Game managers
├── scenes/             # Scene compositions
└── main.js             # Clean entry point
```

### Architecture Benefits

✅ **Modular** - Easy to understand and modify
✅ **Reusable** - Components work across projects
✅ **Scalable** - Simple to add features
✅ **Maintainable** - Find bugs quickly
✅ **Professional** - Industry-standard patterns

This architecture makes games organized, maintainable, and familiar to Unity developers! 🎮

