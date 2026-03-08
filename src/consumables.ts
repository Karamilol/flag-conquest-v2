import type { ConsumableId, Backpack } from './types';

export type ConsumableUsage = 'midRun' | 'preRun';

export interface ConsumableDef {
  id: ConsumableId;
  name: string;
  icon: string;
  desc: string;
  usage: ConsumableUsage;
  maxStack: number;
}

export const CONSUMABLE_DEFS: ConsumableDef[] = [
  {
    id: 'healingPotion',
    name: 'Healing Potion',
    icon: '\u{1F9EA}',
    desc: 'Heals hero for 60% of max HP',
    usage: 'midRun',
    maxStack: 99,
  },
  {
    id: 'rerollVoucher',
    name: 'Reroll Voucher',
    icon: '\u{1F3B0}',
    desc: 'Grants 1 free reroll when rolling for units',
    usage: 'midRun',
    maxStack: 99,
  },
  {
    id: 'artifactKey',
    name: 'Artifact Key',
    icon: '\u{1F5DD}\uFE0F',
    desc: 'Consume to spawn an Artifact Dungeon portal',
    usage: 'midRun',
    maxStack: 99,
  },
  {
    id: 'regaliaKey',
    name: 'Regalia Key',
    icon: '\u{1F511}',
    desc: 'Consume to spawn a Regalia Dungeon portal',
    usage: 'midRun',
    maxStack: 99,
  },
  {
    id: 'challengeKey',
    name: 'Challenge Key',
    icon: '\u{1F525}',
    desc: 'Used to start a Challenge Run',
    usage: 'preRun',
    maxStack: 99,
  },
];

export function getConsumableDef(id: ConsumableId): ConsumableDef {
  return CONSUMABLE_DEFS.find(c => c.id === id)!;
}

export function emptyBackpack(): Backpack {
  return { healingPotion: 0, rerollVoucher: 0, artifactKey: 0, regaliaKey: 0, challengeKey: 0 };
}

export function totalConsumables(backpack: Backpack): number {
  return Object.values(backpack).reduce((sum, n) => sum + n, 0);
}

// ---- Boss Loot Table ----

interface LootEntry {
  id: ConsumableId;
  weight: number;
}

const BOSS_LOOT_TABLE: LootEntry[] = [
  { id: 'healingPotion', weight: 40 },
  { id: 'rerollVoucher', weight: 30 },
  { id: 'artifactKey', weight: 20 },
  { id: 'regaliaKey', weight: 15 },
  { id: 'challengeKey', weight: 10 },
];

/**
 * Roll for a consumable drop from boss kill.
 * @param dropChance probability [0,1] that something drops (e.g., 0.80 = 80%)
 * @param dungeonUnlocked if false, dungeon keys excluded from pool
 */
export function rollBossConsumable(dropChance: number, dungeonUnlocked: boolean): ConsumableId | null {
  if (Math.random() >= dropChance) return null;

  const pool = dungeonUnlocked
    ? BOSS_LOOT_TABLE
    : BOSS_LOOT_TABLE.filter(e => e.id !== 'artifactKey' && e.id !== 'regaliaKey');
  const totalW = pool.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * totalW;
  for (const entry of pool) {
    roll -= entry.weight;
    if (roll <= 0) return entry.id;
  }
  return pool[pool.length - 1].id;
}

/** Roll for a consumable from an item chest (always drops). */
export function rollChestConsumable(dungeonUnlocked: boolean): ConsumableId {
  return rollBossConsumable(1.0, dungeonUnlocked)!;
}
