/**
 * tests/systems/BillManager.test.js
 * Unit and integration tests for BillManager.
 * Coverage target: ≥85% of src/systems/BillManager.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  BILL_TYPES,
  BILLING_MONTH_DAYS,
  BILL_ARRIVAL_DAYS_BEFORE_DUE,
  BILL_STATUS_PENDING,
  BILL_STATUS_PAID,
  BILL_STATUS_OVERDUE,
  getDayOfMonth,
  getBillingMonth,
  getBills,
  getBillById,
  generateBill,
  checkBillArrivals,
  payBill,
  processOverdueBills,
  onDayAdvance,
  getPendingBills,
  getTotalOwed,
  allBillsPaidUpTo,
} from '../../src/systems/BillManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { BILL_RECEIVED, BILL_PAID, BILL_OVERDUE } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(options = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,   options.day    ?? 1);
  r.set(RK.PLAYER_XP,     options.xp     ?? 100);
  r.set(RK.PLAYER_LEVEL,  options.level  ?? 1);
  r.set(RK.PLAYER_MONEY,  options.money  ?? 20000);
  if (options.bills !== undefined) r.set(RK.PENDING_BILLS, options.bills);
  return r;
}

/** Build a bill manually for testing. */
function makeBill(overrides = {}) {
  return {
    id:         overrides.id         ?? 'rent_month0',
    type:       overrides.type       ?? 'rent',
    label:      overrides.label      ?? 'Husleje (Rent)',
    amount:     overrides.amount     ?? 7000,
    dueDay:     overrides.dueDay     ?? 1,
    arrivedDay: overrides.arrivedDay ?? 1,
    status:     overrides.status     ?? BILL_STATUS_PENDING,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BILL_TYPES constant
// ─────────────────────────────────────────────────────────────────────────────

describe('BILL_TYPES — definitions', () => {
  it('defines all four required bill types', () => {
    expect(BILL_TYPES).toHaveProperty('rent');
    expect(BILL_TYPES).toHaveProperty('utilities');
    expect(BILL_TYPES).toHaveProperty('phone');
    expect(BILL_TYPES).toHaveProperty('akasse');
  });

  it('each bill type has required fields', () => {
    for (const [key, def] of Object.entries(BILL_TYPES)) {
      expect(def.type,            `${key} missing type`).toBeTruthy();
      expect(def.label,           `${key} missing label`).toBeTruthy();
      expect(def.minAmount,       `${key} missing minAmount`).toBeGreaterThan(0);
      expect(def.maxAmount,       `${key} missing maxAmount`).toBeGreaterThanOrEqual(def.minAmount);
      expect(def.dueDayOfMonth,   `${key} missing dueDayOfMonth`).toBeGreaterThan(0);
      expect(def.latePenaltyXP,   `${key} missing latePenaltyXP`).toBeGreaterThan(0);
    }
  });

  it('rent has the highest on-time XP reward', () => {
    expect(BILL_TYPES.rent.onTimXP).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getDayOfMonth / getBillingMonth
// ─────────────────────────────────────────────────────────────────────────────

describe('getDayOfMonth', () => {
  it('day 1 → day-of-month 1', () => expect(getDayOfMonth(1)).toBe(1));
  it('day 28 → day-of-month 28', () => expect(getDayOfMonth(28)).toBe(28));
  it('day 29 → day-of-month 1 (new month)', () => expect(getDayOfMonth(29)).toBe(1));
  it('day 56 → day-of-month 28', () => expect(getDayOfMonth(56)).toBe(28));
});

describe('getBillingMonth', () => {
  it('days 1-28 → month 0', () => {
    expect(getBillingMonth(1)).toBe(0);
    expect(getBillingMonth(28)).toBe(0);
  });
  it('days 29-56 → month 1', () => {
    expect(getBillingMonth(29)).toBe(1);
    expect(getBillingMonth(56)).toBe(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getBills / getBillById
// ─────────────────────────────────────────────────────────────────────────────

describe('getBills', () => {
  it('returns empty array when no bills', () => {
    const registry = makeRegistry();
    expect(getBills(registry)).toEqual([]);
  });

  it('returns existing bills array', () => {
    const bill = makeBill();
    const registry = makeRegistry({ bills: [bill] });
    expect(getBills(registry)).toHaveLength(1);
  });
});

describe('getBillById', () => {
  it('returns null for missing id', () => {
    expect(getBillById(makeRegistry(), 'nope')).toBeNull();
  });
  it('finds existing bill', () => {
    const bill = makeBill({ id: 'rent_month0' });
    const registry = makeRegistry({ bills: [bill] });
    expect(getBillById(registry, 'rent_month0')).toMatchObject({ id: 'rent_month0' });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// generateBill
// ─────────────────────────────────────────────────────────────────────────────

describe('generateBill', () => {
  it('creates a rent bill for month 0', () => {
    const registry = makeRegistry();
    const bill = generateBill(registry, 'rent', 0);
    expect(bill).not.toBeNull();
    expect(bill.type).toBe('rent');
    expect(bill.amount).toBeGreaterThanOrEqual(BILL_TYPES.rent.minAmount);
    expect(bill.amount).toBeLessThanOrEqual(BILL_TYPES.rent.maxAmount);
    expect(bill.dueDay).toBe(1); // month 0, due day 1
    expect(bill.arrivedDay).toBe(1 - BILL_ARRIVAL_DAYS_BEFORE_DUE);
  });

  it('creates a utilities bill for month 0', () => {
    const registry = makeRegistry();
    const bill = generateBill(registry, 'utilities', 0);
    expect(bill).not.toBeNull();
    expect(bill.dueDay).toBe(15); // month 0, due day 15
  });

  it('creates a phone bill for month 0', () => {
    const registry = makeRegistry();
    const bill = generateBill(registry, 'phone', 0);
    expect(bill).not.toBeNull();
    expect(bill.dueDay).toBe(20);
  });

  it('creates an akasse bill for month 0', () => {
    const registry = makeRegistry();
    const bill = generateBill(registry, 'akasse', 0);
    expect(bill).not.toBeNull();
    expect(bill.dueDay).toBe(7);
  });

  it('does NOT create duplicate bill', () => {
    const registry = makeRegistry();
    generateBill(registry, 'rent', 0);
    const duplicate = generateBill(registry, 'rent', 0);
    expect(duplicate).toBeNull();
    expect(getBills(registry)).toHaveLength(1);
  });

  it('returns null for unknown bill type', () => {
    const registry = makeRegistry();
    expect(generateBill(registry, 'unknown_type', 0)).toBeNull();
  });

  it('generates bills for month 1 with correct due days', () => {
    const registry = makeRegistry();
    const bill = generateBill(registry, 'rent', 1);
    expect(bill.dueDay).toBe(1 * BILLING_MONTH_DAYS + 1); // 29
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkBillArrivals
// ─────────────────────────────────────────────────────────────────────────────

describe('checkBillArrivals', () => {
  it('emits BILL_RECEIVED when a bill arrives', () => {
    // Utilities due on day 15, arrives on day 10
    const registry = makeRegistry({ day: 10 });
    const listener = vi.fn();
    registry.events.on(BILL_RECEIVED, listener);
    const arrived = checkBillArrivals(registry, 10);
    const utilBill = arrived.find(b => b.type === 'utilities');
    expect(utilBill).toBeDefined();
    expect(listener).toHaveBeenCalled();
  });

  it('does not create the same bill twice', () => {
    const registry = makeRegistry({ day: 10 });
    checkBillArrivals(registry, 10);
    checkBillArrivals(registry, 10); // second call
    const bills = getBills(registry).filter(b => b.type === 'utilities');
    expect(bills).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// payBill
// ─────────────────────────────────────────────────────────────────────────────

describe('payBill', () => {
  it('pays a pending bill and deducts money', () => {
    const bill = makeBill({ amount: 7500, status: BILL_STATUS_PENDING });
    const registry = makeRegistry({ bills: [bill], money: 10000 });
    const result = payBill(registry, bill.id);
    expect(result.success).toBe(true);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(2500);
    const updatedBill = getBillById(registry, bill.id);
    expect(updatedBill.status).toBe(BILL_STATUS_PAID);
  });

  it('grants XP for on-time rent payment', () => {
    const bill = makeBill({ type: 'rent', amount: 7000 });
    const registry = makeRegistry({ bills: [bill], xp: 50 });
    const result = payBill(registry, bill.id);
    expect(result.xpChange).toBe(15);
    expect(registry.get(RK.PLAYER_XP)).toBe(65);
  });

  it('grants XP for on-time utilities payment', () => {
    const bill = makeBill({ id: 'utilities_m0', type: 'utilities', amount: 1000 });
    const registry = makeRegistry({ bills: [bill], xp: 50 });
    const result = payBill(registry, bill.id);
    expect(result.xpChange).toBe(10);
  });

  it('applies late penalty XP for overdue bills', () => {
    const bill = makeBill({ type: 'rent', amount: 7000, status: BILL_STATUS_OVERDUE });
    const registry = makeRegistry({ bills: [bill], xp: 100 });
    const result = payBill(registry, bill.id);
    expect(result.xpChange).toBe(-30);
    expect(registry.get(RK.PLAYER_XP)).toBe(70);
  });

  it('applies late penalty for overdue phone bill', () => {
    const bill = makeBill({ id: 'phone_m0', type: 'phone', amount: 300, status: BILL_STATUS_OVERDUE });
    const registry = makeRegistry({ bills: [bill], xp: 100 });
    const result = payBill(registry, bill.id);
    expect(result.xpChange).toBe(-10);
  });

  it('returns failure when bill not found', () => {
    const registry = makeRegistry();
    const result = payBill(registry, 'nonexistent');
    expect(result.success).toBe(false);
    expect(result.reason).toBe('bill_not_found');
  });

  it('returns failure when insufficient funds', () => {
    const bill = makeBill({ amount: 9000 });
    const registry = makeRegistry({ bills: [bill], money: 500 });
    const result = payBill(registry, bill.id);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_funds');
    expect(registry.get(RK.PLAYER_MONEY)).toBe(500);
    expect(getBillById(registry, bill.id).status).toBe(BILL_STATUS_PENDING);
  });

  it('returns failure when bill already paid', () => {
    const bill = makeBill({ status: BILL_STATUS_PAID });
    const registry = makeRegistry({ bills: [bill] });
    const result = payBill(registry, bill.id);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('already_paid');
  });

  it('emits BILL_PAID event', () => {
    const bill = makeBill({ amount: 5000 });
    const registry = makeRegistry({ bills: [bill], money: 10000 });
    const listener = vi.fn();
    registry.events.on(BILL_PAID, listener);
    payBill(registry, bill.id);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].xpChange).toBe(15);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// processOverdueBills
// ─────────────────────────────────────────────────────────────────────────────

describe('processOverdueBills', () => {
  it('marks pending bill as overdue on the day after due date', () => {
    const bill = makeBill({ dueDay: 5, status: BILL_STATUS_PENDING });
    const registry = makeRegistry({ bills: [bill] });
    const overdue = processOverdueBills(registry, 6);
    expect(overdue).toHaveLength(1);
    expect(getBillById(registry, bill.id).status).toBe(BILL_STATUS_OVERDUE);
  });

  it('does not mark paid bill as overdue', () => {
    const bill = makeBill({ dueDay: 5, status: BILL_STATUS_PAID });
    const registry = makeRegistry({ bills: [bill] });
    const overdue = processOverdueBills(registry, 6);
    expect(overdue).toHaveLength(0);
  });

  it('does not affect bills not yet due', () => {
    const bill = makeBill({ dueDay: 10, status: BILL_STATUS_PENDING });
    const registry = makeRegistry({ bills: [bill] });
    const overdue = processOverdueBills(registry, 9);
    expect(overdue).toHaveLength(0);
    expect(getBillById(registry, bill.id).status).toBe(BILL_STATUS_PENDING);
  });

  it('emits BILL_OVERDUE event', () => {
    const bill = makeBill({ dueDay: 5, status: BILL_STATUS_PENDING });
    const registry = makeRegistry({ bills: [bill] });
    const listener = vi.fn();
    registry.events.on(BILL_OVERDUE, listener);
    processOverdueBills(registry, 6);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('late penalty applied when overdue bill is then paid', () => {
    const bill = makeBill({ type: 'rent', amount: 7000, status: BILL_STATUS_PENDING, dueDay: 5 });
    const registry = makeRegistry({ bills: [bill], money: 20000, xp: 100 });

    // Advance past due date → mark overdue
    processOverdueBills(registry, 6);
    expect(getBillById(registry, bill.id).status).toBe(BILL_STATUS_OVERDUE);

    // Pay overdue bill → penalty applied
    const result = payBill(registry, bill.id);
    expect(result.success).toBe(true);
    expect(result.xpChange).toBe(-30);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getPendingBills / getTotalOwed / allBillsPaidUpTo
// ─────────────────────────────────────────────────────────────────────────────

describe('getPendingBills', () => {
  it('returns only unpaid bills', () => {
    const bills = [
      makeBill({ id: 'a', status: BILL_STATUS_PENDING }),
      makeBill({ id: 'b', status: BILL_STATUS_PAID }),
      makeBill({ id: 'c', status: BILL_STATUS_OVERDUE }),
    ];
    const registry = makeRegistry({ bills });
    const pending = getPendingBills(registry);
    expect(pending).toHaveLength(2);
    expect(pending.map(b => b.id)).not.toContain('b');
  });
});

describe('getTotalOwed', () => {
  it('sums pending bill amounts', () => {
    const bills = [
      makeBill({ id: 'a', amount: 1000, status: BILL_STATUS_PENDING }),
      makeBill({ id: 'b', amount: 500,  status: BILL_STATUS_OVERDUE }),
      makeBill({ id: 'c', amount: 200,  status: BILL_STATUS_PAID }),
    ];
    const registry = makeRegistry({ bills });
    expect(getTotalOwed(registry)).toBe(1500);
  });
});

describe('allBillsPaidUpTo', () => {
  it('returns true when all bills up to day are paid', () => {
    const bills = [
      makeBill({ id: 'a', dueDay: 10, status: BILL_STATUS_PAID }),
      makeBill({ id: 'b', dueDay: 15, status: BILL_STATUS_PAID }),
    ];
    const registry = makeRegistry({ bills });
    expect(allBillsPaidUpTo(registry, 15)).toBe(true);
  });

  it('returns false when a bill is unpaid', () => {
    const bills = [
      makeBill({ id: 'a', dueDay: 10, status: BILL_STATUS_PAID }),
      makeBill({ id: 'b', dueDay: 15, status: BILL_STATUS_PENDING }),
    ];
    const registry = makeRegistry({ bills });
    expect(allBillsPaidUpTo(registry, 15)).toBe(false);
  });

  it('ignores bills with due date after upToDay', () => {
    const bills = [
      makeBill({ id: 'a', dueDay: 10, status: BILL_STATUS_PAID }),
      makeBill({ id: 'b', dueDay: 30, status: BILL_STATUS_PENDING }), // future bill
    ];
    const registry = makeRegistry({ bills });
    expect(allBillsPaidUpTo(registry, 15)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// onDayAdvance
// ─────────────────────────────────────────────────────────────────────────────

describe('onDayAdvance', () => {
  it('returns arrivals and overdue arrays', () => {
    const registry = makeRegistry({ day: 10 });
    const result = onDayAdvance(registry, 10);
    expect(Array.isArray(result.arrivals)).toBe(true);
    expect(Array.isArray(result.overdue)).toBe(true);
  });

  it('processes both arrivals and overdue on same day', () => {
    const bill = makeBill({ dueDay: 9, status: BILL_STATUS_PENDING });
    const registry = makeRegistry({ bills: [bill], day: 10 });
    const result = onDayAdvance(registry, 10);
    // Bill is now overdue
    expect(result.overdue).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: Full bill cycle
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — full bill cycle', () => {
  it('bill arrives → notification → pay → XP reward', () => {
    const registry = makeRegistry({ money: 20000, xp: 50 });
    const receivedListener = vi.fn();
    const paidListener = vi.fn();
    registry.events.on(BILL_RECEIVED, receivedListener);
    registry.events.on(BILL_PAID, paidListener);

    // Day 10: utilities bill arrives (due day 15, arrives day 10)
    const arrivals = checkBillArrivals(registry, 10);
    const utilBill = arrivals.find(b => b.type === 'utilities');
    expect(utilBill).toBeDefined();
    expect(receivedListener).toHaveBeenCalled();

    // Pay before due date → XP reward
    const result = payBill(registry, utilBill.id);
    expect(result.success).toBe(true);
    expect(result.xpChange).toBe(10);
    expect(paidListener).toHaveBeenCalledOnce();
    expect(getBillById(registry, utilBill.id).status).toBe(BILL_STATUS_PAID);
  });

  it('bill becomes overdue → late penalty on payment', () => {
    const registry = makeRegistry({ money: 20000, xp: 100 });
    // Create akasse bill that is past due
    generateBill(registry, 'akasse', 0); // due day 7
    const bill = getBills(registry)[0];

    // Advance past due date
    processOverdueBills(registry, 8);
    expect(getBillById(registry, bill.id).status).toBe(BILL_STATUS_OVERDUE);

    // Pay with penalty
    const result = payBill(registry, bill.id);
    expect(result.success).toBe(true);
    expect(result.xpChange).toBe(-20); // akasse late penalty
  });
});
