/**
 * src/systems/MetroMechanics.js
 * Manages metro/bus mechanics: check-in/out, fare deduction, monthly pass,
 * and inspector encounters.
 *
 * Responsibilities:
 *  - Validate Rejsekort balance or monthly pass on check-in
 *  - Track check-in state to detect fare dodging
 *  - Deduct per-trip fare (24 DKK) at check-in unless monthly pass is active
 *  - Grant XP (+10) on successful check-out
 *  - Apply -30 XP penalty for skipping check-in
 *  - Run 8% inspector check at check-out; no valid ticket = -50 XP + 500 DKK fine
 *  - Allow purchase of monthly pass (400 DKK) and Rejsekort top-up
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  METRO_CHECKED_IN,
  METRO_CHECKED_OUT,
  METRO_FARE_DEDUCTED,
  METRO_INSPECTOR_ENCOUNTER,
} from '../constants/Events.js';
import { grantXP, penalizeXP } from './XPEngine.js';
import { setTransportMode, TRANSPORT_METRO, TRANSPORT_WALK } from './TransportManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fare constants
// ─────────────────────────────────────────────────────────────────────────────

/** Per-trip fare in DKK. */
export const METRO_FARE = 24;

/** Monthly pass cost in DKK. */
export const METRO_MONTHLY_PASS_COST = 400;

/** XP granted for completing a metro trip (check-in + check-out). */
export const METRO_TRIP_XP = 10;

/** XP penalty for skipping metro check-in. */
export const METRO_SKIP_PENALTY = 30;

/** Probability of an inspector encounter per trip (8%). */
export const METRO_INSPECTOR_CHANCE = 0.08;

/** XP penalty when caught without a ticket by an inspector. */
export const METRO_NO_TICKET_XP_PENALTY = 50;

/** DKK fine when caught without a ticket by an inspector. */
export const METRO_NO_TICKET_DKK_FINE = 500;

// ─────────────────────────────────────────────────────────────────────────────
// Check-in / Check-out
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check in to the metro.
 * Validates that the player has sufficient Rejsekort balance or a monthly pass.
 * Deducts the fare (24 DKK) unless a monthly pass is active.
 * Sets `metro_checked_in = true` and switches transport mode to metro.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ success: boolean, reason?: string, fareDeducted: number, hasPass: boolean, balance: number }}
 */
export function metroCheckIn(registry) {
  const hasPass = registry.get(RK.METRO_MONTHLY_PASS) ?? false;
  const balance = registry.get(RK.REJSEKORT_BALANCE)  ?? 0;

  if (!hasPass && balance < METRO_FARE) {
    return { success: false, reason: 'insufficient_funds', fareDeducted: 0, hasPass, balance };
  }

  let fareDeducted = 0;
  if (!hasPass) {
    fareDeducted = _deductFare(registry, METRO_FARE);
  }

  registry.set(RK.METRO_CHECKED_IN, true);
  setTransportMode(registry, TRANSPORT_METRO);

  registry.events.emit(METRO_CHECKED_IN, { hasPass, fareDeducted, balance: registry.get(RK.REJSEKORT_BALANCE) ?? 0 });

  return {
    success: true,
    fareDeducted,
    hasPass,
    balance: registry.get(RK.REJSEKORT_BALANCE) ?? 0,
  };
}

/**
 * Check out of the metro.
 * If the player did not properly check in, applies the skip penalty (-30 XP) and
 * marks `hasTicket = false` for the inspector check.
 * Grants +10 XP on successful check-out and runs the 8% inspector encounter.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {function} [randomFn] - Random function (0–1); defaults to Math.random.
 * @returns {{ success: boolean, skipped?: boolean, xp: number, inspectorEncounter: boolean, inspectorPenalty: number }}
 */
export function metroCheckOut(registry, randomFn = Math.random) {
  const checkedIn = registry.get(RK.METRO_CHECKED_IN) ?? false;

  let hasTicket = checkedIn;

  if (!checkedIn) {
    // Penalty for skipping check-in
    penalizeXP(registry, METRO_SKIP_PENALTY, 'Skipped metro check-in', 'Transportation');
  }

  registry.set(RK.METRO_CHECKED_IN, false);
  setTransportMode(registry, TRANSPORT_WALK);

  // Inspector check
  const inspectorResult = _runInspector(registry, hasTicket, randomFn);

  if (checkedIn) {
    // Only grant XP on valid trip
    grantXP(registry, METRO_TRIP_XP, 'Metro trip completed', 'Transportation');
  }

  registry.events.emit(METRO_CHECKED_OUT, {
    hasTicket,
    inspectorEncounter: inspectorResult.encounter,
  });

  return {
    success:            checkedIn,
    skipped:            !checkedIn,
    xp:                 checkedIn ? METRO_TRIP_XP : -METRO_SKIP_PENALTY,
    inspectorEncounter: inspectorResult.encounter,
    inspectorPenalty:   inspectorResult.penalty,
  };
}

/**
 * Explicitly skip the metro check-in (called when player bypasses the check-in gate).
 * Applies -30 XP immediately.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ xp: number }}
 */
export function skipMetroCheckIn(registry) {
  penalizeXP(registry, METRO_SKIP_PENALTY, 'Skipped metro check-in', 'Transportation');
  return { xp: -METRO_SKIP_PENALTY };
}

// ─────────────────────────────────────────────────────────────────────────────
// Monthly pass & Rejsekort
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Purchase a monthly pass (400 DKK).
 * Deducts from the Rejsekort balance and sets `metro_monthly_pass = true`.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ success: boolean, reason?: string, balance: number }}
 */
export function buyMonthlyPass(registry) {
  const balance = registry.get(RK.REJSEKORT_BALANCE) ?? 0;
  if (balance < METRO_MONTHLY_PASS_COST) {
    return { success: false, reason: 'insufficient_funds', balance };
  }

  const newBalance = balance - METRO_MONTHLY_PASS_COST;
  registry.set(RK.REJSEKORT_BALANCE, newBalance);
  registry.set(RK.METRO_MONTHLY_PASS, true);

  return { success: true, balance: newBalance };
}

/**
 * Top up the Rejsekort balance.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} amount - Amount to add (must be positive).
 * @returns {boolean} True if the top-up succeeded.
 */
export function loadRejsekort(registry, amount) {
  if (amount <= 0) return false;
  const balance = registry.get(RK.REJSEKORT_BALANCE) ?? 0;
  registry.set(RK.REJSEKORT_BALANCE, balance + amount);
  return true;
}

/**
 * Get the current Rejsekort balance.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {number}
 */
export function getRejsekortBalance(registry) {
  return registry.get(RK.REJSEKORT_BALANCE) ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Deduct a fare amount from the Rejsekort and emit METRO_FARE_DEDUCTED.
 * @param {Phaser.Data.DataManager} registry
 * @param {number} amount
 * @returns {number} The amount deducted.
 */
function _deductFare(registry, amount) {
  const balance    = registry.get(RK.REJSEKORT_BALANCE) ?? 0;
  const newBalance = Math.max(0, balance - amount);
  registry.set(RK.REJSEKORT_BALANCE, newBalance);
  registry.events.emit(METRO_FARE_DEDUCTED, { amount, newBalance });
  return amount;
}

/**
 * Run the inspector encounter check (8% probability per trip).
 * If the inspector appears and the player has no valid ticket:
 *   - Penalise -50 XP
 *   - Deduct 500 DKK fine from player money
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {boolean} hasTicket - Whether the player has a valid ticket.
 * @param {function} randomFn - Random function (0–1).
 * @returns {{ encounter: boolean, penalty: number }}
 */
function _runInspector(registry, hasTicket, randomFn) {
  const roll      = randomFn();
  const encounter = roll < METRO_INSPECTOR_CHANCE;

  if (!encounter) return { encounter: false, penalty: 0 };

  // Inspector appeared — check ticket validity
  const hasPass = registry.get(RK.METRO_MONTHLY_PASS) ?? false;
  const valid   = hasTicket || hasPass;

  if (valid) {
    registry.events.emit(METRO_INSPECTOR_ENCOUNTER, { hasTicket: true, penalty: 0 });
    return { encounter: true, penalty: 0 };
  }

  // No valid ticket — apply XP and DKK penalty
  penalizeXP(registry, METRO_NO_TICKET_XP_PENALTY, 'No metro ticket', 'Transportation');

  const money    = registry.get(RK.PLAYER_MONEY) ?? 0;
  const newMoney = Math.max(0, money - METRO_NO_TICKET_DKK_FINE);
  registry.set(RK.PLAYER_MONEY, newMoney);

  registry.events.emit(METRO_INSPECTOR_ENCOUNTER, {
    hasTicket:  false,
    xpPenalty:  METRO_NO_TICKET_XP_PENALTY,
    dkkFine:    METRO_NO_TICKET_DKK_FINE,
  });

  return { encounter: true, penalty: METRO_NO_TICKET_XP_PENALTY };
}
