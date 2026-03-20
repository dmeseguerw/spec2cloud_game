/**
 * tests/data/missions.test.js
 * Validates all 8 story mission definitions for schema compliance.
 *
 * Covers:
 *  - All missions have required fields
 *  - IDs are unique and match object keys
 *  - Completion condition types are valid
 *  - XP rewards are non-negative numbers
 *  - Urgency is a valid value
 */

import { describe, it, expect } from 'vitest';
import { MISSIONS } from '../../src/data/missions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Schema constants
// ─────────────────────────────────────────────────────────────────────────────

const REQUIRED_FIELDS = [
  'id', 'type', 'title', 'description', 'urgency',
  'xpReward', 'xpPenalty', 'completionCondition', 'skippable',
];

const VALID_URGENCIES = ['critical', 'urgent', 'normal', 'low'];

const VALID_CONDITION_TYPES = [
  'flag', 'locationVisited', 'npcTalked', 'dayReached', 'pantReturned',
];

const EXPECTED_MISSION_IDS = [
  'story_grocery_run',
  'story_first_class',
  'story_first_metro',
  'story_first_workday',
  'story_one_week',
  'story_thomas_second',
  'story_pant_run',
  'story_lars_coffee',
];

// ─────────────────────────────────────────────────────────────────────────────
// MISSIONS object structure
// ─────────────────────────────────────────────────────────────────────────────

describe('MISSIONS data', () => {
  it('contains exactly 8 missions', () => {
    expect(Object.keys(MISSIONS)).toHaveLength(8);
  });

  it('has all expected mission IDs', () => {
    for (const id of EXPECTED_MISSION_IDS) {
      expect(MISSIONS[id], `Missing mission: ${id}`).toBeDefined();
    }
  });

  it('object keys match mission id fields', () => {
    for (const [key, mission] of Object.entries(MISSIONS)) {
      expect(mission.id).toBe(key);
    }
  });

  it('every mission has all required fields', () => {
    for (const mission of Object.values(MISSIONS)) {
      for (const field of REQUIRED_FIELDS) {
        expect(mission, `Mission "${mission.id}" is missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every mission has type "mission"', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(mission.type).toBe('mission');
    }
  });

  it('every urgency is a valid value', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(
        VALID_URGENCIES.includes(mission.urgency),
        `Mission "${mission.id}" has invalid urgency: ${mission.urgency}`,
      ).toBe(true);
    }
  });

  it('every xpReward is a non-negative number', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(typeof mission.xpReward).toBe('number');
      expect(mission.xpReward).toBeGreaterThanOrEqual(0);
    }
  });

  it('every xpPenalty is a non-negative number', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(typeof mission.xpPenalty).toBe('number');
      expect(mission.xpPenalty).toBeGreaterThanOrEqual(0);
    }
  });

  it('every completionCondition has a valid type', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(
        VALID_CONDITION_TYPES.includes(mission.completionCondition.type),
        `Mission "${mission.id}" has invalid condition type: ${mission.completionCondition.type}`,
      ).toBe(true);
    }
  });

  it('skippable is a boolean', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(typeof mission.skippable).toBe('boolean');
    }
  });

  it('title and description are non-empty strings', () => {
    for (const mission of Object.values(MISSIONS)) {
      expect(typeof mission.title).toBe('string');
      expect(mission.title.length).toBeGreaterThan(0);
      expect(typeof mission.description).toBe('string');
      expect(mission.description.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Specific mission spot checks
// ─────────────────────────────────────────────────────────────────────────────

describe('MISSIONS — spot checks', () => {
  it('story_grocery_run uses flag condition for first_grocery_complete', () => {
    const m = MISSIONS.story_grocery_run;
    expect(m.completionCondition.type).toBe('flag');
    expect(m.completionCondition.key).toBe('first_grocery_complete');
    expect(m.completionCondition.value).toBe(true);
    expect(m.xpReward).toBe(15);
  });

  it('story_first_class uses locationVisited condition', () => {
    const m = MISSIONS.story_first_class;
    expect(m.completionCondition.type).toBe('locationVisited');
    expect(m.completionCondition.locationId).toBe('language_school');
    expect(m.xpReward).toBe(25);
  });

  it('story_one_week uses dayReached condition for day 7', () => {
    const m = MISSIONS.story_one_week;
    expect(m.completionCondition.type).toBe('dayReached');
    expect(m.completionCondition.day).toBe(7);
    expect(m.xpReward).toBe(50);
  });

  it('story_thomas_second uses npcTalked condition', () => {
    const m = MISSIONS.story_thomas_second;
    expect(m.completionCondition.type).toBe('npcTalked');
    expect(m.completionCondition.npcId).toBe('thomas');
  });

  it('story_pant_run uses pantReturned condition for 5 bottles', () => {
    const m = MISSIONS.story_pant_run;
    expect(m.completionCondition.type).toBe('pantReturned');
    expect(m.completionCondition.minCount).toBe(5);
    expect(m.xpReward).toBe(20);
  });

  it('story_lars_coffee has the highest XP reward (40)', () => {
    const m = MISSIONS.story_lars_coffee;
    expect(m.xpReward).toBe(40);
  });
});
