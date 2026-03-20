/**
 * tests/systems/DailyTaskGenerator.test.js
 * Unit tests for all 5 daily task rule generators.
 *
 * Covers:
 *  - generateFoodTask: critical (0 food), urgent (1 food), null (2+ food)
 *  - generateBillTasks: overdue, due in 2 days, upcoming (3-7 days), ignored (8+ days)
 *  - generateVitaminDTask: normal (spring), urgent (winter), null (already taken)
 *  - generateNPCDialogueTask: available NPC, no available, already talked
 *  - generateExploreTask: < 3 locations, 5+ days since new location, null (explored enough)
 *  - generateDailyTasks: combined output
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  generateFoodTask,
  generateBillTasks,
  generateVitaminDTask,
  generateNPCDialogueTask,
  generateExploreTask,
  generateDailyTasks,
} from '../../src/systems/DailyTaskGenerator.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry(overrides = {}) {
  const registry = new MockRegistry();
  registry.set(RK.INVENTORY, overrides.inventory || []);
  registry.set(RK.PLAYER_LOCATION, overrides.location || '');
  registry.set(RK.PENDING_BILLS, overrides.bills || []);
  registry.set(RK.CURRENT_DAY, overrides.day || 1);
  registry.set(RK.VITAMIN_D_TAKEN, overrides.vitaminDTaken || false);
  registry.set(RK.SEASON, overrides.season || 'spring');
  registry.set(RK.DIALOGUE_HISTORY, overrides.dialogueHistory || {});
  registry.set(RK.VISITED_LOCATIONS, overrides.visitedLocations || []);
  registry.set('last_new_location_day', overrides.lastNewLocationDay || 0);
  registry.set('game_flags', overrides.flags || {});
  registry.set('npc_relationships', overrides.relationships || {});
  registry.set(RK.ACTIVE_QUESTS, overrides.activeQuests || {});
  registry.set(RK.COMPLETED_QUESTS, overrides.completedQuests || {});
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// generateFoodTask
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — generateFoodTask', () => {
  it('returns critical task when inventory has 0 food items', () => {
    const registry = createRegistry({ inventory: [] });
    const task = generateFoodTask(registry);
    expect(task).toBeDefined();
    expect(task.urgency).toBe('critical');
    expect(task.id).toBe('daily_food_critical');
    expect(task.xpPenalty).toBe(5);
    expect(task.skippable).toBe(false);
  });

  it('returns urgent task when inventory has exactly 1 food item', () => {
    const registry = createRegistry({
      inventory: [{ id: 'rugbrod', category: 'food' }],
    });
    const task = generateFoodTask(registry);
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent');
    expect(task.id).toBe('daily_food_low');
    expect(task.skippable).toBe(true);
  });

  it('returns null when inventory has 2+ food items', () => {
    const registry = createRegistry({
      inventory: [
        { id: 'rugbrod', category: 'food' },
        { id: 'milk', category: 'food' },
      ],
    });
    const task = generateFoodTask(registry);
    expect(task).toBeNull();
  });

  it('recognizes string food items by ID', () => {
    const registry = createRegistry({ inventory: ['milk'] });
    const task = generateFoodTask(registry);
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent'); // 1 food item
  });

  it('does not count non-food items', () => {
    const registry = createRegistry({
      inventory: [
        { id: 'bike_light', category: 'equipment' },
        { id: 'rejsekort', category: 'transport' },
      ],
    });
    const task = generateFoodTask(registry);
    expect(task).toBeDefined();
    expect(task.urgency).toBe('critical'); // 0 food items
  });

  it('includes nearest shop name in title', () => {
    const registry = createRegistry({ location: 'bilka_area', inventory: [] });
    const task = generateFoodTask(registry);
    expect(task.title).toContain('Bilka');
  });

  it('defaults to Netto when no location match', () => {
    const registry = createRegistry({ location: 'apartment', inventory: [] });
    const task = generateFoodTask(registry);
    expect(task.title).toContain('Netto');
  });

  it('detects Kvickly from location', () => {
    const registry = createRegistry({ location: 'kvickly_store', inventory: [] });
    const task = generateFoodTask(registry);
    expect(task.title).toContain('Kvickly');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateBillTasks
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — generateBillTasks', () => {
  it('returns empty array when no pending bills', () => {
    const registry = createRegistry({ bills: [] });
    const tasks = generateBillTasks(registry);
    expect(tasks).toEqual([]);
  });

  it('returns critical overdue bill task', () => {
    const registry = createRegistry({
      day: 10,
      bills: [{ id: 'rent_1', type: 'Rent', amount: 5000, dueDay: 8, penalty: 500 }],
    });
    const tasks = generateBillTasks(registry);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].urgency).toBe('critical');
    expect(tasks[0].title).toContain('OVERDUE');
    expect(tasks[0].title).toContain('Rent');
    expect(tasks[0].description).toContain('Late fee');
    expect(tasks[0].skippable).toBe(false);
  });

  it('returns urgent bill task when due in 1-2 days', () => {
    const registry = createRegistry({
      day: 8,
      bills: [{ id: 'elec_1', type: 'Electric', amount: 800, dueDay: 10 }],
    });
    const tasks = generateBillTasks(registry);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].urgency).toBe('urgent');
    expect(tasks[0].title).toContain('2 days');
  });

  it('returns normal bill task when due in 3-7 days', () => {
    const registry = createRegistry({
      day: 3,
      bills: [{ id: 'internet_1', type: 'Internet', amount: 300, dueDay: 8 }],
    });
    const tasks = generateBillTasks(registry);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].urgency).toBe('normal');
    expect(tasks[0].title).toContain('Upcoming');
    expect(tasks[0].skippable).toBe(true);
  });

  it('returns no task for bills more than 7 days out', () => {
    const registry = createRegistry({
      day: 1,
      bills: [{ id: 'future_1', type: 'Insurance', amount: 2000, dueDay: 20 }],
    });
    const tasks = generateBillTasks(registry);
    expect(tasks).toHaveLength(0);
  });

  it('handles multiple bills of different urgencies', () => {
    const registry = createRegistry({
      day: 10,
      bills: [
        { id: 'b1', type: 'Rent', amount: 5000, dueDay: 8, penalty: 500 },
        { id: 'b2', type: 'Electric', amount: 800, dueDay: 12 },
        { id: 'b3', type: 'Internet', amount: 300, dueDay: 15 },
      ],
    });
    const tasks = generateBillTasks(registry);
    expect(tasks).toHaveLength(3);
    expect(tasks[0].urgency).toBe('critical');  // overdue
    expect(tasks[1].urgency).toBe('urgent');    // due in 2 days
    expect(tasks[2].urgency).toBe('normal');    // due in 5 days
  });

  it('overdue bill without penalty has no late fee text', () => {
    const registry = createRegistry({
      day: 10,
      bills: [{ id: 'b1', type: 'Rent', amount: 5000, dueDay: 8 }],
    });
    const tasks = generateBillTasks(registry);
    expect(tasks[0].description).not.toContain('Late fee');
  });

  it('bill due on same day shows 0 days', () => {
    const registry = createRegistry({
      day: 10,
      bills: [{ id: 'b1', type: 'Phone', amount: 200, dueDay: 10 }],
    });
    const tasks = generateBillTasks(registry);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].urgency).toBe('urgent');
    expect(tasks[0].title).toContain('0 days');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateVitaminDTask
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — generateVitaminDTask', () => {
  it('returns normal urgency task in spring', () => {
    const registry = createRegistry({ season: 'spring' });
    const task = generateVitaminDTask(registry);
    expect(task).toBeDefined();
    expect(task.urgency).toBe('normal');
    expect(task.id).toBe('daily_vitamin_d');
  });

  it('returns urgent task in winter with seasonal text', () => {
    const registry = createRegistry({ season: 'winter' });
    const task = generateVitaminDTask(registry);
    expect(task).toBeDefined();
    expect(task.urgency).toBe('urgent');
    expect(task.description).toContain('dark Danish winter');
  });

  it('returns null when vitamin D already taken', () => {
    const registry = createRegistry({ vitaminDTaken: true });
    const task = generateVitaminDTask(registry);
    expect(task).toBeNull();
  });

  it('returns normal urgency in summer', () => {
    const registry = createRegistry({ season: 'summer' });
    const task = generateVitaminDTask(registry);
    expect(task).toBeDefined();
    expect(task.urgency).toBe('normal');
  });

  it('description does not include winter text in non-winter seasons', () => {
    const registry = createRegistry({ season: 'autumn' });
    const task = generateVitaminDTask(registry);
    expect(task.description).not.toContain('dark Danish winter');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateNPCDialogueTask
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — generateNPCDialogueTask', () => {
  it('returns NPC nudge when dialogue is available and not completed', () => {
    const registry = createRegistry({
      day: 3,
      flags: { character_creation_complete: true },
    });
    const qe = {
      isTaskActive: () => false,
      isTaskCompleted: () => false,
    };
    const task = generateNPCDialogueTask(registry, qe);
    expect(task).toBeDefined();
    expect(task.id).toMatch(/^daily_npc_/);
    expect(task.type).toBe('daily');
  });

  it('returns null when all available dialogues are in history', () => {
    const registry = createRegistry({
      day: 1,
      flags: { character_creation_complete: true },
      dialogueHistory: {
        lars_day1_tutorial: { npcId: 'lars', completedAt: 1 },
      },
    });
    const qe = {
      isTaskActive: () => false,
      isTaskCompleted: () => false,
    };
    const task = generateNPCDialogueTask(registry, qe);
    expect(task).toBeNull();
  });

  it('returns null when no dialogues are available', () => {
    const registry = createRegistry({ day: 1 }); // no flags set
    const task = generateNPCDialogueTask(registry, null);
    expect(task).toBeNull();
  });

  it('picks the first (highest priority) available entry', () => {
    const registry = createRegistry({
      day: 3,
      flags: { character_creation_complete: true },
    });
    const qe = {
      isTaskActive: () => false,
      isTaskCompleted: () => false,
    };
    const task = generateNPCDialogueTask(registry, qe);
    // Day 1 entry (lars) should be first in MISSION_SCHEDULE, so it's picked
    expect(task).toBeDefined();
    expect(task.id).toBe('daily_npc_lars');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateExploreTask
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — generateExploreTask', () => {
  it('returns explore task when < 3 locations visited', () => {
    const registry = createRegistry({ visitedLocations: ['home', 'netto'] });
    const task = generateExploreTask(registry);
    expect(task).toBeDefined();
    expect(task.id).toBe('daily_explore');
    expect(task.urgency).toBe('low');
  });

  it('returns explore task when 5+ days since last new location', () => {
    const registry = createRegistry({
      visitedLocations: ['home', 'netto', 'metro_station', 'language_school'],
      day: 10,
      lastNewLocationDay: 4,
    });
    const task = generateExploreTask(registry);
    expect(task).toBeDefined();
    expect(task.id).toBe('daily_explore');
  });

  it('returns null when recently explored and 3+ locations visited', () => {
    const registry = createRegistry({
      visitedLocations: ['home', 'netto', 'metro_station'],
      day: 5,
      lastNewLocationDay: 3,
    });
    const task = generateExploreTask(registry);
    expect(task).toBeNull();
  });

  it('returns null when 3+ locations visited and lastNewLocationDay is 0', () => {
    const registry = createRegistry({
      visitedLocations: ['home', 'netto', 'metro_station'],
      day: 5,
      lastNewLocationDay: 0,
    });
    const task = generateExploreTask(registry);
    expect(task).toBeNull();
  });

  it('returns task when 0 locations visited', () => {
    const registry = createRegistry({ visitedLocations: [] });
    const task = generateExploreTask(registry);
    expect(task).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateDailyTasks — combined
// ─────────────────────────────────────────────────────────────────────────────

describe('DailyTaskGenerator — generateDailyTasks', () => {
  it('returns all applicable tasks', () => {
    const registry = createRegistry({
      inventory: [],
      season: 'winter',
      visitedLocations: ['home'],
      day: 1,
      flags: { character_creation_complete: true },
    });
    const qe = {
      isTaskActive: () => false,
      isTaskCompleted: () => false,
    };
    const tasks = generateDailyTasks(registry, qe);

    // Should include: food (critical), vitamin D (urgent), NPC nudge, explore
    expect(tasks.length).toBeGreaterThanOrEqual(3);

    const ids = tasks.map(t => t.id);
    expect(ids).toContain('daily_food_critical');
    expect(ids).toContain('daily_vitamin_d');
    expect(ids).toContain('daily_explore');
  });

  it('returns empty food/bills when state is good', () => {
    const registry = createRegistry({
      inventory: [
        { id: 'rugbrod', category: 'food' },
        { id: 'milk', category: 'food' },
      ],
      vitaminDTaken: true,
      visitedLocations: ['home', 'netto', 'metro_station'],
      day: 3,
      lastNewLocationDay: 2,
    });
    const tasks = generateDailyTasks(registry, null);
    // No food task, no vitamin D, no explore (recently explored + 3 locations)
    const ids = tasks.map(t => t.id);
    expect(ids).not.toContain('daily_food_critical');
    expect(ids).not.toContain('daily_food_low');
    expect(ids).not.toContain('daily_vitamin_d');
    expect(ids).not.toContain('daily_explore');
  });

  it('includes bill tasks when bills are pending', () => {
    const registry = createRegistry({
      inventory: [{ id: 'milk', category: 'food' }, { id: 'bread', category: 'food' }],
      vitaminDTaken: true,
      day: 10,
      bills: [
        { id: 'rent_1', type: 'Rent', amount: 5000, dueDay: 8, penalty: 500 },
      ],
      visitedLocations: ['home', 'netto', 'metro_station'],
      lastNewLocationDay: 9,
    });
    const tasks = generateDailyTasks(registry, null);
    const billTask = tasks.find(t => t.id.startsWith('daily_bill_'));
    expect(billTask).toBeDefined();
    expect(billTask.urgency).toBe('critical');
  });
});
