/**
 * Game Helpers
 * High-level helpers to simplify game creation
 */
import { Actor } from '../entities/Actor.js';
import { MeshBuilder, Color } from '../graphics/Mesh.js';
import { ThirdPersonCamera } from '../camera/ThirdPersonCamera.js';

/**
 * Quick helpers for common game objects
 */
export class GameHelpers {
  constructor(scene) {
    this.scene = scene;
    this.engine = scene.engine;
    this.physics = scene.engine.physicsManager;
  }

  /**
   * Create a ground plane with physics
   * @param {object} options - Ground options
   */
  createGround(options = {}) {
    const {
      size = 100,
      color = Color.GRASS,
      showGrid = true
    } = options;

    // Visual mesh
    const ground = MeshBuilder.createPlane({
      width: size,
      height: size,
      color,
      receiveShadow: true
    });
    ground.rotation.x = -Math.PI / 2;
    this.scene.add(ground);

    // Grid helper
    if (showGrid) {
      const grid = MeshBuilder.createGrid({
        size,
        divisions: size / 2,
        color: 0x444444
      });
      grid.position.y = 0.01;
      this.scene.add(grid);
    }

    // Physics
    if (this.physics) {
      this.physics.createPlane({
        mass: 0,
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: -Math.PI / 2, y: 0, z: 0 }
      });
    }

    return ground;
  }

  /**
   * Create a player with physics
   * @param {object} options - Player options
   */
  createPlayer(options = {}) {
    const {
      position = { x: 0, y: 2, z: 0 },
      shape = 'box', // 'box', 'sphere', 'capsule'
      color = Color.BLUE,
      speed = 8,
      mass = 5,
      size = { width: 1, height: 2, depth: 1 }
    } = options;

    // Create mesh based on shape
    let mesh;
    if (shape === 'sphere') {
      mesh = MeshBuilder.createSphere({
        radius: size.width || 1,
        color,
        castShadow: true
      });
    } else if (shape === 'capsule') {
      mesh = MeshBuilder.createCapsule({
        radius: size.width || 0.5,
        length: size.height || 1.5,
        color,
        castShadow: true
      });
    } else {
      mesh = MeshBuilder.createBox({
        width: size.width || 1,
        height: size.height || 2,
        depth: size.depth || 1,
        color,
        castShadow: true
      });
    }

    // Create actor
    const player = new Actor({
      name: 'Player',
      speed
    });

    player.mesh = mesh;
    player.setPosition(position.x, position.y, position.z);
    
    // Add mesh to scene (important!)
    this.scene.add(mesh);

    // Add physics if available
    if (this.physics) {
      const bodyOptions = {
        type: shape === 'sphere' ? 'sphere' : 'box',
        mass
      };

      if (shape === 'sphere') {
        bodyOptions.radius = size.width || 1;
      } else {
        bodyOptions.width = size.width || 1;
        bodyOptions.height = size.height || 2;
        bodyOptions.depth = size.depth || 1;
      }

      const body = this.physics.addToEntity(player, bodyOptions);
      
      // Don't lock rotation for spheres (they need to roll!)
      if (shape !== 'sphere') {
        body.fixedRotation = true;
        body.updateMassProperties();
      }
      
      body.linearDamping = 0.1;
    }

    this.scene.addEntity(player);
    return player;
  }

  /**
   * Create a collectible object
   * @param {object} options - Collectible options
   */
  createCollectible(options = {}) {
    const {
      position = { x: 0, y: 1, z: 0 },
      shape = 'cylinder',
      color = Color.YELLOW,
      size = { radius: 2, height: 5 },
      glow = true,
      isTrigger = true
    } = options;

    // Create mesh
    let mesh;
    if (shape === 'sphere') {
      mesh = MeshBuilder.createSphere({
        radius: size.radius || 1,
        color,
        castShadow: true,
        emissive: glow ? color : 0x000000,
        emissiveIntensity: glow ? 0.5 : 0
      });
    } else if (shape === 'cylinder') {
      mesh = MeshBuilder.createCylinder({
        radiusTop: size.radius || 2,
        radiusBottom: size.radius || 2,
        height: size.height || 5,
        color,
        emissive: glow ? color : 0x000000,
        emissiveIntensity: glow ? 0.5 : 0
      });
    } else {
      mesh = MeshBuilder.createBox({
        width: size.width || 1,
        height: size.height || 1,
        depth: size.depth || 1,
        color,
        castShadow: true
      });
    }

    mesh.position.set(position.x, position.y, position.z);
    this.scene.add(mesh);

    // Add physics if available
    let body = null;
    if (this.physics) {
      if (shape === 'sphere') {
        body = this.physics.createSphere({
          radius: size.radius || 1,
          mass: 0,
          position
        });
      } else if (shape === 'cylinder') {
        body = this.physics.createCylinder({
          radiusTop: size.radius || 2,
          radiusBottom: size.radius || 2,
          height: size.height || 5,
          mass: 0,
          position
        });
      } else {
        body = this.physics.createBox({
          width: size.width || 1,
          height: size.height || 1,
          depth: size.depth || 1,
          mass: 0,
          position
        });
      }

      // Make it a trigger if requested
      if (isTrigger) {
        body.collisionResponse = false;
      }
    }

    return { mesh, body, position, collected: false };
  }

  /**
   * Create walls around an area
   * @param {object} options - Wall options
   */
  createWalls(options = {}) {
    const {
      size = 50,
      height = 3,
      thickness = 1,
      color = Color.GRAY
    } = options;

    const walls = [
      { x: 0, z: size / 2, width: size, depth: thickness },  // North
      { x: 0, z: -size / 2, width: size, depth: thickness }, // South
      { x: size / 2, z: 0, width: thickness, depth: size },  // East
      { x: -size / 2, z: 0, width: thickness, depth: size }  // West
    ];

    const createdWalls = [];

    walls.forEach(wall => {
      // Visual
      const mesh = MeshBuilder.createBox({
        width: wall.width,
        height,
        depth: wall.depth,
        color,
        receiveShadow: true,
        castShadow: true
      });
      mesh.position.set(wall.x, height / 2, wall.z);
      this.scene.add(mesh);

      // Physics
      let body = null;
      if (this.physics) {
        body = this.physics.createBox({
          width: wall.width,
          height,
          depth: wall.depth,
          mass: 0,
          position: { x: wall.x, y: height / 2, z: wall.z }
        });
      }

      createdWalls.push({ mesh, body });
    });

    return createdWalls;
  }

  /**
   * Setup basic third-person camera
   * @param {Actor} target - Target to follow
   * @param {object} options - Camera options
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
   * Setup common input bindings
   * @param {object} bindings - Custom bindings (optional)
   */
  setupInput(bindings = {}) {
    const input = this.engine.inputManager;

    const defaultBindings = {
      forward: ['KeyW', 'ArrowUp'],
      backward: ['KeyS', 'ArrowDown'],
      left: ['KeyA', 'ArrowLeft'],
      right: ['KeyD', 'ArrowRight'],
      jump: ['Space'],
      action: ['KeyE'],
      reset: ['KeyR'],
      ...bindings
    };

    Object.entries(defaultBindings).forEach(([action, keys]) => {
      input.bindAction(action, keys);
    });
  }

  /**
   * Check distance between two positions
   */
  checkDistance(pos1, pos2, maxDistance) {
    const dx = pos1.x - pos2.x;
    const dy = (pos1.y || 0) - (pos2.y || 0);
    const dz = pos1.z - pos2.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    return distance <= maxDistance;
  }

  /**
   * Apply force to move an actor (physics-based)
   */
  moveActorWithForce(actor, direction, force) {
    if (!actor.physicsBody) return;

    const forceVector = {
      x: direction.x * force,
      y: direction.y * force,
      z: direction.z * force
    };

    this.physics.applyForce(actor.physicsBody, forceVector);
  }

  /**
   * Make actor jump
   */
  makeActorJump(actor, jumpForce = 80) {
    if (!actor.physicsBody) return;
    
    // Simple ground check
    const body = actor.physicsBody;
    const isGrounded = body.position.y < 2 && Math.abs(body.velocity.y) < 1;
    
    if (isGrounded) {
      this.physics.applyImpulse(body, { x: 0, y: jumpForce, z: 0 });
      return true;
    }
    return false;
  }
}

