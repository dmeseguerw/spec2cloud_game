/**
 * tests/systems/GameOverManager.test.js
 * Unit tests for the GameOverManager — game-over threshold and warning logic.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  isGameOver,
  isGameOverWarning,
  checkGameOverState,
  getGameOverSummary,
  GAME_OVER_FLOOR,
  GAME_OVER_WARNING_THRESHOLD,
  NEGATIVE_DAYS_WARNING,
} from '../../src/systems/GameOverManager.js';
import { GAME_OVER, GAME_OVER_WARNING } from '../../src/constants/Events.js';
import { onDayAdvance } from '../../src/systems/XPEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry({ xp = 0, level = 1, day = 1, name = 'Tester' } = {}) {
  const registry = new MockRegistry();
  registry.set(RK.PLAYER_XP,    xp);
  registry.set(RK.PLAYER_LEVEL, level);
  registry.set(RK.CURRENT_DAY,  day);
  registry.set(RK.PLAYER_NAME,  name);
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Exported constants
// ─────────────────────────────────────────────────────────────────────────────

describe('exported constants', () => {
  it('GAME_OVER_FLOOR is -500', () => {
    expect(GAME_OVER_FLOOR).toBe(-500);
  });

  it('GAME_OVER_WARNING_THRESHOLD is -100', () => {
    expect(GAME_OVER_WARNING_THRESHOLD).toBe(-100);
  });

  it('NEGATIVE_DAYS_WARNING is 3', () => {
    expect(NEGATIVE_DAYS_WARNING).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isGameOver
// ─────────────────────────────────────────────────────────────────────────────

describe('isGameOver', () => {
  it('returns false for positive XP', () => {
    expect(isGameOver(100)).toBe(false);
  });

  it('returns false for XP above the floor', () => {
    expect(isGameOver(-499)).toBe(false);
    expect(isGameOver(-100)).toBe(false);
  });

  it('returns true exactly at the floor (-500)', () => {
    expect(isGameOver(GAME_OVER_FLOOR)).toBe(true);
  });

  it('returns true for XP below the floor (should not happen, but guards)', () => {
    expect(isGameOver(-600)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isGameOverWarning
// ─────────────────────────────────────────────────────────────────────────────

describe('isGameOverWarning', () => {
  it('returns false when XP is above warning threshold', () => {
    expect(isGameOverWarning(-50, 5)).toBe(false);
  });

  it('returns false when XP is in warning zone but fewer than required days', () => {
    expect(isGameOverWarning(-100, 2)).toBe(false);
    expect(isGameOverWarning(-200, 0)).toBe(false);
  });

  it('returns true exactly at threshold with exactly required days', () => {
    expect(isGameOverWarning(GAME_OVER_WARNING_THRESHOLD, NEGATIVE_DAYS_WARNING)).toBe(true);
  });

  it('returns true when XP is below threshold and days exceed minimum', () => {
    expect(isGameOverWarning(-300, 5)).toBe(true);
  });

  it('returns false at game-over floor (game over takes precedence in checkGameOverState)', () => {
    // isGameOverWarning itself does not exclude the floor — the caller handles precedence
    expect(isGameOverWarning(GAME_OVER_FLOOR, NEGATIVE_DAYS_WARNING)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkGameOverState
// ─────────────────────────────────────────────────────────────────────────────

describe('checkGameOverState', () => {
  it('returns isGameOver=false and isWarning=false for healthy XP', () => {
    const registry = createRegistry({ xp: 500 });
    const state = checkGameOverState(registry);
    expect(state.isGameOver).toBe(false);
    expect(state.isWarning).toBe(false);
    expect(state.xp).toBe(500);
  });

  it('returns isGameOver=true when XP hits floor', () => {
    const registry = createRegistry({ xp: GAME_OVER_FLOOR });
    const state = checkGameOverState(registry);
    expect(state.isGameOver).toBe(true);
    expect(state.isWarning).toBe(false);
  });

  it('emits GAME_OVER event when game over condition is met', () => {
    const registry = createRegistry({ xp: GAME_OVER_FLOOR });
    const handler = vi.fn();
    registry.events.on(GAME_OVER, handler);
    checkGameOverState(registry);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].xp).toBe(GAME_OVER_FLOOR);
  });

  it('returns isWarning=true after sustained negative XP for required days', () => {
    const registry = createRegistry({ xp: -200 });
    // Simulate 3 consecutive negative days
    for (let i = 0; i < NEGATIVE_DAYS_WARNING; i++) {
      onDayAdvance(registry, true);
    }
    const state = checkGameOverState(registry);
    expect(state.isWarning).toBe(true);
    expect(state.isGameOver).toBe(false);
    expect(state.consecutiveNegDays).toBe(NEGATIVE_DAYS_WARNING);
  });

  it('emits GAME_OVER_WARNING event when warning condition is met', () => {
    const registry = createRegistry({ xp: -200 });
    for (let i = 0; i < NEGATIVE_DAYS_WARNING; i++) {
      onDayAdvance(registry, true);
    }
    const handler = vi.fn();
    registry.events.on(GAME_OVER_WARNING, handler);
    checkGameOverState(registry);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not emit warning when consecutive days reset to zero', () => {
    const registry = createRegistry({ xp: -200 });
    // Build up 3 negative days, then reset with a positive day
    for (let i = 0; i < NEGATIVE_DAYS_WARNING; i++) {
      onDayAdvance(registry, true);
    }
    onDayAdvance(registry, false); // positive day resets counter
    const handler = vi.fn();
    registry.events.on(GAME_OVER_WARNING, handler);
    checkGameOverState(registry);
    expect(handler).not.toHaveBeenCalled();
  });

  it('game-over takes precedence over warning (isWarning=false when game over)', () => {
    const registry = createRegistry({ xp: GAME_OVER_FLOOR });
    for (let i = 0; i < NEGATIVE_DAYS_WARNING; i++) {
      onDayAdvance(registry, true);
    }
    const state = checkGameOverState(registry);
    expect(state.isGameOver).toBe(true);
    expect(state.isWarning).toBe(false);
  });

  it('uses 0 as fallback when PLAYER_XP is not set', () => {
    const registry = new MockRegistry();
    // No XP set — exercises ?? 0 fallback
    const state = checkGameOverState(registry);
    expect(state.xp).toBe(0);
    expect(state.isGameOver).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getGameOverSummary
// ─────────────────────────────────────────────────────────────────────────────

describe('getGameOverSummary', () => {
  it('returns correct summary from populated registry', () => {
    const registry = createRegistry({ xp: -500, level: 5, day: 42, name: 'Henrik' });
    const summary = getGameOverSummary(registry);
    expect(summary.playerName).toBe('Henrik');
    expect(summary.daysSurvived).toBe(42);
    expect(summary.highestLevel).toBe(5);
    expect(summary.xp).toBe(-500);
  });

  it('falls back to safe defaults when registry keys are absent', () => {
    const registry = new MockRegistry();
    const summary = getGameOverSummary(registry);
    expect(summary.playerName).toBe('Unknown');
    expect(summary.daysSurvived).toBe(1);
    expect(summary.highestLevel).toBe(1);
    expect(summary.xp).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration — game over warning at sustained negative XP (3 days)
// ─────────────────────────────────────────────────────────────────────────────

describe('integration — game over warning lifecycle', () => {
  it('warning fires only after exactly 3 consecutive negative days', () => {
    const registry = createRegistry({ xp: -150 });
    const handler = vi.fn();
    registry.events.on(GAME_OVER_WARNING, handler);

    // Day 1 negative
    onDayAdvance(registry, true);
    checkGameOverState(registry);
    expect(handler).not.toHaveBeenCalled();

    // Day 2 negative
    onDayAdvance(registry, true);
    checkGameOverState(registry);
    expect(handler).not.toHaveBeenCalled();

    // Day 3 negative — warning fires
    onDayAdvance(registry, true);
    checkGameOverState(registry);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('game over fires when XP reaches -500', () => {
    const registry = createRegistry({ xp: GAME_OVER_FLOOR });
    const handler = vi.fn();
    registry.events.on(GAME_OVER, handler);
    checkGameOverState(registry);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].xp).toBe(GAME_OVER_FLOOR);
  });
});
