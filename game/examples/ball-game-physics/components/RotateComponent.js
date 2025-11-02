import { Component } from '../../../src/index.js';

/**
 * RotateComponent - Continuously rotates and bobs objects
 * Creates visual interest for collectibles and decorations
 */
export class RotateComponent extends Component {
  constructor(config = {}) {
    super();
    this.rotationSpeed = config.rotationSpeed || { x: 0, y: 2, z: 0 };
    this.bobSpeed = config.bobSpeed || 2;
    this.bobAmount = config.bobAmount || 0.4;
    this.time = 0;
    this.initialY = 0;
  }

  awake() {
    this.initialY = this.entity.position.y;
  }

  update(deltaTime) {
    // Rotate mesh
    if (this.entity.mesh) {
      this.entity.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
      this.entity.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
      this.entity.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
    }

    // Bob up and down
    if (this.bobAmount > 0) {
      this.time += deltaTime * this.bobSpeed;
      const bobOffset = Math.sin(this.time) * this.bobAmount;
      this.entity.position.y = this.initialY + bobOffset;
    }
  }
}

