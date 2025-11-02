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

      // Calculate desired velocity
      const desiredVelX = moveX * this.speed;
      const desiredVelZ = moveZ * this.speed;

      // Rotate ball based on movement (visual effect)
      if (this.entity.mesh) {
        const angle = this.rotationSpeed * deltaTime;
        this.entity.mesh.rotation.x += moveZ * angle;
        this.entity.mesh.rotation.z -= moveX * angle;
      }

      // Apply velocity (will be adjusted by collision)
      this.entity.velocity.x = desiredVelX;
      this.entity.velocity.z = desiredVelZ;
    } else {
      // Apply friction
      this.entity.velocity.x *= 0.9;
      this.entity.velocity.z *= 0.9;
    }

    // Check and resolve collisions after velocity is set
    this.resolveCollisions(deltaTime);

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

  resolveCollisions(deltaTime) {
    const ballRadius = 1;
    const scene = this.entity.scene;

    // Check collision with walls (boundary)
    const wallDistance = 48;
    if (Math.abs(this.entity.position.x) > wallDistance) {
      this.entity.position.x = Math.sign(this.entity.position.x) * wallDistance;
      this.entity.velocity.x = 0;
      this.emit('collision');
    }
    if (Math.abs(this.entity.position.z) > wallDistance) {
      this.entity.position.z = Math.sign(this.entity.position.z) * wallDistance;
      this.entity.velocity.z = 0;
      this.emit('collision');
    }

    // Check collision with obstacles
    const obstacles = scene.findGameObjectsWithTag('obstacle');
    for (const obstacle of obstacles) {
      const dx = this.entity.position.x - obstacle.position.x;
      const dz = this.entity.position.z - obstacle.position.z;
      const distance = Math.sqrt(dx * dx + dz * dz);

      // Get obstacle approximate radius (based on mesh)
      let obstacleRadius = 2;
      if (obstacle.mesh && obstacle.mesh.geometry) {
        const geo = obstacle.mesh.geometry;
        if (geo.parameters) {
          obstacleRadius = Math.max(
            geo.parameters.width || geo.parameters.radiusTop || 1,
            geo.parameters.depth || geo.parameters.radiusBottom || 1
          ) / 2;
        }
      }

      const minDistance = ballRadius + obstacleRadius;

      // Check if colliding
      if (distance < minDistance && distance > 0) {
        // Calculate collision normal
        const normalX = dx / distance;
        const normalZ = dz / distance;

        // Check if obstacle is pushable
        const pushable = obstacle.getComponent('PushableComponent');
        
        if (pushable && pushable.isPushable) {
          // Calculate push strength based on ball velocity
          const velMag = Math.sqrt(
            this.entity.velocity.x ** 2 + 
            this.entity.velocity.z ** 2
          );
          
          if (velMag > 0.1) {
            // Push the obstacle
            const pushForce = 12;
            pushable.push(
              -normalX * pushForce * deltaTime,
              -normalZ * pushForce * deltaTime
            );
          }
        }

        // Separate the ball from the obstacle
        const overlap = minDistance - distance;
        const separationX = normalX * overlap;
        const separationZ = normalZ * overlap;

        // Move ball away from obstacle
        this.entity.position.x += separationX;
        this.entity.position.z += separationZ;

        // Reflect velocity (bounce effect)
        const dotProduct = this.entity.velocity.x * normalX + 
                          this.entity.velocity.z * normalZ;
        
        if (dotProduct < 0) {
          // Remove velocity component toward obstacle
          this.entity.velocity.x -= dotProduct * normalX * 1.5;
          this.entity.velocity.z -= dotProduct * normalZ * 1.5;
        }

        // Apply damping
        this.entity.velocity.x *= 0.8;
        this.entity.velocity.z *= 0.8;

        this.emit('collision');
      }
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


