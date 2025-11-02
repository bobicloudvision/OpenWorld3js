import { GameScene, GameObjectFactory, MeshBuilder, Color } from '../../../src/index.js';
import { BallController } from '../components/BallController.js';
import { CameraFollowComponent } from '../components/CameraFollowComponent.js';
import { GameManager } from '../systems/GameManager.js';
import { PlatformManager } from '../systems/PlatformManager.js';

/**
 * RollingBallScene - Main game scene
 */
export class RollingBallScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'RollingBall';
    this.backgroundColor = 0x87CEEB; // Sky blue
  }

  async load() {
    // Setup lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.intensity = 0.8;

    // Create ground
    const ground = MeshBuilder.createPlane({
      width: 100,
      height: 100,
      color: Color.GRASS
    });
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.threeScene.add(ground);

    // Create boundary walls
    this.createBoundaryWalls();

    // Create player ball
    const player = GameObjectFactory.builder()
      .name('Player')
      .withTag('player')
      .withMesh(MeshBuilder.createSphere({
        radius: 1,
        color: 0xff4444,
        castShadow: true
      }))
      .at(0, 1, 0)
      .withComponent(BallController, { speed: 15 })
      .build();
    this.addEntity(player);

    // Create camera follower (empty GameObject with camera component)
    const cameraFollower = GameObjectFactory.createEmpty({
      name: 'CameraFollower'
    });
    cameraFollower.addComponent(CameraFollowComponent, {
      target: player,
      offset: { x: 0, y: 12, z: 18 },
      smoothness: 0.15,
      lookAtOffset: { x: 0, y: 0, z: 0 }
    });
    this.addEntity(cameraFollower);

    // Create game manager
    const gameManager = GameObjectFactory.createEmpty({
      name: 'GameManager'
    });
    gameManager.addComponent(GameManager);
    this.addEntity(gameManager);

    // Create platform manager (spawns obstacles and collectibles)
    const platformManager = GameObjectFactory.createEmpty({
      name: 'PlatformManager'
    });
    platformManager.addComponent(PlatformManager, {
      obstacleCount: 8,
      collectibleCount: 10
    });
    this.addEntity(platformManager);

    await super.load();
  }

  createBoundaryWalls() {
    const size = 50;
    const height = 4;
    const thickness = 1;

    const wallPositions = [
      { x: 0, z: size, width: size * 2, depth: thickness },     // Front
      { x: 0, z: -size, width: size * 2, depth: thickness },    // Back
      { x: size, z: 0, width: thickness, depth: size * 2 },     // Right
      { x: -size, z: 0, width: thickness, depth: size * 2 }     // Left
    ];

    wallPositions.forEach((wall, index) => {
      const wallMesh = MeshBuilder.createBox({
        width: wall.width,
        height: height,
        depth: wall.depth,
        color: 0x666666
      });
      wallMesh.position.set(wall.x, height / 2, wall.z);
      wallMesh.receiveShadow = true;
      wallMesh.castShadow = true;
      this.threeScene.add(wallMesh);
    });
  }
}

