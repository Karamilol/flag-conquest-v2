/**
 * PixiUnits — GPU-accelerated unit rendering via PixiJS.
 *
 * Replaces Canvas2D drawAlly/drawGoblinOrSkeleton/drawCachedEnemy/drawHero
 * with batched Pixi sprites + Graphics for health bars and effects.
 */

import { Container, Sprite, Graphics, Text, TextStyle, Texture, ImageSource } from 'pixi.js';
import { COLORS, VIEWPORT_W, VIEWPORT_H, GAME_HEIGHT, GROUND_Y, UNIT_STATS, DISPLAY_W } from '../constants';
import type { GameState } from '../types';
import { perf } from '../utils/perfProfiler';

// Sprite caches (same imports as canvasRenderer)
import { initGoblinSpriteCache, IDLE_FRAME_COUNT as GOBLIN_IDLE_FRAMES } from '../components/sprites/goblinSpriteCache';
import { initHeroSpriteCache, HERO_IDLE_FRAME_COUNT } from '../components/sprites/heroSpriteCache';
import {
  initAllySpriteCache,
  ALLY_IDLE_FRAME_COUNT,
  ALLY_VB_X, ALLY_VB_Y, ALLY_VB_W, ALLY_VB_H,
} from '../components/sprites/allySpriteCache';
import {
  initSkeletonSpriteCache,
  SKEL_IDLE_FRAME_COUNT,
  SKEL_VB_X, SKEL_VB_Y, SKEL_VB_W, SKEL_VB_H,
} from '../components/sprites/skeletonSpriteCache';
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
} from '../components/sprites/enemySpriteCache';

const WORLD_Y_OFFSET = VIEWPORT_H - GAME_HEIGHT;
const IDLE_TICKS_PER_FRAME = 25;

// ── Blob URL → Pixi Texture cache ─────────────────────────────
// Unit sprites are small pixel-art SVGs. We cache their textures here.
const spriteTextureCache = new Map<string, Texture>();
const pendingSpriteLoads = new Set<string>();

function getSpriteTexture(url: string): Texture | null {
  if (!url) return null;
  const cached = spriteTextureCache.get(url);
  if (cached) return cached;
  if (pendingSpriteLoads.has(url)) return null;

  pendingSpriteLoads.add(url);
  const img = new Image();
  img.onload = () => {
    const source = new ImageSource({
      resource: img,
      alphaMode: 'premultiply-alpha-on-upload',
      scaleMode: 'nearest',
    });
    const texture = new Texture({ source });
    spriteTextureCache.set(url, texture);
    pendingSpriteLoads.delete(url);
  };
  img.onerror = () => pendingSpriteLoads.delete(url);
  img.src = url;
  return null;
}

// ── Sprite Pool ──────────────────────────────────────────────
class SpritePool {
  private pool: Sprite[] = [];
  private active = 0;
  private parent: Container;

  constructor(parent: Container) {
    this.parent = parent;
  }

  get(): Sprite {
    let s: Sprite;
    if (this.active < this.pool.length) {
      s = this.pool[this.active];
      s.visible = true;
      s.alpha = 1;
      s.scale.set(1, 1);
    } else {
      s = new Sprite();
      this.pool.push(s);
      this.parent.addChild(s);
    }
    this.active++;
    return s;
  }

  reset(): void {
    for (let i = this.active; i < this.pool.length; i++) {
      this.pool[i].visible = false;
    }
    this.active = 0;
  }

  get activeCount(): number { return this.active; }
  get size(): number { return this.pool.length; }
}

// ── Text Pool ────────────────────────────────────────────────
class TextPool {
  private pool: Text[] = [];
  private active = 0;
  private parent: Container;

  constructor(parent: Container) {
    this.parent = parent;
  }

  get(style: TextStyle): Text {
    let t: Text;
    if (this.active < this.pool.length) {
      t = this.pool[this.active];
      t.visible = true;
      t.alpha = 1;
      t.style = style;
    } else {
      t = new Text({ text: '', style });
      this.pool.push(t);
      this.parent.addChild(t);
    }
    // Counter-scale so the high-res text fits viewport coords
    t.scale.set(INV_TEXT_SCALE, INV_TEXT_SCALE);
    this.active++;
    return t;
  }

  reset(): void {
    for (let i = this.active; i < this.pool.length; i++) {
      this.pool[i].visible = false;
    }
    this.active = 0;
  }
}

// ── Shared text styles ───────────────────────────────────────
// Text is rendered at scaled-up font sizes to avoid GPU upscale blur.
// Each Text object is then counter-scaled by 1/TEXT_SCALE so it occupies
// the correct viewport-coordinate space.
const TEXT_SCALE = (() => {
  const dpr = window.devicePixelRatio || 1;
  return (DISPLAY_W * dpr) / VIEWPORT_W;
})();
const INV_TEXT_SCALE = 1 / TEXT_SCALE;

const hpTextStyle = new TextStyle({ fontFamily: 'monospace', fontSize: Math.round(8 * TEXT_SCALE), fontWeight: 'bold', fill: '#ffffff' });
const debuffTextStyle = new TextStyle({ fontFamily: 'monospace', fontSize: Math.round(8 * TEXT_SCALE), fontWeight: 'bold', fill: '#88ccff' });
const burnTextStyle = new TextStyle({ fontFamily: 'monospace', fontSize: Math.round(6 * TEXT_SCALE), fill: '#ff8844' });
const bleedTextStyle = new TextStyle({ fontFamily: 'sans-serif', fontSize: Math.round(10 * TEXT_SCALE), fill: '#ff0000' });

// ── Frame selection helper ───────────────────────────────────
function selectIdleFrame(cache: { idle: string[] }, frame: number, enemyX: number, idleFrames = ENEMY_IDLE_FRAME_COUNT): string {
  const offset = Math.floor(Math.abs(enemyX) * 3);
  const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % idleFrames;
  return cache.idle[idleIndex];
}

// ── Main Unit Renderer ───────────────────────────────────────

export class PixiUnitRenderer {
  readonly container: Container;

  // Layered sub-containers (back to front)
  private shadowGfx!: Graphics;
  private auraGfx!: Graphics;
  private effectGfx!: Graphics;          // elite glow, debuff circles, protection shields
  private spriteContainer!: Container;
  private overlayGfx!: Graphics;         // hit flashes, attack flashes
  private healthBarGfx!: Graphics;       // all health bars
  private textContainer!: Container;     // HP numbers, debuff text

  private spritePool!: SpritePool;
  private textPool!: TextPool;

  constructor() {
    this.container = new Container();

    this.shadowGfx = new Graphics();
    this.auraGfx = new Graphics();
    this.effectGfx = new Graphics();
    this.spriteContainer = new Container();
    this.overlayGfx = new Graphics();
    this.healthBarGfx = new Graphics();
    this.textContainer = new Container();

    this.container.addChild(
      this.shadowGfx,
      this.auraGfx,
      this.effectGfx,
      this.spriteContainer,
      this.overlayGfx,
      this.healthBarGfx,
      this.textContainer,
    );

    this.spritePool = new SpritePool(this.spriteContainer);
    this.textPool = new TextPool(this.textContainer);
  }

  render(
    game: GameState,
    camX: number,
    frame: number,
    showHpNumbers: boolean,
    heroClass: string,
  ): void {
    // Reset pools and graphics
    this.spritePool.reset();
    this.textPool.reset();
    this.shadowGfx.clear();
    this.auraGfx.clear();
    this.effectGfx.clear();
    this.overlayGfx.clear();
    this.healthBarGfx.clear();

    const cullLeft = camX - 50;
    const cullRight = camX + VIEWPORT_W + 50;
    const isColosseum = game.challengeId === 'colosseum';

    // ── Aura indicators (ground plane, behind units) ──
    perf.begin('pixi.auras');
    this.drawAuras(game, camX, frame);
    perf.end('pixi.auras');

    // ── Allies ──
    perf.begin('pixi.allies');
    for (const ally of game.allies || []) {
      if (ally.health <= 0 || ally.x < cullLeft || ally.x > cullRight) continue;
      if ((ally as any).isPet || (ally as any).isFriendlySlime || (ally as any).isCourier) continue;
      this.drawAlly(ally, camX, frame, showHpNumbers, isColosseum);
    }
    perf.end('pixi.allies');

    // ── Enemies ──
    perf.begin('pixi.enemies');
    // Goblins + Skeletons
    for (const enemy of game.enemies || []) {
      if (enemy.health <= 0 || enemy.x < cullLeft || enemy.x > cullRight) continue;
      this.drawGoblinOrSkeleton(enemy, camX, frame, showHpNumbers, !!(enemy as any).isLichSkeleton, isColosseum);
    }

    // Archers
    for (const archer of (game as any).enemyArchers || []) {
      if (archer.health <= 0 || archer.x < cullLeft || archer.x > cullRight) continue;
      const cache = initArcherSpriteCache();
      const isAtk = (archer.attackCooldown ?? 99) < 10;
      const url = isAtk
        ? cache.attack[Math.min(9 - (archer.attackCooldown ?? 0), cache.attack.length - 1)]
        : selectIdleFrame(cache, frame, archer.x);
      this.drawCachedEnemy(archer, camX, frame, showHpNumbers, url,
        ARCHER_VB_X, ARCHER_VB_Y, ARCHER_VB_W, ARCHER_VB_H,
        '#ffaa00', -12, 24, isColosseum);
    }

    // Wraiths
    for (const wraith of (game as any).enemyWraiths || []) {
      if (wraith.health <= 0 || wraith.x < cullLeft || wraith.x > cullRight) continue;
      const cache = initWraithSpriteCache();
      const isAtk = (wraith.attackCooldown ?? 99) < 10;
      const url = isAtk
        ? cache.attack[Math.min(9 - (wraith.attackCooldown ?? 0), cache.attack.length - 1)]
        : selectIdleFrame(cache, frame, wraith.x);
      this.drawCachedEnemy(wraith, camX, frame, showHpNumbers, url,
        WRAITH_VB_X, WRAITH_VB_Y, WRAITH_VB_W, WRAITH_VB_H,
        '#8844aa', -14, 30, isColosseum);
    }

    // Hounds
    for (const hound of (game as any).enemyHounds || []) {
      if (hound.health <= 0 || hound.x < cullLeft || hound.x > cullRight) continue;
      const cache = initHoundSpriteCache();
      const isLunging = (hound.lungeTimer || 0) > 0;
      const isRecovering = (hound.recoveryTimer || 0) > 0;
      const url = isLunging ? cache.lunge!
        : isRecovering ? cache.recovery!
        : selectIdleFrame(cache, frame, hound.x);
      this.drawCachedEnemy(hound, camX, frame, showHpNumbers, url,
        HOUND_VB_X, HOUND_VB_Y, HOUND_VB_W, HOUND_VB_H,
        '#cc4400', -8, 24, isColosseum);
    }

    // Lichs
    for (const lich of (game as any).enemyLichs || []) {
      if (lich.health <= 0 || lich.x < cullLeft || lich.x > cullRight) continue;
      const cache = initLichSpriteCache();
      const isCastingIce = (lich.iceballCooldown ?? 0) >= 250;
      const isCastingHeal = !isCastingIce && (lich.healCooldown ?? 0) >= 200;
      const isCasting = isCastingIce || isCastingHeal;
      const url = isCasting && cache.casting
        ? cache.casting[Math.min(Math.floor((isCastingIce ? ((lich.iceballCooldown ?? 0) - 250) / 13 : ((lich.healCooldown ?? 0) - 200) / 10)), cache.casting.length - 1)]
        : selectIdleFrame(cache, frame, lich.x);
      this.drawCachedEnemy(lich, camX, frame, showHpNumbers, url,
        LICH_VB_X, LICH_VB_Y, LICH_VB_W, LICH_VB_H,
        '#44cc44', -12, 30, isColosseum);
    }

    // Shadow Assassins
    for (const sa of (game as any).enemyShadowAssassins || []) {
      if (sa.health <= 0 || sa.x < cullLeft || sa.x > cullRight) continue;
      const cache = initShadowAssassinSpriteCache();
      const isCloaked = (sa.stealthTimer || 0) > 0;
      const isAtk = (sa.attackCooldown ?? 99) < 8;
      const url = isAtk
        ? cache.attack[Math.min(7 - (sa.attackCooldown ?? 0), cache.attack.length - 1)]
        : isCloaked && cache.cloakedIdle
        ? cache.cloakedIdle[Math.floor((frame + Math.floor(Math.abs(sa.x) * 3)) / IDLE_TICKS_PER_FRAME) % ENEMY_IDLE_FRAME_COUNT]
        : selectIdleFrame(cache, frame, sa.x);
      this.drawCachedEnemy(sa, camX, frame, showHpNumbers, url,
        SHADOW_VB_X, SHADOW_VB_Y, SHADOW_VB_W, SHADOW_VB_H,
        '#aa44ff', -8, 24, isColosseum);
    }

    // Flame Callers
    for (const fc of (game as any).enemyFlameCallers || []) {
      if (fc.health <= 0 || (fc.x < cullLeft && !(fc.isCasting && fc.castTargetX >= cullLeft)) || fc.x > cullRight) continue;
      const cache = initFlameCallerSpriteCache();
      const url = fc.isCasting && cache.casting
        ? cache.casting[Math.min(Math.floor((fc.castTimer ?? 0) / 68), cache.casting.length - 1)]
        : selectIdleFrame(cache, frame, fc.x);
      this.drawCachedEnemy(fc, camX, frame, showHpNumbers, url,
        FLAME_VB_X, FLAME_VB_Y, FLAME_VB_W, FLAME_VB_H,
        COLORS.healthRed, -10, 24, isColosseum);
    }

    // Corrupted Sentinels
    for (const cs of (game as any).enemyCorruptedSentinels || []) {
      if (cs.health <= 0 || cs.x < cullLeft || cs.x > cullRight) continue;
      const cache = initCorruptedSentinelSpriteCache();
      const isAtk = (cs.attackCooldown ?? 99) < 12;
      const url = isAtk
        ? cache.attack[Math.min(11 - (cs.attackCooldown ?? 0), cache.attack.length - 1)]
        : selectIdleFrame(cache, frame, cs.x);
      this.drawCachedEnemy(cs, camX, frame, showHpNumbers, url,
        SENTINEL_VB_X, SENTINEL_VB_Y, SENTINEL_VB_W, SENTINEL_VB_H,
        '#666699', -14, 32, isColosseum);
    }

    // Dungeon Rats
    for (const dr of (game as any).enemyDungeonRats || []) {
      if (dr.health <= 0 || dr.x < cullLeft || dr.x > cullRight) continue;
      const cache = initDungeonRatSpriteCache();
      const isAtk = (dr.attackCooldown ?? 99) < 10;
      const url = isAtk
        ? cache.attack[Math.min(9 - (dr.attackCooldown ?? 0), cache.attack.length - 1)]
        : selectIdleFrame(cache, frame, dr.x);
      this.drawCachedEnemy(dr, camX, frame, showHpNumbers, url,
        RAT_VB_X, RAT_VB_Y, RAT_VB_W, RAT_VB_H,
        '#aa6633', -6, 16, isColosseum);
    }

    // Fire Imps
    for (const fi of (game as any).enemyFireImps || []) {
      if (fi.health <= 0 || (fi.x < cullLeft && !(fi.isCasting && fi.castTargetX >= cullLeft)) || fi.x > cullRight) continue;
      const cache = initFireImpSpriteCache();
      const url = fi.isCasting && cache.casting
        ? cache.casting[Math.min(Math.floor((fi.castTimer ?? 0) / 20), cache.casting.length - 1)]
        : selectIdleFrame(cache, frame, fi.x);
      this.drawCachedEnemy(fi, camX, frame, showHpNumbers, url,
        IMP_VB_X, IMP_VB_Y, IMP_VB_W, IMP_VB_H,
        '#ff6633', -8, 20, isColosseum);
    }

    // Cursed Knights
    for (const ck of (game as any).enemyCursedKnights || []) {
      if (ck.health <= 0 || ck.x < cullLeft || ck.x > cullRight) continue;
      const cache = initCursedKnightSpriteCache();
      const isAtk = (ck.attackCooldown ?? 99) < 12;
      const url = isAtk
        ? cache.attack[Math.min(11 - (ck.attackCooldown ?? 0), cache.attack.length - 1)]
        : selectIdleFrame(cache, frame, ck.x);
      this.drawCachedEnemy(ck, camX, frame, showHpNumbers, url,
        KNIGHT_VB_X, KNIGHT_VB_Y, KNIGHT_VB_W, KNIGHT_VB_H,
        '#6644aa', -14, 24, isColosseum);
    }
    perf.end('pixi.enemies');

    // ── Hero ──
    perf.begin('pixi.hero');
    if (game.hero.health > 0) {
      this.drawHero(game.hero, camX, frame, heroClass);
    }
    perf.end('pixi.hero');

    perf.gauge('pixi.unitSprites', this.spritePool.activeCount);
  }

  // ── Draw a unit sprite from blob URL ──────────────────────────
  private drawUnitSprite(
    url: string,
    dx: number, dy: number,
    vbX: number, vbY: number, vbW: number, vbH: number,
    scaleVal = 1,
  ): void {
    const tex = getSpriteTexture(url);
    if (!tex) return;
    const s = this.spritePool.get();
    s.texture = tex;
    s.position.set(dx + vbX * scaleVal, dy + vbY * scaleVal);
    s.width = vbW * scaleVal;
    s.height = vbH * scaleVal;
  }

  // ── Health bar ────────────────────────────────────────────────
  private drawHealthBar(
    dx: number, dy: number,
    barW: number, barH: number,
    hp: number, maxHp: number,
    fillColor: string,
    showNumbers: boolean,
  ): void {
    const g = this.healthBarGfx;
    const ratio = Math.max(0, hp / maxHp);

    // Background
    g.fill({ color: COLORS.healthBg });
    g.roundRect(dx, dy, barW, barH, 1);
    g.fill();

    // Fill
    const fillW = Math.max(0, (barW - 2) * ratio);
    if (fillW > 0) {
      g.fill({ color: fillColor });
      g.roundRect(dx + 1, dy + 1, fillW, barH - 2, 1);
      g.fill();
    }

    // HP numbers
    if (showNumbers) {
      const t = this.textPool.get(hpTextStyle);
      t.text = `${hp}/${maxHp}`;
      t.anchor.set(0.5, 1);
      t.position.set(dx + barW / 2, dy - 1);
    }
  }

  // ── Drop shadow ───────────────────────────────────────────────
  private drawShadow(cx: number, groundY: number, rx: number, ry: number, opacity: number): void {
    this.shadowGfx.fill({ color: 0x000000, alpha: opacity });
    this.shadowGfx.ellipse(cx, groundY, rx, ry);
    this.shadowGfx.fill();
  }

  // ── Hit flash ─────────────────────────────────────────────────
  // Disabled — Canvas2D's semi-transparent red rect doesn't translate well
  // to Pixi Graphics (too visible). TODO: replace with sprite tint in Phase 5.
  private drawHitFlash(_dx: number, _dy: number, _w: number, _h: number, _opacity: number): void {
    // no-op for now
  }

  // ── Debuff indicators ─────────────────────────────────────────
  private drawDebuffs(enemy: any, dx: number, dy: number, frame: number): void {
    // Bleed
    const bleedStacks = enemy.bleedStacks ?? 0;
    if (bleedStacks > 0) {
      const t = this.textPool.get(bleedTextStyle);
      t.text = bleedStacks > 1 ? `\u{1FA78}${bleedStacks}` : '\u{1FA78}';
      t.anchor.set(0.5, 1);
      t.position.set(dx + 12, dy - 16);
    }

    // Slow
    if ((enemy.slowTimer || 0) > 0) {
      this.effectGfx.fill({ color: 0x4488ff, alpha: 0.12 });
      this.effectGfx.circle(dx + 12, dy + 12, 14);
      this.effectGfx.fill();
      const t = this.textPool.get(debuffTextStyle);
      t.text = 'SLOW';
      t.anchor.set(0.5, 1);
      t.position.set(dx + 12, dy - 14);
    }

    // Burn
    if ((enemy.burnTimer || 0) > 0) {
      const burnAlpha = 0.06 + Math.sin(frame * 0.15) * 0.03;
      this.effectGfx.fill({ color: 0xff6600, alpha: burnAlpha });
      this.effectGfx.circle(dx + 12, dy + 12, 10);
      this.effectGfx.fill();
      const t = this.textPool.get(burnTextStyle);
      t.text = 'BURN';
      t.anchor.set(0.5, 0);
      t.position.set(dx + 12, dy + 30);
    }
  }

  // ── Aura indicators ───────────────────────────────────────────
  private drawAuras(game: GameState, camX: number, frame: number): void {
    if (game.hero.health <= 0) return;
    const hx = game.hero.x + 16 - camX;
    const groundAuraY = GROUND_Y + WORLD_Y_OFFSET + 4;
    const t = frame * 0.03;
    const heroSkills = (game as any).heroSkills;
    const equipped: string[] = heroSkills?.equippedSkills || [];

    if (equipped.includes('heroicPresence')) {
      const pulse = 0.04 + Math.sin(t) * 0.02;
      this.auraGfx.fill({ color: 0xff6644, alpha: pulse });
      this.auraGfx.ellipse(hx, groundAuraY, 120, 8);
      this.auraGfx.fill();
      this.auraGfx.stroke({ color: 0xff6644, width: 1, alpha: 0.12 + Math.sin(t) * 0.06 });
      this.auraGfx.ellipse(hx, groundAuraY, 120, 8);
      this.auraGfx.stroke();
    }

    if (equipped.includes('pathfinder')) {
      const pulse = 0.04 + Math.sin(t + 1.8) * 0.02;
      this.auraGfx.fill({ color: 0x44ff88, alpha: pulse });
      this.auraGfx.ellipse(hx, groundAuraY, 120, 8);
      this.auraGfx.fill();
    }

    if (equipped.includes('intimidate')) {
      const pulse = 0.04 + Math.sin(t + 3.6) * 0.02;
      this.auraGfx.fill({ color: 0xaa66ff, alpha: pulse });
      this.auraGfx.ellipse(hx, groundAuraY, 150, 8);
      this.auraGfx.fill();
    }

    if ((game.artifacts || []).some((a: any) => a.id === 'command')) {
      const pulse = 0.04 + Math.sin(t + 5.4) * 0.02;
      this.auraGfx.fill({ color: 0xffd700, alpha: pulse });
      this.auraGfx.ellipse(hx, groundAuraY, 30, 8);
      this.auraGfx.fill();
    }
  }

  // ── Hero ──────────────────────────────────────────────────────
  private drawHero(
    hero: GameState['hero'],
    camX: number,
    frame: number,
    heroClass: string,
  ): void {
    const cache = initHeroSpriteCache(heroClass);
    const justSwung = hero.isAttacking && hero.attackCooldown < 6;
    const lungeX = justSwung ? Math.sin((1 - hero.attackCooldown / 5) * Math.PI) * 3 : 0;

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

    // Shadow
    this.drawShadow(dx + 16, dy + GROUND_Y - hero.y + 2, 12, 3, 0.22);

    // Sprite
    this.drawUnitSprite(spriteUrl, dx, dy, cache.vbX, cache.vbY, cache.vbW, cache.vbH);

    // Sword slash trail — disabled for now, Pixi Graphics arc() draws stray
    // lines from the current pen position. TODO: re-implement in Phase 5.

    // Hit flash
    const timeSinceHit = frame - (hero.lastDamageTime || 0);
    if ((hero.lastDamageTime || 0) > 0 && timeSinceHit >= 0 && timeSinceHit < 12) {
      this.drawHitFlash(dx - 8, dy - 18, 52, 58, 0.1);
    }

    // Health bar
    const hpColor = hero.health > hero.maxHealth * 0.3 ? COLORS.healthGreen : COLORS.healthRed;
    this.drawHealthBar(dx - 2, dy - 24, 36, 7, hero.health, hero.maxHealth, hpColor, true);
  }

  // ── Ally ──────────────────────────────────────────────────────
  private drawAlly(
    ally: any,
    camX: number,
    frame: number,
    showHpNumbers: boolean,
    isColosseum: boolean,
  ): void {
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

    // Shadow
    this.drawShadow(dx + 10, dy + 20, 7 * giantScale, 2.5 * giantScale, 0.18);

    // Protection shield
    if ((ally.protectionTimer || 0) > 0) {
      this.effectGfx.stroke({ color: 0xffd700, width: 1.5, alpha: 0.45 });
      this.effectGfx.ellipse(dx + 10 * totalScale, dy + 5 * totalScale, 12 * totalScale, 16 * totalScale);
      this.effectGfx.stroke();
      this.effectGfx.fill({ color: 0xffd700, alpha: 0.07 });
      this.effectGfx.ellipse(dx + 10 * totalScale, dy + 5 * totalScale, 10 * totalScale, 14 * totalScale);
      this.effectGfx.fill();
    }

    // Sprite
    this.drawUnitSprite(spriteUrl, dx, dy, ALLY_VB_X, ALLY_VB_Y, ALLY_VB_W, ALLY_VB_H, totalScale);

    // Royal guard crown
    if (ally.isRoyalGuard && unitType === 'archer') {
      const g = this.overlayGfx;
      g.fill({ color: 0xffd700 });
      g.moveTo(dx + 2, dy - 16);
      g.lineTo(dx + 5, dy - 12);
      g.lineTo(dx + 8, dy - 15);
      g.lineTo(dx + 10, dy - 12);
      g.lineTo(dx + 12, dy - 15);
      g.lineTo(dx + 15, dy - 12);
      g.lineTo(dx + 18, dy - 16);
      g.lineTo(dx + 18, dy - 12);
      g.lineTo(dx + 2, dy - 12);
      g.closePath();
      g.fill();
      // Ruby
      g.fill({ color: 0xff4444 });
      g.rect(dx + 6, dy - 15, 2, 2);
      g.fill();
    }

    // Hit flash
    const timeSinceHit = frame - (ally.lastDamageTime || 0);
    if ((ally.lastDamageTime || 0) > 0 && timeSinceHit >= 0 && timeSinceHit < 10) {
      this.drawHitFlash(dx - 4, dy - 8, 28 * totalScale, 36 * totalScale, 0.12);
    }

    // Health bar
    const stats = UNIT_STATS[unitType as keyof typeof UNIT_STATS] as any;
    const baseColor: string = ally.isRoyalGuard ? '#ffd700' : (stats?.color || '#4a7fff');
    this.drawHealthBar(dx, dy - 12, 20 * totalScale, 4, ally.health, ally.maxHealth, baseColor, showHpNumbers);
  }

  // ── Goblin / Skeleton ─────────────────────────────────────────
  private drawGoblinOrSkeleton(
    enemy: any,
    camX: number,
    frame: number,
    showHpNumbers: boolean,
    isSkeleton: boolean,
    isColosseum: boolean,
  ): void {
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
      spriteUrl = selectIdleFrame(cache, frame, enemy.x, idleFrameCount);
    }

    const ey = enemy.y + (enemy.lane || 0);
    const dx = enemy.x - camX;
    const dy = ey + WORLD_Y_OFFSET;
    const scale = isColosseum ? 2 : 1;

    // Drop shadow
    this.drawShadow(dx + 12, dy + 20, isSkeleton ? 7 : 8, 2.5, isSkeleton ? 0.12 : 0.18);

    // Sprite
    this.drawUnitSprite(spriteUrl, dx, dy, vbX, vbY, vbW, vbH, scale);

    // Elite glow (goblins only)
    if (!isSkeleton && enemy.isElite) {
      this.effectGfx.fill({ color: 0xff4444, alpha: 0.1 });
      this.effectGfx.circle(dx + 12, dy + 10, 18);
      this.effectGfx.fill();
    }

    // Debuffs (only when active)
    this.drawDebuffs(enemy, dx, dy, frame);

    // Health bar
    const hpColor = isSkeleton ? '#aaaaaa' : COLORS.healthRed;
    this.drawHealthBar(dx, dy - 10, 24 * scale, 5, enemy.health, enemy.maxHealth, hpColor, showHpNumbers);
  }

  // ── Generic cached enemy draw ─────────────────────────────────
  private drawCachedEnemy(
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
  ): void {
    const ey = enemy.y + (enemy.lane || 0);
    const dx = enemy.x - camX;
    const dy = ey + WORLD_Y_OFFSET;
    const scale = isColosseum ? 2 : 1;

    // Sprite
    this.drawUnitSprite(spriteUrl, dx, dy, vbX, vbY, vbW, vbH, scale);

    // Elite glow
    if (enemy.isElite) {
      this.effectGfx.fill({ color: 0xff4444, alpha: 0.1 });
      this.effectGfx.circle(dx + vbW / 2 + vbX, dy + vbH / 2 + vbY, 18);
      this.effectGfx.fill();
    }

    // Debuffs (only when active)
    this.drawDebuffs(enemy, dx, dy, frame);

    // Health bar
    this.drawHealthBar(dx, dy + hpBarY, hpBarW * scale, 5, enemy.health, enemy.maxHealth, hpColor, showHpNumbers);
  }
}
