/**
 * src/systems/RelationshipSystem.js
 * Manages NPC relationship values, stage tracking, and availability.
 *
 * Relationship scale (0–100):
 *  0–19   → Stranger
 *  20–39  → Acquaintance
 *  40–59  → Friendly
 *  60–79  → Friend
 *  80–100 → Close Friend
 *
 * XP impact (granted automatically by changeRelationship):
 *  - Positive interaction: +15 XP
 *  - Negative interaction: -10 XP
 *  - Stage transition up:  +40 XP (in addition to interaction XP)
 */

import * as RK from '../constants/RegistryKeys.js';
import { RELATIONSHIP_CHANGED, RELATIONSHIP_STAGE_CHANGED } from '../constants/Events.js';
import { grantXP, penalizeXP } from './XPEngine.js';
import { NPCS } from '../data/npcs.js';

// ─────────────────────────────────────────────────────────────────────────────
// Stage definitions
// ─────────────────────────────────────────────────────────────────────────────

/** Ordered list of relationship stage descriptors (lowest → highest). */
export const RELATIONSHIP_STAGES = [
  { name: 'Stranger',     min: 0,  max: 19  },
  { name: 'Acquaintance', min: 20, max: 39  },
  { name: 'Friendly',     min: 40, max: 59  },
  { name: 'Friend',       min: 60, max: 79  },
  { name: 'Close Friend', min: 80, max: 100 },
];

/** Numeric rank of each stage name (for transition direction comparison). */
const STAGE_RANK = {
  'Stranger':     0,
  'Acquaintance': 1,
  'Friendly':     2,
  'Friend':       3,
  'Close Friend': 4,
};

// ─────────────────────────────────────────────────────────────────────────────
// XP constants
// ─────────────────────────────────────────────────────────────────────────────

/** XP granted when a relationship stage increases. */
export const XP_STAGE_UP = 40;

/** XP granted for any positive relationship interaction. */
export const XP_POSITIVE_INTERACTION = 15;

/** XP penalized for a negative relationship interaction. */
export const XP_NEGATIVE_INTERACTION = 10;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the current relationship value (0–100) for an NPC.
 * Falls back to the NPC's startingRelationship if not yet recorded.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @returns {number}
 */
export function getRelationship(registry, npcId) {
  const map = _getRelationshipMap(registry);
  if (map[npcId] !== undefined) return map[npcId];
  const npc = NPCS.find(n => n.id === npcId);
  return npc ? npc.startingRelationship : 0;
}

/**
 * Modify an NPC's relationship value by `delta`, clamped to [0, 100].
 * Automatically emits RELATIONSHIP_CHANGED; emits RELATIONSHIP_STAGE_CHANGED
 * and grants XP when a stage boundary is crossed.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @param {number} delta - Amount to add (negative to reduce).
 * @param {string} [reason] - Human-readable reason label.
 * @returns {{ newValue: number, stageChanged: boolean, oldStage: string, newStage: string }}
 */
export function changeRelationship(registry, npcId, delta, reason = '') {
  const oldValue = getRelationship(registry, npcId);
  const oldStage = _valueToStage(oldValue);

  const newValue = Math.min(100, Math.max(0, oldValue + delta));
  const newStage = _valueToStage(newValue);

  const map = _getRelationshipMap(registry);
  map[npcId] = newValue;
  _setRelationshipMap(registry, map);

  registry.events.emit(RELATIONSHIP_CHANGED, { npcId, oldValue, newValue, delta, reason });

  // Grant or penalize XP based on interaction direction
  if (delta > 0) {
    grantXP(registry, XP_POSITIVE_INTERACTION, `Positive interaction with ${npcId}`, 'Social');
  } else if (delta < 0) {
    penalizeXP(registry, XP_NEGATIVE_INTERACTION, `Negative interaction with ${npcId}`, 'Social');
  }

  const stageChanged = newStage !== oldStage;

  if (stageChanged && STAGE_RANK[newStage] > STAGE_RANK[oldStage]) {
    registry.events.emit(RELATIONSHIP_STAGE_CHANGED, { npcId, oldStage, newStage });
    grantXP(registry, XP_STAGE_UP, `Relationship milestone with ${npcId}`, 'Social');
  } else if (stageChanged) {
    // Stage went down — still emit stage-changed but no XP bonus
    registry.events.emit(RELATIONSHIP_STAGE_CHANGED, { npcId, oldStage, newStage });
  }

  return { newValue, stageChanged, oldStage, newStage };
}

/**
 * Return the relationship stage name for an NPC.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @returns {string} Stage name.
 */
export function getRelationshipStage(registry, npcId) {
  return _valueToStage(getRelationship(registry, npcId));
}

/**
 * Check whether the NPC's current relationship value sits at a stage boundary
 * (i.e. the stage has recently changed or is at a threshold).
 * Returns the current stage and value without side-effects.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} npcId
 * @returns {{ stage: string, value: number }}
 */
export function checkStageTransition(registry, npcId) {
  const value = getRelationship(registry, npcId);
  const stage = _valueToStage(value);
  return { stage, value };
}

/**
 * Return all NPC objects whose schedule puts them at `location` during
 * `timeOfDay`. NPCs with null schedule for that time are excluded.
 *
 * @param {Phaser.Data.DataManager} registry - Unused but kept for API consistency.
 * @param {string} location - Location identifier (e.g. 'grocery_store').
 * @param {string} timeOfDay - One of: 'morning' | 'afternoon' | 'evening' | 'night'.
 * @returns {Array<object>} Array of NPC data objects available at that location/time.
 */
export function getAvailableNPCsAtLocation(registry, location, timeOfDay) {
  return NPCS.filter(npc => {
    const scheduled = npc.schedule[timeOfDay];
    return scheduled === location;
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Retrieve the full relationship map from registry.
 * @param {Phaser.Data.DataManager} registry
 * @returns {Object.<string, number>}
 */
function _getRelationshipMap(registry) {
  return registry.get(RK.NPC_RELATIONSHIPS) ?? {};
}

/**
 * Write the relationship map back to registry.
 * @param {Phaser.Data.DataManager} registry
 * @param {Object.<string, number>} map
 */
function _setRelationshipMap(registry, map) {
  registry.set(RK.NPC_RELATIONSHIPS, map);
}

/**
 * Convert a relationship value (0–100) to a stage name.
 * @param {number} value
 * @returns {string}
 */
function _valueToStage(value) {
  if (value >= 80) return 'Close Friend';
  if (value >= 60) return 'Friend';
  if (value >= 40) return 'Friendly';
  if (value >= 20) return 'Acquaintance';
  return 'Stranger';
}
