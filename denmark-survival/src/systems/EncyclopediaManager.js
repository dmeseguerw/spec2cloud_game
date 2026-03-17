/**
 * src/systems/EncyclopediaManager.js
 * Manages encyclopedia/codex state — entry discovery, progress tracking, and queries.
 *
 * The encyclopedia is passive: other systems (dialogue, encounters, day cycle, etc.)
 * call unlockEntry() when trigger conditions are met. This manager handles state,
 * XP rewards, and event emission.
 */

import * as RK from '../constants/RegistryKeys.js';
import { ENCYCLOPEDIA_UNLOCKED } from '../constants/Events.js';
import { grantXP } from './XPEngine.js';
import {
  ENCYCLOPEDIA_DATA,
  CATEGORIES,
  STARTER_ENTRY_IDS,
  getEntryById,
  getEntriesByCategory,
} from '../data/encyclopedia.js';

/** XP bonus granted on first discovery of an entry. */
export const DISCOVERY_XP_BONUS = 5;

/** Registry key for the encyclopedia category-completion flags. */
const CATEGORY_COMPLETE_KEY = 'encyclopedia_category_complete';

/**
 * Read ENCYCLOPEDIA_ENTRIES from the registry, always returning an Array.
 * Handles the case where old code accidentally stored a plain object.
 * @param {Phaser.Data.DataManager} registry
 * @returns {string[]}
 */
function _getEntries(registry) {
  const val = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
  if (Array.isArray(val)) return val;
  // Corrupted object format — repair by extracting truthy keys
  if (val && typeof val === 'object') return Object.keys(val).filter(k => val[k]);
  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialize the encyclopedia state for a new game.
 * Pre-populates starter entries and sets up the unlocked set.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 */
export function initializeEncyclopedia(registry) {
  const currentEntries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
  if (!currentEntries || currentEntries.length === 0) {
    registry.set(RK.ENCYCLOPEDIA_ENTRIES, [...STARTER_ENTRY_IDS]);
  }
  if (!registry.get(CATEGORY_COMPLETE_KEY)) {
    registry.set(CATEGORY_COMPLETE_KEY, {});
  }
}

/**
 * Unlock an encyclopedia entry. Idempotent — duplicate calls are ignored.
 *
 * On first discovery:
 *  - Adds entry ID to the unlocked set in the registry
 *  - Grants +5 XP discovery bonus
 *  - Emits ENCYCLOPEDIA_UNLOCKED event with entry data
 *  - Checks and flags category completion
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {string} entryId - ID of the entry to unlock.
 * @param {string} [source] - Description of what triggered the unlock.
 * @returns {{ unlocked: boolean, entry: object|null }} Result of the operation.
 */
export function unlockEntry(registry, entryId, source = '') {
  // Already unlocked — no-op
  if (isUnlocked(registry, entryId)) {
    return { unlocked: false, entry: null };
  }

  // Validate entry exists
  const entry = getEntryById(entryId);
  if (!entry) {
    return { unlocked: false, entry: null };
  }

  // Add to unlocked set
  const entries = _getEntries(registry);
  registry.set(RK.ENCYCLOPEDIA_ENTRIES, [...entries, entryId]);

  // Grant discovery XP bonus
  grantXP(registry, DISCOVERY_XP_BONUS, `Encyclopedia: ${entry.title}`, 'Encyclopedia');

  // Emit unlock event
  registry.events.emit(ENCYCLOPEDIA_UNLOCKED, {
    entryId,
    title: entry.title,
    category: entry.category,
    source: source || entry.sourceText,
  });

  // Check category completion
  _checkCategoryCompletion(registry, entry.category);

  return { unlocked: true, entry };
}

/**
 * Check if an entry has been discovered.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {string} entryId - Entry ID to check.
 * @returns {boolean}
 */
export function isUnlocked(registry, entryId) {
  return _getEntries(registry).includes(entryId);
}

/**
 * Get all unlocked entries, optionally filtered by category.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {string} [category] - Optional category filter.
 * @returns {Array<object>} Array of entry objects.
 */
export function getUnlockedEntries(registry, category) {
  const unlockedIds = _getEntries(registry);
  let entries = ENCYCLOPEDIA_DATA.filter(e => unlockedIds.includes(e.id));
  if (category) {
    entries = entries.filter(e => e.category === category);
  }
  return entries;
}

/**
 * Get progress for a specific category.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {string} category - Category name.
 * @returns {{ unlocked: number, total: number }}
 */
export function getCategoryProgress(registry, category) {
  const unlockedIds = _getEntries(registry);
  const allInCategory = getEntriesByCategory(category);
  const unlockedInCategory = allInCategory.filter(e => unlockedIds.includes(e.id));
  return {
    unlocked: unlockedInCategory.length,
    total: allInCategory.length,
  };
}

/**
 * Get overall discovery percentage.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @returns {number} Percentage (0–100) of entries discovered.
 */
export function getOverallProgress(registry) {
  const unlockedIds = _getEntries(registry);
  if (ENCYCLOPEDIA_DATA.length === 0) return 0;
  // Only count IDs that correspond to actual entries
  const validUnlocked = unlockedIds.filter(id => getEntryById(id));
  return Math.round((validUnlocked.length / ENCYCLOPEDIA_DATA.length) * 100);
}

/**
 * Check if all entries in a category are unlocked.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {string} category - Category name.
 * @returns {boolean}
 */
export function isCategoryComplete(registry, category) {
  const progress = getCategoryProgress(registry, category);
  return progress.total > 0 && progress.unlocked === progress.total;
}

/**
 * Get the completion flags for all categories.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @returns {Object<string, boolean>} Map of category → completion status.
 */
export function getCategoryCompletionFlags(registry) {
  return registry.get(CATEGORY_COMPLETE_KEY) || {};
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if a category is now complete and emit a completion event if so.
 * Only fires the event once per category (tracked via registry).
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} category
 */
function _checkCategoryCompletion(registry, category) {
  const flags = registry.get(CATEGORY_COMPLETE_KEY) || {};
  if (flags[category]) return; // Already flagged

  if (isCategoryComplete(registry, category)) {
    flags[category] = true;
    registry.set(CATEGORY_COMPLETE_KEY, flags);
    registry.events.emit(ENCYCLOPEDIA_UNLOCKED, {
      entryId: null,
      title: `${category.charAt(0).toUpperCase() + category.slice(1)} Complete!`,
      category,
      source: 'category_complete',
      isCategoryComplete: true,
    });
  }
}
