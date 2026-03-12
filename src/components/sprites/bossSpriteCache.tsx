// ============================================================
// BOSS SPRITE CACHE — Pre-renders all 8 boss types as SVG blob
// URLs. Each type gets 8 idle frames + 8 attack frames.
// Used by worldRenderer.ts to draw bosses via ctx.drawImage().
// ============================================================

import { renderToStaticMarkup } from 'react-dom/server';
import { createElement } from 'react';
import PixelBossComp from './PixelBoss';

// --- Utility ---

function renderToBlob(element: React.ReactElement, viewBox: string): string {
  const markup = renderToStaticMarkup(element);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}">${markup}</svg>`;
  return URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' }));
}

// 16 frame values for smoother particle/glow animations
const IDLE_FRAMES = [0, 12, 24, 36, 48, 60, 72, 84, 96, 108, 120, 132, 144, 156, 168, 180];

// Attack animations use fast sin() rates (0.4–0.8), full cycle ~8–16 frames.
// Dense sampling across 2 full cycles to capture wind-up/strike/recover clearly.
const ATTACK_FRAMES = [0, 2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30];

// Neutral base props (no damage, full health, no bleed)
const BASE = {
  x: 0, y: 0, health: 100, maxHealth: 100, lastDamageTime: 0,
  showHpNumbers: false, bleedStacks: 0, bodyOnly: true,
};

// ============================================================
// CACHE INTERFACE
// ============================================================

export interface BossTypeCache {
  idle: string[];
  attack: string[];
}

export const BOSS_IDLE_FRAME_COUNT = 16;

// ============================================================
// VIEWBOX CONSTANTS PER BOSS TYPE
// These define the bounding box around the body art (no HP bar).
// The boss component renders at translate(0, 0+animation).
// ============================================================

// Type 0: Forest Guardian — translate(x, y+bob)
// Branches reach x=-36..96, crown y=-25, roots/shadow y=82
export const BOSS0_VB_X = -36;
export const BOSS0_VB_Y = -25;
export const BOSS0_VB_W = 135;
export const BOSS0_VB_H = 112;

// Type 1: Wild Huntsman — translate(x, y+bob)
// Bow x=-18, arms x=62, hood y=-15, shadow y=89
export const BOSS1_VB_X = -20;
export const BOSS1_VB_Y = -16;
export const BOSS1_VB_W = 90;
export const BOSS1_VB_H = 108;

// Type 2: Wraith King — translate(x, y+float)
// Arms/cast extend x=-28..92, crown y=-15, trail/shadow y=90
export const BOSS2_VB_X = -28;
export const BOSS2_VB_Y = -15;
export const BOSS2_VB_W = 120;
export const BOSS2_VB_H = 110;

// Type 3: Broodmother — translate(x, y+bob)
// Legs x=-10..74, head x=-12, paws x=-3..67, shadow y=88
export const BOSS3_VB_X = -22;
export const BOSS3_VB_Y = -16;
export const BOSS3_VB_W = 108;
export const BOSS3_VB_H = 108;

// Type 4: Dungeon Lich — translate(x, y+float) scale(2)
// Pre-scale coords: crown y=-11, robe y=44, staff x=29, wisps orbit ±18
// After scale(2): effective bounding box is 2x these values
export const BOSS4_VB_X = -8;
export const BOSS4_VB_Y = -14;
export const BOSS4_VB_W = 44;
export const BOSS4_VB_H = 62;

// Type 5: Ice Conjurer — translate(x-25, y-12)
// At x=0,y=0 → translate(-25, -12). SVG bounds: hood tip y=-4, left robe/hand x=-20, shadow y=80
export const BOSS5_VB_X = -22;
export const BOSS5_VB_Y = -6;
export const BOSS5_VB_W = 82;
export const BOSS5_VB_H = 104;

// Type 6: Snow Ninja — translate(x-25, y-12+bob)
// At x=0,y=0 → translate(-25, -12+bob). Local: headband y=22, sandals y=87
export const BOSS6_VB_X = -8;
export const BOSS6_VB_Y = 12;
export const BOSS6_VB_W = 66;
export const BOSS6_VB_H = 82;

// Type 7: Infernal General — translate(x-25, y-16+bob)
// At x=0,y=0 → translate(-25, -16+bob). Local: horns y=0, boots y=92
export const BOSS7_VB_X = -12;
export const BOSS7_VB_Y = -6;
export const BOSS7_VB_W = 76;
export const BOSS7_VB_H = 106;


// ============================================================
// CACHE BUILDERS — one per boss type
// ============================================================

const caches: (BossTypeCache | null)[] = [null, null, null, null, null, null, null, null];

function initBossType(
  bossType: number,
  vbX: number, vbY: number, vbW: number, vbH: number,
  extraProps?: Record<string, unknown>,
): BossTypeCache {
  if (caches[bossType]) return caches[bossType]!;

  const vb = `${vbX} ${vbY} ${vbW} ${vbH}`;

  const idle = IDLE_FRAMES.map(f =>
    renderToBlob(createElement(PixelBossComp, {
      ...BASE, frame: f, bossType, isAttacking: false, ...extraProps,
    }), vb)
  );

  const attack = ATTACK_FRAMES.map(f =>
    renderToBlob(createElement(PixelBossComp, {
      ...BASE, frame: f, bossType, isAttacking: true, ...extraProps,
    }), vb)
  );

  caches[bossType] = { idle, attack };
  return caches[bossType]!;
}

// --- Public init functions ---

export function initBoss0SpriteCache(): BossTypeCache {
  return initBossType(0, BOSS0_VB_X, BOSS0_VB_Y, BOSS0_VB_W, BOSS0_VB_H);
}

export function initBoss1SpriteCache(): BossTypeCache {
  return initBossType(1, BOSS1_VB_X, BOSS1_VB_Y, BOSS1_VB_W, BOSS1_VB_H);
}

export function initBoss2SpriteCache(): BossTypeCache {
  return initBossType(2, BOSS2_VB_X, BOSS2_VB_Y, BOSS2_VB_W, BOSS2_VB_H);
}

export function initBoss3SpriteCache(): BossTypeCache {
  return initBossType(3, BOSS3_VB_X, BOSS3_VB_Y, BOSS3_VB_W, BOSS3_VB_H, {
    summonCooldown: 0, howlCooldown: 0,
  });
}

export function initBoss4SpriteCache(): BossTypeCache {
  return initBossType(4, BOSS4_VB_X, BOSS4_VB_Y, BOSS4_VB_W, BOSS4_VB_H);
}

export function initBoss5SpriteCache(): BossTypeCache {
  return initBossType(5, BOSS5_VB_X, BOSS5_VB_Y, BOSS5_VB_W, BOSS5_VB_H, {
    enrageTriggered: false,
  });
}

export function initBoss6SpriteCache(): BossTypeCache {
  return initBossType(6, BOSS6_VB_X, BOSS6_VB_Y, BOSS6_VB_W, BOSS6_VB_H);
}

export function initBoss7SpriteCache(): BossTypeCache {
  return initBossType(7, BOSS7_VB_X, BOSS7_VB_Y, BOSS7_VB_W, BOSS7_VB_H, {
    enrageTriggered: false, pullTimer: 0, cleaveCooldown: 0,
  });
}

// --- Convenience: get cache for any boss type ---
const INIT_FNS = [
  initBoss0SpriteCache, initBoss1SpriteCache, initBoss2SpriteCache, initBoss3SpriteCache,
  initBoss4SpriteCache, initBoss5SpriteCache, initBoss6SpriteCache, initBoss7SpriteCache,
];

export function initBossSpriteCache(bossType: number): BossTypeCache {
  const fn = INIT_FNS[bossType];
  if (!fn) return initBoss0SpriteCache(); // fallback
  return fn();
}

// ViewBox lookup per boss type (for drawSprite positioning)
export const BOSS_VB = [
  { x: BOSS0_VB_X, y: BOSS0_VB_Y, w: BOSS0_VB_W, h: BOSS0_VB_H },
  { x: BOSS1_VB_X, y: BOSS1_VB_Y, w: BOSS1_VB_W, h: BOSS1_VB_H },
  { x: BOSS2_VB_X, y: BOSS2_VB_Y, w: BOSS2_VB_W, h: BOSS2_VB_H },
  { x: BOSS3_VB_X, y: BOSS3_VB_Y, w: BOSS3_VB_W, h: BOSS3_VB_H },
  { x: BOSS4_VB_X, y: BOSS4_VB_Y, w: BOSS4_VB_W, h: BOSS4_VB_H },
  { x: BOSS5_VB_X, y: BOSS5_VB_Y, w: BOSS5_VB_W, h: BOSS5_VB_H },
  { x: BOSS6_VB_X, y: BOSS6_VB_Y, w: BOSS6_VB_W, h: BOSS6_VB_H },
  { x: BOSS7_VB_X, y: BOSS7_VB_Y, w: BOSS7_VB_W, h: BOSS7_VB_H },
] as const;
