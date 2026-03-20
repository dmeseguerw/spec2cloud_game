/**
 * src/systems/QuestEngine.js
 * Pure-function quest/mission engine with registry injection.
 *
 * Responsibilities:
 *  - Add / complete tasks (missions or daily tasks)
 *  - Query active and completed task lists
 *  - Check completion conditions against game state
 *  - Emit quest lifecycle events via registry.events
 *
 * All functions accept a Phaser-compatible registry as their first argument.
 */

import {
  ACTIVE_QUESTS,
  COMPLETED_QUESTS,
  GAME_FLAGS,
  VISITED_LOCATIONS,
  DIALOGUE_HISTORY,
  CURRENT_DAY,
  PANT_BOTTLES,
} from '../constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Task management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a task to the active quest list.
 * The task is stored by its `id` to prevent duplicates.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} task - Task object with at least an `id` property.
 */
export function addTask(registry, task) {
  const active = { ...(registry.get(ACTIVE_QUESTS) || {}) };
  active[task.id] = task;
  registry.set(ACTIVE_QUESTS, active);
  registry.events.emit('quest:added', { task });
}

/**
 * Move a task from the active list to the completed list.
 * No-op if the task is not currently active.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} taskId
 */
export function completeTask(registry, taskId) {
  const active = { ...(registry.get(ACTIVE_QUESTS) || {}) };
  const task = active[taskId];
  if (!task) return;

  delete active[taskId];
  registry.set(ACTIVE_QUESTS, active);

  const completed = { ...(registry.get(COMPLETED_QUESTS) || {}) };
  completed[taskId] = { ...task, completedAt: Date.now() };
  registry.set(COMPLETED_QUESTS, completed);

  registry.events.emit('quest:completed', { taskId, task });
}

// ─────────────────────────────────────────────────────────────────────────────
// Query helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return an array of all currently active tasks.
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>}
 */
export function getActiveTasks(registry) {
  return Object.values(registry.get(ACTIVE_QUESTS) || {});
}

/**
 * Return an array of all completed tasks.
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>}
 */
export function getCompletedTasks(registry) {
  return Object.values(registry.get(COMPLETED_QUESTS) || {});
}

/**
 * Check whether a specific task is currently active.
 * @param {Phaser.Data.DataManager} registry
 * @param {string} taskId
 * @returns {boolean}
 */
export function isTaskActive(registry, taskId) {
  const active = registry.get(ACTIVE_QUESTS) || {};
  return taskId in active;
}

/**
 * Check whether a specific task has been completed.
 * @param {Phaser.Data.DataManager} registry
 * @param {string} taskId
 * @returns {boolean}
 */
export function isTaskCompleted(registry, taskId) {
  const completed = registry.get(COMPLETED_QUESTS) || {};
  return taskId in completed;
}

// ─────────────────────────────────────────────────────────────────────────────
// Completion condition checker
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether a single completion condition is satisfied by the current
 * game state stored in the registry.
 *
 * Supported condition types:
 *   - `{ type: "flag", key, value }` — GAME_FLAGS[key] === value
 *   - `{ type: "locationVisited", locationId }` — VISITED_LOCATIONS includes locationId
 *   - `{ type: "npcTalked", npcId }` — DIALOGUE_HISTORY has an entry for npcId
 *   - `{ type: "dayReached", day }` — CURRENT_DAY >= day
 *   - `{ type: "pantReturned", minCount }` — PANT_BOTTLES >= minCount
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {object} condition
 * @returns {boolean}
 */
export function checkCompletionCondition(registry, condition) {
  if (!condition) return true;

  switch (condition.type) {
    case 'flag': {
      const flags = registry.get(GAME_FLAGS) || {};
      return flags[condition.key] === condition.value;
    }

    case 'locationVisited': {
      const visited = registry.get(VISITED_LOCATIONS) || [];
      return visited.includes(condition.locationId);
    }

    case 'npcTalked': {
      const history = registry.get(DIALOGUE_HISTORY) || {};
      return Object.values(history).some(entry => entry.npcId === condition.npcId);
    }

    case 'dayReached': {
      const currentDay = registry.get(CURRENT_DAY) || 1;
      return currentDay >= condition.day;
    }

    case 'pantReturned': {
      const bottles = registry.get(PANT_BOTTLES) || 0;
      return bottles >= condition.minCount;
    }

    default:
      return false;
  }
}
