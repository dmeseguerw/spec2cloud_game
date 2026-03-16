/**
 * src/scenes/MenuScene.js
 * Main menu scene — title, tagline, navigation buttons, save slots, credits.
 */

import { BaseScene } from './BaseScene.js';
import { GameButton } from '../ui/GameButton.js';
import { AudioManager } from '../systems/AudioManager.js';
import { hasSave, loadGame, getSaveMetadata } from '../state/StateManager.js';
import * as RK from '../constants/RegistryKeys.js';
import { MUSIC_MENU } from '../constants/AudioKeys.js';

export class MenuScene extends BaseScene {
  constructor() {
    super({ key: 'MenuScene' });

    /** AudioManager instance (created in create()). */
    this._audio = null;

    /** Map of button key → GameButton instance. */
    this._buttons = {};

    /** Save-slot selector panel (or null when hidden). */
    this._saveSlotPanel = null;

    /** Credits panel (or null when hidden). */
    this._creditsPanel = null;

    /** Storage backend — injected via init(data.storage) for testing. */
    this._storage = null;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(data) {
    super.init(data);
    this._storage = data.storage || (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
  }

  create() {
    this.fadeInCamera();

    const { width, height } = this.scale;

    // Atmospheric Nordic background
    this._createBackground(width, height);

    // Title + tagline
    this._createTitleSection(width, height);

    // Vertical button list
    this._createMenuButtons(width, height);

    // Start menu music
    this._initAudio();

    // Enable or gray-out Continue depending on save availability
    this._updateContinueState();
  }

  shutdown() {
    // Destroy all GameButton instances
    Object.values(this._buttons).forEach(btn => btn.destroy());
    this._buttons = {};
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Private — UI creation
  // ---------------------------------------------------------------------------

  _createBackground(width, height) {
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a2a3a);
  }

  _createTitleSection(width, height) {
    this._titleText = this.add.text(width / 2, height * 0.18, 'Denmark Survival', {
      fontFamily: 'Georgia, serif',
      fontSize:   '64px',
      color:      '#e8d5b7',
    }).setOrigin(0.5);

    this._taglineText = this.add.text(
      width / 2,
      height * 0.3,
      'Master the art of Danish living, one bike ride at a time.',
      {
        fontFamily: 'Arial',
        fontSize:   '20px',
        color:      '#a0c0e0',
      }
    ).setOrigin(0.5);
  }

  _createMenuButtons(width, height) {
    const buttonX = width / 2;
    const buttonW = 280;
    const buttonH = 50;
    const startY  = height * 0.46;
    const gap     = 65;

    const entries = [
      { key: 'newGame',   label: 'New Game',   cb: () => this._onNewGame()  },
      { key: 'continue',  label: 'Continue',   cb: () => this._onContinue() },
      { key: 'loadGame',  label: 'Load Game',  cb: () => this._onLoadGame() },
      { key: 'settings',  label: 'Settings',   cb: () => this._onSettings() },
      { key: 'credits',   label: 'Credits',    cb: () => this._onCredits()  },
    ];

    entries.forEach((entry, i) => {
      this._buttons[entry.key] = new GameButton(
        this,
        buttonX,
        startY + i * gap,
        entry.label,
        entry.cb,
        { width: buttonW, height: buttonH }
      );
    });
  }

  _initAudio() {
    try {
      this._audio = new AudioManager(this);
      this._audio.playMusic(MUSIC_MENU);
    } catch (_) {
      // Graceful no-op — audio unavailable in test / headless environments
    }
  }

  // ---------------------------------------------------------------------------
  // Private — save helpers
  // ---------------------------------------------------------------------------

  /**
   * Returns true if any of the three save slots contains data.
   * @returns {boolean}
   */
  _hasAnySave() {
    for (let slot = 1; slot <= 3; slot++) {
      if (hasSave(slot, this._storage)) return true;
    }
    return false;
  }

  /**
   * Returns the slot number (1–3) of the most-recently saved game, or null.
   * @returns {number|null}
   */
  _getMostRecentSaveSlot() {
    let latestSlot = null;
    let latestTime = 0;
    for (let slot = 1; slot <= 3; slot++) {
      const meta = getSaveMetadata(slot, this._storage);
      if (meta && meta.savedAt > latestTime) {
        latestTime = meta.savedAt;
        latestSlot = slot;
      }
    }
    return latestSlot;
  }

  /**
   * Returns an array of save metadata (or null) for slots 1-3.
   * @returns {Array<object|null>}
   */
  _getSaveSlotMetadata() {
    return [1, 2, 3].map(slot => getSaveMetadata(slot, this._storage));
  }

  _updateContinueState() {
    const hasAnySave = this._hasAnySave();
    if (this._buttons.continue) {
      this._buttons.continue.setEnabled(hasAnySave);
    }
  }

  // ---------------------------------------------------------------------------
  // Private — button handlers
  // ---------------------------------------------------------------------------

  _onNewGame() {
    if (this._audio) this._audio.stopMusic();
    this.transitionTo('CharacterCreationScene');
  }

  _onContinue() {
    const slot = this._getMostRecentSaveSlot();
    if (slot === null) return;
    loadGame(this.registry, slot, this._storage);
    if (this._audio) this._audio.stopMusic();
    this.transitionTo('GameScene');
  }

  _onLoadGame() {
    this._showSaveSlotSelector();
  }

  _onSettings() {
    this.openOverlay('SettingsScene');
  }

  _onCredits() {
    this._showCredits();
  }

  // ---------------------------------------------------------------------------
  // Private — save-slot selector
  // ---------------------------------------------------------------------------

  _showSaveSlotSelector() {
    if (this._saveSlotPanel) {
      this._saveSlotPanel.setVisible(true);
      return;
    }

    const { width, height } = this.scale;
    const panelX = width / 2;
    const panelY = height / 2;

    const bg = this.add.rectangle(panelX, panelY, 520, 360, 0x0d1a26, 0.95);
    bg.setDepth(10);

    const titleLabel = this.add.text(panelX, panelY - 145, 'Load Game', {
      fontFamily: 'Georgia, serif',
      fontSize:   '28px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(11);

    const slotButtons = [];
    const slotMeta    = this._getSaveSlotMetadata();

    for (let i = 0; i < 3; i++) {
      const slot  = i + 1;
      const meta  = slotMeta[i];
      const yOff  = panelY - 70 + i * 90;
      const label = meta
        ? `Slot ${slot}: ${meta.name} — Lv.${meta.level}  Day ${meta.day}`
        : `Slot ${slot}: Empty Slot`;

      const btn = new GameButton(
        this, panelX, yOff, label,
        () => { if (meta) this._confirmLoad(slot); },
        { width: 420, height: 60, depth: 11 }
      );
      if (!meta) btn.setEnabled(false);
      slotButtons.push(btn);
    }

    const closeBtn = new GameButton(
      this, panelX, panelY + 145, 'Close',
      () => this._hideSaveSlotSelector(),
      { width: 120, height: 44, depth: 11 }
    );

    this._saveSlotPanel = {
      bg, titleLabel, slotButtons, closeBtn,
      setVisible(v) {
        bg.setVisible(v);
        titleLabel.setVisible(v);
        slotButtons.forEach(s => s.setVisible(v));
        closeBtn.setVisible(v);
      },
    };
  }

  _hideSaveSlotSelector() {
    if (this._saveSlotPanel) {
      this._saveSlotPanel.setVisible(false);
      this._saveSlotPanel = null;
    }
  }

  _confirmLoad(slot) {
    loadGame(this.registry, slot, this._storage);
    if (this._audio) this._audio.stopMusic();
    this._hideSaveSlotSelector();
    this.transitionTo('GameScene');
  }

  // ---------------------------------------------------------------------------
  // Private — credits panel
  // ---------------------------------------------------------------------------

  _showCredits() {
    if (this._creditsPanel) {
      this._creditsPanel.setVisible(true);
      return;
    }

    const { width, height } = this.scale;

    const bg = this.add.rectangle(width / 2, height / 2, width - 120, height - 80, 0x0d1a26, 0.95);
    bg.setDepth(10);

    const creditsLines = [
      'Denmark Survival',
      '',
      'A game about mastering the art of Danish living.',
      '',
      'Built with Phaser 3 & Tiled Map Editor',
      '',
      'Sound & Music — Royalty-free assets',
      '',
      'Concept, Design & Code — Denmark Survival Team',
      '',
      'Press Close to return to the menu.',
    ].join('\n');

    const text = this.add.text(width / 2, height / 2 - 20, creditsLines, {
      fontFamily: 'Arial',
      fontSize:   '18px',
      color:      '#e8d5b7',
      align:      'center',
    }).setOrigin(0.5).setDepth(11);

    const closeBtn = new GameButton(
      this, width / 2, height * 0.87, 'Close',
      () => this._hideCredits(),
      { width: 120, height: 44, depth: 11 }
    );

    this._creditsPanel = {
      bg, text, closeBtn,
      setVisible(v) {
        bg.setVisible(v);
        text.setVisible(v);
        closeBtn.setVisible(v);
      },
    };
  }

  _hideCredits() {
    if (this._creditsPanel) {
      this._creditsPanel.setVisible(false);
      this._creditsPanel = null;
    }
  }
}
