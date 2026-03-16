/**
 * tests/systems/XPLog.test.js
 * Unit tests for XPLog.
 * Coverage target: ≥85% of src/systems/XPLog.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { XPLog } from '../../src/systems/XPLog.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry() {
  return new MockRegistry();
}

function makeEntry(overrides = {}) {
  return {
    amount:    overrides.amount    ?? 10,
    source:    overrides.source    ?? 'Test',
    category:  overrides.category  ?? 'Daily Life',
    timestamp: overrides.timestamp ?? Date.now(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// addEntry / getDailyEntries
// ─────────────────────────────────────────────────────────────────────────────

describe('XPLog.addEntry and getDailyEntries', () => {
  it('starts with an empty log', () => {
    const registry = createRegistry();
    expect(XPLog.getDailyEntries(registry)).toEqual([]);
  });

  it('adds a single entry to the log', () => {
    const registry = createRegistry();
    const entry    = makeEntry({ amount: 20, source: 'Bike ride', category: 'Transportation' });
    XPLog.addEntry(registry, entry);

    const entries = XPLog.getDailyEntries(registry);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ amount: 20, source: 'Bike ride', category: 'Transportation' });
  });

  it('adds multiple entries and preserves order', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 10, source: 'A' }));
    XPLog.addEntry(registry, makeEntry({ amount: -5, source: 'B' }));
    XPLog.addEntry(registry, makeEntry({ amount: 20, source: 'C' }));

    const entries = XPLog.getDailyEntries(registry);
    expect(entries).toHaveLength(3);
    expect(entries[0].source).toBe('A');
    expect(entries[1].source).toBe('B');
    expect(entries[2].source).toBe('C');
  });

  it('stores both positive and negative entries', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 30 }));
    XPLog.addEntry(registry, makeEntry({ amount: -15 }));

    const entries = XPLog.getDailyEntries(registry);
    expect(entries.some(e => e.amount > 0)).toBe(true);
    expect(entries.some(e => e.amount < 0)).toBe(true);
  });

  it('fills in defaults for missing entry fields', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, {});

    const entries = XPLog.getDailyEntries(registry);
    expect(entries[0]).toMatchObject({ amount: 0, source: '', category: '' });
    expect(entries[0].timestamp).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDailyNet
// ─────────────────────────────────────────────────────────────────────────────

describe('XPLog.getDailyNet', () => {
  it('returns 0 for an empty log', () => {
    const registry = createRegistry();
    expect(XPLog.getDailyNet(registry)).toBe(0);
  });

  it('returns sum of all entry amounts', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 30 }));
    XPLog.addEntry(registry, makeEntry({ amount: 20 }));
    XPLog.addEntry(registry, makeEntry({ amount: -10 }));

    expect(XPLog.getDailyNet(registry)).toBe(40);
  });

  it('returns negative net when losses exceed gains', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: -50 }));
    XPLog.addEntry(registry, makeEntry({ amount: 10 }));

    expect(XPLog.getDailyNet(registry)).toBe(-40);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCategoryTotals
// ─────────────────────────────────────────────────────────────────────────────

describe('XPLog.getCategoryTotals', () => {
  it('returns empty object for an empty log', () => {
    const registry = createRegistry();
    expect(XPLog.getCategoryTotals(registry)).toEqual({});
  });

  it('sums amounts per category', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 10, category: 'Transportation' }));
    XPLog.addEntry(registry, makeEntry({ amount: 15, category: 'Transportation' }));
    XPLog.addEntry(registry, makeEntry({ amount: 20, category: 'Cultural' }));
    XPLog.addEntry(registry, makeEntry({ amount: -5, category: 'Transportation' }));

    const totals = XPLog.getCategoryTotals(registry);
    expect(totals['Transportation']).toBe(20); // 10 + 15 - 5
    expect(totals['Cultural']).toBe(20);
  });

  it('groups entries without category under "Uncategorized"', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 15, category: '' }));

    const totals = XPLog.getCategoryTotals(registry);
    expect(totals['Uncategorized']).toBe(15);
  });

  it('tracks multiple categories independently', () => {
    const registry = createRegistry();
    const categories = ['Transportation', 'Cultural', 'Daily Life', 'Social', 'Health', 'Financial'];
    categories.forEach((cat, i) => {
      XPLog.addEntry(registry, makeEntry({ amount: (i + 1) * 10, category: cat }));
    });

    const totals = XPLog.getCategoryTotals(registry);
    categories.forEach((cat, i) => {
      expect(totals[cat]).toBe((i + 1) * 10);
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clearLog
// ─────────────────────────────────────────────────────────────────────────────

describe('XPLog.clearLog', () => {
  it('empties the log', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 10 }));
    XPLog.addEntry(registry, makeEntry({ amount: 20 }));
    XPLog.clearLog(registry);

    expect(XPLog.getDailyEntries(registry)).toEqual([]);
    expect(XPLog.getDailyNet(registry)).toBe(0);
  });

  it('clears category totals after clear', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 30, category: 'Cultural' }));
    XPLog.clearLog(registry);

    expect(XPLog.getCategoryTotals(registry)).toEqual({});
  });

  it('allows new entries after clearing', () => {
    const registry = createRegistry();
    XPLog.addEntry(registry, makeEntry({ amount: 50 }));
    XPLog.clearLog(registry);
    XPLog.addEntry(registry, makeEntry({ amount: 10, source: 'New day' }));

    const entries = XPLog.getDailyEntries(registry);
    expect(entries).toHaveLength(1);
    expect(entries[0].source).toBe('New day');
  });
});
