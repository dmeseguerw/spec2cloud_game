/**
 * tests/helpers/testHelpers.js
 * Factory functions for creating test game state.
 */

import { MockRegistry } from '../mocks/PhaserMocks.js';

/**
 * Creates a fresh registry populated with new-game defaults.
 * Useful for tests that need a "just started" game state.
 */
export function createNewGameRegistry() {
  const registry = new MockRegistry();

  // Player core
  registry.set('player_name', 'TestPlayer');
  registry.set('player_nationality', 'Danish');
  registry.set('player_job', 'Student');
  registry.set('player_avatar', 'player');

  // Progression
  registry.set('player_xp', 0);
  registry.set('player_level', 1);
  registry.set('current_day', 1);
  registry.set('current_chapter', 1);
  registry.set('current_phase', 'Newcomer');

  // Skills
  registry.set('skill_language', 10);
  registry.set('skill_cycling', 10);
  registry.set('skill_cultural', 10);
  registry.set('skill_bureaucracy', 10);

  // Resources
  registry.set('player_money', 500);
  registry.set('player_health', 100);
  registry.set('player_happiness', 70);
  registry.set('player_energy', 100);

  // Inventory
  registry.set('inventory', []);

  // World state
  registry.set('player_x', 640);
  registry.set('player_y', 360);
  registry.set('player_scene', 'GameScene');
  registry.set('npc_relationships', {});
  registry.set('encyclopedia_entries', []);
  registry.set('completed_scenarios', []);
  registry.set('dialogue_history', {});
  registry.set('encounter_history', []);

  // Time & Season
  registry.set('time_of_day', 'morning');
  registry.set('season', 'spring');
  registry.set('day_in_season', 1);

  // Financial
  registry.set('pending_bills', []);
  registry.set('last_salary_day', 0);
  registry.set('pant_bottles', 0);

  // Settings
  registry.set('volume_master', 0.8);
  registry.set('volume_music', 0.6);
  registry.set('volume_sfx', 0.8);
  registry.set('controls_scheme', 'keyboard');
  registry.set('tutorial_completed', false);
  registry.set('difficulty', 'normal');

  // Meta
  registry.set('save_slot', 1);
  registry.set('total_playtime', 0);
  registry.set('game_version', '0.1.0');

  return registry;
}

/**
 * Creates a registry at an advanced progression state for testing.
 */
export function createAdvancedRegistry() {
  const registry = createNewGameRegistry();
  registry.set('player_xp', 1500);
  registry.set('player_level', 5);
  registry.set('current_day', 30);
  registry.set('current_phase', 'Adapter');
  registry.set('player_money', 2500);
  registry.set('skill_language', 40);
  registry.set('skill_cycling', 60);
  registry.set('skill_cultural', 35);
  registry.set('skill_bureaucracy', 25);
  registry.set('encyclopedia_entries', ['entry_1', 'entry_2', 'entry_3']);
  registry.set('inventory', [
    { id: 'bread', name: 'Rugbrød', quantity: 2, category: 'food' },
    { id: 'bike_light', name: 'Bike Light', quantity: 1, category: 'equipment' },
  ]);
  return registry;
}
