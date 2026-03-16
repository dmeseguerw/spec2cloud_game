/**
 * src/ui/ProgressBar.js
 * Animated progress bar using Phaser Game Objects.
 * Supports value clamping, tween animation, and optional percentage label.
 */

export class ProgressBar {
  /**
   * @param {Phaser.Scene} scene - The scene this bar belongs to.
   * @param {number} x - X position.
   * @param {number} y - Y position.
   * @param {object} config - Configuration options.
   * @param {number} [config.width=200] - Bar width in pixels.
   * @param {number} [config.height=20] - Bar height in pixels.
   * @param {number} [config.bgColor=0x333333] - Background color.
   * @param {number} [config.fillColor=0x00aa00] - Fill color.
   * @param {number} [config.max=100] - Maximum value.
   * @param {number} [config.value] - Initial value (defaults to max).
   * @param {boolean} [config.showLabel=false] - Show percentage label.
   * @param {number} [config.depth=0] - Render depth.
   */
  constructor(scene, x, y, config = {}) {
    this._scene = scene;
    this._x = x;
    this._y = y;

    // Configuration with defaults
    this._width = config.width ?? 200;
    this._height = config.height ?? 20;
    this._bgColor = config.bgColor ?? 0x333333;
    this._fillColor = config.fillColor ?? 0x00aa00;
    this._max = config.max ?? 100;
    this._value = config.value ?? this._max;
    this._showLabel = config.showLabel ?? false;
    this._depth = config.depth ?? 0;

    // Game object references
    this._bg = null;
    this._fill = null;
    this._label = null;

    this._create();
  }

  /**
   * Set the current value with optional animation.
   * @param {number} value - New value (clamped to [0, max]).
   * @param {boolean} [animate=true] - Whether to tween the change.
   */
  setValue(value, animate = true) {
    this._value = Math.max(0, Math.min(this._max, value));
    const targetWidth = this._computeFillWidth(this._value);

    if (animate && this._scene.tweens) {
      this._scene.tweens.add({
        targets: this._fill,
        width: targetWidth,
        duration: 300,
      });
    } else {
      this._setFillWidth(targetWidth);
    }

    if (this._label) {
      this._updateLabel();
    }
  }

  /**
   * Get the current value.
   * @returns {number}
   */
  getValue() {
    return this._value;
  }

  /**
   * Update the maximum value and clamp current value if needed.
   * @param {number} max - New maximum value.
   */
  setMax(max) {
    this._max = max;
    if (this._value > this._max) {
      this._value = this._max;
    }
    const targetWidth = this._computeFillWidth(this._value);
    this._setFillWidth(targetWidth);

    if (this._label) {
      this._updateLabel();
    }
  }

  /**
   * Toggle visibility of all bar elements.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this._bg.setVisible(visible);
    this._fill.setVisible(visible);
    if (this._label) {
      this._label.setVisible(visible);
    }
  }

  /**
   * Destroy all game objects.
   */
  destroy() {
    if (this._bg) this._bg.destroy();
    if (this._fill) this._fill.destroy();
    if (this._label) this._label.destroy();
    this._bg = null;
    this._fill = null;
    this._label = null;
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /**
   * Compute fill width for a given value.
   * @param {number} value
   * @returns {number}
   */
  _computeFillWidth(value) {
    return this._max > 0 ? (value / this._max) * this._width : 0;
  }

  /**
   * Set the fill rectangle width directly.
   * @param {number} w
   */
  _setFillWidth(w) {
    this._fill.width = w;
  }

  /**
   * Update the label text with current percentage.
   */
  _updateLabel() {
    const pct = this._max > 0 ? Math.round((this._value / this._max) * 100) : 0;
    this._label.setText(`${pct}%`);
  }

  /**
   * Instantiate all game objects.
   */
  _create() {
    // Background rectangle
    this._bg = this._scene.add.rectangle(this._x, this._y, this._width, this._height, this._bgColor);
    this._bg.setOrigin(0, 0.5);
    this._bg.setDepth(this._depth);
    this._bg.setScrollFactor(0);

    // Fill rectangle
    const fillWidth = this._computeFillWidth(this._value);
    this._fill = this._scene.add.rectangle(this._x, this._y, this._width, this._height, this._fillColor);
    this._fill.setOrigin(0, 0.5);
    this._fill.setDepth(this._depth);
    this._fill.setScrollFactor(0);
    this._fill.width = fillWidth;

    // Optional label
    if (this._showLabel) {
      this._label = this._scene.add.text(
        this._x + this._width / 2,
        this._y,
        '',
        { fontSize: '12px', color: '#ffffff' }
      );
      this._label.setOrigin(0.5, 0.5);
      this._label.setDepth(this._depth + 1);
      this._label.setScrollFactor(0);
      this._updateLabel();
    }
  }
}
