import { Component } from '../../../src/index.js';

/**
 * CollectibleComponent - Makes an object collectible
 */
export class CollectibleComponent extends Component {
  constructor(config = {}) {
    super();
    this.points = config.points || 10;
    this.collectionRadius = config.collectionRadius || 2;
    this.playerTag = config.playerTag || 'player';
    this.collected = false;
  }

  update(deltaTime) {
    if (this.collected) return;

    // Find player
    const player = this.entity.scene.findWithTag(this.playerTag);
    if (!player) return;

    // Check distance to player
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

    // Emit event
    this.emit('collected', {
      points: this.points,
      collector: player
    });

    // Visual feedback - scale up and fade
    if (this.entity.mesh) {
      const startScale = this.entity.mesh.scale.clone();
      const duration = 0.3;
      let elapsed = 0;

      const animate = () => {
        elapsed += 0.016; // ~60fps
        const progress = Math.min(elapsed / duration, 1);
        
        // Scale up
        const scale = 1 + progress * 0.5;
        this.entity.mesh.scale.set(
          startScale.x * scale,
          startScale.y * scale,
          startScale.z * scale
        );

        // Fade out
        if (this.entity.mesh.material) {
          this.entity.mesh.material.opacity = 1 - progress;
          this.entity.mesh.material.transparent = true;
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          // Destroy after animation
          this.entity.destroy();
        }
      };

      animate();
    } else {
      // No mesh, destroy immediately
      this.entity.destroy();
    }
  }
}

