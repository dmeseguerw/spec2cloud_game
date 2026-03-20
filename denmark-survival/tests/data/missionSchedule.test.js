/**
 * tests/data/missionSchedule.test.js
 * Tests for mission schedule data and getAvailableDialogues logic.
 *
 * Covers:
 *  - MISSION_SCHEDULE has expected entries and schema
 *  - getAvailableDialogues filters by day and prerequisites
 *  - Prerequisite checking: flag, dayReached, questCompleted, questActive, relationship, and
 *  - Edge cases: no quest engine, empty registry, future days
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  MISSION_SCHEDULE,
  getAvailableDialogues,
} from '../../src/data/missionSchedule.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry(overrides = {}) {
  const registry = new MockRegistry();
  registry.set('game_flags', overrides.flags || {});
  registry.set('npc_relationships', overrides.relationships || {});
  return registry;
}

function createMockQuestEngine(activeIds = [], completedIds = []) {
  return {
    getActiveTasks: () => activeIds.map(id => ({ id, status: 'active' })),
    getCompletedTasks: () => completedIds.map(id => ({ id, status: 'completed' })),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// MISSION_SCHEDULE structure
// ─────────────────────────────────────────────────────────────────────────────

describe('MISSION_SCHEDULE structure', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(MISSION_SCHEDULE)).toBe(true);
    expect(MISSION_SCHEDULE.length).toBeGreaterThan(0);
  });

  it('has 7 schedule entries', () => {
    expect(MISSION_SCHEDULE).toHaveLength(7);
  });

  it('every entry has required fields', () => {
    for (const entry of MISSION_SCHEDULE) {
      expect(entry).toHaveProperty('day');
      expect(entry).toHaveProperty('dialogueId');
      expect(entry).toHaveProperty('prerequisite');
      expect(entry).toHaveProperty('npcId');
      expect(entry).toHaveProperty('npcName');
    }
  });

  it('every day is a positive integer', () => {
    for (const entry of MISSION_SCHEDULE) {
      expect(Number.isInteger(entry.day)).toBe(true);
      expect(entry.day).toBeGreaterThan(0);
    }
  });

  it('entries are in chronological order (day)', () => {
    for (let i = 1; i < MISSION_SCHEDULE.length; i++) {
      expect(MISSION_SCHEDULE[i].day).toBeGreaterThanOrEqual(MISSION_SCHEDULE[i - 1].day);
    }
  });

  it('first entry is lars_day1_tutorial on day 1', () => {
    expect(MISSION_SCHEDULE[0].dialogueId).toBe('lars_day1_tutorial');
    expect(MISSION_SCHEDULE[0].day).toBe(1);
    expect(MISSION_SCHEDULE[0].npcId).toBe('lars');
  });

  it('last entry is lars_coffee_event on day 14', () => {
    const last = MISSION_SCHEDULE[MISSION_SCHEDULE.length - 1];
    expect(last.dialogueId).toBe('lars_coffee_event');
    expect(last.day).toBe(14);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAvailableDialogues
// ─────────────────────────────────────────────────────────────────────────────

describe('getAvailableDialogues', () => {
  it('returns empty array on day 1 without character_creation_complete flag', () => {
    const registry = createRegistry();
    const result = getAvailableDialogues(1, registry, null);
    expect(result).toEqual([]);
  });

  it('returns lars_day1_tutorial on day 1 with character_creation_complete flag', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const result = getAvailableDialogues(1, registry, null);
    expect(result).toHaveLength(1);
    expect(result[0].dialogueId).toBe('lars_day1_tutorial');
  });

  it('returns sofie_metro_tip on day 3 (dayReached prerequisite)', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const qe = createMockQuestEngine();
    const result = getAvailableDialogues(3, registry, qe);
    const sofieEntry = result.find(e => e.dialogueId === 'sofie_metro_tip');
    expect(sofieEntry).toBeDefined();
    expect(sofieEntry.npcId).toBe('sofie');
  });

  it('returns lars_day2_language on day 2 when story_grocery_run is completed', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const qe = createMockQuestEngine([], ['story_grocery_run']);
    const result = getAvailableDialogues(2, registry, qe);
    const larsDay2 = result.find(e => e.dialogueId === 'lars_day2_language');
    expect(larsDay2).toBeDefined();
  });

  it('does NOT return lars_day2_language without grocery quest completed', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const qe = createMockQuestEngine();
    const result = getAvailableDialogues(2, registry, qe);
    const larsDay2 = result.find(e => e.dialogueId === 'lars_day2_language');
    expect(larsDay2).toBeUndefined();
  });

  it('does NOT return future-day entries', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const qe = createMockQuestEngine();
    const result = getAvailableDialogues(1, registry, qe);
    const futureEntries = result.filter(e => e.day > 1);
    expect(futureEntries).toHaveLength(0);
  });

  it('returns thomas_second_meeting on day 8 when thomas_first_meeting is completed', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const qe = createMockQuestEngine([], ['thomas_first_meeting']);
    const result = getAvailableDialogues(8, registry, qe);
    const thomas = result.find(e => e.dialogueId === 'thomas_second_meeting');
    expect(thomas).toBeDefined();
  });

  it('returns mette_pant_tutorial on day 11 with AND prerequisites met', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const qe = createMockQuestEngine([], ['story_grocery_run']);
    const result = getAvailableDialogues(11, registry, qe);
    const mette = result.find(e => e.dialogueId === 'mette_pant_tutorial');
    expect(mette).toBeDefined();
  });

  it('does NOT return mette_pant_tutorial when only one AND condition met', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
    });
    const qe = createMockQuestEngine(); // grocery not completed
    const result = getAvailableDialogues(11, registry, qe);
    const mette = result.find(e => e.dialogueId === 'mette_pant_tutorial');
    expect(mette).toBeUndefined();
  });

  it('returns lars_coffee_invitation when relationship >= 50 and day >= 13', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
      relationships: { lars: 50 },
    });
    const qe = createMockQuestEngine();
    const result = getAvailableDialogues(13, registry, qe);
    const coffee = result.find(e => e.dialogueId === 'lars_coffee_invitation');
    expect(coffee).toBeDefined();
  });

  it('does NOT return lars_coffee_invitation when relationship < 50', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
      relationships: { lars: 30 },
    });
    const qe = createMockQuestEngine();
    const result = getAvailableDialogues(13, registry, qe);
    const coffee = result.find(e => e.dialogueId === 'lars_coffee_invitation');
    expect(coffee).toBeUndefined();
  });

  it('returns lars_coffee_event when story_lars_coffee is active', () => {
    const registry = createRegistry({
      flags: { character_creation_complete: true },
      relationships: { lars: 50 },
    });
    const qe = createMockQuestEngine(['story_lars_coffee'], []);
    const result = getAvailableDialogues(14, registry, qe);
    const event = result.find(e => e.dialogueId === 'lars_coffee_event');
    expect(event).toBeDefined();
  });

  it('returns empty when questEngine is not provided and prerequisites need it', () => {
    const registry = createRegistry();
    const result = getAvailableDialogues(8, registry, null);
    // thomas_second_meeting requires questCompleted — should not appear
    const thomas = result.find(e => e.dialogueId === 'thomas_second_meeting');
    expect(thomas).toBeUndefined();
  });
});
