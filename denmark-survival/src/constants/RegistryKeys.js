/**
 * src/constants/RegistryKeys.js
 * String constants for all Phaser Registry keys.
 * Using constants prevents typos and enables IDE autocompletion.
 */

// Player Core
export const PLAYER_NAME = 'player_name';
export const PLAYER_NATIONALITY = 'player_nationality';
export const PLAYER_JOB = 'player_job';
export const PLAYER_AVATAR = 'player_avatar';

// Progression
export const PLAYER_XP = 'player_xp';
export const PLAYER_LEVEL = 'player_level';
export const CURRENT_DAY = 'current_day';
export const CURRENT_CHAPTER = 'current_chapter';
export const CURRENT_PHASE = 'current_phase';

// Skills (0-100)
export const SKILL_LANGUAGE = 'skill_language';
export const SKILL_CYCLING = 'skill_cycling';
export const SKILL_CULTURAL = 'skill_cultural';
export const SKILL_BUREAUCRACY = 'skill_bureaucracy';

// Resources
export const PLAYER_MONEY = 'player_money';
export const PLAYER_HEALTH = 'player_health';
export const PLAYER_HAPPINESS = 'player_happiness';
export const PLAYER_ENERGY = 'player_energy';

// Inventory
export const INVENTORY = 'inventory';

// World State
export const PLAYER_X = 'player_x';
export const PLAYER_Y = 'player_y';
export const PLAYER_SCENE = 'player_scene';
export const PLAYER_LOCATION = 'player_location';
export const NPC_RELATIONSHIPS = 'npc_relationships';
export const NPC_MEMORY = 'npc_memory';
export const ENCYCLOPEDIA_ENTRIES = 'encyclopedia_entries';
export const COMPLETED_SCENARIOS = 'completed_scenarios';
export const DIALOGUE_HISTORY = 'dialogue_history';
export const ENCOUNTER_HISTORY = 'encounter_history';
export const PENDING_ENCOUNTERS = 'pending_encounters';
export const ENCOUNTER_FLAGS = 'encounter_flags';

// Time & Season
export const TIME_OF_DAY = 'time_of_day';
export const SEASON = 'season';
export const DAY_IN_SEASON = 'day_in_season';
export const ACTIVITY_SLOTS_REMAINING = 'activity_slots_remaining';
export const MANDATORY_ACTIVITIES = 'mandatory_activities';

// Financial
export const PENDING_BILLS = 'pending_bills';
export const LAST_SALARY_DAY = 'last_salary_day';
export const PANT_BOTTLES = 'pant_bottles';
export const SHOP_SALES = 'shop_sales';
export const LAST_SALE_DAY = 'last_sale_day';
export const TAX_LAST_FILED_DAY = 'tax_last_filed_day';
export const SHOP_CART = 'shop_cart';

// Inventory daily flags (reset each day)
export const ATE_TODAY = 'ate_today';
export const VITAMIN_D_TAKEN = 'vitamin_d_taken';
export const SICK_RECOVERY_BOOST = 'sick_recovery_boost';
export const BIKE_REPAIRED = 'bike_repaired';

// Settings
export const VOLUME_MASTER = 'volume_master';
export const VOLUME_MUSIC = 'volume_music';
export const VOLUME_SFX = 'volume_sfx';
export const CONTROLS_SCHEME = 'controls_scheme';
export const TUTORIAL_COMPLETED = 'tutorial_completed';
export const DIFFICULTY = 'difficulty';
export const REDUCED_MOTION = 'reduced_motion';

// Meta
export const SAVE_SLOT = 'save_slot';
export const TOTAL_PLAYTIME = 'total_playtime';
export const GAME_VERSION = 'game_version';

// World Context
export const WEATHER = 'weather';
export const CURRENT_LOCATION = 'current_location';
export const CONTEXT_HINT = 'context_hint';

// Game Flags — free-form key/value pairs set by dialogue effects and scenarios
export const GAME_FLAGS = 'game_flags';

// Quest & Objectives
export const ACTIVE_TASKS    = 'active_tasks';
export const COMPLETED_TASKS = 'completed_tasks';
export const TRACKED_TASK_ID = 'tracked_task_id';
// World Collectibles & Building Entry (Task 025)
export const COLLECTED_ITEMS    = 'collected_items';    // serialised array of collected one-time collectible IDs
export const WORLD_COLLECTIBLES = 'world_collectibles'; // current day's active collectible manifest array

// Transportation
export const TRANSPORT_MODE    = 'transport_mode';
export const BIKE_MOUNTED      = 'bike_mounted';
export const BIKE_LIGHTS_ON    = 'bike_lights_on';
export const HAS_BIKE          = 'has_bike';
export const HAS_BIKE_LIGHTS   = 'has_bike_lights';
export const REJSEKORT_BALANCE = 'rejsekort_balance';
export const METRO_CHECKED_IN  = 'metro_checked_in';
export const METRO_MONTHLY_PASS = 'metro_monthly_pass';
export const VISITED_LOCATIONS = 'visited_locations';
