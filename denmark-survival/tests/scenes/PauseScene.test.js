/**
 * tests/scenes/PauseScene.test.js
 * Unit tests for PauseScene — pause overlay with resume/save/load/menu/quit.
 *
 * Phaser.Scene is mocked globally via tests/mocks/setupPhaser.js.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry, MockLocalStorage, MockGameObject } from '../mocks/PhaserMocks.js';
import { PauseScene } from '../../src/scenes/PauseScene.js';
import {
  initializeNewGame,
  saveGame,
  hasSave,
} from '../../src/state/StateManager.js';
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

function buildScene() {
  const scene    = new PauseScene();
  const storage  = new MockLocalStorage();
  const registry = new MockRegistry();

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
    key:    'PauseScene',
    start:  vi.fn(),
    launch: vi.fn(),
    stop:   vi.fn(),
    pause:  vi.fn(),
    resume: vi.fn(),
  };
  scene.input    = {
    keyboard: { addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }) },
    enabled:  true,
  };

  return { scene, storage, registry };
}

function initAndCreate(scene, storage) {
  scene.init({ storage });
  scene.create();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('PauseScene', () => {
  describe('constructor', () => {
    it('uses "PauseScene" as the scene key', () => {
      const { scene } = buildScene();
      expect(scene._config.key).toBe('PauseScene');
    });
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('renders the "Paused" title', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const titleCall = scene.add.text.mock.calls.find(([, , text]) => text === 'Paused');
      expect(titleCall).toBeDefined();
    });

    it('creates all 6 pause buttons', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(Object.keys(scene._buttons)).toEqual(
        expect.arrayContaining(['resume', 'settings', 'save', 'load', 'menu', 'quit'])
      );
    });

    it('creates overlay background', () => {
      const { scene, storage } = buildScene();
      const spy = vi.spyOn(scene, 'createOverlayBackground');
      initAndCreate(scene, storage);
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ── _onResume() ───────────────────────────────────────────────────────────

  describe('_onResume()', () => {
    it('calls closeOverlay()', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'closeOverlay');
      scene._onResume();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ── _onSettings() ─────────────────────────────────────────────────────────

  describe('_onSettings()', () => {
    it('calls openOverlay("SettingsScene")', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, 'openOverlay');
      scene._onSettings();
      expect(spy).toHaveBeenCalledWith('SettingsScene');
    });
  });

  // ── _onSaveGame() ─────────────────────────────────────────────────────────

  describe('_onSaveGame()', () => {
    it('saves game to the current save slot', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'PauseSaver', nationality: 'Danish', job: 'Student' });
      registry.set(RK.SAVE_SLOT, 2);

      initAndCreate(scene, storage);
      scene._onSaveGame();

      expect(hasSave(2, storage)).toBe(true);
    });

    it('defaults to slot 1 when SAVE_SLOT is not set', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'Defaulter', nationality: 'Danish', job: 'Student' });
      // Do not set SAVE_SLOT in registry

      initAndCreate(scene, storage);
      scene._onSaveGame();

      expect(hasSave(1, storage)).toBe(true);
    });
  });

  // ── _onLoadGame() ─────────────────────────────────────────────────────────

  describe('_onLoadGame()', () => {
    it('shows the load panel', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, '_showLoadPanel');
      scene._onLoadGame();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ── _onMainMenu() ─────────────────────────────────────────────────────────

  describe('_onMainMenu()', () => {
    it('shows a confirmation dialog', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, '_showConfirm');
      scene._onMainMenu();
      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('confirmation panel is created with confirm + cancel buttons', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._onMainMenu();
      expect(scene._confirmPanel).not.toBeNull();
      expect(scene._confirmPanel.confirmBtn).toBeDefined();
      expect(scene._confirmPanel.cancelBtn).toBeDefined();
    });
  });

  // ── _onQuit() ────────────────────────────────────────────────────────────

  describe('_onQuit()', () => {
    it('shows a confirmation dialog', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spy = vi.spyOn(scene, '_showConfirm');
      scene._onQuit();
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  // ── _goToMainMenu() ───────────────────────────────────────────────────────

  describe('_goToMainMenu()', () => {
    it('starts MenuScene', () => {
      const { scene, storage } = buildScene();
      scene._isOverlay       = true;
      scene._parentSceneKey  = 'GameScene';
      initAndCreate(scene, storage);
      scene._goToMainMenu();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    });

    it('stops the parent scene', () => {
      const { scene, storage } = buildScene();
      scene._isOverlay       = true;
      scene._parentSceneKey  = 'GameScene';
      initAndCreate(scene, storage);
      scene._goToMainMenu();
      expect(scene.scene.stop).toHaveBeenCalledWith('GameScene');
    });
  });

  // ── Confirmation dialog ───────────────────────────────────────────────────

  describe('confirmation dialog', () => {
    it('_showConfirm() creates a panel with confirm + cancel buttons', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._showConfirm('Test message?', vi.fn());
      expect(scene._confirmPanel).not.toBeNull();
    });

    it('_hideConfirm() removes the panel', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._showConfirm('Test?', vi.fn());
      scene._hideConfirm();
      expect(scene._confirmPanel).toBeNull();
    });

    it('calling _showConfirm twice replaces the existing panel', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._showConfirm('First?', vi.fn());
      const firstPanel = scene._confirmPanel;
      scene._showConfirm('Second?', vi.fn());
      expect(scene._confirmPanel).not.toBe(firstPanel);
    });
  });

  // ── Load panel ────────────────────────────────────────────────────────────

  describe('load game panel', () => {
    it('creates panel on first call', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      expect(scene._loadPanel).toBeNull();
      scene._showLoadPanel();
      expect(scene._loadPanel).not.toBeNull();
    });

    it('_hideLoadPanel() removes the panel', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._showLoadPanel();
      scene._hideLoadPanel();
      expect(scene._loadPanel).toBeNull();
    });

    it('slot buttons are disabled for empty slots', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._showLoadPanel();
      scene._loadPanel.slotBtns.forEach(btn => {
        expect(btn.isEnabled()).toBe(false);
      });
    });

    it('slot button is enabled for a populated slot', () => {
      const { scene, storage, registry } = buildScene();
      initializeNewGame(registry, { name: 'LoadTest', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 3, storage);

      initAndCreate(scene, storage);
      scene._showLoadPanel();

      expect(scene._loadPanel.slotBtns[0].isEnabled()).toBe(false); // slot 1
      expect(scene._loadPanel.slotBtns[1].isEnabled()).toBe(false); // slot 2
      expect(scene._loadPanel.slotBtns[2].isEnabled()).toBe(true);  // slot 3
    });
  });

  // ── Integration: pause overlay ────────────────────────────────────────────

  describe('Integration: pause overlay pauses game and resumes on close', () => {
    it('closeOverlay() is called on resume', () => {
      const { scene, storage } = buildScene();
      scene._isOverlay       = true;
      scene._parentSceneKey  = 'GameScene';
      initAndCreate(scene, storage);

      // Spy on the underlying SceneTransition helper via closeOverlay
      const spy = vi.spyOn(scene, 'closeOverlay');
      scene._onResume();
      expect(spy).toHaveBeenCalled();
    });
  });

  // ── shutdown() ────────────────────────────────────────────────────────────

  describe('shutdown()', () => {
    it('destroys all buttons', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      const spies = Object.values(scene._buttons).map(b => vi.spyOn(b, 'destroy'));
      scene.shutdown();
      spies.forEach(spy => expect(spy).toHaveBeenCalledTimes(1));
    });

    it('clears the buttons map', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene.shutdown();
      expect(Object.keys(scene._buttons)).toHaveLength(0);
    });
  });
});
