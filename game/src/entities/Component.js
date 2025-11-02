import EventEmitter from 'eventemitter3';

/**
 * Base Component class
 * Components add functionality to entities
 * 
 * Unity-like lifecycle:
 * - awake() - Called once when component is first created
 * - start() - Called once before first update
 * - onEnable() - Called when component/entity is enabled
 * - update() - Called every frame
 * - fixedUpdate() - Called at fixed intervals for physics
 * - lateUpdate() - Called after all updates
 * - onDisable() - Called when component/entity is disabled
 * - onDestroy() - Called when component is destroyed
 */
export class Component extends EventEmitter {
  constructor() {
    super();
    
    this.entity = null;
    this.gameObject = null; // Alias for entity (Unity-like)
    this.isActive = true;
    this.enabled = true; // Unity-like
  }

  /**
   * Called when component is attached to an entity
   */
  onAttach(entity) {
    this.entity = entity;
    this.gameObject = entity; // Unity-like alias
    this.emit('attached', entity);
  }

  /**
   * Called when component is detached from an entity
   */
  onDetach(entity) {
    this.entity = null;
    this.gameObject = null;
    this.emit('detached', entity);
  }

  /**
   * Awake - called once when component is created (before Start)
   * Override this in your custom components
   */
  awake() {
    // Override in subclass
  }

  /**
   * Start - called once before first update (after Awake)
   * Override this in your custom components
   */
  start() {
    // Override in subclass
  }

  /**
   * OnEnable - called when component or GameObject is enabled
   * Override this in your custom components
   */
  onEnable() {
    // Override in subclass
  }

  /**
   * Update component (called every frame)
   * Override this in your custom components
   */
  update(deltaTime, elapsedTime) {
    // Override in subclass
  }

  /**
   * Fixed update (for physics)
   * Override this in your custom components
   */
  fixedUpdate(fixedDeltaTime) {
    // Override in subclass
  }

  /**
   * Late update (called after all updates)
   * Override this in your custom components
   */
  lateUpdate(deltaTime) {
    // Override in subclass
  }

  /**
   * OnDisable - called when component or GameObject is disabled
   * Override this in your custom components
   */
  onDisable() {
    // Override in subclass
  }

  /**
   * OnDestroy - called when component is destroyed
   * Override this in your custom components
   */
  onDestroy() {
    // Override in subclass
  }

  /**
   * Set active state
   */
  setActive(active) {
    if (this.isActive === active) return;
    
    this.isActive = active;
    this.enabled = active;

    if (active) {
      this.onEnable();
    } else {
      this.onDisable();
    }
  }

  /**
   * Get component from the same GameObject (Unity-like)
   */
  getComponent(componentClass) {
    return this.entity ? this.entity.getComponent(componentClass) : null;
  }

  /**
   * Send message to other components on same GameObject
   */
  sendMessage(methodName, value) {
    if (this.entity && this.entity.sendMessage) {
      this.entity.sendMessage(methodName, value);
    }
  }

  /**
   * Get the transform (Unity-like)
   */
  get transform() {
    return this.entity ? this.entity.transform : null;
  }

  /**
   * Clone this component
   */
  clone() {
    const cloned = new this.constructor();
    
    // Copy properties (shallow copy)
    for (const key in this) {
      if (this.hasOwnProperty(key) && key !== 'entity' && key !== 'gameObject') {
        if (typeof this[key] !== 'function') {
          cloned[key] = this[key];
        }
      }
    }

    return cloned;
  }

  /**
   * Dispose component
   */
  dispose() {
    this.onDestroy();
    this.removeAllListeners();
  }
}

