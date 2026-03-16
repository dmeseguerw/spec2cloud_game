/**
 * src/state/StateManager.js
 * Save/load operations using localStorage (or injected storage for testing).
 */

import * as RK from '../constants/RegistryKeys.js';
import { GAME_SAVED, GAME_LOADED } from '../constants/Events.js';
import { STARTING_HEALTH, STARTING_CURRENCY } from '../config.js';

const SAVE_PREFIX = 'denmarkSurvival_save_';
const GAME_VER = '0.1.0';

/** All registry keys that should be persisted */
const ALL_KEYS = [
  RK.PLAYER_NAME, RK.PLAYER_NATIONALITY, RK.PLAYER_JOB, RK.PLAYER_AVATAR,
  RK.PLAYER_XP, RK.PLAYER_LEVEL, RK.CURRENT_DAY, RK.CURRENT_CHAPTER, RK.CURRENT_PHASE,
  RK.SKILL_LANGUAGE, RK.SKILL_CYCLING, RK.SKILL_CULTURAL, RK.SKILL_BUREAUCRACY,
  RK.PLAYER_MONEY, RK.PLAYER_HEALTH, RK.PLAYER_HAPPINESS, RK.PLAYER_ENERGY,
  RK.INVENTORY,
  RK.PLAYER_X, RK.PLAYER_Y, RK.PLAYER_SCENE,
  RK.NPC_RELATIONSHIPS, RK.ENCYCLOPEDIA_ENTRIES, RK.COMPLETED_SCENARIOS,
  RK.DIALOGUE_HISTORY, RK.ENCOUNTER_HISTORY,
  RK.TIME_OF_DAY, RK.SEASON, RK.DAY_IN_SEASON,
  RK.PENDING_BILLS, RK.LAST_SALARY_DAY, RK.PANT_BOTTLES,
  RK.VOLUME_MASTER, RK.VOLUME_MUSIC, RK.VOLUME_SFX,
  RK.CONTROLS_SCHEME, RK.TUTORIAL_COMPLETED, RK.DIFFICULTY,
  RK.SAVE_SLOT, RK.TOTAL_PLAYTIME, RK.GAME_VERSION,
];

/**
 * Nationality starting bonuses for character creation.
 * Each entry maps nationality name → starting skill values (0-100 scale).
 * Unknown nationalities fall back to 'Other'.
 */
const NATIONALITY_BONUSES = {
  Danish:      { language: 50, cultural: 40, cycling: 30, bureaucracy: 20 },
  Swedish:     { language: 30, cultural: 25, cycling: 25, bureaucracy: 15 },
  Norwegian:   { language: 25, cultural: 25, cycling: 20, bureaucracy: 15 },
  German:      { language: 15, cultural: 15, cycling: 25, bureaucracy: 20 },
  British:     { language: 10, cultural: 10, cycling: 10, bureaucracy: 10 },
  American:    { language: 5,  cultural: 5,  cycling: 5,  bureaucracy: 5  },
  French:      { language: 10, cultural: 15, cycling: 15, bureaucracy: 10 },
  Spanish:     { language: 5,  cultural: 10, cycling: 10, bureaucracy: 5  },
  Italian:     { language: 5,  cultural: 10, cycling: 15, bureaucracy: 5  },
  Dutch:       { language: 10, cultural: 15, cycling: 20, bureaucracy: 10 },
  Polish:      { language: 10, cultural: 10, cycling: 15, bureaucracy: 20 },
  Turkish:     { language: 5,  cultural: 10, cycling: 5,  bureaucracy: 5  },
  Indian:      { language: 5,  cultural: 5,  cycling: 5,  bureaucracy: 10 },
  Other:       { language: 0,  cultural: 0,  cycling: 0,  bureaucracy: 0  },
};

/**
 * Initialize a fresh game state in the registry.
 * @param {object} registry - Phaser registry (or MockRegistry)
 * @param {{ name: string, nationality: string, job: string, avatar?: string }} characterData
 */
export function initializeNewGame(registry, characterData) {
  const bonuses = NATIONALITY_BONUSES[characterData.nationality] || NATIONALITY_BONUSES.Other;

  // Player Core
  registry.set(RK.PLAYER_NAME, characterData.name);
  registry.set(RK.PLAYER_NATIONALITY, characterData.nationality);
  registry.set(RK.PLAYER_JOB, characterData.job);
  registry.set(RK.PLAYER_AVATAR, characterData.avatar || 'player');

  // Progression
  registry.set(RK.PLAYER_XP, 0);
  registry.set(RK.PLAYER_LEVEL, 1);
  registry.set(RK.CURRENT_DAY, 1);
  registry.set(RK.CURRENT_CHAPTER, 1);
  registry.set(RK.CURRENT_PHASE, 'Newcomer');

  // Skills (with nationality bonuses)
  registry.set(RK.SKILL_LANGUAGE, bonuses.language);
  registry.set(RK.SKILL_CYCLING, bonuses.cycling);
  registry.set(RK.SKILL_CULTURAL, bonuses.cultural);
  registry.set(RK.SKILL_BUREAUCRACY, bonuses.bureaucracy);

  // Resources — use job salary if provided, otherwise fall back to STARTING_CURRENCY
  const money = characterData.startingMoney !== undefined ? characterData.startingMoney : STARTING_CURRENCY;
  registry.set(RK.PLAYER_MONEY, money);
  registry.set(RK.PLAYER_HEALTH, STARTING_HEALTH);
  registry.set(RK.PLAYER_HAPPINESS, 70);
  registry.set(RK.PLAYER_ENERGY, 100);

  // Inventory
  registry.set(RK.INVENTORY, []);

  // World State
  registry.set(RK.PLAYER_X, 640);
  registry.set(RK.PLAYER_Y, 360);
  registry.set(RK.PLAYER_SCENE, 'GameScene');
  registry.set(RK.NPC_RELATIONSHIPS, {});
  registry.set(RK.ENCYCLOPEDIA_ENTRIES, []);
  registry.set(RK.COMPLETED_SCENARIOS, []);
  registry.set(RK.DIALOGUE_HISTORY, {});
  registry.set(RK.ENCOUNTER_HISTORY, []);

  // Time & Season
  registry.set(RK.TIME_OF_DAY, 'morning');
  registry.set(RK.SEASON, 'spring');
  registry.set(RK.DAY_IN_SEASON, 1);

  // Financial
  registry.set(RK.PENDING_BILLS, []);
  registry.set(RK.LAST_SALARY_DAY, 0);
  registry.set(RK.PANT_BOTTLES, 0);

  // Settings
  registry.set(RK.VOLUME_MASTER, 0.8);
  registry.set(RK.VOLUME_MUSIC, 0.6);
  registry.set(RK.VOLUME_SFX, 0.8);
  registry.set(RK.CONTROLS_SCHEME, 'keyboard');
  registry.set(RK.TUTORIAL_COMPLETED, false);
  registry.set(RK.DIFFICULTY, 'normal');

  // Meta
  registry.set(RK.SAVE_SLOT, 1);
  registry.set(RK.TOTAL_PLAYTIME, 0);
  registry.set(RK.GAME_VERSION, GAME_VER);
}

/**
 * Save all registry state to storage.
 * @param {object} registry - Phaser registry (or MockRegistry)
 * @param {number} slot - Save slot number (1-3)
 * @param {object} [storage=localStorage] - Storage backend
 */
export function saveGame(registry, slot, storage = globalThis.localStorage) {
  const data = {};
  for (const key of ALL_KEYS) {
    data[key] = registry.get(key);
  }
  data._savedAt = Date.now();
  data._version = GAME_VER;
  storage.setItem(`${SAVE_PREFIX}${slot}`, JSON.stringify(data));
  registry.events.emit(GAME_SAVED, slot);
}

/**
 * Load game state from storage into registry.
 * @param {object} registry - Phaser registry (or MockRegistry)
 * @param {number} slot - Save slot number (1-3)
 * @param {object} [storage=localStorage] - Storage backend
 * @returns {boolean} true if load succeeded
 */
export function loadGame(registry, slot, storage = globalThis.localStorage) {
  const raw = storage.getItem(`${SAVE_PREFIX}${slot}`);
  if (!raw) return false;

  try {
    const data = JSON.parse(raw);
    for (const key of ALL_KEYS) {
      if (key in data) {
        registry.set(key, data[key]);
      }
    }
    registry.events.emit(GAME_LOADED, slot);
    return true;
  } catch {
    return false;
  }
}

/**
 * Check if a save exists for a given slot.
 * @param {number} slot
 * @param {object} [storage=localStorage]
 * @returns {boolean}
 */
export function hasSave(slot, storage = globalThis.localStorage) {
  return storage.getItem(`${SAVE_PREFIX}${slot}`) !== null;
}

/**
 * Delete a save from storage.
 * @param {number} slot
 * @param {object} [storage=localStorage]
 */
export function deleteSave(slot, storage = globalThis.localStorage) {
  storage.removeItem(`${SAVE_PREFIX}${slot}`);
}

/**
 * Get save metadata without loading full state.
 * @param {number} slot
 * @param {object} [storage=localStorage]
 * @returns {{ name: string, level: number, day: number, playtime: number, savedAt: number } | null}
 */
export function getSaveMetadata(slot, storage = globalThis.localStorage) {
  const raw = storage.getItem(`${SAVE_PREFIX}${slot}`);
  if (!raw) return null;

  try {
    const data = JSON.parse(raw);
    return {
      name: data[RK.PLAYER_NAME] || 'Unknown',
      level: data[RK.PLAYER_LEVEL] || 1,
      day: data[RK.CURRENT_DAY] || 1,
      playtime: data[RK.TOTAL_PLAYTIME] || 0,
      savedAt: data._savedAt || 0,
    };
  } catch {
    return null;
  }
}

/**
 * Export save data as a JSON string (for backup/sharing).
 * @param {number} slot
 * @param {object} [storage=localStorage]
 * @returns {string|null}
 */
export function exportSave(slot, storage = globalThis.localStorage) {
  return storage.getItem(`${SAVE_PREFIX}${slot}`);
}

/**
 * Import save data from a JSON string.
 * @param {object} registry
 * @param {string} jsonString
 * @param {number} slot
 * @param {object} [storage=localStorage]
 * @returns {boolean}
 */
export function importSave(registry, jsonString, slot, storage = globalThis.localStorage) {
  try {
    const data = JSON.parse(jsonString);
    storage.setItem(`${SAVE_PREFIX}${slot}`, jsonString);
    // Load the imported data into the registry
    for (const key of ALL_KEYS) {
      if (key in data) {
        registry.set(key, data[key]);
      }
    }
    return true;
  } catch {
    return false;
  }
}
