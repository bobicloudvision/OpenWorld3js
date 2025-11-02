import { Component, GameObjectFactory, MeshBuilder } from '../../../src/index.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';
import { RotateComponent } from '../components/RotateComponent.js';

/**
 * ObstacleManager - Spawns obstacles and collectibles
 * Manages level layout and object placement
 */
export class ObstacleManager extends Component {
  constructor(config = {}) {
    super();
    this.obstacleCount = config.obstacleCount || 6;
    this.collectibleCount = config.collectibleCount || 10;
  }

  start() {
    this.spawnObstacles();
    this.spawnCollectibles();
  }

  spawnObstacles() {
    const scene = this.entity.scene;
    const physics = scene.engine.physicsManager;

    for (let i = 0; i < this.obstacleCount; i++) {
      // Random position in circle
      const angle = (i / this.obstacleCount) * Math.PI * 2 + Math.random() * 0.8;
      const distance = 12 + Math.random() * 18;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Random mass (affects pushability)
      const mass = 1 + Math.random() * 3;

      // Color by mass
      const color = mass < 2 ? 0x66cc66 : mass < 3 ? 0xccaa44 : 0xcc6666;

      // Create obstacle
      const size = 2 + Math.random();
      const obstacle = GameObjectFactory.createCube({
        name: `Obstacle_${i}`,
        width: size,
        height: size,
        depth: size,
        color: color
      });

      obstacle.setPosition(x, size / 2, z);
      obstacle.addTag('obstacle');

      // Add to scene first
      scene.addEntity(obstacle);

      // Then enable physics
      obstacle.enablePhysics({
        shape: 'box',
        width: size,
        height: size,
        depth: size,
        mass: mass,
        restitution: 0.1,
        friction: 0.8,
        linearDamping: 0.6
      });
    }
  }

  spawnCollectibles() {
    const scene = this.entity.scene;

    for (let i = 0; i < this.collectibleCount; i++) {
      // Random position (avoid center)
      let x, z;
      do {
        x = (Math.random() - 0.5) * 70;
        z = (Math.random() - 0.5) * 70;
      } while (Math.sqrt(x * x + z * z) < 6);

      // Create collectible
      const collectible = GameObjectFactory.createSphere({
        name: `Collectible_${i}`,
        radius: 0.7,
        color: 0xffdd00
      });

      collectible.setPosition(x, 2.5, z);
      collectible.addTag('collectible');

      // Make it glow
      if (collectible.mesh && collectible.mesh.material) {
        collectible.mesh.material.emissive = { r: 1, g: 0.9, b: 0 };
        collectible.mesh.material.emissiveIntensity = 0.6;
      }

      // Add components
      collectible.addComponent(CollectibleComponent, {
        points: 10,
        collectionRadius: 2.5
      });

      collectible.addComponent(RotateComponent, {
        rotationSpeed: { x: 0, y: 3, z: 0 },
        bobSpeed: 2,
        bobAmount: 0.4
      });

      scene.addEntity(collectible);
    }
  }
}

