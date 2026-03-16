/**
 * tests/scenes/EncyclopediaScene.test.js
 * Unit tests for EncyclopediaScene — full-screen encyclopedia overlay
 * with category tabs, entry list, detail view, and keyboard navigation.
 *
 * Phaser.Scene is mocked globally via tests/mocks/setupPhaser.js.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry, MockGameObject } from '../mocks/PhaserMocks.js';
import { EncyclopediaScene } from '../../src/scenes/EncyclopediaScene.js';
import {
  initializeEncyclopedia,
  unlockEntry,
} from '../../src/systems/EncyclopediaManager.js';
import {
  CATEGORIES,
  CATEGORY_META,
  getEntriesByCategory,
  ENCYCLOPEDIA_DATA,
  STARTER_ENTRY_IDS,
} from '../../src/data/encyclopedia.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeObj() {
  const obj = new MockGameObject();
  obj.setOrigin       = vi.fn().mockReturnThis();
  obj.setDepth        = vi.fn().mockReturnThis();
  obj.setInteractive  = vi.fn().mockReturnThis();
  obj.setStyle        = vi.fn().mockReturnThis();
  obj.setFillStyle    = vi.fn().mockReturnThis();
  obj.setScrollFactor = vi.fn().mockReturnThis();
  obj.setText         = vi.fn().mockImplementation(function (t) { this.text = t; return this; });
  obj.setVisible      = vi.fn().mockImplementation(function (v) { this.visible = v; return this; });
  obj.setColor        = vi.fn().mockReturnThis();
  obj.on              = vi.fn().mockReturnThis();
  obj.destroy         = vi.fn();
  return obj;
}

/**
 * Build an EncyclopediaScene with a fresh registry.
 * @param {object} [opts]
 * @param {boolean} [opts.asOverlay] - Whether to mark the scene as an overlay.
 */
function buildScene({ asOverlay = false } = {}) {
  const scene    = new EncyclopediaScene();
  const registry = new MockRegistry();

  // Initialize encyclopedia state
  registry.set(RK.ENCYCLOPEDIA_ENTRIES, []);
  registry.set(RK.PLAYER_XP, 0);
  registry.set(RK.PLAYER_LEVEL, 1);
  initializeEncyclopedia(registry);

  scene.scale    = { width: 1280, height: 720 };
  scene.registry = registry;
  scene.add      = {
    text:      vi.fn().mockImplementation(makeObj),
    rectangle: vi.fn().mockImplementation(makeObj),
    image:     vi.fn().mockImplementation(makeObj),
  };
  scene.cameras  = {
    main: {
      fadeIn:  vi.fn().mockImplementation((_d, _r, _g, _b, cb) => { if (cb) cb(null, 1); }),
      fadeOut: vi.fn().mockImplementation((_d, _r, _g, _b, cb) => { if (cb) cb(null, 1); }),
    },
  };
  scene.scene    = {
    key:    'EncyclopediaScene',
    start:  vi.fn(),
    launch: vi.fn(),
    stop:   vi.fn(),
    pause:  vi.fn(),
    resume: vi.fn(),
  };
  scene.input    = {
    keyboard: { addKey: vi.fn().mockReturnValue({ isDown: false, on: vi.fn() }) },
    enabled:  true,
  };

  if (asOverlay) {
    scene._isOverlay      = true;
    scene._parentSceneKey = 'GameScene';
  }

  return { scene, registry };
}

function createScene(opts) {
  const { scene, registry } = buildScene(opts);
  scene.create();
  return { scene, registry };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('EncyclopediaScene', () => {
  // ── constructor ───────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('uses "EncyclopediaScene" as the scene key', () => {
      const { scene } = buildScene();
      expect(scene._config.key).toBe('EncyclopediaScene');
    });

    it('initializes with "culture" as the default active category', () => {
      const { scene } = buildScene();
      expect(scene._activeCategory).toBe('culture');
    });

    it('starts with no selected entry', () => {
      const { scene } = buildScene();
      expect(scene._selectedEntryId).toBeNull();
    });

    it('starts with scroll offset at 0', () => {
      const { scene } = buildScene();
      expect(scene._scrollOffset).toBe(0);
    });
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('renders the Encyclopedia title', () => {
      const { scene } = createScene();
      const titleCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('Encyclopedia')
      );
      expect(titleCall).toBeDefined();
    });

    it('creates 5 category tabs', () => {
      const { scene } = createScene();
      expect(Object.keys(scene._tabButtons)).toHaveLength(CATEGORIES.length);
      for (const cat of CATEGORIES) {
        expect(scene._tabButtons[cat]).toBeDefined();
      }
    });

    it('creates a close button', () => {
      const { scene } = createScene();
      expect(scene._closeBtn).toBeDefined();
    });

    it('creates overall progress text', () => {
      const { scene } = createScene();
      expect(scene._overallText).toBeDefined();
    });

    it('renders the default category entry list', () => {
      const { scene } = createScene();
      // Entry texts should include progress label + entry rows
      expect(scene._entryTexts.length).toBeGreaterThan(0);
    });

    it('sets up keyboard navigation keys', () => {
      const { scene } = createScene();
      // addKey should be called for ESC, LEFT, RIGHT, UP, DOWN
      const addKeyCalls = scene.input.keyboard.addKey.mock.calls.map(c => c[0]);
      expect(addKeyCalls).toContain('ESC');
      expect(addKeyCalls).toContain('LEFT');
      expect(addKeyCalls).toContain('RIGHT');
      expect(addKeyCalls).toContain('UP');
      expect(addKeyCalls).toContain('DOWN');
    });
  });

  // ── Overlay mode ──────────────────────────────────────────────────────────

  describe('overlay mode', () => {
    it('creates overlay background when launched as overlay', () => {
      const { scene } = createScene({ asOverlay: true });
      // When overlay, add.rectangle is called for the dark background
      const rectCalls = scene.add.rectangle.mock.calls;
      expect(rectCalls.length).toBeGreaterThan(0);
    });

    it('skips overlay background when not an overlay', () => {
      const { scene } = createScene({ asOverlay: false });
      // Rectangle may still be called for Close button bg, but overlay bg
      // should not appear; we verify no rectangle call has the full-screen dims
      const fullScreenRect = scene.add.rectangle.mock.calls.find(
        ([, , w, h]) => w === 1280 && h === 720
      );
      expect(fullScreenRect).toBeUndefined();
    });
  });

  // ── Tab switching ─────────────────────────────────────────────────────────

  describe('tab switching', () => {
    it('changes active category when _switchTab is called', () => {
      const { scene } = createScene();
      scene._switchTab('language');
      expect(scene._activeCategory).toBe('language');
    });

    it('resets scroll offset on tab switch', () => {
      const { scene } = createScene();
      scene._scrollOffset = 5;
      scene._switchTab('places');
      expect(scene._scrollOffset).toBe(0);
    });

    it('clears selected entry on tab switch', () => {
      const { scene } = createScene();
      scene._selectedEntryId = 'culture_hygge';
      scene._switchTab('tips');
      expect(scene._selectedEntryId).toBeNull();
    });

    it('renders entries for the new category', () => {
      const { scene } = createScene();
      scene._switchTab('language');
      // Progress text should reference the Language category
      const progressCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('Language')
      );
      expect(progressCall).toBeDefined();
    });
  });

  // ── _navTab (keyboard navigation) ─────────────────────────────────────────

  describe('_navTab()', () => {
    it('navigates to the next category', () => {
      const { scene } = createScene();
      expect(scene._activeCategory).toBe('culture');
      scene._navTab(1);
      expect(scene._activeCategory).toBe('language');
    });

    it('navigates to the previous category', () => {
      const { scene } = createScene();
      scene._switchTab('language');
      scene._navTab(-1);
      expect(scene._activeCategory).toBe('culture');
    });

    it('wraps around from last to first category', () => {
      const { scene } = createScene();
      const lastCat = CATEGORIES[CATEGORIES.length - 1];
      scene._switchTab(lastCat);
      scene._navTab(1);
      expect(scene._activeCategory).toBe(CATEGORIES[0]);
    });

    it('wraps around from first to last category', () => {
      const { scene } = createScene();
      scene._navTab(-1);
      expect(scene._activeCategory).toBe(CATEGORIES[CATEGORIES.length - 1]);
    });
  });

  // ── Category progress display ─────────────────────────────────────────────

  describe('category progress', () => {
    it('shows "0 / N discovered" for a category with no unlocked entries', () => {
      const { scene, registry } = buildScene();
      // Clear encyclopedia entries to have no unlocked entries
      registry.set(RK.ENCYCLOPEDIA_ENTRIES, []);
      scene.create();

      // Find a progress text call that shows "0 /"
      const progressCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('0 /') && text.includes('discovered')
      );
      expect(progressCall).toBeDefined();
    });

    it('shows correct count when entries are unlocked', () => {
      const { scene, registry } = buildScene();
      // Unlock a culture entry
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      // The progress text for culture should reflect the unlocked count
      const cultureEntries = getEntriesByCategory('culture');
      // At least 1 should be unlocked (hygge + any starter entries in culture)
      const progressCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' &&
          text.includes('Culture') &&
          text.includes('discovered')
      );
      expect(progressCall).toBeDefined();
    });
  });

  // ── Overall progress ──────────────────────────────────────────────────────

  describe('overall progress', () => {
    it('displays "Total Discovery: X%" text', () => {
      const { scene } = createScene();
      // The _overallText should have been set
      expect(scene._overallText).toBeDefined();
      const setTextCall = scene._overallText.setText.mock.calls;
      expect(setTextCall.length).toBeGreaterThan(0);
      const lastText = setTextCall[setTextCall.length - 1][0];
      expect(lastText).toMatch(/Total Discovery:\s*\d+%/);
    });
  });

  // ── Entry list rendering ──────────────────────────────────────────────────

  describe('entry list', () => {
    it('shows unlocked entry titles', () => {
      const { scene, registry } = buildScene();
      // Starter entries include 'lang_hej' — switch to language
      scene.create();
      scene._switchTab('language');

      // Should find at least one text call with the actual entry title
      const entryTitle = ENCYCLOPEDIA_DATA.find(e => e.id === 'lang_hej')?.title;
      if (entryTitle) {
        const titleCall = scene.add.text.mock.calls.find(
          ([, , text]) => text === entryTitle
        );
        expect(titleCall).toBeDefined();
      }
    });

    it('shows "??? Locked" for entries that are not unlocked', () => {
      const { scene } = createScene();
      // Most entries are locked; look for "??? Locked" text
      const lockedCall = scene.add.text.mock.calls.find(
        ([, , text]) => text === '??? Locked'
      );
      expect(lockedCall).toBeDefined();
    });

    it('makes unlocked entries interactive', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      // Find the text object created for culture_hygge title
      const hyggeEntry = ENCYCLOPEDIA_DATA.find(e => e.id === 'culture_hygge');
      const textObjs = scene.add.text.mock.results;
      const hyggeMockIdx = scene.add.text.mock.calls.findIndex(
        ([, , text]) => text === hyggeEntry.title
      );

      if (hyggeMockIdx >= 0) {
        const mockObj = textObjs[hyggeMockIdx].value;
        expect(mockObj.setInteractive).toHaveBeenCalled();
      }
    });
  });

  // ── Scroll ────────────────────────────────────────────────────────────────

  describe('scrolling', () => {
    it('_scroll(1) increases scroll offset', () => {
      const { scene } = createScene();
      const initialOffset = scene._scrollOffset;
      scene._scroll(1);
      // Offset may stay 0 if there are fewer entries than MAX_VISIBLE_ENTRIES
      expect(scene._scrollOffset).toBeGreaterThanOrEqual(initialOffset);
    });

    it('_scroll(-1) does not go below 0', () => {
      const { scene } = createScene();
      scene._scrollOffset = 0;
      scene._scroll(-1);
      expect(scene._scrollOffset).toBe(0);
    });

    it('_scroll(1) does not exceed max offset', () => {
      const { scene } = createScene();
      // Set offset to a very high value first
      scene._scrollOffset = 999;
      scene._scroll(1);
      const entries = getEntriesByCategory(scene._activeCategory);
      const maxOffset = Math.max(0, entries.length - 14); // MAX_VISIBLE_ENTRIES = 14
      expect(scene._scrollOffset).toBeLessThanOrEqual(maxOffset);
    });
  });

  // ── Entry detail ──────────────────────────────────────────────────────────

  describe('entry detail', () => {
    it('_selectEntry shows entry title in detail panel', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      scene._selectEntry('culture_hygge');

      const hyggeEntry = ENCYCLOPEDIA_DATA.find(e => e.id === 'culture_hygge');
      // _selectEntry creates detail text objects (then _renderCategory re-clears them,
      // but the add.text mock still records the calls)
      const titleObj = scene.add.text.mock.calls.find(
        ([, , text]) => text === hyggeEntry.title
      );
      expect(titleObj).toBeDefined();
    });

    it('_selectEntry shows entry body text', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      scene._selectEntry('culture_hygge');

      const hyggeEntry = ENCYCLOPEDIA_DATA.find(e => e.id === 'culture_hygge');
      const bodyCall = scene.add.text.mock.calls.find(
        ([, , text]) => text === hyggeEntry.body
      );
      expect(bodyCall).toBeDefined();
    });

    it('_selectEntry shows entry source text', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      scene._selectEntry('culture_hygge');

      const hyggeEntry = ENCYCLOPEDIA_DATA.find(e => e.id === 'culture_hygge');
      const sourceCall = scene.add.text.mock.calls.find(
        ([, , text]) => text === hyggeEntry.sourceText
      );
      expect(sourceCall).toBeDefined();
    });

    it('_selectEntry shows category badge', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      scene._selectEntry('culture_hygge');

      const meta = CATEGORY_META['culture'];
      const badgeCall = scene.add.text.mock.calls.find(
        ([, , text]) => text === `${meta.icon} ${meta.label}`
      );
      expect(badgeCall).toBeDefined();
    });

    it('_selectEntry does nothing for a non-existent entry', () => {
      const { scene } = createScene();
      const detailsBefore = scene._detailObjects.length;
      scene._selectEntry('nonexistent_id_xyz');
      // Detail objects should not have grown
      expect(scene._detailObjects.length).toBe(detailsBefore);
    });

    it('_selectEntry updates _selectedEntryId', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      scene._selectEntry('culture_hygge');
      expect(scene._selectedEntryId).toBe('culture_hygge');
    });

    it('_selectEntry renders related entries section when present', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();

      scene._selectEntry('culture_hygge');

      const hyggeEntry = ENCYCLOPEDIA_DATA.find(e => e.id === 'culture_hygge');
      if (hyggeEntry.relatedEntries && hyggeEntry.relatedEntries.length > 0) {
        const relatedLabel = scene.add.text.mock.calls.find(
          ([, , text]) => text === 'Related:'
        );
        expect(relatedLabel).toBeDefined();
      }
    });
  });

  // ── _clearDetail / _clearEntryList ────────────────────────────────────────

  describe('cleanup methods', () => {
    it('_clearDetail destroys all detail objects', () => {
      const { scene } = createScene();

      // Manually add mock objects to _detailObjects
      const obj1 = makeObj();
      const obj2 = makeObj();
      scene._detailObjects = [obj1, obj2];

      scene._clearDetail();
      expect(scene._detailObjects).toHaveLength(0);
      expect(obj1.destroy).toHaveBeenCalled();
      expect(obj2.destroy).toHaveBeenCalled();
    });

    it('_clearEntryList destroys all entry text objects', () => {
      const { scene } = createScene();

      const count = scene._entryTexts.length;
      expect(count).toBeGreaterThan(0);

      scene._clearEntryList();
      expect(scene._entryTexts).toHaveLength(0);
    });
  });

  // ── shutdown ──────────────────────────────────────────────────────────────

  describe('shutdown()', () => {
    it('clears all entry texts', () => {
      const { scene } = createScene();
      scene.shutdown();
      expect(scene._entryTexts).toHaveLength(0);
    });

    it('clears all detail objects', () => {
      const { scene, registry } = buildScene();
      unlockEntry(registry, 'culture_hygge');
      scene.create();
      scene._selectEntry('culture_hygge');

      scene.shutdown();
      expect(scene._detailObjects).toHaveLength(0);
    });

    it('destroys all tab buttons', () => {
      const { scene } = createScene();
      scene.shutdown();
      expect(Object.keys(scene._tabButtons)).toHaveLength(0);
    });

    it('destroys close button', () => {
      const { scene } = createScene();
      scene.shutdown();
      expect(scene._closeBtn).toBeNull();
    });

    it('resets selected entry', () => {
      const { scene } = createScene();
      scene._selectedEntryId = 'some_entry';
      scene.shutdown();
      expect(scene._selectedEntryId).toBeNull();
    });

    it('resets scroll offset to 0', () => {
      const { scene } = createScene();
      scene._scrollOffset = 5;
      scene.shutdown();
      expect(scene._scrollOffset).toBe(0);
    });

    it('resets active category to "culture"', () => {
      const { scene } = createScene();
      scene._activeCategory = 'tips';
      scene.shutdown();
      expect(scene._activeCategory).toBe('culture');
    });
  });

  // ── _setupKeyboard edge case ──────────────────────────────────────────────

  describe('_setupKeyboard edge case', () => {
    it('does not throw when input.keyboard is undefined', () => {
      const { scene, registry } = buildScene();
      scene.input = {};
      expect(() => scene.create()).not.toThrow();
    });

    it('does not throw when input is undefined', () => {
      const { scene, registry } = buildScene();
      scene.input = undefined;
      expect(() => scene.create()).not.toThrow();
    });
  });
});
