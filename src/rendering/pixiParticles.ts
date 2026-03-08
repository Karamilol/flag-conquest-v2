/**
 * PixiParticles — GPU-accelerated damage number / text particle rendering.
 *
 * Replaces Canvas2D drawParticle() with Pixi Text pool.
 */

import { Container, Text, TextStyle, Graphics } from 'pixi.js';
import { VIEWPORT_W, VIEWPORT_H, GAME_HEIGHT, DISPLAY_W } from '../constants';
import type { GameState } from '../types';

const WORLD_Y_OFFSET = VIEWPORT_H - GAME_HEIGHT;

// Text scale for crisp rendering (same approach as pixiUnits.ts)
const TEXT_SCALE = (() => {
  const dpr = window.devicePixelRatio || 1;
  return (DISPLAY_W * dpr) / VIEWPORT_W;
})();
const INV_TEXT_SCALE = 1 / TEXT_SCALE;

const normalStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: Math.round(12 * TEXT_SCALE),
  fontWeight: 'bold',
  fill: '#ffffff',
});

const critStyle = new TextStyle({
  fontFamily: 'monospace',
  fontSize: Math.round(16 * TEXT_SCALE),
  fontWeight: 'bold',
  fill: '#ffdd00',
});

class TextParticlePool {
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
      t.style = style;
    } else {
      t = new Text({ text: '', style });
      this.pool.push(t);
      this.parent.addChild(t);
    }
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

export class PixiParticleRenderer {
  readonly container: Container;
  private textPool: TextParticlePool;

  constructor() {
    this.container = new Container();
    this.textPool = new TextParticlePool(this.container);
  }

  render(game: GameState, camX: number): void {
    this.textPool.reset();

    const cullLeft = camX - 50;
    const cullRight = camX + VIEWPORT_W + 50;

    for (const p of (game.particles || []) as any[]) {
      if (p.x < cullLeft || p.x > cullRight) continue;

      const opacity = Math.max(0, 1 - p.age / 90);
      if (opacity <= 0) continue;

      const dx = p.x + p.age * p.driftX - camX;
      const dy = p.y - p.age * 0.5 + WORLD_Y_OFFSET;

      const style = p.isCrit ? critStyle : normalStyle;
      const t = this.textPool.get(style);
      t.text = p.text;
      t.style.fill = p.isCrit ? '#ffdd00' : p.color;
      t.alpha = opacity;
      t.position.set(dx, dy);
    }
  }
}
