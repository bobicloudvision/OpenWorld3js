import EventEmitter from 'eventemitter3';

/**
 * Base Component class
 * Components add functionality to entities
 */
export class Component extends EventEmitter {
  constructor() {
    super();
    
    this.entity = null;
    this.isActive = true;
  }

  /**
   * Called when component is attached to an entity
   */
  onAttach(entity) {
    this.entity = entity;
    this.emit('attached', entity);
  }

  /**
   * Called when component is detached from an entity
   */
  onDetach(entity) {
    this.entity = null;
    this.emit('detached', entity);
  }

  /**
   * Update component (called every frame)
   */
  update(deltaTime, elapsedTime) {
    // Override in subclass
  }

  /**
   * Fixed update (for physics)
   */
  fixedUpdate(fixedDeltaTime) {
    // Override in subclass
  }

  /**
   * Set active state
   */
  setActive(active) {
    this.isActive = active;
  }

  /**
   * Dispose component
   */
  dispose() {
    this.removeAllListeners();
  }
}

