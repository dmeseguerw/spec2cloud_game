/**
 * src/scenes/InventoryScene.js
 * Inventory overlay scene — displays the player's items in a scrollable
 * 4-column grid with category filter tabs and an item detail panel.
 *
 * Layout (1280×720):
 *  ┌────────────────────────────────────────────────┐
 *  │ [Tab: All | Food | Health | Transport | …]     │
 *  │ ┌─────────────────────────┐ ┌────────────────┐ │
 *  │ │  Item grid (4 columns,  │ │  Detail panel  │ │
 *  │ │  scrollable)            │ │  icon / name / │ │
 *  │ │  icon qty freshness     │ │  description   │ │
 *  │ └─────────────────────────┘ │  [Use] [Drop]  │ │
 *  │                              └────────────────┘ │
 *  └────────────────────────────────────────────────┘
 */

import { BaseScene } from './BaseScene.js';
import {
  getItemsByCategory,
  getItemData,
  getFreshnessStatus,
  useItem,
  removeItem,
  getInventoryCount,
  getAllItems,
  returnPant,
} from '../systems/InventoryManager.js';
import * as RK from '../constants/RegistryKeys.js';
import * as Events from '../constants/Events.js';

// Category tabs in display order
const CATEGORIES = [
  { key: 'all',         label: 'All'          },
  { key: 'food',        label: 'Food'         },
  { key: 'health',      label: 'Health'       },
  { key: 'transport',   label: 'Transport'    },
  { key: 'document',    label: 'Documents'    },
  { key: 'collectible', label: 'Collectibles' },
];

const GRID_COLS      = 4;
const CELL_SIZE      = 90;
const CELL_PADDING   = 10;
const GRID_X_OFFSET  = 80;   // left margin of grid
const GRID_Y_OFFSET  = 160;  // top of grid (below tabs)
const PANEL_X        = 950;  // x of detail panel
const PANEL_W        = 280;
const PANEL_H        = 420;

export class InventoryScene extends BaseScene {
  constructor() {
    super({ key: 'InventoryScene' });

    /** Currently selected category filter key. */
    this._activeCategory = 'all';

    /** Tab text/button objects. */
    this._tabs = [];

    /** Grid cell display objects (cleared on refresh). */
    this._gridCells = [];

    /** Currently selected inventory entry (or null). */
    this._selectedEntry = null;

    /** Detail panel game objects. */
    this._detailPanel = null;

    /** Scroll offset (rows). */
    this._scrollOffset = 0;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  init(data) {
    super.init(data);
    this._activeCategory = 'all';
    this._selectedEntry  = null;
    this._scrollOffset   = 0;
  }

  create() {
    const { width, height } = this.scale;

    // Overlay background
    if (this._isOverlay) {
      this.createOverlayBackground(0.8);
    } else {
      this.add.rectangle(width / 2, height / 2, width, height, 0x0a1520, 1).setDepth(0);
    }

    // Title
    this.add.text(width / 2, 35, 'Inventory', {
      fontFamily: 'Georgia, serif',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(1);

    // Item count (positioned to the left of the close button)
    this._countText = this.add.text(width - 60, 35, '', {
      fontFamily: 'Arial',
      fontSize:   '16px',
      color:      '#aaaaaa',
    }).setOrigin(1, 0.5).setDepth(1);

    // Close button
    this.add.text(width - 20, 35, '✕', {
      fontFamily: 'Arial',
      fontSize:   '24px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2).setInteractive()
      .on('pointerup', () => this._onClose());

    // Category tabs
    this._createTabs();

    // Detail panel
    this._createDetailPanel();

    // Render the grid for the initial category
    this._refreshGrid();

    // Listen for inventory changes so we can refresh without reopening
    this.trackEvent(
      this.registry.events,
      'changedata-' + RK.INVENTORY,
      () => this._refreshGrid(),
    );
  }

  shutdown() {
    this._gridCells.forEach(o => { if (o && o.destroy) o.destroy(); });
    this._gridCells = [];
    super.shutdown();
  }

  // ─── Category tabs ─────────────────────────────────────────────────────────

  _createTabs() {
    const startX = GRID_X_OFFSET;
    const y      = 90;
    const tabW   = 115;
    const tabH   = 36;
    const gap    = 8;

    CATEGORIES.forEach((cat, i) => {
      const x = startX + i * (tabW + gap) + tabW / 2;

      const bg = this.add.rectangle(x, y, tabW, tabH, 0x1a2a3a, 1)
        .setDepth(1).setInteractive();

      const label = this.add.text(x, y, cat.label, {
        fontFamily: 'Arial',
        fontSize:   '14px',
        color:      '#cccccc',
      }).setOrigin(0.5).setDepth(2);

      // Ensure label was created successfully
      if (!label) {
        console.warn(`Failed to create label for category ${cat.key}`);
        return;
      }

      bg.on('pointerup', () => this._selectCategory(cat.key));
      bg.on('pointerover', () => {
        if (cat.key !== this._activeCategory) bg.setFillStyle(0x253545, 1);
      });
      bg.on('pointerout', () => {
        if (cat.key !== this._activeCategory) bg.setFillStyle(0x1a2a3a, 1);
      });

      this._tabs.push({ key: cat.key, bg, label });
    });

    this._updateTabHighlight();
  }

  _selectCategory(catKey) {
    this._activeCategory  = catKey;
    this._selectedEntry   = null;
    this._scrollOffset    = 0;
    this._updateTabHighlight();
    this._refreshGrid();
    this._updateDetailPanel(null);
  }

  _updateTabHighlight() {
    for (const tab of this._tabs) {
      if (!tab || !tab.bg || !tab.label) continue;  // Safety check
      const active = tab.key === this._activeCategory;
      tab.bg.setFillStyle(active ? 0x2a4a6a : 0x1a2a3a, 1);
      tab.label.setColor(active ? '#e8d5b7' : '#cccccc');
    }
  }

  // ─── Grid ──────────────────────────────────────────────────────────────────

  _refreshGrid() {
    // Destroy previous cells
    this._gridCells.forEach(o => { if (o && o.destroy) o.destroy(); });
    this._gridCells = [];

    const currentDay = this.registry.get(RK.CURRENT_DAY) ?? 1;
    const entries    = getItemsByCategory(this.registry, this._activeCategory);

    // For Documents: also show placeholders for unobtained items
    let displayItems = entries;
    if (this._activeCategory === 'document') {
      displayItems = this._buildDocumentGrid(entries);
    }

    // Update item count
    const total = getInventoryCount(this.registry);
    if (this._countText) {
      this._countText.setText(`${total} item${total !== 1 ? 's' : ''}`);
    }

    displayItems.forEach((entry, idx) => {
      const col   = idx % GRID_COLS;
      const row   = Math.floor(idx / GRID_COLS);
      const cellX = GRID_X_OFFSET + col * (CELL_SIZE + CELL_PADDING) + CELL_SIZE / 2;
      const cellY = GRID_Y_OFFSET + row * (CELL_SIZE + CELL_PADDING) + CELL_SIZE / 2;

      this._drawCell(entry, cellX, cellY, currentDay);
    });
  }

  _drawCell(entry, cx, cy, currentDay) {
    const isPlaceholder = entry._placeholder === true;
    const data          = isPlaceholder ? entry._data : getItemData(entry.itemId);

    if (!data) return;

    // Cell background
    const bgColor  = isPlaceholder ? 0x1a1a2a : 0x1a2a3a;
    const bgAlpha  = isPlaceholder ? 0.5 : 1;
    const cellBg   = this.add.rectangle(cx, cy, CELL_SIZE - 4, CELL_SIZE - 4, bgColor, bgAlpha)
      .setDepth(1).setInteractive();
    this._gridCells.push(cellBg);

    // Icon
    const iconAlpha = isPlaceholder ? 0.3 : 1;
    const icon = this.add.text(cx, cy - 12, data.icon, {
      fontSize: '28px',
    }).setOrigin(0.5).setDepth(2).setAlpha(iconAlpha);
    this._gridCells.push(icon);

    // Name (truncated)
    const nameLabel = this.add.text(cx, cy + 18, _truncate(data.name, 10), {
      fontFamily: 'Arial',
      fontSize:   '11px',
      color:      isPlaceholder ? '#666666' : '#cccccc',
    }).setOrigin(0.5).setDepth(2);
    this._gridCells.push(nameLabel);

    if (!isPlaceholder) {
      // Quantity badge (top-right)
      if (entry.quantity > 1) {
        const qtyBadge = this.add.text(cx + 30, cy - 30, `×${entry.quantity}`, {
          fontFamily: 'Arial',
          fontSize:   '12px',
          color:      '#ffffff',
        }).setOrigin(1, 0).setDepth(3);
        this._gridCells.push(qtyBadge);
      }

      // Freshness indicator (food only)
      const freshness = getFreshnessStatus(entry, currentDay);
      if (freshness) {
        const colorHex = freshness.color === 'green'  ? '#44cc44'
                       : freshness.color === 'yellow' ? '#cccc44'
                       :                                '#cc4444';
        const dot = this.add.text(cx + 28, cy - 30, '●', {
          fontSize: '10px',
          color:    colorHex,
        }).setOrigin(0.5).setDepth(3);
        this._gridCells.push(dot);
      }

      // Click handler — select cell
      cellBg.on('pointerup', () => {
        this._selectedEntry = entry;
        this._updateDetailPanel(entry);
      });
      cellBg.on('pointerover', () => cellBg.setFillStyle(0x2a4a6a, 1));
      cellBg.on('pointerout',  () => cellBg.setFillStyle(0x1a2a3a, 1));
    }
  }

  /**
   * Build a full document grid including greyed-out placeholders for
   * documents not yet in the inventory.
   */
  _buildDocumentGrid(obtained) {
    const allDocuments = getAllItems().filter(i => i.category === 'document');
    const obtainedIds  = new Set(obtained.map(e => e.itemId));
    const result       = [];

    // Show obtained items first, then placeholders for the rest
    for (const item of allDocuments) {
      if (obtainedIds.has(item.id)) {
        result.push(obtained.find(e => e.itemId === item.id));
      } else {
        result.push({ _placeholder: true, _data: item, itemId: item.id, quantity: 0, acquiredDay: 0 });
      }
    }
    return result;
  }

  // ─── Detail panel ──────────────────────────────────────────────────────────

  _createDetailPanel() {
    const { height } = this.scale;
    const panelY = height / 2;

    const bg = this.add.rectangle(PANEL_X, panelY, PANEL_W, PANEL_H, 0x0d1a26, 0.97)
      .setDepth(1);

    const icon = this.add.text(PANEL_X, panelY - 150, '', {
      fontSize: '48px',
    }).setOrigin(0.5).setDepth(2);

    const name = this.add.text(PANEL_X, panelY - 90, '', {
      fontFamily: 'Georgia, serif',
      fontSize:   '18px',
      color:      '#e8d5b7',
      wordWrap:   { width: PANEL_W - 20 },
      align:      'center',
    }).setOrigin(0.5).setDepth(2);

    const desc = this.add.text(PANEL_X, panelY - 30, '', {
      fontFamily: 'Arial',
      fontSize:   '13px',
      color:      '#aaaaaa',
      wordWrap:   { width: PANEL_W - 20 },
      align:      'center',
    }).setOrigin(0.5).setDepth(2);

    const qty = this.add.text(PANEL_X, panelY + 50, '', {
      fontFamily: 'Arial',
      fontSize:   '15px',
      color:      '#cccccc',
    }).setOrigin(0.5).setDepth(2);

    const freshness = this.add.text(PANEL_X, panelY + 75, '', {
      fontFamily: 'Arial',
      fontSize:   '13px',
      color:      '#aaaaaa',
    }).setOrigin(0.5).setDepth(2);

    // Use button
    const useBtn = this.add.text(PANEL_X - 55, panelY + 130, '[ Use ]', {
      fontFamily: 'Arial',
      fontSize:   '16px',
      color:      '#44cc44',
    }).setOrigin(0.5).setDepth(2).setInteractive()
      .on('pointerup', () => this._onUseItem())
      .on('pointerover', () => useBtn.setColor('#88ff88'))
      .on('pointerout',  () => useBtn.setColor('#44cc44'));

    // Drop button
    const dropBtn = this.add.text(PANEL_X + 55, panelY + 130, '[ Drop ]', {
      fontFamily: 'Arial',
      fontSize:   '16px',
      color:      '#cc4444',
    }).setOrigin(0.5).setDepth(2).setInteractive()
      .on('pointerup', () => this._onDropItem())
      .on('pointerover', () => dropBtn.setColor('#ff8888'))
      .on('pointerout',  () => dropBtn.setColor('#cc4444'));

    // Pant return button (shown only when pant bottles are available)
    const pantBtn = this.add.text(PANEL_X, panelY + 165, '[ Return Pant ]', {
      fontFamily: 'Arial',
      fontSize:   '15px',
      color:      '#ccaa44',
    }).setOrigin(0.5).setDepth(2).setInteractive().setVisible(false)
      .on('pointerup', () => this._onReturnPant())
      .on('pointerover', () => pantBtn.setColor('#ffcc88'))
      .on('pointerout',  () => pantBtn.setColor('#ccaa44'));

    // Placeholder message
    const emptyMsg = this.add.text(PANEL_X, panelY, 'Select an item\nto see details', {
      fontFamily: 'Arial',
      fontSize:   '16px',
      color:      '#666666',
      align:      'center',
    }).setOrigin(0.5).setDepth(2);

    this._detailPanel = {
      bg, icon, name, desc, qty, freshness,
      useBtn, dropBtn, pantBtn, emptyMsg,
    };

    this._updateDetailPanel(null);
  }

  _updateDetailPanel(entry) {
    const p          = this._detailPanel;
    if (!p) return;

    const currentDay = this.registry.get(RK.CURRENT_DAY) ?? 1;

    if (!entry) {
      p.icon.setText('');
      p.name.setText('');
      p.desc.setText('');
      p.qty.setText('');
      p.freshness.setText('');
      p.useBtn.setVisible(false);
      p.dropBtn.setVisible(false);
      p.emptyMsg.setVisible(true);

      // Show pant return button if pant bottles are available
      const pantBottles = this.registry.get(RK.PANT_BOTTLES) ?? [];
      p.pantBtn.setVisible(
        Array.isArray(pantBottles) && pantBottles.length > 0,
      );
      return;
    }

    const data = getItemData(entry.itemId);
    if (!data) return;

    p.emptyMsg.setVisible(false);
    p.icon.setText(data.icon);
    p.name.setText(data.name);
    p.desc.setText(data.description);
    p.qty.setText(`Quantity: ${entry.quantity}`);

    // Freshness
    const fresh = getFreshnessStatus(entry, currentDay);
    if (fresh) {
      const colorHex = fresh.color === 'green'  ? '#44cc44'
                     : fresh.color === 'yellow' ? '#cccc44'
                     :                            '#cc4444';
      p.freshness.setText(`Spoils in ${fresh.daysLeft} day${fresh.daysLeft !== 1 ? 's' : ''}`);
      p.freshness.setColor(colorHex);
    } else {
      p.freshness.setText(data.spoilsAfter === null || data.spoilsAfter === undefined
        ? 'Non-perishable' : '');
    }

    // Use/Drop visibility
    p.useBtn.setVisible(data.usable);
    p.dropBtn.setVisible(true);

    // Pant return
    const pantBottles = this.registry.get(RK.PANT_BOTTLES) ?? [];
    p.pantBtn.setVisible(
      Array.isArray(pantBottles) && pantBottles.length > 0,
    );
  }

  // ─── Actions ───────────────────────────────────────────────────────────────

  _onUseItem() {
    if (!this._selectedEntry) return;
    const result = useItem(this.registry, this._selectedEntry.itemId);
    if (result.success) {
      // Check if item was last unit
      const inv = this.registry.get(RK.INVENTORY) ?? [];
      const stillExists = inv.some(e => e.itemId === this._selectedEntry.itemId);
      if (!stillExists) this._selectedEntry = null;
      this._refreshGrid();
      this._updateDetailPanel(this._selectedEntry);
    }
  }

  _onDropItem() {
    if (!this._selectedEntry) return;
    removeItem(this.registry, this._selectedEntry.itemId, 1);
    const inv = this.registry.get(RK.INVENTORY) ?? [];
    const stillExists = inv.some(e => e.itemId === this._selectedEntry.itemId);
    if (!stillExists) this._selectedEntry = null;
    this._refreshGrid();
    this._updateDetailPanel(this._selectedEntry);
  }

  _onReturnPant() {
    returnPant(this.registry);
    this._updateDetailPanel(this._selectedEntry);
  }

  _onClose() {
    if (this._isOverlay) {
      this.closeOverlay();
    } else {
      this.scene.start('GameScene');
    }
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function _truncate(str, maxLen) {
  return str.length > maxLen ? str.slice(0, maxLen - 1) + '…' : str;
}

