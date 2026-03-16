# [ADR 0006] Deployment Platform and Hosting Strategy

**Date**: 2026-03-16  
**Status**: Accepted

## Context

Denmark Survival is a browser-based HTML5 game that needs to be deployed and made accessible to players. The game consists of:
- HTML files (index.html)
- JavaScript files (Phaser game code, scene files)
- CSS files (UI styling)
- Static assets (images, audio, fonts, tilemaps)
- Total estimated size: ~50MB uncompressed assets + ~500KB code

**User Requirements:**
- **Browser-only**: No installation required by players
- **Free hosting**: Zero or minimal cost
- **Easy deployment**: Simple process to update game
- **Global access**: No region restrictions
- **Fast loading**: Good performance for players
- **HTTPS**: Secure connection required for web features

**Target Audience Reach:**
- Primary: Web players (PC, Mac, Linux)
- Secondary: Mobile browsers (future consideration)
- Distribution: Itch.io, personal website, game portals

## Decision Drivers

- **Zero/Low Cost**: Free or very cheap hosting
- **Static Site Hosting**: Game is entirely client-side (no server needed)
- **Ease of Deployment**: Drag-and-drop or git-based deployment
- **CDN/Global Distribution**: Fast loading worldwide
- **HTTPS Support**: Required for modern web features
- **Asset Size Support**: Can handle ~50MB of game assets
- **Custom Domain**: Option to use custom domain (optional)
- **No Backend Needed**: Game uses localStorage (no database)
- **Minimal Setup**: Avoid complex DevOps

## Considered Options

### Option 1: Itch.io + GitHub Pages (Dual-Platform Strategy)
**Description**: Primary distribution on Itch.io (game portal), with GitHub Pages as backup/personal site hosting.

**Itch.io**:
- Upload game as HTML5 web game (all files in zip)
- Itch.io hosts and serves the game via iframe
- Built-in game portal with ratings, comments, downloads

**GitHub Pages**:
- Push code to GitHub repository
- Enable GitHub Pages in settings (branch: main, folder: /)
- Automatic deployment on every push
- Accessible at `username.github.io/repo-name`

**Pros**:
- ✅ **Completely free** - both platforms have free tiers
- ✅ **Itch.io is game-focused** - built-in audience, discovery, ratings
- ✅ **GitHub Pages is developer-friendly** - git-based workflow
- ✅ **CDN included** - both use CDNs for fast global delivery
- ✅ **HTTPS by default** - both provide SSL certificates
- ✅ **Easy deployment** - Itch.io: zip upload, GitHub: git push
- ✅ **No limits on game size** - both handle 50MB+ easily
- ✅ **Custom domain support** - can use custom domain with either
- ✅ **Version control built-in** - GitHub provides full git history
- ✅ **Community features** - Itch.io has forums, devlogs, analytics
- ✅ **Dual distribution** - increases reach and availability

**Cons**:
- ⚠️ **Manual sync needed** - must deploy to both platforms separately
- ⚠️ **Itch.io iframe** - game runs in iframe (minor constraint)

### Option 2: Netlify or Vercel
**Description**: Modern static site hosting platforms with automated deployment from Git.

**Pros**:
- ✅ Free tier generous (100GB bandwidth/month)
- ✅ Automatic deployment from Git commits
- ✅ Build pipeline included
- ✅ CDN included
- ✅ HTTPS automatic
- ✅ Custom domains easy
- ✅ Preview deployments for branches

**Cons**:
- ⚠️ Not game-specific (no built-in audience like itch.io)
- ⚠️ Bandwidth limits on free tier (could exceed if very popular)
- ⚠️ Requires GitHub account and git workflow
- ⚠️ More features than needed (build pipelines, serverless functions)

### Option 3: Self-Hosted (AWS S3, DigitalOcean Spaces)
**Description**: Host game files on cloud storage with static website hosting enabled.

**Pros**:
- ✅ Full control over hosting
- ✅ Scalable to any traffic level
- ✅ Can be very cheap ($1-5/month)

**Cons**:
- ❌ **Not free** - costs money even at low scale
- ❌ **DevOps required** - need to configure S3, CloudFront, DNS
- ❌ **No built-in audience** - need to market elsewhere
- ❌ **Complexity** - SSL certificates, CDN setup, permissions
- ❌ **Goes against "keep it simple" requirement**

### Option 4: Game Portals Only (Kongregate, Newgrounds, Armor Games)
**Description**: Upload to traditional Flash/HTML5 game portals.

**Pros**:
- ✅ Built-in audience and discovery
- ✅ Revenue sharing options (ads)
- ✅ Community features

**Cons**:
- ⚠️ Less control over hosting
- ⚠️ Portal-specific requirements and restrictions
- ⚠️ May require API integration for features
- ⚠️ Game may be surrounded by ads
- ⚠️ Some portals have file size limits

## Decision Outcome

**Chosen Option**: Itch.io + GitHub Pages (Dual-Platform Strategy)

**Rationale**:

1. **Completely Free**: Both platforms are free with no hidden costs or limits. Perfect for zero-budget project.

2. **Best of Both Worlds**:
   - **Itch.io**: Game distribution, community, built-in audience, ratings, devlogs
   - **GitHub Pages**: Developer-friendly, version control, backup hosting, shareable link

3. **Game-Specific Platform**: Itch.io is designed for indie games. Players come to itch.io to discover and play games. It has built-in features like ratings, comments, analytics, and collections.

4. **Simple Deployment**:
   - **Itch.io**: Export game files to ZIP, upload via web interface or Butler CLI
   - **GitHub Pages**: `git push` automatically deploys

5. **No Technical Barriers**: No need to configure DNS, SSL, CDN, or learn cloud infrastructure. Both platforms handle everything.

6. **Developer-Friendly**: GitHub Pages provides version control, issue tracking, and collaboration features for development team.

7. **Redundancy**: If one platform has issues, the other serves as backup.

8. **Community Building**: Itch.io enables direct player feedback, devlogs for development updates, and community engagement.

9. **Proven for Games**: Thousands of HTML5 games successfully hosted on both platforms.

## Deployment Strategy

### Primary Distribution: Itch.io

**Purpose**: Main player-facing distribution

**Setup Steps**:
1. Create Itch.io account (free)
2. Create new project: "Denmark Survival"
3. Set project type: HTML
4. Set pricing: Free (or pay-what-you-want)
5. Upload game files as ZIP
6. Configure embed settings (viewport size)
7. Write game description and tags
8. Publish!

**Itch.io Project Configuration**:
- **Title**: Denmark Survival
- **Short Description**: "Master the art of Danish living, one bike ride at a time - a cozy 2D RPG about adapting to life in Copenhagen"
- **Tags**: RPG, Simulation, Educational, 2D, Singleplayer, Life-Sim, Cultural
- **Viewport**: 1280x720 (or responsive)
- **Embed Options**: Click to launch in fullscreen
- **Release Status**: Early Access → Released

**File Structure for Itch.io Upload**:
```
denmark-survival.zip
├── index.html
├── src/
│   ├── main.js
│   ├── config.js
│   ├── scenes/
│   ├── ui/
│   └── constants/
├── assets/
│   ├── sprites/
│   ├── tilemaps/
│   ├── audio/
│   └── fonts/
└── styles.css
```

**Deployment Command** (using Butler CLI - optional):
```bash
butler push denmark-survival.zip username/denmark-survival:html5
```

### Secondary/Developer Hosting: GitHub Pages

**Purpose**: Version control, development sharing, backup hosting

**Setup Steps**:
1. Create GitHub repository: `denmark-survival`
2. Push game files to repository
3. Go to Settings → Pages
4. Enable Pages (source: main branch, root folder)
5. Game accessible at: `https://username.github.io/denmark-survival`

**Repository Structure**:
```
denmark-survival/
├── index.html
├── src/
├── assets/
├── README.md
├── .gitignore
└── CREDITS.md
```

**.gitignore**:
```
# Don't commit build artifacts if using bundler
node_modules/
dist/

# OS files
.DS_Store
Thumbs.db

# Editor files
.vscode/
.idea/
```

**GitHub README.md**:
```markdown
# Denmark Survival

A 2D RPG about adapting to life in Denmark.

**Play Now**: [Play on Itch.io](https://username.itch.io/denmark-survival)

## About
Master the art of Danish living through daily adventures in Copenhagen...

## Development
- Built with Phaser.js
- Open source assets from Kenney.nl, OpenGameArt.org
- ...
```

## Consequences

### Positive
- ✅ **Zero Cost**: Completely free hosting forever
- ✅ **Global Reach**: Itch.io audience + GitHub dev community
- ✅ **Simple Deployment**: No DevOps skills needed
- ✅ **Fast Loading**: Both platforms use CDNs
- ✅ **HTTPS Automatic**: Secure by default
- ✅ **Version Control**: Git history on GitHub
- ✅ **Community Features**: Itch.io ratings, comments, devlogs
- ✅ **Backup**: Redundant hosting on two platforms
- ✅ **Custom Domain**: Can add custom domain if desired (e.g., denmarksurvival.com)
- ✅ **Analytics**: Itch.io provides view/download stats
- ✅ **No Infrastructure**: No servers, databases, or backend to maintain

### Negative
- ⚠️ **Manual Sync**: Must deploy to both platforms separately (not automated)
- ⚠️ **Bandwidth Limits**: GitHub Pages has soft limit (100GB/month - should be fine)
- ⚠️ **No Backend**: Can't add multiplayer or cloud saves without additional service

**Mitigation Strategies**:
- Create deployment script to automate uploading to both platforms
- Monitor GitHub Pages bandwidth (unlikely to be an issue)
- If backend needed later, can add Netlify Functions or Firebase (free tiers)

### Neutral
- 📌 **Itch.io Revenue**: Can optionally enable pay-what-you-want or donations
- 📌 **Open Source**: GitHub repository can be public or private

## Implementation Notes

### 1. Deployment Workflow

**During Development:**
```bash
# Work locally
# Test in browser at localhost

# Commit changes
git add .
git commit -m "Add dialogue system"
git push origin main

# GitHub Pages automatically updates
```

**For Release/Updates:**
```bash
# 1. Build/optimize game (if using bundler)
npm run build

# 2. Create ZIP for Itch.io
zip -r denmark-survival.zip index.html src/ assets/ styles.css

# 3. Upload to Itch.io
# Option A: Web interface (drag & drop ZIP)
# Option B: Butler CLI
butler push denmark-survival.zip username/denmark-survival:html5 --userversion 1.0.0

# 4. Push to GitHub (automatic GitHub Pages deploy)
git push origin main
```

### 2. Itch.io Butler CLI Setup (Optional but Recommended)

**Install Butler**:
```bash
# Download Butler (itch.io's command-line tool)
# https://itch.io/docs/butler/

# Login
butler login

# First upload
butler push denmark-survival.zip username/denmark-survival:html5

# Updates are easy
butler push denmark-survival.zip username/denmark-survival:html5 --userversion 1.1.0
```

**Benefits of Butler**:
- Faster uploads (only uploads changed files)
- Version management
- Automation-friendly (can script releases)

### 3. GitHub Actions (Optional - Auto-Deploy)

Create `.github/workflows/deploy.yml` for automated deployment:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

### 4. Deployment Checklist

**Before Each Release**:
- [ ] Test game thoroughly in multiple browsers
- [ ] Optimize images (compress PNGs, convert to WebP if supported)
- [ ] Minify JavaScript (if using bundler)
- [ ] Test on slow connection (throttle in DevTools)
- [ ] Update version number in code
- [ ] Write release notes / devlog entry
- [ ] Update CREDITS.md with any new assets
- [ ] Create git tag for version (`git tag v1.0.0`)
- [ ] Push to GitHub
- [ ] Upload to Itch.io
- [ ] Test deployed game on both platforms
- [ ] Announce update on Itch.io devlog

### 5. Future Scaling Options

**If game becomes very popular and needs more:**

**CDN Optimization**:
- Add Cloudflare free tier in front of GitHub Pages
- Improves caching and performance
- Still free

**Cloud Saves** (if needed later):
- Firebase Realtime Database (free tier: 1GB storage)
- Players can save progress across devices
- Requires adding Firebase SDK

**Analytics**:
- Itch.io built-in analytics (views, downloads, ratings)
- Google Analytics (free) for detailed user tracking
- Add script tag to index.html

**Monetization** (optional):
- Itch.io: Pay-what-you-want model
- Patreon: Support ongoing development
- Ads: Not recommended for game experience

## References

- [Itch.io HTML5 Guide](https://itch.io/docs/creators/html5)
- [Itch.io Butler Documentation](https://itch.io/docs/butler/)
- [GitHub Pages Documentation](https://docs.github.com/en/pages)
- [GitHub Pages Custom Domain Setup](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- GDD: specs/gdd.md - Section 1 (Game Overview - Platform)
- Related ADRs:
  - ADR 0001 - Game Engine and Framework Selection
  - ADR 0007 - Build System and Development Workflow
