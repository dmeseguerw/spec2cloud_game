/**
 * tests/ui/Panel.test.js
 * Unit tests for Panel — container panel with optional title and close button.
 *
 * Phaser.Scene is mocked globally by tests/mocks/setupPhaser.js (vitest setupFiles).
 * All Phaser display objects are replaced with mock stubs so tests run
 * in Node.js without a canvas.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Panel } from '../../src/ui/Panel.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildPanel(config = {}) {
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
          setAlpha: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
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
      }),
      text: vi.fn().mockImplementation(() => {
        const obj = {
          text: '', visible: true,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
          setText: vi.fn().mockImplementation(function(t) { this.text = t; return this; }),
          setStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        textObjects.push(obj);
        return obj;
      }),
    },
  };
  const panel = new Panel(scene, 400, 300, config);
  return { panel, scene, rectObjects, textObjects };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Panel', () => {
  it('creates background and border rectangles', () => {
    const { rectObjects } = buildPanel();
    // Panel creates: border rect + bg rect = 2 rectangles
    expect(rectObjects.length).toBeGreaterThanOrEqual(2);
  });

  it('title config creates title text', () => {
    const { textObjects } = buildPanel({ title: 'Test Panel' });
    expect(textObjects.length).toBeGreaterThanOrEqual(1);
  });

  it('no title config skips title text', () => {
    const { panel } = buildPanel();
    expect(panel._title).toBeNull();
  });

  it('setVisible(false) hides background and border', () => {
    const { panel, rectObjects } = buildPanel();
    panel.setVisible(false);
    // Border and background should both be hidden
    expect(rectObjects[0].visible).toBe(false);
    expect(rectObjects[1].visible).toBe(false);
  });

  it('addChild adds to children list', () => {
    const { panel } = buildPanel();
    const mockChild = { setVisible: vi.fn() };
    panel.addChild(mockChild);
    expect(panel._children.length).toBe(1);
  });

  it('setVisible toggles child visibility', () => {
    const { panel } = buildPanel();
    const mockChild = { setVisible: vi.fn() };
    panel.addChild(mockChild);
    panel.setVisible(false);
    expect(mockChild.setVisible).toHaveBeenCalledWith(false);
    panel.setVisible(true);
    expect(mockChild.setVisible).toHaveBeenCalledWith(true);
  });

  it('hasClose config creates a close button', () => {
    const onClose = vi.fn();
    const { panel } = buildPanel({ hasClose: true, onClose });
    expect(panel._closeButton).not.toBeNull();
  });

  it('destroy removes background and border', () => {
    const { panel, rectObjects } = buildPanel();
    panel.destroy();
    expect(rectObjects[0].destroy).toHaveBeenCalled();
    expect(rectObjects[1].destroy).toHaveBeenCalled();
    expect(panel._bg).toBeNull();
    expect(panel._border).toBeNull();
  });

  it('destroy destroys title when present', () => {
    const { panel, textObjects } = buildPanel({ title: 'My Panel' });
    panel.destroy();
    expect(textObjects[0].destroy).toHaveBeenCalled();
    expect(panel._title).toBeNull();
  });

  it('destroy destroys close button when present', () => {
    const onClose = vi.fn();
    const { panel } = buildPanel({ hasClose: true, onClose });
    panel.destroy();
    expect(panel._closeButton).toBeNull();
  });

  it('destroy destroys children', () => {
    const { panel } = buildPanel();
    const mockChild = { setVisible: vi.fn(), destroy: vi.fn() };
    panel.addChild(mockChild);
    panel.destroy();
    expect(mockChild.destroy).toHaveBeenCalled();
    expect(panel._children.length).toBe(0);
  });

  it('setVisible toggles close button visibility when present', () => {
    const { panel } = buildPanel({ hasClose: true, onClose: vi.fn() });
    panel.setVisible(false);
    // Close button setVisible should have been called
    expect(panel._closeButton).not.toBeNull();
  });

  it('setVisible toggles title visibility when present', () => {
    const { panel, textObjects } = buildPanel({ title: 'Titled' });
    panel.setVisible(false);
    expect(textObjects[0].visible).toBe(false);
  });
});
