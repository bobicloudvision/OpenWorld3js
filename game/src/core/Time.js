/**
 * Time management system
 * Tracks delta time, elapsed time, and time scale
 */
export class Time {
  constructor() {
    this.startTime = 0;
    this.currentTime = 0;
    this.lastTime = 0;
    this.elapsed = 0;
    this.delta = 0;
    this.timeScale = 1.0;
    this.frame = 0;

    // Fixed timestep for physics
    this.fixedDelta = 1 / 60; // 60 FPS
    this.accumulator = 0;
    this.maxAccumulator = 0.25; // Prevent spiral of death
  }

  /**
   * Start the time tracking
   */
  start() {
    this.startTime = performance.now() / 1000;
    this.currentTime = this.startTime;
    this.lastTime = this.startTime;
    this.elapsed = 0;
    this.delta = 0;
    this.frame = 0;
  }

  /**
   * Update time values
   */
  update() {
    const now = performance.now() / 1000;
    this.delta = Math.min((now - this.lastTime) * this.timeScale, 0.1); // Cap at 100ms
    this.lastTime = now;
    this.currentTime = now;
    this.elapsed = now - this.startTime;
    this.frame++;

    // Update accumulator for fixed timestep
    this.accumulator += this.delta;
    if (this.accumulator > this.maxAccumulator) {
      this.accumulator = this.maxAccumulator;
    }
  }

  /**
   * Check if we should run a fixed update
   */
  shouldFixedUpdate() {
    return this.accumulator >= this.fixedDelta;
  }

  /**
   * Consume fixed delta time
   */
  consumeFixedDelta() {
    this.accumulator -= this.fixedDelta;
  }

  /**
   * Set time scale (for slow motion, fast forward, etc.)
   */
  setTimeScale(scale) {
    this.timeScale = Math.max(0, scale);
  }

  /**
   * Get frames per second
   */
  getFPS() {
    return this.delta > 0 ? 1 / this.delta : 0;
  }

  /**
   * Get elapsed time since start in seconds
   */
  getElapsed() {
    return this.elapsed;
  }

  /**
   * Get current frame number
   */
  getFrame() {
    return this.frame;
  }
}

