# GameObject System Guide

## Overview

The GameObject system is a Unity-inspired architecture that makes it easy to build games using composition. Every object in your game is a **GameObject** with **Components** that define its behavior.

## Core Concepts

### GameObject

A GameObject is a container for:
- **Transform** (position, rotation, scale)
- **Components** (behavior)
- **Mesh** (visual representation)
- **Tags** (for querying)

```javascript
import { GameObject } from './src/index.js';

const player = new GameObject({
  name: 'Player',
  tags: ['player'],
  speed: 5
});
```

### Component

Components add functionality to GameObjects. They have a lifecycle:

```javascript
import { Component } from './src/index.js';

class PlayerController extends Component {
  awake() {
    // Called once when created
    this.speed = 10;
  }

  start() {
    // Called before first update
    console.log('Player started!');
  }

  update(deltaTime) {
    // Called every frame
    const input = this.entity.scene.engine.inputManager;
    
    if (input.isKeyPressed('w')) {
      this.entity.velocity.z = -this.speed;
    }
  }

  onDestroy() {
    // Called when destroyed
    console.log('Player destroyed!');
  }
}
```

## Factory Methods

### GameObjectFactory

Easy GameObject creation:

```javascript
import { GameObjectFactory } from './src/index.js';

// Create cube
const box = GameObjectFactory.createCube({
  name: 'Box',
  width: 2,
  height: 2,
  depth: 2,
  color: 0xff0000,
  position: { x: 0, y: 1, z: 0 }
});

// Create sphere
const ball = GameObjectFactory.createSphere({
  name: 'Ball',
  radius: 1,
  color: 0x00ff00
});

// Create empty
const empty = GameObjectFactory.createEmpty({
  name: 'Manager'
});
```

### Builder Pattern

Fluent API for complex GameObjects:

```javascript
import { GameObjectFactory } from './src/index.js';

const player = GameObjectFactory.builder()
  .name('Player')
  .withTag('player')
  .withMesh(mesh)
  .at(0, 5, 0)
  .withRotation(0, Math.PI / 4, 0)
  .withScale(1.5)
  .withComponent(HealthComponent, { maxHealth: 100 })
  .withComponent(PlayerController)
  .withPhysics({ mass: 70, shape: 'capsule' })
  .build();
```

## Prefab System

Prefabs are reusable GameObject templates:

```javascript
import { PrefabManager } from './src/index.js';

// Register a prefab
PrefabManager.register('Enemy', (config = {}) => {
  const enemy = GameObjectFactory.createCube({
    name: 'Enemy',
    color: 0xff0000,
    ...config
  });
  
  enemy.addTag('enemy');
  enemy.addComponent(HealthComponent, { maxHealth: 50 });
  enemy.addComponent(EnemyAI);
  
  return enemy;
});

// Instantiate prefab
const enemy1 = PrefabManager.instantiate('Enemy', {
  position: { x: 5, y: 0, z: 0 }
});

const enemy2 = PrefabManager.instantiate('Enemy', {
  position: { x: -5, y: 0, z: 0 }
});
```

## GameScene - Enhanced Scene

Use `GameScene` instead of `Scene` for Unity-like queries:

```javascript
import { GameScene } from './src/index.js';

class MyGame extends GameScene {
  async load() {
    // Create player
    const player = GameObjectFactory.createCube({ name: 'Player' });
    player.addTag('player');
    this.addEntity(player);

    // Later... find it
    const foundPlayer = this.find('Player');
    const playerByTag = this.findWithTag('player');
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Find all enemies
    const enemies = this.findGameObjectsWithTag('enemy');
    
    // Find objects with HealthComponent
    const damageable = this.findObjectsOfType(HealthComponent);
    
    // Find nearest enemy to player
    const player = this.findWithTag('player');
    const nearest = this.findClosest(player.position, 'enemy');
  }
}
```

## Scene Query Methods

| Method | Description |
|--------|-------------|
| `find(name)` | Find first GameObject by name |
| `findAll(name)` | Find all GameObjects by name |
| `findWithTag(tag)` | Find first GameObject with tag |
| `findGameObjectsWithTag(tag)` | Find all GameObjects with tag |
| `findObjectOfType(component)` | Find first with component |
| `findObjectsOfType(component)` | Find all with component |
| `findClosest(position, tag)` | Find nearest GameObject |
| `findInRadius(position, radius)` | Find all in range |
| `findObjectWithComponents(...components)` | Find first with all components |
| `findObjectsWithComponents(...components)` | Find all with all components |

## Component Lifecycle

```
GameObject Created
       ↓
   awake() ──────── Called once when created
       ↓
   start() ──────── Called before first update
       ↓
   onEnable() ───── Called when enabled
       ↓
   ┌────────┐
   │ update() │───── Called every frame
   └────────┘
       ↓
   onDisable() ──── Called when disabled
       ↓
   onDestroy() ──── Called when destroyed
```

## Complete Example

```javascript
import {
  GameEngine,
  GameScene,
  GameObject,
  GameObjectFactory,
  PrefabManager,
  Component,
  MeshBuilder
} from './src/index.js';

// Custom Component
class RotateComponent extends Component {
  constructor(speed = 1) {
    super();
    this.speed = speed;
  }

  update(deltaTime) {
    if (this.entity.mesh) {
      this.entity.mesh.rotation.y += this.speed * deltaTime;
    }
  }
}

// Register Prefab
PrefabManager.register('SpinningCube', () => {
  const cube = GameObjectFactory.createCube({
    name: 'Cube',
    color: 0x00aaff
  });
  cube.addComponent(RotateComponent, { speed: 2 });
  return cube;
});

// Game Scene
class MyGame extends GameScene {
  async load() {
    // Create multiple cubes using prefab
    for (let i = 0; i < 5; i++) {
      const cube = PrefabManager.instantiate('SpinningCube');
      cube.setPosition(i * 3 - 6, 1, 0);
      this.addEntity(cube);
    }

    await super.load();
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Query example
    const cubes = this.findObjectsOfType(RotateComponent);
    console.log(`${cubes.length} spinning cubes`);
  }
}

// Start Engine
const engine = new GameEngine();
engine.start();
engine.loadScene(MyGame);
```

## Best Practices

1. **Use Components for Behavior** - Keep GameObjects simple, add complexity via components
2. **Use Prefabs for Reusable Objects** - Enemies, pickups, bullets, etc.
3. **Use Tags for Querying** - Makes finding objects easier
4. **Use GameScene** - Better than Scene for game development
5. **Lifecycle Hooks** - Use `awake()` for initialization, `start()` for setup with other objects
6. **Component Communication** - Use events or `getComponent()` to communicate between components

## Migration from Actor/Entity

If you have existing code using `Actor` or `Entity`:

```javascript
// Old way
const actor = new Actor({ name: 'Player' });

// New way (GameObject extends Actor, so it's compatible!)
const player = new GameObject({ name: 'Player' });

// Or use factory
const player = GameObjectFactory.createCube({ name: 'Player' });
```

**GameObject is fully compatible with Actor** - it just adds more features!

## See Also

- [GameObject Demo Example](./examples/gameobject-demo/)
- [Component Examples](./examples/components/)
- [Engine Documentation](./README.md)

