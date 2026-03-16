# Task 010: Main Menu & Settings Screen

## Description
Implement the MainMenuScene and SettingsScene that serve as the game's entry point and configuration screen. The main menu offers New Game, Continue, Settings, and Credits options. The settings screen allows volume, controls, and accessibility adjustments. This is the first full screen players see after the boot sequence.

## Dependencies
- Task 004: Scene Framework & Navigation (scene transitions)
- Task 006: Asset Pipeline (menu background, UI assets)
- Task 007: UI Framework (buttons, panels, HTML overlays)
- Task 009: Audio System (menu music, button sounds)

## Technical Requirements

### MenuScene (`src/scenes/MenuScene.js`)
Full-screen main menu with:

**Visual Design:**
- Game title "Denmark Survival" prominently displayed
- Subtitle/tagline: "Master the art of Danish living, one bike ride at a time."
- Atmospheric background (Copenhagen illustration or animated scene)
- Danish design-inspired minimal aesthetic

**Menu Options (vertical button list):**
1. **New Game** → Transition to CharacterCreationScene
2. **Continue** → Load most recent save and resume (grayed out if no saves exist)
3. **Load Game** → Show save slot selector (3 slots with metadata preview)
4. **Settings** → Launch SettingsScene overlay
5. **Credits** → Display scrolling credits text

**Save Slot Selector:**
- Display 3 save slots
- Each slot shows: player name, level, current day, last played date (from `getSaveMetadata()`)
- Empty slots show "Empty Slot"
- Select slot to load; confirm before loading

**Credits Display:**
- Scrolling text showing: game concept, tools used, asset attributions (from CREDITS.md), licenses
- Press any key to return to menu

### SettingsScene (`src/scenes/SettingsScene.js`)
Overlay scene accessible from main menu and pause menu:

**Audio Settings:**
- Master volume slider (0-100%)
- Music volume slider (0-100%)
- SFX volume slider (0-100%)
- Mute toggle checkbox
- Changes apply immediately (play test sound on SFX change)

**Gameplay Settings:**
- Difficulty selector (Easy / Normal / Hard) — affects XP loss multiplier
- Tutorial hints toggle (on/off)

**Accessibility Settings:**
- Text size scaling (100%, 125%, 150%, 175%, 200%)
- High contrast mode toggle
- Dyslexia-friendly font toggle

**Controls Reference:**
- Display current key bindings (read-only for Phase 1)
- WASD/Arrows: Move, E: Interact, Space: Confirm, Tab: Inventory, Esc: Pause

**Save & Close:**
- Settings auto-save to registry + localStorage
- Close button returns to previous scene

### PauseScene (`src/scenes/PauseScene.js`)
Overlay launched during gameplay via Escape key:
- Resume button
- Settings button (launches SettingsScene)
- Save Game button (save to current slot)
- Load Game button (show slot selector)
- Main Menu button (confirm before losing unsaved progress)
- Quit button (same as Main Menu with confirmation)

### Background Music
- Menu scene plays the "Arrival" theme or equivalent menu music
- Music stops/transitions when starting a new game

## Acceptance Criteria
- [ ] Main menu displays with title, tagline, and all 5 menu buttons
- [ ] "New Game" transitions to CharacterCreationScene
- [ ] "Continue" loads the most recent save and resumes gameplay
- [ ] "Continue" is disabled/grayed when no saves exist
- [ ] "Load Game" shows 3 save slots with metadata preview
- [ ] Loading a save restores complete game state
- [ ] Settings sliders control audio volume in real-time
- [ ] Text size scaling visually changes all game text
- [ ] Settings persist across game sessions (saved to localStorage)
- [ ] Pause menu launches as overlay on Escape during gameplay
- [ ] "Save Game" from pause menu writes current state to save slot
- [ ] "Main Menu" from pause menu shows confirmation dialog
- [ ] Credits display and can be dismissed
- [ ] Menu music plays on entering MenuScene

## Testing Requirements
- **Unit Test**: Menu buttons navigate to correct scenes
- **Unit Test**: Save slot selector correctly displays metadata from StateManager
- **Unit Test**: Continue button disabled state when no saves exist
- **Unit Test**: Settings values write to registry correctly
- **Unit Test**: Volume slider values clamp between 0 and 1
- **Integration Test**: Full flow: MenuScene → Settings → change volume → close → volume persists
- **Integration Test**: Full flow: MenuScene → Load Game → select slot → game loads correctly
- **Integration Test**: Pause menu overlay pauses game and resumes on close
- **Manual Test**: Visual design matches Scandinavian minimal aesthetic
- **Manual Test**: All buttons have hover/click visual feedback
- **Coverage Target**: ≥85% for MenuScene logic, SettingsScene, PauseScene

## References
- ADR 0005: UI Framework (HTML overlays for settings)
- ADR 0004: State Management (save/load, settings persistence)
- FDD: Character Creation (MenuScene → CharacterCreationScene transition)
- GDD Section 6: UI & Controls (menu structure, accessibility features)
- GDD Section 7: Art & Audio (menu music — "Arrival" theme)
