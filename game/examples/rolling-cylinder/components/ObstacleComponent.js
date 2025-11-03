import { Component } from '../../../src/index.js';

/**
 * ObstacleComponent - Marks objects as obstacles
 * 
 * Features:
 * - Collision detection with player
 * - Damage on collision
 * - Optional destruction on hit
 */
export class ObstacleComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.damage = config.damage || 10;
    this.destroyOnHit = config.destroyOnHit || false;
    this.hasHit = false;
  }

  start() {
    // Listen for collisions if physics is enabled
    if (this.entity.physicsBody) {
      // We'll handle collision detection in the GameManager
      // to avoid circular dependencies
    }
  }

  onCollisionEnter(other) {
    // Check if collided with player
    if (other.hasTag && other.hasTag('player') && !this.hasHit) {
      this.hasHit = true;
      
      // Emit collision event for GameManager to handle
      this.emit('obstacleHit', { obstacle: this.entity, player: other, damage: this.damage });
      
      // Destroy if configured
      if (this.destroyOnHit) {
        setTimeout(() => {
          if (this.entity) {
            this.entity.destroy();
          }
        }, 100);
      } else {
        // Reset after a delay
        setTimeout(() => {
          this.hasHit = false;
        }, 1000);
      }
    }
  }
}

