import { Entity } from './Entity.js';
import * as THREE from 'three';

/**
 * Actor class
 * A generic moving entity with velocity-based movement
 * Suitable for any game that needs movable characters/objects
 * 
 * This class is intentionally minimal - add game-specific features via:
 * - Components (recommended): HealthComponent, CombatComponent, etc.
 * - Extending this class: class MyGameCharacter extends Actor
 */
export class Actor extends Entity {
  constructor(config = {}) {
    super({
      ...config,
      type: config.type || 'actor'
    });

    // Movement properties (generic for any game)
    this.speed = config.speed !== undefined ? config.speed : 5;
    this.rotationSpeed = config.rotationSpeed !== undefined ? config.rotationSpeed : Math.PI;
    
    // Velocity and physics
    this.velocity = new THREE.Vector3();
    this.acceleration = new THREE.Vector3();
    this.isGrounded = config.isGrounded !== undefined ? config.isGrounded : true;

    // Animation (optional - only used if animator is set)
    this.animator = null;
    this.currentAnimation = null;

    // Movement state
    this.isMoving = false;

    // Physics state
    this.physicsEnabled = false;
    this.scene = null;  // Will be set when added to scene
  }

  /**
   * Update actor - applies velocity to position
   */
  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    // ✅ AUTO-SYNC: If physics is enabled, sync physics → visual
    if (this.physicsEnabled && this.physicsBody) {
      this.syncPhysicsToVisual();
    } else {
      // No physics - apply velocity to position manually
      this.position.addScaledVector(this.velocity, deltaTime);
      
      // Auto-sync mesh position
      if (this.mesh) {
        this.mesh.position.copy(this.position);
      }
    }

    // Update moving state
    this.isMoving = this.velocity.lengthSq() > 0.01;
  }

  /**
   * Move actor in a direction
   * @param {THREE.Vector3} direction - Normalized or unnormalized direction vector
   * @param {number} deltaTime - Optional delta time for physics calculations
   */
  move(direction, deltaTime) {
    const movement = direction.clone().normalize().multiplyScalar(this.speed);
    this.velocity.x = movement.x;
    this.velocity.z = movement.z;
  }

  /**
   * Stop movement
   */
  stop() {
    this.velocity.set(0, 0, 0);
  }

  /**
   * Smoothly rotate actor to face a direction
   * @param {THREE.Vector3} direction - Direction to face
   * @param {number} deltaTime - Delta time for smooth rotation
   */
  rotateTo(direction, deltaTime) {
    if (direction.lengthSq() < 0.01) return;

    const targetAngle = Math.atan2(direction.x, direction.z);
    const currentAngle = this.rotation.y;
    const angleDiff = targetAngle - currentAngle;

    // Normalize angle difference to -PI to PI
    const normalizedAngle = Math.atan2(Math.sin(angleDiff), Math.cos(angleDiff));

    // Smooth rotation
    const rotationAmount = Math.sign(normalizedAngle) * Math.min(
      Math.abs(normalizedAngle),
      this.rotationSpeed * deltaTime
    );

    this.rotation.y += rotationAmount;
  }

  /**
   * Instantly face a direction
   * @param {THREE.Vector3} direction - Direction to face
   */
  faceDirection(direction) {
    if (direction.lengthSq() < 0.01) return;
    this.rotation.y = Math.atan2(direction.x, direction.z);
  }

  /**
   * Play animation (if animator is set)
   * @param {string} name - Animation name
   * @param {object} options - Animation options
   */
  playAnimation(name, options = {}) {
    if (this.animator && typeof this.animator.play === 'function') {
      this.animator.play(name, options);
      this.currentAnimation = name;
      this.emit('animationChanged', { name, options });
    }
  }

  /**
   * Set animator (e.g., Three.js AnimationMixer)
   * @param {object} animator - Animation controller with a play() method
   */
  setAnimator(animator) {
    this.animator = animator;
  }

  /**
   * Get current speed
   */
  getSpeed() {
    return this.velocity.length();
  }

  /**
   * Set speed
   */
  setSpeed(speed) {
    this.speed = speed;
  }

  /**
   * Apply force/impulse to actor
   * @param {THREE.Vector3} force - Force vector to apply
   */
  applyForce(force) {
    this.acceleration.add(force);
  }

  /**
   * Apply acceleration to velocity (for physics-based movement)
   * @param {number} deltaTime - Delta time
   * @param {number} drag - Drag coefficient (0-1, default 0.1)
   */
  applyPhysics(deltaTime, drag = 0.1) {
    // Apply acceleration
    this.velocity.addScaledVector(this.acceleration, deltaTime);
    
    // Apply drag
    this.velocity.multiplyScalar(1 - drag);
    
    // Reset acceleration
    this.acceleration.set(0, 0, 0);
  }

  /**
   * Enable physics for this actor
   * @param {object} options - Physics options
   */
  enablePhysics(options = {}) {
    // Get physics manager from scene
    const scene = this.scene || this._findScene();
    
    if (!scene) {
      console.error(
        `❌ Cannot enable physics on "${this.name || this.id}": Entity must be added to scene first!\n` +
        `   Correct order:\n` +
        `   1. scene.addEntity(entity)  // Add to scene first\n` +
        `   2. entity.enablePhysics()   // Then enable physics`
      );
      return this;
    }
    
    if (!scene.engine || !scene.engine.physicsManager) {
      console.warn(
        `⚠️ PhysicsManager not available for "${this.name || this.id}". ` +
        `Make sure the scene has a physics-enabled engine.`
      );
      return this;
    }

    const physics = scene.engine.physicsManager;
    
    // Default options
    const {
      shape = 'box',
      mass = 5,
      width = 1,
      height = 2,
      depth = 1,
      radius = 1,
      restitution = 0.3,
      friction = 0.5,
      fixedRotation = false,  // ✅ Changed default: Allow rotation (set true for character controllers)
      linearDamping = 0.1,
      angularDamping = 0.1
    } = options;

    // Create physics body based on shape
    // Pass through ALL options to PhysicsManager (it now handles all Cannon.js params)
    let bodyOptions = { 
      ...options,           // ✅ Pass all options (collision filters, isTrigger, etc.)
      mass, 
      position: this.position,
      rotation: this.rotation,  // ✅ Include rotation for planes
      restitution,
      friction,
      linearDamping,
      angularDamping,
      fixedRotation
    };

    if (shape === 'sphere') {
      bodyOptions.type = 'sphere';
      bodyOptions.radius = radius;
    } else if (shape === 'cylinder') {
      bodyOptions.type = 'cylinder';
      bodyOptions.radiusTop = radius;
      bodyOptions.radiusBottom = radius;
      bodyOptions.height = height;
    } else if (shape === 'plane') {
      // ✅ NEW: Support for plane physics shape
      bodyOptions.type = 'plane';
      // Planes are infinite in Cannon.js, no size needed
    } else {
      bodyOptions.type = 'box';
      bodyOptions.width = width;
      bodyOptions.height = height;
      bodyOptions.depth = depth;
    }

    // Add physics body (PhysicsManager handles all properties now)
    const body = physics.addToEntity(this, bodyOptions);

    this.physicsEnabled = true;
    this.emit('physicsEnabled', { body });

    return this;
  }

  /**
   * Disable physics for this actor
   */
  disablePhysics() {
    if (!this.physicsBody) return this;

    const scene = this.scene || this._findScene();
    if (scene && scene.engine && scene.engine.physicsManager) {
      scene.engine.physicsManager.removeFromEntity(this);
    }

    this.physicsEnabled = false;
    this.emit('physicsDisabled');

    return this;
  }

  /**
   * Update physics body position from actor position
   */
  syncPhysicsToVisual() {
    if (this.physicsBody && this.mesh) {
      // ✅ FIX: Validate physics body position for NaN
      const bodyPos = this.physicsBody.position;
      const bodyQuat = this.physicsBody.quaternion;
      
      // Check for NaN in position
      if (isNaN(bodyPos.x) || isNaN(bodyPos.y) || isNaN(bodyPos.z)) {
        console.error('❌ Physics NaN detected in position:', bodyPos);
        console.error('Actor:', this.name, 'ID:', this.id);
        
        // Reset to last known good position or origin
        this.physicsBody.position.set(
          this.position.x || 0,
          this.position.y || 0,
          this.position.z || 0
        );
        this.physicsBody.velocity.set(0, 0, 0);
        this.physicsBody.angularVelocity.set(0, 0, 0);
        
        return this;
      }
      
      // Check for NaN in quaternion
      if (isNaN(bodyQuat.x) || isNaN(bodyQuat.y) || isNaN(bodyQuat.z) || isNaN(bodyQuat.w)) {
        console.error('❌ Physics NaN detected in quaternion:', bodyQuat);
        console.error('Actor:', this.name, 'ID:', this.id);
        
        // Reset quaternion to identity
        this.physicsBody.quaternion.set(0, 0, 0, 1);
        
        return this;
      }
      
      // All values valid, safe to copy
      this.mesh.position.copy(this.physicsBody.position);
      this.mesh.quaternion.copy(this.physicsBody.quaternion);
      this.position.copy(this.physicsBody.position);
    }
    return this;
  }

  /**
   * Update actor position from visual position
   */
  syncVisualToPhysics() {
    if (this.physicsBody) {
      this.physicsBody.position.copy(this.position);
      if (this.mesh) {
        this.physicsBody.quaternion.copy(this.mesh.quaternion);
      }
    }
    return this;
  }

  /**
   * Helper to find scene (walk up the tree)
   */
  _findScene() {
    // Try to find scene in parent chain
    let current = this.parent;
    while (current) {
      if (current.isScene) return current;
      current = current.parent;
    }
    return null;
  }

  /**
   * Serialize actor for networking
   */
  serialize() {
    return {
      ...super.serialize(),
      velocity: this.velocity.toArray(),
      speed: this.speed,
      isMoving: this.isMoving,
      isGrounded: this.isGrounded,
      currentAnimation: this.currentAnimation,
      physicsEnabled: this.physicsEnabled || false
    };
  }

  /**
   * Deserialize actor from network
   */
  deserialize(data) {
    super.deserialize(data);

    if (data.velocity) {
      this.velocity.fromArray(data.velocity);
    }
    if (data.speed !== undefined) {
      this.speed = data.speed;
    }
    if (data.isMoving !== undefined) {
      this.isMoving = data.isMoving;
    }
    if (data.isGrounded !== undefined) {
      this.isGrounded = data.isGrounded;
    }
    if (data.currentAnimation && data.currentAnimation !== this.currentAnimation) {
      this.playAnimation(data.currentAnimation);
    }
  }
}

