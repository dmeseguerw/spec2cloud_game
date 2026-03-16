/**
 * src/scenes/DaySummaryScene.js
 * End-of-day review scene.
 */

import { BaseScene } from './BaseScene.js';

export class DaySummaryScene extends BaseScene {
  constructor() {
    super({ key: 'DaySummaryScene' });
  }

  init(data) {
    super.init(data);
  }

  create() {
    this.fadeInCamera();

    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'DaySummaryScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }

  shutdown() {
    super.shutdown();
  }
}
