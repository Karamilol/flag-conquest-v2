/**
 * PixiProjectiles — GPU-accelerated projectile rendering via PixiJS.
 *
 * Each projectile gets its own pooled Graphics object with zIndex = y,
 * injected into the shared depth-sorted container alongside unit sprites.
 * This gives natural lane-based depth: projectiles interleave with units.
 */

import { Container, Graphics } from 'pixi.js';
import { VIEWPORT_W, VIEWPORT_H, GAME_HEIGHT, GROUND_Y } from '../constants';
import type { GameState } from '../types';

const WORLD_Y_OFFSET = VIEWPORT_H - GAME_HEIGHT;

// ── Graphics Pool ──────────────────────────────────────────
class GraphicsPool {
  private pool: Graphics[] = [];
  private active = 0;
  private parent: Container;

  constructor(parent: Container) {
    this.parent = parent;
  }

  get(): Graphics {
    let g: Graphics;
    if (this.active < this.pool.length) {
      g = this.pool[this.active];
      g.visible = true;
      g.clear();
    } else {
      g = new Graphics();
      this.pool.push(g);
      this.parent.addChild(g);
    }
    this.active++;
    return g;
  }

  reset(): void {
    for (let i = this.active; i < this.pool.length; i++) {
      this.pool[i].visible = false;
    }
    this.active = 0;
  }
}

export class PixiProjectileRenderer {
  // No own container — draws into the shared depth container
  private depthParent: Container | null = null;
  private pool!: GraphicsPool;

  /** Call once after construction, passing the unit renderer's depthContainer */
  attachTo(depthContainer: Container): void {
    this.depthParent = depthContainer;
    this.pool = new GraphicsPool(depthContainer);
  }

  render(game: GameState, camX: number, frame: number): void {
    if (!this.pool) return;
    this.pool.reset();

    const cullLeft = camX - 60;
    const cullRight = camX + VIEWPORT_W + 60;

    for (const p of (game.projectiles || []) as any[]) {
      const px = p.x;
      const tx = p.targetX ?? px;
      const minX = Math.min(px, tx) - 60;
      const maxX = Math.max(px, tx) + 60;
      if (maxX < cullLeft || minX > cullRight) continue;

      const sx = px - camX;
      const sy = (p.y ?? GROUND_Y - 10) + WORLD_Y_OFFSET;

      switch (p.type) {
        case 'arrow':
          this.drawArrow(sx, sy, false);
          break;
        case 'allyArrow':
          this.drawArrow(sx, sy, true);
          break;
        case 'heroArrow':
          this.drawHeroArrow(sx, sy);
          break;
        case 'fireball':
          this.drawFireball(sx, sy);
          break;
        case 'iceball':
          this.drawIceball(sx, sy);
          break;
        case 'wizardBeam':
          this.drawWizardBeam(sx, sy);
          break;
        case 'boss':
          this.drawBossProjectile(sx, sy);
          break;
        case 'heroRanged':
          this.drawHeroRanged(sx, sy);
          break;
        case 'clericBolt':
          this.drawClericBolt(sx, sy);
          break;
        case 'clericChain':
          this.drawClericChain(sx, sy);
          break;
        case 'crystalBolt':
          this.drawCrystalBolt(sx, sy);
          break;
        case 'longbowShot':
          this.drawLongbowShot(sx, sy);
          break;
        case 'spearThrow':
          this.drawSpearThrow(sx, sy, (p as any)._arcAngle ?? 0);
          break;
        case 'bombardShot':
          this.drawBombardShot(sx, sy);
          break;
        case 'laser':
          this.drawLaser((p.targetX ?? px) - camX, sy, p.radius || 50, p.duration ?? 30, 0x44aa22, 0x66cc44);
          break;
        case 'spectralBlast':
          this.drawLaser((p.targetX ?? px) - camX, sy, p.radius || 60, p.duration ?? 30, 0x6622aa, 0x8844cc);
          break;
        case 'meteorStrike':
          this.drawLaser((p.targetX ?? px) - camX, sy, p.radius || 120, p.duration ?? 60, 0xff4400, 0xff6600);
          break;
        case 'healBeam':
          this.drawVerticalBeam(sx, sy, p.duration ?? 30, 0x4aff4a, 0xaaffaa);
          break;
        case 'darkHeal':
          this.drawVerticalBeam(sx, sy, p.duration ?? 30, 0x6622aa, 0xaa55ff);
          break;
        case 'chainLightning':
          this.drawChainLightning(p.chainTargets, camX, sy, p.duration ?? 30);
          break;
      }
    }

    // Casting fireballs (flame callers + fire imps)
    this.drawCastingFireballs(game, camX, frame);
  }

  /** Get a fresh Graphics from the pool, positioned at the given Y depth */
  private getGfx(y: number): Graphics {
    const g = this.pool.get();
    g.zIndex = y;
    return g;
  }

  // ── Arrow ──────────────────────────────────────────────────────
  private drawArrow(x: number, y: number, isAlly: boolean): void {
    const g = this.getGfx(y);
    const dir = isAlly ? 1 : -1;
    const shaftColor = isAlly ? 0x5a8b5a : 0x8b5a2a;
    const headColor = isAlly ? 0x77ff77 : 0x666666;
    g.stroke({ color: shaftColor, width: 2 });
    g.moveTo(x, y);
    g.lineTo(x - 15 * dir, y);
    g.stroke();
    g.fill({ color: headColor });
    g.moveTo(x + 6 * dir, y);
    g.lineTo(x, y - 3);
    g.lineTo(x, y + 3);
    g.closePath();
    g.fill();
  }

  // ── Hero Arrow ─────────────────────────────────────────────────
  private drawHeroArrow(x: number, y: number): void {
    const g = this.getGfx(y);
    g.stroke({ color: 0x6b4226, width: 2 });
    g.moveTo(x, y);
    g.lineTo(x + 18, y);
    g.stroke();
    g.fill({ color: 0xaaaaaa });
    g.moveTo(x + 18, y - 3);
    g.lineTo(x + 24, y);
    g.lineTo(x + 18, y + 3);
    g.closePath();
    g.fill();
    g.stroke({ color: 0x4a8f3f, width: 1.5 });
    g.moveTo(x, y);
    g.lineTo(x - 4, y - 4);
    g.moveTo(x + 2, y);
    g.lineTo(x - 2, y + 4);
    g.stroke();
  }

  // ── Fireball ───────────────────────────────────────────────────
  private drawFireball(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0xff4400, alpha: 0.8 });
    g.circle(x, y, 12);
    g.fill();
    g.fill({ color: 0xff6600 });
    g.circle(x, y, 8);
    g.fill();
    g.fill({ color: 0xffaa00 });
    g.circle(x, y, 4);
    g.fill();
    g.fill({ color: 0xffffff, alpha: 0.7 });
    g.circle(x - 3, y - 3, 2);
    g.fill();
  }

  // ── Iceball ────────────────────────────────────────────────────
  private drawIceball(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0x4488cc, alpha: 0.3 });
    g.circle(x, y, 10);
    g.fill();
    g.fill({ color: 0x88ccff, alpha: 0.7 });
    g.circle(x, y, 7);
    g.fill();
    g.fill({ color: 0xbbddff });
    g.circle(x, y, 4);
    g.fill();
    g.fill({ color: 0xffffff });
    g.circle(x, y, 2);
    g.fill();
  }

  // ── Wizard Beam ────────────────────────────────────────────────
  private drawWizardBeam(x: number, y: number): void {
    const g = this.getGfx(y);
    g.stroke({ color: 0xaa55ff, width: 4, alpha: 0.8 });
    g.moveTo(x, y);
    g.lineTo(x + 60, y);
    g.stroke();
    g.stroke({ color: 0xdd88ff, width: 2, alpha: 0.8 });
    g.moveTo(x, y);
    g.lineTo(x + 60, y);
    g.stroke();
    g.fill({ color: 0xaa55ff, alpha: 0.6 });
    g.circle(x + 60, y, 6);
    g.fill();
    g.fill({ color: 0xffffff });
    g.circle(x + 60, y, 3);
    g.fill();
  }

  // ── Boss Projectile ────────────────────────────────────────────
  private drawBossProjectile(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0xff3333, alpha: 0.8 });
    g.circle(x, y, 8);
    g.fill();
    g.fill({ color: 0xff6666 });
    g.circle(x, y, 5);
    g.fill();
    g.fill({ color: 0xffaaaa });
    g.circle(x, y, 2);
    g.fill();
  }

  // ── Hero Ranged ────────────────────────────────────────────────
  private drawHeroRanged(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0x4a9fff, alpha: 0.7 });
    g.circle(x, y, 6);
    g.fill();
    g.fill({ color: 0x7abfff });
    g.circle(x, y, 4);
    g.fill();
    g.fill({ color: 0xffffff });
    g.circle(x, y, 2);
    g.fill();
    g.stroke({ color: 0x4a9fff, width: 2, alpha: 0.5 });
    g.moveTo(x - 8, y);
    g.lineTo(x - 2, y);
    g.stroke();
  }

  // ── Cleric Bolt ────────────────────────────────────────────────
  private drawClericBolt(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0x4aff4a, alpha: 0.7 });
    g.circle(x, y, 6);
    g.fill();
    g.fill({ color: 0xaaffaa });
    g.circle(x, y, 4);
    g.fill();
    g.fill({ color: 0xffffff });
    g.circle(x, y, 2);
    g.fill();
  }

  // ── Cleric Chain ───────────────────────────────────────────────
  private drawClericChain(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0x44ff88, alpha: 0.6 });
    g.circle(x, y, 5);
    g.fill();
    g.fill({ color: 0x88ffbb });
    g.circle(x, y, 3);
    g.fill();
    g.fill({ color: 0xffffff, alpha: 0.8 });
    g.circle(x, y, 1.5);
    g.fill();
    g.stroke({ color: 0x44ff88, width: 1.5, alpha: 0.5 });
    g.moveTo(x - 6, y - 2);
    g.lineTo(x - 2, y);
    g.moveTo(x - 6, y + 2);
    g.lineTo(x - 2, y);
    g.stroke();
  }

  // ── Crystal Bolt ───────────────────────────────────────────────
  private drawCrystalBolt(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0x55ddcc, alpha: 0.9 });
    g.moveTo(x, y - 5);
    g.lineTo(x - 3, y);
    g.lineTo(x, y + 5);
    g.lineTo(x + 3, y);
    g.closePath();
    g.fill();
    g.fill({ color: 0x88ffee });
    g.moveTo(x, y - 3);
    g.lineTo(x - 2, y);
    g.lineTo(x, y + 3);
    g.lineTo(x + 2, y);
    g.closePath();
    g.fill();
    g.fill({ color: 0xffffff, alpha: 0.6 });
    g.circle(x, y, 2);
    g.fill();
  }

  // ── Longbow Shot (arching overwatch arrow) ─────────────────────
  private drawLongbowShot(x: number, y: number): void {
    const g = this.getGfx(y);
    // Shaft — same green as allyArrow
    g.stroke({ color: 0x5a8b5a, width: 2 });
    g.moveTo(x, y);
    g.lineTo(x - 15, y);
    g.stroke();
    // Head — same bright green triangle as allyArrow
    g.fill({ color: 0x77ff77 });
    g.moveTo(x + 6, y);
    g.lineTo(x, y - 3);
    g.lineTo(x, y + 3);
    g.closePath();
    g.fill();
  }

  // ── Spear Throw (halberd shrine big: hurled spear, arcing) ─────
  private drawSpearThrow(x: number, y: number, angle: number): void {
    const g = this.getGfx(y);
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const px = -s; // perpendicular
    const py = c;

    // Wooden shaft — extends backward from tip
    g.stroke({ color: 0x7a4e28, width: 3 });
    g.moveTo(x, y);
    g.lineTo(x - 32 * c, y - 32 * s);
    g.stroke();
    // Darker grain stripe for depth
    g.stroke({ color: 0x5a3618, width: 1 });
    g.moveTo(x - 4 * c + 0.8 * px, y - 4 * s + 0.8 * py);
    g.lineTo(x - 28 * c + 0.8 * px, y - 28 * s + 0.8 * py);
    g.stroke();

    // Butt cap
    g.fill({ color: 0x3a2010 });
    g.circle(x - 32 * c, y - 32 * s, 2.5);
    g.fill();

    // Iron spearhead
    const tipFwd = 11;
    const tipBase = 4;
    g.fill({ color: 0xb8bcc8 });
    g.moveTo(x + tipFwd * c, y + tipFwd * s);
    g.lineTo(x + tipBase * px, y + tipBase * py);
    g.lineTo(x - 4 * c, y - 4 * s);
    g.lineTo(x - tipBase * px, y - tipBase * py);
    g.closePath();
    g.fill();
    // Highlight glint
    g.stroke({ color: 0xffffff, alpha: 0.55, width: 1 });
    g.moveTo(x + tipFwd * c, y + tipFwd * s);
    g.lineTo(x + 2 * c + 1.5 * px, y + 2 * s + 1.5 * py);
    g.stroke();
  }

  // ── Bombard Shot ───────────────────────────────────────────────
  private drawBombardShot(x: number, y: number): void {
    const g = this.getGfx(y);
    g.fill({ color: 0x777777, alpha: 0.3 });
    g.circle(x - 8, y + 3, 4);
    g.fill();
    g.fill({ color: 0x666666, alpha: 0.2 });
    g.circle(x - 14, y + 5, 3);
    g.fill();
    g.fill({ color: 0x555555, alpha: 0.12 });
    g.circle(x - 20, y + 6, 2.5);
    g.fill();
    g.fill({ color: 0x555555 });
    g.circle(x, y, 7);
    g.fill();
    g.fill({ color: 0x888888, alpha: 0.6 });
    g.circle(x - 2, y - 2, 3);
    g.fill();
    g.fill({ color: 0xff6600 });
    g.circle(x + 4, y - 5, 2.5);
    g.fill();
    g.fill({ color: 0xffdd00 });
    g.circle(x + 5, y - 6, 1.5);
    g.fill();
  }

  // ── Laser (used for laser, spectralBlast, meteorStrike) ────────
  private drawLaser(
    targetX: number,
    y: number,
    radius: number,
    duration: number,
    color1: number,
    color2: number,
  ): void {
    const g = this.getGfx(y);
    const opacity = Math.min(1, duration / 15);
    const groundY = GROUND_Y + WORLD_Y_OFFSET;

    g.stroke({ color: color1, width: 2, alpha: opacity * 0.3 });
    g.moveTo(targetX - 8, 0);
    g.lineTo(targetX - 8, groundY);
    g.stroke();
    g.stroke({ color: color1, width: 2, alpha: opacity * 0.3 });
    g.moveTo(targetX + 8, 0);
    g.lineTo(targetX + 8, groundY);
    g.stroke();
    g.stroke({ color: color1, width: 1.5, alpha: opacity * 0.25 });
    g.moveTo(targetX - 15, 0);
    g.lineTo(targetX - 15, groundY);
    g.stroke();
    g.stroke({ color: color1, width: 1.5, alpha: opacity * 0.25 });
    g.moveTo(targetX + 15, 0);
    g.lineTo(targetX + 15, groundY);
    g.stroke();
    g.stroke({ color: color2, width: 3, alpha: opacity * 0.6 });
    g.moveTo(targetX, 0);
    g.lineTo(targetX, groundY);
    g.stroke();

    g.fill({ color: color1, alpha: opacity * 0.25 });
    g.circle(targetX, groundY - 10, radius);
    g.fill();
    g.fill({ color: color2, alpha: opacity * 0.3 });
    g.circle(targetX, groundY - 10, radius * 0.6);
    g.fill();

    g.fill({ color: color1, alpha: opacity * 0.4 });
    g.circle(targetX, 20, 12);
    g.fill();
  }

  // ── Vertical Beam (healBeam, darkHeal) ─────────────────────────
  private drawVerticalBeam(
    x: number,
    y: number,
    duration: number,
    color1: number,
    color2: number,
  ): void {
    const g = this.getGfx(y);
    const opacity = Math.min(1, duration / 10);
    const top = y - 80;
    const bot = y + 10;

    g.stroke({ color: color1, width: 6, alpha: opacity * 0.4 });
    g.moveTo(x, top);
    g.lineTo(x, bot);
    g.stroke();
    g.stroke({ color: color2, width: 3, alpha: opacity * 0.7 });
    g.moveTo(x, top);
    g.lineTo(x, bot);
    g.stroke();
    g.stroke({ color: 0xffffff, width: 1, alpha: opacity * 0.9 });
    g.moveTo(x, top);
    g.lineTo(x, bot);
    g.stroke();

    g.fill({ color: color1, alpha: opacity * 0.3 });
    g.circle(x, y, 10);
    g.fill();
    g.fill({ color: color2, alpha: opacity * 0.5 });
    g.circle(x, y, 5);
    g.fill();
    g.fill({ color: color1, alpha: opacity * 0.4 });
    g.circle(x, top, 6);
    g.fill();
  }

  // ── Chain Lightning ────────────────────────────────────────────
  private drawChainLightning(
    chainTargets: Array<{ x: number; y: number }> | undefined,
    camX: number,
    baseY: number,
    duration: number,
  ): void {
    if (!chainTargets || chainTargets.length < 2) return;
    const g = this.getGfx(baseY);
    const opacity = Math.min(1, duration / 10);

    for (let i = 1; i < chainTargets.length; i++) {
      const prev = chainTargets[i - 1];
      const pt = chainTargets[i];
      const px = prev.x - camX;
      const py = prev.y + WORLD_Y_OFFSET;
      const cx = pt.x - camX;
      const cy = pt.y + WORLD_Y_OFFSET;
      const seed = (prev.x * 7 + pt.x * 13 + i * 31) % 16 - 8;
      const midX = (px + cx) / 2 + seed;
      const midY = (py + cy) / 2 + seed * 0.5;

      g.stroke({ color: 0x4488ff, width: 4, alpha: opacity * 0.3 });
      g.moveTo(px, py);
      g.lineTo(midX, midY);
      g.lineTo(cx, cy);
      g.stroke();
      g.stroke({ color: 0x88ccff, width: 2, alpha: opacity });
      g.moveTo(px, py);
      g.lineTo(midX, midY);
      g.lineTo(cx, cy);
      g.stroke();
      g.stroke({ color: 0xffffff, width: 1, alpha: opacity * 0.8 });
      g.moveTo(px, py);
      g.lineTo(midX, midY);
      g.lineTo(cx, cy);
      g.stroke();
      g.fill({ color: 0x88ccff, alpha: opacity * 0.5 });
      g.circle(cx, cy, 4);
      g.fill();
      g.fill({ color: 0xffffff, alpha: opacity * 0.7 });
      g.circle(cx, cy, 2);
      g.fill();
    }
  }

  // ── Casting Fireballs (in-flight from flame callers / fire imps) ──
  private drawCastingFireballs(game: GameState, camX: number, frame: number): void {
    const gameAny = game as any;
    const casters = [
      ...((gameAny.enemyFlameCallers || []).map((fc: any) => ({ ...fc, castMax: 310, color: 0xff4400, glowColor: 0xff8800, size: 7 }))),
      ...((gameAny.enemyFireImps || []).map((fi: any) => ({ ...fi, castMax: 120, color: 0xff6600, glowColor: 0xffaa00, size: 5 }))),
    ];

    for (const c of casters) {
      if (!c.isCasting || c.health <= 0 || !c.castTargetX) continue;
      const t = Math.min(1, (c.castTimer || 0) / c.castMax);
      const startX = c.x - camX;
      const startY = (c.y || GROUND_Y - 20) + WORLD_Y_OFFSET;
      const endX = c.castTargetX - camX;
      const endY = (c.castTargetY || GROUND_Y - 10) + WORLD_Y_OFFSET;
      const fx = startX + (endX - startX) * t;
      const arcH = -60 * 4 * t * (t - 1);
      const fy = startY + (endY - startY) * t - arcH;

      const g = this.getGfx(fy);

      // Glow
      g.fill({ color: c.glowColor, alpha: 0.3 });
      g.circle(fx, fy, c.size + 4 + Math.sin(frame * 0.3) * 2);
      g.fill();
      // Core
      g.fill({ color: c.color, alpha: 0.9 });
      g.circle(fx, fy, c.size);
      g.fill();
      // Bright center
      g.fill({ color: 0xffdd44, alpha: 0.8 });
      g.circle(fx, fy, c.size * 0.4);
      g.fill();
      // Trail sparks
      for (let i = 1; i <= 3; i++) {
        const tt = Math.max(0, t - i * 0.06);
        const tx = startX + (endX - startX) * tt;
        const tArc = -60 * 4 * tt * (tt - 1);
        const ty = startY + (endY - startY) * tt - tArc;
        g.fill({ color: c.color, alpha: 0.4 });
        g.circle(tx, ty, c.size * (0.6 - i * 0.12));
        g.fill();
      }

      // Target zone indicator
      if (t > 0.3) {
        const zoneAlpha = (t - 0.3) * 0.5;
        g.stroke({ color: c.color, width: 1.5, alpha: zoneAlpha });
        g.circle(endX, endY + 5, 20 * t);
        g.stroke();
      }
    }
  }
}
