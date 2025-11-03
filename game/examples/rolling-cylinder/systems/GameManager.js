import { Component, GameObjectFactory, MeshBuilder } from '../../../src/index.js';
import { ObstacleComponent } from '../components/ObstacleComponent.js';
import { CollectibleComponent } from '../components/CollectibleComponent.js';

/**
 * GameManager - Manages game state, spawning, and scoring
 * 
 * Features:
 * - Score tracking
 * - Health system
 * - Dynamic obstacle spawning
 * - Collectible spawning
 * - UI updates
 * - Game over handling
 */
export class GameManager extends Component {
  constructor(config = {}) {
    super();
    
    this.score = 0;
    this.health = config.health || 100;
    this.maxHealth = this.health;
    this.isGameOver = false;
    
    // Spawning settings
    this.spawnDistance = config.spawnDistance || 50;    // How far ahead to spawn
    this.spawnRadius = config.spawnRadius || 15;        // Lateral spawn range
    this.obstacleSpawnRate = config.obstacleSpawnRate || 3;  // Seconds between obstacles
    this.collectibleSpawnRate = config.collectibleSpawnRate || 2;
    
    this.timeSinceObstacleSpawn = 0;
    this.timeSinceCollectibleSpawn = 0;
    
    // Game difficulty
    this.gameSpeed = 1;
    this.difficultyIncreaseRate = 0.1;  // Every 10 seconds
    this.timePlayed = 0;
  }

  start() {
    this.updateUI();
    
    // Listen for collectible events
    const scene = this.entity.scene;
    
    // We'll manually check for collisions in update since
    // physics collision events might not be fully set up
  }

  update(deltaTime) {
    if (this.isGameOver) return;

    // Update timers
    this.timePlayed += deltaTime;
    this.timeSinceObstacleSpawn += deltaTime;
    this.timeSinceCollectibleSpawn += deltaTime;

    // Increase difficulty over time
    this.gameSpeed = 1 + (this.timePlayed * this.difficultyIncreaseRate / 10);

    // Update score based on time survived
    this.score += deltaTime * 10 * this.gameSpeed;

    // Spawn obstacles
    if (this.timeSinceObstacleSpawn >= this.obstacleSpawnRate / this.gameSpeed) {
      this.spawnObstacle();
      this.timeSinceObstacleSpawn = 0;
    }

    // Spawn collectibles
    if (this.timeSinceCollectibleSpawn >= this.collectibleSpawnRate / this.gameSpeed) {
      this.spawnCollectible();
      this.timeSinceCollectibleSpawn = 0;
    }

    // Check collisions manually
    this.checkCollisions();

    // Clean up distant objects
    this.cleanupDistantObjects();

    // Update UI
    this.updateUI();
  }

  spawnObstacle() {
    const player = this.entity.scene.findWithTag('player');
    if (!player) return;

    // Spawn ahead of player
    const spawnZ = player.position.z - this.spawnDistance;
    const spawnX = player.position.x + (Math.random() - 0.5) * this.spawnRadius;

    // Random obstacle type
    const obstacleType = Math.random();
    let obstacle;

    if (obstacleType < 0.5) {
      // Cube obstacle
      obstacle = GameObjectFactory.createCube({
        name: 'Obstacle',
        color: 0xff0000,
        width: 2,
        height: 2,
        depth: 2
      });
    } else {
      // Sphere obstacle
      obstacle = GameObjectFactory.createSphere({
        name: 'Obstacle',
        color: 0xff4444,
        radius: 1.5
      });
    }

    obstacle.addTag('obstacle');
    obstacle.setPosition(spawnX, 1, spawnZ);
    obstacle.addComponent(ObstacleComponent, { damage: 15 });

    // Add to scene
    this.entity.scene.addEntity(obstacle);

    // Enable physics
    obstacle.enablePhysics({
      shape: obstacleType < 0.5 ? 'box' : 'sphere',
      mass: 10,
      restitution: 0.3,
      friction: 0.5
    });
  }

  spawnCollectible() {
    const player = this.entity.scene.findWithTag('player');
    if (!player) return;

    // Spawn ahead of player
    const spawnZ = player.position.z - this.spawnDistance;
    const spawnX = player.position.x + (Math.random() - 0.5) * this.spawnRadius;

    // Create collectible
    const collectible = GameObjectFactory.createSphere({
      name: 'Collectible',
      color: 0xffff00,
      radius: 0.5
    });

    collectible.addTag('collectible');
    collectible.setPosition(spawnX, 2, spawnZ);
    collectible.addComponent(CollectibleComponent, { value: 50 });

    // Listen for collection
    const collectibleComp = collectible.getComponent(CollectibleComponent);
    collectibleComp.on('collected', (data) => {
      this.addScore(data.value);
    });

    this.entity.scene.addEntity(collectible);
  }

  checkCollisions() {
    const player = this.entity.scene.findWithTag('player');
    if (!player) return;

    // Check obstacles
    const obstacles = this.entity.scene.findGameObjectsWithTag('obstacle');
    for (const obstacle of obstacles) {
      const distance = this.getDistance(player.position, obstacle.position);
      
      if (distance < 2.5) {  // Collision threshold
        const obstacleComp = obstacle.getComponent(ObstacleComponent);
        if (obstacleComp && !obstacleComp.hasHit) {
          this.takeDamage(obstacleComp.damage);
          obstacleComp.hasHit = true;
        }
      }
    }
  }

  getDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  cleanupDistantObjects() {
    const player = this.entity.scene.findWithTag('player');
    if (!player) return;

    // Remove obstacles behind player
    const obstacles = this.entity.scene.findGameObjectsWithTag('obstacle');
    for (const obstacle of obstacles) {
      if (obstacle.position.z > player.position.z + 20) {
        obstacle.destroy();
      }
    }

    // Remove collectibles behind player
    const collectibles = this.entity.scene.findGameObjectsWithTag('collectible');
    for (const collectible of collectibles) {
      if (collectible.position.z > player.position.z + 20) {
        collectible.destroy();
      }
    }
  }

  addScore(points) {
    this.score += points;
    this.updateUI();
  }

  takeDamage(amount) {
    this.health = Math.max(0, this.health - amount);
    this.updateUI();

    // Flash screen red
    this.flashDamage();

    if (this.health <= 0) {
      this.gameOver();
    }
  }

  flashDamage() {
    const overlay = document.getElementById('damage-overlay');
    if (overlay) {
      overlay.style.opacity = '0.5';
      setTimeout(() => {
        overlay.style.opacity = '0';
      }, 200);
    }
  }

  gameOver() {
    if (this.isGameOver) return;
    
    this.isGameOver = true;
    
    // Show game over screen
    const gameOverScreen = document.getElementById('game-over');
    const finalScoreEl = document.getElementById('final-score');
    
    if (gameOverScreen) {
      gameOverScreen.style.display = 'flex';
    }
    if (finalScoreEl) {
      finalScoreEl.textContent = Math.floor(this.score);
    }
  }

  updateUI() {
    // Update score
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      scoreEl.textContent = Math.floor(this.score);
    }

    // Update health
    const healthEl = document.getElementById('health');
    if (healthEl) {
      healthEl.textContent = Math.floor(this.health);
    }

    // Update health bar
    const healthBarFill = document.getElementById('health-bar-fill');
    if (healthBarFill) {
      const healthPercent = (this.health / this.maxHealth) * 100;
      healthBarFill.style.width = healthPercent + '%';
      
      // Color based on health
      if (healthPercent > 60) {
        healthBarFill.style.backgroundColor = '#4CAF50';
      } else if (healthPercent > 30) {
        healthBarFill.style.backgroundColor = '#FFC107';
      } else {
        healthBarFill.style.backgroundColor = '#F44336';
      }
    }

    // Update speed
    const speedEl = document.getElementById('speed');
    if (speedEl) {
      const player = this.entity.scene.findWithTag('player');
      if (player && player.physicsBody) {
        const speed = player.physicsBody.velocity.length();
        speedEl.textContent = speed.toFixed(1);
      }
    }
  }

  restart() {
    // Reload the scene
    window.location.reload();
  }
}

