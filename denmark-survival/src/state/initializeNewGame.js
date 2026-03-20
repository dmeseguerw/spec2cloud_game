/**
 * src/state/initializeNewGame.js
 * Sets all registry values for a fresh new-game start (after character creation).
 *
 * Called once when the player confirms their character and begins Day 1.
 * Values here are the canonical "Day 1 onboarding" starting state as
 * described in the Task 028 spec.
 *
 * Does NOT overwrite keys already set by character creation (name, nationality,
 * job, avatar) — those are preserved.
 */

import * as RK from '../constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 starting constants — exported for tests and documentation
// ─────────────────────────────────────────────────────────────────────────────

export const DAY1_STARTING_DAY     = 1;
export const DAY1_STARTING_MONEY   = 1200;   // DKK — standardised for tutorial
export const DAY1_STARTING_HEALTH  = 75;     // slightly below full — eating improves it
export const DAY1_STARTING_XP      = 0;
export const DAY1_STARTING_LEVEL   = 1;
export const DAY1_STARTING_ENERGY  = 80;
export const DAY1_STARTING_SEASON  = 'Autumn';
export const DAY1_STARTING_TIME    = 'Morning';
export const DAY1_LARS_RELATIONSHIP = 30;

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Initialise all registry keys to their Day 1 / new-game starting values.
 *
 * Character-creation fields (PLAYER_NAME, PLAYER_NATIONALITY, PLAYER_JOB,
 * PLAYER_AVATAR) are NOT overwritten here — they should be set before calling
 * this function.
 *
 * @param {Phaser.Data.DataManager} registry
 */
export function initializeNewGame(registry) {
  // ── Progression ────────────────────────────────────────────────────────────
  registry.set(RK.CURRENT_DAY,   DAY1_STARTING_DAY);
  registry.set(RK.PLAYER_XP,     DAY1_STARTING_XP);
  registry.set(RK.PLAYER_LEVEL,  DAY1_STARTING_LEVEL);

  // ── Resources ──────────────────────────────────────────────────────────────
  registry.set(RK.PLAYER_MONEY,  DAY1_STARTING_MONEY);
  registry.set(RK.PLAYER_HEALTH, DAY1_STARTING_HEALTH);
  registry.set(RK.PLAYER_ENERGY, DAY1_STARTING_ENERGY);

  // ── Inventory ──────────────────────────────────────────────────────────────
  registry.set(RK.INVENTORY, []);

  // ── Skills — all start at 0 ────────────────────────────────────────────────
  registry.set(RK.SKILL_LANGUAGE,    0);
  registry.set(RK.SKILL_CYCLING,     0);
  registry.set(RK.SKILL_CULTURAL,    0);
  registry.set(RK.SKILL_BUREAUCRACY, 0);

  // ── NPC Relationships ──────────────────────────────────────────────────────
  registry.set(RK.NPC_RELATIONSHIPS, {
    lars:   DAY1_LARS_RELATIONSHIP,
    anna:   0,
    mette:  0,
    thomas: 0,
  });

  // ── Time & Season ──────────────────────────────────────────────────────────
  registry.set(RK.TIME_OF_DAY,    DAY1_STARTING_TIME);
  registry.set(RK.SEASON,         DAY1_STARTING_SEASON);
  registry.set(RK.DAY_IN_SEASON,  1);

  // ── Tutorial / Onboarding ──────────────────────────────────────────────────
  registry.set(RK.TUTORIAL_COMPLETED, false);

  // ── Quest / Task system (Tasks 025/026) ───────────────────────────────────
  registry.set(RK.ACTIVE_TASKS,    []);
  registry.set(RK.COMPLETED_TASKS, []);
  registry.set(RK.TRACKED_TASK_ID, null);
  registry.set(RK.GAME_FLAGS,      {});

  // ── Collectibles (Task 025) ────────────────────────────────────────────────
  registry.set(RK.COLLECTED_ITEMS,    []);
  // Note: WORLD_COLLECTIBLES is set by GameScene._spawnDay1World() before
  // collectibles are spawned, so it is not initialised here.

  // ── Active tasks / scenarios ───────────────────────────────────────────────
  registry.set(RK.COMPLETED_SCENARIOS, []);

  // ── Financial clean state ──────────────────────────────────────────────────
  registry.set(RK.PENDING_BILLS,     []);
  registry.set(RK.PANT_BOTTLES,      0);
  registry.set(RK.SHOP_CART,         {});
  registry.set(RK.SHOP_SALES,        {});

  // ── Daily flags ────────────────────────────────────────────────────────────
  registry.set(RK.ATE_TODAY,          false);
  registry.set(RK.VITAMIN_D_TAKEN,    false);
  registry.set(RK.SICK_RECOVERY_BOOST, false);
  registry.set(RK.BIKE_REPAIRED,      false);

  // ── Encounter & Dialogue history ───────────────────────────────────────────
  registry.set(RK.ENCOUNTER_HISTORY,  []);
  registry.set(RK.PENDING_ENCOUNTERS, []);
  registry.set(RK.ENCOUNTER_FLAGS,    {});
  registry.set(RK.DIALOGUE_HISTORY,   {});
  registry.set(RK.NPC_MEMORY,         {});

  // ── Activity tracking ──────────────────────────────────────────────────────
  registry.set(RK.ACTIVITY_SLOTS_REMAINING, 4);
  registry.set(RK.MANDATORY_ACTIVITIES,     []);

  // ── Transportation ─────────────────────────────────────────────────────────
  registry.set(RK.TRANSPORT_MODE,    'walking');
  registry.set(RK.BIKE_MOUNTED,      false);
  registry.set(RK.HAS_BIKE,         false);
  registry.set(RK.HAS_BIKE_LIGHTS,  false);
  registry.set(RK.METRO_CHECKED_IN, false);
  registry.set(RK.METRO_MONTHLY_PASS, false);
  registry.set(RK.REJSEKORT_BALANCE,  0);

  // ── Visited Locations ──────────────────────────────────────────────────────
  registry.set(RK.VISITED_LOCATIONS, []);

  // ── Encyclopedia ───────────────────────────────────────────────────────────
  registry.set(RK.ENCYCLOPEDIA_ENTRIES, []);
}
