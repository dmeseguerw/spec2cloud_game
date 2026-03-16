# [ADR 0003] Asset Management and Open Source Asset Strategy

**Date**: 2026-03-16  
**Status**: Accepted

## Context

Denmark Survival requires significant 2D game assets:
- **Character sprites**: Player character with multiple nationalities/jobs, NPCs (10+ main characters, 50+ generic NPCs)
- **Environment art**: Copenhagen city streets, buildings, interiors (apartments, stores, metro, parks)
- **UI elements**: Buttons, panels, icons for inventory, skills, encyclopedia
- **Tilemap assets**: Tilesets for city streets, buildings, interiors
- **Audio**: Background music, ambient sounds (bikes, traffic, metro), sound effects
- **Fonts**: For dialogue, UI, and stylized text

The game needs a **cozy, approachable 2D art style** (per GDD) with potential for pixel art or illustrated style. All assets must be **open source or free to use** with permissive licenses.

**Budget Constraint**: Zero budget for commercial assets - must use free/open source resources.

**Technical Requirements**:
- Assets must work with Phaser.js
- Tilemaps should use Tiled Map Editor format (JSON)
- Sprites should be organized as atlases for performance
- Total asset size should be reasonable for web loading (<50MB uncompressed)

## Decision Drivers

- **Zero Cost**: Must be completely free (no paid assets)
- **License Compatibility**: CC0, CC-BY, MIT, or similar permissive licenses
- **Art Style Consistency**: Assets should have cohesive look when combined
- **Phaser Compatibility**: Must work with Phaser's asset loaders
- **Ease of Creation**: For custom assets team can't find, easy to create/modify
- **Web Performance**: Reasonable file sizes for browser loading
- **Variety Needed**: Enough variety for 10+ locations, diverse characters
- **Tool Accessibility**: Asset creation tools should be free and cross-platform

## Considered Options

### Option 1: Curated Open Source Asset Packs + Tiled + Custom Assets
**Description**: Combine assets from established open source repositories (OpenGameArt.org, itch.io free assets, Kenney.nl) with custom-created assets using free tools (Tiled, Pixelorama/Aseprite, Audacity).

**Asset Sources**:
- **Sprites**: Kenney.nl asset packs, OpenGameArt.org, LPC character generator
- **Tilesets**: Kenney.nl, OpenGameArt.org, Tiled built-in examples
- **UI**: Kenney.nl UI packs, free UI asset packs on itch.io
- **Audio**: Freesound.org, OpenGameArt.org, LMMS for custom music
- **Fonts**: Google Fonts, FontLibrary

**Tools**:
- **Tiled Map Editor** (free, FOSS) - for creating city maps
- **Pixelorama** (free, FOSS) or **Aseprite** ($20, but has free trial) - pixel art editing
- **GIMP** (free, FOSS) - general image editing
- **Audacity** (free, FOSS) - audio editing
- **LMMS** (free, FOSS) - music creation
- **TexturePacker** (free tier) - sprite atlas creation

**Pros**:
- ✅ High-quality, proven assets from reputable sources
- ✅ Permissive licenses (CC0, CC-BY 3.0, MIT)
- ✅ Large variety available across multiple sources
- ✅ Kenney.nl specifically designed for game dev (optimized, consistent style)
- ✅ Active communities for support
- ✅ Can supplement with custom assets as needed
- ✅ Free professional tools available
- ✅ Tiled exports directly to Phaser-compatible JSON
- ✅ Can mix and match to create unique look

**Cons**:
- ⚠️ Requires curation to ensure style consistency
- ⚠️ May need custom modifications to fit Denmark theme
- ⚠️ Character diversity may require LPC customization or custom work
- ⚠️ Attribution required for some CC-BY assets (managed via credits screen)

### Option 2: Single Asset Pack Ecosystem (Kenney.nl Only)
**Description**: Use exclusively Kenney.nl asset packs, which have cohesive art style and CC0 license (no attribution required).

**Pros**:
- ✅ Consistent art style across all assets
- ✅ CC0 license (public domain, no attribution needed)
- ✅ High quality, professionally made
- ✅ Regular updates and new packs
- ✅ Includes UI, characters, environments, audio

**Cons**:
- ❌ Limited character diversity (mostly generic)
- ❌ No Denmark-specific assets (will need customization anyway)
- ❌ Style may be too "generic game" rather than Denmark-specific
- ❌ Restricts creative flexibility

### Option 3: Commission/Purchase Asset Packs
**Description**: Purchase commercial asset packs from marketplaces like itch.io, Unity Asset Store, or commission custom art.

**Pros**:
- ✅ Professional quality
- ✅ Denmark-specific customization possible
- ✅ Complete style cohesion

**Cons**:
- ❌ **Costs money** (violates zero-budget constraint)
- ❌ Not open source
- ❌ Licensing may restrict use

### Option 4: 100% Custom Asset Creation
**Description**: Create all assets from scratch using free tools like Pixelorama, GIMP, Audacity.

**Pros**:
- ✅ Complete creative control
- ✅ Perfect fit for Denmark theme
- ✅ Unique art style
- ✅ No licensing concerns

**Cons**:
- ❌ Extremely time-consuming (hundreds of hours for art alone)
- ❌ Requires significant art/audio skills
- ❌ High risk of inconsistent quality
- ❌ Delays development significantly
- ❌ Not practical for project scope

## Decision Outcome

**Chosen Option**: Curated Open Source Asset Packs + Tiled + Custom Assets (Option 1)

**Rationale**:

1. **Best Balance**: Combines speed of using existing assets with flexibility to customize for Denmark theme. Team can start development immediately with placeholder assets and refine over time.

2. **Quality + Freedom**: Sources like Kenney.nl and OpenGameArt.org provide professional-quality assets with permissive licenses, while custom tools allow creating Denmark-specific content (Danish flags, specific building styles, Copenhagen landmarks).

3. **Proven Workflow**: This is the standard approach for indie game development. Thousands of successful games combine open source packs with custom assets.

4. **Phaser Compatibility**: Tiled Map Editor is the gold standard for Phaser tilemap workflow. Direct JSON export means zero friction.

5. **Scalability**: Can start with generic European city assets and progressively add Denmark-specific details as development continues.

6. **Cost**: Completely free. All tools and assets are open source or have free tiers sufficient for this project.

## Asset Strategy by Category

### 1. Character Sprites

**Source**: LPC (Liberated Pixel Cup) Character Generator + Custom modifications
- **URL**: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/
- **License**: CC-BY-SA 3.0 / GPL 3.0
- **Why**: Massive community-created character customization system. Can create diverse characters with different skin tones, clothing, hairstyles
- **Usage**: Generate base characters, modify to add Denmark-specific clothing (winter coats, Danish fashion)
- **Format**: Spritesheets (animate in Phaser)

**Alternative**: Kenney.nl "Pixel Platformer" pack for simpler top-down sprites

### 2. Environment Tiles (City, Buildings, Interiors)

**Source**: Kenney.nl "Roguelike/RPG Pack" + OpenGameArt.org tileset collection
- **Kenney URL**: https://kenney.nl/assets (search RPG, city, top-down)
- **OpenGameArt**: https://opengameart.org/ (filter: tiles, CC0/CC-BY)
- **License**: CC0 (Kenney), CC-BY 3.0 (most OpenGameArt)
- **Why**: Professional quality, designed for games, tileable
- **Usage**: Create Copenhagen map in Tiled using these tilesets
- **Format**: PNG tilesets → Tiled JSON maps → Phaser

**Custom Additions**:
- Danish flags
- Specific Copenhagen buildings/landmarks (custom pixel art)
- Winter/seasonal variations

### 3. UI Elements

**Source**: Kenney.nl UI packs
- **URL**: https://kenney.nl/assets/ui-pack
- **License**: CC0
- **Why**: Complete UI kits (buttons, panels, sliders, icons), multiple styles
- **Usage**: Inventory screen, dialogue boxes, menus, HUD
- **Format**: Individual PNGs or sprite atlas

### 4. Icons and Symbols

**Source**: Game-icons.net
- **URL**: https://game-icons.net/
- **License**: CC-BY 3.0
- **Why**: 4000+ game icons, SVG format (scalable), consistent style
- **Usage**: Inventory items, skills, stats, encyclopedia entries
- **Format**: SVG (convert to PNG for Phaser)

### 5. Audio - Music

**Source**: OpenGameArt.org + LMMS for custom loops
- **OpenGameArt Music**: https://opengameart.org/ (filter: music, CC0/CC-BY)
- **LMMS**: https://lmms.io/ (free music creation software)
- **License**: CC0 / CC-BY 3.0
- **Usage**: 
  - Cozy background music for city exploration (Nordic/chill vibe)
  - Menu music
  - Seasonal variations
- **Format**: MP3/OGG

**Recommended**: Look for "Nordic", "calm", "ambient", "cozy" tags

### 6. Audio - Sound Effects

**Source**: Freesound.org + custom recordings
- **URL**: https://freesound.org/
- **License**: CC0 / CC-BY 3.0
- **Why**: Massive library, specific sounds (bike bells, metro doors, footsteps, cash register)
- **Usage**: All in-game sound effects
- **Format**: MP3/OGG

**Key sounds needed**:
- Bike bell, bike chain
- Metro doors, train sounds
- Footsteps (various surfaces)
- UI clicks
- Cash register
- Weather (rain, wind)
- Dialogue "blip" sound

### 7. Fonts

**Source**: Google Fonts
- **URL**: https://fonts.google.com/
- **License**: OFL (Open Font License)
- **Why**: Free, web-optimized, huge variety
- **Recommendations**:
  - **Dialogue/UI**: "Inter" or "Roboto" (clean, readable)
  - **Stylized/Titles**: "Press Start 2P" (pixel game) or "Fredoka" (friendly, rounded)
- **Format**: TTF/WOFF → Load in Phaser

## Asset Organization

### Directory Structure
```
assets/
├── sprites/
│   ├── characters/
│   │   ├── player/
│   │   │   ├── player-atlas.png
│   │   │   └── player-atlas.json
│   │   └── npcs/
│   │       ├── mentor.png
│   │       └── ...
│   ├── objects/
│   │   ├── bike.png
│   │   ├── groceries.png
│   │   └── ...
│   └── environment/
│       ├── buildings.png
│       └── props.png
├── tilemaps/
│   ├── copenhagen-city.json         # Tiled map
│   ├── tilesets/
│   │   ├── city-tiles.png
│   │   ├── interior-tiles.png
│   │   └── ...
│   └── objects/                     # Tiled object layers
├── ui/
│   ├── buttons/
│   ├── panels/
│   ├── icons/
│   └── ui-atlas.json
├── audio/
│   ├── music/
│   │   ├── menu-theme.mp3
│   │   ├── city-ambient.mp3
│   │   └── ...
│   └── sfx/
│       ├── bike-bell.mp3
│       ├── ui-click.mp3
│       └── ...
└── fonts/
    ├── Inter-Regular.ttf
    └── PressStart2P.ttf
```

### File Size Budget
- **Total**: < 50MB uncompressed
- **Sprites**: ~10MB
- **Tilemaps**: ~5MB
- **UI**: ~3MB
- **Audio Music**: ~15MB (compressed MP3/OGG)
- **Audio SFX**: ~5MB
- **Fonts**: ~1MB

**Optimization**:
- Use sprite atlases (TexturePacker or Phaser built-in)
- Compress audio to MP3/OGG (not WAV)
- Use WebP for sprites where supported (fallback to PNG)
- Load assets progressively (not all at once)

## Consequences

### Positive
- ✅ **Zero Cost**: All assets free and legally usable
- ✅ **Immediate Start**: Can begin development with existing assets today
- ✅ **High Quality**: Proven open source packs look professional
- ✅ **Flexibility**: Mix and match + custom assets for Denmark theme
- ✅ **Legal Clarity**: Clear licenses, no usage restrictions
- ✅ **Community Support**: Large communities around these asset sources
- ✅ **Scalable**: Easy to add more assets as game grows
- ✅ **Phaser Integration**: All formats work seamlessly with Phaser

### Negative
- ⚠️ **Curation Time**: Need to find and test asset compatibility
- ⚠️ **Style Mixing**: Risk of inconsistent art style (mitigated by careful selection)
- ⚠️ **Attribution Required**: Some CC-BY assets need credit (manageable with credits screen)
- ⚠️ **Denmark Specificity**: Generic assets need customization for Danish theme

**Mitigation Strategies**:
- Create asset style guide (color palette, line width, level of detail)
- Use consistent asset sources (prefer Kenney.nl + LPC for cohesion)
- Implement credits screen for proper attribution
- Plan custom asset creation for key Denmark-specific elements
- Test all assets together early to ensure visual cohesion

### Neutral
- 📌 **Requires Tools Learning**: Team needs to learn Tiled, GIMP/Pixelorama
- 📌 **Asset Management**: Need clear file organization from day one

## Implementation Notes

### 1. Asset Pipeline Workflow

**Week 1-2: Foundation**
1. Download Kenney.nl "Roguelike/RPG" pack
2. Download Kenney.nl "UI Pack"
3. Generate 3-5 base characters from LPC generator
4. Set up Tiled project with example tileset
5. Create basic Copenhagen map (placeholder)
6. Organize asset directory structure

**Week 3-4: Core Assets**
1. Create character sprite atlases in TexturePacker
2. Build main game area map in Tiled (city center)
3. Add UI sprites and create UI atlas
4. Source 5-10 key sound effects from Freesound
5. Find 2-3 background music tracks
6. Set up fonts in Phaser

**Week 5+: Custom & Polish**
1. Create Denmark-specific sprites (flags, landmarks)
2. Expand maps (more locations)
3. Add seasonal variations
4. Custom music loops (optional)
5. Polish and optimize

### 2. Phaser Asset Loading Example

```javascript
// In BootScene or PreloadScene
class PreloadScene extends Phaser.Scene {
  preload() {
    // Character atlas
    this.load.atlas(
      'player',
      'assets/sprites/characters/player/player-atlas.png',
      'assets/sprites/characters/player/player-atlas.json'
    );
    
    // Tilemap and tileset
    this.load.image('city-tiles', 'assets/tilemaps/tilesets/city-tiles.png');
    this.load.tilemapTiledJSON('copenhagen-city', 'assets/tilemaps/copenhagen-city.json');
    
    // UI atlas
    this.load.atlas('ui', 'assets/ui/ui-atlas.png', 'assets/ui/ui-atlas.json');
    
    // Audio
    this.load.audio('city-ambient', 'assets/audio/music/city-ambient.mp3');
    this.load.audio('bike-bell', 'assets/audio/sfx/bike-bell.mp3');
    
    // Loading bar
    this.load.on('progress', (value) => {
      this.loadingBar.fillRect(0, 0, 400 * value, 30);
    });
  }
}
```

### 3. Attribution Management

Create `CREDITS.md` file tracking all assets:

```markdown
# Asset Credits

## Sprites
- LPC Characters: https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/
  - License: CC-BY-SA 3.0 / GPL 3.0
  - Contributors: [List from generator]

- Kenney.nl Assets:
  - Roguelike/RPG Pack: CC0 (Public Domain)
  - UI Pack: CC0 (Public Domain)

## Audio
- "Calm Nordic Ambient" by Artist: CC-BY 3.0 (Freesound.org/...)
- "Bike Bell" by Artist: CC0 (Freesound.org/...)

## Fonts
- Inter: OFL (Google Fonts)
```

Display condensed version in in-game credits screen.

### 4. Tools Installation

**Required Tools** (all free):
- **Tiled Map Editor**: https://www.mapeditor.org/
- **GIMP**: https://www.gimp.org/
- **Pixelorama**: https://orama-interactive.itch.io/pixelorama
- **Audacity**: https://www.audacityteam.org/
- **TexturePacker**: https://www.codeandweb.com/texturepacker (free tier)

**Optional Tools**:
- **LMMS**: https://lmms.io/ (music creation)
- **Inkscape**: https://inkscape.org/ (vector graphics for icons)

## References

- [Kenney.nl Asset Library](https://kenney.nl/assets)
- [OpenGameArt.org](https://opengameart.org/)
- [LPC Character Generator](https://sanderfrenken.github.io/Universal-LPC-Spritesheet-Character-Generator/)
- [Freesound.org](https://freesound.org/)
- [Game Icons](https://game-icons.net/)
- [Google Fonts](https://fonts.google.com/)
- [Tiled Map Editor](https://www.mapeditor.org/)
- [Phaser Asset Loading](https://docs.phaser.io/phaser/concepts/loader)
- GDD: specs/gdd.md - Section 7 (Art & Audio Direction)
- Related ADRs:
  - ADR 0001 - Game Engine and Framework Selection
  - ADR 0002 - Scene Architecture Pattern
