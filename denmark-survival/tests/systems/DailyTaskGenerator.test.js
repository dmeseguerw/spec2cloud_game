/**
 * tests/systems/DailyTaskGenerator.test.js
 * Unit tests for DailyTaskGenerator — all 7 rules, correct urgencies,
 * deterministic IDs, and winter vitamin D escalation.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { generateDailyTasks } from '../../src/systems/DailyTaskGenerator.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(opts = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,     opts.day      ?? 1);
  r.set(RK.PLAYER_HEALTH,   opts.health   ?? 100);
  r.set(RK.PLAYER_XP,       opts.xp       ?? 0);
  r.set(RK.PLAYER_LEVEL,    opts.level    ?? 1);
  r.set(RK.INVENTORY,       opts.inventory ?? []);
  r.set(RK.PENDING_BILLS,   opts.bills    ?? []);
  r.set(RK.VISITED_LOCATIONS, opts.visitedLocations ?? []);
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
function bill(id, label, dueDay, status = 'pending') {
  return { id, label, dueDay, status, amount: 500, type: 'rent', arrivedDay: dueDay - 5 };
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
});

// ─────────────────────────────────────────────────────────────────────────────
// Rule 2: low_food
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 2: low_food', () => {
  it('generates low_food task when exactly 1 food item present', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 1)] });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_low_food'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent');
    expect(task.skippable).toBe(true);
  });

  it('does NOT generate low_food when food count > 1', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 2)] });
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
// Rule 3: bill_overdue
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
// Rule 4: bill_due_soon
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

  it('bill_due_soon title includes days remaining', () => {
    const currentDay = 9;
    const r = makeRegistry({
      bills: [bill('rent_month0', 'Husleje (Rent)', 10)], // 1 day from now
    });
    const tasks = generateDailyTasks(r, currentDay, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_bill_due_soon'));
    expect(task.title).toContain('1 day');
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
// Rule 5: no_vitamin_d
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 5: no_vitamin_d', () => {
  it('generates no_vitamin_d task when vitamin_d quantity is 0', () => {
    const r = makeRegistry({ inventory: [inv('rugbrod', 5)] }); // has food, no vit_d
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_no_vitamin_d'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('normal');
  });

  it('urgency is "urgent" in winter', () => {
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
// Rule 7: explore_nudge
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — Rule 7: explore_nudge', () => {
  it('generates explore_nudge when no locations visited', () => {
    const r = makeRegistry({
      inventory:      [inv('rugbrod', 5)],
      visitedLocations: [],
    });
    const tasks = generateDailyTasks(r, 1, 'spring');
    const task = tasks.find(t => t.id.startsWith('daily_explore_nudge'));
    expect(task).toBeDefined();
    expect(task.urgency).toBe('low');
  });

  it('generates explore_nudge when ≥5 days since last new location', () => {
    const r = makeRegistry({
      inventory:          [inv('rugbrod', 5)],
      visitedLocations:   ['supermarket'],
      lastNewLocationDay: 1,
    });
    const tasks = generateDailyTasks(r, 6, 'spring'); // day 6 - day 1 = 5 ≥ 5
    const task = tasks.find(t => t.id.startsWith('daily_explore_nudge'));
    expect(task).toBeDefined();
  });

  it('does NOT generate explore_nudge when recently explored', () => {
    const r = makeRegistry({
      inventory:          [inv('rugbrod', 5)],
      visitedLocations:   ['supermarket'],
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

  it('returns an array (may be empty when all conditions are fine)', () => {
    const r = makeRegistry({
      inventory: [inv('rugbrod', 5), inv('vitamin_d', 2)],
      health: 80,
      visitedLocations: ['supermarket'],
      lastNewLocationDay: 3, // day 5 - day 3 = 2 < 5
    });
    const tasks = generateDailyTasks(r, 5, 'spring');
    expect(Array.isArray(tasks)).toBe(true);
  });
});
