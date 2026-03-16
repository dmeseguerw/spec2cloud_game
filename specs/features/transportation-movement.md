# 🎯 Feature Design Document: Transportation & Movement System

## 1. Feature Overview

### Feature Name
**Transportation & City Movement System**

### Purpose
Movement is how the player experiences Copenhagen. This system governs walking, biking, and public transit — the three pillars of Danish transportation. It's not just about getting from A to B; each mode of transport is a gameplay mechanic with unique risks, rewards, and skill expression. Biking especially is a core pillar of Denmark Survival — it's the most "Danish" activity in the game and where players feel the culture most directly.

### Priority
- [x] **Critical** (MVP - Must have)

### Dependencies
- XP & Progression System (transport activities generate XP)
- World/Map system (locations to travel between)
- Day Cycle (time of day affects transport — darkness, rush hour)
- Weather system (rain affects biking risk)

---

## 2. Player-Facing Design

### Player Actions

**Walking:**
1. **Walk freely**: Move through 2D environments using WASD/arrow keys
2. **Observe**: Slower pace allows noticing interactive objects, NPCs, and details
3. **Enter locations**: Walk into buildings, shops, transit stations

**Biking:**
1. **Mount/Dismount bike**: Press E near bike to mount; press E again to dismount and park
2. **Ride**: Faster movement speed than walking; navigate bike lanes
3. **Signal turns**: Context-prompted signals at intersections (press direction + Space)
4. **Ring bell**: Press B to ring bike bell (clears NPC pedestrians, earns style points)
5. **Use bike lights**: Toggle lights with L key (required after dark — forgetting = XP loss)
6. **Park bike**: Must find valid parking spot or risk fine event

**Public Transit (Metro/Bus):**
1. **Enter station**: Walk into metro station entrance
2. **Check in**: Interact with card reader at entry (press E) — MUST do this or risk fine
3. **Wait & Board**: Short wait animation, then travel scene
4. **Check out**: Interact with card reader at exit — MUST do this
5. **Buy tickets/travel card**: Purchase at station kiosk (one-time or travel card)

### Visual Design
- **Walking**: Character sprite walks with natural 4/8-direction animation. Footstep dust particles on gravel, none on pavement. Character expression changes with weather (hunched in rain, relaxed in sun).
- **Biking**: Character switches to bike sprite. Bike has visible accessories (basket, lights, bell). Wheels rotate. Scarf/hair flows with movement. Speed lines at higher cycling skill levels.
- **Metro**: Interior view of train carriage with other passengers. Window shows city passing. Platform view during boarding/alighting with passengers and signage.
- **Weather effects**: Rain streaks while biking, puddle splashes, fog reduces visibility, snow crunches
- **Time of day**: Bike lights visible as cone of light in evening/night scenes. Street lamps lit.

### Audio Design
- **Walking SFX**: Footsteps varying by surface (cobblestone, pavement, grass, indoor), umbrella rain patter
- **Biking SFX**: Chain rattle (subtle), tire on road (changes with surface), bike bell (ding!), handbrake squeak, wind rushing past
- **Metro SFX**: Station announcement jingle, doors opening/closing, train rumble, card reader beep (success) / buzz (fail/forgot)
- **Ambient**: City traffic (distant), other cyclists passing, seagulls near harbor, rain on surfaces
- **Music**: "Morning Commute" track during transit sequences — rhythmic, energetic

### Player Feedback
- **Immediate Feedback**: Movement is responsive; bike feels notably faster than walking; metro is instant (loading screen = travel time)
- **Visual Feedback**: Successfully checking in shows green checkmark; forgetting shows nothing (player might not notice — that's the point)
- **Audio Feedback**: Check-in beep confirms success; bike bell gives satisfying ding; bike light toggle has soft click
- **XP Feedback**: "+10 XP" floats after successful bike ride; "-30 XP" floats when caught without ticket

---

## 3. Rules & Mechanics

### Core Rules

**Walking Rules:**
- Default movement speed: 1x
- No risk, no XP reward (it's safe but slow)
- Allows interaction with all environment objects while moving
- No time cost beyond actual travel time (but travel time is longer)

**Biking Rules:**
- Movement speed: 2.5x walking speed
- Must own or rent a bike (starting bike provided on Day 1 by Lars)
- Bike lanes exist on main roads — riding outside bike lanes near traffic = risk event
- Must signal turns at intersections (visual prompt; failure = chance of accident)
- Must use lights after sunset (toggle); forgetting = -20 XP if caught
- Must park at bike racks; leaving bike on sidewalk = chance of fine
- Biking in rain: cycling skill check — low skill = higher chance of mishap
- Bike can malfunction (flat tire, chain slip) — random encounter, frequency decreases with cycling skill
- Biking XP: +10 per successful ride (no incidents)
- Cycling skill improves with each ride

**Metro Rules:**
- Must check in at entry AND check out at exit
- Checking in costs DKK (zone-based fare or travel card)
- Forgetting to check in: no immediate feedback, but random inspector events trigger -30 to -50 XP fine
- Travel card: one-time purchase, eliminates per-ride cost
- Metro is instant travel between connected stations (no real-time riding)
- Some stations unlocked as player progresses (new areas)
- Rush hour (morning/evening): more crowded, social encounters possible

**Bus Rules:**
- Similar check-in/check-out mechanic to metro
- Different routes serve different areas
- Slower than metro but serves areas metro doesn't
- Lower frequency (arrives every few in-game minutes vs metro's frequent service)

### Variables & Values

| Variable | Value | Description |
|----------|-------|-------------|
| Walk speed | 1x (base) | Baseline movement |
| Bike speed | 2.5x | Scales to 3x at Cycling Skill 5 |
| Metro travel time | 0 (instant) | Time-skip scene transition |
| Bus travel time | 0 (instant) | Time-skip, slightly longer narrative |
| Metro single ticket | 24 DKK | Per ride, zones 1-2 |
| Metro travel card (monthly) | 400 DKK | Unlimited rides |
| Bike check-in inspector chance | 8% per ride | Chance of inspector on any ride without check-in |
| Bike lights required | After 18:00 (winter: 16:00) | Seasonal adjustment |
| Bike accident chance (Skill 1) | 10% per ride in rain | Decreases 2% per skill level |
| Bike accident chance (Skill 5) | 2% per ride in rain | Minimum risk |
| XP per safe bike ride | +10 | Completion without incident |
| XP for intersection signal | +15 | Correctly signaling a turn |
| XP loss: no bike lights | -20 | If caught after dark without lights |
| XP loss: no metro check-in | -30 | If inspector catches you |
| XP loss: caught without ticket | -50 | More severe if no travel card and forgot check-in |
| XP loss: bike accident | -40 | From causing an accident |
| XP loss: wrong side of path | -15 | Riding on pedestrian side |

### Edge Cases & Special Situations
- **Bike stolen**: Random event (rare, ~2% chance when parked outside rack). Player must buy/rent replacement. Triggers side quest to file police report.
- **Bike flat tire during ride**: Player must walk to nearest bike shop. Time lost + potential miss of obligation.
- **Metro delay**: Rare event. Player stuck waiting and may miss scheduled activity.
- **Multiple transport modes in one trip**: Player can walk to metro, ride metro, walk to destination. XP events per segment.
- **No money for metro**: Player can't ride. Must walk or bike. Teaches financial planning.
- **Night biking without lights**: If player doesn't toggle lights after seasonal sunset time, a check triggers (every few seconds of biking at night). 30% chance per check of being stopped and fined.

### Balancing Goals
- **Biking should be the rewarding choice** — it's the most Danish way to travel. More XP, more skill growth, but more engagement required.
- **Walking should be safe but slow** — good for exploring details, bad for time management.
- **Metro should be convenient but costly** — teaches the real Danish cost/convenience tradeoff.
- **Mistakes should teach, not punish excessively** — a bike accident is -40 XP but the player learns about signals. Forgetting to check in is -30 but they remember next time.

---

## 4. Game Feel & Polish

### Desired Feel
- **Biking should feel exhilarating and satisfying** — wind in your hair, city flowing by, the joy of being a "real Dane" on two wheels
- **Walking should feel observational and calm** — notice details, soak in atmosphere
- **Metro should feel efficient and urban** — the bustle of commuter life
- **Risk moments (intersections, dark riding) should feel tense but fair** — clear signals, reasonable reaction time

### Juice Elements
- [ ] Bike wheel rotation synced to speed
- [ ] Speed lines behind bike at high cycling skill
- [ ] Bike bell has echo effect in tunnel areas
- [ ] Camera slightly zooms out when biking (feeling of speed)
- [ ] Rain particles stream past faster when biking
- [ ] Metro doors have satisfying open/close animation
- [ ] Check-in card reader glows green on success
- [ ] Walking through autumn leaves kicks them up
- [ ] Bike light creates visible cone of light at night

### Input Handling
- **Movement**: WASD/Arrow keys, 8-directional
- **Bike mount/dismount**: E key near bike
- **Bike bell**: B key
- **Bike lights**: L key toggle
- **Turn signal**: Prompted at intersections — press direction before turn
- **Check-in/out**: E key near card readers
- **Coyote time for turns**: 0.3 second grace period for intersection signals

---

## 5. Progression & Unlocking

### When Available
- **Walking**: Available immediately (Day 1)
- **Biking**: Available Day 1 after Lars gives player a starter bike
- **Metro**: Unlocked at Level 2 (after first XP level up — typically Day 2-3)
- **Bus**: Unlocked at Level 4 (alternative routes)

### How to Unlock
- Walking: Default
- Biking: Story event (Lars gives bike as welcome gift)
- Metro: Level 2 milestone ("Now you're ready to explore more of Copenhagen!")
- Bus: Level 4 milestone or discovering a bus stop

### Tutorial / Introduction
- **Biking Tutorial**: Lars takes player on first bike ride through neighborhood. Safe route, no traffic. Teaches mounting, movement, bell, and signals. "In Denmark, the bike is your best friend!"
- **Metro Tutorial**: First time entering metro station triggers guided sequence — shows check-in reader, highlights importance. Sofie (fellow expat) shares the horror story of getting a fine.
- **Learning Curve**: Biking gets easier as cycling skill improves — fewer accident chances, smoother movement, visual upgrades

---

## 6. Integration with Other Systems

### Related Features
- **XP & Progression**: All transport modes generate XP events; cycling skill tracks improvement
- **Daily Activity System**: Transport is how player reaches activity locations; time costs affect planning
- **Day Cycle/Weather**: Darkness requires bike lights; rain increases bike risk; seasons affect sunset time
- **Random Encounters**: Transport-specific encounters (bike malfunction, metro inspector, helpful cyclist tip)
- **Inventory & Economy**: Metro fares cost money; bike repairs cost money; travel card is purchasable item
- **NPC System**: NPCs appear on routes — Kasper (cyclist mentor) appears when biking, metro has passenger NPCs

### System Dependencies
- Movement/physics system (character movement, speed modifiers)
- Input system (keyboard controls for biking actions)
- UI system (check-in prompts, turn signal indicators)
- Audio system (bike sounds, metro sounds, footsteps)
- Animation system (walking, biking, metro boarding)
- Timer/clock system (sunset time for lights)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] Player can walk in 4/8 directions at base speed
- [ ] Player can mount/dismount bike with E key
- [ ] Biking moves at 2.5x walking speed
- [ ] Bike bell rings with B key and affects nearby NPCs
- [ ] Bike lights toggle with L key
- [ ] Riding without lights after dark triggers XP penalty chance
- [ ] Metro check-in/check-out works at card readers
- [ ] Missing check-in creates inspector encounter chance
- [ ] Metro deducts fare per ride (or validates travel card)
- [ ] Turn signals are prompted at intersections
- [ ] Missing signals has chance of accident event
- [ ] Cycling skill improves with each completed ride
- [ ] Higher cycling skill reduces accident chance
- [ ] All transport XP values match design spec

### Experience Requirements
- [ ] Player feels meaningfully faster on bike vs walking
- [ ] Metro feels like a convenient shortcut
- [ ] First bike ride with Lars feels welcoming and fun
- [ ] Bike accidents feel like avoidable mistakes, not random punishment
- [ ] Getting caught without metro ticket teaches an important lesson

### Performance Requirements
- [ ] Movement at 60 FPS with no stutter
- [ ] Scene transitions (entering metro, arriving at station) under 2 seconds
- [ ] Weather effects don't impact movement framerate

### Polish Requirements
- [ ] Bike wheel animation syncs with speed
- [ ] Sound effects match movement surface
- [ ] Check-in card reader has satisfying visual/audio feedback
- [ ] Weather affects movement visuals (rain streaks, snow)

---

## 8. Testing & Validation

### Playtesting Goals
- Do players default to biking (the most rewarding option)?
- Do players remember to check in on the metro?
- Is the bike accident chance frustrating or educational?
- Do players learn to use bike lights at night?
- Is the walking speed too slow (tedious) or just right (atmospheric)?

### Success Metrics
- 80%+ of player trips use biking by Day 7
- 60%+ of players forget metro check-in at least once (learning moment)
- Less than 5% of players report biking mechanics as "frustrating"
- Average cycling skill reaches Level 3 by end of Chapter 2

---

## 9. Examples & References

### Similar Features in Other Games
- **Pokémon (Bike)**: Bike as movement upgrade — faster, more fluid, earned through gameplay. **What they did well**: Bike felt like a meaningful upgrade from walking.
- **VA-11 HALL-A / Coffee Talk**: Simple location transitions with mood-setting visuals. **What they did well**: Travel as atmosphere, not tedium.
- **Unpacking**: Environmental storytelling through interaction with mundane objects. **Inspiration**: The metro station, bike shop, and sidewalks should tell stories too.
- **Night in the Woods**: Walk-and-talk exploration with personality in movement. **What they did well**: Walking is never boring because the world reacts.

### Inspiration
- Real Copenhagen cycling culture — the flow of rush-hour bike traffic on Nørrebrogade
- The anxiety of realizing you forgot to check in on the S-tog (Danish metro)
- The satisfaction of a perfect bike commute on a sunny Danish day
- Copenhagen's bike-first city design — separated bike lanes, bike traffic lights

### Iteration History
- **v1**: Initial design — walk, bike, metro, bus with XP integration

---

## Implementation Notes (For Developers)

### Suggested Approach
- Walking uses standard Phaser tile-based or free movement
- Biking could use same movement system with speed multiplier and different sprite
- Metro is a scene transition (not real-time travel) — show brief travel scene
- Turn signal system can be a simple prompt overlay at designated intersection tiles

### Performance Considerations
- Bike animations need spritesheet with multiple frames for smooth wheel rotation
- Weather particle effects should use Phaser particle system with pooling
- Metro interior can be a simple static scene with animated elements

### Platform Concerns
- Touch controls for biking (future): swipe to steer, tap zones for bell/lights
- Ensure bike controls are remappable
