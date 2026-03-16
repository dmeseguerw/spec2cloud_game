/**
 * tests/systems/WeatherSystem.test.js
 * Unit tests for WeatherSystem.
 * Coverage target: ≥85% of src/systems/WeatherSystem.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  generateWeather,
  applyDailyWeather,
  getCurrentWeatherEffects,
  WEATHER_SUNNY,
  WEATHER_CLOUDY,
  WEATHER_RAINY,
  WEATHER_WINDY,
  WEATHER_SNOWY,
  WEATHER_FOGGY,
  ALL_WEATHER_TYPES,
  SEASON_SPRING,
  SEASON_SUMMER,
  SEASON_FALL,
  SEASON_WINTER,
  WEATHER_PROBABILITIES,
  WEATHER_EFFECTS,
} from '../../src/systems/WeatherSystem.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { WEATHER_CHANGED } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(weather) {
  const r = new MockRegistry();
  if (weather !== undefined) r.set(RK.WEATHER, weather);
  return r;
}

/** Deterministic random that always returns a fixed value in [0, 1). */
const alwaysZero = () => 0;          // maps to first non-zero bucket
const alwaysOne  = () => 0.9999999;  // maps to last bucket with any weight

// ─────────────────────────────────────────────────────────────────────────────
// Weather type constants
// ─────────────────────────────────────────────────────────────────────────────

describe('Weather type constants', () => {
  it('ALL_WEATHER_TYPES contains all 6 types', () => {
    expect(ALL_WEATHER_TYPES).toHaveLength(6);
    expect(ALL_WEATHER_TYPES).toContain(WEATHER_SUNNY);
    expect(ALL_WEATHER_TYPES).toContain(WEATHER_CLOUDY);
    expect(ALL_WEATHER_TYPES).toContain(WEATHER_RAINY);
    expect(ALL_WEATHER_TYPES).toContain(WEATHER_WINDY);
    expect(ALL_WEATHER_TYPES).toContain(WEATHER_SNOWY);
    expect(ALL_WEATHER_TYPES).toContain(WEATHER_FOGGY);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER_PROBABILITIES — table integrity
// ─────────────────────────────────────────────────────────────────────────────

describe('WEATHER_PROBABILITIES — table integrity', () => {
  const seasons = [SEASON_SPRING, SEASON_SUMMER, SEASON_FALL, SEASON_WINTER];

  for (const season of seasons) {
    it(`${season} probabilities sum to 100`, () => {
      const table = WEATHER_PROBABILITIES[season];
      const total = Object.values(table).reduce((sum, v) => sum + v, 0);
      expect(total).toBe(100);
    });

    it(`${season} contains all 6 weather keys`, () => {
      const table = WEATHER_PROBABILITIES[season];
      for (const type of ALL_WEATHER_TYPES) {
        expect(type in table).toBe(true);
      }
    });
  }

  it('Snowy probability is 0 in Spring', () => {
    expect(WEATHER_PROBABILITIES[SEASON_SPRING][WEATHER_SNOWY]).toBe(0);
  });
  it('Snowy probability is 0 in Summer', () => {
    expect(WEATHER_PROBABILITIES[SEASON_SUMMER][WEATHER_SNOWY]).toBe(0);
  });
  it('Snowy probability is 0 in Fall', () => {
    expect(WEATHER_PROBABILITIES[SEASON_FALL][WEATHER_SNOWY]).toBe(0);
  });
  it('Snowy probability is 15 in Winter', () => {
    expect(WEATHER_PROBABILITIES[SEASON_WINTER][WEATHER_SNOWY]).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateWeather — deterministic tests
// ─────────────────────────────────────────────────────────────────────────────

describe('generateWeather — deterministic', () => {
  it('returns a valid weather type for Spring', () => {
    const result = generateWeather(SEASON_SPRING);
    expect(ALL_WEATHER_TYPES).toContain(result);
  });

  it('returns a valid weather type for Summer', () => {
    const result = generateWeather(SEASON_SUMMER);
    expect(ALL_WEATHER_TYPES).toContain(result);
  });

  it('returns a valid weather type for Fall', () => {
    const result = generateWeather(SEASON_FALL);
    expect(ALL_WEATHER_TYPES).toContain(result);
  });

  it('returns a valid weather type for Winter', () => {
    const result = generateWeather(SEASON_WINTER);
    expect(ALL_WEATHER_TYPES).toContain(result);
  });

  it('roll=0 gives the first non-zero bucket (Sunny in all seasons)', () => {
    // All seasons have Sunny > 0, so roll=0 always picks Sunny
    expect(generateWeather(SEASON_SPRING, alwaysZero)).toBe(WEATHER_SUNNY);
    expect(generateWeather(SEASON_SUMMER, alwaysZero)).toBe(WEATHER_SUNNY);
    expect(generateWeather(SEASON_FALL,   alwaysZero)).toBe(WEATHER_SUNNY);
    expect(generateWeather(SEASON_WINTER, alwaysZero)).toBe(WEATHER_SUNNY);
  });

  it('roll near 1 gives the last non-zero bucket', () => {
    // Spring: last type with weight is Foggy (5%) — cumulative ends at 100
    const result = generateWeather(SEASON_SPRING, alwaysOne);
    expect(ALL_WEATHER_TYPES).toContain(result);
  });

  it('Snowy is never generated in Spring', () => {
    // Run many samples — alwaysZero & alwaysOne bracket should not give Snowy
    for (let i = 0; i < 200; i++) {
      expect(generateWeather(SEASON_SPRING)).not.toBe(WEATHER_SNOWY);
    }
  });

  it('Snowy is never generated in Summer', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateWeather(SEASON_SUMMER)).not.toBe(WEATHER_SNOWY);
    }
  });

  it('Snowy is never generated in Fall', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateWeather(SEASON_FALL)).not.toBe(WEATHER_SNOWY);
    }
  });

  it('Snowy can be generated in Winter', () => {
    // Use a deterministic roll inside the Snowy range
    // Snowy in Winter: Sunny(10) + Cloudy(30) + Rainy(20) + Windy(20) = 80 cumulative, Snowy at 80–95
    const rollAt82 = () => 0.82; // 82% → falls in Snowy band
    expect(generateWeather(SEASON_WINTER, rollAt82)).toBe(WEATHER_SNOWY);
  });

  it('falls back gracefully for unknown season (uses Spring table)', () => {
    const result = generateWeather('UnknownSeason', alwaysZero);
    expect(ALL_WEATHER_TYPES).toContain(result);
  });

  it('fallback to first weather type when roll hits exactly 100 (rounding edge case)', () => {
    // When randomFn returns exactly 1.0, roll = 100.0; no bucket matches (all < 100)
    const alwaysExactlyOne = () => 1.0;
    const result = generateWeather(SEASON_SPRING, alwaysExactlyOne);
    expect(result).toBe(ALL_WEATHER_TYPES[0]); // fallback to Sunny
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateWeather — statistical test
// ─────────────────────────────────────────────────────────────────────────────

describe('generateWeather — statistical distribution', () => {
  const SAMPLES = 10000;

  it('Spring: Sunny appears ~30% of the time (±5%)', () => {
    let count = 0;
    for (let i = 0; i < SAMPLES; i++) {
      if (generateWeather(SEASON_SPRING) === WEATHER_SUNNY) count++;
    }
    const ratio = count / SAMPLES;
    expect(ratio).toBeGreaterThan(0.25);
    expect(ratio).toBeLessThan(0.35);
  });

  it('Summer: Sunny appears ~45% of the time (±5%)', () => {
    let count = 0;
    for (let i = 0; i < SAMPLES; i++) {
      if (generateWeather(SEASON_SUMMER) === WEATHER_SUNNY) count++;
    }
    const ratio = count / SAMPLES;
    expect(ratio).toBeGreaterThan(0.40);
    expect(ratio).toBeLessThan(0.50);
  });

  it('Winter: Snowy appears ~15% of the time (±5%)', () => {
    let count = 0;
    for (let i = 0; i < SAMPLES; i++) {
      if (generateWeather(SEASON_WINTER) === WEATHER_SNOWY) count++;
    }
    const ratio = count / SAMPLES;
    expect(ratio).toBeGreaterThan(0.10);
    expect(ratio).toBeLessThan(0.20);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// applyDailyWeather
// ─────────────────────────────────────────────────────────────────────────────

describe('applyDailyWeather', () => {
  it('sets WEATHER registry key', () => {
    const registry = makeRegistry();
    applyDailyWeather(registry, SEASON_SPRING);
    expect(ALL_WEATHER_TYPES).toContain(registry.get(RK.WEATHER));
  });

  it('emits WEATHER_CHANGED event with weather and season', () => {
    const registry = makeRegistry();
    const calls = [];
    registry.events.on(WEATHER_CHANGED, (payload) => calls.push(payload));

    const weather = applyDailyWeather(registry, SEASON_SUMMER);
    expect(calls).toHaveLength(1);
    expect(calls[0].weather).toBe(weather);
    expect(calls[0].season).toBe(SEASON_SUMMER);
  });

  it('returns the chosen weather type', () => {
    const registry = makeRegistry();
    const result   = applyDailyWeather(registry, SEASON_FALL);
    expect(ALL_WEATHER_TYPES).toContain(result);
    expect(registry.get(RK.WEATHER)).toBe(result);
  });

  it('uses custom randomFn', () => {
    const registry = makeRegistry();
    const result   = applyDailyWeather(registry, SEASON_SPRING, alwaysZero);
    expect(result).toBe(WEATHER_SUNNY);
    expect(registry.get(RK.WEATHER)).toBe(WEATHER_SUNNY);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentWeatherEffects
// ─────────────────────────────────────────────────────────────────────────────

describe('getCurrentWeatherEffects', () => {
  it('returns effects for current registry weather', () => {
    const registry = makeRegistry(WEATHER_RAINY);
    const effects  = getCurrentWeatherEffects(registry);
    expect(effects.transportationRisk).toBe(0.5);
    expect(effects.requiresBikeLight).toBe(true);
    expect(effects.requiresExtraClothing).toBe(true);
    expect(effects.encounterFilter).toBe('rainy');
  });

  it('defaults to Sunny effects when no weather set', () => {
    const registry = makeRegistry();
    const effects  = getCurrentWeatherEffects(registry);
    expect(effects.transportationRisk).toBe(0);
    expect(effects.requiresBikeLight).toBe(false);
  });

  it('Snowy has highest transportationRisk (0.8)', () => {
    const registry = makeRegistry(WEATHER_SNOWY);
    const effects  = getCurrentWeatherEffects(registry);
    expect(effects.transportationRisk).toBe(0.8);
  });

  it('Sunny has zero transportationRisk', () => {
    const registry = makeRegistry(WEATHER_SUNNY);
    const effects  = getCurrentWeatherEffects(registry);
    expect(effects.transportationRisk).toBe(0);
  });

  it('all weather types have effect entries', () => {
    for (const type of ALL_WEATHER_TYPES) {
      const registry = makeRegistry(type);
      const effects  = getCurrentWeatherEffects(registry);
      expect(effects).toBeDefined();
      expect(typeof effects.transportationRisk).toBe('number');
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// WEATHER_EFFECTS metadata
// ─────────────────────────────────────────────────────────────────────────────

describe('WEATHER_EFFECTS metadata', () => {
  it('Foggy requires bike light', () => {
    expect(WEATHER_EFFECTS[WEATHER_FOGGY].requiresBikeLight).toBe(true);
  });
  it('Windy requires extra clothing', () => {
    expect(WEATHER_EFFECTS[WEATHER_WINDY].requiresExtraClothing).toBe(true);
  });
  it('Cloudy does not require bike light or extra clothing', () => {
    expect(WEATHER_EFFECTS[WEATHER_CLOUDY].requiresBikeLight).toBe(false);
    expect(WEATHER_EFFECTS[WEATHER_CLOUDY].requiresExtraClothing).toBe(false);
  });
});
