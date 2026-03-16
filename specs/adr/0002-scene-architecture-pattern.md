# [ADR 0002] Scene-Based Architecture Pattern

**Date**: 2026-03-16  
**Status**: Accepted

## Context

Denmark Survival requires multiple distinct game states and UI screens:
- Boot/Loading screen
- Main menu with options
- Character creation wizard
- Main game world (Copenhagen city exploration)
- Dialogue system with NPCs
- Inventory management
- Day summary screens
- Settings and pause menu

The game needs clean separation between these states while sharing global data (player stats, XP, inventory, NPC relationships). According to the GDD, players navigate between these contexts fluidly during gameplay sessions.

**From GDD Requirements:**
- Players spend most time in the main game world but frequently switch to dialogue and inventory
- Some UI elements (health bar, XP meter) persist across multiple states
- Day cycles require transitions between gameplay and summary screens
- Clean state management needed to prevent bugs and maintain save data integrity

## Decision Drivers

- **State Isolation**: Each game screen should be self-contained and testable
- **Data Sharing**: Player data, game state, and settings must be accessible across screens
- **UI Layering**: Some UI scenes run simultaneously (e.g., game world + UI overlay)
- **Scene Transitions**: Smooth transitions between states (fades, slides)
- **Memory Management**: Efficiently load/unload assets per scene
- **Development Workflow**: Easy to add new scenes without affecting existing ones
- **Phaser Integration**: Leverage Phaser's built-in capabilities

## Considered Options

### Option 1: Phaser Scene-Based Architecture with Registry
**Description**: Use Phaser's built-in Scene system with Global Registry for shared state. Each major game screen is a separate Scene class with lifecycle methods (init, preload, create, update).

**Pros**:
- ✅ Native Phaser pattern - works with framework rather than against it
- ✅ Built-in scene lifecycle (init → preload → create → update)
- ✅ Scene Manager handles transitions, pausing, layering automatically
- ✅ Global Registry provides shared data store accessible from all scenes
- ✅ Can run multiple scenes simultaneously (e.g., GameScene + UIScene)
- ✅ Clean separation of concerns - each scene is isolated
- ✅ Easy to test individual scenes
- ✅ Scene data managers for scene-specific state
- ✅ Built-in scene sleeping/waking for memory efficiency

**Cons**:
- ⚠️ Scene communication requires registry or events (additional pattern to learn)
- ⚠️ Large scenes can become complex (mitigated with composition)

### Option 2: Single Scene with State Machine
**Description**: One Phaser Scene with internal state machine controlling which content is displayed. All game states handled within one large scene class.

**Pros**:
- ✅ No scene transitions needed
- ✅ Simpler mental model (one scene to manage)
- ✅ Easy to share data (all in one scope)

**Cons**:
- ❌ Monolithic scene class becomes massive and unmaintainable
- ❌ All assets stay loaded (memory inefficient)
- ❌ Difficult to test individual game states
- ❌ Hard to isolate bugs
- ❌ No clean separation of concerns
- ❌ Fights against Phaser's design
- ❌ Update loop runs all state logic every frame (performance issue)

### Option 3: Multiple Phaser Games (One Per State)
**Description**: Create separate Phaser.Game instances for each major game state, destroying and recreating as needed.

**Pros**:
- ✅ Complete isolation between states
- ✅ Clean memory management

**Cons**:
- ❌ Extremely inefficient - recreating WebGL context is expensive
- ❌ Sharing data between game instances is complex
- ❌ Slow transitions (destroy/create overhead)
- ❌ Not a standard pattern - no community examples
- ❌ Unnecessary complexity

## Decision Outcome

**Chosen Option**: Phaser Scene-Based Architecture with Global Registry

**Rationale**:

1. **Framework Alignment**: This is exactly how Phaser is designed to be used. The scene system was built for managing multiple game states, and fighting against it would create unnecessary complexity.

2. **GDD Requirements Match**: The game naturally breaks down into distinct scenes:
   - **BootScene**: Asset loading and initialization
   - **MenuScene**: Main menu and options
   - **CharacterCreationScene**: Nationality and job selection
   - **GameScene**: Main Copenhagen exploration (primary gameplay)
   - **DialogueScene**: NPC conversations (overlay, runs parallel to GameScene)
   - **InventoryScene**: Inventory and stats (overlay)
   - **DaySummaryScene**: End-of-day XP review
   - **SettingsScene**: Game settings (pause menu)

3. **Shared State via Registry**: Phaser's global registry (`this.registry`) provides a clean, built-in solution for sharing player data (XP, stats, inventory, relationships) across all scenes.

4. **Scene Layering**: The ability to run scenes simultaneously is crucial for UI overlays. For example, DialogueScene can run on top of GameScene without destroying the game world.

5. **Memory Efficiency**: Scenes can be put to sleep when not active, freeing resources while maintaining state.

6. **Proven Pattern**: Thousands of Phaser games use this architecture successfully, including complex RPGs.

## Scene Structure

### Core Scenes

```javascript
// Boot and Menu
- BootScene: Initial loading, display loading bar
- MenuScene: Main menu (New Game, Continue, Settings, Credits)

// Character Creation
- CharacterCreationScene: Select nationality, job, customize character

// Main Gameplay
- GameScene: Primary scene - Copenhagen world exploration
- UIScene: Persistent UI overlay (health, XP, time, notifications) - runs parallel

// Interactive Overlays (run on top of GameScene)
- DialogueScene: NPC conversations with choices
- InventoryScene: Inventory, stats, encyclopedia
- ShopScene: Grocery shopping, store interactions

// Transitions
- DaySummaryScene: End of day XP review and progression
- LevelUpScene: Skill/stat upgrades when leveling up

// Meta
- SettingsScene: Game settings, volume, controls
- PauseScene: Pause menu overlay
```

### Scene Lifecycle

Each scene follows this lifecycle:

```javascript
class MyScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MyScene' });
  }

  // 1. Initialize - receive data from previous scene
  init(data) {
    // data passed from scene.start('MyScene', { playerX: 100 })
  }

  // 2. Preload - load assets specific to this scene
  preload() {
    this.load.image('asset', 'path/to/asset.png');
  }

  // 3. Create - set up game objects
  create(data) {
    // Access global data
    const playerXP = this.registry.get('playerXP');
    
    // Create scene objects
    this.player = this.add.sprite(0, 0, 'player');
  }

  // 4. Update - game loop (60 FPS)
  update(time, delta) {
    // Handle input, update game objects
  }
}
```

## Consequences

### Positive
- ✅ **Clean Architecture**: Each scene is self-contained with clear responsibilities
- ✅ **Easy Development**: Team members can work on different scenes without conflicts
- ✅ **Testability**: Individual scenes can be tested in isolation
- ✅ **Performance**: Scenes sleep when not active, freeing resources
- ✅ **Maintainability**: Adding new scenes doesn't affect existing ones
- ✅ **Parallel Execution**: UI overlays run simultaneously with game scene
- ✅ **Scene Transitions**: Built-in transition support (fades, slides, etc.)
- ✅ **Asset Management**: Load scene-specific assets, unload when scene ends

### Negative
- ⚠️ **Learning Requirement**: Team must understand scene lifecycle and communication patterns
- ⚠️ **Registry Management**: Need conventions for registry keys to avoid collisions
- ⚠️ **Scene Communication**: Must use registry or events (not direct method calls)

**Mitigation Strategies**:
- Document scene lifecycle with examples
- Create constants file for all registry keys (`REGISTRY_KEYS.js`)
- Establish naming conventions for scenes and data
- Provide scene templates for consistency

### Neutral
- 📌 **Scene Count**: Will have 10-15 scenes total - manageable with organization
- 📌 **File Structure**: Each scene gets its own file in `src/scenes/`

## Implementation Notes

### 1. Scene Organization

```
src/
├── scenes/
│   ├── BootScene.js
│   ├── MenuScene.js
│   ├── CharacterCreationScene.js
│   ├── GameScene.js
│   ├── UIScene.js
│   ├── DialogueScene.js
│   ├── InventoryScene.js
│   ├── DaySummaryScene.js
│   └── SettingsScene.js
├── config.js               # Phaser game config
└── main.js                 # Entry point
```

### 2. Registry Keys (Global Shared Data)

Create `src/constants/RegistryKeys.js`:

```javascript
export const REGISTRY_KEYS = {
  // Player Data
  PLAYER_NAME: 'playerName',
  PLAYER_NATIONALITY: 'playerNationality',
  PLAYER_JOB: 'playerJob',
  PLAYER_XP: 'playerXP',
  PLAYER_LEVEL: 'playerLevel',
  PLAYER_POSITION: 'playerPosition',
  
  // Stats
  LANGUAGE_SKILL: 'languageSkill',
  CYCLING_SKILL: 'cyclingSkill',
  CULTURAL_SKILL: 'culturalSkill',
  BUREAUCRACY_SKILL: 'bureaucracySkill',
  
  // Inventory
  INVENTORY: 'inventory',
  MONEY: 'money',
  
  // Game State
  CURRENT_DAY: 'currentDay',
  CURRENT_CHAPTER: 'currentChapter',
  NPC_RELATIONSHIPS: 'npcRelationships',
  ENCYCLOPEDIA_UNLOCKED: 'encyclopediaUnlocked',
  
  // Settings
  VOLUME_MASTER: 'volumeMaster',
  VOLUME_MUSIC: 'volumeMusic',
  VOLUME_SFX: 'volumeSFX',
};
```

### 3. Scene Communication Patterns

**Starting a Scene:**
```javascript
// Stop current scene and start new one
this.scene.start('GameScene', { startX: 100, startY: 200 });

// Run scene in parallel (overlay)
this.scene.launch('DialogueScene', { npcId: 'mentor' });

// Pause current scene and launch overlay
this.scene.pause();
this.scene.launch('InventoryScene');
```

**Accessing Global Data:**
```javascript
// Write to registry
this.registry.set(REGISTRY_KEYS.PLAYER_XP, 150);

// Read from registry
const currentXP = this.registry.get(REGISTRY_KEYS.PLAYER_XP);

// Listen for registry changes
this.registry.events.on('changedata-' + REGISTRY_KEYS.PLAYER_XP, (parent, value) => {
  this.updateXPDisplay(value);
});
```

**Scene Events:**
```javascript
// Listen for scene events from another scene
this.scene.get('GameScene').events.on('player-moved', (position) => {
  // Update UI
});
```

### 4. Scene Registration in Game Config

```javascript
import { BootScene } from './scenes/BootScene.js';
import { MenuScene } from './scenes/MenuScene.js';
import { GameScene } from './scenes/GameScene.js';
// ... other scenes

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  scene: [
    BootScene,      // First scene to run
    MenuScene,
    CharacterCreationScene,
    GameScene,
    UIScene,
    DialogueScene,
    InventoryScene,
    DaySummaryScene,
    SettingsScene,
  ],
};

const game = new Phaser.Game(config);
```

### 5. Parallel Scene Pattern (UI Overlays)

```javascript
// GameScene - main gameplay scene runs continuously
class GameScene extends Phaser.Scene {
  create() {
    // Start UI scene as overlay
    this.scene.launch('UIScene');
    
    // When player talks to NPC
    this.events.on('talk-to-npc', (npcId) => {
      this.scene.pause();  // Pause gameplay
      this.scene.launch('DialogueScene', { npcId });
    });
  }
}

// DialogueScene - overlay that runs on top
class DialogueScene extends Phaser.Scene {
  init(data) {
    this.npcId = data.npcId;
  }
  
  closeDialogue() {
    this.scene.stop();  // Stop this scene
    this.scene.resume('GameScene');  // Resume main game
  }
}
```

## References

- [Phaser Scene Documentation](https://docs.phaser.io/phaser/concepts/scenes)
- [Phaser Scene Manager API](https://photonstorm.github.io/phaser3-docs/Phaser.Scenes.SceneManager.html)
- [Phaser Registry Documentation](https://docs.phaser.io/phaser/concepts/data-manager)
- GDD: specs/gdd.md - Section 3 (Game Mechanics), Section 6 (UI & Controls)
- Related ADRs:
  - ADR 0001 - Game Engine and Framework Selection
  - ADR 0004 - State Management Strategy
  - ADR 0003 - Asset Management Strategy
