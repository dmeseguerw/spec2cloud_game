/**
 * tests/data/AssetKeys.test.js
 * Validates asset key constants.
 */

import { describe, it, expect } from 'vitest';
import * as AK from '../../src/constants/AssetKeys.js';

describe('AssetKeys', () => {
  it('exports all sprite keys as strings', () => {
    expect(typeof AK.SPRITE_PLAYER).toBe('string');
    expect(typeof AK.SPRITE_NPC_ANNA).toBe('string');
    expect(typeof AK.SPRITE_NPC_LARS).toBe('string');
    expect(typeof AK.SPRITE_NPC_METTE).toBe('string');
    expect(typeof AK.SPRITE_INDICATOR_EXCLAMATION).toBe('string');
    expect(typeof AK.SPRITE_INDICATOR_QUESTION).toBe('string');
  });

  it('exports all tileset keys as strings', () => {
    expect(typeof AK.TILESET_CITY).toBe('string');
    expect(typeof AK.TILESET_INTERIOR).toBe('string');
    expect(typeof AK.TILESET_NATURE).toBe('string');
  });

  it('exports tilemap key as string', () => {
    expect(typeof AK.TILEMAP_TEST).toBe('string');
  });

  it('exports all UI keys as strings', () => {
    for (const key of AK.ALL_UI) {
      expect(typeof key).toBe('string');
    }
  });

  it('exports all music keys as strings', () => {
    for (const key of AK.ALL_MUSIC) {
      expect(typeof key).toBe('string');
    }
  });

  it('exports all SFX keys as strings', () => {
    for (const key of AK.ALL_SFX) {
      expect(typeof key).toBe('string');
    }
  });

  it('has no duplicate keys across all categories', () => {
    const allKeys = [
      ...AK.ALL_SPRITES,
      ...AK.ALL_TILESETS,
      AK.TILEMAP_TEST,
      ...AK.ALL_UI,
      ...AK.ALL_MUSIC,
      ...AK.ALL_SFX,
    ];
    const unique = new Set(allKeys);
    expect(unique.size).toBe(allKeys.length);
  });

  it('ALL_SPRITES contains exactly the sprite constants', () => {
    expect(AK.ALL_SPRITES).toContain(AK.SPRITE_PLAYER);
    expect(AK.ALL_SPRITES).toContain(AK.SPRITE_NPC_ANNA);
    expect(AK.ALL_SPRITES).toContain(AK.SPRITE_NPC_LARS);
    expect(AK.ALL_SPRITES).toContain(AK.SPRITE_NPC_METTE);
    expect(AK.ALL_SPRITES).toHaveLength(6);
  });

  it('ALL_UI contains exactly the UI constants', () => {
    expect(AK.ALL_UI).toContain(AK.UI_PANEL);
    expect(AK.ALL_UI).toContain(AK.UI_BUTTON);
    expect(AK.ALL_UI).toContain(AK.UI_ICON_HEALTH);
    expect(AK.ALL_UI).toHaveLength(17);
  });

  it('ALL_SFX contains exactly the SFX constants', () => {
    expect(AK.ALL_SFX).toContain(AK.SFX_CLICK);
    expect(AK.ALL_SFX).toContain(AK.SFX_COIN);
    expect(AK.ALL_SFX).toContain(AK.SFX_FOOTSTEP_1);
    expect(AK.ALL_SFX).toHaveLength(11);
  });

  it('font constants are meaningful names', () => {
    expect(AK.FONT_UI).toBe('Inter');
    expect(AK.FONT_PIXEL).toBe('Press Start 2P');
  });
});
