/**
 * tests/ui/HTMLOverlayManager.test.js
 * Unit tests for HTMLOverlayManager — DOM overlay manager.
 *
 * Since there's no DOM in the Node.js test environment, we create mock
 * document objects in beforeEach/afterEach hooks.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HTMLOverlayManager } from '../../src/ui/HTMLOverlayManager.js';

// ---------------------------------------------------------------------------
// Mock document helpers
// ---------------------------------------------------------------------------

function createMockDocument() {
  const elements = new Map();
  return {
    getElementById: vi.fn().mockImplementation((id) => elements.get(id) ?? null),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    _registerElement: (id, el) => elements.set(id, el),
  };
}

function createMockElement(id) {
  const classes = new Set();
  return {
    id,
    classList: {
      add: vi.fn().mockImplementation((...cls) => cls.forEach(c => classes.add(c))),
      remove: vi.fn().mockImplementation((...cls) => cls.forEach(c => classes.delete(c))),
      has: (c) => classes.has(c),
    },
    querySelectorAll: vi.fn().mockReturnValue([]),
  };
}

function buildManager(config = {}) {
  const scene = {
    scale: { width: 1280, height: 720 },
    input: { enabled: true },
  };
  const mgr = new HTMLOverlayManager(scene, config);
  return { mgr, scene };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('HTMLOverlayManager', () => {
  beforeEach(() => {
    global.document = createMockDocument();
  });

  afterEach(() => {
    delete global.document;
  });

  it('show() sets active overlay id', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    mgr.show('pause-menu');
    expect(mgr.getActiveId()).toBe('pause-menu');
  });

  it('show() blocks game input', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr, scene } = buildManager();

    mgr.show('pause-menu');
    expect(mgr.isInputBlocked()).toBe(true);
    expect(scene.input.enabled).toBe(false);
  });

  it('show() calls _showElement on the target element', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    mgr.show('pause-menu');
    expect(el.classList.remove).toHaveBeenCalledWith('hidden');
    expect(el.classList.add).toHaveBeenCalledWith('active');
  });

  it('hide() clears active overlay', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    mgr.show('pause-menu');
    mgr.hide('pause-menu');
    expect(mgr.getActiveId()).toBeNull();
  });

  it('hide() unblocks game input', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr, scene } = buildManager();

    mgr.show('pause-menu');
    mgr.hide('pause-menu');
    expect(mgr.isInputBlocked()).toBe(false);
    expect(scene.input.enabled).toBe(true);
  });

  it('isActive() returns false initially', () => {
    const { mgr } = buildManager();
    expect(mgr.isActive()).toBe(false);
  });

  it('isActive() returns true after show()', () => {
    const el = createMockElement('main-menu');
    global.document._registerElement('main-menu', el);
    const { mgr } = buildManager();

    mgr.show('main-menu');
    expect(mgr.isActive()).toBe(true);
  });

  it('isActive() returns false after hide()', () => {
    const el = createMockElement('main-menu');
    global.document._registerElement('main-menu', el);
    const { mgr } = buildManager();

    mgr.show('main-menu');
    mgr.hide('main-menu');
    expect(mgr.isActive()).toBe(false);
  });

  it('getActiveId() returns correct id', () => {
    const el = createMockElement('settings-menu');
    global.document._registerElement('settings-menu', el);
    const { mgr } = buildManager();

    mgr.show('settings-menu');
    expect(mgr.getActiveId()).toBe('settings-menu');
  });

  it('hideActive() hides the currently active overlay', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    mgr.show('pause-menu');
    mgr.hideActive();
    expect(mgr.isActive()).toBe(false);
    expect(el.classList.add).toHaveBeenCalledWith('hidden');
  });

  it('isInputBlocked() returns true when overlay is shown', () => {
    const el = createMockElement('main-menu');
    global.document._registerElement('main-menu', el);
    const { mgr } = buildManager();

    mgr.show('main-menu');
    expect(mgr.isInputBlocked()).toBe(true);
  });

  it('isInputBlocked() returns false after hide()', () => {
    const el = createMockElement('main-menu');
    global.document._registerElement('main-menu', el);
    const { mgr } = buildManager();

    mgr.show('main-menu');
    mgr.hide('main-menu');
    expect(mgr.isInputBlocked()).toBe(false);
  });

  it('Escape key event calls hideActive()', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    mgr.show('pause-menu');

    // Find the keydown listener that was added
    const addEventCall = global.document.addEventListener.mock.calls.find(
      call => call[0] === 'keydown'
    );
    expect(addEventCall).toBeDefined();

    // Simulate Escape key
    const handler = addEventCall[1];
    handler({ key: 'Escape' });

    expect(mgr.isActive()).toBe(false);
  });

  it('works gracefully without document (node env) - no throw', () => {
    delete global.document;

    const scene = {
      scale: { width: 1280, height: 720 },
      input: { enabled: true },
    };
    const mgr = new HTMLOverlayManager(scene);

    // Should not throw
    expect(() => mgr.show('test-overlay')).not.toThrow();
    expect(mgr.isActive()).toBe(true);
    expect(mgr.getActiveId()).toBe('test-overlay');

    expect(() => mgr.hide('test-overlay')).not.toThrow();
    expect(mgr.isActive()).toBe(false);

    expect(() => mgr.destroy()).not.toThrow();
  });

  it('show() then show() different overlay hides first', () => {
    const el1 = createMockElement('main-menu');
    const el2 = createMockElement('settings-menu');
    global.document._registerElement('main-menu', el1);
    global.document._registerElement('settings-menu', el2);
    const { mgr } = buildManager();

    mgr.show('main-menu');
    expect(mgr.getActiveId()).toBe('main-menu');

    mgr.show('settings-menu');
    expect(mgr.getActiveId()).toBe('settings-menu');
    // First overlay should have been hidden
    expect(el1.classList.add).toHaveBeenCalledWith('hidden');
  });

  // ---------------------------------------------------------------------------
  // Edge-case: show() with missing DOM element (getElementById returns null)
  // Covers lines 52–55 of HTMLOverlayManager.js
  // ---------------------------------------------------------------------------

  it('show() with missing DOM element does not throw', () => {
    // document exists but getElementById returns null for unknown id
    const { mgr } = buildManager();

    expect(() => mgr.show('nonexistent-overlay')).not.toThrow();
  });

  it('show() with missing DOM element stores overlay id', () => {
    const { mgr } = buildManager();

    mgr.show('nonexistent-overlay');
    expect(mgr.getActiveId()).toBe('nonexistent-overlay');
    expect(mgr.isActive()).toBe(true);
  });

  it('show() with missing DOM element sets _activeOverlayEl to null and blocks input', () => {
    const { mgr, scene } = buildManager();

    mgr.show('nonexistent-overlay');
    expect(mgr.isInputBlocked()).toBe(true);
    expect(scene.input.enabled).toBe(false);
    // Verify the overlay is tracked as active with no DOM errors (element is null internally)
    expect(mgr.isActive()).toBe(true);
    expect(mgr.getActiveId()).toBe('nonexistent-overlay');
  });

  it('hide() after show() with missing DOM element does not throw and unblocks input', () => {
    const { mgr, scene } = buildManager();

    mgr.show('nonexistent-overlay');
    expect(() => mgr.hide('nonexistent-overlay')).not.toThrow();
    expect(mgr.isActive()).toBe(false);
    expect(mgr.isInputBlocked()).toBe(false);
    expect(scene.input.enabled).toBe(true);
  });

  it('game input stays blocked after show() with missing element until hide() is called', () => {
    const { mgr } = buildManager();

    mgr.show('nonexistent-overlay');
    expect(mgr.isInputBlocked()).toBe(true);

    // Calling show() again with another missing element should keep input blocked
    mgr.show('another-missing-overlay');
    expect(mgr.isInputBlocked()).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Edge-case: _trapFocus with focusable children present
  // Covers line 180 of HTMLOverlayManager.js (focusable[0].focus() call)
  // ---------------------------------------------------------------------------

  it('show() with element that has focusable children calls focus() without error', () => {
    const focusableMock = { focus: vi.fn() };
    const el = createMockElement('pause-menu');
    // Override querySelectorAll to return a non-empty focusable list
    el.querySelectorAll = vi.fn().mockReturnValue([focusableMock]);
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    expect(() => mgr.show('pause-menu')).not.toThrow();
    expect(focusableMock.focus).toHaveBeenCalledTimes(1);
  });

  // ---------------------------------------------------------------------------
  // Edge-case: _addEscapeListener guard — already listening (line 188 true branch)
  // ---------------------------------------------------------------------------

  it('show() same overlay twice does not add duplicate Escape listener', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    mgr.show('pause-menu');
    const addCallsBefore = global.document.addEventListener.mock.calls.length;

    // Second show with same id: _addEscapeListener early-returns because
    // _isListeningForEscape is already true (covers line 188 true branch)
    mgr.show('pause-menu');
    expect(global.document.addEventListener.mock.calls.length).toBe(addCallsBefore);
  });

  // ---------------------------------------------------------------------------
  // Edge-case: hide() with falsy overlayId (line 71 early return)
  // ---------------------------------------------------------------------------

  it('hide() with null/undefined overlayId does not throw', () => {
    const { mgr } = buildManager();
    expect(() => mgr.hide(null)).not.toThrow();
    expect(() => mgr.hide(undefined)).not.toThrow();
    expect(() => mgr.hide('')).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // Edge-case: _onEscapeKey called with non-Escape key (line 211 false branch)
  // ---------------------------------------------------------------------------

  it('non-Escape keydown event does not hide active overlay', () => {
    const el = createMockElement('pause-menu');
    global.document._registerElement('pause-menu', el);
    const { mgr } = buildManager();

    mgr.show('pause-menu');

    const addEventCall = global.document.addEventListener.mock.calls.find(
      call => call[0] === 'keydown'
    );
    expect(addEventCall).toBeDefined();
    const handler = addEventCall[1];

    // Pressing a non-Escape key should leave the overlay active
    handler({ key: 'Enter' });
    expect(mgr.isActive()).toBe(true);
    expect(mgr.getActiveId()).toBe('pause-menu');
  });
});
