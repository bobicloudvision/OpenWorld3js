/**
 * GameObject Architecture Demo
 * 
 * Demonstrates Unity-like GameObject system:
 * - GameObject creation with factory
 * - Component lifecycle (Awake, Start, Update, etc.)
 * - Prefab system
 * - Scene queries (Find, FindWithTag, FindObjectsOfType)
 * - Builder pattern
 */

import {
  GameEngine,
  GameScene,
  GameObject,
  GameObjectFactory,
  PrefabManager,
  Component,
  MeshBuilder,
  Color,
  ThirdPersonCamera
} from '../../src/index.js';

// Custom Components

class HealthComponent extends Component {
  constructor(config = {}) {
    super();
    // Handle both number and object config
    const maxHealth = typeof config === 'number' ? config : (config.maxHealth || 100);
    this.maxHealth = maxHealth;
    this.health = maxHealth;
  }

  awake() {
    console.log(`HealthComponent awake on ${this.entity.name}`);
  }

  start() {
    console.log(`HealthComponent start on ${this.entity.name}`);
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.emit('damaged', { amount, current: this.health });
    
    if (this.health <= 0) {
      this.emit('died');
      this.sendMessage('onDied');
    }
  }

  heal(amount) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.emit('healed', { amount, current: this.health });
  }

  getHealthPercent() {
    return this.health / this.maxHealth;
  }
}

class CollectibleComponent extends Component {
  constructor(config = {}) {
    super();
    // Handle both number and object config
    const value = typeof config === 'number' ? config : (config.value || 10);
    this.value = value;
    this.collected = false;
  }

  start() {
    console.log(`Collectible spawned: ${this.entity.name}`);
  }

  update(deltaTime) {
    // Rotate collectible
    if (this.entity.mesh) {
      this.entity.mesh.rotation.y += deltaTime * 2;
    }
  }

  collect(collector) {
    if (this.collected) return;
    
    this.collected = true;
    this.emit('collected', { collector, value: this.value });
    
    console.log(`Collected by ${collector.name}!`);
    this.entity.destroy();
  }
}

class EnemyAIComponent extends Component {
  constructor(config = {}) {
    super();
    this.moveSpeed = config.moveSpeed || 3;
    this.detectionRange = config.detectionRange || 15;
    this.attackRange = config.attackRange || 2;
    this.attackDamage = config.attackDamage || 10;
    this.attackCooldown = config.attackCooldown || 2;
    this.lastAttackTime = 0;
  }

  start() {
    console.log(`Enemy AI started: ${this.entity.name}`);
  }

  update(deltaTime) {
    if (!this.entity.scene) return;

    // Find player
    const player = this.entity.scene.findWithTag('player');
    if (!player) return;

    const distance = this.entity.distanceTo(player);

    // Chase player if in range
    if (distance < this.detectionRange) {
      if (distance > this.attackRange) {
        // Move toward player
        const direction = player.position.clone().sub(this.entity.position).normalize();
        this.entity.move(direction, deltaTime);
        this.entity.faceDirection(direction);
      } else {
        // Attack player
        this.attackPlayer(player);
      }
    }
  }

  attackPlayer(player) {
    const now = Date.now() / 1000;
    if (now - this.lastAttackTime < this.attackCooldown) return;

    this.lastAttackTime = now;
    
    const healthComp = player.getComponent(HealthComponent);
    if (healthComp) {
      healthComp.takeDamage(this.attackDamage);
      console.log(`Enemy attacked player! Health: ${healthComp.health}`);
    }
  }

  onDied() {
    console.log(`Enemy ${this.entity.name} died!`);
  }
}

class PlayerController extends Component {
  constructor(config = {}) {
    super();
    this.moveSpeed = config.moveSpeed || 8;
    this.jumpForce = config.jumpForce || 10;
    this.isGrounded = config.isGrounded !== undefined ? config.isGrounded : true;
    this.score = 0;
  }

  awake() {
    console.log('PlayerController Awake');
  }

  start() {
    console.log('PlayerController Start');
    
    // Listen to health events
    const health = this.getComponent(HealthComponent);
    if (health) {
      health.on('damaged', (data) => {
        console.log(`Player took ${data.amount} damage! Health: ${data.current}`);
        this.updateUI();
      });
      
      health.on('died', () => {
        console.log('Player died!');
        alert('Game Over! You died.');
      });
    }
  }

  update(deltaTime) {
    if (!this.entity.scene) return;

    const input = this.entity.scene.engine.inputManager;
    
    // Movement (isKeyDown for continuous movement)
    let moveX = 0;
    let moveZ = 0;

    if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) moveZ -= 1;
    if (input.isKeyDown('KeyS') || input.isKeyDown('ArrowDown')) moveZ += 1;
    if (input.isKeyDown('KeyA') || input.isKeyDown('ArrowLeft')) moveX -= 1;
    if (input.isKeyDown('KeyD') || input.isKeyDown('ArrowRight')) moveX += 1;

    // Apply movement to physics body if physics is enabled
    if (this.entity.physicsBody) {
      if (moveX !== 0 || moveZ !== 0) {
        const direction = { x: moveX, y: 0, z: moveZ };
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.x /= length;
        direction.z /= length;

        // Set physics body velocity directly
        this.entity.physicsBody.velocity.x = direction.x * this.moveSpeed;
        this.entity.physicsBody.velocity.z = direction.z * this.moveSpeed;
        
        // Face direction
        const angle = Math.atan2(direction.x, direction.z);
        this.entity.rotation.y = angle;
      } else {
        // Stop horizontal movement
        this.entity.physicsBody.velocity.x = 0;
        this.entity.physicsBody.velocity.z = 0;
      }

      // Check if grounded (simple check: y velocity near zero and low position)
      this.isGrounded = Math.abs(this.entity.physicsBody.velocity.y) < 0.5 && 
                        this.entity.physicsBody.position.y < 3;

      // Jump (isKeyPressed for single press)
      if (input.isKeyPressed('Space') && this.isGrounded) {
        this.entity.physicsBody.velocity.y = this.jumpForce;
      }
    } else {
      // Non-physics movement (fallback)
      if (moveX !== 0 || moveZ !== 0) {
        const direction = { x: moveX, y: 0, z: moveZ };
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        direction.x /= length;
        direction.z /= length;

        this.entity.velocity.x = direction.x * this.moveSpeed;
        this.entity.velocity.z = direction.z * this.moveSpeed;
        
        this.entity.faceDirection(this.entity.velocity);
      } else {
        this.entity.velocity.x = 0;
        this.entity.velocity.z = 0;
      }
    }

    // Attack nearest enemy (isKeyPressed for single press)
    if (input.isKeyPressed('KeyQ')) {
      this.attackNearestEnemy();
    }

    // Check collectibles
    this.checkCollectibles();
  }

  attackNearestEnemy() {
    const enemies = this.entity.scene.findGameObjectsWithTag('enemy');
    let nearest = null;
    let nearestDist = 5; // Attack range

    for (const enemy of enemies) {
      const dist = this.entity.distanceTo(enemy);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = enemy;
      }
    }

    if (nearest) {
      const health = nearest.getComponent(HealthComponent);
      if (health) {
        health.takeDamage(25);
        console.log(`Attacked ${nearest.name}! Health: ${health.health}`);
        
        if (health.health <= 0) {
          this.score += 100;
          this.updateUI();
        }
      }
    }
  }

  checkCollectibles() {
    const collectibles = this.entity.scene.findGameObjectsWithTag('collectible');
    
    for (const collectible of collectibles) {
      const dist = this.entity.distanceTo(collectible);
      if (dist < 2) {
        const comp = collectible.getComponent(CollectibleComponent);
        if (comp && !comp.collected) {
          comp.collect(this.entity);
          this.score += comp.value;
          this.updateUI();
        }
      }
    }
  }

  updateUI() {
    const health = this.getComponent(HealthComponent);
    if (health) {
      document.getElementById('playerHealth').textContent = health.health;
    }
    document.getElementById('score').textContent = this.score;
  }

  onDied() {
    console.log('Player died!');
  }
}

// Game Scene

class DemoScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'GameObjectDemo';
    this.backgroundColor = Color.SKY_BLUE;
  }

  async load() {
    // Ground
    const ground = MeshBuilder.createPlane({
      width: 50,
      height: 50,
      color: Color.GRASS,
      receiveShadow: true
    });
    ground.rotation.x = -Math.PI / 2;
    this.threeScene.add(ground);

    // Physics ground (disabled)
    // this.engine.physicsManager.createPlane({ position: { x: 0, y: 0, z: 0 } });

    // Register Prefabs
    this.registerPrefabs();

    // Create Player using Builder Pattern
    this.player = GameObjectFactory.builder()
      .name('Player')
      .withTag('player')
      .withMesh(MeshBuilder.createCapsule({
        radius: 0.5,
        height: 2,
        color: 0x4a90e2,
        castShadow: true
      }))
      .at(0, 1, 0)
      .withSpeed(8)
      .withComponent(HealthComponent, { maxHealth: 100 })
      .withComponent(PlayerController)
      .build();

    this.addEntity(this.player);

    // TODO: Physics has issues causing NaN positions - needs investigation
    // this.player.enablePhysics({
    //   shape: 'box',
    //   width: 1,
    //   height: 2,
    //   depth: 1,
    //   mass: 70,
    //   fixedRotation: true
    // });

    // Setup camera
    const activeCamera = this.engine.cameraManager.getActiveCamera();
    
    // Set initial camera position
    activeCamera.position.set(0, 8, 15);
    activeCamera.lookAt(0, 1, 0);
    
    // Create third person camera (not updating - TODO: fix mouse handling causing NaN)
    this.camera = new ThirdPersonCamera(
      activeCamera,
      this.player,
      { distance: 15, height: 8, smoothness: 0.1 }
    );
    // TODO: Fix ThirdPersonCamera mouse handling before enabling
    // this.camera.setInputManager(this.engine.inputManager);

    // Spawn some initial enemies
    for (let i = 0; i < 3; i++) {
      this.spawnEnemy();
    }

    // Spawn some collectibles
    for (let i = 0; i < 5; i++) {
      this.spawnCollectible();
    }

    // Setup UI
    this.setupUI();

    await super.load();
  }

  registerPrefabs() {
    // Enemy Prefab
    PrefabManager.register('Enemy', (config = {}) => {
      const enemy = GameObjectFactory.createCube({
        name: 'Enemy',
        width: 1,
        height: 2,
        depth: 1,
        color: 0xff4444,
        castShadow: true
      });

      enemy.addTag('enemy');
      enemy.addComponent(HealthComponent, { maxHealth: 50 });
      enemy.addComponent(EnemyAIComponent);

      const health = enemy.getComponent(HealthComponent);
      health.on('died', () => {
        setTimeout(() => enemy.destroy(), 500);
      });

      return enemy;
    });

    // Collectible Prefab
    PrefabManager.register('Collectible', (config = {}) => {
      const collectible = GameObjectFactory.createSphere({
        name: 'Coin',
        radius: 0.5,
        color: 0xffdd00,
        castShadow: true
      });

      collectible.addTag('collectible');
      collectible.addComponent(CollectibleComponent, { value: 10 });

      return collectible;
    });
  }

  spawnEnemy() {
    const angle = Math.random() * Math.PI * 2;
    const distance = 10 + Math.random() * 10;
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;

    const enemy = PrefabManager.instantiate('Enemy');
    enemy.setPosition(x, 1, z);
    this.addEntity(enemy);

    // TODO: Physics disabled temporarily
    // enemy.enablePhysics({
    //   shape: 'box',
    //   width: 1,
    //   height: 2,
    //   depth: 1,
    //   mass: 50,
    //   fixedRotation: true
    // });

    this.updateStats();
  }

  spawnCollectible() {
    const x = (Math.random() - 0.5) * 40;
    const z = (Math.random() - 0.5) * 40;

    const collectible = PrefabManager.instantiate('Collectible');
    collectible.setPosition(x, 1, z);
    this.addEntity(collectible);

    this.updateStats();
  }

  setupUI() {
    document.getElementById('spawnEnemy').addEventListener('click', () => {
      this.spawnEnemy();
    });

    document.getElementById('spawnCollectible').addEventListener('click', () => {
      this.spawnCollectible();
    });

    document.getElementById('clearAll').addEventListener('click', () => {
      this.clearEnemies();
      this.clearCollectibles();
    });

    // Setup key spawning
    const input = this.engine.inputManager;
    this.on('update', () => {
      if (input.isKeyPressed('KeyE')) {
        this.spawnEnemy();
      }
      if (input.isKeyPressed('KeyC')) {
        this.spawnCollectible();
      }
    });
  }

  clearEnemies() {
    const enemies = this.findGameObjectsWithTag('enemy');
    enemies.forEach(enemy => enemy.destroy());
    this.updateStats();
  }

  clearCollectibles() {
    const collectibles = this.findGameObjectsWithTag('collectible');
    collectibles.forEach(c => c.destroy());
    this.updateStats();
  }

  updateStats() {
    const enemyCount = this.findGameObjectsWithTag('enemy').length;
    const collectibleCount = this.findGameObjectsWithTag('collectible').length;
    
    document.getElementById('enemyCount').textContent = enemyCount;
    document.getElementById('collectibleCount').textContent = collectibleCount;
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    // Update camera (TODO: Fix ThirdPersonCamera before enabling)
    // if (this.camera) {
    //   this.camera.update(deltaTime);
    // }

    // Update stats periodically
    if (Math.floor(elapsedTime * 2) !== Math.floor((elapsedTime - deltaTime) * 2)) {
      this.updateStats();
    }
  }
}

// Initialize Game

const engine = new GameEngine({
  physics: false,  // TODO: Physics disabled - causes NaN positions, needs investigation
});

engine.start();
engine.loadScene(DemoScene);

console.log('🎮 GameObject Demo Started!');
console.log('Controls: WASD to move, E to spawn enemy, C to spawn collectible, Q to attack');
console.log('Note: Physics and ThirdPersonCamera disabled temporarily due to bugs');

