/**
 * Unit stat computation utility — mirrors processUnitRespawn() in spawning.ts
 * to produce accurate stat displays for Prestige Shop and In-Game Shop.
 *
 * Deterministic modifiers only — random effects (elite, giant, juiced, hats,
 * crown, horn, banner) are excluded since they vary per-spawn.
 */

import { UNIT_STATS, isUnitMelee, isUnitRanged, isUnitMagic } from '../constants';
import { unitHpMult, unitDmgMult } from './economy';
import type { ShardUpgrades, ChallengeId, ChallengeCompletions } from '../types';
import type { RelicCollection } from '../relics';
import { getRelicLevel, hasSetBonus, RELIC_SETS } from '../relics';
import type { Regalia, RegaliaSlot } from '../regalias';
import { LEVEL_MULTS, isUnitInCategory } from '../regalias';

export type UnitType = 'soldier' | 'archer' | 'halberd' | 'knight' | 'wizard' | 'cleric' | 'conjurer' | 'bombard';

export interface ComputedStats {
  health: number;
  damage: number;
  defense: number;
  speed: number;
  attackRate: number;
  range: number;
  critChance: number;
}

export interface StatBonus {
  source: string;
  stat: string;
  value: string;
}

export interface StatBreakdown {
  base: ComputedStats;
  final: ComputedStats;
  bonuses: StatBonus[];
}

/** Context for computing in-game stats (all active modifiers) */
export interface RunStatContext {
  runLevel: number;
  shardUpgrades: ShardUpgrades;
  challengeCompletions: ChallengeCompletions;
  artifacts: string[];
  relicCollection: RelicCollection;
  buildings: string[];
  bossesDefeated: number;
  challengeId: ChallengeId | null;
  equippedRegalias?: Record<RegaliaSlot, Regalia | null>;
}

function getBaseCrit(unitType: UnitType): number {
  if (unitType === 'archer') return 0.05;          // ranged 5%
  if (unitType === 'wizard' || unitType === 'cleric' || unitType === 'conjurer') return 0.03; // magic 3%
  if (unitType === 'bombard') return 0.03; // ranged artillery 3%
  return 0.01;                                      // melee 1%
}

function getBaseStats(unitType: UnitType): ComputedStats {
  const raw = UNIT_STATS[unitType] as any;
  return {
    health: raw.health,
    damage: raw.damage,
    defense: raw.defense || 0,
    speed: raw.speed,
    attackRate: raw.attackRate,
    range: raw.attackRange,
    critChance: getBaseCrit(unitType),
  };
}

// ---- Shard upgrade application (mirrors applyShardUpgrades in spawning.ts) ----

function applyShardBonuses(
  unitType: UnitType,
  s: ComputedStats,
  su: ShardUpgrades,
  bonuses: StatBonus[],
): void {
  if (unitType === 'soldier') {
    if (su.soldier_rations > 0) {
      s.health = Math.floor(s.health * (1 + su.soldier_rations * 0.05));
      bonuses.push({ source: `Rations Lv${su.soldier_rations}`, stat: 'health', value: `+${su.soldier_rations * 5}%` });
    }
    if (su.soldier_keenEdge > 0) {
      s.damage = Math.floor(s.damage * (1 + su.soldier_keenEdge * 0.05));
      bonuses.push({ source: `Keen Edge Lv${su.soldier_keenEdge}`, stat: 'damage', value: `+${su.soldier_keenEdge * 5}%` });
    }
    if (su.soldier_plating > 0) {
      s.defense += su.soldier_plating;
      bonuses.push({ source: `Plating Lv${su.soldier_plating}`, stat: 'defense', value: `+${su.soldier_plating}` });
    }
    if (su.soldier_betterBoots > 0) {
      s.speed += 0.1;
      bonuses.push({ source: 'Better Boots', stat: 'speed', value: '+0.1' });
    }
  }

  if (unitType === 'archer') {
    if (su.archer_rations > 0) {
      s.health = Math.floor(s.health * (1 + su.archer_rations * 0.05));
      bonuses.push({ source: `Rations Lv${su.archer_rations}`, stat: 'health', value: `+${su.archer_rations * 5}%` });
    }
    if (su.archer_keenEdge > 0) {
      s.damage = Math.floor(s.damage * (1 + su.archer_keenEdge * 0.05));
      bonuses.push({ source: `Keen Edge Lv${su.archer_keenEdge}`, stat: 'damage', value: `+${su.archer_keenEdge * 5}%` });
    }
    if (su.archer_leatherwork > 0) {
      s.defense += su.archer_leatherwork;
      bonuses.push({ source: `Leatherwork Lv${su.archer_leatherwork}`, stat: 'defense', value: `+${su.archer_leatherwork}` });
    }
    if (su.archer_eagleEye > 0) {
      s.range += su.archer_eagleEye * 5;
      bonuses.push({ source: `Eagle Eye Lv${su.archer_eagleEye}`, stat: 'range', value: `+${su.archer_eagleEye * 5}` });
    }
  }

  if (unitType === 'knight') {
    if (su.knight_ironclad > 0) {
      s.health = Math.floor(s.health * (1 + su.knight_ironclad * 0.1));
      bonuses.push({ source: `Ironclad Lv${su.knight_ironclad}`, stat: 'health', value: `+${su.knight_ironclad * 10}%` });
    }
    if (su.knight_heavyPlating > 0) {
      s.defense += su.knight_heavyPlating;
      bonuses.push({ source: `Heavy Plating Lv${su.knight_heavyPlating}`, stat: 'defense', value: `+${su.knight_heavyPlating}` });
    }
    if (su.knight_standFirm > 0) {
      s.damage = Math.floor(s.damage * (1 + su.knight_standFirm * 0.05));
      bonuses.push({ source: `Stand Firm Lv${su.knight_standFirm}`, stat: 'damage', value: `+${su.knight_standFirm * 5}%` });
    }
    if (su.knight_betterBoots > 0) {
      s.speed += 0.15;
      bonuses.push({ source: 'Better Boots', stat: 'speed', value: '+0.15' });
    }
  }

  if (unitType === 'halberd') {
    if (su.halberd_rations > 0) {
      s.health = Math.floor(s.health * (1 + su.halberd_rations * 0.05));
      bonuses.push({ source: `Rations Lv${su.halberd_rations}`, stat: 'health', value: `+${su.halberd_rations * 5}%` });
    }
    if (su.halberd_keenEdge > 0) {
      s.damage = Math.floor(s.damage * (1 + su.halberd_keenEdge * 0.05));
      bonuses.push({ source: `Keen Edge Lv${su.halberd_keenEdge}`, stat: 'damage', value: `+${su.halberd_keenEdge * 5}%` });
    }
    if (su.halberd_hardening > 0) {
      s.defense += su.halberd_hardening;
      bonuses.push({ source: `Hardening Lv${su.halberd_hardening}`, stat: 'defense', value: `+${su.halberd_hardening}` });
    }
    if (su.halberd_reach > 0) {
      s.range += su.halberd_reach * 5;
      bonuses.push({ source: `Reach Lv${su.halberd_reach}`, stat: 'range', value: `+${su.halberd_reach * 5}` });
    }
    if (su.halberd_betterBoots > 0) {
      s.speed += 0.1;
      bonuses.push({ source: 'Better Boots', stat: 'speed', value: '+0.1' });
    }
  }

  if (unitType === 'wizard') {
    if (su.wizard_teaBiscuits > 0) {
      s.health = Math.floor(s.health * (1 + su.wizard_teaBiscuits * 0.15));
      bonuses.push({ source: `Tea & Biscuits Lv${su.wizard_teaBiscuits}`, stat: 'health', value: `+${su.wizard_teaBiscuits * 15}%` });
    }
    if (su.wizard_mastery > 0) {
      s.damage = Math.floor(s.damage * (1 + su.wizard_mastery * 0.1));
      bonuses.push({ source: `Mastery Lv${su.wizard_mastery}`, stat: 'damage', value: `+${su.wizard_mastery * 10}%` });
    }
    if (su.wizard_discipline > 0) {
      s.attackRate = Math.max(15, Math.floor(s.attackRate * (1 - su.wizard_discipline * 0.1)));
      bonuses.push({ source: `Discipline Lv${su.wizard_discipline}`, stat: 'attackRate', value: `+${su.wizard_discipline * 10}%` });
    }
    if (su.wizard_walkingStick > 0) {
      s.speed += 0.15;
      bonuses.push({ source: 'Walking Stick', stat: 'speed', value: '+0.15' });
    }
  }

  if (unitType === 'cleric') {
    if (su.cleric_holyVestments > 0) {
      s.health = Math.floor(s.health * (1 + su.cleric_holyVestments * 0.1));
      bonuses.push({ source: `Holy Vestments Lv${su.cleric_holyVestments}`, stat: 'health', value: `+${su.cleric_holyVestments * 10}%` });
    }
    if (su.cleric_devotion > 0) {
      s.range += 5;
      bonuses.push({ source: 'Devotion', stat: 'range', value: '+5' });
    }
    if (su.cleric_betterSandals > 0) {
      s.speed += 0.1;
      bonuses.push({ source: 'Better Sandals', stat: 'speed', value: '+0.1' });
    }
  }

  if (unitType === 'conjurer') {
    if (su.conjurer_crystalResonance > 0) {
      s.damage = Math.floor(s.damage * (1 + su.conjurer_crystalResonance * 0.05));
      bonuses.push({ source: `Crystal Resonance Lv${su.conjurer_crystalResonance}`, stat: 'damage', value: `+${su.conjurer_crystalResonance * 5}%` });
    }
    if (su.conjurer_hardenedLattice > 0) {
      s.health = Math.floor(s.health * (1 + su.conjurer_hardenedLattice * 0.05));
      bonuses.push({ source: `Hardened Lattice Lv${su.conjurer_hardenedLattice}`, stat: 'health', value: `+${su.conjurer_hardenedLattice * 5}%` });
    }
    if (su.conjurer_rapidConjuring > 0) {
      s.attackRate = Math.max(60, Math.floor(s.attackRate * (1 - su.conjurer_rapidConjuring * 0.08)));
      bonuses.push({ source: `Rapid Conjuring Lv${su.conjurer_rapidConjuring}`, stat: 'attackRate', value: `+${su.conjurer_rapidConjuring * 8}%` });
    }
  }

  if (unitType === 'bombard') {
    if (su.bombard_rations > 0) {
      s.health = Math.floor(s.health * (1 + su.bombard_rations * 0.05));
      bonuses.push({ source: `Rations Lv${su.bombard_rations}`, stat: 'health', value: `+${su.bombard_rations * 5}%` });
    }
    if (su.bombard_refinedPowder > 0) {
      s.damage += su.bombard_refinedPowder * 5;
      bonuses.push({ source: `Refined Powder Lv${su.bombard_refinedPowder}`, stat: 'damage', value: `+${su.bombard_refinedPowder * 5}` });
    }
    if (su.bombard_gear > 0) {
      s.defense += su.bombard_gear * 2;
      bonuses.push({ source: `Gear Lv${su.bombard_gear}`, stat: 'defense', value: `+${su.bombard_gear * 2}` });
    }
    if (su.bombard_betterBarrel > 0) {
      s.range += su.bombard_betterBarrel * 10;
      bonuses.push({ source: `Better Barrel Lv${su.bombard_betterBarrel}`, stat: 'range', value: `+${su.bombard_betterBarrel * 10}` });
    }
    if (su.bombard_backpack > 0) {
      s.speed += 0.05;
      bonuses.push({ source: 'Backpack', stat: 'speed', value: '+0.05' });
    }
  }
}

// ---- Challenge completion rewards (mirrors spawning.ts:511-518) ----

function applyChallengeRewards(
  unitType: UnitType,
  s: ComputedStats,
  cc: ChallengeCompletions,
  bonuses: StatBonus[],
): void {
  if (cc.colosseum && isUnitMelee(unitType)) {
    s.health = Math.floor(s.health * 1.15);
    bonuses.push({ source: "Titan's Endurance", stat: 'health', value: '+15%' });
  }
  if (cc.glassCannon) {
    s.damage = Math.floor(s.damage * 1.10);
    bonuses.push({ source: "Razor's Edge", stat: 'damage', value: '+10%' });
  }
  if (cc.hordeMode) {
    s.attackRate = Math.max(15, Math.floor(s.attackRate * 0.90));
    bonuses.push({ source: 'Battle Hardened', stat: 'attackRate', value: '-10%' });
  }
}

// ══════════════════════════════════════════════════════════════════
// PUBLIC API
// ══════════════════════════════════════════════════════════════════

/** Compute unit stats with permanent modifiers only (for Prestige Shop) */
export function computePermanentUnitStats(
  unitType: UnitType,
  su: ShardUpgrades,
  cc: ChallengeCompletions,
): StatBreakdown {
  const base = getBaseStats(unitType);
  const s = { ...base };
  const bonuses: StatBonus[] = [];

  // 1. Shard upgrades
  applyShardBonuses(unitType, s, su, bonuses);

  // 2. Challenge completion rewards
  applyChallengeRewards(unitType, s, cc, bonuses);

  return { base, final: s, bonuses };
}

/** Compute unit stats with ALL active modifiers (for In-Game Shop) */
export function computeFullUnitStats(
  unitType: UnitType,
  ctx: RunStatContext,
): StatBreakdown {
  const base = getBaseStats(unitType);
  const bonuses: StatBonus[] = [];

  // Start from base, apply in same order as processUnitRespawn

  // 1. Run upgrade multipliers
  const level = ctx.runLevel;
  let health = Math.floor(base.health * unitHpMult(level));
  let damage = Math.floor(base.damage * unitDmgMult(level));
  let speed = base.speed;
  let defense = 0;
  let range = base.range;

  // Per-unit defense from run level
  if (unitType === 'soldier') defense = Math.floor(level / 4);
  if (unitType === 'knight') defense = 2 + Math.floor(level / 2);
  if (unitType === 'archer') defense = Math.floor(level / 4);
  if (unitType === 'halberd') defense = 1 + Math.floor(level / 3);
  if (unitType === 'wizard') defense = Math.floor(level / 7);
  if (unitType === 'conjurer') defense = Math.floor(level / 7);
  if (unitType === 'bombard') defense = Math.floor(level / 5);

  let attackRate = base.attackRate;

  if (level > 0) {
    bonuses.push({ source: `Level ${level}`, stat: 'health', value: `x${unitHpMult(level).toFixed(2)}` });
    bonuses.push({ source: `Level ${level}`, stat: 'damage', value: `x${unitDmgMult(level).toFixed(2)}` });
    if (defense > (base.defense || 0)) bonuses.push({ source: `Level ${level}`, stat: 'defense', value: `+${defense - (base.defense || 0)}` });
  }

  // 2. Artifact effects
  const hasArtifact = (id: string) => ctx.artifacts.includes(id);

  // --- Army-wide artifacts ---
  if (hasArtifact('swiftArmy')) {
    speed += 0.1;
    bonuses.push({ source: 'Swift Army', stat: 'speed', value: '+0.1' });
  }
  if (hasArtifact('rapidDeploy')) {
    bonuses.push({ source: 'Rapid Deploy', stat: 'attackRate', value: '-8% spawn timer' });
  }

  // --- Archetype: Melee ---
  if (hasArtifact('endurance') && isUnitMelee(unitType)) {
    defense += 1;
    bonuses.push({ source: 'Endurance', stat: 'defense', value: '+1' });
  }
  if (hasArtifact('trainingManual') && isUnitMelee(unitType)) {
    damage += 2;
    bonuses.push({ source: 'Training Manual', stat: 'damage', value: '+2' });
  }

  // --- Archetype: Ranged ---
  if (hasArtifact('steadyFormation') && isUnitRanged(unitType)) {
    bonuses.push({ source: 'Steady Formation', stat: 'damage', value: '+8% when still 1.5s' });
  }
  if (hasArtifact('observation') && isUnitRanged(unitType)) {
    bonuses.push({ source: 'Observation', stat: 'damage', value: '+10% vs >100px' });
  }

  // --- Archetype: Mage ---
  if (hasArtifact('manaShield') && (unitType === 'wizard' || unitType === 'cleric' || unitType === 'conjurer')) {
    bonuses.push({ source: 'Mana Shield', stat: 'defense', value: '80% first-hit/6s' });
  }
  if (hasArtifact('channeledEnergy') && (unitType === 'wizard' || unitType === 'cleric' || unitType === 'conjurer')) {
    bonuses.push({ source: 'Channeled Energy', stat: 'attackRate', value: '3% instant cast' });
  }

  // --- Unit-specific: Soldier ---
  if (unitType === 'soldier') {
    if (hasArtifact('reinforced')) {
      health = Math.floor(health * 1.20);
      bonuses.push({ source: 'Reinforced', stat: 'health', value: '+20%' });
    }
    if (hasArtifact('hasteborn')) {
      bonuses.push({ source: 'Hasteborn', stat: 'attackRate', value: '25% faster respawn' });
    }
  }

  // --- Unit-specific: Knight ---
  if (unitType === 'knight') {
    if (hasArtifact('unyielding')) {
      bonuses.push({ source: 'Unyielding', stat: 'health', value: '5% missing HP/3s' });
    }
    if (hasArtifact('depthOfAttack')) {
      bonuses.push({ source: 'Depth of Attack', stat: 'damage', value: 'AOE attacks' });
    }
  }

  // --- Unit-specific: Halberd ---
  if (unitType === 'halberd') {
    if (hasArtifact('firstStrike')) {
      bonuses.push({ source: 'First Strike', stat: 'damage', value: '2x first hit' });
    }
    if (hasArtifact('linebreak')) {
      bonuses.push({ source: 'Linebreak', stat: 'speed', value: 'Slow enemies 20%/8s' });
    }
  }

  // --- Unit-specific: Archer ---
  if (unitType === 'archer') {
    if (hasArtifact('serratedTips')) {
      bonuses.push({ source: 'Serrated Tips', stat: 'damage', value: '30% chance 2x dmg' });
    }
    if (hasArtifact('quickdraw')) {
      bonuses.push({ source: 'Quickdraw', stat: 'attackRate', value: 'Fire while moving' });
    }
  }

  // --- Unit-specific: Wizard ---
  if (unitType === 'wizard') {
    if (hasArtifact('manaCrystal')) {
      attackRate = Math.max(15, Math.floor(attackRate * 0.92));
      bonuses.push({ source: 'Mana Crystal', stat: 'attackRate', value: '-8%' });
    }
    if (hasArtifact('fireRunes')) {
      bonuses.push({ source: 'Fire Runes', stat: 'damage', value: '20% fireball 1.5x' });
    }
  }

  // --- Unit-specific: Cleric ---
  if (unitType === 'cleric') {
    if (hasArtifact('echoedBlessing')) {
      bonuses.push({ source: 'Echoed Blessing', stat: 'health', value: '25% chain heal' });
    }
    if (hasArtifact('protection')) {
      bonuses.push({ source: 'Protection', stat: 'defense', value: '25% heal -> 40% DR 3s' });
    }
  }

  // --- Economy proc artifacts ---
  if (hasArtifact('betterWeapons') && isUnitMelee(unitType)) {
    bonuses.push({ source: 'Better Weapons', stat: 'damage', value: '+0.5 per smithing proc (max +2/zone)' });
  }

  // --- Contextual combat artifacts (shown as notes) ---
  if (hasArtifact('command')) {
    bonuses.push({ source: 'Command', stat: 'attackRate', value: '+10% near hero' });
  }
  if (hasArtifact('hold')) {
    bonuses.push({ source: 'Hold!', stat: 'attackRate', value: '+5% at flags' });
  }
  if (hasArtifact('attrition')) {
    bonuses.push({ source: 'Attrition', stat: 'defense', value: '+1 during boss' });
  }

  // Build working stats object for shard function
  const s: ComputedStats = { health, damage, defense, speed, attackRate, range, critChance: getBaseCrit(unitType) };

  // 3. Shard upgrades
  applyShardBonuses(unitType, s, ctx.shardUpgrades, bonuses);

  // 4. Relic effects (deterministic only)
  const rc = ctx.relicCollection;
  const gelLv = getRelicLevel(rc['gel'] || 0);
  if (gelLv > 0 && isUnitMelee(unitType)) {
    s.health = Math.floor(s.health * (1 + gelLv * 0.03));
    bonuses.push({ source: `Gel Lv${gelLv}`, stat: 'health', value: `+${gelLv * 3}%` });
  }
  const forgedWeaponsLv = getRelicLevel(rc['forgedWeapons'] || 0);
  if (forgedWeaponsLv > 0 && isUnitMelee(unitType)) {
    s.damage += forgedWeaponsLv;
    bonuses.push({ source: `Forged Weapons Lv${forgedWeaponsLv}`, stat: 'damage', value: `+${forgedWeaponsLv}` });
  }
  const scaleMailLv = getRelicLevel(rc['scaleMail'] || 0);
  if (scaleMailLv > 0 && isUnitMelee(unitType)) {
    s.defense += scaleMailLv;
    bonuses.push({ source: `Scale Mail Lv${scaleMailLv}`, stat: 'defense', value: `+${scaleMailLv}` });
  }
  const platedLeatherLv = getRelicLevel(rc['platedLeather'] || 0);
  if (platedLeatherLv > 0 && isUnitRanged(unitType)) {
    s.defense += platedLeatherLv;
    bonuses.push({ source: `Plated Leather Lv${platedLeatherLv}`, stat: 'defense', value: `+${platedLeatherLv}` });
  }
  const strongerBowsLv = getRelicLevel(rc['strongerBows'] || 0);
  if (strongerBowsLv > 0 && isUnitRanged(unitType)) {
    s.damage += strongerBowsLv;
    bonuses.push({ source: `Stronger Bows Lv${strongerBowsLv}`, stat: 'damage', value: `+${strongerBowsLv}` });
  }
  const magicMushroomLv = getRelicLevel(rc['magicMushroom'] || 0);
  if (magicMushroomLv > 0 && (unitType === 'halberd' || unitType === 'archer')) {
    s.range += magicMushroomLv * 3;
    bonuses.push({ source: `Magic Mushroom Lv${magicMushroomLv}`, stat: 'range', value: `+${magicMushroomLv * 3}` });
  }
  const silkLv = getRelicLevel(rc['silk'] || 0);
  if (silkLv > 0 && isUnitMagic(unitType)) {
    s.defense += silkLv;
    bonuses.push({ source: `Silk Lv${silkLv}`, stat: 'defense', value: `+${silkLv}` });
  }
  const glassesLv = getRelicLevel(rc['glasses'] || 0);
  if (glassesLv > 0 && isUnitMagic(unitType)) {
    s.range += glassesLv * 3;
    bonuses.push({ source: `Glasses Lv${glassesLv}`, stat: 'range', value: `+${glassesLv * 3}` });
    s.critChance += glassesLv * 0.05;
    bonuses.push({ source: `Glasses Lv${glassesLv}`, stat: 'crit', value: `+${glassesLv * 5}%` });
  }
  const greenInkLv = getRelicLevel(rc['greenInk'] || 0);
  if (greenInkLv > 0 && isUnitMagic(unitType)) {
    s.attackRate = Math.max(15, Math.floor(s.attackRate * (1 - greenInkLv * 0.03)));
    bonuses.push({ source: `Green Ink Lv${greenInkLv}`, stat: 'attackRate', value: `+${greenInkLv * 3}%` });
  }
  const wornBootsLv = getRelicLevel(rc['wornBoots'] || 0);
  if (wornBootsLv > 0) {
    s.speed += wornBootsLv * 0.02;
    bonuses.push({ source: `Worn Boots Lv${wornBootsLv}`, stat: 'speed', value: `+${(wornBootsLv * 0.02).toFixed(2)}` });
  }
  // Crit from set bonuses
  const enchantersSet = RELIC_SETS.find(s => s.id === 'enchantersSet');
  if (enchantersSet && hasSetBonus(enchantersSet, rc, 4) && isUnitMagic(unitType)) {
    s.critChance += 0.10;
    bonuses.push({ source: 'Foresight (4pc)', stat: 'crit', value: '+10%' });
  }
  const scoutingSet = RELIC_SETS.find(s => s.id === 'scoutingSet');
  if (scoutingSet && hasSetBonus(scoutingSet, rc, 5)) {
    bonuses.push({ source: 'Advantage (5pc)', stat: 'crit', value: '+10% first atk only' });
  }

  // 5. Building buffs (stacking: 2 Forges = +4 damage)
  const buildingCounts: Record<string, number> = {};
  for (const b of ctx.buildings) buildingCounts[b] = (buildingCounts[b] || 0) + 1;
  const bCount = (type: string) => buildingCounts[type] || 0;
  const blueprintsMult = getRelicLevel(rc['blueprints'] || 0) > 0 ? 1.5 : 1;

  const forgeN = bCount('forge');
  if (forgeN > 0) {
    const val = Math.floor(2 * forgeN * blueprintsMult);
    s.damage += val;
    bonuses.push({ source: `Forge${forgeN > 1 ? ` x${forgeN}` : ''}`, stat: 'damage', value: `+${val}` });
  }
  const leatherworksN = bCount('leatherworks');
  if (leatherworksN > 0) {
    const val = Math.floor(1 * leatherworksN * blueprintsMult);
    s.defense += val;
    bonuses.push({ source: `Leatherworks${leatherworksN > 1 ? ` x${leatherworksN}` : ''}`, stat: 'defense', value: `+${val}` });
  }
  const tavernN = bCount('tavern');
  if (tavernN > 0) {
    const bonus = Math.floor(s.health * 0.08 * tavernN * blueprintsMult);
    s.health += bonus;
    bonuses.push({ source: `Tavern${tavernN > 1 ? ` x${tavernN}` : ''}`, stat: 'health', value: `+${Math.round(8 * tavernN * blueprintsMult)}%` });
  }
  const barracksN = bCount('barracks');
  if (barracksN > 0) {
    s.attackRate = Math.max(15, Math.floor(s.attackRate * Math.max(0.7, 1 - 0.05 * barracksN * blueprintsMult)));
    bonuses.push({ source: `Barracks${barracksN > 1 ? ` x${barracksN}` : ''}`, stat: 'attackRate', value: `+${Math.round(5 * barracksN * blueprintsMult)}% atk speed` });
  }
  const lumbercampN = bCount('lumbercamp');
  if (lumbercampN > 0) {
    const val = 0.05 * lumbercampN * blueprintsMult;
    s.speed += val;
    bonuses.push({ source: `Lumbercamp${lumbercampN > 1 ? ` x${lumbercampN}` : ''}`, stat: 'speed', value: `+${val.toFixed(2)}` });
  }
  const churchN = bCount('church');
  if (churchN > 0) {
    bonuses.push({ source: `Church${churchN > 1 ? ` x${churchN}` : ''}`, stat: 'regen', value: `${(0.5 * churchN * blueprintsMult).toFixed(1)}% HP/3s` });
  }
  const guardPostN = bCount('guardPost');
  if (guardPostN > 0) {
    bonuses.push({ source: `Guard Post${guardPostN > 1 ? ` x${guardPostN}` : ''}`, stat: 'respawn', value: `-${Math.round(3 * guardPostN * blueprintsMult)}%` });
  }
  const warShrineN = bCount('warShrine');
  if (warShrineN > 0) {
    const critVal = 0.03 * warShrineN * blueprintsMult;
    s.critChance += critVal;
    bonuses.push({ source: `War Shrine${warShrineN > 1 ? ` x${warShrineN}` : ''}`, stat: 'crit', value: `+${Math.round(critVal * 100)}%` });
  }
  const marketN = bCount('market');
  if (marketN > 0) {
    bonuses.push({ source: `Market${marketN > 1 ? ` x${marketN}` : ''}`, stat: 'income cost', value: `-${Math.round(3 * marketN * blueprintsMult)}%` });
  }
  const recruitN = bCount('recruitmentCenter');
  if (recruitN > 0) {
    bonuses.push({ source: `Recruit Center${recruitN > 1 ? ` x${recruitN}` : ''}`, stat: 'unit cost', value: `-${Math.round(3 * recruitN * blueprintsMult)}%` });
  }

  // 6. Regalia bonuses
  if (ctx.equippedRegalias) {
    const regalias = ctx.equippedRegalias;
    const cat = isUnitMelee(unitType) ? 'melee' : isUnitRanged(unitType) ? 'ranged' : 'magic';
    // Helper: sum regalia bonus for a stat
    const rBonus = (statId: string, opts?: { target?: string; category?: string }): number => {
      let total = 0;
      for (const r of Object.values(regalias)) {
        if (!r) continue;
        const lvlMult = LEVEL_MULTS[r.level];
        for (const mod of r.modifiers) {
          if (mod.statId !== statId) continue;
          if (opts?.target && mod.target && mod.target !== opts.target) continue;
          if (opts?.category && mod.category && mod.category !== opts.category) continue;
          total += mod.value * lvlMult * (1 + 0.15 * mod.stars);
        }
      }
      return total;
    };
    // Per-unit damage
    const rDmgFlat = rBonus('damageFlat', { target: unitType });
    if (rDmgFlat > 0) { s.damage += Math.floor(rDmgFlat); bonuses.push({ source: 'Regalia', stat: 'damage', value: `+${Math.floor(rDmgFlat)}` }); }
    const rDmgPct = rBonus('damagePct', { target: unitType });
    if (rDmgPct > 0) { s.damage = Math.floor(s.damage * (1 + rDmgPct / 100)); bonuses.push({ source: 'Regalia', stat: 'damage', value: `+${rDmgPct.toFixed(1)}%` }); }
    // Category damage
    const rCatDmg = rBonus('catDamagePct', { category: cat });
    if (rCatDmg > 0) { s.damage = Math.floor(s.damage * (1 + rCatDmg / 100)); bonuses.push({ source: 'Regalia', stat: 'damage', value: `+${rCatDmg.toFixed(1)}% ${cat}` }); }
    // Army damage
    const rArmyDmg = rBonus('armyDamagePct');
    if (rArmyDmg > 0) { s.damage = Math.floor(s.damage * (1 + rArmyDmg / 100)); bonuses.push({ source: 'Regalia', stat: 'damage', value: `+${rArmyDmg.toFixed(1)}% army` }); }
    // Per-unit HP
    const rHpFlat = rBonus('hpFlat', { target: unitType });
    if (rHpFlat > 0) { s.health += Math.floor(rHpFlat); bonuses.push({ source: 'Regalia', stat: 'health', value: `+${Math.floor(rHpFlat)}` }); }
    const rHpPct = rBonus('hpPct', { target: unitType });
    if (rHpPct > 0) { s.health = Math.floor(s.health * (1 + rHpPct / 100)); bonuses.push({ source: 'Regalia', stat: 'health', value: `+${rHpPct.toFixed(1)}%` }); }
    // Category HP
    const rCatHp = rBonus('catHpPct', { category: cat });
    if (rCatHp > 0) { s.health = Math.floor(s.health * (1 + rCatHp / 100)); bonuses.push({ source: 'Regalia', stat: 'health', value: `+${rCatHp.toFixed(1)}% ${cat}` }); }
    // Army HP
    const rArmyHp = rBonus('armyHpPct');
    if (rArmyHp > 0) { s.health = Math.floor(s.health * (1 + rArmyHp / 100)); bonuses.push({ source: 'Regalia', stat: 'health', value: `+${rArmyHp.toFixed(1)}% army` }); }
    // Defense
    const rDef = rBonus('defenseFlat', { target: unitType });
    if (rDef > 0) { s.defense += Math.floor(rDef); bonuses.push({ source: 'Regalia', stat: 'defense', value: `+${Math.floor(rDef)}` }); }
    const rCatDef = rBonus('catDefense', { category: cat });
    if (rCatDef > 0) { s.defense += Math.floor(rCatDef); bonuses.push({ source: 'Regalia', stat: 'defense', value: `+${Math.floor(rCatDef)} ${cat}` }); }
    const rArmyDef = rBonus('armyDefense');
    if (rArmyDef > 0) { s.defense += Math.floor(rArmyDef); bonuses.push({ source: 'Regalia', stat: 'defense', value: `+${Math.floor(rArmyDef)} army` }); }
    // Attack speed
    const rAtkSpd = rBonus('attackSpeed', { target: unitType });
    if (rAtkSpd > 0) { s.attackRate = Math.max(15, Math.floor(s.attackRate * (1 - rAtkSpd / 100))); bonuses.push({ source: 'Regalia', stat: 'attackRate', value: `+${rAtkSpd.toFixed(1)}%` }); }
    const rCatAtk = rBonus('catAttackSpeed', { category: cat });
    if (rCatAtk > 0) { s.attackRate = Math.max(15, Math.floor(s.attackRate * (1 - rCatAtk / 100))); bonuses.push({ source: 'Regalia', stat: 'attackRate', value: `+${rCatAtk.toFixed(1)}% ${cat}` }); }
    const rArmyAtk = rBonus('armyAttackSpeed');
    if (rArmyAtk > 0) { s.attackRate = Math.max(15, Math.floor(s.attackRate * (1 - rArmyAtk / 100))); bonuses.push({ source: 'Regalia', stat: 'attackRate', value: `+${rArmyAtk.toFixed(1)}% army` }); }
    // Move speed
    const rMoveSpd = rBonus('moveSpeed', { target: unitType }) + rBonus('armyMoveSpeed');
    if (rMoveSpd > 0) { s.speed += rMoveSpd; bonuses.push({ source: 'Regalia', stat: 'speed', value: `+${rMoveSpd.toFixed(2)}` }); }
    // Crit chance
    const rCrit = rBonus('critChance', { target: unitType }) + rBonus('catCritChance', { category: cat }) + rBonus('armyCritChance');
    if (rCrit > 0) { s.critChance += rCrit / 100; bonuses.push({ source: 'Regalia', stat: 'crit', value: `+${rCrit.toFixed(1)}%` }); }
    // Crit damage
    const rCritDmg = rBonus('critDamage', { target: unitType });
    if (rCritDmg > 0) bonuses.push({ source: 'Regalia', stat: 'critDmg', value: `+${rCritDmg.toFixed(1)}%` });
    // Regen
    const rRegen = rBonus('regenPct', { target: unitType }) + rBonus('armyRegenPct');
    if (rRegen > 0) bonuses.push({ source: 'Regalia', stat: 'regen', value: `${rRegen.toFixed(1)}% HP/s` });
    // % Defense
    const rDefPct = rBonus('defensePct', { target: unitType });
    if (rDefPct > 0) bonuses.push({ source: 'Regalia', stat: 'defense', value: `+${rDefPct.toFixed(1)}%` });
    // Respawn
    const rRespawn = rBonus('respawnSpeed', { target: unitType }) + rBonus('armyRespawnSpeed');
    if (rRespawn > 0) bonuses.push({ source: 'Regalia', stat: 'respawn', value: `+${rRespawn.toFixed(1)}%` });
  }

  // 7. Challenge active modifier
  if (ctx.challengeId === 'glassCannon') {
    s.health = Math.floor(s.health / 3);
    s.damage *= 3;
    bonuses.push({ source: 'Glass Cannon', stat: 'health', value: '/3' });
    bonuses.push({ source: 'Glass Cannon', stat: 'damage', value: 'x3' });
  }

  // 8. Challenge completion rewards
  applyChallengeRewards(unitType, s, ctx.challengeCompletions, bonuses);

  return { base, final: s, bonuses };
}
