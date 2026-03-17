/**
 * tests/scenes/UIScene.test.js
 * Unit tests for UIScene — HUD overlay with reactive registry updates.
 *
 * Phaser.Scene is mocked globally by tests/mocks/setupPhaser.js (vitest setupFiles).
 * All Phaser display objects are replaced with mock stubs so tests run
 * in Node.js without a canvas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { UIScene } from '../../src/scenes/UIScene.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Build a fresh UIScene instance with all required Phaser context stubbed.
 * @param {object} [opts]
 * @param {boolean} [opts.withTweens] - Attach a tweens stub to the scene.
 */
function buildScene({ withTweens = false } = {}) {
  const scene = new UIScene();

  const textObjects = [];
  const rectObjects = [];
  const tweenCalls  = [];

  const makeText = () => {
    const obj = {
      x: 0, y: 0, text: '', visible: true, depth: 0,
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
      setText: vi.fn().mockImplementation(function(t) { this.text = t; return this; }),
      setStyle: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      destroy: vi.fn(),
    };
    textObjects.push(obj);
    return obj;
  };

  const makeRect = () => {
    const obj = {
      x: 0, y: 0, width: 0, height: 0, visible: true, depth: 0,
      setOrigin: vi.fn().mockReturnThis(),
      setDepth: vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setAlpha: vi.fn().mockReturnThis(),
      setInteractive: vi.fn().mockReturnThis(),
      setFillStyle: vi.fn().mockReturnThis(),
      setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
      on: vi.fn().mockImplementation(function(event, cb) {
        this._handlers = this._handlers || {};
        this._handlers[event] = cb;
        return this;
      }),
      destroy: vi.fn(),
    };
    rectObjects.push(obj);
    return obj;
  };

  const registry = new MockRegistry();

  scene.scale    = { width: 1280, height: 720 };
  scene.registry = registry;
  scene.add      = {
    text:      vi.fn().mockImplementation(makeText),
    rectangle: vi.fn().mockImplementation(makeRect),
  };
  scene.input = {
    keyboard: {
      addKey: vi.fn().mockReturnValue({
        on: vi.fn(),
        isDown: false,
      }),
    },
    enabled: true,
  };
  scene.scene = {
    launch: vi.fn(),
  };

  if (withTweens) {
    scene.tweens = {
      add: vi.fn().mockImplementation((cfg) => {
        tweenCalls.push(cfg);
        return { stop: vi.fn() };
      }),
    };
  }

  return { scene, registry, textObjects, rectObjects, tweenCalls };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('UIScene', () => {
  it('has UIScene as scene key', () => {
    const { scene } = buildScene();
    expect(scene._config.key).toBe('UIScene');
  });

  it('create() registers registry event listeners for player_xp', () => {
    const { scene, registry } = buildScene();
    scene.create();

    // Verify listener is registered by checking _registeredEvents
    const xpListener = scene._registeredEvents.find(
      e => e.event === 'changedata-player_xp'
    );
    expect(xpListener).toBeDefined();
  });

  it('create() registers registry event listeners for player_health', () => {
    const { scene, registry } = buildScene();
    scene.create();

    const healthListener = scene._registeredEvents.find(
      e => e.event === 'changedata-player_health'
    );
    expect(healthListener).toBeDefined();
  });

  it('registry player_xp change updates xp text', () => {
    const { scene, registry, textObjects } = buildScene();
    scene.create();

    // Set XP to 250 → xpInLevel = 250 % 100 = 50
    registry.set('player_xp', 250);

    // Find the XP text (should contain "50/100 XP")
    const xpText = textObjects.find(t => t.text === '50/100 XP');
    expect(xpText).toBeDefined();
  });

  it('registry player_money change updates money text', () => {
    const { scene, registry, textObjects } = buildScene();
    scene.create();

    registry.set('player_money', 1500);

    const moneyText = textObjects.find(t => t.text === '1500 DKK');
    expect(moneyText).toBeDefined();
  });

  it('registry player_health change updates health bar value', () => {
    const { scene, registry } = buildScene();
    scene.create();

    // Spy on the health bar's setValue
    const setValueSpy = vi.spyOn(scene._healthBar, 'setValue');
    registry.set('player_health', 75);
    expect(setValueSpy).toHaveBeenCalledWith(75, true);
  });

  it('registry time_of_day change updates time text', () => {
    const { scene, registry, textObjects } = buildScene();
    scene.create();

    registry.set('time_of_day', 'night');

    const timeText = textObjects.find(t => t.text === '🌙 Night');
    expect(timeText).toBeDefined();
  });

  it('_toggleCollapsed() toggles the collapsed state', () => {
    const { scene } = buildScene();
    scene.create();

    expect(scene.isCollapsed()).toBe(false);
    scene._toggleCollapsed();
    expect(scene.isCollapsed()).toBe(true);
    scene._toggleCollapsed();
    expect(scene.isCollapsed()).toBe(false);
  });

  it('isCollapsed() returns false initially', () => {
    const { scene } = buildScene();
    scene.create();
    expect(scene.isCollapsed()).toBe(false);
  });

  it('showNotification() delegates to notification manager', () => {
    const { scene } = buildScene();
    scene.create();

    const addSpy = vi.spyOn(scene._notificationManager, 'addNotification');
    scene.showNotification('Test message', { priority: 'high' });
    expect(addSpy).toHaveBeenCalledWith('Test message', { priority: 'high' });
  });

  // ── Animation / reduced-motion tests ────────────────────────────────────

  describe('_isReducedMotion()', () => {
    it('returns false when REDUCED_MOTION registry key is not set', () => {
      const { scene, registry } = buildScene();
      scene.create();
      expect(scene._isReducedMotion()).toBe(false);
    });

    it('returns true when REDUCED_MOTION registry key is true', () => {
      const { scene, registry } = buildScene();
      scene.create();
      registry.set(RK.REDUCED_MOTION, true);
      expect(scene._isReducedMotion()).toBe(true);
    });

    it('returns false when REDUCED_MOTION registry key is false', () => {
      const { scene, registry } = buildScene();
      scene.create();
      registry.set(RK.REDUCED_MOTION, false);
      expect(scene._isReducedMotion()).toBe(false);
    });
  });

  describe('_updateXP() — animation flag', () => {
    it('passes animate=false (reduced motion) when REDUCED_MOTION is true', () => {
      const { scene, registry } = buildScene();
      scene.create();
      registry.set(RK.REDUCED_MOTION, true);

      const spy = vi.spyOn(scene._xpBar, 'setValue');
      registry.set(RK.PLAYER_XP, 50);
      // animate should be !_isReducedMotion() = false
      expect(spy).toHaveBeenCalledWith(50, false);
    });

    it('passes animate=true when REDUCED_MOTION is false (default)', () => {
      const { scene, registry } = buildScene();
      scene.create();

      const spy = vi.spyOn(scene._xpBar, 'setValue');
      registry.set(RK.PLAYER_XP, 50);
      expect(spy).toHaveBeenCalledWith(50, true);
    });
  });

  describe('_updateHealth() — critical pulse', () => {
    it('calls _pulseCritical when health is at critical threshold (≤25)', () => {
      const { scene, registry } = buildScene({ withTweens: true });
      scene.create();
      const spy = vi.spyOn(scene, '_pulseCritical');
      registry.set(RK.PLAYER_HEALTH, 20);
      expect(spy).toHaveBeenCalled();
    });

    it('does NOT call _pulseCritical when health is above critical threshold', () => {
      const { scene, registry } = buildScene({ withTweens: true });
      scene.create();
      const spy = vi.spyOn(scene, '_pulseCritical');
      registry.set(RK.PLAYER_HEALTH, 80);
      expect(spy).not.toHaveBeenCalled();
    });

    it('_pulseCritical fires tweens.add when tweens available and not reduced motion', () => {
      const { scene, registry, tweenCalls } = buildScene({ withTweens: true });
      scene.create();
      registry.set(RK.PLAYER_HEALTH, 10);
      expect(tweenCalls.length).toBeGreaterThan(0);
    });

    it('_pulseCritical does NOT fire tweens.add when reducedMotion is true', () => {
      const { scene, registry, tweenCalls } = buildScene({ withTweens: true });
      scene.create();
      registry.set(RK.REDUCED_MOTION, true);
      // Snapshot tween count after create() — subsequent health update should not add more
      const countBefore = tweenCalls.length;
      registry.set(RK.PLAYER_HEALTH, 10);
      expect(tweenCalls.length).toBe(countBefore);
    });
  });

  describe('_updateEnergy() — critical pulse', () => {
    it('calls _pulseCritical when energy is at critical threshold (≤25)', () => {
      const { scene, registry } = buildScene({ withTweens: true });
      scene.create();
      const spy = vi.spyOn(scene, '_pulseCritical');
      registry.set(RK.PLAYER_ENERGY, 15);
      expect(spy).toHaveBeenCalled();
    });

    it('does NOT call _pulseCritical when energy is above critical threshold', () => {
      const { scene, registry } = buildScene({ withTweens: true });
      scene.create();
      const spy = vi.spyOn(scene, '_pulseCritical');
      registry.set(RK.PLAYER_ENERGY, 50);
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('_updateMoney() — flash on gain', () => {
    it('calls _flashMoneyText when money increases', () => {
      const { scene, registry } = buildScene({ withTweens: true });
      scene.create();
      // Seed initial money
      registry.set(RK.PLAYER_MONEY, 100);
      const spy = vi.spyOn(scene, '_flashMoneyText');
      // Increase money — should trigger flash
      registry.set(RK.PLAYER_MONEY, 200);
      expect(spy).toHaveBeenCalled();
    });

    it('does NOT call _flashMoneyText when money decreases', () => {
      const { scene, registry } = buildScene({ withTweens: true });
      scene.create();
      registry.set(RK.PLAYER_MONEY, 200);
      const spy = vi.spyOn(scene, '_flashMoneyText');
      registry.set(RK.PLAYER_MONEY, 100);
      expect(spy).not.toHaveBeenCalled();
    });

    it('does NOT call _flashMoneyText on first money update (no previous value)', () => {
      const { scene, registry } = buildScene({ withTweens: true });
      scene.create();
      // Clear lastMoney to simulate first-ever update
      scene._lastMoney = null;
      const spy = vi.spyOn(scene, '_flashMoneyText');
      registry.set(RK.PLAYER_MONEY, 500);
      expect(spy).not.toHaveBeenCalled();
    });
  });
});
