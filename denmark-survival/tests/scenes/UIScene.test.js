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

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Build a fresh UIScene instance with all required Phaser context stubbed.
 * Returns the scene together with the mock registry for event testing.
 */
function buildScene() {
  const scene = new UIScene();

  const textObjects = [];
  const rectObjects = [];

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

  return { scene, registry, textObjects, rectObjects };
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
});
