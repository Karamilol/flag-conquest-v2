export interface DailyReward {
  icon: string;
  label: string;
  description: string;
}

export const DAILY_REWARDS: DailyReward[] = [
  { icon: '\u{1F3B0}', label: '15 Reroll Vouchers', description: '15x free unit rerolls' },
  { icon: '\u{1F48E}', label: '30 Gems', description: '30 gems added' },
  { icon: '\u{1F6E1}\uFE0F', label: 'Rare Regalia', description: '1x rare regalia chest' },
  { icon: '\u{1F5DD}\uFE0F', label: '3 Random Keys', description: '3x dungeon keys' },
  { icon: '\u{1F9EA}', label: '10 Healing Potions', description: '10x healing potions' },
  { icon: '\u{1F48E}', label: '50 Gems', description: '50 gems added' },
  { icon: '\u{1F451}', label: 'Legendary Regalia', description: '1x legendary regalia chest' },
];

export function getTodayString(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function canClaimDaily(lastClaimDate: string): boolean {
  return lastClaimDate !== getTodayString();
}
