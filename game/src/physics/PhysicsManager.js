import * as CANNON from 'cannon-es';
import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

/**
 * Physics Manager
 * Wraps Cannon.js physics engine
 * Keeps physics logic separate from game scenes
 * 
 * ✅ Supported Cannon.js Parameters:
 * 
 * MATERIAL PROPERTIES:
 * - restitution: Bounciness (0 = no bounce, 1 = perfect bounce)
 * - friction: Surface friction (0 = ice, 1 = rubber)
 * 
 * DAMPING:
 * - linearDamping: Velocity reduction over time (default: 0.01)
 * - angularDamping: Rotation reduction over time (default: 0.01)
 * 
 * MOVEMENT RESTRICTIONS:
 * - fixedRotation: Prevent all rotation (useful for character controllers)
 * - linearFactor: Restrict movement on axes {x, y, z} (0 = locked, 1 = free)
 * - angularFactor: Restrict rotation on axes {x, y, z} (0 = locked, 1 = free)
 * 
 * PERFORMANCE:
 * - allowSleep: Enable sleep optimization (default: true)
 * - sleepSpeedLimit: Speed below which body can sleep (default: 0.1)
 * - sleepTimeLimit: Time before body sleeps (default: 1)
 * 
 * COLLISION FILTERING:
 * - collisionFilterGroup: Collision layer (bitmask, default: 1)
 * - collisionFilterMask: What layers this body collides with (bitmask, default: -1)
 * - collisionResponse: Whether body physically responds to collisions
 * - isTrigger: Trigger volume (fires events but no collision response)
 * 
 * EXAMPLES:
 * 
 * // Character controller (no rotation, only horizontal movement)
 * createBox({ 
 *   fixedRotation: true,
 *   linearFactor: { x: 1, y: 1, z: 1 }
 * })
 * 
 * // Collectible item (trigger only)
 * createSphere({ 
 *   isTrigger: true,
 *   collisionResponse: false
 * })
 * 
 * // Player (group 1) only collides with enemies (group 2)
 * createBox({ 
 *   collisionFilterGroup: 1,  // Player group
 *   collisionFilterMask: 2    // Only collide with group 2
 * })
 */
export class PhysicsManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      gravity: config.gravity !== undefined ? config.gravity : -9.82,
      iterations: config.iterations || 10,
      tolerance: config.tolerance || 0.001,
      debug: config.debug || false, // ✅ NEW: Debug visualization
      ...config
    };

    // Cannon.js world
    this.world = null;
    
    // Physics bodies registry
    this.bodies = new Map();
    
    // Track which entities have physics
    this.physicsBodies = new Map(); // entity.id -> body

    this.isEnabled = true;

    // ✅ NEW: Debug visualization
    this.debugEnabled = this.config.debug;
    this.debugMeshes = new Map(); // body.id -> debug mesh
    this.debugScene = null; // Will be set by engine

    this._initialize();
  }

  /**
   * Initialize physics world
   */
  _initialize() {
    // Create Cannon.js world
    this.world = new CANNON.World();
    this.world.gravity.set(0, this.config.gravity, 0);
    
    // Solver settings
    this.world.solver.iterations = this.config.iterations;
    this.world.solver.tolerance = this.config.tolerance;

    // Broadphase (collision detection optimization)
    this.world.broadphase = new CANNON.NaiveBroadphase();
    
    // Allow sleeping (performance optimization)
    this.world.allowSleep = true;

    this.emit('initialized');
  }

  /**
   * Create a box physics body
   */
  createBox(options = {}) {
    const {
      width = 1,
      height = 1,
      depth = 1,
      mass = 1,
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: 0, y: 0, z: 0 },
      material = null,
      restitution = 0.3,  // Bounciness
      friction = 0.3,     // Friction
      linearDamping = 0.01,  // Linear velocity damping
      angularDamping = 0.01, // Angular velocity damping
      fixedRotation = false, // Prevent rotation
      allowSleep = true,     // Performance optimization
      sleepSpeedLimit = 0.1, // Speed below which body can sleep
      sleepTimeLimit = 1,    // Time before body sleeps
      collisionFilterGroup = 1, // Collision group
      collisionFilterMask = -1, // What groups this body collides with
      collisionResponse = true,  // Whether body responds to collisions
      isTrigger = false,    // Trigger volume (no collision response)
      linearFactor = null,  // Restrict movement on axes {x,y,z}
      angularFactor = null  // Restrict rotation on axes {x,y,z}
    } = options;

    // Create material if not provided but restitution/friction specified
    let bodyMaterial = material;
    if (!bodyMaterial) {
      bodyMaterial = new CANNON.Material();
      bodyMaterial.restitution = restitution;
      bodyMaterial.friction = friction;
    }

    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({ 
      mass, 
      material: bodyMaterial,
      linearDamping,
      angularDamping,
      fixedRotation,
      allowSleep,
      sleepSpeedLimit,
      sleepTimeLimit,
      collisionFilterGroup,
      collisionFilterMask,
      collisionResponse,
      isTrigger
    });
    
    // Explicitly set body type based on mass
    if (mass > 0) {
      body.type = CANNON.Body.DYNAMIC;
    }
    
    // Set movement/rotation restrictions if provided
    if (linearFactor) {
      body.linearFactor.set(
        linearFactor.x !== undefined ? linearFactor.x : 1,
        linearFactor.y !== undefined ? linearFactor.y : 1,
        linearFactor.z !== undefined ? linearFactor.z : 1
      );
    }
    
    if (angularFactor) {
      body.angularFactor.set(
        angularFactor.x !== undefined ? angularFactor.x : 1,
        angularFactor.y !== undefined ? angularFactor.y : 1,
        angularFactor.z !== undefined ? angularFactor.z : 1
      );
    }
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    
    if (rotation.x || rotation.y || rotation.z) {
      body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
    }

    this.world.addBody(body);
    this.bodies.set(body.id, body);

    // ✅ NEW: Create debug mesh if debug is enabled
    if (this.debugEnabled) {
      this.createDebugMesh(body);
    }

    return body;
  }

  /**
   * Create a sphere physics body
   */
  createSphere(options = {}) {
    const {
      radius = 1,
      mass = 1,
      position = { x: 0, y: 0, z: 0 },
      material = null,
      restitution = 0.3,  // Bounciness
      friction = 0.3,     // Friction
      linearDamping = 0.01,  // Linear velocity damping
      angularDamping = 0.01, // Angular velocity damping
      fixedRotation = false, // Prevent rotation
      allowSleep = true,     // Performance optimization
      sleepSpeedLimit = 0.1, // Speed below which body can sleep
      sleepTimeLimit = 1,    // Time before body sleeps
      collisionFilterGroup = 1, // Collision group
      collisionFilterMask = -1, // What groups this body collides with
      collisionResponse = true,  // Whether body responds to collisions
      isTrigger = false,    // Trigger volume (no collision response)
      linearFactor = null,  // Restrict movement on axes {x,y,z}
      angularFactor = null  // Restrict rotation on axes {x,y,z}
    } = options;

    // Create material if not provided but restitution/friction specified
    let bodyMaterial = material;
    if (!bodyMaterial) {
      bodyMaterial = new CANNON.Material();
      bodyMaterial.restitution = restitution;
      bodyMaterial.friction = friction;
    }

    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({ 
      mass, 
      material: bodyMaterial,
      linearDamping,
      angularDamping,
      fixedRotation,
      allowSleep,
      sleepSpeedLimit,
      sleepTimeLimit,
      collisionFilterGroup,
      collisionFilterMask,
      collisionResponse,
      isTrigger
    });
    
    // Explicitly set body type based on mass
    if (mass > 0) {
      body.type = CANNON.Body.DYNAMIC;
    }
    
    // Set movement/rotation restrictions if provided
    if (linearFactor) {
      body.linearFactor.set(
        linearFactor.x !== undefined ? linearFactor.x : 1,
        linearFactor.y !== undefined ? linearFactor.y : 1,
        linearFactor.z !== undefined ? linearFactor.z : 1
      );
    }
    
    if (angularFactor) {
      body.angularFactor.set(
        angularFactor.x !== undefined ? angularFactor.x : 1,
        angularFactor.y !== undefined ? angularFactor.y : 1,
        angularFactor.z !== undefined ? angularFactor.z : 1
      );
    }
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);

    this.world.addBody(body);
    this.bodies.set(body.id, body);

    // ✅ NEW: Create debug mesh if debug is enabled
    if (this.debugEnabled) {
      this.createDebugMesh(body);
    }

    return body;
  }

  /**
   * Create a cylinder physics body
   */
  createCylinder(options = {}) {
    const {
      radiusTop = 1,
      radiusBottom = 1,
      height = 1,
      numSegments = 8,
      mass = 1,
      position = { x: 0, y: 0, z: 0 },
      material = null,
      restitution = 0.3,  // Bounciness
      friction = 0.3,     // Friction
      linearDamping = 0.01,  // Linear velocity damping
      angularDamping = 0.01, // Angular velocity damping
      fixedRotation = false, // Prevent rotation
      allowSleep = true,     // Performance optimization
      sleepSpeedLimit = 0.1, // Speed below which body can sleep
      sleepTimeLimit = 1,    // Time before body sleeps
      collisionFilterGroup = 1, // Collision group
      collisionFilterMask = -1, // What groups this body collides with
      collisionResponse = true,  // Whether body responds to collisions
      isTrigger = false,    // Trigger volume (no collision response)
      linearFactor = null,  // Restrict movement on axes {x,y,z}
      angularFactor = null  // Restrict rotation on axes {x,y,z}
    } = options;

    // Create material if not provided but restitution/friction specified
    let bodyMaterial = material;
    if (!bodyMaterial) {
      bodyMaterial = new CANNON.Material();
      bodyMaterial.restitution = restitution;
      bodyMaterial.friction = friction;
    }

    const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
    const body = new CANNON.Body({ 
      mass, 
      material: bodyMaterial,
      linearDamping,
      angularDamping,
      fixedRotation,
      allowSleep,
      sleepSpeedLimit,
      sleepTimeLimit,
      collisionFilterGroup,
      collisionFilterMask,
      collisionResponse,
      isTrigger
    });
    
    // Explicitly set body type based on mass
    if (mass > 0) {
      body.type = CANNON.Body.DYNAMIC;
    }
    
    // Set movement/rotation restrictions if provided
    if (linearFactor) {
      body.linearFactor.set(
        linearFactor.x !== undefined ? linearFactor.x : 1,
        linearFactor.y !== undefined ? linearFactor.y : 1,
        linearFactor.z !== undefined ? linearFactor.z : 1
      );
    }
    
    if (angularFactor) {
      body.angularFactor.set(
        angularFactor.x !== undefined ? angularFactor.x : 1,
        angularFactor.y !== undefined ? angularFactor.y : 1,
        angularFactor.z !== undefined ? angularFactor.z : 1
      );
    }
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);

    this.world.addBody(body);
    this.bodies.set(body.id, body);

    // ✅ NEW: Create debug mesh if debug is enabled
    if (this.debugEnabled) {
      this.createDebugMesh(body);
    }

    return body;
  }

  /**
   * Create a plane physics body (ground)
   */
  createPlane(options = {}) {
    const {
      mass = 0, // Static by default
      position = { x: 0, y: 0, z: 0 },
      rotation = { x: -Math.PI / 2, y: 0, z: 0 },
      material = null,
      restitution = 0.3,  // Bounciness
      friction = 0.3,     // Friction
      collisionFilterGroup = 1, // Collision group
      collisionFilterMask = -1, // What groups this body collides with
      collisionResponse = true,  // Whether body responds to collisions
      isTrigger = false    // Trigger volume (no collision response)
    } = options;

    // Create material if not provided but restitution/friction specified
    let bodyMaterial = material;
    if (!bodyMaterial) {
      bodyMaterial = new CANNON.Material();
      bodyMaterial.restitution = restitution;
      bodyMaterial.friction = friction;
    }

    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ 
      mass, 
      material: bodyMaterial,
      collisionFilterGroup,
      collisionFilterMask,
      collisionResponse,
      isTrigger
    });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);

    this.world.addBody(body);
    this.bodies.set(body.id, body);

    // ✅ NEW: Create debug mesh if debug is enabled
    if (this.debugEnabled) {
      this.createDebugMesh(body);
    }

    return body;
  }

  /**
   * Add physics body to an entity
   */
  addToEntity(entity, bodyOptions = {}) {
    if (!entity) {
      console.warn('Cannot add physics to null entity');
      return null;
    }

    // ✅ FIX: Validate entity position before creating physics body
    const position = {
      x: entity.position.x,
      y: entity.position.y,
      z: entity.position.z
    };

    // Check for NaN in initial position
    if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
      console.error('❌ Cannot create physics body: Entity has NaN position', entity.name);
      console.error('Position:', position);
      console.error('Defaulting to origin (0, 0, 0)');
      position.x = 0;
      position.y = 0;
      position.z = 0;
    }

    const rotation = {
      x: entity.rotation.x,
      y: entity.rotation.y,
      z: entity.rotation.z
    };

    // Check for NaN in initial rotation
    if (isNaN(rotation.x) || isNaN(rotation.y) || isNaN(rotation.z)) {
      console.error('❌ Cannot create physics body: Entity has NaN rotation', entity.name);
      console.error('Rotation:', rotation);
      console.error('Defaulting to zero rotation');
      rotation.x = 0;
      rotation.y = 0;
      rotation.z = 0;
    }

    // Validate body options
    if (bodyOptions.mass && (isNaN(bodyOptions.mass) || bodyOptions.mass < 0)) {
      console.error('❌ Invalid mass:', bodyOptions.mass, '- using default: 1');
      bodyOptions.mass = 1;
    }

    // Create body based on options
    let body;
    const type = bodyOptions.type || 'box';

    switch (type) {
      case 'box':
        body = this.createBox({ ...bodyOptions, position, rotation });
        break;
      case 'sphere':
        body = this.createSphere({ ...bodyOptions, position });
        break;
      case 'cylinder':
        body = this.createCylinder({ ...bodyOptions, position });
        break;
      default:
        body = this.createBox({ ...bodyOptions, position, rotation });
    }

    // Link entity and body
    this.physicsBodies.set(entity.id, body);
    entity.physicsBody = body;

    return body;
  }

  /**
   * Remove physics body from entity
   */
  removeFromEntity(entity) {
    if (!entity || !entity.physicsBody) return;

    this.world.removeBody(entity.physicsBody);
    this.bodies.delete(entity.physicsBody.id);
    this.physicsBodies.delete(entity.id);
    entity.physicsBody = null;
  }

  /**
   * Remove a body from the world
   */
  removeBody(body) {
    if (!body) return;

    // ✅ NEW: Remove debug mesh
    this.removeDebugMesh(body);

    this.world.removeBody(body);
    this.bodies.delete(body.id);
  }

  /**
   * Update physics simulation
   */
  update(deltaTime) {
    if (!this.isEnabled) return;

    // ✅ FIX: Validate deltaTime to prevent NaN
    if (isNaN(deltaTime) || deltaTime <= 0 || deltaTime > 1) {
      // Skip warning on first frame (deltaTime is often 0)
      if (deltaTime !== 0) {
        console.warn('⚠️ Invalid deltaTime for physics:', deltaTime, '- using 1/60');
      }
      deltaTime = 1 / 60;
    }

    // Step the physics world
    const fixedTimeStep = 1 / 60;
    const maxSubSteps = 3;
    
    this.world.step(fixedTimeStep, deltaTime, maxSubSteps);

    // ✅ FIX: Validate physics bodies after step
    this.validateBodies();

    // Sync entity positions with physics bodies
    this.syncEntities();

    // ✅ NEW: Update debug visualization
    if (this.debugEnabled) {
      this.updateDebugVisualization();
    }

    this.emit('updated', { deltaTime });
  }

  /**
   * Sync all entities with their physics bodies
   */
  syncEntities() {
    for (const [entityId, body] of this.physicsBodies) {
      // Find entity (you'd need to get this from scene)
      // For now, we'll let the entity handle sync in its update
      this.emit('bodyUpdated', { entityId, body });
    }
  }

  /**
   * Validate all physics bodies for NaN values
   * ✅ FIX: Prevents NaN from propagating to visual representation
   */
  validateBodies() {
    for (const body of this.bodies.values()) {
      // Check position
      if (isNaN(body.position.x) || isNaN(body.position.y) || isNaN(body.position.z)) {
        console.error('❌ NaN detected in physics body position:', body.id);
        console.error('Resetting to origin');
        body.position.set(0, 0, 0);
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
      }

      // Check velocity
      if (isNaN(body.velocity.x) || isNaN(body.velocity.y) || isNaN(body.velocity.z)) {
        console.error('❌ NaN detected in physics body velocity:', body.id);
        body.velocity.set(0, 0, 0);
      }

      // Check quaternion
      const q = body.quaternion;
      if (isNaN(q.x) || isNaN(q.y) || isNaN(q.z) || isNaN(q.w)) {
        console.error('❌ NaN detected in physics body quaternion:', body.id);
        body.quaternion.set(0, 0, 0, 1); // Identity quaternion
      }

      // Check for extreme values (often precursor to NaN)
      const positionMag = Math.sqrt(
        body.position.x ** 2 + 
        body.position.y ** 2 + 
        body.position.z ** 2
      );
      
      if (positionMag > 10000) {
        console.warn('⚠️ Physics body extremely far from origin:', body.id, 'magnitude:', positionMag);
        console.warn('Resetting to prevent NaN');
        body.position.set(0, 0, 0);
        body.velocity.set(0, 0, 0);
      }

      const velocityMag = Math.sqrt(
        body.velocity.x ** 2 + 
        body.velocity.y ** 2 + 
        body.velocity.z ** 2
      );
      
      if (velocityMag > 1000) {
        console.warn('⚠️ Physics body velocity extremely high:', body.id, 'magnitude:', velocityMag);
        console.warn('Clamping to prevent NaN');
        const scale = 1000 / velocityMag;
        body.velocity.x *= scale;
        body.velocity.y *= scale;
        body.velocity.z *= scale;
      }
    }
  }

  /**
   * Apply force to a body
   */
  applyForce(body, force, worldPoint = null) {
    if (!body) return;

    const forceVec = new CANNON.Vec3(force.x, force.y, force.z);
    
    if (worldPoint) {
      const pointVec = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
      body.applyForce(forceVec, pointVec);
    } else {
      body.applyForce(forceVec);
    }
  }

  /**
   * Apply impulse to a body
   */
  applyImpulse(body, impulse, worldPoint = null) {
    if (!body) return;

    const impulseVec = new CANNON.Vec3(impulse.x, impulse.y, impulse.z);
    
    if (worldPoint) {
      const pointVec = new CANNON.Vec3(worldPoint.x, worldPoint.y, worldPoint.z);
      body.applyImpulse(impulseVec, pointVec);
    } else {
      body.applyImpulse(impulseVec);
    }
  }

  /**
   * Set gravity
   */
  setGravity(x, y, z) {
    this.world.gravity.set(x, y, z);
  }

  /**
   * Create physics material
   */
  createMaterial(options = {}) {
    const {
      friction = 0.3,
      restitution = 0.3
    } = options;

    return new CANNON.Material({
      friction,
      restitution
    });
  }

  /**
   * Create contact material (defines interaction between two materials)
   */
  createContactMaterial(material1, material2, options = {}) {
    const {
      friction = 0.3,
      restitution = 0.3,
      contactEquationStiffness = 1e8,
      contactEquationRelaxation = 3
    } = options;

    const contactMaterial = new CANNON.ContactMaterial(material1, material2, {
      friction,
      restitution,
      contactEquationStiffness,
      contactEquationRelaxation
    });

    this.world.addContactMaterial(contactMaterial);
    return contactMaterial;
  }

  /**
   * Raycast (useful for shooting, line of sight, etc.)
   */
  raycast(from, to, options = {}) {
    const fromVec = new CANNON.Vec3(from.x, from.y, from.z);
    const toVec = new CANNON.Vec3(to.x, to.y, to.z);
    
    const result = new CANNON.RaycastResult();
    this.world.raycastClosest(fromVec, toVec, options, result);

    if (result.hasHit) {
      return {
        hit: true,
        body: result.body,
        point: {
          x: result.hitPointWorld.x,
          y: result.hitPointWorld.y,
          z: result.hitPointWorld.z
        },
        normal: {
          x: result.hitNormalWorld.x,
          y: result.hitNormalWorld.y,
          z: result.hitNormalWorld.z
        },
        distance: result.distance
      };
    }

    return { hit: false };
  }

  /**
   * Enable physics
   */
  enable() {
    this.isEnabled = true;
  }

  /**
   * Disable physics
   */
  disable() {
    this.isEnabled = false;
  }

  /**
   * Clear all physics bodies
   */
  clear() {
    // Remove all bodies
    for (const body of this.bodies.values()) {
      this.world.removeBody(body);
    }

    this.bodies.clear();
    this.physicsBodies.clear();
  }

  /**
   * Set the Three.js scene for debug visualization
   * ✅ NEW: Called by GameEngine
   */
  setDebugScene(scene) {
    this.debugScene = scene;
  }

  /**
   * Enable debug visualization
   * ✅ NEW: Shows wireframes for all physics bodies
   */
  enableDebug() {
    this.debugEnabled = true;
    
    // Create debug meshes for existing bodies
    for (const body of this.bodies.values()) {
      this.createDebugMesh(body);
    }
    
    console.log('🔍 Physics debug visualization enabled');
  }

  /**
   * Disable debug visualization
   * ✅ NEW
   */
  disableDebug() {
    this.debugEnabled = false;
    
    // Remove all debug meshes
    for (const [bodyId, debugMesh] of this.debugMeshes) {
      if (this.debugScene) {
        this.debugScene.remove(debugMesh);
      }
    }
    this.debugMeshes.clear();
    
    console.log('🔍 Physics debug visualization disabled');
  }

  /**
   * Toggle debug visualization
   * ✅ NEW
   */
  toggleDebug() {
    if (this.debugEnabled) {
      this.disableDebug();
    } else {
      this.enableDebug();
    }
  }

  /**
   * Create debug mesh for a physics body
   * ✅ NEW: Creates wireframe visualization
   */
  createDebugMesh(body) {
    if (!this.debugScene || !this.debugEnabled) return;

    // Skip if already has debug mesh
    if (this.debugMeshes.has(body.id)) return;

    let geometry;
    const shape = body.shapes[0]; // Get first shape

    if (!shape) return;

    // Create geometry based on shape type
    if (shape instanceof CANNON.Box) {
      const halfExtents = shape.halfExtents;
      geometry = new THREE.BoxGeometry(
        halfExtents.x * 2,
        halfExtents.y * 2,
        halfExtents.z * 2
      );
    } else if (shape instanceof CANNON.Sphere) {
      geometry = new THREE.SphereGeometry(shape.radius, 16, 12);
    } else if (shape instanceof CANNON.Cylinder) {
      geometry = new THREE.CylinderGeometry(
        shape.radiusTop,
        shape.radiusBottom,
        shape.height,
        16
      );
    } else if (shape instanceof CANNON.Plane) {
      geometry = new THREE.PlaneGeometry(100, 100);
    } else {
      // Default box for unknown shapes
      geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    // Create wireframe material
    const material = new THREE.MeshBasicMaterial({
      color: body.mass === 0 ? 0x00ff00 : 0xff00ff, // Green for static, Magenta for dynamic
      wireframe: true,
      transparent: true,
      opacity: 0.5
    });

    const debugMesh = new THREE.Mesh(geometry, material);
    
    // Set initial position and rotation
    debugMesh.position.copy(body.position);
    debugMesh.quaternion.copy(body.quaternion);

    this.debugScene.add(debugMesh);
    this.debugMeshes.set(body.id, debugMesh);
  }

  /**
   * Update debug visualization
   * ✅ NEW: Syncs debug meshes with physics bodies
   */
  updateDebugVisualization() {
    if (!this.debugEnabled || !this.debugScene) return;

    for (const body of this.bodies.values()) {
      let debugMesh = this.debugMeshes.get(body.id);
      
      // Create debug mesh if it doesn't exist
      if (!debugMesh) {
        this.createDebugMesh(body);
        debugMesh = this.debugMeshes.get(body.id);
      }

      // Update position and rotation
      if (debugMesh) {
        debugMesh.position.copy(body.position);
        debugMesh.quaternion.copy(body.quaternion);
      }
    }
  }

  /**
   * Remove debug mesh for a body
   * ✅ NEW
   */
  removeDebugMesh(body) {
    const debugMesh = this.debugMeshes.get(body.id);
    if (debugMesh && this.debugScene) {
      this.debugScene.remove(debugMesh);
      this.debugMeshes.delete(body.id);
    }
  }

  /**
   * Dispose physics manager
   */
  dispose() {
    this.disableDebug();
    this.clear();
    this.world = null;
    this.removeAllListeners();
  }
}

