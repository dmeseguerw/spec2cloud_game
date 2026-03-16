/**
 * tests/scenes/BootScene.test.js
 * Unit tests for BootScene — loading screen & MenuScene transition (Task 002).
 *
 * Phaser.Scene is mocked globally by tests/mocks/setupPhaser.js (vitest setupFiles).
 * All Phaser display objects are replaced with MockGameObject stubs so tests run
 * in Node.js without a canvas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockGameObject } from '../mocks/PhaserMocks.js';
import { BootScene } from '../../src/scenes/BootScene.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Build a fresh BootScene instance with all required Phaser context stubbed.
 * Returns the scene together with references to key mock objects so tests can
 * inspect what the scene produced.
 */
function buildScene() {
  const scene = new BootScene();

  // Capture each text / rectangle object created so tests can inspect them
  const textObjects = [];
  const rectObjects = [];
  const loadCallbacks = {};  // event → callback

  const makeText = () => {
    const obj = new MockGameObject();
    textObjects.push(obj);
    return obj;
  };

  const makeRect = () => {
    const obj = Object.assign(new MockGameObject(), { width: 0 });
    rectObjects.push(obj);
    return obj;
  };

  const mockGraphics = {
    fillStyle: vi.fn(),
    fillRect: vi.fn(),
    generateTexture: vi.fn(),
    destroy: vi.fn(),
  };

  scene.scale    = { width: 1280, height: 720 };
  scene.add      = {
    text:      vi.fn().mockImplementation(makeText),
    rectangle: vi.fn().mockImplementation(makeRect),
  };
  scene.make     = { graphics: vi.fn().mockReturnValue(mockGraphics) };
  scene.textures = { exists: vi.fn().mockReturnValue(false) };
  scene.load     = {
    on: vi.fn().mockImplementation((event, cb) => { loadCallbacks[event] = cb; }),
  };
  scene.scene    = { start: vi.fn() };
  scene.cameras  = {
    main: {
      fadeOut: vi.fn().mockImplementation((_duration, _r, _g, _b, callback) => {
        if (callback) callback(scene.cameras.main, 1);
      }),
      fadeIn: vi.fn().mockImplementation((_duration, _r, _g, _b, callback) => {
        if (callback) callback(scene.cameras.main, 1);
      }),
    },
  };

  return { scene, textObjects, rectObjects, loadCallbacks, mockGraphics };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('BootScene', () => {
  describe('constructor', () => {
    it('uses "BootScene" as the scene key', () => {
      const { scene } = buildScene();
      expect(scene._config.key).toBe('BootScene');
    });
  });

  // ── create() ─────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('transitions to MenuScene via fade', () => {
      const { scene } = buildScene();
      scene.create();
      expect(scene.cameras.main.fadeOut).toHaveBeenCalled();
      // The fade callback triggers scene.start('MenuScene')
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene', {});
    });

    it('only calls fadeOut once', () => {
      const { scene } = buildScene();
      scene.create();
      expect(scene.cameras.main.fadeOut).toHaveBeenCalledTimes(1);
    });
  });

  // ── preload() ─────────────────────────────────────────────────────────────

  describe('preload()', () => {
    it('adds the game title text to the scene', () => {
      const { scene } = buildScene();
      scene.preload();
      const titles = scene.add.text.mock.calls.filter(([, , text]) => text === 'Denmark Survival');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('adds a loading label text to the scene', () => {
      const { scene } = buildScene();
      scene.preload();
      const labels = scene.add.text.mock.calls.filter(([, , text]) => /loading/i.test(text));
      expect(labels.length).toBeGreaterThan(0);
    });

    it('adds a progress bar rectangle', () => {
      const { scene } = buildScene();
      scene.preload();
      expect(scene.add.rectangle).toHaveBeenCalled();
    });

    it('registers a "progress" loader event listener', () => {
      const { scene, loadCallbacks } = buildScene();
      scene.preload();
      expect(typeof loadCallbacks['progress']).toBe('function');
    });

    it('registers a "complete" loader event listener', () => {
      const { scene, loadCallbacks } = buildScene();
      scene.preload();
      expect(typeof loadCallbacks['complete']).toBe('function');
    });

    it('progress callback sets progressBar.width proportionally', () => {
      const { scene, rectObjects, loadCallbacks } = buildScene();
      scene.preload();

      // The second rectangle added is the progress bar (origin 0,0)
      const progressBar = rectObjects[1];
      loadCallbacks['progress'](0.5);
      expect(progressBar.width).toBe(400 * 0.5);
    });

    it('progress callback updates percentage text', () => {
      const { scene, textObjects, loadCallbacks } = buildScene();
      scene.preload();

      // The third text object is the percentage counter
      const percentText = textObjects[2];
      loadCallbacks['progress'](0.75);
      expect(percentText.text).toBe('75%');
    });

    it('complete callback sets percentage text to "100%"', () => {
      const { scene, textObjects, loadCallbacks } = buildScene();
      scene.preload();

      const percentText = textObjects[2];
      loadCallbacks['complete']();
      expect(percentText.text).toBe('100%');
    });

    it('complete callback fills the progress bar to full width', () => {
      const { scene, rectObjects, loadCallbacks } = buildScene();
      scene.preload();

      const progressBar = rectObjects[1];
      loadCallbacks['complete']();
      expect(progressBar.width).toBe(400);
    });

    it('calls _createPlaceholderTextures', () => {
      const { scene } = buildScene();
      const spy = vi.spyOn(scene, '_createPlaceholderTextures');
      scene.preload();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ── _createPlaceholderTextures() ─────────────────────────────────────────

  describe('_createPlaceholderTextures()', () => {
    it('creates graphics objects for placeholder textures', () => {
      const { scene } = buildScene();
      scene._createPlaceholderTextures();
      expect(scene.make.graphics).toHaveBeenCalled();
    });

    it('calls generateTexture for each placeholder', () => {
      const { scene, mockGraphics } = buildScene();
      scene._createPlaceholderTextures();
      expect(mockGraphics.generateTexture).toHaveBeenCalled();
    });

    it('destroys each graphics object after generating the texture', () => {
      const { scene, mockGraphics } = buildScene();
      scene._createPlaceholderTextures();
      expect(mockGraphics.destroy).toHaveBeenCalled();
    });

    it('skips textures that already exist in the texture cache', () => {
      const { scene, mockGraphics } = buildScene();
      scene.textures.exists.mockReturnValue(true);
      scene._createPlaceholderTextures();
      expect(mockGraphics.generateTexture).not.toHaveBeenCalled();
    });

    it('does not throw when graphics creation fails', () => {
      const { scene } = buildScene();
      scene.make.graphics.mockImplementation(() => { throw new Error('Canvas unavailable'); });
      expect(() => scene._createPlaceholderTextures()).not.toThrow();
    });
  });
});
