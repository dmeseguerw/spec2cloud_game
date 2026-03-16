/**
 * tests/scenes/config.test.js
 * Unit tests for src/config.js — game-wide constants (Task 002).
 *
 * These tests import the module directly so that vitest coverage tooling can
 * count executed lines, complementing the text-based checks in engine.test.js.
 */

import { describe, it, expect } from 'vitest';
import {
  WIDTH,
  HEIGHT,
  TARGET_FPS,
  GAME_TIME_SCALE,
  DAY_LENGTH_MINUTES,
  DAY_START_MINUTES,
  STARTING_HEALTH,
  STARTING_CURRENCY,
  XP_THRESHOLDS,
  MAX_LEVEL,
  BACKGROUND_COLOR,
  GAME_CONTAINER_ID,
  PIXEL_ART,
  ANTIALIAS,
  ROUND_PIXELS,
} from '../../src/config.js';

describe('config.js — game constants', () => {
  // ── Renderer / canvas ─────────────────────────────────────────────────────

  it('WIDTH is 1280', () => {
    expect(WIDTH).toBe(1280);
  });

  it('HEIGHT is 720', () => {
    expect(HEIGHT).toBe(720);
  });

  it('canvas aspect ratio is 16:9', () => {
    expect(WIDTH / HEIGHT).toBeCloseTo(16 / 9, 5);
  });

  // ── Performance ──────────────────────────────────────────────────────────

  it('TARGET_FPS is 60', () => {
    expect(TARGET_FPS).toBe(60);
  });

  // ── Time & game loop ─────────────────────────────────────────────────────

  it('GAME_TIME_SCALE is a positive number', () => {
    expect(typeof GAME_TIME_SCALE).toBe('number');
    expect(GAME_TIME_SCALE).toBeGreaterThan(0);
  });

  it('DAY_LENGTH_MINUTES represents a full in-game day (07:00–23:00 = 960 min)', () => {
    expect(DAY_LENGTH_MINUTES).toBe(960);
  });

  it('DAY_START_MINUTES is 420 (07:00)', () => {
    expect(DAY_START_MINUTES).toBe(420);
  });

  // ── Player defaults ───────────────────────────────────────────────────────

  it('STARTING_HEALTH is 100', () => {
    expect(STARTING_HEALTH).toBe(100);
  });

  it('STARTING_CURRENCY is 500', () => {
    expect(STARTING_CURRENCY).toBe(500);
  });

  // ── Progression ───────────────────────────────────────────────────────────

  it('XP_THRESHOLDS is an array starting at 0', () => {
    expect(Array.isArray(XP_THRESHOLDS)).toBe(true);
    expect(XP_THRESHOLDS[0]).toBe(0);
  });

  it('XP_THRESHOLDS values are strictly increasing', () => {
    for (let i = 1; i < XP_THRESHOLDS.length; i++) {
      expect(XP_THRESHOLDS[i]).toBeGreaterThan(XP_THRESHOLDS[i - 1]);
    }
  });

  it('MAX_LEVEL equals XP_THRESHOLDS.length - 1', () => {
    expect(MAX_LEVEL).toBe(XP_THRESHOLDS.length - 1);
  });

  // ── Phaser configuration ─────────────────────────────────────────────────

  it('BACKGROUND_COLOR is #1a1814', () => {
    expect(BACKGROUND_COLOR).toBe('#1a1814');
  });

  it('GAME_CONTAINER_ID is "game-container"', () => {
    expect(GAME_CONTAINER_ID).toBe('game-container');
  });

  it('PIXEL_ART is true (crisp sprite rendering)', () => {
    expect(PIXEL_ART).toBe(true);
  });

  it('ANTIALIAS is false (no blurry edges on pixel art)', () => {
    expect(ANTIALIAS).toBe(false);
  });

  it('ROUND_PIXELS is true (pixel-snapped rendering)', () => {
    expect(ROUND_PIXELS).toBe(true);
  });
});
