/**
 * src/systems/WorldCollectibleSystem.js
 * Pure functions for world-collectible item management.
 *
 * Handles: manifest evaluation, pickup flow, one-time tracking, XP calculation,
 * and pickup sound selection.
 *
 * State is persisted in the registry under COLLECTED_ITEMS (serialised array of
 * collected one-time collectible IDs) and WORLD_COLLECTIBLES (active manifest).
 *
 * Emits: 'xp:grant' (amount) via registry.events
 */

import * as RK from '../constants/RegistryKeys.js';
import { addItem, getItemData } from './InventoryManager.js';
import {
  SFX_PICKUP_PANT,
  SFX_PICKUP_DOCUMENT,
  SFX_PICKUP_GENERAL,
} from '../constants/AudioKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum number of collectibles visible simultaneously per zone. */
export const MAX_COLLECTIBLES_PER_ZONE = 5;

/** Minimum XP granted per pickup. */
export const XP_MIN = 1;

/** Maximum XP granted per pickup. */
export const XP_MAX = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Registry helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the array of collected one-time collectible IDs from the registry.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {string[]}
 */
export function getCollectedItems(registry) {
  return registry.get(RK.COLLECTED_ITEMS) ?? [];
}

/**
 * Check whether a one-time collectible has already been picked up.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} collectibleId - The collectible instance ID (not itemId).
 * @returns {boolean}
 */
export function isCollected(registry, collectibleId) {
  return getCollectedItems(registry).includes(collectibleId);
}

// ─────────────────────────────────────────────────────────────────────────────
// Manifest evaluation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Given a collectible manifest and the set of already-collected one-time IDs,
 * return the array of collectibles that should be active in the world today.
 *
 * Rules:
 *  - One-time items whose `id` appears in `collectedIds` are skipped.
 *  - At most MAX_COLLECTIBLES_PER_ZONE collectibles are included per zone.
 *    Items without a `zone` property are grouped under a '_default' bucket.
 *
 * @param {object[]} manifest    - Array of collectible definition objects.
 * @param {string[]} collectedIds - IDs that have already been collected.
 * @returns {object[]} Active collectible definitions.
 */
export function evaluateManifest(manifest, collectedIds) {
  const collected = new Set(collectedIds);
  const byZone = {};

  for (const def of manifest) {
    if (def.oneTime && collected.has(def.id)) continue;

    const zone = def.zone ?? '_default';
    if (!byZone[zone]) byZone[zone] = [];

    if (byZone[zone].length < MAX_COLLECTIBLES_PER_ZONE) {
      byZone[zone].push(def);
    }
  }

  return Object.values(byZone).flat();
}

// ─────────────────────────────────────────────────────────────────────────────
// Sound & XP helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the appropriate pickup sound AudioKey for an item.
 * Priority: pantValue > 0 → pant sound, category === 'document' → document sound,
 * otherwise → general sound.
 *
 * @param {object|null} itemData - Item definition from items.json (may be null).
 * @returns {string} AudioKey constant.
 */
export function getPickupSound(itemData) {
  if (!itemData) return SFX_PICKUP_GENERAL;
  if (itemData.pantValue > 0) return SFX_PICKUP_PANT;
  if (itemData.category === 'document') return SFX_PICKUP_DOCUMENT;
  return SFX_PICKUP_GENERAL;
}

/**
 * Return the XP amount to grant when picking up an item.
 * Scales with `pantValue`: 0 → 1 XP, 1 → 3 XP, ≥2 → 5 XP.
 *
 * @param {number} pantValue - The item's pantValue (0 if not applicable).
 * @returns {number}
 */
export function getXPForItem(pantValue) {
  if (!pantValue || pantValue <= 0) return XP_MIN;
  if (pantValue >= 2) return XP_MAX;
  return 3;
}

// ─────────────────────────────────────────────────────────────────────────────
// Pickup flow
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a collectible pickup:
 *  1. Calls `InventoryManager.addItem` to add the item.
 *  2. Records the collectible ID in COLLECTED_ITEMS (if oneTime).
 *  3. Emits 'xp:grant' with the calculated XP amount.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} collectibleDef - The collectible definition object.
 * @param {string} collectibleDef.id        - Unique instance ID.
 * @param {string} collectibleDef.itemId    - Item ID in items.json.
 * @param {number} [collectibleDef.quantity=1]
 * @param {boolean} [collectibleDef.oneTime=false]
 * @param {string|null} [collectibleDef.tooltip]
 * @returns {{ success: boolean, xpGained: number, firstPickup: boolean }}
 */
export function collectItem(registry, collectibleDef) {
  const { id, itemId, quantity = 1, oneTime = false, tooltip = null } = collectibleDef;

  const success = addItem(registry, itemId, quantity);
  if (!success) return { success: false, xpGained: 0, firstPickup: false };

  // Persist one-time collection
  if (oneTime) {
    const collected = getCollectedItems(registry);
    if (!collected.includes(id)) {
      registry.set(RK.COLLECTED_ITEMS, [...collected, id]);
    }
  }

  // Determine XP
  const itemData = getItemData(itemId);
  const pantValue = itemData?.pantValue ?? 0;
  const xpGained = getXPForItem(pantValue);

  registry.events.emit('xp:grant', xpGained);

  // firstPickup is true when there is a tooltip (indicates flavour text)
  const firstPickup = tooltip != null;

  return { success: true, xpGained, firstPickup };
}
