/**
 * src/systems/ShopSystem.js
 * Handles shopping at in-game stores: browsing, cart management, checkout,
 * sale generation, and store hours enforcement.
 *
 * Shop data is loaded from src/data/shops.js.
 * Cart state is stored in the registry under SHOP_CART.
 * Sale state is stored in the registry under SHOP_SALES.
 *
 * Store hours:
 *   Weekday (Mon–Fri):  7:00–22:00
 *   Weekend (Sat–Sun):  8:00–20:00
 * (Individual shops override these in their openHours configuration.)
 *
 * Sale system:
 *   Each week a random set of items across shops receive 20–40% discounts.
 *   Sales are regenerated every 7 in-game days.
 *
 * Emits: SHOP_PURCHASE, MONEY_CHANGED, ITEM_ADDED
 */

import SHOPS from '../data/shops.js';
import * as RK from '../constants/RegistryKeys.js';
import {
  SHOP_PURCHASE,
  MONEY_CHANGED,
} from '../constants/Events.js';
import { addItem } from './InventoryManager.js';

// ─────────────────────────────────────────────────────────────────────────────
// Shop data loading
// ─────────────────────────────────────────────────────────────────────────────

const SHOP_MAP = new Map(SHOPS.map(s => [s.id, s]));

// ─────────────────────────────────────────────────────────────────────────────
// Sale constants
// ─────────────────────────────────────────────────────────────────────────────

/** How many in-game days between weekly sale regeneration. */
export const SALE_INTERVAL_DAYS = 7;

/** Minimum sale discount fraction. */
export const SALE_MIN_DISCOUNT = 0.20;

/** Maximum sale discount fraction. */
export const SALE_MAX_DISCOUNT = 0.40;

/** Default number of items placed on sale per regeneration. */
export const SALE_ITEMS_COUNT = 3;

// ─────────────────────────────────────────────────────────────────────────────
// Shop data helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return a shop definition by ID, or null if not found.
 *
 * @param {string} shopId
 * @returns {object|null}
 */
export function getShop(shopId) {
  return SHOP_MAP.get(shopId) ?? null;
}

/**
 * Return all shop definitions.
 *
 * @returns {Array<object>}
 */
export function getAllShops() {
  return SHOPS;
}

// ─────────────────────────────────────────────────────────────────────────────
// Store hours
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine whether a given in-game day number falls on a weekend.
 * Day 1 is Monday. Days 6 and 7 (and multiples thereof) are weekend.
 *
 * @param {number} day - Absolute in-game day (1 = Monday).
 * @returns {boolean}
 */
export function isWeekend(day) {
  const dayOfWeek = ((day - 1) % 7) + 1; // 1=Mon … 7=Sun
  return dayOfWeek >= 6;
}

/**
 * Check whether a shop is open at a given time on a given day.
 *
 * @param {string} shopId
 * @param {number} hour - Hour of the day (0–23).
 * @param {number} day  - Absolute in-game day (used to determine weekday/weekend).
 * @returns {boolean}
 */
export function isShopOpen(shopId, hour, day) {
  const shop = getShop(shopId);
  if (!shop) return false;

  const weekend = isWeekend(day);
  const hours   = weekend ? shop.openHours.weekend : shop.openHours.weekday;
  return hour >= hours.open && hour < hours.close;
}

// ─────────────────────────────────────────────────────────────────────────────
// Sale system
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the current sale map from the registry.
 * Format: { 'shopId:itemId': discountFraction }
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {object}
 */
export function getSales(registry) {
  return registry.get(RK.SHOP_SALES) ?? {};
}

/**
 * Calculate the sale price for an item given its base price and discount fraction.
 *
 * @param {number} basePrice
 * @param {number} discount - Fraction (e.g. 0.25 = 25% off).
 * @returns {number} Discounted price rounded to nearest integer.
 */
export function calculateSalePrice(basePrice, discount) {
  return Math.round(basePrice * (1 - discount));
}

/**
 * Generate a new weekly sale, replacing the previous one.
 * Randomly selects SALE_ITEMS_COUNT items across all shops and assigns 20–40% discounts.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} currentDay
 * @returns {object} New sale map.
 */
export function generateWeeklySales(registry, currentDay) {
  // Collect all shop-item pairs
  const candidates = [];
  for (const shop of SHOPS) {
    for (const shopItem of shop.items) {
      candidates.push({ shopId: shop.id, itemId: shopItem.itemId });
    }
  }

  if (candidates.length === 0) {
    registry.set(RK.SHOP_SALES, {});
    registry.set(RK.LAST_SALE_DAY, currentDay);
    return {};
  }

  // Shuffle and pick SALE_ITEMS_COUNT items
  const shuffled = [...candidates].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(SALE_ITEMS_COUNT, shuffled.length));

  const sales = {};
  for (const { shopId, itemId } of selected) {
    const discount = SALE_MIN_DISCOUNT +
      Math.random() * (SALE_MAX_DISCOUNT - SALE_MIN_DISCOUNT);
    sales[`${shopId}:${itemId}`] = parseFloat(discount.toFixed(4));
  }

  registry.set(RK.SHOP_SALES, sales);
  registry.set(RK.LAST_SALE_DAY, currentDay);
  return sales;
}

/**
 * Check whether weekly sales need regenerating and do so if necessary.
 * Sales are generated immediately on first call (when no sales exist yet),
 * then regenerated every SALE_INTERVAL_DAYS days.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {number} currentDay
 * @returns {boolean} True if sales were regenerated.
 */
export function checkAndRefreshSales(registry, currentDay) {
  const lastSaleDay = registry.get(RK.LAST_SALE_DAY) ?? null;
  const noSalesYet  = lastSaleDay === null || lastSaleDay === undefined || lastSaleDay === 0;
  if (noSalesYet || (currentDay - lastSaleDay) >= SALE_INTERVAL_DAYS) {
    generateWeeklySales(registry, currentDay);
    return true;
  }
  return false;
}

/**
 * Get the effective price of a shop item, applying any active sale discount.
 *
 * @param {string} shopId
 * @param {string} itemId
 * @param {number} basePrice
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ price: number, onSale: boolean, discount: number }}
 */
export function getEffectivePrice(shopId, itemId, basePrice, registry) {
  const sales   = getSales(registry);
  const saleKey = `${shopId}:${itemId}`;
  if (Object.prototype.hasOwnProperty.call(sales, saleKey)) {
    const discount = sales[saleKey];
    return {
      price:   calculateSalePrice(basePrice, discount),
      onSale:  true,
      discount,
    };
  }
  return { price: basePrice, onSale: false, discount: 0 };
}

/**
 * Return all items for a shop, with effective prices applied.
 *
 * @param {string} shopId
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<{ itemId: string, basePrice: number, price: number, onSale: boolean, discount: number }>|null}
 */
export function getShopItems(shopId, registry) {
  const shop = getShop(shopId);
  if (!shop) return null;

  return shop.items.map(shopItem => {
    const { price, onSale, discount } = getEffectivePrice(
      shopId, shopItem.itemId, shopItem.price, registry,
    );
    return {
      itemId:    shopItem.itemId,
      basePrice: shopItem.price,
      price,
      onSale,
      discount,
    };
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Cart management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return the current cart from the registry.
 * Format: Array of { shopId, itemId, quantity, unitPrice }
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {Array<object>}
 */
export function getCart(registry) {
  return registry.get(RK.SHOP_CART) ?? [];
}

/**
 * Add an item to the shopping cart.
 * Uses the effective price (with any sale discount) at the time of adding.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} shopId
 * @param {string} itemId
 * @param {number} [quantity=1]
 * @returns {{ success: boolean, reason?: string }}
 */
export function addToCart(registry, shopId, itemId, quantity = 1) {
  const shop = getShop(shopId);
  if (!shop) return { success: false, reason: 'shop_not_found' };

  const shopItem = shop.items.find(i => i.itemId === itemId);
  if (!shopItem) return { success: false, reason: 'item_not_in_shop' };

  const { price } = getEffectivePrice(shopId, itemId, shopItem.price, registry);
  const cart      = getCart(registry);

  const existing  = cart.find(c => c.shopId === shopId && c.itemId === itemId);
  if (existing) {
    const updated = cart.map(c =>
      c.shopId === shopId && c.itemId === itemId
        ? { ...c, quantity: c.quantity + quantity }
        : c,
    );
    registry.set(RK.SHOP_CART, updated);
  } else {
    registry.set(RK.SHOP_CART, [...cart, { shopId, itemId, quantity, unitPrice: price }]);
  }

  return { success: true };
}

/**
 * Remove an item (or reduce quantity) from the cart.
 *
 * @param {Phaser.Data.DataManager} registry
 * @param {string} shopId
 * @param {string} itemId
 * @param {number} [quantity=1]
 * @returns {{ success: boolean, reason?: string }}
 */
export function removeFromCart(registry, shopId, itemId, quantity = 1) {
  const cart    = getCart(registry);
  const existing = cart.find(c => c.shopId === shopId && c.itemId === itemId);
  if (!existing) return { success: false, reason: 'item_not_in_cart' };

  let updated;
  if (existing.quantity <= quantity) {
    updated = cart.filter(c => !(c.shopId === shopId && c.itemId === itemId));
  } else {
    updated = cart.map(c =>
      c.shopId === shopId && c.itemId === itemId
        ? { ...c, quantity: c.quantity - quantity }
        : c,
    );
  }
  registry.set(RK.SHOP_CART, updated);
  return { success: true };
}

/**
 * Clear the entire cart.
 *
 * @param {Phaser.Data.DataManager} registry
 */
export function clearCart(registry) {
  registry.set(RK.SHOP_CART, []);
}

/**
 * Calculate the total cost of all items in the cart.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {number} Total DKK.
 */
export function getCartTotal(registry) {
  const cart = getCart(registry);
  return cart.reduce((sum, c) => sum + c.unitPrice * c.quantity, 0);
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Complete the purchase of all items in the cart.
 *
 *  1. Check sufficient funds.
 *  2. Deduct total from PLAYER_MONEY.
 *  3. Add each item to the player's inventory.
 *  4. Clear the cart.
 *  5. Emit SHOP_PURCHASE and MONEY_CHANGED.
 *
 * @param {Phaser.Data.DataManager} registry
 * @returns {{ success: boolean, reason?: string, total: number, items: Array<object> }}
 */
export function checkout(registry) {
  const cart  = getCart(registry);
  if (cart.length === 0) return { success: false, reason: 'cart_empty', total: 0, items: [] };

  const total = getCartTotal(registry);
  const money = registry.get(RK.PLAYER_MONEY) ?? 0;

  if (money < total) {
    return { success: false, reason: 'insufficient_funds', total, items: cart };
  }

  const newBalance = money - total;
  registry.set(RK.PLAYER_MONEY, newBalance);

  // Add items to inventory
  for (const cartItem of cart) {
    addItem(registry, cartItem.itemId, cartItem.quantity);
  }

  clearCart(registry);

  registry.events.emit(SHOP_PURCHASE, { items: cart, total, newBalance });
  registry.events.emit(MONEY_CHANGED, { amount: -total, newBalance, source: 'shop' });

  return { success: true, total, items: cart };
}
