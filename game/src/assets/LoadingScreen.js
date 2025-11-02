import EventEmitter from 'eventemitter3';

/**
 * Loading Screen
 * Displays loading progress and manages transitions
 */
export class LoadingScreen extends EventEmitter {
  constructor(config = {}) {
    super();

    this.config = {
      container: config.container || document.body,
      fadeInDuration: config.fadeInDuration || 300,
      fadeOutDuration: config.fadeOutDuration || 500,
      minDisplayTime: config.minDisplayTime || 1000, // Minimum time to show loading screen
      ...config
    };

    // State
    this.isVisible = false;
    this.progress = 0;
    this.startTime = 0;

    // DOM elements
    this.element = null;
    this.progressBar = null;
    this.progressText = null;
    this.loadingText = null;

    this._createElements();
  }

  /**
   * Create DOM elements for loading screen
   */
  _createElements() {
    // Main container
    this.element = document.createElement('div');
    this.element.className = 'game-loading-screen';
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 0;
      transition: opacity ${this.config.fadeOutDuration}ms ease;
      font-family: 'Arial', sans-serif;
    `;

    // Logo/Title
    const title = document.createElement('div');
    title.className = 'loading-title';
    title.textContent = this.config.title || 'Loading Game';
    title.style.cssText = `
      font-size: 48px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 40px;
      text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
    `;
    this.element.appendChild(title);

    // Progress container
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 400px;
      max-width: 80%;
    `;

    // Progress bar background
    const progressBg = document.createElement('div');
    progressBg.style.cssText = `
      width: 100%;
      height: 8px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    `;

    // Progress bar fill
    this.progressBar = document.createElement('div');
    this.progressBar.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #00d4ff 0%, #0099ff 100%);
      border-radius: 4px;
      transition: width 0.3s ease;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.5);
    `;
    progressBg.appendChild(this.progressBar);
    progressContainer.appendChild(progressBg);

    // Progress text
    this.progressText = document.createElement('div');
    this.progressText.style.cssText = `
      margin-top: 16px;
      font-size: 18px;
      color: rgba(255, 255, 255, 0.8);
      text-align: center;
    `;
    this.progressText.textContent = '0%';
    progressContainer.appendChild(this.progressText);

    // Loading text
    this.loadingText = document.createElement('div');
    this.loadingText.style.cssText = `
      margin-top: 12px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.6);
      text-align: center;
      min-height: 20px;
    `;
    this.loadingText.textContent = 'Initializing...';
    progressContainer.appendChild(this.loadingText);

    this.element.appendChild(progressContainer);

    // Tip text (optional)
    if (this.config.tips && this.config.tips.length > 0) {
      this.tipText = document.createElement('div');
      this.tipText.style.cssText = `
        position: absolute;
        bottom: 60px;
        left: 50%;
        transform: translateX(-50%);
        width: 80%;
        max-width: 600px;
        font-size: 14px;
        color: rgba(255, 255, 255, 0.5);
        text-align: center;
        font-style: italic;
      `;
      this._updateTip();
      this.element.appendChild(this.tipText);
    }
  }

  /**
   * Show loading screen
   */
  show() {
    if (this.isVisible) return;

    this.config.container.appendChild(this.element);
    this.startTime = Date.now();

    // Force reflow
    this.element.offsetHeight;

    // Fade in
    this.element.style.opacity = '1';
    this.isVisible = true;

    this.emit('shown');
  }

  /**
   * Hide loading screen
   */
  async hide() {
    if (!this.isVisible) return;

    // Ensure minimum display time
    const elapsed = Date.now() - this.startTime;
    const remaining = Math.max(0, this.config.minDisplayTime - elapsed);

    if (remaining > 0) {
      await new Promise(resolve => setTimeout(resolve, remaining));
    }

    // Fade out
    this.element.style.opacity = '0';

    // Remove from DOM after fade
    setTimeout(() => {
      if (this.element.parentNode) {
        this.element.parentNode.removeChild(this.element);
      }
      this.isVisible = false;
      this.emit('hidden');
    }, this.config.fadeOutDuration);
  }

  /**
   * Update progress (0-1)
   */
  setProgress(progress, text = null) {
    this.progress = Math.min(1, Math.max(0, progress));

    // Update progress bar
    const percent = Math.round(this.progress * 100);
    this.progressBar.style.width = `${percent}%`;
    this.progressText.textContent = `${percent}%`;

    // Update loading text
    if (text) {
      this.loadingText.textContent = text;
    }

    this.emit('progress', { progress: this.progress, text });

    // Auto-hide when complete
    if (this.progress >= 1 && this.config.autoHide !== false) {
      setTimeout(() => this.hide(), 500);
    }
  }

  /**
   * Set loading text
   */
  setText(text) {
    this.loadingText.textContent = text;
  }

  /**
   * Update tip text
   */
  _updateTip() {
    if (!this.tipText || !this.config.tips) return;

    const tip = this.config.tips[Math.floor(Math.random() * this.config.tips.length)];
    this.tipText.textContent = `Tip: ${tip}`;
  }

  /**
   * Check if visible
   */
  isShowing() {
    return this.isVisible;
  }

  /**
   * Dispose
   */
  dispose() {
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    this.removeAllListeners();
  }
}

