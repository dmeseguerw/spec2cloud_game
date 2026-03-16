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
      exclude: ['src/main.js', 'src/scenes/*.js'],
      thresholds: {
        lines: 85,
        branches: 85,
        functions: 85,
      },
    },
    setupFiles: ['tests/mocks/setupPhaser.js'],
  },
});
