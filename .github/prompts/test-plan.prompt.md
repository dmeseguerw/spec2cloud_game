---
agent: gametester
---
# Game Testing Plan Workflow

When creating a comprehensive testing plan, follow these steps in order. This workflow produces a full suite of player-focused test artefacts and routes all findings to the appropriate agent.

---

## Step 1: Read All Game Context

**Before writing a single test, read:**

1. `specs/gdd.md` — Understand the game's core pillars, target audience, and player experience goals
2. `specs/features/*.md` — Read every Feature Design Document to understand mechanics, rules, and acceptance criteria
3. `AGENTS.md` — Understand the project's coding standards and architecture constraints
4. `specs/adr/` — Review architecture decisions that affect testable systems
5. Existing tests in `tests/` or equivalent — Understand what is already covered

**Note what you learn:**
- Total number of features with FDDs
- Key player actions per feature
- Any explicitly stated acceptance criteria in the FDDs
- Any areas marked as TODO, placeholder, or not yet implemented

---

## Step 2: Write Player User Stories

For every major feature identified in Step 1, write user stories from the player's perspective.

**Format:**
> *"As a player, I want to [action] so that [outcome]."*

**Guidelines:**
- Write at least **one user story per FDD feature**
- Write at least **one edge-case story per Critical/High priority feature**
- Cover both **happy paths** (things that should work) and **unhappy paths** (error states, invalid inputs, limits)
- Keep stories in the player's language — not technical language

**Save output to:** `specs/tests/user-stories.md`

**Template for each story:**
```markdown
## US-<number>: <Short Title>

**As a player**, I want to <action> so that <outcome>.

**Priority:** Critical | High | Medium | Low
**Feature:** <FDD filename>

### Acceptance Criteria
- [ ] <Measurable criterion 1>
- [ ] <Measurable criterion 2>
- [ ] <Measurable criterion 3>

### Happy Path
1. <Step 1>
2. <Step 2>
3. <Expected result>

### Edge Cases
- What happens if <boundary condition>?
- What happens if <invalid input>?
- What happens if <system is in unexpected state>?

### Out of Scope
- <What this story does NOT test>
```

---

## Step 3: Build Feature Coverage Matrix

Create a matrix that maps every FDD feature to the user stories covering it.

**Save to:** `specs/tests/test-plan.md` (as a section)

```markdown
| Feature | FDD File | User Stories | Priority | Status |
|---|---|---|---|---|
| Character Creation | character-creation.md | US-001, US-002, US-003 | Critical | ⬜ Not Started |
| XP Progression | xp-progression-system.md | US-004, US-005 | High | ⬜ Not Started |
| ... | ... | ... | ... | ... |
```

Status legend: ⬜ Not Started | 🔄 In Progress | ✅ Pass | ❌ Fail | ⚠️ Partial

---

## Step 4: Run Automated Tests

Execute the full automated test suite and analyse the results.

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage
```

**Analyse and record:**
- Total tests: how many pass, fail, skip
- Coverage: which files and functions are below 85%
- Failing tests: what is the error message, what system does it indicate is broken?
- Missing tests: identify features in FDDs that have zero corresponding test files

**Record findings in:** `specs/tests/test-results.md`

---

## Step 5: Manual & Exploratory Testing

Walk through each user story manually. For browser-based games:
1. Start the dev server: `npm run dev` (or equivalent)
2. Open the game in the simple browser tool
3. Follow each user story's happy path step by step
4. Then test edge cases listed in the story
5. Record what works and what doesn't — be specific

**What to look for:**
- Does the mechanic behave as the FDD describes?
- Does the player feedback (visual, audio) trigger correctly?
- Are there UI elements that are missing, broken, or confusing?
- Are there console errors or warnings during normal play?
- Does anything feel unresponsive, laggy, or visually wrong?
- Are there hardcoded TODO messages or placeholder text visible to the player?

---

## Step 6: Code Review Testing

For each feature being tested, review the corresponding implementation files:

1. Locate the source files for the feature (check `src/` directories)
2. Read the code with the FDD open — does it implement what was designed?
3. Look for:
   - Missing conditions or guard clauses
   - Unhandled state transitions
   - Magic numbers instead of named constants
   - TODO / FIXME / placeholder comments
   - Logic that contradicts the FDD rules
4. Record any discrepancies found

---

## Step 7: Document All Findings

**Update `specs/tests/test-results.md`** with:
- Summary of this testing session (date, scope, tester)
- Updated feature coverage matrix statuses
- List of passing user stories
- List of failing user stories with bug report references
- Overall metrics: stories passing / total, bugs open by severity

**Create individual bug reports** in `specs/tests/bugs/` for every defect found.

Bug report filename format: `<severity>-<number>-<short-slug>.md`
Examples: `critical-001-game-crash-on-start.md`, `high-002-inventory-not-saving.md`

---

## Step 8: Triage and Hand Off

For each open bug, determine where to route it:

### → Hand off to `gamedev` if:
- Feature is coded incorrectly or incompletely
- A unit test is missing or has weak/incorrect assertions
- A UI element is broken or doesn't match the FDD
- Audio or visual feedback is not triggering
- The fix is isolated to one or a few files

**Use the handoff button:** "Fix Bug or Missing Feature"
Include in your handoff: the bug report path and a clear summary of what needs fixing.

### → Hand off to `gamearchitect` if:
- Multiple features are broken in the same way (systemic issue)
- The current architecture does not support a required feature
- Performance issues are structural in nature
- A new system needs to be designed before implementation can continue

**Use the handoff button:** "Request Architecture Review for Systemic Issues"
Include in your handoff: a summary of the pattern of failures and which systems are affected.

### → Hand off to `gamedesigner` if:
- The technical implementation is correct but the game feel is wrong
- An FDD is ambiguous, leading to inconsistent implementation
- Testing reveals balance or difficulty issues needing design input

**Use the handoff button:** "Report to Game Designer"
Include in your handoff: specific player experience observations with reproduction steps.

---

## Step 9: Verify Quality Gates

Before marking testing as complete for a feature, confirm all quality gates pass:

- [ ] All **Critical** and **High** severity bugs are resolved and re-tested
- [ ] All **acceptance criteria** in the feature's FDD are verified as passing
- [ ] Unit test coverage is **≥85%** for the feature's core logic files
- [ ] The **happy path** and at least **2 edge cases** have been manually verified
- [ ] No **regressions** were introduced by recent bug fixes
- [ ] Feature status in the coverage matrix is updated to ✅ Pass

---

## Output Summary

At the end of this workflow you will have produced:

| File | Contents |
|---|---|
| `specs/tests/user-stories.md` | All player user stories with acceptance criteria |
| `specs/tests/test-plan.md` | Master plan with coverage matrix and risk areas |
| `specs/tests/test-results.md` | Test session results and running metrics |
| `specs/tests/bugs/*.md` | Individual bug/issue reports for each defect found |
