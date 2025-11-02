import { GameObject } from './GameObject.js';
import { MeshBuilder } from '../graphics/Mesh.js';
import * as THREE from 'three';

/**
 * GameObject Factory
 * Unity-inspired factory for creating GameObjects easily
 * 
 * Example:
 *   const player = GameObjectFactory.createCube({ name: 'Player', color: 0xff0000 });
 *   const enemy = GameObjectFactory.createSphere({ name: 'Enemy', radius: 2 });
 */
export class GameObjectFactory {
  /**
   * Create an empty GameObject
   */
  static createEmpty(config = {}) {
    return new GameObject(config);
  }

  /**
   * Create a GameObject with a box mesh
   */
  static createCube(config = {}) {
    const go = new GameObject({
      name: config.name || 'Cube',
      ...config
    });

    go.mesh = MeshBuilder.createBox({
      width: config.width || 1,
      height: config.height || 1,
      depth: config.depth || 1,
      color: config.color || 0xcccccc,
      castShadow: config.castShadow !== undefined ? config.castShadow : true,
      receiveShadow: config.receiveShadow !== undefined ? config.receiveShadow : true
    });

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a GameObject with a sphere mesh
   */
  static createSphere(config = {}) {
    const go = new GameObject({
      name: config.name || 'Sphere',
      ...config
    });

    go.mesh = MeshBuilder.createSphere({
      radius: config.radius || 1,
      color: config.color || 0xcccccc,
      castShadow: config.castShadow !== undefined ? config.castShadow : true,
      receiveShadow: config.receiveShadow !== undefined ? config.receiveShadow : true
    });

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a GameObject with a cylinder mesh
   */
  static createCylinder(config = {}) {
    const go = new GameObject({
      name: config.name || 'Cylinder',
      ...config
    });

    go.mesh = MeshBuilder.createCylinder({
      radiusTop: config.radiusTop || 1,
      radiusBottom: config.radiusBottom || 1,
      height: config.height || 2,
      color: config.color || 0xcccccc,
      castShadow: config.castShadow !== undefined ? config.castShadow : true,
      receiveShadow: config.receiveShadow !== undefined ? config.receiveShadow : true
    });

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a GameObject with a capsule mesh
   */
  static createCapsule(config = {}) {
    const go = new GameObject({
      name: config.name || 'Capsule',
      ...config
    });

    go.mesh = MeshBuilder.createCapsule({
      radius: config.radius || 0.5,
      height: config.height || 2,
      color: config.color || 0xcccccc,
      castShadow: config.castShadow !== undefined ? config.castShadow : true,
      receiveShadow: config.receiveShadow !== undefined ? config.receiveShadow : true
    });

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a GameObject with a plane mesh
   */
  static createPlane(config = {}) {
    const go = new GameObject({
      name: config.name || 'Plane',
      ...config
    });

    go.mesh = MeshBuilder.createPlane({
      width: config.width || 10,
      height: config.height || 10,
      color: config.color || 0xcccccc,
      castShadow: config.castShadow !== undefined ? config.castShadow : false,
      receiveShadow: config.receiveShadow !== undefined ? config.receiveShadow : true
    });

    // Default rotation for ground plane
    if (config.isGround !== false) {
      go.mesh.rotation.x = -Math.PI / 2;
    }

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a 3D Text GameObject (requires TextGeometry from Three.js examples)
   */
  static createText(text, config = {}) {
    const go = new GameObject({
      name: config.name || 'Text',
      ...config
    });

    // Note: TextGeometry requires loading a font
    // This is a placeholder - implement based on your needs
    go.text = text;
    go.textConfig = config;

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a light GameObject
   */
  static createLight(type = 'point', config = {}) {
    const go = new GameObject({
      name: config.name || `${type}Light`,
      ...config
    });

    switch (type.toLowerCase()) {
      case 'point':
        go.mesh = new THREE.PointLight(
          config.color || 0xffffff,
          config.intensity || 1,
          config.distance || 0,
          config.decay || 2
        );
        break;

      case 'directional':
        go.mesh = new THREE.DirectionalLight(
          config.color || 0xffffff,
          config.intensity || 1
        );
        if (config.castShadow) {
          go.mesh.castShadow = true;
        }
        break;

      case 'spot':
        go.mesh = new THREE.SpotLight(
          config.color || 0xffffff,
          config.intensity || 1,
          config.distance || 0,
          config.angle || Math.PI / 3,
          config.penumbra || 0,
          config.decay || 2
        );
        if (config.castShadow) {
          go.mesh.castShadow = true;
        }
        break;

      case 'ambient':
        go.mesh = new THREE.AmbientLight(
          config.color || 0xffffff,
          config.intensity || 1
        );
        break;
    }

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a camera GameObject
   */
  static createCamera(config = {}) {
    const go = new GameObject({
      name: config.name || 'Camera',
      ...config
    });

    const aspect = config.aspect || window.innerWidth / window.innerHeight;
    go.mesh = new THREE.PerspectiveCamera(
      config.fov || 75,
      aspect,
      config.near || 0.1,
      config.far || 1000
    );

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a GameObject from a loaded model/GLTF
   */
  static createFromModel(model, config = {}) {
    const go = new GameObject({
      name: config.name || 'Model',
      ...config
    });

    go.mesh = model.scene || model;

    if (config.position) {
      go.setPosition(config.position);
    }

    if (config.scale) {
      go.setScale(config.scale);
    }

    return go;
  }

  /**
   * Create a group GameObject (like an empty with multiple children)
   */
  static createGroup(config = {}) {
    const go = new GameObject({
      name: config.name || 'Group',
      ...config
    });

    go.mesh = new THREE.Group();

    if (config.children && Array.isArray(config.children)) {
      config.children.forEach(child => {
        go.addChild(child);
        if (child.mesh) {
          go.mesh.add(child.mesh);
        }
      });
    }

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Create a particle system GameObject
   */
  static createParticleSystem(config = {}) {
    const go = new GameObject({
      name: config.name || 'ParticleSystem',
      ...config
    });

    // Placeholder for particle system
    // Implement based on your particle system needs
    go.particleConfig = config;

    if (config.position) {
      go.setPosition(config.position);
    }

    return go;
  }

  /**
   * Builder pattern - start building a GameObject
   */
  static builder() {
    return new GameObjectBuilder();
  }
}

/**
 * GameObject Builder - Fluent API for building GameObjects
 * 
 * Example:
 *   const player = GameObjectFactory.builder()
 *     .name('Player')
 *     .withMesh(MeshBuilder.createSphere({ radius: 1 }))
 *     .at(0, 5, 0)
 *     .withTag('player')
 *     .withComponent(new HealthComponent(100))
 *     .withComponent(new CombatComponent())
 *     .build();
 */
class GameObjectBuilder {
  constructor() {
    this.config = {};
    this._mesh = null;
    this._position = null;
    this._rotation = null;
    this._scale = null;
    this._components = [];
    this._children = [];
  }

  name(name) {
    this.config.name = name;
    return this;
  }

  type(type) {
    this.config.type = type;
    return this;
  }

  withTag(tag) {
    if (!this.config.tags) {
      this.config.tags = [];
    }
    this.config.tags.push(tag);
    return this;
  }

  withTags(...tags) {
    this.config.tags = tags;
    return this;
  }

  withMesh(mesh) {
    this._mesh = mesh;
    return this;
  }

  at(x, y, z) {
    this._position = { x, y, z };
    return this;
  }

  atPosition(position) {
    this._position = position;
    return this;
  }

  withRotation(x, y, z) {
    this._rotation = { x, y, z };
    return this;
  }

  withScale(x, y, z) {
    if (y === undefined) {
      this._scale = { x, y: x, z: x };
    } else {
      this._scale = { x, y, z };
    }
    return this;
  }

  withComponent(componentOrClass, config = {}) {
    this._components.push({ componentOrClass, config });
    return this;
  }

  withChild(child) {
    this._children.push(child);
    return this;
  }

  withSpeed(speed) {
    this.config.speed = speed;
    return this;
  }

  withPhysics(physicsConfig) {
    this._physicsConfig = physicsConfig;
    return this;
  }

  build() {
    const go = new GameObject(this.config);

    if (this._mesh) {
      go.mesh = this._mesh;
    }

    if (this._position) {
      go.setPosition(this._position.x, this._position.y, this._position.z);
    }

    if (this._rotation) {
      go.setRotation(this._rotation.x, this._rotation.y, this._rotation.z);
    }

    if (this._scale) {
      go.setScale(this._scale.x, this._scale.y, this._scale.z);
    }

    // Add components
    for (const { componentOrClass, config } of this._components) {
      go.addComponent(componentOrClass, config);
    }

    // Add children
    for (const child of this._children) {
      go.addChild(child);
    }

    return go;
  }
}

