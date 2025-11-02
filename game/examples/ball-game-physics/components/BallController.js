import { Component } from '../../../src/index.js';

/**
 * BallController - Controls ball movement using physics forces
 * Uses force-based movement for realistic physics behavior
 */
export class BallController extends Component {
  constructor(config = {}) {
    super();
    this.moveForce = config.moveForce || 20;
    this.maxSpeed = config.maxSpeed || 15;
    this.jumpForce = config.jumpForce || 35; // Impulse force (not regular force!)
    this.isGrounded = false;
    this.groundCheckDistance = 1.2; // Distance to check for ground
  }

  start() {
    // Ensure physics body exists
    if (!this.entity.physicsBody) {
      console.warn('BallController requires physics to be enabled on entity');
    }
  }

  update(deltaTime) {
    if (!this.entity.physicsBody) return;

    const input = this.entity.scene.engine.inputManager;
    const body = this.entity.physicsBody;

    // Check if grounded
    this.checkGrounded();

    // Get input direction
    let forceX = 0;
    let forceZ = 0;

    if (input.isKeyDown('KeyW')) forceZ = -this.moveForce;
    if (input.isKeyDown('KeyS')) forceZ = this.moveForce;
    if (input.isKeyDown('KeyA')) forceX = -this.moveForce;
    if (input.isKeyDown('KeyD')) forceX = this.moveForce;

    // Apply force if moving
    if (forceX !== 0 || forceZ !== 0) {
      this.entity.scene.engine.physicsManager.applyForce(
        body,
        { x: forceX, y: 0, z: forceZ }
      );
    }

    // Jump
    if (input.isKeyPressed('Space') && this.isGrounded) {
      this.jump();
    }

    // Limit max speed (horizontal only)
    const vel = body.velocity;
    const speed = Math.sqrt(vel.x * vel.x + vel.z * vel.z);
    if (speed > this.maxSpeed) {
      const scale = this.maxSpeed / speed;
      body.velocity.x *= scale;
      body.velocity.z *= scale;
    }

    // Reset if fallen
    if (this.entity.position.y < -10) {
      this.resetPosition();
    }
  }

  checkGrounded() {
    if (!this.entity.physicsBody) return;

    const physics = this.entity.scene.engine.physicsManager;
    const ballPos = this.entity.position;

    // Raycast downward to check for ground
    const from = { x: ballPos.x, y: ballPos.y, z: ballPos.z };
    const to = { x: ballPos.x, y: ballPos.y - this.groundCheckDistance, z: ballPos.z };

    const result = physics.raycast(from, to);

    // Check vertical velocity too (must be near zero or moving down)
    const isMovingDown = this.entity.physicsBody.velocity.y <= 0.5;

    this.isGrounded = result.hit && isMovingDown;
  }

  jump() {
    if (!this.entity.physicsBody || !this.isGrounded) return;

    // Apply upward impulse
    this.entity.scene.engine.physicsManager.applyImpulse(
      this.entity.physicsBody,
      { x: 0, y: this.jumpForce, z: 0 }
    );

    this.emit('jumped');
  }

  resetPosition() {
    const body = this.entity.physicsBody;
    if (body) {
      body.position.set(0, 5, 0);
      body.velocity.set(0, 0, 0);
      body.angularVelocity.set(0, 0, 0);
      this.emit('reset');
    }
  }
}

