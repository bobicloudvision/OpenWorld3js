/**
 * Engine Utilities
 * Generic helper functions that work for any game
 */

import * as THREE from 'three';

/**
 * Math utilities
 */
export const MathUtils = {
  /**
   * Linear interpolation
   */
  lerp(start, end, t) {
    return start + (end - start) * t;
  },

  /**
   * Clamp value between min and max
   */
  clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  },

  /**
   * Map value from one range to another
   */
  map(value, inMin, inMax, outMin, outMax) {
    return ((value - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
  },

  /**
   * Random integer between min and max (inclusive)
   */
  randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },

  /**
   * Random float between min and max
   */
  randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  },

  /**
   * Random item from array
   */
  randomItem(array) {
    return array[Math.floor(Math.random() * array.length)];
  },

  /**
   * Normalize angle to -PI to PI
   */
  normalizeAngle(angle) {
    return Math.atan2(Math.sin(angle), Math.cos(angle));
  },

  /**
   * Distance between two points
   */
  distance2D(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }
};

/**
 * Vector utilities
 */
export const VectorUtils = {
  /**
   * Get random position in a circle
   */
  randomInCircle(radius) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    return new THREE.Vector3(
      Math.cos(angle) * r,
      0,
      Math.sin(angle) * r
    );
  },

  /**
   * Get random position in a sphere
   */
  randomInSphere(radius) {
    const u = Math.random();
    const v = Math.random();
    const theta = u * 2.0 * Math.PI;
    const phi = Math.acos(2.0 * v - 1.0);
    const r = Math.cbrt(Math.random()) * radius;
    
    const sinTheta = Math.sin(theta);
    const cosTheta = Math.cos(theta);
    const sinPhi = Math.sin(phi);
    const cosPhi = Math.cos(phi);
    
    return new THREE.Vector3(
      r * sinPhi * cosTheta,
      r * sinPhi * sinTheta,
      r * cosPhi
    );
  },

  /**
   * Get random position in a box
   */
  randomInBox(width, height, depth) {
    return new THREE.Vector3(
      (Math.random() - 0.5) * width,
      (Math.random() - 0.5) * height,
      (Math.random() - 0.5) * depth
    );
  },

  /**
   * Rotate vector around Y axis
   */
  rotateAroundY(vector, angle) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const x = vector.x * cos - vector.z * sin;
    const z = vector.x * sin + vector.z * cos;
    return new THREE.Vector3(x, vector.y, z);
  }
};

/**
 * Color utilities
 */
export const ColorUtils = {
  /**
   * Lerp between two colors
   */
  lerpColor(color1, color2, t) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.lerp(c2, t);
  },

  /**
   * Random color
   */
  randomColor() {
    return new THREE.Color(Math.random(), Math.random(), Math.random());
  },

  /**
   * HSL to RGB color
   */
  hslColor(h, s, l) {
    const color = new THREE.Color();
    color.setHSL(h, s, l);
    return color;
  }
};

/**
 * Timer utility
 */
export class Timer {
  constructor(duration, callback) {
    this.duration = duration;
    this.callback = callback;
    this.elapsed = 0;
    this.isActive = false;
    this.loop = false;
  }

  start() {
    this.isActive = true;
    this.elapsed = 0;
  }

  stop() {
    this.isActive = false;
  }

  reset() {
    this.elapsed = 0;
  }

  update(deltaTime) {
    if (!this.isActive) return;

    this.elapsed += deltaTime;

    if (this.elapsed >= this.duration) {
      if (this.callback) {
        this.callback();
      }

      if (this.loop) {
        this.elapsed = 0;
      } else {
        this.isActive = false;
      }
    }
  }

  getProgress() {
    return Math.min(1, this.elapsed / this.duration);
  }
}

/**
 * Object pool for performance
 */
export class ObjectPool {
  constructor(factory, initialSize = 10) {
    this.factory = factory;
    this.pool = [];
    this.active = [];

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  get() {
    let obj = this.pool.pop();
    
    if (!obj) {
      obj = this.factory();
    }

    this.active.push(obj);
    return obj;
  }

  return(obj) {
    const index = this.active.indexOf(obj);
    
    if (index > -1) {
      this.active.splice(index, 1);
      this.pool.push(obj);
    }
  }

  clear() {
    this.pool = [];
    this.active = [];
  }

  getActiveCount() {
    return this.active.length;
  }

  getPoolSize() {
    return this.pool.length;
  }
}

/**
 * Simple state machine
 */
export class StateMachine {
  constructor() {
    this.states = new Map();
    this.currentState = null;
  }

  addState(name, state) {
    this.states.set(name, state);
  }

  setState(name) {
    const newState = this.states.get(name);
    
    if (!newState) {
      console.warn(`State "${name}" not found`);
      return;
    }

    if (this.currentState && this.currentState.exit) {
      this.currentState.exit();
    }

    this.currentState = newState;

    if (this.currentState.enter) {
      this.currentState.enter();
    }
  }

  update(deltaTime) {
    if (this.currentState && this.currentState.update) {
      this.currentState.update(deltaTime);
    }
  }
}

/**
 * Simple event queue
 */
export class EventQueue {
  constructor() {
    this.queue = [];
  }

  enqueue(event, data = null) {
    this.queue.push({ event, data, timestamp: Date.now() });
  }

  dequeue() {
    return this.queue.shift();
  }

  process(handler) {
    while (this.queue.length > 0) {
      const item = this.dequeue();
      handler(item.event, item.data);
    }
  }

  clear() {
    this.queue = [];
  }

  size() {
    return this.queue.length;
  }
}

/**
 * Throttle function calls
 */
export function throttle(func, delay) {
  let lastCall = 0;
  
  return function(...args) {
    const now = Date.now();
    
    if (now - lastCall >= delay) {
      lastCall = now;
      return func.apply(this, args);
    }
  };
}

/**
 * Debounce function calls
 */
export function debounce(func, delay) {
  let timeoutId;
  
  return function(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

/**
 * UUID generator
 */
export function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Deep clone object
 */
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Check if object is empty
 */
export function isEmpty(obj) {
  return Object.keys(obj).length === 0;
}

