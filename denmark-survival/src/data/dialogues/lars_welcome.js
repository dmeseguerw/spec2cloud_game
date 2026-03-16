/**
 * src/data/dialogues/lars_welcome.js
 * Welcome conversation with Lars, the tutorial guide / helpful neighbour.
 * 8 nodes, 3 branching paths, language-gated option.
 */

export const lars_welcome = {
  conversationId: 'lars_welcome',
  npcId: 'lars',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Lars',
      text: 'Hej! Welcome to Denmark! I am Lars — your neighbour. How are you settling in so far?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Honestly, a bit overwhelmed. Everything is so different.',
          nextNode: 'node_overwhelmed',
          effects: [],
        },
        {
          text: 'I\'m really excited to be here!',
          nextNode: 'node_excited',
          effects: [],
        },
      ],
    },

    node_overwhelmed: {
      id: 'node_overwhelmed',
      speaker: 'Lars',
      text: 'That is completely normal. Denmark can feel very different at first. What is confusing you the most?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'The language — Danish sounds impossible to learn.',
          nextNode: 'node_language_advice',
          effects: [],
        },
        {
          text: 'I don\'t know many people here yet.',
          nextNode: 'node_social_advice',
          effects: [],
        },
      ],
    },

    node_excited: {
      id: 'node_excited',
      speaker: 'Lars',
      text: 'That is wonderful to hear! Denmark is a great place once you get used to it. What are you most looking forward to?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'What do you love most about living here?',
          nextNode: 'node_lars_love',
          effects: [],
        },
        {
          text: 'Jeg vil gerne lære dansk! (I want to learn Danish!)',
          nextNode: 'node_language_advice',
          condition: { type: 'languageLevel', level: 2 },
          effects: [
            { type: 'relationship', npcId: 'lars', delta: 5 },
          ],
        },
        {
          text: 'I want to explore the city.',
          nextNode: 'node_language_advice',
          effects: [],
        },
      ],
    },

    node_language_advice: {
      id: 'node_language_advice',
      speaker: 'Lars',
      text: 'Danish is tricky, but the locals really appreciate any effort you make! Start with "Hej" (hello) and "Tak" (thank you). Practice a little every day and you will be surprised how fast it comes.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Thanks for the encouragement, I\'ll keep practising.',
          nextNode: 'node_end_positive',
          effects: [
            { type: 'xp', amount: 10 },
          ],
        },
        {
          text: 'Tak! Jeg prøver. (Thanks! I\'ll try.)',
          nextNode: 'node_end_danish',
          condition: { type: 'languageLevel', level: 2 },
          effects: [
            { type: 'xp', amount: 15 },
            { type: 'relationship', npcId: 'lars', delta: 8 },
            { type: 'skill', skillKey: 'language', delta: 2 },
          ],
        },
      ],
    },

    node_social_advice: {
      id: 'node_social_advice',
      speaker: 'Lars',
      text: 'I understand. Danes can seem reserved at first, but once you build trust they are very loyal friends. I can introduce you to a few people in the neighbourhood — would that help?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'That would be wonderful, thank you!',
          nextNode: 'node_end_positive',
          effects: [
            { type: 'xp', amount: 10 },
            { type: 'relationship', npcId: 'lars', delta: 5 },
            { type: 'flag', key: 'lars_offered_introductions', value: true },
          ],
        },
      ],
    },

    node_lars_love: {
      id: 'node_lars_love',
      speaker: 'Lars',
      text: 'Oh, many things! But I think what I love most is the concept of "hygge" — the art of creating cosy, convivial moments with people you care about. It is hard to translate, but you will feel it when you experience it.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'That sounds lovely. I would love to learn more about Danish culture.',
          nextNode: 'node_end_positive',
          effects: [
            { type: 'xp', amount: 10 },
            { type: 'encyclopedia', entryId: 'hygge' },
          ],
        },
      ],
    },

    node_end_positive: {
      id: 'node_end_positive',
      speaker: 'Lars',
      text: 'Great! My door is always open if you need anything. Velkommen til Danmark — welcome to Denmark!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },

    node_end_danish: {
      id: 'node_end_danish',
      speaker: 'Lars',
      text: 'Ha! Your Danish is already coming along! I am impressed. We will make a true Dane of you yet. Hav en god dag!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
