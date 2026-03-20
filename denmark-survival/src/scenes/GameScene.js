/**
 * src/scenes/GameScene.js
 * Primary gameplay scene for Denmark Survival.
 *
 * Responsibilities:
 *  - Load and render a Tiled JSON tilemap (ground, buildings, decorations, collision).
 *  - Spawn the player at the last saved position (or default spawn).
 *  - Camera follows the player and is constrained to tilemap world bounds.
 *  - Player collides with the collision layer.
 *  - Zone detection: update PLAYER_LOCATION registry when the player enters a new area.
 *  - NPC placement foundation: place NPC sprites with interaction indicators.
 *  - Interaction system: detect nearby interactables, show context hint in UIScene.
 *  - Launch UIScene in parallel for the HUD overlay.
 */

import { BaseScene } from './BaseScene.js';
import { Player } from '../entities/Player.js';
import { InputManager } from '../systems/InputManager.js';
import { DialogueEngine } from '../systems/DialogueEngine.js';
import { lars_day1_tutorial }    from '../data/dialogues/lars_day1_tutorial.js';
import { mette_shopping }       from '../data/dialogues/mette_shopping.js';
import { thomas_first_meeting } from '../data/dialogues/thomas_first_meeting.js';
import {
  TILEMAP_TEST, TILESET_CITY,
  SPRITE_NPC_LARS, SPRITE_NPC_ANNA, SPRITE_NPC_METTE,
  SPRITE_INDICATOR_EXCLAMATION,
} from '../constants/AssetKeys.js';
import {
  PLAYER_X, PLAYER_Y, PLAYER_SCENE, PLAYER_LOCATION,
  CURRENT_LOCATION, CONTEXT_HINT, WORLD_COLLECTIBLES,
  PLAYER_HEALTH, PLAYER_ENERGY, PLAYER_MONEY,
  PLAYER_XP, PLAYER_LEVEL, CURRENT_DAY,
  TIME_OF_DAY, SEASON, WEATHER,
} from '../constants/RegistryKeys.js';
import { initDayCycle } from '../systems/DayCycleEngine.js';
import { applyDailyWeather } from '../systems/WeatherSystem.js';
import {
  evaluateManifest,
  getCollectedItems,
  getPickupSound,
  collectItem,
} from '../systems/WorldCollectibleSystem.js';
import { isDoorOpen, getDoorContextHint } from '../systems/DoorSystem.js';
import { getItemData } from '../systems/InventoryManager.js';
import { DEFAULT_COLLECTIBLE_MANIFEST } from '../data/worldCollectibles.js';
import { DEFAULT_DOORS } from '../data/worldDoors.js';

/** Default spawn position when no saved position exists. */
const DEFAULT_SPAWN_X = 400;
const DEFAULT_SPAWN_Y = 300;

/** Distance (px) within which an interactable object is considered "nearby". */
const INTERACT_RANGE = 64;

/** Vertical offset (px) above the NPC sprite for the interaction indicator. */
const INDICATOR_VERTICAL_OFFSET = -32;

export class GameScene extends BaseScene {
  constructor() {
    super({ key: 'GameScene' });

    /** @type {Player|null} */
    this._player = null;

    /** @type {InputManager|null} */
    this._input = null;

    /** @type {DialogueEngine|null} */
    this._dialogueEngine = null;

    /** @type {Phaser.Tilemaps.Tilemap|null} */
    this._map = null;

    /** @type {Phaser.Tilemaps.TilemapLayer|null} */
    this._collisionLayer = null;

    /**
     * Named zones within the tilemap.
     * Shape: [{ name: string, x, y, width, height }]
     * @type {Array<{name:string,x:number,y:number,width:number,height:number}>}
     */
    this._zones = [];

    /** Currently active zone name. */
    this._currentZone = null;

    /**
     * Interactable objects: NPCs, doors, items.
     * Shape: [{ sprite, name, type, callback }]
     * @type {Array}
     */
    this._interactables = [];

    /** The interactable nearest to the player (within range), or null. */
    this._nearestInteractable = null;
  }

  // ---------------------------------------------------------------------------
  // Lifecycle
  // ---------------------------------------------------------------------------

  init(data) {
    super.init(data);
  }

  create() {
    this.fadeInCamera();

    // Ensure the registry has all values needed by the HUD and systems.
    this._ensureRegistryDefaults();

    // Determine spawn position from registry (persist across scene transitions).
    const spawnX = this.registry.get(PLAYER_X) || DEFAULT_SPAWN_X;
    const spawnY = this.registry.get(PLAYER_Y) || DEFAULT_SPAWN_Y;

    // ── Tilemap / world ──────────────────────────────────────────────────────
    this._buildWorld(spawnX, spawnY);

    // ── NPCs ─────────────────────────────────────────────────────────────────
    // Reset interactables list and nearest tracking in case scene is restarting
    // (constructor only runs once; these must be clean on each create call).
    this._interactables = [];
    this._nearestInteractable = null;
    this._spawnNPCs();

    // ── World collectibles ───────────────────────────────────────────────────
    this._spawnCollectibles();

    // ── Building doors ────────────────────────────────────────────────────────
    this._spawnDoors();

    // ── InputManager ─────────────────────────────────────────────────────────
    this._input = new InputManager(this);

    // ── DialogueEngine ───────────────────────────────────────────────────────
    this._dialogueEngine = new DialogueEngine();
    this._dialogueEngine.registerDialogue('lars_day1_tutorial',   lars_day1_tutorial);
    this._dialogueEngine.registerDialogue('mette_shopping',      mette_shopping);
    this._dialogueEngine.registerDialogue('thomas_first_meeting', thomas_first_meeting);

    // ── Player ───────────────────────────────────────────────────────────────
    this._player = new Player(this, spawnX, spawnY);

    // ── Camera ───────────────────────────────────────────────────────────────
    this._setupCamera();

    // ── Zones ────────────────────────────────────────────────────────────────
    this._setupZones();

    // ── HUD overlay ──────────────────────────────────────────────────────────
    this.scene.launch('UIScene');

    // ── Game systems (day cycle + weather) ───────────────────────────────────
    this._initGameSystems();

    // Persist which scene the player is in.
    this.registry.set(PLAYER_SCENE, 'GameScene');

    // Block input when an overlay opens; unblock when it closes.
    this.events.on('overlayopened', () => this._input?.blockInput());
    this.events.on('overlayclosed', () => this._input?.unblockInput());
  }

  update(time, delta) {
    if (!this._player || !this._input) return;

    // ESC → open pause menu (rising-edge so it fires once per press).
    if (this._input.isEscapeJustPressed()) {
      this.openOverlay('PauseScene');
      return;
    }

    // Tab → open inventory (rising-edge).
    if (this._input.isInventoryJustPressed()) {
      this.openOverlay('InventoryScene');
      return;
    }

    // Feed input to player.
    const movementInput = this._input.getMovementInput();
    this._player.update(movementInput);

    // Persist player position to registry.
    const { x, y } = this._player.getPosition();
    this.registry.set(PLAYER_X, Math.round(x));
    this.registry.set(PLAYER_Y, Math.round(y));

    // Zone detection.
    this._updateZone(x, y);

    // Door frame visibility based on proximity (2× interact range).
    this._updateDoorFrames(x, y);

    // Interaction detection.
    this._updateInteraction(x, y, time);
  }

  shutdown() {
    this._player?.destroy();
    this._player = null;
    this._input?.destroy();
    this._input = null;
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // World / tilemap
  // ---------------------------------------------------------------------------

  /**
   * Build the tilemap world. Falls back to a plain coloured rectangle when the
   * tilemap asset has not been loaded (e.g. during development or tests).
   *
   * @param {number} spawnX
   * @param {number} spawnY
   */
  _buildWorld(spawnX, spawnY) {
    // Attempt to create the tilemap.
    try {
      if (this.cache?.tilemap?.has(TILEMAP_TEST)) {
        this._map = this.make.tilemap({ key: TILEMAP_TEST });

        const tileset = this._map.addTilesetImage('tileset_city', TILESET_CITY);

        // Render visible layers.
        this._map.createLayer('Ground', tileset, 0, 0);
        this._map.createLayer('Buildings', tileset, 0, 0);
        this._map.createLayer('Decorations', tileset, 0, 0);

        // Collision layer (invisible).
        this._collisionLayer = this._map.createLayer('Collision', tileset, 0, 0);
        if (this._collisionLayer) {
          this._collisionLayer.setCollisionByProperty({ collides: true });
          this._collisionLayer.setVisible(false);
        }

        // Set world bounds to match the tilemap.
        const mapW = this._map.widthInPixels;
        const mapH = this._map.heightInPixels;
        if (this.physics?.world) {
          this.physics.world.setBounds(0, 0, mapW, mapH);
        }
      } else {
        this._createFallbackWorld();
      }
    } catch {
      this._createFallbackWorld();
    }
  }

  /**
   * Create a procedural Copenhagen neighbourhood when the real tilemap
   * is unavailable.  Draws roads, bike lanes, buildings, parks and canal
   * using Phaser's Graphics API so the game looks like an actual city.
   */
  _createFallbackWorld() {
    const W = 1600;
    const H = 1200;
    if (this.physics?.world) {
      this.physics.world.setBounds(0, 0, W, H);
    }

    const gfx = this.add.graphics();

    // ── BACKGROUND: warm stone pavement ─────────────────────────────────────
    gfx.fillStyle(0xc4b49a);
    gfx.fillRect(0, 0, W, H);

    // ── CANAL (south edge) ──────────────────────────────────────────────────
    gfx.fillStyle(0x1a6aaa);
    gfx.fillRect(0, 1010, W, 190);
    gfx.fillStyle(0x2a84cc);
    gfx.fillRect(0, 1025, W, 160);
    // Water shimmer
    gfx.fillStyle(0x5aaedd);
    for (let sx = 30; sx < W; sx += 110) {
      gfx.fillRect(sx, 1065, 45, 3);
      gfx.fillRect(sx + 18, 1090, 30, 2);
      gfx.fillRect(sx + 55, 1075, 35, 2);
    }
    // Quay edge
    gfx.fillStyle(0x9a8870);
    gfx.fillRect(0, 1005, W, 10);

    // ── PARK A (left, middle): Ørstedsparken ────────────────────────────────
    gfx.fillStyle(0x5aad45);
    gfx.fillRect(10, 388, 285, 275);
    // Paths
    gfx.fillStyle(0xd0bc9a);
    gfx.fillRect(10, 510, 285, 12);   // horizontal path
    gfx.fillRect(148, 388, 12, 275);  // vertical path

    // ── PARK B (right, lower): Botanisk Have ─────────────────────────────────
    gfx.fillStyle(0x5aad45);
    gfx.fillRect(818, 733, 374, 255);
    gfx.fillStyle(0xd0bc9a);
    gfx.fillRect(818, 850, 374, 12);
    gfx.fillRect(999, 733, 12, 255);

    // ── CENTRAL SQUARE: Nørreport Torv ──────────────────────────────────────
    gfx.fillStyle(0xb0a090);
    gfx.fillRect(363, 388, 385, 278);
    // Cobblestone grid
    gfx.lineStyle(1, 0x9a8a7a, 0.35);
    for (let cx = 368; cx < 748; cx += 18) gfx.lineBetween(cx, 388, cx, 663);
    for (let cy = 393; cy < 663; cy += 18) gfx.lineBetween(363, cy, 748, cy);
    // Fountain outer pool
    gfx.fillStyle(0x9a9080);
    gfx.fillCircle(558, 526, 40);
    gfx.fillStyle(0x60a8d8);
    gfx.fillCircle(558, 526, 36);
    gfx.fillStyle(0x40c0f0);
    gfx.fillCircle(558, 526, 14);
    gfx.fillStyle(0xb0e8ff);
    gfx.fillCircle(558, 522, 5);

    // ── ROAD LAYOUT DEFINITION ───────────────────────────────────────────────
    const HR = [{ y: 333, h: 48 }, { y: 673, h: 48 }, { y: 963, h: 48 }];
    const VR = [{ x: 303, w: 48 }, { x: 753, w: 48 }, { x: 1198, w: 48 }];

    // Bike lanes (brick-red strips flush with road edges)
    gfx.fillStyle(0x9b3535);
    for (const { y, h } of HR) {
      gfx.fillRect(0, y - 10, W, 10);
      gfx.fillRect(0, y + h,  W, 10);
    }
    for (const { x, w } of VR) {
      gfx.fillRect(x - 10, 0, 10, H);
      gfx.fillRect(x + w,  0, 10, H);
    }

    // Road surfaces
    gfx.fillStyle(0x2d2d2d);
    for (const { y, h } of HR) gfx.fillRect(0, y, W, h);
    for (const { x, w } of VR) gfx.fillRect(x, 0, w, H);

    // Centre dashed lane markings
    gfx.fillStyle(0xffffff);
    for (const { y, h } of HR) {
      const my = y + h / 2;
      for (let mx = 20; mx < W; mx += 46) {
        const onV = VR.some(r => mx + 24 > r.x && mx < r.x + r.w);
        if (!onV) gfx.fillRect(mx, my - 1, 26, 2);
      }
    }
    for (const { x, w } of VR) {
      const mx = x + w / 2;
      for (let my = 20; my < H; my += 46) {
        const onH = HR.some(r => my + 24 > r.y && my < r.y + r.h);
        if (!onH) gfx.fillRect(mx - 1, my, 2, 26);
      }
    }

    // Zebra crossings at each intersection
    gfx.fillStyle(0xdddddd);
    for (const { y, h } of HR) {
      for (const { x, w } of VR) {
        for (let zi = 0; zi < 4; zi++) {
          gfx.fillRect(x + w + 2, y + 4 + zi * 10, 16, 6);
          gfx.fillRect(x - 20,   y + 4 + zi * 10, 16, 6);
        }
      }
    }

    // ── BUILDINGS ────────────────────────────────────────────────────────────
    // Block A (0,0 → 303,333)
    this._drawBuilding(gfx, 14,  12, 122, 98,  0xb5432a);
    this._drawBuilding(gfx, 146, 12, 143, 98,  0xe8c958);
    this._drawBuilding(gfx, 14, 120,  82, 82,  0xd8d4cc);
    this._drawBuilding(gfx, 106, 120, 181, 82,  0xb5432a);
    this._drawBuilding(gfx, 14, 212, 275, 105, 0xe8c958);

    // Block B (351,0 → 753,333) — shops + supermarket
    this._drawBuilding(gfx, 361,  12, 105, 112, 0xd8d4cc);
    this._drawBuilding(gfx, 476,  12, 165, 112, 0xb5432a, true); // supermarket
    this._drawBuilding(gfx, 651,  12,  92, 112, 0xdc9040);
    this._drawBuilding(gfx, 361, 134, 125,  90, 0xe8c958);
    this._drawBuilding(gfx, 496, 134, 105,  90, 0xd8d4cc);
    this._drawBuilding(gfx, 611, 134, 132,  90, 0xb5432a);
    this._drawBuilding(gfx, 361, 234, 382,  80, 0xd8d4cc);

    // Block C (801,0 → 1198,333) — coloured townhouses
    const tchues = [0xb5432a, 0xe8c958, 0xd8d4cc, 0xdc9040, 0x7a9b50];
    for (let ti = 0; ti < 5; ti++) {
      this._drawBuilding(gfx, 813 + ti * 76, 12, 68, 112, tchues[ti % tchues.length]);
    }
    this._drawBuilding(gfx, 813, 134, 185, 96,  0xe8c958);
    this._drawBuilding(gfx, 1008, 134, 100, 96, 0xb5432a);
    this._drawBuilding(gfx, 1118, 134,  70, 96, 0xd8d4cc);
    this._drawBuilding(gfx, 813,  240, 375, 82, 0x7a9b50);

    // Block D (1246,0 → 1600,333)
    this._drawBuilding(gfx, 1258,  12, 225, 208, 0xd8d4cc, true); // office
    this._drawBuilding(gfx, 1493,  12,  92,  98, 0xb5432a);
    this._drawBuilding(gfx, 1493, 120,  92,  98, 0xdc9040);
    this._drawBuilding(gfx, 1258, 230, 325,  88, 0xe8c958);

    // Block G (801,381 → 1198,663) — mixed shops
    this._drawBuilding(gfx, 818, 390, 112, 82, 0xdc9040, true);
    this._drawBuilding(gfx, 940, 390, 112, 82, 0xb5432a, true);
    this._drawBuilding(gfx, 1062, 390, 124, 82, 0xd8d4cc, true);
    this._drawBuilding(gfx, 818, 484,  88, 82, 0xe8c958);
    this._drawBuilding(gfx, 916, 484,  88, 82, 0xb5432a);
    this._drawBuilding(gfx, 1014, 484,  88, 82, 0xd8d4cc);
    this._drawBuilding(gfx, 1112, 484,  74, 82, 0xdc9040);
    this._drawBuilding(gfx, 818,  578, 368, 68, 0xe8c958);

    // Block H (1246,381 → 1600,663)
    this._drawBuilding(gfx, 1258, 390, 155, 105, 0xb5432a);
    this._drawBuilding(gfx, 1423, 390, 155, 105, 0xe8c958);
    this._drawBuilding(gfx, 1258, 505, 112, 105, 0xd8d4cc);
    this._drawBuilding(gfx, 1380, 505, 198, 105, 0xb5432a);
    this._drawBuilding(gfx, 1258, 620, 320,  40, 0xdc9040);

    // Block I (0,721 → 303,963)
    this._drawBuilding(gfx, 14,  730, 132, 98, 0xb5432a);
    this._drawBuilding(gfx, 156, 730, 132, 98, 0xe8c958);
    this._drawBuilding(gfx, 14,  838, 278, 110, 0xd8d4cc);

    // Block J (351,721 → 753,963) — bike district
    this._drawBuilding(gfx, 361, 730, 172, 105, 0xdc9040, true); // bike shop
    this._drawBuilding(gfx, 543, 730, 200, 105, 0xb5432a);
    this._drawBuilding(gfx, 361, 845, 382, 105, 0xd8d4cc);

    // Block L (1246,721 → 1600,963)
    this._drawBuilding(gfx, 1258, 730, 122, 108, 0xe8c958);
    this._drawBuilding(gfx, 1390, 730, 188, 108, 0xb5432a);
    this._drawBuilding(gfx, 1258, 848, 320,  98, 0xd8d4cc);

    // ── TREES ────────────────────────────────────────────────────────────────
    // Park A
    [[55,435,18],[125,470,15],[205,445,20],[265,490,16],
     [65,572,16],[145,590,20],[232,565,17],[272,625,15],
     [82,640,14],[205,640,18]].forEach(([tx,ty,tr]) => this._drawTree(gfx,tx,ty,tr));
    // Park B
    [[868,762,20],[940,805,16],[1032,762,22],[1102,818,17],
     [1162,775,19],[893,878,16],[982,892,19],[1072,865,17],
     [1150,882,20],[870,942,15]].forEach(([tx,ty,tr]) => this._drawTree(gfx,tx,ty,tr));
    // Street trees above Road H1
    for (let stx = 28; stx < W; stx += 78) {
      const onV = VR.some(r => stx >= r.x - 16 && stx <= r.x + r.w + 16);
      if (!onV) this._drawTree(gfx, stx, 316, 9);
    }

    // ── BENCHES ──────────────────────────────────────────────────────────────
    gfx.fillStyle(0x8b6a30);
    [[102,512,36,8],[188,530,36,8],[62,622,36,8],[224,602,36,8]]
      .forEach(([bx,by,bw,bh]) => gfx.fillRect(bx,by,bw,bh));
    gfx.fillStyle(0x6b4a10);
    [[958,842,36,8],[1058,870,36,8]]
      .forEach(([bx,by,bw,bh]) => gfx.fillRect(bx,by,bw,bh));

    // ── LOCATION LABELS ──────────────────────────────────────────────────────
    const lbl = { fontSize: '12px', color: '#3a2a1a', fontStyle: 'italic' };
    this.add.text(558, 395, 'Nørreport Torv', { ...lbl, fontStyle: 'bold' }).setOrigin(0.5, 0);
    this.add.text(558,  25, 'Super Brugsen',  { fontSize: '10px', color: '#fff' }).setOrigin(0.5, 0.5);
    this.add.text(155, 508, 'Ørstedsparken',  { ...lbl, color: '#2a5a1a' }).setOrigin(0.5, 0);
    this.add.text(1005, 878, 'Botanisk Have', { ...lbl, color: '#2a5a1a' }).setOrigin(0.5, 0);
    this.add.text(448,  760, 'Cykelbutik',    { fontSize: '10px', color: '#fff' }).setOrigin(0.5, 0.5);
    this.add.text(200,  1058, 'Nyhavn Kanal', { fontSize: '14px', color: '#b0d8ff', fontStyle: 'italic' });
  }

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------

  _setupCamera() {
    const cam = this.cameras.main;

    if (this._player?.sprite) {
      cam.startFollow(this._player.sprite, true, 0.1, 0.1);
    }

    if (this._map) {
      cam.setBounds(0, 0, this._map.widthInPixels, this._map.heightInPixels);
    } else if (this.physics?.world?.bounds) {
      const b = this.physics.world.bounds;
      cam.setBounds(b.x, b.y, b.width, b.height);
    }
  }

  // ---------------------------------------------------------------------------
  // Zones
  // ---------------------------------------------------------------------------

  /**
   * Read zone rectangles from the tilemap's object layer (if available).
   * Falls back to a single default zone covering the whole world.
   */
  _setupZones() {
    if (this._map) {
      try {
        const zoneObjects = this._map.getObjectLayer('Zones');
        if (zoneObjects) {
          this._zones = zoneObjects.objects.map(obj => ({
            name:   obj.name || 'Unknown',
            x:      obj.x,
            y:      obj.y,
            width:  obj.width,
            height: obj.height,
          }));
          return;
        }
      } catch {
        // No Zones layer — use fallback.
      }
    }

    // Default single zone.
    this._zones = [
      { name: 'Copenhagen', x: 0, y: 0, width: 1600, height: 1200 },
    ];
  }

  /**
   * Check whether the player has crossed a zone boundary and fire events.
   *
   * @param {number} px - Player world x.
   * @param {number} py - Player world y.
   */
  _updateZone(px, py) {
    for (const zone of this._zones) {
      if (
        px >= zone.x && px <= zone.x + zone.width &&
        py >= zone.y && py <= zone.y + zone.height
      ) {
        if (zone.name !== this._currentZone) {
          this._currentZone = zone.name;
          // Set both registry keys: PLAYER_LOCATION (task 008) and CURRENT_LOCATION (task 007 UIScene).
          this.registry.set(PLAYER_LOCATION, zone.name);
          this.registry.set(CURRENT_LOCATION, zone.name);
          // Notify UIScene to refresh the location label.
          this.events.emit('zoneupdated', zone.name);
        }
        return;
      }
    }
  }

  // ---------------------------------------------------------------------------
  // Interaction system
  // ---------------------------------------------------------------------------

  /**
   * Register an interactable object (NPC, door, item) in the scene.
   *
   * @param {object} options
   * @param {string}   options.name     - Display name (e.g. "Lars").
   * @param {string}   options.type     - 'talk' | 'enter' | 'examine' | 'pickup'
   * @param {number}   options.x        - World x position.
   * @param {number}   options.y        - World y position.
   * @param {Function} options.callback - Called when the player interacts.
   * @returns {object} The registered interactable entry.
   */
  addInteractable({ name, type = 'talk', x, y, texture = SPRITE_NPC_LARS, callback = () => {} }) {
    const sprite = this.add.sprite(x, y, texture);

    const indicator = this.add.sprite(x, y + INDICATOR_VERTICAL_OFFSET, SPRITE_INDICATOR_EXCLAMATION);
    indicator.setVisible(false);

    const entry = { name, type, x, y, sprite, indicator, callback };
    this._interactables.push(entry);
    return entry;
  }

  /**
   * Update interaction detection: find nearest interactable and handle E key.
   *
   * @param {number} px   - Player world x.
   * @param {number} py   - Player world y.
   * @param {number} time - Scene time (for debounce).
   */
  _updateInteraction(px, py, time) {
    let nearest = null;
    let nearestDist = Infinity;

    for (const entry of this._interactables) {
      const dx = entry.x - px;
      const dy = entry.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < INTERACT_RANGE && dist < nearestDist) {
        nearest = entry;
        nearestDist = dist;
      }
    }

    // Show/hide indicators and update hint every frame to guarantee they stay in sync.
    // Hide the previous nearest's indicator if it changed.
    if (nearest !== this._nearestInteractable) {
      if (this._nearestInteractable?.indicator) {
        this._nearestInteractable.indicator.setVisible(false);
      }
      this._nearestInteractable = nearest;
      if (nearest?.indicator) {
        nearest.indicator.setVisible(true);
      }
      // Notify UIScene with context hint text via registry and event.
      const hint = nearest ? this._buildContextHint(nearest) : null;
      this.registry.set(CONTEXT_HINT, hint ?? '');
      this.events.emit('interactionhint', hint);
    } else if (nearest?.indicator) {
      // Re-assert indicator visibility every frame in case the sprite state drifted.
      nearest.indicator.setVisible(true);
    } else if (!nearest && this.registry.get(CONTEXT_HINT)) {
      // Safety: ensure hint is cleared when nothing is nearby.
      this.registry.set(CONTEXT_HINT, '');
    }

    // Execute interaction on E press.
    if (nearest && this._input?.isInteractJustPressed(time)) {
      // Closed doors suppress the interaction callback.
      if (nearest.type === 'door' && !isDoorOpen(nearest.doorData, this.registry)) {
        return;
      }
      nearest.callback(nearest);
    }
  }

  /**
   * Launch the DialogueScene overlay for an NPC conversation.
   *
   * @param {string} npcId          - NPC identifier (e.g. 'lars').
   * @param {string} conversationId - Registered dialogue ID (e.g. 'lars_welcome').
   */
  _startDialogue(npcId, conversationId) {
    if (!this._dialogueEngine) return;
    this.openOverlay('DialogueScene', {
      npcId,
      conversationId,
      engine: this._dialogueEngine,
    });
  }

  /**
   * Build the context hint string for a given interactable entry.
   *
   * @param {object} entry - Interactable entry with at least `type` and `name`.
   * @returns {string}
   */
  _buildContextHint(entry) {
    switch (entry.type) {
      case 'pickup':
        return `Press E — Pick up ${entry.name}`;
      case 'door':
        return getDoorContextHint(entry.doorData, this.registry);
      case 'talk':
        return `Press E to talk to ${entry.name}`;
      default:
        return `Press E to ${entry.type} ${entry.name}`;
    }
  }

  // ---------------------------------------------------------------------------
  // World collectibles
  // ---------------------------------------------------------------------------

  /**
   * Evaluate the daily collectible manifest and place sprites for uncollected items.
   * Uses WORLD_COLLECTIBLES from the registry if set (allows Task 028 override),
   * otherwise falls back to DEFAULT_COLLECTIBLE_MANIFEST.
   */
  _spawnCollectibles() {
    const manifest     = this.registry.get(WORLD_COLLECTIBLES) ?? DEFAULT_COLLECTIBLE_MANIFEST;
    const collectedIds = getCollectedItems(this.registry);
    const active       = evaluateManifest(manifest, collectedIds);

    for (const def of active) {
      // Draw a simple golden circle as placeholder collectible sprite.
      let sprite = null;
      try {
        const texKey = `_collectible_${def.id}`;
        if (!this.textures?.exists(texKey)) {
          const gfx = this.make?.graphics({ x: 0, y: 0, add: false });
          if (gfx) {
            gfx.fillStyle(0xffdd44, 1);
            gfx.fillCircle(8, 8, 8);
            gfx.generateTexture(texKey, 16, 16);
            gfx.destroy();
          }
        }
        sprite = this.add.sprite(def.x, def.y, texKey);
      } catch {
        // If sprite creation fails (e.g. in tests), continue without sprite.
      }

      const itemData = getItemData(def.itemId);
      const entry = {
        name: itemData?.name ?? def.itemId,
        type: 'pickup',
        x: def.x,
        y: def.y,
        sprite,
        indicator: null,
        collectibleDef: def,
        callback: (e) => this._handlePickup(e),
      };
      this._interactables.push(entry);
    }
  }

  /**
   * Handle a collectible pickup: animate sprite, add item, show toast if needed.
   *
   * @param {object} entry - The interactable entry for this collectible.
   */
  _handlePickup(entry) {
    const { collectibleDef, sprite } = entry;

    const result = collectItem(this.registry, collectibleDef);
    if (!result.success) return;

    // Remove from interactables immediately so double-pickup is impossible.
    this._interactables = this._interactables.filter(e => e !== entry);
    if (this._nearestInteractable === entry) {
      this._nearestInteractable = null;
      this.registry.set(CONTEXT_HINT, '');
    }

    // Animate sprite float-up + fade-out, then destroy.
    if (sprite) {
      try {
        if (this.tweens) {
          this.tweens.add({
            targets: sprite,
            y: sprite.y - 24,
            alpha: 0,
            duration: 500,
            onComplete: () => sprite.destroy(),
          });
        } else {
          sprite.destroy();
        }
      } catch {
        sprite.destroy?.();
      }
    }

    // Play category-specific pickup sound.
    try {
      const itemData = getItemData(collectibleDef.itemId);
      const soundKey = getPickupSound(itemData);
      this.sound?.play?.(soundKey, { volume: 0.7 });
    } catch { /* Audio not critical */ }

    // Show first-pickup tooltip notification.
    if (result.firstPickup && collectibleDef.tooltip) {
      try {
        this.events.emit('notification', {
          message: collectibleDef.tooltip,
          duration: 4000,
        });
      } catch { /* UI not critical */ }
    }
  }

  // ---------------------------------------------------------------------------
  // Building doors
  // ---------------------------------------------------------------------------

  /**
   * Place door interactables for each door in DEFAULT_DOORS (or a registry override).
   * Each door gets a coloured frame drawn with Phaser Graphics that pulses green
   * when open and glows amber when closed, visible within 2× INTERACT_RANGE.
   */
  _spawnDoors() {
    for (const door of DEFAULT_DOORS) {
      // Create a Graphics object for the door frame indicator.
      let doorFrame = null;
      try {
        doorFrame = this.add.graphics();
        if (doorFrame?.setAlpha) doorFrame.setAlpha(0);
      } catch { /* non-critical */ }

      const entry = {
        name: door.label,
        type: 'door',
        x: door.x,
        y: door.y,
        sprite: null,
        indicator: null,
        doorFrame,
        doorData: door,
        callback: (e) => this._handleDoorEntry(e.doorData),
      };
      this._interactables.push(entry);
    }
  }

  /**
   * Update door frame visibility and colour based on player proximity.
   * Frames become visible at 2× INTERACT_RANGE (128 px); colour reflects open state.
   *
   * @param {number} px - Player world x.
   * @param {number} py - Player world y.
   */
  _updateDoorFrames(px, py) {
    const DOOR_VISUAL_RANGE = INTERACT_RANGE * 2;

    for (const entry of this._interactables) {
      if (entry.type !== 'door' || !entry.doorFrame) continue;

      const dx   = entry.x - px;
      const dy   = entry.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist >= DOOR_VISUAL_RANGE) {
        try { entry.doorFrame.setAlpha(0); } catch { /* non-critical */ }
        continue;
      }

      try {
        const open  = isDoorOpen(entry.doorData, this.registry);
        const color = open ? 0x44ff44 : 0xffaa00;

        entry.doorFrame.clear();
        entry.doorFrame.lineStyle(3, color, 1);
        entry.doorFrame.strokeRect(entry.x - 12, entry.y - 20, 24, 20);
        entry.doorFrame.setAlpha(0.8);
      } catch { /* non-critical */ }
    }
  }

  /**
   * Launch the target scene for a door entry.
   *
   * @param {object} door - Door definition.
   */
  _handleDoorEntry(door) {
    if (!isDoorOpen(door, this.registry)) return;

    try {
      this.sound?.play?.('sfx_door_open', { volume: 0.8 });
    } catch { /* non-critical */ }

    this.scene.launch(door.targetScene, door.targetData);

    // Restore input when the launched scene closes.
    this.scene.get(door.targetScene)?.events?.once('shutdown', () => {
      try {
        this.sound?.play?.('sfx_door_close', { volume: 0.6 });
      } catch { /* non-critical */ }
      this._input?.unblockInput?.();
    });

    this._input?.blockInput?.();
  }

  /**
   * Add collision between the player and the collision layer.
   * Call after both the tilemap and player physics body are set up.
   */
  _addCollision() {
    if (!this._collisionLayer || !this._player?.sprite) return;
    if (this.physics?.add?.collider) {
      this.physics.add.collider(this._player.sprite, this._collisionLayer);
    }
  }

  // ---------------------------------------------------------------------------
  // Procedural world helpers
  // ---------------------------------------------------------------------------

  /**
   * Darken a 0xRRGGBB colour value by subtracting `amount` from each channel.
   * @param {number} hex    - 24-bit colour integer.
   * @param {number} amount - Amount to subtract (0–255).
   * @returns {number}
   */
  _darkenColor(hex, amount = 35) {
    const r = Math.max(0, ((hex >> 16) & 0xff) - amount);
    const g = Math.max(0, ((hex >> 8)  & 0xff) - amount);
    const b = Math.max(0, (hex         & 0xff) - amount);
    return (r << 16) | (g << 8) | b;
  }

  /**
   * Draw a stylised tree (trunk + layered canopy) at world position (cx, cy).
   * @param {Phaser.GameObjects.Graphics} gfx
   * @param {number} cx  - Centre x.
   * @param {number} cy  - Centre y (top of canopy).
   * @param {number} r   - Canopy radius.
   */
  _drawTree(gfx, cx, cy, r) {
    // Shadow
    gfx.fillStyle(0x000000, 0.18);
    gfx.fillEllipse(cx + 4, cy + r + 6, r * 1.6, r * 0.5);
    // Trunk
    gfx.fillStyle(0x6b4920);
    gfx.fillRect(cx - 3, cy + r - 2, 6, Math.ceil(r * 0.8));
    // Canopy layers (depth)
    gfx.fillStyle(0x2a8a38);
    gfx.fillCircle(cx - 2, cy + 3, r * 0.75);
    gfx.fillCircle(cx + 2, cy + 3, r * 0.75);
    gfx.fillStyle(0x3aaa4a);
    gfx.fillCircle(cx, cy, r);
    gfx.fillStyle(0x6acc68);
    gfx.fillCircle(cx - Math.ceil(r * 0.25), cy - Math.ceil(r * 0.25), Math.ceil(r * 0.45));
  }

  /**
   * Draw a building rectangle with roof band, windows and a door.
   * @param {Phaser.GameObjects.Graphics} gfx
   * @param {number}  x
   * @param {number}  y
   * @param {number}  w
   * @param {number}  h
   * @param {number}  color   - 24-bit facade colour.
   * @param {boolean} isShop  - Use larger shop-style windows.
   */
  _drawBuilding(gfx, x, y, w, h, color, isShop = false) {
    // Facade
    gfx.fillStyle(color);
    gfx.fillRect(x, y, w, h);
    // Roof band
    gfx.fillStyle(this._darkenColor(color, 35));
    gfx.fillRect(x, y, w, 7);

    // Windows
    const winColor = 0x8cc0e8;
    const winW = isShop ? Math.min(36, Math.floor((w - 20) / Math.max(1, Math.floor((w - 10) / 44)))) : 12;
    const winH = isShop ? Math.min(24, h - 20) : 12;
    const cols = Math.max(1, Math.floor((w - 10) / (winW + 8)));
    const rows = isShop ? 1 : Math.max(1, Math.floor((h - 22) / (winH + 8)));
    const totalW = cols * winW + (cols - 1) * 8;
    const startX = x + Math.floor((w - totalW) / 2);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const wx = startX + col * (winW + 8);
        const wy = isShop
          ? y + Math.floor((h - winH) / 2)
          : y + 12 + row * (winH + 8);
        if (wy + winH < y + h - 4) {
          gfx.fillStyle(winColor);
          gfx.fillRect(wx, wy, winW, winH);
          // Window frame shadow
          gfx.fillStyle(this._darkenColor(winColor, 30));
          gfx.fillRect(wx, wy, winW, 2);
          gfx.fillRect(wx, wy, 2, winH);
        }
      }
    }

    // Door
    const doorW = isShop ? 16 : 10;
    const doorH = isShop ? 22 : 16;
    const doorX = x + Math.floor(w / 2) - Math.floor(doorW / 2);
    const doorY = y + h - doorH;
    gfx.fillStyle(0x5a3a20);
    gfx.fillRect(doorX, doorY, doorW, doorH);
    // Handle
    gfx.fillStyle(0xffe040);
    gfx.fillCircle(doorX + doorW - 3, doorY + Math.floor(doorH / 2), 2);

    // Outline
    gfx.lineStyle(1, 0x000000, 0.2);
    gfx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  }

  // ---------------------------------------------------------------------------
  // NPC spawning
  // ---------------------------------------------------------------------------

  /**
   * Spawn the three starter NPCs at fixed world positions.
   */
  _spawnNPCs() {
    // Lars — near Super Brugsen (Block B, north side near road)
    this.addInteractable({
      name: 'Lars',
      type: 'talk',
      x: 558,
      y: 295,
      texture: SPRITE_NPC_LARS,
      callback: () => this._startDialogue('lars', 'lars_day1_tutorial'),
    });

    // Anna — in Nørreport Torv central square near the fountain
    this.addInteractable({
      name: 'Anna',
      type: 'talk',
      x: 470,
      y: 490,
      texture: SPRITE_NPC_ANNA,
      callback: () => this._startDialogue('anna', 'thomas_first_meeting'),
    });

    // Mette — outside the Cykelbutik bike shop
    this.addInteractable({
      name: 'Mette',
      type: 'talk',
      x: 455,
      y: 720,
      texture: SPRITE_NPC_METTE,
      callback: () => this._startDialogue('mette', 'mette_shopping'),
    });
  }

  // ---------------------------------------------------------------------------
  // Registry & systems initialisation
  // ---------------------------------------------------------------------------

  /**
   * Populate any registry keys that are still unset so the HUD has valid
   * data from the first frame.  Does not overwrite values set by
   * initializeNewGame() or loadGame().
   */
  _ensureRegistryDefaults() {
    const reg = this.registry;
    if (reg.get(PLAYER_HEALTH)   == null) reg.set(PLAYER_HEALTH,   100);
    if (reg.get(PLAYER_ENERGY)   == null) reg.set(PLAYER_ENERGY,   100);
    if (reg.get(PLAYER_MONEY)    == null) reg.set(PLAYER_MONEY,    500);
    if (reg.get(PLAYER_XP)       == null) reg.set(PLAYER_XP,         0);
    if (reg.get(PLAYER_LEVEL)    == null) reg.set(PLAYER_LEVEL,       1);
    if (reg.get(CURRENT_DAY)     == null) reg.set(CURRENT_DAY,        1);
    if (reg.get(TIME_OF_DAY)     == null) reg.set(TIME_OF_DAY,  'morning');
    if (reg.get(SEASON)          == null) reg.set(SEASON,        'spring');
    if (reg.get(CURRENT_LOCATION)== null) reg.set(CURRENT_LOCATION, 'Copenhagen');
  }

  /**
   * Initialise day-cycle tracking and apply the first day's weather.
   * Wrapped in try/catch so a missing import never breaks the scene.
   */
  _initGameSystems() {
    try {
      initDayCycle(this.registry);
      const season = this.registry.get(SEASON) || 'spring';
      applyDailyWeather(this.registry, season);
    } catch (err) {
      console.warn('[GameScene] Could not initialise game systems:', err);
    }
  }
}
