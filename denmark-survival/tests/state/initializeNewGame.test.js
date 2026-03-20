/**
 * tests/state/initializeNewGame.test.js
 * Unit tests for the initializeNewGame() function.
 *
 * Verifies all 13+ Day 1 starting values are set correctly.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  initializeNewGame,
  DAY1_STARTING_DAY,
  DAY1_STARTING_MONEY,
  DAY1_STARTING_HEALTH,
  DAY1_STARTING_XP,
  DAY1_STARTING_LEVEL,
  DAY1_STARTING_ENERGY,
  DAY1_STARTING_SEASON,
  DAY1_STARTING_TIME,
  DAY1_LARS_RELATIONSHIP,
} from '../../src/state/initializeNewGame.js';
import * as RK from '../../src/constants/RegistryKeys.js';

describe('initializeNewGame()', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
  });

  // ── Starting constants ─────────────────────────────────────────────────────

  describe('exported constants', () => {
    it('has correct starting day', () => {
      expect(DAY1_STARTING_DAY).toBe(1);
    });

    it('has correct starting money (1200 DKK)', () => {
      expect(DAY1_STARTING_MONEY).toBe(1200);
    });

    it('has correct starting health (75)', () => {
      expect(DAY1_STARTING_HEALTH).toBe(75);
    });

    it('has correct starting XP (0)', () => {
      expect(DAY1_STARTING_XP).toBe(0);
    });

    it('has correct starting level (1)', () => {
      expect(DAY1_STARTING_LEVEL).toBe(1);
    });

    it('has correct starting energy (80)', () => {
      expect(DAY1_STARTING_ENERGY).toBe(80);
    });

    it('has correct starting season (Autumn)', () => {
      expect(DAY1_STARTING_SEASON).toBe('Autumn');
    });

    it('has correct starting time (Morning)', () => {
      expect(DAY1_STARTING_TIME).toBe('Morning');
    });

    it('has Lars relationship at 30', () => {
      expect(DAY1_LARS_RELATIONSHIP).toBe(30);
    });
  });

  // ── Registry values after initialization ──────────────────────────────────

  describe('registry state after initializeNewGame()', () => {
    beforeEach(() => {
      initializeNewGame(registry);
    });

    it('sets CURRENT_DAY to 1', () => {
      expect(registry.get(RK.CURRENT_DAY)).toBe(1);
    });

    it('sets PLAYER_MONEY to 1200', () => {
      expect(registry.get(RK.PLAYER_MONEY)).toBe(1200);
    });

    it('sets PLAYER_HEALTH to 75', () => {
      expect(registry.get(RK.PLAYER_HEALTH)).toBe(75);
    });

    it('sets PLAYER_XP to 0', () => {
      expect(registry.get(RK.PLAYER_XP)).toBe(0);
    });

    it('sets PLAYER_LEVEL to 1', () => {
      expect(registry.get(RK.PLAYER_LEVEL)).toBe(1);
    });

    it('sets PLAYER_ENERGY to 80', () => {
      expect(registry.get(RK.PLAYER_ENERGY)).toBe(80);
    });

    it('sets INVENTORY to empty array', () => {
      expect(registry.get(RK.INVENTORY)).toEqual([]);
    });

    it('sets SKILL_LANGUAGE to 0', () => {
      expect(registry.get(RK.SKILL_LANGUAGE)).toBe(0);
    });

    it('sets SKILL_CYCLING to 0', () => {
      expect(registry.get(RK.SKILL_CYCLING)).toBe(0);
    });

    it('sets SKILL_CULTURAL to 0', () => {
      expect(registry.get(RK.SKILL_CULTURAL)).toBe(0);
    });

    it('sets SKILL_BUREAUCRACY to 0', () => {
      expect(registry.get(RK.SKILL_BUREAUCRACY)).toBe(0);
    });

    it('sets NPC_RELATIONSHIPS with Lars at 30', () => {
      const rels = registry.get(RK.NPC_RELATIONSHIPS);
      expect(rels).toBeDefined();
      expect(rels.lars).toBe(30);
    });

    it('sets TIME_OF_DAY to Morning', () => {
      expect(registry.get(RK.TIME_OF_DAY)).toBe('Morning');
    });

    it('sets SEASON to Autumn', () => {
      expect(registry.get(RK.SEASON)).toBe('Autumn');
    });

    it('sets TUTORIAL_COMPLETED to false', () => {
      expect(registry.get(RK.TUTORIAL_COMPLETED)).toBe(false);
    });

    it('sets COMPLETED_SCENARIOS to empty array', () => {
      expect(registry.get(RK.COMPLETED_SCENARIOS)).toEqual([]);
    });

    it('sets GAME_FLAGS to empty object', () => {
      expect(registry.get(RK.GAME_FLAGS)).toEqual({});
    });

    it('sets PENDING_BILLS to empty array', () => {
      expect(registry.get(RK.PENDING_BILLS)).toEqual([]);
    });

    it('sets PANT_BOTTLES to 0', () => {
      expect(registry.get(RK.PANT_BOTTLES)).toBe(0);
    });

    it('sets ENCOUNTER_HISTORY to empty array', () => {
      expect(registry.get(RK.ENCOUNTER_HISTORY)).toEqual([]);
    });

    it('sets VISITED_LOCATIONS to empty array', () => {
      expect(registry.get(RK.VISITED_LOCATIONS)).toEqual([]);
    });

    it('sets ENCYCLOPEDIA_ENTRIES to empty array', () => {
      expect(registry.get(RK.ENCYCLOPEDIA_ENTRIES)).toEqual([]);
    });
  });

  // ── Does not overwrite character creation fields ───────────────────────────

  describe('character creation fields preserved', () => {
    it('does not overwrite PLAYER_NAME if already set', () => {
      registry.set(RK.PLAYER_NAME, 'Test Player');
      initializeNewGame(registry);
      expect(registry.get(RK.PLAYER_NAME)).toBe('Test Player');
    });

    it('does not overwrite PLAYER_NATIONALITY if already set', () => {
      registry.set(RK.PLAYER_NATIONALITY, 'British');
      initializeNewGame(registry);
      expect(registry.get(RK.PLAYER_NATIONALITY)).toBe('British');
    });
  });

  // ── All 13 required values ─────────────────────────────────────────────────

  it('sets all 13 required Day 1 starting values', () => {
    initializeNewGame(registry);

    const required = [
      [RK.CURRENT_DAY,        1],
      [RK.PLAYER_MONEY,       1200],
      [RK.PLAYER_HEALTH,      75],
      [RK.PLAYER_XP,          0],
      [RK.PLAYER_LEVEL,       1],
      [RK.PLAYER_ENERGY,      80],
      [RK.SKILL_LANGUAGE,     0],
      [RK.TIME_OF_DAY,        'Morning'],
      [RK.SEASON,             'Autumn'],
      [RK.TUTORIAL_COMPLETED, false],
    ];

    for (const [key, expected] of required) {
      expect(registry.get(key), `${key} should be ${JSON.stringify(expected)}`).toEqual(expected);
    }

    expect(registry.get(RK.INVENTORY)).toEqual([]);
    expect(registry.get(RK.NPC_RELATIONSHIPS).lars).toBe(30);
    expect(Array.isArray(registry.get(RK.COMPLETED_SCENARIOS))).toBe(true);
  });
});
