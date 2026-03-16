# Task 012: XP & Level Progression Engine

## Description
Implement the XP (Life Adaptation Score) engine that tracks player experience, calculates level thresholds, manages the 4 progression phases, tracks soft skill advancement, and handles level-up events. This is the core scoring system that every other feature interacts with.

## Dependencies
- Task 003: State Management Foundation (XP, level, skills in registry, StateHelpers)
- Task 007: UI Framework (XP bar in HUD, level-up notification)
- Task 009: Audio System (XP gain/loss/level-up sounds)

## Technical Requirements

### XP Engine (`src/systems/XPEngine.js`)
Central module for all XP operations:

**XP Operations:**
- `grantXP(registry, amount, source, category)` — Add XP, log source, check for level-up
- `penalizeXP(registry, amount, source, category)` — Remove XP, log source, check for game-over threshold
- Both emit `XP_CHANGED` event with: amount, newTotal, source, category

**Level Calculation:**
- Level determined by total XP using threshold table:

| Level Range | Phase | XP Range |
|-------------|-------|----------|
| 1-5 | Newcomer | 0 - 499 |
| 6-10 | Adapter | 500 - 1499 |
| 11-15 | Resident | 1500 - 2999 |
| 16-20 | Local | 3000 - 4999 |
| 20 (max) | Honorary Dane | 5000+ |

- Specific XP thresholds per level within each phase (distributed evenly within range)
- On level-up: emit `LEVEL_UP` event with new level, new phase, unlocks

**Phase Transitions:**
- Phase changes at levels 6, 11, 16, and at 5000 XP
- Phase change triggers: notification, potential new area unlocks, NPC dialogue changes
- Phase stored in registry (`CURRENT_PHASE`)

**XP Categories:**
Track XP gained/lost by category for analytics and day summary:
- Transportation
- Cultural Integration
- Daily Life Management
- Social Connections
- Health
- Financial

**Adaptive Difficulty:**
- If player has negative XP for 3+ consecutive days: increase helpful encounter rate, provide hints
- If player maintains high XP (top 20% of level range): introduce harder scenarios
- Difficulty modifier stored in registry

**Game Over Threshold:**
- If XP drops below -100 and stays negative for 3 consecutive days: trigger "struggling" warning
- Warning gives player guidance and reduces XP losses temporarily
- True game over only at sustained extreme failure (configurable, default: -500 XP)

### Soft Skill System (`src/systems/SkillSystem.js`)
Tracks 4 soft skills that improve through practice:

**Skills (0-100, mapped to 5 levels):**

| Skill | Level Thresholds | Improved By |
|-------|-----------------|-------------|
| Language | 0-19, 20-39, 40-59, 60-79, 80-100 | Dialogue choices, language encounters |
| Cycling | 0-19, 20-39, 40-59, 60-79, 80-100 | Successful bike rides, cycling encounters |
| Cultural Navigation | 0-19, 20-39, 40-59, 60-79, 80-100 | Cultural activities, correct social behavior |
| Bureaucracy | 0-19, 20-39, 40-59, 60-79, 80-100 | Filing forms, completing admin tasks |

**Skill Functions:**
- `getSkillLevel(registry, skillKey)` — Return 1-5 level from 0-100 value
- `incrementSkill(registry, skillKey, amount)` — Add to skill value, emit event on level change
- `checkSkillRequirement(registry, skillKey, requiredLevel)` — Check if skill meets threshold
- Skill level affects: available dialogue options, encounter outcomes, activity success rates

### XP Log (`src/systems/XPLog.js`)
Track XP changes for the daily summary screen:
- Array of entries per day: `{ amount, source, category, timestamp }`
- Positive and negative entries stored separately
- Calculate daily net XP
- Calculate per-category totals
- Clear log on day advance (archive to completed day log for summary)

### Level-Up Rewards
When player levels up, determine and grant rewards:
- Area unlocks (defined per level in data file)
- Activity unlocks
- Efficiency bonuses at higher levels (activities take less time)
- XP loss reduction at levels 16+ (50% reduction)

## Acceptance Criteria
- [ ] XP is correctly granted and penalized with proper clamping
- [ ] Level correctly calculates from XP using threshold table
- [ ] Level-up event fires exactly when XP crosses a threshold
- [ ] Phase transitions fire at correct level boundaries
- [ ] Soft skills increment and skill level (1-5) derives correctly from value (0-100)
- [ ] XP log tracks all changes with source and category
- [ ] Day summary can retrieve per-category XP breakdown
- [ ] Adaptive difficulty modifier adjusts based on sustained performance
- [ ] Game-over warning triggers at sustained negative XP
- [ ] XP changes trigger HUD updates via registry events
- [ ] Level-up notification appears with level and phase info
- [ ] XP loss reduction applies at level 16+
- [ ] Audio plays on XP gain and XP loss events

## Testing Requirements
- **Unit Test**: Level calculation for every threshold boundary (test each of the 20 levels)
- **Unit Test**: Phase transitions at levels 6, 11, 16, and 5000 XP
- **Unit Test**: `grantXP()` fires `XP_CHANGED` and `LEVEL_UP` events correctly
- **Unit Test**: `penalizeXP()` respects minimum XP floor
- **Unit Test**: Skill level derivation for all 5 threshold ranges
- **Unit Test**: XP log adds entries and calculates daily totals correctly
- **Unit Test**: XP log per-category breakdown is accurate
- **Unit Test**: Adaptive difficulty triggers after 3 consecutive negative days
- **Unit Test**: XP loss reduction (50%) applies at level 16+
- **Unit Test**: Game-over threshold triggers at configured limit
- **Integration Test**: Grant XP → level up → notification appears → phase updates
- **Integration Test**: XP changes reflected in HUD XP bar
- **Coverage Target**: ≥85% for XPEngine, SkillSystem, XPLog

## References
- FDD: XP & Progression System (complete specification)
- GDD Section 3: Game Mechanics (XP gain/loss tables)
- GDD Section 4: Progression Systems (level phases, skill progression)
