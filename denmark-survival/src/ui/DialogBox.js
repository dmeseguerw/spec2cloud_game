/**
 * src/ui/DialogBox.js
 * Typewriter dialog box with speaker name, portrait area, and response buttons.
 * Shows messages with a character-by-character typewriter effect.
 */

import { Panel } from './Panel.js';
import { GameButton } from './GameButton.js';

export class DialogBox {
  /**
   * @param {Phaser.Scene} scene - The scene this dialog belongs to.
   * @param {number} x - X position (center).
   * @param {number} y - Y position (center).
   * @param {object} config - Configuration options.
   * @param {number} [config.width=600] - Dialog width.
   * @param {number} [config.height=200] - Dialog height.
   * @param {number} [config.depth=20] - Render depth.
   * @param {number} [config.typewriterSpeed=30] - Milliseconds per character.
   */
  constructor(scene, x, y, config = {}) {
    this._scene = scene;
    this._x = x;
    this._y = y;

    const width = config.width ?? 600;
    const height = config.height ?? 200;
    const depth = config.depth ?? 20;
    this._typewriterSpeed = config.typewriterSpeed ?? 30;

    this._visible = false;
    this._typewriterTimer = null;
    this._typewriterText = '';
    this._typewriterIndex = 0;
    this._typewriterCallback = null;
    this._pendingResponses = [];
    this._responseButtons = [];

    // Background panel
    this._panel = new Panel(scene, x, y, { width, height, depth });

    // Portrait area (80x80 at left side)
    const portraitX = x - width / 2 + 50;
    const portraitY = y;
    this._portrait = scene.add.rectangle(portraitX, portraitY, 80, 80, 0x555555);
    this._portrait.setOrigin(0.5, 0.5);
    this._portrait.setDepth(depth + 1);

    // Speaker name text
    const nameX = x - width / 2 + 100;
    const nameY = y - height / 2 + 20;
    this._speakerText = scene.add.text(nameX, nameY, '', {
      fontSize: '16px',
      color: '#ffd700',
      fontStyle: 'bold',
    });
    this._speakerText.setOrigin(0, 0.5);
    this._speakerText.setDepth(depth + 2);

    // Content text with word wrap
    const contentX = x - width / 2 + 100;
    const contentY = y - height / 2 + 50;
    this._contentText = scene.add.text(contentX, contentY, '', {
      fontSize: '14px',
      color: '#ffffff',
      wordWrap: { width: width - 120 },
    });
    this._contentText.setOrigin(0, 0);
    this._contentText.setDepth(depth + 2);

    // Start hidden
    this.setVisible(false);
  }

  /**
   * Show a message with typewriter effect.
   * @param {string} speaker - Speaker name.
   * @param {string} text - Message content.
   * @param {object} options - Display options.
   * @param {Array<{text: string, callback: Function}>} [options.responses] - Response buttons.
   * @param {Function} [options.onComplete] - Called when typewriter finishes.
   */
  showMessage(speaker, text, options = {}) {
    // Cancel any active typewriter
    this._cancelTypewriter();

    // Clear response buttons
    this._clearResponses();

    // Set speaker text
    this._speakerText.setText(speaker || '');

    // Clear content text
    this._contentText.setText('');

    // Store pending responses and callback
    this._pendingResponses = options.responses || [];
    this._onComplete = options.onComplete || null;

    // Show the dialog
    this.setVisible(true);

    // Start typewriter effect
    this._startTypewriter(text, () => {
      // Show response buttons after typewriter completes
      this._showResponses();
      if (this._onComplete) {
        this._onComplete();
      }
    });
  }

  /**
   * Skip the typewriter effect, immediately showing full text and responses.
   */
  skipTypewriter() {
    if (this._typewriterTimer !== null) {
      this._cancelTypewriter();
      this._contentText.setText(this._typewriterText);
      this._showResponses();
      if (this._onComplete) {
        this._onComplete();
        this._onComplete = null;
      }
    }
  }

  /**
   * Check if the dialog box is visible.
   * @returns {boolean}
   */
  isVisible() {
    return this._visible;
  }

  /**
   * Toggle visibility of all dialog elements.
   * @param {boolean} visible
   */
  setVisible(visible) {
    this._visible = visible;
    this._panel.setVisible(visible);
    this._portrait.setVisible(visible);
    this._speakerText.setVisible(visible);
    this._contentText.setVisible(visible);
    for (const btn of this._responseButtons) {
      btn.setVisible(visible);
    }
  }

  /**
   * Destroy all game objects and cancel typewriter.
   */
  destroy() {
    this._cancelTypewriter();
    this._clearResponses();
    if (this._panel) this._panel.destroy();
    if (this._portrait) this._portrait.destroy();
    if (this._speakerText) this._speakerText.destroy();
    if (this._contentText) this._contentText.destroy();
    this._panel = null;
    this._portrait = null;
    this._speakerText = null;
    this._contentText = null;
  }

  // ---------------------------------------------------------------------------
  // Private methods
  // ---------------------------------------------------------------------------

  /**
   * Start the typewriter effect for a text string.
   * @param {string} text - Full text to type out.
   * @param {Function} onComplete - Called when typing finishes.
   */
  _startTypewriter(text, onComplete) {
    this._typewriterText = text;
    this._typewriterIndex = 0;
    this._typewriterCallback = onComplete;

    this._typeNext();
  }

  /**
   * Type the next character in the typewriter sequence.
   */
  _typeNext() {
    if (this._typewriterIndex >= this._typewriterText.length) {
      this._typewriterTimer = null;
      if (this._typewriterCallback) {
        this._typewriterCallback();
      }
      return;
    }

    this._typewriterIndex++;
    this._contentText.setText(this._typewriterText.substring(0, this._typewriterIndex));

    this._typewriterTimer = setTimeout(() => {
      this._typeNext();
    }, this._typewriterSpeed);
  }

  /**
   * Cancel the pending typewriter timer.
   */
  _cancelTypewriter() {
    if (this._typewriterTimer !== null) {
      clearTimeout(this._typewriterTimer);
      this._typewriterTimer = null;
    }
  }

  /**
   * Show response buttons from the pending responses list.
   */
  _showResponses() {
    if (!this._pendingResponses || this._pendingResponses.length === 0) return;

    const startX = this._x;
    const startY = this._y + 60;
    const spacing = 50;

    for (let i = 0; i < this._pendingResponses.length; i++) {
      const response = this._pendingResponses[i];
      const btn = new GameButton(
        this._scene,
        startX,
        startY + i * spacing,
        response.text,
        response.callback,
        { width: 200, depth: 22 }
      );
      this._responseButtons.push(btn);
    }
  }

  /**
   * Clear and destroy all response buttons.
   */
  _clearResponses() {
    for (const btn of this._responseButtons) {
      btn.destroy();
    }
    this._responseButtons = [];
    this._pendingResponses = [];
  }
}
