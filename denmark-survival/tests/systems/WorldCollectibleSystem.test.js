/**
 * tests/systems/WorldCollectibleSystem.test.js
 * Unit tests for WorldCollectibleSystem.
 * Coverage target: ≥85% of src/systems/WorldCollectibleSystem.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  MAX_COLLECTIBLES_PER_ZONE,
  XP_MIN,
  XP_MAX,
  getCollectedItems,
  isCollected,
  evaluateManifest,
  getPickupSound,
  getXPForItem,
  collectItem,
} from '../../src/systems/WorldCollectibleSystem.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  SFX_PICKUP_PANT,
  SFX_PICKUP_DOCUMENT,
  SFX_PICKUP_GENERAL,
} from '../../src/constants/AudioKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(options = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,   options.day       ?? 1);
  r.set(RK.PLAYER_XP,     options.xp        ?? 0);
  r.set(RK.PLAYER_LEVEL,  options.level     ?? 1);
  r.set(RK.PLAYER_MONEY,  options.money     ?? 0);
  r.set(RK.PLAYER_ENERGY, options.energy    ?? 100);
  r.set(RK.INVENTORY,     options.inventory ?? []);
  if (options.collected !== undefined) r.set(RK.COLLECTED_ITEMS, options.collected);
  return r;
}

/** Minimal valid collectible definition. */
function makeCollectible(overrides = {}) {
  return {
    id: 'test_item_1',
    itemId: 'coffee',
    x: 100,
    y: 200,
    quantity: 1,
    zone: 'TestZone',
    spriteKey: null,
    sparkle: false,
    tooltip: null,
    oneTime: false,
    ...overrides,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('WorldCollectibleSystem constants', () => {
  it('MAX_COLLECTIBLES_PER_ZONE is 5', () => {
    expect(MAX_COLLECTIBLES_PER_ZONE).toBe(5);
  });

  it('XP_MIN is 1', () => {
    expect(XP_MIN).toBe(1);
  });

  it('XP_MAX is 5', () => {
    expect(XP_MAX).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('getCollectedItems', () => {
  it('returns empty array when registry key is unset', () => {
    const r = makeRegistry();
    expect(getCollectedItems(r)).toEqual([]);
  });

  it('returns stored array', () => {
    const r = makeRegistry({ collected: ['id1', 'id2'] });
    expect(getCollectedItems(r)).toEqual(['id1', 'id2']);
  });
});

describe('isCollected', () => {
  it('returns false when item not in collected list', () => {
    const r = makeRegistry({ collected: ['other_id'] });
    expect(isCollected(r, 'my_item')).toBe(false);
  });

  it('returns true when item is in collected list', () => {
    const r = makeRegistry({ collected: ['my_item', 'other'] });
    expect(isCollected(r, 'my_item')).toBe(true);
  });

  it('returns false when collected list is empty', () => {
    const r = makeRegistry();
    expect(isCollected(r, 'any')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// evaluateManifest
// ─────────────────────────────────────────────────────────────────────────────

describe('evaluateManifest', () => {
  it('returns all non-oneTime items when nothing collected', () => {
    const manifest = [
      makeCollectible({ id: 'a', oneTime: false }),
      makeCollectible({ id: 'b', oneTime: false }),
    ];
    const result = evaluateManifest(manifest, []);
    expect(result).toHaveLength(2);
  });

  it('filters out collected one-time items', () => {
    const manifest = [
      makeCollectible({ id: 'a', oneTime: true }),
      makeCollectible({ id: 'b', oneTime: true }),
      makeCollectible({ id: 'c', oneTime: false }),
    ];
    const result = evaluateManifest(manifest, ['a']);
    expect(result.map(r => r.id)).toEqual(['b', 'c']);
  });

  it('does not filter out non-oneTime items even if id appears in collectedIds', () => {
    const manifest = [
      makeCollectible({ id: 'a', oneTime: false }),
    ];
    const result = evaluateManifest(manifest, ['a']);
    expect(result).toHaveLength(1);
  });

  it('caps at MAX_COLLECTIBLES_PER_ZONE per zone', () => {
    const manifest = Array.from({ length: MAX_COLLECTIBLES_PER_ZONE + 3 }, (_, i) =>
      makeCollectible({ id: `item_${i}`, zone: 'ZoneA' }),
    );
    const result = evaluateManifest(manifest, []);
    expect(result).toHaveLength(MAX_COLLECTIBLES_PER_ZONE);
  });

  it('tracks cap independently per zone', () => {
    const zoneA = Array.from({ length: MAX_COLLECTIBLES_PER_ZONE }, (_, i) =>
      makeCollectible({ id: `a_${i}`, zone: 'ZoneA' }),
    );
    const zoneB = Array.from({ length: MAX_COLLECTIBLES_PER_ZONE }, (_, i) =>
      makeCollectible({ id: `b_${i}`, zone: 'ZoneB' }),
    );
    const result = evaluateManifest([...zoneA, ...zoneB], []);
    expect(result).toHaveLength(MAX_COLLECTIBLES_PER_ZONE * 2);
  });

  it('groups items without zone under _default', () => {
    const manifest = Array.from({ length: MAX_COLLECTIBLES_PER_ZONE + 2 }, (_, i) =>
      ({ ...makeCollectible({ id: `x_${i}` }), zone: undefined }),
    );
    const result = evaluateManifest(manifest, []);
    expect(result).toHaveLength(MAX_COLLECTIBLES_PER_ZONE);
  });

  it('returns empty array for empty manifest', () => {
    expect(evaluateManifest([], [])).toEqual([]);
  });

  it('returns empty array when all one-time items are collected', () => {
    const manifest = [
      makeCollectible({ id: 'a', oneTime: true }),
      makeCollectible({ id: 'b', oneTime: true }),
    ];
    const result = evaluateManifest(manifest, ['a', 'b']);
    expect(result).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPickupSound
// ─────────────────────────────────────────────────────────────────────────────

describe('getPickupSound', () => {
  it('returns SFX_PICKUP_PANT for items with pantValue > 0', () => {
    expect(getPickupSound({ pantValue: 1, category: 'food' })).toBe(SFX_PICKUP_PANT);
    expect(getPickupSound({ pantValue: 1.5, category: 'health' })).toBe(SFX_PICKUP_PANT);
  });

  it('returns SFX_PICKUP_DOCUMENT for document category items', () => {
    expect(getPickupSound({ pantValue: 0, category: 'document' })).toBe(SFX_PICKUP_DOCUMENT);
  });

  it('returns SFX_PICKUP_GENERAL for all other items', () => {
    expect(getPickupSound({ pantValue: 0, category: 'food' })).toBe(SFX_PICKUP_GENERAL);
    expect(getPickupSound({ pantValue: 0, category: 'health' })).toBe(SFX_PICKUP_GENERAL);
    expect(getPickupSound({ pantValue: 0, category: 'collectible' })).toBe(SFX_PICKUP_GENERAL);
  });

  it('returns SFX_PICKUP_GENERAL for null itemData', () => {
    expect(getPickupSound(null)).toBe(SFX_PICKUP_GENERAL);
  });

  it('pantValue check takes priority over category', () => {
    // document with pantValue > 0 → pant sound
    expect(getPickupSound({ pantValue: 1, category: 'document' })).toBe(SFX_PICKUP_PANT);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getXPForItem
// ─────────────────────────────────────────────────────────────────────────────

describe('getXPForItem', () => {
  it('returns XP_MIN (1) for pantValue 0', () => {
    expect(getXPForItem(0)).toBe(XP_MIN);
  });

  it('returns XP_MIN (1) for null/undefined pantValue', () => {
    expect(getXPForItem(null)).toBe(XP_MIN);
    expect(getXPForItem(undefined)).toBe(XP_MIN);
  });

  it('returns XP_MIN (1) for negative pantValue', () => {
    expect(getXPForItem(-1)).toBe(XP_MIN);
  });

  it('returns 3 for pantValue between 0 and 2 (exclusive)', () => {
    expect(getXPForItem(1)).toBe(3);
    expect(getXPForItem(1.5)).toBe(3);
  });

  it('returns XP_MAX (5) for pantValue >= 2', () => {
    expect(getXPForItem(2)).toBe(XP_MAX);
    expect(getXPForItem(3)).toBe(XP_MAX);
    expect(getXPForItem(10)).toBe(XP_MAX);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// collectItem
// ─────────────────────────────────────────────────────────────────────────────

describe('collectItem', () => {
  it('returns success:false for unknown itemId', () => {
    const r = makeRegistry();
    const def = makeCollectible({ itemId: 'no_such_item' });
    const result = collectItem(r, def);
    expect(result.success).toBe(false);
    expect(result.xpGained).toBe(0);
  });

  it('returns success:true and adds item to inventory for valid itemId', () => {
    const r = makeRegistry();
    const def = makeCollectible({ itemId: 'coffee' });
    const result = collectItem(r, def);
    expect(result.success).toBe(true);
    const inv = r.get(RK.INVENTORY);
    expect(inv.some(e => e.itemId === 'coffee')).toBe(true);
  });

  it('records one-time collectible ID in COLLECTED_ITEMS', () => {
    const r = makeRegistry();
    const def = makeCollectible({ id: 'one_shot_1', oneTime: true });
    collectItem(r, def);
    expect(r.get(RK.COLLECTED_ITEMS)).toContain('one_shot_1');
  });

  it('does not duplicate one-time ID if already present', () => {
    const r = makeRegistry({ collected: ['one_shot_1'] });
    const def = makeCollectible({ id: 'one_shot_1', oneTime: true });
    collectItem(r, def);
    const collected = r.get(RK.COLLECTED_ITEMS);
    expect(collected.filter(id => id === 'one_shot_1')).toHaveLength(1);
  });

  it('does not record ID for non-oneTime collectibles', () => {
    const r = makeRegistry();
    const def = makeCollectible({ id: 'respawning_1', oneTime: false });
    collectItem(r, def);
    const collected = r.get(RK.COLLECTED_ITEMS);
    expect(collected ?? []).not.toContain('respawning_1');
  });

  it('emits xp:grant with the correct amount', () => {
    const r = makeRegistry();
    const emitted = [];
    r.events.on('xp:grant', amount => emitted.push(amount));

    const def = makeCollectible({ itemId: 'coffee' });
    const result = collectItem(r, def);
    expect(emitted).toHaveLength(1);
    expect(emitted[0]).toBe(result.xpGained);
  });

  it('firstPickup is true when tooltip is provided', () => {
    const r = makeRegistry();
    const def = makeCollectible({ tooltip: 'A flavour tooltip!' });
    const result = collectItem(r, def);
    expect(result.firstPickup).toBe(true);
  });

  it('firstPickup is false when tooltip is null', () => {
    const r = makeRegistry();
    const def = makeCollectible({ tooltip: null });
    const result = collectItem(r, def);
    expect(result.firstPickup).toBe(false);
  });

  it('grants correct XP for item with pantValue > 0', () => {
    const r = makeRegistry();
    // 'beer' has pantValue: 1
    const def = makeCollectible({ itemId: 'beer' });
    const result = collectItem(r, def);
    expect(result.xpGained).toBe(3); // pantValue 1 → 3 XP
  });

  it('grants XP_MIN for item with pantValue 0', () => {
    const r = makeRegistry();
    const def = makeCollectible({ itemId: 'coffee' });
    const result = collectItem(r, def);
    expect(result.xpGained).toBe(XP_MIN);
  });

  it('respects quantity when adding to inventory', () => {
    const r = makeRegistry();
    const def = makeCollectible({ itemId: 'coffee', quantity: 3 });
    collectItem(r, def);
    const inv = r.get(RK.INVENTORY);
    const entry = inv.find(e => e.itemId === 'coffee');
    expect(entry?.quantity).toBe(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: edge case — pant bottle capacity
// ─────────────────────────────────────────────────────────────────────────────

describe('collectItem — edge cases', () => {
  it('handles collecting a document item (category: document)', () => {
    const r = makeRegistry();
    const def = makeCollectible({ itemId: 'cpr_card', oneTime: true, id: 'cpr_world_1' });
    const result = collectItem(r, def);
    expect(result.success).toBe(true);
    expect(r.get(RK.COLLECTED_ITEMS)).toContain('cpr_world_1');
  });
});
