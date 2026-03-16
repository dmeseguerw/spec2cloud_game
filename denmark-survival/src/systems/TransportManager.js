/**
 * src/systems/TransportManager.js
 * Central module for transportation mode management and trip completion.
 *
 * Responsibilities:
 *  - Manage transport mode switching (walking, biking, metro)
 *  - Expose speed multipliers per mode
 *  - Handle walking trip completion with XP and first-visit bonuses
 *  - Coordinate with BikeMechanics and MetroMechanics for mode-specific logic
 */

import * as RK from '../constants/RegistryKeys.js';
import { TRANSPORT_MODE_CHANGED } from '../constants/Events.js';
import { grantXP } from './XPEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// Transport mode constants
// ─────────────────────────────────────────────────────────────────────────────

/** Walking — always available, safest, slowest. */
export const TRANSPORT_WALK  = 'walk';

/** Biking — 2.5× speed, free after bike purchase, skill-based mechanics. */
export const TRANSPORT_BIKE  = 'bike';

/** Metro/Bus — instant travel, fare-based or monthly pass. */
export const TRANSPORT_METRO = 'metro';

/** All valid transport mode identifiers. */
export const ALL_TRANSPORT_MODES = [TRANSPORT_WALK, TRANSPORT_BIKE, TRANSPORT_METRO];

// ─────────────────────────────────────────────────────────────────────────────
// Speed multipliers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Speed multiplier for each transport mode.
 * Metro is null (instant scene transition, not a speed multiplier).
 */
export const SPEED_MULTIPLIERS = {
  [TRANSPORT_WALK]:  1.0,
  [TRANSPORT_BIKE]:  2.5,
  [TRANSPORT_METRO]: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// XP constants
// ─────────────────────────────────────────────────────────────────────────────

/** XP granted for completing a walking trip. */
export const WALK_TRIP_XP = 5;

/** XP bonus for first visit to a new area. */
export const FIRST_VISIT_XP = 5;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current transport mode from the registry.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {string} One of TRANSPORT_WALK, TRANSPORT_BIKE, TRANSPORT_METRO.
 */
export function getTransportMode(registry) {
  return registry.get(RK.TRANSPORT_MODE) ?? TRANSPORT_WALK;
}

/**
 * Set the transport mode, emitting TRANSPORT_MODE_CHANGED if it changes.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} mode - One of the TRANSPORT_* constants.
 * @returns {boolean} True if the mode was accepted; false if invalid.
 */
export function setTransportMode(registry, mode) {
  if (!ALL_TRANSPORT_MODES.includes(mode)) return false;

  const previous = getTransportMode(registry);
  registry.set(RK.TRANSPORT_MODE, mode);

  if (previous !== mode) {
    registry.events.emit(TRANSPORT_MODE_CHANGED, { previous, current: mode });
  }

  return true;
}

/**
 * Return the speed multiplier for the given mode (or current mode if omitted).
 * Returns null for metro (instant travel).
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string|null} [mode] - Specific mode to query; defaults to current.
 * @returns {number|null}
 */
export function getSpeedMultiplier(registry, mode = null) {
  const m = mode ?? getTransportMode(registry);
  return SPEED_MULTIPLIERS[m] !== undefined ? SPEED_MULTIPLIERS[m] : 1.0;
}

/**
 * Complete a walking trip.
 * Grants base WALK_TRIP_XP (+5) and optionally a FIRST_VISIT_XP (+5) bonus
 * if the given locationId has not been visited before.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string|null} [locationId] - Optional location identifier for first-visit tracking.
 * @returns {{ xpGranted: number, firstVisit: boolean }}
 */
export function completeWalkingTrip(registry, locationId = null) {
  grantXP(registry, WALK_TRIP_XP, 'Walking trip', 'Transportation');

  let firstVisit = false;

  if (locationId) {
    const visited = registry.get(RK.VISITED_LOCATIONS) ?? [];
    if (!visited.includes(locationId)) {
      registry.set(RK.VISITED_LOCATIONS, [...visited, locationId]);
      grantXP(registry, FIRST_VISIT_XP, `First visit: ${locationId}`, 'Exploration');
      firstVisit = true;
    }
  }

  return { xpGranted: WALK_TRIP_XP, firstVisit };
}
