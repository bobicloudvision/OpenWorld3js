import * as THREE from 'three';

/**
 * Vector3 wrapper
 * Abstracts Three.js Vector3 from game code
 */
export class Vector3 {
  constructor(x = 0, y = 0, z = 0) {
    this._vector = new THREE.Vector3(x, y, z);
  }

  // Static constructors
  static zero() {
    return new Vector3(0, 0, 0);
  }

  static one() {
    return new Vector3(1, 1, 1);
  }

  static up() {
    return new Vector3(0, 1, 0);
  }

  static down() {
    return new Vector3(0, -1, 0);
  }

  static left() {
    return new Vector3(-1, 0, 0);
  }

  static right() {
    return new Vector3(1, 0, 0);
  }

  static forward() {
    return new Vector3(0, 0, -1);
  }

  static backward() {
    return new Vector3(0, 0, 1);
  }

  // Getters
  get x() { return this._vector.x; }
  get y() { return this._vector.y; }
  get z() { return this._vector.z; }

  // Setters
  set x(value) { this._vector.x = value; }
  set y(value) { this._vector.y = value; }
  set z(value) { this._vector.z = value; }

  // Methods
  set(x, y, z) {
    this._vector.set(x, y, z);
    return this;
  }

  copy(v) {
    this._vector.copy(v._vector || v);
    return this;
  }

  clone() {
    return new Vector3(this.x, this.y, this.z);
  }

  add(v) {
    this._vector.add(v._vector || v);
    return this;
  }

  subtract(v) {
    this._vector.sub(v._vector || v);
    return this;
  }

  multiply(scalar) {
    this._vector.multiplyScalar(scalar);
    return this;
  }

  normalize() {
    this._vector.normalize();
    return this;
  }

  length() {
    return this._vector.length();
  }

  distanceTo(v) {
    return this._vector.distanceTo(v._vector || v);
  }

  lerp(v, alpha) {
    this._vector.lerp(v._vector || v, alpha);
    return this;
  }

  addScaledVector(v, scale) {
    this._vector.addScaledVector(v._vector || v, scale);
    return this;
  }

  // Get internal Three.js vector (for engine use only)
  _getThreeVector() {
    return this._vector;
  }
}

