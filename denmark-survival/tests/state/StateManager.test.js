/**
 * tests/state/StateManager.test.js
 * Unit tests for StateManager save/load operations.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { MockRegistry, MockLocalStorage } from '../mocks/PhaserMocks.js';
import {
  initializeNewGame,
  saveGame,
  loadGame,
  hasSave,
  deleteSave,
  getSaveMetadata,
  exportSave,
  importSave,
  validateSaveData,
  getMostRecentSave,
  autoSave,
} from '../../src/state/StateManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';

describe('StateManager', () => {
  let registry;
  let storage;

  beforeEach(() => {
    registry = new MockRegistry();
    storage = new MockLocalStorage();
  });

  describe('initializeNewGame', () => {
    it('sets all required keys with correct defaults', () => {
      initializeNewGame(registry, { name: 'Tester', nationality: 'Danish', job: 'Student' });

      expect(registry.get(RK.PLAYER_NAME)).toBe('Tester');
      expect(registry.get(RK.PLAYER_NATIONALITY)).toBe('Danish');
      expect(registry.get(RK.PLAYER_JOB)).toBe('Student');
      expect(registry.get(RK.PLAYER_XP)).toBe(0);
      expect(registry.get(RK.PLAYER_LEVEL)).toBe(1);
      expect(registry.get(RK.CURRENT_DAY)).toBe(1);
      expect(registry.get(RK.CURRENT_PHASE)).toBe('Newcomer');
      expect(registry.get(RK.PLAYER_MONEY)).toBe(500);
      expect(registry.get(RK.PLAYER_HEALTH)).toBe(100);
      expect(registry.get(RK.PLAYER_HAPPINESS)).toBe(70);
      expect(registry.get(RK.PLAYER_ENERGY)).toBe(100);
      expect(registry.get(RK.INVENTORY)).toEqual([]);
      expect(registry.get(RK.TIME_OF_DAY)).toBe('morning');
      expect(registry.get(RK.SEASON)).toBe('spring');
    });

    it('applies nationality bonuses for Danish player', () => {
      initializeNewGame(registry, { name: 'Hans', nationality: 'Danish', job: 'Student' });

      expect(registry.get(RK.SKILL_LANGUAGE)).toBe(50);
      expect(registry.get(RK.SKILL_CULTURAL)).toBe(40);
      expect(registry.get(RK.SKILL_CYCLING)).toBe(30);
      expect(registry.get(RK.SKILL_BUREAUCRACY)).toBe(20);
    });

    it('applies nationality bonuses for American player', () => {
      initializeNewGame(registry, { name: 'Bob', nationality: 'American', job: 'Teacher' });

      expect(registry.get(RK.SKILL_LANGUAGE)).toBe(5);
      expect(registry.get(RK.SKILL_CULTURAL)).toBe(5);
      expect(registry.get(RK.SKILL_CYCLING)).toBe(5);
      expect(registry.get(RK.SKILL_BUREAUCRACY)).toBe(5);
    });

    it('uses default bonuses for unknown nationality', () => {
      initializeNewGame(registry, { name: 'Unknown', nationality: 'Martian', job: 'Student' });

      expect(registry.get(RK.SKILL_LANGUAGE)).toBe(0);
      expect(registry.get(RK.SKILL_CULTURAL)).toBe(0);
    });

    it('uses default avatar when not specified', () => {
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      expect(registry.get(RK.PLAYER_AVATAR)).toBe('player');
    });
  });

  describe('saveGame and loadGame', () => {
    it('round-trips all data types correctly', () => {
      initializeNewGame(registry, { name: 'Saver', nationality: 'Danish', job: 'Engineer' });
      registry.set(RK.INVENTORY, [{ id: 'bread', name: 'Bread', quantity: 2, category: 'food', spoilsAt: 5 }]);
      registry.set(RK.NPC_RELATIONSHIPS, { npc1: 75, npc2: 30 });
      registry.set(RK.ENCYCLOPEDIA_ENTRIES, ['entry_1', 'entry_2']);

      saveGame(registry, 1, storage);

      // Load into a fresh registry
      const newRegistry = new MockRegistry();
      const result = loadGame(newRegistry, 1, storage);

      expect(result).toBe(true);
      expect(newRegistry.get(RK.PLAYER_NAME)).toBe('Saver');
      expect(newRegistry.get(RK.PLAYER_XP)).toBe(0);
      expect(newRegistry.get(RK.PLAYER_LEVEL)).toBe(1);
      expect(newRegistry.get(RK.INVENTORY)).toEqual([{ id: 'bread', name: 'Bread', quantity: 2, category: 'food', spoilsAt: 5 }]);
      expect(newRegistry.get(RK.NPC_RELATIONSHIPS)).toEqual({ npc1: 75, npc2: 30 });
      expect(newRegistry.get(RK.ENCYCLOPEDIA_ENTRIES)).toEqual(['entry_1', 'entry_2']);
      expect(newRegistry.get(RK.TUTORIAL_COMPLETED)).toBe(false);
      expect(newRegistry.get(RK.VOLUME_MASTER)).toBe(0.8);
    });

    it('loadGame returns false for non-existent save', () => {
      const result = loadGame(registry, 99, storage);
      expect(result).toBe(false);
    });

    it('emits GAME_SAVED event on save', () => {
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      let emittedSlot = null;
      registry.events.on('game_saved', (slot) => { emittedSlot = slot; });
      saveGame(registry, 2, storage);
      expect(emittedSlot).toBe(2);
    });

    it('emits GAME_LOADED event on load', () => {
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);

      const newRegistry = new MockRegistry();
      let emittedSlot = null;
      newRegistry.events.on('game_loaded', (slot) => { emittedSlot = slot; });
      loadGame(newRegistry, 1, storage);
      expect(emittedSlot).toBe(1);
    });
  });

  describe('hasSave', () => {
    it('returns false when no save exists', () => {
      expect(hasSave(1, storage)).toBe(false);
    });

    it('returns true when save exists', () => {
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);
      expect(hasSave(1, storage)).toBe(true);
    });
  });

  describe('deleteSave', () => {
    it('removes save data', () => {
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);
      expect(hasSave(1, storage)).toBe(true);

      deleteSave(1, storage);
      expect(hasSave(1, storage)).toBe(false);
    });
  });

  describe('getSaveMetadata', () => {
    it('returns null for non-existent save', () => {
      expect(getSaveMetadata(1, storage)).toBeNull();
    });

    it('returns correct metadata', () => {
      initializeNewGame(registry, { name: 'MetaTest', nationality: 'Danish', job: 'Student' });
      registry.set(RK.PLAYER_LEVEL, 5);
      registry.set(RK.CURRENT_DAY, 10);
      registry.set(RK.TOTAL_PLAYTIME, 3600);
      saveGame(registry, 1, storage);

      const meta = getSaveMetadata(1, storage);
      expect(meta.name).toBe('MetaTest');
      expect(meta.level).toBe(5);
      expect(meta.day).toBe(10);
      expect(meta.playtime).toBe(3600);
      expect(meta.savedAt).toBeGreaterThan(0);
    });
  });

  describe('exportSave and importSave', () => {
    it('exports valid JSON and imports it back', () => {
      initializeNewGame(registry, { name: 'Exporter', nationality: 'Swedish', job: 'Chef' });
      saveGame(registry, 1, storage);

      const exported = exportSave(1, storage);
      expect(exported).toBeTruthy();
      expect(() => JSON.parse(exported)).not.toThrow();

      // Import into slot 2 of a new storage
      const newStorage = new MockLocalStorage();
      const newRegistry = new MockRegistry();
      const result = importSave(newRegistry, exported, 2, newStorage);

      expect(result).toBe(true);
      expect(newRegistry.get(RK.PLAYER_NAME)).toBe('Exporter');
      expect(newRegistry.get(RK.PLAYER_NATIONALITY)).toBe('Swedish');
      expect(hasSave(2, newStorage)).toBe(true);
    });

    it('importSave returns false for invalid JSON', () => {
      const result = importSave(registry, 'not-json', 1, storage);
      expect(result).toBe(false);
    });

    it('exportSave returns null for non-existent save', () => {
      expect(exportSave(99, storage)).toBeNull();
    });
  });

  describe('error handling — corrupted save data', () => {
    it('loadGame returns false for corrupted JSON', () => {
      storage.setItem('denmarkSurvival_save_1', 'not-valid-json{{{');
      const result = loadGame(registry, 1, storage);
      expect(result).toBe(false);
    });

    it('getSaveMetadata returns null for corrupted JSON', () => {
      storage.setItem('denmarkSurvival_save_1', 'not-valid-json{{{');
      const result = getSaveMetadata(1, storage);
      expect(result).toBeNull();
    });
  });

  describe('validateSaveData', () => {
    it('returns valid=true for fully populated save data', () => {
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);
      const raw = storage.getItem('denmarkSurvival_save_1');
      const data = JSON.parse(raw);
      const result = validateSaveData(data);
      expect(result.valid).toBe(true);
      expect(result.missing).toHaveLength(0);
    });

    it('returns valid=false when required keys are missing', () => {
      const data = { [RK.PLAYER_NAME]: 'Test' }; // missing most required keys
      const result = validateSaveData(data);
      expect(result.valid).toBe(false);
      expect(result.missing.length).toBeGreaterThan(0);
      expect(result.missing).toContain(RK.PLAYER_XP);
    });

    it('reports versionMismatch=true when version differs', () => {
      const data = {
        [RK.PLAYER_NAME]:  'Test',
        [RK.PLAYER_XP]:    0,
        [RK.CURRENT_DAY]:  1,
        [RK.PLAYER_LEVEL]: 1,
        [RK.PLAYER_HEALTH]: 100,
        [RK.PLAYER_SCENE]: 'GameScene',
        _version: '9.9.9',
      };
      const result = validateSaveData(data);
      expect(result.versionMismatch).toBe(true);
    });

    it('reports versionMismatch=false when version matches', () => {
      initializeNewGame(registry, { name: 'Test', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 1, storage);
      const data = JSON.parse(storage.getItem('denmarkSurvival_save_1'));
      const result = validateSaveData(data);
      expect(result.versionMismatch).toBe(false);
    });

    it('returns valid=false for null input', () => {
      const result = validateSaveData(null);
      expect(result.valid).toBe(false);
    });

    it('returns valid=false for non-object input', () => {
      const result = validateSaveData('not an object');
      expect(result.valid).toBe(false);
    });
  });

  describe('getMostRecentSave', () => {
    it('returns null when no saves exist', () => {
      expect(getMostRecentSave(storage)).toBeNull();
    });

    it('returns the only slot when one save exists', () => {
      initializeNewGame(registry, { name: 'Solo', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 2, storage);
      expect(getMostRecentSave(storage)).toBe(2);
    });

    it('returns the slot with the most recent savedAt timestamp', () => {
      // Save to slot 1, then slot 3 slightly later using synthetic timestamps
      const old = JSON.stringify({ [RK.PLAYER_NAME]: 'Old', _savedAt: 1000, _version: '0.1.0' });
      const recent = JSON.stringify({ [RK.PLAYER_NAME]: 'New', _savedAt: 9999, _version: '0.1.0' });
      storage.setItem('denmarkSurvival_save_1', old);
      storage.setItem('denmarkSurvival_save_3', recent);
      expect(getMostRecentSave(storage)).toBe(3);
    });

    it('ignores corrupted save slots when choosing most recent', () => {
      storage.setItem('denmarkSurvival_save_1', 'corrupted{{{');
      initializeNewGame(registry, { name: 'Valid', nationality: 'Danish', job: 'Student' });
      saveGame(registry, 2, storage);
      expect(getMostRecentSave(storage)).toBe(2);
    });
  });

  describe('autoSave', () => {
    it('saves to the current SAVE_SLOT and returns slot number', () => {
      initializeNewGame(registry, { name: 'AutoTest', nationality: 'Danish', job: 'Student' });
      registry.set(RK.SAVE_SLOT, 2);
      const slot = autoSave(registry, storage);
      expect(slot).toBe(2);
      expect(hasSave(2, storage)).toBe(true);
    });

    it('defaults to slot 1 when SAVE_SLOT is not set', () => {
      initializeNewGame(registry, { name: 'AutoDefault', nationality: 'Danish', job: 'Student' });
      const freshRegistry = new MockRegistry();
      initializeNewGame(freshRegistry, { name: 'AutoDefault', nationality: 'Danish', job: 'Student' });
      // SAVE_SLOT not explicitly set — defaults to 1 via initializeNewGame
      const slot = autoSave(freshRegistry, storage);
      expect(slot).toBe(1);
    });

    it('emits auto_saved event with the slot number', () => {
      initializeNewGame(registry, { name: 'AutoEvent', nationality: 'Danish', job: 'Student' });
      registry.set(RK.SAVE_SLOT, 3);
      let emittedSlot = null;
      registry.events.on('auto_saved', (s) => { emittedSlot = s; });
      autoSave(registry, storage);
      expect(emittedSlot).toBe(3);
    });
  });

  describe('loadGame — forward compatibility', () => {
    it('fills defaults for keys missing from an old save', () => {
      // Simulate an old save that is missing newer keys
      const partialSave = {
        [RK.PLAYER_NAME]:    'OldSave',
        [RK.PLAYER_XP]:     50,
        [RK.PLAYER_LEVEL]:  2,
        [RK.CURRENT_DAY]:   5,
        [RK.PLAYER_HEALTH]: 80,
        [RK.PLAYER_SCENE]:  'GameScene',
        _savedAt: Date.now(),
        _version: '0.1.0',
      };
      storage.setItem('denmarkSurvival_save_1', JSON.stringify(partialSave));

      const newRegistry = new MockRegistry();
      const result = loadGame(newRegistry, 1, storage);
      expect(result).toBe(true);

      // Keys present in save are loaded correctly
      expect(newRegistry.get(RK.PLAYER_NAME)).toBe('OldSave');
      expect(newRegistry.get(RK.PLAYER_XP)).toBe(50);

      // Keys absent from save are filled with defaults
      expect(newRegistry.get(RK.PLAYER_ENERGY)).toBe(100);
      expect(newRegistry.get(RK.INVENTORY)).toEqual([]);
      expect(newRegistry.get(RK.VOLUME_MASTER)).toBe(0.8);
      expect(newRegistry.get(RK.TIME_OF_DAY)).toBe('morning');
    });
  });
});
