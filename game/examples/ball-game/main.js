/**
 * ⚽ Simple Ball Game
 * Roll a ball and collect goals!
 */
import { 
  GameEngine, 
  Scene, 
  Actor, 
  ThirdPersonCamera,
  MeshBuilder,
  Color
} from '../../src/index.js';

class BallGameScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'BallGameScene';
    this.backgroundColor = Color.SKY_BLUE;

    this.ball = null;
    this.cameraController = null;
    this.score = 0;
    this.goals = [];
    this.pushForce = 15;
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
    const physics = this.engine.physicsManager;

    if (!physics) {
      console.error('Physics not enabled!');
      return;
    }

    // Create ground
    this.createGround(physics);

    // Create ball
    this.createBall(physics);

    // Create goals
    this.createGoals(physics);

    // Create walls
    this.createWalls(physics);

    // Setup camera
    this.setupCamera();

    // Setup input
    this.setupInput();

    await super.load();
  }

  createGround(physics) {
    // Visual mesh
    const ground = MeshBuilder.createPlane({
      width: 100,
      height: 100,
      color: Color.GRASS,
      receiveShadow: true
    });
    ground.rotation.x = -Math.PI / 2;
    this.add(ground);

    // Add grid pattern
    const gridHelper = MeshBuilder.createGrid({
      size: 100,
      divisions: 50,
      color: 0x444444
    });
    gridHelper.position.y = 0.01;
    this.add(gridHelper);

    // Physics ground
    physics.createPlane({
      mass: 0,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: -Math.PI / 2, y: 0, z: 0 }
    });
  }

  createBall(physics) {
    // Visual mesh - beautiful sphere
    const mesh = MeshBuilder.createSphere({
      radius: 1,
      widthSegments: 32,
      heightSegments: 32,
      color: 0xff4444,
      castShadow: true
    });

    // Create ball as Actor
    this.ball = new Actor({
      name: 'Ball',
      speed: 0
    });

    this.ball.mesh = mesh;
    this.ball.setPosition(0, 1, 0);

    // Add physics - sphere
    const ballBody = physics.addToEntity(this.ball, {
      type: 'sphere',
      radius: 1,
      mass: 1
    });

    // Ball physics properties
    ballBody.linearDamping = 0.3;  // Rolling friction
    ballBody.angularDamping = 0.1; // Spin friction

    this.addEntity(this.ball);
  }

  createGoals(physics) {
    // Create 5 goals around the arena
    const positions = [
      { x: 20, z: 0 },
      { x: -20, z: 0 },
      { x: 0, z: 20 },
      { x: 0, z: -20 },
      { x: 15, z: 15 }
    ];

    positions.forEach((pos, index) => {
      // Visual - glowing cylinder
      const mesh = MeshBuilder.createCylinder({
        radiusTop: 2,
        radiusBottom: 2,
        height: 5,
        radialSegments: 16,
        color: 0xffff00,
        emissive: 0xffff00,
        emissiveIntensity: 0.5
      });
      mesh.position.set(pos.x, 2.5, pos.z);
      this.add(mesh);

      // Physics sensor (trigger)
      const goalBody = physics.createCylinder({
        radiusTop: 2,
        radiusBottom: 2,
        height: 5,
        numSegments: 16,
        mass: 0,
        position: { x: pos.x, y: 2.5, z: pos.z }
      });

      // Make it a sensor (no collision, just detection)
      goalBody.collisionResponse = false;

      this.goals.push({
        mesh,
        body: goalBody,
        collected: false,
        position: pos
      });
    });
  }

  createWalls(physics) {
    // Create walls around the arena
    const wallHeight = 3;
    const wallThickness = 1;
    const arenaSize = 50;

    const walls = [
      { x: 0, z: arenaSize / 2, width: arenaSize, depth: wallThickness },  // North
      { x: 0, z: -arenaSize / 2, width: arenaSize, depth: wallThickness }, // South
      { x: arenaSize / 2, z: 0, width: wallThickness, depth: arenaSize },  // East
      { x: -arenaSize / 2, z: 0, width: wallThickness, depth: arenaSize }  // West
    ];

    walls.forEach(wall => {
      // Visual
      const mesh = MeshBuilder.createBox({
        width: wall.width,
        height: wallHeight,
        depth: wall.depth,
        color: 0x888888,
        receiveShadow: true,
        castShadow: true
      });
      mesh.position.set(wall.x, wallHeight / 2, wall.z);
      this.add(mesh);

      // Physics
      physics.createBox({
        width: wall.width,
        height: wallHeight,
        depth: wall.depth,
        mass: 0,
        position: { x: wall.x, y: wallHeight / 2, z: wall.z }
      });
    });
  }

  setupCamera() {
    const camera = this.engine.cameraManager.getActiveCamera();
    
    this.cameraController = new ThirdPersonCamera(camera, this.ball, {
      distance: 15,
      height: 8,
      smoothness: 0.15,
      minDistance: 5,
      maxDistance: 30
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
    input.bindAction('reset', ['KeyR']);
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.ball && this.cameraController) {
      this.updateBallPhysics(deltaTime);
      this.checkGoalCollisions();
      this.cameraController.update(deltaTime);
    }

    // Reset ball
    if (this.engine.inputManager.isActionPressed('reset')) {
      this.resetBall();
    }

    // Update UI
    this.updateUI();
  }

  updateBallPhysics(deltaTime) {
    const input = this.engine.inputManager;
    const physics = this.engine.physicsManager;
    const body = this.ball.physicsBody;

    if (!body) return;

    // Get camera direction
    const forward = this.cameraController.getForwardDirection();
    const right = this.cameraController.getRightDirection();

    // Apply forces based on input
    const force = { x: 0, y: 0, z: 0 };

    if (input.isActionDown('forward')) {
      force.x += forward.x * this.pushForce;
      force.z += forward.z * this.pushForce;
    }
    if (input.isActionDown('backward')) {
      force.x -= forward.x * this.pushForce;
      force.z -= forward.z * this.pushForce;
    }
    if (input.isActionDown('left')) {
      force.x -= right.x * this.pushForce;
      force.z -= right.z * this.pushForce;
    }
    if (input.isActionDown('right')) {
      force.x += right.x * this.pushForce;
      force.z += right.z * this.pushForce;
    }

    // Apply force to ball
    if (force.x !== 0 || force.z !== 0) {
      physics.applyForce(body, force);
    }

    // Sync visual with physics
    this.ball.position.copy(body.position);
    this.ball.mesh.position.copy(body.position);
    this.ball.mesh.quaternion.copy(body.quaternion);

    // Reset if ball falls off
    if (body.position.y < -10) {
      this.resetBall();
    }
  }

  checkGoalCollisions() {
    const ballPos = this.ball.position;

    this.goals.forEach(goal => {
      if (goal.collected) return;

      // Simple distance check
      const dx = ballPos.x - goal.position.x;
      const dz = ballPos.z - goal.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 3 && ballPos.y < 5) { // Within goal radius
        this.collectGoal(goal);
      }
    });
  }

  collectGoal(goal) {
    goal.collected = true;
    this.score += 10;

    // Visual feedback
    goal.mesh.material.emissiveIntensity = 2;
    goal.mesh.scale.set(1.5, 1.5, 1.5);

    // Show message
    const message = document.getElementById('goal-message');
    message.classList.add('show');
    setTimeout(() => message.classList.remove('show'), 1000);

    // Remove after animation
    setTimeout(() => {
      this.remove(goal.mesh);
      this.engine.physicsManager.removeBody(goal.body);
    }, 500);

    console.log('🎉 Goal collected! Score:', this.score);

    // Check if all goals collected
    const remaining = this.goals.filter(g => !g.collected).length;
    if (remaining === 0) {
      console.log('🏆 YOU WIN! All goals collected!');
      setTimeout(() => this.respawnGoals(), 2000);
    }
  }

  respawnGoals() {
    // Remove old goals
    this.goals.forEach(goal => {
      this.remove(goal.mesh);
      this.engine.physicsManager.removeBody(goal.body);
    });
    this.goals = [];

    // Create new goals
    this.createGoals(this.engine.physicsManager);
    console.log('✨ New goals spawned!');
  }

  resetBall() {
    const body = this.ball.physicsBody;
    if (!body) return;

    // Reset position
    body.position.set(0, 1, 0);
    body.velocity.set(0, 0, 0);
    body.angularVelocity.set(0, 0, 0);
    body.quaternion.setFromAxisAngle({ x: 0, y: 1, z: 0 }, 0);

    console.log('🔄 Ball reset!');
  }

  updateUI() {
    document.getElementById('fps').textContent = Math.round(this.engine.stats.fps);
    document.getElementById('score').textContent = this.score;
    
    if (this.ball && this.ball.physicsBody) {
      const vel = this.ball.physicsBody.velocity;
      const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
      document.getElementById('speed').textContent = speed.toFixed(1);
    }
  }
}

/**
 * Initialize and start the ball game
 */
function initGame() {
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true,
    physics: true,
    physicsConfig: {
      gravity: -20,
      iterations: 10
    }
  });

  engine.loadScene(BallGameScene);
  engine.start();

  console.log('⚽ Ball Game started!');
  console.log('🎯 Collect all yellow goals to win!');
}

window.addEventListener('DOMContentLoaded', initGame);

