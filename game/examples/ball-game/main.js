/**
 * 🎮 Rolling Ball Game
 * 
 * A modern ball game using GameObject-Component architecture.
 * Collect all the yellow spheres to win!
 * 
 * Architecture:
 * - Components: BallController, CameraFollow, Collectible, Rotate
 * - Systems: GameManager, PlatformManager
 * - Scene: RollingBallScene
 */

import { GameEngine } from '../../src/index.js';
import { RollingBallScene } from './scenes/RollingBallScene.js';

/**
 * Initialize and start the game
 */
function initGame() {
  // Create engine (physics disabled - not needed for this game)
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true,
    physics: false  // Physics disabled (causes bugs)
  });

  // Load and start the game scene
  engine.loadScene(RollingBallScene);
  engine.start();

  console.log('🎮 Rolling Ball Game started!');
  console.log('🎯 Collect all yellow spheres to win!');
  console.log('🎮 Controls: WASD to move, stay in bounds!');
}

// Start game when page loads
window.addEventListener('DOMContentLoaded', initGame);
