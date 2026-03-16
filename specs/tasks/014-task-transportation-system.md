# Task 014: Transportation System

## Description
Implement the three transportation modes (walking, biking, metro/bus) with their distinct mechanics, costs, risks, and XP implications. Biking is the primary mode with skill-based mechanics (signals, lights, parking). Metro requires check-in/out with fare calculation. Walking is safe but slow. Transportation is a core daily activity and major source of XP gain and loss.

## Dependencies
- Task 008: Player Entity & World Movement (base movement, player entity)
- Task 003: State Management (DKK, cycling skill, player position)
- Task 007: UI Framework (transport mode indicator, notifications)
- Task 012: XP & Level Progression (XP grants/penalties from transport)
- Task 013: Day Cycle & Season (weather affects transport, time of day for lights)

## Technical Requirements

### TransportManager (`src/systems/TransportManager.js`)
Manages the player's current transport mode and associated mechanics:

**Transport Modes:**

| Mode | Speed Multiplier | Time Cost | DKK Cost | XP Potential |
|------|-----------------|-----------|----------|-------------|
| Walking | 1x (base) | High | Free | Low (+5) |
| Biking | 2.5x | Medium | Free (after bike) | High (+10-20) |
| Metro | Instant (scene transition) | Low | Per trip or monthly pass | Medium (+10) |

**Mode Switching:**
- Player can switch modes at designated points (bike racks, metro stations)
- Walking is always available
- Biking requires owning a bike (starting item for most jobs)
- Metro requires a Rejsekort (travel card) with balance or monthly pass

### Bike Mechanics (`src/systems/BikeMechanics.js`)
The most complex transport system:

**Core Biking:**
- Mount/dismount at bike parking locations
- Increased movement speed (2.5x walking)
- Bike-specific animations for the player
- Bike sprite attached to player when mounted

**Bike Signal System:**
- Player should signal when turning (dedicated key or automatic prompt)
- Failing to signal: risk of -15 XP penalty (chance-based)
- Correctly signaling: +5 XP when prompted

**Bike Lights:**
- After sunset (based on season), bike lights are required
- Riding without lights: -20 XP penalty if caught (random check per trip)
- Bike lights are an inventory item (must purchase if not starting item)
- Lights toggle automatically at sunset if player has them

**Bike Safety:**
- Riding in rain: accident chance based on cycling skill level
  - Skill 1: 10% chance, Skill 2: 8%, Skill 3: 5%, Skill 4: 3%, Skill 5: 2%
- Accident: -40 XP, potential bike damage (repair needed)
- Riding on wrong side: -15 XP if caught (random check)

**Bike Parking:**
- Must park bike when entering buildings
- Bike lock quality affects theft chance (better lock = lower risk)
- Parking at designated areas: no issues
- Parking illegally: risk of fine

**Cycling Skill Improvement:**
- Successful trips without incident increment cycling skill
- Skill tracked via SkillSystem (0-100 value, 5 levels)
- Higher skill = fewer accidents, better XP from biking

### Metro System (`src/systems/MetroMechanics.js`)

**Check-in/Check-out:**
- Player must check-in when entering metro station (interact with terminal)
- Player must check-out when exiting destination station
- Forgetting to check-in/out: -30 XP penalty

**Fare System:**
- Per-trip fare deducted from Rejsekort balance (e.g., 24 DKK per trip)
- Monthly pass option: 400 DKK/month for unlimited rides
- If insufficient Rejsekort balance and no pass: cannot ride (must top up)

**Inspector System:**
- 8% chance per trip of encountering a ticket inspector
- Valid ticket: no issue (+0 XP)
- No ticket/unchecked-in: -50 XP + 500 DKK fine
- Inspector encounter is a mini random event (per FDD)

**Travel Effect:**
- Metro trips are "instant" (scene transition to destination area)
- Player selects destination from available metro stations

### Walking Mechanics
- Default mode — always available
- Slowest but safest
- Allows more observation (occasional helpful encounter chance +5%)
- +5 XP for walking to new areas (first visit bonus)

### Transport UI
- Current transport mode icon in HUD (foot, bike, metro icon)
- When biking: small bike status (lights on/off indicator)
- Metro station interaction: show available destinations with fare cost
- Rejsekort balance display when at metro station

## Acceptance Criteria
- [ ] Player can switch between walking, biking, and metro modes
- [ ] Walking uses base speed; biking uses 2.5x multiplier
- [ ] Mounting bike changes player sprite/animation to biking variant
- [ ] Bike signal prompt appears at turns; correct response grants XP
- [ ] Bike lights warning triggers after sunset when lights are off
- [ ] Rain increases bike accident chance based on cycling skill level
- [ ] Metro check-in/out required; skipping triggers penalty
- [ ] Metro fare deducted from Rejsekort correctly
- [ ] Monthly pass allows unlimited metro rides
- [ ] Inspector chance (8%) triggers encounter on metro trips
- [ ] Transport mode indicator updates in HUD
- [ ] Cycling skill improves after successful trips
- [ ] Walking first-visit bonus grants +5 XP to new areas
- [ ] Metro destination selector shows available stations with costs

## Testing Requirements
- **Unit Test**: Speed multipliers correct for each mode
- **Unit Test**: Bike signal check generates correct XP (success/fail)
- **Unit Test**: Bike light requirement triggers after sunset time
- **Unit Test**: Accident probability matches cycling skill level table
- **Unit Test**: Metro fare deduction calculates correctly
- **Unit Test**: Monthly pass check allows free rides
- **Unit Test**: Inspector chance fires at 8% rate (statistical test)
- **Unit Test**: No-ticket fine applies correct XP and DKK penalties
- **Unit Test**: Cycling skill increment on successful trips
- **Integration Test**: Mount bike → ride → signal at turn → park → skill increments
- **Integration Test**: Enter metro → check-in → arrive at destination → check-out → fare deducted
- **Integration Test**: Bike in rain → accident occurs → damage applied
- **Coverage Target**: ≥85% for TransportManager, BikeMechanics, MetroMechanics

## References
- FDD: Transportation & Movement (complete specification)
- FDD: Inventory & Economy (Rejsekort, bike lights, repair kits)
- FDD: Daily Activity & Day Cycle (sunset times per season)
- GDD Section 3: Game Mechanics (transportation XP tables)
