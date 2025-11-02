/**
 * ⚡ SUPER SIMPLE GAME - Using Simplified API
 * Look how easy it is now!
 */
import { 
  GameEngine, 
  PhysicsScene,  // ← New! Extended scene with helpers
  Color,
  ThirdPersonCamera
} from '../../src/index.js';

class SimpleGame extends PhysicsScene {
  constructor(engine) {
    super(engine);
    this.backgroundColor = Color.SKY_BLUE;
    this.score = 0;
    this.collectibles = [];
  }

  async load() {
    // ⚡ ONE LINE to create ground with physics!
    this.addGround({ size: 100, showGrid: true });

    // ⚡ ONE LINE to create player with physics!
    this.player = this.addPlayer({
      position: { x: 0, y: 2, z: 0 },
      shape: 'box',
      color: Color.BLUE,
      speed: 8
    });

    // ⚡ ONE LINE to create walls!
    this.addWalls({ size: 50, height: 3 });

    // ⚡ EASY collectible creation!
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const collectible = this.addCollectible({
        position: { 
          x: Math.cos(angle) * 20, 
          y: 2.5, 
          z: Math.sin(angle) * 20 
        },
        color: Color.YELLOW,
        glow: true
      });
      this.collectibles.push(collectible);
    }

    // ⚡ ONE LINE to setup camera!
    this.camera = this.setupCamera(this.player, {
      distance: 15,
      height: 8
    });

    // ⚡ ONE LINE to setup input!
    this.setupInput();

    await super.load();
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Move player
    this.handleMovement();

    // Check collectibles
    this.checkCollectibles();

    // Update camera
    this.camera.update(deltaTime);

    // Update UI
    document.getElementById('score').textContent = this.score;
  }

  handleMovement() {
    const input = this.engine.inputManager;
    const forward = this.camera.getForwardDirection();
    const right = this.camera.getRightDirection();

    // Calculate movement
    const dir = { x: 0, y: 0, z: 0 };
    if (input.isActionDown('forward')) { dir.x += forward.x; dir.z += forward.z; }
    if (input.isActionDown('backward')) { dir.x -= forward.x; dir.z -= forward.z; }
    if (input.isActionDown('left')) { dir.x -= right.x; dir.z -= right.z; }
    if (input.isActionDown('right')) { dir.x += right.x; dir.z += right.z; }

    // ⚡ EASY force-based movement!
    if (dir.x !== 0 || dir.z !== 0) {
      this.pushActor(this.player, dir, 15);
    }

    // ⚡ EASY jump!
    if (input.isActionPressed('jump')) {
      this.jumpActor(this.player, 80);
    }

    // Sync mesh with physics
    this.player.mesh.position.copy(this.player.physicsBody.position);
    this.player.mesh.quaternion.copy(this.player.physicsBody.quaternion);
  }

  checkCollectibles() {
    this.collectibles.forEach(item => {
      if (item.collected) return;

      // ⚡ EASY distance check!
      if (this.isNear(this.player, item, 3)) {
        item.collected = true;
        this.score += 10;

        // Visual feedback
        item.mesh.scale.set(1.5, 1.5, 1.5);
        setTimeout(() => {
          this.remove(item.mesh);
          this.engine.physicsManager.removeBody(item.body);
        }, 300);

        console.log('🎉 Score:', this.score);
      }
    });
  }
}

// ⚡ Start game - super simple!
const engine = new GameEngine({
  canvas: document.getElementById('game-canvas'),
  physics: true,
  physicsConfig: { gravity: -25 }
});

engine.loadScene(SimpleGame);
engine.start();

console.log('⚡ Simple game started with easy API!');

