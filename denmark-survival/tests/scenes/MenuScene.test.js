/**
 * tests/scenes/MenuScene.test.js
 * Unit tests for MenuScene — main menu buttons, save-slot logic, credits.
 *
 * Phaser.Scene is mocked globally via tests/mocks/setupPhaser.js.
 * GameButton internals are exercised through the mocked scene.add methods.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry, MockLocalStorage, MockGameObject } from '../mocks/PhaserMocks.js';
import { MenuScene } from '../../src/scenes/MenuScene.js';
import {
  initializeNewGame,
  saveGame,
} from '../../src/state/StateManager.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a fresh MenuScene with all Phaser dependencies mocked.
 * Returns the scene instance plus frequently-needed mocks.
 */
function buildScene() {
  const scene   = new MenuScene();
  const storage = new MockLocalStorage();
  const registry = new MockRegistry();

  const makeObj = () => {
    const obj = new MockGameObject();
    // Extra methods GameButton / scene calls need
    obj.setOrigin     = vi.fn().mockReturnThis();
    obj.setDepth      = vi.fn().mockReturnThis();
    obj.setScrollFactor = vi.fn().mockReturnThis();
    obj.setStyle      = vi.fn().mockReturnThis();
    obj.setFillStyle  = vi.fn().mockReturnThis();
    obj.setInteractive = vi.fn().mockReturnThis();
    obj.setText       = vi.fn().mockImplementation(function (t) { this.text = t; return this; });
    obj.setVisible    = vi.fn().mockImplementation(function (v) { this.visible = v; return this; });
    obj.on            = vi.fn().mockReturnThis();
    obj.destroy       = vi.fn();
    return obj;
  };

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
    key:    'MenuScene',
    start:  vi.fn(),
    launch: vi.fn(),
    pause:  vi.fn(),
    stop:   vi.fn(),
    resume: vi.fn(),
  };
  scene.sound = {
    add:    vi.fn().mockReturnValue({ play: vi.fn(), stop: vi.fn(), destroy: vi.fn(), setVolume: vi.fn(), volume: 1, isPlaying: false, isPaused: false, _calls: { play: [], stop: 0 } }),
    unlock: vi.fn(),
  };
  scene.input = {
    keyboard: { addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }) },
    enabled: true,
  };

  return { scene, storage, registry };
}

/**
 * Call init + create on a scene after injecting storage.
 */
function initAndCreate(scene, storage) {
  scene.init({ storage });
  scene.create();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MenuScene', () => {
  describe('constructor', () => {
    it('uses "MenuScene" as the scene key', () => {
      const { scene } = buildScene();
      expect(scene._config.key).toBe('MenuScene');
    });
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('calls fadeInCamera', () => {
      const { scene, storage } = buildScene();
      const spy = vi.spyOn(scene, 'fadeInCamera');
      initAndCreate(scene, storage);
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('creates background rectangle', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(scene.add.rectangle).toHaveBeenCalled();
    });

    it('renders game title text "Denmark Survival"', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const titleCall = scene.add.text.mock.calls.find(([, , text]) => text === 'Denmark Survival');
      expect(titleCall).toBeDefined();
    });

    it('renders tagline text', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const taglineCall = scene.add.text.mock.calls.find(([, , text]) =>
        text.includes('Danish living')
      );
      expect(taglineCall).toBeDefined();
    });

    it('creates all 5 menu buttons', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(Object.keys(scene._buttons)).toEqual(
        expect.arrayContaining(['newGame', 'continue', 'loadGame', 'settings', 'credits'])
      );
    });
  });

  // ── Continue button state ─────────────────────────────────────────────────

  describe('Continue button state', () => {
    it('is disabled when no saves exist', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      // No saves written → continue should be disabled
      expect(scene._buttons.continue.isEnabled()).toBe(false);
    });

    it('is enabled when at least one save exists', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Hans', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);

      initAndCreate(scene, storage);
      expect(scene._buttons.continue.isEnabled()).toBe(true);
    });
  });

  // ── _hasAnySave() ─────────────────────────────────────────────────────────

  describe('_hasAnySave()', () => {
    it('returns false when storage is empty', () => {
      const { scene, storage } = buildScene();
      scene.init({ storage });
      expect(scene._hasAnySave()).toBe(false);
    });

    it('returns true after saving to slot 2', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Lars', nationality: 'Danish', job: 'Chef' });
      saveGame(registry, 2, storage);

      scene.init({ storage });
      expect(scene._hasAnySave()).toBe(true);
    });

    it('returns false when saves exist only in a different storage', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Lars', nationality: 'Danish', job: 'Chef' });
      saveGame(registry, 1, storage); // saved to `storage`

      const emptyStorage = new MockLocalStorage();
      scene.init({ storage: emptyStorage }); // scene sees empty storage
      expect(scene._hasAnySave()).toBe(false);
    });
  });

  // ── _getMostRecentSaveSlot() ──────────────────────────────────────────────

  describe('_getMostRecentSaveSlot()', () => {
    it('returns null when no saves exist', () => {
      const { scene, storage } = buildScene();
      scene.init({ storage });
      expect(scene._getMostRecentSaveSlot()).toBeNull();
    });

    it('returns the slot with the most recent savedAt timestamp', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'A', nationality: 'Danish', job: 'Student' });

      // Save to slot 1 with an old timestamp, slot 3 with a newer one
      saveGame(registry, 1, storage);
      saveGame(registry, 3, storage);

      // Directly update slot 3's timestamp to be strictly newer
      const raw3 = JSON.parse(storage.getItem('denmarkSurvival_save_3'));
      raw3._savedAt = Date.now() + 10000;
      storage.setItem('denmarkSurvival_save_3', JSON.stringify(raw3));

      scene.init({ storage });
      expect(scene._getMostRecentSaveSlot()).toBe(3);
    });
  });

  // ── _getSaveSlotMetadata() ────────────────────────────────────────────────

  describe('_getSaveSlotMetadata()', () => {
    it('returns an array of three entries', () => {
      const { scene, storage } = buildScene();
      scene.init({ storage });
      const meta = scene._getSaveSlotMetadata();
      expect(meta).toHaveLength(3);
    });

    it('returns null for empty slots', () => {
      const { scene, storage } = buildScene();
      scene.init({ storage });
      const meta = scene._getSaveSlotMetadata();
      expect(meta[0]).toBeNull();
      expect(meta[1]).toBeNull();
      expect(meta[2]).toBeNull();
    });

    it('returns metadata for a populated slot', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Mette', nationality: 'Danish', job: 'Engineer' });
      registry.set('player_level', 5);
      registry.set('current_day', 12);
      saveGame(registry, 2, storage);

      scene.init({ storage });
      const meta = scene._getSaveSlotMetadata();
      expect(meta[0]).toBeNull();      // slot 1 empty
      expect(meta[1]).toBeDefined();   // slot 2 has data
      expect(meta[1].name).toBe('Mette');
      expect(meta[1].level).toBe(5);
      expect(meta[1].day).toBe(12);
      expect(meta[2]).toBeNull();      // slot 3 empty
    });
  });

  // ── Navigation handlers ───────────────────────────────────────────────────

  describe('_onNewGame()', () => {
    it('calls transitionTo("CharacterCreationScene")', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'transitionTo');
      scene._onNewGame();
      expect(spy).toHaveBeenCalledWith('CharacterCreationScene');
    });
  });

  describe('_onContinue()', () => {
    it('does nothing when no saves exist', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'transitionTo');
      scene._onContinue();
      expect(spy).not.toHaveBeenCalled();
    });

    it('loads the most recent save and transitions to GameScene', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);

      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'transitionTo');
      scene._onContinue();
      expect(spy).toHaveBeenCalledWith('GameScene');
    });

    it('loads game state into registry', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Loadme', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);

      const freshRegistry = new MockRegistry();
      scene.registry = freshRegistry;
      initAndCreate(scene, storage);
      scene._onContinue();

      expect(freshRegistry.get('player_name')).toBe('Loadme');
    });
  });

  describe('_onSettings()', () => {
    it('calls openOverlay("SettingsScene")', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'openOverlay');
      scene._onSettings();
      expect(spy).toHaveBeenCalledWith('SettingsScene');
    });
  });

  describe('_onLoadGame()', () => {
    it('shows the save-slot selector', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, '_showSaveSlotSelector');
      scene._onLoadGame();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('_onCredits()', () => {
    it('shows the credits panel', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, '_showCredits');
      scene._onCredits();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ── Credits panel ─────────────────────────────────────────────────────────

  describe('credits panel', () => {
    it('creates the credits panel on first call', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(scene._creditsPanel).toBeNull();
      scene._showCredits();
      expect(scene._creditsPanel).not.toBeNull();
    });

    it('hides the credits panel on _hideCredits()', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._showCredits();
      scene._hideCredits();
      expect(scene._creditsPanel).toBeNull();
    });
  });

  // ── Save-slot selector ────────────────────────────────────────────────────

  describe('save-slot selector', () => {
    it('creates the selector panel on first call', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(scene._saveSlotPanel).toBeNull();
      scene._showSaveSlotSelector();
      expect(scene._saveSlotPanel).not.toBeNull();
    });

    it('hides the panel on _hideSaveSlotSelector()', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._showSaveSlotSelector();
      scene._hideSaveSlotSelector();
      expect(scene._saveSlotPanel).toBeNull();
    });

    it('disables slot buttons for empty slots', () => {
      const { scene, storage } = buildScene();
      // No saves → all slots empty
      initAndCreate(scene, storage);
      scene._showSaveSlotSelector();
      const panel = scene._saveSlotPanel;
      panel.slotButtons.forEach(btn => {
        expect(btn.isEnabled()).toBe(false);
      });
    });

    it('enables slot button for a populated slot', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'SavedPlayer', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 2, storage);

      initAndCreate(scene, storage);
      scene._showSaveSlotSelector();
      const panel = scene._saveSlotPanel;

      // Slot 2 (index 1) should be enabled
      expect(panel.slotButtons[0].isEnabled()).toBe(false); // slot 1
      expect(panel.slotButtons[1].isEnabled()).toBe(true);  // slot 2
      expect(panel.slotButtons[2].isEnabled()).toBe(false); // slot 3
    });
  });

  // ── _confirmLoad() ────────────────────────────────────────────────────────

  describe('_confirmLoad()', () => {
    it('loads registry state and transitions to GameScene', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Loaded', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);

      const freshReg = new MockRegistry();
      scene.registry = freshReg;
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'transitionTo');

      scene._confirmLoad(1);
      expect(spy).toHaveBeenCalledWith('GameScene');
      expect(freshReg.get('player_name')).toBe('Loaded');
    });
  });

  // ── shutdown() ────────────────────────────────────────────────────────────

  describe('shutdown()', () => {
    it('destroys all buttons', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      const destroySpies = Object.values(scene._buttons).map(btn => vi.spyOn(btn, 'destroy'));
      scene.shutdown();
      destroySpies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    });

    it('clears the buttons map', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.shutdown();
      expect(Object.keys(scene._buttons)).toHaveLength(0);
    });
  });
});
