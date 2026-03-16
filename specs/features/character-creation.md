# 🎯 Feature Design Document: Character Creation System

## 1. Feature Overview

### Feature Name
**Character Creation & Onboarding Wizard**

### Purpose
This is the player's first interaction with the game. It establishes who they are in the world of Denmark Survival — their name, nationality, and profession. These choices shape the entire experience: starting stats, dialogue options, cultural advantages/disadvantages, and narrative tone. The character creation must immediately communicate the game's cozy, approachable atmosphere while setting up meaningful choices that affect gameplay.

### Priority
- [x] **Critical** (MVP - Must have)

### Dependencies
- Main Menu system (to navigate into character creation)
- State management (to persist character choices)
- Asset loading (character sprite variations)

---

## 2. Player-Facing Design

### Player Actions
1. **Enter Name**: Type a display name for the character (1-20 characters)
2. **Select Nationality**: Choose from 10+ nationality backgrounds, each with a brief flavor description and gameplay modifier preview
3. **Select Job**: Choose from 8+ professions, each with a brief description and gameplay modifier preview
4. **Preview Character**: See a summary of selected options with starting stat modifiers before confirming
5. **Confirm & Begin**: Finalize choices and enter the game world

### Visual Design
- **Visual Style**: Clean, warm interface with a cozy Danish-inspired backdrop (e.g., soft illustration of Copenhagen harbor at sunset). Should feel like opening a new chapter of a book — inviting and exciting.
- **Animations**: 
  - Nationality flags gently wave when hovered
  - Job icons animate (e.g., stethoscope pulse, laptop screen glow)
  - Transition between steps uses a smooth page-turn or slide effect
  - Character preview assembles piece by piece as selections are made
- **Visual Effects**: Soft particle effect (snowflakes or leaves depending on season) in background
- **UI Elements**: Multi-step wizard (3 steps + confirmation), progress indicator at top, back/next navigation

### Audio Design
- **Sound Effects**: 
  - Soft click on selection
  - Satisfying "lock in" sound when confirming a choice
  - Page turn / whoosh on step transitions
- **Music**: "Arrival" theme — curious, slightly anxious, hopeful piano melody
- **Audio Cues**: Distinct sound when hovering over a nationality or job (subtle cultural hint — e.g., soft accordion for France, sitar note for India)

### Player Feedback
- **Immediate Feedback**: Selected option highlights with warm glow border, unselected options dim slightly
- **Visual Feedback**: Character preview updates live as selections change; stat modifier previews animate in/out
- **Audio Feedback**: Gentle confirmation chime on each step completion
- **Haptic Feedback**: N/A (browser-based)

---

## 3. Rules & Mechanics

### Core Rules

**Name Entry:**
- 1-20 characters, alphanumeric and common special characters (accents, hyphens)
- Default placeholder name: "Alex" (gender-neutral)
- Name appears in dialogue, save files, and HUD

**Nationality Selection:**
Each nationality provides:
- A **cultural familiarity bonus** (how similar the home culture is to Denmark)
- A **starting skill modifier** (small boost or penalty to one skill)
- **Unique flavor text** and occasional unique dialogue options

**Job Selection:**
Each job provides:
- A **starting salary** (affects initial DKK balance)
- A **work schedule pattern** (how many days per week required)
- A **skill affinity** (one skill improves slightly faster)
- **Job-specific scenarios** (unique workplace events)

### Variables & Values

**Nationality Options & Modifiers:**

| Nationality | Cultural Familiarity | Skill Modifier | Starting Flavor |
|-------------|---------------------|----------------|-----------------|
| American (USA) | Low | +5 Social Reputation | Outgoing but culturally distant |
| British (UK) | Medium | +5 Language | English fluency helps, but Danish is different |
| German | High | +10 Bureaucracy | Familiar with structured systems |
| French | Medium | +5 Cultural Fluency | Appreciate European culture, different customs |
| Spanish | Low | +5 Social Reputation | Warm culture meets reserved Denmark |
| Indian | Low | +5 Bureaucracy | Experienced with complex systems |
| Brazilian | Low | +10 Social Reputation | Social warmth vs Danish reserve |
| Japanese | Medium | +5 Cultural Fluency | Respect for rules and order |
| Turkish | Low | +5 Cultural Fluency | Bridge between cultures |
| Polish | High | +10 Cycling | Familiar with Northern European life |
| Italian | Medium | +5 Social Reputation | Social but different customs |
| Nigerian | Low | +5 Language | English-speaking, culturally distant |

*Note: Cultural familiarity affects how forgiving early encounters are. High = fewer penalties in first week. Low = more tutorial guidance offered.*

**Job Options & Modifiers:**

| Job | Starting DKK | Work Days/Week | Skill Affinity | Unique Scenarios |
|-----|-------------|----------------|----------------|------------------|
| Tech Worker | 8,000 | 5 | Bureaucracy +faster | Office culture, stand-ups, remote work |
| Student | 4,000 | 3 (classes) | Language +faster | University life, study groups, SU grants |
| Healthcare Worker | 7,000 | 4 | Cultural Fluency +faster | Hospital culture, patient interactions |
| Service Industry | 5,000 | 5 | Social Reputation +faster | Customer interactions, tips culture |
| Academic/Researcher | 7,500 | 4 | Language +faster | University politics, grant applications |
| Freelancer | 6,000 | Flexible | Bureaucracy +faster | Tax complexity, invoicing, hustle |
| Teacher | 6,500 | 5 | Language +faster | Classroom culture, parent meetings |
| Startup Founder | 3,000 | 6 | Social Reputation +faster | Investor pitches, Danish business culture |

*Note: Starting DKK sets initial money. Work Days/Week determines mandatory work obligations. Skill affinity means that skill's XP gains are 25% higher.*

### Edge Cases & Special Situations
- **Empty name**: Cannot proceed; gentle prompt "What should we call you?"
- **Very long name**: Truncated in HUD display with "..." but full name shown in stats
- **Re-selection**: Player can go back to any previous step and change without penalty
- **Skipped step**: Cannot skip; each step must have a selection before "Next" activates

### Balancing Goals
- **No wrong choice**: Every nationality and job should be viable and fun. No combination should feel punishing.
- **Meaningful but not deterministic**: Choices affect early game feel and flavor, but don't lock out content. A Brazilian tech worker and a German student should both be able to reach "Honorary Dane."
- **Replay incentive**: Different starting positions should feel noticeably different in the first 2-3 hours, encouraging multiple playthroughs.

---

## 4. Game Feel & Polish

### Desired Feel
- **Exciting and personal** — "This is MY story in Denmark"
- **Low pressure** — No timer, no wrong answers, no stress
- **Informative** — Each option teaches something (previewing the game's tone)
- **Warm** — The cozy atmosphere starts here, not after character creation

### Juice Elements
- [ ] Hover animations on nationality flags and job icons
- [ ] Character preview assembles with satisfying snaps
- [ ] Background scene subtly shifts with nationality choice (time of day hint)
- [ ] Confirmation screen has a brief "boarding pass" or "welcome letter" visual
- [ ] Stat modifiers appear with a gentle bounce animation
- [ ] Final confirmation triggers a "welcome to Denmark" moment — plane landing, ferry arriving, or train pulling into Copenhagen

### Input Handling
- **Keyboard navigation**: Tab through options, Enter to confirm, Escape to go back
- **Mouse**: Click to select, hover for previews
- **Touch (future)**: Tap to select, swipe between steps

---

## 5. Progression & Unlocking

### When Available
- Immediately upon selecting "New Game" from main menu

### How to Unlock
- Always available; no prerequisites

### Tutorial / Introduction
- **First Encounter**: First screen after clicking "New Game"
- **Tutorial Method**: The character creation IS the tutorial introduction — each step subtly teaches the player about game mechanics (e.g., "Your nationality affects how familiar Danish customs feel" teaches that cultural knowledge matters)
- **Learning Curve**: Should take 2-5 minutes to complete, encouraging exploration of options

---

## 6. Integration with Other Systems

### Related Features
- **XP & Progression System**: Nationality and job define starting modifiers and skill affinities
- **Dialogue & NPC System**: Nationality unlocks unique dialogue lines; NPCs reference player's background
- **Daily Activity System**: Job determines work schedule and mandatory activities
- **Inventory & Economy**: Job determines starting DKK balance
- **Random Encounter System**: Some encounters vary based on nationality (e.g., "Oh, you're from Brazil? Do you miss the weather?")

### System Dependencies
- Input system (text entry, selection)
- UI system (wizard layout, navigation)
- Audio system (music, SFX)
- State management (persist choices)
- Animation system (transitions, previews)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] Player can enter a name (1-20 characters)
- [ ] Player can select from 10+ nationalities with visible descriptions
- [ ] Player can select from 8+ jobs with visible descriptions
- [ ] Player can review all selections on a confirmation screen
- [ ] Player can navigate back to change any selection
- [ ] Selections are persisted to game state on confirmation
- [ ] Starting DKK, skill modifiers, and work schedule are correctly applied
- [ ] Game transitions to first gameplay scene (apartment) upon confirmation

### Experience Requirements
- [ ] Player feels excited about their choices, not stressed
- [ ] Each nationality/job option feels distinct and interesting
- [ ] The process takes 2-5 minutes for a thoughtful player
- [ ] Player understands that choices affect gameplay (but aren't punishing)

### Performance Requirements
- [ ] All transitions run at 60 FPS
- [ ] No noticeable lag when switching between options
- [ ] Assets for character creation load within 2 seconds

### Polish Requirements
- [ ] All selections have hover and active states
- [ ] Transitions between steps feel smooth
- [ ] Background music plays without interruption
- [ ] Character preview updates fluidly

---

## 8. Testing & Validation

### Playtesting Goals
- Do players read the descriptions or just pick randomly?
- Do players feel any option is clearly "best" or "worst"?
- Do players want to replay with a different combination?
- How long does character creation take on average?
- Do players understand that choices affect gameplay?

### Success Metrics
- 90%+ of players complete character creation without abandoning
- Average time: 2-5 minutes
- 30%+ of players who complete the game try a second playthrough with different choices
- No nationality/job combination dominates playtester selections (healthy distribution)

---

## 9. Examples & References

### Similar Features in Other Games
- **Stardew Valley**: Simple character creation (name, appearance, farm type) that feels personal without being overwhelming. Job choice (farm type) affects early gameplay. **What they did well**: Fast, low-pressure, meaningful but not punishing.
- **Papers, Please**: Nationality assignment creates immediate narrative tension. **What they did well**: Nationality as gameplay mechanic, not just cosmetic.
- **Persona 5**: Character creation doubles as narrative introduction. **What they did well**: Story begins during creation, not after.
- **The Oregon Trail**: Job/profession selection with clear gameplay tradeoffs. **What they did well**: Transparent stat impacts, encourages replay.

### Inspiration
- Danish "welcome letter" aesthetics — the visual design of actual Danish immigration documents (clean, official, but friendly)
- Airplane boarding pass as UI metaphor — "Your journey to Denmark begins"
- IKEA instruction manual simplicity — minimal, clear, functional

### Iteration History
- **v1**: Initial design — 3-step wizard with nationality, job, confirmation

---

## Implementation Notes (For Developers)

*Note: This section is for reference only. Detailed technical implementation decisions should be made by the Game Architect and Game Developer.*

### Suggested Approach
- Character creation can use HTML/DOM overlay (per ADR 0005) for form inputs (text field, dropdown/grid selectors)
- Persist selections to Phaser Registry on confirmation
- Nationality and job data should be data-driven (JSON config) for easy balancing and expansion

### Performance Considerations
- Pre-load character preview sprites during boot scene
- Nationality/job data is small — can be included in main bundle

### Platform Concerns
- Text input on mobile requires virtual keyboard handling (future)
- Ensure nationality grid is scrollable on smaller screens
