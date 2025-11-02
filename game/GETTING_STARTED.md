# Getting Started Guide

## Installation

1. **Install Dependencies**
```bash
cd game
npm install
```

2. **Run Examples**

Basic single-player example:
```bash
cd examples/basic
npm run dev
```

Multiplayer example:
```bash
cd examples/multiplayer
npm run dev
```

## Your First Game - Step by Step

### 1. Create HTML File

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>My Game</title>
  <style>
    body { margin: 0; overflow: hidden; }
    #game-canvas { width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="game-canvas"></canvas>
  <script type="module" src="./game.js"></script>
</body>
</html>
```

### 2. Create Your Game Scene

```javascript
// game.js
import * as THREE from 'three';
import { GameEngine, Scene, Actor, ThirdPersonCamera } from './src/index.js';

class MyGameScene extends Scene {
  constructor(engine) {
    super(engine);
    this.player = null;
  }

  async load() {
    // Create ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({ color: 0x00aa00 })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.add(ground);

    // Create player
    const playerMesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0x0066ff })
    );
    playerMesh.castShadow = true;

    this.player = new Actor({ name: 'Player', speed: 5 });
    this.player.mesh = playerMesh;
    this.player.setPosition(0, 1, 0);
    this.addEntity(this.player);

    // Setup camera
    const camera = this.engine.cameraManager.getActiveCamera();
    this.cameraController = new ThirdPersonCamera(camera, this.player);
    this.cameraController.setInputManager(this.engine.inputManager);

    // Setup input
    const input = this.engine.inputManager;
    input.bindAction('forward', ['KeyW']);
    input.bindAction('backward', ['KeyS']);
    input.bindAction('left', ['KeyA']);
    input.bindAction('right', ['KeyD']);
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Update player movement
    const input = this.engine.inputManager;
    const moveDir = new THREE.Vector3();

    if (input.isActionDown('forward')) moveDir.z -= 1;
    if (input.isActionDown('backward')) moveDir.z += 1;
    if (input.isActionDown('left')) moveDir.x -= 1;
    if (input.isActionDown('right')) moveDir.x += 1;

    if (moveDir.lengthSq() > 0) {
      this.player.move(moveDir.normalize(), deltaTime);
    } else {
      this.player.stop();
    }

    // Update camera
    this.cameraController.update(deltaTime);
  }
}

// Initialize game
const engine = new GameEngine({
  canvas: document.querySelector('#game-canvas')
});

engine.loadScene(MyGameScene);
engine.start();
```

### 3. Run Your Game

```bash
npm run dev
```

## Adding Multiplayer

### 1. Enable Networking

```javascript
const engine = new GameEngine({
  canvas: document.querySelector('#game-canvas'),
  networking: true,
  networkConfig: {
    url: 'http://localhost:3000',
    autoConnect: true
  }
});
```

### 2. Setup Network Events

```javascript
class MultiplayerScene extends Scene {
  constructor(engine) {
    super(engine);
    this.remotePlayers = new Map();
  }

  async load() {
    // ... create world ...

    // Setup networking
    const network = this.engine.networkManager;

    network.on('connected', () => {
      console.log('Connected to server');
      network.authenticate('your-token');
    });

    network.on('playerJoined', (data) => {
      this.spawnRemotePlayer(data.player);
    });

    network.on('playerLeft', (data) => {
      this.removeRemotePlayer(data.playerId);
    });

    network.on('playerUpdated', (data) => {
      const player = this.remotePlayers.get(data.playerId);
      if (player) player.deserialize(data.state);
    });

    // Join a room
    network.joinRoom('room-123');
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Send player state
    if (this.engine.networkManager.isInRoom()) {
      this.engine.networkManager.send('player:update', {
        state: this.player.serialize()
      });
    }
  }

  spawnRemotePlayer(playerData) {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 2, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );

    const player = new Actor({
      networkId: playerData.id,
      isNetworked: true
    });
    player.mesh = mesh;
    
    this.addEntity(player);
    this.remotePlayers.set(playerData.id, player);
  }

  removeRemotePlayer(playerId) {
    const player = this.remotePlayers.get(playerId);
    if (player) {
      this.removeEntity(player);
      this.remotePlayers.delete(playerId);
    }
  }
}
```

## Loading Assets

### Load 3D Models

```javascript
async load() {
  // Load assets
  await this.engine.assetManager.loadModel(
    'character', 
    '/models/character.glb',
    { castShadow: true, receiveShadow: true }
  );

  await this.engine.assetManager.loadTexture(
    'ground',
    '/textures/ground.jpg',
    { repeat: { x: 10, y: 10 } }
  );

  // Use loaded model
  const modelData = this.engine.assetManager.cloneModel('character');
  this.player.mesh = modelData.scene;
  
  // Setup animations if available
  if (modelData.animations.length > 0) {
    this.mixer = new THREE.AnimationMixer(modelData.scene);
    const action = this.mixer.clipAction(modelData.animations[0]);
    action.play();
  }
}

update(deltaTime) {
  if (this.mixer) {
    this.mixer.update(deltaTime);
  }
}
```

### Show Loading Screen

```javascript
import { LoadingScreen } from './src/assets/LoadingScreen.js';

async function initGame() {
  const loadingScreen = new LoadingScreen({
    title: 'My Game',
    tips: [
      'Press WASD to move',
      'Right click to rotate camera',
      'Have fun!'
    ]
  });

  loadingScreen.show();

  const engine = new GameEngine({ /* ... */ });

  // Track loading progress
  engine.assetManager.on('loadProgress', ({ progress, url }) => {
    loadingScreen.setProgress(progress, `Loading ${url}...`);
  });

  // Load scene with assets
  await engine.loadScene(MyGameScene);

  // Start game
  engine.start();

  // Hide loading screen
  await loadingScreen.hide();
}
```

## Using Components

### Create Custom Component

```javascript
import { Component } from './src/entities/Component.js';

class HealthComponent extends Component {
  constructor(maxHealth) {
    super();
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    
    if (this.health === 0) {
      this.emit('died');
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  getHealthPercent() {
    return this.health / this.maxHealth;
  }
}
```

### Attach to Entity

```javascript
const player = new Actor({ name: 'Player' });

// Add component
const health = new HealthComponent(100);
player.addComponent(health);

// Listen to component events
health.on('died', () => {
  console.log('Player died!');
});

// Use component
health.takeDamage(25);
console.log('Health:', health.getHealthPercent() * 100 + '%');
```

## Room Management

### Create Room

```javascript
import { RoomManager } from './src/network/RoomManager.js';

const roomManager = new RoomManager(engine.networkManager);

const room = await roomManager.createRoom({
  name: 'My Game Room',
  maxPlayers: 10,
  isPrivate: false,
  gameMode: 'deathmatch',
  map: 'forest'
});

console.log('Room created:', room.id);
```

### Join Room

```javascript
// Join by ID
await roomManager.joinRoom('room-123');

// Quick match (find or create)
await roomManager.quickMatch({
  gameMode: 'deathmatch'
});

// List rooms
const rooms = await roomManager.listRooms({
  gameMode: 'deathmatch',
  hasSpace: true
});
```

### Handle Room Events

```javascript
roomManager.on('joined', ({ room }) => {
  console.log('Joined room:', room.name);
});

roomManager.on('playerJoined', ({ player }) => {
  console.log('Player joined:', player.name);
});

roomManager.on('playerLeft', ({ playerId }) => {
  console.log('Player left:', playerId);
});
```

## Common Patterns

### Scene Transition

```javascript
// From one scene to another
await engine.loadScene(NewScene, { 
  levelId: 2,
  difficulty: 'hard'
});

// In the new scene
class NewScene extends Scene {
  onEnter(data) {
    console.log('Level:', data.levelId);
    console.log('Difficulty:', data.difficulty);
  }
}
```

### Entity Pooling

```javascript
class BulletPool {
  constructor(scene) {
    this.scene = scene;
    this.pool = [];
  }

  get() {
    let bullet = this.pool.pop();
    
    if (!bullet) {
      bullet = this.createBullet();
    }
    
    bullet.setActive(true);
    return bullet;
  }

  return(bullet) {
    bullet.setActive(false);
    this.pool.push(bullet);
  }

  createBullet() {
    const bullet = new Entity({ type: 'bullet' });
    // ... setup bullet ...
    this.scene.addEntity(bullet);
    return bullet;
  }
}
```

### Input Actions

```javascript
const input = engine.inputManager;

// Bind multiple keys to same action
input.bindAction('jump', ['Space', 'KeyW']);
input.bindAction('shoot', ['Mouse0', 'KeyF']);

// Check in update
if (input.isActionPressed('jump')) {
  player.jump();
}

if (input.isActionDown('shoot')) {
  player.shoot();
}

// Listen to actions
input.on('actionPressed', ({ action, key }) => {
  console.log(`Action ${action} pressed with ${key}`);
});
```

## Debugging Tips

### Enable Stats Display

```javascript
// Add to your HTML
<div id="stats">
  FPS: <span id="fps">0</span><br>
  Entities: <span id="entities">0</span><br>
  Draw Calls: <span id="drawcalls">0</span>
</div>

// Update in scene
update(deltaTime) {
  document.getElementById('fps').textContent = 
    Math.round(this.engine.stats.fps);
  document.getElementById('entities').textContent = 
    this.entities.size;
  document.getElementById('drawcalls').textContent = 
    this.engine.stats.drawCalls;
}
```

### Log Network Events

```javascript
const network = engine.networkManager;

// Log all events
network.onAny((event, ...args) => {
  console.log('Network event:', event, args);
});

// Monitor latency
network.on('latencyUpdate', ({ latency }) => {
  console.log('Latency:', latency, 'ms');
});
```

### Scene Debugging

```javascript
class DebugScene extends Scene {
  update(deltaTime) {
    super.update(deltaTime);

    // Log entity count
    if (this.engine.time.frame % 60 === 0) {
      console.log('Entities:', this.entities.size);
      
      // Log entity positions
      this.entities.forEach(entity => {
        console.log(entity.name, entity.position);
      });
    }
  }
}
```

## Next Steps

1. Check out the examples in `/examples/`
2. Read the full API documentation in `README.md`
3. Study the architecture in `ARCHITECTURE.md`
4. Integrate with your Node.js backend
5. Build your game!

## Common Issues

**Q: Models not loading?**
A: Check the file path and make sure the server is serving static files.

**Q: Network not connecting?**
A: Verify your backend server is running and the URL is correct.

**Q: Poor performance?**
A: Use entity pooling, reduce draw calls, optimize textures.

**Q: Camera controls not working?**
A: Make sure you called `cameraController.setInputManager()`.

## Getting Help

- Check the examples for working code
- Review the architecture documentation
- Look at the API reference in README.md
- Ensure your backend implements required events

Happy game development! 🎮

