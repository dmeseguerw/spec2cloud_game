/**
 * src/data/dialogues/mette_shopping.js
 * Shopping assistance conversation with Mette, the grocery clerk.
 * 8 nodes, 2 branching paths, language-gated Danish farewell.
 */

export const mette_shopping = {
  conversationId: 'mette_shopping',
  npcId: 'mette',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Mette',
      text: 'Hej! Welcome to Kvickly. Are you finding everything all right?',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Actually, I could use some help finding things.',
          nextNode: 'node_shopping_help',
          effects: [],
        },
        {
          text: 'Do you have any specials or recommendations today?',
          nextNode: 'node_specials',
          effects: [],
        },
      ],
    },

    node_shopping_help: {
      id: 'node_shopping_help',
      speaker: 'Mette',
      text: 'Of course! I am happy to help. Are you looking for something specific, or just the basics?',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I want to try some traditional Danish food.',
          nextNode: 'node_danish_food',
          effects: [],
        },
        {
          text: 'Just the everyday basics for now.',
          nextNode: 'node_basics',
          effects: [],
        },
      ],
    },

    node_specials: {
      id: 'node_specials',
      speaker: 'Mette',
      text: 'Yes! Today we have fresh rugbrød — that is Danish rye bread — and some lovely smørrebrød toppings. Very traditional Danish lunch food. You should try it!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'That sounds delicious, I\'ll try it!',
          nextNode: 'node_purchase',
          effects: [
            { type: 'encyclopedia', entryId: 'smorrebrod' },
          ],
        },
        {
          text: 'Thanks, I\'m just browsing for now.',
          nextNode: 'node_end',
          effects: [],
        },
      ],
    },

    node_danish_food: {
      id: 'node_danish_food',
      speaker: 'Mette',
      text: 'Oh, wonderful! I recommend starting with rugbrød — our dark rye bread. It is a staple of Danish life. Also try leverpostej, which is liver pâté. Very popular for lunch!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I\'ll take the rugbrød! Where can I find it?',
          nextNode: 'node_purchase',
          effects: [
            { type: 'xp', amount: 5 },
            { type: 'encyclopedia', entryId: 'rugbrod' },
          ],
        },
      ],
    },

    node_basics: {
      id: 'node_basics',
      speaker: 'Mette',
      text: 'No problem! Dairy is over in aisle three, fresh bread by the entrance, and the frozen section is at the back. If you need anything else, just ask.',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Perfect, thanks so much for your help!',
          nextNode: 'node_end',
          effects: [
            { type: 'relationship', npcId: 'mette', delta: 3 },
          ],
        },
      ],
    },

    node_purchase: {
      id: 'node_purchase',
      speaker: 'Mette',
      text: 'Excellent choice! That comes to 24 kroner please. Will there be anything else for you today?',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Tak! Det var det. (Thanks! That\'s all.)',
          nextNode: 'node_end_danish',
          condition: { type: 'languageLevel', level: 2 },
          effects: [
            { type: 'relationship', npcId: 'mette', delta: 5 },
            { type: 'skill', skillKey: 'language', delta: 1 },
          ],
        },
        {
          text: 'Thank you, that\'s all!',
          nextNode: 'node_end',
          effects: [
            { type: 'relationship', npcId: 'mette', delta: 2 },
          ],
        },
      ],
    },

    node_end: {
      id: 'node_end',
      speaker: 'Mette',
      text: 'Have a lovely day! Come back anytime.',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },

    node_end_danish: {
      id: 'node_end_danish',
      speaker: 'Mette',
      text: 'Oh, you speak a little Danish! How lovely. Hav en god dag! Come back soon.',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
