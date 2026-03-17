/**
 * src/scenes/SettingsScene.js
 * Settings overlay — audio, gameplay, accessibility, and controls reference.
 *
 * Can be launched as an overlay from MenuScene or PauseScene.
 * All settings are persisted to the shared Phaser registry and to localStorage
 * so they survive page reloads.
 */

import { BaseScene } from './BaseScene.js';
import { GameButton } from '../ui/GameButton.js';
import * as RK from '../constants/RegistryKeys.js';

/** localStorage key for non-registry settings (accessibility, etc.). */
const SETTINGS_STORAGE_KEY = 'denmarkSurvival_settings';

/** Volume step for each +/- press (10 %). */
const VOLUME_STEP = 0.1;

/** Supported difficulty values. */
const DIFFICULTIES = ['easy', 'normal', 'hard'];

/** Supported text-size percentages. */
const TEXT_SIZES = [100, 125, 150, 175, 200];

export class SettingsScene extends BaseScene {
  constructor() {
    super({ key: 'SettingsScene' });

    /** Storage backend — injected via init(data.storage) for testing. */
    this._storage = null;

    /** Current in-memory settings snapshot. */
    this._settings = {
      masterVolume:  0.8,
      musicVolume:   0.6,
      sfxVolume:     0.8,
      muted:         false,
      difficulty:    'normal',
      tutorialHints: true,
      textSize:      100,
      highContrast:  false,
      dyslexiaFont:  false,
      reducedMotion: false,
    };

    /** Map of UI label objects so tests can read displayed values. */
    this._labels = {};
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(data) {
    super.init(data);
    this._storage = data.storage || (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
  }

  create() {
    // Overlay background (semi-transparent) when launched as overlay
    if (this._isOverlay) {
      this.createOverlayBackground();
    }

    // Load persisted settings first
    this._loadSettings();

    const { width, height } = this.scale;

    // Title
    this.add.text(width / 2, 50, 'Settings', {
      fontFamily: 'Georgia, serif',
      fontSize:   '40px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(1);

    // Sections
    this._createAudioSection(width, height);
    this._createGameplaySection(width, height);
    this._createAccessibilitySection(width, height);
    this._createControlsSection(width, height);

    // Close / Save & Close
    this._createCloseButton(width, height);
  }

  shutdown() {
    this._labels = {};
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Public API — Volume
  // ---------------------------------------------------------------------------

  /**
   * Set master volume, clamped to [0, 1].
   * Updates registry so AudioManager reacts immediately.
   * @param {number} value
   */
  setMasterVolume(value) {
    this._settings.masterVolume = _clamp01(value);
    this.registry.set(RK.VOLUME_MASTER, this._settings.masterVolume);
    this._updateVolumeLabel('master');
    this._persistSettings();
  }

  /**
   * Set music volume, clamped to [0, 1].
   * @param {number} value
   */
  setMusicVolume(value) {
    this._settings.musicVolume = _clamp01(value);
    this.registry.set(RK.VOLUME_MUSIC, this._settings.musicVolume);
    this._updateVolumeLabel('music');
    this._persistSettings();
  }

  /**
   * Set SFX volume, clamped to [0, 1].
   * @param {number} value
   */
  setSfxVolume(value) {
    this._settings.sfxVolume = _clamp01(value);
    this.registry.set(RK.VOLUME_SFX, this._settings.sfxVolume);
    this._updateVolumeLabel('sfx');
    this._persistSettings();
  }

  /**
   * Toggle or explicitly set mute state.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._settings.muted = Boolean(muted);
    this._persistSettings();
  }

  // ---------------------------------------------------------------------------
  // Public API — Gameplay
  // ---------------------------------------------------------------------------

  /**
   * Set difficulty ('easy', 'normal', or 'hard').
   * @param {string} difficulty
   */
  setDifficulty(difficulty) {
    if (!DIFFICULTIES.includes(difficulty)) return;
    this._settings.difficulty = difficulty;
    this.registry.set(RK.DIFFICULTY, difficulty);
    this._persistSettings();
  }

  /**
   * Enable or disable tutorial hints.
   * @param {boolean} enabled
   */
  setTutorialHints(enabled) {
    this._settings.tutorialHints = Boolean(enabled);
    this._persistSettings();
  }

  // ---------------------------------------------------------------------------
  // Public API — Accessibility
  // ---------------------------------------------------------------------------

  /**
   * Set text size scaling percentage, clamped to [100, 200].
   * @param {number} size
   */
  setTextSize(size) {
    this._settings.textSize = Math.max(100, Math.min(200, size));
    this._persistSettings();
  }

  /**
   * Enable or disable high-contrast mode.
   * @param {boolean} enabled
   */
  setHighContrast(enabled) {
    this._settings.highContrast = Boolean(enabled);
    this._persistSettings();
  }

  /**
   * Enable or disable dyslexia-friendly font.
   * @param {boolean} enabled
   */
  setDyslexiaFont(enabled) {
    this._settings.dyslexiaFont = Boolean(enabled);
    this._persistSettings();
  }

  /**
   * Enable or disable reduced-motion mode.
   * When enabled, all non-essential animations are suppressed.
   * @param {boolean} enabled
   */
  setReducedMotion(enabled) {
    this._settings.reducedMotion = Boolean(enabled);
    this.registry.set(RK.REDUCED_MOTION, this._settings.reducedMotion);
    this._persistSettings();
  }

  // ---------------------------------------------------------------------------
  // Public API — Getters
  // ---------------------------------------------------------------------------

  /** Returns a shallow copy of the current settings snapshot. */
  getSettings() {
    return { ...this._settings };
  }

  // ---------------------------------------------------------------------------
  // Private — settings persistence
  // ---------------------------------------------------------------------------

  /**
   * Load settings from registry (for volume/difficulty) and from localStorage
   * (for accessibility values not tracked in the registry).
   */
  _loadSettings() {
    // Registry-backed settings
    this._settings.masterVolume = _clamp01(this.registry.get(RK.VOLUME_MASTER) ?? 0.8);
    this._settings.musicVolume  = _clamp01(this.registry.get(RK.VOLUME_MUSIC)  ?? 0.6);
    this._settings.sfxVolume    = _clamp01(this.registry.get(RK.VOLUME_SFX)    ?? 0.8);
    this._settings.difficulty   = this.registry.get(RK.DIFFICULTY) ?? 'normal';

    // Tutorial: registry stores TUTORIAL_COMPLETED, we invert for the toggle
    const tutorialDone = this.registry.get(RK.TUTORIAL_COMPLETED);
    this._settings.tutorialHints = tutorialDone !== true;

    // localStorage-backed accessibility / mute settings
    const saved = this._loadFromStorage();
    if (saved) {
      this._settings.muted         = Boolean(saved.muted         ?? false);
      this._settings.textSize      = Math.max(100, Math.min(200, saved.textSize ?? 100));
      this._settings.highContrast  = Boolean(saved.highContrast  ?? false);
      this._settings.dyslexiaFont  = Boolean(saved.dyslexiaFont  ?? false);
      this._settings.reducedMotion = Boolean(saved.reducedMotion ?? false);
    }
  }

  /**
   * Save all settings back to registry and localStorage.
   */
  _persistSettings() {
    // Registry
    this.registry.set(RK.VOLUME_MASTER, this._settings.masterVolume);
    this.registry.set(RK.VOLUME_MUSIC,  this._settings.musicVolume);
    this.registry.set(RK.VOLUME_SFX,    this._settings.sfxVolume);
    this.registry.set(RK.DIFFICULTY,    this._settings.difficulty);

    // localStorage — accessibility + mute
    if (this._storage) {
      try {
        this._storage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({
          muted:         this._settings.muted,
          textSize:      this._settings.textSize,
          highContrast:  this._settings.highContrast,
          dyslexiaFont:  this._settings.dyslexiaFont,
          reducedMotion: this._settings.reducedMotion,
        }));
      } catch (_) {
        // Ignore storage errors (e.g. private browsing quota)
      }
    }
  }

  _loadFromStorage() {
    try {
      const raw = this._storage?.getItem(SETTINGS_STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Private — UI creation
  // ---------------------------------------------------------------------------

  _createAudioSection(width, _height) {
    const sectionX = width * 0.25;
    const startY   = 130;

    this.add.text(sectionX, startY, 'Audio', {
      fontFamily: 'Arial', fontSize: '24px', color: '#a0c0e0',
    }).setOrigin(0.5).setDepth(1);

    // Master volume
    this._createVolumeRow('master', 'Master', sectionX, startY + 50);
    // Music volume
    this._createVolumeRow('music', 'Music', sectionX, startY + 110);
    // SFX volume
    this._createVolumeRow('sfx', 'SFX', sectionX, startY + 170);

    // Mute toggle
    this._createToggleRow('muted', 'Mute All', sectionX, startY + 240,
      () => this.setMuted(!this._settings.muted));
  }

  /**
   * Creates a single volume row: label + decrement button + value label + increment button.
   * @param {string} key - 'master' | 'music' | 'sfx'
   * @param {string} displayName
   * @param {number} x
   * @param {number} y
   */
  _createVolumeRow(key, displayName, x, y) {
    this.add.text(x - 100, y, displayName, {
      fontFamily: 'Arial', fontSize: '18px', color: '#e8d5b7',
    }).setOrigin(1, 0.5).setDepth(1);

    const volumeMap = { master: 'masterVolume', music: 'musicVolume', sfx: 'sfxVolume' };
    const volKey = volumeMap[key];

    const valueLabel = this.add.text(x, y, _pct(this._settings[volKey]), {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(1);
    this._labels[`volume_${key}`] = valueLabel;

    new GameButton(this, x - 55, y, '-', () => {
      const setter = key === 'master' ? v => this.setMasterVolume(v)
        : key === 'music' ? v => this.setMusicVolume(v)
          : v => this.setSfxVolume(v);
      setter(this._settings[volKey] - VOLUME_STEP);
    }, { width: 36, height: 36, depth: 2 });

    new GameButton(this, x + 55, y, '+', () => {
      const setter = key === 'master' ? v => this.setMasterVolume(v)
        : key === 'music' ? v => this.setMusicVolume(v)
          : v => this.setSfxVolume(v);
      setter(this._settings[volKey] + VOLUME_STEP);
    }, { width: 36, height: 36, depth: 2 });
  }

  /**
   * Creates a simple on/off toggle row.
   */
  _createToggleRow(key, displayName, x, y, onToggle) {
    this.add.text(x - 100, y, displayName, {
      fontFamily: 'Arial', fontSize: '18px', color: '#e8d5b7',
    }).setOrigin(1, 0.5).setDepth(1);

    const label = this.add.text(x, y, this._settings[key] ? 'ON' : 'OFF', {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(1);
    this._labels[`toggle_${key}`] = label;

    new GameButton(this, x + 60, y, 'Toggle', onToggle, { width: 90, height: 36, depth: 2 });
  }

  _createGameplaySection(width, _height) {
    const sectionX = width * 0.75;
    const startY   = 130;

    this.add.text(sectionX, startY, 'Gameplay', {
      fontFamily: 'Arial', fontSize: '24px', color: '#a0c0e0',
    }).setOrigin(0.5).setDepth(1);

    // Difficulty selector
    this.add.text(sectionX - 120, startY + 60, 'Difficulty', {
      fontFamily: 'Arial', fontSize: '18px', color: '#e8d5b7',
    }).setOrigin(0, 0.5).setDepth(1);

    const diffLabel = this.add.text(sectionX + 10, startY + 60, _capitalise(this._settings.difficulty), {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(1);
    this._labels['difficulty'] = diffLabel;

    new GameButton(this, sectionX + 80, startY + 60, '←', () => {
      const idx = DIFFICULTIES.indexOf(this._settings.difficulty);
      const next = DIFFICULTIES[(idx - 1 + DIFFICULTIES.length) % DIFFICULTIES.length];
      this.setDifficulty(next);
      if (this._labels['difficulty']) this._labels['difficulty'].setText(_capitalise(this._settings.difficulty));
    }, { width: 40, height: 36, depth: 2 });

    new GameButton(this, sectionX + 130, startY + 60, '→', () => {
      const idx = DIFFICULTIES.indexOf(this._settings.difficulty);
      const next = DIFFICULTIES[(idx + 1) % DIFFICULTIES.length];
      this.setDifficulty(next);
      if (this._labels['difficulty']) this._labels['difficulty'].setText(_capitalise(this._settings.difficulty));
    }, { width: 40, height: 36, depth: 2 });

    // Tutorial hints toggle
    this._createToggleRow('tutorialHints', 'Tutorial Hints', sectionX, startY + 130,
      () => this.setTutorialHints(!this._settings.tutorialHints));
  }

  _createAccessibilitySection(width, _height) {
    const sectionX = width * 0.25;
    const startY   = 370;

    this.add.text(sectionX, startY, 'Accessibility', {
      fontFamily: 'Arial', fontSize: '24px', color: '#a0c0e0',
    }).setOrigin(0.5).setDepth(1);

    // Text size selector
    this.add.text(sectionX - 100, startY + 50, 'Text Size', {
      fontFamily: 'Arial', fontSize: '18px', color: '#e8d5b7',
    }).setOrigin(1, 0.5).setDepth(1);

    const textSizeLabel = this.add.text(sectionX, startY + 50, `${this._settings.textSize}%`, {
      fontFamily: 'Arial', fontSize: '18px', color: '#ffffff',
    }).setOrigin(0.5).setDepth(1);
    this._labels['textSize'] = textSizeLabel;

    new GameButton(this, sectionX - 55, startY + 50, '-', () => {
      const idx  = TEXT_SIZES.indexOf(this._settings.textSize);
      const next = TEXT_SIZES[Math.max(0, idx - 1)];
      this.setTextSize(next);
      if (this._labels['textSize']) this._labels['textSize'].setText(`${this._settings.textSize}%`);
    }, { width: 36, height: 36, depth: 2 });

    new GameButton(this, sectionX + 55, startY + 50, '+', () => {
      const idx  = TEXT_SIZES.indexOf(this._settings.textSize);
      const next = TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, idx + 1)];
      this.setTextSize(next);
      if (this._labels['textSize']) this._labels['textSize'].setText(`${this._settings.textSize}%`);
    }, { width: 36, height: 36, depth: 2 });

    // High contrast
    this._createToggleRow('highContrast', 'High Contrast', sectionX, startY + 110,
      () => this.setHighContrast(!this._settings.highContrast));

    // Dyslexia font
    this._createToggleRow('dyslexiaFont', 'Dyslexia Font', sectionX, startY + 170,
      () => this.setDyslexiaFont(!this._settings.dyslexiaFont));

    // Reduced motion (disables non-essential animations)
    this._createToggleRow('reducedMotion', 'Reduced Motion', sectionX, startY + 230,
      () => this.setReducedMotion(!this._settings.reducedMotion));
  }

  _createControlsSection(width, _height) {
    const sectionX = width * 0.75;
    const startY   = 370;

    this.add.text(sectionX, startY, 'Controls', {
      fontFamily: 'Arial', fontSize: '24px', color: '#a0c0e0',
    }).setOrigin(0.5).setDepth(1);

    const bindings = [
      'WASD / Arrows — Move',
      'E              — Interact',
      'Space          — Confirm',
      'Tab            — Inventory',
      'Esc            — Pause',
    ];

    bindings.forEach((line, i) => {
      this.add.text(sectionX, startY + 50 + i * 34, line, {
        fontFamily: 'Courier New, monospace',
        fontSize:   '16px',
        color:      '#a0c0e0',
      }).setOrigin(0.5).setDepth(1);
    });
  }

  _createCloseButton(width, height) {
    new GameButton(
      this, width / 2, height - 50, 'Save & Close',
      () => this._close(),
      { width: 180, height: 50, depth: 2 }
    );
  }

  // ---------------------------------------------------------------------------
  // Private — helpers
  // ---------------------------------------------------------------------------

  _updateVolumeLabel(key) {
    const volumeMap = { master: 'masterVolume', music: 'musicVolume', sfx: 'sfxVolume' };
    const label = this._labels[`volume_${key}`];
    if (label && typeof label.setText === 'function') {
      label.setText(_pct(this._settings[volumeMap[key]]));
    }
  }

  _close() {
    this._persistSettings();
    if (this._isOverlay) {
      this.closeOverlay();
    } else {
      this.transitionTo('MenuScene');
    }
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers (pure functions — easy to unit-test)
// ---------------------------------------------------------------------------

/** Clamp a number to [0, 1]. */
function _clamp01(value) {
  return Math.max(0, Math.min(1, Number(value) || 0));
}

/** Format a [0,1] volume as a percentage string: "80%". */
function _pct(value) {
  return `${Math.round(value * 100)}%`;
}

/** Capitalise first letter. */
function _capitalise(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
