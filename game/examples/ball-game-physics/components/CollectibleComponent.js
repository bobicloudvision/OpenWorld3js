import { Component } from '../../../src/index.js';

/**
 * CollectibleComponent - Makes objects collectible
 * Detects proximity to player and triggers collection
 */
export class CollectibleComponent extends Component {
  constructor(config = {}) {
    super();
    this.points = config.points || 10;
    this.collectionRadius = config.collectionRadius || 2.5;
    this.playerTag = config.playerTag || 'player';
    this.collected = false;
  }

  update(deltaTime) {
    if (this.collected) return;

    // Find player
    const player = this.entity.scene.findWithTag(this.playerTag);
    if (!player) return;

    // Check distance
    const dx = this.entity.position.x - player.position.x;
    const dy = this.entity.position.y - player.position.y;
    const dz = this.entity.position.z - player.position.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

    // Collect if close enough
    if (distance < this.collectionRadius) {
      this.collect(player);
    }
  }

  collect(player) {
    this.collected = true;

    // Emit event for game manager
    this.emit('collected', {
      points: this.points,
      collector: player,
      collectible: this.entity
    });

    // Animate collection (scale up and fade)
    this.animateCollection();
  }

  animateCollection() {
    if (!this.entity.mesh) {
      this.entity.destroy();
      return;
    }

    const startScale = this.entity.mesh.scale.clone();
    const duration = 0.4;
    let elapsed = 0;

    const animate = () => {
      elapsed += 0.016; // ~60fps
      const progress = Math.min(elapsed / duration, 1);

      // Scale up and fade
      const scale = 1 + progress * 0.8;
      this.entity.mesh.scale.set(
        startScale.x * scale,
        startScale.y * scale,
        startScale.z * scale
      );

      if (this.entity.mesh.material) {
        this.entity.mesh.material.opacity = 1 - progress;
        this.entity.mesh.material.transparent = true;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.entity.destroy();
      }
    };

    animate();
  }
}

