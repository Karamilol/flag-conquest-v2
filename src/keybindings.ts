export type ActionId =
  | 'moveLeft'
  | 'moveRight'
  | 'skill1'
  | 'skill2'
  | 'skill3'
  | 'skill4'
  | 'healPotion'
  | 'armyToggle'
  | 'plantToggle';

export type KeyBindings = Record<ActionId, string[]>;

export const DEFAULT_KEYBINDINGS: KeyBindings = {
  moveLeft:   ['ArrowLeft', 'a'],
  moveRight:  ['ArrowRight', 'd'],
  skill1:     ['1'],
  skill2:     ['2'],
  skill3:     ['3'],
  skill4:     ['4'],
  healPotion: ['q'],
  armyToggle: ['Space'],
  plantToggle: ['s'],
};

export const ACTION_LABELS: Record<ActionId, string> = {
  moveLeft: 'Move Left',
  moveRight: 'Move Right',
  skill1: 'Skill 1',
  skill2: 'Skill 2',
  skill3: 'Skill 3',
  skill4: 'Skill 4',
  healPotion: 'Heal Potion',
  armyToggle: 'Hold/Attack',
  plantToggle: 'Plant Hero',
};

export const ACTION_ORDER: ActionId[] = [
  'moveLeft', 'moveRight', 'skill1', 'skill2', 'skill3', 'skill4', 'healPotion', 'armyToggle', 'plantToggle',
];

const KEY_NAMES: Record<string, string> = {
  ArrowLeft: '\u2190',
  ArrowRight: '\u2192',
  ArrowUp: '\u2191',
  ArrowDown: '\u2193',
  ' ': 'Space',
  Space: 'Space',
  Enter: 'Enter',
  Shift: 'Shift',
  Control: 'Ctrl',
  Alt: 'Alt',
  Tab: 'Tab',
  Escape: 'Esc',
  Backspace: 'Bksp',
  Delete: 'Del',
};

export function displayKey(key: string): string {
  return KEY_NAMES[key] ?? key.toUpperCase();
}

/** Case-insensitive match, normalizes space key */
export function matchesBinding(bindings: KeyBindings, action: ActionId, pressedKey: string): boolean {
  const normalized = pressedKey === ' ' ? 'Space' : pressedKey;
  return bindings[action].some(k => k.toLowerCase() === normalized.toLowerCase());
}
