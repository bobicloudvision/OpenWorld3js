# GameObject Architecture Demo

This example demonstrates the Unity-inspired GameObject system in the engine.

## Features Demonstrated

### 1. GameObject System
- GameObject creation with factory methods
- Builder pattern for fluent GameObject construction
- Parent-child hierarchy
- Transform system

### 2. Component Lifecycle
- `awake()` - Called once when created
- `start()` - Called before first update
- `update()` - Called every frame
- `onEnable()` / `onDisable()` - Called when enabled/disabled
- `onDestroy()` - Called when destroyed

### 3. Prefab System
- Register reusable GameObject templates
- Instantiate prefabs multiple times
- Configure instances with overrides

### 4. Scene Queries (Unity-like)
- `find(name)` - Find GameObject by name
- `findWithTag(tag)` - Find GameObject with tag
- `findGameObjectsWithTag(tag)` - Find all with tag
- `findObjectOfType(component)` - Find first with component
- `findObjectsOfType(component)` - Find all with component
- `findClosest(position, tag)` - Find nearest GameObject
- `findInRadius(position, radius)` - Find all in range

## Code Examples

### Creating a GameObject with Builder Pattern

```javascript
const player = GameObjectFactory.builder()
  .name('Player')
  .withTag('player')
  .withMesh(MeshBuilder.createCapsule({ radius: 0.5, height: 2 }))
  .at(0, 1, 0)
  .withComponent(HealthComponent, { maxHealth: 100 })
  .withComponent(PlayerController)
  .build();
```

### Creating a Prefab

```javascript
PrefabManager.register('Enemy', (config) => {
  const enemy = GameObjectFactory.createCube({
    color: 0xff0000
  });
  
  enemy.addTag('enemy');
  enemy.addComponent(HealthComponent, { maxHealth: 50 });
  enemy.addComponent(EnemyAI);
  
  return enemy;
});

// Instantiate prefab
const enemy = PrefabManager.instantiate('Enemy');
```

### Custom Component with Lifecycle

```javascript
class PlayerController extends Component {
  awake() {
    console.log('Awake');
  }

  start() {
    console.log('Start');
  }

  update(deltaTime) {
    // Update every frame
    const input = this.entity.scene.engine.inputManager;
    
    if (input.isKeyPressed('w')) {
      this.entity.move({ x: 0, y: 0, z: -1 }, deltaTime);
    }
  }

  onDestroy() {
    console.log('Destroyed');
  }
}
```

### Scene Queries

```javascript
// Find player
const player = scene.findWithTag('player');

// Find all enemies
const enemies = scene.findGameObjectsWithTag('enemy');

// Find objects with HealthComponent
const damageable = scene.findObjectsOfType(HealthComponent);

// Find nearest enemy
const nearest = scene.findClosest(player.position, 'enemy');

// Find all in radius
const nearby = scene.findInRadius(player.position, 10);
```

## Controls

- **WASD** - Move player
- **Space** - Jump
- **E** - Spawn enemy
- **C** - Spawn collectible
- **Q** - Attack nearest enemy

## Architecture Benefits

1. **Composition over Inheritance** - Build complex behavior from simple components
2. **Reusability** - Prefabs allow easy object creation
3. **Familiar API** - Unity-like for easy learning
4. **Lifecycle Management** - Automatic initialization and cleanup
5. **Powerful Queries** - Find objects efficiently
6. **Event System** - Components can communicate via events

## How to Run

```bash
npm run dev
```

Then open: http://localhost:5173/examples/gameobject-demo/

