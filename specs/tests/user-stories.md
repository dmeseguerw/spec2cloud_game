# Denmark Survival — Player User Stories

**Version:** 1.0  
**Date:** March 17, 2026  
**Based on FDDs:** character-creation.md, xp-progression-system.md, daily-activity-day-cycle.md, dialogue-npc-system.md, inventory-economy.md, transportation-movement.md, random-encounter-system.md, encyclopedia-learning.md

---

## US-001: Create My Character

**As a player**, I want to enter my name, choose a nationality, and choose a profession so that I start the game as a character that reflects my chosen identity with meaningful gameplay modifiers.

**Priority:** Critical  
**Feature:** character-creation.md

### Acceptance Criteria
- [ ] Name field accepts 1–20 characters (alphanumeric, accents, hyphens)
- [ ] At least 10 nationalities are selectable, each with a flavor description and modifier preview
- [ ] At least 8 professions are selectable, each with a description and modifier preview
- [ ] A character summary/preview screen is shown before confirming
- [ ] Confirming saves the character and launches the game

### Happy Path
1. Open the game and reach the Character Creation screen
2. Type a name in the name field (e.g., "Alex")
3. Browse and select a nationality (e.g., "German")
4. Browse and select a profession (e.g., "Software Developer")
5. Review the character summary screen showing name, nationality, profession, and stat modifiers
6. Confirm and enter the game world

### Edge Cases
- What happens if the name field is left empty?
- What happens if the name is exactly 20 characters?
- What happens if the name is 21 characters (should be rejected)?
- What happens if the player clicks Back to change nationality after selecting a profession?

### Out of Scope
- Cosmetic character appearance customization
- Saving/loading character creation mid-flow

---

## US-002: Nationality Affects Starting Modifiers

**As a player**, I want my nationality choice to apply starting cultural bonuses and penalties so that my early game experience reflects my character's background.

**Priority:** Critical  
**Feature:** character-creation.md

### Acceptance Criteria
- [ ] Each nationality applies its documented cultural familiarity modifier (High/Medium/Low)
- [ ] Each nationality applies its documented skill modifier (e.g., German = +10 Bureaucracy)
- [ ] High cultural familiarity characters receive fewer early penalties
- [ ] Modifiers are reflected immediately in the character's starting stats

### Happy Path
1. Select "German" nationality
2. Confirm character creation
3. Verify starting Bureaucracy skill is +10 above baseline
4. Verify early encounters are more forgiving (High cultural familiarity)

### Edge Cases
- What happens if two nationalities have the same modifier value?
- What happens if the modifier display is shown before selection is made?

### Out of Scope
- Mid-game nationality changes

---

## US-003: Job Determines Starting Salary and Work Schedule

**As a player**, I want my profession choice to set my starting salary and work schedule so that I know how many days I must work and how much money I start with.

**Priority:** Critical  
**Feature:** character-creation.md

### Acceptance Criteria
- [ ] Starting DKK balance reflects the chosen job's salary tier
- [ ] Work schedule (days per week) matches the job's documented pattern
- [ ] Job-specific scenarios are available during gameplay

### Happy Path
1. Select "Software Developer" job during character creation
2. Confirm and start game
3. Check HUD wallet balance — should reflect the developer salary tier
4. Advance to the first work day and see a software developer work activity

### Edge Cases
- What if the player selects the lowest-paying job — does the game remain playable?
- What if the player has work 5 days/week — is weekend rest time sufficient?

### Out of Scope
- Changing jobs mid-game

---

## US-004: Earn XP from Daily Actions

**As a player**, I want to earn XP by completing activities and making good decisions so that I feel rewarded for playing well and adapting to Danish life.

**Priority:** Critical  
**Feature:** xp-progression-system.md

### Acceptance Criteria
- [ ] Completing a successful bike ride awards +10 XP
- [ ] Successful Danish conversation awards +20 XP
- [ ] XP gain is shown as a floating "+XP" notification
- [ ] XP bar in the HUD updates immediately after gaining XP
- [ ] Daily XP summary shows a breakdown by category at end of day

### Happy Path
1. Start an in-game day
2. Ride a bike successfully from one location to another
3. See "+10 XP" floating notification appear
4. Verify XP bar in HUD has increased
5. End the day and see the XP breakdown in the day summary screen

### Edge Cases
- What happens if the player earns XP that pushes them to the exact level threshold?
- What if multiple XP events fire simultaneously (e.g., bike ride + cultural interaction)?

### Out of Scope
- Skill XP (tracked separately)

---

## US-005: Lose XP from Mistakes

**As a player**, I want to lose XP when I make cultural mistakes or neglect obligations so that decisions feel meaningful and consequences are visible.

**Priority:** Critical  
**Feature:** xp-progression-system.md

### Acceptance Criteria
- [ ] Forgetting bike lights after dark yields -20 XP
- [ ] Missing a mandatory work day yields documented XP penalty
- [ ] XP loss is shown as floating "-XP" notification in soft red
- [ ] XP bar updates immediately on loss
- [ ] XP can go negative (minimum -500 before game over)

### Happy Path
1. Ride bike after dark without toggling lights on
2. Get caught — see "-20 XP" notification (soft red, slight shake)
3. Verify XP bar decreases
4. Check that game continues (no game over unless at -500)

### Edge Cases
- What happens when XP drops below 0 for the first time?
- What happens when XP reaches exactly -500 (game over floor)?
- What happens if player reaches -100 for 3 consecutive days (assist mode)?

### Out of Scope
- XP loss from random encounters (covered in US-017)

---

## US-006: Level Up with Tangible Rewards

**As a player**, I want to level up when I accumulate enough XP so that I unlock new content and feel a sense of progression.

**Priority:** Critical  
**Feature:** xp-progression-system.md

### Acceptance Criteria
- [ ] Level up triggers a celebratory screen with golden glow and confetti
- [ ] Level up unlocks specific content (e.g., Level 2 = Metro access)
- [ ] Level number is displayed in the HUD XP bar
- [ ] Level up animation is skippable on repeat

### Happy Path
1. Accumulate XP until reaching the Level 2 threshold (50 XP)
2. See the full-screen level-up celebration moment
3. Notice that Metro stations are now accessible
4. Return to gameplay

### Edge Cases
- What if XP drops below a level threshold after levelling up (can the player de-level)?
- What happens if the level-up celebration fires while a dialogue is open?

### Out of Scope
- Phase transitions (covered in US-007)

---

## US-007: Phase Transition Marks Major Milestone

**As a player**, I want major gameplay phases (Newcomer → Adapter → Resident → Local → Honorary Dane) to be marked by a cinematic moment so that I feel genuine progress in my integration journey.

**Priority:** High  
**Feature:** xp-progression-system.md

### Acceptance Criteria
- [ ] Phase transition triggers a milestone card screen
- [ ] Milestone card shows phase name, motivational quote, and upcoming unlocks
- [ ] Phase transitions are one-way (no regression to a lower phase)
- [ ] World reacts differently to player in each phase (NPC dialogue changes)

### Happy Path
1. Accumulate XP past the Adapter phase threshold (500 XP)
2. See the phase transition cinematic
3. After transition, note that advanced dialogue options are available with NPCs
4. Verify the phase name shown matches "Adapter"

### Edge Cases
- What if the player's XP drops significantly during the Adapter phase — do they stay in Adapter?
- What if the phase transition fires at the same time as a level-up?

### Out of Scope
- Endgame "Integration Certificate" milestone (post-MVP)

---

## US-008: Plan and Execute Daily Activities

**As a player**, I want to plan 3–5 activities per day and execute them within time constraints so that each day feels strategically satisfying and meaningful.

**Priority:** Critical  
**Feature:** daily-activity-day-cycle.md

### Acceptance Criteria
- [ ] Each day starts with a morning overview (weather, mandatory obligations, optional activities)
- [ ] Player can choose 3–5 activities from available options
- [ ] Clock HUD shows current time period (Morning/Afternoon/Evening/Night)
- [ ] Mandatory activities are visually highlighted differently from optional ones
- [ ] End of day shows a summary of completed activities and XP breakdown

### Happy Path
1. Wake up — see morning overview with today's weather and available activities
2. Select work (mandatory) + grocery shopping + language class
3. Execute each activity in the world
4. Clock advances through time periods
5. Return home and end the day
6. See day summary screen with XP breakdown

### Edge Cases
- What happens if the player tries to add a 6th activity slot?
- What happens if the player stays up past midnight?
- What happens if a mandatory activity is skipped?

### Out of Scope
- Specific activity mini-game mechanics (covered in individual feature stories)

---

## US-009: Manage Mandatory Obligations

**As a player**, I want to be notified about mandatory obligations (work, groceries, bills) so that I can plan ahead and avoid XP penalties.

**Priority:** Critical  
**Feature:** daily-activity-day-cycle.md

### Acceptance Criteria
- [ ] Bill due dates show a letter icon in HUD with countdown
- [ ] Bills give 2-day advance notification before due date
- [ ] Missing mandatory work penalizes XP
- [ ] Missing grocery re-stock when food runs out penalizes XP (or health)
- [ ] Day summary highlights any missed mandatory items in soft red

### Happy Path
1. Receive a "Rent Due" notification 2 days before it's due
2. Plan a bill-payment activity before the due date
3. Complete the payment — bill icon disappears from HUD
4. Day summary confirms obligation met, no penalty

### Edge Cases
- What happens if the player ignores a bill for multiple days past due?
- What if two mandatory items are due on the same day?
- What if the player runs out of DKK and can't pay a bill?

### Out of Scope
- Tax filing (advanced obligation, post-tutorial)

---

## US-010: Experience Season Changes

**As a player**, I want the game world's visuals, weather, and available activities to change with the seasons so that the game feels alive and my strategies change over time.

**Priority:** Medium  
**Feature:** daily-activity-day-cycle.md

### Acceptance Criteria
- [ ] Season changes every ~22 in-game days (Spring → Summer → Autumn → Winter)
- [ ] Environment art shifts visually per season (snow in winter, flowers in spring)
- [ ] Season-specific encounters and activities become available
- [ ] Biking in rain has higher risk probability in relevant seasons

### Happy Path
1. Play through Day 22 — Spring transitions to Summer
2. Notice environment art becomes brighter and lusher
3. Summer-specific activities appear in the activity list
4. Compare weather pattern frequency — summer has less rain than spring

### Edge Cases
- What happens if the player is in the middle of an activity when the season changes?
- Does winter's shorter daylight affect time available for outdoor activities?

### Out of Scope
- Per-season story events (not yet implemented)

---

## US-011: Talk to NPCs and Build Relationships

**As a player**, I want to initiate dialogue with NPCs and choose responses that affect our relationship so that I feel part of a living community in Copenhagen.

**Priority:** Critical  
**Feature:** dialogue-npc-system.md

### Acceptance Criteria
- [ ] NPCs display an interaction indicator when the player is near them
- [ ] Dialogue box shows NPC portrait, name, and text with typewriter effect
- [ ] 2–4 response options are visible, with relationship-building icons
- [ ] Choosing a friendly response increases relationship by +2 to +5
- [ ] Choosing a rude/dismissive response decreases relationship by -2 to -5
- [ ] Relationship stage (Stranger/Acquaintance/Friendly/Friend/Close Friend) is visible in pause menu

### Happy Path
1. Walk near Lars (the bike repair NPC)
2. See a speech bubble appear above his head
3. Press E to initiate dialogue
4. Read Lars's greeting and choose a "Friendly" response
5. See "+2" relationship indicator float near Lars
6. Open pause menu and verify Lars's relationship increased

### Edge Cases
- What happens if dialogue is initiated but no response is chosen?
- What if a skill-gated dialogue option is selected above player's current skill level?
- What if the player exits the game mid-conversation?

### Out of Scope
- Quest-triggered dialogue (covered in feature-specific stories)

---

## US-012: Unlock Richer Conversations Through Language Skill

**As a player**, I want responding in Danish to unlock as my Language Skill improves so that I feel rewarded for learning the language and gain higher XP from conversations.

**Priority:** High  
**Feature:** dialogue-npc-system.md

### Acceptance Criteria
- [ ] At Language Skill 1, all dialogue is in English
- [ ] At Language Skill 2, some Danish words appear with inline translations; one Danish response option exists
- [ ] At Language Skill 3, more Danish response options are visible and available
- [ ] Danish responses award higher XP than equivalent English responses
- [ ] Skill-gated options are shown but greyed out until the skill threshold is met

### Happy Path
1. Start with Language Skill 1 — all conversations are in English
2. Use language class activities until Language Skill reaches Level 3
3. Initiate a conversation with Freja — see mixed Danish/English dialogue
4. Select a Danish response — earn notably more XP than the English alternative would give

### Edge Cases
- What happens if a Language Level 5 secret dialogue branch is accessed by a Level 4 player?
- What if Language Skill is at Level 2 and the player selects the Danish option that appears?

### Out of Scope
- Full Danish-only dialogue at Level 5 (advanced content, not early game)

---

## US-013: NPCs Remember Past Interactions

**As a player**, I want NPCs to reference previous conversations and notice my progress so that the world feels persistent and relationships feel genuine.

**Priority:** High  
**Feature:** dialogue-npc-system.md

### Acceptance Criteria
- [ ] After 5+ days without visiting an NPC, they say "I haven't seen you in a while!"
- [ ] When the player's language skill increases, NPCs notice: "Your Danish is getting better!"
- [ ] NPCs reference past player choices in dialogue
- [ ] Relationship level affects NPC greeting tone (warmer greetings at Friend stage)

### Happy Path
1. Build a relationship with Mette to Friendly level (41+)
2. Skip visiting Mette for 6 in-game days
3. Return to Mette — she comments on the absence
4. Level up Language Skill during the session
5. Re-visit Mette — she comments on the language improvement

### Edge Cases
- What happens if NPC memory data is not persisted after game save/load?
- What if an NPC was never met (met_count = 0) and is approached after 5 days?

### Out of Scope
- Negative memory (NPC remembering the player was rude)

---

## US-014: Buy Groceries and Manage Inventory

**As a player**, I want to browse a shop, add items to a cart, and buy groceries so that I can manage my character's food supply and maintain health.

**Priority:** High  
**Feature:** inventory-economy.md

### Acceptance Criteria
- [ ] Shop lists items with prices in DKK
- [ ] Items the player can't afford are dimmed (not hidden)
- [ ] Cart system allows selecting multiple items before confirming purchase
- [ ] Food items appear in inventory after purchase
- [ ] Spoilable food shows a freshness indicator (green → yellow → red → gone)
- [ ] Running low on food shows a warning or triggers a mandatory grocery shopping obligation

### Happy Path
1. Navigate to the grocery store during a day activity slot
2. Browse available items — see prices in DKK
3. Add Rugbrød, milk, and vitamin D to cart
4. Confirm purchase — DKK balance decreases by total cost
5. Open inventory screen — see items listed in the Food category
6. Check vitamin D is in "Health" category

### Edge Cases
- What if the player's DKK balance drops to exactly 0 after a purchase?
- What if a spoiled food item is "used" — what happens?
- What if the player attempts to buy more items than their balance allows?

### Out of Scope
- Pant (bottle return) system (separate story)

---

## US-015: Pay Bills on Time to Avoid Penalties

**As a player**, I want to pay my bills (rent, utilities, phone) before their due dates so that I avoid XP losses and financial penalties.

**Priority:** High  
**Feature:** inventory-economy.md

### Acceptance Criteria
- [ ] Bills arrive as a letter icon in HUD with a visible due-date countdown
- [ ] Opening a bill shows: amount, what it's for, due date, late penalty
- [ ] Paying a bill deducts the amount from DKK balance
- [ ] Late payment applies the documented late penalty (XP loss + possible fine)
- [ ] Paid bills are removed from HUD

### Happy Path
1. See rent bill notification in HUD (5 days until due)
2. Open the bill — see: "Rent — 4,500 DKK — Due in 5 days — Late fee: -50 XP"
3. Schedule a bill-payment activity
4. Payment completes — DKK decreases by 4,500, bill removed from HUD
5. No XP penalty applies

### Edge Cases
- What if the player has insufficient DKK to pay rent?
- What if two bills are due on the same day?
- What if the player ignores the bill past its due date?

### Out of Scope
- Tax filing (yearly obligation, post-MVP content)

---

## US-016: Return Bottles for Pant (Deposit Refund)

**As a player**, I want to return empty bottles and cans for their deposit refund so that I experience the distinctly Danish pant recycling system and earn small amounts of DKK.

**Priority:** Medium  
**Feature:** inventory-economy.md

### Acceptance Criteria
- [ ] Collected bottles/cans appear in inventory
- [ ] Returning them at a store pant machine yields 1–3 DKK per item
- [ ] Each bottle return plays a satisfying metallic clink sound
- [ ] The cultural tip about the Danish recycling system is displayed after first pant return

### Happy Path
1. Find empty bottles during activities (or buy beverages)
2. Collect bottles — they appear in inventory under "Collectibles"
3. Navigate to a store with a pant machine
4. Use the machine — each bottle clinks, DKK increases
5. Receive total pant refund
6. First time: see cultural tip "In Denmark, 85% of bottles are returned..."

### Edge Cases
- What if the player has 0 bottles but activates the pant machine?
- What is the maximum daily pant income?

### Out of Scope
- Collecting bottles as a primary income source strategy (balance issue for game designer)

---

## US-017: Bike Through the City

**As a player**, I want to ride my bike through Copenhagen at 2.5× walking speed so that getting around feels efficient and distinctly Danish.

**Priority:** Critical  
**Feature:** transportation-movement.md

### Acceptance Criteria
- [ ] Bike speed is 2.5× walking speed
- [ ] Successfully completing a bike ride awards +10 XP
- [ ] Player must press L to toggle bike lights after dark; forgetting = -20 XP if caught
- [ ] Biking in rain triggers a cycling skill check with risk of mishap for low-skill players
- [ ] Cycling skill improves with each ride
- [ ] Bike must be parked at a valid bike rack or risk a fine event

### Happy Path
1. Mount bike (press E near it)
2. Ride from apartment to the grocery store — visually faster than walking
3. Arrive at destination — see "+10 XP" floating notification
4. Park bike at the nearby bike rack

### Edge Cases
- What happens if the player rides through a red light / wrong lane?
- What happens if the player forgets to park at a rack?
- What happens if the player's bike gets a flat tire (malfunction event)?
- What happens if the player has no bike (starting Day 1 before Lars gives it)?

### Out of Scope
- Bike customization (unlocked at Level 6)

---

## US-018: Use the Metro Without Getting Fined

**As a player**, I want to check in and check out of the metro correctly so that I travel efficiently without incurring inspector fines.

**Priority:** Critical  
**Feature:** transportation-movement.md

### Acceptance Criteria
- [ ] Metro requires checking in (press E at card reader) at entry
- [ ] Metro requires checking out at exit
- [ ] Forgetting to check in: no immediate feedback, but random inspector events may fire -30 to -50 XP
- [ ] Travel card purchase eliminates per-ride cost
- [ ] Some metro stations are locked until player reaches sufficient level

### Happy Path
1. Enter metro station
2. Press E at the card reader — hear a beep and see a green checkmark
3. Board the metro — travel animation plays
4. Exit at destination — press E at exit card reader
5. Journey complete — DKK deducted for fare (or travel card used)

### Edge Cases
- What happens if the player boards without checking in?
- What if the inspector event fires during the same trip the player forgot to check in?
- What if the player tries to board at a locked station?

### Out of Scope
- Bus mechanics (similar to metro, separate implementation)

---

## US-019: Respond to Random Encounters

**As a player**, I want unexpected encounters to pop up during my day so that each playthrough feels fresh and unpredictable, teaching me Danish cultural norms through lived scenarios.

**Priority:** High  
**Feature:** random-encounter-system.md

### Acceptance Criteria
- [ ] 2–4 random encounters trigger per in-game day
- [ ] Encounters are contextually filtered (biking encounters only while biking)
- [ ] Each encounter presents 2–3 response options
- [ ] Positive responses award XP; poor responses cost XP
- [ ] The same encounter does not repeat within 7 in-game days
- [ ] Some encounters display a cultural learning tip after resolution

### Happy Path
1. Start biking to work
2. An encounter card slides in: "A cyclist drops their scarf ahead of you..."
3. Choose "Pick it up and return it"
4. See "+10 XP" and a cultural tip: "In Denmark, returning lost items is the norm — 85% of wallets are returned!"
5. Encounter dismisses and biking continues

### Edge Cases
- What if the player dismisses an encounter without choosing?
- What if a Major Event encounter fires while another encounter is active?
- What if the encounter pool runs out (all encounters completed)?

### Out of Scope
- Quest-triggering encounters (not yet implemented)

---

## US-020: Build the Cultural Encyclopedia

**As a player**, I want to discover encyclopedia entries through natural gameplay so that I accumulate real Danish cultural knowledge without feeling like I'm doing homework.

**Priority:** Medium  
**Feature:** encyclopedia-learning.md

### Acceptance Criteria
- [ ] Encyclopedia opens from the pause menu
- [ ] Entries in 5 categories: Culture, Language, Places, Activities, Tips
- [ ] New entries auto-unlock through gameplay (conversations, encounters, area visits)
- [ ] A toast notification slides in when a new entry is discovered
- [ ] Locked entries show "???" as title until unlocked
- [ ] Completion percentage is shown per category and overall

### Happy Path
1. Have a conversation with Freja where she explains "hygge"
2. See toast notification: "📖 New Entry: Hygge: More Than Just Cozy"
3. Open Encyclopedia from pause menu
4. Navigate to "Culture" tab — see the Hygge entry is now unlocked
5. Read the entry — enjoy 3–6 sentences of engaging content with a source tag

### Edge Cases
- What if the player visits an area before the encyclopedia area entry trigger is implemented?
- What if the same trigger fires twice (duplicate notifications should not appear)?
- What if all entries in a category are unlocked — what does the completion counter show?

### Out of Scope
- Manually adding encyclopedia entries (entries are earned, not written by player)

---

## US-021: Game Over When XP Reaches -500

**As a player**, I want to receive a clear warning when my XP is dangerously low so that I can course-correct, and understand the game is over if I reach -500 XP.

**Priority:** Critical  
**Feature:** xp-progression-system.md

### Acceptance Criteria
- [ ] Subtle warning tone plays when XP nears the -100 "danger zone"
- [ ] After 3+ consecutive days below -100 XP, assist mode activates (+25% gains, -25% losses)
- [ ] At -500 XP, a game over state is triggered with a summary screen
- [ ] Game over summary shows: player name, days survived, notable achievements

### Happy Path
1. Make a series of poor decisions over 3 consecutive days, dropping below -100 XP each day
2. On Day 4, notice XP gains are higher — assist mode activated
3. Recover XP above -100 — assist mode deactivates

### Edge Cases
- What if XP is at -499 — does game over trigger?
- What if the player manually sets XP multiplier to 0.5x in settings and drops below -500?
- Does the game over screen correctly show the right day count and XP summary?

### Out of Scope
- Restarting from a checkpoint (save/load system, separate feature)

---

## US-022: Adjust Game Difficulty via Settings

**As a player**, I want to adjust the XP loss multiplier in settings (0.5× to 2.0×) so that I can tailor the difficulty to my preference.

**Priority:** Low  
**Feature:** xp-progression-system.md

### Acceptance Criteria
- [ ] Settings menu includes XP loss multiplier slider (0.5× – 2.0×)
- [ ] Changing the multiplier takes effect immediately for subsequent XP loss events
- [ ] The setting persists across game sessions

### Happy Path
1. Open Settings from the pause menu
2. Set XP loss multiplier to 0.5×
3. Make a mistake that would normally cost -20 XP — see only -10 XP deducted
4. Close and reopen settings — multiplier is still 0.5×

### Edge Cases
- What if the slider is set to exactly 2.0× and the player hits -500 XP faster?
- What if the setting is changed mid-day — does the current day's history reflect old or new rate?

### Out of Scope
- XP gain multiplier (not in the FDD spec)
