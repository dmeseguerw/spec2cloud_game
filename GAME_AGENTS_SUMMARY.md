# Game Development Agent Transformation - Summary

This document summarizes the transformation of the spec2cloud template from an Azure-focused application development workflow to a game development workflow.

## 🎮 New Game Development Agents Created

### 1. **gamedesigner** (`gamedesigner.agent.md`)
**Purpose**: Game Design Document (GDD) creation and feature design  
**Replaces**: `pm` agent (for game projects)  
**Responsibilities**:
- Creates Game Design Documents (GDD) in `specs/gdd.md`
- Breaks down GDD into Feature Design Documents (FDD) in `specs/features/*.md`
- Defines game mechanics, player experience, progression, and balance
- Focuses on WHAT the game feels like, not HOW to build it

**Prompt**: `/gdd` - Creates game design documents  
**Related Prompts**: 
- `gdd.prompt.md` - Template for creating GDDs
- `fdd.prompt.md` - Template for creating FDDs

### 2. **gamearchitect** (`gamearchitect.agent.md`)
**Purpose**: Game-specific technical architecture and technology decisions  
**Replaces**: `architect` agent (for game projects)  
**Responsibilities**:
- Game engine selection (Unity, Unreal, Godot, HTML5 frameworks)
- Architecture pattern decisions (ECS, Component-Based, OOP)
- Performance optimization strategies
- Platform-specific technical considerations
- Creates ADRs for game systems

**Key Decisions**:
- Game engine choice and rationale
- Architecture patterns (ECS vs Component-Based)
- Physics/audio/input system architecture
- State management approach
- Platform adaptations (web, mobile, desktop, console)

### 3. **gamedev** (`gamedev.agent.md`)
**Purpose**: Game code implementation and mechanics development  
**Replaces**: `dev` agent (for game projects)  
**Responsibilities**:
- Implements game mechanics, systems, and features
- Player controllers, combat, AI, physics, UI
- Breaks down features into technical tasks (`/plan`)
- Focuses on game feel, polish, and player experience
- Engine-specific implementation (Unity C#, Godot GDScript, Phaser JS, etc.)

**Workflows**:
- `/plan` - Break down FDDs into technical tasks
- `/implement` - Implement game features with polish and juice

**Special Focus**:
- Game feel and responsiveness
- Object pooling and performance
- Input buffering and forgiveness
- Visual/audio feedback and polish

### 4. **publisher** (`publisher.agent.md`)
**Purpose**: Game publishing and distribution  
**Replaces**: `azure` agent (for game projects)  
**Responsibilities**:
- Publishing to distribution platforms (itch.io, Steam, mobile stores)
- Platform-specific builds (Windows, Mac, Linux, WebGL, Android, iOS)
- Build optimization and automation
- CI/CD pipelines for game releases
- Store metadata and marketing assets

**Prompt**: `/publish` - Set up publishing pipeline  
**Related Prompts**: `publish.prompt.md` - Game publishing workflow

**Platforms Supported**:
- **Web**: itch.io, GitHub Pages, Netlify, Newgrounds
- **PC**: Steam, itch.io, Epic Games Store, GOG
- **Mobile**: Google Play Store, Apple App Store
- **Console**: Xbox, PlayStation, Nintendo (advanced)

**Recommended Starting Point**: itch.io (easiest, fastest feedback)

## 📝 New Prompt Files Created

1. **`gdd.prompt.md`** - Game Design Document template and workflow
2. **`fdd.prompt.md`** - Feature Design Document template for game features
3. **`publish.prompt.md`** - Game publishing workflow and platform deployment

## 🔄 Modified Existing Agents

All legacy agents have been updated with notes to use game-specific agents for game projects:

1. **`pm.agent.md`** → Use `gamedesigner` for games
2. **`architect.agent.md`** → Use `gamearchitect` for games
3. **`dev.agent.md`** → Use `gamedev` for games
4. **`azure.agent.md`** → Use `publisher` for games

These agents remain available for non-game projects (web apps, APIs, etc.).

## 🎯 Updated Main Orchestrator

**`spec2cloud.agent.md`** has been updated to:
- Recognize game development intent
- Route to appropriate game agents
- Provide game-specific examples
- Update decision tree for game vs app projects
- New multi-agent orchestration patterns for game development

## 🎮 Game Development Workflow

### Greenfield (New Game)
```
User: "I want to build a 2D platformer"
    ↓
gamedesigner → Creates GDD
    ↓
devlead → Reviews for feasibility
    ↓
gamearchitect → Chooses engine, makes architecture decisions (ADRs)
    ↓
gamedesigner → Breaks down into FDDs
    ↓
gamedev → Plans tasks (/plan)
    ↓
gamedev → Implements features (/implement)
    ↓
publisher → Publishes to itch.io (/publish)
    ↓
✅ Playable game published for feedback
```

### Key Differences from Original Workflow

| Original (App Dev) | New (Game Dev) |
|-------------------|----------------|
| PRD (Product Req) | GDD (Game Design Doc) |
| FRD (Feature Req) | FDD (Feature Design Doc) |
| pm agent | gamedesigner agent |
| architect agent | gamearchitect agent |
| dev agent | gamedev agent |
| azure agent (Azure) | publisher agent (itch.io/Steam/etc.) |
| Focus: Business value | Focus: Player experience |
| Tech: Web/API/Database | Tech: Game engine/physics/rendering |
| Deploy: Azure | Publish: itch.io, Steam, app stores |

## 🚀 Getting Started with Game Development

### Quick Start
1. Describe your game idea to the orchestrator
2. It will invoke `gamedesigner` to create a GDD
3. `gamearchitect` will help choose the right engine and architecture
4. `gamedev` will implement the game
5. `publisher` will deploy to itch.io for playtesting

### Example Prompts
- "Create a GDD for a roguelike dungeon crawler"
- "Should I use Unity or Godot for my 2D platformer?"
- "Implement a combat system with melee and ranged attacks"
- "Publish my game to itch.io and set up automated builds"

## 📚 File Structure for Game Projects

```
specs/
  gdd.md                    # Game Design Document (instead of prd.md)
  features/                 # Feature Design Documents
    player-movement.md
    combat-system.md
    progression.md
  adr/                      # Architecture Decision Records
    0001-game-engine-selection.md
    0002-architecture-pattern.md
    0003-input-system.md
  tasks/                    # Technical task breakdowns

.github/
  agents/
    gamedesigner.agent.md   # NEW
    gamearchitect.agent.md  # NEW
    gamedev.agent.md        # NEW
    publisher.agent.md      # NEW
  prompts/
    gdd.prompt.md           # NEW
    fdd.prompt.md           # NEW
    publish.prompt.md       # NEW
```

## 🎯 When to Use Which Agent

**Game Designer** → Design, mechanics, feel, player experience  
**Game Architect** → Engine choice, architecture patterns, technical decisions  
**Game Developer** → Implementation, code, game systems  
**Publisher** → Builds, distribution, deployment, stores  
**Dev Lead** → Reviews for feasibility and scope (works for both apps and games)  
**Tech Analyst** → Analyze existing code (works for both apps and games)  
**Modernizer** → Upgrade/refactor (works for both apps and games)

## ✅ Benefits for Game Development

1. **Specialized Agents**: Game-specific knowledge in each agent
2. **Game Engine Support**: Unity, Unreal, Godot, HTML5 frameworks
3. **Platform Flexibility**: Web, PC, mobile, console
4. **Distribution Focus**: itch.io first, expand to Steam/stores
5. **Player Experience First**: Design documents focus on fun and feel
6. **Rapid Prototyping**: Quick publish to itch.io for feedback
7. **Performance Aware**: Game-specific optimization patterns
8. **Engine-Specific**: Best practices for Unity, Godot, Phaser, etc.

## 🔧 Legacy Agent Support

The original agents (pm, architect, dev, azure) remain available for:
- Traditional web applications
- REST APIs and backend services
- Cloud-native applications
- Azure deployments
- Enterprise applications

Simply use the original agent names for non-game projects.

## 📖 Next Steps

1. **Try it out**: Ask to create a simple game GDD
2. **Choose your engine**: Let gamearchitect recommend Unity/Godot/etc.
3. **Start building**: gamedev will implement your game
4. **Publish quickly**: Get on itch.io fast for feedback
5. **Iterate**: Use feedback to improve your game

---

**Template Name**: spec2cloud_game  
**Focus**: Game Development (from concept to published game)  
**Distribution**: itch.io, Steam, Mobile Stores, Web Hosting  
**Not Azure-Focused**: Optimized for game platforms, not cloud infrastructure
