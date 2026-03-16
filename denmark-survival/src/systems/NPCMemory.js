/**
 * src/systems/NPCMemory.js
 * Tracks interaction history between the player and each NPC.
 *
 * All history is stored in the registry under NPC_MEMORY as a plain object:
 *   { [npcId]: Array<{ type, outcome, timestamp }>, ... }
 *
 * Memory affects dialogue and NPC reactions to the player's reputation.
 */

import * as RK from '../constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record an interaction with an NPC.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @param {string} interactionType - Category of interaction (e.g. 'dialogue', 'quest', 'greeting').
 * @param {string} outcome - Result of the interaction (e.g. 'positive', 'negative', 'neutral').
 * @returns {{ npcId: string, type: string, outcome: string, timestamp: number }}
 *   The recorded entry.
 */
export function recordInteraction(registry, npcId, interactionType, outcome) {
  const memory = _getMemoryMap(registry);
  if (!memory[npcId]) {
    memory[npcId] = [];
  }
  const entry = { type: interactionType, outcome, timestamp: Date.now() };
  memory[npcId].push(entry);
  _setMemoryMap(registry, memory);
  return entry;
}

/**
 * Get the full interaction history for an NPC (oldest first).
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @returns {Array<{ type: string, outcome: string, timestamp: number }>}
 */
export function getInteractionHistory(registry, npcId) {
  const memory = _getMemoryMap(registry);
  return memory[npcId] ? [...memory[npcId]] : [];
}

/**
 * Check whether the player has ever met (interacted with) an NPC.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @returns {boolean}
 */
export function hasMetNPC(registry, npcId) {
  const memory = _getMemoryMap(registry);
  return Array.isArray(memory[npcId]) && memory[npcId].length > 0;
}

/**
 * Get the most recent interaction with an NPC, or null if never met.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @returns {{ type: string, outcome: string, timestamp: number } | null}
 */
export function getLastInteraction(registry, npcId) {
  const history = getInteractionHistory(registry, npcId);
  return history.length > 0 ? history[history.length - 1] : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the full NPC memory map from the registry.
 * @param {Phaser.Data.DataManager} registry
 * @returns {Object.<string, Array>}
 */
function _getMemoryMap(registry) {
  return registry.get(RK.NPC_MEMORY) ?? {};
}

/**
 * Write the full NPC memory map back to the registry.
 * @param {Phaser.Data.DataManager} registry
 * @param {Object.<string, Array>} map
 */
function _setMemoryMap(registry, map) {
  registry.set(RK.NPC_MEMORY, map);
}
