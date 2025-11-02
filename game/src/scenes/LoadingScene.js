import { Scene } from './Scene.js';
import * as THREE from 'three';

/**
 * Loading Scene
 * Displays loading progress while assets are being loaded
 */
export class LoadingScene extends Scene {
  constructor(engine) {
    super(engine);
    
    this.name = 'LoadingScene';
    this.backgroundColor = 0x1a1a2e;
    this.loadingProgress = 0;
    this.loadingText = 'Loading...';
  }

  async initialize() {
    await super.initialize();

    // Create loading UI elements (you can customize this)
    this._createLoadingUI();
  }

  _createLoadingUI() {
    // This is a placeholder - in a real game you'd use HTML/CSS overlay
    // or a more sophisticated UI system
    
    // Create a simple text mesh for demonstration
    const loader = new THREE.FontLoader();
    // Note: In production, you'd load a font here
    
    // For now, just create a simple plane with a material
    const geometry = new THREE.PlaneGeometry(10, 2);
    const material = new THREE.MeshBasicMaterial({ 
      color: 0x00ff00,
      transparent: true,
      opacity: 0.5
    });
    
    this.loadingBar = new THREE.Mesh(geometry, material);
    this.loadingBar.position.set(0, 0, -5);
    this.add(this.loadingBar);
  }

  /**
   * Update loading progress
   */
  setProgress(progress, text = null) {
    this.loadingProgress = Math.min(1, Math.max(0, progress));
    
    if (text) {
      this.loadingText = text;
    }

    // Update loading bar scale
    if (this.loadingBar) {
      this.loadingBar.scale.x = this.loadingProgress;
    }

    this.emit('progressUpdate', { 
      progress: this.loadingProgress, 
      text: this.loadingText 
    });
  }

  update(deltaTime, elapsedTime) {
    super.update(deltaTime, elapsedTime);

    // Animate loading bar (optional)
    if (this.loadingBar) {
      this.loadingBar.rotation.z = Math.sin(elapsedTime * 2) * 0.1;
    }
  }

  dispose() {
    if (this.loadingBar) {
      this.loadingBar.geometry.dispose();
      this.loadingBar.material.dispose();
    }
    super.dispose();
  }
}

