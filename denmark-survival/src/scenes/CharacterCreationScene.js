/**
 * src/scenes/CharacterCreationScene.js
 * Character creation placeholder scene.
 */

import { BaseScene } from './BaseScene.js';

export class CharacterCreationScene extends BaseScene {
  constructor() {
    super({ key: 'CharacterCreationScene' });
  }

  init(data) {
    super.init(data);
  }

  create() {
    this.fadeInCamera();

    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'CharacterCreationScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }

  shutdown() {
    super.shutdown();
  }
}
