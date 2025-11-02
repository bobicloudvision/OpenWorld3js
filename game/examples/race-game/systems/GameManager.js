import { Component } from '../../../src/index.js';

/**
 * GameManager - Manages race state, timer, checkpoints, and UI
 */
export class GameManager extends Component {
  constructor(config = {}) {
    super();
    
    this.totalCheckpoints = config.totalCheckpoints || 5;
    this.currentCheckpoint = 0;
    this.raceTime = 0;
    this.isRaceActive = false;
    this.hasStarted = false;
    this.isFinished = false;
    this.bestTime = localStorage.getItem('bestRaceTime') ? parseFloat(localStorage.getItem('bestRaceTime')) : null;
  }

  start() {
    // Find all checkpoints and listen to their events
    const checkpoints = this.entity.scene.findGameObjectsWithTag('checkpoint');
    checkpoints.forEach(checkpoint => {
      const checkpointComponent = checkpoint.getComponent('CheckpointComponent');
      if (checkpointComponent) {
        checkpointComponent.on('checkpointReached', (data) => this.onCheckpointReached(data));
      }
    });
    
    this.updateUI();
    this.showInstructions();
  }

  update(deltaTime) {
    // Start race on first movement
    if (!this.hasStarted) {
      const input = this.entity.scene.engine.inputManager;
      if (input.isKeyDown('KeyW') || input.isKeyDown('ArrowUp')) {
        this.startRace();
      }
    }
    
    // Update timer
    if (this.isRaceActive) {
      this.raceTime += deltaTime;
      this.updateUI();
    }
    
    // Restart with R key
    if (this.entity.scene.engine.inputManager.isKeyPressed('KeyR')) {
      this.restartRace();
    }
  }

  startRace() {
    this.hasStarted = true;
    this.isRaceActive = true;
    this.raceTime = 0;
    this.currentCheckpoint = 0;
    this.hideInstructions();
    console.log('Race Started!');
  }

  onCheckpointReached(data) {
    // Check if this is the next checkpoint in sequence
    if (data.index === this.currentCheckpoint) {
      this.currentCheckpoint++;
      console.log(`Checkpoint ${this.currentCheckpoint}/${this.totalCheckpoints} reached!`);
      
      // Check if race is finished
      if (this.currentCheckpoint >= this.totalCheckpoints) {
        this.finishRace();
      } else {
        this.updateUI();
      }
    }
  }

  finishRace() {
    this.isRaceActive = false;
    this.isFinished = true;
    
    // Save best time
    if (this.bestTime === null || this.raceTime < this.bestTime) {
      this.bestTime = this.raceTime;
      localStorage.setItem('bestRaceTime', this.bestTime.toString());
      this.showMessage(`NEW BEST TIME: ${this.formatTime(this.raceTime)}!`, 'success');
    } else {
      this.showMessage(`FINISHED: ${this.formatTime(this.raceTime)}`, 'success');
    }
    
    // Stop player
    const player = this.entity.scene.findWithTag('player');
    if (player) {
      const carController = player.getComponent('CarController');
      if (carController) {
        carController.stop();
      }
    }
    
    this.updateUI();
    console.log(`Race Finished! Time: ${this.formatTime(this.raceTime)}`);
  }

  restartRace() {
    // Reset race state
    this.hasStarted = false;
    this.isRaceActive = false;
    this.isFinished = false;
    this.raceTime = 0;
    this.currentCheckpoint = 0;
    
    // Reset checkpoints
    const checkpoints = this.entity.scene.findGameObjectsWithTag('checkpoint');
    checkpoints.forEach(checkpoint => {
      const checkpointComponent = checkpoint.getComponent('CheckpointComponent');
      if (checkpointComponent) {
        checkpointComponent.reset();
      }
    });
    
    // Reset player position
    const player = this.entity.scene.findWithTag('player');
    if (player) {
      player.setPosition(0, 0.5, 0);
      player.rotation.y = 0;
      
      const carController = player.getComponent('CarController');
      if (carController) {
        carController.currentSpeed = 0;
        carController.isFinished = false;
      }
    }
    
    this.hideMessage();
    this.updateUI();
    this.showInstructions();
    console.log('Race Restarted!');
  }

  updateUI() {
    // Update time
    const timeElement = document.getElementById('time');
    if (timeElement) {
      timeElement.textContent = this.formatTime(this.raceTime);
    }
    
    // Update checkpoints
    const checkpointsElement = document.getElementById('checkpoints');
    if (checkpointsElement) {
      checkpointsElement.textContent = `${this.currentCheckpoint}/${this.totalCheckpoints}`;
    }
    
    // Update speed
    const player = this.entity.scene.findWithTag('player');
    if (player) {
      const carController = player.getComponent('CarController');
      if (carController) {
        const speedElement = document.getElementById('speed');
        if (speedElement) {
          const speed = Math.round(carController.getSpeed() * 10);
          speedElement.textContent = speed;
        }
      }
    }
    
    // Update best time
    const bestTimeElement = document.getElementById('best-time');
    if (bestTimeElement && this.bestTime !== null) {
      bestTimeElement.textContent = this.formatTime(this.bestTime);
    }
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }

  showInstructions() {
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.style.display = 'block';
    }
  }

  hideInstructions() {
    const instructions = document.getElementById('instructions');
    if (instructions) {
      instructions.style.display = 'none';
    }
  }

  showMessage(text, type = 'info') {
    const message = document.getElementById('message');
    if (message) {
      message.textContent = text;
      message.className = `message ${type}`;
      message.style.display = 'block';
    }
  }

  hideMessage() {
    const message = document.getElementById('message');
    if (message) {
      message.style.display = 'none';
    }
  }
}

