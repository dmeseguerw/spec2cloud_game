# Task 003: State Management Foundation

## Description
Implement the state management layer using Phaser's Global Registry and localStorage for persistence, as defined in ADR 0004. This creates the RegistryKeys constants file, the StateManager utility for save/load operations, and the StateHelpers module for common state mutations. This is the data backbone of the entire game.

## Dependencies
- Task 002: Core Game Engine Configuration (Phaser game instance must exist)

## Technical Requirements

### Registry Keys Constants (`src/constants/RegistryKeys.js`)
Define all registry key constants organized by category:

**Player Core:**
- Player name, nationality, job, avatar sprite key

**Progression:**
- XP (number), level (1-20), current day (number), current chapter (1-3 + endgame), current phase (Newcomer/Adapter/Resident/Local)

**Skills (0-100 each):**
- Language, Cycling, Cultural Navigation, Bureaucracy

**Resources:**
- Money (DKK, integer), Health (0-100), Happiness (0-100), Mental Energy (0-100)

**Inventory:**
- Inventory array (objects with id, name, quantity, category, spoilsAt)

**World State:**
- Player position (x, y, scene key)
- NPC relationships (map: npcId → relationship value 0-100)
- Encyclopedia entries (set of unlocked entry IDs)
- Completed scenarios (set of scenario IDs)
- Dialogue history (map: npcId → conversation state)
- Encounter history (set of encountered event IDs + timestamps)

**Time & Season:**
- Time of day (morning/afternoon/evening/night)
- Season (spring/summer/fall/winter)
- Day within season (for season transitions)
- Sunset time (derived from season)

**Bills & Financial:**
- Pending bills (array of bill objects)
- Last salary day
- Pant bottles collected (count)

**Settings:**
- Master volume (0-1), Music volume (0-1), SFX volume (0-1)
- Controls scheme (keyboard/gamepad)
- Tutorial completed (boolean)
- Difficulty setting

**Meta:**
- Save slot (1-3)
- Total playtime (seconds)
- Game version

### StateManager Utility (`src/state/StateManager.js`)
Module with functions for:
- `initializeNewGame(registry, characterData)` — Set all registry keys to default starting values based on character creation data (nationality bonuses, job salary, starting items)
- `saveGame(registry, slot)` — Serialize all registry key values to a JSON object and write to localStorage under key `denmarkSurvival_save_{slot}`
- `loadGame(registry, slot)` — Read from localStorage, parse JSON, set all registry values
- `hasSave(slot)` — Check if a save exists for the given slot
- `deleteSave(slot)` — Remove a save from localStorage
- `getSaveMetadata(slot)` — Return save summary (player name, level, day, playtime) without full load
- `exportSave(slot)` — Return save data as downloadable JSON string (backup)
- `importSave(registry, jsonString, slot)` — Load from external JSON string (restore)

### StateHelpers Utility (`src/state/StateHelpers.js`)
Module with convenience functions that read/modify registry values:
- `addXP(registry, amount, source)` — Add XP, check for level-up threshold, emit level-up event if crossed
- `removeXP(registry, amount, source)` — Remove XP with floor at configured minimum
- `updateSkill(registry, skillKey, delta)` — Increment/decrement a skill, clamped 0-100
- `updateNPCRelationship(registry, npcId, delta)` — Change NPC relationship, clamped 0-100
- `addItem(registry, item)` — Add item to inventory (increment quantity if exists)
- `removeItem(registry, itemId, quantity)` — Remove item, handling insufficient quantity
- `addMoney(registry, amount)` — Add DKK
- `spendMoney(registry, amount)` — Subtract DKK; return false if insufficient
- `unlockEncyclopediaEntry(registry, entryId)` — Add entry to encyclopedia set if not already present
- `recordEncounter(registry, encounterId)` — Add encounter to history with current day
- `advanceTimeOfDay(registry)` — Move to next time period (morning→afternoon→evening→night→morning+day)
- `checkSpoiledFood(registry)` — Iterate inventory, remove items past spoil date

### Event Constants (`src/constants/Events.js`)
Define custom event name constants for game-wide events:
- `LEVEL_UP` — Emitted when player crosses XP threshold
- `XP_CHANGED` — Emitted on any XP change
- `MONEY_CHANGED` — Emitted on DKK change
- `ITEM_ADDED` / `ITEM_REMOVED`
- `RELATIONSHIP_CHANGED`
- `ENCYCLOPEDIA_UNLOCKED`
- `BILL_RECEIVED` / `BILL_PAID`
- `SEASON_CHANGED`
- `TIME_ADVANCED`
- `GAME_SAVED` / `GAME_LOADED`

## Acceptance Criteria
- [ ] All registry keys are defined as constants (no magic strings in game code)
- [ ] `initializeNewGame()` populates registry with correct defaults for all keys
- [ ] `saveGame()` serializes all game state to localStorage
- [ ] `loadGame()` restores all game state from localStorage correctly
- [ ] `hasSave()` correctly reports whether a save slot contains data
- [ ] `deleteSave()` removes save data from localStorage
- [ ] `getSaveMetadata()` returns summary without loading full state
- [ ] `addXP()` correctly triggers level-up event when crossing threshold
- [ ] `spendMoney()` returns false and makes no change when balance is insufficient
- [ ] `addItem()` increments quantity for existing items, adds new entry for new items
- [ ] `checkSpoiledFood()` removes items whose spoil date has passed
- [ ] All custom events are defined as constants
- [ ] Registry change events fire when data is modified via helpers

## Testing Requirements
- **Unit Test**: `initializeNewGame()` sets all required keys with correct default values
- **Unit Test**: `saveGame()` + `loadGame()` round-trip preserves all data types (numbers, strings, arrays, objects)
- **Unit Test**: `addXP()` triggers level-up at correct thresholds (500, 1500, 3000, 5000 XP boundaries)
- **Unit Test**: `removeXP()` does not go below minimum
- **Unit Test**: `spendMoney()` rejects insufficient funds
- **Unit Test**: `addItem()` handles both new items and quantity increment
- **Unit Test**: `removeItem()` handles partial removal and full removal
- **Unit Test**: `updateNPCRelationship()` clamps between 0 and 100
- **Unit Test**: `updateSkill()` clamps between 0 and 100
- **Unit Test**: `checkSpoiledFood()` correctly identifies and removes spoiled items
- **Unit Test**: `advanceTimeOfDay()` cycles correctly through all time periods
- **Unit Test**: `exportSave()` produces valid JSON; `importSave()` restores it
- **Integration Test**: Save game, reload page, load game — state is identical
- **Coverage Target**: ≥85% for all state management modules

## References
- ADR 0004: State Management & Data Persistence (RegistryKeys, StateManager, StateHelpers)
- FDD: XP & Progression (level thresholds, XP gain/loss)
- FDD: Inventory & Economy (item structure, DKK, spoilage)
- FDD: Dialogue & NPC (relationships 0-100)
- FDD: Encyclopedia (entry tracking)
- FDD: Random Encounters (encounter history)
- FDD: Daily Activity & Day Cycle (time of day, seasons)
