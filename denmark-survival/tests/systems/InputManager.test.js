/**
 * tests/systems/InputManager.test.js
 * Unit tests for InputManager.
 *
 * Coverage target: ≥85% of src/systems/InputManager.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InputManager, INTERACT_DEBOUNCE_MS } from '../../src/systems/InputManager.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a fake Phaser key that can be toggled. */
function makeKey(isDown = false) {
  return { isDown, on: vi.fn() };
}

/**
 * Build a mock scene whose keyboard returns controllable keys.
 *
 * @param {object} [keyOverrides] - Map of key name → isDown boolean.
 */
function makeScene(keyOverrides = {}) {
  const keys = {};

  const keyboard = {
    createCursorKeys() {
      return {
        up:    makeKey(!!keyOverrides.up),
        down:  makeKey(!!keyOverrides.down),
        left:  makeKey(!!keyOverrides.left),
        right: makeKey(!!keyOverrides.right),
      };
    },
    addKey(name) {
      if (!(name in keys)) {
        keys[name] = makeKey(!!keyOverrides[name]);
      }
      return keys[name];
    },
    /** Test helper: press a key by name. */
    _press(name) {
      if (keys[name]) keys[name].isDown = true;
    },
    /** Test helper: release a key by name. */
    _release(name) {
      if (keys[name]) keys[name].isDown = false;
    },
    _keys: keys,
  };

  return {
    input: { keyboard },
    _keyboard: keyboard,
  };
}

function buildInputManager(keyOverrides = {}) {
  const scene = makeScene(keyOverrides);
  const im = new InputManager(scene);
  return { im, scene, keyboard: scene._keyboard };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('InputManager — construction', () => {
  it('creates without throwing', () => {
    expect(() => buildInputManager()).not.toThrow();
  });

  it('is not blocked by default', () => {
    const { im } = buildInputManager();
    expect(im.isBlocked()).toBe(false);
  });
});

describe('InputManager — blockInput / unblockInput', () => {
  it('blocks input when blockInput() is called', () => {
    const { im } = buildInputManager();
    im.blockInput();
    expect(im.isBlocked()).toBe(true);
  });

  it('unblocks input when unblockInput() is called', () => {
    const { im } = buildInputManager();
    im.blockInput();
    im.unblockInput();
    expect(im.isBlocked()).toBe(false);
  });

  it('getMovementInput returns all-false when blocked', () => {
    const { im } = buildInputManager({ left: true, right: true, up: true, down: true });
    im.blockInput();
    const mv = im.getMovementInput();
    expect(mv.left).toBe(false);
    expect(mv.right).toBe(false);
    expect(mv.up).toBe(false);
    expect(mv.down).toBe(false);
  });

  it('isInteractJustPressed returns false when blocked', () => {
    const { im, keyboard } = buildInputManager();
    keyboard._press('E');
    im._keyInteract = keyboard._keys['E'];
    im.blockInput();
    expect(im.isInteractJustPressed(Date.now())).toBe(false);
  });

  it('isConfirmDown returns false when blocked', () => {
    const { im, keyboard } = buildInputManager();
    keyboard._press('SPACE');
    im.blockInput();
    expect(im.isConfirmDown()).toBe(false);
  });

  it('isEscapeDown returns false when blocked', () => {
    const { im, keyboard } = buildInputManager();
    keyboard._press('ESC');
    im.blockInput();
    expect(im.isEscapeDown()).toBe(false);
  });

  it('isInventoryDown returns false when blocked', () => {
    const { im, keyboard } = buildInputManager();
    keyboard._press('TAB');
    im.blockInput();
    expect(im.isInventoryDown()).toBe(false);
  });
});

describe('InputManager — movement vector', () => {
  it('returns left: true when left arrow is down', () => {
    const { im, im: { _cursors } } = buildInputManager();
    im._cursors.left.isDown = true;
    expect(im.getMovementInput().left).toBe(true);
  });

  it('returns right: true when right arrow is down', () => {
    const { im } = buildInputManager();
    im._cursors.right.isDown = true;
    expect(im.getMovementInput().right).toBe(true);
  });

  it('returns up: true when up arrow is down', () => {
    const { im } = buildInputManager();
    im._cursors.up.isDown = true;
    expect(im.getMovementInput().up).toBe(true);
  });

  it('returns down: true when down arrow is down', () => {
    const { im } = buildInputManager();
    im._cursors.down.isDown = true;
    expect(im.getMovementInput().down).toBe(true);
  });

  it('returns left: true when WASD A is down', () => {
    const { im } = buildInputManager();
    im._wasdKeys.A.isDown = true;
    expect(im.getMovementInput().left).toBe(true);
  });

  it('returns right: true when WASD D is down', () => {
    const { im } = buildInputManager();
    im._wasdKeys.D.isDown = true;
    expect(im.getMovementInput().right).toBe(true);
  });

  it('returns up: true when WASD W is down', () => {
    const { im } = buildInputManager();
    im._wasdKeys.W.isDown = true;
    expect(im.getMovementInput().up).toBe(true);
  });

  it('returns down: true when WASD S is down', () => {
    const { im } = buildInputManager();
    im._wasdKeys.S.isDown = true;
    expect(im.getMovementInput().down).toBe(true);
  });

  it('both arrow and WASD can be pressed simultaneously', () => {
    const { im } = buildInputManager();
    im._cursors.left.isDown = true;
    im._wasdKeys.A.isDown = true;
    expect(im.getMovementInput().left).toBe(true);
  });

  it('returns all-false when no keys are pressed', () => {
    const { im } = buildInputManager();
    const mv = im.getMovementInput();
    expect(mv).toEqual({ left: false, right: false, up: false, down: false });
  });
});

describe('InputManager — isMoving helper', () => {
  it('returns true when at least one direction key is pressed', () => {
    const { im } = buildInputManager();
    im._cursors.up.isDown = true;
    expect(im.isMoving()).toBe(true);
  });

  it('returns false when no direction keys are pressed', () => {
    const { im } = buildInputManager();
    expect(im.isMoving()).toBe(false);
  });
});

describe('InputManager — interact key debounce', () => {
  it('returns true when E is pressed for the first time', () => {
    const { im } = buildInputManager();
    im._keyInteract = makeKey(true);
    expect(im.isInteractJustPressed(1000)).toBe(true);
  });

  it('returns false when called again within the debounce window', () => {
    const { im } = buildInputManager();
    im._keyInteract = makeKey(true);
    const now = 1000;
    im.isInteractJustPressed(now);
    expect(im.isInteractJustPressed(now + INTERACT_DEBOUNCE_MS - 1)).toBe(false);
  });

  it('returns true again after the debounce window has passed', () => {
    const { im } = buildInputManager();
    im._keyInteract = makeKey(true);
    const now = 1000;
    im.isInteractJustPressed(now);
    expect(im.isInteractJustPressed(now + INTERACT_DEBOUNCE_MS)).toBe(true);
  });

  it('returns false when E is not pressed', () => {
    const { im } = buildInputManager();
    im._keyInteract = makeKey(false);
    expect(im.isInteractJustPressed(5000)).toBe(false);
  });
});

describe('InputManager — action keys', () => {
  it('isConfirmDown returns true when Space is down', () => {
    const { im } = buildInputManager();
    im._keyConfirm = makeKey(true);
    expect(im.isConfirmDown()).toBe(true);
  });

  it('isEscapeDown returns true when Escape is down', () => {
    const { im } = buildInputManager();
    im._keyEscape = makeKey(true);
    expect(im.isEscapeDown()).toBe(true);
  });

  it('isInventoryDown returns true when Tab is down', () => {
    const { im } = buildInputManager();
    im._keyInventory = makeKey(true);
    expect(im.isInventoryDown()).toBe(true);
  });

  it('isMapDown returns true when M is down', () => {
    const { im } = buildInputManager();
    im._keyMap = makeKey(true);
    expect(im.isMapDown()).toBe(true);
  });
});

describe('InputManager — graceful degradation (no keyboard)', () => {
  it('creates without throwing when scene has no keyboard', () => {
    const scene = { input: {} };
    expect(() => new InputManager(scene)).not.toThrow();
  });

  it('getMovementInput returns all-false with no keyboard', () => {
    const scene = { input: {} };
    const im = new InputManager(scene);
    expect(im.getMovementInput()).toEqual({ left: false, right: false, up: false, down: false });
  });

  it('creates without throwing when scene has no input at all', () => {
    expect(() => new InputManager({})).not.toThrow();
  });
});

describe('InputManager — destroy', () => {
  it('does not throw when destroy() is called', () => {
    const { im } = buildInputManager();
    expect(() => im.destroy()).not.toThrow();
  });
});
