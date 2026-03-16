/**
 * src/constants/AssetKeys.js
 * String constants for all game asset keys.
 * Using constants prevents typos and enables IDE autocompletion.
 * Organized by asset type: sprites, tilesets, tilemaps, UI, audio, fonts.
 */

// ── Sprites ────────────────────────────────────────────────────────────────
export const SPRITE_PLAYER = 'sprite_player';
export const SPRITE_NPC_ANNA = 'sprite_npc_anna';
export const SPRITE_NPC_LARS = 'sprite_npc_lars';
export const SPRITE_NPC_METTE = 'sprite_npc_mette';
export const SPRITE_INDICATOR_EXCLAMATION = 'sprite_indicator_exclamation';
export const SPRITE_INDICATOR_QUESTION = 'sprite_indicator_question';

// ── Tilesets ───────────────────────────────────────────────────────────────
export const TILESET_CITY = 'tileset_city';
export const TILESET_INTERIOR = 'tileset_interior';
export const TILESET_NATURE = 'tileset_nature';

// ── Tilemaps ───────────────────────────────────────────────────────────────
export const TILEMAP_TEST = 'tilemap_test';

// ── UI Assets ──────────────────────────────────────────────────────────────
export const UI_PANEL = 'ui_panel';
export const UI_BUTTON = 'ui_button';
export const UI_BUTTON_HOVER = 'ui_button_hover';
export const UI_BUTTON_PRESSED = 'ui_button_pressed';
export const UI_ICON_HEALTH = 'ui_icon_health';
export const UI_ICON_XP = 'ui_icon_xp';
export const UI_ICON_MONEY = 'ui_icon_money';
export const UI_ICON_TIME = 'ui_icon_time';
export const UI_ICON_WEATHER_SUN = 'ui_icon_weather_sun';
export const UI_ICON_WEATHER_RAIN = 'ui_icon_weather_rain';
export const UI_ICON_WEATHER_SNOW = 'ui_icon_weather_snow';
export const UI_ICON_WEATHER_CLOUD = 'ui_icon_weather_cloud';
export const UI_DIALOG_FRAME = 'ui_dialog_frame';
export const UI_INVENTORY_SLOT = 'ui_inventory_slot';
export const UI_PROGRESS_BG = 'ui_progress_bg';
export const UI_PROGRESS_FILL = 'ui_progress_fill';
export const UI_NOTIFICATION_BG = 'ui_notification_bg';

// ── Audio — Music ──────────────────────────────────────────────────────────
export const MUSIC_MENU = 'music_menu';
export const MUSIC_GAME = 'music_game';

// ── Audio — SFX ────────────────────────────────────────────────────────────
export const SFX_CLICK = 'sfx_click';
export const SFX_HOVER = 'sfx_hover';
export const SFX_CONFIRM = 'sfx_confirm';
export const SFX_CANCEL = 'sfx_cancel';
export const SFX_NOTIFICATION = 'sfx_notification';
export const SFX_XP_GAIN = 'sfx_xp_gain';
export const SFX_XP_LOSS = 'sfx_xp_loss';
export const SFX_COIN = 'sfx_coin';
export const SFX_FOOTSTEP_1 = 'sfx_footstep_1';
export const SFX_FOOTSTEP_2 = 'sfx_footstep_2';
export const SFX_FOOTSTEP_3 = 'sfx_footstep_3';

// ── Fonts ──────────────────────────────────────────────────────────────────
export const FONT_UI = 'Inter';
export const FONT_PIXEL = 'Press Start 2P';

/**
 * Convenience groupings for batch operations.
 */
export const ALL_SPRITES = [
  SPRITE_PLAYER, SPRITE_NPC_ANNA, SPRITE_NPC_LARS, SPRITE_NPC_METTE,
  SPRITE_INDICATOR_EXCLAMATION, SPRITE_INDICATOR_QUESTION,
];

export const ALL_TILESETS = [TILESET_CITY, TILESET_INTERIOR, TILESET_NATURE];

export const ALL_UI = [
  UI_PANEL, UI_BUTTON, UI_BUTTON_HOVER, UI_BUTTON_PRESSED,
  UI_ICON_HEALTH, UI_ICON_XP, UI_ICON_MONEY, UI_ICON_TIME,
  UI_ICON_WEATHER_SUN, UI_ICON_WEATHER_RAIN, UI_ICON_WEATHER_SNOW, UI_ICON_WEATHER_CLOUD,
  UI_DIALOG_FRAME, UI_INVENTORY_SLOT, UI_PROGRESS_BG, UI_PROGRESS_FILL,
  UI_NOTIFICATION_BG,
];

export const ALL_MUSIC = [MUSIC_MENU, MUSIC_GAME];

export const ALL_SFX = [
  SFX_CLICK, SFX_HOVER, SFX_CONFIRM, SFX_CANCEL, SFX_NOTIFICATION,
  SFX_XP_GAIN, SFX_XP_LOSS, SFX_COIN,
  SFX_FOOTSTEP_1, SFX_FOOTSTEP_2, SFX_FOOTSTEP_3,
];
