/**
 * PixiRenderer — WebGL-accelerated rendering backend using PixiJS v8.
 *
 * Replaces Canvas2D drawEntities() with GPU-batched sprite rendering.
 * Migration is incremental: during transition, both Canvas2D and Pixi
 * can coexist with Pixi behind and Canvas2D on top (transparent).
 *
 * Usage in GameView.tsx:
 *   const renderer = new PixiRenderer();
 *   await renderer.init(containerDiv);
 *   // Each frame:
 *   renderer.render(game, camX, frame, options);
 *   // Cleanup:
 *   renderer.destroy();
 */

import {
  Application,
  Container,
  Text,
  TextStyle,
} from 'pixi.js';
import type { GameState } from '../types';
import { VIEWPORT_W, DISPLAY_W, DISPLAY_H } from '../constants';
import type { TileCache } from './tileRenderer';
import { PixiEnvironmentLayer } from './pixiEnvironment';
import { PixiUnitRenderer } from './pixiUnits';
import { PixiProjectileRenderer } from './pixiProjectiles';
import { PixiWorldObjectRenderer } from './pixiWorldObjects';
import { PixiParticleRenderer } from './pixiParticles';
import { perf } from '../utils/perfProfiler';

export interface PixiRenderOptions {
  showHpNumbers: boolean;
  heroClass: string;
  killParticles: boolean;
  tileCache: TileCache;
}

// ── Main Renderer ────────────────────────────────────────────

export class PixiRenderer {
  app: Application | null = null;
  private initialized = false;

  // Scene graph layers (ordered back-to-front)
  private envLayer!: PixiEnvironmentLayer;
  private environmentLayer!: Container;
  private unitRenderer!: PixiUnitRenderer;
  private projectileRenderer!: PixiProjectileRenderer;
  private worldObjectRenderer!: PixiWorldObjectRenderer;
  private particleRenderer!: PixiParticleRenderer;

  // FPS display
  private fpsText!: Text;

  async init(container: HTMLElement): Promise<HTMLCanvasElement> {
    const dpr = window.devicePixelRatio || 1;
    const app = new Application();

    // Match Canvas2D exactly:
    // Canvas2D buffer = DISPLAY_W*dpr × DISPLAY_H*dpr, CSS = DISPLAY_W × DISPLAY_H
    // Canvas2D applies ctx.scale(buffer_width / VIEWPORT_W) then draws in VIEWPORT coords.
    // Pixi: set buffer to same size, work in VIEWPORT coords via stage scale.
    await app.init({
      width: DISPLAY_W * dpr,
      height: DISPLAY_H * dpr,
      resolution: 1, // we handle DPR ourselves via buffer size
      autoDensity: false,
      backgroundAlpha: 1,
      antialias: false,
      roundPixels: true,
      preference: 'webgl',
    });

    this.app = app;

    // Set default texture scale mode for all new textures
    // (Pixi v8 doesn't have a global default, so we set it per-texture in the cache)

    container.appendChild(app.canvas);

    // CSS size matches Canvas2D
    app.canvas.style.position = 'absolute';
    app.canvas.style.top = '0';
    app.canvas.style.left = '0';
    app.canvas.style.width = `${DISPLAY_W}px`;
    app.canvas.style.height = `${DISPLAY_H}px`;
    app.canvas.style.imageRendering = 'pixelated';

    // Build scene graph
    this.buildSceneGraph();
    this.initialized = true;

    return app.canvas;
  }

  private buildSceneGraph(): void {
    const stage = this.app!.stage;

    // Match Canvas2D: ctx.scale(canvas.width / VIEWPORT_W, ...)
    // Buffer is DISPLAY_W*dpr pixels, VIEWPORT_W logical coords → scale = DISPLAY_W*dpr / VIEWPORT_W
    const dpr = window.devicePixelRatio || 1;
    const scale = (DISPLAY_W * dpr) / VIEWPORT_W;
    stage.scale.set(scale, scale);

    // Layers (z-order = add order)
    this.envLayer = new PixiEnvironmentLayer();
    this.environmentLayer = this.envLayer.container;
    this.worldObjectRenderer = new PixiWorldObjectRenderer();
    this.unitRenderer = new PixiUnitRenderer();
    this.projectileRenderer = new PixiProjectileRenderer();
    this.particleRenderer = new PixiParticleRenderer();

    stage.addChild(
      this.environmentLayer,
      this.worldObjectRenderer.container,
      this.unitRenderer.container,   // includes auras, sprites, health bars
      this.projectileRenderer.container,
      this.particleRenderer.container,
    );

    // FPS counter (top-right)
    this.fpsText = new Text({
      text: '',
      style: new TextStyle({ fontFamily: 'monospace', fontSize: 9, fill: '#ffffff' }),
    });
    this.fpsText.position.set(VIEWPORT_W - 50, 4);
    this.fpsText.visible = false;
    stage.addChild(this.fpsText);
  }

  /**
   * Main render entry point. Called once per animation frame from GameView's rAF loop.
   * Replaces drawEntities() from canvasRenderer.ts.
   */
  render(
    game: GameState,
    camX: number,
    frame: number,
    options: PixiRenderOptions,
  ): void {
    if (!this.initialized || !this.app) return;

    perf.begin('pixi.render');

    // Phase 1: Environment (sky + tile layers)
    perf.begin('pixi.environment');
    this.envLayer.render(
      camX,
      game.currentZone,
      game.inDungeon || false,
      (game as any).dungeonType,
      options.tileCache,
    );
    perf.end('pixi.environment');

    // Phase 2: Units (allies, enemies, hero, auras, health bars)
    perf.begin('pixi.units');
    this.unitRenderer.render(game, camX, frame, options.showHpNumbers, options.heroClass);
    perf.end('pixi.units');

    // Phase 3: World objects (offscreen Canvas2D → Pixi texture)
    perf.begin('pixi.worldObjects');
    this.worldObjectRenderer.render(game, camX, frame);
    perf.end('pixi.worldObjects');

    // Phase 4: Projectiles
    perf.begin('pixi.projectiles');
    this.projectileRenderer.render(game, camX, frame);
    perf.end('pixi.projectiles');

    // Phase 5: Particles (damage numbers)
    perf.begin('pixi.particles');
    this.particleRenderer.render(game, camX);
    perf.end('pixi.particles');

    perf.end('pixi.render');
  }

  /** Update FPS display */
  showFps(fps: number): void {
    if (!this.fpsText) return;
    this.fpsText.visible = true;
    this.fpsText.text = `${fps.toFixed(0)} fps`;
  }

  hideFps(): void {
    if (this.fpsText) this.fpsText.visible = false;
  }

  /** Clean up everything */
  destroy(): void {
    if (this.app) {
      this.app.destroy(true, { children: true, texture: true });
      this.app = null;
    }
    this.initialized = false;
  }

  get canvas(): HTMLCanvasElement | null {
    return this.app?.canvas as HTMLCanvasElement ?? null;
  }

  get isReady(): boolean {
    return this.initialized;
  }
}
