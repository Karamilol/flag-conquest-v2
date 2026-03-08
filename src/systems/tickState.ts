import type { Hero, Flag, Enemy, EnemyArcher, EnemyWraith, EnemyHound, EnemyLich, EnemyShadowAssassin, EnemyFlameCaller, EnemyCorruptedSentinel, EnemyDungeonRat, EnemyFireImp, EnemyCursedKnight, Boss, Ally, UnitSlot, Particle, Projectile, Chest, Banner, Barricade, CrystalTurret, IceWall, IceTurret, Artifact, RunUpgrades, PermanentUpgrades, ShardUpgrades, HeroSkillState, DungeonMetaUpgrades, Backpack, ConsumableId, ChallengeId, ChallengeCompletions } from '../types';
import { type HeroClassId, getClassDef } from '../classes';
import type { RelicCollection } from '../relics';
import { getRelicLevel } from '../relics';
import { makeParticle } from '../utils/helpers';
import { getSkillDef } from '../skills';
import type { Regalia, RegaliaSlot } from '../regalias';
import { LEVEL_MULTS } from '../regalias';

/**
 * Mutable state that gets passed through all systems during a single game tick.
 * Each system reads and writes to this directly - no copying between systems.
 * At the end of the tick, this gets collapsed back into a GameState for React.
 */
export interface TickState {
  // Entities (mutable copies for this tick)
  hero: Hero;
  flags: Flag[];
  enemies: Enemy[];
  enemyArchers: EnemyArcher[];
  enemyWraiths: EnemyWraith[];
  enemyHounds: EnemyHound[];
  enemyLichs: EnemyLich[];
  enemyShadowAssassins: EnemyShadowAssassin[];
  enemyFlameCallers: EnemyFlameCaller[];
  enemyCorruptedSentinels: EnemyCorruptedSentinel[];
  enemyDungeonRats: EnemyDungeonRat[];
  enemyFireImps: EnemyFireImp[];
  enemyCursedKnights: EnemyCursedKnight[];
  allies: Ally[];
  /** Cached allies excluding pets — computed once per tick, used by enemy AI. */
  nonPetAllies: Ally[];

  // Scratch data for lich necromancy (populated in processAllyDeaths, consumed in processLichNecromancy)
  recentAllyDeaths: Array<{ x: number; y: number; maxHealth: number; damage: number; defense: number; attackRate: number; attackRange: number }>;
  unitSlots: UnitSlot[];
  particles: Particle[];
  projectiles: Projectile[];
  chests: Chest[];
  banners: Banner[];
  barricades: Barricade[];
  crystalTurrets: CrystalTurret[];
  iceWalls: IceWall[];
  iceTurrets: IceTurret[];
  boss: Boss | null;

  // Pre-computed building counts (computed once per tick)
  buildingCounts: { forge: number; warShrine: number; barracks: number; leatherworks: number; church: number; blueprintsMult: number };

  // Scalars
  smithingBonusStacks: number;
  goldEarned: number;
  goldHistory?: number[];
  goldHistoryIdx?: number;
  goldLastSnapshot?: number;
  flagsCaptured: number;
  lastFlagCaptureFrame: number;
  gemsThisRun: number;
  shardsThisRun: number;
  currentZone: number;
  bossesDefeated: number;
  enemiesKilled: number;
  killGoldEarned: number;
  eliteKills: number;
  incomeTimer: number;
  incomeTimer2: number;
  incomeTimer3: number;
  incomeTimer4: number;
  incomeTimer5: number;
  incomeTimer6: number;
  incomeTimer7: number;
  incomeTimer8: number;
  regenTimer: number;
  cameraX: number;
  portalFlagIndex: number;
  totalGoldEarned: number;
  autoFireball: boolean;
  autoSkills: string[];
  autoPortalForward: boolean;
  armyHoldMode: boolean;
  pendingArtifactChoice: Artifact[] | null;

  // Relic drops accumulated during this run
  relicDrops: string[];
  pendingRelicChoice: { id: string; name: string; icon: string; rarity: string; desc: string }[] | null;

  // Consumable system
  freeRerolls: number;
  artifactKeyPortalRequested: boolean;
  regaliaKeyPortalRequested: boolean;
  onCollectConsumable: (id: ConsumableId) => void;

  // Regalia system
  onCollectRegalia: (regalia: Regalia) => void;
  readonly equippedRegalias: Record<RegaliaSlot, Regalia | null>;

  // Challenge runs
  challengeId: ChallengeId | null;
  challengeComplete: boolean;
  challengeLevel: number;
  challengeLevelUpPending: boolean;

  // Blessing artifact cooldown
  blessingCooldown: number;
  // Decree artifact: next ally death respawns instantly
  decreeActive: boolean;

  // Hero skills
  heroSkills: HeroSkillState;
  pendingSkillChoice: string[] | null;
  pendingSkillUses: string[];
  killsThisTick: number;

  // Dungeon state
  inDungeon: boolean;
  dungeonWave: number;
  dungeonWaveTimer: number;
  dungeonMiningTimer: number;
  dungeonMedals: number;
  dungeonFragmentsEarned: number;
  dungeonEnemiesAlive: number;
  dungeonEliteWaveNext: boolean;
  dungeonBonusMedalAwarded: boolean;
  dungeonArenaLeftX: number;
  dungeonArenaRightX: number;
  dungeonArenaSpawnX: number;
  dungeonShopOpen: boolean;
  dungeonTriggerZone: number;
  dungeonTriggerFlags: number;
  dungeonPortalTimer: number;
  dungeonPortalFlagId: number;
  dungeonUnlocked: boolean;
  dungeonPityCounter: number;
  dungeonOver: boolean;
  dungeonMeleeBoost: number;
  dungeonRangedBoost: number;
  dungeonMagicBoost: number;
  dungeonAllyMode: 'advance' | 'hold' | 'retreat';
  dungeonUnitsRolled: number;
  dungeonMetaUpgrades: DungeonMetaUpgrades;

  // Timed dungeon state
  dungeonType: 'wave' | 'timed' | null;
  timedDungeonTimer: number;
  timedDungeonVictory: boolean;
  timedDungeonPortalTimer: number;
  timedDungeonPortalFlagId: number;
  dungeonTicksSpent: number;

  // Elite mini-boss state
  eliteLastSpawnFrame: number;
  activeEliteId: number | null;
  activeEliteVariant: string | null;
  lastEliteVariants: string[];
  eliteArtifactDroppedThisRun: boolean;
  forceSpawnElite: boolean;

  // Pet state
  petCooldown: number;
  equippedPet: string; // pet ID or ''
  onCollectPet: (petId: string) => void;
  readonly ownedPets: string[];

  // Read-only context (not mutated, but needed by systems)
  readonly artifacts: Artifact[];
  readonly ownedArtifactIds: Set<string>;
  readonly activeSynergies: Set<string>;
  readonly runUpgrades: RunUpgrades;
  readonly upgrades: PermanentUpgrades;
  readonly shardUpgrades: ShardUpgrades;
  readonly heroClass: HeroClassId;
  readonly relicCollection: RelicCollection;
  readonly backpack: Backpack;
  readonly ancientRelicsOwned: string[];
  readonly ancientRelicCopies: Record<string, number>;
  readonly challengeCompletions: ChallengeCompletions;
  readonly relicSetPieces: Record<string, number>;
  readonly frame: number;
}

/** Helper: check if player has artifact (O(1) via precomputed Set) */
export function tickHasArtifact(ts: TickState, id: string): boolean {
  return ts.ownedArtifactIds.has(id);
}

/** Helper: check if a synergy pair is active (both artifacts owned) */
export function tickHasSynergy(ts: TickState, pairId: string): boolean {
  return ts.activeSynergies.has(pairId);
}

/** Helper: check if a relic set bonus is active (all pieces owned) */
export function tickHasSetBonus(ts: TickState, setId: string, piecesRequired: number): boolean {
  return (ts.relicSetPieces[setId] || 0) >= piecesRequired;
}

/** Helper: absorb damage through boss shield (if any). Returns remaining damage after shield. */
export function absorbBossShield(boss: any, dmg: number): number {
  if (!boss || !boss.iceShieldHP || boss.iceShieldHP <= 0) return dmg;
  const absorbed = Math.min(boss.iceShieldHP, dmg);
  boss.iceShieldHP -= absorbed;
  return dmg - absorbed;
}

/** Helper: Haulers Relief (4pc) — absorb first debuff on ally. Returns true if absorbed. */
export function tryAbsorbDebuff(ts: TickState, ally: any): boolean {
  if (tickHasSetBonus(ts, 'haulersSet', 4) && !ally.debuffCleansed) {
    ally.debuffCleansed = true;
    ts.particles.push(makeParticle(ally.x + 10, ally.y - 15, 'ABSORBED!', '#88ff88'));
    return true;
  }
  return false;
}

/** Helper: get portal X position */
export function getPortalX(ts: TickState): number {
  if (ts.inDungeon) return ts.dungeonArenaLeftX + 80;
  return ts.portalFlagIndex >= 0 ? (ts.flags[ts.portalFlagIndex]?.x || 40) : 40;
}

/** Helper: check if player has a specific skill equipped */
export function tickHasSkill(ts: TickState, id: string): boolean {
  return ts.heroSkills.equippedSkills.includes(id);
}

/** Helper: check if a skill buff is currently active */
export function tickSkillBuffActive(ts: TickState, id: string): boolean {
  return (ts.heroSkills.skillBuffTimers[id] || 0) > 0;
}

/** Helper: apply full hero damage reduction chain. Returns damage dealt (0 if invulnerable). */
export function dealDamageToHero(ts: TickState, rawDmg: number, suffix = '', color = '#ffaa00'): number {
  const { hero } = ts;
  if ((hero.invulnTimer || 0) > 0) return 0;
  // Mana Shield: absorb entire hit if charges remain
  if ((hero.manaShieldCharges || 0) > 0) {
    hero.manaShieldCharges!--;
    ts.particles.push(makeParticle(hero.x + 16, hero.y, `\u{1F52E} ABSORBED (${hero.manaShieldCharges})`, '#8866cc'));
    return 0;
  }
  const intimidateMult = tickHasSkill(ts, 'intimidate') ? 0.9 : 1;
  const shieldWallMult = tickSkillBuffActive(ts, 'shieldWall') ? 0.6 : 1;
  const smokeScreenMult = tickSkillBuffActive(ts, 'smokeScreen') ? 0 : 1;
  // Goonergy synergy: per friendly slime alive, hero takes -1% dmg (max 30%)
  let goonergyMult = 1;
  if (tickHasSynergy(ts, 'econPair1')) {
    let slimeCount = 0;
    for (const a of ts.allies) if (a.unitType === 'friendlySlime' && a.health > 0) slimeCount++;
    goonergyMult = Math.max(0.70, 1 - slimeCount * 0.01);
  }
  // Endurance: melee hero +1 defense
  const heroIsMelee = getClassDef(ts.heroClass).attackType === 'melee';
  const enduranceDef = (heroIsMelee && tickHasArtifact(ts, 'endurance')) ? 1 : 0;
  const attritionHeroDef = (ts.boss && ts.boss.health > 0 && tickHasArtifact(ts, 'attrition')) ? 1 : 0;
  // Masterwork Arms (Smithy 6pc): hero +1 def per boss killed
  const masterworkDef = tickHasSetBonus(ts, 'smithysSet', 6) ? (hero.masterworkBossCount || 0) : 0;
  // Leatherworks building: hero +1 def per leatherworks
  let leatherworksDef = 0;
  { const { leatherworks: lwN, blueprintsMult: bpM } = ts.buildingCounts; if (lwN > 0) leatherworksDef = Math.floor(1 * lwN * bpM); }
  // Regalia: hero flat defense + hero % defense
  const regaliaHeroDef = getRegaliaBonus(ts, 'heroDefense');
  const regaliaHeroDefPct = getRegaliaBonus(ts, 'heroDefensePct');
  const baseHeroDef = (hero.defense || 0) + enduranceDef + attritionHeroDef + masterworkDef + leatherworksDef + Math.floor(regaliaHeroDef);
  const totalHeroDef = Math.floor(baseHeroDef * (1 + regaliaHeroDefPct / 100));
  const dmg = Math.max(1, Math.floor((rawDmg - totalHeroDef) * intimidateMult * shieldWallMult * smokeScreenMult * goonergyMult));
  hero.health -= dmg;
  hero.lastDamageTime = ts.frame;
  ts.particles.push(makeParticle(hero.x + 16, hero.y, `-${dmg}${suffix}`, color));
  // Second Wind: trigger immediately when crossing 20% threshold
  if (hero.health > 0 && hero.health <= hero.maxHealth * 0.2 && tickHasSkill(ts, 'secondWind')) {
    const swCd = ts.heroSkills.skillCooldowns['secondWind'] || 0;
    const swDef = getSkillDef('secondWind');
    if (swDef && swCd >= swDef.cooldownFrames) {
      hero.health = Math.floor(hero.maxHealth * 0.7);
      ts.heroSkills.skillCooldowns['secondWind'] = 0;
      ts.particles.push(makeParticle(hero.x, hero.y - 30, '\u{1F4A8} SECOND WIND!', '#44aaff'));
    }
  }
  // Strike Back synergy: warlord hero gains damage buff after being hit
  if (tickHasSynergy(ts, 'meleePair') && heroIsMelee) {
    (hero as any).strikeBackStacks = Math.min(3, ((hero as any).strikeBackStacks || 0) + 1);
    (hero as any).strikeBackTimer = 180; // 3s
  }
  // Emergency Rations: first hero hit every 60s - recover 10% max HP/s for 3s (30% total)
  if (getRelicLevel(ts.relicCollection['emergencyRations'] || 0) > 0 && !((hero as any).emergencyRationsCd > 0)) {
    (hero as any).emergencyRationsCd = 3600; // 60s cooldown
    (hero as any).emergencyRationsTimer = 180; // 3s heal
    ts.particles.push(makeParticle(hero.x, hero.y - 20, '🍞 RATIONS!', '#88ff44'));
  }
  return dmg;
}

/** Helper: apply full ally damage reduction chain. Returns damage dealt. */
export function dealDamageToAlly(ts: TickState, ally: { x: number; y: number; health: number; defense?: number; lastDamageTime?: number }, rawDmg: number, suffix = '', color = '#ffaa00'): number {
  // Pet allies are invulnerable
  if ((ally as any).isPet) return 0;
  // Barrier: absorb damage with barrier HP first
  if (((ally as any).barrierHp || 0) > 0) {
    if ((ally as any).barrierHp >= rawDmg) {
      (ally as any).barrierHp -= rawDmg;
      ts.particles.push(makeParticle(ally.x + 10, ally.y, `\u{1F6E1} -${rawDmg}`, '#6688ee'));
      return 0;
    } else {
      rawDmg -= (ally as any).barrierHp;
      (ally as any).barrierHp = 0;
      (ally as any).barrierTimer = 0;
    }
  }
  const { hero } = ts;
  // Militia Reflexes (4pc): 10% chance to dodge first attack received
  if (tickHasSetBonus(ts, 'militiasSet', 4) && !(ally as any).dodgeUsed && Math.random() < 0.10) {
    (ally as any).dodgeUsed = true;
    ts.particles.push(makeParticle(ally.x + 10, ally.y - 10, 'DODGE!', '#88ffff'));
    return 0;
  }
  // New artifact system: endurance (+1 def for melee) handled at spawn time in spawning.ts
  const defBonus = tickHasArtifact(ts, 'endurance') ? 1 : 0;
  const attritionDef = (ts.boss && ts.boss.health > 0 && tickHasArtifact(ts, 'attrition')) ? 1 : 0;
  const intimidateMult = tickHasSkill(ts, 'intimidate') && Math.abs(ally.x - hero.x) < 150 ? 0.9 : 1;
  const shieldWallMult = tickSkillBuffActive(ts, 'shieldWall') && Math.abs(ally.x - hero.x) < 150 ? 0.5 : 1;
  const smokeScreenMult = tickSkillBuffActive(ts, 'smokeScreen') && Math.abs(ally.x - hero.x) < 150 ? 0 : 1;
  // Mana Shield: first hit to a mage every 6s is reduced by 80%
  let manaShieldMult = 1;
  if (tickHasArtifact(ts, 'manaShield') && (ally as any).unitType && ((ally as any).unitType === 'wizard' || (ally as any).unitType === 'cleric')) {
    if (!((ally as any).manaShieldTimer) || (ally as any).manaShieldTimer <= 0) {
      manaShieldMult = 0.2;
      (ally as any).manaShieldTimer = 360; // 6s cooldown
    }
  }
  const protectionMult = ((ally as any).protectionTimer || 0) > 0 ? 0.6 : 1;
  // Juggernaut synergy: knights get +1% dmg reduction per nearby unit (max 15%)
  let juggernautMult = 1;
  if (tickHasSynergy(ts, 'knightPair') && (ally as any).unitType === 'knight') {
    let nearbyCount = 0;
    for (const a of ts.allies) if (a.health > 0 && Math.abs(a.x - ally.x) < 30 && a.id !== (ally as any).id) nearbyCount++;
    juggernautMult = Math.max(0.85, 1 - nearbyCount * 0.01);
  }
  // Regalia: per-unit % defense bonus (boosts flat defense)
  let regaliaDefPct = 0;
  if ((ally as any).unitType) {
    regaliaDefPct = getRegaliaBonus(ts, 'defensePct', { target: (ally as any).unitType });
  }
  const baseAllyDef = (ally.defense || 0) + defBonus + attritionDef;
  const totalAllyDef = Math.floor(baseAllyDef * (1 + regaliaDefPct / 100));
  const dmg = Math.max(1, Math.floor((rawDmg - totalAllyDef) * intimidateMult * shieldWallMult * smokeScreenMult * manaShieldMult * protectionMult * juggernautMult));
  ally.health -= dmg;
  ally.lastDamageTime = ts.frame;
  ts.particles.push(makeParticle(ally.x + 10, ally.y, `-${dmg}${suffix}`, color));
  // Strike Back synergy: melee units gain damage buff after being hit
  if (tickHasSynergy(ts, 'meleePair') && (ally as any).unitType &&
      ['soldier', 'knight', 'halberd'].includes((ally as any).unitType)) {
    (ally as any).strikeBackStacks = Math.min(3, ((ally as any).strikeBackStacks || 0) + 1);
    (ally as any).strikeBackTimer = 180; // 3s
  }
  return dmg;
}

/** Helper: iterate all enemy arrays + boss with a single callback */
export function forEachEnemy(ts: TickState, fn: (e: any) => void): void {
  for (const e of ts.enemies) if (e.health > 0) fn(e);
  for (const e of ts.enemyArchers) if (e.health > 0) fn(e);
  for (const e of ts.enemyWraiths) if (e.health > 0) fn(e);
  for (const e of ts.enemyHounds) if (e.health > 0) fn(e);
  for (const e of ts.enemyLichs) if (e.health > 0) fn(e);
  for (const e of ts.enemyShadowAssassins) if (e.health > 0) fn(e);
  for (const e of ts.enemyFlameCallers) if (e.health > 0) fn(e);
  for (const e of ts.enemyCorruptedSentinels) if (e.health > 0) fn(e);
  for (const e of ts.enemyDungeonRats) if (e.health > 0) fn(e);
  for (const e of ts.enemyFireImps) if (e.health > 0) fn(e);
  for (const e of ts.enemyCursedKnights) if (e.health > 0) fn(e);
  if (ts.boss && ts.boss.health > 0) fn(ts.boss);
}

/** Get total regalia bonus for a stat, optionally filtered by target and/or category */
export function getRegaliaBonus(ts: TickState, statId: string, opts?: { target?: string; category?: string }): number {
  let total = 0;
  for (const r of Object.values(ts.equippedRegalias)) {
    if (!r) continue;
    const lvlMult = LEVEL_MULTS[r.level];
    for (const mod of r.modifiers) {
      if (mod.statId !== statId) continue;
      // Match: exact target, or category, or null (army-wide/economy)
      if (opts?.target && mod.target && mod.target !== opts.target) continue;
      if (opts?.category && mod.category && mod.category !== opts.category) continue;
      total += mod.value * lvlMult * (1 + 0.15 * mod.stars);
    }
  }
  return total;
}
