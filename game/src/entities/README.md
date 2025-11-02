# Entity System

The entity system is the core of the game engine's object management.

## Entity

`Entity` is the base class for all game objects. It provides:

- ✅ Transform (position, rotation, scale)
- ✅ Component system
- ✅ Tag system
- ✅ Network serialization
- ✅ Event system
- ✅ Scene integration

**Entity is completely generic** - it has NO game-specific logic.

### Usage

```javascript
import { Entity } from './src/entities/Entity.js';

const entity = new Entity({
  name: 'MyObject',
  type: 'custom'
});

entity.setPosition(10, 0, 5);
entity.setRotation(0, Math.PI / 2, 0);
entity.addTag('interactive');
```

## Actor

`Actor` extends `Entity` with velocity-based movement. It provides:

- ✅ Velocity and acceleration
- ✅ Speed and rotation speed
- ✅ Movement methods (move, stop, rotateTo)
- ✅ Physics methods (applyForce, applyPhysics)
- ✅ Optional animation support

**Actor is also generic** - it only handles movement, NOT game-specific features like health or combat.

### Usage

```javascript
import { Actor } from './src/entities/Actor.js';

const actor = new Actor({
  speed: 5,
  rotationSpeed: Math.PI
});

// Movement
const direction = new THREE.Vector3(1, 0, 0);
actor.move(direction, deltaTime);

// Rotation
actor.rotateTo(direction, deltaTime);

// Physics
const force = new THREE.Vector3(0, 10, 0);
actor.applyForce(force);
actor.applyPhysics(deltaTime);
```

## Component

`Component` is the base class for adding functionality to entities.

**Components are where your game logic goes!**

### Usage

```javascript
import { Component } from './src/entities/Component.js';

class MyGameComponent extends Component {
  constructor() {
    super();
    this.myProperty = 0;
  }

  update(deltaTime) {
    this.myProperty += deltaTime;
  }
}

// Attach to entity
const entity = new Entity();
entity.addComponent(new MyGameComponent());

// Access component
const component = entity.getComponent('MyGameComponent');
```

## Entity vs Actor - When to Use What?

### Use Entity when:
- ✅ Object doesn't move (buildings, items, pickups)
- ✅ Object has custom movement (vehicles, projectiles)
- ✅ You want full control over behavior

### Use Actor when:
- ✅ Object moves with velocity (characters, NPCs, creatures)
- ✅ Object needs standard walking/running behavior
- ✅ You want built-in movement methods

## Adding Game-Specific Features

**❌ DON'T modify Actor to add health, combat, etc.**

**✅ DO use components:**

```javascript
// Example: RPG character
import { Actor } from './src/entities/Actor.js';
import { HealthComponent } from './examples/components/HealthComponent.js';
import { CombatComponent } from './examples/components/CombatComponent.js';

const player = new Actor({ speed: 5 });
player.addComponent(new HealthComponent(100));
player.addComponent(new CombatComponent({ attackPower: 25 }));
```

**✅ OR extend Actor:**

```javascript
import { Actor } from './src/entities/Actor.js';

export class MyGameCharacter extends Actor {
  constructor(config) {
    super(config);
    this.health = config.health || 100;
    this.mana = config.mana || 50;
  }

  castSpell(spell) {
    if (this.mana >= spell.cost) {
      this.mana -= spell.cost;
      // Cast spell
    }
  }
}
```

## Component Pattern Example

See `/examples/components/` for full examples:

```javascript
// Health component (for games with health)
class HealthComponent extends Component {
  takeDamage(amount) { /* ... */ }
  heal(amount) { /* ... */ }
}

// Combat component (for games with combat)
class CombatComponent extends Component {
  attack(target) { /* ... */ }
}

// Inventory component (for games with items)
class InventoryComponent extends Component {
  addItem(item) { /* ... */ }
}

// Vehicle physics component (for racing games)
class VehiclePhysicsComponent extends Component {
  accelerate() { /* ... */ }
  brake() { /* ... */ }
}
```

## Network Synchronization

Both Entity and Actor support automatic network synchronization:

```javascript
// Mark entity for network sync
entity.isNetworked = true;
entity.networkId = 'player-123';

// Register with network manager
engine.networkManager.registerNetworkEntity(entity);

// Automatic serialization
const state = entity.serialize();

// Automatic deserialization
entity.deserialize(networkState);
```

## Best Practices

1. **Keep Entity/Actor generic** - Don't add game-specific code
2. **Use components** - Add features through components
3. **Use events** - Components communicate via events
4. **Tag entities** - Use tags for querying
5. **Serialize carefully** - Only network what's needed

## Summary

- `Entity` = Generic game object (no movement)
- `Actor` = Generic moving object (velocity-based)
- `Component` = Where your game logic lives
- Keep the engine generic, add specifics via components or extension

This design keeps the engine reusable for ANY game type! 🎮

