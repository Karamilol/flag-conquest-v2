// ============================================================
// ENEMY SPRITE CACHE — Pre-renders all enemy types as SVG blob
// URLs. Each type gets 8 idle frames + N attack/state frames.
// Used by canvasRenderer.ts to draw enemies via ctx.drawImage().
// ============================================================

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';

// Import all enemy components (default = memo'd, works fine with renderToStaticMarkup)
import DetailedArcherComp from './DetailedArcher';
import DetailedWraithComp from './DetailedWraith';
import DetailedHoundComp from './DetailedHound';
import DetailedLichComp from './DetailedLich';
import DetailedShadowAssassinComp from './DetailedShadowAssassin';
import DetailedCorruptedSentinelComp from './DetailedCorruptedSentinel';
import DetailedDungeonRatComp from './DetailedDungeonRat';
import DetailedFireImpComp from './DetailedFireImp';
import DetailedCursedKnightComp from './DetailedCursedKnight';
import DetailedFlameCallerComp from './DetailedFlameCaller';

// --- Utility ---

function renderToBlob(element: React.ReactElement, viewBox: string): string {
  const markup = renderToStaticMarkup(element);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markup}</svg>`;
  return URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
}

// 8 frame values spread across animation cycle for good diversity
// tf = floor(frame/3)*3, so these give tf values: 0, 24, 48, 72, 96, 120, 144, 168
const IDLE_FRAMES = [0, 24, 48, 72, 96, 120, 144, 168];

// Neutral base props (no damage, no elite, full health)
const BASE = { x: 0, y: 0, health: 100, maxHealth: 100, lastDamageTime: 0, showHpNumbers: false, isElite: false };

// ============================================================
// CACHE INTERFACES
// ============================================================

export interface EnemyTypeCache {
  idle: string[];
  attack: string[];
  // Special state frames
  lunge?: string;
  recovery?: string;
  cloakedIdle?: string[];
  casting?: string[];
}

export const ENEMY_IDLE_FRAME_COUNT = 8;

// --- ViewBox constants per enemy type (from bounding box analysis) ---

// Archer: bow tip x≈-17, cloak x≈24, hood y≈-8, boots y≈27
export const ARCHER_VB_X = -20;
export const ARCHER_VB_Y = -14;
export const ARCHER_VB_W = 48;
export const ARCHER_VB_H = 46;

// Wraith: claws x=-13..43, hood y=-10, tendrils y=48
export const WRAITH_VB_X = -15;
export const WRAITH_VB_Y = -12;
export const WRAITH_VB_W = 60;
export const WRAITH_VB_H = 62;

// Hound: front x=-4, tail x=34, body y=0..24 (elite text at -18 excluded)
export const HOUND_VB_X = -6;
export const HOUND_VB_Y = -2;
export const HOUND_VB_W = 42;
export const HOUND_VB_H = 28;

// Lich: casting hand extends to x=-12 (spell glow r=7 + translate), staff glow x=34.5
// Crown peak y=-5.5, robe tatters y=46, rune circle ry extends to y=47
export const LICH_VB_X = -14;
export const LICH_VB_Y = -22;
export const LICH_VB_W = 56;
export const LICH_VB_H = 74;

// Shadow Assassin: dagger x=-14, body x=22, hood y=0..27 (elite text at -18 excluded)
export const SHADOW_VB_X = -16;
export const SHADOW_VB_Y = -2;
export const SHADOW_VB_W = 40;
export const SHADOW_VB_H = 31;

// Corrupted Sentinel: shield x=-4, pauldron x=28, helm y=-10, shadow y=38
export const SENTINEL_VB_X = -6;
export const SENTINEL_VB_Y = -12;
export const SENTINEL_VB_W = 36;
export const SENTINEL_VB_H = 52;

// Dungeon Rat: whiskers x=-8.5, tail x=24.5, ears y=-2, claws y=19.2
export const RAT_VB_X = -10;
export const RAT_VB_Y = -4;
export const RAT_VB_W = 37;
export const RAT_VB_H = 25;

// Fire Imp: casting wings to x=-6/26, HP text y=-10, horn flames y=-7.5, feet y=22.5
export const IMP_VB_X = -8;
export const IMP_VB_Y = -13;
export const IMP_VB_W = 36;
export const IMP_VB_H = 40;

// Cursed Knight: shield x=-6, pauldron x=24, helm y=-10, shadow y=33
export const KNIGHT_VB_X = -8;
export const KNIGHT_VB_Y = -12;
export const KNIGHT_VB_W = 34;
export const KNIGHT_VB_H = 47;

// Flame Caller: hand x=-3, staff x=28, crown y=-6, hem y=47
export const FLAME_VB_X = -5;
export const FLAME_VB_Y = -8;
export const FLAME_VB_W = 35;
export const FLAME_VB_H = 57;


// ============================================================
// CACHE BUILDERS
// ============================================================

let archerCache: EnemyTypeCache | null = null;

export function initArcherSpriteCache(): EnemyTypeCache {
  if (archerCache) return archerCache;
  const vb = `${ARCHER_VB_X} ${ARCHER_VB_Y} ${ARCHER_VB_W} ${ARCHER_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedArcherComp, { ...BASE, frame: f, attackCooldown: 99, bodyOnly: true }), vb)
  );

  // 10 attack frames (attackCooldown 9 → 0)
  const attack = Array.from({ length: 10 }, (_, i) =>
    renderToBlob(createElement(DetailedArcherComp, { ...BASE, frame: 60, attackCooldown: 9 - i, bodyOnly: true }), vb)
  );

  archerCache = { idle, attack };
  return archerCache;
}

let wraithCache: EnemyTypeCache | null = null;

export function initWraithSpriteCache(): EnemyTypeCache {
  if (wraithCache) return wraithCache;
  const vb = `${WRAITH_VB_X} ${WRAITH_VB_Y} ${WRAITH_VB_W} ${WRAITH_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedWraithComp, { ...BASE, frame: f, attackCooldown: 99 }), vb)
  );

  const attack = Array.from({ length: 10 }, (_, i) =>
    renderToBlob(createElement(DetailedWraithComp, { ...BASE, frame: 60, attackCooldown: 9 - i }), vb)
  );

  wraithCache = { idle, attack };
  return wraithCache;
}

let houndCache: EnemyTypeCache | null = null;

export function initHoundSpriteCache(): EnemyTypeCache {
  if (houndCache) return houndCache;
  const vb = `${HOUND_VB_X} ${HOUND_VB_Y} ${HOUND_VB_W} ${HOUND_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedHoundComp, { ...BASE, frame: f, lungeTimer: 0, recoveryTimer: 0 }), vb)
  );

  // Lunge frame (stretched)
  const lunge = renderToBlob(
    createElement(DetailedHoundComp, { ...BASE, frame: 60, lungeTimer: 30, recoveryTimer: 0 }), vb
  );

  // Recovery frame (panting, mouth open)
  const recovery = renderToBlob(
    createElement(DetailedHoundComp, { ...BASE, frame: 60, lungeTimer: 0, recoveryTimer: 30 }), vb
  );

  houndCache = { idle, attack: [], lunge, recovery };
  return houndCache;
}

let lichCache: EnemyTypeCache | null = null;

export function initLichSpriteCache(): EnemyTypeCache {
  if (lichCache) return lichCache;
  const vb = `${LICH_VB_X} ${LICH_VB_Y} ${LICH_VB_W} ${LICH_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedLichComp, {
      ...BASE, frame: f, activeSkeletons: 0,
      iceballCooldown: 0, healCooldown: 0, passiveSummonTimer: 0,
    }), vb)
  );

  // Casting ice frames (iceballCooldown 250 → 300 in 4 steps)
  const casting = [260, 275, 290, 300].map(cd =>
    renderToBlob(createElement(DetailedLichComp, {
      ...BASE, frame: 60, activeSkeletons: 2,
      iceballCooldown: cd, healCooldown: 0, passiveSummonTimer: 0,
    }), vb)
  );

  lichCache = { idle, attack: [], casting };
  return lichCache;
}

let shadowCache: EnemyTypeCache | null = null;

export function initShadowAssassinSpriteCache(): EnemyTypeCache {
  if (shadowCache) return shadowCache;
  const vb = `${SHADOW_VB_X} ${SHADOW_VB_Y} ${SHADOW_VB_W} ${SHADOW_VB_H}`;

  // Visible idle
  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedShadowAssassinComp, {
      ...BASE, frame: f, stealthTimer: 0, visibleTimer: 100, attackCooldown: 99,
    }), vb)
  );

  // Cloaked idle (low opacity shimmer)
  const cloakedIdle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedShadowAssassinComp, {
      ...BASE, frame: f, stealthTimer: 100, visibleTimer: 0, attackCooldown: 99,
    }), vb)
  );

  // Attack frames (attackCooldown 7 → 0)
  const attack = Array.from({ length: 8 }, (_, i) =>
    renderToBlob(createElement(DetailedShadowAssassinComp, {
      ...BASE, frame: 60, stealthTimer: 0, visibleTimer: 100, attackCooldown: 7 - i,
    }), vb)
  );

  shadowCache = { idle, attack, cloakedIdle };
  return shadowCache;
}

let sentinelCache: EnemyTypeCache | null = null;

export function initCorruptedSentinelSpriteCache(): EnemyTypeCache {
  if (sentinelCache) return sentinelCache;
  const vb = `${SENTINEL_VB_X} ${SENTINEL_VB_Y} ${SENTINEL_VB_W} ${SENTINEL_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedCorruptedSentinelComp, { ...BASE, frame: f, attackCooldown: 99 }), vb)
  );

  // 12 attack frames (attackCooldown 11 → 0)
  const attack = Array.from({ length: 12 }, (_, i) =>
    renderToBlob(createElement(DetailedCorruptedSentinelComp, { ...BASE, frame: 60, attackCooldown: 11 - i }), vb)
  );

  sentinelCache = { idle, attack };
  return sentinelCache;
}

let ratCache: EnemyTypeCache | null = null;

export function initDungeonRatSpriteCache(): EnemyTypeCache {
  if (ratCache) return ratCache;
  const vb = `${RAT_VB_X} ${RAT_VB_Y} ${RAT_VB_W} ${RAT_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedDungeonRatComp, { ...BASE, frame: f, attackCooldown: 99 }), vb)
  );

  // 10 attack frames (attackCooldown 9 → 0)
  const attack = Array.from({ length: 10 }, (_, i) =>
    renderToBlob(createElement(DetailedDungeonRatComp, { ...BASE, frame: 60, attackCooldown: 9 - i }), vb)
  );

  ratCache = { idle, attack };
  return ratCache;
}

let impCache: EnemyTypeCache | null = null;

export function initFireImpSpriteCache(): EnemyTypeCache {
  if (impCache) return impCache;
  const vb = `${IMP_VB_X} ${IMP_VB_Y} ${IMP_VB_W} ${IMP_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedFireImpComp, {
      ...BASE, frame: f, isCasting: false, castTimer: 0, castTargetX: 0, castTargetY: 0,
    }), vb)
  );

  // Casting frames (castTimer progresses)
  const casting = [10, 30, 50, 70].map(ct =>
    renderToBlob(createElement(DetailedFireImpComp, {
      ...BASE, frame: 60, isCasting: true, castTimer: ct, castTargetX: -50, castTargetY: 0,
    }), vb)
  );

  impCache = { idle, attack: [], casting };
  return impCache;
}

let cursedKnightCache: EnemyTypeCache | null = null;

export function initCursedKnightSpriteCache(): EnemyTypeCache {
  if (cursedKnightCache) return cursedKnightCache;
  const vb = `${KNIGHT_VB_X} ${KNIGHT_VB_Y} ${KNIGHT_VB_W} ${KNIGHT_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedCursedKnightComp, { ...BASE, frame: f, attackCooldown: 99 }), vb)
  );

  // 12 attack frames
  const attack = Array.from({ length: 12 }, (_, i) =>
    renderToBlob(createElement(DetailedCursedKnightComp, { ...BASE, frame: 60, attackCooldown: 11 - i }), vb)
  );

  cursedKnightCache = { idle, attack };
  return cursedKnightCache;
}

let flameCallerCache: EnemyTypeCache | null = null;

export function initFlameCallerSpriteCache(): EnemyTypeCache {
  if (flameCallerCache) return flameCallerCache;
  const vb = `${FLAME_VB_X} ${FLAME_VB_Y} ${FLAME_VB_W} ${FLAME_VB_H}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(DetailedFlameCallerComp, {
      ...BASE, frame: f, isCasting: false, castTimer: 0, castTargetX: 0, castTargetY: 0,
    }), vb)
  );

  // Casting frames
  const casting = [30, 90, 150, 210].map(ct =>
    renderToBlob(createElement(DetailedFlameCallerComp, {
      ...BASE, frame: 60, isCasting: true, castTimer: ct, castTargetX: -100, castTargetY: 0,
    }), vb)
  );

  flameCallerCache = { idle, attack: [], casting };
  return flameCallerCache;
}
