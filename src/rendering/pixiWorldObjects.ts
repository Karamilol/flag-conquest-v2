/**
 * PixiWorldObjects — Bridges Canvas2D world object rendering to Pixi.
 *
 * World objects (flags, chests, bosses, barricades, portals, mining camp, etc.)
 * are drawn with ~1800 lines of procedural Canvas2D code. Rather than rewriting
 * everything to Pixi Graphics (high effort, high regression risk), we render
 * to an offscreen Canvas2D and upload the result as a Pixi texture each frame.
 *
 * This eliminates the visible Canvas2D overlay while reusing all existing code.
 */

import { Container, Sprite, Texture, ImageSource } from 'pixi.js';
import { VIEWPORT_W, VIEWPORT_H, DISPLAY_W, DISPLAY_H } from '../constants';
import { drawWorldObjects } from './worldRenderer';
import type { GameState } from '../types';

export class PixiWorldObjectRenderer {
  readonly container: Container;
  private sprite: Sprite;
  private offscreen: HTMLCanvasElement;
  private offCtx: CanvasRenderingContext2D;
  private texture: Texture | null = null;
  private source: ImageSource | null = null;
  private bufW: number;
  private bufH: number;
  private drawScale: number;

  constructor() {
    this.container = new Container();
    this.sprite = new Sprite();
    this.container.addChild(this.sprite);

    // Render at full display resolution (same as main Canvas2D buffer)
    // so world objects are crisp, not blurry from upscaling.
    const dpr = window.devicePixelRatio || 1;
    this.bufW = Math.ceil(DISPLAY_W * dpr);
    this.bufH = Math.ceil(DISPLAY_H * dpr);
    this.drawScale = this.bufW / VIEWPORT_W;

    this.offscreen = document.createElement('canvas');
    this.offscreen.width = this.bufW;
    this.offscreen.height = this.bufH;
    this.offCtx = this.offscreen.getContext('2d')!;

    // Create texture from the high-res offscreen canvas
    this.source = new ImageSource({
      resource: this.offscreen,
      scaleMode: 'linear',
    });
    this.texture = new Texture({ source: this.source });
    this.sprite.texture = this.texture;

    // The stage is scaled by (DISPLAY_W*dpr)/VIEWPORT_W. Our texture is
    // bufW×bufH pixels. Without override, Pixi would treat the sprite as
    // bufW units wide, then stage scale would blow it up further.
    // Set explicit size in viewport coords so it maps 1:1 to the screen.
    this.sprite.width = VIEWPORT_W;
    this.sprite.height = VIEWPORT_H;
    this.sprite.position.set(0, 0);
  }

  render(game: GameState, camX: number, frame: number): void {
    const ctx = this.offCtx;

    // Clear at buffer resolution
    ctx.clearRect(0, 0, this.bufW, this.bufH);

    ctx.save();
    // Apply same scale as main Canvas2D: buffer_width / VIEWPORT_W
    // so drawWorldObjects draws in viewport coords at display resolution
    ctx.scale(this.drawScale, this.drawScale);

    drawWorldObjects(ctx, game, camX, frame);

    ctx.restore();

    // Upload the updated canvas to the GPU
    if (this.source) {
      this.source.update();
    }
  }

  destroy(): void {
    if (this.texture) {
      this.texture.destroy(true);
      this.texture = null;
    }
    this.source = null;
  }
}
