/**
 * tests/systems/SeasonEngine.test.js
 * Unit tests for SeasonEngine.
 * Coverage target: ≥85% of src/systems/SeasonEngine.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  initSeason,
  advanceSeason,
  getCurrentSeasonProperties,
  getSunsetTime,
  getSeasonDifficulty,
  getSeasonForDay,
  SEASON_SPRING,
  SEASON_SUMMER,
  SEASON_FALL,
  SEASON_WINTER,
  SEASON_ORDER,
  SEASON_DURATION,
  SEASON_PROPERTIES,
} from '../../src/systems/SeasonEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { SEASON_CHANGED } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(season, dayInSeason) {
  const r = new MockRegistry();
  if (season !== undefined)      r.set(RK.SEASON, season);
  if (dayInSeason !== undefined) r.set(RK.DAY_IN_SEASON, dayInSeason);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('Season constants', () => {
  it('SEASON_DURATION is 22', () => {
    expect(SEASON_DURATION).toBe(22);
  });

  it('SEASON_ORDER has 4 seasons in correct order', () => {
    expect(SEASON_ORDER).toEqual([SEASON_SPRING, SEASON_SUMMER, SEASON_FALL, SEASON_WINTER]);
  });

  it('SEASON_PROPERTIES has entries for all 4 seasons', () => {
    for (const s of SEASON_ORDER) {
      expect(SEASON_PROPERTIES[s]).toBeDefined();
      expect(typeof SEASON_PROPERTIES[s].sunsetTime).toBe('string');
      expect(typeof SEASON_PROPERTIES[s].sunsetHour).toBe('number');
      expect(typeof SEASON_PROPERTIES[s].difficulty).toBe('string');
      expect(typeof SEASON_PROPERTIES[s].mood).toBe('string');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// initSeason
// ─────────────────────────────────────────────────────────────────────────────

describe('initSeason', () => {
  it('sets SEASON to Spring and DAY_IN_SEASON to 1 on fresh registry', () => {
    const registry = new MockRegistry();
    initSeason(registry);
    expect(registry.get(RK.SEASON)).toBe(SEASON_SPRING);
    expect(registry.get(RK.DAY_IN_SEASON)).toBe(1);
  });

  it('does not overwrite existing SEASON value', () => {
    const registry = makeRegistry(SEASON_FALL, 10);
    initSeason(registry);
    expect(registry.get(RK.SEASON)).toBe(SEASON_FALL);
    expect(registry.get(RK.DAY_IN_SEASON)).toBe(10);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentSeasonProperties
// ─────────────────────────────────────────────────────────────────────────────

describe('getCurrentSeasonProperties', () => {
  it('returns Spring properties when season is Spring', () => {
    const registry = makeRegistry(SEASON_SPRING);
    const props = getCurrentSeasonProperties(registry);
    expect(props.sunsetTime).toBe('20:00');
    expect(props.difficulty).toBe('Medium');
    expect(props.mood).toBe('Hopeful');
  });

  it('returns Winter properties when season is Winter', () => {
    const registry = makeRegistry(SEASON_WINTER);
    const props = getCurrentSeasonProperties(registry);
    expect(props.sunsetTime).toBe('15:30');
    expect(props.sunsetHour).toBe(15.5);
    expect(props.difficulty).toBe('Hard');
    expect(props.mood).toBe('Dark');
  });

  it('defaults to Spring when no season set', () => {
    const registry = new MockRegistry();
    const props = getCurrentSeasonProperties(registry);
    expect(props.sunsetTime).toBe('20:00');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSunsetTime
// ─────────────────────────────────────────────────────────────────────────────

describe('getSunsetTime — per season', () => {
  const cases = [
    [SEASON_SPRING, '20:00'],
    [SEASON_SUMMER, '22:00'],
    [SEASON_FALL,   '17:00'],
    [SEASON_WINTER, '15:30'],
  ];

  for (const [season, expected] of cases) {
    it(`${season} sunset is ${expected}`, () => {
      const registry = makeRegistry(season);
      expect(getSunsetTime(registry)).toBe(expected);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// getSeasonDifficulty
// ─────────────────────────────────────────────────────────────────────────────

describe('getSeasonDifficulty', () => {
  it('Spring is Medium', () => {
    expect(getSeasonDifficulty(makeRegistry(SEASON_SPRING))).toBe('Medium');
  });
  it('Summer is Easy', () => {
    expect(getSeasonDifficulty(makeRegistry(SEASON_SUMMER))).toBe('Easy');
  });
  it('Fall is Medium', () => {
    expect(getSeasonDifficulty(makeRegistry(SEASON_FALL))).toBe('Medium');
  });
  it('Winter is Hard', () => {
    expect(getSeasonDifficulty(makeRegistry(SEASON_WINTER))).toBe('Hard');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// advanceSeason — within season
// ─────────────────────────────────────────────────────────────────────────────

describe('advanceSeason — within season', () => {
  it('increments DAY_IN_SEASON without changing season', () => {
    const registry = makeRegistry(SEASON_SPRING, 1);
    const result   = advanceSeason(registry);
    expect(result.dayInSeason).toBe(2);
    expect(result.season).toBe(SEASON_SPRING);
    expect(result.seasonChanged).toBe(false);
    expect(registry.get(RK.DAY_IN_SEASON)).toBe(2);
  });

  it('advances to day 22 without season change', () => {
    const registry = makeRegistry(SEASON_SPRING, 21);
    const result   = advanceSeason(registry);
    expect(result.dayInSeason).toBe(22);
    expect(result.seasonChanged).toBe(false);
  });

  it('does not emit SEASON_CHANGED during mid-season advance', () => {
    const registry = makeRegistry(SEASON_SPRING, 10);
    const handler  = vi.fn();
    registry.events.on(SEASON_CHANGED, handler);
    advanceSeason(registry);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// advanceSeason — season transition
// ─────────────────────────────────────────────────────────────────────────────

describe('advanceSeason — season transitions', () => {
  it('Spring → Summer transition at day 22', () => {
    const registry = makeRegistry(SEASON_SPRING, 22);
    const result   = advanceSeason(registry);
    expect(result.season).toBe(SEASON_SUMMER);
    expect(result.dayInSeason).toBe(1);
    expect(result.seasonChanged).toBe(true);
    expect(registry.get(RK.SEASON)).toBe(SEASON_SUMMER);
    expect(registry.get(RK.DAY_IN_SEASON)).toBe(1);
  });

  it('Summer → Fall transition', () => {
    const registry = makeRegistry(SEASON_SUMMER, 22);
    const result   = advanceSeason(registry);
    expect(result.season).toBe(SEASON_FALL);
    expect(result.seasonChanged).toBe(true);
  });

  it('Fall → Winter transition', () => {
    const registry = makeRegistry(SEASON_FALL, 22);
    const result   = advanceSeason(registry);
    expect(result.season).toBe(SEASON_WINTER);
    expect(result.seasonChanged).toBe(true);
  });

  it('Winter → Spring transition (wraps around)', () => {
    const registry = makeRegistry(SEASON_WINTER, 22);
    const result   = advanceSeason(registry);
    expect(result.season).toBe(SEASON_SPRING);
    expect(result.dayInSeason).toBe(1);
    expect(result.seasonChanged).toBe(true);
  });

  it('emits SEASON_CHANGED with correct payload on transition', () => {
    const registry = makeRegistry(SEASON_SPRING, 22);
    const handler  = vi.fn();
    registry.events.on(SEASON_CHANGED, handler);

    advanceSeason(registry);

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.previousSeason).toBe(SEASON_SPRING);
    expect(payload.newSeason).toBe(SEASON_SUMMER);
    expect(payload.properties).toEqual(SEASON_PROPERTIES[SEASON_SUMMER]);
  });

  it('does NOT emit SEASON_CHANGED in the middle of a season', () => {
    const registry = makeRegistry(SEASON_FALL, 15);
    const handler  = vi.fn();
    registry.events.on(SEASON_CHANGED, handler);
    advanceSeason(registry);
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// advanceSeason — default state
// ─────────────────────────────────────────────────────────────────────────────

describe('advanceSeason — default registry values', () => {
  it('works on empty registry (defaults to Spring day 1)', () => {
    const registry = new MockRegistry();
    const result   = advanceSeason(registry);
    expect(result.season).toBe(SEASON_SPRING);
    expect(result.dayInSeason).toBe(2);
    expect(result.seasonChanged).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSeasonForDay
// ─────────────────────────────────────────────────────────────────────────────

describe('getSeasonForDay', () => {
  it('day 1 is Spring', () => {
    expect(getSeasonForDay(1)).toBe(SEASON_SPRING);
  });

  it('day 22 is Spring (last day)', () => {
    expect(getSeasonForDay(22)).toBe(SEASON_SPRING);
  });

  it('day 23 is Summer (first day)', () => {
    expect(getSeasonForDay(23)).toBe(SEASON_SUMMER);
  });

  it('day 44 is Summer (last day)', () => {
    expect(getSeasonForDay(44)).toBe(SEASON_SUMMER);
  });

  it('day 45 is Fall', () => {
    expect(getSeasonForDay(45)).toBe(SEASON_FALL);
  });

  it('day 67 is Winter', () => {
    expect(getSeasonForDay(67)).toBe(SEASON_WINTER);
  });

  it('day 89 is Winter (last day)', () => {
    expect(getSeasonForDay(88)).toBe(SEASON_WINTER);
  });

  it('day 89 wraps back to Spring', () => {
    expect(getSeasonForDay(89)).toBe(SEASON_SPRING);
  });

  it('correctly maps across full year cycle (88 days)', () => {
    const expectedCycle = [
      ...Array(22).fill(SEASON_SPRING),
      ...Array(22).fill(SEASON_SUMMER),
      ...Array(22).fill(SEASON_FALL),
      ...Array(22).fill(SEASON_WINTER),
    ];
    for (let day = 1; day <= 88; day++) {
      expect(getSeasonForDay(day)).toBe(expectedCycle[day - 1]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: full 22-day season cycle
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — full 22-day season cycle', () => {
  it('advances through Spring without SEASON_CHANGED for days 1–21', () => {
    const registry = new MockRegistry();
    initSeason(registry);
    const handler = vi.fn();
    registry.events.on(SEASON_CHANGED, handler);

    for (let i = 0; i < 21; i++) advanceSeason(registry);

    expect(registry.get(RK.SEASON)).toBe(SEASON_SPRING);
    expect(registry.get(RK.DAY_IN_SEASON)).toBe(22);
    expect(handler).not.toHaveBeenCalled();
  });

  it('triggers SEASON_CHANGED exactly once on day 22 advance', () => {
    const registry = makeRegistry(SEASON_SPRING, 22);
    const handler  = vi.fn();
    registry.events.on(SEASON_CHANGED, handler);

    advanceSeason(registry);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(registry.get(RK.SEASON)).toBe(SEASON_SUMMER);
  });

  it('cycles through all 4 seasons correctly over 88 days', () => {
    const registry = new MockRegistry();
    initSeason(registry);
    const seasonLog = [];
    registry.events.on(SEASON_CHANGED, ({ newSeason }) => seasonLog.push(newSeason));

    // advance 87 more days (start at day 1, end at day 88)
    for (let i = 0; i < 87; i++) advanceSeason(registry);

    expect(seasonLog).toEqual([SEASON_SUMMER, SEASON_FALL, SEASON_WINTER]);
    expect(registry.get(RK.SEASON)).toBe(SEASON_WINTER);
  });
});
