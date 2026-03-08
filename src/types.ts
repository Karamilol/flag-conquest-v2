import type { HeroClassId } from './classes';

// ---- Entity Types ----

export interface Hero {
  x: number;
  y: number;
  targetFlagIndex: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  speed: number;
  attackCooldown: number;
  rangedCooldown: number;
  fireballCooldown?: number;
  recallCooldown?: number;
  isAttacking: boolean;
  frame: number;
  lastDamageTime: number;
  slowTimer?: number;
  invulnTimer?: number;
  aimingTimer?: number;
  momentumStacks?: number;
  momentumTimer?: number;
  bannerCooldown?: number;
  daggerCooldown?: number;
  // Relic v2 runtime fields
  masterworkBossCount?: number;   // Masterwork Arms: bosses killed for scaling
  isMoving?: boolean;             // Kiting: true when hero moved this tick
  // Mage class fields
  channeling?: number;            // frames remaining in channel (0 = not channeling)
  channelingSkill?: string;       // which skill is being channeled
  manaShieldCharges?: number;     // 0-3 charges remaining
  manaShieldReady?: boolean;      // true when ready to trigger at 30% HP
  familiarX?: number;             // arcane familiar X position
  familiarCooldown?: number;      // familiar attack timer
  planted?: boolean;              // hero stays in place, still attacks
}

export interface Flag {
  id: number;
  x: number;
  captured: boolean;
  spawnTimer: number;
  spawnRate: number;
  isBossFlag?: boolean;
  corrupted?: boolean;
  contested?: boolean;
  contestTimer?: number;
  contestLastTouch?: 'ally' | 'enemy';
  buildingType?: string;
  buildingTimer?: number;
  ruinsTriggered?: boolean;
}

export interface Enemy {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  lane?: number;
  bleedStacks?: number;
  bleedTimer?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  burnTimer?: number;
  burnDamage?: number;
  // Lich skeleton fields
  isLichSkeleton?: boolean;
  lichOwnerId?: number;
  defense?: number;
  // Ranger skill effects
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  // Elite variant
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
  // Artifact debuffs
  slowTimer?: number;
  slowAmount?: number;
}

export interface EnemyArcher {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  lane?: number;
  bleedStacks?: number;
  bleedTimer?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  burnTimer?: number;
  burnDamage?: number;
  aimingTimer?: number;
  // Ranger skill effects
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  slowTimer?: number;
  slowAmount?: number;
  // Elite variant
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

export interface EnemyWraith {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense?: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  knockback: number;
  frame: number;
  attackCooldown: number;
  chargeTimer?: number;
  lane?: number;
  bleedStacks?: number;
  bleedTimer?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  burnTimer?: number;
  burnDamage?: number;
  // Ranger skill effects
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  slowTimer?: number;
  slowAmount?: number;
  // Elite variant
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

export interface EnemyHound {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  lane?: number;
  lungeTimer?: number;
  recoveryTimer?: number;
  lungeTargetX?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  // Ranger skill effects
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  isBroodPup?: boolean;
  slowTimer?: number;
  slowAmount?: number;
  defense?: number;
  // Elite variant
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

export interface EnemyLich {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRange: number;
  frame: number;
  healCooldown: number;
  iceballCooldown: number;
  lane?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  activeSkeletons: number;
  passiveSummonTimer: number;
  // Ranger skill effects
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  slowTimer?: number;
  slowAmount?: number;
  // Elite variant
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

export interface EnemyShadowAssassin {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  lane?: number;
  stealthTimer: number; // >0 means cloaked/invisible
  visibleTimer: number; // counts down while visible, re-cloaks at 0
  teleportCooldown: number;
  scanTimer: number; // counts up while scanning for backline targets
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  slowTimer?: number;
  slowAmount?: number;
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

export interface EnemyFlameCaller {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRange: number;
  frame: number;
  castTimer: number; // counts up during cast
  castTargetX: number; // where the AoE will land
  castTargetY: number;
  isCasting: boolean;
  castCooldown: number; // time between casts
  lane?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  slowTimer?: number;
  slowAmount?: number;
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
  extraCastTargets?: number[]; // Inferno Herald: extra AOE positions
}

export interface EnemyCorruptedSentinel {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  reflectActive: boolean; // true while channeling reflect
  reflectTimer: number; // counts down while reflecting
  lane?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  slowTimer?: number;
  slowAmount?: number;
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

// ---- Dungeon-exclusive enemy types ----

export interface EnemyDungeonRat {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  lane?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  slowTimer?: number;
  slowAmount?: number;
  lastDamageTime?: number;
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  defense?: number;
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

export interface EnemyFireImp {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRange: number;
  frame: number;
  castTimer: number;
  castTargetX: number;
  castTargetY: number;
  isCasting: boolean;
  castCooldown: number;
  lane?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
  extraCastTargetX?: number; // Magma Lord: extra AOE position
}

export interface EnemyCursedKnight {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  lane?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
  eliteAbilityCd?: number;
}

export interface Boss {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  zone: number;
  bossType: number; // 0 = shooter, 1 = laser mage
  frame: number;
  attackCooldown: number;
  isAttacking: boolean;
  laserWarning: number;
  bleedStacks?: number;
  bleedTimer?: number;
  burnTimer?: number;
  burnDamage?: number;
  stunTimer?: number;
  lastDamageTime?: number;
  regenAccum?: number;
  retreating?: boolean;
  // Ranger skill effects
  markedTimer?: number;
  poisonStacks?: number;
  poisonTimer?: number;
  rootTimer?: number;
  lastHitByHero?: boolean;
  // Broodmother fields
  summonCooldown?: number;
  howlCooldown?: number;
  enrageTriggered?: boolean;
  // Dungeon Lich fields
  aoeCooldown?: number;
  // Ice Conjurer fields
  wallCooldown?: number;
  turretCooldown?: number;
  // Wendigo fields
  pounceCooldown?: number;
  pounceReturnTimer?: number;
  pounceHomeX?: number;
  // Infernal General fields
  cleaveCooldown?: number;
  pullTimer?: number;
}

export interface Ally {
  id: number;
  slotIndex: number;
  unitType: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  speed: number;
  attackRate: number;
  attackRange: number;
  frame: number;
  attackCooldown: number;
  lane?: number;
  // Shard upgrade runtime fields
  isElite?: boolean;
  isGiant?: boolean;
  shieldHP?: number;
  aimingTimer?: number;
  lastX?: number;
  bulwarkTimer?: number;
  bulwarkActive?: number;
  dodgeCooldown?: number;
  knockbackResist?: number;
  healBonus?: number;
  baseAttackRate?: number;
  atkSpeedBuffTimer?: number;
  // Relic runtime fields
  isJuiced?: boolean;
  isRoyalGuard?: boolean;
  hatCount?: number;
  slowTimer?: number;
  slowAmount?: number;
  lastDamageTime?: number;
  // Ancient relic spawn aura fields
  hasHorn?: boolean;
  hasCrown?: boolean;
  hasBanner?: boolean;
  released?: boolean;
  // Artifact runtime fields
  protectionTimer?: number;    // Protection: 40% dmg reduction timer
  manaShieldTimer?: number;    // Mana Shield: first hit reduction cooldown
  stillTimer?: number;         // Steady Formation: time standing still
  firstStrikeUsed?: boolean;   // First Strike: did halberd use double-hit on first enemy
  vanguardTimer?: number;      // Vanguard Pressure synergy: +10% dmg timer
  spawnDmgBonus?: number;      // Vanguard Pressure: stored bonus mult
  isFriendlySlime?: boolean;   // Friendly Slimes: spawned by T1 proc
  slimeDir?: number;           // Friendly Slime: wander direction (-1 or 1)
  empoweredGlyphsTimer?: number; // Empowered Glyphs: mage +8% dmg timer
  isCourier?: boolean;         // Courier: walks portal->structure, collects gold
  courierGold?: number;        // Courier: gold to collect at destination
  courierReturning?: boolean;  // Courier: returning to portal
  rallyTimer?: number;         // Rally Post: speed buff timer (120 ticks = 2s)
  bannerSpeedTimer?: number;   // Banner aura: speed buff while in range
  // Relic v2 runtime fields
  debuffCleansed?: boolean;       // Haulers Relief: first debuff absorbed
  dodgeUsed?: boolean;            // Militia Reflexes: first dodge consumed
  firstAttackDone?: boolean;      // Scouting Advantage: crit on first attack
  overshieldHP?: number;          // Brethren: bonus HP above max
  critChance?: number;            // Accumulated crit chance from all sources
  strikeBackStacks?: number;      // Strike Back synergy stacks
  strikeBackTimer?: number;       // Strike Back synergy timer
  // Wendigo fear
  fearTimer?: number;             // When > 0, ally flees backward
  // Pet companion
  isPet?: boolean;                // true = invulnerable pet entity
  petType?: string;               // pet ID (e.g. 'goose', 'wolf_pup')
  // Mage barrier
  barrierHp?: number;             // shield points from Barrier skill
  barrierTimer?: number;          // frames remaining on barrier
}

export interface CrystalTurret {
  id: number;
  ownerId: number;       // Ally id of the conjurer that placed this
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  defense: number;
  attackRate: number;
  attackRange: number;
  attackCooldown: number;
  frame: number;
  duration: number;      // Remaining lifetime in frames
  maxDuration: number;   // Total lifetime for UI display
  markOnHit?: boolean;   // Prismatic Shards upgrade: apply mark debuff
}

export interface HeroSkillState {
  equippedSkills: string[];
  skillCooldowns: Record<string, number>;
  skillBuffTimers: Record<string, number>;
  bloodlustStacks: number;
  bloodlustLastKillFrame: number;
  secondWindAvailable: boolean;
  naturesGraceAvailable: boolean;
}

export interface UnitSlot {
  type: string;
  respawnTimer: number;
  alive: boolean;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  age: number;
  driftX: number;
  isCrit?: boolean;
}

export interface Projectile {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY?: number;
  speed: number;
  damage: number;
  type: 'arrow' | 'allyArrow' | 'wizardBeam' | 'fireball' | 'laser' | 'boss' | 'heroRanged' | 'heroArrow' | 'healBeam' | 'clericBolt' | 'clericChain' | 'darkHeal' | 'iceball' | 'spectralBlast' | 'crystalBolt' | 'bombardShot' | 'chainLightning' | 'meteorStrike';
  radius?: number;
  duration?: number;
  startX?: number;
  startY?: number;
  arcHeight?: number;
  aoeRadius?: number;
  crit?: boolean;
  burnRate?: number;
  burnDuration?: number;
  markOnHit?: boolean;
  chainTargets?: Array<{x: number, y: number}>;  // chain lightning visual arcs
  delayFrames?: number;                            // meteor strike delay before impact
}

export interface Banner {
  id: number;
  x: number;
  y: number;
  radius: number;
  lifetime: number;
  regenRate: number;
  speedBonus: number;
}

export interface Barricade {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  defense: number;
}

export interface IceWall {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  defense: number;
}

export interface IceTurret {
  id: number;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  damage: number;
  attackRate: number;
  attackCooldown: number;
  duration: number;
  maxDuration: number;
}

export interface Chest {
  id: number;
  x: number;
  y: number;
  type: 'gold' | 'gem' | 'shard' | 'consumable' | 'relicCommon' | 'relicRare' | 'relicLegendary' | 'artifactCommon' | 'artifactRare' | 'artifactLegendary' | 'regalia';
  value: number;
  age: number;
  relicId?: string;
  consumableId?: ConsumableId;
  regaliaData?: import('./regalias').Regalia;
}

export interface Artifact {
  id: string;
  name: string;
  desc: string;
  icon: string;
  rarity: 'common' | 'rare' | 'legendary';
  category: 'unit' | 'archetype' | 'hero' | 'army' | 'economy';
  pairId: string;
  slot: 'A' | 'B';
}

// ---- Dungeon Meta Upgrades (persist forever) ----

export interface DungeonMetaUpgrades {
  headStart: number;        // +1 starting medal per level
  efficientMining: number;  // Fragment mining 1s faster per level (90->89->88... min 60)
  eliteBounty: number;      // +1 medal from elite waves per level
}

// ---- Dungeon Saved State (snapshot of main game for restoration) ----

export interface DungeonSavedState {
  flags: Flag[];
  enemies: Enemy[];
  enemyArchers: EnemyArcher[];
  enemyWraiths: EnemyWraith[];
  enemyHounds: EnemyHound[];
  enemyLichs: EnemyLich[];
  enemyShadowAssassins: EnemyShadowAssassin[];
  enemyFlameCallers: EnemyFlameCaller[];
  enemyCorruptedSentinels: EnemyCorruptedSentinel[];
  boss: Boss | null;
  chests: Chest[];
  banners: Banner[];
  barricades: Barricade[];
  crystalTurrets: CrystalTurret[];
  iceWalls: IceWall[];
  iceTurrets: IceTurret[];
  smithingBonusStacks: number; // Better Weapons: cumulative +0.5 dmg stacks this zone (cap 2/zone)
  currentZone: number;
  bossesDefeated: number;
  flagsCaptured: number;
  lastFlagCaptureFrame: number;
  goldEarned: number;
  totalGoldEarned: number;
  goldHistory?: number[];
  goldHistoryIdx?: number;
  goldLastSnapshot?: number;
  gemsThisRun: number;
  shardsThisRun: number;
  incomeTimer: number;
  incomeTimer2: number;
  incomeTimer3: number;
  incomeTimer4: number;
  incomeTimer5: number;
  incomeTimer6: number;
  incomeTimer7: number;
  incomeTimer8: number;
  portalFlagIndex: number;
  relicDrops: string[];
  cameraX: number;
  projectiles: Projectile[];
  enemiesKilled: number;
  killGoldEarned: number;
  eliteKills: number;
  eliteLastSpawnFrame: number;
  activeEliteId: number | null;
  activeEliteVariant: string | null;
  lastEliteVariants: string[];
  unitSlots: UnitSlot[];
  allies: Ally[];
  hero: Hero;
  runUpgrades: RunUpgrades;
  armyHoldMode: boolean;
}

// ---- Run Upgrades (reset each run) ----

export interface RunUpgrades {
  hero: number;
  soldier: number;
  archer: number;
  halberd: number;
  knight: number;
  wizard: number;
  cleric: number;
  conjurer: number;
  bombard: number;
  passiveIncome: number;
  passiveIncome2: number;
  passiveIncome3: number;
  passiveIncome4: number;
  passiveIncome5: number;
  passiveIncome6: number;
  passiveIncome7: number;
  passiveIncome8: number;
  goldBonus: number;
  [key: string]: number;
}

// ---- Permanent Upgrades (persist across runs) ----

export interface PermanentUpgrades {
  clickDamage: number;
  unlockedUnits: string[];
  unitTogglePurchased: string[];
  disabledUnits: string[];
  extraRerolls: number;
  incomeTier2: number;
  incomeTier3: number;
  incomeTier4: number;
  incomeTier5: number;
  incomeTier6: number;
  incomeTier7: number;
  incomeTier8: number;
  autoPortal: number;
  tutorialStep: number;
  playerName: string;
  [key: string]: number | string | string[];
}

// ---- Full Game State ----

export interface GameState {
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
  unitSlots: UnitSlot[];
  particles: Particle[];
  projectiles: Projectile[];
  chests: Chest[];
  banners: Banner[];
  barricades: Barricade[];
  crystalTurrets: CrystalTurret[];
  iceWalls: IceWall[];
  iceTurrets: IceTurret[];
  smithingBonusStacks: number;
  boss: Boss | null;
  currentZone: number;
  rollCost: number;
  rollCount: number;
  bossesDefeated: number;
  frame: number;
  enemiesKilled: number;
  killGoldEarned: number;
  eliteKills: number;
  peakDistance: number;
  gameOver: boolean;
  retreated: boolean;
  score: number;
  goldEarned: number;
  totalGoldEarned: number;
  goldHistory?: number[];
  goldHistoryIdx?: number;
  goldLastSnapshot?: number;
  gemsThisRun: number;
  shardsThisRun: number;
  flagsCaptured: number;
  lastFlagCaptureFrame: number;
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
  autoFireball: boolean;
  autoSkills: string[];
  autoPortalForward: boolean;
  armyHoldMode: boolean;
  artifacts: Artifact[];
  pendingArtifactChoice: Artifact[] | null;
  pendingRoll: { unitType: string; rerollCount: number } | null;
  runUpgrades: RunUpgrades;
  tutorialActive: boolean;
  dismissedTutorials: string[];
  tutorialDialogueVisible: boolean;
  bossDeathFlash: boolean;
  playerName: string;
  relicDrops: string[];
  freeRerolls: number;
  artifactKeyPortalRequested: boolean;
  regaliaKeyPortalRequested: boolean;
  challengeId: ChallengeId | null;
  challengeComplete: boolean;
  challengeLevel: number;
  challengeLevelUpPending: boolean;
  blessingCooldown: number;
  decreeActive: boolean;
  heroSkills: HeroSkillState;
  pendingSkillChoice: string[] | null;
  pendingSkillUses: string[];
  pendingRelicChoice: { id: string; name: string; icon: string; rarity: string; desc: string }[] | null;
  heroClass: HeroClassId;
  prestigeShardsAwarded?: number;
  // ---- Dungeon state ----
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
  dungeonPortalTimer: number;
  dungeonPortalFlagId: number;
  dungeonShopOpen: boolean;
  dungeonTriggerZone: number;
  dungeonTriggerFlags: number;
  dungeonUnlocked: boolean;
  dungeonPityCounter: number;
  dungeonOver: boolean;
  dungeonMeleeBoost: number;
  dungeonRangedBoost: number;
  dungeonMagicBoost: number;
  dungeonAllyMode: 'advance' | 'hold' | 'retreat';
  dungeonUnitsRolled: number;
  dungeonMetaUpgrades: DungeonMetaUpgrades;
  savedMainState: DungeonSavedState | null;
  // ---- Timed dungeon state ----
  dungeonType: 'wave' | 'timed' | null;
  timedDungeonTimer: number;
  timedDungeonVictory: boolean;
  timedDungeonPortalTimer: number;
  timedDungeonPortalFlagId: number;
  dungeonTicksSpent: number;
  // Relic v2: ancient relic copy tracking for leveling
  ancientRelicCopies?: Record<string, number>;
  // ---- Elite mini-boss state ----
  eliteLastSpawnFrame: number;
  activeEliteId: number | null;
  activeEliteVariant: string | null;
  lastEliteVariants: string[];
  eliteArtifactDroppedThisRun?: boolean;
  forceSpawnElite?: boolean;
  // Dev tools
  devSpawnsDisabled?: boolean;
  devPaused?: boolean;
  devGodMode?: boolean;
  // ---- Pet state (per-run) ----
  petCooldown: number;
  backpack: Backpack;
}

// ---- Shard Prestige Upgrades (persist across runs) ----

export interface ShardUpgrades {
  // Soldier
  soldier_quartermastersFavor: number;
  soldier_fodder: number;
  soldier_rations: number;
  soldier_plating: number;
  soldier_betterBoots: number;
  soldier_keenEdge: number;
  soldier_secondWind: number;
  // Archer
  archer_doubleTap: number;
  archer_eagleEye: number;
  archer_rations: number;
  archer_keenEdge: number;
  archer_leatherwork: number;
  archer_distance: number;
  archer_aiming: number;
  // Knight
  knight_ironclad: number;
  knight_heavyPlating: number;
  knight_bulwark: number;
  knight_standFirm: number;
  knight_betterBoots: number;
  knight_giant: number;
  knight_tempered: number;
  // Halberd
  halberd_rations: number;
  halberd_keenEdge: number;
  halberd_hardening: number;
  halberd_reach: number;
  halberd_betterBoots: number;
  halberd_wideSweep: number;
  halberd_impale: number;
  // Apprentice
  wizard_shield: number;
  wizard_elemental: number;
  wizard_teaBiscuits: number;
  wizard_mastery: number;
  wizard_discipline: number;
  wizard_manaTap: number;
  wizard_walkingStick: number;
  // Cleric
  cleric_mending: number;
  cleric_holyVestments: number;
  cleric_blessing: number;
  cleric_devotion: number;
  cleric_massResurrect: number;
  cleric_betterSandals: number;
  cleric_groupHeal: number;
  // Conjurer
  conjurer_crystalResonance: number;
  conjurer_hardenedLattice: number;
  conjurer_sustainedChannel: number;
  conjurer_rapidConjuring: number;
  conjurer_crystalArray: number;
  conjurer_arcaneAttunement: number;
  conjurer_prismaticShards: number;
  // Bombard
  bombard_shrapnel: number;
  bombard_betterBarrel: number;
  bombard_refinedPowder: number;
  bombard_gear: number;
  bombard_rations: number;
  bombard_backpack: number;
  bombard_blastRadius: number;
  [key: string]: number;
}

export type GameScreen = 'menu' | 'modeSelect' | 'classSelect' | 'challengeSelect' | 'playing' | 'gameover' | 'upgrade' | 'settings';

export type CameraMode = 'hero' | 'furthest' | 'manual';

export type ChallengeId = 'loneWolf' | 'famine' | 'colosseum' | 'glassCannon' | 'noRetreat' | 'cursedLands' | 'hordeMode' | 'embargo';
export type ChallengeCompletions = Partial<Record<ChallengeId, number>>;

// ---- Consumables ----
export type ConsumableId = 'healingPotion' | 'rerollVoucher' | 'artifactKey' | 'regaliaKey' | 'challengeKey';
export type Backpack = Record<ConsumableId, number>;
