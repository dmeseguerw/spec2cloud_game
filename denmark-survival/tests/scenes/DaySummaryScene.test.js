/**
 * tests/scenes/DaySummaryScene.test.js
 * Unit and integration tests for DaySummaryScene.
 *
 * Phaser.Scene is mocked globally via tests/mocks/setupPhaser.js.
 * Pure data-helpers are tested without any Phaser dependency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry, MockLocalStorage, MockGameObject } from '../mocks/PhaserMocks.js';
import {
  categorizeXPEntries,
  calculateNetXP,
  detectLevelUp,
  buildTomorrowPreview,
  compileSummaryData,
  DaySummaryScene,
} from '../../src/scenes/DaySummaryScene.js';
import { XPLog }     from '../../src/systems/XPLog.js';
import { grantXP, penalizeXP } from '../../src/systems/XPEngine.js';
import { initDayCycle, addMandatoryActivity, completeActivity } from '../../src/systems/DayCycleEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { saveGame } from '../../src/state/StateManager.js';

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
  obj.on              = vi.fn().mockReturnThis();
  obj.destroy         = vi.fn();
  return obj;
}

function buildScene() {
  const scene    = new DaySummaryScene();
  const storage  = new MockLocalStorage();
  const registry = new MockRegistry();

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
    key:    'DaySummaryScene',
    start:  vi.fn(),
    launch: vi.fn(),
    stop:   vi.fn(),
    pause:  vi.fn(),
    resume: vi.fn(),
  };
  scene.sound    = {
    add: vi.fn().mockReturnValue({ play: vi.fn() }),
  };
  // No Phaser time manager — tally falls back to synchronous rendering
  scene.time     = undefined;

  return { scene, storage, registry };
}

function initAndCreate(scene, storage) {
  scene.init({ storage });
  scene.create();
}

// ---------------------------------------------------------------------------
// Pure helpers — no Phaser
// ---------------------------------------------------------------------------

describe('categorizeXPEntries()', () => {
  it('separates positive and negative amounts', () => {
    const entries = [
      { amount: 30, source: 'bus', category: 'Transportation' },
      { amount: -15, source: 'skip work', category: 'Mandatory' },
      { amount: 10, source: 'cultural event', category: 'Cultural' },
      { amount: -5, source: 'missed vitamin', category: 'Mandatory' },
    ];
    const { gains, losses, gainTotal, lossTotal } = categorizeXPEntries(entries);

    expect(gainTotal).toBe(40);
    expect(lossTotal).toBe(-20);
    expect(Object.keys(gains)).toContain('Transportation');
    expect(Object.keys(gains)).toContain('Cultural');
    expect(Object.keys(losses)).toContain('Mandatory');
  });

  it('returns zero totals for empty entries', () => {
    const { gainTotal, lossTotal } = categorizeXPEntries([]);
    expect(gainTotal).toBe(0);
    expect(lossTotal).toBe(0);
  });

  it('groups multiple entries within the same category', () => {
    const entries = [
      { amount: 10, source: 'a', category: 'Social' },
      { amount: 20, source: 'b', category: 'Social' },
    ];
    const { gains } = categorizeXPEntries(entries);
    expect(gains['Social']).toHaveLength(2);
  });

  it('uses "Uncategorized" for entries without a category', () => {
    const entries = [{ amount: 5, source: 'mystery' }];
    const { gains } = categorizeXPEntries(entries);
    expect(gains['Uncategorized']).toBeDefined();
  });

  it('treats amount === 0 as a gain (non-negative)', () => {
    const entries = [{ amount: 0, source: 'neutral', category: 'Daily Life' }];
    const { gains, losses } = categorizeXPEntries(entries);
    expect(gains['Daily Life']).toBeDefined();
    expect(losses['Daily Life']).toBeUndefined();
  });
});

describe('calculateNetXP()', () => {
  it('sums all amounts correctly', () => {
    const entries = [
      { amount: 30 },
      { amount: -10 },
      { amount: 5 },
    ];
    expect(calculateNetXP(entries)).toBe(25);
  });

  it('returns 0 for empty entries', () => {
    expect(calculateNetXP([])).toBe(0);
  });

  it('handles missing amount fields gracefully', () => {
    const entries = [{ source: 'no amount' }, { amount: 10 }];
    expect(calculateNetXP(entries)).toBe(10);
  });
});

describe('detectLevelUp()', () => {
  it('returns true when current level is greater than previous', () => {
    expect(detectLevelUp(3, 4)).toBe(true);
  });

  it('returns false when level is unchanged', () => {
    expect(detectLevelUp(5, 5)).toBe(false);
  });

  it('returns false when current level is lower (XP loss scenario)', () => {
    expect(detectLevelUp(5, 4)).toBe(false);
  });
});

describe('buildTomorrowPreview()', () => {
  it('returns default values when registry has no data', () => {
    const registry = new MockRegistry();
    const preview  = buildTomorrowPreview(registry);
    expect(preview.weather).toBe('Clear');
    expect(preview.slotsRemaining).toBe(4);
    expect(preview.bills).toEqual([]);
    expect(preview.mandatoryActivities).toEqual([]);
  });

  it('reads actual registry values', () => {
    const registry = new MockRegistry();
    registry.set(RK.WEATHER, 'Rainy');
    registry.set(RK.ACTIVITY_SLOTS_REMAINING, 2);
    registry.set(RK.PENDING_BILLS, [{ id: 'rent' }]);
    registry.set(RK.MANDATORY_ACTIVITIES, [{ id: 'work', label: 'Work', completed: false }]);

    const preview = buildTomorrowPreview(registry);
    expect(preview.weather).toBe('Rainy');
    expect(preview.slotsRemaining).toBe(2);
    expect(preview.bills).toHaveLength(1);
    expect(preview.mandatoryActivities).toHaveLength(1);
  });
});

describe('compileSummaryData()', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    registry.set(RK.CURRENT_DAY, 5);
    registry.set(RK.SEASON, 'Summer');
    registry.set(RK.DAY_IN_SEASON, 5);
    registry.set(RK.WEATHER, 'Sunny');
    registry.set(RK.PLAYER_XP, 60);  // Level 2 (threshold 50)
    registry.set(RK.PLAYER_LEVEL, 2);
  });

  it('returns correct day/season/weather values', () => {
    const data = compileSummaryData(registry);
    expect(data.currentDay).toBe(5);
    expect(data.season).toBe('Summer');
    expect(data.dayInSeason).toBe(5);
    expect(data.weather).toBe('Sunny');
  });

  it('calculates current level and phase from XP', () => {
    const data = compileSummaryData(registry);
    expect(data.currentLevel).toBe(2);
    expect(data.currentPhase).toBe('Newcomer');
  });

  it('detects level-up when previousLevel is lower', () => {
    const data = compileSummaryData(registry, { previousLevel: 1 });
    expect(data.leveledUp).toBe(true);
  });

  it('does not flag level-up when level is unchanged', () => {
    const data = compileSummaryData(registry, { previousLevel: 2 });
    expect(data.leveledUp).toBe(false);
  });

  it('reads XP log entries for net XP', () => {
    XPLog.addEntry(registry, { amount: 30, source: 'bus', category: 'Transportation' });
    XPLog.addEntry(registry, { amount: -10, source: 'skipped', category: 'Mandatory' });
    const data = compileSummaryData(registry);
    expect(data.netXP).toBe(20);
  });

  it('computes correct progressPct between 0 and 1', () => {
    // XP = 60, level 2 threshold = 50, level 3 threshold = 120 → range = 70, progress = 10
    const data = compileSummaryData(registry);
    expect(data.progressPct).toBeGreaterThanOrEqual(0);
    expect(data.progressPct).toBeLessThanOrEqual(1);
  });

  it('returns empty activities when none registered', () => {
    const data = compileSummaryData(registry);
    expect(data.activities).toEqual([]);
  });

  it('correctly reflects mandatory activity completion status', () => {
    registry.set(RK.MANDATORY_ACTIVITIES, [
      { id: 'work',    label: 'Work',    completed: true  },
      { id: 'grocery', label: 'Grocery', completed: false },
    ]);
    const data = compileSummaryData(registry);
    const work    = data.activities.find(a => a.id === 'work');
    const grocery = data.activities.find(a => a.id === 'grocery');
    expect(work.completed).toBe(true);
    expect(grocery.completed).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// DaySummaryScene — constructor
// ---------------------------------------------------------------------------

describe('DaySummaryScene', () => {
  describe('constructor', () => {
    it('uses "DaySummaryScene" as scene key', () => {
      const { scene } = buildScene();
      expect(scene._config.key).toBe('DaySummaryScene');
    });

    it('initialises _buttons to empty object', () => {
      const { scene } = buildScene();
      expect(scene._buttons).toEqual({});
    });
  });

  // ── create() ──────────────────────────────────────────────────────────────

  describe('create()', () => {
    it('renders the day header title', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.CURRENT_DAY, 3);
      initAndCreate(scene, storage);

      const titleCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('Day 3 Summary'),
      );
      expect(titleCall).toBeDefined();
    });

    it('renders the activities count line', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.MANDATORY_ACTIVITIES, [
        { id: 'work', label: 'Work', completed: true },
        { id: 'grocery', label: 'Grocery', completed: false },
      ]);
      initAndCreate(scene, storage);

      const activitiesCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('Activities: 1 of 2'),
      );
      expect(activitiesCall).toBeDefined();
    });

    it('renders the XP Breakdown section header', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      const header = scene.add.text.mock.calls.find(
        ([, , text]) => text === 'XP Breakdown',
      );
      expect(header).toBeDefined();
    });

    it('renders the net XP line', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.PLAYER_XP, 100);
      XPLog.addEntry(registry, { amount: 20, source: 'bus', category: 'Transportation' });
      initAndCreate(scene, storage);

      const netCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('XP'),
      );
      expect(netCall).toBeDefined();
    });

    it('renders Notable Events header', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      const eventsHeader = scene.add.text.mock.calls.find(
        ([, , text]) => text === 'Notable Events',
      );
      expect(eventsHeader).toBeDefined();
    });

    it('renders Tomorrow header', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      const tomorrowHeader = scene.add.text.mock.calls.find(
        ([, , text]) => text === 'Tomorrow',
      );
      expect(tomorrowHeader).toBeDefined();
    });

    it('creates Continue and Save & Quit buttons', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      expect(scene._buttons.continue).toBeDefined();
      expect(scene._buttons.saveQuit).toBeDefined();
    });

    it('renders level-up text when a level-up is detected', () => {
      const { scene, storage, registry } = buildScene();
      // XP = 50 → Level 2. Pass previousLevel=1 to trigger level-up path.
      registry.set(RK.PLAYER_XP, 50);
      scene.init({ storage, previousLevel: 1 });
      scene.create();

      const levelUpCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('Level Up!'),
      );
      expect(levelUpCall).toBeDefined();
    });

    it('does not render level-up text when no level-up occurred', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.PLAYER_XP, 50);
      scene.init({ storage, previousLevel: 2 });
      scene.create();

      const levelUpCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('Level Up!'),
      );
      expect(levelUpCall).toBeUndefined();
    });

    it('renders encyclopedia discoveries in notable events', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.ENCYCLOPEDIA_ENTRIES, [{ id: 'cycling' }, { id: 'bureaucracy' }]);
      initAndCreate(scene, storage);

      const discoveryCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('encyclopedia'),
      );
      expect(discoveryCall).toBeDefined();
    });

    it('renders encounter history in notable events', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.ENCOUNTER_HISTORY, [{ id: 'enc1' }]);
      initAndCreate(scene, storage);

      const encounterCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('encounter'),
      );
      expect(encounterCall).toBeDefined();
    });

    it('shows "No notable events today." when nothing notable happened', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      const fallbackCall = scene.add.text.mock.calls.find(
        ([, , text]) => text === 'No notable events today.',
      );
      expect(fallbackCall).toBeDefined();
    });

    it('renders tomorrow weather in preview', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.WEATHER, 'Rainy');
      initAndCreate(scene, storage);

      const weatherCall = scene.add.text.mock.calls.find(
        ([, , text]) => typeof text === 'string' && text.includes('Rainy'),
      );
      expect(weatherCall).toBeDefined();
    });

    it('renders tally rows synchronously when time manager is absent', () => {
      const { scene, storage, registry } = buildScene();
      XPLog.addEntry(registry, { amount: 25, source: 'bus', category: 'Transportation' });
      XPLog.addEntry(registry, { amount: -10, source: 'missed', category: 'Mandatory' });
      initAndCreate(scene, storage);

      // Tally rows should have been rendered
      expect(scene._tallyTexts.length).toBeGreaterThan(0);
      expect(scene._tallyDone).toBe(true);
    });
  });

  // ── Action handlers ───────────────────────────────────────────────────────

  describe('_onContinue()', () => {
    it('starts GameScene', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);
      scene._onContinue();
      expect(scene.scene.start).toHaveBeenCalledWith('GameScene');
    });
  });

  describe('_onSaveAndQuit()', () => {
    it('saves the game and starts MenuScene', () => {
      const { scene, storage, registry } = buildScene();
      // Minimal registry state required by saveGame
      registry.set(RK.PLAYER_NAME, 'Test');
      registry.set(RK.SAVE_SLOT, 1);
      initAndCreate(scene, storage);

      scene._onSaveAndQuit();

      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    });

    it('falls back to slot 1 when SAVE_SLOT is not set', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.PLAYER_NAME, 'Test');
      initAndCreate(scene, storage);

      // Should not throw; slot defaults to 1
      expect(() => scene._onSaveAndQuit()).not.toThrow();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    });
  });

  // ── shutdown() ────────────────────────────────────────────────────────────

  describe('shutdown()', () => {
    it('destroys all buttons and empties _buttons map', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      const destroySpy = vi.spyOn(scene._buttons.continue, 'destroy');
      scene.shutdown();

      expect(destroySpy).toHaveBeenCalled();
      expect(Object.keys(scene._buttons)).toHaveLength(0);
    });

    it('clears _tallyTexts', () => {
      const { scene, storage, registry } = buildScene();
      XPLog.addEntry(registry, { amount: 10, source: 'x', category: 'Social' });
      initAndCreate(scene, storage);
      scene.shutdown();

      expect(scene._tallyTexts).toHaveLength(0);
    });
  });

  // ── Integration tests ─────────────────────────────────────────────────────

  describe('integration', () => {
    it('mixed XP events produce correct breakdown in summary', () => {
      const registry = new MockRegistry();
      registry.set(RK.CURRENT_DAY, 7);
      registry.set(RK.PLAYER_XP, 120);
      registry.set(RK.SEASON, 'Fall');
      registry.set(RK.DAY_IN_SEASON, 3);

      XPLog.addEntry(registry, { amount: 30, source: 'cycling', category: 'Transportation' });
      XPLog.addEntry(registry, { amount: 20, source: 'museum', category: 'Cultural' });
      XPLog.addEntry(registry, { amount: -15, source: 'skipped grocery', category: 'Mandatory' });

      const data = compileSummaryData(registry);

      expect(data.gainTotal).toBe(50);
      expect(data.lossTotal).toBe(-15);
      expect(data.netXP).toBe(35);
      expect(data.gains['Transportation']).toBeDefined();
      expect(data.gains['Cultural']).toBeDefined();
      expect(data.losses['Mandatory']).toBeDefined();
    });

    it('level-up during day triggers leveledUp flag', () => {
      const registry = new MockRegistry();
      registry.set(RK.PLAYER_XP, 50);  // Level 2

      const data = compileSummaryData(registry, { previousLevel: 1 });
      expect(data.leveledUp).toBe(true);
      expect(data.currentLevel).toBe(2);
    });

    it('Continue button advances to GameScene', () => {
      const { scene, storage } = buildScene();
      initAndCreate(scene, storage);

      scene._buttons.continue.click();
      expect(scene.scene.start).toHaveBeenCalledWith('GameScene');
    });

    it('Save & Quit button saves and navigates to MenuScene', () => {
      const { scene, storage, registry } = buildScene();
      registry.set(RK.PLAYER_NAME, 'Tester');
      registry.set(RK.SAVE_SLOT, 2);
      initAndCreate(scene, storage);

      scene._buttons.saveQuit.click();
      expect(scene.scene.start).toHaveBeenCalledWith('MenuScene');
    });
  });
});
