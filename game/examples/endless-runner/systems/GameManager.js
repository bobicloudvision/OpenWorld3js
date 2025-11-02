/**
 * GameManager System
 * Manages game state, score, speed, and UI updates
 */

import { Component } from '../../../src/index.js';
import { PlayerController } from '../components/PlayerController.js';
import { CollisionDetector } from '../components/CollisionDetector.js';

export class GameManager extends Component {
  constructor(config = {}) {
    super();
    this.score = 0;
    this.distance = 0;
    this.gameSpeed = 10;
    this.isGameOver = false;
  }

  start() {
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (player) {
      const playerController = player.getComponent(PlayerController);
      playerController.on('died', () => this.gameOver());
    }
    
    const collisionDetector = scene.find('GameManager').getComponent(CollisionDetector);
    if (collisionDetector) {
      collisionDetector.on('coinCollected', () => {
        this.score += 10;
        this.updateUI();
      });
    }
  }

  update(deltaTime) {
    if (this.isGameOver) return;
    
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    // Move player forward
    player.position.z -= this.gameSpeed * deltaTime;
    
    // Update distance and score
    this.distance += this.gameSpeed * deltaTime;
    this.score += Math.floor(this.gameSpeed * deltaTime);
    
    // Gradually increase speed
    this.gameSpeed += 0.001;
    
    this.updateUI();
  }

  updateUI() {
    document.getElementById('score').textContent = Math.floor(this.score);
    document.getElementById('distance').textContent = Math.floor(this.distance) + 'm';
  }

  gameOver() {
    this.isGameOver = true;
    
    document.getElementById('final-score').textContent = Math.floor(this.score);
    document.getElementById('final-distance').textContent = Math.floor(this.distance);
    document.getElementById('game-over').classList.add('show');
  }

  restart() {
    window.location.reload();
  }
}

