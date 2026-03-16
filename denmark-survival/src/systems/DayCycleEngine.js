/**
 * src/systems/DayCycleEngine.js
 * Manages the flow of time through each in-game day.
 *
 * Responsibilities:
 *  - Track current time period (Morning/Afternoon/Evening/Night)
 *  - Manage activity slot counter (3–5 slots per day)
 *  - Register and track mandatory activities (work, groceries, bills, vitamin D)
 *  - Detect missed mandatory activities and apply XP penalties
 *  - Advance the day counter and trigger end-of-day processing
 *  - Check food spoilage and calculate daily net XP
 *  - Emit events: TIME_ADVANCED, ACTIVITY_COMPLETED, MANDATORY_ACTIVITY_MISSED, DAY_ENDED, DAY_ADVANCED
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  TIME_ADVANCED,
  ACTIVITY_COMPLETED,
  MANDATORY_ACTIVITY_MISSED,
  DAY_ENDED,
  DAY_ADVANCED,
} from '../constants/Events.js';
import { penalizeXP } from './XPEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// Time period constants
// ─────────────────────────────────────────────────────────────────────────────

export const PERIOD_MORNING   = 'Morning';    // 07:00–12:00
export const PERIOD_AFTERNOON = 'Afternoon';  // 12:00–17:00
export const PERIOD_EVENING   = 'Evening';    // 17:00–22:00
export const PERIOD_NIGHT     = 'Night';      // 22:00–07:00

export const TIME_PERIODS = [
  PERIOD_MORNING,
  PERIOD_AFTERNOON,
  PERIOD_EVENING,
  PERIOD_NIGHT,
];

/** Display labels used in HUD (start–end strings for each period). */
export const PERIOD_HOURS = {
  [PERIOD_MORNING]:   '07:00–12:00',
  [PERIOD_AFTERNOON]: '12:00–17:00',
  [PERIOD_EVENING]:   '17:00–22:00',
  [PERIOD_NIGHT]:     '22:00–07:00',
};

// ─────────────────────────────────────────────────────────────────────────────
// Activity slot configuration
// ─────────────────────────────────────────────────────────────────────────────

/** Default number of activity slots available each day. */
export const DEFAULT_ACTIVITY_SLOTS = 4;

/** Minimum and maximum configurable slots. */
export const MIN_ACTIVITY_SLOTS = 3;
export const MAX_ACTIVITY_SLOTS = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Mandatory activity identifiers
// ─────────────────────────────────────────────────────────────────────────────

export const ACTIVITY_WORK          = 'work';
export const ACTIVITY_GROCERY       = 'grocery_shopping';
export const ACTIVITY_BILL_PAYMENT  = 'bill_payment';
export const ACTIVITY_VITAMIN_D     = 'vitamin_d';

/** XP penalties for skipping each mandatory activity type. */
export const MANDATORY_SKIP_PENALTIES = {
  [ACTIVITY_WORK]:         30,
  [ACTIVITY_GROCERY]:      15,
  [ACTIVITY_BILL_PAYMENT]: 20,
  [ACTIVITY_VITAMIN_D]:    10,
};

// ─────────────────────────────────────────────────────────────────────────────
// Initialisation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise day-cycle state in the registry for a new game (or first load).
 * Safe to call multiple times — only sets keys that are not already present.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} [options]
 * @param {number} [options.slots=DEFAULT_ACTIVITY_SLOTS] - Starting slot count for the day.
 */
export function initDayCycle(registry, options = {}) {
  const slots = options.slots ?? DEFAULT_ACTIVITY_SLOTS;

  if (!registry.has(RK.CURRENT_DAY)) {
    registry.set(RK.CURRENT_DAY, 1);
  }
  if (!registry.has(RK.TIME_OF_DAY)) {
    registry.set(RK.TIME_OF_DAY, PERIOD_MORNING);
  }
  if (!registry.has(RK.ACTIVITY_SLOTS_REMAINING)) {
    registry.set(RK.ACTIVITY_SLOTS_REMAINING, slots);
  }
  if (!registry.has(RK.MANDATORY_ACTIVITIES)) {
    registry.set(RK.MANDATORY_ACTIVITIES, []);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Time period management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Advance the time of day to the next period.
 * Cycles: Morning → Afternoon → Evening → Night → (stays at Night until day end).
 * Emits TIME_ADVANCED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ previous: string, current: string, wrappedToNight: boolean }}
 */
export function advanceTimePeriod(registry) {
  const current = registry.get(RK.TIME_OF_DAY) ?? PERIOD_MORNING;
  const idx     = TIME_PERIODS.indexOf(current);

  // Clamp at Night — day end must be triggered explicitly
  const nextIdx = Math.min(idx + 1, TIME_PERIODS.length - 1);
  const next    = TIME_PERIODS[nextIdx];

  registry.set(RK.TIME_OF_DAY, next);
  registry.events.emit(TIME_ADVANCED, { previous: current, current: next });

  return { previous: current, current: next, wrappedToNight: next === PERIOD_NIGHT };
}

/**
 * Reset the time period to Morning (called when starting a new day).
 *
 * @param {Phaser.Data.DataManager} registry
 */
export function resetTimePeriod(registry) {
  registry.set(RK.TIME_OF_DAY, PERIOD_MORNING);
}

// ─────────────────────────────────────────────────────────────────────────────
// Activity slot management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the number of activity slots remaining today.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {number}
 */
export function getActivitySlotsRemaining(registry) {
  return registry.get(RK.ACTIVITY_SLOTS_REMAINING) ?? DEFAULT_ACTIVITY_SLOTS;
}

/**
 * Check whether at least one activity slot is available.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {boolean}
 */
export function hasActivitySlotsRemaining(registry) {
  return getActivitySlotsRemaining(registry) > 0;
}

/**
 * Consume one activity slot, advance the time period, and emit ACTIVITY_COMPLETED.
 * No-op (returns false) when no slots remain.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} activityId - Identifier of the completed activity.
 * @param {string} [label]    - Human-readable label for logs/UI.
 * @returns {boolean} True if the slot was successfully consumed.
 */
export function completeActivity(registry, activityId, label = activityId) {
  const slotsLeft = getActivitySlotsRemaining(registry);
  if (slotsLeft <= 0) return false;

  const newSlots = slotsLeft - 1;
  registry.set(RK.ACTIVITY_SLOTS_REMAINING, newSlots);

  // Mark mandatory activity as done if it's in the pending list
  _markMandatoryDone(registry, activityId);

  // Advance time period with each activity
  advanceTimePeriod(registry);

  registry.events.emit(ACTIVITY_COMPLETED, {
    activityId,
    label,
    slotsRemaining: newSlots,
  });

  return true;
}

/**
 * Reset the activity slot counter for a new day.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} [slots=DEFAULT_ACTIVITY_SLOTS] - Number of slots for the new day.
 */
export function resetActivitySlots(registry, slots = DEFAULT_ACTIVITY_SLOTS) {
  const clamped = Math.min(Math.max(slots, MIN_ACTIVITY_SLOTS), MAX_ACTIVITY_SLOTS);
  registry.set(RK.ACTIVITY_SLOTS_REMAINING, clamped);
}

// ─────────────────────────────────────────────────────────────────────────────
// Mandatory activity tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Register a mandatory activity that must be completed today.
 * Adds an entry to the MANDATORY_ACTIVITIES registry list.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} activityId - Activity identifier (use ACTIVITY_* constants).
 * @param {string} [label]    - Human-readable label for display.
 */
export function addMandatoryActivity(registry, activityId, label = activityId) {
  const list = registry.get(RK.MANDATORY_ACTIVITIES) ?? [];
  // Avoid duplicates
  if (list.some(a => a.id === activityId)) return;
  registry.set(RK.MANDATORY_ACTIVITIES, [...list, { id: activityId, label, completed: false }]);
}

/**
 * Return all pending (incomplete) mandatory activities for today.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<{ id: string, label: string, completed: boolean }>}
 */
export function getPendingMandatoryActivities(registry) {
  const list = registry.get(RK.MANDATORY_ACTIVITIES) ?? [];
  return list.filter(a => !a.completed);
}

/**
 * Check whether any mandatory activities were not completed and apply XP penalties.
 * Emits MANDATORY_ACTIVITY_MISSED for each missed activity.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<{ id: string, penalty: number }>} List of missed activities and penalties applied.
 */
export function processMissedMandatoryActivities(registry) {
  const pending = getPendingMandatoryActivities(registry);
  const missed  = [];

  for (const activity of pending) {
    const penalty = MANDATORY_SKIP_PENALTIES[activity.id] ?? 10;
    penalizeXP(registry, penalty, `Skipped: ${activity.label}`, 'Mandatory');
    registry.events.emit(MANDATORY_ACTIVITY_MISSED, { activityId: activity.id, label: activity.label, penalty });
    missed.push({ id: activity.id, penalty });
  }

  return missed;
}

/**
 * Clear the mandatory activity list (called at the start of each new day).
 *
 * @param {Phaser.Data.DataManager} registry
 */
export function clearMandatoryActivities(registry) {
  registry.set(RK.MANDATORY_ACTIVITIES, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// End-of-day logic
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Run all end-of-day processes:
 *  1. Process missed mandatory activities (XP penalties)
 *  2. Check food spoilage in inventory (removes spoiled items)
 *  3. Emit DAY_ENDED event with summary
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ missedActivities: Array, spoiledItems: Array }}
 */
export function endDay(registry) {
  const missedActivities = processMissedMandatoryActivities(registry);
  const spoiledItems     = _processFoodSpoilage(registry);

  const currentDay = registry.get(RK.CURRENT_DAY) ?? 1;

  registry.events.emit(DAY_ENDED, {
    day:               currentDay,
    missedActivities,
    spoiledItems,
  });

  return { missedActivities, spoiledItems };
}

/**
 * Advance to the next in-game day.
 * Resets time period to Morning, resets activity slots, clears mandatory list,
 * increments CURRENT_DAY, and emits DAY_ADVANCED.
 *
 * Intended to be called *after* endDay() and season/weather updates.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} [options]
 * @param {number} [options.slots=DEFAULT_ACTIVITY_SLOTS] - Slots for the new day.
 * @returns {number} The new CURRENT_DAY value.
 */
export function advanceDay(registry, options = {}) {
  const slots      = options.slots ?? DEFAULT_ACTIVITY_SLOTS;
  const previousDay = registry.get(RK.CURRENT_DAY) ?? 1;
  const newDay      = previousDay + 1;

  registry.set(RK.CURRENT_DAY, newDay);
  resetTimePeriod(registry);
  resetActivitySlots(registry, slots);
  clearMandatoryActivities(registry);

  registry.events.emit(DAY_ADVANCED, { previousDay, newDay });

  return newDay;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a mandatory activity as completed in the registry list.
 * @param {Phaser.Data.DataManager} registry
 * @param {string} activityId
 */
function _markMandatoryDone(registry, activityId) {
  const list = registry.get(RK.MANDATORY_ACTIVITIES) ?? [];
  const updated = list.map(a => a.id === activityId ? { ...a, completed: true } : a);
  registry.set(RK.MANDATORY_ACTIVITIES, updated);
}

/**
 * Check inventory for spoiled food items and remove them.
 * An item is considered spoiled if it has a `spoilsOnDay` property
 * that is less than or equal to the current day.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>} The spoiled items that were removed.
 */
function _processFoodSpoilage(registry) {
  const inventory  = registry.get(RK.INVENTORY) ?? [];
  const currentDay = registry.get(RK.CURRENT_DAY) ?? 1;

  if (!Array.isArray(inventory) || inventory.length === 0) return [];

  const spoiled    = inventory.filter(item => item.spoilsOnDay !== undefined && item.spoilsOnDay <= currentDay);
  const remaining  = inventory.filter(item => !(item.spoilsOnDay !== undefined && item.spoilsOnDay <= currentDay));

  if (spoiled.length > 0) {
    registry.set(RK.INVENTORY, remaining);
  }

  return spoiled;
}
