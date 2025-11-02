# Unity-Like GameObject Architecture

## Overview

Your game engine now has a **Unity-inspired GameObject-Component architecture** that makes building games much easier and more intuitive!

## What Was Added

### 1. GameObject Class (`src/entities/GameObject.js`)

A high-level wrapper around Actor/Entity with:

**Features:**
- ✅ Unity-like lifecycle hooks (`awake`, `start`, `onEnable`, `onDisable`, `onDestroy`)
- ✅ Parent-child hierarchy
- ✅ Transform helper (`gameObject.transform.forward()`, etc.)
- ✅ Component methods (`getComponent`, `getComponentInChildren`, etc.)
- ✅ Message system (`sendMessage`, `broadcastMessage`)
- ✅ Builder pattern support
- ✅ Cloning for prefabs

**Example:**
```javascript
class MyPlayer extends GameObject {
  awake() {
    console.log('Player awakening...');
    this.speed = 10;
  }

  start() {
    console.log('Player starting...');
    const health = this.getComponent(HealthComponent);
  }

  update(deltaTime) {
    // Your game logic
  }

  onDestroy() {
    console.log('Player destroyed');
  }
}
```

### 2. GameObjectFactory (`src/entities/GameObjectFactory.js`)

Easy GameObject creation:

**Factory Methods:**
- `createEmpty()` - Empty GameObject
- `createCube()` - Box mesh
- `createSphere()` - Sphere mesh
- `createCylinder()` - Cylinder mesh
- `createCapsule()` - Capsule mesh
- `createPlane()` - Plane mesh
- `createLight()` - Light GameObject
- `createCamera()` - Camera GameObject
- `createFromModel()` - From GLTF/model
- `builder()` - Builder pattern

**Example:**
```javascript
// Simple
const box = GameObjectFactory.createCube({
  name: 'Box',
  color: 0xff0000,
  position: { x: 0, y: 1, z: 0 }
});

// Builder pattern
const player = GameObjectFactory.builder()
  .name('Player')
  .withTag('player')
  .withMesh(mesh)
  .at(0, 1, 0)
  .withComponent(HealthComponent, { maxHealth: 100 })
  .withComponent(PlayerController)
  .build();
```

### 3. Prefab System (`src/entities/Prefab.js`)

Reusable GameObject templates (like Unity Prefabs):

**Features:**
- Register prefab templates
- Instantiate multiple copies
- Configure instances
- Track all instances

**Example:**
```javascript
// Register
PrefabManager.register('Enemy', (config) => {
  const enemy = GameObjectFactory.createCube({ color: 0xff0000 });
  enemy.addTag('enemy');
  enemy.addComponent(HealthComponent, { maxHealth: 50 });
  enemy.addComponent(EnemyAI);
  return enemy;
});

// Instantiate
const enemy1 = PrefabManager.instantiate('Enemy');
const enemy2 = PrefabManager.instantiate('Enemy', {
  position: { x: 5, y: 0, z: 0 }
});
```

### 4. Enhanced Component (`src/entities/Component.js`)

Upgraded with Unity-like lifecycle:

**Lifecycle:**
- `awake()` - Called once when created
- `start()` - Called before first update
- `onEnable()` - Called when enabled
- `update(deltaTime)` - Every frame
- `fixedUpdate(deltaTime)` - Fixed intervals
- `lateUpdate(deltaTime)` - After all updates
- `onDisable()` - Called when disabled
- `onDestroy()` - Called when destroyed

**New Features:**
- `this.gameObject` - Reference to GameObject (Unity-like alias)
- `this.transform` - Easy transform access
- `getComponent()` - Get other components
- `sendMessage()` - Send to GameObject
- `clone()` - Clone component

**Example:**
```javascript
class PlayerController extends Component {
  awake() {
    this.speed = 10;
  }

  start() {
    // Find other components
    this.health = this.getComponent(HealthComponent);
  }

  update(deltaTime) {
    // Access transform
    this.transform.position.y += 1;
  }
}
```

### 5. GameScene (`src/scenes/GameScene.js`)

Enhanced Scene with Unity-like query methods:

**Query Methods:**
```javascript
// By name
const player = scene.find('Player');

// By tag
const player = scene.findWithTag('player');
const enemies = scene.findGameObjectsWithTag('enemy');

// By component
const first = scene.findObjectOfType(HealthComponent);
const all = scene.findObjectsOfType(HealthComponent);

// Spatial queries
const nearest = scene.findClosest(position, 'enemy');
const nearby = scene.findInRadius(position, 10);

// Multiple components
const objects = scene.findObjectsWithComponents(
  HealthComponent, 
  CombatComponent
);
```

**Utility Methods:**
```javascript
// Destroy with delay
scene.destroy(gameObject, 2); // Destroy after 2 seconds

// Instantiate in scene
const clone = scene.instantiate(prefab, position, rotation);

// Broadcast
scene.broadcast('takeDamage', 10);
scene.broadcastToTag('enemy', 'alert', player);
```

## How to Use

### Basic Game Structure

```javascript
import {
  GameEngine,
  GameScene,
  GameObject,
  GameObjectFactory,
  PrefabManager,
  Component
} from './src/index.js';

// 1. Create Components
class PlayerController extends Component {
  awake() {
    this.speed = 10;
  }

  update(deltaTime) {
    // Handle input and movement
  }
}

// 2. Register Prefabs
PrefabManager.register('Enemy', () => {
  const enemy = GameObjectFactory.createCube({ color: 0xff0000 });
  enemy.addTag('enemy');
  enemy.addComponent(EnemyAI);
  return enemy;
});

// 3. Create Game Scene
class MyGame extends GameScene {
  async load() {
    // Create player
    const player = GameObjectFactory.builder()
      .name('Player')
      .withTag('player')
      .withMesh(mesh)
      .withComponent(PlayerController)
      .build();
    
    this.addEntity(player);

    // Spawn enemies
    for (let i = 0; i < 5; i++) {
      const enemy = PrefabManager.instantiate('Enemy');
      this.addEntity(enemy);
    }

    await super.load();
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Query enemies
    const enemies = this.findGameObjectsWithTag('enemy');
    console.log(`${enemies.length} enemies remaining`);
  }
}

// 4. Start Engine
const engine = new GameEngine();
engine.start();
engine.loadScene(MyGame);
```

## Comparison to Unity

| Unity | This Engine |
|-------|-------------|
| `GameObject` | `GameObject` |
| `MonoBehaviour` | `Component` |
| `Awake()` | `awake()` |
| `Start()` | `start()` |
| `Update()` | `update(deltaTime)` |
| `FixedUpdate()` | `fixedUpdate(deltaTime)` |
| `OnEnable()` | `onEnable()` |
| `OnDisable()` | `onDisable()` |
| `OnDestroy()` | `onDestroy()` |
| `GetComponent<T>()` | `getComponent(T)` |
| `FindObjectOfType<T>()` | `findObjectOfType(T)` |
| `GameObject.FindWithTag()` | `findWithTag(tag)` |
| `Instantiate()` | `PrefabManager.instantiate()` |
| `transform.position` | `transform.position` |
| `SendMessage()` | `sendMessage()` |
| `BroadcastMessage()` | `broadcastMessage()` |

## Live Example

Check out the complete example:
```bash
cd examples/gameobject-demo
```

Open in browser: `http://localhost:5173/examples/gameobject-demo/`

The demo shows:
- GameObject creation
- Component lifecycle
- Prefab system
- Scene queries
- Player controller
- Enemy AI
- Collectibles

## Benefits

1. **Familiar** - Unity developers feel at home
2. **Organized** - Clear structure for game logic
3. **Reusable** - Prefabs and components
4. **Powerful** - Rich query system
5. **Flexible** - Compose complex behaviors
6. **Clean** - Lifecycle hooks keep code organized

## Migration Path

**Existing code still works!** GameObject extends Actor, so:

```javascript
// Old code - still works
const actor = new Actor({ name: 'Player' });

// New code - more features
const player = new GameObject({ name: 'Player' });
const player2 = GameObjectFactory.createCube({ name: 'Player' });
```

## What's the Difference?

| Feature | Entity/Actor | GameObject |
|---------|-------------|-----------|
| Transform | ✅ | ✅ |
| Components | ✅ | ✅ |
| Physics | ✅ | ✅ |
| Movement | ✅ | ✅ |
| Lifecycle Hooks | ❌ | ✅ |
| Parent-Child | ❌ | ✅ |
| Unity-like API | ❌ | ✅ |
| Builder Pattern | ❌ | ✅ |
| Message System | ❌ | ✅ |

## Next Steps

1. ✅ Try the example: `examples/gameobject-demo/`
2. ✅ Read the guide: `GAMEOBJECT_GUIDE.md`
3. ✅ Create your own components
4. ✅ Use prefabs for reusable objects
5. ✅ Use GameScene for better querying

## Summary

You now have a **production-ready GameObject-Component architecture** that:
- Makes game development **easier**
- Provides **Unity-like** workflow
- Maintains **full backward compatibility**
- Offers **powerful queries**
- Supports **prefabs** for reusability

**Start using it today!** 🚀

