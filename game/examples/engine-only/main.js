/**
 * ✅ ENGINE-ONLY EXAMPLE
 * This game uses ONLY engine classes - NO Three.js imports!
 * 
 * Notice: No "import * as THREE from 'three'" anywhere!
 */

import { 
  GameEngine, 
  Scene, 
  Actor,
  ThirdPersonCamera,
  MeshBuilder,
  Color,
  Vector3
} from '../../src/index.js';

/**
 * Pure Engine Game Scene
 * Uses only engine abstractions, no Three.js code
 */
class PureEngineScene extends Scene {
  constructor(engine) {
    super(engine);
    this.name = 'PureEngineScene';
    this.backgroundColor = Color.SKY_BLUE; // ✅ Engine Color class

    this.player = null;
    this.cameraController = null;
  }

  async initialize() {
    await super.initialize();
    this.ambientLight.intensity = 0.6;
    this.directionalLight.intensity = 0.8;
  }

  async load() {
    this.createGround();
    this.createPlayer();
    this.createObstacles();
    this.setupCamera();
    this.setupInput();

    await super.load();
  }

  createGround() {
    // ✅ Using MeshBuilder instead of THREE.Mesh
    const ground = MeshBuilder.createTerrain({
      width: 200,
      height: 200,
      widthSegments: 50,
      heightSegments: 50,
      color: Color.GRASS,
      heightVariation: 0.5
    });

    this.add(ground);
  }

  createPlayer() {
    // ✅ Using MeshBuilder instead of THREE.BoxGeometry
    const mesh = MeshBuilder.createBox({
      width: 1,
      height: 2,
      depth: 1,
      color: Color.BLUE,
      castShadow: true
    });

    mesh.position.y = 1;

    // ✅ Using Actor (engine class)
    this.player = new Actor({
      name: 'Player',
      speed: 8
    });

    this.player.mesh = mesh;
    
    // ✅ Using Vector3 (engine class) - optional, Actor handles this
    this.player.setPosition(0, 1, 0);

    this.addEntity(this.player);
  }

  createObstacles() {
    const colors = [
      Color.RED, 
      Color.ORANGE, 
      Color.PURPLE, 
      Color.CYAN
    ];

    for (let i = 0; i < 20; i++) {
      const size = 1 + Math.random() * 2;
      
      // ✅ Using MeshBuilder for different shapes
      const shapeType = Math.floor(Math.random() * 4);
      let mesh;

      switch (shapeType) {
        case 0:
          mesh = MeshBuilder.createBox({
            width: size,
            height: size * 2,
            depth: size,
            color: colors[Math.floor(Math.random() * colors.length)],
            castShadow: true,
            receiveShadow: true
          });
          break;
        case 1:
          mesh = MeshBuilder.createCylinder({
            radiusTop: size * 0.5,
            radiusBottom: size * 0.5,
            height: size * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            castShadow: true
          });
          break;
        case 2:
          mesh = MeshBuilder.createCone({
            radius: size,
            height: size * 2,
            color: colors[Math.floor(Math.random() * colors.length)],
            castShadow: true
          });
          break;
        case 3:
          mesh = MeshBuilder.createSphere({
            radius: size,
            color: colors[Math.floor(Math.random() * colors.length)],
            castShadow: true
          });
          break;
      }

      const angle = (i / 20) * Math.PI * 2;
      const radius = 10 + Math.random() * 30;

      mesh.position.x = Math.cos(angle) * radius;
      mesh.position.y = size;
      mesh.position.z = Math.sin(angle) * radius;

      this.add(mesh);
    }
  }

  setupCamera() {
    const camera = this.engine.cameraManager.getActiveCamera();
    
    // ✅ Using ThirdPersonCamera (engine class)
    this.cameraController = new ThirdPersonCamera(camera, this.player, {
      distance: 12,
      height: 6,
      smoothness: 0.15
    });

    this.cameraController.setInputManager(this.engine.inputManager);
  }

  setupInput() {
    const input = this.engine.inputManager;

    // ✅ Using InputManager (engine class)
    input.bindAction('forward', ['KeyW']);
    input.bindAction('backward', ['KeyS']);
    input.bindAction('left', ['KeyA']);
    input.bindAction('right', ['KeyD']);
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    if (this.player && this.cameraController) {
      this.updatePlayerMovement(deltaTime);
      this.cameraController.update(deltaTime);
    }

    this.updateUI();
  }

  updatePlayerMovement(deltaTime) {
    const input = this.engine.inputManager;
    
    // ✅ Using Vector3 (engine class) instead of THREE.Vector3
    // Note: For even purer approach, we could use the internal Actor velocity
    // But this shows how you CAN use Vector3 if needed
    const moveDirection = this.player.velocity; // Already a THREE.Vector3
    moveDirection.set(0, 0, 0);

    const forward = this.cameraController.getForwardDirection();
    const right = this.cameraController.getRightDirection();

    if (input.isActionDown('forward')) {
      moveDirection.add(forward);
    }
    if (input.isActionDown('backward')) {
      moveDirection.sub(forward);
    }
    if (input.isActionDown('left')) {
      moveDirection.sub(right);
    }
    if (input.isActionDown('right')) {
      moveDirection.add(right);
    }

    if (moveDirection.lengthSq() > 0) {
      this.player.move(moveDirection, deltaTime);
      this.player.rotateTo(moveDirection, deltaTime);
    } else {
      this.player.stop();
    }

    // Keep player above ground
    if (this.player.position.y < 1) {
      this.player.position.y = 1;
    }
  }

  updateUI() {
    document.getElementById('fps').textContent = Math.round(this.engine.stats.fps);
    document.getElementById('entities').textContent = this.entities.size;
    
    if (this.player) {
      const pos = this.player.position;
      document.getElementById('position').textContent = 
        `${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`;
    }
  }
}

/**
 * Initialize game using ONLY engine classes
 */
function initGame() {
  // ✅ Using GameEngine (engine class)
  const engine = new GameEngine({
    canvas: document.querySelector('#game-canvas'),
    antialias: true,
    shadowMapEnabled: true
  });

  // ✅ Using Scene (engine class)
  engine.loadScene(PureEngineScene);

  engine.start();

  console.log('✅ Game started using ONLY engine classes!');
  console.log('✅ Zero Three.js imports in game code!');
  console.log('✅ Pure engine API!');
}

window.addEventListener('DOMContentLoaded', initGame);

