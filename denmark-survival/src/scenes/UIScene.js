/**
 * src/scenes/UIScene.js
 * HUD overlay placeholder scene.
 */

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'UIScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }
}
