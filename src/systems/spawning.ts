import { GROUND_Y, ENEMY_SIZE, UNIT_STATS, isUnitMelee, isUnitRanged, isUnitMagic } from '../constants';
import { shouldSpawnElite, spawnElite } from './elites';
import type { Flag, Ally, ShardUpgrades } from '../types';
import { makeParticle, uid } from '../utils/helpers';
import { unitHpMult, unitDmgMult } from '../utils/economy';
import type { TickState } from './tickState';
import { tickHasArtifact, tickHasSynergy, tickHasSetBonus, getPortalX, getRegaliaBonus } from './tickState';
import { getRelicLevel } from '../relics';
import { getAncientEffect, getAncientRelicLevel } from '../ancientRelics';
import { isUnitInCategory } from '../regalias';
import { getChallengeRewardMult } from '../challenges';
import { modEnemySpawnRateMult, modEnemyHpMult, modEnemyDmgMult, modEnemySpeedMult, modBossHpMult, modRespawnTimeMult, modFlankersActive, modSharpshootersActive, modUnstablePortalActive, modAllyHpMult, modAllyDefenseBonus, modDuelistOathActive, modColosseumRewardActive } from './modifierEffects';

/** Apply dungeon category boosts to an ally at spawn time */
export function applyDungeonBoosts(ally: Ally, ts: TickState): void {
  if (!ts.inDungeon) return;
  const t = ally.unitType;
  const isMelee = t === 'soldier' || t === 'knight' || t === 'halberd';
  const isRangedUnit = t === 'archer' || t === 'bombard';
  const isMagic = t === 'wizard' || t === 'cleric' || t === 'conjurer';
  let mult = 1;
  if (isMelee && ts.dungeonMeleeBoost > 0) mult = 1 + ts.dungeonMeleeBoost * 0.15;
  if (isRangedUnit && ts.dungeonRangedBoost > 0) mult = 1 + ts.dungeonRangedBoost * 0.15;
  if (isMagic && ts.dungeonMagicBoost > 0) mult = 1 + ts.dungeonMagicBoost * 0.15;
  if (mult > 1) {
    ally.damage = Math.floor(ally.damage * mult);
    ally.maxHealth = Math.floor(ally.maxHealth * mult);
    ally.health = ally.maxHealth;
  }
}

/** Apply shard prestige upgrades to an ally at spawn time */
export function applyShardUpgrades(ally: Ally, su: ShardUpgrades): void {
  const t = ally.unitType;

  if (t === 'soldier') {
    if (su.soldier_rations > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.soldier_rations * 0.05));
    if (su.soldier_keenEdge > 0) ally.damage = Math.floor(ally.damage * (1 + su.soldier_keenEdge * 0.05));
    ally.defense += su.soldier_plating;
    if (su.soldier_betterBoots > 0) ally.speed += 0.1;
    // Elite roll
    if (su.soldier_quartermastersFavor > 0 && Math.random() < su.soldier_quartermastersFavor * 0.01) {
      ally.isElite = true;
      ally.maxHealth = Math.floor(ally.maxHealth * 3);
      ally.damage = Math.floor(ally.damage * 1.25);
      ally.defense += Math.floor(ally.defense * 0.2) + 1;
      ally.attackRange += 3;
    }
  }

  if (t === 'archer') {
    if (su.archer_rations > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.archer_rations * 0.05));
    if (su.archer_keenEdge > 0) ally.damage = Math.floor(ally.damage * (1 + su.archer_keenEdge * 0.05));
    ally.defense += su.archer_leatherwork;
    if (su.archer_eagleEye > 0) ally.attackRange += su.archer_eagleEye * 5;
  }

  if (t === 'knight') {
    if (su.knight_ironclad > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.knight_ironclad * 0.1));
    ally.defense += su.knight_heavyPlating;
    if (su.knight_standFirm > 0) {
      ally.damage = Math.floor(ally.damage * (1 + su.knight_standFirm * 0.05));
      ally.knockbackResist = 1; // Full immunity at any level
    }
    if (su.knight_betterBoots > 0) ally.speed += 0.15;
    // Giant roll
    if (su.knight_giant > 0 && Math.random() < su.knight_giant * 0.01) {
      ally.isGiant = true;
      ally.maxHealth = Math.floor(ally.maxHealth * 4);
    }
  }

  if (t === 'halberd') {
    if (su.halberd_rations > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.halberd_rations * 0.05));
    if (su.halberd_keenEdge > 0) ally.damage = Math.floor(ally.damage * (1 + su.halberd_keenEdge * 0.05));
    ally.defense += su.halberd_hardening;
    if (su.halberd_reach > 0) ally.attackRange += su.halberd_reach * 5;
    if (su.halberd_betterBoots > 0) ally.speed += 0.1;
  }

  if (t === 'wizard') {
    if (su.wizard_teaBiscuits > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.wizard_teaBiscuits * 0.15));
    if (su.wizard_mastery > 0) ally.damage = Math.floor(ally.damage * (1 + su.wizard_mastery * 0.1));
    if (su.wizard_discipline > 0) ally.attackRate = Math.max(15, Math.floor(ally.attackRate * (1 - su.wizard_discipline * 0.1)));
    if (su.wizard_walkingStick > 0) ally.speed += 0.15;
    if (su.wizard_shield > 0) ally.shieldHP = 1;
  }

  if (t === 'cleric') {
    if (su.cleric_holyVestments > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.cleric_holyVestments * 0.1));
    if (su.cleric_mending > 0) ally.healBonus = su.cleric_mending * 0.05;
    if (su.cleric_devotion > 0) ally.attackRange += 5;
    if (su.cleric_betterSandals > 0) ally.speed += 0.1;
  }

  if (t === 'conjurer') {
    // Crystal Resonance: +5% damage per level (turrets inherit this)
    if (su.conjurer_crystalResonance > 0) ally.damage = Math.floor(ally.damage * (1 + su.conjurer_crystalResonance * 0.05));
    // Hardened Lattice: +5% HP per level (turrets inherit a % of this)
    if (su.conjurer_hardenedLattice > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.conjurer_hardenedLattice * 0.05));
    // Rapid Conjuring: 8% faster turret placement per level
    if (su.conjurer_rapidConjuring > 0) ally.attackRate = Math.max(60, Math.floor(ally.attackRate * (1 - su.conjurer_rapidConjuring * 0.08)));
  }

  if (t === 'bombard') {
    if (su.bombard_rations > 0) ally.maxHealth = Math.floor(ally.maxHealth * (1 + su.bombard_rations * 0.05));
    if (su.bombard_refinedPowder > 0) ally.damage += su.bombard_refinedPowder * 5;
    if (su.bombard_gear > 0) ally.defense += su.bombard_gear * 2;
    if (su.bombard_betterBarrel > 0) ally.attackRange += su.bombard_betterBarrel * 10;
    if (su.bombard_backpack > 0) ally.speed += 0.05;
  }

  // Set health to max after all modifications
  ally.health = ally.maxHealth;
  // Store base attack rate for buff restoration
  ally.baseAttackRate = ally.attackRate;
}

/** Apply relic effects to an ally at spawn time */
export function applyRelicEffects(ally: Ally, ts: TickState): void {
  const rc = ts.relicCollection;

  // 1. Gel — melee +3% HP per level
  const gelLv = getRelicLevel(rc['gel'] || 0);
  if (gelLv > 0 && isUnitMelee(ally.unitType)) {
    ally.maxHealth = Math.floor(ally.maxHealth * (1 + gelLv * 0.03));
    ally.health = ally.maxHealth;
  }

  // 2. Forged Weapons — melee +1 damage per level
  const forgedLv = getRelicLevel(rc['forgedWeapons'] || 0);
  if (forgedLv > 0 && isUnitMelee(ally.unitType)) {
    ally.damage += forgedLv;
  }

  // 3. Scale Mail — melee +1 defense per level
  const scaleLv = getRelicLevel(rc['scaleMail'] || 0);
  if (scaleLv > 0 && isUnitMelee(ally.unitType)) {
    ally.defense += scaleLv;
  }

  // 4. Plated Leather — ranged +1 defense per level
  const platedLv = getRelicLevel(rc['platedLeather'] || 0);
  if (platedLv > 0 && isUnitRanged(ally.unitType)) {
    ally.defense += platedLv;
  }

  // 5. Stronger Bows — ranged +1 damage per level
  const bowsLv = getRelicLevel(rc['strongerBows'] || 0);
  if (bowsLv > 0 && isUnitRanged(ally.unitType)) {
    ally.damage += bowsLv;
  }

  // 6. Magic Mushroom — halberds & archers +3 range per level
  const mushroomLv = getRelicLevel(rc['magicMushroom'] || 0);
  if (mushroomLv > 0 && (ally.unitType === 'halberd' || ally.unitType === 'archer')) {
    ally.attackRange += mushroomLv * 3;
  }

  // 7. Silk — magic +1 defense per level
  const silkLv = getRelicLevel(rc['silk'] || 0);
  if (silkLv > 0 && isUnitMagic(ally.unitType)) {
    ally.defense += silkLv;
  }

  // 8. Glasses — magic +3 range per level (crit handled in combat)
  const glassesLv = getRelicLevel(rc['glasses'] || 0);
  if (glassesLv > 0 && isUnitMagic(ally.unitType)) {
    ally.attackRange += glassesLv * 3;
  }

  // 9. Green Ink — magic -3% attack rate per level (faster attacks)
  const greenInkLv = getRelicLevel(rc['greenInk'] || 0);
  if (greenInkLv > 0 && isUnitMagic(ally.unitType)) {
    ally.attackRate = Math.max(15, Math.floor(ally.attackRate * (1 - greenInkLv * 0.03)));
  }

  // 9. Worn Boots — all +0.02 movespeed per level
  const bootsLv = getRelicLevel(rc['wornBoots'] || 0);
  if (bootsLv > 0) {
    ally.speed += bootsLv * 0.02;
  }

  // 10. Walking Stick — hero movespeed handled in hero AI, not here

  // 11. Hats — 3% chance for +1 defense, doubled by Achievements 2pc
  const hatsLv = getRelicLevel(rc['hats'] || 0);
  if (hatsLv > 0) {
    let hatChance = 0.03;
    if (tickHasSetBonus(ts, 'achievementsSet', 2)) hatChance *= 2; // 6%
    if (Math.random() < hatChance) {
      ally.defense += 1;
      ally.hatCount = 1;
      ts.particles.push(makeParticle(ally.x + 10, ally.y - 20, '🎩!', '#ffd700'));
    }
  }

  // 12. Juiced — 1% chance (3x speed, 2x atk speed), doubled by Achievements 2pc
  const juicedLv = getRelicLevel(rc['juiced'] || 0);
  if (juicedLv > 0) {
    let juicedChance = 0.01;
    if (tickHasSetBonus(ts, 'achievementsSet', 2)) juicedChance *= 2; // 2%
    if (Math.random() < juicedChance) {
      ally.isJuiced = true;
      ally.speed *= 3;
      ally.attackRate = Math.max(5, Math.floor(ally.attackRate / 2));
      ally.attackCooldown = ally.attackRate;
      ts.particles.push(makeParticle(ally.x + 10, ally.y - 30, '💪 JUICED!', '#ff4444'));
    }
  }

  // 13. Initialize combat flags for set bonuses
  ally.debuffCleansed = false;
  ally.dodgeUsed = false;
  ally.firstAttackDone = false;

  // Re-sync health after all HP modifications
  ally.health = ally.maxHealth;
  ally.baseAttackRate = ally.attackRate;
}

/** Spawn Royal Guard archer when royalGuard relic is owned (Militia's set) */
export function processRoyalGuardSpawn(ts: TickState): void {
  if (ts.frame % 360 !== 0) return; // Check every 6s

  const royalGuardLv = getRelicLevel(ts.relicCollection['royalGuard'] || 0);
  if (royalGuardLv <= 0) return;

  // Already have a living Royal Guard
  if (ts.allies.some(a => a.isRoyalGuard)) return;

  const { hero } = ts;
  const hp = Math.floor(hero.maxHealth * 0.5);
  const dmg = Math.floor(hero.damage * 0.5);
  const def = Math.floor((hero.defense || 0) * 0.5);

  const guard: Ally = {
    id: uid(), slotIndex: -1, unitType: 'archer', x: hero.x - 30, y: GROUND_Y - 20,
    health: hp, maxHealth: hp, damage: dmg, defense: def,
    speed: hero.speed, attackRate: 80,
    attackRange: 220, frame: 0, attackCooldown: 80,
    lane: 0, isRoyalGuard: true,
  };

  ts.allies.push(guard);
  ts.particles.push(makeParticle(hero.x - 10, GROUND_Y - 50, '👑 ROYAL GUARD!', '#ffd700'));
}

/** Find the closest uncaptured flag to the hero */
export function findClosestUncapturedFlag(ts: TickState): Flag | null {
  const uncaptured = ts.flags.filter(f => !f.captured && !f.contested);
  let closest: Flag | null = null;
  let closestDist = Infinity;
  for (const flag of uncaptured) {
    const dist = Math.abs(flag.x - ts.hero.x);
    if (dist < closestDist) { closestDist = dist; closest = flag; }
  }
  return closest;
}

// Old elite mod system removed — replaced by elite mini-boss variants in elites.ts

/** Spawn enemies from the closest uncaptured flag */
export function processEnemySpawning(ts: TickState, closestFlag: Flag | null): void {
  if (ts.inDungeon && ts.dungeonType !== 'timed') return; // Wave dungeon has own spawning; timed uses normal
  if (ts.timedDungeonVictory) return; // Stop spawning after boss killed
  if (!closestFlag) return;

  // Ideal mob count = flags captured + half your army. Scales naturally with progression.
  const allyCount = ts.allies.length;
  const idealMobs = Math.max(1, Math.floor(ts.flagsCaptured * 0.75) + Math.floor(allyCount * 0.4));
  const activeEnemies = ts.enemies.length + ts.enemyArchers.length + ts.enemyWraiths.length + ts.enemyHounds.length + ts.enemyLichs.length + ts.enemyShadowAssassins.length + ts.enemyFlameCallers.length + ts.enemyCorruptedSentinels.length + ts.enemyDungeonRats.length + ts.enemyFireImps.length + ts.enemyCursedKnights.length;

  // Spawn rate: gentle below ideal (0.8x), aggressive slowdown above (3x)
  let spawnMultiplier: number;
  if (activeEnemies < idealMobs) {
    const deficit = (idealMobs - activeEnemies) / idealMobs;
    spawnMultiplier = Math.max(0.8, 1 - deficit * 0.4);
  } else {
    const surplus = (activeEnemies - idealMobs) / idealMobs;
    spawnMultiplier = Math.min(2.0, 1 + surplus * 2);
  }

  closestFlag.spawnTimer++;
  const spawnVariance = 0.6 + Math.random() * 0.8;
  // Challenge mods: Colosseum = 85% slower spawn, Horde = 5x faster spawn
  const challengeSpawnMult = ts.challengeId === 'colosseum' ? 6.67 : ts.challengeId === 'hordeMode' ? 0.2 : 1;
  const dungeonSpawnMult = ts.dungeonType === 'timed' ? 1.0 : 1; // Timed dungeon: normal spawn rate
  const devMult = ts.devSpawnMult || 1;
  if (closestFlag.spawnTimer < closestFlag.spawnRate * spawnVariance * spawnMultiplier * challengeSpawnMult * dungeonSpawnMult * devMult * modEnemySpawnRateMult(ts)) return;

  // Burst spawn: only when very far below ideal and have captured some flags
  const burstCount = ts.flagsCaptured >= 3 && activeEnemies < idealMobs * 0.35 ? 2 : 1;

  closestFlag.spawnTimer = 0;
  const { currentZone } = ts;
  // Snapshot counts for challenge modifier application
  const enemyCountBefore = ts.enemies.length;
  const archerCountBefore = ts.enemyArchers.length;
  const wraithCountBefore = ts.enemyWraiths.length;
  const houndCountBefore = ts.enemyHounds.length;
  const lichCountBefore = ts.enemyLichs.length;
  const shadowCountBefore = ts.enemyShadowAssassins.length;
  const flameCountBefore = ts.enemyFlameCallers.length;
  const sentinelCountBefore = ts.enemyCorruptedSentinels.length;
  // Count contested flags as captured for enemy scaling — enemies get tougher during contests
  const contestedCount = ts.flags.filter(f => f.contested && !f.captured).length;
  const flagsCaptured = ts.flagsCaptured + contestedCount;
  // Diminished exponential: growth rate decays 2% per zone so late-game scales more gently
  const zoneScale = Math.pow(1.3, currentZone * Math.pow(0.98, currentZone));
  const flagScale = 1 + flagsCaptured * 0.05;

  for (let b = 0; b < burstCount; b++) {
    const xOffset = b * 20;

    // Elite mini-boss check (replaces old random elite mods)
    if (b === 0) {
      const eliteVariant = shouldSpawnElite(ts);
      if (eliteVariant) {
        spawnElite(ts, eliteVariant, closestFlag.x + xOffset);
        continue; // Elite replaces this normal spawn
      }
    }

    // Timed dungeon: exclusive spawn pool — no main-game enemies
    // Scale with zone + main-world flags captured at dungeon entry (not dungeon flags)
    if (ts.dungeonType === 'timed') {
      const dungeonFlagScale = 1 + ts.dungeonTriggerFlags * 0.05;
      const dRoll = Math.random();
      if (dRoll < 0.70) {
        // Dungeon Rat (70%)
        const hp = Math.floor(UNIT_STATS.dungeonRat.health * zoneScale * dungeonFlagScale * 2);
        ts.enemyDungeonRats.push({
          id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 18, health: hp, maxHealth: hp,
          damage: Math.floor(UNIT_STATS.dungeonRat.damage * zoneScale * dungeonFlagScale),
          speed: UNIT_STATS.dungeonRat.speed + Math.random() * 0.2,
          attackRate: UNIT_STATS.dungeonRat.attackRate,
          attackRange: UNIT_STATS.dungeonRat.attackRange + Math.floor(Math.random() * 7) - 3,
          frame: 0, attackCooldown: 15,
          lane: Math.floor(Math.random() * 10) - 5,
        });
      } else if (dRoll < 0.88) {
        // Cursed Knight (18%)
        const hp = Math.floor(UNIT_STATS.cursedKnight.health * zoneScale * dungeonFlagScale * 1.5);
        ts.enemyCursedKnights.push({
          id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 30, health: hp, maxHealth: hp,
          damage: Math.floor(UNIT_STATS.cursedKnight.damage * zoneScale * dungeonFlagScale),
          defense: UNIT_STATS.cursedKnight.defense,
          speed: UNIT_STATS.cursedKnight.speed,
          attackRate: UNIT_STATS.cursedKnight.attackRate,
          attackRange: UNIT_STATS.cursedKnight.attackRange + Math.floor(Math.random() * 7) - 3,
          frame: 0, attackCooldown: 15,
          lane: Math.floor(Math.random() * 10) - 5,
        });
      } else {
        // Fire Imp (12%)
        const hp = Math.floor(UNIT_STATS.fireImp.health * zoneScale * dungeonFlagScale);
        ts.enemyFireImps.push({
          id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 22, health: hp, maxHealth: hp,
          damage: Math.floor(UNIT_STATS.fireImp.damage * zoneScale * dungeonFlagScale),
          speed: UNIT_STATS.fireImp.speed,
          attackRange: UNIT_STATS.fireImp.attackRange + Math.floor(Math.random() * 7) - 3,
          frame: 0, castTimer: 0, castTargetX: 0, castTargetY: 0,
          isCasting: false, castCooldown: 0,
          lane: Math.floor(Math.random() * 10) - 5,
        });
      }
      continue; // Skip normal spawn logic
    }

    const spawnRoll = Math.random();
    const spawnArcher = ts.bossesDefeated >= 1 && spawnRoll < 0.18;
    const spawnWraith = ts.bossesDefeated >= 2 && spawnRoll >= 0.18 && spawnRoll < 0.26;
    const spawnHound = ts.bossesDefeated >= 3 && spawnRoll >= 0.26 && spawnRoll < 0.36;
    const spawnLich = ts.bossesDefeated >= 4 && spawnRoll >= 0.36 && spawnRoll < 0.42;
    const spawnShadowAssassin = ts.bossesDefeated >= 5 && spawnRoll >= 0.42 && spawnRoll < 0.48;
    const spawnFlameCaller = ts.bossesDefeated >= 6 && spawnRoll >= 0.48 && spawnRoll < 0.53;
    const spawnCorruptedSentinel = ts.bossesDefeated >= 7 && spawnRoll >= 0.53 && spawnRoll < 0.57;

    if (spawnCorruptedSentinel) {
      const hp = Math.floor((UNIT_STATS.enemyCorruptedSentinel.health + flagsCaptured * 12) * zoneScale * flagScale);
      ts.enemyCorruptedSentinels.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 36, health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyCorruptedSentinel.damage * zoneScale * flagScale),
        defense: UNIT_STATS.enemyCorruptedSentinel.defense,
        speed: UNIT_STATS.enemyCorruptedSentinel.speed,
        attackRate: UNIT_STATS.enemyCorruptedSentinel.attackRate,
        attackRange: UNIT_STATS.enemyCorruptedSentinel.attackRange + Math.floor(Math.random() * 7) - 3,
        frame: 0, attackCooldown: 15,
        reflectActive: false, reflectTimer: 0,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else if (spawnFlameCaller) {
      const hp = Math.floor((UNIT_STATS.enemyFlameCaller.health + flagsCaptured * 3) * zoneScale * flagScale);
      ts.enemyFlameCallers.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 30, health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyFlameCaller.damage * zoneScale * flagScale),
        speed: UNIT_STATS.enemyFlameCaller.speed,
        attackRange: UNIT_STATS.enemyFlameCaller.attackRange + Math.floor(Math.random() * 7) - 3,
        frame: 0, castTimer: 0, castTargetX: 0, castTargetY: 0,
        isCasting: false, castCooldown: 0,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else if (spawnShadowAssassin) {
      const hp = Math.floor((UNIT_STATS.enemyShadowAssassin.health + flagsCaptured * 1) * zoneScale * flagScale);
      ts.enemyShadowAssassins.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 22, health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyShadowAssassin.damage * zoneScale * flagScale),
        speed: UNIT_STATS.enemyShadowAssassin.speed,
        attackRate: UNIT_STATS.enemyShadowAssassin.attackRate,
        attackRange: UNIT_STATS.enemyShadowAssassin.attackRange + Math.floor(Math.random() * 7) - 3,
        frame: 0, attackCooldown: 15,
        stealthTimer: 120, visibleTimer: 0, teleportCooldown: 0, scanTimer: 0,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else if (spawnLich) {
      // Lich summoners: 3.1x goblin HP so they survive long enough to summon
      const hp = Math.floor((UNIT_STATS.enemy.health + flagsCaptured * 3) * 3.1 * zoneScale * flagScale);
      ts.enemyLichs.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 30,
        health: hp, maxHealth: hp, damage: 0,
        speed: UNIT_STATS.enemyLich.speed,
        attackRange: UNIT_STATS.enemyLich.attackRange + Math.floor(Math.random() * 7) - 3,
        frame: 0, healCooldown: 0, iceballCooldown: 0,
        lane: Math.floor(Math.random() * 10) - 5,
        activeSkeletons: 0, passiveSummonTimer: 0,
      });
    } else if (spawnHound) {
      const hp = Math.floor((UNIT_STATS.enemyHound.health + flagsCaptured * 1) * zoneScale * flagScale * modEnemyHpMult(ts));
      ts.enemyHounds.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 18, health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyHound.damage * zoneScale * flagScale * modEnemyDmgMult(ts)),
        speed: (UNIT_STATS.enemyHound.speed + Math.random() * 0.3) * modEnemySpeedMult(ts), attackRate: UNIT_STATS.enemyHound.attackRate,
        attackRange: UNIT_STATS.enemyHound.attackRange + Math.floor(Math.random() * 7) - 3, frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
      // Flankers modifier: spawn 2 extra hounds
      if (modFlankersActive(ts)) {
        for (let fi = 0; fi < 2; fi++) {
          const fhp = Math.floor((UNIT_STATS.enemyHound.health + flagsCaptured * 1) * zoneScale * flagScale * modEnemyHpMult(ts));
          ts.enemyHounds.push({
            id: uid(), x: closestFlag.x + xOffset + (fi + 1) * 15, y: GROUND_Y - 18, health: fhp, maxHealth: fhp,
            damage: Math.floor(UNIT_STATS.enemyHound.damage * zoneScale * flagScale * modEnemyDmgMult(ts)),
            speed: (UNIT_STATS.enemyHound.speed + Math.random() * 0.3) * modEnemySpeedMult(ts), attackRate: UNIT_STATS.enemyHound.attackRate,
            attackRange: UNIT_STATS.enemyHound.attackRange + Math.floor(Math.random() * 7) - 3, frame: 0, attackCooldown: 15,
            lane: Math.floor(Math.random() * 10) - 5,
          });
        }
      }
    } else if (spawnArcher) {
      const hp = Math.floor((UNIT_STATS.enemyArcher.health + flagsCaptured * 2) * zoneScale * flagScale * modEnemyHpMult(ts));
      let archerDmg = Math.floor(UNIT_STATS.enemyArcher.damage * zoneScale * flagScale * modEnemyDmgMult(ts));
      let archerRange = UNIT_STATS.enemyArcher.attackRange + Math.floor(Math.random() * 7) - 3;
      if (modSharpshootersActive(ts)) {
        archerDmg = Math.floor(archerDmg * 1.15);
        archerRange = Math.floor(archerRange * 1.30);
      }
      ts.enemyArchers.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 22, health: hp, maxHealth: hp,
        damage: archerDmg,
        speed: UNIT_STATS.enemyArcher.speed * modEnemySpeedMult(ts), attackRate: UNIT_STATS.enemyArcher.attackRate,
        attackRange: archerRange, frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else if (spawnWraith) {
      const hp = Math.floor((UNIT_STATS.enemyWraith.health + flagsCaptured * 4) * zoneScale * flagScale * modEnemyHpMult(ts));
      ts.enemyWraiths.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - 35, health: hp, maxHealth: hp,
        damage: Math.floor(UNIT_STATS.enemyWraith.damage * zoneScale * flagScale * modEnemyDmgMult(ts)),
        defense: UNIT_STATS.enemyWraith.defense,
        speed: UNIT_STATS.enemyWraith.speed * modEnemySpeedMult(ts), attackRate: UNIT_STATS.enemyWraith.attackRate,
        attackRange: UNIT_STATS.enemyWraith.attackRange + Math.floor(Math.random() * 7) - 3, knockback: UNIT_STATS.enemyWraith.knockback,
        frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    } else {
      const hp = Math.floor((UNIT_STATS.enemy.health + flagsCaptured * 3) * zoneScale * flagScale * modEnemyHpMult(ts));
      ts.enemies.push({
        id: uid(), x: closestFlag.x + xOffset, y: GROUND_Y - ENEMY_SIZE, health: hp, maxHealth: hp,
        damage: Math.floor((UNIT_STATS.enemy.damage + flagsCaptured) * zoneScale * flagScale * modEnemyDmgMult(ts)),
        speed: (UNIT_STATS.enemy.speed + Math.random() * 0.3) * modEnemySpeedMult(ts), attackRate: UNIT_STATS.enemy.attackRate,
        attackRange: UNIT_STATS.enemy.attackRange + Math.floor(Math.random() * 7) - 3, frame: 0, attackCooldown: 15,
        lane: Math.floor(Math.random() * 10) - 5,
      });
    }

    // Apply challenge modifiers to freshly spawned enemies
    if (ts.challengeId === 'colosseum' || ts.challengeId === 'glassCannon') {
      const applyChallenge = (e: { health: number; maxHealth: number; damage: number; speed: number }) => {
        if (ts.challengeId === 'colosseum') {
          e.health *= 20; e.maxHealth *= 20; e.damage = Math.floor(e.damage * 2.5); e.speed *= 0.15;
        } else if (ts.challengeId === 'glassCannon') {
          e.health = Math.floor(e.health / 3); e.maxHealth = Math.floor(e.maxHealth / 3); e.damage *= 3;
        }
      };
      // Apply to the last pushed enemy of whichever type was spawned
      if (ts.enemies.length > enemyCountBefore) applyChallenge(ts.enemies[ts.enemies.length - 1]);
      if (ts.enemyArchers.length > archerCountBefore) applyChallenge(ts.enemyArchers[ts.enemyArchers.length - 1]);
      if (ts.enemyWraiths.length > wraithCountBefore) applyChallenge(ts.enemyWraiths[ts.enemyWraiths.length - 1]);
      if (ts.enemyHounds.length > houndCountBefore) applyChallenge(ts.enemyHounds[ts.enemyHounds.length - 1]);
      if (ts.enemyLichs.length > lichCountBefore) applyChallenge(ts.enemyLichs[ts.enemyLichs.length - 1]);
      if (ts.enemyShadowAssassins.length > shadowCountBefore) applyChallenge(ts.enemyShadowAssassins[ts.enemyShadowAssassins.length - 1]);
      if (ts.enemyFlameCallers.length > flameCountBefore) applyChallenge(ts.enemyFlameCallers[ts.enemyFlameCallers.length - 1]);
      if (ts.enemyCorruptedSentinels.length > sentinelCountBefore) applyChallenge(ts.enemyCorruptedSentinels[ts.enemyCorruptedSentinels.length - 1]);
    }

    // Colosseum reward: 1% chance to spawn a giant (3x HP, 1.5x DMG)
    if (modColosseumRewardActive(ts) && Math.random() < 0.01) {
      const makeGiant = (e: { health: number; maxHealth: number; damage: number }) => {
        e.health *= 3; e.maxHealth *= 3; e.damage = Math.floor(e.damage * 1.5);
      };
      if (ts.enemies.length > enemyCountBefore) makeGiant(ts.enemies[ts.enemies.length - 1]);
      if (ts.enemyArchers.length > archerCountBefore) makeGiant(ts.enemyArchers[ts.enemyArchers.length - 1]);
      if (ts.enemyWraiths.length > wraithCountBefore) makeGiant(ts.enemyWraiths[ts.enemyWraiths.length - 1]);
      if (ts.enemyHounds.length > houndCountBefore) makeGiant(ts.enemyHounds[ts.enemyHounds.length - 1]);
      if (ts.enemyLichs.length > lichCountBefore) makeGiant(ts.enemyLichs[ts.enemyLichs.length - 1]);
      if (ts.enemyShadowAssassins.length > shadowCountBefore) makeGiant(ts.enemyShadowAssassins[ts.enemyShadowAssassins.length - 1]);
      if (ts.enemyFlameCallers.length > flameCountBefore) makeGiant(ts.enemyFlameCallers[ts.enemyFlameCallers.length - 1]);
      if (ts.enemyCorruptedSentinels.length > sentinelCountBefore) makeGiant(ts.enemyCorruptedSentinels[ts.enemyCorruptedSentinels.length - 1]);
    }

    // Caltrops artifact: 20% chance newly spawned enemies start at 80% HP
    if (tickHasArtifact(ts, 'caltrops') && Math.random() < 0.20) {
      const applyCaltrap = (e: { health: number; maxHealth: number }) => { e.health = Math.floor(e.maxHealth * 0.8); };
      if (ts.enemies.length > enemyCountBefore) applyCaltrap(ts.enemies[ts.enemies.length - 1]);
      if (ts.enemyArchers.length > archerCountBefore) applyCaltrap(ts.enemyArchers[ts.enemyArchers.length - 1]);
      if (ts.enemyWraiths.length > wraithCountBefore) applyCaltrap(ts.enemyWraiths[ts.enemyWraiths.length - 1]);
      if (ts.enemyHounds.length > houndCountBefore) applyCaltrap(ts.enemyHounds[ts.enemyHounds.length - 1]);
      if (ts.enemyLichs.length > lichCountBefore) applyCaltrap(ts.enemyLichs[ts.enemyLichs.length - 1]);
      if (ts.enemyShadowAssassins.length > shadowCountBefore) applyCaltrap(ts.enemyShadowAssassins[ts.enemyShadowAssassins.length - 1]);
      if (ts.enemyFlameCallers.length > flameCountBefore) applyCaltrap(ts.enemyFlameCallers[ts.enemyFlameCallers.length - 1]);
      if (ts.enemyCorruptedSentinels.length > sentinelCountBefore) applyCaltrap(ts.enemyCorruptedSentinels[ts.enemyCorruptedSentinels.length - 1]);
    }
  }
}

/** Spawn boss when all regular flags in zone are captured */
export function processBossSpawning(ts: TickState): void {
  if (ts.inDungeon && ts.dungeonType !== 'timed') return;
  if (ts.timedDungeonVictory) return; // Boss already defeated
  const { flags, currentZone } = ts;
  const zoneFlagsTotal = flags.filter(f => !f.isBossFlag).length;
  const zoneFlagsCaptured = flags.filter(f => !f.isBossFlag && f.captured).length;
  const bossFlag = flags.find(f => f.isBossFlag && !f.captured);

  if (zoneFlagsCaptured !== zoneFlagsTotal || ts.boss || !bossFlag) return;

  // Boss rotation: 7 main-world bosses (type 4 = Dungeon Lich is dungeon-only)
  const BOSS_ROTATION = [0, 1, 2, 3, 5, 6, 7];
  const bossType = ts.dungeonType === 'timed' ? 4 : BOSS_ROTATION[currentZone % 7];
  // Diminished exponential: boss growth decays 2.5% per zone
  let bossHealth = Math.floor((UNIT_STATS.boss.health + currentZone * 250) * Math.pow(1.45, currentZone * Math.pow(0.975, currentZone)));
  if (bossType === 2) bossHealth = Math.floor(bossHealth * 3.75); // Wraith King has ~3.75x HP (tanky flag corruptor)
  if (bossType === 3) bossHealth = Math.floor(bossHealth * 2.0); // Broodmother: 2x HP
  if (bossType === 5) bossHealth = Math.floor(bossHealth * 2.5); // Ice Conjurer: 2.5x HP
  if (bossType === 6) bossHealth = Math.floor(bossHealth * 2.5); // Wendigo: 2.5x HP
  if (bossType === 7) bossHealth = Math.floor(bossHealth * 2.5); // Infernal General: 2.5x HP
  // Dungeon Lich: 1x HP (no multiplier)
  bossHealth = Math.floor(bossHealth * modBossHpMult(ts));
  const baseDmg = bossType === 1 ? (UNIT_STATS.boss as any).aoeDamage
    : bossType === 2 ? 55  // Wraith King spectral blast base
    : bossType === 3 ? 30  // Broodmother melee bite
    : bossType === 4 ? 12  // Dungeon Lich iceball
    : bossType === 5 ? 15  // Ice Conjurer: ranged caster
    : bossType === 6 ? 35  // Wendigo: high melee
    : bossType === 7 ? 25  // Infernal General: sword drop
    : UNIT_STATS.boss.damage;
  const bossDamage = Math.floor(baseDmg * Math.pow(1.4, currentZone * Math.pow(0.975, currentZone)));

  ts.boss = {
    x: bossFlag.x, y: GROUND_Y - 70, health: bossHealth, maxHealth: bossHealth,
    damage: bossDamage,
    speed: bossType === 2 ? 0.18 : 0,
    attackRate: bossType === 1
      ? Math.max(120, Math.floor((UNIT_STATS.boss.attackRate - currentZone * 5) * 3.3 * 1.20))  // Wild Huntsman: slower attack rate
      : bossType === 2
        ? Math.max(90, Math.floor((UNIT_STATS.boss.attackRate - currentZone * 5) * 2 * 1.20))  // Wraith King: -20% attack rate
        : bossType === 3 ? 180  // Broodmother: slow direct attack
        : bossType === 4 ? Math.max(240, Math.floor((UNIT_STATS.boss.attackRate - currentZone * 5) * 5))  // Dungeon Lich: slow attacks
        : bossType === 5 ? 288  // Ice Conjurer: ~4.8s iceball casts (20% faster)
        : bossType === 6 ? 150  // White Ninja: shuriken/melee (~2.5s)
        : bossType === 7 ? 300  // Infernal General: sword drop (~5s)
        : Math.max(40, Math.floor((UNIT_STATS.boss.attackRate - currentZone * 5) * 1.30)),  // Forest Guardian: -30% attack rate
    attackRange: bossType === 2 ? 90 : bossType === 3 ? 50 : bossType === 4 ? 200 : bossType === 5 ? 500 : bossType === 6 ? 300 : bossType === 7 ? 300 : UNIT_STATS.boss.attackRange,
    zone: currentZone, bossType,
    frame: 0, attackCooldown: 60, isAttacking: false, laserWarning: 0,
    ...(bossType === 3 ? { summonCooldown: 0, howlCooldown: 0, enrageTriggered: false } : {}),
    ...(bossType === 5 ? { wallCooldown: 0, turretCooldown: 0, enrageTriggered: false } : {}),
    ...(bossType === 6 ? { pounceCooldown: 0 } : {}),
    ...(bossType === 7 ? { summonCooldown: 0, cleaveCooldown: 0, enrageTriggered: false } : {}),
  };

  const bossNames: Record<number, string> = { 0: '\u{1F333} FOREST GUARDIAN', 1: '\u{1F3F9} WILD HUNTSMAN', 2: '\u{1F47B} WRAITH KING', 3: '\u{1F43A} BROODMOTHER', 4: '\u{1F480} DUNGEON LICH', 5: '❄️ ICE CONJURER', 6: '🥷 SNOW NINJA', 7: '🔥 INFERNAL GENERAL' };
  const bossColors: Record<number, string> = { 0: '#88dd44', 1: '#44aa22', 2: '#bb88ee', 3: '#cc6600', 4: '#bb88ee', 5: '#44ddff', 6: '#eeeeee', 7: '#ff4400' };
  const bossName = bossNames[bossType] || '⚠️ BOSS';
  ts.particles.push(makeParticle(bossFlag.x, GROUND_Y - 120, `⚠️ ${bossName} #${currentZone + 1} APPEARS! ⚠️`, bossColors[bossType] || '#ff4444'));
}

/** Handle unit slot respawning and initial unit spawning */
export function processUnitRespawn(ts: TickState): void {
  // Lone Wolf: no units at all
  if (ts.challengeId === 'loneWolf') return;
  // Duelist's Oath modifier: hero fights alone
  if (modDuelistOathActive(ts)) return;
  const { unitSlots, allies, runUpgrades, upgrades } = ts;
  const bossesDefeated = ts.bossesDefeated;
  const portalX = getPortalX(ts);

  // Respawn dead units
  const su = ts.shardUpgrades;
  for (let i = 0; i < unitSlots.length; i++) {
    const slot = unitSlots[i];
    if (slot.alive) continue;

    let respawnSpeed = 1;
    // Hasteborn: soldiers respawn 25% faster
    if (slot.type === 'soldier' && tickHasArtifact(ts, 'hasteborn')) respawnSpeed *= 1.25;
    // Rapid Deploy: all spawn timers -8%
    if (tickHasArtifact(ts, 'rapidDeploy')) respawnSpeed *= 1.08;
    // Fodder: soldiers respawn faster
    if (slot.type === 'soldier' && su.soldier_fodder > 0) respawnSpeed *= (1 + su.soldier_fodder * 0.05);
    // Regalia: per-unit respawnSpeed + army-wide respawnSpeed
    const regaliaRespawn = getRegaliaBonus(ts, 'respawnSpeed', { target: slot.type }) + getRegaliaBonus(ts, 'armyRespawnSpeed');
    if (regaliaRespawn > 0) respawnSpeed *= (1 + regaliaRespawn / 100);
    // Guard Post: -3% respawn timers per building (stacking)
    {
      let gpCount = 0;
      for (const f of ts.flags) if (f.captured && !f.corrupted && !f.contested && f.buildingType === 'guardPost') gpCount++;
      if (gpCount > 0) {
        const bpMult = getRelicLevel(ts.relicCollection['blueprints'] || 0) > 0 ? 1.5 : 1;
        respawnSpeed *= 1 / Math.max(0.7, 1 - 0.03 * gpCount * bpMult);
      }
    }
    respawnSpeed /= modRespawnTimeMult(ts);
    const newTimer = slot.respawnTimer - respawnSpeed;

    if (newTimer <= 0) {
      const stats = UNIT_STATS[slot.type as keyof typeof UNIT_STATS] as any;
      const buffLevel = runUpgrades[slot.type] || 0;
      let allyDamage = Math.floor(stats.damage * unitDmgMult(buffLevel));
      let allySpeed = stats.speed;
      let allyDef = 0;
      if (slot.type === 'soldier') allyDef = Math.floor(buffLevel / 4); // Soldier def nerf (~33%)
      if (slot.type === 'knight') allyDef = 2 + Math.floor(buffLevel / 2);
      if (slot.type === 'archer') allyDef = Math.floor(buffLevel / 4);
      if (slot.type === 'halberd') allyDef = 1 + Math.floor(buffLevel / 3);
      if (slot.type === 'wizard') allyDef = Math.floor(buffLevel / 7);
      if (tickHasArtifact(ts, 'swiftArmy')) allySpeed += 0.1;
      if (tickHasArtifact(ts, 'endurance') && isUnitMelee(slot.type)) allyDef += 1;
      if (tickHasArtifact(ts, 'trainingManual') && isUnitMelee(slot.type)) allyDamage += 2;
      const allyHealth = Math.floor(stats.health * unitHpMult(buffLevel));

      let allyAtkRate = stats.attackRate;
      let finalHealth = allyHealth;
      if (slot.type === 'soldier' && tickHasArtifact(ts, 'reinforced')) finalHealth = Math.floor(finalHealth * 1.2);
      if (slot.type === 'wizard' && tickHasArtifact(ts, 'manaCrystal')) allyAtkRate = Math.max(15, Math.floor(allyAtkRate * 0.92));
      finalHealth = Math.floor(finalHealth * modAllyHpMult(ts));
      allyDef += modAllyDefenseBonus(ts);
      const v = () => 0.98 + Math.random() * 0.04; // +/- 2% variance
      let allyRange = Math.round(stats.attackRange * v()) + Math.floor(Math.random() * 7) - 3;
      const newAlly: Ally = {
        id: uid(), slotIndex: i, unitType: slot.type, x: portalX, y: GROUND_Y - 20,
        health: finalHealth, maxHealth: finalHealth, damage: allyDamage, defense: allyDef,
        speed: allySpeed * v(), attackRate: allyAtkRate,
        attackRange: allyRange, frame: 0, attackCooldown: Math.floor(Math.random() * allyAtkRate),
        lane: Math.floor(Math.random() * 10) - 5,
      };
      if (modUnstablePortalActive(ts)) {
        newAlly.health = Math.floor(newAlly.maxHealth * 0.85);
      }
      applyShardUpgrades(newAlly, su);
      applyRelicEffects(newAlly, ts);
      applyAncientRelicSpawnEffects(newAlly, ts);
      applyDungeonBoosts(newAlly, ts);
      applyBuildingBuffs(newAlly, ts);
      applyRegaliaEffects(newAlly, ts);
      // Challenge: Glass Cannon — allies get 1/3 HP, 3x damage
      if (ts.challengeId === 'glassCannon') {
        newAlly.maxHealth = Math.floor(newAlly.maxHealth / 3);
        newAlly.health = newAlly.maxHealth;
        newAlly.damage *= 3;
      }
      // Rewards: Titan's Endurance (melee HP), Razor's Edge (dmg), Battle Hardened (atk speed) — scale with challenge level
      const cc = ts.challengeCompletions;
      const coloLv = cc.colosseum || 0;
      if (coloLv > 0 && isUnitMelee(newAlly.unitType)) {
        newAlly.maxHealth = Math.floor(newAlly.maxHealth * (1 + 0.15 * getChallengeRewardMult(coloLv)));
        newAlly.health = newAlly.maxHealth;
      }
      const gcLv = cc.glassCannon || 0;
      if (gcLv > 0) newAlly.damage = Math.floor(newAlly.damage * (1 + 0.10 * getChallengeRewardMult(gcLv)));
      const hordeLv = cc.hordeMode || 0;
      if (hordeLv > 0) newAlly.attackRate = Math.max(15, Math.floor(newAlly.attackRate * (1 - 0.08 * getChallengeRewardMult(hordeLv))));
      // Vanguard Pressure synergy: newly spawned units gain +10% damage for 3s
      if (tickHasSynergy(ts, 'armyPair1')) {
        newAlly.vanguardTimer = 180;
        newAlly.spawnDmgBonus = 1.10;
        ts.particles.push(makeParticle(portalX + 20, GROUND_Y - 60, '⚔️+10%', '#ff4444'));
      }
      // Goliath synergy: melee units have 1% chance to spawn large
      if (tickHasSynergy(ts, 'econPair7') && isUnitMelee(newAlly.unitType) && Math.random() < 0.01) {
        newAlly.maxHealth *= 3;
        newAlly.health = newAlly.maxHealth;
        newAlly.isGiant = true;
        ts.particles.push(makeParticle(portalX + 20, GROUND_Y - 50, 'GOLIATH!', '#ff4444'));
      }
      allies.push(newAlly);
      // Reserve synergy: 15% chance to spawn a temporary extra soldier on respawn
      if (slot.type === 'soldier' && tickHasSynergy(ts, 'soldierPair') && Math.random() < 0.15) {
        const tempSoldier: Ally = { ...newAlly, id: uid(), slotIndex: -1 };
        allies.push(tempSoldier);
        ts.particles.push(makeParticle(portalX + 30, GROUND_Y - 50, 'RESERVE!', '#44ff44'));
      }
      ts.particles.push(makeParticle(portalX + 20, GROUND_Y - 40, `${stats.name}${newAlly.isElite ? ' ★ELITE★' : newAlly.isGiant ? ' GIANT' : newAlly.isJuiced ? ' JUICED' : newAlly.hasHorn ? ' \u{1F4EF}HORN' : newAlly.hasCrown ? ' \u{1F451}CROWN' : newAlly.hasBanner ? ' \u{1F6A9}BANNER' : ''} Ready!`, stats.color));
      unitSlots[i] = { ...slot, alive: true, respawnTimer: 0 };
    } else {
      unitSlots[i] = { ...slot, respawnTimer: newTimer };
    }
  }

  // Spawn initial units that don't have an active ally
  for (let i = 0; i < unitSlots.length; i++) {
    const slot = unitSlots[i];
    if (!slot.alive || allies.some(a => a.slotIndex === i)) continue;

    const stats = UNIT_STATS[slot.type as keyof typeof UNIT_STATS] as any;
    const buffLevel = runUpgrades[slot.type] || 0;
    let allyDamage = Math.floor(stats.damage * unitDmgMult(buffLevel));
    let allySpeed = stats.speed;
    let allyDef = 0;
    if (slot.type === 'soldier') allyDef = Math.floor(buffLevel / 4);
    if (slot.type === 'knight') allyDef = 2 + Math.floor(buffLevel / 2);
    if (slot.type === 'archer') allyDef = Math.floor(buffLevel / 4);
    if (slot.type === 'halberd') allyDef = 1 + Math.floor(buffLevel / 3);
    if (slot.type === 'wizard') allyDef = Math.floor(buffLevel / 7);
    if (tickHasArtifact(ts, 'swiftArmy')) allySpeed += 0.1;
    if (tickHasArtifact(ts, 'endurance') && isUnitMelee(slot.type)) allyDef += 1;
    if (tickHasArtifact(ts, 'trainingManual') && isUnitMelee(slot.type)) allyDamage += 2;
    const allyHealth = Math.floor(stats.health * unitHpMult(buffLevel));

    let allyAtkRate2 = stats.attackRate;
    let finalHealth2 = allyHealth;
    if (slot.type === 'soldier' && tickHasArtifact(ts, 'reinforced')) finalHealth2 = Math.floor(finalHealth2 * 1.2);
    if (slot.type === 'wizard' && tickHasArtifact(ts, 'manaCrystal')) allyAtkRate2 = Math.max(15, Math.floor(allyAtkRate2 * 0.92));
    finalHealth2 = Math.floor(finalHealth2 * modAllyHpMult(ts));
    allyDef += modAllyDefenseBonus(ts);
    const v2 = () => 0.98 + Math.random() * 0.04; // +/- 2% variance
    let allyRange2 = Math.round(stats.attackRange * v2()) + Math.floor(Math.random() * 7) - 3;
    const newAlly: Ally = {
      id: uid(), slotIndex: i, unitType: slot.type, x: portalX, y: GROUND_Y - 20,
      health: finalHealth2, maxHealth: finalHealth2, damage: allyDamage, defense: allyDef,
      speed: allySpeed * v2(), attackRate: allyAtkRate2,
      attackRange: allyRange2, frame: 0, attackCooldown: Math.floor(Math.random() * allyAtkRate2),
      lane: Math.floor(Math.random() * 10) - 5,
    };
    if (modUnstablePortalActive(ts)) {
      newAlly.health = Math.floor(newAlly.maxHealth * 0.85);
    }
    applyShardUpgrades(newAlly, su);
    applyRelicEffects(newAlly, ts);
    applyAncientRelicSpawnEffects(newAlly, ts);
    applyDungeonBoosts(newAlly, ts);
    applyBuildingBuffs(newAlly, ts);
    applyRegaliaEffects(newAlly, ts);
    // Challenge: Glass Cannon — allies get 1/3 HP, 3x damage
    if (ts.challengeId === 'glassCannon') {
      newAlly.maxHealth = Math.floor(newAlly.maxHealth / 3);
      newAlly.health = newAlly.maxHealth;
      newAlly.damage *= 3;
    }
    // Rewards: Titan's Endurance (melee HP), Razor's Edge (dmg), Battle Hardened (atk speed) — scale with challenge level
    const cc2 = ts.challengeCompletions;
    const coloLv2 = cc2.colosseum || 0;
    if (coloLv2 > 0 && isUnitMelee(newAlly.unitType)) {
      newAlly.maxHealth = Math.floor(newAlly.maxHealth * (1 + 0.15 * getChallengeRewardMult(coloLv2)));
      newAlly.health = newAlly.maxHealth;
    }
    const gcLv2 = cc2.glassCannon || 0;
    if (gcLv2 > 0) newAlly.damage = Math.floor(newAlly.damage * (1 + 0.10 * getChallengeRewardMult(gcLv2)));
    const hordeLv2 = cc2.hordeMode || 0;
    if (hordeLv2 > 0) newAlly.attackRate = Math.max(15, Math.floor(newAlly.attackRate * (1 - 0.08 * getChallengeRewardMult(hordeLv2))));
    // Vanguard Pressure synergy: newly spawned units gain +10% damage for 3s
    if (tickHasSynergy(ts, 'armyPair1')) {
      newAlly.vanguardTimer = 180;
      newAlly.spawnDmgBonus = 1.10;
      ts.particles.push(makeParticle(portalX + 20, GROUND_Y - 60, '⚔️+10%', '#ff4444'));
    }
    // Goliath synergy: melee units have 1% chance to spawn large
    if (tickHasSynergy(ts, 'econPair7') && isUnitMelee(newAlly.unitType) && Math.random() < 0.01) {
      newAlly.maxHealth *= 3;
      newAlly.health = newAlly.maxHealth;
      newAlly.isGiant = true;
      ts.particles.push(makeParticle(portalX + 20, GROUND_Y - 50, 'GOLIATH!', '#ff4444'));
    }
    allies.push(newAlly);
    // Reserve synergy: 15% chance to spawn a temporary extra soldier on spawn
    if (slot.type === 'soldier' && tickHasSynergy(ts, 'soldierPair') && Math.random() < 0.15) {
      const tempSoldier: Ally = { ...newAlly, id: uid(), slotIndex: -1 };
      allies.push(tempSoldier);
      ts.particles.push(makeParticle(portalX + 30, GROUND_Y - 50, 'RESERVE!', '#44ff44'));
    }
  }
}

/** Apply regalia modifier effects to an ally at spawn time */
export function applyRegaliaEffects(ally: Ally, ts: TickState): void {
  const t = ally.unitType;
  const cat = isUnitInCategory(t, 'melee') ? 'melee' : isUnitInCategory(t, 'ranged') ? 'ranged' : isUnitInCategory(t, 'magic') ? 'magic' : null;

  // --- Per-unit targeted mods (damageFlat, damagePct, hpFlat, hpPct, defenseFlat, attackSpeed, moveSpeed) ---
  const dmgFlat = getRegaliaBonus(ts, 'damageFlat', { target: t });
  if (dmgFlat > 0) ally.damage += Math.floor(dmgFlat);
  const dmgPct = getRegaliaBonus(ts, 'damagePct', { target: t });
  if (dmgPct > 0) ally.damage = Math.floor(ally.damage * (1 + dmgPct / 100));
  const hpFlat = getRegaliaBonus(ts, 'hpFlat', { target: t });
  if (hpFlat > 0) { ally.maxHealth += Math.floor(hpFlat); ally.health = ally.maxHealth; }
  const hpPct = getRegaliaBonus(ts, 'hpPct', { target: t });
  if (hpPct > 0) { ally.maxHealth = Math.floor(ally.maxHealth * (1 + hpPct / 100)); ally.health = ally.maxHealth; }
  const defFlat = getRegaliaBonus(ts, 'defenseFlat', { target: t });
  if (defFlat > 0) ally.defense = (ally.defense || 0) + Math.floor(defFlat);
  const atkSpd = getRegaliaBonus(ts, 'attackSpeed', { target: t });
  if (atkSpd > 0) ally.attackRate = Math.max(15, Math.floor(ally.attackRate * (1 - atkSpd / 100)));
  const moveSpd = getRegaliaBonus(ts, 'moveSpeed', { target: t });
  if (moveSpd > 0) ally.speed += moveSpd;

  // --- Category mods (melee/ranged/magic) ---
  if (cat) {
    const catDmg = getRegaliaBonus(ts, 'catDamagePct', { category: cat });
    if (catDmg > 0) ally.damage = Math.floor(ally.damage * (1 + catDmg / 100));
    const catAtk = getRegaliaBonus(ts, 'catAttackSpeed', { category: cat });
    if (catAtk > 0) ally.attackRate = Math.max(15, Math.floor(ally.attackRate * (1 - catAtk / 100)));
    const catHp = getRegaliaBonus(ts, 'catHpPct', { category: cat });
    if (catHp > 0) { ally.maxHealth = Math.floor(ally.maxHealth * (1 + catHp / 100)); ally.health = ally.maxHealth; }
    const catDef = getRegaliaBonus(ts, 'catDefense', { category: cat });
    if (catDef > 0) ally.defense = (ally.defense || 0) + Math.floor(catDef);
  }

  // --- Army-wide mods ---
  const armyDmg = getRegaliaBonus(ts, 'armyDamagePct');
  if (armyDmg > 0) ally.damage = Math.floor(ally.damage * (1 + armyDmg / 100));
  const armyAtk = getRegaliaBonus(ts, 'armyAttackSpeed');
  if (armyAtk > 0) ally.attackRate = Math.max(15, Math.floor(ally.attackRate * (1 - armyAtk / 100)));
  const armyHp = getRegaliaBonus(ts, 'armyHpPct');
  if (armyHp > 0) { ally.maxHealth = Math.floor(ally.maxHealth * (1 + armyHp / 100)); ally.health = ally.maxHealth; }
  const armyDef = getRegaliaBonus(ts, 'armyDefense');
  if (armyDef > 0) ally.defense = (ally.defense || 0) + Math.floor(armyDef);
  const armyMoveSpd = getRegaliaBonus(ts, 'armyMoveSpeed');
  if (armyMoveSpd > 0) ally.speed += armyMoveSpd;

  // Re-sync health and base attack rate after all modifications
  ally.health = ally.maxHealth;
  ally.baseAttackRate = ally.attackRate;
}

/** Apply passive flag building buffs at spawn time */
export function applyBuildingBuffs(ally: Ally, ts: TickState): void {
  // Count buildings (stacking: 2 Forges = +4 damage)
  const buildingCounts: Record<string, number> = {};
  for (const f of ts.flags) {
    if (f.captured && !f.corrupted && !f.contested && f.buildingType) {
      buildingCounts[f.buildingType] = (buildingCounts[f.buildingType] || 0) + 1;
    }
  }
  const count = (type: string) => buildingCounts[type] || 0;
  // Blueprints relic: +50% building effects
  const blueprintsMult = getRelicLevel(ts.relicCollection['blueprints'] || 0) > 0 ? 1.5 : 1;

  const forgeN = count('forge');
  if (forgeN > 0) ally.damage += Math.floor(2 * forgeN * blueprintsMult);
  const leatherworksN = count('leatherworks');
  if (leatherworksN > 0) ally.defense += Math.floor(1 * leatherworksN * blueprintsMult);
  const tavernN = count('tavern');
  if (tavernN > 0) {
    const bonus = Math.floor(ally.maxHealth * 0.08 * tavernN * blueprintsMult);
    ally.health += bonus;
    ally.maxHealth += bonus;
  }
  const barracksN = count('barracks');
  if (barracksN > 0) ally.attackRate = Math.max(15, Math.floor(ally.attackRate * Math.max(0.7, 1 - 0.05 * barracksN * blueprintsMult)));
  const lumbercampN = count('lumbercamp');
  if (lumbercampN > 0) ally.speed += 0.05 * lumbercampN * blueprintsMult;
  const guardPostN = count('guardPost');
  if (guardPostN > 0) {
    // Guard Post: -3% respawn timers (applied via respawn timer reduction, not at spawn)
    // Store count for respawn system to use — actual effect is in processUnitRespawn
  }
  // War Shrine: 3% crit chance — applied in combat at attack time, not at spawn
}

/** Apply ancient relic spawn effects (Horn, Crown, Banner) */
export function applyAncientRelicSpawnEffects(ally: Ally, ts: TickState): void {
  const owned = ts.ancientRelicsOwned;
  const copies = ts.ancientRelicCopies;
  // Warlord's Horn: spawn chance scales with level, self atk speed boost = (1 - atkBonus)
  if (owned.includes('warlordsHorn')) {
    const hornEff = getAncientEffect('warlordsHorn', getAncientRelicLevel(copies['warlordsHorn'] || 1));
    if (Math.random() < (hornEff.atkBonus || 0.10) * 0.5) { // spawn chance = atkBonus * 0.5 (5%→15%)
      ally.hasHorn = true;
      ally.attackRate = Math.max(10, Math.floor(ally.attackRate * (1 - (hornEff.atkBonus || 0.10)))); // self atk speed boost
    }
  }
  // Crown of the Ancients: 2% chance to spawn with crown (stat mult + slow aura scales with level)
  if (!ally.hasHorn && owned.includes('crownOfTheAncients')) {
    const crownEff = getAncientEffect('crownOfTheAncients', getAncientRelicLevel(copies['crownOfTheAncients'] || 1));
    if (Math.random() < 0.02) {
      ally.hasCrown = true;
      const mult = crownEff.statMult || 1.5;
      ally.health = Math.floor(ally.health * mult); ally.maxHealth = Math.floor(ally.maxHealth * mult);
      ally.damage = Math.floor(ally.damage * mult);
    }
  }
  // War Banner: 5% chance to spawn with banner (damage aura scales with level)
  if (!ally.hasHorn && !ally.hasCrown && owned.includes('warBanner') && Math.random() < 0.05) {
    ally.hasBanner = true;
  }
}
