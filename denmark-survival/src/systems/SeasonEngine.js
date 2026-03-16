/**
 * src/systems/SeasonEngine.js
 * Manages season progression, season properties, and season transitions.
 *
 * Responsibilities:
 *  - Define seasons and their properties (duration, sunset time, difficulty, mood)
 *  - Track current season and day-in-season via registry
 *  - Detect and emit SEASON_CHANGED events at 22-day boundaries
 *  - Provide helper queries for sunset time, difficulty, mood
 */

import * as RK from '../constants/RegistryKeys.js';
import { SEASON_CHANGED } from '../constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Season constants
// ─────────────────────────────────────────────────────────────────────────────

export const SEASON_SPRING = 'Spring';
export const SEASON_SUMMER = 'Summer';
export const SEASON_FALL   = 'Fall';
export const SEASON_WINTER = 'Winter';

export const SEASON_ORDER = [SEASON_SPRING, SEASON_SUMMER, SEASON_FALL, SEASON_WINTER];

/** Number of in-game days in each season. */
export const SEASON_DURATION = 22;

// ─────────────────────────────────────────────────────────────────────────────
// Season properties
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Static properties for each season.
 * sunsetTime: formatted string used for UI display.
 * sunsetHour: decimal hour used for calculations (e.g. 20.0 for 20:00).
 * difficulty: 'Easy' | 'Medium' | 'Hard'
 * mood: flavour text for morning overview
 */
export const SEASON_PROPERTIES = {
  [SEASON_SPRING]: { sunsetTime: '20:00', sunsetHour: 20.0, difficulty: 'Medium', mood: 'Hopeful' },
  [SEASON_SUMMER]: { sunsetTime: '22:00', sunsetHour: 22.0, difficulty: 'Easy',   mood: 'Bright'  },
  [SEASON_FALL]:   { sunsetTime: '17:00', sunsetHour: 17.0, difficulty: 'Medium', mood: 'Cozy'    },
  [SEASON_WINTER]: { sunsetTime: '15:30', sunsetHour: 15.5, difficulty: 'Hard',   mood: 'Dark'    },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise season state in the registry if not already present.
 * Sets SEASON = Spring, DAY_IN_SEASON = 1.
 *
 * @param {Phaser.Data.DataManager} registry
 */
export function initSeason(registry) {
  if (!registry.has(RK.SEASON)) {
    registry.set(RK.SEASON, SEASON_SPRING);
  }
  if (!registry.has(RK.DAY_IN_SEASON)) {
    registry.set(RK.DAY_IN_SEASON, 1);
  }
}

/**
 * Return the properties object for the current season in the registry.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ sunsetTime: string, sunsetHour: number, difficulty: string, mood: string }}
 */
export function getCurrentSeasonProperties(registry) {
  const season = registry.get(RK.SEASON) ?? SEASON_SPRING;
  return SEASON_PROPERTIES[season] ?? SEASON_PROPERTIES[SEASON_SPRING];
}

/**
 * Return the sunset time string for the current season (e.g. '20:00').
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {string}
 */
export function getSunsetTime(registry) {
  return getCurrentSeasonProperties(registry).sunsetTime;
}

/**
 * Return the difficulty label for the current season.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {string} 'Easy' | 'Medium' | 'Hard'
 */
export function getSeasonDifficulty(registry) {
  return getCurrentSeasonProperties(registry).difficulty;
}

/**
 * Advance the season state by one day.
 * Increments DAY_IN_SEASON; when it exceeds SEASON_DURATION (22), rolls over
 * to the next season, resets DAY_IN_SEASON to 1, and emits SEASON_CHANGED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ season: string, dayInSeason: number, seasonChanged: boolean }}
 */
export function advanceSeason(registry) {
  const currentSeason  = registry.get(RK.SEASON) ?? SEASON_SPRING;
  const currentDayInSeason = (registry.get(RK.DAY_IN_SEASON) ?? 1) + 1;

  if (currentDayInSeason > SEASON_DURATION) {
    const currentIndex = SEASON_ORDER.indexOf(currentSeason);
    const nextIndex    = (currentIndex + 1) % SEASON_ORDER.length;
    const nextSeason   = SEASON_ORDER[nextIndex];

    registry.set(RK.SEASON, nextSeason);
    registry.set(RK.DAY_IN_SEASON, 1);

    registry.events.emit(SEASON_CHANGED, {
      previousSeason: currentSeason,
      newSeason:      nextSeason,
      properties:     SEASON_PROPERTIES[nextSeason],
    });

    return { season: nextSeason, dayInSeason: 1, seasonChanged: true };
  }

  registry.set(RK.DAY_IN_SEASON, currentDayInSeason);
  return { season: currentSeason, dayInSeason: currentDayInSeason, seasonChanged: false };
}

/**
 * Return the season name for a given absolute game day (1-based).
 * Useful for computing the season without registry state.
 *
 * @param {number} day - Absolute game day (1 = first day of Spring, day 1).
 * @returns {string} Season name constant.
 */
export function getSeasonForDay(day) {
  const seasonIndex = Math.floor((day - 1) / SEASON_DURATION) % SEASON_ORDER.length;
  return SEASON_ORDER[seasonIndex];
}
