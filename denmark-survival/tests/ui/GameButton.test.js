/**
 * tests/ui/GameButton.test.js
 * Unit tests for GameButton — interactive button component with states.
 *
 * Phaser.Scene is mocked globally by tests/mocks/setupPhaser.js (vitest setupFiles).
 * All Phaser display objects are replaced with mock stubs so tests run
 * in Node.js without a canvas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GameButton, BUTTON_STATE } from '../../src/ui/GameButton.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildButton(overrides = {}) {
  const scene = {
    scale: { width: 1280, height: 720 },
    add: {
      rectangle: vi.fn().mockImplementation(() => ({
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setInteractive: vi.fn().mockReturnThis(),
        setFillStyle: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        on: vi.fn().mockImplementation(function(event, cb) {
          this._handlers = this._handlers || {};
          this._handlers[event] = cb;
          return this;
        }),
        _trigger: function(event) {
          if (this._handlers && this._handlers[event]) this._handlers[event]();
        },
        destroy: vi.fn(),
        _fillColor: 0x4a6fa5,
      })),
      text: vi.fn().mockImplementation(() => ({
        setOrigin: vi.fn().mockReturnThis(),
        setDepth: vi.fn().mockReturnThis(),
        setVisible: vi.fn().mockReturnThis(),
        setStyle: vi.fn().mockReturnThis(),
        setText: vi.fn().mockReturnThis(),
        destroy: vi.fn(),
      })),
    },
  };
  const callback = vi.fn();
  const btn = new GameButton(scene, 100, 100, 'Click Me', callback, overrides);
  return { btn, scene, callback };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('GameButton', () => {
  it('starts in NORMAL state', () => {
    const { btn } = buildButton();
    expect(btn.getState()).toBe(BUTTON_STATE.NORMAL);
  });

  it('click() triggers callback', () => {
    const { btn, callback } = buildButton();
    btn.click();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('click() does nothing when disabled', () => {
    const { btn, callback } = buildButton();
    btn.setEnabled(false);
    btn.click();
    expect(callback).not.toHaveBeenCalled();
  });

  it('setEnabled(false) changes state to DISABLED', () => {
    const { btn } = buildButton();
    btn.setEnabled(false);
    expect(btn.getState()).toBe(BUTTON_STATE.DISABLED);
  });

  it('setEnabled(true) restores NORMAL state', () => {
    const { btn } = buildButton();
    btn.setEnabled(false);
    btn.setEnabled(true);
    expect(btn.getState()).toBe(BUTTON_STATE.NORMAL);
  });

  it('isEnabled() returns false when disabled', () => {
    const { btn } = buildButton();
    btn.setEnabled(false);
    expect(btn.isEnabled()).toBe(false);
  });

  it('pointerover event changes state to HOVER', () => {
    const { btn } = buildButton();
    btn._bg._trigger('pointerover');
    expect(btn.getState()).toBe(BUTTON_STATE.HOVER);
  });

  it('pointerout event restores NORMAL state', () => {
    const { btn } = buildButton();
    btn._bg._trigger('pointerover');
    btn._bg._trigger('pointerout');
    expect(btn.getState()).toBe(BUTTON_STATE.NORMAL);
  });

  it('pointerdown changes state to PRESSED', () => {
    const { btn } = buildButton();
    btn._bg._trigger('pointerdown');
    expect(btn.getState()).toBe(BUTTON_STATE.PRESSED);
  });

  it('pointerup fires callback and returns to NORMAL', () => {
    const { btn, callback } = buildButton();
    btn._bg._trigger('pointerdown');
    btn._bg._trigger('pointerup');
    expect(callback).toHaveBeenCalledTimes(1);
    expect(btn.getState()).toBe(BUTTON_STATE.NORMAL);
  });

  it('hover events ignored when disabled', () => {
    const { btn } = buildButton();
    btn.setEnabled(false);
    btn._bg._trigger('pointerover');
    expect(btn.getState()).toBe(BUTTON_STATE.DISABLED);
    btn._bg._trigger('pointerout');
    expect(btn.getState()).toBe(BUTTON_STATE.DISABLED);
  });

  it('height is clamped to minimum 44px', () => {
    const { scene } = buildButton({ height: 20 });
    // The rectangle call should have been made with height >= 44
    const rectCall = scene.add.rectangle.mock.calls[0];
    expect(rectCall[3]).toBeGreaterThanOrEqual(44);
  });

  it('setLabel updates the text', () => {
    const { btn } = buildButton();
    btn.setLabel('New Label');
    expect(btn._text.setText).toHaveBeenCalledWith('New Label');
  });

  it('destroy removes all game objects', () => {
    const { btn } = buildButton();
    const bgDestroy = btn._bg.destroy;
    const textDestroy = btn._text.destroy;
    btn.destroy();
    expect(bgDestroy).toHaveBeenCalled();
    expect(textDestroy).toHaveBeenCalled();
    expect(btn._bg).toBeNull();
    expect(btn._text).toBeNull();
  });

  it('setVisible hides both background and text', () => {
    const { btn } = buildButton();
    btn.setVisible(false);
    expect(btn._bg.setVisible).toHaveBeenCalledWith(false);
    expect(btn._text.setVisible).toHaveBeenCalledWith(false);
  });

  it('setVisible(true) shows both background and text', () => {
    const { btn } = buildButton();
    btn.setVisible(false);
    btn.setVisible(true);
    expect(btn._bg.setVisible).toHaveBeenCalledWith(true);
    expect(btn._text.setVisible).toHaveBeenCalledWith(true);
  });

  it('pointerdown ignored when disabled', () => {
    const { btn } = buildButton();
    btn.setEnabled(false);
    btn._bg._trigger('pointerdown');
    expect(btn.getState()).toBe(BUTTON_STATE.DISABLED);
  });

  it('pointerup does not fire callback when disabled', () => {
    const { btn, callback } = buildButton();
    btn.setEnabled(false);
    btn._bg._trigger('pointerup');
    expect(callback).not.toHaveBeenCalled();
  });
});
