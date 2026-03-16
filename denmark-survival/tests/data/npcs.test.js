/**
 * tests/data/npcs.test.js
 * Unit tests for the NPC data module.
 *
 * Covers:
 *  - All 10 NPC entries pass full schema validation
 *  - Starting relationship values match FDD specification
 *  - IDs are unique and well-formed
 *  - Schedules are complete with valid time slots
 *  - getNPCById helper returns correct NPC
 */

import { describe, it, expect } from 'vitest';
import { NPCS, getNPCById } from '../../src/data/npcs.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  'id', 'name', 'role', 'personality', 'location',
  'schedule', 'startingRelationship', 'portraitKey', 'spriteKey', 'arc',
];

const SCHEDULE_TIME_SLOTS = ['morning', 'afternoon', 'evening', 'night'];

// ─────────────────────────────────────────────────────────────────────────────
// NPCS array structure
// ─────────────────────────────────────────────────────────────────────────────

describe('NPCS array', () => {
  it('contains exactly 10 NPC entries', () => {
    expect(NPCS).toHaveLength(10);
  });

  it('every entry has all required fields', () => {
    for (const npc of NPCS) {
      for (const field of REQUIRED_FIELDS) {
        expect(npc, `NPC "${npc.name || npc.id}" is missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every id is a non-empty string', () => {
    for (const npc of NPCS) {
      expect(typeof npc.id).toBe('string');
      expect(npc.id.length).toBeGreaterThan(0);
    }
  });

  it('all NPC ids are unique', () => {
    const ids = NPCS.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every name is a non-empty string', () => {
    for (const npc of NPCS) {
      expect(typeof npc.name).toBe('string');
      expect(npc.name.length).toBeGreaterThan(0);
    }
  });

  it('every schedule contains all four time slots', () => {
    for (const npc of NPCS) {
      for (const slot of SCHEDULE_TIME_SLOTS) {
        expect(npc.schedule, `NPC "${npc.id}" schedule is missing slot "${slot}"`).toHaveProperty(slot);
      }
    }
  });

  it('schedule values are strings or null', () => {
    for (const npc of NPCS) {
      for (const slot of SCHEDULE_TIME_SLOTS) {
        const val = npc.schedule[slot];
        expect(val === null || typeof val === 'string',
          `NPC "${npc.id}" schedule["${slot}"] should be string or null, got ${typeof val}`
        ).toBe(true);
      }
    }
  });

  it('startingRelationship is a number in range 0–100', () => {
    for (const npc of NPCS) {
      expect(typeof npc.startingRelationship).toBe('number');
      expect(npc.startingRelationship).toBeGreaterThanOrEqual(0);
      expect(npc.startingRelationship).toBeLessThanOrEqual(100);
    }
  });

  it('portraitKey and spriteKey are non-empty strings', () => {
    for (const npc of NPCS) {
      expect(typeof npc.portraitKey).toBe('string');
      expect(npc.portraitKey.length).toBeGreaterThan(0);
      expect(typeof npc.spriteKey).toBe('string');
      expect(npc.spriteKey.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Starting relationships match FDD specification
// ─────────────────────────────────────────────────────────────────────────────

describe('NPC starting relationships — FDD specification', () => {
  const EXPECTED = {
    lars:      40,
    sofie:     35,
    henrik:    25,
    mette:     30,
    kasper:    15,
    dr_jensen: 20,
    bjorn:     10,
    freja:     30,
    thomas:    10,
    emma:      25,
  };

  for (const [id, expected] of Object.entries(EXPECTED)) {
    it(`${id} starts at relationship ${expected}`, () => {
      const npc = NPCS.find(n => n.id === id);
      expect(npc, `NPC "${id}" not found`).toBeDefined();
      expect(npc.startingRelationship).toBe(expected);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// getNPCById helper
// ─────────────────────────────────────────────────────────────────────────────

describe('getNPCById', () => {
  it('returns the correct NPC for a valid id', () => {
    const npc = getNPCById('lars');
    expect(npc).toBeDefined();
    expect(npc.id).toBe('lars');
    expect(npc.name).toBe('Lars');
  });

  it('returns undefined for an unknown id', () => {
    expect(getNPCById('unknown_npc')).toBeUndefined();
  });

  it('returns correct NPC for each of the 10 NPCs', () => {
    for (const npc of NPCS) {
      const found = getNPCById(npc.id);
      expect(found).toBeDefined();
      expect(found.id).toBe(npc.id);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Schedule spot checks
// ─────────────────────────────────────────────────────────────────────────────

describe('NPC schedule spot checks', () => {
  it('Henrik is at workplace in morning and afternoon', () => {
    const npc = getNPCById('henrik');
    expect(npc.schedule.morning).toBe('workplace');
    expect(npc.schedule.afternoon).toBe('workplace');
  });

  it('Henrik is unavailable in evening and night', () => {
    const npc = getNPCById('henrik');
    expect(npc.schedule.evening).toBeNull();
    expect(npc.schedule.night).toBeNull();
  });

  it('Mette is at grocery_store in morning and afternoon', () => {
    const npc = getNPCById('mette');
    expect(npc.schedule.morning).toBe('grocery_store');
    expect(npc.schedule.afternoon).toBe('grocery_store');
  });

  it('Kasper is at bike_lane in afternoon', () => {
    const npc = getNPCById('kasper');
    expect(npc.schedule.afternoon).toBe('bike_lane');
  });

  it('Freja is at cafe in evening', () => {
    const npc = getNPCById('freja');
    expect(npc.schedule.evening).toBe('cafe');
  });

  it('Lars is at apartment_area in evening', () => {
    const npc = getNPCById('lars');
    expect(npc.schedule.evening).toBe('apartment_area');
  });

  it('most NPCs are unavailable at night', () => {
    const unavailableAtNight = NPCS.filter(npc => npc.schedule.night === null);
    expect(unavailableAtNight.length).toBe(NPCS.length);
  });
});
