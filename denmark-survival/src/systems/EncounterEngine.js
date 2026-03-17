/**
 * src/systems/EncounterEngine.js
 * Manages random encounter generation, filtering, triggering, and resolution.
 *
 * Encounters are drawn from a weighted pool filtered by location, weather,
 * season, time, level, skill levels, and history. Each encounter presents
 * 2–3 response options with XP, item, relationship, and encyclopedia outcomes.
 *
 * Encounter state is stored in the Phaser registry under:
 *   ENCOUNTER_HISTORY   — array of { encounterId, day, optionIndex } records
 *   PENDING_ENCOUNTERS  — array of encounter IDs queued for the current day
 *   ENCOUNTER_FLAGS     — object tracking one-time resolved encounters
 *
 * Emits: ENCOUNTER_TRIGGERED, ENCOUNTER_RESOLVED
 */

import { createRequire } from 'node:module';
import * as RK from '../constants/RegistryKeys.js';
import { ENCOUNTER_TRIGGERED, ENCOUNTER_RESOLVED } from '../constants/Events.js';
import { grantXP, penalizeXP } from './XPEngine.js';
import { addItem, removeItem } from './InventoryManager.js';
import { changeRelationship } from './RelationshipSystem.js';
import { unlockEntry } from './EncyclopediaManager.js';
import { incrementSkill } from './SkillSystem.js';

// ─────────────────────────────────────────────────────────────────────────────
// Encounter data loading
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Load encounter definitions from encounters.json.
 * Uses createRequire for Node/Vitest compatibility.
 */
function _loadEncounters() {
  try {
    const require = createRequire(import.meta.url);
    return require('../data/encounters.json');
  } catch {
    return [];
  }
}

const ENCOUNTERS = _loadEncounters();

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Number of days an encounter cannot repeat after it was last seen. */
export const COOLDOWN_DAYS = 7;

/** Minimum number of encounters generated per in-game day. */
export const MIN_ENCOUNTERS_PER_DAY = 2;

/** Maximum number of encounters generated per in-game day. */
export const MAX_ENCOUNTERS_PER_DAY = 4;

/** Auto-response timeout in milliseconds (30 seconds). */
export const AUTO_RESPONSE_TIMEOUT_MS = 30_000;

/**
 * Probability weights for each encounter category.
 * Must sum to 100.
 */
export const CATEGORY_WEIGHTS = {
  helpful:   30,
  neutral:   40,
  challenge: 25,
  major:      5,
};

/** Map short skill names used in encounter data to registry keys. */
const SKILL_NAME_TO_KEY = {
  language:    RK.SKILL_LANGUAGE,
  cycling:     RK.SKILL_CYCLING,
  cultural:    RK.SKILL_CULTURAL,
  bureaucracy: RK.SKILL_BUREAUCRACY,
};

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate 2–4 encounters for the current day and store them as pending.
 *
 * Steps:
 *  1. Build the filtered encounter pool for current conditions.
 *  2. Pick a random count between MIN and MAX.
 *  3. Select using category-weighted random sampling.
 *  4. Store selected encounter IDs under PENDING_ENCOUNTERS.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>} Selected encounter objects.
 */
export function generateDailyEncounters(registry) {
  const pool = getEncounterPool(registry);

  const count = MIN_ENCOUNTERS_PER_DAY +
    Math.floor(Math.random() * (MAX_ENCOUNTERS_PER_DAY - MIN_ENCOUNTERS_PER_DAY + 1));

  const selected = _selectWeightedEncounters(pool, count);
  registry.set(RK.PENDING_ENCOUNTERS, selected.map(e => e.id));

  return selected;
}

/**
 * Trigger the next pending encounter for the current day.
 * Removes it from the pending queue and emits ENCOUNTER_TRIGGERED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {object|null} Encounter data object, or null if queue is empty.
 */
export function triggerNextEncounter(registry) {
  const pending = registry.get(RK.PENDING_ENCOUNTERS) ?? [];
  if (pending.length === 0) return null;

  const [nextId, ...rest] = pending;
  registry.set(RK.PENDING_ENCOUNTERS, rest);

  const encounter = ENCOUNTERS.find(e => e.id === nextId);
  if (!encounter) return null;

  registry.events.emit(ENCOUNTER_TRIGGERED, { encounter });
  return encounter;
}

/**
 * Resolve an encounter by applying the chosen option's outcome effects.
 *
 * Steps:
 *  1. Validate encounter and option index.
 *  2. Apply all outcome effects (XP, money, items, relationships, skills, encyclopedia, flags).
 *  3. Record the encounter in ENCOUNTER_HISTORY.
 *  4. If oneTime, mark in ENCOUNTER_FLAGS so it is excluded from future pools.
 *  5. Emit ENCOUNTER_RESOLVED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} encounterId
 * @param {number} optionIndex
 * @returns {{ success: boolean, reason?: string, effects?: object, resultText?: string, culturalTip?: string }}
 */
export function resolveEncounter(registry, encounterId, optionIndex) {
  const encounter = ENCOUNTERS.find(e => e.id === encounterId);
  if (!encounter) return { success: false, reason: 'encounter_not_found' };

  const option = encounter.options[optionIndex];
  if (!option) return { success: false, reason: 'invalid_option' };

  const effects = _applyOutcome(registry, option.outcome ?? {});

  // Record in history
  const history = registry.get(RK.ENCOUNTER_HISTORY) ?? [];
  const currentDay = registry.get(RK.CURRENT_DAY) ?? 1;
  registry.set(RK.ENCOUNTER_HISTORY, [
    ...history,
    { encounterId, day: currentDay, optionIndex },
  ]);

  // Mark one-time encounters as permanently resolved
  if (encounter.oneTime) {
    const flags = registry.get(RK.ENCOUNTER_FLAGS) ?? {};
    registry.set(RK.ENCOUNTER_FLAGS, {
      ...flags,
      [`one_time_${encounterId}`]: true,
    });
  }

  registry.events.emit(ENCOUNTER_RESOLVED, {
    encounterId,
    optionIndex,
    effects,
    resultText:  option.resultText,
    culturalTip: option.culturalTip ?? null,
  });

  return {
    success:     true,
    effects,
    resultText:  option.resultText,
    culturalTip: option.culturalTip ?? null,
  };
}

/**
 * Return the current encounter pool: all encounters minus those on cooldown,
 * permanently resolved one-time entries, or whose conditions are not met.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>} Eligible encounter objects.
 */
export function getEncounterPool(registry) {
  const flags        = registry.get(RK.ENCOUNTER_FLAGS) ?? {};
  const location     = registry.get(RK.CURRENT_LOCATION) ?? registry.get(RK.PLAYER_LOCATION) ?? 'any';
  const weather      = registry.get(RK.WEATHER)      ?? 'any';
  const season       = registry.get(RK.SEASON)       ?? 'any';
  const timeOfDay    = registry.get(RK.TIME_OF_DAY)  ?? 'any';
  const level        = registry.get(RK.PLAYER_LEVEL) ?? 1;
  const transportMode = registry.get(RK.TRANSPORT_MODE) ?? 'walk';
  const gameFlags    = registry.get(RK.GAME_FLAGS)   ?? {};

  const skills = {
    language:    registry.get(RK.SKILL_LANGUAGE)    ?? 0,
    cycling:     registry.get(RK.SKILL_CYCLING)     ?? 0,
    cultural:    registry.get(RK.SKILL_CULTURAL)    ?? 0,
    bureaucracy: registry.get(RK.SKILL_BUREAUCRACY) ?? 0,
  };

  return ENCOUNTERS.filter(encounter => {
    // Permanently resolved one-time encounters are excluded
    if (encounter.oneTime && flags[`one_time_${encounter.id}`]) return false;
    // Encounters within the cooldown window are excluded
    if (isOnCooldown(registry, encounter.id)) return false;
    // Check all conditions
    return _matchesConditions(encounter.conditions ?? {}, {
      location,
      weather,
      season,
      timeOfDay,
      level,
      transportMode,
      skills,
      gameFlags,
    });
  });
}

/**
 * Check whether an encounter is within the 7-day cooldown window.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} encounterId
 * @returns {boolean} True if on cooldown.
 */
export function isOnCooldown(registry, encounterId) {
  const history    = registry.get(RK.ENCOUNTER_HISTORY) ?? [];
  const currentDay = registry.get(RK.CURRENT_DAY) ?? 1;

  const lastEntry = history
    .filter(h => h.encounterId === encounterId)
    .sort((a, b) => b.day - a.day)[0];

  if (!lastEntry) return false;
  return (currentDay - lastEntry.day) < COOLDOWN_DAYS;
}

/**
 * Check whether an option's skill requirement is met.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} option - Encounter option object.
 * @returns {boolean} True if no skill check exists or the requirement is met.
 */
export function isOptionAvailable(registry, option) {
  if (!option.skillCheck) return true;
  const { skill, level } = option.skillCheck;
  const skillKey = SKILL_NAME_TO_KEY[skill];
  if (!skillKey) return true;
  const value = registry.get(skillKey) ?? 0;
  return _valueToSkillLevel(value) >= level;
}

/**
 * Return all encounters from the loaded data set.
 * Used for schema validation and tooling.
 *
 * @returns {Array<object>}
 */
export function getAllEncounters() {
  return ENCOUNTERS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Private helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Convert a raw skill value (0–100) to a skill level (1–5).
 * Mirrors SkillSystem._valueToLevel without importing the private function.
 *
 * @param {number} value
 * @returns {number}
 */
function _valueToSkillLevel(value) {
  if (value >= 80) return 5;
  if (value >= 60) return 4;
  if (value >= 40) return 3;
  if (value >= 20) return 2;
  return 1;
}

/**
 * Determine if a given encounter's conditions match the current game state.
 *
 * @param {object} conditions - The encounter's conditions block.
 * @param {object} state - Current game state values.
 * @returns {boolean}
 */
function _matchesConditions(conditions, state) {
  const {
    location, weather, season, timeOfDay,
    level, transportMode, skills, gameFlags,
  } = state;

  // --- Location ---
  if (!_matchesArray(conditions.locations, location)) return false;

  // --- Weather ---
  if (!_matchesArray(conditions.weather, weather)) return false;

  // --- Season ---
  if (!_matchesArray(conditions.seasons, season)) return false;

  // --- Time of day ---
  if (!_matchesArray(conditions.timeOfDay, timeOfDay)) return false;

  // --- Player level ---
  if (conditions.minLevel !== undefined && level < conditions.minLevel) return false;
  if (conditions.maxLevel !== undefined && level > conditions.maxLevel) return false;

  // --- Required skill level ---
  if (conditions.requiredSkill) {
    const { skill, level: requiredLevel } = conditions.requiredSkill;
    const rawValue = skills[skill] ?? 0;
    if (_valueToSkillLevel(rawValue) < requiredLevel) return false;
  }

  // --- Transport mode ---
  if (conditions.transportMode && conditions.transportMode !== 'any') {
    if (transportMode !== conditions.transportMode) return false;
  }

  // --- Required flag (for chaining) ---
  if (conditions.requiredFlag) {
    const { key, value } = conditions.requiredFlag;
    if (gameFlags[key] !== value) return false;
  }

  return true;
}

/**
 * Check if `value` is included in `arr`, treating 'any' or empty/absent
 * arrays as matching everything.
 *
 * @param {string[]|undefined} arr
 * @param {string} value
 * @returns {boolean}
 */
function _matchesArray(arr, value) {
  if (!arr || arr.length === 0) return true;
  if (arr.includes('any')) return true;
  return arr.includes(value);
}

/**
 * Select up to `count` encounters from `pool` using category weights.
 * Uses weighted random to decide the category of each slot, then picks a
 * random encounter from that category (without replacement).
 *
 * Falls back to unweighted random if a category has no available encounters.
 *
 * @param {Array<object>} pool
 * @param {number} count
 * @returns {Array<object>}
 */
function _selectWeightedEncounters(pool, count) {
  if (pool.length === 0) return [];

  const selected = [];
  const remaining = [...pool];

  for (let i = 0; i < count && remaining.length > 0; i++) {
    const category = _pickCategory(remaining);
    const categoryPool = remaining.filter(e => e.category === category);
    const source = categoryPool.length > 0 ? categoryPool : remaining;

    const idx = Math.floor(Math.random() * source.length);
    const encounter = source[idx];
    selected.push(encounter);

    // Remove from remaining to avoid duplicates
    const globalIdx = remaining.indexOf(encounter);
    if (globalIdx !== -1) remaining.splice(globalIdx, 1);
  }

  return selected;
}

/**
 * Pick a category name using the CATEGORY_WEIGHTS probability table,
 * restricted to categories that have at least one encounter in `pool`.
 *
 * @param {Array<object>} pool
 * @returns {string} Category name.
 */
function _pickCategory(pool) {
  const available = new Set(pool.map(e => e.category));

  // Build a cumulative weight table only for available categories
  const entries = Object.entries(CATEGORY_WEIGHTS)
    .filter(([cat]) => available.has(cat));

  if (entries.length === 0) {
    return pool[Math.floor(Math.random() * pool.length)].category;
  }

  const total = entries.reduce((sum, [, w]) => sum + w, 0);
  let rand = Math.random() * total;

  for (const [cat, weight] of entries) {
    rand -= weight;
    if (rand <= 0) return cat;
  }

  return entries[entries.length - 1][0];
}

/**
 * Apply all outcome effects from an encounter option to the registry.
 *
 * Supported outcome fields:
 *   xp          — grant (positive) or penalize (negative) XP
 *   money       — add or subtract player money
 *   relationship — { npcId, delta } — change NPC relationship
 *   item        — { itemId, action: 'give'|'take' } — add or remove item
 *   skill       — { skillKey, delta } — increment a single skill
 *   skills      — [{ skillKey, delta }, ...] — increment multiple skills
 *   encyclopedia — entryId string — unlock an encyclopedia entry
 *   flag        — { key, value } — set a game flag
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} outcome
 * @returns {object} Descriptor of all effects applied.
 */
function _applyOutcome(registry, outcome) {
  const applied = {};

  // XP
  if (outcome.xp !== undefined && outcome.xp !== 0) {
    if (outcome.xp > 0) {
      grantXP(registry, outcome.xp, 'Encounter reward', 'Encounter');
    } else {
      penalizeXP(registry, Math.abs(outcome.xp), 'Encounter penalty', 'Encounter');
    }
    applied.xp = outcome.xp;
  }

  // Money
  if (outcome.money !== undefined && outcome.money !== 0) {
    const current = registry.get(RK.PLAYER_MONEY) ?? 0;
    registry.set(RK.PLAYER_MONEY, current + outcome.money);
    applied.money = outcome.money;
  }

  // Relationship
  if (outcome.relationship) {
    const { npcId, delta } = outcome.relationship;
    changeRelationship(registry, npcId, delta, 'Encounter');
    applied.relationship = { npcId, delta };
  }

  // Item
  if (outcome.item) {
    const { itemId, action } = outcome.item;
    if (action === 'give') {
      addItem(registry, itemId, 1);
    } else if (action === 'take') {
      removeItem(registry, itemId, 1);
    }
    applied.item = { itemId, action };
  }

  // Skill (single) or skills (array) — both formats supported
  if (outcome.skill) {
    const { skillKey, delta } = outcome.skill;
    const registryKey = SKILL_NAME_TO_KEY[skillKey] ?? skillKey;
    if (delta > 0) {
      incrementSkill(registry, registryKey, delta);
    }
    applied.skill = { skillKey, delta };
  }

  if (outcome.skills) {
    applied.skills = [];
    for (const { skillKey, delta } of outcome.skills) {
      const registryKey = SKILL_NAME_TO_KEY[skillKey] ?? skillKey;
      if (delta > 0) {
        incrementSkill(registry, registryKey, delta);
      }
      applied.skills.push({ skillKey, delta });
    }
  }

  // Encyclopedia
  if (outcome.encyclopedia) {
    unlockEntry(registry, outcome.encyclopedia, 'Encounter');
    applied.encyclopedia = outcome.encyclopedia;
  }

  // Flag
  if (outcome.flag) {
    const { key, value } = outcome.flag;
    const gameFlags = registry.get(RK.GAME_FLAGS) ?? {};
    registry.set(RK.GAME_FLAGS, { ...gameFlags, [key]: value });
    applied.flag = { key, value };
  }

  return applied;
}
