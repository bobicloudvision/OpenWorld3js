/**
 * CameraFollowComponent
 * Smoothly follows the player with an offset
 */

import { Component, Vector3 } from '../../../src/index.js';

export class CameraFollowComponent extends Component {
  constructor(config = {}) {
    super();
    // Higher and further back to see more track ahead
    this.offset = new Vector3(0, 8, 12);
    this.smoothness = 0.1;
    this.targetPosition = new Vector3();
  }

  start() {
    const camera = this.entity.scene.engine.cameraManager.getActiveCamera();
    this.camera = camera;
  }

  update(deltaTime) {
    if (!this.camera) return;
    
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    // Calculate target camera position
    this.targetPosition.copy(player.position).add(this.offset);
    
    // Smooth follow
    this.camera.position.lerp(this.targetPosition._getThreeVector(), this.smoothness);
    
    // Look at position far ahead of player to see more track
    const lookAtPos = new Vector3(
      player.position.x,
      player.position.y + 1,
      player.position.z - 15  // Look 15 units ahead
    );
    this.camera.lookAt(lookAtPos._getThreeVector());
  }
}

