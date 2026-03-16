# [ADR 0001] Game Engine and Framework Selection

**Date**: 2026-03-16  
**Status**: Accepted

## Context

Denmark Survival is a 2D RPG/life simulation game that needs to run in web browsers without requiring any additional tools or installations. The game features:
- 2D sprite-based graphics with top-down and side-view perspectives
- Dialogue systems and NPC interactions
- Character progression and stat management
- Multiple scenes (city exploration, interiors, UI overlays)
- Save/load functionality
- Asset management (sprites, audio, tilemaps)

**Key Constraints:**
- Must run entirely in browser (HTML5)
- No installation required by players
- Open source and free to use
- Development team wants basic, accessible technology
- Cross-browser compatibility required
- Need to support web deployment on platforms like itch.io or GitHub Pages

## Decision Drivers

- **Browser-only requirement**: Game must run without downloads or plugins
- **Zero-install development**: Minimal tooling setup for developers
- **Open source**: No licensing costs, community support
- **2D game capabilities**: Sprite rendering, animations, tilemaps, physics
- **Learning curve**: Team prefers straightforward, well-documented framework
- **Performance**: Smooth 60 FPS for 2D graphics
- **Asset pipeline**: Good support for loading sprites, audio, and tilemaps
- **Community**: Active community for troubleshooting and examples

## Considered Options

### Option 1: Phaser.js
**Description**: HTML5 game framework specifically designed for 2D games, built on Canvas and WebGL rendering. Mature, feature-rich framework with extensive documentation.

**Pros**:
- ✅ Designed specifically for 2D games (perfect fit)
- ✅ Excellent scene management system
- ✅ Built-in support for Tiled maps, sprite atlases, animations
- ✅ Comprehensive audio system
- ✅ Active community with extensive examples and tutorials
- ✅ MIT licensed (fully open source)
- ✅ Zero dependencies beyond browser APIs
- ✅ Works with plain JavaScript (no transpilation required)
- ✅ Built-in physics engines (Arcade, Matter.js)
- ✅ Input handling for keyboard, mouse, touch
- ✅ Well-documented API with TypeScript support
- ✅ Proven in production games (used by thousands of developers)

**Cons**:
- ⚠️ Larger framework size (~1-2MB) compared to minimal libraries
- ⚠️ Some features may be more than needed for simple game
- ⚠️ Opinionated architecture (must follow Phaser patterns)

### Option 2: PixiJS + Custom Game Logic
**Description**: Pure rendering library (PixiJS) combined with custom game logic, state management, and scene handling built from scratch.

**Pros**:
- ✅ Smaller core library (~500KB)
- ✅ Extremely fast WebGL rendering
- ✅ Flexible - build only what you need
- ✅ MIT licensed
- ✅ Used by many successful projects

**Cons**:
- ❌ No built-in game framework features (scenes, physics, audio)
- ❌ Requires building everything from scratch (scene manager, state, input)
- ❌ More development time needed
- ❌ No built-in Tiled map support
- ❌ Higher complexity for team without game engine experience
- ❌ More code to maintain

### Option 3: Vanilla Canvas + JavaScript
**Description**: Build everything from scratch using native HTML5 Canvas API and plain JavaScript without any framework.

**Pros**:
- ✅ Zero dependencies
- ✅ Complete control over every aspect
- ✅ Smallest possible file size
- ✅ Learning opportunity

**Cons**:
- ❌ Must implement everything manually (rendering, sprites, audio, input)
- ❌ Extremely time-consuming
- ❌ Higher risk of bugs
- ❌ No community support for game-specific issues
- ❌ Would need to reinvent solutions Phaser already provides
- ❌ Not practical for project timeline

### Option 4: Kaboom.js
**Description**: Beginner-friendly JavaScript game framework focused on simplicity and rapid prototyping.

**Pros**:
- ✅ Very simple API, minimal boilerplate
- ✅ Built-in sprite, animation, and physics
- ✅ MIT licensed
- ✅ Good for quick prototypes

**Cons**:
- ❌ Less mature than Phaser (fewer examples)
- ❌ Smaller community
- ❌ Limited scene management capabilities
- ❌ Less flexible for complex game mechanics
- ❌ No built-in Tiled support
- ❌ Better for arcade games than RPGs

## Decision Outcome

**Chosen Option**: Phaser.js (Version 3.80+)

**Rationale**:

Phaser.js is the best fit for Denmark Survival because:

1. **Perfect Feature Match**: Phaser is purpose-built for exactly this type of 2D game. It includes scene management, sprite rendering, tilemaps, animations, audio, and input handling out of the box - all features needed for the game.

2. **Browser-Only with Zero Install**: Phaser runs entirely in the browser via a simple script tag or bundler. No plugins, no downloads, no installation required for players or developers.

3. **Open Source & Free**: MIT licensed with no restrictions for commercial or educational use.

4. **Proven Track Record**: Thousands of published games use Phaser, including complex RPGs and simulation games similar to Denmark Survival.

5. **Excellent Documentation**: Comprehensive tutorials, API docs, and examples make it accessible for teams without extensive game development experience.

6. **Asset Pipeline**: Built-in loaders for Tiled JSON maps, texture atlases (Texture Packer), spritesheets, and audio files align perfectly with our asset needs.

7. **Scene Architecture**: Phaser's scene system naturally maps to our game structure (menu, character creation, city exploration, dialogue, inventory, etc.).

8. **Community Resources**: Large active community means finding solutions and examples is straightforward.

While Phaser is a larger framework than minimal options, the development time saved and reduced complexity justify the file size. The game will still load quickly on modern connections, especially with asset streaming.

## Consequences

### Positive
- ✅ **Faster Development**: Team can focus on game design rather than building engine infrastructure
- ✅ **Robust Architecture**: Phaser's scene system provides solid foundation for complex game states
- ✅ **Rich Ecosystem**: Plugins available for UI, pathfinding, dialogue systems
- ✅ **TypeScript Support**: Can optionally add TypeScript for better development experience
- ✅ **Mobile-Ready**: Touch input support enables future mobile deployment
- ✅ **Performance**: WebGL rendering provides smooth 60 FPS for 2D sprites
- ✅ **Debugging**: Built-in debug tools and browser DevTools integration

### Negative
- ⚠️ **Learning Curve**: Team must learn Phaser's API and patterns (mitigated by good docs)
- ⚠️ **Framework Lock-In**: Switching to different engine later would require significant rewrite
- ⚠️ **File Size**: ~1-2MB framework adds to initial load (mitigated by browser caching and compression)
- ⚠️ **Opinionated Structure**: Must follow Phaser's scene lifecycle and conventions

**Mitigation Strategies**:
- Provide team with Phaser tutorials and examples
- Use tree-shaking and bundler to include only needed Phaser features
- Implement progressive loading for game assets
- Enable gzip compression on hosting platform

### Neutral
- 📌 **JavaScript/TypeScript Required**: Team will work primarily in JavaScript (can add TypeScript later if desired)
- 📌 **Build Step Optional**: Can develop with simple HTML file or add Vite/Parcel for optimization
- 📌 **Version Management**: Should pin Phaser version to avoid breaking changes (v3.80+)

## Implementation Notes

1. **Project Setup**:
   - Include Phaser via CDN for quick start: `<script src="https://cdn.jsdelivr.net/npm/phaser@3.80/dist/phaser.min.js"></script>`
   - Or install via npm for bundled builds: `npm install phaser`

2. **Scene Structure** (will be detailed in separate ADR):
   - BootScene - Initial loading and setup
   - MenuScene - Main menu
   - CharacterCreationScene - Character customization
   - GameScene - Main gameplay (city exploration)
   - DialogueScene - NPC conversations (overlay)
   - InventoryScene - Inventory management (overlay)
   - SettingsScene - Game settings

3. **Asset Loading**:
   - Use Tiled Map Editor for city maps (export as JSON)
   - Create sprite atlases with Texture Packer or manually
   - Load assets in BootScene, cache globally
   - Implement asset streaming for larger content

4. **Development Workflow**:
   - Start with simple HTML file for prototyping
   - Add Vite or Parcel bundler when project grows
   - Use ES6 modules for code organization

## References

- [Phaser Official Website](https://phaser.io)
- [Phaser 3 Documentation](https://docs.phaser.io)
- [Phaser 3 Examples](https://phaser.io/examples)
- [Phaser GitHub Repository](https://github.com/phaserjs/phaser)
- GDD: specs/gdd.md - Section 1 (Game Overview), Section 6 (UI & Controls)
- Related ADRs: 
  - ADR 0002 - Scene Architecture Pattern
  - ADR 0003 - Asset Management Strategy
