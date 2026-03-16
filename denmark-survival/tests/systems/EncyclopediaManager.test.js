/**
 * tests/systems/EncyclopediaManager.test.js
 * Unit tests for the EncyclopediaManager system.
 *
 * Covers:
 *  - unlockEntry() adds entry to unlocked set
 *  - unlockEntry() is idempotent (no duplicate unlock)
 *  - unlockEntry() grants +5 XP on first unlock only
 *  - isUnlocked() returns correct boolean
 *  - getCategoryProgress() returns accurate counts
 *  - getOverallProgress() percentage calculation
 *  - isCategoryComplete() detects 100% in category
 *  - initializeEncyclopedia() sets up starter entries
 *  - Category completion event fires correctly
 *
 * Coverage target: ≥85% for EncyclopediaManager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  unlockEntry,
  isUnlocked,
  getUnlockedEntries,
  getCategoryProgress,
  getOverallProgress,
  isCategoryComplete,
  initializeEncyclopedia,
  getCategoryCompletionFlags,
  DISCOVERY_XP_BONUS,
} from '../../src/systems/EncyclopediaManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { ENCYCLOPEDIA_UNLOCKED } from '../../src/constants/Events.js';
import {
  ENCYCLOPEDIA_DATA,
  STARTER_ENTRY_IDS,
  getEntriesByCategory,
} from '../../src/data/encyclopedia.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Create a fresh registry with empty encyclopedia state and basic XP state. */
function createRegistry() {
  const registry = new MockRegistry();
  registry.set(RK.ENCYCLOPEDIA_ENTRIES, []);
  registry.set(RK.PLAYER_XP, 0);
  registry.set(RK.PLAYER_LEVEL, 1);
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// initializeEncyclopedia
// ─────────────────────────────────────────────────────────────────────────────

describe('initializeEncyclopedia', () => {
  it('populates starter entries when encyclopedia is empty', () => {
    const registry = createRegistry();
    initializeEncyclopedia(registry);

    const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
    for (const id of STARTER_ENTRY_IDS) {
      expect(entries).toContain(id);
    }
  });

  it('does not overwrite existing entries', () => {
    const registry = createRegistry();
    registry.set(RK.ENCYCLOPEDIA_ENTRIES, ['culture_hygge']);
    initializeEncyclopedia(registry);

    const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
    expect(entries).toContain('culture_hygge');
  });

  it('sets up category completion flags', () => {
    const registry = createRegistry();
    initializeEncyclopedia(registry);

    const flags = getCategoryCompletionFlags(registry);
    expect(flags).toBeDefined();
    expect(typeof flags).toBe('object');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// unlockEntry
// ─────────────────────────────────────────────────────────────────────────────

describe('unlockEntry', () => {
  it('adds entry to unlocked set', () => {
    const registry = createRegistry();
    const result = unlockEntry(registry, 'culture_hygge');

    expect(result.unlocked).toBe(true);
    expect(result.entry).toBeDefined();
    expect(result.entry.id).toBe('culture_hygge');

    const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
    expect(entries).toContain('culture_hygge');
  });

  it('is idempotent — duplicate unlock returns false', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'culture_hygge');
    const result = unlockEntry(registry, 'culture_hygge');

    expect(result.unlocked).toBe(false);
    expect(result.entry).toBeNull();

    // Entry should appear only once
    const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
    const count = entries.filter(id => id === 'culture_hygge').length;
    expect(count).toBe(1);
  });

  it('grants +5 XP on first unlock only', () => {
    const registry = createRegistry();
    registry.set(RK.PLAYER_XP, 0);

    unlockEntry(registry, 'culture_hygge');
    const xpAfterFirst = registry.get(RK.PLAYER_XP);
    expect(xpAfterFirst).toBe(DISCOVERY_XP_BONUS);

    // Second unlock should NOT grant additional XP
    unlockEntry(registry, 'culture_hygge');
    const xpAfterDup = registry.get(RK.PLAYER_XP);
    expect(xpAfterDup).toBe(DISCOVERY_XP_BONUS);
  });

  it('emits ENCYCLOPEDIA_UNLOCKED event on first unlock', () => {
    const registry = createRegistry();
    const handler = vi.fn();
    registry.events.on(ENCYCLOPEDIA_UNLOCKED, handler);

    unlockEntry(registry, 'culture_hygge', 'test source');

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.entryId).toBe('culture_hygge');
    expect(payload.title).toBe('Hygge: More Than Just Cozy');
    expect(payload.category).toBe('culture');
  });

  it('does not emit event on duplicate unlock', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'culture_hygge');

    const handler = vi.fn();
    registry.events.on(ENCYCLOPEDIA_UNLOCKED, handler);

    unlockEntry(registry, 'culture_hygge');
    expect(handler).not.toHaveBeenCalled();
  });

  it('returns false for non-existent entry ID', () => {
    const registry = createRegistry();
    const result = unlockEntry(registry, 'nonexistent_entry');

    expect(result.unlocked).toBe(false);
    expect(result.entry).toBeNull();
  });

  it('uses entry sourceText when no source provided', () => {
    const registry = createRegistry();
    const handler = vi.fn();
    registry.events.on(ENCYCLOPEDIA_UNLOCKED, handler);

    unlockEntry(registry, 'lang_hej');

    const payload = handler.mock.calls[0][0];
    expect(payload.source).toContain('Learned from:');
  });

  it('uses custom source when provided', () => {
    const registry = createRegistry();
    const handler = vi.fn();
    registry.events.on(ENCYCLOPEDIA_UNLOCKED, handler);

    unlockEntry(registry, 'lang_hej', 'Custom discovery source');

    const payload = handler.mock.calls[0][0];
    expect(payload.source).toBe('Custom discovery source');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isUnlocked
// ─────────────────────────────────────────────────────────────────────────────

describe('isUnlocked', () => {
  it('returns false for entries not yet unlocked', () => {
    const registry = createRegistry();
    expect(isUnlocked(registry, 'culture_hygge')).toBe(false);
  });

  it('returns true for unlocked entries', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'culture_hygge');
    expect(isUnlocked(registry, 'culture_hygge')).toBe(true);
  });

  it('returns false when registry has no encyclopedia data', () => {
    const registry = new MockRegistry();
    expect(isUnlocked(registry, 'culture_hygge')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getUnlockedEntries
// ─────────────────────────────────────────────────────────────────────────────

describe('getUnlockedEntries', () => {
  it('returns empty array when no entries unlocked', () => {
    const registry = createRegistry();
    expect(getUnlockedEntries(registry)).toEqual([]);
  });

  it('returns all unlocked entries', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'culture_hygge');
    unlockEntry(registry, 'lang_hej');

    const entries = getUnlockedEntries(registry);
    expect(entries).toHaveLength(2);
    const ids = entries.map(e => e.id);
    expect(ids).toContain('culture_hygge');
    expect(ids).toContain('lang_hej');
  });

  it('filters by category when specified', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'culture_hygge');
    unlockEntry(registry, 'lang_hej');
    unlockEntry(registry, 'places_apartment');

    const cultureEntries = getUnlockedEntries(registry, 'culture');
    expect(cultureEntries).toHaveLength(1);
    expect(cultureEntries[0].id).toBe('culture_hygge');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCategoryProgress
// ─────────────────────────────────────────────────────────────────────────────

describe('getCategoryProgress', () => {
  it('returns 0 unlocked when no entries discovered', () => {
    const registry = createRegistry();
    const progress = getCategoryProgress(registry, 'culture');
    expect(progress.unlocked).toBe(0);
    expect(progress.total).toBeGreaterThan(0);
  });

  it('returns accurate count after unlocking entries', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'culture_hygge');
    unlockEntry(registry, 'culture_janteloven');

    const progress = getCategoryProgress(registry, 'culture');
    expect(progress.unlocked).toBe(2);
    expect(progress.total).toBe(getEntriesByCategory('culture').length);
  });

  it('does not count entries from other categories', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'lang_hej');

    const cultureProgress = getCategoryProgress(registry, 'culture');
    expect(cultureProgress.unlocked).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getOverallProgress
// ─────────────────────────────────────────────────────────────────────────────

describe('getOverallProgress', () => {
  it('returns 0% when no entries unlocked', () => {
    const registry = createRegistry();
    expect(getOverallProgress(registry)).toBe(0);
  });

  it('returns correct percentage', () => {
    const registry = createRegistry();
    // Unlock a known number of entries
    unlockEntry(registry, 'culture_hygge');
    unlockEntry(registry, 'lang_hej');

    const pct = getOverallProgress(registry);
    const expected = Math.round((2 / ENCYCLOPEDIA_DATA.length) * 100);
    expect(pct).toBe(expected);
  });

  it('returns 100% when all entries unlocked', () => {
    const registry = createRegistry();
    for (const entry of ENCYCLOPEDIA_DATA) {
      unlockEntry(registry, entry.id);
    }
    expect(getOverallProgress(registry)).toBe(100);
  });

  it('ignores invalid IDs in the unlocked set', () => {
    const registry = createRegistry();
    registry.set(RK.ENCYCLOPEDIA_ENTRIES, ['invalid_id_xyz']);
    expect(getOverallProgress(registry)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isCategoryComplete
// ─────────────────────────────────────────────────────────────────────────────

describe('isCategoryComplete', () => {
  it('returns false when category is not complete', () => {
    const registry = createRegistry();
    unlockEntry(registry, 'tips_bike_lights');
    expect(isCategoryComplete(registry, 'tips')).toBe(false);
  });

  it('returns true when all entries in category are unlocked', () => {
    const registry = createRegistry();
    const tipsEntries = getEntriesByCategory('tips');
    for (const entry of tipsEntries) {
      unlockEntry(registry, entry.id);
    }
    expect(isCategoryComplete(registry, 'tips')).toBe(true);
  });

  it('emits category completion event', () => {
    const registry = createRegistry();
    const handler = vi.fn();
    registry.events.on(ENCYCLOPEDIA_UNLOCKED, handler);

    const tipsEntries = getEntriesByCategory('tips');
    for (const entry of tipsEntries) {
      unlockEntry(registry, entry.id);
    }

    // Find the completion event (last call with isCategoryComplete === true)
    const completionCalls = handler.mock.calls.filter(
      call => call[0].isCategoryComplete === true && call[0].category === 'tips'
    );
    expect(completionCalls.length).toBe(1);
    expect(completionCalls[0][0].source).toBe('category_complete');
  });

  it('emits category completion event only once', () => {
    const registry = createRegistry();

    // Unlock all tips entries
    const tipsEntries = getEntriesByCategory('tips');
    for (const entry of tipsEntries) {
      unlockEntry(registry, entry.id);
    }

    // Register handler after completion
    const handler = vi.fn();
    registry.events.on(ENCYCLOPEDIA_UNLOCKED, handler);

    // Attempt to unlock a tips entry again (should be idempotent)
    unlockEntry(registry, tipsEntries[0].id);

    // No events should fire for already-unlocked entry
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVERY_XP_BONUS constant
// ─────────────────────────────────────────────────────────────────────────────

describe('DISCOVERY_XP_BONUS', () => {
  it('equals 5', () => {
    expect(DISCOVERY_XP_BONUS).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('Edge cases', () => {
  it('handles missing encyclopedia_entries in registry', () => {
    const registry = new MockRegistry();
    registry.set(RK.PLAYER_XP, 0);
    registry.set(RK.PLAYER_LEVEL, 1);

    // Should not throw
    expect(isUnlocked(registry, 'culture_hygge')).toBe(false);
    expect(getOverallProgress(registry)).toBe(0);
    expect(getCategoryProgress(registry, 'culture').unlocked).toBe(0);
  });

  it('unlockEntry works when encyclopedia_entries is not set', () => {
    const registry = new MockRegistry();
    registry.set(RK.PLAYER_XP, 0);
    registry.set(RK.PLAYER_LEVEL, 1);

    const result = unlockEntry(registry, 'culture_hygge');
    expect(result.unlocked).toBe(true);
    expect(isUnlocked(registry, 'culture_hygge')).toBe(true);
  });

  it('multiple entries can be unlocked in sequence', () => {
    const registry = createRegistry();

    unlockEntry(registry, 'culture_hygge');
    unlockEntry(registry, 'culture_janteloven');
    unlockEntry(registry, 'lang_hej');
    unlockEntry(registry, 'places_apartment');

    expect(getUnlockedEntries(registry)).toHaveLength(4);
    expect(getOverallProgress(registry)).toBeGreaterThan(0);
  });
});
