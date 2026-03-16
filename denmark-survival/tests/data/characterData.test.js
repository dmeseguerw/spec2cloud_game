/**
 * tests/data/characterData.test.js
 * Unit tests for the character creation data module.
 *
 * Covers:
 *  - NATIONALITIES array — structure and correctness of all 12 entries
 *  - JOBS array — structure and correctness of all 8 entries
 *  - sanitizeName — strips HTML and dangerous characters
 *  - validateName — enforces 1-20 character limit
 */

import { describe, it, expect } from 'vitest';
import {
  NATIONALITIES,
  JOBS,
  sanitizeName,
  validateName,
} from '../../src/data/characterData.js';

// ---------------------------------------------------------------------------
// NATIONALITIES
// ---------------------------------------------------------------------------

describe('NATIONALITIES', () => {
  it('contains exactly 12 entries', () => {
    expect(NATIONALITIES).toHaveLength(12);
  });

  it('every entry has all required fields', () => {
    const requiredFields = ['id', 'name', 'culturalFamiliarity', 'skillBonusSkill', 'skillBonusValue', 'flag'];
    for (const nat of NATIONALITIES) {
      for (const field of requiredFields) {
        expect(nat, `Nationality "${nat.name || nat.id}" is missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every id is a non-empty lowercase string', () => {
    for (const nat of NATIONALITIES) {
      expect(typeof nat.id).toBe('string');
      expect(nat.id.length).toBeGreaterThan(0);
      expect(nat.id).toBe(nat.id.toLowerCase());
    }
  });

  it('every name is a non-empty string', () => {
    for (const nat of NATIONALITIES) {
      expect(typeof nat.name).toBe('string');
      expect(nat.name.length).toBeGreaterThan(0);
    }
  });

  it('all nationality ids are unique', () => {
    const ids = NATIONALITIES.map(n => n.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every skillBonusValue is a positive number', () => {
    for (const nat of NATIONALITIES) {
      expect(typeof nat.skillBonusValue).toBe('number');
      expect(nat.skillBonusValue).toBeGreaterThan(0);
    }
  });

  it('every flag is a non-empty string', () => {
    for (const nat of NATIONALITIES) {
      expect(typeof nat.flag).toBe('string');
      expect(nat.flag.length).toBeGreaterThan(0);
    }
  });

  // Spot-check specific entries from the spec
  it('includes American with +5 Bureaucracy and Low cultural familiarity', () => {
    const american = NATIONALITIES.find(n => n.id === 'american');
    expect(american).toBeDefined();
    expect(american.culturalFamiliarity).toBe('Low');
    expect(american.skillBonusSkill).toBe('Bureaucracy');
    expect(american.skillBonusValue).toBe(5);
  });

  it('includes Swedish with +15 Cultural and High cultural familiarity', () => {
    const swedish = NATIONALITIES.find(n => n.id === 'swedish');
    expect(swedish).toBeDefined();
    expect(swedish.culturalFamiliarity).toBe('High');
    expect(swedish.skillBonusSkill).toBe('Cultural');
    expect(swedish.skillBonusValue).toBe(15);
  });

  it('includes Norwegian with +15 Language and High cultural familiarity', () => {
    const norwegian = NATIONALITIES.find(n => n.id === 'norwegian');
    expect(norwegian).toBeDefined();
    expect(norwegian.culturalFamiliarity).toBe('High');
    expect(norwegian.skillBonusSkill).toBe('Language');
    expect(norwegian.skillBonusValue).toBe(15);
  });

  it('includes German with +10 Cycling and Medium cultural familiarity', () => {
    const german = NATIONALITIES.find(n => n.id === 'german');
    expect(german).toBeDefined();
    expect(german.culturalFamiliarity).toBe('Medium');
    expect(german.skillBonusSkill).toBe('Cycling');
    expect(german.skillBonusValue).toBe(10);
  });

  it('includes Dutch with +10 Cycling', () => {
    const dutch = NATIONALITIES.find(n => n.id === 'dutch');
    expect(dutch).toBeDefined();
    expect(dutch.skillBonusSkill).toBe('Cycling');
    expect(dutch.skillBonusValue).toBe(10);
  });

  it('includes Polish with +10 Bureaucracy', () => {
    const polish = NATIONALITIES.find(n => n.id === 'polish');
    expect(polish).toBeDefined();
    expect(polish.skillBonusSkill).toBe('Bureaucracy');
    expect(polish.skillBonusValue).toBe(10);
  });

  it('includes all 12 specified nationalities by id', () => {
    const expectedIds = [
      'american', 'british', 'german', 'swedish', 'norwegian',
      'dutch', 'french', 'spanish', 'italian', 'polish', 'turkish', 'indian',
    ];
    const actualIds = NATIONALITIES.map(n => n.id);
    for (const id of expectedIds) {
      expect(actualIds).toContain(id);
    }
  });
});

// ---------------------------------------------------------------------------
// JOBS
// ---------------------------------------------------------------------------

describe('JOBS', () => {
  it('contains exactly 8 entries', () => {
    expect(JOBS).toHaveLength(8);
  });

  it('every entry has all required fields', () => {
    const requiredFields = ['id', 'title', 'salary', 'schedule', 'skillAffinity'];
    for (const job of JOBS) {
      for (const field of requiredFields) {
        expect(job, `Job "${job.title || job.id}" is missing field "${field}"`).toHaveProperty(field);
      }
    }
  });

  it('every salary is a positive number', () => {
    for (const job of JOBS) {
      expect(typeof job.salary).toBe('number');
      expect(job.salary).toBeGreaterThan(0);
    }
  });

  it('all job ids are unique', () => {
    const ids = JOBS.map(j => j.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every title is a non-empty string', () => {
    for (const job of JOBS) {
      expect(typeof job.title).toBe('string');
      expect(job.title.length).toBeGreaterThan(0);
    }
  });

  it('every schedule is a non-empty string', () => {
    for (const job of JOBS) {
      expect(typeof job.schedule).toBe('string');
      expect(job.schedule.length).toBeGreaterThan(0);
    }
  });

  // Spot-check specific entries from the spec
  it('Engineer earns 40,000 DKK with Mon-Fri 8-17 schedule', () => {
    const engineer = JOBS.find(j => j.id === 'engineer');
    expect(engineer).toBeDefined();
    expect(engineer.salary).toBe(40000);
    expect(engineer.schedule).toBe('Mon-Fri 8-17');
    expect(engineer.skillAffinity).toBe('Cycling');
  });

  it('Student earns 6,500 DKK with Flexible schedule', () => {
    const student = JOBS.find(j => j.id === 'student');
    expect(student).toBeDefined();
    expect(student.salary).toBe(6500);
    expect(student.schedule).toBe('Flexible');
    expect(student.skillAffinity).toBe('Language');
  });

  it('IT Professional earns 35,000 DKK', () => {
    const it = JOBS.find(j => j.id === 'it-professional');
    expect(it).toBeDefined();
    expect(it.salary).toBe(35000);
    expect(it.skillAffinity).toBe('Bureaucracy');
  });

  it('includes all 8 specified jobs by id', () => {
    const expectedIds = [
      'it-professional', 'teacher', 'student', 'chef',
      'nurse', 'researcher', 'artist', 'engineer',
    ];
    const actualIds = JOBS.map(j => j.id);
    for (const id of expectedIds) {
      expect(actualIds).toContain(id);
    }
  });
});

// ---------------------------------------------------------------------------
// sanitizeName
// ---------------------------------------------------------------------------

describe('sanitizeName', () => {
  it('returns the trimmed input when no dangerous characters are present', () => {
    expect(sanitizeName('Alice')).toBe('Alice');
    expect(sanitizeName('  Bob  ')).toBe('Bob');
  });

  it('strips HTML tags', () => {
    expect(sanitizeName('<b>Alice</b>')).toBe('Alice');
    expect(sanitizeName('<script>alert(1)</script>')).toBe('alert(1)');
  });

  it('strips angle brackets left over after tag stripping', () => {
    // Lone < or > that are not part of a tag
    expect(sanitizeName('a<b')).toBe('ab');
    expect(sanitizeName('a>b')).toBe('ab');
  });

  it('strips ampersand', () => {
    expect(sanitizeName('Tom & Jerry')).toBe('Tom Jerry');
  });

  it('strips double and single quotes', () => {
    expect(sanitizeName('"Alice"')).toBe('Alice');
    expect(sanitizeName("O'Brien")).toBe('OBrien');
  });

  it('strips backslash and forward slash', () => {
    expect(sanitizeName('path/to')).toBe('pathto');
    expect(sanitizeName('path\\to')).toBe('pathto');
  });

  it('strips backtick', () => {
    expect(sanitizeName('`cmd`')).toBe('cmd');
  });

  it('collapses multiple spaces into one', () => {
    expect(sanitizeName('  Alice   Bob  ')).toBe('Alice Bob');
  });

  it('converts non-string input to string before processing', () => {
    expect(sanitizeName(42)).toBe('42');
    expect(sanitizeName(null)).toBe('null');
  });

  it('returns empty string for input that is all special characters', () => {
    expect(sanitizeName('<script></script>')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// validateName
// ---------------------------------------------------------------------------

describe('validateName', () => {
  it('accepts a single character name', () => {
    expect(validateName('A')).toBe(true);
  });

  it('accepts a 20-character name', () => {
    expect(validateName('A'.repeat(20))).toBe(true);
  });

  it('accepts a typical name', () => {
    expect(validateName('Alice')).toBe(true);
    expect(validateName('Lars Erik Hansen')).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(validateName('')).toBe(false);
  });

  it('rejects a name that is only whitespace', () => {
    expect(validateName('   ')).toBe(false);
  });

  it('rejects a name longer than 20 characters after sanitization', () => {
    expect(validateName('A'.repeat(21))).toBe(false);
  });

  it('rejects a name that is only special characters (sanitizes to empty)', () => {
    expect(validateName('<script></script>')).toBe(false);
  });

  it('accepts a name that contains spaces (within limit)', () => {
    expect(validateName('Anna Maria')).toBe(true);
  });

  it('returns false for names that exceed 20 chars after whitespace collapse', () => {
    // 21 non-space chars → invalid
    expect(validateName('ABCDEFGHIJKLMNOPQRSTU')).toBe(false);
  });

  it('accepts a name of exactly 1 character after stripping HTML', () => {
    expect(validateName('<b>A</b>')).toBe(true);
  });

  it('rejects a name that reduces to empty after stripping HTML', () => {
    expect(validateName('<b></b>')).toBe(false);
  });
});
