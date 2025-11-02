import { Component, GameObjectFactory, MeshBuilder, Color } from '../../../src/index.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';
import { RotateComponent } from '../components/RotateComponent.js';

/**
 * PlatformManager - Spawns obstacles and collectibles
 */
export class PlatformManager extends Component {
  constructor(config = {}) {
    super();
    this.obstacleCount = config.obstacleCount || 8;
    this.collectibleCount = config.collectibleCount || 10;
  }

  start() {
    this.spawnObstacles();
    this.spawnCollectibles();
  }

  spawnObstacles() {
    const scene = this.entity.scene;
    
    for (let i = 0; i < this.obstacleCount; i++) {
      // Random position
      const angle = (i / this.obstacleCount) * Math.PI * 2 + Math.random() * 0.5;
      const distance = 15 + Math.random() * 20;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Random obstacle type
      const types = ['cube', 'cylinder', 'cone'];
      const type = types[Math.floor(Math.random() * types.length)];

      let obstacle;
      if (type === 'cube') {
        obstacle = GameObjectFactory.createCube({
          name: `Obstacle_${i}`,
          width: 2 + Math.random() * 2,
          height: 2 + Math.random() * 3,
          depth: 2 + Math.random() * 2,
          color: 0x666666
        });
      } else if (type === 'cylinder') {
        obstacle = GameObjectFactory.createCylinder({
          name: `Obstacle_${i}`,
          radiusTop: 1 + Math.random(),
          radiusBottom: 1 + Math.random(),
          height: 2 + Math.random() * 3,
          color: 0x888888
        });
      } else {
        // Cone
        obstacle = GameObjectFactory.createCylinder({
          name: `Obstacle_${i}`,
          radiusTop: 0,
          radiusBottom: 1 + Math.random(),
          height: 2 + Math.random() * 3,
          color: 0x999999
        });
      }

      obstacle.setPosition(x, obstacle.mesh.geometry.parameters.height / 2 || 1, z);
      obstacle.addTag('obstacle');
      scene.addEntity(obstacle);
    }
  }

  spawnCollectibles() {
    const scene = this.entity.scene;

    for (let i = 0; i < this.collectibleCount; i++) {
      // Random position (avoid center where player spawns)
      let x, z;
      do {
        x = (Math.random() - 0.5) * 80;
        z = (Math.random() - 0.5) * 80;
      } while (Math.sqrt(x * x + z * z) < 5); // Keep away from spawn

      // Create collectible
      const collectible = GameObjectFactory.createSphere({
        name: `Collectible_${i}`,
        radius: 0.8,
        color: Color.YELLOW
      });

      // Make it glow
      if (collectible.mesh && collectible.mesh.material) {
        collectible.mesh.material.emissive = { r: 1, g: 0.8, b: 0 };
        collectible.mesh.material.emissiveIntensity = 0.5;
      }

      collectible.setPosition(x, 2, z);
      collectible.addTag('collectible');

      // Add components
      collectible.addComponent(CollectibleComponent, { points: 10, collectionRadius: 2 });
      collectible.addComponent(RotateComponent, {
        rotationSpeed: { x: 0, y: 3, z: 0 },
        bobSpeed: 2,
        bobAmount: 0.3
      });

      scene.addEntity(collectible);
    }
  }
}

