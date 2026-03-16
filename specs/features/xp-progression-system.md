# 🎯 Feature Design Document: XP & Progression System

## 1. Feature Overview

### Feature Name
**Life Adaptation Score (XP) & Progression System**

### Purpose
The XP system is the heartbeat of Denmark Survival. It measures how well the player is adapting to Danish life — not as abstract "experience points" but as a tangible **Life Success Meter**. Every decision, action, and interaction feeds into this score, creating a constant feedback loop that makes players feel their growth (or struggle) in real time. The progression system then translates accumulated XP into meaningful level-ups, unlocks, and phase transitions that reshape the gameplay experience.

### Priority
- [x] **Critical** (MVP - Must have)

### Dependencies
- Character Creation (nationality/job set starting modifiers)
- Daily Activity System (activities generate XP events)
- State management (persist XP, level, phase across sessions)

---

## 2. Player-Facing Design

### Player Actions
1. **Earn XP**: Perform activities, make good decisions, succeed at cultural challenges
2. **Lose XP**: Make mistakes, neglect obligations, cultural missteps
3. **View XP Progress**: Check current XP, level progress bar, and phase status via HUD and stats screen
4. **Level Up**: Hit XP milestones to earn level-ups with tangible rewards
5. **Phase Transition**: Cross major XP thresholds to enter new gameplay phases (Newcomer → Adapter → Resident → Local → Honorary Dane)
6. **View XP History**: Review XP gains and losses in daily summary and stats screen

### Visual Design
- **XP Bar (HUD)**: Horizontal progress bar in top-left, showing current XP within current level. Fills left-to-right with a warm golden color. Small level number displayed.
- **XP Gain Notification**: Floating text "+10 XP" in green/gold that drifts upward from where the action happened, with a subtle sparkle particle effect
- **XP Loss Notification**: Floating text "-15 XP" in soft red that shakes briefly, with a small dark cloud puff
- **Level Up**: Full-screen celebration moment — warm golden glow, congratulatory text, unlock preview. Danish flag confetti particles. Lasts 3-4 seconds. Non-skippable first time, skippable after.
- **Phase Transition**: Major cinematic moment — screen transitions to a "milestone card" showing the new phase name, a motivational quote, and a preview of what's now unlocked. Feels like turning a page in a book.
- **XP History Graph**: Simple line graph on stats screen showing XP over time (by day). Upward trends feel great; dips show where player struggled.

### Audio Design
- **Sound Effects**:
  - XP gain: Bright, satisfying chime (pitch scales with amount — bigger gain = higher pitch)
  - XP loss: Soft, low "womp" sound (not punishing, more "oops")
  - Level up: Triumphant fanfare — short but celebratory
  - Phase transition: Grand musical swell, new phase's theme previewed
- **Music**: No music change for regular XP events; level-up interrupts with fanfare; phase transitions trigger theme change
- **Audio Cues**: Subtle warning tone when XP approaches 0 (danger zone)

### Player Feedback
- **Immediate Feedback**: XP bar updates in real-time as XP changes
- **Visual Feedback**: XP bar pulses green on gain, flashes red briefly on loss
- **Audio Feedback**: Distinct sounds for gain vs loss; volume/pitch scales with magnitude
- **Delayed Feedback**: Daily summary screen shows full breakdown of day's XP changes with net result

---

## 3. Rules & Mechanics

### Core Rules

**XP Calculation:**
- XP is a single cumulative integer starting at 0
- XP can go negative (minimum -100 before game over warning)
- XP gains and losses are immediate upon triggering action
- Some XP modifiers are passive (e.g., +10/day for maintaining vitamin D streak)

**Level System:**
- 20 levels total across 4 gameplay phases
- XP required per level increases gradually
- Level-ups grant specific rewards and unlock content

**Phase System:**
- Phases represent major gameplay milestones, not just stat thresholds
- Each phase changes how the world reacts to the player
- Phase transitions are one-way — you don't regress to a lower phase (but XP can still drop)

**Skill XP (Separate):**
- 4 soft skills (Language, Cycling, Cultural Navigation, Bureaucracy)
- Each skill has 5 levels, improved through practice
- Skill improvements are tracked separately from main XP
- Skills affect efficiency of related activities and unlock new options

**Adaptive Difficulty Modifier:**
- If player's XP drops below 50 for 3+ consecutive days, game enters "assist mode": +25% XP gains, -25% XP losses
- If player maintains XP above 2000 for 5+ consecutive days, game introduces harder scenarios
- Player can manually adjust XP multiplier in settings (0.5x to 2.0x loss multiplier)

### Variables & Values

**XP Thresholds by Level:**

| Level | Total XP Required | Phase | Key Unlock |
|-------|-------------------|-------|------------|
| 1 | 0 | Newcomer | Starting areas |
| 2 | 50 | Newcomer | Metro access |
| 3 | 120 | Newcomer | Grocery stores |
| 4 | 200 | Newcomer | Basic social venues |
| 5 | 300 | Newcomer | Language school |
| 6 | 500 | Adapter | Bike customization |
| 7 | 700 | Adapter | Advanced dialogue |
| 8 | 950 | Adapter | Side activities |
| 9 | 1200 | Adapter | Shop discounts |
| 10 | 1500 | Adapter | Nørrebro district |
| 11 | 1900 | Resident | "Help others" quests |
| 12 | 2300 | Resident | Complex scenarios |
| 13 | 2700 | Resident | Relationship deepening |
| 14 | 3000 | Resident | Vesterbro / Christianshavn |
| 15 | 3400 | Resident | Optional content |
| 16 | 3800 | Local | XP losses -50% |
| 17 | 4200 | Local | Expert challenges |
| 18 | 4600 | Local | Secret locations |
| 19 | 5000 | Local | Best endings available |
| 20 | 5500 | Honorary Dane | Integration Certificate |

**XP Gain Values by Category:**

| Activity | XP Gain | Category |
|----------|---------|----------|
| Bike ride without incident | +10 | Transportation |
| Navigate intersection correctly | +15 | Transportation |
| Use bike lights at night | +5 | Transportation |
| Check in/out metro correctly | +10 | Transportation |
| Successful Danish conversation | +20 | Cultural |
| Respond to cultural cues | +30 | Cultural |
| Participate in tradition correctly | +50 | Cultural |
| Help another newcomer | +25 | Cultural |
| Use Danish phrase correctly | +15 | Cultural |
| Complete grocery shopping | +10 | Daily Life |
| Pay bills on time | +15 | Daily Life |
| File taxes correctly | +30 | Daily Life |
| Work duties completed | +20 | Daily Life |
| Good health habits maintained | +10 | Daily Life |
| Positive NPC impression | +15 | Social |
| Accept fika/coffee invitation | +10 | Social |
| Friendship milestone | +40 | Social |
| Navigate faux pas gracefully | +20 | Social |

**XP Loss Values by Category:**

| Situation | XP Loss | Category |
|-----------|---------|----------|
| Forget vitamin D | -10 | Health |
| Skip meals | -5 | Health |
| Not dressed warmly | -10 | Health |
| Ignore mental health | -15 | Health |
| Oversleep/miss obligations | -25 | Health |
| Bike without lights | -20 | Transport |
| Forget metro check-in | -30 | Transport |
| Caught without ticket | -50 | Transport |
| Bike wrong side | -15 | Transport |
| Cause bike accident | -40 | Transport |
| Cultural faux pas | -30 | Cultural |
| Disrespect quiet hours | -15 | Cultural |
| Inappropriate public behavior | -25 | Cultural |
| Insult customs (unintentional) | -20 | Cultural |
| Major bureaucratic mistake | -50 | Cultural |
| Late bill payment | -20 | Financial |
| Tax filing error | -100 | Financial |
| Overspend | -15 | Financial |
| Forget mandatory insurance | -50 | Financial |

**Skill Level Thresholds:**

| Skill | Level 1 | Level 2 | Level 3 | Level 4 | Level 5 |
|-------|---------|---------|---------|---------|---------|
| Language | 0 | 50 uses | 150 uses | 300 uses | 500 uses |
| Cycling | 0 | 20 rides | 60 rides | 120 rides | 200 rides |
| Cultural Nav | 0 | 30 correct | 80 correct | 160 correct | 280 correct |
| Bureaucracy | 0 | 10 tasks | 25 tasks | 50 tasks | 80 tasks |

*"Uses", "rides", "correct", and "tasks" refer to successful completions of related activities.*

### Edge Cases & Special Situations
- **XP below -100 for 3 days**: Trigger soft game over — "Perhaps Denmark isn't for everyone" ending with option to restart from checkpoint or adjust difficulty
- **XP exactly at threshold**: Level up triggers immediately (not "next action")
- **Multiple XP events same frame**: All are applied and all notifications shown (staggered vertically)
- **Phase transition during dialogue**: Queued until dialogue completes; triggered on next scene transition
- **XP gain while at max level (20)**: XP still accumulates for display/records but no further levels
- **Skill affinity from job**: Gains for that skill are multiplied by 1.25 (25% bonus)
- **Nationality cultural familiarity**: "High" = XP losses reduced 15% in first 7 days; "Low" = tutorial is more explicit but XP values unchanged

### Balancing Goals
- **Never feel punishing**: XP losses should feel like "oops, I'll do better" not "the game hates me." Losses are always smaller than potential gains in the same category except for egregious mistakes (tax errors).
- **Growth should feel tangible**: Each level should unlock something noticeable within 1-2 play sessions
- **Soft skills are earned, not granted**: Skills improve through doing, reinforcing the "learn by living" theme
- **Catch-up mechanic**: Players who struggle early should be able to recover. Adaptive difficulty ensures no one gets permanently stuck.
- **Phase transitions are celebrations**: Moving to a new phase should feel like a major life milestone — because it IS one in the game's narrative

---

## 4. Game Feel & Polish

### Desired Feel
- **Satisfying accumulation**: Like watching a savings account grow — every little gain matters
- **Gentle consequences**: Losses sting enough to learn from but not enough to rage-quit
- **Milestone joy**: Level-ups and phase transitions should feel genuinely rewarding
- **Transparency**: Player always understands WHY their XP changed

### Juice Elements
- [ ] XP bar has a liquid fill animation (not instant snap)
- [ ] Large XP gains trigger screen-edge golden glow
- [ ] Level-up has confetti particles in Danish flag colors (red/white)
- [ ] Phase transitions have unique transition animations
- [ ] XP gain sounds layer when multiple gains happen rapidly
- [ ] Daily summary screen has satisfying "tally up" animation (numbers counting up)
- [ ] Negative XP events have subtle screen shake (very mild — this is cozy, not intense)
- [ ] Skill level-up has a distinct "mastery" sound + icon upgrade animation

### Input Handling
- **No direct input**: XP changes happen as consequences of other actions — player doesn't "press button to gain XP"
- **Notification dismissal**: XP notifications auto-dismiss after 2 seconds; no input needed
- **Stats screen**: Accessible via Tab key or pause menu at any time

---

## 5. Progression & Unlocking

### When Available
- XP tracking begins immediately after character creation (Day 1)
- First XP event typically occurs within first 2 minutes of gameplay

### How to Unlock
- Always active; cannot be disabled

### Tutorial / Introduction
- **First Encounter**: First XP gain happens during the "arriving at apartment" scene when player interacts with Lars (the neighbor) — "+15 XP: Met your helpful neighbor!"
- **Tutorial Method**: Show — the first XP gain triggers a brief tooltip: "You earned Life Adaptation Points! Keep making good decisions to thrive in Denmark." First XP loss triggers: "Oops! Don't worry — mistakes help you learn. Check your daily summary to see what happened."
- **Learning Curve**: Within first in-game day, player should understand: actions → XP changes → progress. Deeper understanding (skills, phases) develops over first week.

---

## 6. Integration with Other Systems

### Related Features
- **Character Creation**: Sets starting modifiers (nationality familiarity, job skill affinity)
- **Daily Activity System**: Primary source of XP events
- **Transportation System**: Biking/metro activities generate XP
- **Dialogue & NPC System**: Conversation outcomes affect XP and social skill
- **Random Encounter System**: Encounters generate XP events
- **Inventory & Economy**: Financial decisions affect XP (bills, spending)
- **Encyclopedia**: Unlocked entries correlate with cultural fluency progression
- **Day Cycle**: Daily summary aggregates XP; some XP is passive (streaks)

### System Dependencies
- UI system (HUD bar, notifications, stats screen)
- Audio system (gain/loss/level-up sounds)
- Animation system (notifications, level-up celebration)
- State management (persist XP, level, skills)
- Save system (XP is critical save data)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] XP starts at 0 after character creation
- [ ] XP increases and decreases correctly based on defined values
- [ ] Level-ups trigger at correct XP thresholds
- [ ] Phase transitions occur at correct level ranges
- [ ] 4 soft skills track progress independently
- [ ] Skill levels advance based on usage counts
- [ ] Job skill affinity applies 25% bonus correctly
- [ ] Nationality familiarity modifier applies in first 7 days
- [ ] Adaptive difficulty activates at defined XP thresholds
- [ ] XP persists across save/load
- [ ] Daily summary correctly sums gains and losses
- [ ] Game over warning triggers at -100 XP for 3 days

### Experience Requirements
- [ ] Player understands what caused each XP change (clear source attribution)
- [ ] Level-ups feel rewarding and motivating
- [ ] Phase transitions feel like major accomplishments
- [ ] XP losses feel educational, not punishing
- [ ] Player can easily check their progress at any time

### Performance Requirements
- [ ] XP notifications render at 60 FPS with no stutter
- [ ] Multiple simultaneous XP events don't cause frame drops
- [ ] Stats screen loads within 1 second

### Polish Requirements
- [ ] XP bar has smooth fill animation
- [ ] Level-up celebration plays fully without glitches
- [ ] Phase transition sequence is cinematic and polished
- [ ] All XP sounds play at correct pitch scaling

---

## 8. Testing & Validation

### Playtesting Goals
- Is the XP gain/loss ratio balanced? (Players should generally trend upward but with dips)
- Do players understand why they gained/lost XP?
- Do level-ups feel spaced appropriately? (Not too frequent, not too rare)
- Is the phase transition impactful or does it feel arbitrary?
- Does the adaptive difficulty kick in at the right time?
- Are any XP exploits possible (e.g., repeating easy tasks infinitely)?

### Success Metrics
- Average player reaches Level 5 within 1-2 hours of play
- 70%+ of players reach "Adapter" phase (Level 6+)
- 50%+ of players reach "Resident" phase (Level 11+)
- Less than 10% of players trigger the game-over condition
- Players accurately self-report "I understood why my XP changed" 85%+ of the time

---

## 9. Examples & References

### Similar Features in Other Games
- **Stardew Valley (Friendship/Skills)**: Hidden stats that improve through actions. Skills level up through use. **What they did well**: Transparent systems, satisfying feedback, no punishment for low stats.
- **Persona 5 (Social Stats)**: Multiple social stats that gate content and conversation options. **What they did well**: Stats feel meaningful and open new possibilities; clear UI feedback.
- **Animal Crossing (Island Rating)**: A holistic "life quality" measure that rewards engagement. **What they did well**: The rating feels personal and organic, not mechanical.
- **Papers, Please (Score)**: End-of-day summary showing performance. **What they did well**: Clear cause-and-effect between actions and score, emotional weight to mistakes.

### Inspiration
- Immigration milestone metaphors — CPR number, first Danish friend, filing taxes — these real-life milestones map perfectly to level-up moments
- Language learning apps (Duolingo) — XP streaks, daily goals, satisfying sound design for progress
- Fitness trackers — the satisfaction of watching numbers go up through daily effort

### Iteration History
- **v1**: Initial design — single XP number, 6 phases, 4 skills, adaptive difficulty

---

## Implementation Notes (For Developers)

*Note: This section is for reference only.*

### Suggested Approach
- XP values and thresholds should be data-driven (JSON config) for easy tuning
- XP events should be emitted through a central event system, not hardcoded per scene
- Registry changedata events drive HUD updates reactively
- Skills should be tracked as usage counters, not direct XP

### Performance Considerations
- XP notifications should be pooled (reuse objects, don't create/destroy)
- Daily summary calculation should run once at end-of-day, not continuously

### Platform Concerns
- XP notifications should be readable at all supported resolutions
- Consider smaller notification text on mobile (future)
