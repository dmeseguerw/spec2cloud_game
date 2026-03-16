/**
 * src/systems/WeatherSystem.js
 * Generates daily weather based on season-specific probability tables.
 *
 * Responsibilities:
 *  - Define weather types and their seasonal probability tables
 *  - Generate a random weather value for a given season
 *  - Expose weather effect metadata (transportation risk, clothing, etc.)
 *  - Write weather to registry and emit WEATHER_CHANGED event
 */

import * as RK from '../constants/RegistryKeys.js';
import { WEATHER_CHANGED } from '../constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Weather type constants
// ─────────────────────────────────────────────────────────────────────────────

export const WEATHER_SUNNY  = 'Sunny';
export const WEATHER_CLOUDY = 'Cloudy';
export const WEATHER_RAINY  = 'Rainy';
export const WEATHER_WINDY  = 'Windy';
export const WEATHER_SNOWY  = 'Snowy';
export const WEATHER_FOGGY  = 'Foggy';

export const ALL_WEATHER_TYPES = [
  WEATHER_SUNNY,
  WEATHER_CLOUDY,
  WEATHER_RAINY,
  WEATHER_WINDY,
  WEATHER_SNOWY,
  WEATHER_FOGGY,
];

// ─────────────────────────────────────────────────────────────────────────────
// Season name constants (mirrors SeasonEngine, kept here for independence)
// ─────────────────────────────────────────────────────────────────────────────

export const SEASON_SPRING = 'Spring';
export const SEASON_SUMMER = 'Summer';
export const SEASON_FALL   = 'Fall';
export const SEASON_WINTER = 'Winter';

// ─────────────────────────────────────────────────────────────────────────────
// Probability tables (cumulative, in the order of ALL_WEATHER_TYPES)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Seasonal weather probability tables.
 * Each entry maps weather type → probability weight (0–100, sum = 100).
 */
export const WEATHER_PROBABILITIES = {
  [SEASON_SPRING]: {
    [WEATHER_SUNNY]:  30,
    [WEATHER_CLOUDY]: 25,
    [WEATHER_RAINY]:  25,
    [WEATHER_WINDY]:  15,
    [WEATHER_SNOWY]:   0,
    [WEATHER_FOGGY]:   5,
  },
  [SEASON_SUMMER]: {
    [WEATHER_SUNNY]:  45,
    [WEATHER_CLOUDY]: 20,
    [WEATHER_RAINY]:  15,
    [WEATHER_WINDY]:  10,
    [WEATHER_SNOWY]:   0,
    [WEATHER_FOGGY]:  10,
  },
  [SEASON_FALL]: {
    [WEATHER_SUNNY]:  20,
    [WEATHER_CLOUDY]: 30,
    [WEATHER_RAINY]:  30,
    [WEATHER_WINDY]:  15,
    [WEATHER_SNOWY]:   0,
    [WEATHER_FOGGY]:   5,
  },
  [SEASON_WINTER]: {
    [WEATHER_SUNNY]:  10,
    [WEATHER_CLOUDY]: 30,
    [WEATHER_RAINY]:  20,
    [WEATHER_WINDY]:  20,
    [WEATHER_SNOWY]:  15,
    [WEATHER_FOGGY]:   5,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Weather effect metadata
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Describes game-mechanical effects of each weather type.
 * - transportationRisk: modifier on bike travel difficulty (0 = none, 1 = high)
 * - requiresBikeLight: true when visibility is reduced
 * - requiresExtraClothing: true when warmth gear is needed
 * - encounterFilter: tag added to random-encounter pool filter
 */
export const WEATHER_EFFECTS = {
  [WEATHER_SUNNY]:  { transportationRisk: 0,   requiresBikeLight: false, requiresExtraClothing: false, encounterFilter: 'sunny'  },
  [WEATHER_CLOUDY]: { transportationRisk: 0,   requiresBikeLight: false, requiresExtraClothing: false, encounterFilter: 'cloudy' },
  [WEATHER_RAINY]:  { transportationRisk: 0.5, requiresBikeLight: true,  requiresExtraClothing: true,  encounterFilter: 'rainy'  },
  [WEATHER_WINDY]:  { transportationRisk: 0.4, requiresBikeLight: false, requiresExtraClothing: true,  encounterFilter: 'windy'  },
  [WEATHER_SNOWY]:  { transportationRisk: 0.8, requiresBikeLight: true,  requiresExtraClothing: true,  encounterFilter: 'snowy'  },
  [WEATHER_FOGGY]:  { transportationRisk: 0.3, requiresBikeLight: true,  requiresExtraClothing: false, encounterFilter: 'foggy'  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Core functions
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate a random weather type for the given season using its probability table.
 * Snowy is only possible in Winter; attempts on other seasons return a valid
 * non-snowy result following the table.
 *
 * @param {string} season - One of the SEASON_* constants.
 * @param {function} [randomFn] - Optional seeded random function (0–1). Defaults to Math.random.
 * @returns {string} A weather type constant.
 */
export function generateWeather(season, randomFn = Math.random) {
  const table = WEATHER_PROBABILITIES[season] ?? WEATHER_PROBABILITIES[SEASON_SPRING];

  const roll = randomFn() * 100;
  let cumulative = 0;

  for (const type of ALL_WEATHER_TYPES) {
    cumulative += table[type] ?? 0;
    if (roll < cumulative) return type;
  }

  // Fallback (rounding edge case)
  return ALL_WEATHER_TYPES[0];
}

/**
 * Generate weather, write it to the registry, and emit WEATHER_CHANGED.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @param {string} season - Current season name.
 * @param {function} [randomFn] - Optional seeded random function (0–1).
 * @returns {string} The chosen weather type.
 */
export function applyDailyWeather(registry, season, randomFn = Math.random) {
  const weather = generateWeather(season, randomFn);
  registry.set(RK.WEATHER, weather);
  registry.events.emit(WEATHER_CHANGED, { weather, season });
  return weather;
}

/**
 * Return the effect metadata for the current weather.
 *
 * @param {Phaser.Data.DataManager} registry - Game registry.
 * @returns {object} Weather effects object (transportationRisk, etc.).
 */
export function getCurrentWeatherEffects(registry) {
  const weather = registry.get(RK.WEATHER) ?? WEATHER_SUNNY;
  return WEATHER_EFFECTS[weather] ?? WEATHER_EFFECTS[WEATHER_SUNNY];
}
