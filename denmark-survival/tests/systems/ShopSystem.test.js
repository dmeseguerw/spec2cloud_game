/**
 * tests/systems/ShopSystem.test.js
 * Unit and integration tests for ShopSystem.
 * Coverage target: ≥85% of src/systems/ShopSystem.js
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  SALE_INTERVAL_DAYS,
  SALE_MIN_DISCOUNT,
  SALE_MAX_DISCOUNT,
  SALE_ITEMS_COUNT,
  getShop,
  getAllShops,
  isWeekend,
  isShopOpen,
  getSales,
  calculateSalePrice,
  generateWeeklySales,
  checkAndRefreshSales,
  getEffectivePrice,
  getShopItems,
  getCart,
  addToCart,
  removeFromCart,
  clearCart,
  getCartTotal,
  checkout,
} from '../../src/systems/ShopSystem.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import { SHOP_PURCHASE, MONEY_CHANGED } from '../../src/constants/Events.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function makeRegistry(options = {}) {
  const r = new MockRegistry();
  r.set(RK.CURRENT_DAY,   options.day    ?? 1);
  r.set(RK.PLAYER_XP,     options.xp     ?? 100);
  r.set(RK.PLAYER_LEVEL,  options.level  ?? 1);
  r.set(RK.PLAYER_MONEY,  options.money  ?? 10000);
  r.set(RK.INVENTORY,     options.inventory ?? []);
  if (options.sales !== undefined)    r.set(RK.SHOP_SALES,   options.sales);
  if (options.lastSaleDay !== undefined) r.set(RK.LAST_SALE_DAY, options.lastSaleDay);
  if (options.cart !== undefined)     r.set(RK.SHOP_CART,    options.cart);
  return r;
}

// ─────────────────────────────────────────────────────────────────────────────
// Shop data
// ─────────────────────────────────────────────────────────────────────────────

describe('getAllShops / getShop', () => {
  it('returns a non-empty array of shops', () => {
    const shops = getAllShops();
    expect(Array.isArray(shops)).toBe(true);
    expect(shops.length).toBeGreaterThan(0);
  });

  it('all shops have required fields', () => {
    for (const shop of getAllShops()) {
      expect(shop.id,        `${shop.id} missing id`).toBeTruthy();
      expect(shop.name,      `${shop.id} missing name`).toBeTruthy();
      expect(shop.location,  `${shop.id} missing location`).toBeTruthy();
      expect(shop.type,      `${shop.id} missing type`).toBeTruthy();
      expect(shop.openHours, `${shop.id} missing openHours`).toBeTruthy();
      expect(Array.isArray(shop.items), `${shop.id} items not array`).toBe(true);
    }
  });

  it('all shop open-hours have weekday and weekend', () => {
    for (const shop of getAllShops()) {
      expect(shop.openHours.weekday, `${shop.id} missing weekday hours`).toBeTruthy();
      expect(shop.openHours.weekend, `${shop.id} missing weekend hours`).toBeTruthy();
    }
  });

  it('getShop returns correct shop by id', () => {
    const shop = getShop('netto');
    expect(shop).not.toBeNull();
    expect(shop.id).toBe('netto');
  });

  it('getShop returns null for unknown id', () => {
    expect(getShop('nonexistent')).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Store hours
// ─────────────────────────────────────────────────────────────────────────────

describe('isWeekend', () => {
  it('day 1 (Monday) is not a weekend', () => expect(isWeekend(1)).toBe(false));
  it('day 5 (Friday) is not a weekend', () => expect(isWeekend(5)).toBe(false));
  it('day 6 (Saturday) is a weekend', () => expect(isWeekend(6)).toBe(true));
  it('day 7 (Sunday) is a weekend', () => expect(isWeekend(7)).toBe(true));
  it('day 8 (Monday again) is not a weekend', () => expect(isWeekend(8)).toBe(false));
  it('day 13 (Saturday again) is a weekend', () => expect(isWeekend(13)).toBe(true));
});

describe('isShopOpen — netto (weekday 7-22, weekend 8-20)', () => {
  it('is open at 9 on a weekday (day 1)', () => {
    expect(isShopOpen('netto', 9, 1)).toBe(true);
  });
  it('is open at 7 on a weekday', () => {
    expect(isShopOpen('netto', 7, 1)).toBe(true);
  });
  it('is closed at 22 on a weekday (exclusive close)', () => {
    expect(isShopOpen('netto', 22, 1)).toBe(false);
  });
  it('is closed at 6 on a weekday', () => {
    expect(isShopOpen('netto', 6, 1)).toBe(false);
  });
  it('is open at 10 on a weekend (day 6)', () => {
    expect(isShopOpen('netto', 10, 6)).toBe(true);
  });
  it('is open at 8 on a weekend', () => {
    expect(isShopOpen('netto', 8, 6)).toBe(true);
  });
  it('is closed at 20 on a weekend (exclusive close)', () => {
    expect(isShopOpen('netto', 20, 6)).toBe(false);
  });
  it('is closed at 7 on a weekend', () => {
    expect(isShopOpen('netto', 7, 6)).toBe(false);
  });
  it('returns false for unknown shop', () => {
    expect(isShopOpen('ghost_shop', 10, 1)).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Sale system
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateSalePrice', () => {
  it('applies 25% discount', () => {
    expect(calculateSalePrice(100, 0.25)).toBe(75);
  });
  it('applies 20% discount', () => {
    expect(calculateSalePrice(50, 0.20)).toBe(40);
  });
  it('applies 40% discount', () => {
    expect(calculateSalePrice(100, 0.40)).toBe(60);
  });
  it('rounds to nearest integer', () => {
    expect(calculateSalePrice(33, 0.33)).toBe(Math.round(33 * 0.67));
  });
});

describe('generateWeeklySales', () => {
  it('creates a sale map with at least one entry', () => {
    const registry = makeRegistry({ day: 1 });
    const sales = generateWeeklySales(registry, 1);
    expect(typeof sales).toBe('object');
    expect(Object.keys(sales).length).toBeGreaterThan(0);
  });

  it('stores sales in registry', () => {
    const registry = makeRegistry({ day: 1 });
    generateWeeklySales(registry, 1);
    const stored = getSales(registry);
    expect(Object.keys(stored).length).toBeGreaterThan(0);
  });

  it('stores last sale day', () => {
    const registry = makeRegistry({ day: 5 });
    generateWeeklySales(registry, 5);
    expect(registry.get(RK.LAST_SALE_DAY)).toBe(5);
  });

  it('discount values are within allowed range', () => {
    const registry = makeRegistry({ day: 1 });
    const sales = generateWeeklySales(registry, 1);
    for (const discount of Object.values(sales)) {
      expect(discount).toBeGreaterThanOrEqual(SALE_MIN_DISCOUNT);
      expect(discount).toBeLessThanOrEqual(SALE_MAX_DISCOUNT);
    }
  });

  it('sale keys have format shopId:itemId', () => {
    const registry = makeRegistry({ day: 1 });
    const sales = generateWeeklySales(registry, 1);
    for (const key of Object.keys(sales)) {
      expect(key).toContain(':');
    }
  });
});

describe('checkAndRefreshSales', () => {
  it('generates sales when none exist', () => {
    const registry = makeRegistry({ day: 1 });
    const refreshed = checkAndRefreshSales(registry, 1);
    expect(refreshed).toBe(true);
  });

  it('regenerates sales after SALE_INTERVAL_DAYS', () => {
    const registry = makeRegistry({ day: 8, lastSaleDay: 1 });
    const refreshed = checkAndRefreshSales(registry, 8);
    expect(refreshed).toBe(true);
  });

  it('does NOT regenerate before interval', () => {
    const registry = makeRegistry({ day: 6, lastSaleDay: 1 });
    const refreshed = checkAndRefreshSales(registry, 6);
    expect(refreshed).toBe(false);
  });
});

describe('getEffectivePrice', () => {
  it('returns base price when no sale', () => {
    const registry = makeRegistry({ sales: {} });
    const result = getEffectivePrice('netto', 'pasta', 15, registry);
    expect(result.price).toBe(15);
    expect(result.onSale).toBe(false);
    expect(result.discount).toBe(0);
  });

  it('returns discounted price when on sale', () => {
    const registry = makeRegistry({ sales: { 'netto:pasta': 0.25 } });
    const result = getEffectivePrice('netto', 'pasta', 15, registry);
    expect(result.price).toBe(11); // 15 * 0.75 = 11.25 → 11
    expect(result.onSale).toBe(true);
    expect(result.discount).toBe(0.25);
  });
});

describe('getShopItems', () => {
  it('returns null for unknown shop', () => {
    const registry = makeRegistry();
    expect(getShopItems('ghost_shop', registry)).toBeNull();
  });

  it('returns items with prices for known shop', () => {
    const registry = makeRegistry({ sales: {} });
    const items = getShopItems('netto', registry);
    expect(Array.isArray(items)).toBe(true);
    expect(items.length).toBeGreaterThan(0);
    for (const item of items) {
      expect(item.itemId).toBeTruthy();
      expect(typeof item.price).toBe('number');
      expect(typeof item.onSale).toBe('boolean');
    }
  });

  it('applies sale price to items on sale', () => {
    const registry = makeRegistry({ sales: { 'netto:pasta': 0.30 } });
    const items = getShopItems('netto', registry);
    const pastaItem = items.find(i => i.itemId === 'pasta');
    expect(pastaItem).toBeDefined();
    expect(pastaItem.onSale).toBe(true);
    expect(pastaItem.price).toBeLessThan(pastaItem.basePrice);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cart management
// ─────────────────────────────────────────────────────────────────────────────

describe('addToCart', () => {
  it('adds item to empty cart', () => {
    const registry = makeRegistry();
    const result = addToCart(registry, 'netto', 'pasta', 2);
    expect(result.success).toBe(true);
    const cart = getCart(registry);
    expect(cart).toHaveLength(1);
    expect(cart[0]).toMatchObject({ shopId: 'netto', itemId: 'pasta', quantity: 2 });
  });

  it('increases quantity for existing cart item', () => {
    const registry = makeRegistry();
    addToCart(registry, 'netto', 'pasta', 2);
    addToCart(registry, 'netto', 'pasta', 1);
    const cart = getCart(registry);
    expect(cart[0].quantity).toBe(3);
  });

  it('returns failure for unknown shop', () => {
    const registry = makeRegistry();
    const result = addToCart(registry, 'ghost_shop', 'pasta', 1);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('shop_not_found');
  });

  it('returns failure for item not in shop', () => {
    const registry = makeRegistry();
    const result = addToCart(registry, 'netto', 'bike_lock', 1);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('item_not_in_shop');
  });
});

describe('removeFromCart', () => {
  it('removes item from cart', () => {
    const registry = makeRegistry({ cart: [{ shopId: 'netto', itemId: 'pasta', quantity: 2, unitPrice: 13 }] });
    const result = removeFromCart(registry, 'netto', 'pasta', 1);
    expect(result.success).toBe(true);
    expect(getCart(registry)[0].quantity).toBe(1);
  });

  it('removes item entirely when quantity reaches zero', () => {
    const registry = makeRegistry({ cart: [{ shopId: 'netto', itemId: 'pasta', quantity: 1, unitPrice: 13 }] });
    removeFromCart(registry, 'netto', 'pasta', 1);
    expect(getCart(registry)).toHaveLength(0);
  });

  it('returns failure when item not in cart', () => {
    const registry = makeRegistry({ cart: [] });
    const result = removeFromCart(registry, 'netto', 'pasta', 1);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('item_not_in_cart');
  });
});

describe('clearCart', () => {
  it('empties the cart', () => {
    const registry = makeRegistry({ cart: [{ shopId: 'netto', itemId: 'pasta', quantity: 2, unitPrice: 13 }] });
    clearCart(registry);
    expect(getCart(registry)).toHaveLength(0);
  });
});

describe('getCartTotal', () => {
  it('returns 0 for empty cart', () => {
    const registry = makeRegistry({ cart: [] });
    expect(getCartTotal(registry)).toBe(0);
  });

  it('sums unit prices × quantities', () => {
    const cart = [
      { shopId: 'netto', itemId: 'pasta',  quantity: 2, unitPrice: 13 },
      { shopId: 'netto', itemId: 'milk',   quantity: 1, unitPrice: 10 },
    ];
    const registry = makeRegistry({ cart });
    expect(getCartTotal(registry)).toBe(36); // 2*13 + 1*10
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Checkout
// ─────────────────────────────────────────────────────────────────────────────

describe('checkout', () => {
  it('completes purchase and deducts from balance', () => {
    const registry = makeRegistry({
      money: 1000,
      cart: [{ shopId: 'netto', itemId: 'pasta', quantity: 2, unitPrice: 13 }],
    });
    const result = checkout(registry);
    expect(result.success).toBe(true);
    expect(result.total).toBe(26);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(974);
  });

  it('adds purchased items to inventory', () => {
    const registry = makeRegistry({
      money: 500,
      cart: [{ shopId: 'netto', itemId: 'pasta', quantity: 1, unitPrice: 13 }],
    });
    checkout(registry);
    const inventory = registry.get(RK.INVENTORY);
    const pastaEntry = inventory.find(e => e.itemId === 'pasta');
    expect(pastaEntry).toBeDefined();
  });

  it('clears cart after checkout', () => {
    const registry = makeRegistry({
      money: 500,
      cart: [{ shopId: 'netto', itemId: 'coffee', quantity: 1, unitPrice: 7 }],
    });
    checkout(registry);
    expect(getCart(registry)).toHaveLength(0);
  });

  it('blocks purchase with insufficient funds', () => {
    const registry = makeRegistry({
      money: 5,
      cart: [{ shopId: 'netto', itemId: 'pasta', quantity: 2, unitPrice: 13 }],
    });
    const result = checkout(registry);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('insufficient_funds');
    expect(registry.get(RK.PLAYER_MONEY)).toBe(5); // unchanged
    expect(getCart(registry)).toHaveLength(1); // cart intact
  });

  it('returns failure for empty cart', () => {
    const registry = makeRegistry({ money: 1000, cart: [] });
    const result = checkout(registry);
    expect(result.success).toBe(false);
    expect(result.reason).toBe('cart_empty');
  });

  it('emits SHOP_PURCHASE event', () => {
    const registry = makeRegistry({
      money: 200,
      cart: [{ shopId: 'netto', itemId: 'coffee', quantity: 1, unitPrice: 7 }],
    });
    const listener = vi.fn();
    registry.events.on(SHOP_PURCHASE, listener);
    checkout(registry);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].total).toBe(7);
  });

  it('emits MONEY_CHANGED event', () => {
    const registry = makeRegistry({
      money: 200,
      cart: [{ shopId: 'netto', itemId: 'coffee', quantity: 1, unitPrice: 7 }],
    });
    const listener = vi.fn();
    registry.events.on(MONEY_CHANGED, listener);
    checkout(registry);
    expect(listener).toHaveBeenCalledOnce();
    expect(listener.mock.calls[0][0].source).toBe('shop');
    expect(listener.mock.calls[0][0].amount).toBe(-7);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Integration: Full shop flow
// ─────────────────────────────────────────────────────────────────────────────

describe('Integration — full shop flow', () => {
  it('enter → browse → buy → items in inventory → DKK reduced', () => {
    const registry = makeRegistry({ money: 500 });

    // Check shop is open
    expect(isShopOpen('netto', 10, 1)).toBe(true);

    // Browse items
    const items = getShopItems('netto', registry);
    expect(items.length).toBeGreaterThan(0);

    // Add items to cart
    addToCart(registry, 'netto', 'pasta', 2);
    addToCart(registry, 'netto', 'milk', 1);
    expect(getCartTotal(registry)).toBeGreaterThan(0);

    // Checkout
    const total = getCartTotal(registry);
    const result = checkout(registry);
    expect(result.success).toBe(true);
    expect(registry.get(RK.PLAYER_MONEY)).toBe(500 - total);

    // Items in inventory
    const inventory = registry.get(RK.INVENTORY);
    const pasta = inventory.find(e => e.itemId === 'pasta');
    expect(pasta).toBeDefined();
    expect(pasta.quantity).toBe(2);
  });

  it('shop closed outside hours — blocks purchase notification', () => {
    // Netto closes at 22:00 on weekdays
    expect(isShopOpen('netto', 23, 1)).toBe(false);
    expect(isShopOpen('netto', 6, 1)).toBe(false);
  });

  it('sale items show discounted prices', () => {
    const registry = makeRegistry({ day: 1 });
    generateWeeklySales(registry, 1);
    const sales = getSales(registry);
    const saleKeys = Object.keys(sales);
    expect(saleKeys.length).toBeGreaterThan(0);

    // Pick first sale item and verify discount
    const [shopId, itemId] = saleKeys[0].split(':');
    const shop = getShop(shopId);
    const shopItem = shop.items.find(i => i.itemId === itemId);
    const { price, onSale } = getEffectivePrice(shopId, itemId, shopItem.price, registry);
    expect(onSale).toBe(true);
    expect(price).toBeLessThan(shopItem.price);
  });
});
