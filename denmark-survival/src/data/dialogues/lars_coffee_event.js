/**
 * src/data/dialogues/lars_coffee_event.js
 * The actual coffee event with Lars (Day 14+).
 * 8 nodes, 2 branching paths; completes story_lars_coffee mission.
 */

export const lars_coffee_event = {
  conversationId: 'lars_coffee_event',
  npcId: 'lars',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Lars',
      text: 'Come in, come in! Kaffe is ready. Sit down, please — I baked wienerbrød this morning, just for the occasion. How are you feeling after your first two weeks?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Overwhelmed but excited. I feel like I\'m finding my feet.',
          nextNode: 'node_reflection_positive',
          effects: [],
        },
        {
          text: 'Honestly? It\'s been harder than I expected.',
          nextNode: 'node_reflection_hard',
          effects: [],
        },
      ],
    },
    node_reflection_positive: {
      id: 'node_reflection_positive',
      speaker: 'Lars',
      text: 'That is the right spirit! The first weeks are always the hardest. But you have already done so much — groceries, the language school, getting around the city. You should be proud.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I couldn\'t have done it without your help, Lars.',
          nextNode: 'node_gratitude',
          effects: [
            { type: 'relationship', npcId: 'lars', delta: 10 },
          ],
        },
      ],
    },
    node_reflection_hard: {
      id: 'node_reflection_hard',
      speaker: 'Lars',
      text: 'I understand. Moving to a new country is one of the hardest things a person can do. But you are still here! That says a lot about you.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Thank you. That means a lot.',
          nextNode: 'node_gratitude',
          effects: [
            { type: 'relationship', npcId: 'lars', delta: 8 },
          ],
        },
        {
          text: 'I\'m going to keep trying. Denmark is growing on me.',
          nextNode: 'node_denmark_culture',
          effects: [
            { type: 'relationship', npcId: 'lars', delta: 10 },
          ],
        },
      ],
    },
    node_gratitude: {
      id: 'node_gratitude',
      speaker: 'Lars',
      text: 'That is what neighbours are for! Here in Denmark, we take care of each other. Have you noticed that? The way strangers hold doors, the way people queue patiently?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Yes! There\'s a sense of trust here I didn\'t expect.',
          nextNode: 'node_denmark_culture',
          effects: [],
        },
      ],
    },
    node_denmark_culture: {
      id: 'node_denmark_culture',
      speaker: 'Lars',
      text: 'Exactly! We call it "tillid" — trust. Danes trust the system, trust each other. It is the foundation of everything here. And now you are becoming part of that.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I like that idea. Tillid.',
          nextNode: 'node_coffee_cheers',
          effects: [
            { type: 'encyclopedia', entryId: 'tillid' },
            { type: 'skill', skillKey: 'cultural', delta: 2 },
          ],
        },
      ],
    },
    node_coffee_cheers: {
      id: 'node_coffee_cheers',
      speaker: 'Lars',
      text: 'Ha! Listen to you — already speaking Danish. Take this wienerbrød. Skål — that is cheers, but for coffee!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Skål! This is delicious, by the way.',
          nextNode: 'node_end',
          effects: [
            { type: 'flag', key: 'lars_coffee_complete', value: true },
            { type: 'xp', amount: 30 },
            { type: 'relationship', npcId: 'lars', delta: 15 },
          ],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Lars',
      text: 'You are welcome here anytime. Denmark is lucky to have you. Tillykke — congratulations on surviving your first two weeks!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
