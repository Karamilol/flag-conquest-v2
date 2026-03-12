import type { ShardUpgrades } from './types';

export interface ShardUpgradeDef {
  key: string & keyof ShardUpgrades;
  unitType: 'soldier' | 'archer' | 'halberd' | 'knight' | 'wizard' | 'cleric' | 'conjurer' | 'bombard';
  name: string;
  icon: string;
  maxLevel: number;
  description: string[];
  descriptionFn?: (level: number) => string; // Dynamic description for infinite upgrades
  baseCost: number;
  costScaling: number;
  costs?: number[]; // Explicit per-level costs (overrides baseCost/costScaling for levels within array)
}

export const SHARD_UPGRADES: ShardUpgradeDef[] = [
  // === SOLDIER ===
  { key: 'soldier_quartermastersFavor', unitType: 'soldier', name: "Quartermaster's Favor", icon: '👑',
    maxLevel: 3, description: ['1% elite chance', '2% elite chance', '3% elite chance'],
    baseCost: 5, costScaling: 1.5, costs: [5, 10, 15] },
  { key: 'soldier_fodder', unitType: 'soldier', name: 'Fodder', icon: '⏩',
    maxLevel: 3, description: ['5% faster respawn', '10% faster respawn', '15% faster respawn'],
    baseCost: 2, costScaling: 1.3, costs: [1, 3, 5] },
  { key: 'soldier_rations', unitType: 'soldier', name: 'Rations', icon: '🍖',
    maxLevel: Infinity, description: ['+5% HP', '+10% HP', '+15% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% HP`,
    baseCost: 3, costScaling: 1.3, costs: [1, 3, 5] },
  { key: 'soldier_plating', unitType: 'soldier', name: 'Plating', icon: '🛡️',
    maxLevel: 2, description: ['+1 defense', '+2 defense'],
    baseCost: 3, costScaling: 1.4, costs: [3, 6] },
  { key: 'soldier_betterBoots', unitType: 'soldier', name: 'Better Boots', icon: '👢',
    maxLevel: 1, description: ['+0.1 move speed'],
    baseCost: 3, costScaling: 1, costs: [5] },
  { key: 'soldier_keenEdge', unitType: 'soldier', name: 'Keen Edge', icon: '⚔️',
    maxLevel: Infinity, description: ['+5% damage', '+10% damage', '+15% damage'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% damage`,
    baseCost: 3, costScaling: 1.3, costs: [1, 3, 5] },
  { key: 'soldier_secondWind', unitType: 'soldier', name: 'Second Wind', icon: '💨',
    maxLevel: 2, description: ['10% instant respawn', '20% instant respawn'],
    baseCost: 5, costScaling: 1.5, costs: [6, 12] },

  // === ARCHER ===
  { key: 'archer_doubleTap', unitType: 'archer', name: 'Double Tap', icon: '🎯',
    maxLevel: 2, description: ['10% double shot', '20% double shot'],
    baseCost: 5, costScaling: 1.5, costs: [6, 12] },
  { key: 'archer_eagleEye', unitType: 'archer', name: 'Eagle Eye', icon: '🦅',
    maxLevel: 3, description: ['+5 range', '+10 range', '+15 range'],
    baseCost: 2, costScaling: 1.3, costs: [3, 6, 10] },
  { key: 'archer_rations', unitType: 'archer', name: 'Rations', icon: '🍖',
    maxLevel: Infinity, description: ['+5% HP', '+10% HP', '+15% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% HP`,
    baseCost: 3, costScaling: 1.3, costs: [1, 3, 5] },
  { key: 'archer_keenEdge', unitType: 'archer', name: 'Keen Edge', icon: '⚔️',
    maxLevel: Infinity, description: ['+5% damage', '+10% damage', '+15% damage'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% damage`,
    baseCost: 3, costScaling: 1.3, costs: [1, 3, 5] },
  { key: 'archer_leatherwork', unitType: 'archer', name: 'Leatherwork', icon: '🧥',
    maxLevel: 2, description: ['+1 defense', '+2 defense'],
    baseCost: 3, costScaling: 1.4, costs: [3, 6] },
  { key: 'archer_distance', unitType: 'archer', name: 'Distance', icon: '💨',
    maxLevel: 1, description: ['20% dodge, leap back'],
    baseCost: 7, costScaling: 1, costs: [12] },
  { key: 'archer_aiming', unitType: 'archer', name: 'Aiming', icon: '🎯',
    maxLevel: 1, description: ['+1% dmg/sec standing still'],
    baseCost: 5, costScaling: 1, costs: [6] },
  { key: 'archer_overwatch', unitType: 'archer', name: 'Overwatch', icon: '🏹',
    maxLevel: 1, description: ['Arc over frontline to target enemy ranged units'],
    baseCost: 8, costScaling: 1, costs: [8] },

  // === KNIGHT ===
  { key: 'knight_ironclad', unitType: 'knight', name: 'Ironclad', icon: '🏰',
    maxLevel: Infinity, description: ['+10% HP', '+20% HP', '+30% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 10}% HP`,
    baseCost: 2, costScaling: 1.3 },
  { key: 'knight_heavyPlating', unitType: 'knight', name: 'Heavy Plating', icon: '🛡️',
    maxLevel: 3, description: ['+1 defense', '+2 defense', '+3 defense'],
    baseCost: 2, costScaling: 1.3 },
  { key: 'knight_bulwark', unitType: 'knight', name: 'Bulwark', icon: '🧱',
    maxLevel: 1, description: ['Absorb all attacks 0.5s every 10s'],
    baseCost: 7, costScaling: 1 },
  { key: 'knight_standFirm', unitType: 'knight', name: 'Stand Firm & Resist', icon: '🦶',
    maxLevel: 2, description: ['KB immune, +5% dmg', 'KB immune, +10% dmg'],
    baseCost: 4, costScaling: 1.5 },
  { key: 'knight_betterBoots', unitType: 'knight', name: 'Better Boots', icon: '👢',
    maxLevel: 1, description: ['+0.15 move speed'],
    baseCost: 3, costScaling: 1 },
  { key: 'knight_giant', unitType: 'knight', name: 'Giant', icon: '🗿',
    maxLevel: 2, description: ['1% giant chance', '2% giant chance'],
    baseCost: 5, costScaling: 1.5 },
  { key: 'knight_tempered', unitType: 'knight', name: 'Tempered', icon: '❤️‍🩹',
    maxLevel: 1, description: ['Regen 1% HP/sec'],
    baseCost: 7, costScaling: 1 },

  // === HALBERD ===
  { key: 'halberd_rations', unitType: 'halberd', name: 'Rations', icon: '🍖',
    maxLevel: Infinity, description: ['+5% HP', '+10% HP', '+15% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% HP`,
    baseCost: 2, costScaling: 1.3 },
  { key: 'halberd_keenEdge', unitType: 'halberd', name: 'Keen Edge', icon: '⚔️',
    maxLevel: Infinity, description: ['+5% damage', '+10% damage', '+15% damage'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% damage`,
    baseCost: 1, costScaling: 1.3 },
  { key: 'halberd_hardening', unitType: 'halberd', name: 'Hardening', icon: '🛡️',
    maxLevel: 2, description: ['+1 defense', '+2 defense'],
    baseCost: 3, costScaling: 1.4 },
  { key: 'halberd_reach', unitType: 'halberd', name: 'Reach', icon: '📏',
    maxLevel: 2, description: ['+5 range', '+10 range'],
    baseCost: 3, costScaling: 1.3 },
  { key: 'halberd_betterBoots', unitType: 'halberd', name: 'Better Boots', icon: '👢',
    maxLevel: 1, description: ['+0.1 move speed'],
    baseCost: 3, costScaling: 1 },
  { key: 'halberd_wideSweep', unitType: 'halberd', name: 'Wide Sweep', icon: '🌀',
    maxLevel: 2, description: ['+10 cleave radius', '+20 cleave radius'],
    baseCost: 5, costScaling: 1.5 },
  { key: 'halberd_impale', unitType: 'halberd', name: 'Impale', icon: '🔱',
    maxLevel: 2, description: ['15% chance +100% dmg', '30% chance +100% dmg'],
    baseCost: 5, costScaling: 1.5 },

  // === APPRENTICE ===
  { key: 'wizard_shield', unitType: 'wizard', name: 'Shield', icon: '🔮',
    maxLevel: 1, description: ['Absorbs first attack'],
    baseCost: 5, costScaling: 1 },
  { key: 'wizard_elemental', unitType: 'wizard', name: 'Elemental', icon: '🔥',
    maxLevel: 1, description: ['Burn: 1% max HP/sec for 6s'],
    baseCost: 7, costScaling: 1 },
  { key: 'wizard_teaBiscuits', unitType: 'wizard', name: 'Tea & Biscuits', icon: '🍵',
    maxLevel: Infinity, description: ['+15% HP', '+30% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 15}% HP`,
    baseCost: 3, costScaling: 1.4 },
  { key: 'wizard_mastery', unitType: 'wizard', name: 'Mastery', icon: '📖',
    maxLevel: Infinity, description: ['+10% damage', '+20% damage', '+30% damage'],
    descriptionFn: (lv) => `+${(lv + 1) * 10}% damage`,
    baseCost: 1, costScaling: 1.3 },
  { key: 'wizard_discipline', unitType: 'wizard', name: 'Discipline', icon: '⏱️',
    maxLevel: 2, description: ['10% faster attacks', '20% faster attacks'],
    baseCost: 3, costScaling: 1.4 },
  { key: 'wizard_manaTap', unitType: 'wizard', name: 'Mana Tap', icon: '💥',
    maxLevel: 2, description: ['1% fireball on attack', '2% fireball on attack'],
    baseCost: 5, costScaling: 1.5 },
  { key: 'wizard_walkingStick', unitType: 'wizard', name: 'Walking Stick', icon: '🪄',
    maxLevel: 1, description: ['+0.15 move speed'],
    baseCost: 3, costScaling: 1 },

  // === CLERIC ===
  { key: 'cleric_mending', unitType: 'cleric', name: 'Mending', icon: '💚',
    maxLevel: 3, description: ['+5% healing', '+10% healing', '+15% healing'],
    baseCost: 1, costScaling: 1.3 },
  { key: 'cleric_holyVestments', unitType: 'cleric', name: 'Holy Vestments', icon: '👗',
    maxLevel: Infinity, description: ['+10% HP', '+20% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 10}% HP`,
    baseCost: 3, costScaling: 1.4 },
  { key: 'cleric_blessing', unitType: 'cleric', name: 'Blessing', icon: '✨',
    maxLevel: 2, description: ['1% atk speed buff on heal', '2% atk speed buff on heal'],
    baseCost: 4, costScaling: 1.5 },
  { key: 'cleric_devotion', unitType: 'cleric', name: 'Devotion', icon: '🙏',
    maxLevel: 1, description: ['+5 range'],
    baseCost: 3, costScaling: 1 },
  { key: 'cleric_massResurrect', unitType: 'cleric', name: 'Mass Resurrect', icon: '⚡',
    maxLevel: 1, description: ['1% chance to resurrect all dead'],
    baseCost: 10, costScaling: 1 },
  { key: 'cleric_betterSandals', unitType: 'cleric', name: 'Better Sandals', icon: '👡',
    maxLevel: 1, description: ['+0.1 move speed'],
    baseCost: 3, costScaling: 1 },
  { key: 'cleric_groupHeal', unitType: 'cleric', name: 'Group Heal', icon: '💖',
    maxLevel: 2, description: ['1% AOE heal in 30 radius', '2% AOE heal in 30 radius'],
    baseCost: 5, costScaling: 1.5 },

  // === CONJURER ===
  { key: 'conjurer_crystalResonance', unitType: 'conjurer', name: 'Crystal Resonance', icon: '💎',
    maxLevel: Infinity, description: ['+5% damage', '+10% damage', '+15% damage'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% damage`,
    baseCost: 2, costScaling: 1.3, costs: [1, 2, 3] },
  { key: 'conjurer_hardenedLattice', unitType: 'conjurer', name: 'Hardened Lattice', icon: '🪨',
    maxLevel: Infinity, description: ['+5% HP', '+10% HP', '+15% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% HP`,
    baseCost: 2, costScaling: 1.3, costs: [1, 2, 3] },
  { key: 'conjurer_sustainedChannel', unitType: 'conjurer', name: 'Sustained Channel', icon: '⏳',
    maxLevel: 2, description: ['+3s turret lifetime', '+6s turret lifetime'],
    baseCost: 5, costScaling: 1.5, costs: [5, 10] },
  { key: 'conjurer_rapidConjuring', unitType: 'conjurer', name: 'Rapid Conjuring', icon: '⚡',
    maxLevel: 2, description: ['8% faster placement', '16% faster placement'],
    baseCost: 5, costScaling: 1.5, costs: [5, 10] },
  { key: 'conjurer_crystalArray', unitType: 'conjurer', name: 'Crystal Array', icon: '🔷',
    maxLevel: 2, description: ['+1 max turret (4)', '+2 max turrets (5)'],
    baseCost: 15, costScaling: 2.0, costs: [15, 30] },
  { key: 'conjurer_arcaneAttunement', unitType: 'conjurer', name: 'Arcane Attunement', icon: '🔮',
    maxLevel: 3, description: ['6% turret atk speed', '12% turret atk speed', '18% turret atk speed'],
    baseCost: 2, costScaling: 1.4, costs: [2, 4, 6] },
  { key: 'conjurer_prismaticShards', unitType: 'conjurer', name: 'Prismatic Shards', icon: '✨',
    maxLevel: 1, description: ['Turret attacks mark enemies (+30% dmg, 3s)'],
    baseCost: 12, costScaling: 1, costs: [12] },

  // === BOMBARD ===
  { key: 'bombard_refinedPowder', unitType: 'bombard', name: 'Refined Powder', icon: '💥',
    maxLevel: Infinity, description: ['+5 damage', '+10 damage', '+15 damage'],
    descriptionFn: (lv) => `+${(lv + 1) * 5} damage`,
    baseCost: 2, costScaling: 1.3, costs: [1, 2, 3] },
  { key: 'bombard_rations', unitType: 'bombard', name: 'Rations', icon: '🍖',
    maxLevel: Infinity, description: ['+5% HP', '+10% HP', '+15% HP'],
    descriptionFn: (lv) => `+${(lv + 1) * 5}% HP`,
    baseCost: 2, costScaling: 1.3, costs: [1, 2, 3] },
  { key: 'bombard_betterBarrel', unitType: 'bombard', name: 'Better Barrel', icon: '📏',
    maxLevel: 3, description: ['+10 range', '+20 range', '+30 range'],
    baseCost: 2, costScaling: 1.3, costs: [2, 4, 6] },
  { key: 'bombard_gear', unitType: 'bombard', name: 'Gear', icon: '🛡️',
    maxLevel: 2, description: ['+2 defense', '+4 defense'],
    baseCost: 3, costScaling: 1.4, costs: [3, 6] },
  { key: 'bombard_backpack', unitType: 'bombard', name: 'Backpack', icon: '🎒',
    maxLevel: 1, description: ['+0.05 move speed'],
    baseCost: 3, costScaling: 1, costs: [3] },
  { key: 'bombard_blastRadius', unitType: 'bombard', name: 'Blast Radius', icon: '🔥',
    maxLevel: 3, description: ['+4px splash', '+8px splash', '+12px splash'],
    baseCost: 2, costScaling: 1.3, costs: [2, 4, 6] },
  { key: 'bombard_shrapnel', unitType: 'bombard', name: 'Shrapnel', icon: '🩸',
    maxLevel: 1, description: ['50% chance to bleed all hit'],
    baseCost: 8, costScaling: 1, costs: [8] },
];

export function getUpgradesForUnit(unitType: string): ShardUpgradeDef[] {
  return SHARD_UPGRADES.filter(u => u.unitType === unitType);
}

export function shardUpgradeCost(def: ShardUpgradeDef, currentLevel: number): number {
  if (currentLevel >= def.maxLevel) return Infinity;
  if (def.costs && currentLevel < def.costs.length) return def.costs[currentLevel];
  if (!isFinite(def.maxLevel)) return def.baseCost + currentLevel;
  return Math.ceil(def.baseCost * Math.pow(def.costScaling, currentLevel));
}

export function createEmptyShardUpgrades(): ShardUpgrades {
  const result: Record<string, number> = {};
  for (const def of SHARD_UPGRADES) {
    result[def.key] = 0;
  }
  return result as ShardUpgrades;
}

export function mergeShardUpgrades(saved: Record<string, number> | undefined): ShardUpgrades {
  const fresh = createEmptyShardUpgrades();
  if (!saved) return fresh;
  for (const key of Object.keys(fresh)) {
    if (key in saved && typeof saved[key] === 'number') {
      (fresh as Record<string, number>)[key] = saved[key];
    }
  }
  return fresh;
}

export const UNIT_ICONS: Record<string, string> = {
  soldier: '🗡️',
  archer: '🏹',
  halberd: '🔱',
  knight: '🛡️',
  wizard: '🧙',
  cleric: '⛪',
  conjurer: '🔷',
  bombard: '💣',
};
