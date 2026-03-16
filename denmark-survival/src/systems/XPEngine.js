/**
 * src/systems/XPEngine.js
 * Central module for all XP (Life Adaptation Score) operations.
 *
 * Responsibilities:
 *  - Grant and penalize XP with proper clamping and level-up detection
 *  - Calculate level (1–20) and phase from total XP using threshold table
 *  - Emit XP_CHANGED and LEVEL_UP events through the registry event system
 *  - Track adaptive difficulty based on sustained negative performance
 *  - Apply XP loss reduction at level 16+
 *  - Trigger game-over warnings at configured thresholds
 */

import * as RK from '../constants/RegistryKeys.js';
import { XP_CHANGED, LEVEL_UP } from '../constants/Events.js';
import { XPLog } from './XPLog.js';

// ─────────────────────────────────────────────────────────────────────────────
// Level threshold table — Total XP required to reach each level
// ─────────────────────────────────────────────────────────────────────────────

/** Total XP required to reach each level (index = level, level 1 = index 1). */
export const LEVEL_THRESHOLDS = [
  0,    // unused (index 0)
  0,    // Level 1  — Newcomer
  50,   // Level 2
  120,  // Level 3
  200,  // Level 4
  300,  // Level 5
  500,  // Level 6  — Adapter
  700,  // Level 7
  950,  // Level 8
  1200, // Level 9
  1500, // Level 10
  1900, // Level 11 — Resident
  2300, // Level 12
  2700, // Level 13
  3000, // Level 14
  3400, // Level 15
  3800, // Level 16 — Local
  4200, // Level 17
  4600, // Level 18
  5000, // Level 19
  5500, // Level 20 — Honorary Dane
];

/** Maximum player level. */
export const MAX_LEVEL = 20;

/** Minimum XP before game-over warning. */
export const GAME_OVER_WARNING_THRESHOLD = -100;

/** Default true game-over XP floor. */
export const GAME_OVER_FLOOR = -500;

/** Number of consecutive negative days to trigger game-over warning. */
export const NEGATIVE_DAYS_WARNING = 3;

/** Level at which XP loss reduction (50%) activates. */
export const XP_LOSS_REDUCTION_LEVEL = 16;

// ─────────────────────────────────────────────────────────────────────────────
// Phase mapping
// ─────────────────────────────────────────────────────────────────────────────

/** Phase name keyed by the first level of that phase. */
export const PHASE_MAP = {
  1:  'Newcomer',
  6:  'Adapter',
  11: 'Resident',
  16: 'Local',
  20: 'Honorary Dane',
};

/**
 * Return the phase name for a given level.
 * @param {number} level - Player level (1–20).
 * @returns {string}
 */
export function getPhaseForLevel(level) {
  if (level >= 20) return 'Honorary Dane';
  if (level >= 16) return 'Local';
  if (level >= 11) return 'Resident';
  if (level >= 6)  return 'Adapter';
  return 'Newcomer';
}

// ─────────────────────────────────────────────────────────────────────────────
// Level calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the player level (1–20) from total accumulated XP.
 * @param {number} xp - Total XP (may be negative).
 * @returns {number} Level between 1 and MAX_LEVEL.
 */
export function calculateLevel(xp) {
  if (xp < 0) return 1;
  for (let lvl = MAX_LEVEL; lvl >= 1; lvl--) {
    if (xp >= LEVEL_THRESHOLDS[lvl]) return lvl;
  }
  return 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// XP Operations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Grant XP to the player.
 *
 * 1. Reads current XP and level from registry.
 * 2. Adds amount (must be positive; no-op if ≤ 0).
 * 3. Applies adaptive difficulty bonus if active (+25%).
 * 4. Writes new XP to registry (triggers HUD update via changedata event).
 * 5. Emits XP_CHANGED on registry.events.
 * 6. Recalculates level; emits LEVEL_UP if level changed.
 * 7. Logs the entry in XPLog.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {number} amount - XP to add (positive value).
 * @param {string} source - Human-readable source label.
 * @param {string} [category] - XP category (Transportation, Cultural, etc.).
 * @returns {{ newXP: number, newLevel: number, leveledUp: boolean }}
 */
export function grantXP(registry, amount, source, category = '') {
  if (amount <= 0) return _currentState(registry);

  const modifier = _getAdaptiveModifier(registry);
  const adjusted = Math.round(amount * modifier);

  const oldXP    = registry.get(RK.PLAYER_XP) ?? 0;
  const oldLevel = registry.get(RK.PLAYER_LEVEL) ?? 1;
  const newXP    = oldXP + adjusted;

  registry.set(RK.PLAYER_XP, newXP);
  registry.events.emit(XP_CHANGED, { amount: adjusted, newTotal: newXP, source, category });

  XPLog.addEntry(registry, { amount: adjusted, source, category, timestamp: Date.now() });

  const newLevel = _applyLevelUp(registry, oldLevel, newXP);
  return { newXP, newLevel, leveledUp: newLevel > oldLevel };
}

/**
 * Penalize (reduce) the player's XP.
 *
 * 1. Reads current XP and level from registry.
 * 2. Subtracts amount; applies 50% reduction if level ≥ 16.
 * 3. Clamps XP to GAME_OVER_FLOOR (default -500).
 * 4. Writes new XP to registry.
 * 5. Emits XP_CHANGED.
 * 6. Increments consecutive negative day counter if applicable.
 * 7. Emits game-over warning event when threshold met.
 * 8. Logs the entry in XPLog.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {number} amount - XP to remove (positive value = loss).
 * @param {string} source - Human-readable source label.
 * @param {string} [category] - XP category.
 * @param {object} [options]
 * @param {number} [options.floor=GAME_OVER_FLOOR] - Minimum XP clamp value.
 * @returns {{ newXP: number, newLevel: number, gameOverWarning: boolean }}
 */
export function penalizeXP(registry, amount, source, category = '', options = {}) {
  if (amount <= 0) return { ..._currentState(registry), gameOverWarning: false };

  const floor    = options.floor ?? GAME_OVER_FLOOR;
  const oldXP    = registry.get(RK.PLAYER_XP) ?? 0;
  const oldLevel = registry.get(RK.PLAYER_LEVEL) ?? 1;

  // XP loss reduction at level 16+
  let effective = amount;
  if (oldLevel >= XP_LOSS_REDUCTION_LEVEL) {
    effective = Math.round(amount * 0.5);
  }

  const rawNewXP = oldXP - effective;
  const newXP    = Math.max(rawNewXP, floor);

  registry.set(RK.PLAYER_XP, newXP);
  registry.events.emit(XP_CHANGED, { amount: -effective, newTotal: newXP, source, category });

  XPLog.addEntry(registry, { amount: -effective, source, category, timestamp: Date.now() });

  _applyLevelUp(registry, oldLevel, newXP);

  const gameOverWarning = _checkGameOverWarning(registry, newXP);
  return { newXP, newLevel: registry.get(RK.PLAYER_LEVEL) ?? 1, gameOverWarning };
}

// ─────────────────────────────────────────────────────────────────────────────
// Adaptive Difficulty
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Registry key used to track consecutive negative-XP days.
 * @internal
 */
const CONSECUTIVE_NEGATIVE_DAYS_KEY = 'xp_consecutive_negative_days';

/**
 * Registry key for the adaptive difficulty modifier (multiplier for XP gains).
 */
export const ADAPTIVE_MODIFIER_KEY = 'xp_adaptive_modifier';

/**
 * Notify the engine that a new day has started and whether the day's XP was
 * net-negative. Adjusts adaptive difficulty accordingly.
 *
 * Call this from the day-advance logic after calculating the daily XP summary.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {boolean} wasNegativeDay - True if daily net XP < 0.
 */
export function onDayAdvance(registry, wasNegativeDay) {
  let consecutiveNegDays = registry.get(CONSECUTIVE_NEGATIVE_DAYS_KEY) ?? 0;

  if (wasNegativeDay) {
    consecutiveNegDays += 1;
  } else {
    consecutiveNegDays = 0;
  }

  registry.set(CONSECUTIVE_NEGATIVE_DAYS_KEY, consecutiveNegDays);

  // Assist mode: 3+ consecutive negative days → +25% XP gains
  if (consecutiveNegDays >= NEGATIVE_DAYS_WARNING) {
    registry.set(ADAPTIVE_MODIFIER_KEY, 1.25);
  } else {
    registry.set(ADAPTIVE_MODIFIER_KEY, 1.0);
  }
}

/**
 * Return the current adaptive difficulty modifier (default 1.0).
 * @param {Phaser.Data.DataManager} registry
 * @returns {number}
 */
function _getAdaptiveModifier(registry) {
  return registry.get(ADAPTIVE_MODIFIER_KEY) ?? 1.0;
}

/**
 * Return consecutive negative days count.
 * @param {Phaser.Data.DataManager} registry
 * @returns {number}
 */
export function getConsecutiveNegativeDays(registry) {
  return registry.get(CONSECUTIVE_NEGATIVE_DAYS_KEY) ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Recalculate level and phase from newXP; update registry and emit LEVEL_UP
 * if level changed. Returns the new level.
 * @param {Phaser.Data.DataManager} registry
 * @param {number} oldLevel
 * @param {number} newXP
 * @returns {number} new level
 */
function _applyLevelUp(registry, oldLevel, newXP) {
  const newLevel = calculateLevel(newXP);
  const newPhase = getPhaseForLevel(newLevel);

  registry.set(RK.PLAYER_LEVEL, newLevel);
  registry.set(RK.CURRENT_PHASE, newPhase);

  if (newLevel !== oldLevel) {
    const oldPhase = getPhaseForLevel(oldLevel);
    registry.events.emit(LEVEL_UP, {
      oldLevel,
      newLevel,
      phase:          newPhase,
      phaseChanged:   newPhase !== oldPhase,
    });
  }

  return newLevel;
}

/**
 * Check if game-over warning should fire (XP below warning threshold).
 * @param {Phaser.Data.DataManager} registry
 * @param {number} xp
 * @returns {boolean}
 */
function _checkGameOverWarning(registry, xp) {
  if (xp <= GAME_OVER_WARNING_THRESHOLD) {
    registry.events.emit('game_over_warning', { xp });
    return true;
  }
  return false;
}

/**
 * Return the current XP/level state without modification.
 * @param {Phaser.Data.DataManager} registry
 */
function _currentState(registry) {
  return {
    newXP:    registry.get(RK.PLAYER_XP)    ?? 0,
    newLevel: registry.get(RK.PLAYER_LEVEL) ?? 1,
    leveledUp: false,
  };
}
