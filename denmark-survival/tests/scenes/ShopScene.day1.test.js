/**
 * tests/scenes/ShopScene.day1.test.js
 * Unit tests for ShopScene Day 1 enhancements.
 *
 * Tests pure helper functions without Phaser dependency.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  isDay1Session,
  buildShopItemList,
  shouldShowPantReturnButton,
  DAY1_HIGHLIGHTED_ITEMS,
  DAY1_RECOMMENDED_ITEM,
} from '../../src/scenes/ShopScene.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeDay1Registry() {
  const reg = new MockRegistry();
  reg.set(RK.CURRENT_DAY,        1);
  reg.set(RK.TUTORIAL_COMPLETED, false);
  reg.set(RK.PANT_BOTTLES,       0);
  return reg;
}

function makeDay2Registry() {
  const reg = new MockRegistry();
  reg.set(RK.CURRENT_DAY,        2);
  reg.set(RK.TUTORIAL_COMPLETED, true);
  return reg;
}

const NETTO_ITEMS = [
  { itemId: 'rugbrod',     price: 22 },
  { itemId: 'pasta',       price: 13 },
  { itemId: 'milk',        price: 10 },
  { itemId: 'vegetables',  price: 18 },
  { itemId: 'frozen_meal', price: 32 },
  { itemId: 'vitamin_d',   price: 80 },
];

// ─────────────────────────────────────────────────────────────────────────────
// isDay1Session()
// ─────────────────────────────────────────────────────────────────────────────

describe('isDay1Session()', () => {
  it('returns true on day 1 with tutorial not completed', () => {
    expect(isDay1Session(makeDay1Registry())).toBe(true);
  });

  it('returns false on day 2', () => {
    expect(isDay1Session(makeDay2Registry())).toBe(false);
  });

  it('returns false on day 1 if tutorial already completed', () => {
    const reg = makeDay1Registry();
    reg.set(RK.TUTORIAL_COMPLETED, true);
    expect(isDay1Session(reg)).toBe(false);
  });

  it('returns false when CURRENT_DAY is undefined', () => {
    const reg = new MockRegistry();
    expect(isDay1Session(reg)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DAY1_HIGHLIGHTED_ITEMS
// ─────────────────────────────────────────────────────────────────────────────

describe('DAY1_HIGHLIGHTED_ITEMS', () => {
  it('contains rugbrod', () => {
    expect(DAY1_HIGHLIGHTED_ITEMS).toContain('rugbrod');
  });

  it('contains pasta', () => {
    expect(DAY1_HIGHLIGHTED_ITEMS).toContain('pasta');
  });

  it('contains milk', () => {
    expect(DAY1_HIGHLIGHTED_ITEMS).toContain('milk');
  });
});

describe('DAY1_RECOMMENDED_ITEM', () => {
  it('is vitamin_d', () => {
    expect(DAY1_RECOMMENDED_ITEM).toBe('vitamin_d');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildShopItemList()
// ─────────────────────────────────────────────────────────────────────────────

describe('buildShopItemList()', () => {
  describe('on Day 1', () => {
    it('marks rugbrod with highlight=true', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      const item = list.find(i => i.itemId === 'rugbrod');
      expect(item.highlight).toBe(true);
    });

    it('marks pasta with highlight=true', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      expect(list.find(i => i.itemId === 'pasta').highlight).toBe(true);
    });

    it('marks milk with highlight=true', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      expect(list.find(i => i.itemId === 'milk').highlight).toBe(true);
    });

    it('does NOT mark vegetables with highlight', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      expect(list.find(i => i.itemId === 'vegetables').highlight).toBe(false);
    });

    it('marks vitamin_d as recommended', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      expect(list.find(i => i.itemId === 'vitamin_d').recommended).toBe(true);
    });

    it('does NOT mark rugbrod as recommended', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      expect(list.find(i => i.itemId === 'rugbrod').recommended).toBe(false);
    });

    it('preserves original price values', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      expect(list.find(i => i.itemId === 'rugbrod').price).toBe(22);
      expect(list.find(i => i.itemId === 'pasta').price).toBe(13);
    });

    it('returns the same number of items as input', () => {
      const list = buildShopItemList(NETTO_ITEMS, true);
      expect(list).toHaveLength(NETTO_ITEMS.length);
    });
  });

  describe('on Day 2+', () => {
    it('sets highlight=false for all items', () => {
      const list = buildShopItemList(NETTO_ITEMS, false);
      expect(list.every(i => i.highlight === false)).toBe(true);
    });

    it('sets recommended=false for all items', () => {
      const list = buildShopItemList(NETTO_ITEMS, false);
      expect(list.every(i => i.recommended === false)).toBe(true);
    });
  });

  it('handles empty item list', () => {
    expect(buildShopItemList([], true)).toEqual([]);
    expect(buildShopItemList([], false)).toEqual([]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// shouldShowPantReturnButton()
// ─────────────────────────────────────────────────────────────────────────────

describe('shouldShowPantReturnButton()', () => {
  it('returns true on Day 1 with pant bottles present', () => {
    const reg = makeDay1Registry();
    reg.set(RK.PANT_BOTTLES, 2);
    expect(shouldShowPantReturnButton(reg)).toBe(true);
  });

  it('returns false on Day 1 with no pant bottles', () => {
    const reg = makeDay1Registry();
    reg.set(RK.PANT_BOTTLES, 0);
    expect(shouldShowPantReturnButton(reg)).toBe(false);
  });

  it('returns false on Day 2 even with pant bottles', () => {
    const reg = makeDay2Registry();
    reg.set(RK.PANT_BOTTLES, 3);
    expect(shouldShowPantReturnButton(reg)).toBe(false);
  });

  it('returns false when PANT_BOTTLES is undefined', () => {
    const reg = makeDay1Registry();
    // Do not set PANT_BOTTLES
    expect(shouldShowPantReturnButton(reg)).toBe(false);
  });
});
