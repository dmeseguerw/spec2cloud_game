# Task 027: Story Mission Content & Daily Task Tuning

**GitHub Issue:** [#63 - Task 027: Story Mission Content & Daily Task Tuning](https://github.com/dmeseguerw/spec2cloud_game/issues/63)
**GitHub PR:** [#64 - [WIP] Add Chapter 1 story missions and daily task tuning](https://github.com/dmeseguerw/spec2cloud_game/pull/64)

## Description
Populate the Quest & Objectives System (Task 026) with concrete content: the **Chapter 1 Story Mission chain** (Days 1–14) and the **daily task generation tuning** to ensure the rules from Task 026 produce well-balanced, contextually appropriate tasks. This task is content-focused — it fills the engine from Task 026 with authored data rather than building new systems.

The Chapter 1 Story Mission chain is the backbone of the player's first two weeks. Each mission introduces a new game system or location, is triggered by an NPC conversation, and rewards XP on completion. Without this content, the quest engine exists but has nothing to serve — the player sees an empty Objectives Panel.

This task also creates the dialogue data (new dialogue trees or extensions to existing ones) that trigger each Story Mission via the `"mission"` dialogue effect type.

## Dependencies
- Task 026: Quest & Objectives Engine (QuestEngine, DailyTaskGenerator, Objectives Panel, `"mission"` dialogue effect)
- Task 018: Dialogue Engine & Conversation UI (dialogue trees, effect processing)
- Task 017: NPC Data & Relationship System (NPC profiles for scheduling new dialogue availability)
- Task 015: Inventory Management System (item checks for completion conditions)
- Task 016: Economy & Financial System (shop/bill data referenced by missions)
- Task 025: World-Collectible Items & Building Entry (pant bottle pickup is a mission goal)

## Technical Requirements

### Story Mission Definitions (`src/data/missions.js`)
A data file exporting all Story Missions as a keyed object. Each mission uses the task schema from Task 026.

#### Chapter 1 Missions (Days 1–14)

**Mission 1: "Grocery Run" (Day 1)**
- `id`: `"story_grocery_run"`
- `title`: `"Buy groceries from Netto"`
- `description`: `"Lars gave you a shopping list: Rugbrød, pasta, and milk. Head to Netto nearby."`
- `urgency`: `"normal"`
- `xpReward`: 15
- `xpPenalty`: 0
- `completionCondition`: `{ type: "flag", key: "first_grocery_complete", value: true }`
- **Trigger**: Assigned via Lars's Day 1 opening dialogue (new dialogue tree: `lars_day1_tutorial`)
- **Completion**: The ShopSystem sets the flag `"first_grocery_complete"` when the player completes a purchase at Netto for the first time

**Mission 2: "First Class" (Day 2)**
- `id`: `"story_first_class"`
- `title`: `"Attend the language school"`
- `description`: `"Lars mentioned a free introductory class at the language school. It might be worth checking out."`
- `urgency`: `"normal"`
- `xpReward`: 25
- `xpPenalty`: 0
- `completionCondition`: `{ type: "locationVisited", locationId: "language_school" }`
- **Trigger**: Shown in Day 1 summary's "Looking Ahead" section AND assigned via a brief Lars dialogue on Day 2 morning (dialogue tree: `lars_day2_language`)
- **Completion**: Player enters the language school building (door interaction from Task 025)

**Mission 3: "Meet the Commute" (Day 3–4)**
- `id`: `"story_first_metro"`
- `title`: `"Take the metro"`
- `description`: `"Sofie mentioned the metro is the fastest way across town. Try it out."`
- `urgency`: `"normal"`
- `xpReward`: 20
- `xpPenalty`: 0
- `completionCondition`: `{ type: "flag", key: "first_metro_ride", value: true }`
- **Trigger**: Assigned via new Sofie dialogue (dialogue tree: `sofie_metro_tip`)
- **Completion**: TransportManager sets `"first_metro_ride"` flag on first metro check-in/check-out cycle

**Mission 4: "Clock In" (Day 5–6)**
- `id`: `"story_first_workday"`
- `title`: `"Attend your first work day"`
- `description`: `"It's time to start your job. Head to the workplace during morning hours."`
- `urgency`: `"normal"`
- `xpReward`: 30
- `xpPenalty`: 0
- `completionCondition`: `{ type: "flag", key: "first_workday_complete", value: true }`
- **Trigger**: Auto-assigned on Day 5 morning by a morning overview prompt (no NPC dialogue needed — the day cycle generates a "Work obligation" that chains into this mission)
- **Completion**: Player completes a work activity (work system sets the flag)

**Mission 5: "One Week In" (Day 7)**
- `id`: `"story_one_week"`
- `title`: `"Survive your first week"`
- `description`: `"You've been in Denmark for a whole week. Take a moment to reflect."`
- `urgency`: `"normal"`
- `xpReward`: 50
- `xpPenalty`: 0
- `completionCondition`: `{ type: "dayReached", day: 7 }`
- **Trigger**: Auto-assigned on Day 6 evening
- **Completion**: Automatic when Day 7 begins

**Mission 6: "The Neighbour" (Day 8–10)**
- `id`: `"story_thomas_second"`
- `title`: `"Talk to Thomas again"`
- `description`: `"Thomas seemed guarded last time. Maybe a second conversation would go differently."`
- `urgency`: `"normal"`
- `xpReward`: 25
- `xpPenalty`: 0
- `completionCondition`: `{ type: "npcTalked", npcId: "thomas" }`
- **Trigger**: Assigned when Thomas is seen walking past the apartment area (NPC schedule places Thomas nearby on Day 8 afternoon)
- **Completion**: Player initiates and completes a conversation with Thomas (a new dialogue tree: `thomas_second_meeting`)

**Mission 7: "The Pant Run" (Day 11–13)**
- `id`: `"story_pant_run"`
- `title`: `"Return 5 pant bottles"`
- `description`: `"Mette mentioned you can return bottles for money. Collect and return 5 pant bottles."`
- `urgency`: `"normal"`
- `xpReward`: 20
- `xpPenalty`: 0
- `completionCondition`: `{ type: "pantReturned", minCount: 5 }`
- **Trigger**: Assigned via new Mette dialogue (dialogue tree: `mette_pant_tutorial`)
- **Completion**: Player returns a cumulative total of 5 pant bottles via the pantalon machine

**Mission 8: "Settled?" (Day 14)**
- `id`: `"story_lars_coffee"`
- `title`: `"Have coffee with Lars"`
- `description`: `"Lars invited you for a cup of coffee. That's a big deal in Denmark."`
- `urgency`: `"normal"`
- `xpReward`: 40
- `xpPenalty`: 0
- `completionCondition`: `{ type: "flag", key: "lars_coffee_complete", value: true }`
- **Trigger**: Assigned via new Lars dialogue on Day 13 (dialogue tree: `lars_coffee_invitation`)
- **Completion**: Player completes the coffee conversation (new dialogue tree: `lars_coffee_event`) which sets the flag

### Required Dialogue Content

The following new dialogue trees must be authored to support the Story Mission chain:

| Dialogue ID | NPC | Purpose | Minimum Nodes | Mission Assigned |
|---|---|---|---|---|
| `lars_day1_tutorial` | Lars | Day 1 opening — welcome, grocery list handoff | 6 | `story_grocery_run` |
| `lars_day2_language` | Lars | Day 2 morning — mention language school | 4 | `story_first_class` |
| `sofie_metro_tip` | Sofie | Day 3–4 — introduces metro as transport option | 5 | `story_first_metro` |
| `thomas_second_meeting` | Thomas | Day 8–10 — a warmer second conversation | 6 | None (completes `story_thomas_second`) |
| `mette_pant_tutorial` | Mette | Day 11–13 — explains the pant return system | 5 | `story_pant_run` |
| `lars_coffee_invitation` | Lars | Day 13 — invites player for kaffe | 4 | `story_lars_coffee` |
| `lars_coffee_event` | Lars | Day 14 — the coffee conversation itself | 8 | None (completes `story_lars_coffee`) |

Each dialogue tree must:
- Follow the dialogue data format from Task 018 (nodes, responses, conditions, effects)
- Include at least 2 branching paths
- Award relationship XP and/or encyclopedia entries where appropriate
- Use the `{ type: "mission", missionId: "..." }` effect to assign the associated Story Mission
- Feel narratively organic — the mission assignment should emerge from conversation, not feel forced

### Dialogue Replacement for Day 1
The existing `lars_welcome` dialogue tree must be replaced (or extended) with `lars_day1_tutorial`. The new version:
- Incorporates the grocery list handoff as the conversational climax
- Mentions vitamin D ("pick some up if you see them")
- Ends with Lars waving goodbye and the Objectives Panel lighting up
- Uses the `"mission"` effect to assign `story_grocery_run`

### Daily Task Tuning

Verify and adjust the DailyTaskGenerator rules from Task 026 to ensure:

**Food rules:**
- "Low food" triggers at ≤ 1 food item (not ≤ 1 *stack* — must count actual food category items)
- "No food" triggers at exactly 0 food items
- The generated task title references the nearest shop by name/location

**Bill rules:**
- Bill task titles include the bill type and amount (e.g., "Rent of 8,000 DKK is due in 2 days")
- Overdue bill tasks include the penalty amount in the description

**Vitamin D rule:**
- In winter season, vitamin D urgency escalates from `"normal"` to `"urgent"`
- Description changes seasonally: winter adds "The dark Danish winter demands it"

**NPC dialogue rule:**
- This rule checks whether any NPC has a story-relevant dialogue tree flagged as available (based on day number and prerequisite flags) but not yet initiated. The task surfaces as "[NPC name] seems to want to talk to you"
- Only one NPC dialogue nudge per day (highest priority NPC)

**Explore nudge:**
- Only triggers if the player has visited fewer than 3 distinct locations total (new players who stick to one area)
- OR if 5+ days have passed since the last new location visit (experienced players in a rut)

### Mission Availability Schedule
Define a data structure that controls when each NPC dialogue becomes available:

| Day | Dialogue Available | Prerequisite |
|---|---|---|
| 1 | `lars_day1_tutorial` | Character creation complete |
| 2 | `lars_day2_language` | `story_grocery_run` completed |
| 3 | `sofie_metro_tip` | Day ≥ 3, Sofie visible in world |
| 5 | Work activity available | Day ≥ 5 |
| 8 | `thomas_second_meeting` | `thomas_first_meeting` completed |
| 11 | `mette_pant_tutorial` | `story_grocery_run` completed, Day ≥ 11 |
| 13 | `lars_coffee_invitation` | Lars relationship ≥ 50, Day ≥ 13 |
| 14 | `lars_coffee_event` | `story_lars_coffee` assigned |

This schedule is checked by the Daily Task Generator's "NPC has dialogue" rule to surface the right nudge at the right time.

## Acceptance Criteria
- [ ] All 8 Chapter 1 Story Missions are defined in `src/data/missions.js` with correct schemas
- [ ] Each Story Mission has a clear completion condition that maps to an existing game event type
- [ ] All 7 new dialogue trees are created with minimum required nodes and branching paths
- [ ] `lars_day1_tutorial` replaces the existing `lars_welcome` as the Day 1 opening dialogue
- [ ] Each mission-assigning dialogue uses the `"mission"` effect type to trigger QuestEngine.addTask()
- [ ] Mission availability schedule correctly gates dialogue availability by day and prerequisites
- [ ] Daily task generator correctly creates food/bill/vitamin D/NPC/explore tasks based on state
- [ ] Daily task titles are specific (include shop names, bill amounts, NPC names)
- [ ] Vitamin D task urgency escalates in winter season
- [ ] End-of-day evaluation correctly handles all generated daily tasks
- [ ] The full Day 1–14 story chain can be played through: each mission completes, the next unlocks
- [ ] Dialogue trees feel natural and each conversation has at least 2 meaningful branching paths

## Testing Requirements
- **Unit tests for missions.js:** Validate all 8 missions have required fields, valid completion condition types, and positive XP rewards
- **Unit tests for dialogue trees:** Each of the 7 new dialogue trees must be parseable by DialogueEngine, have valid node references (no dangling `nextNode` pointers), and contain at least one `"mission"` effect where expected
- **Unit tests for mission availability schedule:** Given various day numbers and flag states, verify correct dialogues are flagged as available
- **Unit tests for daily task tuning:**
  - Empty inventory → generates "no food" critical task
  - One food item → generates "low food" urgent task
  - Bill due in 2 days → generates normal bill task with correct title
  - Overdue bill → generates urgent bill task
  - No vitamin D in winter → generates urgent vitamin D task
  - No vitamin D in summer → generates normal vitamin D task
- **Integration test:** Play through Day 1: Lars dialogue assigns `story_grocery_run`, player enters Netto and buys items, flag is set, mission auto-completes, panel updates, Day Summary shows correct XP
- **Integration test:** Advance to Day 2, verify `lars_day2_language` becomes available, starts `story_first_class` mission chain
- **Content review:** Dialogue text should be proofread for tone consistency (warm, educational, not preachy)
- **Coverage target:** ≥85% for missions.js validation, dialogue trees, and daily task generation rules
