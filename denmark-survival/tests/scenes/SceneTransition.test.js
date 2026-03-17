/**
 * tests/scenes/SceneTransition.test.js
 * Unit tests for SceneTransition utility and BaseScene class (Task 004).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventEmitter } from 'node:events';
import { MockScene, MockRegistry, MockGameObject } from '../mocks/PhaserMocks.js';
import {
  fadeToScene,
  fadeIn,
  slideToScene,
  instantTransition,
  launchOverlay,
  closeOverlay,
  DEFAULT_FADE_DURATION,
  SLIDE_LEFT,
  SLIDE_RIGHT,
  SLIDE_UP,
  SLIDE_DOWN,
  TRANSITION_FADE,
  TRANSITION_SLIDE,
  TRANSITION_INSTANT,
} from '../../src/scenes/SceneTransition.js';
import { BaseScene } from '../../src/scenes/BaseScene.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a mock scene with spy-instrumented methods suitable for transition tests.
 */
function buildMockScene(key = 'TestScene') {
  const scene = new MockScene(key);
  scene.scene.key = key;
  scene.scene.start = vi.fn();
  scene.scene.launch = vi.fn();
  scene.scene.stop = vi.fn();
  scene.scene.pause = vi.fn();
  scene.scene.resume = vi.fn();
  scene.cameras.main.fadeOut = vi.fn().mockImplementation((_dur, _r, _g, _b, callback) => {
    if (callback) callback(scene.cameras.main, 1);
  });
  scene.cameras.main.fadeIn = vi.fn().mockImplementation((_dur, _r, _g, _b, callback) => {
    if (callback) callback(scene.cameras.main, 1);
  });
  scene.cameras.main.scrollX = 0;
  scene.cameras.main.scrollY = 0;
  return scene;
}

/**
 * Build a BaseScene instance with all required Phaser context stubbed.
 */
function buildBaseScene(key = 'TestScene') {
  const scene = new BaseScene({ key });
  scene.scene = {
    key,
    start: vi.fn(),
    launch: vi.fn(),
    stop: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  };
  scene.cameras = {
    main: {
      fadeOut: vi.fn().mockImplementation((_dur, _r, _g, _b, callback) => {
        if (callback) callback(scene.cameras.main, 1);
      }),
      fadeIn: vi.fn().mockImplementation((_dur, _r, _g, _b, callback) => {
        if (callback) callback(scene.cameras.main, 1);
      }),
      scrollX: 0,
      scrollY: 0,
    },
  };
  scene.add = {
    text: vi.fn().mockReturnValue(new MockGameObject()),
    rectangle: vi.fn().mockReturnValue(new MockGameObject()),
    image: vi.fn().mockReturnValue(new MockGameObject()),
    sprite: vi.fn().mockReturnValue(new MockGameObject()),
    container: vi.fn().mockReturnValue(new MockGameObject()),
  };
  scene.scale = { width: 1280, height: 720 };
  scene.registry = new MockRegistry();
  scene.events = new EventEmitter();
  return scene;
}

// ---------------------------------------------------------------------------
// SceneTransition utility tests
// ---------------------------------------------------------------------------

describe('SceneTransition', () => {
  describe('constants', () => {
    it('DEFAULT_FADE_DURATION is 500ms', () => {
      expect(DEFAULT_FADE_DURATION).toBe(500);
    });

    it('exports slide direction constants', () => {
      expect(SLIDE_LEFT).toBe('left');
      expect(SLIDE_RIGHT).toBe('right');
      expect(SLIDE_UP).toBe('up');
      expect(SLIDE_DOWN).toBe('down');
    });

    it('exports transition type constants', () => {
      expect(TRANSITION_FADE).toBe('fade');
      expect(TRANSITION_SLIDE).toBe('slide');
      expect(TRANSITION_INSTANT).toBe('instant');
    });
  });

  // ── fadeToScene ──────────────────────────────────────────────────────────

  describe('fadeToScene()', () => {
    it('calls camera.fadeOut with default duration', () => {
      const scene = buildMockScene();
      fadeToScene(scene, 'MenuScene');
      expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(
        DEFAULT_FADE_DURATION, 0, 0, 0, expect.any(Function)
      );
    });

    it('calls camera.fadeOut with custom duration', () => {
      const scene = buildMockScene();
      fadeToScene(scene, 'MenuScene', {}, 1000);
      expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(
        1000, 0, 0, 0, expect.any(Function)
      );
    });

    it('starts target scene on fade-out complete', () => {
      const scene = buildMockScene();
      fadeToScene(scene, 'MenuScene');
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene', {});
    });

    it('passes data to target scene', () => {
      const scene = buildMockScene();
      const data = { playerName: 'Test', level: 5 };
      fadeToScene(scene, 'GameScene', data);
      expect(scene.scene.start).toHaveBeenCalledWith('GameScene', data);
    });

    it('does not throw when scene is null', () => {
      expect(() => fadeToScene(null, 'MenuScene')).not.toThrow();
    });

    it('does not throw when target is null', () => {
      const scene = buildMockScene();
      expect(() => fadeToScene(scene, null)).not.toThrow();
    });

    it('does not call scene.start when progress < 1', () => {
      const scene = buildMockScene();
      scene.cameras.main.fadeOut = vi.fn().mockImplementation((_dur, _r, _g, _b, callback) => {
        if (callback) callback(scene.cameras.main, 0.5);
      });
      fadeToScene(scene, 'MenuScene');
      expect(scene.scene.start).not.toHaveBeenCalled();
    });
  });

  // ── fadeIn ───────────────────────────────────────────────────────────────

  describe('fadeIn()', () => {
    it('calls camera.fadeIn with default duration', () => {
      const scene = buildMockScene();
      fadeIn(scene);
      expect(scene.cameras.main.fadeIn).toHaveBeenCalledWith(
        DEFAULT_FADE_DURATION, 0, 0, 0, expect.any(Function)
      );
    });

    it('calls camera.fadeIn with custom duration', () => {
      const scene = buildMockScene();
      fadeIn(scene, 800);
      expect(scene.cameras.main.fadeIn).toHaveBeenCalledWith(
        800, 0, 0, 0, expect.any(Function)
      );
    });

    it('calls onComplete callback when fade finishes', () => {
      const scene = buildMockScene();
      const onComplete = vi.fn();
      fadeIn(scene, 500, onComplete);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('does not throw when scene is null', () => {
      expect(() => fadeIn(null)).not.toThrow();
    });

    it('does not throw when no onComplete callback', () => {
      const scene = buildMockScene();
      expect(() => fadeIn(scene)).not.toThrow();
    });
  });

  // ── slideToScene ─────────────────────────────────────────────────────────

  describe('slideToScene()', () => {
    it('falls back to fadeToScene when scene.transition is not available', () => {
      const scene = buildMockScene();
      slideToScene(scene, 'MenuScene', SLIDE_LEFT);
      // Should have called fadeOut as fallback
      expect(scene.cameras.main.fadeOut).toHaveBeenCalled();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene', {});
    });

    it('uses scene.transition when available', () => {
      const scene = buildMockScene();
      scene.scene.transition = vi.fn();
      slideToScene(scene, 'MenuScene', SLIDE_LEFT, { level: 1 }, 300);
      expect(scene.scene.transition).toHaveBeenCalledWith(
        expect.objectContaining({
          target: 'MenuScene',
          data: { level: 1 },
          duration: 300,
        })
      );
    });

    it('onUpdate callback adjusts camera scroll', () => {
      const scene = buildMockScene();
      let capturedOnUpdate;
      scene.scene.transition = vi.fn().mockImplementation((config) => {
        capturedOnUpdate = config.onUpdate;
      });
      slideToScene(scene, 'MenuScene', SLIDE_LEFT, {}, 300);
      expect(capturedOnUpdate).toBeDefined();
      capturedOnUpdate(0.5);
      expect(scene.cameras.main.scrollX).toBe(-1280 * 0.5);
      expect(scene.cameras.main.scrollY).toBe(0);
    });

    it('passes data to the target scene', () => {
      const scene = buildMockScene();
      const data = { from: 'settings' };
      slideToScene(scene, 'MenuScene', SLIDE_RIGHT, data);
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene', data);
    });

    it('does not throw when scene is null', () => {
      expect(() => slideToScene(null, 'MenuScene', SLIDE_LEFT)).not.toThrow();
    });

    it('does not throw when target is null', () => {
      const scene = buildMockScene();
      expect(() => slideToScene(scene, null, SLIDE_UP)).not.toThrow();
    });
  });

  // ── instantTransition ───────────────────────────────────────────────────

  describe('instantTransition()', () => {
    it('starts target scene immediately', () => {
      const scene = buildMockScene();
      instantTransition(scene, 'DialogueScene');
      expect(scene.scene.start).toHaveBeenCalledWith('DialogueScene', {});
    });

    it('passes data to target scene', () => {
      const scene = buildMockScene();
      const data = { npcId: 'anna' };
      instantTransition(scene, 'DialogueScene', data);
      expect(scene.scene.start).toHaveBeenCalledWith('DialogueScene', data);
    });

    it('does not call camera fade', () => {
      const scene = buildMockScene();
      instantTransition(scene, 'DialogueScene');
      expect(scene.cameras.main.fadeOut).not.toHaveBeenCalled();
    });

    it('does not throw when scene is null', () => {
      expect(() => instantTransition(null, 'X')).not.toThrow();
    });

    it('does not throw when target is null', () => {
      const scene = buildMockScene();
      expect(() => instantTransition(scene, null)).not.toThrow();
    });
  });

  // ── launchOverlay ───────────────────────────────────────────────────────

  describe('launchOverlay()', () => {
    it('pauses the parent scene', () => {
      const scene = buildMockScene('GameScene');
      launchOverlay(scene, 'InventoryScene');
      expect(scene.scene.pause).toHaveBeenCalledWith('GameScene');
    });

    it('launches the overlay scene', () => {
      const scene = buildMockScene('GameScene');
      launchOverlay(scene, 'InventoryScene', { tab: 'items' });
      expect(scene.scene.launch).toHaveBeenCalledWith(
        'InventoryScene',
        expect.objectContaining({
          tab: 'items',
          _parentSceneKey: 'GameScene',
        })
      );
    });

    it('tracks the active overlay in registry', () => {
      const scene = buildMockScene('GameScene');
      launchOverlay(scene, 'InventoryScene');
      expect(scene.registry.get('_activeOverlay')).toBe('InventoryScene');
    });

    it('closes previous overlay when opening a new one', () => {
      const scene = buildMockScene('GameScene');
      scene.registry.set('_activeOverlay', 'DialogueScene');
      launchOverlay(scene, 'InventoryScene');
      expect(scene.scene.stop).toHaveBeenCalledWith('DialogueScene');
      expect(scene.registry.get('_activeOverlay')).toBe('InventoryScene');
    });

    it('does not throw when parentScene is null', () => {
      expect(() => launchOverlay(null, 'InventoryScene')).not.toThrow();
    });

    it('does not throw when overlayKey is null', () => {
      const scene = buildMockScene();
      expect(() => launchOverlay(scene, null)).not.toThrow();
    });
  });

  // ── closeOverlay ────────────────────────────────────────────────────────

  describe('closeOverlay()', () => {
    it('stops the overlay scene', () => {
      const scene = buildMockScene('InventoryScene');
      scene._parentSceneKey = 'GameScene';
      closeOverlay(scene);
      expect(scene.scene.stop).toHaveBeenCalled();
    });

    it('resumes the parent scene', () => {
      const scene = buildMockScene('InventoryScene');
      scene._parentSceneKey = 'GameScene';
      closeOverlay(scene);
      expect(scene.scene.resume).toHaveBeenCalledWith('GameScene');
    });

    it('clears the active overlay from registry', () => {
      const scene = buildMockScene('InventoryScene');
      scene._parentSceneKey = 'GameScene';
      scene.registry.set('_activeOverlay', 'InventoryScene');
      closeOverlay(scene);
      expect(scene.registry.get('_activeOverlay')).toBeNull();
    });

    it('does not throw when overlayScene is null', () => {
      expect(() => closeOverlay(null)).not.toThrow();
    });

    it('does not resume when no parent key', () => {
      const scene = buildMockScene('InventoryScene');
      scene._parentSceneKey = null;
      closeOverlay(scene);
      expect(scene.scene.stop).toHaveBeenCalled();
      expect(scene.scene.resume).not.toHaveBeenCalled();
    });
  });
});

// ---------------------------------------------------------------------------
// BaseScene tests
// ---------------------------------------------------------------------------

describe('BaseScene', () => {
  describe('constructor', () => {
    it('initializes with default properties', () => {
      const scene = new BaseScene({ key: 'TestScene' });
      expect(scene._sceneData).toEqual({});
      expect(scene._parentSceneKey).toBeNull();
      expect(scene._isOverlay).toBe(false);
      expect(scene._registeredEvents).toEqual([]);
    });

    it('stores config key correctly', () => {
      const scene = new BaseScene({ key: 'MenuScene' });
      expect(scene._config.key).toBe('MenuScene');
    });
  });

  // ── init() ──────────────────────────────────────────────────────────────

  describe('init()', () => {
    it('captures data from transition', () => {
      const scene = buildBaseScene();
      scene.init({ playerName: 'Test', level: 3 });
      expect(scene._sceneData).toEqual({ playerName: 'Test', level: 3 });
    });

    it('sets overlay flags when _parentSceneKey is in data', () => {
      const scene = buildBaseScene();
      scene.init({ _parentSceneKey: 'GameScene', npcId: 'anna' });
      expect(scene._parentSceneKey).toBe('GameScene');
      expect(scene._isOverlay).toBe(true);
      // Internal key is stripped from user-facing data
      expect(scene._sceneData._parentSceneKey).toBeUndefined();
      expect(scene._sceneData.npcId).toBe('anna');
    });

    it('does not set overlay flags when _parentSceneKey is absent', () => {
      const scene = buildBaseScene();
      scene.init({ playerName: 'Test' });
      expect(scene._parentSceneKey).toBeNull();
      expect(scene._isOverlay).toBe(false);
    });

    it('defaults to empty data when called with no args', () => {
      const scene = buildBaseScene();
      scene.init();
      expect(scene._sceneData).toEqual({});
    });

    it('makes a copy of data (does not mutate input)', () => {
      const scene = buildBaseScene();
      const data = { level: 1 };
      scene.init(data);
      scene._sceneData.level = 99;
      expect(data.level).toBe(1);
    });
  });

  // ── shutdown() ──────────────────────────────────────────────────────────

  describe('shutdown()', () => {
    it('removes all tracked event listeners', () => {
      const scene = buildBaseScene();
      const emitter = new EventEmitter();
      const handler = vi.fn();
      scene.trackEvent(emitter, 'test_event', handler);
      expect(emitter.listenerCount('test_event')).toBe(1);

      scene.shutdown();
      expect(emitter.listenerCount('test_event')).toBe(0);
    });

    it('clears registered events array', () => {
      const scene = buildBaseScene();
      const emitter = new EventEmitter();
      scene.trackEvent(emitter, 'e1', vi.fn());
      scene.trackEvent(emitter, 'e2', vi.fn());
      expect(scene._registeredEvents.length).toBe(2);

      scene.shutdown();
      expect(scene._registeredEvents.length).toBe(0);
    });

    it('resets scene data', () => {
      const scene = buildBaseScene();
      scene.init({ level: 5 });
      scene.shutdown();
      expect(scene._sceneData).toEqual({});
    });

    it('resets overlay properties', () => {
      const scene = buildBaseScene();
      scene.init({ _parentSceneKey: 'GameScene' });
      expect(scene._isOverlay).toBe(true);
      scene.shutdown();
      expect(scene._parentSceneKey).toBeNull();
      expect(scene._isOverlay).toBe(false);
    });
  });

  // ── trackEvent() ────────────────────────────────────────────────────────

  describe('trackEvent()', () => {
    it('registers an event listener on the emitter', () => {
      const scene = buildBaseScene();
      const emitter = new EventEmitter();
      const handler = vi.fn();
      scene.trackEvent(emitter, 'test', handler);
      emitter.emit('test', 42);
      expect(handler).toHaveBeenCalledWith(42);
    });

    it('adds to _registeredEvents list', () => {
      const scene = buildBaseScene();
      const emitter = new EventEmitter();
      scene.trackEvent(emitter, 'evt', vi.fn());
      expect(scene._registeredEvents.length).toBe(1);
      expect(scene._registeredEvents[0].event).toBe('evt');
    });

    it('does not register if emitter is null', () => {
      const scene = buildBaseScene();
      scene.trackEvent(null, 'evt', vi.fn());
      expect(scene._registeredEvents.length).toBe(0);
    });
  });

  // ── transitionTo() ─────────────────────────────────────────────────────

  describe('transitionTo()', () => {
    it('calls fadeOut then starts target scene', () => {
      const scene = buildBaseScene();
      scene.transitionTo('MenuScene', { from: 'boot' });
      expect(scene.cameras.main.fadeOut).toHaveBeenCalled();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene', { from: 'boot' });
    });

    it('uses custom duration', () => {
      const scene = buildBaseScene();
      scene.transitionTo('MenuScene', {}, 1000);
      expect(scene.cameras.main.fadeOut).toHaveBeenCalledWith(
        1000, 0, 0, 0, expect.any(Function)
      );
    });
  });

  // ── fadeInCamera() ─────────────────────────────────────────────────────

  describe('fadeInCamera()', () => {
    it('calls camera.fadeIn with default duration', () => {
      const scene = buildBaseScene();
      scene.fadeInCamera();
      expect(scene.cameras.main.fadeIn).toHaveBeenCalledWith(
        DEFAULT_FADE_DURATION, 0, 0, 0, expect.any(Function)
      );
    });

    it('calls onComplete when provided', () => {
      const scene = buildBaseScene();
      const onComplete = vi.fn();
      scene.fadeInCamera(500, onComplete);
      expect(onComplete).toHaveBeenCalledTimes(1);
    });
  });

  // ── slideTo() ──────────────────────────────────────────────────────────

  describe('slideTo()', () => {
    it('performs a slide transition', () => {
      const scene = buildBaseScene();
      scene.slideTo('MenuScene', SLIDE_LEFT, { x: 1 });
      // Falls back to fadeToScene since no scene.transition exists
      expect(scene.cameras.main.fadeOut).toHaveBeenCalled();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene', { x: 1 });
    });
  });

  // ── goTo() ─────────────────────────────────────────────────────────────

  describe('goTo()', () => {
    it('instantly starts target scene', () => {
      const scene = buildBaseScene();
      scene.goTo('DialogueScene', { npcId: 'lars' });
      expect(scene.scene.start).toHaveBeenCalledWith('DialogueScene', { npcId: 'lars' });
    });

    it('does not call camera fade methods', () => {
      const scene = buildBaseScene();
      scene.goTo('DialogueScene');
      expect(scene.cameras.main.fadeOut).not.toHaveBeenCalled();
      expect(scene.cameras.main.fadeIn).not.toHaveBeenCalled();
    });
  });

  // ── openOverlay() ─────────────────────────────────────────────────────

  describe('openOverlay()', () => {
    it('pauses the current scene', () => {
      const scene = buildBaseScene('GameScene');
      scene.openOverlay('InventoryScene');
      expect(scene.scene.pause).toHaveBeenCalledWith('GameScene');
    });

    it('launches the overlay scene with parent key', () => {
      const scene = buildBaseScene('GameScene');
      scene.openOverlay('InventoryScene', { tab: 'equipment' });
      expect(scene.scene.launch).toHaveBeenCalledWith(
        'InventoryScene',
        expect.objectContaining({
          tab: 'equipment',
          _parentSceneKey: 'GameScene',
        })
      );
    });

    it('closes previous overlay when opening a new one', () => {
      const scene = buildBaseScene('GameScene');
      scene.registry.set('_activeOverlay', 'DialogueScene');
      scene.openOverlay('InventoryScene');
      expect(scene.scene.stop).toHaveBeenCalledWith('DialogueScene');
    });
  });

  // ── closeOverlay() ────────────────────────────────────────────────────

  describe('closeOverlay()', () => {
    it('stops the overlay and resumes parent', () => {
      const scene = buildBaseScene('InventoryScene');
      scene.init({ _parentSceneKey: 'GameScene' });
      scene.closeOverlay();
      expect(scene.scene.stop).toHaveBeenCalled();
      expect(scene.scene.resume).toHaveBeenCalledWith('GameScene');
    });

    it('does nothing when not an overlay', () => {
      const scene = buildBaseScene('MenuScene');
      scene.init({});
      scene.closeOverlay();
      expect(scene.scene.stop).not.toHaveBeenCalled();
    });
  });

  // ── createOverlayBackground() ─────────────────────────────────────────

  describe('createOverlayBackground()', () => {
    it('creates a full-screen rectangle', () => {
      const scene = buildBaseScene();
      scene.createOverlayBackground();
      expect(scene.add.rectangle).toHaveBeenCalledWith(
        640, 360, 1280, 720, 0x000000, 0.6
      );
    });

    it('uses custom alpha', () => {
      const scene = buildBaseScene();
      scene.createOverlayBackground(0.8);
      expect(scene.add.rectangle).toHaveBeenCalledWith(
        640, 360, 1280, 720, 0x000000, 0.8
      );
    });

    it('returns the background game object', () => {
      const scene = buildBaseScene();
      const bg = scene.createOverlayBackground();
      expect(bg).toBeDefined();
      expect(bg.depth).toBe(-1);
    });
  });
});

// ---------------------------------------------------------------------------
// Integration-style tests
// ---------------------------------------------------------------------------

describe('Scene Navigation Integration', () => {
  it('BootScene → MenuScene → GameScene sequence can be simulated', () => {
    const boot = buildMockScene('BootScene');
    fadeToScene(boot, 'MenuScene');
    expect(boot.scene.start).toHaveBeenCalledWith('MenuScene', {});

    const menu = buildMockScene('MenuScene');
    fadeToScene(menu, 'CharacterCreationScene', { playerName: 'Sven' });
    expect(menu.scene.start).toHaveBeenCalledWith('CharacterCreationScene', { playerName: 'Sven' });

    const charCreate = buildMockScene('CharacterCreationScene');
    fadeToScene(charCreate, 'GameScene', { playerName: 'Sven', nationality: 'Danish' });
    expect(charCreate.scene.start).toHaveBeenCalledWith('GameScene', {
      playerName: 'Sven',
      nationality: 'Danish',
    });
  });

  it('GameScene + DialogueScene overlay: open, close, resume', () => {
    const game = buildMockScene('GameScene');

    // Open dialogue overlay
    launchOverlay(game, 'DialogueScene', { npcId: 'anna' });
    expect(game.scene.pause).toHaveBeenCalledWith('GameScene');
    expect(game.scene.launch).toHaveBeenCalledWith('DialogueScene', expect.objectContaining({
      npcId: 'anna',
      _parentSceneKey: 'GameScene',
    }));

    // Simulate overlay scene closing
    const dialogue = buildMockScene('DialogueScene');
    dialogue._parentSceneKey = 'GameScene';
    dialogue.registry = game.registry;
    closeOverlay(dialogue);
    expect(dialogue.scene.stop).toHaveBeenCalled();
    expect(dialogue.scene.resume).toHaveBeenCalledWith('GameScene');
  });

  it('opening new overlay closes previous overlay', () => {
    const game = buildMockScene('GameScene');

    // Open first overlay
    launchOverlay(game, 'DialogueScene');
    expect(game.registry.get('_activeOverlay')).toBe('DialogueScene');

    // Open second overlay — should close first
    launchOverlay(game, 'InventoryScene');
    expect(game.scene.stop).toHaveBeenCalledWith('DialogueScene');
    expect(game.registry.get('_activeOverlay')).toBe('InventoryScene');
  });

  it('UIScene runs in parallel (launched without pausing GameScene)', () => {
    const game = buildMockScene('GameScene');
    // UIScene is launched directly (not as overlay), so no pause
    game.scene.launch('UIScene');
    expect(game.scene.launch).toHaveBeenCalledWith('UIScene');
    expect(game.scene.pause).not.toHaveBeenCalled();
  });

  it('BaseScene shutdown properly removes event listeners (no memory leaks)', () => {
    const scene = buildBaseScene('GameScene');
    const emitter1 = new EventEmitter();
    const emitter2 = new EventEmitter();

    scene.trackEvent(emitter1, 'evt_a', vi.fn());
    scene.trackEvent(emitter1, 'evt_b', vi.fn());
    scene.trackEvent(emitter2, 'evt_c', vi.fn());

    expect(emitter1.listenerCount('evt_a')).toBe(1);
    expect(emitter1.listenerCount('evt_b')).toBe(1);
    expect(emitter2.listenerCount('evt_c')).toBe(1);

    scene.shutdown();

    expect(emitter1.listenerCount('evt_a')).toBe(0);
    expect(emitter1.listenerCount('evt_b')).toBe(0);
    expect(emitter2.listenerCount('evt_c')).toBe(0);
    expect(scene._registeredEvents.length).toBe(0);
  });
});
