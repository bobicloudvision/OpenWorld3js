import { Component } from '../../../src/index.js';

/**
 * CameraFollowComponent - Smooth camera that follows a target
 * 
 * Features:
 * - Smooth lerp following
 * - Configurable offset and distance
 * - Rotation following (optional)
 * - Height offset for better view
 */
export class CameraFollowComponent extends Component {
  constructor(config = {}) {
    super();
    
    this.target = config.target || null;          // Target GameObject to follow
    this.offset = config.offset || { x: 0, y: 5, z: 10 };  // Camera offset from target
    this.smoothSpeed = config.smoothSpeed || 5;   // How fast camera catches up (higher = faster)
    this.lookAhead = config.lookAhead || 2;       // How far ahead to look
    this.followRotation = config.followRotation !== false;  // Follow target rotation
  }

  start() {
    if (!this.target) {
      // Try to find player automatically
      this.target = this.entity.scene.findWithTag('player');
    }
  }

  update(deltaTime) {
    if (!this.target) return;

    const camera = this.entity.scene.engine.cameraManager.getActiveCamera();
    
    // Calculate desired camera position based on target position and rotation
    let desiredPosition;
    
    if (this.followRotation) {
      // Calculate offset rotated by target's rotation
      const rotation = this.target.rotation.y;
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);
      
      desiredPosition = {
        x: this.target.position.x + (this.offset.x * cos - this.offset.z * sin),
        y: this.target.position.y + this.offset.y,
        z: this.target.position.z + (this.offset.x * sin + this.offset.z * cos)
      };
    } else {
      // Simple offset without rotation
      desiredPosition = {
        x: this.target.position.x + this.offset.x,
        y: this.target.position.y + this.offset.y,
        z: this.target.position.z + this.offset.z
      };
    }

    // Smoothly interpolate camera position
    const lerpFactor = Math.min(1, this.smoothSpeed * deltaTime);
    camera.position.x += (desiredPosition.x - camera.position.x) * lerpFactor;
    camera.position.y += (desiredPosition.y - camera.position.y) * lerpFactor;
    camera.position.z += (desiredPosition.z - camera.position.z) * lerpFactor;

    // Look at target (with slight forward offset for better view)
    const lookAtPosition = {
      x: this.target.position.x,
      y: this.target.position.y + 1,
      z: this.target.position.z
    };
    
    if (this.followRotation && this.lookAhead > 0) {
      // Look ahead in the direction of movement
      const rotation = this.target.rotation.y;
      lookAtPosition.x += Math.sin(rotation) * this.lookAhead;
      lookAtPosition.z += Math.cos(rotation) * this.lookAhead;
    }

    camera.lookAt(lookAtPosition.x, lookAtPosition.y, lookAtPosition.z);
  }

  /**
   * Set new target to follow
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * Update camera offset
   */
  setOffset(x, y, z) {
    this.offset = { x, y, z };
  }
}

