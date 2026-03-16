# 💰 Feature Design Document: Inventory & Economy System

## 1. Feature Overview

### Feature Name
**Inventory & Economy System**

### Purpose
Money is one of the biggest stressors of expat life, and Denmark is famously expensive. The Inventory & Economy System simulates the financial pressure and daily spending decisions of living in Copenhagen — budgeting groceries, paying bills, understanding the pant (bottle return) system, and managing rent on a variable salary. It gives weight to every purchase decision and creates natural tension between "spending to survive" and "saving for comfort." Items in inventory represent real daily-life objects (groceries, bike accessories, important documents), not fantasy loot — grounding the game in authentic lived experience.

### Priority
- [x] **High** (Important for quality experience)

### Dependencies
- XP & Progression System (financial decisions affect XP)
- Daily Activity System (shopping and bill-paying consume time periods)
- Character Creation System (starting job determines salary)
- Random Encounter System (encounters may give/take items or money)
- Transportation System (metro costs, bike maintenance costs)

---

## 2. Player-Facing Design

### Player Actions
1. **Check wallet**: View current DKK balance anytime via HUD or pause menu
2. **Browse shop**: Enter a store and view available items with prices
3. **Buy items**: Select and purchase groceries, supplies, or services
4. **Use items**: Consume food, take vitamin D, apply bike repair kit, etc.
5. **Return bottles (pant)**: Collect and return bottles/cans for 1-3 DKK each
6. **Pay bills**: Handle rent, utilities, phone, insurance bills when they arrive
7. **Check inventory**: View carried items through inventory screen
8. **Check financial overview**: View income, expenses, and upcoming obligations

### Visual Design

**HUD Element (Always Visible):**
- DKK balance displayed top-right with a small coin icon
- Balance flashes green briefly on income, red briefly on expense
- Low balance warning: coin icon turns red + subtle pulse when below 500 DKK

**Inventory Screen (Pause Menu):**
- Grid layout: 4 columns, scrollable
- Item icons with quantity badges (e.g., "Rugbrød x2")
- Categories: Food, Health, Transport, Documents, Collectibles
- Each item shows: icon, name, quantity, brief description
- Spoilable food items show freshness indicator (green → yellow → red → gone)

**Shop Interface:**
- List view with item icon, name, price in DKK
- Player's current balance shown at top
- Items player can't afford are dimmed (not hidden)
- "Cart" system: select multiple items, then confirm purchase
- Total cost updates as items are added to cart

**Bill Notification:**
- Bills appear as a letter icon in HUD with a due date countdown
- Opening shows bill details: amount, what it's for, due date, late penalty
- Pay button deducts from balance; "Remind Later" sets notification for next day

**Financial Overview (Pause Menu):**
- Monthly income from job (based on character's job)
- Expense breakdown: Rent, Groceries, Transport, Bills, Other
- Simple bar chart showing income vs expenses
- Upcoming bills with due dates

### Audio Design
- **Purchase**: Cash register "ka-ching" — satisfying completion sound
- **Can't afford**: Sad wallet sound — a deflated puff or coin rattle
- **Bill arrives**: Mail drop / envelope slide sound
- **Bill paid**: Same cash register sound, slightly lower pitch
- **Bill overdue**: Warning chime, slightly urgent
- **Item pickup**: Light positive "pop"
- **Pant return**: Metallic clink for each bottle, then register sound for total
- **Food spoiled**: Squelchy discard sound
- **Low balance warning**: Subtle ticking clock

### Player Feedback
- **Price context**: Prices feel high because they're real Danish prices — 45 DKK for a sandwich, 80 DKK for a meal out — player should feel the "Denmark tax"
- **Purchase satisfaction**: Successful shopping should feel like accomplishment (you navigated Danish products!)
- **Financial stress**: Running low on money should create genuine tension without game-over anxiety
- **Pant rewards**: Returning bottles should feel weirdly satisfying and teach the Danish recycling system

---

## 3. Rules & Mechanics

### Core Rules

**Currency:**
- All transactions in Danish Kroner (DKK)
- Starting DKK depends on character's job (set during character creation)
- No decimal values — everything rounds to nearest DKK

**Income:**
- Salary paid bi-weekly (every 14 in-game days)
- Salary amount based on job type:

| Job | Monthly Salary (DKK) | Bi-weekly Payment |
|-----|--------------------|--------------------|
| IT Professional | 35,000 | 17,500 |
| Teacher | 30,000 | 15,000 |
| Student | 6,500 (SU grant) | 3,250 |
| Chef | 27,000 | 13,500 |
| Nurse | 32,000 | 16,000 |
| Researcher | 38,000 | 19,000 |
| Artist | 20,000 | 10,000 |
| Engineer | 40,000 | 20,000 |

**Mandatory Expenses (Monthly):**

| Expense | Cost (DKK) | Due Day | Late Penalty |
|---------|-----------|---------|--------------|
| Rent | 6,000-10,000 | 1st of month | -30 XP + eviction warning |
| Utilities (el/gas/water) | 800-1,200 | 15th of month | -15 XP |
| Phone/Internet | 200-400 | 20th of month | -10 XP |
| Health Insurance | 0 (covered by tax) | N/A | N/A |
| A-kasse (unemployment ins.) | 300-500 | Monthly | -20 XP |
| Media license (if applicable) | 200 | Quarterly | -10 XP |

**Tax:**
- Income tax deducted automatically from salary (~38% average)
- Player sees net salary, not gross
- Annual tax filing event: correct filing = +30 XP, errors = -50 to -100 XP

### Inventory Rules

**Capacity:**
- No strict weight/slot limit for daily items (this isn't a dungeon crawler)
- Practical limit: player can carry groceries for ~3 days of meals at once
- Bike basket upgrade: can carry more from shopping trips
- Large items (furniture, appliances) are "delivered" — they don't take inventory slots

**Item Categories:**

**Food & Groceries:**

| Item | Price (DKK) | Meals Provided | Spoils After |
|------|------------|----------------|--------------|
| Rugbrød (rye bread) | 25 | 4 meals | 5 days |
| Smørrebrød ingredients | 40 | 3 meals | 3 days |
| Pasta + sauce | 30 | 3 meals | Never (dry goods) |
| Fresh vegetables | 35 | 2 meals | 4 days |
| Milk | 12 | 4 uses | 5 days |
| Frozen meals | 45 | 2 meals | Never (frozen) |
| Kanelsnegl (cinnamon roll) | 30 | 1 treat | 2 days |
| Coffee | 50 | 7 days of coffee | Never |
| Beer (Carlsberg/Tuborg) | 15 | 1 use, social item | Never |

**Health Items:**

| Item | Price (DKK) | Effect | Duration |
|------|------------|--------|----------|
| Vitamin D supplements | 80 | Prevents health drain | 30 days supply |
| Cold medicine | 60 | Recovers from sick faster | 3 uses |
| Energy drink | 25 | Temporary mental energy boost | 1 use |

**Transport Items:**

| Item | Price (DKK) | Effect |
|------|------------|--------|
| Rejsekort (travel card) | 80 (card) + balance | Required for metro/bus |
| Rejsekort top-up | 100-500 | Adds balance to travel card |
| Monthly transit pass | 400 | Unlimited metro/bus for 30 days |
| Bike repair kit | 120 | Fix flat tire without bike shop |
| Bike lights | 150 | Required for night cycling |
| Bike lock (better) | 200 | Reduces bike theft risk |

**Documents (Special — Non-purchasable):**

| Item | How Obtained | Purpose |
|------|-------------|---------|
| CPR Number card | Bureaucracy quest | Required for many activities |
| NemID/MitID | Bureaucracy quest | Digital identity for bills/taxes |
| Residence Permit | Story progression | Legal status document |
| Work Contract | Character creation | Proof of employment |
| Health Insurance Card | After CPR registration | Healthcare access |

**Collectibles:**

| Item | How Obtained | Purpose |
|------|-------------|---------|
| Danish flag pin | Gift from NPC | Cosmetic, +relationship |
| Hygge candle | Buy at shop | Apartment decoration |
| Vintage bike bell | Random encounter reward | Bike accessory |
| Danish cookbook | Gift/Buy | Unlock new recipes |

### Pant (Bottle Return) System

This is a uniquely Danish mechanic and a fun way to earn small amounts:

- **How it works**: Certain containers (beer bottles, soda cans, plastic bottles) have a pant symbol
- **Collection**: Player picks up pant-eligible items throughout the day (from own purchases or found in world)
- **Return**: Visit a "pantalon" (reverse vending machine) at grocery stores
- **Payout**: Small DKK per item (1-3 DKK each)
- **Capacity**: Can carry up to 10 pant items at a time
- **Teaching moment**: Cultural insight about Denmark's 90%+ recycling rate

| Container Type | Pant Value (DKK) |
|---------------|-----------------|
| Small can/bottle | 1 |
| Medium bottle (0.5L) | 1.50 |
| Large bottle (1L+) | 3 |

### Shopping Rules

- **Store hours**: Grocery stores open 7:00-22:00 (weekdays), 8:00-20:00 (weekends)
- **Closed holidays**: Stores closed on major Danish holidays (Christmas, Easter)
- **Browsing cost**: Entering store doesn't cost time; purchasing + leaving costs ~30 minutes
- **Unknown products**: Some items have Danish-only labels. Higher language skill = more product info visible
- **Sale items**: Random sales each week; 20-40% off select items
- **Budget feedback**: After purchase, UI briefly shows "Today's spending: X DKK"

### Financial XP Impact

| Action | XP Impact |
|--------|----------|
| Pay rent on time | +15 XP |
| Pay all bills on time (full month) | +20 XP bonus |
| Miss rent | -30 XP |
| Miss any bill | -10 to -20 XP |
| Return pant bottles | +5 XP (per trip) |
| Overspend (spend >80% of salary in a period) | -15 XP |
| Maintain healthy food supply | +10 XP (weekly) |
| Run out of food | -10 XP per day without food |
| Complete tax filing correctly | +30 XP |
| Tax filing errors | -50 to -100 XP |
| Reach savings goal (optional) | +25 XP |

### Edge Cases
- **Zero DKK**: Player can't buy anything but can still do free activities, return pant, and wait for next salary. Game over only happens from sustained XP loss, not zero money.
- **Overshopping**: If player buys perishables they can't eat in time, food spoils and is wasted — teaching budgeting.
- **Missed salary**: If player is fired from job (sustained poor work performance), salary stops until new job found.
- **Gift items**: NPCs may gift food or items — these are free and usually culturally significant.
- **Found items**: Random encounters can provide free items; these go directly to inventory.

### Balancing Goals
- **Money should feel tight but manageable**: Players should need to think about purchases but should never feel hopeless
- **Food is the daily pressure point**: Needing to eat forces regular shopping and budgeting
- **Bills create medium-term planning**: Monthly obligations teach forward-thinking
- **Pant is a charming small reward**: Not a money-maker, but a fun cultural mechanic
- **Financial mastery is satisfying**: Going from "barely making rent" to "comfortable with savings" is a progression arc in itself

---

## 4. Game Feel & Polish

### Desired Feel
- **Shopping should feel realistic**: Real Danish products, real prices, real confusion of a non-Danish speaker reading labels
- **Bills should feel like responsibility**: Seeing a bill arrive should create a small "oh, right" moment — not dread
- **Running low on money should feel tense**: But always recoverable (no permanent fail state from money alone)
- **Returns & pant should feel satisfying**: The small dopamine hit of returning bottles and getting money back

### Juice Elements
- [ ] Coins animate from balance counter on purchase
- [ ] Food items in inventory show freshness with a visual indicator (leaf = fresh, brown = spoiling)
- [ ] Bill envelope slides in with a paper-slide animation
- [ ] Pant return machine animation: each bottle slides in, clink sound, counter increments
- [ ] "Shopping complete" checkmark + bag-rustle sound when leaving store
- [ ] Salary arrival: coins rain down into balance counter briefly
- [ ] Budget bar visually fills/depletes as player spends/earns

### Input Handling
- **Shop navigation**: Click/tap items to add to cart; quantity +/- buttons
- **Bill payment**: Single-click "Pay" button (no complex form)
- **Inventory access**: Tab key / pause menu → Inventory tab
- **Quick-use item**: Hover item → "Use" button (for consumables)
- **Pant return**: Walk to machine in grocery store → automatic collection return

---

## 5. Progression & Unlocking

### When Available
- **Basic inventory**: Available from Day 1 (starting items from character creation)
- **Grocery shopping**: Unlocked Day 1 (part of tutorial)
- **Bill system**: First bill arrives Day 5-7
- **Pant system**: Introduced Day 3-5 (NPC teaches it)
- **Financial overview screen**: Available after first bill arrives
- **Tax filing**: Seasonal event (once per in-game year)

### How to Unlock
- Base system is always present
- Individual shops unlock as areas are explored
- Discount opportunities unlock through NPC relationships
- Better financial tools (budget tracker, savings goals) unlock at higher bureaucracy skill

### Tutorial / Introduction
- **Day 1**: Character has starting money and starting items. First task involves going to grocery store — tutorial teaches shop interface and buying essentials
- **Day 3-5**: NPC (Lars or Mette) teaches the pant system — "Did you know you can return these bottles for money?"
- **Day 5-7**: First bill arrives with an explanation pop-up: "Your phone bill has arrived! You have X days to pay it."
- **Day 14**: First salary arrives — "Your first Danish paycheck! After taxes, you received X DKK."

---

## 6. Integration with Other Systems

### Related Features
- **XP & Progression**: Financial responsibility generates XP; neglect costs XP
- **Daily Activities**: Shopping and bill-paying are activities that consume time periods
- **Character Creation**: Starting job determines salary and starting DKK
- **Random Encounters**: Can give/take items or money (found money, unexpected bill, etc.)
- **Transportation**: Metro costs come from DKK balance; bike maintenance costs money
- **Dialogue & NPC**: Some NPCs offer discounts, gifts, or financial advice
- **Day Cycle**: Shops have open hours tied to time of day; bills have due dates tied to day count
- **Encyclopedia**: Learning about pant system, tax system, etc. unlocks entries

### System Dependencies
- State management (track DKK balance, inventory, bill due dates)
- UI system (shop interface, inventory grid, bill notifications)
- Timer system (food spoilage, bill due dates)
- HUD system (balance display, bill icon)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] DKK balance displays correctly in HUD and updates on all transactions
- [ ] Player can browse, select, and purchase items from shops
- [ ] Items appear in inventory after purchase
- [ ] Food items spoil after their designated time
- [ ] Bills arrive on schedule with correct amounts
- [ ] Late bill payment triggers XP penalty
- [ ] Salary arrives bi-weekly with correct net amount
- [ ] Pant return machine accepts bottles and credits correct DKK
- [ ] Inventory displays items with correct quantities and categories
- [ ] Player cannot purchase items when DKK is insufficient
- [ ] Financial overview displays income, expenses, and upcoming bills
- [ ] Items can be used/consumed from inventory
- [ ] Documents section shows obtained documents

### Experience Requirements
- [ ] Prices feel authentically Danish (not too cheap, not absurdly expensive)
- [ ] Shopping feels like navigating a real Danish grocery store
- [ ] Financial pressure is present but not punishing
- [ ] Pant system is charming and educational
- [ ] Bill management feels like responsible adulting in a fun way

### Performance Requirements
- [ ] Shop interface renders instantly on entry
- [ ] Inventory opens within 0.3 seconds
- [ ] No lag on purchase transactions

---

## 8. Testing & Validation

### Playtesting Goals
- Do players understand the DKK economy quickly?
- Is the food spoilage system clear, or are players confused about why items disappear?
- Are prices balanced — can players survive on their salary with reasonable budgeting?
- Is the pant system fun, or does it feel like a chore?
- Do bill notifications create healthy tension or anxiety?
- Do players feel progression in their financial comfort?

### Success Metrics
- 90%+ of players successfully complete their first shopping trip in the tutorial
- Players pay at least 80% of bills on time (indicating system is clear, not punishing)
- 60%+ of players voluntarily return pant bottles (indicating it's fun, not forced)
- Average player has a positive DKK balance 85% of the time (economy is balanced)
- Budget-savvy players can save meaningful amounts (financial mastery feels earned)

---

## 9. Examples & References

### Similar Features in Other Games
- **Stardew Valley (Economy)**: Simple but effective buy/sell economy with seasonal crops and shipped goods revenue. **What they did well**: Prices are clear, selling is satisfying, and money progression tracks with game progression.
- **Papers, Please (Financial Pressure)**: Daily expenses that force ethical choices. **What they did well**: Money as a narrative tool — every purchase is a moral decision.
- **Animal Crossing (Shopping & Collecting)**: Daily shop rotation, seasonal items, adorable economy. **What they did well**: Shopping is a joy, not a chore. Items have personality.
- **Recettear (Item Shop RPG)**: Buy low, sell high with market fluctuation. **What they did well**: Made economic management the core fun loop.

### Inspiration
- Real Danish grocery store experience (Netto, Fakta, Irma, SuperBrugsen) — product confusion, price shock, the joy of mastering local brands
- The Danish pant system as a cultural curiosity — recycling rate pride, the satisfying clink of the machine
- Expat budget anxiety — "Why does cheese cost THAT much?" moments
- Danish tax system complexity — SKAT letters as mini-bosses

### Iteration History
- **v1**: Initial design — DKK economy, grocery shopping, bills, pant system, food spoilage
