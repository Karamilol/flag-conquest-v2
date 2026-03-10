// ── Fractured World: Modifier & Curse Definitions ───────────────────

export interface ModifierDef {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'positive' | 'negative';
  subcategory: 'loot' | 'economy' | 'combat' | 'environment';
  /** If true, this modifier has half weight in the random pool */
  rareWeight?: boolean;
}

export interface CurseDef {
  id: string;
  name: string;
  downside: string;
  reward: string;
  icon: string;
}

// ── Positive Modifiers (23) ─────────────────────────────────────────

export const ALL_POSITIVE: ModifierDef[] = [
  // Loot
  { id: 'shardVeins', name: 'Shard Veins', description: 'Boss grants +2 additional shards', icon: '🔮', category: 'positive', subcategory: 'loot' },
  { id: 'relicFavor', name: 'Relic Favor', description: 'Boss drops an additional relic chest', icon: '🏺', category: 'positive', subcategory: 'loot' },
  { id: 'artifactCache', name: 'Artifact Cache', description: 'Boss drops an additional artifact chest', icon: '✨', category: 'positive', subcategory: 'loot' },
  { id: 'bountifulChoice', name: 'Bountiful Choice', description: '+1 choice for artifact and relic pickers', icon: '🎁', category: 'positive', subcategory: 'loot' },
  { id: 'wealthyBoss', name: 'Wealthy Boss', description: 'Boss drops 50% more gems', icon: '💎', category: 'positive', subcategory: 'loot' },
  { id: 'craftsmanship', name: 'Craftsmanship', description: 'Regalia drops are at least rare', icon: '👑', category: 'positive', subcategory: 'loot' },
  // Economy
  { id: 'goldenFields', name: 'Golden Fields', description: '+15% passive income', icon: '🌾', category: 'positive', subcategory: 'economy' },
  { id: 'richFoes', name: 'Rich Foes', description: '+30% gold from kills', icon: '💰', category: 'positive', subcategory: 'economy' },
  { id: 'logistics', name: 'Logistics', description: '-10% economy upgrade costs', icon: '📦', category: 'positive', subcategory: 'economy' },
  { id: 'qualityMaterials', name: 'Quality Materials', description: '-10% unit upgrade costs', icon: '🔧', category: 'positive', subcategory: 'economy' },
  { id: 'goldStash', name: 'Gold Stash', description: 'Start zone with bonus gold', icon: '🏦', category: 'positive', subcategory: 'economy' },
  // Combat
  { id: 'veteranArmy', name: 'Veteran Army', description: 'All allies +10% HP and DMG', icon: '⚔️', category: 'positive', subcategory: 'combat' },
  { id: 'swiftDeploy', name: 'Swift Deploy', description: '-25% unit respawn time', icon: '⏱️', category: 'positive', subcategory: 'combat' },
  { id: 'thinHerd', name: 'Thin Herd', description: '-10% enemy spawn rate', icon: '🏜️', category: 'positive', subcategory: 'combat' },
  { id: 'frailFoes', name: 'Frail Foes', description: 'Enemies have -10% HP', icon: '💀', category: 'positive', subcategory: 'combat' },
  { id: 'manaPools', name: 'Mana Pools', description: 'Magic users +20% damage', icon: '🔵', category: 'positive', subcategory: 'combat' },
  { id: 'wroughtSteel', name: 'Wrought Steel', description: 'Melee users +20% damage', icon: '🗡️', category: 'positive', subcategory: 'combat' },
  { id: 'empoweredShots', name: 'Empowered Shots', description: 'Ranged users +20% damage', icon: '🏹', category: 'positive', subcategory: 'combat' },
  { id: 'herosVoice', name: "Hero's Voice", description: 'Hero is 30% stronger', icon: '📣', category: 'positive', subcategory: 'combat' },
  { id: 'conditioning', name: 'Conditioning', description: 'All allies +2 defense', icon: '🛡️', category: 'positive', subcategory: 'combat' },
  // Environment
  { id: 'healingWells', name: 'Healing Wells', description: 'All units gain 1% HP/sec', icon: '⛲', category: 'positive', subcategory: 'environment' },
  { id: 'freshRecruits', name: 'Lost In The Void', description: '1 random unit joins you this zone', icon: '👤', category: 'positive', subcategory: 'environment' },
  { id: 'guaranteedDungeon', name: 'Dungeon Gate', description: 'Guaranteed dungeon portal spawn', icon: '🟣', category: 'positive', subcategory: 'environment' },
];

// ── Negative Modifiers (23) ─────────────────────────────────────────

export const ALL_NEGATIVE: ModifierDef[] = [
  // Loot
  { id: 'barrenLand', name: 'Barren Land', description: 'No chests drop from monsters', icon: '🚫', category: 'negative', subcategory: 'loot' },
  { id: 'cursedRelics', name: 'Cursed Relics', description: 'Only 1 relic choice', icon: '🏺', category: 'negative', subcategory: 'loot' },
  { id: 'slimPickings', name: 'Slim Pickings', description: 'Only 1 artifact choice', icon: '📉', category: 'negative', subcategory: 'loot' },
  { id: 'tarnished', name: 'Tarnished', description: 'Regalia rarity biased toward common', icon: '🪙', category: 'negative', subcategory: 'loot' },
  { id: 'poorBosses', name: 'Poor Bosses', description: 'No gems or shards from boss', icon: '💸', category: 'negative', subcategory: 'loot' },
  { id: 'brokenSupplyLines', name: 'Broken Supply Lines', description: 'No consumable drops', icon: '📭', category: 'negative', subcategory: 'loot' },
  // Combat
  { id: 'armoredFoes', name: 'Armored Foes', description: 'Enemies take 5% less damage', icon: '🛡️', category: 'negative', subcategory: 'combat' },
  { id: 'swarm', name: 'Swarm', description: '+30% enemy spawn rate', icon: '🐝', category: 'negative', subcategory: 'combat' },
  { id: 'enraged', name: 'Enraged', description: 'Enemies +10% DMG and +10% speed', icon: '😡', category: 'negative', subcategory: 'combat' },
  { id: 'strongWilledBoss', name: 'Strong Willed Boss', description: 'Boss has +50% HP', icon: '💪', category: 'negative', subcategory: 'combat' },
  { id: 'noRespite', name: 'No Respite', description: 'Unit respawn time +30%', icon: '⏳', category: 'negative', subcategory: 'combat' },
  { id: 'dampening', name: 'Dampening', description: 'Magic users -20% damage', icon: '🔇', category: 'negative', subcategory: 'combat' },
  { id: 'suppressedHero', name: 'Suppressed Hero', description: 'Hero deals 50% less damage', icon: '⬇️', category: 'negative', subcategory: 'combat' },
  // Economy
  { id: 'goldDrought', name: 'Gold Drought', description: '-50% gold from kills', icon: '🏚️', category: 'negative', subcategory: 'economy' },
  { id: 'inflation', name: 'Inflation', description: '+15% upgrade costs', icon: '📈', category: 'negative', subcategory: 'economy' },
  { id: 'taxCollector', name: 'Tax Collector', description: 'Lose all gold on zone entry', icon: '🏛️', category: 'negative', subcategory: 'economy' },
  { id: 'expensiveLabor', name: 'Expensive Labor', description: 'Unit roll cost +20%', icon: '🪙', category: 'negative', subcategory: 'economy' },
  // Environment
  { id: 'forgottenLand', name: 'Forgotten Land', description: 'No buildings spawn in this zone', icon: '🏚️', category: 'negative', subcategory: 'environment' },
  { id: 'denseFog', name: 'Dense Fog', description: 'All units -30% range', icon: '🌫️', category: 'negative', subcategory: 'environment' },
  { id: 'corruption', name: 'Corruption', description: 'Allies lose 0.5% max HP/sec', icon: '☠️', category: 'negative', subcategory: 'environment' },
  { id: 'unstableGround', name: 'Unstable Ground', description: 'All movement speed -10%', icon: '🌋', category: 'negative', subcategory: 'environment' },
  { id: 'unstablePortal', name: 'Unstable Portal', description: 'Units spawn with 15% HP missing', icon: '🌀', category: 'negative', subcategory: 'environment' },
  { id: 'flankers', name: 'Flankers', description: 'Hound spawns bring 2 extra', icon: '🐺', category: 'negative', subcategory: 'environment' },
  { id: 'sharpshooters', name: 'Sharpshooters', description: 'Enemy archers +30% range, +15% DMG', icon: '🎯', category: 'negative', subcategory: 'environment' },
  { id: 'soothingCorruption', name: 'Soothing Corruption', description: 'Enemies regen 1% HP/sec', icon: '💚', category: 'negative', subcategory: 'environment' },
  { id: 'strongWinds', name: 'Strong Winds', description: 'Ally ranged units -20% range', icon: '🌬️', category: 'negative', subcategory: 'environment' },
];

// ── Curses (6) ──────────────────────────────────────────────────────

export const CURSES: CurseDef[] = [
  { id: 'duelistsOath', name: "Duelist's Oath", downside: 'No allies — hero has 2x stats + attack speed', reward: '+10% hero attack speed for rest of run', icon: '⚔️' },
  { id: 'voidTouched', name: 'Void Touched', downside: 'Healing reduced by 99%', reward: 'All healing +30% for rest of run', icon: '🌑' },
  { id: 'colosseum', name: 'Colosseum', downside: 'Enemies 4x HP, 1.5x ATK, half spawn rate', reward: '1% giant spawn chance for rest of run', icon: '🏟️' },
  { id: 'hordeMode', name: 'Horde Mode', downside: '5x enemy spawn rate, enemies -20% HP', reward: '-25% ally respawn time for rest of run', icon: '🧟' },
  { id: 'embargo', name: 'Embargo', downside: 'No chests, no kill gold, 1.5x passive income', reward: '+10% all gold income for rest of run', icon: '🚢' },
  { id: 'martyrdom', name: 'Martyrdom', downside: 'Ally deaths AoE 10% max HP to all nearby', reward: 'Enemy deaths detonate for 3% max HP for rest of run', icon: '💥' },
];

// ── Lookup helpers ──────────────────────────────────────────────────

const ALL_MODIFIERS = [...ALL_POSITIVE, ...ALL_NEGATIVE];
const MOD_BY_ID = new Map<string, ModifierDef>(ALL_MODIFIERS.map(m => [m.id, m]));
const CURSE_BY_ID = new Map<string, CurseDef>(CURSES.map(c => [c.id, c]));

export function getModifierDef(id: string): ModifierDef | undefined {
  return MOD_BY_ID.get(id);
}

export function getCurseDef(id: string): CurseDef | undefined {
  return CURSE_BY_ID.get(id);
}
