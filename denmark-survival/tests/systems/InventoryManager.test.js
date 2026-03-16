/**
 * tests/systems/InventoryManager.test.js
 * Unit and integration tests for InventoryManager.
 * Coverage target: ≥85% of src/systems/InventoryManager.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  addItem,
  removeItem,
  hasItem,
  useItem,
  getItemsByCategory,
  getInventoryCount,
  processSpoilage,
  getFreshnessStatus,
  returnPant,
  getItemData,
  getAllItems,
  MAX_PANT_BOTTLES,
  FRESHNESS_FRESH,
  FRESHNESS_GETTING_OLD,
  FRESHNESS_ABOUT_TO_SPOIL,
} from '../../src/systems/InventoryManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  ITEM_ADDED,
  ITEM_REMOVED,
  ITEM_USED,
  ITEM_SPOILED,
  PANT_RETURNED,
} from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(options = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,    options.day     ?? 1);
  r.set(RK.PLAYER_XP,      options.xp      ?? 0);
  r.set(RK.PLAYER_LEVEL,   options.level   ?? 1);
  r.set(RK.PLAYER_MONEY,   options.money   ?? 0);
  r.set(RK.PLAYER_ENERGY,  options.energy  ?? 100);
  if (options.inventory !== undefined) r.set(RK.INVENTORY,     options.inventory);
  if (options.pant      !== undefined) r.set(RK.PANT_BOTTLES,  options.pant);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Item data validation
// ─────────────────────────────────────────────────────────────────────────────

describe('Item data — items.json', () => {
  const items = getAllItems();

  it('exports a non-empty array', () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  it('all items have required fields', () => {
    for (const item of items) {
      expect(item.id,          `${item.id} missing id`).toBeTruthy();
      expect(item.name,        `${item.id} missing name`).toBeTruthy();
      expect(item.description, `${item.id} missing description`).toBeTruthy();
      expect(item.category,    `${item.id} missing category`).toBeTruthy();
      expect(item.icon,        `${item.id} missing icon`).toBeTruthy();
      expect(typeof item.stackable, `${item.id} stackable not boolean`).toBe('boolean');
      expect(typeof item.maxStack,  `${item.id} maxStack not number`).toBe('number');
      expect(typeof item.usable,    `${item.id} usable not boolean`).toBe('boolean');
      expect(typeof item.price,     `${item.id} price not number`).toBe('number');
      expect('pantValue' in item,   `${item.id} missing pantValue`).toBe(true);
    }
  });

  it('all item ids are unique', () => {
    const ids   = items.map(i => i.id);
    const uniq  = new Set(ids);
    expect(ids.length).toBe(uniq.size);
  });

  it('categories are one of the allowed values', () => {
    const allowed = new Set(['food', 'health', 'transport', 'document', 'collectible']);
    for (const item of items) {
      expect(allowed.has(item.category), `${item.id} has invalid category ${item.category}`).toBe(true);
    }
  });

  it('perishable items have a positive spoilsAfter value', () => {
    for (const item of items) {
      if (item.spoilsAfter !== null && item.spoilsAfter !== undefined) {
        expect(item.spoilsAfter, `${item.id} spoilsAfter must be > 0`).toBeGreaterThan(0);
      }
    }
  });

  it('stackable items have maxStack > 1', () => {
    for (const item of items) {
      if (item.stackable) {
        expect(item.maxStack, `${item.id} maxStack must be > 1 when stackable`).toBeGreaterThan(1);
      }
    }
  });

  it('getItemData returns correct item', () => {
    const rugbrodData = getItemData('rugbrod');
    expect(rugbrodData).not.toBeNull();
    expect(rugbrodData.name).toBe('Rugbrød');
    expect(rugbrodData.category).toBe('food');
  });

  it('getItemData returns null for unknown id', () => {
    expect(getItemData('nonexistent_item')).toBeNull();
  });

  it('has items in all required categories', () => {
    const categories = new Set(items.map(i => i.category));
    expect(categories.has('food')).toBe(true);
    expect(categories.has('health')).toBe(true);
    expect(categories.has('transport')).toBe(true);
    expect(categories.has('document')).toBe(true);
    expect(categories.has('collectible')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// addItem
// ─────────────────────────────────────────────────────────────────────────────

describe('addItem', () => {
  it('adds a new stackable item with acquiredDay', () => {
    const r = makeRegistry({ day: 3 });
    addItem(r, 'rugbrod', 1);
    const inv = r.get(RK.INVENTORY);
    expect(inv).toHaveLength(1);
    expect(inv[0].itemId).toBe('rugbrod');
    expect(inv[0].quantity).toBe(1);
    expect(inv[0].acquiredDay).toBe(3);
  });

  it('stacks existing stackable item', () => {
    const r = makeRegistry();
    addItem(r, 'rugbrod', 1);
    addItem(r, 'rugbrod', 2);
    const inv = r.get(RK.INVENTORY);
    expect(inv).toHaveLength(1);
    expect(inv[0].quantity).toBe(3);
  });

  it('caps at maxStack when adding more than maxStack', () => {
    const r    = makeRegistry();
    const data = getItemData('rugbrod');
    addItem(r, 'rugbrod', data.maxStack + 5);
    const inv = r.get(RK.INVENTORY);
    expect(inv[0].quantity).toBe(data.maxStack);
  });

  it('caps stack at maxStack when stacking', () => {
    const r    = makeRegistry();
    const data = getItemData('rugbrod');
    addItem(r, 'rugbrod', data.maxStack - 1);
    addItem(r, 'rugbrod', 5); // would overflow
    expect(r.get(RK.INVENTORY)[0].quantity).toBe(data.maxStack);
  });

  it('sets spoilsOnDay for perishable items', () => {
    const r = makeRegistry({ day: 1 });
    addItem(r, 'rugbrod', 1);
    const entry = r.get(RK.INVENTORY)[0];
    expect(entry.spoilsOnDay).toBe(1 + getItemData('rugbrod').spoilsAfter);
  });

  it('does not set spoilsOnDay for non-perishable items', () => {
    const r = makeRegistry();
    addItem(r, 'pasta', 1);
    const entry = r.get(RK.INVENTORY)[0];
    expect(entry.spoilsOnDay).toBeUndefined();
  });

  it('appends a second different item without merging', () => {
    const r = makeRegistry();
    addItem(r, 'rugbrod', 1);
    addItem(r, 'milk', 1);
    expect(r.get(RK.INVENTORY)).toHaveLength(2);
  });

  it('emits ITEM_ADDED event', () => {
    const r   = makeRegistry();
    const spy = vi.fn();
    r.events.on(ITEM_ADDED, spy);
    addItem(r, 'rugbrod', 2);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ itemId: 'rugbrod', quantity: 2 });
  });

  it('returns false for unknown item id', () => {
    const r = makeRegistry();
    expect(addItem(r, 'invalid_item')).toBe(false);
    expect(r.get(RK.INVENTORY)).toBeUndefined();
  });

  it('adds non-stackable items as separate entries', () => {
    const r = makeRegistry();
    addItem(r, 'rejsekort', 2); // non-stackable
    const inv = r.get(RK.INVENTORY);
    expect(inv).toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// removeItem
// ─────────────────────────────────────────────────────────────────────────────

describe('removeItem', () => {
  it('reduces quantity by specified amount', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 4, acquiredDay: 1 }] });
    removeItem(r, 'milk', 2);
    expect(r.get(RK.INVENTORY)[0].quantity).toBe(2);
  });

  it('removes entry entirely when quantity reaches zero', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 2, acquiredDay: 1 }] });
    removeItem(r, 'milk', 2);
    expect(r.get(RK.INVENTORY)).toHaveLength(0);
  });

  it('removes entry when removing more than available', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 1, acquiredDay: 1 }] });
    removeItem(r, 'milk', 5);
    expect(r.get(RK.INVENTORY)).toHaveLength(0);
  });

  it('returns false when item not in inventory', () => {
    const r = makeRegistry();
    expect(removeItem(r, 'milk', 1)).toBe(false);
  });

  it('emits ITEM_REMOVED event', () => {
    const r   = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 3, acquiredDay: 1 }] });
    const spy = vi.fn();
    r.events.on(ITEM_REMOVED, spy);
    removeItem(r, 'milk', 1);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ itemId: 'milk', quantity: 1 });
  });

  it('only removes the targeted item, leaving others intact', () => {
    const r = makeRegistry({
      inventory: [
        { itemId: 'milk',    quantity: 2, acquiredDay: 1 },
        { itemId: 'rugbrod', quantity: 1, acquiredDay: 1 },
      ],
    });
    removeItem(r, 'milk', 2);
    const inv = r.get(RK.INVENTORY);
    expect(inv).toHaveLength(1);
    expect(inv[0].itemId).toBe('rugbrod');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// hasItem
// ─────────────────────────────────────────────────────────────────────────────

describe('hasItem', () => {
  it('returns true when item quantity meets minimum', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 3, acquiredDay: 1 }] });
    expect(hasItem(r, 'milk', 3)).toBe(true);
  });

  it('returns true when quantity exceeds minimum', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 5, acquiredDay: 1 }] });
    expect(hasItem(r, 'milk', 2)).toBe(true);
  });

  it('returns false when quantity is below minimum', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 1, acquiredDay: 1 }] });
    expect(hasItem(r, 'milk', 2)).toBe(false);
  });

  it('returns false when item is not in inventory', () => {
    const r = makeRegistry();
    expect(hasItem(r, 'milk')).toBe(false);
  });

  it('defaults minQuantity to 1', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 1, acquiredDay: 1 }] });
    expect(hasItem(r, 'milk')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// useItem
// ─────────────────────────────────────────────────────────────────────────────

describe('useItem', () => {
  it('decrements quantity after use', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 2, acquiredDay: 1 }] });
    useItem(r, 'milk');
    expect(r.get(RK.INVENTORY)[0].quantity).toBe(1);
  });

  it('removes item from inventory when last unit is used', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'rugbrod', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'rugbrod');
    expect(r.get(RK.INVENTORY)).toHaveLength(0);
  });

  it('returns success:false for item not in inventory', () => {
    const r = makeRegistry();
    expect(useItem(r, 'milk')).toMatchObject({ success: false, reason: 'not_in_inventory' });
  });

  it('returns success:false for non-usable item', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'rejsekort', quantity: 1, acquiredDay: 1 }] });
    expect(useItem(r, 'rejsekort')).toMatchObject({ success: false, reason: 'not_usable' });
  });

  it('emits ITEM_USED event on success', () => {
    const r   = makeRegistry({ inventory: [{ itemId: 'milk', quantity: 1, acquiredDay: 1 }] });
    const spy = vi.fn();
    r.events.on(ITEM_USED, spy);
    useItem(r, 'milk');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ itemId: 'milk' });
  });

  it('food use sets ATE_TODAY flag', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'rugbrod', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'rugbrod');
    expect(r.get(RK.ATE_TODAY)).toBe(true);
  });

  it('vitamin_d use sets VITAMIN_D_TAKEN flag', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'vitamin_d', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'vitamin_d');
    expect(r.get(RK.VITAMIN_D_TAKEN)).toBe(true);
  });

  it('cold_medicine use sets SICK_RECOVERY_BOOST flag', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'cold_medicine', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'cold_medicine');
    expect(r.get(RK.SICK_RECOVERY_BOOST)).toBe(true);
  });

  it('energy_drink adds 15 to PLAYER_ENERGY (capped at 100)', () => {
    const r = makeRegistry({ energy: 90, inventory: [{ itemId: 'energy_drink', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'energy_drink');
    expect(r.get(RK.PLAYER_ENERGY)).toBe(100);
  });

  it('energy_drink does not exceed 100 energy', () => {
    const r = makeRegistry({ energy: 95, inventory: [{ itemId: 'energy_drink', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'energy_drink');
    expect(r.get(RK.PLAYER_ENERGY)).toBe(100);
  });

  it('bike_repair sets BIKE_REPAIRED flag', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'bike_repair_kit', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'bike_repair_kit');
    expect(r.get(RK.BIKE_REPAIRED)).toBe(true);
  });

  it('consuming a pant item adds a bottle to PANT_BOTTLES', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'beer', quantity: 1, acquiredDay: 1 }] });
    useItem(r, 'beer');
    const pant = r.get(RK.PANT_BOTTLES);
    expect(pant).toHaveLength(1);
    expect(pant[0].itemId).toBe('beer');
    expect(pant[0].pantValue).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getItemsByCategory
// ─────────────────────────────────────────────────────────────────────────────

describe('getItemsByCategory', () => {
  const inventory = [
    { itemId: 'rugbrod',        quantity: 1, acquiredDay: 1 },
    { itemId: 'milk',           quantity: 2, acquiredDay: 1 },
    { itemId: 'vitamin_d',      quantity: 5, acquiredDay: 1 },
    { itemId: 'rejsekort',      quantity: 1, acquiredDay: 1 },
    { itemId: 'cpr_card',       quantity: 1, acquiredDay: 1 },
    { itemId: 'danish_flag_pin',quantity: 1, acquiredDay: 1 },
  ];

  it('returns all items for category "all"', () => {
    const r = makeRegistry({ inventory });
    expect(getItemsByCategory(r, 'all')).toHaveLength(6);
  });

  it('filters food items correctly', () => {
    const r   = makeRegistry({ inventory });
    const res = getItemsByCategory(r, 'food');
    expect(res.every(e => getItemData(e.itemId).category === 'food')).toBe(true);
    expect(res).toHaveLength(2);
  });

  it('filters health items correctly', () => {
    const r   = makeRegistry({ inventory });
    const res = getItemsByCategory(r, 'health');
    expect(res).toHaveLength(1);
    expect(res[0].itemId).toBe('vitamin_d');
  });

  it('filters transport items correctly', () => {
    const r   = makeRegistry({ inventory });
    const res = getItemsByCategory(r, 'transport');
    expect(res).toHaveLength(1);
    expect(res[0].itemId).toBe('rejsekort');
  });

  it('filters document items correctly', () => {
    const r   = makeRegistry({ inventory });
    const res = getItemsByCategory(r, 'document');
    expect(res).toHaveLength(1);
    expect(res[0].itemId).toBe('cpr_card');
  });

  it('filters collectible items correctly', () => {
    const r   = makeRegistry({ inventory });
    const res = getItemsByCategory(r, 'collectible');
    expect(res).toHaveLength(1);
    expect(res[0].itemId).toBe('danish_flag_pin');
  });

  it('returns empty array when no items match category', () => {
    const r = makeRegistry({ inventory: [{ itemId: 'rugbrod', quantity: 1, acquiredDay: 1 }] });
    expect(getItemsByCategory(r, 'document')).toHaveLength(0);
  });

  it('returns empty array when inventory is empty', () => {
    const r = makeRegistry({ inventory: [] });
    expect(getItemsByCategory(r, 'all')).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getInventoryCount
// ─────────────────────────────────────────────────────────────────────────────

describe('getInventoryCount', () => {
  it('returns 0 for empty inventory', () => {
    const r = makeRegistry({ inventory: [] });
    expect(getInventoryCount(r)).toBe(0);
  });

  it('returns sum of all stack quantities', () => {
    const r = makeRegistry({
      inventory: [
        { itemId: 'milk',    quantity: 3, acquiredDay: 1 },
        { itemId: 'rugbrod', quantity: 2, acquiredDay: 1 },
      ],
    });
    expect(getInventoryCount(r)).toBe(5);
  });

  it('counts single-unit non-stackable items', () => {
    const r = makeRegistry({
      inventory: [{ itemId: 'rejsekort', quantity: 1, acquiredDay: 1 }],
    });
    expect(getInventoryCount(r)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// processSpoilage
// ─────────────────────────────────────────────────────────────────────────────

describe('processSpoilage', () => {
  it('removes item when age >= spoilsAfter', () => {
    // rugbrod spoilsAfter = 5, acquired day 1, current day 6 → age = 5
    const r = makeRegistry({
      day:       6,
      inventory: [{ itemId: 'rugbrod', quantity: 1, acquiredDay: 1, spoilsOnDay: 6 }],
    });
    const spoiled = processSpoilage(r, 6);
    expect(spoiled).toHaveLength(1);
    expect(spoiled[0].itemId).toBe('rugbrod');
    expect(r.get(RK.INVENTORY)).toHaveLength(0);
  });

  it('keeps item when age < spoilsAfter', () => {
    const r = makeRegistry({
      inventory: [{ itemId: 'rugbrod', quantity: 1, acquiredDay: 1 }],
    });
    const spoiled = processSpoilage(r, 2); // age = 1, spoilsAfter = 5
    expect(spoiled).toHaveLength(0);
    expect(r.get(RK.INVENTORY)).toHaveLength(1);
  });

  it('keeps non-perishable items regardless of age', () => {
    const r = makeRegistry({
      inventory: [{ itemId: 'pasta', quantity: 3, acquiredDay: 1 }],
    });
    const spoiled = processSpoilage(r, 100);
    expect(spoiled).toHaveLength(0);
    expect(r.get(RK.INVENTORY)).toHaveLength(1);
  });

  it('emits ITEM_SPOILED for each spoiled item', () => {
    const r   = makeRegistry({
      inventory: [{ itemId: 'rugbrod', quantity: 1, acquiredDay: 1 }],
    });
    const spy = vi.fn();
    r.events.on(ITEM_SPOILED, spy);
    processSpoilage(r, 10);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0].message).toContain('Rugbrød');
  });

  it('handles mixed perishable and non-perishable items', () => {
    const r = makeRegistry({
      inventory: [
        { itemId: 'rugbrod', quantity: 1, acquiredDay: 1 }, // spoils at day 6
        { itemId: 'pasta',   quantity: 2, acquiredDay: 1 }, // non-perishable
      ],
    });
    const spoiled = processSpoilage(r, 10);
    expect(spoiled).toHaveLength(1);
    expect(r.get(RK.INVENTORY)).toHaveLength(1);
    expect(r.get(RK.INVENTORY)[0].itemId).toBe('pasta');
  });

  it('returns empty array for empty inventory', () => {
    const r = makeRegistry({ inventory: [] });
    expect(processSpoilage(r, 5)).toHaveLength(0);
  });

  it('returns empty array when INVENTORY is not set', () => {
    const r = makeRegistry();
    expect(processSpoilage(r, 5)).toHaveLength(0);
  });

  it('removes at boundary: age === spoilsAfter', () => {
    // kanelsnegl spoilsAfter = 2, acquired day 3, current day 5 → age = 2
    const r = makeRegistry({
      inventory: [{ itemId: 'kanelsnegl', quantity: 1, acquiredDay: 3 }],
    });
    const spoiled = processSpoilage(r, 5);
    expect(spoiled).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getFreshnessStatus
// ─────────────────────────────────────────────────────────────────────────────

describe('getFreshnessStatus', () => {
  // rugbrod spoilsAfter = 5
  const baseEntry = { itemId: 'rugbrod', quantity: 1, acquiredDay: 1 };

  it('returns fresh (green) when age < 50% of spoilsAfter', () => {
    // age = 1, ratio = 0.2 → fresh
    const result = getFreshnessStatus(baseEntry, 2);
    expect(result.status).toBe(FRESHNESS_FRESH);
    expect(result.color).toBe('green');
    expect(result.daysLeft).toBe(4);
  });

  it('returns getting_old (yellow) when age is 50–80% of spoilsAfter', () => {
    // age = 3, ratio = 0.6 → getting old
    const result = getFreshnessStatus(baseEntry, 4);
    expect(result.status).toBe(FRESHNESS_GETTING_OLD);
    expect(result.color).toBe('yellow');
    expect(result.daysLeft).toBe(2);
  });

  it('returns about_to_spoil (red) when age is 80–100% of spoilsAfter', () => {
    // age = 4, ratio = 0.8 → about to spoil (boundary: ratio >= 0.8)
    const result = getFreshnessStatus(baseEntry, 5);
    expect(result.status).toBe(FRESHNESS_ABOUT_TO_SPOIL);
    expect(result.color).toBe('red');
    expect(result.daysLeft).toBe(1);
  });

  it('returns about_to_spoil when fully expired', () => {
    // age = 5, ratio = 1.0
    const result = getFreshnessStatus(baseEntry, 6);
    expect(result.status).toBe(FRESHNESS_ABOUT_TO_SPOIL);
    expect(result.daysLeft).toBe(0);
  });

  it('returns null for non-perishable items', () => {
    const entry = { itemId: 'pasta', quantity: 1, acquiredDay: 1 };
    expect(getFreshnessStatus(entry, 100)).toBeNull();
  });

  it('returns null for unknown item', () => {
    const entry = { itemId: 'unknown_item', quantity: 1, acquiredDay: 1 };
    expect(getFreshnessStatus(entry, 5)).toBeNull();
  });

  it('daysLeft is never negative', () => {
    // Overdue item
    const result = getFreshnessStatus(baseEntry, 100);
    expect(result.daysLeft).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// returnPant
// ─────────────────────────────────────────────────────────────────────────────

describe('returnPant', () => {
  it('returns failure when no pant bottles', () => {
    const r = makeRegistry({ pant: [] });
    const result = returnPant(r);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_pant');
    expect(result.dkk).toBe(0);
  });

  it('returns failure when PANT_BOTTLES is not set', () => {
    const r = makeRegistry();
    expect(returnPant(r)).toMatchObject({ success: false });
  });

  it('calculates total DKK from mixed pant values', () => {
    const r = makeRegistry({
      money: 100,
      pant: [
        { itemId: 'beer',         pantValue: 1   },
        { itemId: 'energy_drink', pantValue: 1.5 },
        { itemId: 'beer',         pantValue: 1   },
      ],
    });
    const result = returnPant(r);
    expect(result.success).toBe(true);
    expect(result.dkk).toBe(3.5);
    expect(result.bottles).toBe(3);
  });

  it('credits the calculated DKK to PLAYER_MONEY', () => {
    const r = makeRegistry({
      money: 200,
      pant: [{ itemId: 'beer', pantValue: 1 }],
    });
    returnPant(r);
    expect(r.get(RK.PLAYER_MONEY)).toBe(201);
  });

  it('clears PANT_BOTTLES after return', () => {
    const r = makeRegistry({
      pant: [{ itemId: 'beer', pantValue: 1 }],
    });
    returnPant(r);
    expect(r.get(RK.PANT_BOTTLES)).toHaveLength(0);
  });

  it('grants XP after return', () => {
    const r = makeRegistry({
      pant: [{ itemId: 'beer', pantValue: 1 }],
    });
    const xpBefore = r.get(RK.PLAYER_XP);
    returnPant(r);
    expect(r.get(RK.PLAYER_XP)).toBeGreaterThan(xpBefore);
  });

  it('emits PANT_RETURNED event', () => {
    const r   = makeRegistry({
      pant: [{ itemId: 'beer', pantValue: 1 }],
    });
    const spy = vi.fn();
    r.events.on(PANT_RETURNED, spy);
    returnPant(r);
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toMatchObject({ xp: 5 });
  });

  it('reports returned xp as 5', () => {
    const r = makeRegistry({
      pant: [{ itemId: 'beer', pantValue: 1 }],
    });
    const result = returnPant(r);
    expect(result.xp).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MAX_PANT_BOTTLES cap
// ─────────────────────────────────────────────────────────────────────────────

describe('MAX_PANT_BOTTLES cap', () => {
  it('does not accumulate more than MAX_PANT_BOTTLES via useItem', () => {
    const inventory = [];
    for (let i = 0; i <= MAX_PANT_BOTTLES + 2; i++) {
      inventory.push({ itemId: 'beer', quantity: 1, acquiredDay: 1 });
    }
    // Replace with a single entry of many beers for simplicity
    const r = makeRegistry({ inventory: [{ itemId: 'beer', quantity: MAX_PANT_BOTTLES + 5, acquiredDay: 1 }] });
    for (let i = 0; i < MAX_PANT_BOTTLES + 3; i++) {
      useItem(r, 'beer');
    }
    const pant = r.get(RK.PANT_BOTTLES);
    expect(pant.length).toBeLessThanOrEqual(MAX_PANT_BOTTLES);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: buy → use → quantity decreases
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — add food, use, quantity decreases', () => {
  it('adds food, uses it, marks fed, reduces quantity', () => {
    const r = makeRegistry({ day: 1 });
    addItem(r, 'rugbrod', 2);
    expect(hasItem(r, 'rugbrod', 2)).toBe(true);

    useItem(r, 'rugbrod');
    expect(r.get(RK.ATE_TODAY)).toBe(true);
    expect(r.get(RK.INVENTORY)[0].quantity).toBe(1);

    useItem(r, 'rugbrod');
    expect(r.get(RK.INVENTORY)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: add food → advance days → spoilage → notification
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — spoilage notification appears', () => {
  it('spoils rugbrod after spoilsAfter days and emits notification', () => {
    const r = makeRegistry({ day: 1 });
    addItem(r, 'rugbrod', 1);

    const notifications = [];
    r.events.on(ITEM_SPOILED, e => notifications.push(e));

    // Day 6: age = 5 >= spoilsAfter (5) → should spoil
    processSpoilage(r, 6);
    expect(notifications).toHaveLength(1);
    expect(notifications[0].message).toMatch(/Rugbrød/);
    expect(r.get(RK.INVENTORY)).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: filter by category after multiple adds
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — category filter after multiple adds', () => {
  it('shows only food items when food tab is selected', () => {
    const r = makeRegistry({ day: 1 });
    addItem(r, 'rugbrod',   1);
    addItem(r, 'milk',      1);
    addItem(r, 'vitamin_d', 5);
    addItem(r, 'rejsekort', 1);

    const foodItems = getItemsByCategory(r, 'food');
    expect(foodItems).toHaveLength(2);
    expect(foodItems.every(e => getItemData(e.itemId).category === 'food')).toBe(true);

    const allItems = getItemsByCategory(r, 'all');
    expect(allItems).toHaveLength(4);
  });
});
