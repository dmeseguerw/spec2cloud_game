/**
 * tests/systems/DayCycleEngine.test.js
 * Unit and integration tests for DayCycleEngine.
 * Coverage target: ≥85% of src/systems/DayCycleEngine.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  initDayCycle,
  advanceTimePeriod,
  resetTimePeriod,
  getActivitySlotsRemaining,
  hasActivitySlotsRemaining,
  completeActivity,
  resetActivitySlots,
  addMandatoryActivity,
  getPendingMandatoryActivities,
  processMissedMandatoryActivities,
  clearMandatoryActivities,
  endDay,
  advanceDay,
  PERIOD_MORNING,
  PERIOD_AFTERNOON,
  PERIOD_EVENING,
  PERIOD_NIGHT,
  TIME_PERIODS,
  PERIOD_HOURS,
  DEFAULT_ACTIVITY_SLOTS,
  MIN_ACTIVITY_SLOTS,
  MAX_ACTIVITY_SLOTS,
  ACTIVITY_WORK,
  ACTIVITY_GROCERY,
  ACTIVITY_BILL_PAYMENT,
  ACTIVITY_VITAMIN_D,
  MANDATORY_SKIP_PENALTIES,
} from '../../src/systems/DayCycleEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  TIME_ADVANCED,
  ACTIVITY_COMPLETED,
  MANDATORY_ACTIVITY_MISSED,
  DAY_ENDED,
  DAY_ADVANCED,
} from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(options = {}) {
  const r = new MockRegistry();
  if (options.day !== undefined)              r.set(RK.CURRENT_DAY, options.day);
  if (options.timePeriod !== undefined)       r.set(RK.TIME_OF_DAY, options.timePeriod);
  if (options.slots !== undefined)            r.set(RK.ACTIVITY_SLOTS_REMAINING, options.slots);
  if (options.mandatoryActivities !== undefined) r.set(RK.MANDATORY_ACTIVITIES, options.mandatoryActivities);
  if (options.inventory !== undefined)        r.set(RK.INVENTORY, options.inventory);
  if (options.xp !== undefined)               r.set(RK.PLAYER_XP, options.xp);
  if (options.level !== undefined)            r.set(RK.PLAYER_LEVEL, options.level);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('DayCycleEngine constants', () => {
  it('TIME_PERIODS has 4 entries in correct order', () => {
    expect(TIME_PERIODS).toEqual([PERIOD_MORNING, PERIOD_AFTERNOON, PERIOD_EVENING, PERIOD_NIGHT]);
  });

  it('DEFAULT_ACTIVITY_SLOTS is 4', () => {
    expect(DEFAULT_ACTIVITY_SLOTS).toBe(4);
  });

  it('MIN_ACTIVITY_SLOTS is 3, MAX is 5', () => {
    expect(MIN_ACTIVITY_SLOTS).toBe(3);
    expect(MAX_ACTIVITY_SLOTS).toBe(5);
  });

  it('PERIOD_HOURS defines time ranges for all periods', () => {
    expect(PERIOD_HOURS[PERIOD_MORNING]).toBe('07:00–12:00');
    expect(PERIOD_HOURS[PERIOD_AFTERNOON]).toBe('12:00–17:00');
    expect(PERIOD_HOURS[PERIOD_EVENING]).toBe('17:00–22:00');
    expect(PERIOD_HOURS[PERIOD_NIGHT]).toBe('22:00–07:00');
  });

  it('MANDATORY_SKIP_PENALTIES has entries for all mandatory activities', () => {
    expect(MANDATORY_SKIP_PENALTIES[ACTIVITY_WORK]).toBeGreaterThan(0);
    expect(MANDATORY_SKIP_PENALTIES[ACTIVITY_GROCERY]).toBeGreaterThan(0);
    expect(MANDATORY_SKIP_PENALTIES[ACTIVITY_BILL_PAYMENT]).toBeGreaterThan(0);
    expect(MANDATORY_SKIP_PENALTIES[ACTIVITY_VITAMIN_D]).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// initDayCycle
// ─────────────────────────────────────────────────────────────────────────────

describe('initDayCycle', () => {
  it('sets CURRENT_DAY=1, TIME_OF_DAY=Morning, slots=DEFAULT on fresh registry', () => {
    const registry = new MockRegistry();
    initDayCycle(registry);
    expect(registry.get(RK.CURRENT_DAY)).toBe(1);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_MORNING);
    expect(registry.get(RK.ACTIVITY_SLOTS_REMAINING)).toBe(DEFAULT_ACTIVITY_SLOTS);
    expect(registry.get(RK.MANDATORY_ACTIVITIES)).toEqual([]);
  });

  it('does not overwrite existing values', () => {
    const registry = makeRegistry({ day: 10, timePeriod: PERIOD_EVENING, slots: 2 });
    initDayCycle(registry);
    expect(registry.get(RK.CURRENT_DAY)).toBe(10);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_EVENING);
    expect(registry.get(RK.ACTIVITY_SLOTS_REMAINING)).toBe(2);
  });

  it('accepts custom initial slot count', () => {
    const registry = new MockRegistry();
    initDayCycle(registry, { slots: 5 });
    expect(registry.get(RK.ACTIVITY_SLOTS_REMAINING)).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// advanceTimePeriod
// ─────────────────────────────────────────────────────────────────────────────

describe('advanceTimePeriod — time period progression', () => {
  it('Morning → Afternoon', () => {
    const registry = makeRegistry({ timePeriod: PERIOD_MORNING });
    const result   = advanceTimePeriod(registry);
    expect(result.current).toBe(PERIOD_AFTERNOON);
    expect(result.previous).toBe(PERIOD_MORNING);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_AFTERNOON);
  });

  it('Afternoon → Evening', () => {
    const registry = makeRegistry({ timePeriod: PERIOD_AFTERNOON });
    const result   = advanceTimePeriod(registry);
    expect(result.current).toBe(PERIOD_EVENING);
  });

  it('Evening → Night', () => {
    const registry = makeRegistry({ timePeriod: PERIOD_EVENING });
    const result   = advanceTimePeriod(registry);
    expect(result.current).toBe(PERIOD_NIGHT);
    expect(result.wrappedToNight).toBe(true);
  });

  it('Night stays at Night (does not wrap around)', () => {
    const registry = makeRegistry({ timePeriod: PERIOD_NIGHT });
    const result   = advanceTimePeriod(registry);
    expect(result.current).toBe(PERIOD_NIGHT);
    expect(result.previous).toBe(PERIOD_NIGHT);
  });

  it('defaults to Morning when TIME_OF_DAY is not set', () => {
    const registry = new MockRegistry();
    const result   = advanceTimePeriod(registry);
    expect(result.previous).toBe(PERIOD_MORNING);
    expect(result.current).toBe(PERIOD_AFTERNOON);
  });

  it('emits TIME_ADVANCED with correct payload', () => {
    const registry = makeRegistry({ timePeriod: PERIOD_MORNING });
    const handler  = vi.fn();
    registry.events.on(TIME_ADVANCED, handler);

    advanceTimePeriod(registry);

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.previous).toBe(PERIOD_MORNING);
    expect(payload.current).toBe(PERIOD_AFTERNOON);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resetTimePeriod
// ─────────────────────────────────────────────────────────────────────────────

describe('resetTimePeriod', () => {
  it('resets time period to Morning from any state', () => {
    const registry = makeRegistry({ timePeriod: PERIOD_NIGHT });
    resetTimePeriod(registry);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_MORNING);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Activity slot management
// ─────────────────────────────────────────────────────────────────────────────

describe('getActivitySlotsRemaining', () => {
  it('returns the current slot count', () => {
    const registry = makeRegistry({ slots: 3 });
    expect(getActivitySlotsRemaining(registry)).toBe(3);
  });

  it('defaults to DEFAULT_ACTIVITY_SLOTS when not set', () => {
    const registry = new MockRegistry();
    expect(getActivitySlotsRemaining(registry)).toBe(DEFAULT_ACTIVITY_SLOTS);
  });
});

describe('hasActivitySlotsRemaining', () => {
  it('returns true when slots > 0', () => {
    expect(hasActivitySlotsRemaining(makeRegistry({ slots: 1 }))).toBe(true);
  });
  it('returns false when slots = 0', () => {
    expect(hasActivitySlotsRemaining(makeRegistry({ slots: 0 }))).toBe(false);
  });
});

describe('completeActivity', () => {
  it('decrements slot count by 1', () => {
    const registry = makeRegistry({ slots: 3, day: 1, xp: 0, level: 1 });
    completeActivity(registry, 'explore', 'Exploration');
    expect(getActivitySlotsRemaining(registry)).toBe(2);
  });

  it('returns true when slot consumed successfully', () => {
    const registry = makeRegistry({ slots: 2, day: 1, xp: 0, level: 1 });
    expect(completeActivity(registry, 'explore')).toBe(true);
  });

  it('returns false and does nothing when no slots remain', () => {
    const registry = makeRegistry({ slots: 0, day: 1, xp: 0, level: 1 });
    expect(completeActivity(registry, 'explore')).toBe(false);
    expect(getActivitySlotsRemaining(registry)).toBe(0);
  });

  it('emits ACTIVITY_COMPLETED with correct payload', () => {
    const registry = makeRegistry({ slots: 3, day: 1, xp: 0, level: 1 });
    const handler  = vi.fn();
    registry.events.on(ACTIVITY_COMPLETED, handler);

    completeActivity(registry, 'explore', 'Exploration');

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.activityId).toBe('explore');
    expect(payload.label).toBe('Exploration');
    expect(payload.slotsRemaining).toBe(2);
  });

  it('advances time period when activity is completed', () => {
    const registry = makeRegistry({ slots: 3, timePeriod: PERIOD_MORNING, day: 1, xp: 0, level: 1 });
    completeActivity(registry, 'shop');
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_AFTERNOON);
  });

  it('marks mandatory activity as done when completed', () => {
    const registry = makeRegistry({ slots: 3, day: 1, xp: 0, level: 1 });
    addMandatoryActivity(registry, ACTIVITY_WORK, 'Work');
    completeActivity(registry, ACTIVITY_WORK, 'Work');
    const pending = getPendingMandatoryActivities(registry);
    expect(pending).toHaveLength(0);
  });

  it('slot counter decrements to zero and cannot go below', () => {
    const registry = makeRegistry({ slots: 1, day: 1, xp: 0, level: 1 });
    completeActivity(registry, 'a');
    expect(getActivitySlotsRemaining(registry)).toBe(0);
    completeActivity(registry, 'b');
    expect(getActivitySlotsRemaining(registry)).toBe(0);
  });
});

describe('resetActivitySlots', () => {
  it('resets to default slot count', () => {
    const registry = makeRegistry({ slots: 0 });
    resetActivitySlots(registry);
    expect(getActivitySlotsRemaining(registry)).toBe(DEFAULT_ACTIVITY_SLOTS);
  });

  it('accepts custom slot count', () => {
    const registry = makeRegistry({ slots: 0 });
    resetActivitySlots(registry, 5);
    expect(getActivitySlotsRemaining(registry)).toBe(5);
  });

  it('clamps to MIN_ACTIVITY_SLOTS', () => {
    const registry = makeRegistry({ slots: 0 });
    resetActivitySlots(registry, 1);
    expect(getActivitySlotsRemaining(registry)).toBe(MIN_ACTIVITY_SLOTS);
  });

  it('clamps to MAX_ACTIVITY_SLOTS', () => {
    const registry = makeRegistry({ slots: 0 });
    resetActivitySlots(registry, 99);
    expect(getActivitySlotsRemaining(registry)).toBe(MAX_ACTIVITY_SLOTS);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mandatory activity tracking
// ─────────────────────────────────────────────────────────────────────────────

describe('addMandatoryActivity', () => {
  it('adds an activity to the mandatory list', () => {
    const registry = makeRegistry({ mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_WORK, 'Work');
    const list = registry.get(RK.MANDATORY_ACTIVITIES);
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe(ACTIVITY_WORK);
    expect(list[0].completed).toBe(false);
  });

  it('does not add duplicate activities', () => {
    const registry = makeRegistry({ mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_WORK, 'Work');
    addMandatoryActivity(registry, ACTIVITY_WORK, 'Work');
    expect(registry.get(RK.MANDATORY_ACTIVITIES)).toHaveLength(1);
  });

  it('can add multiple different mandatory activities', () => {
    const registry = makeRegistry({ mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_WORK);
    addMandatoryActivity(registry, ACTIVITY_GROCERY);
    addMandatoryActivity(registry, ACTIVITY_VITAMIN_D);
    expect(registry.get(RK.MANDATORY_ACTIVITIES)).toHaveLength(3);
  });
});

describe('getPendingMandatoryActivities', () => {
  it('returns only incomplete activities', () => {
    const activities = [
      { id: ACTIVITY_WORK, label: 'Work', completed: false },
      { id: ACTIVITY_GROCERY, label: 'Grocery', completed: true },
    ];
    const registry = makeRegistry({ mandatoryActivities: activities });
    const pending  = getPendingMandatoryActivities(registry);
    expect(pending).toHaveLength(1);
    expect(pending[0].id).toBe(ACTIVITY_WORK);
  });

  it('returns empty array when all completed', () => {
    const activities = [{ id: ACTIVITY_WORK, label: 'Work', completed: true }];
    const registry   = makeRegistry({ mandatoryActivities: activities });
    expect(getPendingMandatoryActivities(registry)).toHaveLength(0);
  });

  it('returns all activities when none completed', () => {
    const registry = makeRegistry({ mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_WORK);
    addMandatoryActivity(registry, ACTIVITY_VITAMIN_D);
    expect(getPendingMandatoryActivities(registry)).toHaveLength(2);
  });

  it('returns empty array on fresh registry', () => {
    const registry = new MockRegistry();
    expect(getPendingMandatoryActivities(registry)).toHaveLength(0);
  });
});

describe('processMissedMandatoryActivities', () => {
  it('applies XP penalty for each missed activity', () => {
    const registry = makeRegistry({ xp: 200, level: 1, mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_WORK, 'Work');
    addMandatoryActivity(registry, ACTIVITY_VITAMIN_D, 'Vitamin D');

    processMissedMandatoryActivities(registry);

    const expectedPenalty = MANDATORY_SKIP_PENALTIES[ACTIVITY_WORK] + MANDATORY_SKIP_PENALTIES[ACTIVITY_VITAMIN_D];
    expect(registry.get(RK.PLAYER_XP)).toBe(200 - expectedPenalty);
  });

  it('emits MANDATORY_ACTIVITY_MISSED for each missed activity', () => {
    const registry = makeRegistry({ xp: 100, level: 1, mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_GROCERY, 'Grocery');

    const handler = vi.fn();
    registry.events.on(MANDATORY_ACTIVITY_MISSED, handler);

    processMissedMandatoryActivities(registry);

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.activityId).toBe(ACTIVITY_GROCERY);
    expect(payload.penalty).toBe(MANDATORY_SKIP_PENALTIES[ACTIVITY_GROCERY]);
  });

  it('returns an array of missed activities with penalties', () => {
    const registry = makeRegistry({ xp: 100, level: 1, mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_BILL_PAYMENT, 'Bill');
    const result = processMissedMandatoryActivities(registry);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(ACTIVITY_BILL_PAYMENT);
    expect(result[0].penalty).toBe(MANDATORY_SKIP_PENALTIES[ACTIVITY_BILL_PAYMENT]);
  });

  it('returns empty array when no mandatory activities pending', () => {
    const registry = makeRegistry({ xp: 100, level: 1, mandatoryActivities: [] });
    expect(processMissedMandatoryActivities(registry)).toHaveLength(0);
  });
});

describe('clearMandatoryActivities', () => {
  it('removes all mandatory activities', () => {
    const registry = makeRegistry({ mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_WORK);
    clearMandatoryActivities(registry);
    expect(registry.get(RK.MANDATORY_ACTIVITIES)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// End-of-day logic
// ─────────────────────────────────────────────────────────────────────────────

describe('endDay', () => {
  it('processes missed mandatory activities', () => {
    const registry = makeRegistry({ xp: 100, level: 1, day: 5, mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_VITAMIN_D, 'Vitamin D');
    const result = endDay(registry);
    expect(result.missedActivities).toHaveLength(1);
    expect(result.missedActivities[0].id).toBe(ACTIVITY_VITAMIN_D);
  });

  it('returns empty spoiledItems when inventory has no perishables', () => {
    const inventory = [{ id: 'hammer', name: 'Hammer' }];
    const registry  = makeRegistry({ xp: 100, level: 1, day: 5, inventory, mandatoryActivities: [] });
    const result    = endDay(registry);
    expect(result.spoiledItems).toHaveLength(0);
  });

  it('removes spoiled food from inventory', () => {
    const day = 5;
    const inventory = [
      { id: 'milk',  name: 'Milk',  spoilsOnDay: 4 }, // already spoiled
      { id: 'bread', name: 'Bread', spoilsOnDay: 6 }, // still fresh
      { id: 'eggs',  name: 'Eggs',  spoilsOnDay: 5 }, // spoils today
    ];
    const registry = makeRegistry({ xp: 100, level: 1, day, inventory, mandatoryActivities: [] });
    const result   = endDay(registry);

    expect(result.spoiledItems).toHaveLength(2); // milk + eggs
    const remaining = registry.get(RK.INVENTORY);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe('bread');
  });

  it('emits DAY_ENDED event', () => {
    const registry = makeRegistry({ xp: 100, level: 1, day: 3, mandatoryActivities: [] });
    const handler  = vi.fn();
    registry.events.on(DAY_ENDED, handler);

    endDay(registry);

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.day).toBe(3);
  });

  it('handles empty inventory gracefully', () => {
    const registry = makeRegistry({ xp: 100, level: 1, day: 1, mandatoryActivities: [] });
    const result   = endDay(registry);
    expect(result.spoiledItems).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// advanceDay
// ─────────────────────────────────────────────────────────────────────────────

describe('advanceDay', () => {
  it('increments CURRENT_DAY by 1', () => {
    const registry = makeRegistry({ day: 5 });
    advanceDay(registry);
    expect(registry.get(RK.CURRENT_DAY)).toBe(6);
  });

  it('resets TIME_OF_DAY to Morning', () => {
    const registry = makeRegistry({ day: 1, timePeriod: PERIOD_NIGHT });
    advanceDay(registry);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_MORNING);
  });

  it('resets activity slots to default', () => {
    const registry = makeRegistry({ day: 1, slots: 0 });
    advanceDay(registry);
    expect(getActivitySlotsRemaining(registry)).toBe(DEFAULT_ACTIVITY_SLOTS);
  });

  it('clears mandatory activities', () => {
    const registry = makeRegistry({ day: 1, mandatoryActivities: [] });
    addMandatoryActivity(registry, ACTIVITY_WORK);
    advanceDay(registry);
    expect(getPendingMandatoryActivities(registry)).toHaveLength(0);
  });

  it('emits DAY_ADVANCED with previousDay and newDay', () => {
    const registry = makeRegistry({ day: 7 });
    const handler  = vi.fn();
    registry.events.on(DAY_ADVANCED, handler);

    advanceDay(registry);

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.previousDay).toBe(7);
    expect(payload.newDay).toBe(8);
  });

  it('returns new day value', () => {
    const registry = makeRegistry({ day: 10 });
    expect(advanceDay(registry)).toBe(11);
  });

  it('accepts custom slot count for the new day', () => {
    const registry = makeRegistry({ day: 1 });
    advanceDay(registry, { slots: 5 });
    expect(getActivitySlotsRemaining(registry)).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: full day cycle
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — full day cycle', () => {
  it('full day: morning overview → activities → end day → next day', () => {
    const registry = new MockRegistry();
    initDayCycle(registry);
    registry.set(RK.PLAYER_XP, 100);
    registry.set(RK.PLAYER_LEVEL, 1);

    // Morning: register mandatory vitamin D
    addMandatoryActivity(registry, ACTIVITY_VITAMIN_D, 'Vitamin D');
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_MORNING);

    // Complete 3 activities (slots 4→3→2→1)
    completeActivity(registry, ACTIVITY_VITAMIN_D, 'Vitamin D');
    expect(getActivitySlotsRemaining(registry)).toBe(3);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_AFTERNOON);

    completeActivity(registry, 'explore', 'Exploration');
    expect(getActivitySlotsRemaining(registry)).toBe(2);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_EVENING);

    completeActivity(registry, 'cook', 'Cooking');
    expect(getActivitySlotsRemaining(registry)).toBe(1);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_NIGHT);

    // End the day — no missed mandatory activities
    const summary = endDay(registry);
    expect(summary.missedActivities).toHaveLength(0);

    // Advance to next day
    const newDay = advanceDay(registry);
    expect(newDay).toBe(2);
    expect(registry.get(RK.TIME_OF_DAY)).toBe(PERIOD_MORNING);
    expect(getActivitySlotsRemaining(registry)).toBe(DEFAULT_ACTIVITY_SLOTS);
    expect(getPendingMandatoryActivities(registry)).toHaveLength(0);
  });

  it('missed mandatory work triggers penalty on day end', () => {
    const registry = new MockRegistry();
    initDayCycle(registry);
    registry.set(RK.PLAYER_XP, 200);
    registry.set(RK.PLAYER_LEVEL, 1);

    addMandatoryActivity(registry, ACTIVITY_WORK, 'Work');
    // Player did NOT complete work

    const summary = endDay(registry);
    expect(summary.missedActivities).toHaveLength(1);
    expect(registry.get(RK.PLAYER_XP)).toBe(200 - MANDATORY_SKIP_PENALTIES[ACTIVITY_WORK]);
  });

  it('cannot start more activities when slots exhausted', () => {
    const registry = makeRegistry({ day: 1, slots: 1, xp: 0, level: 1 });
    completeActivity(registry, 'a');                        // uses last slot
    const result = completeActivity(registry, 'b');         // no slots
    expect(result).toBe(false);
    expect(getActivitySlotsRemaining(registry)).toBe(0);
  });
});
