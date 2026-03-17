/**
 * tests/systems/EconomyEngine.test.js
 * Unit and integration tests for EconomyEngine.
 * Coverage target: ≥85% of src/systems/EconomyEngine.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  SALARY_TABLE,
  SALARY_INTERVAL_DAYS,
  TAX_FILING_INTERVAL_DAYS,
  OVERSPEND_XP_PENALTY,
  OVERSPEND_THRESHOLD,
  TAX_CORRECT_XP,
  TAX_ERROR_XP_MIN,
  TAX_ERROR_XP_MAX,
  getSalaryForJob,
  isSalaryDue,
  processSalary,
  isTaxFilingDue,
  resolveTaxFiling,
  checkTaxFiling,
  checkOverspend,
  onDayAdvance,
} from '../../src/systems/EconomyEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { SALARY_RECEIVED, TAX_FILED, MONEY_CHANGED } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(options = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,         options.day          ?? 1);
  r.set(RK.PLAYER_XP,           options.xp           ?? 0);
  r.set(RK.PLAYER_LEVEL,        options.level        ?? 1);
  r.set(RK.PLAYER_MONEY,        options.money        ?? 1000);
  r.set(RK.PLAYER_JOB,          options.job          ?? 'Teacher');
  r.set(RK.LAST_SALARY_DAY,     options.lastSalary   ?? 0);
  r.set(RK.TAX_LAST_FILED_DAY,  options.lastTaxDay   ?? 0);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Salary table
// ─────────────────────────────────────────────────────────────────────────────

describe('SALARY_TABLE — table values', () => {
  it('exports a salary table with all expected jobs', () => {
    const expectedJobs = [
      'IT Professional', 'Teacher', 'Student (SU)', 'Chef',
      'Nurse', 'Researcher', 'Artist', 'Engineer',
    ];
    for (const job of expectedJobs) {
      expect(SALARY_TABLE).toHaveProperty(job);
    }
  });

  it('all salaries are positive numbers', () => {
    for (const [, amount] of Object.entries(SALARY_TABLE)) {
      expect(typeof amount).toBe('number');
      expect(amount).toBeGreaterThan(0);
    }
  });
});

describe('getSalaryForJob', () => {
  it('returns correct net bi-weekly for IT Professional', () => {
    expect(getSalaryForJob('IT Professional')).toBe(10850);
  });
  it('returns correct net bi-weekly for Teacher', () => {
    expect(getSalaryForJob('Teacher')).toBe(9300);
  });
  it('returns correct net bi-weekly for Student (SU)', () => {
    expect(getSalaryForJob('Student (SU)')).toBe(2015);
  });
  it('returns correct net bi-weekly for Chef', () => {
    expect(getSalaryForJob('Chef')).toBe(8370);
  });
  it('returns correct net bi-weekly for Nurse', () => {
    expect(getSalaryForJob('Nurse')).toBe(9920);
  });
  it('returns correct net bi-weekly for Researcher', () => {
    expect(getSalaryForJob('Researcher')).toBe(11780);
  });
  it('returns correct net bi-weekly for Artist', () => {
    expect(getSalaryForJob('Artist')).toBe(6200);
  });
  it('returns correct net bi-weekly for Engineer', () => {
    expect(getSalaryForJob('Engineer')).toBe(12400);
  });
  it('returns 0 for unknown jobs', () => {
    expect(getSalaryForJob('Unknown Job')).toBe(0);
    expect(getSalaryForJob('')).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isSalaryDue
// ─────────────────────────────────────────────────────────────────────────────

describe('isSalaryDue', () => {
  it('returns true on day 14 when last salary day is 0 (never paid)', () => {
    expect(isSalaryDue(14, 0)).toBe(true);
  });
  it('returns false before day 14 when never paid', () => {
    expect(isSalaryDue(13, 0)).toBe(false);
    expect(isSalaryDue(1, 0)).toBe(false);
  });
  it('returns true when current - lastSalaryDay >= 14', () => {
    expect(isSalaryDue(28, 14)).toBe(true);
    expect(isSalaryDue(30, 14)).toBe(true);
  });
  it('returns false when not enough days since last salary', () => {
    expect(isSalaryDue(20, 14)).toBe(false);
    expect(isSalaryDue(27, 14)).toBe(false);
  });
  it('handles null/undefined lastSalaryDay the same as 0', () => {
    expect(isSalaryDue(14, null)).toBe(true);
    expect(isSalaryDue(14, undefined)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// processSalary
// ─────────────────────────────────────────────────────────────────────────────

describe('processSalary', () => {
  it('pays salary on day 14 (first payment)', () => {
    const registry = makeRegistry({ day: 14, money: 0, job: 'Engineer' });
    const result = processSalary(registry);
    expect(result.paid).toBe(true);
    expect(result.amount).toBe(12400);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(12400);
    expect(registry.get(RK.LAST_SALARY_DAY)).toBe(14);
  });

  it('pays salary bi-weekly — day 28 after day 14', () => {
    const registry = makeRegistry({ day: 28, money: 5000, job: 'Teacher', lastSalary: 14 });
    const result = processSalary(registry);
    expect(result.paid).toBe(true);
    expect(result.amount).toBe(9300);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(14300);
  });

  it('does NOT pay salary if interval not reached', () => {
    const registry = makeRegistry({ day: 20, money: 500, job: 'Artist', lastSalary: 14 });
    const result = processSalary(registry);
    expect(result.paid).toBe(false);
    expect(result.amount).toBe(0);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(500);
  });

  it('emits SALARY_RECEIVED event when salary is paid', () => {
    const registry = makeRegistry({ day: 14, job: 'Nurse' });
    const listener = vi.fn();
    registry.events.on(SALARY_RECEIVED, listener);
    processSalary(registry);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].amount).toBe(9920);
  });

  it('emits MONEY_CHANGED event when salary is paid', () => {
    const registry = makeRegistry({ day: 14, job: 'Researcher' });
    const listener = vi.fn();
    registry.events.on(MONEY_CHANGED, listener);
    processSalary(registry);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].source).toBe('salary');
  });

  it('handles unknown job (zero salary)', () => {
    const registry = makeRegistry({ day: 14, money: 500, job: 'Unknown' });
    const result = processSalary(registry);
    expect(result.paid).toBe(true);
    expect(result.amount).toBe(0);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(500);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isTaxFilingDue
// ─────────────────────────────────────────────────────────────────────────────

describe('isTaxFilingDue', () => {
  it('returns true on day 88 when never filed', () => {
    expect(isTaxFilingDue(88, 0)).toBe(true);
  });
  it('returns false before day 88 when never filed', () => {
    expect(isTaxFilingDue(87, 0)).toBe(false);
  });
  it('returns true when interval has elapsed', () => {
    expect(isTaxFilingDue(176, 88)).toBe(true);
  });
  it('returns false before interval elapses', () => {
    expect(isTaxFilingDue(175, 88)).toBe(false);
  });
  it('handles null/undefined lastFiledDay', () => {
    expect(isTaxFilingDue(88, null)).toBe(true);
    expect(isTaxFilingDue(88, undefined)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// resolveTaxFiling
// ─────────────────────────────────────────────────────────────────────────────

describe('resolveTaxFiling', () => {
  it('grants +30 XP for correct filing', () => {
    const registry = makeRegistry({ day: 88, xp: 100 });
    const result = resolveTaxFiling(registry, true);
    expect(result.correct).toBe(true);
    expect(result.xpChange).toBe(TAX_CORRECT_XP);
    expect(registry.get(RK.PLAYER_XP)).toBe(130);
  });

  it('applies XP penalty for incorrect filing', () => {
    const registry = makeRegistry({ day: 88, xp: 200 });
    const result = resolveTaxFiling(registry, false, 75);
    expect(result.correct).toBe(false);
    expect(result.xpChange).toBe(-75);
    expect(registry.get(RK.PLAYER_XP)).toBe(125);
  });

  it('penalty falls in allowed range when not specified', () => {
    const registry = makeRegistry({ day: 88, xp: 500 });
    const result = resolveTaxFiling(registry, false);
    expect(result.xpChange).toBeLessThanOrEqual(-TAX_ERROR_XP_MIN);
    expect(result.xpChange).toBeGreaterThanOrEqual(-TAX_ERROR_XP_MAX);
  });

  it('updates TAX_LAST_FILED_DAY in registry', () => {
    const registry = makeRegistry({ day: 88 });
    resolveTaxFiling(registry, true);
    expect(registry.get(RK.TAX_LAST_FILED_DAY)).toBe(88);
  });

  it('emits TAX_FILED event', () => {
    const registry = makeRegistry({ day: 88 });
    const listener = vi.fn();
    registry.events.on(TAX_FILED, listener);
    resolveTaxFiling(registry, true);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].correct).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkTaxFiling
// ─────────────────────────────────────────────────────────────────────────────

describe('checkTaxFiling', () => {
  it('returns { due: true } when filing is due', () => {
    const registry = makeRegistry({ day: 88, lastTaxDay: 0 });
    expect(checkTaxFiling(registry)).toEqual({ due: true });
  });
  it('returns { due: false } when not due', () => {
    const registry = makeRegistry({ day: 50, lastTaxDay: 0 });
    expect(checkTaxFiling(registry)).toEqual({ due: false });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// checkOverspend
// ─────────────────────────────────────────────────────────────────────────────

describe('checkOverspend', () => {
  it('penalises -15 XP when >80% of salary spent', () => {
    const registry = makeRegistry({ job: 'Teacher', xp: 100 }); // salary = 9300
    const spent = 9300 * 0.85; // 85%
    const result = checkOverspend(registry, spent);
    expect(result.overspent).toBe(true);
    expect(result.penalty).toBe(OVERSPEND_XP_PENALTY);
    expect(registry.get(RK.PLAYER_XP)).toBe(85);
  });

  it('does NOT penalise when spending is ≤80%', () => {
    const registry = makeRegistry({ job: 'Teacher', xp: 100 });
    const spent = 9300 * 0.79;
    const result = checkOverspend(registry, spent);
    expect(result.overspent).toBe(false);
    expect(result.penalty).toBe(0);
    expect(registry.get(RK.PLAYER_XP)).toBe(100);
  });

  it('returns no overspend for unknown job', () => {
    const registry = makeRegistry({ job: 'Unknown' });
    const result = checkOverspend(registry, 99999);
    expect(result.overspent).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// onDayAdvance
// ─────────────────────────────────────────────────────────────────────────────

describe('onDayAdvance', () => {
  it('processes salary and checks tax on each day advance', () => {
    const registry = makeRegistry({ day: 14, job: 'Chef' });
    const result = onDayAdvance(registry);
    expect(result.salaryResult.paid).toBe(true);
    expect(typeof result.taxDue).toBe('boolean');
  });

  it('returns taxDue: true on day 88', () => {
    const registry = makeRegistry({ day: 88 });
    const result = onDayAdvance(registry);
    expect(result.taxDue).toBe(true);
  });

  it('returns taxDue: false before day 88', () => {
    const registry = makeRegistry({ day: 50 });
    const result = onDayAdvance(registry);
    expect(result.taxDue).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Registry fallback branch coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('registry fallback defaults', () => {
  it('processSalary uses day=1 when CURRENT_DAY not set', () => {
    const r = new MockRegistry();
    r.set(RK.PLAYER_JOB, 'Teacher');
    r.set(RK.PLAYER_XP, 0);
    r.set(RK.PLAYER_LEVEL, 1);
    r.set(RK.PLAYER_MONEY, 0);
    // CURRENT_DAY and LAST_SALARY_DAY not set — defaults to day 1
    const result = processSalary(r);
    // Day 1 < 14, no salary
    expect(result.paid).toBe(false);
  });

  it('resolveTaxFiling uses day=1 when CURRENT_DAY not set', () => {
    const r = new MockRegistry();
    r.set(RK.PLAYER_XP, 50);
    r.set(RK.PLAYER_LEVEL, 1);
    // No CURRENT_DAY set — falls back to 1
    const result = resolveTaxFiling(r, true);
    expect(result.correct).toBe(true);
    expect(r.get(RK.TAX_LAST_FILED_DAY)).toBe(1);
  });

  it('checkTaxFiling uses defaults when keys not set', () => {
    const r = new MockRegistry();
    // No CURRENT_DAY or TAX_LAST_FILED_DAY — defaults → day 1, lastFiled 0
    const result = checkTaxFiling(r);
    expect(result.due).toBe(false); // day 1 < 88
  });

  it('checkOverspend with no PLAYER_JOB set uses empty string → 0 salary', () => {
    const r = new MockRegistry();
    r.set(RK.PLAYER_XP, 100);
    r.set(RK.PLAYER_LEVEL, 1);
    const result = checkOverspend(r, 99999);
    expect(result.overspent).toBe(false);
  });
});

describe('Integration — salary cycle', () => {
  it('salary arrives on day 14 → balance increases → notification shown', () => {
    const registry = makeRegistry({ day: 14, money: 500, job: 'IT Professional' });
    const listener = vi.fn();
    registry.events.on(SALARY_RECEIVED, listener);

    const result = processSalary(registry);

    expect(result.paid).toBe(true);
    expect(result.amount).toBe(10850);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(11350);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0]).toMatchObject({
      amount: 10850,
      job: 'IT Professional',
      day: 14,
    });
  });

  it('salary does not double-pay on same day', () => {
    const registry = makeRegistry({ day: 14, money: 500, job: 'Engineer', lastSalary: 14 });
    const result = processSalary(registry);
    expect(result.paid).toBe(false);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(500);
  });
});
