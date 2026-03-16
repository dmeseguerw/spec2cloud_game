# Task 016: Economy & Financial System

## Description
Implement the DKK economy — salary income, shop purchasing, bill payments, and financial tracking. This covers the monetary side of the economy: where money comes from (salary), where it goes (shopping, bills, fines), and how it's tracked. The shopping interface is part of this task.

## Dependencies
- Task 003: State Management Foundation (money in registry)
- Task 007: UI Framework (shop interface, bill notifications)
- Task 012: XP & Level Progression (financial XP rewards/penalties)
- Task 013: Day Cycle & Season (bill due dates, salary schedule)
- Task 015: Inventory Management (items purchased go to inventory)

## Technical Requirements

### EconomyEngine (`src/systems/EconomyEngine.js`)
Central financial management:

**Income:**
- Salary paid bi-weekly (every 14 in-game days)
- Salary amount from character's job (after ~38% tax deduction — player sees net)
- Salary arrival triggers notification + XP event
- Salary can change (job promotion via major random event)

**Salary Table (Net Monthly after tax):**

| Job | Gross Monthly | Net Bi-weekly (~62%) |
|-----|--------------|---------------------|
| IT Professional | 35,000 | ~10,850 |
| Teacher | 30,000 | ~9,300 |
| Student (SU) | 6,500 | ~2,015 |
| Chef | 27,000 | ~8,370 |
| Nurse | 32,000 | ~9,920 |
| Researcher | 38,000 | ~11,780 |
| Artist | 20,000 | ~6,200 |
| Engineer | 40,000 | ~12,400 |

**Expenses — Bills:**
Recurring bills arrive on schedule and must be paid before due date:

| Bill | Amount (DKK) | Due Day | Late Penalty |
|------|-------------|---------|--------------|
| Rent | 6,000-10,000 | 1st monthly | -30 XP |
| Utilities | 800-1,200 | 15th monthly | -15 XP |
| Phone/Internet | 200-400 | 20th monthly | -10 XP |
| A-kasse | 300-500 | Monthly | -20 XP |

- Bills arrive as notifications 5 days before due
- Paying on time: +15 XP (rent), +10 XP (others)
- Paying late: XP penalty applied, bill can still be paid
- Ignoring for extended period: escalating consequences

**Tax Filing Event:**
- Triggered once per in-game "year" (every 88 days / 4 seasons)
- Interactive form: player makes choices (correct/incorrect)
- Correct filing: +30 XP
- Errors: -50 to -100 XP depending on severity

### BillManager (`src/systems/BillManager.js`)
- Generate bills on schedule based on current day
- Track bill status: pending, paid, overdue
- Apply late penalties on day after due date
- Bills stored in registry as array of bill objects
- Each bill: `{ id, type, amount, dueDay, status, arrivedDay }`

### ShopSystem (`src/systems/ShopSystem.js`)
Handle shopping interactions at stores:

**Shop Data (`src/data/shops.json`):**
- Define shops with: name, location, openHours, items (array of item IDs with prices)
- Different shops have different inventories (grocery store vs pharmacy vs bike shop)
- Store hours: Weekday 7:00-22:00, Weekend 8:00-20:00
- Closed on major holidays

**Shopping Flow:**
1. Player enters shop (interaction trigger in world)
2. ShopScene overlay opens showing available items
3. Player browses items with prices
4. Player adds items to cart (running total displayed)
5. Checkout: total deducted from DKK if sufficient
6. Items added to inventory
7. If insufficient funds: "Can't afford" message, purchase blocked

**Shop UI (ShopScene):**
- List view: item icon, name, price, quantity selector (+/-)
- Player balance shown at top
- Running cart total
- "Buy" button (disabled if insufficient funds)
- Items player can't afford are dimmed
- Language skill affects product info visibility (higher skill = more info)

**Sale System:**
- Random items on sale each week (20-40% off)
- Sale items marked with a sale badge

### Financial Overview
Accessible from pause menu:
- Monthly income (last salary)
- Monthly expenses breakdown (rent, utilities, groceries, transport, other)
- Current balance
- Upcoming bills with due dates
- Simple bar chart: income vs expenses

### Financial XP Impact
All financial actions have XP consequences as defined in FDD:
- Pay rent on time: +15 XP
- Pay all bills on time (full month): +20 XP bonus
- Return pant bottles: +5 XP per trip
- Maintain healthy food supply: +10 XP weekly
- Run out of food: -10 XP per day
- Overspend >80% of salary: -15 XP
- Complete tax filing: +30 XP (correct) / -50 to -100 XP (errors)

## Acceptance Criteria
- [ ] Salary arrives bi-weekly with correct net amount per job
- [ ] Bills generate on schedule with correct amounts
- [ ] Bills can be paid, deducting from DKK balance
- [ ] Late bill payment applies correct XP penalty
- [ ] Shop interface displays items with prices
- [ ] Player can add items to cart and purchase
- [ ] Purchase deducts from DKK and adds items to inventory
- [ ] Insufficient funds prevents purchase
- [ ] Shop hours enforced (closed outside hours, closed on holidays)
- [ ] Financial overview displays accurate income/expense data
- [ ] Sale items show discounted prices
- [ ] Tax filing event triggers at correct interval
- [ ] Financial XP rewards/penalties apply correctly
- [ ] All financial state persists across save/load

## Testing Requirements
- **Unit Test**: Salary calculation correct for each job type
- **Unit Test**: Bill generation on correct schedule
- **Unit Test**: Bill payment updates status and deducts DKK
- **Unit Test**: Late penalty applies on day after due date
- **Unit Test**: Shop purchase deducts correct amount and adds items
- **Unit Test**: Insufficient funds check blocks purchase
- **Unit Test**: Sale price calculation (20-40% off)
- **Unit Test**: Store hours enforcement (open/closed detection)
- **Unit Test**: Tax filing XP outcomes for correct/incorrect
- **Unit Test**: Financial XP impacts applied at correct triggers
- **Integration Test**: Full bill cycle: bill arrives → notification → pay → XP reward
- **Integration Test**: Full shop flow: enter → browse → buy → items in inventory → DKK reduced
- **Integration Test**: Salary arrives on day 14 → balance increases → notification shown
- **Coverage Target**: ≥85% for EconomyEngine, BillManager, ShopSystem

## References
- FDD: Inventory & Economy (complete financial specification)
- FDD: Character Creation (job salary table)
- FDD: Daily Activity (shopping as activity)
- GDD Section 3: Game Mechanics (financial XP tables)
- GDD Section 5: Content & Scope (shopping scenarios)
