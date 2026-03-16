/**
 * tests/state/StateHelpers.test.js
 * Unit tests for StateHelpers convenience functions.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import {
  addXP, removeXP, updateSkill, updateNPCRelationship,
  addItem, removeItem, addMoney, spendMoney,
  unlockEncyclopediaEntry, recordEncounter,
  advanceTimeOfDay, checkSpoiledFood,
} from '../../src/state/StateHelpers.js';
import * as RK from '../../src/constants/RegistryKeys.js';

describe('StateHelpers', () => {
  let registry;

  beforeEach(() => {
    registry = new MockRegistry();
    // Set up basic initial state
    registry.set(RK.PLAYER_XP, 0);
    registry.set(RK.PLAYER_LEVEL, 1);
    registry.set(RK.PLAYER_MONEY, 500);
    registry.set(RK.INVENTORY, []);
    registry.set(RK.NPC_RELATIONSHIPS, {});
    registry.set(RK.ENCYCLOPEDIA_ENTRIES, []);
    registry.set(RK.ENCOUNTER_HISTORY, []);
    registry.set(RK.TIME_OF_DAY, 'morning');
    registry.set(RK.CURRENT_DAY, 1);
  });

  describe('addXP', () => {
    it('adds XP correctly', () => {
      const result = addXP(registry, 50);
      expect(result.newXP).toBe(50);
      expect(result.leveledUp).toBe(false);
      expect(registry.get(RK.PLAYER_XP)).toBe(50);
    });

    it('triggers level-up at threshold (100 XP → level 2)', () => {
      const result = addXP(registry, 100);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(2);
      expect(registry.get(RK.PLAYER_LEVEL)).toBe(2);
    });

    it('triggers multiple level-ups when XP crosses several thresholds', () => {
      const result = addXP(registry, 500);
      expect(result.leveledUp).toBe(true);
      expect(result.newLevel).toBe(4); // 500 >= XP_THRESHOLDS[3]=500
      expect(registry.get(RK.PLAYER_LEVEL)).toBe(4);
    });

    it('emits XP_CHANGED event', () => {
      const handler = vi.fn();
      registry.events.on('xp_changed', handler);
      addXP(registry, 25);
      expect(handler).toHaveBeenCalledWith({ xp: 25, delta: 25, source: 'unknown' });
    });

    it('emits LEVEL_UP event when leveling up', () => {
      const handler = vi.fn();
      registry.events.on('level_up', handler);
      addXP(registry, 100);
      expect(handler).toHaveBeenCalledWith({ level: 2, xp: 100 });
    });

    it('does not exceed MAX_LEVEL', () => {
      registry.set(RK.PLAYER_LEVEL, 9);
      registry.set(RK.PLAYER_XP, 5700);
      const result = addXP(registry, 10000);
      expect(result.newLevel).toBe(9); // Already at max
      expect(result.leveledUp).toBe(false);
    });
  });

  describe('removeXP', () => {
    it('removes XP correctly', () => {
      registry.set(RK.PLAYER_XP, 200);
      const result = removeXP(registry, 50);
      expect(result).toBe(150);
      expect(registry.get(RK.PLAYER_XP)).toBe(150);
    });

    it('does not go below 0', () => {
      registry.set(RK.PLAYER_XP, 30);
      const result = removeXP(registry, 100);
      expect(result).toBe(0);
      expect(registry.get(RK.PLAYER_XP)).toBe(0);
    });
  });

  describe('updateSkill', () => {
    it('increments skill value', () => {
      registry.set(RK.SKILL_LANGUAGE, 20);
      const result = updateSkill(registry, RK.SKILL_LANGUAGE, 10);
      expect(result).toBe(30);
    });

    it('clamps at 100', () => {
      registry.set(RK.SKILL_CYCLING, 95);
      const result = updateSkill(registry, RK.SKILL_CYCLING, 20);
      expect(result).toBe(100);
    });

    it('clamps at 0', () => {
      registry.set(RK.SKILL_CULTURAL, 5);
      const result = updateSkill(registry, RK.SKILL_CULTURAL, -20);
      expect(result).toBe(0);
    });
  });

  describe('updateNPCRelationship', () => {
    it('sets initial relationship from default 50', () => {
      const result = updateNPCRelationship(registry, 'npc_anna', 10);
      expect(result).toBe(60);
    });

    it('clamps at 100', () => {
      registry.set(RK.NPC_RELATIONSHIPS, { npc_anna: 95 });
      const result = updateNPCRelationship(registry, 'npc_anna', 20);
      expect(result).toBe(100);
    });

    it('clamps at 0', () => {
      registry.set(RK.NPC_RELATIONSHIPS, { npc_anna: 5 });
      const result = updateNPCRelationship(registry, 'npc_anna', -20);
      expect(result).toBe(0);
    });

    it('preserves other NPC relationships', () => {
      registry.set(RK.NPC_RELATIONSHIPS, { npc_anna: 50, npc_bob: 70 });
      updateNPCRelationship(registry, 'npc_anna', 10);
      const relationships = registry.get(RK.NPC_RELATIONSHIPS);
      expect(relationships.npc_bob).toBe(70);
      expect(relationships.npc_anna).toBe(60);
    });
  });

  describe('addItem', () => {
    it('adds new item to empty inventory', () => {
      addItem(registry, { id: 'bread', name: 'Rugbrød', category: 'food' });
      const inv = registry.get(RK.INVENTORY);
      expect(inv).toHaveLength(1);
      expect(inv[0].id).toBe('bread');
      expect(inv[0].quantity).toBe(1);
    });

    it('increments quantity for existing item', () => {
      addItem(registry, { id: 'bread', name: 'Rugbrød', quantity: 2 });
      addItem(registry, { id: 'bread', name: 'Rugbrød', quantity: 3 });
      const inv = registry.get(RK.INVENTORY);
      expect(inv).toHaveLength(1);
      expect(inv[0].quantity).toBe(5);
    });

    it('adds different items separately', () => {
      addItem(registry, { id: 'bread', name: 'Rugbrød' });
      addItem(registry, { id: 'cheese', name: 'Ost' });
      const inv = registry.get(RK.INVENTORY);
      expect(inv).toHaveLength(2);
    });
  });

  describe('removeItem', () => {
    it('removes item completely when quantity matches', () => {
      addItem(registry, { id: 'bread', name: 'Rugbrød', quantity: 1 });
      const result = removeItem(registry, 'bread', 1);
      expect(result).toBe(true);
      expect(registry.get(RK.INVENTORY)).toHaveLength(0);
    });

    it('reduces quantity for partial removal', () => {
      addItem(registry, { id: 'bread', name: 'Rugbrød', quantity: 5 });
      const result = removeItem(registry, 'bread', 2);
      expect(result).toBe(true);
      const inv = registry.get(RK.INVENTORY);
      expect(inv[0].quantity).toBe(3);
    });

    it('returns false for non-existent item', () => {
      const result = removeItem(registry, 'nonexistent');
      expect(result).toBe(false);
    });

    it('removes item when removing more than available', () => {
      addItem(registry, { id: 'bread', name: 'Rugbrød', quantity: 2 });
      removeItem(registry, 'bread', 5);
      expect(registry.get(RK.INVENTORY)).toHaveLength(0);
    });
  });

  describe('addMoney and spendMoney', () => {
    it('addMoney increases balance', () => {
      const result = addMoney(registry, 200);
      expect(result).toBe(700);
      expect(registry.get(RK.PLAYER_MONEY)).toBe(700);
    });

    it('spendMoney decreases balance', () => {
      const result = spendMoney(registry, 100);
      expect(result).toBe(true);
      expect(registry.get(RK.PLAYER_MONEY)).toBe(400);
    });

    it('spendMoney rejects insufficient funds', () => {
      const result = spendMoney(registry, 1000);
      expect(result).toBe(false);
      expect(registry.get(RK.PLAYER_MONEY)).toBe(500); // Unchanged
    });
  });

  describe('unlockEncyclopediaEntry', () => {
    it('adds new entry', () => {
      const result = unlockEncyclopediaEntry(registry, 'hygge');
      expect(result).toBe(true);
      expect(registry.get(RK.ENCYCLOPEDIA_ENTRIES)).toContain('hygge');
    });

    it('returns false for duplicate entry', () => {
      unlockEncyclopediaEntry(registry, 'hygge');
      const result = unlockEncyclopediaEntry(registry, 'hygge');
      expect(result).toBe(false);
    });
  });

  describe('recordEncounter', () => {
    it('records encounter with current day', () => {
      registry.set(RK.CURRENT_DAY, 5);
      recordEncounter(registry, 'encounter_1');
      const history = registry.get(RK.ENCOUNTER_HISTORY);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({ id: 'encounter_1', day: 5 });
    });
  });

  describe('advanceTimeOfDay', () => {
    it('advances morning to afternoon', () => {
      const result = advanceTimeOfDay(registry);
      expect(result.timeOfDay).toBe('afternoon');
      expect(result.dayAdvanced).toBe(false);
    });

    it('advances afternoon to evening', () => {
      registry.set(RK.TIME_OF_DAY, 'afternoon');
      const result = advanceTimeOfDay(registry);
      expect(result.timeOfDay).toBe('evening');
      expect(result.dayAdvanced).toBe(false);
    });

    it('advances evening to night', () => {
      registry.set(RK.TIME_OF_DAY, 'evening');
      const result = advanceTimeOfDay(registry);
      expect(result.timeOfDay).toBe('night');
      expect(result.dayAdvanced).toBe(false);
    });

    it('advances night to morning and increments day', () => {
      registry.set(RK.TIME_OF_DAY, 'night');
      const result = advanceTimeOfDay(registry);
      expect(result.timeOfDay).toBe('morning');
      expect(result.dayAdvanced).toBe(true);
      expect(registry.get(RK.CURRENT_DAY)).toBe(2);
    });

    it('full cycle through all periods', () => {
      advanceTimeOfDay(registry); // morning → afternoon
      advanceTimeOfDay(registry); // afternoon → evening
      advanceTimeOfDay(registry); // evening → night
      const result = advanceTimeOfDay(registry); // night → morning
      expect(result.timeOfDay).toBe('morning');
      expect(result.dayAdvanced).toBe(true);
      expect(registry.get(RK.CURRENT_DAY)).toBe(2);
    });
  });

  describe('checkSpoiledFood', () => {
    it('removes spoiled items', () => {
      registry.set(RK.CURRENT_DAY, 5);
      registry.set(RK.INVENTORY, [
        { id: 'bread', name: 'Bread', quantity: 1, category: 'food', spoilsAt: 3 },
        { id: 'cheese', name: 'Cheese', quantity: 1, category: 'food', spoilsAt: 10 },
      ]);
      const spoiled = checkSpoiledFood(registry);
      expect(spoiled).toHaveLength(1);
      expect(spoiled[0].id).toBe('bread');
      expect(registry.get(RK.INVENTORY)).toHaveLength(1);
      expect(registry.get(RK.INVENTORY)[0].id).toBe('cheese');
    });

    it('returns empty array when no items are spoiled', () => {
      registry.set(RK.CURRENT_DAY, 1);
      registry.set(RK.INVENTORY, [
        { id: 'cheese', name: 'Cheese', quantity: 1, category: 'food', spoilsAt: 10 },
      ]);
      const spoiled = checkSpoiledFood(registry);
      expect(spoiled).toHaveLength(0);
    });

    it('ignores items without spoilsAt', () => {
      registry.set(RK.CURRENT_DAY, 100);
      registry.set(RK.INVENTORY, [
        { id: 'bike', name: 'Bike', quantity: 1, category: 'equipment', spoilsAt: null },
      ]);
      const spoiled = checkSpoiledFood(registry);
      expect(spoiled).toHaveLength(0);
      expect(registry.get(RK.INVENTORY)).toHaveLength(1);
    });

    it('removes items spoiling on current day', () => {
      registry.set(RK.CURRENT_DAY, 5);
      registry.set(RK.INVENTORY, [
        { id: 'bread', name: 'Bread', quantity: 1, category: 'food', spoilsAt: 5 },
      ]);
      const spoiled = checkSpoiledFood(registry);
      expect(spoiled).toHaveLength(1);
    });

    it('handles missing INVENTORY key using fallback', () => {
      const r = new MockRegistry();
      r.set(RK.CURRENT_DAY, 5);
      // INVENTORY not set — exercises the `|| []` fallback
      const spoiled = checkSpoiledFood(r);
      expect(spoiled).toHaveLength(0);
    });

    it('handles missing CURRENT_DAY key using fallback', () => {
      const r = new MockRegistry();
      r.set(RK.INVENTORY, [
        { id: 'bread', name: 'Bread', quantity: 1, category: 'food', spoilsAt: 1 },
      ]);
      // CURRENT_DAY not set → defaults to 1, spoilsAt=1 → item is spoiled
      const spoiled = checkSpoiledFood(r);
      expect(spoiled).toHaveLength(1);
    });
  });

  describe('edge cases — fallback branches', () => {
    it('addXP treats negative amount as zero', () => {
      const result = addXP(registry, -10);
      expect(result.newXP).toBe(0);
      expect(result.leveledUp).toBe(false);
    });

    it('addXP uses provided source in event', () => {
      const handler = vi.fn();
      registry.events.on('xp_changed', handler);
      addXP(registry, 20, 'encounter');
      expect(handler).toHaveBeenCalledWith({ xp: 20, delta: 20, source: 'encounter' });
    });

    it('removeXP uses provided source', () => {
      registry.set(RK.PLAYER_XP, 100);
      const handler = vi.fn();
      registry.events.on('xp_changed', handler);
      removeXP(registry, 10, 'penalty');
      expect(handler).toHaveBeenCalledWith({ xp: 90, delta: -10, source: 'penalty' });
    });

    it('removeXP works from zero XP (fallback to 0)', () => {
      // XP = 0 from beforeEach — exercises the || 0 falsy path
      const result = removeXP(registry, 5);
      expect(result).toBe(0);
    });

    it('updateSkill works with uninitialized skill key (fallback to 0)', () => {
      const r = new MockRegistry();
      const result = updateSkill(r, RK.SKILL_LANGUAGE, 15);
      expect(result).toBe(15);
    });

    it('updateNPCRelationship with unset relationships map (fallback to {})', () => {
      const r = new MockRegistry();
      // NPC_RELATIONSHIPS not set — exercises || {} fallback
      const result = updateNPCRelationship(r, 'npc_test', 10);
      expect(result).toBe(60); // 50 default + 10
    });

    it('addItem with unset inventory (fallback to [])', () => {
      const r = new MockRegistry();
      // INVENTORY not set — exercises || [] fallback
      addItem(r, { id: 'bread', name: 'Rugbrød' });
      expect(r.get(RK.INVENTORY)).toHaveLength(1);
    });

    it('addItem increments quantity of existing item with no prior quantity field', () => {
      // existing.quantity is undefined → exercises existing.quantity || 1
      registry.set(RK.INVENTORY, [{ id: 'bread', name: 'Rugbrød' }]);
      addItem(registry, { id: 'bread', name: 'Rugbrød' });
      expect(registry.get(RK.INVENTORY)[0].quantity).toBe(2);
    });

    it('addItem with item missing quantity field defaults to 1', () => {
      // item.quantity is undefined → exercises item.quantity || 1
      addItem(registry, { id: 'cheese', name: 'Ost' });
      expect(registry.get(RK.INVENTORY)[0].quantity).toBe(1);
    });

    it('removeItem with unset inventory returns false', () => {
      const r = new MockRegistry();
      const result = removeItem(r, 'bread');
      expect(result).toBe(false);
    });

    it('addMoney with negative amount returns current balance unchanged', () => {
      const result = addMoney(registry, -50);
      expect(result).toBe(500);
      expect(registry.get(RK.PLAYER_MONEY)).toBe(500);
    });

    it('spendMoney with unset money key (fallback to 0)', () => {
      const r = new MockRegistry();
      // PLAYER_MONEY not set — exercises || 0 fallback
      const result = spendMoney(r, 10);
      expect(result).toBe(false);
    });

    it('unlockEncyclopediaEntry with unset entries (fallback to [])', () => {
      const r = new MockRegistry();
      // ENCYCLOPEDIA_ENTRIES not set — exercises || [] fallback
      const result = unlockEncyclopediaEntry(r, 'hygge');
      expect(result).toBe(true);
    });

    it('recordEncounter with unset history and day (fallback branches)', () => {
      const r = new MockRegistry();
      // ENCOUNTER_HISTORY and CURRENT_DAY not set — exercises || [] and || 1
      recordEncounter(r, 'test_encounter');
      const history = r.get(RK.ENCOUNTER_HISTORY);
      expect(history).toHaveLength(1);
      expect(history[0]).toEqual({ id: 'test_encounter', day: 1 });
    });

    it('advanceTimeOfDay with unset TIME_OF_DAY (fallback to morning)', () => {
      const r = new MockRegistry();
      r.set(RK.CURRENT_DAY, 1);
      // TIME_OF_DAY not set — exercises || 'morning' fallback
      const result = advanceTimeOfDay(r);
      expect(result.timeOfDay).toBe('afternoon');
    });

    it('advanceTimeOfDay with unset CURRENT_DAY when day wraps (fallback to 1)', () => {
      const r = new MockRegistry();
      r.set(RK.TIME_OF_DAY, 'night');
      // CURRENT_DAY not set — exercises || 1 fallback in wrap branch
      const result = advanceTimeOfDay(r);
      expect(result.dayAdvanced).toBe(true);
      expect(r.get(RK.CURRENT_DAY)).toBe(2);
    });
  });
});
