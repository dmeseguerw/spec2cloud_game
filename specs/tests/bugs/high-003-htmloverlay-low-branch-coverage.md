# BUG-003 — High: HTMLOverlayManager.js Branch Coverage Below 85%

**Severity:** 🟠 High  
**Status:** Open  
**Date Found:** March 17, 2026  
**Found By:** Game Testing Agent (automated coverage analysis)  
**Feature:** UI Framework / All overlay-based UI (Inventory, Pause, Encyclopedia)  
**FDD:** specs/features/encyclopedia-learning.md, inventory-economy.md

---

## Summary

`src/ui/HTMLOverlayManager.js` has **87.5% statement coverage** and **74.41% branch coverage**, below the required ≥85% branch threshold. Lines 52–55 and 180 are not covered. These lines represent two edge-case branches in overlay activation and focus-trapping logic.

---

## Coverage Data

```
HTMLOverlayManager.js | 87.5 | 74.41 | 100 | 92.42 | 52-55,180
```

---

## Impact

`HTMLOverlayManager` controls all HTML-based overlays used in:
- Inventory screen (US-014)
- Pause menu (settings access)
- Encyclopedia (US-020)

**Lines 52–55** correspond to the path where `showOverlay(overlayId)` is called but `document.getElementById(overlayId)` returns `null` (the DOM element doesn't exist). In this case the manager stores the overlay ID and blocks game input, but `_activeOverlayEl` is set to `null`. If subsequent code tries to `_trapFocus(null)` or interact with the null element, it could throw a TypeError or leave the game input permanently blocked.

**Line 180** corresponds to the `_trapFocus(el)` path where `focusable.length === 0` — there are no focusable elements inside the overlay. In this case the `focus()` call is skipped (correct), but this path is never tested, so any surrounding logic that fails in this case could be invisible.

---

## Reproduction Steps

1. Run `npm run test:coverage`
2. Observe:
   ```
   HTMLOverlayManager.js | 87.5 | 74.41 | 100 | 92.42 | 52-55,180
   ```
3. Review `tests/ui/HTMLOverlayManager.test.js` — existing tests call `showOverlay` with valid DOM elements. The case where the element does not exist in the DOM is not tested.

---

## Expected Behaviour

`tests/ui/HTMLOverlayManager.test.js` should cover:

- [ ] `showOverlay(overlayId)` called with an `overlayId` whose DOM element does not exist — stores ID, sets `_activeOverlayEl = null`, blocks input, and does NOT throw
- [ ] `showOverlay(overlayId)` with a valid element that has no focusable children — calls `_trapFocus` without error, does not crash
- [ ] After `showOverlay` with a missing element, `hideOverlay()` can still be called without errors
- [ ] Game input remains blocked after `showOverlay` with missing element (input not accidentally unblocked)

---

## Files Affected

- `src/ui/HTMLOverlayManager.js` (lines 52–55, 180 — uncovered)
- `tests/ui/HTMLOverlayManager.test.js` (needs additional test cases)

---

## Suggested Fix

Add the following test cases to `tests/ui/HTMLOverlayManager.test.js`:

```js
describe('showOverlay — element not found in DOM', () => {
  test('does not throw when getElementById returns null', () => {
    // Ensure no element with this id exists
    expect(() => manager.showOverlay('nonexistent-overlay-id')).not.toThrow();
  });

  test('stores overlay id and blocks input even when element is null', () => {
    manager.showOverlay('nonexistent-overlay-id');
    expect(manager._activeOverlayId).toBe('nonexistent-overlay-id');
    expect(manager._activeOverlayEl).toBeNull();
    // Game input should still be blocked
    expect(manager._isInputBlocked).toBe(true); // or equivalent accessor
  });

  test('hideOverlay can be called after showOverlay with missing element', () => {
    manager.showOverlay('nonexistent-overlay-id');
    expect(() => manager.hideOverlay()).not.toThrow();
  });
});

describe('_trapFocus — overlay with no focusable elements', () => {
  test('does not throw when overlay has no focusable children', () => {
    const el = document.createElement('div');
    // No buttons, inputs, or links inside el
    expect(() => manager._trapFocus(el)).not.toThrow();
  });
});
```

---

## Route To

→ **gamedev agent** — Add missing test cases for null element and empty focus-trap scenarios. No source code change needed; this is a test coverage gap.
