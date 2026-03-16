# [ADR 0004] State Management and Data Persistence Strategy

**Date**: 2026-03-16  
**Status**: Accepted

## Context

Denmark Survival requires managing complex game state across multiple systems:

**Player State:**
- Character data (name, nationality, job, appearance)
- Progression (XP, level, current day, chapter)
- Skills (language, cycling, cultural awareness, bureaucracy)
- Inventory and money
- Current location and position

**World State:**
- NPC relationships and conversation history
- Encyclopedia entries unlocked
- Completed quests/scenarios
- Time of day and season
- Random event history

**Meta State:**
- Game settings (volume, controls)
- Save slots
- Achievements/milestones
- Tutorial completion flags

The state must be:
1. **Accessible across all scenes** (MenuScene needs player data, GameScene needs everything)
2. **Persistable** (save to storage, load on game start)
3. **Reactive** (UI updates when XP changes, etc.)
4. **Structured** (avoid global variable chaos)
5. **Browser-compatible** (no server-side or native dependencies)

## Decision Drivers

- **Scene Communication**: State must be accessible from any scene
- **Data Persistence**: Save game data between sessions
- **Browser-Only Constraint**: Must work with browser APIs (localStorage, IndexedDB)
- **Simplicity**: Team wants straightforward solution, not complex state management library
- **Phaser Integration**: Should work naturally with Phaser's architecture
- **Performance**: Fast read/write for frequently accessed data
- **Reactivity**: UI should update automatically when data changes
- **Type Safety**: Minimize runtime errors from invalid state

## Considered Options

### Option 1: Phaser Registry + localStorage for Persistence
**Description**: Use Phaser's built-in Global Registry (Game Data Manager) for runtime state management, combined with browser localStorage for persistence. Create a SaveGame utility module to serialize/deserialize registry data.

**Pros**:
- ✅ Built into Phaser - zero additional dependencies
- ✅ Accessible from any scene via `this.registry`
- ✅ Event system for reactive updates (`changedata` events)
- ✅ localStorage is simple and widely supported (10MB+ storage)
- ✅ Synchronous API (no promises/async complexity)
- ✅ Works offline (no server required)
- ✅ Familiar pattern for Phaser developers
- ✅ Type-safe with constants file for keys

**Cons**:
- ⚠️ localStorage is string-only (need JSON serialization)
- ⚠️ No automatic persistence (must manually save)
- ⚠️ 10MB limit (sufficient for this game but not unlimited)
- ⚠️ Synchronous localStorage can block UI on large data (mitigated by small save size)

### Option 2: Redux/Zustand + IndexedDB
**Description**: Use external state management library (Redux or Zustand) with IndexedDB for persistence. Provides centralized store with actions/reducers.

**Pros**:
- ✅ Industry-standard state management patterns
- ✅ Time-travel debugging (Redux DevTools)
- ✅ Predictable state updates via reducers
- ✅ IndexedDB has much larger storage (50MB+)
- ✅ Async API doesn't block

**Cons**:
- ❌ **Additional dependencies** (adds 10-20KB, goes against minimal philosophy)
- ❌ Steeper learning curve (actions, reducers, middleware)
- ❌ More boilerplate code
- ❌ IndexedDB API is complex (async, callbacks)
- ❌ Overkill for single-player game
- ❌ Not integrated with Phaser - bridging required
- ❌ Requires understanding Redux/Zustand paradigms

### Option 3: Global JavaScript Object + Manual localStorage
**Description**: Create a plain JavaScript object `window.gameState` and manually serialize to localStorage.

**Pros**:
- ✅ Extremely simple
- ✅ No learning curve
- ✅ Direct property access (`gameState.playerXP`)

**Cons**:
- ❌ Global scope pollution
- ❌ No reactivity - manual UI updates needed everywhere
- ❌ No structure or type safety
- ❌ Difficult to debug
- ❌ Hard to test
- ❌ Poor separation of concerns
- ❌ Doesn't leverage Phaser features

### Option 4: Observer Pattern with Custom State Manager
**Description**: Build custom state manager class with observer pattern, persist to localStorage.

**Pros**:
- ✅ Full control over implementation
- ✅ Can optimize for specific game needs
- ✅ Reactive via observers

**Cons**:
- ❌ Reinventing the wheel (Phaser Registry already does this)
- ❌ More code to write and maintain
- ❌ Potential bugs in custom code
- ❌ Team must learn custom API

## Decision Outcome

**Chosen Option**: Phaser Registry + localStorage for Persistence (Option 1)

**Rationale**:

1. **Phaser Native**: The Registry is built into Phaser specifically for this use case - global shared state across scenes. Using it aligns with the framework rather than fighting against it.

2. **Zero Dependencies**: No need to add Redux, Zustand, or other libraries. Keeps the game lightweight and adheres to the "basic technology" requirement.

3. **Built-in Reactivity**: Registry emits `changedata` events, so UI can listen for changes:
   ```javascript
   this.registry.events.on('changedata-playerXP', (parent, value) => {
     this.xpDisplay.setText(`XP: ${value}`);
   });
   ```

4. **localStorage Sufficient**: For a single-player 2D RPG, localStorage's 10MB limit is more than enough. Save data will be <100KB (player stats, inventory, relationships, flags).

5. **Simplicity**: Straightforward API - `set()`, `get()`, `remove()`. Team can be productive immediately without learning Redux patterns.

6. **Proven Pattern**: Standard approach for Phaser games. Tons of examples and community support.

## State Architecture

### Registry Keys Organization

Create `src/constants/RegistryKeys.js` to ensure type safety and avoid typos:

```javascript
export const REGISTRY_KEYS = {
  // ==== Player Core ====
  PLAYER_NAME: 'playerName',
  PLAYER_NATIONALITY: 'playerNationality',
  PLAYER_JOB: 'playerJob',
  PLAYER_AVATAR: 'playerAvatar',           // sprite key
  
  // ==== Progression ====
  PLAYER_XP: 'playerXP',
  PLAYER_LEVEL: 'playerLevel',
  CURRENT_DAY: 'currentDay',
  CURRENT_CHAPTER: 'currentChapter',
  CURRENT_PHASE: 'currentPhase',            // Newcomer/Adapter/Resident/Local
  
  // ==== Skills ====
  SKILL_LANGUAGE: 'skillLanguage',          // 0-100
  SKILL_CYCLING: 'skillCycling',            // 0-100
  SKILL_CULTURAL: 'skillCultural',          // 0-100
  SKILL_BUREAUCRACY: 'skillBureaucracy',    // 0-100
  
  // ==== Resources ====
  MONEY: 'money',                           // DKK
  HEALTH: 'health',                         // 0-100
  HAPPINESS: 'happiness',                   // 0-100
  
  // ==== Inventory ====
  INVENTORY: 'inventory',                   // Array of item objects
  
  // ==== World State ====
  PLAYER_POSITION: 'playerPosition',        // { x, y, scene }
  NPC_RELATIONSHIPS: 'npcRelationships',    // Map of npcId -> relationship value
  ENCYCLOPEDIA: 'encyclopedia',             // Array of unlocked entry IDs
  COMPLETED_SCENARIOS: 'completedScenarios', // Array of scenario IDs
  DIALOGUE_HISTORY: 'dialogueHistory',      // Map of npcId -> conversation state
  
  // ==== Time & Season ====
  TIME_OF_DAY: 'timeOfDay',                 // morning/afternoon/evening/night
  SEASON: 'season',                         // spring/summer/fall/winter
  
  // ==== Settings ====
  VOLUME_MASTER: 'volumeMaster',            // 0-1
  VOLUME_MUSIC: 'volumeMusic',              // 0-1
  VOLUME_SFX: 'volumeSFX',                  // 0-1
  CONTROLS_SCHEME: 'controlsScheme',        // keyboard/gamepad
  TUTORIAL_COMPLETED: 'tutorialCompleted',  // boolean
};
```

### State Initialization

Create `src/state/StateManager.js` utility:

```javascript
import { REGISTRY_KEYS } from '../constants/RegistryKeys.js';

export class StateManager {
  /**
   * Initialize a new game with default values
   */
  static initializeNewGame(registry) {
    // Core player
    registry.set(REGISTRY_KEYS.PLAYER_NAME, '');
    registry.set(REGISTRY_KEYS.PLAYER_NATIONALITY, null);
    registry.set(REGISTRY_KEYS.PLAYER_JOB, null);
    
    // Progression
    registry.set(REGISTRY_KEYS.PLAYER_XP, 0);
    registry.set(REGISTRY_KEYS.PLAYER_LEVEL, 1);
    registry.set(REGISTRY_KEYS.CURRENT_DAY, 1);
    registry.set(REGISTRY_KEYS.CURRENT_CHAPTER, 1);
    registry.set(REGISTRY_KEYS.CURRENT_PHASE, 'Newcomer');
    
    // Skills
    registry.set(REGISTRY_KEYS.SKILL_LANGUAGE, 0);
    registry.set(REGISTRY_KEYS.SKILL_CYCLING, 0);
    registry.set(REGISTRY_KEYS.SKILL_CULTURAL, 0);
    registry.set(REGISTRY_KEYS.SKILL_BUREAUCRACY, 0);
    
    // Resources
    registry.set(REGISTRY_KEYS.MONEY, 5000);  // Starting DKK
    registry.set(REGISTRY_KEYS.HEALTH, 100);
    registry.set(REGISTRY_KEYS.HAPPINESS, 70);
    
    // World
    registry.set(REGISTRY_KEYS.INVENTORY, []);
    registry.set(REGISTRY_KEYS.NPC_RELATIONSHIPS, {});
    registry.set(REGISTRY_KEYS.ENCYCLOPEDIA, []);
    registry.set(REGISTRY_KEYS.COMPLETED_SCENARIOS, []);
    registry.set(REGISTRY_KEYS.DIALOGUE_HISTORY, {});
    
    // Time
    registry.set(REGISTRY_KEYS.TIME_OF_DAY, 'morning');
    registry.set(REGISTRY_KEYS.SEASON, 'spring');
    
    // Settings (defaults)
    registry.set(REGISTRY_KEYS.VOLUME_MASTER, 0.8);
    registry.set(REGISTRY_KEYS.VOLUME_MUSIC, 0.6);
    registry.set(REGISTRY_KEYS.VOLUME_SFX, 0.8);
    registry.set(REGISTRY_KEYS.TUTORIAL_COMPLETED, false);
  }
  
  /**
   * Save current registry state to localStorage
   */
  static saveGame(registry, slotNumber = 1) {
    const saveData = {
      version: '1.0.0',
      timestamp: Date.now(),
      playerName: registry.get(REGISTRY_KEYS.PLAYER_NAME),
      data: {}
    };
    
    // Serialize all registry values
    Object.values(REGISTRY_KEYS).forEach(key => {
      saveData.data[key] = registry.get(key);
    });
    
    const saveKey = `denmarkSurvival_save_${slotNumber}`;
    localStorage.setItem(saveKey, JSON.stringify(saveData));
    
    console.log(`Game saved to slot ${slotNumber}`);
    return saveData;
  }
  
  /**
   * Load game from localStorage into registry
   */
  static loadGame(registry, slotNumber = 1) {
    const saveKey = `denmarkSurvival_save_${slotNumber}`;
    const saveJSON = localStorage.getItem(saveKey);
    
    if (!saveJSON) {
      console.warn(`No save found in slot ${slotNumber}`);
      return false;
    }
    
    try {
      const saveData = JSON.parse(saveJSON);
      
      // Load all data into registry
      Object.entries(saveData.data).forEach(([key, value]) => {
        registry.set(key, value);
      });
      
      console.log(`Game loaded from slot ${slotNumber}`, saveData);
      return true;
    } catch (error) {
      console.error('Failed to load save:', error);
      return false;
    }
  }
  
  /**
   * Check if save exists
   */
  static hasSave(slotNumber = 1) {
    const saveKey = `denmarkSurvival_save_${slotNumber}`;
    return localStorage.getItem(saveKey) !== null;
  }
  
  /**
   * Delete save
   */
  static deleteSave(slotNumber = 1) {
    const saveKey = `denmarkSurvival_save_${slotNumber}`;
    localStorage.removeItem(saveKey);
  }
  
  /**
   * Get save metadata (for displaying save slots)
   */
  static getSaveMetadata(slotNumber = 1) {
    const saveKey = `denmarkSurvival_save_${slotNumber}`;
    const saveJSON = localStorage.getItem(saveKey);
    
    if (!saveJSON) return null;
    
    try {
      const saveData = JSON.parse(saveJSON);
      return {
        slotNumber,
        playerName: saveData.playerName,
        timestamp: saveData.timestamp,
        day: saveData.data[REGISTRY_KEYS.CURRENT_DAY],
        level: saveData.data[REGISTRY_KEYS.PLAYER_LEVEL],
        xp: saveData.data[REGISTRY_KEYS.PLAYER_XP],
      };
    } catch (error) {
      console.error('Failed to read save metadata:', error);
      return null;
    }
  }
}
```

## Consequences

### Positive
- ✅ **Zero Dependencies**: No external state management libraries needed
- ✅ **Framework Integration**: Works naturally with Phaser scenes
- ✅ **Reactive UI**: Registry events enable automatic UI updates
- ✅ **Type Safety**: Constants file prevents typos and provides autocomplete
- ✅ **Simple API**: Easy to learn and use (`get()`, `set()`)
- ✅ **Centralized State**: All game state accessible from any scene
- ✅ **Offline Compatible**: localStorage works without server
- ✅ **Fast Performance**: Synchronous in-memory reads, localStorage only for save/load
- ✅ **Easy Testing**: Can mock registry for unit tests
- ✅ **Browser Compatibility**: localStorage supported in all modern browsers

### Negative
- ⚠️ **Manual Save Triggers**: Must explicitly call `StateManager.saveGame()` (not automatic)
- ⚠️ **String Serialization**: Complex objects (classes) need careful serialization
- ⚠️ **10MB Storage Limit**: localStorage limit (but more than sufficient for this game)
- ⚠️ **No Type Checking**: Registry values are untyped at runtime (mitigated with constants)

**Mitigation Strategies**:
- Implement auto-save triggers (end of day, scene transitions, manual save)
- Use plain objects and arrays (avoid class instances for saved data)
- Monitor save size during development (should stay under 100KB)
- Create TypeScript types for registry values (optional improvement)
- Add save data validation on load

### Neutral
- 📌 **Cross-Device Sync**: No cloud save (could add later with backend)
- 📌 **Save Versioning**: Implement version field for save data migration if needed

## Implementation Notes

### 1. Scene Usage Example

```javascript
class GameScene extends Phaser.Scene {
  create() {
    // Read from registry
    const playerXP = this.registry.get(REGISTRY_KEYS.PLAYER_XP);
    const playerName = this.registry.get(REGISTRY_KEYS.PLAYER_NAME);
    
    // Create XP display
    this.xpText = this.add.text(10, 10, `XP: ${playerXP}`, { fontSize: '16px' });
    
    // Listen for XP changes
    this.registry.events.on('changedata-' + REGISTRY_KEYS.PLAYER_XP, (parent, value) => {
      this.xpText.setText(`XP: ${value}`);
      
      // Check for level up
      if (this.shouldLevelUp(value)) {
        this.scene.launch('LevelUpScene');
      }
    });
    
    // Bike interaction increases XP
    this.input.on('pointerdown', () => {
      const currentXP = this.registry.get(REGISTRY_KEYS.PLAYER_XP);
      this.registry.set(REGISTRY_KEYS.PLAYER_XP, currentXP + 10);  // Auto-updates UI!
    });
  }
  
  // Clean up listeners when scene stops
  shutdown() {
    this.registry.events.off('changedata-' + REGISTRY_KEYS.PLAYER_XP);
  }
}
```

### 2. Save System Integration

**Auto-Save Triggers:**
- End of each in-game day
- After character creation
- Before major story events
- Scene transitions (e.g., entering building)
- Player-initiated manual save

```javascript
// In DaySummaryScene after showing XP gains
class DaySummaryScene extends Phaser.Scene {
  endDay() {
    // Increment day
    const currentDay = this.registry.get(REGISTRY_KEYS.CURRENT_DAY);
    this.registry.set(REGISTRY_KEYS.CURRENT_DAY, currentDay + 1);
    
    // Auto-save
    StateManager.saveGame(this.registry);
    
    // Show save confirmation
    this.add.text(640, 680, 'Game Saved', { fontSize: '14px' })
      .setOrigin(0.5)
      .setAlpha(0.7);
    
    // Continue to next day
    this.time.delayedCall(2000, () => {
      this.scene.start('GameScene');
    });
  }
}
```

**Manual Save (in SettingsScene):**
```javascript
class SettingsScene extends Phaser.Scene {
  create() {
    const saveButton = this.add.text(400, 300, 'Save Game', { fontSize: '24px' })
      .setInteractive()
      .on('pointerdown', () => {
        StateManager.saveGame(this.registry);
        this.showSaveConfirmation();
      });
  }
}
```

### 3. Load System (in MenuScene)

```javascript
class MenuScene extends Phaser.Scene {
  create() {
    // Check for existing saves
    const hasSave = StateManager.hasSave(1);
    
    if (hasSave) {
      const metadata = StateManager.getSaveMetadata(1);
      
      // Show "Continue" button
      this.add.text(640, 300, 'Continue', { fontSize: '32px' })
        .setOrigin(0.5)
        .setInteractive()
        .on('pointerdown', () => {
          StateManager.loadGame(this.registry, 1);
          this.scene.start('GameScene');
        });
      
      // Display save info
      this.add.text(640, 350, 
        `${metadata.playerName} - Day ${metadata.day} - Level ${metadata.level}`,
        { fontSize: '16px' }
      ).setOrigin(0.5);
    }
    
    // "New Game" button
    this.add.text(640, 400, 'New Game', { fontSize: '32px' })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        StateManager.initializeNewGame(this.registry);
        this.scene.start('CharacterCreationScene');
      });
  }
}
```

### 4. Helper Functions for Common State Operations

Create `src/state/StateHelpers.js`:

```javascript
import { REGISTRY_KEYS } from '../constants/RegistryKeys.js';

export const StateHelpers = {
  /**
   * Add XP and check for level up
   */
  addXP(registry, amount) {
    const current = registry.get(REGISTRY_KEYS.PLAYER_XP);
    registry.set(REGISTRY_KEYS.PLAYER_XP, current + amount);
    
    // Check level up (example: 100 XP per level)
    const level = registry.get(REGISTRY_KEYS.PLAYER_LEVEL);
    const newLevel = Math.floor(current / 100) + 1;
    
    if (newLevel > level) {
      registry.set(REGISTRY_KEYS.PLAYER_LEVEL, newLevel);
      return { leveledUp: true, newLevel };
    }
    
    return { leveledUp: false };
  },
  
  /**
   * Modify NPC relationship
   */
  updateNPCRelationship(registry, npcId, change) {
    const relationships = registry.get(REGISTRY_KEYS.NPC_RELATIONSHIPS);
    relationships[npcId] = (relationships[npcId] || 50) + change;
    relationships[npcId] = Math.max(0, Math.min(100, relationships[npcId]));
    registry.set(REGISTRY_KEYS.NPC_RELATIONSHIPS, relationships);
  },
  
  /**
   * Add item to inventory
   */
  addItem(registry, item) {
    const inventory = registry.get(REGISTRY_KEYS.INVENTORY);
    inventory.push(item);
    registry.set(REGISTRY_KEYS.INVENTORY, inventory);
  },
  
  /**
   * Unlock encyclopedia entry
   */
  unlockEncyclopediaEntry(registry, entryId) {
    const encyclopedia = registry.get(REGISTRY_KEYS.ENCYCLOPEDIA);
    if (!encyclopedia.includes(entryId)) {
      encyclopedia.push(entryId);
      registry.set(REGISTRY_KEYS.ENCYCLOPEDIA, encyclopedia);
      return true;  // Newly unlocked
    }
    return false;  // Already unlocked
  }
};
```

## References

- [Phaser Data Manager Documentation](https://docs.phaser.io/phaser/concepts/data-manager)
- [Phaser Registry API](https://photonstorm.github.io/phaser3-docs/Phaser.Data.DataManager.html)
- [MDN localStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- GDD: specs/gdd.md - Section 3 (Game Mechanics), Section 4 (Progression Systems)
- Related ADRs:
  - ADR 0001 - Game Engine and Framework Selection
  - ADR 0002 - Scene Architecture Pattern
  - ADR 0005 - Save System Design
