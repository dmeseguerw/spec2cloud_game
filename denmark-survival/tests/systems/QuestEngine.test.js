/**
 * tests/systems/QuestEngine.test.js
 * Unit tests for QuestEngine — task lifecycle, XP, completion conditions,
 * priority sorting, and end-of-day evaluation.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import * as QE from '../../src/systems/QuestEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(opts = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,  opts.day    ?? 1);
  r.set(RK.PLAYER_XP,   opts.xp     ?? 0);
  r.set(RK.PLAYER_LEVEL, opts.level  ?? 1);
  r.set(RK.ACTIVE_TASKS,    []);
  r.set(RK.COMPLETED_TASKS, []);
  if (opts.inventory) r.set(RK.INVENTORY, opts.inventory);
  if (opts.flags)     r.set(RK.GAME_FLAGS, opts.flags);
  return r;
}

function makeTask(overrides = {}) {
  return {
    id:          'test_task_1',
    type:        'story',
    title:       'Test mission',
    description: 'A test mission.',
    icon:        '📖',
    urgency:     'normal',
    status:      'active',
    assignedDay: 1,
    completedDay: null,
    xpReward:    10,
    xpPenalty:   5,
    skippable:   false,
    completionCondition: null,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// addTask
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.addTask()', () => {
  it('adds a task to ACTIVE_TASKS', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
    expect(r.get(RK.ACTIVE_TASKS)[0].id).toBe('test_task_1');
  });

  it('forces status to "active"', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ status: 'completed' }));
    expect(r.get(RK.ACTIVE_TASKS)[0].status).toBe('active');
  });

  it('does not add duplicate tasks (same id)', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    QE.addTask(r, makeTask());
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  it('emits quest:taskAdded event', () => {
    const r = makeRegistry();
    const listener = vi.fn();
    r.events.on(QE.QUEST_TASK_ADDED, listener);
    QE.addTask(r, makeTask());
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].task.id).toBe('test_task_1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeTask
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.completeTask()', () => {
  it('removes task from ACTIVE_TASKS and adds to COMPLETED_TASKS', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    QE.completeTask(r, 'test_task_1');
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
    expect(r.get(RK.COMPLETED_TASKS)).toHaveLength(1);
  });

  it('sets status to "completed"', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    QE.completeTask(r, 'test_task_1');
    expect(r.get(RK.COMPLETED_TASKS)[0].status).toBe('completed');
  });

  it('sets completedDay from registry', () => {
    const r = makeRegistry({ day: 5 });
    QE.addTask(r, makeTask());
    QE.completeTask(r, 'test_task_1');
    expect(r.get(RK.COMPLETED_TASKS)[0].completedDay).toBe(5);
  });

  it('grants xpReward XP', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ xpReward: 20 }));
    QE.completeTask(r, 'test_task_1');
    expect(r.get(RK.PLAYER_XP)).toBe(20);
  });

  it('does NOT grant XP when xpReward is 0', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ xpReward: 0 }));
    QE.completeTask(r, 'test_task_1');
    expect(r.get(RK.PLAYER_XP)).toBe(0);
  });

  it('emits quest:taskCompleted event', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    const listener = vi.fn();
    r.events.on(QE.QUEST_TASK_COMPLETED, listener);
    QE.completeTask(r, 'test_task_1');
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].task.status).toBe('completed');
  });

  it('no-ops if task id does not exist', () => {
    const r = makeRegistry();
    expect(() => QE.completeTask(r, 'nonexistent')).not.toThrow();
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// failTask
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.failTask()', () => {
  it('removes task from ACTIVE_TASKS and adds to COMPLETED_TASKS', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    QE.failTask(r, 'test_task_1');
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
    expect(r.get(RK.COMPLETED_TASKS)[0].status).toBe('failed');
  });

  it('applies xpPenalty', () => {
    const r = makeRegistry({ xp: 50 });
    QE.addTask(r, makeTask({ xpPenalty: 10 }));
    QE.failTask(r, 'test_task_1');
    expect(r.get(RK.PLAYER_XP)).toBeLessThan(50);
  });

  it('does NOT apply penalty when xpPenalty is 0', () => {
    const r = makeRegistry({ xp: 50 });
    QE.addTask(r, makeTask({ xpPenalty: 0 }));
    QE.failTask(r, 'test_task_1');
    expect(r.get(RK.PLAYER_XP)).toBe(50);
  });

  it('emits quest:taskFailed event', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    const listener = vi.fn();
    r.events.on(QE.QUEST_TASK_FAILED, listener);
    QE.failTask(r, 'test_task_1');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('no-ops if task id does not exist', () => {
    const r = makeRegistry();
    expect(() => QE.failTask(r, 'nonexistent')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// skipTask
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.skipTask()', () => {
  it('removes a skippable task from ACTIVE_TASKS', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ skippable: true }));
    QE.skipTask(r, 'test_task_1');
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('sets status to "skipped"', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ skippable: true }));
    QE.skipTask(r, 'test_task_1');
    expect(r.get(RK.COMPLETED_TASKS)[0].status).toBe('skipped');
  });

  it('does NOT skip a non-skippable task', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ skippable: false }));
    QE.skipTask(r, 'test_task_1');
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  it('emits quest:taskSkipped event', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ skippable: true }));
    const listener = vi.fn();
    r.events.on(QE.QUEST_TASK_SKIPPED, listener);
    QE.skipTask(r, 'test_task_1');
    expect(listener).toHaveBeenCalledOnce();
  });

  it('no-ops if task id does not exist', () => {
    const r = makeRegistry();
    expect(() => QE.skipTask(r, 'nonexistent')).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getActiveTasks — sorting
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.getActiveTasks() — sorting', () => {
  it('returns empty array when no tasks', () => {
    const r = makeRegistry();
    expect(QE.getActiveTasks(r)).toEqual([]);
  });

  it('sorts critical before urgent before normal before low', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 't_low',      urgency: 'low' }));
    QE.addTask(r, makeTask({ id: 't_normal',   urgency: 'normal' }));
    QE.addTask(r, makeTask({ id: 't_urgent',   urgency: 'urgent' }));
    QE.addTask(r, makeTask({ id: 't_critical', urgency: 'critical' }));
    const sorted = QE.getActiveTasks(r);
    expect(sorted[0].urgency).toBe('critical');
    expect(sorted[1].urgency).toBe('urgent');
    expect(sorted[2].urgency).toBe('normal');
    expect(sorted[3].urgency).toBe('low');
  });

  it('places story tasks before daily tasks at the same urgency', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 'daily_1', type: 'daily', urgency: 'normal' }));
    QE.addTask(r, makeTask({ id: 'story_1', type: 'story', urgency: 'normal' }));
    const sorted = QE.getActiveTasks(r);
    expect(sorted[0].id).toBe('story_1');
    expect(sorted[1].id).toBe('daily_1');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getActiveStoryMission
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.getActiveStoryMission()', () => {
  it('returns null when no tasks', () => {
    const r = makeRegistry();
    expect(QE.getActiveStoryMission(r)).toBeNull();
  });

  it('returns the first story task', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 'd', type: 'daily' }));
    QE.addTask(r, makeTask({ id: 's', type: 'story' }));
    expect(QE.getActiveStoryMission(r).id).toBe('s');
  });

  it('returns null when only daily tasks exist', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 'd', type: 'daily' }));
    expect(QE.getActiveStoryMission(r)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getTrackedTask / setTrackedTask
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine tracked task', () => {
  it('getTrackedTask returns null when no tasks', () => {
    const r = makeRegistry();
    expect(QE.getTrackedTask(r)).toBeNull();
  });

  it('getTrackedTask returns highest-priority task by default', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 'low',  urgency: 'low' }));
    QE.addTask(r, makeTask({ id: 'crit', urgency: 'critical' }));
    expect(QE.getTrackedTask(r).id).toBe('crit');
  });

  it('setTrackedTask pins a specific task', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 'low',  urgency: 'low' }));
    QE.addTask(r, makeTask({ id: 'crit', urgency: 'critical' }));
    QE.setTrackedTask(r, 'low');
    expect(QE.getTrackedTask(r).id).toBe('low');
  });

  it('getTrackedTask falls back to highest-priority if pinned task no longer active', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 'task1', urgency: 'low' }));
    QE.addTask(r, makeTask({ id: 'task2', urgency: 'critical' }));
    QE.setTrackedTask(r, 'task1');
    QE.completeTask(r, 'task1');
    // task1 is gone — should fall back to task2
    expect(QE.getTrackedTask(r).id).toBe('task2');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkCompletionConditions
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.checkCompletionConditions()', () => {
  // ── flag ──────────────────────────────────────────────────────────────────

  it('completes a flag condition task on matching flag:set event', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'flag_task',
      completionCondition: { type: 'flag', key: 'met_lars', value: true },
    }));
    QE.checkCompletionConditions(r, 'flag:set', { key: 'met_lars', value: true });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('does NOT complete a flag task when value does not match', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'flag_task',
      completionCondition: { type: 'flag', key: 'met_lars', value: true },
    }));
    QE.checkCompletionConditions(r, 'flag:set', { key: 'met_lars', value: false });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  it('does NOT complete a flag task on wrong event type', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'flag_task',
      completionCondition: { type: 'flag', key: 'met_lars', value: true },
    }));
    QE.checkCompletionConditions(r, 'inventory:added', { key: 'met_lars', value: true });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  // ── hasItem ───────────────────────────────────────────────────────────────

  it('completes a hasItem task when inventory has enough quantity', () => {
    const r = makeRegistry({
      inventory: [{ itemId: 'rugbrod', quantity: 2 }],
    });
    QE.addTask(r, makeTask({
      id: 'item_task',
      completionCondition: { type: 'hasItem', itemId: 'rugbrod', minQuantity: 1 },
    }));
    QE.checkCompletionConditions(r, 'inventory:added', { itemId: 'rugbrod', quantity: 2 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('does NOT complete hasItem when inventory quantity is below minQuantity', () => {
    const r = makeRegistry({
      inventory: [],
    });
    QE.addTask(r, makeTask({
      id: 'item_task',
      completionCondition: { type: 'hasItem', itemId: 'rugbrod', minQuantity: 3 },
    }));
    QE.checkCompletionConditions(r, 'inventory:added', { itemId: 'rugbrod', quantity: 2 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  it('does NOT complete hasItem on wrong itemId', () => {
    const r = makeRegistry({
      inventory: [{ itemId: 'rugbrod', quantity: 2 }],
    });
    QE.addTask(r, makeTask({
      id: 'item_task',
      completionCondition: { type: 'hasItem', itemId: 'rugbrod', minQuantity: 1 },
    }));
    QE.checkCompletionConditions(r, 'inventory:added', { itemId: 'pasta', quantity: 2 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  // ── npcTalked ─────────────────────────────────────────────────────────────

  it('completes a npcTalked task on matching dialogue:ended event', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'npc_task',
      completionCondition: { type: 'npcTalked', npcId: 'lars' },
    }));
    QE.checkCompletionConditions(r, 'dialogue:ended', { npcId: 'lars' });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('does NOT complete npcTalked task for different npc', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'npc_task',
      completionCondition: { type: 'npcTalked', npcId: 'lars' },
    }));
    QE.checkCompletionConditions(r, 'dialogue:ended', { npcId: 'thomas' });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  // ── locationVisited ───────────────────────────────────────────────────────

  it('completes a locationVisited task on matching location:entered event', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'loc_task',
      completionCondition: { type: 'locationVisited', locationId: 'supermarket' },
    }));
    QE.checkCompletionConditions(r, 'location:entered', { locationId: 'supermarket' });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('does NOT complete locationVisited on wrong location', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'loc_task',
      completionCondition: { type: 'locationVisited', locationId: 'supermarket' },
    }));
    QE.checkCompletionConditions(r, 'location:entered', { locationId: 'pharmacy' });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  it('completes a locationVisited task with null locationId on any location (wildcard)', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'explore_task',
      completionCondition: { type: 'locationVisited', locationId: null },
    }));
    QE.checkCompletionConditions(r, 'location:entered', { locationId: 'park' });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  // ── moneySpent ────────────────────────────────────────────────────────────

  it('completes a moneySpent task when amount is sufficient', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'money_task',
      completionCondition: { type: 'moneySpent', minAmount: 50 },
    }));
    QE.checkCompletionConditions(r, 'shop:purchased', { amount: 100 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('does NOT complete moneySpent when amount is below minimum', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'money_task',
      completionCondition: { type: 'moneySpent', minAmount: 100 },
    }));
    QE.checkCompletionConditions(r, 'shop:purchased', { amount: 50 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  // ── pantReturned ──────────────────────────────────────────────────────────

  it('completes a pantReturned task when cumulative count meets minCount', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'pant_task',
      completionCondition: { type: 'pantReturned', minCount: 3 },
    }));
    // First return: 2
    QE.checkCompletionConditions(r, 'pant:returned', { count: 2 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
    // Second return: 1 more (total 3)
    QE.checkCompletionConditions(r, 'pant:returned', { count: 1 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('accumulates pant_returned_total in GAME_FLAGS', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ completionCondition: null }));
    QE.checkCompletionConditions(r, 'pant:returned', { count: 5 });
    expect(r.get(RK.GAME_FLAGS).pant_returned_total).toBe(5);
    QE.checkCompletionConditions(r, 'pant:returned', { count: 3 });
    expect(r.get(RK.GAME_FLAGS).pant_returned_total).toBe(8);
  });

  // ── itemUsed ──────────────────────────────────────────────────────────────

  it('completes an itemUsed task on matching inventory:used event', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'used_task',
      completionCondition: { type: 'itemUsed', itemId: 'rugbrod' },
    }));
    QE.checkCompletionConditions(r, 'inventory:used', { itemId: 'rugbrod' });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('does NOT complete itemUsed for different item', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'used_task',
      completionCondition: { type: 'itemUsed', itemId: 'rugbrod' },
    }));
    QE.checkCompletionConditions(r, 'inventory:used', { itemId: 'pasta' });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  // ── dayReached ────────────────────────────────────────────────────────────

  it('completes a dayReached task when day is reached', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'day_task',
      completionCondition: { type: 'dayReached', day: 7 },
    }));
    QE.checkCompletionConditions(r, 'day:started', { day: 7 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  it('does NOT complete dayReached task before required day', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'day_task',
      completionCondition: { type: 'dayReached', day: 7 },
    }));
    QE.checkCompletionConditions(r, 'day:started', { day: 5 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });

  it('completes dayReached task when day is beyond required (>= check)', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      id: 'day_task',
      completionCondition: { type: 'dayReached', day: 7 },
    }));
    QE.checkCompletionConditions(r, 'day:started', { day: 10 });
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(0);
  });

  // ── unknown condition type ────────────────────────────────────────────────

  it('does NOT complete task with unknown condition type', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({
      completionCondition: { type: 'unknownType' },
    }));
    QE.checkCompletionConditions(r, 'some:event', {});
    expect(r.get(RK.ACTIVE_TASKS)).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// evaluateEndOfDay
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.evaluateEndOfDay()', () => {
  it('fails urgent daily tasks at end of day', () => {
    const r = makeRegistry({ xp: 50 });
    QE.addTask(r, makeTask({ id: 'urgent_daily', type: 'daily', urgency: 'urgent', skippable: true, xpPenalty: 5 }));
    QE.evaluateEndOfDay(r, 1);
    const completed = r.get(RK.COMPLETED_TASKS);
    expect(completed[0].status).toBe('failed');
    expect(r.get(RK.PLAYER_XP)).toBeLessThan(50);
  });

  it('fails critical daily tasks at end of day', () => {
    const r = makeRegistry({ xp: 50 });
    QE.addTask(r, makeTask({ id: 'crit_daily', type: 'daily', urgency: 'critical', skippable: false, xpPenalty: 10 }));
    QE.evaluateEndOfDay(r, 1);
    expect(r.get(RK.COMPLETED_TASKS)[0].status).toBe('failed');
  });

  it('skips normal daily tasks at end of day (no XP penalty)', () => {
    const r = makeRegistry({ xp: 50 });
    QE.addTask(r, makeTask({ id: 'normal_daily', type: 'daily', urgency: 'normal', skippable: true, xpPenalty: 5 }));
    QE.evaluateEndOfDay(r, 1);
    expect(r.get(RK.COMPLETED_TASKS)[0].status).toBe('skipped');
    expect(r.get(RK.PLAYER_XP)).toBe(50); // no penalty
  });

  it('skips low urgency daily tasks at end of day', () => {
    const r = makeRegistry({ xp: 50 });
    QE.addTask(r, makeTask({ id: 'low_daily', type: 'daily', urgency: 'low', skippable: true, xpPenalty: 0 }));
    QE.evaluateEndOfDay(r, 1);
    expect(r.get(RK.COMPLETED_TASKS)[0].status).toBe('skipped');
  });

  it('clears all active daily tasks after evaluation', () => {
    const r = makeRegistry({ xp: 50 });
    QE.addTask(r, makeTask({ id: 'd1', type: 'daily', urgency: 'urgent',  skippable: true, xpPenalty: 5 }));
    QE.addTask(r, makeTask({ id: 'd2', type: 'daily', urgency: 'normal',  skippable: true, xpPenalty: 0 }));
    QE.evaluateEndOfDay(r, 1);
    const active = r.get(RK.ACTIVE_TASKS);
    expect(active.filter(t => t.type === 'daily')).toHaveLength(0);
  });

  it('does NOT remove story tasks during end-of-day evaluation', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask({ id: 'story_1', type: 'story', skippable: false }));
    QE.addTask(r, makeTask({ id: 'daily_1', type: 'daily', urgency: 'low', skippable: true }));
    QE.evaluateEndOfDay(r, 1);
    const active = r.get(RK.ACTIVE_TASKS);
    expect(active.some(t => t.id === 'story_1')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getMissionDefinition
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.getMissionDefinition()', () => {
  it('returns null for an unknown missionId (stub missions.js)', () => {
    expect(QE.getMissionDefinition('story_grocery_run')).toBeNull();
  });

  it('returns null for undefined missionId', () => {
    expect(QE.getMissionDefinition(undefined)).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCompletedTasks
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine.getCompletedTasks()', () => {
  it('returns empty array initially', () => {
    const r = makeRegistry();
    expect(QE.getCompletedTasks(r)).toEqual([]);
  });

  it('returns completed tasks after completing a task', () => {
    const r = makeRegistry();
    QE.addTask(r, makeTask());
    QE.completeTask(r, 'test_task_1');
    expect(QE.getCompletedTasks(r)).toHaveLength(1);
    expect(QE.getCompletedTasks(r)[0].status).toBe('completed');
  });
});
