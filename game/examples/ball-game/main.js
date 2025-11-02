/**
 * ⚽ Simple Ball Game - Using Simplified API
 * Roll a ball and collect goals!
 */
import { 
  GameEngine, 
  Scene,
  Actor,
  MeshBuilder,
  Color,
  ThirdPersonCamera
} from '../../src/index.js';

class BallGameScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'BallGameScene';
    this.backgroundColor = Color.SKY_BLUE;

    this.ball = null;
    this.camera = null;
    this.score = 0;
    this.goals = [];
    this.maxSpeed = 40;  // Max ball speed
  }

  async load() {
    // Create ground
    const ground = MeshBuilder.createPlane({
      width: 100,
      height: 100,
      color: Color.GRASS,
      receiveShadow: true
    });
    ground.rotation.x = -Math.PI / 2;
    this.threeScene.add(ground);

    // Ground physics
    this.engine.physicsManager.createPlane({ position: { x: 0, y: 0, z: 0 } });

    // Create ball
    this.ball = new Actor({ name: 'Ball', speed: 0 });
    this.ball.mesh = MeshBuilder.createSphere({
      radius: 1,
      color: 0xff4444,
      castShadow: true
    });
    this.ball.setPosition(0, 2, 0);
    this.addEntity(this.ball);

    // Enable physics on ball
    this.ball.enablePhysics({
      type: 'sphere',
      radius: 1,
      mass: 0.5
    });
    
    this.ball.physicsBody.linearDamping = 0.1;  // Low damping since we control velocity
    this.ball.physicsBody.angularDamping = 0.05;  // Let it roll freely

    // Wake up the body and prevent sleep
    this.ball.physicsBody.wakeUp();
    this.ball.physicsBody.allowSleep = false;

    // Create walls
    this.createWalls();

    // Create goals
    this.createGoals();

    // Setup camera
    this.camera = new ThirdPersonCamera(
      this.engine.cameraManager.getActiveCamera(),
      this.ball,
      { distance: 15, height: 8, smoothness: 0.15 }
    );
    this.camera.setInputManager(this.engine.inputManager);

    // Setup input
    this.setupInput();

    await super.load();
  }

  createWalls() {
    const size = 50;
    const height = 3;
    const thickness = 1;

    const walls = [
      { x: 0, z: size/2, width: size, depth: thickness },      // Front
      { x: 0, z: -size/2, width: size, depth: thickness },     // Back
      { x: size/2, z: 0, width: thickness, depth: size },      // Right
      { x: -size/2, z: 0, width: thickness, depth: size }      // Left
    ];

    walls.forEach(wall => {
      const mesh = MeshBuilder.createBox({
        width: wall.width,
        height,
        depth: wall.depth,
        color: 0x666666,
        castShadow: true,
        receiveShadow: true
      });
      mesh.position.set(wall.x, height/2, wall.z);
      this.threeScene.add(mesh);

      // Physics wall
      this.engine.physicsManager.createBox({
        width: wall.width,
        height,
        depth: wall.depth,
        position: { x: wall.x, y: height/2, z: wall.z },
        mass: 0
      });
    });
  }

  createGoals() {
    const positions = [
      { x: 20, z: 0 },
      { x: -20, z: 0 },
      { x: 0, z: 20 },
      { x: 0, z: -20 },
      { x: 15, z: 15 }
    ];

    this.goals = [];
    positions.forEach(pos => {
      const mesh = MeshBuilder.createCylinder({
        radiusTop: 2,
        radiusBottom: 2,
        height: 5,
        color: Color.YELLOW,
        emissive: Color.YELLOW,
        emissiveIntensity: 0.5
      });
      mesh.position.set(pos.x, 2.5, pos.z);
      this.threeScene.add(mesh);

      // Physics body for goal (sensor/trigger)
      const body = this.engine.physicsManager.createCylinder({
        radiusTop: 2,
        radiusBottom: 2,
        height: 5,
        position: { x: pos.x, y: 2.5, z: pos.z },
        mass: 0
      });
      body.isTrigger = true;

      this.goals.push({ mesh, body, position: pos });
    });
  }

  setupInput() {
    const input = this.engine.inputManager;
    input.bindAction('forward', ['KeyW', 'ArrowUp']);
    input.bindAction('backward', ['KeyS', 'ArrowDown']);
    input.bindAction('left', ['KeyA', 'ArrowLeft']);
    input.bindAction('right', ['KeyD', 'ArrowRight']);
    input.bindAction('reset', ['KeyR']);
  }

  update(deltaTime, elapsedTime) {
    // ✅ APPLY INPUT/FORCES FIRST (before physics step!)
    if (this.ball && this.camera) {
      this.updateBallPhysics(deltaTime);
      this.checkGoalCollisions();
    }

    // ✅ THEN step physics
    if (this.engine.physicsManager) {
      this.engine.physicsManager.update(deltaTime);
    }

    // ✅ THEN update entities (auto-syncs physics → visual)
    super.update(deltaTime, elapsedTime);

    // Update camera
    if (this.camera) {
      this.camera.update(deltaTime);
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
    const body = this.ball.physicsBody;

    if (!body) return;

    // Get camera direction
    const forward = this.camera.getForwardDirection();
    const right = this.camera.getRightDirection();

    // Calculate push direction
    const dir = { x: 0, y: 0, z: 0 };

    if (input.isActionDown('forward')) {
      dir.x += forward.x;
      dir.z += forward.z;
    }
    if (input.isActionDown('backward')) {
      dir.x -= forward.x;
      dir.z -= forward.z;
    }
    if (input.isActionDown('left')) {
      dir.x -= right.x;
      dir.z -= right.z;
    }
    if (input.isActionDown('right')) {
      dir.x += right.x;
      dir.z += right.z;
    }

    // Apply velocity to ball (better control than impulse)
    if (dir.x !== 0 || dir.z !== 0) {
      // Normalize direction
      const length = Math.sqrt(dir.x * dir.x + dir.z * dir.z);
      dir.x /= length;
      dir.z /= length;
      
      // Set target velocity
      body.velocity.x = dir.x * this.maxSpeed;
      body.velocity.z = dir.z * this.maxSpeed;
    } else {
      // Apply damping when no input
      body.velocity.x *= 0.9;
      body.velocity.z *= 0.9;
    }

    // Reset if ball falls off
    if (body.position.y < -10) {
      this.resetBall();
    }
  }

  checkGoalCollisions() {
    this.goals.forEach(goal => {
      if (goal.collected) return;

      // Check distance
      const dx = this.ball.position.x - goal.position.x;
      const dz = this.ball.position.z - goal.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      if (distance < 3 && this.ball.position.y < 5) {
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
    this.createGoals();
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

