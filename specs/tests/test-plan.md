# Denmark Survival — Master Test Plan

**Version:** 1.0  
**Date:** March 17, 2026  
**Tester:** Game Testing Agent  
**Scope:** All FDD features developed for the MVP

---

## 1. Feature Coverage Matrix

| Feature | FDD File | User Stories | Priority | Automated Tests | Status |
|---|---|---|---|---|---|
| Character Creation | character-creation.md | US-001, US-002, US-003 | Critical | CharacterCreationScene.test.js, characterData.test.js | ⬜ Not Started |
| XP & Progression | xp-progression-system.md | US-004, US-005, US-006, US-007, US-021, US-022 | Critical | XPEngine.test.js, XPLog.test.js, GameOverManager.test.js, SkillSystem.test.js | ⬜ Not Started |
| Daily Activity & Day Cycle | daily-activity-day-cycle.md | US-008, US-009, US-010 | Critical | DayCycleEngine.test.js, SeasonEngine.test.js, DaySummaryScene.test.js | ⬜ Not Started |
| Dialogue & NPC System | dialogue-npc-system.md | US-011, US-012, US-013 | Critical | DialogueEngine.test.js, RelationshipSystem.test.js, NPCMemory.test.js, npcs.test.js | ⬜ Not Started |
| Inventory & Economy | inventory-economy.md | US-014, US-015, US-016 | High | InventoryManager.test.js, EconomyEngine.test.js, BillManager.test.js, ShopSystem.test.js | ⬜ Not Started |
| Transportation & Movement | transportation-movement.md | US-017, US-018 | Critical | BikeMechanics.test.js, MetroMechanics.test.js, TransportManager.test.js | ⬜ Not Started |
| Random Encounter System | random-encounter-system.md | US-019 | High | EncounterEngine.test.js, encounters.test.js | ⬜ Not Started |
| Encyclopedia & Learning | encyclopedia-learning.md | US-020 | Medium | EncyclopediaManager.test.js, encyclopedia.test.js, EncyclopediaScene.test.js | ⬜ Not Started |

**Status legend:** ⬜ Not Started | 🔄 In Progress | ✅ Pass | ❌ Fail | ⚠️ Partial

---

## 2. Automated Test Coverage Summary

| Test File | Tests | Status |
|---|---|---|
| tests/systems/XPEngine.test.js | Passing | ✅ |
| tests/systems/XPLog.test.js | Passing | ✅ |
| tests/systems/GameOverManager.test.js | Passing | ✅ |
| tests/systems/SkillSystem.test.js | Passing | ✅ |
| tests/systems/DayCycleEngine.test.js | Passing | ✅ |
| tests/systems/SeasonEngine.test.js | Passing | ✅ |
| tests/systems/DialogueEngine.test.js | Passing | ✅ |
| tests/systems/RelationshipSystem.test.js | Passing | ✅ |
| tests/systems/NPCMemory.test.js | Passing | ✅ |
| tests/systems/InventoryManager.test.js | Passing | ✅ |
| tests/systems/EconomyEngine.test.js | Passing | ✅ |
| tests/systems/BillManager.test.js | Passing | ✅ |
| tests/systems/ShopSystem.test.js | Passing | ✅ |
| tests/systems/BikeMechanics.test.js | Passing | ✅ |
| tests/systems/MetroMechanics.test.js | Passing | ✅ |
| tests/systems/TransportManager.test.js | Passing | ✅ |
| tests/systems/EncounterEngine.test.js | Passing | ✅ |
| tests/systems/EncyclopediaManager.test.js | Passing | ✅ |
| tests/systems/AudioManager.test.js | Passing | ✅ |
| tests/systems/InputManager.test.js | Passing | ✅ |
| tests/systems/WeatherSystem.test.js | Passing | ✅ |
| tests/scenes/CharacterCreationScene.test.js | Passing | ✅ |
| tests/scenes/DaySummaryScene.test.js | Passing | ✅ |
| tests/scenes/EncyclopediaScene.test.js | Passing | ✅ |
| tests/scenes/MenuScene.test.js | Passing | ✅ |
| tests/scenes/PauseScene.test.js | Passing | ✅ |
| tests/scenes/BootScene.test.js | Passing | ✅ |
| tests/scenes/SettingsScene.test.js | Passing | ✅ |
| tests/scenes/UIScene.test.js | Passing | ✅ |
| tests/scenes/SceneTransition.test.js | Passing | ✅ |
| tests/data/characterData.test.js | Passing | ✅ |
| tests/data/encounters.test.js | Passing | ✅ |
| tests/data/encyclopedia.test.js | Passing | ✅ |
| tests/data/npcs.test.js | Passing | ✅ |
| tests/data/AssetKeys.test.js | Passing | ✅ |
| tests/state/StateManager.test.js | Passing | ✅ |
| tests/state/StateHelpers.test.js | Passing | ✅ |
| tests/ui/DialogBox.test.js | Passing | ✅ |
| tests/ui/GameButton.test.js | Passing | ✅ |
| tests/ui/HTMLOverlayManager.test.js | Passing | ✅ |
| tests/ui/NotificationManager.test.js | Passing | ✅ |
| tests/ui/Panel.test.js | Passing | ✅ |
| tests/ui/ProgressBar.test.js | Passing | ✅ |
| tests/entities/Player.test.js | Passing | ✅ |
| tests/integration/data-validation.test.js | Passing | ✅ |
| tests/integration/e2e-game-loop.test.js | Passing | ✅ |
| tests/engine.test.js | Passing | ✅ |
| tests/structure.test.js | Passing | ✅ |

**Total: 48 test files | 3,079 tests | 3,079 passing | 0 failing**

---

## 3. Code Coverage Analysis

| File | Statements | Branch | Functions | Lines | Risk |
|---|---|---|---|---|---|
| **Overall** | **97.01%** | **88.2%** | **98.57%** | **98.2%** | Low |
| src/data/items.js | 0% | 0% | 0% | 0% | 🔴 Critical |
| src/systems/InputManager.js | 80.88% | 76.59% | 86.66% | 82.75% | 🔴 High |
| src/ui/HTMLOverlayManager.js | 87.5% | 74.41% | 100% | 92.42% | 🔴 High |
| src/ui/NotificationManager.js | 84.78% | 81.13% | 93.33% | 92.59% | 🟡 Medium |
| src/systems/MetroMechanics.js | 100% | 77.77% | 100% | 100% | 🟡 Medium |
| src/systems/EncounterEngine.js | 94.21% | 77.57% | 100% | 96.15% | 🟡 Medium |
| src/systems/WeatherSystem.js | 100% | 83.33% | 100% | 100% | 🟡 Medium |
| src/systems/BillManager.js | 100% | 86.11% | 100% | 100% | 🟡 Medium |
| src/state/StateManager.js | 100% | 91.48% | 100% | 100% | ✅ Good |
| src/systems/BikeMechanics.js | 100% | 91.66% | 100% | 100% | ✅ Good |

### Coverage Risk Summary

- **🔴 items.js: 0% coverage** — No tests exist for the items data file. Any item-related bugs will be silent.
- **🔴 InputManager.js: 76.59% branch coverage** — Input handling edge cases (lines 146–164) are untested. These correspond to keyboard binding scenarios that could affect player controls.
- **🔴 HTMLOverlayManager.js: 74.41% branch coverage** — HTML overlay edge cases (lines 52–55, 180) are untested. Could affect UI reliability.
- **🟡 MetroMechanics.js: 77.77% branch** — Multiple branch paths for inspector fines and zone-based fares untested (lines 180, 206, 231, 242).
- **🟡 EncounterEngine.js: 77.57% branch** — Encounter filtering edge cases uncovered (lines 324–326, 406, 417). May produce unexpected encounters.
- **🟡 NotificationManager.js: 81.13% branch** — Notification queue edge cases uncovered (lines 225–235).

---

## 4. Risk Areas

### Critical Risk: `items.js` — No Test Coverage

The items data file (`src/data/items.js`) has **0% coverage** across all metrics. This file likely contains definitions for groceries, health items, documents, and collectibles used by the Inventory & Economy system. Without any tests:

- Item data integrity is unverified
- Missing or incorrectly configured items would not be caught
- The ShopSystem and InventoryManager rely on this data

**Recommended action:** Create `tests/data/items.test.js` covering item structure validation, required fields, price ranges, and category assignments.

### High Risk: `InputManager.js` — Keyboard Binding Edge Cases

Lines 146–164 in InputManager.js are not covered. These likely represent fallback key bindings or alternative input contexts (e.g., dialogue navigation vs. world movement). If these paths fail silently, players may be unable to interact with the game in specific scenes.

### High Risk: `HTMLOverlayManager.js` — UI Overlay Edge Cases

Lines 52–55 and 180 in HTMLOverlayManager.js are uncovered branches. These likely guard overlay creation/destruction scenarios, which could cause orphaned DOM elements or broken overlay states.

---

## 5. Missing Test Areas

The following features from FDDs have **no dedicated test files**:

| Missing Test Area | Related FDD | Impact |
|---|---|---|
| Items data validation | inventory-economy.md | 🔴 Critical — items.js at 0% |
| Pant (bottle return) mechanics | inventory-economy.md | 🟡 Medium — untested user flow |
| Inventory scene rendering | inventory-economy.md | 🟡 Medium — InventoryScene.js has no test file |
| DialogueScene scene flow | dialogue-npc-system.md | 🟡 Medium — DialogueScene.js has no test file |
| GameScene integration | all features | 🟡 Medium — GameScene.js has no direct test file |

---

## 6. Test Execution Plan

### Phase 1: Automated Suite (Complete ✅)
- Run `npm test` — 3,079 tests, all passing
- Run `npm run test:coverage` — 97.01% statement coverage

### Phase 2: Manual Gameplay Testing (Pending)
Follow each user story's happy path manually via the dev server:
1. Character Creation — US-001, US-002, US-003
2. XP System — US-004, US-005, US-006, US-007
3. Daily Cycle — US-008, US-009, US-010
4. NPC Dialogue — US-011, US-012, US-013
5. Economy — US-014, US-015, US-016
6. Transportation — US-017, US-018
7. Encounters — US-019
8. Encyclopedia — US-020
9. Game Over — US-021
10. Settings — US-022

### Phase 3: Code Review Testing (Pending)
Review implementation files against FDDs for:
- Missing conditions or guard clauses
- TODO/FIXME/placeholder text
- Logic contradictions with FDD rules

### Phase 4: Bug Triage and Issue Creation (Pending)
For each defect found:
- Create bug report in `specs/tests/bugs/`
- Create GitHub issue for gamedev agent
