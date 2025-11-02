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
  }

  /**
   * Update actor - applies velocity to position
   */
  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    // Apply velocity to position
    this.position.addScaledVector(this.velocity, deltaTime);

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
   * Serialize actor for networking
   */
  serialize() {
    return {
      ...super.serialize(),
      velocity: this.velocity.toArray(),
      speed: this.speed,
      isMoving: this.isMoving,
      isGrounded: this.isGrounded,
      currentAnimation: this.currentAnimation
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

