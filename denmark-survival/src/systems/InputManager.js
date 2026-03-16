/**
 * src/systems/InputManager.js
 * Centralised input handler for Denmark Survival.
 *
 * Responsibilities:
 *  - Provide a single source of truth for all keyboard input.
 *  - Expose normalised directional booleans (WASD + Arrow Keys).
 *  - Handle action keys: E (interact), Space (confirm), Escape (pause),
 *    Tab (inventory), M (map).
 *  - Block all input when overlay scenes are active.
 *  - Debounce the interact key to prevent accidental double-triggers.
 */

/** Debounce window for the interact key in milliseconds. */
export const INTERACT_DEBOUNCE_MS = 200;

export class InputManager {
  /**
   * @param {Phaser.Scene} scene - The owning scene (used to create key bindings).
   */
  constructor(scene) {
    this.scene = scene;

    /** Whether input is currently blocked (e.g. overlay is open). */
    this._blocked = false;

    /** Timestamp of the last interact key press (for debouncing). */
    this._lastInteractTime = -Infinity;

    // Set up keyboard bindings.
    this._cursors     = null;
    this._wasdKeys    = null;
    this._keyInteract = null;
    this._keyConfirm  = null;
    this._keyEscape   = null;
    this._keyInventory = null;
    this._keyMap      = null;

    this._setupKeys();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Block all input. Call when opening an overlay scene.
   */
  blockInput() {
    this._blocked = true;
  }

  /**
   * Unblock input. Call when closing an overlay scene.
   */
  unblockInput() {
    this._blocked = false;
  }

  /**
   * Whether input is currently blocked.
   * @returns {boolean}
   */
  isBlocked() {
    return this._blocked;
  }

  /**
   * Returns normalised directional booleans for the current frame.
   * Returns all-false when input is blocked.
   *
   * @returns {{ left: boolean, right: boolean, up: boolean, down: boolean }}
   */
  getMovementInput() {
    if (this._blocked) {
      return { left: false, right: false, up: false, down: false };
    }

    const cursors  = this._cursors  || {};
    const wasd     = this._wasdKeys || {};

    return {
      left:  !!(cursors.left?.isDown  || wasd.A?.isDown),
      right: !!(cursors.right?.isDown || wasd.D?.isDown),
      up:    !!(cursors.up?.isDown    || wasd.W?.isDown),
      down:  !!(cursors.down?.isDown  || wasd.S?.isDown),
    };
  }

  /**
   * Whether movement keys produce a non-zero vector.
   * @returns {boolean}
   */
  isMoving() {
    const { left, right, up, down } = this.getMovementInput();
    return left || right || up || down;
  }

  /**
   * Whether the interact key (E) was just pressed, respecting the debounce.
   * Consumes the press (records the timestamp) when returning true.
   *
   * @param {number} [now] - Current timestamp in ms. Defaults to Date.now().
   * @returns {boolean}
   */
  isInteractJustPressed(now = Date.now()) {
    if (this._blocked) return false;
    if (!this._keyInteract?.isDown) return false;
    if (now - this._lastInteractTime < INTERACT_DEBOUNCE_MS) return false;
    this._lastInteractTime = now;
    return true;
  }

  /**
   * Whether the confirm key (Space) is currently down.
   * @returns {boolean}
   */
  isConfirmDown() {
    if (this._blocked) return false;
    return !!(this._keyConfirm?.isDown);
  }

  /**
   * Whether the escape key is currently down.
   * @returns {boolean}
   */
  isEscapeDown() {
    if (this._blocked) return false;
    return !!(this._keyEscape?.isDown);
  }

  /**
   * Whether the inventory key (Tab) is currently down.
   * @returns {boolean}
   */
  isInventoryDown() {
    if (this._blocked) return false;
    return !!(this._keyInventory?.isDown);
  }

  /**
   * Whether the map key (M) is currently down.
   * @returns {boolean}
   */
  isMapDown() {
    if (this._blocked) return false;
    return !!(this._keyMap?.isDown);
  }

  /**
   * Destroy key objects and release resources.
   */
  destroy() {
    // Phaser KeyboardPlugin keys are cleaned up with the scene.
    // Nothing extra required here.
  }

  // ---------------------------------------------------------------------------
  // Private
  // ---------------------------------------------------------------------------

  _setupKeys() {
    const keyboard = this.scene?.input?.keyboard;
    if (!keyboard) return;

    // Cursor keys (Arrow Keys).
    if (typeof keyboard.createCursorKeys === 'function') {
      this._cursors = keyboard.createCursorKeys();
    }

    // WASD keys.
    if (typeof keyboard.addKey === 'function') {
      this._wasdKeys = {
        W: keyboard.addKey('W'),
        A: keyboard.addKey('A'),
        S: keyboard.addKey('S'),
        D: keyboard.addKey('D'),
      };

      this._keyInteract  = keyboard.addKey('E');
      this._keyConfirm   = keyboard.addKey('SPACE');
      this._keyEscape    = keyboard.addKey('ESC');
      this._keyInventory = keyboard.addKey('TAB');
      this._keyMap       = keyboard.addKey('M');
    }
  }
}
