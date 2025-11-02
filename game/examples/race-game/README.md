# Race Game - OpenWorld3D Example

A simple racing game demonstrating the OpenWorld3D engine's GameObject-Component architecture.

## Features

- 🏎️ **Car Physics** - Realistic acceleration, braking, and turning
- 🏁 **Checkpoint System** - 5 checkpoints to complete the race
- 🚧 **Obstacles** - Avoid obstacles that slow you down
- ⏱️ **Time Tracking** - Beat your best time
- 📹 **Smooth Camera** - Dynamic camera that follows the car
- 🎮 **Responsive Controls** - WASD or Arrow Keys

## How to Play

1. Open `index.html` in a web browser
2. Press **W** or **↑** to start the race
3. Navigate through all 5 checkpoints (yellow arches)
4. Reach the finish line (green arch) as fast as possible
5. Press **R** to restart and try to beat your time

## Controls

| Key | Action |
|-----|--------|
| W / ↑ | Accelerate |
| S / ↓ | Brake/Reverse |
| A / ← | Turn Left |
| D / → | Turn Right |
| R | Restart Race |

## Architecture

This game follows the modular architecture pattern recommended by OpenWorld3D:

```
race-game/
├── components/
│   ├── CarController.js           - Car movement and physics
│   ├── CameraFollowComponent.js   - Smooth camera following
│   ├── CheckpointComponent.js     - Checkpoint detection
│   └── ObstacleComponent.js       - Obstacle collision
├── systems/
│   └── GameManager.js             - Race state and UI management
├── scenes/
│   └── RaceScene.js               - Main race scene setup
├── main.js                        - Entry point
├── index.html                     - Game UI
└── README.md                      - This file
```

## Technical Details

### Components

**CarController** - Handles car movement with:
- Acceleration and braking
- Realistic turning (only when moving)
- Speed limiting
- Drag/friction simulation

**CameraFollowComponent** - Provides:
- Smooth camera interpolation
- Dynamic positioning behind car
- Look-ahead targeting
- Rotation-aware offset

**CheckpointComponent** - Features:
- Radius-based detection
- Sequential checkpoint validation
- Visual feedback (color change)
- Event emission for game manager

**ObstacleComponent** - Implements:
- Collision detection
- Speed reduction on hit
- Push-back physics

### Systems

**GameManager** - Manages:
- Race state (not started, active, finished)
- Timer and lap timing
- Checkpoint progression
- Best time tracking (localStorage)
- UI updates
- Race restart

### Scene

**RaceScene** - Contains:
- Oval track with markings
- 5 checkpoints (4 + finish line)
- 6 obstacles strategically placed
- Track boundaries (invisible walls)
- Lighting setup
- Ground and grass

## Gameplay Tips

1. **Momentum is Key** - Keep your speed up through turns
2. **Avoid Obstacles** - They significantly slow you down
3. **Cut Corners** - Take the racing line through checkpoints
4. **Learn the Track** - The checkpoint order is fixed
5. **Practice** - Your best time is saved locally

## Extending the Game

Want to add more features? Here are some ideas:

### Easy Additions
- More checkpoints
- Different obstacle types
- Particle effects (dust, sparks)
- Sound effects and music
- Multiple laps

### Medium Difficulty
- Opponent AI cars
- Power-ups (speed boost, shield)
- Different track layouts
- Car customization
- Multiple camera modes

### Advanced Features
- Physics-based collisions
- Tire marks/skid effects
- Weather effects
- Multiplayer racing
- Track editor

## Code Examples

### Creating a Custom Obstacle

```javascript
// In components/SpinningObstacle.js
export class SpinningObstacle extends Component {
  update(deltaTime) {
    this.entity.rotation.y += deltaTime * 2;
    // Add your collision logic here
  }
}
```

### Adding a New Checkpoint

```javascript
// In RaceScene.js, in createCheckpoints()
const newCheckpoint = this.createCheckpoint(x, z, nextIndex);
this.addEntity(newCheckpoint);
```

### Customizing Car Behavior

```javascript
// In main.js or when creating the player
player.addComponent(CarController, { 
  maxSpeed: 30,        // Increase max speed
  acceleration: 20,    // Faster acceleration
  turnSpeed: 4,        // Sharper turns
  drag: 0.98          // Less friction
});
```

## Performance

- **Lightweight** - No physics engine needed
- **Efficient** - Simple collision detection
- **Smooth** - Runs at 60 FPS on most devices

## Browser Compatibility

- ✅ Chrome/Edge (recommended)
- ✅ Firefox
- ✅ Safari
- ⚠️ Mobile browsers (limited - keyboard required)

## Credits

Built with **OpenWorld3D** - A Unity-inspired 3D game engine

## License

This example is part of the OpenWorld3D project.

