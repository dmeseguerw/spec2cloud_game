# Task 026: Quest & Objectives Engine

**GitHub Issue:** [#61 - Task 026: Quest & Objectives Engine](https://github.com/dmeseguerw/spec2cloud_game/issues/61)
**GitHub PR:** [#62 - [WIP] Implement quest and objectives system](https://github.com/dmeseguerw/spec2cloud_game/pull/62)

## Description
Implement the Quest & Objectives System — the core engine that tracks what the player should be doing at any given moment. This system introduces two task types: **Story Missions** (authored, narrative-driven goals given by NPCs) and **Daily Maintenance Tasks** (generated each day from the player's current state). It also implements the **Objectives Panel** — an always-visible HUD element at the bottom-centre of the screen that shows the current active task.

Currently, no quest or objective tracking exists. Players can talk to NPCs and receive XP, but there is no mechanism to assign goals, track progress toward them, complete them, or display them. This task builds the entire objectives data model, the engine that manages task lifecycle, the daily task generator, and the UI panel.

This is a foundational system — Task 027 will populate it with Story Mission content and Task 028 will integrate it into the Day 1 onboarding.

## Dependencies
- Task 003: State Management Foundation (registry for persisting quest state)
- Task 007: UI Framework & HUD System (UIScene for rendering the Objectives Panel, NotificationManager for completion toasts)
- Task 009: Audio System Foundation (task-assigned / task-completed chimes)
- Task 012: XP & Level Progression Engine (completing objectives grants XP)
- Task 013: Day Cycle & Season Management (daily task generation triggers on new day)
- Task 015: Inventory Management System (daily tasks check food supply, vitamin D stock)
- Task 018: Dialogue Engine & Conversation UI (dialogue effects can assign Story Missions — new effect type `missionAssign`)

## Technical Requirements

### Quest Data Model

#### Task Object Schema
Every task (Story Mission or Daily) has a consistent shape:

- `id` — Unique string identifier (e.g., `"story_grocery_run"` or `"daily_low_food_day14"`)
- `type` — `"story"` or `"daily"`
- `title` — Short display string (max ~6 words), shown in the Objectives Panel (e.g., `"Buy groceries from Netto"`)
- `description` — Longer description shown in the expanded task list (1-2 sentences)
- `icon` — Task type icon: `"📖"` for story, `"🔵"` for normal daily, `"⚠️"` for urgent, `"🚨"` for critical
- `urgency` — One of: `"low"`, `"normal"`, `"urgent"`, `"critical"`
- `status` — One of: `"active"`, `"completed"`, `"failed"`, `"skipped"`
- `assignedDay` — The in-game day number when the task was created
- `completedDay` — The in-game day when completed (null while active)
- `xpReward` — XP awarded on completion (0 for daily tasks that only penalise on miss)
- `xpPenalty` — XP deducted at end-of-day if not completed and urgency is `"urgent"` or `"critical"` (0 for optional tasks)
- `completionCondition` — A condition object describing what completes the task (see below)
- `skippable` — Boolean; whether the player can manually skip this task (false for story missions, true for optional daily tasks)

#### Completion Condition Types
Conditions are checked by the QuestEngine on relevant game events:

- `{ type: "flag", key: "...", value: true }` — A game flag is set (e.g., `"visited_netto"`)
- `{ type: "hasItem", itemId: "...", minQuantity: 1 }` — Player has a specific item in inventory
- `{ type: "npcTalked", npcId: "..." }` — Player has talked to a specific NPC (checks dialogue history)
- `{ type: "locationVisited", locationId: "..." }` — Player has visited a location (checks `VISITED_LOCATIONS`)
- `{ type: "moneySpent", minAmount: 0 }` — Player has spent money (tracked via flag set by ShopSystem on purchase)
- `{ type: "pantReturned", minCount: 1 }` — Player has returned pant bottles (tracked via counter flag)
- `{ type: "itemUsed", itemId: "..." }` — Player has used a specific item from inventory
- `{ type: "dayReached", day: 7 }` — A specific in-game day has been reached

### QuestEngine (`src/systems/QuestEngine.js`)
Central quest management system:

#### Core Methods
- `addTask(registry, taskObject)` — Add a new task to the active task list. Emits `"quest:taskAdded"` event.
- `completeTask(registry, taskId)` — Mark task as completed, set `completedDay`, grant `xpReward`. Emits `"quest:taskCompleted"` event.
- `failTask(registry, taskId)` — Mark task as failed, apply `xpPenalty`. Emits `"quest:taskFailed"` event.
- `skipTask(registry, taskId)` — Mark optional daily task as skipped for today. Only works if `skippable` is true.
- `getActiveTasks(registry)` — Return all tasks with status `"active"`, sorted by priority (critical > urgent > story > normal > low).
- `getActiveStoryMission(registry)` — Return the highest-priority active story mission (or null).
- `getCompletedTasks(registry)` — Return all completed tasks (for journal view).
- `getTrackedTask(registry)` — Return the task currently pinned as "tracked" (displayed in collapsed Objectives Panel).
- `setTrackedTask(registry, taskId)` — Pin a specific task as tracked. If null, auto-track highest priority.
- `checkCompletionConditions(registry, eventType, eventData)` — Called on game events; checks all active tasks' conditions against the event. Auto-completes any task whose condition is now met.

#### Event-Driven Completion
The QuestEngine listens for game events and checks completion conditions:

| Game Event | Triggers Check For |
|---|---|
| `"flag:set"` | `flag` conditions |
| `"inventory:added"` | `hasItem` conditions |
| `"dialogue:ended"` | `npcTalked` conditions |
| `"location:entered"` | `locationVisited` conditions |
| `"shop:purchased"` | `moneySpent` conditions |
| `"pant:returned"` | `pantReturned` conditions |
| `"inventory:used"` | `itemUsed` conditions |
| `"day:started"` | `dayReached` conditions |

When a condition is met, the task auto-completes with its XP reward.

#### Story Mission Assignment via Dialogue
Extend the dialogue effect system (from Task 018) with a new effect type:
- `{ type: "mission", missionId: "story_grocery_run" }`
- When the DialogueEngine processes this effect, it calls `QuestEngine.addTask()` with the corresponding Story Mission definition.
- Story Mission definitions are stored in a missions data file (`src/data/missions.js`) — separate from dialogue data.

### Daily Task Generator (`src/systems/DailyTaskGenerator.js`)
Generates maintenance tasks at the start of each new day based on player state:

#### Generation Method
- `generateDailyTasks(registry, currentDay)` — Evaluate all condition rules, create tasks for unmet conditions, return array of new daily tasks.
- Called by the DayCycleEngine at the start of each new in-game day (or on game load if mid-day).
- Each generated task has a deterministic ID based on condition type + day number (prevents duplicates if generation runs twice).

#### Daily Task Rule Table
Each rule checks a condition and generates a task if the condition is met:

| Rule | Condition Check | Task Generated | Urgency |
|---|---|---|---|
| Low food | Food items in inventory ≤ 1 | "You're running low on food — visit a shop" | urgent |
| No food | Food items in inventory = 0 | "You have nothing to eat — buy groceries now" | critical |
| Bill due soon | Any bill in `PENDING_BILLS` with due date within 2 days | "[Bill type] is due in [N] days — pay it soon" | normal |
| Bill overdue | Any bill in `PENDING_BILLS` past due date | "[Bill type] is overdue — pay now to avoid penalty" | urgent |
| No vitamin D | `vitamin_d` not in inventory | "You're out of vitamin D — pick some up at Matas" | normal (winter: urgent) |
| Low health | `PLAYER_HEALTH` < 40 | "You're not feeling well — consider resting or eating" | normal |
| NPC has dialogue | An NPC has a new conversation flagged available | "[NPC name] seems to want to talk to you" | normal |
| Explore nudge | 5+ days since a new location was visited | "You haven't explored much lately — venture somewhere new" | low |

#### End-of-Day Evaluation
At end-of-day (before Day Summary), the QuestEngine processes remaining active daily tasks:
- Tasks with `urgency` `"critical"` or `"urgent"` that are still active: apply `xpPenalty`, mark as `"failed"`
- Tasks with `urgency` `"normal"` or `"low"` that are still active: silently expire (no penalty), mark as `"skipped"`
- All daily tasks are cleared after evaluation — tomorrow gets a fresh set

### New Registry Keys
Add to `RegistryKeys.js`:
- `ACTIVE_TASKS` — Array of active task objects
- `COMPLETED_TASKS` — Array of completed/failed task objects (historical log)
- `TRACKED_TASK_ID` — String ID of the currently tracked (pinned) task

### Objectives Panel UI (UIScene Extension)
Extend the existing UIScene (from Task 007) with an Objectives Panel:

#### Collapsed View (Default)
- Position: bottom-centre of screen, horizontally centred
- Background: semi-transparent dark rounded rectangle (width auto-fits text, min-width 200px, max-width 400px)
- Content: `[Icon] [Task title]` — single line, clean sans-serif font
- Icon colour-coded by urgency: gold (📖 story), blue (🔵 normal), amber (⚠️ urgent), red (🚨 critical)
- If no tasks active: show `"No tasks right now — explore!"` in muted text

#### Task Completion Animation
- When a task is completed: the panel text turns green, a checkmark icon appears, holds for 1.5 seconds
- After the hold, the next highest-priority task slides in from below, replacing the completed text
- Play the task-completed chime sound

#### Task Cycling
- When multiple tasks are active: the panel cycles through them on a 5-second rotation (one at a time)
- Display priority order: critical > urgent > story > normal > low
- The player can override cycling by manually pinning a task (via expanded view)

#### Urgent Pulse
- If any active task has urgency `"urgent"` or `"critical"`: the panel background gently pulses amber every 30 seconds
- Pulse is subtle (opacity oscillation 0.7 → 1.0 → 0.7), not distracting

#### Expanded View (Click to Open)
- Clicking the collapsed Objectives Panel opens an expanded floating panel (slides up from the bottom)
- Two sections separated by headers:
  - **Story Missions** (gold header): listed in priority order
  - **Daily Tasks** (blue header): listed by urgency
- Each entry shows: icon, title, brief description, status indicator
- Completed tasks shown faded with checkmark
- Clicking a task pins it as tracked (updates collapsed view)
- Optional daily tasks show a "Skip" button
- Panel dismissed by clicking outside, pressing Escape, or pressing Tab

## Acceptance Criteria
- [ ] Tasks can be created, tracked, completed, failed, and skipped through QuestEngine methods
- [ ] Active tasks persist across save/load cycles (stored in registry, serialisable)
- [ ] The Objectives Panel renders in UIScene at bottom-centre, showing the tracked task
- [ ] Panel displays correct icon and text for each task type and urgency level
- [ ] Task completion plays the green checkmark animation and chime, then cycles to next task
- [ ] Panel cycles through multiple active tasks on a 5-second rotation
- [ ] Urgent/critical tasks cause a subtle amber pulse on the panel
- [ ] Expanded view opens on click, shows all active tasks in two sections (story + daily)
- [ ] Clicking a task in expanded view pins it as tracked
- [ ] Daily tasks are generated at the start of each new in-game day based on player state
- [ ] Low/no food, overdue bills, missing vitamin D all correctly trigger daily task generation
- [ ] End-of-day evaluation: urgent/critical unfinished tasks apply XP penalty; optional tasks silently expire
- [ ] New dialogue effect type `"mission"` correctly assigns a Story Mission via QuestEngine
- [ ] `checkCompletionConditions` auto-completes tasks when relevant game events fire
- [ ] Expanded view can be dismissed with Escape or clicking outside
- [ ] "No tasks right now — explore!" shown when no active tasks exist

## Testing Requirements
- **Unit tests for QuestEngine:** Add/complete/fail/skip tasks; verify state transitions, XP rewards/penalties, event emissions
- **Unit tests for completion conditions:** Each condition type tested with matching and non-matching event data
- **Unit tests for DailyTaskGenerator:** Given various registry states (empty inventory, overdue bills, low health, etc.), verify correct tasks are generated with correct urgency
- **Unit tests for end-of-day evaluation:** Verify critical tasks penalise, optional tasks silently expire, all daily tasks clear
- **Unit tests for task cycling and priority sort:** Given a mix of task types and urgencies, verify correct display order
- **Integration test:** Assign a Story Mission via dialogue effect, perform the completion action, verify auto-completion fires and panel updates
- **Integration test with DayCycleEngine:** Advance to a new day, verify DailyTaskGenerator runs and Objectives Panel populates
- **UI test:** Verify Objectives Panel renders at correct position, text is truncated if too long, expanded view opens/closes
- **Edge cases:** No tasks active (shows explore prompt); many simultaneous tasks (verify cycling doesn't break); task completed while expanded view is open
- **Coverage target:** ≥85% for QuestEngine, DailyTaskGenerator, and Objectives Panel rendering logic
