# 🏃 Endless Runner - Subway Surfers Style

An endless runner game with procedural generation, inspired by Subway Surfers!

## Features

- **Procedural Track Generation** - Infinite track with walls and obstacles
- **Lane-Based Movement** - Move between 3 lanes (left, center, right)
- **Jump Mechanic** - Jump over obstacles
- **Obstacle Avoidance** - Red boxes to dodge
- **Coin Collection** - Collect spinning gold coins
- **Dynamic Camera** - Smooth follow camera
- **Score System** - Points for distance and coins
- **Increasing Difficulty** - Speed gradually increases

## Controls

- **← →** (Arrow Keys) - Move left/right between lanes
- **Space** - Jump

## How It Works

### GameObject-Component Architecture

The game uses the engine's GameObject system with custom components:

**1. PlayerController**
- Handles lane switching (3 lanes)
- Jump physics with gravity
- Death state management

**2. TrackGenerator**
- Procedurally generates track segments
- Spawns obstacles randomly (30% chance)
- Spawns coins randomly (50% chance)
- Removes old segments for performance

**3. CameraFollowComponent**
- Smooth camera following
- Dynamic look-at positioning

**4. CollisionDetector**
- Checks distance-based collision with obstacles
- Handles coin collection
- Emits events for game manager

**5. GameManager**
- Controls game flow
- Updates score and distance
- Increases speed over time
- Handles game over state

### Procedural Generation

```javascript
generateSegment() {
  // 1. Create ground plane
  // 2. Add side walls
  // 3. Randomly spawn obstacles (30%)
  // 4. Randomly spawn coins (50%)
  // 5. Clean up old segments
}
```

Track generates ahead of player and removes segments behind.

### Lane System

Three lanes at x positions:
- **Lane 0** (Left): x = -3
- **Lane 1** (Center): x = 0
- **Lane 2** (Right): x = 3

Smooth interpolation between lane switches.

### Collision Detection

Simple distance-based collision:
```javascript
const distance = player.position.distanceTo(obstacle.position);
if (distance < radius) {
  // Collision!
}
```

## Code Structure

```
main.js
├── PlayerController Component
├── TrackGenerator Component
├── CameraFollowComponent
├── CollisionDetector Component
├── GameManager Component
├── RotateComponent (for coins)
└── EndlessRunnerScene
```

## Key Techniques

### 1. Procedural Generation
```javascript
// Generate track segments as player moves
if (player.position.z < this.generatedZ - 50) {
  this.generateSegment();
}
```

### 2. Lane Switching
```javascript
// Smooth transition to target lane
const diff = this.targetX - this.entity.position.x;
this.entity.position.x += diff * this.moveSpeed;
```

### 3. Jump Physics
```javascript
// Apply gravity
this.jumpSpeed += this.gravity * deltaTime;
this.entity.position.y += this.jumpSpeed * deltaTime;
```

### 4. Increasing Difficulty
```javascript
// Gradually increase speed
this.gameSpeed += 0.001;
```

## Customization

Easy to customize:

```javascript
// In PlayerController
this.laneWidth = 3;      // Distance between lanes
this.jumpForce = 12;     // Jump height

// In TrackGenerator
this.segmentLength = 10; // Track segment size
this.trackWidth = 9;     // Total track width

// In GameManager
this.gameSpeed = 10;     // Initial speed
```

## Extending the Game

### Add Power-ups
```javascript
class PowerUpComponent extends Component {
  constructor(config = {}) {
    super();
    this.type = config.type; // 'shield', 'magnet', 'double-score'
    this.duration = config.duration || 10;
  }
}
```

### Add Different Obstacles
```javascript
spawnBarrier(z) {
  // Low barrier - must jump
}

spawnTunnel(z) {
  // Must slide under (add slide mechanic)
}
```

### Add Visual Effects
```javascript
class ParticleEffect extends Component {
  // Coin collection sparkles
  // Jump dust clouds
  // Collision effects
}
```

## Performance

- **Dynamic segment cleanup** - Old segments removed
- **Distance-based generation** - Only generate what's needed
- **Simple collision** - Distance checks instead of physics
- **Object pooling** - Can be added for coins/obstacles

## How to Run

```bash
npm run dev
```

Then open: http://localhost:5173/examples/endless-runner/

## Technologies Used

- **OpenWorld3D Engine** - GameObject-Component system
- **Three.js** - 3D rendering
- **Procedural Generation** - Dynamic content creation
- **Component Architecture** - Modular, reusable code

## Learning Points

This example demonstrates:
- ✅ Procedural generation techniques
- ✅ GameObject-Component architecture
- ✅ Event-driven communication
- ✅ Camera follow systems
- ✅ Simple physics without physics engine
- ✅ Game state management
- ✅ Score and UI systems

Perfect for learning how to build endless runner games! 🎮

