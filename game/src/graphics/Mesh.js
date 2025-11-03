import * as THREE from 'three';

/**
 * Mesh Builder
 * High-level mesh creation without exposing Three.js
 */
export class MeshBuilder {
  /**
   * Create a box mesh
   */
  static createBox(options = {}) {
    const {
      width = 1,
      height = 1,
      depth = 1,
      color = 0xffffff,
      wireframe = false,
      castShadow = true,
      receiveShadow = false
    } = options;

    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      wireframe 
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
  }

  /**
   * Create a sphere mesh
   */
  static createSphere(options = {}) {
    const {
      radius = 1,
      widthSegments = 32,
      heightSegments = 32,
      color = 0xffffff,
      wireframe = false,
      castShadow = true,
      receiveShadow = false,
      useNormalMaterial = false // Use MeshNormalMaterial instead of MeshStandardMaterial
    } = options;

    const geometry = new THREE.SphereGeometry(radius, widthSegments, heightSegments);
    
    let material;
    if (useNormalMaterial) {
      material = new THREE.MeshNormalMaterial();
    } else {
      material = new THREE.MeshStandardMaterial({ 
        color, 
        wireframe 
      });
    }

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
  }

  /**
   * Create a cylinder mesh
   */
  static createCylinder(options = {}) {
    const {
      radiusTop = 1,
      radiusBottom = 1,
      height = 1,
      radialSegments = 32,
      color = 0xffffff,
      wireframe = false,
      castShadow = true,
      receiveShadow = false,
      emissive = 0x000000,
      emissiveIntensity = 1
    } = options;

    const geometry = new THREE.CylinderGeometry(
      radiusTop, 
      radiusBottom, 
      height, 
      radialSegments
    );
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      wireframe,
      emissive,
      emissiveIntensity
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
  }

  /**
   * Create a plane mesh
   */
  static createPlane(options = {}) {
    const {
      width = 1,
      height = 1,
      widthSegments = 1,
      heightSegments = 1,
      color = 0xffffff,
      wireframe = false,
      castShadow = false,
      receiveShadow = true,
      rotateX = 0
    } = options;

    const geometry = new THREE.PlaneGeometry(
      width, 
      height, 
      widthSegments, 
      heightSegments
    );
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      wireframe 
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    if (rotateX !== 0) {
      mesh.rotation.x = rotateX;
    }

    return mesh;
  }

  /**
   * Create a capsule mesh
   */
  static createCapsule(options = {}) {
    const {
      radius = 1,
      length = 1,
      color = 0xffffff,
      wireframe = false,
      castShadow = true,
      receiveShadow = false
    } = options;

    const geometry = new THREE.CapsuleGeometry(radius, length);
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      wireframe 
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
  }

  /**
   * Create a torus mesh
   */
  static createTorus(options = {}) {
    const {
      radius = 1,
      tube = 0.4,
      radialSegments = 16,
      tubularSegments = 100,
      color = 0xffffff,
      wireframe = false,
      castShadow = true,
      receiveShadow = false
    } = options;

    const geometry = new THREE.TorusGeometry(
      radius, 
      tube, 
      radialSegments, 
      tubularSegments
    );
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      wireframe 
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
  }

  /**
   * Create a cone mesh
   */
  static createCone(options = {}) {
    const {
      radius = 1,
      height = 1,
      radialSegments = 32,
      color = 0xffffff,
      wireframe = false,
      castShadow = true,
      receiveShadow = false
    } = options;

    const geometry = new THREE.ConeGeometry(radius, height, radialSegments);
    const material = new THREE.MeshStandardMaterial({ 
      color, 
      wireframe 
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
  }

  /**
   * Create a grid helper
   */
  static createGrid(options = {}) {
    const {
      size = 100,
      divisions = 10,
      color = 0x444444,
      centerLineColor = 0x888888
    } = options;

    const grid = new THREE.GridHelper(size, divisions, centerLineColor, color);
    return grid;
  }

  /**
   * Create an axes helper
   */
  static createAxesHelper(options = {}) {
    const {
      size = 1
    } = options;

    return new THREE.AxesHelper(size);
  }

  /**
   * Create a mesh with MeshNormalMaterial (for debugging/visualization)
   */
  static createNormalMaterialMesh(options = {}) {
    const {
      geometry,
      color = null // If provided, uses MeshStandardMaterial instead
    } = options;

    if (!geometry) {
      console.warn('MeshBuilder.createNormalMaterialMesh: geometry is required');
      return null;
    }

    const material = color !== null 
      ? new THREE.MeshStandardMaterial({ color })
      : new THREE.MeshNormalMaterial();
    
    return new THREE.Mesh(geometry, material);
  }

  /**
   * Create a ground plane with random height variation
   */
  static createTerrain(options = {}) {
    const {
      width = 100,
      height = 100,
      widthSegments = 50,
      heightSegments = 50,
      color = 0x3a8c3a,
      heightVariation = 0.5,
      castShadow = false,
      receiveShadow = true
    } = options;

    const geometry = new THREE.PlaneGeometry(
      width,
      height,
      widthSegments,
      heightSegments
    );

    // Add random height variation
    const positions = geometry.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const y = Math.random() * heightVariation;
      positions.setY(i, y);
    }
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({ 
      color,
      roughness: 0.8
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    mesh.castShadow = castShadow;
    mesh.receiveShadow = receiveShadow;

    return mesh;
  }
}

/**
 * Color helper
 */
export class Color {
  // Common colors
  static WHITE = 0xffffff;
  static BLACK = 0x000000;
  static RED = 0xff0000;
  static GREEN = 0x00ff00;
  static BLUE = 0x0000ff;
  static YELLOW = 0xffff00;
  static CYAN = 0x00ffff;
  static MAGENTA = 0xff00ff;
  static ORANGE = 0xff8800;
  static PURPLE = 0x8800ff;
  static PINK = 0xff0088;
  
  // Terrain colors
  static GRASS = 0x3a8c3a;
  static DIRT = 0x8b4513;
  static STONE = 0x808080;
  static SAND = 0xf4a460;
  static WATER = 0x0077be;
  
  // UI colors
  static SKY_BLUE = 0x87ceeb;
  static DARK_GRAY = 0x333333;
  static LIGHT_GRAY = 0xcccccc;

  /**
   * Create color from RGB (0-255)
   */
  static fromRGB(r, g, b) {
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Create random color
   */
  static random() {
    return Math.floor(Math.random() * 0xffffff);
  }
}

