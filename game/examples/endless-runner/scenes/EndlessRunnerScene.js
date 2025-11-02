/**
 * EndlessRunnerScene
 * Main game scene for the Endless Runner
 */

import { GameScene, GameObjectFactory } from '../../../src/index.js';
import { PlayerController } from '../components/PlayerController.js';
import { CameraFollowComponent } from '../components/CameraFollowComponent.js';
import { CollisionDetector } from '../components/CollisionDetector.js';
import { GameManager } from '../systems/GameManager.js';
import { TrackGenerator } from '../systems/TrackGenerator.js';

export class EndlessRunnerScene extends GameScene {
  constructor(engine) {
    super(engine);
    this.name = 'EndlessRunner';
    this.backgroundColor = 0x87CEEB;
  }

  async load() {
    // Lighting
    this.ambientLight.intensity = 0.6;
    this.directionalLight.position.set(10, 20, 10);
    this.directionalLight.intensity = 0.8;
    
    // Fog for depth
    this.setFog(0x87CEEB, 30, 80);
    
    // Create Player
    const player = GameObjectFactory.createCapsule({
      name: 'Player',
      radius: 0.5,
      height: 1.5,
      color: 0x4a90e2,
      castShadow: true
    });
    player.addTag('player');
    player.setPosition(0, 0.5, 0);
    player.addComponent(PlayerController);
    this.addEntity(player);
    
    // Create Game Manager
    const gameManager = GameObjectFactory.createEmpty({ name: 'GameManager' });
    gameManager.addComponent(GameManager);
    gameManager.addComponent(TrackGenerator);
    gameManager.addComponent(CameraFollowComponent);
    gameManager.addComponent(CollisionDetector);
    this.addEntity(gameManager);
    
    await super.load();
  }
}

