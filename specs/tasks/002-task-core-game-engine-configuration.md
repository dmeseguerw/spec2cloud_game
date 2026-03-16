# Task 002: Core Game Engine Configuration

**GitHub Issue:** [#7 - Task 002: Core Game Engine Configuration](https://github.com/dmeseguerw/spec2cloud_game/issues/7)
**GitHub PR:** [#8 - [WIP] Configure Phaser.js game instance for Denmark Survival](https://github.com/dmeseguerw/spec2cloud_game/pull/8)

## Description
Configure the Phaser.js game instance with appropriate settings for Denmark Survival — a 2D top-down RPG running at 60 FPS. Set up the game configuration object, define rendering settings, physics, and register the initial BootScene that displays a loading screen while assets load.

## Dependencies
- Task 001: Project Structure & Build Setup

## Technical Requirements

### Game Configuration (`src/config.js`)
Define a configuration constants module exporting:
- **Game dimensions**: 800 x 600 pixels (or similar 4:3 / 16:9 ratio suitable for top-down RPG)
- **Renderer**: AUTO (WebGL preferred, Canvas fallback)
- **Physics**: Arcade physics enabled (gravity: 0 for top-down)
- **Scale mode**: FIT with center alignment (responsive to window size)
- **Background color**: A neutral color appropriate for loading screens
- **Pixel art rendering**: Enabled (antialias: false, roundPixels: true, pixelArt: true)
- **Parent element**: The game container div in index.html
- **FPS target**: 60

### Phaser Game Bootstrap (`src/main.js`)
- Import game configuration
- Import all scene classes
- Register scenes in the configuration's `scene` array
- Create the `Phaser.Game` instance
- Start with BootScene as the initial scene

### BootScene (`src/scenes/BootScene.js`)
This scene handles initial asset loading and displays a loading screen:
- Display game title "Denmark Survival" centered on screen
- Display a loading progress bar that fills as assets load
- Display loading percentage text
- On load complete, transition to MenuScene (or a placeholder scene for now)
- Load a minimal set of placeholder assets for testing (can be simple colored rectangles)

### Scene Registration
Register the following scene keys (empty placeholder classes for now — each will be implemented in separate tasks):
- `BootScene` — asset loading (implement in this task)
- `MenuScene` — main menu (placeholder)
- `CharacterCreationScene` — character setup (placeholder)
- `GameScene` — main gameplay (placeholder)
- `UIScene` — HUD overlay (placeholder)
- `DialogueScene` — NPC conversations (placeholder)
- `InventoryScene` — inventory/stats (placeholder)
- `DaySummaryScene` — end-of-day review (placeholder)
- `SettingsScene` — game settings (placeholder)

Each placeholder scene should be a minimal class extending `Phaser.Scene` with the correct key and an empty `create()` method that displays the scene name as text (for navigation testing).

## Acceptance Criteria
- [ ] Game initializes without errors and renders to the canvas
- [ ] Loading screen displays with title, progress bar, and percentage
- [ ] Progress bar fills from 0% to 100% as assets load
- [ ] After loading completes, game transitions to the next scene (MenuScene placeholder)
- [ ] Game runs at target 60 FPS (verifiable via Phaser debug or browser performance tools)
- [ ] Game canvas scales responsively when browser window is resized
- [ ] Pixel art rendering is enabled (no blurry sprites)
- [ ] All 9 scene keys are registered and can be started via `this.scene.start('SceneName')`
- [ ] Arcade physics is enabled with zero gravity
- [ ] No console errors or warnings during initialization

## Testing Requirements
- **Unit Test**: Game config object contains correct physics, scale, and renderer settings
- **Unit Test**: All 9 scene keys are registered in the game config
- **Unit Test**: BootScene transitions to MenuScene on load complete
- **Integration Test**: Create game instance and verify it reaches the BootScene create phase
- **Integration Test**: Verify scene transitions work (BootScene → MenuScene)
- **Manual Test**: Visual confirmation of loading bar animation
- **Manual Test**: Verify pixel art rendering (no anti-aliasing on sprites)
- **Coverage Target**: ≥85% for config.js and BootScene.js

## References
- ADR 0001: Game Engine Framework (Phaser 3.80+ configuration)
- ADR 0002: Scene Architecture (scene list, lifecycle)
- ADR 0007: Build System (ES6 module structure)
- GDD Section 6: UI & Controls (game resolution, input methods)
