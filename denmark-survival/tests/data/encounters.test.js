/**
 * tests/data/encounters.test.js
 * Schema validation and structural integrity tests for encounters.json.
 *
 * Covers:
 *  - Minimum encounter count and category distribution
 *  - Required fields on each encounter object
 *  - Valid category values
 *  - Options structure: text, outcome, resultText, culturalTip
 *  - Outcome field type checks (xp, money, skill, relationship, item, encyclopedia, flag)
 *  - Conditions structure validation
 *  - Unique ID enforcement
 *  - Skill name validity
 *  - Cultural tip presence on all options
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';
import { getAllEncounters } from '../../src/systems/EncounterEngine.js';

const VALID_CATEGORIES = ['helpful', 'neutral', 'challenge', 'major'];
const VALID_SKILL_NAMES = ['language', 'cycling', 'cultural', 'bureaucracy'];
const VALID_WEATHER = ['Sunny', 'Cloudy', 'Rainy', 'Windy', 'Snowy', 'Foggy', 'any'];
const VALID_SEASONS = ['Spring', 'Summer', 'Fall', 'Winter', 'any'];
const VALID_TIMES   = ['morning', 'afternoon', 'evening', 'night', 'any'];
const VALID_TRANSPORT = ['walk', 'bike', 'metro'];

const encounters = getAllEncounters();

// ─────────────────────────────────────────────────────────────────────────────
// Count and distribution
// ─────────────────────────────────────────────────────────────────────────────

describe('encounters.json — count and distribution', () => {
  it('contains at least 50 encounters', () => {
    expect(encounters.length).toBeGreaterThanOrEqual(50);
  });

  it('has at least 15 helpful encounters', () => {
    const helpful = encounters.filter(e => e.category === 'helpful');
    expect(helpful.length).toBeGreaterThanOrEqual(15);
  });

  it('has at least 10 neutral encounters', () => {
    const neutral = encounters.filter(e => e.category === 'neutral');
    expect(neutral.length).toBeGreaterThanOrEqual(10);
  });

  it('has at least 8 challenge encounters', () => {
    const challenge = encounters.filter(e => e.category === 'challenge');
    expect(challenge.length).toBeGreaterThanOrEqual(8);
  });

  it('has at least 2 major encounters', () => {
    const major = encounters.filter(e => e.category === 'major');
    expect(major.length).toBeGreaterThanOrEqual(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unique IDs
// ─────────────────────────────────────────────────────────────────────────────

describe('encounters.json — unique IDs', () => {
  it('all encounter IDs are unique', () => {
    const ids = encounters.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all encounter IDs are non-empty strings', () => {
    encounters.forEach(e => {
      expect(typeof e.id).toBe('string');
      expect(e.id.length).toBeGreaterThan(0);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Required top-level fields
// ─────────────────────────────────────────────────────────────────────────────

describe('encounters.json — required fields', () => {
  encounters.forEach(encounter => {
    it(`${encounter.id}: has required top-level fields`, () => {
      expect(typeof encounter.id).toBe('string');
      expect(typeof encounter.title).toBe('string');
      expect(encounter.title.length).toBeGreaterThan(0);
      expect(typeof encounter.description).toBe('string');
      expect(encounter.description.length).toBeGreaterThan(0);
      expect(VALID_CATEGORIES).toContain(encounter.category);
      expect(typeof encounter.oneTime).toBe('boolean');
      expect(Array.isArray(encounter.options)).toBe(true);
      expect(encounter.options.length).toBeGreaterThanOrEqual(2);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Options structure
// ─────────────────────────────────────────────────────────────────────────────

describe('encounters.json — options structure', () => {
  encounters.forEach(encounter => {
    encounter.options.forEach((option, idx) => {
      it(`${encounter.id} option[${idx}]: has required fields`, () => {
        expect(typeof option.text).toBe('string');
        expect(option.text.length).toBeGreaterThan(0);
        expect(typeof option.outcome).toBe('object');
        expect(option.outcome).not.toBeNull();
        expect(typeof option.resultText).toBe('string');
        expect(option.resultText.length).toBeGreaterThan(0);
        expect(typeof option.culturalTip).toBe('string');
        expect(option.culturalTip.length).toBeGreaterThan(0);
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Outcome field validation
// ─────────────────────────────────────────────────────────────────────────────

describe('encounters.json — outcome field types', () => {
  encounters.forEach(encounter => {
    encounter.options.forEach((option, idx) => {
      const outcome = option.outcome;

      it(`${encounter.id} option[${idx}]: xp is number if present`, () => {
        if (outcome.xp !== undefined) {
          expect(typeof outcome.xp).toBe('number');
        }
      });

      it(`${encounter.id} option[${idx}]: money is number if present`, () => {
        if (outcome.money !== undefined) {
          expect(typeof outcome.money).toBe('number');
        }
      });

      it(`${encounter.id} option[${idx}]: skill is valid if present`, () => {
        if (outcome.skill !== undefined) {
          expect(typeof outcome.skill.skillKey).toBe('string');
          expect(typeof outcome.skill.delta).toBe('number');
          expect(outcome.skill.delta).toBeGreaterThan(0);
        }
        if (outcome.skills !== undefined) {
          expect(Array.isArray(outcome.skills)).toBe(true);
          for (const s of outcome.skills) {
            expect(typeof s.skillKey).toBe('string');
            expect(typeof s.delta).toBe('number');
            expect(s.delta).toBeGreaterThan(0);
          }
        }
      });

      it(`${encounter.id} option[${idx}]: relationship is valid if present`, () => {
        if (outcome.relationship !== undefined) {
          expect(typeof outcome.relationship.npcId).toBe('string');
          expect(typeof outcome.relationship.delta).toBe('number');
          expect(outcome.relationship.delta).not.toBe(0);
        }
      });

      it(`${encounter.id} option[${idx}]: item is valid if present`, () => {
        if (outcome.item !== undefined) {
          expect(typeof outcome.item.itemId).toBe('string');
          expect(['give', 'take']).toContain(outcome.item.action);
        }
      });

      it(`${encounter.id} option[${idx}]: encyclopedia is string if present`, () => {
        if (outcome.encyclopedia !== undefined) {
          expect(typeof outcome.encyclopedia).toBe('string');
          expect(outcome.encyclopedia.length).toBeGreaterThan(0);
        }
      });

      it(`${encounter.id} option[${idx}]: flag has key and value if present`, () => {
        if (outcome.flag !== undefined) {
          expect(typeof outcome.flag.key).toBe('string');
          expect(outcome.flag.value).not.toBeUndefined();
        }
      });
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// skillCheck validation
// ─────────────────────────────────────────────────────────────────────────────

describe('encounters.json — skillCheck validation', () => {
  encounters.forEach(encounter => {
    encounter.options.forEach((option, idx) => {
      if (option.skillCheck) {
        it(`${encounter.id} option[${idx}]: skillCheck has valid skill name and level`, () => {
          expect(VALID_SKILL_NAMES).toContain(option.skillCheck.skill);
          expect(typeof option.skillCheck.level).toBe('number');
          expect(option.skillCheck.level).toBeGreaterThanOrEqual(1);
          expect(option.skillCheck.level).toBeLessThanOrEqual(5);
        });
      }
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Conditions validation
// ─────────────────────────────────────────────────────────────────────────────

describe('encounters.json — conditions structure', () => {
  encounters.forEach(encounter => {
    it(`${encounter.id}: conditions is an object`, () => {
      expect(typeof encounter.conditions).toBe('object');
      expect(encounter.conditions).not.toBeNull();
    });

    const cond = encounter.conditions;

    it(`${encounter.id}: minLevel/maxLevel are valid if present`, () => {
      if (cond.minLevel !== undefined) {
        expect(typeof cond.minLevel).toBe('number');
        expect(cond.minLevel).toBeGreaterThanOrEqual(1);
      }
      if (cond.maxLevel !== undefined) {
        expect(typeof cond.maxLevel).toBe('number');
        expect(cond.maxLevel).toBeLessThanOrEqual(20);
      }
      if (cond.minLevel !== undefined && cond.maxLevel !== undefined) {
        expect(cond.minLevel).toBeLessThanOrEqual(cond.maxLevel);
      }
    });

    it(`${encounter.id}: weather values are valid`, () => {
      if (cond.weather) {
        cond.weather.forEach(w => {
          expect(VALID_WEATHER).toContain(w);
        });
      }
    });

    it(`${encounter.id}: seasons values are valid`, () => {
      if (cond.seasons) {
        cond.seasons.forEach(s => {
          expect(VALID_SEASONS).toContain(s);
        });
      }
    });

    it(`${encounter.id}: timeOfDay values are valid`, () => {
      if (cond.timeOfDay) {
        cond.timeOfDay.forEach(t => {
          expect(VALID_TIMES).toContain(t);
        });
      }
    });

    it(`${encounter.id}: transportMode is valid if present`, () => {
      if (cond.transportMode && cond.transportMode !== 'any') {
        expect(VALID_TRANSPORT).toContain(cond.transportMode);
      }
    });
  });
});
