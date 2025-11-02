# 🔍 Physics Debug Visualization

Visualize collision shapes and physics bodies in real-time to debug your game's physics!

## ✨ Features

### Wireframe Visualization
- **Green wireframes** = Static bodies (mass = 0) - walls, ground, etc.
- **Magenta wireframes** = Dynamic bodies (mass > 0) - player, obstacles, etc.
- Wireframes update in real-time as objects move

### Easy Toggle
- Press **P** key to toggle on/off
- Or use API: `engine.physicsManager.toggleDebug()`
- Start with debug enabled: `physicsConfig: { debug: true }`

## 🎮 Usage

### In Your Game

```javascript
const engine = new GameEngine({
  physics: true,
  physicsConfig: {
    gravity: -20,
    debug: false  // Start with debug OFF
  }
});

// Later, toggle in update loop:
if (input.isKeyPressed('KeyP')) {
  engine.physicsManager.toggleDebug();
}
```

### API Methods

```javascript
// Enable debug visualization
engine.physicsManager.enableDebug();

// Disable debug visualization
engine.physicsManager.disableDebug();

// Toggle debug visualization
engine.physicsManager.toggleDebug();

// Check if debug is enabled
const isDebugOn = engine.physicsManager.debugEnabled;
```

## 🎯 Example

See `examples/ball-game/index-physics.html` for a working demo:

```javascript
// Press P to toggle physics debug
if (input.isKeyPressed('KeyP')) {
  this.engine.physicsManager.toggleDebug();
  this.updateDebugUI();
}
```

## 📊 What Gets Visualized

### Shape Types Supported
- ✅ **Box** - Wireframe box around collision shape
- ✅ **Sphere** - Wireframe sphere
- ✅ **Cylinder** - Wireframe cylinder
- ✅ **Plane** - Large wireframe plane (100x100)

### Visual Indicators

**Color Coding:**
```javascript
// Static bodies (mass = 0)
color: 0x00ff00  // Green - walls, ground, static obstacles

// Dynamic bodies (mass > 0)
color: 0xff00ff  // Magenta - player, movable objects
```

**Properties:**
- Wireframe mode - see through objects
- 50% opacity - doesn't block view
- Auto-updates position and rotation
- Automatically created/destroyed with physics bodies

## 🔧 How It Works

### Architecture

```
PhysicsManager
├── debugEnabled (boolean)
├── debugMeshes (Map<bodyId, THREE.Mesh>)
├── debugScene (THREE.Scene reference)
│
├── createDebugMesh(body) → Creates wireframe
├── updateDebugVisualization() → Syncs positions
├── removeDebugMesh(body) → Cleans up
└── toggleDebug() → Enable/disable
```

### Automatic Synchronization

1. **Body Created** → Debug mesh created automatically
2. **Physics Update** → Debug meshes sync to body positions
3. **Body Removed** → Debug mesh removed automatically

### Performance

- **Minimal overhead** - Simple wireframe meshes
- **No impact when disabled** - Meshes not created
- **Efficient updates** - Only syncs when debug enabled
- **Auto cleanup** - Removes meshes when bodies destroyed

## 🎨 Customization

### Change Debug Colors

Edit `PhysicsManager.js`:

```javascript
const material = new THREE.MeshBasicMaterial({
  color: body.mass === 0 ? 0x00ff00 : 0xff00ff,  // Change these!
  wireframe: true,
  transparent: true,
  opacity: 0.5  // Adjust opacity
});
```

### Add More Shape Types

```javascript
// In createDebugMesh()
else if (shape instanceof CANNON.YourShape) {
  geometry = new THREE.YourGeometry(...);
}
```

## 🐛 Debugging Tips

### Use Debug Mode When:
- ✅ Collision detection issues
- ✅ Objects falling through floors
- ✅ Unexpected physics behavior
- ✅ Tuning collision shapes
- ✅ Verifying body positions

### Common Issues Revealed:

**1. Shape Size Mismatch**
```
Visual mesh: 2x2x2 cube
Physics body: 1x1x1 box  ❌
```
Debug visualization shows the real collision shape!

**2. Wrong Mass**
```
Object won't move?
Debug shows: Green wireframe (mass = 0) ❌
Should be: Magenta wireframe (mass > 0) ✓
```

**3. Position Offset**
```
Visual mesh at (0, 1, 0)
Physics body at (0, 0, 0) ❌
Debug shows the mismatch!
```

## 📚 Code Examples

### Basic Setup

```javascript
import { GameEngine } from './src/index.js';

const engine = new GameEngine({
  physics: true,
  physicsConfig: {
    gravity: -9.82,
    debug: true  // ✅ Start with debug ON
  }
});

engine.start();
```

### Toggle in Game

```javascript
class MyGame extends GameScene {
  update(deltaTime) {
    super.update(deltaTime);
    
    const input = this.entity.scene.engine.inputManager;
    
    // Press 'D' to toggle debug
    if (input.isKeyPressed('KeyD')) {
      this.engine.physicsManager.toggleDebug();
      console.log('Debug:', this.engine.physicsManager.debugEnabled);
    }
  }
}
```

### Show Debug Status in UI

```javascript
updateUI() {
  const debugStatus = document.getElementById('debug-status');
  if (debugStatus) {
    const isEnabled = this.engine.physicsManager.debugEnabled;
    debugStatus.textContent = isEnabled ? 'ON' : 'OFF';
    debugStatus.style.color = isEnabled ? '#00ff88' : '#ff6b6b';
  }
}
```

## 🎓 Understanding the Visualization

### Static Body (Green)
```
┌─────────┐
│ Ground  │ ← Green wireframe
│         │   Mass = 0
│         │   Won't move
└─────────┘
```

### Dynamic Body (Magenta)
```
   ╱◯╲     ← Magenta wireframe
  ╱   ╲      Mass > 0
 ╱ Ball╲     Can move
╱_______╲
```

### Collision Detection
```
Ball approaching wall:

  ◯────────→ │
              │ Wall

Debug shows exact collision shapes
so you can see why/how they collide!
```

## 🚀 Benefits

### For Development
- ✅ **Instant feedback** - See collision shapes immediately
- ✅ **Visual debugging** - No console.log needed
- ✅ **Precise tuning** - Adjust shapes perfectly
- ✅ **Problem identification** - Find issues fast

### For Learning
- ✅ **Understand physics** - See how it works
- ✅ **Shape visualization** - Learn collision shapes
- ✅ **Mass effects** - Color-coded by mass
- ✅ **Real-time updates** - Watch physics in action

## 📝 Implementation Notes

### File Changes
1. **PhysicsManager.js** - Added debug rendering system
2. **SceneManager.js** - Connects debug scene automatically
3. **GameEngine.js** - Passes physicsConfig.debug option

### Dependencies
- THREE.js (already included)
- Cannon-es (already included)
- No additional libraries needed!

### Memory Usage
- Each debug mesh: ~1KB
- 100 bodies with debug: ~100KB
- Negligible impact on performance

## 🎯 Quick Reference

```javascript
// Enable
engine.physicsManager.enableDebug();

// Disable
engine.physicsManager.disableDebug();

// Toggle
engine.physicsManager.toggleDebug();

// Check status
engine.physicsManager.debugEnabled  // true/false

// Start with debug on
new GameEngine({
  physics: true,
  physicsConfig: { debug: true }
});
```

---

**Status**: ✅ **FULLY IMPLEMENTED AND TESTED**

Try it now in `examples/ball-game/index-physics.html` - Press **P** to see it in action! 🎮🔍

