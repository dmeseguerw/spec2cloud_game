/**
 * src/systems/EconomyEngine.js
 * Central financial management: salary income, tax filing, and financial XP impacts.
 *
 * Salary is paid bi-weekly (every 14 in-game days) based on the character's job.
 * Net amounts reflect ~38% Danish tax rate (player receives ~62% of gross monthly).
 * Tax filing events are triggered once per in-game "year" (every 88 days / 4 seasons).
 *
 * Financial XP events:
 *  - Overspend >80% of salary:        -15 XP
 *  - Tax filing correct:              +30 XP
 *  - Tax filing error:                -50 to -100 XP
 *
 * Emits: SALARY_RECEIVED, TAX_FILED, MONEY_CHANGED
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  SALARY_RECEIVED,
  TAX_FILED,
  MONEY_CHANGED,
} from '../constants/Events.js';
import { grantXP, penalizeXP } from './XPEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// Salary table — net bi-weekly after ~38% tax (approximately 62% of gross/2)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Net bi-weekly salary per job (DKK, after ~38% tax).
 * Gross monthly → net bi-weekly ≈ gross * 0.62 / 2
 */
export const SALARY_TABLE = {
  'IT Professional': 10850,
  'Teacher':          9300,
  'Student (SU)':     2015,
  'Chef':             8370,
  'Nurse':            9920,
  'Researcher':      11780,
  'Artist':           6200,
  'Engineer':        12400,
};

/** Salary is paid every 14 in-game days. */
export const SALARY_INTERVAL_DAYS = 14;

/** Tax filing is triggered once per in-game year (every 88 days / 4 seasons). */
export const TAX_FILING_INTERVAL_DAYS = 88;

/** XP penalty for overspending >80% of salary in one cycle. */
export const OVERSPEND_XP_PENALTY = 15;

/** Threshold: overspend triggers if >80% of salary spent in cycle. */
export const OVERSPEND_THRESHOLD = 0.8;

/** XP reward for correct tax filing. */
export const TAX_CORRECT_XP = 30;

/** XP penalty range for tax filing errors (min / max). */
export const TAX_ERROR_XP_MIN = 50;
export const TAX_ERROR_XP_MAX = 100;

// ─────────────────────────────────────────────────────────────────────────────
// Salary helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the net bi-weekly salary for a given job title.
 * Returns 0 for unknown jobs.
 *
 * @param {string} job
 * @returns {number} DKK
 */
export function getSalaryForJob(job) {
  return SALARY_TABLE[job] ?? 0;
}

/**
 * Check whether a salary payment is due on `currentDay`.
 * Salary is paid every SALARY_INTERVAL_DAYS days, counting from day 1.
 *
 * @param {number} currentDay
 * @param {number} lastSalaryDay - Day the last salary was paid (0 = never paid).
 * @returns {boolean}
 */
export function isSalaryDue(currentDay, lastSalaryDay) {
  if (lastSalaryDay === 0 || lastSalaryDay === null || lastSalaryDay === undefined) {
    // First salary due on day SALARY_INTERVAL_DAYS
    return currentDay >= SALARY_INTERVAL_DAYS;
  }
  return (currentDay - lastSalaryDay) >= SALARY_INTERVAL_DAYS;
}

/**
 * Process salary payment for the current day.
 *
 * If salary is due:
 *  - Credits PLAYER_MONEY with net salary amount.
 *  - Updates LAST_SALARY_DAY to currentDay.
 *  - Emits SALARY_RECEIVED and MONEY_CHANGED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ paid: boolean, amount: number, job: string }}
 */
export function processSalary(registry) {
  const currentDay    = registry.get(RK.CURRENT_DAY) ?? 1;
  const lastSalaryDay = registry.get(RK.LAST_SALARY_DAY) ?? 0;
  const job           = registry.get(RK.PLAYER_JOB) ?? '';

  if (!isSalaryDue(currentDay, lastSalaryDay)) {
    return { paid: false, amount: 0, job };
  }

  const amount = getSalaryForJob(job);
  const money  = registry.get(RK.PLAYER_MONEY) ?? 0;
  const newBalance = money + amount;

  registry.set(RK.PLAYER_MONEY, newBalance);
  registry.set(RK.LAST_SALARY_DAY, currentDay);

  registry.events.emit(SALARY_RECEIVED, { amount, job, newBalance, day: currentDay });
  registry.events.emit(MONEY_CHANGED, { amount, newBalance, source: 'salary' });

  return { paid: true, amount, job };
}

// ─────────────────────────────────────────────────────────────────────────────
// Tax filing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a tax filing event should be triggered on `currentDay`.
 *
 * @param {number} currentDay
 * @param {number} lastFiledDay - Day the last tax was filed (0 = never).
 * @returns {boolean}
 */
export function isTaxFilingDue(currentDay, lastFiledDay) {
  if (lastFiledDay === 0 || lastFiledDay === null || lastFiledDay === undefined) {
    return currentDay >= TAX_FILING_INTERVAL_DAYS;
  }
  return (currentDay - lastFiledDay) >= TAX_FILING_INTERVAL_DAYS;
}

/**
 * Resolve a tax filing event.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {boolean} correct - True if player filed correctly, false for errors.
 * @param {number} [errorPenalty] - XP penalty amount for errors (defaults to random between min/max).
 * @returns {{ xpChange: number, correct: boolean }}
 */
export function resolveTaxFiling(registry, correct, errorPenalty) {
  const currentDay = registry.get(RK.CURRENT_DAY) ?? 1;
  registry.set(RK.TAX_LAST_FILED_DAY, currentDay);

  let xpChange;
  if (correct) {
    grantXP(registry, TAX_CORRECT_XP, 'Tax filing — correct', 'Economy');
    xpChange = TAX_CORRECT_XP;
  } else {
    const penalty = errorPenalty ??
      Math.floor(Math.random() * (TAX_ERROR_XP_MAX - TAX_ERROR_XP_MIN + 1)) + TAX_ERROR_XP_MIN;
    penalizeXP(registry, penalty, 'Tax filing — error', 'Economy');
    xpChange = -penalty;
  }

  registry.events.emit(TAX_FILED, { correct, xpChange, day: currentDay });
  return { xpChange, correct };
}

/**
 * Check and process tax filing if due. Returns null if not yet due.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ due: boolean }}
 */
export function checkTaxFiling(registry) {
  const currentDay    = registry.get(RK.CURRENT_DAY) ?? 1;
  const lastFiledDay  = registry.get(RK.TAX_LAST_FILED_DAY) ?? 0;
  return { due: isTaxFilingDue(currentDay, lastFiledDay) };
}

// ─────────────────────────────────────────────────────────────────────────────
// Financial XP tracking
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check if the player has overspent >80% of their last salary in the current cycle.
 * If so, penalise -15 XP.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} amountSpent - DKK spent in the current salary cycle.
 * @returns {{ overspent: boolean, penalty: number }}
 */
export function checkOverspend(registry, amountSpent) {
  const job    = registry.get(RK.PLAYER_JOB) ?? '';
  const salary = getSalaryForJob(job);

  if (salary <= 0) return { overspent: false, penalty: 0 };

  const ratio = amountSpent / salary;
  if (ratio > OVERSPEND_THRESHOLD) {
    penalizeXP(registry, OVERSPEND_XP_PENALTY, 'Overspent >80% of salary', 'Economy');
    return { overspent: true, penalty: OVERSPEND_XP_PENALTY };
  }
  return { overspent: false, penalty: 0 };
}

/**
 * Call once per day advance to process salary and check tax filing.
 * This is the main hook called by the day cycle system.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ salaryResult: object, taxDue: boolean }}
 */
export function onDayAdvance(registry) {
  const salaryResult = processSalary(registry);
  const { due: taxDue } = checkTaxFiling(registry);
  return { salaryResult, taxDue };
}
