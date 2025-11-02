/**
 * CollisionDetector Component
 * Detects collisions with obstacles and coins
 */

import { Component } from '../../../src/index.js';
import { PlayerController } from './PlayerController.js';

export class CollisionDetector extends Component {
  constructor(config = {}) {
    super();
    this.checkRadius = 1.5;
  }

  update(deltaTime) {
    const scene = this.entity.scene;
    const player = scene.findWithTag('player');
    
    if (!player) return;
    
    const playerController = player.getComponent(PlayerController);
    if (!playerController || !playerController.isAlive) return;
    
    // Check obstacles
    const obstacles = scene.findGameObjectsWithTag('obstacle');
    for (const obstacle of obstacles) {
      const distance = player.position.distanceTo(obstacle.position);
      
      if (distance < this.checkRadius) {
        playerController.die();
        this.emit('collision', { type: 'obstacle' });
        return;
      }
    }
    
    // Check coins
    const coins = scene.findGameObjectsWithTag('coin');
    for (const coin of coins) {
      const distance = player.position.distanceTo(coin.position);
      
      if (distance < 1.5) {
        scene.removeEntity(coin);
        this.emit('coinCollected');
      }
    }
  }
}

