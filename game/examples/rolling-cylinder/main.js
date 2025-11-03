import { GameEngine } from '../../src/index.js';
import { RollingCylinderScene } from './scenes/RollingCylinderScene.js';

/**
 * Rolling Cylinder Game
 * 
 * A physics-based rolling cylinder game featuring:
 * - Real physics simulation with Cannon.js
 * - Reusable WheelComponent (can be used for vehicles!)
 * - Dynamic obstacle spawning
 * - Collectible system
 * - Score and health tracking
 * - Progressive difficulty
 * 
 * Controls:
 * - W/S: Accelerate forward/backward
 * - A/D: Steer left/right
 * - Space: Brake
 * - P: Toggle physics debug visualization
 */

console.log('=== Rolling Cylinder Game ===');

// Wait for DOM to be ready
function initGame() {
  console.log('Starting game engine with physics...');

  // Create engine with physics enabled
  const engine = new GameEngine({
    physics: true,
    physicsConfig: {
      gravity: -9.82,
      iterations: 10,
      debug: false  // Can be toggled with 'P' key in-game
    }
  });

  // Start the engine
  engine.start();

  // Load the game scene
  engine.loadScene(RollingCylinderScene);

  console.log('Game loaded! Controls:');
  console.log('  W/S - Accelerate/Reverse');
  console.log('  A/D - Steer Left/Right');
  console.log('  Space - Brake');
  console.log('  P - Toggle Physics Debug');

  // Make engine globally accessible for debugging
  window.gameEngine = engine;

  // Add restart function
  window.restartGame = function() {
    window.location.reload();
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initGame);
} else {
  initGame();
}

