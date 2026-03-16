# [ADR 0005] UI Framework and Implementation Strategy

**Date**: 2026-03-16  
**Status**: Accepted

## Context

Denmark Survival requires extensive UI systems:

**Core UI Elements:**
- Main menu (New Game, Continue, Settings, Credits)
- Character creation wizard (nationality, job, appearance selection)
- HUD overlay (health, XP, time, notifications)
- Dialogue system with choice buttons
- Inventory screen with tabs (items, stats, skills, encyclopedia)
- Day summary screen with XP breakdown
- Settings menu (volume sliders, controls)
- Pause menu
- Mobile-friendly touch controls (future consideration)

**UI Requirements from GDD:**
- **Cozy, approachable aesthetic** - not intimidating or complex
- **Readable text** - clear fonts, good contrast
- **Responsive feedback** - button hover states, click animations
- **Accessibility** - keyboard navigation, sufficient contrast
- **Performance** - smooth animations, no UI lag
- **Scalable** - support multiple resolutions (1280x720 to 1920x1080)

**Technical Constraints:**
- Must work with Phaser.js
- Browser-only (no native UI frameworks)
- Open source / free solution
- Keep it simple (no complex UI libraries if possible)

## Decision Drivers

- **Phaser Integration**: Should work naturally with Phaser scenes
- **Simplicity**: Team wants straightforward implementation
- **Performance**: UI shouldn't impact game performance
- **Flexibility**: Easy to create custom layouts
- **Text Rendering**: Good support for styled text, word wrapping
- **Input Handling**: Mouse, keyboard, and touch support
- **Styling**: Easy to make UI match game's cozy aesthetic
- **Documentation**: Good examples for common UI patterns
- **Responsiveness**: Scale to different screen sizes

## Considered Options

### Option 1: Phaser Built-in UI + HTML/DOM Overlays (Hybrid)
**Description**: Use Phaser's built-in Game Objects (sprites, images, text) for in-game UI elements, combined with HTML/DOM elements overlaid on the canvas for complex UI (forms, settings menus).

**Pros**:
- ✅ No additional dependencies
- ✅ Phaser UI integrates perfectly with game (same scene, same camera)
- ✅ HTML/DOM excellent for forms and complex layouts
- ✅ CSS styling capabilities for HTML elements
- ✅ Best of both worlds - game-integrated + web-standard
- ✅ HTML inputs (text boxes, sliders) are accessible
- ✅ Can use CSS animations for smooth UI transitions
- ✅ Phaser handles sprite-based buttons, images, icons
- ✅ Easy to make responsive with CSS

**Cons**:
- ⚠️ Need to coordinate between Phaser and DOM layers
- ⚠️ Two different APIs to learn
- ⚠️ Slightly more complex architecture

### Option 2: Pure Phaser UI (Game Objects Only)
**Description**: Build all UI using Phaser's Game Objects (sprites, text, rectangles, containers). No HTML/DOM elements.

**Pros**:
- ✅ Consistent API - everything in Phaser
- ✅ All UI is drawn on canvas (can screenshot entire UI)
- ✅ Easier to animate with Phaser tweens
- ✅ No DOM/Canvas coordination needed

**Cons**:
- ❌ Text input is complex (must build custom input fields)
- ❌ Forms are tedious to build (sliders, dropdowns, checkboxes)
- ❌ Layout is manual (no CSS flexbox/grid)
- ❌ Accessibility harder to implement
- ❌ Styling is more work (must position everything manually)
- ❌ No native browser form validation
- ❌ HTML-style text wrapping requires plugins

### Option 3: Phaser + rexUI Plugin
**Description**: Use Phaser with the rexUI plugin library, which provides advanced UI components (scrollable panels, grids, sliders, text boxes).

**Pros**:
- ✅ Professional UI components out of the box
- ✅ Scrollable panels, complex layouts
- ✅ Text input fields included
- ✅ Well-documented plugin
- ✅ Integrates with Phaser

**Cons**:
- ⚠️ Additional dependency (~200KB)
- ⚠️ Learning curve for rexUI API
- ⚠️ May be overkill for this game
- ⚠️ Another library to maintain/update
- ⚠️ Less flexible than custom solutions

### Option 4: External UI Framework (React/Vue) + Phaser
**Description**: Separate React or Vue app for UI, with Phaser embedded for game rendering.

**Pros**:
- ✅ Powerful UI framework features
- ✅ Component-based architecture
- ✅ Excellent form handling

**Cons**:
- ❌ **Massive overkill** for a simple 2D game
- ❌ Large framework dependencies (React: ~150KB)
- ❌ Complex integration with Phaser
- ❌ Over-engineered for project scope
- ❌ Steeper learning curve
- ❌ Goes against "keep it simple" requirement

## Decision Outcome

**Chosen Option**: Phaser Built-in UI + HTML/DOM Overlays (Hybrid Approach)

**Rationale**:

1. **Best Tool for Each Job**:
   - **Phaser UI** for game-integrated elements: HUD, dialogue boxes, in-game buttons, tooltips
   - **HTML/DOM** for complex forms: character creation, settings menu, main menu

2. **Practical Balance**: This is the standard approach used by many successful Phaser games. It leverages Phaser's strengths (visual game elements) and HTML's strengths (forms and layouts).

3. **Zero Dependencies**: Both Phaser and HTML/DOM are available out of the box. No additional libraries needed.

4. **Development Speed**: HTML forms with CSS are much faster to build than custom Phaser UI, especially for settings screens and character creation.

5. **Accessibility**: HTML inputs are inherently more accessible (screen readers, keyboard navigation) than custom canvas-drawn inputs.

6. **CSS Power**: Can use CSS flexbox/grid for responsive layouts, CSS animations for transitions.

7. **Phaser Strengths**: Phaser excels at in-game UI (health bars, XP meters, floating text, dialogue portraits) where game integration matters.

## UI Component Strategy

### Phaser-Based UI (Canvas/WebGL)

**Use for:**
- HUD elements (health bar, XP meter, day counter, time indicator)
- Dialogue boxes with character portraits
- In-game notifications ("+10 XP", "New encyclopedia entry!")
- Inventory grid with item sprites
- Tooltips on hover
- Button sprites with hover/click animations
- Skill bars and progress indicators
- Day summary screen with animated XP breakdown

**Implementation**: Phaser Game Objects (Image, Text, Container, Graphics)

**Example**: Health bar in UIScene
```javascript
class UIScene extends Phaser.Scene {
  create() {
    // Container for health bar
    const healthBar = this.add.container(20, 20);
    
    // Background
    const bg = this.add.rectangle(0, 0, 200, 30, 0x333333).setOrigin(0);
    
    // Fill (current health)
    this.healthFill = this.add.rectangle(2, 2, 196, 26, 0x44ff44).setOrigin(0);
    
    // Text
    const healthText = this.add.text(100, 15, 'Health: 100', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    
    healthBar.add([bg, this.healthFill, healthText]);
    
    // Listen for health changes
    this.registry.events.on('changedata-health', (parent, value) => {
      this.updateHealthBar(value);
    });
  }
  
  updateHealthBar(health) {
    const width = (health / 100) * 196;
    this.healthFill.width = width;
  }
}
```

### HTML/DOM-Based UI

**Use for:**
- Main menu (navigation, save slots)
- Character creation form (dropdowns, text input)
- Settings menu (volume sliders, checkboxes)
- Pause menu overlay
- Credits screen

**Implementation**: HTML elements positioned over Phaser canvas, styled with CSS

**Example**: Character creation form
```html
<div id="character-creation" class="ui-overlay" style="display: none;">
  <div class="form-container">
    <h1>Create Your Character</h1>
    
    <label>Name:</label>
    <input type="text" id="player-name" maxlength="20">
    
    <label>Nationality:</label>
    <select id="player-nationality">
      <option value="usa">United States</option>
      <option value="uk">United Kingdom</option>
      <option value="germany">Germany</option>
      <!-- ... -->
    </select>
    
    <label>Job:</label>
    <select id="player-job">
      <option value="student">Student</option>
      <option value="tech-worker">Tech Worker</option>
      <option value="healthcare">Healthcare Professional</option>
      <!-- ... -->
    </select>
    
    <button id="create-character-btn">Start Adventure</button>
  </div>
</div>
```

```css
.ui-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.form-container {
  background: #2c2c2c;
  padding: 40px;
  border-radius: 15px;
  max-width: 500px;
  color: #ffffff;
  font-family: 'Inter', sans-serif;
}

.form-container input,
.form-container select {
  width: 100%;
  padding: 10px;
  margin: 10px 0 20px 0;
  border-radius: 5px;
  border: none;
  font-size: 16px;
}

.form-container button {
  width: 100%;
  padding: 15px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 18px;
  cursor: pointer;
  transition: background 0.3s;
}

.form-container button:hover {
  background: #45a049;
}
```

**JavaScript Bridge** (communicate with Phaser):
```javascript
// In CharacterCreationScene or main.js
document.getElementById('create-character-btn').addEventListener('click', () => {
  const name = document.getElementById('player-name').value;
  const nationality = document.getElementById('player-nationality').value;
  const job = document.getElementById('player-job').value;
  
  // Store in Phaser registry
  game.registry.set('playerName', name);
  game.registry.set('playerNationality', nationality);
  game.registry.set('playerJob', job);
  
  // Hide HTML form
  document.getElementById('character-creation').style.display = 'none';
  
  // Start game scene
  game.scene.start('GameScene');
});
```

## Consequences

### Positive
- ✅ **Zero Dependencies**: No UI libraries needed
- ✅ **Fast Development**: HTML forms are quick to build
- ✅ **Professional Look**: CSS enables polished, modern UI
- ✅ **Best Performance**: Phaser UI stays on canvas, HTML is only for menus
- ✅ **Accessibility**: HTML inputs work with screen readers
- ✅ **Responsive**: CSS media queries for different screen sizes
- ✅ **Flexibility**: Use best tool for each UI component
- ✅ **Easy Styling**: CSS is easier than positioning Phaser objects manually
- ✅ **Browser Native**: Inputs, dropdowns work as expected

### Negative
- ⚠️ **Two Systems**: Need to coordinate Phaser and DOM layers
- ⚠️ **Learning Curve**: Team needs to understand both Phaser UI and HTML/CSS integration
- ⚠️ **Canvas Capture**: HTML elements won't appear in Phaser screenshots (usually not an issue)

**Mitigation Strategies**:
- Create clear guidelines for when to use Phaser vs HTML
- Build reusable UI components for consistency
- Document the bridge pattern between HTML and Phaser
- Use container divs to organize HTML UI logically

### Neutral
- 📌 **Styling Flexibility**: Can change visual style easily with CSS
- 📌 **Mobile Adaptation**: Both Phaser and HTML can be made touch-friendly

## Implementation Notes

### 1. Project Structure

```
src/
├── scenes/
│   ├── UIScene.js                    # Phaser HUD overlay
│   └── GameScene.js
├── ui/
│   ├── styles.css                    # All HTML UI styles
│   └── ui-manager.js                 # Helper functions for showing/hiding UI
└── index.html                        # Main HTML with UI overlays
```

### 2. HTML Structure (index.html)

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Denmark Survival</title>
  <link rel="stylesheet" href="src/ui/styles.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <!-- Phaser Canvas will be injected here -->
  <div id="game-container"></div>
  
  <!-- HTML UI Overlays -->
  
  <!-- Main Menu -->
  <div id="main-menu" class="ui-overlay">
    <div class="menu-container">
      <h1>Denmark Survival</h1>
      <button id="new-game-btn" class="menu-button">New Game</button>
      <button id="continue-btn" class="menu-button">Continue</button>
      <button id="settings-btn" class="menu-button">Settings</button>
      <button id="credits-btn" class="menu-button">Credits</button>
    </div>
  </div>
  
  <!-- Character Creation -->
  <div id="character-creation" class="ui-overlay" style="display: none;">
    <!-- (form from earlier example) -->
  </div>
  
  <!-- Settings Menu -->
  <div id="settings-menu" class="ui-overlay" style="display: none;">
    <div class="form-container">
      <h2>Settings</h2>
      
      <label>Master Volume:</label>
      <input type="range" id="volume-master" min="0" max="100" value="80">
      
      <label>Music Volume:</label>
      <input type="range" id="volume-music" min="0" max="100" value="60">
      
      <label>SFX Volume:</label>
      <input type="range" id="volume-sfx" min="0" max="100" value="80">
      
      <button id="settings-back-btn">Back</button>
    </div>
  </div>
  
  <!-- Pause Menu (shown during gameplay) -->
  <div id="pause-menu" class="ui-overlay" style="display: none;">
    <div class="menu-container">
      <h2>Paused</h2>
      <button id="resume-btn" class="menu-button">Resume</button>
      <button id="save-btn" class="menu-button">Save Game</button>
      <button id="pause-settings-btn" class="menu-button">Settings</button>
      <button id="quit-btn" class="menu-button">Quit to Menu</button>
    </div>
  </div>
  
  <script src="https://cdn.jsdelivr.net/npm/phaser@3.80/dist/phaser.min.js"></script>
  <script type="module" src="src/main.js"></script>
  <script type="module" src="src/ui/ui-manager.js"></script>
</body>
</html>
```

### 3. UI Manager (ui/ui-manager.js)

```javascript
/**
 * Helper functions for managing HTML UI overlays
 */
export const UIManager = {
  show(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'flex';
    }
  },
  
  hide(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.style.display = 'none';
    }
  },
  
  hideAll() {
    const overlays = document.querySelectorAll('.ui-overlay');
    overlays.forEach(overlay => {
      overlay.style.display = 'none';
    });
  },
  
  /**
   * Sync settings sliders with registry
   */
  syncSettings(registry) {
    document.getElementById('volume-master').value = registry.get('volumeMaster') * 100;
    document.getElementById('volume-music').value = registry.get('volumeMusic') * 100;
    document.getElementById('volume-sfx').value = registry.get('volumeSFX') * 100;
  },
  
  /**
   * Set up event listeners for menu buttons
   */
  initializeMenus(game) {
    // Main Menu
    document.getElementById('new-game-btn').addEventListener('click', () => {
      UIManager.hide('main-menu');
      UIManager.show('character-creation');
    });
    
    document.getElementById('continue-btn').addEventListener('click', () => {
      // Load game logic
      UIManager.hideAll();
      game.scene.start('GameScene');
    });
    
    document.getElementById('settings-btn').addEventListener('click', () => {
      UIManager.hide('main-menu');
      UIManager.show('settings-menu');
      UIManager.syncSettings(game.registry);
    });
    
    // Settings
    document.getElementById('settings-back-btn').addEventListener('click', () => {
      UIManager.hide('settings-menu');
      UIManager.show('main-menu');
    });
    
    // Volume sliders
    document.getElementById('volume-master').addEventListener('input', (e) => {
      game.registry.set('volumeMaster', e.target.value / 100);
    });
    
    // Pause Menu
    document.getElementById('resume-btn').addEventListener('click', () => {
      UIManager.hide('pause-menu');
      game.scene.resume('GameScene');
    });
    
    document.getElementById('save-btn').addEventListener('click', () => {
      // Save game logic
      alert('Game saved!');
    });
  }
};
```

### 4. Phaser In-Game UI (UIScene.js)

```javascript
import Phaser from 'phaser';

export class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene', active: true });
  }
  
  create() {
    // Create HUD elements
    this.createHealthBar();
    this.createXPMeter();
    this.createDayCounter();
    this.createTimeIndicator();
    this.createNotificationArea();
    
    // Listen for registry changes
    this.setupListeners();
  }
  
  createHealthBar() {
    const container = this.add.container(20, 20);
    
    // Background
    const bg = this.add.rectangle(0, 0, 200, 30, 0x222222, 0.8).setOrigin(0);
    
    // Health fill
    this.healthFill = this.add.rectangle(4, 4, 192, 22, 0x44ff44).setOrigin(0);
    
    // Icon
    const icon = this.add.text(10, 15, '❤️', { fontSize: '16px' }).setOrigin(0, 0.5);
    
    // Text
    this.healthText = this.add.text(40, 15, 'Health: 100', {
      fontSize: '14px',
      fontFamily: 'Inter',
      color: '#ffffff'
    }).setOrigin(0, 0.5);
    
    container.add([bg, this.healthFill, icon, this.healthText]);
  }
  
  createXPMeter() {
    const container = this.add.container(20, 60);
    
    const bg = this.add.rectangle(0, 0, 400, 25, 0x222222, 0.8).setOrigin(0);
    this.xpFill = this.add.rectangle(2, 2, 0, 21, 0x4488ff).setOrigin(0);
    
    this.xpText = this.add.text(200, 12, 'XP: 0 / 100', {
      fontSize: '12px',
      fontFamily: 'Inter',
      color: '#ffffff'
    }).setOrigin(0.5, 0.5);
    
    container.add([bg, this.xpFill, this.xpText]);
  }
  
  createNotificationArea() {
    // Container for floating notifications
    this.notificationGroup = this.add.container(640, 100);
  }
  
  showNotification(message, color = '#ffffff') {
    const text = this.add.text(0, 0, message, {
      fontSize: '18px',
      fontFamily: 'Inter',
      color: color,
      stroke: '#000000',
      strokeThickness: 3
    }).setOrigin(0.5);
    
    this.notificationGroup.add(text);
    
    // Animate: fade up and out
    this.tweens.add({
      targets: text,
      y: -50,
      alpha: 0,
      duration: 2000,
      ease: 'Power2',
      onComplete: () => {
        text.destroy();
      }
    });
  }
  
  setupListeners() {
    // Health changes
    this.registry.events.on('changedata-health', (parent, value) => {
      this.healthFill.width = (value / 100) * 192;
      this.healthText.setText(`Health: ${value}`);
    });
    
    // XP changes
    this.registry.events.on('changedata-playerXP', (parent, value) => {
      const maxXP = 100;  // Per level
      const percent = (value % maxXP) / maxXP;
      this.xpFill.width = percent * 396;
      this.xpText.setText(`XP: ${value % maxXP} / ${maxXP}`);
      
      // Show notification
      this.showNotification(`+${value} XP`, '#44ff44');
    });
  }
}
```

### 5. Responsive Design (CSS)

```css
/* Make UI responsive to different screen sizes */
@media (max-width: 1280px) {
  .form-container {
    max-width: 400px;
    padding: 30px;
  }
  
  .menu-button {
    font-size: 20px;
    padding: 12px;
  }
}

/* Mobile adjustments */
@media (max-width: 768px) {
  .form-container {
    max-width: 90%;
    padding: 20px;
  }
  
  body {
    font-size: 14px;
  }
}
```

## References

- [Phaser Game Objects Documentation](https://docs.phaser.io/phaser/concepts/gameobjects)
- [Phaser Text Styling](https://docs.phaser.io/phaser/concepts/gameobjects/text)
- [HTML Form Elements (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form)
- [CSS Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
- GDD: specs/gdd.md - Section 6 (User Interface & Controls)
- Related ADRs:
  - ADR 0001 - Game Engine and Framework Selection
  - ADR 0002 - Scene Architecture Pattern
  - ADR 0004 - State Management and Data Persistence
