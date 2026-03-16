/**
 * src/constants/Events.js
 * Custom event name constants for game-wide event bus.
 */

export const LEVEL_UP = 'level_up';
export const XP_CHANGED = 'xp_changed';
export const MONEY_CHANGED = 'money_changed';
export const ITEM_ADDED = 'item_added';
export const ITEM_REMOVED = 'item_removed';
export const ITEM_USED = 'item_used';
export const ITEM_SPOILED = 'item_spoiled';
export const PANT_RETURNED = 'pant_returned';
export const RELATIONSHIP_CHANGED = 'relationship_changed';
export const RELATIONSHIP_STAGE_CHANGED = 'relationship_stage_changed';
export const ENCYCLOPEDIA_UNLOCKED = 'encyclopedia_unlocked';
export const BILL_RECEIVED = 'bill_received';
export const BILL_PAID = 'bill_paid';
export const SEASON_CHANGED = 'season_changed';
export const TIME_ADVANCED = 'time_advanced';
export const GAME_SAVED = 'game_saved';
export const GAME_LOADED = 'game_loaded';
export const SKILL_CHANGED = 'skill_changed';
export const HEALTH_CHANGED = 'health_changed';
export const ENERGY_CHANGED = 'energy_changed';
export const HAPPINESS_CHANGED = 'happiness_changed';

// Day Cycle
export const DAY_ADVANCED = 'day_advanced';
export const WEATHER_CHANGED = 'weather_changed';
export const ACTIVITY_COMPLETED = 'activity_completed';
export const MANDATORY_ACTIVITY_MISSED = 'mandatory_activity_missed';
export const DAY_ENDED = 'day_ended';

// Save / Persistence
export const AUTO_SAVED = 'auto_saved';
export const GAME_OVER = 'game_over';
export const GAME_OVER_WARNING = 'game_over_warning';

// Scene Navigation
export const SCENE_TRANSITION_START = 'scene_transition_start';
export const SCENE_TRANSITION_COMPLETE = 'scene_transition_complete';
export const OVERLAY_OPENED = 'overlay_opened';
export const OVERLAY_CLOSED = 'overlay_closed';

// Dialogue
export const DIALOGUE_STARTED = 'dialogue_started';
export const DIALOGUE_ENDED = 'dialogue_ended';
export const DIALOGUE_NODE_CHANGED = 'dialogue_node_changed';
export const DIALOGUE_RESPONSE_SELECTED = 'dialogue_response_selected';
// Transportation
export const TRANSPORT_MODE_CHANGED      = 'transport_mode_changed';
export const BIKE_MOUNTED                = 'bike_mounted';
export const BIKE_DISMOUNTED             = 'bike_dismounted';
export const BIKE_SIGNAL_CHECK           = 'bike_signal_check';
export const BIKE_LIGHTS_WARNING         = 'bike_lights_warning';
export const BIKE_ACCIDENT               = 'bike_accident';
export const METRO_CHECKED_IN            = 'metro_checked_in';
export const METRO_CHECKED_OUT           = 'metro_checked_out';
export const METRO_FARE_DEDUCTED         = 'metro_fare_deducted';
export const METRO_INSPECTOR_ENCOUNTER   = 'metro_inspector_encounter';
