/**
 * src/systems/XPLog.js
 * Tracks XP changes for the daily summary screen.
 *
 * Each day's log is a flat array of entries:
 *   { amount: number, source: string, category: string, timestamp: number }
 *
 * Positive `amount` = XP gain; negative `amount` = XP loss.
 *
 * Usage:
 *   XPLog.addEntry(registry, entry)     — called by XPEngine after each XP change
 *   XPLog.getDailyEntries(registry)     — retrieve today's entries
 *   XPLog.getDailyNet(registry)         — total net XP for the day
 *   XPLog.getCategoryTotals(registry)   — { [category]: netXP }
 *   XPLog.clearLog(registry)            — call on day advance after archiving
 */

/** Registry key used to store the current day's XP log array. */
const LOG_KEY = 'xp_log_current';

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a single XP entry to today's log.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {{ amount: number, source: string, category: string, timestamp: number }} entry
 */
function addEntry(registry, entry) {
  const log = _getLog(registry);
  log.push({
    amount:    entry.amount    ?? 0,
    source:    entry.source    ?? '',
    category:  entry.category  ?? '',
    timestamp: entry.timestamp ?? Date.now(),
  });
  registry.set(LOG_KEY, log);
}

/**
 * Return all XP log entries for the current day.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<{ amount: number, source: string, category: string, timestamp: number }>}
 */
function getDailyEntries(registry) {
  return _getLog(registry);
}

/**
 * Return the net XP change for the current day (sum of all amounts).
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {number}
 */
function getDailyNet(registry) {
  return _getLog(registry).reduce((sum, e) => sum + e.amount, 0);
}

/**
 * Return a breakdown of net XP per category for the current day.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Object.<string, number>} Map from category name to net XP.
 */
function getCategoryTotals(registry) {
  const totals = {};
  for (const entry of _getLog(registry)) {
    const cat = entry.category || 'Uncategorized';
    totals[cat] = (totals[cat] ?? 0) + entry.amount;
  }
  return totals;
}

/**
 * Clear the current day's XP log.
 * Call this on day advance, after reading and archiving the day's entries.
 *
 * @param {Phaser.Data.DataManager} registry
 */
function clearLog(registry) {
  registry.set(LOG_KEY, []);
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the current log from the registry, defaulting to an empty array.
 * Returns a shallow copy so callers don't mutate registry state directly.
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array}
 */
function _getLog(registry) {
  const stored = registry.get(LOG_KEY);
  return Array.isArray(stored) ? stored : [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Namespace export
// ─────────────────────────────────────────────────────────────────────────────

export const XPLog = {
  addEntry,
  getDailyEntries,
  getDailyNet,
  getCategoryTotals,
  clearLog,
};
