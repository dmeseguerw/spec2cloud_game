/**
 * src/scenes/InventoryScene.js
 * Inventory and stats placeholder scene.
 */

export class InventoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'InventoryScene' });
  }

  create() {
    const { width, height } = this.scale;
    this.add.text(width / 2, height / 2, 'InventoryScene', {
      fontFamily: 'Arial',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);
  }
}
