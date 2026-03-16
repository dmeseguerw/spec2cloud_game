/**
 * tests/systems/NPCMemory.test.js
 * Unit and integration tests for NPCMemory.
 * Coverage target: ≥85% of src/systems/NPCMemory.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  recordInteraction,
  getInteractionHistory,
  hasMetNPC,
  getLastInteraction,
} from '../../src/systems/NPCMemory.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry() {
  return new MockRegistry();
}

// ─────────────────────────────────────────────────────────────────────────────
// hasMetNPC — first meeting check
// ─────────────────────────────────────────────────────────────────────────────

describe('hasMetNPC', () => {
  it('returns false when NPC has never been interacted with', () => {
    const registry = createRegistry();
    expect(hasMetNPC(registry, 'lars')).toBe(false);
  });

  it('returns true after first interaction is recorded', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'lars', 'greeting', 'positive');
    expect(hasMetNPC(registry, 'lars')).toBe(true);
  });

  it('remains false for other NPCs when only one NPC is met', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'lars', 'greeting', 'positive');
    expect(hasMetNPC(registry, 'sofie')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// recordInteraction
// ─────────────────────────────────────────────────────────────────────────────

describe('recordInteraction', () => {
  it('returns the recorded entry with type and outcome', () => {
    const registry = createRegistry();
    const entry = recordInteraction(registry, 'lars', 'dialogue', 'positive');
    expect(entry).toMatchObject({ type: 'dialogue', outcome: 'positive' });
  });

  it('records a timestamp on each entry', () => {
    const registry = createRegistry();
    const before = Date.now();
    const entry = recordInteraction(registry, 'lars', 'dialogue', 'neutral');
    const after = Date.now();
    expect(entry.timestamp).toBeGreaterThanOrEqual(before);
    expect(entry.timestamp).toBeLessThanOrEqual(after);
  });

  it('stores interaction in registry under NPC_MEMORY key', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'henrik', 'quest', 'positive');
    const memory = registry.get(RK.NPC_MEMORY);
    expect(memory).toBeDefined();
    expect(memory.henrik).toBeDefined();
    expect(memory.henrik).toHaveLength(1);
  });

  it('accumulates multiple interactions for the same NPC', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'mette', 'greeting', 'positive');
    recordInteraction(registry, 'mette', 'purchase', 'neutral');
    recordInteraction(registry, 'mette', 'dialogue', 'positive');

    const history = getInteractionHistory(registry, 'mette');
    expect(history).toHaveLength(3);
  });

  it('stores interactions for multiple NPCs independently', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'lars', 'greeting', 'positive');
    recordInteraction(registry, 'sofie', 'dialogue', 'neutral');
    recordInteraction(registry, 'henrik', 'work', 'positive');

    expect(getInteractionHistory(registry, 'lars')).toHaveLength(1);
    expect(getInteractionHistory(registry, 'sofie')).toHaveLength(1);
    expect(getInteractionHistory(registry, 'henrik')).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getInteractionHistory
// ─────────────────────────────────────────────────────────────────────────────

describe('getInteractionHistory', () => {
  it('returns empty array for NPC with no interactions', () => {
    const registry = createRegistry();
    expect(getInteractionHistory(registry, 'kasper')).toEqual([]);
  });

  it('returns entries in insertion order (oldest first)', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'emma', 'first', 'positive');
    recordInteraction(registry, 'emma', 'second', 'neutral');
    recordInteraction(registry, 'emma', 'third', 'negative');

    const history = getInteractionHistory(registry, 'emma');
    expect(history[0].type).toBe('first');
    expect(history[1].type).toBe('second');
    expect(history[2].type).toBe('third');
  });

  it('returns a copy of the history (not the internal array)', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'thomas', 'dialogue', 'negative');
    const hist1 = getInteractionHistory(registry, 'thomas');
    hist1.push({ type: 'injected', outcome: 'positive', timestamp: 0 });

    const hist2 = getInteractionHistory(registry, 'thomas');
    expect(hist2).toHaveLength(1); // original unchanged
  });

  it('returns all fields per entry', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'freja', 'party', 'positive');
    const [entry] = getInteractionHistory(registry, 'freja');
    expect(entry).toHaveProperty('type', 'party');
    expect(entry).toHaveProperty('outcome', 'positive');
    expect(entry).toHaveProperty('timestamp');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getLastInteraction
// ─────────────────────────────────────────────────────────────────────────────

describe('getLastInteraction', () => {
  it('returns null for NPC with no interactions', () => {
    const registry = createRegistry();
    expect(getLastInteraction(registry, 'bjorn')).toBeNull();
  });

  it('returns the most recent interaction entry', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'bjorn', 'paperwork', 'neutral');
    recordInteraction(registry, 'bjorn', 'approval', 'positive');

    const last = getLastInteraction(registry, 'bjorn');
    expect(last.type).toBe('approval');
    expect(last.outcome).toBe('positive');
  });

  it('returns the single entry when only one interaction exists', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'dr_jensen', 'checkup', 'neutral');

    const last = getLastInteraction(registry, 'dr_jensen');
    expect(last.type).toBe('checkup');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: memory persists across simulated save/load (registry re-read)
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration: NPC memory persists across registry reads', () => {
  it('interactions recorded before and after other registry operations are retained', () => {
    const registry = createRegistry();

    recordInteraction(registry, 'lars', 'day1_greeting', 'positive');

    // Simulate other registry activity
    registry.set(RK.PLAYER_XP, 100);
    registry.set(RK.CURRENT_DAY, 2);

    recordInteraction(registry, 'lars', 'day2_dialogue', 'neutral');

    const history = getInteractionHistory(registry, 'lars');
    expect(history).toHaveLength(2);
    expect(history[0].type).toBe('day1_greeting');
    expect(history[1].type).toBe('day2_dialogue');
  });

  it('hasMetNPC reflects state after multiple sessions on same registry', () => {
    const registry = createRegistry();
    expect(hasMetNPC(registry, 'sofie')).toBe(false);

    recordInteraction(registry, 'sofie', 'introduction', 'positive');
    expect(hasMetNPC(registry, 'sofie')).toBe(true);

    // Further interactions don't break the check
    recordInteraction(registry, 'sofie', 'follow_up', 'positive');
    expect(hasMetNPC(registry, 'sofie')).toBe(true);
  });

  it('different NPCs maintain independent histories', () => {
    const registry = createRegistry();
    recordInteraction(registry, 'kasper', 'bike_ride', 'positive');
    recordInteraction(registry, 'kasper', 'race', 'positive');
    recordInteraction(registry, 'emma', 'study', 'neutral');

    expect(getInteractionHistory(registry, 'kasper')).toHaveLength(2);
    expect(getInteractionHistory(registry, 'emma')).toHaveLength(1);
    expect(getInteractionHistory(registry, 'mette')).toHaveLength(0);
  });
});
