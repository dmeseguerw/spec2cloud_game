/**
 * src/scenes/UIScene.js
 * HUD overlay scene — runs in parallel with GameScene.
 *
 * Displays:
 *  - Location name (top-left) updated via 'zoneupdated' event.
 *  - Context hint text (bottom-centre) updated via 'interactionhint' event.
 */

import { BaseScene } from './BaseScene.js';
import { PLAYER_LOCATION } from '../constants/RegistryKeys.js';

export class UIScene extends BaseScene {
  constructor() {
    super({ key: 'UIScene' });

    /** @type {Phaser.GameObjects.Text|null} */
    this._locationLabel = null;

    /** @type {Phaser.GameObjects.Text|null} */
    this._contextHint = null;
  }

  init(data) {
    super.init(data);
  }

  create() {
    const { width, height } = this.scale;

    // ── Location name — top-left ───────────────────────────────────────────
    this._locationLabel = this.add.text(16, 16, '', {
      fontFamily: 'Arial',
      fontSize:   '18px',
      color:      '#e8d5b7',
      stroke:     '#000000',
      strokeThickness: 3,
    }).setScrollFactor(0).setDepth(10);

    // Seed with any already-known location.
    const savedLocation = this.registry.get(PLAYER_LOCATION);
    if (savedLocation) {
      this._locationLabel.setText(savedLocation);
    }

    // ── Context hint — bottom-centre ──────────────────────────────────────
    this._contextHint = this.add.text(width / 2, height - 48, '', {
      fontFamily: 'Arial',
      fontSize:   '16px',
      color:      '#ffffff',
      stroke:     '#000000',
      strokeThickness: 3,
      align:      'center',
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(10).setVisible(false);

    // ── Listen to GameScene events ────────────────────────────────────────
    const gameScene = this.scene.get('GameScene');
    if (gameScene?.events) {
      this.trackEvent(gameScene.events, 'zoneupdated',       this._onZoneUpdated.bind(this));
      this.trackEvent(gameScene.events, 'interactionhint',   this._onInteractionHint.bind(this));
    }

    // Also react to registry changes (e.g. initial load from save).
    this.trackEvent(
      this.registry.events,
      `changedata-${PLAYER_LOCATION}`,
      (_manager, _key, value) => this._onZoneUpdated(value)
    );
  }

  update(time, delta) {}

  shutdown() {
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  /**
   * @param {string} zoneName
   */
  _onZoneUpdated(zoneName) {
    if (this._locationLabel) {
      this._locationLabel.setText(zoneName || '');
    }
  }

  /**
   * @param {string|null} hint
   */
  _onInteractionHint(hint) {
    if (!this._contextHint) return;
    if (hint) {
      this._contextHint.setText(hint).setVisible(true);
    } else {
      this._contextHint.setVisible(false);
    }
  }
}
