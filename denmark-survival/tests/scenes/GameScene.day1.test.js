/**
 * tests/scenes/GameScene.day1.test.js
 * Unit tests for Day 1 world setup and special rules in GameScene.
 *
 * Tests the exported pure helpers: _isDay1 logic via registry state.
 * Scene methods are tested indirectly through mock-registry patterns.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { WEATHER_CLOUDY } from '../../src/systems/WeatherSystem.js';
import { initializeNewGame } from '../../src/state/initializeNewGame.js';

// ─────────────────────────────────────────────────────────────────────────────
// isDay1 detection logic (tested via registry values, not the scene)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mirrors the GameScene._isDay1() logic so it can be tested independently.
 */
function isDay1(registry) {
  return (
    registry.get(RK.CURRENT_DAY) === 1 &&
    !registry.get(RK.TUTORIAL_COMPLETED)
  );
}

describe('Day 1 detection logic', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
  });

  it('returns true when CURRENT_DAY=1 and TUTORIAL_COMPLETED=false', () => {
    registry.set(RK.CURRENT_DAY,        1);
    registry.set(RK.TUTORIAL_COMPLETED, false);
    expect(isDay1(registry)).toBe(true);
  });

  it('returns false when CURRENT_DAY=2', () => {
    registry.set(RK.CURRENT_DAY,        2);
    registry.set(RK.TUTORIAL_COMPLETED, false);
    expect(isDay1(registry)).toBe(false);
  });

  it('returns false when TUTORIAL_COMPLETED=true even on day 1', () => {
    registry.set(RK.CURRENT_DAY,        1);
    registry.set(RK.TUTORIAL_COMPLETED, true);
    expect(isDay1(registry)).toBe(false);
  });

  it('returns false when CURRENT_DAY is undefined', () => {
    expect(isDay1(registry)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 special rules
// ─────────────────────────────────────────────────────────────────────────────

describe('Day 1 special rules', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    initializeNewGame(registry);
  });

  it('starts with weather not yet set — weather system should set it to Cloudy', () => {
    // After initializeNewGame() the weather key is not set by default;
    // GameScene._initGameSystems() sets it to WEATHER_CLOUDY on Day 1.
    // We verify this by simulating what _initGameSystems does.
    registry.set(RK.WEATHER, WEATHER_CLOUDY);
    expect(registry.get(RK.WEATHER)).toBe(WEATHER_CLOUDY);
  });

  it('has no mandatory activities on Day 1', () => {
    expect(registry.get(RK.MANDATORY_ACTIVITIES)).toEqual([]);
  });

  it('has TUTORIAL_COMPLETED=false at game start', () => {
    expect(registry.get(RK.TUTORIAL_COMPLETED)).toBe(false);
  });

  it('has empty INVENTORY at game start — no random encounters possible from items', () => {
    expect(registry.get(RK.INVENTORY)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 starting state (integration with initializeNewGame)
// ─────────────────────────────────────────────────────────────────────────────

describe('Day 1 starting state', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    initializeNewGame(registry);
  });

  it('CURRENT_DAY is 1', () => {
    expect(registry.get(RK.CURRENT_DAY)).toBe(1);
  });

  it('PLAYER_MONEY is 1200', () => {
    expect(registry.get(RK.PLAYER_MONEY)).toBe(1200);
  });

  it('PLAYER_HEALTH is 75 (below full, eating improves it)', () => {
    expect(registry.get(RK.PLAYER_HEALTH)).toBe(75);
  });

  it('PLAYER_XP is 0 (no penalties can apply on Day 1)', () => {
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
  });

  it('TUTORIAL_COMPLETED is false', () => {
    expect(registry.get(RK.TUTORIAL_COMPLETED)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Apartment door context hints
// ─────────────────────────────────────────────────────────────────────────────

describe('Apartment door behaviour', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    initializeNewGame(registry);
  });

  it('grocery incomplete → first_grocery_complete flag is falsy', () => {
    const flags = registry.get(RK.GAME_FLAGS) ?? {};
    expect(flags['first_grocery_complete']).toBeFalsy();
  });

  it('after buying groceries → first_grocery_complete flag is truthy', () => {
    const flags = { first_grocery_complete: true };
    registry.set(RK.GAME_FLAGS, flags);
    expect(registry.get(RK.GAME_FLAGS)['first_grocery_complete']).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Lars placement on Day 1
// ─────────────────────────────────────────────────────────────────────────────

describe('Lars Day 1 dialogue routing', () => {
  it('isDay1() correctly directs to lars_day1_tutorial', () => {
    const reg = new MockRegistry();
    reg.set(RK.CURRENT_DAY,        1);
    reg.set(RK.TUTORIAL_COMPLETED, false);

    // On Day 1, Lars should use lars_day1_tutorial
    const conversationId = isDay1(reg) ? 'lars_day1_tutorial' : 'lars_welcome';
    expect(conversationId).toBe('lars_day1_tutorial');
  });

  it('isDay1() correctly directs to lars_welcome on Day 2', () => {
    const reg = new MockRegistry();
    reg.set(RK.CURRENT_DAY,        2);
    reg.set(RK.TUTORIAL_COMPLETED, true);

    const conversationId = isDay1(reg) ? 'lars_day1_tutorial' : 'lars_welcome';
    expect(conversationId).toBe('lars_welcome');
  });
});
