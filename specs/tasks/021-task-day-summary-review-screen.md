# Task 021: Day Summary & Review Screen

## Description
Implement the DaySummaryScene that displays at the end of each in-game day. It shows a breakdown of XP gained and lost, activities completed, notable events, net XP change, and a preview of tomorrow's obligations. This is the player's daily "report card" that reinforces learning and provides a satisfying end-of-day rhythm.

## Dependencies
- Task 004: Scene Framework (DaySummaryScene transition)
- Task 007: UI Framework (progress bars, panels, text, animations)
- Task 009: Audio System (summary music, XP tally sounds)
- Task 012: XP & Level Progression (XP log, level display)
- Task 013: Day Cycle (end-of-day trigger, next day info)

## Technical Requirements

### DaySummaryScene (`src/scenes/DaySummaryScene.js`)
Full-screen scene displayed at end of each day:

**Layout Sections:**

**1. Day Header:**
- "Day X Summary" title
- Season and weather icon for the day
- Current level and phase indicator

**2. Activities Completed:**
- List of activities performed (with icons)
- Check marks for completed mandatory activities
- "X" marks for missed mandatory activities
- Activity count: "Completed 4 of 5 activities"

**3. XP Breakdown:**
- Two columns: Gains (green) and Losses (red)
- Each entry: source description + XP amount
- Entries organized by category (Transportation, Cultural, Daily Life, Social, Financial)
- Category subtotals
- Running tally animation (numbers count up/down)

**4. Net XP Change:**
- Large, prominent display: "+47 XP" (green) or "-12 XP" (red)
- Current total XP with progress bar to next level
- If level-up occurred: celebratory display

**5. Notable Events:**
- List of significant things that happened:
  - New NPC met
  - Relationship milestone
  - Encyclopedia entries discovered
  - Random encounter outcomes
  - Bills paid/missed
- Each with a small icon and brief description

**6. Tomorrow Preview:**
- Mandatory activities due tomorrow
- Bills due tomorrow
- Weather forecast for tomorrow
- Remaining activity slots

**7. Actions:**
- "Continue" button → advance to next day (morning overview)
- "Save & Quit" button → save game and return to main menu

### XP Tally Animation
- XP entries appear one by one with a brief delay
- Positive entries: green text + plus sign + positive chime
- Negative entries: red text + minus sign + negative tone
- After all entries: net total animates (counts from 0 to net value)
- Progress bar fills/depletes smoothly to new XP position
- If level-up: pause for celebration animation + level-up sound

### Level-Up Display
When a level-up occurs on this day:
- Special celebration: confetti or sparkle effect
- "Level Up! Level X — [Phase Name]" displayed prominently
- List of unlocks gained at this level (new areas, abilities, etc.)
- Brief fanfare sound

### Summary Data Collection
The DaySummaryScene receives data from:
- XPLog: daily entries categorized
- DayCycleEngine: activities completed, mandatory activity status
- EncounterEngine: encounter outcomes for the day
- EncyclopediaManager: entries discovered today
- RelationshipSystem: relationship changes today
- BillManager: bills paid/missed today

### Season Transition
If the day marks a season change:
- Special section: "Season Change: Winter → Spring!"
- New season visual effect
- Upcoming season description

## Acceptance Criteria
- [ ] DaySummaryScene displays at end of each in-game day
- [ ] Activities section shows completed/missed activities accurately
- [ ] XP breakdown shows all gains and losses categorized correctly
- [ ] Net XP change displays with correct sign and color
- [ ] XP tally animation plays entries sequentially
- [ ] Progress bar animates to new XP position
- [ ] Level-up celebration displays when threshold crossed
- [ ] Notable events list captures all significant actions
- [ ] Tomorrow preview shows correct upcoming obligations
- [ ] "Continue" advances to next day morning overview
- [ ] "Save & Quit" saves and returns to main menu
- [ ] Season transition displays when applicable
- [ ] All data sourced from correct systems (no hardcoded values)

## Testing Requirements
- **Unit Test**: XP breakdown correctly categorizes gains vs losses
- **Unit Test**: Net XP calculation matches sum of gains minus losses
- **Unit Test**: Activity completion status accurately reflects mandatory/completed
- **Unit Test**: Level-up detection triggers on correct XP threshold
- **Unit Test**: Tomorrow preview pulls correct data for next day
- **Unit Test**: Season transition detection at correct day boundaries
- **Integration Test**: Complete a day with mixed XP events → summary shows correct breakdown
- **Integration Test**: Level up during day → summary shows level-up celebration
- **Integration Test**: Continue button advances to next day's morning overview
- **Integration Test**: Save & Quit writes save and returns to MenuScene
- **Manual Test**: XP tally animation timing feels satisfying
- **Manual Test**: Visual layout is clear and readable
- **Coverage Target**: ≥85% for summary data compilation and display logic

## References
- FDD: XP & Progression System (daily XP tracking, level thresholds)
- FDD: Daily Activity & Day Cycle (day end flow, morning overview)
- GDD Section 2: Player Experience (session-to-session gameplay loop)
- GDD Section 6: UI & Controls (Daily Summary screen)
