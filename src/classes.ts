// Hero Classes — defines base stats, attack type, and skill pools per class

export type HeroClassId = 'warlord' | 'ranger' | 'mage';
export type AttackType = 'melee' | 'ranged';

export interface ClassDef {
  id: HeroClassId;
  name: string;
  icon: string;
  description: string;
  colors: { primary: string; secondary: string; accent: string };
  baseStats: { hp: number; dmg: number; def: number; speed: number; critChance: number };
  attackType: AttackType;
  attackRange: number;       // melee=50, ranged=180
  attackCooldown: number;    // base ticks between auto-attacks
  skillPoolIds: string[];    // skill IDs this class can draw from
}

export const CLASS_DEFS: ClassDef[] = [
  {
    id: 'warlord', name: 'Warlord', icon: '\u2694\uFE0F',
    description: 'Heavy armor, sword & shield. Charges into melee.',
    colors: { primary: '#4a9fff', secondary: '#7abfff', accent: '#2a6fcc' },
    baseStats: { hp: 80, dmg: 9, def: 1, speed: 0.6, critChance: 0.01 },
    attackType: 'melee', attackRange: 50, attackCooldown: 54,
    skillPoolIds: ['weaponThrow', 'march', 'battleCry', 'harvest', 'lastStand', 'secondWind', 'intimidate', 'regroup', 'bloodlust', 'shieldWall', 'heroicPresence', 'pinDown'],
  },
  {
    id: 'ranger', name: 'Ranger', icon: '\u{1F3F9}',
    description: 'Hooded archer. Strikes from afar with deadly precision.',
    colors: { primary: '#4a8f3f', secondary: '#7cbf5f', accent: '#2a5f1f' },
    baseStats: { hp: 36, dmg: 13, def: 1, speed: 0.6, critChance: 0.05 },
    attackType: 'ranged', attackRange: 220, attackCooldown: 105,
    skillPoolIds: ['powerShot', 'volley', 'birdsEye', 'snareTrap', 'eagleEye', 'smokeScreen', 'fallBack', 'poisonTips', 'keenEye', 'pathfinder', 'scavenger', 'naturesGrace'],
  },
  {
    id: 'mage', name: 'Mage', icon: '\u{1F9D9}',
    description: 'Arcane spellcaster. Chain lightning devastates groups.',
    colors: { primary: '#8855cc', secondary: '#aa77ee', accent: '#6633aa' },
    baseStats: { hp: 30, dmg: 16, def: 2, speed: 0.5, critChance: 0.02 },
    attackType: 'ranged', attackRange: 200, attackCooldown: 90,
    skillPoolIds: ['thunderstrike', 'manaShield', 'channelIgnite', 'channelBlizzard',
      'arcaneIntellect', 'summonMeteor', 'barrier', 'blink', 'productionMagic',
      'arcaneFamiliar', 'chargedZap', 'highAmps'],
  },
];

export function getClassDef(id: HeroClassId): ClassDef {
  return CLASS_DEFS.find(c => c.id === id)!;
}
