# 🎮 Rolling Cylinder - Physics-Based Game

A physics-driven rolling cylinder game built with the OpenWorld3D engine, featuring a **reusable WheelComponent** that can be used for future vehicle implementations!

## 🚀 Features

### Game Features
- **Real Physics Simulation** - Powered by Cannon.js with proper torque-based rolling
- **Dynamic Obstacle Spawning** - Obstacles spawn ahead and increase in difficulty
- **Collectible System** - Collect golden spheres for points
- **Health & Scoring** - Survive as long as possible and beat your high score
- **Progressive Difficulty** - Game speed increases over time
- **Physics Debug Mode** - Press 'P' to visualize collision shapes

### Technical Features
- **Reusable WheelComponent** - Physics-based wheel that can be used for cars!
- **Modular Architecture** - Components, systems, and scenes in separate files
- **Component-Based Design** - Following Unity-style GameObject patterns
- **Smooth Camera Follow** - Camera tracks the player with configurable offset
- **Collision Detection** - Manual collision checking with physics bodies

## 🎯 Controls

| Key | Action |
|-----|--------|
| **W** | Accelerate forward |
| **S** | Reverse |
| **A** | Steer left |
| **D** | Steer right |
| **SPACE** | Brake |
| **P** | Toggle physics debug visualization |

## 📁 Project Structure

```
rolling-cylinder/
├── components/
│   ├── WheelComponent.js          # Reusable physics-based wheel
│   ├── CameraFollowComponent.js   # Smooth camera following
│   ├── ObstacleComponent.js       # Obstacle behavior
│   └── CollectibleComponent.js    # Collectible items
├── systems/
│   └── GameManager.js             # Game state, spawning, scoring
├── scenes/
│   └── RollingCylinderScene.js    # Main game scene
├── main.js                        # Entry point
├── index.html                     # Game page with UI
└── README.md                      # This file
```

## 🛞 WheelComponent - Reusable for Vehicles!

The `WheelComponent` is designed to be **reusable for future car/vehicle implementations**. It provides:

### Features
- ✅ Physics-based rolling using torque
- ✅ Steering with configurable turn rate
- ✅ Acceleration and braking
- ✅ Ground detection
- ✅ Configurable for multi-wheel vehicles
- ✅ Speed limiting
- ✅ Custom key bindings

### Basic Usage

```javascript
import { WheelComponent } from './components/WheelComponent.js';

// Add to a cylinder GameObject
const wheel = GameObjectFactory.createCylinder({
  radiusTop: 1,
  radiusBottom: 1,
  height: 1.5
});

// Enable physics first
wheel.enablePhysics({
  shape: 'cylinder',
  mass: 1,
  friction: 0.7
});

// Add wheel component
wheel.addComponent(WheelComponent, {
  acceleration: 15,
  brakeForce: 10,
  maxSpeed: 20,
  turnSpeed: 2,
  radius: 1
});
```

### Vehicle Integration

The WheelComponent is designed for future car implementations:

```javascript
// Front wheel - powered and steerable
frontWheel.addComponent(WheelComponent, {
  isPowered: true,   // Can accelerate
  canSteer: true,    // Can turn
  acceleration: 20
});

// Rear wheel - powered only
rearWheel.addComponent(WheelComponent, {
  isPowered: true,   // Can accelerate
  canSteer: false,   // Fixed direction
  acceleration: 20
});

// Trailer wheel - passive
trailerWheel.addComponent(WheelComponent, {
  isPowered: false,  // No acceleration
  canSteer: false,   // Fixed direction
});
```

### Configuration Options

```javascript
{
  // Movement
  acceleration: 15,        // Forward torque
  brakeForce: 10,         // Braking strength
  maxSpeed: 20,           // Max angular velocity
  turnSpeed: 2,           // Steering speed
  
  // Wheel properties
  radius: 1,              // Wheel radius
  isGrounded: true,       // Is wheel touching ground?
  isPowered: true,        // Can accelerate?
  canSteer: true,         // Can turn?
  
  // Custom controls
  forwardKey: 'KeyW',
  backwardKey: 'KeyS',
  leftKey: 'KeyA',
  rightKey: 'KeyD',
  brakeKey: 'Space'
}
```

### Methods

```javascript
// Get speed
const speed = wheelComponent.getLinearSpeed();

// Apply external force
wheelComponent.applyImpulse({ x: 10, y: 0, z: 0 });

// Set ground contact
wheelComponent.setGrounded(true);

// Get forward direction
const forward = wheelComponent.getForwardDirection();
```

## 🏗️ Architecture

### Component Pattern
- **WheelComponent** - Handles physics-based rolling and steering
- **CameraFollowComponent** - Smooth camera tracking with lerp
- **ObstacleComponent** - Marks objects as obstacles and handles collisions
- **CollectibleComponent** - Animated collectibles with rotation and bobbing

### System Pattern
- **GameManager** - Central game state management
  - Score tracking
  - Health system
  - Dynamic spawning
  - Collision detection
  - UI updates

### Scene Pattern
- **RollingCylinderScene** - Composes all game elements
  - Ground and walls
  - Player setup
  - Camera configuration
  - Initial obstacles

## 🎨 Game Design

### Obstacle Types
1. **Red Cubes** - Static obstacles (10 damage)
2. **Red Spheres** - Rolling obstacles (10 damage)

### Collectibles
- **Yellow Spheres** - Worth 50 points each
- Animated with rotation and vertical bobbing

### Difficulty Progression
- Game speed increases by 10% every 10 seconds
- Spawn rates adapt to difficulty
- Score multiplier increases with speed

## 🚗 Future: Car Implementation

The WheelComponent is ready for vehicle implementation! Here's a preview:

```javascript
class CarController extends Component {
  constructor() {
    super();
    this.wheels = {
      frontLeft: null,
      frontRight: null,
      rearLeft: null,
      rearRight: null
    };
  }
  
  start() {
    // Get all wheel components
    this.wheels.frontLeft = this.entity.findChild('FrontLeftWheel')
      .getComponent(WheelComponent);
    // ... etc
  }
  
  update(deltaTime) {
    // Synchronize all wheels
    // Apply suspension
    // Handle weight distribution
  }
}
```

## 🐛 Troubleshooting

### Physics Issues
- **Ensure physics is enabled** in GameEngine: `physics: true`
- **Add entity to scene BEFORE enabling physics**
- **Use proper shapes** - cylinder works best for wheels
- **Toggle debug mode** (Press P) to visualize collision shapes

### Performance
- Obstacles are automatically cleaned up when behind player
- Collectibles are destroyed on collection
- Physics sleep optimization is enabled by default

## 🎓 Learning Points

This example demonstrates:
1. ✅ **Modular file organization** - Components/systems/scenes pattern
2. ✅ **Reusable components** - WheelComponent can be used in multiple games
3. ✅ **Real physics simulation** - Torque-based rolling mechanics
4. ✅ **Dynamic spawning** - Procedural obstacle generation
5. ✅ **Camera follow system** - Smooth tracking with lerp
6. ✅ **UI integration** - HUD updates from game state
7. ✅ **Game state management** - Central GameManager pattern

## 🚀 Running the Game

1. Make sure you're in the project root
2. Start a local server:
   ```bash
   npm run dev
   ```
3. Open browser to: `http://localhost:5173/examples/rolling-cylinder/`
4. Enjoy!

## 📝 Code Quality

- ✅ Clean separation of concerns
- ✅ Component-based architecture
- ✅ Reusable, configurable components
- ✅ Documented with JSDoc comments
- ✅ Event-driven communication
- ✅ No circular dependencies

## 🎮 Gameplay Tips

1. **Avoid obstacles** - They damage your health!
2. **Collect yellow spheres** - They boost your score
3. **Use brakes** - Space bar helps with tight maneuvers
4. **Watch your speed** - Too fast = harder to steer
5. **Stay centered** - Walls will bounce you around

---

Built with ❤️ using **OpenWorld3D** engine

