/**
 * src/data/dialogues/lars_day1_tutorial.js
 * Day 1 opening tutorial conversation with Lars.
 * Replaces lars_welcome as the Day 1 opening dialogue.
 * 8 nodes, 2 branching paths; assigns story_grocery_run mission.
 */

export const lars_day1_tutorial = {
  conversationId: 'lars_day1_tutorial',
  npcId: 'lars',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Lars',
      text: 'Hej! I am Lars, your neighbour. Welcome to Denmark — and to your new home! Moving here is a big step. How are you feeling?',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'A bit nervous, honestly. Everything feels new.',
          nextNode: 'node_nervous',
          effects: [],
        },
        {
          text: 'Excited! I\'ve been looking forward to this.',
          nextNode: 'node_excited',
          effects: [],
        },
      ],
    },
    node_nervous: {
      id: 'node_nervous',
      speaker: 'Lars',
      text: 'That is completely natural. Your first days will be a bit chaotic, but it gets easier. Let me help you get started. The most urgent thing is groceries — your fridge is empty!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Of course — where do I go?',
          nextNode: 'node_grocery_list',
          effects: [],
        },
      ],
    },
    node_excited: {
      id: 'node_excited',
      speaker: 'Lars',
      text: 'Ha, I like that attitude! Denmark will suit you. Before you start exploring though, let\'s get the practical things sorted. You will need food — your fridge is completely empty.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Good point. What should I get?',
          nextNode: 'node_grocery_list',
          effects: [],
        },
      ],
    },
    node_grocery_list: {
      id: 'node_grocery_list',
      speaker: 'Lars',
      text: 'I have written a little list for you: rugbrød — that is dark rye bread — pasta, and milk. Netto is just around the corner, very affordable. Here, take this list.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Thank you, I\'ll head there right away.',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_grocery_run' },
            { type: 'relationship', npcId: 'lars', delta: 5 },
          ],
        },
        {
          text: 'Is there anything special I should know about Danish shops?',
          nextNode: 'node_shop_tips',
          effects: [],
        },
      ],
    },
    node_shop_tips: {
      id: 'node_shop_tips',
      speaker: 'Lars',
      text: 'A few things! Bring your own bags — plastic bags cost extra. Self-checkout is common, and you always pay with card, almost nobody uses cash. Oh, and Netto is great for basics. Bilka is for bigger shops.',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Great tips. I\'ll go get those groceries now.',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_grocery_run' },
            { type: 'relationship', npcId: 'lars', delta: 5 },
            { type: 'encyclopedia', entryId: 'danish_shops' },
          ],
        },
      ],
    },
    node_mission_assigned: {
      id: 'node_mission_assigned',
      speaker: 'Lars',
      text: 'Fantastic. Netto is right around the corner — you can\'t miss it. I will be home if you need anything. My door is always open!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Thanks, Lars. I\'ll see you soon.',
          nextNode: 'node_end',
          effects: [
            { type: 'xp', amount: 10 },
          ],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Lars',
      text: 'Goddag! Ah — that means "good day"! You are already learning. Welcome to Denmark!',
      portrait: 'portrait_lars',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
