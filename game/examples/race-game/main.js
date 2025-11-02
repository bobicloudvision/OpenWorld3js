import { GameEngine } from '../../src/index.js';
import { RaceScene } from './scenes/RaceScene.js';

/**
 * Simple Race Game
 * 
 * Controls:
 * - W/Arrow Up: Accelerate
 * - S/Arrow Down: Brake
 * - A/Arrow Left: Turn left
 * - D/Arrow Right: Turn right
 * - R: Restart race
 */

console.log('🏁 Starting Race Game...');

// Initialize engine
const engine = new GameEngine({
  physics: false // Using custom collision detection
});

// Start engine and load scene
engine.start();
engine.loadScene(RaceScene);

console.log('✅ Race Game Started!');
console.log('📝 Controls: WASD or Arrow Keys to drive, R to restart');

