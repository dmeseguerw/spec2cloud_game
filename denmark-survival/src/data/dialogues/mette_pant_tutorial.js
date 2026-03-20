/**
 * src/data/dialogues/mette_pant_tutorial.js
 * Mette explains the pant (bottle return) system.
 * 6 nodes, 2 branching paths; assigns story_pant_run mission.
 */

export const mette_pant_tutorial = {
  conversationId: 'mette_pant_tutorial',
  npcId: 'mette',
  rootNode: 'node_start',
  nodes: {
    node_start: {
      id: 'node_start',
      speaker: 'Mette',
      text: 'Hej! Oh, I noticed you left a bag of bottles on the counter last time. Did you know you can return them for money? It\'s called "pant"!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'No, I had no idea! How does it work?',
          nextNode: 'node_pant_explain',
          effects: [],
        },
        {
          text: 'Oh yes, I\'ve seen the machine! I just wasn\'t sure how to use it.',
          nextNode: 'node_machine_explain',
          effects: [],
        },
      ],
    },
    node_pant_explain: {
      id: 'node_pant_explain',
      speaker: 'Mette',
      text: 'In Denmark, you pay a small deposit — pant — when you buy drinks in plastic bottles or cans. When you return them, you get the money back! It is a great system for recycling.',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'That\'s brilliant! Where do I return them?',
          nextNode: 'node_machine_explain',
          effects: [
            { type: 'encyclopedia', entryId: 'pant_system' },
          ],
        },
      ],
    },
    node_machine_explain: {
      id: 'node_machine_explain',
      speaker: 'Mette',
      text: 'We have a pant machine right at the entrance. Feed the bottles in one by one — they scan the barcode automatically. Then print your receipt and bring it to the till to get cash or deduct from your shopping!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I\'ll collect some bottles and try it out!',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_pant_run' },
          ],
        },
        {
          text: 'Is there a minimum number before it\'s worth it?',
          nextNode: 'node_tips',
          effects: [],
        },
      ],
    },
    node_tips: {
      id: 'node_tips',
      speaker: 'Mette',
      text: 'Not really, but it is best to collect a few. Each bottle or can gives you one or two kroner back. People save them up and return a big bag at once. Five is a good start!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'I\'ll aim for five bottles!',
          nextNode: 'node_mission_assigned',
          effects: [
            { type: 'mission', missionId: 'story_pant_run' },
          ],
        },
      ],
    },
    node_mission_assigned: {
      id: 'node_mission_assigned',
      speaker: 'Mette',
      text: 'Perfect! And look around — sometimes people leave bottles near bins outside. You are welcome to grab those too, nobody minds. Every little bit helps the environment!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: false,
      responses: [
        {
          text: 'Great tip, thanks Mette!',
          nextNode: 'node_end',
          effects: [
            { type: 'relationship', npcId: 'mette', delta: 5 },
            { type: 'xp', amount: 10 },
          ],
        },
      ],
    },
    node_end: {
      id: 'node_end',
      speaker: 'Mette',
      text: 'Of course! It is just one of those small things that makes life in Denmark a little easier. See you next time!',
      portrait: 'portrait_mette',
      autoAdvance: false,
      endConversation: true,
      responses: [],
    },
  },
};
