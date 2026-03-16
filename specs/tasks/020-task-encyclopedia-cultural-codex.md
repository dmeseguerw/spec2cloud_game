# Task 020: Encyclopedia & Cultural Codex

**GitHub Issue:** [#22 - Task 020: Encyclopedia & Cultural Codex](https://github.com/dmeseguerw/spec2cloud_game/issues/22)
**GitHub PR:** [#26 - [WIP] Implement encyclopedia and cultural codex system](https://github.com/dmeseguerw/spec2cloud_game/pull/26)

## Description
Implement the encyclopedia/codex system — a journal of Danish cultural knowledge that grows through gameplay. It includes 5 category tabs (Culture, Language, Places, Activities, Tips), trigger-based entry discovery, completion tracking, and a browsable UI. Entries unlock naturally through gameplay events and conversations, never through explicit "research" mechanics.

## Dependencies
- Task 003: State Management Foundation (encyclopedia entries in registry)
- Task 004: Scene Framework (encyclopedia accessible from pause menu)
- Task 007: UI Framework (tab interface, entry list, notifications)
- Task 009: Audio System (discovery chime, page sounds)

## Technical Requirements

### Encyclopedia Data (`src/data/encyclopedia.json`)
Define all codex entries as structured data:

**Entry Schema:**
- `id` — Unique identifier
- `title` — Entry title
- `category` — culture, language, places, activities, tips
- `body` — 3-6 sentences of content (engaging, not dry)
- `icon` — Small illustration asset key
- `triggers` — Array of events that unlock this entry:
  - `{ type: "npc_conversation", npcId: "freja", conversationId: "hygge_talk" }`
  - `{ type: "encounter", encounterId: "birthday_flags" }`
  - `{ type: "area_visit", areaId: "norrebro" }`
  - `{ type: "activity_complete", activityId: "file_taxes" }`
  - `{ type: "skill_milestone", skill: "cycling", level: 3 }`
  - `{ type: "season_change", season: "winter" }`
  - `{ type: "item_use", itemId: "pant_machine" }`
  - `{ type: "mistake", mistakeType: "quiet_hours_violation" }`
- `relatedEntries` — Array of related entry IDs (for cross-linking)
- `sourceText` — "Learned from: [source description]"

**Entry Counts (from FDD):**
- Culture: ~24 entries
- Language: ~20 entries
- Places: ~14 entries
- Activities: ~16 entries
- Tips: ~12 entries
- **Total: ~86 entries (MVP minimum: 50)**

### EncyclopediaManager (`src/systems/EncyclopediaManager.js`)
Manages encyclopedia state:

- `unlockEntry(registry, entryId, source)` — Mark entry as discovered; emit notification event; grant +5 XP first-discovery bonus; ignore if already unlocked
- `isUnlocked(registry, entryId)` — Check if entry has been discovered
- `getUnlockedEntries(registry, category)` — Get all unlocked entries, optionally filtered by category
- `getCategoryProgress(registry, category)` — Return `{ unlocked, total }` for category
- `getOverallProgress(registry)` — Return total percentage discovered
- `isCategoryComplete(registry, category)` — Check if all entries in category are unlocked

### Trigger Integration
The encyclopedia doesn't poll for triggers — other systems call `unlockEntry()`:
- **DialogueEngine**: After specific conversation nodes, call `unlockEntry()`
- **EncounterEngine**: After encountering cultural events, call `unlockEntry()`
- **GameScene**: On first area visit, call `unlockEntry()`
- **DayCycleEngine**: On season change, call `unlockEntry()`
- **SkillSystem**: On skill milestones, call `unlockEntry()`
- **InventoryManager**: On specific item interactions, call `unlockEntry()`

Each system is responsible for calling the unlock — encyclopedia is passive.

### Encyclopedia UI (Accessible from Pause Menu)
Full-screen overlay styled as a journal/notebook:

**Layout:**
- 5 category tabs across top with icons and color accents
- Left panel: scrollable entry list
  - Unlocked entries: title visible, clickable
  - Locked entries: "???" with faint lock icon
- Right panel: selected entry content
  - Title (bold)
  - Icon/illustration
  - Body text
  - Source tag ("Learned from: conversation with Freja")
  - Related entries (clickable links to jump between entries)
- Bottom: overall completion percentage
- Per-tab: "X / Y discovered" counter

**Visual Style:**
- Slightly worn paper/journal texture on background
- Hand-drawn style elements for category icons
- Physical-feeling tab clicks

**Interactions:**
- Click tab to switch category
- Click entry to view details
- Click related entry link to jump
- Keyboard: Left/Right arrows for tabs, Up/Down for entries, Enter to select

### Unlock Notification
When a new entry is discovered:
- Toast notification slides in: "📖 New Entry: [Entry Title]"
- Gold sparkle on notification icon
- Auto-dismiss after 3 seconds
- Clicking notification opens entry directly

### Category Completion
When all entries in a category are unlocked:
- Special notification: "🌟 [Category] Complete!"
- Badge/star appears on tab
- If desired, confetti burst animation (polish task)

### Starter Entries
Pre-populate on Day 1 (available immediately):
- "Your Apartment: Home Base" (Places)
- "Hej & Hej Hej: Hello & Goodbye" (Language)

## Acceptance Criteria
- [ ] Encyclopedia accessible from pause menu
- [ ] 5 category tabs display with correct entries
- [ ] Entry detail view shows title, body, source, related entries
- [ ] Locked entries show as "???" with lock icon
- [ ] `unlockEntry()` marks entry as discovered and emits notification
- [ ] Duplicate unlock calls are ignored (no double notification)
- [ ] +5 XP granted on first discovery
- [ ] Category progress counter (X/Y) is accurate
- [ ] Overall completion percentage calculates correctly
- [ ] Related entry links navigate to correct entries
- [ ] Category completion triggers special notification
- [ ] Starter entries (apartment, hej) available on Day 1
- [ ] Encyclopedia state persists across save/load
- [ ] Minimum 50 entries defined in data file

## Testing Requirements
- **Unit Test**: `unlockEntry()` adds entry to unlocked set
- **Unit Test**: `unlockEntry()` is idempotent (no duplicate unlock)
- **Unit Test**: `unlockEntry()` grants +5 XP on first unlock only
- **Unit Test**: `isUnlocked()` returns correct boolean
- **Unit Test**: `getCategoryProgress()` returns accurate counts
- **Unit Test**: `getOverallProgress()` percentage calculation
- **Unit Test**: `isCategoryComplete()` detects 100% in category
- **Unit Test**: All encyclopedia entries pass schema validation
- **Unit Test**: All entries have valid category assignment
- **Unit Test**: Related entry references point to existing entries
- **Integration Test**: Trigger from dialogue → unlockEntry → notification appears → entry viewable
- **Integration Test**: Unlock all entries in category → completion notification fires
- **Integration Test**: Open encyclopedia → browse tabs → view entries → navigate related links
- **Coverage Target**: ≥85% for EncyclopediaManager, data validation

## References
- FDD: Encyclopedia & Cultural Learning (complete specification with all entry tables)
- GDD Section 6: UI & Controls (Encyclopedia/Codex in pause menu)
