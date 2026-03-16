/**
 * tests/structure.test.js
 * Automated validation of the project structure for Denmark Survival.
 *
 * Run with Node.js (no test framework required):
 *   node tests/structure.test.js
 *
 * Checks that:
 *  - All required directories exist
 *  - index.html has required meta tags and script references
 *  - CREDITS.md exists
 *  - package.json has required fields and scripts
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);
const ROOT       = resolve(__dirname, '..');

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅  ${message}`);
    passed++;
  } else {
    console.error(`  ❌  ${message}`);
    failed++;
  }
}

function dirExists(rel) {
  return existsSync(join(ROOT, rel));
}

function fileExists(rel) {
  return existsSync(join(ROOT, rel));
}

function readFile(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
console.log('\n📁  Directory structure');
// ---------------------------------------------------------------------------

const requiredDirs = [
  'src/scenes',
  'src/constants',
  'src/state',
  'src/systems',
  'src/data',
  'src/ui',
  'src/utils',
  'assets/sprites',
  'assets/tilemaps',
  'assets/audio/music',
  'assets/audio/sfx',
  'assets/ui',
  'assets/fonts',
  'tests',
];

for (const dir of requiredDirs) {
  assert(dirExists(dir), `${dir}/ exists`);
}

// ---------------------------------------------------------------------------
console.log('\n📄  Required files');
// ---------------------------------------------------------------------------

const requiredFiles = [
  'index.html',
  'styles.css',
  'package.json',
  'src/main.js',
  'src/config.js',
  'CREDITS.md',
];

for (const file of requiredFiles) {
  assert(fileExists(file), `${file} exists`);
}

// ---------------------------------------------------------------------------
console.log('\n🌐  index.html — required elements');
// ---------------------------------------------------------------------------

const html = fileExists('index.html') ? readFile('index.html') : '';

assert(
  html.includes('<meta charset="UTF-8">') || html.includes("<meta charset='UTF-8'>"),
  'Has charset meta tag'
);
assert(
  html.includes('name="viewport"') || html.includes("name='viewport'"),
  'Has viewport meta tag'
);
assert(
  html.includes('Denmark Survival'),
  'Has correct <title>'
);
assert(
  /phaser@3\.[89]/.test(html) || /phaser@3\.80/.test(html),
  'Loads Phaser 3.80+ via CDN'
);
assert(
  /https:\/\/cdn\.jsdelivr\.net\/npm\/phaser@/.test(html),
  'Loads Phaser from jsDelivr CDN (exact URL pattern)'
);
assert(
  html.includes('styles.css'),
  'Loads styles.css'
);
assert(
  html.includes('type="module"'),
  'Has <script type="module">'
);
assert(
  html.includes('src/main.js'),
  'Module script points to src/main.js'
);
assert(
  html.includes('id="game-container"'),
  'Contains #game-container div'
);
assert(
  (html.match(/class="overlay"/g) || []).length >= 4,
  'Has at least 4 overlay containers'
);

// ---------------------------------------------------------------------------
console.log('\n📦  package.json — required fields');
// ---------------------------------------------------------------------------

let pkg = {};
try {
  pkg = JSON.parse(readFile('package.json'));
} catch {
  assert(false, 'package.json is valid JSON');
}

assert(pkg.name === 'denmark-survival', 'name is "denmark-survival"');
assert(typeof pkg.version === 'string', 'version is set');
assert(pkg.license === 'MIT', 'license is MIT');
assert(
  typeof pkg.scripts?.dev === 'string' && pkg.scripts.dev.includes('http-server'),
  'scripts.dev uses http-server'
);
assert(
  pkg.scripts?.dev?.includes('8080'),
  'dev server runs on port 8080'
);
assert(
  pkg.scripts?.dev?.includes('-c-1'),
  'dev server has no-cache flag (-c-1)'
);
assert(
  !pkg.dependencies || Object.keys(pkg.dependencies).length === 0,
  'No production dependencies (Phaser via CDN)'
);
assert(
  pkg.devDependencies && 'http-server' in pkg.devDependencies,
  'http-server in devDependencies'
);

// ---------------------------------------------------------------------------
console.log('\n🎨  styles.css — required rules');
// ---------------------------------------------------------------------------

const css = fileExists('styles.css') ? readFile('styles.css') : '';

assert(css.includes('--color-'), 'Has CSS custom properties for colour palette');
assert(css.includes('#game-container'), 'Styles #game-container');
assert(css.includes('.overlay'), 'Styles .overlay containers');
assert(css.includes('display: none') || css.includes('display:none'), 'Overlays hidden by default');
assert(css.includes('@media'), 'Has responsive @media queries');
assert(
  css.includes('44px') || css.includes('var(--touch-target-min)'),
  'Defines 44px touch targets'
);

// ---------------------------------------------------------------------------
console.log('\n📜  CREDITS.md');
// ---------------------------------------------------------------------------

const credits = fileExists('CREDITS.md') ? readFile('CREDITS.md') : '';
assert(credits.includes('Phaser'), 'CREDITS.md references Phaser');
assert(credits.includes('MIT'), 'CREDITS.md references MIT license');

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${'─'.repeat(48)}`);
console.log(`Result: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All checks passed! ✅\n');
}
