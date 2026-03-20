/**
 * tests/systems/DialogueEngine.test.js
 * Unit and integration tests for DialogueEngine.
 * Coverage target: ≥85% of src/systems/DialogueEngine.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { DialogueEngine } from '../../src/systems/DialogueEngine.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  DIALOGUE_STARTED,
  DIALOGUE_ENDED,
  DIALOGUE_NODE_CHANGED,
  DIALOGUE_RESPONSE_SELECTED,
} from '../../src/constants/Events.js';
import { ENCYCLOPEDIA_UNLOCKED } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Shared test dialogue data
// ─────────────────────────────────────────────────────────────────────────────

/** Minimal 2-node conversation used by most unit tests. */
const SIMPLE_DIALOGUE = {
  conversationId: 'test_simple',
  npcId: 'lars',
  rootNode: 'node_a',
  nodes: {
    node_a: {
      id: 'node_a',
      speaker: 'Lars',
      text: 'Hello there!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        { text: 'Hi Lars!',       nextNode: 'node_b', effects: [] },
        { text: 'Go away, Lars.', nextNode: 'node_end', effects: [] },
      ],
    },
    node_b: {
      id: 'node_b',
      speaker: 'Lars',
      text: 'Nice to meet you!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        { text: 'Likewise!', nextNode: 'node_end', effects: [] },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Lars',
      text: 'Goodbye.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};

/** Dialogue with all condition types on a single node's responses. */
const CONDITIONS_DIALOGUE = {
  conversationId: 'test_conditions',
  npcId: 'thomas',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Thomas',
      text: 'Hmm.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Language level response (Req level 3)',
          nextNode: 'node_end',
          condition: { type: 'languageLevel', level: 3 },
          effects: [],
        },
        {
          text: 'Relationship response (Req >= 50)',
          nextNode: 'node_end',
          condition: { type: 'relationship', npcId: 'thomas', value: 50 },
          effects: [],
        },
        {
          text: 'Has item response',
          nextNode: 'node_end',
          condition: { type: 'hasItem', itemId: 'danish_cookbook' },
          effects: [],
        },
        {
          text: 'Flag response',
          nextNode: 'node_end',
          condition: { type: 'flag', key: 'met_thomas', value: true },
          effects: [],
        },
        {
          text: 'Skill response (cycling level 2)',
          nextNode: 'node_end',
          condition: { type: 'skill', skillKey: 'cycling', level: 2 },
          effects: [],
        },
        {
          text: 'No condition',
          nextNode: 'node_end',
          effects: [],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Thomas',
      text: 'Fine.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};

/** Dialogue with all effect types. */
const EFFECTS_DIALOGUE = {
  conversationId: 'test_effects',
  npcId: 'mette',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Mette',
      text: 'Hi there!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'XP effect',
          nextNode: 'node_end',
          effects: [{ type: 'xp', amount: 25 }],
        },
        {
          text: 'Relationship effect',
          nextNode: 'node_end',
          effects: [{ type: 'relationship', npcId: 'mette', delta: 10 }],
        },
        {
          text: 'Give item',
          nextNode: 'node_end',
          effects: [{ type: 'item', itemId: 'danish_cookbook', action: 'give' }],
        },
        {
          text: 'Take item',
          nextNode: 'node_end',
          effects: [{ type: 'item', itemId: 'key_item', action: 'take' }],
        },
        {
          text: 'Encyclopedia unlock',
          nextNode: 'node_end',
          effects: [{ type: 'encyclopedia', entryId: 'hygge' }],
        },
        {
          text: 'Skill increase',
          nextNode: 'node_end',
          effects: [{ type: 'skill', skillKey: 'language', delta: 5 }],
        },
        {
          text: 'Flag set',
          nextNode: 'node_end',
          effects: [{ type: 'flag', key: 'test_flag', value: 42 }],
        },
        {
          text: 'Multiple effects',
          nextNode: 'node_end',
          effects: [
            { type: 'xp', amount: 10 },
            { type: 'relationship', npcId: 'mette', delta: 5 },
            { type: 'flag', key: 'combo', value: true },
          ],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Mette',
      text: 'Bye!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Registry helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Create a fresh registry seeded with sensible defaults. */
function createRegistry({
  xp = 0,
  level = 1,
  languageSkill = 0,
  cyclingSkill = 0,
  relationships = {},
  inventory = [],
  flags = {},
} = {}) {
  const registry = new MockRegistry();
  registry.set(RK.PLAYER_XP, xp);
  registry.set(RK.PLAYER_LEVEL, level);
  registry.set(RK.SKILL_LANGUAGE, languageSkill);
  registry.set(RK.SKILL_CYCLING, cyclingSkill);
  if (Object.keys(relationships).length > 0) {
    registry.set(RK.NPC_RELATIONSHIPS, relationships);
  }
  if (inventory.length > 0) {
    registry.set(RK.INVENTORY, inventory);
  }
  if (Object.keys(flags).length > 0) {
    registry.set(RK.GAME_FLAGS, flags);
  }
  return registry;
}

/** Create and pre-register a DialogueEngine with a given set of dialogues. */
function createEngine(...dialogues) {
  const engine = new DialogueEngine();
  for (const d of dialogues) {
    engine.registerDialogue(d.conversationId, d);
  }
  return engine;
}

// ─────────────────────────────────────────────────────────────────────────────
// Registration
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — registerDialogue', () => {
  it('allows registering and later starting a dialogue by id', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    expect(() => engine.startDialogue(registry, 'lars', 'test_simple')).not.toThrow();
  });

  it('throws when starting an unregistered conversationId', () => {
    const engine   = new DialogueEngine();
    const registry = createRegistry();
    expect(() => engine.startDialogue(registry, 'lars', 'nonexistent')).toThrow(
      /Dialogue not registered/i,
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// startDialogue
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — startDialogue', () => {
  let engine, registry;

  beforeEach(() => {
    engine   = createEngine(SIMPLE_DIALOGUE);
    registry = createRegistry();
  });

  it('starts at the rootNode defined in dialogue data', () => {
    engine.startDialogue(registry, 'lars', 'test_simple');
    const node = engine.getCurrentNode();
    expect(node).not.toBeNull();
    expect(node.id).toBe('node_a');
  });

  it('sets isConversationActive() to true', () => {
    expect(engine.isConversationActive()).toBe(false);
    engine.startDialogue(registry, 'lars', 'test_simple');
    expect(engine.isConversationActive()).toBe(true);
  });

  it('emits DIALOGUE_STARTED with npcId and conversationId', () => {
    const handler = vi.fn();
    registry.events.on(DIALOGUE_STARTED, handler);
    engine.startDialogue(registry, 'lars', 'test_simple');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({
      npcId: 'lars',
      conversationId: 'test_simple',
    });
  });

  it('emits DIALOGUE_NODE_CHANGED with the root node', () => {
    const handler = vi.fn();
    registry.events.on(DIALOGUE_NODE_CHANGED, handler);
    engine.startDialogue(registry, 'lars', 'test_simple');
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].node.id).toBe('node_a');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// getCurrentNode
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — getCurrentNode', () => {
  it('returns null before starting any conversation', () => {
    const engine = new DialogueEngine();
    expect(engine.getCurrentNode()).toBeNull();
  });

  it('returns null after endDialogue', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    engine.endDialogue(registry);
    expect(engine.getCurrentNode()).toBeNull();
  });

  it('returns the correct node after selectResponse advances the tree', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    engine.selectResponse(registry, 0); // node_a → node_b
    expect(engine.getCurrentNode().id).toBe('node_b');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isConversationActive
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — isConversationActive', () => {
  it('is false before start', () => {
    expect(new DialogueEngine().isConversationActive()).toBe(false);
  });

  it('is true during conversation', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    expect(engine.isConversationActive()).toBe(true);
  });

  it('is false after endDialogue', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    engine.endDialogue(registry);
    expect(engine.isConversationActive()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// endDialogue
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — endDialogue', () => {
  it('emits DIALOGUE_ENDED', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');

    const handler = vi.fn();
    registry.events.on(DIALOGUE_ENDED, handler);
    engine.endDialogue(registry);
    expect(handler).toHaveBeenCalledOnce();
  });

  it('records conversation in DIALOGUE_HISTORY', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    registry.set(RK.CURRENT_DAY, 3);
    engine.startDialogue(registry, 'lars', 'test_simple');
    engine.endDialogue(registry);

    const history = registry.get(RK.DIALOGUE_HISTORY);
    expect(history).toBeDefined();
    expect(history['test_simple']).toMatchObject({
      npcId: 'lars',
      completedAt: 3,
    });
  });

  it('is a no-op when called with no active conversation', () => {
    const engine   = new DialogueEngine();
    const registry = createRegistry();
    const handler  = vi.fn();
    registry.events.on(DIALOGUE_ENDED, handler);
    expect(() => engine.endDialogue(registry)).not.toThrow();
    expect(handler).not.toHaveBeenCalled();
  });

  it('can be called without a registry argument without throwing', () => {
    const engine = createEngine(SIMPLE_DIALOGUE);
    engine.startDialogue(new MockRegistry(), 'lars', 'test_simple');
    expect(() => engine.endDialogue()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Condition checking — getAvailableResponses
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — condition checking', () => {
  let engine;

  beforeEach(() => {
    engine = createEngine(CONDITIONS_DIALOGUE);
  });

  it('returns empty array when not in a conversation', () => {
    const registry = createRegistry();
    expect(engine.getAvailableResponses(registry)).toEqual([]);
  });

  // languageLevel condition
  describe('languageLevel condition', () => {
    it('locks response when language skill is below required level', () => {
      // Level 1: 0–19 raw value; level 3 requires ≥ 40 raw value
      const registry = createRegistry({ languageSkill: 0 });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[0].locked).toBe(true);
      expect(responses[0].lockReason).toMatch(/Danish Level 3/i);
    });

    it('unlocks response when language skill meets required level', () => {
      // Level 3: raw value 40–59
      const registry = createRegistry({ languageSkill: 40 });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[0].locked).toBe(false);
    });
  });

  // relationship condition
  describe('relationship condition', () => {
    it('locks when relationship is below threshold', () => {
      const registry = createRegistry({ relationships: { thomas: 10 } });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[1].locked).toBe(true);
      expect(responses[1].lockReason).toMatch(/relationship/i);
    });

    it('unlocks when relationship meets threshold', () => {
      const registry = createRegistry({ relationships: { thomas: 50 } });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[1].locked).toBe(false);
    });
  });

  // hasItem condition
  describe('hasItem condition', () => {
    it('locks when item is not in inventory', () => {
      const registry = createRegistry();
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[2].locked).toBe(true);
    });

    it('unlocks when item is in inventory (object form)', () => {
      const registry = createRegistry({ inventory: [{ id: 'danish_cookbook' }] });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[2].locked).toBe(false);
    });

    it('unlocks when item is in inventory (string form)', () => {
      const registry = createRegistry({ inventory: ['danish_cookbook'] });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[2].locked).toBe(false);
    });
  });

  // flag condition
  describe('flag condition', () => {
    it('locks when flag is not set', () => {
      const registry = createRegistry();
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[3].locked).toBe(true);
    });

    it('locks when flag has wrong value', () => {
      const registry = createRegistry({ flags: { met_thomas: false } });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[3].locked).toBe(true);
    });

    it('unlocks when flag matches required value', () => {
      const registry = createRegistry({ flags: { met_thomas: true } });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[3].locked).toBe(false);
    });
  });

  // skill condition
  describe('skill condition', () => {
    it('locks when skill is below required level', () => {
      const registry = createRegistry({ cyclingSkill: 0 });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[4].locked).toBe(true);
    });

    it('unlocks when skill meets required level', () => {
      // Level 2: raw value 20–39
      const registry = createRegistry({ cyclingSkill: 20 });
      engine.startDialogue(registry, 'thomas', 'test_conditions');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[4].locked).toBe(false);
    });

    it('accepts full registry key (e.g. skill_cycling) as skillKey', () => {
      const dialogueWithFullKey = {
        conversationId: 'test_full_key',
        npcId: 'thomas',
        rootNode: 'node_start',
        nodes: {
          node_start: {
            id: 'node_start',
            speaker: 'Thomas',
            text: 'Test.',
            portrait: 'portrait_thomas',
            autoAdvance: false,
            endConversation: false,
            responses: [
              {
                text: 'Full key skill check',
                nextNode: 'node_end',
                condition: { type: 'skill', skillKey: 'skill_cycling', level: 2 },
                effects: [],
              },
            ],
          },
          node_end: {
            id: 'node_end',
            speaker: 'Thomas',
            text: 'OK.',
            portrait: 'portrait_thomas',
            autoAdvance: false,
            endConversation: true,
            responses: [],
          },
        },
      };
      engine.registerDialogue('test_full_key', dialogueWithFullKey);
      const registry = createRegistry({ cyclingSkill: 20 });
      engine.startDialogue(registry, 'thomas', 'test_full_key');
      const responses = engine.getAvailableResponses(registry);
      expect(responses[0].locked).toBe(false);
    });
  });

  it('response without condition is never locked', () => {
    const registry = createRegistry();
    engine.startDialogue(registry, 'thomas', 'test_conditions');
    const responses = engine.getAvailableResponses(registry);
    const unconditional = responses[5];
    expect(unconditional.locked).toBe(false);
    expect(unconditional.lockReason).toBeNull();
  });

  it('response index is attached to each returned response', () => {
    const registry = createRegistry();
    engine.startDialogue(registry, 'thomas', 'test_conditions');
    const responses = engine.getAvailableResponses(registry);
    responses.forEach((r, i) => expect(r.index).toBe(i));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Effect application
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — effect application', () => {
  let engine;

  beforeEach(() => {
    engine = createEngine(EFFECTS_DIALOGUE);
  });

  it('xp effect grants XP to registry', () => {
    const registry = createRegistry({ xp: 0 });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 0); // XP effect: +25
    expect(registry.get(RK.PLAYER_XP)).toBe(25);
  });

  it('relationship effect changes NPC relationship value', () => {
    const registry = createRegistry({ xp: 0, level: 1, relationships: { mette: 30 } });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 1); // relationship +10
    const relMap = registry.get(RK.NPC_RELATIONSHIPS);
    expect(relMap['mette']).toBeGreaterThan(30);
  });

  it('item give effect adds item to inventory', () => {
    const registry = createRegistry({ xp: 0 });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 2); // give danish_cookbook
    const inventory = registry.get(RK.INVENTORY);
    expect(Array.isArray(inventory)).toBe(true);
    expect(inventory.some(i => (typeof i === 'string' ? i : i.id) === 'danish_cookbook')).toBe(true);
  });

  it('item take effect removes item from inventory', () => {
    const registry = createRegistry({
      xp: 0,
      inventory: [{ id: 'key_item' }],
    });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 3); // take key_item
    const inventory = registry.get(RK.INVENTORY);
    expect(inventory.some(i => (typeof i === 'string' ? i : i.id) === 'key_item')).toBe(false);
  });

  it('item take effect is a no-op when item not in inventory', () => {
    const registry = createRegistry({ xp: 0 });
    engine.startDialogue(registry, 'mette', 'test_effects');
    expect(() => engine.selectResponse(registry, 3)).not.toThrow();
  });

  it('encyclopedia effect unlocks entry in registry', () => {
    const registry = createRegistry({ xp: 0 });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 4); // encyclopedia hygge
    const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
    expect(entries).toContain('hygge');
  });

  it('encyclopedia effect emits ENCYCLOPEDIA_UNLOCKED event', () => {
    const registry = createRegistry({ xp: 0 });
    const handler = vi.fn();
    registry.events.on(ENCYCLOPEDIA_UNLOCKED, handler);
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 4);
    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0]).toMatchObject({ entryId: 'hygge' });
  });

  it('skill effect increments language skill in registry', () => {
    const registry = createRegistry({ xp: 0, languageSkill: 0 });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 5); // skill language +5
    expect(registry.get(RK.SKILL_LANGUAGE)).toBe(5);
  });

  it('flag effect sets key in GAME_FLAGS', () => {
    const registry = createRegistry({ xp: 0 });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 6); // flag test_flag = 42
    const flags = registry.get(RK.GAME_FLAGS);
    expect(flags['test_flag']).toBe(42);
  });

  it('multiple effects all apply in a single response selection', () => {
    const registry = createRegistry({ xp: 0, level: 1, relationships: { mette: 30 } });
    engine.startDialogue(registry, 'mette', 'test_effects');
    engine.selectResponse(registry, 7); // xp +10, relationship +5, flag combo=true
    // XP is at least 10 (may be higher due to RelationshipSystem bonus XP)
    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThanOrEqual(10);
    const flags = registry.get(RK.GAME_FLAGS);
    expect(flags['combo']).toBe(true);
  });

  it('unknown effect type does not throw', () => {
    const dialogueWithUnknownEffect = {
      conversationId: 'test_unknown',
      npcId: 'mette',
      rootNode: 'node_start',
      nodes: {
        node_start: {
          id: 'node_start',
          speaker: 'Mette',
          text: 'Hi!',
          portrait: 'portrait_mette',
          autoAdvance: false,
          endConversation: false,
          responses: [
            {
              text: 'OK',
              nextNode: 'node_end',
              effects: [{ type: 'unknown_effect_type', data: 'anything' }],
            },
          ],
        },
        node_end: {
          id: 'node_end',
          speaker: 'Mette',
          text: 'Bye!',
          portrait: 'portrait_mette',
          autoAdvance: false,
          endConversation: true,
          responses: [],
        },
      },
    };
    const e = createEngine(dialogueWithUnknownEffect);
    const registry = createRegistry({ xp: 0 });
    e.startDialogue(registry, 'mette', 'test_unknown');
    expect(() => e.selectResponse(registry, 0)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// selectResponse — tree traversal & events
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — selectResponse', () => {
  it('advances to correct next node', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    engine.selectResponse(registry, 1); // "Go away" → node_end
    expect(engine.getCurrentNode().id).toBe('node_end');
  });

  it('emits DIALOGUE_RESPONSE_SELECTED with index and response', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');

    const handler = vi.fn();
    registry.events.on(DIALOGUE_RESPONSE_SELECTED, handler);
    engine.selectResponse(registry, 0);

    expect(handler).toHaveBeenCalledOnce();
    const payload = handler.mock.calls[0][0];
    expect(payload.responseIndex).toBe(0);
    expect(payload.response.text).toBe('Hi Lars!');
  });

  it('emits DIALOGUE_NODE_CHANGED after advancing', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');

    const handler = vi.fn();
    registry.events.on(DIALOGUE_NODE_CHANGED, handler);
    handler.mockClear();
    engine.selectResponse(registry, 0); // node_a → node_b

    expect(handler).toHaveBeenCalledOnce();
    expect(handler.mock.calls[0][0].node.id).toBe('node_b');
  });

  it('ends conversation when response has no nextNode', () => {
    const dialogueNoNext = {
      conversationId: 'test_no_next',
      npcId: 'lars',
      rootNode: 'node_a',
      nodes: {
        node_a: {
          id: 'node_a',
          speaker: 'Lars',
          text: 'Hi!',
          portrait: 'portrait_lars',
          autoAdvance: false,
          endConversation: false,
          responses: [
            { text: 'Bye', effects: [] },
          ],
        },
      },
    };
    const engine   = createEngine(dialogueNoNext);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_no_next');
    engine.selectResponse(registry, 0);
    expect(engine.isConversationActive()).toBe(false);
  });

  it('is a no-op when called with an out-of-range index', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    expect(() => engine.selectResponse(registry, 99)).not.toThrow();
    expect(engine.getCurrentNode().id).toBe('node_a'); // unchanged
  });

  it('is a no-op when no conversation is active', () => {
    const engine   = new DialogueEngine();
    const registry = createRegistry();
    expect(() => engine.selectResponse(registry, 0)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Conversation end detection
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — conversation end detection', () => {
  it('endConversation node is reached via tree traversal', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    engine.selectResponse(registry, 0); // → node_b
    engine.selectResponse(registry, 0); // → node_end
    expect(engine.getCurrentNode().endConversation).toBe(true);
    expect(engine.isConversationActive()).toBe(true); // still active until endDialogue called
  });

  it('calling endDialogue on end node cleans up state', () => {
    const engine   = createEngine(SIMPLE_DIALOGUE);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_simple');
    engine.selectResponse(registry, 0);
    engine.selectResponse(registry, 0); // at node_end
    engine.endDialogue(registry);
    expect(engine.isConversationActive()).toBe(false);
    expect(engine.getCurrentNode()).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Language gating
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — language gating', () => {
  const LANGUAGE_GATED_DIALOGUE = {
    conversationId: 'test_lang_gated',
    npcId: 'lars',
    rootNode: 'node_start',
    nodes: {
      node_start: {
        id: 'node_start',
        speaker: 'Lars',
        text: 'Hello!',
        portrait: 'portrait_lars',
        autoAdvance: false,
        endConversation: false,
        responses: [
          { text: 'English response', nextNode: 'node_end', effects: [] },
          {
            text: 'Hej! (Danish Level 2)',
            nextNode: 'node_end',
            condition: { type: 'languageLevel', level: 2 },
            effects: [],
          },
          {
            text: 'God dag! (Danish Level 3)',
            nextNode: 'node_end',
            condition: { type: 'languageLevel', level: 3 },
            effects: [],
          },
        ],
      },
      node_end: {
        id: 'node_end',
        speaker: 'Lars',
        text: 'Farewell!',
        portrait: 'portrait_lars',
        autoAdvance: false,
        endConversation: true,
        responses: [],
      },
    },
  };

  it('all English options are always available (level 1)', () => {
    const engine   = createEngine(LANGUAGE_GATED_DIALOGUE);
    const registry = createRegistry({ languageSkill: 0 }); // Level 1
    engine.startDialogue(registry, 'lars', 'test_lang_gated');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[0].locked).toBe(false);
  });

  it('Level 2 option locked at language level 1', () => {
    const engine   = createEngine(LANGUAGE_GATED_DIALOGUE);
    const registry = createRegistry({ languageSkill: 0 });
    engine.startDialogue(registry, 'lars', 'test_lang_gated');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[1].locked).toBe(true);
  });

  it('Level 2 option unlocked at language level 2+', () => {
    const engine   = createEngine(LANGUAGE_GATED_DIALOGUE);
    const registry = createRegistry({ languageSkill: 20 }); // Level 2
    engine.startDialogue(registry, 'lars', 'test_lang_gated');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[1].locked).toBe(false);
  });

  it('Level 3 option locked at language level 2', () => {
    const engine   = createEngine(LANGUAGE_GATED_DIALOGUE);
    const registry = createRegistry({ languageSkill: 20 }); // Level 2
    engine.startDialogue(registry, 'lars', 'test_lang_gated');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[2].locked).toBe(true);
  });

  it('Level 3 option unlocked at language level 3+', () => {
    const engine   = createEngine(LANGUAGE_GATED_DIALOGUE);
    const registry = createRegistry({ languageSkill: 40 }); // Level 3
    engine.startDialogue(registry, 'lars', 'test_lang_gated');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[2].locked).toBe(false);
  });

  it('lock reason mentions the required Danish level', () => {
    const engine   = createEngine(LANGUAGE_GATED_DIALOGUE);
    const registry = createRegistry({ languageSkill: 0 });
    engine.startDialogue(registry, 'lars', 'test_lang_gated');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[1].lockReason).toMatch(/Danish Level 2/i);
    expect(responses[2].lockReason).toMatch(/Danish Level 3/i);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration tests — full conversation flows
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — integration: full conversation flow', () => {
  it('traverses lars_day1_tutorial "nervous → grocery list" path and applies effects', async () => {
    const { lars_day1_tutorial } = await import('../../src/data/dialogues/lars_day1_tutorial.js');
    const engine   = createEngine(lars_day1_tutorial);
    const registry = createRegistry({ xp: 0, level: 1 });

    engine.startDialogue(registry, 'lars', 'lars_day1_tutorial');
    expect(engine.getCurrentNode().id).toBe('node_start');

    engine.selectResponse(registry, 0); // "A bit nervous" → node_nervous
    expect(engine.getCurrentNode().id).toBe('node_nervous');

    engine.selectResponse(registry, 0); // "Of course — where do I go?" → node_grocery_list
    expect(engine.getCurrentNode().id).toBe('node_grocery_list');

    engine.selectResponse(registry, 0); // "Thank you, I'll head there" → node_mission_assigned (mission + relationship)
    expect(engine.getCurrentNode().id).toBe('node_mission_assigned');
  });

  it('traverses lars_day1_tutorial "excited → shop tips" branching path', async () => {
    const { lars_day1_tutorial } = await import('../../src/data/dialogues/lars_day1_tutorial.js');
    const engine   = createEngine(lars_day1_tutorial);
    const registry = createRegistry({ xp: 0, level: 1 });

    engine.startDialogue(registry, 'lars', 'lars_day1_tutorial');
    engine.selectResponse(registry, 1); // "Excited!" → node_excited
    expect(engine.getCurrentNode().id).toBe('node_excited');

    engine.selectResponse(registry, 0); // "Good point" → node_grocery_list
    expect(engine.getCurrentNode().id).toBe('node_grocery_list');

    engine.selectResponse(registry, 1); // "anything special" → node_shop_tips
    expect(engine.getCurrentNode().id).toBe('node_shop_tips');

    engine.selectResponse(registry, 0); // "Great tips" → node_mission_assigned (mission + relationship + encyclopedia)
    expect(engine.getCurrentNode().id).toBe('node_mission_assigned');
  });

  it('traverses lars_day1_tutorial to end and applies XP', async () => {
    const { lars_day1_tutorial } = await import('../../src/data/dialogues/lars_day1_tutorial.js');
    const engine   = createEngine(lars_day1_tutorial);
    const registry = createRegistry({ xp: 0, level: 1 });

    engine.startDialogue(registry, 'lars', 'lars_day1_tutorial');
    engine.selectResponse(registry, 0); // nervous
    engine.selectResponse(registry, 0); // where do I go
    engine.selectResponse(registry, 0); // head there (mission assigned)
    engine.selectResponse(registry, 0); // "Thanks, Lars" → node_end (+10 XP)
    expect(engine.getCurrentNode().id).toBe('node_end');
    // 10 XP from dialogue + bonus XP from RelationshipSystem changeRelationship call
    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThanOrEqual(10);
  });

  it('traverses mette_shopping specials path', async () => {
    const { mette_shopping } = await import('../../src/data/dialogues/mette_shopping.js');
    const engine   = createEngine(mette_shopping);
    const registry = createRegistry({ xp: 0, level: 1 });

    engine.startDialogue(registry, 'mette', 'mette_shopping');
    engine.selectResponse(registry, 1); // specials
    engine.selectResponse(registry, 0); // "I'll try it!" → encyclopedia smorrebrod
    const entries = registry.get(RK.ENCYCLOPEDIA_ENTRIES);
    expect(entries).toContain('smorrebrod');
  });

  it('traverses thomas_first_meeting Danish-attempt path', async () => {
    const { thomas_first_meeting } = await import('../../src/data/dialogues/thomas_first_meeting.js');
    const engine   = createEngine(thomas_first_meeting);
    const registry = createRegistry({ xp: 0, level: 1, languageSkill: 20 }); // Level 2

    engine.startDialogue(registry, 'thomas', 'thomas_first_meeting');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[2].locked).toBe(false); // Danish response available

    engine.selectResponse(registry, 2); // "Undskyld..." → +10 relationship, node_danish_attempt
    const relMap = registry.get(RK.NPC_RELATIONSHIPS);
    expect(relMap['thomas']).toBeGreaterThan(10);
    expect(engine.getCurrentNode().id).toBe('node_danish_attempt');
  });

  it('dialogue effects reflect in registry after conversation ends', async () => {
    const { lars_day1_tutorial } = await import('../../src/data/dialogues/lars_day1_tutorial.js');
    const engine   = createEngine(lars_day1_tutorial);
    const registry = createRegistry({ xp: 50, level: 2 });

    engine.startDialogue(registry, 'lars', 'lars_day1_tutorial');
    engine.selectResponse(registry, 0); // nervous
    engine.selectResponse(registry, 0); // where do I go
    engine.selectResponse(registry, 0); // head there right away (mission + relationship)
    engine.selectResponse(registry, 0); // "Thanks, Lars" → node_end (+10 XP)

    engine.endDialogue(registry);

    expect(engine.isConversationActive()).toBe(false);
    expect(registry.get(RK.PLAYER_XP)).toBeGreaterThan(50);
    const history = registry.get(RK.DIALOGUE_HISTORY);
    expect(history['lars_day1_tutorial']).toBeDefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Lock reason text coverage
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — _getLockReason coverage', () => {
  it('produces relationship lock reason', () => {
    const engine = new DialogueEngine();
    const reason = engine._getLockReason({ type: 'relationship', value: 40 });
    expect(reason).toMatch(/40/);
  });

  it('produces hasItem lock reason', () => {
    const engine = new DialogueEngine();
    const reason = engine._getLockReason({ type: 'hasItem', itemId: 'some_item' });
    expect(reason).toMatch(/some_item/);
  });

  it('produces flag lock reason', () => {
    const engine = new DialogueEngine();
    const reason = engine._getLockReason({ type: 'flag', key: 'my_flag', value: true });
    expect(reason).toMatch(/my_flag/);
  });

  it('produces skill lock reason', () => {
    const engine = new DialogueEngine();
    const reason = engine._getLockReason({ type: 'skill', skillKey: 'cycling', level: 3 });
    expect(reason).toMatch(/cycling/i);
    expect(reason).toMatch(/3/);
  });

  it('returns generic fallback for unknown condition type', () => {
    const engine = new DialogueEngine();
    const reason = engine._getLockReason({ type: 'unknown_type' });
    expect(reason).toBeTruthy();
  });

  it('returns empty string for null condition', () => {
    const engine = new DialogueEngine();
    expect(engine._getLockReason(null)).toBe('');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unknown / bad skill key in conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('DialogueEngine — unknown skill key in conditions', () => {
  it('returns locked (false) for skill condition with bad key', () => {
    const dialogueBadKey = {
      conversationId: 'test_bad_skill',
      npcId: 'lars',
      rootNode: 'node_start',
      nodes: {
        node_start: {
          id: 'node_start',
          speaker: 'Lars',
          text: 'Hi!',
          portrait: 'portrait_lars',
          autoAdvance: false,
          endConversation: false,
          responses: [
            {
              text: 'Bad skill key response',
              nextNode: 'node_end',
              condition: { type: 'skill', skillKey: 'nonexistent_skill', level: 1 },
              effects: [],
            },
          ],
        },
        node_end: {
          id: 'node_end',
          speaker: 'Lars',
          text: 'Bye!',
          portrait: 'portrait_lars',
          autoAdvance: false,
          endConversation: true,
          responses: [],
        },
      },
    };
    const engine   = createEngine(dialogueBadKey);
    const registry = createRegistry();
    engine.startDialogue(registry, 'lars', 'test_bad_skill');
    const responses = engine.getAvailableResponses(registry);
    expect(responses[0].locked).toBe(true); // bad key → condition returns false
  });

  it('does not throw when skill effect has bad key', () => {
    const dialogueBadEffectKey = {
      conversationId: 'test_bad_effect_key',
      npcId: 'lars',
      rootNode: 'node_start',
      nodes: {
        node_start: {
          id: 'node_start',
          speaker: 'Lars',
          text: 'Hi!',
          portrait: 'portrait_lars',
          autoAdvance: false,
          endConversation: false,
          responses: [
            {
              text: 'OK',
              nextNode: 'node_end',
              effects: [{ type: 'skill', skillKey: 'nonexistent', delta: 5 }],
            },
          ],
        },
        node_end: {
          id: 'node_end',
          speaker: 'Lars',
          text: 'Bye!',
          portrait: 'portrait_lars',
          autoAdvance: false,
          endConversation: true,
          responses: [],
        },
      },
    };
    const engine   = createEngine(dialogueBadEffectKey);
    const registry = createRegistry({ xp: 0 });
    engine.startDialogue(registry, 'lars', 'test_bad_effect_key');
    expect(() => engine.selectResponse(registry, 0)).not.toThrow();
  });
});
