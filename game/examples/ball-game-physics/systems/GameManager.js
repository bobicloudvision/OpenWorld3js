import { Component } from '../../../src/index.js';

/**
 * GameManager - Manages game state, score, and UI
 * Central system that coordinates game logic and events
 */
export class GameManager extends Component {
  constructor(config = {}) {
    super();
    this.score = 0;
    this.collectedCount = 0;
    this.totalCollectibles = 0;
    this.gameTime = 0;
    this.debugEnabled = false;
  }

  start() {
    // Count collectibles
    const collectibles = this.entity.scene.findGameObjectsWithTag('collectible');
    this.totalCollectibles = collectibles.length;

    // Listen for collection events
    collectibles.forEach(collectible => {
      const comp = collectible.getComponent('CollectibleComponent');
      if (comp) {
        comp.on('collected', (data) => this.onCollected(data));
      }
    });

    // Listen for ball events
    const player = this.entity.scene.findWithTag('player');
    if (player) {
      const ballController = player.getComponent('BallController');
      if (ballController) {
        ballController.on('reset', () => this.onBallReset());
        ballController.on('jumped', () => this.onBallJumped());
      }
    }

    this.updateUI();
  }

  update(deltaTime) {
    this.gameTime += deltaTime;
    
    const input = this.entity.scene.engine.inputManager;

    // Toggle physics debug with P
    if (input.isKeyPressed('KeyP')) {
      this.entity.scene.engine.physicsManager.toggleDebug();
      this.debugEnabled = this.entity.scene.engine.physicsManager.debugEnabled;
      this.updateUI();
    }

    // Reset ball with R
    if (input.isKeyPressed('KeyR')) {
      const player = this.entity.scene.findWithTag('player');
      if (player) {
        const ballController = player.getComponent('BallController');
        if (ballController) {
          ballController.resetPosition();
        }
      }
    }

    this.updateUI();
  }

  onCollected(data) {
    this.score += data.points;
    this.collectedCount++;

    // Show collection message
    this.showMessage(`🎉 +${data.points} Points!`, 1000);

    // Check if all collected
    if (this.collectedCount >= this.totalCollectibles) {
      setTimeout(() => {
        this.showMessage('🏆 YOU WIN! All Collected!', 3000);
        this.onGameComplete();
      }, 500);
    }

    this.updateUI();
  }

  onBallReset() {
    this.showMessage('🔄 Ball Reset!', 1000);
  }

  onBallJumped() {
    // Optional: Add visual feedback for jumping
    // Could add a jump counter or visual effect
  }

  onGameComplete() {
    console.log('🏆 Game Complete! Final Score:', this.score);
    console.log('⏱️ Time:', this.formatTime(this.gameTime));
  }

  showMessage(text, duration = 1000) {
    const messageEl = document.getElementById('message');
    if (messageEl) {
      messageEl.textContent = text;
      messageEl.classList.add('show');
      
      setTimeout(() => {
        messageEl.classList.remove('show');
      }, duration);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  updateUI() {
    // Score
    const scoreEl = document.getElementById('score');
    if (scoreEl) scoreEl.textContent = this.score;

    // Collected
    const collectedEl = document.getElementById('collected');
    if (collectedEl) {
      collectedEl.textContent = `${this.collectedCount}/${this.totalCollectibles}`;
    }

    // Time
    const timeEl = document.getElementById('time');
    if (timeEl) timeEl.textContent = this.formatTime(this.gameTime);

    // FPS
    const fpsEl = document.getElementById('fps');
    if (fpsEl && this.entity.scene.engine.stats) {
      fpsEl.textContent = Math.round(this.entity.scene.engine.stats.fps);
    }

    // Debug status
    const debugEl = document.getElementById('debug');
    if (debugEl) {
      debugEl.textContent = this.debugEnabled ? 'ON' : 'OFF';
      debugEl.style.color = this.debugEnabled ? '#00ff88' : '#ff6b6b';
    }

    // Velocity
    const player = this.entity.scene.findWithTag('player');
    if (player && player.physicsBody) {
      const vel = player.physicsBody.velocity;
      const speed = Math.sqrt(vel.x ** 2 + vel.y ** 2 + vel.z ** 2);
      
      const velocityEl = document.getElementById('velocity');
      if (velocityEl) velocityEl.textContent = speed.toFixed(1);
    }
  }
}

