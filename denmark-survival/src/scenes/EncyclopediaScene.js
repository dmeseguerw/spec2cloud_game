/**
 * src/scenes/EncyclopediaScene.js
 * Full-screen encyclopedia/codex overlay — a journal of Danish cultural knowledge.
 *
 * Provides:
 *  - 5 category tabs (Culture, Language, Places, Activities, Tips)
 *  - Left panel: scrollable entry list (unlocked vs locked)
 *  - Right panel: selected entry detail view
 *  - Category progress counters and overall completion percentage
 *  - Keyboard navigation (arrows, Enter, Escape)
 */

import { BaseScene } from './BaseScene.js';
import { GameButton } from '../ui/GameButton.js';
import {
  ENCYCLOPEDIA_DATA,
  CATEGORIES,
  CATEGORY_META,
  getEntriesByCategory,
  getEntryById,
} from '../data/encyclopedia.js';
import {
  isUnlocked,
  getCategoryProgress,
  getOverallProgress,
  isCategoryComplete,
} from '../systems/EncyclopediaManager.js';

/** Panel layout constants. */
const PANEL = {
  TAB_Y: 80,
  TAB_HEIGHT: 44,
  LIST_X: 40,
  LIST_Y: 140,
  LIST_WIDTH: 340,
  DETAIL_X: 420,
  DETAIL_Y: 140,
  DETAIL_WIDTH: 820,
  ENTRY_HEIGHT: 36,
  MAX_VISIBLE_ENTRIES: 14,
};

export class EncyclopediaScene extends BaseScene {
  constructor() {
    super({ key: 'EncyclopediaScene' });

    this._activeCategory = 'culture';
    this._selectedEntryId = null;
    this._scrollOffset = 0;
    this._tabButtons = {};
    this._entryTexts = [];
    this._detailObjects = [];
    this._progressText = null;
    this._overallText = null;
    this._closeBtn = null;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  create() {
    if (this._isOverlay) {
      this.createOverlayBackground(0.85);
    }

    const { width, height } = this.scale;

    // Title
    this.add.text(width / 2, 30, '📖 Encyclopedia', {
      fontFamily: 'Georgia, serif',
      fontSize: '32px',
      color: '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    this._createTabs(width);
    this._createCloseButton(width, height);
    this._createOverallProgress(width, height);

    // Render the default category
    this._renderCategory(this._activeCategory);

    // Keyboard navigation
    this._setupKeyboard();
  }

  shutdown() {
    this._clearEntryList();
    this._clearDetail();
    Object.values(this._tabButtons).forEach(b => b.destroy());
    this._tabButtons = {};
    if (this._closeBtn) this._closeBtn.destroy();
    this._closeBtn = null;
    this._selectedEntryId = null;
    this._scrollOffset = 0;
    this._activeCategory = 'culture';
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Tabs
  // ---------------------------------------------------------------------------

  _createTabs(width) {
    const tabWidth = 200;
    const totalWidth = CATEGORIES.length * tabWidth;
    const startX = (width - totalWidth) / 2 + tabWidth / 2;

    CATEGORIES.forEach((cat, i) => {
      const meta = CATEGORY_META[cat];
      const x = startX + i * tabWidth;
      const btn = new GameButton(
        this, x, PANEL.TAB_Y, `${meta.icon} ${meta.label}`,
        () => this._switchTab(cat),
        { width: tabWidth - 10, height: PANEL.TAB_HEIGHT, depth: 3 }
      );
      this._tabButtons[cat] = btn;
    });
  }

  _switchTab(category) {
    this._activeCategory = category;
    this._selectedEntryId = null;
    this._scrollOffset = 0;
    this._renderCategory(category);
  }

  // ---------------------------------------------------------------------------
  // Entry list (left panel)
  // ---------------------------------------------------------------------------

  _renderCategory(category) {
    this._clearEntryList();
    this._clearDetail();

    const entries = getEntriesByCategory(category);
    const visible = entries.slice(this._scrollOffset, this._scrollOffset + PANEL.MAX_VISIBLE_ENTRIES);
    const progress = getCategoryProgress(this.registry, category);
    const complete = isCategoryComplete(this.registry, category);

    // Progress label
    const meta = CATEGORY_META[category];
    const completeLabel = complete ? ' ⭐' : '';
    this._progressText = this.add.text(
      PANEL.LIST_X, PANEL.LIST_Y - 20,
      `${meta.icon} ${meta.label}: ${progress.unlocked} / ${progress.total} discovered${completeLabel}`,
      { fontSize: '16px', color: '#c0c0c0', fontFamily: 'Arial' }
    ).setDepth(2);
    this._entryTexts.push(this._progressText);

    // Entry rows
    visible.forEach((entry, i) => {
      const y = PANEL.LIST_Y + 10 + i * PANEL.ENTRY_HEIGHT;
      const unlocked = isUnlocked(this.registry, entry.id);
      const label = unlocked ? entry.title : '??? Locked';
      const color = unlocked ? '#e8d5b7' : '#666666';

      const text = this.add.text(PANEL.LIST_X + 10, y, label, {
        fontSize: '15px',
        color,
        fontFamily: 'Arial',
      }).setDepth(2);

      if (unlocked) {
        text.setInteractive({ useHandCursor: true });
        text.on('pointerover', () => text.setColor('#ffd700'));
        text.on('pointerout', () => {
          text.setColor(this._selectedEntryId === entry.id ? '#ffd700' : '#e8d5b7');
        });
        text.on('pointerdown', () => this._selectEntry(entry.id));
      }

      this._entryTexts.push(text);
    });

    // Scroll hints
    if (this._scrollOffset > 0) {
      const upHint = this.add.text(PANEL.LIST_X + PANEL.LIST_WIDTH - 30, PANEL.LIST_Y - 20, '▲', {
        fontSize: '18px', color: '#e8d5b7',
      }).setDepth(2).setInteractive({ useHandCursor: true });
      upHint.on('pointerdown', () => this._scroll(-1));
      this._entryTexts.push(upHint);
    }

    if (this._scrollOffset + PANEL.MAX_VISIBLE_ENTRIES < entries.length) {
      const downY = PANEL.LIST_Y + 10 + PANEL.MAX_VISIBLE_ENTRIES * PANEL.ENTRY_HEIGHT;
      const downHint = this.add.text(PANEL.LIST_X + PANEL.LIST_WIDTH - 30, downY, '▼', {
        fontSize: '18px', color: '#e8d5b7',
      }).setDepth(2).setInteractive({ useHandCursor: true });
      downHint.on('pointerdown', () => this._scroll(1));
      this._entryTexts.push(downHint);
    }

    // Update overall progress
    this._updateOverallProgress();
  }

  _scroll(direction) {
    const entries = getEntriesByCategory(this._activeCategory);
    const maxOffset = Math.max(0, entries.length - PANEL.MAX_VISIBLE_ENTRIES);
    this._scrollOffset = Math.max(0, Math.min(maxOffset, this._scrollOffset + direction));
    this._renderCategory(this._activeCategory);
  }

  _clearEntryList() {
    this._entryTexts.forEach(t => t.destroy());
    this._entryTexts = [];
  }

  // ---------------------------------------------------------------------------
  // Entry detail (right panel)
  // ---------------------------------------------------------------------------

  _selectEntry(entryId) {
    this._selectedEntryId = entryId;
    this._clearDetail();

    const entry = getEntryById(entryId);
    if (!entry) return;

    let y = PANEL.DETAIL_Y;
    const x = PANEL.DETAIL_X + 20;
    const maxWidth = PANEL.DETAIL_WIDTH - 60;

    // Title
    const title = this.add.text(x, y, entry.title, {
      fontSize: '24px',
      fontFamily: 'Georgia, serif',
      color: '#ffd700',
      fontStyle: 'bold',
      wordWrap: { width: maxWidth },
    }).setDepth(2);
    this._detailObjects.push(title);
    y += title.height + 16;

    // Category badge
    const meta = CATEGORY_META[entry.category];
    const catBadge = this.add.text(x, y, `${meta.icon} ${meta.label}`, {
      fontSize: '14px',
      color: '#aaaaaa',
      fontFamily: 'Arial',
    }).setDepth(2);
    this._detailObjects.push(catBadge);
    y += 28;

    // Body text
    const body = this.add.text(x, y, entry.body, {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#d4c5a9',
      wordWrap: { width: maxWidth },
      lineSpacing: 6,
    }).setDepth(2);
    this._detailObjects.push(body);
    y += body.height + 20;

    // Source
    const source = this.add.text(x, y, entry.sourceText, {
      fontSize: '13px',
      fontFamily: 'Arial',
      fontStyle: 'italic',
      color: '#888888',
      wordWrap: { width: maxWidth },
    }).setDepth(2);
    this._detailObjects.push(source);
    y += source.height + 20;

    // Related entries
    if (entry.relatedEntries && entry.relatedEntries.length > 0) {
      const relLabel = this.add.text(x, y, 'Related:', {
        fontSize: '14px',
        color: '#aaaaaa',
        fontFamily: 'Arial',
      }).setDepth(2);
      this._detailObjects.push(relLabel);
      y += 22;

      entry.relatedEntries.forEach(relId => {
        const relEntry = getEntryById(relId);
        if (!relEntry) return;

        const unlocked = isUnlocked(this.registry, relId);
        const relText = this.add.text(x + 10, y, unlocked ? `→ ${relEntry.title}` : '→ ???', {
          fontSize: '14px',
          color: unlocked ? '#6699cc' : '#555555',
          fontFamily: 'Arial',
        }).setDepth(2);

        if (unlocked) {
          relText.setInteractive({ useHandCursor: true });
          relText.on('pointerdown', () => {
            // Switch to the related entry's category if different
            if (relEntry.category !== this._activeCategory) {
              this._activeCategory = relEntry.category;
              this._scrollOffset = 0;
              this._renderCategory(this._activeCategory);
            }
            this._selectEntry(relId);
          });
        }

        this._detailObjects.push(relText);
        y += 20;
      });
    }

    // Re-render list to highlight selected entry
    this._renderCategory(this._activeCategory);
  }

  _clearDetail() {
    this._detailObjects.forEach(obj => obj.destroy());
    this._detailObjects = [];
  }

  // ---------------------------------------------------------------------------
  // Overall progress
  // ---------------------------------------------------------------------------

  _createOverallProgress(width, height) {
    this._overallText = this.add.text(width / 2, height - 30, '', {
      fontSize: '16px',
      fontFamily: 'Arial',
      color: '#c0c0c0',
    }).setOrigin(0.5).setDepth(2);
    this._updateOverallProgress();
  }

  _updateOverallProgress() {
    if (!this._overallText) return;
    const pct = getOverallProgress(this.registry);
    this._overallText.setText(`Total Discovery: ${pct}%`);
  }

  // ---------------------------------------------------------------------------
  // Close button
  // ---------------------------------------------------------------------------

  _createCloseButton(width, height) {
    this._closeBtn = new GameButton(
      this, width - 80, 30, 'Close', () => this.closeOverlay(),
      { width: 100, height: 36, depth: 3 }
    );
  }

  // ---------------------------------------------------------------------------
  // Keyboard navigation
  // ---------------------------------------------------------------------------

  _setupKeyboard() {
    if (!this.input || !this.input.keyboard) return;

    const esc = this.input.keyboard.addKey('ESC');
    esc.on('down', () => this.closeOverlay());

    const left = this.input.keyboard.addKey('LEFT');
    left.on('down', () => this._navTab(-1));

    const right = this.input.keyboard.addKey('RIGHT');
    right.on('down', () => this._navTab(1));

    const up = this.input.keyboard.addKey('UP');
    up.on('down', () => this._scroll(-1));

    const down = this.input.keyboard.addKey('DOWN');
    down.on('down', () => this._scroll(1));
  }

  _navTab(direction) {
    const idx = CATEGORIES.indexOf(this._activeCategory);
    const next = (idx + direction + CATEGORIES.length) % CATEGORIES.length;
    this._switchTab(CATEGORIES[next]);
  }
}
