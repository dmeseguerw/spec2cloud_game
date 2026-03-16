/**
 * tests/mocks/setupPhaser.js
 * Vitest setup file: installs a minimal Phaser global used by scene classes.
 * Runs automatically before each test file via vitest.config.js setupFiles.
 *
 * BootScene and other scene classes extend Phaser.Scene, which is normally
 * provided by the Phaser CDN in the browser.  This stub makes unit tests
 * runnable in Node.js without a real browser or canvas.
 */

/**
 * Minimal Phaser.Scene base class.
 * Scene subclasses call super({ key: 'SomeName' }) in their constructors.
 */
class MockPhaserScene {
  constructor(config) {
    this._config = config || {};
  }
}

global.Phaser = {
  Scene: MockPhaserScene,
};
