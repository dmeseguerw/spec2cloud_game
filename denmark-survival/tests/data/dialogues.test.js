/**
 * tests/data/dialogues.test.js
 * Validates all 7 new dialogue trees for structural integrity.
 *
 * Covers:
 *  - Each dialogue is parseable and has required top-level fields
 *  - No dangling node references (every nextNode exists)
 *  - Non-end nodes have at least one response
 *  - node.id matches its key in the nodes map
 *  - Mission effects have missionId property
 *  - All effect types are valid
 *  - Minimum node counts per dialogue
 */

import { describe, it, expect } from 'vitest';

// Import all new dialogues
import { lars_day1_tutorial } from '../../src/data/dialogues/lars_day1_tutorial.js';
import { lars_day2_language } from '../../src/data/dialogues/lars_day2_language.js';
import { sofie_metro_tip } from '../../src/data/dialogues/sofie_metro_tip.js';
import { thomas_second_meeting } from '../../src/data/dialogues/thomas_second_meeting.js';
import { mette_pant_tutorial } from '../../src/data/dialogues/mette_pant_tutorial.js';
import { lars_coffee_invitation } from '../../src/data/dialogues/lars_coffee_invitation.js';
import { lars_coffee_event } from '../../src/data/dialogues/lars_coffee_event.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const VALID_EFFECT_TYPES = [
  'xp', 'relationship', 'item', 'encyclopedia', 'skill', 'flag', 'mission',
];

/**
 * Validate a dialogue tree. Returns an array of error strings (empty = valid).
 */
function validateDialogueTree(tree) {
  const errors = [];
  const nodeIds = new Set(Object.keys(tree.nodes));

  // Root node must exist
  if (!tree.rootNode || !nodeIds.has(tree.rootNode)) {
    errors.push(`Root node "${tree.rootNode}" does not exist`);
  }

  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    // node.id must match key
    if (node.id !== nodeId) {
      errors.push(`Node key "${nodeId}" does not match node.id "${node.id}"`);
    }

    // Non-end nodes must have at least one response
    if (!node.endConversation && (!node.responses || node.responses.length === 0)) {
      errors.push(`Node "${nodeId}" is not an end node but has no responses`);
    }

    // All nextNode references must point to existing nodes
    if (node.responses) {
      for (const resp of node.responses) {
        if (resp.nextNode && !nodeIds.has(resp.nextNode)) {
          errors.push(`Node "${nodeId}" response references non-existent node "${resp.nextNode}"`);
        }
        // All effects must have valid types
        if (resp.effects) {
          for (const effect of resp.effects) {
            if (!VALID_EFFECT_TYPES.includes(effect.type)) {
              errors.push(`Node "${nodeId}" has invalid effect type "${effect.type}"`);
            }
            if (effect.type === 'mission' && !effect.missionId) {
              errors.push(`Node "${nodeId}" mission effect missing missionId`);
            }
          }
        }
      }
    }
  }

  return errors;
}

/**
 * Collect all mission effects from a dialogue tree.
 */
function collectMissionEffects(tree) {
  const missions = [];
  for (const node of Object.values(tree.nodes)) {
    if (!node.responses) continue;
    for (const resp of node.responses) {
      if (!resp.effects) continue;
      for (const effect of resp.effects) {
        if (effect.type === 'mission') missions.push(effect.missionId);
      }
    }
  }
  return missions;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dialogue definitions
// ─────────────────────────────────────────────────────────────────────────────

const DIALOGUES = [
  { name: 'lars_day1_tutorial', tree: lars_day1_tutorial, minNodes: 7, expectedMission: 'story_grocery_run' },
  { name: 'lars_day2_language', tree: lars_day2_language, minNodes: 6, expectedMission: 'story_first_class' },
  { name: 'sofie_metro_tip', tree: sofie_metro_tip, minNodes: 6, expectedMission: 'story_first_metro' },
  { name: 'thomas_second_meeting', tree: thomas_second_meeting, minNodes: 7, expectedMission: null },
  { name: 'mette_pant_tutorial', tree: mette_pant_tutorial, minNodes: 6, expectedMission: 'story_pant_run' },
  { name: 'lars_coffee_invitation', tree: lars_coffee_invitation, minNodes: 4, expectedMission: 'story_lars_coffee' },
  { name: 'lars_coffee_event', tree: lars_coffee_event, minNodes: 7, expectedMission: null },
];

// ─────────────────────────────────────────────────────────────────────────────
// Structural validation
// ─────────────────────────────────────────────────────────────────────────────

describe('New dialogue trees — structural validation', () => {
  for (const { name, tree, minNodes } of DIALOGUES) {
    describe(name, () => {
      it('has required top-level fields', () => {
        expect(tree).toHaveProperty('conversationId');
        expect(tree).toHaveProperty('npcId');
        expect(tree).toHaveProperty('rootNode');
        expect(tree).toHaveProperty('nodes');
      });

      it('conversationId matches export name', () => {
        expect(tree.conversationId).toBe(name);
      });

      it('npcId is a non-empty string', () => {
        expect(typeof tree.npcId).toBe('string');
        expect(tree.npcId.length).toBeGreaterThan(0);
      });

      it(`has at least ${minNodes} nodes`, () => {
        expect(Object.keys(tree.nodes).length).toBeGreaterThanOrEqual(minNodes);
      });

      it('passes full structural validation (no dangling refs, proper responses)', () => {
        const errors = validateDialogueTree(tree);
        expect(errors, `Dialogue "${name}" has errors:\n${errors.join('\n')}`).toEqual([]);
      });

      it('every node has speaker, text, and portrait', () => {
        for (const [id, node] of Object.entries(tree.nodes)) {
          expect(node, `Node "${id}" missing speaker`).toHaveProperty('speaker');
          expect(node, `Node "${id}" missing text`).toHaveProperty('text');
          expect(node, `Node "${id}" missing portrait`).toHaveProperty('portrait');
          expect(node.text.length, `Node "${id}" has empty text`).toBeGreaterThan(0);
        }
      });

      it('has at least one end node', () => {
        const endNodes = Object.values(tree.nodes).filter(n => n.endConversation);
        expect(endNodes.length).toBeGreaterThanOrEqual(1);
      });

      it('all effects use valid types', () => {
        for (const node of Object.values(tree.nodes)) {
          if (!node.responses) continue;
          for (const resp of node.responses) {
            for (const effect of resp.effects || []) {
              expect(
                VALID_EFFECT_TYPES.includes(effect.type),
                `Invalid effect type "${effect.type}" in ${name}/${node.id}`,
              ).toBe(true);
            }
          }
        }
      });
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Mission effect validation
// ─────────────────────────────────────────────────────────────────────────────

describe('New dialogue trees — mission effects', () => {
  for (const { name, tree, expectedMission } of DIALOGUES) {
    if (expectedMission) {
      it(`${name} assigns mission "${expectedMission}"`, () => {
        const missions = collectMissionEffects(tree);
        expect(missions).toContain(expectedMission);
      });
    }
  }

  it('lars_day1_tutorial mission effects all have missionId', () => {
    const missions = collectMissionEffects(lars_day1_tutorial);
    expect(missions.length).toBeGreaterThan(0);
    for (const missionId of missions) {
      expect(typeof missionId).toBe('string');
      expect(missionId.length).toBeGreaterThan(0);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// NPC consistency
// ─────────────────────────────────────────────────────────────────────────────

describe('New dialogue trees — NPC consistency', () => {
  it('lars dialogues have npcId "lars"', () => {
    expect(lars_day1_tutorial.npcId).toBe('lars');
    expect(lars_day2_language.npcId).toBe('lars');
    expect(lars_coffee_invitation.npcId).toBe('lars');
    expect(lars_coffee_event.npcId).toBe('lars');
  });

  it('sofie dialogue has npcId "sofie"', () => {
    expect(sofie_metro_tip.npcId).toBe('sofie');
  });

  it('thomas dialogue has npcId "thomas"', () => {
    expect(thomas_second_meeting.npcId).toBe('thomas');
  });

  it('mette dialogue has npcId "mette"', () => {
    expect(mette_pant_tutorial.npcId).toBe('mette');
  });
});
