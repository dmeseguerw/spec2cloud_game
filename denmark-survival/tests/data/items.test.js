/**
 * tests/data/items.test.js
 * Unit tests for the items data module.
 *
 * Covers:
 *  - Export shape — items is a non-empty array of 25 entries
 *  - Required fields — id, name, description, category, price on every item
 *  - Uniqueness — all ids are unique strings
 *  - Price integrity — all prices are non-negative integers (DKK)
 *  - Category validity — all categories are one of the five allowed values
 *  - Stackable constraint — stackable items have a positive integer maxStack
 *  - spoilsAfter constraint — null or positive integer ≤ 30
 *  - pantValue constraint — 0 or a non-negative number
 *  - Health items — all have useEffect defined
 *  - Food items — all have useEffect: "eat"
 */

import { describe, it, expect } from 'vitest';
import items from '../../src/data/items.js';

const VALID_CATEGORIES = ['food', 'health', 'transport', 'document', 'collectible'];

// ---------------------------------------------------------------------------
// Export shape
// ---------------------------------------------------------------------------

describe('items export', () => {
  it('exports an array', () => {
    expect(Array.isArray(items)).toBe(true);
  });

  it('contains exactly 25 items', () => {
    expect(items).toHaveLength(25);
  });
});

// ---------------------------------------------------------------------------
// Required fields
// ---------------------------------------------------------------------------

describe('required fields', () => {
  it('every item has id, name, description, category and price', () => {
    const required = ['id', 'name', 'description', 'category', 'price'];
    for (const item of items) {
      for (const field of required) {
        expect(item, `Item "${item.id || '?'}" is missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every id is a non-empty string', () => {
    for (const item of items) {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
    }
  });

  it('every name is a non-empty string', () => {
    for (const item of items) {
      expect(typeof item.name).toBe('string');
      expect(item.name.length).toBeGreaterThan(0);
    }
  });

  it('every description is a non-empty string', () => {
    for (const item of items) {
      expect(typeof item.description).toBe('string');
      expect(item.description.length).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Uniqueness
// ---------------------------------------------------------------------------

describe('item id uniqueness', () => {
  it('all item ids are unique', () => {
    const ids = items.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// Price integrity
// ---------------------------------------------------------------------------

describe('price integrity', () => {
  it('all prices are non-negative integers', () => {
    for (const item of items) {
      expect(typeof item.price).toBe('number');
      expect(Number.isInteger(item.price)).toBe(true);
      expect(item.price).toBeGreaterThanOrEqual(0);
    }
  });
});

// ---------------------------------------------------------------------------
// Category validity
// ---------------------------------------------------------------------------

describe('category validity', () => {
  it('all categories are one of the five allowed values', () => {
    for (const item of items) {
      expect(VALID_CATEGORIES, `Item "${item.id}" has invalid category "${item.category}"`).toContain(item.category);
    }
  });

  it('contains items from all five categories', () => {
    const presentCategories = new Set(items.map(i => i.category));
    for (const cat of VALID_CATEGORIES) {
      expect(presentCategories).toContain(cat);
    }
  });
});

// ---------------------------------------------------------------------------
// Stackable constraint
// ---------------------------------------------------------------------------

describe('stackable constraint', () => {
  it('stackable items have a positive integer maxStack', () => {
    for (const item of items) {
      if (item.stackable) {
        expect(typeof item.maxStack).toBe('number');
        expect(Number.isInteger(item.maxStack)).toBe(true);
        expect(item.maxStack).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// spoilsAfter constraint
// ---------------------------------------------------------------------------

describe('spoilsAfter constraint', () => {
  it('spoilsAfter is null or a positive integer ≤ 30', () => {
    for (const item of items) {
      if (item.spoilsAfter !== null) {
        expect(typeof item.spoilsAfter).toBe('number');
        expect(Number.isInteger(item.spoilsAfter)).toBe(true);
        expect(item.spoilsAfter).toBeGreaterThan(0);
        expect(item.spoilsAfter).toBeLessThanOrEqual(30);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// pantValue constraint
// ---------------------------------------------------------------------------

describe('pantValue constraint', () => {
  it('all pantValue entries are non-negative numbers when present', () => {
    for (const item of items) {
      if ('pantValue' in item) {
        expect(typeof item.pantValue).toBe('number');
        expect(item.pantValue).toBeGreaterThanOrEqual(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Health items
// ---------------------------------------------------------------------------

describe('health items', () => {
  it('all health items have useEffect defined', () => {
    const healthItems = items.filter(i => i.category === 'health');
    expect(healthItems.length).toBeGreaterThan(0);
    for (const item of healthItems) {
      expect(item.useEffect, `Health item "${item.id}" is missing useEffect`).toBeDefined();
      expect(item.useEffect).not.toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// Food items
// ---------------------------------------------------------------------------

describe('food items', () => {
  it('all food items have useEffect: "eat"', () => {
    const foodItems = items.filter(i => i.category === 'food');
    expect(foodItems.length).toBeGreaterThan(0);
    for (const item of foodItems) {
      expect(item.useEffect).toBe('eat');
    }
  });
});

// ---------------------------------------------------------------------------
// Spot-checks for specific items
// ---------------------------------------------------------------------------

describe('spot-checks', () => {
  it('rugbrod is a food item priced at 25 DKK that spoils after 5 days', () => {
    const item = items.find(i => i.id === 'rugbrod');
    expect(item).toBeDefined();
    expect(item.category).toBe('food');
    expect(item.price).toBe(25);
    expect(item.spoilsAfter).toBe(5);
    expect(item.useEffect).toBe('eat');
  });

  it('rejsekort is a transport item priced at 80 DKK', () => {
    const item = items.find(i => i.id === 'rejsekort');
    expect(item).toBeDefined();
    expect(item.category).toBe('transport');
    expect(item.price).toBe(80);
    expect(item.stackable).toBe(false);
  });

  it('cpr_card is a document item priced at 0 DKK', () => {
    const item = items.find(i => i.id === 'cpr_card');
    expect(item).toBeDefined();
    expect(item.category).toBe('document');
    expect(item.price).toBe(0);
  });

  it('beer has a pantValue of 1', () => {
    const item = items.find(i => i.id === 'beer');
    expect(item).toBeDefined();
    expect(item.pantValue).toBe(1);
  });

  it('danish_cookbook is a collectible item', () => {
    const item = items.find(i => i.id === 'danish_cookbook');
    expect(item).toBeDefined();
    expect(item.category).toBe('collectible');
    expect(item.stackable).toBe(false);
  });

  it('vitamin_d is a health item with useEffect: "vitamin_d"', () => {
    const item = items.find(i => i.id === 'vitamin_d');
    expect(item).toBeDefined();
    expect(item.category).toBe('health');
    expect(item.useEffect).toBe('vitamin_d');
    expect(item.maxStack).toBe(30);
  });
});
