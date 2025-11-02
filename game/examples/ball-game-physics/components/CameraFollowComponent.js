import { Component } from '../../../src/index.js';

/**
 * CameraFollowComponent - Smooth camera following
 * Follows target with offset and smooth interpolation
 */
export class CameraFollowComponent extends Component {
  constructor(config = {}) {
    super();
    this.targetTag = config.targetTag || 'player';
    this.target = null;
    this.offset = config.offset || { x: 0, y: 15, z: 20 };
    this.smoothness = config.smoothness || 0.1;
    this.lookAtHeight = config.lookAtHeight || 0;
  }

  start() {
    // Find target by tag
    this.target = this.entity.scene.findWithTag(this.targetTag);
    
    if (!this.target) {
      console.warn(`CameraFollowComponent: Target with tag '${this.targetTag}' not found`);
    }

    // Get camera
    this.camera = this.entity.scene.engine.cameraManager.getActiveCamera();
  }

  update(deltaTime) {
    if (!this.target || !this.camera) return;

    const targetPos = this.target.position;

    // Calculate desired position
    const desiredX = targetPos.x + this.offset.x;
    const desiredY = targetPos.y + this.offset.y;
    const desiredZ = targetPos.z + this.offset.z;

    // Smooth interpolation
    this.camera.position.x += (desiredX - this.camera.position.x) * this.smoothness;
    this.camera.position.y += (desiredY - this.camera.position.y) * this.smoothness;
    this.camera.position.z += (desiredZ - this.camera.position.z) * this.smoothness;

    // Look at target
    this.camera.lookAt(
      targetPos.x,
      targetPos.y + this.lookAtHeight,
      targetPos.z
    );
  }
}

