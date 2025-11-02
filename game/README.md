# Three.js Multiplayer Game Engine

A comprehensive, modular game engine built on Three.js for creating multiplayer 3D games with scene management, entity system, networking, and more.

## Features

### Core Systems
- **Game Engine**: Main game loop, update cycles, and system orchestration
- **Time Management**: Delta time, fixed timestep, time scaling
- **Scene Management**: Multiple scenes, scene transitions, preloading
- **Entity System**: Component-based entity architecture
- **Actor System**: Character controllers with movement, health, and combat

### Networking
- **Network Manager**: Socket.io integration for multiplayer
- **Room System**: Create, join, and manage game rooms
- **Entity Synchronization**: Automatic network entity state sync
- **Matchmaking**: Quick match and room browsing

### Assets & Loading
- **Asset Manager**: Load and cache textures, models, audio
- **GLTF/FBX Support**: 3D model loading with animations
- **Loading Screen**: Customizable loading UI with progress
- **Resource Management**: Memory-efficient asset caching

### Input & Controls
- **Input Manager**: Unified keyboard, mouse, touch handling
- **Action Bindings**: Map keys to game actions
- **Pointer Lock**: FPS-style mouse control

### Camera System
- **Camera Manager**: Multiple camera support
- **Third Person Camera**: Smooth follow camera with zoom/rotate
- **Camera Controllers**: Extensible camera control system

## Installation

```bash
npm install
```

## Quick Start

### Basic Single-Player Game

```javascript
import { GameEngine, Scene, Actor } from './src/index.js';

class MyGameScene extends Scene {
  async load() {
    // Create your game world
    const player = new Actor({ name: 'Player' });
    this.addEntity(player);
  }

  update(deltaTime) {
    super.update(deltaTime);
    // Game logic here
  }
}

const engine = new GameEngine({
  canvas: document.querySelector('#game-canvas')
});

engine.loadScene(MyGameScene);
engine.start();
```

### Multiplayer Game

```javascript
const engine = new GameEngine({
  canvas: document.querySelector('#game-canvas'),
  networking: true,
  networkConfig: {
    url: 'http://localhost:3000',
    autoConnect: true
  }
});

// Use NetworkManager for multiplayer features
engine.networkManager.on('connected', () => {
  console.log('Connected to server');
});

engine.networkManager.joinRoom('room-id');
```

## Architecture Overview

### Core Components

#### GameEngine
The main engine class that orchestrates all systems:
- Renderer setup and configuration
- System initialization and updates
- Game loop management
- Event coordination

#### Scene
Base class for all game scenes:
- Entity management
- Lighting setup
- Scene lifecycle (load, enter, exit)
- Update loop per scene

#### Entity & Actor
Entity system with component architecture:
- Transform, position, rotation, scale
- Component system for modular functionality
- Network synchronization
- Actor extends Entity with movement, health, combat

### Networking Architecture

```
Client (GameEngine)
  ↓
NetworkManager (Socket.io Client)
  ↓
RoomManager (Room logic)
  ↓
Server (Your Node.js Backend)
```

The engine integrates with your existing Node.js socket.io backend. Configure the connection URL in engine initialization.

### File Structure

```
game/
├── src/
│   ├── core/
│   │   ├── GameEngine.js       # Main engine
│   │   └── Time.js             # Time management
│   ├── scenes/
│   │   ├── Scene.js            # Base scene class
│   │   ├── SceneManager.js     # Scene transitions
│   │   └── LoadingScene.js     # Loading screen scene
│   ├── entities/
│   │   ├── Entity.js           # Base entity
│   │   ├── Actor.js            # Actor with movement
│   │   └── Component.js        # Base component
│   ├── network/
│   │   ├── NetworkManager.js   # Socket.io client
│   │   └── RoomManager.js      # Room management
│   ├── assets/
│   │   ├── AssetManager.js     # Asset loading
│   │   └── LoadingScreen.js    # Loading UI
│   ├── input/
│   │   └── InputManager.js     # Input handling
│   ├── camera/
│   │   ├── CameraManager.js    # Camera management
│   │   └── ThirdPersonCamera.js # 3rd person controller
│   └── index.js                # Main exports
├── examples/
│   ├── basic/                  # Single-player example
│   └── multiplayer/            # Multiplayer example
└── package.json
```

## Examples

### Run Basic Example
```bash
cd examples/basic
npm run dev
```

### Run Multiplayer Example
```bash
cd examples/multiplayer
npm run dev
```

Make sure your Node.js backend server is running on `http://localhost:3000`

## API Reference

### GameEngine

```javascript
const engine = new GameEngine({
  canvas: HTMLCanvasElement,
  antialias: true,
  shadowMapEnabled: true,
  networking: false,
  networkConfig: {}
});

engine.start();              // Start game loop
engine.stop();               // Stop game loop
engine.pause();              // Pause game
engine.resume();             // Resume game
engine.loadScene(SceneClass); // Load a scene
```

### Scene

```javascript
class MyScene extends Scene {
  async initialize() {}  // Setup scene
  async load() {}        // Load assets
  onEnter(data) {}       // Scene activated
  onExit() {}            // Scene deactivated
  update(delta, time) {} // Update loop
}
```

### Entity & Actor

```javascript
const actor = new Actor({
  name: 'Player',
  speed: 5,
  health: 100
});

actor.setPosition(x, y, z);
actor.move(direction, deltaTime);
actor.takeDamage(amount);
actor.heal(amount);
```

### NetworkManager

```javascript
const network = engine.networkManager;

network.connect();
network.authenticate(token);
network.joinRoom(roomId);
network.send('event', data);

network.on('connected', () => {});
network.on('playerJoined', (data) => {});
```

### AssetManager

```javascript
const assets = engine.assetManager;

await assets.loadModel('character', '/models/character.glb');
await assets.loadTexture('ground', '/textures/ground.jpg');

const model = assets.getModel('character');
const clone = assets.cloneModel('character');
```

### InputManager

```javascript
const input = engine.inputManager;

input.bindAction('jump', ['Space', 'KeyW']);

if (input.isActionDown('jump')) {
  // Handle jump
}

input.on('keyPressed', ({ key }) => {});
```

## Integration with Existing Backend

This engine is designed to work with your existing Node.js socket.io backend. Here's how to integrate:

### Server-Side Events (Your Backend)

```javascript
// Socket.io server events to implement
io.on('connection', (socket) => {
  
  // Authentication
  socket.on('auth:login', (data) => {
    // Validate token
    socket.emit('auth:success', { playerId: '123' });
  });

  // Room management
  socket.on('room:create', (data) => {
    // Create room logic
  });

  socket.on('room:join', (data) => {
    // Join room logic
  });

  // Player state sync
  socket.on('player:update', (data) => {
    // Broadcast to room
    socket.to(roomId).emit('player:update', data);
  });

  // Custom game events
  socket.on('game:action', (data) => {
    // Handle game-specific actions
  });
});
```

### Client-Side Integration

```javascript
const engine = new GameEngine({
  networking: true,
  networkConfig: {
    url: 'http://your-server-url:3000',
    autoConnect: true
  }
});

// Access network manager
const network = engine.networkManager;

// Listen to custom events from your backend
network.on('custom:event', (data) => {
  console.log('Custom event received:', data);
});

// Send custom events to your backend
network.send('custom:action', { data: 'value' });
```

## Advanced Features

### Custom Components

```javascript
import { Component } from './src/entities/Component.js';

class HealthComponent extends Component {
  constructor(maxHealth) {
    super();
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  update(deltaTime) {
    // Component logic
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
  }
}

// Attach to entity
const entity = new Entity();
entity.addComponent(new HealthComponent(100));
```

### Scene Transitions

```javascript
// Load scene with data
await engine.loadScene(GameScene, { level: 1, difficulty: 'hard' });

// In scene
class GameScene extends Scene {
  onEnter(data) {
    console.log('Level:', data.level);
  }
}
```

### Loading Screen with Progress

```javascript
import { LoadingScreen } from './src/assets/LoadingScreen.js';

const loadingScreen = new LoadingScreen({
  title: 'My Game',
  tips: ['Tip 1', 'Tip 2', 'Tip 3']
});

loadingScreen.show();

// Update progress during asset loading
engine.assetManager.on('loadProgress', ({ progress }) => {
  loadingScreen.setProgress(progress);
});
```

## Performance Tips

1. **Entity Pooling**: Reuse entities instead of creating/destroying
2. **Asset Caching**: Load assets once, clone for instances
3. **Network Throttling**: Limit network updates (e.g., 20/sec)
4. **LOD**: Use level-of-detail for distant objects
5. **Frustum Culling**: Three.js handles this automatically

## Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (iOS 15+)
- Mobile: Touch controls supported

## License

MIT

## Contributing

Contributions welcome! This engine is designed to be extended and customized for your specific game needs.

