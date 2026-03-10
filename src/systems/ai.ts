import { COLORS, GROUND_Y, ENEMY_SIZE, UNIT_STATS, isUnitMelee, isUnitMagic } from '../constants';
import { makeParticle, makeCritParticle, uid } from '../utils/helpers';
import type { TickState } from './tickState';
import { tickHasArtifact, tickHasSynergy, tickHasSetBonus, getPortalX, tickHasSkill, tickSkillBuffActive, dealDamageToHero, dealDamageToAlly, forEachEnemy, getRegaliaBonus, absorbBossShield } from './tickState';
import { getRelicLevel } from '../relics';
import { getAncientEffect, getAncientRelicLevel } from '../ancientRelics';
import { isUnitInCategory } from '../regalias';
import { getChallengeRewardMult } from '../challenges';
import { getPetDef } from '../pets';
import { modAllyDmgMult, modMeleeDmgMult, modRangedDmgMult, modMagicDmgMult, modAllyRangeMult, modMovementSpeedMult, modEnemySpeedMult } from './modifierEffects';

/** Check if an enemy is blocked by a barricade ahead (to the left).
 *  If blocked and attack cooldown is ready, deal damage to the barricade.
 *  Returns true if enemy should stop moving. */
function checkBarricadeBlock(ts: TickState, ex: number, damage: number, attackCooldown: number, attackRate: number): { blocked: boolean; newCooldown: number } {
  const barricade = ts.barricades[0]; // max 1 barricade
  if (!barricade) return { blocked: false, newCooldown: attackCooldown };
  // Enemy approaches from the right, barricade blocks leftward movement
  const dist = ex - barricade.x;
  if (dist > 0 && dist < 20) {
    // In range — attack barricade on cooldown
    const newCd = attackCooldown + 1;
    if (newCd >= attackRate) {
      barricade.health -= Math.max(1, damage - barricade.defense);
      return { blocked: true, newCooldown: 0 };
    }
    return { blocked: true, newCooldown: newCd };
  }
  return { blocked: false, newCooldown: attackCooldown };
}

/** Check if an enemy is blocked by a crystal turret ahead (to the left).
 *  If blocked and attack cooldown is ready, deal damage to the turret.
 *  Returns true if enemy should stop moving. */
function checkTurretBlock(ts: TickState, ex: number, damage: number, attackCooldown: number, attackRate: number): { blocked: boolean; newCooldown: number } {
  for (const turret of ts.crystalTurrets) {
    if (turret.health <= 0) continue;
    const dist = ex - turret.x;
    if (dist > 0 && dist < 24) {
      const newCd = attackCooldown + 1;
      if (newCd >= attackRate) {
        turret.health -= Math.max(1, damage - turret.defense);
        if (turret.health <= 0) {
          ts.particles.push(makeParticle(turret.x, turret.y - 10, '💎💥', '#55ddcc'));
        }
        return { blocked: true, newCooldown: 0 };
      }
      return { blocked: true, newCooldown: newCd };
    }
  }
  return { blocked: false, newCooldown: attackCooldown };
}

/** Combined structure block: check barricade first, then turrets */
function checkStructureBlock(ts: TickState, ex: number, damage: number, attackCooldown: number, attackRate: number): { blocked: boolean; newCooldown: number } {
  const barr = checkBarricadeBlock(ts, ex, damage, attackCooldown, attackRate);
  if (barr.blocked) return barr;
  return checkTurretBlock(ts, ex, damage, attackCooldown, attackRate);
}

/** Check if an ally is blocked by an ice wall ahead (to the right).
 *  If blocked and attack cooldown is ready, deal damage to the ice wall.
 *  Returns true if ally should stop moving. */
function checkIceWallBlock(ts: TickState, ax: number, damage: number, attackCooldown: number, attackRate: number): { blocked: boolean; newCooldown: number } {
  for (const wall of ts.iceWalls) {
    if (wall.health <= 0) continue;
    const dist = wall.x - ax; // positive = wall is ahead (to the right)
    if (dist > 0 && dist < 24) {
      const newCd = attackCooldown + 1;
      if (newCd >= attackRate) {
        wall.health -= Math.max(1, damage - wall.defense);
        if (wall.health <= 0) {
          ts.particles.push(makeParticle(wall.x, wall.y - 10, '❄️💥', '#88ccff'));
        }
        return { blocked: true, newCooldown: 0 };
      }
      return { blocked: true, newCooldown: newCd };
    }
  }
  // Also block on ice turrets
  for (const turret of ts.iceTurrets) {
    if (turret.health <= 0) continue;
    const dist = turret.x - ax;
    if (dist > 0 && dist < 24) {
      const newCd = attackCooldown + 1;
      if (newCd >= attackRate) {
        turret.health -= Math.max(1, damage);
        if (turret.health <= 0) {
          ts.particles.push(makeParticle(turret.x, turret.y - 10, '❄️💥', '#88ccff'));
        }
        return { blocked: true, newCooldown: 0 };
      }
      return { blocked: true, newCooldown: newCd };
    }
  }
  return { blocked: false, newCooldown: attackCooldown };
}

/** Spawn a brood pup hound from the Broodmother boss — matches regular hound scaling */
function spawnBroodPup(ts: TickState, boss: { x: number; zone: number }, offsetIndex: number): void {
  const zoneScale = Math.pow(1.3, boss.zone);
  const flagScale = 1 + ts.flagsCaptured * 0.05;
  const hp = Math.floor((UNIT_STATS.enemyHound.health + ts.flagsCaptured * 1) * zoneScale * flagScale);
  const xOffsets = [-30, -15, 0, 20, 40, -45, 55, -60, 65, -20, 30, -35, 45, -50, 60, -70, 70, -80, 80, -90];
  ts.enemyHounds.push({
    id: uid(),
    x: boss.x + xOffsets[offsetIndex % xOffsets.length],
    y: GROUND_Y - ENEMY_SIZE,
    health: hp, maxHealth: hp,
    damage: Math.floor(UNIT_STATS.enemyHound.damage * zoneScale * flagScale),
    speed: UNIT_STATS.enemyHound.speed + Math.random() * 0.3,
    attackRate: UNIT_STATS.enemyHound.attackRate,
    attackRange: UNIT_STATS.enemyHound.attackRange,
    frame: 0, attackCooldown: 15,
    lane: Math.floor(Math.random() * 10) - 5,
    isBroodPup: true,
  });
}

/** Spawn a flame caller from the Infernal General — zone-scaled */
function spawnBossFlame(ts: TickState, boss: { x: number; zone: number }, offsetIndex: number): void {
  const zoneScale = Math.pow(1.3, boss.zone);
  const flagScale = 1 + ts.flagsCaptured * 0.05;
  const hp = Math.floor((UNIT_STATS.enemyFlameCaller.health + ts.flagsCaptured * 3) * zoneScale * flagScale);
  const xOffsets = [30, 50, 70];
  ts.enemyFlameCallers.push({
    id: uid(),
    x: boss.x + xOffsets[offsetIndex % xOffsets.length],
    y: GROUND_Y - 30,
    health: hp, maxHealth: hp,
    damage: Math.floor(UNIT_STATS.enemyFlameCaller.damage * zoneScale * flagScale),
    speed: UNIT_STATS.enemyFlameCaller.speed,
    attackRange: UNIT_STATS.enemyFlameCaller.attackRange,
    frame: 0, castTimer: 0, castTargetX: 0, castTargetY: 0,
    isCasting: false, castCooldown: 0,
    lane: Math.floor(Math.random() * 10) - 5,
  });
}

/** Boss AI: bleed tick, regen, stun, attack patterns */
export function processBossAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;
  const boss = ts.boss;
  if (!boss || boss.health <= 0) return;

  // Boss regen
  if (boss.bossType === 2 && boss.retreating) {
    // Wraith King enhanced retreat regen: 1%/sec applied once per second (avoids decimals)
    if (ts.frame % 60 === 0 && boss.health < boss.maxHealth) {
      const healAmt = Math.max(1, Math.floor(boss.maxHealth * 0.01));
      boss.health = Math.min(boss.maxHealth, boss.health + healAmt);
      ts.particles.push(makeParticle(boss.x + 32, boss.y - 10, `+${healAmt}`, '#4aff4a'));
    }
  } else {
    // Normal regen: 0.2%/sec after 5s without damage (accumulator avoids decimals)
    const timeSinceBossHit = ts.frame - (boss.lastDamageTime || 0);
    if (timeSinceBossHit >= 300 && boss.health < boss.maxHealth) {
      boss.regenAccum = (boss.regenAccum || 0) + boss.maxHealth * 0.002 / 60;
      if (boss.regenAccum >= 1) {
        const regenAmount = Math.floor(boss.regenAccum);
        boss.health = Math.min(boss.maxHealth, boss.health + regenAmount);
        boss.regenAccum -= regenAmount;
      }
    }
  }

  // Stun countdown
  if (boss.stunTimer && boss.stunTimer > 0) {
    boss.stunTimer--;
    return;
  }

  // ---- Wraith King: advancing flag corruptor with retreat-to-heal ----
  if (boss.bossType === 2) {
    // Retreat trigger at 7% HP
    if (!boss.retreating && boss.health < boss.maxHealth * 0.07) {
      boss.retreating = true;
      ts.particles.push(makeParticle(boss.x, boss.y - 30, '💀 RETREATING...', '#8844cc'));
    }
    // Resume advance once healed to 60% HP
    if (boss.retreating && boss.health >= boss.maxHealth * 0.6) {
      boss.retreating = false;
      ts.particles.push(makeParticle(boss.x, boss.y - 30, '👻 WRAITH KING RETURNS!', '#ff3333'));
    }

    // Movement
    const pinDownMult = tickSkillBuffActive(ts, 'pinDown') ? 0.4 : 1;
    if (boss.retreating) {
      // Move toward boss flag (retreat right)
      const bossHomeX = ts.flags.find(f => f.isBossFlag && !f.captured)?.x || boss.x;
      if (boss.x < bossHomeX - 5) {
        boss.x += (boss.speed || 0.2) * pinDownMult;
      }
    } else if (boss.isAttacking && boss.attackCooldown < 20) {
      // Post-slam backstep: walk backward briefly after each slam
      boss.x += 0.5 * pinDownMult;
    } else {
      // Advance left toward captured flags
      boss.x -= (boss.speed || 0.2) * pinDownMult;
    }

    // Corrupt captured flags near boss (runs every tick regardless of attack/backstep state)
    if (!boss.retreating) {
      for (let i = 0; i < ts.flags.length; i++) {
        const flag = ts.flags[i];
        if (flag.captured && !flag.isBossFlag && boss.x <= flag.x + 60) {
          flag.captured = false;
          flag.corrupted = true;
          flag.contested = false;
          flag.contestTimer = 0;
          // Don't change flagsCaptured — keep enemy scaling stable
          ts.particles.push(makeParticle(flag.x, GROUND_Y - 60, '💀 CORRUPTED!', '#8844cc'));
        }
      }
    }

    // Continuous portal enforcement: portal must sit on a captured, non-corrupted flag
    // AND stay at least 200px behind the boss
    const pf = ts.flags[ts.portalFlagIndex];
    const portalInvalid = pf && (!pf.captured || pf.corrupted);
    const portalTooClose = pf && pf.x >= boss.x - 200;
    if (portalInvalid || portalTooClose) {
      let safest = -1;
      for (let j = ts.flags.length - 1; j >= 0; j--) {
        if (ts.flags[j].captured && !ts.flags[j].corrupted && ts.flags[j].x < boss.x - 200) {
          safest = j; break;
        }
      }
      const prev = ts.portalFlagIndex;
      ts.portalFlagIndex = Math.max(0, safest);
      if (ts.portalFlagIndex !== prev) {
        const retreatFlag = ts.flags[ts.portalFlagIndex];
        if (retreatFlag) ts.particles.push(makeParticle(retreatFlag.x, GROUND_Y - 50, '🌀 Portal Retreated!', '#ff4444'));
      }
    }
  }

  // ---- Broodmother: stationary hound pack summoner ----
  if (boss.bossType === 3) {
    const broodPupCount = ts.enemyHounds.filter(h => h.isBroodPup).length;

    const PUP_CAP = 20;

    // Phase 2 enrage at 40% HP (one-time)
    if (!boss.enrageTriggered && boss.health < boss.maxHealth * 0.4) {
      boss.enrageTriggered = true;
      for (let i = 0; i < 4 && broodPupCount + i < PUP_CAP; i++) spawnBroodPup(ts, boss, i);
      ts.particles.push(makeParticle(boss.x + 32, boss.y - 40, '\u{1F43A} THE PACK GOES WILD!', '#cc4400'));
      boss.isAttacking = true;
    }

    const howlMax = boss.enrageTriggered ? 200 : 300;

    // Trickle summon: 1 pup every 90 ticks
    boss.summonCooldown = (boss.summonCooldown || 0) + 1;
    if (boss.summonCooldown >= 90 && broodPupCount < PUP_CAP) {
      boss.summonCooldown = 0;
      spawnBroodPup(ts, boss, broodPupCount % PUP_CAP);
    }

    // Howl burst: 3-4 pups
    boss.howlCooldown = (boss.howlCooldown || 0) + 1;
    if (boss.howlCooldown >= howlMax) {
      boss.howlCooldown = 0;
      const howlCount = boss.enrageTriggered ? 4 : 3;
      for (let i = 0; i < howlCount && broodPupCount + i < PUP_CAP; i++) spawnBroodPup(ts, boss, i);
      boss.isAttacking = true;
      ts.particles.push(makeParticle(boss.x + 32, boss.y - 35, `\u{1F43A} HOWL! +${howlCount} HOUNDS`, '#cc4400'));
    }
  }

  // ---- Dungeon Lich: ranged necromancer (like regular lich but boss-scaled) ----
  if (boss.bossType === 4) {
    // Ranged: only advance if no target in range
    const hasLichTarget = (boss.x - hero.x > 0 && boss.x - hero.x < boss.attackRange) ||
      allies.some(a => boss.x - a.x > 0 && boss.x - a.x < boss.attackRange);
    if (!hasLichTarget && boss.x - hero.x > 60) {
      const lichPinMult = tickSkillBuffActive(ts, 'pinDown') ? 0.4 : 1;
      boss.x -= 0.12 * lichPinMult;
    }

    // Dark Restoration — heal lowest-HP dungeon enemy within 200px (every 480 frames / 8s)
    boss.aoeCooldown = (boss.aoeCooldown || 0) + 1;
    if (boss.aoeCooldown >= 480) {
      const healRange = 200;
      let bossHealTarget: { health: number; maxHealth: number; x: number; y: number } | null = null;
      let bossHealLowest = 1;
      const checkBossHeal = (e: { health: number; maxHealth: number; x: number; y: number }) => {
        if (e.health < e.maxHealth && Math.abs(e.x - boss.x) < healRange) {
          const ratio = e.health / e.maxHealth;
          if (ratio < bossHealLowest) { bossHealLowest = ratio; bossHealTarget = e; }
        }
      };
      for (const e of ts.enemyDungeonRats) checkBossHeal(e);
      for (const e of ts.enemyFireImps) checkBossHeal(e);
      for (const e of ts.enemyCursedKnights) checkBossHeal(e);
      if (bossHealTarget) {
        const target = bossHealTarget as { health: number; maxHealth: number; x: number; y: number };
        const healAmount = Math.floor(target.maxHealth * 0.15);
        target.health = Math.min(target.maxHealth, target.health + healAmount);
        boss.aoeCooldown = 0;
        ts.projectiles.push({ id: uid(), x: target.x + 10, y: target.y, targetX: target.x + 10, targetY: target.y, speed: 0, damage: 0, type: 'darkHeal', duration: 25 });
        ts.particles.push(makeParticle(target.x + 10, target.y - 10, `+${healAmount}`, '#aa55ff'));
      }
    }

    // Summon skeletons (dungeon rats) every 900 frames / 15s, max 6 active
    boss.summonCooldown = (boss.summonCooldown || 0) + 1;
    if (boss.summonCooldown >= 900 && ts.enemyDungeonRats.length < 6) {
      boss.summonCooldown = 0;
      const zoneScale = Math.pow(1.3, ts.currentZone);
      for (let i = 0; i < 2; i++) {
        const hp = Math.floor(UNIT_STATS.dungeonRat.health * zoneScale);
        ts.enemyDungeonRats.push({
          id: uid(), x: boss.x - 20 - i * 20, y: GROUND_Y - ENEMY_SIZE,
          health: hp, maxHealth: hp,
          damage: Math.floor(UNIT_STATS.dungeonRat.damage * zoneScale),
          speed: UNIT_STATS.dungeonRat.speed + Math.random() * 0.2,
          attackRate: UNIT_STATS.dungeonRat.attackRate,
          attackRange: UNIT_STATS.dungeonRat.attackRange,
          frame: ts.frame, attackCooldown: 15,
          lane: Math.floor(Math.random() * 10) - 5,
        });
      }
      ts.particles.push(makeParticle(boss.x, boss.y - 20, '💀 Summon! x3', '#aaaaaa'));
    }
  }

  // ---- Ice Conjurer: frost mage boss — summons ice walls & turrets, slows army ----
  if (boss.bossType === 5) {
    const zoneScale = Math.pow(1.3, ts.currentZone);

    // --- Frost Nova enrage at 40% HP ---
    if (!boss.enrageTriggered && boss.health <= (boss.maxHealth || boss.health) * 0.4) {
      boss.enrageTriggered = true;
      ts.particles.push(makeParticle(boss.x, boss.y - 50, '❄️ FROST NOVA!', '#44ddff'));
      ts.particles.push(makeParticle(boss.x, boss.y - 35, 'THE ICE DEEPENS...', '#88ccff'));
      // Slow all allies for 300 ticks (5s)
      for (const a of allies) {
        if (a.health > 0) a.slowTimer = 300;
      }
      hero.slowTimer = 300;
      // Burst summon: 2 walls + 1 turret
      for (let i = 0; i < 2 && ts.iceWalls.length < 7; i++) {
        const wallHp = Math.floor(700 * zoneScale);
        ts.iceWalls.push({ id: uid(), x: boss.x - 100 - ts.iceWalls.length * 60, y: GROUND_Y - 20, health: wallHp, maxHealth: wallHp, defense: 2 });
        ts.particles.push(makeParticle(boss.x - 100 - (ts.iceWalls.length - 1) * 60, GROUND_Y - 30, '❄️ ICE WALL!', '#aaddff'));
      }
      if (ts.iceTurrets.length < 4) {
        const turretHp = Math.floor(250 * zoneScale);
        const turretDmg = Math.floor(boss.damage * 0.35);
        const turretX = boss.x - 60 - Math.floor(Math.random() * 200);
        ts.iceTurrets.push({ id: uid(), x: turretX, y: GROUND_Y - 20, health: turretHp, maxHealth: turretHp, damage: turretDmg, attackRate: 120, attackCooldown: 0, duration: 1800, maxDuration: 1800 });
        ts.particles.push(makeParticle(turretX, GROUND_Y - 30, '❄️ ICE TURRET!', '#aaddff'));
      }
    }

    // --- Ice Wall summon ---
    const wallCd = boss.enrageTriggered ? 300 : 600;
    boss.wallCooldown = (boss.wallCooldown || 0) + 1;
    if (boss.wallCooldown >= wallCd && ts.iceWalls.length < 5) {
      boss.wallCooldown = 0;
      const wallHp = Math.floor(700 * zoneScale);
      const wallX = boss.x - 100 - ts.iceWalls.length * 60;
      ts.iceWalls.push({ id: uid(), x: wallX, y: GROUND_Y - 20, health: wallHp, maxHealth: wallHp, defense: 2 });
      ts.particles.push(makeParticle(wallX, GROUND_Y - 30, '❄️ ICE WALL!', '#aaddff'));
    }

    // --- Ice Turret summon ---
    const turretCd = boss.enrageTriggered ? 240 : 480;
    boss.turretCooldown = (boss.turretCooldown || 0) + 1;
    if (boss.turretCooldown >= turretCd && ts.iceTurrets.length < 3) {
      boss.turretCooldown = 0;
      const turretHp = Math.floor(250 * zoneScale);
      const turretDmg = Math.floor(boss.damage * 0.35);
      const turretX = boss.x - 60 - Math.floor(Math.random() * 200);
      ts.iceTurrets.push({ id: uid(), x: turretX, y: GROUND_Y - 20, health: turretHp, maxHealth: turretHp, damage: turretDmg, attackRate: 120, attackCooldown: 0, duration: 1800, maxDuration: 1800 });
      ts.particles.push(makeParticle(turretX, GROUND_Y - 30, '❄️ ICE TURRET!', '#aaddff'));
    }
  }

  // ---- White Ninja: stationary — shuriken volley (ranged) / melee slash (close), teleport assassinate ----
  if (boss.bossType === 6) {
    // --- Teleport return: linger at target ~0.5s, then snap home ---
    if (boss.pounceReturnTimer && boss.pounceReturnTimer > 0) {
      boss.pounceReturnTimer--;
      if (boss.pounceReturnTimer <= 0 && boss.pounceHomeX !== undefined) {
        ts.particles.push(makeParticle(boss.x, boss.y - 10, '💨', '#ddd'));
        boss.x = boss.pounceHomeX;
        boss.pounceHomeX = undefined;
      }
    }

    // --- Teleport Assassinate: every 720 ticks (12s), prioritize magic > ranged > melee ---
    boss.pounceCooldown = (boss.pounceCooldown || 0) + 1;
    if (boss.pounceCooldown >= 720 && !(boss.pounceReturnTimer && boss.pounceReturnTimer > 0)) {
      // Priority: magic > ranged > melee
      const alive = allies.filter(a => a.health > 0);
      const magicTargets = alive.filter(a => isUnitMagic(a.unitType));
      const rangedTargets = alive.filter(a => !isUnitMelee(a.unitType) && !isUnitMagic(a.unitType));
      const meleeTargets = alive.filter(a => isUnitMelee(a.unitType));
      const pool = magicTargets.length > 0 ? magicTargets : rangedTargets.length > 0 ? rangedTargets : meleeTargets;
      const pounceTarget = pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
      if (pounceTarget) {
        boss.pounceCooldown = 0;
        boss.pounceHomeX = boss.x;
        boss.x = pounceTarget.x + 20;
        ts.particles.push(makeParticle(boss.pounceHomeX, boss.y - 20, '💨', '#ddd'));
        ts.particles.push(makeParticle(boss.x, boss.y - 30, '🥷 ASSASSINATE!', '#eee'));
        dealDamageToAlly(ts, pounceTarget, Math.floor(boss.damage * 2), ' 🥷', '#eee');
        boss.pounceReturnTimer = 30;
      } else if (hero.health > 0) {
        boss.pounceCooldown = 0;
        boss.pounceHomeX = boss.x;
        boss.x = hero.x + 20;
        ts.particles.push(makeParticle(boss.pounceHomeX, boss.y - 20, '💨', '#ddd'));
        ts.particles.push(makeParticle(boss.x, boss.y - 30, '🥷 ASSASSINATE!', '#eee'));
        dealDamageToHero(ts, Math.floor(boss.damage * 2), ' 🥷', '#eee');
        boss.pounceReturnTimer = 30;
      }
    }
  }

  // ---- Infernal General: stationary — sword rain, flame caller summons, pull+cleave ----
  if (boss.bossType === 7) {
    const FLAME_CAP = 6;
    const flameCount = ts.enemyFlameCallers.length;

    // Enrage at 50% HP (one-time): burst 3 flame callers + particle
    if (!boss.enrageTriggered && boss.health < boss.maxHealth * 0.5) {
      boss.enrageTriggered = true;
      for (let i = 0; i < 3 && flameCount + i < FLAME_CAP; i++) spawnBossFlame(ts, boss, i);
      ts.particles.push(makeParticle(boss.x + 20, boss.y - 40, '🔥 INFERNAL RAGE!', '#ff4400'));
      boss.isAttacking = true;
    }

    // Summon flame callers: every 1200 ticks (20s) normal, 900 ticks (15s) enraged
    const summonMax = boss.enrageTriggered ? 900 : 1200;
    boss.summonCooldown = (boss.summonCooldown || 0) + 1;
    if (boss.summonCooldown >= summonMax && flameCount < FLAME_CAP) {
      boss.summonCooldown = 0;
      const count = boss.enrageTriggered ? 3 : 2;
      for (let i = 0; i < count && flameCount + i < FLAME_CAP; i++) spawnBossFlame(ts, boss, i);
      ts.particles.push(makeParticle(boss.x + 20, boss.y - 30, `🔥 +${count} FLAME CALLERS`, '#ff6600'));
    }

    // Hellfire Cleave (only when enraged — below 50% HP)
    if (boss.enrageTriggered) {
      // Pull phase: smooth suck-in over 60 ticks (~1 second)
      if (boss.pullTimer && boss.pullTimer > 0) {
        boss.pullTimer--;
        // Lerp all allies toward boss (hero is immune to pull)
        for (const a of allies) {
          if (a.health > 0) {
            a.x += (boss.x - 30 - a.x) * 0.06;
          }
        }
        // On pull end: massive cleave
        if (boss.pullTimer <= 0) {
          const cleaveDmg = Math.floor(boss.damage * 2.5);
          const cleaveRadius = 80;
          ts.particles.push(makeParticle(boss.x, boss.y - 20, '🔥 HELLFIRE CLEAVE!', '#ff2200'));
          ts.projectiles.push({ id: uid(), x: boss.x, y: GROUND_Y, targetX: boss.x, speed: 0, damage: 0, type: 'spectralBlast', radius: cleaveRadius, duration: 25 });
          if (Math.abs(hero.x - boss.x) < cleaveRadius && hero.health > 0) {
            dealDamageToHero(ts, cleaveDmg, ' 🔥', '#ff2200');
          }
          for (const a of allies) {
            if (a.health > 0 && Math.abs(a.x - boss.x) < cleaveRadius) {
              dealDamageToAlly(ts, a, cleaveDmg, ' 🔥', '#ff2200');
            }
          }
        }
      } else {
        // Cleave cooldown: count to 1440 (24s), then trigger pull
        boss.cleaveCooldown = (boss.cleaveCooldown || 0) + 1;
        if (boss.cleaveCooldown >= 2700) {
          boss.cleaveCooldown = 0;
          boss.pullTimer = 60;
          ts.particles.push(makeParticle(boss.x, boss.y - 35, '⚠️ DRAWING IN...', '#ffaa00'));
        }
      }
    }
  }

  // Attack targeting
  boss.attackCooldown++;
  let targetX: number | null = null;
  let targetY: number | null = null;
  const heroDistToBoss = boss.x - hero.x;

  if (heroDistToBoss > 0 && heroDistToBoss < boss.attackRange) {
    targetX = hero.x; targetY = hero.y;
  } else {
    const allyInRange = allies.find(a => boss.x - a.x > 0 && boss.x - a.x < boss.attackRange);
    if (allyInRange) { targetX = allyInRange.x; targetY = allyInRange.y; }
  }

  if (targetX !== null && boss.attackCooldown >= boss.attackRate) {
    boss.attackCooldown = 0;
    boss.isAttacking = true;

    if (boss.bossType === 2) {
      // Wraith King ground slam — AOE melee around boss position
      const slamRadius = 90;
      const slamDmg = boss.damage;
      // Visual shockwave
      ts.projectiles.push({ id: uid(), x: boss.x, y: GROUND_Y, targetX: boss.x, speed: 0, damage: 0, type: 'spectralBlast', radius: slamRadius, duration: 20 });
      // Damage hero if in range
      if (Math.abs(hero.x - boss.x) < slamRadius) {
        dealDamageToHero(ts, slamDmg, ' 👻', '#8844cc');
      }
      // Damage + knockback allies in range
      allies.forEach(a => {
        if (Math.abs(a.x - boss.x) < slamRadius) {
          dealDamageToAlly(ts, a, slamDmg, ' 👻', '#8844cc');
          a.x -= 20; // knockback
        }
      });
      // Post-slam: small heal (backstep handled in movement phase)
      const slamHeal = Math.floor(boss.maxHealth * 0.01);
      boss.health = Math.min(boss.maxHealth, boss.health + slamHeal);
      ts.particles.push(makeParticle(boss.x + 20, boss.y - 20, `+${slamHeal}`, '#4aff4a'));
    } else if (boss.bossType === 1) {
      // Wild Huntsman arrow volley
      const volleyRadius = 50;
      const volleyDamage = boss.damage;
      ts.projectiles.push({ id: uid(), x: targetX, y: 0, targetX, targetY: GROUND_Y, speed: 0, damage: volleyDamage, type: 'laser', radius: volleyRadius, duration: 30 });
      if (Math.abs(hero.x - targetX) < volleyRadius) {
        dealDamageToHero(ts, volleyDamage, ' 🏹', '#44aa22');
      }
      allies.forEach(a => {
        if (Math.abs(a.x - targetX!) < volleyRadius) {
          dealDamageToAlly(ts, a, volleyDamage, ' 🏹', '#44aa22');
        }
      });
    } else if (boss.bossType === 3) {
      // Broodmother bite — melee snap
      if (Math.abs(hero.x - boss.x) < 50) {
        dealDamageToHero(ts, boss.damage, ' \u{1F43A}', '#cc4400');
      }
      allies.forEach(a => {
        if (Math.abs(a.x - boss.x) < 50) dealDamageToAlly(ts, a, boss.damage, ' \u{1F43A}', '#cc4400');
      });
    } else if (boss.bossType === 4) {
      // Dungeon Lich: iceball — single slow iceball at target
      ts.projectiles.push({ id: uid(), x: boss.x - 20, y: boss.y + 20, targetX: targetX || hero.x, speed: 5, damage: boss.damage, type: 'iceball' });
      ts.particles.push(makeParticle(boss.x, boss.y - 10, '❄️', '#88ccff'));
    } else if (boss.bossType === 5) {
      // Ice Conjurer: iceball with AoE slow — fire at ground level near allies
      ts.projectiles.push({ id: uid(), x: boss.x - 20, y: GROUND_Y - 15, targetX: targetX || hero.x, speed: 5, damage: boss.damage, type: 'iceball', aoeRadius: 40 });
      ts.particles.push(makeParticle(boss.x, boss.y - 10, '❄️', '#88ccff'));
    } else if (boss.bossType === 6) {
      // White Ninja: melee slash if close, shuriken volley x3 if ranged
      const meleeRange = 55;
      const closestDist = Math.min(
        Math.abs(hero.x - boss.x),
        ...allies.filter(a => a.health > 0).map(a => Math.abs(a.x - boss.x)),
        Infinity
      );
      if (closestDist < meleeRange) {
        // Melee slash — hit all in melee range
        if (Math.abs(hero.x - boss.x) < meleeRange) {
          dealDamageToHero(ts, boss.damage, ' 🥷', '#eee');
        }
        for (const a of allies) {
          if (a.health > 0 && Math.abs(a.x - boss.x) < meleeRange) {
            dealDamageToAlly(ts, a, boss.damage, ' 🥷', '#eee');
          }
        }
      } else {
        // Shuriken volley — 3 projectiles with slight spread
        const tx = targetX || hero.x;
        for (let i = 0; i < 3; i++) {
          const spread = (i - 1) * 30; // -30, 0, +30
          ts.projectiles.push({ id: uid(), x: boss.x - 20, y: boss.y + 20 + spread, targetX: tx + spread, speed: 7, damage: Math.floor(boss.damage * 0.5), type: 'boss' });
        }
        ts.particles.push(makeParticle(boss.x - 10, boss.y, '✦✦✦', '#ddd'));
      }
    } else if (boss.bossType === 7) {
      // Infernal General: sword drop — 1 big sword (2 when enraged), large AOE
      const swordCount = boss.enrageTriggered ? 2 : 1;
      const swordRadius = 55;
      const pool: { x: number; y: number }[] = [];
      if (hero.health > 0) pool.push(hero);
      for (const a of allies) { if (a.health > 0) pool.push(a); }
      for (let i = 0; i < swordCount && pool.length > 0; i++) {
        const target = pool[Math.floor(Math.random() * pool.length)];
        const tx = target.x + (Math.random() - 0.5) * 20;
        ts.projectiles.push({ id: uid(), x: tx, y: 0, targetX: tx, targetY: GROUND_Y, speed: 0, damage: boss.damage, type: 'laser', radius: swordRadius, duration: 35 });
        // Instant damage to everything in radius
        if (hero.health > 0 && Math.abs(hero.x - tx) < swordRadius) {
          dealDamageToHero(ts, boss.damage, ' 🗡️', '#ff4400');
        }
        for (const a of allies) {
          if (a.health > 0 && Math.abs(a.x - tx) < swordRadius) {
            dealDamageToAlly(ts, a, boss.damage, ' 🗡️', '#ff4400');
          }
        }
      }
      ts.particles.push(makeParticle(boss.x, boss.y - 30, '🗡️ HELLSWORD!', '#ff4400'));
    } else {
      // Shooter boss projectile
      ts.projectiles.push({ id: uid(), x: boss.x - 20, y: boss.y + 30, targetX, speed: 8, damage: boss.damage, type: 'boss' });
    }
  } else if (boss.attackCooldown > 10) {
    boss.isAttacking = false;
  }
}

/** Enemy archer AI: shoot or advance */
export function processArcherAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const a of ts.enemyArchers) {
    if (a.health <= 0) continue;
    a.frame = ts.frame;
    if (a.stunTimer && a.stunTimer > 0) { a.stunTimer--; continue; }
    // Root: skip movement (but can still shoot)
    if ((a.rootTimer || 0) > 0) { a.rootTimer!--; }
    // Slow tick-down
    if ((a.slowTimer || 0) > 0) a.slowTimer!--;

    const dx = hero.x - a.x;
    let tX: number | null = null;
    if (Math.abs(dx) <= a.attackRange && dx < 0) { tX = hero.x; }
    else {
      const allyInRange = allies.find(ally => a.x - ally.x > 0 && a.x - ally.x <= a.attackRange);
      if (allyInRange) tX = allyInRange.x;
      else {
        const turretInRange = ts.crystalTurrets.find(t => t.health > 0 && a.x - t.x > 0 && a.x - t.x <= a.attackRange);
        if (turretInRange) tX = turretInRange.x;
      }
    }

    if (tX !== null) {
      // Aiming delay: archer must aim for 48 ticks (0.8s) before first shot
      if ((a.aimingTimer ?? 0) < 48) {
        a.aimingTimer = (a.aimingTimer ?? 0) + 1;
        continue;
      }
      a.attackCooldown++;
      if (a.attackCooldown >= a.attackRate) {
        a.attackCooldown = 0;
        ts.projectiles.push({ id: uid(), x: a.x - 10, y: a.y + (a.lane || 0) + 8, targetX: tX, speed: 6, damage: a.damage, type: 'arrow' });
        // Elite Deadeye: every 3rd shot fires 2 extra arrows at nearby targets
        if (a.eliteVariantId === 'deadeye') {
          a.eliteAbilityCd = ((a.eliteAbilityCd || 0) + 1) % 3;
          if (a.eliteAbilityCd === 0) {
            const extraTargets: number[] = [];
            for (const ally of allies) {
              if (a.x - ally.x > 0 && a.x - ally.x <= a.attackRange && ally.x !== tX) {
                extraTargets.push(ally.x);
              }
            }
            if (hero.x !== tX && a.x - hero.x > 0 && a.x - hero.x <= a.attackRange) {
              extraTargets.push(hero.x);
            }
            for (let i = 0; i < Math.min(2, extraTargets.length); i++) {
              ts.projectiles.push({ id: uid(), x: a.x - 10, y: a.y + (a.lane || 0) + 8 + (i + 1) * 4, targetX: extraTargets[i], speed: 6, damage: a.damage, type: 'arrow' });
            }
            ts.particles.push(makeParticle(a.x, a.y - 15, 'VOLLEY!', '#ffcc00'));
          }
        }
      }
    } else {
      a.aimingTimer = 0; // Reset aim when no target
      if (a.attackCooldown < 15) a.attackCooldown = 15; // Clear attack animation
      if (dx < -a.attackRange && !((a.rootTimer || 0) > 0)) {
        const barr = checkStructureBlock(ts, a.x, a.damage, a.attackCooldown, a.attackRate);
        if (barr.blocked) {
          a.attackCooldown = barr.newCooldown;
        } else {
          const pinDownMult = tickSkillBuffActive(ts, 'pinDown') ? 0.4 : 1;
          const archerSlowMult = (a.slowTimer || 0) > 0 ? (1 - (a.slowAmount || 0)) : 1;
          a.x -= a.speed * pinDownMult * archerSlowMult;
        }
      }
    }
  }
}

/** Enemy goblin AI: movement, melee attacks */
export function processEnemyAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;
  // Pre-index crown carriers for O(k) aura check instead of O(allies) per enemy
  const crownPositions: number[] = [];
  for (const a of allies) { if (a.hasCrown && a.health > 0) crownPositions.push(a.x); }
  // Crown slow scales with ancient relic level
  const crownEff = ts.ancientRelicsOwned.includes('crownOfTheAncients')
    ? getAncientEffect('crownOfTheAncients', getAncientRelicLevel(ts.ancientRelicCopies['crownOfTheAncients'] || 1))
    : null;
  const crownSlowFactor = crownEff ? 1 - (crownEff.slowPct || 0.10) : 0.9;

  for (const e of ts.enemies) {
    if (e.health <= 0) continue;
    e.frame = ts.frame;

    // Burn DOT (wizard elemental / inferno) — ticks once per second
    if ((e.burnTimer || 0) > 0) {
      if (e.burnTimer! % 60 === 0) e.health -= (e.burnDamage || 0);
      e.burnTimer!--;
    }
    if (e.stunTimer && e.stunTimer > 0) { e.stunTimer--; continue; }
    // Root: skip movement
    if ((e.rootTimer || 0) > 0) { e.rootTimer!--; continue; }
    // Artifact slow tick-down
    if ((e.slowTimer || 0) > 0) e.slowTimer!--;
    const artifactSlowMult = (e.slowTimer || 0) > 0 ? (1 - (e.slowAmount || 0)) : 1;

    // Elite Warchief: War Cry every 5s — nearby goblins get instant next attack
    if (e.eliteVariantId === 'warchief') {
      e.eliteAbilityCd = (e.eliteAbilityCd || 0) + 1;
      if (e.eliteAbilityCd >= 300) {
        e.eliteAbilityCd = 0;
        ts.particles.push(makeParticle(e.x, e.y - 25, 'WAR CRY!', '#ff6600'));
        for (const g of ts.enemies) {
          if (g.id !== e.id && Math.abs(g.x - e.x) < 150) {
            g.attackCooldown = Math.max(g.attackCooldown, g.attackRate - 1);
          }
        }
      }
    }

    const dx = hero.x - e.x;
    const blockedByAlly = allies.some(a => { const dist = a.x - e.x; return dist < 0 && dist > -30; });

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    if (Math.abs(dx) < 40) {
      // Attack hero
      e.attackCooldown++;
      const atkRateMult = (e.slowTimer || 0) > 0 && (e as any).atkSlowTimer > 0 ? 1.2 : 1;
      if (e.attackCooldown >= e.attackRate * atkRateMult) {
        e.attackCooldown = 0;
        const dealt = dealDamageToHero(ts, e.damage, '', COLORS.healthRed);
        hero.isAttacking = true;
      }
    } else if (blockedByAlly) {
      // Attack blocking ally
      e.attackCooldown++;
      const atkRateMult = (e.slowTimer || 0) > 0 && (e as any).atkSlowTimer > 0 ? 1.2 : 1;
      if (e.attackCooldown >= e.attackRate * atkRateMult) {
        e.attackCooldown = 0;
        const targetAlly = allies.find(a => Math.abs(a.x - e.x) < 30);
        if (targetAlly) {
          const dealt = dealDamageToAlly(ts, targetAlly, e.damage, '', COLORS.healthRed);
        }
      }
    } else {
      // Check barricade/turret block
      const barr = checkStructureBlock(ts, e.x, e.damage, e.attackCooldown, e.attackRate);
      if (barr.blocked) {
        e.attackCooldown = barr.newCooldown;
      } else {
        // Not in combat — pre-charge so goblins swing quickly on contact
        if (e.attackCooldown < Math.max(e.attackRate - 10, 15)) e.attackCooldown = Math.max(e.attackRate - 10, 15);
        // Move toward hero
        const pinDownMult = pinDownActive ? 0.4 : 1;
        const crownSlow = crownPositions.some(cx => Math.abs(cx - e.x) < 120) ? crownSlowFactor : 1;
        e.x += Math.sign(dx) * e.speed * pinDownMult * crownSlow * artifactSlowMult;
      }
    }
  }
}

/** Wraith AI: AOE knockback attacks */
export function processWraithAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const w of ts.enemyWraiths) {
    if (w.health <= 0) continue;
    w.frame = ts.frame;

    // Burn DOT — ticks once per second
    if ((w.burnTimer || 0) > 0) {
      if (w.burnTimer! % 60 === 0) w.health -= (w.burnDamage || 0);
      w.burnTimer!--;
    }
    if (w.stunTimer && w.stunTimer > 0) { w.stunTimer--; continue; }
    // Root: skip movement
    if ((w.rootTimer || 0) > 0) { w.rootTimer!--; continue; }
    // Slow tick-down
    if ((w.slowTimer || 0) > 0) w.slowTimer!--;

    const dx = hero.x - w.x;
    const blockedByAlly = allies.some(a => { const dist = a.x - w.x; return dist < 0 && dist > -35; });

    // Elite Revenant: Fear pulse every 8s — slow allies/hero within 120px
    if (w.eliteVariantId === 'revenant') {
      w.eliteAbilityCd = (w.eliteAbilityCd || 0) + 1;
      if (w.eliteAbilityCd >= 480) {
        w.eliteAbilityCd = 0;
        ts.particles.push(makeParticle(w.x, w.y - 25, 'FEAR!', '#8800ff'));
        if (Math.abs(hero.x - w.x) < 120) {
          hero.slowTimer = Math.max(hero.slowTimer || 0, 120);
        }
        allies.forEach(a => {
          if (Math.abs(a.x - w.x) < 120) {
            a.slowTimer = Math.max(a.slowTimer || 0, 120);
            a.slowAmount = Math.max(a.slowAmount || 0, 0.5);
          }
        });
      }
    }

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    if (Math.abs(dx) < w.attackRange || blockedByAlly) {
      w.attackCooldown++;
      if (w.attackCooldown >= w.attackRate) {
        w.attackCooldown = 0;
        const knockbackRange = 50;
        // Damage hero if in range
        if (Math.abs(dx) < knockbackRange) {
          const dealt = dealDamageToHero(ts, w.damage, ' 💨', '#8844aa');
          // Elite Revenant: heal 10% of damage dealt
          if (w.eliteVariantId === 'revenant' && dealt > 0) {
            const heal = Math.max(1, Math.floor(dealt * 0.1));
            w.health = Math.min(w.maxHealth, w.health + heal);
          }
        }
        // Damage + knockback allies (reduced by knockbackResist)
        allies.forEach(a => {
          if (Math.abs(a.x - w.x) < knockbackRange) {
            // Knight bulwark: absorb all damage during active window
            if ((a.bulwarkActive || 0) > 0) {
              ts.particles.push(makeParticle(a.x + 10, a.y, 'BLOCK!', '#ffd700'));
              return;
            }
            // Apprentice shield: absorb first hit
            if ((a.shieldHP || 0) > 0) {
              a.shieldHP = 0;
              ts.particles.push(makeParticle(a.x + 10, a.y, 'SHIELD!', '#a855f7'));
              return;
            }
            const dealt = dealDamageToAlly(ts, a, w.damage, ' 💨', '#8844aa');
            // Elite Revenant: heal 10% of damage dealt
            if (w.eliteVariantId === 'revenant' && dealt > 0) {
              const heal = Math.max(1, Math.floor(dealt * 0.1));
              w.health = Math.min(w.maxHealth, w.health + heal);
            }
            const kbAmount = w.knockback * (1 - (a.knockbackResist || 0));
            a.x -= kbAmount;
          }
        });
      }
    } else {
      const barr = checkStructureBlock(ts, w.x, w.damage, w.attackCooldown, w.attackRate);
      if (barr.blocked) {
        w.attackCooldown = barr.newCooldown;
      } else {
        if (w.attackCooldown < 15) w.attackCooldown = 15;
        const pinDownMult = pinDownActive ? 0.4 : 1;
        const wraithSlowMult = (w.slowTimer || 0) > 0 ? (1 - (w.slowAmount || 0)) : 1;
        w.x += Math.sign(dx) * w.speed * pinDownMult * wraithSlowMult;
      }
    }
  }
}

/** Darkened Hound AI: fast approach, invulnerable lunge, recovery window */
export function processHoundAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const h of ts.enemyHounds) {
    if (h.health <= 0) continue;
    h.frame = ts.frame;

    // Burn DOT — ticks once per second
    if ((h.burnTimer || 0) > 0) {
      if (h.burnTimer! % 60 === 0) h.health -= (h.burnDamage || 0);
      h.burnTimer!--;
    }
    if (h.stunTimer && h.stunTimer > 0) { h.stunTimer--; continue; }
    // Root: skip movement
    if ((h.rootTimer || 0) > 0) { h.rootTimer!--; continue; }
    // Slow tick-down
    if ((h.slowTimer || 0) > 0) h.slowTimer!--;

    // Elite Packleader: summon 2 pups every 8s
    if (h.eliteVariantId === 'packleader') {
      h.eliteAbilityCd = (h.eliteAbilityCd || 0) + 1;
      if (h.eliteAbilityCd >= 480) {
        h.eliteAbilityCd = 0;
        const zoneScale = Math.pow(1.3, ts.currentZone);
        const flagScale = 1 + ts.flagsCaptured * 0.05;
        for (let i = 0; i < 2; i++) {
          const pupHp = Math.floor(UNIT_STATS.enemyHound.health * 0.5 * zoneScale * flagScale);
          const pupDmg = Math.floor(UNIT_STATS.enemyHound.damage * 0.5 * zoneScale * flagScale);
          ts.enemyHounds.push({
            id: uid(), x: h.x + 15 + i * 20, y: GROUND_Y - ENEMY_SIZE,
            health: pupHp, maxHealth: pupHp, damage: pupDmg,
            speed: UNIT_STATS.enemyHound.speed * 1.2,
            attackRate: UNIT_STATS.enemyHound.attackRate,
            attackRange: UNIT_STATS.enemyHound.attackRange * 0.7,
            frame: ts.frame, attackCooldown: 0, defense: 0,
          });
        }
        ts.particles.push(makeParticle(h.x, h.y - 20, 'PACK!', '#cc4400'));
      }
    }

    // Recovery: standing still, fully vulnerable
    if ((h.recoveryTimer || 0) > 0) {
      h.recoveryTimer!--;
      continue;
    }

    // Lunging: dash toward target, invulnerable
    if ((h.lungeTimer || 0) > 0) {
      h.lungeTimer!--;
      const lungeSpeed = h.speed * 4;
      const targetX = h.lungeTargetX || hero.x;
      const dxLunge = targetX - h.x;
      const arrived = Math.abs(dxLunge) <= lungeSpeed;
      if (!arrived) {
        h.x += Math.sign(dxLunge) * lungeSpeed;
      } else {
        h.x = targetX;
      }

      // Deal damage and enter recovery on arrival OR when timer expires
      if (arrived || h.lungeTimer! <= 0) {
        h.lungeTimer = 0;
        h.recoveryTimer = 60;
        // Damage hero if close
        if (Math.abs(hero.x - h.x) < 40) {
          const dealt = dealDamageToHero(ts, h.damage, ' 🐺', '#cc4400');
        }
        // Damage closest ally if in range
        const targetAlly = allies.find(a => Math.abs(a.x - h.x) < 35);
        if (targetAlly) {
          const dealt = dealDamageToAlly(ts, targetAlly, h.damage, ' 🐺', '#cc4400');
        }
      }
      continue;
    }

    // Normal movement: approach target
    const dx = hero.x - h.x;
    const blockedByAlly = allies.some(a => { const dist = a.x - h.x; return dist < 0 && dist > -30; });

    // Check if in lunge range — target the closest entity (hero or blocking ally)
    const lungeTarget = blockedByAlly ? allies.find(a => Math.abs(a.x - h.x) < h.attackRange) : null;
    const distToHero = Math.abs(dx);
    const shouldLunge = distToHero < h.attackRange || (lungeTarget && Math.abs(lungeTarget.x - h.x) < h.attackRange);

    if (shouldLunge) {
      // Begin lunge: set invulnerable, dash toward target
      h.lungeTimer = 60;
      h.lungeTargetX = lungeTarget ? lungeTarget.x : hero.x;
      ts.particles.push(makeParticle(h.x, h.y - 10, '💨', '#884400'));
    } else {
      const barr = checkStructureBlock(ts, h.x, h.damage, h.attackCooldown, h.attackRate);
      if (barr.blocked) {
        h.attackCooldown = barr.newCooldown;
      } else {
        // Move toward hero
        const pinDownMult = tickSkillBuffActive(ts, 'pinDown') ? 0.4 : 1;
        const houndSlowMult = (h.slowTimer || 0) > 0 ? (1 - (h.slowAmount || 0)) : 1;
        h.x += Math.sign(dx) * h.speed * pinDownMult * houndSlowMult;
      }
    }
  }
}

/** Lich AI: backline caster — Dark Restoration, Ice Ball, and passive skeleton summoning on independent timers */
export function processLichAI(ts: TickState): void {
  const { hero } = ts;
  for (const l of ts.enemyLichs) {
    if (l.health <= 0) continue;
    l.frame = ts.frame;
    // Burn DOT — ticks once per second
    if ((l.burnTimer || 0) > 0) { if (l.burnTimer! % 60 === 0) l.health -= (l.burnDamage || 0); l.burnTimer!--; }
    if (l.stunTimer && l.stunTimer > 0) { l.stunTimer--; continue; }
    // Root: skip movement (but can still cast)
    if ((l.rootTimer || 0) > 0) { l.rootTimer!--; }
    // Slow tick-down
    if ((l.slowTimer || 0) > 0) l.slowTimer!--;
    // Movement: stop if any player unit (hero or ally) is within attack range
    const dx = hero.x - l.x;
    const hasTargetInRange = Math.abs(dx) <= l.attackRange ||
      ts.allies.some(a => l.x - a.x > 0 && l.x - a.x < l.attackRange);
    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    if (!hasTargetInRange && !((l.rootTimer || 0) > 0)) {
      const pinDownMult = pinDownActive ? 0.4 : 1;
      const lichSlowMult = (l.slowTimer || 0) > 0 ? (1 - (l.slowAmount || 0)) : 1;
      l.x += Math.sign(dx) * l.speed * pinDownMult * lichSlowMult;
    }

    // Dark Restoration — heal lowest-HP enemy within 200px (every 240 frames / 4s)
    l.healCooldown++;
    if (l.healCooldown >= 240) {
      const healRange = 200;
      let healTarget: { health: number; maxHealth: number; x: number; y: number } | null = null;
      let lowestRatio = 1;
      const checkHeal = (e: { health: number; maxHealth: number; x: number; y: number }) => {
        if (e.health < e.maxHealth && Math.abs(e.x - l.x) < healRange) {
          const ratio = e.health / e.maxHealth;
          if (ratio < lowestRatio) { lowestRatio = ratio; healTarget = e; }
        }
      };
      for (const e of ts.enemies) checkHeal(e);
      for (const a of ts.enemyArchers) checkHeal(a);
      for (const w of ts.enemyWraiths) checkHeal(w);
      for (const hd of ts.enemyHounds) checkHeal(hd);
      if (healTarget) {
        const t = healTarget as { health: number; maxHealth: number; x: number; y: number };
        const healAmount = Math.floor(t.maxHealth * 0.25);
        t.health = Math.min(t.maxHealth, t.health + healAmount);
        l.healCooldown = 0;
        ts.projectiles.push({ id: uid(), x: t.x + 10, y: t.y, targetX: t.x + 10, targetY: t.y, speed: 0, damage: 0, type: 'darkHeal', duration: 25 });
        ts.particles.push(makeParticle(t.x + 10, t.y - 10, `+${healAmount}`, '#aa55ff'));
      }
    }

    // Ice Ball — slow AOE at nearest player unit (every 300 frames / 5s)
    l.iceballCooldown++;
    if (l.iceballCooldown >= 300) {
      let iceTarget: { x: number; y: number } | null = null;
      let iceClosest = l.attackRange + 1;
      if (l.x - hero.x > 0 && l.x - hero.x < l.attackRange) {
        iceTarget = hero; iceClosest = l.x - hero.x;
      }
      for (const a of ts.allies) {
        const d = l.x - a.x;
        if (d > 0 && d < iceClosest) { iceTarget = a; iceClosest = d; }
      }
      if (iceTarget) {
        const iceballBaseDmg = Math.floor(2 + ts.currentZone * 0.5);
        const iceballDmg = l.eliteVariantId === 'archlich' ? iceballBaseDmg * 2 : iceballBaseDmg;
        l.iceballCooldown = 0;
        ts.projectiles.push({ id: uid(), x: l.x - 10, y: l.y + (l.lane || 0) + 10, targetX: iceTarget.x, speed: 5, damage: iceballDmg, type: 'iceball' });
        ts.particles.push(makeParticle(l.x, l.y - 10, '❄️', '#88ccff'));
      }
    }
    // Passive summon timer — skeletons match regular goblin scaling
    const skelCap = l.eliteVariantId === 'archlich' ? 6 : 3;
    const skelCount = l.eliteVariantId === 'archlich' ? 3 : 1;
    l.passiveSummonTimer++;
    if (l.passiveSummonTimer >= 480 && l.activeSkeletons < skelCap) {
      l.passiveSummonTimer = 0;
      const zoneScale = Math.pow(1.3, ts.currentZone);
      const flagScale = 1 + ts.flagsCaptured * 0.05;
      const skelHp = Math.floor((UNIT_STATS.enemy.health + ts.flagsCaptured * 3) * zoneScale * flagScale * 0.7);
      const skelDmg = Math.floor((UNIT_STATS.enemy.damage + ts.flagsCaptured) * zoneScale * flagScale * 0.7);
      const toSpawn = Math.min(skelCount, skelCap - l.activeSkeletons);
      for (let si = 0; si < toSpawn; si++) {
        l.activeSkeletons++;
        ts.enemies.push({
          id: uid(), x: l.x - 20 + si * 15, y: GROUND_Y - ENEMY_SIZE,
          health: skelHp, maxHealth: skelHp,
          damage: skelDmg, speed: UNIT_STATS.enemy.speed * 0.5,
          attackRate: UNIT_STATS.enemy.attackRate, attackRange: UNIT_STATS.enemy.attackRange,
          frame: ts.frame, attackCooldown: 15,
          lane: Math.floor(Math.random() * 10) - 5,
          isLichSkeleton: true, lichOwnerId: l.id, defense: 0,
        });
      }
      const summonLabel = toSpawn > 1 ? `💀×${toSpawn} Summon!` : '💀 Summon!';
      ts.particles.push(makeParticle(l.x, l.y - 20, summonLabel, l.eliteVariantId === 'archlich' ? '#00ccaa' : '#aaaaaa'));
    }
  }
}

/** Halberd cleave: hit all nearby enemies (not the primary target) */
function halberdCleave(ax: number, primaryId: number, dmg: number, radius: number, ts: TickState) {
  forEachEnemy(ts, (e: any) => {
    if (e.id !== primaryId && Math.abs(ax - e.x) < radius && !(e.lungeTimer && e.lungeTimer > 0)) {
      const finalDmg = e.defense ? Math.max(1, dmg - e.defense) : dmg;
      e.health -= finalDmg;
      e.lastDamageTime = ts.frame;
    }
  });
}

/** Ally AI: movement, melee, ranged, wizard beam attacks, cleric healing */
export function processAllyAI(ts: TickState): void {
  const { hero, enemies, enemyArchers, enemyWraiths, enemyHounds, enemyLichs, enemyShadowAssassins, enemyFlameCallers, enemyCorruptedSentinels, enemyDungeonRats, enemyFireImps, enemyCursedKnights, flags } = ts;
  const boss = ts.boss;
  const allyDefense = 0; // endurance def handled at spawn
  const su = ts.shardUpgrades;
  const portalX = getPortalX(ts);

  // Pre-index aura carriers to avoid O(allies²) scan inside per-ally loop
  const hornCarriers: Array<{ x: number; id: number }> = [];
  const bannerCarriers: Array<{ x: number; id: number }> = [];
  for (const a of ts.allies) {
    if (a.health <= 0) continue;
    if (a.hasHorn) hornCarriers.push({ x: a.x, id: a.id });
    if (a.hasBanner) bannerCarriers.push({ x: a.x, id: a.id });
  }
  // Precompute horn/banner effect values (scales with ancient relic level)
  const hornEff = ts.ancientRelicsOwned.includes('warlordsHorn')
    ? getAncientEffect('warlordsHorn', getAncientRelicLevel(ts.ancientRelicCopies['warlordsHorn'] || 1))
    : { atkBonus: 0.10, healPct: 0.05 };
  const bannerEff = ts.ancientRelicsOwned.includes('warBanner')
    ? getAncientEffect('warBanner', getAncientRelicLevel(ts.ancientRelicCopies['warBanner'] || 1))
    : { dmgMult: 1.10 };
  // Pre-compute Hold! flag contest check (avoid per-ally flags.some scan)
  const holdContesting = tickHasArtifact(ts, 'hold') && ts.flags.some(f => !f.captured && (f.contestTimer || 0) > 0);

  // Pre-compute Crystal Ball mage count once (was O(allies²) — each magic ally scanned all allies)
  let aliveMageCount = 0;
  if (getRelicLevel(ts.relicCollection['crystalBall'] || 0) > 0) {
    for (const a of ts.allies) if (a.health > 0 && isUnitMagic(a.unitType)) aliveMageCount++;
  }

  // Pre-compute White Flag contesting flag once (was per-ally .find())
  const whiteFlagLv = getRelicLevel(ts.relicCollection['whiteFlag'] || 0);
  const contestingFlagForWhite = whiteFlagLv > 0 && ts.challengeId !== 'cursedLands'
    ? ts.flags.find(f => !f.captured && (f.contestTimer || 0) > 0) : null;

  // === Unified enemy array: build ONCE, scan once per ally instead of 11 arrays ===
  // skipTarget: true for lunging hounds / stealthed assassins (ranged can't target)
  // meleeBonus: extended melee detection range (wraith=35, boss=50)
  // isBoss: used by melee target priority
  type EnemyEntry = { x: number; skipTarget: boolean; meleeBonus: number; isBoss: boolean; ref: any };
  const allEnemies: EnemyEntry[] = [];
  for (const e of enemies) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyArchers) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyWraiths) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 35, isBoss: false, ref: e });
  for (const e of enemyHounds) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: !!(e.lungeTimer && e.lungeTimer > 0), meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyLichs) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyShadowAssassins) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: e.stealthTimer > 0, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyFlameCallers) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyCorruptedSentinels) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyDungeonRats) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyFireImps) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  for (const e of enemyCursedKnights) if (e.health > 0) allEnemies.push({ x: e.x, skipTarget: false, meleeBonus: 0, isBoss: false, ref: e });
  if (boss && boss.health > 0) allEnemies.push({ x: boss.x, skipTarget: false, meleeBonus: 50, isBoss: true, ref: boss });
  // Sort by x for better spatial locality (allies move left→right, enemies come right→left)
  allEnemies.sort((a2, b2) => a2.x - b2.x);

  for (const a of ts.allies) {
    if (a.health <= 0) continue;
    a.frame = ts.frame;
    // Friendly Slime AI: follow hero within 80px, no attack, just a cute companion
    if (a.isFriendlySlime) {
      const dist = a.x - hero.x;
      if (Math.abs(dist) > 80) {
        // Rush back toward hero
        a.x += Math.sign(hero.x - a.x) * (a.speed + 0.3);
      } else {
        // Wander back and forth within 80px of hero
        if (!a.slimeDir) a.slimeDir = Math.random() < 0.5 ? 1 : -1;
        a.x += a.slimeDir * a.speed * 0.5;
        // Reverse direction at edges of 80px range or randomly
        if (a.x > hero.x + 70) a.slimeDir = -1;
        if (a.x < hero.x - 70) a.slimeDir = 1;
        if (Math.random() < 0.005) a.slimeDir *= -1;
      }
      // No attack — just exist as a cute companion
      continue;
    }
    // Pet AI: wander near hero, attacking pets seek enemies
    if (a.isPet) {
      const petDef = a.petType ? getPetDef(a.petType) : null;
      const isAttacker = petDef?.effectType === 'attack';

      if (isAttacker) {
        // Attacking pet (goose): find nearest enemy within 200px of hero, run to it and attack
        let target: { health: number; x: number; y: number } | null = null;
        let targetDist = 200;
        for (const e of ts.enemies) {
          const d = Math.abs(e.x - hero.x);
          if (d < targetDist && e.health > 0) { targetDist = d; target = e; }
        }
        if (target) {
          const distToTarget = Math.abs(a.x - target.x);
          if (distToTarget > 20) {
            // Run toward target
            a.x += Math.sign(target.x - a.x) * (a.speed + 0.4);
          } else {
            // In melee range — attack on cooldown
            a.attackCooldown--;
            if (a.attackCooldown <= 0) {
              const dmg = Math.max(1, Math.floor(ts.hero.damage * ((petDef?.effectValue || 2) / 100)));
              target.health -= dmg;
              a.attackCooldown = petDef?.effectCooldown || 180;
              ts.particles.push(makeParticle(target.x, target.y - 10, `${dmg}`, '#ff8800'));
            }
          }
        } else {
          // No enemies nearby — wander back to hero
          const dist = a.x - hero.x;
          if (Math.abs(dist) > 60) {
            a.x += Math.sign(hero.x - a.x) * (a.speed + 0.3);
          } else {
            if (!a.slimeDir) a.slimeDir = Math.random() < 0.5 ? 1 : -1;
            a.x += a.slimeDir * a.speed * 0.5;
            if (a.x > hero.x + 50) a.slimeDir = -1;
            if (a.x < hero.x - 50) a.slimeDir = 1;
            if (Math.random() < 0.005) a.slimeDir *= -1;
          }
        }
      } else {
        // Passive pet: wander near hero like slime
        const dist = a.x - hero.x;
        if (Math.abs(dist) > 80) {
          a.x += Math.sign(hero.x - a.x) * (a.speed + 0.3);
        } else {
          if (!a.slimeDir) a.slimeDir = Math.random() < 0.5 ? 1 : -1;
          a.x += a.slimeDir * a.speed * 0.5;
          if (a.x > hero.x + 70) a.slimeDir = -1;
          if (a.x < hero.x - 70) a.slimeDir = 1;
          if (Math.random() < 0.005) a.slimeDir *= -1;
        }
      }
      continue;
    }
    // Courier AI: walk forward to farthest captured flag, collect gold, walk back, despawn
    if (a.isCourier) {
      const farthestCaptured = flags.filter(f => f.captured).sort((a2, b2) => b2.x - a2.x)[0];
      const targetX = farthestCaptured ? farthestCaptured.x : a.x;
      if (!a.courierReturning) {
        // Walk forward
        if (a.x < targetX - 5) {
          a.x += a.speed;
          // Make Way synergy: couriers earn gold passing captured flags
          if (tickHasSynergy(ts, 'econPair3')) {
            for (const f of flags) {
              if (f.captured && Math.abs(a.x - f.x) < 3) {
                const flagGold = Math.max(1, Math.floor(ts.goldEarned * 0.01 / 60));
                ts.goldEarned += flagGold;
                ts.particles.push(makeParticle(f.x, GROUND_Y - 40, `+${flagGold}g`, '#ffd700'));
              }
            }
          }
        } else {
          // Arrived at destination — collect gold
          ts.goldEarned += (a.courierGold || 0);
          ts.particles.push(makeParticle(a.x, GROUND_Y - 30, `+${a.courierGold || 0}g`, '#ffd700'));
          (a as any).courierReturning = true;
        }
      } else {
        // Walk back to portal
        if (a.x > portalX + 5) {
          a.x -= a.speed;
        } else {
          a.health = 0; // Despawn
        }
      }
      continue;
    }
    // Unyielding: knights regen 5% missing HP every 3s (180 ticks)
    if (a.unitType === 'knight' && tickHasArtifact(ts, 'unyielding') && ts.frame % 180 === 0 && a.health < a.maxHealth && a.health > 0) {
      const regen = Math.max(1, Math.floor((a.maxHealth - a.health) * 0.05));
      a.health = Math.min(a.maxHealth, a.health + regen);
    }
    // Tick down combat artifact timers
    if ((a.manaShieldTimer || 0) > 0) a.manaShieldTimer!--;
    if ((a.protectionTimer || 0) > 0) a.protectionTimer!--;
    // Slow debuff: halve speed while active (save base speed so it doesn't compound)
    const baseSpeed = a.speed;
    if ((a.slowTimer || 0) > 0) { a.slowTimer!--; a.speed *= 0.5; }
    // Rally Post: +0.2 speed while timer active
    if ((a.rallyTimer || 0) > 0) { a.rallyTimer!--; a.speed += 0.2; }
    // Banner aura: +0.1 speed while in banner range
    if ((a.bannerSpeedTimer || 0) > 0) { a.bannerSpeedTimer!--; a.speed += 0.1; }
    // Hero skill buffs
    const baseDamage = a.damage;
    const baseAttackRate = a.attackRate;
    if (tickSkillBuffActive(ts, 'march')) { a.speed *= 1.3; a.attackRate = Math.floor(a.attackRate / 1.3); }
    if (Math.abs(a.x - hero.x) < 120 && tickHasSkill(ts, 'heroicPresence')) a.attackRate = Math.floor(a.attackRate * 0.9);
    if (tickSkillBuffActive(ts, 'battleCry')) a.damage = Math.floor(a.damage * 1.3);
    if (tickHasSkill(ts, 'lastStand') && a.health < a.maxHealth * 0.3) a.damage = Math.floor(a.damage * 1.5);
    // Ranger passives
    if (tickHasSkill(ts, 'pathfinder') && Math.abs(a.x - hero.x) < 120) a.speed *= 1.15;
    if (tickSkillBuffActive(ts, 'eagleEye')) a.attackRate = Math.floor(a.attackRate * 0.9);
    // Command: allies within 30px of hero get +10% attack speed
    if (tickHasArtifact(ts, 'command') && Math.abs(a.x - hero.x) < 50) a.attackRate = Math.floor(a.attackRate * 0.9);
    // Hold!: contesting a flag -> all allies +5% atk speed (pre-computed above)
    if (holdContesting) {
      a.attackRate = Math.max(15, Math.floor(a.attackRate * 0.95));
    }
    // Ancient Relic aura effects from pre-indexed carriers (O(k) where k = carrier count, not O(allies))
    for (const horn of hornCarriers) {
      if (horn.id !== a.id && Math.abs(horn.x - a.x) < 120) {
        a.attackRate = Math.floor(a.attackRate * (1 - (hornEff.atkBonus || 0.10)));
      }
    }
    for (const banner of bannerCarriers) {
      if (banner.id !== a.id && Math.abs(banner.x - a.x) < 120) {
        a.damage = Math.floor(a.damage * (bannerEff.dmgMult || 1.10));
      }
    }
    // Hunker Down: defend mode — units within 20px of portal gain +3 defense
    const hunkerLv = getRelicLevel(ts.relicCollection['hunkerDown'] || 0);
    if (hunkerLv > 0 && ts.armyHoldMode && Math.abs(a.x - portalX) < 20) {
      a.defense = (a.defense || 0) + hunkerLv * 3;
    }
    // Crystal Ball: magic users +1% atk speed per other magic user on field (max 6%)
    if (isUnitMagic(a.unitType) && aliveMageCount > 1) {
      const crystalBonus = Math.min(0.06, (aliveMageCount - 1) * 0.01);
      if (crystalBonus > 0) a.attackRate = Math.max(15, Math.floor(a.attackRate * (1 - crystalBonus)));
    }
    // White Flag: contesting a flag — nearby allies (20px) regen 2% max HP/s
    if (contestingFlagForWhite && ts.frame % 60 === 0 && Math.abs(a.x - contestingFlagForWhite.x) < 20 && a.health < a.maxHealth) {
      const regen = Math.max(1, Math.floor(a.maxHealth * 0.02));
      a.health = Math.min(a.maxHealth, a.health + regen);
    }
    // Warlord's Horn self: heal nearby allies % HP/5s (every 300 frames, scales with level)
    if (a.hasHorn && ts.frame % 300 === 0 && ts.challengeId !== 'cursedLands') {
      for (const other of ts.allies) {
        if (other.id === a.id) continue;
        if (Math.abs(other.x - a.x) < 120 && other.health < other.maxHealth) {
          other.health = Math.min(other.maxHealth, other.health + Math.floor(other.maxHealth * (hornEff.healPct || 0.05)));
        }
      }
    }

    const isRanged = a.unitType === 'archer';
    const isWizard = a.unitType === 'wizard';
    const isCleric = a.unitType === 'cleric';
    let attackRange = a.attackRange || 30;
    if (isRanged || isWizard || isCleric) attackRange = Math.floor(attackRange * modAllyRangeMult(ts));
    const startAttackRange = (UNIT_STATS[a.unitType as keyof typeof UNIT_STATS] as any)?.startAttackRange || attackRange;

    // === Shard runtime timers ===
    // Knight bulwark: 10s cycle, 0.5s absorb
    if (a.unitType === 'knight' && su.knight_bulwark > 0) {
      a.bulwarkTimer = (a.bulwarkTimer || 0) + 1;
      if (a.bulwarkTimer >= 600) { a.bulwarkActive = 30; a.bulwarkTimer = 0; }
      if ((a.bulwarkActive || 0) > 0) a.bulwarkActive!--;
    }
    // Knight tempered: regen 1% HP/sec (applied once per second to avoid decimals)
    if (a.unitType === 'knight' && su.knight_tempered > 0 && a.health < a.maxHealth && ts.frame % 60 === 0) {
      const healAmt = Math.max(1, Math.floor(a.maxHealth * 0.01));
      a.health = Math.min(a.maxHealth, a.health + healAmt);
    }
    // Archer aiming: track stationary time (stop-and-fire + shard bonus)
    if (isRanged) {
      if (a.lastX !== undefined && Math.abs(a.x - a.lastX) < 0.1) {
        a.aimingTimer = (a.aimingTimer || 0) + 1;
      } else {
        a.aimingTimer = 0;
      }
      a.lastX = a.x;
    }
    // Steady Formation: ranged units standing still for 1.5s gain buff
    if (tickHasArtifact(ts, 'steadyFormation') && (a.unitType === 'archer' || a.unitType === 'wizard' || a.unitType === 'cleric')) {
      if (a.lastX !== undefined && Math.abs(a.x - a.lastX) < 0.1) {
        a.stillTimer = (a.stillTimer || 0) + 1;
      } else {
        a.stillTimer = 0;
      }
      a.lastX = a.x;
    }
    // Dodge cooldown tick
    if ((a.dodgeCooldown || 0) > 0) a.dodgeCooldown!--;
    // Strike Back timer tick
    if ((a as any).strikeBackTimer > 0) {
      (a as any).strikeBackTimer--;
      if ((a as any).strikeBackTimer <= 0) (a as any).strikeBackStacks = 0;
    }
    // Blessing attack speed buff expiry
    if ((a.atkSpeedBuffTimer || 0) > 0) {
      a.atkSpeedBuffTimer!--;
      if (a.atkSpeedBuffTimer === 0 && a.baseAttackRate) {
        a.attackRate = a.baseAttackRate;
      }
    }
    // Rhythm synergy: clear stacks when timer expires
    if ((a as any).rhythmStacks > 0) {
      if ((a.atkSpeedBuffTimer || 0) <= 0) (a as any).rhythmStacks = 0;
    }
    // Preparation synergy: hold mode stacks 1% speed+atk per second (max 10x)
    if (tickHasSynergy(ts, 'armyPair2') && ts.armyHoldMode && ts.frame % 60 === 0) {
      (a as any).prepStacks = Math.min(10, ((a as any).prepStacks || 0) + 1);
    }
    if (!ts.armyHoldMode) (a as any).prepStacks = 0;
    if ((a as any).prepStacks > 0) {
      const prepBonus = (a as any).prepStacks * 0.01;
      a.speed *= (1 + prepBonus);
      a.attackRate = Math.max(15, Math.floor(a.attackRate * (1 - prepBonus)));
    }
    // Empowered Glyphs timer tick-down (mages get +8% dmg while active)
    if ((a.empoweredGlyphsTimer || 0) > 0) a.empoweredGlyphsTimer!--;
    // Overflowing Grace: bonus HP decay
    if ((a as any).bonusHPTimer > 0) {
      (a as any).bonusHPTimer--;
      if ((a as any).bonusHPTimer <= 0 && (a as any).bonusHP > 0) {
        a.maxHealth -= (a as any).bonusHP;
        a.health = Math.min(a.health, a.maxHealth);
        (a as any).bonusHP = 0;
      }
    }

    // === Cleric: unified countdown cooldown ===
    if (isCleric) {
      if (a.attackCooldown > 0) a.attackCooldown--;

      // Priority 1: Heal wounded allies (Cursed Lands: no healing)
      let target: typeof ts.allies[0] | null = null;
      if (ts.challengeId !== 'cursedLands' && a.attackCooldown <= 0) {
        let lowestRatio = 1;
        for (const al of ts.allies) {
          if (al.id !== a.id && al.health < al.maxHealth && Math.abs(al.x - a.x) < attackRange) {
            const ratio = al.health / al.maxHealth;
            if (ratio < lowestRatio) { lowestRatio = ratio; target = al; }
          }
        }
      }
      if (target && a.attackCooldown <= 0) {
        let healAmount = Math.floor(a.damage * (1 + (a.healBonus || 0)));
        // Overflowing Grace synergy: overheal converts to bonus HP
        if (tickHasSynergy(ts, 'clericPair') && target.health + healAmount > target.maxHealth) {
          const overheal = (target.health + healAmount) - target.maxHealth;
          const maxBonusHP = Math.floor(target.maxHealth * 0.20);
          const currentBonus = ((target as any).bonusHP || 0);
          const bonusToAdd = Math.min(overheal, maxBonusHP - currentBonus);
          if (bonusToAdd > 0) {
            (target as any).bonusHP = currentBonus + bonusToAdd;
            (target as any).bonusHPTimer = 360; // 6s decay
            target.maxHealth += bonusToAdd;
            target.health = target.maxHealth;
            ts.particles.push(makeParticle(target.x + 10, target.y - 15, `+${bonusToAdd} SHIELD`, '#88ffcc'));
          }
        }
        target.health = Math.min(target.maxHealth, target.health + healAmount);
        a.attackCooldown = a.attackRate;
        // Sky heal glow visual at target
        ts.projectiles.push({ id: uid(), x: target.x + 10, y: target.y + (target.lane || 0), targetX: target.x + 10, targetY: target.y + (target.lane || 0), speed: 0, damage: 0, type: 'healBeam', duration: 30 });
        ts.particles.push(makeParticle(target.x + 10, target.y - 10, `+${healAmount}`, '#4aff4a'));
        // Reward: Blessed Aura (Cursed Lands completion) — spread heal (L1=50%, L2=75%, L3=100%)
        const blessedLv = ts.challengeCompletions.cursedLands || 0;
        if (blessedLv > 0) {
          const spreadTarget = ts.allies.find(al => al.id !== a.id && al.id !== target.id && al.health < al.maxHealth && Math.abs(al.x - target.x) < 80);
          if (spreadTarget) {
            const spreadHeal = Math.floor(healAmount * 0.50 * getChallengeRewardMult(blessedLv));
            spreadTarget.health = Math.min(spreadTarget.maxHealth, spreadTarget.health + spreadHeal);
            ts.particles.push(makeParticle(spreadTarget.x + 10, spreadTarget.y - 10, `+${spreadHeal}`, '#88ff88'));
          }
        }

        // Blessing: chance to grant attack speed buff (doesn't compound)
        if (su.cleric_blessing > 0 && Math.random() < su.cleric_blessing * 0.01) {
          if (!target.baseAttackRate) target.baseAttackRate = target.attackRate;
          target.attackRate = Math.max(15, Math.floor(target.baseAttackRate * 0.9));
          target.atkSpeedBuffTimer = 300;
          ts.particles.push(makeParticle(target.x + 10, target.y - 20, '✨BLESSED!', '#ffff00'));
        }

        // Group heal: chance to heal all nearby
        if (su.cleric_groupHeal > 0 && Math.random() < su.cleric_groupHeal * 0.01) {
          ts.allies.forEach(al => {
            if (al.id !== a.id && Math.abs(al.x - a.x) < 30) {
              al.health = Math.min(al.maxHealth, al.health + healAmount);
            }
          });
          ts.particles.push(makeParticle(a.x + 10, a.y - 20, '💖AOE HEAL!', '#ff88cc'));
        }

        // Echoed Blessing: 25% chance to chain heal to nearest different ally
        if (tickHasArtifact(ts, 'echoedBlessing') && Math.random() < 0.25) {
          // Find nearest wounded ally without filter+sort (O(n) single pass)
          let chainTarget: typeof ts.allies[0] | null = null;
          let closestDist = Infinity;
          for (const other of ts.allies) {
            if (other.id !== target.id && other.health > 0 && other.health < other.maxHealth) {
              const d = Math.abs(other.x - target.x);
              if (d < closestDist) { closestDist = d; chainTarget = other; }
            }
          }
          if (chainTarget) {
            const chainHeal = Math.max(1, Math.floor(healAmount * 0.5));
            chainTarget.health = Math.min(chainTarget.maxHealth, chainTarget.health + chainHeal);
            ts.projectiles.push({ id: uid(), x: target.x, y: target.y + (target.lane || 0) + 8, targetX: chainTarget.x, speed: -8, damage: 0, type: 'clericChain' });
            ts.particles.push(makeParticle(chainTarget.x + 10, chainTarget.y, `+${chainHeal} CHAIN`, '#44ff88'));
          }
        }

        // Protection: 25% chance on heal to grant 40% damage reduction for 3s
        if (tickHasArtifact(ts, 'protection') && Math.random() < 0.25) {
          (target as any).protectionTimer = 180; // 3s at 60fps
          ts.particles.push(makeParticle(target.x + 10, target.y - 10, '🛡️', '#ffd700'));
        }

        // Mass resurrect: 1% chance to resurrect all dead units
        if (su.cleric_massResurrect > 0 && Math.random() < 0.01) {
          for (let i = 0; i < ts.unitSlots.length; i++) {
            if (!ts.unitSlots[i].alive) {
              ts.unitSlots[i] = { ...ts.unitSlots[i], respawnTimer: 0 };
            }
          }
          ts.particles.push(makeParticle(a.x + 10, a.y - 30, '⚡MASS RESURRECT!', '#ffff00'));
        }

        // Also heal hero if nearby and wounded
        if (Math.abs(hero.x - a.x) < attackRange && hero.health < hero.maxHealth) {
          hero.health = Math.min(hero.maxHealth, hero.health + Math.floor(healAmount * 0.5));
        }

        a.speed = baseSpeed; a.damage = baseDamage; a.attackRate = baseAttackRate;
        continue;
      }

      // Priority 2: Attack enemies at 20% damage (single scan of unified array)
      let clericTarget: any = null;
      for (const e of allEnemies) {
        if (e.skipTarget) continue;
        const d = e.x - a.x;
        if (d > 0 && d < attackRange) { clericTarget = e.ref; break; }
      }
      if (clericTarget && a.attackCooldown <= 0) {
        a.attackCooldown = a.attackRate;
        let clericDmg = Math.floor(a.damage * 0.2);
        // Crit roll: base 3% + Glasses (5% per level), Enchanters 4pc (10%), Scouting 5pc first attack (10%), War Shrine (3% per building)
        let clericCrit = false;
        let clericCritChance = 0.03;
        const clericGlassesLv = getRelicLevel(ts.relicCollection['glasses'] || 0);
        if (clericGlassesLv > 0) clericCritChance += clericGlassesLv * 0.05;
        if (tickHasSetBonus(ts, 'enchantersSet', 4)) clericCritChance += 0.10;
        if (tickHasSetBonus(ts, 'scoutingSet', 5) && !a.firstAttackDone) {
          clericCritChance += 0.10;
          a.firstAttackDone = true;
        }
        { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) clericCritChance += 0.03 * wsN * bpM; }
        // Regalia: per-unit + category + army crit chance
        clericCritChance += (getRegaliaBonus(ts, 'critChance', { target: 'cleric' }) + getRegaliaBonus(ts, 'catCritChance', { category: 'magic' }) + getRegaliaBonus(ts, 'armyCritChance')) / 100;
        let clericCritMult = 1.5;
        const clericCritDmgBonus = getRegaliaBonus(ts, 'critDamage', { target: 'cleric' });
        if (clericCritDmgBonus > 0) clericCritMult += clericCritDmgBonus / 100;
        if (clericCritChance > 0 && Math.random() < clericCritChance) {
          clericDmg = Math.floor(clericDmg * clericCritMult);
          clericCrit = true;
        }
        // Fractured World: ally + magic damage multipliers
        clericDmg = Math.floor(clericDmg * modAllyDmgMult(ts) * modMagicDmgMult(ts));
        const target = clericTarget as any;
        ts.projectiles.push({ id: uid(), x: a.x + 15, y: a.y + (a.lane || 0) + 8, targetX: target.x, speed: -10, damage: clericDmg, type: 'clericBolt', crit: clericCrit });
      } else if (!clericTarget) {
        // Dungeon: follow dungeonAllyMode; Normal: advance to next flag
        if (ts.inDungeon && ts.dungeonType !== 'timed') {
          if (ts.dungeonAllyMode === 'advance') a.x += a.speed;
          else if (ts.dungeonAllyMode === 'retreat' && a.x > ts.dungeonArenaLeftX + 90) a.x -= a.speed;
        } else {
          const nextFlag = flags.find(f => !f.captured && f.x > a.x);
          if (nextFlag) a.x += a.speed;
        }
      }
      // Wave dungeon wall clamp
      if (ts.inDungeon && ts.dungeonType !== 'timed') {
        const wallX = ts.dungeonArenaSpawnX - 1;
        if (a.x > wallX) a.x = wallX;
      }
      a.speed = baseSpeed; a.damage = baseDamage; a.attackRate = baseAttackRate;
      continue;
    }

    // Conjurer AI: walks forward, periodically places crystal turrets
    if (a.unitType === 'conjurer') {
      const conjurerStats = UNIT_STATS.conjurer;
      const maxTurrets = conjurerStats.maxTurrets + (su.conjurer_crystalArray || 0);
      let ownerTurrets = 0; for (const t of ts.crystalTurrets) if (t.ownerId === a.id) ownerTurrets++;

      // Placement cooldown
      a.attackCooldown++;
      if (a.attackCooldown >= a.attackRate && ownerTurrets < maxTurrets) {
        a.attackCooldown = 0;
        // Turret inherits conjurer stats
        const turretHp = Math.floor(a.maxHealth * conjurerStats.turretHpRatio);
        let turretAtkRate: number = conjurerStats.turretAttackRate;
        if (su.conjurer_arcaneAttunement > 0) turretAtkRate = Math.max(15, Math.floor(turretAtkRate * (1 - su.conjurer_arcaneAttunement * 0.06)));
        const turretDuration = conjurerStats.turretDuration + (su.conjurer_sustainedChannel || 0) * 180;
        ts.crystalTurrets.push({
          id: uid(),
          ownerId: a.id,
          x: a.x + 12,
          y: GROUND_Y - 20,
          health: turretHp,
          maxHealth: turretHp,
          damage: a.damage,
          defense: 0,
          attackRate: turretAtkRate,
          attackRange: a.attackRange,
          attackCooldown: 0,
          frame: ts.frame,
          duration: turretDuration,
          maxDuration: turretDuration,
          markOnHit: su.conjurer_prismaticShards > 0,
        });
        ts.particles.push(makeParticle(a.x + 12, a.y - 10, '💎 Conjure!', '#55ddcc'));
      }

      // Movement: wave dungeon or normal
      if (ts.inDungeon && ts.dungeonType !== 'timed') {
        if (ts.dungeonAllyMode === 'advance') a.x += a.speed;
        else if (ts.dungeonAllyMode === 'retreat' && a.x > ts.dungeonArenaLeftX + 90) a.x -= a.speed;
      } else {
        const keepDist = 200; // stop well behind front line, turrets cover the gap
        let enemyNearby = false;
        for (const e of allEnemies) { const d = e.x - a.x; if (d > 0 && d < keepDist) { enemyNearby = true; break; } }
        if (!enemyNearby) {
          const nextFlag = flags.find(f => !f.captured && f.x > a.x);
          if (nextFlag) a.x += a.speed;
        }
      }
      // Wave dungeon wall clamp
      if (ts.inDungeon && ts.dungeonType !== 'timed') {
        const wallX = ts.dungeonArenaSpawnX - 1;
        if (a.x > wallX) a.x = wallX;
      }

      a.speed = baseSpeed; a.damage = baseDamage; a.attackRate = baseAttackRate;
      continue;
    }

    // Bombard AI: slow artillery — lobs arcing cannonball at densest enemy cluster
    if (a.unitType === 'bombard') {
      const bombardStats = UNIT_STATS.bombard;
      a.attackCooldown++;
      if (a.attackCooldown >= a.attackRate) {
        // Collect all enemies in range (single scan of unified array)
        const targets: Array<{ x: number }> = [];
        for (const e of allEnemies) {
          if (e.skipTarget) continue;
          const d = e.x - a.x;
          if (d > 0 && d < attackRange) targets.push(e.ref);
        }

        if (targets.length > 0) {
          // Find densest cluster center (within 40px of each other)
          let bestX = targets[0].x;
          let bestCount = 1;
          for (const t of targets) {
            let count = 0;
            for (const t2 of targets) { if (Math.abs(t.x - t2.x) < 40) count++; }
            if (count > bestCount) { bestCount = count; bestX = t.x; }
          }
          a.attackCooldown = 0;

          // Calculate damage with bonuses
          let shotDmg = a.damage;
          // Forge building bonus
          { const { forge: forgeN, blueprintsMult: bpM } = ts.buildingCounts; if (forgeN > 0) shotDmg += Math.floor(2 * forgeN * bpM); }
          // Crit roll
          let bombCrit = false;
          let bombCritChance = 0.03;
          { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) bombCritChance += 0.03 * wsN * bpM; }
          const bombCat = isUnitInCategory(a.unitType, 'ranged') ? 'ranged' : 'magic';
          bombCritChance += (getRegaliaBonus(ts, 'critChance', { target: a.unitType }) + getRegaliaBonus(ts, 'catCritChance', { category: bombCat }) + getRegaliaBonus(ts, 'armyCritChance')) / 100;
          let bombCritMult = 1.5;
          const bombCritDmgBonus = getRegaliaBonus(ts, 'critDamage', { target: a.unitType });
          if (bombCritDmgBonus > 0) bombCritMult += bombCritDmgBonus / 100;
          if (bombCritChance > 0 && Math.random() < bombCritChance) {
            shotDmg = Math.floor(shotDmg * bombCritMult);
            bombCrit = true;
          }

          // Blast Radius shard: +4px per level
          const blastBonus = (su.bombard_blastRadius || 0) * 4;
          // Create arcing projectile — damage applied on LANDING in combat.ts
          ts.projectiles.push({
            id: uid(),
            x: a.x + 15,
            y: a.y + (a.lane || 0) + 5,
            startX: a.x + 15,
            startY: a.y + (a.lane || 0) + 5,
            targetX: bestX,
            targetY: GROUND_Y - 10,
            speed: -5,
            damage: shotDmg,
            type: 'bombardShot',
            arcHeight: bombardStats.arcHeight,
            aoeRadius: bombardStats.aoeRadius + blastBonus,
          });
          if (bombCrit) {
            ts.particles.push(makeCritParticle(a.x + 15, a.y - 10, shotDmg));
          } else {
            ts.particles.push(makeParticle(a.x + 15, a.y - 10, '💣', '#8b6914'));
          }
        }
      }

      // Movement: wave dungeon or normal
      if (ts.inDungeon && ts.dungeonType !== 'timed') {
        if (ts.dungeonAllyMode === 'advance') a.x += a.speed;
        else if (ts.dungeonAllyMode === 'retreat' && a.x > ts.dungeonArenaLeftX + 90) a.x -= a.speed;
      } else {
        const keepDist = 250;
        let closestEnemyDist = Infinity;
        for (const e of allEnemies) { const d = e.x - a.x; if (d > 0 && d < closestEnemyDist) closestEnemyDist = d; }
        if (closestEnemyDist >= keepDist || closestEnemyDist === Infinity) {
          // No enemies nearby — advance to next flag
          const nextFlag = flags.find(f => !f.captured && f.x > a.x);
          if (nextFlag) a.x += a.speed;
        }
      }
      // Wave dungeon wall clamp
      if (ts.inDungeon && ts.dungeonType !== 'timed') {
        const wallX = ts.dungeonArenaSpawnX - 1;
        if (a.x > wallX) a.x = wallX;
      }

      a.speed = baseSpeed; a.damage = baseDamage; a.attackRate = baseAttackRate;
      continue;
    }

    // Royal Guard patrol: stay near hero instead of advancing to flags
    if (a.isRoyalGuard) {
      const targetX = hero.x - 30;
      const distToHero = Math.abs(a.x - hero.x);
      if (distToHero > 60) {
        // Rush back to hero
        a.x += Math.sign(hero.x - a.x) * a.speed;
      }
      // Use archer ranged attack logic while near hero (single scan of unified array)
      let rgTarget: any = null;
      for (const e of allEnemies) {
        if (e.skipTarget) continue;
        const d = e.x - a.x;
        if (d > 0 && d < attackRange) { rgTarget = e.ref; break; }
      }
      if (rgTarget) {
        const aimingDelay = tickHasArtifact(ts, 'quickdraw') ? 0 : 48;
        if ((a.aimingTimer || 0) >= aimingDelay) {
          a.attackCooldown++;
          if (a.attackCooldown >= a.attackRate) {
            a.attackCooldown = 0;
            const nearHeroR = Math.abs(a.x - hero.x) < 120;
            const auraDmgR = 0;
            let rgDmg = a.damage + auraDmgR;
            // Ancient Relic: Quiver — chance for double damage arrows (scales with level)
            if (ts.ancientRelicsOwned.includes('quiver')) {
              const qEff = getAncientEffect('quiver', getAncientRelicLevel(ts.ancientRelicCopies['quiver'] || 1));
              if (Math.random() < (qEff.chance || 0.05)) rgDmg *= 2;
            }
            const target = rgTarget as any;
            ts.projectiles.push({ id: uid(), x: a.x + 20, y: a.y + (a.lane || 0) + 10, targetX: target.x, speed: -8, damage: rgDmg, type: 'allyArrow' });
          }
        }
      } else if (distToHero <= 60) {
        // Drift toward ideal position when no enemies
        if (Math.abs(a.x - targetX) > 5) a.x += Math.sign(targetX - a.x) * a.speed * 0.5;
      }
      a.speed = baseSpeed; a.damage = baseDamage; a.attackRate = baseAttackRate;
      continue;
    }

    // === Unified enemy scanning: ONE pass over allEnemies for melee/ranged/wizard ===
    const meleeRange = attackRange;
    const maxMeleeDetect = Math.max(meleeRange, 50); // boss=50, wraith=35
    let meleeBlocked = false;
    let meleeTarget: EnemyEntry | null = null;
    let rangedTarget: EnemyEntry | null = null; // first targetable enemy in ranged range
    let wizardHasTarget = false;
    for (const e of allEnemies) {
      const d = e.x - a.x;
      // Melee blocked check (includes extended range for wraith/boss)
      if (!meleeBlocked && !e.skipTarget && d > 0) {
        const effectiveRange = e.meleeBonus ? Math.max(meleeRange, e.meleeBonus) : meleeRange;
        if (d < effectiveRange) { meleeBlocked = true; meleeTarget = e; }
      }
      // Ranged target (first in range, skip untargetable)
      if (isRanged && !rangedTarget && !e.skipTarget && d > 0 && d < attackRange) {
        rangedTarget = e;
      }
      // Wizard beam range (d > -30, includes behind slightly)
      if (isWizard && !wizardHasTarget && !e.skipTarget && d > -30 && d < attackRange) {
        wizardHasTarget = true;
      }
    }
    const enemyInRange = isRanged && rangedTarget;
    const wizardEnemyInRange = isWizard && wizardHasTarget;

    // Apprentice AOE beam
    if (isWizard && wizardEnemyInRange) {
      a.attackCooldown++;
      if (a.attackCooldown >= a.attackRate) {
        a.attackCooldown = 0;
        // Champion's Aura: +4 dmg near hero
        let wizDmg = a.damage;
        // Empowered Glyphs: +8% dmg while active
        if ((a.empoweredGlyphsTimer || 0) > 0) wizDmg = Math.floor(wizDmg * 1.08);
        const hasFireRunes = tickHasArtifact(ts, 'fireRunes') && Math.random() < 0.20;
        // Arcane Tempo synergy: consume buff on non-fireball attack for +50% dmg
        if (!hasFireRunes && (a as any).arcaneTempoBuff) {
          wizDmg = Math.floor(wizDmg * 1.5);
          (a as any).arcaneTempoBuff = false;
        }
        // Crit roll: base 3% + Glasses (5% per level), Enchanters 4pc (10%), Scouting 5pc first attack (10%), War Shrine (3% per building)
        let wizCrit = false;
        let wizCritChance = 0.03;
        const glassesLv = getRelicLevel(ts.relicCollection['glasses'] || 0);
        if (glassesLv > 0) wizCritChance += glassesLv * 0.05;
        if (tickHasSetBonus(ts, 'enchantersSet', 4)) wizCritChance += 0.10;
        if (tickHasSetBonus(ts, 'scoutingSet', 5) && !a.firstAttackDone) {
          wizCritChance += 0.10;
          a.firstAttackDone = true;
        }
        { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) wizCritChance += 0.03 * wsN * bpM; }
        // Regalia: per-unit + category + army crit chance
        wizCritChance += (getRegaliaBonus(ts, 'critChance', { target: 'wizard' }) + getRegaliaBonus(ts, 'catCritChance', { category: 'magic' }) + getRegaliaBonus(ts, 'armyCritChance')) / 100;
        let wizCritMult = 1.5;
        const wizCritDmgBonus = getRegaliaBonus(ts, 'critDamage', { target: 'wizard' });
        if (wizCritDmgBonus > 0) wizCritMult += wizCritDmgBonus / 100;
        if (wizCritChance > 0 && Math.random() < wizCritChance) {
          wizDmg = Math.floor(wizDmg * wizCritMult);
          wizCrit = true;
        }
        // Fractured World: ally + magic damage multipliers
        wizDmg = Math.floor(wizDmg * modAllyDmgMult(ts) * modMagicDmgMult(ts));
        const hasBurn = su.wizard_elemental > 0 || hasFireRunes;
        const bRate = hasFireRunes ? 0.02 : 0.01;
        const bDuration = hasFireRunes ? 180 : 240;
        // Fire Runes: spawn fireball visual when triggered
        if (hasFireRunes) {
          const wizHitRange = (ex: number) => { const d = ex - a.x; return d > -30 && d < attackRange; };
          const fbTargetEnemy = enemies.find(e => wizHitRange(e.x)) || enemyArchers.find(ar => wizHitRange(ar.x));
          const fbX = fbTargetEnemy ? fbTargetEnemy.x : a.x + attackRange * 0.6;
          ts.projectiles.push({ id: uid(), x: a.x + 20, y: a.y + (a.lane || 0) + 5, targetX: fbX, speed: -10, damage: 0, type: 'fireball' });
        }
        // Arcane Tempo synergy: after fireball, next basic attack deals +50% dmg
        if (hasFireRunes && tickHasSynergy(ts, 'wizardPair')) {
          (a as any).arcaneTempoBuff = true;
        }
        // Mana Tap: chance to cast fireball (traveling AOE)
        if (su.wizard_manaTap > 0 && Math.random() < su.wizard_manaTap * 0.01) {
          const fbDmg = Math.floor(a.damage * 1.2);
          const fbTarget = enemies.find(e => e.x - a.x > 50 && e.x - a.x < 200);
          if (fbTarget) {
            ts.projectiles.push({ id: uid(), x: a.x + 20, y: a.y + (a.lane || 0) + 5, targetX: fbTarget.x, speed: -10, damage: fbDmg, type: 'fireball', aoeRadius: 51 });
          }
        }
        // Wizard beam: traveling AOE projectile
        ts.projectiles.push({ id: uid(), x: a.x + 20, y: a.y + (a.lane || 0) + 5, targetX: a.x + attackRange, speed: -14, damage: wizDmg, type: 'wizardBeam', crit: wizCrit, startX: a.x, burnRate: hasBurn ? bRate : undefined, burnDuration: hasBurn ? bDuration : undefined });
        // Channeled Energy artifact: 3% chance to trigger instant cast on a nearby mage
        if (tickHasArtifact(ts, 'channeledEnergy') && Math.random() < 0.03) {
          const nearbyMage = ts.allies.find(m => m.id !== a.id && m.health > 0 && (m.unitType === 'wizard' || m.unitType === 'cleric') && Math.abs(m.x - a.x) < 80);
          if (nearbyMage) {
            nearbyMage.attackCooldown = nearbyMage.attackRate; // Ready to fire next tick
            ts.particles.push(makeParticle(nearbyMage.x + 10, nearbyMage.y - 10, '⚡ INSTANT!', '#8844ff'));
          }
        }
      }
    } else if (isRanged && enemyInRange) {
      const hasQuickdraw = tickHasArtifact(ts, 'quickdraw');
      const aimingDelay = hasQuickdraw ? 0 : 48;
      if ((a.aimingTimer || 0) < aimingDelay) {
        // Restore base stats before early return to prevent buff compounding
        a.speed = baseSpeed; a.damage = baseDamage; a.attackRate = baseAttackRate;
        continue;
      }
      // Quickdraw: keep advancing while firing (run-and-gun)
      if (hasQuickdraw) {
        const nextFlag = flags.find(f => !f.captured && f.x > a.x);
        if (nextFlag && !meleeBlocked) {
          a.x += a.speed;
        }
      }
      // Archer ranged attack
      a.attackCooldown++;
      if (a.attackCooldown >= a.attackRate) {
        a.attackCooldown = 0;
        // Champion's Aura: +4 dmg near hero; Aiming bonus for archers
        const nearHeroR = Math.abs(a.x - hero.x) < 120;
        const auraDmgR = 0;
        let aimDmg = a.damage + auraDmgR;
        if (isRanged && su.archer_aiming > 0 && (a.aimingTimer || 0) > 0) {
          aimDmg = Math.floor((a.damage + auraDmgR) * (1 + (a.aimingTimer || 0) / 60 * 0.01));
        }
        // Serrated Tips: 30% chance for double damage
        if (tickHasArtifact(ts, 'serratedTips') && Math.random() < 0.30) {
          aimDmg = Math.floor(aimDmg * 2);
        }
        // Observation: +10% dmg vs enemies >100px away (use rangedTarget from unified scan)
        const closestEnemyDist = rangedTarget ? rangedTarget.x - a.x : Infinity;
        if (tickHasArtifact(ts, 'observation') && closestEnemyDist > 100) {
          aimDmg = Math.floor(aimDmg * 1.10);
        }
        // Crit roll: base crit + Scouting 5pc Advantage (first attack 10%) + War Shrine (3% per building) + Regalia
        let archerCrit = false;
        let archerCritChance = a.unitType === 'archer' ? 0.05 : isUnitMagic(a.unitType) ? 0.03 : 0.01;
        if (tickHasSetBonus(ts, 'scoutingSet', 5) && !a.firstAttackDone) {
          archerCritChance += 0.10;
          a.firstAttackDone = true;
        }
        { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) archerCritChance += 0.03 * wsN * bpM; }
        // Regalia: per-unit + category + army crit chance
        const archerCat = isUnitInCategory(a.unitType, 'melee') ? 'melee' : isUnitInCategory(a.unitType, 'ranged') ? 'ranged' : 'magic';
        archerCritChance += (getRegaliaBonus(ts, 'critChance', { target: a.unitType }) + getRegaliaBonus(ts, 'catCritChance', { category: archerCat }) + getRegaliaBonus(ts, 'armyCritChance')) / 100;
        let archerCritMult = 1.5;
        const archerCritDmgBonus = getRegaliaBonus(ts, 'critDamage', { target: a.unitType });
        if (archerCritDmgBonus > 0) archerCritMult += archerCritDmgBonus / 100;
        if (archerCritChance > 0 && Math.random() < archerCritChance) {
          aimDmg = Math.floor(aimDmg * archerCritMult);
          archerCrit = true;
        }
        // Fractured World: ally + ranged damage multipliers
        aimDmg = Math.floor(aimDmg * modAllyDmgMult(ts) * modRangedDmgMult(ts));
        // Target from unified scan (rangedTarget already found above)
        const tX = rangedTarget ? rangedTarget.x : a.x;
        const rangedRef = rangedTarget ? rangedTarget.ref : null;
        // Double shot: artifact (15%) + shard doubleTap stack
        let shotCount = 1;
        if (isRanged) {
          const artifactDouble = false; // serratedTips handled in Phase 3
          const shardDouble = su.archer_doubleTap > 0 && Math.random() < su.archer_doubleTap * 0.1;
          if (artifactDouble || shardDouble) shotCount = 2;
        }
        ts.projectiles.push({ id: uid(), x: a.x + 20, y: a.y + (a.lane || 0) + 10, targetX: tX, speed: -8, damage: aimDmg, type: 'allyArrow', crit: archerCrit });
        if (shotCount > 1) ts.projectiles.push({ id: uid(), x: a.x + 20, y: a.y + (a.lane || 0) + 14, targetX: tX, speed: -8, damage: aimDmg, type: 'allyArrow', crit: archerCrit });
        // Piercing Shots synergy: 20% chance arrow chains to a second enemy for 50% damage
        if (tickHasSynergy(ts, 'rangedPair') && Math.random() < 0.20) {
          const primaryId = rangedRef?.id ?? -1;
          let chainTarget: { x: number; y: number } | null = null;
          for (const e of allEnemies) {
            if (e.skipTarget) continue;
            if (e.ref.id !== primaryId && Math.abs(e.x - tX) < 60) { chainTarget = e.ref; break; }
          }
          if (chainTarget) {
            const chainDmg = Math.floor(aimDmg * 0.5);
            ts.projectiles.push({ id: uid(), x: tX, y: a.y + (a.lane || 0) + 10, targetX: chainTarget.x, speed: -8, damage: chainDmg, type: 'allyArrow' });
          }
        }
        // Rhythm synergy: +2% atk speed per arrow, stacks 5x, lasts 2s
        if (tickHasSynergy(ts, 'archerPair')) {
          const rhythmStacks = Math.min(5, ((a as any).rhythmStacks || 0) + 1);
          (a as any).rhythmStacks = rhythmStacks;
          a.atkSpeedBuffTimer = 120; // 2s
          a.attackRate = Math.max(15, Math.floor(a.attackRate * (1 - rhythmStacks * 0.02)));
        }
      }
    } else if (meleeBlocked && meleeTarget) {
      // Melee combat — target already found from unified scan above
      const target: any = meleeTarget.ref;
      const targetId = target.id ?? -1;
      const isBoss = meleeTarget.isBoss;

      if (target) {
        a.attackCooldown++;
        if (a.attackCooldown >= a.attackRate) {
          a.attackCooldown = 0;
          const nearHero = Math.abs(a.x - hero.x) < 120;
          const auraDmg = 0;
          let meleeDmg = a.damage + auraDmg;
          // Strike Back synergy: +5% dmg per stack after being hit
          if ((a as any).strikeBackStacks > 0 && (a as any).strikeBackTimer > 0) {
            meleeDmg = Math.floor(meleeDmg * (1 + (a as any).strikeBackStacks * 0.05));
            (a as any).strikeBackStacks = 0;
          }
          // First Strike: halberd deals 2x damage on first hit
          if (a.unitType === 'halberd' && tickHasArtifact(ts, 'firstStrike') && !a.firstStrikeUsed) {
            a.firstStrikeUsed = true;
            meleeDmg = Math.floor(meleeDmg * 2);
            ts.particles.push(makeParticle(a.x + 20, a.y - 15, '⚔️ FIRST STRIKE!', '#ffaa00'));
          }
          if (a.unitType === 'halberd' && su.halberd_impale > 0 && Math.random() < su.halberd_impale * 0.15) {
            meleeDmg *= 2;
            ts.particles.push(makeParticle(a.x + 20, a.y - 10, '🔱IMPALE!', '#cc6b2e'));
          }
          // Crit roll: base crit + Scouting 5pc Advantage (first attack 10%) + War Shrine (3% per building) + Regalia
          let meleeCrit = false;
          let meleeCritChance = 0.01;
          if (tickHasSetBonus(ts, 'scoutingSet', 5) && !a.firstAttackDone) {
            meleeCritChance += 0.10;
            a.firstAttackDone = true;
          }
          { const { warShrine: wsN, blueprintsMult: bpM } = ts.buildingCounts; if (wsN > 0) meleeCritChance += 0.03 * wsN * bpM; }
          // Regalia: per-unit + category (melee) + army crit chance
          meleeCritChance += (getRegaliaBonus(ts, 'critChance', { target: a.unitType }) + getRegaliaBonus(ts, 'catCritChance', { category: 'melee' }) + getRegaliaBonus(ts, 'armyCritChance')) / 100;
          let meleeCritMult = 1.5;
          const meleeCritDmgBonus = getRegaliaBonus(ts, 'critDamage', { target: a.unitType });
          if (meleeCritDmgBonus > 0) meleeCritMult += meleeCritDmgBonus / 100;
          if (meleeCritChance > 0 && Math.random() < meleeCritChance) {
            meleeDmg = Math.floor(meleeDmg * meleeCritMult);
            meleeCrit = true;
          }
          // Fractured World: ally + melee damage multipliers
          meleeDmg = Math.floor(meleeDmg * modAllyDmgMult(ts) * modMeleeDmgMult(ts));
          const def = target.defense || 0;
          let dmg = def ? Math.max(1, meleeDmg - def) : meleeDmg;
          if (isBoss) dmg = absorbBossShield(boss, dmg);
          target.health -= dmg; target.lastDamageTime = ts.frame;
          if (isBoss) ts.boss = boss;
          if (meleeCrit) {
            ts.particles.push(makeCritParticle(target.x + (isBoss ? 32 : 12), target.y - 10, dmg));
          } else {
            ts.particles.push(makeParticle(target.x + (isBoss ? 32 : 12), target.y - 10, `-${dmg}`, '#7af'));
          }
          // Depth of Attack: knights hit nearby enemies (AOE radius 40)
          if (a.unitType === 'knight' && tickHasArtifact(ts, 'depthOfAttack')) {
            halberdCleave(a.x, targetId, meleeDmg, 40, ts);
          }
          // Halberd cleave: hit all nearby enemies
          if (a.unitType === 'halberd') {
            const cleaveRadius = 35 + (su.halberd_wideSweep || 0) * 10;
            halberdCleave(a.x, targetId, meleeDmg, cleaveRadius, ts);
          }
          // Linebreak: halberd attacks slow enemies 20% for 8s (480 ticks)
          if (a.unitType === 'halberd' && tickHasArtifact(ts, 'linebreak')) {
            (target as any).slowTimer = 480;
            (target as any).slowAmount = 0.20;
            // Wounded synergy: slowed enemies also attack 20% slower
            if (tickHasSynergy(ts, 'halberdPair')) {
              (target as any).atkSlowTimer = 480;
            }
          }
        }
      }
    } else {
      // Not in combat — pre-charge cooldown so first attack comes quickly
      // Halberds get "first strike"; Wizards fire beam quickly on contact
      const readyCooldown = a.unitType === 'halberd' ? Math.max(a.attackRate - 5, 15)
        : isWizard ? Math.max(a.attackRate - 10, 15)
        : 15;
      if (a.attackCooldown < readyCooldown) a.attackCooldown = readyCooldown;
      if (ts.inDungeon && ts.dungeonType !== 'timed') {
        // Wave dungeon movement: advance/hold/retreat
        if (ts.dungeonAllyMode === 'advance') {
          a.x += a.speed;
        } else if (ts.dungeonAllyMode === 'retreat') {
          if (a.x > ts.dungeonArenaLeftX + 90) a.x -= a.speed;
        }
        // 'hold' = stay put
      } else if (ts.armyHoldMode && !a.released) {
        // HOLD MODE: form up near portal based on unit role
        const ut = a.unitType;
        const isMelee = ut === 'soldier' || ut === 'knight' || ut === 'halberd';
        const isMagic = ut === 'wizard' || ut === 'cleric';
        const categoryOffset = isMelee ? 50 : isMagic ? -20 : 0; // melee front, magic back, ranged mid
        const idJitter = (a.id % 5) * 6; // spread within category
        const holdTargetX = portalX + categoryOffset + idJitter;
        const distToHold = holdTargetX - a.x;
        if (Math.abs(distToHold) > 5) {
          a.x += Math.sign(distToHold) * Math.min(a.speed, Math.abs(distToHold));
        }
      } else {
        // Normal advance toward next flag, capped by active boss
        const bossAlive = boss && boss.health > 0;
        if (bossAlive && a.x >= boss.x) {
          // Overshot past boss (e.g. arrived before boss spawned) — walk back
          a.x -= a.speed;
        } else {
          const nextFlag = flags.find(f => !f.captured && f.x > a.x);
          if (nextFlag) {
            // Cap advance at boss position, or at boss flag even before boss spawns
            const bossFlagX = !bossAlive ? flags.find(f => f.isBossFlag && !f.captured)?.x : undefined;
            const bossAdvanceCap = bossAlive ? boss.x - (a.attackRange - 10)
              : bossFlagX !== undefined ? bossFlagX - 10
              : Infinity;
            if (a.x < bossAdvanceCap) a.x += a.speed;
            if (a.x > bossAdvanceCap) a.x = bossAdvanceCap;
          }
        }
      }
    }

    // Wave dungeon: clamp allies at penultimate flag (impassable wall)
    if (ts.inDungeon && ts.dungeonType !== 'timed') {
      const wallX = ts.dungeonArenaSpawnX - 1; // Just before enemy spawn point
      if (a.x > wallX) a.x = wallX;
    }

    a.speed = baseSpeed;
    a.damage = baseDamage;
    a.attackRate = baseAttackRate;
  }

  // Resonance synergy: enemies within 30px of any alive mage are slowed 50% (throttled: check every 15 ticks)
  if (ts.frame % 15 === 0 && tickHasSynergy(ts, 'magePair')) {
    const mages = ts.allies.filter(a => a.health > 0 && (a.unitType === 'wizard' || a.unitType === 'cleric'));
    const applySlow = (e: { health: number; x: number; slowTimer?: number; slowAmount?: number }) => {
      if (e.health > 0 && !(e.slowTimer && e.slowTimer > 0)) {
        for (const mage of mages) {
          if (Math.abs(e.x - mage.x) < 30) {
            e.slowTimer = 60;
            e.slowAmount = 0.50;
            break;
          }
        }
      }
    };
    ts.enemies.forEach(applySlow);
    ts.enemyArchers.forEach(applySlow);
    ts.enemyWraiths.forEach(applySlow);
    ts.enemyHounds.forEach(e => { if (!(e.lungeTimer && e.lungeTimer > 0)) applySlow(e); });
    ts.enemyLichs.forEach(applySlow);
    ts.enemyShadowAssassins.forEach(e => { if (e.stealthTimer <= 0) applySlow(e); });
    ts.enemyFlameCallers.forEach(applySlow);
    ts.enemyCorruptedSentinels.forEach(applySlow);
  }

  // ---- Ice Wall + Ice Turret blocking: clamp allies behind them, auto-attack when blocked ----
  if (ts.iceWalls.length > 0 || ts.iceTurrets.length > 0) {
    for (const a of ts.allies) {
      if (a.health <= 0) continue;
      const wallBlock = checkIceWallBlock(ts, a.x, a.damage, a.attackCooldown, a.attackRate);
      if (wallBlock.blocked) {
        a.attackCooldown = wallBlock.newCooldown;
        // Find the blocking wall/turret and clamp position behind it
        for (const wall of ts.iceWalls) {
          if (wall.health > 0 && wall.x - a.x > 0 && wall.x - a.x < 24) {
            a.x = Math.min(a.x, wall.x - 24);
            break;
          }
        }
        for (const turret of ts.iceTurrets) {
          if (turret.health > 0 && turret.x - a.x > 0 && turret.x - a.x < 24) {
            a.x = Math.min(a.x, turret.x - 24);
            break;
          }
        }
      }
    }
  }
}

// ---- Crystal Turret AI ----
// Stationary, auto-attacks nearest enemy in range, expires after duration
export function processCrystalTurretAI(ts: TickState): void {
  const { enemies, enemyArchers, enemyWraiths, enemyHounds, enemyLichs, enemyShadowAssassins, enemyFlameCallers, enemyCorruptedSentinels, enemyDungeonRats, enemyFireImps, enemyCursedKnights } = ts;
  const boss = ts.boss;

  ts.crystalTurrets = ts.crystalTurrets.filter(turret => {
    // Tick down duration
    turret.duration--;
    turret.frame = ts.frame;
    if (turret.duration <= 0 || turret.health <= 0) {
      // Shatter particle on expiry/death
      ts.particles.push(makeParticle(turret.x, turret.y - 10, '💎💥', '#55ddcc'));
      return false;
    }

    // Attack cooldown
    turret.attackCooldown++;
    if (turret.attackCooldown >= turret.attackRate) {
      // Find nearest enemy in range
      let target: any = null;
      let closestDist = turret.attackRange;

      const checkTarget = (e: any) => {
        if (e.health <= 0) return;
        if (e.lungeTimer && e.lungeTimer > 0) return;
        if (e.stealthTimer && e.stealthTimer > 0) return;
        const d = Math.abs(e.x - turret.x);
        if (d < closestDist) {
          closestDist = d;
          target = e;
        }
      };

      enemies.forEach(checkTarget);
      enemyArchers.forEach(checkTarget);
      enemyWraiths.forEach(checkTarget);
      enemyHounds.forEach(checkTarget);
      enemyLichs.forEach(checkTarget);
      enemyShadowAssassins.forEach(sa => { if (sa.stealthTimer <= 0) checkTarget(sa); });
      enemyFlameCallers.forEach(checkTarget);
      enemyCorruptedSentinels.forEach(checkTarget);
      enemyDungeonRats.forEach(checkTarget);
      enemyFireImps.forEach(checkTarget);
      enemyCursedKnights.forEach(checkTarget);
      if (boss && boss.health > 0) {
        const d = Math.abs(boss.x - turret.x);
        if (d < closestDist) { target = boss; }
      }

      if (target) {
        turret.attackCooldown = 0;
        ts.projectiles.push({ id: uid(), x: turret.x, y: turret.y - 4, targetX: target.x, speed: -10, damage: turret.damage, type: 'crystalBolt', markOnHit: !!turret.markOnHit });
      }
    }

    return true;
  });
}

// ---- Ice Turret AI (boss-summoned) ----
// Stationary, auto-fires iceball at nearest ally/hero, expires after duration
export function processIceTurretAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  ts.iceTurrets = ts.iceTurrets.filter(turret => {
    turret.duration--;
    if (turret.duration <= 0 || turret.health <= 0) {
      ts.particles.push(makeParticle(turret.x, turret.y - 10, '❄️💥', '#88ccff'));
      return false;
    }

    turret.attackCooldown++;
    if (turret.attackCooldown >= turret.attackRate) {
      // Find nearest ally or hero in range
      let target: { x: number; y: number } | null = null;
      let closestDist = 350; // turret attack range

      const checkAlly = (a: { x: number; y: number; health: number }) => {
        if (a.health <= 0) return;
        const d = turret.x - a.x; // only target units to the LEFT (approaching allies)
        if (d > 0 && d < closestDist) { closestDist = d; target = a; }
      };

      allies.forEach(checkAlly);
      if (hero.health > 0) {
        const hd = turret.x - hero.x;
        if (hd > 0 && hd < closestDist) { target = hero; }
      }

      if (target) {
        turret.attackCooldown = 0;
        // Fire iceball toward target — combat.ts handles AoE + slow on impact
        ts.projectiles.push({ id: uid(), x: turret.x, y: GROUND_Y - 15, targetX: target.x, speed: 5, damage: turret.damage, type: 'iceball', aoeRadius: 30 });
        ts.particles.push(makeParticle(turret.x, turret.y - 20, '❄️', '#88ccff'));
      }
    }

    return true;
  });
}

// ---- Shadow Assassin AI ----
// Stealth → teleport to strongest ally → burst attack → visible 10s → re-cloak
export function processShadowAssassinAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const s of ts.enemyShadowAssassins) {
    if (s.health <= 0) continue;
    s.frame = ts.frame;

    // Burn DOT — ticks once per second
    if ((s.burnTimer || 0) > 0) {
      if (s.burnTimer! % 60 === 0) s.health -= (s.burnDamage || 0);
      s.burnTimer!--;
    }
    if (s.stunTimer && s.stunTimer > 0) { s.stunTimer--; continue; }
    if ((s.rootTimer || 0) > 0) { s.rootTimer!--; continue; }
    // Slow tick-down
    if ((s.slowTimer || 0) > 0) s.slowTimer!--;

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    // Stealthed: walk forward, scan for backline targets, then ambush
    if (s.stealthTimer > 0) {
      const dxStealth = hero.x - s.x;
      const pinDownMult = pinDownActive ? 0.4 : 1;
      const engageRange = UNIT_STATS.enemyShadowAssassin.engageRange;
      const scanDuration = UNIT_STATS.enemyShadowAssassin.scanDuration;

      // Check if any target within engage range (300px)
      const nearbyAlly = allies.find(a => { const d = s.x - a.x; return d > 0 && d <= engageRange; });
      const nearHero = s.x - hero.x > 0 && s.x - hero.x <= engageRange;
      const engaged = nearbyAlly || nearHero;

      if (engaged) {
        // Scanning phase: keep walking, looking for backline targets
        s.scanTimer++;
        s.x += Math.sign(dxStealth) * s.speed * pinDownMult;

        // Look for backline targets (ranged/magic) within scan radius
        const scanRadius = 400; // generous scan range since we're walking through
        const backline = allies.filter(a => Math.abs(a.x - s.x) < scanRadius && (a.unitType === 'archer' || a.unitType === 'wizard' || a.unitType === 'cleric'));

        // Snap to backline target immediately if found, or fallback after scan expires
        if (backline.length > 0) {
          // Found a backline target — snap to them
          const target = backline.reduce((best, a) => a.maxHealth > best.maxHealth ? a : best, backline[0]);
          s.stealthTimer = 0;
          s.scanTimer = 0;
          s.x = target.x + 20;
          s.visibleTimer = 600;
          s.attackCooldown = s.attackRate - 1; // instant first strike
          ts.particles.push(makeParticle(s.x, s.y - 10, 'AMBUSH!', '#aa00ff'));
        } else if (s.scanTimer >= scanDuration) {
          // Scan expired, no backline found — fallback to nearest melee or hero
          const frontline = allies.filter(a => Math.abs(a.x - s.x) < scanRadius);
          const target = frontline.length > 0 ? frontline.reduce((best, a) => Math.abs(a.x - s.x) < Math.abs(best.x - s.x) ? a : best, frontline[0]) : null;
          s.stealthTimer = 0;
          s.scanTimer = 0;
          s.x = target ? target.x + 20 : hero.x + 30;
          s.visibleTimer = 600;
          s.attackCooldown = s.attackRate - 1; // instant first strike
          ts.particles.push(makeParticle(s.x, s.y - 10, 'AMBUSH!', '#aa00ff'));
        }
      } else {
        // Not in engage range yet — just walk forward
        s.x += Math.sign(dxStealth) * s.speed * pinDownMult;
        s.scanTimer = 0;
      }
      continue;
    }

    // Visible: attack nearby targets, count down to re-cloak
    s.visibleTimer--;
    // Elite Phantom Blade: re-cloak after 3 hits with halved stealth CD
    if (s.eliteVariantId === 'phantomBlade' && (s.eliteAbilityCd || 0) >= 3) {
      s.eliteAbilityCd = 0;
      s.visibleTimer = 0;
      s.stealthTimer = 60; // halved stealth CD
      ts.particles.push(makeParticle(s.x, s.y - 10, '💨 VANISH!', '#00ff88'));
      continue;
    }
    if (s.visibleTimer <= 0) {
      s.stealthTimer = s.eliteVariantId === 'phantomBlade' ? 60 : 120;
      ts.particles.push(makeParticle(s.x, s.y - 10, '💨', '#666'));
      continue;
    }

    // Move toward nearest target
    const dx = hero.x - s.x;
    const blockedByAlly = allies.some(a => { const dist = a.x - s.x; return dist < 0 && dist > -25; });

    if (Math.abs(dx) < s.attackRange || blockedByAlly) {
      s.attackCooldown++;
      if (s.attackCooldown >= s.attackRate) {
        s.attackCooldown = 0;
        // Attack hero if in range
        if (Math.abs(dx) < s.attackRange) {
          const dealt = dealDamageToHero(ts, s.damage, ' 🗡️', '#aa00ff');
        }
        // Attack nearest ally
        const nearAlly = allies.find(a => Math.abs(a.x - s.x) < s.attackRange);
        if (nearAlly) {
          const dealt = dealDamageToAlly(ts, nearAlly, s.damage, ' 🗡️', '#aa00ff');
        }
        // Elite Phantom Blade: count hits toward triple-strike re-cloak
        if (s.eliteVariantId === 'phantomBlade') {
          s.eliteAbilityCd = (s.eliteAbilityCd || 0) + 1;
        }
      }
    } else {
      const barr = checkStructureBlock(ts, s.x, s.damage, s.attackCooldown, s.attackRate);
      if (barr.blocked) {
        s.attackCooldown = barr.newCooldown;
      } else {
        const pinDownMult = pinDownActive ? 0.4 : 1;
        const saSlowMult = (s.slowTimer || 0) > 0 ? (1 - (s.slowAmount || 0)) : 1;
        s.x += Math.sign(dx) * s.speed * pinDownMult * saSlowMult;
      }
    }
  }
}

// ---- Flame Caller AI ----
// Positions at range, casts AoE fire on densest ally cluster with 1s warning circle
export function processFlameCallerAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const f of ts.enemyFlameCallers) {
    if (f.health <= 0) continue;
    f.frame = ts.frame;

    // Burn DOT — ticks once per second
    if ((f.burnTimer || 0) > 0) {
      if (f.burnTimer! % 60 === 0) f.health -= (f.burnDamage || 0);
      f.burnTimer!--;
    }
    if (f.stunTimer && f.stunTimer > 0) { f.stunTimer--; f.isCasting = false; f.castTimer = 0; continue; }
    if ((f.rootTimer || 0) > 0) { f.rootTimer!--; continue; }
    // Slow tick-down
    if ((f.slowTimer || 0) > 0) f.slowTimer!--;

    const dx = hero.x - f.x;
    const dist = Math.abs(dx);
    const blockedByAlly = allies.some(a => { const d = a.x - f.x; return d < 0 && d > -35; });

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    // Casting phase
    if (f.isCasting) {
      f.castTimer++;
      if (f.castTimer >= UNIT_STATS.enemyFlameCaller.castTime) {
        // Cast complete: deal AoE damage
        f.isCasting = false;
        f.castTimer = 0;
        f.castCooldown = UNIT_STATS.enemyFlameCaller.castCooldown;
        const aoeR = UNIT_STATS.enemyFlameCaller.aoeRadius;
        // Damage hero if in radius
        if (Math.abs(hero.x - f.castTargetX) < aoeR && Math.abs(hero.y - f.castTargetY) < aoeR) {
          const dealt = dealDamageToHero(ts, f.damage, ' ☄️', '#ff4400');
        }
        // Damage allies in radius
        allies.forEach(a => {
          if (Math.abs(a.x - f.castTargetX) < aoeR) {
            const dealt = dealDamageToAlly(ts, a, f.damage, ' ☄️', '#ff4400');
          }
        });
        // Damage crystal turrets in radius
        ts.crystalTurrets.forEach(t => {
          if (t.health > 0 && Math.abs(t.x - f.castTargetX) < aoeR) {
            t.health -= Math.max(1, f.damage - t.defense);
            if (t.health <= 0) ts.particles.push(makeParticle(t.x, t.y - 10, '💎💥', '#55ddcc'));
          }
        });
        // Meteor impact particle
        ts.particles.push(makeParticle(f.castTargetX, f.castTargetY - 10, `-${f.damage}`, '#ff4400'));
        // Elite Inferno Herald: 2 extra AOE impacts
        if (f.eliteVariantId === 'infernoHerald' && f.extraCastTargets) {
          for (const extraX of f.extraCastTargets) {
            if (Math.abs(hero.x - extraX) < aoeR) {
              dealDamageToHero(ts, f.damage, ' ☄️', '#ff2200');
            }
            allies.forEach(a => {
              if (Math.abs(a.x - extraX) < aoeR) {
                dealDamageToAlly(ts, a, f.damage, ' ☄️', '#ff2200');
              }
            });
            ts.crystalTurrets.forEach(t => {
              if (t.health > 0 && Math.abs(t.x - extraX) < aoeR) {
                t.health -= Math.max(1, f.damage - t.defense);
                if (t.health <= 0) ts.particles.push(makeParticle(t.x, t.y - 10, '💎💥', '#55ddcc'));
              }
            });
            ts.particles.push(makeParticle(extraX, f.castTargetY - 10, `-${f.damage}`, '#ff2200'));
          }
          f.extraCastTargets = undefined;
        }
      }
      continue;
    }

    // Cooldown phase
    if (f.castCooldown > 0) {
      f.castCooldown--;
    }

    // Begin casting if blocked or any target in range and off cooldown
    const canCast = f.castCooldown <= 0;
    const heroInRange = dist <= f.attackRange;
    const allyInRange = allies.some(a => { const d = f.x - a.x; return d > 0 && d <= f.attackRange; });
    const inRange = heroInRange || allyInRange;

    if (canCast && (blockedByAlly || inRange)) {
      // Find densest ally cluster for meteor target
      let bestX = hero.x;
      let bestCount = 1;
      allies.forEach(a => {
        let count = 1;
        allies.forEach(b => { if (Math.abs(a.x - b.x) < 50) count++; });
        if (Math.abs(hero.x - a.x) < 50) count++;
        if (count > bestCount) { bestCount = count; bestX = a.x; }
      });
      f.isCasting = true;
      f.castTimer = 0;
      f.castTargetX = bestX;
      f.castTargetY = GROUND_Y - 20;
      ts.particles.push(makeParticle(bestX, GROUND_Y - 50, '☄️', '#ff8800'));
      // Elite Inferno Herald: 2 extra AOE target positions
      if (f.eliteVariantId === 'infernoHerald') {
        f.extraCastTargets = [
          bestX - 40 - Math.random() * 30,
          bestX + 40 + Math.random() * 30,
        ];
        ts.particles.push(makeParticle(f.extraCastTargets[0], GROUND_Y - 50, '☄️', '#ff4400'));
        ts.particles.push(makeParticle(f.extraCastTargets[1], GROUND_Y - 50, '☄️', '#ff4400'));
      }
    } else if (!blockedByAlly && !inRange) {
      const barr = checkStructureBlock(ts, f.x, f.damage, f.castCooldown, UNIT_STATS.enemyFlameCaller.castCooldown);
      if (barr.blocked) {
        f.castCooldown = barr.newCooldown;
      } else {
        const pinDownMult = pinDownActive ? 0.4 : 1;
        const fcSlowMult = (f.slowTimer || 0) > 0 ? (1 - (f.slowAmount || 0)) : 1;
        f.x += Math.sign(dx) * f.speed * pinDownMult * fcSlowMult;
      }
    }
  }
}

// ---- Corrupted Sentinel AI ----
// Very tanky, slow advance, slow heavy melee attacks
export function processCorruptedSentinelAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const c of ts.enemyCorruptedSentinels) {
    if (c.health <= 0) continue;
    c.frame = ts.frame;

    // Burn DOT — ticks once per second
    if ((c.burnTimer || 0) > 0) {
      if (c.burnTimer! % 60 === 0) c.health -= (c.burnDamage || 0);
      c.burnTimer!--;
    }
    if (c.stunTimer && c.stunTimer > 0) { c.stunTimer--; continue; }
    if ((c.rootTimer || 0) > 0) { c.rootTimer!--; continue; }
    // Slow tick-down
    if ((c.slowTimer || 0) > 0) c.slowTimer!--;

    const dx = hero.x - c.x;
    const blockedByAlly = allies.some(a => { const dist = a.x - c.x; return dist < 0 && dist > -25; });

    // Elite Colossus: ground stomp every 5s — AOE damage + knockback
    if (c.eliteVariantId === 'colossus') {
      c.eliteAbilityCd = (c.eliteAbilityCd || 0) + 1;
      if (c.eliteAbilityCd >= 300) {
        c.eliteAbilityCd = 0;
        const stompRadius = 60;
        const stompDmg = Math.floor(c.damage * 1.5);
        if (Math.abs(hero.x - c.x) < stompRadius) {
          dealDamageToHero(ts, stompDmg, ' 💥', '#aaaaaa');
        }
        allies.forEach(a => {
          if (Math.abs(a.x - c.x) < stompRadius) {
            dealDamageToAlly(ts, a, stompDmg, ' 💥', '#aaaaaa');
            a.x -= 15 * (1 - (a.knockbackResist || 0));
          }
        });
        ts.particles.push(makeParticle(c.x, c.y - 25, 'STOMP!', '#aaaaaa'));
      }
    }

    const meleeReach = 45; // wider reach for big unit
    const nearAlly = allies.find(a => { const d = c.x - a.x; return d > 0 && d < meleeReach; });
    const heroInReach = c.x - hero.x > 0 && c.x - hero.x < meleeReach;

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    if (heroInReach || nearAlly || blockedByAlly) {
      // Slow melee attack
      c.attackCooldown++;
      if (c.attackCooldown >= c.attackRate) {
        c.attackCooldown = 0;
        if (heroInReach) {
          const dealt = dealDamageToHero(ts, c.damage, '', '#aaaaaa');
        }
        if (nearAlly) {
          const dealt = dealDamageToAlly(ts, nearAlly, c.damage, '', '#aaaaaa');
        }
      }
    } else {
      const barr = checkStructureBlock(ts, c.x, c.damage, c.attackCooldown, c.attackRate);
      if (barr.blocked) {
        c.attackCooldown = barr.newCooldown;
      } else {
        const pinDownMult = pinDownActive ? 0.4 : 1;
        const csSlowMult = (c.slowTimer || 0) > 0 ? (1 - (c.slowAmount || 0)) : 1;
        c.x += Math.sign(dx) * c.speed * pinDownMult * csSlowMult;
      }
    }
  }
}

// ---- Dungeon Rat AI ----
// Fast swarming melee (similar to goblin AI)
export function processDungeonRatAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const r of ts.enemyDungeonRats) {
    if (r.health <= 0) continue;
    r.frame = ts.frame;

    // Burn DOT — ticks once per second
    if ((r.burnTimer || 0) > 0) {
      if (r.burnTimer! % 60 === 0) r.health -= (r.burnDamage || 0);
      r.burnTimer!--;
    }
    if (r.stunTimer && r.stunTimer > 0) { r.stunTimer--; continue; }
    if ((r.rootTimer || 0) > 0) { r.rootTimer!--; continue; }
    if ((r.slowTimer || 0) > 0) r.slowTimer!--;
    const artifactSlowMult = (r.slowTimer || 0) > 0 ? (1 - (r.slowAmount || 0)) : 1;

    // Elite Plague King: summon 2 rats every 6s
    if (r.eliteVariantId === 'plagueKing') {
      r.eliteAbilityCd = (r.eliteAbilityCd || 0) + 1;
      if (r.eliteAbilityCd >= 360) {
        r.eliteAbilityCd = 0;
        const zoneScale = Math.pow(1.3, ts.currentZone);
        const flagScale = 1 + ts.flagsCaptured * 0.05;
        for (let i = 0; i < 2; i++) {
          const ratHp = Math.floor(UNIT_STATS.dungeonRat.health * 0.5 * zoneScale * flagScale);
          const ratDmg = Math.floor(UNIT_STATS.dungeonRat.damage * 0.5 * zoneScale * flagScale);
          ts.enemyDungeonRats.push({
            id: uid(), x: r.x + 10 + i * 15, y: GROUND_Y - ENEMY_SIZE,
            health: ratHp, maxHealth: ratHp, damage: ratDmg,
            speed: UNIT_STATS.dungeonRat.speed,
            attackRate: UNIT_STATS.dungeonRat.attackRate,
            attackRange: UNIT_STATS.dungeonRat.attackRange,
            frame: ts.frame, attackCooldown: 0, defense: 0,
          });
        }
        ts.particles.push(makeParticle(r.x, r.y - 20, 'SWARM!', '#88aa00'));
      }
    }

    const dx = hero.x - r.x;
    const blockedByAlly = allies.some(a => { const dist = a.x - r.x; return dist < 0 && dist > -25; });

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    if (Math.abs(dx) < r.attackRange) {
      r.attackCooldown++;
      if (r.attackCooldown >= r.attackRate) {
        r.attackCooldown = 0;
        const dealt = dealDamageToHero(ts, r.damage, '', '#aa4422');
      }
    } else if (blockedByAlly) {
      r.attackCooldown++;
      if (r.attackCooldown >= r.attackRate) {
        r.attackCooldown = 0;
        const targetAlly = allies.find(a => Math.abs(a.x - r.x) < 25);
        if (targetAlly) {
          const dealt = dealDamageToAlly(ts, targetAlly, r.damage, '', '#aa4422');
        }
      }
    } else {
      const barr = checkStructureBlock(ts, r.x, r.damage, r.attackCooldown, r.attackRate);
      if (barr.blocked) {
        r.attackCooldown = barr.newCooldown;
      } else {
        if (r.attackCooldown < Math.max(r.attackRate - 10, 15)) r.attackCooldown = Math.max(r.attackRate - 10, 15);
        const pinDownMult = pinDownActive ? 0.4 : 1;
        r.x += Math.sign(dx) * r.speed * pinDownMult * artifactSlowMult;
      }
    }
  }
}

// ---- Fire Imp AI ----
// Mid-range AoE caster (similar to FlameCaller but smaller/faster)
export function processFireImpAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const f of ts.enemyFireImps) {
    if (f.health <= 0) continue;
    f.frame = ts.frame;

    // Burn DOT
    if ((f.burnTimer || 0) > 0) {
      if (f.burnTimer! % 60 === 0) f.health -= (f.burnDamage || 0);
      f.burnTimer!--;
    }
    if (f.stunTimer && f.stunTimer > 0) { f.stunTimer--; f.isCasting = false; f.castTimer = 0; continue; }
    if ((f.rootTimer || 0) > 0) { f.rootTimer!--; continue; }

    const dx = hero.x - f.x;
    const dist = Math.abs(dx);
    const blockedByAlly = allies.some(a => { const d = a.x - f.x; return d < 0 && d > -35; });

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    // Casting phase
    if (f.isCasting) {
      f.castTimer++;
      if (f.castTimer >= UNIT_STATS.fireImp.castTime) {
        f.isCasting = false;
        f.castTimer = 0;
        f.castCooldown = UNIT_STATS.fireImp.castCooldown;
        const aoeR = UNIT_STATS.fireImp.aoeRadius;
        if (Math.abs(hero.x - f.castTargetX) < aoeR && Math.abs(hero.y - f.castTargetY) < aoeR) {
          const dealt = dealDamageToHero(ts, f.damage, ' 🔥', '#ff4400');
        }
        allies.forEach(a => {
          if (Math.abs(a.x - f.castTargetX) < aoeR) {
            const dealt = dealDamageToAlly(ts, a, f.damage, ' 🔥', '#ff4400');
          }
        });
        ts.particles.push(makeParticle(f.castTargetX, f.castTargetY - 10, '🔥', '#ff4400'));
        // Elite Magma Lord: extra AOE impact
        if (f.eliteVariantId === 'magmaLord' && f.extraCastTargetX) {
          const extraX = f.extraCastTargetX;
          if (Math.abs(hero.x - extraX) < aoeR && Math.abs(hero.y - f.castTargetY) < aoeR) {
            dealDamageToHero(ts, f.damage, ' 🔥', '#ff4400');
          }
          allies.forEach(a => {
            if (Math.abs(a.x - extraX) < aoeR) {
              dealDamageToAlly(ts, a, f.damage, ' 🔥', '#ff4400');
            }
          });
          ts.particles.push(makeParticle(extraX, f.castTargetY - 10, '🔥', '#ff4400'));
          f.extraCastTargetX = undefined;
        }
      }
      continue;
    }

    // Cooldown
    if (f.castCooldown > 0) f.castCooldown--;

    // Begin casting
    const canCast = f.castCooldown <= 0;
    const heroInRange = dist <= f.attackRange;
    const allyInRange = allies.some(a => { const d = f.x - a.x; return d > 0 && d <= f.attackRange; });
    const inRange = heroInRange || allyInRange;

    if (canCast && (blockedByAlly || inRange)) {
      // Target hero or densest cluster
      let bestX = hero.x;
      let bestCount = 1;
      allies.forEach(a => {
        let count = 1;
        allies.forEach(b => { if (Math.abs(a.x - b.x) < 40) count++; });
        if (Math.abs(hero.x - a.x) < 40) count++;
        if (count > bestCount) { bestCount = count; bestX = a.x; }
      });
      f.isCasting = true;
      f.castTimer = 0;
      f.castTargetX = bestX;
      f.castTargetY = GROUND_Y - 20;
      ts.particles.push(makeParticle(bestX, GROUND_Y - 50, '🔥', '#ff6600'));
      // Elite Magma Lord: extra AOE target
      if (f.eliteVariantId === 'magmaLord') {
        f.extraCastTargetX = bestX + 30 + Math.random() * 40;
        ts.particles.push(makeParticle(f.extraCastTargetX, GROUND_Y - 50, '🔥', '#ff4400'));
      }
    } else if (!blockedByAlly && !inRange) {
      const barr = checkStructureBlock(ts, f.x, f.damage, f.castCooldown, UNIT_STATS.fireImp.castCooldown);
      if (barr.blocked) {
        f.castCooldown = barr.newCooldown;
      } else {
        const pinDownMult = pinDownActive ? 0.4 : 1;
        f.x += Math.sign(dx) * f.speed * pinDownMult;
      }
    }
  }
}

// ---- Cursed Knight AI ----
// Slow tanky melee (similar to Corrupted Sentinel)
export function processCursedKnightAI(ts: TickState): void {
  const { hero } = ts;
  const allies = ts.nonPetAllies;

  for (const c of ts.enemyCursedKnights) {
    if (c.health <= 0) continue;
    c.frame = ts.frame;

    // Burn DOT
    if ((c.burnTimer || 0) > 0) {
      if (c.burnTimer! % 60 === 0) c.health -= (c.burnDamage || 0);
      c.burnTimer!--;
    }
    if (c.stunTimer && c.stunTimer > 0) { c.stunTimer--; continue; }
    if ((c.rootTimer || 0) > 0) { c.rootTimer!--; continue; }

    // Elite Death Knight: dark heal every 8s + bonus damage to nearby enemies
    if (c.eliteVariantId === 'deathKnight') {
      c.eliteAbilityCd = (c.eliteAbilityCd || 0) + 1;
      if (c.eliteAbilityCd >= 480) {
        c.eliteAbilityCd = 0;
        const healAmt = Math.floor(c.maxHealth * 0.05);
        c.health = Math.min(c.maxHealth, c.health + healAmt);
        ts.particles.push(makeParticle(c.x, c.y - 25, `+${healAmt} DARK HEAL`, '#6622aa'));
      }
    }

    const dx = hero.x - c.x;
    const blockedByAlly = allies.some(a => { const dist = a.x - c.x; return dist < 0 && dist > -25; });

    const meleeReach = 40;
    const nearAlly = allies.find(a => { const d = c.x - a.x; return d > 0 && d < meleeReach; });
    const heroInReach = c.x - hero.x > 0 && c.x - hero.x < meleeReach;

    // Death Knight aura: +1 bonus damage to nearby cursed knight attacks
    const bonusDmg = c.eliteVariantId === 'deathKnight' ? 1 : 0;

    const pinDownActive = tickSkillBuffActive(ts, 'pinDown');
    if (heroInReach || nearAlly || blockedByAlly) {
      c.attackCooldown++;
      if (c.attackCooldown >= c.attackRate) {
        c.attackCooldown = 0;
        if (heroInReach) {
          const dealt = dealDamageToHero(ts, c.damage + bonusDmg, '', '#6622aa');
        }
        if (nearAlly) {
          const dealt = dealDamageToAlly(ts, nearAlly, c.damage + bonusDmg, '', '#6622aa');
        }
      }
    } else {
      const barr = checkStructureBlock(ts, c.x, c.damage, c.attackCooldown, c.attackRate);
      if (barr.blocked) {
        c.attackCooldown = barr.newCooldown;
      } else {
        const pinDownMult = pinDownActive ? 0.4 : 1;
        c.x += Math.sign(dx) * c.speed * pinDownMult;
      }
    }
  }
}
