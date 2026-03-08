// ---- Artifact System: 42 Artifacts in 21 Synergy Pairs ----

export type ArtifactCategory = 'unit' | 'archetype' | 'hero' | 'army' | 'economy';
export type ArtifactRarity = 'common' | 'rare' | 'legendary';

export interface ArtifactDef {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: ArtifactRarity;
  category: ArtifactCategory;
  pairId: string;
  slot: 'A' | 'B';
  requiresUnit?: string;
  requiresArchetype?: 'melee' | 'ranged' | 'magic';
  requiresIncomeTier?: string;
}

export interface SynergyPairDef {
  id: string;
  name: string;
  artifactA: string;
  artifactB: string;
  synergyName: string;
  synergyDesc: string;
  category: ArtifactCategory;
}

// ---- 42 Artifact Definitions ----

export const ARTIFACT_DEFS: ArtifactDef[] = [
  // ======== UNIT-SPECIFIC (6 pairs) ========

  // Pair 1: Soldier
  { id: 'hasteborn', name: 'Hasteborn', desc: 'Soldiers respawn 25% faster', icon: '\u{1F3C3}',
    rarity: 'common', category: 'unit', pairId: 'soldierPair', slot: 'A', requiresUnit: 'soldier' },
  { id: 'reinforced', name: 'Reinforced', desc: 'Soldiers gain +20% HP', icon: '\u{1F6E1}\uFE0F',
    rarity: 'common', category: 'unit', pairId: 'soldierPair', slot: 'B', requiresUnit: 'soldier' },

  // Pair 2: Knight
  { id: 'unyielding', name: 'Unyielding', desc: 'Knights gain 5% of their missing HP every 3 seconds', icon: '\u{2764}\uFE0F\u200D\u{1FA79}',
    rarity: 'rare', category: 'unit', pairId: 'knightPair', slot: 'A', requiresUnit: 'knight' },
  { id: 'depthOfAttack', name: 'Depth of Attack', desc: 'Knight attacks become AOE, hitting all targets', icon: '\u{1F300}',
    rarity: 'rare', category: 'unit', pairId: 'knightPair', slot: 'B', requiresUnit: 'knight' },

  // Pair 3: Halberd
  { id: 'firstStrike', name: 'First Strike', desc: 'Halberd attacks its first enemy 2 times', icon: '\u{2694}\uFE0F',
    rarity: 'rare', category: 'unit', pairId: 'halberdPair', slot: 'A', requiresUnit: 'halberd' },
  { id: 'linebreak', name: 'Linebreak', desc: 'Halberd attacks slow enemies by 20% for 8 seconds', icon: '\u{1F9CA}',
    rarity: 'common', category: 'unit', pairId: 'halberdPair', slot: 'B', requiresUnit: 'halberd' },

  // Pair 4: Archer
  { id: 'serratedTips', name: 'Serrated Tips', desc: 'Arrows have a 30% chance to deal double damage', icon: '\u{1F4A2}',
    rarity: 'rare', category: 'unit', pairId: 'archerPair', slot: 'A', requiresUnit: 'archer' },
  { id: 'quickdraw', name: 'Quickdraw', desc: 'Removes archer wind-up time', icon: '\u{1F3AF}',
    rarity: 'common', category: 'unit', pairId: 'archerPair', slot: 'B', requiresUnit: 'archer' },

  // Pair 5: Apprentice (wizard)
  { id: 'fireRunes', name: 'Fire Runes', desc: '20% chance to cast a fireball AOE for 1.5x damage', icon: '\u{1F525}',
    rarity: 'legendary', category: 'unit', pairId: 'wizardPair', slot: 'A', requiresUnit: 'wizard' },
  { id: 'manaCrystal', name: 'Mana Crystal', desc: 'Increases wizard attack speed by 8%', icon: '\u{1F48E}',
    rarity: 'common', category: 'unit', pairId: 'wizardPair', slot: 'B', requiresUnit: 'wizard' },

  // Pair 6: Cleric
  { id: 'echoedBlessing', name: 'Echoed Blessing', desc: '25% chance for heal to chain to the nearest ally', icon: '\u{1F4AB}',
    rarity: 'rare', category: 'unit', pairId: 'clericPair', slot: 'A', requiresUnit: 'cleric' },
  { id: 'protection', name: 'Protection', desc: '25% chance on heal to grant 40% damage reduction for 3s', icon: '\u{1F31F}',
    rarity: 'legendary', category: 'unit', pairId: 'clericPair', slot: 'B', requiresUnit: 'cleric' },

  // Pair 7: Conjurer
  { id: 'crystalLattice', name: 'Crystal Lattice', desc: 'Turrets gain +15% attack speed', icon: '\u{1F537}',
    rarity: 'rare', category: 'unit', pairId: 'conjurerPair', slot: 'A', requiresUnit: 'conjurer' },
  { id: 'resonantCore', name: 'Resonant Core', desc: 'Turret duration extended by 25%', icon: '\u{1F48E}',
    rarity: 'common', category: 'unit', pairId: 'conjurerPair', slot: 'B', requiresUnit: 'conjurer' },

  // Pair 8: Bombard
  { id: 'incendiaryShells', name: 'Incendiary Shells', desc: 'Bombard shots have 25% chance to ignite enemies for 3s', icon: '\u{1F525}',
    rarity: 'rare', category: 'unit', pairId: 'bombardPair', slot: 'A', requiresUnit: 'bombard' },
  { id: 'reinforcedBarrel', name: 'Reinforced Barrel', desc: 'Bombard gains +15% attack range', icon: '\u{1F52B}',
    rarity: 'common', category: 'unit', pairId: 'bombardPair', slot: 'B', requiresUnit: 'bombard' },

  // ======== ARCHETYPE-WIDE (3 pairs) ========

  // Pair 7: Melee archetype
  { id: 'endurance', name: 'Endurance', desc: 'Melee units gain +1 defense', icon: '\u{1F9BE}',
    rarity: 'common', category: 'archetype', pairId: 'meleePair', slot: 'A', requiresArchetype: 'melee' },
  { id: 'trainingManual', name: 'Training Manual', desc: 'Melee units gain +2 damage', icon: '\u{1F4D6}',
    rarity: 'common', category: 'archetype', pairId: 'meleePair', slot: 'B', requiresArchetype: 'melee' },

  // Pair 8: Ranged archetype
  { id: 'steadyFormation', name: 'Steady Formation', desc: 'Ranged units standing still for 1.5s gain +8% damage and damage reduction', icon: '\u{1F9CD}',
    rarity: 'rare', category: 'archetype', pairId: 'rangedPair', slot: 'A', requiresArchetype: 'ranged' },
  { id: 'observation', name: 'Observation', desc: 'Ranged units deal 10% more damage to targets over 100px away', icon: '\u{1F52D}',
    rarity: 'common', category: 'archetype', pairId: 'rangedPair', slot: 'B', requiresArchetype: 'ranged' },

  // Pair 9: Mage archetype
  { id: 'manaShield', name: 'Mana Shield', desc: 'First hit a magic user takes every 6s is reduced by 80%', icon: '\u{1F6E1}\uFE0F',
    rarity: 'legendary', category: 'archetype', pairId: 'magePair', slot: 'A', requiresArchetype: 'magic' },
  { id: 'channeledEnergy', name: 'Channeled Energy', desc: '3% chance to cause a nearby magic user to cast instantly', icon: '\u{26A1}',
    rarity: 'rare', category: 'archetype', pairId: 'magePair', slot: 'B', requiresArchetype: 'magic' },

  // ======== HERO (2 pairs) ========

  // Pair 10: Hero 1
  { id: 'regeneration', name: 'Regeneration', desc: 'Hero heals 2% max HP per second', icon: '\u{1FA78}',
    rarity: 'rare', category: 'hero', pairId: 'heroPair1', slot: 'A' },
  { id: 'command', name: 'Command', desc: 'Allies within 50px of the hero attack 10% faster', icon: '\u{1F451}',
    rarity: 'rare', category: 'hero', pairId: 'heroPair1', slot: 'B' },

  // Pair 11: Hero 2
  { id: 'riches', name: 'Riches', desc: 'Hero kills have increased chance to drop a consumable chest', icon: '\u{1F4B0}',
    rarity: 'common', category: 'hero', pairId: 'heroPair2', slot: 'A' },
  { id: 'collection', name: 'Collection', desc: 'For every boss defeated, hero gains +3 attack', icon: '\u{1F3C6}',
    rarity: 'common', category: 'hero', pairId: 'heroPair2', slot: 'B' },

  // ======== ARMY-WIDE (2 pairs) ========

  // Pair 12: Army 1
  { id: 'swiftArmy', name: 'Swift Army', desc: 'Allies gain +0.1 movement speed', icon: '\u{26A1}',
    rarity: 'common', category: 'army', pairId: 'armyPair1', slot: 'A' },
  { id: 'rapidDeploy', name: 'Rapid Deploy', desc: 'Spawn timer reduced by 8%', icon: '\u{23F1}\uFE0F',
    rarity: 'rare', category: 'army', pairId: 'armyPair1', slot: 'B' },

  // Pair 13: Army 2
  { id: 'hold', name: 'Hold!', desc: 'When contesting a flag, all allies gain 5% attack speed', icon: '\u{1F4E3}',
    rarity: 'rare', category: 'army', pairId: 'armyPair2', slot: 'A' },
  { id: 'attrition', name: 'Attrition', desc: 'When a boss is active, all units gain +1 defense', icon: '\u{1F9F1}',
    rarity: 'common', category: 'army', pairId: 'armyPair2', slot: 'B' },

  // ======== ECONOMY (8 pairs) ========

  // Pair 14: T1 Hunting Slimes
  { id: 'friendlySlimes', name: 'Friendly Slimes', desc: '1% chance on slime proc to spawn a friendly slime ally', icon: '\u{1F7E2}',
    rarity: 'common', category: 'economy', pairId: 'econPair1', slot: 'A' },
  { id: 'cookedGoo', name: 'Cooked Goo', desc: '+10% hunting slimes speed', icon: '\u{1F372}',
    rarity: 'common', category: 'economy', pairId: 'econPair1', slot: 'B' },

  // Pair 15: T2 Scouting Forests
  { id: 'treasure', name: 'Treasure!', desc: 'Scouting proc has a chance to drop a consumable chest', icon: '\u{1F4E6}',
    rarity: 'rare', category: 'economy', pairId: 'econPair2', slot: 'A', requiresIncomeTier: 'incomeTier2' },
  { id: 'caltrops', name: 'Caltrops', desc: 'Scouting proc: 20% chance enemies spawn at -20% HP for 5s', icon: '\u{1F4CC}',
    rarity: 'rare', category: 'economy', pairId: 'econPair2', slot: 'B', requiresIncomeTier: 'incomeTier2' },

  // Pair 16: T3 Delivering Resources
  { id: 'courier', name: 'Courier', desc: '50% chance courier spawns to collect 5% of gold/min from nearest structure', icon: '\u{1F4E8}',
    rarity: 'rare', category: 'economy', pairId: 'econPair3', slot: 'A', requiresIncomeTier: 'incomeTier3' },
  { id: 'tips', name: 'Tips', desc: '+10% delivering resources payout', icon: '\u{1F4B5}',
    rarity: 'common', category: 'economy', pairId: 'econPair3', slot: 'B', requiresIncomeTier: 'incomeTier3' },

  // Pair 17: T4 Smithing Swords
  { id: 'betterWeapons', name: 'Better Weapons', desc: 'Smithing proc grants melee units & warlord +0.5 damage (max +2/zone)', icon: '\u{1F5E1}\uFE0F',
    rarity: 'legendary', category: 'economy', pairId: 'econPair4', slot: 'A', requiresIncomeTier: 'incomeTier4' },
  { id: 'betterSmithies', name: 'Better Smithies', desc: '+10% smithing swords speed', icon: '\u{1F528}',
    rarity: 'common', category: 'economy', pairId: 'econPair4', slot: 'B', requiresIncomeTier: 'incomeTier4' },

  // Pair 18: T5 Reinforcing Barricades
  { id: 'holdTheLine', name: 'Hold The Line', desc: 'Barricade proc builds a barricade with 6x hero HP at portal (max 1)', icon: '\u{1FAB5}',
    rarity: 'rare', category: 'economy', pairId: 'econPair5', slot: 'A', requiresIncomeTier: 'incomeTier5' },
  { id: 'enhancedWood', name: 'Enhanced Wood', desc: '+10% reinforcing barricades payout', icon: '\u{1FAB5}',
    rarity: 'common', category: 'economy', pairId: 'econPair5', slot: 'B', requiresIncomeTier: 'incomeTier5' },

  // Pair 19: T6 Enchanting Scrolls
  { id: 'empoweredGlyphs', name: 'Empowered Glyphs', desc: 'For 3 min after enchanting proc, magic users gain +8% damage', icon: '\u{1F4DC}',
    rarity: 'rare', category: 'economy', pairId: 'econPair6', slot: 'A', requiresIncomeTier: 'incomeTier6' },
  { id: 'featheredPens', name: 'Feathered Pens', desc: '+10% enchanting scrolls speed', icon: '\u{1F58B}\uFE0F',
    rarity: 'common', category: 'economy', pairId: 'econPair6', slot: 'B', requiresIncomeTier: 'incomeTier6' },

  // Pair 20: T7 Training Militia
  { id: 'warBanner', name: 'War Banner', desc: 'Militia proc spawns 5 soldiers, 3 halberds, and 1 knight', icon: '\u{1F6A9}',
    rarity: 'legendary', category: 'economy', pairId: 'econPair7', slot: 'A', requiresIncomeTier: 'incomeTier7' },
  { id: 'drillSergeant', name: 'Drill Sergeant', desc: '+10% training militia speed', icon: '\u{1FAE1}',
    rarity: 'common', category: 'economy', pairId: 'econPair7', slot: 'B', requiresIncomeTier: 'incomeTier7' },

  // Pair 21: T8 Expanding Territories
  { id: 'tithe', name: 'Tithe', desc: '10% chance an income tier purchase gives 2 levels', icon: '\u{1F4B2}',
    rarity: 'legendary', category: 'economy', pairId: 'econPair8', slot: 'A', requiresIncomeTier: 'incomeTier8' },
  { id: 'decree', name: 'Decree', desc: 'Expanding proc: next unit that dies respawns instantly', icon: '\u{1F4DC}',
    rarity: 'rare', category: 'economy', pairId: 'econPair8', slot: 'B', requiresIncomeTier: 'incomeTier8' },
];

// ---- 21 Synergy Pair Definitions ----

export const SYNERGY_PAIRS: SynergyPairDef[] = [
  // Unit-specific
  { id: 'soldierPair', name: 'Soldier', artifactA: 'hasteborn', artifactB: 'reinforced',
    synergyName: 'Reserve', synergyDesc: '15% chance to spawn a temporary soldier on respawn', category: 'unit' },
  { id: 'knightPair', name: 'Knight', artifactA: 'unyielding', artifactB: 'depthOfAttack',
    synergyName: 'Juggernaut', synergyDesc: 'Per unit within 30px of knight: +1% damage reduction (max 15%)', category: 'unit' },
  { id: 'halberdPair', name: 'Halberd', artifactA: 'firstStrike', artifactB: 'linebreak',
    synergyName: 'Wounded', synergyDesc: 'Enemies slowed by Halberd also attack 20% slower', category: 'unit' },
  { id: 'archerPair', name: 'Archer', artifactA: 'serratedTips', artifactB: 'quickdraw',
    synergyName: 'Rhythm', synergyDesc: '+2% attack speed per arrow for 2s, stacks up to 5 times', category: 'unit' },
  { id: 'wizardPair', name: 'Apprentice', artifactA: 'fireRunes', artifactB: 'manaCrystal',
    synergyName: 'Arcane Tempo', synergyDesc: 'After casting a fireball, next basic attack deals +50% damage', category: 'unit' },
  { id: 'clericPair', name: 'Cleric', artifactA: 'echoedBlessing', artifactB: 'protection',
    synergyName: 'Overflowing Grace', synergyDesc: 'Overheal converts to bonus HP (up to 20% max), decays after 6s', category: 'unit' },
  { id: 'conjurerPair', name: 'Conjurer', artifactA: 'crystalLattice', artifactB: 'resonantCore',
    synergyName: 'Crystalline Network', synergyDesc: 'When a turret expires, it explodes for AOE damage equal to 50% turret max HP', category: 'unit' },
  { id: 'bombardPair', name: 'Bombard', artifactA: 'incendiaryShells', artifactB: 'reinforcedBarrel',
    synergyName: 'Carpet Bombardment', synergyDesc: 'Every 3rd bombard shot fires 2 cannonballs', category: 'unit' },

  // Archetype-wide
  { id: 'meleePair', name: 'Melee', artifactA: 'endurance', artifactB: 'trainingManual',
    synergyName: 'Strike Back', synergyDesc: 'After being hit, next attack within 3s deals +5% damage (stacks 3x)', category: 'archetype' },
  { id: 'rangedPair', name: 'Ranged', artifactA: 'steadyFormation', artifactB: 'observation',
    synergyName: 'Piercing Shots', synergyDesc: '20% chance for attack to chain to a second unit for 50% damage', category: 'archetype' },
  { id: 'magePair', name: 'Mage', artifactA: 'manaShield', artifactB: 'channeledEnergy',
    synergyName: 'Resonance', synergyDesc: 'Enemies within 30px of mages are slowed 50%', category: 'archetype' },

  // Hero
  { id: 'heroPair1', name: 'Hero I', artifactA: 'regeneration', artifactB: 'command',
    synergyName: 'Banner', synergyDesc: 'First attack every 30s drops a banner: 100px radius, 1% HP regen/s + 0.1 speed', category: 'hero' },
  { id: 'heroPair2', name: 'Hero II', artifactA: 'riches', artifactB: 'collection',
    synergyName: 'Momentum', synergyDesc: 'Hero kills grant +0.03 speed +3% attack speed for 5s (stacks 8x)', category: 'hero' },

  // Army-wide
  { id: 'armyPair1', name: 'Army I', artifactA: 'swiftArmy', artifactB: 'rapidDeploy',
    synergyName: 'Vanguard Pressure', synergyDesc: 'Newly spawned units gain +10% damage for 3 seconds', category: 'army' },
  { id: 'armyPair2', name: 'Army II', artifactA: 'hold', artifactB: 'attrition',
    synergyName: 'Preparation', synergyDesc: 'Units in hold mode stack 1% movespeed and attack speed per second (max 10x)', category: 'army' },

  // Economy
  { id: 'econPair1', name: 'Slimes', artifactA: 'friendlySlimes', artifactB: 'cookedGoo',
    synergyName: 'Goonergy', synergyDesc: 'Per friendly slime alive: hero takes 1% less damage (max 30%)', category: 'economy' },
  { id: 'econPair2', name: 'Scouting', artifactA: 'treasure', artifactB: 'caltrops',
    synergyName: 'Looking Ahead', synergyDesc: 'Chest gold and gems increased by 20%', category: 'economy' },
  { id: 'econPair3', name: 'Delivering', artifactA: 'courier', artifactB: 'tips',
    synergyName: 'Make Way', synergyDesc: 'Couriers generate 1% of gold/min when walking past a flag', category: 'economy' },
  { id: 'econPair4', name: 'Smithing', artifactA: 'betterWeapons', artifactB: 'betterSmithies',
    synergyName: "Hero's Edge", synergyDesc: 'Hero auto-throws a dagger every 2s at 200 range for 150% damage', category: 'economy' },
  { id: 'econPair5', name: 'Barricades', artifactA: 'holdTheLine', artifactB: 'enhancedWood',
    synergyName: 'Rally Post', synergyDesc: 'Allies passing through a barricade gain +0.2 movement speed for 2s', category: 'economy' },
  { id: 'econPair6', name: 'Enchanting', artifactA: 'empoweredGlyphs', artifactB: 'featheredPens',
    synergyName: 'Extra Scrolls', synergyDesc: 'Enchanting proc also produces a reroll voucher', category: 'economy' },
  { id: 'econPair7', name: 'Militia', artifactA: 'warBanner', artifactB: 'drillSergeant',
    synergyName: 'Goliath', synergyDesc: 'Melee units have 1% chance to spawn large (3x HP, 1.3x size)', category: 'economy' },
  { id: 'econPair8', name: 'Territories', artifactA: 'tithe', artifactB: 'decree',
    synergyName: 'Expansion', synergyDesc: 'Tithe also applies to unit upgrade purchases', category: 'economy' },
];

// ---- Precomputed Lookups ----

export const ARTIFACT_BY_ID: Record<string, ArtifactDef> =
  Object.fromEntries(ARTIFACT_DEFS.map(a => [a.id, a]));

export const PAIR_BY_ID: Record<string, SynergyPairDef> =
  Object.fromEntries(SYNERGY_PAIRS.map(p => [p.id, p]));

// Quick map: artifact ID -> its partner's ID
export const ARTIFACT_PARTNER: Record<string, string> = {};
for (const pair of SYNERGY_PAIRS) {
  ARTIFACT_PARTNER[pair.artifactA] = pair.artifactB;
  ARTIFACT_PARTNER[pair.artifactB] = pair.artifactA;
}

// ---- Category Display ----

export const CATEGORY_COLORS: Record<ArtifactCategory, string> = {
  unit: '#4a9fff',
  archetype: '#ff8844',
  hero: '#ff4a4a',
  army: '#4aff4a',
  economy: '#ffd700',
};

export const CATEGORY_LABELS: Record<ArtifactCategory, string> = {
  unit: 'UNIT',
  archetype: 'ARCHETYPE',
  hero: 'HERO',
  army: 'ARMY',
  economy: 'ECONOMY',
};

// ---- Eligibility ----

// Which units belong to each archetype
const ARCHETYPE_UNITS: Record<string, string[]> = {
  melee: ['soldier', 'halberd', 'knight'],
  ranged: ['archer', 'bombard'],
  magic: ['wizard', 'cleric', 'conjurer'],
};

export function getEligibleArtifacts(
  unlockedUnits: string[],
  unlockedTiers: Record<string, number>,
  ownedIds: string[],
  disabledUnits?: string[],
): ArtifactDef[] {
  const owned = new Set(ownedIds);
  const disabled = new Set(disabledUnits || []);
  // Active units = unlocked and not disabled
  const activeUnits = unlockedUnits.filter(u => !disabled.has(u));
  return ARTIFACT_DEFS.filter(a => {
    if (owned.has(a.id)) return false;
    if (a.requiresUnit && !activeUnits.includes(a.requiresUnit)) return false;
    if (a.requiresArchetype) {
      const archetypeUnits = ARCHETYPE_UNITS[a.requiresArchetype] || [];
      if (!archetypeUnits.some(u => activeUnits.includes(u))) return false;
    }
    if (a.requiresIncomeTier && !(unlockedTiers[a.requiresIncomeTier] > 0)) return false;
    return true;
  });
}

// ---- Get synergy pair for an artifact ----

export function getPairForArtifact(artifactId: string): SynergyPairDef | undefined {
  const def = ARTIFACT_BY_ID[artifactId];
  if (!def) return undefined;
  return PAIR_BY_ID[def.pairId];
}
