# ⚡ Simple Game - Simplified API Demo

This example shows how **easy** it is to create games with the new simplified API!

## 🎯 Before vs After

### ❌ OLD WAY (Complex)

```javascript
class MyGame extends Scene {
  async load() {
    // Create ground - 15 lines of code
    const ground = MeshBuilder.createPlane({ width: 100, height: 100, color: Color.GRASS });
    ground.rotation.x = -Math.PI / 2;
    this.add(ground);
    
    const grid = MeshBuilder.createGrid({ size: 100, divisions: 50 });
    grid.position.y = 0.01;
    this.add(grid);
    
    const physics = this.engine.physicsManager;
    physics.createPlane({ mass: 0, position: { x: 0, y: 0, z: 0 }, rotation: { x: -Math.PI / 2, y: 0, z: 0 } });
    
    // Create player - 20+ lines of code
    const mesh = MeshBuilder.createBox({ width: 1, height: 2, depth: 1, color: Color.BLUE });
    this.player = new Actor({ name: 'Player', speed: 8 });
    this.player.mesh = mesh;
    this.player.setPosition(0, 2, 0);
    
    const body = physics.addToEntity(this.player, {
      type: 'box',
      width: 1,
      height: 2,
      depth: 1,
      mass: 5
    });
    body.fixedRotation = true;
    body.updateMassProperties();
    body.linearDamping = 0.1;
    
    this.addEntity(this.player);
    
    // ... and so on
  }
}
```

### ✅ NEW WAY (Simple!)

```javascript
class MyGame extends PhysicsScene {  // ← Use PhysicsScene instead of Scene
  async load() {
    // Create ground - 1 line!
    this.addGround({ size: 100, showGrid: true });
    
    // Create player - 1 line!
    this.player = this.addPlayer({
      position: { x: 0, y: 2, z: 0 },
      color: Color.BLUE
    });
    
    // Create walls - 1 line!
    this.addWalls({ size: 50 });
    
    // Setup camera - 1 line!
    this.camera = this.setupCamera(this.player);
    
    // Setup input - 1 line!
    this.setupInput();
  }
}
```

## 🚀 New Simplified Methods

### PhysicsScene Methods

```javascript
// Ground with physics
this.addGround({ size: 100, color: Color.GRASS, showGrid: true });

// Player with physics
this.player = this.addPlayer({ 
  position: { x: 0, y: 2, z: 0 },
  shape: 'box',  // 'box', 'sphere', 'capsule'
  color: Color.BLUE,
  speed: 8,
  mass: 5
});

// Collectibles with physics
this.collectible = this.addCollectible({
  position: { x: 10, y: 2, z: 10 },
  shape: 'cylinder',
  color: Color.YELLOW,
  glow: true,  // Makes it glow!
  isTrigger: true  // No collision, just detection
});

// Walls around arena
this.addWalls({ size: 50, height: 3, thickness: 1 });

// Camera following player
this.camera = this.setupCamera(this.player, { 
  distance: 15, 
  height: 8 
});

// Input bindings
this.setupInput(); // Sets up WASD, Space, E, R automatically
this.setupInput({ 
  action: ['KeyF'],  // Custom binding
  special: ['KeyQ']
});

// Distance check
if (this.isNear(player, collectible, 3)) {
  // Player is within 3 units
}

// Push actor with force
this.pushActor(player, { x: 1, y: 0, z: 0 }, 15);

// Make actor jump
this.jumpActor(player, 80);
```

## 📊 Code Reduction

| Task | Old Code | New Code | Reduction |
|------|----------|----------|-----------|
| Create ground + physics | ~15 lines | **1 line** | 93% less |
| Create player + physics | ~20 lines | **1 line** | 95% less |
| Create walls | ~30 lines | **1 line** | 97% less |
| Setup camera | ~10 lines | **1 line** | 90% less |
| Setup input | ~8 lines | **1 line** | 87% less |

**Total: ~90% less boilerplate code!** 🎉

## 🎮 Complete Game in 100 Lines

Check `main.js` - a complete game with:
- ✅ Player with physics
- ✅ Ground with grid
- ✅ Walls
- ✅ 5 collectibles
- ✅ Score system
- ✅ Camera system
- ✅ Input handling

**All in ~100 lines of clean code!**

## 💡 When to Use What

### Use `PhysicsScene` when:
- You need physics
- You want quick prototyping
- You're building a simple game
- You want less boilerplate

### Use `Scene` when:
- You need full control
- You're building something complex
- You have custom requirements
- You don't need physics

## 🔧 How It Works

### PhysicsScene extends Scene
```javascript
PhysicsScene → Scene → EventEmitter
```

### GameHelpers provides utilities
```javascript
helpers.createGround()
helpers.createPlayer()
helpers.createCollectible()
// etc.
```

### Everything is optional
```javascript
// Still have full access to engine
this.engine.physicsManager
this.add(customMesh)
// etc.
```

## 🎯 Best Practices

1. **Start simple** - Use PhysicsScene helpers
2. **Customize when needed** - Mix helpers with custom code
3. **Don't mix too much** - Either use helpers OR manual, not both for same object
4. **Read helper code** - Learn from the implementations

## 🚀 Try These Challenges

1. Change player to sphere shape
2. Add 10 collectibles in a circle
3. Make collectibles rotate
4. Add a timer
5. Create moving obstacles

## 📚 Related

- See `src/helpers/GameHelpers.js` for all helper methods
- See `src/helpers/PhysicsScene.js` for the extended scene
- Compare with `ball-game` example to see the difference

---

**Now you can build games FAST!** ⚡🎮

