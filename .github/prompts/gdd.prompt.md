---
agent: gamedesigner
---
# Game Development Flow - Step 1

Create the Game Design Document (GDD) with the Game Designer agent

## Game Designer Agent

Here is the format you should use for generating the GDD:

# 🎮 Game Design Document (GDD)

## 1. Game Overview

### Title & Tagline
- **Title**: [Game Name]
- **Tagline**: [One-sentence hook that captures the essence]

### Core Information
- **Genre**: [Action, Platformer, Puzzle, RPG, Strategy, etc.]
- **Platform**: [PC, Web, Mobile, Console]
- **Target Audience**: [Age range, gaming experience level, interests]
- **Estimated Playtime**: [How long to complete? Replay value?]

### Core Pillars
[3-5 fundamental design principles that guide all decisions]
1. [Pillar 1] - Description
2. [Pillar 2] - Description
3. [Pillar 3] - Description

### Unique Selling Points (USP)
- What makes this game special and different?
- Why would players choose this over similar games?

## 2. Player Experience

### Core Gameplay Loop
Describe the minute-to-minute gameplay cycle:
```
[Player does X] → [Which leads to Y] → [Resulting in Z] → [Repeat]
```

### Emotional Journey
What should players FEEL while playing?
- [Emotion 1]: When/How
- [Emotion 2]: When/How
- [Emotion 3]: When/How

### Session Structure
- **Play Session Length**: [Typical play duration]
- **First 5 Minutes**: [What does new player experience?]
- **Mid-Game**: [What is core experience?]
- **End Game**: [How does it conclude?]

## 3. Core Mechanics

### Player Verbs (What Players DO)
List all primary actions available to the player:
1. [VERB]: Description (e.g., JUMP: Player can jump up to 3 units high)
2. [VERB]: Description
3. [VERB]: Description

### Primary Mechanics
[The fundamental interactions that drive gameplay]
- **[Mechanic 1]**: Detailed description, rules, values
- **[Mechanic 2]**: Detailed description, rules, values

### Secondary Mechanics
[Supporting systems that enhance the core experience]
- **[Mechanic 1]**: Description
- **[Mechanic 2]**: Description

### Feedback Systems
How does the game communicate to players?
- **Visual**: [Screen shake, particles, animations, color changes]
- **Audio**: [Sound effects, music changes, voice]
- **Haptic**: [Controller rumble, screen shake]
- **UI**: [Score popups, notifications, indicators]

## 4. Game Systems

### Progression System
How does the player advance?
- **Player Progression**: [Leveling, skills, abilities, stats]
- **Unlocks**: [What becomes available over time?]
- **Difficulty Curve**: [How does challenge increase?]

### Economy & Resources (if applicable)
- **Currency Types**: [Gold, points, energy, etc.]
- **Resource Sources**: [How players earn resources]
- **Resource Sinks**: [How players spend resources]
- **Balance**: [Economy balance goals]

### Scoring & Rewards
- **Score Calculation**: [How points are earned]
- **Multipliers**: [Combos, streaks, bonuses]
- **Achievements**: [Optional goals and rewards]
- **Leaderboards**: [Competition elements if applicable]

## 5. Content & Scope

### Levels / Stages
- **Number of Levels**: [How many?]
- **Level Variety**: [Different themes, mechanics, challenges]
- **Estimated Time per Level**: [Average completion time]

### Enemies / Challenges
- **Enemy Types**: [List different enemy behaviors]
- **Boss Fights**: [Special encounters if applicable]
- **Environmental Hazards**: [Obstacles, traps, etc.]
- **Difficulty Scaling**: [How challenge progresses]

### Items / Abilities / Power-Ups
- **Collectibles**: [What can players find/collect?]
- **Power-Ups**: [Temporary boosts]
- **Permanent Upgrades**: [Long-term progression]
- **Items**: [Tools, weapons, consumables]

## 6. User Interface

### Controls & Input
- **Primary Input**: [Keyboard, mouse, touch, gamepad]
- **Control Scheme**: [Key/button mappings]
- **Input Feel**: [Responsive, buffered, forgiving]

### HUD (Heads-Up Display)
What information is always visible?
- [Health/Lives]
- [Score/Currency]
- [Time/Progress]
- [Abilities/Cooldowns]

### Menus
- **Main Menu**: [Play, Settings, Credits, Quit]
- **Pause Menu**: [Resume, Restart, Settings, Main Menu]
- **Settings**: [Volume, graphics, controls, accessibility]
- **Game Over / Victory**: [Results, retry, continue]

### Accessibility Features
- [Colorblind modes]
- [Difficulty options]
- [Control remapping]
- [Text size options]
- [Audio captions]

## 7. Art & Audio Direction

### Visual Style
- **Art Style**: [Pixel art, low poly, realistic, hand-drawn, etc.]
- **Color Palette**: [Bright/dark, warm/cool, specific theme]
- **Mood**: [Cheerful, mysterious, tense, relaxing]
- **References**: [Similar games or art that inspires this]

### Audio Style
- **Music Direction**: [Energetic, ambient, orchestral, chiptune]
- **Sound Effects**: [Punchy, realistic, cartoonish, minimal]
- **Voice Acting**: [Yes/No, style if applicable]

### Theme & Setting
- **World/Setting**: [Where and when does the game take place?]
- **Story (if applicable)**: [Brief narrative overview]

## 8. Platform & Distribution

### Target Platform(s)
- **Primary**: [Web, PC, Mobile, Console]
- **Platform-Specific Considerations**: [Touch controls, graphics settings, etc.]

### Monetization (if applicable)
- **Business Model**: [Free, Premium ($X), Free-to-Play]
- **In-Game Purchases**: [Cosmetics, content, convenience (if applicable)]
- **Ads**: [If free-to-play, ad placement strategy]

### Distribution Platforms
- [itch.io, Steam, Mobile stores, Epic Games Store, etc.]

## 9. Success Metrics

### Player Engagement
- **Retention**: [How many players return after first session?]
- **Session Length**: [Average play time per session]
- **Completion Rate**: [What % should finish the game?]

### Quality Indicators
- **Fun Factor**: [How do we know players are having fun?]
- **Difficulty Balance**: [Not too hard, not too easy]
- **Bug-Free Experience**: [Acceptable bug threshold]

### Community Goals (if applicable)
- [Social sharing, multiplayer, leaderboards, community events]

## 10. Development Scope

### Minimum Viable Product (MVP)
What is the absolute minimum to ship a playable game?
- [Feature 1]
- [Feature 2]
- [Feature 3]

### Nice-to-Have Features
What can be added if time/budget allows?
- [Enhancement 1]
- [Enhancement 2]

### Post-Launch Plans (if applicable)
- [Updates, DLC, community events, bug fixes]

---

## Notes

The GDD document lives in `specs/gdd.md` and is a **living document**. Update and revise it as design evolves through playtesting and feedback.

**Remember**: Focus on WHAT the game IS and HOW IT FEELS, not HOW TO BUILD IT technically.
