/**
 * tests/systems/MetroMechanics.test.js
 * Unit and integration tests for MetroMechanics.
 * Coverage target: ≥85% of src/systems/MetroMechanics.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  metroCheckIn,
  metroCheckOut,
  skipMetroCheckIn,
  buyMonthlyPass,
  loadRejsekort,
  getRejsekortBalance,
  METRO_FARE,
  METRO_MONTHLY_PASS_COST,
  METRO_TRIP_XP,
  METRO_SKIP_PENALTY,
  METRO_INSPECTOR_CHANCE,
  METRO_NO_TICKET_XP_PENALTY,
  METRO_NO_TICKET_DKK_FINE,
} from '../../src/systems/MetroMechanics.js';
import { TRANSPORT_WALK, TRANSPORT_METRO } from '../../src/systems/TransportManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  METRO_CHECKED_IN,
  METRO_CHECKED_OUT,
  METRO_FARE_DEDUCTED,
  METRO_INSPECTOR_ENCOUNTER,
  XP_CHANGED,
} from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function createRegistry({ balance = 100, hasPass = false, money = 1000 } = {}) {
  const registry = new MockRegistry();
  registry.set(RK.PLAYER_XP,          0);
  registry.set(RK.PLAYER_LEVEL,       1);
  registry.set(RK.PLAYER_MONEY,       money);
  registry.set(RK.REJSEKORT_BALANCE,  balance);
  registry.set(RK.METRO_MONTHLY_PASS, hasPass);
  registry.set(RK.METRO_CHECKED_IN,   false);
  return registry;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

describe('MetroMechanics constants', () => {
  it('METRO_FARE is 24 DKK', () => expect(METRO_FARE).toBe(24));
  it('METRO_MONTHLY_PASS_COST is 400 DKK', () => expect(METRO_MONTHLY_PASS_COST).toBe(400));
  it('METRO_TRIP_XP is 10', () => expect(METRO_TRIP_XP).toBe(10));
  it('METRO_SKIP_PENALTY is 30', () => expect(METRO_SKIP_PENALTY).toBe(30));
  it('METRO_INSPECTOR_CHANCE is 0.08 (8%)', () => expect(METRO_INSPECTOR_CHANCE).toBe(0.08));
  it('METRO_NO_TICKET_XP_PENALTY is 50', () => expect(METRO_NO_TICKET_XP_PENALTY).toBe(50));
  it('METRO_NO_TICKET_DKK_FINE is 500', () => expect(METRO_NO_TICKET_DKK_FINE).toBe(500));
});

// ─────────────────────────────────────────────────────────────────────────────
// metroCheckIn
// ─────────────────────────────────────────────────────────────────────────────

describe('metroCheckIn', () => {
  it('succeeds when Rejsekort has sufficient balance', () => {
    const registry = createRegistry({ balance: 100 });
    const result = metroCheckIn(registry);
    expect(result.success).toBe(true);
  });

  it('deducts METRO_FARE (24 DKK) from Rejsekort', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(76);
  });

  it('sets METRO_CHECKED_IN to true', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    expect(registry.get(RK.METRO_CHECKED_IN)).toBe(true);
  });

  it('sets transport mode to metro', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_METRO);
  });

  it('emits METRO_CHECKED_IN event', () => {
    const registry = createRegistry({ balance: 100 });
    const handler = vi.fn();
    registry.events.on(METRO_CHECKED_IN, handler);
    metroCheckIn(registry);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('emits METRO_FARE_DEDUCTED event with correct payload', () => {
    const registry = createRegistry({ balance: 100 });
    const handler = vi.fn();
    registry.events.on(METRO_FARE_DEDUCTED, handler);
    metroCheckIn(registry);
    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.amount).toBe(METRO_FARE);
    expect(payload.newBalance).toBe(76);
  });

  it('fails when Rejsekort balance is insufficient', () => {
    const registry = createRegistry({ balance: 10 });
    const result = metroCheckIn(registry);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_funds');
  });

  it('does not deduct fare when check-in fails', () => {
    const registry = createRegistry({ balance: 10 });
    metroCheckIn(registry);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(10);
  });

  it('does NOT deduct fare with monthly pass', () => {
    const registry = createRegistry({ balance: 50, hasPass: true });
    metroCheckIn(registry);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(50);
  });

  it('monthly pass allows check-in with zero balance', () => {
    const registry = createRegistry({ balance: 0, hasPass: true });
    const result = metroCheckIn(registry);
    expect(result.success).toBe(true);
    expect(result.hasPass).toBe(true);
    expect(result.fareDeducted).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// metroCheckOut
// ─────────────────────────────────────────────────────────────────────────────

describe('metroCheckOut', () => {
  it('grants METRO_TRIP_XP (+10) on valid check-out', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    metroCheckOut(registry, () => 1.0); // roll > 0.08 → no inspector
    expect(registry.get(RK.PLAYER_XP)).toBe(METRO_TRIP_XP);
  });

  it('clears METRO_CHECKED_IN on check-out', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    metroCheckOut(registry, () => 1.0);
    expect(registry.get(RK.METRO_CHECKED_IN)).toBe(false);
  });

  it('sets transport mode back to walk', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    metroCheckOut(registry, () => 1.0);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_WALK);
  });

  it('applies skip penalty when checking out without check-in', () => {
    const registry = createRegistry({ balance: 100 });
    // No metroCheckIn call → metro_checked_in = false
    const result = metroCheckOut(registry, () => 1.0);
    expect(result.skipped).toBe(true);
    expect(registry.get(RK.PLAYER_XP)).toBe(-METRO_SKIP_PENALTY);
  });

  it('returns success=false on skipped check-in', () => {
    const registry = createRegistry();
    const result = metroCheckOut(registry, () => 1.0);
    expect(result.success).toBe(false);
  });

  it('emits METRO_CHECKED_OUT event', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    const handler = vi.fn();
    registry.events.on(METRO_CHECKED_OUT, handler);
    metroCheckOut(registry, () => 1.0);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('inspector fires and applies penalties when hasTicket=false', () => {
    const registry = createRegistry({ balance: 100, money: 1000 });
    // Do NOT check in → no valid ticket
    // Force inspector roll to fire (< 0.08)
    metroCheckOut(registry, () => 0.01);
    expect(registry.get(RK.PLAYER_XP)).toBe(-METRO_SKIP_PENALTY - METRO_NO_TICKET_XP_PENALTY);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(1000 - METRO_NO_TICKET_DKK_FINE);
  });

  it('inspector fires but no penalty when hasTicket=true', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    // Force inspector roll
    const result = metroCheckOut(registry, () => 0.01);
    expect(result.inspectorEncounter).toBe(true);
    expect(result.inspectorPenalty).toBe(0);
    // Only METRO_TRIP_XP granted, no penalty
    expect(registry.get(RK.PLAYER_XP)).toBe(METRO_TRIP_XP);
  });

  it('emits METRO_INSPECTOR_ENCOUNTER on encounter', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    const handler = vi.fn();
    registry.events.on(METRO_INSPECTOR_ENCOUNTER, handler);
    metroCheckOut(registry, () => 0.01); // force inspector
    expect(handler).toHaveBeenCalledOnce();
  });

  it('no inspector encounter when roll is above 8%', () => {
    const registry = createRegistry({ balance: 100 });
    metroCheckIn(registry);
    const result = metroCheckOut(registry, () => 0.99);
    expect(result.inspectorEncounter).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// skipMetroCheckIn
// ─────────────────────────────────────────────────────────────────────────────

describe('skipMetroCheckIn', () => {
  it('applies -30 XP skip penalty', () => {
    const registry = createRegistry();
    const result = skipMetroCheckIn(registry);
    expect(registry.get(RK.PLAYER_XP)).toBe(-METRO_SKIP_PENALTY);
    expect(result.xp).toBe(-METRO_SKIP_PENALTY);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Monthly pass
// ─────────────────────────────────────────────────────────────────────────────

describe('buyMonthlyPass', () => {
  it('deducts METRO_MONTHLY_PASS_COST (400 DKK) from Rejsekort', () => {
    const registry = createRegistry({ balance: 500 });
    buyMonthlyPass(registry);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(100);
  });

  it('sets METRO_MONTHLY_PASS to true', () => {
    const registry = createRegistry({ balance: 500 });
    buyMonthlyPass(registry);
    expect(registry.get(RK.METRO_MONTHLY_PASS)).toBe(true);
  });

  it('fails when balance is insufficient', () => {
    const registry = createRegistry({ balance: 100 });
    const result = buyMonthlyPass(registry);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_funds');
  });

  it('does not modify balance on failure', () => {
    const registry = createRegistry({ balance: 100 });
    buyMonthlyPass(registry);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(100);
  });

  it('returns new balance on success', () => {
    const registry = createRegistry({ balance: 500 });
    const result = buyMonthlyPass(registry);
    expect(result.success).toBe(true);
    expect(result.balance).toBe(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Rejsekort balance management
// ─────────────────────────────────────────────────────────────────────────────

describe('loadRejsekort', () => {
  it('adds funds to Rejsekort balance', () => {
    const registry = createRegistry({ balance: 50 });
    loadRejsekort(registry, 100);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(150);
  });

  it('returns true on success', () => {
    const registry = createRegistry({ balance: 0 });
    expect(loadRejsekort(registry, 50)).toBe(true);
  });

  it('returns false for zero or negative amount', () => {
    const registry = createRegistry({ balance: 50 });
    expect(loadRejsekort(registry, 0)).toBe(false);
    expect(loadRejsekort(registry, -10)).toBe(false);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(50);
  });
});

describe('getRejsekortBalance', () => {
  it('returns current balance', () => {
    const registry = createRegistry({ balance: 75 });
    expect(getRejsekortBalance(registry)).toBe(75);
  });

  it('returns 0 when not set', () => {
    const registry = new MockRegistry();
    expect(getRejsekortBalance(registry)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Inspector statistical test
// ─────────────────────────────────────────────────────────────────────────────

describe('Inspector encounter rate', () => {
  it('fires at approximately 8% rate over many trips (statistical)', () => {
    let encounters = 0;
    const TRIALS = 10000;

    for (let i = 0; i < TRIALS; i++) {
      const registry = createRegistry({ balance: 1000, money: 10000 });
      metroCheckIn(registry);
      const result = metroCheckOut(registry);
      if (result.inspectorEncounter) encounters++;
    }

    const rate = encounters / TRIALS;
    // Allow ±3% tolerance around the 8% target
    expect(rate).toBeGreaterThan(0.05);
    expect(rate).toBeLessThan(0.11);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: enter metro → check-in → arrive → check-out → fare deducted
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — check-in → travel → check-out → fare deducted', () => {
  it('full metro trip deducts fare and grants XP', () => {
    const registry = createRegistry({ balance: 100, money: 500 });

    // 1. Check in
    const checkInResult = metroCheckIn(registry);
    expect(checkInResult.success).toBe(true);
    expect(checkInResult.fareDeducted).toBe(METRO_FARE);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(76);
    expect(registry.get(RK.METRO_CHECKED_IN)).toBe(true);

    // 2. Check out (no inspector)
    const checkOutResult = metroCheckOut(registry, () => 1.0);
    expect(checkOutResult.success).toBe(true);
    expect(registry.get(RK.PLAYER_XP)).toBe(METRO_TRIP_XP);
    expect(registry.get(RK.METRO_CHECKED_IN)).toBe(false);
    expect(registry.get(RK.TRANSPORT_MODE)).toBe(TRANSPORT_WALK);
  });

  it('monthly pass allows unlimited free rides', () => {
    const registry = createRegistry({ balance: 500, hasPass: false });

    // Buy the pass
    buyMonthlyPass(registry);
    expect(registry.get(RK.METRO_MONTHLY_PASS)).toBe(true);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(100);

    // Three rides — no additional fare deducted
    for (let i = 0; i < 3; i++) {
      const checkIn = metroCheckIn(registry);
      expect(checkIn.fareDeducted).toBe(0);
      metroCheckOut(registry, () => 1.0); // no inspector
    }

    // Balance unchanged since pass purchase
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(100);
  });

  it('no-ticket inspector encounter applies correct XP and DKK penalties', () => {
    const registry = createRegistry({ balance: 100, money: 1000 });

    // Skip check-in → check out → inspector fires → no ticket
    const result = metroCheckOut(registry, () => 0.01);

    expect(result.skipped).toBe(true);
    // Skip penalty + no-ticket penalty
    expect(registry.get(RK.PLAYER_XP)).toBe(-METRO_SKIP_PENALTY - METRO_NO_TICKET_XP_PENALTY);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(1000 - METRO_NO_TICKET_DKK_FINE);
  });

  it('multiple trips accumulate XP correctly', () => {
    const registry = createRegistry({ balance: 500 });

    metroCheckIn(registry);
    metroCheckOut(registry, () => 1.0);
    metroCheckIn(registry);
    metroCheckOut(registry, () => 1.0);
    metroCheckIn(registry);
    metroCheckOut(registry, () => 1.0);

    expect(registry.get(RK.PLAYER_XP)).toBe(METRO_TRIP_XP * 3);
    expect(registry.get(RK.REJSEKORT_BALANCE)).toBe(500 - METRO_FARE * 3);
  });
});
