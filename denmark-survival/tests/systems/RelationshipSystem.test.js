/**
 * tests/systems/RelationshipSystem.test.js
 * Unit and integration tests for RelationshipSystem.
 * Coverage target: ≥85% of src/systems/RelationshipSystem.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  getRelationship,
  changeRelationship,
  getRelationshipStage,
  checkStageTransition,
  getAvailableNPCsAtLocation,
  RELATIONSHIP_STAGES,
  XP_STAGE_UP,
  XP_POSITIVE_INTERACTION,
  XP_NEGATIVE_INTERACTION,
} from '../../src/systems/RelationshipSystem.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { RELATIONSHIP_CHANGED, RELATIONSHIP_STAGE_CHANGED } from '../../src/constants/Events.js';
import { NPCS } from '../../src/data/npcs.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Create a fresh registry, pre-seeded with level 1 / 0 XP for XP events. */
function createRegistry(relMap = {}) {
  const registry = new MockRegistry();
  registry.set(RK.PLAYER_XP, 0);
  registry.set(RK.PLAYER_LEVEL, 1);
  if (Object.keys(relMap).length > 0) {
    registry.set(RK.NPC_RELATIONSHIPS, relMap);
  }
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// RELATIONSHIP_STAGES export
// ─────────────────────────────────────────────────────────────────────────────

describe('RELATIONSHIP_STAGES', () => {
  it('exports 5 stage entries', () => {
    expect(RELATIONSHIP_STAGES).toHaveLength(5);
  });

  it('stages cover full range 0–100 without gaps', () => {
    const stages = [...RELATIONSHIP_STAGES].sort((a, b) => a.min - b.min);
    expect(stages[0].min).toBe(0);
    expect(stages[stages.length - 1].max).toBe(100);
    for (let i = 1; i < stages.length; i++) {
      expect(stages[i].min).toBe(stages[i - 1].max + 1);
    }
  });

  it('contains named stages: Stranger, Acquaintance, Friendly, Friend, Close Friend', () => {
    const names = RELATIONSHIP_STAGES.map(s => s.name);
    expect(names).toContain('Stranger');
    expect(names).toContain('Acquaintance');
    expect(names).toContain('Friendly');
    expect(names).toContain('Friend');
    expect(names).toContain('Close Friend');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getRelationship — initial / fallback values
// ─────────────────────────────────────────────────────────────────────────────

describe('getRelationship — initial values', () => {
  it('returns startingRelationship from NPC data when not yet in registry', () => {
    const registry = createRegistry();
    // lars startingRelationship = 40
    expect(getRelationship(registry, 'lars')).toBe(40);
  });

  it('returns overridden value when relationship is stored in registry', () => {
    const registry = createRegistry({ lars: 60 });
    expect(getRelationship(registry, 'lars')).toBe(60);
  });

  it('returns 0 for unknown NPC id not in registry', () => {
    const registry = createRegistry();
    expect(getRelationship(registry, 'ghost_npc')).toBe(0);
  });

  it('returns starting relationships for all 10 NPCs from NPC data', () => {
    const registry = createRegistry();
    for (const npc of NPCS) {
      expect(getRelationship(registry, npc.id)).toBe(npc.startingRelationship);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getRelationshipStage — stage derivation
// ─────────────────────────────────────────────────────────────────────────────

describe('getRelationshipStage — stage derivation for all 5 ranges', () => {
  const cases = [
    { value: 0,   expected: 'Stranger' },
    { value: 10,  expected: 'Stranger' },
    { value: 19,  expected: 'Stranger' },
    { value: 20,  expected: 'Acquaintance' },
    { value: 39,  expected: 'Acquaintance' },
    { value: 40,  expected: 'Friendly' },
    { value: 59,  expected: 'Friendly' },
    { value: 60,  expected: 'Friend' },
    { value: 79,  expected: 'Friend' },
    { value: 80,  expected: 'Close Friend' },
    { value: 100, expected: 'Close Friend' },
  ];

  for (const { value, expected } of cases) {
    it(`value ${value} → stage "${expected}"`, () => {
      const registry = createRegistry({ test_npc: value });
      expect(getRelationshipStage(registry, 'test_npc')).toBe(expected);
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// changeRelationship — clamping
// ─────────────────────────────────────────────────────────────────────────────

describe('changeRelationship — clamping', () => {
  it('clamps at 100 when delta pushes value above max', () => {
    const registry = createRegistry({ test_npc: 95 });
    const result = changeRelationship(registry, 'test_npc', 20);
    expect(result.newValue).toBe(100);
    expect(getRelationship(registry, 'test_npc')).toBe(100);
  });

  it('clamps at 0 when delta pushes value below min', () => {
    const registry = createRegistry({ test_npc: 5 });
    const result = changeRelationship(registry, 'test_npc', -20);
    expect(result.newValue).toBe(0);
    expect(getRelationship(registry, 'test_npc')).toBe(0);
  });

  it('handles zero delta without error', () => {
    const registry = createRegistry({ test_npc: 30 });
    const result = changeRelationship(registry, 'test_npc', 0);
    expect(result.newValue).toBe(30);
    expect(result.stageChanged).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// changeRelationship — event emission
// ─────────────────────────────────────────────────────────────────────────────

describe('changeRelationship — event emission', () => {
  it('emits RELATIONSHIP_CHANGED on positive delta', () => {
    const registry = createRegistry({ test_npc: 30 });
    const handler = vi.fn();
    registry.events.on(RELATIONSHIP_CHANGED, handler);

    changeRelationship(registry, 'test_npc', 5, 'chat');

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.npcId).toBe('test_npc');
    expect(payload.delta).toBe(5);
    expect(payload.reason).toBe('chat');
  });

  it('emits RELATIONSHIP_CHANGED on negative delta', () => {
    const registry = createRegistry({ test_npc: 50 });
    const handler = vi.fn();
    registry.events.on(RELATIONSHIP_CHANGED, handler);

    changeRelationship(registry, 'test_npc', -10, 'rude');

    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits RELATIONSHIP_STAGE_CHANGED when crossing stage boundary upward', () => {
    const registry = createRegistry({ test_npc: 18 }); // Stranger → Acquaintance
    const stageHandler = vi.fn();
    registry.events.on(RELATIONSHIP_STAGE_CHANGED, stageHandler);

    changeRelationship(registry, 'test_npc', 5); // 18 → 23

    expect(stageHandler).toHaveBeenCalledOnce();
    const payload = stageHandler.mock.calls[0][0];
    expect(payload.oldStage).toBe('Stranger');
    expect(payload.newStage).toBe('Acquaintance');
  });

  it('emits RELATIONSHIP_STAGE_CHANGED when crossing stage boundary downward', () => {
    const registry = createRegistry({ test_npc: 21 }); // Acquaintance → Stranger
    const stageHandler = vi.fn();
    registry.events.on(RELATIONSHIP_STAGE_CHANGED, stageHandler);

    changeRelationship(registry, 'test_npc', -5); // 21 → 16

    expect(stageHandler).toHaveBeenCalledOnce();
    const payload = stageHandler.mock.calls[0][0];
    expect(payload.oldStage).toBe('Acquaintance');
    expect(payload.newStage).toBe('Stranger');
  });

  it('does NOT emit RELATIONSHIP_STAGE_CHANGED when no stage boundary crossed', () => {
    const registry = createRegistry({ test_npc: 25 }); // stays Acquaintance
    const stageHandler = vi.fn();
    registry.events.on(RELATIONSHIP_STAGE_CHANGED, stageHandler);

    changeRelationship(registry, 'test_npc', 5); // 25 → 30, still Acquaintance

    expect(stageHandler).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// changeRelationship — return value
// ─────────────────────────────────────────────────────────────────────────────

describe('changeRelationship — return value', () => {
  it('returns correct result shape with stageChanged=false', () => {
    const registry = createRegistry({ test_npc: 30 });
    const result = changeRelationship(registry, 'test_npc', 5);
    expect(result).toMatchObject({
      newValue: 35,
      stageChanged: false,
      oldStage: 'Acquaintance',
      newStage: 'Acquaintance',
    });
  });

  it('returns stageChanged=true when crossing a boundary', () => {
    const registry = createRegistry({ test_npc: 38 });
    const result = changeRelationship(registry, 'test_npc', 5); // 38 → 43
    expect(result.stageChanged).toBe(true);
    expect(result.oldStage).toBe('Acquaintance');
    expect(result.newStage).toBe('Friendly');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkStageTransition
// ─────────────────────────────────────────────────────────────────────────────

describe('checkStageTransition', () => {
  it('returns current stage and value without modifying registry', () => {
    const registry = createRegistry({ test_npc: 55 });
    const before = getRelationship(registry, 'test_npc');
    const result = checkStageTransition(registry, 'test_npc');
    expect(result.stage).toBe('Friendly');
    expect(result.value).toBe(55);
    expect(getRelationship(registry, 'test_npc')).toBe(before);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getAvailableNPCsAtLocation — schedule system
// ─────────────────────────────────────────────────────────────────────────────

describe('getAvailableNPCsAtLocation', () => {
  it('returns Henrik and Mette in morning at their work locations', () => {
    const registry = createRegistry();
    const workNPCs = getAvailableNPCsAtLocation(registry, 'workplace', 'morning');
    const ids = workNPCs.map(n => n.id);
    expect(ids).toContain('henrik');
  });

  it('returns Mette at grocery_store in morning', () => {
    const registry = createRegistry();
    const npcs = getAvailableNPCsAtLocation(registry, 'grocery_store', 'morning');
    const ids = npcs.map(n => n.id);
    expect(ids).toContain('mette');
  });

  it('returns Kasper at bike_lane in afternoon', () => {
    const registry = createRegistry();
    const npcs = getAvailableNPCsAtLocation(registry, 'bike_lane', 'afternoon');
    const ids = npcs.map(n => n.id);
    expect(ids).toContain('kasper');
  });

  it('returns Freja at cafe in evening', () => {
    const registry = createRegistry();
    const npcs = getAvailableNPCsAtLocation(registry, 'cafe', 'evening');
    const ids = npcs.map(n => n.id);
    expect(ids).toContain('freja');
  });

  it('returns Lars at apartment_area in evening', () => {
    const registry = createRegistry();
    const npcs = getAvailableNPCsAtLocation(registry, 'apartment_area', 'evening');
    const ids = npcs.map(n => n.id);
    expect(ids).toContain('lars');
  });

  it('returns empty array at night for any location (all NPCs unavailable)', () => {
    const registry = createRegistry();
    const anyNight = getAvailableNPCsAtLocation(registry, 'cafe', 'night');
    expect(anyNight).toHaveLength(0);
  });

  it('returns empty array for an unknown location', () => {
    const registry = createRegistry();
    const result = getAvailableNPCsAtLocation(registry, 'unknown_place', 'morning');
    expect(result).toHaveLength(0);
  });

  it('returns NPC objects with full data (not just ids)', () => {
    const registry = createRegistry();
    const npcs = getAvailableNPCsAtLocation(registry, 'grocery_store', 'morning');
    expect(npcs.length).toBeGreaterThan(0);
    expect(npcs[0]).toHaveProperty('id');
    expect(npcs[0]).toHaveProperty('name');
    expect(npcs[0]).toHaveProperty('schedule');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: relationship change → stage transition → XP granted → event emitted
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration: changeRelationship → stage transition → XP granted → events emitted', () => {
  it('grants XP_POSITIVE_INTERACTION on any positive delta', () => {
    const registry = createRegistry({ test_npc: 25 });
    const initialXP = 0;

    changeRelationship(registry, 'test_npc', 3, 'friendly chat');

    const newXP = registry.get(RK.PLAYER_XP);
    expect(newXP).toBeGreaterThan(initialXP);
  });

  it('penalizes XP on negative delta', () => {
    const registry = createRegistry({ test_npc: 50 });
    registry.set(RK.PLAYER_XP, 100);

    changeRelationship(registry, 'test_npc', -5, 'rude');

    const newXP = registry.get(RK.PLAYER_XP);
    expect(newXP).toBeLessThan(100);
  });

  it('stage transition up grants XP_STAGE_UP in addition to interaction XP', () => {
    const registry = createRegistry({ test_npc: 18 }); // Stranger (18)
    const xpHandler = vi.fn();
    registry.events.on('xp_changed', xpHandler);

    changeRelationship(registry, 'test_npc', 5); // → 23, crosses to Acquaintance

    // Two XP events: positive interaction + stage up
    expect(xpHandler.mock.calls.length).toBeGreaterThanOrEqual(2);
    const totalXP = xpHandler.mock.calls.reduce((sum, [payload]) => sum + payload.amount, 0);
    expect(totalXP).toBe(XP_POSITIVE_INTERACTION + XP_STAGE_UP);
  });

  it('relationship data persists across multiple registry reads', () => {
    const registry = createRegistry();
    changeRelationship(registry, 'lars', 10); // 40 → 50
    changeRelationship(registry, 'lars', 5);  // 50 → 55

    expect(getRelationship(registry, 'lars')).toBe(55);
    expect(getRelationshipStage(registry, 'lars')).toBe('Friendly');
  });

  it('full milestone: Stranger → Close Friend emits 4 stage-changed events', () => {
    const registry = createRegistry({ milestone_npc: 10 });
    const stageEvents = [];
    registry.events.on(RELATIONSHIP_STAGE_CHANGED, (payload) => {
      stageEvents.push({ ...payload });
    });

    // Stranger → Acquaintance
    changeRelationship(registry, 'milestone_npc', 15); // 10 → 25
    // Acquaintance → Friendly
    changeRelationship(registry, 'milestone_npc', 20); // 25 → 45
    // Friendly → Friend
    changeRelationship(registry, 'milestone_npc', 20); // 45 → 65
    // Friend → Close Friend
    changeRelationship(registry, 'milestone_npc', 20); // 65 → 85

    expect(stageEvents).toHaveLength(4);
    expect(stageEvents[0].newStage).toBe('Acquaintance');
    expect(stageEvents[1].newStage).toBe('Friendly');
    expect(stageEvents[2].newStage).toBe('Friend');
    expect(stageEvents[3].newStage).toBe('Close Friend');
  });
});
