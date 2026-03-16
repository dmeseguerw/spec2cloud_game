/**
 * tests/systems/AudioManager.test.js
 * Unit and integration tests for AudioManager.
 * Coverage target: ≥85% of src/systems/AudioManager.js
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { MockRegistry, MockScene, MockSoundManager } from '../mocks/PhaserMocks.js';
import { AudioManager } from '../../src/systems/AudioManager.js';
import * as RK from '../../src/constants/RegistryKeys.js';
import {
  MUSIC_MENU,
  MUSIC_ARRIVAL,
  MUSIC_MORNING_COMMUTE,
  MUSIC_KOBENHAVN_NIGHTS,
  MUSIC_INDOORS,
  MUSIC_FRIENDSHIP,
  MUSIC_ENCOUNTER,
  SFX_UI_CLICK,
  SFX_FOOTSTEP_1,
  SFX_FOOTSTEP_2,
  SFX_FOOTSTEP_3,
  PITCH_VARIATION_RANGE,
} from '../../src/constants/AudioKeys.js';

/** Build an AudioManager backed by a MockScene with a fresh registry. */
function createAudioManager(registryOverrides = {}) {
  const scene    = new MockScene();
  // Set sensible defaults so AudioManager sees them on construction
  scene.registry.set(RK.VOLUME_MASTER, 0.8);
  scene.registry.set(RK.VOLUME_MUSIC,  0.6);
  scene.registry.set(RK.VOLUME_SFX,    0.8);
  scene.registry.set(RK.TIME_OF_DAY,   'morning');
  for (const [k, v] of Object.entries(registryOverrides)) {
    scene.registry.set(k, v);
  }
  const am = new AudioManager(scene);
  return { am, scene };
}

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioKeys constants', () => {
  it('exports distinct music keys', () => {
    const keys = [
      MUSIC_MENU, MUSIC_ARRIVAL, MUSIC_MORNING_COMMUTE,
      MUSIC_KOBENHAVN_NIGHTS, MUSIC_INDOORS, MUSIC_FRIENDSHIP, MUSIC_ENCOUNTER,
    ];
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('exports SFX keys', () => {
    expect(SFX_UI_CLICK).toBeTruthy();
    expect(SFX_FOOTSTEP_1).toBeTruthy();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — construction', () => {
  it('reads initial volume from registry', () => {
    const { am } = createAudioManager({
      [RK.VOLUME_MASTER]: 0.5,
      [RK.VOLUME_MUSIC]:  0.4,
      [RK.VOLUME_SFX]:    0.7,
    });
    expect(am.getMasterVolume()).toBe(0.5);
    expect(am.getMusicVolume()).toBe(0.4);
    expect(am.getSfxVolume()).toBe(0.7);
  });

  it('defaults to 0.8/0.6/0.8 when registry keys are absent', () => {
    const scene = new MockScene();
    const am = new AudioManager(scene);
    expect(am.getMasterVolume()).toBe(0.8);
    expect(am.getMusicVolume()).toBe(0.6);
    expect(am.getSfxVolume()).toBe(0.8);
  });

  it('starts unmuted', () => {
    const { am } = createAudioManager();
    expect(am.isMuted()).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — music playback', () => {
  it('plays a music track', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound).not.toBeNull();
    expect(sound.isPlaying).toBe(true);
    expect(sound.loop).toBe(true);
  });

  it('does not create a second instance if the same track is already playing', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.playMusic(MUSIC_MENU);
    expect(scene.sound.getAllSounds(MUSIC_MENU).length).toBe(1);
  });

  it('stops previous track before playing a new one', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    const first = scene.sound.getLastSound(MUSIC_MENU);
    am.playMusic(MUSIC_ARRIVAL);
    expect(first._calls.stop).toBeGreaterThan(0);
    expect(first._calls.destroy).toBeGreaterThan(0);
  });

  it('stopMusic stops and nulls the current track', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    am.stopMusic();
    expect(sound._calls.stop).toBeGreaterThan(0);
    expect(sound._calls.destroy).toBeGreaterThan(0);
  });

  it('stopMusic is a no-op when nothing is playing', () => {
    const { am } = createAudioManager();
    expect(() => am.stopMusic()).not.toThrow();
  });

  it('applies correct volume when playing music', () => {
    const { am, scene } = createAudioManager({
      [RK.VOLUME_MASTER]: 1.0,
      [RK.VOLUME_MUSIC]:  0.5,
    });
    am.playMusic(MUSIC_MENU);
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    // effective = master × music = 1.0 × 0.5 = 0.5
    expect(sound._calls.play[0].volume).toBeCloseTo(0.5);
  });

  it('pauseMusic pauses the track', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.pauseMusic();
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound._calls.pause).toBeGreaterThan(0);
  });

  it('resumeMusic resumes the track', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.pauseMusic();
    am.resumeMusic();
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound._calls.resume).toBeGreaterThan(0);
  });

  it('playMusic is a no-op for empty key', () => {
    const { am } = createAudioManager();
    expect(() => am.playMusic('')).not.toThrow();
    expect(() => am.playMusic(null)).not.toThrow();
  });

  it('handles missing audio keys gracefully (no crash)', () => {
    const { am, scene } = createAudioManager();
    scene.sound.markMissing(MUSIC_MENU);
    expect(() => am.playMusic(MUSIC_MENU)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — crossfade', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('crossfadeTo starts incoming track at volume 0', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.crossfadeTo(MUSIC_ARRIVAL, 500);
    const incoming = scene.sound.getLastSound(MUSIC_ARRIVAL);
    expect(incoming._calls.play[0].volume).toBe(0);
  });

  it('crossfadeTo stops and destroys outgoing track after completion', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    const outgoing = scene.sound.getLastSound(MUSIC_MENU);
    am.crossfadeTo(MUSIC_ARRIVAL, 500);
    vi.advanceTimersByTime(600);
    expect(outgoing._calls.stop).toBeGreaterThan(0);
    expect(outgoing._calls.destroy).toBeGreaterThan(0);
  });

  it('crossfadeTo is a no-op when same track is already playing', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.crossfadeTo(MUSIC_MENU, 500);
    // Only one sound created
    expect(scene.sound.getAllSounds(MUSIC_MENU).length).toBe(1);
  });

  it('crossfadeTo with missing incoming key stops old track gracefully', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    scene.sound.markMissing(MUSIC_ARRIVAL);
    expect(() => am.crossfadeTo(MUSIC_ARRIVAL, 200)).not.toThrow();
    vi.advanceTimersByTime(300);
  });

  it('crossfadeTo with no empty key is a no-op', () => {
    const { am } = createAudioManager();
    expect(() => am.crossfadeTo('', 200)).not.toThrow();
  });

  it('second crossfadeTo cancels previous crossfade timer', () => {
    const { am } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.crossfadeTo(MUSIC_ARRIVAL, 1000);
    // Should not throw
    expect(() => am.crossfadeTo(MUSIC_MORNING_COMMUTE, 500)).not.toThrow();
    vi.advanceTimersByTime(1200);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — mood override', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('setMoodOverride saves the previous track key', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.setMoodOverride(MUSIC_ENCOUNTER);
    expect(scene.sound.getLastSound(MUSIC_ENCOUNTER)).not.toBeNull();
  });

  it('clearMoodOverride restores previous track', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.setMoodOverride(MUSIC_ENCOUNTER);
    am.clearMoodOverride(0);
    vi.advanceTimersByTime(100);
    // crossfadeTo(MUSIC_MENU) was called — check a new menu sound exists
    const menuSounds = scene.sound.getAllSounds(MUSIC_MENU);
    expect(menuSounds.length).toBeGreaterThanOrEqual(1);
  });

  it('clearMoodOverride with no previous track calls stopMusic', () => {
    const { am } = createAudioManager();
    am.setMoodOverride(MUSIC_ENCOUNTER);
    expect(() => am.clearMoodOverride()).not.toThrow();
  });

  it('clearMoodOverride is a no-op when no override is active', () => {
    const { am } = createAudioManager();
    expect(() => am.clearMoodOverride()).not.toThrow();
  });

  it('setMoodOverride with missing key is a no-op', () => {
    const { am, scene } = createAudioManager();
    scene.sound.markMissing(MUSIC_ENCOUNTER);
    expect(() => am.setMoodOverride(MUSIC_ENCOUNTER)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — SFX playback', () => {
  it('plays a one-shot SFX', () => {
    const { am, scene } = createAudioManager();
    am.playSfx(SFX_UI_CLICK);
    const sound = scene.sound.getLastSound(SFX_UI_CLICK);
    expect(sound).not.toBeNull();
    expect(sound._calls.play.length).toBe(1);
  });

  it('multiple SFX can play simultaneously (different keys)', () => {
    const { am, scene } = createAudioManager();
    am.playSfx(SFX_UI_CLICK);
    am.playSfx(SFX_FOOTSTEP_1);
    expect(scene.sound.getLastSound(SFX_UI_CLICK)).not.toBeNull();
    expect(scene.sound.getLastSound(SFX_FOOTSTEP_1)).not.toBeNull();
  });

  it('playSfx is a no-op for empty/null key', () => {
    const { am } = createAudioManager();
    expect(() => am.playSfx('')).not.toThrow();
    expect(() => am.playSfx(null)).not.toThrow();
  });

  it('handles missing SFX key gracefully (no crash)', () => {
    const { am, scene } = createAudioManager();
    scene.sound.markMissing(SFX_UI_CLICK);
    expect(() => am.playSfx(SFX_UI_CLICK)).not.toThrow();
  });

  it('SFX uses correct volume (master × sfx)', () => {
    const { am, scene } = createAudioManager({
      [RK.VOLUME_MASTER]: 1.0,
      [RK.VOLUME_SFX]:    0.5,
    });
    am.playSfx(SFX_UI_CLICK);
    const sound = scene.sound.getLastSound(SFX_UI_CLICK);
    expect(sound._calls.play[0].volume).toBeCloseTo(0.5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — pitch variation', () => {
  it('applies detune to footstep keys', () => {
    const { am, scene } = createAudioManager();
    // Run many times to ensure detune is applied
    for (let i = 0; i < 20; i++) {
      am.playSfx(SFX_FOOTSTEP_1);
    }
    const sounds = scene.sound.getAllSounds(SFX_FOOTSTEP_1);
    const detunes = sounds.map(s => s._calls.play[0].detune);
    // At least some should be non-zero
    expect(detunes.some(d => d !== 0)).toBe(true);
  });

  it('detune stays within ±PITCH_VARIATION_RANGE × 1200 cents', () => {
    const { am, scene } = createAudioManager();
    for (let i = 0; i < 50; i++) {
      am.playSfx(SFX_FOOTSTEP_2);
    }
    const sounds = scene.sound.getAllSounds(SFX_FOOTSTEP_2);
    const maxCents = PITCH_VARIATION_RANGE * 1200;
    for (const s of sounds) {
      expect(Math.abs(s._calls.play[0].detune)).toBeLessThanOrEqual(maxCents + 0.001);
    }
  });

  it('does not apply detune to non-footstep SFX', () => {
    const { am, scene } = createAudioManager();
    am.playSfx(SFX_UI_CLICK);
    const sound = scene.sound.getLastSound(SFX_UI_CLICK);
    expect(sound._calls.play[0].detune).toBeUndefined();
  });

  it('supports all three footstep keys', () => {
    const { am, scene } = createAudioManager();
    am.playSfx(SFX_FOOTSTEP_1);
    am.playSfx(SFX_FOOTSTEP_2);
    am.playSfx(SFX_FOOTSTEP_3);
    [SFX_FOOTSTEP_1, SFX_FOOTSTEP_2, SFX_FOOTSTEP_3].forEach(key => {
      expect(scene.sound.getLastSound(key)).not.toBeNull();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — volume control', () => {
  it('setMasterVolume clamps to 0', () => {
    const { am } = createAudioManager();
    am.setMasterVolume(-5);
    expect(am.getMasterVolume()).toBe(0);
  });

  it('setMasterVolume clamps to 1', () => {
    const { am } = createAudioManager();
    am.setMasterVolume(999);
    expect(am.getMasterVolume()).toBe(1);
  });

  it('setMusicVolume clamps between 0 and 1', () => {
    const { am } = createAudioManager();
    am.setMusicVolume(-1);
    expect(am.getMusicVolume()).toBe(0);
    am.setMusicVolume(2);
    expect(am.getMusicVolume()).toBe(1);
  });

  it('setSfxVolume clamps between 0 and 1', () => {
    const { am } = createAudioManager();
    am.setSfxVolume(-0.5);
    expect(am.getSfxVolume()).toBe(0);
    am.setSfxVolume(1.5);
    expect(am.getSfxVolume()).toBe(1);
  });

  it('setMasterVolume updates volume on currently playing music', () => {
    const { am, scene } = createAudioManager({
      [RK.VOLUME_MASTER]: 1.0,
      [RK.VOLUME_MUSIC]:  0.5,
    });
    am.playMusic(MUSIC_MENU);
    am.setMasterVolume(0.5);
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    // effective = 0.5 × 0.5 = 0.25
    expect(sound.volume).toBeCloseTo(0.25);
  });

  it('setMusicVolume updates volume on currently playing music', () => {
    const { am, scene } = createAudioManager({
      [RK.VOLUME_MASTER]: 1.0,
      [RK.VOLUME_MUSIC]:  0.6,
    });
    am.playMusic(MUSIC_MENU);
    am.setMusicVolume(0.2);
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound.volume).toBeCloseTo(0.2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — mute / unmute', () => {
  it('toggleMute silences all audio', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU);
    am.toggleMute();
    expect(am.isMuted()).toBe(true);
    // Music volume should be set to 0
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound.volume).toBe(0);
  });

  it('toggleMute restores volume on unmute', () => {
    const { am, scene } = createAudioManager({
      [RK.VOLUME_MASTER]: 1.0,
      [RK.VOLUME_MUSIC]:  0.6,
    });
    am.playMusic(MUSIC_MENU);
    am.toggleMute();   // mute
    am.toggleMute();   // unmute
    expect(am.isMuted()).toBe(false);
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound.volume).toBeCloseTo(0.6);
  });

  it('mute preserves volume settings', () => {
    const { am } = createAudioManager({
      [RK.VOLUME_MASTER]: 0.9,
      [RK.VOLUME_MUSIC]:  0.7,
      [RK.VOLUME_SFX]:    0.8,
    });
    am.setMuted(true);
    expect(am.getMasterVolume()).toBe(0.9);
    expect(am.getMusicVolume()).toBe(0.7);
    expect(am.getSfxVolume()).toBe(0.8);
  });

  it('setMuted(false) is an alias for unmute', () => {
    const { am } = createAudioManager();
    am.setMuted(true);
    am.setMuted(false);
    expect(am.isMuted()).toBe(false);
  });

  it('muted SFX plays at volume 0', () => {
    const { am, scene } = createAudioManager();
    am.setMuted(true);
    am.playSfx(SFX_UI_CLICK);
    const sound = scene.sound.getLastSound(SFX_UI_CLICK);
    expect(sound._calls.play[0].volume).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — registry integration (volume change events)', () => {
  it('updates master volume when registry VOLUME_MASTER changes', () => {
    const { am, scene } = createAudioManager();
    scene.registry.set(RK.VOLUME_MASTER, 0.3);
    expect(am.getMasterVolume()).toBeCloseTo(0.3);
  });

  it('updates music volume when registry VOLUME_MUSIC changes', () => {
    const { am, scene } = createAudioManager();
    scene.registry.set(RK.VOLUME_MUSIC, 0.2);
    expect(am.getMusicVolume()).toBeCloseTo(0.2);
  });

  it('updates SFX volume when registry VOLUME_SFX changes', () => {
    const { am, scene } = createAudioManager();
    scene.registry.set(RK.VOLUME_SFX, 0.1);
    expect(am.getSfxVolume()).toBeCloseTo(0.1);
  });

  it('applies updated music volume immediately to playing track', () => {
    const { am, scene } = createAudioManager({
      [RK.VOLUME_MASTER]: 1.0,
      [RK.VOLUME_MUSIC]:  0.6,
    });
    am.playMusic(MUSIC_MENU);
    scene.registry.set(RK.VOLUME_MUSIC, 0.3);
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound.volume).toBeCloseTo(0.3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — context-aware music (playMusicForScene)', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('selects menu music for MenuScene', () => {
    const { am, scene } = createAudioManager();
    am.playMusicForScene('MenuScene');
    vi.advanceTimersByTime(1200);
    expect(scene.sound.getLastSound(MUSIC_MENU)).not.toBeNull();
  });

  it('selects arrival music for CharCreate scene', () => {
    const { am, scene } = createAudioManager();
    am.playMusicForScene('CharCreate');
    vi.advanceTimersByTime(1200);
    expect(scene.sound.getLastSound(MUSIC_ARRIVAL)).not.toBeNull();
  });

  it('selects morning commute for GameScene outdoors during morning', () => {
    const { am, scene } = createAudioManager({ [RK.TIME_OF_DAY]: 'morning' });
    am.playMusicForScene('GameScene', { location: 'outdoors', timeOfDay: 'morning' });
    vi.advanceTimersByTime(1200);
    expect(scene.sound.getLastSound(MUSIC_MORNING_COMMUTE)).not.toBeNull();
  });

  it('selects København Nights for GameScene outdoors at night', () => {
    const { am, scene } = createAudioManager({ [RK.TIME_OF_DAY]: 'night' });
    am.playMusicForScene('GameScene', { location: 'outdoors', timeOfDay: 'night' });
    vi.advanceTimersByTime(1200);
    expect(scene.sound.getLastSound(MUSIC_KOBENHAVN_NIGHTS)).not.toBeNull();
  });

  it('selects indoors music for GameScene indoors', () => {
    const { am, scene } = createAudioManager();
    am.playMusicForScene('GameScene', { location: 'indoors' });
    vi.advanceTimersByTime(1200);
    expect(scene.sound.getLastSound(MUSIC_INDOORS)).not.toBeNull();
  });

  it('selects friendship theme when in dialogue', () => {
    const { am, scene } = createAudioManager();
    am.playMusicForScene('GameScene', { inDialogue: true });
    vi.advanceTimersByTime(1200);
    expect(scene.sound.getLastSound(MUSIC_FRIENDSHIP)).not.toBeNull();
  });

  it('returns null key for unknown scene (no-op)', () => {
    const { am } = createAudioManager();
    expect(() => am.playMusicForScene('UnknownScene')).not.toThrow();
  });

  it('uses registry TIME_OF_DAY when context does not specify', () => {
    const { am, scene } = createAudioManager({ [RK.TIME_OF_DAY]: 'evening' });
    am.playMusicForScene('GameScene', { location: 'outdoors' });
    vi.advanceTimersByTime(1200);
    expect(scene.sound.getLastSound(MUSIC_KOBENHAVN_NIGHTS)).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — unlock', () => {
  it('calls sound.unlock() if available', () => {
    const { am, scene } = createAudioManager();
    const unlockSpy = vi.spyOn(scene.sound, 'unlock');
    am.unlock();
    expect(unlockSpy).toHaveBeenCalledOnce();
  });

  it('only unlocks once', () => {
    const { am, scene } = createAudioManager();
    const unlockSpy = vi.spyOn(scene.sound, 'unlock');
    am.unlock();
    am.unlock();
    expect(unlockSpy).toHaveBeenCalledOnce();
  });

  it('handles context resume when unlock method is absent', () => {
    const { am, scene } = createAudioManager();
    scene.sound.unlock = undefined;
    scene.sound.context = { state: 'suspended', resume: vi.fn().mockResolvedValue() };
    expect(() => am.unlock()).not.toThrow();
    expect(scene.sound.context.resume).toHaveBeenCalledOnce();
  });

  it('does not crash when sound system is absent', () => {
    const scene = new MockScene();
    scene.sound = null;
    const am = new AudioManager(scene);
    expect(() => am.unlock()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
describe('AudioManager — edge cases and robustness', () => {
  it('gracefully handles scene with no registry events', () => {
    const scene = new MockScene();
    scene.registry.events = null;
    expect(() => new AudioManager(scene)).not.toThrow();
  });

  it('pauseMusic is a no-op when nothing is playing', () => {
    const { am } = createAudioManager();
    expect(() => am.pauseMusic()).not.toThrow();
  });

  it('resumeMusic is a no-op when nothing is playing', () => {
    const { am } = createAudioManager();
    expect(() => am.resumeMusic()).not.toThrow();
  });

  it('plays non-looping music when loop=false is specified', () => {
    const { am, scene } = createAudioManager();
    am.playMusic(MUSIC_MENU, { loop: false });
    const sound = scene.sound.getLastSound(MUSIC_MENU);
    expect(sound.loop).toBe(false);
  });
});
