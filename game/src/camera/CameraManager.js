import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

/**
 * Camera Manager
 * Manages cameras and camera controllers
 */
export class CameraManager extends EventEmitter {
  constructor(engine) {
    super();
    
    this.engine = engine;
    this.cameras = new Map();
    this.activeCamera = null;
    this.defaultCamera = null;

    // Create default perspective camera
    this._createDefaultCamera();
  }

  /**
   * Create default camera
   */
  _createDefaultCamera() {
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, 0);

    this.defaultCamera = camera;
    this.activeCamera = camera;
    this.cameras.set('default', camera);
  }

  /**
   * Add a camera
   */
  addCamera(name, camera) {
    this.cameras.set(name, camera);
    this.emit('cameraAdded', { name, camera });
    return camera;
  }

  /**
   * Remove a camera
   */
  removeCamera(name) {
    if (name === 'default') {
      console.warn('Cannot remove default camera');
      return;
    }

    const camera = this.cameras.get(name);
    if (camera) {
      this.cameras.delete(name);
      
      if (this.activeCamera === camera) {
        this.setActiveCamera('default');
      }

      this.emit('cameraRemoved', { name, camera });
    }
  }

  /**
   * Set active camera
   */
  setActiveCamera(nameOrCamera) {
    let camera;

    if (typeof nameOrCamera === 'string') {
      camera = this.cameras.get(nameOrCamera);
      if (!camera) {
        console.warn(`Camera "${nameOrCamera}" not found`);
        return;
      }
    } else {
      camera = nameOrCamera;
    }

    const previousCamera = this.activeCamera;
    this.activeCamera = camera;

    this.emit('activeCameraChanged', { 
      previous: previousCamera, 
      current: camera 
    });
  }

  /**
   * Get active camera
   */
  getActiveCamera() {
    return this.activeCamera;
  }

  /**
   * Get camera by name
   */
  getCamera(name) {
    return this.cameras.get(name);
  }

  /**
   * Follow a target with smooth camera movement
   * @param {Object} target - Target object with position (Vector3 or {x, y, z})
   * @param {Object} options - Follow options
   */
  followTarget(target, options = {}) {
    if (!this.activeCamera || !target) return;

    const {
      offset = { x: 0, y: 10, z: 20 },
      lerpSpeed = 0.1,
      lookAtTarget = true
    } = options;

    // Get target position
    const targetPos = target.position || target;
    const targetX = targetPos.x || targetPos._vector?.x || 0;
    const targetY = targetPos.y || targetPos._vector?.y || 0;
    const targetZ = targetPos.z || targetPos._vector?.z || 0;

    // Calculate desired camera position
    const desiredX = targetX + (offset.x || 0);
    const desiredY = targetY + (offset.y || 0);
    const desiredZ = targetZ + (offset.z || 0);

    // Smoothly move camera
    this.activeCamera.position.lerp(
      new THREE.Vector3(desiredX, desiredY, desiredZ),
      lerpSpeed
    );

    // Look at target
    if (lookAtTarget) {
      this.activeCamera.lookAt(targetX, targetY, targetZ);
    }
  }

  /**
   * Update camera
   */
  update(deltaTime) {
    // Camera controllers can hook into this
    this.emit('update', { deltaTime, camera: this.activeCamera });
  }

  /**
   * Resize handler
   */
  resize(width, height) {
    const aspect = width / height;

    // Update all perspective cameras
    for (const camera of this.cameras.values()) {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = aspect;
        camera.updateProjectionMatrix();
      }
    }

    this.emit('resize', { width, height, aspect });
  }

  /**
   * Dispose cameras
   */
  dispose() {
    this.cameras.clear();
    this.activeCamera = null;
    this.defaultCamera = null;
    this.removeAllListeners();
  }
}

