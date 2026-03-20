/**
 * src/data/missionSchedule.js
 * Defines the day-by-day mission/dialogue schedule and prerequisite logic.
 *
 * Each entry describes when an NPC dialogue becomes available:
 *  - day           — earliest game day
 *  - dialogueId    — conversation key to start
 *  - prerequisite  — condition that must be met (recursive, supports 'and')
 *  - npcId         — NPC identifier
 *  - npcName       — display name for the NPC
 */

export const MISSION_SCHEDULE = [
  {
    day: 1,
    dialogueId: 'lars_day1_tutorial',
    prerequisite: { type: 'flag', key: 'character_creation_complete', value: true },
    npcId: 'lars',
    npcName: 'Lars',
  },
  {
    day: 2,
    dialogueId: 'lars_day2_language',
    prerequisite: { type: 'questCompleted', questId: 'story_grocery_run' },
    npcId: 'lars',
    npcName: 'Lars',
  },
  {
    day: 3,
    dialogueId: 'sofie_metro_tip',
    prerequisite: { type: 'dayReached', day: 3 },
    npcId: 'sofie',
    npcName: 'Sofie',
  },
  {
    day: 8,
    dialogueId: 'thomas_second_meeting',
    prerequisite: { type: 'questCompleted', questId: 'thomas_first_meeting' },
    npcId: 'thomas',
    npcName: 'Thomas',
  },
  {
    day: 11,
    dialogueId: 'mette_pant_tutorial',
    prerequisite: {
      type: 'and',
      conditions: [
        { type: 'questCompleted', questId: 'story_grocery_run' },
        { type: 'dayReached', day: 11 },
      ],
    },
    npcId: 'mette',
    npcName: 'Mette',
  },
  {
    day: 13,
    dialogueId: 'lars_coffee_invitation',
    prerequisite: {
      type: 'and',
      conditions: [
        { type: 'relationship', npcId: 'lars', value: 50 },
        { type: 'dayReached', day: 13 },
      ],
    },
    npcId: 'lars',
    npcName: 'Lars',
  },
  {
    day: 14,
    dialogueId: 'lars_coffee_event',
    prerequisite: { type: 'questActive', questId: 'story_lars_coffee' },
    npcId: 'lars',
    npcName: 'Lars',
  },
];

/**
 * Get the list of available dialogues for a given day and game state.
 * @param {number} currentDay
 * @param {object} registry - Phaser registry or mock
 * @param {object} questEngine - QuestEngine module
 * @returns {Array} Available schedule entries
 */
export function getAvailableDialogues(currentDay, registry, questEngine) {
  return MISSION_SCHEDULE.filter(entry => {
    if (entry.day > currentDay) return false;
    return checkPrerequisite(entry.prerequisite, currentDay, registry, questEngine);
  });
}

/**
 * Recursively check a prerequisite condition.
 * @param {object|null} prereq
 * @param {number} currentDay
 * @param {object} registry
 * @param {object} questEngine
 * @returns {boolean}
 */
function checkPrerequisite(prereq, currentDay, registry, questEngine) {
  if (!prereq) return true;
  switch (prereq.type) {
    case 'flag': {
      const flags = registry.get('game_flags') || {};
      return flags[prereq.key] === prereq.value;
    }
    case 'dayReached':
      return currentDay >= prereq.day;
    case 'questCompleted':
      if (!questEngine) return false;
      return questEngine.getCompletedTasks(registry).some(t => t.id === prereq.questId && t.status === 'completed');
    case 'questActive':
      if (!questEngine) return false;
      return questEngine.getActiveTasks(registry).some(t => t.id === prereq.questId);
    case 'relationship': {
      const relMap = registry.get('npc_relationships') || {};
      return (relMap[prereq.npcId] ?? 0) >= prereq.value;
    }
    case 'and':
      return (prereq.conditions || []).every(c =>
        checkPrerequisite(c, currentDay, registry, questEngine),
      );
    default:
      return false;
  }
}
