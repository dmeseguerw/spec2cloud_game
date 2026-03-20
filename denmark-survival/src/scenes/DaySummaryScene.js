/**
 * src/scenes/DaySummaryScene.js
 * End-of-day review scene — "Day X Summary" displayed after each in-game day.
 *
 * Sections:
 *  1. Day Header      — day number, season, level / phase
 *  2. Activities      — completed ✓ vs missed ✗, slot count
 *  3. XP Breakdown    — gains (green) / losses (red) by category, tally animation
 *  4. Net XP Change   — large ±N display, progress bar, optional level-up celebration
 *  5. Notable Events  — NPC meetings, encyclopedia entries, encounter outcomes
 *  6. Tomorrow Preview — mandatory obligations, bills due, weather, slots remaining
 *  7. Actions         — "Continue" → next day / "Save & Quit" → save + MenuScene
 */

import { BaseScene }  from './BaseScene.js';
import { GameButton } from '../ui/GameButton.js';
import { saveGame }   from '../state/StateManager.js';
import * as RK        from '../constants/RegistryKeys.js';
import { XPLog }      from '../systems/XPLog.js';
import {
  calculateLevel,
  getPhaseForLevel,
  LEVEL_THRESHOLDS,
  MAX_LEVEL,
} from '../systems/XPEngine.js';
import {
  SFX_XP_GAIN,
  SFX_XP_LOSS,
  SFX_LEVEL_UP,
} from '../constants/AudioKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 constants — exported for testing
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Friendly XP source labels used on the Day 1 summary screen.
 * Keys match `source` strings logged by grantXP() during gameplay.
 */
export const DAY1_XP_LABELS = {
  'lars_dialogue':               'Talked with Lars',
  'First grocery run completed': 'First grocery run completed',
  'Visited Netto for the first time': 'Visited Netto for the first time',
  'First item use':              'Ate a meal',
  'Picked up pant bottle':       'Picked up pant bottle',
  'Returned pant bottles':       'Returned pant bottles',
  'Survived first day':          'Survived your first day!',
};

/**
 * The "Tomorrow's Preview" seed text displayed on the Day 1 summary screen.
 * Seeds the `story_first_class` mission for Day 2.
 */
export const DAY1_TOMORROW_PREVIEW_TEXT =
  'Lars mentioned there\'s a free introductory class at the language school nearby. ' +
  'It might be worth checking out tomorrow.';

// ─────────────────────────────────────────────────────────────────────────────
// Pure data helpers — exported for unit testing without Phaser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Separate XP log entries into gains and losses grouped by category.
 *
 * @param {Array<{ amount: number, source: string, category: string }>} entries
 * @returns {{ gains: Object, losses: Object, gainTotal: number, lossTotal: number }}
 */
export function categorizeXPEntries(entries) {
  const gains = {};
  const losses = {};
  let gainTotal = 0;
  let lossTotal = 0;

  for (const entry of entries) {
    const cat = entry.category || 'Uncategorized';
    if (entry.amount >= 0) {
      if (!gains[cat]) gains[cat] = [];
      gains[cat].push(entry);
      gainTotal += entry.amount;
    } else {
      if (!losses[cat]) losses[cat] = [];
      losses[cat].push(entry);
      lossTotal += entry.amount;
    }
  }

  return { gains, losses, gainTotal, lossTotal };
}

/**
 * Calculate the net XP change from an array of XP log entries.
 *
 * @param {Array<{ amount: number }>} entries
 * @returns {number}
 */
export function calculateNetXP(entries) {
  return entries.reduce((sum, e) => sum + (e.amount ?? 0), 0);
}

/**
 * Return whether a level-up occurred between two level values.
 *
 * @param {number} previousLevel
 * @param {number} currentLevel
 * @returns {boolean}
 */
export function detectLevelUp(previousLevel, currentLevel) {
  return currentLevel > previousLevel;
}

/**
 * Build a tomorrow-preview object from registry state.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ mandatoryActivities: Array, bills: Array, weather: string, slotsRemaining: number }}
 */
export function buildTomorrowPreview(registry) {
  return {
    mandatoryActivities: registry.get(RK.MANDATORY_ACTIVITIES) ?? [],
    bills:               registry.get(RK.PENDING_BILLS)        ?? [],
    weather:             registry.get(RK.WEATHER)              ?? 'Clear',
    slotsRemaining:      registry.get(RK.ACTIVITY_SLOTS_REMAINING) ?? 4,
  };
}

/**
 * Compile all summary data for the day from registry state and optional context.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {{ previousXP?: number, previousLevel?: number }} [context]
 * @returns {object} Summary data object
 */
export function compileSummaryData(registry, context = {}) {
  const currentDay  = registry.get(RK.CURRENT_DAY)   ?? 1;
  const season      = registry.get(RK.SEASON)         ?? 'Spring';
  const dayInSeason = registry.get(RK.DAY_IN_SEASON)  ?? 1;
  const weather     = registry.get(RK.WEATHER)        ?? 'Clear';
  const currentXP   = registry.get(RK.PLAYER_XP)      ?? 0;

  const currentLevel = calculateLevel(currentXP);
  const currentPhase = getPhaseForLevel(currentLevel);

  const previousXP    = context.previousXP    ?? currentXP;
  const previousLevel = context.previousLevel ?? calculateLevel(previousXP);
  const leveledUp     = detectLevelUp(previousLevel, currentLevel);

  // XP breakdown
  const entries  = XPLog.getDailyEntries(registry);
  const netXP    = XPLog.getDailyNet(registry);
  const { gains, losses, gainTotal, lossTotal } = categorizeXPEntries(entries);

  // XP progress bar
  const xpForCurrent = LEVEL_THRESHOLDS[currentLevel]              ?? 0;
  const xpForNext    = currentLevel < MAX_LEVEL
    ? LEVEL_THRESHOLDS[currentLevel + 1]
    : LEVEL_THRESHOLDS[MAX_LEVEL];
  const xpProgress   = Math.max(0, currentXP - xpForCurrent);
  const xpRange      = Math.max(1, xpForNext - xpForCurrent);
  const progressPct  = Math.min(1, xpProgress / xpRange);

  return {
    currentDay,
    season,
    dayInSeason,
    weather,
    currentXP,
    currentLevel,
    currentPhase,
    previousXP,
    previousLevel,
    leveledUp,
    netXP,
    gainTotal,
    lossTotal,
    gains,
    losses,
    entries,
    activities:           registry.get(RK.MANDATORY_ACTIVITIES)  ?? [],
    bills:                registry.get(RK.PENDING_BILLS)         ?? [],
    xpForNext,
    xpForCurrent,
    progressPct,
    encyclopediaEntries:  registry.get(RK.ENCYCLOPEDIA_ENTRIES)  ?? [],
    encounterHistory:     registry.get(RK.ENCOUNTER_HISTORY)     ?? [],
    npcRelationships:     registry.get(RK.NPC_RELATIONSHIPS)     ?? {},
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// DaySummaryScene
// ─────────────────────────────────────────────────────────────────────────────

export class DaySummaryScene extends BaseScene {
  constructor() {
    super({ key: 'DaySummaryScene' });

    /** Storage backend — injectable via init(data.storage) for testing. */
    this._storage = null;

    /** Compiled summary data for this day. */
    this._summary = null;

    /** Context passed from calling scene (previousXP, previousLevel). */
    this._context = {};

    /** Active GameButtons. */
    this._buttons = {};

    /** Text objects created during tally animation. */
    this._tallyTexts = [];

    /** True once the XP tally animation has finished. */
    this._tallyDone = false;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(data) {
    super.init(data);
    this._storage = data.storage
      || (typeof globalThis !== 'undefined' ? globalThis.localStorage : null);
    this._context = {
      previousXP:    data.previousXP    ?? undefined,
      previousLevel: data.previousLevel ?? undefined,
    };
  }

  create() {
    this.fadeInCamera();

    this._summary = compileSummaryData(this.registry, this._context);

    const { width, height } = this.scale;
    const cx = width / 2;

    // Background
    this.add.rectangle(cx, height / 2, width, height, 0x0a0f1a).setDepth(0);

    // Sections
    this._renderDayHeader(cx, 55);
    this._renderActivities(cx, 160);
    this._renderXPBreakdown(cx, 310);
    this._renderNetXP(cx, 468);
    this._renderNotableEvents(cx, 550);
    this._renderTomorrowPreview(cx, 618);
    this._renderActions(cx, height - 56);
  }

  shutdown() {
    Object.values(this._buttons).forEach(btn => btn.destroy());
    this._buttons   = {};
    this._tallyTexts = [];
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Section renderers
  // ---------------------------------------------------------------------------

  /** Section 1 — Day Header */
  _renderDayHeader(cx, y) {
    const { currentDay, season, dayInSeason, weather, currentLevel, currentPhase } = this._summary;

    this.add.text(cx, y, `Day ${currentDay} Summary`, {
      fontFamily: 'Georgia, serif',
      fontSize:   '36px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    const sub = `${season} · Day ${dayInSeason} · ${weather}  |  Level ${currentLevel} — ${currentPhase}`;
    this.add.text(cx, y + 44, sub, {
      fontFamily: 'Arial',
      fontSize:   '16px',
      color:      '#a0bbd0',
    }).setOrigin(0.5).setDepth(2);
  }

  /** Section 2 — Activities Completed */
  _renderActivities(cx, y) {
    const { activities } = this._summary;

    const completed = activities.filter(a => a.completed).length;
    const total     = activities.length;

    this.add.text(cx, y, `Activities: ${completed} of ${total}`, {
      fontFamily: 'Arial',
      fontSize:   '18px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    activities.forEach((activity, idx) => {
      const icon  = activity.completed ? '✓' : '✗';
      const color = activity.completed ? '#66cc66' : '#cc4444';
      this.add.text(
        cx - 200 + (idx % 3) * 200,
        y + 28 + Math.floor(idx / 3) * 22,
        `${icon} ${activity.label}`,
        { fontFamily: 'Arial', fontSize: '14px', color },
      ).setOrigin(0.5).setDepth(2);
    });
  }

  /** Section 3 — XP Breakdown (two-column: Gains | Losses) with tally animation */
  _renderXPBreakdown(cx, y) {
    const { gains, losses, gainTotal, lossTotal, entries } = this._summary;

    this.add.text(cx, y, 'XP Breakdown', {
      fontFamily: 'Georgia, serif',
      fontSize:   '20px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    const currentDay        = this.registry.get(RK.CURRENT_DAY);
    const tutorialCompleted = this.registry.get(RK.TUTORIAL_COMPLETED) ?? false;
    const isDay1            = currentDay === 1 && !tutorialCompleted;

    if (isDay1 && Array.isArray(entries) && entries.length > 0) {
      // Day 1: show each XP entry as a friendly labelled row
      this._renderDay1XPRows(cx, y + 30, entries);
      const totY = y + 30 + entries.length * 24 + 8;
      this.add.text(cx - 180, totY, `Total: +${gainTotal}`, {
        fontFamily: 'Arial', fontSize: '14px', color: '#66cc66',
      }).setOrigin(0.5).setDepth(2);
    } else {
      // Day 2+: category-grouped two-column layout
      this.add.text(cx - 180, y + 26, 'Gains', {
        fontFamily: 'Arial', fontSize: '15px', color: '#66cc66',
      }).setOrigin(0.5).setDepth(2);

      this.add.text(cx + 180, y + 26, 'Losses', {
        fontFamily: 'Arial', fontSize: '15px', color: '#cc4444',
      }).setOrigin(0.5).setDepth(2);

      this._scheduleTallyAnimation(cx, y + 48, gains, losses);

      const rowH  = 24;
      const rows  = Math.max(Object.keys(gains).length, Object.keys(losses).length);
      const totY  = y + 48 + rows * rowH + 4;

      this.add.text(cx - 180, totY, `Total: +${gainTotal}`, {
        fontFamily: 'Arial', fontSize: '14px', color: '#66cc66',
      }).setOrigin(0.5).setDepth(2);

      this.add.text(cx + 180, totY, `Total: ${lossTotal}`, {
        fontFamily: 'Arial', fontSize: '14px', color: '#cc4444',
      }).setOrigin(0.5).setDepth(2);
    }
  }

  /**
   * Render individual XP entries for the Day 1 summary using friendly labels.
   *
   * @param {number} cx
   * @param {number} baseY
   * @param {Array<{amount:number, source:string}>} entries
   */
  _renderDay1XPRows(cx, baseY, entries) {
    entries.forEach((entry, idx) => {
      const rowY   = baseY + idx * 24;
      const label  = DAY1_XP_LABELS[entry.source] ?? entry.source;
      const sign   = entry.amount >= 0 ? '+' : '';
      const color  = entry.amount >= 0 ? '#66cc66' : '#cc4444';

      this.add.text(cx - 220, rowY, label, {
        fontFamily: 'Arial', fontSize: '13px', color: '#e8d5b7',
      }).setOrigin(0, 0.5).setDepth(2);

      this.add.text(cx + 160, rowY, `${sign}${entry.amount}`, {
        fontFamily: 'Arial', fontSize: '13px', color,
      }).setOrigin(0.5, 0.5).setDepth(2);
    });
  }

  /** Section 4 — Net XP Change + progress bar + optional level-up */
  _renderNetXP(cx, y) {
    const { netXP, progressPct, leveledUp } = this._summary;

    const sign  = netXP >= 0 ? '+' : '';
    const color = netXP >= 0 ? '#66cc66' : '#cc4444';

    this.add.text(cx, y, `${sign}${netXP} XP`, {
      fontFamily: 'Georgia, serif',
      fontSize:   '32px',
      color,
    }).setOrigin(0.5).setDepth(2);

    // Progress bar background
    const barW = 400;
    const barH = 16;
    this.add.rectangle(cx, y + 40, barW, barH, 0x334455).setDepth(2);

    // Progress bar fill
    const fillW = Math.max(2, barW * progressPct);
    this.add.rectangle(
      cx - barW / 2 + fillW / 2,
      y + 40,
      fillW,
      barH,
      0x4a9eff,
    ).setDepth(3);

    if (leveledUp) {
      this._renderLevelUp(cx, y + 62);
    }
  }

  /** Level-up celebration panel */
  _renderLevelUp(cx, y) {
    const { currentLevel, currentPhase } = this._summary;

    const txt = this.add.text(cx, y, `🎉 Level Up! Level ${currentLevel} — ${currentPhase}`, {
      fontFamily: 'Georgia, serif',
      fontSize:   '22px',
      color:      '#ffd700',
    }).setOrigin(0.5).setDepth(3);

    // Celebration scale-pop when tweens are available and motion is not reduced
    if (this.tweens && !this._isReducedMotion()) {
      txt.setAlpha(0);
      this.tweens.add({
        targets:  txt,
        alpha:    1,
        scaleX:   { from: 0.5, to: 1 },
        scaleY:   { from: 0.5, to: 1 },
        duration: 600,
        ease:     'Back.easeOut',
      });
    }

    this._playSound(SFX_LEVEL_UP);
  }

  /** Section 5 — Notable Events */
  _renderNotableEvents(cx, y) {
    const { encyclopediaEntries, encounterHistory } = this._summary;

    this.add.text(cx, y, 'Notable Events', {
      fontFamily: 'Georgia, serif',
      fontSize:   '18px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    const events = [];

    if (encyclopediaEntries.length > 0) {
      const n = encyclopediaEntries.length;
      events.push(`📚 ${n} encyclopedia entr${n === 1 ? 'y' : 'ies'} discovered`);
    }

    if (encounterHistory.length > 0) {
      const n = encounterHistory.length;
      events.push(`⚔️ ${n} encounter${n === 1 ? '' : 's'} resolved`);
    }

    if (events.length === 0) {
      events.push('No notable events today.');
    }

    events.forEach((evt, idx) => {
      this.add.text(cx, y + 22 + idx * 20, evt, {
        fontFamily: 'Arial',
        fontSize:   '13px',
        color:      '#c0c8d4',
      }).setOrigin(0.5).setDepth(2);
    });
  }

  /** Section 6 — Tomorrow Preview */
  _renderTomorrowPreview(cx, y) {
    const tomorrow = buildTomorrowPreview(this.registry);

    this.add.text(cx, y, 'Tomorrow', {
      fontFamily: 'Georgia, serif',
      fontSize:   '18px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    const lines = [];
    lines.push(`${tomorrow.slotsRemaining} activity slot${tomorrow.slotsRemaining !== 1 ? 's' : ''} available`);
    lines.push(`Weather: ${tomorrow.weather}`);

    if (tomorrow.mandatoryActivities.length > 0) {
      lines.push(`Mandatory: ${tomorrow.mandatoryActivities.map(a => a.label).join(', ')}`);
    }
    if (tomorrow.bills.length > 0) {
      lines.push(`Bills due: ${tomorrow.bills.length}`);
    }

    // Day 1 seed text: hint at language school mission for Day 2.
    const currentDay        = this.registry.get(RK.CURRENT_DAY);
    const tutorialCompleted = this.registry.get(RK.TUTORIAL_COMPLETED) ?? false;
    if (currentDay === 1 && !tutorialCompleted) {
      lines.push(DAY1_TOMORROW_PREVIEW_TEXT);
    }

    lines.forEach((line, idx) => {
      this.add.text(cx, y + 22 + idx * 18, line, {
        fontFamily: 'Arial',
        fontSize:   '13px',
        color:      '#a0bbd0',
        wordWrap:   { width: 600 },
      }).setOrigin(0.5).setDepth(2);
    });
  }

  /** Section 7 — Action buttons */
  _renderActions(cx, y) {
    this._buttons.continue = new GameButton(
      this, cx - 100, y, 'Continue', () => this._onContinue(),
      { width: 160, height: 48, depth: 4 },
    );

    this._buttons.saveQuit = new GameButton(
      this, cx + 100, y, 'Save & Quit', () => this._onSaveAndQuit(),
      { width: 160, height: 48, depth: 4 },
    );
  }

  // ---------------------------------------------------------------------------
  // XP tally animation
  // ---------------------------------------------------------------------------

  /**
   * Schedule XP tally animation — entries appear one-by-one with brief delay.
   * Degrades gracefully to immediate display when Phaser time is unavailable.
   *
   * @param {number} cx - Centre X.
   * @param {number} baseY - Top Y of first row.
   * @param {Object} gains  - Category → entry array (positives).
   * @param {Object} losses - Category → entry array (negatives).
   */
  _scheduleTallyAnimation(cx, baseY, gains, losses) {
    const gainCats = Object.keys(gains);
    const lossCats = Object.keys(losses);
    const rowCount = Math.max(gainCats.length, lossCats.length);

    if (!this.time || typeof this.time.addEvent !== 'function') {
      // Non-Phaser environment — render synchronously
      for (let i = 0; i < rowCount; i++) {
        this._renderTallyRow(cx, baseY, gains, losses, gainCats, lossCats, i);
      }
      this._tallyDone = true;
      return;
    }

    for (let i = 0; i < rowCount; i++) {
      const row = i;
      this.time.addEvent({
        delay:         row * 150,
        callback:      () => this._renderTallyRow(cx, baseY, gains, losses, gainCats, lossCats, row),
        callbackScope: this,
      });
    }

    this.time.addEvent({
      delay:         rowCount * 150 + 50,
      callback:      () => { this._tallyDone = true; },
      callbackScope: this,
    });
  }

  /**
   * Render a single tally row (gain category on left, loss category on right).
   * Gains slide in from the left, losses from the right, when tweens are available.
   */
  _renderTallyRow(cx, baseY, gains, losses, gainCats, lossCats, rowIndex) {
    const rowY      = baseY + rowIndex * 24;
    const canAnimate = this.tweens && !this._isReducedMotion();

    if (gainCats[rowIndex]) {
      const cat     = gainCats[rowIndex];
      const total   = gains[cat].reduce((s, e) => s + e.amount, 0);
      const targetX = cx - 180;
      const txt = this.add.text(targetX, rowY, `${cat}: +${total}`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#66cc66',
      }).setOrigin(0.5).setDepth(2);

      if (canAnimate) {
        txt.setAlpha(0);
        txt.x = targetX - 80;
        this.tweens.add({
          targets: txt, x: targetX, alpha: 1, duration: 250, ease: 'Quad.easeOut',
        });
      }

      this._tallyTexts.push(txt);
      this._playSound(SFX_XP_GAIN);
    }

    if (lossCats[rowIndex]) {
      const cat     = lossCats[rowIndex];
      const total   = losses[cat].reduce((s, e) => s + e.amount, 0);
      const targetX = cx + 180;
      const txt = this.add.text(targetX, rowY, `${cat}: ${total}`, {
        fontFamily: 'Arial', fontSize: '13px', color: '#cc4444',
      }).setOrigin(0.5).setDepth(2);

      if (canAnimate) {
        txt.setAlpha(0);
        txt.x = targetX + 80;
        this.tweens.add({
          targets: txt, x: targetX, alpha: 1, duration: 250, ease: 'Quad.easeOut',
        });
      }

      this._tallyTexts.push(txt);
      this._playSound(SFX_XP_LOSS);
    }
  }

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  /** "Continue" → advance to the next day's morning scene. */
  _onContinue() {
    // Day 1 completion: mark tutorial done before loading next day.
    const currentDay = this.registry.get(RK.CURRENT_DAY);
    if (currentDay === 1 && !this.registry.get(RK.TUTORIAL_COMPLETED)) {
      this.registry.set(RK.TUTORIAL_COMPLETED, true);
      this.registry.set(RK.CURRENT_DAY, 2);
    }
    this.scene.start('GameScene');
  }

  /** "Save & Quit" → save the current game then return to the main menu. */
  _onSaveAndQuit() {
    const slot = this.registry.get(RK.SAVE_SLOT) || 1;
    saveGame(this.registry, slot, this._storage);
    this.scene.start('MenuScene');
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Return true if the reduced-motion accessibility setting is active.
   * @returns {boolean}
   */
  _isReducedMotion() {
    return this.registry?.get?.(RK.REDUCED_MOTION) === true;
  }

  /**
   * Play a sound effect if the Phaser sound system is available.
   * Silently no-ops in test environments.
   *
   * @param {string} key - AudioKey constant.
   */
  _playSound(key) {
    if (!this.sound || typeof this.sound.add !== 'function') return;
    try {
      const snd = this.sound.add(key);
      if (snd) snd.play();
    } catch (_) {
      // Blocked in test/headless environments — ignore
    }
  }
}
