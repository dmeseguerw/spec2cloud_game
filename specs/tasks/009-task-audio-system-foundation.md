# Task 009: Audio System Foundation

**GitHub Issue:** [#10 - Task 009: Audio System Foundation](https://github.com/dmeseguerw/spec2cloud_game/issues/10)
**GitHub PR:** [#13 - [WIP] Add audio management system for background music and sound effects](https://github.com/dmeseguerw/spec2cloud_game/pull/13)

## Description
Implement the audio management system that handles background music, sound effects, and audio settings. This includes a centralized AudioManager that plays, stops, and crossfades music tracks, plays one-shot sound effects, and respects user volume settings stored in the registry. The audio system is used by every feature for feedback sounds.

## Dependencies
- Task 002: Core Game Engine Configuration (Phaser audio subsystem)
- Task 003: State Management Foundation (volume settings in registry)
- Task 006: Asset Pipeline (audio files loaded)

## Technical Requirements

### AudioManager (`src/systems/AudioManager.js`)
Centralized audio controller accessible from any scene:

**Music Management:**
- Play a named music track (looping by default)
- Stop current music
- Crossfade between music tracks (configurable duration, default 1 second)
- Pause / resume music
- Only one music track plays at a time
- Music volume controlled by `VOLUME_MUSIC` registry key

**Sound Effects:**
- Play a one-shot sound effect by key
- Support overlapping SFX (multiple can play simultaneously)
- SFX volume controlled by `VOLUME_SFX` registry key
- Support pitch variation for variety (e.g., footsteps with ±10% random pitch)

**Volume Control:**
- Master volume multiplier (affects all audio)
- Music volume (0-1)
- SFX volume (0-1)
- Mute toggle (preserves volume settings, temporarily sets effective volume to 0)
- Volume changes take effect immediately on currently playing audio
- Listen for registry volume change events and update accordingly

**Context-Aware Music:**
- Define music track associations per scene/location:
  - MenuScene: menu theme
  - Character creation: "Arrival" theme
  - GameScene outdoors: "Morning Commute" / "København Nights" per time of day
  - GameScene indoors: location-specific track
  - Dialogue with NPC: friendship theme or default
- Ability to set "mood override" music (e.g., random encounter music)
- Restore previous track when override ends

### Audio Constants (`src/constants/AudioKeys.js`)
Define all audio asset key constants:
- Music track keys (mapped to loaded audio files)
- SFX keys categorized by type:
  - UI: click, hover, confirm, cancel, notification_chime
  - Gameplay: footstep_1/2/3, door_open, door_close
  - Feedback: xp_gain, xp_loss, money_gain, money_spend, level_up
  - Encounter: encounter_ping, encounter_resolve
  - Environment: rain, wind, birds (ambient loops)

### User Interaction Requirement
- Audio context must be unlocked on first user interaction (browser policy)
- Handle audio context resume on first click/keypress if needed
- No errors if audio plays before user interaction (queue or skip gracefully)

## Acceptance Criteria
- [ ] Background music plays and loops continuously
- [ ] Music crossfades smoothly when transitioning between tracks
- [ ] Sound effects play correctly and can overlap
- [ ] Master, music, and SFX volume controls work independently
- [ ] Volume changes apply immediately to currently playing audio
- [ ] Mute toggle silences all audio and unmute restores previous levels
- [ ] Audio context unlocks on first user interaction without errors
- [ ] Pitch variation on footstep SFX produces audible variety
- [ ] No audio errors in console when audio files are missing (graceful fallback)
- [ ] AudioManager is accessible from any scene
- [ ] Music changes appropriately when scene/location changes

## Testing Requirements
- **Unit Test**: AudioManager plays and stops music tracks correctly
- **Unit Test**: Volume settings clamp between 0 and 1
- **Unit Test**: Mute/unmute preserves volume values
- **Unit Test**: SFX pitch variation stays within configured range
- **Unit Test**: AudioManager handles missing audio keys gracefully (no crash)
- **Unit Test**: Crossfade starts/stops correct tracks
- **Integration Test**: Changing volume registry values updates playing audio
- **Integration Test**: Scene transition triggers correct music track
- **Manual Test**: Audio quality verification across different browsers
- **Manual Test**: Crossfade sounds smooth without pops or gaps
- **Coverage Target**: ≥85% for AudioManager module

## References
- ADR 0003: Asset Management (Freesound.org, OpenGameArt audio sources)
- GDD Section 7: Art & Audio Direction (music tracks, dynamic music system, SFX list)
- FDD: Character Creation (audio for selection steps)
- FDD: XP & Progression (level-up sound)
- FDD: Transportation (bike sounds, metro sounds)
- FDD: Random Encounters (encounter trigger sounds per category)
- FDD: Inventory & Economy (purchase, coin sounds)
- FDD: Encyclopedia (discovery chime)
