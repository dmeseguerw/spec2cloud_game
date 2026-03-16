---
agent: gamedesigner
---
# Game Development Flow - Step 2

Break down the Game Design Document into Feature Design Documents (FDDs) with the Game Designer agent

## Game Designer Agent

Each feature should have its own FDD file in `specs/features/[feature-name].md`.

Use this format for each FDD:

# 🎯 Feature Design Document: [Feature Name]

## 1. Feature Overview

### Feature Name
**[Descriptive Name]**

### Purpose
Why does this feature exist? What player need does it serve?

### Priority
- [ ] **Critical** (MVP - Must have)
- [ ] **High** (Important for quality experience)
- [ ] **Medium** (Enhances experience)
- [ ] **Low** (Nice-to-have polish)

### Dependencies
What must exist before this feature can be implemented?
- [Dependency 1]
- [Dependency 2]

## 2. Player-Facing Design

### Player Actions
What can the player DO with this feature?
1. [Action 1]: Description
2. [Action 2]: Description
3. [Action 3]: Description

### Visual Design
What does it look like?
- **Visual Style**: [Description or references]
- **Animations**: [Key animations needed]
- **Visual Effects**: [Particles, screen effects, etc.]
- **UI Elements**: [Any UI this feature requires]

### Audio Design
What does it sound like?
- **Sound Effects**: [List all SFX needed]
- **Music**: [Any music changes or cues]
- **Audio Cues**: [Important audio feedback]

### Player Feedback
How does the game respond to player input?
- **Immediate Feedback**: [What happens instantly?]
- **Visual Feedback**: [Screen shake, particles, flashes]
- **Audio Feedback**: [Sounds that confirm actions]
- **Haptic Feedback**: [Controller rumble, vibration]

## 3. Rules & Mechanics

### Core Rules
The fundamental logic of how this feature works:
```
[Rule 1]: Detailed description
[Rule 2]: Detailed description
[Rule 3]: Detailed description
```

### Variables & Values
Numbers that define this feature's balance:

| Variable | Value | Description |
|----------|-------|-------------|
| [Variable 1] | [X] | [What it affects] |
| [Variable 2] | [Y] | [What it affects] |
| [Variable 3] | [Z range] | [What it affects] |

*Note: These values should be tunable for balancing*

### Edge Cases & Special Situations
What happens in unusual scenarios?
- **Edge Case 1**: [Scenario] → [Expected behavior]
- **Edge Case 2**: [Scenario] → [Expected behavior]

### Balancing Goals
What should this feature FEEL like?
- [Powerful but fair]
- [Risk vs Reward ratio]
- [Skill-based vs Luck-based]
- [Fast-paced vs Strategic]

## 4. Game Feel & Polish

### Desired Feel
How should this feature make players feel?
- [Satisfying, responsive, punchy, etc.]

### Juice Elements
Extra polish that makes it feel amazing:
- [ ] Screen shake
- [ ] Particle effects
- [ ] Hit pause / freeze frames
- [ ] Camera effects
- [ ] Sound layering
- [ ] Animation polish
- [ ] Visual trails
- [ ] Impact effects

### Input Handling
- **Input Buffering**: [Allow early inputs? How long?]
- **Coyote Time**: [Grace period for actions?]
- **Input Forgiveness**: [Make inputs more lenient?]

## 5. Progression & Unlocking

### When Available
At what point can players access this feature?
- [Start of game, Level X, After defeating Y, etc.]

### How to Unlock
What must players do to get access?
- [Conditions for unlocking]

### Tutorial / Introduction
How do players learn about this feature?
- **First Encounter**: [When/how introduced]
- **Tutorial Method**: [Show, tell, force, optional]
- **Learning Curve**: [How quickly should players master it?]

## 6. Integration with Other Systems

### Related Features
What other features does this interact with?
- [Feature 1]: [How they interact]
- [Feature 2]: [How they interact]

### System Dependencies
What game systems does this require?
- [Physics system]
- [Input system]
- [Animation system]
- [Audio system]
- [UI system]

## 7. Acceptance Criteria

### Functional Requirements
What MUST work?
- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Experience Requirements
What MUST the player experience?
- [ ] [Experience 1]
- [ ] [Experience 2]

### Performance Requirements
Any performance constraints?
- [ ] Feature runs at 60 FPS on target platform
- [ ] No noticeable lag when activated
- [ ] Loads within X seconds

### Polish Requirements
What makes this feel complete?
- [ ] [Visual polish item]
- [ ] [Audio polish item]
- [ ] [Feel polish item]

## 8. Testing & Validation

### Playtesting Goals
What should we learn from playtesting?
- [Is it fun?]
- [Is it clear/understandable?]
- [Is it balanced?]
- [Are there exploits?]

### Success Metrics
How do we know this feature succeeds?
- [X% of players use this feature]
- [Players rate it Y/10 for fun]
- [No confusion in playtests]

## 9. Examples & References

### Similar Features in Other Games
- **[Game 1]**: [What they did well/poorly]
- **[Game 2]**: [What they did well/poorly]

### Inspiration
Visual or mechanical inspiration:
- [Reference image/video/game]
- [Why this inspires the feature]

### Iteration History (Update as feature evolves)
- **v1**: [Original design]
- **v2**: [What changed and why]
- **v3**: [Further iterations]

---

## Implementation Notes (For Developers)

*Note: This section is for reference only. Detailed technical implementation decisions should be made by the Game Architect and Game Developer.*

### Suggested Approach
- [High-level technical approach suggestion, not prescriptive]

### Performance Considerations
- [Any known performance concerns to be aware of]

### Platform Concerns
- [Platform-specific considerations (mobile touch, web input, etc.)]

---

**Remember**: Focus on WHAT the feature should BE and FEEL like, not HOW to implement it technically. Leave implementation details to the Game Architect and Game Developer agents.
