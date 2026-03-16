/**
 * src/scenes/GameScene.js
 * Main gameplay placeholder scene.
 */

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'GameScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }
}
