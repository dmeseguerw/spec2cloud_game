# 📖 Feature Design Document: Encyclopedia & Cultural Learning System

## 1. Feature Overview

### Feature Name
**Encyclopedia & Cultural Learning System (Codex)**

### Purpose
The Encyclopedia is the player's personal journal of Danish cultural knowledge — a growing collection of facts, phrases, tips, and insights earned through gameplay. It transforms accumulated experience into tangible, browsable knowledge. Every cultural encounter, every Danish phrase overheard, every mistake made teaches the player something real about Denmark. The Encyclopedia captures these lessons and lets players revisit them, reinforcing learning and giving a satisfying "look how much I know now" feeling. It bridges the GDD's core pillar of "Authentic Cultural Immersion" with "Educational without feeling like a textbook" — learning happens through play, and the Encyclopedia is the proof.

### Priority
- [x] **Medium** (Enhances quality; game is playable without it but much weaker)

### Dependencies
- Random Encounter System (encounters unlock cultural facts)
- Dialogue & NPC System (conversations unlock phrases and cultural entries)
- Daily Activity System (completing activities unlocks guides and tips)
- XP & Progression System (encyclopedia entries can grant small XP bonuses)
- Transportation System (travel entries unlock through transport use)
- Inventory & Economy System (shopping/financial entries from economic activity)

---

## 2. Player-Facing Design

### Player Actions
1. **Open codex**: Access Encyclopedia from pause menu
2. **Browse categories**: Navigate between category tabs (Culture, Language, Places, Activities, Tips)
3. **Read entries**: Select and read a full entry
4. **Track discovery progress**: See how many entries unlocked per category
5. **Review phrases**: Access collected Danish phrases with pronunciation guides
6. **Discover new entries**: Entries unlock automatically through gameplay (notification appears)

### Visual Design

**Encyclopedia Screen:**
- Full-screen overlay accessed from pause menu
- Styled as a personal journal / notebook with slightly worn paper texture
- Five category tabs across the top, each with a distinct icon
- Left panel: scrollable list of entries (unlocked entries named, locked entries shown as "???" with a faint lock icon)
- Right panel: selected entry content with illustrations
- Discovery counter per tab: "12 / 24 discovered"
- Overall completion percentage shown at bottom: "Total: 47% Discovered"

**Category Tabs:**

| Tab | Icon | Color Accent | Content Type |
|-----|------|-------------|--------------|
| 🏛️ Culture | Danish flag | Red/White | Cultural customs, traditions, social norms |
| 🗣️ Language | Speech bubble | Blue | Danish words, phrases, pronunciation |
| 📍 Places | Map pin | Green | Area descriptions, landmarks, neighborhood facts |
| 🎯 Activities | Checkmark | Orange | Activity guides, how-to's, tips for daily tasks |
| 💡 Tips | Lightbulb | Yellow | Gameplay tips, life advice, survival strategies |

**Entry Format:**
- **Title**: Bold, descriptive (e.g., "Hygge: More Than Just Cozy")
- **Illustration**: Small pixel art icon or illustration related to the topic
- **Body text**: 3-6 sentences of engaging, concise content
- **Source tag**: How the player discovered it (e.g., "Learned from: Conversation with Freja")
- **Related entries**: Links to connected entries (clickable)

**Unlock Notification (In-Game):**
- Small toast notification slides in bottom-left: "📖 New Entry: [Entry Name]"
- Gold sparkle on the icon
- Auto-dismisses after 3 seconds
- Clicking it opens the entry directly

### Audio Design
- **Open encyclopedia**: Book page-turning sound
- **Tab switch**: Soft paper shuffle
- **Entry unlock notification**: Discovery chime — short, warm, satisfying
- **Scrolling entries**: Subtle paper rustle
- **Close encyclopedia**: Book closing thud

### Player Feedback
- **Discovery is rewarding**: Each new entry feels like a little treasure found
- **Completion is motivating**: Seeing "12/24" drives exploration and curiosity
- **Entries are genuinely interesting**: Real Danish facts players might share with friends
- **No forced reading**: Entries are there when player wants them, never interrupt gameplay

---

## 3. Rules & Mechanics

### Core Rules

**Entry Discovery:**
- Entries unlock automatically through gameplay triggers
- Player is never told "go find encyclopedia entries" — they happen naturally
- Each trigger fires only once (no duplicate notifications)
- Some entries have multiple unlock paths (e.g., hear about hygge from NPC OR experience a hygge event)
- Locked entries show "???" title — player can see how many remain undiscovered per category

**Trigger Types:**

| Trigger | Example |
|---------|---------|
| NPC Conversation | Freja explains hygge → "Hygge" entry unlocks |
| Random Encounter | Witness birthday flag tradition → "Danish Birthday Flags" entry unlocks |
| Area Discovery | Visit Nørrebro first time → "Nørrebro: The Diverse Heart" entry unlocks |
| Activity Completion | File taxes successfully → "The Danish Tax System" entry unlocks |
| Skill Milestone | Reach Cycling Skill 3 → "The Danish Cycling Culture" entry unlocks |
| Time/Season | Winter arrives → "Surviving Danish Winter" entry unlocks |
| Item Interaction | Return first pant bottles → "Pant: Denmark's Recycling Genius" entry unlocks |
| Mistake Made | Cultural faux pas → "What NOT to Do in Denmark" entry unlocks |

### Content Categories & Entries

**🏛️ Culture (24 entries):**

| Entry Title | Trigger | Content Theme |
|------------|---------|--------------|
| Hygge: More Than Just Cozy | NPC conversation or hygge event | What hygge really means |
| Janteloven: The Law of Jante | NPC interaction about modesty | Danish egalitarian values |
| Danish Birthday Flags | Witness or participate | Flag on birthday tradition |
| The Danish Handshake | First formal meeting | Greeting customs |
| Quiet Hours & Apartment Life | Violate quiet hours or learn from neighbor | Noise rules 22:00-7:00 |
| The Danish Work-Life Balance | Work experience | Working hours, leaving at 4pm |
| Coffee Culture (Not Fika, Almost) | Café visit | Danish coffee traditions |
| Trust-Based Society | Leave belongings unattended | Danish trust culture |
| The Concept of "Friluftsliv" | Outdoor activity | Outdoor living philosophy |
| Danish Healthcare: It's Free(ish) | Visit Dr. Jensen | How healthcare works |
| Christmas in Denmark (Jul) | Christmas season event | Juleaften, nisser, risalamande |
| Sankt Hans: Midsummer Night | Midsummer event | Bonfire, witch burning, celebration |
| Danish Humor: Dry and Dark | NPC tells a joke | Understanding Danish comedy |
| The Danish Flag (Dannebrog) | See flags in neighborhood | World's oldest state flag |
| Scandinavian Design | Visit store or apartment | Minimalism philosophy |
| May Day in Denmark | May 1st event | Labor day traditions, Fælledparken |
| The Royal Family | See palace / NPC mention | Danish monarchy's role |
| Smørrebrød: Open Sandwich Art | Eat or prepare smørrebrød | Open-faced sandwich culture |
| Danish Parenting: Free-Range Kids | Observe in park | Strollers outside, independence |
| The Welfare State | Pay taxes / NPC discussion | Tax → services philosophy |
| Fredagsbaren (Friday Bar) | Workplace social event | Workplace drinking culture |
| Fastelavn: Danish Carnival | Seasonal event | Cat out of barrel, dressing up |
| Grundlovsdag: Constitution Day | June 5th event | Danish constitution celebration |
| Danish Directness | NPC is blunt | Communication style vs rudeness |

**🗣️ Language (20 entries):**

| Entry Title | Trigger | Content |
|------------|---------|---------|
| Hej & Hej Hej: Hello & Goodbye | First Danish greeting | Basic greeting + farewell |
| Tak: The Most Important Word | Successful transaction | Thank you + variations (mange tak, tusind tak) |
| Undskyld: Excuse Me/Sorry | Bump into someone / faux pas | Apology + getting attention |
| Rødgrød med Fløde | NPC challenge / joke | The pronunciation test |
| Numbers 1-10 in Danish | Shopping | Basic counting |
| Hygge (Word Entry) | Hygge cultural entry | Untranslatable words |
| Smørrebrød (Word Entry) | Food encounter | Compound word breakdown |
| Kaffe: Coffee Culture Words | Café visit | Coffee ordering vocabulary |
| Cykel Vocabulary | Cycling activities | Bike-related Danish words |
| Danish Weather Words | Weather events | Regn, sol, sne, blæst |
| Supermarket Danish | First shopping trip | Produce, dairy, bread terms |
| Please Doesn't Exist | Cultural misstep | Danish lacks direct "please" |
| Skål: Cheers! | Social drinking event | Toasting culture |
| Frokost vs Middag | Meal confusion | Danish meal names |
| Colors in Danish | Shopping for clothes | Color vocabulary |
| Days of the Week | Schedule planning | Mandag through søndag |
| Emergency Phrases | Health/emergency event | Help, 112, hospital |
| Workplace Danish | Office interactions | Meeting, email, deadline terms |
| Danish Tongue Twisters | NPC teaches | Fun pronunciation practice |
| Slang & Informal Danish | Close NPC friendship | Casual speech |

**📍 Places (14 entries):**

| Entry Title | Trigger | Content |
|------------|---------|---------|
| Your Apartment: Home Base | Game start | Your starting neighborhood |
| The Metro System | First metro ride | Copenhagen metro facts |
| Nørrebro: The Diverse Heart | Visit Nørrebro | Neighborhood character |
| Vesterbro: Hip & Happening | Visit Vesterbro | Area description |
| Christianshavn: Canals & Community | Visit Christianshavn | Area with Christiania |
| Frederiksberg: Green & Elegant | Visit Frederiksberg | Parks, architecture |
| City Center (Indre By) | Visit city center | Shopping, Strøget, Tivoli |
| The Harbor (Havnen) | Visit harbor | Copenhagen harbor culture |
| The Local Park | Visit park | Danish park culture |
| Your Workplace | Start work | Your job environment |
| Municipal Building (Borgerservice) | Visit for bureaucracy | How Danish bureaucracy works |
| The Library | Visit library | Free resources, culture hub |
| The Grocery Store | First shopping | Danish supermarket culture |
| The Bicycle Shop | Visit bike shop | Copenhagen bike infrastructure |

**🎯 Activities (16 entries):**

| Entry Title | Trigger | Content |
|------------|---------|---------|
| How to Bike in Copenhagen | First bike ride | Traffic rules, signals, etiquette |
| Grocery Shopping 101 | First shopping trip | Store layout, products, pant |
| Using the Metro | First metro trip | Check-in, zones, rejsekort |
| Paying Bills in Denmark | First bill received | MobilePay, netbank, due dates |
| Filing Danish Taxes | Tax event | SKAT system overview |
| Getting Your CPR Number | CPR registration quest | Process and importance |
| Setting Up NemID/MitID | Digital ID quest | Danish digital identity |
| Making Danish Friends | First friendship milestone | Social approaches that work |
| Surviving Danish Winter | First winter season | Vitamin D, clothing, light therapy |
| The Pant System | First bottle return | How recycling returns work |
| Navigating the Health System | First doctor visit | GP, referrals, emergency |
| Finding a Danish Bank | Financial quest | Account setup, Dankort |
| Danish Cooking Basics | Cook first meal | Simple Danish recipes |
| Language Exchange Tips | Language class / NPC | How to practice Danish |
| Apartment Rules & Etiquette | Learn from neighbor / mistake | Shared spaces, noise, recycling |
| Job Culture in Denmark | Work experience | Flat hierarchy, trust, flex hours |

**💡 Tips (12 entries):**

| Entry Title | Trigger | Content |
|------------|---------|---------|
| Always Check Your Bike Lights | First light violation | Why lights matter in Denmark |
| Dress in Layers | First weather mistake | Danish weather wisdom |
| Vitamin D is Not Optional | Health warning | Why Danes take supplements |
| Save Your Receipts | Shopping experience | Return policies, expense tracking |
| Learn 5 Danish Words a Day | Language milestone | Practical learning strategy |
| Don't be Late | First late consequence | Danish punctuality culture |
| Embrace the Darkness | First winter | Coping with dark months |
| MobilePay is King | First payment | Denmark's cashless culture |
| The 80/20 Grocery Rule | Budget milestone | Spend 80% on essentials |
| Say Yes to Social Invitations | Social interaction | Breaking into Danish circles |
| Join a Club or Forening | NPC suggestion | Danish community structure |
| Complain About the Weather | Reach relationship milestone | Universal Danish bonding topic |

### Variables
- **Total entries**: ~86 across all categories
- **Entries available at MVP**: Minimum 50 (covering all categories)
- **Entry unlock rate**: ~2-4 per in-game day (early game), ~1-2 per day (late game)
- **Estimated completion**: Casual player discovers ~50% in one playthrough; completionist discovers ~85-90%
- **100% completion**: Requires multiple playthroughs with different character builds

### Edge Cases
- **Duplicate trigger**: If an entry can be unlocked by multiple triggers, only the first trigger fires the unlock notification
- **Entry references NPC player hasn't met**: Entries are written generically enough to work regardless of which NPC triggered them
- **All entries in category unlocked**: Tab shows a completion star/badge; brief celebration notification
- **Player opens encyclopedia before any entries**: Welcome message: "Your Danish knowledge journal is empty — but it won't stay that way for long!"

### Balancing Goals
- **Entries are rewards, not requirements**: No gameplay mechanic depends on reading entries
- **Discovery is natural**: Player should never grind for entries — they come from playing normally
- **Content is genuinely interesting**: Every entry should teach something a real person moving to Denmark would benefit from knowing
- **Completion is aspirational**: 100% is hard enough to encourage replay but doesn't lock important content

---

## 4. Game Feel & Polish

### Desired Feel
- **Discovery should feel delightful**: "Oh cool, I learned something new!" — like finding a footnote in a favorite book
- **Browsing should feel cozy**: The encyclopedia is the game's version of curling up with a book about Denmark
- **Completion should feel proud**: "I really DO know a lot about Denmark now!"
- **No FOMO**: Missing entries should inspire curiosity, not anxiety

### Juice Elements
- [ ] New entry notification slides in with a golden sparkle
- [ ] Entry unlock counter animates when number increases (counter rolls up)
- [ ] Full category completion triggers a small confetti burst + badge
- [ ] Journal pages have subtle paper texture and hand-drawn style elements
- [ ] Tabs have a physical-feeling click when switching
- [ ] Scrolling the entry list has slight page-flip momentum
- [ ] Locked entries ("???") have a subtle shimmer suggesting hidden content

### Input Handling
- **Open encyclopedia**: Pause menu → Encyclopedia tab; or keyboard shortcut (E or J)
- **Navigate tabs**: Click tab or left/right arrow keys
- **Scroll entries**: Mouse scroll or up/down arrows
- **Select entry**: Click or Enter
- **Close**: Escape or click X
- **Related entry links**: Click to jump directly to linked entry

---

## 5. Progression & Unlocking

### When Available
- **Encyclopedia accessible**: From Day 1 (available in pause menu)
- **First entries**: Pre-populated with 2-3 starter entries (your apartment area, basic greeting "Hej")
- **Steady discovery**: 2-4 new entries per day during early game
- **Diminishing rate**: 1-2 per day as player discovers more, encouraging diverse play to find remaining entries

### How to Unlock
- Entries unlock entirely through natural gameplay — no "research" activity required
- Different playstyles discover different entries first:
  - Social players: unlock Language and Culture entries faster
  - Explorer players: unlock Places entries faster
  - Diligent players: unlock Activities and Tips entries faster

### Tutorial / Introduction
- **Day 1**: After discovering their apartment area, player gets first entry unlock notification. Brief tooltip: "You discovered a Codex entry! Access your growing knowledge of Denmark through the Encyclopedia in the pause menu."
- No further tutorialization needed — the notification system teaches itself

---

## 6. Integration with Other Systems

### Related Features
- **Random Encounters**: ~30% of encounters trigger encyclopedia entries via cultural tips
- **Dialogue & NPC**: Specific NPC conversations unlock Language and Culture entries
- **Daily Activities**: Completing new activities unlocks Activity entries
- **Day Cycle / Seasons**: Season transitions unlock seasonal entries
- **Transportation**: First use of transport methods unlocks related entries
- **Inventory & Economy**: Pant system, shopping, tax filing unlock economic entries
- **XP & Progression**: Some entries grant a small +5 XP bonus on first discovery (the "learning bonus")

### System Dependencies
- State management (set of unlocked entry IDs persisted in save)
- UI system (encyclopedia screen, notification toasts)
- Event system (triggers from other features fire unlock events)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] Encyclopedia accessible from pause menu
- [ ] Five category tabs with correct entries per tab
- [ ] Entries unlock when trigger conditions are met
- [ ] Unlock notification appears for new entries
- [ ] Locked entries display as "???" with lock icon
- [ ] Discovery counter per category displays correctly (X / Y format)
- [ ] Overall completion percentage calculates and displays
- [ ] Entry detail view shows title, illustration, body, source
- [ ] Related entry links navigate to correct entries
- [ ] Encyclopedia state persists across save/load
- [ ] Category completion badge triggers at 100% per category
- [ ] Pre-populated starter entries on Day 1
- [ ] Minimum 50 entries available at MVP

### Experience Requirements
- [ ] Entries are engaging to read (not dry textbook text)
- [ ] Discovery feels natural and rewarding
- [ ] Browsing the encyclopedia is pleasant (not a chore)
- [ ] Completion tracking motivates exploration without creating anxiety
- [ ] Cultural facts are accurate and interesting

### Performance Requirements
- [ ] Encyclopedia opens within 0.5 seconds
- [ ] Tab switching is instant
- [ ] Scrolling is smooth with no frame drops

---

## 8. Testing & Validation

### Playtesting Goals
- Do players notice and read encyclopedia entries, or ignore them?
- Is the discovery rate satisfying (too fast → overwhelming, too slow → forgotten)?
- Are entries genuinely interesting? Would players share facts with friends?
- Does completion tracking add positive motivation?
- Do players use the encyclopedia as a reference during gameplay?

### Success Metrics
- 60%+ of players open the encyclopedia at least once per session
- Average player reads 40%+ of their unlocked entries (not just collecting them)
- 30%+ of players state they "learned something about Denmark" from the game
- Players who engage with encyclopedia entries have 15%+ higher retention rate
- Category completion badges are achieved by 20%+ of players in at least one category

---

## 9. Examples & References

### Similar Features in Other Games
- **The Witcher 3 (Bestiary/Glossary)**: In-game encyclopedia of creatures, characters, and lore that fills as player explores. **What they did well**: Entries are written in-character with personality; players consult it for gameplay benefit.
- **Civilization VI (Civilopedia)**: Comprehensive in-game encyclopedia of all game concepts. **What they did well**: Thorough, well-organized, and informative.
- **Disco Elysium (Thought Cabinet)**: Collected ideas and philosophies from conversations and exploration. **What they did well**: Entries feel personal and connected to player choices.
- **Animal Crossing (Museum/Critterpedia)**: Collection of items discovered with descriptions. **What they did well**: Completion is deeply satisfying; each new entry is a celebration.

### Inspiration
- Language learning apps (Duolingo) — bite-sized knowledge delivery, streak/completion psychology
- Travel guidebooks (Lonely Planet) — fun cultural facts presented engagingly
- "Did you know?" social media about Denmark — shareable, surprising cultural tidbits
- The joy of looking through a photo album after a trip abroad — nostalgia and accumulated experience

### Iteration History
- **v1**: Initial design — 5 categories, ~86 entries, trigger-based discovery, journal-style UI
