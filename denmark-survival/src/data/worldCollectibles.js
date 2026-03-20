/**
 * src/data/worldCollectibles.js
 * Default daily collectible manifest used by GameScene.
 *
 * Each entry defines a world-spawned collectible item that the player can pick
 * up by pressing E when nearby.  Task 028 (First Day Onboarding) can supply its
 * own manifest to override these defaults for Day 1.
 *
 * Fields:
 *   id        {string}       Unique instance ID for this collectible spawn.
 *   itemId    {string}       Reference to an item in items.json.
 *   x, y      {number}       World pixel coordinates.
 *   quantity  {number}       Amount added to inventory on pickup (default 1).
 *   zone      {string}       Zone name (for per-zone cap of 5).
 *   spriteKey {string|null}  Phaser asset key; null → use Graphics placeholder.
 *   sparkle   {boolean}      If true, show sparkle particle above sprite.
 *   tooltip   {string|null}  First-pickup flavour text; null → no toast shown.
 *   oneTime   {boolean}      If true, never respawns after pickup.
 */

export const DEFAULT_COLLECTIBLE_MANIFEST = [
  // ── Nørreport Torv ──────────────────────────────────────────────────────────
  {
    id: 'coffee_1',
    itemId: 'coffee',
    x: 480,
    y: 320,
    quantity: 1,
    zone: 'Nørreport Torv',
    spriteKey: null,
    sparkle: false,
    tooltip: 'You found a forgotten coffee cup. Someone left this behind!',
    oneTime: false,
  },
  {
    id: 'energy_drink_1',
    itemId: 'energy_drink',
    x: 520,
    y: 460,
    quantity: 1,
    zone: 'Nørreport Torv',
    spriteKey: null,
    sparkle: true,
    tooltip: null,
    oneTime: false,
  },

  // ── Nørrebro ────────────────────────────────────────────────────────────────
  {
    id: 'danish_flag_pin_1',
    itemId: 'danish_flag_pin',
    x: 350,
    y: 580,
    quantity: 1,
    zone: 'Nørrebro',
    spriteKey: null,
    sparkle: true,
    tooltip: 'A small Dannebrog pin — a token of Danish belonging.',
    oneTime: true,
  },
  {
    id: 'vitamin_d_1',
    itemId: 'vitamin_d',
    x: 390,
    y: 620,
    quantity: 1,
    zone: 'Nørrebro',
    spriteKey: null,
    sparkle: false,
    tooltip: null,
    oneTime: false,
  },

  // ── Frederiksberg ────────────────────────────────────────────────────────────
  {
    id: 'cpr_card_1',
    itemId: 'cpr_card',
    x: 700,
    y: 750,
    quantity: 1,
    zone: 'Frederiksberg',
    spriteKey: null,
    sparkle: true,
    tooltip: 'You found your CPR card! Keep this safe — you need it everywhere in Denmark.',
    oneTime: true,
  },
];
