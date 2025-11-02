import { Actor } from './Actor.js';
import * as THREE from 'three';

/**
 * GameObject class - Unity-inspired game object
 * 
 * This is a high-level wrapper around Actor/Entity that provides:
 * - Unity-like lifecycle (Awake, Start, OnEnable, OnDisable, OnDestroy)
 * - Easy component management
 * - Builder pattern for easy setup
 * - Prefab support
 * 
 * Use this for your game objects instead of Actor directly for better UX
 */
export class GameObject extends Actor {
  constructor(config = {}) {
    super(config);

    // GameObject-specific properties
    this.layer = config.layer || 0;
    this.prefabId = config.prefabId || null;
    
    // Lifecycle state
    this._awoken = false;
    this._started = false;
    this._enabled = true;
    this._destroyed = false;

    // Parent-child hierarchy
    this.parent = null;
    this.children = [];

    // Transform helpers (Unity-like)
    this.transform = {
      position: this.position,
      rotation: this.rotation,
      scale: this.scale,
      
      // Helper methods
      translate: (x, y, z) => this.translate(x, y, z),
      rotate: (x, y, z) => this.rotate(x, y, z),
      lookAt: (target) => this.lookAt(target),
      
      // Directions
      forward: () => this.getForward(),
      right: () => this.getRight(),
      up: () => this.getUp(),

      // Local to world space
      localToWorld: (localPos) => this.localToWorld(localPos),
      worldToLocal: (worldPos) => this.worldToLocal(worldPos)
    };
  }

  /**
   * Awake - called once when GameObject is created (before Start)
   * Override this in your custom GameObjects
   */
  awake() {
    // Override in subclass
  }

  /**
   * Start - called once when GameObject is first updated (after Awake)
   * Override this in your custom GameObjects
   */
  start() {
    // Override in subclass
  }

  /**
   * OnEnable - called when GameObject is enabled
   * Override this in your custom GameObjects
   */
  onEnable() {
    // Override in subclass
  }

  /**
   * OnDisable - called when GameObject is disabled
   * Override this in your custom GameObjects
   */
  onDisable() {
    // Override in subclass
  }

  /**
   * OnDestroy - called when GameObject is destroyed
   * Override this in your custom GameObjects
   */
  onDestroy() {
    // Override in subclass
  }

  /**
   * Internal update - handles lifecycle
   */
  update(deltaTime, elapsedTime) {
    if (this._destroyed) return;

    // Call Awake once
    if (!this._awoken) {
      this.awake();
      
      // Call Awake on all components
      for (const component of this.components.values()) {
        if (component.awake) {
          component.awake();
        }
      }
      
      this._awoken = true;
    }

    // Call Start once after Awake
    if (!this._started) {
      this.start();
      
      // Call Start on all components
      for (const component of this.components.values()) {
        if (component.start) {
          component.start();
        }
      }
      
      this._started = true;
    }

    // Skip update if disabled
    if (!this._enabled) return;

    // Call parent update (handles components)
    super.update(deltaTime, elapsedTime);

    // Update children
    for (const child of this.children) {
      if (child.isActive && child.update) {
        child.update(deltaTime, elapsedTime);
      }
    }
  }

  /**
   * Add a component and return it (for chaining)
   * @param {Component|Class} componentOrClass - Component instance or component class
   * @param {object} config - Configuration for component (if class is passed)
   */
  addComponent(componentOrClass, config = {}) {
    let component;

    // If it's a class, instantiate it
    if (typeof componentOrClass === 'function') {
      component = new componentOrClass(config);
    } else {
      component = componentOrClass;
    }

    // Add to entity
    const added = super.addComponent(component);

    // Call lifecycle hooks if already started
    if (this._awoken && component.awake) {
      component.awake();
    }
    if (this._started && component.start) {
      component.start();
    }

    return added;
  }

  /**
   * Get component by type (Unity-like)
   */
  getComponent(componentClass) {
    const name = typeof componentClass === 'string' 
      ? componentClass 
      : componentClass.name;
    return super.getComponent(name);
  }

  /**
   * Get components (plural) - returns all components of type
   */
  getComponents(componentClass) {
    const name = typeof componentClass === 'string' 
      ? componentClass 
      : componentClass.name;
    
    const results = [];
    for (const component of this.components.values()) {
      if (component.constructor.name === name) {
        results.push(component);
      }
    }
    return results;
  }

  /**
   * Get component in children (recursive search)
   */
  getComponentInChildren(componentClass) {
    const name = typeof componentClass === 'string' 
      ? componentClass 
      : componentClass.name;

    // Check self first
    const component = this.getComponent(name);
    if (component) return component;

    // Search children
    for (const child of this.children) {
      if (child.getComponentInChildren) {
        const found = child.getComponentInChildren(name);
        if (found) return found;
      }
    }

    return null;
  }

  /**
   * Get components in children (recursive search, returns all)
   */
  getComponentsInChildren(componentClass) {
    const name = typeof componentClass === 'string' 
      ? componentClass 
      : componentClass.name;
    
    const results = [];

    // Check self
    const selfComponents = this.getComponents(name);
    results.push(...selfComponents);

    // Search children
    for (const child of this.children) {
      if (child.getComponentsInChildren) {
        const childComponents = child.getComponentsInChildren(name);
        results.push(...childComponents);
      }
    }

    return results;
  }

  /**
   * Set parent GameObject
   */
  setParent(parent) {
    // Remove from old parent
    if (this.parent) {
      const index = this.parent.children.indexOf(this);
      if (index > -1) {
        this.parent.children.splice(index, 1);
      }
    }

    // Set new parent
    this.parent = parent;

    // Add to new parent's children
    if (parent && !parent.children.includes(this)) {
      parent.children.push(this);
    }

    return this;
  }

  /**
   * Add child GameObject
   */
  addChild(child) {
    if (child.setParent) {
      child.setParent(this);
    } else {
      if (!this.children.includes(child)) {
        this.children.push(child);
        child.parent = this;
      }
    }
    return this;
  }

  /**
   * Remove child GameObject
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      child.parent = null;
    }
    return this;
  }

  /**
   * Find child by name
   */
  findChild(name) {
    return this.children.find(child => child.name === name);
  }

  /**
   * Set enabled state (Unity-like)
   */
  setEnabled(enabled) {
    if (this._enabled === enabled) return;

    this._enabled = enabled;
    this.isActive = enabled;

    // Call lifecycle hooks
    if (enabled) {
      this.onEnable();
      
      // Enable components
      for (const component of this.components.values()) {
        if (component.onEnable) {
          component.onEnable();
        }
      }
    } else {
      this.onDisable();
      
      // Disable components
      for (const component of this.components.values()) {
        if (component.onDisable) {
          component.onDisable();
        }
      }
    }

    return this;
  }

  /**
   * Translate position
   */
  translate(x, y, z) {
    if (typeof x === 'object') {
      this.position.add(x);
    } else {
      this.position.add(new THREE.Vector3(x, y, z));
    }
    return this;
  }

  /**
   * Rotate
   */
  rotate(x, y, z) {
    if (typeof x === 'object') {
      this.rotation.x += x.x;
      this.rotation.y += x.y;
      this.rotation.z += x.z;
    } else {
      this.rotation.x += x;
      this.rotation.y += y;
      this.rotation.z += z;
    }
    return this;
  }

  /**
   * Local to world space conversion
   */
  localToWorld(localPos) {
    if (this.mesh) {
      return this.mesh.localToWorld(localPos.clone());
    }
    return localPos.clone().add(this.position);
  }

  /**
   * World to local space conversion
   */
  worldToLocal(worldPos) {
    if (this.mesh) {
      return this.mesh.worldToLocal(worldPos.clone());
    }
    return worldPos.clone().sub(this.position);
  }

  /**
   * Compare tag (Unity-like)
   */
  compareTag(tag) {
    return this.hasTag(tag);
  }

  /**
   * Send message to component (Unity-like)
   */
  sendMessage(methodName, value) {
    for (const component of this.components.values()) {
      if (typeof component[methodName] === 'function') {
        component[methodName](value);
      }
    }
    return this;
  }

  /**
   * Broadcast message to children
   */
  broadcastMessage(methodName, value) {
    this.sendMessage(methodName, value);
    
    for (const child of this.children) {
      if (child.broadcastMessage) {
        child.broadcastMessage(methodName, value);
      }
    }
    
    return this;
  }

  /**
   * Destroy this GameObject
   */
  destroy() {
    if (this._destroyed) return;

    this._destroyed = true;

    // Call OnDestroy
    this.onDestroy();

    // Destroy components
    for (const component of this.components.values()) {
      if (component.onDestroy) {
        component.onDestroy();
      }
    }

    // Destroy children
    for (const child of [...this.children]) {
      if (child.destroy) {
        child.destroy();
      }
    }

    // Remove from parent
    if (this.parent) {
      this.parent.removeChild(this);
    }

    // Remove from scene
    if (this.scene) {
      this.scene.removeEntity(this);
    }

    // Call parent dispose
    this.dispose();
  }

  /**
   * Clone this GameObject (useful for prefabs)
   */
  clone() {
    const cloned = new GameObject({
      name: this.name,
      type: this.type,
      tags: [...this.tags],
      speed: this.speed,
      layer: this.layer,
      prefabId: this.prefabId
    });

    // Clone transform
    cloned.position.copy(this.position);
    cloned.rotation.copy(this.rotation);
    cloned.scale.copy(this.scale);

    // Clone mesh if it exists
    if (this.mesh) {
      cloned.mesh = this.mesh.clone();
    }

    // Clone components
    for (const component of this.components.values()) {
      if (component.clone) {
        const clonedComponent = component.clone();
        cloned.addComponent(clonedComponent);
      }
    }

    return cloned;
  }

  /**
   * Static factory method - Create a GameObject with mesh
   */
  static create(config = {}) {
    return new GameObject(config);
  }

  /**
   * Static factory - Create GameObject with primitive mesh
   */
  static createPrimitive(type, config = {}) {
    const go = new GameObject(config);
    
    // This will be implemented with MeshBuilder
    // For now, just return the GameObject
    go.primitiveType = type;
    
    return go;
  }
}

