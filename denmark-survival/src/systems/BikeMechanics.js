/**
 * src/systems/BikeMechanics.js
 * Manages bike-specific mechanics: mount/dismount, signal checks, lights,
 * rain accident probability, parking, and cycling skill progression.
 *
 * Responsibilities:
 *  - Mount/dismount at bike parking locations
 *  - Signal checks at turns: correct = +5 XP, fail = -15 XP
 *  - Bike lights requirement after sunset (Evening/Night); -20 XP if lights off
 *  - Rain accident chance based on cycling skill level
 *  - Parking with theft risk based on lock quality
 *  - Cycling skill increment after successful trips (via SkillSystem)
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  BIKE_MOUNTED,
  BIKE_DISMOUNTED,
  BIKE_SIGNAL_CHECK,
  BIKE_LIGHTS_WARNING,
  BIKE_ACCIDENT,
  TRANSPORT_MODE_CHANGED,
} from '../constants/Events.js';
import { grantXP, penalizeXP } from './XPEngine.js';
import { incrementSkill, getSkillLevel } from './SkillSystem.js';
import { PERIOD_EVENING, PERIOD_NIGHT } from './DayCycleEngine.js';
import { TRANSPORT_WALK, TRANSPORT_BIKE } from './TransportManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// XP constants
// ─────────────────────────────────────────────────────────────────────────────

/** XP granted for correctly signaling at a turn. */
export const SIGNAL_SUCCESS_XP = 5;

/** XP penalty for failing to signal correctly. */
export const SIGNAL_FAIL_XP = 15;

/** XP penalty for biking without lights after sunset. */
export const LIGHTS_WARNING_XP = 20;

/** XP penalty for a rain/weather accident. */
export const ACCIDENT_XP = 40;

/** Base XP granted for a completed bike trip. */
export const BIKE_TRIP_XP_BASE = 10;

/** Maximum XP that can be granted for a single bike trip. */
export const BIKE_TRIP_XP_MAX = 20;

/** Raw cycling skill points added per successful trip. */
export const CYCLING_SKILL_INCREMENT = 2;

// ─────────────────────────────────────────────────────────────────────────────
// Accident probability table
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Accident probability (0–1) when cycling in rain, keyed by cycling skill level (1–5).
 * Higher skill = lower accident chance.
 */
export const ACCIDENT_CHANCES = {
  1: 0.10,
  2: 0.08,
  3: 0.05,
  4: 0.03,
  5: 0.02,
};

// ─────────────────────────────────────────────────────────────────────────────
// Mount / Dismount
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mount the bike. Sets transport mode to bike and marks the bike as mounted.
 * Auto-toggles lights if it is Evening or Night and the player owns lights.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ success: boolean, reason?: string }}
 */
export function mountBike(registry) {
  if (!registry.get(RK.HAS_BIKE)) {
    return { success: false, reason: 'no_bike' };
  }

  registry.set(RK.BIKE_MOUNTED, true);
  registry.set(RK.TRANSPORT_MODE, TRANSPORT_BIKE);
  registry.events.emit(BIKE_MOUNTED, {});

  // Auto-toggle lights at evening/night if lights are owned
  const timeOfDay = registry.get(RK.TIME_OF_DAY);
  if (isBikeLightsRequired(timeOfDay) && registry.get(RK.HAS_BIKE_LIGHTS)) {
    registry.set(RK.BIKE_LIGHTS_ON, true);
  }

  return { success: true };
}

/**
 * Dismount the bike. Clears bike_mounted and reverts transport mode to walking.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ success: boolean }}
 */
export function dismountBike(registry) {
  registry.set(RK.BIKE_MOUNTED, false);
  registry.set(RK.TRANSPORT_MODE, TRANSPORT_WALK);

  const previous = TRANSPORT_BIKE;
  registry.events.emit(TRANSPORT_MODE_CHANGED, { previous, current: TRANSPORT_WALK });
  registry.events.emit(BIKE_DISMOUNTED, {});

  return { success: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Lights
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return true if bike lights are required for the given time period.
 * Lights are required during Evening (17:00–22:00) and Night (22:00–07:00).
 *
 * @param {string} timeOfDay - Current time period name.
 * @returns {boolean}
 */
export function isBikeLightsRequired(timeOfDay) {
  return timeOfDay === PERIOD_EVENING || timeOfDay === PERIOD_NIGHT;
}

/**
 * Check whether the player is biking with lights off after sunset.
 * If lights are required and not on, apply a -20 XP penalty (random check —
 * only fires if the random roll is below the check probability).
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} timeOfDay - Current time period name.
 * @param {function} [randomFn] - Random function (0–1); defaults to Math.random.
 * @param {number} [checkProbability=0.5] - Probability (0–1) of being checked by police.
 * @returns {{ required: boolean, warning: boolean, xp?: number }}
 */
export function checkBikeLights(registry, timeOfDay, randomFn = Math.random, checkProbability = 0.5) {
  const required = isBikeLightsRequired(timeOfDay);
  if (!required) return { required: false, warning: false };

  const lightsOn = registry.get(RK.BIKE_LIGHTS_ON) ?? false;
  if (lightsOn) return { required: true, warning: false };

  // Random police/spot check
  const roll = randomFn();
  if (roll >= checkProbability) return { required: true, warning: false };

  penalizeXP(registry, LIGHTS_WARNING_XP, 'Biking without lights', 'Transportation');
  registry.events.emit(BIKE_LIGHTS_WARNING, { xp: -LIGHTS_WARNING_XP });

  return { required: true, warning: true, xp: -LIGHTS_WARNING_XP };
}

// ─────────────────────────────────────────────────────────────────────────────
// Signal check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Process a signal check at a turn.
 * Correct signal: +5 XP. Incorrect signal: -15 XP.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {boolean} correct - Whether the player signaled correctly.
 * @returns {{ correct: boolean, xp: number }}
 */
export function checkSignal(registry, correct) {
  if (correct) {
    grantXP(registry, SIGNAL_SUCCESS_XP, 'Bike signal correct', 'Transportation');
    registry.events.emit(BIKE_SIGNAL_CHECK, { correct: true, xp: SIGNAL_SUCCESS_XP });
    return { correct: true, xp: SIGNAL_SUCCESS_XP };
  }

  penalizeXP(registry, SIGNAL_FAIL_XP, 'Bike signal failed', 'Transportation');
  registry.events.emit(BIKE_SIGNAL_CHECK, { correct: false, xp: -SIGNAL_FAIL_XP });
  return { correct: false, xp: -SIGNAL_FAIL_XP };
}

// ─────────────────────────────────────────────────────────────────────────────
// Rain / weather accident
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check for a rain/bad-weather accident based on the player's cycling skill.
 * Accident chance per skill level: L1=10%, L2=8%, L3=5%, L4=3%, L5=2%.
 * An accident applies -40 XP.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {boolean} isRaining - True when weather poses a cycling risk.
 * @param {function} [randomFn] - Random function (0–1); defaults to Math.random.
 * @returns {{ accident: boolean, cyclingLevel?: number, xp?: number }}
 */
export function checkRainAccident(registry, isRaining, randomFn = Math.random) {
  if (!isRaining) return { accident: false };

  const cyclingLevel   = getSkillLevel(registry, RK.SKILL_CYCLING);
  const accidentChance = ACCIDENT_CHANCES[cyclingLevel] ?? ACCIDENT_CHANCES[1];
  const roll           = randomFn();

  if (roll < accidentChance) {
    penalizeXP(registry, ACCIDENT_XP, 'Bike accident in rain', 'Transportation');
    registry.events.emit(BIKE_ACCIDENT, { xp: -ACCIDENT_XP, cyclingLevel });
    return { accident: true, xp: -ACCIDENT_XP, cyclingLevel };
  }

  return { accident: false, cyclingLevel };
}

// ─────────────────────────────────────────────────────────────────────────────
// Trip completion
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark a bike trip as successfully completed.
 * Grants XP (clamped to [BIKE_TRIP_XP_BASE, BIKE_TRIP_XP_MAX]) and increments
 * the cycling skill via SkillSystem.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} [xpAmount=BIKE_TRIP_XP_BASE] - XP to grant for this trip.
 * @returns {{ xp: number, skillResult: object }}
 */
export function completeBikeTrip(registry, xpAmount = BIKE_TRIP_XP_BASE) {
  const xp = Math.min(Math.max(xpAmount, BIKE_TRIP_XP_BASE), BIKE_TRIP_XP_MAX);
  grantXP(registry, xp, 'Bike trip completed', 'Transportation');

  const skillResult = incrementSkill(registry, RK.SKILL_CYCLING, CYCLING_SKILL_INCREMENT);

  return { xp, skillResult };
}

// ─────────────────────────────────────────────────────────────────────────────
// Parking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Park the bike (dismount + theft check).
 * Legal parking reduces theft risk. Lock quality (1–3) affects theft probability:
 *   L1 (no lock) = 15%, L2 (basic lock) = 8%, L3 (heavy lock) = 2%.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} [options]
 * @param {boolean} [options.legalParking=true] - Whether parking in a legal spot.
 * @param {number}  [options.lockQuality=1]     - Lock quality (1–3).
 * @param {function} [randomFn] - Random function (0–1); defaults to Math.random.
 * @returns {{ success: boolean, legalParking: boolean, stolen: boolean }}
 */
export function parkBike(registry, options = {}, randomFn = Math.random) {
  const { legalParking = true, lockQuality = 1 } = options;

  dismountBike(registry);

  const theftChances = { 1: 0.15, 2: 0.08, 3: 0.02 };
  const theftChance  = theftChances[lockQuality] ?? theftChances[1];
  const stolen       = randomFn() < theftChance;

  if (stolen) {
    registry.set(RK.HAS_BIKE, false);
    return { success: true, legalParking, stolen: true };
  }

  return { success: true, legalParking, stolen: false };
}
