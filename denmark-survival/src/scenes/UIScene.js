/**
 * src/scenes/UIScene.js
 * HUD overlay scene — runs in parallel with GameScene.
 * Displays player stats, time/day info, location, and notifications.
 * Listens to registry change events for reactive updates.
 */

import { BaseScene } from './BaseScene.js';
import { ProgressBar } from '../ui/ProgressBar.js';
import { NotificationManager } from '../ui/NotificationManager.js';
import {
  PLAYER_XP,
  PLAYER_LEVEL,
  TIME_OF_DAY,
  CURRENT_DAY,
  SEASON,
  WEATHER,
  PLAYER_HEALTH,
  PLAYER_ENERGY,
  PLAYER_MONEY,
  CURRENT_LOCATION,
  CONTEXT_HINT,
  REDUCED_MOTION,
  ACTIVE_TASKS,
  TRACKED_TASK_ID,
} from '../constants/RegistryKeys.js';
import { getActiveTasks, getTrackedTask, setTrackedTask } from '../systems/QuestEngine.js';

/** Map time-of-day values to display labels. */
const TIME_LABELS = {
  morning:   '🌅 Morning',
  afternoon: '☀️ Afternoon',
  evening:   '🌆 Evening',
  night:     '🌙 Night',
};

/** XP required to advance from one level to the next. */
const XP_PER_LEVEL = 100;

/** Map weather values to display labels. */
const WEATHER_LABELS = {
  sunny:  '☀️ Sunny',
  cloudy: '☁️ Cloudy',
  rainy:  '🌧️ Rainy',
  snowy:  '❄️ Snowy',
  windy:  '💨 Windy',
  foggy:  '🌫️ Foggy',
};

/** Health/energy percentage below which a pulse effect activates. */
const CRITICAL_THRESHOLD = 25;

/** Duration of the bar tween animation (ms). */
const BAR_ANIM_DURATION = 300;

/** Duration of the money flash scale tween (ms). */
const MONEY_FLASH_DURATION = 120;

/** How often the Objectives Panel cycles through active tasks (ms). */
const OBJECTIVES_CYCLE_INTERVAL = 5000;

/** How often the urgent/critical amber flash fires (ms). */
const OBJECTIVES_AMBER_FLASH_INTERVAL = 30000;

/** Urgency → background colour mapping for the Objectives Panel. */
const URGENCY_COLOURS = {
  critical: 0xcc2222,
  urgent:   0xcc7700,
  normal:   0x1155aa,
  low:      0x336633,
};

/**
 * Map urgency level to a hex text colour string for the Objectives Panel.
 * @param {string} urgency
 * @returns {string}
 */
function _urgencyTextColour(urgency) {
  switch (urgency) {
    case 'critical': return '#ff4444';
    case 'urgent':   return '#ffaa33';
    case 'normal':   return '#66aaff';
    case 'low':      return '#88cc88';
    default:         return '#ffffff';
  }
}

export class UIScene extends BaseScene {
  constructor() {
    super({ key: 'UIScene' });

    // HUD state
    this._collapsed = false;
    this._xpBar = null;
    this._healthBar = null;
    this._energyBar = null;

    // Text references
    this._levelText = null;
    this._xpText = null;
    this._timeText = null;
    this._dayText = null;
    this._weatherText = null;
    this._moneyText = null;
    this._healthLabel = null;
    this._energyLabel = null;
    this._locationText = null;
    this._contextHintText = null;

    // HUD element group (for collapse toggle)
    this._hudGroup = [];

    // Key binding for collapse toggle
    this._collapseKey = null;

    // Notification manager
    this._notificationManager = null;

    // Cached values for compound display
    this._currentDay = 1;
    this._currentSeason = 'spring';

    // Previous money value — used to detect gains and trigger flash animation
    this._lastMoney = null;

    // Objectives Panel state
    this._objPanelBg = null;
    this._objPanelText = null;
    this._objCycleIndex = 0;
    this._objCycleTimer = null;
    this._objAmberTimer = null;
    this._objExpandedOpen = false;
    this._objExpandedBg = null;
    this._objExpandedContainer = null;
    this._objExpandCloseKey = null;
  }

  create() {
    const { width, height } = this.scale;

    this._createTopLeftHUD(width, height);
    this._createTopRightHUD(width, height);
    this._createBottomHUD(width, height);

    // Notification manager
    this._notificationManager = new NotificationManager(this, {
      x: width / 2,
      y: 80,
      depth: 100,
    });

    // Objectives Panel (bottom-centre)
    this._initObjectivesPanel(width, height);

    // Register registry event listeners
    this._registerListeners();

    // Set up H key for HUD collapse toggle
    this._collapseKey = this.input.keyboard.addKey('H');
    this._collapseKey.on('down', () => this._toggleCollapsed());

    // Initial refresh from registry
    this._refreshAll();
  }

  // ---------------------------------------------------------------------------
  // HUD creation
  // ---------------------------------------------------------------------------

  /**
   * Create top-left HUD elements (level, XP, time, day, weather).
   */
  _createTopLeftHUD(width, height) {
    const x = 16;
    let y = 16;

    // Level text
    this._levelText = this.add.text(x, y, 'Level 1', {
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this._levelText.setScrollFactor(0);
    this._levelText.setDepth(50);
    this._hudGroup.push(this._levelText);

    y += 24;

    // XP bar
    this._xpBar = new ProgressBar(this, x, y + 10, {
      width: 150,
      height: 12,
      bgColor: 0x333333,
      fillColor: 0x4a90d9,
      max: XP_PER_LEVEL,
      value: 0,
      depth: 50,
    });
    this._hudGroup.push(this._xpBar);

    // XP text
    this._xpText = this.add.text(x + 155, y + 10, `0/${XP_PER_LEVEL} XP`, {
      fontSize: '12px',
      color: '#aaaaee',
    });
    this._xpText.setOrigin(0, 0.5);
    this._xpText.setScrollFactor(0);
    this._xpText.setDepth(50);
    this._hudGroup.push(this._xpText);

    y += 30;

    // Time text
    this._timeText = this.add.text(x, y, '🌅 Morning', {
      fontSize: '14px',
      color: '#e8d5b7',
    });
    this._timeText.setScrollFactor(0);
    this._timeText.setDepth(50);
    this._hudGroup.push(this._timeText);

    y += 22;

    // Day text
    this._dayText = this.add.text(x, y, 'Day 1 — Spring', {
      fontSize: '14px',
      color: '#aaccaa',
    });
    this._dayText.setScrollFactor(0);
    this._dayText.setDepth(50);
    this._hudGroup.push(this._dayText);

    y += 22;

    // Weather text
    this._weatherText = this.add.text(x, y, '', {
      fontSize: '14px',
      color: '#bbddee',
    });
    this._weatherText.setScrollFactor(0);
    this._weatherText.setDepth(50);
    this._hudGroup.push(this._weatherText);
  }

  /**
   * Create top-right HUD elements (money, health, energy).
   */
  _createTopRightHUD(width, height) {
    const rightX = width - 16;
    let y = 16;

    // Money text
    this._moneyText = this.add.text(rightX, y, '0 DKK', {
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this._moneyText.setOrigin(1, 0);
    this._moneyText.setScrollFactor(0);
    this._moneyText.setDepth(50);
    this._hudGroup.push(this._moneyText);

    y += 28;

    // Health label
    this._healthLabel = this.add.text(rightX - 155, y + 6, '❤️ HP', {
      fontSize: '12px',
      color: '#ff6666',
    });
    this._healthLabel.setOrigin(1, 0.5);
    this._healthLabel.setScrollFactor(0);
    this._healthLabel.setDepth(50);
    this._hudGroup.push(this._healthLabel);

    // Health bar
    this._healthBar = new ProgressBar(this, rightX - 150, y + 6, {
      width: 150,
      height: 12,
      bgColor: 0x333333,
      fillColor: 0xcc3333,
      max: 100,
      value: 100,
      depth: 50,
    });
    this._hudGroup.push(this._healthBar);

    y += 24;

    // Energy label
    this._energyLabel = this.add.text(rightX - 155, y + 6, '⚡ EN', {
      fontSize: '12px',
      color: '#66ccff',
    });
    this._energyLabel.setOrigin(1, 0.5);
    this._energyLabel.setScrollFactor(0);
    this._energyLabel.setDepth(50);
    this._hudGroup.push(this._energyLabel);

    // Energy bar
    this._energyBar = new ProgressBar(this, rightX - 150, y + 6, {
      width: 150,
      height: 12,
      bgColor: 0x333333,
      fillColor: 0x3399ff,
      max: 100,
      value: 100,
      depth: 50,
    });
    this._hudGroup.push(this._energyBar);
  }

  /**
   * Create bottom HUD elements (location, context hint).
   */
  _createBottomHUD(width, height) {
    const centerX = width / 2;

    // Location text
    this._locationText = this.add.text(centerX, height - 50, '', {
      fontSize: '16px',
      color: '#e8d5b7',
      fontStyle: 'bold',
    });
    this._locationText.setOrigin(0.5, 0.5);
    this._locationText.setScrollFactor(0);
    this._locationText.setDepth(50);
    this._hudGroup.push(this._locationText);

    // Context hint text
    this._contextHintText = this.add.text(centerX, height - 28, '', {
      fontSize: '13px',
      color: '#aaaaaa',
      fontStyle: 'italic',
    });
    this._contextHintText.setOrigin(0.5, 0.5);
    this._contextHintText.setScrollFactor(0);
    this._contextHintText.setDepth(50);
    this._hudGroup.push(this._contextHintText);
  }

  // ---------------------------------------------------------------------------
  // Registry event listeners
  // ---------------------------------------------------------------------------

  /**
   * Register change listeners for all HUD-related registry keys.
   */
  _registerListeners() {
    this.trackEvent(this.registry.events, `changedata-${PLAYER_XP}`, (_p, _k, value) => {
      this._updateXP(value);
    });

    this.trackEvent(this.registry.events, `changedata-${PLAYER_LEVEL}`, (_p, _k, value) => {
      this._updateLevel(value);
    });

    this.trackEvent(this.registry.events, `changedata-${TIME_OF_DAY}`, (_p, _k, value) => {
      this._updateTime(value);
    });

    this.trackEvent(this.registry.events, `changedata-${CURRENT_DAY}`, (_p, _k, value) => {
      this._updateDay(value);
    });

    this.trackEvent(this.registry.events, `changedata-${SEASON}`, (_p, _k, value) => {
      this._updateSeason(value);
    });

    this.trackEvent(this.registry.events, `changedata-${WEATHER}`, (_p, _k, value) => {
      this._updateWeather(value);
    });

    this.trackEvent(this.registry.events, `changedata-${PLAYER_HEALTH}`, (_p, _k, value) => {
      this._updateHealth(value);
    });

    this.trackEvent(this.registry.events, `changedata-${PLAYER_ENERGY}`, (_p, _k, value) => {
      this._updateEnergy(value);
    });

    this.trackEvent(this.registry.events, `changedata-${PLAYER_MONEY}`, (_p, _k, value) => {
      this._updateMoney(value);
    });

    this.trackEvent(this.registry.events, `changedata-${CURRENT_LOCATION}`, (_p, _k, value) => {
      this._updateLocation(value);
    });

    this.trackEvent(this.registry.events, `changedata-${CONTEXT_HINT}`, (_p, _k, value) => {
      this._updateContextHint(value);
    });

    // Objectives Panel — react to task list changes and quest events
    this.trackEvent(this.registry.events, `changedata-${ACTIVE_TASKS}`, () => {
      this._objCycleIndex = 0;
      this._updateObjectivesPanel();
    });

    this.trackEvent(this.registry.events, `changedata-${TRACKED_TASK_ID}`, () => {
      this._updateObjectivesPanel();
    });

    this.trackEvent(this.registry.events, 'quest:taskCompleted', ({ task } = {}) => {
      this._onTaskCompleted(task);
    });
  }

  // ---------------------------------------------------------------------------
  // Update methods
  // ---------------------------------------------------------------------------

  /**
   * Refresh all HUD elements from current registry state.
   */
  _refreshAll() {
    const reg = this.registry;
    this._updateXP(reg.get(PLAYER_XP) ?? 0);
    this._updateLevel(reg.get(PLAYER_LEVEL) ?? 1);
    this._updateTime(reg.get(TIME_OF_DAY) ?? 'morning');
    this._updateDay(reg.get(CURRENT_DAY) ?? 1);
    this._updateSeason(reg.get(SEASON) ?? 'spring');
    this._updateWeather(reg.get(WEATHER) ?? '');
    this._updateHealth(reg.get(PLAYER_HEALTH) ?? 100);
    this._updateEnergy(reg.get(PLAYER_ENERGY) ?? 100);
    this._updateMoney(reg.get(PLAYER_MONEY) ?? 0);
    this._updateLocation(reg.get(CURRENT_LOCATION) ?? '');
    this._updateContextHint(reg.get(CONTEXT_HINT) ?? '');
  }

  _updateXP(xp) {
    const xpInLevel = xp % XP_PER_LEVEL;
    this._xpBar.setValue(xpInLevel, !this._isReducedMotion());
    this._xpText.setText(`${xpInLevel}/${XP_PER_LEVEL} XP`);
  }

  _updateLevel(level) {
    this._levelText.setText(`Level ${level}`);
  }

  _updateTime(timeOfDay) {
    const label = TIME_LABELS[timeOfDay] ?? timeOfDay;
    this._timeText.setText(label);
  }

  _updateDay(day) {
    this._currentDay = day;
    this._refreshDayText();
  }

  _updateSeason(season) {
    this._currentSeason = season;
    this._refreshDayText();
  }

  _refreshDayText() {
    const season = this._currentSeason.charAt(0).toUpperCase() + this._currentSeason.slice(1);
    this._dayText.setText(`Day ${this._currentDay} — ${season}`);
  }

  _updateWeather(weather) {
    const label = WEATHER_LABELS[weather] ?? weather;
    this._weatherText.setText(label);
  }

  _updateHealth(health) {
    this._healthBar.setValue(health, !this._isReducedMotion());
    if (health <= CRITICAL_THRESHOLD) {
      this._pulseCritical(this._healthLabel);
    }
  }

  _updateEnergy(energy) {
    this._energyBar.setValue(energy, !this._isReducedMotion());
    if (energy <= CRITICAL_THRESHOLD) {
      this._pulseCritical(this._energyLabel);
    }
  }

  _updateMoney(money) {
    const prev = this._lastMoney;
    this._lastMoney = money;
    this._moneyText.setText(`${money} DKK`);
    if (prev !== null && money > prev) {
      this._flashMoneyText();
    }
  }

  _updateLocation(location) {
    this._locationText.setText(location || '');
  }

  _updateContextHint(hint) {
    this._contextHintText.setText(hint || '');
  }

  // ---------------------------------------------------------------------------
  // Animation helpers
  // ---------------------------------------------------------------------------

  /**
   * Return true if the reduced-motion accessibility setting is active.
   * @returns {boolean}
   */
  _isReducedMotion() {
    return this.registry?.get?.(REDUCED_MOTION) === true;
  }

  /**
   * Pulse a HUD label (alpha blink) to signal a critically low stat.
   * No-ops when animations are unavailable or reducedMotion is set.
   * @param {object} target - Phaser text / game object.
   */
  _pulseCritical(target) {
    if (!target || !this.tweens || this._isReducedMotion()) return;
    this.tweens.add({
      targets:  target,
      alpha:    { from: 1, to: 0.3 },
      duration: 400,
      yoyo:     true,
      repeat:   2,
    });
  }

  /**
   * Brief scale-pop on the money text to highlight a money gain.
   * No-ops when animations are unavailable or reducedMotion is set.
   */
  _flashMoneyText() {
    if (!this._moneyText || !this.tweens || this._isReducedMotion()) return;
    this.tweens.add({
      targets:  this._moneyText,
      scaleX:   { from: 1, to: 1.25 },
      scaleY:   { from: 1, to: 1.25 },
      duration: MONEY_FLASH_DURATION,
      yoyo:     true,
      ease:     'Quad.easeOut',
    });
  }

  // ---------------------------------------------------------------------------
  // Objectives Panel
  // ---------------------------------------------------------------------------

  /**
   * Initialise the Objectives Panel at the bottom-centre of the screen.
   * Creates the background rectangle and the task text label.
   * Sets up the cycling timer and the amber urgency flash timer.
   *
   * @param {number} width  - Screen width.
   * @param {number} height - Screen height.
   */
  _initObjectivesPanel(width, height) {
    const panelW  = 380;
    const panelH  = 36;
    const centerX = width / 2;
    const panelY  = height - 90;

    // Background rectangle
    this._objPanelBg = this.add.rectangle(centerX, panelY, panelW, panelH, 0x111122, 0.85);
    this._objPanelBg.setOrigin(0.5, 0.5);
    this._objPanelBg.setScrollFactor(0);
    this._objPanelBg.setDepth(60);
    this._objPanelBg.setInteractive();
    this._objPanelBg.on('pointerdown', () => this._openExpandedView());
    this._hudGroup.push(this._objPanelBg);

    // Task text label
    this._objPanelText = this.add.text(centerX, panelY, 'No tasks right now — explore!', {
      fontSize: '14px',
      color: '#aaaaaa',
      fontStyle: 'normal',
    });
    this._objPanelText.setOrigin(0.5, 0.5);
    this._objPanelText.setScrollFactor(0);
    this._objPanelText.setDepth(61);
    this._objPanelText.setInteractive();
    this._objPanelText.on('pointerdown', () => this._openExpandedView());
    this._hudGroup.push(this._objPanelText);

    // Cycling timer — rotates through active tasks every 5 s
    if (this.time) {
      this._objCycleTimer = this.time.addEvent({
        delay:    OBJECTIVES_CYCLE_INTERVAL,
        loop:     true,
        callback: () => this._cycleObjectivesPanel(),
      });

      // Amber flash timer for urgent/critical tasks
      this._objAmberTimer = this.time.addEvent({
        delay:    OBJECTIVES_AMBER_FLASH_INTERVAL,
        loop:     true,
        callback: () => this._amberFlashIfUrgent(),
      });
    }

    // Keyboard close key for expanded view (Escape or Tab)
    if (this.input && this.input.keyboard) {
      this._objExpandCloseKey = this.input.keyboard.addKey('ESC');
      this._objExpandCloseKey.on('down', () => {
        if (this._objExpandedOpen) this._closeExpandedView();
      });
    }

    // Initial render
    this._updateObjectivesPanel();
  }

  /**
   * Refresh the Objectives Panel text to reflect the current tracked task.
   * Called whenever ACTIVE_TASKS or TRACKED_TASK_ID changes.
   */
  _updateObjectivesPanel() {
    if (!this._objPanelText) return;

    const task = getTrackedTask(this.registry);
    if (!task) {
      this._objPanelText.setText('No tasks right now — explore!');
      this._objPanelText.setStyle({ color: '#aaaaaa' });
      if (this._objPanelBg) this._objPanelBg.setFillStyle(0x111122, 0.85);
      return;
    }

    const label  = `${task.icon ?? '🔵'} ${task.title}`;
    const colour = _urgencyTextColour(task.urgency);
    this._objPanelText.setText(label);
    this._objPanelText.setStyle({ color: colour });

    const bgColour = URGENCY_COLOURS[task.urgency] ?? 0x111122;
    if (this._objPanelBg) this._objPanelBg.setFillStyle(bgColour, 0.75);
  }

  /**
   * Advance the display to the next active task (called by the cycling timer).
   */
  _cycleObjectivesPanel() {
    const active = getActiveTasks(this.registry);
    if (active.length <= 1) {
      this._updateObjectivesPanel();
      return;
    }
    this._objCycleIndex = (this._objCycleIndex + 1) % active.length;
    const task = active[this._objCycleIndex];
    if (!task) return;

    const label  = `${task.icon ?? '🔵'} ${task.title}`;
    const colour = _urgencyTextColour(task.urgency);
    this._objPanelText.setText(label);
    this._objPanelText.setStyle({ color: colour });

    const bgColour = URGENCY_COLOURS[task.urgency] ?? 0x111122;
    if (this._objPanelBg) this._objPanelBg.setFillStyle(bgColour, 0.75);
  }

  /**
   * Amber flash animation if any urgent/critical task is active.
   * Triggered by the 30-second repeat timer.
   */
  _amberFlashIfUrgent() {
    if (!this._objPanelBg || this._isReducedMotion()) return;
    const active = getActiveTasks(this.registry);
    const hasUrgent = active.some(t => t.urgency === 'urgent' || t.urgency === 'critical');
    if (!hasUrgent) return;

    if (this.tweens) {
      this.tweens.add({
        targets:  this._objPanelBg,
        alpha:    { from: 0.7, to: 1.0 },
        duration: 400,
        yoyo:     true,
        repeat:   2,
      });
    }
  }

  /**
   * Task completion animation: green checkmark for 1.5 s, then update panel.
   *
   * @param {object} task - The completed task object.
   */
  _onTaskCompleted(task) {
    if (!this._objPanelText) return;

    const prevText = this._objPanelText.text;

    this._objPanelText.setText(`✓ ${task ? task.title : 'Task complete!'}`);
    this._objPanelText.setStyle({ color: '#44ff88' });

    if (this.time) {
      this.time.delayedCall(1500, () => {
        this._updateObjectivesPanel();
        if (!this._isReducedMotion() && this.tweens && this._objPanelText) {
          this.tweens.add({
            targets:  this._objPanelText,
            y:        { from: this._objPanelText.y + 20, to: this._objPanelText.y },
            alpha:    { from: 0, to: 1 },
            duration: 300,
            ease:     'Quad.easeOut',
          });
        }
      });
    }

    // Play chime via AudioManager if available
    this._playTaskChime();
  }

  /**
   * Attempt to play the task-completed chime via AudioManager.
   * Silent if the sound system is unavailable.
   */
  _playTaskChime() {
    try {
      if (this.sound) {
        const chime = this.sound.add('task_complete');
        if (chime) chime.play();
      }
    } catch (_) {
      // Audio not required in tests
    }
  }

  /**
   * Open the expanded Objectives Panel overlay.
   * Shows story missions and daily tasks in two sections.
   */
  _openExpandedView() {
    if (this._objExpandedOpen) return;
    this._objExpandedOpen = true;

    const { width, height } = this.scale;
    const panelW = 500;
    const panelH = 400;
    const cx     = width  / 2;
    const cy     = height / 2;

    // Dim overlay
    this._objExpandedBg = this.add.rectangle(cx, cy, width, height, 0x000000, 0.6);
    this._objExpandedBg.setScrollFactor(0);
    this._objExpandedBg.setDepth(90);
    this._objExpandedBg.setInteractive();
    this._objExpandedBg.on('pointerdown', () => this._closeExpandedView());

    // Panel background
    const panelBg = this.add.rectangle(cx, cy, panelW, panelH, 0x111133, 0.95);
    panelBg.setScrollFactor(0);
    panelBg.setDepth(91);

    const active    = getActiveTasks(this.registry);
    const story     = active.filter(t => t.type === 'story');
    const daily     = active.filter(t => t.type === 'daily');

    const rows = [];
    let y = cy - panelH / 2 + 30;

    // Story Missions header
    const storyHeader = this.add.text(cx, y, '📖 Story Missions', {
      fontSize: '15px', color: '#ffd700', fontStyle: 'bold',
    });
    storyHeader.setOrigin(0.5, 0);
    storyHeader.setScrollFactor(0);
    storyHeader.setDepth(92);
    rows.push(storyHeader);
    y += 26;

    if (story.length === 0) {
      const none = this.add.text(cx, y, '— None active —', { fontSize: '13px', color: '#888888' });
      none.setOrigin(0.5, 0);
      none.setScrollFactor(0);
      none.setDepth(92);
      rows.push(none);
      y += 22;
    }

    for (const t of story) {
      y = this._addExpandedRow(rows, t, cx, y, panelW);
    }

    y += 10;

    // Daily Tasks header
    const dailyHeader = this.add.text(cx, y, '🔵 Daily Tasks', {
      fontSize: '15px', color: '#66aaff', fontStyle: 'bold',
    });
    dailyHeader.setOrigin(0.5, 0);
    dailyHeader.setScrollFactor(0);
    dailyHeader.setDepth(92);
    rows.push(dailyHeader);
    y += 26;

    if (daily.length === 0) {
      const none = this.add.text(cx, y, '— None active —', { fontSize: '13px', color: '#888888' });
      none.setOrigin(0.5, 0);
      none.setScrollFactor(0);
      none.setDepth(92);
      rows.push(none);
      y += 22;
    }

    for (const t of daily) {
      y = this._addExpandedRow(rows, t, cx, y, panelW, true);
    }

    // Store for cleanup
    rows.push(panelBg);
    rows.push(this._objExpandedBg);
    this._objExpandedContainer = rows;
  }

  /**
   * Add a single task row to the expanded view.
   *
   * @param {object[]} rows    - Array to push created objects into for cleanup.
   * @param {object}   task    - Task object.
   * @param {number}   cx      - Centre X of the panel.
   * @param {number}   y       - Current Y position.
   * @param {number}   panelW  - Panel width.
   * @param {boolean}  showSkip - Whether to show a Skip button.
   * @returns {number} New Y position after the row.
   */
  _addExpandedRow(rows, task, cx, y, panelW, showSkip = false) {
    const colour = _urgencyTextColour(task.urgency);
    const rowText = this.add.text(cx - panelW / 2 + 16, y,
      `${task.icon ?? '🔵'} ${task.title}`,
      { fontSize: '13px', color: colour });
    rowText.setScrollFactor(0);
    rowText.setDepth(92);
    rowText.setInteractive();
    rowText.on('pointerdown', () => {
      setTrackedTask(this.registry, task.id);
      this._closeExpandedView();
    });
    rows.push(rowText);
    y += 20;

    const descText = this.add.text(cx - panelW / 2 + 32, y, task.description ?? '', {
      fontSize: '11px', color: '#aaaaaa', wordWrap: { width: panelW - 80 },
    });
    descText.setScrollFactor(0);
    descText.setDepth(92);
    rows.push(descText);
    y += 20;

    return y;
  }

  /**
   * Close the expanded Objectives Panel overlay.
   */
  _closeExpandedView() {
    if (!this._objExpandedOpen) return;
    this._objExpandedOpen = false;

    if (this._objExpandedContainer) {
      for (const obj of this._objExpandedContainer) {
        if (obj && typeof obj.destroy === 'function') obj.destroy();
      }
      this._objExpandedContainer = null;
    }
    this._objExpandedBg = null;
  }

  // ---------------------------------------------------------------------------
  // HUD collapse toggle
  // ---------------------------------------------------------------------------

  /**
   * Toggle the collapsed state of the HUD.
   */
  _toggleCollapsed() {
    this._collapsed = !this._collapsed;
    this._setHudVisible(!this._collapsed);
  }

  /**
   * Set visibility of all HUD elements.
   * @param {boolean} visible
   */
  _setHudVisible(visible) {
    for (const item of this._hudGroup) {
      if (item && typeof item.setVisible === 'function') {
        item.setVisible(visible);
      }
    }
  }

  /**
   * Check if the HUD is collapsed.
   * @returns {boolean}
   */
  isCollapsed() {
    return this._collapsed;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Show a toast notification via the notification manager.
   * @param {string} message
   * @param {object} options
   */
  showNotification(message, options = {}) {
    if (this._notificationManager) {
      this._notificationManager.addNotification(message, options);
    }
  }

  /**
   * Update loop — empty since registry events handle all updates.
   */
  update(time, delta) {
    // Registry events handle HUD updates reactively
  }

  /**
   * Clean up resources on shutdown.
   */
  shutdown() {
    if (this._notificationManager) {
      this._notificationManager.clearAll();
    }
    if (this._xpBar) this._xpBar.destroy();
    if (this._healthBar) this._healthBar.destroy();
    if (this._energyBar) this._energyBar.destroy();
    if (this._objCycleTimer) this._objCycleTimer.remove(false);
    if (this._objAmberTimer) this._objAmberTimer.remove(false);
    this._closeExpandedView();
    super.shutdown();
  }
}
