import { Component } from '../../../src/index.js';

/**
 * CameraFollowComponent - Makes camera smoothly follow a target
 */
export class CameraFollowComponent extends Component {
  constructor(config = {}) {
    super();
    this.target = config.target || null;
    this.offset = config.offset || { x: 0, y: 10, z: 15 };
    this.smoothness = config.smoothness || 0.1;
    this.lookAtOffset = config.lookAtOffset || { x: 0, y: 0, z: 0 };
  }

  start() {
    // Find target if not provided
    if (!this.target) {
      this.target = this.entity.scene.findWithTag('player');
    }

    // Get camera reference
    this.camera = this.entity.scene.engine.cameraManager.getActiveCamera();
  }

  update(deltaTime) {
    if (!this.target || !this.camera) return;

    // Calculate desired camera position
    const targetPos = this.target.position;
    const desiredX = targetPos.x + this.offset.x;
    const desiredY = targetPos.y + this.offset.y;
    const desiredZ = targetPos.z + this.offset.z;

    // Smoothly interpolate camera position
    this.camera.position.x += (desiredX - this.camera.position.x) * this.smoothness;
    this.camera.position.y += (desiredY - this.camera.position.y) * this.smoothness;
    this.camera.position.z += (desiredZ - this.camera.position.z) * this.smoothness;

    // Look at target with offset
    this.camera.lookAt(
      targetPos.x + this.lookAtOffset.x,
      targetPos.y + this.lookAtOffset.y,
      targetPos.z + this.lookAtOffset.z
    );
  }
}

