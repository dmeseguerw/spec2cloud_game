# Task 008: Player Entity & World Movement

**GitHub Issue:** [#15 - Task 008: Player Entity & World Movement](https://github.com/dmeseguerw/spec2cloud_game/issues/15)
**GitHub PR:** [#18 - [WIP] Implement player entity and world movement features](https://github.com/dmeseguerw/spec2cloud_game/pull/18)

## Description
Implement the player character entity, 8-directional top-down movement, and the base GameScene world that the player navigates. This includes the player sprite with walk animations, collision with world boundaries and objects, camera following, and the foundation tilemap rendering for Copenhagen environments. This task creates the "walking around" core that all location-based features depend on.

## Dependencies
- Task 002: Core Game Engine Configuration (GameScene, physics)
- Task 003: State Management Foundation (player position in registry)
- Task 004: Scene Framework (GameScene lifecycle, UIScene parallel)
- Task 006: Asset Pipeline (player sprite, tileset, tilemap)

## Technical Requirements

### Player Entity (`src/entities/Player.js`)
A player game object with:
- **Sprite**: Animated spritesheet with idle and walk frames in 4 or 8 directions
- **Physics body**: Arcade physics body for collision
- **Movement speed**: Configurable base walking speed (e.g., 100 pixels/sec)
- **8-directional movement**: Respond to WASD / Arrow Keys for up, down, left, right, and diagonals
- **Diagonal speed normalization**: Diagonal movement should not be faster than cardinal
- **Idle animation**: Play idle frame when no movement keys are pressed
- **Walk animation**: Play directional walk animation matching movement direction
- **Facing direction**: Track which direction player is facing (for interactions)
- **Interaction zone**: Small area in front of player for detecting interactable objects

### Input Handling (`src/systems/InputManager.js`)
- Keyboard: WASD + Arrow Keys for movement
- E key: Context-sensitive interact (talk to NPC, enter building, pick up item)
- Space: Confirm / advance dialogue
- Escape: Pause menu
- Tab: Open inventory
- M: Open map (future)
- Input should be disabled when overlay scenes are active
- Debounce interact key to prevent accidental double-triggers

### GameScene World (`src/scenes/GameScene.js`)
The primary gameplay scene:
- **Tilemap rendering**: Load and render a Tiled JSON tilemap with multiple layers:
  - Ground layer (streets, sidewalks, grass)
  - Building layer (building facades, walls)
  - Decoration layer (trees, benches, signs, lampposts)
  - Collision layer (invisible tiles marking non-walkable areas)
- **Camera**: Follow the player, constrained to tilemap boundaries
- **World bounds**: Match tilemap dimensions
- **Collision**: Player collides with collision layer tiles and solid objects
- **Interactable objects**: Objects/NPCs marked with an interaction indicator when player is nearby
- **Area transitions**: Designated tiles/zones that trigger location changes (enter building, change district)
- **Location tracking**: Update `PLAYER_POSITION` registry when player moves between areas

### Area/Zone System
- Define named zones within the tilemap (or use separate tilemaps per location)
- Each zone has a name displayed in the HUD (via UIScene)
- Entering a new zone updates the location name in registry
- Zone entry can trigger events (first visit → encyclopedia entry)

### NPC Placement (Foundation)
- Support placing NPC sprites at defined positions in the world
- NPCs display an interaction indicator (e.g., exclamation mark) when player is within range
- Pressing interact key near an NPC queues a dialogue trigger (dialogue system in separate task)
- NPCs have idle animations

### Interaction System Foundation
- Detect interactable objects within player's interaction zone
- Show context hint in HUD bottom-center (e.g., "Press E to talk to Lars")
- Execute interaction callback on key press
- Support interaction types: talk (NPC), enter (door/building), examine (object), pickup (item)

## Acceptance Criteria
- [ ] Player character renders with correct sprite at starting position
- [ ] Player moves in 8 directions with smooth animation at consistent speed
- [ ] Diagonal movement is normalized (not faster than cardinal)
- [ ] Player plays idle animation when standing still
- [ ] Walk animation direction matches movement direction
- [ ] Camera follows player and stays within world bounds
- [ ] Player cannot walk through collision layer tiles
- [ ] Tilemap renders with all layers visible
- [ ] Area name updates in HUD when player enters a new zone
- [ ] Interaction indicator appears when player is near an interactable NPC/object
- [ ] Context hint text appears at bottom of screen near interactables
- [ ] Pressing E near an NPC triggers interaction callback
- [ ] Input is disabled when an overlay scene is active
- [ ] Player position is persisted to registry

## Testing Requirements
- **Unit Test**: Player movement speed is consistent in all 8 directions (diagonal normalized)
- **Unit Test**: Player facing direction updates correctly based on last movement
- **Unit Test**: Interaction zone detects objects within range and ignores objects out of range
- **Unit Test**: InputManager blocks input when overlay flag is set
- **Unit Test**: Area zone detection fires on zone boundary crossing
- **Integration Test**: Player spawns at correct position from registry state
- **Integration Test**: Camera follows player without exceeding tilemap bounds
- **Integration Test**: Collision prevents player from entering solid tiles
- **Integration Test**: Interaction with NPC triggers dialogue callback
- **Manual Test**: Smooth visual movement in all 8 directions
- **Manual Test**: Camera scrolling feels natural and bounded
- **Coverage Target**: ≥85% for Player, InputManager, and zone detection logic

## References
- ADR 0001: Game Engine (Phaser Arcade physics, sprites)
- ADR 0002: Scene Architecture (GameScene as primary gameplay scene)
- ADR 0003: Asset Management (tilesets, spritesheets)
- FDD: Transportation & Movement (walking speed, movement mechanics)
- GDD Section 3: Game Mechanics (player verbs — walk, talk, interact)
- GDD Section 6: UI & Controls (input methods, WASD/Arrow, E to interact)
