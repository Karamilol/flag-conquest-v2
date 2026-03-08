// ---- Relic Collection System (v2) ----

export type RelicRarity = 'common' | 'rare' | 'legendary';

export interface RelicDef {
  id: string;
  name: string;
  icon: string;
  rarity: RelicRarity;
  setId: string | null; // null = unclassified
  desc: string;
  effectPerLevel: number; // scaling factor per level
}

export interface RelicSetDef {
  id: string;
  name: string;
  icon: string;
  relics: string[];
  bonuses: { pieces: number; name: string; desc: string }[];
  tierGate?: string; // e.g. 'incomeTier2' — relics only drop when this tier is unlocked
}

export type RelicCollection = Record<string, number>; // relicId → copies collected

// ---- Relic Level Thresholds ----
const RELIC_LEVEL_THRESHOLDS = [1, 3, 5, 7, 9]; // copies needed for Lv 1-5

export function getRelicLevel(copies: number): number {
  if (copies <= 0) return 0;
  for (let i = RELIC_LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (copies >= RELIC_LEVEL_THRESHOLDS[i]) return i + 1;
  }
  return 0;
}

// ---- Set Piece Count (NEW) ----
// Counts how many unique relics in the set are owned (copies >= 1)
export function getSetPieceCount(setDef: RelicSetDef, collection: RelicCollection): number {
  return setDef.relics.filter(id => (collection[id] || 0) >= 1).length;
}

// Check if a set bonus is active (need at least 1 of EACH relic)
export function hasSetBonus(setDef: RelicSetDef, collection: RelicCollection, pieces: number): boolean {
  return getSetPieceCount(setDef, collection) >= pieces;
}

// ---- DEPRECATED: Old set level system (kept for migration, returns 0) ----
/** @deprecated Use getSetPieceCount/hasSetBonus instead */
export function getSetLevel(_setDef: RelicSetDef, _collection: RelicCollection): number {
  return 0;
}
/** @deprecated Set bonus multipliers removed in v2 */
export function getSetBonusMultiplier(_level: number): number {
  return 0;
}

// Copies needed for NEXT relic level (for progress display)
export function copiesForNextLevel(currentCopies: number): { current: number; needed: number; level: number } {
  const level = getRelicLevel(currentCopies);
  if (level >= 5) return { current: currentCopies, needed: RELIC_LEVEL_THRESHOLDS[4], level: 5 };
  const needed = RELIC_LEVEL_THRESHOLDS[level]; // copies needed for next level
  return { current: currentCopies, needed, level };
}

// ---- 42 Relic Definitions ----

export const RELIC_DEFS: RelicDef[] = [
  // === SLIME HUNTERS (T1) ===
  { id: 'gel', name: 'Gel', icon: '\u{1F9CA}', rarity: 'common', setId: 'slimeHunters', desc: '+3% melee HP', effectPerLevel: 0.03 },
  { id: 'largerBags', name: 'Larger Bags', icon: '\u{1F4B0}', rarity: 'common', setId: 'slimeHunters', desc: '+10% gold on kill', effectPerLevel: 0.10 },
  { id: 'slimeBait', name: 'Slime Bait', icon: '\u{1FAB1}', rarity: 'common', setId: 'slimeHunters', desc: '+5% slime income speed', effectPerLevel: 0.05 },
  { id: 'biggerNets', name: 'Bigger Nets', icon: '\u{1F945}', rarity: 'common', setId: 'slimeHunters', desc: '+5% slime income payout', effectPerLevel: 0.05 },
  { id: 'greenInk', name: 'Green Ink', icon: '\u{1F4D7}', rarity: 'rare', setId: 'slimeHunters', desc: '+3% magic user attack speed', effectPerLevel: 0.03 },

  // === SCOUTING (T2) ===
  { id: 'gaiters', name: 'Gaiters', icon: '\u{1F462}', rarity: 'common', setId: 'scoutingSet', desc: '+5% scouting speed', effectPerLevel: 0.05 },
  { id: 'rucksack', name: 'Rucksack', icon: '\u{1F392}', rarity: 'common', setId: 'scoutingSet', desc: '+5% scouting payout', effectPerLevel: 0.05 },
  { id: 'strongerBows', name: 'Stronger Bows', icon: '\u{1F3F9}', rarity: 'rare', setId: 'scoutingSet', desc: 'Ranged units gain +1 damage', effectPerLevel: 1 },
  { id: 'magicMushroom', name: 'Magic Mushroom', icon: '\u{1F344}', rarity: 'rare', setId: 'scoutingSet', desc: 'Halberds & archers gain +3 range', effectPerLevel: 3 },
  { id: 'spoils', name: 'Spoils', icon: '\u{1FA99}', rarity: 'common', setId: 'scoutingSet', desc: 'Archer kills: 1% chance to drop gold chest', effectPerLevel: 0.01 },

  // === HAULERS (T3) ===
  { id: 'carriage', name: 'Carriage', icon: '\u{1F6D2}', rarity: 'common', setId: 'haulersSet', desc: '+5% delivering speed', effectPerLevel: 0.05 },
  { id: 'trunks', name: 'Trunks', icon: '\u{1F4E6}', rarity: 'common', setId: 'haulersSet', desc: '+5% delivering payout', effectPerLevel: 0.05 },
  { id: 'wornBoots', name: 'Worn Boots', icon: '\u{1F97E}', rarity: 'common', setId: 'haulersSet', desc: 'Army gains +0.02 movespeed', effectPerLevel: 0.02 },
  { id: 'supplies', name: 'Supplies', icon: '\u{1F4E6}', rarity: 'legendary', setId: 'haulersSet', desc: 'Delivering proc heals all units', effectPerLevel: 0.05 },

  // === SMITHY'S (T4) ===
  { id: 'blacksmithHammer', name: "Blacksmith's Hammer", icon: '\u{1F528}', rarity: 'common', setId: 'smithysSet', desc: '+5% smithing speed', effectPerLevel: 0.05 },
  { id: 'betterIron', name: 'Better Iron', icon: '\u2692\uFE0F', rarity: 'common', setId: 'smithysSet', desc: '+5% smithing payout', effectPerLevel: 0.05 },
  { id: 'forgedWeapons', name: 'Forged Weapons', icon: '\u2694\uFE0F', rarity: 'rare', setId: 'smithysSet', desc: 'Melee units gain +1 damage', effectPerLevel: 1 },
  { id: 'platedLeather', name: 'Plated Leather', icon: '\u{1F9E5}', rarity: 'rare', setId: 'smithysSet', desc: 'Ranged units gain +1 defense', effectPerLevel: 1 },
  { id: 'scaleMail', name: 'Scale Mail', icon: '\u{1F6E1}\uFE0F', rarity: 'rare', setId: 'smithysSet', desc: 'Melee units gain +1 defense', effectPerLevel: 1 },
  { id: 'glasses', name: 'Glasses', icon: '\u{1F453}', rarity: 'legendary', setId: 'smithysSet', desc: 'Magic users gain +3 range and 5% crit chance', effectPerLevel: 0.05 },

  // === DEFENDERS (T5) ===
  { id: 'reinforcedPlanks', name: 'Reinforced Planks', icon: '\u{1FAB5}', rarity: 'common', setId: 'defendersSet', desc: '+5% barricade payout', effectPerLevel: 0.05 },
  { id: 'nails', name: 'Nails', icon: '\u{1F4CC}', rarity: 'common', setId: 'defendersSet', desc: '+5% barricade speed', effectPerLevel: 0.05 },
  { id: 'hunkerDown', name: 'Hunker Down', icon: '\u{1F3E0}', rarity: 'rare', setId: 'defendersSet', desc: 'Defend mode: +3 defense near portal', effectPerLevel: 3 },
  { id: 'emergencyRations', name: 'Emergency Rations', icon: '\u{1F35E}', rarity: 'rare', setId: 'defendersSet', desc: 'Hero first hit: recover 30% HP (60s CD)', effectPerLevel: 0.10 },
  { id: 'whiteFlag', name: 'White Flag', icon: '\u{1F3F3}\uFE0F', rarity: 'legendary', setId: 'defendersSet', desc: 'Contesting flag: nearby allies 2% HP/s regen', effectPerLevel: 0.02 },

  // === ENCHANTERS (T6) ===
  { id: 'quills', name: 'Quills', icon: '\u{1F58B}\uFE0F', rarity: 'common', setId: 'enchantersSet', desc: '+5% enchanting speed', effectPerLevel: 0.05 },
  { id: 'papyrus', name: 'Papyrus', icon: '\u{1F4DC}', rarity: 'common', setId: 'enchantersSet', desc: '+5% enchanting payout', effectPerLevel: 0.05 },
  { id: 'crystalBall', name: 'Crystal Ball', icon: '\u{1F52E}', rarity: 'legendary', setId: 'enchantersSet', desc: 'Magic +1% atk speed per mage (max 6%)', effectPerLevel: 0.01 },
  { id: 'silk', name: 'Silk', icon: '\u{1F9F5}', rarity: 'rare', setId: 'enchantersSet', desc: 'Magic users gain +1 defense', effectPerLevel: 1 },

  // === MILITIA'S (T7) ===
  { id: 'trainingDummy', name: 'Training Dummy', icon: '\u{1F93A}', rarity: 'common', setId: 'militiasSet', desc: '+5% militia speed', effectPerLevel: 0.05 },
  { id: 'warHorn', name: 'War Horn', icon: '\u{1F4EF}', rarity: 'rare', setId: 'militiasSet', desc: '+5% militia payout', effectPerLevel: 0.05 },
  { id: 'brethren', name: 'Brethren', icon: '\u{1F91D}', rarity: 'rare', setId: 'militiasSet', desc: 'Melee death: 5% HP heals nearest ally', effectPerLevel: 0.05 },
  { id: 'royalGuard', name: 'Royal Guard', icon: '\u{1F451}', rarity: 'legendary', setId: 'militiasSet', desc: 'Spawns 1 royal archer to defend hero', effectPerLevel: 1 },

  // === EXPANSION (T8) ===
  { id: 'warTable', name: 'War Table', icon: '\u{1F5FA}\uFE0F', rarity: 'common', setId: 'expansionSet', desc: '+5% territory speed', effectPerLevel: 0.05 },
  { id: 'diplomacy', name: 'Diplomacy', icon: '\u{1F48D}', rarity: 'rare', setId: 'expansionSet', desc: '+5% territory payout', effectPerLevel: 0.05 },
  { id: 'blueprints', name: 'Blueprints', icon: '\u{1F4D0}', rarity: 'legendary', setId: 'expansionSet', desc: 'Building effects +50%', effectPerLevel: 0.50 },
  { id: 'flagConquest', name: 'Flag Conquest', icon: '\u{1F6A9}', rarity: 'rare', setId: 'expansionSet', desc: 'Flag capture time -2 seconds', effectPerLevel: 2 },

  // === ACHIEVEMENTS (no tier gate) ===
  { id: 'juiced', name: 'Juiced', icon: '\u{1F4AA}', rarity: 'legendary', setId: 'achievementsSet', desc: '1% chance to spawn juiced (3x speed)', effectPerLevel: 0.01 },
  { id: 'hats', name: 'Hats', icon: '\u{1F3A9}', rarity: 'rare', setId: 'achievementsSet', desc: '3% chance to spawn with +1 defense hat', effectPerLevel: 0.03 },

  // === ADVENTURER'S KIT (no tier gate) ===
  { id: 'taxes', name: 'Taxes', icon: '\u{1F4B8}', rarity: 'common', setId: 'adventurersKit', desc: 'Per building: generate 1% gold/min', effectPerLevel: 0.01 },
  { id: 'walkingStick', name: 'Walking Stick', icon: '\u{1FA86}', rarity: 'common', setId: 'adventurersKit', desc: 'Hero gains +0.1 movespeed', effectPerLevel: 0.1 },
  { id: 'knife', name: 'Knife', icon: '\u{1F52A}', rarity: 'rare', setId: 'adventurersKit', desc: 'Hero gains 3% crit chance', effectPerLevel: 0.03 },
];

// ---- 10 Set Definitions ----

export const RELIC_SETS: RelicSetDef[] = [
  {
    id: 'slimeHunters', name: 'Slime Hunters', icon: '\u{1FAB1}',
    relics: ['gel', 'largerBags', 'slimeBait', 'biggerNets', 'greenInk'],
    bonuses: [{ pieces: 5, name: 'Slime Expertise', desc: 'Hero kills: 5% chance to spawn slime, +1% dmg per slime alive' }],
  },
  {
    id: 'scoutingSet', name: 'Scouting', icon: '\u{1F50D}',
    relics: ['gaiters', 'rucksack', 'strongerBows', 'magicMushroom', 'spoils'],
    bonuses: [{ pieces: 5, name: 'Advantage', desc: 'First attack from each unit has 10% crit chance (1.5x)' }],
    tierGate: 'incomeTier2',
  },
  {
    id: 'haulersSet', name: 'Haulers', icon: '\u{1F6D2}',
    relics: ['carriage', 'trunks', 'wornBoots', 'supplies'],
    bonuses: [{ pieces: 4, name: 'Relief', desc: 'First debuff on each unit is absorbed' }],
    tierGate: 'incomeTier3',
  },
  {
    id: 'smithysSet', name: "Smithy's", icon: '\u{1F528}',
    relics: ['blacksmithHammer', 'betterIron', 'forgedWeapons', 'platedLeather', 'scaleMail', 'glasses'],
    bonuses: [{ pieces: 6, name: 'Masterwork Arms', desc: 'Hero +2 damage, +1 defense per boss killed this run' }],
    tierGate: 'incomeTier4',
  },
  {
    id: 'defendersSet', name: 'Defenders', icon: '\u{1F6E1}\uFE0F',
    relics: ['reinforcedPlanks', 'nails', 'hunkerDown', 'emergencyRations', 'whiteFlag'],
    bonuses: [{ pieces: 5, name: 'Watchtower+', desc: 'With Hold The Line: 2x barricade HP + 20% DR. Else: watchtower' }],
    tierGate: 'incomeTier5',
  },
  {
    id: 'enchantersSet', name: 'Enchanters', icon: '\u{1F58B}\uFE0F',
    relics: ['quills', 'papyrus', 'crystalBall', 'silk'],
    bonuses: [{ pieces: 4, name: 'Foresight', desc: 'Magic users gain 10% crit chance (1.5x)' }],
    tierGate: 'incomeTier6',
  },
  {
    id: 'militiasSet', name: "Militia's", icon: '\u{1F93A}',
    relics: ['trainingDummy', 'warHorn', 'brethren', 'royalGuard'],
    bonuses: [{ pieces: 4, name: 'Reflexes', desc: 'Units have 10% chance to dodge the first attack' }],
    tierGate: 'incomeTier7',
  },
  {
    id: 'expansionSet', name: 'Expansion', icon: '\u{1F5FA}\uFE0F',
    relics: ['warTable', 'diplomacy', 'blueprints', 'flagConquest'],
    bonuses: [{ pieces: 4, name: 'Grand Design', desc: 'Income upgrades are 3% cheaper, faster, and pay more' }],
    tierGate: 'incomeTier8',
  },
  {
    id: 'achievementsSet', name: 'Achievements', icon: '\u{1F3C6}',
    relics: ['juiced', 'hats'],
    bonuses: [{ pieces: 2, name: 'Double Down', desc: 'Juiced and Hats chances doubled' }],
  },
  {
    id: 'adventurersKit', name: "Adventurer's Kit", icon: '\u{1F392}',
    relics: ['taxes', 'walkingStick', 'knife'],
    bonuses: [{ pieces: 3, name: 'Kiting', desc: 'Hero gains +8% damage while moving' }],
  },
];

// ---- Tier Gating ----
// Relics from tier-gated sets only drop if that tier is unlocked

export function getEligibleRelics(unlockedTiers?: Record<string, number>): RelicDef[] {
  if (!unlockedTiers) return RELIC_DEFS;
  return RELIC_DEFS.filter(r => {
    if (!r.setId) return true;
    const set = RELIC_SETS.find(s => s.id === r.setId);
    if (!set?.tierGate) return true;
    return (unlockedTiers[set.tierGate] || 0) > 0;
  });
}

// ---- Drop Roller ----
// Weighted by rarity: Common 65%, Rare 30%, Legendary 5%

export function rollRandomRelic(unlockedTiers?: Record<string, number>): string {
  const eligible = getEligibleRelics(unlockedTiers);

  const rarityRoll = Math.random();
  let targetRarity: RelicRarity;
  if (rarityRoll < 0.65) targetRarity = 'common';
  else if (rarityRoll < 0.95) targetRarity = 'rare';
  else targetRarity = 'legendary';

  const candidates = eligible.filter(r => r.rarity === targetRarity);
  if (candidates.length === 0) {
    return eligible[Math.floor(Math.random() * eligible.length)].id;
  }
  return candidates[Math.floor(Math.random() * candidates.length)].id;
}

// ---- Per-level progress (for display) ----
export function perLevelProgress(copies: number): { current: number; needed: number; nextLevel: number } {
  const level = getRelicLevel(copies);
  if (level >= 5) return { current: 0, needed: 0, nextLevel: 6 };
  const prevThreshold = level > 0 ? RELIC_LEVEL_THRESHOLDS[level - 1] : 0;
  const nextThreshold = RELIC_LEVEL_THRESHOLDS[level];
  return { current: copies - prevThreshold, needed: nextThreshold - prevThreshold, nextLevel: level + 1 };
}

// ---- Scaled description (replaces base value with effective value at current level) ----
export function scaledRelicDesc(relic: RelicDef, copies: number): string {
  const level = getRelicLevel(copies);
  if (level <= 1) return relic.desc;
  // Try percentage pattern: "X%" → "Y%"
  const basePercent = Math.round(relic.effectPerLevel * 100);
  if (basePercent > 0 && relic.desc.includes(`${basePercent}%`)) {
    const effectivePercent = Math.round(relic.effectPerLevel * level * 100);
    return relic.desc.replace(`${basePercent}%`, `${effectivePercent}%`);
  }
  // Try flat integer pattern: "+N " → "+M "
  const baseFlat = relic.effectPerLevel;
  if (Number.isInteger(baseFlat) && baseFlat > 0) {
    const effectiveFlat = baseFlat * level;
    return relic.desc.replace(`+${baseFlat} `, `+${effectiveFlat} `);
  }
  // Try flat decimal pattern: "+0.XX" → "+0.YY"
  if (baseFlat > 0 && baseFlat < 1 && !relic.desc.includes('%')) {
    const effectiveFlat = baseFlat * level;
    const baseStr = baseFlat.toString().replace(/0+$/, '');
    const effectiveStr = effectiveFlat.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
    return relic.desc.replace(baseStr, effectiveStr);
  }
  return relic.desc;
}

// ---- Helpers ----

export function getRelicCount(collection: RelicCollection): number {
  return Object.values(collection).reduce((sum, count) => sum + count, 0);
}
