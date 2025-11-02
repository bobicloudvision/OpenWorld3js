/**
 * ⚡ Super Simple Physics - One-Line API
 * Enable/disable physics with one line!
 */
import { 
  GameEngine, 
  PhysicsScene,
  Actor,
  MeshBuilder,
  Color
} from '../../src/index.js';

class SimplePhysicsScene extends PhysicsScene {
  constructor(engine) {
    super(engine);
    this.backgroundColor = Color.SKY_BLUE;
    this.cubes = [];
  }

  async load() {
    // Ground
    this.addGround({ size: 100, showGrid: true });

    // ⚡ Create player WITHOUT physics first
    this.player = new Actor({ name: 'Player', speed: 8 });
    
    // Add mesh
    this.player.mesh = MeshBuilder.createBox({
      width: 1,
      height: 2,
      depth: 1,
      color: Color.BLUE,
      castShadow: true
    });
    
    // Set position (auto-syncs mesh!)
    this.player.setPosition(0, 2, 0);
    
    this.addEntity(this.player);

    // ⚡ NOW enable physics with ONE LINE!
    this.player.enablePhysics({
      shape: 'box',
      mass: 5,
      width: 1,
      height: 2,
      depth: 1,
      fixedRotation: true,
      linearDamping: 0.1
    });

    // Create some cubes
    for (let i = 0; i < 5; i++) {
      const cube = new Actor({ name: `Cube${i}` });
      cube.mesh = MeshBuilder.createBox({
        width: 1,
        height: 1,
        depth: 1,
        color: Color.random(),
        castShadow: true
      });
      
      const angle = (i / 5) * Math.PI * 2;
      const x = Math.cos(angle) * 10;
      const y = 5 + i * 2;
      const z = Math.sin(angle) * 10;
      
      cube.setPosition(x, y, z);  // Auto-syncs mesh!
      
      this.addEntity(cube);
      
      // ⚡ Enable physics - ONE LINE!
      cube.enablePhysics({
        shape: 'box',
        mass: 2,
        restitution: 0.5  // Bouncy!
      });
      
      this.cubes.push(cube);
    }

    // Walls
    this.addWalls({ size: 50, height: 3 });

    // Camera
    this.camera = this.setupCamera(this.player, { distance: 15, height: 8 });

    // Input
    this.setupInput({ toggle: ['KeyT'] });

    await super.load();
  }

  update(deltaTime) {
    super.update(deltaTime);

    if (this.player && this.camera) {
      this.handleMovement(deltaTime);
      this.handleToggles();
      this.handleSpawn();
      this.camera.update(deltaTime);
    }
  }

  handleMovement(deltaTime) {
    const input = this.engine.inputManager;
    const forward = this.camera.getForwardDirection();
    const right = this.camera.getRightDirection();

    const dir = { x: 0, y: 0, z: 0 };
    if (input.isActionDown('forward')) { dir.x += forward.x; dir.z += forward.z; }
    if (input.isActionDown('backward')) { dir.x -= forward.x; dir.z -= forward.z; }
    if (input.isActionDown('left')) { dir.x -= right.x; dir.z -= right.z; }
    if (input.isActionDown('right')) { dir.x += right.x; dir.z += right.z; }

    if (dir.x !== 0 || dir.z !== 0) {
      this.pushActor(this.player, dir, 15);
    }

    if (input.isActionPressed('jump')) {
      this.jumpActor(this.player, 80);
    }

    // ✅ NO SYNC NEEDED! Auto-syncs in Actor.update()
  }

  handleToggles() {
    const input = this.engine.inputManager;
    
    // ⚡ Toggle physics on/off with T key!
    if (input.isActionPressed('toggle')) {
      if (this.player.physicsEnabled) {
        console.log('❌ Physics DISABLED');
        this.player.disablePhysics();
      } else {
        console.log('✅ Physics ENABLED');
        this.player.enablePhysics({
          shape: 'box',
          mass: 5,
          fixedRotation: true
        });
      }
    }
  }

  handleSpawn() {
    const input = this.engine.inputManager;
    
    if (input.isActionPressed('action')) {
      // Spawn new cube
      const cube = new Actor({ name: `Cube${Date.now()}` });
      cube.mesh = MeshBuilder.createBox({
        width: 1,
        height: 1,
        depth: 1,
        color: Color.random(),
        castShadow: true
      });
      
      const x = this.player.position.x;
      const y = this.player.position.y + 5;
      const z = this.player.position.z;
      
      cube.setPosition(x, y, z);  // Auto-syncs mesh!
      
      this.addEntity(cube);
      
      // ⚡ Enable physics - ONE LINE!
      cube.enablePhysics({ mass: 2, restitution: 0.8 });
      
      this.cubes.push(cube);
      
      console.log('📦 Spawned cube with physics!');
    }
  }
}

// Start
const engine = new GameEngine({
  canvas: document.getElementById('game-canvas'),
  physics: true,
  physicsConfig: { gravity: -25 }
});

engine.loadScene(SimplePhysicsScene);
engine.start();

console.log('⚡ Super Simple Physics Demo!');
console.log('✅ Use: actor.enablePhysics()');
console.log('❌ Use: actor.disablePhysics()');

