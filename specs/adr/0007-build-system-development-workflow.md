# [ADR 0007] Build System and Development Workflow

**Date**: 2026-03-16  
**Status**: Accepted

## Context

Denmark Survival is a browser-based Phaser.js game that can be developed in multiple ways:

**Simple Approach**: 
- Plain HTML file with script tags
- No build process
- Direct browser testing (file:// or http-server)

**Advanced Approach**:
- Module bundler (Vite, Webpack, Parcel)
- Hot module reload
- Code minification and optimization
- Development server with live reload

**Team Requirements:**
- "Keep technology basic and open source"
- "Do not have to install any other tools"
- Want fast iteration during development
- Need production optimization for deployment

**Project Characteristics:**
- ES6 modules for code organization
- ~50MB static assets (images, audio)
- Multiple JavaScript files (scenes, utilities, constants)
- CSS for HTML UI
- TypeScript optional (not required initially)

## Decision Drivers

- **Simplicity**: Minimal setup complexity
- **Fast Iteration**: Quick refresh during development
- **Zero Config**: Should work out of the box
- **Modern JavaScript**: ES6 modules support
- **Asset Handling**: Efficient loading of images/audio
- **Hot Reload**: Update code without full page refresh
- **Production Optimization**: Minify and optimize for deployment
- **Free and Open Source**: No paid tools
- **Small Learning Curve**: Easy for team to adopt

## Considered Options

### Option 1: No Build System (Plain HTML + ES6 Modules)
**Description**: Pure HTML file with `<script type="module">` for ES6 imports. Use browser's native module support. Serve with simple HTTP server during development.

**Example**:
```html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80/dist/phaser.min.js"></script>
</head>
<body>
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

**Pros**:
- ✅ **Zero setup** - no installation, no config files
- ✅ **Instant start** - open HTML file and code
- ✅ **No build step** - refresh browser to see changes
- ✅ **Simple to understand** - no bundler complexity
- ✅ **ES6 modules work** - modern browsers support natively
- ✅ **Minimal dependencies** - only Phaser via CDN

**Cons**:
- ❌ **No hot module reload** - must manually refresh
- ❌ **CORS issues** - can't run from file:// (need http-server)
- ❌ **No optimization** - code not minified for production
- ❌ **Multiple HTTP requests** - each module is separate request
- ❌ **No tree-shaking** - unused code included
- ❌ **Slower production loading** - many small files vs bundled

### Option 2: Vite (Modern Build Tool)
**Description**: Fast, modern build tool designed for web projects. Zero config for most use cases, instant server start, hot module reload.

**Install**: `npm create vite@latest denmark-survival`

**Pros**:
- ✅ **Extremely fast** - instant server start, fast HMR
- ✅ **Zero config** - works out of box for vanilla JS
- ✅ **Modern and popular** - active development, large community
- ✅ **ES6 native** - uses native ES modules in dev, bundles for production
- ✅ **Built-in dev server** - no need for separate http-server
- ✅ **Hot module reload** - instant updates without refresh
- ✅ **Production optimization** - automatic minification, tree-shaking
- ✅ **Asset handling** - images/fonts imported as URLs
- ✅ **TypeScript support** - if wanted later (zero config)
- ✅ **Plugin ecosystem** - can add features if needed
- ✅ **Single command** - `npm run dev` starts everything

**Cons**:
- ⚠️ **Requires npm** - need Node.js installed (but team likely has this)
- ⚠️ **Build step added** - more complex than plain HTML
- ⚠️ **Learning curve** - team must understand Vite basics

### Option 3: Webpack
**Description**: Mature, powerful bundler with extensive configuration options.

**Pros**:
- ✅ Highly configurable
- ✅ Huge ecosystem of plugins
- ✅ Industry standard

**Cons**:
- ❌ **Complex configuration** - requires webpack.config.js
- ❌ **Slow build times** - especially on large projects
- ❌ **Configuration overhead** - lots of boilerplate
- ❌ **Steep learning curve** - many concepts to learn
- ❌ **Overkill** - too much power for simple game

### Option 4: Parcel
**Description**: Zero-config bundler that automatically handles most file types.

**Pros**:
- ✅ True zero config
- ✅ Automatic file type detection
- ✅ Fast builds
- ✅ Simple to use

**Cons**:
- ⚠️ Less popular than Vite/Webpack (smaller community)
- ⚠️ Fewer plugins and extensions
- ⚠️ HMR can be inconsistent

## Decision Outcome

**Chosen Option**: Start with No Build System, Add Vite Later (Progressive Enhancement)

**Rationale**:

We'll use a **phased approach** that starts simple and adds complexity only when needed:

**Phase 1 (Prototyping - Week 1-2): No Build System**
- Use plain HTML + ES6 modules
- Phaser via CDN
- Simple http-server for development (`npx http-server`)
- Focus on game logic, not tooling

**Phase 2 (Active Development - Week 3+): Add Vite**
- When project grows and team wants faster iteration
- One-command setup: `npm create vite@latest`
- Minimal config needed
- Hot module reload improves productivity

**Why This Approach:**

1. **Respects "Keep it Simple" Requirement**: Start without build tools. Team can open HTML file and start coding immediately. No package.json, no node_modules, no config files.

2. **Learn Game Dev First, Tooling Second**: New team members learn Phaser and game structure without fighting bundler issues.

3. **Easy Transition**: Moving from plain HTML to Vite is straightforward - just reorganize files slightly. Code stays the same (ES6 modules work in both).

4. **Vite is "Zero Config"**: When ready to add Vite, it requires minimal config. Default settings work great for Phaser games.

5. **Production Benefits**: Vite automatically optimizes for production (minification, tree-shaking, code splitting) without manual configuration.

6. **Community Standard**: Vite is becoming the de facto standard for modern web projects (backed by Vue.js team). Lots of examples and support.

## Development Workflow

### Phase 1: No Build System (Initial Prototyping)

**Project Structure**:
```
denmark-survival/
├── index.html
├── src/
│   ├── main.js
│   ├── config.js
│   ├── scenes/
│   │   ├── BootScene.js
│   │   ├── MenuScene.js
│   │   └── GameScene.js
│   ├── constants/
│   │   └── RegistryKeys.js
│   └── state/
│       └── StateManager.js
├── assets/
│   ├── sprites/
│   ├── tilemaps/
│   └── audio/
└── styles.css
```

**index.html**:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Denmark Survival</title>
  <link rel="stylesheet" href="styles.css">
  <!-- Phaser from CDN -->
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80/dist/phaser.min.js"></script>
</head>
<body>
  <div id="game-container"></div>
  <!-- Use ES6 modules -->
  <script type="module" src="src/main.js"></script>
</body>
</html>
```

**src/main.js**:
```javascript
import { config } from './config.js';
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

// Register scenes
config.scene = [BootScene, GameScene];

// Create game
const game = new Phaser.Game(config);
```

**Development Server**:
```bash
# Install http-server globally (one time)
npm install -g http-server

# Or use npx (no installation)
npx http-server

# Open browser to http://localhost:8080
```

**Pros of This Phase**:
- ✅ Start coding immediately
- ✅ No build errors to debug
- ✅ Simple mental model
- ✅ Easy to share (just send files)

**When to Move to Phase 2**:
- When manually refreshing becomes tedious
- When team wants code minification
- When project has 15+ files and organization matters
- When someone on team has used Vite and wants it

### Phase 2: Vite Build System (Active Development)

**Migration Steps**:

```bash
# 1. Initialize Vite
npm create vite@latest . -- --template vanilla

# 2. Install dependencies
npm install

# 3. Reorganize (minimal changes)
# Move index.html to root (already there)
# Vite config (optional, defaults are fine)
```

**vite.config.js** (optional, for customization):
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',  // For GitHub Pages deployment
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
        },
      },
    },
  },
});
```

**package.json** (created by Vite):
```json
{
  "name": "denmark-survival",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "devDependencies": {
    "vite": "^5.0.0"
  },
  "dependencies": {
    "phaser": "^3.80.0"
  }
}
```

**Updated index.html** (install Phaser via npm instead of CDN):
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Denmark Survival</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div id="game-container"></div>
  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

**Updated src/main.js** (import Phaser as module):
```javascript
import Phaser from 'phaser';  // Now imported from node_modules
import { BootScene } from './scenes/BootScene.js';
import { GameScene } from './scenes/GameScene.js';

const config = {
  type: Phaser.AUTO,
  width: 1280,
  height: 720,
  scene: [BootScene, GameScene],
  parent: 'game-container',
};

const game = new Phaser.Game(config);
```

**Development Commands**:
```bash
# Start dev server with hot reload
npm run dev
# Open browser to http://localhost:3000

# Build for production
npm run build
# Creates optimized files in dist/

# Preview production build locally
npm run preview
```

**Pros of This Phase**:
- ✅ Instant hot module reload
- ✅ Fast development iteration
- ✅ Production builds optimized automatically
- ✅ Tree-shaking removes unused code
- ✅ Built-in TypeScript support (if wanted)

## Consequences

### Positive
- ✅ **Flexible Starting Point**: Team can start without Node.js if needed
- ✅ **Progressive Enhancement**: Add tools only when beneficial
- ✅ **Fast Development**: Vite's HMR speeds up iteration significantly
- ✅ **Production Ready**: Vite handles optimization automatically
- ✅ **Modern Stack**: ES6 modules are future-proof
- ✅ **Free and Open Source**: All tools are free
- ✅ **Community Support**: Vite has excellent documentation and community

### Negative
- ⚠️ **Learn Two Approaches**: Team must understand both plain HTML and Vite
- ⚠️ **Migration Step**: Moving from Phase 1 to Phase 2 requires small refactor
- ⚠️ **Node.js Dependency**: Phase 2 requires Node.js installed (but most devs have this)

**Mitigation Strategies**:
- Provide clear migration guide
- Do migration as team task (pair programming)
- Keep code structure modular from start (easier to move)

### Neutral
- 📌 Can use TypeScript later if team wants type safety (Vite supports it zero-config)
- 📌 Can add ESLint/Prettier for code quality (optional)

## Implementation Notes

### 1. Initial Setup (Phase 1)

**Quick Start**:
```bash
# Clone or create project
mkdir denmark-survival
cd denmark-survival

# Create basic structure
mkdir -p src/scenes src/constants src/state assets/sprites assets/audio

# Create index.html, main.js, etc. (as shown above)

# Start development
npx http-server
```

### 2. Version Control (.gitignore)

```
# Node modules (if using Vite)
node_modules/

# Build output
dist/

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
*.swp

# Logs
*.log
npm-debug.log*
```

### 3. Migration Checklist (Phase 1 → Phase 2)

- [ ] Run `npm create vite@latest .`
- [ ] Install Phaser: `npm install phaser`
- [ ] Update imports to use `import Phaser from 'phaser'`
- [ ] Remove Phaser CDN script from index.html
- [ ] Update asset paths if needed (Vite handles assets smartly)
- [ ] Test dev server: `npm run dev`
- [ ] Test production build: `npm run build`
- [ ] Update deployment workflow to use `dist/` folder

### 4. Code Organization Best Practices

**File Naming**:
- Scenes: PascalCase (GameScene.js)
- Utilities: camelCase (stateManager.js)
- Constants: UPPER_SNAKE_CASE file (RegistryKeys.js)

**Module Exports**:
```javascript
// Named exports for most things
export class GameScene extends Phaser.Scene { }
export const REGISTRY_KEYS = { };

// Default export for main config
export default config;
```

**Import Conventions**:
```javascript
// Phaser (when using Vite)
import Phaser from 'phaser';

// Local modules
import { GameScene } from './scenes/GameScene.js';
import { REGISTRY_KEYS } from './constants/RegistryKeys.js';
```

### 5. Deployment Integration

**Phase 1 (No Build)**:
- Deploy entire directory to Itch.io/GitHub Pages
- All files included as-is

**Phase 2 (Vite)**:
- Build production: `npm run build`
- Deploy only `dist/` folder to Itch.io/GitHub Pages
- dist/ contains optimized, minified code

**GitHub Pages with Vite**:
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: 18
      
      - name: Install dependencies
        run: npm install
      
      - name: Build
        run: npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 6. Optional Enhancements (Future)

**TypeScript** (if team wants type safety):
```bash
# Rename .js files to .ts
# Vite automatically handles TypeScript

# Add tsconfig.json for type checking
npm install -D typescript
npx tsc --init
```

**Code Quality Tools**:
```bash
# ESLint for code quality
npm install -D eslint

# Prettier for formatting
npm install -D prettier
```

**Asset Optimization**:
```bash
# Image compression
npm install -D vite-plugin-imagemin

# Add to vite.config.js
import imagemin from 'vite-plugin-imagemin';

export default {
  plugins: [imagemin()],
};
```

## References

- [Vite Official Guide](https://vitejs.dev/guide/)
- [Phaser + Vite Template](https://github.com/phaserjs/template-vite)
- [ES6 Modules in Browsers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)
- [http-server npm package](https://www.npmjs.com/package/http-server)
- Related ADRs:
  - ADR 0001 - Game Engine and Framework Selection
  - ADR 0006 - Deployment Platform and Hosting Strategy
