/**
 * tests/data/items.test.js
 * Unit tests for the item definitions module.
 *
 * Covers:
 *  - Export shape — must be a non-empty array
 *  - Required fields — id, name, description, category, price
 *  - id uniqueness and type
 *  - price values — non-negative integers
 *  - category values — one of the five valid categories
 *  - stackable items — must have a positive integer maxStack
 *  - spoilsAfter values — null or positive integer, max 30 days
 *  - pantValue values — 0 or positive number
 *  - Health items — useEffect must be defined
 *  - Food items — useEffect must be "eat"
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

  it('exports a non-empty array', () => {
    expect(items.length).toBeGreaterThan(0);
  });

  it('exports exactly 25 items', () => {
    expect(items).toHaveLength(25);
  });
});

// ---------------------------------------------------------------------------
// Required fields
// ---------------------------------------------------------------------------

describe('required fields', () => {
  const requiredFields = ['id', 'name', 'description', 'category', 'price'];

  it('every item has all required fields', () => {
    for (const item of items) {
      for (const field of requiredFields) {
        expect(item, `Item "${item.id}" is missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every name is a non-empty string', () => {
    for (const item of items) {
      expect(typeof item.name, `Item "${item.id}" name is not a string`).toBe('string');
      expect(item.name.length, `Item "${item.id}" name is empty`).toBeGreaterThan(0);
    }
  });

  it('every description is a non-empty string', () => {
    for (const item of items) {
      expect(typeof item.description, `Item "${item.id}" description is not a string`).toBe('string');
      expect(item.description.length, `Item "${item.id}" description is empty`).toBeGreaterThan(0);
    }
  });
});

// ---------------------------------------------------------------------------
// id uniqueness and type
// ---------------------------------------------------------------------------

describe('item ids', () => {
  it('every id is a non-empty string', () => {
    for (const item of items) {
      expect(typeof item.id).toBe('string');
      expect(item.id.length).toBeGreaterThan(0);
    }
  });

  it('all id values are unique', () => {
    const ids = items.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

// ---------------------------------------------------------------------------
// price values
// ---------------------------------------------------------------------------

describe('price values', () => {
  it('every price is a non-negative integer', () => {
    for (const item of items) {
      expect(typeof item.price, `Item "${item.id}" price is not a number`).toBe('number');
      expect(item.price, `Item "${item.id}" price is negative`).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(item.price), `Item "${item.id}" price is not an integer`).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// category values
// ---------------------------------------------------------------------------

describe('category values', () => {
  it('every category is one of the valid categories', () => {
    for (const item of items) {
      expect(
        VALID_CATEGORIES,
        `Item "${item.id}" has invalid category "${item.category}"`
      ).toContain(item.category);
    }
  });

  it('contains items from all five categories', () => {
    const categories = new Set(items.map(i => i.category));
    for (const cat of VALID_CATEGORIES) {
      expect(categories, `No items found with category "${cat}"`).toContain(cat);
    }
  });
});

// ---------------------------------------------------------------------------
// stackable / maxStack
// ---------------------------------------------------------------------------

describe('stackable items', () => {
  it('every stackable item has a positive integer maxStack', () => {
    for (const item of items) {
      if (item.stackable) {
        expect(
          typeof item.maxStack,
          `Stackable item "${item.id}" maxStack is not a number`
        ).toBe('number');
        expect(
          Number.isInteger(item.maxStack),
          `Stackable item "${item.id}" maxStack is not an integer`
        ).toBe(true);
        expect(
          item.maxStack,
          `Stackable item "${item.id}" maxStack is not positive`
        ).toBeGreaterThan(0);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// spoilsAfter values
// ---------------------------------------------------------------------------

describe('spoilsAfter values', () => {
  it('every spoilsAfter is null or a positive integer', () => {
    for (const item of items) {
      if (item.spoilsAfter !== null) {
        expect(
          typeof item.spoilsAfter,
          `Item "${item.id}" spoilsAfter is not a number`
        ).toBe('number');
        expect(
          Number.isInteger(item.spoilsAfter),
          `Item "${item.id}" spoilsAfter is not an integer`
        ).toBe(true);
        expect(
          item.spoilsAfter,
          `Item "${item.id}" spoilsAfter is not positive`
        ).toBeGreaterThan(0);
      }
    }
  });

  it('no item has a spoilsAfter greater than 30 days', () => {
    for (const item of items) {
      if (item.spoilsAfter !== null) {
        expect(
          item.spoilsAfter,
          `Item "${item.id}" spoilsAfter exceeds 30 days`
        ).toBeLessThanOrEqual(30);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// pantValue values
// ---------------------------------------------------------------------------

describe('pantValue values', () => {
  it('every pantValue is 0 or a positive number', () => {
    for (const item of items) {
      expect(
        typeof item.pantValue,
        `Item "${item.id}" pantValue is not a number`
      ).toBe('number');
      expect(
        item.pantValue,
        `Item "${item.id}" pantValue is negative`
      ).toBeGreaterThanOrEqual(0);
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
      expect(
        item.useEffect,
        `Health item "${item.id}" is missing useEffect`
      ).toBeTruthy();
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
      expect(
        item.useEffect,
        `Food item "${item.id}" useEffect is not "eat"`
      ).toBe('eat');
    }
  });
});

// ---------------------------------------------------------------------------
// Spot-checks for specific items
// ---------------------------------------------------------------------------

describe('spot-checks', () => {
  it('rugbrod is a food item priced at 25 DKK that spoils after 5 days', () => {
    const rugbrod = items.find(i => i.id === 'rugbrod');
    expect(rugbrod).toBeDefined();
    expect(rugbrod.category).toBe('food');
    expect(rugbrod.price).toBe(25);
    expect(rugbrod.spoilsAfter).toBe(5);
    expect(rugbrod.useEffect).toBe('eat');
  });

  it('beer has a pantValue of 1', () => {
    const beer = items.find(i => i.id === 'beer');
    expect(beer).toBeDefined();
    expect(beer.pantValue).toBe(1);
  });

  it('rejsekort is a transport item priced at 80 DKK', () => {
    const rejsekort = items.find(i => i.id === 'rejsekort');
    expect(rejsekort).toBeDefined();
    expect(rejsekort.category).toBe('transport');
    expect(rejsekort.price).toBe(80);
    expect(rejsekort.stackable).toBe(false);
  });

  it('cpr_card is a document item with price 0', () => {
    const cprCard = items.find(i => i.id === 'cpr_card');
    expect(cprCard).toBeDefined();
    expect(cprCard.category).toBe('document');
    expect(cprCard.price).toBe(0);
  });

  it('danish_flag_pin is a collectible priced at 25 DKK', () => {
    const pin = items.find(i => i.id === 'danish_flag_pin');
    expect(pin).toBeDefined();
    expect(pin.category).toBe('collectible');
    expect(pin.price).toBe(25);
  });

  it('danish_cookbook is a collectible item', () => {
    const cookbook = items.find(i => i.id === 'danish_cookbook');
    expect(cookbook).toBeDefined();
    expect(cookbook.category).toBe('collectible');
    expect(cookbook.stackable).toBe(false);
  });

  it('vitamin_d is a health item with useEffect "vitamin_d"', () => {
    const vitaminD = items.find(i => i.id === 'vitamin_d');
    expect(vitaminD).toBeDefined();
    expect(vitaminD.category).toBe('health');
    expect(vitaminD.useEffect).toBe('vitamin_d');
    expect(vitaminD.maxStack).toBe(30);
  });
});
