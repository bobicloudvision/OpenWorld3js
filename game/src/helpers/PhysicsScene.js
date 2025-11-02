/**
 * Physics Scene
 * Extended scene with built-in physics helpers
 */
import { Scene } from '../scenes/Scene.js';
import { GameHelpers } from './GameHelpers.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';

/**
 * PhysicsScene - Scene with physics helpers pre-configured
 * Use this instead of Scene for physics-based games
 */
export class PhysicsScene extends Scene {
  constructor(engine) {
    super(engine);
    
    // Helper instance
    this.helpers = new GameHelpers(this);
    
    // Common physics settings
    this.gravity = -25;
  }

  /**
   * Initialize with better defaults for physics games
   */
  async initialize() {
    await super.initialize();
    
    // Better lighting for games
    this.ambientLight.intensity = 0.6;
    this.directionalLight.intensity = 0.8;
    this.directionalLight.position.set(10, 20, 10);
    
    // Setup fog if background is set
    if (this.backgroundColor) {
      this.setFog(this.backgroundColor, 50, 200);
    }
  }

  /**
   * Update - step physics before updating entities
   */
  update(deltaTime, elapsedTime) {
    // Step physics world
    if (this.engine.physicsManager) {
      console.log('⏱️ Stepping physics with deltaTime:', deltaTime.toFixed(4));
      this.engine.physicsManager.update(deltaTime);
    } else {
      console.error('❌ No physics manager!');
    }
    
    // Update all entities (which will auto-sync physics → visual)
    super.update(deltaTime, elapsedTime);
  }

  /**
   * Quick ground creation
   */
  addGround(options) {
    return this.helpers.createGround(options);
  }

  /**
   * Quick player creation
   */
  addPlayer(options) {
    return this.helpers.createPlayer(options);
  }

  /**
   * Quick collectible creation
   */
  addCollectible(options) {
    return this.helpers.createCollectible(options);
  }

  /**
   * Quick walls creation
   */
  addWalls(options) {
    return this.helpers.createWalls(options);
  }

  /**
   * Quick camera setup
   */
  setupCamera(target, options = {}) {
    const {
      distance = 12,
      height = 6,
      smoothness = 0.15
    } = options;

    const camera = this.engine.cameraManager.getActiveCamera();
    
    const controller = new ThirdPersonCamera(camera, target, {
      distance,
      height,
      smoothness,
      minDistance: 5,
      maxDistance: 25
    });

    controller.setInputManager(this.engine.inputManager);
    return controller;
  }

  /**
   * Quick input setup
   */
  setupInput(bindings) {
    console.log('🎮 PhysicsScene.setupInput called');
    return this.helpers.setupInput(bindings);
  }

  /**
   * Check if two objects are close
   */
  isNear(obj1, obj2, distance) {
    return this.helpers.checkDistance(obj1.position, obj2.position, distance);
  }

  /**
   * Move actor with physics force
   */
  pushActor(actor, direction, force) {
    return this.helpers.moveActorWithForce(actor, direction, force);
  }

  /**
   * Make actor jump
   */
  jumpActor(actor, force) {
    return this.helpers.makeActorJump(actor, force);
  }
}

