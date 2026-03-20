/**
 * src/data/missions.js
 * Story mission definitions keyed by mission ID.
 *
 * Each mission has:
 *  - id           — unique identifier
 *  - type         — always 'mission' for story missions
 *  - title        — player-visible short title
 *  - description  — player-visible description text
 *  - urgency      — 'critical' | 'urgent' | 'normal' | 'low'
 *  - xpReward     — XP awarded on completion
 *  - xpPenalty    — XP deducted if skipped / expired
 *  - completionCondition — checked by QuestEngine.checkCompletionCondition
 *  - skippable    — whether the player can dismiss this mission
 */

export const MISSIONS = {
  story_grocery_run: {
    id: 'story_grocery_run',
    type: 'story',
    title: 'Buy groceries from Netto',
    description: 'Lars gave you a shopping list: Rugbrød, pasta, and milk. Head to Netto nearby.',
    urgency: 'normal',
    xpReward: 15,
    xpPenalty: 0,
    completionCondition: { type: 'flag', key: 'first_grocery_complete', value: true },
    skippable: false,
  },
  story_first_class: {
    id: 'story_first_class',
    type: 'story',
    title: 'Attend the language school',
    description: 'Lars mentioned a free introductory class at the language school. It might be worth checking out.',
    urgency: 'normal',
    xpReward: 25,
    xpPenalty: 0,
    completionCondition: { type: 'locationVisited', locationId: 'language_school' },
    skippable: false,
  },
  story_first_metro: {
    id: 'story_first_metro',
    type: 'story',
    title: 'Take the metro',
    description: 'Sofie mentioned the metro is the fastest way across town. Try it out.',
    urgency: 'normal',
    xpReward: 20,
    xpPenalty: 0,
    completionCondition: { type: 'flag', key: 'first_metro_ride', value: true },
    skippable: false,
  },
  story_first_workday: {
    id: 'story_first_workday',
    type: 'story',
    title: 'Attend your first work day',
    description: 'It\'s time to start your job. Head to the workplace during morning hours.',
    urgency: 'normal',
    xpReward: 30,
    xpPenalty: 0,
    completionCondition: { type: 'flag', key: 'first_workday_complete', value: true },
    skippable: false,
  },
  story_one_week: {
    id: 'story_one_week',
    type: 'story',
    title: 'Survive your first week',
    description: 'You\'ve been in Denmark for a whole week. Take a moment to reflect.',
    urgency: 'normal',
    xpReward: 50,
    xpPenalty: 0,
    completionCondition: { type: 'dayReached', day: 7 },
    skippable: false,
  },
  story_thomas_second: {
    id: 'story_thomas_second',
    type: 'story',
    title: 'Talk to Thomas again',
    description: 'Thomas seemed guarded last time. Maybe a second conversation would go differently.',
    urgency: 'normal',
    xpReward: 25,
    xpPenalty: 0,
    completionCondition: { type: 'npcTalked', npcId: 'thomas' },
    skippable: false,
  },
  story_pant_run: {
    id: 'story_pant_run',
    type: 'story',
    title: 'Return 5 pant bottles',
    description: 'Mette mentioned you can return bottles for money. Collect and return 5 pant bottles.',
    urgency: 'normal',
    xpReward: 20,
    xpPenalty: 0,
    completionCondition: { type: 'pantReturned', minCount: 5 },
    skippable: false,
  },
  story_lars_coffee: {
    id: 'story_lars_coffee',
    type: 'story',
    title: 'Have coffee with Lars',
    description: 'Lars invited you for a cup of coffee. That\'s a big deal in Denmark.',
    urgency: 'normal',
    xpReward: 40,
    xpPenalty: 0,
    completionCondition: { type: 'flag', key: 'lars_coffee_complete', value: true },
    skippable: false,
  },
};
