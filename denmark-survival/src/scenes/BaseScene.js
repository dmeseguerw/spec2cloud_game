/**
 * src/scenes/BaseScene.js
 * Base scene class that all Denmark Survival scenes should extend.
 *
 * Provides:
 *  - Standard lifecycle pattern (init, create, update, shutdown)
 *  - Transition helper methods (fade, slide, instant)
 *  - Overlay management (launch, close)
 *  - Automatic event listener cleanup on shutdown
 */

import {
  fadeToScene,
  fadeIn,
  slideToScene,
  instantTransition,
  launchOverlay,
  closeOverlay,
  DEFAULT_FADE_DURATION,
} from './SceneTransition.js';

export class BaseScene extends Phaser.Scene {
  constructor(config) {
    super(config);

    /** Data passed from the previous scene via init(). */
    this._sceneData = {};

    /** Key of the parent scene (set when launched as an overlay). */
    this._parentSceneKey = null;

    /** Whether this scene is an overlay. */
    this._isOverlay = false;

    /** Track registered event listeners for cleanup. */
    this._registeredEvents = [];
  }

  // ---------------------------------------------------------------------------
  // Lifecycle hooks — subclasses override these instead of Phaser methods
  // ---------------------------------------------------------------------------

  /**
   * Called when the scene receives transition data.
   * Override in subclasses to capture data from the launching scene.
   *
   * @param {object} data - Data passed via scene.start() or scene.launch().
   */
  init(data = {}) {
    this._sceneData = { ...data };

    // Track parent scene key for overlay behaviour
    if (data._parentSceneKey) {
      this._parentSceneKey = data._parentSceneKey;
      this._isOverlay = true;
      // Remove internal key from user-facing data
      delete this._sceneData._parentSceneKey;
    }
  }

  /**
   * Standard shutdown — removes tracked event listeners and cleans up.
   * Subclasses should call super.shutdown() if they override this.
   */
  shutdown() {
    // Remove all tracked event listeners
    for (const { emitter, event, fn } of this._registeredEvents) {
      if (emitter && typeof emitter.off === 'function') {
        emitter.off(event, fn);
      }
    }
    this._registeredEvents = [];
    this._sceneData = {};
    this._parentSceneKey = null;
    this._isOverlay = false;
  }

  // ---------------------------------------------------------------------------
  // Event helpers — tracked for automatic cleanup
  // ---------------------------------------------------------------------------

  /**
   * Register an event listener that will be automatically removed on shutdown.
   *
   * @param {EventEmitter} emitter - The event emitter (e.g. this.events, this.registry.events).
   * @param {string}       event   - Event name.
   * @param {Function}     fn      - Handler function.
   */
  trackEvent(emitter, event, fn) {
    if (emitter && typeof emitter.on === 'function') {
      emitter.on(event, fn);
      this._registeredEvents.push({ emitter, event, fn });
    }
  }

  // ---------------------------------------------------------------------------
  // Transition helpers
  // ---------------------------------------------------------------------------

  /**
   * Fade transition to another scene.
   *
   * @param {string} target        - Target scene key.
   * @param {object} [data]        - Data to pass to the target scene.
   * @param {number} [duration]    - Fade duration in ms.
   */
  transitionTo(target, data = {}, duration = DEFAULT_FADE_DURATION) {
    fadeToScene(this, target, data, duration);
  }

  /**
   * Fade the camera in from black (call in create()).
   *
   * @param {number}   [duration]   - Fade duration in ms.
   * @param {Function} [onComplete] - Callback when fade-in finishes.
   */
  fadeInCamera(duration = DEFAULT_FADE_DURATION, onComplete) {
    fadeIn(this, duration, onComplete);
  }

  /**
   * Slide transition to another scene.
   *
   * @param {string} target       - Target scene key.
   * @param {string} direction    - Slide direction (left, right, up, down).
   * @param {object} [data]       - Data to pass to the target scene.
   * @param {number} [duration]   - Slide duration in ms.
   */
  slideTo(target, direction, data = {}, duration = DEFAULT_FADE_DURATION) {
    slideToScene(this, target, direction, data, duration);
  }

  /**
   * Instant transition to another scene (no animation).
   *
   * @param {string} target - Target scene key.
   * @param {object} [data] - Data to pass to the target scene.
   */
  goTo(target, data = {}) {
    instantTransition(this, target, data);
  }

  // ---------------------------------------------------------------------------
  // Overlay helpers
  // ---------------------------------------------------------------------------

  /**
   * Launch a scene as an overlay on top of this scene.
   *
   * @param {string} overlayKey - Key of the overlay scene to launch.
   * @param {object} [data]     - Data to pass to the overlay scene.
   */
  openOverlay(overlayKey, data = {}) {
    launchOverlay(this, overlayKey, data);
  }

  /**
   * Close this overlay scene and resume the parent scene.
   * Only works if this scene was launched as an overlay.
   */
  closeOverlay() {
    if (this._isOverlay) {
      closeOverlay(this);
    }
  }

  /**
   * Create a semi-transparent dark background for overlay scenes.
   * Call this in create() for scenes that act as overlays.
   *
   * @param {number} [alpha=0.6] - Background opacity (0-1).
   * @returns {Phaser.GameObjects.Rectangle|object} The background rectangle.
   */
  createOverlayBackground(alpha = 0.6) {
    const { width, height } = this.scale;
    const bg = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, alpha);
    bg.setDepth(-1);
    bg.setInteractive(); // Capture clicks so they don't pass through
    return bg;
  }
}
