import { useEffect, useRef } from 'react';
import { CAMERA_OFFSET, VIEWPORT_W, GROUND_Y } from '../constants';
import { makeParticle } from '../utils/helpers';
import type { GameState, PermanentUpgrades, ShardUpgrades, GameScreen, Artifact, CameraMode, Backpack, ConsumableId, ChallengeCompletions, DungeonMetaUpgrades } from '../types';
import { passiveGoldPerMin } from '../utils/economy';
import type { TickState } from '../systems/tickState';
import { RELIC_SETS, getSetPieceCount, getRelicLevel, type RelicCollection } from '../relics';
import { SYNERGY_PAIRS } from '../artifacts';
import type { Regalia, RegaliaSlot, RegaliaState } from '../regalias';

// Systems
import { processHeroMovement } from '../systems/movement';
import { findClosestUncapturedFlag, processEnemySpawning, processBossSpawning, processUnitRespawn, processRoyalGuardSpawn } from '../systems/spawning';
import { processHeroCombat, processAutoFireball, processProjectileMovement, processProjectileHits, processRelicFireball, processHeroEdgeDagger } from '../systems/combat';
import { processSkillCooldowns, processSkillBuffTimers, processSkillUnlockCheck, processBloodlust, processSecondWind, processAutoWeaponThrow, processAutoSkills, processManualSkillUses, processPoisonTicks, processMarkedTimers, processBirdsEye, processSnareTrap, processNaturesGrace, processManaShield, processChanneling, processArcaneFamiliar, processBarrierTimers } from '../systems/skills';
import { processBossAI, processArcherAI, processEnemyAI, processWraithAI, processHoundAI, processLichAI, processShadowAssassinAI, processFlameCallerAI, processCorruptedSentinelAI, processDungeonRatAI, processFireImpAI, processCursedKnightAI, processAllyAI, processCrystalTurretAI, processIceTurretAI } from '../systems/ai';
import { processEconomy, processDeathRewards, processAllyDeaths, processLichNecromancy, processRelicFlagHaven, fastForwardIncome } from '../systems/economy';
import { processHeroFlagCapture, processAllyFlagCapture, processChestCollection, processBossDefeat, processParticles, processFlagContest, processFlagBuildings, processDungeonKeyPortal } from '../systems/flags';
import { processDungeonWaveTimer, processDungeonMining, processDungeonEndCheck, processDungeonPortalTimer, processTimedDungeonPortalTimer, processTimedDungeonTimer, processTimedDungeonEnd, processTimedDungeonFlagIncome, processRegaliaKeyPortal, processDungeonTickCounter } from '../systems/dungeon';
import { processPetTick } from '../systems/pets';
import { processEliteTracking, processForceSpawnElite } from '../systems/elites';
import { perf } from '../utils/perfProfiler';

/** Shallow-copy an array of objects — uses Object.assign which is faster than spread for objects with many keys */
function copyArray<T extends object>(arr: T[]): T[] {
  const len = arr.length;
  const out = new Array<T>(len);
  for (let i = 0; i < len; i++) out[i] = Object.assign({} as T, arr[i]);
  return out;
}

/** Run one game tick: build TickState, run all systems, return new GameState */
function gameTick(prev: GameState, frameRef: React.MutableRefObject<number>, upgrades: PermanentUpgrades, shardUpgrades: ShardUpgrades, relicCollection: RelicCollection, cameraMode: CameraMode, ancientRelicsOwned: string[], ancientRelicCopies: Record<string, number>, backpack: Backpack, onCollectConsumable: (id: ConsumableId) => void, challengeCompletions: ChallengeCompletions, equippedRegalias: Record<RegaliaSlot, Regalia | null>, onCollectRegalia: (regalia: Regalia) => void, equippedPet: string, ownedPets: string[], onCollectPet: (petId: string) => void): GameState {
  if (prev.gameOver || prev.pendingArtifactChoice || prev.pendingRelicChoice || prev.pendingRoll || prev.pendingSkillChoice || prev.tutorialDialogueVisible || prev.challengeLevelUpPending || prev.devPaused) return prev;
  // Guard: StrictMode double-invokes state updaters — only increment once per tick
  const expectedFrame = prev.frame + 1;
  if (frameRef.current < expectedFrame) frameRef.current = expectedFrame;
  const frame = frameRef.current;

  // Merge persistent relics with current-run drops so effects apply immediately
  let effectiveRelics = relicCollection;
  if (prev.relicDrops && prev.relicDrops.length > 0) {
    effectiveRelics = { ...relicCollection };
    for (const id of prev.relicDrops) effectiveRelics[id] = (effectiveRelics[id] || 0) + 1;
  }

  // Build mutable TickState from immutable GameState
  perf.begin('tick.copyState');
  const ts: TickState = {
    hero: { ...prev.hero, frame },
    flags: copyArray(prev.flags),
    enemies: copyArray(prev.enemies),
    enemyArchers: prev.enemyArchers?.length ? copyArray(prev.enemyArchers) : [],
    enemyWraiths: prev.enemyWraiths?.length ? copyArray(prev.enemyWraiths) : [],
    enemyHounds: prev.enemyHounds?.length ? copyArray(prev.enemyHounds) : [],
    enemyLichs: prev.enemyLichs?.length ? copyArray(prev.enemyLichs) : [],
    enemyShadowAssassins: prev.enemyShadowAssassins?.length ? copyArray(prev.enemyShadowAssassins) : [],
    enemyFlameCallers: prev.enemyFlameCallers?.length ? copyArray(prev.enemyFlameCallers) : [],
    enemyCorruptedSentinels: prev.enemyCorruptedSentinels?.length ? copyArray(prev.enemyCorruptedSentinels) : [],
    enemyDungeonRats: prev.enemyDungeonRats?.length ? copyArray(prev.enemyDungeonRats) : [],
    enemyFireImps: prev.enemyFireImps?.length ? copyArray(prev.enemyFireImps) : [],
    enemyCursedKnights: prev.enemyCursedKnights?.length ? copyArray(prev.enemyCursedKnights) : [],
    recentAllyDeaths: [],
    allies: copyArray(prev.allies),
    nonPetAllies: [],  // populated below after allies copy
    buildingCounts: { forge: 0, warShrine: 0, barracks: 0, leatherworks: 0, church: 0, blueprintsMult: 1 },  // populated below
    unitSlots: copyArray(prev.unitSlots),
    particles: copyArray(prev.particles),
    projectiles: prev.projectiles?.length ? copyArray(prev.projectiles) : [],
    chests: prev.chests?.length ? copyArray(prev.chests) : [],
    banners: prev.banners?.length ? copyArray(prev.banners) : [],
    barricades: prev.barricades?.length ? copyArray(prev.barricades) : [],
    crystalTurrets: prev.crystalTurrets?.length ? copyArray(prev.crystalTurrets) : [],
    iceWalls: prev.iceWalls?.length ? copyArray(prev.iceWalls) : [],
    iceTurrets: prev.iceTurrets?.length ? copyArray(prev.iceTurrets) : [],
    boss: prev.boss ? { ...prev.boss, frame } : null,

    smithingBonusStacks: prev.smithingBonusStacks || 0,
    goldEarned: prev.goldEarned,
    flagsCaptured: prev.flagsCaptured,
    lastFlagCaptureFrame: prev.lastFlagCaptureFrame || 0,
    gemsThisRun: prev.gemsThisRun || 0,
    shardsThisRun: prev.shardsThisRun || 0,
    currentZone: prev.currentZone,
    bossesDefeated: prev.bossesDefeated || 0,
    enemiesKilled: prev.enemiesKilled || 0,
    killGoldEarned: prev.killGoldEarned || 0,
    eliteKills: prev.eliteKills || 0,
    incomeTimer: prev.incomeTimer || 0,
    incomeTimer2: prev.incomeTimer2 || 0,
    incomeTimer3: prev.incomeTimer3 || 0,
    incomeTimer4: prev.incomeTimer4 || 0,
    incomeTimer5: prev.incomeTimer5 || 0,
    incomeTimer6: prev.incomeTimer6 || 0,
    incomeTimer7: prev.incomeTimer7 || 0,
    incomeTimer8: prev.incomeTimer8 || 0,
    regenTimer: prev.regenTimer || 0,
    autoFireball: prev.autoFireball || false,
    autoSkills: prev.autoSkills || [],
    autoPortalForward: prev.autoPortalForward || false,
    armyHoldMode: prev.armyHoldMode || false,
    cameraX: prev.cameraX,
    portalFlagIndex: prev.portalFlagIndex,
    totalGoldEarned: prev.totalGoldEarned || 0,
    pendingArtifactChoice: null,

    relicDrops: [...(prev.relicDrops || [])],
    pendingRelicChoice: null,

    freeRerolls: prev.freeRerolls || 0,
    artifactKeyPortalRequested: prev.artifactKeyPortalRequested || false,
    regaliaKeyPortalRequested: prev.regaliaKeyPortalRequested || false,
    onCollectConsumable,

    // Regalia system
    onCollectRegalia,
    equippedRegalias,

    challengeId: prev.challengeId || null,
    challengeComplete: prev.challengeComplete || false,
    challengeLevel: prev.challengeLevel || 0,
    challengeLevelUpPending: prev.challengeLevelUpPending || false,

    blessingCooldown: prev.blessingCooldown || 0,
    decreeActive: prev.decreeActive || false,

    heroSkills: { ...prev.heroSkills },
    pendingSkillChoice: null,
    pendingSkillUses: prev.pendingSkillUses || [],
    killsThisTick: 0,

    // Dungeon state
    inDungeon: prev.inDungeon || false,
    dungeonWave: prev.dungeonWave || 0,
    dungeonWaveTimer: prev.dungeonWaveTimer || 0,
    dungeonMiningTimer: prev.dungeonMiningTimer || 0,
    dungeonMedals: prev.dungeonMedals || 0,
    dungeonFragmentsEarned: prev.dungeonFragmentsEarned || 0,
    dungeonEnemiesAlive: prev.dungeonEnemiesAlive || 0,
    dungeonEliteWaveNext: prev.dungeonEliteWaveNext || false,
    dungeonBonusMedalAwarded: prev.dungeonBonusMedalAwarded || false,
    dungeonArenaLeftX: prev.dungeonArenaLeftX || 0,
    dungeonArenaRightX: prev.dungeonArenaRightX || 0,
    dungeonArenaSpawnX: prev.dungeonArenaSpawnX || 0,
    dungeonShopOpen: prev.dungeonShopOpen || false,
    dungeonTriggerZone: prev.dungeonTriggerZone || 0,
    dungeonTriggerFlags: prev.dungeonTriggerFlags || 0,
    dungeonPortalTimer: prev.dungeonPortalTimer || 0,
    dungeonPortalFlagId: prev.dungeonPortalFlagId ?? -1,
    dungeonUnlocked: prev.dungeonUnlocked || false,
    dungeonPityCounter: prev.dungeonPityCounter || 0,
    dungeonOver: prev.dungeonOver || false,
    dungeonMeleeBoost: prev.dungeonMeleeBoost || 0,
    dungeonRangedBoost: prev.dungeonRangedBoost || 0,
    dungeonMagicBoost: prev.dungeonMagicBoost || 0,
    dungeonAllyMode: prev.dungeonAllyMode || 'advance',
    dungeonUnitsRolled: prev.dungeonUnitsRolled || 0,
    dungeonMetaUpgrades: prev.dungeonMetaUpgrades || { headStart: 0, efficientMining: 0, eliteBounty: 0 },

    // Timed dungeon state
    dungeonType: prev.dungeonType || null,
    timedDungeonTimer: prev.timedDungeonTimer || 0,
    timedDungeonVictory: prev.timedDungeonVictory || false,
    timedDungeonPortalTimer: prev.timedDungeonPortalTimer || 0,
    timedDungeonPortalFlagId: prev.timedDungeonPortalFlagId ?? -1,
    dungeonTicksSpent: prev.dungeonTicksSpent || 0,

    // Elite mini-boss state
    eliteLastSpawnFrame: prev.eliteLastSpawnFrame ?? -99999,
    activeEliteId: prev.activeEliteId ?? null,
    activeEliteVariant: prev.activeEliteVariant ?? null,
    lastEliteVariants: prev.lastEliteVariants ? [...prev.lastEliteVariants] : [],
    eliteArtifactDroppedThisRun: prev.eliteArtifactDroppedThisRun || false,
    forceSpawnElite: prev.forceSpawnElite || false,

    // Pet state
    petCooldown: prev.petCooldown || 0,
    equippedPet: equippedPet || '',
    onCollectPet,
    ownedPets,

    devGodMode: prev.devGodMode || false,

    heroClass: prev.heroClass,
    artifacts: prev.artifacts || [],
    ...(() => {
      const ownedArtifactIds = new Set((prev.artifacts || []).map(a => a.id));
      const activeSynergies = new Set<string>();
      for (const pair of SYNERGY_PAIRS) {
        if (ownedArtifactIds.has(pair.artifactA) && ownedArtifactIds.has(pair.artifactB)) {
          activeSynergies.add(pair.id);
        }
      }
      return { ownedArtifactIds, activeSynergies };
    })(),
    runUpgrades: prev.runUpgrades,
    upgrades,
    shardUpgrades,
    relicCollection: effectiveRelics,
    backpack,
    ancientRelicsOwned,
    ancientRelicCopies,
    challengeCompletions,
    // Precompute relic set piece counts for O(1) set bonus checks
    relicSetPieces: (() => {
      const pieces: Record<string, number> = {};
      for (const s of RELIC_SETS) {
        pieces[s.id] = getSetPieceCount(s, effectiveRelics);
      }
      return pieces;
    })(),
    frame,
  };

  // Cache non-pet allies once per tick (used by all enemy AI to ignore pets)
  ts.nonPetAllies = ts.allies.filter(a => !a.isPet);

  // Pre-compute building counts once per tick (avoids 14+ flag scans per tick)
  {
    let forge = 0, warShrine = 0, barracks = 0, leatherworks = 0, church = 0;
    for (const f of ts.flags) {
      if (f.captured && !f.corrupted && !f.contested && f.buildingType) {
        if (f.buildingType === 'forge') forge++;
        else if (f.buildingType === 'warShrine') warShrine++;
        else if (f.buildingType === 'barracks') barracks++;
        else if (f.buildingType === 'leatherworks') leatherworks++;
        else if (f.buildingType === 'church') church++;
      }
    }
    const bpM = getRelicLevel(ts.relicCollection['blueprints'] || 0) > 0 ? 1.5 : 1;
    ts.buildingCounts = { forge, warShrine, barracks, leatherworks, church, blueprintsMult: bpM };
  }
  perf.end('tick.copyState');

  // === Run all systems in original execution order ===

  // Movement & interaction
  perf.begin('tick.movement');
  processHeroMovement(ts);
  processHeroFlagCapture(ts);
  processChestCollection(ts);
  perf.end('tick.movement');

  // Spawning (skip when dev tool disables spawns)
  perf.begin('tick.spawning');
  const closestFlag = findClosestUncapturedFlag(ts);
  if (!prev.devSpawnsDisabled) {
    processEnemySpawning(ts, closestFlag);
    processBossSpawning(ts);
    processRoyalGuardSpawn(ts);
  }
  perf.end('tick.spawning');

  // Boss & archer AI (run before projectile updates)
  perf.begin('tick.bossArcherAI');
  processBossAI(ts);
  processArcherAI(ts);
  perf.end('tick.bossArcherAI');

  // Projectiles
  perf.begin('tick.projectiles');
  processProjectileMovement(ts);
  processProjectileHits(ts);
  perf.end('tick.projectiles');

  // Unit respawn & economy
  perf.begin('tick.economy');
  processUnitRespawn(ts);
  processEconomy(ts);
  processRelicFlagHaven(ts);
  perf.end('tick.economy');

  // Ally AI & flag capture (runs first so allies move into position)
  perf.begin('tick.allyAI');
  processAllyAI(ts);
  processAllyFlagCapture(ts);
  processFlagContest(ts);
  processFlagBuildings(ts);
  perf.end('tick.allyAI');

  // Process banners: tick lifetime, apply aura
  ts.banners = ts.banners.filter(b => {
    b.lifetime--;
    if (b.lifetime <= 0) return false;
    // Heal allies within radius every 60 ticks (1s)
    if (ts.frame % 60 === 0) {
      for (const ally of ts.allies) {
        if (ally.health > 0 && ally.health < ally.maxHealth && Math.abs(ally.x - b.x) < b.radius) {
          const heal = Math.max(1, Math.floor(ally.maxHealth * b.regenRate));
          ally.health = Math.min(ally.maxHealth, ally.health + heal);
        }
      }
      // Also heal hero
      if (ts.hero.health > 0 && ts.hero.health < ts.hero.maxHealth && Math.abs(ts.hero.x - b.x) < b.radius) {
        const heal = Math.max(1, Math.floor(ts.hero.maxHealth * b.regenRate));
        ts.hero.health = Math.min(ts.hero.maxHealth, ts.hero.health + heal);
      }
    }
    // Speed bonus for allies in banner range (timer-based to prevent compounding)
    for (const ally of ts.allies) {
      if (ally.health > 0 && Math.abs(ally.x - b.x) < b.radius) {
        ally.bannerSpeedTimer = 2;
      }
    }
    return true;
  });
  // Tick banner cooldown
  if ((ts.hero.bannerCooldown || 0) > 0) ts.hero.bannerCooldown!--;

  // Process barricades: remove if behind portal or destroyed, rally post buff
  const portalBarricadeX = ts.portalFlagIndex >= 0 ? (ts.flags[ts.portalFlagIndex]?.x || 40) : 40;
  ts.barricades = ts.barricades.filter(barricade => {
    if (barricade.x <= portalBarricadeX) return false;
    // Rally Post synergy: allies passing barricade gain +0.2 speed for 2s (120 ticks)
    if (ts.activeSynergies.has('econPair5')) {
      for (const ally of ts.allies) {
        if (ally.health > 0 && Math.abs(ally.x - barricade.x) < 30 && !(ally.rallyTimer && ally.rallyTimer > 0)) {
          ally.rallyTimer = 120;
        }
      }
    }
    if (barricade.health <= 0) {
      ts.particles.push(makeParticle(barricade.x, barricade.y - 10, 'Watchtower destroyed!', '#ff4444'));
      return false;
    }
    return true;
  });

  // Clean up dead ice walls
  ts.iceWalls = ts.iceWalls.filter(w => w.health > 0);

  // Enemy AI (runs after allies so enemies see blocked state and counter-attack same tick)
  perf.begin('tick.enemyAI');
  processEnemyAI(ts);
  processWraithAI(ts);
  processHoundAI(ts);
  processLichAI(ts);
  processShadowAssassinAI(ts);
  processFlameCallerAI(ts);
  processCorruptedSentinelAI(ts);
  processDungeonRatAI(ts);
  processFireImpAI(ts);
  processCursedKnightAI(ts);
  processCrystalTurretAI(ts);
  processIceTurretAI(ts);
  perf.end('tick.enemyAI');

  // Ranger DOT/debuff ticks
  perf.begin('tick.debuffs');
  processPoisonTicks(ts);
  processMarkedTimers(ts);
  processBirdsEye(ts);
  processSnareTrap(ts);
  perf.end('tick.debuffs');

  // Hero combat
  perf.begin('tick.heroCombat');
  processHeroCombat(ts);
  processHeroEdgeDagger(ts);
  processSkillCooldowns(ts);
  processManualSkillUses(ts);
  processSkillBuffTimers(ts);
  processAutoSkills(ts);
  if (ts.autoSkills.length === 0) {
    if (ts.heroSkills.equippedSkills.includes('weaponThrow')) processAutoWeaponThrow(ts);
    else processAutoFireball(ts);
  }
  processRelicFireball(ts);
  perf.end('tick.heroCombat');

  // Boss defeat & zone transition
  perf.begin('tick.cleanup');
  processBossDefeat(ts);

  // Cleanup
  const killsBefore = ts.enemiesKilled;
  processDeathRewards(ts);
  ts.killsThisTick = ts.enemiesKilled - killsBefore;
  processEliteTracking(ts);
  processForceSpawnElite(ts);
  processAllyDeaths(ts);
  processLichNecromancy(ts);
  processBloodlust(ts);
  processSecondWind(ts);
  processNaturesGrace(ts);
  processManaShield(ts);
  processChanneling(ts);
  processArcaneFamiliar(ts);
  processBarrierTimers(ts);
  processSkillUnlockCheck(ts);
  processParticles(ts);
  perf.end('tick.cleanup');

  // Dungeon key portals (player-spawned)
  perf.begin('tick.dungeon');
  processDungeonKeyPortal(ts);
  processRegaliaKeyPortal(ts);

  // Dungeon systems
  processDungeonPortalTimer(ts);
  processTimedDungeonPortalTimer(ts);
  processDungeonTickCounter(ts);
  if (ts.inDungeon) {
    // Wave dungeon systems
    processDungeonWaveTimer(ts);
    processDungeonMining(ts);
    processDungeonEndCheck(ts);
    // Timed dungeon systems
    processTimedDungeonTimer(ts);
    processTimedDungeonFlagIncome(ts);
    processTimedDungeonEnd(ts);
  }
  perf.end('tick.dungeon');

  // Pet system
  processPetTick(ts);

  // Tick hero invulnerability timer
  if ((ts.hero.invulnTimer || 0) > 0) ts.hero.invulnTimer!--;
  // Strike Back: tick down hero timer
  if (((ts.hero as any).strikeBackTimer || 0) > 0) {
    (ts.hero as any).strikeBackTimer--;
    if ((ts.hero as any).strikeBackTimer <= 0) (ts.hero as any).strikeBackStacks = 0;
  }
  // Emergency Rations: tick cooldown and heal timer
  if (((ts.hero as any).emergencyRationsCd || 0) > 0) (ts.hero as any).emergencyRationsCd--;
  if (((ts.hero as any).emergencyRationsTimer || 0) > 0) {
    (ts.hero as any).emergencyRationsTimer--;
    if (ts.frame % 60 === 0 && ts.hero.health > 0) {
      const rationHeal = Math.max(1, Math.floor(ts.hero.maxHealth * 0.10));
      ts.hero.health = Math.min(ts.hero.maxHealth, ts.hero.health + rationHeal);
      ts.particles.push(makeParticle(ts.hero.x + 16, ts.hero.y - 10, `+${rationHeal}`, '#88ff44'));
    }
  }
  // Track hero movement for Kiting bonus
  ts.hero.isMoving = ts.hero.x !== (ts.hero as any)._prevX;
  (ts.hero as any)._prevX = ts.hero.x;

  // === Collapse TickState back to GameState ===
  // Hero death in dungeon triggers dungeon exit, not game over
  if (ts.inDungeon && ts.hero.health <= 0) {
    ts.dungeonOver = true;
    ts.hero.health = 1; // Keep alive so main game doesn't end
  }
  const gameOver = ts.hero.health <= 0 && !ts.inDungeon;

  // Camera based on mode
  if (cameraMode === 'hero') {
    ts.cameraX = Math.max(0, ts.hero.x - CAMERA_OFFSET);
  } else if (cameraMode === 'furthest') {
    let furthestX = ts.hero.x;
    for (const ally of ts.allies) {
      if (ally.x > furthestX) furthestX = ally.x;
    }
    ts.cameraX = Math.max(0, furthestX - CAMERA_OFFSET);
  }
  // 'manual' mode: keep prev.cameraX (don't update)
  // Clamp camera to world bounds
  {
    const lastFlag = ts.flags[ts.flags.length - 1];
    const worldEnd = ts.inDungeon && ts.dungeonType === 'timed'
      ? 1050
      : lastFlag ? lastFlag.x + 300 : 2000;
    const maxCam = Math.max(0, worldEnd - VIEWPORT_W);
    ts.cameraX = Math.min(ts.cameraX, maxCam);
  }

  perf.end('tick');

  perf.begin('tick.collapse');
  const goldDelta = ts.goldEarned - prev.goldEarned;
  const newTotalGold = (prev.totalGoldEarned || 0) + (goldDelta > 0 ? goldDelta : 0);

  const result: GameState = {
    ...prev,
    hero: ts.hero,
    flags: ts.flags,
    enemies: ts.enemies,
    enemyArchers: ts.enemyArchers,
    enemyWraiths: ts.enemyWraiths,
    enemyHounds: ts.enemyHounds,
    enemyLichs: ts.enemyLichs,
    enemyShadowAssassins: ts.enemyShadowAssassins,
    enemyFlameCallers: ts.enemyFlameCallers,
    enemyCorruptedSentinels: ts.enemyCorruptedSentinels,
    enemyDungeonRats: ts.enemyDungeonRats,
    enemyFireImps: ts.enemyFireImps,
    enemyCursedKnights: ts.enemyCursedKnights,
    allies: ts.allies,
    unitSlots: ts.unitSlots,
    particles: ts.particles,
    projectiles: ts.projectiles,
    chests: ts.chests,
    banners: ts.banners,
    barricades: ts.barricades,
    crystalTurrets: ts.crystalTurrets,
    iceWalls: ts.iceWalls,
    iceTurrets: ts.iceTurrets,
    smithingBonusStacks: ts.smithingBonusStacks,
    boss: ts.boss,
    currentZone: ts.currentZone,
    bossesDefeated: ts.bossesDefeated,
    frame: ts.frame,
    enemiesKilled: ts.enemiesKilled,
    killGoldEarned: ts.killGoldEarned,
    eliteKills: ts.eliteKills,
    peakDistance: Math.max(prev.peakDistance || 0, Math.floor(ts.hero.x / 50)),
    artifacts: ts.artifacts as Artifact[],
    pendingArtifactChoice: ts.pendingArtifactChoice,
    pendingRelicChoice: ts.pendingRelicChoice,
    goldEarned: ts.goldEarned,
    totalGoldEarned: newTotalGold,
    flagsCaptured: ts.flagsCaptured,
    lastFlagCaptureFrame: ts.lastFlagCaptureFrame,
    gemsThisRun: ts.gemsThisRun,
    shardsThisRun: ts.shardsThisRun,
    incomeTimer: ts.incomeTimer,
    incomeTimer2: ts.incomeTimer2,
    incomeTimer3: ts.incomeTimer3,
    incomeTimer4: ts.incomeTimer4,
    incomeTimer5: ts.incomeTimer5,
    incomeTimer6: ts.incomeTimer6,
    incomeTimer7: ts.incomeTimer7,
    incomeTimer8: ts.incomeTimer8,
    regenTimer: ts.regenTimer,
    autoFireball: ts.autoFireball,
    autoSkills: ts.autoSkills,
    autoPortalForward: ts.autoPortalForward,
    armyHoldMode: ts.armyHoldMode,
    cameraX: ts.cameraX,
    portalFlagIndex: ts.portalFlagIndex,
    relicDrops: ts.relicDrops,
    freeRerolls: ts.freeRerolls,
    artifactKeyPortalRequested: ts.artifactKeyPortalRequested,
    regaliaKeyPortalRequested: ts.regaliaKeyPortalRequested,
    challengeId: ts.challengeId,
    challengeComplete: ts.challengeComplete,
    challengeLevel: ts.challengeLevel,
    challengeLevelUpPending: ts.challengeLevelUpPending,
    blessingCooldown: ts.blessingCooldown,
    decreeActive: ts.decreeActive,
    heroSkills: ts.heroSkills,
    pendingSkillChoice: ts.pendingSkillChoice,
    pendingSkillUses: ts.pendingSkillUses,

    // Dungeon state
    inDungeon: ts.inDungeon,
    dungeonWave: ts.dungeonWave,
    dungeonWaveTimer: ts.dungeonWaveTimer,
    dungeonMiningTimer: ts.dungeonMiningTimer,
    dungeonMedals: ts.dungeonMedals,
    dungeonFragmentsEarned: ts.dungeonFragmentsEarned,
    dungeonEnemiesAlive: ts.dungeonEnemiesAlive,
    dungeonEliteWaveNext: ts.dungeonEliteWaveNext,
    dungeonBonusMedalAwarded: ts.dungeonBonusMedalAwarded,
    dungeonArenaLeftX: ts.dungeonArenaLeftX,
    dungeonArenaRightX: ts.dungeonArenaRightX,
    dungeonArenaSpawnX: ts.dungeonArenaSpawnX,
    dungeonShopOpen: ts.dungeonShopOpen,
    dungeonTriggerZone: ts.dungeonTriggerZone,
    dungeonTriggerFlags: ts.dungeonTriggerFlags,
    dungeonPortalTimer: ts.dungeonPortalTimer,
    dungeonPortalFlagId: ts.dungeonPortalFlagId,
    dungeonUnlocked: ts.dungeonUnlocked,
    dungeonPityCounter: ts.dungeonPityCounter,
    dungeonOver: ts.dungeonOver,
    dungeonMeleeBoost: ts.dungeonMeleeBoost,
    dungeonRangedBoost: ts.dungeonRangedBoost,
    dungeonMagicBoost: ts.dungeonMagicBoost,
    dungeonAllyMode: ts.dungeonAllyMode,
    dungeonUnitsRolled: ts.dungeonUnitsRolled,
    dungeonMetaUpgrades: ts.dungeonMetaUpgrades,

    // Timed dungeon state
    dungeonType: ts.dungeonType,
    timedDungeonTimer: ts.timedDungeonTimer,
    timedDungeonVictory: ts.timedDungeonVictory,
    timedDungeonPortalTimer: ts.timedDungeonPortalTimer,
    timedDungeonPortalFlagId: ts.timedDungeonPortalFlagId,
    dungeonTicksSpent: ts.dungeonTicksSpent,

    // Elite mini-boss state
    eliteLastSpawnFrame: ts.eliteLastSpawnFrame,
    activeEliteId: ts.activeEliteId,
    activeEliteVariant: ts.activeEliteVariant,
    lastEliteVariants: ts.lastEliteVariants,
    eliteArtifactDroppedThisRun: ts.eliteArtifactDroppedThisRun,
    forceSpawnElite: false, // always clear after tick

    // Pet state
    petCooldown: ts.petCooldown,

    // Sync backpack from React state so HUD snapshot can read it
    backpack: ts.backpack,

    gameOver,
    score: ts.flagsCaptured * 100 + Math.floor(ts.goldEarned),
  };
  perf.end('tick.collapse');
  return result;
}

/** Info passed to App.tsx when dungeon exits, for React state updates */
export interface DungeonExitInfo {
  fragmentsEarned: number;
  metaUpgrades: DungeonMetaUpgrades;
  dungeonUnlocked: boolean;
  pityCounter: number;
}

/** Restore savedMainState onto gameRef when dungeonOver fires */
function handleDungeonExit(g: GameState): DungeonExitInfo | null {
  if (!g.inDungeon || !g.dungeonOver || !g.savedMainState) return null;
  const ss = g.savedMainState;
  const wasWave = g.dungeonType === 'wave';
  const wasTimed = g.dungeonType === 'timed';

  const fragmentsEarned = wasWave ? g.dungeonFragmentsEarned : 0;
  const exitInfo: DungeonExitInfo = {
    fragmentsEarned,
    metaUpgrades: { ...g.dungeonMetaUpgrades },
    dungeonUnlocked: g.dungeonUnlocked,
    pityCounter: g.dungeonPityCounter,
  };

  // Gold restoration
  const savedGold = ss.goldEarned;
  let restoredGold: number;
  if (wasTimed) {
    const dungeonGoldDelta = Math.max(0, g.goldEarned - savedGold);
    restoredGold = savedGold + dungeonGoldDelta;
  } else {
    const goldPerMin = passiveGoldPerMin(ss.runUpgrades as any);
    const ticksInDungeon = g.dungeonTicksSpent || 0;
    const passiveGold = Math.floor(goldPerMin * (ticksInDungeon / 3600) * 0.30);
    restoredGold = savedGold + passiveGold;
  }

  // Hero returns at portal position with clamped HP
  const portalIdx = ss.portalFlagIndex;
  const portalX = portalIdx >= 0 ? (ss.flags[portalIdx]?.x || 40) : 40;

  // Build exit particles
  const exitParticles = [];
  if (wasTimed) {
    if (g.timedDungeonVictory) {
      exitParticles.push(makeParticle(200, GROUND_Y - 80, 'REGALIA DUNGEON COMPLETE!', '#ffd700'));
      exitParticles.push(makeParticle(200, GROUND_Y - 60, 'REGALIA EARNED!', '#ff88cc'));
    } else {
      exitParticles.push(makeParticle(200, GROUND_Y - 60, 'Regalia dungeon failed...', '#ff4444'));
    }
  } else {
    exitParticles.push(makeParticle(200, GROUND_Y - 60, `Dungeon complete! +${fragmentsEarned} fragments`, '#aa44ff'));
    const wavePassive = restoredGold - savedGold;
    if (wavePassive > 0) {
      exitParticles.push(makeParticle(200, GROUND_Y - 40, `+${wavePassive}g (Passive Income)`, '#44ff44'));
    }
  }
  if (wasTimed) {
    const dungeonEarnings = restoredGold - savedGold;
    if (dungeonEarnings > 0) {
      exitParticles.push(makeParticle(200, GROUND_Y - 40, `+${dungeonEarnings}g earned`, '#ffd700'));
    }
  }

  // Restore all saved state fields
  g.inDungeon = false;
  g.dungeonType = null;
  g.savedMainState = null;
  g.flags = ss.flags;
  g.enemies = ss.enemies;
  g.enemyArchers = ss.enemyArchers;
  g.enemyWraiths = ss.enemyWraiths;
  g.enemyHounds = ss.enemyHounds;
  g.enemyLichs = ss.enemyLichs;
  g.enemyShadowAssassins = ss.enemyShadowAssassins;
  g.enemyFlameCallers = ss.enemyFlameCallers;
  g.enemyCorruptedSentinels = ss.enemyCorruptedSentinels;
  g.enemyDungeonRats = [];
  g.enemyFireImps = [];
  g.enemyCursedKnights = [];
  g.boss = ss.boss;
  g.currentZone = ss.currentZone;
  g.bossesDefeated = ss.bossesDefeated;
  g.goldEarned = restoredGold;
  g.totalGoldEarned = ss.totalGoldEarned;
  g.flagsCaptured = ss.flagsCaptured;
  g.portalFlagIndex = portalIdx;
  g.armyHoldMode = ss.armyHoldMode;
  g.cameraX = ss.cameraX;
  g.incomeTimer = wasTimed ? g.incomeTimer : ss.incomeTimer;
  g.incomeTimer2 = wasTimed ? g.incomeTimer2 : ss.incomeTimer2;
  g.incomeTimer3 = wasTimed ? g.incomeTimer3 : ss.incomeTimer3;
  g.incomeTimer4 = wasTimed ? g.incomeTimer4 : ss.incomeTimer4;
  g.incomeTimer5 = wasTimed ? g.incomeTimer5 : ss.incomeTimer5;
  g.incomeTimer6 = wasTimed ? g.incomeTimer6 : ss.incomeTimer6;
  g.incomeTimer7 = wasTimed ? g.incomeTimer7 : ss.incomeTimer7;
  g.incomeTimer8 = wasTimed ? g.incomeTimer8 : ss.incomeTimer8;
  g.projectiles = ss.projectiles;
  g.chests = ss.chests;
  g.banners = ss.banners;
  g.barricades = ss.barricades;
  g.crystalTurrets = ss.crystalTurrets;
  g.iceWalls = ss.iceWalls;
  g.iceTurrets = ss.iceTurrets;
  g.smithingBonusStacks = ss.smithingBonusStacks;
  g.gemsThisRun = ss.gemsThisRun;
  g.shardsThisRun = ss.shardsThisRun;
  g.relicDrops = ss.relicDrops;
  g.enemiesKilled = ss.enemiesKilled;
  g.eliteKills = ss.eliteKills;
  g.eliteLastSpawnFrame = ss.eliteLastSpawnFrame;
  g.activeEliteId = ss.activeEliteId;
  g.activeEliteVariant = ss.activeEliteVariant;
  g.lastEliteVariants = ss.lastEliteVariants;
  g.unitSlots = ss.unitSlots;
  g.allies = ss.allies.map(a => ({ ...a, x: portalX + Math.random() * 30 }));
  g.runUpgrades = ss.runUpgrades;

  // Hero: restore saved hero, place at portal, clamp health
  const savedHero = ss.hero;
  g.hero = {
    ...savedHero,
    x: portalX,
    targetFlagIndex: portalIdx,
    health: Math.max(1, Math.min(g.hero.health, savedHero.maxHealth)),
  };

  g.particles = exitParticles;

  // Reset all dungeon state
  g.dungeonWave = 0;
  g.dungeonWaveTimer = 0;
  g.dungeonMiningTimer = 0;
  g.dungeonMedals = 0;
  g.dungeonFragmentsEarned = 0;
  g.dungeonEnemiesAlive = 0;
  g.dungeonShopOpen = false;
  g.dungeonOver = false;
  g.dungeonMeleeBoost = 0;
  g.dungeonRangedBoost = 0;
  g.dungeonMagicBoost = 0;
  g.dungeonAllyMode = 'advance';
  g.dungeonUnitsRolled = 0;
  g.dungeonTicksSpent = 0;
  g.timedDungeonTimer = 0;
  g.timedDungeonVictory = false;
  g.timedDungeonPortalTimer = 0;
  g.timedDungeonPortalFlagId = -1;

  return exitInfo;
}

/**
 * Hook that runs the 60fps game loop, orchestrating all game systems.
 *
 * V2 ARCHITECTURE: Game state lives in gameRef (useRef), NOT useState.
 * - Canvas draws directly from gameRef every RAF frame (no React re-render needed)
 * - onModalEvent() signals React ONLY when a modal/overlay is needed
 * - No periodic React sync — HUD reads from gameRef via its own interval
 */
export function useGameLoop(
  gameScreen: GameScreen,
  upgrades: PermanentUpgrades,
  shardUpgrades: ShardUpgrades,
  relicCollection: RelicCollection,
  gameRef: React.MutableRefObject<GameState>,
  onModalEvent: () => void,
  cameraModeRef: React.MutableRefObject<CameraMode>,
  ancientRelicsOwned: string[] = [],
  ancientRelicCopies: Record<string, number> = {},
  backpack: Backpack = { healingPotion: 0, rerollVoucher: 0, artifactKey: 0, regaliaKey: 0, challengeKey: 0 },
  onCollectConsumable: (id: ConsumableId) => void = () => {},
  challengeCompletions: ChallengeCompletions = {},
  equippedRegalias: Record<RegaliaSlot, Regalia | null> = { sword: null, shield: null, necklace: null },
  onCollectRegalia: (regalia: Regalia) => void = () => {},
  equippedPet: string = '',
  ownedPets: string[] = [],
  onCollectPet: (petId: string) => void = () => {},
  onDungeonExit: (info: DungeonExitInfo) => void = () => {},
): { frameRef: React.MutableRefObject<number> } {
  const frameRef = useRef(0);
  const ancientRelicsRef = useRef(ancientRelicsOwned);
  ancientRelicsRef.current = ancientRelicsOwned;
  const ancientRelicCopiesRef = useRef(ancientRelicCopies);
  ancientRelicCopiesRef.current = ancientRelicCopies;
  const backpackRef = useRef(backpack);
  backpackRef.current = backpack;
  const collectConsumableRef = useRef(onCollectConsumable);
  collectConsumableRef.current = onCollectConsumable;
  const challengeCompletionsRef = useRef(challengeCompletions);
  challengeCompletionsRef.current = challengeCompletions;
  const equippedRegaliasRef = useRef(equippedRegalias);
  equippedRegaliasRef.current = equippedRegalias;
  const collectRegaliaRef = useRef(onCollectRegalia);
  collectRegaliaRef.current = onCollectRegalia;
  const equippedPetRef = useRef(equippedPet);
  equippedPetRef.current = equippedPet;
  const ownedPetsRef = useRef(ownedPets);
  ownedPetsRef.current = ownedPets;
  const collectPetRef = useRef(onCollectPet);
  collectPetRef.current = onCollectPet;
  const onModalEventRef = useRef(onModalEvent);
  onModalEventRef.current = onModalEvent;
  const dungeonExitRef = useRef(onDungeonExit);
  dungeonExitRef.current = onDungeonExit;

  // Stable refs for values that change frequently but shouldn't restart the loop
  const upgradesRef = useRef(upgrades);
  upgradesRef.current = upgrades;
  const shardUpgradesRef = useRef(shardUpgrades);
  shardUpgradesRef.current = shardUpgrades;
  const relicCollectionRef = useRef(relicCollection);
  relicCollectionRef.current = relicCollection;

  useEffect(() => {
    if (gameScreen !== 'playing') return;
    // Only reset frame counter on first mount, not on effect re-runs
    if (frameRef.current === 0 && gameRef.current) {
      frameRef.current = gameRef.current.frame || 0;
    }

    const TICK_MS = 1000 / 60;
    const MAX_TICKS_PER_FRAME = 4;
    let accumulator = 0;
    let lastTime = performance.now();
    let rafId = 0;
    let running = true;

    // Tab visibility: fast-forward income on return
    let hiddenAt = 0;
    const onVisibilityChange = () => {
      if (document.hidden) {
        hiddenAt = performance.now();
      } else if (hiddenAt > 0) {
        const elapsedMs = performance.now() - hiddenAt;
        const elapsedTicks = Math.floor(elapsedMs / TICK_MS);
        hiddenAt = 0;
        lastTime = performance.now();
        accumulator = 0;
        if (elapsedTicks > 240) {
          gameRef.current = fastForwardIncome(gameRef.current, elapsedTicks, upgradesRef.current, relicCollectionRef.current, ancientRelicsRef.current, ancientRelicCopiesRef.current);
        }
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    // Also handle window focus (alt-tab between windows doesn't always fire visibilitychange)
    const onFocus = () => {
      if (hiddenAt > 0) {
        onVisibilityChange();
      } else {
        // Reset timing to avoid huge delta on next frame
        lastTime = performance.now();
        accumulator = 0;
      }
    };
    window.addEventListener('focus', onFocus);

    let _gameOverSignaled = false;

    const loop = (now: number) => {
      if (!running) return;
      const delta = Math.min(now - lastTime, 200);
      lastTime = now;
      accumulator += delta;

      let ticksThisFrame = 0;
      let ticked = false;

      while (accumulator >= TICK_MS && ticksThisFrame < MAX_TICKS_PER_FRAME) {
        const prev = gameRef.current;
        const next = gameTick(prev, frameRef, upgradesRef.current, shardUpgradesRef.current, relicCollectionRef.current, cameraModeRef.current, ancientRelicsRef.current, ancientRelicCopiesRef.current, backpackRef.current, collectConsumableRef.current, challengeCompletionsRef.current, equippedRegaliasRef.current, collectRegaliaRef.current, equippedPetRef.current, ownedPetsRef.current, collectPetRef.current);
        gameRef.current = next;
        accumulator -= TICK_MS;
        ticksThisFrame++;
        ticked = true;
      }
      if (ticksThisFrame >= MAX_TICKS_PER_FRAME) accumulator = 0;

      if (ticked) {
        const state = gameRef.current;

        // Dungeon exit: restore main game state when dungeonOver fires
        if (state.inDungeon && state.dungeonOver) {
          const exitInfo = handleDungeonExit(state);
          if (exitInfo) {
            dungeonExitRef.current(exitInfo);
          }
        }

        // Signal React ONLY for modal events that need overlay rendering
        // gameOver only signals once (avoid hammering React every frame)
        const needsModal = state.pendingArtifactChoice || state.pendingRelicChoice || state.pendingRoll || state.pendingSkillChoice || state.challengeLevelUpPending;
        const needsGameOver = state.gameOver && !_gameOverSignaled;
        if (needsGameOver) _gameOverSignaled = true;
        if (!state.gameOver) _gameOverSignaled = false;
        if (needsModal || needsGameOver) {
          onModalEventRef.current();
        }
      }

      perf.frame();

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafId); document.removeEventListener('visibilitychange', onVisibilityChange); window.removeEventListener('focus', onFocus); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameScreen, gameRef]);

  return { frameRef };
}
