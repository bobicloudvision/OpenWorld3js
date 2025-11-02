/**
 * 🎮 Physics Ball Game
 * 
 * A well-architected physics-based ball game demonstrating:
 * - Modular component architecture
 * - Real physics simulation
 * - Event-driven systems
 * - Clean separation of concerns
 * 
 * Architecture:
 * ├── components/    - Reusable behaviors
 * ├── systems/       - Game-wide managers
 * ├── scenes/        - Scene composition
 * └── main.js        - Entry point
 */

import { GameEngine } from '../../src/index.js';
import { PhysicsBallScene } from './scenes/PhysicsBallScene.js';

/**
 * Initialize and start the game
 */
function initGame() {
  const engine = new GameEngine({
    canvas: document.getElementById('game-canvas'),
    antialias: true,
    shadowMapEnabled: true,
    physics: true,
    physicsConfig: {
      gravity: -20,
      iterations: 10,
      debug: false  // Toggle with P key
    }
  });

  // Load scene and start
  engine.loadScene(PhysicsBallScene);
  engine.start();

  // Log game info
  console.log('🎮 Physics Ball Game Started!');
  console.log('📁 Architecture:');
  console.log('  ├── Components: BallController, CameraFollow, Collectible, Rotate');
  console.log('  ├── Systems: GameManager, ObstacleManager');
  console.log('  └── Scene: PhysicsBallScene');
  console.log('');
  console.log('🎮 Controls:');
  console.log('  • WASD - Move ball');
  console.log('  • SPACE - Jump');
  console.log('  • P - Toggle physics debug');
  console.log('  • R - Reset ball');
}

// Start when page loads
window.addEventListener('DOMContentLoaded', initGame);

