import * as CANNON from 'cannon-es';
import EventEmitter from 'eventemitter3';

/**
 * Physics Manager
 * Wraps Cannon.js physics engine
 * Keeps physics logic separate from game scenes
 */
export class PhysicsManager extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      gravity: config.gravity !== undefined ? config.gravity : -9.82,
      iterations: config.iterations || 10,
      tolerance: config.tolerance || 0.001,
      ...config
    };

    // Cannon.js world
    this.world = null;
    
    // Physics bodies registry
    this.bodies = new Map();
    
    // Track which entities have physics
    this.physicsBodies = new Map(); // entity.id -> body

    this.isEnabled = true;

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
      material = null
    } = options;

    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({ mass, material });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    
    if (rotation.x || rotation.y || rotation.z) {
      body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);
    }

    this.world.addBody(body);
    this.bodies.set(body.id, body);

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
      material = null
    } = options;

    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({ mass, material });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);

    this.world.addBody(body);
    this.bodies.set(body.id, body);

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
      material = null
    } = options;

    const shape = new CANNON.Cylinder(radiusTop, radiusBottom, height, numSegments);
    const body = new CANNON.Body({ mass, material });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);

    this.world.addBody(body);
    this.bodies.set(body.id, body);

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
      material = null
    } = options;

    const shape = new CANNON.Plane();
    const body = new CANNON.Body({ mass, material });
    
    body.addShape(shape);
    body.position.set(position.x, position.y, position.z);
    body.quaternion.setFromEuler(rotation.x, rotation.y, rotation.z);

    this.world.addBody(body);
    this.bodies.set(body.id, body);

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

    // Create body based on options
    let body;
    const type = bodyOptions.type || 'box';

    const position = {
      x: entity.position.x,
      y: entity.position.y,
      z: entity.position.z
    };

    const rotation = {
      x: entity.rotation.x,
      y: entity.rotation.y,
      z: entity.rotation.z
    };

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

    this.world.removeBody(body);
    this.bodies.delete(body.id);
  }

  /**
   * Update physics simulation
   */
  update(deltaTime) {
    if (!this.isEnabled) return;

    // Step the physics world
    const fixedTimeStep = 1 / 60;
    const maxSubSteps = 3;
    
    this.world.step(fixedTimeStep, deltaTime, maxSubSteps);

    // Sync entity positions with physics bodies
    this.syncEntities();

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
   * Dispose physics manager
   */
  dispose() {
    this.clear();
    this.world = null;
    this.removeAllListeners();
  }
}

