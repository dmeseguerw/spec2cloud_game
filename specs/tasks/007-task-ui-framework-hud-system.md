# Task 007: UI Framework & HUD System

## Description
Implement the UI framework that all game screens use for heads-up display, notifications, menus, and interactive elements. This includes the persistent UIScene overlay (health, XP, money, time), the notification/toast system, and reusable UI component patterns (buttons, panels, progress bars) using the hybrid Phaser + HTML/DOM approach defined in ADR 0005.

## Dependencies
- Task 003: State Management Foundation (registry keys for HUD values)
- Task 004: Scene Framework & Navigation (UIScene runs parallel to GameScene)
- Task 006: Asset Pipeline (UI asset sprites, icons, fonts)

## Technical Requirements

### UIScene (`src/scenes/UIScene.js`)
Persistent HUD overlay that runs parallel to GameScene:

**Top-Left HUD cluster:**
- XP display: Icon + current XP / XP to next level + mini progress bar
- Time display: Clock icon + current time period (Morning/Afternoon/Evening/Night)
- Day/Date display: "Day 5" or "Day 5 — Spring"
- Weather icon: Sun, rain, snow, cloud (matches current weather state)

**Top-Right HUD cluster:**
- Health indicator: Heart icon + fill level (visual, not a number)
- Mental energy indicator: Brain icon + fill level
- Money display: Coin icon + current DKK balance

**Bottom-Center:**
- Location name: Current area/location text
- Context hint: Active interaction hint (e.g., "Press E to talk")
- Active objective reminder (optional, from current quest/task)

**HUD Behavior:**
- Updates reactively when registry values change (via `changedata` events)
- Can be collapsed to just icons (toggle with a key or button)
- Smooth number animations when values change (count up/down)
- Flash/pulse effects on significant changes (low health, XP gain)

### Notification System (`src/ui/NotificationManager.js`)
Toast-style notifications for game events:
- Slide in from top or side, auto-dismiss after configurable duration (default 3 seconds)
- Queue system: if multiple notifications arrive, show sequentially (no stacking)
- Priority levels: low (info), medium (reward), high (warning/danger)
- Visual styling per priority (green for positive, yellow for neutral, red for negative)
- Supports icon + text format
- Used by: XP changes, item pickups, encounter triggers, bill arrivals, encyclopedia unlocks

### UI Component Library (`src/ui/`)
Reusable UI components built with Phaser Game Objects:

**GameButton:**
- Text button with background sprite
- States: normal, hover, pressed, disabled
- Click callback
- Keyboard focus support (Tab navigation)
- Minimum 44px touch target

**Panel:**
- Bordered container for content grouping
- Configurable background color/opacity
- Title bar (optional)
- Close button (optional)

**ProgressBar:**
- Configurable width, height, colors (background, fill)
- Smooth animated fill transitions
- Optional percentage text label
- Used for: XP bar, health bar, loading bar, skill meters

**DialogBox:**
- Text container with typewriter text effect
- Speaker name label
- Response option buttons
- Portrait area (for NPC face)

### HTML Overlay Manager (`src/ui/HTMLOverlayManager.js`)
Manages the HTML/DOM overlay containers (per ADR 0005):
- Show/hide overlay containers with transition animations
- Trap keyboard focus within active overlay (accessibility)
- Close overlay on Escape key
- Block game input while overlay is active
- Overlays: main-menu, character-creation, settings-menu, pause-menu

## Acceptance Criteria
- [ ] UIScene displays all HUD elements (XP, time, day, weather, health, mental energy, money, location)
- [ ] HUD values update automatically when registry values change
- [ ] Notifications appear and auto-dismiss correctly
- [ ] Multiple notifications queue and display sequentially
- [ ] GameButton responds to hover, click, and keyboard focus
- [ ] ProgressBar animates smoothly between values
- [ ] Panel renders with correct borders and optional title/close
- [ ] HTML overlays show/hide with transitions
- [ ] Game input is blocked while HTML overlay is active
- [ ] HUD can be toggled between full and collapsed modes
- [ ] All interactive elements meet 44px minimum touch target
- [ ] No overlapping UI elements on default resolution

## Testing Requirements
- **Unit Test**: NotificationManager queues and displays notifications in order
- **Unit Test**: NotificationManager auto-dismisses after configured duration
- **Unit Test**: GameButton fires callback on click, changes state on hover
- **Unit Test**: ProgressBar interpolates between old and new values smoothly
- **Unit Test**: ProgressBar clamps between 0 and max value
- **Unit Test**: HUD elements update when registry events fire
- **Integration Test**: UIScene renders all HUD elements at correct positions
- **Integration Test**: Changing registry value triggers HUD update visually
- **Integration Test**: HTML overlay blocks Phaser input and closes on Escape
- **Manual Test**: Visual verification of all HUD elements at correct positions
- **Manual Test**: Notification visual appearance matches design spec
- **Coverage Target**: ≥85% for NotificationManager, UIComponents, HTMLOverlayManager

## References
- ADR 0005: UI Framework Implementation (hybrid approach, HTML overlays)
- ADR 0002: Scene Architecture (UIScene parallel pattern)
- FDD: XP & Progression (XP bar, level display)
- FDD: Inventory & Economy (DKK display, bill notifications)
- FDD: Daily Activity & Day Cycle (time, weather, season display)
- FDD: Random Encounters (encounter notification cards)
- FDD: Encyclopedia (unlock notifications)
- GDD Section 6: UI & Controls (HUD layout, accessibility)
