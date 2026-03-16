# Task 017: NPC Data & Relationship System

## Description
Implement the NPC data model, relationship tracking system, and NPC world presence. This covers the 10 main NPCs with their profiles, starting relationships, relationship stages (Stranger → Close Friend), NPC memory of past interactions, and NPC placement/scheduling in the game world. The dialogue engine is in a separate task (018) — this task focuses on WHO the NPCs are and HOW relationships are tracked.

## Dependencies
- Task 003: State Management Foundation (NPC relationships in registry)
- Task 008: Player Entity & World Movement (NPCs placed in world)
- Task 012: XP & Level Progression (relationship changes affect XP)

## Technical Requirements

### NPC Data Model (`src/data/npcs.json`)
Define all NPCs as structured data:

**NPC Schema:**
- `id` — Unique string identifier
- `name` — Display name
- `role` — Brief role description
- `personality` — Personality traits
- `location` — Primary location in game world (scene/zone)
- `schedule` — When/where NPC can be found (time of day → location mapping)
- `startingRelationship` — Initial relationship value (0-100)
- `portraitKey` — Asset key for NPC portrait sprite
- `spriteKey` — Asset key for NPC world sprite
- `arc` — Description of character arc (for dialogue writers)

**10 Main NPCs (from FDD):**

| NPC | Starting Rel. | Location | Role |
|-----|--------------|----------|------|
| Lars (Helpful Neighbor) | 40 | Apartment area | Tutorial guide, friend |
| Sofie (Fellow Expat) | 35 | Various | Support buddy |
| Henrik (Co-Worker) | 25 | Workplace | Work mentor |
| Mette (Grocery Clerk) | 30 | Grocery store | Regular interaction |
| Kasper (Cyclist) | 15 | Streets/bike areas | Cycling mentor |
| Dr. Jensen (GP) | 20 | Medical area | Health advisor |
| Bjørn (Municipal Worker) | 10 | Municipal building | Bureaucracy guide |
| Freja (Social Butterfly) | 30 | Social venues | Social connector |
| Thomas (The Skeptic) | 10 | Various | Challenge NPC |
| Emma (Student) | 25 | Language school/café | Language partner |

### Relationship System (`src/systems/RelationshipSystem.js`)
Manages NPC relationships:

**Relationship Scale (0-100):**

| Range | Stage | NPC Behavior |
|-------|-------|-------------|
| 0-19 | Stranger | Minimal interaction, formal dialogue |
| 20-39 | Acquaintance | Friendly but distant, share basic info |
| 40-59 | Friendly | Warm, offer help, share stories |
| 60-79 | Friend | Close, invite to events, confide |
| 80-100 | Close Friend | Deep bond, unlock special content/quests |

**Functions:**
- `getRelationship(registry, npcId)` — Get current relationship value
- `changeRelationship(registry, npcId, delta, reason)` — Modify relationship, clamp 0-100, emit event
- `getRelationshipStage(registry, npcId)` — Get current stage (Stranger/Acquaintance/Friendly/Friend/Close Friend)
- `checkStageTransition(registry, npcId)` — Detect if relationship crossed a stage boundary, emit transition event
- `getAvailableNPCsAtLocation(registry, location, timeOfDay)` — Return NPCs present at given location/time

**Relationship XP Impact:**
- Stage transition up: +40 XP (building friendship milestone)
- Positive interaction: +15 XP (positive impression)
- Negative interaction: based on severity (-5 to -20 XP)

### NPC Memory System (`src/systems/NPCMemory.js`)
Track things NPCs remember about the player:

- `recordInteraction(registry, npcId, interactionType, outcome)` — Log an interaction
- `getInteractionHistory(registry, npcId)` — Get past interactions with NPC
- `hasMetNPC(registry, npcId)` — Check if player has ever spoken to NPC
- `getLastInteraction(registry, npcId)` — Most recent interaction

**Memory affects:**
- NPCs reference past conversations ("Last time you mentioned...")
- NPCs react to player's reputation (high cultural skill → respectful)
- Thomas (skeptic) warms up based on player's consistent effort
- Mette comments on language skill progress

### NPC Schedule System
NPCs appear at different locations based on time of day:
- **Morning**: NPCs at work locations (Henrik at office, Mette at store)
- **Afternoon**: Some NPCs shift locations (Kasper on streets cycling)
- **Evening**: NPCs at social locations (Freja at café, Lars at apartment area)
- **Night**: Most NPCs unavailable (except emergency NPCs)

**Schedule Data Structure:**
```
schedule: {
  morning: "workplace",
  afternoon: "streets",
  evening: "café",
  night: null  // unavailable
}
```

### NPC World Presence
- NPCs appear as sprites at their scheduled location
- Interaction indicator shows when player is in range
- NPCs have idle animations (standing, sitting, walking patrol)
- NPC availability respects day cycle

## Acceptance Criteria
- [ ] All 10 main NPCs defined with complete data profiles
- [ ] Starting relationships match FDD specification
- [ ] Relationship changes correctly through `changeRelationship()`
- [ ] Relationship stages derive correctly from value ranges
- [ ] Stage transitions emit events and grant XP
- [ ] NPC memory records interactions and retrieves history
- [ ] NPCs appear at correct locations based on schedule and time of day
- [ ] NPCs unavailable when not scheduled
- [ ] Interaction indicators show for nearby NPCs
- [ ] NPC relationship data persists across save/load
- [ ] `getAvailableNPCsAtLocation()` returns correct NPCs for given time/place

## Testing Requirements
- **Unit Test**: All 10 NPC data objects pass schema validation
- **Unit Test**: Relationship starts at correct values per NPC
- **Unit Test**: `changeRelationship()` clamps between 0 and 100
- **Unit Test**: Stage derivation correct for all 5 ranges
- **Unit Test**: Stage transition detected when crossing boundaries
- **Unit Test**: NPC memory records and retrieves interactions
- **Unit Test**: Schedule system returns correct NPCs for each time period
- **Unit Test**: NPCs return null/unavailable during night if not scheduled
- **Integration Test**: Change relationship → stage transition → XP granted → event emitted
- **Integration Test**: Walk near NPC at scheduled time → indicator appears → interact triggers
- **Integration Test**: NPC memory persists across save/load/scene changes
- **Coverage Target**: ≥85% for RelationshipSystem, NPCMemory, schedule logic

## References
- FDD: Dialogue & NPC System (NPC profiles, relationship stages, memory)
- GDD Section 5: Content & Scope (10 main NPCs with descriptions)
- GDD Section 3: Game Mechanics (social XP values)
