/**
 * tests/scenes/SettingsScene.test.js
 * Unit tests for SettingsScene — settings persistence, volume clamping,
 * accessibility toggles, and close behaviour.
 *
 * Phaser.Scene is mocked globally via tests/mocks/setupPhaser.js.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry, MockLocalStorage, MockGameObject } from '../mocks/PhaserMocks.js';
import { SettingsScene } from '../../src/scenes/SettingsScene.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeObj() {
  const obj = new MockGameObject();
  obj.setOrigin      = vi.fn().mockReturnThis();
  obj.setDepth       = vi.fn().mockReturnThis();
  obj.setInteractive = vi.fn().mockReturnThis();
  obj.setStyle       = vi.fn().mockReturnThis();
  obj.setFillStyle   = vi.fn().mockReturnThis();
  obj.setScrollFactor = vi.fn().mockReturnThis();
  obj.setText        = vi.fn().mockImplementation(function (t) { this.text = t; return this; });
  obj.setVisible     = vi.fn().mockImplementation(function (v) { this.visible = v; return this; });
  obj.on             = vi.fn().mockReturnThis();
  obj.destroy        = vi.fn();
  return obj;
}

/**
 * Build a SettingsScene with a fresh registry + storage.
 * @param {object} [opts]
 * @param {boolean} [opts.asOverlay] - Whether to mark the scene as an overlay.
 */
function buildScene({ asOverlay = false } = {}) {
  const scene    = new SettingsScene();
  const storage  = new MockLocalStorage();
  const registry = new MockRegistry();

  // Pre-set default volume registry values
  registry.set(RK.VOLUME_MASTER, 0.8);
  registry.set(RK.VOLUME_MUSIC,  0.6);
  registry.set(RK.VOLUME_SFX,    0.8);
  registry.set(RK.DIFFICULTY,    'normal');
  registry.set(RK.TUTORIAL_COMPLETED, false);

  scene.scale    = { width: 1280, height: 720 };
  scene.registry = registry;
  scene.add      = {
    text:      vi.fn().mockImplementation(makeObj),
    rectangle: vi.fn().mockImplementation(makeObj),
  };
  scene.cameras  = {
    main: {
      fadeIn:  vi.fn().mockImplementation((_d, _r, _g, _b, cb) => { if (cb) cb(null, 1); }),
      fadeOut: vi.fn().mockImplementation((_d, _r, _g, _b, cb) => { if (cb) cb(null, 1); }),
    },
  };
  scene.scene    = {
    key:    'SettingsScene',
    start:  vi.fn(),
    launch: vi.fn(),
    stop:   vi.fn(),
    pause:  vi.fn(),
    resume: vi.fn(),
  };
  scene.input    = {
    keyboard: { addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }) },
    enabled: true,
  };

  if (asOverlay) {
    scene._isOverlay       = true;
    scene._parentSceneKey  = 'MenuScene';
  }

  return { scene, storage, registry };
}

/**
 * Call init + create on the scene, injecting storage.
 */
function initAndCreate(scene, storage) {
  scene.init({ storage });
  scene.create();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SettingsScene', () => {
  describe('constructor', () => {
    it('uses "SettingsScene" as the scene key', () => {
      const { scene } = buildScene();
      expect(scene._config.key).toBe('SettingsScene');
    });

    it('initialises default settings', () => {
      const { scene } = buildScene();
      const s = scene.getSettings();
      expect(s.masterVolume).toBe(0.8);
      expect(s.musicVolume).toBe(0.6);
      expect(s.sfxVolume).toBe(0.8);
      expect(s.muted).toBe(false);
      expect(s.difficulty).toBe('normal');
    });
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('renders the "Settings" title text', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const titleCall = scene.add.text.mock.calls.find(([, , text]) => text === 'Settings');
      expect(titleCall).toBeDefined();
    });

    it('loads settings from registry on create()', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.VOLUME_MASTER, 0.5);
      initAndCreate(scene, storage);
      expect(scene.getSettings().masterVolume).toBeCloseTo(0.5);
    });

    it('creates overlay background when launched as overlay', () => {
      const { scene, storage } = buildScene({ asOverlay: true });
      const spy = vi.spyOn(scene, 'createOverlayBackground');
      initAndCreate(scene, storage);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('does NOT create overlay background when not an overlay', () => {
      const { scene, storage } = buildScene({ asOverlay: false });
      const spy = vi.spyOn(scene, 'createOverlayBackground');
      initAndCreate(scene, storage);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  // ── Volume setters ────────────────────────────────────────────────────────

  describe('setMasterVolume()', () => {
    it('clamps values above 1 to 1', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setMasterVolume(2.5);
      expect(scene.getSettings().masterVolume).toBe(1);
    });

    it('clamps values below 0 to 0', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setMasterVolume(-0.5);
      expect(scene.getSettings().masterVolume).toBe(0);
    });

    it('stores the value in the registry', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);
      scene.setMasterVolume(0.4);
      expect(registry.get(RK.VOLUME_MASTER)).toBeCloseTo(0.4);
    });

    it('persists to localStorage', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setMasterVolume(0.4);
      const saved = JSON.parse(storage.getItem('denmarkSurvival_settings') || 'null');
      // Volume itself is stored in registry; localStorage stores accessibility data.
      // We just need _persistSettings to have been called (no error thrown).
      expect(saved).not.toBeNull();
    });
  });

  describe('setMusicVolume()', () => {
    it('clamps to [0, 1]', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setMusicVolume(1.5);
      expect(scene.getSettings().musicVolume).toBe(1);
      scene.setMusicVolume(-1);
      expect(scene.getSettings().musicVolume).toBe(0);
    });

    it('updates registry key VOLUME_MUSIC', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);
      scene.setMusicVolume(0.3);
      expect(registry.get(RK.VOLUME_MUSIC)).toBeCloseTo(0.3);
    });
  });

  describe('setSfxVolume()', () => {
    it('clamps to [0, 1]', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setSfxVolume(99);
      expect(scene.getSettings().sfxVolume).toBe(1);
      scene.setSfxVolume(-99);
      expect(scene.getSettings().sfxVolume).toBe(0);
    });

    it('updates registry key VOLUME_SFX', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);
      scene.setSfxVolume(0.55);
      expect(registry.get(RK.VOLUME_SFX)).toBeCloseTo(0.55);
    });
  });

  // ── Mute ──────────────────────────────────────────────────────────────────

  describe('setMuted()', () => {
    it('sets muted to true', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setMuted(true);
      expect(scene.getSettings().muted).toBe(true);
    });

    it('sets muted to false', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setMuted(true);
      scene.setMuted(false);
      expect(scene.getSettings().muted).toBe(false);
    });

    it('persists muted state to localStorage', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setMuted(true);
      const saved = JSON.parse(storage.getItem('denmarkSurvival_settings'));
      expect(saved.muted).toBe(true);
    });
  });

  // ── Difficulty ────────────────────────────────────────────────────────────

  describe('setDifficulty()', () => {
    it('accepts valid difficulty values', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);

      scene.setDifficulty('easy');
      expect(scene.getSettings().difficulty).toBe('easy');
      expect(registry.get(RK.DIFFICULTY)).toBe('easy');

      scene.setDifficulty('hard');
      expect(scene.getSettings().difficulty).toBe('hard');
    });

    it('ignores invalid difficulty values', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);
      scene.setDifficulty('impossible');
      // Should remain 'normal' (initial value from registry)
      expect(scene.getSettings().difficulty).toBe('normal');
    });
  });

  // ── Tutorial hints ────────────────────────────────────────────────────────

  describe('setTutorialHints()', () => {
    it('stores tutorial hints on/off state', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setTutorialHints(false);
      expect(scene.getSettings().tutorialHints).toBe(false);
      scene.setTutorialHints(true);
      expect(scene.getSettings().tutorialHints).toBe(true);
    });
  });

  // ── Accessibility ─────────────────────────────────────────────────────────

  describe('setTextSize()', () => {
    it('clamps below 100 to 100', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setTextSize(50);
      expect(scene.getSettings().textSize).toBe(100);
    });

    it('clamps above 200 to 200', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setTextSize(300);
      expect(scene.getSettings().textSize).toBe(200);
    });

    it('accepts valid sizes', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setTextSize(150);
      expect(scene.getSettings().textSize).toBe(150);
    });
  });

  describe('setHighContrast()', () => {
    it('enables high contrast', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setHighContrast(true);
      expect(scene.getSettings().highContrast).toBe(true);
    });

    it('disables high contrast', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setHighContrast(true);
      scene.setHighContrast(false);
      expect(scene.getSettings().highContrast).toBe(false);
    });
  });

  describe('setDyslexiaFont()', () => {
    it('enables dyslexia font', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setDyslexiaFont(true);
      expect(scene.getSettings().dyslexiaFont).toBe(true);
    });

    it('persists dyslexia font to localStorage', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setDyslexiaFont(true);
      const saved = JSON.parse(storage.getItem('denmarkSurvival_settings'));
      expect(saved.dyslexiaFont).toBe(true);
    });
  });

  // ── Reduced motion ────────────────────────────────────────────────────────

  describe('setReducedMotion()', () => {
    it('enables reduced motion', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setReducedMotion(true);
      expect(scene.getSettings().reducedMotion).toBe(true);
    });

    it('disables reduced motion', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setReducedMotion(true);
      scene.setReducedMotion(false);
      expect(scene.getSettings().reducedMotion).toBe(false);
    });

    it('writes REDUCED_MOTION key to registry when enabled', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);
      scene.setReducedMotion(true);
      expect(registry.get(RK.REDUCED_MOTION)).toBe(true);
    });

    it('writes REDUCED_MOTION key to registry when disabled', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);
      scene.setReducedMotion(true);
      scene.setReducedMotion(false);
      expect(registry.get(RK.REDUCED_MOTION)).toBe(false);
    });

    it('persists reducedMotion to localStorage', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.setReducedMotion(true);
      const saved = JSON.parse(storage.getItem('denmarkSurvival_settings'));
      expect(saved.reducedMotion).toBe(true);
    });

    it('loads reducedMotion from localStorage on create()', () => {
      const { scene, storage } = buildScene();
      storage.setItem('denmarkSurvival_settings', JSON.stringify({
        reducedMotion: true,
      }));
      initAndCreate(scene, storage);
      expect(scene.getSettings().reducedMotion).toBe(true);
    });

    it('defaults reducedMotion to false when absent from localStorage', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(scene.getSettings().reducedMotion).toBe(false);
    });
  });

  // ── Settings persistence ──────────────────────────────────────────────────

  describe('settings persistence (cross-session)', () => {
    it('loads accessibility settings from localStorage on create()', () => {
      const { scene, storage } = buildScene();
      // Pre-populate localStorage as if settings were saved in a prior session
      storage.setItem('denmarkSurvival_settings', JSON.stringify({
        muted:        true,
        textSize:     150,
        highContrast: true,
        dyslexiaFont: false,
      }));

      initAndCreate(scene, storage);

      const s = scene.getSettings();
      expect(s.muted).toBe(true);
      expect(s.textSize).toBe(150);
      expect(s.highContrast).toBe(true);
      expect(s.dyslexiaFont).toBe(false);
    });

    it('_persistSettings() writes registry + localStorage in sync', () => {
      const { scene, storage, registry } = buildScene();
      initAndCreate(scene, storage);

      scene.setMasterVolume(0.3);
      scene.setDifficulty('easy');
      scene.setHighContrast(true);

      expect(registry.get(RK.VOLUME_MASTER)).toBeCloseTo(0.3);
      expect(registry.get(RK.DIFFICULTY)).toBe('easy');
      const saved = JSON.parse(storage.getItem('denmarkSurvival_settings'));
      expect(saved.highContrast).toBe(true);
    });

    it('_loadFromStorage() returns null for corrupted JSON', () => {
      const { scene, storage } = buildScene();
      storage.setItem('denmarkSurvival_settings', 'not-valid-json{{{');
      scene.init({ storage });
      expect(scene._loadFromStorage()).toBeNull();
    });
  });

  // ── getSettings() ─────────────────────────────────────────────────────────

  describe('getSettings()', () => {
    it('returns a shallow copy (mutations do not affect internal state)', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const snap = scene.getSettings();
      snap.masterVolume = 999;
      expect(scene.getSettings().masterVolume).not.toBe(999);
    });
  });

  // ── Close behaviour ───────────────────────────────────────────────────────

  describe('_close()', () => {
    it('calls closeOverlay() when launched as overlay', () => {
      const { scene, storage } = buildScene({ asOverlay: true });
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'closeOverlay');
      scene._close();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('calls transitionTo("MenuScene") when NOT an overlay', () => {
      const { scene, storage } = buildScene({ asOverlay: false });
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'transitionTo');
      scene._close();
      expect(spy).toHaveBeenCalledWith('MenuScene');
    });

    it('persists settings before closing', () => {
      const { scene, storage, registry } = buildScene({ asOverlay: false });
      initAndCreate(scene, storage);
      scene._settings.masterVolume = 0.2;
      vi.spyOn(scene, 'transitionTo').mockImplementation(() => {});
      scene._close();
      expect(registry.get(RK.VOLUME_MASTER)).toBeCloseTo(0.2);
    });
  });

  // ── Integration: full settings flow ──────────────────────────────────────

  describe('Integration: settings flow', () => {
    it('volume change persists after scene re-init', () => {
      const storage  = new MockLocalStorage();
      const registry = new MockRegistry();

      // Session 1 — change volume
      const scene1 = new SettingsScene();
      const makeO  = makeObj;
      const addMock = { text: vi.fn().mockImplementation(makeO), rectangle: vi.fn().mockImplementation(makeO) };
      scene1.scale = { width: 1280, height: 720 };
      scene1.registry = registry;
      scene1.add = addMock;
      scene1.cameras = { main: { fadeIn: vi.fn(), fadeOut: vi.fn() } };
      scene1.scene = { key: 'SettingsScene', start: vi.fn(), launch: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
      scene1.input = { keyboard: { addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }) }, enabled: true };

      scene1.init({ storage });
      scene1.create();
      scene1.setMasterVolume(0.3);

      // Registry should reflect change
      expect(registry.get(RK.VOLUME_MASTER)).toBeCloseTo(0.3);

      // Session 2 — new SettingsScene reads from same registry
      const scene2 = new SettingsScene();
      const addMock2 = { text: vi.fn().mockImplementation(makeO), rectangle: vi.fn().mockImplementation(makeO) };
      scene2.scale = { width: 1280, height: 720 };
      scene2.registry = registry; // same registry
      scene2.add = addMock2;
      scene2.cameras = { main: { fadeIn: vi.fn(), fadeOut: vi.fn() } };
      scene2.scene = { key: 'SettingsScene', start: vi.fn(), launch: vi.fn(), stop: vi.fn(), pause: vi.fn(), resume: vi.fn() };
      scene2.input = { keyboard: { addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }) }, enabled: true };

      scene2.init({ storage });
      scene2.create();

      // Settings should be loaded from registry
      expect(scene2.getSettings().masterVolume).toBeCloseTo(0.3);
    });
  });

  // ── shutdown() ────────────────────────────────────────────────────────────

  describe('shutdown()', () => {
    it('clears labels map', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(Object.keys(scene._labels).length).toBeGreaterThan(0);
      scene.shutdown();
      expect(Object.keys(scene._labels)).toHaveLength(0);
    });
  });
});
