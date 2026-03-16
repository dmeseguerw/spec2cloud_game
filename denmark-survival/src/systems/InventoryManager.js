/**
 * src/systems/InventoryManager.js
 * Manages the player's inventory — adding, removing, stacking, using items,
 * food spoilage, freshness calculation, and the pant (bottle-return) system.
 *
 * Inventory state is stored in the Phaser registry under the INVENTORY key
 * as an array of entries: { itemId, quantity, acquiredDay, spoilsOnDay? }
 *
 * Pant bottles are stored in the PANT_BOTTLES key as an array of
 * { itemId, pantValue } objects (max 10).
 *
 * Emits: ITEM_ADDED, ITEM_REMOVED, ITEM_USED, ITEM_SPOILED, PANT_RETURNED
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  ITEM_ADDED,
  ITEM_REMOVED,
  ITEM_USED,
  ITEM_SPOILED,
  PANT_RETURNED,
} from '../constants/Events.js';
import { grantXP } from './XPEngine.js';
import ITEMS_DATA from '../data/items.js';

// ─────────────────────────────────────────────────────────────────────────────
// Item data
// ─────────────────────────────────────────────────────────────────────────────

const ITEMS = ITEMS_DATA;

/** Fast lookup map: itemId → item definition. */
const ITEM_MAP = new Map(ITEMS.map(item => [item.id, item]));

/** Maximum number of pant bottles that can be accumulated. */
export const MAX_PANT_BOTTLES = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Freshness thresholds
// ─────────────────────────────────────────────────────────────────────────────

export const FRESHNESS_FRESH        = 'fresh';         // 0–50 % of spoilsAfter
export const FRESHNESS_GETTING_OLD  = 'getting_old';   // 50–80 %
export const FRESHNESS_ABOUT_TO_SPOIL = 'about_to_spoil'; // 80–100 %

// ─────────────────────────────────────────────────────────────────────────────
// Item data helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the static item definition for a given id, or null if not found.
 *
 * @param {string} itemId
 * @returns {object|null}
 */
export function getItemData(itemId) {
  return ITEM_MAP.get(itemId) ?? null;
}

/**
 * Return all item definitions.
 *
 * @returns {object[]}
 */
export function getAllItems() {
  return ITEMS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Inventory CRUD
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add `quantity` of `itemId` to the inventory.
 * - Stackable items are merged up to maxStack.
 * - Non-stackable items get one entry per unit.
 * - Emits ITEM_ADDED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} itemId
 * @param {number} [quantity=1]
 * @returns {boolean} False if the item definition does not exist.
 */
export function addItem(registry, itemId, quantity = 1) {
  const itemData = getItemData(itemId);
  if (!itemData) return false;

  const inventory   = registry.get(RK.INVENTORY) ?? [];
  const currentDay  = registry.get(RK.CURRENT_DAY) ?? 1;

  if (itemData.stackable) {
    const existing = inventory.find(e => e.itemId === itemId);
    if (existing) {
      const newQty  = Math.min(existing.quantity + quantity, itemData.maxStack);
      const updated = inventory.map(e =>
        e.itemId === itemId ? { ...e, quantity: newQty } : e,
      );
      registry.set(RK.INVENTORY, updated);
    } else {
      const qty   = Math.min(quantity, itemData.maxStack);
      const entry = _createEntry(itemId, qty, currentDay, itemData);
      registry.set(RK.INVENTORY, [...inventory, entry]);
    }
  } else {
    // Non-stackable: one entry per unit
    const newEntries = [];
    for (let i = 0; i < quantity; i++) {
      newEntries.push(_createEntry(itemId, 1, currentDay, itemData));
    }
    registry.set(RK.INVENTORY, [...inventory, ...newEntries]);
  }

  registry.events.emit(ITEM_ADDED, { itemId, quantity, itemData });
  return true;
}

/**
 * Remove `quantity` of `itemId` from the inventory.
 * Removes the entry entirely when quantity reaches zero.
 * Emits ITEM_REMOVED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} itemId
 * @param {number} [quantity=1]
 * @returns {boolean} False if the item is not in the inventory.
 */
export function removeItem(registry, itemId, quantity = 1) {
  const inventory = registry.get(RK.INVENTORY) ?? [];
  const entry     = inventory.find(e => e.itemId === itemId);
  if (!entry) return false;

  if (entry.quantity <= quantity) {
    registry.set(RK.INVENTORY, inventory.filter(e => e.itemId !== itemId));
  } else {
    registry.set(RK.INVENTORY, inventory.map(e =>
      e.itemId === itemId ? { ...e, quantity: e.quantity - quantity } : e,
    ));
  }

  registry.events.emit(ITEM_REMOVED, { itemId, quantity });
  return true;
}

/**
 * Check whether the inventory contains at least `minQuantity` of `itemId`.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} itemId
 * @param {number} [minQuantity=1]
 * @returns {boolean}
 */
export function hasItem(registry, itemId, minQuantity = 1) {
  const inventory = registry.get(RK.INVENTORY) ?? [];
  const entry     = inventory.find(e => e.itemId === itemId);
  return entry ? entry.quantity >= minQuantity : false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Item usage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Use one unit of `itemId`:
 *  1. Verify the item is in the inventory and is usable.
 *  2. Apply its useEffect to the registry.
 *  3. Decrement the stack by 1 (remove if empty).
 *  4. Emit ITEM_USED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} itemId
 * @returns {{ success: boolean, reason?: string, effectResult?: object }}
 */
export function useItem(registry, itemId) {
  if (!hasItem(registry, itemId, 1)) {
    return { success: false, reason: 'not_in_inventory' };
  }

  const itemData = getItemData(itemId);
  if (!itemData) return { success: false, reason: 'unknown_item' };
  if (!itemData.usable) return { success: false, reason: 'not_usable' };

  const effectResult = _applyEffect(registry, itemData);

  // Add pant bottle if this item has pant value
  if (itemData.pantValue && itemData.pantValue > 0) {
    _addPantBottle(registry, itemId, itemData.pantValue);
  }

  removeItem(registry, itemId, 1);

  registry.events.emit(ITEM_USED, { itemId, itemData, effectResult });
  return { success: true, effectResult };
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return inventory entries filtered by `category`.
 * Pass `'all'` to return the full inventory.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} category - 'all' | 'food' | 'health' | 'transport' | 'document' | 'collectible'
 * @returns {Array<object>}
 */
export function getItemsByCategory(registry, category) {
  const inventory = registry.get(RK.INVENTORY) ?? [];
  if (category === 'all') return inventory;
  return inventory.filter(entry => {
    const data = getItemData(entry.itemId);
    return data && data.category === category;
  });
}

/**
 * Return the total item count across all stacks.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {number}
 */
export function getInventoryCount(registry) {
  const inventory = registry.get(RK.INVENTORY) ?? [];
  return inventory.reduce((total, entry) => total + (entry.quantity || 1), 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Food spoilage
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check all perishable items and remove those that have expired.
 * An item expires when `currentDay - acquiredDay >= spoilsAfter`.
 * Emits ITEM_SPOILED for each removed item.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} currentDay - The current in-game day number.
 * @returns {Array<object>} The spoiled inventory entries that were removed.
 */
export function processSpoilage(registry, currentDay) {
  const inventory = registry.get(RK.INVENTORY) ?? [];
  if (!Array.isArray(inventory) || inventory.length === 0) return [];

  const spoiled   = [];
  const remaining = [];

  for (const entry of inventory) {
    const data = getItemData(entry.itemId);
    if (
      data &&
      data.spoilsAfter !== null &&
      data.spoilsAfter !== undefined &&
      (currentDay - entry.acquiredDay) >= data.spoilsAfter
    ) {
      spoiled.push(entry);
      registry.events.emit(ITEM_SPOILED, {
        itemId:   entry.itemId,
        itemData: data,
        message:  `Your ${data.name} has gone bad!`,
      });
    } else {
      remaining.push(entry);
    }
  }

  if (spoiled.length > 0) {
    registry.set(RK.INVENTORY, remaining);
  }

  return spoiled;
}

/**
 * Calculate the freshness status of a perishable inventory entry.
 * Returns null for non-perishable items.
 *
 * @param {object} entry      - An inventory entry ({ itemId, acquiredDay, ... }).
 * @param {number} currentDay - The current in-game day number.
 * @returns {{ status: string, color: string, daysLeft: number }|null}
 */
export function getFreshnessStatus(entry, currentDay) {
  const data = getItemData(entry.itemId);
  if (!data || data.spoilsAfter === null || data.spoilsAfter === undefined) {
    return null;
  }

  const age     = currentDay - entry.acquiredDay;
  const ratio   = age / data.spoilsAfter;
  const daysLeft = Math.max(0, data.spoilsAfter - age);

  if (ratio < 0.5)  return { status: FRESHNESS_FRESH,          color: 'green',  daysLeft };
  if (ratio < 0.8)  return { status: FRESHNESS_GETTING_OLD,    color: 'yellow', daysLeft };
  return             { status: FRESHNESS_ABOUT_TO_SPOIL,  color: 'red',    daysLeft };
}

// ─────────────────────────────────────────────────────────────────────────────
// Pant (bottle-return) system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all accumulated pant bottles at the pantalon machine.
 *  - Sums the DKK value of each bottle.
 *  - Credits PLAYER_MONEY.
 *  - Grants +5 XP.
 *  - Clears PANT_BOTTLES.
 *  - Emits PANT_RETURNED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ success: boolean, reason?: string, dkk: number, bottles: number, xp: number }}
 */
export function returnPant(registry) {
  const pantBottles = registry.get(RK.PANT_BOTTLES) ?? [];
  if (!Array.isArray(pantBottles) || pantBottles.length === 0) {
    return { success: false, reason: 'no_pant', dkk: 0, bottles: 0, xp: 0 };
  }

  const totalDkk = pantBottles.reduce((sum, b) => sum + (b.pantValue ?? 0), 0);

  const money = registry.get(RK.PLAYER_MONEY) ?? 0;
  registry.set(RK.PLAYER_MONEY, money + totalDkk);
  registry.set(RK.PANT_BOTTLES, []);

  grantXP(registry, 5, 'Returned pant bottles', 'Economy');

  registry.events.emit(PANT_RETURNED, {
    dkk:     totalDkk,
    bottles: pantBottles.length,
    xp:      5,
  });

  return { success: true, dkk: totalDkk, bottles: pantBottles.length, xp: 5 };
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a new inventory entry object, attaching spoilsOnDay when perishable.
 * (spoilsOnDay is kept for compatibility with DayCycleEngine._processFoodSpoilage.)
 */
function _createEntry(itemId, quantity, acquiredDay, itemData) {
  const entry = { itemId, quantity, acquiredDay };
  if (itemData.spoilsAfter !== null && itemData.spoilsAfter !== undefined) {
    entry.spoilsOnDay = acquiredDay + itemData.spoilsAfter;
  }
  return entry;
}

/**
 * Apply the useEffect of an item to the registry and return a result descriptor.
 */
function _applyEffect(registry, itemData) {
  switch (itemData.useEffect) {
    case 'eat': {
      registry.set(RK.ATE_TODAY, true);
      return { type: 'eat' };
    }
    case 'vitamin_d': {
      registry.set(RK.VITAMIN_D_TAKEN, true);
      return { type: 'vitamin_d' };
    }
    case 'cold_medicine': {
      registry.set(RK.SICK_RECOVERY_BOOST, true);
      return { type: 'cold_medicine' };
    }
    case 'energy_drink': {
      const current = registry.get(RK.PLAYER_ENERGY) ?? 100;
      const added   = 15;
      registry.set(RK.PLAYER_ENERGY, Math.min(100, current + added));
      return { type: 'energy_drink', energyAdded: added };
    }
    case 'bike_repair': {
      registry.set(RK.BIKE_REPAIRED, true);
      return { type: 'bike_repair' };
    }
    default:
      return { type: itemData.useEffect ?? 'unknown' };
  }
}

/**
 * Add a pant bottle to the PANT_BOTTLES registry (up to MAX_PANT_BOTTLES).
 */
function _addPantBottle(registry, itemId, pantValue) {
  const bottles = registry.get(RK.PANT_BOTTLES) ?? [];
  if (bottles.length >= MAX_PANT_BOTTLES) return;
  registry.set(RK.PANT_BOTTLES, [...bottles, { itemId, pantValue }]);
}
