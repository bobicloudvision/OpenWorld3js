import { Component } from '../../../src/index.js';

/**
 * WheelComponent - Reusable wheel physics component
 * 
 * Features:
 * - Physics-based rolling using torque
 * - Steering with configurable turn rate
 * - Ground detection
 * - Acceleration and braking
 * - Can be used for single wheels or integrated into vehicles
 * 
 * Usage:
 *   wheel.addComponent(WheelComponent, {
 *     acceleration: 15,
 *     brakeForce: 10,
 *     maxSpeed: 20,
 *     turnSpeed: 2,
 *     isGrounded: true
 *   });
 */
export class WheelComponent extends Component {
  constructor(config = {}) {
    super();
    
    // Movement parameters
    this.acceleration = config.acceleration || 15;      // Forward acceleration torque
    this.brakeForce = config.brakeForce || 10;          // Braking force
    this.maxSpeed = config.maxSpeed || 20;              // Maximum angular velocity
    this.turnSpeed = config.turnSpeed || 2;             // Turning/steering speed
    
    // Wheel properties (for future car integration)
    this.radius = config.radius || 1;                   // Wheel radius
    this.isGrounded = config.isGrounded !== false;      // Start grounded
    this.isPowered = config.isPowered !== false;        // Can this wheel accelerate?
    this.canSteer = config.canSteer !== false;          // Can this wheel steer?
    
    // Control state
    this.currentSpeed = 0;
    this.turnAngle = 0;
    
    // Input keys (configurable for multi-wheel vehicles)
    this.keys = {
      forward: config.forwardKey || 'KeyW',
      backward: config.backwardKey || 'KeyS',
      left: config.leftKey || 'KeyA',
      right: config.rightKey || 'KeyD',
      brake: config.brakeKey || 'Space'
    };
  }

  start() {
    // Ensure physics is enabled
    if (!this.entity.physicsBody) {
      console.warn('WheelComponent requires physics to be enabled on the GameObject');
    } else {
      console.log('✅ WheelComponent started with physics body');
      console.log('Position:', this.entity.position);
      console.log('Rotation:', this.entity.rotation);
    }
  }

  update(deltaTime) {
    if (!this.entity.physicsBody) {
      console.warn('⚠️ No physics body in update');
      return;
    }

    const input = this.entity.scene.engine.inputManager;
    const body = this.entity.physicsBody;

    // Get current velocity
    const currentSpeed = Math.sqrt(body.velocity.x * body.velocity.x + body.velocity.z * body.velocity.z);

    // Debug: Log input and velocity every 60 frames (once per second at 60fps)
    if (!this._debugCounter) this._debugCounter = 0;
    this._debugCounter++;
    
    if (this._debugCounter % 60 === 0) {
      console.log('--- WheelComponent Debug ---');
      console.log('GameObject Position:', { x: this.entity.position.x.toFixed(2), y: this.entity.position.y.toFixed(2), z: this.entity.position.z.toFixed(2) });
      console.log('Physics Body Position:', { x: body.position.x.toFixed(2), y: body.position.y.toFixed(2), z: body.position.z.toFixed(2) });
      console.log('Velocity:', { x: body.velocity.x.toFixed(2), y: body.velocity.y.toFixed(2), z: body.velocity.z.toFixed(2) });
      console.log('Speed:', currentSpeed.toFixed(2));
      console.log('Angular Velocity:', { x: body.angularVelocity.x.toFixed(2), y: body.angularVelocity.y.toFixed(2), z: body.angularVelocity.z.toFixed(2) });
      console.log('Physics Enabled:', this.entity.physicsEnabled);
      console.log('Has Mesh:', !!this.entity.mesh);
    }

    // === STEERING (if enabled) ===
    if (this.canSteer) {
      let turnInput = 0;
      if (input.isKeyDown(this.keys.left)) {
        turnInput = 1;
        if (this._debugCounter % 60 === 0) console.log('⬅️ LEFT pressed');
      }
      if (input.isKeyDown(this.keys.right)) {
        turnInput = -1;
        if (this._debugCounter % 60 === 0) console.log('➡️ RIGHT pressed');
      }

      if (turnInput !== 0) {
        // Apply angular velocity around Y axis for turning
        body.angularVelocity.y = turnInput * this.turnSpeed;
      } else {
        // Dampen Y rotation when not turning
        body.angularVelocity.y *= 0.9;
      }
    }

    // === ACCELERATION (if powered) ===
    if (this.isPowered && this.isGrounded) {
      let accelerationInput = 0;
      
      if (input.isKeyDown(this.keys.forward)) {
        accelerationInput = 1;
        if (this._debugCounter % 60 === 0) console.log('⬆️ FORWARD pressed');
      }
      if (input.isKeyDown(this.keys.backward)) {
        accelerationInput = -1;
        if (this._debugCounter % 60 === 0) console.log('⬇️ BACKWARD pressed');
      }

      if (accelerationInput !== 0) {
        if (currentSpeed < this.maxSpeed) {
          // Calculate forward direction based on current Y rotation
          const angle = this.entity.rotation.y;
          const forwardX = Math.sin(angle);
          const forwardZ = Math.cos(angle);
          
          // Apply force in forward direction
          const force = accelerationInput * this.acceleration;
          body.velocity.x += forwardX * force * deltaTime;
          body.velocity.z += forwardZ * force * deltaTime;
          
          // Apply rolling torque around the cylinder's axis (X axis when rotated)
          // This makes it visually roll
          body.angularVelocity.x += -accelerationInput * this.acceleration * 0.5 * deltaTime;
          
          if (this._debugCounter % 60 === 0) {
            console.log('🚀 Applying force:', force.toFixed(2));
            console.log('Direction:', { x: forwardX.toFixed(2), z: forwardZ.toFixed(2) });
          }
        } else {
          if (this._debugCounter % 60 === 0) console.log('🚫 Max speed reached');
        }
      }

      // === BRAKING ===
      if (input.isKeyDown(this.keys.brake)) {
        if (this._debugCounter % 60 === 0) console.log('🛑 BRAKE pressed');
        // Apply strong damping to velocity
        body.velocity.x *= 0.95;
        body.velocity.z *= 0.95;
        body.angularVelocity.x *= 0.95;
      }
    }

    // Store current speed for external access
    this.currentSpeed = currentSpeed;
  }

  /**
   * Get the forward direction based on current rotation
   */
  getForwardDirection() {
    const rotation = this.entity.rotation.y;
    return {
      x: Math.sin(rotation),
      y: 0,
      z: Math.cos(rotation),
      normalize() {
        const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
        return { x: this.x / len, y: this.y / len, z: this.z / len };
      },
      cross(v) {
        return {
          x: this.y * v.z - this.z * v.y,
          y: this.z * v.x - this.x * v.z,
          z: this.x * v.y - this.y * v.x,
          normalize() {
            const len = Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
            return { x: this.x / len, y: this.y / len, z: this.z / len };
          }
        };
      }
    };
  }

  /**
   * Apply an impulse to the wheel (for external forces like collisions)
   */
  applyImpulse(force) {
    if (this.entity.physicsBody) {
      this.entity.physicsBody.applyImpulse(
        new CANNON.Vec3(force.x, force.y, force.z),
        this.entity.physicsBody.position
      );
    }
  }

  /**
   * Set wheel grounded state (useful for suspension in cars)
   */
  setGrounded(grounded) {
    this.isGrounded = grounded;
  }

  /**
   * Get linear velocity magnitude (useful for speedometer)
   */
  getLinearSpeed() {
    if (this.entity.physicsBody) {
      return this.entity.physicsBody.velocity.length();
    }
    return 0;
  }
}

