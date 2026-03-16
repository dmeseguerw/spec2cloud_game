/**
 * src/scenes/DaySummaryScene.js
 * End-of-day review placeholder scene.
 */

export class DaySummaryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DaySummaryScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'DaySummaryScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }
}
