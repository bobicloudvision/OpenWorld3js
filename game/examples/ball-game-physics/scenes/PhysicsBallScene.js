import { GameScene, GameObjectFactory, MeshBuilder, Color } from '../../../src/index.js';
import { BallController } from '../components/BallController.js';
import { CameraFollowComponent } from '../components/CameraFollowComponent.js';
import { GameManager } from '../systems/GameManager.js';
import { ObstacleManager } from '../systems/ObstacleManager.js';

/**
 * PhysicsBallScene - Main game scene
 * Sets up the game world with physics-based ball gameplay
 */
export class PhysicsBallScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'PhysicsBall';
    this.backgroundColor = 0x87CEEB; // Sky blue
  }

  async load() {
    // Setup lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(15, 25, 15);
    this.directionalLight.intensity = 0.8;

    // Create ground
    this.createGround();

    // Create boundary walls
    this.createWalls();

    // Create player ball
    this.createPlayer();

    // Create camera follower
    this.createCamera();

    // Create game systems
    this.createGameSystems();

    await super.load();
  }

  createGround() {
    // ✅ Create GameObject (proper way!)
    const ground = GameObjectFactory.createPlane({
      name: 'Ground',
      width: 100,
      height: 100,
      color: Color.GRASS,
      position: { x: 0, y: 0, z: 0 }
    });

    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    ground.addTag('ground');

    // Add to scene first
    this.addEntity(ground);

    // ✅ Then enable physics (proper way!)
    ground.enablePhysics({
      shape: 'plane',
      mass: 0,           // Static ground
      restitution: 0.6,  // Bouncy ground for ball to bounce!
      friction: 0.5
    });
  }

  createWalls() {
    const size = 50;
    const height = 5;
    const thickness = 1;

    const wallConfigs = [
      { x: 0, z: size, width: size * 2, depth: thickness },
      { x: 0, z: -size, width: size * 2, depth: thickness },
      { x: size, z: 0, width: thickness, depth: size * 2 },
      { x: -size, z: 0, width: thickness, depth: size * 2 }
    ];

    wallConfigs.forEach((config, index) => {
      // ✅ Create GameObject (proper way!)
      const wall = GameObjectFactory.createCube({
        name: `Wall_${index}`,
        width: config.width,
        height: height,
        depth: config.depth,
        color: 0x666666,
        position: { x: config.x, y: height / 2, z: config.z }
      });

      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.addTag('wall');

      // Add to scene first
      this.addEntity(wall);

      // ✅ Then enable physics (proper way!)
      wall.enablePhysics({
        shape: 'box',
        width: config.width,
        height: height,
        depth: config.depth,
        mass: 0,           // Static wall
        restitution: 0.5,  // Bouncy
        friction: 0.3
      });
    });
  }

  createPlayer() {
    const player = GameObjectFactory.createSphere({
      name: 'Player',
      radius: 1,
      color: 0xff4444
    });

    player.setPosition(0, 5, 0);
    player.addTag('player');

    // Add to scene first
    this.addEntity(player);

    // Then enable physics with bouncing
    player.enablePhysics({
      shape: 'sphere',
      radius: 1,
      mass: 1,
      restitution: 0.7,  // Higher value = more bouncy! (0.0 = no bounce, 1.0 = perfect bounce)
      friction: 0.7,
      linearDamping: 0.2,  // Reduced for better bouncing
      angularDamping: 0.2,
      fixedRotation: false  // ✅ Allow ball to roll!
    });

    // Add controller
    player.addComponent(BallController, {
      moveForce: 20,
      maxSpeed: 15,
      jumpForce: 8  // Lower value for realistic jump height
    });
  }

  createCamera() {
    const cameraController = GameObjectFactory.createEmpty({
      name: 'CameraController'
    });

    cameraController.addComponent(CameraFollowComponent, {
      targetTag: 'player',
      offset: { x: 0, y: 15, z: 20 },
      smoothness: 0.15,
      lookAtHeight: 0
    });

    this.addEntity(cameraController);
  }

  createGameSystems() {
    // Game Manager
    const gameManager = GameObjectFactory.createEmpty({
      name: 'GameManager'
    });
    gameManager.addComponent(GameManager);
    this.addEntity(gameManager);

    // Obstacle Manager
    const obstacleManager = GameObjectFactory.createEmpty({
      name: 'ObstacleManager'
    });
    obstacleManager.addComponent(ObstacleManager, {
      obstacleCount: 6,
      collectibleCount: 10
    });
    this.addEntity(obstacleManager);
  }
}

