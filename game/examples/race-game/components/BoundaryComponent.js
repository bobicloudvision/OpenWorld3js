import { Component } from '../../../src/index.js';

/**
 * BoundaryComponent - Invisible walls that keep the car on track
 */
export class BoundaryComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.width = config.width || 2;
    this.depth = config.depth || 2;
  }

  update(deltaTime) {
    const player = this.entity.scene.findWithTag('player');
    if (!player) return;
    
    const dx = Math.abs(player.position.x - this.entity.position.x);
    const dz = Math.abs(player.position.z - this.entity.position.z);
    
    if (dx < this.width / 2 && dz < this.depth / 2) {
      // Push player back onto track
      if (this.width > this.depth) {
        player.position.z = this.entity.position.z + (player.position.z > this.entity.position.z ? this.depth / 2 + 1 : -(this.depth / 2 + 1));
      } else {
        player.position.x = this.entity.position.x + (player.position.x > this.entity.position.x ? this.width / 2 + 1 : -(this.width / 2 + 1));
      }
      
      // Reduce speed
      const carController = player.getComponent('CarController');
      if (carController) {
        carController.currentSpeed *= 0.5;
      }
    }
  }
}

