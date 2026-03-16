/**
 * src/scenes/CharacterCreationScene.js
 * 3-step character creation wizard implemented as an HTML overlay.
 *
 * Flow: Step 1 (Name) → Step 2 (Nationality) → Step 3 (Job) → Confirm → GameScene
 *
 * Per ADR 0005, complex form-based UI uses HTML/DOM overlays that sit on top
 * of the Phaser canvas.  The Phaser input system is blocked while the wizard
 * is active.
 */

import { BaseScene } from './BaseScene.js';
import { initializeNewGame } from '../state/StateManager.js';
import { NATIONALITIES, JOBS, sanitizeName, validateName } from '../data/characterData.js';

const STEP_NAME        = 1;
const STEP_NATIONALITY = 2;
const STEP_JOB         = 3;
const STEP_CONFIRM     = 4;

export class CharacterCreationScene extends BaseScene {
  constructor() {
    super({ key: 'CharacterCreationScene' });

    /** Current wizard step (1-4). */
    this._step = STEP_NAME;

    /** Accumulated player choices. */
    this._selections = { name: '', nationality: null, job: null };

    /** DOM container for the wizard overlay. */
    this._container = null;
  }

  // ---------------------------------------------------------------------------
  // Phaser lifecycle
  // ---------------------------------------------------------------------------

  init(data) {
    super.init(data);
    // Reset selections each time the scene is entered.
    this._step = STEP_NAME;
    this._selections = { name: '', nationality: null, job: null };
  }

  create() {
    this.fadeInCamera();
    this._createContainer();
    this._renderCurrentStep();
  }

  shutdown() {
    this._destroyContainer();
    super.shutdown();
  }

  // ---------------------------------------------------------------------------
  // DOM container management
  // ---------------------------------------------------------------------------

  /** Create and attach the wizard overlay div to the document body. */
  _createContainer() {
    if (typeof document === 'undefined') return;

    this._container = document.createElement('div');
    this._container.id = 'character-creation-wizard';
    this._container.setAttribute('style', [
      'position:fixed',
      'inset:0',
      'display:flex',
      'align-items:center',
      'justify-content:center',
      'background:rgba(0,0,0,0.85)',
      'z-index:100',
      'font-family:Arial,sans-serif',
      'color:#e8d5b7',
    ].join(';'));

    document.body.appendChild(this._container);

    // Block Phaser's own input while the wizard is open.
    if (this.input) {
      this.input.enabled = false;
    }
  }

  /** Remove the overlay and re-enable Phaser input. */
  _destroyContainer() {
    if (this._container && this._container.parentNode) {
      this._container.parentNode.removeChild(this._container);
    }
    this._container = null;

    if (this.input) {
      this.input.enabled = true;
    }
  }

  // ---------------------------------------------------------------------------
  // Step rendering
  // ---------------------------------------------------------------------------

  /** Re-render the current step into the container. */
  _renderCurrentStep() {
    if (!this._container) return;
    this._container.innerHTML = this._buildStepHTML();
    this._attachStepHandlers();
  }

  /** Return the HTML string for the active step. */
  _buildStepHTML() {
    switch (this._step) {
      case STEP_NAME:        return this._buildStep1HTML();
      case STEP_NATIONALITY: return this._buildStep2HTML();
      case STEP_JOB:         return this._buildStep3HTML();
      case STEP_CONFIRM:     return this._buildConfirmHTML();
      default:               return '';
    }
  }

  _buildStep1HTML() {
    const escaped = this._selections.name.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return `
      <div style="background:#1a1814;border:2px solid #8b6914;border-radius:12px;padding:40px;width:480px;max-width:95vw;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="color:#d4a017;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Step 1 of 3</div>
          <h2 style="margin:0;font-size:26px;color:#e8d5b7;">Who Are You?</h2>
          <p style="color:#a89070;font-size:14px;margin:8px 0 0;">Enter the name you'll go by in Denmark.</p>
        </div>
        <div style="margin-bottom:24px;">
          <label for="char-name-input" style="display:block;font-size:14px;color:#d4a017;margin-bottom:8px;">Your Name</label>
          <input
            id="char-name-input"
            type="text"
            maxlength="30"
            value="${escaped}"
            placeholder="Enter your name (1–20 characters)"
            style="width:100%;box-sizing:border-box;padding:10px 14px;border:1px solid #5a4010;border-radius:6px;background:#2a2414;color:#e8d5b7;font-size:16px;outline:none;"
          />
          <div id="name-error" style="color:#e05050;font-size:12px;margin-top:6px;min-height:16px;"></div>
        </div>
        <div style="display:flex;justify-content:flex-end;gap:12px;">
          <button id="step1-next" style="${this._btnStyle('primary')}">Next →</button>
        </div>
      </div>`;
  }

  _buildStep2HTML() {
    const items = NATIONALITIES.map(n => {
      const selected = this._selections.nationality && this._selections.nationality.id === n.id;
      const border   = selected ? '2px solid #d4a017' : '1px solid #3a3020';
      const bg       = selected ? '#2e2510' : '#1e1c14';
      return `
        <button
          class="nat-card"
          data-id="${n.id}"
          style="background:${bg};border:${border};border-radius:8px;padding:12px;cursor:pointer;text-align:left;transition:border-color 0.2s;color:#e8d5b7;"
        >
          <div style="font-size:24px;margin-bottom:4px;">${n.flag}</div>
          <div style="font-weight:bold;font-size:13px;">${n.name}</div>
          <div style="color:#a89070;font-size:11px;margin-top:2px;">${n.culturalFamiliarity} familiarity</div>
          <div style="color:#d4a017;font-size:11px;margin-top:2px;">+${n.skillBonusValue} ${n.skillBonusSkill}</div>
        </button>`;
    }).join('');

    const hasSelection = !!this._selections.nationality;
    return `
      <div style="background:#1a1814;border:2px solid #8b6914;border-radius:12px;padding:40px;width:720px;max-width:95vw;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="color:#d4a017;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Step 2 of 3</div>
          <h2 style="margin:0;font-size:26px;color:#e8d5b7;">Where Are You From?</h2>
          <p style="color:#a89070;font-size:14px;margin:8px 0 0;">Your background shapes your starting skills.</p>
        </div>
        <div id="nat-error" style="color:#e05050;font-size:12px;margin-bottom:8px;min-height:16px;text-align:center;"></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px;">
          ${items}
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;">
          <button id="step2-back" style="${this._btnStyle('secondary')}">← Back</button>
          <button id="step2-next" style="${this._btnStyle('primary')}" ${hasSelection ? '' : 'disabled'}>Next →</button>
        </div>
      </div>`;
  }

  _buildStep3HTML() {
    const items = JOBS.map(j => {
      const selected = this._selections.job && this._selections.job.id === j.id;
      const border   = selected ? '2px solid #d4a017' : '1px solid #3a3020';
      const bg       = selected ? '#2e2510' : '#1e1c14';
      return `
        <button
          class="job-card"
          data-id="${j.id}"
          style="background:${bg};border:${border};border-radius:8px;padding:14px;cursor:pointer;text-align:left;color:#e8d5b7;"
        >
          <div style="font-weight:bold;font-size:14px;margin-bottom:4px;">${j.title}</div>
          <div style="color:#d4a017;font-size:12px;">${j.salary.toLocaleString()} DKK/mo</div>
          <div style="color:#a89070;font-size:11px;margin-top:2px;">${j.schedule}</div>
          <div style="color:#8ab4c0;font-size:11px;margin-top:2px;">${j.skillAffinity} affinity</div>
        </button>`;
    }).join('');

    const hasSelection = !!this._selections.job;
    return `
      <div style="background:#1a1814;border:2px solid #8b6914;border-radius:12px;padding:40px;width:720px;max-width:95vw;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="color:#d4a017;font-size:13px;letter-spacing:2px;text-transform:uppercase;margin-bottom:8px;">Step 3 of 3</div>
          <h2 style="margin:0;font-size:26px;color:#e8d5b7;">What Do You Do?</h2>
          <p style="color:#a89070;font-size:14px;margin:8px 0 0;">Your job determines your starting income and schedule.</p>
        </div>
        <div id="job-error" style="color:#e05050;font-size:12px;margin-bottom:8px;min-height:16px;text-align:center;"></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:24px;">
          ${items}
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;">
          <button id="step3-back" style="${this._btnStyle('secondary')}">← Back</button>
          <button id="step3-next" style="${this._btnStyle('primary')}" ${hasSelection ? '' : 'disabled'}>Review →</button>
        </div>
      </div>`;
  }

  _buildConfirmHTML() {
    const { name, nationality, job } = this._selections;
    return `
      <div style="background:#1a1814;border:2px solid #8b6914;border-radius:12px;padding:40px;width:520px;max-width:95vw;">
        <div style="text-align:center;margin-bottom:24px;">
          <h2 style="margin:0;font-size:26px;color:#e8d5b7;">Ready to Begin?</h2>
          <p style="color:#a89070;font-size:14px;margin:8px 0 0;">Review your choices before starting.</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;font-size:14px;">
          <tr style="border-bottom:1px solid #3a3020;">
            <td style="padding:10px 0;color:#a89070;width:40%;">Name</td>
            <td style="padding:10px 0;color:#e8d5b7;font-weight:bold;">${name}</td>
          </tr>
          <tr style="border-bottom:1px solid #3a3020;">
            <td style="padding:10px 0;color:#a89070;">Nationality</td>
            <td style="padding:10px 0;color:#e8d5b7;font-weight:bold;">${nationality.flag} ${nationality.name}</td>
          </tr>
          <tr style="border-bottom:1px solid #3a3020;">
            <td style="padding:10px 0;color:#a89070;">Job</td>
            <td style="padding:10px 0;color:#e8d5b7;font-weight:bold;">${job.title}</td>
          </tr>
          <tr style="border-bottom:1px solid #3a3020;">
            <td style="padding:10px 0;color:#a89070;">Starting DKK</td>
            <td style="padding:10px 0;color:#d4a017;font-weight:bold;">${job.salary.toLocaleString()} DKK</td>
          </tr>
          <tr style="border-bottom:1px solid #3a3020;">
            <td style="padding:10px 0;color:#a89070;">Skill Bonus</td>
            <td style="padding:10px 0;color:#8ab4c0;font-weight:bold;">+${nationality.skillBonusValue} ${nationality.skillBonusSkill}</td>
          </tr>
          <tr>
            <td style="padding:10px 0;color:#a89070;">Schedule</td>
            <td style="padding:10px 0;color:#e8d5b7;">${job.schedule}</td>
          </tr>
        </table>
        <div style="display:flex;justify-content:space-between;gap:12px;">
          <button id="confirm-back" style="${this._btnStyle('secondary')}">← Go Back</button>
          <button id="confirm-start" style="${this._btnStyle('start')}">Start Game ▶</button>
        </div>
      </div>`;
  }

  /** Return an inline-style string for a wizard button. */
  _btnStyle(variant) {
    const base = 'padding:10px 24px;border-radius:6px;font-size:14px;font-weight:bold;cursor:pointer;border:none;';
    switch (variant) {
      case 'primary':   return `${base}background:#8b6914;color:#e8d5b7;`;
      case 'secondary': return `${base}background:#2a2414;color:#a89070;border:1px solid #5a4010;`;
      case 'start':     return `${base}background:#3a7a3a;color:#e8d5b7;font-size:16px;`;
      default:          return base;
    }
  }

  // ---------------------------------------------------------------------------
  // Event handler attachment
  // ---------------------------------------------------------------------------

  /** Attach DOM event listeners for the current step. */
  _attachStepHandlers() {
    if (!this._container) return;
    switch (this._step) {
      case STEP_NAME:        this._attachStep1Handlers(); break;
      case STEP_NATIONALITY: this._attachStep2Handlers(); break;
      case STEP_JOB:         this._attachStep3Handlers(); break;
      case STEP_CONFIRM:     this._attachConfirmHandlers(); break;
    }
  }

  _attachStep1Handlers() {
    const nextBtn = this._container.querySelector('#step1-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this._handleStep1Next());
    }

    const input = this._container.querySelector('#char-name-input');
    if (input) {
      input.focus();
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this._handleStep1Next();
      });
    }
  }

  _attachStep2Handlers() {
    this._container.querySelectorAll('.nat-card').forEach(card => {
      card.addEventListener('click', () => {
        const id  = card.getAttribute('data-id');
        const nat = NATIONALITIES.find(n => n.id === id);
        if (nat) {
          this._applyNationality(nat);
          this._renderCurrentStep();
        }
      });
    });

    const backBtn = this._container.querySelector('#step2-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this._goToStep(STEP_NAME));
    }

    const nextBtn = this._container.querySelector('#step2-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this._handleStep2Next());
    }
  }

  _attachStep3Handlers() {
    this._container.querySelectorAll('.job-card').forEach(card => {
      card.addEventListener('click', () => {
        const id  = card.getAttribute('data-id');
        const job = JOBS.find(j => j.id === id);
        if (job) {
          this._applyJob(job);
          this._renderCurrentStep();
        }
      });
    });

    const backBtn = this._container.querySelector('#step3-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this._goToStep(STEP_NATIONALITY));
    }

    const nextBtn = this._container.querySelector('#step3-next');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this._handleStep3Next());
    }
  }

  _attachConfirmHandlers() {
    const backBtn = this._container.querySelector('#confirm-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this._goToStep(STEP_JOB));
    }

    const startBtn = this._container.querySelector('#confirm-start');
    if (startBtn) {
      startBtn.addEventListener('click', () => this._startGame());
    }
  }

  // ---------------------------------------------------------------------------
  // Step-transition handlers (testable without DOM)
  // ---------------------------------------------------------------------------

  /**
   * Change the current wizard step and re-render the container.
   * @param {number} step - Target step number (1-4).
   */
  _goToStep(step) {
    this._step = step;
    this._renderCurrentStep();
  }

  /**
   * Validate and advance from Step 1 (name input).
   * Reads the name from the DOM input, or from `nameOverride` in tests.
   *
   * @param {string|null} [nameOverride] - Value to use instead of DOM input (for tests).
   * @returns {boolean} True if validation passed and step advanced.
   */
  _handleStep1Next(nameOverride = null) {
    const input = this._container ? this._container.querySelector('#char-name-input') : null;
    const raw   = nameOverride !== null ? nameOverride : (input ? input.value : '');

    if (!validateName(raw)) {
      this._showError('name-error', 'Name must be 1–20 characters (no special characters).');
      return false;
    }

    this._applyName(raw);
    this._goToStep(STEP_NATIONALITY);
    return true;
  }

  /**
   * Validate and advance from Step 2 (nationality selection).
   * @returns {boolean}
   */
  _handleStep2Next() {
    if (!this._selections.nationality) {
      this._showError('nat-error', 'Please select a nationality before continuing.');
      return false;
    }
    this._goToStep(STEP_JOB);
    return true;
  }

  /**
   * Validate and advance from Step 3 (job selection).
   * @returns {boolean}
   */
  _handleStep3Next() {
    if (!this._selections.job) {
      this._showError('job-error', 'Please select a job before continuing.');
      return false;
    }
    this._goToStep(STEP_CONFIRM);
    return true;
  }

  // ---------------------------------------------------------------------------
  // Selection helpers
  // ---------------------------------------------------------------------------

  /** Store the sanitized player name. */
  _applyName(raw) {
    this._selections.name = sanitizeName(raw);
  }

  /** Store the chosen nationality object. */
  _applyNationality(nationality) {
    this._selections.nationality = nationality;
  }

  /** Store the chosen job object. */
  _applyJob(job) {
    this._selections.job = job;
  }

  // ---------------------------------------------------------------------------
  // Game start
  // ---------------------------------------------------------------------------

  /**
   * Finalize character creation: initialize game state and transition to GameScene.
   */
  _startGame() {
    const { name, nationality, job } = this._selections;

    initializeNewGame(this.registry, {
      name,
      nationality: nationality.name,
      job:          job.title,
      startingMoney: job.salary,
    });

    this._destroyContainer();
    this.transitionTo('GameScene');
  }

  // ---------------------------------------------------------------------------
  // UI helpers
  // ---------------------------------------------------------------------------

  /**
   * Display a validation error in the element with the given id.
   * @param {string} elementId
   * @param {string} message
   */
  _showError(elementId, message) {
    if (!this._container) return;
    const el = this._container.querySelector(`#${elementId}`);
    if (el) el.textContent = message;
  }
}

