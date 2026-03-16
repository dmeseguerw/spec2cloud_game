/**
 * src/scenes/CharacterCreationScene.js
 * Character creation placeholder scene.
 */

export class CharacterCreationScene extends Phaser.Scene {
  constructor() {
    super({ key: 'CharacterCreationScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'CharacterCreationScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }
}
