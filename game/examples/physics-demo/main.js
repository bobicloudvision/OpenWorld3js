/**
 * ✅ Physics Demo - Using PhysicsManager
 * Demonstrates Cannon.js integration with the engine
 */
import { 
  GameEngine, 
  Scene, 
  Actor, 
  ThirdPersonCamera,
  MeshBuilder,
  Color
} from '../../src/index.js';

class PhysicsDemoScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'PhysicsDemoScene';
    this.backgroundColor = Color.SKY_BLUE;

    this.player = null;
    this.cameraController = null;
    this.physicsObjects = [];
  }

  async initialize() {
    await super.initialize();

    // Setup lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.intensity = 0.8;
    this.directionalLight.position.set(10, 20, 10);

    // Add fog
    this.setFog(Color.SKY_BLUE, 50, 200);
  }

  async load() {
    // ✅ Get physics manager from engine
    const physics = this.engine.physicsManager;

    if (!physics) {
      console.error('Physics not enabled! Enable it in engine config.');
      return;
    }

    // Create ground with physics
    this.createPhysicsGround(physics);

    // Create player with physics
    this.createPhysicsPlayer(physics);

    // Create some static obstacles with physics
    this.createPhysicsObstacles(physics);

    // Setup camera
    this.setupCamera();

    // Setup input
    this.setupInput();

    await super.load();
  }

  createPhysicsGround(physics) {
    // Visual mesh
    const ground = MeshBuilder.createPlane({
      width: 200,
      height: 200,
      color: Color.GRASS,
      receiveShadow: true
    });
    ground.rotation.x = -Math.PI / 2;
    this.add(ground);

    // Physics body (static ground)
    physics.createPlane({
      mass: 0, // Static
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 }
    });
  }

  createPhysicsPlayer(physics) {
    // Visual mesh
    const mesh = MeshBuilder.createBox({
      width: 1,
      height: 2,
      depth: 1,
      color: 0x4a90e2,
      castShadow: true
    });

    // Create player actor
    this.player = new Actor({
      name: 'Player',
      speed: 8
    });

    this.player.mesh = mesh;
    this.player.setPosition(0, 5, 0);

    // ✅ Add physics to player using PhysicsManager
    const playerBody = physics.addToEntity(this.player, {
      type: 'box',
      width: 1,
      height: 2,
      depth: 1,
      mass: 5, // Dynamic body
    });

    // Lock rotation so player doesn't tip over
    playerBody.fixedRotation = true;
    playerBody.updateMassProperties();

    this.addEntity(this.player);
  }

  createPhysicsObstacles(physics) {
    const colors = [Color.RED, Color.ORANGE, Color.PURPLE, Color.CYAN];

    for (let i = 0; i < 15; i++) {
      const size = 1 + Math.random() * 2;
      
      // Visual mesh
      const mesh = MeshBuilder.createBox({
        width: size,
        height: size * 2,
        depth: size,
        color: colors[Math.floor(Math.random() * colors.length)],
        castShadow: true,
        receiveShadow: true
      });

      const angle = (i / 15) * Math.PI * 2;
      const radius = 10 + Math.random() * 20;
      
      const x = Math.cos(angle) * radius;
      const y = 5 + Math.random() * 5;
      const z = Math.sin(angle) * radius;

      mesh.position.set(x, y, z);
      this.add(mesh);

      // ✅ Create physics body
      const body = physics.createBox({
        width: size,
        height: size * 2,
        depth: size,
        mass: 0, // Static obstacles
        position: { x, y, z }
      });

      // Store for syncing
      this.physicsObjects.push({ mesh, body });
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
    input.bindAction('spawn', ['KeyE']);
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.player && this.cameraController) {
      this.updatePlayerPhysics(deltaTime);
      this.syncPhysicsObjects();
      this.cameraController.update(deltaTime);
    }

    // Spawn box on E key
    this.handleSpawning();

    // Update UI
    this.updateUI();
  }

  updatePlayerPhysics(deltaTime) {
    const input = this.engine.inputManager;
    const physics = this.engine.physicsManager;
    const body = this.player.physicsBody;

    if (!body) return;

    // Get camera relative directions
    const forward = this.cameraController.getForwardDirection();
    const right = this.cameraController.getRightDirection();

    // Calculate movement direction
    const moveDirection = { x: 0, y: 0, z: 0 };

    if (input.isActionDown('forward')) {
      moveDirection.x += forward.x;
      moveDirection.z += forward.z;
    }
    if (input.isActionDown('backward')) {
      moveDirection.x -= forward.x;
      moveDirection.z -= forward.z;
    }
    if (input.isActionDown('left')) {
      moveDirection.x -= right.x;
      moveDirection.z -= right.z;
    }
    if (input.isActionDown('right')) {
      moveDirection.x += right.x;
      moveDirection.z += right.z;
    }

    // Normalize and apply movement
    const length = Math.sqrt(moveDirection.x * moveDirection.x + moveDirection.z * moveDirection.z);
    if (length > 0) {
      moveDirection.x /= length;
      moveDirection.z /= length;

      const speed = this.player.speed;
      body.velocity.x = moveDirection.x * speed;
      body.velocity.z = moveDirection.z * speed;

      // Rotate player to face movement direction
      this.player.rotation.y = Math.atan2(moveDirection.x, moveDirection.z);
    } else {
      // Stop horizontal movement
      body.velocity.x *= 0.9;
      body.velocity.z *= 0.9;
    }

    // ✅ Jump with physics
    if (input.isActionPressed('jump') && this.isPlayerGrounded(body)) {
      physics.applyImpulse(body, { x: 0, y: 50, z: 0 });
    }

    // Sync entity position with physics body
    this.player.position.copy(body.position);
    this.player.mesh.position.copy(body.position);
    this.player.mesh.quaternion.copy(body.quaternion);
  }

  isPlayerGrounded(body) {
    // Simple ground check: if vertical velocity is small and y position is low
    return Math.abs(body.velocity.y) < 0.5 && body.position.y < 3;
  }

  syncPhysicsObjects() {
    // Sync visual meshes with physics bodies
    for (const obj of this.physicsObjects) {
      obj.mesh.position.copy(obj.body.position);
      obj.mesh.quaternion.copy(obj.body.quaternion);
    }
  }

  handleSpawning() {
    const input = this.engine.inputManager;
    const physics = this.engine.physicsManager;

    if (input.isActionPressed('spawn')) {
      // Spawn a physics box above player
      const size = 1 + Math.random() * 1.5;
      
      const mesh = MeshBuilder.createBox({
        width: size,
        height: size,
        depth: size,
        color: Math.random() * 0xffffff,
        castShadow: true,
        receiveShadow: true
      });

      const spawnPos = {
        x: this.player.position.x,
        y: this.player.position.y + 10,
        z: this.player.position.z
      };

      mesh.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
      this.add(mesh);

      // Create dynamic physics body
      const body = physics.createBox({
        width: size,
        height: size,
        depth: size,
        mass: size * 2, // Mass scales with size
        position: spawnPos
      });

      this.physicsObjects.push({ mesh, body });

      console.log('📦 Spawned physics box!');
    }
  }

  updateUI() {
    document.getElementById('fps').textContent = Math.round(this.engine.stats.fps);
    document.getElementById('entities').textContent = this.entities.size;
    document.getElementById('physics-objects').textContent = this.physicsObjects.length;
    
    if (this.player) {
      const pos = this.player.position;
      document.getElementById('position').textContent = 
        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
    }
  }
}

/**
 * Initialize and start the game with physics
 */
function initGame() {
  // ✅ Create game engine WITH PHYSICS enabled
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true,
    physics: true, // Enable physics!
    physicsConfig: {
      gravity: -9.82,
      iterations: 10
    }
  });

  // Load the physics demo scene
  engine.loadScene(PhysicsDemoScene);

  // Start the engine
  engine.start();

  console.log('✅ Physics demo started!');
  console.log('✅ Using Cannon.js via PhysicsManager');
  console.log('📦 Press E to spawn physics objects!');
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', initGame);

