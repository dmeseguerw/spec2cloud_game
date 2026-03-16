# Task 011: Character Creation System

## Description
Implement the CharacterCreationScene — a 3-step wizard where players choose their character's name, nationality, and job. Each choice affects starting stats, skills, and DKK. The "no wrong choice" design ensures all options are viable. On completion, the system initializes game state and transitions to gameplay.

## Dependencies
- Task 003: State Management Foundation (initializeNewGame with character data)
- Task 004: Scene Framework (scene transitions to GameScene)
- Task 007: UI Framework (buttons, panels, HTML overlay for form)
- Task 009: Audio System (selection sounds, background music)

## Technical Requirements

### CharacterCreationScene (`src/scenes/CharacterCreationScene.js`)
A multi-step wizard using HTML overlay (per ADR 0005):

**Step 1 — Name & Identity:**
- Text input for player name (1-20 characters, sanitize input)
- Character avatar preview (placeholder sprite or simple visual)
- "Next" button to proceed

**Step 2 — Nationality Selection:**
- Grid/list of 12 nationalities to choose from
- Each nationality displays:
  - Flag icon and country name
  - Cultural familiarity modifier (how familiar with Scandinavian culture)
  - Starting skill bonus description
- Selecting a nationality highlights it with visual feedback
- "Back" and "Next" buttons

**Nationality Data (from FDD):**

| Nationality | Cultural Familiarity | Skill Bonus |
|-------------|---------------------|-------------|
| American | Low | +5 Bureaucracy |
| British | Low-Medium | +5 Language |
| German | Medium | +10 Cycling |
| Swedish | High | +15 Cultural |
| Norwegian | High | +15 Language |
| Dutch | Medium-High | +10 Cycling |
| French | Medium | +5 Cultural |
| Spanish | Low | +5 Social (happiness) |
| Italian | Low | +5 Social (happiness) |
| Polish | Medium | +10 Bureaucracy |
| Turkish | Low | +5 Cultural |
| Indian | Low | +5 Bureaucracy |

**Step 3 — Job Selection:**
- Grid/list of 8 jobs to choose from
- Each job displays:
  - Job title and icon
  - Monthly salary (DKK)
  - Work schedule description
  - Skill affinity
- Selecting a job highlights it

**Job Data (from FDD + Economy FDD):**

| Job | Monthly Salary | Schedule | Skill Affinity |
|-----|---------------|----------|----------------|
| IT Professional | 35,000 DKK | Mon-Fri 9-17 | Bureaucracy |
| Teacher | 30,000 DKK | Mon-Fri 8-16 | Language |
| Student | 6,500 DKK (SU) | Flexible | Language |
| Chef | 27,000 DKK | Variable shifts | Cultural |
| Nurse | 32,000 DKK | Shift work | Social |
| Researcher | 38,000 DKK | Mon-Fri 9-17 | Bureaucracy |
| Artist | 20,000 DKK | Flexible | Cultural |
| Engineer | 40,000 DKK | Mon-Fri 8-17 | Cycling |

**Confirmation Screen:**
- Summary of all choices (name, nationality, job)
- Starting stats overview (XP: 0, Level: 1, DKK: first month salary, skill bonuses)
- "Start Game" button and "Go Back" button
- Brief flavor text about arriving in Denmark

### State Initialization
On "Start Game" confirmation:
- Call `StateManager.initializeNewGame()` with character data
- Set all starting values (XP: 0, Level: 1, Day: 1, Chapter: 1, Phase: Newcomer)
- Apply nationality skill bonuses
- Set starting DKK based on job salary (first month)
- Set starting inventory (basic items: phone, wallet, apartment key)
- Set starting NPC relationships (all at starting values per FDD)
- Transition to GameScene with fade effect

### Input Validation
- Name: Required, 1-20 characters, strip HTML tags and special characters
- Nationality: Must select one
- Job: Must select one
- Cannot proceed to next step without completing current step

## Acceptance Criteria
- [ ] 3-step wizard flows correctly: Name → Nationality → Job → Confirm
- [ ] "Back" button returns to previous step with selections preserved
- [ ] All 12 nationalities display with correct data
- [ ] All 8 jobs display with correct salary and schedule
- [ ] Nationality skill bonuses are applied to starting state
- [ ] Starting DKK matches selected job's salary
- [ ] Name validation prevents empty names and strips dangerous characters
- [ ] Confirmation screen shows all chosen values correctly
- [ ] "Start Game" initializes complete game state via StateManager
- [ ] Transition to GameScene occurs with fade effect after confirmation
- [ ] Character creation data persists (included in save game)
- [ ] Visual design is clean and approachable (not overwhelming)

## Testing Requirements
- **Unit Test**: Name validation accepts valid names (1-20 chars) and rejects invalid ones
- **Unit Test**: Name sanitization strips HTML/script tags
- **Unit Test**: All 12 nationality data objects have required fields (name, familiarity, bonus)
- **Unit Test**: All 8 job data objects have required fields (title, salary, schedule, affinity)
- **Unit Test**: State initialization sets correct defaults for each nationality/job combination
- **Unit Test**: Skill bonuses are applied correctly to starting values
- **Unit Test**: Starting DKK matches job salary
- **Integration Test**: Full wizard flow: enter name → select nationality → select job → confirm → GameScene starts
- **Integration Test**: Going back preserves previous selections
- **Integration Test**: Game state after creation matches expected defaults
- **E2E Test**: Complete character creation and verify all registry values
- **Coverage Target**: ≥85% for CharacterCreationScene and character data modules

## References
- FDD: Character Creation (full specification — wizard steps, nationality table, job table)
- ADR 0004: State Management (initializeNewGame function)
- ADR 0005: UI Framework (HTML overlay for form inputs)
- GDD Section 5: Content & Scope (replay value from different starting backgrounds)
