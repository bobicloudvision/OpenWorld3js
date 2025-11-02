import { Component } from '../../../src/index.js';

/**
 * ObstacleComponent - Slows down the player on collision
 */
export class ObstacleComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.slowdownFactor = config.slowdownFactor || 0.5;
    this.radius = config.radius || 2;
  }

  update(deltaTime) {
    const player = this.entity.scene.findWithTag('player');
    if (!player) return;

    // Check collision with player
    const dx = player.position.x - this.entity.position.x;
    const dz = player.position.z - this.entity.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < this.radius) {
      // Apply slowdown
      const carController = player.getComponent('CarController');
      if (carController) {
        carController.currentSpeed *= this.slowdownFactor;
      }
      
      // Push player away slightly
      const pushX = (dx / distance) * 0.5;
      const pushZ = (dz / distance) * 0.5;
      player.position.x += pushX;
      player.position.z += pushZ;
    }
  }
}

