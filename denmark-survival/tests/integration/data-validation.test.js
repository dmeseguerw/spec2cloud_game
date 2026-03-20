/**
 * tests/integration/data-validation.test.js
 * Automated data validation for all game data files.
 *
 * Scans all JSON/JS data files for schema compliance:
 *  - Encounter data: well-formed entries, valid conditions, valid options
 *  - Dialogue trees: no dead-end nodes (every non-end node has responses)
 *  - Item data: valid fields and references
 *  - NPC data: complete profiles with schedules
 *  - Encyclopedia entries: valid triggers and cross-references
 *  - Shop data: all item references resolve to existing items
 *
 * Task 024 — End-to-End Integration & Playtesting
 */

import { describe, it, expect } from 'vitest';
import { createRequire } from 'node:module';

// ── Data imports ─────────────────────────────────────────────────────────────
import { ENCYCLOPEDIA_DATA, CATEGORIES, STARTER_ENTRY_IDS, getEntryById } from '../../src/data/encyclopedia.js';
import { NPCS } from '../../src/data/npcs.js';
import ITEMS_DATA from '../../src/data/items.js';
import { lars_day1_tutorial } from '../../src/data/dialogues/lars_day1_tutorial.js';
import { mette_shopping } from '../../src/data/dialogues/mette_shopping.js';
import { thomas_first_meeting } from '../../src/data/dialogues/thomas_first_meeting.js';

// Load JSON data
const require = createRequire(import.meta.url);
let ENCOUNTERS = [];
let SHOPS = [];
try { ENCOUNTERS = require('../../src/data/encounters.json'); } catch { /* empty */ }
try { SHOPS = require('../../src/data/shops.json'); } catch { /* empty */ }

// ══════════════════════════════════════════════════════════════════════════════
// Dialogue tree validation utilities
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Validate a dialogue tree: no dead-end nodes, all nextNode refs exist,
 * every non-end node has at least one response.
 */
function validateDialogueTree(tree) {
  const errors = [];
  const nodeIds = Object.keys(tree.nodes);

  if (!tree.rootNode || !tree.nodes[tree.rootNode]) {
    errors.push(`Root node "${tree.rootNode}" does not exist`);
  }

  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    // Non-end nodes must have at least one response
    if (!node.endConversation && (!node.responses || node.responses.length === 0)) {
      errors.push(`Node "${nodeId}" is not an end node but has no responses (dead-end)`);
    }

    // All nextNode references must point to existing nodes
    if (node.responses) {
      for (const resp of node.responses) {
        if (resp.nextNode && !tree.nodes[resp.nextNode]) {
          errors.push(`Node "${nodeId}" response references non-existent node "${resp.nextNode}"`);
        }
      }
    }

    // Node must have speaker and text
    if (!node.speaker) {
      errors.push(`Node "${nodeId}" missing speaker`);
    }
    if (!node.text) {
      errors.push(`Node "${nodeId}" missing text`);
    }
  }

  // Check all nodes are reachable from root
  const reachable = new Set();
  function walk(nodeId) {
    if (reachable.has(nodeId) || !tree.nodes[nodeId]) return;
    reachable.add(nodeId);
    const node = tree.nodes[nodeId];
    if (node.responses) {
      for (const resp of node.responses) {
        if (resp.nextNode) walk(resp.nextNode);
      }
    }
  }
  walk(tree.rootNode);

  for (const nodeId of nodeIds) {
    if (!reachable.has(nodeId)) {
      errors.push(`Node "${nodeId}" is unreachable from root`);
    }
  }

  return errors;
}

// ══════════════════════════════════════════════════════════════════════════════
// Encounter data validation
// ══════════════════════════════════════════════════════════════════════════════

describe('Data Validation: Encounters', () => {
  it('all encounters have required fields', () => {
    expect(ENCOUNTERS.length).toBeGreaterThan(0);

    for (const enc of ENCOUNTERS) {
      expect(enc.id, `Encounter missing id: ${JSON.stringify(enc).slice(0, 80)}`).toBeTruthy();
      expect(enc.title, `Encounter ${enc.id} missing title`).toBeTruthy();
      expect(enc.description, `Encounter ${enc.id} missing description`).toBeTruthy();
      expect(enc.category, `Encounter ${enc.id} missing category`).toBeTruthy();
    }
  });

  it('all encounters have valid conditions', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.conditions, `Encounter ${enc.id} missing conditions`).toBeTruthy();
      expect(enc.conditions.minLevel, `Encounter ${enc.id} missing minLevel`).toBeDefined();
      expect(enc.conditions.maxLevel, `Encounter ${enc.id} missing maxLevel`).toBeDefined();
      expect(enc.conditions.minLevel).toBeLessThanOrEqual(enc.conditions.maxLevel);
    }
  });

  it('all encounters have at least 2 options', () => {
    for (const enc of ENCOUNTERS) {
      expect(enc.options, `Encounter ${enc.id} missing options`).toBeTruthy();
      expect(
        enc.options.length,
        `Encounter ${enc.id} has ${enc.options.length} options (need at least 2)`,
      ).toBeGreaterThanOrEqual(2);
    }
  });

  it('all encounter options have text and resultText', () => {
    for (const enc of ENCOUNTERS) {
      for (let i = 0; i < enc.options.length; i++) {
        const opt = enc.options[i];
        expect(opt.text, `Encounter ${enc.id} option ${i} missing text`).toBeTruthy();
        expect(opt.resultText, `Encounter ${enc.id} option ${i} missing resultText`).toBeTruthy();
      }
    }
  });

  it('encounter IDs are unique', () => {
    const ids = ENCOUNTERS.map(e => e.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });

  it('encounter categories are valid', () => {
    const validCategories = ['helpful', 'neutral', 'challenge', 'major'];
    for (const enc of ENCOUNTERS) {
      expect(
        validCategories,
        `Encounter ${enc.id} has invalid category "${enc.category}"`,
      ).toContain(enc.category);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Dialogue tree validation
// ══════════════════════════════════════════════════════════════════════════════

describe('Data Validation: Dialogue Trees', () => {
  const dialogues = [
    { name: 'lars_day1_tutorial', tree: lars_day1_tutorial },
    { name: 'mette_shopping', tree: mette_shopping },
    { name: 'thomas_first_meeting', tree: thomas_first_meeting },
  ];

  for (const { name, tree } of dialogues) {
    it(`${name}: no dead-end nodes or orphan references`, () => {
      const errors = validateDialogueTree(tree);
      expect(errors, `Dialogue "${name}" has errors:\n${errors.join('\n')}`).toEqual([]);
    });

    it(`${name}: has conversationId and npcId`, () => {
      expect(tree.conversationId).toBeTruthy();
      expect(tree.npcId).toBeTruthy();
    });

    it(`${name}: rootNode exists`, () => {
      expect(tree.rootNode).toBeTruthy();
      expect(tree.nodes[tree.rootNode]).toBeTruthy();
    });

    it(`${name}: end nodes have endConversation = true`, () => {
      for (const [nodeId, node] of Object.entries(tree.nodes)) {
        if (!node.responses || node.responses.length === 0) {
          expect(
            node.endConversation,
            `Node "${nodeId}" in ${name} has no responses but endConversation is not true`,
          ).toBe(true);
        }
      }
    });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
// Item data validation
// ══════════════════════════════════════════════════════════════════════════════

describe('Data Validation: Items', () => {
  it('all items have required fields', () => {
    expect(ITEMS_DATA.length).toBeGreaterThan(0);

    for (const item of ITEMS_DATA) {
      expect(item.id, `Item missing id`).toBeTruthy();
      expect(item.name, `Item ${item.id} missing name`).toBeTruthy();
      expect(item.category, `Item ${item.id} missing category`).toBeTruthy();
      expect(item.price, `Item ${item.id} missing price`).toBeDefined();
      expect(item.price).toBeGreaterThanOrEqual(0);
    }
  });

  it('item IDs are unique', () => {
    const ids = ITEMS_DATA.map(i => i.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('food items have spoilage data', () => {
    const foodItems = ITEMS_DATA.filter(i => i.category === 'food');
    expect(foodItems.length).toBeGreaterThan(0);

    for (const item of foodItems) {
      // spoilsAfter should be defined (can be null for non-perishable)
      expect(
        'spoilsAfter' in item,
        `Food item ${item.id} missing spoilsAfter field`,
      ).toBe(true);
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// NPC data validation
// ══════════════════════════════════════════════════════════════════════════════

describe('Data Validation: NPCs', () => {
  it('has 10 NPCs', () => {
    expect(NPCS.length).toBe(10);
  });

  it('all NPCs have required fields', () => {
    for (const npc of NPCS) {
      expect(npc.id, `NPC missing id`).toBeTruthy();
      expect(npc.name, `NPC ${npc.id} missing name`).toBeTruthy();
      expect(npc.role, `NPC ${npc.id} missing role`).toBeTruthy();
      expect(npc.personality, `NPC ${npc.id} missing personality`).toBeTruthy();
      expect(npc.location, `NPC ${npc.id} missing location`).toBeTruthy();
      expect(npc.arc, `NPC ${npc.id} missing arc`).toBeTruthy();
    }
  });

  it('all NPCs have complete schedules', () => {
    const timeSlots = ['morning', 'afternoon', 'evening', 'night'];

    for (const npc of NPCS) {
      expect(npc.schedule, `NPC ${npc.id} missing schedule`).toBeTruthy();

      for (const slot of timeSlots) {
        expect(
          slot in npc.schedule,
          `NPC ${npc.id} missing schedule slot "${slot}"`,
        ).toBe(true);
      }
    }
  });

  it('all NPCs have starting relationship values', () => {
    for (const npc of NPCS) {
      expect(
        typeof npc.startingRelationship,
        `NPC ${npc.id} missing startingRelationship`,
      ).toBe('number');
      expect(npc.startingRelationship).toBeGreaterThanOrEqual(0);
      expect(npc.startingRelationship).toBeLessThanOrEqual(100);
    }
  });

  it('NPC IDs are unique', () => {
    const ids = NPCS.map(n => n.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Encyclopedia data validation
// ══════════════════════════════════════════════════════════════════════════════

describe('Data Validation: Encyclopedia', () => {
  it('has entries across all categories', () => {
    for (const cat of CATEGORIES) {
      const entries = ENCYCLOPEDIA_DATA.filter(e => e.category === cat);
      expect(
        entries.length,
        `Category "${cat}" has no entries`,
      ).toBeGreaterThan(0);
    }
  });

  it('all entries have required fields', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(entry.id, `Entry missing id`).toBeTruthy();
      expect(entry.title, `Entry ${entry.id} missing title`).toBeTruthy();
      expect(entry.category, `Entry ${entry.id} missing category`).toBeTruthy();
      expect(entry.body, `Entry ${entry.id} missing body`).toBeTruthy();
      expect(CATEGORIES, `Entry ${entry.id} has invalid category "${entry.category}"`).toContain(entry.category);
    }
  });

  it('all entries have at least one trigger', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      expect(
        entry.triggers,
        `Entry ${entry.id} missing triggers array`,
      ).toBeTruthy();
      expect(
        entry.triggers.length,
        `Entry ${entry.id} has no triggers`,
      ).toBeGreaterThanOrEqual(1);
    }
  });

  it('entry IDs are unique', () => {
    const ids = ENCYCLOPEDIA_DATA.map(e => e.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('all relatedEntries reference existing entries', () => {
    const allIds = new Set(ENCYCLOPEDIA_DATA.map(e => e.id));

    for (const entry of ENCYCLOPEDIA_DATA) {
      if (entry.relatedEntries) {
        for (const relId of entry.relatedEntries) {
          expect(
            allIds.has(relId),
            `Entry ${entry.id} references non-existent related entry "${relId}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('starter entries exist in the data', () => {
    for (const starterId of STARTER_ENTRY_IDS) {
      const entry = getEntryById(starterId);
      expect(entry, `Starter entry "${starterId}" not found in ENCYCLOPEDIA_DATA`).toBeTruthy();
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Shop data validation
// ══════════════════════════════════════════════════════════════════════════════

describe('Data Validation: Shops', () => {
  const itemIds = new Set(ITEMS_DATA.map(i => i.id));

  it('all shops have required fields', () => {
    expect(SHOPS.length).toBeGreaterThan(0);

    for (const shop of SHOPS) {
      expect(shop.id, `Shop missing id`).toBeTruthy();
      expect(shop.name, `Shop ${shop.id} missing name`).toBeTruthy();
      expect(shop.items, `Shop ${shop.id} missing items`).toBeTruthy();
      expect(shop.openHours, `Shop ${shop.id} missing openHours`).toBeTruthy();
    }
  });

  it('all shop item references resolve to existing items', () => {
    for (const shop of SHOPS) {
      for (const shopItem of shop.items) {
        expect(
          itemIds.has(shopItem.itemId),
          `Shop ${shop.id} references unknown item "${shopItem.itemId}"`,
        ).toBe(true);
      }
    }
  });

  it('shop IDs are unique', () => {
    const ids = SHOPS.map(s => s.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('open hours are valid', () => {
    for (const shop of SHOPS) {
      if (shop.openHours.weekday) {
        expect(shop.openHours.weekday.open).toBeLessThan(shop.openHours.weekday.close);
      }
      if (shop.openHours.weekend) {
        expect(shop.openHours.weekend.open).toBeLessThan(shop.openHours.weekend.close);
      }
    }
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Cross-System Reference Integrity
// ══════════════════════════════════════════════════════════════════════════════

describe('Data Validation: Cross-System References', () => {
  const npcIds = new Set(NPCS.map(n => n.id));
  const encyclopediaIds = new Set(ENCYCLOPEDIA_DATA.map(e => e.id));

  it('encounter NPC references point to existing NPCs', () => {
    for (const enc of ENCOUNTERS) {
      for (const opt of enc.options) {
        if (opt.outcome?.relationship?.npcId) {
          expect(
            npcIds.has(opt.outcome.relationship.npcId),
            `Encounter ${enc.id} references unknown NPC "${opt.outcome.relationship.npcId}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('encounter encyclopedia references point to existing entries', () => {
    for (const enc of ENCOUNTERS) {
      for (const opt of enc.options) {
        if (opt.outcome?.encyclopedia) {
          expect(
            encyclopediaIds.has(opt.outcome.encyclopedia),
            `Encounter ${enc.id} references unknown encyclopedia entry "${opt.outcome.encyclopedia}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('encyclopedia NPC triggers reference existing NPCs', () => {
    for (const entry of ENCYCLOPEDIA_DATA) {
      for (const trigger of entry.triggers) {
        if (trigger.npcId) {
          expect(
            npcIds.has(trigger.npcId),
            `Encyclopedia entry ${entry.id} trigger references unknown NPC "${trigger.npcId}"`,
          ).toBe(true);
        }
      }
    }
  });

  it('dialogue trees reference existing NPCs', () => {
    const dialogues = [lars_day1_tutorial, mette_shopping, thomas_first_meeting];
    for (const tree of dialogues) {
      expect(
        npcIds.has(tree.npcId),
        `Dialogue "${tree.conversationId}" references unknown NPC "${tree.npcId}"`,
      ).toBe(true);
    }
  });
});
