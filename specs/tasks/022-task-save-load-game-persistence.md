# Task 022: Save/Load & Game Persistence

## Description
Implement the full save/load system with 3 save slots, auto-save, manual save, save export/import (backup), and game-over/restart handling. While the StateManager foundation exists in Task 003, this task integrates it into the full gameplay flow — auto-save triggers, save confirmation UI, load game flow, and edge cases like corrupted saves.

## Dependencies
- Task 003: State Management Foundation (StateManager save/load functions)
- Task 007: UI Framework (save slot UI, confirmation dialogs)
- Task 010: Main Menu & Settings (load game from menu, save from pause)
- Task 013: Day Cycle (auto-save at end of day)

## Technical Requirements

### Save System Integration

**Auto-Save:**
- Automatically save at the end of each in-game day (after DaySummaryScene)
- Auto-save uses the current save slot (selected during New Game or Load)
- Brief "Auto-saved" notification appears (not disruptive)
- No auto-save during tutorials or character creation

**Manual Save:**
- Available from pause menu "Save Game" button
- Player can save to current slot (quick save) or choose a different slot
- Confirmation before overwriting existing save
- "Saved successfully" notification after save

**Save Slot System:**
- 3 save slots
- Each slot stores: complete game state, metadata (name, level, day, playtime, timestamp)
- Empty slot display: "Empty Slot"
- Occupied slot display: player name, level, day, playtime, last saved timestamp
- Selecting occupied slot shows confirmation: "Overwrite existing save?"

### Load System Integration

**Load from Main Menu:**
- "Load Game" button opens save slot selector
- Select slot → confirm → load state → resume GameScene at saved position
- Loading shows brief loading transition

**Load from Pause Menu:**
- "Load Game" option in pause menu
- Same slot selector
- Confirm: "Unsaved progress will be lost. Continue?"
- Load state → resume at loaded position

**Continue (Quick Load):**
- "Continue" on main menu loads most recent save (by timestamp)
- If no saves exist, "Continue" is disabled/grayed

### Save Data Integrity

**Validation on Load:**
- Verify save data has all required keys
- Check game version compatibility
- Handle missing keys by providing defaults (forward compatibility)
- Detect and handle corrupted saves (invalid JSON, missing critical data)
- On corrupted save: show error message, offer to delete corrupted slot

**Save Export/Import:**
- "Export Save" option in settings: downloads save data as `.json` file
- "Import Save" option in settings: upload `.json` file to a save slot
- Validate imported data before writing
- Useful for: sharing saves, transferring between browsers, backup

### Game Over & Restart

**Game Over Condition:**
- XP drops below -500 (sustained failure threshold)
- Warning at -100 XP for 3 consecutive days: "You're struggling. Consider adjusting difficulty."
- At game over threshold: "Game Over" screen with options:
  - "Try Again" — reload last save
  - "New Game" — start fresh character creation
  - "Main Menu" — return to menu

**Game Over Screen:**
- Display summary: days survived, highest level reached, notable achievements
- Encouraging message: "Living abroad is tough! Learn from your experience."
- No permadeath — player can always reload

### Playtime Tracking
- Track total play time (in seconds) in registry
- Update playtime on save
- Display in save slot metadata and character stats

## Acceptance Criteria
- [ ] Auto-save triggers at end of each in-game day
- [ ] Manual save from pause menu works correctly
- [ ] 3 save slots display with correct metadata
- [ ] Overwriting existing save requires confirmation
- [ ] Loading a save restores complete game state
- [ ] "Continue" loads most recent save
- [ ] "Continue" disabled when no saves exist
- [ ] Corrupted saves detected and handled gracefully
- [ ] Save export downloads valid JSON file
- [ ] Save import validates and loads external JSON
- [ ] Game over triggers at configured XP threshold
- [ ] Game over screen provides retry/restart/menu options
- [ ] Warning appears at sustained negative XP
- [ ] Playtime tracked and displayed accurately
- [ ] Save version compatibility handles missing keys

## Testing Requirements
- **Unit Test**: Auto-save triggers at correct game lifecycle point
- **Unit Test**: Save slot metadata generates correctly
- **Unit Test**: Most recent save detection (by timestamp)
- **Unit Test**: Save data validation catches missing required keys
- **Unit Test**: Corrupted save detection (invalid JSON)
- **Unit Test**: Forward compatibility — loading old save with missing keys fills defaults
- **Unit Test**: Game over threshold triggers at correct XP level
- **Unit Test**: Game over warning at sustained negative XP (3 days)
- **Unit Test**: Export produces valid JSON matching save format
- **Unit Test**: Import validation rejects invalid data
- **Integration Test**: Full save → quit → relaunch → load → state matches
- **Integration Test**: Game over → "Try Again" → reloads last save correctly
- **Integration Test**: Auto-save notification appears briefly then dismisses
- **E2E Test**: Complete day → auto-save → reload from menu → state preserved
- **Coverage Target**: ≥85% for save integration, validation, game over logic

## References
- ADR 0004: State Management (localStorage, StateManager, save structure)
- FDD: XP & Progression (game over threshold)
- GDD Section 2: Player Experience (save/load flow)
- GDD Section 6: UI & Controls (menu structure, save slots)
