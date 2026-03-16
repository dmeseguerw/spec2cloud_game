# Architecture Decision Records - Denmark Survival

This directory contains all Architecture Decision Records (ADRs) for the Denmark Survival game project.

## Overview

ADRs document key architectural and technical decisions made during game development. Each ADR follows the MADR (Markdown Any Decision Records) format and includes:
- Context and problem statement
- Decision drivers
- Considered options with pros/cons
- Decision outcome and rationale
- Consequences (positive, negative, neutral)
- Implementation notes

## ADR Index

### [ADR 0001: Game Engine and Framework Selection](0001-game-engine-framework.md)
**Status**: Accepted  
**Decision**: Phaser.js (v3.80+)  
**Summary**: Selected Phaser.js as the HTML5 game framework for its zero-dependency browser-based development, comprehensive 2D game features, and open source license.

**Key Points**:
- Browser-only, no installation required
- Built-in scene management, sprite rendering, tilemaps, audio
- MIT licensed, completely free
- Excellent documentation and community support
- Perfect fit for 2D RPG requirements

---

### [ADR 0002: Scene-Based Architecture Pattern](0002-scene-architecture-pattern.md)
**Status**: Accepted  
**Decision**: Phaser Scene System with Global Registry  
**Summary**: Use Phaser's built-in scene architecture with global registry for state sharing. Each game screen (menu, gameplay, dialogue, inventory) is a separate scene.

**Key Points**:
- Clean separation of concerns (one scene per game state)
- Built-in scene lifecycle (init, preload, create, update)
- Global registry for shared player data
- Can run scenes in parallel (overlays)
- Memory efficient (scenes sleep when not active)

**Scene Structure**:
- BootScene: Asset loading
- MenuScene: Main menu
- CharacterCreationScene: Character setup
- GameScene: Main Copenhagen exploration
- UIScene: Persistent HUD overlay
- DialogueScene: NPC conversations
- InventoryScene: Inventory/stats management
- DaySummaryScene: End-of-day XP review
- SettingsScene: Game settings

---

### [ADR 0003: Asset Management and Open Source Asset Strategy](0003-asset-management-strategy.md)
**Status**: Accepted  
**Decision**: Curated Open Source Assets + Tiled + Custom Creation  
**Summary**: Combine professional open source asset packs with custom-created Denmark-specific content using free tools.

**Key Points**:
- **Zero cost**: All assets from free sources (Kenney.nl, OpenGameArt.org, LPC, Freesound.org)
- **Tools**: Tiled (maps), Pixelorama/GIMP (sprites), Audacity (audio)
- **Licenses**: CC0, CC-BY 3.0, MIT (all permissive)
- **Workflow**: Start with generic assets, progressively add Denmark-specific content

**Asset Sources**:
- Characters: LPC Character Generator
- Environment: Kenney.nl tilesets, OpenGameArt.org
- UI: Kenney.nl UI packs
- Icons: Game-icons.net (4000+ SVG icons)
- Audio: Freesound.org, OpenGameArt.org
- Fonts: Google Fonts (Inter, Press Start 2P)

---

### [ADR 0004: State Management and Data Persistence Strategy](0004-state-management-data-persistence.md)
**Status**: Accepted  
**Decision**: Phaser Registry + localStorage  
**Summary**: Use Phaser's built-in global registry for runtime state, localStorage for save/load persistence. Zero external dependencies.

**Key Points**:
- Phaser Registry accessible from all scenes via `this.registry`
- Event-driven reactivity for UI updates
- localStorage for save games (10MB limit, more than sufficient)
- StateManager utility for save/load operations
- Constants file (RegistryKeys.js) for type-safe key names

**Data Organization**:
- Player: name, nationality, job, XP, level, skills
- World: NPC relationships, encyclopedia entries, completed scenarios
- Resources: money, health, happiness, inventory
- Settings: volume, controls, tutorial completion

---

### [ADR 0005: UI Framework and Implementation Strategy](0005-ui-framework-implementation.md)
**Status**: Accepted  
**Decision**: Hybrid - Phaser UI + HTML/DOM Overlays  
**Summary**: Use Phaser Game Objects for in-game UI (HUD, dialogue, tooltips), HTML/DOM for complex forms and menus (character creation, settings). Best of both worlds.

**Key Points**:
- **Phaser UI**: Health bars, XP meters, in-game notifications, dialogue boxes
- **HTML/DOM**: Main menu, character creation forms, settings menu
- **Zero dependencies**: Both Phaser and HTML/DOM are built-in
- **CSS styling**: Leverage CSS for responsive, polished forms
- **Accessibility**: HTML inputs work with screen readers

**When to Use Each**:
- Phaser: Visual game elements that need game integration
- HTML: Forms, text inputs, complex layouts

---

### [ADR 0006: Deployment Platform and Hosting Strategy](0006-deployment-platform-hosting.md)
**Status**: Accepted  
**Decision**: Itch.io (Primary) + GitHub Pages (Secondary)  
**Summary**: Dual-platform deployment for game distribution and development hosting. Both are free, HTTPS-enabled, and globally distributed.

**Key Points**:
- **Itch.io**: Primary player distribution, built-in game portal community
- **GitHub Pages**: Developer hosting, version control, backup
- **Completely free**: Zero hosting costs forever
- **CDN included**: Fast global delivery on both platforms
- **Simple deployment**: ZIP upload (itch.io), git push (GitHub Pages)

**Deployment Tools**:
- Butler CLI (optional): Faster itch.io uploads with delta updates
- GitHub Actions: Automated deployment to GitHub Pages

---

### [ADR 0007: Build System and Development Workflow](0007-build-system-development-workflow.md)
**Status**: Accepted  
**Decision**: Progressive Enhancement - Start Plain HTML, Add Vite Later  
**Summary**: Begin with zero build system (plain HTML + ES6 modules) for simplicity. Add Vite when team wants hot reload and optimization.

**Key Points**:
- **Phase 1 (Prototyping)**: No build system, plain HTML, Phaser via CDN
  - Instant start, zero setup, simple mental model
  - Use `npx http-server` for development
  
- **Phase 2 (Active Development)**: Add Vite
  - Instant hot module reload
  - Production optimization (minification, tree-shaking)
  - Zero-config setup (`npm create vite@latest`)
  - Fast build times (Vite is extremely fast)

**Migration Path**: Clear steps to move from Phase 1 to Phase 2 when ready

---

## Decision Matrix

| Requirement | Solution | ADR |
|-------------|----------|-----|
| Game Engine | Phaser.js | 0001 |
| Architecture | Scene-Based with Registry | 0002 |
| Assets | Open Source Packs + Custom | 0003 |
| State Management | Registry + localStorage | 0004 |
| UI System | Hybrid (Phaser + HTML) | 0005 |
| Hosting | Itch.io + GitHub Pages | 0006 |
| Build System | Progressive (HTML → Vite) | 0007 |

## Technology Stack Summary

**Core Framework**:
- Phaser.js 3.80+ (HTML5 game framework)

**Development**:
- Phase 1: Plain HTML + ES6 modules + http-server
- Phase 2: Vite (hot reload, optimization)

**Assets**:
- Tiled Map Editor (maps)
- Kenney.nl, OpenGameArt.org, LPC (art assets)
- Freesound.org (audio)
- GIMP/Pixelorama (custom art creation)

**Hosting**:
- Itch.io (primary distribution)
- GitHub Pages (development hosting)

**State & Storage**:
- Phaser Registry (runtime state)
- localStorage (save games)

**UI**:
- Phaser Game Objects (in-game UI)
- HTML/CSS (forms and menus)

## Constraints and Principles

All decisions follow these project constraints:

1. **Browser-Only**: No installation required, runs entirely in browser
2. **Zero Budget**: All tools and assets must be free/open source
3. **Keep It Simple**: Prefer simpler solutions over complex enterprise patterns
4. **Open Source**: MIT, CC0, CC-BY licenses only
5. **No Backend Required**: Game is fully client-side (localStorage for saves)

## References

- [Game Design Document](../gdd.md) - Game requirements and features
- [Phaser Official Documentation](https://docs.phaser.io)
- [MADR Format](https://adr.github.io/madr/)

## Updating ADRs

When architectural decisions change:
1. Update the status of superseded ADR to "Superseded"
2. Create new ADR with sequential number
3. Reference the superseded ADR in the new one
4. Update this README index

Never delete old ADRs - they provide historical context for decisions.
