import { Component } from '../../../src/index.js';

/**
 * PushableComponent - Makes objects pushable by the ball
 */
export class PushableComponent extends Component {
  constructor(config = {}) {
    super();
    this.mass = config.mass || 1; // Lower mass = easier to push
    this.friction = config.friction || 0.85; // How fast it stops moving
    this.isPushable = config.isPushable !== false;
  }

  awake() {
    // Initialize velocity if not present
    if (!this.entity.velocity) {
      this.entity.velocity = { x: 0, y: 0, z: 0 };
    }
    this.groundY = this.entity.position.y;
  }

  update(deltaTime) {
    // Apply friction to slow down
    this.entity.velocity.x *= this.friction;
    this.entity.velocity.z *= this.friction;

    // Stop if velocity is very small
    if (Math.abs(this.entity.velocity.x) < 0.01) {
      this.entity.velocity.x = 0;
    }
    if (Math.abs(this.entity.velocity.z) < 0.01) {
      this.entity.velocity.z = 0;
    }

    // Keep on ground
    this.entity.position.y = this.groundY;

    // Check boundaries - don't let pushable objects go through walls
    const maxDistance = 45;
    const distance = Math.sqrt(
      this.entity.position.x ** 2 + 
      this.entity.position.z ** 2
    );

    if (distance > maxDistance) {
      // Stop at boundary
      const angle = Math.atan2(this.entity.position.z, this.entity.position.x);
      this.entity.position.x = Math.cos(angle) * maxDistance;
      this.entity.position.z = Math.sin(angle) * maxDistance;
      this.entity.velocity.x = 0;
      this.entity.velocity.z = 0;
    }
  }

  /**
   * Push this object with a force
   * @param {number} forceX - Force in X direction
   * @param {number} forceZ - Force in Z direction
   */
  push(forceX, forceZ) {
    if (!this.isPushable) return;

    // Apply force based on mass (heavier = slower)
    this.entity.velocity.x += forceX / this.mass;
    this.entity.velocity.z += forceZ / this.mass;

    // Cap max velocity
    const maxVel = 10;
    const speed = Math.sqrt(
      this.entity.velocity.x ** 2 + 
      this.entity.velocity.z ** 2
    );
    
    if (speed > maxVel) {
      const scale = maxVel / speed;
      this.entity.velocity.x *= scale;
      this.entity.velocity.z *= scale;
    }

    this.emit('pushed');
  }
}

