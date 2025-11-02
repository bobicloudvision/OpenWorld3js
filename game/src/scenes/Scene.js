import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

/**
 * Base Scene class
 * All game scenes should extend this class
 */
export class Scene extends EventEmitter {
  constructor(engine) {
    super();
    
    this.engine = engine;
    this.threeScene = new THREE.Scene();
    this.entities = new Map();
    this.isLoaded = false;
    this.isActive = false;

    // Scene metadata
    this.name = 'Scene';
    this.backgroundColor = 0x000000;

    // Lighting
    this.ambientLight = null;
    this.directionalLight = null;

    // Fog
    this.fog = null;
  }

  /**
   * Initialize the scene (called once when scene is created)
   */
  async initialize() {
    // Setup basic lighting
    this._setupDefaultLighting();
    
    // Set background color
    this.threeScene.background = new THREE.Color(this.backgroundColor);

    this.emit('initialized');
  }

  /**
   * Load scene assets and setup
   */
  async load() {
    // Override in subclass to load assets
    this.isLoaded = true;
    this.emit('loaded');
  }

  /**
   * Called when scene becomes active
   */
  onEnter(data = {}) {
    this.isActive = true;
    this.emit('enter', data);
  }

  /**
   * Called when scene becomes inactive
   */
  onExit() {
    this.isActive = false;
    this.emit('exit');
  }

  /**
   * Update scene logic (called every frame)
   */
  update(deltaTime, elapsedTime) {
    if (!this.isActive) return;

    // Update all entities
    for (const [id, entity] of this.entities) {
      if (entity.isActive && entity.update) {
        entity.update(deltaTime, elapsedTime);
      }
    }

    this.emit('update', { deltaTime, elapsedTime });
  }

  /**
   * Add an entity to the scene
   */
  addEntity(entity) {
    if (!entity.id) {
      entity.id = this._generateEntityId();
    }

    this.entities.set(entity.id, entity);

    // Set scene reference (for physics and other features)
    entity.scene = this;

    // Add to Three.js scene if it has a mesh
    if (entity.mesh) {
      this.threeScene.add(entity.mesh);
    }

    // Call entity's onAddedToScene if it exists
    if (entity.onAddedToScene) {
      entity.onAddedToScene(this);
    }

    this.emit('entityAdded', entity);
    return entity;
  }

  /**
   * Remove an entity from the scene
   */
  removeEntity(entityOrId) {
    const id = typeof entityOrId === 'string' ? entityOrId : entityOrId.id;
    const entity = this.entities.get(id);

    if (!entity) return;

    // Remove from Three.js scene
    if (entity.mesh) {
      this.threeScene.remove(entity.mesh);
    }

    // Call entity's onRemovedFromScene if it exists
    if (entity.onRemovedFromScene) {
      entity.onRemovedFromScene(this);
    }

    this.entities.delete(id);
    this.emit('entityRemoved', entity);

    return entity;
  }

  /**
   * Get an entity by ID
   */
  getEntity(id) {
    return this.entities.get(id);
  }

  /**
   * Get all entities of a specific type
   */
  getEntitiesByType(type) {
    const entities = [];
    for (const entity of this.entities.values()) {
      if (entity.type === type) {
        entities.push(entity);
      }
    }
    return entities;
  }

  /**
   * Get all entities with a specific tag
   */
  getEntitiesByTag(tag) {
    const entities = [];
    for (const entity of this.entities.values()) {
      if (entity.tags && entity.tags.includes(tag)) {
        entities.push(entity);
      }
    }
    return entities;
  }

  /**
   * Setup default lighting
   */
  _setupDefaultLighting() {
    // Ambient light
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.threeScene.add(this.ambientLight);

    // Directional light (sun)
    this.directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.directionalLight.position.set(50, 100, 50);
    this.directionalLight.castShadow = true;
    
    // Configure shadow camera
    this.directionalLight.shadow.camera.left = -100;
    this.directionalLight.shadow.camera.right = 100;
    this.directionalLight.shadow.camera.top = 100;
    this.directionalLight.shadow.camera.bottom = -100;
    this.directionalLight.shadow.camera.near = 0.5;
    this.directionalLight.shadow.camera.far = 500;
    this.directionalLight.shadow.mapSize.width = 2048;
    this.directionalLight.shadow.mapSize.height = 2048;
    
    this.threeScene.add(this.directionalLight);
  }

  /**
   * Set scene fog
   */
  setFog(color, near, far) {
    this.threeScene.fog = new THREE.Fog(color, near, far);
  }

  /**
   * Set background color
   */
  setBackgroundColor(color) {
    this.backgroundColor = color;
    this.threeScene.background = new THREE.Color(color);
  }

  /**
   * Add object to Three.js scene
   */
  add(object) {
    this.threeScene.add(object);
  }

  /**
   * Remove object from Three.js scene
   */
  remove(object) {
    this.threeScene.remove(object);
  }

  /**
   * Generate a unique entity ID
   */
  _generateEntityId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear all entities
   */
  clear() {
    for (const entity of this.entities.values()) {
      this.removeEntity(entity);
      
      // Dispose entity if it has a dispose method
      if (entity.dispose) {
        entity.dispose();
      }
    }
    this.entities.clear();
  }

  /**
   * Dispose and cleanup scene
   */
  dispose() {
    this.clear();

    // Dispose lights
    if (this.ambientLight) {
      this.threeScene.remove(this.ambientLight);
    }
    if (this.directionalLight) {
      this.threeScene.remove(this.directionalLight);
    }

    // Clear scene
    this.threeScene.clear();

    this.removeAllListeners();
    this.emit('disposed');
  }
}

