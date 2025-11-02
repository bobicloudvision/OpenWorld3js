# ✅ Auto-Sync Guide

The engine automatically handles **ALL synchronization** between physics, entities, and visual meshes. You don't need to manually sync anything!

## 🎯 What Gets Auto-Synced

### 1. Entity Position → Mesh Position ✅

```javascript
// Just set entity position
actor.setPosition(10, 5, 0);

// ✅ Mesh automatically syncs!
// actor.mesh.position is now (10, 5, 0)
```

### 2. Physics Body → Entity → Mesh ✅

```javascript
// Physics simulation moves the body
// You don't need to do ANYTHING!

update(deltaTime) {
  // ✅ Actor.update() automatically syncs:
  // Physics body → Entity position → Mesh position
  
  // No manual sync needed!
}
```

### 3. No Physics? Still Synced! ✅

```javascript
// Without physics, velocity still works
actor.velocity.set(5, 0, 0);

update(deltaTime) {
  // ✅ Actor.update() automatically applies velocity
  // and syncs mesh position!
}
```

## 📊 Before vs After

### ❌ BEFORE (Manual Sync Everywhere)

```javascript
class MyGame extends Scene {
  update(deltaTime) {
    // Move player
    this.player.move(direction, deltaTime);
    
    // ❌ Manual sync #1
    this.player.mesh.position.copy(this.player.position);
    
    // Move enemies
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);
      
      // ❌ Manual sync #2
      enemy.mesh.position.copy(enemy.position);
    });
    
    // Physics objects
    this.boxes.forEach(box => {
      // ❌ Manual sync #3
      box.position.copy(box.physicsBody.position);
      box.mesh.position.copy(box.physicsBody.position);
      box.mesh.quaternion.copy(box.physicsBody.quaternion);
    });
    
    // Ball
    // ❌ Manual sync #4
    this.ball.position.copy(this.ball.physicsBody.position);
    this.ball.mesh.position.copy(this.ball.physicsBody.position);
    this.ball.mesh.quaternion.copy(this.ball.physicsBody.quaternion);
  }
}
```

**Problems:**
- 😫 Manual sync everywhere
- 🐛 Easy to forget
- 📝 Repetitive code
- ⏱️ More work

### ✅ AFTER (Automatic!)

```javascript
class MyGame extends Scene {
  update(deltaTime) {
    // Move player
    this.player.move(direction, deltaTime);
    
    // ✅ Auto-syncs! No manual code needed!
    
    // Enemies update
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime);
      // ✅ Auto-syncs!
    });
    
    // Physics objects
    this.boxes.forEach(box => {
      box.update(deltaTime);
      // ✅ Auto-syncs!
    });
    
    // Ball
    this.ball.update(deltaTime);
    // ✅ Auto-syncs!
  }
}
```

**Benefits:**
- 😊 No manual sync code
- ✅ Can't forget to sync
- 📝 Clean, simple code
- ⚡ Less work

## 🔄 How It Works Internally

### Without Physics:

```
Actor.update(deltaTime)
  ├─ Apply velocity to position
  ├─ ✅ Auto-sync: mesh.position = entity.position
  └─ Done!
```

### With Physics:

```
Actor.update(deltaTime)
  ├─ Check if physics enabled
  ├─ ✅ Auto-sync: 
  │    physicsBody.position → entity.position → mesh.position
  │    physicsBody.quaternion → mesh.quaternion
  └─ Done!
```

## 🎮 Complete Example

```javascript
import { GameEngine, PhysicsScene, Actor, MeshBuilder, Color } from './engine';

class SimpleGame extends PhysicsScene {
  async load() {
    // Create player
    this.player = new Actor({ name: 'Player' });
    this.player.mesh = MeshBuilder.createBox({ color: Color.BLUE });
    this.player.setPosition(0, 2, 0);  // ✅ Auto-syncs mesh!
    this.addEntity(this.player);
    
    // Enable physics
    this.player.enablePhysics({ mass: 5 });  // ✅ Auto-syncs from now on!
    
    // Camera
    this.camera = this.setupCamera(this.player);
    this.setupInput();
  }
  
  update(deltaTime) {
    super.update(deltaTime);
    
    // Handle input
    const input = this.engine.inputManager;
    const dir = { x: 0, y: 0, z: 0 };
    
    if (input.isActionDown('forward')) dir.z = -1;
    if (input.isActionDown('backward')) dir.z = 1;
    
    // Push player
    this.pushActor(this.player, dir, 15);
    
    // ✅ NO SYNC CODE NEEDED!
    // Everything auto-syncs in Actor.update()
    
    this.camera.update(deltaTime);
  }
}
```

**That's it!** No manual sync code anywhere! 🎉

## 🛠️ Advanced: Manual Sync (Rarely Needed)

In rare cases, you might want manual control:

```javascript
// Force sync physics → visual
actor.syncPhysicsToVisual();

// Force sync visual → physics
actor.syncVisualToPhysics();

// Disable auto-sync (not recommended)
actor.update = function(deltaTime) {
  // Your custom update without auto-sync
};
```

But **99% of the time, you don't need this!** The auto-sync handles everything.

## 📝 Rules of Thumb

### ✅ DO THIS:

```javascript
// Set position using setPosition()
actor.setPosition(x, y, z);  // Auto-syncs!

// Let Actor.update() handle syncing
actor.update(deltaTime);  // Auto-syncs!

// Use physics with enablePhysics()
actor.enablePhysics({ mass: 5 });  // Auto-syncs from now on!
```

### ❌ DON'T DO THIS:

```javascript
// ❌ Don't manually sync (it's automatic!)
actor.mesh.position.copy(actor.position);

// ❌ Don't sync physics manually (it's automatic!)
actor.position.copy(actor.physicsBody.position);

// ❌ Don't override Actor.update() without calling super
actor.update = function(deltaTime) {
  // Missing super.update(deltaTime) breaks auto-sync!
};
```

## 🎯 Summary

**The engine automatically syncs:**

1. ✅ `setPosition()` → mesh position
2. ✅ `Actor.update()` → velocity → position → mesh
3. ✅ `Actor.update()` with physics → physics body → entity → mesh
4. ✅ Rotation (quaternion) for physics objects

**You just need to:**

1. Create actors
2. Call `setPosition()` when needed
3. Call `actor.update(deltaTime)` in your scene update
4. That's it!

**No manual sync code needed anywhere in your game!** 🚀

---

## 🎉 Result

Your game code is now:
- **Simpler** - No sync boilerplate
- **Cleaner** - Focus on game logic
- **Safer** - Can't forget to sync
- **Shorter** - Less code to maintain

**This is how game engines SHOULD work!** ⚡🎮

