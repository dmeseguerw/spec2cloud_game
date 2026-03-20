/**
 * tests/scenes/DaySummaryScene.day1.test.js
 * Unit tests for Day 1 enhancements to DaySummaryScene.
 *
 * Tests pure exported functions without Phaser dependency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry, MockGameObject } from '../mocks/PhaserMocks.js';
import {
  DAY1_XP_LABELS,
  DAY1_TOMORROW_PREVIEW_TEXT,
  buildTomorrowPreview,
  DaySummaryScene,
} from '../../src/scenes/DaySummaryScene.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

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
  scene.sound    = { add: vi.fn().mockReturnValue({ play: vi.fn() }) };
  scene.time     = undefined;

  return { scene, registry };
}

// ─────────────────────────────────────────────────────────────────────────────
// DAY1_XP_LABELS
// ─────────────────────────────────────────────────────────────────────────────

describe('DAY1_XP_LABELS', () => {
  it('has a label for lars_dialogue', () => {
    expect(DAY1_XP_LABELS['lars_dialogue']).toBe('Talked with Lars');
  });

  it('has a label for First grocery run completed', () => {
    expect(DAY1_XP_LABELS['First grocery run completed']).toBe('First grocery run completed');
  });

  it('has a label for first Netto visit', () => {
    expect(DAY1_XP_LABELS['Visited Netto for the first time']).toBeDefined();
  });

  it('has a label for First item use', () => {
    expect(DAY1_XP_LABELS['First item use']).toBe('Ate a meal');
  });

  it('has a label for pant bottle pickup', () => {
    expect(DAY1_XP_LABELS['Picked up pant bottle']).toBe('Picked up pant bottle');
  });

  it('has a label for pant bottle return', () => {
    expect(DAY1_XP_LABELS['Returned pant bottles']).toBe('Returned pant bottles');
  });

  it('has a label for surviving first day', () => {
    expect(DAY1_XP_LABELS['Survived first day']).toBe('Survived your first day!');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DAY1_TOMORROW_PREVIEW_TEXT
// ─────────────────────────────────────────────────────────────────────────────

describe('DAY1_TOMORROW_PREVIEW_TEXT', () => {
  it('mentions a language school', () => {
    expect(DAY1_TOMORROW_PREVIEW_TEXT.toLowerCase()).toContain('language school');
  });

  it('mentions Lars', () => {
    expect(DAY1_TOMORROW_PREVIEW_TEXT).toContain('Lars');
  });

  it('mentions tomorrow', () => {
    expect(DAY1_TOMORROW_PREVIEW_TEXT.toLowerCase()).toContain('tomorrow');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildTomorrowPreview() — Day 1 preview includes seed text
// ─────────────────────────────────────────────────────────────────────────────

describe('buildTomorrowPreview() with Day 1 registry', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    registry.set(RK.CURRENT_DAY,              1);
    registry.set(RK.TUTORIAL_COMPLETED,       false);
    registry.set(RK.MANDATORY_ACTIVITIES,     []);
    registry.set(RK.PENDING_BILLS,            []);
    registry.set(RK.WEATHER,                  'Cloudy');
    registry.set(RK.ACTIVITY_SLOTS_REMAINING, 4);
  });

  it('returns weather from registry', () => {
    const preview = buildTomorrowPreview(registry);
    expect(preview.weather).toBe('Cloudy');
  });

  it('returns slotsRemaining from registry', () => {
    const preview = buildTomorrowPreview(registry);
    expect(preview.slotsRemaining).toBe(4);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DaySummaryScene._onContinue() — TUTORIAL_COMPLETED set on Day 1
// ─────────────────────────────────────────────────────────────────────────────

describe('DaySummaryScene._onContinue()', () => {
  it('sets TUTORIAL_COMPLETED=true and CURRENT_DAY=2 when continuing from Day 1', () => {
    const { scene, registry } = buildScene();
    registry.set(RK.CURRENT_DAY,        1);
    registry.set(RK.TUTORIAL_COMPLETED, false);

    scene._onContinue();

    expect(registry.get(RK.TUTORIAL_COMPLETED)).toBe(true);
    expect(registry.get(RK.CURRENT_DAY)).toBe(2);
    expect(scene.scene.start).toHaveBeenCalledWith('GameScene');
  });

  it('does NOT change TUTORIAL_COMPLETED when continuing from Day 2+', () => {
    const { scene, registry } = buildScene();
    registry.set(RK.CURRENT_DAY,        2);
    registry.set(RK.TUTORIAL_COMPLETED, true);

    scene._onContinue();

    expect(registry.get(RK.TUTORIAL_COMPLETED)).toBe(true);
    expect(registry.get(RK.CURRENT_DAY)).toBe(2); // unchanged
    expect(scene.scene.start).toHaveBeenCalledWith('GameScene');
  });

  it('does NOT set TUTORIAL_COMPLETED if already true on Day 1 (idempotent)', () => {
    const { scene, registry } = buildScene();
    registry.set(RK.CURRENT_DAY,        1);
    registry.set(RK.TUTORIAL_COMPLETED, true); // already completed

    scene._onContinue();

    // Still transitions scenes but doesn't re-set day
    expect(scene.scene.start).toHaveBeenCalledWith('GameScene');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DaySummaryScene — Day 1 tomorrow preview rendered
// ─────────────────────────────────────────────────────────────────────────────

describe('DaySummaryScene create() — Day 1 tomorrow preview', () => {
  it('includes DAY1_TOMORROW_PREVIEW_TEXT in rendered lines on Day 1', () => {
    const { scene, registry } = buildScene();

    registry.set(RK.CURRENT_DAY,              1);
    registry.set(RK.TUTORIAL_COMPLETED,       false);
    registry.set(RK.MANDATORY_ACTIVITIES,     []);
    registry.set(RK.PENDING_BILLS,            []);
    registry.set(RK.WEATHER,                  'Cloudy');
    registry.set(RK.ACTIVITY_SLOTS_REMAINING, 4);
    registry.set(RK.PLAYER_XP,               0);
    registry.set(RK.PLAYER_LEVEL,             1);
    registry.set(RK.SEASON,                   'Autumn');
    registry.set(RK.DAY_IN_SEASON,            1);
    registry.set(RK.ENCOUNTER_HISTORY,        []);
    registry.set(RK.ENCYCLOPEDIA_ENTRIES,     []);
    registry.set(RK.NPC_RELATIONSHIPS,        {});

    scene.init({ storage: null });
    scene.create();

    // Collect all text calls and their first argument
    const textCalls = scene.add.text.mock.calls.map(args => args[2]);
    const allTexts  = textCalls.join(' ');

    expect(allTexts).toContain('language school');
  });

  it('does NOT include Day 1 preview text on Day 2', () => {
    const { scene, registry } = buildScene();

    registry.set(RK.CURRENT_DAY,              2);
    registry.set(RK.TUTORIAL_COMPLETED,       true);
    registry.set(RK.MANDATORY_ACTIVITIES,     []);
    registry.set(RK.PENDING_BILLS,            []);
    registry.set(RK.WEATHER,                  'Sunny');
    registry.set(RK.ACTIVITY_SLOTS_REMAINING, 4);
    registry.set(RK.PLAYER_XP,               0);
    registry.set(RK.PLAYER_LEVEL,             1);
    registry.set(RK.SEASON,                   'Autumn');
    registry.set(RK.DAY_IN_SEASON,            2);
    registry.set(RK.ENCOUNTER_HISTORY,        []);
    registry.set(RK.ENCYCLOPEDIA_ENTRIES,     []);
    registry.set(RK.NPC_RELATIONSHIPS,        {});

    scene.init({ storage: null });
    scene.create();

    const textCalls = scene.add.text.mock.calls.map(args => args[2]);
    const allTexts  = textCalls.join(' ');

    expect(allTexts).not.toContain('language school');
  });
});
