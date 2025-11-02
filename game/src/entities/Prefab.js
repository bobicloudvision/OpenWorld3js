/**
 * Prefab System - Unity-inspired prefab system
 * 
 * Prefabs are reusable GameObject templates that can be instantiated multiple times
 * 
 * Example:
 *   // Register a prefab
 *   PrefabManager.register('Enemy', (config) => {
 *     const enemy = GameObjectFactory.createSphere({ color: 0xff0000 });
 *     enemy.addComponent(new HealthComponent(50));
 *     enemy.addComponent(new AIComponent());
 *     return enemy;
 *   });
 * 
 *   // Instantiate prefab
 *   const enemy1 = PrefabManager.instantiate('Enemy', { position: { x: 5, y: 0, z: 0 } });
 *   const enemy2 = PrefabManager.instantiate('Enemy', { position: { x: -5, y: 0, z: 0 } });
 */

export class Prefab {
  constructor(name, factory) {
    this.name = name;
    this.factory = factory; // Function that creates a GameObject
    this.instances = [];
  }

  /**
   * Instantiate this prefab
   */
  instantiate(config = {}) {
    const instance = this.factory(config);
    instance.prefabId = this.name;
    this.instances.push(instance);
    return instance;
  }

  /**
   * Get all instances of this prefab
   */
  getInstances() {
    return this.instances.filter(instance => !instance._destroyed);
  }

  /**
   * Clear destroyed instances
   */
  clearDestroyedInstances() {
    this.instances = this.instances.filter(instance => !instance._destroyed);
  }
}

/**
 * Prefab Manager - Global prefab registry
 */
export class PrefabManager {
  static prefabs = new Map();

  /**
   * Register a prefab
   * @param {string} name - Prefab name
   * @param {function} factory - Factory function that creates GameObject
   */
  static register(name, factory) {
    if (this.prefabs.has(name)) {
      console.warn(`Prefab "${name}" already exists. Overwriting...`);
    }

    const prefab = new Prefab(name, factory);
    this.prefabs.set(name, prefab);
    return prefab;
  }

  /**
   * Unregister a prefab
   */
  static unregister(name) {
    this.prefabs.delete(name);
  }

  /**
   * Check if prefab exists
   */
  static has(name) {
    return this.prefabs.has(name);
  }

  /**
   * Get a prefab
   */
  static get(name) {
    return this.prefabs.get(name);
  }

  /**
   * Instantiate a prefab
   */
  static instantiate(name, config = {}) {
    const prefab = this.prefabs.get(name);
    
    if (!prefab) {
      console.error(`Prefab "${name}" not found!`);
      return null;
    }

    return prefab.instantiate(config);
  }

  /**
   * Get all instances of a prefab
   */
  static getInstances(name) {
    const prefab = this.prefabs.get(name);
    return prefab ? prefab.getInstances() : [];
  }

  /**
   * Get all registered prefab names
   */
  static getAllNames() {
    return Array.from(this.prefabs.keys());
  }

  /**
   * Clear all prefabs
   */
  static clear() {
    this.prefabs.clear();
  }

  /**
   * Clean up destroyed instances from all prefabs
   */
  static cleanup() {
    for (const prefab of this.prefabs.values()) {
      prefab.clearDestroyedInstances();
    }
  }
}

/**
 * Prefab decorator - Use as decorator for prefab factory functions
 * 
 * Example:
 *   @prefab('Enemy')
 *   function createEnemy(config) {
 *     const enemy = GameObjectFactory.createSphere({ color: 0xff0000 });
 *     enemy.addComponent(new HealthComponent(50));
 *     return enemy;
 *   }
 */
export function prefab(name) {
  return function(target) {
    PrefabManager.register(name, target);
    return target;
  };
}

/**
 * Helper to create a prefab from a GameObject instance
 * This creates a factory that clones the GameObject
 */
export function createPrefabFromInstance(name, gameObject) {
  return PrefabManager.register(name, (config = {}) => {
    const clone = gameObject.clone();
    
    // Apply config overrides
    if (config.position) {
      clone.setPosition(config.position);
    }
    if (config.rotation) {
      clone.setRotation(config.rotation);
    }
    if (config.scale) {
      clone.setScale(config.scale);
    }
    if (config.name) {
      clone.name = config.name;
    }

    return clone;
  });
}

