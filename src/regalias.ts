// ============================================================
// Regalia System — persistent items with randomized modifiers
// ============================================================

// ---- Types ----

export type RegaliaSlot = 'sword' | 'shield' | 'necklace';
export type RegaliaRarity = 'common' | 'rare' | 'legendary';
export type RegaliaTarget = 'soldier' | 'archer' | 'halberd' | 'knight' | 'cleric' | 'wizard' | 'conjurer' | 'bombard' | 'hero';
export type RegaliaCategory = 'melee' | 'ranged' | 'magic';

export interface RegaliaModifier {
  statId: string;
  target: RegaliaTarget | null;      // unit/hero target, null for army-wide/economy
  category: RegaliaCategory | null;  // melee/ranged/magic, null if not category-scoped
  value: number;                     // rolled base value
  stars: number;                     // stars applied to this modifier
  enhances: number;                  // 0-2: base → rare → legendary tier
}

export interface Regalia {
  id: string;
  name: string;
  slot: RegaliaSlot;
  rarity: RegaliaRarity;
  zone: number;
  modifiers: RegaliaModifier[];
  level: number; // 0-5
}

export interface RegaliaState {
  equipped: Record<RegaliaSlot, Regalia | null>;
  stash: Regalia[];
  essence: number;
  stardust: number;
  tutorialDropGiven: boolean;
}

export function defaultRegaliaState(): RegaliaState {
  return {
    equipped: { sword: null, shield: null, necklace: null },
    stash: [],
    essence: 0,
    stardust: 0,
    tutorialDropGiven: false,
  };
}

// ---- Constants ----

export const MAX_STASH = 20;

const RARITY_CONFIG: Record<RegaliaRarity, { modMin: number; modMax: number; maxStars: number; valueMult: number; dropWeight: number }> = {
  common:    { modMin: 1, modMax: 2, maxStars: 1, valueMult: 1.0,   dropWeight: 70 },
  rare:      { modMin: 3, modMax: 4, maxStars: 3, valueMult: 1.125, dropWeight: 25 },
  legendary: { modMin: 5, modMax: 6, maxStars: 5, valueMult: 1.25,  dropWeight: 5  },
};

export const LEVEL_MULTS = [1.0, 1.1, 1.2, 1.35, 1.5, 1.75];

const LEVEL_COSTS = [5, 10, 20, 40, 80];
export const ENHANCE_COSTS: { essence: number; stardust: number }[] = [
  { essence: 15, stardust: 0 },   // tier 0→1 (common → rare)
  { essence: 30, stardust: 3 },   // tier 1→2 (rare → legendary)
];
export const MAX_ENHANCES = 2;
export const STAR_COST = 3; // stardust

const SALVAGE_REWARDS: Record<RegaliaRarity, { essence: number; stardust: number }> = {
  common:    { essence: 1, stardust: 0 },
  rare:      { essence: 5, stardust: 2 },
  legendary: { essence: 20, stardust: 8 },
};

const DR_FACTOR = 0.06;

// Unit types for targeting
const UNIT_TYPES: RegaliaTarget[] = ['soldier', 'archer', 'halberd', 'knight', 'cleric', 'wizard', 'conjurer', 'bombard'];
const CATEGORIES: RegaliaCategory[] = ['melee', 'ranged', 'magic'];

// Display names for internal types
const TARGET_DISPLAY: Record<string, string> = {
  soldier: 'Soldier', archer: 'Archer', halberd: 'Halberd', knight: 'Knight',
  cleric: 'Cleric', wizard: 'Apprentice', conjurer: 'Conjurer', bombard: 'Bombard', hero: 'Hero',
  melee: 'Melee', ranged: 'Ranged', magic: 'Magic',
};

// Category mappings
const UNIT_CATEGORIES: Record<string, RegaliaCategory> = {
  soldier: 'melee', halberd: 'melee', knight: 'melee',
  archer: 'ranged', bombard: 'ranged',
  cleric: 'magic', wizard: 'magic', conjurer: 'magic',
};

// Which units are in each category (for effect application)
export function isUnitInCategory(unitType: string, cat: RegaliaCategory): boolean {
  return UNIT_CATEGORIES[unitType] === cat;
}

// Magic units for the naming system (wizard/cleric)
export function isUnitMagicRegalia(unitType: string): boolean {
  return unitType === 'wizard' || unitType === 'cleric' || unitType === 'conjurer';
}

// ---- Modifier Pool Definitions ----

interface ModDef {
  statId: string;
  slot: RegaliaSlot;
  scope: 'unit' | 'category' | 'army' | 'hero' | 'economy';
  baseMin: number;
  baseMax: number;
  isPercent: boolean;
  display: string; // template with [Target] placeholder
}

// SWORD POOL — 48 Offense Mods
const SWORD_UNIT_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'damageFlat',  baseMin: 2,  baseMax: 5,  isPercent: false, display: '+[V] [Target] Damage' },
  { statId: 'damagePct',   baseMin: 3,  baseMax: 8,  isPercent: true,  display: '+[V]% [Target] Damage' },
  { statId: 'critChance',  baseMin: 1,  baseMax: 3,  isPercent: true,  display: '+[V]% [Target] Crit Chance' },
  { statId: 'critDamage',  baseMin: 5,  baseMax: 15, isPercent: true,  display: '+[V]% [Target] Crit Dmg' },
  { statId: 'attackSpeed', baseMin: 2,  baseMax: 5,  isPercent: true,  display: '+[V]% [Target] Atk Spd' },
];

const SWORD_CAT_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'catDamagePct',   baseMin: 2, baseMax: 5, isPercent: true, display: '+[V]% [Target] Dmg' },
  { statId: 'catAttackSpeed', baseMin: 2, baseMax: 4, isPercent: true, display: '+[V]% [Target] Atk Spd' },
  { statId: 'catCritChance',  baseMin: 1, baseMax: 2, isPercent: true, display: '+[V]% [Target] Crit Chance' },
];

const SWORD_ARMY_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'armyDamagePct',   baseMin: 0.5, baseMax: 1.5, isPercent: true, display: '+[V]% Army Damage' },
  { statId: 'armyAttackSpeed', baseMin: 0.5, baseMax: 1.5, isPercent: true, display: '+[V]% Army Attack Speed' },
  { statId: 'armyCritChance',  baseMin: 0.2, baseMax: 0.6, isPercent: true, display: '+[V]% Army Crit Chance'  },
];

const SWORD_HERO_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'heroDamageFlat',   baseMin: 3,  baseMax: 8,  isPercent: false, display: '+[V] Hero Damage' },
  { statId: 'heroDamagePct',    baseMin: 5,  baseMax: 12, isPercent: true,  display: '+[V]% Hero Damage' },
  { statId: 'heroCritChance',   baseMin: 2,  baseMax: 5,  isPercent: true,  display: '+[V]% Hero Crit Chance' },
  { statId: 'heroCritDamage',   baseMin: 10, baseMax: 25, isPercent: true,  display: '+[V]% Hero Crit Dmg' },
  { statId: 'heroAttackSpeed',  baseMin: 3,  baseMax: 8,  isPercent: true,  display: '+[V]% Hero Atk Speed' },
  { statId: 'heroSkillCooldown', baseMin: 2, baseMax: 5,  isPercent: true,  display: '-[V]% Hero Skill CD' },
];

// SHIELD POOL — 44 Defense Mods
const SHIELD_UNIT_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'hpPct',        baseMin: 3,   baseMax: 8,   isPercent: true,  display: '+[V]% [Target] HP' },
  { statId: 'hpFlat',       baseMin: 5,   baseMax: 15,  isPercent: false, display: '+[V] [Target] HP' },
  { statId: 'defenseFlat',  baseMin: 1,   baseMax: 2,   isPercent: false, display: '+[V] [Target] Defense' },
  { statId: 'regenPct',     baseMin: 0.5, baseMax: 1.5, isPercent: true,  display: '+[V]% [Target] HP Regen/s' },
  { statId: 'defensePct',   baseMin: 3,   baseMax: 8,   isPercent: true,  display: '+[V]% [Target] Defense' },
];

const SHIELD_CAT_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'catHpPct',   baseMin: 2,   baseMax: 5, isPercent: true,  display: '+[V]% [Target] HP' },
  { statId: 'catDefense', baseMin: 0.5, baseMax: 1, isPercent: false, display: '+[V] [Target] Def' },
];

const SHIELD_ARMY_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'armyHpPct',    baseMin: 0.5, baseMax: 1.5, isPercent: true,  display: '+[V]% Army HP' },
  { statId: 'armyDefense',  baseMin: 0.2, baseMax: 0.5, isPercent: false, display: '+[V] Army Defense' },
  { statId: 'armyRegenPct', baseMin: 0.1, baseMax: 0.3, isPercent: true,  display: '+[V]% Army HP Regen/s' },
];

const SHIELD_HERO_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'heroHpPct',        baseMin: 5,   baseMax: 12,  isPercent: true,  display: '+[V]% Hero HP' },
  { statId: 'heroHpFlat',       baseMin: 10,  baseMax: 25,  isPercent: false, display: '+[V] Hero HP' },
  { statId: 'heroDefense',      baseMin: 1,   baseMax: 3,   isPercent: false, display: '+[V] Hero Defense' },
  { statId: 'heroRegenPct',     baseMin: 0.5, baseMax: 1.5, isPercent: true,  display: '+[V]% Hero HP Regen/s' },
  { statId: 'heroDefensePct',   baseMin: 5,   baseMax: 12,  isPercent: true,  display: '+[V]% Hero Defense' },
];

// NECKLACE POOL — 40 Economy/Utility Mods
const INCOME_TIERS = ['slime', 'scouting', 'delivery', 'smithing', 'barricade', 'enchanting', 'militia', 'territory'] as const;

const NECKLACE_INCOME_MODS: { tierPrefix: string; statId: string; baseMin: number; baseMax: number; isPercent: boolean; display: string }[] = [];
for (const tier of INCOME_TIERS) {
  const cap = tier.charAt(0).toUpperCase() + tier.slice(1);
  NECKLACE_INCOME_MODS.push(
    { tierPrefix: tier, statId: `${tier}Speed`,  baseMin: 3, baseMax: 6, isPercent: true, display: `+[V]% ${cap} Speed` },
    { tierPrefix: tier, statId: `${tier}Income`, baseMin: 3, baseMax: 8, isPercent: true, display: `+[V]% ${cap} Income` },
  );
}

const NECKLACE_ECONOMY_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'goldBonusPct',       baseMin: 1,   baseMax: 3,   isPercent: true,  display: '+[V]% Gold (all sources)' },
  { statId: 'killGoldPct',        baseMin: 4,   baseMax: 10,  isPercent: true,  display: '+[V]% Kill Gold' },
  { statId: 'shardBonusPct',      baseMin: 2,   baseMax: 5,   isPercent: true,  display: '+[V]% Shard Bonus' },
  { statId: 'gemBonusPct',        baseMin: 2,   baseMax: 5,   isPercent: true,  display: '+[V]% Gem Bonus' },
  { statId: 'buildingEffectPct',  baseMin: 3,   baseMax: 6,   isPercent: true,  display: '+[V]% Building Power' },
  { statId: 'upgradeCostReduction', baseMin: 1, baseMax: 3,   isPercent: true,  display: '-[V]% Upgrade Costs' },
  { statId: 'chestDropChance',    baseMin: 1,   baseMax: 3,   isPercent: true,  display: '+[V]% Chest Drop Chance' },
  { statId: 'startingGold',       baseMin: 200, baseMax: 500, isPercent: false, display: '+[V] Starting Gold' },
  { statId: 'passiveIncome',      baseMin: 1,   baseMax: 3,   isPercent: false, display: '+[V] Gold/sec' },
];

const NECKLACE_UNIT_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'respawnSpeed', baseMin: 3,    baseMax: 6,    isPercent: true,  display: '+[V]% [Target] Respawn' },
  { statId: 'moveSpeed',    baseMin: 0.02, baseMax: 0.05, isPercent: false, display: '+[V] [Target] Move Spd' },
];

const NECKLACE_ARMY_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'armyRespawnSpeed', baseMin: 0.5,   baseMax: 1.5,  isPercent: true,  display: '+[V]% Army Respawn' },
  { statId: 'armyMoveSpeed',    baseMin: 0.005, baseMax: 0.01, isPercent: false, display: '+[V] Army Move Spd' },
];

const NECKLACE_HERO_MODS: Omit<ModDef, 'slot' | 'scope'>[] = [
  { statId: 'heroMoveSpeed', baseMin: 0.03, baseMax: 0.08, isPercent: false, display: '+[V] Hero Move Spd' },
];

// ---- Build flat pools for each slot ----

interface PoolEntry {
  statId: string;
  scope: 'unit' | 'category' | 'army' | 'hero' | 'economy';
  baseMin: number;
  baseMax: number;
  isPercent: boolean;
  display: string;
  // For targeted mods: which specific target/category (null = roll random at generation time)
  fixedTarget?: RegaliaTarget;
  fixedCategory?: RegaliaCategory;
  tierPrefix?: string; // For income mods
}

function buildUnitEntries(mods: Omit<ModDef, 'slot' | 'scope'>[]): PoolEntry[] {
  const entries: PoolEntry[] = [];
  for (const mod of mods) {
    for (const unit of UNIT_TYPES) {
      entries.push({ ...mod, scope: 'unit', fixedTarget: unit });
    }
  }
  return entries;
}

function buildCategoryEntries(mods: Omit<ModDef, 'slot' | 'scope'>[]): PoolEntry[] {
  const entries: PoolEntry[] = [];
  for (const mod of mods) {
    for (const cat of CATEGORIES) {
      entries.push({ ...mod, scope: 'category', fixedCategory: cat });
    }
  }
  return entries;
}

function buildArmyEntries(mods: Omit<ModDef, 'slot' | 'scope'>[]): PoolEntry[] {
  return mods.map(mod => ({ ...mod, scope: 'army' as const }));
}

function buildHeroEntries(mods: Omit<ModDef, 'slot' | 'scope'>[]): PoolEntry[] {
  return mods.map(mod => ({ ...mod, scope: 'hero' as const, fixedTarget: 'hero' as RegaliaTarget }));
}

const SWORD_POOL: PoolEntry[] = [
  ...buildUnitEntries(SWORD_UNIT_MODS),      // 5 * 8 = 40
  ...buildCategoryEntries(SWORD_CAT_MODS),   // 3 * 3 = 9
  ...buildArmyEntries(SWORD_ARMY_MODS),      // 3
  ...buildHeroEntries(SWORD_HERO_MODS),       // 6
]; // Total: 58

const SHIELD_POOL: PoolEntry[] = [
  ...buildUnitEntries(SHIELD_UNIT_MODS),     // 5 * 8 = 40
  ...buildCategoryEntries(SHIELD_CAT_MODS),  // 2 * 3 = 6
  ...buildArmyEntries(SHIELD_ARMY_MODS),     // 3
  ...buildHeroEntries(SHIELD_HERO_MODS),      // 5
]; // Total: 54

const NECKLACE_POOL: PoolEntry[] = [
  // Income tiers: 8 tiers * 2 (speed + income) = 16
  ...NECKLACE_INCOME_MODS.map(m => ({
    statId: m.statId, scope: 'economy' as const, baseMin: m.baseMin, baseMax: m.baseMax,
    isPercent: m.isPercent, display: m.display, tierPrefix: m.tierPrefix,
  })),
  // General economy: 9
  ...NECKLACE_ECONOMY_MODS.map(m => ({ ...m, scope: 'economy' as const })),
  // Per-unit utility: 2 * 8 = 16
  ...buildUnitEntries(NECKLACE_UNIT_MODS),
  // Army utility: 2
  ...buildArmyEntries(NECKLACE_ARMY_MODS),
  // Hero utility: 1
  ...buildHeroEntries(NECKLACE_HERO_MODS),
]; // Total: 44

const SLOT_POOLS: Record<RegaliaSlot, PoolEntry[]> = {
  sword: SWORD_POOL,
  shield: SHIELD_POOL,
  necklace: NECKLACE_POOL,
};

// ---- Value Calculation ----

function rollValue(baseMin: number, baseMax: number, zone: number, rarityMult: number): number {
  const base = baseMin + Math.random() * (baseMax - baseMin);
  const zoneMult = zone * (1 / (1 + DR_FACTOR * zone));
  return base * zoneMult * rarityMult;
}

function roundValue(value: number, isPercent: boolean): number {
  if (isPercent) return Math.round(value * 100) / 100; // 2 decimal places for %
  // For flat values: if small (< 1), keep 2 decimals; otherwise round to int
  if (Math.abs(value) < 1) return Math.round(value * 100) / 100;
  return Math.round(value * 10) / 10; // 1 decimal for medium values
}

/** Get the effective value of a modifier including level and star bonuses */
export function getEffectiveModValue(mod: RegaliaModifier, level: number): number {
  return mod.value * LEVEL_MULTS[level] * (1 + 0.15 * mod.stars);
}

// ---- Rarity Rolling ----

function rollRarity(zone: number, pool: RegaliaRarity[]): RegaliaRarity {
  // Zone scaling: per zone beyond 2, shift 1% from Common toward Rare/Legendary (caps at zone 12)
  const zoneShift = Math.min(10, Math.max(0, zone - 2));
  const weights: Record<RegaliaRarity, number> = { common: 0, rare: 0, legendary: 0 };

  for (const r of pool) weights[r] = RARITY_CONFIG[r].dropWeight;

  // Apply zone shift: move weight from common to rare/legendary
  if (weights.common > 0 && zoneShift > 0) {
    const shift = zoneShift;
    weights.common = Math.max(0, weights.common - shift);
    if (weights.legendary > 0) {
      weights.rare += shift * 0.7;
      weights.legendary += shift * 0.3;
    } else {
      weights.rare += shift;
    }
  }

  // Normalize to only pool entries
  const total = pool.reduce((s, r) => s + weights[r], 0);
  const roll = Math.random() * total;
  let acc = 0;
  for (const r of pool) {
    acc += weights[r];
    if (roll < acc) return r;
  }
  return pool[pool.length - 1];
}

// ---- Unlock filtering ----

/** Maps income tier prefix to PermanentUpgrades key */
const TIER_TO_UPGRADE_KEY: Record<string, string> = {
  scouting: 'incomeTier2', delivery: 'incomeTier3', smithing: 'incomeTier4',
  barricade: 'incomeTier5', enchanting: 'incomeTier6', militia: 'incomeTier7', territory: 'incomeTier8',
};

export interface RegaliaUnlockFilter {
  unlockedUnits: string[];
  incomeTiers: Record<string, number>; // PermanentUpgrades tier keys
}

// Which units belong to each category (for archetype gating)
const CATEGORY_UNITS: Record<RegaliaCategory, string[]> = {
  melee: ['soldier', 'halberd', 'knight'],
  ranged: ['archer', 'bombard'],
  magic: ['wizard', 'cleric', 'conjurer'],
};

function filterPool(pool: PoolEntry[], filter?: RegaliaUnlockFilter): PoolEntry[] {
  if (!filter) return pool;
  return pool.filter(entry => {
    // Filter unit-specific mods for locked units
    if (entry.fixedTarget && entry.fixedTarget !== 'hero' && entry.scope === 'unit') {
      if (!filter.unlockedUnits.includes(entry.fixedTarget)) return false;
    }
    // Filter category mods if no unit of that category is unlocked
    if (entry.fixedCategory && entry.scope === 'category') {
      const catUnits = CATEGORY_UNITS[entry.fixedCategory];
      if (catUnits && !catUnits.some(u => filter.unlockedUnits.includes(u))) return false;
    }
    // Filter income tier mods for locked tiers (slime/tier1 is always available)
    if (entry.tierPrefix) {
      const upgradeKey = TIER_TO_UPGRADE_KEY[entry.tierPrefix];
      if (upgradeKey && !(filter.incomeTiers[upgradeKey] > 0)) return false;
    }
    return true;
  });
}

/** Build unlock filter from PermanentUpgrades (disabled units treated as locked) */
export function buildUnlockFilter(upgrades: { unlockedUnits: string[]; disabledUnits?: string[]; [key: string]: unknown }): RegaliaUnlockFilter {
  const disabled = (upgrades.disabledUnits as string[]) || [];
  return {
    unlockedUnits: (upgrades.unlockedUnits as string[]).filter(u => !disabled.includes(u)),
    incomeTiers: {
      incomeTier2: (upgrades.incomeTier2 as number) || 0,
      incomeTier3: (upgrades.incomeTier3 as number) || 0,
      incomeTier4: (upgrades.incomeTier4 as number) || 0,
      incomeTier5: (upgrades.incomeTier5 as number) || 0,
      incomeTier6: (upgrades.incomeTier6 as number) || 0,
      incomeTier7: (upgrades.incomeTier7 as number) || 0,
      incomeTier8: (upgrades.incomeTier8 as number) || 0,
    },
  };
}

// ---- Regalia Generation ----

let _regaliaIdCounter = 0;

function genRegaliaId(): string {
  return `reg_${Date.now()}_${++_regaliaIdCounter}`;
}

export function rollRegalia(slot: RegaliaSlot, zone: number, rarity: RegaliaRarity, unlockFilter?: RegaliaUnlockFilter): Regalia {
  const config = RARITY_CONFIG[rarity];
  const pool = filterPool(SLOT_POOLS[slot], unlockFilter);
  const modCount = config.modMin + Math.floor(Math.random() * (config.modMax - config.modMin + 1));

  // Pick modifiers — duplicates allowed (same stat+target can roll multiple times)
  const chosen: PoolEntry[] = [];
  for (let i = 0; i < modCount; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    chosen.push(pool[idx]);
  }

  const modifiers: RegaliaModifier[] = chosen.map(entry => ({
    statId: entry.statId,
    target: entry.fixedTarget || null,
    category: entry.fixedCategory || null,
    value: roundValue(rollValue(entry.baseMin, entry.baseMax, zone, config.valueMult), entry.isPercent),
    stars: 0,
    enhances: 0,
  }));

  const regalia: Regalia = {
    id: genRegaliaId(),
    name: '', // filled below
    slot,
    rarity,
    zone,
    modifiers,
    level: 0,
  };

  regalia.name = generateRegaliaName(regalia);
  return regalia;
}

/** Roll a regalia from a drop source */
export function rollRegaliaDrop(
  slot: RegaliaSlot,
  zone: number,
  rarityPool: RegaliaRarity[],
  unlockFilter?: RegaliaUnlockFilter,
): Regalia {
  const rarity = rollRarity(zone, rarityPool);
  return rollRegalia(slot, zone, rarity, unlockFilter);
}

// ---- Naming System ----

const SWORD_NAMES: Record<string, string[]> = {
  melee:  ['Blade', 'Axe', 'Sword', 'Edge'],
  ranged: ['Bow', 'Longbow', 'Quiver'],
  magic:  ['Staff', 'Wand', 'Tome'],
  hero:   ['Crown', 'Regalia', 'Scepter'],
  _default: ['Rusty Sword', 'Broken Dagger', 'Stick', 'Bent Shiv', 'Dull Knife'],
};

const SHIELD_NAMES: Record<string, string[]> = {
  melee:  ['Shield', 'Buckler', 'Bulwark'],
  ranged: ['Cloak', 'Mantle', 'Cape'],
  magic:  ['Orb', 'Crystal', 'Rune'],
  hero:   ['Aegis', 'Ward', 'Crest'],
  _default: ['Wooden Plank', 'Cracked Lid', 'Bent Tray', 'Soggy Book', 'Old Pot Lid'],
};

const NECKLACE_NAMES = ['Pendant', 'Charm', 'Amulet', 'Sigil', 'Torc', 'Locket'];
const NECKLACE_DEFAULTS = ['Frayed String', 'Rusty Chain', 'Shoelace', 'Bottlecap Necklace', 'Bent Wire'];

const TARGET_PREFIXES: Record<string, string> = {
  hero: "Hero's",
  soldier: "Soldier's",
  archer: "Archer's",
  knight: "Knight's",
  halberd: "Halberd's",
  cleric: "Cleric's",
  wizard: "Apprentice's",
  conjurer: "Conjurer's",
  bombard: "Bombard's",
  melee: "Warrior's",
  ranged: "Hunter's",
  magic: 'Arcane',
  army: "Commander's",
  economy: 'Golden',
};

const RARITY_SUFFIXES: Record<RegaliaRarity, string[]> = {
  common:    ['of the Plains', 'of Dusk', 'of the Forest', 'of Ash', 'of Mist'],
  rare:      ['of the Storm', 'of Fury', 'of Frost', 'of Thunder', 'of Iron'],
  legendary: ['of the Inferno', 'of Eternity', 'of the Abyss', 'of Undying', 'of Ruin'],
};

function getDominantTarget(modifiers: RegaliaModifier[]): string {
  const counts: Record<string, number> = {};

  for (const mod of modifiers) {
    if (mod.target === 'hero') {
      counts['hero'] = (counts['hero'] || 0) + 1;
    } else if (mod.target) {
      // Unit-specific: check if melee/ranged/magic
      if (mod.target === 'soldier' || mod.target === 'halberd' || mod.target === 'knight') {
        counts['melee'] = (counts['melee'] || 0) + 1;
      } else if (mod.target === 'archer' || mod.target === 'bombard') {
        counts['ranged'] = (counts['ranged'] || 0) + 1;
      } else if (mod.target === 'wizard' || mod.target === 'cleric' || mod.target === 'conjurer') {
        counts['magic'] = (counts['magic'] || 0) + 1;
      }
    } else if (mod.category) {
      counts[mod.category] = (counts[mod.category] || 0) + 1;
    }
  }

  let best = 'mixed';
  let bestCount = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (count > bestCount) { best = key; bestCount = count; }
  }
  return best;
}

function getTargetPrefix(modifiers: RegaliaModifier[]): string | null {
  const counts: Record<string, number> = {};

  for (const mod of modifiers) {
    if (mod.target === 'hero') {
      counts['hero'] = (counts['hero'] || 0) + 1;
    } else if (mod.target) {
      counts[mod.target] = (counts[mod.target] || 0) + 1;
    }
    if (mod.category) {
      counts[mod.category] = (counts[mod.category] || 0) + 1;
    }
    if (!mod.target && !mod.category) {
      if (mod.statId.startsWith('army')) {
        counts['army'] = (counts['army'] || 0) + 1;
      } else {
        counts['economy'] = (counts['economy'] || 0) + 1;
      }
    }
  }

  // Only earn a prefix if a target has 2+ mods
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  for (const [key, count] of sorted) {
    if (count >= 2 && TARGET_PREFIXES[key]) return TARGET_PREFIXES[key];
  }
  return null;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRegaliaName(regalia: Regalia): string {
  const { slot, rarity, modifiers } = regalia;

  // Weapon type name — ugly defaults when no clear dominant target
  let weaponType: string;
  if (slot === 'necklace') {
    const dominant = getDominantTarget(modifiers);
    weaponType = dominant === 'mixed' ? pickRandom(NECKLACE_DEFAULTS) : pickRandom(NECKLACE_NAMES);
  } else {
    const dominant = getDominantTarget(modifiers);
    const namePool = slot === 'sword' ? SWORD_NAMES : SHIELD_NAMES;
    weaponType = pickRandom(namePool[dominant] || namePool['_default']);
  }

  // Prefix: only if a target has 2+ mods
  const prefix = getTargetPrefix(modifiers);

  // Suffix
  const suffix = pickRandom(RARITY_SUFFIXES[rarity]);

  // Assemble — add ★ when prefix is earned
  if (prefix) {
    return `${prefix} ${weaponType} ${suffix} \u2605`;
  }
  return `${weaponType} ${suffix}`;
}

// ---- Upgrade / Salvage / Star helpers ----

export function getUpgradeCost(level: number): number | null {
  if (level >= 5) return null;
  return LEVEL_COSTS[level];
}

export function getSalvageRewards(rarity: RegaliaRarity): { essence: number; stardust: number } {
  return SALVAGE_REWARDS[rarity];
}

export function getMaxStars(rarity: RegaliaRarity): number {
  return RARITY_CONFIG[rarity].maxStars;
}

export function getTotalStars(regalia: Regalia): number {
  return regalia.modifiers.reduce((s, m) => s + m.stars, 0);
}

/** Reroll a modifier's value (enhancement). Tiered: base→rare→legendary. Never decreases. */
export function enhanceModifier(regalia: Regalia, modIndex: number): Regalia {
  const mod = regalia.modifiers[modIndex];
  if ((mod.enhances || 0) >= MAX_ENHANCES) return regalia;

  const pool = SLOT_POOLS[regalia.slot];
  const entry = pool.find(e =>
    e.statId === mod.statId &&
    (e.fixedTarget || null) === mod.target &&
    (e.fixedCategory || null) === mod.category
  );

  let newValue = mod.value;
  if (entry) {
    const config = RARITY_CONFIG[regalia.rarity];
    const newRoll = roundValue(
      rollValue(entry.baseMin, entry.baseMax, regalia.zone, config.valueMult),
      entry.isPercent,
    );
    newValue = roundValue(Math.max(mod.value, newRoll), entry.isPercent);
  }

  const newMods = [...regalia.modifiers];
  newMods[modIndex] = { ...mod, value: newValue, enhances: (mod.enhances || 0) + 1 };
  return { ...regalia, modifiers: newMods };
}

export function getEnhanceCost(mod: RegaliaModifier): { essence: number; stardust: number } | null {
  const tier = mod.enhances || 0;
  if (tier >= MAX_ENHANCES) return null;
  return ENHANCE_COSTS[tier];
}

/** Apply a star to a specific modifier */
export function addStar(regalia: Regalia, modIndex: number): Regalia {
  const newMods = [...regalia.modifiers];
  newMods[modIndex] = { ...newMods[modIndex], stars: newMods[modIndex].stars + 1 };
  return { ...regalia, modifiers: newMods };
}

/** Level up a regalia */
export function levelUpRegalia(regalia: Regalia): Regalia {
  if (regalia.level >= 5) return regalia;
  return { ...regalia, level: regalia.level + 1 };
}

// ---- Display Helpers ----

export function formatModValue(mod: RegaliaModifier, level: number): string {
  const eff = getEffectiveModValue(mod, level);
  const pool = Object.values(SLOT_POOLS).flat();
  const entry = pool.find(e =>
    e.statId === mod.statId &&
    (e.fixedTarget || null) === mod.target &&
    (e.fixedCategory || null) === mod.category
  );
  const isPercent = entry?.isPercent ?? false;

  if (isPercent) {
    return `${eff >= 0 ? '+' : ''}${eff.toFixed(1)}%`;
  }
  // Flat values
  if (Math.abs(eff) < 1) return `${eff >= 0 ? '+' : ''}${eff.toFixed(2)}`;
  return `${eff >= 0 ? '+' : ''}${Math.round(eff * 10) / 10}`;
}

export function getModDisplayText(mod: RegaliaModifier, level: number): string {
  const pool = Object.values(SLOT_POOLS).flat();
  const entry = pool.find(e =>
    e.statId === mod.statId &&
    (e.fixedTarget || null) === mod.target &&
    (e.fixedCategory || null) === mod.category
  );
  if (!entry) return `${formatModValue(mod, level)} ${mod.statId}`;

  const eff = getEffectiveModValue(mod, level);
  let display = entry.display;

  // Replace [V] with formatted value
  const isPercent = entry.isPercent;
  const valStr = isPercent ? eff.toFixed(1) : (Math.abs(eff) < 1 ? eff.toFixed(2) : String(Math.round(eff * 10) / 10));
  display = display.replace('[V]', valStr);

  // Replace [Target] with target name
  if (mod.target && mod.target !== 'hero') {
    display = display.replace('[Target]', TARGET_DISPLAY[mod.target] || mod.target);
  } else if (mod.category) {
    display = display.replace('[Target]', TARGET_DISPLAY[mod.category] || mod.category);
  }

  return display;
}

export const RARITY_COLORS: Record<RegaliaRarity, string> = {
  common: '#aaa',
  rare: '#4a9fff',
  legendary: '#ffd700',
};

export const SLOT_ICONS: Record<RegaliaSlot, string> = {
  sword: '\u2694\uFE0F',
  shield: '\uD83D\uDEE1\uFE0F',
  necklace: '\uD83D\uDCFF',
};

// ---- Drop source helpers ----

/** Get regalia slot for boss drops (cycles sword/shield/necklace) */
export function getBossDropSlot(bossesDefeated: number): RegaliaSlot {
  const slots: RegaliaSlot[] = ['sword', 'shield', 'necklace'];
  return slots[bossesDefeated % 3];
}

/** Get a random regalia slot */
export function getRandomSlot(): RegaliaSlot {
  const slots: RegaliaSlot[] = ['sword', 'shield', 'necklace'];
  return slots[Math.floor(Math.random() * 3)];
}

/** Mob drop rarity pool: Common/Rare (80/20) */
export const MOB_RARITY_POOL: RegaliaRarity[] = ['common', 'rare'];

/** Boss drop rarity pool: Common/Rare/Legendary (50/35/15) */
export const BOSS_RARITY_POOL: RegaliaRarity[] = ['common', 'rare', 'legendary'];

/** Dungeon clear rarity pool: Rare/Legendary (75/25) */
export const DUNGEON_RARITY_POOL: RegaliaRarity[] = ['rare', 'legendary'];

/** Survey site rarity pool: Rare/Legendary (70/30) */
export const SURVEY_RARITY_POOL: RegaliaRarity[] = ['rare', 'legendary'];

// Override weights for specific pools
const BOSS_DROP_WEIGHTS: Record<RegaliaRarity, number> = { common: 50, rare: 35, legendary: 15 };
const DUNGEON_DROP_WEIGHTS: Record<RegaliaRarity, number> = { common: 0, rare: 75, legendary: 25 };
const SURVEY_DROP_WEIGHTS: Record<RegaliaRarity, number> = { common: 0, rare: 70, legendary: 30 };

export function rollBossRegaliaRarity(zone: number): RegaliaRarity {
  const zoneShift = Math.min(10, Math.max(0, zone - 2));
  const w = { ...BOSS_DROP_WEIGHTS };
  if (w.common > 0 && zoneShift > 0) {
    w.common = Math.max(0, w.common - zoneShift);
    w.rare += zoneShift * 0.7;
    w.legendary += zoneShift * 0.3;
  }
  const total = w.common + w.rare + w.legendary;
  const roll = Math.random() * total;
  if (roll < w.common) return 'common';
  if (roll < w.common + w.rare) return 'rare';
  return 'legendary';
}

export function rollDungeonRegaliaRarity(): RegaliaRarity {
  const total = DUNGEON_DROP_WEIGHTS.rare + DUNGEON_DROP_WEIGHTS.legendary;
  return Math.random() * total < DUNGEON_DROP_WEIGHTS.rare ? 'rare' : 'legendary';
}

export function rollSurveyRegaliaRarity(): RegaliaRarity {
  const total = SURVEY_DROP_WEIGHTS.rare + SURVEY_DROP_WEIGHTS.legendary;
  return Math.random() * total < SURVEY_DROP_WEIGHTS.rare ? 'rare' : 'legendary';
}

// ---- Auto-salvage (when stash is full) ----

/** Find the weakest regalia in stash for auto-salvage (lowest rarity, then lowest zone) */
export function findAutoSalvageTarget(stash: Regalia[]): number {
  const rarityOrder: Record<RegaliaRarity, number> = { common: 0, rare: 1, legendary: 2 };
  let worstIdx = 0;
  let worstScore = Infinity;
  for (let i = 0; i < stash.length; i++) {
    const r = stash[i];
    const score = rarityOrder[r.rarity] * 1000 + r.zone * 10 + r.level;
    if (score < worstScore) { worstScore = score; worstIdx = i; }
  }
  return worstIdx;
}
