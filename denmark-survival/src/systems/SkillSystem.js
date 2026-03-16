/**
 * src/systems/SkillSystem.js
 * Manages the 4 soft skills (Language, Cycling, Cultural Navigation, Bureaucracy).
 *
 * Each skill is stored as a numeric value in [0, 100] in the registry.
 * The value is converted to a level in [1, 5] using equal-width thresholds:
 *   0–19 → Level 1
 *  20–39 → Level 2
 *  40–59 → Level 3
 *  60–79 → Level 4
 *  80–100 → Level 5
 */

import * as RK from '../constants/RegistryKeys.js';
import { SKILL_CHANGED } from '../constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Skill keys
// ─────────────────────────────────────────────────────────────────────────────

/** All valid skill registry keys. */
export const SKILL_KEYS = [
  RK.SKILL_LANGUAGE,
  RK.SKILL_CYCLING,
  RK.SKILL_CULTURAL,
  RK.SKILL_BUREAUCRACY,
];

/** Skill level boundaries — value must be ≥ threshold to reach that level. */
const SKILL_LEVEL_THRESHOLDS = [0, 20, 40, 60, 80];

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the skill level (1–5) derived from the skill's raw value (0–100).
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} skillKey - A registry key from SKILL_KEYS.
 * @returns {number} Skill level between 1 and 5.
 */
export function getSkillLevel(registry, skillKey) {
  const value = _getSkillValue(registry, skillKey);
  return _valueToLevel(value);
}

/**
 * Increment a skill's raw value by `amount`, clamped to [0, 100].
 * Emits a SKILL_CHANGED event if the skill's level changes.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} skillKey - A registry key from SKILL_KEYS.
 * @param {number} amount - Amount to add (positive value only; negative is ignored).
 * @returns {{ newValue: number, newLevel: number, levelChanged: boolean }}
 */
export function incrementSkill(registry, skillKey, amount) {
  if (amount <= 0) {
    const current = _getSkillValue(registry, skillKey);
    return { newValue: current, newLevel: _valueToLevel(current), levelChanged: false };
  }

  const oldValue = _getSkillValue(registry, skillKey);
  const oldLevel = _valueToLevel(oldValue);

  const newValue = Math.min(100, oldValue + amount);
  const newLevel = _valueToLevel(newValue);

  registry.set(skillKey, newValue);

  if (newLevel !== oldLevel) {
    registry.events.emit(SKILL_CHANGED, {
      skillKey,
      oldLevel,
      newLevel,
      newValue,
    });
  }

  return { newValue, newLevel, levelChanged: newLevel !== oldLevel };
}

/**
 * Check whether the player's current skill level meets a required level.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} skillKey - A registry key from SKILL_KEYS.
 * @param {number} requiredLevel - Minimum required level (1–5).
 * @returns {boolean}
 */
export function checkSkillRequirement(registry, skillKey, requiredLevel) {
  return getSkillLevel(registry, skillKey) >= requiredLevel;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the raw skill value (0–100) from the registry, defaulting to 0.
 * @param {Phaser.Data.DataManager} registry
 * @param {string} skillKey
 * @returns {number}
 */
function _getSkillValue(registry, skillKey) {
  return registry.get(skillKey) ?? 0;
}

/**
 * Convert a raw skill value (0–100) to a level (1–5).
 * @param {number} value
 * @returns {number}
 */
function _valueToLevel(value) {
  for (let lvl = SKILL_LEVEL_THRESHOLDS.length - 1; lvl >= 0; lvl--) {
    if (value >= SKILL_LEVEL_THRESHOLDS[lvl]) return lvl + 1;
  }
  return 1;
}
