/**
 * src/scenes/SceneTransition.js
 * Reusable scene transition utilities for Denmark Survival.
 *
 * Provides fade, slide, and instant transition functions
 * that any scene can use to navigate between screens.
 */

/** Default fade duration in milliseconds */
export const DEFAULT_FADE_DURATION = 500;

/** Slide direction constants */
export const SLIDE_LEFT  = 'left';
export const SLIDE_RIGHT = 'right';
export const SLIDE_UP    = 'up';
export const SLIDE_DOWN  = 'down';

/** Transition type constants */
export const TRANSITION_FADE    = 'fade';
export const TRANSITION_SLIDE   = 'slide';
export const TRANSITION_INSTANT = 'instant';

/**
 * Perform a fade-to-black transition from the current scene to a target scene.
 *
 * 1. Camera fades out to black over `duration` ms.
 * 2. On fade-out complete, starts the target scene with optional data.
 *
 * @param {Phaser.Scene} scene   - The current scene instance.
 * @param {string}       target  - Key of the scene to transition to.
 * @param {object}       [data]  - Data to pass to the target scene's init().
 * @param {number}       [duration=500] - Fade duration in ms.
 */
export function fadeToScene(scene, target, data = {}, duration = DEFAULT_FADE_DURATION) {
  if (!scene || !target) return;

  scene.cameras.main.fadeOut(duration, 0, 0, 0, (_camera, progress) => {
    if (progress === 1) {
      scene.scene.start(target, data);
    }
  });
}

/**
 * Fade a scene's camera in from black (typically called in the target scene's create()).
 *
 * @param {Phaser.Scene} scene      - The scene whose camera should fade in.
 * @param {number}       [duration=500] - Fade duration in ms.
 * @param {Function}     [onComplete]   - Optional callback when fade-in finishes.
 */
export function fadeIn(scene, duration = DEFAULT_FADE_DURATION, onComplete) {
  if (!scene) return;

  scene.cameras.main.fadeIn(duration, 0, 0, 0, (_camera, progress) => {
    if (progress === 1 && typeof onComplete === 'function') {
      onComplete();
    }
  });
}

/**
 * Perform a slide transition to a target scene.
 *
 * Uses Phaser's built-in scene transition API when available,
 * otherwise falls back to a camera-based approach.
 *
 * @param {Phaser.Scene} scene      - The current scene instance.
 * @param {string}       target     - Key of the scene to transition to.
 * @param {string}       direction  - One of SLIDE_LEFT, SLIDE_RIGHT, SLIDE_UP, SLIDE_DOWN.
 * @param {object}       [data]     - Data to pass to the target scene's init().
 * @param {number}       [duration=500] - Slide duration in ms.
 */
export function slideToScene(scene, target, direction = SLIDE_LEFT, data = {}, duration = DEFAULT_FADE_DURATION) {
  if (!scene || !target) return;

  const { width, height } = scene.scale;
  let moveX = 0;
  let moveY = 0;

  switch (direction) {
    case SLIDE_LEFT:  moveX = -width;  break;
    case SLIDE_RIGHT: moveX = width;   break;
    case SLIDE_UP:    moveY = -height; break;
    case SLIDE_DOWN:  moveY = height;  break;
  }

  const camera = scene.cameras.main;
  const startX = camera.scrollX;
  const startY = camera.scrollY;

  // Use scene transition if available (Phaser 3.60+)
  if (typeof scene.scene.transition === 'function') {
    scene.scene.transition({
      target,
      data,
      duration,
      moveAbove: true,
      onUpdate: (_progress) => {
        camera.scrollX = startX + moveX * _progress;
        camera.scrollY = startY + moveY * _progress;
      },
    });
  } else {
    // Fallback: fade-based transition
    fadeToScene(scene, target, data, duration);
  }
}

/**
 * Instantly transition to a target scene (no animation).
 * Suitable for overlay launches or debug skipping.
 *
 * @param {Phaser.Scene} scene  - The current scene instance.
 * @param {string}       target - Key of the scene to transition to.
 * @param {object}       [data] - Data to pass to the target scene's init().
 */
export function instantTransition(scene, target, data = {}) {
  if (!scene || !target) return;
  scene.scene.start(target, data);
}

/**
 * Launch an overlay scene on top of the current scene.
 * The parent scene is paused and the overlay receives a reference
 * to the parent scene key so it can resume it when closing.
 *
 * @param {Phaser.Scene} parentScene  - The scene launching the overlay.
 * @param {string}       overlayKey   - Key of the overlay scene to launch.
 * @param {object}       [data]       - Data to pass to the overlay scene's init().
 */
export function launchOverlay(parentScene, overlayKey, data = {}) {
  if (!parentScene || !overlayKey) return;

  // Close any existing overlay first (prevent stacking).
  // Guard: never stop the parent scene itself or the scene we're about to open.
  const currentOverlay = parentScene.registry.get('_activeOverlay');
  if (
    currentOverlay &&
    currentOverlay !== parentScene.scene.key &&
    currentOverlay !== overlayKey
  ) {
    parentScene.scene.stop(currentOverlay);
  }

  // Track the active overlay
  parentScene.registry.set('_activeOverlay', overlayKey);

  // Pause the parent scene's update loop (it remains visible)
  parentScene.scene.pause(parentScene.scene.key);

  // Launch the overlay scene with parent key in data
  parentScene.scene.launch(overlayKey, {
    ...data,
    _parentSceneKey: parentScene.scene.key,
  });
}

/**
 * Close the current overlay scene and resume its parent.
 *
 * @param {Phaser.Scene} overlayScene - The overlay scene to close.
 */
export function closeOverlay(overlayScene) {
  if (!overlayScene) return;

  const parentKey = overlayScene._parentSceneKey;

  // Clear active overlay tracking
  if (overlayScene.registry) {
    overlayScene.registry.set('_activeOverlay', null);
  }

  // Resume the parent BEFORE stopping the overlay.
  // Stopping a scene can tear down its Scene Plugin, so we must resume first
  // while the plugin reference is still valid.
  if (parentKey) {
    overlayScene.scene.resume(parentKey);
  }

  // Stop the overlay scene
  overlayScene.scene.stop();
}
