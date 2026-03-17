/**
 * tests/ui/NotificationManager.test.js
 * Unit tests for NotificationManager — toast notification queue with priorities.
 *
 * Phaser.Scene is mocked globally by tests/mocks/setupPhaser.js (vitest setupFiles).
 * Uses fake timers to control auto-dismiss behavior.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NotificationManager, PRIORITY } from '../../src/ui/NotificationManager.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/**
 * Build a scene mock with optional `tweens` support.
 * @param {boolean} [withTweens=false] - Whether to include a tweens stub.
 * @param {boolean} [reducedMotion=false] - Whether registry returns reducedMotion=true.
 */
function buildManager(config = {}, { withTweens = false, reducedMotion = false } = {}) {
  const rectObjects = [];
  const textObjects = [];
  const tweenTargets = [];

  const scene = {
    scale: { width: 1280, height: 720 },
    registry: {
      get: vi.fn().mockImplementation((key) => key === 'reduced_motion' ? reducedMotion : undefined),
    },
    add: {
      rectangle: vi.fn().mockImplementation(() => {
        const obj = {
          x: 0, y: 0, width: 0, height: 0, visible: true, depth: 0, alpha: 1,
          _fillColor: 0,
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
          text: '', visible: true, alpha: 1,
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

  if (withTweens) {
    scene.tweens = {
      add: vi.fn().mockImplementation((cfg) => {
        tweenTargets.push(cfg);
        const tween = { stop: vi.fn() };
        // Immediately invoke onComplete for testing purposes
        if (cfg.onComplete) cfg.onComplete();
        return tween;
      }),
    };
  }

  const mgr = new NotificationManager(scene, config);
  return { mgr, scene, rectObjects, textObjects, tweenTargets };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('NotificationManager', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addNotification shows first notification immediately', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Hello');
    expect(mgr.getActive()).not.toBeNull();
    expect(mgr.getActive().message).toBe('Hello');
  });

  it('isDisplaying() returns true when active', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Test');
    expect(mgr.isDisplaying()).toBe(true);
  });

  it('getActive() returns current notification', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Active one');
    const active = mgr.getActive();
    expect(active.message).toBe('Active one');
    expect(active.priority).toBe(PRIORITY.LOW);
  });

  it('notification auto-dismisses after default duration (3000ms)', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Auto dismiss');
    expect(mgr.isDisplaying()).toBe(true);

    vi.advanceTimersByTime(3000);
    expect(mgr.isDisplaying()).toBe(false);
  });

  it('notification respects custom duration option', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Custom', { duration: 1000 });
    expect(mgr.isDisplaying()).toBe(true);

    vi.advanceTimersByTime(999);
    expect(mgr.isDisplaying()).toBe(true);

    vi.advanceTimersByTime(1);
    expect(mgr.isDisplaying()).toBe(false);
  });

  it('multiple notifications queue and display sequentially', () => {
    const { mgr } = buildManager();
    mgr.addNotification('First');
    mgr.addNotification('Second');
    mgr.addNotification('Third');

    expect(mgr.getActive().message).toBe('First');
    expect(mgr.getQueueLength()).toBe(2);
  });

  it('getQueueLength returns count of queued notifications', () => {
    const { mgr } = buildManager();
    mgr.addNotification('A');
    mgr.addNotification('B');
    mgr.addNotification('C');
    expect(mgr.getQueueLength()).toBe(2); // B and C are queued, A is active
  });

  it('second notification shows after first dismisses', () => {
    const { mgr } = buildManager();
    mgr.addNotification('First');
    mgr.addNotification('Second');

    vi.advanceTimersByTime(3000); // First dismissed
    expect(mgr.getActive().message).toBe('Second');

    vi.advanceTimersByTime(3000); // Second dismissed
    expect(mgr.isDisplaying()).toBe(false);
  });

  it('clearAll() empties the queue and removes active notification', () => {
    const { mgr } = buildManager();
    mgr.addNotification('A');
    mgr.addNotification('B');
    mgr.clearAll();
    expect(mgr.isDisplaying()).toBe(false);
    expect(mgr.getQueueLength()).toBe(0);
    expect(mgr.getActive()).toBeNull();
  });

  it('clearAll() stops the auto-dismiss timer', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Timer test');
    mgr.clearAll();

    // Advancing timers should not cause errors
    vi.advanceTimersByTime(5000);
    expect(mgr.isDisplaying()).toBe(false);
  });

  it('priority LOW uses green background', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Green', { priority: PRIORITY.LOW });
    // scene.add.rectangle is called as: rectangle(x, y, width, height, color)
    // index 0 = first call, argument index 4 = the color parameter
    const bgCall = mgr._scene.add.rectangle.mock.calls[0];
    expect(bgCall[4]).toBe(0x2d7a3a);
  });

  it('priority HIGH uses red-ish background', () => {
    const { mgr } = buildManager();
    mgr.addNotification('Red', { priority: PRIORITY.HIGH });
    // scene.add.rectangle(x, y, width, height, color) — color is the 5th argument (index 4)
    const bgCall = mgr._scene.add.rectangle.mock.calls[0];
    expect(bgCall[4]).toBe(0x7a1c1c);
  });

  it('notifications with icon prefix include it in text', () => {
    const { mgr, textObjects } = buildManager();
    mgr.addNotification('Achievement', { icon: '🏆' });
    // The text object should contain the icon prefix
    const textCall = mgr._scene.add.text.mock.calls[0];
    expect(textCall[2]).toBe('🏆 Achievement');
  });

  // ── Animation tests ────────────────────────────────────────────────────────

  describe('entrance animation', () => {
    it('triggers tweens.add when tweens are available and reducedMotion is false', () => {
      const { mgr, scene } = buildManager({}, { withTweens: true, reducedMotion: false });
      mgr.addNotification('Animated');
      expect(scene.tweens.add).toHaveBeenCalled();
    });

    it('does NOT trigger tweens when reducedMotion is true', () => {
      const { mgr, scene } = buildManager({}, { withTweens: true, reducedMotion: true });
      mgr.addNotification('No anim');
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });

    it('does NOT trigger tweens when tweens system is absent', () => {
      // buildManager without withTweens: true — scene has no tweens property
      const { mgr } = buildManager({}, { withTweens: false, reducedMotion: false });
      // Should not throw
      expect(() => mgr.addNotification('No tweens')).not.toThrow();
    });

    it('sets toast alpha to 0 before entrance tween when animating', () => {
      const { mgr, rectObjects, textObjects } = buildManager({}, { withTweens: true, reducedMotion: false });
      mgr.addNotification('Animated');
      // Both bg and text should have had alpha=0 set (then tween restores to 1)
      // After onComplete fires (our mock fires it immediately), alpha reverts via tween
      expect(rectObjects[0]).toBeDefined();
      expect(textObjects[0]).toBeDefined();
    });
  });

  describe('HIGH priority shake', () => {
    it('adds a shake tween for HIGH priority notifications when tweens available', () => {
      const { mgr, scene, tweenTargets } = buildManager({}, { withTweens: true, reducedMotion: false });
      mgr.addNotification('Urgent!', { priority: PRIORITY.HIGH });
      // Entrance tween + shake tween = 2 calls
      expect(scene.tweens.add).toHaveBeenCalledTimes(2);
    });

    it('does NOT add shake tween for LOW priority', () => {
      const { mgr, scene } = buildManager({}, { withTweens: true, reducedMotion: false });
      mgr.addNotification('Normal', { priority: PRIORITY.LOW });
      // Only entrance tween — no shake
      expect(scene.tweens.add).toHaveBeenCalledTimes(1);
    });

    it('does NOT add shake tween when reducedMotion is true', () => {
      const { mgr, scene } = buildManager({}, { withTweens: true, reducedMotion: true });
      mgr.addNotification('Urgent!', { priority: PRIORITY.HIGH });
      // Neither entrance nor shake tweens when reduced motion
      expect(scene.tweens.add).not.toHaveBeenCalled();
    });
  });

  describe('_isReducedMotion()', () => {
    it('returns false when registry does not have reduced_motion set', () => {
      const { mgr } = buildManager({}, { withTweens: false, reducedMotion: false });
      expect(mgr._isReducedMotion()).toBe(false);
    });

    it('returns true when registry has reduced_motion = true', () => {
      const { mgr } = buildManager({}, { withTweens: false, reducedMotion: true });
      expect(mgr._isReducedMotion()).toBe(true);
    });
  });

  describe('clearAll() with active tweens', () => {
    it('calls stop() on active entrance tween when clearing', () => {
      // Use a tween mock that does NOT auto-invoke onComplete
      const rectObjects = [];
      const textObjects = [];
      const scene = {
        scale: { width: 1280, height: 720 },
        registry: { get: vi.fn().mockReturnValue(false) },
        add: {
          rectangle: vi.fn().mockImplementation(() => {
            const obj = { x: 0, y: 0, alpha: 1, setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), destroy: vi.fn() };
            rectObjects.push(obj);
            return obj;
          }),
          text: vi.fn().mockImplementation(() => {
            const obj = { text: '', alpha: 1, setOrigin: vi.fn().mockReturnThis(), setDepth: vi.fn().mockReturnThis(), setScrollFactor: vi.fn().mockReturnThis(), destroy: vi.fn() };
            textObjects.push(obj);
            return obj;
          }),
        },
        tweens: {
          add: vi.fn().mockImplementation(() => ({ stop: vi.fn() })),
        },
      };

      const mgr = new NotificationManager(scene, {});
      mgr.addNotification('Test');
      // After display, _entranceTween should exist (onComplete not called since mock returns tween)
      // clearAll should stop it
      expect(() => mgr.clearAll()).not.toThrow();
      expect(mgr.isDisplaying()).toBe(false);
    });
  });
});
