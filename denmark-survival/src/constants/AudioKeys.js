/**
 * src/constants/AudioKeys.js
 * String constants for all audio asset keys.
 * Using constants prevents typos and enables IDE autocompletion.
 * Organized by category: music tracks, UI SFX, gameplay SFX,
 * feedback SFX, encounter SFX, and environment ambient loops.
 */

// ── Music Tracks ──────────────────────────────────────────────────────────────
export const MUSIC_MENU           = 'music_menu';
export const MUSIC_ARRIVAL        = 'music_arrival';
export const MUSIC_MORNING_COMMUTE = 'music_morning_commute';
export const MUSIC_KOBENHAVN_NIGHTS = 'music_kobenhavn_nights';
export const MUSIC_INDOORS        = 'music_indoors';
export const MUSIC_FRIENDSHIP     = 'music_friendship';
export const MUSIC_ENCOUNTER      = 'music_encounter';

// ── UI Sound Effects ──────────────────────────────────────────────────────────
export const SFX_UI_CLICK         = 'sfx_ui_click';
export const SFX_UI_HOVER         = 'sfx_ui_hover';
export const SFX_UI_CONFIRM       = 'sfx_ui_confirm';
export const SFX_UI_CANCEL        = 'sfx_ui_cancel';
export const SFX_UI_NOTIFICATION  = 'sfx_ui_notification';

// ── Gameplay Sound Effects ────────────────────────────────────────────────────
export const SFX_FOOTSTEP_1       = 'sfx_footstep_1';
export const SFX_FOOTSTEP_2       = 'sfx_footstep_2';
export const SFX_FOOTSTEP_3       = 'sfx_footstep_3';
export const SFX_DOOR_OPEN        = 'sfx_door_open';
export const SFX_DOOR_CLOSE       = 'sfx_door_close';

// ── Feedback Sound Effects ────────────────────────────────────────────────────
export const SFX_XP_GAIN          = 'sfx_xp_gain';
export const SFX_XP_LOSS          = 'sfx_xp_loss';
export const SFX_MONEY_GAIN       = 'sfx_money_gain';
export const SFX_MONEY_SPEND      = 'sfx_money_spend';
export const SFX_LEVEL_UP         = 'sfx_level_up';

// ── Encounter Sound Effects ───────────────────────────────────────────────────
export const SFX_ENCOUNTER_PING   = 'sfx_encounter_ping';
export const SFX_ENCOUNTER_RESOLVE = 'sfx_encounter_resolve';

// ── Environment / Ambient Loops ───────────────────────────────────────────────
export const SFX_AMBIENT_RAIN     = 'sfx_ambient_rain';
export const SFX_AMBIENT_WIND     = 'sfx_ambient_wind';
export const SFX_AMBIENT_BIRDS    = 'sfx_ambient_birds';

/**
 * Keys that support pitch variation during playback.
 * AudioManager uses this set to apply random pitch offsets.
 */
export const PITCH_VARIATION_KEYS = new Set([
  SFX_FOOTSTEP_1,
  SFX_FOOTSTEP_2,
  SFX_FOOTSTEP_3,
]);

/** Default pitch variation range (±fraction of 1.0). */
export const PITCH_VARIATION_RANGE = 0.1;

// ── NPC Dialogue Blip Sounds ──────────────────────────────────────────────────
// Each NPC has a unique short blip played during typewriter text display.
export const SFX_BLIP_LARS    = 'sfx_blip_lars';
export const SFX_BLIP_METTE   = 'sfx_blip_mette';
export const SFX_BLIP_THOMAS  = 'sfx_blip_thomas';
export const SFX_BLIP_SOFIE   = 'sfx_blip_sofie';
export const SFX_BLIP_HENRIK  = 'sfx_blip_henrik';
export const SFX_BLIP_KASPER  = 'sfx_blip_kasper';
export const SFX_BLIP_DR_JENSEN = 'sfx_blip_dr_jensen';
export const SFX_BLIP_BJORN   = 'sfx_blip_bjorn';
export const SFX_BLIP_FREJA   = 'sfx_blip_freja';
export const SFX_BLIP_EMMA    = 'sfx_blip_emma';
export const SFX_BLIP_DEFAULT = 'sfx_blip_default';

/**
 * Maps NPC id strings to their blip sound key.
 * DialogueScene uses this to play the correct blip during typewriter effect.
 */
export const NPC_BLIP_MAP = {
  lars:      SFX_BLIP_LARS,
  mette:     SFX_BLIP_METTE,
  thomas:    SFX_BLIP_THOMAS,
  sofie:     SFX_BLIP_SOFIE,
  henrik:    SFX_BLIP_HENRIK,
  kasper:    SFX_BLIP_KASPER,
  dr_jensen: SFX_BLIP_DR_JENSEN,
  bjorn:     SFX_BLIP_BJORN,
  freja:     SFX_BLIP_FREJA,
  emma:      SFX_BLIP_EMMA,
};

/**
 * Scene → music track mapping.
 * Used by AudioManager.playMusicForScene() to select the correct track.
 */
export const SCENE_MUSIC_MAP = {
  MenuScene:   MUSIC_MENU,
  CharCreate:  MUSIC_ARRIVAL,
  GameScene:   MUSIC_MORNING_COMMUTE,
};

/** Convenience groupings. */
export const ALL_MUSIC_KEYS = [
  MUSIC_MENU,
  MUSIC_ARRIVAL,
  MUSIC_MORNING_COMMUTE,
  MUSIC_KOBENHAVN_NIGHTS,
  MUSIC_INDOORS,
  MUSIC_FRIENDSHIP,
  MUSIC_ENCOUNTER,
];

export const ALL_SFX_KEYS = [
  SFX_UI_CLICK, SFX_UI_HOVER, SFX_UI_CONFIRM, SFX_UI_CANCEL, SFX_UI_NOTIFICATION,
  SFX_FOOTSTEP_1, SFX_FOOTSTEP_2, SFX_FOOTSTEP_3, SFX_DOOR_OPEN, SFX_DOOR_CLOSE,
  SFX_XP_GAIN, SFX_XP_LOSS, SFX_MONEY_GAIN, SFX_MONEY_SPEND, SFX_LEVEL_UP,
  SFX_ENCOUNTER_PING, SFX_ENCOUNTER_RESOLVE,
  SFX_AMBIENT_RAIN, SFX_AMBIENT_WIND, SFX_AMBIENT_BIRDS,
];
