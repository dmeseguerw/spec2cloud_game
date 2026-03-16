# Task 018: Dialogue Engine & Conversation UI

**GitHub Issue:** [#31 - Task 018: Dialogue Engine & Conversation UI](https://github.com/dmeseguerw/spec2cloud_game/issues/31)
**GitHub PR:** [#38 - [WIP] Implement branching dialogue system for NPC conversations](https://github.com/dmeseguerw/spec2cloud_game/pull/38)

## Description
Implement the branching dialogue system that drives NPC conversations. This includes the dialogue data format, the dialogue runner engine, the conversation UI (DialogueScene), response selection, language skill gating, typewriter text effect, and dialogue-triggered outcomes (XP, relationship changes, item gifts, encyclopedia unlocks).

## Dependencies
- Task 004: Scene Framework (DialogueScene overlay)
- Task 007: UI Framework (dialog box, buttons, text)
- Task 009: Audio System (blip sounds, voice effects)
- Task 012: XP & Level Progression (dialogue XP outcomes)
- Task 017: NPC Data & Relationship (NPC profiles, relationship stages, memory)

## Technical Requirements

### Dialogue Data Format (`src/data/dialogues/`)
Structured JSON files for dialogue trees (one file per NPC or per conversation):

**Dialogue Node Schema:**
- `id` — Unique node identifier
- `speaker` — NPC name (or "player" for player lines)
- `text` — Dialogue text string
- `portrait` — Speaker portrait asset key
- `responses` — Array of response options:
  - `text` — Response text shown to player
  - `nextNode` — Node ID to go to after selection
  - `condition` — Optional condition for availability (skill level, item, relationship)
  - `effects` — Array of effects triggered on selection:
    - `{ type: "xp", amount: 15 }`
    - `{ type: "relationship", npcId: "lars", delta: 5 }`
    - `{ type: "item", itemId: "danish_cookbook", action: "give" }`
    - `{ type: "encyclopedia", entryId: "hygge" }`
    - `{ type: "skill", skillKey: "language", delta: 2 }`
    - `{ type: "flag", key: "helped_lars_day3", value: true }`
- `autoAdvance` — If true, no responses needed; advance to nextNode after text completes
- `endConversation` — If true, dialogue ends after this node

**Dialogue Tree Structure:**
- Tree starts at a root node
- Player choices branch to different nodes
- Nodes can loop or converge
- Dead-end nodes mark conversation end
- Special "greeting" node varies by relationship stage

### DialogueEngine (`src/systems/DialogueEngine.js`)
Runs dialogue trees:

- `startDialogue(registry, npcId, conversationId)` — Begin a conversation
- `getCurrentNode()` — Return current dialogue node
- `getAvailableResponses(registry)` — Return filtered responses (check conditions)
- `selectResponse(registry, responseIndex)` — Apply effects, advance to next node
- `isConversationActive()` — Check if dialogue is running
- `endDialogue()` — Clean up, return control to GameScene

**Condition Checking:**
- `languageLevel >= X` — Require minimum language skill level
- `relationship >= X` — Require minimum relationship with NPC
- `hasItem(itemId)` — Require player has specific item
- `flag(key) == value` — Require game flag set to value
- `skill(key) >= X` — Require minimum skill level

**Language Skill Gating:**
- Some response options are in Danish (require language skill)
- Language level 1: All options in English
- Language level 2: Basic Danish greetings available
- Language level 3: Mixed Danish/English conversation
- Language level 4-5: Advanced Danish dialogue unlocked
- Gated options shown but dimmed with lock icon + "Requires Danish Level X"

### DialogueScene (`src/scenes/DialogueScene.js`)
Overlay UI for conversations:

**Layout:**
- NPC portrait (left side) — character face sprite
- Speaker name label above portrait
- Dialogue text box (bottom 30% of screen) with semi-transparent background
- Response buttons below text (2-4 options)
- Close/skip button for auto-advance nodes

**Text Display:**
- Typewriter effect: text appears character by character (configurable speed)
- Skip: click or press Space to instantly show full text
- After text completes, response options fade in
- If autoAdvance, brief pause then next node

**Audio per NPC:**
- Each NPC has a unique "blip" sound that plays per character during typewriter
- Different pitch/tone per NPC personality
- Sound respects SFX volume setting

**Response Display:**
- 2-4 response buttons stacked vertically
- Available options: normal styling, clickable
- Locked options (unmet conditions): dimmed, lock icon, tooltip "Requires [condition]"
- Hover effect on available options
- Click or number key (1-4) to select

**Effect Application:**
- On response selection, apply all effects immediately:
  - XP changes: play gain/loss sound, show notification
  - Relationship changes: update relationship + show small indicator
  - Item transactions: add/remove from inventory
  - Encyclopedia: unlock entry
  - Skill changes: increment skill
  - Flags: set game flags for future dialogue branching

### Starting Dialogue Content
Create initial dialogue trees for at least 3 NPCs for testing:
- **Lars** (tutorial guide): Welcome conversation, basic Denmark tips
- **Mette** (grocery clerk): Shopping help conversation
- **Thomas** (skeptic): Guarded first meeting

Each with at least 5 nodes and 2-3 branching paths.

## Acceptance Criteria
- [ ] Dialogue starts when player interacts with NPC
- [ ] Dialogue text displays with typewriter effect at configurable speed
- [ ] Clicking or pressing Space skips to full text
- [ ] Response options appear after text completes
- [ ] Selecting a response advances to the correct next node
- [ ] Language-gated options show as locked with requirement text
- [ ] Dialogue effects (XP, relationship, items) apply on response selection
- [ ] NPC portrait displays correctly for the speaking NPC
- [ ] Each NPC has a distinct blip sound during text display
- [ ] Dialogue ends correctly and returns control to GameScene
- [ ] Auto-advance nodes progress without player input
- [ ] Conditions correctly gate response availability
- [ ] At least 3 NPC dialogue trees are functional for testing
- [ ] Dialogue state (flags, history) persists across save/load

## Testing Requirements
- **Unit Test**: DialogueEngine starts at correct root node
- **Unit Test**: Response condition checking for all condition types (skill, item, relationship, flag)
- **Unit Test**: Effect application for all effect types (XP, relationship, item, encyclopedia, skill, flag)
- **Unit Test**: Language gating correctly locks responses by level
- **Unit Test**: `getAvailableResponses()` filters locked/unavailable options correctly
- **Unit Test**: Dialogue tree traversal reaches expected nodes for each choice path
- **Unit Test**: Conversation end detection works for terminal nodes
- **Integration Test**: Full conversation flow with NPC — multiple exchanges, branching path
- **Integration Test**: Dialogue effects reflect in registry after conversation
- **Integration Test**: DialogueScene overlay opens and closes correctly without leaking input
- **Manual Test**: Typewriter effect visual quality and speed
- **Manual Test**: NPC blip sounds are distinct and pleasant
- **Coverage Target**: ≥85% for DialogueEngine, condition checking, effect application

## References
- FDD: Dialogue & NPC System (complete dialogue specification)
- ADR 0002: Scene Architecture (DialogueScene overlay pattern)
- GDD Section 3: Game Mechanics (talk verb, social XP)
- GDD Section 5: Content (NPC character details, scenarios)
