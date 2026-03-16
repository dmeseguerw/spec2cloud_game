/**
 * src/data/characterData.js
 * Static data for the character creation wizard.
 *
 * Contains the 12 nationality options, 8 job options, and helper
 * functions for name validation and sanitization.
 */

/**
 * The 12 selectable nationalities, each with cultural familiarity and a
 * primary skill bonus displayed in the wizard UI.
 *
 * @type {Array<{
 *   id: string,
 *   name: string,
 *   culturalFamiliarity: string,
 *   skillBonusSkill: string,
 *   skillBonusValue: number,
 *   flag: string
 * }>}
 */
export const NATIONALITIES = [
  {
    id: 'american',
    name: 'American',
    culturalFamiliarity: 'Low',
    skillBonusSkill: 'Bureaucracy',
    skillBonusValue: 5,
    flag: '🇺🇸',
  },
  {
    id: 'british',
    name: 'British',
    culturalFamiliarity: 'Low-Medium',
    skillBonusSkill: 'Language',
    skillBonusValue: 5,
    flag: '🇬🇧',
  },
  {
    id: 'german',
    name: 'German',
    culturalFamiliarity: 'Medium',
    skillBonusSkill: 'Cycling',
    skillBonusValue: 10,
    flag: '🇩🇪',
  },
  {
    id: 'swedish',
    name: 'Swedish',
    culturalFamiliarity: 'High',
    skillBonusSkill: 'Cultural',
    skillBonusValue: 15,
    flag: '🇸🇪',
  },
  {
    id: 'norwegian',
    name: 'Norwegian',
    culturalFamiliarity: 'High',
    skillBonusSkill: 'Language',
    skillBonusValue: 15,
    flag: '🇳🇴',
  },
  {
    id: 'dutch',
    name: 'Dutch',
    culturalFamiliarity: 'Medium-High',
    skillBonusSkill: 'Cycling',
    skillBonusValue: 10,
    flag: '🇳🇱',
  },
  {
    id: 'french',
    name: 'French',
    culturalFamiliarity: 'Medium',
    skillBonusSkill: 'Cultural',
    skillBonusValue: 5,
    flag: '🇫🇷',
  },
  {
    id: 'spanish',
    name: 'Spanish',
    culturalFamiliarity: 'Low',
    skillBonusSkill: 'Social',
    skillBonusValue: 5,
    flag: '🇪🇸',
  },
  {
    id: 'italian',
    name: 'Italian',
    culturalFamiliarity: 'Low',
    skillBonusSkill: 'Social',
    skillBonusValue: 5,
    flag: '🇮🇹',
  },
  {
    id: 'polish',
    name: 'Polish',
    culturalFamiliarity: 'Medium',
    skillBonusSkill: 'Bureaucracy',
    skillBonusValue: 10,
    flag: '🇵🇱',
  },
  {
    id: 'turkish',
    name: 'Turkish',
    culturalFamiliarity: 'Low',
    skillBonusSkill: 'Cultural',
    skillBonusValue: 5,
    flag: '🇹🇷',
  },
  {
    id: 'indian',
    name: 'Indian',
    culturalFamiliarity: 'Low',
    skillBonusSkill: 'Bureaucracy',
    skillBonusValue: 5,
    flag: '🇮🇳',
  },
];

/**
 * The 8 selectable jobs, each with a monthly salary, work schedule, and a
 * primary skill affinity.
 *
 * @type {Array<{
 *   id: string,
 *   title: string,
 *   salary: number,
 *   schedule: string,
 *   skillAffinity: string
 * }>}
 */
export const JOBS = [
  {
    id: 'it-professional',
    title: 'IT Professional',
    salary: 35000,
    schedule: 'Mon-Fri 9-17',
    skillAffinity: 'Bureaucracy',
  },
  {
    id: 'teacher',
    title: 'Teacher',
    salary: 30000,
    schedule: 'Mon-Fri 8-16',
    skillAffinity: 'Language',
  },
  {
    id: 'student',
    title: 'Student',
    salary: 6500,
    schedule: 'Flexible',
    skillAffinity: 'Language',
  },
  {
    id: 'chef',
    title: 'Chef',
    salary: 27000,
    schedule: 'Variable',
    skillAffinity: 'Cultural',
  },
  {
    id: 'nurse',
    title: 'Nurse',
    salary: 32000,
    schedule: 'Shift work',
    skillAffinity: 'Social',
  },
  {
    id: 'researcher',
    title: 'Researcher',
    salary: 38000,
    schedule: 'Mon-Fri 9-17',
    skillAffinity: 'Bureaucracy',
  },
  {
    id: 'artist',
    title: 'Artist',
    salary: 20000,
    schedule: 'Flexible',
    skillAffinity: 'Cultural',
  },
  {
    id: 'engineer',
    title: 'Engineer',
    salary: 40000,
    schedule: 'Mon-Fri 8-17',
    skillAffinity: 'Cycling',
  },
];

/**
 * Sanitize a name string by stripping HTML tags and characters that could
 * be dangerous in a web context, then trimming whitespace.
 *
 * @param {string} name - Raw name input.
 * @returns {string} Sanitized name.
 */
export function sanitizeName(name) {
  return String(name)
    .replace(/<[^>]*>/g, '')        // strip HTML tags
    .replace(/[<>&"'`/\\]/g, '')    // strip dangerous chars
    .replace(/\s+/g, ' ')           // collapse whitespace
    .trim();
}

/**
 * Validate that a name is acceptable for use in the game.
 * The sanitized version must be between 1 and 20 characters inclusive.
 *
 * @param {string} name - Raw name input (will be sanitized before checking length).
 * @returns {boolean} True if the name is valid.
 */
export function validateName(name) {
  const sanitized = sanitizeName(name);
  return sanitized.length >= 1 && sanitized.length <= 20;
}
