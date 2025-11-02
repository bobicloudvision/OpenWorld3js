# Game Engine Architecture

## Overview

This Three.js multiplayer game engine is designed with modularity, scalability, and extensibility in mind. It follows modern game engine patterns and supports both single-player and multiplayer games similar in scope to MMORPGs like World of Warcraft.

## Core Architecture Principles

### 1. Component-Based Entity System
Entities are composed of reusable components, allowing flexible game object creation without deep inheritance hierarchies.

### 2. Event-Driven Communication
All major systems emit events, enabling loose coupling and easy extension without modifying core code.

### 3. Scene-Based Organization
Games are organized into scenes (menus, levels, etc.), each managing its own entities and lifecycle.

### 4. Network Transparency
Network synchronization is handled automatically for networked entities, with manual control available when needed.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         GameEngine                          │
│  (Main orchestrator - manages all subsystems)               │
└──────────────┬──────────────────────────────────────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌──────────┐      ┌──────────┐
│   Time   │      │ Renderer │
│ Manager  │      │ (Three)  │
└──────────┘      └──────────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│                    System Managers                           │
├─────────────┬─────────────┬─────────────┬─────────────┬─────┤
│   Scene     │    Input    │   Camera    │   Asset     │Net  │
│  Manager    │   Manager   │   Manager   │  Manager    │work │
└─────────────┴─────────────┴─────────────┴─────────────┴─────┘
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│                      Active Scene                            │
│  ┌────────────────────────────────────────────────────┐    │
│  │              Entity Collection                      │    │
│  │  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐          │    │
│  │  │Entity│  │Entity│  │Entity│  │ ...  │          │    │
│  │  └───┬──┘  └───┬──┘  └───┬──┘  └──────┘          │    │
│  │      │         │         │                         │    │
│  │      ▼         ▼         ▼                         │    │
│  │  Components Components Components                  │    │
│  └────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

## Core Systems

### GameEngine

**Responsibilities:**
- Initialize and coordinate all subsystems
- Run the main game loop
- Manage renderer
- Handle window resize
- Provide system access to scenes

**Key Methods:**
```javascript
start()          // Start game loop
stop()           // Stop game loop
pause()          // Pause game
resume()         // Resume game
loadScene()      // Load and switch scenes
```

**Update Flow:**
1. Update Time
2. Update Input
3. Update Network
4. Update Scene (entities)
5. Update Camera
6. Render

### Scene Management

**SceneManager**
- Manages scene lifecycle and transitions
- Handles scene registration
- Prevents concurrent transitions
- Manages scene disposal

**Scene**
- Base class for all game scenes
- Manages entities within the scene
- Controls scene-specific lighting and environment
- Handles scene enter/exit logic

**Scene Lifecycle:**
```
Register → Initialize → Load → Enter → [Active/Update] → Exit → Dispose
```

### Entity System

**Entity**
- Base class for all game objects
- Provides transform (position, rotation, scale)
- Component management
- Network serialization support
- Tag system for querying

**Actor (extends Entity)**
- Specialized for characters/NPCs
- Movement and velocity
- Health and combat
- Animation integration
- AI-ready structure

**Component**
- Modular functionality for entities
- Update lifecycle integration
- Event-based communication

**Component Examples:**
```javascript
// Health Component
class HealthComponent extends Component {
  update(deltaTime) { /* regeneration */ }
  takeDamage(amount) { /* damage logic */ }
}

// AI Component
class AIComponent extends Component {
  update(deltaTime) { /* AI behavior */ }
}

// Animation Component
class AnimationComponent extends Component {
  play(name) { /* animation control */ }
}
```

### Network System

**NetworkManager**
- Socket.io client wrapper
- Connection management
- Event routing
- Entity synchronization
- Latency tracking

**RoomManager**
- High-level room operations
- Matchmaking
- Room creation/joining
- Player management

**Network Flow:**
```
Client Action → NetworkManager.send() → Socket.io → Server
Server Event → Socket.io → NetworkManager.on() → Game Logic
```

**Entity Synchronization:**
```javascript
// Register entity for network sync
network.registerNetworkEntity(entity);

// Automatic serialization/deserialization
entity.serialize()    // → Server
entity.deserialize()  // ← Server
```

**Network Events:**
- `connected` / `disconnected`
- `authenticated` / `authenticationFailed`
- `roomJoined` / `roomLeft`
- `playerJoined` / `playerLeft`
- `entitySpawned` / `entityUpdated` / `entityDestroyed`
- Custom game events (pass-through)

### Asset Management

**AssetManager**
- Centralized asset loading
- Caching and memory management
- Progress tracking
- Support for:
  - GLTF/GLB models
  - FBX models
  - Textures (with cube maps)
  - Audio
  - Materials

**Loading Strategy:**
```javascript
// Batch loading
await assetManager.loadBatch([
  { type: 'model', name: 'player', url: '/models/player.glb' },
  { type: 'texture', name: 'ground', url: '/textures/ground.jpg' }
]);

// Clone for instancing
const instance = assetManager.cloneModel('player');
```

**LoadingScreen**
- Visual feedback during loading
- Progress bar
- Tips/hints
- Minimum display time (prevent flashing)

### Input System

**InputManager**
- Unified input handling (keyboard, mouse, touch)
- Action binding system
- Pointer lock support
- Frame-based state tracking

**Input States:**
- `isKeyDown(key)` - Currently pressed
- `isKeyPressed(key)` - Just pressed this frame
- `isKeyReleased(key)` - Just released this frame

**Action Bindings:**
```javascript
inputManager.bindAction('jump', ['Space', 'KeyW']);

if (inputManager.isActionDown('jump')) {
  player.jump();
}
```

### Camera System

**CameraManager**
- Multiple camera support
- Active camera switching
- Automatic resize handling

**ThirdPersonCamera**
- Smooth follow camera
- Mouse/touch rotation
- Zoom control
- Camera-relative movement directions
- Configurable parameters

**Camera Setup:**
```javascript
const camera = cameraManager.getActiveCamera();
const controller = new ThirdPersonCamera(camera, player, {
  distance: 10,
  height: 5,
  smoothness: 0.1
});

controller.setInputManager(inputManager);
```

## Multiplayer Architecture

### Client-Server Model

```
┌─────────────┐         ┌─────────────┐         ┌─────────────┐
│   Client 1  │         │   Server    │         │   Client 2  │
│  GameEngine │◄───────►│  Socket.io  │◄───────►│  GameEngine │
│  + Network  │         │  + Game     │         │  + Network  │
│   Manager   │         │   Logic     │         │   Manager   │
└─────────────┘         └─────────────┘         └─────────────┘
```

### Room System

**Room Structure:**
```javascript
{
  id: 'room-123',
  name: 'My Game Room',
  maxPlayers: 10,
  currentPlayers: 5,
  isPrivate: false,
  gameMode: 'deathmatch',
  map: 'forest',
  host: 'player-id-123',
  players: [...]
}
```

**Room Operations:**
- Create room
- Join room (by ID or quick match)
- Leave room
- Update room settings (host only)
- Kick player (host only)
- Transfer host
- Start game

### State Synchronization

**Authority Models:**

1. **Server Authority** (Recommended for competitive games)
   - Server validates all actions
   - Client sends inputs, server broadcasts results
   - Prevents cheating

2. **Client Authority** (Faster, less secure)
   - Client updates immediately
   - Server relays to other clients
   - Client-side prediction

**Synchronization Strategy:**
```javascript
// Throttled updates (20/sec)
const SYNC_RATE = 50; // ms

update(deltaTime) {
  const now = Date.now();
  if (now - this.lastSync > SYNC_RATE) {
    this.network.send('player:update', {
      state: this.player.serialize()
    });
    this.lastSync = now;
  }
}
```

**Dead Reckoning:**
- Interpolate between network updates
- Smooth movement of remote entities
- Reduce jitter

## Integration with Existing Backend

### Backend Requirements

Your Node.js backend should implement these socket.io events:

**Authentication:**
```javascript
socket.on('auth:login', (data) => {
  // Validate token
  socket.emit('auth:success', { playerId, userData });
});
```

**Room Management:**
```javascript
socket.on('room:create', (data) => { /* ... */ });
socket.on('room:join', (data) => { /* ... */ });
socket.on('room:leave', (data) => { /* ... */ });
socket.on('room:list', (filters, callback) => { /* ... */ });
```

**Player State:**
```javascript
socket.on('player:update', (data) => {
  // Broadcast to room
  socket.to(roomId).emit('player:update', {
    playerId: socket.id,
    state: data.state
  });
});
```

**Game Events:**
```javascript
socket.on('game:action', (data) => {
  // Custom game logic
  // Broadcast results
});
```

### Backend Integration Pattern

```javascript
// Your existing backend
const io = require('socket.io')(server);

// Import your existing services
const roomService = require('./services/roomService');
const playerService = require('./services/playerService');

io.on('connection', (socket) => {
  // Use your existing services
  socket.on('room:join', async (data) => {
    const room = await roomService.joinRoom(data.roomId, socket.id);
    socket.join(room.id);
    socket.emit('room:joined', { room });
  });
  
  // Player state sync
  socket.on('player:update', (data) => {
    playerService.updatePlayer(socket.id, data.state);
    socket.to(currentRoom).emit('player:update', {
      playerId: socket.id,
      state: data.state
    });
  });
});
```

## Scalability Considerations

### Performance

**Client-Side:**
- Entity pooling
- Frustum culling (automatic with Three.js)
- LOD (Level of Detail)
- Asset streaming
- Texture atlasing

**Server-Side:**
- Room sharding (distribute rooms across servers)
- Interest management (only send updates for nearby entities)
- State compression
- Database read replicas

### MMO-Scale Features

**Zone System:**
```javascript
class Zone extends Scene {
  // Each zone is a separate scene
  // Players transition between zones
}

// Zone transitions
engine.loadScene(NewZone, { 
  entryPoint: 'north-gate',
  previousZone: 'forest' 
});
```

**Interest Management:**
```javascript
// Only sync entities within range
const VISIBILITY_RANGE = 50;

getVisibleEntities(player) {
  return this.entities.filter(entity => 
    player.distanceTo(entity) < VISIBILITY_RANGE
  );
}
```

**Instancing:**
```javascript
// Multiple instances of same zone for load distribution
const dungeonInstance = new DungeonScene({
  instanceId: 'dungeon-party-123',
  maxPlayers: 5
});
```

## Extension Points

### Custom Entity Types

```javascript
class Vehicle extends Entity {
  constructor(config) {
    super(config);
    this.speed = config.speed;
    this.passengers = [];
  }
  
  addPassenger(entity) {
    this.passengers.push(entity);
  }
}
```

### Custom Components

```javascript
class InventoryComponent extends Component {
  constructor(size) {
    super();
    this.items = [];
    this.maxSize = size;
  }
  
  addItem(item) {
    if (this.items.length < this.maxSize) {
      this.items.push(item);
      return true;
    }
    return false;
  }
}
```

### Custom Scene Types

```javascript
class MenuScene extends Scene {
  // UI-only scene
}

class BattleScene extends Scene {
  // Turn-based battle logic
}

class WorldScene extends Scene {
  // Open world exploration
}
```

### Custom Network Events

```javascript
// Client
network.send('custom:spell-cast', {
  spellId: 'fireball',
  target: targetId
});

// Server (your backend)
socket.on('custom:spell-cast', (data) => {
  // Validate and process
  io.to(room).emit('custom:spell-effect', {
    caster: socket.id,
    ...data
  });
});

// Other clients
network.on('custom:spell-effect', (data) => {
  // Show spell effect
});
```

## Best Practices

### Performance
1. Throttle network updates (20-60/sec is usually enough)
2. Use object pooling for frequently created/destroyed entities
3. Batch network messages when possible
4. Profile regularly (use browser DevTools)

### Code Organization
1. Keep scenes focused and modular
2. Use components for reusable functionality
3. Emit events for cross-system communication
4. Document custom network events

### Networking
1. Validate all data on server
2. Implement reconnection logic
3. Handle network timeouts gracefully
4. Use binary protocols for large data (consider MessagePack)

### Security
1. Never trust client data
2. Server validates all actions
3. Rate limit requests
4. Authenticate all connections

## Testing Strategy

### Unit Tests
- Component logic
- Entity behavior
- Utility functions

### Integration Tests
- Scene transitions
- Network message flow
- Asset loading

### Performance Tests
- Entity count stress test
- Network latency simulation
- Memory leak detection

## Future Enhancements

Potential additions to the engine:

1. **Physics Engine**: Integrate Cannon.js or Ammo.js
2. **UI Framework**: React/Vue integration for game UI
3. **Audio System**: 3D spatial audio, music manager
4. **Particle System**: Visual effects
5. **Animation System**: Advanced animation blending
6. **AI Framework**: Behavior trees, pathfinding
7. **Quest System**: Quest management and tracking
8. **Inventory System**: Item management
9. **Skill System**: Abilities and cooldowns
10. **Chat System**: In-game communication

This architecture provides a solid foundation for building complex multiplayer games while remaining flexible and extensible.

