# Endless Runner - Project Architecture

## Overview
This is a Subway Surfers-style endless runner game built using the GameObject-Component architecture pattern.

## Directory Structure

```
endless-runner/
├── components/           # Reusable game components
│   ├── PlayerController.js       # Player movement, jumping, lane switching
│   ├── CameraFollowComponent.js  # Camera following logic
│   ├── CollisionDetector.js      # Collision detection with obstacles/coins
│   └── RotateComponent.js        # Simple rotation animation
│
├── systems/             # Game systems
│   ├── TrackGenerator.js         # Procedural track generation
│   └── GameManager.js            # Game state, score, UI management
│
├── scenes/              # Game scenes
│   └── EndlessRunnerScene.js     # Main game scene setup
│
├── main.js              # Entry point - initializes engine
├── index.html           # HTML page and UI
└── README.md            # Game documentation

```

## Architecture Principles

### Component-Based Design
Each piece of functionality is isolated into its own component:
- **Components** are reusable behaviors attached to GameObjects
- **Systems** are components that manage game-wide state
- **Scenes** compose GameObjects and components together

### Separation of Concerns
- **PlayerController**: Only handles player input and movement
- **CollisionDetector**: Only handles collision detection
- **TrackGenerator**: Only handles procedural generation
- **GameManager**: Only handles game state and scoring
- **CameraFollowComponent**: Only handles camera positioning

## How It Works

### 1. Game Initialization (main.js)
```javascript
const engine = new GameEngine({ physics: false });
engine.loadScene(EndlessRunnerScene);
```

### 2. Scene Setup (EndlessRunnerScene.js)
- Creates the player GameObject
- Creates a GameManager GameObject
- Attaches all necessary components

### 3. Component Communication
Components communicate via:
- **Events**: `this.emit('died')` / `component.on('died', callback)`
- **Scene queries**: `scene.findWithTag('player')`
- **Direct references**: `player.getComponent(PlayerController)`

### 4. Game Loop
Each frame:
1. **Input** → PlayerController reads keyboard input
2. **Movement** → GameManager moves player forward
3. **Generation** → TrackGenerator spawns new segments
4. **Collision** → CollisionDetector checks for hits
5. **Camera** → CameraFollowComponent updates view
6. **UI** → GameManager updates score display

## Key Components

### PlayerController
- Handles 3-lane movement (left/center/right)
- Jump physics with gravity
- Player death state

### TrackGenerator
- Procedurally generates ground, walls, obstacles, and coins
- Removes old segments to save memory
- Spawns obstacles and coins randomly

### CollisionDetector
- Checks distance between player and obstacles/coins
- Emits events on collision or collection

### GameManager
- Tracks score and distance
- Gradually increases game speed
- Handles game over state

### CameraFollowComponent
- Follows player with smooth interpolation
- Looks ahead on the track for better visibility

## Benefits of This Architecture

✅ **Modularity**: Each file has a single responsibility
✅ **Reusability**: Components can be used in other games
✅ **Testability**: Components can be tested independently
✅ **Maintainability**: Easy to find and modify specific features
✅ **Scalability**: Easy to add new components and systems
✅ **Clean Code**: No single massive file

## Adding New Features

### To add a new component:
1. Create `components/YourComponent.js`
2. Export the class
3. Import and attach it to a GameObject in the scene

### To add a new system:
1. Create `systems/YourSystem.js`
2. Export the class
3. Attach it to the GameManager or a new GameObject

### To modify game behavior:
1. Find the relevant component file
2. Modify only that component
3. No need to touch other files

## Example: Adding a Power-Up System

```javascript
// 1. Create components/PowerUpComponent.js
export class PowerUpComponent extends Component {
  activate() {
    // Power-up logic
  }
}

// 2. Modify TrackGenerator to spawn power-ups
spawnPowerUp(z) {
  const powerUp = GameObjectFactory.createSphere({ ... });
  powerUp.addComponent(PowerUpComponent);
  powerUp.addTag('powerup');
}

// 3. Modify CollisionDetector to detect power-ups
const powerUps = scene.findGameObjectsWithTag('powerup');
// Check collision and emit event
```

No need to modify PlayerController, CameraFollow, or any other unrelated component!

## Performance Considerations

- **Object Pooling**: Old segments are removed to prevent memory leaks
- **Distance Culling**: Only checks collisions with nearby objects
- **Efficient Queries**: Uses tags for quick GameObject lookups
- **Minimal Updates**: Components only update when necessary

## Future Improvements

Possible enhancements:
- Add object pooling for segments
- Add different obstacle types
- Add power-ups (shield, magnet, speed boost)
- Add multiple track themes
- Add particle effects
- Add sound effects
- Save high scores to localStorage

