/**
 * tests/systems/BikeMechanics.test.js
 * Unit and integration tests for BikeMechanics.
 * Coverage target: ≥85% of src/systems/BikeMechanics.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  mountBike,
  dismountBike,
  isBikeLightsRequired,
  checkBikeLights,
  checkSignal,
  checkRainAccident,
  completeBikeTrip,
  parkBike,
  SIGNAL_SUCCESS_XP,
  SIGNAL_FAIL_XP,
  LIGHTS_WARNING_XP,
  ACCIDENT_XP,
  BIKE_TRIP_XP_BASE,
  BIKE_TRIP_XP_MAX,
  CYCLING_SKILL_INCREMENT,
  ACCIDENT_CHANCES,
} from '../../src/systems/BikeMechanics.js';
import { TRANSPORT_WALK, TRANSPORT_BIKE } from '../../src/systems/TransportManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  BIKE_MOUNTED,
  BIKE_DISMOUNTED,
  BIKE_SIGNAL_CHECK,
  BIKE_LIGHTS_WARNING,
  BIKE_ACCIDENT,
} from '../../src/constants/Events.js';
import { PERIOD_MORNING, PERIOD_AFTERNOON, PERIOD_EVENING, PERIOD_NIGHT } from '../../src/systems/DayCycleEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry({ hasBike = true, hasLights = false, lightsOn = false, skillValue = 0 } = {}) {
  const registry = new MockRegistry();
  registry.set(RK.PLAYER_XP,      0);
  registry.set(RK.PLAYER_LEVEL,   1);
  registry.set(RK.HAS_BIKE,       hasBike);
  registry.set(RK.HAS_BIKE_LIGHTS, hasLights);
  registry.set(RK.BIKE_LIGHTS_ON, lightsOn);
  registry.set(RK.SKILL_CYCLING,  skillValue);
  registry.set(RK.BIKE_MOUNTED,   false);
  registry.set(RK.TIME_OF_DAY,    PERIOD_MORNING);
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('BikeMechanics constants', () => {
  it('SIGNAL_SUCCESS_XP is 5', () => expect(SIGNAL_SUCCESS_XP).toBe(5));
  it('SIGNAL_FAIL_XP is 15', () => expect(SIGNAL_FAIL_XP).toBe(15));
  it('LIGHTS_WARNING_XP is 20', () => expect(LIGHTS_WARNING_XP).toBe(20));
  it('ACCIDENT_XP is 40', () => expect(ACCIDENT_XP).toBe(40));
  it('BIKE_TRIP_XP_BASE is 10', () => expect(BIKE_TRIP_XP_BASE).toBe(10));
  it('BIKE_TRIP_XP_MAX is 20', () => expect(BIKE_TRIP_XP_MAX).toBe(20));

  it('ACCIDENT_CHANCES has correct values for all 5 levels', () => {
    expect(ACCIDENT_CHANCES[1]).toBe(0.10);
    expect(ACCIDENT_CHANCES[2]).toBe(0.08);
    expect(ACCIDENT_CHANCES[3]).toBe(0.05);
    expect(ACCIDENT_CHANCES[4]).toBe(0.03);
    expect(ACCIDENT_CHANCES[5]).toBe(0.02);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mount / Dismount
// ─────────────────────────────────────────────────────────────────────────────

describe('mountBike', () => {
  it('sets BIKE_MOUNTED to true', () => {
    const registry = createRegistry({ hasBike: true });
    mountBike(registry);
    expect(registry.get(RK.BIKE_MOUNTED)).toBe(true);
  });

  it('sets transport mode to bike', () => {
    const registry = createRegistry({ hasBike: true });
    mountBike(registry);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_BIKE);
  });

  it('emits BIKE_MOUNTED event', () => {
    const registry = createRegistry({ hasBike: true });
    const handler = vi.fn();
    registry.events.on(BIKE_MOUNTED, handler);
    mountBike(registry);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('returns failure when player has no bike', () => {
    const registry = createRegistry({ hasBike: false });
    const result = mountBike(registry);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('no_bike');
  });

  it('does not change state when no bike', () => {
    const registry = createRegistry({ hasBike: false });
    mountBike(registry);
    expect(registry.get(RK.BIKE_MOUNTED)).toBe(false);
  });

  it('auto-enables lights at Evening when player owns lights', () => {
    const registry = createRegistry({ hasBike: true, hasLights: true, lightsOn: false });
    registry.set(RK.TIME_OF_DAY, PERIOD_EVENING);
    mountBike(registry);
    expect(registry.get(RK.BIKE_LIGHTS_ON)).toBe(true);
  });

  it('auto-enables lights at Night when player owns lights', () => {
    const registry = createRegistry({ hasBike: true, hasLights: true, lightsOn: false });
    registry.set(RK.TIME_OF_DAY, PERIOD_NIGHT);
    mountBike(registry);
    expect(registry.get(RK.BIKE_LIGHTS_ON)).toBe(true);
  });

  it('does NOT auto-enable lights during Morning', () => {
    const registry = createRegistry({ hasBike: true, hasLights: true, lightsOn: false });
    registry.set(RK.TIME_OF_DAY, PERIOD_MORNING);
    mountBike(registry);
    expect(registry.get(RK.BIKE_LIGHTS_ON)).toBe(false);
  });

  it('does NOT auto-enable lights if player does not own lights', () => {
    const registry = createRegistry({ hasBike: true, hasLights: false, lightsOn: false });
    registry.set(RK.TIME_OF_DAY, PERIOD_EVENING);
    mountBike(registry);
    expect(registry.get(RK.BIKE_LIGHTS_ON)).toBe(false);
  });
});

describe('dismountBike', () => {
  it('sets BIKE_MOUNTED to false', () => {
    const registry = createRegistry({ hasBike: true });
    registry.set(RK.BIKE_MOUNTED, true);
    dismountBike(registry);
    expect(registry.get(RK.BIKE_MOUNTED)).toBe(false);
  });

  it('sets transport mode back to walk', () => {
    const registry = createRegistry({ hasBike: true });
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_BIKE);
    dismountBike(registry);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_WALK);
  });

  it('emits BIKE_DISMOUNTED event', () => {
    const registry = createRegistry({ hasBike: true });
    const handler = vi.fn();
    registry.events.on(BIKE_DISMOUNTED, handler);
    dismountBike(registry);
    expect(handler).toHaveBeenCalledOnce();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Bike lights
// ─────────────────────────────────────────────────────────────────────────────

describe('isBikeLightsRequired', () => {
  it('returns false during Morning', () => {
    expect(isBikeLightsRequired(PERIOD_MORNING)).toBe(false);
  });

  it('returns false during Afternoon', () => {
    expect(isBikeLightsRequired(PERIOD_AFTERNOON)).toBe(false);
  });

  it('returns true during Evening (after sunset)', () => {
    expect(isBikeLightsRequired(PERIOD_EVENING)).toBe(true);
  });

  it('returns true during Night (after sunset)', () => {
    expect(isBikeLightsRequired(PERIOD_NIGHT)).toBe(true);
  });
});

describe('checkBikeLights', () => {
  it('returns required=false during daytime — no penalty', () => {
    const registry = createRegistry();
    const result = checkBikeLights(registry, PERIOD_MORNING);
    expect(result.required).toBe(false);
    expect(result.warning).toBe(false);
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
  });

  it('returns no warning when lights are on at Evening', () => {
    const registry = createRegistry({ lightsOn: true });
    const result = checkBikeLights(registry, PERIOD_EVENING);
    expect(result.required).toBe(true);
    expect(result.warning).toBe(false);
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
  });

  it('applies penalty when lights off at Evening and check fires', () => {
    const registry = createRegistry({ lightsOn: false });
    // Force the check to fire by returning 0.0 (< 0.5 default probability)
    const result = checkBikeLights(registry, PERIOD_EVENING, () => 0.0);
    expect(result.required).toBe(true);
    expect(result.warning).toBe(true);
    expect(result.xp).toBe(-LIGHTS_WARNING_XP);
    expect(registry.get(RK.PLAYER_XP)).toBe(-LIGHTS_WARNING_XP);
  });

  it('does NOT apply penalty when random check does not fire', () => {
    const registry = createRegistry({ lightsOn: false });
    // Roll >= checkProbability → check does not fire
    const result = checkBikeLights(registry, PERIOD_EVENING, () => 1.0);
    expect(result.warning).toBe(false);
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
  });

  it('emits BIKE_LIGHTS_WARNING event when penalty fires', () => {
    const registry = createRegistry({ lightsOn: false });
    const handler = vi.fn();
    registry.events.on(BIKE_LIGHTS_WARNING, handler);
    checkBikeLights(registry, PERIOD_NIGHT, () => 0.0);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].xp).toBe(-LIGHTS_WARNING_XP);
  });

  it('also fires penalty at Night', () => {
    const registry = createRegistry({ lightsOn: false });
    checkBikeLights(registry, PERIOD_NIGHT, () => 0.0);
    expect(registry.get(RK.PLAYER_XP)).toBe(-LIGHTS_WARNING_XP);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Signal check
// ─────────────────────────────────────────────────────────────────────────────

describe('checkSignal', () => {
  it('grants SIGNAL_SUCCESS_XP (+5) on correct signal', () => {
    const registry = createRegistry();
    const result = checkSignal(registry, true);
    expect(registry.get(RK.PLAYER_XP)).toBe(SIGNAL_SUCCESS_XP);
    expect(result.correct).toBe(true);
    expect(result.xp).toBe(SIGNAL_SUCCESS_XP);
  });

  it('applies SIGNAL_FAIL_XP (-15) on incorrect signal', () => {
    const registry = createRegistry();
    registry.set(RK.PLAYER_XP, 50);
    const result = checkSignal(registry, false);
    expect(registry.get(RK.PLAYER_XP)).toBe(50 - SIGNAL_FAIL_XP);
    expect(result.correct).toBe(false);
    expect(result.xp).toBe(-SIGNAL_FAIL_XP);
  });

  it('emits BIKE_SIGNAL_CHECK event on correct signal', () => {
    const registry = createRegistry();
    const handler = vi.fn();
    registry.events.on(BIKE_SIGNAL_CHECK, handler);
    checkSignal(registry, true);
    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.correct).toBe(true);
    expect(payload.xp).toBe(SIGNAL_SUCCESS_XP);
  });

  it('emits BIKE_SIGNAL_CHECK event on failed signal', () => {
    const registry = createRegistry();
    const handler = vi.fn();
    registry.events.on(BIKE_SIGNAL_CHECK, handler);
    checkSignal(registry, false);
    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.correct).toBe(false);
    expect(payload.xp).toBe(-SIGNAL_FAIL_XP);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rain accident
// ─────────────────────────────────────────────────────────────────────────────

describe('checkRainAccident', () => {
  it('returns no accident when not raining', () => {
    const registry = createRegistry();
    const result = checkRainAccident(registry, false);
    expect(result.accident).toBe(false);
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
  });

  it('applies ACCIDENT_XP (-40) when accident occurs', () => {
    const registry = createRegistry({ skillValue: 0 }); // skill level 1
    // Force accident by returning a roll below 0.10
    const result = checkRainAccident(registry, true, () => 0.05);
    expect(result.accident).toBe(true);
    expect(result.xp).toBe(-ACCIDENT_XP);
    expect(registry.get(RK.PLAYER_XP)).toBe(-ACCIDENT_XP);
  });

  it('no accident when roll exceeds accident chance', () => {
    const registry = createRegistry({ skillValue: 0 }); // skill level 1 = 10% chance
    const result = checkRainAccident(registry, true, () => 0.95);
    expect(result.accident).toBe(false);
    expect(registry.get(RK.PLAYER_XP)).toBe(0);
  });

  it('emits BIKE_ACCIDENT event on accident', () => {
    const registry = createRegistry({ skillValue: 0 });
    const handler = vi.fn();
    registry.events.on(BIKE_ACCIDENT, handler);
    checkRainAccident(registry, true, () => 0.01);
    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.xp).toBe(-ACCIDENT_XP);
    expect(payload.cyclingLevel).toBe(1);
  });

  it('accident chance matches skill level table — L1 (10%)', () => {
    const registry = createRegistry({ skillValue: 0 }); // level 1
    const result = checkRainAccident(registry, true, () => 0.09);
    expect(result.accident).toBe(true);
    expect(result.cyclingLevel).toBe(1);
  });

  it('accident chance matches skill level table — L2 (8%)', () => {
    const registry = createRegistry({ skillValue: 20 }); // level 2
    const result = checkRainAccident(registry, true, () => 0.07);
    expect(result.accident).toBe(true);
    expect(result.cyclingLevel).toBe(2);
  });

  it('accident chance matches skill level table — L3 (5%)', () => {
    const registry = createRegistry({ skillValue: 40 }); // level 3
    const result = checkRainAccident(registry, true, () => 0.04);
    expect(result.accident).toBe(true);
    expect(result.cyclingLevel).toBe(3);
  });

  it('accident chance matches skill level table — L4 (3%)', () => {
    const registry = createRegistry({ skillValue: 60 }); // level 4
    const result = checkRainAccident(registry, true, () => 0.02);
    expect(result.accident).toBe(true);
    expect(result.cyclingLevel).toBe(4);
  });

  it('accident chance matches skill level table — L5 (2%)', () => {
    const registry = createRegistry({ skillValue: 80 }); // level 5
    const result = checkRainAccident(registry, true, () => 0.01);
    expect(result.accident).toBe(true);
    expect(result.cyclingLevel).toBe(5);
  });

  it('L5 safe when roll is above 2%', () => {
    const registry = createRegistry({ skillValue: 80 }); // level 5
    const result = checkRainAccident(registry, true, () => 0.03);
    expect(result.accident).toBe(false);
  });

  it('statistical test: rain accidents fire close to expected rate', () => {
    const registry = createRegistry({ skillValue: 0 }); // level 1 = 10%
    let accidents = 0;
    const TRIALS = 10000;
    for (let i = 0; i < TRIALS; i++) {
      // Reset XP to avoid floor clamping issues
      registry.set(RK.PLAYER_XP, 0);
      const r = checkRainAccident(registry, true);
      if (r.accident) accidents++;
    }
    const rate = accidents / TRIALS;
    // Allow ±3% tolerance around the 10% target
    expect(rate).toBeGreaterThan(0.07);
    expect(rate).toBeLessThan(0.13);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeBikeTrip
// ─────────────────────────────────────────────────────────────────────────────

describe('completeBikeTrip', () => {
  it('grants BIKE_TRIP_XP_BASE (+10) by default', () => {
    const registry = createRegistry();
    const result = completeBikeTrip(registry);
    expect(registry.get(RK.PLAYER_XP)).toBe(BIKE_TRIP_XP_BASE);
    expect(result.xp).toBe(BIKE_TRIP_XP_BASE);
  });

  it('increments cycling skill', () => {
    const registry = createRegistry({ skillValue: 0 });
    completeBikeTrip(registry);
    expect(registry.get(RK.SKILL_CYCLING)).toBe(CYCLING_SKILL_INCREMENT);
  });

  it('returns skill result', () => {
    const registry = createRegistry({ skillValue: 0 });
    const result = completeBikeTrip(registry);
    expect(result.skillResult).toBeDefined();
    expect(result.skillResult.newValue).toBe(CYCLING_SKILL_INCREMENT);
  });

  it('clamps xpAmount to BIKE_TRIP_XP_MAX', () => {
    const registry = createRegistry();
    const result = completeBikeTrip(registry, 999);
    expect(result.xp).toBe(BIKE_TRIP_XP_MAX);
    expect(registry.get(RK.PLAYER_XP)).toBe(BIKE_TRIP_XP_MAX);
  });

  it('clamps xpAmount to BIKE_TRIP_XP_BASE minimum', () => {
    const registry = createRegistry();
    const result = completeBikeTrip(registry, 1); // below minimum
    expect(result.xp).toBe(BIKE_TRIP_XP_BASE);
  });

  it('accepts custom xpAmount within range', () => {
    const registry = createRegistry();
    const result = completeBikeTrip(registry, 15);
    expect(result.xp).toBe(15);
    expect(registry.get(RK.PLAYER_XP)).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// parkBike
// ─────────────────────────────────────────────────────────────────────────────

describe('parkBike', () => {
  it('dismounts the bike', () => {
    const registry = createRegistry({ hasBike: true });
    registry.set(RK.BIKE_MOUNTED, true);
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_BIKE);
    parkBike(registry, { lockQuality: 3 }, () => 1.0); // no theft
    expect(registry.get(RK.BIKE_MOUNTED)).toBe(false);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_WALK);
  });

  it('marks bike as stolen when theft roll fires', () => {
    const registry = createRegistry({ hasBike: true });
    // lockQuality 1 = 15% theft; force roll to 0.0 (< 0.15)
    const result = parkBike(registry, { lockQuality: 1 }, () => 0.0);
    expect(result.stolen).toBe(true);
    expect(registry.get(RK.HAS_BIKE)).toBe(false);
  });

  it('bike survives when theft roll does not fire', () => {
    const registry = createRegistry({ hasBike: true });
    const result = parkBike(registry, { lockQuality: 1 }, () => 0.99);
    expect(result.stolen).toBe(false);
    expect(registry.get(RK.HAS_BIKE)).toBe(true);
  });

  it('defaults to legalParking=true', () => {
    const registry = createRegistry({ hasBike: true });
    const result = parkBike(registry, {}, () => 1.0);
    expect(result.legalParking).toBe(true);
  });

  it('heavy lock (quality 3) has lower theft chance', () => {
    const registry = createRegistry({ hasBike: true });
    // lockQuality 3 = 2% theft; roll at 0.03 should NOT trigger theft
    const result = parkBike(registry, { lockQuality: 3 }, () => 0.03);
    expect(result.stolen).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: mount → ride → signal → park → skill increments
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — mount → ride → signal → park → skill increments', () => {
  it('full successful bike trip flow', () => {
    const registry = createRegistry({ hasBike: true, hasLights: true });
    registry.set(RK.TIME_OF_DAY, PERIOD_MORNING);

    // 1. Mount bike
    const mountResult = mountBike(registry);
    expect(mountResult.success).toBe(true);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_BIKE);

    // 2. Signal correctly at a turn
    const signalResult = checkSignal(registry, true);
    expect(signalResult.xp).toBe(SIGNAL_SUCCESS_XP);
    expect(registry.get(RK.PLAYER_XP)).toBe(SIGNAL_SUCCESS_XP);

    // 3. Complete the trip (grants XP + increments skill)
    const tripResult = completeBikeTrip(registry);
    expect(registry.get(RK.PLAYER_XP)).toBe(SIGNAL_SUCCESS_XP + BIKE_TRIP_XP_BASE);
    expect(registry.get(RK.SKILL_CYCLING)).toBe(CYCLING_SKILL_INCREMENT);

    // 4. Park safely
    const parkResult = parkBike(registry, { lockQuality: 3 }, () => 1.0);
    expect(parkResult.stolen).toBe(false);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_WALK);

    // 5. Skill incremented
    expect(tripResult.skillResult.newValue).toBe(CYCLING_SKILL_INCREMENT);
  });

  it('bike in rain with low skill causes accident', () => {
    const registry = createRegistry({ hasBike: true, skillValue: 0 }); // skill level 1

    mountBike(registry);

    // Force accident
    const accidentResult = checkRainAccident(registry, true, () => 0.05);
    expect(accidentResult.accident).toBe(true);
    expect(registry.get(RK.PLAYER_XP)).toBe(-ACCIDENT_XP);
  });

  it('high-skill rider survives rain', () => {
    const registry = createRegistry({ hasBike: true, skillValue: 80 }); // skill level 5

    mountBike(registry);

    // Roll above 2% threshold → no accident
    const accidentResult = checkRainAccident(registry, true, () => 0.03);
    expect(accidentResult.accident).toBe(false);
  });
});
