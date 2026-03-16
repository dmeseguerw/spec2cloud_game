/**
 * tests/ui/DialogBox.test.js
 * Unit tests for DialogBox — typewriter dialog box with response buttons.
 *
 * Phaser.Scene is mocked globally by tests/mocks/setupPhaser.js (vitest setupFiles).
 * Uses fake timers to control typewriter effect timing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DialogBox } from '../../src/ui/DialogBox.js';

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function buildDialog(config = {}) {
  const rectObjects = [];
  const textObjects = [];
  const scene = {
    scale: { width: 1280, height: 720 },
    add: {
      rectangle: vi.fn().mockImplementation(() => {
        const obj = {
          x: 0, y: 0, width: 0, height: 0, visible: true, depth: 0,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setAlpha: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setInteractive: vi.fn().mockReturnThis(),
          setFillStyle: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
          on: vi.fn().mockImplementation(function(event, cb) {
            this._handlers = this._handlers || {};
            this._handlers[event] = cb;
            return this;
          }),
          destroy: vi.fn(),
        };
        rectObjects.push(obj);
        return obj;
      }),
      text: vi.fn().mockImplementation(() => {
        const obj = {
          text: '', visible: true,
          setOrigin: vi.fn().mockReturnThis(),
          setDepth: vi.fn().mockReturnThis(),
          setScrollFactor: vi.fn().mockReturnThis(),
          setVisible: vi.fn().mockImplementation(function(v) { this.visible = v; return this; }),
          setText: vi.fn().mockImplementation(function(t) { this.text = t; return this; }),
          setStyle: vi.fn().mockReturnThis(),
          destroy: vi.fn(),
        };
        textObjects.push(obj);
        return obj;
      }),
    },
  };
  const dialog = new DialogBox(scene, 640, 500, config);
  return { dialog, scene, rectObjects, textObjects };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('DialogBox', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts hidden', () => {
    const { dialog } = buildDialog();
    expect(dialog.isVisible()).toBe(false);
  });

  it('showMessage makes dialog visible', () => {
    const { dialog } = buildDialog();
    dialog.showMessage('NPC', 'Hello!');
    expect(dialog.isVisible()).toBe(true);
  });

  it('showMessage sets speaker text', () => {
    const { dialog } = buildDialog();
    dialog.showMessage('Guard', 'Halt!');
    expect(dialog._speakerText.setText).toHaveBeenCalledWith('Guard');
  });

  it('showMessage clears content text before typewriter', () => {
    const { dialog } = buildDialog();
    dialog.showMessage('NPC', 'Hello');
    // Content should have been cleared
    expect(dialog._contentText.setText).toHaveBeenCalledWith('');
  });

  it('typewriter effect types one character at a time', () => {
    const { dialog } = buildDialog({ typewriterSpeed: 30 });
    dialog.showMessage('NPC', 'Hi');

    // After first timer tick, first character should be typed
    vi.advanceTimersByTime(30);
    expect(dialog._contentText.setText).toHaveBeenCalledWith('H');

    // After second tick, second character
    vi.advanceTimersByTime(30);
    expect(dialog._contentText.setText).toHaveBeenCalledWith('Hi');
  });

  it('typewriter completes and calls onComplete', () => {
    const onComplete = vi.fn();
    const { dialog } = buildDialog({ typewriterSpeed: 10 });
    dialog.showMessage('NPC', 'AB', { onComplete });

    // Advance past both characters
    vi.advanceTimersByTime(10); // A
    vi.advanceTimersByTime(10); // B
    vi.advanceTimersByTime(10); // completion check

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('skipTypewriter shows full text immediately', () => {
    const { dialog } = buildDialog({ typewriterSpeed: 50 });
    dialog.showMessage('NPC', 'Hello World');
    dialog.skipTypewriter();

    expect(dialog._contentText.setText).toHaveBeenCalledWith('Hello World');
  });

  it('skipTypewriter calls onComplete', () => {
    const onComplete = vi.fn();
    const { dialog } = buildDialog({ typewriterSpeed: 50 });
    dialog.showMessage('NPC', 'Test', { onComplete });
    dialog.skipTypewriter();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('showMessage creates response buttons after typewriter completes', () => {
    const cb1 = vi.fn();
    const cb2 = vi.fn();
    const { dialog } = buildDialog({ typewriterSpeed: 10 });
    dialog.showMessage('NPC', 'Hi', {
      responses: [
        { text: 'Yes', callback: cb1 },
        { text: 'No', callback: cb2 },
      ],
    });

    // Complete the typewriter
    vi.advanceTimersByTime(10); // H
    vi.advanceTimersByTime(10); // i
    vi.advanceTimersByTime(10); // completion

    expect(dialog._responseButtons.length).toBe(2);
  });

  it('skipTypewriter also shows response buttons', () => {
    const cb = vi.fn();
    const { dialog } = buildDialog({ typewriterSpeed: 50 });
    dialog.showMessage('NPC', 'Choose', {
      responses: [{ text: 'OK', callback: cb }],
    });
    dialog.skipTypewriter();

    expect(dialog._responseButtons.length).toBe(1);
  });

  it('showMessage cancels previous typewriter', () => {
    const { dialog } = buildDialog({ typewriterSpeed: 50 });
    dialog.showMessage('NPC', 'First message');

    vi.advanceTimersByTime(50); // Type 1 char

    // Show new message while first is still typing
    dialog.showMessage('NPC', 'Second');
    expect(dialog._speakerText.setText).toHaveBeenCalledWith('NPC');
  });

  it('showMessage clears old response buttons', () => {
    const { dialog } = buildDialog({ typewriterSpeed: 10 });
    dialog.showMessage('NPC', 'A', {
      responses: [{ text: 'R1', callback: vi.fn() }],
    });

    // Complete typewriter
    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(10);
    expect(dialog._responseButtons.length).toBe(1);

    // Show a new message — old buttons should be cleared
    dialog.showMessage('NPC', 'B');
    expect(dialog._responseButtons.length).toBe(0);
  });

  it('setVisible toggles all elements', () => {
    const { dialog } = buildDialog();
    dialog.setVisible(true);
    expect(dialog.isVisible()).toBe(true);
    dialog.setVisible(false);
    expect(dialog.isVisible()).toBe(false);
  });

  it('destroy cancels typewriter and cleans up', () => {
    const { dialog } = buildDialog({ typewriterSpeed: 50 });
    dialog.showMessage('NPC', 'Long text here');

    dialog.destroy();
    expect(dialog._panel).toBeNull();
    expect(dialog._portrait).toBeNull();
    expect(dialog._speakerText).toBeNull();
    expect(dialog._contentText).toBeNull();

    // Advancing timers after destroy should not throw
    vi.advanceTimersByTime(500);
  });

  it('showMessage with empty speaker name', () => {
    const { dialog } = buildDialog();
    dialog.showMessage('', 'Anonymous message');
    expect(dialog._speakerText.setText).toHaveBeenCalledWith('');
  });

  it('showMessage with no responses or onComplete', () => {
    const { dialog } = buildDialog({ typewriterSpeed: 10 });
    dialog.showMessage('NPC', 'Hi');

    // Complete typewriter
    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(10);
    vi.advanceTimersByTime(10);

    // No buttons should be created
    expect(dialog._responseButtons.length).toBe(0);
  });

  it('skipTypewriter does nothing if no typewriter is active', () => {
    const { dialog } = buildDialog();
    // Should not throw
    expect(() => dialog.skipTypewriter()).not.toThrow();
  });
});
