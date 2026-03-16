# 🎯 Feature Design Document: Dialogue & NPC Interaction System

## 1. Feature Overview

### Feature Name
**Dialogue & NPC Interaction System**

### Purpose
NPCs are the soul of Denmark Survival. They're how the player experiences Danish culture, builds social connections, learns the language, and feels like they're part of a living world. The dialogue system must handle branching conversations with visible consequences, relationship tracking over time, and culturally authentic interactions that teach while entertaining. This feature delivers on two core pillars simultaneously: **Authentic Cultural Immersion** (NPCs embody Danish culture) and **Meaningful Progression** (relationships and language skill grow through conversations).

### Priority
- [x] **Critical** (MVP - Must have)

### Dependencies
- XP & Progression System (dialogue outcomes affect XP; language skill gates options)
- Character Creation (nationality affects some dialogue lines)
- State management (persist relationship values, conversation history)
- Daily Activity System (social activities involve NPC dialogues)

---

## 2. Player-Facing Design

### Player Actions
1. **Approach NPC**: Walk near an NPC with a visible interaction indicator (speech bubble icon above head)
2. **Initiate Conversation**: Press E / Space to start dialogue
3. **Read Dialogue**: NPC speaks via text box with portrait
4. **Choose Response**: Select from 2-4 response options (some gated by skill level)
5. **Observe Reaction**: NPC reacts visually and verbally to choice — relationship changes
6. **End Conversation**: Dialogue concludes naturally or player exits (with social consequence if rude)
7. **Check Relationship Status**: View relationship tracker in pause menu

### Visual Design
- **Dialogue Box**: Lower-screen text box with NPC portrait on left side. Clean, warm design with subtle parchment texture. NPC name displayed above portrait. Text appears with typewriter effect (skippable).
- **NPC Portrait**: Half-body illustration showing expression changes during conversation (happy, confused, annoyed, excited, neutral). 3-5 expression variants per main NPC.
- **Response Options**: 2-4 clickable text options displayed below dialogue box. Options may have small icons indicating: 🇩🇰 (requires language skill), 💡 (cultural knowledge needed), ❤️ (relationship-building), ⚠️ (risky choice)
- **Skill-Gated Options**: Options requiring higher language/cultural skill shown but grayed out with tooltip: "Requires Language Level 3"
- **Relationship Indicator**: After significant interactions, a small heart/relation icon floats briefly showing "+1 relationship" or "-1 relationship"
- **NPC Overworld**: NPCs have idle animations, interact with environment (Mette stocks shelves, Kasper checks his bike, Lars reads newspaper)
- **Interaction Prompt**: Small speech bubble with "..." appears above NPCs who have new dialogue available

### Audio Design
- **Dialogue "blip"**: Each character of text makes a soft blip sound. Different pitch per NPC (Lars = warm baritone blips, Emma = bright higher blips). Optional — can be turned off.
- **NPC greeting**: Short voiced greeting in Danish when conversation starts ("Hej!", "Godmorgen!", "Nå!"). Main NPCs have unique greetings.
- **Mood sounds**: Subtle background sound cue shifts based on conversation mood (warm tone for friendly, slightly tense for conflict)
- **Relationship change**: Soft chime for positive change, muted tone for negative
- **Skill-gate**: Soft "locked" sound when hovering grayed-out option

### Player Feedback
- **Immediate Feedback**: NPC portrait expression changes based on chosen response (smile for good choice, frown for poor choice)
- **Visual Feedback**: Dialogue box border subtly shifts color based on conversation mood (warm gold = positive, cool gray = neutral, soft red = tension)
- **Relationship Change**: "+1" or "-1" floats near NPC after meaningful choices
- **XP Notification**: XP gain/loss from conversation shown as floating text after dialogue ends

---

## 3. Rules & Mechanics

### Core Rules

**Conversation Flow:**
- Conversations are structured as dialogue trees with branching paths
- Each NPC has multiple conversation topics, unlocked by: day progression, relationship level, quest state, and skill levels
- Conversations have outcomes: XP change, relationship change, item exchange, quest progress, encyclopedia unlock
- Some conversations are one-time events (story beats); others repeat with variations

**Response Options:**
- 2-4 options per dialogue node
- Response types:
  - **Friendly**: Builds relationship, usually positive XP
  - **Curious**: Asks for more info, may unlock encyclopedia entries
  - **Awkward/Honest**: Acknowledges cultural gap, may be endearing or cause mild discomfort
  - **Rude/Dismissive**: Damages relationship, XP loss (always available as a "realistic" option)
  - **Danish (skill-gated)**: Respond in Danish — higher XP gain, faster relationship building, requires Language Skill level

**Language Skill Interaction:**
- Language Skill 1: All options in English. NPCs respond in English.
- Language Skill 2: Some Danish words appear in NPC dialogue (with inline translation). One response option may include basic Danish.
- Language Skill 3: Mix of Danish and English dialogue. More Danish response options available.
- Language Skill 4: Mostly Danish dialogue. English responses available but less effective.
- Language Skill 5: Full Danish dialogue paths unlocked. Maximum XP gains. Danish-only secret dialogue branches.

**Relationship System:**
- Each main NPC has a relationship value: 0-100
- Starting value: 30 (neutral stranger)
- Relationship stages: Stranger (0-20), Acquaintance (21-40), Friendly (41-60), Friend (61-80), Close Friend (81-100)
- Relationship affects: NPC greetings, available dialogue, prices at their shop, quest availability, help offered
- Relationship changes: typically +2 to +5 for good interactions, -2 to -5 for poor ones. Major story moments: +10 to +15.

**NPC Memory:**
- NPCs remember previous conversations (tracked via dialogue history)
- NPCs reference past choices: "Last time you mentioned you miss the warm weather..."
- NPCs notice player progress: "Your Danish is getting better!" (triggered by language skill change)
- NPCs notice absence: "I haven't seen you in a while!" (if 5+ days since last interaction)

### Variables & Values

**Main NPC Starting Relationships & Arcs:**

| NPC | Starting Relation | Location | Key Topics | Arc Summary |
|-----|-------------------|----------|------------|-------------|
| Lars (Neighbor) | 40 (warm welcome) | Apartment area | Danish basics, neighborhood tips | Guide → Genuine friend |
| Sofie (Expat) | 35 (fellow outsider) | Café, Community Center | Shared struggles, humor, support | Companion in adaptation |
| Henrik (Co-worker) | 25 (professional) | Workplace | Work culture, directness, career | Professional mentor → ally |
| Mette (Grocery clerk) | 30 (pleasant stranger) | Grocery Store | Products, recipes, small talk | Language barometer |
| Kasper (Cyclist) | 20 (intimidating) | Streets, Bike Shop | Bike mastery, city routes | Expert → respected peer |
| Dr. Jensen (GP) | 30 (professional) | Healthcare location | Health, vitamin D, wellness | Health guide |
| Bjørn (Municipal) | 15 (bureaucrat) | Municipal Building | Papers, tax, legal | Intimidating → helpful ally |
| Freja (Social) | 35 (welcoming) | Park, Events | Social life, parties, traditions | Gateway to social circles |
| Thomas (Skeptic) | 10 (distant) | Various | Danish values, integration debate | Hardest to win over |
| Emma (Student) | 35 (curious) | Library, Café | Language practice, youth culture | Mutual learning |

**Relationship Change Values:**

| Interaction Type | Relationship Change |
|-----------------|---------------------|
| Friendly response | +2 to +3 |
| Curious/interested response | +1 to +2 |
| Awkward but honest response | 0 to +1 |
| Rude/dismissive response | -3 to -5 |
| Danish language response | +3 to +5 (extra respect) |
| Helping NPC with task | +5 to +10 |
| Completing NPC's quest | +10 to +15 |
| Missing NPC's scheduled event | -5 |
| Insulting NPC's values | -10 to -15 |
| Major story choice favoring NPC | +15 |

**XP from Dialogue:**

| Dialogue Outcome | XP Change |
|-----------------|-----------|
| Successful friendly conversation | +15 |
| Learn cultural fact (curious choice) | +20 |
| Navigate cultural misunderstanding gracefully | +20 |
| Use Danish response successfully | +15 to +25 |
| Rude/dismissive response | -5 to -15 |
| Major cultural faux pas in dialogue | -30 |
| Friendship milestone reached | +40 |

### Edge Cases & Special Situations
- **NPC busy**: Some NPCs aren't available at certain times (Mette only at grocery store during work hours, Henrik only at workplace on weekdays)
- **Player walks away mid-conversation**: NPC says farewell line; slight relationship penalty (-1)
- **Repeat conversation**: If player talks to NPC again same day with no new content, NPC has a brief "catch you later" response (no XP, no relationship change)
- **Relationship at maximum (100)**: NPC has special "close friend" dialogue; no further relationship gains, but XP still awarded
- **Relationship drops to 0**: NPC avoids player; limited to minimal dialogue until player makes amends through other NPCs or time passage
- **Multiple gated options in one dialogue**: All gated options shown but unavailable; motivates skill development

### Balancing Goals
- **Conversations should inform, not lecture**: Cultural knowledge delivered through natural dialogue, humor, and story — never as an info dump
- **No perfect path**: Every response option has nuance; "friendly" isn't always the best choice (sometimes honest/awkward builds more authentic relationships)
- **Thomas (the Skeptic) should be hard but rewarding**: Winning him over is the hardest NPC challenge, but the most XP-rich payoff
- **Language-gated options should motivate, not frustrate**: Seeing grayed-out Danish options should make players WANT to improve language skill, not feel locked out

---

## 4. Game Feel & Polish

### Desired Feel
- **Conversations should feel alive and personal** — like talking to a real person in Copenhagen
- **Cultural learning should feel organic** — "I learned something!" not "I was lectured"
- **Relationship building should feel gradual and earned** — not instant best friends
- **Danish language integration should feel rewarding** — nailing a Danish phrase = pride

### Juice Elements
- [ ] NPC portrait smoothly transitions between expressions
- [ ] Text typewriter effect with per-character blip sounds
- [ ] Response options slide in from bottom with stagger animation
- [ ] Relationship change notification floats and fades
- [ ] NPC greets player by name after reaching "Friendly" stage
- [ ] Danish words in dialogue highlighted with subtle glow
- [ ] Friendship milestone triggers mini-celebration (NPC animation + sound)
- [ ] Skill-gated options have a shimmer effect (attractive but locked)

### Input Handling
- **Initiate**: E or Space near NPC
- **Advance text**: Space, Enter, or mouse click
- **Select response**: Mouse click on option, or number keys (1-4)
- **Skip text animation**: Hold Space to instantly display full text
- **Exit dialogue early**: Escape key (with social consequence)
- **Input during dialogue**: Movement keys disabled; only dialogue inputs active

---

## 5. Progression & Unlocking

### When Available
- Day 1: Lars greets player at apartment (first dialogue available immediately)
- NPCs become available as player discovers their locations

### How to Unlock
- NPCs are location-bound: discover the location, meet the NPC
- Some NPCs appear during specific activities (Kasper during biking, Henrik at work)
- Deeper dialogue unlocks with: relationship level, language skill, story progression, and completed activities

### Tutorial / Introduction
- **First Encounter**: Lars knocks on door (scripted); teaches dialogue basics — how to read, how to choose responses. Very forgiving (all choices positive).
- **Tutorial Method**: Show — first conversation has highlight markers on response options. Tooltip explains: "Your choices affect relationships and XP."
- **Learning Curve**: By Day 3, player should understand: choose thoughtfully → build relationships → unlock content

---

## 6. Integration with Other Systems

### Related Features
- **XP & Progression**: Dialogue outcomes generate XP events; language skill gates options
- **Daily Activity System**: Social activities are time-based; NPC availability varies by time of day
- **Character Creation**: Nationality affects some NPC reactions and unique dialogue lines ("Oh, you're from Brazil? You must find the cold terrible!")
- **Random Encounters**: Some encounters involve dialogue with generic NPCs
- **Inventory & Economy**: Some NPCs sell items or offer discounts based on relationship
- **Encyclopedia**: Curious responses unlock cultural encyclopedia entries
- **Transportation**: Kasper appears during biking; metro passengers may initiate encounters

### System Dependencies
- UI system (dialogue box, portraits, response options)
- Audio system (blips, greetings, mood sounds)
- Animation system (NPC expressions, idle animations, interaction indicators)
- State management (relationship values, dialogue history, language skill check)
- Input system (dialogue navigation, response selection)

---

## 7. Acceptance Criteria

### Functional Requirements
- [ ] Player can approach and initiate conversation with NPCs using E/Space
- [ ] Dialogue box displays NPC portrait, name, and text with typewriter effect
- [ ] 2-4 response options displayed per dialogue node
- [ ] Skill-gated options shown but grayed out with requirement tooltip
- [ ] Response choices affect relationship value correctly
- [ ] Response choices generate correct XP events
- [ ] NPC expressions change based on conversation mood
- [ ] Relationship values persist across sessions
- [ ] Dialogue history prevents exact repeat conversations same day
- [ ] NPCs reference past conversations and player progress
- [ ] Language skill affects available dialogue and NPC language mix
- [ ] 10 main NPCs have unique dialogue trees with 20+ nodes each (MVP)
- [ ] Relationship stages (Stranger → Close Friend) trigger appropriate NPC behavior changes

### Experience Requirements
- [ ] Conversations feel natural and culturally authentic
- [ ] Player understands consequences of their dialogue choices
- [ ] Relationship growth feels gradual and earned
- [ ] Grayed-out Danish options motivate language skill development
- [ ] NPCs feel like they have distinct personalities

### Performance Requirements
- [ ] Dialogue box renders instantly on conversation start
- [ ] Text typewriter effect runs smoothly at 60 FPS
- [ ] NPC expression transitions are seamless
- [ ] Response options display within 0.5 seconds of text completion

### Polish Requirements
- [ ] All main NPCs have 3-5 expression variants
- [ ] Text blip sounds are per-NPC (unique pitch/voice)
- [ ] Relationship change notifications animate smoothly
- [ ] Dialogue box design matches game's cozy aesthetic

---

## 8. Testing & Validation

### Playtesting Goals
- Do players read dialogue carefully or skip through?
- Do players feel NPC personalities are distinct?
- Do players pursue specific NPCs deliberately (relationship building)?
- Are skill-gated options motivating or frustrating?
- Does NPC memory (remembering past choices) feel believable?
- Are conversations the right length (not too short, not too long)?

### Success Metrics
- 80%+ of players develop at least one NPC to "Friend" stage (61+ relationship)
- 50%+ of players develop Thomas (the hardest NPC) past "Acquaintance"
- Players report NPC conversations as "interesting" 75%+ of the time
- Less than 15% of players skip dialogue text regularly
- Average conversation length: 3-8 dialogue exchanges

---

## 9. Examples & References

### Similar Features in Other Games
- **Stardew Valley (NPC Relationships)**: Daily gifts and conversations build friendship. Relationship gates unlock new dialogue and events. **What they did well**: NPCs feel like real people with schedules and preferences. Relationships are gradual.
- **Disco Elysium (Skill-Gated Dialogue)**: Internal skills unlock extra dialogue options. Failed skill checks have interesting consequences. **What they did well**: Gated options feel exciting, not punishing. Every response reveals character.
- **Night in the Woods (Character Dialogue)**: Distinct personalities, emotional authenticity, humor mixed with depth. **What they did well**: Conversations feel like real friendship — messy, funny, meaningful.
- **Coffee Talk (Serving Dialogue)**: Customers share life stories through repeated visits. **What they did well**: Building relationships through small, regular interactions over time.

### Inspiration
- Real Danish communication style: direct, honest, understated humor, values sincerity over politeness
- The expat experience of learning when to speak Danish vs. English
- The slow burn of Danish friendship — "Making friends in Denmark is hard but worth it"
- Language learning apps where you see your options expand as you improve

### Iteration History
- **v1**: Initial design — branching dialogue, 10 NPCs, relationship tracking, language gating

---

## Implementation Notes (For Developers)

### Suggested Approach
- Dialogue data should be stored in JSON files (one per NPC or one large file)
- Use a simple dialogue tree format: nodes with text, response options, conditions, and outcomes
- DialogueScene runs as overlay on GameScene (per ADR 0002)
- Relationship values in Phaser Registry, accessed via constants

### Performance Considerations
- NPC portrait images should be pre-loaded (they're small)
- Dialogue JSON can be loaded per-area rather than all at once
- Typewriter effect should use Phaser timer, not character-by-character DOM updates

### Platform Concerns
- Dialogue text must be legible at all resolutions
- Touch targets for response options should be minimum 44px height (future mobile)
- Consider voice-over accessibility for dialogue (future)
