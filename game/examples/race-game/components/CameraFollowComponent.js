import { Component } from '../../../src/index.js';

/**
 * CameraFollowComponent - Smooth camera that follows the car
 */
export class CameraFollowComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.offset = config.offset || { x: 0, y: 8, z: 15 };
    this.lookAtHeight = config.lookAtHeight || 1;
    this.smoothing = config.smoothing || 3;
  }

  start() {
    this.camera = this.entity.scene.engine.cameraManager.getActiveCamera();
    
    // Set initial position
    this.camera.position.set(
      this.entity.position.x,
      this.entity.position.y + this.offset.y,
      this.entity.position.z + this.offset.z
    );
  }

  update(deltaTime) {
    if (!this.camera) return;

    // Calculate desired camera position (behind and above the car)
    const carRotation = this.entity.rotation.y;
    
    // Rotate offset around Y axis based on car rotation
    const sin = Math.sin(carRotation);
    const cos = Math.cos(carRotation);
    
    const offsetRotated = {
      x: this.offset.x * cos - this.offset.z * sin,
      z: this.offset.x * sin + this.offset.z * cos
    };
    
    const targetPos = {
      x: this.entity.position.x + offsetRotated.x,
      y: this.entity.position.y + this.offset.y,
      z: this.entity.position.z + offsetRotated.z
    };
    
    // Smooth camera movement (lerp) - clamped to prevent overshooting
    const t = Math.min(0.15, deltaTime * this.smoothing);
    this.camera.position.x += (targetPos.x - this.camera.position.x) * t;
    this.camera.position.y += (targetPos.y - this.camera.position.y) * t;
    this.camera.position.z += (targetPos.z - this.camera.position.z) * t;
    
    // Always look at the car
    this.camera.lookAt(
      this.entity.position.x,
      this.entity.position.y + this.lookAtHeight,
      this.entity.position.z
    );
  }
}

