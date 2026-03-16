/**
 * src/entities/Player.js
 * Player character entity for the Denmark Survival top-down world.
 *
 * Responsibilities:
 *  - Create and manage a physics-enabled sprite
 *  - 8-directional movement with diagonal speed normalisation
 *  - Facing direction tracking (last movement direction)
 *  - Interaction zone detection (rectangular area in front of player)
 *  - Animation state management (idle / walk per direction)
 */

/** Base walking speed in pixels per second. */
export const PLAYER_SPEED = 100;

/** Width/height of the interaction zone (pixels). */
export const INTERACTION_ZONE_SIZE = 24;

/** Distance from player centre the interaction zone is placed. */
export const INTERACTION_ZONE_OFFSET = 28;

/**
 * Valid facing directions.
 * @typedef {'down'|'up'|'left'|'right'|'down-left'|'down-right'|'up-left'|'up-right'} Direction
 */

export class Player {
  /**
   * @param {Phaser.Scene} scene  - The owning scene.
   * @param {number}       x      - Initial world x position.
   * @param {number}       y      - Initial world y position.
   * @param {string}       texture - Spritesheet key (default: SPRITE_PLAYER).
   */
  constructor(scene, x, y, texture = 'sprite_player') {
    this.scene = scene;

    // Create physics-enabled sprite via Arcade physics factory.
    // Falls back gracefully when physics is unavailable (e.g. tests).
    if (scene.physics && scene.physics.add) {
      this.sprite = scene.physics.add.sprite(x, y, texture);
      if (this.sprite.body) {
        this.sprite.body.setCollideWorldBounds(true);
      }
    } else {
      // Fallback: plain display object for test environments.
      this.sprite = scene.add ? scene.add.sprite(x, y, texture) : { x, y, body: null };
    }

    /** Current facing direction. Defaults to 'down'. */
    this._facing = 'down';

    /** Whether the player is currently moving. */
    this._isMoving = false;

    /** Walking speed in pixels per second. */
    this.speed = PLAYER_SPEED;

    // Register walk and idle animations if the animation manager exists.
    this._registerAnimations();
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  /**
   * Update player movement and animation based on input.
   * Call this every frame from the scene's update().
   *
   * @param {{ left: boolean, right: boolean, up: boolean, down: boolean }} input
   *   Normalized directional booleans from InputManager.
   * @param {number} [delta=16.67] - Time since last frame in milliseconds (from scene update).
   */
  update(input, delta = 1000 / 60) {
    const { left, right, up, down } = input;

    let vx = 0;
    let vy = 0;

    if (left)  vx -= 1;
    if (right) vx += 1;
    if (up)    vy -= 1;
    if (down)  vy += 1;

    // Diagonal normalization — maintain constant speed in all directions.
    if (vx !== 0 && vy !== 0) {
      const INV_SQRT2 = 0.7071067811865476;
      vx *= INV_SQRT2;
      vy *= INV_SQRT2;
    }

    const finalVx = vx * this.speed;
    const finalVy = vy * this.speed;

    this._isMoving = (vx !== 0 || vy !== 0);

    // Apply velocity to physics body when available.
    if (this.sprite.body && typeof this.sprite.body.setVelocity === 'function') {
      this.sprite.body.setVelocity(finalVx, finalVy);
    } else {
      // No physics body — update position using delta time (test / fallback mode).
      this.sprite.x += (finalVx * delta) / 1000;
      this.sprite.y += (finalVy * delta) / 1000;
    }

    // Update facing direction from input.
    if (this._isMoving) {
      this._facing = this._directionFromInput(vx, vy);
    }

    // Play appropriate animation.
    this._updateAnimation();
  }

  /**
   * Current facing direction of the player.
   * @returns {Direction}
   */
  getFacing() {
    return this._facing;
  }

  /**
   * Whether the player is currently moving.
   * @returns {boolean}
   */
  isMoving() {
    return this._isMoving;
  }

  /**
   * World position of the player sprite.
   * @returns {{ x: number, y: number }}
   */
  getPosition() {
    return { x: this.sprite.x, y: this.sprite.y };
  }

  /**
   * Compute the interaction zone rectangle positioned in front of the player.
   * Returns an object with { x, y, width, height } in world coordinates.
   *
   * @returns {{ x: number, y: number, width: number, height: number }}
   */
  getInteractionZone() {
    const cx = this.sprite.x;
    const cy = this.sprite.y;
    const half = INTERACTION_ZONE_SIZE / 2;
    const offset = INTERACTION_ZONE_OFFSET;

    let ox = 0;
    let oy = 0;

    switch (this._facing) {
      case 'up':         oy = -offset; break;
      case 'down':       oy =  offset; break;
      case 'left':       ox = -offset; break;
      case 'right':      ox =  offset; break;
      case 'up-left':    ox = -offset * 0.7071; oy = -offset * 0.7071; break;
      case 'up-right':   ox =  offset * 0.7071; oy = -offset * 0.7071; break;
      case 'down-left':  ox = -offset * 0.7071; oy =  offset * 0.7071; break;
      case 'down-right': ox =  offset * 0.7071; oy =  offset * 0.7071; break;
    }

    return {
      x:      cx + ox - half,
      y:      cy + oy - half,
      width:  INTERACTION_ZONE_SIZE,
      height: INTERACTION_ZONE_SIZE,
    };
  }

  /**
   * Check whether a point (wx, wy) lies within the player's interaction zone.
   *
   * @param {number} wx - World x of the candidate point.
   * @param {number} wy - World y of the candidate point.
   * @returns {boolean}
   */
  isInInteractionZone(wx, wy) {
    const zone = this.getInteractionZone();
    return (
      wx >= zone.x &&
      wx <= zone.x + zone.width &&
      wy >= zone.y &&
      wy <= zone.y + zone.height
    );
  }

  /**
   * Destroy the player sprite and clean up resources.
   */
  destroy() {
    if (this.sprite && typeof this.sprite.destroy === 'function') {
      this.sprite.destroy();
    }
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  /**
   * Derive a facing direction string from normalised velocity components.
   *
   * @param {number} vx - Normalised x velocity (-1, 0, 1 or fractional diagonal).
   * @param {number} vy - Normalised y velocity.
   * @returns {Direction}
   */
  _directionFromInput(vx, vy) {
    if (vx < 0 && vy < 0) return 'up-left';
    if (vx > 0 && vy < 0) return 'up-right';
    if (vx < 0 && vy > 0) return 'down-left';
    if (vx > 0 && vy > 0) return 'down-right';
    if (vy < 0) return 'up';
    if (vy > 0) return 'down';
    if (vx < 0) return 'left';
    return 'right';
  }

  /**
   * Play the correct idle or walk animation based on movement state.
   * Silently skips if the animation manager is unavailable.
   */
  _updateAnimation() {
    if (!this.sprite || typeof this.sprite.play !== 'function') return;

    // Map diagonal facing to cardinal for animation lookup.
    const cardinalFacing = this._toCardinalFacing(this._facing);
    const animKey = this._isMoving
      ? `player_walk_${cardinalFacing}`
      : `player_idle_${cardinalFacing}`;

    if (this.sprite.anims && this.sprite.anims.currentAnim?.key === animKey) return;
    this.sprite.play(animKey, true);
  }

  /**
   * Reduce a diagonal direction to its primary cardinal direction.
   *
   * @param {Direction} dir
   * @returns {'up'|'down'|'left'|'right'}
   */
  _toCardinalFacing(dir) {
    if (dir.includes('up'))    return 'up';
    if (dir.includes('down'))  return 'down';
    if (dir.includes('left'))  return 'left';
    return 'right';
  }

  /**
   * Register placeholder walk/idle animations if the animation manager exists.
   * Actual frame data is assumed to be defined in BootScene during asset loading.
   */
  _registerAnimations() {
    const anims = this.scene.anims;
    if (!anims || typeof anims.exists !== 'function') return;

    const directions = ['down', 'up', 'left', 'right'];
    for (const dir of directions) {
      const walkKey = `player_walk_${dir}`;
      const idleKey = `player_idle_${dir}`;
      if (!anims.exists(walkKey)) {
        anims.create({
          key:        walkKey,
          frames:     anims.generateFrameNumbers('sprite_player', { start: 0, end: 3 }),
          frameRate:  8,
          repeat:     -1,
        });
      }
      if (!anims.exists(idleKey)) {
        anims.create({
          key:        idleKey,
          frames:     anims.generateFrameNumbers('sprite_player', { start: 0, end: 0 }),
          frameRate:  1,
          repeat:     -1,
        });
      }
    }
  }
}
