/**
 * src/systems/GameOverManager.js
 * Centralizes all game-over and warning threshold logic.
 *
 * The XPEngine tracks consecutive negative days and clamps XP to
 * GAME_OVER_FLOOR (-500).  This module provides pure functions to
 * query that state and produce UI-ready summary data.
 */

import * as RK from '../constants/RegistryKeys.js';
import { GAME_OVER, GAME_OVER_WARNING } from '../constants/Events.js';
import {
  GAME_OVER_FLOOR,
  GAME_OVER_WARNING_THRESHOLD,
  NEGATIVE_DAYS_WARNING,
  getConsecutiveNegativeDays,
} from './XPEngine.js';

// Re-export the thresholds so callers don't need to import XPEngine directly.
export { GAME_OVER_FLOOR, GAME_OVER_WARNING_THRESHOLD, NEGATIVE_DAYS_WARNING };

// ─────────────────────────────────────────────────────────────────────────────
// Pure predicate helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return true when the player has hit the hard game-over XP floor.
 * @param {number} xp - Current player XP.
 * @returns {boolean}
 */
export function isGameOver(xp) {
  return xp <= GAME_OVER_FLOOR;
}

/**
 * Return true when the player's XP is in the warning zone AND they have
 * sustained negative XP for the required number of consecutive days.
 *
 * @param {number} xp - Current player XP.
 * @param {number} consecutiveNegDays - Days in a row where daily net XP < 0.
 * @returns {boolean}
 */
export function isGameOverWarning(xp, consecutiveNegDays) {
  return xp <= GAME_OVER_WARNING_THRESHOLD && consecutiveNegDays >= NEGATIVE_DAYS_WARNING;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registry-aware helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Inspect the registry and return the current game-over state.
 * Also emits GAME_OVER or GAME_OVER_WARNING events when the conditions are met.
 *
 * @param {object} registry - Phaser registry (or MockRegistry).
 * @returns {{ isGameOver: boolean, isWarning: boolean, xp: number, consecutiveNegDays: number }}
 */
export function checkGameOverState(registry) {
  const xp = registry.get(RK.PLAYER_XP) ?? 0;
  const consecutiveNegDays = getConsecutiveNegativeDays(registry);

  const gameOver = isGameOver(xp);
  const warning  = !gameOver && isGameOverWarning(xp, consecutiveNegDays);

  if (gameOver) {
    registry.events.emit(GAME_OVER, { xp, consecutiveNegDays });
  } else if (warning) {
    registry.events.emit(GAME_OVER_WARNING, { xp, consecutiveNegDays });
  }

  return { isGameOver: gameOver, isWarning: warning, xp, consecutiveNegDays };
}

/**
 * Build a summary object for the Game Over screen.
 *
 * @param {object} registry - Phaser registry (or MockRegistry).
 * @returns {{ playerName: string, daysSurvived: number, highestLevel: number, xp: number }}
 */
export function getGameOverSummary(registry) {
  return {
    playerName:   registry.get(RK.PLAYER_NAME)  ?? 'Unknown',
    daysSurvived: registry.get(RK.CURRENT_DAY)  ?? 1,
    highestLevel: registry.get(RK.PLAYER_LEVEL) ?? 1,
    xp:           registry.get(RK.PLAYER_XP)    ?? 0,
  };
}
