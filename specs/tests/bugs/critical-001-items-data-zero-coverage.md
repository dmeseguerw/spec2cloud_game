# BUG-001 — Critical: items.js Has Zero Test Coverage

**Severity:** 🔴 Critical  
**Status:** Open  
**Date Found:** March 17, 2026  
**Found By:** Game Testing Agent (automated coverage analysis)  
**Feature:** Inventory & Economy System  
**FDD:** specs/features/inventory-economy.md

---

## Summary

`src/data/items.js` exports 25 item definitions (food, health, transport, documents, collectibles) and has **0% coverage** across all metrics — zero statements, zero branches, zero functions, zero lines tested.

---

## Impact

The ShopSystem, InventoryManager, and EconomyEngine all depend on item data from this file. Without test coverage:

- Structural errors in any item definition will go undetected
- Future edits to items (adding/removing items, changing prices) could silently break the economy system
- Items with incorrect `category` values would show up in the wrong inventory tab or not appear at all
- Items with invalid `spoilsAfter` values could cause the spoilage system to crash or behave incorrectly
- Items with missing required fields (e.g., no `id`, no `price`) would produce `undefined` bugs silently in production

---

## Reproduction Steps

1. Run `npm run test:coverage`
2. Observe the coverage report row for `src/data/items.js`:
   ```
   items.js  |  0  |  0  |  0  |  0  |
   ```
3. All other data files (characterData.js, encyclopedia.js, npcs.js) have 100% coverage — items.js is the sole exception.

---

## Expected Behaviour

`src/data/items.js` should have a corresponding `tests/data/items.test.js` test file that validates:

- [ ] The file exports an array
- [ ] Every item has required fields: `id`, `name`, `description`, `category`, `price`
- [ ] All `id` values are unique strings
- [ ] All `price` values are non-negative integers (DKK, no decimals)
- [ ] All `category` values are one of: `food`, `health`, `transport`, `document`, `collectible`
- [ ] All `stackable` items have a valid `maxStack` (positive integer)
- [ ] All `spoilsAfter` values are either `null` or a positive integer
- [ ] All `pantValue` values are 0 or a positive integer
- [ ] No item has a `spoilsAfter` value greater than 30 days (reasonable game constraint)
- [ ] Health items all have `useEffect` defined
- [ ] Food items all have `useEffect: "eat"`

---

## Files Affected

- `src/data/items.js` (missing test file)
- `tests/data/` (test file should be created here: `tests/data/items.test.js`)

---

## Suggested Fix

Create `tests/data/items.test.js` following the pattern from `tests/data/characterData.test.js` and `tests/data/encyclopedia.test.js`:

```js
import items from '../../src/data/items.js';

const VALID_CATEGORIES = ['food', 'health', 'transport', 'document', 'collectible'];

describe('items.js — Item Data Validation', () => {
  test('exports an array', () => {
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
  });

  test('all items have required fields', () => {
    items.forEach(item => {
      expect(item.id).toBeDefined();
      expect(item.name).toBeDefined();
      expect(item.category).toBeDefined();
      expect(typeof item.price).toBe('number');
    });
  });

  test('all item IDs are unique', () => {
    const ids = items.map(i => i.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('all categories are valid', () => {
    items.forEach(item => {
      expect(VALID_CATEGORIES).toContain(item.category);
    });
  });

  test('all prices are non-negative integers', () => {
    items.forEach(item => {
      expect(item.price).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(item.price)).toBe(true);
    });
  });

  test('spoilsAfter is null or a positive integer', () => {
    items.forEach(item => {
      if (item.spoilsAfter !== null) {
        expect(typeof item.spoilsAfter).toBe('number');
        expect(item.spoilsAfter).toBeGreaterThan(0);
      }
    });
  });
});
```

---

## Route To

→ **gamedev agent** — Create the test file. No source code change needed; this is a missing test coverage issue.
