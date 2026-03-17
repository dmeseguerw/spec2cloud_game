# BUG-002 — High: InputManager.js Branch Coverage Below 85%

**Severity:** 🟠 High  
**Status:** Open  
**Date Found:** March 17, 2026  
**Found By:** Game Testing Agent (automated coverage analysis)  
**Feature:** Transportation & Movement; Dialogue; General Player Input  
**FDD:** specs/features/transportation-movement.md

---

## Summary

`src/systems/InputManager.js` has **80.88% statement coverage** and **76.59% branch coverage**, below the required ≥85% threshold. Lines 146–164 are not covered by any existing test. These lines contain rising-edge detection logic for Escape and Inventory (Tab) key presses.

---

## Coverage Data

```
InputManager.js  |  80.88  |  76.59  |  86.66  |  82.75  | 146-164
```

---

## Impact

The `isEscapeJustPressed()` and `isInventoryJustPressed()` methods (and similar rising-edge input methods in the uncovered lines) are called every frame in the game loop to detect key presses. Untested paths include:

- Behaviour when `_key*` references are null/undefined (input not yet set up)
- Rising-edge detection when `_blocked` is true mid-gameplay
- The transition from "key down last frame" to "key up this frame" (preventing double-fire)

If any of these paths fail, the player could experience:
- Pressing Escape having no effect (pause menu doesn't open)
- Inventory tab not toggling
- Bike light toggle (L key) failing mid-ride
- Metro check-in key (E) not responding

---

## Reproduction Steps

1. Run `npm run test:coverage`
2. Observe:
   ```
   InputManager.js | 80.88 | 76.59 | 86.66 | 82.75 | 146-164
   ```
3. Review `tests/systems/InputManager.test.js` — existing tests cover basic `isDown` states but do not test rising-edge transition scenarios or null key references.

---

## Expected Behaviour

`tests/systems/InputManager.test.js` should cover:

- [ ] `isEscapeJustPressed()` returns `true` only on the frame key transitions down (rising edge), not when held
- [ ] `isEscapeJustPressed()` returns `false` when `_blocked` is true
- [ ] `isEscapeJustPressed()` returns `false` when `_keyEscape` is null/undefined
- [ ] `isInventoryJustPressed()` returns `true` only on rising edge
- [ ] `isInventoryJustPressed()` returns `false` when blocked
- [ ] Repeated calls in same frame don't double-fire (state updated correctly)

---

## Files Affected

- `src/systems/InputManager.js` (lines 146–164 — uncovered)
- `tests/systems/InputManager.test.js` (needs additional test cases)

---

## Suggested Fix

Add the following test cases to `tests/systems/InputManager.test.js`:

```js
describe('Rising-edge detection — isEscapeJustPressed', () => {
  test('returns true only on the frame key transitions from up to down', () => {
    // Frame 1: key was up, now down → should be true
    inputManager._keyEscape = { isDown: true };
    inputManager._escapeWasDown = false;
    expect(inputManager.isEscapeJustPressed()).toBe(true);

    // Frame 2: key still down → should be false (not a new press)
    expect(inputManager.isEscapeJustPressed()).toBe(false);
  });

  test('returns false when _blocked is true', () => {
    inputManager._blocked = true;
    inputManager._keyEscape = { isDown: true };
    inputManager._escapeWasDown = false;
    expect(inputManager.isEscapeJustPressed()).toBe(false);
  });

  test('returns false when _keyEscape is null', () => {
    inputManager._keyEscape = null;
    inputManager._escapeWasDown = false;
    expect(inputManager.isEscapeJustPressed()).toBe(false);
  });
});

describe('Rising-edge detection — isInventoryJustPressed', () => {
  test('returns true only on the frame Tab transitions from up to down', () => {
    inputManager._keyInventory = { isDown: true };
    inputManager._inventoryWasDown = false;
    expect(inputManager.isInventoryJustPressed()).toBe(true);
    expect(inputManager.isInventoryJustPressed()).toBe(false);
  });

  test('returns false when _blocked is true', () => {
    inputManager._blocked = true;
    inputManager._keyInventory = { isDown: true };
    inputManager._inventoryWasDown = false;
    expect(inputManager.isInventoryJustPressed()).toBe(false);
  });
});
```

---

## Route To

→ **gamedev agent** — Add missing test cases. No source code change needed; this is a test gap for existing input handling logic.
