import * as THREE from 'three';
import { GameEngine, Scene, Actor, ThirdPersonCamera } from '../../src/index.js';
import { HealthComponent } from '../components/HealthComponent.js';
import { CombatComponent } from '../components/CombatComponent.js';

/**
 * RPG Game Scene demonstrating component usage
 * Shows how to add health, combat, and other game-specific features
 * WITHOUT modifying the core engine
 */
class RPGGameScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'RPGGameScene';
    this.backgroundColor = 0x87CEEB;

    this.player = null;
    this.enemy = null;
    this.cameraController = null;
  }

  async initialize() {
    await super.initialize();

    this.ambientLight.intensity = 0.6;
    this.directionalLight.intensity = 0.8;
    this.directionalLight.position.set(10, 20, 10);

    this.setFog(0x87CEEB, 50, 200);
  }

  async load() {
    this.createGround();
    this.createPlayer();
    this.createEnemy();
    this.setupCamera();
    this.setupInput();

    await super.load();
  }

  createGround() {
    const geometry = new THREE.PlaneGeometry(200, 200, 50, 50);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x3a8c3a,
      roughness: 0.8
    });
    
    const ground = new THREE.Mesh(geometry, material);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = Math.random() * 0.5;
      positions.setY(i, y);
    }
    geometry.computeVertexNormals();
    
    this.add(ground);
  }

  createPlayer() {
    // Create mesh
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0x4a90e2
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.position.y = 1;

    // Create Actor (just movement)
    this.player = new Actor({
      name: 'Player',
      speed: 8
    });
    this.player.mesh = mesh;
    this.player.setPosition(0, 1, 0);

    // Add game-specific components
    const health = new HealthComponent(100);
    this.player.addComponent(health);

    const combat = new CombatComponent({
      attackPower: 25,
      defense: 10,
      attackRange: 3,
      attackCooldown: 1.0
    });
    this.player.addComponent(combat);

    // Listen to component events
    health.on('damaged', (data) => {
      console.log(`Player took ${data.amount} damage! Health: ${data.currentHealth}`);
      this.updateHealthUI();
    });

    health.on('healed', (data) => {
      console.log(`Player healed ${data.amount}! Health: ${data.currentHealth}`);
      this.updateHealthUI();
    });

    health.on('died', () => {
      console.log('Player died!');
      // Respawn after 3 seconds
      setTimeout(() => {
        health.respawn(1.0);
        this.player.setPosition(0, 1, 0);
        console.log('Player respawned!');
        this.updateHealthUI();
      }, 3000);
    });

    combat.on('attacked', ({ target, actualDamage }) => {
      console.log(`Player attacked enemy for ${actualDamage} damage!`);
    });

    this.addEntity(this.player);
  }

  createEnemy() {
    // Create mesh
    const geometry = new THREE.BoxGeometry(1, 2, 1);
    const material = new THREE.MeshStandardMaterial({ 
      color: 0xff0000
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;

    // Create Actor
    this.enemy = new Actor({
      name: 'Enemy',
      speed: 3
    });
    this.enemy.mesh = mesh;
    this.enemy.setPosition(10, 1, 0);

    // Add components
    const health = new HealthComponent(50);
    this.enemy.addComponent(health);

    const combat = new CombatComponent({
      attackPower: 15,
      defense: 5,
      attackRange: 2,
      attackCooldown: 1.5
    });
    this.enemy.addComponent(combat);

    // Listen to events
    health.on('died', () => {
      console.log('Enemy defeated!');
      // Respawn enemy
      setTimeout(() => {
        health.respawn(1.0);
        this.enemy.setPosition(10, 1, 0);
      }, 5000);
    });

    this.addEntity(this.enemy);
  }

  setupCamera() {
    const camera = this.engine.cameraManager.getActiveCamera();
    
    this.cameraController = new ThirdPersonCamera(camera, this.player, {
      distance: 12,
      height: 6,
      smoothness: 0.15
    });

    this.cameraController.setInputManager(this.engine.inputManager);
  }

  setupInput() {
    const input = this.engine.inputManager;

    input.bindAction('forward', ['KeyW']);
    input.bindAction('backward', ['KeyS']);
    input.bindAction('left', ['KeyA']);
    input.bindAction('right', ['KeyD']);
    input.bindAction('attack', ['Space']);
    
    // Debug keys
    input.bindAction('testDamage', ['KeyT']);
    input.bindAction('testHeal', ['KeyH']);
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.player && this.cameraController) {
      this.updatePlayerMovement(deltaTime);
      this.updatePlayerCombat(deltaTime);
      this.cameraController.update(deltaTime);
    }

    this.updateUI();
  }

  updatePlayerMovement(deltaTime) {
    const input = this.engine.inputManager;
    const moveDirection = new THREE.Vector3();

    const forward = this.cameraController.getForwardDirection();
    const right = this.cameraController.getRightDirection();

    if (input.isActionDown('forward')) moveDirection.add(forward);
    if (input.isActionDown('backward')) moveDirection.sub(forward);
    if (input.isActionDown('left')) moveDirection.sub(right);
    if (input.isActionDown('right')) moveDirection.add(right);

    if (moveDirection.lengthSq() > 0) {
      this.player.move(moveDirection, deltaTime);
      this.player.rotateTo(moveDirection, deltaTime);
    } else {
      this.player.stop();
    }

    if (this.player.position.y < 1) {
      this.player.position.y = 1;
    }
  }

  updatePlayerCombat(deltaTime) {
    const input = this.engine.inputManager;
    const playerCombat = this.player.getComponent('CombatComponent');

    // Attack enemy
    if (input.isActionPressed('attack')) {
      if (this.enemy) {
        const success = playerCombat.attack(this.enemy);
        if (!success) {
          console.log('Cannot attack - on cooldown or out of range');
        }
      }
    }

    // Debug: Take damage
    if (input.isActionPressed('testDamage')) {
      const health = this.player.getComponent('HealthComponent');
      health.takeDamage(20);
    }

    // Debug: Heal
    if (input.isActionPressed('testHeal')) {
      const health = this.player.getComponent('HealthComponent');
      health.heal(30);
    }
  }

  updateUI() {
    // FPS
    document.getElementById('fps') && (
      document.getElementById('fps').textContent = Math.round(this.engine.stats.fps)
    );

    // Player stats
    const health = this.player.getComponent('HealthComponent');
    const combat = this.player.getComponent('CombatComponent');

    if (health) {
      document.getElementById('health').textContent = Math.round(health.health);
      document.getElementById('maxHealth').textContent = health.maxHealth;
      
      const healthPercent = health.getHealthPercent() * 100;
      document.getElementById('health-fill').style.width = healthPercent + '%';
    }

    if (combat) {
      document.getElementById('attack').textContent = combat.attackPower;
      document.getElementById('defense').textContent = combat.defense;
      document.getElementById('combat-status').textContent = 
        combat.isInCombat ? 'In Combat' : 'Peaceful';
    }
  }

  updateHealthUI() {
    // Trigger UI update
    this.updateUI();
  }
}

/**
 * Initialize game
 */
function initGame() {
  const engine = new GameEngine({
    canvas: document.querySelector('#game-canvas'),
    antialias: true,
    shadowMapEnabled: true
  });

  engine.loadScene(RPGGameScene);
  engine.start();

  console.log('RPG game with components started!');
  console.log('This demonstrates how to add health, combat, etc. via components');
  console.log('The core Actor class remains generic and reusable!');
}

window.addEventListener('DOMContentLoaded', initGame);

