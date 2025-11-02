# 🎮 Rolling Ball Game

A modern 3D ball game built with the **OpenWorld3D** game engine using GameObject-Component architecture.

## 🎯 Objective

Roll your ball around the arena and collect all the yellow spheres to win!

## 🎮 Controls

- **WASD** - Move the ball
- **R** - Reset ball position (if stuck)

## 🏗️ Architecture

This game demonstrates proper modular organization:

### Components (`components/`)
- **BallController.js** - Handles ball movement with WASD controls
- **CameraFollowComponent.js** - Smooth camera following system
- **CollectibleComponent.js** - Makes objects collectible with points
- **RotateComponent.js** - Rotates and bobs objects

### Systems (`systems/`)
- **GameManager.js** - Manages score, game state, and UI updates
- **PlatformManager.js** - Spawns obstacles and collectibles

### Scenes (`scenes/`)
- **RollingBallScene.js** - Main game scene with ground, walls, and setup

### Entry Point
- **main.js** - Game initialization (clean and simple)

## ✨ Features

- ✅ Smooth ball movement with WASD controls
- ✅ Camera follows the ball smoothly
- ✅ Collectible items with visual feedback
- ✅ Score tracking and UI updates
- ✅ Boundary walls prevent falling off
- ✅ Obstacles to navigate around
- ✅ Win condition when all items collected
- ✅ Modern, clean UI

## 🎨 Design Patterns

### GameObject-Component Architecture
Every game object is composed of reusable components:

```javascript
const player = GameObjectFactory.builder()
  .name('Player')
  .withTag('player')
  .withMesh(MeshBuilder.createSphere({ radius: 1, color: 0xff4444 }))
  .at(0, 1, 0)
  .withComponent(BallController, { speed: 15 })
  .build();
```

### Event-Driven Communication
Components communicate through events:

```javascript
// In CollectibleComponent
this.emit('collected', { points: 10 });

// In GameManager
collectibleComp.on('collected', (data) => {
  this.score += data.points;
});
```

### Scene Queries
Find objects easily:

```javascript
const player = this.entity.scene.findWithTag('player');
const collectibles = this.entity.scene.findGameObjectsWithTag('collectible');
```

## 📂 File Structure

```
ball-game/
├── components/
│   ├── BallController.js           (85 lines)
│   ├── CameraFollowComponent.js    (48 lines)
│   ├── CollectibleComponent.js     (75 lines)
│   └── RotateComponent.js          (33 lines)
├── systems/
│   ├── GameManager.js              (118 lines)
│   └── PlatformManager.js          (94 lines)
├── scenes/
│   └── RollingBallScene.js         (92 lines)
├── main.js                         (30 lines)
├── index.html                      (UI + styling)
└── README.md
```

**Total: 7 organized files** instead of one monolithic file!

## 🚀 Running the Game

1. Make sure you're in the project root
2. Start a local server (e.g., `npx vite` or `python -m http.server`)
3. Navigate to `/examples/ball-game/`
4. Play!

## 🎓 What You'll Learn

- ✅ GameObject-Component architecture (like Unity)
- ✅ Modular file organization
- ✅ Component communication via events
- ✅ Scene management and queries
- ✅ Camera follow systems
- ✅ Game state management
- ✅ UI integration with game logic

## 🔧 Customization

Easy to modify:

```javascript
// Change ball speed
{ speed: 20 }  // in BallController

// More collectibles
{ collectibleCount: 20 }  // in PlatformManager

// Adjust camera
{ offset: { x: 0, y: 15, z: 20 } }  // in CameraFollowComponent
```

## 📚 Learn More

See `AI_ASSISTANT_GUIDE.md` in the root directory for complete engine documentation.

---

**Built with OpenWorld3D** 🎮
