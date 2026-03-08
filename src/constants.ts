// Pixel art color palette - earthy fantasy
export const COLORS = {
  bg: '#1a1a2e',
  ground: '#4a4a68',
  groundLight: '#5a5a78',
  heroBlue: '#4a9fff',
  heroLight: '#7abfff',
  enemyRed: '#ff4a4a',
  enemyDark: '#cc3333',
  flagPole: '#8b7355',
  flagFriendly: '#4aff4a',
  flagEnemy: '#ff4a4a',
  healthGreen: '#4aff4a',
  healthRed: '#ff4a4a',
  healthBg: '#333',
  gold: '#ffd700',
  text: '#ffffff',
  textDim: '#888888',
  panel: '#2a2a4e',
  panelBorder: '#4a4a6e',
} as const;

export const GAME_WIDTH = 1600;
export const GAME_HEIGHT = 370;
export const VIEWPORT_W = 500;   // Game-logic viewport width (coordinates)
export const VIEWPORT_H = 350;   // Game-logic viewport height (coordinates)
export const CAMERA_OFFSET = 100; // Hero distance from left edge of viewport

// Display frame — 1.25x zoom for sidebar idle game
export const DISPLAY_SCALE = 1.25;
export const DISPLAY_W = 625;  // VIEWPORT_W * 1.25
export const DISPLAY_H = 438;  // VIEWPORT_H * 1.25 (rounded)
export const GROUND_Y = 320;
export const HERO_SIZE = 32;
export const ENEMY_SIZE = 24;
export const FLAG_HEIGHT = 60;

// Unit base stats - clean and independent
export const UNIT_STATS = {
  enemy: {
    health: 25,
    damage: 5,
    speed: 0.45,
    attackRate: 64,
    attackRange: 40,
  },
  enemyArcher: {
    health: 15,
    damage: 11,
    speed: 0.4,
    attackRate: 110,
    attackRange: 220,
  },
  enemyWraith: {
    health: 125,
    damage: 10,
    speed: 0.25,
    attackRate: 80,
    attackRange: 22,
    knockback: 12,
    defense: 1,
  },
  enemyHound: {
    health: 22,
    damage: 18,
    speed: 1.4,
    attackRate: 104,
    attackRange: 120,
  },
  enemyLich: {
    health: 18,
    damage: 0,
    speed: 0.25,
    attackRate: 180,
    attackRange: 240,
  },
  enemyShadowAssassin: {
    health: 18,
    damage: 35,
    speed: 0.6,
    attackRate: 86,
    attackRange: 28,
    engageRange: 300,
    scanDuration: 120, // 2 seconds scanning for backline targets
  },
  enemyFlameCaller: {
    health: 35,
    damage: 24,
    speed: 0.2,
    attackRange: 300,
    castTime: 310,    // ~5.2 seconds to cast
    castCooldown: 276, // ~4.6 seconds between casts
    aoeRadius: 60,
  },
  enemyCorruptedSentinel: {
    health: 200,
    damage: 8,
    defense: 3,
    speed: 0.12,
    attackRate: 70,
    attackRange: 30,
    reflectDuration: 180, // 3 seconds of reflect
    reflectCooldown: 300, // 5 seconds between reflects
  },
  // Dungeon-exclusive enemy types
  dungeonRat: {
    health: 8,
    damage: 8,
    speed: 1.0,
    attackRate: 50,
    attackRange: 30,
  },
  fireImp: {
    health: 15,
    damage: 10,
    speed: 0.3,
    attackRange: 180,
    castTime: 120,
    castCooldown: 180,
    aoeRadius: 40,
  },
  cursedKnight: {
    health: 75,
    damage: 6,
    defense: 2,
    speed: 0.2,
    attackRate: 70,
    attackRange: 35,
  },
  boss: {
    health: 2000,
    damage: 45,       // Forest Guardian single-target base (nerfed from 60)
    aoeDamage: 50,    // Wild Huntsman AOE base
    speed: 0,
    attackRate: 70,
    attackRange: 240,
  },
  // Ally unit types
  soldier: {
    name: 'Soldier',
    category: 'melee' as const,
    health: 27,
    damage: 5,
    speed: 0.7,
    attackRate: 54,
    attackRange: 30,
    respawnTime: 360,
    color: '#4a7fff',
  },
  archer: {
    name: 'Archer',
    category: 'ranged' as const,
    health: 15,
    damage: 12,
    speed: 0.50,
    attackRate: 110,
    attackRange: 220,
    respawnTime: 420,
    color: '#7fff4a',
  },
  knight: {
    name: 'Knight',
    category: 'melee' as const,
    health: 78,
    damage: 8,
    defense: 2,
    speed: 0.3,
    attackRate: 58,
    attackRange: 35,
    respawnTime: 660,
    color: '#ffd700',
  },
  halberd: {
    name: 'Halberd',
    category: 'melee' as const,
    health: 41,
    damage: 4,
    defense: 1,
    speed: 0.55,
    attackRate: 52,
    attackRange: 48,
    respawnTime: 480,
    color: '#cc6b2e',
  },
  cleric: {
    name: 'Cleric',
    category: 'ranged' as const,
    health: 26,
    damage: 21,
    defense: 1,
    speed: 0.4,
    attackRate: 172,
    attackRange: 180,
    respawnTime: 540,
    color: '#ff88cc',
  },
  wizard: {
    name: 'Apprentice',
    category: 'ranged' as const,
    health: 24,
    damage: 7,
    speed: 0.4,
    attackRate: 96,
    attackRange: 160,
    startAttackRange: 140,
    respawnTime: 480,
    color: '#a855f7',
  },
  conjurer: {
    name: 'Conjurer',
    category: 'magic' as const,
    health: 26,
    damage: 8,
    speed: 0.35,
    attackRate: 360,    // Turret placement interval (6 seconds)
    attackRange: 200,   // Turrets inherit this range
    respawnTime: 600,
    color: '#44ccbb',
    turretHpRatio: 0.6,      // Turret HP = 60% of conjurer max HP
    turretAttackRate: 80,     // Turret fires every 1.33s
    turretDuration: 1020,     // Turret lasts 17 seconds
    maxTurrets: 3,            // Max active turrets per conjurer
  },
  bombard: {
    name: 'Bombard',
    category: 'ranged' as const,
    health: 25,
    damage: 15,
    speed: 0.3,
    attackRate: 338,        // ~5.6s between shots
    attackRange: 320,       // Long range to reach backline
    respawnTime: 840,
    color: '#8b6914',
    aoeRadius: 30,          // Splash radius on landing
    arcHeight: 85,          // Parabolic peak height in px
  },
} as const;

// ---- Flag Building Definitions ----

export const BUILDING_DEFS: Record<string, {
  name: string;
  icon: string;
  desc: string;
  type: 'passive' | 'income' | 'oneshot';
  color: string;
  rareWeight?: boolean; // lower spawn weight in building pool
}> = {
  barracks:           { name: 'Barracks',            icon: '🏰', desc: '+5% atk speed',               type: 'passive',  color: '#4a7fff' },
  church:             { name: 'Church',              icon: '⛪', desc: 'regen 0.5% HP/3s',            type: 'passive',  color: '#ff88cc' },
  lumbercamp:         { name: 'Lumbercamp',          icon: '🪵', desc: '+0.05 move speed',            type: 'passive',  color: '#7fff4a' },
  farm:               { name: 'Farm',                icon: '🌾', desc: '2% passive income every 10s', type: 'income',   color: '#88cc44' },
  ruins:              { name: 'Ruins',               icon: '🏛️', desc: 'artifact chest',              type: 'oneshot',  color: '#aaaaaa' },
  forge:              { name: 'Forge',               icon: '⚒️', desc: '+2 damage',                   type: 'passive',  color: '#ff6633' },
  leatherworks:       { name: 'Leatherworks',        icon: '🧵', desc: '+1 defense',                  type: 'passive',  color: '#cc8844' },
  tavern:             { name: 'Tavern',              icon: '🍺', desc: '+8% max HP',                  type: 'passive',  color: '#ddaa33' },
  market:             { name: 'Market',              icon: '🪙', desc: '-3% income upgrade costs',    type: 'passive',  color: '#44cc88' },
  surveySite:         { name: 'Survey Site',         icon: '🔍', desc: 'relic chest',                 type: 'oneshot',  color: '#8888cc', rareWeight: true },
  recruitmentCenter:  { name: 'Recruitment Center',  icon: '📋', desc: '-3% unit upgrade costs',      type: 'passive',  color: '#6699cc' },
  guardPost:          { name: 'Guard Post',          icon: '🛡️', desc: '-3% respawn timers',          type: 'passive',  color: '#cc9944' },
  warShrine:          { name: 'War Shrine',          icon: '⚔️', desc: '3% crit chance for all',      type: 'passive',  color: '#dd4444' },
};

export const BUILDING_POOL: string[] = Object.keys(BUILDING_DEFS);

/** Check if a unit type is melee */
export function isUnitMelee(unitType: string): boolean {
  const stats = UNIT_STATS[unitType as keyof typeof UNIT_STATS] as any;
  return stats?.category === 'melee';
}

/** Check if a unit type is ranged */
export function isUnitRanged(unitType: string): boolean {
  const stats = UNIT_STATS[unitType as keyof typeof UNIT_STATS] as any;
  return stats?.category === 'ranged';
}

/** Check if a unit type is magic (wizard/apprentice, cleric, or conjurer) */
export function isUnitMagic(unitType: string): boolean {
  return unitType === 'wizard' || unitType === 'cleric' || unitType === 'conjurer';
}

// Unit roll weights — explicit percentages (must sum to 100)
export const UNIT_ROLL_WEIGHTS: Record<string, number> = {
  soldier: 29,
  halberd: 19,
  archer: 17,
  knight: 11,
  wizard: 8,
  cleric: 6,
  bombard: 5,
  conjurer: 5,
};

/** Pick a random unit type from the weighted pool, filtered to only allowed units */
export function rollUnitType(allowedUnits: string[]): string | null {
  const entries = allowedUnits
    .filter(u => u in UNIT_ROLL_WEIGHTS)
    .map(u => ({ type: u, weight: UNIT_ROLL_WEIGHTS[u] }));
  if (entries.length === 0) return null;
  const total = entries.reduce((s, e) => s + e.weight, 0);
  let roll = Math.random() * total;
  for (const e of entries) {
    roll -= e.weight;
    if (roll <= 0) return e.type;
  }
  return entries[entries.length - 1].type;
}

// NOTE: Artifact definitions moved to src/artifacts.ts (42 artifacts + 21 synergy pairs)

// Biome system
export type Biome = 'forest' | 'cave' | 'nordic' | 'volcanic';
export function getBiome(zone: number): Biome {
  if (zone <= 1) return 'forest';
  if (zone <= 3) return 'cave';
  if (zone <= 5) return 'nordic';
  return 'volcanic';
}
