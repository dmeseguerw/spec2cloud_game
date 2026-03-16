/**
 * src/scenes/SettingsScene.js
 * Game settings overlay scene.
 */

import { BaseScene } from './BaseScene.js';

export class SettingsScene extends BaseScene {
  constructor() {
    super({ key: 'SettingsScene' });
  }

  init(data) {
    super.init(data);
  }

  create() {
    // Semi-transparent background for overlay
    if (this._isOverlay) {
      this.createOverlayBackground();
    }

    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'SettingsScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }

  shutdown() {
    super.shutdown();
  }
}
