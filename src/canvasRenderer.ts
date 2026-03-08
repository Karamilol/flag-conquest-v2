// ============================================================
// CANVAS RENDERER — Draws cached-sprite units, health bars,
// and particles on an HTML5 Canvas overlay. Replaces SVG
// rendering for these entities to eliminate DOM overhead.
// ============================================================

import { COLORS, VIEWPORT_W, VIEWPORT_H, GAME_HEIGHT, GROUND_Y, UNIT_STATS, DISPLAY_SCALE } from './constants';
import { drawEnvironment } from './rendering/environment';
import { drawWorldObjects } from './rendering/worldRenderer';
import { TileCache } from './rendering/tileRenderer';
import { initGoblinSpriteCache, IDLE_FRAME_COUNT as GOBLIN_IDLE_FRAMES } from './components/sprites/goblinSpriteCache';
import { initHeroSpriteCache, HERO_IDLE_FRAME_COUNT } from './components/sprites/heroSpriteCache';
import {
  initAllySpriteCache,
  ALLY_IDLE_FRAME_COUNT,
  ALLY_VB_X, ALLY_VB_Y, ALLY_VB_W, ALLY_VB_H,
} from './components/sprites/allySpriteCache';
import {
  initSkeletonSpriteCache,
  SKEL_IDLE_FRAME_COUNT,
  SKEL_VB_X, SKEL_VB_Y, SKEL_VB_W, SKEL_VB_H,
} from './components/sprites/skeletonSpriteCache';
import {
  ENEMY_IDLE_FRAME_COUNT,
  initArcherSpriteCache,
  ARCHER_VB_X, ARCHER_VB_Y, ARCHER_VB_W, ARCHER_VB_H,
  initWraithSpriteCache,
  WRAITH_VB_X, WRAITH_VB_Y, WRAITH_VB_W, WRAITH_VB_H,
  initHoundSpriteCache,
  HOUND_VB_X, HOUND_VB_Y, HOUND_VB_W, HOUND_VB_H,
  initLichSpriteCache,
  LICH_VB_X, LICH_VB_Y, LICH_VB_W, LICH_VB_H,
  initShadowAssassinSpriteCache,
  SHADOW_VB_X, SHADOW_VB_Y, SHADOW_VB_W, SHADOW_VB_H,
  initCorruptedSentinelSpriteCache,
  SENTINEL_VB_X, SENTINEL_VB_Y, SENTINEL_VB_W, SENTINEL_VB_H,
  initDungeonRatSpriteCache,
  RAT_VB_X, RAT_VB_Y, RAT_VB_W, RAT_VB_H,
  initFireImpSpriteCache,
  IMP_VB_X, IMP_VB_Y, IMP_VB_W, IMP_VB_H,
  initCursedKnightSpriteCache,
  KNIGHT_VB_X, KNIGHT_VB_Y, KNIGHT_VB_W, KNIGHT_VB_H,
  initFlameCallerSpriteCache,
  FLAME_VB_X, FLAME_VB_Y, FLAME_VB_W, FLAME_VB_H,
} from './components/sprites/enemySpriteCache';
import type { GameState } from './types';

const WORLD_Y_OFFSET = VIEWPORT_H - GAME_HEIGHT; // -20

// ============================================================
// SPRITE EXPLOSION SYSTEM — Body-part dismemberment
// Cuts the sprite into recognizable body parts (head, torso,
// weapon, legs) and scatters them with physics + sparks.
// ============================================================

interface SpriteFragment {
  img: HTMLImageElement | null; // null = spark particle (solid color)
  srcX: number; srcY: number; srcW: number; srcH: number;
  x: number; y: number; // world position
  vx: number; vy: number;
  angle: number; angularVel: number;
  age: number;
  groundY: number;
  bounced: boolean;
  drawW: number; drawH: number;
  color: string; // fallback / spark color
}

interface TrackedUnit {
  x: number; y: number;
  spriteUrl: string;
  vbX: number; vbY: number; vbW: number; vbH: number;
  isEnemy: boolean;
}

const FRAG_GRAVITY = 0.4;
const FRAG_MAX_AGE = 75;
const FRAG_MAX_TOTAL = 350;
const GRID_COLS = 4;
const GRID_ROWS = 4;

const prevAliveUnits = new Map<string, TrackedUnit>();
const explosionFragments: SpriteFragment[] = [];

function spawnExplosion(tracked: TrackedUnit, power: number) {
  const img = imageCache.get(tracked.spriteUrl);
  if (!img) return;

  const { x, y, vbX, vbY, vbW, vbH, isEnemy } = tracked;
  const dir = isEnemy ? -1 : 1;
  const imgW = img.naturalWidth;
  const imgH = img.naturalHeight;
  const gndY = y + vbY + vbH;
  const centerCol = (GRID_COLS - 1) / 2;
  const centerRow = (GRID_ROWS - 1) / 2;

  const cellSrcW = imgW / GRID_COLS;
  const cellSrcH = imgH / GRID_ROWS;
  const cellDrawW = vbW / GRID_COLS;
  const cellDrawH = vbH / GRID_ROWS;

  for (let col = 0; col < GRID_COLS; col++) {
    for (let row = 0; row < GRID_ROWS; row++) {
      const nx = (col - centerCol) / (centerCol || 1);

      // Randomized velocity — each piece gets its own wild trajectory
      const upForce = (2 + Math.random() * 4) * (row === 0 ? 1.5 : row === 1 ? 1.0 : 0.6);
      const sideForce = nx * (1.5 + Math.random() * 2.5);

      explosionFragments.push({
        img,
        srcX: col * cellSrcW, srcY: row * cellSrcH,
        srcW: cellSrcW, srcH: cellSrcH,
        x: x + vbX + col * cellDrawW,
        y: y + vbY + row * cellDrawH,
        vx: (sideForce + dir * (1 + Math.random() * 2) + (Math.random() - 0.5) * 2) * power,
        vy: -upForce * power,
        angle: 0,
        angularVel: (Math.random() - 0.5) * 22 * power,
        age: 0,
        groundY: gndY - 7 + Math.random() * 8,
        bounced: false,
        drawW: cellDrawW, drawH: cellDrawH,
        color: '',
      });
    }
  }

  // Spark particles — more sparks on crit
  const sparkCount = power > 1.5 ? 20 : 10;
  const sparkColors = isEnemy
    ? (power > 1.5 ? ['#ff2222', '#ff6600', '#ffff00', '#ffffff', '#ffcc44'] : ['#ff4444', '#ff8844', '#ffcc44', '#ff6622'])
    : (power > 1.5 ? ['#2266ff', '#00ccff', '#ffffff', '#aaddff', '#66eeff'] : ['#4488ff', '#44ccff', '#ffffff', '#88aaff']);
  const cx = x + vbX + vbW / 2;
  const cy = y + vbY + vbH / 2;
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const spd = (2 + Math.random() * 5) * power;
    explosionFragments.push({
      img: null,
      srcX: 0, srcY: 0, srcW: 0, srcH: 0,
      x: cx + (Math.random() - 0.5) * 8,
      y: cy + (Math.random() - 0.5) * 8,
      vx: Math.cos(angle) * spd + dir * 0.5,
      vy: Math.sin(angle) * spd - 1.5,
      angle: 0, angularVel: 0,
      age: 0,
      groundY: gndY - 5 + Math.random() * 8,
      bounced: false,
      drawW: (1.5 + Math.random() * 2.5) * (power > 1.5 ? 1.4 : 1), drawH: (1.5 + Math.random() * 2.5) * (power > 1.5 ? 1.4 : 1),
      color: sparkColors[i % sparkColors.length],
    });
  }
}

function detectDeaths(game: GameState, frame: number, heroClass: string) {
  const currentAlive = new Map<string, TrackedUnit>();
  const camX = game.cameraX || 0;
  const deathCullL = camX - 100;
  const deathCullR = camX + VIEWPORT_W + 100;

  // Track allies (skip off-screen — no visible explosion anyway)
  for (const ally of game.allies || []) {
    if (ally.health <= 0 || ally.x < deathCullL || ally.x > deathCullR) continue;
    if ((ally as any).isPet || (ally as any).isFriendlySlime || (ally as any).isCourier) continue;
    const unitType = (ally as any).unitType || 'soldier';
    const cacheKey = unitType === 'apprentice' ? 'wizard' : unitType;
    const allyCache = initAllySpriteCache();
    const sprites = (allyCache as any)[cacheKey] || allyCache.soldier;
    const isAttacking = ((ally as any).attackCooldown ?? 99) < 10;
    let url: string;
    if (isAttacking) {
      const atkIndex = Math.min(Math.floor((1 - ((ally as any).attackCooldown ?? 0) / 10) * sprites.attack.length), sprites.attack.length - 1);
      url = sprites.attack[Math.max(0, atkIndex)];
    } else {
      const offset = Math.floor(Math.abs(ally.x) * 3);
      const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % ALLY_IDLE_FRAME_COUNT;
      url = sprites.idle[idleIndex];
    }
    currentAlive.set(`a${ally.id}`, {
      x: ally.x, y: ally.y + ((ally as any).lane || 0) + WORLD_Y_OFFSET,
      spriteUrl: url, vbX: ALLY_VB_X, vbY: ALLY_VB_Y, vbW: ALLY_VB_W, vbH: ALLY_VB_H,
      isEnemy: false,
    });
  }

  // Track enemies (goblins + skeletons)
  for (const enemy of game.enemies || []) {
    if (enemy.health <= 0 || enemy.x < deathCullL || enemy.x > deathCullR) continue;
    const isSkel = !!(enemy as any).isLichSkeleton;
    const cache = isSkel ? initSkeletonSpriteCache() : initGoblinSpriteCache();
    const isAttacking = ((enemy as any).attackCooldown ?? 99) < 8;
    let url: string;
    if (isAttacking) {
      url = cache.attack[Math.min((enemy as any).attackCooldown ?? 0, cache.attack.length - 1)];
    } else {
      const offset = Math.floor(Math.abs(enemy.x) * 3);
      const idleCount = isSkel ? SKEL_IDLE_FRAME_COUNT : GOBLIN_IDLE_FRAMES;
      const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % idleCount;
      url = cache.idle[idleIndex];
    }
    const vbX = isSkel ? SKEL_VB_X : -14;
    const vbY = isSkel ? SKEL_VB_Y : -16;
    const vbW = isSkel ? SKEL_VB_W : 48;
    const vbH = isSkel ? SKEL_VB_H : 48;
    currentAlive.set(`e${enemy.id}`, {
      x: enemy.x, y: enemy.y + ((enemy as any).lane || 0) + WORLD_Y_OFFSET,
      spriteUrl: url, vbX, vbY, vbW, vbH,
      isEnemy: true,
    });
  }

  // Track all other enemy types for death explosions
  const trackEnemy = (prefix: string, e: any, url: string, vbX: number, vbY: number, vbW: number, vbH: number) => {
    currentAlive.set(`${prefix}${e.id}`, {
      x: e.x, y: e.y + (e.lane || 0) + WORLD_Y_OFFSET,
      spriteUrl: url, vbX, vbY, vbW, vbH,
      isEnemy: true,
    });
  };

  for (const a of (game as any).enemyArchers || []) {
    if (a.health <= 0 || a.x < deathCullL || a.x > deathCullR) continue;
    const c = initArcherSpriteCache();
    trackEnemy('ea', a, selectIdleFrame(c, frame, a.x), ARCHER_VB_X, ARCHER_VB_Y, ARCHER_VB_W, ARCHER_VB_H);
  }
  for (const w of (game as any).enemyWraiths || []) {
    if (w.health <= 0 || w.x < deathCullL || w.x > deathCullR) continue;
    const c = initWraithSpriteCache();
    trackEnemy('ew', w, selectIdleFrame(c, frame, w.x), WRAITH_VB_X, WRAITH_VB_Y, WRAITH_VB_W, WRAITH_VB_H);
  }
  for (const h of (game as any).enemyHounds || []) {
    if (h.health <= 0 || h.x < deathCullL || h.x > deathCullR) continue;
    const c = initHoundSpriteCache();
    trackEnemy('eh', h, selectIdleFrame(c, frame, h.x), HOUND_VB_X, HOUND_VB_Y, HOUND_VB_W, HOUND_VB_H);
  }
  for (const l of (game as any).enemyLichs || []) {
    if (l.health <= 0 || l.x < deathCullL || l.x > deathCullR) continue;
    const c = initLichSpriteCache();
    trackEnemy('el', l, selectIdleFrame(c, frame, l.x), LICH_VB_X, LICH_VB_Y, LICH_VB_W, LICH_VB_H);
  }
  for (const s of (game as any).enemyShadowAssassins || []) {
    if (s.health <= 0 || s.x < deathCullL || s.x > deathCullR) continue;
    const c = initShadowAssassinSpriteCache();
    trackEnemy('es', s, selectIdleFrame(c, frame, s.x), SHADOW_VB_X, SHADOW_VB_Y, SHADOW_VB_W, SHADOW_VB_H);
  }
  for (const fc of (game as any).enemyFlameCallers || []) {
    if (fc.health <= 0 || fc.x < deathCullL || fc.x > deathCullR) continue;
    const c = initFlameCallerSpriteCache();
    trackEnemy('efc', fc, selectIdleFrame(c, frame, fc.x), FLAME_VB_X, FLAME_VB_Y, FLAME_VB_W, FLAME_VB_H);
  }
  for (const cs of (game as any).enemyCorruptedSentinels || []) {
    if (cs.health <= 0 || cs.x < deathCullL || cs.x > deathCullR) continue;
    const c = initCorruptedSentinelSpriteCache();
    trackEnemy('ecs', cs, selectIdleFrame(c, frame, cs.x), SENTINEL_VB_X, SENTINEL_VB_Y, SENTINEL_VB_W, SENTINEL_VB_H);
  }
  for (const dr of (game as any).enemyDungeonRats || []) {
    if (dr.health <= 0 || dr.x < deathCullL || dr.x > deathCullR) continue;
    const c = initDungeonRatSpriteCache();
    trackEnemy('edr', dr, selectIdleFrame(c, frame, dr.x), RAT_VB_X, RAT_VB_Y, RAT_VB_W, RAT_VB_H);
  }
  for (const fi of (game as any).enemyFireImps || []) {
    if (fi.health <= 0 || fi.x < deathCullL || fi.x > deathCullR) continue;
    const c = initFireImpSpriteCache();
    trackEnemy('efi', fi, selectIdleFrame(c, frame, fi.x), IMP_VB_X, IMP_VB_Y, IMP_VB_W, IMP_VB_H);
  }
  for (const ck of (game as any).enemyCursedKnights || []) {
    if (ck.health <= 0 || ck.x < deathCullL || ck.x > deathCullR) continue;
    const c = initCursedKnightSpriteCache();
    trackEnemy('eck', ck, selectIdleFrame(c, frame, ck.x), KNIGHT_VB_X, KNIGHT_VB_Y, KNIGHT_VB_W, KNIGHT_VB_H);
  }

  // Detect who died
  for (const [id, tracked] of prevAliveUnits) {
    if (!currentAlive.has(id)) {
      // Check if killed by a crit — look for nearby isCrit particles (age < 15 frames, within 40px)
      let wasCrit = false;
      for (const p of game.particles) {
        if (p.isCrit && p.age < 15 && Math.abs(p.x - tracked.x) < 40 && Math.abs(p.y - tracked.y) < 40) {
          wasCrit = true;
          break;
        }
      }
      spawnExplosion(tracked, wasCrit ? 2.0 : 1.0);
    }
  }

  prevAliveUnits.clear();
  for (const [id, tracked] of currentAlive) {
    prevAliveUnits.set(id, tracked);
  }
}

function updateAndDrawExplosions(ctx: CanvasRenderingContext2D, camX: number) {
  // Physics update — swap-and-pop removal to avoid O(n²) splice
  let len = explosionFragments.length;
  for (let i = len - 1; i >= 0; i--) {
    const f = explosionFragments[i];
    f.vy += FRAG_GRAVITY;
    f.x += f.vx;
    f.y += f.vy;
    f.angle += f.angularVel;
    f.age++;

    // Ground collision — bounce once
    if (f.y > f.groundY && !f.bounced) {
      f.y = f.groundY;
      f.vy = -f.vy * 0.3;
      f.vx *= 0.5;
      f.angularVel *= 0.3;
      f.bounced = true;
    }
    if (f.y > f.groundY && f.bounced) {
      f.y = f.groundY;
      f.vy = 0;
      f.vx *= 0.9;
      f.angularVel *= 0.85;
    }

    // Remove expired — swap with last element
    if (f.age >= FRAG_MAX_AGE) {
      explosionFragments[i] = explosionFragments[--len];
    }
  }
  explosionFragments.length = len;

  // Cap total
  if (explosionFragments.length > FRAG_MAX_TOTAL) {
    explosionFragments.splice(0, explosionFragments.length - FRAG_MAX_TOTAL);
  }

  // Draw (skip off-screen fragments)
  for (const f of explosionFragments) {
    const sx = f.x - camX;
    if (sx < -60 || sx > VIEWPORT_W + 60) continue;
    const lifeRatio = f.age / FRAG_MAX_AGE;
    const opacity = Math.max(0, 1 - lifeRatio);
    // Body parts stay visible longer, fade in last 40%
    const fadeOp = f.img
      ? (lifeRatio > 0.6 ? opacity * (1 - (lifeRatio - 0.6) / 0.4) * 2 : opacity)
      : opacity; // sparks fade linearly

    ctx.save();
    ctx.globalAlpha = Math.max(0, fadeOp);
    ctx.translate(sx + f.drawW / 2, f.y + f.drawH / 2);
    ctx.rotate(f.angle * Math.PI / 180);

    if (f.img) {
      // Sprite body part — draw sub-region of the original sprite
      ctx.drawImage(
        f.img,
        f.srcX, f.srcY, f.srcW, f.srcH,
        -f.drawW / 2, -f.drawH / 2, f.drawW, f.drawH,
      );
    } else {
      // Spark particle — bright shrinking dot
      ctx.fillStyle = f.color;
      const sparkSize = f.drawW * (1 - lifeRatio * 0.8);
      ctx.fillRect(-sparkSize / 2, -sparkSize / 2, sparkSize, sparkSize);
    }

    ctx.restore();
  }
}

// --- Image cache: blob URL → loaded HTMLImageElement ---
const imageCache = new Map<string, HTMLImageElement>();
const pendingLoads = new Set<string>();

function getImage(url: string): HTMLImageElement | null {
  if (!url) return null;
  const cached = imageCache.get(url);
  if (cached) return cached;
  if (pendingLoads.has(url)) return null;

  pendingLoads.add(url);
  const img = new Image();
  img.onload = () => {
    imageCache.set(url, img);
    pendingLoads.delete(url);
  };
  img.onerror = () => pendingLoads.delete(url);
  img.src = url;
  return null;
}

const IDLE_TICKS_PER_FRAME = 25;

// --- Pre-load all cached sprite images ---
export function preloadSprites(heroClass: string): void {
  const goblinCache = initGoblinSpriteCache();
  const heroCache = initHeroSpriteCache(heroClass);
  const allyCache = initAllySpriteCache();
  const skelCache = initSkeletonSpriteCache();

  const loadAll = (urls: string[]) => { for (const u of urls) getImage(u); };
  loadAll([...goblinCache.idle, ...goblinCache.attack]);
  loadAll([...heroCache.idle, ...heroCache.attack]);
  loadAll([...skelCache.idle, ...skelCache.attack]);
  for (const key of Object.keys(allyCache)) {
    const set = (allyCache as any)[key];
    if (set?.idle) loadAll([...set.idle, ...set.attack]);
  }

  // Preload all enemy type caches
  const loadEnemyCache = (c: { idle: string[]; attack: string[]; lunge?: string; recovery?: string; cloakedIdle?: string[]; casting?: string[] }) => {
    loadAll([...c.idle, ...c.attack]);
    if (c.lunge) getImage(c.lunge);
    if (c.recovery) getImage(c.recovery);
    if (c.cloakedIdle) loadAll(c.cloakedIdle);
    if (c.casting) loadAll(c.casting);
  };
  loadEnemyCache(initArcherSpriteCache());
  loadEnemyCache(initWraithSpriteCache());
  loadEnemyCache(initHoundSpriteCache());
  loadEnemyCache(initLichSpriteCache());
  loadEnemyCache(initShadowAssassinSpriteCache());
  loadEnemyCache(initCorruptedSentinelSpriteCache());
  loadEnemyCache(initDungeonRatSpriteCache());
  loadEnemyCache(initFireImpSpriteCache());
  loadEnemyCache(initCursedKnightSpriteCache());
  loadEnemyCache(initFlameCallerSpriteCache());
}

// --- Health bar drawing ---
function drawHealthBar(
  ctx: CanvasRenderingContext2D,
  dx: number, dy: number,
  barW: number, barH: number,
  hp: number, maxHp: number,
  fillColor: string,
  showNumbers: boolean,
) {
  const ratio = Math.max(0, hp / maxHp);

  // Background
  ctx.fillStyle = COLORS.healthBg;
  ctx.beginPath();
  roundRect(ctx, dx, dy, barW, barH, 1);
  ctx.fill();

  // Fill
  const fillW = Math.max(0, (barW - 2) * ratio);
  if (fillW > 0) {
    ctx.fillStyle = fillColor;
    ctx.beginPath();
    roundRect(ctx, dx + 1, dy + 1, fillW, barH - 2, 1);
    ctx.fill();
  }

  // Numbers
  if (showNumbers) {
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillText(`${hp}/${maxHp}`, dx + barW / 2, dy - 2);
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
}

// --- Drop shadow under units ---
function drawShadow(ctx: CanvasRenderingContext2D, cx: number, groundY: number, rx: number, ry: number, opacity = 0.2) {
  ctx.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  ctx.beginPath();
  ctx.ellipse(cx, groundY, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

// --- Hit flash overlay ---
function drawHitFlash(ctx: CanvasRenderingContext2D, dx: number, dy: number, w: number, h: number, opacity: number) {
  ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
  ctx.fillRect(dx, dy, w, h);
}

// --- Draw a cached sprite image ---
function drawSprite(
  ctx: CanvasRenderingContext2D,
  url: string,
  dx: number, dy: number,
  vbX: number, vbY: number, vbW: number, vbH: number,
  scale = 1,
) {
  const img = getImage(url);
  if (!img) return;
  const sx = dx + vbX * scale;
  const sy = dy + vbY * scale;
  const sw = vbW * scale;
  const sh = vbH * scale;
  ctx.drawImage(img, sx, sy, sw, sh);
}

// ============================================================
// ENTITY DRAW FUNCTIONS
// ============================================================

function drawHero(
  ctx: CanvasRenderingContext2D,
  hero: GameState['hero'],
  camX: number,
  frame: number,
  heroClass: string,
  hideHealth?: boolean,
) {
  const cache = initHeroSpriteCache(heroClass);
  const justSwung = hero.isAttacking && hero.attackCooldown < 6;
  const lungeX = justSwung ? Math.sin((1 - hero.attackCooldown / 5) * Math.PI) * 3 : 0;

  // Select frame
  let spriteUrl: string;
  if (justSwung) {
    spriteUrl = cache.attack[Math.min(hero.attackCooldown, cache.attack.length - 1)];
  } else {
    const offset = Math.floor(Math.abs(hero.x) * 3);
    const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % HERO_IDLE_FRAME_COUNT;
    spriteUrl = cache.idle[idleIndex];
  }

  const dx = hero.x + lungeX - camX;
  const dy = hero.y + WORLD_Y_OFFSET;

  // Drop shadow
  drawShadow(ctx, dx + 16, dy + GROUND_Y - hero.y + 2, 12, 3, 0.22);

  drawSprite(ctx, spriteUrl, dx, dy, cache.vbX, cache.vbY, cache.vbW, cache.vbH);

  // Sword slash trail during attack peak (frames 0-2)
  if (justSwung && hero.attackCooldown < 3) {
    ctx.save();
    ctx.globalAlpha = 0.35 - hero.attackCooldown * 0.1;
    ctx.strokeStyle = '#ffffffcc';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    const slashProgress = 1 - hero.attackCooldown / 2;
    const startAngle = -0.8 + slashProgress * 1.5;
    const endAngle = startAngle + 1.2;
    ctx.beginPath();
    ctx.arc(dx + 24, dy - 2, 18, startAngle, endAngle);
    ctx.stroke();
    // Inner glow
    ctx.strokeStyle = '#ffeedd88';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(dx + 24, dy - 2, 15, startAngle + 0.1, endAngle - 0.1);
    ctx.stroke();
    ctx.restore();
  }

  // Hit flash
  const timeSinceHit = frame - (hero.lastDamageTime || 0);
  const recentlyHit = (hero.lastDamageTime || 0) > 0 && timeSinceHit >= 0 && timeSinceHit < 12;
  if (recentlyHit) {
    drawHitFlash(ctx, dx - 8, dy - 18, 52, 58, 0.1);
  }

  // Health bar
  if (!hideHealth) {
    const hpColor = hero.health > hero.maxHealth * 0.3 ? COLORS.healthGreen : COLORS.healthRed;
    drawHealthBar(ctx, dx - 2, dy - 24, 36, 7, hero.health, hero.maxHealth, hpColor, true);
  }
}

function drawAlly(
  ctx: CanvasRenderingContext2D,
  ally: any,
  camX: number,
  frame: number,
  showHpNumbers: boolean,
  isColosseum: boolean,
) {
  const allyCache = initAllySpriteCache();
  const unitType = ally.unitType || 'soldier';
  const cacheKey = unitType === 'apprentice' ? 'wizard' : unitType;
  const sprites = (allyCache as any)[cacheKey] || allyCache.soldier;

  const isAttacking = (ally.attackCooldown ?? 99) < 10;

  let spriteUrl: string;
  if (isAttacking) {
    const atkIndex = Math.min(
      Math.floor((1 - (ally.attackCooldown ?? 0) / 10) * sprites.attack.length),
      sprites.attack.length - 1,
    );
    spriteUrl = sprites.attack[Math.max(0, atkIndex)];
  } else {
    const offset = Math.floor(Math.abs(ally.x) * 3);
    const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % ALLY_IDLE_FRAME_COUNT;
    spriteUrl = sprites.idle[idleIndex];
  }

  const ay = ally.y + (ally.lane || 0);
  const giantScale = ally.isGiant ? 1.4 : 1;
  const colosseumScale = isColosseum ? 2 : 1;
  const totalScale = giantScale * colosseumScale;

  const dx = ally.x - camX;
  const dy = ay + WORLD_Y_OFFSET;

  // Drop shadow (before scaling so it stays on ground)
  drawShadow(ctx, dx + 10, dy + 20, 7 * giantScale, 2.5 * giantScale, 0.18);

  ctx.save();
  if (totalScale !== 1) {
    ctx.translate(dx, dy);
    ctx.scale(totalScale, totalScale);
    ctx.translate(-dx, -dy);
  }

  // Protection shield glow
  if ((ally.protectionTimer || 0) > 0) {
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    ctx.ellipse(dx + 10, dy + 5, 12, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffd700';
    ctx.globalAlpha = 0.07;
    ctx.beginPath();
    ctx.ellipse(dx + 10, dy + 5, 10, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSprite(ctx, spriteUrl, dx, dy, ALLY_VB_X, ALLY_VB_Y, ALLY_VB_W, ALLY_VB_H);

  // Royal Guard crown
  if (ally.isRoyalGuard && unitType === 'archer') {
    ctx.fillStyle = '#ffd700';
    ctx.beginPath();
    ctx.moveTo(dx + 2, dy - 16);
    ctx.lineTo(dx + 5, dy - 12);
    ctx.lineTo(dx + 8, dy - 15);
    ctx.lineTo(dx + 10, dy - 12);
    ctx.lineTo(dx + 12, dy - 15);
    ctx.lineTo(dx + 15, dy - 12);
    ctx.lineTo(dx + 18, dy - 16);
    ctx.lineTo(dx + 18, dy - 12);
    ctx.lineTo(dx + 2, dy - 12);
    ctx.closePath();
    ctx.fill();
    // Ruby
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(dx + 6, dy - 15, 2, 2);
  }

  // Hit flash
  const timeSinceHit = frame - (ally.lastDamageTime || 0);
  const recentlyHit = (ally.lastDamageTime || 0) > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  if (recentlyHit) {
    drawHitFlash(ctx, dx - 4, dy - 8, 28, 36, 0.12);
  }

  // Health bar
  const stats = UNIT_STATS[unitType as keyof typeof UNIT_STATS] as any;
  const baseColor: string = ally.isRoyalGuard ? '#ffd700' : (stats?.color || '#4a7fff');
  drawHealthBar(ctx, dx, dy - 12, 20, 4, ally.health, ally.maxHealth, baseColor, showHpNumbers);

  ctx.restore();
}

function drawGoblinOrSkeleton(
  ctx: CanvasRenderingContext2D,
  enemy: any,
  camX: number,
  frame: number,
  showHpNumbers: boolean,
  isSkeleton: boolean,
  isColosseum: boolean,
) {
  const cache = isSkeleton ? initSkeletonSpriteCache() : initGoblinSpriteCache();
  const vbX = isSkeleton ? SKEL_VB_X : -14;
  const vbY = isSkeleton ? SKEL_VB_Y : -16;
  const vbW = isSkeleton ? SKEL_VB_W : 48;
  const vbH = isSkeleton ? SKEL_VB_H : 48;
  const idleFrameCount = isSkeleton ? SKEL_IDLE_FRAME_COUNT : GOBLIN_IDLE_FRAMES;

  const isAttacking = (enemy.attackCooldown ?? 99) < 8;

  let spriteUrl: string;
  if (isAttacking) {
    spriteUrl = cache.attack[Math.min(enemy.attackCooldown ?? 0, cache.attack.length - 1)];
  } else {
    const offset = Math.floor(Math.abs(enemy.x) * 3);
    const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % idleFrameCount;
    spriteUrl = cache.idle[idleIndex];
  }

  const ey = enemy.y + (enemy.lane || 0);
  const dx = enemy.x - camX;
  const dy = ey + WORLD_Y_OFFSET;

  // Drop shadow
  drawShadow(ctx, dx + 12, dy + 20, isSkeleton ? 7 : 8, 2.5, isSkeleton ? 0.12 : 0.18);

  ctx.save();
  if (isColosseum) {
    ctx.translate(dx, dy);
    ctx.scale(2, 2);
    ctx.translate(-dx, -dy);
  }

  drawSprite(ctx, spriteUrl, dx, dy, vbX, vbY, vbW, vbH);

  // Attack flash (sword)
  if (isAttacking && (enemy.attackCooldown ?? 99) < 3) {
    ctx.strokeStyle = isSkeleton ? '#8f8' : '#ff8';
    ctx.lineWidth = 2;
    ctx.globalAlpha = isSkeleton ? 0.5 : 0.6;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(dx - 4, dy - 6);
    ctx.lineTo(dx - 10, dy + 6);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Hit flash
  const timeSinceHit = frame - (enemy.lastDamageTime || 0);
  const recentlyHit = (enemy.lastDamageTime || 0) > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  if (recentlyHit) {
    drawHitFlash(ctx, dx - 4, dy - 6, 32, 34, isSkeleton ? 0.12 : 0.15);
  }

  // Elite glow (goblins only)
  if (!isSkeleton && enemy.isElite) {
    ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';
    ctx.beginPath();
    ctx.arc(dx + 12, dy + 10, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Skeleton necromantic aura
  if (isSkeleton) {
    ctx.fillStyle = 'rgba(68, 255, 68, 0.04)';
    ctx.beginPath();
    ctx.arc(dx + 12, dy + 5, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bleed indicator
  const bleedStacks = enemy.bleedStacks ?? 0;
  if (bleedStacks > 0) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff0000';
    const bleedText = bleedStacks > 1 ? `\u{1FA78}${bleedStacks}` : '\u{1FA78}';
    ctx.fillText(bleedText, dx + 12, dy - 16);
  }

  // Slow debuff overlay
  if ((enemy.slowTimer || 0) > 0) {
    ctx.fillStyle = '#4488ff';
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(dx + 12, dy + 12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#88ccff';
    ctx.fillText('SLOW', dx + 12, dy - 14);
    ctx.globalAlpha = 1;
  }

  // Burn debuff overlay
  if ((enemy.burnTimer || 0) > 0) {
    ctx.fillStyle = '#ff6600';
    ctx.globalAlpha = 0.06 + Math.sin(frame * 0.15) * 0.03;
    ctx.beginPath();
    ctx.arc(dx + 12, dy + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8844';
    ctx.fillText('BURN', dx + 12, dy + 30);
    ctx.globalAlpha = 1;
  }

  // Health bar
  const hpColor = isSkeleton ? '#aaaaaa' : COLORS.healthRed;
  drawHealthBar(ctx, dx, dy - 10, 24, 5, enemy.health, enemy.maxHealth, hpColor, showHpNumbers);

  ctx.restore();
}

// --- Generic cached-sprite enemy draw ---
function drawCachedEnemy(
  ctx: CanvasRenderingContext2D,
  enemy: any,
  camX: number,
  frame: number,
  showHpNumbers: boolean,
  spriteUrl: string,
  vbX: number, vbY: number, vbW: number, vbH: number,
  hpColor: string,
  hpBarY: number,
  hpBarW: number,
  isColosseum: boolean,
) {
  const ey = enemy.y + (enemy.lane || 0);
  const dx = enemy.x - camX;
  const dy = ey + WORLD_Y_OFFSET;

  ctx.save();
  if (isColosseum) {
    ctx.translate(dx, dy);
    ctx.scale(2, 2);
    ctx.translate(-dx, -dy);
  }

  drawSprite(ctx, spriteUrl, dx, dy, vbX, vbY, vbW, vbH);

  // Hit flash
  const timeSinceHit = frame - (enemy.lastDamageTime || 0);
  const recentlyHit = (enemy.lastDamageTime || 0) > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  if (recentlyHit) {
    drawHitFlash(ctx, dx + vbX, dy + vbY, vbW, vbH, 0.12);
  }

  // Elite glow
  if (enemy.isElite) {
    ctx.fillStyle = 'rgba(255, 68, 68, 0.1)';
    ctx.beginPath();
    ctx.arc(dx + vbW / 2 + vbX, dy + vbH / 2 + vbY, 18, 0, Math.PI * 2);
    ctx.fill();
  }

  // Slow debuff
  if ((enemy.slowTimer || 0) > 0) {
    ctx.fillStyle = '#4488ff';
    ctx.globalAlpha = 0.12;
    ctx.beginPath();
    ctx.arc(dx + 12, dy + 12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.8;
    ctx.font = 'bold 8px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#88ccff';
    ctx.fillText('SLOW', dx + 12, dy - 14);
    ctx.globalAlpha = 1;
  }

  // Burn debuff
  if ((enemy.burnTimer || 0) > 0) {
    ctx.fillStyle = '#ff6600';
    ctx.globalAlpha = 0.06 + Math.sin(frame * 0.15) * 0.03;
    ctx.beginPath();
    ctx.arc(dx + 12, dy + 12, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.font = '6px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff8844';
    ctx.fillText('BURN', dx + 12, dy + 30);
    ctx.globalAlpha = 1;
  }

  // Bleed indicator
  const bleedStacks = enemy.bleedStacks ?? 0;
  if (bleedStacks > 0) {
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ff0000';
    const bleedText = bleedStacks > 1 ? `\u{1FA78}${bleedStacks}` : '\u{1FA78}';
    ctx.fillText(bleedText, dx + 12, dy - 16);
  }

  // Health bar
  drawHealthBar(ctx, dx, dy + hpBarY, hpBarW, 5, enemy.health, enemy.maxHealth, hpColor, showHpNumbers);

  ctx.restore();
}

// --- Frame selection helpers ---
function selectIdleFrame(cache: { idle: string[] }, frame: number, enemyX: number): string {
  const offset = Math.floor(Math.abs(enemyX) * 3);
  const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % ENEMY_IDLE_FRAME_COUNT;
  return cache.idle[idleIndex];
}

function drawParticle(
  ctx: CanvasRenderingContext2D,
  p: { x: number; y: number; text: string; color: string; age: number; driftX: number; isCrit?: boolean },
  camX: number,
) {
  const opacity = Math.max(0, 1 - p.age / 90);
  if (opacity <= 0) return;

  const dx = p.x + p.age * p.driftX - camX;
  const dy = p.y - p.age * 0.5 + WORLD_Y_OFFSET;

  ctx.globalAlpha = opacity;
  ctx.fillStyle = p.isCrit ? '#ffdd00' : p.color;
  ctx.font = p.isCrit ? 'bold 16px monospace' : 'bold 12px monospace';
  ctx.textAlign = 'start';
  ctx.fillText(p.text, dx, dy);
  ctx.globalAlpha = 1;
}

// ============================================================
// MAIN DRAW ENTRY POINT
// ============================================================

export function drawEntities(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  camX: number,
  frame: number,
  showHpNumbers: boolean,
  heroClass: string,
  killParticles: boolean = true,
  tileCache?: TileCache,
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.save();
  // Derive scale from buffer size — fixed at mount, immune to browser zoom changes
  const scaleX = ctx.canvas.width / VIEWPORT_W;
  ctx.scale(scaleX, scaleX);

  // Pixel-art crisp rendering
  ctx.imageSmoothingEnabled = false;

  // --- Environment (sky, mountains, treeline, ground) ---
  if (tileCache) {
    drawEnvironment(ctx, camX, frame, game.currentZone, game.inDungeon || false, (game as any).dungeonType, tileCache);
  }

  // --- World objects (flags, chests, boss, barricades, portals) ---
  drawWorldObjects(ctx, game, camX, frame);

  // Detect deaths and spawn explosions BEFORE drawing alive units (throttled to every 2nd frame)
  if (killParticles && (frame & 1) === 0) detectDeaths(game, frame, heroClass);

  const cullLeft = camX - 50;
  const cullRight = camX + VIEWPORT_W + 50;
  const isColosseum = game.challengeId === 'colosseum';

  // --- Explosions (behind alive units) ---
  if (killParticles) updateAndDrawExplosions(ctx, camX);

  // --- Aura indicators (behind units, on ground plane) ---
  if (game.hero.health > 0) {
    const hx = game.hero.x + 16 - camX;
    const groundAuraY = GROUND_Y + WORLD_Y_OFFSET + 4;
    const t = frame * 0.03;
    const heroSkills = (game as any).heroSkills;
    const equipped: string[] = heroSkills?.equippedSkills || [];

    // Heroic Presence aura
    if (equipped.includes('heroicPresence')) {
      const pulse = 0.04 + Math.sin(t) * 0.02;
      ctx.fillStyle = '#ff6644';
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.ellipse(hx, groundAuraY, 120, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ff6644';
      ctx.lineWidth = 1;
      ctx.globalAlpha = 0.12 + Math.sin(t) * 0.06;
      ctx.beginPath();
      ctx.ellipse(hx, groundAuraY, 120, 8, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    // Pathfinder aura
    if (equipped.includes('pathfinder')) {
      const pulse = 0.04 + Math.sin(t + 1.8) * 0.02;
      ctx.fillStyle = '#44ff88';
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.ellipse(hx, groundAuraY, 120, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Intimidate aura
    if (equipped.includes('intimidate')) {
      const pulse = 0.04 + Math.sin(t + 3.6) * 0.02;
      ctx.fillStyle = '#aa66ff';
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.ellipse(hx, groundAuraY, 150, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Command artifact aura
    if ((game.artifacts || []).some(a => a.id === 'command')) {
      const pulse = 0.04 + Math.sin(t + 5.4) * 0.02;
      ctx.fillStyle = '#ffd700';
      ctx.globalAlpha = pulse;
      ctx.beginPath();
      ctx.ellipse(hx, groundAuraY, 30, 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // --- Allies (cached sprites only) ---
  for (const ally of game.allies || []) {
    if (ally.health <= 0 || ally.x < cullLeft || ally.x > cullRight) continue;
    // Skip special inline types — they stay SVG
    if ((ally as any).isPet || (ally as any).isFriendlySlime || (ally as any).isCourier) continue;
    drawAlly(ctx, ally, camX, frame, showHpNumbers, isColosseum);
  }

  // --- Enemies (goblins + skeletons) ---
  for (const enemy of game.enemies || []) {
    if (enemy.health <= 0 || enemy.x < cullLeft || enemy.x > cullRight) continue;
    const isSkeleton = !!(enemy as any).isLichSkeleton;
    drawGoblinOrSkeleton(ctx, enemy, camX, frame, showHpNumbers, isSkeleton, isColosseum);
  }

  // --- Enemy Archers ---
  for (const archer of (game as any).enemyArchers || []) {
    if (archer.health <= 0 || archer.x < cullLeft || archer.x > cullRight) continue;
    const cache = initArcherSpriteCache();
    const isAttacking = (archer.attackCooldown ?? 99) < 10;
    const url = isAttacking
      ? cache.attack[Math.min(9 - (archer.attackCooldown ?? 0), cache.attack.length - 1)]
      : selectIdleFrame(cache, frame, archer.x);
    drawCachedEnemy(ctx, archer, camX, frame, showHpNumbers, url,
      ARCHER_VB_X, ARCHER_VB_Y, ARCHER_VB_W, ARCHER_VB_H,
      '#ffaa00', -12, 24, isColosseum);
  }

  // --- Enemy Wraiths ---
  for (const wraith of (game as any).enemyWraiths || []) {
    if (wraith.health <= 0 || wraith.x < cullLeft || wraith.x > cullRight) continue;
    const cache = initWraithSpriteCache();
    const isAttacking = (wraith.attackCooldown ?? 99) < 10;
    const url = isAttacking
      ? cache.attack[Math.min(9 - (wraith.attackCooldown ?? 0), cache.attack.length - 1)]
      : selectIdleFrame(cache, frame, wraith.x);
    drawCachedEnemy(ctx, wraith, camX, frame, showHpNumbers, url,
      WRAITH_VB_X, WRAITH_VB_Y, WRAITH_VB_W, WRAITH_VB_H,
      '#8844aa', -14, 30, isColosseum);
  }

  // --- Enemy Hounds ---
  for (const hound of (game as any).enemyHounds || []) {
    if (hound.health <= 0 || hound.x < cullLeft || hound.x > cullRight) continue;
    const cache = initHoundSpriteCache();
    const isLunging = (hound.lungeTimer || 0) > 0;
    const isRecovering = (hound.recoveryTimer || 0) > 0;
    const url = isLunging ? cache.lunge!
      : isRecovering ? cache.recovery!
      : selectIdleFrame(cache, frame, hound.x);
    drawCachedEnemy(ctx, hound, camX, frame, showHpNumbers, url,
      HOUND_VB_X, HOUND_VB_Y, HOUND_VB_W, HOUND_VB_H,
      '#cc4400', -8, 24, isColosseum);
  }

  // --- Enemy Lichs ---
  for (const lich of (game as any).enemyLichs || []) {
    if (lich.health <= 0 || lich.x < cullLeft || lich.x > cullRight) continue;
    const cache = initLichSpriteCache();
    const isCastingIce = (lich.iceballCooldown ?? 0) >= 250;
    const isCastingHeal = !isCastingIce && (lich.healCooldown ?? 0) >= 200;
    const isCasting = isCastingIce || isCastingHeal;
    const url = isCasting && cache.casting
      ? cache.casting[Math.min(Math.floor((isCastingIce ? ((lich.iceballCooldown ?? 0) - 250) / 13 : ((lich.healCooldown ?? 0) - 200) / 10)), cache.casting.length - 1)]
      : selectIdleFrame(cache, frame, lich.x);
    drawCachedEnemy(ctx, lich, camX, frame, showHpNumbers, url,
      LICH_VB_X, LICH_VB_Y, LICH_VB_W, LICH_VB_H,
      '#44cc44', -12, 30, isColosseum);
  }

  // --- Shadow Assassins ---
  for (const sa of (game as any).enemyShadowAssassins || []) {
    if (sa.health <= 0 || sa.x < cullLeft || sa.x > cullRight) continue;
    const cache = initShadowAssassinSpriteCache();
    const isCloaked = (sa.stealthTimer || 0) > 0;
    const isAttacking = (sa.attackCooldown ?? 99) < 8;
    const url = isAttacking
      ? cache.attack[Math.min(7 - (sa.attackCooldown ?? 0), cache.attack.length - 1)]
      : isCloaked && cache.cloakedIdle
      ? cache.cloakedIdle[Math.floor((frame + Math.floor(Math.abs(sa.x) * 3)) / IDLE_TICKS_PER_FRAME) % ENEMY_IDLE_FRAME_COUNT]
      : selectIdleFrame(cache, frame, sa.x);
    drawCachedEnemy(ctx, sa, camX, frame, showHpNumbers, url,
      SHADOW_VB_X, SHADOW_VB_Y, SHADOW_VB_W, SHADOW_VB_H,
      '#aa44ff', -8, 24, isColosseum);
  }

  // --- Flame Callers ---
  for (const fc of (game as any).enemyFlameCallers || []) {
    if (fc.health <= 0 || (fc.x < cullLeft && !(fc.isCasting && fc.castTargetX >= cullLeft)) || fc.x > cullRight) continue;
    const cache = initFlameCallerSpriteCache();
    const url = fc.isCasting && cache.casting
      ? cache.casting[Math.min(Math.floor((fc.castTimer ?? 0) / 68), cache.casting.length - 1)]
      : selectIdleFrame(cache, frame, fc.x);
    drawCachedEnemy(ctx, fc, camX, frame, showHpNumbers, url,
      FLAME_VB_X, FLAME_VB_Y, FLAME_VB_W, FLAME_VB_H,
      COLORS.healthRed, -10, 24, isColosseum);
  }

  // --- Corrupted Sentinels ---
  for (const cs of (game as any).enemyCorruptedSentinels || []) {
    if (cs.health <= 0 || cs.x < cullLeft || cs.x > cullRight) continue;
    const cache = initCorruptedSentinelSpriteCache();
    const isAttacking = (cs.attackCooldown ?? 99) < 12;
    const url = isAttacking
      ? cache.attack[Math.min(11 - (cs.attackCooldown ?? 0), cache.attack.length - 1)]
      : selectIdleFrame(cache, frame, cs.x);
    drawCachedEnemy(ctx, cs, camX, frame, showHpNumbers, url,
      SENTINEL_VB_X, SENTINEL_VB_Y, SENTINEL_VB_W, SENTINEL_VB_H,
      '#666699', -14, 32, isColosseum);
  }

  // --- Dungeon Rats ---
  for (const dr of (game as any).enemyDungeonRats || []) {
    if (dr.health <= 0 || dr.x < cullLeft || dr.x > cullRight) continue;
    const cache = initDungeonRatSpriteCache();
    const isAttacking = (dr.attackCooldown ?? 99) < 10;
    const url = isAttacking
      ? cache.attack[Math.min(9 - (dr.attackCooldown ?? 0), cache.attack.length - 1)]
      : selectIdleFrame(cache, frame, dr.x);
    drawCachedEnemy(ctx, dr, camX, frame, showHpNumbers, url,
      RAT_VB_X, RAT_VB_Y, RAT_VB_W, RAT_VB_H,
      '#aa6633', -6, 16, isColosseum);
  }

  // --- Fire Imps ---
  for (const fi of (game as any).enemyFireImps || []) {
    if (fi.health <= 0 || (fi.x < cullLeft && !(fi.isCasting && fi.castTargetX >= cullLeft)) || fi.x > cullRight) continue;
    const cache = initFireImpSpriteCache();
    const url = fi.isCasting && cache.casting
      ? cache.casting[Math.min(Math.floor((fi.castTimer ?? 0) / 20), cache.casting.length - 1)]
      : selectIdleFrame(cache, frame, fi.x);
    drawCachedEnemy(ctx, fi, camX, frame, showHpNumbers, url,
      IMP_VB_X, IMP_VB_Y, IMP_VB_W, IMP_VB_H,
      '#ff6633', -8, 20, isColosseum);
  }

  // --- Cursed Knights ---
  for (const ck of (game as any).enemyCursedKnights || []) {
    if (ck.health <= 0 || ck.x < cullLeft || ck.x > cullRight) continue;
    const cache = initCursedKnightSpriteCache();
    const isAttacking = (ck.attackCooldown ?? 99) < 12;
    const url = isAttacking
      ? cache.attack[Math.min(11 - (ck.attackCooldown ?? 0), cache.attack.length - 1)]
      : selectIdleFrame(cache, frame, ck.x);
    drawCachedEnemy(ctx, ck, camX, frame, showHpNumbers, url,
      KNIGHT_VB_X, KNIGHT_VB_Y, KNIGHT_VB_W, KNIGHT_VB_H,
      '#6644aa', -14, 24, isColosseum);
  }

  // --- Hero ---
  if (game.hero.health > 0) {
    drawHero(ctx, game.hero, camX, frame, heroClass);
  }

  // --- Projectiles ---
  drawProjectiles(ctx, game.projectiles || [], camX, cullLeft, cullRight);

  // --- In-flight cast visuals (flame callers + fire imps) ---
  drawCastingFireballs(ctx, game, camX, frame);

  // --- Particles ---
  for (const p of game.particles || []) {
    if (p.x < cullLeft || p.x > cullRight) continue;
    drawParticle(ctx, p, camX);
  }

  ctx.restore();
}

// ============================================================
// PROJECTILE CANVAS RENDERER
// ============================================================

function drawProjectiles(
  ctx: CanvasRenderingContext2D,
  projectiles: any[],
  camX: number,
  cullLeft: number,
  cullRight: number,
): void {
  for (const p of projectiles) {
    // Cull off-screen (wide margin for lasers/blasts)
    const px = p.x;
    const tx = p.targetX ?? px;
    const minX = Math.min(px, tx) - 60;
    const maxX = Math.max(px, tx) + 60;
    if (maxX < cullLeft || minX > cullRight) continue;

    const sx = px - camX;
    const sy = (p.y ?? GROUND_Y - 10) + WORLD_Y_OFFSET;

    switch (p.type) {
      case 'arrow':
        drawArrow(ctx, sx, sy, false);
        break;
      case 'allyArrow':
        drawArrow(ctx, sx, sy, true);
        break;
      case 'heroArrow':
        drawHeroArrow(ctx, sx, sy);
        break;
      case 'fireball':
        drawFireball(ctx, sx, sy);
        break;
      case 'iceball':
        drawIceball(ctx, sx, sy);
        break;
      case 'wizardBeam':
        drawWizardBeam(ctx, sx, sy);
        break;
      case 'boss':
        drawBossProjectile(ctx, sx, sy);
        break;
      case 'heroRanged':
        drawHeroRanged(ctx, sx, sy);
        break;
      case 'clericBolt':
        drawClericBolt(ctx, sx, sy);
        break;
      case 'clericChain':
        drawClericChain(ctx, sx, sy);
        break;
      case 'crystalBolt':
        drawCrystalBolt(ctx, sx, sy);
        break;
      case 'bombardShot':
        drawBombardShot(ctx, sx, sy, px);
        break;
      case 'laser':
        drawLaser(ctx, (p.targetX ?? px) - camX, p.radius || 50, p.duration ?? 30, '#44aa22', '#66cc44');
        break;
      case 'spectralBlast':
        drawLaser(ctx, (p.targetX ?? px) - camX, p.radius || 60, p.duration ?? 30, '#6622aa', '#8844cc');
        break;
      case 'meteorStrike':
        drawLaser(ctx, (p.targetX ?? px) - camX, p.radius || 120, p.duration ?? 60, '#ff4400', '#ff6600');
        break;
      case 'healBeam':
        drawVerticalBeam(ctx, sx, sy, p.duration ?? 30, '#4aff4a', '#aaffaa');
        break;
      case 'darkHeal':
        drawVerticalBeam(ctx, sx, sy, p.duration ?? 30, '#6622aa', '#aa55ff');
        break;
      case 'chainLightning':
        drawChainLightning(ctx, p.chainTargets, camX, p.duration ?? 30);
        break;
    }
  }
}

/** Draw in-flight fireball visuals for flame callers and fire imps during their cast phase */
function drawCastingFireballs(
  ctx: CanvasRenderingContext2D,
  game: any,
  camX: number,
  frame: number,
): void {
  const casters = [
    ...((game.enemyFlameCallers || []).map((fc: any) => ({ ...fc, castMax: 310, color: '#ff4400', glowColor: '#ff8800', size: 7 }))),
    ...((game.enemyFireImps || []).map((fi: any) => ({ ...fi, castMax: 120, color: '#ff6600', glowColor: '#ffaa00', size: 5 }))),
  ];

  for (const c of casters) {
    if (!c.isCasting || c.health <= 0 || !c.castTargetX) continue;
    const t = Math.min(1, (c.castTimer || 0) / c.castMax);
    // Fireball arcs from caster to target
    const startX = c.x - camX;
    const startY = (c.y || GROUND_Y - 20) + WORLD_Y_OFFSET;
    const endX = c.castTargetX - camX;
    const endY = (c.castTargetY || GROUND_Y - 10) + WORLD_Y_OFFSET;
    const fx = startX + (endX - startX) * t;
    const arcH = -60 * 4 * t * (t - 1); // parabolic arc
    const fy = startY + (endY - startY) * t - arcH;

    // Glow
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = c.glowColor;
    ctx.beginPath();
    ctx.arc(fx, fy, c.size + 4 + Math.sin(frame * 0.3) * 2, 0, Math.PI * 2);
    ctx.fill();
    // Core
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = c.color;
    ctx.beginPath();
    ctx.arc(fx, fy, c.size, 0, Math.PI * 2);
    ctx.fill();
    // Bright center
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#ffdd44';
    ctx.beginPath();
    ctx.arc(fx, fy, c.size * 0.4, 0, Math.PI * 2);
    ctx.fill();
    // Trail sparks
    ctx.globalAlpha = 0.4;
    for (let i = 1; i <= 3; i++) {
      const tt = Math.max(0, t - i * 0.06);
      const tx = startX + (endX - startX) * tt;
      const tArc = -60 * 4 * tt * (tt - 1);
      const ty = startY + (endY - startY) * tt - tArc;
      ctx.fillStyle = c.color;
      ctx.beginPath();
      ctx.arc(tx, ty, c.size * (0.6 - i * 0.12), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Target zone indicator (ground circle that grows as fireball approaches)
    if (t > 0.3) {
      const zoneAlpha = (t - 0.3) * 0.5;
      ctx.globalAlpha = zoneAlpha;
      ctx.strokeStyle = c.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(endX, endY + 5, 20 * t, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }
}

// --- Individual projectile draw helpers ---

function drawArrow(ctx: CanvasRenderingContext2D, x: number, y: number, isAlly: boolean): void {
  const dir = isAlly ? 1 : -1;
  const shaftColor = isAlly ? '#5a8b5a' : '#8b5a2a';
  const headColor = isAlly ? '#7f7' : '#666';
  // Shaft
  ctx.strokeStyle = shaftColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 15 * dir, y);
  ctx.stroke();
  // Arrowhead
  ctx.fillStyle = headColor;
  ctx.beginPath();
  ctx.moveTo(x, y - 3);
  ctx.lineTo(x - 6 * dir, y);
  ctx.lineTo(x, y + 3);
  ctx.closePath();
  ctx.fill();
}

function drawHeroArrow(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  // Shaft
  ctx.strokeStyle = '#6b4226';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 18, y);
  ctx.stroke();
  // Arrowhead
  ctx.fillStyle = '#aaa';
  ctx.beginPath();
  ctx.moveTo(x + 18, y - 3);
  ctx.lineTo(x + 24, y);
  ctx.lineTo(x + 18, y + 3);
  ctx.closePath();
  ctx.fill();
  // Fletching
  ctx.strokeStyle = '#4a8f3f';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x - 4, y - 4);
  ctx.moveTo(x + 2, y);
  ctx.lineTo(x - 2, y + 4);
  ctx.stroke();
}

function drawFireball(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#ff4400';
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff6600';
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffaa00';
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x - 3, y - 3, 2, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawIceball(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#4488cc';
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#88ccff';
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#bbddff';
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
}

function drawWizardBeam(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.8;
  ctx.strokeStyle = '#aa55ff';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y); ctx.stroke();
  ctx.strokeStyle = '#dd88ff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60, y); ctx.stroke();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#aa55ff';
  ctx.beginPath(); ctx.arc(x + 60, y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x + 60, y, 3, 0, Math.PI * 2); ctx.fill();
}

function drawBossProjectile(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#ff3333';
  ctx.beginPath(); ctx.arc(x, y, 8, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff6666';
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffaaaa';
  ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
}

function drawHeroRanged(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#4a9fff';
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#7abfff';
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#4a9fff';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(x - 8, y); ctx.lineTo(x - 2, y); ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawClericBolt(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#4aff4a';
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#aaffaa';
  ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
}

function drawClericChain(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#44ff88';
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#88ffbb';
  ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#44ff88';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x - 6, y - 2); ctx.lineTo(x - 2, y);
  ctx.moveTo(x - 6, y + 2); ctx.lineTo(x - 2, y);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawCrystalBolt(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#55ddcc';
  ctx.beginPath();
  ctx.moveTo(x, y - 5); ctx.lineTo(x - 3, y); ctx.lineTo(x, y + 5); ctx.lineTo(x + 3, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#88ffee';
  ctx.beginPath();
  ctx.moveTo(x, y - 3); ctx.lineTo(x - 2, y); ctx.lineTo(x, y + 3); ctx.lineTo(x + 2, y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(x, y, 2, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawBombardShot(ctx: CanvasRenderingContext2D, x: number, y: number, worldX: number): void {
  // Smoke trail (larger, more visible)
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#777';
  ctx.beginPath(); ctx.arc(x - 8, y + 3, 4, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#666';
  ctx.beginPath(); ctx.arc(x - 14, y + 5, 3, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.arc(x - 20, y + 6, 2.5, 0, Math.PI * 2); ctx.fill();
  // Cannonball (bigger)
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#555';
  ctx.beginPath(); ctx.arc(x, y, 7, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#888';
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.arc(x - 2, y - 2, 3, 0, Math.PI * 2); ctx.fill();
  // Fuse spark (brighter)
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#ff6600';
  ctx.beginPath(); ctx.arc(x + 4, y - 5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffdd00';
  ctx.beginPath(); ctx.arc(x + 5, y - 6, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawLaser(
  ctx: CanvasRenderingContext2D,
  targetX: number,
  radius: number,
  duration: number,
  color1: string,
  color2: string,
): void {
  const opacity = Math.min(1, duration / 15);
  const groundY = GROUND_Y + WORLD_Y_OFFSET;

  // Vertical beams
  ctx.globalAlpha = opacity * 0.3;
  ctx.strokeStyle = color1;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(targetX - 8, 0); ctx.lineTo(targetX - 8, groundY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(targetX + 8, 0); ctx.lineTo(targetX + 8, groundY); ctx.stroke();
  ctx.lineWidth = 1.5;
  ctx.globalAlpha = opacity * 0.25;
  ctx.beginPath(); ctx.moveTo(targetX - 15, 0); ctx.lineTo(targetX - 15, groundY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(targetX + 15, 0); ctx.lineTo(targetX + 15, groundY); ctx.stroke();
  ctx.globalAlpha = opacity * 0.6;
  ctx.strokeStyle = color2;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(targetX, 0); ctx.lineTo(targetX, groundY); ctx.stroke();

  // Impact zone
  ctx.globalAlpha = opacity * 0.25;
  ctx.fillStyle = color1;
  ctx.beginPath(); ctx.arc(targetX, groundY - 10, radius, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = opacity * 0.3;
  ctx.fillStyle = color2;
  ctx.beginPath(); ctx.arc(targetX, groundY - 10, radius * 0.6, 0, Math.PI * 2); ctx.fill();

  // Top glow
  ctx.globalAlpha = opacity * 0.4;
  ctx.fillStyle = color1;
  ctx.beginPath(); ctx.arc(targetX, 20, 12, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawVerticalBeam(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  duration: number,
  color1: string,
  color2: string,
): void {
  const opacity = Math.min(1, duration / 10);
  const top = y - 80;
  const bot = y + 10;

  ctx.globalAlpha = opacity * 0.4;
  ctx.strokeStyle = color1;
  ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();
  ctx.globalAlpha = opacity * 0.7;
  ctx.strokeStyle = color2;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();
  ctx.globalAlpha = opacity * 0.9;
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(x, top); ctx.lineTo(x, bot); ctx.stroke();

  ctx.globalAlpha = opacity * 0.3;
  ctx.fillStyle = color1;
  ctx.beginPath(); ctx.arc(x, y, 10, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = opacity * 0.5;
  ctx.fillStyle = color2;
  ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = opacity * 0.4;
  ctx.fillStyle = color1;
  ctx.beginPath(); ctx.arc(x, top, 6, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;
}

function drawChainLightning(
  ctx: CanvasRenderingContext2D,
  chainTargets: Array<{x: number, y: number}> | undefined,
  camX: number,
  duration: number,
): void {
  if (!chainTargets || chainTargets.length < 2) return;
  const opacity = Math.min(1, duration / 10);

  for (let i = 1; i < chainTargets.length; i++) {
    const prev = chainTargets[i - 1];
    const pt = chainTargets[i];
    const px = prev.x - camX;
    const py = prev.y + WORLD_Y_OFFSET;
    const cx = pt.x - camX;
    const cy = pt.y + WORLD_Y_OFFSET;
    // Deterministic zigzag (avoid Math.random which forces re-render in SVG)
    const seed = (prev.x * 7 + pt.x * 13 + i * 31) % 16 - 8;
    const midX = (px + cx) / 2 + seed;
    const midY = (py + cy) / 2 + seed * 0.5;

    // Outer glow
    ctx.globalAlpha = opacity * 0.3;
    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(midX, midY); ctx.lineTo(cx, cy); ctx.stroke();
    // Core bolt
    ctx.globalAlpha = opacity;
    ctx.strokeStyle = '#88ccff';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(midX, midY); ctx.lineTo(cx, cy); ctx.stroke();
    // Bright center
    ctx.globalAlpha = opacity * 0.8;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(midX, midY); ctx.lineTo(cx, cy); ctx.stroke();
    // Hit spark
    ctx.globalAlpha = opacity * 0.5;
    ctx.fillStyle = '#88ccff';
    ctx.beginPath(); ctx.arc(cx, cy, 4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = opacity * 0.7;
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
