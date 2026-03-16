/**
 * tests/engine.test.js
 * Unit tests for the game engine configuration (Task 002).
 *
 * Validates:
 *  - config.js exports the expected constants (dimensions, physics, render)
 *  - All 9 scene files exist with correct scene keys and a create() method
 *  - main.js registers all 9 scene classes and declares the render config
 *  - BootScene.js transitions to MenuScene on load complete
 *
 * Run with:
 *   node tests/engine.test.js
 */

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath }            from 'node:url';
import { dirname, join, resolve }   from 'node:path';

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

function readSrc(rel) {
  return readFileSync(join(ROOT, rel), 'utf8');
}

// ---------------------------------------------------------------------------
console.log('\n⚙️   config.js — constants');
// ---------------------------------------------------------------------------

const config = readSrc('src/config.js');

assert(config.includes('WIDTH')  && config.includes('1280'),  'WIDTH = 1280');
assert(config.includes('HEIGHT') && config.includes('720'),   'HEIGHT = 720');
assert(config.includes('TARGET_FPS') && config.includes('60'), 'TARGET_FPS = 60');
assert(config.includes('BACKGROUND_COLOR') && config.includes('#1a1814'), 'BACKGROUND_COLOR = #1a1814');
assert(config.includes('GAME_CONTAINER_ID') && config.includes('game-container'), 'GAME_CONTAINER_ID = game-container');
assert(config.includes('PIXEL_ART')    && /PIXEL_ART\s*=\s*true/.test(config),  'PIXEL_ART exported as true');
assert(config.includes('ANTIALIAS')    && /ANTIALIAS\s*=\s*false/.test(config), 'ANTIALIAS exported as false');
assert(config.includes('ROUND_PIXELS') && /ROUND_PIXELS\s*=\s*true/.test(config),  'ROUND_PIXELS exported as true');

// ---------------------------------------------------------------------------
console.log('\n🎭  Scene files — existence and structure');
// ---------------------------------------------------------------------------

const sceneFiles = [
  'src/scenes/BootScene.js',
  'src/scenes/MenuScene.js',
  'src/scenes/CharacterCreationScene.js',
  'src/scenes/GameScene.js',
  'src/scenes/UIScene.js',
  'src/scenes/DialogueScene.js',
  'src/scenes/InventoryScene.js',
  'src/scenes/DaySummaryScene.js',
  'src/scenes/SettingsScene.js',
];

const expectedKeys = [
  'BootScene',
  'MenuScene',
  'CharacterCreationScene',
  'GameScene',
  'UIScene',
  'DialogueScene',
  'InventoryScene',
  'DaySummaryScene',
  'SettingsScene',
];

for (let i = 0; i < sceneFiles.length; i++) {
  const rel  = sceneFiles[i];
  const key  = expectedKeys[i];
  const path = join(ROOT, rel);

  assert(existsSync(path), `${rel} exists`);

  if (existsSync(path)) {
    const src = readFileSync(path, 'utf8');
    assert(src.includes(`key: '${key}'`) || src.includes(`key:"${key}"`),
      `${key} uses correct scene key`);
    assert(src.includes('create()') || src.includes('create ()'),
      `${key} implements create()`);
    assert(src.includes(`export class ${key}`),
      `${key} is exported as named class`);
  }
}

// ---------------------------------------------------------------------------
console.log('\n🚀  main.js — scene registration & render config');
// ---------------------------------------------------------------------------

const main = readSrc('src/main.js');

for (const key of expectedKeys) {
  assert(main.includes(key), `main.js imports/references ${key}`);
}

assert(main.includes('scene:'), 'main.js has scene array');
assert(main.includes('render:'), 'main.js has render config object');
assert(main.includes('pixelArt'), 'render config includes pixelArt');
assert(main.includes('antialias'), 'render config includes antialias');
assert(main.includes('roundPixels'), 'render config includes roundPixels');
assert(main.includes("physics:"), 'main.js has physics config');
assert(main.includes("arcade"), 'physics engine is arcade');
assert(main.includes("gravity"), 'arcade physics has gravity');
assert(main.includes('scale:'), 'main.js has scale config');
assert(main.includes('FIT'), 'scale mode is FIT');
assert(main.includes('CENTER_BOTH'), 'scale autoCenter is CENTER_BOTH');

// ---------------------------------------------------------------------------
console.log('\n🥾  BootScene.js — loading screen & transition');
// ---------------------------------------------------------------------------

const boot = readSrc('src/scenes/BootScene.js');

assert(boot.includes('Denmark Survival'), 'BootScene displays game title');
assert(boot.includes('preload()') || boot.includes('preload ()'), 'BootScene implements preload()');
assert(boot.includes("'progress'") || boot.includes('"progress"'), 'BootScene listens for loader progress event');
assert(boot.includes("'complete'") || boot.includes('"complete"'), 'BootScene listens for loader complete event');
assert(boot.includes("this.scene.start('MenuScene')") || boot.includes('this.scene.start("MenuScene")') || boot.includes("fadeToScene(this, 'MenuScene')") || boot.includes('fadeToScene(this, "MenuScene")'),
  'BootScene transitions to MenuScene');
assert(boot.includes('progressBar') || boot.includes('progress_bar'), 'BootScene has progress bar');
assert(boot.includes('percentText') || boot.includes('percent'), 'BootScene has percentage text');

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
