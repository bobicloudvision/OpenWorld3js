/**
 * ✅ Basic Game Scene - Using ONLY Engine Classes
 * NO Three.js imports needed!
 */
import { 
  GameEngine, 
  Scene, 
  Actor, 
  ThirdPersonCamera,
  MeshBuilder,
  Color
} from '../../src/index.js';

class BasicGameScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'BasicGameScene';
    this.backgroundColor = Color.SKY_BLUE; // ✅ Using Color class

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
    this.setFog(Color.SKY_BLUE, 50, 200); // ✅ Using Color class
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
    // ✅ Using MeshBuilder instead of THREE.Mesh
    const ground = MeshBuilder.createTerrain({
      width: 200,
      height: 200,
      widthSegments: 50,
      heightSegments: 50,
      color: Color.GRASS,
      heightVariation: 0.5,
      receiveShadow: true
    });
    
    this.add(ground);
  }

  createPlayer() {
    // ✅ Using MeshBuilder instead of THREE.BoxGeometry
    const mesh = MeshBuilder.createBox({
      width: 1,
      height: 2,
      depth: 1,
      color: 0x4a90e2, // Custom blue color
      castShadow: true
    });
    mesh.position.y = 1;

    // Create player actor (just movement, no game-specific features)
    this.player = new Actor({
      name: 'Player',
      speed: 8
    });

    this.player.mesh = mesh;
    this.player.setPosition(0, 1, 0);

    // Add jump properties
    this.player.jumpForce = 8;
    this.player.gravity = -20;
    this.player.isJumping = false;

    this.addEntity(this.player);
  }

  createObstacles() {
    // ✅ Using Color class instead of hex values
    const colors = [Color.RED, Color.ORANGE, Color.PURPLE, Color.CYAN];

    for (let i = 0; i < 20; i++) {
      const size = 1 + Math.random() * 2;
      
      // ✅ Using MeshBuilder instead of THREE.BoxGeometry
      const mesh = MeshBuilder.createBox({
        width: size,
        height: size * 2,
        depth: size,
        color: colors[Math.floor(Math.random() * colors.length)],
        castShadow: true,
        receiveShadow: true
      });

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
    
    // ✅ Using Actor's internal velocity (already a THREE.Vector3)
    const moveDirection = this.player.velocity;
    moveDirection.set(0, 0, 0);

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

    // ✅ Jump functionality
    if (input.isActionPressed('jump') && this.player.isGrounded) {
      this.player.velocity.y = this.player.jumpForce;
      this.player.isGrounded = false;
      this.player.isJumping = true;
    }

    // Apply gravity
    if (!this.player.isGrounded) {
      this.player.velocity.y += this.player.gravity * deltaTime;
      this.player.position.y += this.player.velocity.y * deltaTime;
    }

    // Ground collision
    const groundLevel = 1; // Height of player when on ground
    if (this.player.position.y <= groundLevel) {
      this.player.position.y = groundLevel;
      this.player.velocity.y = 0;
      this.player.isGrounded = true;
      this.player.isJumping = false;
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
 * ✅ Using ONLY engine classes - NO Three.js imports!
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

  console.log('✅ Game started using pure engine API!');
  console.log('✅ No Three.js imports in game code!');
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', initGame);

