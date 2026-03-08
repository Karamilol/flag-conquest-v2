/**
 * Elite Mini-Boss System
 *
 * Replaces the old random elite mod system with unique named variants per enemy type.
 * Spawns via soft-capped probability (like chests) with a hard cooldown.
 * One active elite at a time. Unlocks after Wraith King (bossesDefeated >= 3).
 */

import type { TickState } from './tickState';
import { getRegaliaBonus } from './tickState';
import { makeParticle, uid } from '../utils/helpers';
import { GROUND_Y, ENEMY_SIZE, UNIT_STATS } from '../constants';
import { rollRegaliaDrop, getRandomSlot, buildUnlockFilter, RARITY_COLORS } from '../regalias';

// ── Variant Definitions ──────────────────────────────────────────

export interface EliteVariant {
  id: string;
  name: string;
  enemyType: string;       // which enemy array: 'goblin' | 'archer' | 'wraith' | ...
  unlockBosses: number;    // bossesDefeated >= this to appear in pool
  isDungeon: boolean;
  hpMult: number;
  dmgMult: number;
  defBonus: number;
  spdMult: number;
  glowColor: string;
  scale: number;           // visual scale multiplier (1.6 default, 1.8 for Colossus)
}

export const ELITE_VARIANTS: EliteVariant[] = [
  // ── Overworld (8) ──
  { id: 'warchief',      name: 'WARCHIEF',       enemyType: 'goblin',    unlockBosses: 3, isDungeon: false, hpMult: 6,   dmgMult: 2,   defBonus: 2, spdMult: 0.8, glowColor: '#ff6600', scale: 1.6 },
  { id: 'deadeye',       name: 'DEADEYE',        enemyType: 'archer',    unlockBosses: 3, isDungeon: false, hpMult: 5,   dmgMult: 2.5, defBonus: 1, spdMult: 1.0, glowColor: '#ffcc00', scale: 1.6 },
  { id: 'revenant',      name: 'REVENANT',       enemyType: 'wraith',    unlockBosses: 3, isDungeon: false, hpMult: 8,   dmgMult: 2,   defBonus: 3, spdMult: 0.7, glowColor: '#8800ff', scale: 1.6 },
  { id: 'packleader',    name: 'PACKLEADER',     enemyType: 'hound',     unlockBosses: 3, isDungeon: false, hpMult: 5,   dmgMult: 2.5, defBonus: 0, spdMult: 1.2, glowColor: '#cc4400', scale: 1.6 },
  { id: 'archlich',      name: 'ARCHLICH',       enemyType: 'lich',      unlockBosses: 4, isDungeon: false, hpMult: 4,   dmgMult: 1,   defBonus: 2, spdMult: 0.8, glowColor: '#00ccaa', scale: 1.6 },
  { id: 'phantomBlade',  name: 'PHANTOM BLADE',  enemyType: 'shadow',    unlockBosses: 5, isDungeon: false, hpMult: 4,   dmgMult: 3,   defBonus: 0, spdMult: 1.3, glowColor: '#00ff88', scale: 1.6 },
  { id: 'infernoHerald', name: 'INFERNO HERALD', enemyType: 'flame',     unlockBosses: 6, isDungeon: false, hpMult: 5,   dmgMult: 2,   defBonus: 1, spdMult: 0.7, glowColor: '#ff2200', scale: 1.6 },
  { id: 'colossus',      name: 'COLOSSUS',       enemyType: 'sentinel',  unlockBosses: 7, isDungeon: false, hpMult: 7,   dmgMult: 1.5, defBonus: 5, spdMult: 0.5, glowColor: '#aaaaaa', scale: 1.8 },
  // ── Dungeon (3) ──
  { id: 'plagueKing',    name: 'PLAGUE KING',    enemyType: 'dungeonRat',    unlockBosses: 0, isDungeon: true, hpMult: 5,  dmgMult: 2,   defBonus: 1, spdMult: 1.3, glowColor: '#88aa00', scale: 1.6 },
  { id: 'magmaLord',     name: 'MAGMA LORD',     enemyType: 'fireImp',       unlockBosses: 0, isDungeon: true, hpMult: 5,  dmgMult: 1.8, defBonus: 2, spdMult: 0.5, glowColor: '#ff4400', scale: 1.6 },
  { id: 'deathKnight',   name: 'DEATH KNIGHT',   enemyType: 'cursedKnight',  unlockBosses: 0, isDungeon: true, hpMult: 6,  dmgMult: 2,   defBonus: 4, spdMult: 0.7, glowColor: '#6622aa', scale: 1.6 },
];

/** Look up a variant by id */
export function getEliteVariant(id: string): EliteVariant | undefined {
  return ELITE_VARIANTS.find(v => v.id === id);
}

// ── Spawn Logic ──────────────────────────────────────────────────

const ELITE_COOLDOWN_FRAMES = 10800; // 3 minutes at 60fps
const ELITE_DESPAWN_FRAMES = 10800;  // 3 minutes to kill before despawn

/**
 * Check if an elite should spawn this tick (called per enemy spawn in processEnemySpawning).
 * Returns the variant to spawn, or null if no elite.
 */
export function shouldSpawnElite(ts: TickState): EliteVariant | null {
  // Gate: unlock after Wraith King
  if (ts.bossesDefeated < 3) return null;
  // Not during boss fights
  if (ts.boss && ts.boss.health > 0) return null;
  // Not in timed dungeons
  if (ts.dungeonType === 'timed') return null;
  // One active elite at a time
  if (ts.activeEliteId !== null) return null;
  // Hard cooldown
  if (ts.frame - ts.eliteLastSpawnFrame < ELITE_COOLDOWN_FRAMES) return null;

  // Soft-capped probability (like chest drops)
  const activeEnemies = ts.enemies.length + ts.enemyArchers.length + ts.enemyWraiths.length +
    ts.enemyHounds.length + ts.enemyLichs.length + ts.enemyShadowAssassins.length +
    ts.enemyFlameCallers.length + ts.enemyCorruptedSentinels.length +
    ts.enemyDungeonRats.length + ts.enemyFireImps.length + ts.enemyCursedKnights.length;
  const eliteRate = 0.01 / Math.max(1, activeEnemies * 0.1);
  if (Math.random() >= eliteRate) return null;

  // Build available pool
  const isDungeon = ts.inDungeon && ts.dungeonType === 'wave';
  const pool = ELITE_VARIANTS.filter(v => {
    if (isDungeon) return v.isDungeon;
    if (v.isDungeon) return false;
    return ts.bossesDefeated >= v.unlockBosses;
  });
  if (pool.length === 0) return null;

  // Anti-repeat: remove last 2 variants from pool (if pool is big enough)
  const last = ts.lastEliteVariants;
  let filtered = pool.filter(v => !last.includes(v.id));
  if (filtered.length === 0) filtered = pool;

  return filtered[Math.floor(Math.random() * filtered.length)];
}

/**
 * Spawn an elite enemy into the appropriate array. Called from processEnemySpawning.
 * Returns the spawned enemy's id for tracking.
 */
export function spawnElite(ts: TickState, variant: EliteVariant, spawnX: number): number {
  const currentZone = ts.currentZone;
  const zoneScale = Math.pow(1.3, currentZone * Math.pow(0.98, currentZone));
  const flagScale = 1 + ts.flagsCaptured * 0.05;
  const id = uid();

  switch (variant.enemyType) {
    case 'goblin': {
      const baseHp = (UNIT_STATS.enemy.health + ts.flagsCaptured * 3) * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      const baseDmg = (UNIT_STATS.enemy.damage + ts.flagsCaptured) * zoneScale * flagScale;
      ts.enemies.push({
        id, x: spawnX, y: GROUND_Y - ENEMY_SIZE,
        health: hp, maxHealth: hp,
        damage: Math.floor(baseDmg * variant.dmgMult),
        speed: (UNIT_STATS.enemy.speed + 0.15) * variant.spdMult,
        attackRate: UNIT_STATS.enemy.attackRate,
        attackRange: UNIT_STATS.enemy.attackRange,
        frame: 0, attackCooldown: 15,
        lane: 0,
        defense: variant.defBonus,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'archer': {
      const baseHp = (UNIT_STATS.enemyArcher.health + ts.flagsCaptured * 2) * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      ts.enemyArchers.push({
        id, x: spawnX, y: GROUND_Y - 22,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyArcher.damage * zoneScale * flagScale * variant.dmgMult),
        speed: UNIT_STATS.enemyArcher.speed * variant.spdMult,
        attackRate: UNIT_STATS.enemyArcher.attackRate,
        attackRange: UNIT_STATS.enemyArcher.attackRange,
        frame: 0, attackCooldown: 15,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'wraith': {
      const baseHp = (UNIT_STATS.enemyWraith.health + ts.flagsCaptured * 4) * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      ts.enemyWraiths.push({
        id, x: spawnX, y: GROUND_Y - 35,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyWraith.damage * zoneScale * flagScale * variant.dmgMult),
        defense: (UNIT_STATS.enemyWraith.defense || 0) + variant.defBonus,
        speed: UNIT_STATS.enemyWraith.speed * variant.spdMult,
        attackRate: UNIT_STATS.enemyWraith.attackRate,
        attackRange: UNIT_STATS.enemyWraith.attackRange,
        knockback: UNIT_STATS.enemyWraith.knockback,
        frame: 0, attackCooldown: 15,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'hound': {
      const baseHp = (UNIT_STATS.enemyHound.health + ts.flagsCaptured * 1) * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      ts.enemyHounds.push({
        id, x: spawnX, y: GROUND_Y - 18,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyHound.damage * zoneScale * flagScale * variant.dmgMult),
        speed: (UNIT_STATS.enemyHound.speed + 0.15) * variant.spdMult,
        attackRate: UNIT_STATS.enemyHound.attackRate,
        attackRange: UNIT_STATS.enemyHound.attackRange,
        frame: 0, attackCooldown: 15,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'lich': {
      const baseHp = (UNIT_STATS.enemy.health + ts.flagsCaptured * 3) * 3.1 * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      ts.enemyLichs.push({
        id, x: spawnX, y: GROUND_Y - 30,
        health: hp, maxHealth: hp,
        damage: 0,
        speed: UNIT_STATS.enemyLich.speed * variant.spdMult,
        attackRange: UNIT_STATS.enemyLich.attackRange,
        frame: 0, healCooldown: 0, iceballCooldown: 0,
        lane: 0,
        activeSkeletons: 0, passiveSummonTimer: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'shadow': {
      const baseHp = (UNIT_STATS.enemyShadowAssassin.health + ts.flagsCaptured * 1) * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      ts.enemyShadowAssassins.push({
        id, x: spawnX, y: GROUND_Y - 22,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyShadowAssassin.damage * zoneScale * flagScale * variant.dmgMult),
        speed: UNIT_STATS.enemyShadowAssassin.speed * variant.spdMult,
        attackRate: UNIT_STATS.enemyShadowAssassin.attackRate,
        attackRange: UNIT_STATS.enemyShadowAssassin.attackRange,
        frame: 0, attackCooldown: 15,
        stealthTimer: 120, visibleTimer: 0, teleportCooldown: 0, scanTimer: 0,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'flame': {
      const baseHp = (UNIT_STATS.enemyFlameCaller.health + ts.flagsCaptured * 3) * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      ts.enemyFlameCallers.push({
        id, x: spawnX, y: GROUND_Y - 30,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyFlameCaller.damage * zoneScale * flagScale * variant.dmgMult),
        speed: UNIT_STATS.enemyFlameCaller.speed * variant.spdMult,
        attackRange: UNIT_STATS.enemyFlameCaller.attackRange,
        frame: 0, castTimer: 0, castTargetX: 0, castTargetY: 0,
        isCasting: false, castCooldown: 0,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'sentinel': {
      const baseHp = (UNIT_STATS.enemyCorruptedSentinel.health + ts.flagsCaptured * 12) * zoneScale * flagScale;
      const hp = Math.floor(baseHp * variant.hpMult);
      ts.enemyCorruptedSentinels.push({
        id, x: spawnX, y: GROUND_Y - 36,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyCorruptedSentinel.damage * zoneScale * flagScale * variant.dmgMult),
        defense: UNIT_STATS.enemyCorruptedSentinel.defense + variant.defBonus,
        speed: UNIT_STATS.enemyCorruptedSentinel.speed * variant.spdMult,
        attackRate: UNIT_STATS.enemyCorruptedSentinel.attackRate,
        attackRange: UNIT_STATS.enemyCorruptedSentinel.attackRange,
        frame: 0, attackCooldown: 15,
        reflectActive: false, reflectTimer: 0,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    // ── Dungeon variants ──
    case 'dungeonRat': {
      const zone = ts.dungeonTriggerZone;
      const zs = Math.pow(1.3, zone);
      const ws = 1 + ts.dungeonWave * 0.1;
      const hp = Math.floor(UNIT_STATS.dungeonRat.health * zs * ws * variant.hpMult);
      ts.enemyDungeonRats.push({
        id, x: spawnX, y: GROUND_Y - 18,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.dungeonRat.damage * zs * ws * variant.dmgMult),
        speed: UNIT_STATS.dungeonRat.speed * variant.spdMult,
        attackRate: UNIT_STATS.dungeonRat.attackRate,
        attackRange: UNIT_STATS.dungeonRat.attackRange,
        frame: 0, attackCooldown: 15,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'fireImp': {
      const zone = ts.dungeonTriggerZone;
      const zs = Math.pow(1.3, zone);
      const ws = 1 + ts.dungeonWave * 0.1;
      const hp = Math.floor(UNIT_STATS.fireImp.health * zs * ws * variant.hpMult);
      ts.enemyFireImps.push({
        id, x: spawnX, y: GROUND_Y - 22,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.fireImp.damage * zs * ws * variant.dmgMult),
        speed: UNIT_STATS.fireImp.speed * variant.spdMult,
        attackRange: UNIT_STATS.fireImp.attackRange,
        frame: 0, castTimer: 0, castTargetX: 0, castTargetY: 0,
        isCasting: false, castCooldown: 0,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
    case 'cursedKnight': {
      const zone = ts.dungeonTriggerZone;
      const zs = Math.pow(1.3, zone);
      const ws = 1 + ts.dungeonWave * 0.1;
      const hp = Math.floor(UNIT_STATS.cursedKnight.health * zs * ws * variant.hpMult);
      ts.enemyCursedKnights.push({
        id, x: spawnX, y: GROUND_Y - 30,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.cursedKnight.damage * zs * ws * variant.dmgMult),
        defense: UNIT_STATS.cursedKnight.defense + variant.defBonus,
        speed: UNIT_STATS.cursedKnight.speed * variant.spdMult,
        attackRate: UNIT_STATS.cursedKnight.attackRate,
        attackRange: UNIT_STATS.cursedKnight.attackRange,
        frame: 0, attackCooldown: 15,
        lane: 0,
        isElite: true, eliteVariantId: variant.id,
      });
      break;
    }
  }

  // Track state
  ts.activeEliteId = id;
  ts.activeEliteVariant = variant.id;
  ts.eliteLastSpawnFrame = ts.frame;

  // Anti-repeat: record last 2
  ts.lastEliteVariants = [variant.id, ...(ts.lastEliteVariants || [])].slice(0, 2);

  // Spawn particle
  ts.particles.push(makeParticle(spawnX, GROUND_Y - 80, `\u2694 ${variant.name} \u2694`, variant.glowColor));

  return id;
}

// ── Despawn Check ────────────────────────────────────────────────

/**
 * Check if the active elite has been killed or should despawn.
 * Called once per tick from the game loop.
 */
export function processEliteTracking(ts: TickState): void {
  if (ts.activeEliteId === null) return;

  // Check if the elite is still alive in any array
  const eid = ts.activeEliteId;
  const alive =
    ts.enemies.some(e => e.id === eid && e.health > 0) ||
    ts.enemyArchers.some(e => e.id === eid && e.health > 0) ||
    ts.enemyWraiths.some(e => e.id === eid && e.health > 0) ||
    ts.enemyHounds.some(e => e.id === eid && e.health > 0) ||
    ts.enemyLichs.some(e => e.id === eid && e.health > 0) ||
    ts.enemyShadowAssassins.some(e => e.id === eid && e.health > 0) ||
    ts.enemyFlameCallers.some(e => e.id === eid && e.health > 0) ||
    ts.enemyCorruptedSentinels.some(e => e.id === eid && e.health > 0) ||
    ts.enemyDungeonRats.some(e => e.id === eid && e.health > 0) ||
    ts.enemyFireImps.some(e => e.id === eid && e.health > 0) ||
    ts.enemyCursedKnights.some(e => e.id === eid && e.health > 0);

  if (!alive) {
    // Elite was killed (rewards handled in economy.ts death processing)
    ts.activeEliteId = null;
    ts.activeEliteVariant = null;
    return;
  }

  // Despawn check: 3 minutes
  if (ts.frame - ts.eliteLastSpawnFrame >= ELITE_DESPAWN_FRAMES) {
    // Remove the elite from the array
    removeEliteById(ts, eid);
    ts.activeEliteId = null;
    ts.activeEliteVariant = null;
    // Find elite position for particle
    ts.particles.push(makeParticle(ts.hero.x + 100, GROUND_Y - 60, 'Elite fled...', '#888888'));
  }
}

/** Remove an elite enemy by id from all arrays */
function removeEliteById(ts: TickState, id: number): void {
  ts.enemies = ts.enemies.filter(e => e.id !== id);
  ts.enemyArchers = ts.enemyArchers.filter(e => e.id !== id);
  ts.enemyWraiths = ts.enemyWraiths.filter(e => e.id !== id);
  ts.enemyHounds = ts.enemyHounds.filter(e => e.id !== id);
  ts.enemyLichs = ts.enemyLichs.filter(e => e.id !== id);
  ts.enemyShadowAssassins = ts.enemyShadowAssassins.filter(e => e.id !== id);
  ts.enemyFlameCallers = ts.enemyFlameCallers.filter(e => e.id !== id);
  ts.enemyCorruptedSentinels = ts.enemyCorruptedSentinels.filter(e => e.id !== id);
  ts.enemyDungeonRats = ts.enemyDungeonRats.filter(e => e.id !== id);
  ts.enemyFireImps = ts.enemyFireImps.filter(e => e.id !== id);
  ts.enemyCursedKnights = ts.enemyCursedKnights.filter(e => e.id !== id);
}

/**
 * Force-spawn an elite if the debug flag is set. Called once per tick.
 */
export function processForceSpawnElite(ts: TickState): void {
  if (!ts.forceSpawnElite) return;
  ts.forceSpawnElite = false;

  // Kill existing elite if active
  if (ts.activeEliteId !== null) {
    removeEliteById(ts, ts.activeEliteId);
    ts.activeEliteId = null;
    ts.activeEliteVariant = null;
  }

  // Build pool based on current zone/dungeon state
  const isDungeon = ts.inDungeon && ts.dungeonType === 'wave';
  const pool = ELITE_VARIANTS.filter(v => {
    if (isDungeon) return v.isDungeon;
    if (v.isDungeon) return false;
    return true; // ignore boss unlock gate for debug
  });
  if (pool.length === 0) return;

  // Anti-repeat
  const last = ts.lastEliteVariants;
  let filtered = pool.filter(v => !last.includes(v.id));
  if (filtered.length === 0) filtered = pool;

  const variant = filtered[Math.floor(Math.random() * filtered.length)];
  const spawnX = ts.hero.x + 150;
  spawnElite(ts, variant, spawnX);
  ts.particles.push(makeParticle(spawnX, GROUND_Y - 60, `⚔ ${variant.name.toUpperCase()} ⚔`, variant.glowColor));
}

// ── Rewards ──────────────────────────────────────────────────────

/**
 * Grant elite kill rewards. Called from economy.ts when an elite dies.
 * Returns the gold amount granted (already added to ts.goldEarned).
 */
export function grantEliteRewards(ts: TickState, baseGold: number, x: number, y: number): number {
  const zone = ts.currentZone;

  // Gold chest: 5x base kill gold (dropped as pickup chest)
  const gold = Math.floor(baseGold * 5);
  ts.chests.push({ id: uid(), x: x + 10, y: GROUND_Y - 20, type: 'gold', value: gold, age: 0 });
  ts.particles.push(makeParticle(x, y - 20, `💰 +${gold}g`, '#ffd700'));

  const biome = Math.floor(zone / 2); // 1 per biome (every 2 zones)

  // Gems: 60% chance, 1 + 1 per biome
  if (Math.random() < 0.60) {
    const gems = 1 + biome;
    ts.gemsThisRun += gems;
    ts.particles.push(makeParticle(x, y - 25, `+${gems} \u{1F48E}`, '#44aaff'));
  }

  // Regalia chest: 30% chance, flat 30/50/20 rarity spread
  if (Math.random() < 0.30) {
    // 30% common, 50% rare, 20% legendary
    const rarityPool: Array<'common' | 'rare' | 'legendary'> = [
      'common', 'common', 'common',
      'rare', 'rare', 'rare', 'rare', 'rare',
      'legendary', 'legendary',
    ];
    const regalia = rollRegaliaDrop(getRandomSlot(), zone + 1, rarityPool, buildUnlockFilter(ts.upgrades));
    ts.chests.push({ id: uid(), x: x + 15, y: GROUND_Y - 20, type: 'regalia', value: 0, age: 0, regaliaData: regalia });
    ts.particles.push(makeParticle(x, y - 40, `\u{1F451} REGALIA!`, RARITY_COLORS[regalia.rarity as keyof typeof RARITY_COLORS] || '#ff88cc'));
  }

  // Shard: 10% chance, flat 1
  if (Math.random() < 0.10) {
    ts.shardsThisRun += 1;
    ts.particles.push(makeParticle(x + 10, y - 35, `+1 SHARD!`, '#ff44ff'));
  }

  // Artifact bounty: 10% chance, max 1 per run
  if (!ts.eliteArtifactDroppedThisRun && Math.random() < 0.10) {
    ts.eliteArtifactDroppedThisRun = true;
    const artifactGold = Math.floor(baseGold * 10);
    ts.goldEarned += artifactGold;
    ts.killGoldEarned += artifactGold;
    ts.particles.push(makeParticle(x - 10, y - 45, `\u{1F4B0} ARTIFACT BOUNTY +${artifactGold}g`, '#ffd700'));
  }

  return gold;
}

// ── Dungeon Elite Spawning ───────────────────────────────────────

const DUNGEON_ELITE_ORDER = ELITE_VARIANTS.filter(v => v.isDungeon);
// Plague King → Magma Lord → Death Knight, then repeats

/**
 * Spawn a dungeon elite for elite waves, cycling in fixed order.
 * Uses the wave number to pick: wave 3 → first, wave 6 → second, etc.
 */
export function spawnDungeonElite(ts: TickState, spawnX: number): number {
  const eliteIndex = Math.floor(ts.dungeonWave / 3) - 1; // wave 3→0, 6→1, 9→2, 12→0...
  const variant = DUNGEON_ELITE_ORDER[((eliteIndex % DUNGEON_ELITE_ORDER.length) + DUNGEON_ELITE_ORDER.length) % DUNGEON_ELITE_ORDER.length];
  return spawnElite(ts, variant, spawnX);
}
