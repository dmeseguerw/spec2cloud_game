/**
 * tests/systems/DoorSystem.test.js
 * Unit tests for DoorSystem.
 * Coverage target: ≥85% of src/systems/DoorSystem.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  TIME_PERIOD_HOURS,
  timeOfDayToHour,
  evaluateDoorCondition,
  isDoorOpen,
  getDoorContextHint,
} from '../../src/systems/DoorSystem.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(options = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,  options.day        ?? 1);
  r.set(RK.TIME_OF_DAY,  options.timeOfDay  ?? 'morning');
  return r;
}

/** Netto shop door — opens weekday 7–22, weekend 8–20. */
function makeNettoDoor(overrides = {}) {
  return {
    id: 'netto_door',
    x: 540,
    y: 310,
    label: 'Netto',
    targetScene: 'ShopScene',
    targetData: { shopId: 'netto' },
    openCondition: { type: 'shopHours', shopId: 'netto' },
    closedMessage: 'Netto is closed — opens at 7:00',
    ...overrides,
  };
}

/** Always-open door (no condition). */
function makeAlwaysOpenDoor(overrides = {}) {
  return {
    id: 'always_open',
    x: 100,
    y: 100,
    label: 'Community Centre',
    targetScene: 'CommunityScene',
    targetData: {},
    openCondition: null,
    closedMessage: 'Closed',
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME_PERIOD_HOURS
// ─────────────────────────────────────────────────────────────────────────────

describe('TIME_PERIOD_HOURS', () => {
  it('contains entries for all four time periods', () => {
    expect(TIME_PERIOD_HOURS).toHaveProperty('morning');
    expect(TIME_PERIOD_HOURS).toHaveProperty('afternoon');
    expect(TIME_PERIOD_HOURS).toHaveProperty('evening');
    expect(TIME_PERIOD_HOURS).toHaveProperty('night');
  });

  it('morning maps to hour < 12', () => {
    expect(TIME_PERIOD_HOURS.morning).toBeGreaterThanOrEqual(7);
    expect(TIME_PERIOD_HOURS.morning).toBeLessThan(12);
  });

  it('night maps to hour >= 22 or hour < 7', () => {
    const h = TIME_PERIOD_HOURS.night;
    expect(h >= 22 || h < 7).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// timeOfDayToHour
// ─────────────────────────────────────────────────────────────────────────────

describe('timeOfDayToHour', () => {
  it('handles lowercase period names', () => {
    expect(timeOfDayToHour('morning')).toBe(TIME_PERIOD_HOURS.morning);
    expect(timeOfDayToHour('afternoon')).toBe(TIME_PERIOD_HOURS.afternoon);
    expect(timeOfDayToHour('evening')).toBe(TIME_PERIOD_HOURS.evening);
    expect(timeOfDayToHour('night')).toBe(TIME_PERIOD_HOURS.night);
  });

  it('handles capitalised period names (DayCycleEngine style)', () => {
    expect(timeOfDayToHour('Morning')).toBe(TIME_PERIOD_HOURS.morning);
    expect(timeOfDayToHour('Afternoon')).toBe(TIME_PERIOD_HOURS.afternoon);
    expect(timeOfDayToHour('Evening')).toBe(TIME_PERIOD_HOURS.evening);
    expect(timeOfDayToHour('Night')).toBe(TIME_PERIOD_HOURS.night);
  });

  it('falls back to 9 for unknown strings', () => {
    expect(timeOfDayToHour('noon')).toBe(9);
    expect(timeOfDayToHour('')).toBe(9);
    expect(timeOfDayToHour('MORNING')).toBe(9); // all-caps not handled
  });

  it('falls back to 9 for null/undefined', () => {
    expect(timeOfDayToHour(null)).toBe(9);
    expect(timeOfDayToHour(undefined)).toBe(9);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// evaluateDoorCondition
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateDoorCondition', () => {
  it('returns true when condition is null (always open)', () => {
    const r = makeRegistry();
    expect(evaluateDoorCondition(null, r)).toBe(true);
  });

  it('returns true when condition is undefined (always open)', () => {
    const r = makeRegistry();
    expect(evaluateDoorCondition(undefined, r)).toBe(true);
  });

  it('returns true when condition type is unknown', () => {
    const r = makeRegistry();
    expect(evaluateDoorCondition({ type: 'unknown_condition' }, r)).toBe(true);
  });

  describe('shopHours condition', () => {
    it('returns true when shop is open (morning, weekday)', () => {
      // Netto opens at 7 on weekdays; morning ~ hour 9
      const r = makeRegistry({ timeOfDay: 'morning', day: 1 });
      const cond = { type: 'shopHours', shopId: 'netto' };
      expect(evaluateDoorCondition(cond, r)).toBe(true);
    });

    it('returns false when shop is closed (night, weekday)', () => {
      // Netto closes at 22; night ~ hour 23
      const r = makeRegistry({ timeOfDay: 'night', day: 1 });
      const cond = { type: 'shopHours', shopId: 'netto' };
      expect(evaluateDoorCondition(cond, r)).toBe(false);
    });

    it('returns false for unknown shopId', () => {
      const r = makeRegistry({ timeOfDay: 'morning', day: 1 });
      const cond = { type: 'shopHours', shopId: 'no_such_shop' };
      expect(evaluateDoorCondition(cond, r)).toBe(false);
    });

    it('returns true when shop is open (morning, weekend)', () => {
      // Day 6 is Saturday; Netto opens at 8 on weekend; morning ~ 9
      const r = makeRegistry({ timeOfDay: 'morning', day: 6 });
      const cond = { type: 'shopHours', shopId: 'netto' };
      expect(evaluateDoorCondition(cond, r)).toBe(true);
    });

    it('checks Matas which opens at 9 (afternoon open, morning open)', () => {
      const r = makeRegistry({ timeOfDay: 'morning', day: 1 });
      const cond = { type: 'shopHours', shopId: 'matas' };
      // Matas opens at 9 on weekday; morning representative hour is 9 → open (9 >= 9)
      expect(evaluateDoorCondition(cond, r)).toBe(true);
    });

    it('checks evening (matas closes at 18, evening ~ 19 → closed)', () => {
      const r = makeRegistry({ timeOfDay: 'evening', day: 1 });
      const cond = { type: 'shopHours', shopId: 'matas' };
      // Matas weekday close = 18; evening representative = 19 → closed
      expect(evaluateDoorCondition(cond, r)).toBe(false);
    });

    it('defaults to day 1 / morning when registry keys are unset', () => {
      const r = new MockRegistry(); // no keys set
      const cond = { type: 'shopHours', shopId: 'netto' };
      // morning default → open at netto
      expect(evaluateDoorCondition(cond, r)).toBe(true);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isDoorOpen
// ─────────────────────────────────────────────────────────────────────────────

describe('isDoorOpen', () => {
  it('returns true for always-open door', () => {
    const r = makeRegistry();
    expect(isDoorOpen(makeAlwaysOpenDoor(), r)).toBe(true);
  });

  it('returns true when Netto is open (morning, weekday)', () => {
    const r = makeRegistry({ timeOfDay: 'morning', day: 1 });
    expect(isDoorOpen(makeNettoDoor(), r)).toBe(true);
  });

  it('returns false when Netto is closed (night)', () => {
    const r = makeRegistry({ timeOfDay: 'night', day: 1 });
    expect(isDoorOpen(makeNettoDoor(), r)).toBe(false);
  });

  it('handles door with missing openCondition property (treated as null → open)', () => {
    const r = makeRegistry();
    const door = { id: 'test', label: 'Test', closedMessage: 'Closed' };
    // openCondition is undefined → treated as null → always open
    expect(isDoorOpen(door, r)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDoorContextHint
// ─────────────────────────────────────────────────────────────────────────────

describe('getDoorContextHint', () => {
  it('returns "Press E — Enter {label}" when door is open', () => {
    const r = makeRegistry({ timeOfDay: 'morning', day: 1 });
    const hint = getDoorContextHint(makeNettoDoor(), r);
    expect(hint).toBe('Press E — Enter Netto');
  });

  it('returns closedMessage when door is closed', () => {
    const r = makeRegistry({ timeOfDay: 'night', day: 1 });
    const hint = getDoorContextHint(makeNettoDoor(), r);
    expect(hint).toBe('Netto is closed — opens at 7:00');
  });

  it('uses default fallback message when closedMessage is absent', () => {
    const r = makeRegistry({ timeOfDay: 'night', day: 1 });
    const door = {
      ...makeNettoDoor(),
      closedMessage: undefined,
    };
    const hint = getDoorContextHint(door, r);
    expect(hint).toBe('Netto is closed');
  });

  it('returns "Press E — Enter {label}" for always-open door', () => {
    const r = makeRegistry();
    const door = makeAlwaysOpenDoor();
    const hint = getDoorContextHint(door, r);
    expect(hint).toBe('Press E — Enter Community Centre');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: full door flow
// ─────────────────────────────────────────────────────────────────────────────

describe('Door condition integration', () => {
  it('open at morning → hint contains "Press E — Enter"', () => {
    const r = makeRegistry({ timeOfDay: 'morning', day: 1 });
    const door = makeNettoDoor();
    const open = isDoorOpen(door, r);
    const hint = getDoorContextHint(door, r);
    expect(open).toBe(true);
    expect(hint).toMatch(/Press E — Enter/);
  });

  it('closed at night → hint does not contain "Press E"', () => {
    const r = makeRegistry({ timeOfDay: 'night', day: 1 });
    const door = makeNettoDoor();
    const open = isDoorOpen(door, r);
    const hint = getDoorContextHint(door, r);
    expect(open).toBe(false);
    expect(hint).not.toMatch(/Press E/);
  });

  it('pressing E on closed door should not be allowed (condition gate)', () => {
    const r = makeRegistry({ timeOfDay: 'night', day: 1 });
    const door = makeNettoDoor();
    // Simulate the scene logic: check isDoorOpen before executing callback
    let sceneEntered = false;
    const executeDoorEntry = () => {
      if (!isDoorOpen(door, r)) return;
      sceneEntered = true;
    };
    executeDoorEntry();
    expect(sceneEntered).toBe(false);
  });

  it('pressing E on open door executes callback', () => {
    const r = makeRegistry({ timeOfDay: 'morning', day: 1 });
    const door = makeNettoDoor();
    let sceneEntered = false;
    const executeDoorEntry = () => {
      if (!isDoorOpen(door, r)) return;
      sceneEntered = true;
    };
    executeDoorEntry();
    expect(sceneEntered).toBe(true);
  });
});
