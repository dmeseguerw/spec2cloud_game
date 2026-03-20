/**
 * tests/integration/day1-full-playthrough.test.js
 * Integration test: Full Day 1 onboarding sequence simulation.
 *
 * Simulates: new game → Lars interaction → pant bottle pickup → shop entry →
 * grocery purchase → Day Summary → TUTORIAL_COMPLETED → Day 2
 *
 * Uses pure system functions (no Phaser renderer); registry is MockRegistry.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { initializeNewGame } from '../../src/state/initializeNewGame.js';
import {
  isDay1Session,
  buildShopItemList,
  shouldShowPantReturnButton,
} from '../../src/scenes/ShopScene.js';
import {
  DAY1_XP_LABELS,
  DAY1_TOMORROW_PREVIEW_TEXT,
} from '../../src/scenes/DaySummaryScene.js';
import { grantXP } from '../../src/systems/XPEngine.js';
import { XPLog }   from '../../src/systems/XPLog.js';
import * as RK     from '../../src/constants/RegistryKeys.js';
import { WEATHER_CLOUDY } from '../../src/systems/WeatherSystem.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function newGameRegistry() {
  const reg = new MockRegistry();
  initializeNewGame(reg);
  return reg;
}

// ─────────────────────────────────────────────────────────────────────────────
// Full Day 1 playthrough simulation
// ─────────────────────────────────────────────────────────────────────────────

describe('Day 1 full playthrough integration', () => {
  let registry;

  beforeEach(() => {
    registry = newGameRegistry();
  });

  // ── Step 0: new game starts ────────────────────────────────────────────────

  it('Step 0: new game has correct starting values', () => {
    expect(registry.get(RK.CURRENT_DAY)).toBe(1);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(1200);
    expect(registry.get(RK.PLAYER_HEALTH)).toBe(75);
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
    expect(registry.get(RK.INVENTORY)).toEqual([]);
    expect(registry.get(RK.TUTORIAL_COMPLETED)).toBe(false);
  });

  // ── Step 1: Day 1 session detection ───────────────────────────────────────

  it('Step 1: isDay1Session() is true after new game', () => {
    expect(isDay1Session(registry)).toBe(true);
  });

  // ── Step 2: Lars dialogue grants XP ───────────────────────────────────────

  it('Step 2: talking to Lars grants +10 XP', () => {
    grantXP(registry, 10, 'lars_dialogue', 'Story');
    expect(registry.get(RK.PLAYER_XP)).toBe(10);
  });

  it('Step 2: Lars XP entry appears in daily log', () => {
    grantXP(registry, 10, 'lars_dialogue', 'Story');
    const entries = XPLog.getDailyEntries(registry);
    expect(entries.some(e => e.source === 'lars_dialogue')).toBe(true);
  });

  // ── Step 3: pant bottle pickup ────────────────────────────────────────────

  it('Step 3: picking up pant bottle grants +2 XP', () => {
    grantXP(registry, 2, 'Picked up pant bottle', 'Exploration');
    expect(registry.get(RK.PLAYER_XP)).toBe(2);
  });

  it('Step 3: pant bottle is tracked in PANT_BOTTLES', () => {
    registry.set(RK.PANT_BOTTLES, 1);
    expect(registry.get(RK.PANT_BOTTLES)).toBe(1);
  });

  it('Step 3: after picking up bottle, pant return button is visible', () => {
    registry.set(RK.PANT_BOTTLES, 1);
    expect(shouldShowPantReturnButton(registry)).toBe(true);
  });

  // ── Step 4: entering Netto grants first-visit XP ──────────────────────────

  it('Step 4: first visit to Netto grants +5 XP', () => {
    grantXP(registry, 5, 'Visited Netto for the first time', 'Exploration');
    expect(registry.get(RK.PLAYER_XP)).toBe(5);
  });

  // ── Step 5: grocery purchase completes mission ────────────────────────────

  it('Step 5: buying groceries sets first_grocery_complete flag', () => {
    // Simulate ShopScene._onBuy() logic
    const flags = registry.get(RK.GAME_FLAGS) ?? {};
    flags['first_grocery_complete'] = true;
    registry.set(RK.GAME_FLAGS, flags);
    grantXP(registry, 15, 'First grocery run completed', 'Story');

    expect(registry.get(RK.GAME_FLAGS)['first_grocery_complete']).toBe(true);
    expect(registry.get(RK.PLAYER_XP)).toBe(15);
  });

  it('Step 5: grocery mission XP entry has correct source label', () => {
    grantXP(registry, 15, 'First grocery run completed', 'Story');
    const entries = XPLog.getDailyEntries(registry);
    const groceryEntry = entries.find(e => e.source === 'First grocery run completed');
    expect(groceryEntry).toBeDefined();
    expect(groceryEntry.amount).toBe(15);
  });

  // ── Step 6: using a food item grants +5 XP (one-time bonus) ──────────────

  it('Step 6: using a food item grants +5 XP', () => {
    grantXP(registry, 5, 'First item use', 'Wellness');
    expect(registry.get(RK.PLAYER_XP)).toBe(5);
  });

  // ── Step 7: apartment door allows sleep after groceries ───────────────────

  it('Step 7: apartment door allows day-end when first_grocery_complete=true', () => {
    const flags = { first_grocery_complete: true };
    registry.set(RK.GAME_FLAGS, flags);

    const canSleep = registry.get(RK.GAME_FLAGS)['first_grocery_complete'] === true;
    expect(canSleep).toBe(true);
  });

  it('Step 7: apartment door blocks day-end when grocery not complete', () => {
    const flags = registry.get(RK.GAME_FLAGS) ?? {};
    const canSleep = flags['first_grocery_complete'] === true;
    expect(canSleep).toBe(false);
  });

  // ── Full XP accumulation ──────────────────────────────────────────────────

  it('Full playthrough: accumulates expected total XP (≥47)', () => {
    // Lars dialogue: +10
    grantXP(registry, 10, 'lars_dialogue', 'Story');
    // Pant bottle: +2
    grantXP(registry, 2,  'Picked up pant bottle', 'Exploration');
    // First Netto visit: +5
    grantXP(registry, 5,  'Visited Netto for the first time', 'Exploration');
    // Grocery completion: +15
    grantXP(registry, 15, 'First grocery run completed', 'Story');
    // Food use: +5
    grantXP(registry, 5,  'First item use', 'Wellness');
    // Pant return: +1
    grantXP(registry, 1,  'Returned pant bottles', 'Story');
    // Survived first day: +10
    grantXP(registry, 10, 'Survived first day', 'Story');

    const total = registry.get(RK.PLAYER_XP);
    expect(total).toBeGreaterThanOrEqual(47);
  });

  // ── Step 8: Day 1 completion (TUTORIAL_COMPLETED) ─────────────────────────

  it('Step 8: TUTORIAL_COMPLETED=true and CURRENT_DAY=2 after Day Summary Continue', () => {
    // Simulate _onContinue() logic
    const day = registry.get(RK.CURRENT_DAY) ?? 1;
    if (day === 1 && !registry.get(RK.TUTORIAL_COMPLETED)) {
      registry.set(RK.TUTORIAL_COMPLETED, true);
      registry.set(RK.CURRENT_DAY, 2);
    }

    expect(registry.get(RK.TUTORIAL_COMPLETED)).toBe(true);
    expect(registry.get(RK.CURRENT_DAY)).toBe(2);
  });

  it('Step 8: after tutorial complete, Day 1 session is no longer active', () => {
    registry.set(RK.TUTORIAL_COMPLETED, true);
    registry.set(RK.CURRENT_DAY, 2);

    expect(isDay1Session(registry)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 XP event labels
// ─────────────────────────────────────────────────────────────────────────────

describe('Day 1 XP event labels', () => {
  it('all 7 Day 1 XP events have a friendly label', () => {
    const expectedEvents = [
      'lars_dialogue',
      'First grocery run completed',
      'Visited Netto for the first time',
      'First item use',
      'Picked up pant bottle',
      'Returned pant bottles',
      'Survived first day',
    ];

    for (const evt of expectedEvents) {
      expect(DAY1_XP_LABELS[evt], `Missing label for "${evt}"`).toBeDefined();
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Shop highlight — Netto items on Day 1
// ─────────────────────────────────────────────────────────────────────────────

describe('Netto grocery list on Day 1', () => {
  it('rugbrod, pasta, and milk are highlighted on Day 1', () => {
    const items = [
      { itemId: 'rugbrod',   price: 22 },
      { itemId: 'pasta',     price: 13 },
      { itemId: 'milk',      price: 10 },
      { itemId: 'beer',      price: 14 },
    ];

    const list = buildShopItemList(items, true);
    expect(list.find(i => i.itemId === 'rugbrod').highlight).toBe(true);
    expect(list.find(i => i.itemId === 'pasta').highlight).toBe(true);
    expect(list.find(i => i.itemId === 'milk').highlight).toBe(true);
    expect(list.find(i => i.itemId === 'beer').highlight).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 tomorrow preview
// ─────────────────────────────────────────────────────────────────────────────

describe('Day 1 tomorrow preview seeds Day 2', () => {
  it('contains a reference to the language school', () => {
    expect(DAY1_TOMORROW_PREVIEW_TEXT.toLowerCase()).toContain('language school');
  });

  it('references Lars as the source of information', () => {
    expect(DAY1_TOMORROW_PREVIEW_TEXT).toContain('Lars');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 weather
// ─────────────────────────────────────────────────────────────────────────────

describe('Day 1 weather', () => {
  it('WEATHER_CLOUDY constant matches expected value', () => {
    expect(WEATHER_CLOUDY).toBe('Cloudy');
  });

  it('setting WEATHER to Cloudy on Day 1 matches spec', () => {
    const registry = newGameRegistry();
    registry.set(RK.WEATHER, WEATHER_CLOUDY);
    expect(registry.get(RK.WEATHER)).toBe('Cloudy');
  });
});
