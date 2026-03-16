/**
 * tests/mocks/PhaserMocks.test.js
 * Meta-tests verifying that mock utilities behave correctly.
 */

import { describe, it, expect, vi } from 'vitest';
import { MockRegistry, MockScene, MockGameObject, MockLocalStorage } from './PhaserMocks.js';

describe('MockRegistry', () => {
  it('stores and retrieves values', () => {
    const registry = new MockRegistry();
    registry.set('key1', 'value1');
    expect(registry.get('key1')).toBe('value1');
  });

  it('returns undefined for missing keys', () => {
    const registry = new MockRegistry();
    expect(registry.get('missing')).toBeUndefined();
  });

  it('emits changedata-{key} event on set', () => {
    const registry = new MockRegistry();
    const handler = vi.fn();
    registry.events.on('changedata-xp', handler);
    registry.set('xp', 100);
    expect(handler).toHaveBeenCalledWith(registry, 'xp', 100, undefined);
  });

  it('emits changedata event on set', () => {
    const registry = new MockRegistry();
    const handler = vi.fn();
    registry.events.on('changedata', handler);
    registry.set('hp', 50);
    expect(handler).toHaveBeenCalledWith(registry, 'hp', 50, undefined);
  });

  it('passes previous value on change event', () => {
    const registry = new MockRegistry();
    registry.set('hp', 100);
    const handler = vi.fn();
    registry.events.on('changedata-hp', handler);
    registry.set('hp', 80);
    expect(handler).toHaveBeenCalledWith(registry, 'hp', 80, 100);
  });

  it('has() returns correct boolean', () => {
    const registry = new MockRegistry();
    expect(registry.has('key')).toBe(false);
    registry.set('key', 'value');
    expect(registry.has('key')).toBe(true);
  });

  it('remove() deletes key and emits event', () => {
    const registry = new MockRegistry();
    registry.set('key', 'value');
    const handler = vi.fn();
    registry.events.on('removedata-key', handler);
    registry.remove('key');
    expect(registry.has('key')).toBe(false);
    expect(handler).toHaveBeenCalled();
  });

  it('getAll() returns all data as an object', () => {
    const registry = new MockRegistry();
    registry.set('a', 1);
    registry.set('b', 2);
    expect(registry.getAll()).toEqual({ a: 1, b: 2 });
  });

  it('reset() clears all data and listeners', () => {
    const registry = new MockRegistry();
    registry.set('key', 'value');
    registry.events.on('test', () => {});
    registry.reset();
    expect(registry.has('key')).toBe(false);
    expect(registry.events.listenerCount('test')).toBe(0);
  });
});

describe('MockScene', () => {
  it('creates with default key', () => {
    const scene = new MockScene();
    expect(scene.key).toBe('TestScene');
  });

  it('creates with custom key', () => {
    const scene = new MockScene('CustomScene');
    expect(scene.key).toBe('CustomScene');
  });

  it('has a working registry', () => {
    const scene = new MockScene();
    scene.registry.set('test', 42);
    expect(scene.registry.get('test')).toBe(42);
  });

  it('has scene management methods', () => {
    const scene = new MockScene();
    expect(typeof scene.scene.start).toBe('function');
    expect(typeof scene.scene.launch).toBe('function');
    expect(typeof scene.scene.stop).toBe('function');
    expect(typeof scene.scene.pause).toBe('function');
    expect(typeof scene.scene.resume).toBe('function');
  });

  it('has camera methods', () => {
    const scene = new MockScene();
    expect(typeof scene.cameras.main.fade).toBe('function');
    expect(typeof scene.cameras.main.fadeIn).toBe('function');
    expect(typeof scene.cameras.main.fadeOut).toBe('function');
  });

  it('has add methods', () => {
    const scene = new MockScene();
    expect(typeof scene.add.text).toBe('function');
    expect(typeof scene.add.image).toBe('function');
    expect(typeof scene.add.sprite).toBe('function');
    expect(typeof scene.add.rectangle).toBe('function');
  });

  it('has scale dimensions', () => {
    const scene = new MockScene();
    expect(scene.scale.width).toBe(1280);
    expect(scene.scale.height).toBe(720);
  });
});

describe('MockGameObject', () => {
  it('setPosition updates x and y', () => {
    const obj = new MockGameObject();
    obj.setPosition(10, 20);
    expect(obj.x).toBe(10);
    expect(obj.y).toBe(20);
  });

  it('setVisible updates visibility', () => {
    const obj = new MockGameObject();
    obj.setVisible(false);
    expect(obj.visible).toBe(false);
  });

  it('setText updates text', () => {
    const obj = new MockGameObject();
    obj.setText('Hello');
    expect(obj.text).toBe('Hello');
  });

  it('methods return this for chaining', () => {
    const obj = new MockGameObject();
    const result = obj.setPosition(0, 0).setVisible(true).setText('test').setAlpha(0.5);
    expect(result).toBe(obj);
  });

  it('setAlpha updates alpha', () => {
    const obj = new MockGameObject();
    obj.setAlpha(0.5);
    expect(obj.alpha).toBe(0.5);
  });

  it('setDepth updates depth', () => {
    const obj = new MockGameObject();
    obj.setDepth(10);
    expect(obj.depth).toBe(10);
  });
});

describe('MockLocalStorage', () => {
  it('setItem and getItem work correctly', () => {
    const storage = new MockLocalStorage();
    storage.setItem('key', 'value');
    expect(storage.getItem('key')).toBe('value');
  });

  it('getItem returns null for missing keys', () => {
    const storage = new MockLocalStorage();
    expect(storage.getItem('missing')).toBeNull();
  });

  it('setItem converts values to strings', () => {
    const storage = new MockLocalStorage();
    storage.setItem('num', 42);
    expect(storage.getItem('num')).toBe('42');
  });

  it('removeItem removes a key', () => {
    const storage = new MockLocalStorage();
    storage.setItem('key', 'value');
    storage.removeItem('key');
    expect(storage.getItem('key')).toBeNull();
  });

  it('clear removes all keys', () => {
    const storage = new MockLocalStorage();
    storage.setItem('a', '1');
    storage.setItem('b', '2');
    storage.clear();
    expect(storage.length).toBe(0);
    expect(storage.getItem('a')).toBeNull();
  });

  it('length returns correct count', () => {
    const storage = new MockLocalStorage();
    expect(storage.length).toBe(0);
    storage.setItem('a', '1');
    expect(storage.length).toBe(1);
    storage.setItem('b', '2');
    expect(storage.length).toBe(2);
  });

  it('key() returns key at index', () => {
    const storage = new MockLocalStorage();
    storage.setItem('first', '1');
    storage.setItem('second', '2');
    expect(storage.key(0)).toBe('first');
    expect(storage.key(1)).toBe('second');
    expect(storage.key(99)).toBeNull();
  });
});
