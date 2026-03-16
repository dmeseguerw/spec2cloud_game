/**
 * src/scenes/DialogueScene.js
 * NPC conversation overlay scene.
 *
 * Layout:
 *  - Semi-transparent dark overlay (full screen)
 *  - NPC portrait (left side, middle height)
 *  - Speaker name label (above text box)
 *  - Text box (bottom 30% of screen)
 *  - Response buttons (stacked vertically below text box)
 *  - Typewriter text effect with NPC-specific blip sounds
 *  - Space / click to skip typewriter; auto-advance for autoAdvance nodes
 *
 * Data received via init():
 *   { npcId, conversationId, engine }
 *   where `engine` is a pre-configured DialogueEngine instance.
 */

import { BaseScene } from './BaseScene.js';
import { NPC_BLIP_MAP, SFX_BLIP_DEFAULT } from '../constants/AudioKeys.js';
import {
  DIALOGUE_NODE_CHANGED,
  DIALOGUE_ENDED,
} from '../constants/Events.js';

// ─── Layout constants ─────────────────────────────────────────────────────────
const TEXT_BOX_HEIGHT_RATIO = 0.30;  // 30 % of screen height
const PORTRAIT_WIDTH  = 160;
const PORTRAIT_HEIGHT = 200;
const RESPONSE_BUTTON_HEIGHT = 44;
const RESPONSE_BUTTON_GAP    = 8;
const TYPEWRITER_SPEED_MS    = 40;   // ms between characters
const AUTO_ADVANCE_DELAY_MS  = 1500; // ms before auto-advancing
const BLIP_INTERVAL          = 3;    // play blip every N characters
const TEXT_BOX_PADDING       = 20;

export class DialogueScene extends BaseScene {
  constructor() {
    super({ key: 'DialogueScene' });
  }

  // ─── Lifecycle ──────────────────────────────────────────────────────────────

  init(data) {
    super.init(data);
    this._engine         = data.engine   || null;
    this._npcId          = data.npcId    || null;
    this._conversationId = data.conversationId || null;
  }

  create() {
    const { width, height } = this.scale;

    // Semi-transparent background
    if (this._isOverlay) {
      this.createOverlayBackground(0.7);
    }

    // --- Portrait area (left side, vertically centred) ---
    this._portraitBg = this.add.rectangle(
      PORTRAIT_WIDTH / 2 + 20,
      height * 0.5,
      PORTRAIT_WIDTH + 8,
      PORTRAIT_HEIGHT + 8,
      0x222222,
      0.9,
    ).setDepth(10);

    this._portrait = this.add.rectangle(
      PORTRAIT_WIDTH / 2 + 20,
      height * 0.5,
      PORTRAIT_WIDTH,
      PORTRAIT_HEIGHT,
      0x4a4a6a,
      1,
    ).setDepth(11);

    // Portrait label placeholder (replaced by actual image in production)
    this._portraitLabel = this.add.text(
      PORTRAIT_WIDTH / 2 + 20,
      height * 0.5,
      '',
      { fontFamily: 'Arial', fontSize: '12px', color: '#cccccc', align: 'center' },
    ).setOrigin(0.5).setDepth(12);

    // --- Text box (bottom 30%) ---
    const textBoxY    = height - (height * TEXT_BOX_HEIGHT_RATIO) / 2;
    const textBoxH    = height * TEXT_BOX_HEIGHT_RATIO;
    const textBoxW    = width - PORTRAIT_WIDTH - 60;
    const textBoxX    = PORTRAIT_WIDTH + 40 + textBoxW / 2;

    this._textBox = this.add.rectangle(
      textBoxX, textBoxY,
      textBoxW, textBoxH,
      0x111122, 0.9,
    ).setDepth(10);

    // Speaker name label
    this._speakerLabel = this.add.text(
      textBoxX - textBoxW / 2 + TEXT_BOX_PADDING,
      height - textBoxH - 2,
      '',
      {
        fontFamily: 'Arial',
        fontSize:   '16px',
        color:      '#f0d080',
        fontStyle:  'bold',
      },
    ).setOrigin(0, 1).setDepth(12);

    // Dialogue text (typewriter)
    this._dialogueText = this.add.text(
      textBoxX - textBoxW / 2 + TEXT_BOX_PADDING,
      height - textBoxH + TEXT_BOX_PADDING,
      '',
      {
        fontFamily: 'Arial',
        fontSize:   '15px',
        color:      '#e8d5b7',
        wordWrap:   { width: textBoxW - TEXT_BOX_PADDING * 2 },
      },
    ).setOrigin(0, 0).setDepth(12);

    // "▶" skip / continue indicator
    this._continueIcon = this.add.text(
      textBoxX + textBoxW / 2 - TEXT_BOX_PADDING,
      textBoxY + textBoxH / 2 - TEXT_BOX_PADDING,
      '▶',
      { fontFamily: 'Arial', fontSize: '14px', color: '#f0d080' },
    ).setOrigin(1, 1).setDepth(12).setVisible(false);

    // --- Response button container ---
    this._responseButtons = [];
    this._responseContainer = this.add.container(0, 0).setDepth(15);

    // --- Typewriter state ---
    this._fullText        = '';
    this._typewriterIndex = 0;
    this._typewriterTimer = null;
    this._typewriterDone  = false;
    this._charCounter     = 0;

    // --- Keyboard: Space to skip ---
    const spaceKey = this.input.keyboard.addKey('SPACE');
    spaceKey.on('down', () => this._onSkipOrAdvance());

    // --- Listen for engine events ---
    if (this._engine) {
      this.trackEvent(
        this.registry.events,
        DIALOGUE_NODE_CHANGED,
        (payload) => this._onNodeChanged(payload),
      );
      this.trackEvent(
        this.registry.events,
        DIALOGUE_ENDED,
        () => this._onDialogueEnded(),
      );

      // Start the conversation if engine and ids are provided
      if (this._npcId && this._conversationId) {
        this._engine.startDialogue(this.registry, this._npcId, this._conversationId);
      } else {
        // Engine may already be mid-conversation (started externally)
        const node = this._engine.getCurrentNode();
        if (node) this._showNode(node);
      }
    }
  }

  update() {
    // Blink the continue icon when typewriter is done
    if (this._typewriterDone && this._continueIcon) {
      const t = Math.floor(this.time.now / 500) % 2;
      this._continueIcon.setVisible(t === 0);
    }
  }

  shutdown() {
    this._clearTypewriterTimer();
    this._clearResponseButtons();
    super.shutdown();
  }

  // ─── Node display ───────────────────────────────────────────────────────────

  /**
   * Display a dialogue node: update portrait, speaker name, start typewriter.
   * @param {object} node
   */
  _showNode(node) {
    if (!node) return;

    // Portrait
    this._portraitLabel.setText(node.speaker || '');

    // Speaker name
    this._speakerLabel.setText(node.speaker || '');

    // Clear responses
    this._clearResponseButtons();
    this._continueIcon.setVisible(false);

    // Start typewriter
    this._startTypewriter(node.text || '', node);
  }

  // ─── Typewriter effect ──────────────────────────────────────────────────────

  /**
   * Begin the typewriter effect for the given text.
   * @param {string} text
   * @param {object} node - The full node (needed after completion).
   */
  _startTypewriter(text, node) {
    this._clearTypewriterTimer();
    this._fullText        = text;
    this._typewriterIndex = 0;
    this._typewriterDone  = false;
    this._currentNode     = node;
    this._charCounter     = 0;
    this._dialogueText.setText('');

    this._typewriterTimer = this.time.addEvent({
      delay:    TYPEWRITER_SPEED_MS,
      callback: this._typewriterTick,
      callbackScope: this,
      loop:     true,
    });
  }

  /** Called each tick to reveal the next character. */
  _typewriterTick() {
    if (this._typewriterIndex >= this._fullText.length) {
      this._finishTypewriter();
      return;
    }

    this._typewriterIndex++;
    this._dialogueText.setText(this._fullText.slice(0, this._typewriterIndex));
    this._charCounter++;

    // Play blip every N characters
    if (this._charCounter % BLIP_INTERVAL === 0) {
      this._playBlip();
    }
  }

  /** Immediately show the full text and stop the timer. */
  _finishTypewriter() {
    this._clearTypewriterTimer();
    this._dialogueText.setText(this._fullText);
    this._typewriterDone = true;

    const node = this._currentNode;
    if (node && node.autoAdvance) {
      // Auto-advance after a short pause
      this.time.delayedCall(AUTO_ADVANCE_DELAY_MS, () => {
        this._advanceFromNode(node);
      });
    } else {
      // Show response buttons (or continue icon for endConversation nodes)
      this._showResponses(node);
    }
  }

  /** Stop and remove the typewriter timer. */
  _clearTypewriterTimer() {
    if (this._typewriterTimer) {
      this._typewriterTimer.remove(false);
      this._typewriterTimer = null;
    }
  }

  // ─── Responses ──────────────────────────────────────────────────────────────

  /**
   * Render response buttons for a node, or a "Close" button for terminal nodes.
   * @param {object} node
   */
  _showResponses(node) {
    this._clearResponseButtons();
    if (!node) return;
    this._continueIcon.setVisible(false);

    const { width, height } = this.scale;
    const textBoxH = height * TEXT_BOX_HEIGHT_RATIO;
    const startY   = height - textBoxH - RESPONSE_BUTTON_HEIGHT - RESPONSE_BUTTON_GAP;
    const btnW     = width - PORTRAIT_WIDTH - 80;
    const btnX     = PORTRAIT_WIDTH + 40;

    if (node.endConversation || !node.responses || node.responses.length === 0) {
      // Single "close" / "continue" button
      this._createButton(
        btnX, startY, btnW, RESPONSE_BUTTON_HEIGHT,
        'Continue',
        false, null, 0,
        () => this._onCloseDialogue(),
      );
      return;
    }

    const responses = this._engine
      ? this._engine.getAvailableResponses(this.registry)
      : node.responses.map((r, i) => ({ ...r, index: i, locked: false, lockReason: null }));

    responses.forEach((resp, i) => {
      const y = startY - i * (RESPONSE_BUTTON_HEIGHT + RESPONSE_BUTTON_GAP);
      const displayText = resp.locked
        ? `🔒 ${resp.text}  [${resp.lockReason || 'Locked'}]`
        : resp.text;

      this._createButton(
        btnX, y, btnW, RESPONSE_BUTTON_HEIGHT,
        displayText,
        resp.locked, resp.lockReason, resp.index,
        resp.locked ? null : () => this._onResponseSelected(resp.index),
      );
    });
  }

  /**
   * Create a single response button.
   * @param {number} x @param {number} y @param {number} w @param {number} h
   * @param {string} label @param {boolean} locked @param {string|null} tooltip
   * @param {number} index @param {Function|null} onClick
   */
  _createButton(x, y, w, h, label, locked, tooltip, index, onClick) {
    const bgColor = locked ? 0x3a3a3a : 0x2a4a6a;
    const textColor = locked ? '#888888' : '#e8d5b7';

    const bg = this.add.rectangle(x + w / 2, y, w, h, bgColor, 0.9)
      .setDepth(16)
      .setOrigin(0.5, 0.5);

    const txt = this.add.text(
      x + 10, y,
      label,
      {
        fontFamily: 'Arial',
        fontSize:   '13px',
        color:      textColor,
        wordWrap:   { width: w - 20 },
      },
    ).setOrigin(0, 0.5).setDepth(17);

    if (!locked && onClick) {
      bg.setInteractive({ cursor: 'pointer' })
        .on('pointerover', () => bg.setFillStyle(0x3a6a9a, 0.95))
        .on('pointerout',  () => bg.setFillStyle(bgColor, 0.9))
        .on('pointerdown', onClick);
      txt.setInteractive({ cursor: 'pointer' })
        .on('pointerdown', onClick);
    }

    this._responseButtons.push(bg, txt);
    this._responseContainer.add([bg, txt]);
  }

  /** Destroy all current response button objects. */
  _clearResponseButtons() {
    for (const obj of this._responseButtons) {
      obj.destroy();
    }
    this._responseButtons = [];
  }

  // ─── Audio ──────────────────────────────────────────────────────────────────

  /** Play the NPC blip sound for the current conversation partner. */
  _playBlip() {
    if (!this.sound) return;
    const key = (this._npcId && NPC_BLIP_MAP[this._npcId])
      ? NPC_BLIP_MAP[this._npcId]
      : SFX_BLIP_DEFAULT;
    const sound = this.sound.add(key);
    if (sound) sound.play({ volume: 0.3 });
  }

  // ─── Event handlers ─────────────────────────────────────────────────────────

  /** Called when the DialogueEngine emits DIALOGUE_NODE_CHANGED. */
  _onNodeChanged(payload) {
    const node = payload && payload.node;
    if (node) this._showNode(node);
  }

  /** Called when the DialogueEngine emits DIALOGUE_ENDED. */
  _onDialogueEnded() {
    this.closeOverlay();
  }

  /**
   * Handle Space / click: skip typewriter OR advance terminal node.
   */
  _onSkipOrAdvance() {
    if (!this._typewriterDone) {
      // Skip to full text
      this._finishTypewriter();
    }
  }

  /** Advance past an auto-advance or end-conversation node. */
  _advanceFromNode(node) {
    if (!this._engine) return;
    if (node.endConversation) {
      this._engine.endDialogue(this.registry);
    }
  }

  /** Called when the player selects a response. */
  _onResponseSelected(index) {
    if (!this._engine) return;
    this._clearResponseButtons();
    this._engine.selectResponse(this.registry, index);
  }

  /** Called when the Close / Continue button is pressed on a terminal node. */
  _onCloseDialogue() {
    if (this._engine) {
      this._engine.endDialogue(this.registry);
    } else {
      this.closeOverlay();
    }
  }
}

