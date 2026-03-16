# Task 013: Day Cycle & Season Management

**GitHub Issue:** [#28 - Task 013: Day Cycle & Season Management](https://github.com/dmeseguerw/spec2cloud_game/issues/28)
**GitHub PR:** [#30 - [WIP] Implement day/night cycle and season management](https://github.com/dmeseguerw/spec2cloud_game/pull/30)

## Description
Implement the day/night cycle, time-of-day progression, season rotation, and weather system that drive the game's temporal mechanics. Each in-game day has 4 time periods with a limited number of activities. Seasons cycle every ~22 days and affect weather probabilities, sunset times, and difficulty. This system is the heartbeat of the game — everything revolves around the daily cycle.

## Dependencies
- Task 003: State Management Foundation (time, season, day in registry)
- Task 007: UI Framework (time/day/weather display in HUD)
- Task 012: XP & Level Progression (daily XP tracking, day-end triggers)

## Technical Requirements

### DayCycleEngine (`src/systems/DayCycleEngine.js`)
Manages the flow of time through each in-game day:

**Time Periods:**
- Morning (7:00-12:00)
- Afternoon (12:00-17:00)
- Evening (17:00-22:00)
- Night (22:00-7:00)

**Activity Slots:**
- Player can complete 3-5 activities per day (configurable)
- Each activity consumes time and advances the period when slots are used
- Some activities span multiple time slots (e.g., work takes morning + afternoon)
- Remaining slots shown in HUD (e.g., "2 activities left today")

**Day Lifecycle:**
1. **Morning Overview**: Show what's planned/required today (mandatory activities, bills due, etc.)
2. **Activity Phase**: Player navigates world, completes activities, encounters random events
3. **Day End Trigger**: After final activity slot or when player chooses to "End Day"
4. **Day Summary**: Transition to DaySummaryScene with XP log
5. **Next Day**: Advance day counter, check for season change, generate new encounters

**Mandatory vs Optional Activities:**
- Mandatory activities are flagged and must be completed regularly:
  - Work (2-3 times/week based on job schedule)
  - Grocery shopping (when food runs out)
  - Bill payments (on due dates)
  - Vitamin D (daily)
- Skipping mandatory activities incurs XP penalties
- Optional activities provide XP bonuses

### SeasonEngine (`src/systems/SeasonEngine.js`)
Manages seasonal progression:

**Season Cycle:**
- Each season lasts ~22 in-game days
- Cycle: Spring → Summer → Fall → Winter → Spring...
- Season change triggers weather shift, visual changes, and new encounters

**Season Properties:**

| Season | Duration | Sunset Time | Difficulty | Mood |
|--------|----------|-------------|------------|------|
| Spring | 22 days | 20:00 | Medium | Hopeful |
| Summer | 22 days | 22:00 | Easy | Bright |
| Fall | 22 days | 17:00 | Medium | Cozy |
| Winter | 22 days | 15:30 | Hard | Dark |

**Season Transitions:**
- Emit `SEASON_CHANGED` event
- Trigger season-specific encyclopedia entries
- Adjust weather probability tables
- Update visual ambiance (could be handled by polish task)

### WeatherSystem (`src/systems/WeatherSystem.js`)
Generates daily weather based on season:

**Weather Types:**
- Sunny, Cloudy, Rainy, Windy, Snowy (winter only), Foggy

**Weather Probability per Season:**

| Weather | Spring | Summer | Fall | Winter |
|---------|--------|--------|------|--------|
| Sunny | 30% | 45% | 20% | 10% |
| Cloudy | 25% | 20% | 30% | 30% |
| Rainy | 25% | 15% | 30% | 20% |
| Windy | 15% | 10% | 15% | 20% |
| Snowy | 0% | 0% | 0% | 15% |
| Foggy | 5% | 10% | 5% | 5% |

**Weather Effects:**
- Weather stored in registry; displayed in HUD
- Weather affects transportation (rain: bike accident risk up, biking XP bonus)
- Weather affects encounters (weather-specific encounters filter)
- Weather affects required clothing (going out in cold underdressed = -XP)
- Sunset time affects bike light requirement

### Morning Overview Screen
Simple informational screen at the start of each day:
- Current day number and season
- Today's weather with icon
- Mandatory activities due today
- Any bills due today
- Number of activity slots available
- "Start Day" button to begin

### End-of-Day Logic
When the day ends:
- Check for unfulfilled mandatory activities → apply XP penalties
- Check for spoiled food → remove from inventory
- Calculate daily net XP
- Advance day counter
- Check season transition
- Generate next day's weather
- Trigger DaySummaryScene

## Acceptance Criteria
- [ ] Day progresses through 4 time periods correctly
- [ ] Activity slot counter decrements when activities are completed
- [ ] Activities cannot be started when no slots remain
- [ ] Morning overview shows correct information for the current day
- [ ] Mandatory activities are flagged and tracked
- [ ] Skipping mandatory activities triggers correct XP penalty
- [ ] Season changes every ~22 days
- [ ] Weather generates according to season probability tables
- [ ] Weather type is displayed correctly in HUD
- [ ] Sunset time updates per season
- [ ] End-of-day processes run correctly (penalties, spoilage, day advance)
- [ ] Season change emits event and updates registry
- [ ] "End Day" option is available to player
- [ ] Day counter persists across save/load

## Testing Requirements
- **Unit Test**: Time period advances correctly (morning → afternoon → evening → night)
- **Unit Test**: Activity slot counter decrements and reaches zero
- **Unit Test**: Mandatory activity tracking detects missed activities
- **Unit Test**: Season transition triggers at correct day boundaries
- **Unit Test**: Weather generation produces valid weather and respects probabilities (statistical test over many iterations)
- **Unit Test**: Sunset time returns correct value per season
- **Unit Test**: End-of-day logic applies all penalties and advances correctly
- **Unit Test**: Food spoilage check removes correct items
- **Integration Test**: Full day cycle: morning overview → activities → end day → summary → next day
- **Integration Test**: Season transitions update weather probabilities
- **Integration Test**: Weather affects HUD display
- **Coverage Target**: ≥85% for DayCycleEngine, SeasonEngine, WeatherSystem

## References
- FDD: Daily Activity & Day Cycle (complete specification)
- FDD: Inventory & Economy (food spoilage, bill due dates)
- FDD: Transportation (weather affects biking)
- FDD: Random Encounters (weather-filtered encounters)
- GDD Section 3: Game Mechanics (daily activity system)
- GDD Section 4: Progression (seasonal difficulty changes)
