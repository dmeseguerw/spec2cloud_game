# Task 001: Project Structure & Build Setup

## Description
Set up the initial project directory structure, HTML entry point, and development server for Denmark Survival. This establishes the foundation that all other tasks build upon. Per ADR 0007, start with Phase 1 (plain HTML + ES6 modules + CDN Phaser) and prepare for Phase 2 (Vite migration).

## Dependencies
- None (this is the first task)

## Technical Requirements

### Directory Structure
Create the following project structure:
```
denmark-survival/
├── index.html              # Entry point - loads Phaser via CDN + main.js
├── styles.css              # Base styles + HTML overlay styles
├── package.json            # Metadata + scripts (dev server, future Vite)
├── src/
│   ├── main.js             # Phaser game configuration and bootstrap
│   ├── config.js           # Game constants (resolution, physics, etc.)
│   ├── scenes/             # All Phaser scene files
│   ├── constants/          # Registry keys, enums, lookup tables
│   ├── state/              # State management utilities
│   ├── systems/            # Game systems (encounter engine, economy, etc.)
│   ├── data/               # JSON data files (encounters, items, NPCs, etc.)
│   ├── ui/                 # UI helper modules (UIManager, notifications)
│   └── utils/              # General utility functions
├── assets/
│   ├── sprites/            # Character and object sprites
│   ├── tilemaps/           # Tiled JSON maps and tilesets
│   ├── audio/
│   │   ├── music/          # Background music tracks
│   │   └── sfx/            # Sound effects
│   ├── ui/                 # UI elements (icons, frames, buttons)
│   └── fonts/              # Custom fonts if needed
├── tests/                  # Test files mirroring src/ structure
└── CREDITS.md              # Attribution for all open source assets
```

### HTML Entry Point
- Single `index.html` file
- Loads Phaser 3.80+ via jsDelivr CDN
- Includes `styles.css` for HTML overlay UI
- Contains DOM overlay containers for menus (per ADR 0005)
- `<script type="module">` loading `src/main.js`
- Viewport meta tag for responsive scaling
- Title: "Denmark Survival"

### Package.json
- Project metadata (name, version, description, license: MIT)
- Scripts: `"dev": "npx http-server -p 8080 -c-1"` for Phase 1
- No production dependencies initially (Phaser via CDN)
- Dev dependencies: `http-server` only

### CSS Foundation
- Reset/normalize styles
- Game canvas centering and scaling
- HTML overlay container styles (hidden by default)
- CSS custom properties for game color palette per ADR 0005:
  - Muted pastels, warm grays, Scandinavian blues/yellows
- Responsive design for different screen sizes
- Minimum 44px touch targets for interactive elements

### Development Server
- Serve on `http://localhost:8080`
- No caching (`-c-1` flag) for development
- Works with ES6 module imports

## Acceptance Criteria
- [ ] Running `npm run dev` starts a local server and the game loads in browser at `http://localhost:8080`
- [ ] `index.html` loads Phaser 3.80+ successfully (Phaser global available in console)
- [ ] `src/main.js` is loaded as an ES6 module without errors
- [ ] All directory folders exist and are organized per the structure above
- [ ] `CREDITS.md` exists with a template for asset attribution
- [ ] HTML overlay containers are present in the DOM but hidden
- [ ] Page is responsive and centers the game canvas on different viewport sizes
- [ ] No console errors on initial page load

## Testing Requirements
- **Manual Test**: Open `http://localhost:8080`, verify Phaser loads (check `window.Phaser` in console)
- **Manual Test**: Verify all directories exist with correct structure
- **Manual Test**: Verify HTML overlay containers are in DOM and hidden
- **Manual Test**: Resize browser window — game container should remain centered
- **Automated Test**: Validate `index.html` has required meta tags and script references
- **Coverage Target**: N/A for scaffolding (structure verification)

## References
- ADR 0001: Game Engine Framework (Phaser.js 3.80+)
- ADR 0005: UI Framework (HTML overlay structure)
- ADR 0007: Build System (Phase 1 plain HTML, directory structure)
- ADR 0003: Asset Management (directory organization)
