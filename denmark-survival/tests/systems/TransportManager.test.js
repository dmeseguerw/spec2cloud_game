/**
 * tests/systems/TransportManager.test.js
 * Unit and integration tests for TransportManager.
 * Coverage target: ≥85% of src/systems/TransportManager.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  getTransportMode,
  setTransportMode,
  getSpeedMultiplier,
  completeWalkingTrip,
  TRANSPORT_WALK,
  TRANSPORT_BIKE,
  TRANSPORT_METRO,
  ALL_TRANSPORT_MODES,
  SPEED_MULTIPLIERS,
  WALK_TRIP_XP,
  FIRST_VISIT_XP,
} from '../../src/systems/TransportManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { TRANSPORT_MODE_CHANGED, XP_CHANGED } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry() {
  const registry = new MockRegistry();
  registry.set(RK.PLAYER_XP,    0);
  registry.set(RK.PLAYER_LEVEL, 1);
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Mode constants
// ─────────────────────────────────────────────────────────────────────────────

describe('Transport mode constants', () => {
  it('TRANSPORT_WALK is walk', () => {
    expect(TRANSPORT_WALK).toBe('walk');
  });

  it('TRANSPORT_BIKE is bike', () => {
    expect(TRANSPORT_BIKE).toBe('bike');
  });

  it('TRANSPORT_METRO is metro', () => {
    expect(TRANSPORT_METRO).toBe('metro');
  });

  it('ALL_TRANSPORT_MODES contains all three modes', () => {
    expect(ALL_TRANSPORT_MODES).toContain(TRANSPORT_WALK);
    expect(ALL_TRANSPORT_MODES).toContain(TRANSPORT_BIKE);
    expect(ALL_TRANSPORT_MODES).toContain(TRANSPORT_METRO);
    expect(ALL_TRANSPORT_MODES).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Speed multipliers
// ─────────────────────────────────────────────────────────────────────────────

describe('Speed multipliers', () => {
  it('walking speed multiplier is 1.0', () => {
    expect(SPEED_MULTIPLIERS[TRANSPORT_WALK]).toBe(1.0);
  });

  it('biking speed multiplier is 2.5', () => {
    expect(SPEED_MULTIPLIERS[TRANSPORT_BIKE]).toBe(2.5);
  });

  it('metro speed multiplier is null (instant)', () => {
    expect(SPEED_MULTIPLIERS[TRANSPORT_METRO]).toBeNull();
  });

  it('getSpeedMultiplier returns 1.0 for walking mode', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_WALK);
    expect(getSpeedMultiplier(registry)).toBe(1.0);
  });

  it('getSpeedMultiplier returns 2.5 for biking mode', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_BIKE);
    expect(getSpeedMultiplier(registry)).toBe(2.5);
  });

  it('getSpeedMultiplier returns null for metro mode', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_METRO);
    expect(getSpeedMultiplier(registry)).toBeNull();
  });

  it('getSpeedMultiplier accepts explicit mode override', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_WALK);
    expect(getSpeedMultiplier(registry, TRANSPORT_BIKE)).toBe(2.5);
  });

  it('getSpeedMultiplier defaults to 1.0 for unknown mode', () => {
    const registry = createRegistry();
    expect(getSpeedMultiplier(registry, 'unknown')).toBe(1.0);
  });

  it('getSpeedMultiplier defaults to walking (1.0) when transport_mode not set', () => {
    const registry = new MockRegistry();
    expect(getSpeedMultiplier(registry)).toBe(1.0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getTransportMode
// ─────────────────────────────────────────────────────────────────────────────

describe('getTransportMode', () => {
  it('defaults to TRANSPORT_WALK when not set', () => {
    const registry = new MockRegistry();
    expect(getTransportMode(registry)).toBe(TRANSPORT_WALK);
  });

  it('returns the currently set mode', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_BIKE);
    expect(getTransportMode(registry)).toBe(TRANSPORT_BIKE);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// setTransportMode
// ─────────────────────────────────────────────────────────────────────────────

describe('setTransportMode', () => {
  it('sets the transport mode in the registry', () => {
    const registry = createRegistry();
    setTransportMode(registry, TRANSPORT_BIKE);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_BIKE);
  });

  it('emits TRANSPORT_MODE_CHANGED when mode changes', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_WALK);
    const handler = vi.fn();
    registry.events.on(TRANSPORT_MODE_CHANGED, handler);

    setTransportMode(registry, TRANSPORT_BIKE);

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.previous).toBe(TRANSPORT_WALK);
    expect(payload.current).toBe(TRANSPORT_BIKE);
  });

  it('does NOT emit TRANSPORT_MODE_CHANGED when mode is unchanged', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_BIKE);
    const handler = vi.fn();
    registry.events.on(TRANSPORT_MODE_CHANGED, handler);

    setTransportMode(registry, TRANSPORT_BIKE);

    expect(handler).not.toHaveBeenCalled();
  });

  it('returns true for valid modes', () => {
    const registry = createRegistry();
    expect(setTransportMode(registry, TRANSPORT_WALK)).toBe(true);
    expect(setTransportMode(registry, TRANSPORT_BIKE)).toBe(true);
    expect(setTransportMode(registry, TRANSPORT_METRO)).toBe(true);
  });

  it('returns false for invalid mode', () => {
    const registry = createRegistry();
    expect(setTransportMode(registry, 'helicopter')).toBe(false);
  });

  it('does not change mode for invalid mode string', () => {
    const registry = createRegistry();
    registry.set(RK.TRANSPORT_MODE, TRANSPORT_WALK);
    setTransportMode(registry, 'invalid');
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_WALK);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// completeWalkingTrip
// ─────────────────────────────────────────────────────────────────────────────

describe('completeWalkingTrip', () => {
  it('grants WALK_TRIP_XP (+5)', () => {
    const registry = createRegistry();
    completeWalkingTrip(registry);
    expect(registry.get(RK.PLAYER_XP)).toBe(WALK_TRIP_XP);
  });

  it('returns correct result shape', () => {
    const registry = createRegistry();
    const result = completeWalkingTrip(registry);
    expect(result).toMatchObject({ xpGranted: WALK_TRIP_XP, firstVisit: false });
  });

  it('grants first-visit bonus (+5) on new location', () => {
    const registry = createRegistry();
    const result = completeWalkingTrip(registry, 'nørreport');
    expect(registry.get(RK.PLAYER_XP)).toBe(WALK_TRIP_XP + FIRST_VISIT_XP);
    expect(result.firstVisit).toBe(true);
  });

  it('does NOT grant first-visit bonus for already-visited location', () => {
    const registry = createRegistry();
    completeWalkingTrip(registry, 'nørreport');       // first visit
    registry.set(RK.PLAYER_XP, 0);                    // reset XP counter
    const result = completeWalkingTrip(registry, 'nørreport'); // second visit
    expect(registry.get(RK.PLAYER_XP)).toBe(WALK_TRIP_XP);    // only base XP
    expect(result.firstVisit).toBe(false);
  });

  it('records visited locations in registry', () => {
    const registry = createRegistry();
    completeWalkingTrip(registry, 'nørreport');
    completeWalkingTrip(registry, 'christianshavn');
    const visited = registry.get(RK.VISITED_LOCATIONS);
    expect(visited).toContain('nørreport');
    expect(visited).toContain('christianshavn');
  });

  it('emits XP_CHANGED events', () => {
    const registry = createRegistry();
    const handler = vi.fn();
    registry.events.on(XP_CHANGED, handler);
    completeWalkingTrip(registry, 'new_area');
    expect(handler).toHaveBeenCalledTimes(2); // base + first-visit
  });

  it('works without locationId (no first-visit check)', () => {
    const registry = createRegistry();
    const result = completeWalkingTrip(registry);
    expect(result.firstVisit).toBe(false);
    expect(registry.get(RK.PLAYER_XP)).toBe(WALK_TRIP_XP);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: mode switching sequence
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — transport mode switching', () => {
  it('can cycle through all three modes', () => {
    const registry = createRegistry();
    setTransportMode(registry, TRANSPORT_WALK);
    expect(getTransportMode(registry)).toBe(TRANSPORT_WALK);
    setTransportMode(registry, TRANSPORT_BIKE);
    expect(getTransportMode(registry)).toBe(TRANSPORT_BIKE);
    setTransportMode(registry, TRANSPORT_METRO);
    expect(getTransportMode(registry)).toBe(TRANSPORT_METRO);
    setTransportMode(registry, TRANSPORT_WALK);
    expect(getTransportMode(registry)).toBe(TRANSPORT_WALK);
  });

  it('each mode has the correct speed multiplier', () => {
    const registry = createRegistry();
    setTransportMode(registry, TRANSPORT_WALK);
    expect(getSpeedMultiplier(registry)).toBe(1.0);
    setTransportMode(registry, TRANSPORT_BIKE);
    expect(getSpeedMultiplier(registry)).toBe(2.5);
    setTransportMode(registry, TRANSPORT_METRO);
    expect(getSpeedMultiplier(registry)).toBeNull();
  });

  it('walking trip accumulates XP over multiple trips', () => {
    const registry = createRegistry();
    completeWalkingTrip(registry);
    completeWalkingTrip(registry);
    completeWalkingTrip(registry);
    expect(registry.get(RK.PLAYER_XP)).toBe(WALK_TRIP_XP * 3);
  });
});
