/**
 * src/scenes/MenuScene.js
 * Main menu placeholder scene.
 */

import { BaseScene } from './BaseScene.js';

export class MenuScene extends BaseScene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  init(data) {
    super.init(data);
  }

  create() {
    this.fadeInCamera();

    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'MenuScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }

  shutdown() {
    super.shutdown();
  }
}
