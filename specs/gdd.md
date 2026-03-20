# Game Design Document: Denmark Survival

**Version:** 1.0  
**Last Updated:** March 16, 2026  
**Status:** Initial Design

---

## Table of Contents
1. [Game Overview](#game-overview)
2. [Player Experience](#player-experience)
3. [Tutorial & First Day Narrative](#tutorial--first-day-narrative)
4. [Game Mechanics](#game-mechanics)
5. [Progression Systems](#progression-systems)
6. [Content & Scope](#content--scope)
7. [User Interface & Controls](#user-interface--controls)
8. [Art & Audio Direction](#art--audio-direction)
9. [Success Metrics](#success-metrics)
10. [Monetization & Distribution](#monetization--distribution)

---

## 1. Game Overview

### Title and Tagline
**Denmark Survival**  
*"Master the art of Danish living, one bike ride at a time."*

### Genre
2D RPG / Life Simulation / Cultural Experience Game

### Platform
- **Primary:** PC (Windows, Mac, Linux)
- **Secondary:** Web Browser (HTML5)
- **Future Consideration:** Mobile (iOS/Android)

### Target Audience
- **Primary:** Adults 18-35 interested in Nordic culture, expats, language learners
- **Secondary:** Casual gamers who enjoy simulation and story-driven experiences
- **Tertiary:** Educational institutions teaching Danish culture or language

### Core Pillars

1. **Authentic Cultural Immersion**
   - Every mechanic reflects real Danish life experiences
   - Educational without feeling like a textbook
   - Humor balanced with genuine cultural insights

2. **Meaningful Progression Through Adaptation**
   - Players feel growth as they master Danish customs
   - Mistakes are learning opportunities, not punishments
   - Success comes from understanding and adapting to the culture

3. **Relatable Daily Challenges**
   - Scenarios that anyone who has lived abroad can relate to
   - Mix of mundane and surprising situations
   - Build empathy for immigrant/expat experiences

4. **Strategic Life Management**
   - Balance multiple life needs (health, social, financial)
   - Consequences accumulate over time
   - Encourage smart planning and adaptation

5. **Cozy and Approachable Atmosphere**
   - Low-stress gameplay with positive reinforcement
   - "Hygge" meets gameplay - comfort and warmth
   - Accessible to non-gamers

### Unique Selling Points
- **First game focused specifically on Danish expat life** - fills a unique niche
- **Educational meets entertainment** - learn real cultural knowledge while having fun
- **Empathy-building experience** - helps players understand adaptation challenges
- **Procedurally varied daily scenarios** - high replay value with different outcomes
- **Multiple character backgrounds** - different starting positions create varied experiences

---

## 2. Player Experience

### Core Gameplay Loop

**Minute-to-Minute:**
- Navigate 2D environments (city streets, buildings, interiors)
- Interact with NPCs through dialogue choices
- Complete daily tasks and activities
- Make decisions that affect XP and character wellbeing

**Session-to-Session (Daily Cycle):**
1. Wake up and plan the day
2. Complete 3-5 daily activities (work, errands, social)
3. Manage random encounters and unexpected situations
4. End day with summary of XP gains/losses
5. Level up or adjust strategies based on performance

**Long-Term (Week-to-Month):**
- Build relationships with recurring NPCs
- Master increasingly complex Danish customs
- Unlock new areas and activities
- Achieve major milestones (passing bureaucracy checks, cultural integration moments)

### Session Length
- **Casual Session:** 15-30 minutes (1-2 in-game days)
- **Standard Session:** 30-60 minutes (3-5 in-game days)
- **Extended Session:** 1-2 hours (1-2 in-game weeks)

### Difficulty Curve

**Easy Start (Days 1-7):**
- Tutorial disguised as first week orientation
- Forgiving XP losses
- Helpful NPCs provide explicit guidance
- Simple binary choices

**Building Complexity (Days 8-30):**
- More activities available simultaneously
- Need to balance multiple needs (health, finance, social)
- Cultural nuances become more important
- Consequences accumulate

**Mastery Phase (Days 31+):**
- Complex scenarios with multiple valid solutions
- Cultural knowledge tested in subtle ways
- Optimization required for high XP gains
- Unexpected situations based on earlier choices

### Emotional Journey

**Act 1 - Overwhelmed Newcomer (Week 1-2):**
- *Feelings:* Confusion, curiosity, being overwhelmed
- *Goal:* Survive basic daily tasks without major mishaps
- *Payoff:* First successful day without losing XP

**Act 2 - Struggling Adapter (Week 3-6):**
- *Feelings:* Frustration, small victories, determination
- *Goal:* Build routines and understand patterns
- *Payoff:* First level-up, feeling competent

**Act 3 - Confident Resident (Week 7-12):**
- *Feelings:* Pride, belonging, cultural understanding
- *Goal:* Master complex scenarios and help other newcomers
- *Payoff:* Recognition from NPCs, "you're really becoming Danish!"

**Endgame - Cultural Master (Week 13+):**
- *Feelings:* Accomplishment, nostalgia (for early struggles), expertise
- *Goal:* Perfect days, help other players (if multiplayer), explore optional content
- *Payoff:* "Integration Certificate" milestone, unlock expert scenarios

---

## 3. Tutorial & First Day Narrative

> **Design Intent:** Players should never wonder "what do I do?" — especially in the first five minutes. Every system in the game is introduced through a seamless narrative chain on Day 1. The player *feels* like they discovered the systems themselves, guided by Lars rather than by a pop-up checklist.

### The Narrative Hook

The game begins just after the player's character has arrived in Copenhagen. They step inside their small furnished apartment in Nørrebro — jet-lagged, hungry, and slightly overwhelmed. Lars, the helpful neighbour, knocks on the door.

This opening scene accomplishes several things at once:
- It establishes **why the player must do something right now** (they haven't eaten since the plane)
- It introduces the **first NPC relationship** (Lars) with warmth and no pressure
- It naturally chains into the **first concrete objective** (go buy food)
- It teaches the player that **NPCs give tasks** — this is how the game communicates goals

Lars does not lecture the player about game mechanics. He simply hands over a scrap of paper — a short grocery list — and says the nearest Netto is just down the road. This single, tangible prop (the grocery list) becomes the player's first tracked objective.

---

### Day 1 Tutorial Chain

Day 1 is a fully authored experience. Each step introduces exactly one new system. The player is never asked to use two unfamiliar systems simultaneously.

**Step 1 — Wake up & talk to Lars**
*Systems introduced: NPC interaction, dialogue choices, XP feedback*
Lars knocks and welcomes the player. The conversation ends with him handing over a grocery list. The Objectives Panel (bottom of screen) updates: **"Buy groceries from Netto"**. Lars also mentions that a bottle of vitamin D tablets would be wise to pick up. This quietly foreshadows the vitamin D mechanic without making it mandatory on Day 1.

**Step 2 — Walk to the shop**
*Systems introduced: world navigation, interaction indicators, the "E to enter" building mechanic*
The player walks through the neighbourhood toward Netto. A glowing door indicator appears on the shop entrance. A context hint at the bottom of the screen reads "Press E to enter Netto". This is the first time the player enters a building, teaching them that shops are **entered through doors**, not merely by talking to a NPC in the world.

During the walk, one optional pant bottle (an aluminium can) sits on the pavement. A subtle sparkle effect draws attention to it. Pressing E picks it up. A small tooltip explains: *"Pant bottle — return at any shop for 1-3 DKK"*. This teaches world-collectible items without interrupting the main task.

**Step 3 — Shop at Netto**
*Systems introduced: shop UI, browsing items, checking wallet balance, completing a purchase*
Inside the shop, the view shifts to the shop inventory screen. Mette greets the player. The grocery list items (Rugbrød, milk, pasta) are highlighted in the item list so the player can see exactly what to buy. After selecting items, the player sees a cart total in DKK. They confirm the purchase — the items move into inventory and money is deducted. The Objectives Panel updates: **"Return home and eat something"**.

If the player has a pant bottle, an optional "Return pant bottles" button appears at the shop counter for a small DKK reward — teaching the return mechanic at the gentlest possible moment.

**Step 4 — Open the inventory and eat**
*Systems introduced: inventory screen, using/consuming items, health feedback*
The player presses Tab to open inventory. The Rugbrød is visible with a "Use" button. Pressing it plays a brief eating animation and the health indicator on the HUD bumps slightly. A small "+5 XP — You ate a proper Danish meal!" notification floats up. This is the player's **first XP reward from an inventory action**.

**Step 5 — End the day**
*Systems introduced: day-end trigger, the Day Summary screen, XP gain/loss recap*
Back at the apartment, Lars is visible outside and says "Good first day! Get some rest." Walking to the apartment door and pressing E triggers the day-end prompt: *"Go to sleep and end the day?"* Confirming fades to the Day Summary screen. The player sees their XP breakdown:
- Talked to Lars: +10 XP
- Completed grocery run: +15 XP
- Ate a meal: +5 XP
- Picked up pant bottle: +2 XP
- **Day 1 Total: +32 XP**

A brief preview of Day 2 shows one new task: "Lars mentioned the language school has a free introductory class." The loop is established.

---

### Tutorial Design Principles

**Principle 1 — Every mechanic is introduced by a character, not a tooltip**
Lars mentions vitamin D. Mette highlights items on the grocery list. The Day Summary explains XP categories. Mechanics feel like organic advice, not UI pop-ups.

**Principle 2 — Objectives are always visible but never intrusive**
The Objectives Panel at the bottom-center of the HUD always shows the current active task. It's subtle enough to ignore if the player wants to explore, but always there when the player needs direction. See the [Quest & Objectives System FDD](features/quest-objectives-system.md).

**Principle 3 — Failure on Day 1 is impossible**
Lars has stocked the player's wallet with enough starting money to complete the grocery run. The shop does not close on Day 1. The day does not end automatically until the player chooses to sleep. There is no way to run out of time or money on the first day — the point is to teach, not challenge.

**Principle 4 — Optional discovery is everywhere**
The pant bottle on the street. A noticed community notice board near Netto. A colourful bike parked outside with a Kasper figure next to it (not interactive yet on Day 1, but visible — planting familiarity). The world is richer than the task requires, encouraging exploration from the very first session.

**Principle 5 — Day 1 ends on a clear win**
The Day Summary is designed to feel like an accomplishment, not a report card. The net XP is positive. Lars's closing dialogue says: *"That was a good first step. Tomorrow we can explore a bit more."* The player goes to bed feeling progress.

---

### How Players Know What To Do Next (Every Day)

After Day 1, the game shifts from scripted to systemic — but the player is never without direction. Every day, the Objectives Panel is populated by two layers of tasks:

1. **Story Missions** — Pushed by NPCs through dialogue. When Lars mentions the language school at the end of Day 1, that plants a Story Mission for Day 2. These chain through the Chapter narrative (see Section 6 — Content & Scope).

2. **Daily Maintenance Tasks** — Generated by the day cycle based on player state. If food supply is empty: "You're out of food — visit a shop." If a bill is due: "Rent is due in 2 days." If health is low: "You look tired — consider resting or eating." These always exist and create session-to-session continuity.

The player is never lost because **the game always knows their state** and surfaces the most relevant next task.

> 📎 See [First Day Onboarding FDD](features/first-day-onboarding.md) for the full detailed design of the Day 1 experience.
> 📎 See [Quest & Objectives System FDD](features/quest-objectives-system.md) for how tasks are tracked, displayed, and chained.

---

## 4. Game Mechanics

### Player Verbs (Core Actions)

**Movement Verbs:**
- **Bike** - Primary transportation, XP rewards, requires attention
- **Walk** - Slower, safe, allows more observation
- **Metro** - Fast, costs money, requires check-in
- **Bus** - Alternative transit, different routes

**Interaction Verbs:**
- **Talk** - Initiate conversations with NPCs
- **Pick Up** - Collect world-spawned items (pant bottles, dropped wallets, notes, seasonal finds)
- **Enter** - Walk through a building door (E key) to access shop or location interior
- **Buy** - Purchase items from a shop's browsable inventory
- **Pay** - Handle bills, taxes, fines
- **Submit** - Complete bureaucratic tasks
- **Help** - Assist other characters
- **Learn** - Study language/culture (active skill-building)

**Management Verbs:**
- **Plan** - Schedule daily activities
- **Check** - Review status (health, XP, inventory, obligations)
- **Rest** - Recover health/mental energy
- **Eat** - Maintain health, can be social activity

### Core Mechanics

#### 1. XP System (Life Adaptation Score)

**What It Represents:**
XP is not traditional "experience points" but rather a **Life Success Meter** that reflects how well the player is adapting to Danish life. High XP means thriving, low XP means struggling.

**XP Gain Categories:**

*Transportation Mastery (+5 to +20 XP):*
- Successfully bike without incidents: +10 XP
- Navigate complex intersections correctly: +15 XP
- Remember to use bike lights in dark: +5 XP
- Check in/out on metro correctly: +10 XP
- Avoid metro fines: +10 XP (passive gain)

*Cultural Integration (+10 to +50 XP):*
- Successful Danish conversation: +20 XP
- Understand and respond to cultural cues: +30 XP
- Participate in Danish traditions correctly: +50 XP
- Help another newcomer: +25 XP
- Learn and use Danish phrases appropriately: +15 XP

*Daily Life Management (+5 to +30 XP):*
- Complete grocery shopping: +10 XP
- Pay bills on time: +15 XP
- File taxes correctly: +30 XP
- Attend work/job duties successfully: +20 XP
- Maintain good health habits: +10 XP

*Social Connections (+5 to +40 XP):*
- Make positive impression on NPC: +15 XP
- Accept fika/coffee invitation: +10 XP
- Build friendship milestone: +40 XP
- Navigate social faux pas gracefully: +20 XP

**XP Loss Categories:**

*Health Neglect (-5 to -25 XP):*
- Forget daily vitamin D supplement: -10 XP
- Skip meals: -5 XP
- Not dress warmly enough: -10 XP
- Ignore mental health needs: -15 XP
- Oversleep and miss obligations: -25 XP

*Transportation Penalties (-10 to -50 XP):*
- Bike without lights in dark: -20 XP
- Forget to check in on metro: -30 XP
- Get caught without valid ticket: -50 XP
- Bike on wrong side of path: -15 XP
- Cause bike accident: -40 XP

*Cultural Missteps (-5 to -50 XP):*
- Significant cultural faux pas: -30 XP
- Fail to respect quiet hours: -15 XP
- Inappropriate behavior in public: -25 XP
- Insult Danish customs (unintentional): -20 XP
- Major bureaucratic mistake: -50 XP

*Financial Mismanagement (-10 to -100 XP):*
- Late bill payment: -20 XP
- Tax filing error: -100 XP
- Overspend on non-essentials: -15 XP
- Forget mandatory insurance: -50 XP

**XP Thresholds:**
- **Below 0 XP:** "Struggling" - Game Over scenario approaches
- **0-500 XP:** "Newcomer" - Still learning the ropes
- **500-1500 XP:** "Adapter" - Getting the hang of it
- **1500-3000 XP:** "Resident" - Feeling at home
- **3000-5000 XP:** "Local" - Almost fluent in Danish life
- **5000+ XP:** "Honorary Dane" - Master level

#### 2. Character Stats (Hidden Variables)

Players don't see these as numbers, but they affect gameplay:

**Health:** 
- Affected by: meals, vitamin D, rest, weather preparation
- Impacts: Energy for activities, resistance to getting sick
- Visual feedback: Character appearance (tired vs energized)

**Mental Energy:**
- Affected by: stress, social interactions, cultural challenges
- Impacts: Decision quality, ability to learn, dialogue options available
- Visual feedback: Thought bubble icons, character animations

**Social Reputation:**
- Affected by: NPC interactions, cultural knowledge, helpfulness
- Impacts: NPC reactions, opportunities offered, prices in some shops
- Visual feedback: NPC dialogue tone, body language

**Cultural Fluency:**
- Affected by: time in Denmark, dialogue choices, participated activities
- Impacts: Unlock advanced scenarios, better NPC relationships, hidden XP bonuses
- Visual feedback: Unlocked dialogue options, NPC comments

**Financial Stability:**
- Affected by: job performance, spending habits, bill payments
- Impacts: Available activities, stress levels, certain endings
- Visual feedback: Bank account visual, shopping ability

#### 3. Daily Activity System

**Activity Types:**

*Mandatory Activities (must complete regularly):*
- Work/Job duties (2-3 times per week minimum)
- Grocery shopping (when food depletes)
- Bill/tax payments (on schedule)
- Health maintenance (vitamin D daily)

*Optional Activities (XP opportunities):*
- Explore new areas
- Social events
- Language classes
- Cultural activities
- Help other NPCs

**Activity Properties:**
- **Time Cost:** Each activity takes in-game time (minutes to hours)
- **Energy Cost:** Some activities drain mental/physical energy
- **Risk/Reward:** Higher risk activities (like biking in rain) offer more XP
- **Prerequisites:** Some activities require certain items, stats, or relationships

#### 4. Random Encounter System

**Encounter Frequency:**
- 2-4 random encounters per in-game day
- Frequency increases as player explores more

**Encounter Categories:**

*Helpful Encounters (30%):*
- Danish person offers cycling tip
- NPC needs help (opportunity to gain XP)
- Free community event announcement
- Found money/item

*Neutral Encounters (40%):*
- Weather changes
- Overheard interesting conversations
- Street performer
- Shop having sale

*Challenge Encounters (25%):*
- Bike malfunction
- Forgot item needed for task
- Unexpected bill
- Cultural misunderstanding

*Major Events (5%):*
- Job opportunity
- Relationship milestone
- Bureaucratic deadline
- Seasonal festival

#### 5. Consequence System

**Immediate Consequences:**
- XP gain/loss
- Dialogue reactions
- Item acquisition/loss

**Short-Term Consequences (same in-game week):**
- NPC remember interactions
- Activities become easier/harder
- New opportunities open/close

**Long-Term Consequences (weeks/months later):**
- Story branches based on choices
- Character reputation defines available endgames
- Certain NPCs become friends or avoid player
- Job performance affects opportunities

---

## 5. Progression Systems

### Player Progression

#### Level-Up System (Based on XP Milestones)

**Level 1-5 (Newcomer Phase):**
- **Benefits:** Unlock new areas of Copenhagen, basic activities
- **Theme:** Learning the basics of Danish life
- **Unlocks:** Metro access, grocery stores, basic social venues

**Level 6-10 (Adapter Phase):**
- **Benefits:** Efficiency bonuses (activities take less time), discount at some shops
- **Theme:** Building competence and confidence
- **Unlocks:** Bike customization, advanced dialogue options, side activities

**Level 11-15 (Resident Phase):**
- **Benefits:** Cultural fluency bonuses, unlock "help others" activities, mentor newcomers
- **Theme:** From student to teacher
- **Unlocks:** Complex scenarios, relationship deepening, optional content

**Level 16-20 (Local Phase):**
- **Benefits:** XP loss reduced by 50%, unlock "expert mode" challenges
- **Theme:** Mastering the Danish way
- **Unlocks:** All areas, secret locations, best endings

### Skill Progression (Soft Skills)

Players improve through practice, not explicit skill trees:

**Language Skill:**
- **Level 1:** Only English, miss cultural cues
- **Level 2:** Understand basic Danish, respond in English
- **Level 3:** Mixed Danish/English, understand most situations
- **Level 4:** Primarily Danish, understand nuance
- **Level 5:** Fluent, unlock Danish-only dialogue paths

**Cycling Skill:**
- **Level 1:** Slow, frequent mistakes, often dismount
- **Level 2:** Basic riding, occasional errors
- **Level 3:** Confident cycling, navigate traffic
- **Level 4:** Skilled cyclist, fewer XP losses from bike events
- **Level 5:** "Bike like a Dane" - maximum XP from cycling

**Cultural Navigation Skill:**
- **Level 1:** Constant mistakes, confused by customs
- **Level 2:** Aware of major customs, still learning
- **Level 3:** Navigate most situations appropriately
- **Level 4:** Understand subtle cultural nuances
- **Level 5:** "Cultural chameleon" - recognized as understanding Danish ways

**Bureaucracy Skill:**
- **Level 1:** Overwhelmed by paperwork, make errors
- **Level 2:** Can complete basic forms with help
- **Level 3:** Handle most bureaucracy independently
- **Level 4:** Efficient with forms, rarely make mistakes
- **Level 5:** Master of Danish bureaucracy, can help others

### Unlocks & Rewards

**Area Unlocks:**
- Nørrebro district
- Vesterbro district
- Christianshavn
- Frederiksberg
- Day trips to surrounding areas

**Activity Unlocks:**
- Language exchange meetups
- Danish cooking class
- Cultural festivals
- Swimming in harbor
- Forest walks

**Social Unlocks:**
- Deeper conversations with NPCs
- Romantic relationship options (optional)
- Friend group activities
- Danish family dinner invitations

**Cosmetic Unlocks:**
- Bike customization (colors, baskets, bells)
- Character outfit options (seasonal appropriate)
- Apartment decorations
- Collectible Danish items

**Achievement/Recognition:**
- "CPR Number Obtained" (residence permit)
- "Tax Return Filed Successfully"
- "Made a Danish Friend"
- "Survived a Danish Winter"
- "Bike Master Level 5"
- "Integration Certificate" (endgame)

### Difficulty Scaling

**Adaptive Difficulty:**
- If player loses XP frequently, game offers more helpful NPCs and tutorials
- If player maintains high XP, game introduces more complex scenarios
- Player can adjust difficulty in settings (more/less forgiving)

**Seasonal Difficulty Changes:**
- **Winter:** Harder (dark earlier, cold, vitamin D more important)
- **Spring:** Medium (weather unpredictable)
- **Summer:** Easier (long days, outdoor activities, better mood)
- **Fall:** Medium (getting dark again, preparation needed)

---

## 6. Content & Scope

### Game Structure

**Chapter System:**

**Chapter 1: Arrival (Days 1-14)**
- **Goal:** Survive first two weeks
- **Activities:** 15 unique scenarios
- **Key Moments:** First bike ride, first metro trip, first grocery run, obtaining CPR number
- **Completion:** Successfully navigate 10 daily tasks without hitting 0 XP

**Chapter 2: Settling In (Days 15-45)**
- **Goal:** Build routine and relationships
- **Activities:** 30 unique scenarios
- **Key Moments:** First friend made, first cultural event, first successful tax interaction, weather adaptation
- **Completion:** Reach "Adapter" XP level (500+ XP)

**Chapter 3: Integration (Days 46-90)**
- **Goal:** Master Danish life
- **Activities:** 40 unique scenarios (including callbacks to earlier choices)
- **Key Moments:** Deep NPC relationships, cultural fluency moments, help another newcomer, job advancement
- **Completion:** Reach "Local" XP level (3000+ XP)

**Endgame: Honorary Dane (Day 91+)**
- **Goal:** Perfect your Danish life experience
- **Activities:** Endless mode with rotating challenges
- **Key Moments:** Multiple ending scenarios based on choices
- **Completion:** Achieve "Integration Certificate" milestone

### Locations (2D Environments)

**Starting Areas:**
1. **Player's Apartment** - Base hub, manage health, rest, plan
2. **Neighborhood Street** - Local shops, bike paths, NPCs
3. **Metro Station** - Transport hub, ticketing challenges
4. **Grocery Store** - Shopping mini-game, budget management
5. **Workplace** - Job-specific scenarios

**Unlockable Areas:**
6. **Language School** - Cultural learning activities
7. **Local Park** - Social encounters, relaxation
8. **City Center** - Shopping, culture, events
9. **Harbor Area** - Swimming, walking, special events
10. **Municipal Building** - Bureaucracy challenges
11. **Library** - Research, quiet study, cultural resources
12. **Cafe** - Social hub, fika opportunities
13. **Bicycle Shop** - Bike maintenance and customization
14. **Community Center** - Classes, events, multicultural meetings

### NPC Characters

**Recurring Main NPCs (10-15):**

1. **Lars - The Helpful Neighbor**
   - Role: Tutorial guide, friendly local
   - Personality: Patient, kind, loves teaching about Denmark
   - Arc: From guide to genuine friend

2. **Sofie - Fellow Expat**
   - Role: Relatable companion, similar struggles
   - Personality: Humorous, cynical but optimistic
   - Arc: Support buddy to confident resident alongside player

3. **Henrik - The Co-Worker**
   - Role: Work mentor, cultural bridge
   - Personality: Professional, direct (classic Danish communication)
   - Arc: Teaches work culture and becomes ally

4. **Mette - Grocery Store Clerk**
   - Role: Regular interaction point, judgment-free helper
   - Personality: Warm, chatty, remembers details
   - Arc: Barometer of player's language progress

5. **Kasper - The Cyclist**
   - Role: Cycling mentor, represents "bike culture"
   - Personality: Passionate about bikes, slightly intense
   - Arc: From intimidating expert to respected fellow cyclist

6. **Dr. Jensen - Local GP**
   - Role: Health advisor, vitamin D reminder
   - Personality: Practical, caring, evidence-based
   - Arc: Helps player understand Danish healthcare

7. **Bureaucracy Bjørn - Municipal Worker**
   - Role: The "boss" of paperwork challenges
   - Personality: By-the-book, surprisingly helpful if approached correctly
   - Arc: From intimidating to respected ally

8. **Freja - Social Butterfly**
   - Role: Gateway to Danish social circles
   - Personality: Extroverted, inclusive, culture bearer
   - Arc: Opens doors to true Danish social integration

9. **Thomas - The Skeptic**
   - Role: Challenging NPC, not immediately welcoming
   - Personality: Protective of Danish culture, can be won over
   - Arc: From distant to respectful of player's effort

10. **Emma - The Student**
    - Role: Young perspective, language practice partner
    - Personality: Curious, helpful, learning about multiculturalism
    - Arc: Mutual learning relationship

**Generic NPCs (50+):**
- Shop workers
- Random pedestrians
- Metro passengers
- Café patrons
- Event attendees
- Other office workers
- Service providers

### Scenarios & Activities (100+ unique situations)

**Transportation Scenarios:**
- Learning bike signals
- Navigating Copenhagen traffic circles
- First time biking in rain
- Bike breakdown and repair
- Finding stolen bike
- Metro ticket confusion
- Rush hour etiquette
- Bike parking challenges

**Shopping & Daily Errands:**
- Understanding Danish grocery products
- Returnables/pant system
- Budgeting for Danish prices
- Finding ethnic/home country foods
- Pharmacy navigation
- Barbershop/salon cultural differences
- Reading product labels in Danish

**Bureaucracy & Admin:**
- Registering at municipal office
- Setting up bank account
- Understanding tax system
- Residence permit renewals
- Subscribing to utilities
- Understanding insurance requirements
- Navigating healthcare system
- Nemid/digital signature setup

**Social Scenarios:**
- Coffee invitation etiquette
- Danish dinner party rules
- Understanding hygge
- Dating cultural differences (optional romance path)
- Making friends in Denmark
- Language exchange awkwardness
- Workplace birthday traditions (cake)
- Navigating personal space norms

**Cultural Events:**
- Christmas traditions (Jul)
- Sankt Hans (Midsummer)
- Birthday flag traditions
- May Day celebrations
- Community dinners
- Sports club participation
- Music festivals

**Work Scenarios:**
- Understanding Danish work hours
- Lunch culture at office
- Direct communication style
- Meeting etiquette
- Work-life balance expectations
- Performance review navigation
- Team building events

**Health & Wellness:**
- Vitamin D importance (especially winter)
- Dealing with seasonal affective disorder
- Finding exercise routines
- Healthcare system navigation
- Mental health support access
- Dressing for weather
- Understanding "friluftsliv" (outdoor life)

**Challenge Scenarios:**
- Getting sick in foreign country
- Bike accident handling
- Lost wallet/ID situation
- Language barrier frustration
- Homesickness moments
- Cultural misunderstanding resolution
- Financial emergency
- Weather-related crisis
- Missing important deadline

### Estimated Playtime

**To Complete Main Story:**
- **Casual Players:** 10-15 hours
- **Average Players:** 8-12 hours
- **Focused Players:** 6-10 hours

**To 100% Completion:**
- Unlock all areas: +2 hours
- Max all relationships: +4 hours
- Perfect all endings: +3 hours
- Find all collectibles: +2 hours
- **Total:** 20-25 hours

**Endless Mode:**
- Unlimited replay value
- New daily challenges
- Seasonal events

### Replay Value

**Multiple Paths:**
- 10+ different nationality starting backgrounds
- 8+ different job types
- Branching story based on choices
- Multiple ending scenarios

**Randomization:**
- Daily encounters vary each playthrough
- NPC dialogue adapts to previous interactions
- Weather and seasonal events create variety

**Challenge Modes:**
- "Hardcore Mode" - More severe XP losses
- "Speed Run" - Reach Local status as fast as possible
- "Perfectionist" - Zero XP losses allowed
- "Helper" - Focus on helping other NPCs

---

## 7. User Interface & Controls

### Input Methods

**Primary: Keyboard & Mouse**
- Arrow Keys / WASD: Character movement
- Mouse: Point and click on interactive objects/NPCs
- Space Bar: Interact/confirm dialogue
- ESC: Menu/pause
- Tab: Inventory/stats screen
- M: Map
- E: Quick action (context sensitive)

**Alternative: Gamepad Support**
- Left Stick: Movement
- A Button: Interact/confirm
- B Button: Cancel/back
- Start: Menu
- Select: Map
- D-Pad: Quick menus

**Future: Touch (Mobile)**
- Tap to move/interact
- Swipe for menus
- Pinch for map zoom

### HUD Elements (Always Visible)

**Top Left:**
- Current XP / XP to next level
- Current time of day
- Current day/date
- Weather icon

**Top Right:**
- Health indicator (heart icon with visual state)
- Mental energy indicator (brain icon with visual state)
- Current money (DKK)

**Bottom Center:**
- **Objectives Panel** — always-visible strip showing the player's current active task (e.g. "Buy groceries from Netto" or "Talk to Lars"). Tapping/clicking expands to show full task list. Turns green with a checkmark animation when a task is completed. Colour-coded: gold for Story Missions, blue for Daily Maintenance tasks. See [Quest & Objectives System FDD](features/quest-objectives-system.md).
- Control hints (context sensitive, appear only near interactables)

**Minimalist Design:**
- HUD can be collapsed to just icons
- Full detail on hover
- Option to hide non-critical elements

### Menus & Screens

**Main Menu:**
- New Game (character creation)
- Continue (save slots)
- Settings
- Credits
- Quit

**Pause Menu:**
- Resume
- Daily Summary (XP log)
- Map
- Character Stats
- Inventory
- Relationships (NPC tracker)
- Encyclopedia (learned Danish culture facts)
- Settings
- Save & Quit

**Character Stats Screen:**
- XP and level progress bar
- Skills overview (language, cycling, cultural, bureaucracy)
- Achievements earned
- Days survived
- XP history graph

**Inventory Screen:**
- Items owned (groceries, tools, collectibles)
- Money available
- Bills/obligations upcoming
- Important documents (CPR number, permits)

**Relationship Tracker:**
- List of met NPCs
- Relationship level (stranger → acquaintance → friend → close friend)
- Last interaction date
- Special notes about each NPC

**Encyclopedia/Codex:**
- Cultural facts learned
- Danish words/phrases discovered
- Area descriptions
- Activity guides
- Tips and tricks unlocked

**Daily Summary Screen (End of Day):**
- Activities completed
- XP gained breakdown
- XP lost breakdown
- Net XP change
- Notable events
- Next day preview (upcoming obligations)

### Accessibility Features

**Visual Accessibility:**
- Colorblind modes (deuteranopia, protanopia, tritanopia)
- Text size scaling (100% - 200%)
- High contrast mode
- Dyslexia-friendly font option

**Gameplay Accessibility:**
- Difficulty adjustment (XP loss multiplier)
- Extended timer options (for timed activities)
- Auto-save frequency adjustment
- Tutorial repetition available
- Hint system (can be turned on/off)

**Language Support:**
- English (primary)
- Danish (native option for Danish speakers)
- Additional languages (German, Spanish, French) for accessibility
- All dialogue voice acted (optional) or text-only

---

## 8. Art & Audio Direction

### Visual Style

**Art Style: "Cozy Scandinavian Realism"**
- **Inspiration:** Gris, A Short Hike, Night in the Woods meets Danish design aesthetics
- **Palette:** Muted pastels, warm grays, pops of Scandinavian colors (blues, yellows)
- **Mood:** Approachable, friendly, realistic but slightly stylized
- **Details:** High attention to Danish architectural details, authentic signage

**Character Design:**
- Simple but expressive 2D sprites
- Visible personality through stance and animation
- Diverse representation of real Copenhagen demographics
- Seasonal outfit changes (practical Danish fashion)
- Player character highly customizable

**Environment Design:**
- Authentic Copenhagen architecture (Victorian, Modern, Industrial)
- Recognizable landmarks (stylized for legal reasons)
- Weather visually impacts scenes (rain, snow, fog, sunshine)
- Day/night cycle with beautiful lighting
- Seasonal changes visible (leaves falling, snow accumulation, spring flowers)

**UI/UX Style:**
- Clean, minimalist (Danish design principles)
- Inspired by Danish design brands (flat, functional, beautiful)
- Warm colors for positive feedback, cool colors for challenges
- Consistent iconography
- Smooth animations and transitions

### Animation Style

**Character Animation:**
- Walk/run cycles (8-direction movement)
- Biking animation (smooth, realistic)
- Emotion animations (happy, sad, confused, cold, tired)
- Interaction animations (shopping, talking, eating, resting)
- Idle animations (character reacts to environment)

**Environment Animation:**
- Weather effects (rain, snow, wind moving trees)
- Traffic (cars, bikes, pedestrians moving)
- Flags waving
- Seasonal changes

**Feedback Animation:**
- XP gain: Positive sparkle effect
- XP loss: Subtle shake or dark cloud
- Level up: Bright celebration animation
- Complete task: Checkmark with satisfying sound

### Audio Direction

**Music Style: "Hygge Electronica meets Nordic Folk"**
- **Inspiration:** Ólafur Arnalds, Peter Broderick, relaxing electronic music
- **Mood:** Calm, cozy, occasionally melancholic, ultimately hopeful
- **Instruments:** Piano, strings, subtle electronic beats, ambient soundscapes

**Music Tracks (10-15 tracks):**
- "Arrival" - Curious, slightly anxious (Character creation/first days)
- "Morning Commute" - Energetic, rhythmic (Biking/metro music)
- "Hygge Hour" - Warm, cozy (Indoor social scenes)
- "Winter Blues" - Melancholic, minimal (Winter/struggle moments)
- "Spring Awakening" - Hopeful, bright (Progression milestones)
- "København Nights" - Ambient, peaceful (Evening/exploration)
- "Bureaucracy Waltz" - Quirky, slightly comical (Admin tasks)
- "Friendship Theme" - Heartwarming, sincere (NPC bonding moments)
- "Mastery" - Triumphant, sophisticated (Late game/achievements)

**Dynamic Music System:**
- Music transitions based on player emotion/situation
- Layers add as complexity increases
- Seasonal variations of themes
- Intensity adjusts to success/struggle

**Sound Effects:**
- Authentic Copenhagen ambiance (bikes, tram bells, seagulls, rain)
- UI sounds (satisfying clicks, whooshes)
- Character footsteps (different for surfaces)
- Bike sounds (bell, chain, brakes, riding on different surfaces)
- Metro sounds (doors, announcements, track noise)
- Indoor acoustics (café chatter, grocery store beeps)
- Weather sounds (rain on windows, wind, snow crunch)

**Voice Acting (Optional):**
- Key NPCs fully voiced
- Danish language with English subtitles for immersion
- Danish actors for authenticity
- Player character unvoiced (self-insert experience)

### Theme & Setting

**Copenhagen, Denmark - Present Day**
- Recognizable but legally distinct version of Copenhagen
- Mix of historic charm and modern urban life
- Four seasons fully represented
- Weather as character (typical Danish unpredictability)
- Authentic Danish culture without stereotypes

**Cultural Authenticity:**
- Consultants from Danish community
- Real expat experiences incorporated
- Avoid clichés and outdated stereotypes
- Respect for Danish culture while acknowledging challenges
- Educational without being preachy

---

## 9. Success Metrics

### Player Engagement Metrics

**Primary Metrics:**
- **Session Length:** Target 30-45 minutes average
- **Return Rate:** 70%+ players return next day (first week)
- **Completion Rate:** 40%+ players complete Chapter 2 (settling in)
- **Story Completion:** 25%+ players reach endgame

**Secondary Metrics:**
- **Exploration:** 60%+ players explore optional content
- **Social Features:** 50%+ players max at least one NPC relationship
- **Achievement Hunting:** 30%+ players pursue specific achievements
- **Encyclopedia Engagement:** 40%+ players read cultural facts

### Retention Goals

**Day 1:** 100% (baseline)
**Day 3:** 70% retention
**Day 7:** 50% retention
**Day 30:** 30% retention (highly successful)

### Educational Impact

**Cultural Learning:**
- Players should learn 20+ real Danish cultural facts
- Players can identify 50+ Danish words/phrases
- Players understand 3+ major cultural differences
- Post-game survey: "I learned something valuable about Danish culture"

### Community Goals

**Social Features (if implemented):**
- Player tips sharing
- Screenshot sharing (beautiful Copenhagen moments)
- Strategy discussions
- Expat community building

### Critical Success Factors

**Must Achieve:**
- ✅ "The game is fun" - 4.0 / 5.0 average rating
- ✅ "I learned about Danish culture" - 80%+ agree
- ✅ "Combat feels responsive" - N/A for this game
- ✅ "I felt immersed in the world" - 75%+ agree
- ✅ "I'll recommend this to others" - 70%+ would recommend

**Soft Goals:**
- Featured by Danish cultural/educational organizations
- Used in ESL or Danish language programs
- Positive reception from expat communities
- Coverage by games media focusing on unique/cultural games

### Failure Metrics (Red Flags)

- **Player Frustration:** If 30%+ players report "too punishing" or "not fun"
- **Poor Tutorial:** If 20%+ players quit in first 30 minutes
- **Cultural Insensitivity:** Any significant negative feedback from Danish players/expats
- **Repetitive Gameplay:** If players report boredom before Chapter 2 completion

---

## 10. Monetization & Distribution

### Business Model
**Premium (Pay Once)**
- **Price Point:** $12.99 - $14.99 USD
- **Rationale:** Affordable for target audience, no predatory mechanics, educational value

**Alternative (if free-to-play):**
- Base game free
- Optional cosmetic DLC (bike skins, outfits)
- "Support the Developer" donation option
- No pay-to-win mechanics
- No ads

### Distribution Platforms

**Primary:**
- Steam (PC/Mac/Linux)
- Itch.io (indie game community)

**Secondary:**
- Epic Games Store
- GOG (DRM-free preference)

**Future:**
- Nintendo Switch (perfect for portable cozy gaming)
- Mobile (iOS/Android) - Scaled down version

**Institutional:**
- Educational licensing for language schools
- Cultural centers and Danish institutions

---

## 10. Additional Design Considerations

### Win Conditions

**Primary Victory:**
- **"Integration Certificate"** - Reach 5000+ XP and maintain for 7 consecutive days
- Unlock special ending sequence
- "You've truly adapted to Danish life!"

**Alternative Victory Paths:**
- **"Social Butterfly"** - Max relationships with 8+ NPCs
- **"Bureaucracy Master"** - Complete all admin tasks perfectly
- **"Cultural Scholar"** - Unlock 100% of encyclopedia entries
- **"Bike Legend"** - Achieve cycling skill level 5 and bike 100km total

### Failure Conditions

**Game Over (Soft):**
- Reach -100 XP or below for 3 consecutive days
- **Result:** "Perhaps Denmark isn't for everyone" ending
- Option to restart from last checkpoint or adjust difficulty

**No True Failure:**
- Game is forgiving and encourages learning from mistakes
- Even "failure" endings provide closure and lessons
- Can always restart with knowledge gained

### Special Features

**Photo Mode:**
- Capture beautiful Copenhagen moments
- Share on social media
- Build in-game scrapbook

**New Game Plus:**
- Start with cultural knowledge retained
- Harder scenarios
- New dialogue options (player character now experienced)

**Seasonal Events:**
- Real-time seasonal content updates
- Limited time challenges
- Community events

---

## Conclusion

**Denmark Survival** is a unique blend of life simulation, RPG progression, and cultural education. It aims to create empathy for the expat experience while teaching players about Danish culture in an engaging, fun way.

The game's success will be measured not just by sales or player retention, but by its ability to educate and create understanding. Players should finish the game feeling like they've lived in Denmark, understanding both the challenges and joys of adapting to a new culture.

By focusing on authentic, relatable experiences and avoiding stereotypes, Denmark Survival can carve out a unique niche in the gaming landscape while serving an underserved audience of expats, culture enthusiasts, and educational institutions.

---

**Next Steps for Development:**
1. Create detailed Feature Design Documents for major systems (see specs/features/)
2. Develop first playable prototype (Chapter 1: Arrival)
3. Playtest with Danish nationals and expats for authenticity
4. Iterate based on cultural consultant feedback
5. Build vertical slice for Chapter 2
6. Full production based on validated design

---

*This is a living document that will evolve based on playtesting feedback and development discoveries. Version 1.0 represents initial design vision.*