/**
 * src/systems/DailyTaskGenerator.js
 * Generates daily maintenance tasks based on current game state.
 *
 * Pure module: no Phaser scene imports.
 * Does NOT add tasks to the registry — caller passes results to QuestEngine.addTask().
 *
 * Usage:
 *   import { generateDailyTasks } from '../systems/DailyTaskGenerator.js';
 *   const newTasks = generateDailyTasks(registry, currentDay, season);
 *   for (const task of newTasks) { QuestEngine.addTask(registry, task); }
 */

import * as RK from '../constants/RegistryKeys.js';
import ITEMS_DATA from '../data/items.js';

// ─────────────────────────────────────────────────────────────────────────────
// Item helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Fast lookup map: itemId → item definition. */
const ITEM_MAP = new Map(ITEMS_DATA.map(item => [item.id, item]));

/**
 * Count the total quantity of food items in the registry inventory.
 *
 * @param {object} registry
 * @returns {number}
 */
function countFoodItems(registry) {
  const inventory = registry.get(RK.INVENTORY) ?? [];
  let total = 0;
  for (const entry of inventory) {
    const itemDef = ITEM_MAP.get(entry.itemId);
    if (itemDef && itemDef.category === 'food') {
      total += entry.quantity ?? 1;
    }
  }
  return total;
}

/**
 * Count the total quantity of a specific item in the registry inventory.
 *
 * @param {object} registry
 * @param {string} itemId
 * @returns {number}
 */
function countItem(registry, itemId) {
  const inventory = registry.get(RK.INVENTORY) ?? [];
  const entry = inventory.find(e => e.itemId === itemId);
  return entry ? (entry.quantity ?? 1) : 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return pending bills from the registry.
 *
 * @param {object} registry
 * @returns {object[]}
 */
function getPendingBills(registry) {
  const bills = registry.get(RK.PENDING_BILLS) ?? [];
  return bills.filter(b => b.status === 'pending');
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate daily maintenance task objects for the current day.
 *
 * Rules (evaluated in order; stops at first matching food rule):
 *  1. no_food       — food items = 0           → critical
 *  2. low_food      — food items ≤ 1            → urgent
 *  3. bill_overdue  — any bill past due date    → urgent
 *  4. bill_due_soon — any bill due within 2 days→ normal
 *  5. no_vitamin_d  — vitamin_d qty = 0         → normal (urgent in winter)
 *  6. low_health    — PLAYER_HEALTH < 40        → normal
 *  7. explore_nudge — days since new location ≥ 5 → low
 *
 * Does NOT check for duplicate IDs — caller (QuestEngine.addTask) handles that.
 *
 * @param {object} registry
 * @param {number} currentDay
 * @param {string} season - 'spring' | 'summer' | 'autumn' | 'winter'
 * @returns {object[]} Array of task objects ready to pass to QuestEngine.addTask().
 */
export function generateDailyTasks(registry, currentDay, season) {
  const tasks = [];

  // ── Rule 1 & 2: Food check (mutually exclusive — stop at first match) ──────
  const foodCount = countFoodItems(registry);

  if (foodCount === 0) {
    tasks.push(_makeTask('no_food', currentDay, {
      title:       'You have nothing to eat — buy groceries now',
      description: 'Your food supply is completely empty. Visit a shop immediately before you go hungry.',
      icon:        '🚨',
      urgency:     'critical',
      xpReward:    5,
      xpPenalty:   10,
      skippable:   false,
      completionCondition: { type: 'hasItem', itemId: 'rugbrod', minQuantity: 1 },
    }));
  } else if (foodCount <= 1) {
    tasks.push(_makeTask('low_food', currentDay, {
      title:       "You're running low on food — visit a shop",
      description: "You only have a small amount of food left. Pick up some groceries soon.",
      icon:        '⚠️',
      urgency:     'urgent',
      xpReward:    3,
      xpPenalty:   5,
      skippable:   true,
      completionCondition: { type: 'hasItem', itemId: 'rugbrod', minQuantity: 1 },
    }));
  }

  // ── Rules 3 & 4: Bill checks ───────────────────────────────────────────────
  const pendingBills = getPendingBills(registry);

  for (const bill of pendingBills) {
    if (bill.dueDay < currentDay) {
      // Rule 3: overdue
      tasks.push(_makeTask(`bill_overdue_${bill.id}`, currentDay, {
        title:       `${bill.label} is overdue — pay now to avoid penalty`,
        description: `${bill.label} was due on day ${bill.dueDay}. Pay it immediately to minimise penalties.`,
        icon:        '🚨',
        urgency:     'urgent',
        xpReward:    0,
        xpPenalty:   0,
        skippable:   true,
        completionCondition: { type: 'moneySpent', minAmount: 0 },
      }));
    } else if (bill.dueDay - currentDay <= 2) {
      // Rule 4: due soon
      const daysLeft = bill.dueDay - currentDay;
      tasks.push(_makeTask(`bill_due_soon_${bill.id}`, currentDay, {
        title:       `${bill.label} is due in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — pay it soon`,
        description: `${bill.label} is coming due. Pay before day ${bill.dueDay} to avoid a late penalty.`,
        icon:        '⚠️',
        urgency:     'normal',
        xpReward:    0,
        xpPenalty:   0,
        skippable:   true,
        completionCondition: { type: 'moneySpent', minAmount: 0 },
      }));
    }
  }

  // ── Rule 5: Vitamin D ───────────────────────────────────────────────────────
  const vitaminDCount = countItem(registry, 'vitamin_d');
  if (vitaminDCount === 0) {
    const vitUrgency = season === 'winter' ? 'urgent' : 'normal';
    tasks.push(_makeTask('no_vitamin_d', currentDay, {
      title:       "You're out of vitamin D — pick some up",
      description: 'Vitamin D is important during the dark months. Buy some at a pharmacy or supermarket.',
      icon:        '🔵',
      urgency:     vitUrgency,
      xpReward:    2,
      xpPenalty:   0,
      skippable:   true,
      completionCondition: { type: 'hasItem', itemId: 'vitamin_d', minQuantity: 1 },
    }));
  }

  // ── Rule 6: Low health ─────────────────────────────────────────────────────
  const health = registry.get(RK.PLAYER_HEALTH) ?? 100;
  if (health < 40) {
    tasks.push(_makeTask('low_health', currentDay, {
      title:       "You're not feeling well — rest or eat something",
      description: 'Your health is low. Take some time to rest or eat a proper meal.',
      icon:        '⚠️',
      urgency:     'normal',
      xpReward:    2,
      xpPenalty:   0,
      skippable:   true,
      completionCondition: { type: 'itemUsed', itemId: 'rugbrod' },
    }));
  }

  // ── Rule 7: Explore nudge ──────────────────────────────────────────────────
  const visitedLocations = registry.get(RK.VISITED_LOCATIONS) ?? [];
  const lastNewLocationDay = registry.get('last_new_location_day') ?? 1;
  const daysSinceExplore = currentDay - lastNewLocationDay;

  if (visitedLocations.length === 0 || daysSinceExplore >= 5) {
    tasks.push(_makeTask('explore_nudge', currentDay, {
      title:       "You haven't explored much — venture somewhere new",
      description: "Discover new locations around Copenhagen. There's always something new to find.",
      icon:        '🔵',
      urgency:     'low',
      xpReward:    5,
      xpPenalty:   0,
      skippable:   true,
      completionCondition: { type: 'locationVisited', locationId: null },
    }));
  }

  return tasks;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a daily task object with a deterministic ID.
 *
 * @param {string} ruleKey   - Rule identifier (used to build the task ID).
 * @param {number} currentDay
 * @param {object} overrides - Task fields to merge in.
 * @returns {object}
 */
function _makeTask(ruleKey, currentDay, overrides) {
  return {
    id:          `daily_${ruleKey}_day${currentDay}`,
    type:        'daily',
    assignedDay: currentDay,
    completedDay: null,
    status:      'active',
    xpReward:    0,
    xpPenalty:   0,
    skippable:   true,
    ...overrides,
  };
}
