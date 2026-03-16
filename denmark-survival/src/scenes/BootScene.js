/**
 * src/scenes/BootScene.js
 * First scene to run. Displays a loading screen with title, progress bar,
 * and percentage text while placeholder assets are loaded.
 * Transitions to MenuScene when loading is complete.
 */

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

    // ---------- Placeholder assets ----------
    // Generate simple coloured rectangles as stand-in textures so the loader
    // has something to do and the progress bar animates.
    this._createPlaceholderTextures();
  }

  create() {
    this.scene.start('MenuScene');
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  _createPlaceholderTextures() {
    const placeholders = [
      { key: 'player',    color: 0x4a90d9, w: 32, h: 48 },
      { key: 'npc',       color: 0x7ed321, w: 32, h: 48 },
      { key: 'tile',      color: 0x6b5a3e, w: 32, h: 32 },
      { key: 'item',      color: 0xf5a623, w: 16, h: 16 },
    ];

    for (const { key, color, w, h } of placeholders) {
      if (!this.textures.exists(key)) {
        const g = this.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(color, 1);
        g.fillRect(0, 0, w, h);
        g.generateTexture(key, w, h);
        g.destroy();
      }
    }
  }
}
