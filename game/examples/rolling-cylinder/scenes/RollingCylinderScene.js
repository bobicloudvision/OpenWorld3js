import { GameScene, GameObjectFactory, MeshBuilder, Color } from '../../../src/index.js';
import { WheelComponent } from '../components/WheelComponent.js';
import { CameraFollowComponent } from '../components/CameraFollowComponent.js';
import { GameManager } from '../systems/GameManager.js';

/**
 * RollingCylinderScene - Main game scene
 * 
 * A physics-based rolling cylinder game where the player controls
 * a wheel, avoiding obstacles and collecting items.
 */
export class RollingCylinderScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'RollingCylinderGame';
    this.backgroundColor = 0x87CEEB;  // Sky blue
  }

  async load() {
    console.log('Loading Rolling Cylinder Scene...');

    // === LIGHTING ===
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.intensity = 0.8;

    // === GROUND ===
    this.createGround();

    // === PLAYER WHEEL ===
    const player = this.createPlayer();

    // === CAMERA CONTROLLER ===
    this.createCameraController(player);

    // === GAME MANAGER ===
    this.createGameManager();

    // === INITIAL OBSTACLES ===
    this.createInitialObstacles();

    await super.load();
    
    console.log('Rolling Cylinder Scene loaded!');
  }

  createGround() {
    // Create ground as a thin box (easier for physics)
    const groundObj = GameObjectFactory.createCube({
      name: 'Ground',
      width: 40,
      height: 0.5,
      depth: 200,
      color: 0x4CAF50
    });
    
    groundObj.setPosition(0, -0.25, -50);
    this.addEntity(groundObj);
    
    // Enable physics - box shape is naturally horizontal
    groundObj.enablePhysics({
      shape: 'box',
      width: 40,
      height: 0.5,
      depth: 200,
      mass: 0,  // Static
      restitution: 0.3,
      friction: 1
    });

    // Add side walls for boundaries
    this.createWall(-22, 2.5, -50, 2, 5, 200);  // Left wall
    this.createWall(22, 2.5, -50, 2, 5, 200);   // Right wall
  }

  createWall(x, y, z, width, height, depth) {
    const wall = GameObjectFactory.createCube({
      name: 'Wall',
      color: 0x888888,
      width: width,
      height: height,
      depth: depth
    });
    
    wall.setPosition(x, y + height/2, z);
    this.addEntity(wall);
    
    wall.enablePhysics({
      shape: 'box',
      mass: 0,  // Static
      restitution: 0.5,
      friction: 0.3
    });
  }

  createPlayer() {
    // Create cylinder for the wheel
    const player = GameObjectFactory.createCylinder({
      name: 'Player',
      radiusTop: 1,
      radiusBottom: 1,
      height: 1.5,
      color: 0x2196F3,
      radialSegments: 16
    });

    player.addTag('player');
    player.setPosition(0, 1, 0);
    
    // Rotate cylinder to lay on its side for rolling (rotate around Z axis)
    player.setRotation(0, 0, Math.PI / 2);
    
    // Also rotate the mesh directly to ensure visual matches
    if (player.mesh) {
      player.mesh.rotation.set(0, 0, Math.PI / 2);
    }

    this.addEntity(player);

    // Enable physics AFTER adding to scene
    player.enablePhysics({
      shape: 'cylinder',
      radiusTop: 1,
      radiusBottom: 1,
      height: 1.5,
      mass: 1,
      restitution: 0.3,
      friction: 0.7,
      linearDamping: 0.1,
      angularDamping: 0.2
    });

    // Add wheel component for controls
    player.addComponent(WheelComponent, {
      acceleration: 20,
      brakeForce: 15,
      maxSpeed: 30,
      turnSpeed: 2.5,
      radius: 1
    });

    return player;
  }

  createCameraController(player) {
    // Create empty GameObject for camera controller
    const cameraController = GameObjectFactory.createEmpty({ name: 'CameraController' });
    this.addEntity(cameraController);

    // Add camera follow component
    cameraController.addComponent(CameraFollowComponent, {
      target: player,
      offset: { x: 0, y: 8, z: 15 },
      smoothSpeed: 3,
      lookAhead: 3,
      followRotation: true
    });
  }

  createGameManager() {
    const gameManager = GameObjectFactory.createEmpty({ name: 'GameManager' });
    this.addEntity(gameManager);

    gameManager.addComponent(GameManager, {
      health: 100,
      spawnDistance: 40,
      spawnRadius: 15,
      obstacleSpawnRate: 2.5,
      collectibleSpawnRate: 2
    });
  }

  createInitialObstacles() {
    // Create a few initial obstacles so the game doesn't feel empty
    const positions = [
      { x: -5, z: -20 },
      { x: 5, z: -35 },
      { x: 0, z: -50 },
      { x: -8, z: -65 },
      { x: 8, z: -80 }
    ];

    for (const pos of positions) {
      // Random obstacle
      const isBox = Math.random() > 0.5;
      const obstacle = isBox
        ? GameObjectFactory.createCube({
            name: 'InitialObstacle',
            color: 0xff0000,
            width: 2,
            height: 2,
            depth: 2
          })
        : GameObjectFactory.createSphere({
            name: 'InitialObstacle',
            color: 0xff4444,
            radius: 1.5
          });

      obstacle.addTag('obstacle');
      obstacle.setPosition(pos.x, 1, pos.z);
      this.addEntity(obstacle);

      obstacle.enablePhysics({
        shape: isBox ? 'box' : 'sphere',
        mass: 10,
        restitution: 0.3,
        friction: 0.5
      });
    }

    // Create initial collectibles
    const collectiblePositions = [
      { x: 0, z: -15 },
      { x: -7, z: -30 },
      { x: 7, z: -45 },
      { x: 0, z: -60 }
    ];

    for (const pos of collectiblePositions) {
      const collectible = GameObjectFactory.createSphere({
        name: 'InitialCollectible',
        color: 0xffff00,
        radius: 0.5
      });

      collectible.addTag('collectible');
      collectible.setPosition(pos.x, 2, pos.z);
      
      // Import CollectibleComponent here to avoid circular dependency
      import('../components/CollectibleComponent.js').then(({ CollectibleComponent }) => {
        collectible.addComponent(CollectibleComponent, { value: 50 });
        
        // Listen for collection
        const collectibleComp = collectible.getComponent(CollectibleComponent);
        if (collectibleComp) {
          collectibleComp.on('collected', () => {
            const gameManager = this.find('GameManager');
            if (gameManager) {
              const gm = gameManager.getComponent(GameManager);
              if (gm) gm.addScore(50);
            }
          });
        }
      });

      this.addEntity(collectible);
    }
  }

  update(deltaTime) {
    super.update(deltaTime);

    // Toggle physics debug with 'P' key
    const input = this.engine.inputManager;
    if (input.isKeyPressed('KeyP')) {
      this.engine.physicsManager.toggleDebug();
    }
  }
}

