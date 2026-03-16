/**
 * src/ui/Panel.js
 * Container panel with optional title and close button.
 * Used as a building block for dialogs, menus, and overlays.
 */

import { GameButton } from './GameButton.js';

export class Panel {
  /**
   * @param {Phaser.Scene} scene - The scene this panel belongs to.
   * @param {number} x - X position (center).
   * @param {number} y - Y position (center).
   * @param {object} config - Configuration options.
   * @param {number} [config.width=300] - Panel width.
   * @param {number} [config.height=200] - Panel height.
   * @param {number} [config.bgColor=0x1a1a2e] - Background color.
   * @param {number} [config.bgAlpha=0.9] - Background opacity.
   * @param {number} [config.borderColor=0x4a6fa5] - Border color.
   * @param {string|null} [config.title=null] - Optional title text.
   * @param {boolean} [config.hasClose=false] - Show close button.
   * @param {Function|null} [config.onClose=null] - Close callback.
   * @param {number} [config.depth=10] - Render depth.
   */
  constructor(scene, x, y, config = {}) {
    this._scene = scene;
    this._x = x;
    this._y = y;
    this._children = [];

    const width = config.width ?? 300;
    const height = config.height ?? 200;
    const bgColor = config.bgColor ?? 0x1a1a2e;
    const bgAlpha = config.bgAlpha ?? 0.9;
    const borderColor = config.borderColor ?? 0x4a6fa5;
    const title = config.title ?? null;
    const hasClose = config.hasClose ?? false;
    const onClose = config.onClose ?? null;
    const depth = config.depth ?? 10;

    // Border rectangle (slightly larger, behind background)
    this._border = scene.add.rectangle(x, y, width + 4, height + 4, borderColor);
    this._border.setOrigin(0.5, 0.5);
    this._border.setDepth(depth - 1);

    // Background rectangle
    this._bg = scene.add.rectangle(x, y, width, height, bgColor);
    this._bg.setOrigin(0.5, 0.5);
    this._bg.setDepth(depth);
    this._bg.setAlpha(bgAlpha);

    // Optional title text
    this._title = null;
    if (title) {
      this._title = scene.add.text(x, y - height / 2 + 20, title, {
        fontSize: '18px',
        color: '#ffffff',
        fontStyle: 'bold',
      });
      this._title.setOrigin(0.5, 0.5);
      this._title.setDepth(depth + 1);
    }

    // Optional close button
    this._closeButton = null;
    if (hasClose) {
      this._closeButton = new GameButton(
        scene,
        x + width / 2 - 20,
        y - height / 2 + 20,
        'X',
        onClose || (() => {}),
        { width: 30, height: 44, depth: depth + 1 }
      );
    }
  }

  /**
   * Toggle visibility of all panel elements and children.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this._border.setVisible(visible);
    this._bg.setVisible(visible);
    if (this._title) {
      this._title.setVisible(visible);
    }
    if (this._closeButton) {
      this._closeButton.setVisible(visible);
    }
    for (const child of this._children) {
      child.setVisible(visible);
    }
  }

  /**
   * Add a child element to the panel.
   * Child must have a setVisible(v) method.
   * @param {object} child
   */
  addChild(child) {
    this._children.push(child);
  }

  /**
   * Destroy all game objects.
   */
  destroy() {
    if (this._border) this._border.destroy();
    if (this._bg) this._bg.destroy();
    if (this._title) this._title.destroy();
    if (this._closeButton) this._closeButton.destroy();
    for (const child of this._children) {
      if (child && typeof child.destroy === 'function') {
        child.destroy();
      }
    }
    this._border = null;
    this._bg = null;
    this._title = null;
    this._closeButton = null;
    this._children = [];
  }
}
