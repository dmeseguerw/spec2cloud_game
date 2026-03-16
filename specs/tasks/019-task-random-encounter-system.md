# Task 019: Random Encounter System

## Description
Implement the random encounter engine that generates 2-4 contextual events per in-game day. Encounters are drawn from a weighted pool filtered by location, weather, season, skill levels, and history. Each encounter presents a choice card with 2-3 response options and outcomes (XP, items, relationships). This is what makes each day feel unique and unpredictable.

## Dependencies
- Task 003: State Management (encounter history, registry)
- Task 007: UI Framework (encounter card UI, notifications)
- Task 009: Audio System (encounter trigger sounds per category)
- Task 012: XP & Level Progression (XP outcomes from encounters)
- Task 013: Day Cycle & Season (time/weather/season filtering)
- Task 014: Transportation (transport-specific encounters)
- Task 015: Inventory (item rewards from encounters)

## Technical Requirements

### Encounter Data (`src/data/encounters.json`)
Define all encounters as structured data:

**Encounter Schema:**
- `id` — Unique identifier
- `category` — helpful (30%), neutral (40%), challenge (25%), major (5%)
- `title` — Short title for encounter
- `description` — 2-3 sentence situation description
- `icon` — Category icon asset key
- `conditions` — Filtering conditions:
  - `locations` — Array of valid location zones (or "any")
  - `weather` — Array of valid weather types (or "any")
  - `seasons` — Array of valid seasons (or "any")
  - `timeOfDay` — Array of valid time periods (or "any")
  - `minLevel` — Minimum player level (default 1)
  - `maxLevel` — Maximum player level (default 20)
  - `requiredSkill` — Optional skill requirement `{ skill, level }`
  - `requiredFlag` — Optional game flag
  - `transportMode` — Required transport mode (walking/biking/metro or "any")
- `oneTime` — Boolean; if true, removed from pool after resolution
- `options` — Array of 2-3 response options:
  - `text` — Response button text
  - `skillCheck` — Optional `{ skill, level }` for gated options
  - `outcome` — Object describing results:
    - `xp` — XP change (positive or negative)
    - `money` — DKK change
    - `relationship` — `{ npcId, delta }`
    - `item` — `{ itemId, action: "give" | "take" }`
    - `skill` — `{ skillKey, delta }`
    - `encyclopedia` — Entry ID to unlock
    - `flag` — `{ key, value }`
  - `resultText` — Description of what happened
  - `culturalTip` — Optional "💡" fact about Denmark

### EncounterEngine (`src/systems/EncounterEngine.js`)
Manages encounter generation and execution:

**Daily Encounter Generation:**
- `generateDailyEncounters(registry)` — Generate 2-4 encounters for today
  1. Determine count: random 2-4
  2. Build available pool: filter all encounters by current conditions
  3. Remove encounters from history (within 7-day cooldown)
  4. Select using weighted random based on category probabilities
  5. Store selected encounters as pending for today

**Encounter Triggering:**
- `triggerNextEncounter(registry)` — Called during gameplay at random intervals
- Encounters trigger during activities or travel (not at predictable moments)
- Maximum 4 per day enforced
- Return encounter data for UI to display

**Encounter Resolution:**
- `resolveEncounter(registry, encounterId, optionIndex)` — Player selects response
  1. Apply all outcome effects (XP, money, items, etc.)
  2. Record encounter in history
  3. Remove one-time encounters from pool
  4. Return result data for outcome display

**Pool Management:**
- `getEncounterPool(registry)` — All encounters minus cooldown/one-time resolved
- `isOnCooldown(registry, encounterId)` — Check if within 7-day cooldown
- Pool grows as player visits new areas (location-based encounters unlock)

### Encounter Card UI
Display encounter as a popup card:

**Card Layout:**
- Category icon (top-left corner, animated)
- Situation description text (2-3 sentences)
- 2-3 response buttons (stacked vertically)
- Skill-gated options shown dimmed with lock + requirement
- Close/dismiss not available until option selected (no skipping)

**Card Appearance:**
- Slides in from the side with bounce animation
- Background dims slightly (50% opacity overlay)
- Category-colored border (green=helpful, gray=neutral, orange=challenge, gold=major)
- Major events: golden border + sparkle effect

**Outcome Display:**
- After selecting response: show result text + XP/money change animation
- Cultural tip (if any): shown with lightbulb icon
- Auto-dismiss after 3 seconds or player click

**Auto-Response:**
- If player doesn't respond within 30 seconds: least-impactful option auto-selected
- Show "You hesitated..." flavor text

### Encounter Data: MVP Set (50+ encounters)
Create at least 50 encounters covering all categories:
- 15+ helpful encounters (various locations/contexts)
- 20+ neutral encounters (flavor/atmosphere)
- 12+ challenge encounters (problems to solve)
- 3+ major events (significant story beats)
- Mix of universal and location/season/weather-specific encounters

### Encounter Chaining
Some encounters can be linked:
- Encounter A sets a flag
- Encounter B's condition requires that flag
- Creates multi-part mini-stories

## Acceptance Criteria
- [ ] 2-4 encounters generate per in-game day
- [ ] Encounters distribute by category probability (30/40/25/5)
- [ ] Encounters filter correctly by location, weather, season, time, level
- [ ] No encounter repeats within 7 in-game days
- [ ] One-time encounters are permanently removed after resolution
- [ ] Encounter card displays with correct layout and animations
- [ ] Response options display correctly; gated ones are locked
- [ ] Selecting a response applies all outcome effects
- [ ] Cultural tip displays when present
- [ ] Auto-response triggers after 30 seconds of inaction
- [ ] Encounter history persists across save/load
- [ ] Major events have visually distinct golden card styling
- [ ] At least 50 encounters are defined and functional
- [ ] Encounter sounds play matching the category

## Testing Requirements
- **Unit Test**: Encounter pool filtering for each condition type
- **Unit Test**: Category probability distribution (statistical test over large sample)
- **Unit Test**: 7-day cooldown correctly excludes recent encounters
- **Unit Test**: One-time flag removal from pool
- **Unit Test**: Daily count stays within 2-4 range
- **Unit Test**: Outcome application for all effect types
- **Unit Test**: Skill-gated option detection
- **Unit Test**: Auto-response triggers after timeout
- **Unit Test**: Encounter chaining via flag conditions
- **Unit Test**: All 50+ encounter data entries pass schema validation
- **Integration Test**: Full flow: trigger → card appears → select option → effects applied → card dismissed
- **Integration Test**: Encounters don't repeat across multiple in-game days (7-day window)
- **Integration Test**: Weather-specific encounter only triggers in matching weather
- **Manual Test**: Card appearance and animation quality
- **Coverage Target**: ≥85% for EncounterEngine, pool filtering, outcome application

## References
- FDD: Random Encounter System (complete specification with encounter tables)
- FDD: Daily Activity (encounters happen during day activities)
- FDD: Transportation (transport-specific encounters)
- GDD Section 3.4: Random Encounter System (category probabilities)
