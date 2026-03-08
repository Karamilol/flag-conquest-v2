// ============================================================
// Pet System — companions that follow the hero with passive effects
// ============================================================

export type PetSource = 'boss' | 'store' | 'achievement';
export type PetEffectType =
  | 'goldDrop' | 'gemDrop' | 'heal' | 'attack'           // active (cooldown-based)
  | 'maxHpPercent' | 'regen' | 'moveSpeed' | 'defense'    // passive
  | 'slowAura' | 'goldBonus' | 'slowOnHit' | 'attackSpeed'; // passive

export interface PetDef {
  id: string;
  name: string;
  icon: string;
  description: string;
  rarity: 'common' | 'rare' | 'legendary';
  source: PetSource;
  gemCost: number;           // 0 for non-store pets
  locked?: boolean;          // true = shown but not purchasable yet
  bossType?: number;         // for boss pets: which boss (0-6)
  effectDescription: string;
  effectType: PetEffectType;
  effectValue: number;
  effectCooldown: number;    // ticks between activations (0 = passive)
}

export interface PetState {
  ownedPets: string[];      // pet IDs owned
  equippedPet: string;      // pet ID or ''
}

export const DEFAULT_PET_STATE: PetState = {
  ownedPets: [],
  equippedPet: '',
};

// ---- Boss Pets (7) — earned from boss kills at 20% chance ----
// Weak thematic effects, free rewards for progression

const BOSS_PETS: PetDef[] = [
  { id: 'woodland_sprite', name: 'Woodland Sprite', icon: '\u{1F33F}', description: 'A tiny nature fairy from the forest',
    rarity: 'common', source: 'boss', gemCost: 0, bossType: 0,
    effectDescription: '+1% HP regen per 5 seconds', effectType: 'regen', effectValue: 1, effectCooldown: 0 },
  { id: 'wolf_pup', name: 'Wolf Pup', icon: '\u{1F43A}', description: 'A loyal hunting companion',
    rarity: 'common', source: 'boss', gemCost: 0, bossType: 1,
    effectDescription: '+0.03 hero movement speed', effectType: 'moveSpeed', effectValue: 0.03, effectCooldown: 0 },
  { id: 'phantom_wisp', name: 'Phantom Wisp', icon: '\u{1F47B}', description: 'A ghostly floating orb',
    rarity: 'rare', source: 'boss', gemCost: 0, bossType: 2,
    effectDescription: '+1 Defense', effectType: 'defense', effectValue: 1, effectCooldown: 0 },
  { id: 'spiderling', name: 'Spiderling', icon: '\u{1F577}\u{FE0F}', description: 'A tiny spider companion',
    rarity: 'rare', source: 'boss', gemCost: 0, bossType: 3,
    effectDescription: 'Enemies near hero attack 3% slower', effectType: 'slowAura', effectValue: 3, effectCooldown: 0 },
  { id: 'bone_kitty', name: 'Bone Kitty', icon: '\u{1F408}\u{200D}\u{2B1B}', description: 'A skeletal cat with glowing eyes',
    rarity: 'rare', source: 'boss', gemCost: 0, bossType: 4,
    effectDescription: '+3% gold from kills', effectType: 'goldBonus', effectValue: 3, effectCooldown: 0 },
  { id: 'frost_fairy', name: 'Frost Fairy', icon: '\u{2744}\u{FE0F}', description: 'An ice crystal fairy',
    rarity: 'rare', source: 'boss', gemCost: 0, bossType: 5,
    effectDescription: '3% chance to slow hit enemies', effectType: 'slowOnHit', effectValue: 3, effectCooldown: 0 },
  { id: 'shadow_clone', name: 'Shadow Clone', icon: '\u{1F977}', description: 'A dark translucent mini-ninja',
    rarity: 'legendary', source: 'boss', gemCost: 0, bossType: 6,
    effectDescription: '+3% hero attack speed', effectType: 'attackSpeed', effectValue: 3, effectCooldown: 0 },
];

// ---- Store Pets (4) — purchased with gems, stronger active effects ----

const STORE_PETS: PetDef[] = [
  { id: 'mimic', name: 'Mimic', icon: '\u{1F4E6}', description: 'A friendly treasure chest',
    rarity: 'legendary', source: 'store', gemCost: 0, locked: true,
    effectDescription: '(Only Available on...)', effectType: 'gemDrop', effectValue: 1, effectCooldown: 3600 },
  { id: 'unicorn', name: 'Unicorn', icon: '\u{1F984}', description: 'A magical little unicorn',
    rarity: 'rare', source: 'store', gemCost: 80,
    effectDescription: 'Drops 1% of per-minute income', effectType: 'goldDrop', effectValue: 1, effectCooldown: 600 },
  { id: 'vampire_bat', name: 'Vampire Bat', icon: '\u{1F987}', description: 'A loyal blood-sucking companion',
    rarity: 'rare', source: 'store', gemCost: 80,
    effectDescription: 'Saps enemies, heals hero 0.5% max HP', effectType: 'heal', effectValue: 0.5, effectCooldown: 300 },
  { id: 'goose', name: 'Canadian Goose', icon: '\u{1FABF}', description: 'Has a knife. Honk.',
    rarity: 'common', source: 'store', gemCost: 50,
    effectDescription: 'Attacks nearby enemies for 2% hero damage', effectType: 'attack', effectValue: 2, effectCooldown: 180 },
];

// ---- Achievement Pets — earned from milestones ----

const ACHIEVEMENT_PETS: PetDef[] = [
  { id: 'slime', name: 'Slime', icon: '\u{1F7E2}', description: 'A tiny jelly companion',
    rarity: 'common', source: 'achievement', gemCost: 0,
    effectDescription: '+3% max HP', effectType: 'maxHpPercent', effectValue: 3, effectCooldown: 0 },
];

// Combined list
export const PETS: PetDef[] = [...BOSS_PETS, ...STORE_PETS, ...ACHIEVEMENT_PETS];

/** Lookup pet definition by ID */
export function getPetDef(id: string): PetDef | undefined {
  return PETS.find(p => p.id === id);
}

/** Get boss pet ID for a given boss type */
export function getBossPetId(bossType: number): string | undefined {
  return BOSS_PETS.find(p => p.bossType === bossType)?.id;
}

/** Check if a pet effect is passive (no cooldown tick needed) */
export function isPetPassive(effectType: PetEffectType): boolean {
  return effectType !== 'goldDrop' && effectType !== 'gemDrop' && effectType !== 'heal' && effectType !== 'attack';
}
