/**
 * TrackGenerator System
 * Procedurally generates endless track segments with obstacles and coins
 */

import { Component, GameObjectFactory } from '../../../src/index.js';
import { RotateComponent } from '../components/RotateComponent.js';

export class TrackGenerator extends Component {
  constructor(config = {}) {
    super();
    this.trackLength = 100;
    this.segmentLength = 10;
    this.laneWidth = 3;
    this.trackWidth = 9; // 3 lanes * 3 units
    this.generatedZ = 0;
    this.segments = [];
  }

  start() {
    // Generate initial track
    for (let i = 0; i < 10; i++) {
      this.generateSegment();
    }
  }

  update(deltaTime) {
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    // Generate new segments as player moves forward
    // Player moves in negative Z, so check if player is getting close to last generated position
    if (player.position.z < this.generatedZ + 50) {
      this.generateSegment();
    }
    
    // Remove old segments that are behind the player
    this.segments = this.segments.filter(segment => {
      if (segment.position.z > player.position.z + 30) {
        scene.removeEntity(segment);
        return false;
      }
      return true;
    });
  }

  generateSegment() {
    const scene = this.entity.scene;
    
    // Ground segment - create as horizontal ground
    const ground = GameObjectFactory.createPlane({
      name: 'Ground',
      width: this.trackWidth,
      height: this.segmentLength,
      color: 0x4a4a4a,
      receiveShadow: true
    });
    
    // IMPORTANT: Rotate the mesh to be horizontal BEFORE adding to scene
    if (ground.mesh) {
      ground.mesh.rotation.x = -Math.PI / 2;
    }
    
    // Set rotation on GameObject too
    ground.rotation.x = -Math.PI / 2;
    ground.setPosition(0, 0, this.generatedZ - this.segmentLength / 2);
    scene.addEntity(ground);
    this.segments.push(ground);
    
    // Side barriers (low walls - won't block view)
    const leftWall = GameObjectFactory.createCube({
      name: 'Wall',
      width: 0.5,
      height: 0.5,
      depth: this.segmentLength,
      color: 0xff6600
    });
    leftWall.setPosition(-this.trackWidth / 2 - 0.25, 0.25, this.generatedZ - this.segmentLength / 2);
    // Make semi-transparent
    if (leftWall.mesh && leftWall.mesh.material) {
      leftWall.mesh.material.transparent = true;
      leftWall.mesh.material.opacity = 0.7;
    }
    scene.addEntity(leftWall);
    this.segments.push(leftWall);
    
    const rightWall = GameObjectFactory.createCube({
      name: 'Wall',
      width: 0.5,
      height: 0.5,
      depth: this.segmentLength,
      color: 0xff6600
    });
    rightWall.setPosition(this.trackWidth / 2 + 0.25, 0.25, this.generatedZ - this.segmentLength / 2);
    // Make semi-transparent
    if (rightWall.mesh && rightWall.mesh.material) {
      rightWall.mesh.material.transparent = true;
      rightWall.mesh.material.opacity = 0.7;
    }
    scene.addEntity(rightWall);
    this.segments.push(rightWall);
    
    // Randomly spawn obstacles (30% chance)
    if (Math.random() < 0.3 && this.generatedZ < -20) {
      this.spawnObstacle(this.generatedZ - this.segmentLength / 2);
    }
    
    // Spawn coins (50% chance)
    if (Math.random() < 0.5) {
      this.spawnCoin(this.generatedZ - this.segmentLength / 2);
    }
    
    this.generatedZ -= this.segmentLength;
  }

  spawnObstacle(z) {
    const scene = this.entity.scene;
    const lane = Math.floor(Math.random() * 3); // Random lane
    const x = (lane - 1) * this.laneWidth;
    
    // Create short barrier to jump over (Subway Surfers style)
    const obstacle = GameObjectFactory.createCube({
      name: 'Obstacle',
      width: 2.5,
      height: 0.8,  // Low barrier - must jump
      depth: 1.5,
      color: 0xff4444,
      castShadow: true
    });
    obstacle.addTag('obstacle');
    obstacle.setPosition(x, 0.4, z);
    scene.addEntity(obstacle);
    this.segments.push(obstacle);
  }

  spawnCoin(z) {
    const scene = this.entity.scene;
    const lane = Math.floor(Math.random() * 3);
    const x = (lane - 1) * this.laneWidth;
    
    const coin = GameObjectFactory.createSphere({
      name: 'Coin',
      radius: 0.5,
      color: 0xffd700,
      castShadow: true
    });
    coin.addTag('coin');
    coin.setPosition(x, 1.5, z);
    coin.addComponent(RotateComponent, { speed: 3 });
    scene.addEntity(coin);
    this.segments.push(coin);
  }
}

