// ── Fractured World: Modifier Effect Helpers ────────────────────────
//
// All helpers read from ts.activeModifiers / ts.activeCurse.
// When no modifiers are active, every helper returns a neutral value
// (1.0 for multipliers, 0 for flat bonuses, false for booleans).
// This means wiring them into systems has ZERO gameplay impact until
// a portal is actually chosen.

import type { TickState } from './tickState';

// ── Core check ──────────────────────────────────────────────────────

/** O(n) scan — n is tiny (0-5 modifiers per zone) */
export function hasMod(ts: TickState, id: string): boolean {
  return ts.activeModifiers.includes(id);
}

export function hasCurse(ts: TickState, id: string): boolean {
  return ts.activeCurse === id;
}

export function hasCurseReward(ts: TickState, id: string): boolean {
  return ts.curseRewards.includes(id);
}

// ── Economy multipliers ─────────────────────────────────────────────

/** Passive income multiplier (Golden Fields: +15%, Gold Drought applied elsewhere) */
export function modPassiveIncomeMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'goldenFields')) mult *= 1.15;
  // Embargo curse: 1.5x passive income
  if (hasCurse(ts, 'embargo')) mult *= 1.5;
  // Curse reward: embargo — +10% all gold income
  if (hasCurseReward(ts, 'embargo')) mult *= 1.10;
  return mult;
}

/** Kill gold multiplier */
export function modKillGoldMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'richFoes')) mult *= 1.30;
  if (hasMod(ts, 'goldDrought')) mult *= 0.50;
  // Embargo curse: no kill gold
  if (hasCurse(ts, 'embargo')) mult = 0;
  // Curse reward: embargo — +10% all gold income
  if (hasCurseReward(ts, 'embargo')) mult *= 1.10;
  return mult;
}

/** Economy upgrade cost multiplier */
export function modEconUpgradeCostMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'logistics')) mult *= 0.90;
  if (hasMod(ts, 'inflation')) mult *= 1.15;
  return mult;
}

/** Unit upgrade cost multiplier */
export function modUnitUpgradeCostMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'qualityMaterials')) mult *= 0.90;
  if (hasMod(ts, 'inflation')) mult *= 1.15;
  return mult;
}

/** Unit roll cost multiplier */
export function modUnitRollCostMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'expensiveLabor')) mult *= 1.20;
  return mult;
}

/** Boss gem drop multiplier */
export function modBossGemMult(ts: TickState): number {
  if (hasMod(ts, 'poorBosses')) return 0;
  if (hasMod(ts, 'wealthyBoss')) return 1.50;
  return 1;
}

/** Boss shard drop bonus (flat) */
export function modBossShardBonus(ts: TickState): number {
  if (hasMod(ts, 'poorBosses')) return -999; // flag to skip shards
  if (hasMod(ts, 'shardVeins')) return 2;
  return 0;
}

/** Gold stash: bonus starting gold (zone × 3 min of passive income) */
export function modGoldStashActive(ts: TickState): boolean {
  return hasMod(ts, 'goldStash');
}

/** Tax collector: lose all gold on zone entry */
export function modTaxCollectorActive(ts: TickState): boolean {
  return hasMod(ts, 'taxCollector');
}

// ── Combat multipliers ──────────────────────────────────────────────

/** All ally HP multiplier */
export function modAllyHpMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'veteranArmy')) mult *= 1.10;
  return mult;
}

/** All ally damage multiplier */
export function modAllyDmgMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'veteranArmy')) mult *= 1.10;
  return mult;
}

/** Melee ally damage multiplier */
export function modMeleeDmgMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'wroughtSteel')) mult *= 1.20;
  return mult;
}

/** Ranged ally damage multiplier */
export function modRangedDmgMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'empoweredShots')) mult *= 1.20;
  return mult;
}

/** Magic ally damage multiplier */
export function modMagicDmgMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'manaPools')) mult *= 1.20;
  if (hasMod(ts, 'dampening')) mult *= 0.80;
  return mult;
}

/** Hero strength multiplier */
export function modHeroMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'herosVoice')) mult *= 1.30;
  if (hasMod(ts, 'suppressedHero')) mult *= 0.50;
  // Duelist's Oath curse: hero 2x stats
  if (hasCurse(ts, 'duelistsOath')) mult *= 2.0;
  return mult;
}

/** All ally flat defense bonus */
export function modAllyDefenseBonus(ts: TickState): number {
  if (hasMod(ts, 'conditioning')) return 2;
  return 0;
}

/** Unit respawn time multiplier */
export function modRespawnTimeMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'swiftDeploy')) mult *= 0.75;
  if (hasMod(ts, 'noRespite')) mult *= 1.30;
  // Curse reward: horde mode — -25% ally respawn time
  if (hasCurseReward(ts, 'hordeMode')) mult *= 0.75;
  return mult;
}

// ── Enemy multipliers ───────────────────────────────────────────────

/** Enemy spawn rate multiplier (lower = faster spawns) */
export function modEnemySpawnRateMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'thinHerd')) mult *= 1.10; // 10% slower = fewer enemies
  if (hasMod(ts, 'swarm')) mult *= 0.70; // 30% faster = more enemies
  // Horde Mode curse: 5x spawn rate
  if (hasCurse(ts, 'hordeMode')) mult *= 0.20;
  // Colosseum curse: half spawn rate
  if (hasCurse(ts, 'colosseum')) mult *= 2.0;
  return mult;
}

/** Enemy HP multiplier */
export function modEnemyHpMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'frailFoes')) mult *= 0.90;
  // Horde Mode curse: enemies -20% HP
  if (hasCurse(ts, 'hordeMode')) mult *= 0.80;
  // Colosseum curse: enemies 4x HP
  if (hasCurse(ts, 'colosseum')) mult *= 4.0;
  return mult;
}

/** Enemy damage multiplier */
export function modEnemyDmgMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'enraged')) mult *= 1.10;
  // Colosseum curse: enemies 1.5x ATK
  if (hasCurse(ts, 'colosseum')) mult *= 1.5;
  return mult;
}

/** Enemy speed multiplier */
export function modEnemySpeedMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'enraged')) mult *= 1.10;
  return mult;
}

/** Enemy damage reduction (flat %) — Armored Foes */
export function modEnemyDamageReduction(ts: TickState): number {
  if (hasMod(ts, 'armoredFoes')) return 0.05;
  return 0;
}

/** Boss HP multiplier */
export function modBossHpMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'strongWilledBoss')) mult *= 1.50;
  // Colosseum also affects boss
  if (hasCurse(ts, 'colosseum')) mult *= 4.0;
  return mult;
}

// ── Environment ─────────────────────────────────────────────────────

/** Healing wells: all units regen 1% HP/sec */
export function modHealingWellsActive(ts: TickState): boolean {
  return hasMod(ts, 'healingWells');
}

/** Corruption: allies lose 0.5% max HP/sec */
export function modCorruptionActive(ts: TickState): boolean {
  return hasMod(ts, 'corruption');
}

/** Soothing Corruption: enemies regen 1% HP/sec */
export function modEnemyRegenActive(ts: TickState): boolean {
  return hasMod(ts, 'soothingCorruption');
}

/** Movement speed multiplier (Unstable Ground) */
export function modMovementSpeedMult(ts: TickState): number {
  if (hasMod(ts, 'unstableGround')) return 0.90;
  return 1;
}

/** Ally range multiplier (Dense Fog + Strong Winds) */
export function modAllyRangeMult(ts: TickState): number {
  let mult = 1;
  if (hasMod(ts, 'denseFog')) mult *= 0.70;
  if (hasMod(ts, 'strongWinds')) mult *= 0.80; // ranged only — caller must filter
  return mult;
}

/** Enemy archer range/dmg modifiers (Sharpshooters) */
export function modSharpshootersActive(ts: TickState): boolean {
  return hasMod(ts, 'sharpshooters');
}

/** Flankers: hound spawns bring 2 extra */
export function modFlankersActive(ts: TickState): boolean {
  return hasMod(ts, 'flankers');
}

/** Unstable Portal: units spawn with 15% HP missing */
export function modUnstablePortalActive(ts: TickState): boolean {
  return hasMod(ts, 'unstablePortal');
}

/** Forgotten Land: no buildings spawn */
export function modForgottenLandActive(ts: TickState): boolean {
  return hasMod(ts, 'forgottenLand');
}

/** Guaranteed dungeon portal spawn */
export function modGuaranteedDungeonActive(ts: TickState): boolean {
  return hasMod(ts, 'guaranteedDungeon');
}

// ── Loot modifiers ──────────────────────────────────────────────────

/** No chests from monsters (Barren Land / Embargo curse) */
export function modNoChestDrops(ts: TickState): boolean {
  return hasMod(ts, 'barrenLand') || hasCurse(ts, 'embargo');
}

/** No consumable drops */
export function modNoConsumableDrops(ts: TickState): boolean {
  return hasMod(ts, 'brokenSupplyLines');
}

/** Relic choice count modifier */
export function modRelicChoiceBonus(ts: TickState): number {
  let bonus = 0;
  if (hasMod(ts, 'bountifulChoice')) bonus += 1;
  if (hasMod(ts, 'cursedRelics')) bonus -= 99; // effectively 1 choice
  return bonus;
}

/** Artifact choice count modifier */
export function modArtifactChoiceBonus(ts: TickState): number {
  let bonus = 0;
  if (hasMod(ts, 'bountifulChoice')) bonus += 1;
  if (hasMod(ts, 'slimPickings')) bonus -= 99;
  return bonus;
}

/** Boss drops additional relic chest */
export function modRelicFavorActive(ts: TickState): boolean {
  return hasMod(ts, 'relicFavor');
}

/** Boss drops additional artifact chest */
export function modArtifactCacheActive(ts: TickState): boolean {
  return hasMod(ts, 'artifactCache');
}

/** Regalia rarity biased toward common (Tarnished) */
export function modTarnishedActive(ts: TickState): boolean {
  return hasMod(ts, 'tarnished');
}

/** Regalia drops at least rare (Craftsmanship) */
export function modCraftsmanshipActive(ts: TickState): boolean {
  return hasMod(ts, 'craftsmanship');
}

// ── Curse-specific ──────────────────────────────────────────────────

/** Duelist's Oath: no allies active */
export function modDuelistOathActive(ts: TickState): boolean {
  return hasCurse(ts, 'duelistsOath');
}

/** Void Touched: healing reduced by 99% */
export function modVoidTouchedMult(ts: TickState): number {
  if (hasCurse(ts, 'voidTouched')) return 0.01;
  // Curse reward: void touched — +30% healing
  if (hasCurseReward(ts, 'voidTouched')) return 1.30;
  return 1;
}

/** Martyrdom: ally deaths AoE 10% max HP */
export function modMartyrdomActive(ts: TickState): boolean {
  return hasCurse(ts, 'martyrdom');
}

/** Martyrdom reward: enemy deaths detonate for 3% max HP */
export function modMartyrdomRewardActive(ts: TickState): boolean {
  return hasCurseReward(ts, 'martyrdom');
}

/** Curse reward: duelist — hero +10% attack speed */
export function modDuelistRewardActive(ts: TickState): boolean {
  return hasCurseReward(ts, 'duelistsOath');
}

/** Curse reward: colosseum — 1% giant spawn chance */
export function modColosseumRewardActive(ts: TickState): boolean {
  return hasCurseReward(ts, 'colosseum');
}

/** Lost In The Void: 1 random unit joins (checked once on zone entry) */
export function modFreshRecruitsActive(ts: TickState): boolean {
  return hasMod(ts, 'freshRecruits');
}
