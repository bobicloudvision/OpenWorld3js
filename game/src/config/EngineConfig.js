/**
 * Engine Configuration
 * Centralized configuration with defaults for any game type
 */

export const EngineDefaults = {
  // Renderer settings
  renderer: {
    antialias: true,
    shadowMapEnabled: true,
    shadowMapType: 'PCFSoftShadowMap', // PCFSoftShadowMap, BasicShadowMap, PCFShadowMap, VSMShadowMap
    pixelRatio: 1, // window.devicePixelRatio for automatic
    alpha: false,
    powerPreference: 'high-performance',
    outputColorSpace: 'srgb',
    toneMapping: 'ACESFilmic', // None, Linear, Reinhard, Cineon, ACESFilmic
    toneMappingExposure: 1.0
  },

  // Engine features (all optional)
  features: {
    networking: false,
    physics: false,
    audio: true,
    shadows: true
  },

  // Network settings (if networking enabled)
  network: {
    url: 'http://localhost:3000',
    autoConnect: false,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    timeout: 20000
  },

  // Time settings
  time: {
    timeScale: 1.0,
    fixedDelta: 1 / 60, // 60 FPS for physics
    maxDelta: 0.1 // Cap delta time to prevent spiral of death
  },

  // Input settings
  input: {
    enabled: true,
    preventDefault: true,
    pointerLock: false
  },

  // Camera settings
  camera: {
    fov: 75,
    near: 0.1,
    far: 1000,
    type: 'perspective' // 'perspective' or 'orthographic'
  },

  // Asset loading
  assets: {
    dracoDecoderPath: '/draco/',
    ktx2TranscoderPath: '/ktx2/',
    basePath: '/'
  },

  // Debug settings
  debug: {
    enabled: false,
    showStats: false,
    showGrid: false,
    showAxes: false,
    logEvents: false
  }
};

/**
 * Create engine configuration with defaults
 */
export function createEngineConfig(userConfig = {}) {
  return {
    canvas: userConfig.canvas || null,
    
    // Merge renderer settings
    ...EngineDefaults.renderer,
    ...(userConfig.renderer || {}),

    // Feature flags
    networking: userConfig.networking ?? EngineDefaults.features.networking,
    physics: userConfig.physics ?? EngineDefaults.features.physics,
    audio: userConfig.audio ?? EngineDefaults.features.audio,
    shadows: userConfig.shadowMapEnabled ?? EngineDefaults.features.shadows,

    // Network config (if needed)
    networkConfig: {
      ...EngineDefaults.network,
      ...(userConfig.networkConfig || {})
    },

    // Time config
    timeConfig: {
      ...EngineDefaults.time,
      ...(userConfig.timeConfig || {})
    },

    // Input config
    inputConfig: {
      ...EngineDefaults.input,
      ...(userConfig.inputConfig || {})
    },

    // Camera config
    cameraConfig: {
      ...EngineDefaults.camera,
      ...(userConfig.cameraConfig || {})
    },

    // Asset config
    assetConfig: {
      ...EngineDefaults.assets,
      ...(userConfig.assetConfig || {})
    },

    // Debug config
    debugConfig: {
      ...EngineDefaults.debug,
      ...(userConfig.debugConfig || {})
    }
  };
}

/**
 * Preset configurations for common game types
 */
export const EnginePresets = {
  // MMORPG preset
  mmorpg: {
    networking: true,
    physics: true,
    shadowMapEnabled: true,
    networkConfig: {
      autoConnect: true,
      reconnection: true
    }
  },

  // FPS preset
  fps: {
    networking: true,
    physics: true,
    shadowMapEnabled: true,
    inputConfig: {
      pointerLock: true
    },
    cameraConfig: {
      fov: 90
    }
  },

  // Racing preset
  racing: {
    networking: true,
    physics: true,
    shadowMapEnabled: true,
    renderer: {
      antialias: true,
      toneMapping: 'ACESFilmic'
    }
  },

  // Mobile preset
  mobile: {
    networking: false,
    physics: false,
    renderer: {
      antialias: false,
      pixelRatio: 1,
      shadowMapEnabled: false
    }
  },

  // Strategy/Top-down preset
  strategy: {
    networking: true,
    physics: false,
    shadowMapEnabled: false,
    cameraConfig: {
      type: 'orthographic'
    }
  },

  // Minimal preset (for testing/prototyping)
  minimal: {
    networking: false,
    physics: false,
    shadowMapEnabled: false,
    renderer: {
      antialias: false
    }
  }
};

/**
 * Get preset configuration
 */
export function getPreset(presetName) {
  const preset = EnginePresets[presetName];
  if (!preset) {
    console.warn(`Preset "${presetName}" not found. Using defaults.`);
    return {};
  }
  return preset;
}

