/**
 * tests/systems/XPEngine.test.js
 * Unit and integration tests for XPEngine.
 * Coverage target: ≥85% of src/systems/XPEngine.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  grantXP,
  penalizeXP,
  calculateLevel,
  getPhaseForLevel,
  onDayAdvance,
  getConsecutiveNegativeDays,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
  GAME_OVER_WARNING_THRESHOLD,
  GAME_OVER_FLOOR,
  XP_LOSS_REDUCTION_LEVEL,
  ADAPTIVE_MODIFIER_KEY,
} from '../../src/systems/XPEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { XP_CHANGED, LEVEL_UP } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Create a fresh registry pre-seeded with level 1, 0 XP. */
function createRegistry(xp = 0, level = 1) {
  const registry = new MockRegistry();
  registry.set(RK.PLAYER_XP,    xp);
  registry.set(RK.PLAYER_LEVEL, level);
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// calculateLevel
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateLevel — threshold table', () => {
  it('returns level 1 for negative XP', () => {
    expect(calculateLevel(-50)).toBe(1);
    expect(calculateLevel(-500)).toBe(1);
  });

  it('returns level 1 at XP = 0', () => {
    expect(calculateLevel(0)).toBe(1);
  });

  // Test every threshold boundary defined in LEVEL_THRESHOLDS
  for (let lvl = 2; lvl <= MAX_LEVEL; lvl++) {
    const threshold = LEVEL_THRESHOLDS[lvl];
    it(`returns level ${lvl} at XP = ${threshold}`, () => {
      expect(calculateLevel(threshold)).toBe(lvl);
    });
    it(`returns level ${lvl - 1} at XP = ${threshold - 1}`, () => {
      expect(calculateLevel(threshold - 1)).toBe(lvl - 1);
    });
  }

  it('caps at MAX_LEVEL for XP beyond level 20 threshold', () => {
    expect(calculateLevel(99999)).toBe(MAX_LEVEL);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPhaseForLevel — phase boundaries
// ─────────────────────────────────────────────────────────────────────────────

describe('getPhaseForLevel — phase transitions', () => {
  it('levels 1-5 are Newcomer', () => {
    for (let lvl = 1; lvl <= 5; lvl++) {
      expect(getPhaseForLevel(lvl)).toBe('Newcomer');
    }
  });

  it('levels 6-10 are Adapter', () => {
    for (let lvl = 6; lvl <= 10; lvl++) {
      expect(getPhaseForLevel(lvl)).toBe('Adapter');
    }
  });

  it('levels 11-15 are Resident', () => {
    for (let lvl = 11; lvl <= 15; lvl++) {
      expect(getPhaseForLevel(lvl)).toBe('Resident');
    }
  });

  it('levels 16-19 are Local', () => {
    for (let lvl = 16; lvl <= 19; lvl++) {
      expect(getPhaseForLevel(lvl)).toBe('Local');
    }
  });

  it('level 20 is Honorary Dane', () => {
    expect(getPhaseForLevel(20)).toBe('Honorary Dane');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// grantXP
// ─────────────────────────────────────────────────────────────────────────────

describe('grantXP', () => {
  it('adds XP to registry', () => {
    const registry = createRegistry(0);
    grantXP(registry, 30, 'test');
    expect(registry.get(RK.PLAYER_XP)).toBe(30);
  });

  it('emits XP_CHANGED with correct payload', () => {
    const registry = createRegistry(0);
    const handler  = vi.fn();
    registry.events.on(XP_CHANGED, handler);

    grantXP(registry, 20, 'Bike ride', 'Transportation');

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.amount).toBe(20);
    expect(payload.newTotal).toBe(20);
    expect(payload.source).toBe('Bike ride');
    expect(payload.category).toBe('Transportation');
  });

  it('ignores zero or negative amounts', () => {
    const registry = createRegistry(100);
    const handler  = vi.fn();
    registry.events.on(XP_CHANGED, handler);

    grantXP(registry, 0, 'nothing');
    grantXP(registry, -10, 'negative');

    expect(registry.get(RK.PLAYER_XP)).toBe(100);
    expect(handler).not.toHaveBeenCalled();
  });

  it('fires LEVEL_UP event when XP crosses level threshold', () => {
    const registry = createRegistry(490);  // just below level 6 (500)
    const handler  = vi.fn();
    registry.events.on(LEVEL_UP, handler);

    grantXP(registry, 20, 'culture', 'Cultural');

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.newLevel).toBe(6);
    expect(payload.phase).toBe('Adapter');
    expect(payload.phaseChanged).toBe(true);
  });

  it('does NOT fire LEVEL_UP when level remains the same', () => {
    const registry = createRegistry(0);
    const handler  = vi.fn();
    registry.events.on(LEVEL_UP, handler);

    grantXP(registry, 10, 'small gain');

    expect(handler).not.toHaveBeenCalled();
  });

  it('updates PLAYER_LEVEL and CURRENT_PHASE in registry on level-up', () => {
    const registry = createRegistry(480);
    grantXP(registry, 30, 'culture');
    expect(registry.get(RK.PLAYER_LEVEL)).toBe(6);
    expect(registry.get(RK.CURRENT_PHASE)).toBe('Adapter');
  });

  it('returns correct result shape', () => {
    const registry = createRegistry(0);
    const result   = grantXP(registry, 10, 'test');
    expect(result).toMatchObject({ newXP: 10, newLevel: 1, leveledUp: false });
  });

  it('returns leveledUp=true when level increases', () => {
    const registry = createRegistry(490);
    const result   = grantXP(registry, 20, 'test');
    expect(result.leveledUp).toBe(true);
    expect(result.newLevel).toBe(6);
  });

  it('applies adaptive difficulty bonus (+25%)', () => {
    const registry = createRegistry(0);
    registry.set(ADAPTIVE_MODIFIER_KEY, 1.25);
    grantXP(registry, 20, 'test');
    expect(registry.get(RK.PLAYER_XP)).toBe(25); // 20 * 1.25 = 25
  });

  it('accumulates XP across multiple calls', () => {
    const registry = createRegistry(0);
    grantXP(registry, 10, 'a');
    grantXP(registry, 10, 'b');
    grantXP(registry, 10, 'c');
    expect(registry.get(RK.PLAYER_XP)).toBe(30);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// penalizeXP
// ─────────────────────────────────────────────────────────────────────────────

describe('penalizeXP', () => {
  it('subtracts XP from registry', () => {
    const registry = createRegistry(100);
    penalizeXP(registry, 30, 'mistake');
    expect(registry.get(RK.PLAYER_XP)).toBe(70);
  });

  it('emits XP_CHANGED with negative amount', () => {
    const registry = createRegistry(100);
    const handler  = vi.fn();
    registry.events.on(XP_CHANGED, handler);

    penalizeXP(registry, 20, 'fine', 'Financial');

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.amount).toBe(-20);
    expect(payload.newTotal).toBe(80);
    expect(payload.category).toBe('Financial');
  });

  it('clamps XP to GAME_OVER_FLOOR (-500 by default)', () => {
    const registry = createRegistry(0);
    penalizeXP(registry, 1000, 'big loss');
    expect(registry.get(RK.PLAYER_XP)).toBe(GAME_OVER_FLOOR);
  });

  it('respects custom floor option', () => {
    const registry = createRegistry(0);
    penalizeXP(registry, 1000, 'big loss', '', { floor: -200 });
    expect(registry.get(RK.PLAYER_XP)).toBe(-200);
  });

  it('applies 50% XP loss reduction at level 16+', () => {
    const registry = createRegistry(3800, 16);
    penalizeXP(registry, 100, 'error', 'Financial');
    // 100 * 0.5 = 50 reduction
    expect(registry.get(RK.PLAYER_XP)).toBe(3750);
  });

  it('does NOT apply loss reduction below level 16', () => {
    const registry = createRegistry(200, 4);
    penalizeXP(registry, 50, 'error');
    expect(registry.get(RK.PLAYER_XP)).toBe(150);
  });

  it('emits game_over_warning when XP at or below -100', () => {
    const registry = createRegistry(GAME_OVER_WARNING_THRESHOLD + 1);
    const handler  = vi.fn();
    registry.events.on('game_over_warning', handler);

    penalizeXP(registry, 2, 'bad day');

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].xp).toBeLessThanOrEqual(GAME_OVER_WARNING_THRESHOLD);
  });

  it('does NOT emit game_over_warning when XP stays above -100', () => {
    const registry = createRegistry(50);
    const handler  = vi.fn();
    registry.events.on('game_over_warning', handler);

    penalizeXP(registry, 10, 'small loss');

    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores zero or negative amounts', () => {
    const registry = createRegistry(100);
    const handler  = vi.fn();
    registry.events.on(XP_CHANGED, handler);

    penalizeXP(registry, 0, 'nothing');
    penalizeXP(registry, -5, 'negative');

    expect(registry.get(RK.PLAYER_XP)).toBe(100);
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns correct result shape', () => {
    const registry = createRegistry(10); // 10 XP → level 1
    const result   = penalizeXP(registry, 5, 'test');
    expect(result).toMatchObject({ newXP: 5, newLevel: 1, gameOverWarning: false });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Adaptive Difficulty — onDayAdvance
// ─────────────────────────────────────────────────────────────────────────────

describe('onDayAdvance — adaptive difficulty', () => {
  it('increments consecutive negative day counter on negative day', () => {
    const registry = createRegistry();
    onDayAdvance(registry, true);
    expect(getConsecutiveNegativeDays(registry)).toBe(1);
    onDayAdvance(registry, true);
    expect(getConsecutiveNegativeDays(registry)).toBe(2);
  });

  it('resets counter on positive day', () => {
    const registry = createRegistry();
    onDayAdvance(registry, true);
    onDayAdvance(registry, true);
    onDayAdvance(registry, false);
    expect(getConsecutiveNegativeDays(registry)).toBe(0);
  });

  it('activates assist mode (1.25 modifier) after 3 consecutive negative days', () => {
    const registry = createRegistry();
    onDayAdvance(registry, true);
    onDayAdvance(registry, true);
    onDayAdvance(registry, true);
    expect(registry.get(ADAPTIVE_MODIFIER_KEY)).toBe(1.25);
  });

  it('keeps assist mode active on additional negative days', () => {
    const registry = createRegistry();
    for (let i = 0; i < 5; i++) onDayAdvance(registry, true);
    expect(registry.get(ADAPTIVE_MODIFIER_KEY)).toBe(1.25);
  });

  it('resets modifier to 1.0 after a positive day', () => {
    const registry = createRegistry();
    onDayAdvance(registry, true);
    onDayAdvance(registry, true);
    onDayAdvance(registry, true);
    onDayAdvance(registry, false);
    expect(registry.get(ADAPTIVE_MODIFIER_KEY)).toBe(1.0);
  });

  it('adaptive XP bonus applied in grantXP after assist mode activates', () => {
    const registry = createRegistry(0);
    onDayAdvance(registry, true);
    onDayAdvance(registry, true);
    onDayAdvance(registry, true);

    grantXP(registry, 20, 'task');
    // 20 * 1.25 = 25
    expect(registry.get(RK.PLAYER_XP)).toBe(25);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Game-over threshold
// ─────────────────────────────────────────────────────────────────────────────

describe('game-over threshold', () => {
  it('GAME_OVER_FLOOR is -500', () => {
    expect(GAME_OVER_FLOOR).toBe(-500);
  });

  it('GAME_OVER_WARNING_THRESHOLD is -100', () => {
    expect(GAME_OVER_WARNING_THRESHOLD).toBe(-100);
  });

  it('XP cannot go below GAME_OVER_FLOOR', () => {
    const registry = createRegistry(-499);
    penalizeXP(registry, 1000, 'catastrophe');
    expect(registry.get(RK.PLAYER_XP)).toBe(GAME_OVER_FLOOR);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// XP Loss Reduction Level constant
// ─────────────────────────────────────────────────────────────────────────────

describe('XP_LOSS_REDUCTION_LEVEL constant', () => {
  it('is 16', () => {
    expect(XP_LOSS_REDUCTION_LEVEL).toBe(16);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: full grant → level-up → phase update flow
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — grantXP → LEVEL_UP → phase update', () => {
  it('crossing level 6 threshold updates registry and emits LEVEL_UP with phase', () => {
    const registry = createRegistry(480);
    const levelUpHandler = vi.fn();
    registry.events.on(LEVEL_UP, levelUpHandler);

    grantXP(registry, 30, 'cultural event', 'Cultural');

    expect(registry.get(RK.PLAYER_LEVEL)).toBe(6);
    expect(registry.get(RK.CURRENT_PHASE)).toBe('Adapter');
    expect(levelUpHandler).toHaveBeenCalledOnce();
    const payload = levelUpHandler.mock.calls[0][0];
    expect(payload.phaseChanged).toBe(true);
  });

  it('multiple level-ups in one grantXP are handled correctly', () => {
    // Jump from 0 to 700 XP (should land at level 7)
    const registry = createRegistry(0);
    grantXP(registry, 700, 'big bonus');
    expect(registry.get(RK.PLAYER_LEVEL)).toBe(7);
    expect(registry.get(RK.CURRENT_PHASE)).toBe('Adapter');
  });

  it('LEVEL_UP fires exactly once per level change per call', () => {
    const registry = createRegistry(490);
    const handler  = vi.fn();
    registry.events.on(LEVEL_UP, handler);
    grantXP(registry, 20, 'bonus');
    // Should fire exactly once (level 5 → 6)
    expect(handler).toHaveBeenCalledTimes(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Default value branches — registry with no prior keys
// ─────────────────────────────────────────────────────────────────────────────

describe('Default registry values', () => {
  it('grantXP works on empty registry (defaults xp=0, level=1)', () => {
    const registry = new MockRegistry();  // no keys set
    const result   = grantXP(registry, 10, 'first action');
    expect(result.newXP).toBe(10);
    expect(result.newLevel).toBe(1);
  });

  it('penalizeXP works on empty registry (defaults xp=0, level=1)', () => {
    const registry = new MockRegistry();  // no keys set
    const result   = penalizeXP(registry, 5, 'first loss');
    expect(result.newXP).toBe(-5);
    expect(result.newLevel).toBe(1);
  });

  it('getConsecutiveNegativeDays returns 0 when key is not set', () => {
    const registry = new MockRegistry();
    expect(getConsecutiveNegativeDays(registry)).toBe(0);
  });

  it('grantXP uses adaptive modifier of 1.0 when key not set', () => {
    const registry = new MockRegistry();
    grantXP(registry, 10, 'test');
    expect(registry.get(RK.PLAYER_XP)).toBe(10);
  });
});
