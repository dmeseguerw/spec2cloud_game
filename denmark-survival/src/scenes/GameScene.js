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
import { TILEMAP_TEST, TILESET_CITY } from '../constants/AssetKeys.js';
import {
  PLAYER_X, PLAYER_Y, PLAYER_SCENE, PLAYER_LOCATION,
} from '../constants/RegistryKeys.js';

/** Default spawn position when no saved position exists. */
const DEFAULT_SPAWN_X = 400;
const DEFAULT_SPAWN_Y = 300;

/** Distance (px) within which an interactable object is considered "nearby". */
const INTERACT_RANGE = 64;

export class GameScene extends BaseScene {
  constructor() {
    super({ key: 'GameScene' });

    /** @type {Player|null} */
    this._player = null;

    /** @type {InputManager|null} */
    this._input = null;

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

    // Determine spawn position from registry (persist across scene transitions).
    const spawnX = this.registry.get(PLAYER_X) || DEFAULT_SPAWN_X;
    const spawnY = this.registry.get(PLAYER_Y) || DEFAULT_SPAWN_Y;

    // ── Tilemap ──────────────────────────────────────────────────────────────
    this._buildWorld(spawnX, spawnY);

    // ── InputManager ─────────────────────────────────────────────────────────
    this._input = new InputManager(this);

    // ── Player ───────────────────────────────────────────────────────────────
    this._player = new Player(this, spawnX, spawnY);

    // ── Camera ───────────────────────────────────────────────────────────────
    this._setupCamera();

    // ── Zones ────────────────────────────────────────────────────────────────
    this._setupZones();

    // ── HUD overlay ──────────────────────────────────────────────────────────
    this.scene.launch('UIScene');

    // Persist which scene the player is in.
    this.registry.set(PLAYER_SCENE, 'GameScene');

    // Block input when an overlay opens; unblock when it closes.
    this.events.on('overlayopened', () => this._input?.blockInput());
    this.events.on('overlayclosed', () => this._input?.unblockInput());
  }

  update(time, delta) {
    if (!this._player || !this._input) return;

    // Feed input to player.
    const movementInput = this._input.getMovementInput();
    this._player.update(movementInput);

    // Persist player position to registry.
    const { x, y } = this._player.getPosition();
    this.registry.set(PLAYER_X, Math.round(x));
    this.registry.set(PLAYER_Y, Math.round(y));

    // Zone detection.
    this._updateZone(x, y);

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
   * Create a simple coloured backdrop when the real tilemap is unavailable.
   */
  _createFallbackWorld() {
    const worldW = 1600;
    const worldH = 1200;
    this.add.rectangle(worldW / 2, worldH / 2, worldW, worldH, 0x3a5a3a);
    if (this.physics?.world) {
      this.physics.world.setBounds(0, 0, worldW, worldH);
    }
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
          this.registry.set(PLAYER_LOCATION, zone.name);
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
  addInteractable({ name, type = 'talk', x, y, callback = () => {} }) {
    const sprite = this.add.sprite(x, y, 'sprite_npc_lars');

    const indicator = this.add.sprite(x, y - 32, 'sprite_indicator_exclamation');
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

    // Show/hide indicators and update nearest reference.
    if (nearest !== this._nearestInteractable) {
      if (this._nearestInteractable?.indicator) {
        this._nearestInteractable.indicator.setVisible(false);
      }
      this._nearestInteractable = nearest;

      if (nearest?.indicator) {
        nearest.indicator.setVisible(true);
      }

      // Notify UIScene with context hint text.
      const hint = nearest
        ? `Press E to ${nearest.type === 'talk' ? 'talk to' : nearest.type} ${nearest.name}`
        : null;
      this.events.emit('interactionhint', hint);
    }

    // Execute interaction on E press.
    if (nearest && this._input?.isInteractJustPressed(time)) {
      nearest.callback(nearest);
    }
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
}
