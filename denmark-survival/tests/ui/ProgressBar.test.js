/**
 * tests/ui/ProgressBar.test.js
 * Unit tests for ProgressBar — animated progress bar component.
 *
 * Phaser.Scene is mocked globally by tests/mocks/setupPhaser.js (vitest setupFiles).
 * All Phaser display objects are replaced with mock stubs so tests run
 * in Node.js without a canvas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProgressBar } from '../../src/ui/ProgressBar.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildBar(config = {}) {
  const rectObjects = [];
  const textObjects = [];
  const scene = {
    scale: { width: 1280, height: 720 },
    add: {
      rectangle: vi.fn().mockImplementation(() => {
        const obj = {
          x: 0, y: 0, width: 0, height: 0, visible: true, depth: 0,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
          destroy: vi.fn(),
        };
        rectObjects.push(obj);
        return obj;
      }),
      text: vi.fn().mockImplementation(() => {
        const obj = {
          text: '', visible: true,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
          setText: vi.fn().mockImplementation(function(t) { this.text = t; return this; }),
          destroy: vi.fn(),
        };
        textObjects.push(obj);
        return obj;
      }),
    },
  };
  const bar = new ProgressBar(scene, 100, 100, config);
  return { bar, scene, rectObjects, textObjects };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ProgressBar', () => {
  it('constructor uses config values for max and value', () => {
    const { bar } = buildBar({ max: 50, value: 25 });
    expect(bar.getValue()).toBe(25);
    expect(bar._max).toBe(50);
  });

  it('getValue returns current value', () => {
    const { bar } = buildBar({ max: 100, value: 60 });
    expect(bar.getValue()).toBe(60);
  });

  it('setValue clamps below 0 to 0', () => {
    const { bar } = buildBar({ max: 100, value: 50 });
    bar.setValue(-10, false);
    expect(bar.getValue()).toBe(0);
  });

  it('setValue clamps above max to max', () => {
    const { bar } = buildBar({ max: 100, value: 50 });
    bar.setValue(200, false);
    expect(bar.getValue()).toBe(100);
  });

  it('setValue updates fill width proportionally', () => {
    const { bar, rectObjects } = buildBar({ width: 200, max: 100, value: 100 });
    const fill = rectObjects[1]; // Second rect is the fill
    bar.setValue(50, false);
    expect(fill.width).toBe(100); // 50/100 * 200 = 100
  });

  it('setValue with animate=false immediately updates fill', () => {
    const { bar, rectObjects } = buildBar({ width: 200, max: 100, value: 100 });
    const fill = rectObjects[1];
    bar.setValue(25, false);
    expect(fill.width).toBe(50); // 25/100 * 200 = 50
  });

  it('setMax updates maximum and clamps value if needed', () => {
    const { bar } = buildBar({ max: 100, value: 80 });
    bar.setMax(50);
    expect(bar._max).toBe(50);
    expect(bar.getValue()).toBe(50);
  });

  it('setVisible(false) hides background and fill', () => {
    const { bar, rectObjects } = buildBar();
    bar.setVisible(false);
    expect(rectObjects[0].visible).toBe(false);
    expect(rectObjects[1].visible).toBe(false);
  });

  it('setVisible(true) shows background and fill', () => {
    const { bar, rectObjects } = buildBar();
    bar.setVisible(false);
    bar.setVisible(true);
    expect(rectObjects[0].visible).toBe(true);
    expect(rectObjects[1].visible).toBe(true);
  });

  it('destroy removes game objects', () => {
    const { bar, rectObjects } = buildBar();
    bar.destroy();
    expect(rectObjects[0].destroy).toHaveBeenCalled();
    expect(rectObjects[1].destroy).toHaveBeenCalled();
    expect(bar._bg).toBeNull();
    expect(bar._fill).toBeNull();
  });

  it('destroy also destroys label when showLabel is true', () => {
    const { bar, textObjects } = buildBar({ showLabel: true });
    bar.destroy();
    expect(textObjects[0].destroy).toHaveBeenCalled();
    expect(bar._label).toBeNull();
  });

  it('showLabel creates a text element', () => {
    const { bar, textObjects } = buildBar({ showLabel: true });
    expect(textObjects.length).toBe(1);
  });

  it('label text shows correct percentage after setValue', () => {
    const { bar, textObjects } = buildBar({ showLabel: true, max: 100, value: 100 });
    bar.setValue(75, false);
    expect(textObjects[0].text).toBe('75%');
  });

  it('setValue with scene.tweens uses tween animation', () => {
    const tweenAdd = vi.fn();
    const rectObjects = [];
    const scene = {
      scale: { width: 1280, height: 720 },
      tweens: { add: tweenAdd },
      add: {
        rectangle: vi.fn().mockImplementation(() => {
          const obj = {
            x: 0, y: 0, width: 0, height: 0, visible: true, depth: 0,
            setOrigin: vi.fn().mockReturnThis(),
            setDepth: vi.fn().mockReturnThis(),
            setScrollFactor: vi.fn().mockReturnThis(),
            setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
            destroy: vi.fn(),
          };
          rectObjects.push(obj);
          return obj;
        }),
        text: vi.fn().mockImplementation(() => ({
          text: '', visible: true,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockReturnThis(),
          setText: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        })),
      },
    };
    const bar = new ProgressBar(scene, 100, 100, { max: 100, value: 100 });
    bar.setValue(50, true);
    expect(tweenAdd).toHaveBeenCalled();
    const tweenConfig = tweenAdd.mock.calls[0][0];
    expect(tweenConfig.targets).toBe(rectObjects[1]);
    expect(tweenConfig.width).toBe(100); // 50/100 * 200
    expect(tweenConfig.duration).toBe(300);
  });

  it('setMax does not clamp value when value <= new max', () => {
    const { bar } = buildBar({ max: 100, value: 30 });
    bar.setMax(50);
    expect(bar.getValue()).toBe(30); // 30 <= 50, no clamping
  });

  it('_computeFillWidth returns 0 when max is 0', () => {
    const { bar, rectObjects } = buildBar({ max: 0, value: 0 });
    const fill = rectObjects[1];
    expect(fill.width).toBe(0);
  });

  it('setVisible hides label when showLabel is true', () => {
    const { bar, textObjects } = buildBar({ showLabel: true });
    bar.setVisible(false);
    expect(textObjects[0].visible).toBe(false);
  });

  it('label shows 0% when max is 0', () => {
    const { bar, textObjects } = buildBar({ showLabel: true, max: 0, value: 0 });
    expect(textObjects[0].text).toBe('0%');
  });

  it('setMax updates label when showLabel is true', () => {
    const { bar, textObjects } = buildBar({ showLabel: true, max: 100, value: 50 });
    bar.setMax(200);
    // value stays 50, max now 200 => 25%
    expect(textObjects[0].text).toBe('25%');
  });
});
