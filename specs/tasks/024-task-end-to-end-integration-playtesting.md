# Task 024: End-to-End Integration & Playtesting

## Description
Final integration task that connects all systems into a complete playable game loop. Verify the full player experience from character creation through multiple in-game days, validate system interactions, perform end-to-end testing, fix integration issues, and prepare a playable build for playtesting. This is the "glue" task that ensures all independently built systems work together seamlessly.

## Dependencies
- All previous tasks (001-023) should be complete

## Technical Requirements

### Full Game Loop Verification
Validate the complete player experience flows without breaks:

**Flow 1: First-Time Player**
1. Launch game → BootScene loads → MenuScene appears
2. Click "New Game" → CharacterCreationScene
3. Enter name, select nationality, select job → Confirm
4. GameScene loads with UIScene parallel → Player at starting apartment
5. Morning overview shows Day 1 obligations
6. Walk around neighborhood → discover apartment area → encyclopedia entry unlocks
7. Talk to Lars (neighbor) → dialogue with tutorial tips → relationship +5
8. Go to grocery store → buy food → DKK deducted, items in inventory
9. Encounter triggers during day → resolve with choice
10. End day → DaySummaryScene → XP breakdown → Continue to Day 2

**Flow 2: Multi-Day Progression**
1. Day 2-5: Multiple activities, random encounters, NPC conversations
2. Skill improvement through repeated actions (cycling, language)
3. First bill arrives → notification → pay from pause menu
4. Weather changes → affects transport decisions
5. Relationship milestone with NPC → +40 XP → notification

**Flow 3: Save/Load Cycle**
1. Play several days → Save from pause menu
2. Return to main menu → Load save → verify state matches
3. Continue playing → auto-save at day end
4. Close and reopen game → "Continue" loads correct save

**Flow 4: Sustained Gameplay**
1. Season transition → weather patterns change → visual ambiance shifts
2. Salary arrives → DKK increases → notification
3. Level-up achieved → celebration → new areas unlocked
4. Major random event triggers → significant XP impact
5. Encyclopedia fills gradually → 30%+ completion over extended play

### System Integration Testing
Verify all system interactions work correctly:

| System A | System B | Integration Point |
|----------|----------|-------------------|
| Character Creation | State Management | Starting values propagate |
| XP Engine | HUD | XP changes reflect in UI |
| Day Cycle | Transportation | Weather affects biking |
| Transportation | Economy | Metro costs DKK |
| Dialogue | Relationships | Conversation affects NPC rel. |
| Encounters | Inventory | Item rewards appear in inventory |
| Encounters | Encyclopedia | Cultural tips unlock entries |
| Economy | Day Cycle | Bills arrive on schedule |
| Inventory | Day Cycle | Food spoils after time |
| Skills | Dialogue | Language gates dialogue options |
| Save/Load | All Systems | Complete state preserved |

### Data Validation
- All encounter data entries are well-formed and triggerable
- All dialogue trees are complete (no dead-end nodes without end flag)
- All item data is valid and referenced correctly
- All NPC data is complete with schedules
- All encyclopedia entries have at least one valid trigger
- No orphaned references between systems

### Build Preparation
- Verify game runs from clean load (no stale state)
- Test on multiple browsers (Chrome, Firefox, Safari, Edge)
- Verify total asset size is within acceptable limits (<50MB)
- Verify loading times are reasonable (<5 seconds for initial load on broadband)
- Generate production build index.html if using Vite Phase 2

### Known Issue Tracking
- Document any bugs found during integration testing
- Prioritize by severity: blocker, major, minor, cosmetic
- Create issue list for post-integration fixingFixing

## Acceptance Criteria
- [ ] Complete game loop plays from character creation through Day 5+ without crashes
- [ ] All system integrations verified per integration table
- [ ] Save/load preserves complete game state across all systems
- [ ] No dead-end dialogue trees or orphan data references
- [ ] Game runs without errors on Chrome, Firefox, and Safari
- [ ] Loading time under 5 seconds on first load
- [ ] Asset bundle size under 50MB
- [ ] Auto-save, manual save, and load all work in combined flow
- [ ] Game over triggers and recovery works end-to-end
- [ ] All HUD elements update correctly from gameplay actions
- [ ] Random encounters trigger at expected frequency and variety
- [ ] Encyclopedia entries unlock from multiple trigger sources
- [ ] Financial system (salary, bills, shopping) runs correctly over multi-day play
- [ ] No memory leaks during extended play session (30+ minutes)

## Testing Requirements
- **E2E Test**: Create character → play 5 days → save → load → play 5 more days → no errors
- **E2E Test**: Exercise every transport mode → encounter → shop → dialogue → inventory in one session
- **E2E Test**: Trigger level-up → verify unlock → verify new content accessible
- **E2E Test**: Trigger game-over threshold → verify warning → verify game-over screen
- **E2E Test**: Season transition → verify weather/visual changes
- **Cross-Browser Test**: Chrome, Firefox, Safari, Edge on desktop
- **Performance Test**: 30-minute play session → stable frame rate, no memory growth
- **Data Validation Test**: Automated scan of all JSON data files for schema compliance
- **Regression Test**: Full test suite passes (all unit + integration tests from tasks 001-023)
- **Playtesting Checklist**:
  - [ ] Game is fun and engaging
  - [ ] Encounters feel varied and surprising
  - [ ] Financial pressure is present but manageable
  - [ ] Cultural facts are interesting and educational
  - [ ] Game feels "cozy" not "stressful"
  - [ ] First 30 minutes are clear and well-paced
- **Coverage Target**: All modules maintain ≥85% coverage; E2E tests cover critical paths

## References
- All FDDs (acceptance criteria and testing requirements sections)
- All ADRs (technical decisions and consequences)
- GDD Section 8: Success Metrics (engagement, retention, learning goals)
