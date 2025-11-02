/**
 * ⚽ Simple Ball Game - Using Simplified API
 * Roll a ball and collect goals!
 */
import { 
  GameEngine, 
  PhysicsScene,  // ← Using PhysicsScene instead of Scene!
  MeshBuilder,
  Color
} from '../../src/index.js';

class BallGameScene extends PhysicsScene {  // ← Simplified!
  constructor(engine) {
    super(engine);
    this.name = 'BallGameScene';
    this.backgroundColor = Color.SKY_BLUE;

    this.ball = null;
    this.camera = null;
    this.score = 0;
    this.goals = [];
    this.pushForce = 25;  // Stronger push force!
  }

  async load() {
    // ⚡ ONE LINE - Ground with physics + grid!
    this.addGround({ size: 100, showGrid: true });

    // ⚡ SIMPLIFIED - Ball with sphere physics!
    this.ball = this.addPlayer({
      position: { x: 0, y: 1, z: 0 },
      shape: 'sphere',
      color: 0xff4444,
      size: { width: 1 },  // radius
      mass: 0.5,  // Lighter = easier to push!
      speed: 0
    });

    // Custom damping for rolling ball
    this.ball.physicsBody.linearDamping = 0.2;  // Less damping = more responsive
    this.ball.physicsBody.angularDamping = 0.05;

    // ⚡ ONE LINE - Walls around arena!
    this.addWalls({ size: 50, height: 3 });

    // Create goals (game-specific, keep custom)
    this.createGoals();

    // ⚡ ONE LINE - Camera setup!
    this.camera = this.setupCamera(this.ball, { distance: 15, height: 8 });

    // ⚡ ONE LINE - Input setup!
    this.setupInput();

    await super.load();
  }

  createGoals() {
    // Create 5 goals around the arena using helper!
    const positions = [
      { x: 20, z: 0 },
      { x: -20, z: 0 },
      { x: 0, z: 20 },
      { x: 0, z: -20 },
      { x: 15, z: 15 }
    ];

    positions.forEach(pos => {
      // ⚡ Use addCollectible helper!
      const goal = this.addCollectible({
        position: { x: pos.x, y: 2.5, z: pos.z },
        shape: 'cylinder',
        color: 0xffff00,
        glow: true,
        isTrigger: true,
        size: { radius: 2, height: 5 }
      });

      this.goals.push(goal);
    });
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.ball && this.camera) {
      this.updateBallPhysics(deltaTime);
      this.checkGoalCollisions();
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

    // ⚡ Use helper to push ball!
    if (dir.x !== 0 || dir.z !== 0) {
      this.pushActor(this.ball, dir, this.pushForce);
    }

    // ✅ NO SYNC NEEDED! Auto-syncs in Actor.update()

    // Reset if ball falls off
    if (body.position.y < -10) {
      this.resetBall();
    }
  }

  checkGoalCollisions() {
    this.goals.forEach(goal => {
      if (goal.collected) return;

      // ⚡ Use helper for distance check!
      if (this.isNear(this.ball, goal, 3) && this.ball.position.y < 5) {
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

