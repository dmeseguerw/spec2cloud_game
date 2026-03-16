/**
 * src/main.js
 * Phaser game bootstrap for Denmark Survival.
 *
 * Phase 1 (ADR 0007): Plain HTML + ES6 modules + Phaser via CDN.
 * Phaser is available on the global `window.Phaser` object — it is loaded via
 * a <script> tag in index.html before this module is evaluated.
 *
 * To add a scene:
 *   1. Create the scene file in src/scenes/
 *   2. Import it here
 *   3. Add it to the `scenes` array below
 */

import {
  WIDTH,
  HEIGHT,
  BACKGROUND_COLOR,
  GAME_CONTAINER_ID,
  PIXEL_ART,
  ANTIALIAS,
  ROUND_PIXELS,
} from './config.js';

// ---------------------------------------------------------------------------
// Scene imports — add new scenes here as they are created
// ---------------------------------------------------------------------------
import { BootScene }              from './scenes/BootScene.js';
import { MenuScene }              from './scenes/MenuScene.js';
import { CharacterCreationScene } from './scenes/CharacterCreationScene.js';
import { GameScene }              from './scenes/GameScene.js';
import { UIScene }                from './scenes/UIScene.js';
import { DialogueScene }          from './scenes/DialogueScene.js';
import { InventoryScene }         from './scenes/InventoryScene.js';
import { DaySummaryScene }        from './scenes/DaySummaryScene.js';
import { SettingsScene }          from './scenes/SettingsScene.js';

// ---------------------------------------------------------------------------
// Phaser game configuration
// ---------------------------------------------------------------------------

/**
 * Phaser game configuration object.
 * Assembled here so that Phaser (loaded via CDN) is guaranteed to exist.
 * @type {Phaser.Types.Core.GameConfig}
 */
const phaserConfig = {
  type: Phaser.AUTO,          // Use WebGL when available, fall back to Canvas
  width:  WIDTH,
  height: HEIGHT,
  parent: GAME_CONTAINER_ID,  // Mount inside the #game-container div

  backgroundColor: BACKGROUND_COLOR,

  // Pixel-art rendering — disable anti-aliasing for crisp sprites
  render: {
    pixelArt:    PIXEL_ART,
    antialias:   ANTIALIAS,
    roundPixels: ROUND_PIXELS,
  },

  // Responsive scaling — fit inside the viewport while keeping aspect ratio
  scale: {
    mode:       Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width:      WIDTH,
    height:     HEIGHT,
  },

  // Arcade physics (lightweight, suitable for tile-based movement)
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // Top-down — no gravity
      debug:   false,
    },
  },

  // Register scenes in boot order.
  // BootScene goes first; it preloads assets before handing off to MenuScene.
  scene: [
    BootScene,
    MenuScene,
    CharacterCreationScene,
    GameScene,
    UIScene,
    DialogueScene,
    InventoryScene,
    DaySummaryScene,
    SettingsScene,
  ],
};

// ---------------------------------------------------------------------------
// Create and export the game instance
// ---------------------------------------------------------------------------
const game = new Phaser.Game(phaserConfig);

export default game;
