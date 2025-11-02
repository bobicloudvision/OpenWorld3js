import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import EventEmitter from 'eventemitter3';

/**
 * Asset Manager
 * Handles loading and caching of all game assets
 */
export class AssetManager extends EventEmitter {
  constructor(engine) {
    super();
    
    this.engine = engine;
    
    // Asset caches
    this.textures = new Map();
    this.models = new Map();
    this.sounds = new Map();
    this.materials = new Map();
    this.animations = new Map();
    this.fonts = new Map();

    // Loaders
    this.textureLoader = new THREE.TextureLoader();
    this.gltfLoader = new GLTFLoader();
    this.fbxLoader = new FBXLoader();
    this.audioLoader = new THREE.AudioLoader();
    this.cubeTextureLoader = new THREE.CubeTextureLoader();

    // Draco loader for compressed models
    this.dracoLoader = new DRACOLoader();
    this.dracoLoader.setDecoderPath('/draco/'); // Set path to your draco decoder
    this.gltfLoader.setDRACOLoader(this.dracoLoader);

    // Loading tracking
    this.loadingManager = new THREE.LoadingManager();
    this.isLoading = false;
    this.loadQueue = [];
    this.totalAssets = 0;
    this.loadedAssets = 0;

    this._setupLoadingManager();
  }

  /**
   * Setup loading manager events
   */
  _setupLoadingManager() {
    this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
      this.isLoading = true;
      this.totalAssets = itemsTotal;
      this.loadedAssets = itemsLoaded;
      this.emit('loadStart', { url, itemsLoaded, itemsTotal });
    };

    this.loadingManager.onLoad = () => {
      this.isLoading = false;
      this.emit('loadComplete');
    };

    this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
      this.loadedAssets = itemsLoaded;
      this.totalAssets = itemsTotal;
      
      const progress = itemsTotal > 0 ? itemsLoaded / itemsTotal : 0;
      this.emit('loadProgress', { 
        url, 
        itemsLoaded, 
        itemsTotal, 
        progress 
      });
    };

    this.loadingManager.onError = (url) => {
      console.error(`Error loading: ${url}`);
      this.emit('loadError', { url });
    };
  }

  /**
   * Load a texture
   */
  async loadTexture(name, url, options = {}) {
    if (this.textures.has(name)) {
      return this.textures.get(name);
    }

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Apply options
          if (options.repeat) {
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            texture.repeat.set(options.repeat.x || 1, options.repeat.y || 1);
          }

          if (options.encoding) {
            texture.colorSpace = options.encoding;
          } else {
            texture.colorSpace = THREE.SRGBColorSpace;
          }

          this.textures.set(name, texture);
          this.emit('textureLoaded', { name, texture });
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load texture ${name}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load a GLTF/GLB model
   */
  async loadModel(name, url, options = {}) {
    if (this.models.has(name)) {
      return this.models.get(name);
    }

    return new Promise((resolve, reject) => {
      this.gltfLoader.load(
        url,
        (gltf) => {
          const modelData = {
            scene: gltf.scene,
            animations: gltf.animations,
            cameras: gltf.cameras,
            asset: gltf.asset,
            parser: gltf.parser,
            userData: gltf.userData
          };

          // Store animations separately if they exist
          if (gltf.animations && gltf.animations.length > 0) {
            this.animations.set(name, gltf.animations);
          }

          // Apply options
          if (options.castShadow !== undefined) {
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = options.castShadow;
              }
            });
          }

          if (options.receiveShadow !== undefined) {
            gltf.scene.traverse((child) => {
              if (child.isMesh) {
                child.receiveShadow = options.receiveShadow;
              }
            });
          }

          this.models.set(name, modelData);
          this.emit('modelLoaded', { name, model: modelData });
          resolve(modelData);
        },
        (progress) => {
          const percent = progress.total > 0 ? (progress.loaded / progress.total) : 0;
          this.emit('modelProgress', { name, progress: percent });
        },
        (error) => {
          console.error(`Failed to load model ${name}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load an FBX model
   */
  async loadFBX(name, url, options = {}) {
    if (this.models.has(name)) {
      return this.models.get(name);
    }

    return new Promise((resolve, reject) => {
      this.fbxLoader.load(
        url,
        (fbx) => {
          const modelData = {
            scene: fbx,
            animations: fbx.animations || []
          };

          if (fbx.animations && fbx.animations.length > 0) {
            this.animations.set(name, fbx.animations);
          }

          this.models.set(name, modelData);
          this.emit('modelLoaded', { name, model: modelData });
          resolve(modelData);
        },
        undefined,
        (error) => {
          console.error(`Failed to load FBX ${name}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load an audio file
   */
  async loadAudio(name, url) {
    if (this.sounds.has(name)) {
      return this.sounds.get(name);
    }

    return new Promise((resolve, reject) => {
      this.audioLoader.load(
        url,
        (buffer) => {
          this.sounds.set(name, buffer);
          this.emit('audioLoaded', { name, buffer });
          resolve(buffer);
        },
        undefined,
        (error) => {
          console.error(`Failed to load audio ${name}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load a cube texture (for skybox)
   */
  async loadCubeTexture(name, urls) {
    if (this.textures.has(name)) {
      return this.textures.get(name);
    }

    return new Promise((resolve, reject) => {
      this.cubeTextureLoader.load(
        urls,
        (texture) => {
          this.textures.set(name, texture);
          this.emit('cubeTextureLoaded', { name, texture });
          resolve(texture);
        },
        undefined,
        (error) => {
          console.error(`Failed to load cube texture ${name}:`, error);
          reject(error);
        }
      );
    });
  }

  /**
   * Load multiple assets in batch
   */
  async loadBatch(assets) {
    const promises = assets.map(asset => {
      switch (asset.type) {
        case 'texture':
          return this.loadTexture(asset.name, asset.url, asset.options);
        case 'model':
        case 'gltf':
          return this.loadModel(asset.name, asset.url, asset.options);
        case 'fbx':
          return this.loadFBX(asset.name, asset.url, asset.options);
        case 'audio':
          return this.loadAudio(asset.name, asset.url);
        case 'cubeTexture':
          return this.loadCubeTexture(asset.name, asset.urls);
        default:
          console.warn(`Unknown asset type: ${asset.type}`);
          return Promise.resolve(null);
      }
    });

    return await Promise.all(promises);
  }

  /**
   * Get a texture by name
   */
  getTexture(name) {
    return this.textures.get(name);
  }

  /**
   * Get a model by name
   */
  getModel(name) {
    return this.models.get(name);
  }

  /**
   * Get animations for a model
   */
  getAnimations(name) {
    return this.animations.get(name);
  }

  /**
   * Get an audio buffer by name
   */
  getAudio(name) {
    return this.sounds.get(name);
  }

  /**
   * Clone a model (creates a new instance)
   */
  cloneModel(name) {
    const modelData = this.models.get(name);
    if (!modelData) {
      console.warn(`Model ${name} not found`);
      return null;
    }

    const clone = modelData.scene.clone();
    
    return {
      scene: clone,
      animations: modelData.animations ? [...modelData.animations] : []
    };
  }

  /**
   * Create material and cache it
   */
  createMaterial(name, materialConfig) {
    if (this.materials.has(name)) {
      return this.materials.get(name);
    }

    let material;

    switch (materialConfig.type) {
      case 'standard':
        material = new THREE.MeshStandardMaterial(materialConfig);
        break;
      case 'physical':
        material = new THREE.MeshPhysicalMaterial(materialConfig);
        break;
      case 'basic':
        material = new THREE.MeshBasicMaterial(materialConfig);
        break;
      case 'phong':
        material = new THREE.MeshPhongMaterial(materialConfig);
        break;
      default:
        material = new THREE.MeshStandardMaterial(materialConfig);
    }

    this.materials.set(name, material);
    return material;
  }

  /**
   * Get a cached material
   */
  getMaterial(name) {
    return this.materials.get(name);
  }

  /**
   * Get loading progress (0-1)
   */
  getProgress() {
    return this.totalAssets > 0 ? this.loadedAssets / this.totalAssets : 1;
  }

  /**
   * Check if currently loading
   */
  getIsLoading() {
    return this.isLoading;
  }

  /**
   * Clear cache
   */
  clearCache() {
    // Dispose textures
    this.textures.forEach(texture => texture.dispose());
    this.textures.clear();

    // Dispose materials
    this.materials.forEach(material => material.dispose());
    this.materials.clear();

    // Clear other caches
    this.models.clear();
    this.sounds.clear();
    this.animations.clear();
    this.fonts.clear();

    this.emit('cacheCleared');
  }

  /**
   * Dispose and cleanup
   */
  dispose() {
    this.clearCache();
    this.removeAllListeners();
  }
}

