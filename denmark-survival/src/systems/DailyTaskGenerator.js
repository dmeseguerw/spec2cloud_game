/**
 * src/systems/DailyTaskGenerator.js
 * Generates contextually appropriate daily tasks based on the current game state.
 *
 * Task urgency levels: 'critical', 'urgent', 'normal', 'low'
 *
 * Rules:
 *  - Food: 'no food' = 0 food items (critical), 'low food' = 1 food item (urgent)
 *  - Bills: upcoming bills include type + amount in title; overdue includes penalty
 *  - Vitamin D: winter season escalates to 'urgent'; adds seasonal flavour text
 *  - NPC dialogue: surfaces highest-priority available NPC nudge (one per day)
 *  - Explore: triggers if < 3 distinct locations visited OR 5+ days since new location
 */

import * as RK from '../constants/RegistryKeys.js';
import { getAvailableDialogues } from '../data/missionSchedule.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Count distinct food-category items in the inventory.
 * Food items have category === 'food' in items data; here we use a simple
 * heuristic: any item object with a `category` of 'food', or string IDs
 * matching known food identifiers.
 * @param {Array} inventory
 * @returns {number}
 */
function countFoodItems(inventory) {
  if (!Array.isArray(inventory)) return 0;
  const FOOD_IDS = new Set([
    'rugbrod', 'pasta', 'milk', 'bread', 'leverpostej', 'smorrebrod', 'wienerbrød',
    'apple', 'banana', 'cheese', 'eggs', 'rice', 'oats', 'yoghurt', 'soup',
  ]);
  return inventory.filter(item => {
    if (typeof item === 'string') return FOOD_IDS.has(item);
    if (item && typeof item === 'object') {
      if (item.category === 'food') return true;
      return FOOD_IDS.has(item.id);
    }
    return false;
  }).length;
}

/**
 * Get the nearest shop name from registry (or default).
 * @param {Phaser.Data.DataManager} registry
 * @returns {string}
 */
function getNearestShopName(registry) {
  const location = registry.get(RK.PLAYER_LOCATION) || '';
  if (location.includes('netto') || location.includes('grocery')) return 'Netto';
  if (location.includes('bilka')) return 'Bilka';
  if (location.includes('kvickly')) return 'Kvickly';
  return 'Netto';
}

/**
 * Format a DKK amount with thousand separators.
 * @param {number} amount
 * @returns {string}
 */
function formatDKK(amount) {
  return amount.toLocaleString('da-DK') + ' DKK';
}

// ─────────────────────────────────────────────────────────────────────────────
// Task generators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate food-related tasks based on inventory contents.
 * @param {Phaser.Data.DataManager} registry
 * @returns {object|null}
 */
export function generateFoodTask(registry) {
  const inventory = registry.get(RK.INVENTORY) || [];
  const foodCount = countFoodItems(inventory);
  const shopName = getNearestShopName(registry);

  if (foodCount === 0) {
    return {
      id: 'daily_food_critical',
      type: 'daily',
      title: `Buy food from ${shopName}`,
      description: 'You have no food at home. You need to eat to keep your energy up.',
      urgency: 'critical',
      xpReward: 10,
      xpPenalty: 5,
      completionCondition: { type: 'flag', key: 'ate_today', value: true },
      skippable: false,
    };
  }

  if (foodCount === 1) {
    return {
      id: 'daily_food_low',
      type: 'daily',
      title: `Stock up at ${shopName}`,
      description: 'You\'re running low on food. Pick up some essentials before you run out.',
      urgency: 'urgent',
      xpReward: 8,
      xpPenalty: 0,
      completionCondition: { type: 'flag', key: 'shopped_today', value: true },
      skippable: true,
    };
  }

  return null;
}

/**
 * Generate bill-related tasks for upcoming or overdue bills.
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>}
 */
export function generateBillTasks(registry) {
  const bills = registry.get(RK.PENDING_BILLS) || [];
  const currentDay = registry.get(RK.CURRENT_DAY) || 1;
  const tasks = [];

  for (const bill of bills) {
    const daysUntilDue = bill.dueDay - currentDay;

    if (daysUntilDue < 0) {
      // Overdue
      const penaltyText = bill.penalty ? ` Late fee: ${formatDKK(bill.penalty)}.` : '';
      tasks.push({
        id: `daily_bill_overdue_${bill.id}`,
        type: 'daily',
        title: `OVERDUE: ${bill.type} of ${formatDKK(bill.amount)}`,
        description: `Your ${bill.type.toLowerCase()} payment is overdue!${penaltyText} Pay immediately to avoid further penalties.`,
        urgency: 'critical',
        xpReward: 5,
        xpPenalty: 10,
        completionCondition: { type: 'flag', key: `bill_paid_${bill.id}`, value: true },
        skippable: false,
      });
    } else if (daysUntilDue <= 2) {
      tasks.push({
        id: `daily_bill_due_${bill.id}`,
        type: 'daily',
        title: `${bill.type} of ${formatDKK(bill.amount)} is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}`,
        description: `Your ${bill.type.toLowerCase()} payment is coming up. Make sure you have the funds ready.`,
        urgency: 'urgent',
        xpReward: 5,
        xpPenalty: 5,
        completionCondition: { type: 'flag', key: `bill_paid_${bill.id}`, value: true },
        skippable: false,
      });
    } else if (daysUntilDue <= 7) {
      tasks.push({
        id: `daily_bill_upcoming_${bill.id}`,
        type: 'daily',
        title: `Upcoming: ${bill.type} of ${formatDKK(bill.amount)}`,
        description: `Your ${bill.type.toLowerCase()} is due in ${daysUntilDue} days.`,
        urgency: 'normal',
        xpReward: 3,
        xpPenalty: 0,
        completionCondition: { type: 'flag', key: `bill_paid_${bill.id}`, value: true },
        skippable: true,
      });
    }
  }

  return tasks;
}

/**
 * Generate a Vitamin D reminder task.
 * Urgency escalates to 'urgent' during winter.
 * @param {Phaser.Data.DataManager} registry
 * @returns {object|null}
 */
export function generateVitaminDTask(registry) {
  const vitaminDTaken = registry.get(RK.VITAMIN_D_TAKEN);
  if (vitaminDTaken) return null;

  const season = registry.get(RK.SEASON) || 'spring';
  const isWinter = season === 'winter';

  const urgency = isWinter ? 'urgent' : 'normal';
  const winterSuffix = isWinter ? ' The dark Danish winter demands it.' : '';

  return {
    id: 'daily_vitamin_d',
    type: 'daily',
    title: 'Take your Vitamin D supplement',
    description: `Remember to take your daily Vitamin D supplement.${winterSuffix}`,
    urgency,
    xpReward: 5,
    xpPenalty: 0,
    completionCondition: { type: 'flag', key: 'vitamin_d_taken', value: true },
    skippable: true,
  };
}

/**
 * Generate an NPC dialogue nudge task for the highest-priority available NPC.
 * Only one NPC nudge is generated per day.
 * @param {Phaser.Data.DataManager} registry
 * @param {object} [questEngine] - Optional QuestEngine module for prerequisite checks
 * @returns {object|null}
 */
export function generateNPCDialogueTask(registry, questEngine) {
  const currentDay = registry.get(RK.CURRENT_DAY) || 1;
  const dialogueHistory = registry.get(RK.DIALOGUE_HISTORY) || {};

  const available = getAvailableDialogues(currentDay, registry, questEngine);

  // Filter out dialogues already completed
  const pending = available.filter(entry => !dialogueHistory[entry.dialogueId]);

  if (pending.length === 0) return null;

  // Highest priority = first in MISSION_SCHEDULE order (earliest day, then order in array)
  const entry = pending[0];

  return {
    id: `daily_npc_${entry.npcId}`,
    type: 'daily',
    title: `${entry.npcName} seems to want to talk to you`,
    description: `You should go find ${entry.npcName} — they might have something important to say.`,
    urgency: 'normal',
    xpReward: 5,
    xpPenalty: 0,
    completionCondition: { type: 'npcTalked', npcId: entry.npcId },
    skippable: true,
  };
}

/**
 * Generate an exploration nudge task.
 * Triggers if player has visited < 3 distinct locations OR 5+ days since last new location.
 * @param {Phaser.Data.DataManager} registry
 * @returns {object|null}
 */
export function generateExploreTask(registry) {
  const visitedLocations = registry.get(RK.VISITED_LOCATIONS) || [];
  const currentDay = registry.get(RK.CURRENT_DAY) || 1;
  const lastNewLocationDay = registry.get('last_new_location_day') || 0;

  const needsExploring =
    visitedLocations.length < 3 ||
    (lastNewLocationDay > 0 && currentDay - lastNewLocationDay >= 5);

  if (!needsExploring) return null;

  return {
    id: 'daily_explore',
    type: 'daily',
    title: 'Explore a new part of the city',
    description: 'You have been staying close to home. Copenhagen has so much to discover — try visiting somewhere new today.',
    urgency: 'low',
    xpReward: 10,
    xpPenalty: 0,
    completionCondition: { type: 'flag', key: 'explored_new_location_today', value: true },
    skippable: true,
  };
}

/**
 * Generate all daily tasks for the current game state.
 * Returns an array of task objects, deduplicated and ordered by urgency.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} [questEngine] - Optional QuestEngine for NPC nudge prerequisite checks
 * @returns {Array<object>}
 */
export function generateDailyTasks(registry, questEngine) {
  const tasks = [];

  const foodTask = generateFoodTask(registry);
  if (foodTask) tasks.push(foodTask);

  const billTasks = generateBillTasks(registry);
  tasks.push(...billTasks);

  const vitaminDTask = generateVitaminDTask(registry);
  if (vitaminDTask) tasks.push(vitaminDTask);

  const npcTask = generateNPCDialogueTask(registry, questEngine);
  if (npcTask) tasks.push(npcTask);

  const exploreTask = generateExploreTask(registry);
  if (exploreTask) tasks.push(exploreTask);

  return tasks;
}
