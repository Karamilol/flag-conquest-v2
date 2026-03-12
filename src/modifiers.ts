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

// ── Allegiance Shrines ──────────────────────────────────────────────
//
// Each shrine is dedicated to a unit type. Three options:
//   break — desecrate the shrine, debuff that unit, buff others
//   small — offer gold, moderate buff to that unit
//   big   — offer gems, small buff + powerful unique mechanic
//
// chosenShrine format: "unitType:choice" e.g. "soldier:break", "archer:big"

export interface ShrineOption {
  id: 'break' | 'small' | 'big';
  label: string;
  description: string;
  cost?: { type: 'gold' | 'gems'; amount: number };
}

export interface ShrineDef {
  unitType: string;
  name: string;
  icon: string;
  lore: string;
  options: ShrineOption[];
}

export const SHRINE_DEFS: ShrineDef[] = [
  {
    unitType: 'soldier', name: "Soldier's Monument", icon: '⚔️',
    lore: 'A weathered monument stands tall, honoring the nameless soldiers who held the line. Their spirit lingers here still.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Soldiers lose 50% HP & damage. Ranged and magic units gain +10% HP & damage.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Soldiers gain +20% HP and +10% damage.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Soldiers gain +20% HP, +10% damage, and their attacks cleave nearby enemies.', cost: { type: 'gems', amount: 8 } },
    ],
  },
  {
    unitType: 'archer', name: "Ranger's Shrine", icon: '🏹',
    lore: 'Arrows embedded in ancient stone mark this place. The wind still carries the twang of a thousand bowstrings.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Archers fire twice as slow and lose half their range. Melee and magic units attack 8% faster.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Archers gain +40% critical hit damage.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Archers gain +40% crit damage and their arrows pierce through 1 additional enemy.', cost: { type: 'gems', amount: 8 } },
    ],
  },
  {
    unitType: 'halberd', name: "Halberdier's Altar", icon: '🔱',
    lore: 'Crossed halberds stand guard over a crumbling altar. The stone still hums with the resolve of those who fought and fell.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Halberds deal 80% less damage. Ranged and magic units gain a shield that absorbs 1 hit on spawn.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Halberds gain 15% flat damage reduction.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Halberds gain 15% DR and hurl their spear from range, dealing heavy AoE damage.', cost: { type: 'gems', amount: 8 } },
    ],
  },
  {
    unitType: 'knight', name: "Knight's Sepulcher", icon: '🛡️',
    lore: 'A knight in full plate kneels eternally in stone. Even in death, duty endures.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Knights become fragile — lose all defense and 50% of their HP.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Knights gain +20% HP and +0.2 movement speed.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Knights gain +20% HP, +0.2 speed, and charge into battle stunning all enemies hit for 3 seconds.', cost: { type: 'gems', amount: 8 } },
    ],
  },
  {
    unitType: 'wizard', name: "Apprentice's Sanctum", icon: '⚡',
    lore: 'Arcane symbols pulse faintly across cracked stone. The air tastes of ozone and forgotten incantations.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Apprentices become old and frail — 0.2 move speed and lose 50% HP. Ranged and melee units gain +3% crit chance.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Apprentices gain +10% crit chance and +10% attack speed.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Apprentices gain +10% crit chance, +10% attack speed, and fire an arcanist lightning strike every 6 attacks.', cost: { type: 'gems', amount: 8 } },
    ],
  },
  {
    unitType: 'cleric', name: "Cleric's Reliquary", icon: '✝️',
    lore: 'Holy light seeps from cracks in a sealed reliquary. Prayers echo from within, unanswered for centuries.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Clerics lose the ability to heal and can only attack. Melee and ranged allies regenerate 1% HP every 3 seconds.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Clerics gain +50% healing power.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Clerics heal two allies at once. +50% healing power.', cost: { type: 'gems', amount: 8 } },
    ],
  },
  {
    unitType: 'conjurer', name: "Conjurer's Obelisk", icon: '🗿',
    lore: 'A dark obelisk hums with summoning energy. Spectral turrets flicker in and out of existence around its base.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Conjurers can only have 1 turret. Melee and ranged allies gain a 3% chance to strike twice.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Conjurers gain +20% turret spawn speed.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Conjurer turrets float and follow their owner. Conjurer kites back from enemies. +3% turret fire speed per turret alive.', cost: { type: 'gems', amount: 8 } },
    ],
  },
  {
    unitType: 'bombard', name: "Bombard's Crater", icon: '💣',
    lore: 'A smoldering crater marks where a legendary bombard made her last stand. The ground still trembles.',
    options: [
      { id: 'break', label: 'Break the Statue', description: 'Bombard becomes a suicide bomber — runs at enemies and detonates. Magic and melee allies explode on death for 30% max HP.' },
      { id: 'small', label: 'Offer a Small Gift', description: 'Bombard gains +15% attack range.', cost: { type: 'gold', amount: 200 } },
      { id: 'big', label: 'Make a Grand Offering', description: 'Bombard gains +15% range and sometimes launches a mega bomb with 2x damage and AoE.', cost: { type: 'gems', amount: 8 } },
    ],
  },
];

const SHRINE_BY_UNIT = new Map<string, ShrineDef>(SHRINE_DEFS.map(s => [s.unitType, s]));

export function getShrineDef(unitType: string): ShrineDef | undefined {
  return SHRINE_BY_UNIT.get(unitType);
}

/** Parse a chosenShrine string into unit type and choice */
export function parseShrineChoice(chosenShrine: string): { unitType: string; choice: 'break' | 'small' | 'big' } | null {
  const [unitType, choice] = chosenShrine.split(':');
  if (!unitType || !choice) return null;
  return { unitType, choice: choice as 'break' | 'small' | 'big' };
}

/** Unit types that have shrine definitions */
export const SHRINE_UNIT_TYPES = SHRINE_DEFS.map(s => s.unitType);
