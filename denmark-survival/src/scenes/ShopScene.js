/**
 * src/scenes/ShopScene.js
 * In-game shop scene for Denmark Survival.
 *
 * Responsibilities:
 *  - Display a shop's item list when the player enters a shop.
 *  - Allow the player to buy items using PLAYER_MONEY.
 *  - On Day 1: highlight Rugbrød, pasta, and milk with a gold border.
 *  - On Day 1 with pant bottles in inventory: show "Return pant bottles" button.
 *  - After any purchase on Day 1: set 'first_grocery_complete' game flag.
 *  - On first visit: grant +5 XP (first-time location bonus).
 *
 * Scene is launched via `this.scene.start('ShopScene', { shopId: 'netto' })`.
 */

import { BaseScene }     from './BaseScene.js';
import { GameButton }    from '../ui/GameButton.js';
import { getShop }       from '../systems/ShopSystem.js';
import { grantXP }       from '../systems/XPEngine.js';
import { addItem }       from '../systems/InventoryManager.js';
import { checkCompletionConditions } from '../systems/QuestEngine.js';
import * as RK           from '../constants/RegistryKeys.js';

// ─────────────────────────────────────────────────────────────────────────────
// Day 1 highlighted item IDs — these receive a gold border in the item list.
// ─────────────────────────────────────────────────────────────────────────────

/** Item IDs that display a gold highlight on Day 1. */
export const DAY1_HIGHLIGHTED_ITEMS = ['rugbrod', 'pasta', 'milk'];

/** Item ID that displays a "Recommended" label on Day 1. */
export const DAY1_RECOMMENDED_ITEM  = 'vitamin_d';

// ─────────────────────────────────────────────────────────────────────────────
// Pure helpers — exported for unit testing without Phaser
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return true when the given registry represents an active Day 1 session.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {boolean}
 */
export function isDay1Session(registry) {
  return (
    registry.get(RK.CURRENT_DAY)        === 1 &&
    !registry.get(RK.TUTORIAL_COMPLETED)
  );
}

/**
 * Build an annotated shop item list for display.
 * On Day 1 each item entry is tagged with `highlight: true` or
 * `recommended: true` where applicable.
 *
 * @param {Array<{itemId:string, price:number}>} shopItems - Raw shop item list.
 * @param {boolean} isDay1 - Whether to apply Day 1 annotations.
 * @returns {Array<{itemId:string, price:number, highlight:boolean, recommended:boolean}>}
 */
export function buildShopItemList(shopItems, isDay1) {
  return shopItems.map(item => ({
    ...item,
    highlight:   isDay1 && DAY1_HIGHLIGHTED_ITEMS.includes(item.itemId),
    recommended: isDay1 && item.itemId === DAY1_RECOMMENDED_ITEM,
  }));
}

/**
 * Return true when the player should see the "Return pant bottles" button.
 * Shown on Day 1 only when the player holds at least one pant bottle.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {boolean}
 */
export function shouldShowPantReturnButton(registry) {
  if (!isDay1Session(registry)) return false;
  return (registry.get(RK.PANT_BOTTLES) ?? 0) > 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// ShopScene
// ─────────────────────────────────────────────────────────────────────────────

export class ShopScene extends BaseScene {
  constructor() {
    super({ key: 'ShopScene' });

    /** Shop ID passed from the calling scene. */
    this._shopId = null;

    /** Loaded shop definition. */
    this._shop = null;

    /** Annotated item list for this session. */
    this._itemList = [];

    /** Active GameButtons. */
    this._buttons = {};
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(data) {
    super.init(data);
    this._shopId = data.shopId ?? 'netto';
  }

  create() {
    this.fadeInCamera();

    const isDay1 = isDay1Session(this.registry);

    // ── Load shop data ────────────────────────────────────────────────────────
    this._shop = getShop(this._shopId) ?? {
      id:    this._shopId,
      name:  this._shopId,
      items: [],
    };

    this._itemList = buildShopItemList(this._shop.items ?? [], isDay1);

    // ── First visit XP bonus ──────────────────────────────────────────────────
    this._grantFirstVisitXP();

    // ── Layout ────────────────────────────────────────────────────────────────
    const { width, height } = this.scale;
    const cx = width / 2;

    this.add.rectangle(cx, height / 2, width, height, 0x1a1a2e).setDepth(0);

    this._renderHeader(cx, 50);
    this._renderPantReturnButton(cx, 110);
    this._renderItemList(cx, 150);
    this._renderActions(cx, height - 60);
  }

  shutdown() {
    Object.values(this._buttons).forEach(btn => btn.destroy?.());
    this._buttons = {};
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // Section renderers
  // ---------------------------------------------------------------------------

  /** Shop header with name and description. */
  _renderHeader(cx, y) {
    const name = this._shop?.name ?? 'Shop';
    const desc = this._shop?.description ?? '';

    this.add.text(cx, y, name, {
      fontFamily: 'Georgia, serif',
      fontSize:   '32px',
      color:      '#e8d5b7',
    }).setOrigin(0.5).setDepth(2);

    if (desc) {
      this.add.text(cx, y + 38, desc, {
        fontFamily: 'Arial',
        fontSize:   '14px',
        color:      '#a0bbd0',
      }).setOrigin(0.5).setDepth(2);
    }
  }

  /** "Return pant bottles" button, shown only on Day 1 with bottles in bag. */
  _renderPantReturnButton(cx, y) {
    if (!shouldShowPantReturnButton(this.registry)) return;

    this._buttons.pantReturn = new GameButton(
      this, cx, y, '♻ Return pant bottles', () => this._onReturnPantBottles(),
      { width: 260, height: 38, depth: 4 },
    );
  }

  /** Scrollable list of shop items with Day 1 highlights. */
  _renderItemList(cx, startY) {
    const player = this.registry.get(RK.PLAYER_MONEY) ?? 0;

    this._itemList.forEach((item, idx) => {
      const y         = startY + idx * 44;
      const textColor = item.highlight   ? '#ffd700'  : '#e8d5b7';
      const bgColor   = item.highlight   ? 0x3a3000  : 0x1e2a3a;

      this.add.rectangle(cx, y, 560, 38, bgColor).setDepth(1);

      const label = item.recommended
        ? `${item.itemId}  💡 Recommended`
        : item.itemId;

      this.add.text(cx - 240, y, label, {
        fontFamily: 'Arial',
        fontSize:   '14px',
        color:      textColor,
      }).setOrigin(0, 0.5).setDepth(2);

      this.add.text(cx + 160, y, `${item.price} kr`, {
        fontFamily: 'Arial',
        fontSize:   '14px',
        color:      '#a0bbd0',
      }).setOrigin(0, 0.5).setDepth(2);

      const canAfford = player >= item.price;
      this._buttons[`buy_${item.itemId}_${idx}`] = new GameButton(
        this, cx + 240, y, 'Buy', () => this._onBuy(item),
        { width: 72, height: 32, depth: 4, disabled: !canAfford },
      );
    });
  }

  /** Back button. */
  _renderActions(cx, y) {
    this._buttons.back = new GameButton(
      this, cx, y, '← Back', () => this._onBack(),
      { width: 160, height: 48, depth: 4 },
    );
  }

  // ---------------------------------------------------------------------------
  // Action handlers
  // ---------------------------------------------------------------------------

  /**
   * Buy a single item from the shop.
   * Deducts price from PLAYER_MONEY, adds item to inventory, and on Day 1
   * sets the 'first_grocery_complete' flag and triggers quest completion via
   * QuestEngine.checkCompletionConditions.
   *
   * @param {{itemId:string, price:number}} item
   */
  _onBuy(item) {
    const money = this.registry.get(RK.PLAYER_MONEY) ?? 0;
    if (money < item.price) return;

    this.registry.set(RK.PLAYER_MONEY, money - item.price);

    try {
      addItem(this.registry, item.itemId, 1);
    } catch (_) {
      // Graceful degradation when InventoryManager is unavailable
    }

    // Day 1: set grocery completion flag and trigger quest auto-complete.
    if (isDay1Session(this.registry)) {
      const flags = this.registry.get(RK.GAME_FLAGS) ?? {};
      if (!flags['first_grocery_complete']) {
        flags['first_grocery_complete'] = true;
        this.registry.set(RK.GAME_FLAGS, flags);
        // Trigger QuestEngine to auto-complete story_grocery_run via flag condition.
        // QuestEngine.completeTask grants the task's xpReward (15 XP) with the
        // task title as source, so no additional grantXP call is needed here.
        try {
          checkCompletionConditions(this.registry, 'flag:set', {
            key:   'first_grocery_complete',
            value: true,
          });
        } catch (_) {
          // Graceful degradation
        }
      }
    }

    // Refresh the scene to update affordability states
    this.scene.restart({ shopId: this._shopId });
  }

  /** Return pant bottles for DKK. */
  _onReturnPantBottles() {
    const bottles = this.registry.get(RK.PANT_BOTTLES) ?? 0;
    if (bottles <= 0) return;

    // 1-3 DKK per bottle; award minimum 1 DKK per bottle for simplicity
    const refund = bottles * 2;
    const money  = this.registry.get(RK.PLAYER_MONEY) ?? 0;
    this.registry.set(RK.PLAYER_MONEY, money + refund);
    this.registry.set(RK.PANT_BOTTLES, 0);

    try {
      grantXP(this.registry, bottles, 'Returned pant bottles', 'Story');
    } catch (_) {
      // Graceful degradation
    }

    this.scene.restart({ shopId: this._shopId });
  }

  /** Return to the previous scene (GameScene). */
  _onBack() {
    this.scene.stop();
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Grant +5 XP the first time the player visits this shop location.
   * Uses VISITED_LOCATIONS registry key to track first-time visits.
   */
  _grantFirstVisitXP() {
    const visited = this.registry.get(RK.VISITED_LOCATIONS) ?? [];
    if (visited.includes(this._shopId)) return;

    visited.push(this._shopId);
    this.registry.set(RK.VISITED_LOCATIONS, visited);

    try {
      grantXP(this.registry, 5, `Visited ${this._shop?.name ?? this._shopId} for the first time`, 'Exploration');
    } catch (_) {
      // Graceful degradation
    }
  }
}
