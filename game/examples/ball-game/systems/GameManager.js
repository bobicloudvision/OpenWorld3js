import { Component } from '../../../src/index.js';

/**
 * GameManager - Manages game state, score, and UI
 */
export class GameManager extends Component {
  constructor(config = {}) {
    super();
    this.score = 0;
    this.collectedCount = 0;
    this.totalCollectibles = 0;
    this.gameTime = 0;
  }

  start() {
    // Count initial collectibles
    const collectibles = this.entity.scene.findGameObjectsWithTag('collectible');
    this.totalCollectibles = collectibles.length;

    // Listen for collectible events
    collectibles.forEach(collectible => {
      const collectibleComp = collectible.getComponent('CollectibleComponent');
      if (collectibleComp) {
        collectibleComp.on('collected', (data) => {
          this.onCollectibleCollected(data);
        });
      }
    });

    // Listen for ball reset events
    const player = this.entity.scene.findWithTag('player');
    if (player) {
      const ballController = player.getComponent('BallController');
      if (ballController) {
        ballController.on('reset', () => {
          this.onBallReset();
        });
      }
    }

    this.updateUI();
  }

  update(deltaTime) {
    this.gameTime += deltaTime;
    this.updateUI();
  }

  onCollectibleCollected(data) {
    this.score += data.points;
    this.collectedCount++;

    // Show message
    this.showMessage('🎉 +' + data.points + ' points!');

    // Check if all collected
    if (this.collectedCount >= this.totalCollectibles) {
      setTimeout(() => {
        this.showMessage('🏆 YOU WIN! All collected!', 3000);
        this.onLevelComplete();
      }, 500);
    }

    this.updateUI();
  }

  onBallReset() {
    console.log('🔄 Ball reset - Out of bounds!');
    this.showMessage('🔄 Out of bounds!', 1000);
  }

  onLevelComplete() {
    console.log('🏆 Level Complete! Score:', this.score);
    
    // Respawn collectibles after delay
    setTimeout(() => {
      this.respawnCollectibles();
    }, 3000);
  }

  respawnCollectibles() {
    // This would be implemented by PlatformManager
    // For now, just reset counter
    const collectibles = this.entity.scene.findGameObjectsWithTag('collectible');
    this.totalCollectibles = collectibles.length;
    this.collectedCount = 0;
    
    if (this.totalCollectibles === 0) {
      this.showMessage('🎮 Game Complete!', 5000);
    }
  }

  showMessage(text, duration = 1000) {
    const messageEl = document.getElementById('game-message');
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.classList.add('show');
      
      setTimeout(() => {
        messageEl.classList.remove('show');
      }, duration);
    }
  }

  updateUI() {
    // Update score
    const scoreEl = document.getElementById('score');
    if (scoreEl) {
      scoreEl.textContent = this.score;
    }

    // Update collected count
    const collectedEl = document.getElementById('collected');
    if (collectedEl) {
      collectedEl.textContent = `${this.collectedCount}/${this.totalCollectibles}`;
    }

    // Update FPS
    const fpsEl = document.getElementById('fps');
    if (fpsEl && this.entity.scene.engine.stats) {
      fpsEl.textContent = Math.round(this.entity.scene.engine.stats.fps);
    }

    // Update game time
    const timeEl = document.getElementById('time');
    if (timeEl) {
      const minutes = Math.floor(this.gameTime / 60);
      const seconds = Math.floor(this.gameTime % 60);
      timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}

