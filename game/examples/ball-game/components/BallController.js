import { Component } from '../../../src/index.js';

/**
 * BallController - Controls ball movement with WASD keys
 */
export class BallController extends Component {
  constructor(config = {}) {
    super();
    this.speed = config.speed || 15;
    this.rotationSpeed = config.rotationSpeed || 5;
    this.isGrounded = true;
  }

  awake() {
    // Store initial Y position
    this.groundY = this.entity.position.y;
  }

  update(deltaTime) {
    const input = this.entity.scene.engine.inputManager;
    
    let moveX = 0;
    let moveZ = 0;

    // Get input direction
    if (input.isKeyDown('KeyW')) moveZ = -1;
    if (input.isKeyDown('KeyS')) moveZ = 1;
    if (input.isKeyDown('KeyA')) moveX = -1;
    if (input.isKeyDown('KeyD')) moveX = 1;

    // Apply movement
    if (moveX !== 0 || moveZ !== 0) {
      // Normalize diagonal movement
      const length = Math.sqrt(moveX * moveX + moveZ * moveZ);
      moveX /= length;
      moveZ /= length;

      // Update velocity
      this.entity.velocity.x = moveX * this.speed;
      this.entity.velocity.z = moveZ * this.speed;

      // Rotate ball based on movement (visual effect)
      if (this.entity.mesh) {
        const angle = this.rotationSpeed * deltaTime;
        this.entity.mesh.rotation.x += moveZ * angle;
        this.entity.mesh.rotation.z -= moveX * angle;
      }
    } else {
      // Apply friction
      this.entity.velocity.x *= 0.9;
      this.entity.velocity.z *= 0.9;
    }

    // Keep ball on ground
    this.entity.position.y = this.groundY;

    // Check bounds (reset if out of bounds)
    const maxDistance = 45;
    const distance = Math.sqrt(
      this.entity.position.x ** 2 + 
      this.entity.position.z ** 2
    );

    if (distance > maxDistance) {
      this.resetPosition();
    }
  }

  resetPosition() {
    this.entity.setPosition(0, this.groundY, 0);
    this.entity.velocity.set(0, 0, 0);
    
    // Reset rotation
    if (this.entity.mesh) {
      this.entity.mesh.rotation.set(0, 0, 0);
    }
    
    this.emit('reset');
  }
}

