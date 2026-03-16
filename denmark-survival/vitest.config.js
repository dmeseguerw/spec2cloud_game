import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    exclude: ['tests/structure.test.js', 'tests/engine.test.js'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      reportsDirectory: 'coverage',
      include: ['src/**/*.js'],
      // Exclude scene stubs (Phaser-dependent) but keep BaseScene.js and SceneTransition.js
      exclude: [
        'src/main.js',
        'src/scenes/BootScene.js',
        'src/scenes/MenuScene.js',
        'src/scenes/CharacterCreationScene.js',
        'src/scenes/GameScene.js',
        'src/scenes/UIScene.js',
        'src/scenes/DialogueScene.js',
        'src/scenes/InventoryScene.js',
        'src/scenes/DaySummaryScene.js',
        'src/scenes/SettingsScene.js',
        'src/scenes/PauseScene.js',
      ],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
      },
    },
    setupFiles: ['tests/mocks/setupPhaser.js'],
  },
});
