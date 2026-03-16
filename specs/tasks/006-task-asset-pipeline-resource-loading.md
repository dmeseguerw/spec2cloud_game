# Task 006: Asset Pipeline & Resource Loading

## Description
Set up the asset loading pipeline, establish placeholder assets for all required asset types, and implement the asset manifest system per ADR 0003. This includes creating or sourcing initial placeholder sprites, tilesets, audio files, and UI elements so that all subsequent feature tasks can reference real loadable assets rather than colored rectangles.

## Dependencies
- Task 001: Project Structure & Build Setup (directory structure)
- Task 002: Core Game Engine Configuration (BootScene for loading)

## Technical Requirements

### Asset Manifest (`src/constants/AssetKeys.js`)
Define constants for all asset keys organized by type:

**Sprites:**
- Player character (idle, walk in 4/8 directions) — placeholder spritesheet
- NPC characters (at least 3 placeholder NPCs for testing)
- Interaction indicators (exclamation mark, question mark)

**Tilesets:**
- Base tileset for city environment (streets, buildings, sidewalks)
- Interior tileset (apartment, shops, offices)
- Nature tileset (parks, trees, water)

**Tilemaps:**
- One test tilemap (small area for movement testing) — created in Tiled or programmatically

**UI Assets:**
- HUD frame/panel backgrounds
- Button sprites (normal, hover, pressed states)
- Icons: health heart, XP star, money coin, time clock, weather icons (sun, rain, snow, cloud)
- Dialog box frame
- Inventory slot frame
- Progress bar (background + fill)
- Notification panel background

**Audio:**
- Placeholder background music track (1 loopable track, can be from Freesound/OpenGameArt)
- UI sound effects: click, hover, confirm, cancel, notification
- XP gain sound
- XP loss sound
- Coin/money sound
- Footstep sounds (2-3 variations)

**Fonts:**
- Load web fonts specified in ADR 0003 (Inter for UI text, Press Start 2P for pixel style if used)

### BootScene Asset Loading
Update BootScene (from Task 002) to:
- Load all assets defined in the asset manifest
- Display loading progress for each asset type
- Handle loading errors gracefully (log error, continue with placeholder)
- Cache all assets globally for scene access

### Asset Loading Patterns
- **Spritesheets**: Define frame dimensions and animation frame ranges
- **Atlases**: If using texture atlases, define atlas JSON format
- **Audio**: Load as Phaser audio objects with appropriate decode settings
- **Tilemaps**: Load Tiled JSON format + associated tileset images
- **Fonts**: Use CSS `@font-face` or Phaser's WebFont loader

### Placeholder Asset Requirements
- All placeholder assets must be clearly identifiable as placeholders (labeled or obviously temporary)
- Minimum resolution: 16x16 for sprites, 16x16 tiles for tilesets
- Placeholder assets should approximate final asset dimensions (player sprite ~32x48, tiles ~16x16 or 32x32)
- Sources: Kenney.nl (CC0), OpenGameArt.org (CC0/CC-BY), or hand-drawn simple shapes

### CREDITS.md Template
Populate with sections for tracking attribution:
- Asset name, source URL, license, author
- Organized by asset type (sprites, audio, tilesets, fonts, icons)

## Acceptance Criteria
- [ ] All asset key constants defined in AssetKeys.js
- [ ] BootScene loads all placeholder assets without errors
- [ ] Loading progress bar accurately reflects loading progress
- [ ] At least one spritesheet loads with correct frame dimensions
- [ ] At least one tilemap loads and can be rendered in a test scene
- [ ] At least one audio file loads and can be played
- [ ] UI assets (buttons, panels, icons) load and render correctly
- [ ] Loading errors are caught and logged without crashing
- [ ] CREDITS.md contains attribution for all used assets
- [ ] Total asset bundle size is under 10MB for placeholder set

## Testing Requirements
- **Unit Test**: AssetKeys.js exports all required key constants with no duplicates
- **Integration Test**: BootScene loads all assets and completes without error
- **Integration Test**: Sprites render at correct dimensions
- **Integration Test**: Audio plays without errors
- **Integration Test**: Tilemap renders with correct tile positioning
- **Manual Test**: Visual verification of all placeholder assets rendering correctly
- **Manual Test**: Verify loading bar shows smooth progress
- **Coverage Target**: ≥85% for AssetKeys module; loading logic covered by integration tests

## References
- ADR 0003: Asset Management Strategy (sources, directory structure, attribution)
- ADR 0001: Game Engine (Phaser asset loading API)
- GDD Section 7: Art & Audio Direction (asset style guidelines)
