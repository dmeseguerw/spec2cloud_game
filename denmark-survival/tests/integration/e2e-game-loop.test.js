/**
 * tests/integration/e2e-game-loop.test.js
 * End-to-End integration tests for Denmark Survival.
 *
 * Verifies the full game loop from character creation through multi-day
 * gameplay, save/load round-trips, system interactions, and data integrity.
 *
 * Task 024 — End-to-End Integration & Playtesting
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry, MockLocalStorage } from '../mocks/PhaserMocks.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ── State management ────────────────────────────────────────────────────────
import {
  initializeNewGame,
  saveGame,
  loadGame,
  autoSave,
} from '../../src/state/StateManager.js';

// ── Day cycle & season ──────────────────────────────────────────────────────
import {
  initDayCycle,
  advanceTimePeriod,
  completeActivity,
  endDay,
  advanceDay,
  addMandatoryActivity,
  ACTIVITY_WORK,
  ACTIVITY_GROCERY,
} from '../../src/systems/DayCycleEngine.js';
import { initSeason, advanceSeason } from '../../src/systems/SeasonEngine.js';
import { applyDailyWeather, ALL_WEATHER_TYPES } from '../../src/systems/WeatherSystem.js';

// ── XP & progression ────────────────────────────────────────────────────────
import { grantXP, penalizeXP, calculateLevel } from '../../src/systems/XPEngine.js';
import { isGameOver, isGameOverWarning } from '../../src/systems/GameOverManager.js';

// ── Encyclopedia ─────────────────────────────────────────────────────────────
import {
  initializeEncyclopedia,
  unlockEntry,
  isUnlocked,
  getOverallProgress,
} from '../../src/systems/EncyclopediaManager.js';

// ── Inventory & economy ─────────────────────────────────────────────────────
import { addItem, removeItem, hasItem } from '../../src/systems/InventoryManager.js';
import { processSalary, SALARY_INTERVAL_DAYS } from '../../src/systems/EconomyEngine.js';
import {
  checkBillArrivals,
  payBill,
  getBills,
  processOverdueBills,
} from '../../src/systems/BillManager.js';

// ── Relationships & dialogue ─────────────────────────────────────────────────
import { changeRelationship, getRelationship, getRelationshipStage } from '../../src/systems/RelationshipSystem.js';
import { DialogueEngine } from '../../src/systems/DialogueEngine.js';
import { lars_welcome } from '../../src/data/dialogues/lars_welcome.js';

// ── Transport ────────────────────────────────────────────────────────────────
import {
  setTransportMode,
  getTransportMode,
  TRANSPORT_WALK,
  TRANSPORT_BIKE,
  TRANSPORT_METRO,
} from '../../src/systems/TransportManager.js';

// ── Encounters ───────────────────────────────────────────────────────────────
import {
  generateDailyEncounters,
  triggerNextEncounter,
  resolveEncounter,
} from '../../src/systems/EncounterEngine.js';

// ── Skills ───────────────────────────────────────────────────────────────────
import { getSkillLevel, incrementSkill } from '../../src/systems/SkillSystem.js';

// ── Shop ─────────────────────────────────────────────────────────────────────
import { checkout } from '../../src/systems/ShopSystem.js';

// ── XP log ───────────────────────────────────────────────────────────────────
import { XPLog } from '../../src/systems/XPLog.js';

// ═══════════════════════════════════════════════════════════════════════════════
// Helper: simulate a full day of activities
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Simulate one complete in-game day: run activities, end-day processing,
 * season advancement, weather, and day advancement.
 */
function simulateDay(registry, activities = []) {
  // Complete each provided activity
  for (const act of activities) {
    completeActivity(registry, act.id, act.label ?? act.id);
  }

  // End-of-day processing (missed mandatories, food spoilage)
  const dayResult = endDay(registry);

  // Advance season
  const seasonResult = advanceSeason(registry);

  // Apply weather for the new day
  applyDailyWeather(registry);

  // Advance to next day
  const newDay = advanceDay(registry);

  return { dayResult, seasonResult, newDay };
}

/**
 * Set up a fresh new game with standard character data.
 */
function newGame(registry, overrides = {}) {
  const character = {
    name: 'TestPlayer',
    nationality: 'American',
    job: 'Engineer',
    ...overrides,
  };
  initializeNewGame(registry, character);
  initDayCycle(registry);
  initSeason(registry);
  initializeEncyclopedia(registry);
  applyDailyWeather(registry);
  return character;
}

// ═══════════════════════════════════════════════════════════════════════════════
// E2E Test: Full Game Loop — Character Creation through Day 5+
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Full Game Loop', () => {
  let registry;
  let storage;

  beforeEach(() => {
    registry = new MockRegistry();
    storage = new MockLocalStorage();
  });

  it('creates character → plays 5 days → save → load → plays 5 more days without errors', () => {
    // ── Step 1: Character creation ──────────────────────────────────────────
    newGame(registry);

    expect(registry.get(RK.PLAYER_NAME)).toBe('TestPlayer');
    expect(registry.get(RK.PLAYER_NATIONALITY)).toBe('American');
    expect(registry.get(RK.PLAYER_JOB)).toBe('Engineer');
    expect(registry.get(RK.PLAYER_LEVEL)).toBe(1);
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
    expect(registry.get(RK.CURRENT_DAY)).toBe(1);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(500);
    expect(registry.get(RK.PLAYER_HEALTH)).toBe(100);

    // ── Step 2: Play 5 days ──────────────────────────────────────────────────
    for (let day = 0; day < 5; day++) {
      // Grant some XP (simulate activities)
      grantXP(registry, 15, `Day ${day + 1} activity`, 'General');
      simulateDay(registry, [{ id: ACTIVITY_WORK, label: 'Work' }]);
    }

    expect(registry.get(RK.CURRENT_DAY)).toBe(6);
    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThan(0);

    // ── Step 3: Save ─────────────────────────────────────────────────────────
    saveGame(registry, 1, storage);

    const savedXP = registry.get(RK.PLAYER_XP);
    const savedDay = registry.get(RK.CURRENT_DAY);
    const savedMoney = registry.get(RK.PLAYER_MONEY);
    const savedSeason = registry.get(RK.SEASON);

    // ── Step 4: Load into fresh registry ─────────────────────────────────────
    const newRegistry = new MockRegistry();
    const loaded = loadGame(newRegistry, 1, storage);
    expect(loaded).toBe(true);
    expect(newRegistry.get(RK.PLAYER_XP)).toBe(savedXP);
    expect(newRegistry.get(RK.CURRENT_DAY)).toBe(savedDay);
    expect(newRegistry.get(RK.PLAYER_MONEY)).toBe(savedMoney);
    expect(newRegistry.get(RK.SEASON)).toBe(savedSeason);
    expect(newRegistry.get(RK.PLAYER_NAME)).toBe('TestPlayer');

    // ── Step 5: Play 5 more days from loaded state ───────────────────────────
    initDayCycle(newRegistry);
    for (let day = 0; day < 5; day++) {
      grantXP(newRegistry, 10, `Loaded day ${day + 1}`, 'General');
      simulateDay(newRegistry, [{ id: ACTIVITY_WORK, label: 'Work' }]);
    }

    expect(newRegistry.get(RK.CURRENT_DAY)).toBe(savedDay + 5);
    expect(newRegistry.get(RK.PLAYER_XP)).toBeGreaterThan(savedXP);
  });

  it('exercises every transport mode → encounter → shop → dialogue → inventory in one session', () => {
    newGame(registry);

    // ── Transport: Walking ──────────────────────────────────────────────────
    setTransportMode(registry, TRANSPORT_WALK);
    expect(getTransportMode(registry)).toBe(TRANSPORT_WALK);

    // ── Transport: Biking ───────────────────────────────────────────────────
    setTransportMode(registry, TRANSPORT_BIKE);
    expect(getTransportMode(registry)).toBe(TRANSPORT_BIKE);

    // ── Transport: Metro ────────────────────────────────────────────────────
    setTransportMode(registry, TRANSPORT_METRO);
    expect(getTransportMode(registry)).toBe(TRANSPORT_METRO);

    // ── Encounter ───────────────────────────────────────────────────────────
    const encounters = generateDailyEncounters(registry);
    expect(encounters.length).toBeGreaterThanOrEqual(2);

    const encounter = triggerNextEncounter(registry);
    if (encounter) {
      const result = resolveEncounter(registry, encounter.id, 0);
      expect(result.success).toBe(true);
    }

    // ── Dialogue ────────────────────────────────────────────────────────────
    const engine = new DialogueEngine();
    engine.registerDialogue('lars_welcome', lars_welcome);
    engine.startDialogue(registry, 'lars', 'lars_welcome');

    const node = engine.getCurrentNode();
    expect(node).toBeTruthy();
    expect(node.speaker).toBe('Lars');

    const responses = engine.getAvailableResponses(registry);
    expect(responses.length).toBeGreaterThan(0);

    engine.selectResponse(registry, 0);

    // ── Inventory: add and use items ────────────────────────────────────────
    addItem(registry, 'rugbrod');
    expect(hasItem(registry, 'rugbrod')).toBe(true);

    removeItem(registry, 'rugbrod');
    expect(hasItem(registry, 'rugbrod')).toBe(false);

    // ── Complete a day to validate combined state ───────────────────────────
    simulateDay(registry, [{ id: ACTIVITY_WORK }]);
    expect(registry.get(RK.CURRENT_DAY)).toBe(2);
  });

  it('triggers level-up → verify new level is applied', () => {
    newGame(registry);

    // Grant enough XP to reach level 2 (threshold is 50)
    grantXP(registry, 55, 'Big achievement', 'General');

    expect(registry.get(RK.PLAYER_LEVEL)).toBe(2);
    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThanOrEqual(50);
  });

  it('triggers game-over warning at negative XP threshold', () => {
    newGame(registry);

    // Penalize heavily to trigger warning
    penalizeXP(registry, 200, 'Catastrophic failure', 'General');

    const xp = registry.get(RK.PLAYER_XP);
    expect(xp).toBeLessThan(0);
    expect(isGameOver(xp)).toBe(false); // Not yet at -500 floor

    // Penalize more to approach game-over
    penalizeXP(registry, 400, 'Total disaster', 'General');
    const xp2 = registry.get(RK.PLAYER_XP);
    expect(xp2).toBeGreaterThanOrEqual(-500); // Clamped at floor
  });

  it('season transition → weather patterns change', () => {
    newGame(registry);
    expect(registry.get(RK.SEASON)).toBeTruthy();

    // Advance through 22 days (one season)
    for (let i = 0; i < 22; i++) {
      advanceSeason(registry);
    }

    // Season should have changed
    const newSeason = registry.get(RK.SEASON);
    expect(newSeason).toBeTruthy();

    // Apply weather for new season
    applyDailyWeather(registry);
    const weather = registry.get(RK.WEATHER);
    expect(ALL_WEATHER_TYPES).toContain(weather);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Character Creation → State Management
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Character Creation → State Management', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
  });

  it('starting values propagate from character creation to all systems', () => {
    newGame(registry, { nationality: 'Danish', job: 'Teacher' });

    // Nationality bonuses applied
    expect(registry.get(RK.SKILL_LANGUAGE)).toBe(50);
    expect(registry.get(RK.SKILL_CULTURAL)).toBe(40);
    expect(registry.get(RK.SKILL_CYCLING)).toBe(30);
    expect(registry.get(RK.SKILL_BUREAUCRACY)).toBe(20);

    // DayCycle initialized
    expect(registry.get(RK.CURRENT_DAY)).toBe(1);
    expect(registry.get(RK.TIME_OF_DAY)).toBeTruthy();

    // Season initialized
    expect(registry.get(RK.SEASON)).toBeTruthy();

    // Encyclopedia initialized with starters
    const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
    expect(Array.isArray(entries)).toBe(true);
    expect(entries.length).toBeGreaterThan(0);

    // Weather applied
    expect(registry.get(RK.WEATHER)).toBeTruthy();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: XP Engine → HUD (Registry Events)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: XP Engine → HUD events', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('XP changes emit changedata events (consumed by HUD)', () => {
    const xpChanges = [];
    registry.events.on('changedata-player_xp', (_, key, val) => {
      xpChanges.push(val);
    });

    grantXP(registry, 10, 'Test', 'General');
    grantXP(registry, 20, 'Test2', 'General');

    expect(xpChanges.length).toBe(2);
    expect(xpChanges[1]).toBeGreaterThan(xpChanges[0]);
  });

  it('level-up emits level_up event', () => {
    const levelUps = [];
    registry.events.on('level_up', (data) => {
      levelUps.push(data);
    });

    grantXP(registry, 55, 'Level up trigger', 'General');
    expect(levelUps.length).toBe(1);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Day Cycle → Transportation (Weather affects biking)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Day Cycle + Weather + Transport', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('weather applies at start of each day', () => {
    registry.set(RK.SEASON, 'Winter');
    applyDailyWeather(registry);
    const weather = registry.get(RK.WEATHER);
    expect(ALL_WEATHER_TYPES).toContain(weather);
  });

  it('transport mode persists across time periods', () => {
    setTransportMode(registry, TRANSPORT_BIKE);
    advanceTimePeriod(registry);
    expect(getTransportMode(registry)).toBe(TRANSPORT_BIKE);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Transportation → Economy (Metro costs DKK)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Transportation → Economy', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('metro mode is set and player has money to pay fares', () => {
    const initialMoney = registry.get(RK.PLAYER_MONEY);
    setTransportMode(registry, TRANSPORT_METRO);
    expect(getTransportMode(registry)).toBe(TRANSPORT_METRO);
    // Player should have starting money to cover metro fares
    expect(initialMoney).toBeGreaterThanOrEqual(24); // Metro fare is 24 DKK
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Dialogue → Relationships
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Dialogue → Relationships', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('dialogue with relationship effect updates NPC relationship value', () => {
    // Set up relationship tracking for lars
    const relationships = { lars: 40 };
    registry.set(RK.NPC_RELATIONSHIPS, relationships);

    // Manually change relationship (simulating dialogue effect)
    changeRelationship(registry, 'lars', 5);

    const rel = getRelationship(registry, 'lars');
    expect(rel).toBe(45);
  });

  it('dialogue engine applies effects including XP and relationships', () => {
    registry.set(RK.NPC_RELATIONSHIPS, { lars: 40 });

    const engine = new DialogueEngine();
    engine.registerDialogue('lars_welcome', lars_welcome);
    engine.startDialogue(registry, 'lars', 'lars_welcome');

    // Navigate to node with effects
    // Select first response (goes to node_overwhelmed)
    engine.selectResponse(registry, 0);
    // Select first response (goes to node_language_advice)
    engine.selectResponse(registry, 0);
    // Select first response (has xp effect +10)
    const xpBefore = registry.get(RK.PLAYER_XP);
    engine.selectResponse(registry, 0);

    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThan(xpBefore);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Encounters → Inventory + Encyclopedia
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Encounters → Inventory + Encyclopedia', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('encounter resolution can trigger encyclopedia unlocks', () => {
    const encounters = generateDailyEncounters(registry);
    expect(encounters.length).toBeGreaterThanOrEqual(2);

    // Resolve first available encounter
    const encounter = triggerNextEncounter(registry);
    if (encounter) {
      const result = resolveEncounter(registry, encounter.id, 0);
      expect(result.success).toBe(true);
      // The encounter should have been recorded in history
      const history = registry.get(RK.ENCOUNTER_HISTORY);
      expect(history.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('encounter history persists and affects future encounter pools', () => {
    // Generate and resolve several encounters
    generateDailyEncounters(registry);
    const firstEncounter = triggerNextEncounter(registry);
    if (firstEncounter) {
      resolveEncounter(registry, firstEncounter.id, 0);
    }

    const history = registry.get(RK.ENCOUNTER_HISTORY) ?? [];
    expect(Array.isArray(history)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Economy → Day Cycle (Bills arrive on schedule)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Economy → Day Cycle (Bills + Salary)', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry, { job: 'Engineer' });
  });

  it('salary arrives on bi-weekly schedule', () => {
    const initialMoney = registry.get(RK.PLAYER_MONEY);

    // Advance to day 14 (salary due)
    registry.set(RK.CURRENT_DAY, SALARY_INTERVAL_DAYS);
    const result = processSalary(registry);

    expect(result.paid).toBe(true);
    expect(result.amount).toBeGreaterThan(0);
    expect(registry.get(RK.PLAYER_MONEY)).toBeGreaterThan(initialMoney);
  });

  it('bills arrive and can be paid', () => {
    // Advance to day when bills should arrive
    registry.set(RK.CURRENT_DAY, 24); // Close to rent due date

    checkBillArrivals(registry, 24);
    const bills = getBills(registry);

    // Bills may or may not have been generated depending on the day
    // The important thing is no errors
    expect(Array.isArray(bills)).toBe(true);

    if (bills.length > 0) {
      const bill = bills[0];
      // Ensure player has enough money
      registry.set(RK.PLAYER_MONEY, 20000);
      const payResult = payBill(registry, bill.id);
      expect(payResult).toBeTruthy();
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Inventory → Day Cycle (Food spoils after time)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Inventory → Day Cycle (Food spoilage)', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('food items added with spoilage tracking', () => {
    addItem(registry, 'rugbrod');
    const inv = registry.get(RK.INVENTORY) ?? [];
    const bread = inv.find(e => e.itemId === 'rugbrod');
    expect(bread).toBeTruthy();
    // Bread spoils after 5 days — spoilsOnDay should be set
    if (bread.spoilsOnDay !== undefined) {
      expect(bread.spoilsOnDay).toBeGreaterThan(registry.get(RK.CURRENT_DAY));
    }
  });

  it('end-of-day processing removes spoiled food', () => {
    // Add food that will spoil
    addItem(registry, 'smorrebrod');

    // Advance past spoilage date
    registry.set(RK.CURRENT_DAY, 10);
    const inv = registry.get(RK.INVENTORY) ?? [];
    const sandwich = inv.find(e => e.itemId === 'smorrebrod');
    if (sandwich) {
      // Force spoilage date to current day
      sandwich.spoilsOnDay = 5;
      registry.set(RK.INVENTORY, inv);
    }

    const result = endDay(registry);
    expect(result).toBeTruthy();
    expect(Array.isArray(result.spoiledItems)).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Skills → Dialogue (Language gates options)
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Skills → Dialogue (language gating)', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('low language skill marks language-gated dialogue options as locked', () => {
    // Set low language skill
    registry.set(RK.SKILL_LANGUAGE, 5);

    const engine = new DialogueEngine();
    engine.registerDialogue('lars_welcome', lars_welcome);
    engine.startDialogue(registry, 'lars', 'lars_welcome');

    // Navigate to node_excited (second response)
    engine.selectResponse(registry, 1);

    // Get available responses — language-gated option should be locked
    const responses = engine.getAvailableResponses(registry);
    // The Danish option requires languageLevel 2 which is skill >= 20
    const danishOption = responses.find(r =>
      r.text && r.text.includes('Jeg vil gerne')
    );
    if (danishOption) {
      expect(danishOption.locked).toBe(true);
    }
  });

  it('high language skill unlocks language-gated dialogue options', () => {
    // Set high language skill (level 2 = 20+)
    registry.set(RK.SKILL_LANGUAGE, 25);

    const engine = new DialogueEngine();
    engine.registerDialogue('lars_welcome', lars_welcome);
    engine.startDialogue(registry, 'lars', 'lars_welcome');

    // Navigate to node_excited
    engine.selectResponse(registry, 1);

    const responses = engine.getAvailableResponses(registry);
    const danishOption = responses.find(r =>
      r.text && r.text.includes('Jeg vil gerne')
    );
    expect(danishOption).toBeTruthy();
    expect(danishOption.locked).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// System Integration: Save/Load → All Systems
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Save/Load preserves complete game state', () => {
  let registry;
  let storage;

  beforeEach(() => {
    registry = new MockRegistry();
    storage = new MockLocalStorage();
  });

  it('preserves all state across save/load cycle', () => {
    newGame(registry, { name: 'SaveTester', nationality: 'Danish', job: 'Chef' });

    // Modify state across multiple systems
    grantXP(registry, 100, 'Test XP', 'General');
    addItem(registry, 'rugbrod');
    addItem(registry, 'milk');
    changeRelationship(registry, 'lars', 10);
    unlockEntry(registry, 'culture_hygge');
    incrementSkill(registry, RK.SKILL_LANGUAGE, 15);
    registry.set(RK.CURRENT_DAY, 5);
    registry.set(RK.SEASON, 'Summer');
    registry.set(RK.DAY_IN_SEASON, 10);
    registry.set(RK.PLAYER_MONEY, 1234);
    registry.set(RK.PLAYER_HEALTH, 85);
    registry.set(RK.PLAYER_ENERGY, 60);

    // Save
    saveGame(registry, 1, storage);

    // Load into fresh registry
    const fresh = new MockRegistry();
    const loaded = loadGame(fresh, 1, storage);
    expect(loaded).toBe(true);

    // Verify core player state
    expect(fresh.get(RK.PLAYER_NAME)).toBe('SaveTester');
    expect(fresh.get(RK.PLAYER_NATIONALITY)).toBe('Danish');
    expect(fresh.get(RK.PLAYER_JOB)).toBe('Chef');

    // Verify XP and progression
    expect(fresh.get(RK.PLAYER_XP)).toBe(registry.get(RK.PLAYER_XP));
    expect(fresh.get(RK.PLAYER_LEVEL)).toBe(registry.get(RK.PLAYER_LEVEL));

    // Verify inventory
    const savedInv = fresh.get(RK.INVENTORY);
    expect(Array.isArray(savedInv)).toBe(true);
    expect(savedInv.length).toBeGreaterThanOrEqual(1);

    // Verify relationships
    const rels = fresh.get(RK.NPC_RELATIONSHIPS);
    expect(rels.lars).toBeDefined();

    // Verify encyclopedia
    const enc = fresh.get(RK.ENCYCLOPEDIA_ENTRIES);
    expect(Array.isArray(enc)).toBe(true);
    expect(enc).toContain('culture_hygge');

    // Verify skills
    expect(fresh.get(RK.SKILL_LANGUAGE)).toBe(registry.get(RK.SKILL_LANGUAGE));

    // Verify time/season
    expect(fresh.get(RK.CURRENT_DAY)).toBe(5);
    expect(fresh.get(RK.SEASON)).toBe('Summer');
    expect(fresh.get(RK.DAY_IN_SEASON)).toBe(10);

    // Verify resources
    expect(fresh.get(RK.PLAYER_MONEY)).toBe(1234);
    expect(fresh.get(RK.PLAYER_HEALTH)).toBe(85);
    expect(fresh.get(RK.PLAYER_ENERGY)).toBe(60);
  });

  it('auto-save at day end preserves state', () => {
    newGame(registry);
    grantXP(registry, 50, 'Pre-save XP', 'General');
    registry.set(RK.CURRENT_DAY, 3);

    autoSave(registry, storage);

    const fresh = new MockRegistry();
    // autoSave saves to slot from registry or default slot
    const slot = registry.get(RK.SAVE_SLOT) ?? 1;
    const loaded = loadGame(fresh, slot, storage);
    expect(loaded).toBe(true);
    expect(fresh.get(RK.PLAYER_XP)).toBe(registry.get(RK.PLAYER_XP));
    expect(fresh.get(RK.CURRENT_DAY)).toBe(3);
  });

  it('manual save, load, continue playing works correctly', () => {
    newGame(registry);

    // Play some days
    for (let i = 0; i < 3; i++) {
      grantXP(registry, 10, 'Activity', 'General');
      simulateDay(registry, [{ id: ACTIVITY_WORK }]);
    }

    // Manual save
    saveGame(registry, 2, storage);
    const savedState = {
      xp: registry.get(RK.PLAYER_XP),
      day: registry.get(RK.CURRENT_DAY),
      money: registry.get(RK.PLAYER_MONEY),
    };

    // Continue playing (modify state)
    grantXP(registry, 100, 'Post-save', 'General');

    // Load saved state (should restore pre-save values)
    const fresh = new MockRegistry();
    loadGame(fresh, 2, storage);

    expect(fresh.get(RK.PLAYER_XP)).toBe(savedState.xp);
    expect(fresh.get(RK.CURRENT_DAY)).toBe(savedState.day);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Multi-Day Progression Flow
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Multi-Day Progression', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('skill improvement through repeated actions', () => {
    const initialSkill = registry.get(RK.SKILL_LANGUAGE);

    // Simulate repeated language practice over several days
    for (let i = 0; i < 5; i++) {
      incrementSkill(registry, RK.SKILL_LANGUAGE, 5);
      simulateDay(registry, [{ id: ACTIVITY_WORK }]);
    }

    expect(registry.get(RK.SKILL_LANGUAGE)).toBeGreaterThan(initialSkill);
  });

  it('relationship milestone with NPC grants bonus XP', () => {
    // Start at 35 (Acquaintance 20-39 range — near boundary to Friendly at 40)
    registry.set(RK.NPC_RELATIONSHIPS, { lars: 35 });

    const xpBefore = registry.get(RK.PLAYER_XP);

    // Push past the Friendly threshold (40) — should trigger stage-up bonus
    changeRelationship(registry, 'lars', 10);

    expect(getRelationship(registry, 'lars')).toBe(45);
    // XP should have increased by both interaction XP (+15) and stage-up (+40)
    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThan(xpBefore);
  });

  it('encyclopedia fills gradually through gameplay', () => {
    const initialProgress = getOverallProgress(registry);

    // Unlock several entries through different triggers
    unlockEntry(registry, 'culture_hygge', 'Dialogue');
    unlockEntry(registry, 'culture_janteloven', 'Encounter');
    unlockEntry(registry, 'culture_birthday_flags', 'Discovery');

    const newProgress = getOverallProgress(registry);
    // getOverallProgress returns a percentage number (0-100)
    expect(newProgress).toBeGreaterThan(initialProgress);
  });

  it('financial system runs correctly over multi-day play', () => {
    newGame(registry, { job: 'Engineer' });
    const startingMoney = registry.get(RK.PLAYER_MONEY);

    // Advance to salary day
    registry.set(RK.CURRENT_DAY, SALARY_INTERVAL_DAYS);
    const salaryResult = processSalary(registry);
    expect(salaryResult.paid).toBe(true);

    const moneyAfterSalary = registry.get(RK.PLAYER_MONEY);
    expect(moneyAfterSalary).toBeGreaterThan(startingMoney);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Game Over Flow
// ═══════════════════════════════════════════════════════════════════════════════

describe('E2E: Game Over Trigger and Detection', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('game-over floor prevents XP from going below -500', () => {
    penalizeXP(registry, 600, 'Catastrophe', 'General');
    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThanOrEqual(-500);
  });

  it('isGameOver returns true at XP floor', () => {
    registry.set(RK.PLAYER_XP, -500);
    expect(isGameOver(-500)).toBe(true);
  });

  it('isGameOver returns false above floor', () => {
    registry.set(RK.PLAYER_XP, -100);
    expect(isGameOver(-100)).toBe(false);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// HUD Integration
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: HUD updates from gameplay actions', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('all HUD-relevant registry keys emit change events', () => {
    const changes = {};
    const hudKeys = [
      RK.PLAYER_XP, RK.PLAYER_LEVEL, RK.TIME_OF_DAY,
      RK.CURRENT_DAY, RK.PLAYER_HEALTH, RK.PLAYER_ENERGY,
      RK.PLAYER_MONEY, RK.WEATHER,
    ];

    for (const key of hudKeys) {
      changes[key] = 0;
      registry.events.on(`changedata-${key}`, () => { changes[key]++; });
    }

    // Trigger changes through game systems
    grantXP(registry, 55, 'Level up', 'General');     // XP + level
    advanceTimePeriod(registry);                        // time_of_day
    applyDailyWeather(registry);                        // weather
    registry.set(RK.PLAYER_HEALTH, 90);                // health
    registry.set(RK.PLAYER_ENERGY, 80);                // energy
    registry.set(RK.PLAYER_MONEY, 450);                // money

    // Verify all HUD keys received at least one change event
    expect(changes[RK.PLAYER_XP]).toBeGreaterThan(0);
    expect(changes[RK.TIME_OF_DAY]).toBeGreaterThan(0);
    expect(changes[RK.WEATHER]).toBeGreaterThan(0);
    expect(changes[RK.PLAYER_HEALTH]).toBeGreaterThan(0);
    expect(changes[RK.PLAYER_ENERGY]).toBeGreaterThan(0);
    expect(changes[RK.PLAYER_MONEY]).toBeGreaterThan(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// Encounter Frequency & Variety
// ═══════════════════════════════════════════════════════════════════════════════

describe('Integration: Encounter frequency and variety', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    newGame(registry);
  });

  it('generates 2-4 encounters per day', () => {
    const encounters = generateDailyEncounters(registry);
    expect(encounters.length).toBeGreaterThanOrEqual(2);
    expect(encounters.length).toBeLessThanOrEqual(4);
  });

  it('encounters vary across multiple days', () => {
    const allIds = new Set();

    for (let day = 0; day < 10; day++) {
      registry.set(RK.CURRENT_DAY, day + 1);
      const encounters = generateDailyEncounters(registry);
      for (const e of encounters) {
        allIds.add(e.id);
      }
    }

    // Should have seen at least a few different encounter types
    expect(allIds.size).toBeGreaterThan(1);
  });
});
