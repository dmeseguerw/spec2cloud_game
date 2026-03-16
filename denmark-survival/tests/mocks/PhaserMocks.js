/**
 * tests/mocks/PhaserMocks.js
 * Mock implementations for Phaser objects used in unit testing.
 * These mocks allow testing game logic without a running browser/canvas.
 */

import { EventEmitter } from 'node:events';

/**
 * MockRegistry — Mimics Phaser.Data.DataManager
 * Stores data in a plain JS Map and emits changedata-{key} events on set.
 */
export class MockRegistry {
  constructor() {
    this._data = new Map();
    this.events = new EventEmitter();
  }

  get(key) {
    return this._data.get(key);
  }

  set(key, value) {
    const prev = this._data.get(key);
    this._data.set(key, value);
    this.events.emit(`changedata-${key}`, this, key, value, prev);
    this.events.emit('changedata', this, key, value, prev);
    return this;
  }

  has(key) {
    return this._data.has(key);
  }

  remove(key) {
    const value = this._data.get(key);
    this._data.delete(key);
    this.events.emit(`removedata-${key}`, this, key, value);
    return this;
  }

  getAll() {
    return Object.fromEntries(this._data);
  }

  reset() {
    this._data.clear();
    this.events.removeAllListeners();
    return this;
  }
}

/**
 * MockScene — Mimics Phaser.Scene
 * Has registry, scene management methods, and cameras.
 */
export class MockScene {
  constructor(key = 'TestScene') {
    this.key = key;
    this.registry = new MockRegistry();
    this.events = new EventEmitter();
    this.scene = {
      key,
      start: (sceneKey, data) => ({ sceneKey, data }),
      launch: (sceneKey, data) => ({ sceneKey, data }),
      stop: (sceneKey) => ({ sceneKey }),
      pause: (sceneKey) => ({ sceneKey }),
      resume: (sceneKey) => ({ sceneKey }),
      get: (sceneKey) => new MockScene(sceneKey),
    };
    this.cameras = {
      main: {
        fade: (duration, r, g, b, force, callback) => { if (callback) callback(); },
        fadeIn: (duration, r, g, b, callback) => { if (callback) callback(); },
        fadeOut: (duration, r, g, b, callback) => { if (callback) callback(); },
        setBackgroundColor: () => {},
      },
    };
    this.add = {
      text: () => new MockGameObject(),
      image: () => new MockGameObject(),
      sprite: () => new MockGameObject(),
      rectangle: () => new MockGameObject(),
      container: () => new MockGameObject(),
      graphics: () => ({ fillStyle: () => {}, fillRect: () => {}, generateTexture: () => {}, destroy: () => {} }),
    };
    this.make = {
      graphics: () => ({ fillStyle: () => {}, fillRect: () => {}, generateTexture: () => {}, destroy: () => {} }),
    };
    this.textures = {
      exists: () => false,
    };
    this.load = {
      on: () => {},
      image: () => {},
      spritesheet: () => {},
      audio: () => {},
      tilemapTiledJSON: () => {},
    };
    this.sound = {
      add: () => ({ play: () => {}, stop: () => {}, destroy: () => {} }),
    };
    this.input = {
      keyboard: {
        createCursorKeys: () => ({
          up: { isDown: false },
          down: { isDown: false },
          left: { isDown: false },
          right: { isDown: false },
        }),
        addKey: () => ({ isDown: false, on: () => {} }),
      },
    };
    this.scale = { width: 1280, height: 720 };
  }
}

/**
 * MockGameObject — Mimics basic Phaser game objects.
 */
export class MockGameObject {
  constructor() {
    this.x = 0;
    this.y = 0;
    this.visible = true;
    this.text = '';
    this.alpha = 1;
    this.depth = 0;
  }

  setPosition(x, y) { this.x = x; this.y = y; return this; }
  setVisible(visible) { this.visible = visible; return this; }
  setText(text) { this.text = text; return this; }
  setOrigin() { return this; }
  setAlpha(alpha) { this.alpha = alpha; return this; }
  setDepth(depth) { this.depth = depth; return this; }
  setScale() { return this; }
  setInteractive() { return this; }
  setScrollFactor() { return this; }
  setTint() { return this; }
  on() { return this; }
  destroy() {}
}

/**
 * MockLocalStorage — In-memory localStorage mock for save/load testing.
 */
export class MockLocalStorage {
  constructor() {
    this._store = new Map();
  }

  getItem(key) {
    return this._store.has(key) ? this._store.get(key) : null;
  }

  setItem(key, value) {
    this._store.set(key, String(value));
  }

  removeItem(key) {
    this._store.delete(key);
  }

  clear() {
    this._store.clear();
  }

  get length() {
    return this._store.size;
  }

  key(index) {
    return [...this._store.keys()][index] ?? null;
  }
}
