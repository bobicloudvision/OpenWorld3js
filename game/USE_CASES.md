# Engine Use Cases - Different Game Types

This document shows how to use the same engine for completely different game types.

## 🎮 1. MMORPG (Like World of Warcraft)

```javascript
import { GameEngine, Scene, Actor, ThirdPersonCamera, getPreset } from './src/index.js';

class MMORPGWorld extends Scene {
  async load() {
    // Characters
    this.player = new Actor({ 
      health: 100, 
      speed: 5 
    });
    this.addEntity(this.player);

    // NPCs
    this.npc = new Actor({ 
      health: 50,
      isNetworked: true 
    });
    this.addEntity(this.npc);

    // Camera
    const camera = this.engine.cameraManager.getActiveCamera();
    this.cameraController = new ThirdPersonCamera(camera, this.player);
  }
}

// Use MMORPG preset
const engine = new GameEngine({
  ...getPreset('mmorpg'),
  canvas: document.querySelector('#game-canvas'),
  networkConfig: {
    url: 'http://your-server.com:3000'
  }
});

engine.loadScene(MMORPGWorld);
engine.start();
```

## 🏎️ 2. Racing Game

```javascript
import { GameEngine, Scene, Entity } from './src/index.js';
import * as THREE from 'three';

class RacingTrack extends Scene {
  async load() {
    // Vehicle (NOT Actor - different physics)
    this.car = new Entity({ type: 'vehicle' });
    
    // Custom vehicle properties
    this.car.speed = 0;
    this.car.maxSpeed = 200;
    this.car.steering = 0;
    this.car.acceleration = 0;
    
    // Custom update for vehicle physics
    this.car.update = (deltaTime) => {
      // Racing game physics
      this.car.speed += this.car.acceleration * deltaTime;
      this.car.position.z += this.car.speed * deltaTime;
    };

    this.addEntity(this.car);

    // Chase camera
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.set(0, 5, 10);
  }

  update(deltaTime) {
    super.update(deltaTime);
    
    // Update camera to follow car
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.lerp(
      new THREE.Vector3(
        this.car.position.x,
        this.car.position.y + 5,
        this.car.position.z + 10
      ),
      0.1
    );
    camera.lookAt(this.car.position);
  }
}

const engine = new GameEngine({
  ...getPreset('racing'),
  canvas: document.querySelector('#game-canvas')
});

engine.loadScene(RacingTrack);
engine.start();
```

## 🔫 3. First-Person Shooter

```javascript
import { GameEngine, Scene, Entity, Component } from './src/index.js';
import * as THREE from 'three';

// Custom weapon component
class WeaponComponent extends Component {
  constructor() {
    super();
    this.ammo = 30;
    this.fireRate = 0.1;
    this.lastShot = 0;
  }

  shoot() {
    if (this.ammo > 0) {
      this.ammo--;
      this.emit('shot');
    }
  }
}

class FPSLevel extends Scene {
  async load() {
    // Player (simple entity, not Actor)
    this.player = new Entity({ type: 'player' });
    this.player.height = 1.8;
    this.player.setPosition(0, this.player.height / 2, 0);
    this.addEntity(this.player);

    // Add weapon
    this.player.addComponent(new WeaponComponent());

    // First-person camera
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.copy(this.player.position);
    camera.position.y += 1.6; // Eye level

    // Pointer lock for mouse look
    this.engine.inputManager.requestPointerLock();
  }

  update(deltaTime) {
    super.update(deltaTime);

    // FPS movement
    const input = this.engine.inputManager;
    const camera = this.engine.cameraManager.getActiveCamera();
    const speed = 5;

    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    forward.y = 0;
    forward.normalize();

    if (input.isKeyDown('KeyW')) {
      this.player.position.addScaledVector(forward, speed * deltaTime);
    }

    // Camera follows player
    camera.position.copy(this.player.position);
    camera.position.y += 1.6;

    // Mouse look
    const mouseDelta = input.getMouseDelta();
    camera.rotation.y -= mouseDelta.x * 0.002;
    camera.rotation.x -= mouseDelta.y * 0.002;
    camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x));
  }
}

const engine = new GameEngine({
  ...getPreset('fps'),
  canvas: document.querySelector('#game-canvas')
});

engine.loadScene(FPSLevel);
engine.start();
```

## 🧩 4. Puzzle Game

```javascript
import { GameEngine, Scene, Entity } from './src/index.js';

class PuzzleBoard extends Scene {
  async load() {
    // Grid of puzzle pieces
    this.grid = [];
    for (let x = 0; x < 10; x++) {
      this.grid[x] = [];
      for (let y = 0; y < 10; y++) {
        const piece = new Entity({ type: 'puzzle-piece' });
        piece.setPosition(x, 0, y);
        piece.color = this.randomColor();
        this.grid[x][y] = piece;
        this.addEntity(piece);
      }
    }

    // Top-down camera
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.set(5, 15, 5);
    camera.lookAt(5, 0, 5);
  }

  randomColor() {
    return ['red', 'blue', 'green', 'yellow'][Math.floor(Math.random() * 4)];
  }
}

// Minimal preset - no networking, no physics
const engine = new GameEngine({
  ...getPreset('minimal'),
  canvas: document.querySelector('#game-canvas')
});

engine.loadScene(PuzzleBoard);
engine.start();
```

## ⚔️ 5. Real-Time Strategy (RTS)

```javascript
import { GameEngine, Scene, Entity, Component } from './src/index.js';
import * as THREE from 'three';

// Selectable component
class SelectableComponent extends Component {
  constructor() {
    super();
    this.isSelected = false;
  }

  select() {
    this.isSelected = true;
    this.emit('selected');
  }

  deselect() {
    this.isSelected = false;
    this.emit('deselected');
  }
}

// Unit AI component
class RTSAIComponent extends Component {
  constructor() {
    super();
    this.target = null;
    this.state = 'idle';
  }

  update(deltaTime) {
    if (this.state === 'moving' && this.target) {
      const direction = new THREE.Vector3()
        .subVectors(this.target, this.entity.position)
        .normalize();
      
      this.entity.position.addScaledVector(direction, 2 * deltaTime);
    }
  }
}

class StrategyMap extends Scene {
  async load() {
    // Create units
    for (let i = 0; i < 10; i++) {
      const unit = new Entity({ type: 'unit' });
      unit.setPosition(
        Math.random() * 20 - 10,
        0,
        Math.random() * 20 - 10
      );
      
      unit.addComponent(new SelectableComponent());
      unit.addComponent(new RTSAIComponent());
      
      this.addEntity(unit);
    }

    // Top-down strategic camera
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.set(0, 20, 10);
    camera.lookAt(0, 0, 0);
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Handle unit selection
    const input = this.engine.inputManager;
    if (input.isMouseButtonDown(0)) {
      // Raycast and select units
      this.handleUnitSelection();
    }
  }

  handleUnitSelection() {
    // Custom selection logic
  }
}

const engine = new GameEngine({
  ...getPreset('strategy'),
  canvas: document.querySelector('#game-canvas')
});

engine.loadScene(StrategyMap);
engine.start();
```

## 🚀 6. Space Shooter

```javascript
import { GameEngine, Scene, Entity, ObjectPool } from './src/index.js';
import * as THREE from 'three';

class SpaceLevel extends Scene {
  async load() {
    // Player spaceship
    this.ship = new Entity({ type: 'spaceship' });
    this.ship.health = 100;
    this.ship.weapons = [];
    this.addEntity(this.ship);

    // Bullet pool for performance
    this.bulletPool = new ObjectPool(() => {
      const bullet = new Entity({ type: 'bullet' });
      bullet.speed = 50;
      return bullet;
    }, 100);

    // Camera behind ship
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.set(0, 2, 10);
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Ship movement
    const input = this.engine.inputManager;
    const speed = 10;

    if (input.isKeyDown('ArrowLeft')) {
      this.ship.position.x -= speed * deltaTime;
    }
    if (input.isKeyDown('ArrowRight')) {
      this.ship.position.x += speed * deltaTime;
    }

    // Shoot
    if (input.isKeyPressed('Space')) {
      this.shootBullet();
    }

    // Camera follows ship
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.x = this.ship.position.x;
  }

  shootBullet() {
    const bullet = this.bulletPool.get();
    bullet.setPosition(this.ship.position);
    bullet.setActive(true);
    this.addEntity(bullet);

    // Return to pool after 2 seconds
    setTimeout(() => {
      this.removeEntity(bullet);
      this.bulletPool.return(bullet);
    }, 2000);
  }
}

const engine = new GameEngine({
  canvas: document.querySelector('#game-canvas'),
  networking: true // For multiplayer space battles
});

engine.loadScene(SpaceLevel);
engine.start();
```

## 🏰 7. Survival/Building Game

```javascript
import { GameEngine, Scene, Entity, Actor, Component } from './src/index.js';

// Inventory component
class InventoryComponent extends Component {
  constructor(size = 20) {
    super();
    this.items = [];
    this.maxSize = size;
  }

  addItem(item) {
    if (this.items.length < this.maxSize) {
      this.items.push(item);
      this.emit('itemAdded', item);
      return true;
    }
    return false;
  }

  removeItem(item) {
    const index = this.items.indexOf(item);
    if (index > -1) {
      this.items.splice(index, 1);
      this.emit('itemRemoved', item);
    }
  }
}

// Buildable component
class BuildableComponent extends Component {
  constructor() {
    super();
    this.durability = 100;
  }

  damage(amount) {
    this.durability -= amount;
    if (this.durability <= 0) {
      this.emit('destroyed');
    }
  }
}

class SurvivalWorld extends Scene {
  async load() {
    // Player
    this.player = new Actor({ health: 100 });
    this.player.addComponent(new InventoryComponent(20));
    this.player.hunger = 100;
    this.player.thirst = 100;
    this.addEntity(this.player);

    // Buildable structures
    this.structures = [];

    // Resources to gather
    this.resources = this.spawnResources();
  }

  spawnResources() {
    const resources = [];
    for (let i = 0; i < 50; i++) {
      const resource = new Entity({ type: 'resource' });
      resource.setPosition(
        Math.random() * 100 - 50,
        0,
        Math.random() * 100 - 50
      );
      resource.resourceType = Math.random() > 0.5 ? 'wood' : 'stone';
      this.addEntity(resource);
      resources.push(resource);
    }
    return resources;
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Survival mechanics
    this.player.hunger -= 0.1 * deltaTime;
    this.player.thirst -= 0.15 * deltaTime;

    if (this.player.hunger <= 0 || this.player.thirst <= 0) {
      this.player.takeDamage(1 * deltaTime);
    }
  }
}

const engine = new GameEngine({
  canvas: document.querySelector('#game-canvas'),
  networking: true, // For multiplayer survival
  physics: true     // For realistic building physics
});

engine.loadScene(SurvivalWorld);
engine.start();
```

## 📊 Summary: Same Engine, Different Games

| Game Type | Uses Actor? | Networking? | Custom Components | Camera Type |
|-----------|------------|-------------|-------------------|-------------|
| MMORPG | ✅ Yes | ✅ Yes | Health, Inventory, Skills | Third Person |
| Racing | ❌ No | ✅ Yes | Vehicle Physics | Chase |
| FPS | ❌ No | ✅ Yes | Weapon, Health | First Person |
| Puzzle | ❌ No | ❌ No | Puzzle Logic | Top Down |
| RTS | ❌ No | ✅ Yes | Selectable, AI | Orthographic |
| Space Shooter | ❌ No | ✅ Yes | Weapon, Shield | Third Person |
| Survival | ✅ Yes | ✅ Yes | Inventory, Buildable | Third Person |

## 🎯 Key Takeaway

**The engine provides the foundation:**
- Scene management
- Entity system
- Component system  
- Network layer
- Input handling
- Camera control
- Asset loading

**You define the game:**
- Custom entities
- Custom components
- Game rules
- Game mechanics
- UI/UX

Same engine → Infinite possibilities! 🚀

