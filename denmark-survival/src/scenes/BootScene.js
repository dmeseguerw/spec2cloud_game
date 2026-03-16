/**
 * src/scenes/BootScene.js
 * First scene to run. Displays a loading screen with title, progress bar,
 * and percentage text while placeholder assets are loaded.
 * Transitions to MenuScene when loading is complete.
 */

import * as AK from '../constants/AssetKeys.js';
import { fadeToScene, DEFAULT_FADE_DURATION } from './SceneTransition.js';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.scale;
    const cx = width  / 2;
    const cy = height / 2;

    // ---------- Title text ----------
    this.add.text(cx, cy - 80, 'Denmark Survival', {
      fontFamily: 'Arial',
      fontSize:   '42px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);

    // ---------- Loading label ----------
    const loadingText = this.add.text(cx, cy - 20, 'Loading…', {
      fontFamily: 'Arial',
      fontSize:   '18px',
      color:      '#a09070',
    }).setOrigin(0.5);

    // ---------- Progress bar background ----------
    const barW = 400;
    const barH = 24;
    const barX = cx - barW / 2;
    const barY = cy + 10;

    this.add.rectangle(cx, barY + barH / 2, barW + 4, barH + 4, 0x3a3530)
      .setOrigin(0.5);

    const progressBar = this.add.rectangle(barX, barY, 0, barH, 0xe8d5b7)
      .setOrigin(0, 0);

    // ---------- Percentage text ----------
    const percentText = this.add.text(cx, barY + barH + 14, '0%', {
      fontFamily: 'Arial',
      fontSize:   '14px',
      color:      '#a09070',
    }).setOrigin(0.5);

    // ---------- Loader callbacks ----------
    this.load.on('progress', (value) => {
      progressBar.width = barW * value;
      percentText.setText(`${Math.floor(value * 100)}%`);
    });

    this.load.on('fileprogress', () => {
      loadingText.setText('Loading…');
    });

    this.load.on('complete', () => {
      percentText.setText('100%');
      progressBar.width = barW;
    });

    // ---------- Create placeholder textures ----------
    this._createPlaceholderTextures();
  }

  create() {
    fadeToScene(this, 'MenuScene');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Generate coloured rectangle textures for all asset keys.
   * These serve as stand-ins until real art assets are sourced.
   */
  _createPlaceholderTextures() {
    // Sprite placeholders (character-sized)
    const spritePlaceholders = [
      { key: AK.SPRITE_PLAYER,                  color: 0x4a90d9, w: 32, h: 48 },
      { key: AK.SPRITE_NPC_ANNA,                color: 0x7ed321, w: 32, h: 48 },
      { key: AK.SPRITE_NPC_LARS,                color: 0xd0021b, w: 32, h: 48 },
      { key: AK.SPRITE_NPC_METTE,               color: 0xbd10e0, w: 32, h: 48 },
      { key: AK.SPRITE_INDICATOR_EXCLAMATION,    color: 0xf8e71c, w: 16, h: 16 },
      { key: AK.SPRITE_INDICATOR_QUESTION,       color: 0x50e3c2, w: 16, h: 16 },
    ];

    // Tileset placeholders (tile-sized)
    const tilesetPlaceholders = [
      { key: AK.TILESET_CITY,     color: 0x6b5a3e, w: 32, h: 32 },
      { key: AK.TILESET_INTERIOR, color: 0x8b7355, w: 32, h: 32 },
      { key: AK.TILESET_NATURE,   color: 0x4a7c3f, w: 32, h: 32 },
    ];

    // UI placeholders
    const uiPlaceholders = [
      { key: AK.UI_PANEL,              color: 0x2a2520, w: 200, h: 100 },
      { key: AK.UI_BUTTON,             color: 0x4a4035, w: 120, h: 40  },
      { key: AK.UI_BUTTON_HOVER,       color: 0x5a5045, w: 120, h: 40  },
      { key: AK.UI_BUTTON_PRESSED,     color: 0x3a3025, w: 120, h: 40  },
      { key: AK.UI_ICON_HEALTH,        color: 0xe74c3c, w: 16,  h: 16  },
      { key: AK.UI_ICON_XP,            color: 0xf39c12, w: 16,  h: 16  },
      { key: AK.UI_ICON_MONEY,         color: 0x27ae60, w: 16,  h: 16  },
      { key: AK.UI_ICON_TIME,          color: 0x3498db, w: 16,  h: 16  },
      { key: AK.UI_ICON_WEATHER_SUN,   color: 0xf1c40f, w: 16,  h: 16  },
      { key: AK.UI_ICON_WEATHER_RAIN,  color: 0x2980b9, w: 16,  h: 16  },
      { key: AK.UI_ICON_WEATHER_SNOW,  color: 0xecf0f1, w: 16,  h: 16  },
      { key: AK.UI_ICON_WEATHER_CLOUD, color: 0x95a5a6, w: 16,  h: 16  },
      { key: AK.UI_DIALOG_FRAME,       color: 0x1a1510, w: 300, h: 120 },
      { key: AK.UI_INVENTORY_SLOT,     color: 0x3a3530, w: 40,  h: 40  },
      { key: AK.UI_PROGRESS_BG,        color: 0x2a2520, w: 200, h: 12  },
      { key: AK.UI_PROGRESS_FILL,      color: 0xe8d5b7, w: 200, h: 12  },
      { key: AK.UI_NOTIFICATION_BG,    color: 0x1a1510, w: 250, h: 50  },
    ];

    // Legacy placeholders (backward compat with existing code)
    const legacyPlaceholders = [
      { key: 'player', color: 0x4a90d9, w: 32, h: 48 },
      { key: 'npc',    color: 0x7ed321, w: 32, h: 48 },
      { key: 'tile',   color: 0x6b5a3e, w: 32, h: 32 },
      { key: 'item',   color: 0xf5a623, w: 16, h: 16 },
    ];

    const all = [
      ...spritePlaceholders,
      ...tilesetPlaceholders,
      ...uiPlaceholders,
      ...legacyPlaceholders,
    ];

    for (const { key, color, w, h } of all) {
      try {
        if (!this.textures.exists(key)) {
          const g = this.make.graphics({ x: 0, y: 0, add: false });
          g.fillStyle(color, 1);
          g.fillRect(0, 0, w, h);
          g.generateTexture(key, w, h);
          g.destroy();
        }
      } catch (err) {
        console.warn(`[BootScene] Failed to create placeholder texture "${key}":`, err);
      }
    }
  }
}
