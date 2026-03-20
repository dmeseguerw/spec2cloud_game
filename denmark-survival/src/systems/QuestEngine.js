/**
 * src/systems/QuestEngine.js
 * Core Quest & Objectives engine — manages task lifecycle, XP rewards/penalties,
 * completion condition evaluation, and end-of-day resolution.
 *
 * Pure module: no Phaser scene imports. All interaction goes through the registry
 * and the registry event bus (registry.events.emit / .on).
 *
 * Usage:
 *   import * as QuestEngine from '../systems/QuestEngine.js';
 *   QuestEngine.addTask(registry, taskObject);
 *   QuestEngine.checkCompletionConditions(registry, 'inventory:added', { itemId: 'apple', quantity: 1 });
 */

import * as RK from '../constants/RegistryKeys.js';
import { grantXP, penalizeXP } from './XPEngine.js';
import { MISSIONS } from '../data/missions.js';

// ─────────────────────────────────────────────────────────────────────────────
// Urgency priority order (higher index = higher priority)
// ─────────────────────────────────────────────────────────────────────────────

const URGENCY_ORDER = { low: 0, normal: 1, urgent: 2, critical: 3 };

// ─────────────────────────────────────────────────────────────────────────────
// Event names
// ─────────────────────────────────────────────────────────────────────────────

export const QUEST_TASK_ADDED     = 'quest:taskAdded';
export const QUEST_TASK_COMPLETED = 'quest:taskCompleted';
export const QUEST_TASK_FAILED    = 'quest:taskFailed';
export const QUEST_TASK_SKIPPED   = 'quest:taskSkipped';

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a fresh copy of the ACTIVE_TASKS array from the registry.
 * @param {object} registry
 * @returns {object[]}
 */
function getActiveTasksRaw(registry) {
  return [...(registry.get(RK.ACTIVE_TASKS) ?? [])];
}

/**
 * Return a fresh copy of the COMPLETED_TASKS array from the registry.
 * @param {object} registry
 * @returns {object[]}
 */
function getCompletedTasksRaw(registry) {
  return [...(registry.get(RK.COMPLETED_TASKS) ?? [])];
}

/**
 * Write back the active tasks array to the registry.
 * @param {object} registry
 * @param {object[]} tasks
 */
function setActiveTasks(registry, tasks) {
  registry.set(RK.ACTIVE_TASKS, tasks);
}

/**
 * Write back the completed tasks array to the registry.
 * @param {object} registry
 * @param {object[]} tasks
 */
function setCompletedTasks(registry, tasks) {
  registry.set(RK.COMPLETED_TASKS, tasks);
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a task to ACTIVE_TASKS and emit quest:taskAdded.
 *
 * @param {object} registry
 * @param {object} taskObject - Full task object matching the task schema.
 */
export function addTask(registry, taskObject) {
  const active = getActiveTasksRaw(registry);
  // Prevent duplicate IDs
  if (active.some(t => t.id === taskObject.id)) return;
  active.push({ ...taskObject, status: 'active' });
  setActiveTasks(registry, active);
  registry.events.emit(QUEST_TASK_ADDED, { task: taskObject });
}

/**
 * Mark a task as completed, grant XP, and move it to COMPLETED_TASKS.
 * Emits quest:taskCompleted.
 *
 * @param {object} registry
 * @param {string} taskId
 */
export function completeTask(registry, taskId) {
  const active = getActiveTasksRaw(registry);
  const idx = active.findIndex(t => t.id === taskId);
  if (idx === -1) return;

  const task = { ...active[idx] };
  task.status = 'completed';
  task.completedDay = registry.get(RK.CURRENT_DAY) ?? 1;

  active.splice(idx, 1);
  setActiveTasks(registry, active);

  const completed = getCompletedTasksRaw(registry);
  completed.push(task);
  setCompletedTasks(registry, completed);

  if (task.xpReward > 0) {
    grantXP(registry, task.xpReward, 'quest', 'task');
  }

  registry.events.emit(QUEST_TASK_COMPLETED, { task });
}

/**
 * Mark a task as failed, apply XP penalty, and move it to COMPLETED_TASKS.
 * Emits quest:taskFailed.
 *
 * @param {object} registry
 * @param {string} taskId
 */
export function failTask(registry, taskId) {
  const active = getActiveTasksRaw(registry);
  const idx = active.findIndex(t => t.id === taskId);
  if (idx === -1) return;

  const task = { ...active[idx] };
  task.status = 'failed';
  task.completedDay = registry.get(RK.CURRENT_DAY) ?? 1;

  active.splice(idx, 1);
  setActiveTasks(registry, active);

  const completed = getCompletedTasksRaw(registry);
  completed.push(task);
  setCompletedTasks(registry, completed);

  if (task.xpPenalty > 0) {
    penalizeXP(registry, task.xpPenalty, 'quest', 'task');
  }

  registry.events.emit(QUEST_TASK_FAILED, { task });
}

/**
 * Mark a skippable task as skipped. No-op if task.skippable is false.
 * Moves the task to COMPLETED_TASKS with status "skipped" and emits quest:taskSkipped.
 *
 * @param {object} registry
 * @param {string} taskId
 */
export function skipTask(registry, taskId) {
  const active = getActiveTasksRaw(registry);
  const idx = active.findIndex(t => t.id === taskId);
  if (idx === -1) return;

  const task = active[idx];
  if (!task.skippable) return;

  const skipped = { ...task, status: 'skipped' };
  active.splice(idx, 1);
  setActiveTasks(registry, active);

  const completed = getCompletedTasksRaw(registry);
  completed.push(skipped);
  setCompletedTasks(registry, completed);

  registry.events.emit(QUEST_TASK_SKIPPED, { task: skipped });
}

/**
 * Return active tasks sorted by urgency priority:
 *   critical > urgent > story > normal > low
 *
 * Within the same urgency, story missions come before daily tasks.
 *
 * @param {object} registry
 * @returns {object[]}
 */
export function getActiveTasks(registry) {
  const active = getActiveTasksRaw(registry);
  return active.slice().sort((a, b) => {
    const ua = URGENCY_ORDER[a.urgency] ?? 0;
    const ub = URGENCY_ORDER[b.urgency] ?? 0;
    if (ub !== ua) return ub - ua;
    // Same urgency: story before daily
    const typeA = a.type === 'story' ? 1 : 0;
    const typeB = b.type === 'story' ? 1 : 0;
    return typeB - typeA;
  });
}

/**
 * Return the first active task with type === "story", or null.
 *
 * @param {object} registry
 * @returns {object|null}
 */
export function getActiveStoryMission(registry) {
  const active = getActiveTasksRaw(registry);
  return active.find(t => t.type === 'story') ?? null;
}

/**
 * Return the COMPLETED_TASKS array.
 *
 * @param {object} registry
 * @returns {object[]}
 */
export function getCompletedTasks(registry) {
  return getCompletedTasksRaw(registry);
}

/**
 * Return the tracked task: the task matching TRACKED_TASK_ID if set and active,
 * otherwise the highest-priority active task.
 *
 * @param {object} registry
 * @returns {object|null}
 */
export function getTrackedTask(registry) {
  const trackedId = registry.get(RK.TRACKED_TASK_ID);
  if (trackedId) {
    const active = getActiveTasksRaw(registry);
    const found = active.find(t => t.id === trackedId);
    if (found) return found;
  }
  const sorted = getActiveTasks(registry);
  return sorted[0] ?? null;
}

/**
 * Pin a specific task as the tracked task.
 *
 * @param {object} registry
 * @param {string} taskId
 */
export function setTrackedTask(registry, taskId) {
  registry.set(RK.TRACKED_TASK_ID, taskId);
}

/**
 * Check all active tasks against an incoming game event and auto-complete
 * any whose completionCondition is satisfied.
 *
 * Supported event/condition mappings:
 *   "flag:set"         + { key, value }           → condition type "flag"
 *   "inventory:added"  + { itemId, quantity }      → condition type "hasItem"
 *   "dialogue:ended"   + { npcId }                 → condition type "npcTalked"
 *   "location:entered" + { locationId }            → condition type "locationVisited"
 *   "shop:purchased"   + { amount }                → condition type "moneySpent"
 *   "pant:returned"    + { count }                 → condition type "pantReturned"
 *   "inventory:used"   + { itemId }                → condition type "itemUsed"
 *   "day:started"      + { day }                   → condition type "dayReached"
 *
 * @param {object} registry
 * @param {string} eventType
 * @param {object} eventData
 */
export function checkCompletionConditions(registry, eventType, eventData) {
  const active = getActiveTasksRaw(registry);

  // Handle cumulative pant counter
  if (eventType === 'pant:returned') {
    const flags = { ...(registry.get(RK.GAME_FLAGS) ?? {}) };
    flags.pant_returned_total = (flags.pant_returned_total ?? 0) + (eventData.count ?? 0);
    registry.set(RK.GAME_FLAGS, flags);
  }

  // Collect IDs to complete (avoid mutating while iterating)
  const toComplete = [];

  for (const task of active) {
    const cond = task.completionCondition;
    if (!cond) continue;
    if (_evaluateCondition(registry, cond, eventType, eventData)) {
      toComplete.push(task.id);
    }
  }

  for (const id of toComplete) {
    completeTask(registry, id);
  }
}

/**
 * End-of-day resolution for active daily tasks:
 *   - urgent/critical unfinished → failTask (XP penalty)
 *   - otherwise → skipTask (silent expiry)
 * All remaining active daily tasks are cleared after evaluation.
 *
 * @param {object} registry
 * @param {number} currentDay
 */
export function evaluateEndOfDay(registry, currentDay) {
  const active = getActiveTasksRaw(registry);
  const dailyIds = active.filter(t => t.type === 'daily').map(t => t.id);

  for (const id of dailyIds) {
    // Re-read after each mutation (completeTask/failTask mutate the array)
    const tasks = getActiveTasksRaw(registry);
    const task = tasks.find(t => t.id === id);
    if (!task) continue;

    if (task.urgency === 'critical' || task.urgency === 'urgent') {
      failTask(registry, id);
    } else {
      skipTask(registry, id);
    }
  }
}

/**
 * Look up a mission definition by missionId from the MISSIONS data file.
 * Returns null if not found (graceful stub handling for Task 027).
 *
 * @param {string} missionId
 * @returns {object|null}
 */
export function getMissionDefinition(missionId) {
  return MISSIONS[missionId] ?? null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal — condition evaluator
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Evaluate a single completion condition against an incoming event.
 *
 * @param {object} registry
 * @param {object} cond        - completionCondition object
 * @param {string} eventType   - incoming event name
 * @param {object} eventData   - incoming event payload
 * @returns {boolean}
 */
function _evaluateCondition(registry, cond, eventType, eventData) {
  switch (cond.type) {
    case 'flag': {
      if (eventType !== 'flag:set') return false;
      return eventData.key === cond.key && eventData.value === cond.value;
    }

    case 'hasItem': {
      if (eventType !== 'inventory:added') return false;
      if (eventData.itemId !== cond.itemId) return false;
      // Check that the player now has at least minQuantity
      const inventory = registry.get(RK.INVENTORY) ?? [];
      const entry = inventory.find(e => e.itemId === cond.itemId);
      const qty = entry ? (entry.quantity ?? 1) : 0;
      return qty >= (cond.minQuantity ?? 1);
    }

    case 'npcTalked': {
      if (eventType !== 'dialogue:ended') return false;
      return eventData.npcId === cond.npcId;
    }

    case 'locationVisited': {
      if (eventType !== 'location:entered') return false;
      // null locationId acts as a wildcard — any location satisfies the condition
      if (cond.locationId === null || cond.locationId === undefined) return true;
      return eventData.locationId === cond.locationId;
    }

    case 'moneySpent': {
      if (eventType !== 'shop:purchased') return false;
      return (eventData.amount ?? 0) >= (cond.minAmount ?? 0);
    }

    case 'pantReturned': {
      if (eventType !== 'pant:returned') return false;
      const flags = registry.get(RK.GAME_FLAGS) ?? {};
      return (flags.pant_returned_total ?? 0) >= (cond.minCount ?? 1);
    }

    case 'itemUsed': {
      if (eventType !== 'inventory:used') return false;
      return eventData.itemId === cond.itemId;
    }

    case 'dayReached': {
      if (eventType !== 'day:started') return false;
      return (eventData.day ?? 0) >= cond.day;
    }

    default:
      return false;
  }
}
