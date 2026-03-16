/**
 * src/scenes/GameScene.js
 * Main gameplay placeholder scene.
 */

import { BaseScene } from './BaseScene.js';

export class GameScene extends BaseScene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {
    super.init(data);
  }

  create() {
    this.fadeInCamera();

    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'GameScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);

    // Launch UIScene in parallel
    this.scene.launch('UIScene');
  }

  update(time, delta) {
    // Game loop — override in future tasks
  }

  shutdown() {
    super.shutdown();
  }
}
