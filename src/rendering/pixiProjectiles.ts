/**
 * PixiProjectiles — GPU-accelerated projectile rendering via PixiJS.
 *
 * Replaces Canvas2D drawProjectiles() + drawCastingFireballs()
 * with batched Pixi Graphics primitives.
 */

import { Container, Graphics } from 'pixi.js';
import { VIEWPORT_W, VIEWPORT_H, GAME_HEIGHT, GROUND_Y } from '../constants';
import type { GameState } from '../types';

const WORLD_Y_OFFSET = VIEWPORT_H - GAME_HEIGHT;

export class PixiProjectileRenderer {
  readonly container: Container;
  private gfx: Graphics;

  constructor() {
    this.container = new Container();
    this.gfx = new Graphics();
    this.container.addChild(this.gfx);
  }

  render(game: GameState, camX: number, frame: number): void {
    const g = this.gfx;
    g.clear();

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
          this.drawArrow(g, sx, sy, false);
          break;
        case 'allyArrow':
          this.drawArrow(g, sx, sy, true);
          break;
        case 'heroArrow':
          this.drawHeroArrow(g, sx, sy);
          break;
        case 'fireball':
          this.drawFireball(g, sx, sy);
          break;
        case 'iceball':
          this.drawIceball(g, sx, sy);
          break;
        case 'wizardBeam':
          this.drawWizardBeam(g, sx, sy);
          break;
        case 'boss':
          this.drawBossProjectile(g, sx, sy);
          break;
        case 'heroRanged':
          this.drawHeroRanged(g, sx, sy);
          break;
        case 'clericBolt':
          this.drawClericBolt(g, sx, sy);
          break;
        case 'clericChain':
          this.drawClericChain(g, sx, sy);
          break;
        case 'crystalBolt':
          this.drawCrystalBolt(g, sx, sy);
          break;
        case 'bombardShot':
          this.drawBombardShot(g, sx, sy);
          break;
        case 'laser':
          this.drawLaser(g, (p.targetX ?? px) - camX, p.radius || 50, p.duration ?? 30, 0x44aa22, 0x66cc44);
          break;
        case 'spectralBlast':
          this.drawLaser(g, (p.targetX ?? px) - camX, p.radius || 60, p.duration ?? 30, 0x6622aa, 0x8844cc);
          break;
        case 'meteorStrike':
          this.drawLaser(g, (p.targetX ?? px) - camX, p.radius || 120, p.duration ?? 60, 0xff4400, 0xff6600);
          break;
        case 'healBeam':
          this.drawVerticalBeam(g, sx, sy, p.duration ?? 30, 0x4aff4a, 0xaaffaa);
          break;
        case 'darkHeal':
          this.drawVerticalBeam(g, sx, sy, p.duration ?? 30, 0x6622aa, 0xaa55ff);
          break;
        case 'chainLightning':
          this.drawChainLightning(g, p.chainTargets, camX, p.duration ?? 30);
          break;
      }
    }

    // Casting fireballs (flame callers + fire imps)
    this.drawCastingFireballs(g, game, camX, frame);
  }

  // ── Arrow ──────────────────────────────────────────────────────
  private drawArrow(g: Graphics, x: number, y: number, isAlly: boolean): void {
    const dir = isAlly ? 1 : -1;
    const shaftColor = isAlly ? 0x5a8b5a : 0x8b5a2a;
    const headColor = isAlly ? 0x77ff77 : 0x666666;
    // Shaft (trails behind the tip)
    g.stroke({ color: shaftColor, width: 2 });
    g.moveTo(x, y);
    g.lineTo(x - 15 * dir, y);
    g.stroke();
    // Arrowhead (points in direction of travel)
    g.fill({ color: headColor });
    g.moveTo(x + 6 * dir, y);
    g.lineTo(x, y - 3);
    g.lineTo(x, y + 3);
    g.closePath();
    g.fill();
  }

  // ── Hero Arrow ─────────────────────────────────────────────────
  private drawHeroArrow(g: Graphics, x: number, y: number): void {
    // Shaft
    g.stroke({ color: 0x6b4226, width: 2 });
    g.moveTo(x, y);
    g.lineTo(x + 18, y);
    g.stroke();
    // Arrowhead
    g.fill({ color: 0xaaaaaa });
    g.moveTo(x + 18, y - 3);
    g.lineTo(x + 24, y);
    g.lineTo(x + 18, y + 3);
    g.closePath();
    g.fill();
    // Fletching
    g.stroke({ color: 0x4a8f3f, width: 1.5 });
    g.moveTo(x, y);
    g.lineTo(x - 4, y - 4);
    g.moveTo(x + 2, y);
    g.lineTo(x - 2, y + 4);
    g.stroke();
  }

  // ── Fireball ───────────────────────────────────────────────────
  private drawFireball(g: Graphics, x: number, y: number): void {
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
  private drawIceball(g: Graphics, x: number, y: number): void {
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
  private drawWizardBeam(g: Graphics, x: number, y: number): void {
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
  private drawBossProjectile(g: Graphics, x: number, y: number): void {
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
  private drawHeroRanged(g: Graphics, x: number, y: number): void {
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
  private drawClericBolt(g: Graphics, x: number, y: number): void {
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
  private drawClericChain(g: Graphics, x: number, y: number): void {
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
  private drawCrystalBolt(g: Graphics, x: number, y: number): void {
    // Diamond shape
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

  // ── Bombard Shot ───────────────────────────────────────────────
  private drawBombardShot(g: Graphics, x: number, y: number): void {
    // Smoke trail
    g.fill({ color: 0x777777, alpha: 0.3 });
    g.circle(x - 8, y + 3, 4);
    g.fill();
    g.fill({ color: 0x666666, alpha: 0.2 });
    g.circle(x - 14, y + 5, 3);
    g.fill();
    g.fill({ color: 0x555555, alpha: 0.12 });
    g.circle(x - 20, y + 6, 2.5);
    g.fill();
    // Cannonball
    g.fill({ color: 0x555555 });
    g.circle(x, y, 7);
    g.fill();
    g.fill({ color: 0x888888, alpha: 0.6 });
    g.circle(x - 2, y - 2, 3);
    g.fill();
    // Fuse spark
    g.fill({ color: 0xff6600 });
    g.circle(x + 4, y - 5, 2.5);
    g.fill();
    g.fill({ color: 0xffdd00 });
    g.circle(x + 5, y - 6, 1.5);
    g.fill();
  }

  // ── Laser (used for laser, spectralBlast, meteorStrike) ────────
  private drawLaser(
    g: Graphics,
    targetX: number,
    radius: number,
    duration: number,
    color1: number,
    color2: number,
  ): void {
    const opacity = Math.min(1, duration / 15);
    const groundY = GROUND_Y + WORLD_Y_OFFSET;

    // Vertical beams
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

    // Impact zone
    g.fill({ color: color1, alpha: opacity * 0.25 });
    g.circle(targetX, groundY - 10, radius);
    g.fill();
    g.fill({ color: color2, alpha: opacity * 0.3 });
    g.circle(targetX, groundY - 10, radius * 0.6);
    g.fill();

    // Top glow
    g.fill({ color: color1, alpha: opacity * 0.4 });
    g.circle(targetX, 20, 12);
    g.fill();
  }

  // ── Vertical Beam (healBeam, darkHeal) ─────────────────────────
  private drawVerticalBeam(
    g: Graphics,
    x: number,
    y: number,
    duration: number,
    color1: number,
    color2: number,
  ): void {
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
    g: Graphics,
    chainTargets: Array<{ x: number; y: number }> | undefined,
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
      const seed = (prev.x * 7 + pt.x * 13 + i * 31) % 16 - 8;
      const midX = (px + cx) / 2 + seed;
      const midY = (py + cy) / 2 + seed * 0.5;

      // Outer glow
      g.stroke({ color: 0x4488ff, width: 4, alpha: opacity * 0.3 });
      g.moveTo(px, py);
      g.lineTo(midX, midY);
      g.lineTo(cx, cy);
      g.stroke();
      // Core bolt
      g.stroke({ color: 0x88ccff, width: 2, alpha: opacity });
      g.moveTo(px, py);
      g.lineTo(midX, midY);
      g.lineTo(cx, cy);
      g.stroke();
      // Bright center
      g.stroke({ color: 0xffffff, width: 1, alpha: opacity * 0.8 });
      g.moveTo(px, py);
      g.lineTo(midX, midY);
      g.lineTo(cx, cy);
      g.stroke();
      // Hit spark
      g.fill({ color: 0x88ccff, alpha: opacity * 0.5 });
      g.circle(cx, cy, 4);
      g.fill();
      g.fill({ color: 0xffffff, alpha: opacity * 0.7 });
      g.circle(cx, cy, 2);
      g.fill();
    }
  }

  // ── Casting Fireballs (in-flight from flame callers / fire imps) ──
  private drawCastingFireballs(g: Graphics, game: GameState, camX: number, frame: number): void {
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
