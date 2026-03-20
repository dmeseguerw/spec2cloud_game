/**
 * tests/systems/QuestEngine.test.js
 * Unit tests for the QuestEngine module.
 *
 * Covers:
 *  - addTask / completeTask lifecycle
 *  - getActiveTasks / getCompletedTasks queries
 *  - isTaskActive / isTaskCompleted boolean checks
 *  - checkCompletionCondition for all 5 condition types
 *  - Edge cases: duplicate add, complete non-existent, empty registry
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  addTask,
  completeTask,
  getActiveTasks,
  getCompletedTasks,
  isTaskActive,
  isTaskCompleted,
  checkCompletionCondition,
} from '../../src/systems/QuestEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry() {
  const registry = new MockRegistry();
  registry.set(RK.ACTIVE_QUESTS, {});
  registry.set(RK.COMPLETED_QUESTS, {});
  registry.set(RK.GAME_FLAGS, {});
  registry.set(RK.VISITED_LOCATIONS, []);
  registry.set(RK.DIALOGUE_HISTORY, {});
  registry.set(RK.CURRENT_DAY, 1);
  registry.set(RK.PANT_BOTTLES, 0);
  return registry;
}

const SAMPLE_TASK = {
  id: 'story_grocery_run',
  type: 'mission',
  title: 'Buy groceries from Netto',
  description: 'Get rugbrød, pasta, and milk.',
  urgency: 'normal',
  xpReward: 15,
  xpPenalty: 0,
  completionCondition: { type: 'flag', key: 'first_grocery_complete', value: true },
  skippable: false,
};

const SAMPLE_TASK_2 = {
  id: 'story_first_class',
  type: 'mission',
  title: 'Attend the language school',
  description: 'Go to the language school.',
  urgency: 'normal',
  xpReward: 25,
  xpPenalty: 0,
  completionCondition: { type: 'locationVisited', locationId: 'language_school' },
  skippable: false,
};

// ─────────────────────────────────────────────────────────────────────────────
// addTask
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine — addTask', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('adds a task to ACTIVE_QUESTS keyed by id', () => {
    addTask(registry, SAMPLE_TASK);
    const active = registry.get(RK.ACTIVE_QUESTS);
    expect(active[SAMPLE_TASK.id]).toBeDefined();
    expect(active[SAMPLE_TASK.id].title).toBe(SAMPLE_TASK.title);
  });

  it('emits quest:added event', () => {
    const spy = vi.fn();
    registry.events.on('quest:added', spy);
    addTask(registry, SAMPLE_TASK);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy).toHaveBeenCalledWith({ task: SAMPLE_TASK });
  });

  it('does not duplicate when adding same task twice', () => {
    addTask(registry, SAMPLE_TASK);
    addTask(registry, SAMPLE_TASK);
    expect(getActiveTasks(registry)).toHaveLength(1);
  });

  it('can add multiple different tasks', () => {
    addTask(registry, SAMPLE_TASK);
    addTask(registry, SAMPLE_TASK_2);
    expect(getActiveTasks(registry)).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeTask
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine — completeTask', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry();
    addTask(registry, SAMPLE_TASK);
  });

  it('moves task from ACTIVE_QUESTS to COMPLETED_QUESTS', () => {
    completeTask(registry, SAMPLE_TASK.id);
    expect(isTaskActive(registry, SAMPLE_TASK.id)).toBe(false);
    expect(isTaskCompleted(registry, SAMPLE_TASK.id)).toBe(true);
  });

  it('emits quest:completed event', () => {
    const spy = vi.fn();
    registry.events.on('quest:completed', spy);
    completeTask(registry, SAMPLE_TASK.id);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].taskId).toBe(SAMPLE_TASK.id);
  });

  it('is a no-op for non-existent task', () => {
    completeTask(registry, 'non_existent');
    expect(getActiveTasks(registry)).toHaveLength(1);
    expect(getCompletedTasks(registry)).toHaveLength(0);
  });

  it('completed task has completedAt timestamp', () => {
    completeTask(registry, SAMPLE_TASK.id);
    const completed = registry.get(RK.COMPLETED_QUESTS);
    expect(completed[SAMPLE_TASK.id].completedAt).toBeDefined();
    expect(typeof completed[SAMPLE_TASK.id].completedAt).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine — query helpers', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry();
  });

  it('getActiveTasks returns empty array when no quests', () => {
    expect(getActiveTasks(registry)).toEqual([]);
  });

  it('getCompletedTasks returns empty array when no quests', () => {
    expect(getCompletedTasks(registry)).toEqual([]);
  });

  it('getActiveTasks returns array of active tasks', () => {
    addTask(registry, SAMPLE_TASK);
    addTask(registry, SAMPLE_TASK_2);
    const tasks = getActiveTasks(registry);
    expect(tasks).toHaveLength(2);
    expect(tasks.map(t => t.id)).toContain(SAMPLE_TASK.id);
    expect(tasks.map(t => t.id)).toContain(SAMPLE_TASK_2.id);
  });

  it('getCompletedTasks returns completed tasks after completion', () => {
    addTask(registry, SAMPLE_TASK);
    completeTask(registry, SAMPLE_TASK.id);
    const completed = getCompletedTasks(registry);
    expect(completed).toHaveLength(1);
    expect(completed[0].id).toBe(SAMPLE_TASK.id);
  });

  it('isTaskActive returns true only for active tasks', () => {
    addTask(registry, SAMPLE_TASK);
    expect(isTaskActive(registry, SAMPLE_TASK.id)).toBe(true);
    expect(isTaskActive(registry, 'non_existent')).toBe(false);
  });

  it('isTaskCompleted returns true only for completed tasks', () => {
    addTask(registry, SAMPLE_TASK);
    expect(isTaskCompleted(registry, SAMPLE_TASK.id)).toBe(false);
    completeTask(registry, SAMPLE_TASK.id);
    expect(isTaskCompleted(registry, SAMPLE_TASK.id)).toBe(true);
  });

  it('handles missing registry keys gracefully', () => {
    const emptyReg = new MockRegistry();
    expect(getActiveTasks(emptyReg)).toEqual([]);
    expect(getCompletedTasks(emptyReg)).toEqual([]);
    expect(isTaskActive(emptyReg, 'any')).toBe(false);
    expect(isTaskCompleted(emptyReg, 'any')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkCompletionCondition
// ─────────────────────────────────────────────────────────────────────────────

describe('QuestEngine — checkCompletionCondition', () => {
  let registry;

  beforeEach(() => {
    registry = createRegistry();
  });

  // ── flag condition ──

  it('flag condition: returns true when flag matches', () => {
    registry.set(RK.GAME_FLAGS, { first_grocery_complete: true });
    const result = checkCompletionCondition(registry, {
      type: 'flag',
      key: 'first_grocery_complete',
      value: true,
    });
    expect(result).toBe(true);
  });

  it('flag condition: returns false when flag does not match', () => {
    registry.set(RK.GAME_FLAGS, { first_grocery_complete: false });
    const result = checkCompletionCondition(registry, {
      type: 'flag',
      key: 'first_grocery_complete',
      value: true,
    });
    expect(result).toBe(false);
  });

  it('flag condition: returns false when flag is missing', () => {
    const result = checkCompletionCondition(registry, {
      type: 'flag',
      key: 'nonexistent',
      value: true,
    });
    expect(result).toBe(false);
  });

  // ── locationVisited condition ──

  it('locationVisited: returns true when location is in list', () => {
    registry.set(RK.VISITED_LOCATIONS, ['home', 'language_school', 'netto']);
    const result = checkCompletionCondition(registry, {
      type: 'locationVisited',
      locationId: 'language_school',
    });
    expect(result).toBe(true);
  });

  it('locationVisited: returns false when location is not in list', () => {
    registry.set(RK.VISITED_LOCATIONS, ['home']);
    const result = checkCompletionCondition(registry, {
      type: 'locationVisited',
      locationId: 'language_school',
    });
    expect(result).toBe(false);
  });

  it('locationVisited: returns false with empty visited list', () => {
    const result = checkCompletionCondition(registry, {
      type: 'locationVisited',
      locationId: 'anywhere',
    });
    expect(result).toBe(false);
  });

  // ── npcTalked condition ──

  it('npcTalked: returns true when dialogue history has npc entry', () => {
    registry.set(RK.DIALOGUE_HISTORY, {
      thomas_first_meeting: { npcId: 'thomas', completedAt: 1 },
    });
    const result = checkCompletionCondition(registry, {
      type: 'npcTalked',
      npcId: 'thomas',
    });
    expect(result).toBe(true);
  });

  it('npcTalked: returns false when npc not in dialogue history', () => {
    registry.set(RK.DIALOGUE_HISTORY, {
      lars_day1_tutorial: { npcId: 'lars', completedAt: 1 },
    });
    const result = checkCompletionCondition(registry, {
      type: 'npcTalked',
      npcId: 'thomas',
    });
    expect(result).toBe(false);
  });

  // ── dayReached condition ──

  it('dayReached: returns true when current day >= target', () => {
    registry.set(RK.CURRENT_DAY, 7);
    const result = checkCompletionCondition(registry, {
      type: 'dayReached',
      day: 7,
    });
    expect(result).toBe(true);
  });

  it('dayReached: returns true when current day > target', () => {
    registry.set(RK.CURRENT_DAY, 10);
    const result = checkCompletionCondition(registry, {
      type: 'dayReached',
      day: 7,
    });
    expect(result).toBe(true);
  });

  it('dayReached: returns false when current day < target', () => {
    registry.set(RK.CURRENT_DAY, 3);
    const result = checkCompletionCondition(registry, {
      type: 'dayReached',
      day: 7,
    });
    expect(result).toBe(false);
  });

  // ── pantReturned condition ──

  it('pantReturned: returns true when bottles >= minCount', () => {
    registry.set(RK.PANT_BOTTLES, 5);
    const result = checkCompletionCondition(registry, {
      type: 'pantReturned',
      minCount: 5,
    });
    expect(result).toBe(true);
  });

  it('pantReturned: returns true when bottles > minCount', () => {
    registry.set(RK.PANT_BOTTLES, 10);
    const result = checkCompletionCondition(registry, {
      type: 'pantReturned',
      minCount: 5,
    });
    expect(result).toBe(true);
  });

  it('pantReturned: returns false when bottles < minCount', () => {
    registry.set(RK.PANT_BOTTLES, 3);
    const result = checkCompletionCondition(registry, {
      type: 'pantReturned',
      minCount: 5,
    });
    expect(result).toBe(false);
  });

  // ── Edge cases ──

  it('returns true for null condition', () => {
    expect(checkCompletionCondition(registry, null)).toBe(true);
  });

  it('returns true for undefined condition', () => {
    expect(checkCompletionCondition(registry, undefined)).toBe(true);
  });

  it('returns false for unknown condition type', () => {
    expect(checkCompletionCondition(registry, { type: 'unknown' })).toBe(false);
  });
});
