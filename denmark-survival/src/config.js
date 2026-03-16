/**
 * src/config.js
 * Game-wide constants for Denmark Survival.
 * Imported by main.js and any scene that needs configuration values.
 *
 * NOTE: This file must not reference the Phaser global — it is a plain
 * constants module. The Phaser game configuration object is assembled in
 * main.js once Phaser has been loaded via CDN.
 */

/** Canvas / renderer dimensions (1280×720 = 16:9 HD) */
export const WIDTH  = 1280;
export const HEIGHT = 720;

/** Target frames per second */
export const TARGET_FPS = 60;

/** In-game time: minutes per real-world second */
export const GAME_TIME_SCALE = 1;

/** Day length in in-game minutes (07:00 → 23:00 = 960 min) */
export const DAY_LENGTH_MINUTES = 960;

/** Starting in-game time (minutes since midnight, e.g. 420 = 07:00) */
export const DAY_START_MINUTES = 420;

/** Player starting health points */
export const STARTING_HEALTH = 100;

/** Player starting currency (DKK) */
export const STARTING_CURRENCY = 500;

/** XP required to reach each level (index = level, value = cumulative XP) */
export const XP_THRESHOLDS = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700];

/** Maximum player level */
export const MAX_LEVEL = XP_THRESHOLDS.length - 1;

/** Background colour used by the Phaser renderer */
export const BACKGROUND_COLOR = '#1a1814';

/** DOM id of the element that Phaser mounts its canvas into */
export const GAME_CONTAINER_ID = 'game-container';

/** Pixel-art rendering settings — disable anti-aliasing for crisp sprites */
export const PIXEL_ART    = true;
export const ANTIALIAS    = false;
export const ROUND_PIXELS = true;
