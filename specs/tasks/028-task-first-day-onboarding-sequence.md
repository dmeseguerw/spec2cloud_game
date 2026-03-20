# Task 028: First Day Onboarding Sequence

## Description
Implement the authored **Day 1 experience** — the fully scripted onboarding sequence that guides the player from waking up in their apartment through their first NPC conversation, first world-item pickup, first shop visit, first inventory use, and first Day Summary. This task wires together systems built in Tasks 025 (collectibles + door entry), 026 (quest engine + objectives panel), and 027 (story mission content + Lars Day 1 dialogue) into a single cohesive first-play experience.

Day 1 is not procedurally generated — it is a hand-crafted sequence designed to teach every core mechanic through narrative rather than tutorials. By the end of Day 1, a new player should understand: how to talk to NPCs, how to pick up items from the world, how to enter a building, how to shop, how to use items from inventory, how to read the Objectives Panel, and how the day cycle works. They should also feel positive and curious about Day 2.

This task does NOT build new systems — it integrates and configures existing ones for the Day 1 context.

## Dependencies
- Task 008: Player Entity & World Movement (player movement, GameScene, interaction system)
- Task 011: Character Creation System (player joins Day 1 after character creation)
- Task 012: XP & Level Progression Engine (XP rewards during Day 1)
- Task 013: Day Cycle & Season Management (Day 1 runs as a normal day, ends with Day Summary)
- Task 015: Inventory Management System (buying and using items)
- Task 016: Economy & Financial System (shopping at Netto)
- Task 017: NPC Data & Relationship System (Lars placement and relationship)
- Task 018: Dialogue Engine & Conversation UI (Lars Day 1 dialogue)
- Task 021: Day Summary & Review Screen (Day 1 summary with XP breakdown + Day 2 preview)
- Task 025: World-Collectible Items & Building Entry (pant bottle placement, Netto door)
- Task 026: Quest & Objectives Engine (Objectives Panel active during Day 1)
- Task 027: Story Mission Content (Lars Day 1 dialogue tree, `story_grocery_run` mission)

## Technical Requirements

### Day 1 Initialization
When a new game begins (after character creation completes), the game enters Day 1 with specific initial state:

#### Starting State Configuration
The `initializeNewGame()` function (from Task 011/003) must set these values:

- `CURRENT_DAY`: 1
- `PLAYER_MONEY`: 1,200 DKK (regardless of job — Day 1 is standardised for the tutorial)
- `PLAYER_HEALTH`: 75 (slightly below full — eating improves it)
- `PLAYER_XP`: 0
- `PLAYER_LEVEL`: 1
- `PLAYER_ENERGY`: 80
- `INVENTORY`: Empty (no starting items)
- `SKILL_LANGUAGE`: 0 (level 1 — English only)
- `NPC_RELATIONSHIPS`: Lars at 30/100, all others at default
- `TIME_OF_DAY`: "morning"
- `SEASON`: "autumn" (default starting season)
- `TUTORIAL_COMPLETED`: false
- `ACTIVE_TASKS`: Empty (populated by Lars's dialogue)

#### Day 1 Special Rules
On Day 1 only (checked via `CURRENT_DAY === 1 && !TUTORIAL_COMPLETED`):
- The day does NOT auto-end at midnight — it persists until the player manually chooses to sleep
- No mandatory activities are generated (no work, no bills — just the grocery mission)
- No random encounters trigger (Day 1 is controlled; encounters start on Day 2)
- The adaptive difficulty system does not apply XP penalties
- Weather is fixed to "overcast" (atmospheric, not punishing)

### Day 1 World Setup

#### GameScene Configuration for Day 1
When GameScene loads on Day 1, it must set up the following authored world elements in addition to the standard procedural neighbourhood:

**Lars Placement:**
- Lars spawns at the apartment building entrance (not inside the apartment — the player walks out and meets him)
- Lars has his interaction indicator (speech bubble) showing a "!" (exclamation) — first-time dialogue available
- Lars's dialogue tree is set to `lars_day1_tutorial` (from Task 027)
- After the dialogue completes, Lars's indicator changes from "!" to "..." (he's available for optional repeat greeting but no new mission)

**Pant Bottle Placement (Day 1 Authored):**
- One collectible pant bottle (aluminium can) placed on the pavement between the apartment and Netto
- Uses the sparkle particle effect from Task 025
- Position: roughly halfway along the walk route so the player encounters it naturally
- `tooltip`: "Pant bottle — return at any shop for 1-3 DKK. Denmark has the world's highest bottle return rate!"
- XP reward on pickup: +2

**Netto Door:**
- Netto's building has a door interactable (from Task 025) configured with:
  - `targetScene`: "ShopScene"
  - `targetData`: `{ shopId: "netto" }`
  - `label`: "Netto"
  - `openCondition`: Always open on Day 1 (no hours restriction on tutorial day)
- The door indicator is green and visible from a distance on Day 1

**Environmental Details (Non-Interactive, Authored):**
- Kasper's bicycle parked against a lamppost near the route (a static sprite — not interactive on Day 1, but establishes his presence for future days)
- A community notice board sprite near Netto (static, no interaction — text visible to observant players: "Nørrebro Language Exchange — Tuesdays")
- 2-3 ambient NPC pedestrians walking fixed paths (use generic NPC sprites — they are not interactable)

### Day 1 Event Sequence

The following events must fire in order as the player progresses through Day 1. These are not hard-coded triggers — they are the natural result of the systems working together. The task is to ensure the configuration makes this sequence *inevitable* for any player who follows the Objectives Panel.

**1. Game starts → Player is in apartment area → Lars is nearby with "!" indicator**
- No system intervention needed; Lars's presence and indicator naturally draw interaction

**2. Player talks to Lars → `lars_day1_tutorial` dialogue runs**
- Dialogue assigns `story_grocery_run` via `"mission"` effect
- Objectives Panel lights up: "Buy groceries from Netto"
- Relationship +5 with Lars
- XP +10 (dialogue completion)

**3. Player walks toward Netto → encounters pant bottle on street**
- Optional: player picks up the bottle (+2 XP, item added to inventory)
- Optional: player ignores it (no penalty, no prompt if they walk past)

**4. Player approaches Netto door → context hint: "Press E — Enter Netto"**
- Player presses E → ShopScene launches with Netto inventory
- XP +5 (first-time location visit: Netto)

**5. Player shops at Netto → buys groceries**
- ShopSystem sets `"first_grocery_complete"` flag on purchase
- QuestEngine detects flag → auto-completes `story_grocery_run`
- Objectives Panel: green checkmark animation → "Return home and eat something" (this is not a tracked mission — it's a contextual hint)
- XP +15 (mission completion)

**6. Player opens inventory (Tab) → uses a food item**
- InventoryManager processes the use → health improves
- XP +5 (first item usage one-time bonus)

**7. Player returns to apartment → context hint: "Press E — Go to sleep"**
- Apartment door has a special Day 1 target: the sleep prompt
- Player confirms → Day Summary scene launches

### Shop Scene Enhancement for Day 1
The ShopScene (Task 016) needs a minor Day 1 enhancement:
- When `CURRENT_DAY === 1 && !TUTORIAL_COMPLETED`, items from Lars's grocery list (Rugbrød, pasta, milk) are highlighted with a soft gold border in the shop item list
- A "💡 Recommended" label appears next to Vitamin D tablets
- If the player has pant bottles in inventory, a "Return pant bottles" button appears at the top of the shop interface

### Day Summary Enhancement for Day 1
The Day Summary screen (Task 021) needs a Day 1 enhancement:
- The "Tomorrow's Preview" section must include the text: "Lars mentioned there's a free introductory class at the language school nearby. It might be worth checking out tomorrow."
- This text plants the `story_first_class` mission seed for Day 2
- The summary should show all XP gains with friendly labels:
  - "Talked with Lars" | +10 XP
  - "First grocery run completed" | +15 XP
  - "Visited Netto for the first time" | +5 XP
  - "Ate a meal" | +5 XP
  - "Picked up pant bottle" | +2 XP *(if collected)*
  - "Returned pant bottles" | +1 XP *(if returned)*
  - "Survived your first day!" | +10 XP *(end-of-day bonus)*

### Day 1 Completion
When the Day Summary is dismissed (player clicks Continue):
- `TUTORIAL_COMPLETED` is set to true
- `CURRENT_DAY` advances to 2
- Normal game rules apply from Day 2 onwards (random encounters, mandatory activities, adaptive difficulty)
- The `story_first_class` mission is assigned if `story_grocery_run` was completed
- DailyTaskGenerator runs for Day 2, generating appropriate daily tasks

### Apartment Door Behaviour
The player's apartment building needs a door interactable with context-sensitive behaviour:
- **Day 1 evening (after grocery mission complete):** Context hint: "Press E — Go to sleep". Triggers day-end prompt.
- **Day 1 (before grocery mission complete):** Context hint: "Press E — Enter apartment". No day-end prompt; player enters apartment interior (or no scene — just a brief text: "Nothing to do here yet. Lars said something about groceries...")
- **Day 2+ normal behaviour:** Context hint: "Press E — Enter apartment". Opens apartment interior where player can rest, plan, check obligations.

## Acceptance Criteria
- [ ] New game starts on Day 1 with correct initial state (1,200 DKK, empty inventory, health 75, XP 0)
- [ ] Lars spawns near the apartment with a "!" interaction indicator
- [ ] Talking to Lars runs the `lars_day1_tutorial` dialogue and assigns the `story_grocery_run` mission
- [ ] Objectives Panel displays "Buy groceries from Netto" after Lars's dialogue
- [ ] One pant bottle collectible is placed on the route between apartment and Netto
- [ ] Picking up the pant bottle awards +2 XP and adds it to inventory
- [ ] Netto has a door interactable with green indicator, context hint "Press E — Enter Netto"
- [ ] Entering Netto opens ShopScene with Netto's inventory; grocery list items are highlighted on Day 1
- [ ] Completing a purchase at Netto sets the `"first_grocery_complete"` flag
- [ ] The `story_grocery_run` mission auto-completes with +15 XP and green checkmark animation
- [ ] Using a food item from inventory on Day 1 awards +5 XP first-use bonus
- [ ] The apartment door enables sleep prompt after the grocery mission is complete
- [ ] Day Summary displays correct XP breakdown with friendly labels
- [ ] Day Summary "Tomorrow's Preview" mentions the language school
- [ ] `TUTORIAL_COMPLETED` is set to true after Day 1 completes
- [ ] Day 2 begins with normal game rules (encounters, mandatory activities, daily tasks)
- [ ] Day 1 cannot fail: no XP penalties, no auto-day-end, no mandatory activities beyond the grocery mission

## Testing Requirements
- **Integration test — Full Day 1 playthrough:** Automated test that simulates: start new game → interact with Lars → walk to pant bottle → pick up → enter Netto → buy groceries → use food item → sleep → verify Day Summary XP totals are correct
- **Unit test — Day 1 initial state:** Verify all starting values match specification (1,200 DKK, health 75, empty inventory, etc.)
- **Unit test — Day 1 special rules:** On Day 1, verify: no random encounters generated, no mandatory activities, no auto-day-end, weather fixed to overcast
- **Unit test — Grocery list highlighting:** When `CURRENT_DAY === 1`, ShopScene marks Rugbrød/pasta/milk with highlight flag
- **Unit test — Day 1 XP events:** Verify all 6-7 XP events from Day 1 fire with correct amounts
- **Unit test — TUTORIAL_COMPLETED flag:** Verify flag transitions from false to true only after Day Summary is dismissed
- **Unit test — Day 2 transition:** After Day 1 completes, verify CURRENT_DAY is 2, DailyTaskGenerator runs, normal encounter system is enabled
- **Edge case — Player skips Lars:** If the player somehow walks past Lars without talking, the "!" indicator persists and objectives panel stays empty until they interact. No crash, no softlock.
- **Edge case — Player exits Netto without buying:** Mission remains active, Objectives Panel still shows "Buy groceries from Netto". Player can re-enter Netto.
- **Edge case — Player tries to sleep before grocery mission:** Apartment door shows "nothing to do" message; player is redirected to complete the mission
- **Coverage target:** ≥85% for Day 1 initialization logic, event sequence validation, and Day Summary enhancement
