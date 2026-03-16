/**
 * src/scenes/PauseScene.js
 * Pause-menu overlay launched via Escape key during gameplay.
 *
 * Provides: Resume, Settings, Save Game, Load Game, Main Menu, Quit.
 * Main Menu and Quit show a confirmation dialog before acting.
 */

import { BaseScene } from './BaseScene.js';
import { GameButton } from '../ui/GameButton.js';
import { saveGame, loadGame, getSaveMetadata, hasSave } from '../state/StateManager.js';
import * as RK from '../constants/RegistryKeys.js';

export class PauseScene extends BaseScene {
  constructor() {
    super({ key: 'PauseScene' });

    /** Storage backend — injectable via init(data.storage) for testing. */
    this._storage = null;

    /** Confirmation dialog panel (or null when hidden). */
    this._confirmPanel = null;

    /** Save-slot selector panel (or null when hidden). */
    this._loadPanel = null;

    /** Map of button key → GameButton */
    this._buttons = {};
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(data) {
    super.init(data);
    this._storage = data.storage || (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
  }

  create() {
    const { width, height } = this.scale;

    // Semi-transparent overlay background
    this.createOverlayBackground(0.7);

    // Panel background
    const panelW = 340;
    const panelH = 440;
    this.add.rectangle(width / 2, height / 2, panelW, panelH, 0x0d1a26, 0.97)
      .setDepth(1);

    // Title
    this.add.text(width / 2, height / 2 - 185, 'Paused', {
      fontFamily: 'Georgia, serif',
      fontSize:   '36px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    // Button list
    this._createButtons(width, height);
  }

  shutdown() {
    Object.values(this._buttons).forEach(btn => btn.destroy());
    this._buttons = {};
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Private — button creation
  // ---------------------------------------------------------------------------

  _createButtons(width, height) {
    const bx     = width / 2;
    const startY = height / 2 - 120;
    const gap    = 70;
    const bw     = 260;
    const bh     = 50;

    const entries = [
      { key: 'resume',   label: 'Resume',    cb: () => this._onResume()   },
      { key: 'settings', label: 'Settings',  cb: () => this._onSettings() },
      { key: 'save',     label: 'Save Game', cb: () => this._onSaveGame() },
      { key: 'load',     label: 'Load Game', cb: () => this._onLoadGame() },
      { key: 'menu',     label: 'Main Menu', cb: () => this._onMainMenu() },
      { key: 'quit',     label: 'Quit',      cb: () => this._onQuit()     },
    ];

    entries.forEach((entry, i) => {
      this._buttons[entry.key] = new GameButton(
        this, bx, startY + i * gap, entry.label, entry.cb,
        { width: bw, height: bh, depth: 2 }
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Private — button handlers
  // ---------------------------------------------------------------------------

  _onResume() {
    this.closeOverlay();
  }

  _onSettings() {
    this.openOverlay('SettingsScene');
  }

  _onSaveGame() {
    const slot = this.registry.get(RK.SAVE_SLOT) || 1;
    saveGame(this.registry, slot, this._storage);
  }

  _onLoadGame() {
    this._showLoadPanel();
  }

  _onMainMenu() {
    this._showConfirm(
      'Return to Main Menu?\nUnsaved progress will be lost.',
      () => this._goToMainMenu()
    );
  }

  _onQuit() {
    this._showConfirm(
      'Quit the game?\nUnsaved progress will be lost.',
      () => this._quit()
    );
  }

  _goToMainMenu() {
    // Stop all active scenes and start fresh at MenuScene
    this._hideConfirm();
    if (this._parentSceneKey) {
      this.scene.stop(this._parentSceneKey);
    }
    this.scene.stop('UIScene');
    this.scene.stop(this.scene.key);
    this.scene.start('MenuScene');
  }

  _quit() {
    // In a browser environment, attempt to close the window.
    // Gracefully no-ops in tests / environments where this is blocked.
    this._hideConfirm();
    try {
      if (typeof window !== 'undefined') {
        window.close();
      }
    } catch (_) {
      // Blocked by browser — fall back to main menu
      this._goToMainMenu();
    }
  }

  // ---------------------------------------------------------------------------
  // Private — confirmation dialog
  // ---------------------------------------------------------------------------

  _showConfirm(message, onConfirm) {
    if (this._confirmPanel) {
      this._hideConfirm();
    }

    const { width, height } = this.scale;
    const cx = width / 2;
    const cy = height / 2;

    const bg = this.add.rectangle(cx, cy, 420, 220, 0x0a1220, 0.98).setDepth(10);

    const msgText = this.add.text(cx, cy - 50, message, {
      fontFamily: 'Arial',
      fontSize:   '18px',
      color:      '#e8d5b7',
      align:      'center',
    }).setOrigin(0.5).setDepth(11);

    const confirmBtn = new GameButton(this, cx - 80, cy + 55, 'Confirm', () => {
      onConfirm();
    }, { width: 130, height: 44, depth: 11 });

    const cancelBtn = new GameButton(this, cx + 80, cy + 55, 'Cancel', () => {
      this._hideConfirm();
    }, { width: 130, height: 44, depth: 11 });

    this._confirmPanel = {
      bg, msgText, confirmBtn, cancelBtn,
      setVisible(v) {
        bg.setVisible(v);
        msgText.setVisible(v);
        confirmBtn.setVisible(v);
        cancelBtn.setVisible(v);
      },
    };
  }

  _hideConfirm() {
    if (this._confirmPanel) {
      this._confirmPanel.setVisible(false);
      this._confirmPanel = null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private — load-game panel
  // ---------------------------------------------------------------------------

  _showLoadPanel() {
    if (this._loadPanel) {
      this._loadPanel.setVisible(true);
      return;
    }

    const { width, height } = this.scale;
    const px = width / 2;
    const py = height / 2;

    const bg = this.add.rectangle(px, py, 480, 320, 0x0d1a26, 0.97).setDepth(10);

    const title = this.add.text(px, py - 130, 'Load Game', {
      fontFamily: 'Georgia, serif',
      fontSize:   '26px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(11);

    const slotBtns = [];
    for (let i = 0; i < 3; i++) {
      const slot = i + 1;
      const meta = getSaveMetadata(slot, this._storage);
      const label = meta
        ? `Slot ${slot}: ${meta.name} — Lv.${meta.level}  Day ${meta.day}`
        : `Slot ${slot}: Empty Slot`;
      const yOff = py - 60 + i * 80;
      const btn = new GameButton(this, px, yOff, label, () => {
        if (meta) {
          loadGame(this.registry, slot, this._storage);
          this._hideLoadPanel();
          this._goToGameScene();
        }
      }, { width: 380, height: 55, depth: 11 });
      if (!meta) btn.setEnabled(false);
      slotBtns.push(btn);
    }

    const closeBtn = new GameButton(this, px, py + 125, 'Close', () => {
      this._hideLoadPanel();
    }, { width: 120, height: 44, depth: 11 });

    this._loadPanel = {
      bg, title, slotBtns, closeBtn,
      setVisible(v) {
        bg.setVisible(v);
        title.setVisible(v);
        slotBtns.forEach(b => b.setVisible(v));
        closeBtn.setVisible(v);
      },
    };
  }

  _hideLoadPanel() {
    if (this._loadPanel) {
      this._loadPanel.setVisible(false);
      this._loadPanel = null;
    }
  }

  _goToGameScene() {
    // Close this overlay and resume the game at the saved state
    const targetScene = this.registry.get(RK.PLAYER_SCENE) || 'GameScene';
    this._hideConfirm();
    if (this._parentSceneKey) {
      this.scene.stop(this._parentSceneKey);
    }
    this.scene.stop(this.scene.key);
    this.scene.start(targetScene);
  }
}
