import * as THREE from 'three';
import { GameEngine, Scene, Actor, ThirdPersonCamera } from '../../src/index.js';

/**
 * Basic Game Scene
 */
class BasicGameScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'BasicGameScene';
    this.backgroundColor = 0x87CEEB; // Sky blue

    this.player = null;
    this.cameraController = null;
  }

  async initialize() {
    await super.initialize();

    // Setup lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.intensity = 0.8;
    this.directionalLight.position.set(10, 20, 10);

    // Add fog
    this.setFog(0x87CEEB, 50, 200);
  }

  async load() {
    // Create ground
    this.createGround();

    // Create player
    this.createPlayer();

    // Create some obstacles
    this.createObstacles();

    // Setup camera
    this.setupCamera();

    // Setup input
    this.setupInput();

    await super.load();
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3a8c3a,
      roughness: 0.8
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    // Add some random height variation
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = Math.random() * 0.5;
      positions.setY(i, y);
    }
    geometry.computeVertexNormals();
    
    this.add(ground);
  }

  createPlayer() {
    // Create a simple cube as player
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4a90e2,
      roughness: 0.5,
      metalness: 0.3
    });
    
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.y = 1;

    // Create player actor (just movement, no game-specific features)
    this.player = new Actor({
      name: 'Player',
      speed: 8
    });

    this.player.mesh = mesh;
    this.player.setPosition(0, 1, 0);

    this.addEntity(this.player);
  }

  createObstacles() {
    const colors = [0xe74c3c, 0xf39c12, 0x9b59b6, 0x1abc9c];

    for (let i = 0; i < 20; i++) {
      const size = 1 + Math.random() * 2;
      const geometry = new THREE.BoxGeometry(size, size * 2, size);
      const material = new THREE.MeshStandardMaterial({ 
        color: colors[Math.floor(Math.random() * colors.length)],
        roughness: 0.6,
        metalness: 0.2
      });
      
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;

      const angle = (i / 20) * Math.PI * 2;
      const radius = 10 + Math.random() * 30;
      
      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = size;
      mesh.position.z = Math.sin(angle) * radius;

      this.add(mesh);
    }
  }

  setupCamera() {
    const camera = this.engine.cameraManager.getActiveCamera();
    
    this.cameraController = new ThirdPersonCamera(camera, this.player, {
      distance: 12,
      height: 6,
      smoothness: 0.15,
      minDistance: 5,
      maxDistance: 25
    });

    this.cameraController.setInputManager(this.engine.inputManager);
  }

  setupInput() {
    const input = this.engine.inputManager;

    // Bind actions
    input.bindAction('forward', ['KeyW', 'ArrowUp']);
    input.bindAction('backward', ['KeyS', 'ArrowDown']);
    input.bindAction('left', ['KeyA', 'ArrowLeft']);
    input.bindAction('right', ['KeyD', 'ArrowRight']);
    input.bindAction('jump', ['Space']);
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.player && this.cameraController) {
      this.updatePlayerMovement(deltaTime);
      this.cameraController.update(deltaTime);
    }

    // Update UI
    this.updateUI();
  }

  updatePlayerMovement(deltaTime) {
    const input = this.engine.inputManager;
    const moveDirection = new THREE.Vector3();

    // Get camera relative directions
    const forward = this.cameraController.getForwardDirection();
    const right = this.cameraController.getRightDirection();

    // Calculate movement direction
    if (input.isActionDown('forward')) {
      moveDirection.add(forward);
    }
    if (input.isActionDown('backward')) {
      moveDirection.sub(forward);
    }
    if (input.isActionDown('left')) {
      moveDirection.sub(right);
    }
    if (input.isActionDown('right')) {
      moveDirection.add(right);
    }

    // Move player
    if (moveDirection.lengthSq() > 0) {
      this.player.move(moveDirection, deltaTime);
      this.player.rotateTo(moveDirection, deltaTime);
    } else {
      this.player.stop();
    }

    // Keep player above ground
    if (this.player.position.y < 1) {
      this.player.position.y = 1;
    }
  }

  updateUI() {
    document.getElementById('fps').textContent = Math.round(this.engine.stats.fps);
    document.getElementById('entities').textContent = this.entities.size;
    
    if (this.player) {
      const pos = this.player.position;
      document.getElementById('position').textContent = 
        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
    }
  }
}

/**
 * Initialize and start the game
 */
function initGame() {
  // Create game engine
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true
  });

  // Load the game scene
  engine.loadScene(BasicGameScene);

  // Start the engine
  engine.start();

  console.log('Game started!');
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', initGame);

