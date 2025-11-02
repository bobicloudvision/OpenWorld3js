import { Scene } from './Scene.js';

/**
 * GameScene - Enhanced Scene with Unity-like query methods
 * 
 * Use this instead of Scene for better GameObject management
 * 
 * Features:
 * - Find() - Find GameObject by name
 * - FindObjectOfType() - Find first GameObject with component
 * - FindObjectsOfType() - Find all GameObjects with component
 * - FindWithTag() - Find GameObject with tag
 * - FindGameObjectsWithTag() - Find all GameObjects with tag
 */
export class GameScene extends Scene {
  constructor(engine) {
    super(engine);
  }

  /**
   * Find a GameObject by name (Unity-like)
   * Returns the first GameObject with matching name
   */
  find(name) {
    for (const entity of this.entities.values()) {
      if (entity.name === name) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Find all GameObjects by name
   */
  findAll(name) {
    const results = [];
    for (const entity of this.entities.values()) {
      if (entity.name === name) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Find GameObject with tag (Unity-like)
   * Returns the first GameObject with matching tag
   */
  findWithTag(tag) {
    for (const entity of this.entities.values()) {
      if (entity.hasTag && entity.hasTag(tag)) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Find all GameObjects with tag (Unity-like)
   */
  findGameObjectsWithTag(tag) {
    const results = [];
    for (const entity of this.entities.values()) {
      if (entity.hasTag && entity.hasTag(tag)) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Find first GameObject that has a specific component (Unity-like)
   */
  findObjectOfType(componentClass) {
    const componentName = typeof componentClass === 'string' 
      ? componentClass 
      : componentClass.name;

    for (const entity of this.entities.values()) {
      if (entity.hasComponent && entity.hasComponent(componentName)) {
        return entity;
      }
    }
    return null;
  }

  /**
   * Find all GameObjects that have a specific component (Unity-like)
   */
  findObjectsOfType(componentClass) {
    const componentName = typeof componentClass === 'string' 
      ? componentClass 
      : componentClass.name;

    const results = [];
    for (const entity of this.entities.values()) {
      if (entity.hasComponent && entity.hasComponent(componentName)) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Find first GameObject with ALL specified components
   */
  findObjectWithComponents(...componentClasses) {
    for (const entity of this.entities.values()) {
      if (!entity.hasComponent) continue;

      const hasAll = componentClasses.every(componentClass => {
        const name = typeof componentClass === 'string' 
          ? componentClass 
          : componentClass.name;
        return entity.hasComponent(name);
      });

      if (hasAll) return entity;
    }
    return null;
  }

  /**
   * Find all GameObjects with ALL specified components
   */
  findObjectsWithComponents(...componentClasses) {
    const results = [];
    
    for (const entity of this.entities.values()) {
      if (!entity.hasComponent) continue;

      const hasAll = componentClasses.every(componentClass => {
        const name = typeof componentClass === 'string' 
          ? componentClass 
          : componentClass.name;
        return entity.hasComponent(name);
      });

      if (hasAll) {
        results.push(entity);
      }
    }
    
    return results;
  }

  /**
   * Find GameObjects within distance of a point
   */
  findInRadius(position, radius) {
    const results = [];
    const radiusSquared = radius * radius;

    for (const entity of this.entities.values()) {
      if (!entity.position) continue;

      const distanceSquared = entity.position.distanceToSquared(position);
      if (distanceSquared <= radiusSquared) {
        results.push({
          entity,
          distance: Math.sqrt(distanceSquared)
        });
      }
    }

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);
    return results.map(r => r.entity);
  }

  /**
   * Find closest GameObject to a point
   */
  findClosest(position, tag = null) {
    let closest = null;
    let closestDistance = Infinity;

    for (const entity of this.entities.values()) {
      if (!entity.position) continue;
      
      // Filter by tag if provided
      if (tag && (!entity.hasTag || !entity.hasTag(tag))) continue;

      const distance = entity.position.distanceTo(position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = entity;
      }
    }

    return closest;
  }

  /**
   * Find GameObjects by type (matches entity.type property)
   */
  findByType(type) {
    return this.getEntitiesByType(type);
  }

  /**
   * Destroy GameObject (Unity-like helper)
   */
  destroy(gameObject, delay = 0) {
    if (delay > 0) {
      setTimeout(() => {
        if (gameObject.destroy) {
          gameObject.destroy();
        } else {
          this.removeEntity(gameObject);
        }
      }, delay * 1000);
    } else {
      if (gameObject.destroy) {
        gameObject.destroy();
      } else {
        this.removeEntity(gameObject);
      }
    }
  }

  /**
   * Instantiate a GameObject in the scene (Unity-like)
   */
  instantiate(gameObject, position = null, rotation = null) {
    const instance = gameObject.clone ? gameObject.clone() : gameObject;
    
    if (position) {
      instance.setPosition(position);
    }
    
    if (rotation) {
      instance.setRotation(rotation);
    }

    this.addEntity(instance);
    return instance;
  }

  /**
   * Get all active GameObjects
   */
  getActiveGameObjects() {
    const results = [];
    for (const entity of this.entities.values()) {
      if (entity.isActive) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Get all inactive GameObjects
   */
  getInactiveGameObjects() {
    const results = [];
    for (const entity of this.entities.values()) {
      if (!entity.isActive) {
        results.push(entity);
      }
    }
    return results;
  }

  /**
   * Perform action on all GameObjects with component
   */
  forEachWithComponent(componentClass, callback) {
    const objects = this.findObjectsOfType(componentClass);
    objects.forEach(callback);
  }

  /**
   * Perform action on all GameObjects with tag
   */
  forEachWithTag(tag, callback) {
    const objects = this.findGameObjectsWithTag(tag);
    objects.forEach(callback);
  }

  /**
   * Send message to all GameObjects
   */
  broadcast(methodName, value) {
    for (const entity of this.entities.values()) {
      if (entity.sendMessage) {
        entity.sendMessage(methodName, value);
      }
    }
  }

  /**
   * Send message to all GameObjects with tag
   */
  broadcastToTag(tag, methodName, value) {
    const objects = this.findGameObjectsWithTag(tag);
    objects.forEach(obj => {
      if (obj.sendMessage) {
        obj.sendMessage(methodName, value);
      }
    });
  }
}

