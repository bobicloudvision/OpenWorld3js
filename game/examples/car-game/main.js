/**
 * 🚗 Car Physics Game
 * 
 * A car driving game using Cannon.js RigidVehicle physics
 * 
 * Controls:
 * - W/ArrowUp: Accelerate
 * - S/ArrowDown: Reverse
 * - A/ArrowLeft: Steer left
 * - D/ArrowRight: Steer right
 * - P: Toggle physics debug visualization
 */

import {
  GameEngine,
  GameScene,
  GameObjectFactory,
  VehicleComponent,
  MeshBuilder,
  Color,
  Vector3
} from '../../src/index.js';

/**
 * Car Game Scene
 */
class CarGameScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'CarGame';
    this.backgroundColor = 0x87CEEB; // Sky blue
  }

  async load() {
    // Setup lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.intensity = 0.8;

    // Create ground plane
    const ground = MeshBuilder.createPlane({
      width: 100,
      height: 100,
      color: Color.GRASS
    });
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    this.threeScene.add(ground);

    // Add ground physics (static plane)
    const physics = this.engine.physicsManager;
    physics.createPlane({
      mass: 0,
      rotation: { x: -Math.PI / 2, y: 0, z: 0 },
      friction: 4 // High friction for good grip
    });

    // Create car
    const car = GameObjectFactory.createCube({
      name: 'Car',
      width: 8,
      height: 1,
      depth: 4,
      color: 0x0000ff // Blue car
    });
    car.setPosition(0, 6, 0);
    this.addEntity(car);

    // Enable physics on car FIRST (required before VehicleComponent)
    car.enablePhysics({
      shape: 'box',
      width: 8,
      height: 1,
      depth: 4,
      mass: 5,
      friction: 0.3,
      linearDamping: 0.1,  // Reduced damping for faster movement
      angularDamping: 0.1  // Reduced angular damping
    });

    // Add VehicleComponent with 4 wheels
    car.addComponent(VehicleComponent, {
      wheels: [
        // Front wheels (steering wheels)
        { 
          position: { x: -2, y: 0, z: 2.5 },  // Front-left
          axis: { x: 0, y: 0, z: 1 },
          radius: 1,
          mass: 1,
          angularDamping: 0.2 // Reduced damping for faster response
        },
        { 
          position: { x: -2, y: 0, z: -2.5 }, // Front-right
          axis: { x: 0, y: 0, z: 1 },
          radius: 1,
          mass: 1,
          angularDamping: 0.2
        },
        // Rear wheels (driving wheels)
        { 
          position: { x: 2, y: 0, z: 2.5 },   // Rear-left
          axis: { x: 0, y: 0, z: 1 },
          radius: 1,
          mass: 1,
          angularDamping: 0.2
        },
        { 
          position: { x: 2, y: 0, z: -2.5 },  // Rear-right
          axis: { x: 0, y: 0, z: 1 },
          radius: 1,
          mass: 1,
          angularDamping: 0.2
        }
      ],
      maxForce: 150, // Increased from 10 for faster acceleration
      maxSteer: Math.PI / 6, // Increased steering angle for better control (~30 degrees)
      forwardKey: 'KeyW',
      backwardKey: 'KeyS',
      leftKey: 'KeyA',
      rightKey: 'KeyD'
    });

    // Store car reference
    this.car = car;

    // Create wheel visual meshes (optional - for better visuals)
    this.createWheelMeshes(car);

    // Setup camera to follow car
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.set(0, 15, 20);
    camera.lookAt(0, 0, 0);

    // Add axis helper for reference
    const axesHelper = MeshBuilder.createAxesHelper({ size: 8 });
    this.threeScene.add(axesHelper);

    await super.load();

    console.log('🚗 Car Game loaded!');
    console.log('🎮 Controls: WASD or Arrow keys to drive');
    console.log('🔍 Press P to toggle physics debug visualization');
  }

  /**
   * Create visual meshes for wheels
   */
  createWheelMeshes(car) {
    if (!car.vehicle || !car.vehicle.wheelBodies) return;

    const vehicleComponent = car.getComponent(VehicleComponent);
    if (!vehicleComponent) return;

    vehicleComponent.wheelMeshes = [];

    car.vehicle.wheelBodies.forEach((wheelBody, index) => {
      // Create sphere mesh for wheel using engine abstraction
      const wheelMesh = MeshBuilder.createSphere({
        radius: 1,
        widthSegments: 16,
        heightSegments: 12,
        useNormalMaterial: true // Use MeshNormalMaterial for colorful debug look
      });

      this.threeScene.add(wheelMesh);
      vehicleComponent.wheelMeshes.push(wheelMesh);
    });
  }

  /**
   * Update scene - sync wheel meshes with physics
   */
  update(deltaTime) {
    super.update(deltaTime);

    // Sync wheel visual meshes with physics
    if (this.car && this.car.vehicle) {
      const vehicleComponent = this.car.getComponent(VehicleComponent);
      if (vehicleComponent && vehicleComponent.wheelMeshes) {
        this.car.vehicle.wheelBodies.forEach((wheelBody, index) => {
          if (vehicleComponent.wheelMeshes[index]) {
            vehicleComponent.wheelMeshes[index].position.copy(wheelBody.position);
            vehicleComponent.wheelMeshes[index].quaternion.copy(wheelBody.quaternion);
          }
        });
      }
    }

    // Toggle physics debug with P key
    const input = this.engine.inputManager;
    if (input.isKeyPressed('KeyP')) {
      this.engine.physicsManager.toggleDebug();
    }

    // Update camera to follow car using engine abstraction
    if (this.car && this.car.mesh) {
      this.engine.cameraManager.followTarget(this.car.mesh, {
        offset: { x: 0, y: 10, z: 20 },
        lerpSpeed: 0.1,
        lookAtTarget: true
      });
    }
  }
}

/**
 * Initialize and start the game
 */
function initGame() {
  // Create engine with physics enabled
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true,
    physics: true, // ✅ Enable physics!
    physicsConfig: {
      gravity: -9.82,
      iterations: 10,
      debug: false, // Start with debug off (press P to toggle)
      // Better physics timestep settings for responsive vehicles
      timeStep: 1 / 60, // Fixed timestep
      maxSubSteps: 5 // More substeps for smoother physics
    }
  });

  // Load and start the game scene
  engine.loadScene(CarGameScene);
  engine.start();

  console.log('🚗 Car Physics Game started!');
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', initGame);

