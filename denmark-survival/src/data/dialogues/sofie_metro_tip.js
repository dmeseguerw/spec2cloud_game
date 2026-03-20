/**
 * src/data/dialogues/sofie_metro_tip.js
 * Day 3 conversation with Sofie about metro transport.
 * 6 nodes, 2 branching paths; assigns story_first_metro mission.
 */

export const sofie_metro_tip = {
  conversationId: 'sofie_metro_tip',
  npcId: 'sofie',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Sofie',
      text: 'Hey! You\'re the new neighbour, right? I\'m Sofie — I moved here from the Netherlands two years ago. Getting around okay?',
      portrait: 'portrait_sofie',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Still figuring it out, honestly. Any tips?',
          nextNode: 'node_transport_tips',
          effects: [],
        },
        {
          text: 'I\'m managing, but I\'d love to hear from someone who\'s been through it.',
          nextNode: 'node_expat_chat',
          effects: [
            { type: 'relationship', npcId: 'sofie', delta: 3 },
          ],
        },
      ],
    },
    node_expat_chat: {
      id: 'node_expat_chat',
      speaker: 'Sofie',
      text: 'Oh I completely understand! Those first weeks are intense. The best thing I did was master the metro system early on. It completely opened up the city for me.',
      portrait: 'portrait_sofie',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'The metro? Tell me more!',
          nextNode: 'node_transport_tips',
          effects: [],
        },
      ],
    },
    node_transport_tips: {
      id: 'node_transport_tips',
      speaker: 'Sofie',
      text: 'The Copenhagen Metro is super reliable — runs 24 hours! You\'ll want a Rejsekort card for easy check-in and check-out. Way cheaper than buying single tickets.',
      portrait: 'portrait_sofie',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I should try taking it myself.',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_first_metro' },
            { type: 'encyclopedia', entryId: 'metro_system' },
          ],
        },
        {
          text: 'What about cycling? I heard it\'s big here.',
          nextNode: 'node_cycling',
          effects: [],
        },
      ],
    },
    node_cycling: {
      id: 'node_cycling',
      speaker: 'Sofie',
      text: 'Oh definitely! Copenhagen is amazing for cycling. But I\'d start with the metro first — it\'s easier to get your bearings. You can try cycling once you know the layout of the city.',
      portrait: 'portrait_sofie',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Makes sense — I\'ll try the metro first.',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_first_metro' },
          ],
        },
      ],
    },
    node_mission_assigned: {
      id: 'node_mission_assigned',
      speaker: 'Sofie',
      text: 'Great! The nearest station is just a few minutes away. Don\'t forget to check in AND check out — they fine you if you forget. See you around!',
      portrait: 'portrait_sofie',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Thanks Sofie! Hope to run into you again.',
          nextNode: 'node_end',
          effects: [
            { type: 'relationship', npcId: 'sofie', delta: 5 },
            { type: 'xp', amount: 10 },
          ],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Sofie',
      text: 'I\'m usually at the language school or the café near the park. Come find me anytime — it\'s good to know fellow expats!',
      portrait: 'portrait_sofie',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
