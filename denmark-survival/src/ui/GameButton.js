/**
 * src/ui/GameButton.js
 * Interactive button component with visual state feedback.
 * Supports normal, hover, pressed, and disabled states.
 */

// Button state constants
export const BUTTON_STATE = {
  NORMAL: 'normal',
  HOVER: 'hover',
  PRESSED: 'pressed',
  DISABLED: 'disabled',
};

// State-to-color mappings
const STATE_COLORS = {
  [BUTTON_STATE.NORMAL]: 0x4a6fa5,
  [BUTTON_STATE.HOVER]: 0x5b82c0,
  [BUTTON_STATE.PRESSED]: 0x3a5a8a,
  [BUTTON_STATE.DISABLED]: 0x666666,
};

const TEXT_COLORS = {
  [BUTTON_STATE.NORMAL]: '#ffffff',
  [BUTTON_STATE.HOVER]: '#ffffff',
  [BUTTON_STATE.PRESSED]: '#cccccc',
  [BUTTON_STATE.DISABLED]: '#999999',
};

export class GameButton {
  /**
   * @param {Phaser.Scene} scene - The scene this button belongs to.
   * @param {number} x - X position (center).
   * @param {number} y - Y position (center).
   * @param {string} label - Button text label.
   * @param {Function} callback - Function called on click/pointerup.
   * @param {object} config - Configuration options.
   * @param {number} [config.width=160] - Button width.
   * @param {number} [config.height=44] - Button height (min 44).
   * @param {number} [config.depth=0] - Render depth.
   */
  constructor(scene, x, y, label, callback, config = {}) {
    this._scene = scene;
    this._callback = callback;
    this._state = BUTTON_STATE.NORMAL;

    const width = config.width ?? 160;
    const height = Math.max(44, config.height ?? 44);
    const depth = config.depth ?? 0;

    // Background rectangle
    this._bg = scene.add.rectangle(x, y, width, height, STATE_COLORS[BUTTON_STATE.NORMAL]);
    this._bg.setOrigin(0.5, 0.5);
    this._bg.setDepth(depth);
    this._bg.setInteractive();

    // Text label
    this._text = scene.add.text(x, y, label, {
      fontSize: '16px',
      color: TEXT_COLORS[BUTTON_STATE.NORMAL],
    });
    this._text.setOrigin(0.5, 0.5);
    this._text.setDepth(depth + 1);

    // Pointer events
    this._bg.on('pointerover', () => {
      if (this._state !== BUTTON_STATE.DISABLED) {
        this._setState(BUTTON_STATE.HOVER);
      }
    });

    this._bg.on('pointerout', () => {
      if (this._state !== BUTTON_STATE.DISABLED) {
        this._setState(BUTTON_STATE.NORMAL);
      }
    });

    this._bg.on('pointerdown', () => {
      if (this._state !== BUTTON_STATE.DISABLED) {
        this._setState(BUTTON_STATE.PRESSED);
      }
    });

    this._bg.on('pointerup', () => {
      if (this._state !== BUTTON_STATE.DISABLED) {
        this._setState(BUTTON_STATE.NORMAL);
        if (this._callback) {
          this._callback();
        }
      }
    });
  }

  /**
   * Get the current button state.
   * @returns {string}
   */
  getState() {
    return this._state;
  }

  /**
   * Programmatically click the button (calls callback if not disabled).
   */
  click() {
    if (this._state !== BUTTON_STATE.DISABLED && this._callback) {
      this._callback();
    }
  }

  /**
   * Enable or disable the button.
   * @param {boolean} enabled
   */
  setEnabled(enabled) {
    if (enabled) {
      this._setState(BUTTON_STATE.NORMAL);
    } else {
      this._setState(BUTTON_STATE.DISABLED);
    }
  }

  /**
   * Check if the button is enabled.
   * @returns {boolean}
   */
  isEnabled() {
    return this._state !== BUTTON_STATE.DISABLED;
  }

  /**
   * Update the text label.
   * @param {string} text
   */
  setLabel(text) {
    this._text.setText(text);
  }

  /**
   * Toggle visibility of all elements.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this._bg.setVisible(visible);
    this._text.setVisible(visible);
  }

  /**
   * Destroy all game objects.
   */
  destroy() {
    if (this._bg) this._bg.destroy();
    if (this._text) this._text.destroy();
    this._bg = null;
    this._text = null;
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /**
   * Update visual state of the button.
   * @param {string} state - One of BUTTON_STATE values.
   */
  _setState(state) {
    this._state = state;
    this._bg.setFillStyle(STATE_COLORS[state]);
    this._text.setStyle({ color: TEXT_COLORS[state] });
  }
}
