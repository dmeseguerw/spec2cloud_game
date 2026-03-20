/**
 * src/data/day1World.js
 * Day 1 onboarding world configuration.
 *
 * Provides:
 *  - DAY1_COLLECTIBLE_MANIFEST — set as WORLD_COLLECTIBLES on Day 1 so that
 *    GameScene._spawnCollectibles() places the authored pant bottle instead of
 *    the default daily collectibles.
 *
 * Used by GameScene when _isDay1() is true.
 */

/**
 * Day 1 collectible manifest: a single authored pant bottle on the pavement
 * halfway between the apartment building and Netto.
 *
 * pantValue = 2 → getXPForItem(2) = XP_MAX (5 XP) via WorldCollectibleSystem.
 * xpSource is read by GameScene._handlePickup() to log the correct source.
 */
export const DAY1_COLLECTIBLE_MANIFEST = [
  {
    id:       'day1_pant_bottle',
    itemId:   'pant_aluminium_can',
    x:        460,
    y:        310,
    quantity: 1,
    zone:     'Copenhagen',
    spriteKey: null,
    sparkle:  true,
    tooltip:  'An aluminium can (pant) — return at any shop for 1-3 DKK. Denmark has the world\'s highest bottle return rate!',
    oneTime:  true,
    xpSource: 'Picked up pant bottle',
  },
];
