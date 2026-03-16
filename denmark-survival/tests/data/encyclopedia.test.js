/**
 * tests/data/encyclopedia.test.js
 * Unit tests for the encyclopedia data module.
 *
 * Covers:
 *  - Entry count per category and overall
 *  - Schema validation for all entries
 *  - Category assignment validity
 *  - Related entry reference integrity
 *  - Trigger structure validation
 *  - Starter entry existence
 *  - Helper function correctness
 */

import { describe, it, expect } from 'vitest';
import {
  ENCYCLOPEDIA_DATA,
  CATEGORIES,
  CATEGORY_META,
  STARTER_ENTRY_IDS,
  getEntriesByCategory,
  getEntryById,
  getAllEntryIds,
  getCategoryCounts,
} from '../../src/data/encyclopedia.js';

// ─────────────────────────────────────────────────────────────────────────────
// Valid trigger types (from task spec)
// ─────────────────────────────────────────────────────────────────────────────
const VALID_TRIGGER_TYPES = [
  'npc_conversation',
  'encounter',
  'area_visit',
  'activity_complete',
  'skill_milestone',
  'season_change',
  'item_use',
  'mistake',
];

// ─────────────────────────────────────────────────────────────────────────────
// Entry count & MVP minimum
// ─────────────────────────────────────────────────────────────────────────────

describe('ENCYCLOPEDIA_DATA — entry counts', () => {
  it('contains at least 50 entries (MVP minimum)', () => {
    expect(ENCYCLOPEDIA_DATA.length).toBeGreaterThanOrEqual(50);
  });

  it('has entries in all 5 categories', () => {
    for (const cat of CATEGORIES) {
      const count = ENCYCLOPEDIA_DATA.filter(e => e.category === cat).length;
      expect(count, `Category "${cat}" has no entries`).toBeGreaterThan(0);
    }
  });

  it('culture category has ~24 entries', () => {
    expect(getEntriesByCategory('culture').length).toBe(24);
  });

  it('language category has ~20 entries', () => {
    expect(getEntriesByCategory('language').length).toBe(20);
  });

  it('places category has ~14 entries', () => {
    expect(getEntriesByCategory('places').length).toBe(14);
  });

  it('activities category has ~16 entries', () => {
    expect(getEntriesByCategory('activities').length).toBe(16);
  });

  it('tips category has ~12 entries', () => {
    expect(getEntriesByCategory('tips').length).toBe(12);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Schema validation
// ─────────────────────────────────────────────────────────────────────────────

describe('ENCYCLOPEDIA_DATA — schema validation', () => {
  const requiredFields = ['id', 'title', 'category', 'body', 'icon', 'triggers', 'relatedEntries', 'sourceText'];

  it('every entry has all required fields', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      for (const field of requiredFields) {
        expect(entry, `Entry "${entry.id}" is missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every id is a non-empty string', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(typeof entry.id).toBe('string');
      expect(entry.id.length).toBeGreaterThan(0);
    }
  });

  it('every title is a non-empty string', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(typeof entry.title).toBe('string');
      expect(entry.title.length).toBeGreaterThan(0);
    }
  });

  it('every body has 3-6 sentences (contains at least 2 periods)', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(typeof entry.body).toBe('string');
      // Count sentence-ending punctuation
      const sentences = (entry.body.match(/[.!?]+/g) || []).length;
      expect(
        sentences,
        `Entry "${entry.id}" body should have 3-6 sentences but has ~${sentences}`
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('every icon is a non-empty string', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(typeof entry.icon).toBe('string');
      expect(entry.icon.length).toBeGreaterThan(0);
    }
  });

  it('every sourceText starts with "Learned from:"', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(
        entry.sourceText.startsWith('Learned from:'),
        `Entry "${entry.id}" sourceText should start with "Learned from:"`
      ).toBe(true);
    }
  });

  it('all entry ids are unique', () => {
    const ids = ENCYCLOPEDIA_DATA.map(e => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Category assignment
// ─────────────────────────────────────────────────────────────────────────────

describe('ENCYCLOPEDIA_DATA — category assignment', () => {
  it('every entry has a valid category', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(
        CATEGORIES,
        `Entry "${entry.id}" has invalid category "${entry.category}"`
      ).toContain(entry.category);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Trigger validation
// ─────────────────────────────────────────────────────────────────────────────

describe('ENCYCLOPEDIA_DATA — triggers', () => {
  it('every entry has at least one trigger', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(Array.isArray(entry.triggers)).toBe(true);
      expect(
        entry.triggers.length,
        `Entry "${entry.id}" has no triggers`
      ).toBeGreaterThan(0);
    }
  });

  it('every trigger has a valid type', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      for (const trigger of entry.triggers) {
        expect(
          VALID_TRIGGER_TYPES,
          `Entry "${entry.id}" has invalid trigger type "${trigger.type}"`
        ).toContain(trigger.type);
      }
    }
  });

  it('every trigger has a type field', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      for (const trigger of entry.triggers) {
        expect(typeof trigger.type).toBe('string');
        expect(trigger.type.length).toBeGreaterThan(0);
      }
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Related entry references
// ─────────────────────────────────────────────────────────────────────────────

describe('ENCYCLOPEDIA_DATA — related entries', () => {
  const allIds = new Set(ENCYCLOPEDIA_DATA.map(e => e.id));

  it('every relatedEntries array contains only valid entry IDs', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(Array.isArray(entry.relatedEntries)).toBe(true);
      for (const relId of entry.relatedEntries) {
        expect(
          allIds.has(relId),
          `Entry "${entry.id}" references non-existent related entry "${relId}"`
        ).toBe(true);
      }
    }
  });

  it('no entry references itself in relatedEntries', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(
        entry.relatedEntries.includes(entry.id),
        `Entry "${entry.id}" references itself`
      ).toBe(false);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Starter entries
// ─────────────────────────────────────────────────────────────────────────────

describe('STARTER_ENTRY_IDS', () => {
  it('contains at least 2 starter entries', () => {
    expect(STARTER_ENTRY_IDS.length).toBeGreaterThanOrEqual(2);
  });

  it('all starter entry IDs exist in the encyclopedia data', () => {
    const allIds = new Set(ENCYCLOPEDIA_DATA.map(e => e.id));
    for (const id of STARTER_ENTRY_IDS) {
      expect(allIds.has(id), `Starter entry "${id}" not found in data`).toBe(true);
    }
  });

  it('includes the apartment entry (Places)', () => {
    expect(STARTER_ENTRY_IDS).toContain('places_apartment');
  });

  it('includes the hej greeting entry (Language)', () => {
    expect(STARTER_ENTRY_IDS).toContain('lang_hej');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORIES constant
// ─────────────────────────────────────────────────────────────────────────────

describe('CATEGORIES', () => {
  it('contains exactly 5 categories', () => {
    expect(CATEGORIES).toHaveLength(5);
  });

  it('contains all expected categories', () => {
    expect(CATEGORIES).toContain('culture');
    expect(CATEGORIES).toContain('language');
    expect(CATEGORIES).toContain('places');
    expect(CATEGORIES).toContain('activities');
    expect(CATEGORIES).toContain('tips');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY_META
// ─────────────────────────────────────────────────────────────────────────────

describe('CATEGORY_META', () => {
  it('has metadata for every category', () => {
    for (const cat of CATEGORIES) {
      expect(CATEGORY_META).toHaveProperty(cat);
      expect(CATEGORY_META[cat]).toHaveProperty('label');
      expect(CATEGORY_META[cat]).toHaveProperty('icon');
      expect(CATEGORY_META[cat]).toHaveProperty('color');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Helper functions
// ─────────────────────────────────────────────────────────────────────────────

describe('getEntriesByCategory', () => {
  it('returns only entries of the given category', () => {
    const cultureEntries = getEntriesByCategory('culture');
    for (const entry of cultureEntries) {
      expect(entry.category).toBe('culture');
    }
  });

  it('returns empty array for unknown category', () => {
    expect(getEntriesByCategory('nonexistent')).toEqual([]);
  });
});

describe('getEntryById', () => {
  it('returns the correct entry', () => {
    const entry = getEntryById('culture_hygge');
    expect(entry).toBeDefined();
    expect(entry.title).toBe('Hygge: More Than Just Cozy');
  });

  it('returns undefined for unknown ID', () => {
    expect(getEntryById('nonexistent_id')).toBeUndefined();
  });
});

describe('getAllEntryIds', () => {
  it('returns an array of all entry IDs', () => {
    const ids = getAllEntryIds();
    expect(ids.length).toBe(ENCYCLOPEDIA_DATA.length);
    expect(ids).toContain('culture_hygge');
    expect(ids).toContain('lang_hej');
    expect(ids).toContain('places_apartment');
  });
});

describe('getCategoryCounts', () => {
  it('returns counts for all categories', () => {
    const counts = getCategoryCounts();
    for (const cat of CATEGORIES) {
      expect(typeof counts[cat]).toBe('number');
      expect(counts[cat]).toBeGreaterThan(0);
    }
  });

  it('sum of all category counts equals total entries', () => {
    const counts = getCategoryCounts();
    const sum = Object.values(counts).reduce((a, b) => a + b, 0);
    expect(sum).toBe(ENCYCLOPEDIA_DATA.length);
  });
});
