/**
 * RotateComponent
 * Rotates the entity continuously
 */

import { Component } from '../../../src/index.js';

export class RotateComponent extends Component {
  constructor(config = {}) {
    super();
    this.speed = config.speed || 1;
  }

  update(deltaTime) {
    if (this.entity.mesh) {
      this.entity.mesh.rotation.y += this.speed * deltaTime;
    }
  }
}

