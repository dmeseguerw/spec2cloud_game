# 🎯 Feature Design Document: Daily Activity & Day Cycle System

## 1. Feature Overview

### Feature Name
**Daily Activity Scheduling & Day/Night/Season Cycle**

### Purpose
This is the game's structural backbone. Each in-game day is a unit of gameplay — the player wakes up, plans activities, executes them within time constraints, and sees a summary of results. The day cycle creates natural rhythm and pacing: mornings feel full of possibility, afternoons are productive, evenings are social, and nights are for rest. Seasons change the world's mood, difficulty, and available content. Together, this system delivers on Core Pillar #4 (Strategic Life Management) — players must balance limited time against mandatory obligations, optional opportunities, and their own wellbeing.

### Priority
- [x] **Critical** (MVP - Must have)

### Dependencies
- XP & Progression System (activities generate XP)
- Transportation System (travel time eats into day)
- Character Creation (job determines work schedule)
- State management (track current day, time, season)

---

## 2. Player-Facing Design

### Player Actions
1. **Wake Up**: Day begins in apartment. Player sees morning overview (weather, obligations, optional activities available)
2. **Plan Day**: Choose which activities to pursue from available options (3-5 activity slots per day)
3. **Travel to Activity**: Move to activity location using transport (time consumed)
4. **Execute Activity**: Complete activity (mini-scenario, interaction, or task)
5. **Manage Time**: Monitor remaining time in day; decide whether to fit in one more activity
6. **Return Home / End Day**: Voluntarily end day or automatic end at midnight
7. **Review Day Summary**: See XP gains/losses, notable events, upcoming obligations

### Visual Design
- **Morning Overview**: Apartment interior with window showing weather and time of day. Notification panel shows: today's weather, mandatory obligations (highlighted red), optional activities (highlighted blue), and calendar reminders
- **Time Indicator (HUD)**: Clock icon in top-left showing current time of day with 4 states: Morning (sunrise icon, warm yellow), Afternoon (sun icon, bright), Evening (sunset icon, orange), Night (moon icon, dark blue)
- **Season Visuals**: Environment art shifts with seasons — spring flowers appear, summer is bright and lush, autumn has falling leaves and warm tones, winter has snow, shorter daylight, darker palette
- **Day Counter**: "Day 14 — Tuesday" displayed near clock
- **Activity Slots**: Visual representation of day's planned activities (3-5 cards/slots)
- **Day Summary Screen**: Parchment-style card showing: activities completed, XP +/- breakdown, notable events, tomorrow's preview

### Audio Design
- **Morning**: Alarm clock sound (gentle), birdsong, coffee brewing ambient
- **Time transitions**: Soft chime when moving from morning to afternoon, afternoon to evening, etc.
- **Season ambient**: Spring birds, summer cicadas/outdoor chatter, autumn wind, winter quiet + indoor coziness
- **Day Summary**: Calm, reflective music sting while reviewing the day
- **Obligation warning**: Subtle alert sound for upcoming missed obligations

### Player Feedback
- **Time pressure (gentle)**: Clock icon subtly pulses when evening approaches and player has unfinished obligations
- **Activity completion**: Satisfying checkmark animation + XP gain notification
- **Missed obligation**: End-of-day summary highlights missed mandatory items in soft red
- **Perfect day (no XP loss)**: Special "Perfect Day!" badge on summary with extra sparkle

---

## 3. Rules & Mechanics

### Core Rules

**Day Structure:**
- Each day has 4 time periods: Morning (06:00-12:00), Afternoon (12:00-17:00), Evening (17:00-22:00), Night (22:00-06:00)
- Most activities consume 1 time period (some consume 2)
- Player can do 3-5 activities per day depending on activity lengths
- Night is for rest — going to sleep ends the day
- Staying up past midnight: -10 XP penalty + less energy next day

**Mandatory vs Optional Activities:**

*Mandatory (must complete or face XP loss):*
- Work/Job duties: required on scheduled work days (varies by job, 3-5 days/week)
- Grocery shopping: required when food supply depletes (every 3-5 days)
- Bill payments: required when due date arrives (notification given 2 days prior)
- Health maintenance: vitamin D daily (passive check — did player have vitamin D in inventory?)

*Optional (XP opportunity if completed):*
- Explore new areas
- Social events / NPC interactions
- Language classes (at language school)
- Cultural activities / festivals
- Help other NPCs with tasks

**Time Costs:**

| Activity | Time Periods Used | Notes |
|----------|-------------------|-------|
| Work | 1-2 periods | Depends on job type |
| Grocery shopping | 1 period | Can be combined with errands |
| Bill payment | 0.5 period | Quick task at home or municipality |
| Social event | 1 period | Usually evening |
| Language class | 1 period | Usually afternoon |
| Explore new area | 1 period | Walking pace; can discover locations |
| Cultural event | 1-2 periods | Special events, festivals |
| Rest/Recover | 1 period | Restores health and mental energy |
| Cooking a meal | 0.5 period | Better than buying food out |

*Travel time is NOT a separate activity — it's included in the activity's time cost, but transport choice affects it: biking is fastest, walking adds extra time (may push activity into next time period).*

**Season Cycle:**
- Season changes every ~22 in-game days (roughly aligned with real seasons)
- **Spring (Days 1-22)**: Moderate weather, unpredictable rain, medium daylight
- **Summer (Days 23-44)**: Long days (sunset at 22:00), warm, outdoor activities available, easier difficulty
- **Autumn (Days 45-66)**: Shortening days (sunset at 17:00), rainy, falling leaves, medium difficulty
- **Winter (Days 67-88)**: Very short days (sunset at 15:30), cold, snow, vitamin D critical, harder difficulty
- Cycle repeats after Day 88

**Weather System:**
- Weather generated daily from season-weighted probability table
- Affects: biking risk, character mood, available activities, visual atmosphere
- Player can check weather in morning overview

### Variables & Values

**Weather Probability by Season:**

| Weather | Spring | Summer | Autumn | Winter |
|---------|--------|--------|--------|--------|
| Sunny | 25% | 40% | 15% | 10% |
| Partly Cloudy | 30% | 30% | 25% | 20% |
| Overcast | 20% | 15% | 25% | 35% |
| Rain | 20% | 10% | 30% | 15% |
| Snow | 0% | 0% | 0% | 15% |
| Storm | 5% | 5% | 5% | 5% |

**Weather Effects:**

| Weather | Biking Risk Mod | Mood Mod | Special |
|---------|----------------|----------|---------|
| Sunny | 0% | +5 happiness | Outdoor activities available |
| Partly Cloudy | 0% | 0 | Normal |
| Overcast | 0% | -2 happiness | Vitamin D even more important |
| Rain | +5% bike accident | -5 happiness | Need umbrella/rain gear |
| Snow | +8% bike accident | -3 happiness | Dress warmly or -10 XP |
| Storm | Biking disabled | -10 happiness | Must walk or use transit |

**Sunset Times by Season:**

| Season | Sunset Time | Bike lights required |
|--------|-------------|---------------------|
| Spring | 20:00 | After 20:00 |
| Summer | 22:00 | After 22:00 |
| Autumn | 17:00 | After 17:00 |
| Winter | 15:30 | After 15:30 |

**Day Counter & Chapter Progression:**

| Day Range | Chapter | Phase |
|-----------|---------|-------|
| 1-14 | Chapter 1: Arrival | Newcomer |
| 15-45 | Chapter 2: Settling In | Adapter |
| 46-90 | Chapter 3: Integration | Resident/Local |
| 91+ | Endgame: Honorary Dane | Local/Honorary |

### Edge Cases & Special Situations
- **Player doesn't go home to sleep**: After midnight, character auto-walks home. Next day starts with fatigue penalty (-15 health, -10 mental energy)
- **All time periods used but obligations missed**: XP penalty applied at day end in summary
- **Festival/Special event day**: One optional activity is pre-scheduled (player can skip or attend)
- **Sick day**: If health drops below 20, player is forced to stay home and rest. Day has limited activities (phone calls, reading)
- **Weekend vs Weekday**: Weekends have no work obligations, more social events available
- **Weather changes mid-day**: Rare — 10% chance weather shifts after morning. Adds unpredictability.

### Balancing Goals
- **Planning should feel strategic, not stressful**: Player has enough time to complete obligations + 1-2 optional activities per day
- **Missing one thing shouldn't be catastrophic**: A missed vitamin D or late departure is a small XP dip, not a disaster
- **Seasons should change the game's feel**: Winter should feel harder and cozier; summer should feel freeing
- **Time should create interesting tradeoffs**: "Do I bike (save time) or walk (safer in rain)?"

---

## 4. Game Feel & Polish

### Desired Feel
- **Mornings feel full of possibility** — "What adventure will today bring?"
- **Evenings feel winding down** — social, reflective, cozy
- **Day summaries feel like a daily journal** — personal, warm, reflective
- **Seasons should emotionally change the game** — winter hygge vs summer freedom
- **Time pressure should be gentle, never panic-inducing** — this is cozy, not stressful

### Juice Elements
- [ ] Morning light gradually brightens apartment window
- [ ] Clock icon gently animates between time periods (sun arcs across, moon rises)
- [ ] Season transitions have a brief cinematic — leaves changing, first snowfall, spring bloom
- [ ] Day summary has a handwritten journal aesthetic
- [ ] "Perfect Day" badge sparkles and earns bonus +5 XP
- [ ] Weather transitions show gradual cloud movement or rain starting
- [ ] Calendar page flip animation between days

### Input Handling
- **Day planning**: Mouse click or keyboard to select activities from menu
- **End day manually**: Can end day early from pause menu ("Go to Sleep")
- **Day summary**: Space/Enter to progress through summary, or click "Next Day"

---

## 5. Progression & Unlocking

### When Available
- Day 1 begins immediately after character creation
- Full day planning unlocked Day 2 (Day 1 is guided tutorial day with Lars)

### How to Unlock
- Always active after character creation
- New activities unlock as player levels up and discovers areas

### Tutorial / Introduction
- **Day 1**: Heavily guided — Lars walks player through apartment, shows morning routine, takes them on first bike ride, introduces one activity. Day ends early with summary.
- **Day 2**: Soft guided — morning overview shown with explanation tooltips. Player makes first planning choices with gentle hints.
- **Day 3+**: Training wheels off — full day planning, no hand-holding.
- **First season change**: Narrative moment — NPC comments on changing weather, provides seasonal tips

---

## 6. Integration with Other Systems

### Related Features
- **XP & Progression**: Activities are the primary XP source; day summary aggregates gains/losses
- **Transportation**: Travel is how player reaches activities; transport mode choice affects available time
- **Dialogue & NPC System**: Social activities involve NPC interactions; NPCs may have time-limited availability
- **Random Encounters**: 2-4 encounters per day, triggered during activities or travel
- **Inventory & Economy**: Shopping, bill payments, and item management are activities; vitamin D is passive inventory check
- **Encyclopedia**: Cultural activities may unlock encyclopedia entries

### System Dependencies
- Clock/timer system (tracking time of day)
- Calendar system (day counting, season tracking)
- Weather generator (daily weather from probability tables)
- UI system (morning overview, day summary, HUD clock)
- State management (persist current day, time, season, weather)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] Days advance correctly from Day 1 onward
- [ ] 4 time periods per day (morning, afternoon, evening, night)
- [ ] Activities consume correct number of time periods
- [ ] Mandatory activities are tracked and XP penalties applied if missed
- [ ] Optional activities are available based on player level and unlocked areas
- [ ] Morning overview displays weather, obligations, and options
- [ ] Day summary correctly aggregates all XP changes
- [ ] Weather generates according to season probability tables
- [ ] Season changes every ~22 days
- [ ] Sunset time adjusts by season
- [ ] Work schedule varies by job type
- [ ] Weekend/weekday logic works correctly
- [ ] Day state persists across save/load

### Experience Requirements
- [ ] Player feels agency in planning their day
- [ ] Time pressure feels strategic, not stressful
- [ ] Day summary feels like a satisfying journal entry
- [ ] Season changes noticeably alter the game's mood and difficulty
- [ ] Players look forward to each new day

### Performance Requirements
- [ ] Morning overview loads within 1 second
- [ ] Day summary screen loads within 1 second
- [ ] Season transition cinematic runs at 60 FPS
- [ ] Weather effects don't degrade game performance

### Polish Requirements
- [ ] Morning light animation is smooth
- [ ] Season transitions have visual cinematics
- [ ] Day summary has handwritten/journal feel
- [ ] Clock icon smoothly transitions between time periods

---

## 8. Testing & Validation

### Playtesting Goals
- Do players engage with day planning or just rush through?
- Do players feel time pressure is appropriate (strategic, not stressful)?
- Do season changes feel impactful?
- Do players understand which activities are mandatory?
- Is the morning overview useful or overwhelming?

### Success Metrics
- 80%+ of players engage with morning planning by Day 5
- Less than 20% of players frequently miss mandatory activities after tutorial
- Players report season changes as "noticeable" 70%+ of the time
- Average session covers 2-4 in-game days (matching target session lengths)

---

## 9. Examples & References

### Similar Features in Other Games
- **Persona 5 (Calendar System)**: Daily schedule with mandatory and optional activities. Time management is core gameplay. **What they did well**: Each day felt meaningful; calendar created anticipation for events.
- **Stardew Valley (Day Cycle)**: Days have time limits, seasons change every 28 days, weather affects activities. **What they did well**: Simple rhythm that's satisfying over hundreds of hours. Gentle time pressure.
- **Animal Crossing (Real-Time Seasons)**: Seasons change world appearance and available content. **What they did well**: Seasonal transformations feel magical and worth experiencing.
- **The Sims (Life Management)**: Balancing needs (energy, social, fun) across a daily schedule. **What they did well**: Juggling priorities creates emergent stories.

### Inspiration
- Real Danish work-life balance culture — leaving work at 16:00, family time, hygge evenings
- Copenhagen seasons — the dramatic light shift between summer and winter
- Danish planner culture — calendars, schedules, "fredagshygge" (Friday coziness)
- Nordic winter coping strategies — candles, warm drinks, vitamin D, friluftsliv

### Iteration History
- **v1**: Initial design — 4 time periods, season cycle, weather system, day planning

---

## Implementation Notes (For Developers)

### Suggested Approach
- Day planning could be a dedicated scene (DayPlanningScene) or an overlay on the apartment scene
- Activities should be data-driven (JSON) for easy addition of new content
- Weather and season can be simple state variables in the registry
- Day summary is a standalone scene with animated tally

### Performance Considerations
- Season transition cinematics should preload assets
- Weather particle effects should use object pooling

### Platform Concerns
- Morning overview needs to be readable on various screen sizes
- Day planning touch controls (future): tap activity cards, swipe to reorder
