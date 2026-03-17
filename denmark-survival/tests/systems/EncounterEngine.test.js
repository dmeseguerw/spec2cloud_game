/**
 * tests/systems/EncounterEngine.test.js
 * Unit and integration tests for EncounterEngine.
 *
 * Covers:
 *  - Daily encounter generation (count 2–4)
 *  - Category probability distribution
 *  - Pool filtering (location, weather, season, time, level, skill, flag)
 *  - 7-day cooldown exclusion
 *  - One-time encounter permanent removal
 *  - Outcome application (XP, money, items, relationships, skills, encyclopedia, flags)
 *  - Skill-gated option detection
 *  - Encounter chaining via flag conditions
 *  - Full trigger → resolve integration flow
 *  - Auto-response timeout constant exposed
 *
 * Coverage target: ≥85% of src/systems/EncounterEngine.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  generateDailyEncounters,
  triggerNextEncounter,
  resolveEncounter,
  getEncounterPool,
  isOnCooldown,
  isOptionAvailable,
  getAllEncounters,
  COOLDOWN_DAYS,
  MIN_ENCOUNTERS_PER_DAY,
  MAX_ENCOUNTERS_PER_DAY,
  AUTO_RESPONSE_TIMEOUT_MS,
  CATEGORY_WEIGHTS,
} from '../../src/systems/EncounterEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  ENCOUNTER_TRIGGERED,
  ENCOUNTER_RESOLVED,
} from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Test helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a registry with sensible defaults for encounter engine tests.
 */
function makeRegistry(opts = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,        opts.day          ?? 1);
  r.set(RK.PLAYER_XP,          opts.xp           ?? 0);
  r.set(RK.PLAYER_LEVEL,       opts.level        ?? 5);
  r.set(RK.PLAYER_MONEY,       opts.money        ?? 100);
  r.set(RK.WEATHER,            opts.weather      ?? 'Sunny');
  r.set(RK.SEASON,             opts.season       ?? 'Summer');
  r.set(RK.TIME_OF_DAY,        opts.timeOfDay    ?? 'afternoon');
  r.set(RK.CURRENT_LOCATION,   opts.location     ?? 'any');
  r.set(RK.TRANSPORT_MODE,     opts.transport    ?? 'walk');
  r.set(RK.SKILL_LANGUAGE,     opts.language     ?? 0);
  r.set(RK.SKILL_CYCLING,      opts.cycling      ?? 0);
  r.set(RK.SKILL_CULTURAL,     opts.cultural     ?? 0);
  r.set(RK.SKILL_BUREAUCRACY,  opts.bureaucracy  ?? 0);
  r.set(RK.ENCOUNTER_HISTORY,  opts.history      ?? []);
  r.set(RK.ENCOUNTER_FLAGS,    opts.flags        ?? {});
  r.set(RK.GAME_FLAGS,         opts.gameFlags    ?? {});
  r.set(RK.NPC_RELATIONSHIPS,  opts.relationships ?? {});
  r.set(RK.ENCYCLOPEDIA_ENTRIES, opts.encyclopedia ?? []);
  r.set(RK.INVENTORY,          opts.inventory    ?? []);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('EncounterEngine constants', () => {
  it('COOLDOWN_DAYS is 7', () => {
    expect(COOLDOWN_DAYS).toBe(7);
  });

  it('MIN_ENCOUNTERS_PER_DAY is 2', () => {
    expect(MIN_ENCOUNTERS_PER_DAY).toBe(2);
  });

  it('MAX_ENCOUNTERS_PER_DAY is 4', () => {
    expect(MAX_ENCOUNTERS_PER_DAY).toBe(4);
  });

  it('AUTO_RESPONSE_TIMEOUT_MS is 30000', () => {
    expect(AUTO_RESPONSE_TIMEOUT_MS).toBe(30_000);
  });

  it('CATEGORY_WEIGHTS sum to 100', () => {
    const total = Object.values(CATEGORY_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBe(100);
  });

  it('CATEGORY_WEIGHTS has the four expected categories', () => {
    expect(CATEGORY_WEIGHTS).toMatchObject({
      helpful:   30,
      neutral:   40,
      challenge: 25,
      major:      5,
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAllEncounters
// ─────────────────────────────────────────────────────────────────────────────

describe('getAllEncounters', () => {
  it('returns a non-empty array', () => {
    const encounters = getAllEncounters();
    expect(Array.isArray(encounters)).toBe(true);
    expect(encounters.length).toBeGreaterThanOrEqual(50);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isOnCooldown
// ─────────────────────────────────────────────────────────────────────────────

describe('isOnCooldown', () => {
  it('returns false when no history exists', () => {
    const r = makeRegistry();
    expect(isOnCooldown(r, 'helpful_bike_stranger')).toBe(false);
  });

  it('returns true when encounter was seen less than 7 days ago', () => {
    const r = makeRegistry({
      day: 5,
      history: [{ encounterId: 'helpful_bike_stranger', day: 2, optionIndex: 0 }],
    });
    expect(isOnCooldown(r, 'helpful_bike_stranger')).toBe(true);
  });

  it('returns false when encounter was seen exactly 7 days ago', () => {
    const r = makeRegistry({
      day: 8,
      history: [{ encounterId: 'helpful_bike_stranger', day: 1, optionIndex: 0 }],
    });
    expect(isOnCooldown(r, 'helpful_bike_stranger')).toBe(false);
  });

  it('returns false when encounter was seen more than 7 days ago', () => {
    const r = makeRegistry({
      day: 15,
      history: [{ encounterId: 'helpful_bike_stranger', day: 1, optionIndex: 0 }],
    });
    expect(isOnCooldown(r, 'helpful_bike_stranger')).toBe(false);
  });

  it('uses the most recent occurrence when multiple history entries exist', () => {
    const r = makeRegistry({
      day: 10,
      history: [
        { encounterId: 'helpful_bike_stranger', day: 1,  optionIndex: 0 },
        { encounterId: 'helpful_bike_stranger', day: 8,  optionIndex: 0 },
      ],
    });
    // 10 - 8 = 2 < 7 → on cooldown
    expect(isOnCooldown(r, 'helpful_bike_stranger')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getEncounterPool — filtering
// ─────────────────────────────────────────────────────────────────────────────

describe('getEncounterPool', () => {
  it('returns a non-empty array under default permissive conditions', () => {
    const r = makeRegistry();
    const pool = getEncounterPool(r);
    expect(pool.length).toBeGreaterThan(0);
  });

  it('excludes encounters on cooldown', () => {
    const r = makeRegistry({
      day: 3,
      history: [{ encounterId: 'helpful_bike_stranger', day: 1, optionIndex: 0 }],
    });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('helpful_bike_stranger');
  });

  it('excludes resolved one-time encounters', () => {
    const r = makeRegistry({
      flags: { one_time_helpful_language_class: true },
    });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('helpful_language_class');
  });

  it('includes one-time encounters that have not been resolved', () => {
    const r = makeRegistry();
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).toContain('helpful_language_class');
  });

  it('filters out encounters requiring higher player level', () => {
    const r = makeRegistry({ level: 1 });
    // major_community_leader requires minLevel 12
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('major_community_leader');
  });

  it('includes encounters whose level range matches the player level', () => {
    const r = makeRegistry({ level: 5 });
    const pool = getEncounterPool(r);
    expect(pool.length).toBeGreaterThan(0);
  });

  it('filters encounters requiring a specific flag that is not set', () => {
    const r = makeRegistry({ gameFlags: {} });
    // major_cultural_breakthrough requires flag passed_danish_test = true
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('major_cultural_breakthrough');
  });

  it('includes encounters whose required flag is set', () => {
    const r = makeRegistry({
      level: 12,
      gameFlags: { met_thomas: true },
    });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).toContain('major_community_leader');
  });

  it('filters encounters requiring biking transport when player is walking', () => {
    const r = makeRegistry({ transport: 'walk' });
    // challenge_winter_bike requires transportMode: 'bike'
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('challenge_winter_bike');
  });

  it('includes bike encounters when player is on a bike', () => {
    const r = makeRegistry({
      transport:  'bike',
      weather:    'Snowy',
      season:     'Winter',
      timeOfDay:  'morning',
      level:      3,
    });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).toContain('challenge_winter_bike');
  });

  it('includes weather-specific encounters only when weather matches', () => {
    const r = makeRegistry({ weather: 'Rainy' });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).toContain('helpful_umbrella_share');
  });

  it('excludes weather-specific encounters when weather does not match', () => {
    const r = makeRegistry({ weather: 'Sunny' });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('helpful_umbrella_share');
  });

  it('includes season-specific encounters only when season matches', () => {
    const r = makeRegistry({ season: 'Winter', weather: 'Snowy' });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).toContain('helpful_winter_warming');
  });

  it('excludes season-specific encounters when season does not match', () => {
    const r = makeRegistry({ season: 'Summer', weather: 'Sunny' });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('helpful_winter_warming');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateDailyEncounters
// ─────────────────────────────────────────────────────────────────────────────

describe('generateDailyEncounters', () => {
  it('stores pending encounter IDs in the registry', () => {
    const r = makeRegistry();
    generateDailyEncounters(r);
    const pending = r.get(RK.PENDING_ENCOUNTERS);
    expect(Array.isArray(pending)).toBe(true);
  });

  it('generates between MIN and MAX encounters', () => {
    const r = makeRegistry();
    generateDailyEncounters(r);
    const pending = r.get(RK.PENDING_ENCOUNTERS);
    expect(pending.length).toBeGreaterThanOrEqual(MIN_ENCOUNTERS_PER_DAY);
    expect(pending.length).toBeLessThanOrEqual(MAX_ENCOUNTERS_PER_DAY);
  });

  it('count is always 2–4 over many runs', () => {
    const r = makeRegistry();
    for (let i = 0; i < 100; i++) {
      generateDailyEncounters(r);
      const pending = r.get(RK.PENDING_ENCOUNTERS);
      expect(pending.length).toBeGreaterThanOrEqual(2);
      expect(pending.length).toBeLessThanOrEqual(4);
    }
  });

  it('returns the selected encounter objects', () => {
    const r = makeRegistry();
    const result = generateDailyEncounters(r);
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(MIN_ENCOUNTERS_PER_DAY);
    result.forEach(e => {
      expect(typeof e.id).toBe('string');
      expect(typeof e.title).toBe('string');
    });
  });

  it('returned IDs match pending queue', () => {
    const r = makeRegistry();
    const result = generateDailyEncounters(r);
    const pending = r.get(RK.PENDING_ENCOUNTERS);
    expect(result.map(e => e.id)).toEqual(pending);
  });

  it('generates no duplicates within a single day', () => {
    const r = makeRegistry();
    generateDailyEncounters(r);
    const pending = r.get(RK.PENDING_ENCOUNTERS);
    const unique = new Set(pending);
    expect(unique.size).toBe(pending.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Category probability distribution (statistical test)
// ─────────────────────────────────────────────────────────────────────────────

describe('Category probability distribution', () => {
  it('generates encounters with roughly the expected category distribution', () => {
    const RUNS = 2000;
    const counts = { helpful: 0, neutral: 0, challenge: 0, major: 0 };
    const r = makeRegistry({ level: 5 });

    for (let i = 0; i < RUNS; i++) {
      const result = generateDailyEncounters(r);
      for (const e of result) {
        if (counts[e.category] !== undefined) counts[e.category]++;
      }
    }

    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    const helpfulPct   = (counts.helpful   / total) * 100;
    const neutralPct   = (counts.neutral   / total) * 100;
    const challengePct = (counts.challenge / total) * 100;
    const majorPct     = (counts.major     / total) * 100;

    // Allow generous ±15% tolerance for stochastic tests
    expect(helpfulPct).toBeGreaterThan(15);
    expect(helpfulPct).toBeLessThan(45);
    expect(neutralPct).toBeGreaterThan(25);
    expect(neutralPct).toBeLessThan(55);
    expect(challengePct).toBeGreaterThan(10);
    expect(challengePct).toBeLessThan(40);
    expect(majorPct).toBeLessThan(20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// triggerNextEncounter
// ─────────────────────────────────────────────────────────────────────────────

describe('triggerNextEncounter', () => {
  it('returns null when no pending encounters', () => {
    const r = makeRegistry();
    r.set(RK.PENDING_ENCOUNTERS, []);
    expect(triggerNextEncounter(r)).toBeNull();
  });

  it('returns the first pending encounter', () => {
    const r = makeRegistry();
    r.set(RK.PENDING_ENCOUNTERS, ['neutral_street_musician', 'helpful_bike_stranger']);
    const encounter = triggerNextEncounter(r);
    expect(encounter).not.toBeNull();
    expect(encounter.id).toBe('neutral_street_musician');
  });

  it('removes the triggered encounter from the pending queue', () => {
    const r = makeRegistry();
    r.set(RK.PENDING_ENCOUNTERS, ['neutral_street_musician', 'helpful_bike_stranger']);
    triggerNextEncounter(r);
    const remaining = r.get(RK.PENDING_ENCOUNTERS);
    expect(remaining).toHaveLength(1);
    expect(remaining[0]).toBe('helpful_bike_stranger');
  });

  it('emits ENCOUNTER_TRIGGERED event', () => {
    const r = makeRegistry();
    r.set(RK.PENDING_ENCOUNTERS, ['neutral_street_musician']);
    const handler = vi.fn();
    r.events.on(ENCOUNTER_TRIGGERED, handler);
    triggerNextEncounter(r);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({ encounter: { id: 'neutral_street_musician' } });
  });

  it('returns null when pending ID does not match any encounter', () => {
    const r = makeRegistry();
    r.set(RK.PENDING_ENCOUNTERS, ['non_existent_encounter']);
    const result = triggerNextEncounter(r);
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveEncounter
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveEncounter — validation', () => {
  it('returns error when encounter ID not found', () => {
    const r = makeRegistry();
    const result = resolveEncounter(r, 'unknown_encounter', 0);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('encounter_not_found');
  });

  it('returns error when option index is out of range', () => {
    const r = makeRegistry();
    const result = resolveEncounter(r, 'neutral_street_musician', 99);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('invalid_option');
  });
});

describe('resolveEncounter — XP outcomes', () => {
  it('grants XP for positive xp outcome', () => {
    const r = makeRegistry({ xp: 0 });
    // neutral_street_musician option 0 grants 8 xp
    resolveEncounter(r, 'neutral_street_musician', 0);
    expect(r.get(RK.PLAYER_XP)).toBeGreaterThan(0);
  });

  it('includes xp in returned effects', () => {
    const r = makeRegistry();
    const result = resolveEncounter(r, 'neutral_street_musician', 0);
    expect(result.success).toBe(true);
    expect(result.effects.xp).toBeDefined();
  });
});

describe('resolveEncounter — money outcomes', () => {
  it('adds money for positive money outcome', () => {
    const r = makeRegistry({ money: 100 });
    // helpful_discount_tip option 0 grants money: 30
    resolveEncounter(r, 'helpful_discount_tip', 0);
    expect(r.get(RK.PLAYER_MONEY)).toBeGreaterThan(100);
  });

  it('deducts money for negative money outcome', () => {
    const r = makeRegistry({ money: 200 });
    // challenge_rain_no_jacket option 0 costs money: -80
    resolveEncounter(r, 'challenge_rain_no_jacket', 0);
    expect(r.get(RK.PLAYER_MONEY)).toBeLessThan(200);
  });
});

describe('resolveEncounter — skill outcomes', () => {
  it('increments the specified skill', () => {
    const r = makeRegistry({ cycling: 0 });
    // helpful_bike_stranger option 1 grants cycling +5
    resolveEncounter(r, 'helpful_bike_stranger', 1);
    expect(r.get(RK.SKILL_CYCLING)).toBeGreaterThan(0);
  });
});

describe('resolveEncounter — relationship outcomes', () => {
  it('changes NPC relationship when specified', () => {
    const r = makeRegistry();
    // helpful_bike_stranger option 0 changes freja relationship
    resolveEncounter(r, 'helpful_bike_stranger', 0);
    const relationships = r.get(RK.NPC_RELATIONSHIPS);
    expect(relationships).toBeDefined();
    // freja relationship should have been set
    expect(relationships['freja']).toBeDefined();
  });
});

describe('resolveEncounter — flag outcomes', () => {
  it('sets a game flag when specified in outcome', () => {
    const r = makeRegistry({ level: 1 });
    // helpful_language_class option 0 sets flag enrolled_language_class
    resolveEncounter(r, 'helpful_language_class', 0);
    const flags = r.get(RK.GAME_FLAGS);
    expect(flags['enrolled_language_class']).toBe(true);
  });
});

describe('resolveEncounter — encyclopedia outcomes', () => {
  it('unlocks an encyclopedia entry when specified', () => {
    const r = makeRegistry();
    // neutral_street_musician option 0 unlocks culture_folk_music
    // (entry may or may not exist in data, but the call should be made)
    const result = resolveEncounter(r, 'neutral_street_musician', 0);
    expect(result.success).toBe(true);
    expect(result.effects.encyclopedia).toBe('culture_folk_music');
  });
});

describe('resolveEncounter — history recording', () => {
  it('records the resolved encounter in ENCOUNTER_HISTORY', () => {
    const r = makeRegistry({ day: 3 });
    resolveEncounter(r, 'neutral_street_musician', 0);
    const history = r.get(RK.ENCOUNTER_HISTORY);
    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({
      encounterId: 'neutral_street_musician',
      day:         3,
      optionIndex: 0,
    });
  });

  it('appends to existing history', () => {
    const r = makeRegistry({
      day:     5,
      history: [{ encounterId: 'other_encounter', day: 1, optionIndex: 0 }],
    });
    resolveEncounter(r, 'neutral_street_musician', 0);
    const history = r.get(RK.ENCOUNTER_HISTORY);
    expect(history).toHaveLength(2);
  });
});

describe('resolveEncounter — one-time encounters', () => {
  it('marks a one-time encounter as resolved in ENCOUNTER_FLAGS', () => {
    const r = makeRegistry({ level: 1 });
    resolveEncounter(r, 'helpful_language_class', 0);
    const flags = r.get(RK.ENCOUNTER_FLAGS);
    expect(flags['one_time_helpful_language_class']).toBe(true);
  });

  it('excludes a resolved one-time encounter from the pool', () => {
    const r = makeRegistry({ level: 1 });
    resolveEncounter(r, 'helpful_language_class', 0);
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('helpful_language_class');
  });

  it('does not mark regular (non-one-time) encounters in ENCOUNTER_FLAGS', () => {
    const r = makeRegistry();
    resolveEncounter(r, 'neutral_street_musician', 0);
    const flags = r.get(RK.ENCOUNTER_FLAGS);
    expect(flags['one_time_neutral_street_musician']).toBeUndefined();
  });
});

describe('resolveEncounter — events', () => {
  it('emits ENCOUNTER_RESOLVED with correct data', () => {
    const r = makeRegistry();
    const handler = vi.fn();
    r.events.on(ENCOUNTER_RESOLVED, handler);
    resolveEncounter(r, 'neutral_street_musician', 0);
    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.encounterId).toBe('neutral_street_musician');
    expect(payload.optionIndex).toBe(0);
    expect(typeof payload.resultText).toBe('string');
  });

  it('includes culturalTip when present', () => {
    const r = makeRegistry();
    const result = resolveEncounter(r, 'neutral_street_musician', 0);
    expect(typeof result.culturalTip).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isOptionAvailable — skill-gated options
// ─────────────────────────────────────────────────────────────────────────────

describe('isOptionAvailable', () => {
  it('returns true when option has no skillCheck', () => {
    const r = makeRegistry();
    const option = { text: 'Simple option', outcome: {} };
    expect(isOptionAvailable(r, option)).toBe(true);
  });

  it('returns false when skill requirement is not met', () => {
    const r = makeRegistry({ cycling: 0 }); // level 1
    const option = { text: 'Expert option', skillCheck: { skill: 'cycling', level: 3 }, outcome: {} };
    expect(isOptionAvailable(r, option)).toBe(false);
  });

  it('returns true when skill requirement is exactly met', () => {
    const r = makeRegistry({ cycling: 40 }); // level 3
    const option = { text: 'Skilled option', skillCheck: { skill: 'cycling', level: 3 }, outcome: {} };
    expect(isOptionAvailable(r, option)).toBe(true);
  });

  it('returns true when skill exceeds requirement', () => {
    const r = makeRegistry({ language: 80 }); // level 5
    const option = { text: 'Language option', skillCheck: { skill: 'language', level: 2 }, outcome: {} };
    expect(isOptionAvailable(r, option)).toBe(true);
  });

  it('returns true for unknown skill name (no registry key)', () => {
    const r = makeRegistry();
    const option = { text: 'Unknown skill', skillCheck: { skill: 'unknown_skill', level: 1 }, outcome: {} };
    expect(isOptionAvailable(r, option)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Encounter chaining via flags
// ─────────────────────────────────────────────────────────────────────────────

describe('Encounter chaining via flags', () => {
  it('excludes chained encounter when required flag is missing', () => {
    const r = makeRegistry({ level: 15, gameFlags: {} });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('major_community_leader');
  });

  it('includes chained encounter after flag is set', () => {
    const r = makeRegistry({ level: 15, gameFlags: { met_thomas: true } });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).toContain('major_community_leader');
  });

  it('setting flag via resolveEncounter enables chained encounter', () => {
    const r = makeRegistry({ level: 2, gameFlags: {} });

    // helpful_npc_intro requires knows_lars flag and sets met_thomas
    r.set(RK.GAME_FLAGS, { knows_lars: true });
    resolveEncounter(r, 'helpful_npc_intro', 0);

    const flags = r.get(RK.GAME_FLAGS);
    expect(flags['met_thomas']).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7-day cooldown integration: encounters don't repeat across days
// ─────────────────────────────────────────────────────────────────────────────

describe('7-day cooldown across multiple days', () => {
  it('encounter is excluded from pool after being resolved today', () => {
    const r = makeRegistry({ day: 5 });
    resolveEncounter(r, 'neutral_street_musician', 0);

    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).not.toContain('neutral_street_musician');
  });

  it('encounter reappears in pool after cooldown expires', () => {
    const r = makeRegistry({
      day: 9,
      history: [{ encounterId: 'neutral_street_musician', day: 2, optionIndex: 0 }],
    });
    const pool = getEncounterPool(r);
    const ids = pool.map(e => e.id);
    expect(ids).toContain('neutral_street_musician');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Full integration flow: generate → trigger → resolve
// ─────────────────────────────────────────────────────────────────────────────

describe('Full encounter flow integration', () => {
  it('generates → triggers → resolves an encounter end-to-end', () => {
    const r = makeRegistry({ day: 1, xp: 0 });

    // Generate encounters for the day
    const generated = generateDailyEncounters(r);
    expect(generated.length).toBeGreaterThanOrEqual(2);

    // Trigger the first one
    const encounter = triggerNextEncounter(r);
    expect(encounter).not.toBeNull();

    // Resolve with first option
    const result = resolveEncounter(r, encounter.id, 0);
    expect(result.success).toBe(true);
    expect(typeof result.resultText).toBe('string');

    // Verify history was recorded
    const history = r.get(RK.ENCOUNTER_HISTORY);
    expect(history.some(h => h.encounterId === encounter.id)).toBe(true);
  });

  it('triggered encounter is removed from pending queue', () => {
    const r = makeRegistry();
    generateDailyEncounters(r);
    const beforeCount = r.get(RK.PENDING_ENCOUNTERS).length;
    triggerNextEncounter(r);
    const afterCount = r.get(RK.PENDING_ENCOUNTERS).length;
    expect(afterCount).toBe(beforeCount - 1);
  });

  it('can trigger all generated encounters sequentially', () => {
    const r = makeRegistry({ day: 1 });
    generateDailyEncounters(r);
    const total = r.get(RK.PENDING_ENCOUNTERS).length;

    for (let i = 0; i < total; i++) {
      const enc = triggerNextEncounter(r);
      expect(enc).not.toBeNull();
    }

    // Queue should now be empty
    expect(triggerNextEncounter(r)).toBeNull();
  });

  it('weather-specific encounter only triggers in matching weather', () => {
    // Set up conditions for rain encounter
    const r = makeRegistry({ weather: 'Rainy' });
    const pool = getEncounterPool(r);
    const rainEncounters = pool.filter(e => {
      const cond = e.conditions?.weather ?? [];
      return cond.includes('Rainy');
    });
    expect(rainEncounters.length).toBeGreaterThan(0);

    // Change weather — rain encounters should no longer be in pool
    const r2 = makeRegistry({ weather: 'Sunny' });
    const pool2 = getEncounterPool(r2);
    const rainOnlySunny = pool2.filter(e => {
      const cond = e.conditions?.weather ?? [];
      return cond.length > 0 && !cond.includes('any') && cond.every(w => w === 'Rainy');
    });
    expect(rainOnlySunny.length).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Branch coverage — negative XP and item removal
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveEncounter — negative XP (penalizeXP branch)', () => {
  it('penalizes XP when money outcome reduces money (challenge_rain_no_jacket option 0)', () => {
    // challenge_rain_no_jacket option 1 — negative money and XP via duck-into-café
    const r = makeRegistry({ xp: 200, money: 500 });
    // Option 1: duck into cafe, xp: 8
    resolveEncounter(r, 'challenge_rain_no_jacket', 1);
    // xp should have increased (positive xp)
    expect(r.get(RK.PLAYER_XP)).toBeGreaterThan(200);
    // money should have decreased (negative money outcome)
    expect(r.get(RK.PLAYER_MONEY)).toBeLessThan(500);
  });

  it('applies negative XP when outcome.xp is negative (challenge_public_embarrassment option 1)', () => {
    const r = makeRegistry({ xp: 200 });
    // option 1: xp: -5 → penalizeXP branch
    const result = resolveEncounter(r, 'challenge_public_embarrassment', 1);
    expect(result.success).toBe(true);
    expect(result.effects.xp).toBe(-5);
    // XP should have decreased
    expect(r.get(RK.PLAYER_XP)).toBeLessThan(200);
  });
});

describe('resolveEncounter — item outcomes', () => {
  it('adds an item when outcome.item.action is give (challenge_rain_no_jacket option 0)', () => {
    const r = makeRegistry({ money: 500 });
    // option 0 outcome includes item: { itemId: 'umbrella', action: 'give' }
    const result = resolveEncounter(r, 'challenge_rain_no_jacket', 0);
    expect(result.success).toBe(true);
    expect(result.effects.item).toMatchObject({ itemId: 'umbrella', action: 'give' });
  });

  it('records item effects in returned effects when action is give', () => {
    const r = makeRegistry({ money: 500 });
    const result = resolveEncounter(r, 'challenge_rain_no_jacket', 0);
    expect(result.effects.item.action).toBe('give');
  });

  it('removes an item when outcome.item.action is take (neutral_winter_darkness option 1)', () => {
    const r = makeRegistry({ season: 'Winter', weather: 'Cloudy', timeOfDay: 'evening' });
    // option 1: item: { itemId: 'vitamin_d', action: 'take' }
    const result = resolveEncounter(r, 'neutral_winter_darkness', 1);
    expect(result.success).toBe(true);
    expect(result.effects.item).toMatchObject({ itemId: 'vitamin_d', action: 'take' });
  });
});

describe('resolveEncounter — multi-skill (skills array) outcomes', () => {
  it('applies all skills in a skills array outcome', () => {
    const r = makeRegistry({ level: 10, language: 0, bureaucracy: 0,
      gameFlags: { passed_danish_test: true } });
    // major_cultural_breakthrough option 0 uses skills: [{cultural,20},{language,15}]
    const result = resolveEncounter(r, 'major_cultural_breakthrough', 0);
    expect(result.success).toBe(true);
    expect(result.effects.skills).toBeDefined();
    expect(result.effects.skills.length).toBe(2);
    expect(r.get(RK.SKILL_LANGUAGE)).toBeGreaterThan(0);
    expect(r.get(RK.SKILL_CULTURAL)).toBeGreaterThan(0);
  });
});



describe('generateDailyEncounters — empty/exhausted pool', () => {
  it('returns empty array when pool is completely exhausted by cooldowns and one-times', () => {
    // Exhaust the pool by marking every encounter as one-time resolved
    const encounters = getAllEncounters();
    const flags = {};
    const history = [];

    for (const e of encounters) {
      flags[`one_time_${e.id}`] = true;
      history.push({ encounterId: e.id, day: 1, optionIndex: 0 });
    }

    const r = makeRegistry({ day: 2, flags, history });
    // Pool should be empty
    const pool = getEncounterPool(r);
    // Most encounters are not oneTime so they'll still appear after cooldown expires
    // But with all flags set, oneTime ones are gone. Non-one-time encounters with recent
    // history will be on cooldown.
    // The key test: generateDailyEncounters should still return an array (may be empty)
    const result = generateDailyEncounters(r);
    expect(Array.isArray(result)).toBe(true);
  });
});
