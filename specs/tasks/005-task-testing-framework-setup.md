# Task 005: Testing Framework Setup

**GitHub Issue:** [#6 - Task 005: Testing Framework Setup](https://github.com/dmeseguerw/spec2cloud_game/issues/6)
**GitHub PR:** [#9 - [WIP] Add testing framework setup for Denmark Survival game](https://github.com/dmeseguerw/spec2cloud_game/pull/9)

## Description
Set up the testing infrastructure for Denmark Survival, including a test runner, mock utilities for Phaser objects, and test helpers. Since this is a browser-based Phaser game with ES6 modules, the testing framework must support module imports and provide utilities to mock Phaser's Game, Scene, and Registry objects for unit testing game logic without requiring a running browser/canvas.

## Dependencies
- Task 001: Project Structure & Build Setup (package.json exists)

## Technical Requirements

### Test Runner Selection
Choose and configure a test runner that supports:
- ES6 module imports (`import`/`export`)
- No browser required for unit tests (Node.js based)
- Mocking capabilities for Phaser classes
- Code coverage reporting
- Watch mode for development
- Suggested options: Vitest (recommended — works with future Vite migration), or Jest with ESM support

### Package.json Test Scripts
Add to package.json:
- `"test"` — Run all tests once
- `"test:watch"` — Run tests in watch mode
- `"test:coverage"` — Run tests with coverage report

### Phaser Mock Utilities (`tests/mocks/PhaserMocks.js`)
Create mock implementations for commonly tested Phaser objects:
- **MockRegistry** — Mimics `Phaser.Data.DataManager`: `get()`, `set()`, `remove()`, `events.on()`, `events.emit()`. Stores data in a plain JS Map. Emits `changedata-{key}` events on set.
- **MockScene** — Mimics `Phaser.Scene`: Has `registry` (MockRegistry), `scene` (with `start()`, `launch()`, `stop()`, `pause()`, `resume()`), `cameras.main` (with `fade()`)
- **MockGameObject** — Mimics basic game objects: `setPosition()`, `setVisible()`, `setText()`, `destroy()`
- **MockInput** — Mimics keyboard input: `createCursorKeys()`, `addKey()`
- **MockLocalStorage** — In-memory localStorage mock for save/load testing: `getItem()`, `setItem()`, `removeItem()`, `clear()`

### Test Directory Structure
```
tests/
├── mocks/
│   └── PhaserMocks.js         # Phaser object mocks
├── state/
│   ├── StateManager.test.js   # Save/load tests
│   └── StateHelpers.test.js   # State mutation tests
├── systems/                   # Game system tests
├── scenes/                    # Scene logic tests
├── data/                      # Data validation tests
└── utils/                     # Utility function tests
```

### Test Helpers (`tests/helpers/`)
- Factory functions for creating test game state (pre-populated registry with realistic data)
- Helper to create a "new game" state for testing
- Helper to create state at various progression points (newcomer, adapter, resident, local)
- Assertion helpers for comparing game state objects

### Coverage Configuration
- Minimum coverage threshold: 85% (lines, branches, functions)
- Coverage report output: terminal summary + HTML report in `coverage/`
- Include: `src/**/*.js`
- Exclude: `src/main.js` (bootstrap), placeholder scene stubs, asset loading code

## Acceptance Criteria
- [ ] `npm test` runs all tests and reports results
- [ ] `npm run test:watch` watches for file changes and re-runs tests
- [ ] `npm run test:coverage` generates a coverage report
- [ ] MockRegistry correctly mimics `get()`, `set()`, and event emission
- [ ] MockScene provides scene management methods
- [ ] MockLocalStorage works as an in-memory replacement
- [ ] At least one example test passes using the mock utilities (e.g., StateManager save/load)
- [ ] Coverage configuration is set with 85% threshold
- [ ] Test directory structure mirrors source directory structure

## Testing Requirements
- **Meta Test**: The mock utilities themselves should have tests verifying they behave correctly
- **Example Test**: Write a sample test that creates a MockRegistry, sets values, and verifies events fire
- **Example Test**: Write a sample test using MockLocalStorage for save/load
- **Coverage Target**: Mocks and helpers should have ≥90% coverage

## References
- ADR 0007: Build System (development workflow)
- ADR 0004: State Management (registry pattern to mock)
- All FDDs (testing requirements sections)
