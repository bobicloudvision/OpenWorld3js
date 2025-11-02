import { GameScene, GameObjectFactory, MeshBuilder } from '../../../src/index.js';
import { CarController } from '../components/CarController.js';
import { CameraFollowComponent } from '../components/CameraFollowComponent.js';
import { CheckpointComponent } from '../components/CheckpointComponent.js';
import { ObstacleComponent } from '../components/ObstacleComponent.js';
import { BoundaryComponent } from '../components/BoundaryComponent.js';
import { GameManager } from '../systems/GameManager.js';
import * as THREE from 'three';

/**
 * RaceScene - Main racing scene with track, checkpoints, and obstacles
 */
export class RaceScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'RaceScene';
    this.backgroundColor = 0x87CEEB; // Sky blue
  }

  async load() {
    // Setup lighting
    this.ambientLight.intensity = 0.7;
    this.directionalLight.position.set(20, 30, 10);
    this.directionalLight.intensity = 0.8;

    // Create ground/track
    this.createTrack();
    
    // Create player car
    this.createPlayer();
    
    // Create track features
    this.createCheckpoints();
    this.createObstacles();
    this.createTrackBoundaries();
    
    // Create game manager
    const gameManager = GameObjectFactory.createEmpty({ name: 'GameManager' });
    gameManager.addComponent(GameManager, { totalCheckpoints: 5 });
    this.addEntity(gameManager);

    await super.load();
  }

  createTrack() {
    // Main track (oval shape)
    const trackGeometry = new THREE.PlaneGeometry(100, 60);
    const trackMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x404040,
      roughness: 0.8
    });
    const track = new THREE.Mesh(trackGeometry, trackMaterial);
    track.rotation.x = -Math.PI / 2;
    track.receiveShadow = true;
    this.threeScene.add(track);

    // Grass around track
    const grassGeometry = new THREE.PlaneGeometry(150, 120);
    const grassMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x2d5016,
      roughness: 1
    });
    const grass = new THREE.Mesh(grassGeometry, grassMaterial);
    grass.rotation.x = -Math.PI / 2;
    grass.position.y = -0.1;
    grass.receiveShadow = true;
    this.threeScene.add(grass);

    // Track markings (center lines)
    for (let i = -40; i < 40; i += 10) {
      const lineGeometry = new THREE.BoxGeometry(0.5, 0.1, 4);
      const lineMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xffffff,
        emissive: 0xffffff,
        emissiveIntensity: 0.3
      });
      const line = new THREE.Mesh(lineGeometry, lineMaterial);
      line.position.set(0, 0.05, i);
      this.threeScene.add(line);
    }
  }

  createPlayer() {
    // Create car (simple box for now)
    const carGeometry = new THREE.BoxGeometry(1.5, 0.8, 3);
    const carMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff0000,
      metalness: 0.6,
      roughness: 0.4
    });
    const carMesh = new THREE.Mesh(carGeometry, carMaterial);
    carMesh.castShadow = true;

    const player = GameObjectFactory.builder()
      .name('Player')
      .withTag('player')
      .withMesh(carMesh)
      .at(0, 0.5, 20)
      .withComponent(CarController, { 
        maxSpeed: 25, 
        acceleration: 15, 
        turnSpeed: 3 
      })
      .withComponent(CameraFollowComponent, {
        offset: { x: 0, y: 10, z: 18 },
        lookAtHeight: 1,
        smoothing: 3
      })
      .build();

    this.addEntity(player);
  }

  createCheckpoints() {
    const checkpointPositions = [
      { x: 0, z: 0 },    // Checkpoint 1
      { x: 30, z: -15 }, // Checkpoint 2
      { x: 0, z: -30 },  // Checkpoint 3
      { x: -30, z: -15 },// Checkpoint 4
      { x: 0, z: 20 }    // Finish line
    ];

    checkpointPositions.forEach((pos, index) => {
      const checkpoint = this.createCheckpoint(pos.x, pos.z, index);
      this.addEntity(checkpoint);
    });
  }

  createCheckpoint(x, z, index) {
    // Create checkpoint arch
    const isFinish = index === 4;
    const color = isFinish ? 0x00ff00 : 0xffff00;
    
    // Left pillar
    const leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 0.5),
      new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.3
      })
    );
    leftPillar.position.set(x - 4, 2, z);
    this.threeScene.add(leftPillar);

    // Right pillar
    const rightPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 4, 0.5),
      new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.3
      })
    );
    rightPillar.position.set(x + 4, 2, z);
    this.threeScene.add(rightPillar);

    // Top bar
    const topBar = new THREE.Mesh(
      new THREE.BoxGeometry(8, 0.3, 0.5),
      new THREE.MeshStandardMaterial({ 
        color: color,
        emissive: color,
        emissiveIntensity: 0.3
      })
    );
    topBar.position.set(x, 4, z);

    const checkpoint = GameObjectFactory.builder()
      .name(`Checkpoint${index + 1}`)
      .withTag('checkpoint')
      .withMesh(topBar)
      .at(x, 4, z)
      .withComponent(CheckpointComponent, { 
        index: index,
        radius: 6
      })
      .build();

    return checkpoint;
  }

  createObstacles() {
    const obstaclePositions = [
      { x: 15, z: -5 },
      { x: -15, z: -10 },
      { x: 20, z: -25 },
      { x: -20, z: -20 },
      { x: 10, z: 10 },
      { x: -10, z: 5 }
    ];

    obstaclePositions.forEach(pos => {
      const obstacle = this.createObstacle(pos.x, pos.z);
      this.addEntity(obstacle);
    });
  }

  createObstacle(x, z) {
    const obstacleGeometry = new THREE.CylinderGeometry(1, 1, 2, 8);
    const obstacleMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xff6600,
      emissive: 0xff6600,
      emissiveIntensity: 0.2
    });
    const obstacleMesh = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
    obstacleMesh.castShadow = true;

    const obstacle = GameObjectFactory.builder()
      .name('Obstacle')
      .withTag('obstacle')
      .withMesh(obstacleMesh)
      .at(x, 1, z)
      .withComponent(ObstacleComponent, { 
        slowdownFactor: 0.3,
        radius: 2.5
      })
      .build();

    return obstacle;
  }

  createTrackBoundaries() {
    // Create invisible walls to keep car on track
    const boundaryPositions = [
      { x: 0, z: -40, width: 100, depth: 2 },  // Back
      { x: 0, z: 30, width: 100, depth: 2 },   // Front
      { x: -50, z: -5, width: 2, depth: 70 },  // Left
      { x: 50, z: -5, width: 2, depth: 70 }    // Right
    ];

    boundaryPositions.forEach(pos => {
      const boundary = GameObjectFactory.builder()
        .name('Boundary')
        .withTag('boundary')
        .at(pos.x, 2, pos.z)
        .withComponent(BoundaryComponent, {
          width: pos.width,
          depth: pos.depth
        })
        .build();
      
      this.addEntity(boundary);
    });
  }

  update(deltaTime) {
    super.update(deltaTime);
  }
}

