/**
 * src/ui/HTMLOverlayManager.js
 * DOM overlay manager for HTML-based UI panels.
 * Works gracefully in both browser and Node.js test environments.
 */

export class HTMLOverlayManager {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to.
   * @param {object} config - Configuration options.
   * @param {string[]} [config.overlayIds] - List of overlay element IDs.
   */
  constructor(scene, config = {}) {
    this._scene = scene;
    this._overlayIds = config.overlayIds ?? [
      'main-menu',
      'character-creation',
      'settings-menu',
      'pause-menu',
    ];

    // Internal state
    this._activeOverlayId = null;
    this._activeOverlayEl = null;
    this._inputBlocked = false;
    this._isListeningForEscape = false;

    // Bind the escape handler so we can add/remove the same reference
    this._boundOnEscapeKey = (event) => this._onEscapeKey(event);
  }

  /**
   * Show an overlay by its element ID.
   * @param {string} overlayId - DOM element ID.
   */
  show(overlayId) {
    // Hide current active overlay if different
    if (this._activeOverlayId && this._activeOverlayId !== overlayId) {
      this.hide(this._activeOverlayId);
    }

    if (typeof document === 'undefined') {
      // No DOM — still track state
      this._activeOverlayId = overlayId;
      this._activeOverlayEl = null;
      this._blockGameInput();
      return;
    }

    const el = document.getElementById(overlayId);
    if (!el) {
      this._activeOverlayId = overlayId;
      this._activeOverlayEl = null;
      this._blockGameInput();
      return;
    }

    this._showElement(el);
    this._activeOverlayId = overlayId;
    this._activeOverlayEl = el;
    this._blockGameInput();
    this._trapFocus(el);
    this._addEscapeListener();
  }

  /**
   * Hide an overlay by its element ID.
   * @param {string} overlayId - DOM element ID.
   */
  hide(overlayId) {
    if (!overlayId) return;

    if (typeof document !== 'undefined') {
      const el = document.getElementById(overlayId);
      if (el) {
        this._hideElement(el);
      }
    }

    if (this._activeOverlayId === overlayId) {
      this._unblockGameInput();
      this._removeEscapeListener();
      this._activeOverlayId = null;
      this._activeOverlayEl = null;
    }
  }

  /**
   * Hide the currently active overlay.
   */
  hideActive() {
    if (this._activeOverlayId) {
      this.hide(this._activeOverlayId);
    }
  }

  /**
   * Check if any overlay is currently active.
   * @returns {boolean}
   */
  isActive() {
    return this._activeOverlayId != null;
  }

  /**
   * Get the ID of the currently active overlay.
   * @returns {string|null}
   */
  getActiveId() {
    return this._activeOverlayId ?? null;
  }

  /**
   * Check if game input is blocked by an overlay.
   * @returns {boolean}
   */
  isInputBlocked() {
    return this._inputBlocked;
  }

  /**
   * Clean up: hide active overlay and remove listeners.
   */
  destroy() {
    this.hideActive();
    this._removeEscapeListener();
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /**
   * Show a DOM element by toggling CSS classes.
   * @param {HTMLElement} el
   */
  _showElement(el) {
    el.classList.remove('hidden');
    el.classList.add('active');
  }

  /**
   * Hide a DOM element by toggling CSS classes.
   * @param {HTMLElement} el
   */
  _hideElement(el) {
    el.classList.remove('active');
    el.classList.add('hidden');
  }

  /**
   * Block game input while overlay is shown.
   */
  _blockGameInput() {
    this._inputBlocked = true;
    if (this._scene && this._scene.input) {
      this._scene.input.enabled = false;
    }
  }

  /**
   * Unblock game input when overlay is hidden.
   */
  _unblockGameInput() {
    this._inputBlocked = false;
    if (this._scene && this._scene.input) {
      this._scene.input.enabled = true;
    }
  }

  /**
   * Trap focus within an overlay element.
   * @param {HTMLElement} el
   */
  _trapFocus(el) {
    const focusable = el.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    if (focusable.length > 0) {
      focusable[0].focus();
    }
  }

  /**
   * Add the Escape key listener to the document.
   */
  _addEscapeListener() {
    if (this._isListeningForEscape) return;
    if (typeof document === 'undefined') return;

    document.addEventListener('keydown', this._boundOnEscapeKey);
    this._isListeningForEscape = true;
  }

  /**
   * Remove the Escape key listener from the document.
   */
  _removeEscapeListener() {
    if (!this._isListeningForEscape) return;
    if (typeof document === 'undefined') return;

    document.removeEventListener('keydown', this._boundOnEscapeKey);
    this._isListeningForEscape = false;
  }

  /**
   * Handle Escape key press.
   * @param {KeyboardEvent} event
   */
  _onEscapeKey(event) {
    if (event.key === 'Escape') {
      this.hideActive();
    }
  }
}
