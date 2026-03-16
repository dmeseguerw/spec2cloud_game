# Task 015: Inventory Management System

**GitHub Issue:** [#33 - Task 015: Inventory Management System](https://github.com/dmeseguerw/spec2cloud_game/issues/33)
**GitHub PR:** [#37 - [WIP] Implement inventory management system for items](https://github.com/dmeseguerw/spec2cloud_game/pull/37)

## Description
Implement the inventory system for managing items the player carries — groceries, health items, transport items, documents, and collectibles. This includes the inventory data model, the inventory UI screen, item usage/consumption, and food spoilage mechanics. This task covers the "item" half of the economy system (monetary transactions are in Task 016).

## Dependencies
- Task 003: State Management Foundation (inventory in registry)
- Task 004: Scene Framework (InventoryScene overlay)
- Task 007: UI Framework (inventory grid, item panels)
- Task 013: Day Cycle (food spoilage on day advance)

## Technical Requirements

### Inventory Data Model (`src/data/items.json`)
Define all game items as a data file:

**Item Schema:**
- `id` — Unique string identifier
- `name` — Display name
- `description` — Short description text
- `category` — One of: food, health, transport, document, collectible
- `icon` — Asset key for item icon
- `stackable` — Boolean (can multiple stack in one slot)
- `maxStack` — Maximum quantity per stack
- `usable` — Boolean (can player "use" this item)
- `useEffect` — What happens on use (restore health, take vitamin D, etc.)
- `spoilsAfter` — Number of days until food spoils (null for non-perishable)
- `price` — Purchase price in DKK (0 for non-purchasable)
- `pantValue` — Pant return value in DKK (0 for non-pant items)

**Item Categories (from FDD):**
- Food: rugbrød, smørrebrød ingredients, pasta, fresh vegetables, milk, frozen meals, kanelsnegl, coffee, beer
- Health: vitamin D supplements, cold medicine, energy drink
- Transport: Rejsekort, bike repair kit, bike lights, bike lock
- Documents: CPR card, NemID, residence permit, work contract, health insurance card
- Collectibles: Danish flag pin, hygge candle, vintage bike bell, Danish cookbook

### Inventory Manager (`src/systems/InventoryManager.js`)
Functions for inventory operations:

- `addItem(registry, itemId, quantity)` — Add item to inventory; stack if possible; emit event
- `removeItem(registry, itemId, quantity)` — Remove quantity; remove entry if zero; emit event
- `hasItem(registry, itemId, minQuantity)` — Check if player has item with minimum quantity
- `useItem(registry, itemId)` — Execute useEffect; reduce quantity by 1; emit event
- `getItemsByCategory(registry, category)` — Filter inventory by category
- `getInventoryCount(registry)` — Total items count
- `processSpoilage(registry, currentDay)` — Remove items past spoil date; return list of spoiled items

### Food Spoilage System
- Each perishable food item tracks `acquiredDay` when added to inventory
- `spoilsAfter` defines how many days until it expires
- On day advance (end of day), `processSpoilage()` runs:
  - Check each food item: if `currentDay - acquiredDay >= spoilsAfter` → remove
  - Emit notification for each spoiled item: "Your [item] has gone bad!"
  - Removed spoiled items are lost (waste)

### Item Use Effects
Define effects for usable items:
- Vitamin D: Prevents daily vitamin D XP penalty (-10 XP), one use per day
- Cold medicine: Speeds up sickness recovery, reduces sick penalties
- Energy drink: +15 temporary mental energy
- Bike repair kit: Fixes flat tire without visiting bike shop
- Food items: Mark "ate today" flag — prevents hunger penalty

### InventoryScene (`src/scenes/InventoryScene.js`)
Full inventory UI overlay:

**Layout:**
- Grid view of inventory items (4 columns, scrollable)
- Category filter tabs: All, Food, Health, Transport, Documents, Collectibles
- Each item slot shows: icon, name, quantity badge, freshness indicator (food only)
- Selected item detail panel: name, description, category, freshness/spoilage status
- "Use" button for usable items
- "Drop" button (optional — with confirmation)

**Freshness Indicator (Food Only):**
- Green: Fresh (0-50% of spoil time elapsed)
- Yellow: Getting old (50-80% elapsed)
- Red: About to spoil (80-100% elapsed)
- Show "Spoils in X days" text

**Documents Section:**
- Non-interactive display of obtained documents
- Grayed placeholder for documents not yet obtained

**Collectibles Section:**
- Display with small achievement-style icons
- Count of found / total

### Pant (Bottle Return) System
- Beer bottles and soda cans are pant-eligible items
- Pant items accumulate in inventory (up to 10)
- "Return Pant" interaction at grocery store pantalon machine
- Returns all pant items at once, credits DKK per item (1-3 DKK each)
- +5 XP per pant return trip
- Notification shows total DKK earned from return

## Acceptance Criteria
- [ ] Items can be added and removed from inventory
- [ ] Stackable items correctly stack up to max stack size
- [ ] Food items display freshness indicator based on spoilage timeline
- [ ] Spoiled food is automatically removed on day advance
- [ ] Using vitamin D prevents the daily vitamin D penalty
- [ ] Using food items marks player as fed for the day
- [ ] Inventory grid displays items with correct icons, names, and quantities
- [ ] Category filter tabs show correct filtered results
- [ ] Item detail panel shows all item properties
- [ ] Documents section shows obtained vs unobtained documents
- [ ] Pant return credits correct DKK and grants +5 XP
- [ ] Inventory persists across save/load
- [ ] "Use" button works for usable items and reduces quantity
- [ ] Notifications appear for spoiled food and pant returns

## Testing Requirements
- **Unit Test**: `addItem()` correctly adds new items and stacks existing ones
- **Unit Test**: `removeItem()` handles partial and full removal
- **Unit Test**: `hasItem()` checks minimum quantity correctly
- **Unit Test**: `useItem()` applies effect and decrements quantity
- **Unit Test**: `processSpoilage()` removes items past expiry and keeps fresh items
- **Unit Test**: Freshness calculation returns correct status for all ranges
- **Unit Test**: Pant return calculates total DKK correctly from mixed pant values
- **Unit Test**: Item data validation — all items have required fields
- **Integration Test**: Add food → wait days → spoilage removes it → notification appears
- **Integration Test**: Buy from shop → appears in inventory → use item → quantity decreases
- **Integration Test**: Open InventoryScene → filter by category → correct items shown
- **Coverage Target**: ≥85% for InventoryManager, spoilage logic, item data validation

## References
- FDD: Inventory & Economy (item tables, spoilage, pant system)
- ADR 0004: State Management (inventory in registry)
- GDD Section 6: UI & Controls (inventory screen layout)
