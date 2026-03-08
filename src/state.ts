import { GROUND_Y, HERO_SIZE, BUILDING_POOL, BUILDING_DEFS } from './constants';
import type { GameState, Flag, PermanentUpgrades, DungeonMetaUpgrades, ChallengeId } from './types';
import type { HeroClassId } from './classes';
import { getClassDef } from './classes';

// Generate flags for a zone
export function generateZoneFlags(zoneIndex: number): Flag[] {
  // First zone is wider (3100px) for tutorial breathing room, later zones 2200px
  const zoneWidth = zoneIndex === 0 ? 3100 : 2200;
  const zoneStart = zoneIndex === 0 ? 0 : 3100 + (zoneIndex - 1) * 2200;
  const baseSpawnRate = Math.max(60, 180 - zoneIndex * 15);

  // All 6 flags (5 regular + boss) evenly spaced across the zone
  const firstFlag = zoneStart + (zoneIndex === 0 ? 500 : 350);
  const lastFlag = zoneStart + zoneWidth - 100;
  const gap = Math.floor((lastFlag - firstFlag) / 5);

  const flags: Flag[] = [
    { id: zoneIndex * 10 + 1, x: firstFlag, captured: false, spawnTimer: 0, spawnRate: baseSpawnRate },
    { id: zoneIndex * 10 + 2, x: firstFlag + gap, captured: false, spawnTimer: 50, spawnRate: baseSpawnRate - 8 },
    { id: zoneIndex * 10 + 3, x: firstFlag + gap * 2, captured: false, spawnTimer: 100, spawnRate: baseSpawnRate - 16 },
    { id: zoneIndex * 10 + 4, x: firstFlag + gap * 3, captured: false, spawnTimer: 150, spawnRate: baseSpawnRate - 24 },
    { id: zoneIndex * 10 + 5, x: firstFlag + gap * 4, captured: false, spawnTimer: 200, spawnRate: baseSpawnRate - 32 },
    { id: zoneIndex * 10 + 6, x: firstFlag + gap * 5, captured: false, spawnTimer: 250, spawnRate: baseSpawnRate - 40, isBossFlag: true },
  ];

  // Assign buildings to random non-boss flags
  // Zone 0: 0 buildings, Zone 1-3: 1-2, Zone 4+: 1-3
  const nonBossIndices = [0, 1, 2, 3, 4];
  for (let i = nonBossIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nonBossIndices[i], nonBossIndices[j]] = [nonBossIndices[j], nonBossIndices[i]];
  }
  let buildingCount = 0;
  if (zoneIndex === 0) {
    buildingCount = 0;
  } else if (zoneIndex < 4) {
    buildingCount = Math.random() < 0.5 ? 1 : 2;
  } else {
    // Zone 4+: 1-3 buildings (1=20%, 2=50%, 3=30%)
    const r = Math.random();
    buildingCount = r < 0.20 ? 1 : r < 0.70 ? 2 : 3;
  }
  const usedTypes: string[] = [];
  for (let b = 0; b < buildingCount; b++) {
    // Build weighted pool: Survey Site has half weight
    const eligible = BUILDING_POOL.filter(t => !usedTypes.includes(t));
    const weighted: string[] = [];
    for (const t of eligible) {
      const def = BUILDING_DEFS[t];
      weighted.push(t);
      if (!def?.rareWeight) weighted.push(t); // non-rare gets 2x entries (double chance)
    }
    const buildingType = weighted[Math.floor(Math.random() * weighted.length)];
    usedTypes.push(buildingType);
    flags[nonBossIndices[b]].buildingType = buildingType;
    flags[nonBossIndices[b]].buildingTimer = 0;
  }

  return flags;
}

// Generate dungeon arena flags (4 pre-captured flags, 250px gap)
export function generateDungeonArena(): Flag[] {
  const gap = 250;
  const startX = 100;
  return [
    { id: 9001, x: startX,           captured: true, spawnTimer: 0, spawnRate: 999 }, // Flag 0: Workers (base)
    { id: 9002, x: startX + gap,     captured: true, spawnTimer: 0, spawnRate: 999 }, // Flag 1: Mid
    { id: 9003, x: startX + gap * 2, captured: true, spawnTimer: 0, spawnRate: 999 }, // Flag 2: Front line
    { id: 9004, x: startX + gap * 3, captured: true, spawnTimer: 0, spawnRate: 999 }, // Flag 3: Impassable wall
  ];
}

// Generate timed dungeon arena (3 uncaptured flags + boss, 250px gap, tighter than main game)
export function generateTimedDungeonArena(zone: number): Flag[] {
  const gap = 250;
  const startX = 200;
  const spawnRate = Math.max(60, 150 - zone * 12);
  return [
    { id: 9101, x: startX,           captured: false, spawnTimer: 0,   spawnRate },
    { id: 9102, x: startX + gap,     captured: false, spawnTimer: 50,  spawnRate: spawnRate - 8 },
    { id: 9103, x: startX + gap * 2, captured: false, spawnTimer: 100, spawnRate: spawnRate - 16 },
    { id: 9104, x: startX + gap * 3, captured: false, spawnTimer: 150, spawnRate: spawnRate - 24, isBossFlag: true },
  ];
}

// Initial game state factory
export function createInitialState(upgrades: PermanentUpgrades, heroClassId: HeroClassId = 'warlord', challengeId: ChallengeId | null = null): GameState {
  const classDef = getClassDef(heroClassId);
  const gc = challengeId === 'glassCannon';
  const heroHp = gc ? Math.floor(classDef.baseStats.hp / 3) : classDef.baseStats.hp;
  const heroDmg = gc ? classDef.baseStats.dmg * 3 : classDef.baseStats.dmg;
  return {
    hero: {
      x: 80,
      y: GROUND_Y - HERO_SIZE,
      targetFlagIndex: -1,
      health: heroHp,
      maxHealth: heroHp,
      damage: heroDmg,
      defense: classDef.baseStats.def,
      speed: classDef.baseStats.speed,
      attackCooldown: 0,
      rangedCooldown: 0,
      fireballCooldown: 0,
      recallCooldown: 0,
      isAttacking: false,
      frame: 0,
      lastDamageTime: 0,
    },
    flags: generateZoneFlags(0),
    enemies: [],
    enemyArchers: [],
    enemyWraiths: [],
    enemyHounds: [],
    enemyLichs: [],
    enemyShadowAssassins: [],
    enemyFlameCallers: [],
    enemyCorruptedSentinels: [],
    enemyDungeonRats: [],
    enemyFireImps: [],
    enemyCursedKnights: [],
    allies: [],
    unitSlots: [],
    particles: [],
    projectiles: [],
    chests: [],
    banners: [],
    barricades: [],
    crystalTurrets: [],
    iceWalls: [],
    iceTurrets: [],
    smithingBonusStacks: 0,
    boss: null,
    currentZone: 0,
    rollCost: 10,
    rollCount: 0,
    bossesDefeated: 0,
    frame: 0,
    enemiesKilled: 0,
    killGoldEarned: 0,
    eliteKills: 0,
    peakDistance: 0,
    gameOver: false,
    retreated: false,
    score: 0,
    goldEarned: 10,
    totalGoldEarned: 0,
    gemsThisRun: 0,
    shardsThisRun: 0,
    flagsCaptured: 0,
    lastFlagCaptureFrame: 0,
    incomeTimer: 0,
    incomeTimer2: 0,
    incomeTimer3: 0,
    incomeTimer4: 0,
    incomeTimer5: 0,
    incomeTimer6: 0,
    incomeTimer7: 0,
    incomeTimer8: 0,
    regenTimer: 0,
    cameraX: 0,
    portalFlagIndex: -1,
    autoFireball: false,
    autoSkills: [],
    autoPortalForward: false,
    armyHoldMode: false,
    artifacts: [],
    pendingArtifactChoice: null,
    pendingRoll: null,
    runUpgrades: {
      hero: 0,
      soldier: 0,
      archer: 0,
      halberd: 0,
      knight: 0,
      wizard: 0,
      cleric: 0,
      conjurer: 0,
      bombard: 0,
      passiveIncome: 0,
      passiveIncome2: 0,
      passiveIncome3: 0,
      passiveIncome4: 0,
      passiveIncome5: 0,
      passiveIncome6: 0,
      passiveIncome7: 0,
      passiveIncome8: 0,
      goldBonus: 0,
    },
    tutorialActive: false,
    dismissedTutorials: [],
    tutorialDialogueVisible: false,
    bossDeathFlash: false,
    playerName: (upgrades.playerName as string) || '',
    relicDrops: [],
    freeRerolls: 0,
    artifactKeyPortalRequested: false,
    regaliaKeyPortalRequested: false,
    blessingCooldown: 0,
    decreeActive: false,
    heroSkills: {
      equippedSkills: [],
      skillCooldowns: {},
      skillBuffTimers: {},
      bloodlustStacks: 0,
      bloodlustLastKillFrame: 0,
      secondWindAvailable: true,
      naturesGraceAvailable: true,
    },
    pendingSkillChoice: null,
    pendingSkillUses: [],
    pendingRelicChoice: null,
    heroClass: heroClassId,
    // Challenge runs
    challengeId: challengeId,
    challengeComplete: false,
    challengeLevel: 0,
    challengeLevelUpPending: false,
    // Dungeon defaults
    inDungeon: false,
    dungeonWave: 0,
    dungeonWaveTimer: 0,
    dungeonMiningTimer: 0,
    dungeonMedals: 0,
    dungeonFragmentsEarned: 0,
    dungeonEnemiesAlive: 0,
    dungeonEliteWaveNext: false,
    dungeonBonusMedalAwarded: false,
    dungeonArenaLeftX: 0,
    dungeonArenaRightX: 0,
    dungeonArenaSpawnX: 0,
    dungeonPortalTimer: 0,
    dungeonPortalFlagId: -1,
    dungeonShopOpen: false,
    dungeonTriggerZone: 0,
    dungeonTriggerFlags: 0,
    dungeonUnlocked: false,
    dungeonPityCounter: 0,
    dungeonOver: false,
    dungeonMeleeBoost: 0,
    dungeonRangedBoost: 0,
    dungeonMagicBoost: 0,
    dungeonAllyMode: 'advance',
    dungeonUnitsRolled: 0,
    dungeonMetaUpgrades: { headStart: 0, efficientMining: 0, eliteBounty: 0 },
    savedMainState: null,
    // Timed dungeon defaults
    dungeonType: null,
    timedDungeonTimer: 0,
    timedDungeonVictory: false,
    timedDungeonPortalTimer: 0,
    timedDungeonPortalFlagId: -1,
    dungeonTicksSpent: 0,
    // Elite mini-boss state
    eliteLastSpawnFrame: -99999,
    activeEliteId: null,
    activeEliteVariant: null,
    lastEliteVariants: [],
    // Pet per-run state
    petCooldown: 0,
  };
}
