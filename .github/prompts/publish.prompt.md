---
agent: publisher
---
# Game Publishing Flow

Analyze the game project and publish it to distribution platforms with optimized builds and automated pipelines.

## Your Responsibilities

### Pre-Publishing Analysis
1. Read `specs/gdd.md` to understand target platforms and distribution goals
2. Review `AGENTS.md` for technology stack and game engine
3. Consult `specs/adr/*.md` for build and deployment decisions
4. Analyze project structure (game engine, assets, build requirements)
5. Identify target distribution platforms (itch.io, Steam, web hosting, mobile stores)

### Publishing Workflow

**Step 1: Platform Selection**

Choose appropriate platforms based on game type:
- **Web Games**: itch.io, GitHub Pages, Netlify, Newgrounds
- **PC Games**: itch.io (easy start), Steam (commercial), Epic Games Store, GOG
- **Mobile Games**: Google Play Store, Apple App Store, itch.io (Android)
- **Console Games**: Xbox, PlayStation, Nintendo (requires dev programs)

**Recommended starting point**: **itch.io** (easiest, fastest, supports all platforms)

**Step 2: Build Configuration**

Set up platform-specific builds:

**For Unity Games**:
- Configure Build Settings for target platforms
- Set optimization settings (compression, code stripping)
- WebGL: Configure compression (Brotli/Gzip), template
- PC: Create builds for Windows, macOS, Linux
- Mobile: Configure IL2CPP, split APKs, signing

**For Godot Games**:
- Create export presets for each platform
- Configure HTML5 export for web
- Set up desktop exports (Windows, Mac, Linux)
- Configure mobile exports with signing

**For HTML5/JavaScript Games (Phaser, PixiJS, etc.)**:
- Use build tools (Webpack, Vite, Parcel)
- Minify and compress assets
- Create optimized production build
- Optimize bundle size (<50MB ideal for web)

**For Custom Engines**:
- Create platform-specific executables
- Package dependencies
- Create installers or distributable archives

**Step 3: Itch.io Publishing (Recommended First)**

Set up itch.io deployment:
1. Create game page on itch.io
2. Install Butler CLI for versioning:
   ```bash
   curl -L -o butler.zip https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default
   unzip butler.zip && chmod +x butler
   ./butler login
   ```
3. Push builds with Butler:
   ```bash
   ./butler push <build-dir> <user>/<game>:<channel> --userversion <version>
   # Example: ./butler push builds/web-gl myuser/mygame:web --userversion 1.0.0
   ```
4. Configure itch.io settings (pricing, visibility, embed options)

**Step 4: Web Hosting Setup (For Browser Games)**

Choose web hosting platform:

**GitHub Pages** (Free, simple):
- Commit build to repository
- Enable GitHub Pages in repo settings
- Optionally use custom domain

**Netlify/Vercel** (Free tier, better performance):
- Connect repository
- Configure build command
- Auto-deploy on push
- Get CDN and custom domain support

**Step 5: CI/CD Pipeline (Automation)**

Create `.github/workflows/build-and-publish.yml`:

```yaml
name: Build and Publish Game

on:
  push:
    tags:
      - 'v*'  # Trigger on version tags

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Engine-specific build steps
      - name: Build Game
        run: |
          # Build commands for specific engine
          
      # Deploy to itch.io
      - name: Deploy to itch.io
        env:
          BUTLER_API_KEY: ${{ secrets.BUTLER_API_KEY }}
        run: |
          curl -L -o butler.zip https://broth.itch.ovh/butler/linux-amd64/LATEST/archive/default
          unzip butler.zip
          chmod +x butler
          ./butler push builds/web ${{ secrets.ITCH_USER }}/${{ secrets.ITCH_GAME }}:web --userversion ${{ github.ref_name }}
          
      # Deploy to GitHub Pages
      - name: Deploy to GitHub Pages
        if: contains(github.ref, 'web')
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./builds/web
```

**Step 6: Build Optimization**

Optimize builds for distribution:

**File Size**:
- Compress textures (ASTC, ETC2, DXT for textures)
- Compress audio (OGG for music, optimized for SFX)
- Minify code and remove debug symbols
- Use asset bundles and lazy loading
- Target: <50MB for web, <100MB for desktop, <200MB for mobile

**Performance**:
- Test on low-end target devices
- Ensure 60 FPS on web, 30-60 FPS on mobile
- Optimize loading times (progressive loading for web)
- Profile and optimize hotspots

**Platform-Specific**:
- **Web**: Service worker for caching, progressive loading
- **Mobile**: Split APKs, adaptive icons, battery optimization
- **Desktop**: Multi-monitor support, graphics settings, input flexibility

**Step 7: Store Metadata & Marketing Assets**

Prepare for store listings:

**Required Assets**:
- **Screenshots**: 5-10 high-quality gameplay images (16:9 ratio)
- **Trailer**: 30-90 second video showing gameplay
- **Cover Image**: Eye-catching thumbnail (630x500 for itch.io)
- **Banner**: For store page header
- **Icon**: App icon for desktop/mobile (various sizes)

**Store Metadata**:
- **Title**: Game name (check for conflicts)
- **Tagline**: One-sentence hook
- **Description**: Compelling description with features
- **Genre/Tags**: Accurate categorization for discoverability
- **Pricing**: Free, $X, Pay-What-You-Want
- **Content Rating**: ESRB, PEGI, or platform-specific

**Step 8: Versioning & Release Management**

Implement semantic versioning:
- Format: `v1.2.3` (MAJOR.MINOR.PATCH)
- MAJOR: Breaking changes, major features
- MINOR: New features, backward compatible
- PATCH: Bug fixes

**Release Channels**:
- `alpha`: Unstable, internal testing
- `beta`: Feature-complete, public testing
- `stable`: Production release

**Step 9: Steam Publishing (Advanced)**

If targeting Steam:
1. **Create Steam Direct account** ($100 fee per game)
2. **Integrate Steamworks SDK**: Achievements, cloud saves, etc.
3. **Upload builds via SteamCmd** or Steamworks UI
4. **Configure store page**: Description, screenshots, pricing
5. **Submit for review**: Valve approval process
6. **Release**: Set release date or launch immediately

**CI/CD for Steam**: Use SteamCmd in CI pipeline

**Step 10: Mobile Store Publishing (Advanced)**

**Google Play Store**:
1. Create Google Play Developer account ($25 one-time)
2. Generate signed AAB (Android App Bundle)
3. Configure store listing
4. Submit for review (1-3 days)
5. Release to production/beta

**Apple App Store**:
1. Create Apple Developer account ($99/year)
2. Generate signed IPA with provisioning profiles
3. Upload via Xcode or Transporter
4. Configure App Store Connect
5. Submit for review (1-2 days)
6. Release upon approval

**Step 11: Post-Launch Monitoring**

Set up analytics and monitoring:
- **itch.io**: Built-in analytics (views, downloads, revenue)
- **Steam**: Steamworks analytics
- **Mobile**: Play Console / App Store Connect analytics
- **Custom**: Unity Analytics, GameAnalytics, Mixpanel

**Track Metrics**:
- Downloads/Installs
- Active users (DAU/MAU)
- Crash reports
- Player feedback and reviews
- Platform distribution
- Revenue (if applicable)

**Step 12: Documentation**

Create `docs/publishing.md` with:
- Build instructions for each platform
- Deployment process documentation
- Store credentials and accounts (secure storage)
- Update/hotfix procedures
- Rollback procedures if needed

## Tools to Use

Priority order:
1. **Butler CLI** - For itch.io deployment
2. **GitHub Actions** - For automated builds and deployment
3. **Context7/DeepWiki** - For researching platform-specific requirements
4. **Game Engine Build Tools** - Unity Build Server, Godot export, etc.

## Important Notes

- **Start with itch.io** - Easiest platform to get feedback quickly
- **Automate builds early** - Save time and reduce errors
- **Test on target platforms** - Don't assume builds work without testing
- **Optimize file sizes** - Especially critical for web games
- **Version everything** - Use semantic versioning and Git tags
- **Prepare marketing assets** - Screenshots and trailers are crucial
- **Monitor analytics** - Learn what players like and where they struggle
- **Iterate based on feedback** - Use early releases to improve the game

## Platform Priority Recommendations

**For Prototypes / Game Jams**:
1. itch.io (web) - Fastest to publish
2. GitHub Pages - Free hosting

**For Indie Games (Wide Reach)**:
1. itch.io - Build community first
2. Steam - Commercial launch when ready
3. Mobile stores - If optimized for mobile

**For Mobile-First**:
1. Google Play - Easier approval
2. Apple App Store - Higher ARPU
3. itch.io - Web version for exposure

**For Web Games**:
1. itch.io - Game-focused community
2. Newgrounds - Established community
3. Netlify/GitHub Pages - Direct control

Remember: Publishing is iterative. Start small, gather feedback, and expand to more platforms as the game matures!
