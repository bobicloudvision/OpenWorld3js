/**
 * 🌟 Sky Platforms Game - Jumping & Collecting in the Sky!
 * A fun platformer using the game engine
 */
import { 
  GameEngine, 
  Scene, 
  Actor, 
  ThirdPersonCamera,
  MeshBuilder,
  Color,
  VectorUtils
} from '../../src/index.js';

class SkyPlatformsScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'SkyPlatformsScene';
    this.backgroundColor = Color.SKY_BLUE;

    // Game state
    this.player = null;
    this.cameraController = null;
    this.platforms = [];
    this.gems = [];
    this.score = 0;
    this.gemsCollected = 0;
    this.totalGems = 15;
    this.gameTime = 60; // 60 seconds
    this.gameOver = false;
    this.warningThreshold = -20; // Height below which player gets warning
  }

  async initialize() {
    await super.initialize();

    // Setup dramatic lighting
    this.ambientLight.intensity = 0.5;
    this.directionalLight.intensity = 1.0;
    this.directionalLight.position.set(20, 40, 20);
    this.directionalLight.castShadow = true;

    // Add atmospheric fog
    this.setFog(new Color(0.5, 0.7, 1.0), 80, 300);
  }

  async load() {
    // Create the sky world
    this.createSkybox();
    
    // Create starting platform
    this.createStartPlatform();

    // Create floating platforms
    this.createFloatingPlatforms();

    // Create player
    this.createPlayer();

    // Create gems to collect
    this.createGems();

    // Setup camera
    this.setupCamera();

    // Setup input
    this.setupInput();

    // Add some decorative clouds
    this.createClouds();

    await super.load();
  }

  createSkybox() {
    // Create a large sphere to simulate sky
    const skyRadius = 500;
    const sky = MeshBuilder.createSphere({
      radius: skyRadius,
      color: Color.SKY_BLUE,
      wireframe: false
    });
    
    // Invert the sphere so we see the inside
    sky.scale.set(-1, 1, 1);
    sky.position.y = 0;
    
    this.add(sky);
  }

  createStartPlatform() {
    // Large starting platform
    const platform = MeshBuilder.createBox({
      width: 15,
      height: 2,
      depth: 15,
      color: Color.GREEN,
      castShadow: true,
      receiveShadow: true
    });
    
    platform.position.set(0, 0, 0);
    this.add(platform);
    this.platforms.push({ mesh: platform, isStatic: true });
  }

  createFloatingPlatforms() {
    const platformConfigs = [
      // Close ring of platforms
      { distance: 20, angle: 0, height: 5, size: 8, color: Color.ORANGE },
      { distance: 20, angle: Math.PI / 2, height: 3, size: 7, color: Color.CYAN },
      { distance: 20, angle: Math.PI, height: 7, size: 8, color: Color.PURPLE },
      { distance: 20, angle: 3 * Math.PI / 2, height: 4, size: 7, color: Color.PINK },
      
      // Middle ring
      { distance: 35, angle: Math.PI / 4, height: 12, size: 6, color: Color.YELLOW },
      { distance: 35, angle: 3 * Math.PI / 4, height: 10, size: 6, color: Color.GREEN },
      { distance: 35, angle: 5 * Math.PI / 4, height: 15, size: 6, color: Color.RED },
      { distance: 35, angle: 7 * Math.PI / 4, height: 13, size: 6, color: Color.BLUE },
      
      // Far ring (challenging)
      { distance: 50, angle: 0, height: 20, size: 5, color: Color.CYAN },
      { distance: 50, angle: 2 * Math.PI / 3, height: 22, size: 5, color: Color.ORANGE },
      { distance: 50, angle: 4 * Math.PI / 3, height: 18, size: 5, color: Color.PURPLE },
      
      // High platforms
      { distance: 25, angle: Math.PI / 6, height: 25, size: 6, color: Color.YELLOW },
      { distance: 25, angle: 5 * Math.PI / 6, height: 28, size: 5, color: Color.PINK },
    ];

    platformConfigs.forEach((config, index) => {
      const platform = MeshBuilder.createBox({
        width: config.size,
        height: 1.5,
        depth: config.size,
        color: config.color,
        castShadow: true,
        receiveShadow: true
      });

      const x = Math.cos(config.angle) * config.distance;
      const z = Math.sin(config.angle) * config.distance;
      
      platform.position.set(x, config.height, z);
      
      this.add(platform);
      
      // Some platforms move
      const isMoving = index % 3 === 0;
      this.platforms.push({
        mesh: platform,
        isStatic: !isMoving,
        moveSpeed: isMoving ? 0.5 + Math.random() * 0.5 : 0,
        moveRadius: isMoving ? 3 + Math.random() * 3 : 0,
        moveAngle: Math.random() * Math.PI * 2,
        originalPos: { x, y: config.height, z }
      });
    });
  }

  createPlayer() {
    // Create player mesh
    const mesh = MeshBuilder.createBox({
      width: 1,
      height: 2,
      depth: 1,
      color: 0x4a90e2,
      castShadow: true
    });
    mesh.position.y = 3;

    // Create player actor
    this.player = new Actor({
      name: 'Player',
      speed: 10
    });

    this.player.mesh = mesh;
    this.player.setPosition(0, 3, 0);

    // Player physics
    this.player.jumpForce = 12;
    this.player.gravity = -25;
    this.player.velocityY = 0;
    this.player.isGrounded = false;
    this.player.canDoubleJump = false;
    this.player.hasDoubleJumped = false;

    this.addEntity(this.player);
  }

  createGems() {
    // Place gems on platforms (skip starting platform)
    const gemPlatforms = this.platforms.slice(1, this.totalGems + 1);
    
    gemPlatforms.forEach((platform, index) => {
      const gem = MeshBuilder.createSphere({
        radius: 0.5,
        color: Color.YELLOW,
        emissive: true
      });

      gem.position.copy(platform.mesh.position);
      gem.position.y += 3; // Float above platform
      
      this.add(gem);
      
      this.gems.push({
        mesh: gem,
        collected: false,
        rotation: Math.random() * Math.PI * 2,
        bobOffset: Math.random() * Math.PI * 2,
        baseY: gem.position.y
      });
    });
  }

  createClouds() {
    // Add some decorative clouds
    for (let i = 0; i < 20; i++) {
      const cloudSize = 3 + Math.random() * 4;
      const cloud = MeshBuilder.createSphere({
        radius: cloudSize,
        color: new Color(1, 1, 1),
        wireframe: false
      });

      const angle = Math.random() * Math.PI * 2;
      const distance = 60 + Math.random() * 100;
      
      cloud.position.set(
        Math.cos(angle) * distance,
        -10 + Math.random() * 80,
        Math.sin(angle) * distance
      );

      cloud.scale.set(1.5, 0.6, 1);
      
      this.add(cloud);
    }
  }

  setupCamera() {
    const camera = this.engine.cameraManager.getActiveCamera();
    
    this.cameraController = new ThirdPersonCamera(camera, this.player, {
      distance: 15,
      height: 8,
      smoothness: 0.1,
      minDistance: 8,
      maxDistance: 30
    });

    this.cameraController.setInputManager(this.engine.inputManager);
  }

  setupInput() {
    const input = this.engine.inputManager;

    input.bindAction('forward', ['KeyW', 'ArrowUp']);
    input.bindAction('backward', ['KeyS', 'ArrowDown']);
    input.bindAction('left', ['KeyA', 'ArrowLeft']);
    input.bindAction('right', ['KeyD', 'ArrowRight']);
    input.bindAction('jump', ['Space']);
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.gameOver) return;

    // Update game timer
    this.updateTimer(deltaTime);

    if (this.player && this.cameraController) {
      this.updatePlayerMovement(deltaTime);
      this.cameraController.update(deltaTime);
    }

    // Animate platforms
    this.updatePlatforms(deltaTime, elapsedTime);

    // Animate gems
    this.updateGems(deltaTime, elapsedTime);

    // Check gem collection
    this.checkGemCollection();

    // Check if player fell
    this.checkPlayerFall();

    // Update UI
    this.updateUI();
  }

  updateTimer(deltaTime) {
    this.gameTime -= deltaTime;
    
    if (this.gameTime <= 0) {
      this.gameTime = 0;
      this.endGame();
    }
  }

  updatePlayerMovement(deltaTime) {
    const input = this.engine.inputManager;
    const moveDirection = this.player.velocity;
    moveDirection.set(0, 0, 0);

    // Get camera directions
    const forward = this.cameraController.getForwardDirection();
    const right = this.cameraController.getRightDirection();

    // Calculate movement
    if (input.isActionDown('forward')) moveDirection.add(forward);
    if (input.isActionDown('backward')) moveDirection.sub(forward);
    if (input.isActionDown('left')) moveDirection.sub(right);
    if (input.isActionDown('right')) moveDirection.add(right);

    // Move player
    if (moveDirection.lengthSq() > 0) {
      this.player.move(moveDirection, deltaTime);
      this.player.rotateTo(moveDirection, deltaTime);
    } else {
      this.player.stop();
    }

    // Jumping
    if (input.isActionPressed('jump')) {
      if (this.player.isGrounded) {
        this.player.velocityY = this.player.jumpForce;
        this.player.isGrounded = false;
        this.player.hasDoubleJumped = false;
        this.player.canDoubleJump = true;
      } else if (this.player.canDoubleJump && !this.player.hasDoubleJumped) {
        // Double jump
        this.player.velocityY = this.player.jumpForce * 0.8;
        this.player.hasDoubleJumped = true;
        this.player.canDoubleJump = false;
      }
    }

    // Apply gravity
    if (!this.player.isGrounded) {
      this.player.velocityY += this.player.gravity * deltaTime;
    }

    this.player.position.y += this.player.velocityY * deltaTime;

    // Check platform collisions
    this.checkPlatformCollisions();
  }

  checkPlatformCollisions() {
    this.player.isGrounded = false;

    for (const platform of this.platforms) {
      const mesh = platform.mesh;
      const halfWidth = mesh.scale.x * (platform.isStatic ? 7.5 : 3);
      const halfDepth = mesh.scale.z * (platform.isStatic ? 7.5 : 3);
      const platformTop = mesh.position.y + 1;

      // Check if player is above platform
      if (this.player.position.x >= mesh.position.x - halfWidth &&
          this.player.position.x <= mesh.position.x + halfWidth &&
          this.player.position.z >= mesh.position.z - halfDepth &&
          this.player.position.z <= mesh.position.z + halfDepth) {
        
        // Landing on platform
        if (this.player.position.y <= platformTop + 1 && 
            this.player.position.y >= platformTop - 1 &&
            this.player.velocityY <= 0) {
          this.player.position.y = platformTop + 1;
          this.player.velocityY = 0;
          this.player.isGrounded = true;
          this.player.hasDoubleJumped = false;
          break;
        }
      }
    }
  }

  updatePlatforms(deltaTime, elapsedTime) {
    this.platforms.forEach(platform => {
      if (!platform.isStatic && platform.moveSpeed > 0) {
        // Move platform in a circle
        platform.moveAngle += platform.moveSpeed * deltaTime;
        
        const offsetX = Math.cos(platform.moveAngle) * platform.moveRadius;
        const offsetZ = Math.sin(platform.moveAngle) * platform.moveRadius;
        
        platform.mesh.position.x = platform.originalPos.x + offsetX;
        platform.mesh.position.z = platform.originalPos.z + offsetZ;
      }
    });
  }

  updateGems(deltaTime, elapsedTime) {
    this.gems.forEach(gem => {
      if (gem.collected) return;

      // Rotate
      gem.rotation += deltaTime * 2;
      gem.mesh.rotation.y = gem.rotation;

      // Bob up and down
      gem.bobOffset += deltaTime * 3;
      gem.mesh.position.y = gem.baseY + Math.sin(gem.bobOffset) * 0.5;

      // Pulse scale
      const scale = 1 + Math.sin(elapsedTime * 3) * 0.1;
      gem.mesh.scale.set(scale, scale, scale);
    });
  }

  checkGemCollection() {
    this.gems.forEach(gem => {
      if (gem.collected) return;

      const distance = Math.sqrt(
        Math.pow(this.player.position.x - gem.mesh.position.x, 2) +
        Math.pow(this.player.position.y - gem.mesh.position.y, 2) +
        Math.pow(this.player.position.z - gem.mesh.position.z, 2)
      );

      if (distance < 2) {
        gem.collected = true;
        this.gemsCollected++;
        this.score += 100;

        // Animate collection
        const startScale = gem.mesh.scale.x;
        let animTime = 0;
        const animDuration = 0.3;

        const animate = () => {
          animTime += 0.016;
          const progress = animTime / animDuration;
          
          if (progress < 1) {
            const scale = startScale * (1 + progress * 2);
            gem.mesh.scale.set(scale, scale, scale);
            gem.mesh.material.opacity = 1 - progress;
            requestAnimationFrame(animate);
          } else {
            this.remove(gem.mesh);
          }
        };
        animate();

        // Check win condition
        if (this.gemsCollected >= this.totalGems) {
          this.winGame();
        }
      }
    });
  }

  checkPlayerFall() {
    const warning = document.getElementById('warning');
    
    if (this.player.position.y < this.warningThreshold) {
      warning.classList.add('show');
    } else {
      warning.classList.remove('show');
    }

    if (this.player.position.y < -50) {
      this.endGame();
    }
  }

  updateUI() {
    document.getElementById('fps').textContent = Math.round(this.engine.stats.fps);
    document.getElementById('score').textContent = this.score;
    document.getElementById('gems').textContent = `${this.gemsCollected} / ${this.totalGems}`;
    document.getElementById('time').textContent = `${Math.ceil(this.gameTime)}s`;
    document.getElementById('height').textContent = `${this.player.position.y.toFixed(1)}m`;
  }

  winGame() {
    this.gameOver = true;
    this.score += Math.ceil(this.gameTime) * 10; // Bonus for remaining time
    this.showGameOver('🎉 YOU WIN! 🎉');
  }

  endGame() {
    this.gameOver = true;
    this.showGameOver('⏰ TIME\'S UP!');
  }

  showGameOver(message) {
    const gameOverDiv = document.getElementById('game-over');
    gameOverDiv.querySelector('h2').textContent = message;
    document.getElementById('final-score').textContent = this.score;
    document.getElementById('final-gems').textContent = `${this.gemsCollected} / ${this.totalGems}`;
    gameOverDiv.classList.add('show');
  }
}

/**
 * Initialize the game
 */
function initGame() {
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true
  });

  engine.loadScene(SkyPlatformsScene);
  engine.start();

  console.log('🌟 Sky Platforms game started!');
  console.log('🎮 Collect all gems before time runs out!');
}

window.addEventListener('DOMContentLoaded', initGame);

