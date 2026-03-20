/**
 * src/data/dialogues/lars_day2_language.js
 * Day 2 conversation with Lars about language classes.
 * 6 nodes, 2 branching paths; assigns story_first_class mission.
 */

export const lars_day2_language = {
  conversationId: 'lars_day2_language',
  npcId: 'lars',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Lars',
      text: 'Morning! Did you sleep well? I thought of something — have you heard about the free language classes at the school nearby?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'No, I didn\'t know about that. Tell me more!',
          nextNode: 'node_explain',
          effects: [],
        },
        {
          text: 'I\'m not sure I need language classes yet.',
          nextNode: 'node_convince',
          effects: [],
        },
      ],
    },
    node_explain: {
      id: 'node_explain',
      speaker: 'Lars',
      text: 'The municipality offers free Danish classes for newcomers. It is a great way to meet people and learn the basics. The introductory class is free and very relaxed — no pressure!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'That sounds perfect. I\'ll check it out.',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_first_class' },
            { type: 'relationship', npcId: 'lars', delta: 5 },
          ],
        },
      ],
    },
    node_convince: {
      id: 'node_convince',
      speaker: 'Lars',
      text: 'Trust me, even a little Danish goes a long way. Locals really appreciate the effort, and you will find everyday life much easier. At least try the free introductory session?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'All right, I\'ll give it a go.',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_first_class' },
            { type: 'relationship', npcId: 'lars', delta: 3 },
          ],
        },
        {
          text: 'Maybe another time.',
          nextNode: 'node_end_declined',
          effects: [],
        },
      ],
    },
    node_mission_assigned: {
      id: 'node_mission_assigned',
      speaker: 'Lars',
      text: 'Excellent! The school is about a ten minute walk from here. Go any time during the day — they welcome newcomers all week.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Thanks for the recommendation, Lars!',
          nextNode: 'node_end',
          effects: [
            { type: 'xp', amount: 5 },
          ],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Lars',
      text: 'Of course! Good luck — I think you will enjoy it. Hej hej!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
    node_end_declined: {
      id: 'node_end_declined',
      speaker: 'Lars',
      text: 'No pressure. The offer stands whenever you are ready. I will see you around!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
