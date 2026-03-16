import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.js'],
    exclude: ['tests/structure.test.js', 'tests/engine.test.js'],
    environment: 'node',
  },
});
