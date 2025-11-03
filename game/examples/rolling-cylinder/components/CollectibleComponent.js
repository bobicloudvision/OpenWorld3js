import { Component } from '../../../src/index.js';

/**
 * CollectibleComponent - Items that can be collected
 * 
 * Features:
 * - Rotation animation
 * - Bobbing motion
 * - Collection on collision with player
 * - Score value
 */
export class CollectibleComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.value = config.value || 10;          // Score value
    this.rotationSpeed = config.rotationSpeed || 2;
    this.bobSpeed = config.bobSpeed || 2;
    this.bobHeight = config.bobHeight || 0.5;
    
    this.collected = false;
    this.startY = 0;
    this.time = Math.random() * Math.PI * 2;  // Random start phase
  }

  start() {
    this.startY = this.entity.position.y;
  }

  update(deltaTime) {
    if (this.collected) return;

    // Rotate
    const currentRotation = this.entity.rotation.y;
    this.entity.setRotation(
      this.entity.rotation.x,
      currentRotation + this.rotationSpeed * deltaTime,
      this.entity.rotation.z
    );

    // Bob up and down
    this.time += deltaTime * this.bobSpeed;
    const bobOffset = Math.sin(this.time) * this.bobHeight;
    this.entity.setPosition(
      this.entity.position.x,
      this.startY + bobOffset,
      this.entity.position.z
    );

    // Check distance to player
    const player = this.entity.scene.findWithTag('player');
    if (player) {
      const distance = this.distanceTo(player.position);
      if (distance < 2) {  // Collection radius
        this.collect();
      }
    }
  }

  distanceTo(pos) {
    const dx = this.entity.position.x - pos.x;
    const dy = this.entity.position.y - pos.y;
    const dz = this.entity.position.z - pos.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  collect() {
    if (this.collected) return;
    
    this.collected = true;
    
    // Emit collection event for GameManager
    this.emit('collected', { collectible: this.entity, value: this.value });
    
    // Destroy the collectible
    this.entity.destroy();
  }
}

