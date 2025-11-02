# ⚡ Physics Ball Game

A **well-architected** 3D physics-based ball game built with the OpenWorld3D engine, demonstrating best practices in game architecture.

## 🎯 Objective

Roll your ball around the arena, collect all **yellow spheres**, and push obstacles out of your way!

## 🎮 Controls

- **WASD** - Move the ball (applies physics forces)
- **SPACE** - Jump (when grounded)
- **P** - Toggle physics debug visualization
- **R** - Reset ball to starting position

## 🏗️ Architecture

This project follows **professional game architecture** patterns:

### 📂 Folder Structure

```
ball-game-physics/
├── components/              # Reusable behaviors
│   ├── BallController.js        (70 lines) - Force-based movement
│   ├── CameraFollowComponent.js (50 lines) - Smooth camera
│   ├── CollectibleComponent.js  (80 lines) - Collection logic
│   └── RotateComponent.js       (40 lines) - Visual effects
│
├── systems/                 # Game-wide managers
│   ├── GameManager.js          (145 lines) - Score, UI, events
│   └── ObstacleManager.js      (100 lines) - Level generation
│
├── scenes/                  # Scene composition
│   └── PhysicsBallScene.js     (145 lines) - Main game scene
│
├── main.js                  (50 lines) - Entry point
├── index.html              (300 lines) - UI + styling
└── README.md               - This file
```

**Total: 8 clean, organized files** instead of one monolithic file!

## ✨ Features

### Gameplay
- ✅ Physics-based ball movement with forces
- ✅ **Jumping mechanic** with ground detection
- ✅ Collectible items with visual feedback
- ✅ Pushable obstacles with varying masses
- ✅ Score tracking and timer
- ✅ Win condition detection

### Technical
- ✅ Real physics engine (Cannon.js)
- ✅ Physics debug visualization (Press P)
- ✅ Component-based architecture
- ✅ Event-driven communication
- ✅ Clean separation of concerns

## 🎨 Design Patterns

### 1. Component-Based Architecture

Each behavior is a separate, reusable component:

```javascript
// BallController - handles movement
player.addComponent(BallController, { moveForce: 20, maxSpeed: 15 });

// CollectibleComponent - makes objects collectible
collectible.addComponent(CollectibleComponent, { points: 10 });
```

### 2. Event-Driven Communication

Components communicate through events:

```javascript
// CollectibleComponent emits event when collected
this.emit('collected', { points: 10, collector: player });

// GameManager listens for collection events
collectibleComp.on('collected', (data) => {
  this.score += data.points;
});
```

### 3. System Architecture

Game-wide systems manage high-level logic:

```javascript
// GameManager - handles score, UI, game state
// ObstacleManager - spawns and manages level objects
```

### 4. Scene Composition

Scene assembles everything together:

```javascript
createGameSystems() {
  const gameManager = GameObjectFactory.createEmpty();
  gameManager.addComponent(GameManager);
  
  const obstacleManager = GameObjectFactory.createEmpty();
  obstacleManager.addComponent(ObstacleManager);
}
```

## 🔍 Physics Debug

Press **P** to toggle physics debug visualization:

- 🟢 **Green wireframes** = Static bodies (walls, ground)
- 🟣 **Magenta wireframes** = Dynamic bodies (ball, obstacles)

Perfect for:
- Debugging collision issues
- Tuning physics shapes
- Understanding object interactions

## 📊 Code Organization

### Components (Behaviors)
- **BallController** - Force-based movement + jumping with ground detection
- **CameraFollowComponent** - Smooth camera tracking
- **CollectibleComponent** - Collection detection + animation
- **RotateComponent** - Rotation and bobbing animation

### Systems (Managers)
- **GameManager** - Score, UI, game state, input handling
- **ObstacleManager** - Level generation, object spawning

### Scene
- **PhysicsBallScene** - World setup, composition, coordination

## 🚀 Running the Game

1. Start a development server:
   ```bash
   npx vite
   # or
   python -m http.server
   ```

2. Navigate to `/examples/ball-game-physics/`

3. Play!

## 🎓 What You'll Learn

### Architecture Patterns
- ✅ Component-based design
- ✅ Event-driven communication
- ✅ System architecture
- ✅ Scene composition

### Physics Programming
- ✅ Force-based movement
- ✅ Physics body setup
- ✅ Collision detection
- ✅ Debug visualization

### Best Practices
- ✅ Modular file organization
- ✅ Clean separation of concerns
- ✅ Reusable components
- ✅ Maintainable code structure

## 🔧 Customization

Easy to modify:

```javascript
// Change ball speed
{ moveForce: 30, maxSpeed: 20 }  // in BallController

// More collectibles
{ collectibleCount: 20 }  // in ObstacleManager

// Adjust camera
{ offset: { x: 0, y: 20, z: 25 } }  // in CameraFollowComponent
```

## 📈 Complexity Comparison

### ❌ Monolithic Approach
```
Single file: 1000+ lines
- Hard to maintain
- Difficult to test
- Cannot reuse code
- Confusing structure
```

### ✅ Modular Approach (This Project)
```
8 files, averaging 70 lines each
- Easy to understand
- Simple to test
- Highly reusable
- Clear structure
```

## 🎯 Architecture Benefits

### Modularity
- Each file has **one clear purpose**
- Components are **self-contained**
- Easy to **find and fix** bugs

### Reusability
- Components work in **any project**
- Systems are **game-agnostic**
- Scenes are **composable**

### Maintainability
- Small files are **easy to read**
- Changes are **isolated**
- Testing is **straightforward**

### Scalability
- Add features **without breaking** existing code
- Team members can work **independently**
- Codebase **grows cleanly**

## 🏆 Professional Standards

This project demonstrates:
- ✅ Industry-standard architecture
- ✅ Clean code principles
- ✅ Professional organization
- ✅ Best practices throughout

## 📚 Related Documentation

- **AI_ASSISTANT_GUIDE.md** - Complete engine guide
- **PHYSICS_FIX.md** - Physics engine details
- **PHYSICS_DEBUG.md** - Debug visualization guide

## 💡 Tips

1. **Start simple** - Copy this structure for your games
2. **One component per file** - Keep files small and focused
3. **Use events** - Components shouldn't directly reference each other
4. **Test components independently** - Modular = testable

---

**Built with OpenWorld3D Engine** 🎮

*This is how professional games are architected!*

