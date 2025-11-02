# Example Game Components

These are **example components** for common game features. They are **NOT part of the core engine**.

## Purpose

These components demonstrate how to add game-specific features to entities using the component system. Copy and modify them for your own game.

## Available Components

### HealthComponent
Adds health, damage, death, and respawn functionality.

```javascript
import { HealthComponent } from './examples/components/HealthComponent.js';

const player = new Actor();
player.addComponent(new HealthComponent(100));

const health = player.getComponent('HealthComponent');
health.takeDamage(25);
health.heal(10);
```

### CombatComponent
Adds attack, defense, and combat state management.

```javascript
import { CombatComponent } from './examples/components/CombatComponent.js';

const player = new Actor();
player.addComponent(new CombatComponent({
  attackPower: 25,
  defense: 10,
  attackRange: 2,
  attackCooldown: 1.0
}));

const combat = player.getComponent('CombatComponent');
combat.attack(enemy);
```

## Creating Your Own Components

Follow this pattern:

```javascript
import { Component } from '../../src/entities/Component.js';

export class MyCustomComponent extends Component {
  constructor(config = {}) {
    super();
    // Your properties
  }

  update(deltaTime) {
    // Your update logic
  }

  // Your methods
}
```

## Using Components Together

```javascript
import { Actor } from './src/entities/Actor.js';
import { HealthComponent } from './examples/components/HealthComponent.js';
import { CombatComponent } from './examples/components/CombatComponent.js';

// Create an RPG character
const character = new Actor({ speed: 5 });

// Add health
const health = new HealthComponent(100);
character.addComponent(health);

// Add combat
const combat = new CombatComponent({ 
  attackPower: 25,
  defense: 10 
});
character.addComponent(combat);

// Listen to events
health.on('died', () => {
  console.log('Character died!');
});

combat.on('attacked', ({ target, actualDamage }) => {
  console.log(`Dealt ${actualDamage} damage to target`);
});

// Use the character
combat.attack(enemy);
```

## Engine Independence

The **core engine** (`src/`) has NO game-specific logic:
- ✅ `Actor` = Generic moving entity
- ✅ `Entity` = Generic game object
- ✅ `Component` = Generic component base

**Your game** (`examples/`, `your-game/`) adds the specifics:
- 🎮 `HealthComponent` = Your game's health system
- 🎮 `CombatComponent` = Your game's combat system
- 🎮 `InventoryComponent` = Your game's inventory
- 🎮 etc.

This keeps the engine reusable for ANY game type!

## Different Game Types

**RPG:**
```javascript
character.addComponent(new HealthComponent());
character.addComponent(new ManaComponent());
character.addComponent(new InventoryComponent());
character.addComponent(new QuestComponent());
```

**Racing Game:**
```javascript
vehicle.addComponent(new VehiclePhysicsComponent());
vehicle.addComponent(new EngineComponent());
vehicle.addComponent(new DamageComponent());
```

**Strategy Game:**
```javascript
unit.addComponent(new SelectableComponent());
unit.addComponent(new AIComponent());
unit.addComponent(new ResourceCostComponent());
```

**FPS:**
```javascript
player.addComponent(new WeaponComponent());
player.addComponent(new AmmoComponent());
player.addComponent(new ArmorComponent());
```

The engine supports ALL of these - you just create the components your game needs!

