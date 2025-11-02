import * as THREE from 'three';

/**
 * Third Person Camera Controller
 * Follows a target with smooth camera movement
 */
export class ThirdPersonCamera {
  constructor(camera, target, config = {}) {
    this.camera = camera;
    this.target = target;

    this.config = {
      distance: config.distance || 10,
      height: config.height || 5,
      angle: config.angle || 0,
      smoothness: config.smoothness || 0.1,
      minDistance: config.minDistance || 3,
      maxDistance: config.maxDistance || 20,
      minHeight: config.minHeight || 2,
      maxHeight: config.maxHeight || 15,
      rotationSpeed: config.rotationSpeed || 0.003,
      zoomSpeed: config.zoomSpeed || 1,
      lookAtOffset: config.lookAtOffset || new THREE.Vector3(0, 1, 0),
      collisionCheck: config.collisionCheck || false
    };

    // Current state
    this.currentDistance = this.config.distance;
    this.currentHeight = this.config.height;
    this.currentAngle = this.config.angle;

    // Desired state (for smoothing)
    this.desiredDistance = this.currentDistance;
    this.desiredHeight = this.currentHeight;
    this.desiredAngle = this.currentAngle;

    // Camera offset from target
    this.offset = new THREE.Vector3();
    this.lookAtPosition = new THREE.Vector3();

    // Input manager reference (optional)
    this.inputManager = null;
  }

  /**
   * Set input manager for mouse/touch control
   */
  setInputManager(inputManager) {
    this.inputManager = inputManager;

    // Setup input listeners
    inputManager.on('mouseMove', ({ deltaX, deltaY }) => {
      if (inputManager.isMouseButtonDown(2) || inputManager.mouse.isLocked) {
        this.rotate(deltaX, deltaY);
      }
    });

    inputManager.on('mouseWheel', ({ delta }) => {
      this.zoom(delta * this.config.zoomSpeed * 0.01);
    });
  }

  /**
   * Rotate camera around target
   */
  rotate(deltaX, deltaY) {
    this.desiredAngle -= deltaX * this.config.rotationSpeed;
    this.desiredHeight += deltaY * this.config.rotationSpeed * 50;

    // Clamp height
    this.desiredHeight = Math.max(
      this.config.minHeight,
      Math.min(this.config.maxHeight, this.desiredHeight)
    );
  }

  /**
   * Zoom camera in/out
   */
  zoom(delta) {
    this.desiredDistance += delta;

    // Clamp distance
    this.desiredDistance = Math.max(
      this.config.minDistance,
      Math.min(this.config.maxDistance, this.desiredDistance)
    );
  }

  /**
   * Update camera position
   */
  update(deltaTime) {
    if (!this.target) return;

    // Smooth interpolation
    this.currentAngle = THREE.MathUtils.lerp(
      this.currentAngle,
      this.desiredAngle,
      this.config.smoothness
    );

    this.currentHeight = THREE.MathUtils.lerp(
      this.currentHeight,
      this.desiredHeight,
      this.config.smoothness
    );

    this.currentDistance = THREE.MathUtils.lerp(
      this.currentDistance,
      this.desiredDistance,
      this.config.smoothness
    );

    // Calculate camera position
    const targetPosition = this.target.position || this.target;
    
    this.offset.x = Math.sin(this.currentAngle) * this.currentDistance;
    this.offset.y = this.currentHeight;
    this.offset.z = Math.cos(this.currentAngle) * this.currentDistance;

    // Set camera position
    this.camera.position.copy(targetPosition).add(this.offset);

    // Calculate look-at position
    this.lookAtPosition.copy(targetPosition).add(this.config.lookAtOffset);

    // Look at target
    this.camera.lookAt(this.lookAtPosition);
  }

  /**
   * Set target to follow
   */
  setTarget(target) {
    this.target = target;
  }

  /**
   * Get camera forward direction (on XZ plane)
   */
  getForwardDirection() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(this.camera.quaternion);
    forward.y = 0;
    forward.normalize();
    return forward;
  }

  /**
   * Get camera right direction (on XZ plane)
   */
  getRightDirection() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyQuaternion(this.camera.quaternion);
    right.y = 0;
    right.normalize();
    return right;
  }

  /**
   * Set camera distance
   */
  setDistance(distance) {
    this.desiredDistance = Math.max(
      this.config.minDistance,
      Math.min(this.config.maxDistance, distance)
    );
  }

  /**
   * Set camera height
   */
  setHeight(height) {
    this.desiredHeight = Math.max(
      this.config.minHeight,
      Math.min(this.config.maxHeight, height)
    );
  }

  /**
   * Set camera angle
   */
  setAngle(angle) {
    this.desiredAngle = angle;
  }

  /**
   * Reset camera to default position
   */
  reset() {
    this.desiredDistance = this.config.distance;
    this.desiredHeight = this.config.height;
    this.desiredAngle = this.config.angle;
  }
}

