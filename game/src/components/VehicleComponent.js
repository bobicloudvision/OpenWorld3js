import { Component } from '../entities/Component.js';
import * as CANNON from 'cannon-es';

/**
 * VehicleComponent - Car physics controller
 * 
 * Handles vehicle creation, input, and control using Cannon.js RigidVehicle
 * 
 * @example
 * // Create a car with this component
 * const car = GameObjectFactory.createCube({
 *   width: 8, height: 1, depth: 4,
 *   color: 0x0000ff
 * });
 * car.addTag('player');
 * car.setPosition(0, 6, 0);
 * 
 * // Enable physics first
 * car.enablePhysics({ shape: 'box', mass: 5 });
 * 
 * // Add vehicle component
 * car.addComponent(VehicleComponent, {
 *   wheels: [
 *     { position: { x: -2, y: 0, z: 2.5 }, axis: { x: 0, y: 0, z: 1 } },  // Front-left
 *     { position: { x: -2, y: 0, z: -2.5 }, axis: { x: 0, y: 0, z: 1 } }, // Front-right
 *     { position: { x: 2, y: 0, z: 2.5 }, axis: { x: 0, y: 0, z: 1 } },     // Rear-left
 *     { position: { x: 2, y: 0, z: -2.5 }, axis: { x: 0, y: 0, z: 1 } }    // Rear-right
 *   ],
 *   maxForce: 10,
 *   maxSteer: Math.PI / 8
 * });
 */
export class VehicleComponent extends Component {
  constructor(config = {}) {
    super();

    // Vehicle configuration
    this.wheels = config.wheels || [];
    this.maxForce = config.maxForce || 150; // Increased default for better responsiveness
    this.maxSteer = config.maxSteer !== undefined ? config.maxSteer : Math.PI / 6; // ~30 degrees default
    this.wheelRadius = config.wheelRadius || 1;
    this.wheelMass = config.wheelMass || 1;
    this.wheelAngularDamping = config.wheelAngularDamping !== undefined ? config.wheelAngularDamping : 0.2; // Reduced default damping

    // Input keys
    this.forwardKey = config.forwardKey || 'KeyW';
    this.backwardKey = config.backwardKey || 'KeyS';
    this.leftKey = config.leftKey || 'KeyA';
    this.rightKey = config.rightKey || 'KeyD';

    // Vehicle instance (set in start)
    this.vehicle = null;
    this.wheelMeshes = []; // Visual meshes for wheels (optional)

    // State
    this.currentForce = [0, 0, 0, 0]; // Force for each wheel
    this.currentSteer = [0, 0, 0, 0]; // Steering for each wheel
  }

  /**
   * Initialize vehicle after GameObject is added to scene
   */
  start() {
    // Check if entity has physics
    if (!this.entity.physicsBody) {
      console.error(
        '❌ VehicleComponent requires physics to be enabled first!\n' +
        '   Call entity.enablePhysics() before adding VehicleComponent.'
      );
      return;
    }

    // Get physics manager
    const scene = this.entity.scene || this._findScene();
    if (!scene || !scene.engine || !scene.engine.physicsManager) {
      console.error('❌ PhysicsManager not available');
      return;
    }

    const physics = scene.engine.physicsManager;

    // Create vehicle
    this.vehicle = physics.createVehicle({
      chassisBody: this.entity.physicsBody,
      wheels: this.wheels.map(wheel => ({
        position: wheel.position,
        axis: wheel.axis || { x: 0, y: 0, z: 1 },
        radius: wheel.radius || this.wheelRadius,
        mass: wheel.mass || this.wheelMass,
        angularDamping: wheel.angularDamping || this.wheelAngularDamping
      }))
    });

    // Track vehicle in physics manager
    physics.vehicles.set(this.entity.id, this.vehicle);

    // Store reference on entity
    this.entity.vehicle = this.vehicle;

    this.emit('vehicleCreated', { vehicle: this.vehicle });
  }

  /**
   * Handle input and update vehicle controls
   */
  update(deltaTime) {
    if (!this.vehicle) return;

    const input = this.entity.scene.engine.inputManager;
    const physics = this.entity.scene.engine.physicsManager;

    // Reset forces and steering
    const numWheels = this.vehicle.wheelBodies.length;
    let forwardForce = 0;
    let backwardForce = 0;
    let steerLeft = 0;
    let steerRight = 0;

    // Check input
    if (input.isKeyDown(this.forwardKey)) {
      forwardForce = this.maxForce;
    }
    if (input.isKeyDown(this.backwardKey)) {
      backwardForce = -this.maxForce / 2; // Reverse is slower
    }
    if (input.isKeyDown(this.leftKey)) {
      steerLeft = this.maxSteer;
    }
    if (input.isKeyDown(this.rightKey)) {
      steerRight = -this.maxSteer;
    }

    // Apply forces to all wheels for better acceleration (4-wheel drive)
    const force = forwardForce || backwardForce;
    if (force !== 0) {
      // Apply force to all wheels for 4-wheel drive
      for (let i = 0; i < numWheels; i++) {
        physics.setWheelForce(this.vehicle, force, i);
      }
    } else {
      // Reset all wheels when no input
      for (let i = 0; i < numWheels; i++) {
        physics.setWheelForce(this.vehicle, 0, i);
      }
    }

    // Apply steering to front wheels
    const steerValue = steerLeft || steerRight;
    if (numWheels >= 2) {
      physics.setSteeringValue(this.vehicle, steerValue, 0);
      physics.setSteeringValue(this.vehicle, steerValue, 1);
    }

    // Update state
    if (numWheels >= 2) {
      this.currentForce[0] = force;
      this.currentForce[1] = force;
      this.currentSteer[0] = steerValue;
      this.currentSteer[1] = steerValue;
    }
  }

  /**
   * Set wheel force manually
   * @param {number} force - Force value
   * @param {number} wheelIndex - Wheel index
   */
  setWheelForce(force, wheelIndex) {
    if (!this.vehicle) return;

    const physics = this.entity.scene.engine.physicsManager;
    physics.setWheelForce(this.vehicle, force, wheelIndex);
    if (this.currentForce[wheelIndex] !== undefined) {
      this.currentForce[wheelIndex] = force;
    }
  }

  /**
   * Set steering value manually
   * @param {number} value - Steering angle in radians
   * @param {number} wheelIndex - Wheel index
   */
  setSteeringValue(value, wheelIndex) {
    if (!this.vehicle) return;

    const physics = this.entity.scene.engine.physicsManager;
    physics.setSteeringValue(this.vehicle, value, wheelIndex);
    if (this.currentSteer[wheelIndex] !== undefined) {
      this.currentSteer[wheelIndex] = value;
    }
  }

  /**
   * Get vehicle instance
   * @returns {CANNON.RigidVehicle|null}
   */
  getVehicle() {
    return this.vehicle;
  }

  /**
   * Helper to find scene (walk up the tree)
   */
  _findScene() {
    let current = this.entity.parent;
    while (current) {
      if (current.isScene) return current;
      current = current.parent;
    }
    return null;
  }

  /**
   * Cleanup when component is destroyed
   */
  onDestroy() {
    if (this.vehicle) {
      const scene = this.entity.scene || this._findScene();
      if (scene && scene.engine && scene.engine.physicsManager) {
        scene.engine.physicsManager.removeVehicle(this.vehicle);
      }
      this.vehicle = null;
    }

    // Clear wheel meshes
    if (this.wheelMeshes && this.entity.scene) {
      this.wheelMeshes.forEach(mesh => {
        this.entity.scene.threeScene.remove(mesh);
      });
      this.wheelMeshes = [];
    }

    if (this.entity.vehicle) {
      delete this.entity.vehicle;
    }
  }
}

