import EventEmitter from 'eventemitter3';

/**
 * Input Manager
 * Centralized input handling for keyboard, mouse, and gamepad
 */
export class InputManager extends EventEmitter {
  constructor(engine) {
    super();
    
    this.engine = engine;
    
    // Input states
    this.keys = new Map();
    this.keysDown = new Set();
    this.keysPressed = new Set();
    this.keysReleased = new Set();

    // Mouse state
    this.mouse = {
      x: 0,
      y: 0,
      deltaX: 0,
      deltaY: 0,
      buttons: new Map(),
      wheel: 0,
      isLocked: false
    };

    // Touch state
    this.touches = new Map();

    // Input actions (key bindings)
    this.actions = new Map();

    // Settings
    this.isEnabled = true;
    this.preventDefault = true;

    this._setupEventListeners();
  }

  /**
   * Setup DOM event listeners
   */
  _setupEventListeners() {
    // Keyboard events
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('keyup', this._onKeyUp.bind(this));

    // Mouse events
    window.addEventListener('mousedown', this._onMouseDown.bind(this));
    window.addEventListener('mouseup', this._onMouseUp.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));
    window.addEventListener('wheel', this._onMouseWheel.bind(this), { passive: false });
    window.addEventListener('contextmenu', (e) => {
      if (this.preventDefault) e.preventDefault();
    });

    // Pointer lock
    document.addEventListener('pointerlockchange', this._onPointerLockChange.bind(this));
    document.addEventListener('pointerlockerror', this._onPointerLockError.bind(this));

    // Touch events
    window.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
    window.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
    window.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });

    // Focus events
    window.addEventListener('blur', this._onBlur.bind(this));
  }

  /**
   * Keyboard down handler
   */
  _onKeyDown(event) {
    if (!this.isEnabled) return;

    const key = event.code;

    // Check if newly pressed
    if (!this.keysDown.has(key)) {
      this.keysPressed.add(key);
      this.emit('keyPressed', { key, event });
    }

    this.keysDown.add(key);
    this.keys.set(key, true);

    // Check for action bindings
    this._checkActions(key, true);

    this.emit('keyDown', { key, event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Keyboard up handler
   */
  _onKeyUp(event) {
    if (!this.isEnabled) return;

    const key = event.code;

    this.keysDown.delete(key);
    this.keysReleased.add(key);
    this.keys.set(key, false);

    // Check for action bindings
    this._checkActions(key, false);

    this.emit('keyUp', { key, event });
    this.emit('keyReleased', { key, event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Mouse down handler
   */
  _onMouseDown(event) {
    if (!this.isEnabled) return;

    this.mouse.buttons.set(event.button, true);
    this.emit('mouseDown', { button: event.button, event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Mouse up handler
   */
  _onMouseUp(event) {
    if (!this.isEnabled) return;

    this.mouse.buttons.set(event.button, false);
    this.emit('mouseUp', { button: event.button, event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Mouse move handler
   */
  _onMouseMove(event) {
    if (!this.isEnabled) return;

    const prevX = this.mouse.x;
    const prevY = this.mouse.y;

    if (this.mouse.isLocked) {
      this.mouse.deltaX = event.movementX || 0;
      this.mouse.deltaY = event.movementY || 0;
    } else {
      this.mouse.x = event.clientX;
      this.mouse.y = event.clientY;
      this.mouse.deltaX = this.mouse.x - prevX;
      this.mouse.deltaY = this.mouse.y - prevY;
    }

    this.emit('mouseMove', { 
      x: this.mouse.x, 
      y: this.mouse.y, 
      deltaX: this.mouse.deltaX, 
      deltaY: this.mouse.deltaY,
      event 
    });
  }

  /**
   * Mouse wheel handler
   */
  _onMouseWheel(event) {
    if (!this.isEnabled) return;

    this.mouse.wheel = event.deltaY;
    this.emit('mouseWheel', { delta: event.deltaY, event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Touch start handler
   */
  _onTouchStart(event) {
    if (!this.isEnabled) return;

    for (const touch of event.changedTouches) {
      this.touches.set(touch.identifier, {
        id: touch.identifier,
        x: touch.clientX,
        y: touch.clientY,
        startX: touch.clientX,
        startY: touch.clientY
      });
    }

    this.emit('touchStart', { touches: Array.from(this.touches.values()), event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Touch move handler
   */
  _onTouchMove(event) {
    if (!this.isEnabled) return;

    for (const touch of event.changedTouches) {
      const stored = this.touches.get(touch.identifier);
      if (stored) {
        stored.x = touch.clientX;
        stored.y = touch.clientY;
      }
    }

    this.emit('touchMove', { touches: Array.from(this.touches.values()), event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Touch end handler
   */
  _onTouchEnd(event) {
    if (!this.isEnabled) return;

    for (const touch of event.changedTouches) {
      this.touches.delete(touch.identifier);
    }

    this.emit('touchEnd', { touches: Array.from(this.touches.values()), event });

    if (this.preventDefault) {
      event.preventDefault();
    }
  }

  /**
   * Pointer lock change handler
   */
  _onPointerLockChange() {
    this.mouse.isLocked = document.pointerLockElement !== null;
    this.emit('pointerLockChange', { isLocked: this.mouse.isLocked });
  }

  /**
   * Pointer lock error handler
   */
  _onPointerLockError() {
    console.error('Pointer lock error');
    this.emit('pointerLockError');
  }

  /**
   * Window blur handler (reset all inputs)
   */
  _onBlur() {
    this.keysDown.clear();
    this.keysPressed.clear();
    this.keysReleased.clear();
    this.keys.clear();
    this.mouse.buttons.clear();
    this.touches.clear();
  }

  /**
   * Update (called every frame)
   */
  update(deltaTime) {
    // Don't clear pressed/released here - do it in lateUpdate
    // This ensures scenes can check isActionPressed() in their update
  }

  /**
   * Late update - called after scene updates
   * Clear one-frame states here
   */
  lateUpdate() {
    // Clear pressed/released states
    this.keysPressed.clear();
    this.keysReleased.clear();

    // Reset mouse delta
    if (!this.mouse.isLocked) {
      this.mouse.deltaX = 0;
      this.mouse.deltaY = 0;
    }

    // Reset wheel
    this.mouse.wheel = 0;
  }

  /**
   * Check if key is currently down
   */
  isKeyDown(key) {
    return this.keysDown.has(key);
  }

  /**
   * Check if key was just pressed this frame
   */
  isKeyPressed(key) {
    return this.keysPressed.has(key);
  }

  /**
   * Check if key was just released this frame
   */
  isKeyReleased(key) {
    return this.keysReleased.has(key);
  }

  /**
   * Check if mouse button is down
   */
  isMouseButtonDown(button) {
    return this.mouse.buttons.get(button) === true;
  }

  /**
   * Get mouse position
   */
  getMousePosition() {
    return { x: this.mouse.x, y: this.mouse.y };
  }

  /**
   * Get mouse delta
   */
  getMouseDelta() {
    return { x: this.mouse.deltaX, y: this.mouse.deltaY };
  }

  /**
   * Request pointer lock
   */
  requestPointerLock(element = document.body) {
    element.requestPointerLock();
  }

  /**
   * Exit pointer lock
   */
  exitPointerLock() {
    document.exitPointerLock();
  }

  /**
   * Bind an action to keys
   */
  bindAction(actionName, keys) {
    if (!Array.isArray(keys)) {
      keys = [keys];
    }
    this.actions.set(actionName, keys);
  }

  /**
   * Check if action is active
   */
  isActionDown(actionName) {
    const keys = this.actions.get(actionName);
    if (!keys) return false;

    return keys.some(key => this.isKeyDown(key));
  }

  /**
   * Check if action was just pressed
   */
  isActionPressed(actionName) {
    const keys = this.actions.get(actionName);
    if (!keys) return false;

    return keys.some(key => this.isKeyPressed(key));
  }

  /**
   * Check action bindings
   */
  _checkActions(key, isDown) {
    for (const [actionName, keys] of this.actions) {
      if (keys.includes(key)) {
        if (isDown) {
          this.emit('actionPressed', { action: actionName, key });
        } else {
          this.emit('actionReleased', { action: actionName, key });
        }
      }
    }
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousedown', this._onMouseDown);
    window.removeEventListener('mouseup', this._onMouseUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('wheel', this._onMouseWheel);
    window.removeEventListener('touchstart', this._onTouchStart);
    window.removeEventListener('touchmove', this._onTouchMove);
    window.removeEventListener('touchend', this._onTouchEnd);
    window.removeEventListener('blur', this._onBlur);
    document.removeEventListener('pointerlockchange', this._onPointerLockChange);
    document.removeEventListener('pointerlockerror', this._onPointerLockError);

    this.removeAllListeners();
  }
}

