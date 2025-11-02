import { Component } from '../../../src/index.js';

/**
 * RotateComponent - Continuously rotates an object
 */
export class RotateComponent extends Component {
  constructor(config = {}) {
    super();
    this.rotationSpeed = config.rotationSpeed || { x: 0, y: 2, z: 0 };
    this.bobSpeed = config.bobSpeed || 1;
    this.bobAmount = config.bobAmount || 0.3;
    this.time = 0;
    this.initialY = 0;
  }

  awake() {
    this.initialY = this.entity.position.y;
  }

  update(deltaTime) {
    // Rotate
    if (this.entity.mesh) {
      this.entity.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
      this.entity.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
      this.entity.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
    }

    // Bob up and down
    this.time += deltaTime * this.bobSpeed;
    const bobOffset = Math.sin(this.time) * this.bobAmount;
    this.entity.position.y = this.initialY + bobOffset;
  }
}

