/**
 * Endless Runner - Subway Surfers Style
 * 
 * Features:
 * - Procedural track generation
 * - Lane-based movement
 * - Jump mechanics
 * - Obstacle avoidance
 * - Score system
 */

import {
  GameEngine,
  GameScene,
  GameObject,
  GameObjectFactory,
  Component,
  MeshBuilder,
  Color,
  Vector3
} from '../../src/index.js';

// ===== COMPONENTS =====

class PlayerController extends Component {
  constructor(config = {}) {
    super();
    this.currentLane = 1; // 0=left, 1=center, 2=right
    this.laneWidth = 3;
    this.moveSpeed = 0.2; // Speed for lane transitions
    this.targetX = 0;
    
    this.isJumping = false;
    this.jumpSpeed = 0;
    this.jumpForce = 12;
    this.gravity = -30;
    this.groundY = 0.5;
    
    this.isAlive = true;
  }

  awake() {
    this.entity.position.y = this.groundY;
  }

  update(deltaTime) {
    if (!this.isAlive) return;

    const input = this.entity.scene.engine.inputManager;
    
    if (!input) return;
    
    // Lane switching (Arrow Keys or A/D)
    if ((input.isKeyPressed('ArrowLeft') || input.isKeyPressed('KeyA')) && this.currentLane > 0) {
      this.currentLane--;
      this.targetX = (this.currentLane - 1) * this.laneWidth;
    }
    
    if ((input.isKeyPressed('ArrowRight') || input.isKeyPressed('KeyD')) && this.currentLane < 2) {
      this.currentLane++;
      this.targetX = (this.currentLane - 1) * this.laneWidth;
    }
    
    // Smooth lane transition
    const diff = this.targetX - this.entity.position.x;
    if (Math.abs(diff) > 0.01) {
      this.entity.position.x += diff * this.moveSpeed;
    }
    
    // Jump (Space or W)
    if ((input.isKeyPressed('Space') || input.isKeyPressed('KeyW')) && !this.isJumping) {
      this.isJumping = true;
      this.jumpSpeed = this.jumpForce;
    }
    
    // Apply gravity and jumping
    if (this.isJumping) {
      this.jumpSpeed += this.gravity * deltaTime;
      this.entity.position.y += this.jumpSpeed * deltaTime;
      
      if (this.entity.position.y <= this.groundY) {
        this.entity.position.y = this.groundY;
        this.isJumping = false;
        this.jumpSpeed = 0;
      }
    }
    
    // Update mesh position
    if (this.entity.mesh) {
      this.entity.mesh.position.copy(this.entity.position);
    }
  }

  die() {
    this.isAlive = false;
    this.emit('died');
  }
}

class TrackGenerator extends Component {
  constructor(config = {}) {
    super();
    this.trackLength = 100;
    this.segmentLength = 10;
    this.laneWidth = 3;
    this.trackWidth = 9; // 3 lanes * 3 units
    this.generatedZ = 0;
    this.segments = [];
  }

  start() {
    // Generate initial track
    for (let i = 0; i < 10; i++) {
      this.generateSegment();
    }
  }

  update(deltaTime) {
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    // Generate new segments as player moves forward
    // Player moves in negative Z, so check if player is getting close to last generated position
    if (player.position.z < this.generatedZ + 50) {
      this.generateSegment();
    }
    
    // Remove old segments that are behind the player
    this.segments = this.segments.filter(segment => {
      if (segment.position.z > player.position.z + 30) {
        scene.removeEntity(segment);
        return false;
      }
      return true;
    });
  }

  generateSegment() {
    const scene = this.entity.scene;
    
    // Ground segment - create as horizontal ground
    const ground = GameObjectFactory.createPlane({
      name: 'Ground',
      width: this.trackWidth,
      height: this.segmentLength,
      color: 0x4a4a4a,
      receiveShadow: true
    });
    
    // IMPORTANT: Rotate the mesh to be horizontal BEFORE adding to scene
    if (ground.mesh) {
      ground.mesh.rotation.x = -Math.PI / 2;
    }
    
    // Set rotation on GameObject too
    ground.rotation.x = -Math.PI / 2;
    ground.setPosition(0, 0, this.generatedZ - this.segmentLength / 2);
    scene.addEntity(ground);
    this.segments.push(ground);
    
    // Side barriers (low walls - won't block view)
    const leftWall = GameObjectFactory.createCube({
      name: 'Wall',
      width: 0.5,
      height: 0.5,
      depth: this.segmentLength,
      color: 0xff6600
    });
    leftWall.setPosition(-this.trackWidth / 2 - 0.25, 0.25, this.generatedZ - this.segmentLength / 2);
    // Make semi-transparent
    if (leftWall.mesh && leftWall.mesh.material) {
      leftWall.mesh.material.transparent = true;
      leftWall.mesh.material.opacity = 0.7;
    }
    scene.addEntity(leftWall);
    this.segments.push(leftWall);
    
    const rightWall = GameObjectFactory.createCube({
      name: 'Wall',
      width: 0.5,
      height: 0.5,
      depth: this.segmentLength,
      color: 0xff6600
    });
    rightWall.setPosition(this.trackWidth / 2 + 0.25, 0.25, this.generatedZ - this.segmentLength / 2);
    // Make semi-transparent
    if (rightWall.mesh && rightWall.mesh.material) {
      rightWall.mesh.material.transparent = true;
      rightWall.mesh.material.opacity = 0.7;
    }
    scene.addEntity(rightWall);
    this.segments.push(rightWall);
    
    // Randomly spawn obstacles (30% chance)
    if (Math.random() < 0.3 && this.generatedZ < -20) {
      this.spawnObstacle(this.generatedZ - this.segmentLength / 2);
    }
    
    // Spawn coins (50% chance)
    if (Math.random() < 0.5) {
      this.spawnCoin(this.generatedZ - this.segmentLength / 2);
    }
    
    this.generatedZ -= this.segmentLength;
  }

  spawnObstacle(z) {
    const scene = this.entity.scene;
    const lane = Math.floor(Math.random() * 3); // Random lane
    const x = (lane - 1) * this.laneWidth;
    
    // Create short barrier to jump over (Subway Surfers style)
    const obstacle = GameObjectFactory.createCube({
      name: 'Obstacle',
      width: 2.5,
      height: 0.8,  // Low barrier - must jump
      depth: 1.5,
      color: 0xff4444,
      castShadow: true
    });
    obstacle.addTag('obstacle');
    obstacle.setPosition(x, 0.4, z);
    scene.addEntity(obstacle);
    this.segments.push(obstacle);
  }

  spawnCoin(z) {
    const scene = this.entity.scene;
    const lane = Math.floor(Math.random() * 3);
    const x = (lane - 1) * this.laneWidth;
    
    const coin = GameObjectFactory.createSphere({
      name: 'Coin',
      radius: 0.5,
      color: 0xffd700,
      castShadow: true
    });
    coin.addTag('coin');
    coin.setPosition(x, 1.5, z);
    coin.addComponent(RotateComponent, { speed: 3 });
    scene.addEntity(coin);
    this.segments.push(coin);
  }
}

class RotateComponent extends Component {
  constructor(config = {}) {
    super();
    this.speed = config.speed || 1;
  }

  update(deltaTime) {
    if (this.entity.mesh) {
      this.entity.mesh.rotation.y += this.speed * deltaTime;
    }
  }
}

class CameraFollowComponent extends Component {
  constructor(config = {}) {
    super();
    // Higher and further back to see more track ahead
    this.offset = new Vector3(0, 8, 12);
    this.smoothness = 0.1;
    this.targetPosition = new Vector3();
  }

  start() {
    const camera = this.entity.scene.engine.cameraManager.getActiveCamera();
    this.camera = camera;
  }

  update(deltaTime) {
    if (!this.camera) return;
    
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    // Calculate target camera position
    this.targetPosition.copy(player.position).add(this.offset);
    
    // Smooth follow
    this.camera.position.lerp(this.targetPosition._getThreeVector(), this.smoothness);
    
    // Look at position far ahead of player to see more track
    const lookAtPos = new Vector3(
      player.position.x,
      player.position.y + 1,
      player.position.z - 15  // Look 15 units ahead
    );
    this.camera.lookAt(lookAtPos._getThreeVector());
  }
}

class CollisionDetector extends Component {
  constructor(config = {}) {
    super();
    this.checkRadius = 1.5;
  }

  update(deltaTime) {
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    const playerController = player.getComponent(PlayerController);
    if (!playerController || !playerController.isAlive) return;
    
    // Check obstacles
    const obstacles = scene.findGameObjectsWithTag('obstacle');
    for (const obstacle of obstacles) {
      const distance = player.position.distanceTo(obstacle.position);
      
      if (distance < this.checkRadius) {
        playerController.die();
        this.emit('collision', { type: 'obstacle' });
        return;
      }
    }
    
    // Check coins
    const coins = scene.findGameObjectsWithTag('coin');
    for (const coin of coins) {
      const distance = player.position.distanceTo(coin.position);
      
      if (distance < 1.5) {
        scene.removeEntity(coin);
        this.emit('coinCollected');
      }
    }
  }
}

class GameManager extends Component {
  constructor(config = {}) {
    super();
    this.score = 0;
    this.distance = 0;
    this.gameSpeed = 10;
    this.isGameOver = false;
  }

  start() {
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (player) {
      const playerController = player.getComponent(PlayerController);
      playerController.on('died', () => this.gameOver());
    }
    
    const collisionDetector = scene.find('GameManager').getComponent(CollisionDetector);
    if (collisionDetector) {
      collisionDetector.on('coinCollected', () => {
        this.score += 10;
        this.updateUI();
      });
    }
  }

  update(deltaTime) {
    if (this.isGameOver) return;
    
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    // Move player forward
    player.position.z -= this.gameSpeed * deltaTime;
    
    // Update distance and score
    this.distance += this.gameSpeed * deltaTime;
    this.score += Math.floor(this.gameSpeed * deltaTime);
    
    // Gradually increase speed
    this.gameSpeed += 0.001;
    
    this.updateUI();
  }

  updateUI() {
    document.getElementById('score').textContent = Math.floor(this.score);
    document.getElementById('distance').textContent = Math.floor(this.distance) + 'm';
  }

  gameOver() {
    this.isGameOver = true;
    
    document.getElementById('final-score').textContent = Math.floor(this.score);
    document.getElementById('final-distance').textContent = Math.floor(this.distance);
    document.getElementById('game-over').classList.add('show');
  }

  restart() {
    window.location.reload();
  }
}

// ===== GAME SCENE =====

class EndlessRunnerScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'EndlessRunner';
    this.backgroundColor = 0x87CEEB;
  }

  async load() {
    // Lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.intensity = 0.8;
    
    // Fog for depth
    this.setFog(0x87CEEB, 30, 80);
    
    // Create Player
    const player = GameObjectFactory.createCapsule({
      name: 'Player',
      radius: 0.5,
      height: 1.5,
      color: 0x4a90e2,
      castShadow: true
    });
    player.addTag('player');
    player.setPosition(0, 0.5, 0);
    player.addComponent(PlayerController);
    this.addEntity(player);
    
    // Create Game Manager
    const gameManager = GameObjectFactory.createEmpty({ name: 'GameManager' });
    gameManager.addComponent(GameManager);
    gameManager.addComponent(TrackGenerator);
    gameManager.addComponent(CameraFollowComponent);
    gameManager.addComponent(CollisionDetector);
    this.addEntity(gameManager);
    
    await super.load();
  }
}

// ===== INITIALIZE GAME =====

let gameStarted = false;

document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('start-screen').style.display = 'none';
  if (!gameStarted) {
    startGame();
    gameStarted = true;
  }
});

document.getElementById('restart-btn').addEventListener('click', () => {
  window.location.reload();
});

function startGame() {
  const engine = new GameEngine({ physics: false });
  engine.start();
  engine.loadScene(EndlessRunnerScene);
  
  console.log('🏃 Endless Runner Started!');
  console.log('Use Arrow Keys to move, Space to jump!');
}

