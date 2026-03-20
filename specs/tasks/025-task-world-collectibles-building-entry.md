# Task 025: World-Collectible Items & Building Entry System

**GitHub Issue:** [#59 - Task 025: World-Collectible Items & Building Entry System](https://github.com/dmeseguerw/spec2cloud_game/issues/59)
**GitHub PR:** [#60 - [WIP] Implement world-collectible items and building entry system](https://github.com/dmeseguerw/spec2cloud_game/pull/60)

## Description
Implement two foundational interaction mechanics that are currently missing from the game: **picking up items from the game world** and **entering buildings through door interactions**. These are physical-world interactions that the player performs with the E key, extending the existing interaction system from Task 008. Currently, items can only be acquired through shop purchases or dialogue rewards — there is no way to pick up objects lying in the world. Similarly, while Task 008 defined a generic `enter` interaction type and Task 016 references "player enters shop," the actual door-entry mechanism (door sprite, visual indicator, scene transition to building interior) has never been specified.

These mechanics are prerequisites for the First Day Onboarding (Task 028), where the player must pick up a pant bottle from the street and enter Netto through its front door.

## Dependencies
- Task 008: Player Entity & World Movement (interaction system, `INTERACT_RANGE`, E-key handling, `_interactables` array)
- Task 015: Inventory Management System (`InventoryManager.addItem`, item data model)
- Task 016: Economy & Financial System (ShopSystem, ShopScene — building entry triggers the shop scene)
- Task 007: UI Framework & HUD System (context hint text, notification toasts)
- Task 009: Audio System Foundation (pickup/door sounds)

## Technical Requirements

### World-Collectible Item System

#### Collectible Data Model
Define world-spawned items as data objects placed in the game world. Each collectible needs:
- `id` — Unique instance identifier (e.g., `"pant_bottle_1"`)
- `itemId` — Reference to an item in `items.json` (e.g., `"beer"` for an empty beer bottle with `pantValue > 0`)
- `x`, `y` — World position (pixel coordinates)
- `quantity` — How many of this item the collectible represents (default: 1)
- `spriteKey` — Asset key for the world sprite
- `sparkle` — Boolean flag for whether to show the sparkle particle effect (default: true for collectibles)
- `tooltip` — Optional first-pickup tooltip text (cultural flavour, e.g., "Pant bottle — return at any shop for 1-3 DKK")
- `oneTime` — If true, the collectible is removed permanently after pickup; if false, it may regenerate

#### Collectible Spawn Rules
- Collectibles are defined per-zone or per-day. A daily collectible manifest specifies which items appear and where.
- On day start, the collectible manifest is evaluated and sprites are placed in the world.
- Collectibles that have been picked up (tracked via a `COLLECTED_ITEMS` registry key — a Set of instance IDs) are not re-placed.
- The manifest can be static (authored placements for Day 1) or dynamic (random placement from a pool for subsequent days).
- Maximum collectibles visible in any zone at one time: 5 (prevent visual clutter).

#### Pickup Interaction Flow
1. Player walks within `INTERACT_RANGE` (64px) of a collectible sprite.
2. The context hint updates: `"Press E — Pick up [Item Name]"`.
3. Player presses E.
4. The collectible sprite plays a brief "collected" animation (float up and fade out, ~0.5 seconds).
5. A category-specific pickup sound plays (metallic clink for pant bottles, paper rustle for documents, soft pop for general items).
6. `InventoryManager.addItem()` is called with the appropriate `itemId` and `quantity`.
7. If the item has a `tooltip` and this is the first time this item type has been collected, show a notification toast with the tooltip text (auto-dismiss after 4 seconds).
8. The collectible's instance ID is added to `COLLECTED_ITEMS` in the registry.
9. The sprite is destroyed from the scene.
10. An XP event is emitted for the pickup (small amount: +1 to +5 XP depending on item value).

#### Integration with Existing Interaction System
- Collectibles are registered in the `_interactables` array in GameScene with `type: 'pickup'`.
- The existing `_updateInteraction()` method already finds the nearest interactable within range — collectibles participate in this system identically to NPCs.
- The existing context hint mechanism (setting `CONTEXT_HINT` in the registry, read by UIScene) is used for the "Press E — Pick up..." text.

### Building Entry System

#### Door Data Model
Define enterable buildings as interactable door objects in the game world. Each door needs:
- `id` — Unique door identifier (e.g., `"netto_door"`)
- `x`, `y` — World position (pixel coordinates of the door sprite)
- `spriteKey` — Asset key for the door sprite (or the building's door region)
- `targetScene` — The scene to launch when the player enters (e.g., `"ShopScene"` with shop data, or a future `"ApartmentScene"`)
- `targetData` — Data object passed to the target scene's `init()` method (e.g., `{ shopId: "netto" }`)
- `label` — Display name for the context hint (e.g., `"Netto"`)
- `openCondition` — Optional condition function or data object that determines whether the door can be entered (e.g., shop hours check)
- `closedMessage` — Text shown when the door cannot be entered (e.g., `"Netto is closed — opens at 7:00"`)

#### Door Visual Indicator
- Each door has a small glowing frame indicator sprite (green when open, amber when closed).
- The indicator is a child sprite overlaid on the door position, slightly transparent, with a slow pulsing animation (subtle, not distracting).
- The indicator is only visible when the player is within 2× `INTERACT_RANGE` (128px) — it fades in as the player approaches and fades out when distant.
- When a door is closed (condition unmet), the indicator colour shifts to amber and the pulse stops.

#### Entry Interaction Flow
1. Player walks within `INTERACT_RANGE` (64px) of a door interactable.
2. If the door's `openCondition` is met (or there's no condition):
   - Context hint: `"Press E — Enter [label]"` (green text).
3. If the door's `openCondition` is NOT met:
   - Context hint: `"[closedMessage]"` (amber text, no "Press E" prompt).
4. Player presses E (only works if condition met).
5. A brief door-open sound plays.
6. The current scene launches the `targetScene` as an overlay (or transitions to it, depending on scene type), passing `targetData`.
7. When the target scene closes (player exits the shop/building), control returns to GameScene.
8. A door-close sound plays on return.

#### Integration with Existing Systems
- Doors are registered in the `_interactables` array in GameScene with `type: 'door'`.
- The ShopScene from Task 016 is the primary door target — it receives `{ shopId }` in its `init()` data and displays the corresponding shop from `shops.json`.
- Future building interiors (apartment, language school, workplace) can reuse this same door system with different target scenes.
- The open/closed condition for shops checks current time-of-day against the shop's `openHours` from `shops.json`.

### New Registry Keys
Add the following to `RegistryKeys.js`:
- `COLLECTED_ITEMS` — A Set (or serialized array) of collectible instance IDs that have been picked up (prevents re-pickup of one-time items)
- `WORLD_COLLECTIBLES` — The current day's active collectible manifest (what's placed in the world)

### New Asset Requirements
- Collectible sparkle particle effect (small, looping, positioned above collectible sprites)
- Door indicator sprite (green glow frame + amber variant)
- Pickup sound effects: metallic clink (pant), paper rustle (documents), soft pop (general)
- Door open/close sound effects

## Acceptance Criteria
- [ ] Collectible items can be placed in the game world at defined positions with visible sprites
- [ ] Collectibles within 2× interaction range show a sparkle particle effect
- [ ] Walking within interaction range of a collectible updates the context hint to "Press E — Pick up [name]"
- [ ] Pressing E on a collectible: plays pickup animation + sound, adds item to inventory, removes sprite, records in COLLECTED_ITEMS
- [ ] First-time pickup of a new item type shows a tooltip notification with flavour text
- [ ] Collected one-time items do not reappear on subsequent days
- [ ] Door interactables can be placed in the game world with visual frame indicators
- [ ] Door indicators are green when open, amber when closed, and only visible within proximity
- [ ] Walking within interaction range of an open door shows "Press E — Enter [name]"
- [ ] Walking within interaction range of a closed door shows the closed message (no E prompt)
- [ ] Pressing E on an open door plays a door sound and launches the target scene with correct data
- [ ] Exiting a building scene returns the player to GameScene at the same position
- [ ] Shop doors correctly check opening hours against current time-of-day

## Testing Requirements
- **Unit tests for collectible spawn logic:** Given a collectible manifest and a set of already-collected IDs, verify correct sprites are placed
- **Unit tests for pickup flow:** Verify `addItem` is called with correct data, sprite is removed, COLLECTED_ITEMS is updated, XP event is emitted
- **Unit tests for door condition checking:** Given various times-of-day and shop hours, verify open/closed state is correct
- **Unit tests for door entry:** Verify target scene is launched with correct data when E is pressed on an open door
- **Integration test:** Place a collectible and a door in a test GameScene, walk the player to each, press E, and verify the full flow (inventory change, scene launch)
- **Edge case:** Attempt to pick up a collectible when inventory is theoretically full (for pant bottles: at 10 max)
- **Edge case:** Attempt to enter a closed door — verify no scene transition occurs
- **Coverage target:** ≥85% for all new modules
