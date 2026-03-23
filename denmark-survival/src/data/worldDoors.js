/**
 * src/data/worldDoors.js
 * Default door definitions used by GameScene.
 *
 * Each entry describes an enterable building door that can be interacted with
 * via the E-key system.  Task 028 (First Day Onboarding) can supply its own
 * door list to override positions or conditions for Day 1.
 *
 * Fields:
 *   id            {string}       Unique door identifier.
 *   x, y          {number}       World pixel coordinates of the door centre.
 *   spriteKey     {string|null}  Asset key; null → use Graphics placeholder.
 *   targetScene   {string}       Scene key launched on entry.
 *   targetData    {object}       Data passed to the scene's init().
 *   label         {string}       Display name used in the context hint.
 *   openCondition {object|null}  { type: 'shopHours', shopId } or null (always open).
 *   closedMessage {string}       Text shown when the door is closed.
 */

export const DEFAULT_DOORS = [
  {
    id: 'netto_door',
    x: 950,
    y: 300,
    spriteKey: null,
    targetScene: 'ShopScene',
    targetData: { shopId: 'netto' },
    label: 'Netto',
    openCondition: { type: 'shopHours', shopId: 'netto' },
    closedMessage: 'Netto is closed — opens at 7:00',
  },
  {
    id: 'fotex_door',
    x: 200,
    y: 550,
    spriteKey: null,
    targetScene: 'ShopScene',
    targetData: { shopId: 'fotex' },
    label: 'Føtex',
    openCondition: { type: 'shopHours', shopId: 'fotex' },
    closedMessage: 'Føtex is closed — opens at 7:00',
  },
  {
    id: 'matas_door',
    x: 1100,
    y: 200,
    spriteKey: null,
    targetScene: 'ShopScene',
    targetData: { shopId: 'matas' },
    label: 'Matas',
    openCondition: { type: 'shopHours', shopId: 'matas' },
    closedMessage: 'Matas is closed — opens at 9:00',
  },
  {
    id: 'cykelforretning_door',
    x: 800,
    y: 600,
    spriteKey: null,
    targetScene: 'ShopScene',
    targetData: { shopId: 'cykelforretning' },
    label: 'Cykelforretningen',
    openCondition: { type: 'shopHours', shopId: 'cykelforretning' },
    closedMessage: 'Cykelforretningen is closed — opens at 9:00',
  },
];
