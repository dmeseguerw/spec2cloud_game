/**
 * src/state/StateHelpers.js
 * Convenience functions for common state mutations.
 * All functions operate on a Phaser registry (or MockRegistry for testing).
 */

import * as RK from '../constants/RegistryKeys.js';
import * as Events from '../constants/Events.js';
import { XP_THRESHOLDS, MAX_LEVEL } from '../config.js';

/**
 * Add XP and check for level-up.
 * @param {object} registry
 * @param {number} amount - Positive amount of XP to add
 * @param {string} [source='unknown'] - Source of XP gain
 * @returns {{ newXP: number, leveledUp: boolean, newLevel: number }}
 */
export function addXP(registry, amount, source = 'unknown') {
  const currentXP = registry.get(RK.PLAYER_XP) || 0;
  const currentLevel = registry.get(RK.PLAYER_LEVEL) || 1;
  const newXP = currentXP + amount;

  registry.set(RK.PLAYER_XP, newXP);
  registry.events.emit(Events.XP_CHANGED, { xp: newXP, delta: amount, source });

  // Check for level-up
  let newLevel = currentLevel;
  for (let i = currentLevel; i < MAX_LEVEL; i++) {
    if (newXP >= XP_THRESHOLDS[i]) {
      newLevel = i + 1;
    } else {
      break;
    }
  }

  const leveledUp = newLevel > currentLevel;
  if (leveledUp) {
    registry.set(RK.PLAYER_LEVEL, newLevel);
    registry.events.emit(Events.LEVEL_UP, { level: newLevel, xp: newXP });
  }

  return { newXP, leveledUp, newLevel };
}

/**
 * Remove XP with a floor at 0.
 * @param {object} registry
 * @param {number} amount - Positive amount of XP to remove
 * @param {string} [source='unknown']
 * @returns {number} New XP value
 */
export function removeXP(registry, amount, source = 'unknown') {
  const currentXP = registry.get(RK.PLAYER_XP) || 0;
  const newXP = Math.max(0, currentXP - amount);
  registry.set(RK.PLAYER_XP, newXP);
  registry.events.emit(Events.XP_CHANGED, { xp: newXP, delta: -amount, source });
  return newXP;
}

/**
 * Update a skill value, clamped between 0 and 100.
 * @param {object} registry
 * @param {string} skillKey - One of the SKILL_* registry keys
 * @param {number} delta - Amount to add (can be negative)
 * @returns {number} New skill value
 */
export function updateSkill(registry, skillKey, delta) {
  const current = registry.get(skillKey) || 0;
  const newValue = Math.max(0, Math.min(100, current + delta));
  registry.set(skillKey, newValue);
  registry.events.emit(Events.SKILL_CHANGED, { skill: skillKey, value: newValue, delta });
  return newValue;
}

/**
 * Update NPC relationship value, clamped between 0 and 100.
 * @param {object} registry
 * @param {string} npcId
 * @param {number} delta
 * @returns {number} New relationship value
 */
export function updateNPCRelationship(registry, npcId, delta) {
  const relationships = { ...(registry.get(RK.NPC_RELATIONSHIPS) || {}) };
  const current = relationships[npcId] || 50; // Default relationship is neutral (50)
  const newValue = Math.max(0, Math.min(100, current + delta));
  relationships[npcId] = newValue;
  registry.set(RK.NPC_RELATIONSHIPS, relationships);
  registry.events.emit(Events.RELATIONSHIP_CHANGED, { npcId, value: newValue, delta });
  return newValue;
}

/**
 * Add an item to inventory. If item exists, increment quantity.
 * @param {object} registry
 * @param {{ id: string, name: string, quantity?: number, category?: string, spoilsAt?: number }} item
 */
export function addItem(registry, item) {
  const inventory = [...(registry.get(RK.INVENTORY) || [])];
  const existing = inventory.find(i => i.id === item.id);

  if (existing) {
    existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
  } else {
    inventory.push({
      id: item.id,
      name: item.name,
      quantity: item.quantity || 1,
      category: item.category || 'misc',
      spoilsAt: item.spoilsAt || null,
    });
  }

  registry.set(RK.INVENTORY, inventory);
  registry.events.emit(Events.ITEM_ADDED, { item });
}

/**
 * Remove an item (or reduce quantity) from inventory.
 * @param {object} registry
 * @param {string} itemId
 * @param {number} [quantity=1]
 * @returns {boolean} true if removal succeeded
 */
export function removeItem(registry, itemId, quantity = 1) {
  const inventory = [...(registry.get(RK.INVENTORY) || [])];
  const index = inventory.findIndex(i => i.id === itemId);

  if (index === -1) return false;

  const item = { ...inventory[index] };
  if (item.quantity <= quantity) {
    inventory.splice(index, 1);
  } else {
    item.quantity -= quantity;
    inventory[index] = item;
  }

  registry.set(RK.INVENTORY, inventory);
  registry.events.emit(Events.ITEM_REMOVED, { itemId, quantity });
  return true;
}

/**
 * Add DKK to player balance.
 * @param {object} registry
 * @param {number} amount
 * @returns {number} New balance
 */
export function addMoney(registry, amount) {
  const current = registry.get(RK.PLAYER_MONEY) || 0;
  const newBalance = current + amount;
  registry.set(RK.PLAYER_MONEY, newBalance);
  registry.events.emit(Events.MONEY_CHANGED, { balance: newBalance, delta: amount });
  return newBalance;
}

/**
 * Spend DKK. Returns false if insufficient funds (no change made).
 * @param {object} registry
 * @param {number} amount
 * @returns {boolean} true if purchase succeeded
 */
export function spendMoney(registry, amount) {
  const current = registry.get(RK.PLAYER_MONEY) || 0;
  if (current < amount) return false;
  const newBalance = current - amount;
  registry.set(RK.PLAYER_MONEY, newBalance);
  registry.events.emit(Events.MONEY_CHANGED, { balance: newBalance, delta: -amount });
  return true;
}

/**
 * Unlock an encyclopedia entry.
 * @param {object} registry
 * @param {string} entryId
 * @returns {boolean} true if newly unlocked (false if already known)
 */
export function unlockEncyclopediaEntry(registry, entryId) {
  const entries = [...(registry.get(RK.ENCYCLOPEDIA_ENTRIES) || [])];
  if (entries.includes(entryId)) return false;
  entries.push(entryId);
  registry.set(RK.ENCYCLOPEDIA_ENTRIES, entries);
  registry.events.emit(Events.ENCYCLOPEDIA_UNLOCKED, { entryId });
  return true;
}

/**
 * Record a completed encounter.
 * @param {object} registry
 * @param {string} encounterId
 */
export function recordEncounter(registry, encounterId) {
  const history = [...(registry.get(RK.ENCOUNTER_HISTORY) || [])];
  const currentDay = registry.get(RK.CURRENT_DAY) || 1;
  history.push({ id: encounterId, day: currentDay });
  registry.set(RK.ENCOUNTER_HISTORY, history);
}

/**
 * Advance to the next time of day.
 * Cycles: morning → afternoon → evening → night → morning (and increments day).
 * @param {object} registry
 * @returns {{ timeOfDay: string, dayAdvanced: boolean }}
 */
export function advanceTimeOfDay(registry) {
  const periods = ['morning', 'afternoon', 'evening', 'night'];
  const current = registry.get(RK.TIME_OF_DAY) || 'morning';
  const index = periods.indexOf(current);
  const nextIndex = (index + 1) % periods.length;
  const dayAdvanced = nextIndex === 0; // Wrapped back to morning

  registry.set(RK.TIME_OF_DAY, periods[nextIndex]);

  if (dayAdvanced) {
    const currentDay = registry.get(RK.CURRENT_DAY) || 1;
    registry.set(RK.CURRENT_DAY, currentDay + 1);
  }

  registry.events.emit(Events.TIME_ADVANCED, {
    timeOfDay: periods[nextIndex],
    dayAdvanced,
  });

  return { timeOfDay: periods[nextIndex], dayAdvanced };
}

/**
 * Check for and remove spoiled food items.
 * Items with a `spoilsAt` day that is less than or equal to the current day are removed.
 * @param {object} registry
 * @returns {Array} Array of removed spoiled items
 */
export function checkSpoiledFood(registry) {
  const inventory = registry.get(RK.INVENTORY) || [];
  const currentDay = registry.get(RK.CURRENT_DAY) || 1;

  const spoiled = inventory.filter(item => item.spoilsAt !== null && item.spoilsAt !== undefined && item.spoilsAt <= currentDay);
  const fresh = inventory.filter(item => item.spoilsAt === null || item.spoilsAt === undefined || item.spoilsAt > currentDay);

  if (spoiled.length > 0) {
    registry.set(RK.INVENTORY, fresh);
    for (const item of spoiled) {
      registry.events.emit(Events.ITEM_REMOVED, { itemId: item.id, quantity: item.quantity, reason: 'spoiled' });
    }
  }

  return spoiled;
}
