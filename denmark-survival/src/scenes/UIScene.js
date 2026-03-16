/**
 * src/scenes/UIScene.js
 * HUD overlay placeholder scene — runs in parallel with GameScene.
 */

import { BaseScene } from './BaseScene.js';

export class UIScene extends BaseScene {
  constructor() {
    super({ key: 'UIScene' });
  }

  init(data) {
    super.init(data);
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'UIScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }

  update(time, delta) {
    // UI update loop — override in future tasks
  }

  shutdown() {
    super.shutdown();
  }
}
