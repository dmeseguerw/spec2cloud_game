/**
 * src/systems/DialogueEngine.js
 * Branching dialogue engine for NPC conversations.
 *
 * Responsibilities:
 *  - Load and start dialogue trees by conversationId
 *  - Track current node and conversation state
 *  - Check response conditions (languageLevel, relationship, hasItem, flag, skill)
 *  - Apply response effects (xp, relationship, item, encyclopedia, skill, flag)
 *  - Emit lifecycle events (DIALOGUE_STARTED, DIALOGUE_ENDED, DIALOGUE_NODE_CHANGED)
 *  - Record dialogue history in the registry for save/load persistence
 *
 * Usage:
 *   const engine = new DialogueEngine();
 *   engine.registerDialogue('lars_day1_tutorial', lars_day1_tutorial);
 *   engine.startDialogue(registry, 'lars', 'lars_day1_tutorial');
 *   const node = engine.getCurrentNode();
 *   const responses = engine.getAvailableResponses(registry);
 *   engine.selectResponse(registry, 0);
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  DIALOGUE_STARTED,
  DIALOGUE_ENDED,
  DIALOGUE_NODE_CHANGED,
  DIALOGUE_RESPONSE_SELECTED,
} from '../constants/Events.js';
import { grantXP } from './XPEngine.js';
import { changeRelationship } from './RelationshipSystem.js';
import { getSkillLevel, incrementSkill } from './SkillSystem.js';
import { ENCYCLOPEDIA_UNLOCKED } from '../constants/Events.js';
import { addTask, getMissionDefinition } from './QuestEngine.js';

// ─────────────────────────────────────────────────────────────────────────────
// Internal helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Maps short skill names (used in effect/condition JSON) to RegistryKeys.
 * @type {Record<string, string>}
 */
const SKILL_KEY_MAP = {
  language:    RK.SKILL_LANGUAGE,
  cycling:     RK.SKILL_CYCLING,
  cultural:    RK.SKILL_CULTURAL,
  bureaucracy: RK.SKILL_BUREAUCRACY,
};

/**
 * Resolve a short skill name or full registry key to a canonical registry key.
 * Returns null if unknown.
 * @param {string} key
 * @returns {string|null}
 */
function resolveSkillKey(key) {
  if (!key) return null;
  if (SKILL_KEY_MAP[key]) return SKILL_KEY_MAP[key];
  // Accept full registry keys as-is (e.g. 'skill_language')
  if (Object.values(SKILL_KEY_MAP).includes(key)) return key;
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// DialogueEngine class
// ─────────────────────────────────────────────────────────────────────────────

export class DialogueEngine {
  constructor() {
    /** @type {Map<string, object>} conversationId → dialogue data */
    this._dialogues = new Map();

    /** Currently active dialogue data object, or null. */
    this._current = null;

    /** Id of the current dialogue node, or null. */
    this._currentNodeId = null;

    /** Whether a conversation is in progress. */
    this._active = false;

    /** NPC id of the current conversation partner. */
    this._npcId = null;
  }

  // ─── Registration ──────────────────────────────────────────────────────────

  /**
   * Register a dialogue data object so it can be started by conversationId.
   * Call this once during game initialisation for each dialogue file.
   *
   * @param {string} conversationId
   * @param {object} data - Dialogue data object (matches the JSON schema).
   */
  registerDialogue(conversationId, data) {
    this._dialogues.set(conversationId, data);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /**
   * Begin a conversation.
   * Emits DIALOGUE_STARTED on registry.events.
   *
   * @param {Phaser.Data.DataManager} registry
   * @param {string} npcId
   * @param {string} conversationId
   * @throws {Error} if the conversationId has not been registered.
   */
  startDialogue(registry, npcId, conversationId) {
    const data = this._dialogues.get(conversationId);
    if (!data) {
      throw new Error(`[DialogueEngine] Dialogue not registered: "${conversationId}"`);
    }

    this._current = data;
    this._currentNodeId = data.rootNode;
    this._active = true;
    this._npcId = npcId;

    registry.events.emit(DIALOGUE_STARTED, { npcId, conversationId });
    registry.events.emit(DIALOGUE_NODE_CHANGED, { node: this.getCurrentNode() });
  }

  /**
   * End the current conversation, reset state, and emit DIALOGUE_ENDED.
   *
   * @param {Phaser.Data.DataManager} registry
   */
  endDialogue(registry) {
    if (!this._active) return;

    const npcId = this._npcId;
    const conversationId = this._current ? this._current.conversationId : null;

    // Record in dialogue history for persistence
    if (registry && conversationId) {
      const history = registry.get(RK.DIALOGUE_HISTORY) || {};
      history[conversationId] = {
        npcId,
        completedAt: registry.get(RK.CURRENT_DAY) || 1,
        lastNode: this._currentNodeId,
      };
      registry.set(RK.DIALOGUE_HISTORY, history);
    }

    this._active = false;
    this._current = null;
    this._currentNodeId = null;
    this._npcId = null;

    if (registry) {
      registry.events.emit(DIALOGUE_ENDED, { npcId, conversationId });
    }
  }

  // ─── State accessors ───────────────────────────────────────────────────────

  /**
   * Return the current dialogue node object, or null if inactive.
   * @returns {object|null}
   */
  getCurrentNode() {
    if (!this._active || !this._current) return null;
    return this._current.nodes[this._currentNodeId] || null;
  }

  /**
   * Whether a conversation is currently active.
   * @returns {boolean}
   */
  isConversationActive() {
    return this._active;
  }

  // ─── Responses ─────────────────────────────────────────────────────────────

  /**
   * Return all responses for the current node, annotated with availability.
   * Each response gains a `locked` boolean (true = condition not met) and
   * a `lockReason` string explaining the requirement when locked.
   *
   * @param {Phaser.Data.DataManager} registry
   * @returns {Array<object>} Annotated response objects.
   */
  getAvailableResponses(registry) {
    const node = this.getCurrentNode();
    if (!node) return [];

    return node.responses.map((resp, index) => {
      const locked = resp.condition
        ? !this._checkCondition(registry, resp.condition)
        : false;
      return {
        ...resp,
        index,
        locked,
        lockReason: locked ? this._getLockReason(resp.condition) : null,
      };
    });
  }

  /**
   * Select a response by its index, apply all effects, and advance the node.
   * Locked responses can still be selected (scene layer should prevent this,
   * but engine does not enforce it — conditions are informational here).
   * Emits DIALOGUE_RESPONSE_SELECTED and DIALOGUE_NODE_CHANGED (or DIALOGUE_ENDED).
   *
   * @param {Phaser.Data.DataManager} registry
   * @param {number} responseIndex
   */
  selectResponse(registry, responseIndex) {
    const node = this.getCurrentNode();
    if (!node) return;

    const responses = node.responses;
    if (responseIndex < 0 || responseIndex >= responses.length) return;

    const response = responses[responseIndex];

    registry.events.emit(DIALOGUE_RESPONSE_SELECTED, {
      responseIndex,
      response,
    });

    // Apply all effects
    this._applyEffects(registry, response.effects || []);

    // Advance to next node or end conversation
    if (response.nextNode) {
      this._currentNodeId = response.nextNode;
      const nextNode = this.getCurrentNode();
      if (nextNode && nextNode.endConversation) {
        registry.events.emit(DIALOGUE_NODE_CHANGED, { node: nextNode });
        // endConversation nodes auto-end after display (scene handles timing)
      } else {
        registry.events.emit(DIALOGUE_NODE_CHANGED, { node: nextNode });
      }
    } else {
      this.endDialogue(registry);
    }
  }

  // ─── Condition checking ────────────────────────────────────────────────────

  /**
   * Check whether a response condition is satisfied.
   *
   * Supported condition types:
   *   - `{ type: "languageLevel", level: N }` — language skill level >= N
   *   - `{ type: "relationship", npcId: "id", value: N }` — relationship >= N
   *   - `{ type: "hasItem", itemId: "id" }` — item in inventory
   *   - `{ type: "flag", key: "k", value: v }` — game flag equals value
   *   - `{ type: "skill", skillKey: "language", level: N }` — skill level >= N
   *
   * @param {Phaser.Data.DataManager} registry
   * @param {object} condition
   * @returns {boolean}
   */
  _checkCondition(registry, condition) {
    if (!condition) return true;

    switch (condition.type) {
      case 'languageLevel': {
        const level = getSkillLevel(registry, RK.SKILL_LANGUAGE);
        return level >= (condition.level || 1);
      }

      case 'relationship': {
        const npcId = condition.npcId || this._npcId;
        const relMap = registry.get(RK.NPC_RELATIONSHIPS) || {};
        const value = relMap[npcId] ?? 0;
        return value >= (condition.value || 0);
      }

      case 'hasItem': {
        const inventory = registry.get(RK.INVENTORY) || [];
        return inventory.some(
          item => (typeof item === 'string' ? item : item.id) === condition.itemId,
        );
      }

      case 'flag': {
        const flags = registry.get(RK.GAME_FLAGS) || {};
        return flags[condition.key] === condition.value;
      }

      case 'skill': {
        const skillKey = resolveSkillKey(condition.skillKey);
        if (!skillKey) return false;
        const level = getSkillLevel(registry, skillKey);
        return level >= (condition.level || 1);
      }

      default:
        return true;
    }
  }

  /**
   * Build a human-readable lock reason string for a condition.
   * @param {object} condition
   * @returns {string}
   */
  _getLockReason(condition) {
    if (!condition) return '';
    switch (condition.type) {
      case 'languageLevel':
        return `Requires Danish Level ${condition.level}`;
      case 'relationship':
        return `Requires relationship ≥ ${condition.value}`;
      case 'hasItem':
        return `Requires item: ${condition.itemId}`;
      case 'flag':
        return `Requires: ${condition.key} = ${condition.value}`;
      case 'skill': {
        const name = condition.skillKey
          ? condition.skillKey.charAt(0).toUpperCase() + condition.skillKey.slice(1)
          : 'Skill';
        return `Requires ${name} Level ${condition.level}`;
      }
      default:
        return 'Condition not met';
    }
  }

  // ─── Effect application ────────────────────────────────────────────────────

  /**
   * Apply an array of effects to the registry.
   *
   * Supported effect types:
   *   - `{ type: "xp", amount: N }` — grant XP
   *   - `{ type: "relationship", npcId: "id", delta: N }` — change relationship
   *   - `{ type: "item", itemId: "id", action: "give"|"take" }` — add/remove item
   *   - `{ type: "encyclopedia", entryId: "id" }` — unlock encyclopedia entry
   *   - `{ type: "skill", skillKey: "language", delta: N }` — increment skill
   *   - `{ type: "flag", key: "k", value: v }` — set game flag
   *
   * @param {Phaser.Data.DataManager} registry
   * @param {Array<object>} effects
   */
  _applyEffects(registry, effects) {
    for (const effect of effects) {
      this._applyEffect(registry, effect);
    }
  }

  /**
   * Apply a single effect.
   * @param {Phaser.Data.DataManager} registry
   * @param {object} effect
   */
  _applyEffect(registry, effect) {
    switch (effect.type) {
      case 'xp': {
        grantXP(registry, effect.amount || 0, 'dialogue', 'social');
        break;
      }

      case 'relationship': {
        const npcId = effect.npcId || this._npcId;
        changeRelationship(registry, npcId, effect.delta || 0, 'dialogue');
        break;
      }

      case 'item': {
        const inventory = [...(registry.get(RK.INVENTORY) || [])];
        if (effect.action === 'give') {
          inventory.push({ id: effect.itemId });
          registry.set(RK.INVENTORY, inventory);
        } else if (effect.action === 'take') {
          const idx = inventory.findIndex(
            item => (typeof item === 'string' ? item : item.id) === effect.itemId,
          );
          if (idx !== -1) {
            inventory.splice(idx, 1);
            registry.set(RK.INVENTORY, inventory);
          }
        }
        break;
      }

      case 'encyclopedia': {
        const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
        const entriesArr = Array.isArray(entries) ? entries : [];
        if (effect.entryId && !entriesArr.includes(effect.entryId)) {
          registry.set(RK.ENCYCLOPEDIA_ENTRIES, [...entriesArr, effect.entryId]);
        }
        registry.events.emit(ENCYCLOPEDIA_UNLOCKED, { entryId: effect.entryId });
        break;
      }

      case 'skill': {
        const skillKey = resolveSkillKey(effect.skillKey);
        if (skillKey) {
          incrementSkill(registry, skillKey, effect.delta || 0);
        }
        break;
      }

      case 'flag': {
        const flags = { ...(registry.get(RK.GAME_FLAGS) || {}) };
        flags[effect.key] = effect.value;
        registry.set(RK.GAME_FLAGS, flags);
        break;
      }

      case 'mission': {
        const missionDef = getMissionDefinition(effect.missionId);
        if (missionDef) {
          addTask(registry, missionDef);
        }
        break;
      }

      default:
        break;
    }
  }
}
