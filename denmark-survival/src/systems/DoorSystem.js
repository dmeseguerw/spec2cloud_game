/**
 * src/systems/DoorSystem.js
 * Pure functions for building-entry door interactions.
 *
 * Handles: condition evaluation, open/closed state, context hint generation.
 *
 * Door open condition object shape:
 *   { type: 'shopHours', shopId: string }
 *
 * TIME_OF_DAY registry value is one of:
 *   'morning' | 'Morning' | 'afternoon' | 'Afternoon' |
 *   'evening' | 'Evening' | 'night'     | 'Night'
 */

import * as RK from '../constants/RegistryKeys.js';
import { isShopOpen, isWeekend } from './ShopSystem.js';

// ─────────────────────────────────────────────────────────────────────────────
// Time mapping
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Representative midpoint hour (0–23) for each named time period.
 * Covers both capitalised (DayCycleEngine) and lowercase (registry default) forms.
 */
export const TIME_PERIOD_HOURS = {
  morning:   9,
  afternoon: 14,
  evening:   19,
  night:     23,
};

/**
 * Convert a TIME_OF_DAY string to a representative numeric hour.
 * Case-insensitive; falls back to 9 (morning) for unknown values.
 *
 * @param {string} timeOfDay
 * @returns {number}
 */
export function timeOfDayToHour(timeOfDay) {
  const key = (timeOfDay ?? '').toLowerCase();
  return TIME_PERIOD_HOURS[key] ?? 9;
}

// ─────────────────────────────────────────────────────────────────────────────
// Condition evaluation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a door's open condition against current registry state.
 *
 * Supported condition types:
 *   - null / undefined : always open
 *   - { type: 'shopHours', shopId } : open when the named shop is open
 *
 * @param {object|null|undefined} condition
 * @param {Phaser.Data.DataManager} registry
 * @returns {boolean} True if the door is currently open.
 */
export function evaluateDoorCondition(condition, registry) {
  if (!condition) return true;

  if (condition.type === 'shopHours') {
    const timeOfDay  = registry.get(RK.TIME_OF_DAY) ?? 'morning';
    const currentDay = registry.get(RK.CURRENT_DAY) ?? 1;
    const hour       = timeOfDayToHour(timeOfDay);
    return isShopOpen(condition.shopId, hour, currentDay);
  }

  // Unknown condition types default to open
  return true;
}

/**
 * Check whether a door is currently open.
 *
 * @param {object} door - Door definition (must include `openCondition`).
 * @param {Phaser.Data.DataManager} registry
 * @returns {boolean}
 */
export function isDoorOpen(door, registry) {
  return evaluateDoorCondition(door.openCondition ?? null, registry);
}

// ─────────────────────────────────────────────────────────────────────────────
// Context hint generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the context hint string for a door interaction.
 *
 * - Open door  → "Press E — Enter {label}"
 * - Closed door → `door.closedMessage` (or a default fallback)
 *
 * @param {object} door - Door definition.
 * @param {Phaser.Data.DataManager} registry
 * @returns {string}
 */
export function getDoorContextHint(door, registry) {
  if (isDoorOpen(door, registry)) {
    return `Press E — Enter ${door.label}`;
  }
  return door.closedMessage ?? `${door.label} is closed`;
}
