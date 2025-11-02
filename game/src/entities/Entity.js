import * as THREE from 'three';
import EventEmitter from 'eventemitter3';

/**
 * Base Entity class
 * Represents any object in the game world (players, enemies, items, etc.)
 */
export class Entity extends EventEmitter {
  constructor(config = {}) {
    super();

    this.id = config.id || this._generateId();
    this.name = config.name || 'Entity';
    this.type = config.type || 'entity';
    this.tags = config.tags || [];

    // Transform
    this.position = new THREE.Vector3();
    this.rotation = new THREE.Euler();
    this.scale = new THREE.Vector3(1, 1, 1);

    // Three.js mesh
    this.mesh = null;

    // Component system
    this.components = new Map();

    // State
    this.isActive = true;
    this.isVisible = true;
    this.scene = null;

    // Network
    this.isNetworked = config.isNetworked || false;
    this.ownerId = config.ownerId || null;
    this.networkId = config.networkId || null;

    // Custom data
    this.data = config.data || {};
  }

  /**
   * Initialize entity
   */
  async initialize() {
    // Override in subclasses
    this.emit('initialized');
  }

  /**
   * Update entity (called every frame)
   */
  update(deltaTime, elapsedTime) {
    // Update all components
    for (const component of this.components.values()) {
      if (component.isActive && component.update) {
        component.update(deltaTime, elapsedTime);
      }
    }

    // Sync mesh transform with entity transform
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.copy(this.rotation);
      this.mesh.scale.copy(this.scale);
    }
  }

  /**
   * Fixed update (for physics)
   */
  fixedUpdate(fixedDeltaTime) {
    for (const component of this.components.values()) {
      if (component.isActive && component.fixedUpdate) {
        component.fixedUpdate(fixedDeltaTime);
      }
    }
  }

  /**
   * Add a component to this entity
   */
  addComponent(component) {
    const componentName = component.constructor.name;
    
    if (this.components.has(componentName)) {
      console.warn(`Component ${componentName} already exists on entity ${this.id}`);
      return this.components.get(componentName);
    }

    component.entity = this;
    this.components.set(componentName, component);

    if (component.onAttach) {
      component.onAttach(this);
    }

    this.emit('componentAdded', component);
    return component;
  }

  /**
   * Remove a component from this entity
   */
  removeComponent(componentNameOrClass) {
    const componentName = typeof componentNameOrClass === 'string' 
      ? componentNameOrClass 
      : componentNameOrClass.name;

    const component = this.components.get(componentName);
    if (!component) return null;

    if (component.onDetach) {
      component.onDetach(this);
    }

    this.components.delete(componentName);
    this.emit('componentRemoved', component);

    return component;
  }

  /**
   * Get a component by name or class
   */
  getComponent(componentNameOrClass) {
    const componentName = typeof componentNameOrClass === 'string'
      ? componentNameOrClass
      : componentNameOrClass.name;

    return this.components.get(componentName);
  }

  /**
   * Check if entity has a component
   */
  hasComponent(componentNameOrClass) {
    const componentName = typeof componentNameOrClass === 'string'
      ? componentNameOrClass
      : componentNameOrClass.name;

    return this.components.has(componentName);
  }

  /**
   * Get all components
   */
  getAllComponents() {
    return Array.from(this.components.values());
  }

  /**
   * Set position
   */
  setPosition(x, y, z) {
    if (typeof x === 'object') {
      this.position.copy(x);
    } else {
      this.position.set(x, y, z);
    }
    
    // Auto-sync mesh position if mesh exists
    if (this.mesh) {
      this.mesh.position.copy(this.position);
    }
    
    this.emit('positionChanged', this.position);
  }

  /**
   * Set rotation
   */
  setRotation(x, y, z) {
    if (typeof x === 'object') {
      this.rotation.copy(x);
    } else {
      this.rotation.set(x, y, z);
    }
    this.emit('rotationChanged', this.rotation);
  }

  /**
   * Set scale
   */
  setScale(x, y, z) {
    if (typeof x === 'object') {
      this.scale.copy(x);
    } else if (y === undefined && z === undefined) {
      this.scale.set(x, x, x);
    } else {
      this.scale.set(x, y, z);
    }
    this.emit('scaleChanged', this.scale);
  }

  /**
   * Look at a position
   */
  lookAt(target) {
    if (this.mesh) {
      this.mesh.lookAt(target);
      this.rotation.copy(this.mesh.rotation);
    }
  }

  /**
   * Get forward direction
   */
  getForward() {
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyEuler(this.rotation);
    return forward.normalize();
  }

  /**
   * Get right direction
   */
  getRight() {
    const right = new THREE.Vector3(1, 0, 0);
    right.applyEuler(this.rotation);
    return right.normalize();
  }

  /**
   * Get up direction
   */
  getUp() {
    const up = new THREE.Vector3(0, 1, 0);
    up.applyEuler(this.rotation);
    return up.normalize();
  }

  /**
   * Calculate distance to another entity or position
   */
  distanceTo(target) {
    const targetPos = target.position || target;
    return this.position.distanceTo(targetPos);
  }

  /**
   * Add a tag
   */
  addTag(tag) {
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  /**
   * Remove a tag
   */
  removeTag(tag) {
    const index = this.tags.indexOf(tag);
    if (index > -1) {
      this.tags.splice(index, 1);
    }
  }

  /**
   * Check if has tag
   */
  hasTag(tag) {
    return this.tags.includes(tag);
  }

  /**
   * Called when added to a scene
   */
  onAddedToScene(scene) {
    this.scene = scene;
    this.emit('addedToScene', scene);
  }

  /**
   * Called when removed from a scene
   */
  onRemovedFromScene(scene) {
    this.scene = null;
    this.emit('removedFromScene', scene);
  }

  /**
   * Set visibility
   */
  setVisible(visible) {
    this.isVisible = visible;
    if (this.mesh) {
      this.mesh.visible = visible;
    }
  }

  /**
   * Set active state
   */
  setActive(active) {
    this.isActive = active;
  }

  /**
   * Serialize entity state for networking
   */
  serialize() {
    return {
      id: this.id,
      type: this.type,
      position: this.position.toArray(),
      rotation: [this.rotation.x, this.rotation.y, this.rotation.z],
      scale: this.scale.toArray(),
      isActive: this.isActive,
      isVisible: this.isVisible,
      data: this.data
    };
  }

  /**
   * Deserialize entity state from network
   */
  deserialize(data) {
    if (data.position) {
      this.position.fromArray(data.position);
    }
    if (data.rotation) {
      this.rotation.set(data.rotation[0], data.rotation[1], data.rotation[2]);
    }
    if (data.scale) {
      this.scale.fromArray(data.scale);
    }
    if (data.isActive !== undefined) {
      this.isActive = data.isActive;
    }
    if (data.isVisible !== undefined) {
      this.setVisible(data.isVisible);
    }
    if (data.data) {
      Object.assign(this.data, data.data);
    }
  }

  /**
   * Generate unique ID
   */
  _generateId() {
    return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    // Dispose all components
    for (const component of this.components.values()) {
      if (component.dispose) {
        component.dispose();
      }
    }
    this.components.clear();

    // Dispose mesh
    if (this.mesh) {
      if (this.mesh.geometry) {
        this.mesh.geometry.dispose();
      }
      if (this.mesh.material) {
        if (Array.isArray(this.mesh.material)) {
          this.mesh.material.forEach(m => m.dispose());
        } else {
          this.mesh.material.dispose();
        }
      }
    }

    this.removeAllListeners();
    this.emit('disposed');
  }
}

