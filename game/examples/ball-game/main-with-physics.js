/**
 * 🎮 Rolling Ball Game - WITH PHYSICS ENGINE
 * 
 * This version uses the engine's built-in physics system (now fixed!)
 * to demonstrate that the NaN bug has been resolved.
 * 
 * Compare with main.js which uses custom collision detection.
 */

import { GameEngine, GameScene, GameObjectFactory, MeshBuilder, Color } from '../../src/index.js';

class PhysicsBallScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'PhysicsBall';
    this.backgroundColor = 0x87CEEB;
  }

  async load() {
    // Setup lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.intensity = 0.8;

    // Create ground with physics
    const ground = MeshBuilder.createPlane({
      width: 100,
      height: 100,
      color: Color.GRASS
    });
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.threeScene.add(ground);

    // Ground physics body
    this.engine.physicsManager.createPlane({
      position: { x: 0, y: 0, z: 0 },
      mass: 0 // Static
    });

    // Create player ball with REAL PHYSICS
    const player = GameObjectFactory.createSphere({
      name: 'Player',
      radius: 1,
      color: 0xff4444
    });
    player.setPosition(0, 5, 0); // Start higher to test gravity
    player.addTag('player');
    
    // ✅ FIX: Add to scene FIRST, then enable physics
    this.addEntity(player);
    this.player = player;
    
    // Now enable physics (scene is set, physics manager available)
    player.enablePhysics({
      shape: 'sphere',
      radius: 1,
      mass: 1,
      restitution: 0.3,
      friction: 0.8,
      linearDamping: 0.3,
      angularDamping: 0.2
    });

    // Create boundary walls with physics
    this.createWalls();

    // Create pushable obstacles with physics
    this.createPhysicsObstacles();

    // Setup camera
    const camera = this.engine.cameraManager.getActiveCamera();
    camera.position.set(0, 15, 25);
    camera.lookAt(0, 1, 0);

    // Create collectibles (without physics)
    this.createCollectibles();

    await super.load();
  }

  createWalls() {
    const size = 50;
    const height = 4;
    const thickness = 1;

    const wallPositions = [
      { x: 0, z: size, width: size * 2, depth: thickness },
      { x: 0, z: -size, width: size * 2, depth: thickness },
      { x: size, z: 0, width: thickness, depth: size * 2 },
      { x: -size, z: 0, width: thickness, depth: size * 2 }
    ];

    wallPositions.forEach(wall => {
      // Visual
      const wallMesh = MeshBuilder.createBox({
        width: wall.width,
        height: height,
        depth: wall.depth,
        color: 0x666666
      });
      wallMesh.position.set(wall.x, height / 2, wall.z);
      this.threeScene.add(wallMesh);

      // Physics
      this.engine.physicsManager.createBox({
        width: wall.width,
        height: height,
        depth: wall.depth,
        position: { x: wall.x, y: height / 2, z: wall.z },
        mass: 0 // Static walls
      });
    });
  }

  createPhysicsObstacles() {
    this.obstacles = [];

    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * Math.PI * 2;
      const distance = 15 + Math.random() * 15;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      // Random mass (lighter = easier to push)
      const mass = 0.5 + Math.random() * 3;
      
      // Color based on mass
      let color;
      if (mass < 1.5) {
        color = 0x88cc88; // Green - light
      } else if (mass < 2.5) {
        color = 0xccaa66; // Orange - medium
      } else {
        color = 0xcc6666; // Red - heavy
      }

      const obstacle = GameObjectFactory.createCube({
        name: `Obstacle_${i}`,
        width: 2,
        height: 2,
        depth: 2,
        color: color
      });

      obstacle.setPosition(x, 1, z);
      obstacle.addTag('obstacle');

      // ✅ FIX: Add to scene FIRST
      this.addEntity(obstacle);
      this.obstacles.push(obstacle);

      // Then enable physics
      obstacle.enablePhysics({
        shape: 'box',
        width: 2,
        height: 2,
        depth: 2,
        mass: mass, // Different masses
        restitution: 0.1,
        friction: 0.9,
        linearDamping: 0.5
      });
    }
  }

  createCollectibles() {
    this.collectibles = [];

    for (let i = 0; i < 8; i++) {
      let x, z;
      do {
        x = (Math.random() - 0.5) * 80;
        z = (Math.random() - 0.5) * 80;
      } while (Math.sqrt(x * x + z * z) < 5);

      const collectible = GameObjectFactory.createSphere({
        name: `Collectible_${i}`,
        radius: 0.8,
        color: Color.YELLOW
      });

      collectible.setPosition(x, 2, z);
      collectible.addTag('collectible');
      
      // Make it glow
      if (collectible.mesh && collectible.mesh.material) {
        collectible.mesh.material.emissive = { r: 1, g: 0.8, b: 0 };
        collectible.mesh.material.emissiveIntensity = 0.5;
      }

      this.addEntity(collectible);
      this.collectibles.push(collectible);
    }
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    // Control ball with WASD using forces (physics-based)
    if (this.player && this.player.physicsBody) {
      const input = this.engine.inputManager;
      const force = 20; // Force strength
      
      let forceX = 0;
      let forceZ = 0;

      if (input.isKeyDown('KeyW')) forceZ = -force;
      if (input.isKeyDown('KeyS')) forceZ = force;
      if (input.isKeyDown('KeyA')) forceX = -force;
      if (input.isKeyDown('KeyD')) forceX = force;

      if (forceX !== 0 || forceZ !== 0) {
        this.engine.physicsManager.applyForce(
          this.player.physicsBody,
          { x: forceX, y: 0, z: forceZ }
        );
      }

      // Reset ball if it falls
      if (this.player.position.y < -10) {
        this.player.physicsBody.position.set(0, 5, 0);
        this.player.physicsBody.velocity.set(0, 0, 0);
        this.player.physicsBody.angularVelocity.set(0, 0, 0);
      }
    }

    // Check collectibles
    this.checkCollectibles();

    // Update UI
    this.updateUI();
  }

  checkCollectibles() {
    if (!this.player) return;

    for (let i = this.collectibles.length - 1; i >= 0; i--) {
      const collectible = this.collectibles[i];
      if (!collectible.isActive) continue;

      const dx = this.player.position.x - collectible.position.x;
      const dy = this.player.position.y - collectible.position.y;
      const dz = this.player.position.z - collectible.position.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distance < 2) {
        // Collected!
        collectible.destroy();
        this.collectibles.splice(i, 1);
        
        if (this.collectibles.length === 0) {
          console.log('🏆 All collectibles gathered!');
          setTimeout(() => this.createCollectibles(), 2000);
        }
      }
    }
  }

  updateUI() {
    const fpsEl = document.getElementById('fps');
    if (fpsEl && this.engine.stats) {
      fpsEl.textContent = Math.round(this.engine.stats.fps);
    }

    const remainingEl = document.getElementById('remaining');
    if (remainingEl) {
      remainingEl.textContent = this.collectibles.length;
    }

    // Show velocity
    const velocityEl = document.getElementById('velocity');
    if (velocityEl && this.player && this.player.physicsBody) {
      const vel = this.player.physicsBody.velocity;
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
      velocityEl.textContent = speed.toFixed(1);
    }
  }
}

/**
 * Initialize game with PHYSICS ENABLED
 */
function initGame() {
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true,
    physics: true, // ✅ PHYSICS ENABLED! (NaN bug is fixed)
    physicsConfig: {
      gravity: -20,
      iterations: 10
    }
  });

  engine.loadScene(PhysicsBallScene);
  engine.start();

  console.log('🎮 Physics Ball Game started!');
  console.log('✅ Using real physics engine (NaN bug fixed!)');
  console.log('🎮 Controls: WASD to push ball');
}

window.addEventListener('DOMContentLoaded', initGame);

