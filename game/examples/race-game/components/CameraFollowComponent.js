import { Component } from '../../../src/index.js';

/**
 * CameraFollowComponent - GTA-style chase camera with smooth lag and dynamic positioning
 */
export class CameraFollowComponent extends Component {
  constructor(config = {}) {
    super();
    
    // Camera distance and height
    this.distance = config.distance || 12;
    this.height = config.height || 5;
    this.heightDamping = config.heightDamping || 2.5;
    this.rotationDamping = config.rotationDamping || 3.5;
    
    // Look-at settings
    this.lookAheadDistance = config.lookAheadDistance || 3;
    this.lookAtHeight = config.lookAtHeight || 1;
    
    // Current camera rotation (lags behind car)
    this.currentRotation = 0;
    
    // Speed-based effects
    this.useSpeedEffect = config.useSpeedEffect !== false;
    this.maxSpeedOffset = config.maxSpeedOffset || 3;
  }

  start() {
    this.camera = this.entity.scene.engine.cameraManager.getActiveCamera();
    
    // Initialize camera rotation to match car
    this.currentRotation = this.entity.rotation.y;
    
    // Set initial position behind the car
    const sin = Math.sin(this.currentRotation);
    const cos = Math.cos(this.currentRotation);
    
    this.camera.position.set(
      this.entity.position.x - sin * this.distance,
      this.entity.position.y + this.height,
      this.entity.position.z - cos * this.distance
    );
  }

  update(deltaTime) {
    if (!this.camera) return;

    // Get car's current rotation
    const carRotation = this.entity.rotation.y;
    
    // Smoothly interpolate camera rotation (creates lag effect like GTA)
    const rotationDiff = this.shortestAngle(carRotation, this.currentRotation);
    this.currentRotation += rotationDiff * Math.min(1, deltaTime * this.rotationDamping);
    
    // Calculate camera position based on lagged rotation
    const sin = Math.sin(this.currentRotation);
    const cos = Math.cos(this.currentRotation);
    
    // Get car speed for dynamic effects
    let speedOffset = 0;
    if (this.useSpeedEffect) {
      const carController = this.entity.getComponent('CarController');
      if (carController) {
        const speed = carController.getSpeed();
        const normalizedSpeed = Math.min(1, speed / carController.maxSpeed);
        // INVERT: Camera gets CLOSER when going fast for more intensity
        speedOffset = normalizedSpeed * this.maxSpeedOffset;
      }
    }
    
    // Calculate target camera position (behind and above car)
    // Subtract speedOffset to bring camera closer at high speed
    const adjustedDistance = this.distance - speedOffset;
    const targetPos = {
      x: this.entity.position.x - sin * adjustedDistance,
      y: this.entity.position.y + this.height,
      z: this.entity.position.z - cos * adjustedDistance
    };
    
    // Smooth camera movement with separate dampings for height and position
    const positionDamping = Math.min(1, deltaTime * this.rotationDamping);
    const heightDampingFactor = Math.min(1, deltaTime * this.heightDamping);
    
    this.camera.position.x += (targetPos.x - this.camera.position.x) * positionDamping;
    this.camera.position.z += (targetPos.z - this.camera.position.z) * positionDamping;
    this.camera.position.y += (targetPos.y - this.camera.position.y) * heightDampingFactor;
    
    // Look at point slightly ahead of the car (GTA-style)
    const lookAtX = this.entity.position.x + sin * this.lookAheadDistance;
    const lookAtY = this.entity.position.y + this.lookAtHeight;
    const lookAtZ = this.entity.position.z + cos * this.lookAheadDistance;
    
    this.camera.lookAt(lookAtX, lookAtY, lookAtZ);
  }
  
  /**
   * Calculate shortest angle difference (handles wrapping around 2*PI)
   */
  shortestAngle(target, current) {
    let diff = target - current;
    
    // Normalize to -PI to PI range
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    
    return diff;
  }
}

