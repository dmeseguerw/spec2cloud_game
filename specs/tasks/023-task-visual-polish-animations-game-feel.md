# Task 023: Visual Polish, Animations & Game Feel

**GitHub Issue:** [#43 - Task 023: Visual Polish, Animations & Game Feel](https://github.com/dmeseguerw/spec2cloud_game/issues/43)
**GitHub PR:** [#46 - [WIP] [TASK-023] Add visual polish and animations for game feel](https://github.com/dmeseguerw/spec2cloud_game/pull/46)

## Description
Add visual polish, animations, juice effects, and game feel enhancements across all existing systems. This task takes the functional game and makes it feel alive — smooth transitions, satisfying feedback, particle effects, screen shake, number animations, and the "cozy Scandinavian" atmosphere. This should be done after all core features are functional.

## Dependencies
- All previous tasks (001-022) should be substantially complete
- Task 006: Asset Pipeline (animation sprites, particle textures)
- Task 007: UI Framework (elements to animate)
- Task 009: Audio System (feedback sounds)

## Technical Requirements

### Screen & Scene Transitions
- Smooth fade transitions between all scenes (consistent timing)
- Scene-appropriate transitions (fades for major changes, slides for overlays)
- No jarring cuts — every scene change has at least a brief fade

### HUD Animations
- **XP bar**: Smooth fill/drain animation on change (not instant)
- **Money display**: Coins briefly flash on gain; number counts up/down
- **Health/Mental**: Pulse effect when critically low
- **Day/Time**: Gentle transition animation when time period changes
- **Weather icon**: Subtle animation (rain drops, sun rays, snowflake drift)

### Notification Animations
- **Slide-in**: Notifications bounce slightly on entry
- **Slide-out**: Notifications fade and slide away
- **Priority**: High priority notifications have a subtle glow/shake
- **Stacking delay**: Smooth sequential appearance (no pop-in)

### Encounter Card Animations
- **Card entrance**: Bounce-slide from right side
- **Category icon**: Subtle loop animation (bike wheel spins, bubble pulses)
- **Response selection**: Selected option briefly pulses/glows
- **Outcome text**: Positive glows green, negative shakes red
- **Cultural tip**: Lightbulb burst animation
- **Major event card**: Golden border sparkle
- **Card exit**: Slight rotation slide-out (like dealing a card)

### XP & Level Feedback
- **XP gain**: Sparkle particles float up from HUD XP bar
- **XP loss**: Brief dark cloud particle near XP bar
- **Level up**: Bright celebration — expanded notification, confetti burst, screen flash
- **Skill level up**: Smaller but distinct positive burst

### Dialogue Animations
- **Text typewriter**: Smooth character-by-character with per-NPC speed
- **Response buttons**: Fade in sequentially after text completes
- **NPC portrait**: Subtle breathing/blinking idle animation
- **Emotion indicators**: NPC expression changes based on dialogue mood

### Day Cycle Visual Effects
- **Time of day**: Gradual color grading shift (warm morning → bright afternoon → amber evening → blue/dark night)
- **Season visuals**: Seasonal palette shifts (spring greens, summer brights, fall oranges, winter blues/grays)
- **Weather effects**: Rain particles, snow particles, wind-blown items, fog overlay
- **Sunset/Sunrise**: Brief visual transition at period changes

### World & Player Animations
- **Player idle**: Subtle breathing, occasional look-around
- **Player interaction**: Small hop or gesture when pressing interact
- **NPC idle**: Standing animations with occasional shifts, head turns
- **Door entry/exit**: Brief fade or door-opening animation
- **Item pickup**: Item floats up and into inventory with trail

### Shop & Inventory Polish
- **Purchase**: Items fly from shop list into an implied bag/cart
- **Inventory open**: Items appear with slight stagger animation
- **Food freshness**: Green→yellow→red glow behind food items
- **Pant return**: Each bottle slides into machine with clink, counter rolls up

### Day Summary Polish
- **XP entry tally**: Each entry slides in, positive/negative ping sound, running total counts
- **Net XP reveal**: Dramatic pause → number reveal with matching sound
- **Level progress bar**: Smooth fill animation
- **Level up within summary**: Confetti explosion + fanfare

### Encyclopedia Polish
- **Page texture**: Slightly worn paper background
- **Tab switch**: Physical click feeling with slight page turn
- **Entry discovery**: Golden sparkle notification
- **Completion badge**: Star/badge appears with satisfying stamp animation

### Accessibility Considerations
- All animations should be skippable or have reduced motion option
- No rapid flashing (respect seizure safety)
- Color-coded feedback should also include icons/text (not color-only)
- High contrast mode should disable subtle visual effects

## Acceptance Criteria
- [ ] All scene transitions use smooth fades or slides
- [ ] HUD values animate smoothly on change (no instant jumps)
- [ ] Notifications bounce-slide in and fade-slide out
- [ ] Encounter cards animate appropriately for their category
- [ ] XP gain/loss has visible particle feedback
- [ ] Level-up celebration is visually and audibly distinct
- [ ] Typewriter text effect works smoothly in dialogue
- [ ] Time-of-day color grading shifts are subtle and pleasing
- [ ] Weather particles render without performance impact
- [ ] Day summary XP tally provides satisfying sequential reveal
- [ ] All animations can be disabled via accessibility settings
- [ ] No animation causes frame rate drops below 50 FPS
- [ ] Game feels "cozy Scandinavian" — warm, inviting, not stressful

## Testing Requirements
- **Performance Test**: All animations maintain ≥50 FPS on target hardware
- **Performance Test**: Weather particles don't cause frame drops
- **Unit Test**: Reduced motion setting disables animations
- **Unit Test**: High contrast mode adjusts visual effects
- **Integration Test**: Complete gameplay session with all animations — no crashes or glitches
- **Manual Test**: Visual quality assessment against GDD art direction
- **Manual Test**: Animation timing feels satisfying (not too fast, not too slow)
- **Manual Test**: Accessibility settings correctly modify visual output
- **Coverage Target**: N/A for pure visual polish; focus on manual QA and performance testing

## References
- GDD Section 7: Art & Audio Direction (Cozy Scandinavian Realism aesthetic)
- All FDDs: Juice Elements & Game Feel sections
- GDD Section 6: Accessibility Features (reduced motion, high contrast)
