# Task 004: Scene Framework & Navigation System

**GitHub Issue:** [#11 - Task 004: Scene Framework & Navigation System](https://github.com/dmeseguerw/spec2cloud_game/issues/11)
**GitHub PR:** [#12 - [WIP] Implement scene transition and navigation framework](https://github.com/dmeseguerw/spec2cloud_game/pull/12)

## Description
Implement the scene transition and navigation framework that all game screens will use. This includes scene transition effects (fade in/out, slide), a scene manager utility for common transition patterns, and the parallel scene pattern (GameScene + UIScene running simultaneously). This establishes the navigation patterns that all subsequent scene-based tasks depend on.

## Dependencies
- Task 002: Core Game Engine Configuration (scenes registered)
- Task 003: State Management Foundation (registry available for scene data passing)

## Technical Requirements

### Scene Transition Manager (`src/scenes/SceneTransition.js`)
A utility module providing reusable transition functions:
- **Fade transitions**: Fade-to-black and fade-from-black with configurable duration (default 500ms)
- **Slide transitions**: Slide left/right/up/down for menu navigation feel
- **Instant transition**: No animation, immediate switch (for overlay scenes)
- All transitions should use Phaser's built-in camera fade or scene transition API

### Scene Navigation Patterns
Define and implement these standard navigation flows:

**Sequential Navigation** (one scene replaces another):
- BootScene → MenuScene
- MenuScene → CharacterCreationScene
- CharacterCreationScene → GameScene (with UIScene launched in parallel)
- GameScene → DaySummaryScene → GameScene

**Overlay Navigation** (scene launches on top without stopping parent):
- GameScene + UIScene (always parallel)
- GameScene + DialogueScene (dialogue overlay)
- GameScene + InventoryScene (inventory overlay)
- GameScene + ShopScene (shop overlay)
- Any Scene + PauseScene/SettingsScene (pause overlay)

**Data Passing Between Scenes:**
- Scenes pass data via `this.scene.start('NextScene', { key: value })`
- Receiving scene captures data in `init(data)` method
- Global state always accessed via `this.registry`

### Base Scene Template
Create a base scene pattern (or mixin) that all game scenes follow:
- Standard `init(data)` for receiving transition data
- Standard `create()` with registry access setup
- Standard `shutdown()` for cleanup (remove event listeners, destroy objects)
- Helper method for starting transitions (wraps SceneTransition utility)
- Helper method for launching overlay scenes
- Helper method for returning from overlay to parent scene

### Overlay Scene Behavior
Define how overlay scenes work:
- Parent scene pauses (stops update loop) but remains visible
- Overlay scene renders on top with semi-transparent dark background
- Closing overlay resumes parent scene
- Input is captured by overlay only (parent scene ignores input while overlay is active)
- Multiple overlays should not stack (opening new overlay closes current)

### Scene Lifecycle Hooks
Each scene stub (from Task 002) should be updated to follow the lifecycle pattern:
- `init(data)` → receive data, setup properties
- `preload()` → load scene-specific assets (if any)
- `create(data)` → build scene content, register event listeners
- `update(time, delta)` → game loop (only for scenes that need it)
- `shutdown()` → cleanup on scene stop

## Acceptance Criteria
- [ ] Fade transition works between any two scenes (configurable duration)
- [ ] Scene data passing works via `init(data)` — data arrives correctly in target scene
- [ ] Overlay scenes pause the parent scene's update loop
- [ ] Overlay scenes render on top with a semi-transparent background
- [ ] Closing an overlay resumes the parent scene
- [ ] UIScene can run in parallel with GameScene without conflict
- [ ] Scene transition manager provides fade, slide, and instant transition types
- [ ] All placeholder scenes follow the base scene lifecycle pattern
- [ ] Opening a new overlay while one is active closes the previous one
- [ ] No memory leaks when transitioning between scenes (event listeners cleaned up)

## Testing Requirements
- **Unit Test**: SceneTransition fade function starts and completes within specified duration
- **Unit Test**: SceneTransition passes data correctly to target scene
- **Unit Test**: Overlay launch pauses parent scene update loop
- **Unit Test**: Overlay close resumes parent scene update loop
- **Integration Test**: Navigate BootScene → MenuScene → GameScene sequence without errors
- **Integration Test**: Launch DialogueScene overlay from GameScene, close it, verify GameScene resumes
- **Integration Test**: Launch UIScene parallel to GameScene, verify both run simultaneously
- **Integration Test**: Scene shutdown properly removes all event listeners
- **Manual Test**: Visual confirmation of fade transition smoothness
- **Coverage Target**: ≥85% for SceneTransition module and base scene utilities

## References
- ADR 0002: Scene Architecture Pattern (scene list, parallel scenes, lifecycle)
- ADR 0004: State Management (registry for cross-scene data)
- GDD Section 2: Player Experience (session flow, screen transitions)
