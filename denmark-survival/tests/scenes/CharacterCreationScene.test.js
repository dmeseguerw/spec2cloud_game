/**
 * tests/scenes/CharacterCreationScene.test.js
 * Unit and integration tests for CharacterCreationScene.
 *
 * The Phaser.Scene base class is stubbed globally by tests/mocks/setupPhaser.js.
 * DOM operations are suppressed by mocking _createContainer and _destroyContainer
 * so all wizard-state logic can be exercised in a pure Node.js environment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MockRegistry } from '../mocks/PhaserMocks.js';
import { CharacterCreationScene } from '../../src/scenes/CharacterCreationScene.js';
import { NATIONALITIES, JOBS } from '../../src/data/characterData.js';
import * as RK from '../../src/constants/RegistryKeys.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

/**
 * Build a CharacterCreationScene with all Phaser and DOM dependencies stubbed.
 * The DOM container methods are no-ops so wizard state can be tested cleanly.
 */
function buildScene() {
  const scene = new CharacterCreationScene();

  // Phaser stubs
  scene.scale    = { width: 1280, height: 720 };
  scene.registry = new MockRegistry();
  scene.scene    = { start: vi.fn() };
  scene.cameras  = {
    main: {
      fadeOut: vi.fn((_duration, _r, _g, _b, callback) => {
        if (typeof callback === 'function') callback(null, 1);
      }),
      fadeIn: vi.fn((_duration, _r, _g, _b, callback) => {
        if (typeof callback === 'function') callback(null, 1);
      }),
    },
  };
  scene.input = { enabled: true };

  // Suppress DOM side-effects so tests run without a browser.
  // Assign vi.fn() directly as own properties (avoids prototype chain issues
  // that can occur when using vi.spyOn on methods that only exist on the prototype).
  scene._createContainer   = vi.fn();
  scene._destroyContainer  = vi.fn();
  scene._renderCurrentStep = vi.fn();

  return scene;
}

/** Convenience: find a nationality by id. */
const nat = (id) => NATIONALITIES.find(n => n.id === id);

/** Convenience: find a job by id. */
const job = (id) => JOBS.find(j => j.id === id);

// ---------------------------------------------------------------------------
// Constructor
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — constructor', () => {
  it('uses "CharacterCreationScene" as the scene key', () => {
    const scene = new CharacterCreationScene();
    expect(scene._config.key).toBe('CharacterCreationScene');
  });

  it('starts at step 1', () => {
    const scene = new CharacterCreationScene();
    expect(scene._step).toBe(1);
  });

  it('initialises selections to empty defaults', () => {
    const scene = new CharacterCreationScene();
    expect(scene._selections.name).toBe('');
    expect(scene._selections.nationality).toBeNull();
    expect(scene._selections.job).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// init() resets state
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — init()', () => {
  it('resets step and selections each time the scene is entered', () => {
    const scene = buildScene();

    // Simulate entering once and making selections
    scene._step = 3;
    scene._selections.name = 'Alice';
    scene._selections.nationality = nat('german');

    // Enter the scene again
    scene.init({});

    expect(scene._step).toBe(1);
    expect(scene._selections.name).toBe('');
    expect(scene._selections.nationality).toBeNull();
    expect(scene._selections.job).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// create()
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — create()', () => {
  it('calls _createContainer', () => {
    const scene = buildScene();
    scene.create();
    expect(scene._createContainer).toHaveBeenCalledTimes(1);
  });

  it('calls _renderCurrentStep', () => {
    const scene = buildScene();
    scene.create();
    expect(scene._renderCurrentStep).toHaveBeenCalledTimes(1);
  });

  it('calls fadeInCamera (triggers cameras.main.fadeIn)', () => {
    const scene = buildScene();
    scene.create();
    expect(scene.cameras.main.fadeIn).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Step navigation — _goToStep()
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — _goToStep()', () => {
  it('changes _step to the given value', () => {
    const scene = buildScene();
    scene._goToStep(2);
    expect(scene._step).toBe(2);
  });

  it('calls _renderCurrentStep after each step change', () => {
    const scene = buildScene();
    scene._goToStep(2);
    scene._goToStep(3);
    // create() also calls it, but we reset the spy count here
    expect(scene._renderCurrentStep).toHaveBeenCalledTimes(2);
  });

  it('can navigate from step 1 through to step 4', () => {
    const scene = buildScene();
    for (let s = 1; s <= 4; s++) {
      scene._goToStep(s);
      expect(scene._step).toBe(s);
    }
  });
});

// ---------------------------------------------------------------------------
// Selection helpers
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — selection helpers', () => {
  it('_applyName sanitizes and stores the name', () => {
    const scene = buildScene();
    scene._applyName('<b>Alice</b>');
    expect(scene._selections.name).toBe('Alice');
  });

  it('_applyName strips script tags', () => {
    const scene = buildScene();
    scene._applyName('<script>evil()</script>');
    expect(scene._selections.name).toBe('evil()');
  });

  it('_applyNationality stores the nationality object', () => {
    const scene = buildScene();
    const german = nat('german');
    scene._applyNationality(german);
    expect(scene._selections.nationality).toBe(german);
  });

  it('_applyJob stores the job object', () => {
    const scene = buildScene();
    const engineer = job('engineer');
    scene._applyJob(engineer);
    expect(scene._selections.job).toBe(engineer);
  });
});

// ---------------------------------------------------------------------------
// Step validation handlers
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — _handleStep1Next()', () => {
  it('advances to step 2 when given a valid name', () => {
    const scene = buildScene();
    const result = scene._handleStep1Next('Alice');
    expect(result).toBe(true);
    expect(scene._step).toBe(2);
    expect(scene._selections.name).toBe('Alice');
  });

  it('stores the sanitized name', () => {
    const scene = buildScene();
    scene._handleStep1Next('  Lars  ');
    expect(scene._selections.name).toBe('Lars');
  });

  it('returns false and stays on step 1 when name is empty', () => {
    const scene = buildScene();
    const result = scene._handleStep1Next('');
    expect(result).toBe(false);
    expect(scene._step).toBe(1);
  });

  it('returns false when name exceeds 20 characters', () => {
    const scene = buildScene();
    const result = scene._handleStep1Next('A'.repeat(21));
    expect(result).toBe(false);
    expect(scene._step).toBe(1);
  });

  it('returns false when name is only whitespace', () => {
    const scene = buildScene();
    const result = scene._handleStep1Next('   ');
    expect(result).toBe(false);
  });
});

describe('CharacterCreationScene — _handleStep2Next()', () => {
  it('advances to step 3 when a nationality is selected', () => {
    const scene = buildScene();
    scene._applyNationality(nat('swedish'));
    scene._step = 2;
    const result = scene._handleStep2Next();
    expect(result).toBe(true);
    expect(scene._step).toBe(3);
  });

  it('returns false and stays on step 2 when no nationality is selected', () => {
    const scene = buildScene();
    scene._step = 2;
    const result = scene._handleStep2Next();
    expect(result).toBe(false);
    expect(scene._step).toBe(2);
  });
});

describe('CharacterCreationScene — _handleStep3Next()', () => {
  it('advances to step 4 when a job is selected', () => {
    const scene = buildScene();
    scene._applyJob(job('teacher'));
    scene._step = 3;
    const result = scene._handleStep3Next();
    expect(result).toBe(true);
    expect(scene._step).toBe(4);
  });

  it('returns false and stays on step 3 when no job is selected', () => {
    const scene = buildScene();
    scene._step = 3;
    const result = scene._handleStep3Next();
    expect(result).toBe(false);
    expect(scene._step).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// Back navigation preserves selections
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — back navigation preserves selections', () => {
  it('selections made in step 2 are preserved after going back to step 1', () => {
    const scene = buildScene();
    scene._applyNationality(nat('german'));
    scene._goToStep(1);
    expect(scene._selections.nationality).toBe(nat('german'));
  });

  it('selections made in step 3 are preserved after going back to step 2', () => {
    const scene = buildScene();
    scene._applyJob(job('engineer'));
    scene._goToStep(2);
    expect(scene._selections.job).toBe(job('engineer'));
  });

  it('full back-and-forth preserves all selections', () => {
    const scene = buildScene();

    scene._handleStep1Next('Maria');
    expect(scene._step).toBe(2);

    scene._applyNationality(nat('dutch'));
    scene._handleStep2Next();
    expect(scene._step).toBe(3);

    // Go back to step 2
    scene._goToStep(2);
    expect(scene._selections.name).toBe('Maria');
    expect(scene._selections.nationality).toBe(nat('dutch'));

    // Forward again
    scene._handleStep2Next();
    expect(scene._step).toBe(3);

    scene._applyJob(job('researcher'));
    scene._handleStep3Next();
    expect(scene._step).toBe(4);

    // Go back to step 3
    scene._goToStep(3);
    expect(scene._selections.job).toBe(job('researcher'));
  });
});

// ---------------------------------------------------------------------------
// _startGame — state initialization
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — _startGame()', () => {
  function prepareScene(nameStr, natId, jobId) {
    const scene = buildScene();
    scene._selections.name        = nameStr;
    scene._selections.nationality = nat(natId);
    scene._selections.job         = job(jobId);
    return scene;
  }

  it('sets PLAYER_NAME in the registry', () => {
    const scene = prepareScene('Alice', 'german', 'engineer');
    scene._startGame();
    expect(scene.registry.get(RK.PLAYER_NAME)).toBe('Alice');
  });

  it('sets PLAYER_NATIONALITY in the registry', () => {
    const scene = prepareScene('Alice', 'german', 'engineer');
    scene._startGame();
    expect(scene.registry.get(RK.PLAYER_NATIONALITY)).toBe('German');
  });

  it('sets PLAYER_JOB in the registry', () => {
    const scene = prepareScene('Alice', 'german', 'engineer');
    scene._startGame();
    expect(scene.registry.get(RK.PLAYER_JOB)).toBe('Engineer');
  });

  it('sets starting PLAYER_MONEY to the job salary', () => {
    const scene = prepareScene('Alice', 'german', 'engineer');
    scene._startGame();
    // Engineer salary is 40,000 DKK
    expect(scene.registry.get(RK.PLAYER_MONEY)).toBe(40000);
  });

  it('starting DKK matches Student salary (6500)', () => {
    const scene = prepareScene('Bob', 'swedish', 'student');
    scene._startGame();
    expect(scene.registry.get(RK.PLAYER_MONEY)).toBe(6500);
  });

  it('starting DKK matches IT Professional salary (35000)', () => {
    const scene = prepareScene('Carol', 'american', 'it-professional');
    scene._startGame();
    expect(scene.registry.get(RK.PLAYER_MONEY)).toBe(35000);
  });

  it('applies nationality skill bonuses from StateManager', () => {
    // German nationality → cycling: 25 per StateManager's NATIONALITY_BONUSES
    const scene = prepareScene('Alice', 'german', 'engineer');
    scene._startGame();
    expect(scene.registry.get(RK.SKILL_CYCLING)).toBe(25);
    expect(scene.registry.get(RK.SKILL_BUREAUCRACY)).toBe(20);
  });

  it('applies Dutch nationality bonuses', () => {
    const scene = prepareScene('Alice', 'dutch', 'engineer');
    scene._startGame();
    expect(scene.registry.get(RK.SKILL_CYCLING)).toBe(20);
    expect(scene.registry.get(RK.SKILL_CULTURAL)).toBe(15);
  });

  it('applies Polish nationality bonuses', () => {
    const scene = prepareScene('Alice', 'polish', 'researcher');
    scene._startGame();
    expect(scene.registry.get(RK.SKILL_BUREAUCRACY)).toBe(20);
  });

  it('applies Turkish nationality bonuses', () => {
    const scene = prepareScene('Alice', 'turkish', 'chef');
    scene._startGame();
    expect(scene.registry.get(RK.SKILL_CULTURAL)).toBe(10);
  });

  it('applies Indian nationality bonuses', () => {
    const scene = prepareScene('Alice', 'indian', 'nurse');
    scene._startGame();
    expect(scene.registry.get(RK.SKILL_BUREAUCRACY)).toBe(10);
  });

  it('calls _destroyContainer', () => {
    const scene = prepareScene('Alice', 'german', 'engineer');
    scene._startGame();
    expect(scene._destroyContainer).toHaveBeenCalledTimes(1);
  });

  it('transitions to GameScene via fadeOut', () => {
    const scene = prepareScene('Alice', 'german', 'engineer');
    scene._startGame();
    expect(scene.cameras.main.fadeOut).toHaveBeenCalled();
    expect(scene.scene.start).toHaveBeenCalledWith('GameScene', expect.any(Object));
  });
});

// ---------------------------------------------------------------------------
// Full wizard flow (integration)
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — full wizard integration flow', () => {
  it('completes name → nationality → job → confirm → GameScene', () => {
    const scene = buildScene();

    // Step 1 — Name
    expect(scene._step).toBe(1);
    scene._handleStep1Next('Anna');
    expect(scene._step).toBe(2);
    expect(scene._selections.name).toBe('Anna');

    // Step 2 — Nationality
    scene._applyNationality(nat('norwegian'));
    scene._handleStep2Next();
    expect(scene._step).toBe(3);

    // Step 3 — Job
    scene._applyJob(job('nurse'));
    scene._handleStep3Next();
    expect(scene._step).toBe(4);

    // Confirm — Start Game
    scene._startGame();

    // Verify game state
    expect(scene.registry.get(RK.PLAYER_NAME)).toBe('Anna');
    expect(scene.registry.get(RK.PLAYER_NATIONALITY)).toBe('Norwegian');
    expect(scene.registry.get(RK.PLAYER_JOB)).toBe('Nurse');
    expect(scene.registry.get(RK.PLAYER_MONEY)).toBe(32000);
    expect(scene.registry.get(RK.PLAYER_LEVEL)).toBe(1);
    expect(scene.registry.get(RK.CURRENT_DAY)).toBe(1);

    // Verify transition
    expect(scene.scene.start).toHaveBeenCalledWith('GameScene', expect.any(Object));
  });

  it('game state after creation matches expected defaults', () => {
    const scene = buildScene();

    scene._selections = {
      name:        'Lars',
      nationality: nat('swedish'),
      job:         job('teacher'),
    };
    scene._startGame();

    expect(scene.registry.get(RK.PLAYER_XP)).toBe(0);
    expect(scene.registry.get(RK.PLAYER_LEVEL)).toBe(1);
    expect(scene.registry.get(RK.CURRENT_DAY)).toBe(1);
    expect(scene.registry.get(RK.CURRENT_PHASE)).toBe('Newcomer');
    expect(scene.registry.get(RK.PLAYER_HEALTH)).toBe(100);
    expect(scene.registry.get(RK.PLAYER_HAPPINESS)).toBe(70);
    expect(scene.registry.get(RK.PLAYER_ENERGY)).toBe(100);
    expect(scene.registry.get(RK.INVENTORY)).toEqual([]);
    expect(scene.registry.get(RK.TIME_OF_DAY)).toBe('morning');
    expect(scene.registry.get(RK.SEASON)).toBe('spring');
    // Swedish nationality bonuses
    expect(scene.registry.get(RK.SKILL_LANGUAGE)).toBe(30);
    expect(scene.registry.get(RK.SKILL_CULTURAL)).toBe(25);
    // Teacher salary
    expect(scene.registry.get(RK.PLAYER_MONEY)).toBe(30000);
  });
});

// ---------------------------------------------------------------------------
// shutdown()
// ---------------------------------------------------------------------------

describe('CharacterCreationScene — shutdown()', () => {
  it('calls _destroyContainer on shutdown', () => {
    const scene = buildScene();
    scene.shutdown();
    expect(scene._destroyContainer).toHaveBeenCalledTimes(1);
  });
});
