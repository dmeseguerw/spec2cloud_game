/**
 * src/systems/AudioManager.js
 * Centralized audio controller for Denmark Survival.
 *
 * Responsibilities:
 *  - Play / stop / crossfade background music (one track at a time)
 *  - Pause / resume music
 *  - Play one-shot sound effects (overlapping allowed)
 *  - Apply pitch variation to designated SFX keys
 *  - Master / music / SFX volume control (0–1, clamped)
 *  - Mute toggle that preserves volume settings
 *  - React to registry volume change events immediately
 *  - Context-aware music: select track based on scene / time-of-day
 *  - Mood override: push temporary music, restore previous track when done
 *  - Graceful no-op when audio keys are missing or the sound system is absent
 *  - Audio context unlock on first user interaction (browser policy)
 */

import * as RK from '../constants/RegistryKeys.js';
import {
  PITCH_VARIATION_KEYS,
  PITCH_VARIATION_RANGE,
  SCENE_MUSIC_MAP,
  MUSIC_MORNING_COMMUTE,
  MUSIC_KOBENHAVN_NIGHTS,
  MUSIC_INDOORS,
  MUSIC_FRIENDSHIP,
} from '../constants/AudioKeys.js';

/** Default crossfade duration in milliseconds. */
const DEFAULT_CROSSFADE_MS = 1000;

/** Volume clamp helper — keeps values in [0, 1]. */
function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

export class AudioManager {
  /**
   * @param {Phaser.Scene} scene - The scene that owns this manager.
   *   Used to access `scene.sound` and `scene.registry`.
   *   Pass a mock scene in tests.
   */
  constructor(scene) {
    this._scene    = scene;
    this._sound    = scene.sound;    // Phaser SoundManager (or mock)
    this._registry = scene.registry; // Phaser DataManager (or MockRegistry)

    // Volume state
    this._masterVolume = clamp01(this._registry.get(RK.VOLUME_MASTER) ?? 0.8);
    this._musicVolume  = clamp01(this._registry.get(RK.VOLUME_MUSIC)  ?? 0.6);
    this._sfxVolume    = clamp01(this._registry.get(RK.VOLUME_SFX)    ?? 0.8);
    this._muted        = false;

    // Currently playing music track object (Phaser Sound | mock | null)
    this._currentMusic     = null;
    this._currentMusicKey  = null;

    // Mood override stack: { key, sound }
    this._overrideMusic    = null;
    this._overrideMusicKey = null;
    // Key to restore after override ends
    this._preOverrideMusicKey = null;

    // Active crossfade timer reference (Phaser TimerEvent | null)
    this._crossfadeTimer   = null;

    // Whether the audio context has been unlocked
    this._contextUnlocked  = false;

    this._listenToRegistry();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API – Music
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Play a music track by key, looping by default.
   * If the track is already playing, this is a no-op.
   * @param {string} key - Audio asset key.
   * @param {object} [options]
   * @param {boolean} [options.loop=true]
   */
  playMusic(key, options = {}) {
    if (!key) return;
    if (this._currentMusicKey === key && this._currentMusic) return;

    this._stopCurrentMusic();

    const sound = this._createSound(key);
    if (!sound) return;

    const volume = this._effectiveMusicVolume();
    const loop   = options.loop !== false;

    sound.play({ volume, loop });
    this._currentMusic    = sound;
    this._currentMusicKey = key;
  }

  /**
   * Stop the currently playing music immediately.
   */
  stopMusic() {
    this._stopCurrentMusic();
    this._currentMusicKey = null;
  }

  /**
   * Crossfade from the current music track to a new one.
   * @param {string} key - Target music key.
   * @param {number} [durationMs=DEFAULT_CROSSFADE_MS]
   */
  crossfadeTo(key, durationMs = DEFAULT_CROSSFADE_MS) {
    if (!key) return;
    if (this._currentMusicKey === key && this._currentMusic) return;

    // Cancel any running crossfade
    this._cancelCrossfade();

    const outgoing = this._currentMusic;
    const incoming = this._createSound(key);
    if (!incoming) {
      // No incoming sound available — just stop old track
      this._stopCurrentMusic();
      this._currentMusicKey = null;
      return;
    }

    const targetVolume = this._effectiveMusicVolume();
    incoming.play({ volume: 0, loop: true });

    this._currentMusic    = incoming;
    this._currentMusicKey = key;

    const steps     = 20;
    const interval  = durationMs / steps;
    let   step      = 0;

    // Use setInterval for compatibility with both Phaser and test environments
    const timerId = setInterval(() => {
      step++;
      const progress = step / steps;

      if (outgoing) {
        const outVol = clamp01(targetVolume * (1 - progress));
        this._setSoundVolume(outgoing, outVol);
      }

      const inVol = clamp01(targetVolume * progress);
      this._setSoundVolume(incoming, inVol);

      if (step >= steps) {
        clearInterval(timerId);
        this._crossfadeTimer = null;
        if (outgoing) {
          outgoing.stop();
          outgoing.destroy();
        }
      }
    }, interval);

    this._crossfadeTimer = timerId;
  }

  /**
   * Pause the current music track.
   */
  pauseMusic() {
    if (this._currentMusic && typeof this._currentMusic.pause === 'function') {
      this._currentMusic.pause();
    }
  }

  /**
   * Resume a paused music track.
   */
  resumeMusic() {
    if (this._currentMusic && typeof this._currentMusic.resume === 'function') {
      this._currentMusic.resume();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API – Context-Aware Music
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Select and crossfade to the appropriate music track for a given scene.
   * @param {string} sceneKey - Phaser scene key (e.g. 'GameScene', 'MenuScene').
   * @param {object} [context]
   * @param {string} [context.timeOfDay]   - 'morning'|'day'|'evening'|'night'
   * @param {string} [context.location]    - 'outdoors'|'indoors'|string
   * @param {boolean} [context.inDialogue] - true when talking to an NPC
   * @param {string} [context.npcKey]      - NPC identifier for friend-theme
   * @param {number} [context.crossfadeMs] - Override crossfade duration
   */
  playMusicForScene(sceneKey, context = {}) {
    const key = this._resolveMusicKey(sceneKey, context);
    if (!key) return;
    const duration = context.crossfadeMs ?? DEFAULT_CROSSFADE_MS;
    this.crossfadeTo(key, duration);
  }

  /**
   * Push a temporary "mood override" track (e.g. random encounter music).
   * The current track key is saved so it can be restored via clearMoodOverride().
   * @param {string} key
   * @param {number} [durationMs]
   */
  setMoodOverride(key, durationMs = DEFAULT_CROSSFADE_MS) {
    if (!key) return;
    this._preOverrideMusicKey = this._currentMusicKey;
    this._cancelCrossfade();

    const sound = this._createSound(key);
    if (!sound) return;

    this._stopCurrentMusic();

    const volume = this._effectiveMusicVolume();
    sound.play({ volume, loop: true });

    this._overrideMusic    = sound;
    this._overrideMusicKey = key;
    this._currentMusic     = sound;
    this._currentMusicKey  = key;
  }

  /**
   * Stop the mood override and restore the previous track (crossfaded).
   * @param {number} [durationMs]
   */
  clearMoodOverride(durationMs = DEFAULT_CROSSFADE_MS) {
    if (!this._overrideMusicKey) return;

    const restoreKey = this._preOverrideMusicKey;
    this._overrideMusic    = null;
    this._overrideMusicKey = null;
    this._preOverrideMusicKey = null;

    if (restoreKey) {
      this.crossfadeTo(restoreKey, durationMs);
    } else {
      this.stopMusic();
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API – Sound Effects
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Play a one-shot sound effect.
   * Multiple SFX can play simultaneously.
   * @param {string} key - Audio asset key.
   * @param {object} [options]
   * @param {number} [options.pitchVariation] - Override the default ±10% range.
   */
  playSfx(key, options = {}) {
    if (!key) return;

    const sound = this._createSound(key);
    if (!sound) return;

    const volume = this._effectiveSfxVolume();
    const config = { volume };

    // Apply pitch variation if the key is in the designated set
    if (PITCH_VARIATION_KEYS.has(key)) {
      const range    = options.pitchVariation ?? PITCH_VARIATION_RANGE;
      const detune   = (Math.random() * 2 - 1) * range * 1200; // semitone cents
      config.detune  = detune;
    }

    sound.play(config);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API – Volume Control
  // ─────────────────────────────────────────────────────────────────────────────

  /** @param {number} value - 0 to 1 */
  setMasterVolume(value) {
    this._masterVolume = clamp01(value);
    this._applyMusicVolume();
  }

  /** @param {number} value - 0 to 1 */
  setMusicVolume(value) {
    this._musicVolume = clamp01(value);
    this._applyMusicVolume();
  }

  /** @param {number} value - 0 to 1 */
  setSfxVolume(value) {
    this._sfxVolume = clamp01(value);
  }

  /** @returns {number} Master volume (0–1) */
  getMasterVolume() { return this._masterVolume; }

  /** @returns {number} Music volume (0–1) */
  getMusicVolume() { return this._musicVolume; }

  /** @returns {number} SFX volume (0–1) */
  getSfxVolume() { return this._sfxVolume; }

  /** @returns {boolean} */
  isMuted() { return this._muted; }

  /**
   * Toggle mute state.
   * Volume settings are preserved; effective volume is set to 0 while muted.
   */
  toggleMute() {
    this._muted = !this._muted;
    this._applyMusicVolume();
  }

  /**
   * Explicitly set mute state.
   * @param {boolean} muted
   */
  setMuted(muted) {
    this._muted = Boolean(muted);
    this._applyMusicVolume();
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Public API – Audio Context Unlock
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Call once on first user interaction to unlock the Web Audio context.
   * Phaser handles this automatically in most cases, but this method provides
   * an explicit hook for scenes that want to ensure audio is ready.
   */
  unlock() {
    if (this._contextUnlocked) return;
    this._contextUnlocked = true;

    if (this._sound && typeof this._sound.unlock === 'function') {
      this._sound.unlock();
    } else if (
      this._sound &&
      this._sound.context &&
      this._sound.context.state === 'suspended' &&
      typeof this._sound.context.resume === 'function'
    ) {
      this._sound.context.resume().catch(() => {});
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────────────────────────────────────

  /** Computed effective volume for music (master × music × mute) */
  _effectiveMusicVolume() {
    return this._muted ? 0 : clamp01(this._masterVolume * this._musicVolume);
  }

  /** Computed effective volume for SFX (master × sfx × mute) */
  _effectiveSfxVolume() {
    return this._muted ? 0 : clamp01(this._masterVolume * this._sfxVolume);
  }

  /**
   * Apply the current effective music volume to the active music track.
   */
  _applyMusicVolume() {
    if (this._currentMusic) {
      this._setSoundVolume(this._currentMusic, this._effectiveMusicVolume());
    }
  }

  /**
   * Set volume on a sound object in a mock-safe way.
   * Phaser BaseSound uses a `.volume` setter; mocks may use setVolume().
   * @param {object} sound
   * @param {number} volume
   */
  _setSoundVolume(sound, volume) {
    if (typeof sound.setVolume === 'function') {
      sound.setVolume(volume);
    } else if ('volume' in sound) {
      sound.volume = volume;
    }
  }

  /**
   * Create a Phaser Sound object via `this._sound.add()`.
   * Returns null gracefully if the key does not exist in the cache.
   * @param {string} key
   * @returns {object|null}
   */
  _createSound(key) {
    if (!this._sound) return null;
    try {
      const sound = this._sound.add(key);
      return sound || null;
    } catch {
      return null;
    }
  }

  /**
   * Stop and destroy the current music track.
   */
  _stopCurrentMusic() {
    if (this._currentMusic) {
      try {
        this._currentMusic.stop();
        this._currentMusic.destroy();
      } catch {
        // ignore errors from already-destroyed objects
      }
      this._currentMusic = null;
    }
  }

  /**
   * Cancel an in-progress crossfade.
   */
  _cancelCrossfade() {
    if (this._crossfadeTimer !== null) {
      clearInterval(this._crossfadeTimer);
      this._crossfadeTimer = null;
    }
  }

  /**
   * Subscribe to registry change events for volume keys.
   */
  _listenToRegistry() {
    if (!this._registry || !this._registry.events) return;

    this._registry.events.on(`changedata-${RK.VOLUME_MASTER}`, (_parent, _key, value) => {
      this.setMasterVolume(value);
    });

    this._registry.events.on(`changedata-${RK.VOLUME_MUSIC}`, (_parent, _key, value) => {
      this.setMusicVolume(value);
    });

    this._registry.events.on(`changedata-${RK.VOLUME_SFX}`, (_parent, _key, value) => {
      this.setSfxVolume(value);
    });
  }

  /**
   * Resolve the correct music key based on scene and context.
   * @param {string} sceneKey
   * @param {object} context
   * @returns {string|null}
   */
  _resolveMusicKey(sceneKey, context) {
    // Dialogue overrides everything
    if (context.inDialogue) {
      return MUSIC_FRIENDSHIP;
    }

    if (sceneKey === 'GameScene') {
      if (context.location === 'indoors') {
        return MUSIC_INDOORS;
      }
      const tod = context.timeOfDay || this._registry.get(RK.TIME_OF_DAY);
      if (tod === 'night' || tod === 'evening') {
        return MUSIC_KOBENHAVN_NIGHTS;
      }
      return MUSIC_MORNING_COMMUTE;
    }

    return SCENE_MUSIC_MAP[sceneKey] || null;
  }
}
