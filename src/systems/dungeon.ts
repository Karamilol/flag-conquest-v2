import { GROUND_Y, ENEMY_SIZE, UNIT_STATS } from '../constants';
import { makeParticle, uid } from '../utils/helpers';
import type { TickState } from './tickState';
import { spawnDungeonElite } from './elites';

// --- Constants ---
const WAVE_INTERVAL_BASE = 2400;    // 40 seconds at 60fps (starting)
const WAVE_INTERVAL_MIN = 1200;     // 20 seconds at 60fps (minimum)
const WAVE_SPEEDUP = 60;            // 1 second faster per wave (60 frames)
const FIRST_WAVE_DELAY = 900;       // 15 seconds for first wave
const BASE_MINING_INTERVAL = 4800;  // 80 seconds at 60fps
const MIN_MINING_INTERVAL = 3000;   // 50 seconds minimum (cap for efficient mining)
const ELITE_WAVE_FREQUENCY = 3;     // Every 3rd wave is elite
const TIMED_DUNGEON_DURATION = 18000; // 5 minutes at 60fps

/** Process the wave spawning timer and spawn dungeon enemies (wave dungeon only) */
export function processDungeonWaveTimer(ts: TickState): void {
  if (ts.dungeonType !== 'wave') return;

  // Count alive enemies
  const alive = ts.enemies.length + ts.enemyArchers.length +
                ts.enemyWraiths.length + ts.enemyHounds.length + ts.enemyLichs.length +
                ts.enemyShadowAssassins.length + ts.enemyFlameCallers.length + ts.enemyCorruptedSentinels.length +
                ts.enemyDungeonRats.length + ts.enemyFireImps.length + ts.enemyCursedKnights.length;
  ts.dungeonEnemiesAlive = alive;

  // Wave cleared: award medals = wave number + elite bonus + quick clear bonus
  // Track per-wave medal award to handle overlapping waves correctly
  if (alive === 0 && ts.dungeonWave > 0 && !ts.dungeonBonusMedalAwarded) {
    const isEliteWave = ts.dungeonWave % ELITE_WAVE_FREQUENCY === 0;
    const eliteBountyLevel = ts.dungeonMetaUpgrades?.eliteBounty || 0;
    const baseMedals = ts.dungeonWave + (isEliteWave ? eliteBountyLevel : 0);
    ts.dungeonMedals += baseMedals;
    ts.dungeonBonusMedalAwarded = true;
    const eliteText = isEliteWave && eliteBountyLevel > 0 ? ` (+${eliteBountyLevel} ELITE)` : '';
    ts.particles.push(makeParticle(ts.dungeonArenaRightX - 200, GROUND_Y - 80,
      `+${baseMedals} MEDALS (WAVE ${ts.dungeonWave} CLEARED!)${eliteText}`, '#ffd700'));

    // Quick clear bonus: extra medals if cleared fast
    const currentInterval = Math.max(WAVE_INTERVAL_MIN, WAVE_INTERVAL_BASE - ts.dungeonWave * WAVE_SPEEDUP);
    if (ts.dungeonWaveTimer < currentInterval - 300) {
      const quickBonus = Math.ceil(ts.dungeonWave / 2);
      ts.dungeonMedals += quickBonus;
      ts.particles.push(makeParticle(ts.dungeonArenaRightX - 200, GROUND_Y - 60,
        `+${quickBonus} QUICK CLEAR!`, '#ffaa00'));
    }
  }

  ts.dungeonWaveTimer++;
  const waveInterval = Math.max(WAVE_INTERVAL_MIN, WAVE_INTERVAL_BASE - ts.dungeonWave * WAVE_SPEEDUP);
  const waveThreshold = ts.dungeonWave === 0 ? FIRST_WAVE_DELAY : waveInterval;
  if (ts.dungeonWaveTimer < waveThreshold) return;

  // Award medals for current wave if not yet awarded (handles overlapping waves —
  // wave timer expired before all enemies cleared, so force-award now before spawning next)
  if (ts.dungeonWave > 0 && !ts.dungeonBonusMedalAwarded) {
    const isEliteWave = ts.dungeonWave % ELITE_WAVE_FREQUENCY === 0;
    const eliteBountyLevel = ts.dungeonMetaUpgrades?.eliteBounty || 0;
    const baseMedals = Math.max(1, Math.floor(ts.dungeonWave * 0.5)) + (isEliteWave ? eliteBountyLevel : 0);
    ts.dungeonMedals += baseMedals;
    ts.particles.push(makeParticle(ts.dungeonArenaRightX - 200, GROUND_Y - 80,
      `+${baseMedals} MEDALS (WAVE ${ts.dungeonWave} PARTIAL)`, '#cc8800'));
  }

  // Spawn next wave
  ts.dungeonWaveTimer = 0;
  ts.dungeonWave++;
  ts.dungeonBonusMedalAwarded = false;

  const isElite = ts.dungeonWave % ELITE_WAVE_FREQUENCY === 0;
  ts.dungeonEliteWaveNext = (ts.dungeonWave + 1) % ELITE_WAVE_FREQUENCY === 0;

  // Scale difficulty with trigger zone
  const zone = ts.dungeonTriggerZone;
  const zoneScale = Math.pow(1.3, zone);
  const waveScale = 1 + ts.dungeonWave * 0.1;

  const spawnX = ts.dungeonArenaSpawnX;
  const enemyCount = isElite ? 8 + ts.dungeonWave : 4 + Math.floor(ts.dungeonWave * 0.5);

  for (let i = 0; i < enemyCount; i++) {
    const xOffset = i * 15; // stagger spawn behind spawn point (enemies walk left)
    const roll = Math.random();

    if (zone >= 2 && roll < 0.08) {
      // Wraith
      const hp = Math.floor(UNIT_STATS.enemyWraith.health * zoneScale * waveScale);
      ts.enemyWraiths.push({
        id: uid(), x: spawnX + xOffset, y: GROUND_Y - 35,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyWraith.damage * zoneScale * waveScale),
        defense: UNIT_STATS.enemyWraith.defense,
        speed: UNIT_STATS.enemyWraith.speed,
        attackRate: UNIT_STATS.enemyWraith.attackRate,
        attackRange: UNIT_STATS.enemyWraith.attackRange,
        knockback: UNIT_STATS.enemyWraith.knockback,
        frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else if (zone >= 1 && roll < 0.25) {
      // Archer
      const hp = Math.floor(UNIT_STATS.enemyArcher.health * zoneScale * waveScale);
      ts.enemyArchers.push({
        id: uid(), x: spawnX + xOffset, y: GROUND_Y - 22,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyArcher.damage * zoneScale * waveScale),
        speed: UNIT_STATS.enemyArcher.speed,
        attackRate: UNIT_STATS.enemyArcher.attackRate,
        attackRange: UNIT_STATS.enemyArcher.attackRange,
        frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else if (zone >= 3 && roll < 0.35) {
      // Hound
      const hp = Math.floor(UNIT_STATS.enemyHound.health * zoneScale * waveScale);
      ts.enemyHounds.push({
        id: uid(), x: spawnX + xOffset, y: GROUND_Y - ENEMY_SIZE,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyHound.damage * zoneScale * waveScale),
        speed: UNIT_STATS.enemyHound.speed,
        attackRate: UNIT_STATS.enemyHound.attackRate,
        attackRange: UNIT_STATS.enemyHound.attackRange,
        frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else {
      // Goblin (default)
      const hp = Math.floor(UNIT_STATS.enemy.health * zoneScale * waveScale);
      ts.enemies.push({
        id: uid(), x: spawnX + xOffset, y: GROUND_Y - ENEMY_SIZE,
        health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemy.damage * zoneScale * waveScale),
        speed: UNIT_STATS.enemy.speed + Math.random() * 0.3,
        attackRate: UNIT_STATS.enemy.attackRate,
        attackRange: UNIT_STATS.enemy.attackRange,
        frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    }
  }

  // Elite wave: spawn a random dungeon elite variant (replaces old beefy wraith)
  if (isElite) {
    spawnDungeonElite(ts, spawnX);
    ts.particles.push(makeParticle(spawnX - 100, GROUND_Y - 100,
      `--- ELITE WAVE ${ts.dungeonWave}! ---`, '#ff4444'));
  } else {
    ts.particles.push(makeParticle(spawnX - 100, GROUND_Y - 80,
      `--- WAVE ${ts.dungeonWave} ---`, '#ffaa44'));
  }
}

/** Process fragment mining — wave dungeon only */
export function processDungeonMining(ts: TickState): void {
  if (ts.dungeonType !== 'wave') return;

  const efficientLevel = ts.dungeonMetaUpgrades.efficientMining;
  const miningInterval = Math.max(MIN_MINING_INTERVAL, BASE_MINING_INTERVAL - efficientLevel * 60);
  ts.dungeonMiningTimer++;

  // Sparkle buildup when close to mining
  if (ts.dungeonMiningTimer > miningInterval - 300 && ts.frame % 15 === 0) {
    const workerX = ts.dungeonArenaLeftX;
    ts.particles.push(makeParticle(
      workerX + 10 + Math.random() * 30, GROUND_Y - 50 - Math.random() * 20,
      '\u2728', '#cc88ff'));
  }

  if (ts.dungeonMiningTimer < miningInterval) return;
  ts.dungeonMiningTimer = 0;
  ts.dungeonFragmentsEarned++;

  const workerX = ts.dungeonArenaLeftX;
  ts.particles.push(makeParticle(workerX + 20, GROUND_Y - 60, '\u{1F9E9} ANCIENT FRAGMENT MINED!', '#aa44ff'));
  ts.particles.push(makeParticle(workerX + 15, GROUND_Y - 70, '\u2728\u2728\u2728', '#cc88ff'));
  ts.particles.push(makeParticle(workerX + 25, GROUND_Y - 50, '\u2728\u2728', '#aa66dd'));
}

/** Award medals when dungeon enemies die — DEPRECATED: medals now awarded on wave clear only */
export function awardDungeonMedals(_ts: TickState, _enemyType: string): void {
  // No-op: medals are now earned per wave completion, not per kill
}

/** Check if enemies reached the workers' flag — wave dungeon only */
export function processDungeonEndCheck(ts: TickState): void {
  if (ts.dungeonType !== 'wave') return;

  const baseX = ts.dungeonArenaLeftX + 30;

  const enemyAtBase =
    ts.enemies.some(e => e.x <= baseX) ||
    ts.enemyArchers.some(a => a.x <= baseX) ||
    ts.enemyWraiths.some(w => w.x <= baseX) ||
    ts.enemyHounds.some(h => h.x <= baseX) ||
    ts.enemyLichs.some(l => l.x <= baseX) ||
    ts.enemyShadowAssassins.some(sa => sa.x <= baseX) ||
    ts.enemyFlameCallers.some(fc => fc.x <= baseX) ||
    ts.enemyCorruptedSentinels.some(cs => cs.x <= baseX) ||
    ts.enemyDungeonRats.some(dr => dr.x <= baseX) ||
    ts.enemyFireImps.some(fi => fi.x <= baseX) ||
    ts.enemyCursedKnights.some(ck => ck.x <= baseX);

  if (enemyAtBase) {
    ts.particles.push(makeParticle(baseX, GROUND_Y - 60, 'WORKERS OVERRUN!', '#ff4444'));
    ts.dungeonOver = true;
  }
}

/** Process the wave dungeon portal despawn timer */
export function processDungeonPortalTimer(ts: TickState): void {
  if (ts.dungeonPortalTimer > 0) {
    ts.dungeonPortalTimer--;
    if (ts.dungeonPortalTimer <= 0) {
      ts.dungeonPortalFlagId = -1;
      ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 40, 'Artifact portal faded...', '#888'));
    }
  }
}

/** Process the timed (regalia) dungeon portal despawn timer */
export function processTimedDungeonPortalTimer(ts: TickState): void {
  if (ts.timedDungeonPortalTimer > 0) {
    ts.timedDungeonPortalTimer--;
    if (ts.timedDungeonPortalTimer <= 0) {
      ts.timedDungeonPortalFlagId = -1;
      ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 40, 'Regalia portal faded...', '#888'));
    }
  }
}

/** Track dungeon time spent (both types, for passive income calc) */
export function processDungeonTickCounter(ts: TickState): void {
  if (ts.inDungeon) {
    ts.dungeonTicksSpent++;
  }
}

/** Timed dungeon flag income — now handled as one-time bonus in flags.ts on capture */
export function processTimedDungeonFlagIncome(_ts: TickState): void {
  // No-op: flag income is a one-time capture bonus, not continuous
}

/** Process the timed dungeon countdown timer */
export function processTimedDungeonTimer(ts: TickState): void {
  if (ts.dungeonType !== 'timed') return;
  if (ts.dungeonOver) return;

  ts.timedDungeonTimer--;

  const remaining = ts.timedDungeonTimer;

  if (ts.timedDungeonVictory) {
    // Post-victory loot timer — 60 seconds to grab loot then auto-exit
    if (remaining === 1800) { // 30 seconds
      ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 100, '\u{23F0} 30s to grab loot!', '#ffaa44'));
    } else if (remaining === 600) { // 10 seconds
      ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 100, '\u{23F0} 10 SECONDS!', '#ff4444'));
    }
    if (remaining <= 0) {
      ts.timedDungeonTimer = 0;
      ts.dungeonOver = true;
    }
    return;
  }

  // Milestone warnings (pre-victory)
  if (remaining === 7200) { // 2 minutes
    ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 100, '\u{23F0} 2 MINUTES LEFT!', '#ffaa44'));
  } else if (remaining === 3600) { // 1 minute
    ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 100, '\u{23F0} 1 MINUTE LEFT!', '#ff6644'));
  } else if (remaining === 1800) { // 30 seconds
    ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 100, '\u{23F0} 30 SECONDS!', '#ff4444'));
  }

  if (remaining <= 0) {
    ts.timedDungeonTimer = 0;
    ts.dungeonOver = true;
    ts.particles.push(makeParticle(ts.hero.x, GROUND_Y - 80, "TIME'S UP!", '#ff4444'));
  }
}

/** Check timed dungeon end conditions */
export function processTimedDungeonEnd(ts: TickState): void {
  if (ts.dungeonType !== 'timed') return;
  if (ts.dungeonOver) return;

  // Victory: boss killed — don't auto-end, let player collect loot and exit manually
  if (ts.timedDungeonVictory) {
    return;
  }
}

/** Process regalia key portal request */
export function processRegaliaKeyPortal(ts: TickState): void {
  if (!ts.regaliaKeyPortalRequested || ts.inDungeon || ts.timedDungeonPortalFlagId >= 0 || ts.challengeId) return;
  let bestFlag = ts.flags.find(f => f.captured && !f.isBossFlag);
  if (!bestFlag) bestFlag = ts.flags.find(f => f.captured);
  if (!bestFlag) return;
  ts.regaliaKeyPortalRequested = false;
  ts.timedDungeonPortalTimer = 3600; // 60 seconds
  ts.timedDungeonPortalFlagId = bestFlag.id;
  ts.particles.push(makeParticle(bestFlag.x, GROUND_Y - 80, '\u{1F511} REGALIA PORTAL SUMMONED!', '#ff6633'));
  ts.particles.push(makeParticle(bestFlag.x, GROUND_Y - 100, 'A fiery gateway appears...', '#ff8844'));
}
