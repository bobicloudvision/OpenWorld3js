# Actor Refactoring - Engine Independence

## ✅ What Changed

The `Actor` class has been refactored to be **completely independent** and game-agnostic.

## Before (Game-Specific) ❌

```javascript
class Actor extends Entity {
  constructor() {
    this.health = 100;           // RPG-specific
    this.maxHealth = 100;        // RPG-specific
    this.attackPower = 10;       // Combat-specific
    this.defense = 5;            // Combat-specific
    this.isInCombat = false;     // Combat-specific
    this.isDead = false;         // RPG-specific
  }

  takeDamage(amount) { }         // Combat-specific
  heal(amount) { }               // RPG-specific
  die() { }                      // RPG-specific
  respawn() { }                  // RPG-specific
  attack(target) { }             // Combat-specific
}
```

**Problem:** Hardcoded RPG/combat features made Actor unusable for:
- Racing games (no health needed)
- Puzzle games (no combat needed)
- Strategy games (different mechanics)
- Any non-combat game

## After (Generic) ✅

```javascript
class Actor extends Entity {
  constructor() {
    this.speed = 5;              // Generic movement
    this.rotationSpeed = PI;     // Generic rotation
    this.velocity = Vector3;     // Generic physics
    this.acceleration = Vector3; // Generic physics
    this.isMoving = false;       // Generic state
  }

  move(direction) { }            // Generic movement
  stop() { }                     // Generic movement
  rotateTo(direction) { }        // Generic rotation
  faceDirection(direction) { }   // Generic rotation
  applyForce(force) { }          // Generic physics
  applyPhysics(deltaTime) { }    // Generic physics
}
```

**Solution:** Actor now ONLY handles movement/physics. It's usable for ANY game!

## How to Add Game-Specific Features

### Option 1: Components (Recommended) ✅

```javascript
import { Actor } from './src/entities/Actor.js';
import { HealthComponent } from './examples/components/HealthComponent.js';
import { CombatComponent } from './examples/components/CombatComponent.js';

const player = new Actor({ speed: 5 });

// Add health for RPG games
player.addComponent(new HealthComponent(100));

// Add combat for combat games
player.addComponent(new CombatComponent({ 
  attackPower: 25,
  defense: 10 
}));

// Use the components
const health = player.getComponent('HealthComponent');
health.takeDamage(20);

const combat = player.getComponent('CombatComponent');
combat.attack(enemy);
```

### Option 2: Extend Actor ✅

```javascript
import { Actor } from './src/entities/Actor.js';

export class RPGCharacter extends Actor {
  constructor(config) {
    super(config);
    this.health = config.health || 100;
    this.mana = config.mana || 50;
  }

  castSpell(spell) {
    if (this.mana >= spell.cost) {
      this.mana -= spell.cost;
      // Your spell logic
    }
  }
}
```

## What Was Removed

### Removed Properties
- ❌ `health` / `maxHealth`
- ❌ `attackPower` / `defense`
- ❌ `isInCombat`
- ❌ `isDead`

### Removed Methods
- ❌ `takeDamage()`
- ❌ `heal()`
- ❌ `die()`
- ❌ `respawn()`
- ❌ `attack()`
- ❌ `_updateAnimation()` (auto animation switching)

### What Remains (Generic)
- ✅ `speed` / `rotationSpeed`
- ✅ `velocity` / `acceleration`
- ✅ `isMoving` / `isGrounded`
- ✅ `move()` / `stop()`
- ✅ `rotateTo()` / `faceDirection()`
- ✅ `applyForce()` / `applyPhysics()`
- ✅ `playAnimation()` (if animator set)

## Migration Guide

### If you were using old Actor:

**Before:**
```javascript
const player = new Actor({ 
  health: 100,
  attackPower: 25
});

player.takeDamage(20);
player.attack(enemy);
```

**After:**
```javascript
import { HealthComponent } from './examples/components/HealthComponent.js';
import { CombatComponent } from './examples/components/CombatComponent.js';

const player = new Actor({ speed: 5 });
player.addComponent(new HealthComponent(100));
player.addComponent(new CombatComponent({ attackPower: 25 }));

const health = player.getComponent('HealthComponent');
health.takeDamage(20);

const combat = player.getComponent('CombatComponent');
combat.attack(enemy);
```

## Example Components Provided

We've created example components in `/examples/components/`:

1. **HealthComponent** - Health, damage, death, respawn
2. **CombatComponent** - Attack, defense, combat state

Copy and modify these for your game!

## Benefits

### ✅ Engine Independence
- Actor is now usable for ANY game type
- No hardcoded game mechanics
- No RPG/combat assumptions

### ✅ Flexibility
- Use Actor for racing games (just movement)
- Use Actor for puzzle games (just positioning)
- Use Actor for FPS games (just player controller)
- Use Actor for ANY game (customize via components)

### ✅ Modularity
- Health component = Optional
- Combat component = Optional
- Your custom components = Easy to add
- Mix and match features as needed

### ✅ Reusability
- Same Actor class works for player, NPC, vehicle, creature
- Components are reusable across projects
- No engine modification needed for new games

## Different Game Types

### RPG Game
```javascript
const character = new Actor();
character.addComponent(new HealthComponent());
character.addComponent(new ManaComponent());
character.addComponent(new InventoryComponent());
```

### Racing Game
```javascript
const car = new Actor();
car.addComponent(new VehiclePhysicsComponent());
car.addComponent(new EngineComponent());
// No health/combat needed!
```

### FPS Game
```javascript
const player = new Actor();
player.addComponent(new WeaponComponent());
player.addComponent(new AmmoComponent());
// Different mechanics than RPG!
```

### Puzzle Game
```javascript
const piece = new Actor();
// Just movement, no components needed!
```

## Summary

**Before:** Actor was an RPG character class ❌  
**After:** Actor is a generic moving entity ✅

**Before:** Health/combat hardcoded ❌  
**After:** Health/combat via components ✅

**Before:** Only for RPG/combat games ❌  
**After:** Works for ANY game type ✅

The engine is now truly independent and reusable! 🎮

