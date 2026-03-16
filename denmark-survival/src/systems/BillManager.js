/**
 * src/systems/BillManager.js
 * Manages recurring bills: generation, notification, payment, and late penalties.
 *
 * Bills are stored in the registry under PENDING_BILLS as an array of objects:
 *   { id, type, amount, dueDay, status, arrivedDay }
 *
 * Bill schedule (relative to the monthly cycle using day-of-month = ((day - 1) % 28) + 1):
 *   Rent          6,000–10,000 DKK  due on day  1 of each 28-day month  -30 XP if late
 *   Utilities       800–1,200 DKK   due on day 15 of each 28-day month  -15 XP if late
 *   Phone/Internet  200–400  DKK    due on day 20 of each 28-day month  -10 XP if late
 *   A-kasse         300–500  DKK    due on day  7 of each 28-day month  -20 XP if late
 *
 * Bills arrive (notification) 5 days before due date.
 * On-time payment: +15 XP (rent), +10 XP (others).
 * Late payment: XP penalty applied, bill can still be paid.
 *
 * Emits: BILL_RECEIVED, BILL_PAID, BILL_OVERDUE
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  BILL_RECEIVED,
  BILL_PAID,
  BILL_OVERDUE,
} from '../constants/Events.js';
import { grantXP, penalizeXP } from './XPEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// Bill type definitions
// ─────────────────────────────────────────────────────────────────────────────

/** Number of in-game days in one billing month. */
export const BILLING_MONTH_DAYS = 28;

/** How many days before due date the bill arrives (notification). */
export const BILL_ARRIVAL_DAYS_BEFORE_DUE = 5;

/** Bill status constants. */
export const BILL_STATUS_PENDING  = 'pending';
export const BILL_STATUS_PAID     = 'paid';
export const BILL_STATUS_OVERDUE  = 'overdue';

/**
 * Bill type definitions with schedule information.
 * dueDayOfMonth is the day-of-month (1-based) the bill is due.
 */
export const BILL_TYPES = {
  rent: {
    type:           'rent',
    label:          'Husleje (Rent)',
    minAmount:      6000,
    maxAmount:      10000,
    dueDayOfMonth:  1,
    onTimXP:        15,
    latePenaltyXP:  30,
  },
  utilities: {
    type:           'utilities',
    label:          'Utilities',
    minAmount:      800,
    maxAmount:      1200,
    dueDayOfMonth:  15,
    onTimXP:        10,
    latePenaltyXP:  15,
  },
  phone: {
    type:           'phone',
    label:          'Phone / Internet',
    minAmount:      200,
    maxAmount:      400,
    dueDayOfMonth:  20,
    onTimXP:        10,
    latePenaltyXP:  10,
  },
  akasse: {
    type:           'akasse',
    label:          'A-kasse',
    minAmount:      300,
    maxAmount:      500,
    dueDayOfMonth:  7,
    onTimXP:        10,
    latePenaltyXP:  20,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the day-of-month (1–28) for an absolute in-game day number.
 *
 * @param {number} day - Absolute in-game day (1-based).
 * @returns {number} 1–28
 */
export function getDayOfMonth(day) {
  return ((day - 1) % BILLING_MONTH_DAYS) + 1;
}

/**
 * Return the billing month index (0-based) for an absolute day.
 *
 * @param {number} day
 * @returns {number}
 */
export function getBillingMonth(day) {
  return Math.floor((day - 1) / BILLING_MONTH_DAYS);
}

/**
 * Generate a random amount between min and max (inclusive).
 *
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function _randomAmount(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Build a unique bill ID.
 *
 * @param {string} type
 * @param {number} month - Billing month index.
 * @returns {string}
 */
function _billId(type, month) {
  return `${type}_month${month}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill generation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get all bills currently stored in the registry.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>}
 */
export function getBills(registry) {
  return registry.get(RK.PENDING_BILLS) ?? [];
}

/**
 * Get a single bill by id.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} billId
 * @returns {object|null}
 */
export function getBillById(registry, billId) {
  const bills = getBills(registry);
  return bills.find(b => b.id === billId) ?? null;
}

/**
 * Generate a new bill for a given type and billing month, if it doesn't already exist.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} billType - Key in BILL_TYPES.
 * @param {number} billingMonth - Billing month index (0-based).
 * @returns {object|null} The created bill, or null if it already existed.
 */
export function generateBill(registry, billType, billingMonth) {
  const def = BILL_TYPES[billType];
  if (!def) return null;

  const id = _billId(billType, billingMonth);
  const existing = getBillById(registry, id);
  if (existing) return null;

  const amount     = _randomAmount(def.minAmount, def.maxAmount);
  const dueDay     = billingMonth * BILLING_MONTH_DAYS + def.dueDayOfMonth;
  const arrivedDay = dueDay - BILL_ARRIVAL_DAYS_BEFORE_DUE;

  const bill = {
    id,
    type:       billType,
    label:      def.label,
    amount,
    dueDay,
    arrivedDay,
    status:     BILL_STATUS_PENDING,
  };

  const bills = getBills(registry);
  registry.set(RK.PENDING_BILLS, [...bills, bill]);
  return bill;
}

/**
 * Check whether any new bills should arrive on the given day and generate them.
 * Bills arrive BILL_ARRIVAL_DAYS_BEFORE_DUE days before their due date.
 * Emits BILL_RECEIVED for each newly arrived bill.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} currentDay
 * @returns {Array<object>} Newly arrived bills.
 */
export function checkBillArrivals(registry, currentDay) {
  const arrived = [];

  for (const billType of Object.keys(BILL_TYPES)) {
    const def          = BILL_TYPES[billType];
    const billingMonth = getBillingMonth(currentDay + BILL_ARRIVAL_DAYS_BEFORE_DUE);
    const dueDay       = billingMonth * BILLING_MONTH_DAYS + def.dueDayOfMonth;
    const arrivalDay   = dueDay - BILL_ARRIVAL_DAYS_BEFORE_DUE;

    if (arrivalDay === currentDay) {
      const bill = generateBill(registry, billType, billingMonth);
      if (bill) {
        arrived.push(bill);
        registry.events.emit(BILL_RECEIVED, { bill });
      }
    }
  }

  return arrived;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill payment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Pay a bill by ID.
 *  - Deducts amount from PLAYER_MONEY.
 *  - Marks bill as paid.
 *  - Grants on-time XP if not overdue, or applies penalty if overdue.
 *  - Emits BILL_PAID.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} billId
 * @returns {{ success: boolean, reason?: string, bill?: object, xpChange: number }}
 */
export function payBill(registry, billId) {
  const bill = getBillById(registry, billId);
  if (!bill) return { success: false, reason: 'bill_not_found', xpChange: 0 };
  if (bill.status === BILL_STATUS_PAID) return { success: false, reason: 'already_paid', xpChange: 0 };

  const money = registry.get(RK.PLAYER_MONEY) ?? 0;
  if (money < bill.amount) {
    return { success: false, reason: 'insufficient_funds', xpChange: 0 };
  }

  // Deduct payment
  const newBalance = money - bill.amount;
  registry.set(RK.PLAYER_MONEY, newBalance);

  // Determine XP outcome
  const def = BILL_TYPES[bill.type] ?? {};
  let xpChange = 0;

  if (bill.status === BILL_STATUS_OVERDUE) {
    // Late payment — still penalise
    const penalty = def.latePenaltyXP ?? 10;
    penalizeXP(registry, penalty, `Late payment: ${bill.label}`, 'Economy');
    xpChange = -penalty;
  } else {
    // On-time payment — reward
    const reward = def.onTimXP ?? 10;
    grantXP(registry, reward, `Paid on time: ${bill.label}`, 'Economy');
    xpChange = reward;
  }

  // Update bill status
  const bills = getBills(registry);
  const updated = bills.map(b =>
    b.id === billId ? { ...b, status: BILL_STATUS_PAID } : b,
  );
  registry.set(RK.PENDING_BILLS, updated);

  registry.events.emit(BILL_PAID, { bill: { ...bill, status: BILL_STATUS_PAID }, xpChange, newBalance });

  return { success: true, bill: { ...bill, status: BILL_STATUS_PAID }, xpChange };
}

// ─────────────────────────────────────────────────────────────────────────────
// Overdue processing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mark any pending bills as overdue if their due date has passed.
 * Emits BILL_OVERDUE for each newly overdue bill.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} currentDay
 * @returns {Array<object>} Bills that became overdue.
 */
export function processOverdueBills(registry, currentDay) {
  const bills    = getBills(registry);
  const nowOverdue = [];

  const updated = bills.map(bill => {
    if (bill.status === BILL_STATUS_PENDING && currentDay > bill.dueDay) {
      nowOverdue.push(bill);
      return { ...bill, status: BILL_STATUS_OVERDUE };
    }
    return bill;
  });

  if (nowOverdue.length > 0) {
    registry.set(RK.PENDING_BILLS, updated);
    for (const bill of nowOverdue) {
      registry.events.emit(BILL_OVERDUE, { bill });
    }
  }

  return nowOverdue;
}

// ─────────────────────────────────────────────────────────────────────────────
// On-day-advance hook
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Call once per day advance to process bill arrivals and overdue checks.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} currentDay
 * @returns {{ arrivals: Array<object>, overdue: Array<object> }}
 */
export function onDayAdvance(registry, currentDay) {
  const arrivals = checkBillArrivals(registry, currentDay);
  const overdue  = processOverdueBills(registry, currentDay);
  return { arrivals, overdue };
}

// ─────────────────────────────────────────────────────────────────────────────
// Convenience queries
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all pending (unpaid) bills.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>}
 */
export function getPendingBills(registry) {
  return getBills(registry).filter(b => b.status !== BILL_STATUS_PAID);
}

/**
 * Return the total DKK owed for all pending bills.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {number}
 */
export function getTotalOwed(registry) {
  return getPendingBills(registry).reduce((sum, b) => sum + b.amount, 0);
}

/**
 * Return true if all bills due up to and including `upToDay` have been paid.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} upToDay
 * @returns {boolean}
 */
export function allBillsPaidUpTo(registry, upToDay) {
  const bills = getBills(registry);
  return bills
    .filter(b => b.dueDay <= upToDay)
    .every(b => b.status === BILL_STATUS_PAID);
}
