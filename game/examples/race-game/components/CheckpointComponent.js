import { Component } from '../../../src/index.js';

/**
 * CheckpointComponent - Detects when player passes through checkpoint
 */
export class CheckpointComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.checkpointIndex = config.index || 0;
    this.radius = config.radius || 5;
    this.isActive = true;
    this.visualMesh = null;
  }

  start() {
    // Store reference to the visual mesh for color changes
    this.visualMesh = this.entity.mesh;
  }

  update(deltaTime) {
    if (!this.isActive) return;

    const player = this.entity.scene.findWithTag('player');
    if (!player) return;

    // Check distance to player
    const dx = player.position.x - this.entity.position.x;
    const dz = player.position.z - this.entity.position.z;
    const distance = Math.sqrt(dx * dx + dz * dz);

    if (distance < this.radius) {
      this.activate(player);
    }
  }

  activate(player) {
    this.isActive = false;
    
    // Change color to show it's been passed
    if (this.visualMesh && this.visualMesh.material) {
      this.visualMesh.material.color.setHex(0x00ff00);
      this.visualMesh.material.emissive.setHex(0x00ff00);
      this.visualMesh.material.emissiveIntensity = 0.5;
    }
    
    // Notify game manager
    this.emit('checkpointReached', { 
      index: this.checkpointIndex,
      player: player 
    });
  }

  reset() {
    this.isActive = true;
    if (this.visualMesh && this.visualMesh.material) {
      this.visualMesh.material.color.setHex(0xffff00);
      this.visualMesh.material.emissive.setHex(0xffff00);
      this.visualMesh.material.emissiveIntensity = 0.3;
    }
  }
}

