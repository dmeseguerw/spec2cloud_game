/**
 * src/data/dialogues/thomas_second_meeting.js
 * Second meeting with Thomas after he warms up.
 * 7 nodes, 2 branching paths; relates to story_thomas_second mission.
 */

export const thomas_second_meeting = {
  conversationId: 'thomas_second_meeting',
  npcId: 'thomas',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Thomas',
      text: '... Oh. You again. Still here, I see. Most people last about a week before the weather sends them home.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I\'m doing well, actually. I\'m starting to like it here.',
          nextNode: 'node_surprised',
          effects: [],
        },
        {
          text: 'I won\'t lie — it has been tough. But I\'m sticking with it.',
          nextNode: 'node_respect',
          effects: [],
        },
      ],
    },
    node_surprised: {
      id: 'node_surprised',
      speaker: 'Thomas',
      text: '... Huh. You sound like you mean it. Most newcomers say that in the first week, then disappear. What do you like about it?',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'The city, the culture — and honestly, the people have been kind.',
          nextNode: 'node_opening_up',
          effects: [
            { type: 'relationship', npcId: 'thomas', delta: 8 },
          ],
        },
        {
          text: 'The orderliness. Everything just works.',
          nextNode: 'node_danish_values',
          effects: [
            { type: 'relationship', npcId: 'thomas', delta: 5 },
          ],
        },
      ],
    },
    node_respect: {
      id: 'node_respect',
      speaker: 'Thomas',
      text: 'At least you are honest about it. That is... more than most people admit. The first months are hard for everyone. Even Danes moving cities find it difficult.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'That actually makes me feel better. Thank you.',
          nextNode: 'node_opening_up',
          effects: [
            { type: 'relationship', npcId: 'thomas', delta: 10 },
          ],
        },
      ],
    },
    node_opening_up: {
      id: 'node_opening_up',
      speaker: 'Thomas',
      text: 'Look... I know I was not very welcoming before. It is just — I have seen too many people treat Denmark like a holiday or a stepping stone. It is my home. I care about it.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I understand. I want to be a real part of the community, not just a tourist.',
          nextNode: 'node_end_positive',
          effects: [
            { type: 'xp', amount: 20 },
            { type: 'relationship', npcId: 'thomas', delta: 10 },
            { type: 'flag', key: 'thomas_warmed_up', value: true },
          ],
        },
      ],
    },
    node_danish_values: {
      id: 'node_danish_values',
      speaker: 'Thomas',
      text: 'Yes. We take that for granted, but it comes from decades of trust and civic responsibility. Everyone paying taxes, following the rules. It works because we all do our part.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I want to be a part of that. I\'m trying.',
          nextNode: 'node_end_positive',
          effects: [
            { type: 'xp', amount: 15 },
            { type: 'relationship', npcId: 'thomas', delta: 8 },
            { type: 'flag', key: 'thomas_warmed_up', value: true },
          ],
        },
        {
          text: 'That\'s an admirable system.',
          nextNode: 'node_end_neutral',
          effects: [
            { type: 'xp', amount: 10 },
            { type: 'relationship', npcId: 'thomas', delta: 5 },
          ],
        },
      ],
    },
    node_end_positive: {
      id: 'node_end_positive',
      speaker: 'Thomas',
      text: 'Good. I will hold you to that. If you need anything — local knowledge, bureaucracy questions — you can ask me. Do not make me regret it.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
    node_end_neutral: {
      id: 'node_end_neutral',
      speaker: 'Thomas',
      text: 'Hmm. Yes. Well. Do not make a mess of things and we will get along fine. Farvel.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
