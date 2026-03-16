/**
 * src/ui/NotificationManager.js
 * Toast notification queue with priority levels.
 * Displays one notification at a time and auto-dismisses after a configurable duration.
 * Supports bounce-in entrance, fade-slide-out exit, and HIGH-priority shake animations.
 * All animations respect the REDUCED_MOTION registry setting.
 */

// Priority level constants
export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
};

// Priority-based background colors
const PRIORITY_BG_COLORS = {
  [PRIORITY.LOW]: 0x2d7a3a,
  [PRIORITY.MEDIUM]: 0x7a6a00,
  [PRIORITY.HIGH]: 0x7a1c1c,
};

// Priority-based text colors
const PRIORITY_TEXT_COLORS = {
  [PRIORITY.LOW]: '#90ee90',
  [PRIORITY.MEDIUM]: '#ffd700',
  [PRIORITY.HIGH]: '#ff6666',
};

/** Animation timing constants (ms) — all animations check reducedMotion before running. */
const ANIM = {
  ENTRANCE_DURATION: 250,
  EXIT_DURATION:     200,
  SHAKE_DURATION:    50,
  SHAKE_REPEAT:      3,
  SLIDE_OFFSET:      40,
};

export class NotificationManager {
  /**
   * @param {Phaser.Scene} scene - The scene this manager belongs to.
   * @param {object} config - Configuration options.
   * @param {number} [config.duration=3000] - Default auto-dismiss duration in ms.
   * @param {number} [config.x] - X position (default: center of screen).
   * @param {number} [config.y=80] - Y position.
   * @param {number} [config.depth=100] - Render depth.
   */
  constructor(scene, config = {}) {
    this._scene = scene;
    this._duration = config.duration ?? 3000;
    this._x = config.x ?? (scene.scale.width / 2);
    this._y = config.y ?? 80;
    this._depth = config.depth ?? 100;

    // Internal state
    this._queue = [];
    this._active = null;
    this._dismissTimer = null;
    this._toastBg = null;
    this._toastText = null;

    // Active animation tween references (for cancellation)
    this._entranceTween = null;
    this._shakeTween    = null;
    this._exitTween     = null;
  }

  /**
   * Add a notification to the queue.
   * @param {string} message - Notification text.
   * @param {object} options - Notification options.
   * @param {string} [options.priority] - Priority level (low, medium, high).
   * @param {string|null} [options.icon] - Optional icon prefix.
   * @param {number} [options.duration] - Override default duration.
   */
  addNotification(message, options = {}) {
    const notification = {
      message,
      priority: options.priority ?? PRIORITY.LOW,
      icon: options.icon ?? null,
      duration: options.duration ?? this._duration,
    };

    this._queue.push(notification);

    if (!this._active) {
      this._showNext();
    }
  }

  /**
   * Clear all notifications (active + queued).
   */
  clearAll() {
    // Cancel any in-progress animations
    if (this._entranceTween) { this._entranceTween.stop?.(); this._entranceTween = null; }
    if (this._shakeTween)    { this._shakeTween.stop?.();    this._shakeTween    = null; }
    if (this._exitTween)     { this._exitTween.stop?.();     this._exitTween     = null; }

    if (this._dismissTimer !== null) {
      clearTimeout(this._dismissTimer);
      this._dismissTimer = null;
    }
    this._queue = [];
    this._destroyToast();
    this._active = null;
  }

  /**
   * Get the number of queued (pending) notifications.
   * @returns {number}
   */
  getQueueLength() {
    return this._queue.length;
  }

  /**
   * Get the currently active notification.
   * @returns {object|null}
   */
  getActive() {
    return this._active;
  }

  /**
   * Check if a notification is currently being displayed.
   * @returns {boolean}
   */
  isDisplaying() {
    return this._active !== null;
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /**
   * Show the next notification from the queue.
   */
  _showNext() {
    if (this._queue.length === 0) return;

    const notification = this._queue.shift();
    this._active = notification;
    this._display(notification);

    this._dismissTimer = setTimeout(() => {
      this._dismiss();
    }, notification.duration);
  }

  /**
   * Display a notification toast with optional bounce-in animation.
   * @param {object} notification
   */
  _display(notification) {
    // Cancel leftover tweens from the previous notification
    if (this._entranceTween) { this._entranceTween.stop?.(); this._entranceTween = null; }
    if (this._shakeTween)    { this._shakeTween.stop?.();    this._shakeTween    = null; }

    // Destroy old toast objects if any
    this._destroyToast();

    const bgColor   = PRIORITY_BG_COLORS[notification.priority]   ?? PRIORITY_BG_COLORS[PRIORITY.LOW];
    const textColor = PRIORITY_TEXT_COLORS[notification.priority]  ?? PRIORITY_TEXT_COLORS[PRIORITY.LOW];

    // Create background rectangle
    this._toastBg = this._scene.add.rectangle(this._x, this._y, 400, 40, bgColor);
    this._toastBg.setOrigin(0.5, 0.5);
    this._toastBg.setDepth(this._depth);
    this._toastBg.setScrollFactor(0);

    // Create text with optional icon prefix
    const displayText = notification.icon
      ? `${notification.icon} ${notification.message}`
      : notification.message;

    this._toastText = this._scene.add.text(this._x, this._y, displayText, {
      fontSize: '14px',
      color: textColor,
    });
    this._toastText.setOrigin(0.5, 0.5);
    this._toastText.setDepth(this._depth + 1);
    this._toastText.setScrollFactor(0);

    // Bounce-in entrance animation (skipped when reducedMotion or tweens unavailable)
    if (this._scene.tweens && !this._isReducedMotion()) {
      this._toastBg.y   = this._y - ANIM.SLIDE_OFFSET;
      this._toastBg.alpha = 0;
      this._toastText.y  = this._y - ANIM.SLIDE_OFFSET;
      this._toastText.alpha = 0;

      this._entranceTween = this._scene.tweens.add({
        targets:  [this._toastBg, this._toastText],
        y:        this._y,
        alpha:    1,
        duration: ANIM.ENTRANCE_DURATION,
        ease:     'Back.easeOut',
        onComplete: () => { this._entranceTween = null; },
      });

      // Extra shake for HIGH priority notifications (fires after entrance completes)
      if (notification.priority === PRIORITY.HIGH) {
        this._shakeTween = this._scene.tweens.add({
          targets:  [this._toastBg, this._toastText],
          x:        { from: this._x - 4, to: this._x + 4 },
          duration: ANIM.SHAKE_DURATION,
          yoyo:     true,
          repeat:   ANIM.SHAKE_REPEAT,
          delay:    ANIM.ENTRANCE_DURATION,
          onComplete: () => { this._shakeTween = null; },
        });
      }
    }
  }

  /**
   * Dismiss the current notification with optional fade-slide-out animation.
   */
  _dismiss() {
    if (this._scene.tweens && !this._isReducedMotion() && this._toastBg) {
      // Animated exit: fade and slide upward
      this._exitTween = this._scene.tweens.add({
        targets:  [this._toastBg, this._toastText].filter(Boolean),
        alpha:    0,
        y:        this._y - ANIM.SLIDE_OFFSET,
        duration: ANIM.EXIT_DURATION,
        onComplete: () => {
          this._exitTween = null;
          this._destroyToast();
          this._active = null;
          this._dismissTimer = null;
          this._showNext();
        },
      });
    } else {
      // Immediate dismiss (no tweens available or reduced motion)
      this._destroyToast();
      this._active = null;
      this._dismissTimer = null;
      this._showNext();
    }
  }

  /**
   * Destroy toast game objects.
   */
  _destroyToast() {
    if (this._toastBg) {
      this._toastBg.destroy();
      this._toastBg = null;
    }
    if (this._toastText) {
      this._toastText.destroy();
      this._toastText = null;
    }
  }

  /**
   * Check whether the reduced-motion accessibility setting is active.
   * Reads the 'reduced_motion' key from the scene registry.
   * @returns {boolean}
   */
  _isReducedMotion() {
    return this._scene?.registry?.get?.('reduced_motion') === true;
  }
}
