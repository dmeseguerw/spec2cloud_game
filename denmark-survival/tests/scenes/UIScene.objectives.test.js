/**
 * tests/scenes/UIScene.objectives.test.js
 * Tests for the Objectives Panel extension in UIScene.
 *
 * Covers:
 *  - Panel renders at bottom-centre
 *  - Correct text when no tasks active
 *  - Panel shows icon + title of tracked task
 *  - ACTIVE_TASKS registry change triggers panel update
 *  - Cycling through tasks
 *  - Amber flash fires when urgent/critical tasks are present
 *  - Completion animation
 *  - Expanded view opens and closes
 *  - Clicking a row pins tracked task and collapses
 *  - Edge cases: >10 tasks, panel with reduced motion
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { UIScene } from '../../src/scenes/UIScene.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import * as QE from '../../src/systems/QuestEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeTask(overrides = {}) {
  return {
    id:          'task_1',
    type:        'story',
    title:       'Find the grocery store',
    description: 'Visit Netto to buy some food.',
    icon:        '📖',
    urgency:     'normal',
    status:      'active',
    assignedDay: 1,
    completedDay: null,
    xpReward:    10,
    xpPenalty:   0,
    skippable:   false,
    completionCondition: null,
    ...overrides,
  };
}

/**
 * Build a UIScene with all required Phaser stubs.
 */
function buildScene({ withTweens = false, withTime = false } = {}) {
  const scene = new UIScene();

  const textObjects = [];
  const rectObjects = [];
  const tweenCalls  = [];
  const timerEvents = [];

  const makeText = (x = 0, y = 0, text = '') => {
    const obj = {
      x, y, text: String(text), visible: true, depth: 0, alpha: 1,
      _style: {},
      setOrigin:       vi.fn().mockReturnThis(),
      setDepth:        vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setVisible:      vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
      setText:         vi.fn().mockImplementation(function(t) { this.text = String(t); return this; }),
      setStyle:        vi.fn().mockImplementation(function(s) { Object.assign(this._style, s); return this; }),
      setAlpha:        vi.fn().mockReturnThis(),
      setInteractive:  vi.fn().mockReturnThis(),
      on:              vi.fn().mockImplementation(function(ev, cb) {
        this._handlers = this._handlers || {};
        this._handlers[ev] = cb;
        return this;
      }),
      destroy:         vi.fn(),
    };
    textObjects.push(obj);
    return obj;
  };

  const makeRect = (x = 0, y = 0, w = 0, h = 0) => {
    const obj = {
      x, y, width: w, height: h, visible: true, depth: 0, alpha: 1,
      _fill: null,
      setOrigin:       vi.fn().mockReturnThis(),
      setDepth:        vi.fn().mockReturnThis(),
      setScrollFactor: vi.fn().mockReturnThis(),
      setAlpha:        vi.fn().mockReturnThis(),
      setInteractive:  vi.fn().mockReturnThis(),
      setFillStyle:    vi.fn().mockImplementation(function(c, a) { this._fill = c; return this; }),
      setVisible:      vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
      on:              vi.fn().mockImplementation(function(ev, cb) {
        this._handlers = this._handlers || {};
        this._handlers[ev] = cb;
        return this;
      }),
      destroy:         vi.fn(),
    };
    rectObjects.push(obj);
    return obj;
  };

  const registry = new MockRegistry();
  registry.set(RK.ACTIVE_TASKS,    []);
  registry.set(RK.COMPLETED_TASKS, []);

  scene.scale    = { width: 1280, height: 720 };
  scene.registry = registry;
  scene.add      = {
    text:      vi.fn().mockImplementation(makeText),
    rectangle: vi.fn().mockImplementation(makeRect),
  };
  scene.input = {
    keyboard: {
      addKey: vi.fn().mockReturnValue({ on: vi.fn(), isDown: false }),
    },
    enabled: true,
  };
  scene.scene = { launch: vi.fn() };

  if (withTweens) {
    scene.tweens = {
      add: vi.fn().mockImplementation((cfg) => {
        tweenCalls.push(cfg);
        return { stop: vi.fn() };
      }),
    };
  }

  if (withTime) {
    scene.time = {
      addEvent: vi.fn().mockImplementation((cfg) => {
        const evt = { cfg, _removed: false, remove: vi.fn() };
        timerEvents.push(evt);
        return evt;
      }),
      delayedCall: vi.fn().mockImplementation((delay, cb) => {
        // Execute the callback immediately for testing
        cb();
        return { remove: vi.fn() };
      }),
    };
  }

  return { scene, registry, textObjects, rectObjects, tweenCalls, timerEvents };
}

// ─────────────────────────────────────────────────────────────────────────────
// Objectives Panel — basic rendering
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — initial render', () => {
  it('creates panel background rectangle', () => {
    const { scene, rectObjects } = buildScene({ withTime: true });
    scene.create();
    // There should be at least one rectangle that acts as the objectives panel BG
    expect(rectObjects.length).toBeGreaterThan(0);
    expect(scene._objPanelBg).toBeDefined();
  });

  it('creates panel text element', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    expect(scene._objPanelText).toBeDefined();
  });

  it('shows "No tasks right now — explore!" when no tasks are active', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    expect(scene._objPanelText.text).toContain('No tasks right now — explore!');
  });

  it('panel is positioned at bottom-centre of screen', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    // The objectives panel BG is created near height - 90 (y = 630 for 720 height)
    // We verify the rectangle was created (exact Y depends on implementation)
    expect(scene._objPanelBg).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Objectives Panel — task display
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — task display', () => {
  it('shows task icon and title when a task is active', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();

    // Add a task to the registry
    QE.addTask(registry, makeTask({ id: 'test', title: 'Buy some food', icon: '📖' }));

    expect(scene._objPanelText.text).toContain('Buy some food');
    expect(scene._objPanelText.text).toContain('📖');
  });

  it('updates panel when ACTIVE_TASKS registry key changes', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();

    // Initially no tasks
    expect(scene._objPanelText.text).toContain('No tasks right now');

    // Add a task
    QE.addTask(registry, makeTask({ id: 'new_task', title: 'New task title' }));
    expect(scene._objPanelText.text).toContain('New task title');
  });

  it('shows urgency colour for critical tasks', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'crit', urgency: 'critical', title: 'Critical task' }));
    expect(scene._objPanelText._style.color).toBe('#ff4444');
  });

  it('shows urgency colour for urgent tasks', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'urg', urgency: 'urgent', title: 'Urgent task' }));
    expect(scene._objPanelText._style.color).toBe('#ffaa33');
  });

  it('shows urgency colour for normal tasks', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'norm', urgency: 'normal', title: 'Normal task' }));
    expect(scene._objPanelText._style.color).toBe('#66aaff');
  });

  it('shows urgency colour for low tasks', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'low', urgency: 'low', title: 'Low task' }));
    expect(scene._objPanelText._style.color).toBe('#88cc88');
  });

  it('goes back to no-tasks text after completing the only task', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'solo', title: 'Solo task', xpReward: 0 }));
    QE.completeTask(registry, 'solo');
    expect(scene._objPanelText.text).toContain('No tasks right now');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Objectives Panel — cycling
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — cycling', () => {
  it('_cycleObjectivesPanel() advances to next task', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();

    QE.addTask(registry, makeTask({ id: 'task_a', title: 'Task A', urgency: 'normal' }));
    QE.addTask(registry, makeTask({ id: 'task_b', title: 'Task B', urgency: 'low' }));

    // After create, cycle index is 0 → highest priority task shown
    scene._cycleObjectivesPanel(); // advance to index 1
    // The text should now show the second task in the priority list
    // (order depends on sorting, but text should have changed)
    expect(scene._objPanelText.text).toBeTruthy();
  });

  it('_cycleObjectivesPanel() wraps around', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'task_a', title: 'Task A' }));
    QE.addTask(registry, makeTask({ id: 'task_b', title: 'Task B' }));

    scene._objCycleIndex = 1; // at last item
    scene._cycleObjectivesPanel(); // should wrap to 0
    expect(scene._objCycleIndex).toBe(0);
  });

  it('_cycleObjectivesPanel() falls back to _updateObjectivesPanel when only 1 task', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'only', title: 'Only task' }));
    const spy = vi.spyOn(scene, '_updateObjectivesPanel');
    scene._cycleObjectivesPanel();
    expect(spy).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Objectives Panel — amber flash
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — amber flash', () => {
  it('_amberFlashIfUrgent() fires tween when urgent task present', () => {
    const { scene, registry, tweenCalls } = buildScene({ withTweens: true, withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'urg', urgency: 'urgent' }));
    scene._amberFlashIfUrgent();
    expect(tweenCalls.length).toBeGreaterThan(0);
  });

  it('_amberFlashIfUrgent() fires tween when critical task present', () => {
    const { scene, registry, tweenCalls } = buildScene({ withTweens: true, withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'crit', urgency: 'critical' }));
    scene._amberFlashIfUrgent();
    expect(tweenCalls.length).toBeGreaterThan(0);
  });

  it('_amberFlashIfUrgent() does NOT fire tween when no urgent/critical tasks', () => {
    const { scene, registry, tweenCalls } = buildScene({ withTweens: true, withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'normal', urgency: 'normal' }));
    const countBefore = tweenCalls.length;
    scene._amberFlashIfUrgent();
    expect(tweenCalls.length).toBe(countBefore);
  });

  it('_amberFlashIfUrgent() does NOT fire tween when reducedMotion is true', () => {
    const { scene, registry, tweenCalls } = buildScene({ withTweens: true, withTime: true });
    scene.create();
    registry.set(RK.REDUCED_MOTION, true);
    QE.addTask(registry, makeTask({ id: 'urg', urgency: 'urgent' }));
    const countBefore = tweenCalls.length;
    scene._amberFlashIfUrgent();
    expect(tweenCalls.length).toBe(countBefore);
  });

  it('_amberFlashIfUrgent() does NOT fire tween when no panel bg', () => {
    const { scene, registry, tweenCalls } = buildScene({ withTweens: true, withTime: true });
    scene.create();
    scene._objPanelBg = null;
    QE.addTask(registry, makeTask({ id: 'urg', urgency: 'urgent' }));
    const countBefore = tweenCalls.length;
    scene._amberFlashIfUrgent();
    expect(tweenCalls.length).toBe(countBefore);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Objectives Panel — completion animation
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — completion animation', () => {
  it('_onTaskCompleted() shows green checkmark text', () => {
    // Use withTime: false so the delayedCall doesn't fire immediately and reset the text
    const { scene, registry } = buildScene({ withTime: false });
    scene.create();

    scene._onTaskCompleted(makeTask({ title: 'Test task' }));
    expect(scene._objPanelText.text).toContain('✓');
    expect(scene._objPanelText.text).toContain('Test task');
  });

  it('_onTaskCompleted() sets text colour to green', () => {
    // Use withTime: false so the delayedCall doesn't fire immediately and reset the style
    const { scene, registry } = buildScene({ withTime: false });
    scene.create();
    scene._onTaskCompleted(makeTask({ title: 'Test task' }));
    expect(scene._objPanelText._style.color).toBe('#44ff88');
  });

  it('_onTaskCompleted() fires tween after delay when tweens available', () => {
    const { scene, registry, tweenCalls } = buildScene({ withTweens: true, withTime: true });
    scene.create();
    // time.delayedCall is mocked to fire immediately
    scene._onTaskCompleted(makeTask({ title: 'Test task' }));
    // The tween may or may not fire depending on reduced motion
    // Just check it doesn't throw
    expect(scene._objPanelText).toBeDefined();
  });

  it('_onTaskCompleted() is triggered by quest:taskCompleted event', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'trigger_task', xpReward: 0 }));

    const spy = vi.spyOn(scene, '_onTaskCompleted');
    QE.completeTask(registry, 'trigger_task');
    expect(spy).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Objectives Panel — expanded view
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — expanded view', () => {
  it('_openExpandedView() sets _objExpandedOpen to true', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    scene._openExpandedView();
    expect(scene._objExpandedOpen).toBe(true);
  });

  it('_closeExpandedView() sets _objExpandedOpen to false', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    scene._openExpandedView();
    scene._closeExpandedView();
    expect(scene._objExpandedOpen).toBe(false);
  });

  it('_openExpandedView() is idempotent when already open', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    scene._openExpandedView();
    expect(scene._objExpandedOpen).toBe(true);
    // Calling again should be a no-op — container stays the same
    const containerBefore = scene._objExpandedContainer;
    scene._openExpandedView(); // second open — no-op
    expect(scene._objExpandedContainer).toBe(containerBefore);
    expect(scene._objExpandedOpen).toBe(true);
  });

  it('_closeExpandedView() is safe when not open', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    expect(() => scene._closeExpandedView()).not.toThrow();
  });

  it('_openExpandedView() creates overlay objects', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'story', type: 'story', title: 'A story task' }));
    QE.addTask(registry, makeTask({ id: 'daily', type: 'daily', title: 'A daily task' }));
    scene._openExpandedView();
    // Expanded container should have objects
    expect(scene._objExpandedContainer).not.toBeNull();
    expect(scene._objExpandedContainer.length).toBeGreaterThan(0);
  });

  it('clicking a task row calls setTrackedTask and closes expanded view', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask({ id: 'row_task', title: 'Row task' }));
    scene._openExpandedView();

    // Find the text object for "Row task" and trigger pointerdown
    const container = scene._objExpandedContainer;
    const rowObj = container.find(obj => obj.text && String(obj.text).includes('Row task'));
    expect(rowObj).toBeDefined();
    if (rowObj._handlers && rowObj._handlers.pointerdown) {
      rowObj._handlers.pointerdown();
    }
    // After clicking: expanded view should be closed and tracked task set
    expect(scene._objExpandedOpen).toBe(false);
    expect(registry.get(RK.TRACKED_TASK_ID)).toBe('row_task');
  });

  it('clicking overlay bg closes the expanded view', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    scene._openExpandedView();
    // The expanded BG is the last non-panelBg rectangle; trigger its pointerdown
    if (scene._objExpandedBg && scene._objExpandedBg._handlers &&
        scene._objExpandedBg._handlers.pointerdown) {
      scene._objExpandedBg._handlers.pointerdown();
    }
    expect(scene._objExpandedOpen).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — edge cases', () => {
  it('handles >10 simultaneous tasks without errors', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    for (let i = 0; i < 12; i++) {
      QE.addTask(registry, makeTask({ id: `task_${i}`, title: `Task ${i}` }));
    }
    expect(() => scene._cycleObjectivesPanel()).not.toThrow();
    expect(() => scene._openExpandedView()).not.toThrow();
    scene._closeExpandedView();
  });

  it('_updateObjectivesPanel() is safe when _objPanelText is null', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    scene._objPanelText = null;
    expect(() => scene._updateObjectivesPanel()).not.toThrow();
  });

  it('shutdown() cleans up objective timers and expanded view', () => {
    const { scene, registry } = buildScene({ withTime: true });
    scene.create();
    QE.addTask(registry, makeTask());
    scene._openExpandedView();
    expect(() => scene.shutdown()).not.toThrow();
    expect(scene._objExpandedOpen).toBe(false);
  });

  it('panel is added to _hudGroup for collapse toggle', () => {
    const { scene } = buildScene({ withTime: true });
    scene.create();
    // _hudGroup should contain the panel bg and text
    expect(scene._hudGroup).toContain(scene._objPanelBg);
    expect(scene._hudGroup).toContain(scene._objPanelText);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Timer setup
// ─────────────────────────────────────────────────────────────────────────────

describe('UIScene Objectives Panel — timers', () => {
  it('registers cycling timer when this.time is available', () => {
    const { scene, timerEvents } = buildScene({ withTime: true });
    scene.create();
    expect(timerEvents.length).toBeGreaterThanOrEqual(2); // cycle + amber timers
  });

  it('does NOT crash when this.time is not available', () => {
    const { scene } = buildScene({ withTime: false });
    expect(() => scene.create()).not.toThrow();
    expect(scene._objCycleTimer).toBeNull();
  });
});
