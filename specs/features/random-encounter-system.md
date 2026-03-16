# 🎯 Feature Design Document: Random Encounter System

## 1. Feature Overview

### Feature Name
**Random Encounter & Event System**

### Purpose
Random encounters are what make each playthrough of Denmark Survival feel alive and unpredictable. They simulate the serendipity of daily life — the unexpected moments that define the expat experience. A stranger offers a biking tip. It starts raining mid-ride. You find a 20 DKK coin on the sidewalk. These micro-events prevent the game from feeling like a checklist and inject surprise, humor, and teachable moments into every in-game day. They directly support the GDD's unique selling point of "procedurally varied daily scenarios" and high replay value.

### Priority
- [x] **High** (Important for quality experience)

### Dependencies
- Daily Activity System (encounters happen during daily activities)
- XP & Progression System (encounters generate XP events)
- Dialogue System (some encounters involve dialogue)
- Transportation System (transport-specific encounters)
- Day Cycle (time of day and weather influence encounters)

---

## 2. Player-Facing Design

### Player Actions
1. **Witness encounter**: An event pops up during travel or activity — visual notification + pause
2. **Read situation**: Text describes what's happening ("A cyclist ahead drops their scarf...")
3. **Choose response**: Select from 2-3 options (e.g., "Pick up and return", "Ignore", "Keep it")
4. **See outcome**: Immediate result shown (XP gain/loss, item found, NPC reaction)
5. **Continue**: Resume current activity or travel

### Visual Design
- **Encounter Notification**: Popup card that slides in from the side (not blocking full screen). Has a small illustrated icon for the encounter type (bike icon for transport, shopping bag for errands, speech bubble for social, ⚡ for challenge, ⭐ for major)
- **Encounter Card**: Clean panel with: icon, situation description (2-3 sentences), and 2-3 response buttons
- **Outcome Panel**: Brief result text with XP change animation, then auto-dismisses after 3 seconds
- **Background**: Game world dims slightly (50% opacity overlay) when encounter card is displayed — focuses attention without losing context

### Audio Design
- **Encounter trigger**: Soft "ping" sound — attention-getting but not jarring
- **Helpful encounter**: Warm chime when appearing
- **Challenge encounter**: Slightly tense staccato note
- **Major event**: Dramatic-but-short musical sting
- **Outcome sound**: XP gain/loss sound from XP system
- **Dismiss**: Soft whoosh as card slides away

### Player Feedback
- **Immediate Feedback**: Encounter card appears within 0.5 seconds of trigger
- **Visual Feedback**: Response buttons highlight on hover; selected option briefly pulses
- **Audio Feedback**: Choice confirmation click; outcome sound matches result (positive/negative)
- **Learning Feedback**: Some encounters include a cultural tip after resolution: "💡 In Denmark, it's common to return lost items — 85% of dropped wallets are returned!"

---

## 3. Rules & Mechanics

### Core Rules

**Encounter Generation:**
- 2-4 random encounters per in-game day
- Triggered at random during activities or travel (not at predictable moments)
- Encounters are drawn from a pool filtered by: current location, time of day, season, weather, player level, and completed encounters
- No exact repeat of the same encounter within 7 in-game days
- Encounter pool grows as player visits new areas and advances in level
- Some encounters are one-time story events; once resolved, they're removed from pool

**Encounter Categories & Probabilities:**

| Category | Probability | Description |
|----------|-------------|-------------|
| Helpful | 30% | Positive opportunity — gain XP, item, or knowledge |
| Neutral | 40% | Flavor/atmosphere — no major XP impact, world-building |
| Challenge | 25% | Problem to solve — potential XP loss if handled poorly |
| Major Event | 5% | Significant story beat — quest trigger, milestone, or rare opportunity |

**Response Mechanics:**
- Each encounter has 2-3 response options
- Responses have outcomes tagged: XP change, relationship change (if NPC involved), item gain/loss, skill check
- Some responses require skill levels (shown but grayed if unmet)
- "No response" / ignoring is sometimes a valid (but usually suboptimal) choice
- Challenge encounters have a "right" answer that rewards XP and a "wrong" answer that costs XP — but "wrong" answers always teach something

**Contextual Filtering:**
- Transport encounters only trigger while biking/walking/on metro
- Shopping encounters only trigger in or near shops
- Social encounters only trigger in social locations or near NPCs
- Weather-specific encounters only trigger in matching weather
- Season-specific encounters only trigger in matching season

### Variables & Values

**Encounter Examples by Category:**

**Helpful Encounters (30%):**

| Encounter | Location Context | Options | Best Outcome |
|-----------|-----------------|---------|-------------|
| Cyclist offers tip | While biking | Thank them / Ignore | +10 XP, cycling tip |
| Elderly person needs help | Walking, any area | Help / Walk by | +15 XP, +3 rep with area NPCs |
| Free community event flyer | Any public area | Take flyer / Ignore | Unlocks optional activity |
| Found 20 DKK on ground | Walking | Pick up / Leave it | +20 DKK |
| Danish person compliments effort | Social location | Thank in Danish / Thank in English | +20 XP (Danish), +10 XP (English) |
| Neighbor shares leftover food | Apartment area | Accept / Decline | +5 health, +5 happiness |

**Neutral Encounters (40%):**

| Encounter | Location Context | Options | Outcome |
|-----------|-----------------|---------|---------|
| Weather suddenly changes | Outdoors | Observe | Mood/visual change, no XP |
| Street musician playing | City center | Listen / Tip / Walk by | Flavor; tip = -5 DKK |
| Overhear interesting conversation | Any public | Eavesdrop / Move on | Cultural fact learn |
| Shop having sale | Near shops | Check it out / Ignore | Potential savings |
| Beautiful sunset view | Harbor, park | Enjoy / Ignore | +5 happiness |
| See Danish flag on birthday | Neighborhood | Curious / Ignore | Encyclopedia entry on flag tradition |

**Challenge Encounters (25%):**

| Encounter | Location Context | Options | Best / Worst Outcome |
|-----------|-----------------|---------|---------------------|
| Bike flat tire | While biking | Fix (skill check) / Walk to shop | Skill success: +10 XP / Fail: walk + time lost |
| Metro inspector | On metro | Show valid ticket / No ticket | Valid: 0 / Invalid: -50 XP, -500 DKK fine |
| Cultural misunderstanding | Social | Apologize / Explain / Argue | Apologize: -5 XP but +relationship / Argue: -30 XP |
| Unexpected bill arrives | Home | Pay (enough DKK) / Ignore | Pay: -DKK / Ignore: -20 XP later |
| Lost in unfamiliar area | New district | Ask for help / Use map / Wander | Ask: meet NPC / Wander: lose time |
| Rain while biking, no gear | While biking | Continue / Find shelter | Continue: risk accident / Shelter: lose time |
| NPC asks question in Danish | Social | Attempt Danish / Respond English | Danish success: +20 XP / English: +5 XP |

**Major Events (5%):**

| Encounter | Location Context | Options | Outcome |
|-----------|-----------------|---------|---------|
| Job promotion opportunity | Workplace | Accept / Decline | New work scenarios, more DKK |
| Invitation to Danish dinner | Social (high NPC rel) | Accept / Decline | Major cultural event, +50 XP |
| Festival in town | Seasonal | Attend / Skip | Multi-activity special event |
| Fellow newcomer needs help | Any area | Help them / Ignore | New NPC, +25 XP, mentor role |
| Bureaucratic deadline tomorrow! | Home | Prepare / Forget | Prepare: +30 XP / Forget: -50 XP |

### Edge Cases & Special Situations
- **Encounter during timed activity**: Encounter pauses activity timer — player isn't penalized for responding
- **Multiple encounters same day**: Maximum 4 per day enforced; excess encounters queued for next day
- **Encounter requires item player doesn't have**: Alternative options always available; no dead ends
- **Encounter references completed encounter**: Some encounters chain — returning the scarf might lead to meeting the cyclist again later
- **Player at max encounters for day**: No more trigger until next day

### Balancing Goals
- **Encounters should feel surprising, not annoying**: Maximum 4 per day prevents "random event fatigue"
- **Helpful encounters slightly outweigh challenges**: 30% + 40% positive/neutral vs 25% challenge — player should generally feel lucky, not harassed
- **Response clarity**: Player should understand what each option will likely result in (no "gotcha" trick options)
- **Cultural teaching through play**: Every challenge encounter should teach something real about Denmark
- **No "insta-fail" encounters**: Even the worst outcome of any encounter is recoverable within 1-2 days of play

---

## 4. Game Feel & Polish

### Desired Feel
- **Encounters should feel like life happening** — organic, surprising, sometimes funny
- **Helpful encounters should feel like lucky moments** — a warm smile from the universe
- **Challenge encounters should feel educational** — "Oh, I didn't know that about Denmark!"
- **Major events should feel exciting** — "Something big is happening!"

### Juice Elements
- [ ] Encounter cards slide in with a bounce animation
- [ ] Icon for encounter type subtly animates (bike wheel spins, speech bubble pulses)
- [ ] Outcome text fades in with glow effect for positive, shake effect for negative
- [ ] Cultural tip "💡" facts have a lightbulb burst animation
- [ ] Major event cards have a golden border + sparkle
- [ ] Card dismiss animation (slides out, slight rotation like a playing card)

### Input Handling
- **Response selection**: Mouse click on option or number keys (1-3)
- **Skip outcome text**: Space to dismiss early
- **Encounter auto-advance**: If player doesn't respond within 30 seconds, least-impactful option auto-selected (with "You hesitated..." flavor text)
- **No accidental dismissal**: Encounter card requires deliberate click, not just space bar

---

## 5. Progression & Unlocking

### When Available
- Day 2 onward (Day 1 is scripted tutorial — no random encounters)
- Encounter pool grows with player level and discovered areas

### How to Unlock
- Base encounters: always available from Day 2
- Area-specific encounters: unlocked when visiting new areas
- Skill-gated encounters: appear when player reaches skill thresholds
- Season-specific encounters: appear during matching season
- Story-triggered encounters: appear after specific story beats

### Tutorial / Introduction
- **First Encounter (Day 2)**: A clearly helpful encounter — "A friendly neighbor waves at you and offers a warm pastry!" Simple choice: Accept (free food, +5 health, +5 XP) or Politely Decline (+0). Teaches that encounters happen and choices matter.
- **First Challenge Encounter (Day 3-4)**: A mild challenge — "It's getting dark and you realize your bike lights are off." Teaches consequence system without heavy penalty.

---

## 6. Integration with Other Systems

### Related Features
- **XP & Progression**: All encounter outcomes generate XP events
- **Daily Activity System**: Encounters happen during activities and travel; don't consume time periods
- **Dialogue System**: Some encounters use the dialogue system for NPC interactions
- **Transportation System**: Transport-specific encounters (bike malfunction, metro inspector)
- **Inventory & Economy**: Encounters may give/take items or money
- **Day Cycle / Weather**: Weather and time of day filter encounter pool
- **Encyclopedia**: Some encounters unlock cultural facts

### System Dependencies
- UI system (encounter cards, response buttons)
- RNG system (weighted random selection from encounter pool)
- State management (track completed encounters, prevent repeats)
- Audio system (encounter sounds)
- Animation system (card animations)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] 2-4 encounters generated per in-game day
- [ ] Encounters distributed correctly by category probability (30/40/25/5)
- [ ] Encounters filtered by: location, time, season, weather, level, history
- [ ] No exact encounter repeats within 7 in-game days
- [ ] Each encounter presents 2-3 response options
- [ ] Skill-gated options shown but grayed out when requirements unmet
- [ ] Outcomes (XP, items, relationships) applied correctly
- [ ] One-time encounters removed from pool after resolution
- [ ] Encounter history persists across save/load
- [ ] Minimum 50 unique encounters for MVP (across all categories)
- [ ] Maximum 4 encounters per day enforced

### Experience Requirements
- [ ] Encounters feel organic and surprising, not formulaic
- [ ] Player understands outcomes of their choices
- [ ] Challenge encounters teach something about Danish culture
- [ ] Encounters add variety — no two days feel exactly the same

### Performance Requirements
- [ ] Encounter card renders within 0.5 seconds of trigger
- [ ] Response buttons are interactive immediately on render
- [ ] No frame drops during encounter card animations

### Polish Requirements
- [ ] All encounter cards have consistent visual design
- [ ] Sound effects match encounter category mood
- [ ] Cultural tip facts are accurate and interesting
- [ ] Card slide-in/slide-out animations are smooth

---

## 8. Testing & Validation

### Playtesting Goals
- Do encounters feel natural or do they interrupt gameplay flow?
- Do players read encounter text or click through?
- Are encounter frequencies appropriate (not too many, not too few)?
- Do challenge encounters feel fair?
- Do cultural facts stick with players?
- Is the encounter variety sufficient for 8+ hours of play?

### Success Metrics
- 70%+ of players report encounters as "enjoyable" or "interesting"
- Average encounter response time: 3-8 seconds (player is reading, not rushing)
- 85%+ of encounter outcomes are "expected" by player (clear choices, not surprising penalties)
- Players encounter less than 10% repeats in a single 8-hour playthrough
- Cultural facts retention: 50%+ of players remember 3+ facts from encounters

---

## 9. Examples & References

### Similar Features in Other Games
- **The Oregon Trail (Random Events)**: Trail events interrupt travel with choices. **What they did well**: Simple choices with meaningful consequences; high memorability.
- **FTL: Faster Than Light (Random Encounters)**: Sector encounters with branching choices. **What they did well**: Each encounter feels like a mini-story; skill checks add depth; outcomes feel fair.
- **Reigns (Card-Based Choices)**: Swipe-to-choose encounters that shift resource bars. **What they did well**: Extreme simplicity — each choice is one swipe with clear directional impact. Encounters feel snappy.
- **Slay the Spire (Random Events)**: Events with 2-3 options, some gated by items or relics. **What they did well**: Options are clearly distinct; rewards/risks are readable.

### Inspiration
- Real expat "first time" moments — the confusion of the return (pant) bottle system, the joy of a stranger greeting you in Danish
- Slice-of-life anime/manga storytelling — mundane moments made interesting through perspective and humor
- "Danish facts" social media accounts that surface surprising cultural trivia

### Iteration History
- **v1**: Initial design — 4 categories with probability weights, contextual filtering, skill gating

---

## Implementation Notes (For Developers)

### Suggested Approach
- Encounters should be fully data-driven (JSON file per encounter or grouped by category)
- Each encounter entry: id, category, conditions (location, weather, season, level, skills), text, options with outcomes, one-time flag
- Encounter manager service handles pool filtering, selection, and history tracking
- Encounter card can be a Phaser scene overlay or a simple UI panel

### Performance Considerations
- Encounter pool filtering should be efficient (pre-filter on day start, not per-trigger)
- Encounter history can be a simple Set of encounter IDs in registry

### Platform Concerns
- Encounter cards need to be readable on all resolutions
- Touch-friendly response buttons (minimum 44px tap targets)
