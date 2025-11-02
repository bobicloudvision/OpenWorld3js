/**
 * PlayerController Component
 * Handles player movement, lane switching, and jumping
 */

import { Component } from '../../../src/index.js';

export class PlayerController extends Component {
  constructor(config = {}) {
    super();
    this.currentLane = 1; // 0=left, 1=center, 2=right
    this.laneWidth = 3;
    this.moveSpeed = 0.2; // Speed for lane transitions
    this.targetX = 0;
    
    this.isJumping = false;
    this.jumpSpeed = 0;
    this.jumpForce = 12;
    this.gravity = -30;
    this.groundY = 0.5;
    
    this.isAlive = true;
  }

  awake() {
    this.entity.position.y = this.groundY;
  }

  update(deltaTime) {
    if (!this.isAlive) return;

    const input = this.entity.scene.engine.inputManager;
    
    if (!input) return;
    
    // Lane switching (Arrow Keys or A/D)
    if ((input.isKeyPressed('ArrowLeft') || input.isKeyPressed('KeyA')) && this.currentLane > 0) {
      this.currentLane--;
      this.targetX = (this.currentLane - 1) * this.laneWidth;
    }
    
    if ((input.isKeyPressed('ArrowRight') || input.isKeyPressed('KeyD')) && this.currentLane < 2) {
      this.currentLane++;
      this.targetX = (this.currentLane - 1) * this.laneWidth;
    }
    
    // Smooth lane transition
    const diff = this.targetX - this.entity.position.x;
    if (Math.abs(diff) > 0.01) {
      this.entity.position.x += diff * this.moveSpeed;
    }
    
    // Jump (Space or W)
    if ((input.isKeyPressed('Space') || input.isKeyPressed('KeyW')) && !this.isJumping) {
      this.isJumping = true;
      this.jumpSpeed = this.jumpForce;
    }
    
    // Apply gravity and jumping
    if (this.isJumping) {
      this.jumpSpeed += this.gravity * deltaTime;
      this.entity.position.y += this.jumpSpeed * deltaTime;
      
      if (this.entity.position.y <= this.groundY) {
        this.entity.position.y = this.groundY;
        this.isJumping = false;
        this.jumpSpeed = 0;
      }
    }
    
    // Update mesh position
    if (this.entity.mesh) {
      this.entity.mesh.position.copy(this.entity.position);
    }
  }

  die() {
    this.isAlive = false;
    this.emit('died');
  }
}

