/**
 * tests/systems/DailyTaskGenerator.test.js
 * Unit tests for DailyTaskGenerator — all 8 rules, correct urgencies,
 * deterministic IDs, and Task 027 tuning fixes.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { generateDailyTasks } from '../../src/systems/DailyTaskGenerator.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { MISSION_SCHEDULE } from '../../src/data/missionSchedule.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build a registry with all NPC dialogues already completed so NPC nudge is suppressed. */
function allDialoguesCompleted() {
  const history = {};
  for (const entry of MISSION_SCHEDULE) {
    history[entry.dialogueId] = { completedAt: 1 };
  }
  return history;
}

function makeRegistry(opts = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,     opts.day      ?? 1);
  r.set(RK.PLAYER_HEALTH,   opts.health   ?? 100);
  r.set(RK.PLAYER_XP,       opts.xp       ?? 0);
  r.set(RK.PLAYER_LEVEL,    opts.level    ?? 1);
  r.set(RK.INVENTORY,       opts.inventory ?? []);
  r.set(RK.PENDING_BILLS,   opts.bills    ?? []);
  r.set(RK.VISITED_LOCATIONS, opts.visitedLocations ?? ['loc1', 'loc2', 'loc3']);
  r.set(RK.DIALOGUE_HISTORY, opts.dialogueHistory ?? allDialoguesCompleted());
  r.set(RK.NPC_RELATIONSHIPS, opts.npcRelationships ?? {});
  r.set(RK.ACTIVE_TASKS,    opts.activeTasks ?? []);
  r.set(RK.COMPLETED_TASKS, opts.completedTasks ?? []);
  if (opts.lastNewLocationDay !== undefined) {
    r.set('last_new_location_day', opts.lastNewLocationDay);
  }
  return r;
}

/**
 * Build a minimal inventory entry in the format InventoryManager uses.
 */
function inv(itemId, quantity = 1) {
  return { itemId, quantity, acquiredDay: 1 };
}

/**
 * Build a pending bill object.
 */
function bill(id, label, dueDay, status = 'pending', amount = 500) {
  return { id, label, dueDay, status, amount, type: 'rent', arrivedDay: dueDay - 5 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rule 1: no_food
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 1: no_food', () => {
  it('generates no_food task when food inventory is empty', () => {
    const r = makeRegistry({ inventory: [] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_no_food'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('critical');
    expect(task.skippable).toBe(false);
  });

  it('no_food task has correct type and fields', () => {
    const r = makeRegistry({ inventory: [] });
    const tasks = generateDailyTasks(r, 3, 'spring');
    const task = tasks.find(t => t.id === 'daily_no_food_day3');
    expect(task).toBeDefined();
    expect(task.type).toBe('daily');
    expect(task.icon).toBe('🚨');
    expect(task.xpPenalty).toBe(10);
  });

  it('does NOT generate no_food when there is food', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 2)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_no_food'))).toBeUndefined();
  });

  it('does NOT generate low_food when no_food is triggered (exclusive rules)', () => {
    const r = makeRegistry({ inventory: [] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_low_food'))).toBeUndefined();
  });

  it('counts only food category items for food check', () => {
    // vitamin_d is not food category — should still trigger no_food
    const r = makeRegistry({ inventory: [inv('vitamin_d', 3)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_no_food'))).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 2: low_food (Task 027 tuning: count items not stacks)
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 2: low_food', () => {
  it('generates low_food task when exactly 1 food item exists', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 1)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_low_food'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent');
    expect(task.skippable).toBe(true);
  });

  it('generates low_food even when 1 food item has large quantity stack (Task 027: count items not stacks)', () => {
    // 10 units of rugbrod is still only 1 distinct food item
    const r = makeRegistry({ inventory: [inv('rugbrod', 10)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_low_food'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent');
  });

  it('does NOT generate low_food when 2+ distinct food items are present', () => {
    // Two distinct food items — no longer "low"
    const r = makeRegistry({ inventory: [inv('rugbrod', 1), inv('pasta', 1)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_low_food'))).toBeUndefined();
  });

  it('does NOT generate low_food when no_food is already triggered', () => {
    const r = makeRegistry({ inventory: [] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_low_food'))).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 3: bill_overdue (Task 027 tuning: title includes type + amount)
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 3: bill_overdue', () => {
  it('generates bill_overdue task when a bill is past due date', () => {
    const currentDay = 10;
    const r = makeRegistry({
      bills: [bill('rent_month0', 'Husleje (Rent)', 8)], // dueDay < currentDay
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_bill_overdue'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent');
  });

  it('bill_overdue title includes type and amount (Task 027 tuning)', () => {
    const currentDay = 10;
    const r = makeRegistry({
      bills: [{ id: 'rent1', label: 'Husleje', dueDay: 8, status: 'pending', amount: 8000, type: 'rent', arrivedDay: 3 }],
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_bill_overdue'));
    expect(task.title).toContain('Rent');
    expect(task.title).toContain('8');
    expect(task.title).toContain('overdue');
  });

  it('does NOT generate bill_overdue for a bill due in the future', () => {
    const currentDay = 5;
    const r = makeRegistry({
      bills: [bill('rent_month0', 'Husleje (Rent)', 10)], // dueDay > currentDay
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_bill_overdue'))).toBeUndefined();
  });

  it('does NOT generate bill_overdue for a paid bill', () => {
    const currentDay = 10;
    const r = makeRegistry({
      bills: [bill('rent_month0', 'Husleje (Rent)', 8, 'paid')],
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_bill_overdue'))).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 4: bill_due_soon (Task 027 tuning: title includes type + amount)
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 4: bill_due_soon', () => {
  it('generates bill_due_soon when bill is due within 2 days', () => {
    const currentDay = 8;
    const r = makeRegistry({
      bills: [bill('rent_month0', 'Husleje (Rent)', 10)], // 2 days from now
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_bill_due_soon'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('normal');
  });

  it('bill_due_soon title includes type, amount, and days remaining (Task 027 tuning)', () => {
    const currentDay = 9;
    const r = makeRegistry({
      bills: [{ id: 'rent1', label: 'Husleje', dueDay: 10, status: 'pending', amount: 8000, type: 'rent', arrivedDay: 5 }],
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_bill_due_soon'));
    expect(task.title).toContain('Rent');
    expect(task.title).toContain('8');
    expect(task.title).toContain('1 day');
  });

  it('bill_due_soon title "2 days" for bill due in 2 days (Task 027 tuning)', () => {
    const currentDay = 8;
    const r = makeRegistry({
      bills: [{ id: 'rent1', label: 'Husleje', dueDay: 10, status: 'pending', amount: 8000, type: 'rent', arrivedDay: 5 }],
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_bill_due_soon'));
    expect(task.title).toContain('2 days');
  });

  it('does NOT generate bill_due_soon for bill due in 3+ days', () => {
    const currentDay = 5;
    const r = makeRegistry({
      bills: [bill('rent_month0', 'Husleje (Rent)', 10)], // 5 days from now
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_bill_due_soon'))).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 5: no_vitamin_d (Task 027: winter description, urgency escalation)
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 5: no_vitamin_d', () => {
  it('generates no_vitamin_d task when vitamin_d quantity is 0', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)] }); // has food, no vit_d
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_no_vitamin_d'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('normal');
  });

  it('urgency is "urgent" in winter (Task 027 tuning)', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)] });
    const tasks = generateDailyTasks(r, 1, 'winter');
    const task = tasks.find(t => t.id.startsWith('daily_no_vitamin_d'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent');
  });

  it('urgency is "normal" in other seasons', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)] });
    for (const season of ['spring', 'summer', 'autumn']) {
      const tasks = generateDailyTasks(r, 1, season);
      const task = tasks.find(t => t.id.startsWith('daily_no_vitamin_d'));
      expect(task.urgency).toBe('normal');
    }
  });

  it('winter description includes "The dark Danish winter demands it" (Task 027 tuning)', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)] });
    const tasks = generateDailyTasks(r, 1, 'winter');
    const task = tasks.find(t => t.id.startsWith('daily_no_vitamin_d'));
    expect(task.description).toContain('The dark Danish winter demands it');
  });

  it('non-winter description does NOT include winter flavour text', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_no_vitamin_d'));
    expect(task.description).not.toContain('The dark Danish winter demands it');
  });

  it('does NOT generate no_vitamin_d when vitamin_d is present', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5), inv('vitamin_d', 1)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_no_vitamin_d'))).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 6: low_health
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 6: low_health', () => {
  it('generates low_health task when health is below 40', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)], health: 30 });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_low_health'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('normal');
  });

  it('does NOT generate low_health when health is exactly 40', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)], health: 40 });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_low_health'))).toBeUndefined();
  });

  it('does NOT generate low_health when health is above 40', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)], health: 80 });
    const tasks = generateDailyTasks(r, 1, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_low_health'))).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 7: NPC dialogue nudge (Task 027 new rule)
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 7: npc_nudge', () => {
  it('surfaces an NPC nudge when a story dialogue is available', () => {
    // Day 1, no dialogues completed yet, no relationship prerequisites blocking
    const r = makeRegistry({
      inventory: [inv('rugbrod', 5), inv('pasta', 1), inv('milk', 1)],
      dialogueHistory: {},
      day: 1,
    });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_npc_nudge'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('normal');
    expect(task.title).toContain('seems to want to talk');
  });

  it('only surfaces ONE NPC nudge per day (highest priority wins)', () => {
    const r = makeRegistry({
      inventory: [inv('rugbrod', 5), inv('pasta', 1), inv('milk', 1)],
      dialogueHistory: {},
      day: 3,
    });
    const tasks = generateDailyTasks(r, 3, 'spring');
    const npcTasks = tasks.filter(t => t.id.startsWith('daily_npc_nudge'));
    expect(npcTasks.length).toBeLessThanOrEqual(1);
  });

  it('does NOT generate NPC nudge when all story dialogues have been completed', () => {
    const r = makeRegistry({
      inventory: [inv('rugbrod', 5), inv('pasta', 1), inv('milk', 1)],
      dialogueHistory: allDialoguesCompleted(),
      day: 14,
    });
    const tasks = generateDailyTasks(r, 14, 'spring');
    expect(tasks.find(t => t.id.startsWith('daily_npc_nudge'))).toBeUndefined();
  });

  it('NPC nudge completion condition is npcTalked', () => {
    const r = makeRegistry({
      inventory: [inv('rugbrod', 5), inv('pasta', 1), inv('milk', 1)],
      dialogueHistory: {},
      day: 1,
    });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_npc_nudge'));
    expect(task.completionCondition.type).toBe('npcTalked');
  });

  it('does NOT surface dialogue that requires a day not yet reached', () => {
    // Day 1, lars_day2_language requires day 2
    const r = makeRegistry({
      inventory: [inv('rugbrod', 5), inv('pasta', 1), inv('milk', 1)],
      dialogueHistory: { lars_day1_tutorial: { completedAt: 1 } }, // day1 done
      day: 1,
    });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const npcTask = tasks.find(t => t.id.startsWith('daily_npc_nudge'));
    // If there's a nudge, it shouldn't be lars (day2+ requirement)
    if (npcTask) {
      expect(npcTask.completionCondition.npcId).not.toBe('lars');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 8: explore_nudge (Task 027 tuning: < 3 locations OR 5+ days)
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 8: explore_nudge', () => {
  it('generates explore_nudge when fewer than 3 locations visited', () => {
    const r = makeRegistry({
      inventory:        [inv('rugbrod', 5)],
      visitedLocations: ['supermarket'], // only 1 location
      lastNewLocationDay: 1,
    });
    // day 2 - day 1 = 1 < 5, but < 3 locations triggers it
    const tasks = generateDailyTasks(r, 2, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_explore_nudge'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('low');
  });

  it('generates explore_nudge when exactly 2 locations visited (< 3 threshold)', () => {
    const r = makeRegistry({
      inventory:        [inv('rugbrod', 5)],
      visitedLocations: ['supermarket', 'metro_station'],
      lastNewLocationDay: 1,
    });
    const tasks = generateDailyTasks(r, 2, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_explore_nudge'));
    expect(task).toBeDefined();
  });

  it('generates explore_nudge when ≥5 days since last new location', () => {
    const r = makeRegistry({
      inventory:          [inv('rugbrod', 5)],
      visitedLocations:   ['loc1', 'loc2', 'loc3', 'loc4'], // 4 locations, ≥ 3
      lastNewLocationDay: 1,
    });
    const tasks = generateDailyTasks(r, 6, 'spring'); // day 6 - day 1 = 5 ≥ 5
    const task = tasks.find(t => t.id.startsWith('daily_explore_nudge'));
    expect(task).toBeDefined();
  });

  it('does NOT generate explore_nudge when 3+ locations visited and recently explored', () => {
    const r = makeRegistry({
      inventory:          [inv('rugbrod', 5)],
      visitedLocations:   ['loc1', 'loc2', 'loc3'], // exactly 3 locations
      lastNewLocationDay: 4,
    });
    const tasks = generateDailyTasks(r, 6, 'spring'); // day 6 - day 4 = 2 < 5
    expect(tasks.find(t => t.id.startsWith('daily_explore_nudge'))).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic IDs
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — deterministic IDs', () => {
  it('generates ID with format daily_{ruleKey}_day{N}', () => {
    const r = makeRegistry({ inventory: [] });
    const tasks = generateDailyTasks(r, 5, 'spring');
    const task = tasks.find(t => t.id === 'daily_no_food_day5');
    expect(task).toBeDefined();
  });

  it('different days produce different IDs', () => {
    const r = makeRegistry({ inventory: [] });
    const tasks1 = generateDailyTasks(r, 3, 'spring');
    const tasks2 = generateDailyTasks(r, 7, 'spring');
    const id1 = tasks1.find(t => t.id.startsWith('daily_no_food')).id;
    const id2 = tasks2.find(t => t.id.startsWith('daily_no_food')).id;
    expect(id1).not.toBe(id2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Task object schema
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — task object schema', () => {
  it('all generated tasks have required schema fields', () => {
    const r = makeRegistry({ inventory: [], health: 30 });
    const tasks = generateDailyTasks(r, 1, 'winter');
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      expect(task.id).toBeDefined();
      expect(task.type).toBe('daily');
      expect(task.title).toBeDefined();
      expect(task.description).toBeDefined();
      expect(task.icon).toBeDefined();
      expect(['low', 'normal', 'urgent', 'critical']).toContain(task.urgency);
      expect(task.status).toBe('active');
      expect(typeof task.xpReward).toBe('number');
      expect(typeof task.xpPenalty).toBe('number');
      expect(typeof task.skippable).toBe('boolean');
      expect(task.assignedDay).toBe(1);
      expect(task.completedDay).toBeNull();
    }
  });

  it('returns an array', () => {
    const r = makeRegistry({
      inventory: [inv('rugbrod', 5), inv('pasta', 1), inv('milk', 1), inv('vitamin_d', 2)],
      health: 80,
      visitedLocations: ['loc1', 'loc2', 'loc3'],
      lastNewLocationDay: 3, // day 5 - day 3 = 2 < 5
    });
    const tasks = generateDailyTasks(r, 5, 'spring');
    expect(Array.isArray(tasks)).toBe(true);
  });
});
