# 🏠 Feature Design Document: First Day Onboarding

## 1. Feature Overview

### Feature Name
**First Day Onboarding — "Velkommen til Danmark"**

### Purpose
The First Day Onboarding is the game's handshake with the player. Before any system is explained abstractly, it must be *experienced* through story. Day 1 is a fully authored, scripted sequence that introduces — in a deliberately gentle order — every mechanic the player needs to survive their first real free-play session. The player should arrive at Day 2 knowing exactly how to talk to NPCs, how to navigate to and enter a shop, how to buy items, how to use items from their inventory, and why any of that earns XP. They should also feel a spark of curiosity about what tomorrow holds.

This feature does not just serve new players — it **sets the emotional tone** for the whole game. The right first day makes players feel *capable*. A bad first day makes them feel lost and they do not return.

### Priority
- [x] **Critical** (MVP — must be the very first thing a player experiences after character creation)

### Dependencies
- Character Creation System (player name, nationality, and job are established before Day 1 begins)
- Dialogue & NPC System (Lars's opening conversation is the gateway)
- Quest & Objectives System (Objectives Panel must be active on Day 1)
- Inventory & Economy System (player buys and uses items on Day 1)
- Day/Night Cycle (Day 1 must run as a normal day and end with the Day Summary)
- XP & Progression System (XP rewards must display throughout Day 1)

---

## 2. Player-Facing Design

### The Opening Moment

The player's character stands in a small, sparsely furnished Nørrebro apartment. A cardboard box sits on the kitchen floor — unpacked. Through the window, a grey Copenhagen sky and the sound of distant bicycles. The atmosphere is quiet, slightly empty, but warm. This is the player's first 20 seconds: wordless, purely environmental storytelling.

A knock at the door. Lars appears in the doorway — a friendly, middle-aged Dane with a thermos of coffee and a patient smile.

*"Hej! You must be the new neighbour. I am Lars. I heard you arrived last night — how are you holding up?"*

The player's first dialogue choice appears. Both options are valid; neither is a trap:
- *"Honestly, a bit overwhelmed — but glad to be here."*
- *"Excited! I've been looking forward to this for months."*

Lars responds warmly to either choice, acknowledging the player's feelings, then gets practical:

*"Well, the first thing you'll need is food. The fridge is empty, yes? There is a Netto just around the corner — very close. Here, I wrote down the basics you'll need."*

Lars produces a small hand-written list. A brief animation shows the paper being handed over. The **Objectives Panel** at the bottom of the screen lights up for the first time:

> **📋 Story Mission: Buy groceries from Netto**
> *Lars gave you a shopping list: Rugbrød, pasta, and milk.*

Lars adds: *"And — I know it sounds strange — but pick up some Vitamin D tablets if you see them. Danish winters are famous."* He waves and leaves. The player is now free to move.

This sequence should feel like a conversation with a friend, not a tutorial. No mechanic is named. No system pop-ups interrupt. The player simply has a friend and a task.

---

### The World Walk (Apartment → Netto)

The path to Netto is always visible from the apartment — it is a short, direct walkable route. The neighbourhood is alive:

- A few pedestrians walk past, heads down, with the characteristic Danish polite-but-private demeanour
- A bicycle is parked against a lamppost with a small padlock (Kasper's bike — visible but not interactive yet, planting future familiarity)
- A community notice board near the corner has a poster: "Nørrebro Language Exchange — every Tuesday." (passively introduces the language school concept)

**Pant Bottle Discovery:**
A single aluminium can (a Carlsberg, naturally) sits on the kerb, slightly shimmering with a subtle sparkle effect. The player does not need to pick it up, but hovering nearby shows the interaction hint: *"Press E — Pick up pant bottle."* Doing so adds the bottle to inventory and shows a small tooltip:

> *"Pant bottle — return at any shop counter for 1-3 DKK. Denmark has the world's highest bottle return rate!"*

This is the player's first encounter with a **world-collectible item**. It is entirely optional but rewarding. It also teaches that the world contains items worth picking up, and explains the pant system without a lecture.

**Entering Netto:**
The Netto storefront has a door with a glowing green door-frame indicator — the universal "you can enter this building" signal. A context hint appears at the bottom when the player walks near the door:

> *"Press E — Enter Netto"*

This is the player's first **"Enter building" action**. It teaches that shops are entered through doors (not by talking to a world-NPC through a speech bubble). The screen transitions to the shop interior view.

---

### Inside Netto — The First Shop Experience

Mette is behind the counter. She greets the player:

> *"Hej! First time here? Welcome — let me know if you need help finding anything."*

The player can choose to ask for help or browse independently. Asking for help is rewarded with Mette highlighting the grocery list items on the shop interface.

**Shop Interface:**
The shop is displayed as a scrollable item list — organised by category (food, health, etc.). Each item shows:
- Item icon and name
- Price in DKK
- A brief flavour description

The items from Lars's grocery list (Rugbrød, pasta, milk) are highlighted in soft gold — easy to identify. Items the player cannot afford are faded/dimmed. The player's current DKK balance is displayed at the top.

The player adds items to their basket and reviews the total before confirming. This multi-step "basket → confirm → purchase" flow is **deliberately simple** on Day 1 — it teaches the full shop loop at a gentle pace.

If the player brought a pant bottle, the "Return pant bottles" option appears at the counter before checkout — awarding 1 DKK and reinforcing the mechanic they found in the world.

**Vitamin D (Optional but Nudged):**
The health & vitamins category contains Vitamin D tablets. They cost 80 DKK (real Danish pharmacy price). On Day 1, the player has enough starting money to afford them, but they are not on the mandatory list. A subtle "💡 Recommended" label sits next to vitamin D — honouring Lars's advice without forcing the purchase.

After confirming the purchase:
- Items move to inventory
- Money deducted with a brief flash animation on the DKK counter
- Objectives Panel updates: ✅ *"Buy groceries from Netto"* → *(checkmark)* → new task appears: **"Return home and eat something."**

XP notification floats: **+15 XP — First grocery run complete!**

---

### The First Inventory Use

Back outdoors (or even inside the shop), the player can open their inventory with **Tab**. The screen slides open to show the items just purchased, neatly categorised. Each item has a brief description — Rugbrød reads: *"Dense rye bread. A staple of Danish households since the Middle Ages."*

The food items have a **Use** button. Pressing it on the Rugbrød triggers:
- A brief 1-second eat animation on the player character
- The health indicator on the HUD gains a small visual bump (warmth/colour improvement)
- XP notification: **+5 XP — You ate a proper Danish meal!**
- Inventory quantity decrements from 1 to 0

This is the **first inventory use action**. It teaches that items are consumed from the inventory screen, and that eating has a visible health benefit. The combination of visual, audio, and XP feedback is the triple-reinforcement the player needs to cement the behaviour.

---

### Ending the Day

After eating, the most natural next action is to return home. Lars may be visible outside the apartment building saying:

> *"Did you find the Netto all right? Godt! Get some rest — the first few days can be tiring."*

This conversation is optional but gives a warm sense of closure on Day 1. Walking to the apartment door and pressing E shows:

> **"Go to sleep and end Day 1?"**
> *[Rest for the night] [Not yet — keep exploring]*

Choosing "Rest for the night" triggers the Day Summary screen. Choosing "Not yet" allows free exploration of the neighbourhood — but after in-game midnight, the day ends automatically with a gentle nudge: *"You've been awake a long time. Time to sleep."*

---

### Day 1 Summary Screen

The Day Summary screen uses a warm parchment-style card design. It shows:

| Event | XP |
|---|---|
| Talked with Lars | +10 |
| First grocery run completed | +15 |
| Ate a meal | +5 |
| Picked up pant bottle *(optional)* | +2 |
| Returned pant bottles *(optional)* | +1 |
| **Day 1 Total** | **+31–33 XP** |

Below the XP summary, a "Looking Ahead" section previews Day 2:
> *"Lars mentioned there's a free introductory class at the language school nearby. It might be worth checking out tomorrow."*

This single line plants a new Story Mission and tells the player: *there is somewhere to go tomorrow*. The loop is closed.

---

## 3. Rules & Balance

### Starting Conditions on Day 1

| Variable | Starting Value | Notes |
|---|---|---|
| Player Money | 1,200 DKK | Enough for groceries + vitamin D + a safety buffer |
| Inventory | Empty | Player starts with nothing — everything is earned |
| Health | 75% | Slightly below full — eating will top it up |
| Language Skill | 1 | English only; Danish options locked |
| XP | 0 | Day 1 is designed to end at ~30–35 XP |
| Active Relationships | Lars: 30/100 | He's friendly from the start |

### Day 1 Cannot Fail

Day 1 has no lose condition. The player:
- Cannot run out of time (day does not auto-end until they sleep)
- Cannot run out of money on the grocery run (starting DKK is calibrated to cover the list)
- Cannot lose XP on Day 1 (no penalty triggers in the first day's authored content)
- Cannot miss an objective (tasks stay active until completed; there is no expiry on Day 1)

This is intentional. The point of Day 1 is **teaching, not challenging**. Day 2 onwards introduces real stakes.

### XP Events on Day 1

| Action | XP | Notes |
|---|---|---|
| Complete Lars dialogue | +10 | Awarded when conversation ends |
| Pick up pant bottle (optional) | +2 | Small reward for curiosity |
| Enter Netto for the first time | +5 | One-time "new location" discovery bonus |
| Complete purchase at Netto | +15 | Awarded on purchase confirmation |
| Return pant bottles (optional) | +1 | Per bottle returned |
| Use item from inventory for first time | +5 | One-time first-use reward |
| End Day 1 (go to sleep) | +10 | "Survived your first day" reward |

---

## 4. Visual Design

**Apartment Interior:**
- Small, slightly cluttered. Single bed, kitchen counter, window with a Copenhagen neighbourhood view. The cardboard box sits in the corner — a visual metaphor for "not yet settled." As the game progresses and the player earns cosmetic unlocks, the apartment gradually fills out and softens.

**Netto Exterior:**
- Distinctive red-and-white colours of a real Netto store, stylised. The door indicator (small glowing green frame) is subtle but visible — it should not look like a video game UI element hovering over the door; more like a gentle light.

**Grocery List Prop:**
- When Lars hands over the list, it appears as a small animated pop-up: a hand-written paper note with three items. It then shrinks into the Objectives Panel. This animation bridges the narrative (Lars giving a list) with the UI (the objectives system).

---

## 5. Audio Design

**Apartment ambient:** City background — distant bicycles, occasional car, wind. Slightly melancholy, but cozy.

**Lars's knock:** Three confident knocks on a wooden door.

**Grocery list hand-off:** Paper rustling, then a soft "quest accepted" chime from the Objectives Panel.

**Pant bottle pickup:** A light metallic "clink."

**Shop ambient:** Supermarket background hum — refrigerators, muted conversations, the beep of a checkout.

**Purchase confirmation:** A satisfying cash register "ka-ching" — iconic and rewarding.

**Eating Rugbrød:** A quiet, satisfying crunch. Small.

**Day 1 XP Summary:** A gentle, triumphant 3-note piano motif. Warm. Not grandiose — more like *"well done, you"* than *"VICTORY."*

---

## 6. Acceptance Criteria

### Player Experience Goals
- A player who has never touched the game should complete Day 1 without confusion in under 10 minutes
- By the end of Day 1, the player should be able to describe: how to talk to NPCs, how to enter a shop, how to buy something, how to open inventory and use an item, and how to end the day
- The player should feel positive and curious — not overwhelmed or lost
- The player should begin Day 2 with a clear destination in mind (the language school)

### Functional Requirements
- Lars's dialogue must trigger automatically on game start (after character creation)
- The Objectives Panel must display the active task at all times during Day 1
- The grocery list items must be highlighted/distinguished in the Netto shop UI
- The pant bottle must appear as a world-collectible sprite with interaction indicator
- The shop must be accessible via the "Enter" door interaction (not via an NPC speech bubble)
- Day 1 must end at the Day Summary screen when the player chooses to sleep
- Day Summary must preview at least one Day 2 task

### Success Metrics
- Less than 20% of players abandon the game before completing Day 1
- 90%+ of players who complete Day 1 open their inventory at least once
- 80%+ of players who complete Day 1 enter Netto
- Day 1 average completion time: 8–12 minutes

---

## 7. References & Inspiration

- **Stardew Valley** — The first day gives the player a clear goal (clear the farm) without overwhelming systems. Progression feels earned, not guided.
- **A Short Hike** — Minimal UI, objectives discovered through conversation. The world teaches rather than explains.
- **Spiritfarer** — Onboarding through story: every mechanic is introduced by a character who *needs* you to use it.
- **Life is Strange** — The first chapter establishes tone, relationships, and consequences before any real decisions carry weight.
