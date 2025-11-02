import EventEmitter from 'eventemitter3';

/**
 * Scene Manager
 * Manages scene transitions, loading, and lifecycle
 */
export class SceneManager extends EventEmitter {
  constructor(engine) {
    super();
    
    this.engine = engine;
    this.scenes = new Map();
    this.currentScene = null;
    this.isTransitioning = false;
    this.transitionData = null;
  }

  /**
   * Register a scene class
   */
  registerScene(name, sceneClass) {
    this.scenes.set(name, sceneClass);
    this.emit('sceneRegistered', { name, sceneClass });
  }

  /**
   * Load and activate a scene
   */
  async loadScene(nameOrClass, data = {}) {
    if (this.isTransitioning) {
      console.warn('Scene transition already in progress');
      return;
    }

    this.isTransitioning = true;
    this.emit('transitionStart', { scene: nameOrClass, data });

    try {
      // Get scene class
      let SceneClass;
      if (typeof nameOrClass === 'string') {
        SceneClass = this.scenes.get(nameOrClass);
        if (!SceneClass) {
          throw new Error(`Scene "${nameOrClass}" not registered`);
        }
      } else {
        SceneClass = nameOrClass;
      }

      // Exit current scene
      if (this.currentScene) {
        this.currentScene.onExit();
        this.emit('sceneExit', this.currentScene);
      }

      // Create new scene instance
      const newScene = new SceneClass(this.engine);
      
      // Initialize scene
      await newScene.initialize();

      // Load scene
      await newScene.load();

      // Enter new scene
      newScene.onEnter(data);

      // Set as current scene
      const previousScene = this.currentScene;
      this.currentScene = newScene;

      this.emit('sceneEnter', newScene);
      this.emit('sceneChanged', { previous: previousScene, current: newScene });

      // Dispose previous scene if needed
      if (previousScene) {
        previousScene.dispose();
      }

      return newScene;
    } catch (error) {
      console.error('Failed to load scene:', error);
      this.emit('sceneLoadError', error);
      throw error;
    } finally {
      this.isTransitioning = false;
      this.emit('transitionEnd');
    }
  }

  /**
   * Reload the current scene
   */
  async reloadScene(data = {}) {
    if (!this.currentScene) {
      console.warn('No current scene to reload');
      return;
    }

    const SceneClass = this.currentScene.constructor;
    return await this.loadScene(SceneClass, data);
  }

  /**
   * Get the current active scene
   */
  getCurrentScene() {
    return this.currentScene;
  }

  /**
   * Update current scene
   */
  update(deltaTime, elapsedTime) {
    if (this.currentScene) {
      this.currentScene.update(deltaTime, elapsedTime);
    }
  }

  /**
   * Preload a scene without activating it
   */
  async preloadScene(nameOrClass) {
    let SceneClass;
    if (typeof nameOrClass === 'string') {
      SceneClass = this.scenes.get(nameOrClass);
      if (!SceneClass) {
        throw new Error(`Scene "${nameOrClass}" not registered`);
      }
    } else {
      SceneClass = nameOrClass;
    }

    const scene = new SceneClass(this.engine);
    await scene.initialize();
    await scene.load();

    return scene;
  }

  /**
   * Check if a scene is registered
   */
  hasScene(name) {
    return this.scenes.has(name);
  }

  /**
   * Get all registered scene names
   */
  getRegisteredScenes() {
    return Array.from(this.scenes.keys());
  }

  /**
   * Dispose manager and all scenes
   */
  dispose() {
    if (this.currentScene) {
      this.currentScene.dispose();
      this.currentScene = null;
    }

    this.scenes.clear();
    this.removeAllListeners();
  }
}

