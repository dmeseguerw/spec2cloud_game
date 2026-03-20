/**
 * src/data/dialogues/lars_coffee_invitation.js
 * Lars invites the player over for coffee (Day 13+).
 * 4 nodes, 2 branching paths; assigns story_lars_coffee mission.
 */

export const lars_coffee_invitation = {
  conversationId: 'lars_coffee_invitation',
  npcId: 'lars',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Lars',
      text: 'Hey, do you have a moment? You know, I was thinking — you have been here nearly two weeks already. That deserves celebrating. Would you like to come over for coffee tomorrow?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I\'d love that! Coffee sounds wonderful.',
          nextNode: 'node_accept',
          effects: [],
        },
        {
          text: 'That\'s very kind of you. What\'s the occasion?',
          nextNode: 'node_explain',
          effects: [],
        },
      ],
    },
    node_explain: {
      id: 'node_explain',
      speaker: 'Lars',
      text: 'In Denmark, sharing coffee is a big thing. It is how we build connections. No real occasion needed — just two neighbours getting to know each other better. "En kop kaffe" — a cup of coffee.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I wouldn\'t miss it. I\'ll be there.',
          nextNode: 'node_accept',
          effects: [
            { type: 'encyclopedia', entryId: 'danish_coffee_culture' },
          ],
        },
      ],
    },
    node_accept: {
      id: 'node_accept',
      speaker: 'Lars',
      text: 'Wonderful! Come by tomorrow afternoon — I make a very good kaffe. Maybe I will even make some wienerbrød — Danish pastries. You deserve a proper Danish welcome!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I\'m looking forward to it!',
          nextNode: 'node_end',
          effects: [
            { type: 'mission', missionId: 'story_lars_coffee' },
            { type: 'relationship', npcId: 'lars', delta: 8 },
            { type: 'xp', amount: 10 },
          ],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Lars',
      text: 'Vi ses i morgen! — See you tomorrow! Sleep well.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
