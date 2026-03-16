/**
 * src/data/dialogues/thomas_first_meeting.js
 * Guarded first meeting with Thomas, the sceptic.
 * 8 nodes, 3 branching paths including language-gated path.
 */

export const thomas_first_meeting = {
  conversationId: 'thomas_first_meeting',
  npcId: 'thomas',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Thomas',
      text: 'Hmm. You are new here, aren\'t you? Another foreigner coming to Denmark. So, what brings you here exactly?',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I just want to fit in and learn about Danish culture.',
          nextNode: 'node_defensive',
          effects: [],
        },
        {
          text: 'I have a deep respect for Denmark and its people.',
          nextNode: 'node_respectful',
          effects: [],
        },
        {
          text: 'Undskyld, taler du engelsk? (Excuse me, do you speak English?)',
          nextNode: 'node_danish_attempt',
          condition: { type: 'languageLevel', level: 2 },
          effects: [
            { type: 'relationship', npcId: 'thomas', delta: 10 },
          ],
        },
      ],
    },

    node_defensive: {
      id: 'node_defensive',
      speaker: 'Thomas',
      text: 'Fit in? That is not something you can just decide to do. It takes time. Years, even. Most people give up and go home after a few months.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I understand. But I\'m committed to making it work here.',
          nextNode: 'node_challenge',
          effects: [],
        },
        {
          text: 'I understand your scepticism. I won\'t bother you further.',
          nextNode: 'node_end_neutral',
          effects: [],
        },
      ],
    },

    node_respectful: {
      id: 'node_respectful',
      speaker: 'Thomas',
      text: '... Hmm. At least you say the right things. Most people who come here think Denmark is just a version of their own country with better social services.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Could you tell me more about Danish customs and values?',
          nextNode: 'node_customs',
          effects: [
            { type: 'relationship', npcId: 'thomas', delta: 5 },
          ],
        },
        {
          text: 'I appreciate that. I\'ll leave you in peace.',
          nextNode: 'node_end_neutral',
          effects: [],
        },
      ],
    },

    node_danish_attempt: {
      id: 'node_danish_attempt',
      speaker: 'Thomas',
      text: '... You speak Danish? Well. That is... unexpected. Most newcomers do not even bother. Yes, I speak English. Where did you learn that phrase?',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I\'ve been studying it. I want to really understand this country.',
          nextNode: 'node_customs',
          effects: [],
        },
      ],
    },

    node_challenge: {
      id: 'node_challenge',
      speaker: 'Thomas',
      text: 'Committed, you say. Fine. Then learn the language, respect the rules, and do not expect special treatment just because things are different here. Can you do that?',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Yes. That seems perfectly fair.',
          nextNode: 'node_end_neutral',
          effects: [
            { type: 'xp', amount: 5 },
            { type: 'flag', key: 'thomas_issued_challenge', value: true },
          ],
        },
      ],
    },

    node_customs: {
      id: 'node_customs',
      speaker: 'Thomas',
      text: 'Well... The Danes value honesty, equality, and what we call "hygge" — a sense of warmth and togetherness. We do not boast, and we do not impose. If you respect those things, people will respect you back.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'That is genuinely fascinating. Thank you for sharing.',
          nextNode: 'node_end_positive',
          effects: [
            { type: 'xp', amount: 15 },
            { type: 'encyclopedia', entryId: 'hygge' },
          ],
        },
      ],
    },

    node_end_neutral: {
      id: 'node_end_neutral',
      speaker: 'Thomas',
      text: 'Hmm. We will see how long you last. Good luck.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },

    node_end_positive: {
      id: 'node_end_positive',
      speaker: 'Thomas',
      text: '... You might actually be all right. I will keep an eye on you. Farvel.',
      portrait: 'portrait_thomas',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
