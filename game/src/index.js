// Core Engine
export { GameEngine } from './core/GameEngine.js';
export { Time } from './core/Time.js';

// Scenes
export { Scene } from './scenes/Scene.js';
export { SceneManager } from './scenes/SceneManager.js';
export { LoadingScene } from './scenes/LoadingScene.js';

// Entities
export { Entity } from './entities/Entity.js';
export { Actor } from './entities/Actor.js';
export { Component } from './entities/Component.js';

// Network
export { NetworkManager } from './network/NetworkManager.js';
export { RoomManager } from './network/RoomManager.js';

// Assets
export { AssetManager } from './assets/AssetManager.js';
export { LoadingScreen } from './assets/LoadingScreen.js';

// Input
export { InputManager } from './input/InputManager.js';

// Camera
export { CameraManager } from './camera/CameraManager.js';
export { ThirdPersonCamera } from './camera/ThirdPersonCamera.js';

// Configuration
export { 
  EngineDefaults, 
  EnginePresets,
  createEngineConfig,
  getPreset 
} from './config/EngineConfig.js';

// Utilities
export {
  MathUtils,
  VectorUtils,
  ColorUtils,
  Timer,
  ObjectPool,
  StateMachine,
  EventQueue,
  throttle,
  debounce,
  generateUUID,
  deepClone,
  isEmpty
} from './utils/EngineUtils.js';

// Graphics (Three.js abstraction)
export { MeshBuilder, Color } from './graphics/Mesh.js';
export { Vector3 } from './graphics/Vector3.js';

