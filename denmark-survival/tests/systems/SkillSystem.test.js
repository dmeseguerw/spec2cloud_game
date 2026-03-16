/**
 * tests/systems/SkillSystem.test.js
 * Unit tests for SkillSystem.
 * Coverage target: ≥85% of src/systems/SkillSystem.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  getSkillLevel,
  incrementSkill,
  checkSkillRequirement,
  SKILL_KEYS,
} from '../../src/systems/SkillSystem.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { SKILL_CHANGED } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry(overrides = {}) {
  const registry = new MockRegistry();
  for (const [k, v] of Object.entries(overrides)) {
    registry.set(k, v);
  }
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// SKILL_KEYS export
// ─────────────────────────────────────────────────────────────────────────────

describe('SKILL_KEYS', () => {
  it('exports 4 skill keys', () => {
    expect(SKILL_KEYS).toHaveLength(4);
  });

  it('includes all expected skill registry keys', () => {
    expect(SKILL_KEYS).toContain(RK.SKILL_LANGUAGE);
    expect(SKILL_KEYS).toContain(RK.SKILL_CYCLING);
    expect(SKILL_KEYS).toContain(RK.SKILL_CULTURAL);
    expect(SKILL_KEYS).toContain(RK.SKILL_BUREAUCRACY);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getSkillLevel — 5 threshold ranges
// ─────────────────────────────────────────────────────────────────────────────

describe('getSkillLevel — skill level derivation from value 0-100', () => {
  it('returns level 1 for value 0', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 0 });
    expect(getSkillLevel(registry, RK.SKILL_LANGUAGE)).toBe(1);
  });

  it('returns level 1 for values 0-19', () => {
    for (const val of [0, 1, 10, 19]) {
      const r = createRegistry({ [RK.SKILL_LANGUAGE]: val });
      expect(getSkillLevel(r, RK.SKILL_LANGUAGE)).toBe(1);
    }
  });

  it('returns level 2 for values 20-39', () => {
    for (const val of [20, 25, 39]) {
      const r = createRegistry({ [RK.SKILL_CYCLING]: val });
      expect(getSkillLevel(r, RK.SKILL_CYCLING)).toBe(2);
    }
  });

  it('returns level 3 for values 40-59', () => {
    for (const val of [40, 50, 59]) {
      const r = createRegistry({ [RK.SKILL_CULTURAL]: val });
      expect(getSkillLevel(r, RK.SKILL_CULTURAL)).toBe(3);
    }
  });

  it('returns level 4 for values 60-79', () => {
    for (const val of [60, 70, 79]) {
      const r = createRegistry({ [RK.SKILL_BUREAUCRACY]: val });
      expect(getSkillLevel(r, RK.SKILL_BUREAUCRACY)).toBe(4);
    }
  });

  it('returns level 5 for values 80-100', () => {
    for (const val of [80, 90, 100]) {
      const r = createRegistry({ [RK.SKILL_LANGUAGE]: val });
      expect(getSkillLevel(r, RK.SKILL_LANGUAGE)).toBe(5);
    }
  });

  it('defaults to level 1 when skill is not set in registry', () => {
    const registry = createRegistry();
    expect(getSkillLevel(registry, RK.SKILL_LANGUAGE)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// incrementSkill
// ─────────────────────────────────────────────────────────────────────────────

describe('incrementSkill', () => {
  it('increases the skill value in the registry', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 10 });
    incrementSkill(registry, RK.SKILL_LANGUAGE, 15);
    expect(registry.get(RK.SKILL_LANGUAGE)).toBe(25);
  });

  it('clamps skill value to 100', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 95 });
    incrementSkill(registry, RK.SKILL_LANGUAGE, 20);
    expect(registry.get(RK.SKILL_LANGUAGE)).toBe(100);
  });

  it('emits SKILL_CHANGED event when skill level changes', () => {
    const registry = createRegistry({ [RK.SKILL_CYCLING]: 15 });
    const handler  = vi.fn();
    registry.events.on(SKILL_CHANGED, handler);

    incrementSkill(registry, RK.SKILL_CYCLING, 10); // 15 → 25 (level 1 → 2)

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.skillKey).toBe(RK.SKILL_CYCLING);
    expect(payload.oldLevel).toBe(1);
    expect(payload.newLevel).toBe(2);
  });

  it('does NOT emit SKILL_CHANGED when level stays the same', () => {
    const registry = createRegistry({ [RK.SKILL_CYCLING]: 10 });
    const handler  = vi.fn();
    registry.events.on(SKILL_CHANGED, handler);

    incrementSkill(registry, RK.SKILL_CYCLING, 5); // 10 → 15, still level 1

    expect(handler).not.toHaveBeenCalled();
  });

  it('returns correct result shape on level change', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 15 });
    const result   = incrementSkill(registry, RK.SKILL_LANGUAGE, 10);
    expect(result).toMatchObject({ newValue: 25, newLevel: 2, levelChanged: true });
  });

  it('returns levelChanged=false when level stays the same', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 10 });
    const result   = incrementSkill(registry, RK.SKILL_LANGUAGE, 5);
    expect(result.levelChanged).toBe(false);
  });

  it('ignores zero or negative increment', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 30 });
    const handler  = vi.fn();
    registry.events.on(SKILL_CHANGED, handler);

    incrementSkill(registry, RK.SKILL_LANGUAGE, 0);
    incrementSkill(registry, RK.SKILL_LANGUAGE, -5);

    expect(registry.get(RK.SKILL_LANGUAGE)).toBe(30);
    expect(handler).not.toHaveBeenCalled();
  });

  it('crossing from level 4 to 5 emits correct SKILL_CHANGED payload', () => {
    const registry = createRegistry({ [RK.SKILL_BUREAUCRACY]: 75 });
    const handler  = vi.fn();
    registry.events.on(SKILL_CHANGED, handler);

    incrementSkill(registry, RK.SKILL_BUREAUCRACY, 10); // 75 → 85, level 4 → 5

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.oldLevel).toBe(4);
    expect(payload.newLevel).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkSkillRequirement
// ─────────────────────────────────────────────────────────────────────────────

describe('checkSkillRequirement', () => {
  it('returns true when skill level meets required level', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 50 }); // level 3
    expect(checkSkillRequirement(registry, RK.SKILL_LANGUAGE, 3)).toBe(true);
    expect(checkSkillRequirement(registry, RK.SKILL_LANGUAGE, 2)).toBe(true);
    expect(checkSkillRequirement(registry, RK.SKILL_LANGUAGE, 1)).toBe(true);
  });

  it('returns false when skill level is below required level', () => {
    const registry = createRegistry({ [RK.SKILL_LANGUAGE]: 30 }); // level 2
    expect(checkSkillRequirement(registry, RK.SKILL_LANGUAGE, 3)).toBe(false);
    expect(checkSkillRequirement(registry, RK.SKILL_LANGUAGE, 4)).toBe(false);
    expect(checkSkillRequirement(registry, RK.SKILL_LANGUAGE, 5)).toBe(false);
  });

  it('returns true for level 5 requirement when skill is maxed out', () => {
    const registry = createRegistry({ [RK.SKILL_CYCLING]: 100 });
    expect(checkSkillRequirement(registry, RK.SKILL_CYCLING, 5)).toBe(true);
  });

  it('returns false for unset skill requiring level 2+', () => {
    const registry = createRegistry();
    expect(checkSkillRequirement(registry, RK.SKILL_CULTURAL, 2)).toBe(false);
  });
});
