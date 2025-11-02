import { Component } from '../../../src/index.js';

/**
 * CarController - Handles car movement with realistic physics-like controls
 */
export class CarController extends Component {
  constructor(config = {}) {
    super();
    
    // Movement parameters
    this.maxSpeed = config.maxSpeed || 20;
    this.acceleration = config.acceleration || 10;
    this.brakeForce = config.brakeForce || 15;
    this.turnSpeed = config.turnSpeed || 2.5;
    this.drag = config.drag || 0.95; // Friction/air resistance
    
    // State
    this.currentSpeed = 0;
    this.isFinished = false;
  }

  awake() {
    // Initialize velocity
    if (!this.entity.velocity) {
      this.entity.velocity = { x: 0, y: 0, z: 0 };
    }
  }

  update(deltaTime) {
    if (this.isFinished) return;

    const input = this.entity.scene.engine.inputManager;
    
    // Acceleration and braking
    if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) {
      this.currentSpeed += this.acceleration * deltaTime;
    } else if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) {
      this.currentSpeed -= this.brakeForce * deltaTime;
    } else {
      // Apply drag when no input
      this.currentSpeed *= this.drag;
    }
    
    // Clamp speed
    this.currentSpeed = Math.max(-this.maxSpeed * 0.5, Math.min(this.maxSpeed, this.currentSpeed));
    
    // Turning (only when moving)
    if (Math.abs(this.currentSpeed) > 0.1) {
      if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) {
        this.entity.rotation.y += this.turnSpeed * deltaTime;
      }
      if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) {
        this.entity.rotation.y -= this.turnSpeed * deltaTime;
      }
    }
    
    // Move forward in the direction the car is facing
    const forward = {
      x: Math.sin(this.entity.rotation.y),
      z: Math.cos(this.entity.rotation.y)
    };
    
    this.entity.velocity.x = forward.x * this.currentSpeed;
    this.entity.velocity.z = forward.z * this.currentSpeed;
    
    // Apply velocity to position
    this.entity.position.x += this.entity.velocity.x * deltaTime;
    this.entity.position.z += this.entity.velocity.z * deltaTime;
    
    // Keep car on ground
    this.entity.position.y = 0.5;
  }
  
  getSpeed() {
    return Math.abs(this.currentSpeed);
  }
  
  stop() {
    this.isFinished = true;
    this.currentSpeed = 0;
  }
}

