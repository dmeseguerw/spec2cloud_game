/**
 * tests/entities/Player.test.js
 * Unit tests for Player entity.
 *
 * Coverage target: ≥85% of src/entities/Player.js
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { Player, PLAYER_SPEED, INTERACTION_ZONE_SIZE, INTERACTION_ZONE_OFFSET } from '../../src/entities/Player.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/** Minimal physics body mock. */
function makeBody() {
  let vx = 0;
  let vy = 0;
  return {
    setCollideWorldBounds: () => {},
    setVelocity(x, y) { vx = x; vy = y; },
    getVelocity() { return { x: vx, y: vy }; },
    get vx() { return vx; },
    get vy() { return vy; },
  };
}

/** Minimal sprite mock with physics body. */
function makeSprite(x = 0, y = 0) {
  const body = makeBody();
  return {
    x,
    y,
    body,
    anims: { currentAnim: null },
    play(key, _ignoreIfPlaying) {
      this.anims.currentAnim = { key };
    },
    destroy() {},
  };
}

/** Build a minimal scene that supplies physics.add.sprite and anims. */
function makeScene(spawnX = 100, spawnY = 100) {
  const sprite = makeSprite(spawnX, spawnY);
  return {
    _sprite: sprite,
    physics: {
      add: {
        sprite(_x, _y, _tex) { return sprite; },
      },
    },
    add: {
      sprite(_x, _y, _tex) { return sprite; },
    },
    anims: {
      _keys: new Set(),
      exists(key) { return this._keys.has(key); },
      create({ key }) { this._keys.add(key); },
      generateFrameNumbers() { return []; },
    },
  };
}

/** Create a Player with a mocked scene. */
function buildPlayer(x = 100, y = 100) {
  const scene = makeScene(x, y);
  const player = new Player(scene, x, y);
  return { player, scene };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Player — construction', () => {
  it('creates a sprite at the given position', () => {
    const { player } = buildPlayer(200, 300);
    expect(player.sprite).toBeDefined();
    expect(player.sprite.x).toBe(200);
    expect(player.sprite.y).toBe(300);
  });

  it('defaults facing to "down"', () => {
    const { player } = buildPlayer();
    expect(player.getFacing()).toBe('down');
  });

  it('uses PLAYER_SPEED as default speed', () => {
    const { player } = buildPlayer();
    expect(player.speed).toBe(PLAYER_SPEED);
  });

  it('is not moving initially', () => {
    const { player } = buildPlayer();
    expect(player.isMoving()).toBe(false);
  });
});

describe('Player — cardinal movement speed', () => {
  it('moves right at full speed', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: true, up: false, down: false });
    const body = player.sprite.body;
    expect(body.vx).toBeCloseTo(PLAYER_SPEED);
    expect(body.vy).toBeCloseTo(0);
  });

  it('moves left at full speed', () => {
    const { player } = buildPlayer();
    player.update({ left: true, right: false, up: false, down: false });
    const body = player.sprite.body;
    expect(body.vx).toBeCloseTo(-PLAYER_SPEED);
    expect(body.vy).toBeCloseTo(0);
  });

  it('moves up at full speed', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: false, up: true, down: false });
    const body = player.sprite.body;
    expect(body.vx).toBeCloseTo(0);
    expect(body.vy).toBeCloseTo(-PLAYER_SPEED);
  });

  it('moves down at full speed', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: false, up: false, down: true });
    const body = player.sprite.body;
    expect(body.vx).toBeCloseTo(0);
    expect(body.vy).toBeCloseTo(PLAYER_SPEED);
  });
});

describe('Player — diagonal speed normalisation', () => {
  const EXPECTED = PLAYER_SPEED * Math.SQRT1_2;

  it('down-right diagonal equals cardinal speed in magnitude', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: true, up: false, down: true });
    const body = player.sprite.body;
    const magnitude = Math.sqrt(body.vx ** 2 + body.vy ** 2);
    expect(magnitude).toBeCloseTo(PLAYER_SPEED);
  });

  it('up-left diagonal equals cardinal speed in magnitude', () => {
    const { player } = buildPlayer();
    player.update({ left: true, right: false, up: true, down: false });
    const body = player.sprite.body;
    const magnitude = Math.sqrt(body.vx ** 2 + body.vy ** 2);
    expect(magnitude).toBeCloseTo(PLAYER_SPEED);
  });

  it('diagonal components are ~√0.5 × speed', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: true, up: true, down: false });
    const body = player.sprite.body;
    expect(Math.abs(body.vx)).toBeCloseTo(EXPECTED);
    expect(Math.abs(body.vy)).toBeCloseTo(EXPECTED);
  });

  it('diagonal speed does not exceed cardinal speed', () => {
    const { player } = buildPlayer();
    player.update({ left: true, right: false, up: false, down: true });
    const body = player.sprite.body;
    const magnitude = Math.sqrt(body.vx ** 2 + body.vy ** 2);
    expect(magnitude).toBeLessThanOrEqual(PLAYER_SPEED + 0.001);
  });
});

describe('Player — facing direction', () => {
  it('faces right after moving right', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: true, up: false, down: false });
    expect(player.getFacing()).toBe('right');
  });

  it('faces left after moving left', () => {
    const { player } = buildPlayer();
    player.update({ left: true, right: false, up: false, down: false });
    expect(player.getFacing()).toBe('left');
  });

  it('faces up after moving up', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: false, up: true, down: false });
    expect(player.getFacing()).toBe('up');
  });

  it('faces down after moving down', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: false, up: false, down: true });
    expect(player.getFacing()).toBe('down');
  });

  it('faces down-right on diagonal', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: true, up: false, down: true });
    expect(player.getFacing()).toBe('down-right');
  });

  it('faces up-left on diagonal', () => {
    const { player } = buildPlayer();
    player.update({ left: true, right: false, up: true, down: false });
    expect(player.getFacing()).toBe('up-left');
  });

  it('retains last facing when no keys pressed', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: true, up: false, down: false }); // right
    player.update({ left: false, right: false, up: false, down: false }); // stop
    expect(player.getFacing()).toBe('right');
  });

  it('all 8 directions produce distinct facing strings', () => {
    const cases = [
      { left: true,  right: false, up: false, down: false },
      { left: false, right: true,  up: false, down: false },
      { left: false, right: false, up: true,  down: false },
      { left: false, right: false, up: false, down: true  },
      { left: true,  right: false, up: true,  down: false },
      { left: true,  right: false, up: false, down: true  },
      { left: false, right: true,  up: true,  down: false },
      { left: false, right: true,  up: false, down: true  },
    ];
    const { player } = buildPlayer();
    const directions = cases.map(input => {
      player.update(input);
      return player.getFacing();
    });
    expect(new Set(directions).size).toBe(8);
  });
});

describe('Player — isMoving flag', () => {
  it('is true when any direction key is pressed', () => {
    const { player } = buildPlayer();
    player.update({ left: true, right: false, up: false, down: false });
    expect(player.isMoving()).toBe(true);
  });

  it('is false when no keys are pressed', () => {
    const { player } = buildPlayer();
    player.update({ left: false, right: false, up: false, down: false });
    expect(player.isMoving()).toBe(false);
  });
});

describe('Player — interaction zone', () => {
  it('returns a zone rectangle', () => {
    const { player } = buildPlayer(100, 100);
    const zone = player.getInteractionZone();
    expect(zone).toHaveProperty('x');
    expect(zone).toHaveProperty('y');
    expect(zone.width).toBe(INTERACTION_ZONE_SIZE);
    expect(zone.height).toBe(INTERACTION_ZONE_SIZE);
  });

  it('zone is in front of the player (below when facing down)', () => {
    const { player } = buildPlayer(100, 100);
    player.update({ left: false, right: false, up: false, down: true }); // face down
    player.update({ left: false, right: false, up: false, down: false }); // stop
    const zone = player.getInteractionZone();
    // Zone centre y should be below player y when facing down.
    const zoneCentreY = zone.y + zone.height / 2;
    expect(zoneCentreY).toBeGreaterThan(100);
  });

  it('zone is above the player when facing up', () => {
    const { player } = buildPlayer(100, 100);
    player.update({ left: false, right: false, up: true, down: false });
    player.update({ left: false, right: false, up: false, down: false });
    const zone = player.getInteractionZone();
    const zoneCentreY = zone.y + zone.height / 2;
    expect(zoneCentreY).toBeLessThan(100);
  });

  it('detects a point within the interaction zone', () => {
    const { player } = buildPlayer(100, 100);
    player.update({ left: false, right: false, up: false, down: true }); // face down
    player.update({ left: false, right: false, up: false, down: false });
    const zone = player.getInteractionZone();
    const midX = zone.x + zone.width / 2;
    const midY = zone.y + zone.height / 2;
    expect(player.isInInteractionZone(midX, midY)).toBe(true);
  });

  it('ignores a point outside the interaction zone', () => {
    const { player } = buildPlayer(100, 100);
    // Point far away.
    expect(player.isInInteractionZone(500, 500)).toBe(false);
  });

  it('detects points in all cardinal zone positions', () => {
    const dirs = [
      { input: { left: false, right: true,  up: false, down: false }, label: 'right' },
      { input: { left: true,  right: false, up: false, down: false }, label: 'left'  },
      { input: { left: false, right: false, up: true,  down: false }, label: 'up'    },
      { input: { left: false, right: false, up: false, down: true  }, label: 'down'  },
    ];
    for (const { input, label } of dirs) {
      const { player } = buildPlayer(100, 100);
      player.update(input);
      player.update({ left: false, right: false, up: false, down: false });
      const zone = player.getInteractionZone();
      const midX = zone.x + zone.width / 2;
      const midY = zone.y + zone.height / 2;
      expect(player.isInInteractionZone(midX, midY), `${label} zone mid-point should be inside`).toBe(true);
    }
  });
});

describe('Player — position', () => {
  it('getPosition returns sprite coordinates', () => {
    const { player } = buildPlayer(42, 84);
    const pos = player.getPosition();
    expect(pos.x).toBe(42);
    expect(pos.y).toBe(84);
  });
});

describe('Player — destroy', () => {
  it('calls destroy on the sprite', () => {
    const { player } = buildPlayer();
    let destroyed = false;
    player.sprite.destroy = () => { destroyed = true; };
    player.destroy();
    expect(destroyed).toBe(true);
  });
});

describe('Player — diagonal interaction zone positions', () => {
  const diagonals = [
    { input: { left: true,  right: false, up: true,  down: false }, label: 'up-left'    },
    { input: { left: false, right: true,  up: true,  down: false }, label: 'up-right'   },
    { input: { left: true,  right: false, up: false, down: true  }, label: 'down-left'  },
    { input: { left: false, right: true,  up: false, down: true  }, label: 'down-right' },
  ];

  for (const { input, label } of diagonals) {
    it(`zone is offset in diagonal direction: ${label}`, () => {
      const { player } = buildPlayer(100, 100);
      player.update(input);
      player.update({ left: false, right: false, up: false, down: false });
      expect(player.getFacing()).toBe(label);
      const zone = player.getInteractionZone();
      // Zone should be non-zero offset from player centre.
      const cx = zone.x + zone.width / 2;
      const cy = zone.y + zone.height / 2;
      expect(cx).not.toBeCloseTo(100);
      expect(cy).not.toBeCloseTo(100);
      // Mid-point of the zone should be inside it.
      expect(player.isInInteractionZone(cx, cy)).toBe(true);
    });
  }
});

describe('Player — fallback (no physics)', () => {
  it('creates via scene.add.sprite when physics is unavailable', () => {
    const sprite = makeSprite(50, 75);
    const scene = {
      _sprite: sprite,
      add: { sprite(_x, _y) { return sprite; } },
      anims: {
        _keys: new Set(),
        exists(k) { return this._keys.has(k); },
        create({ key }) { this._keys.add(key); },
        generateFrameNumbers() { return []; },
      },
    };
    const player = new Player(scene, 50, 75);
    expect(player.sprite).toBeDefined();
  });

  it('updates position directly (no physics body setVelocity)', () => {
    const sprite = { x: 50, y: 75, anims: { currentAnim: null }, play() {}, destroy() {} };
    const scene = {
      add: { sprite(_x, _y) { return sprite; } },
      anims: {
        _keys: new Set(),
        exists(k) { return this._keys.has(k); },
        create({ key }) { this._keys.add(key); },
        generateFrameNumbers() { return []; },
      },
    };
    const player = new Player(scene, 50, 75);
    const origX = player.sprite.x;
    player.update({ left: false, right: true, up: false, down: false });
    // Position should have changed (moved right).
    expect(player.sprite.x).toBeGreaterThan(origX);
  });
});
