/**
 * Endless Runner - Main Entry Point
 * 
 * A Subway Surfers-style endless runner game featuring:
 * - Procedural track generation
 * - Lane-based movement (3 lanes)
 * - Jump mechanics
 * - Obstacle avoidance
 * - Coin collection
 * - Progressive difficulty
 */

import { GameEngine } from '../../src/index.js';
import { EndlessRunnerScene } from './scenes/EndlessRunnerScene.js';

let gameStarted = false;

// Start game button
document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('start-screen').style.display = 'none';
  if (!gameStarted) {
    startGame();
    gameStarted = true;
  }
});

// Restart game button
document.getElementById('restart-btn').addEventListener('click', () => {
  window.location.reload();
});

// Initialize the game engine and load the scene
function startGame() {
  const engine = new GameEngine({ physics: false });
  engine.start();
  engine.loadScene(EndlessRunnerScene);
  
  console.log('🏃 Endless Runner Started!');
  console.log('Controls:');
  console.log('  - A/D or ← → : Switch lanes');
  console.log('  - W or Space : Jump');
}
