import * as THREE from 'three';
import EventEmitter from 'eventemitter3';
import { Time } from './Time.js';
import { SceneManager } from '../scenes/SceneManager.js';
import { InputManager } from '../input/InputManager.js';
import { NetworkManager } from '../network/NetworkManager.js';
import { AssetManager } from '../assets/AssetManager.js';
import { CameraManager } from '../camera/CameraManager.js';
import { PhysicsManager } from '../physics/PhysicsManager.js';

/**
 * Main Game Engine class
 * Orchestrates all game systems and the main game loop
 */
export class GameEngine extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      canvas: null,
      antialias: true,
      shadowMapEnabled: true,
      shadowMapType: THREE.PCFSoftShadowMap,
      pixelRatio: window.devicePixelRatio,
      physics: false,
      networking: false,
      ...config
    };

    // Core systems
    this.renderer = null;
    this.time = new Time();
    this.sceneManager = null;
    this.inputManager = null;
    this.networkManager = null;
    this.assetManager = null;
    this.cameraManager = null;
    this.physicsManager = null;

    // State
    this.isRunning = false;
    this.isPaused = false;
    this.frameId = null;

    // Stats
    this.stats = {
      fps: 0,
      frameTime: 0,
      entities: 0,
      drawCalls: 0
    };

    this._initialize();
  }

  /**
   * Initialize all core systems
   */
  _initialize() {
    // Setup renderer
    this._setupRenderer();

    // Initialize core managers
    this.sceneManager = new SceneManager(this);
    this.inputManager = new InputManager(this);
    this.assetManager = new AssetManager(this);
    this.cameraManager = new CameraManager(this);

    // Initialize networking if enabled
    if (this.config.networking) {
      this.networkManager = new NetworkManager(this, this.config.networkConfig);
    }

    // Initialize physics if enabled
    if (this.config.physics) {
      this.physicsManager = new PhysicsManager(this.config.physicsConfig);
    }

    // Setup resize handler
    this._setupResizeHandler();

    // Emit initialization complete
    this.emit('initialized');
  }

  /**
   * Setup Three.js renderer
   */
  _setupRenderer() {
    const canvas = this.config.canvas || document.querySelector('#game-canvas');
    
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: this.config.antialias,
      powerPreference: 'high-performance',
      alpha: false
    });

    this.renderer.setPixelRatio(this.config.pixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = this.config.shadowMapEnabled;
    this.renderer.shadowMap.type = this.config.shadowMapType;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
  }

  /**
   * Setup window resize handler
   */
  _setupResizeHandler() {
    window.addEventListener('resize', () => {
      this.resize(window.innerWidth, window.innerHeight);
    });
  }

  /**
   * Resize the renderer and update camera
   */
  resize(width, height) {
    this.renderer.setSize(width, height);
    this.cameraManager.resize(width, height);
    this.emit('resize', { width, height });
  }

  /**
   * Start the game engine
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.time.start();
    this._gameLoop();

    this.emit('started');
  }

  /**
   * Stop the game engine
   */
  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.frameId) {
      cancelAnimationFrame(this.frameId);
      this.frameId = null;
    }

    this.emit('stopped');
  }

  /**
   * Pause the game
   */
  pause() {
    this.isPaused = true;
    this.emit('paused');
  }

  /**
   * Resume the game
   */
  resume() {
    this.isPaused = false;
    this.emit('resumed');
  }

  /**
   * Main game loop
   */
  _gameLoop() {
    if (!this.isRunning) return;

    this.frameId = requestAnimationFrame(() => this._gameLoop());

    // Update time
    this.time.update();

    // Skip updates if paused
    if (this.isPaused) {
      this._render();
      return;
    }

    // Update all systems
    this._update(this.time.delta, this.time.elapsed);

    // Render
    this._render();

    // Update stats
    this._updateStats();
  }

  /**
   * Update all game systems
   */
  _update(deltaTime, elapsedTime) {
    // Update input
    this.inputManager.update(deltaTime);

    // Update network
    if (this.networkManager) {
      this.networkManager.update(deltaTime);
    }

    // Update physics
    if (this.physicsManager) {
      this.physicsManager.update(deltaTime);
    }

    // Update current scene
    this.sceneManager.update(deltaTime, elapsedTime);

    // Update camera
    this.cameraManager.update(deltaTime);

    // Late update input (clear pressed/released states after scene update)
    if (this.inputManager.lateUpdate) {
      this.inputManager.lateUpdate();
    }

    // Emit update event
    this.emit('update', { deltaTime, elapsedTime });
  }

  /**
   * Render the current scene
   */
  _render() {
    const scene = this.sceneManager.getCurrentScene();
    const camera = this.cameraManager.getActiveCamera();

    if (scene && camera) {
      this.renderer.render(scene.threeScene, camera);
    }

    this.emit('render');
  }

  /**
   * Update performance stats
   */
  _updateStats() {
    this.stats.fps = Math.round(1 / this.time.delta);
    this.stats.frameTime = this.time.delta * 1000;
    this.stats.drawCalls = this.renderer.info.render.calls;
    
    const scene = this.sceneManager.getCurrentScene();
    this.stats.entities = scene ? scene.entities.size : 0;
  }

  /**
   * Get the current scene
   */
  getCurrentScene() {
    return this.sceneManager.getCurrentScene();
  }

  /**
   * Load and switch to a scene
   */
  async loadScene(sceneClass, data = {}) {
    return await this.sceneManager.loadScene(sceneClass, data);
  }

  /**
   * Get renderer info
   */
  getRendererInfo() {
    return this.renderer.info;
  }

  /**
   * Cleanup and dispose
   */
  dispose() {
    this.stop();

    // Dispose all managers
    this.sceneManager.dispose();
    this.inputManager.dispose();
    this.cameraManager.dispose();
    this.assetManager.dispose();
    
    if (this.networkManager) {
      this.networkManager.dispose();
    }

    if (this.physicsManager) {
      this.physicsManager.dispose();
    }

    // Dispose renderer
    this.renderer.dispose();

    // Remove all listeners
    this.removeAllListeners();

    this.emit('disposed');
  }
}

