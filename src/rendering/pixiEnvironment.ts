/**
 * Pixi environment renderer — renders sky gradient + tile layers as Pixi sprites.
 * Replaces the Canvas2D drawSky + tileCache.drawMountains/Treeline/Ground calls.
 *
 * Animated overlays (atmosphere, weather, campfire) stay on Canvas2D for now.
 */

import { Container, Sprite, Graphics, Texture, ImageSource } from 'pixi.js';
import type { Biome } from '../constants';
import { VIEWPORT_W, VIEWPORT_H, GROUND_Y, DISPLAY_W } from '../constants';
import {
  TILE_W, MTN_TILE_H, TREE_TILE_H, GND_TILE_H, GND_TILE_Y0,
} from './environmentSVG';
import type { TileCache } from './tileRenderer';
import { BIOME_COLORS, DUNGEON_COLORS, computeBiomeBlend, lerpColorObj } from '../biomeUtils';

const WORLD_Y_OFFSET = VIEWPORT_H - 370;

// ── Texture cache for tile images ──────────────────────────────
// Canvas2D re-rasterizes SVGs at the current transform's target resolution on
// every drawImage() call. Pixi uploads them as fixed-resolution bitmap textures.
// To match Canvas2D quality we pre-rasterize the SVG HTMLImageElement onto an
// offscreen canvas at display resolution before uploading as a WebGL texture.
const tileTextureCache = new WeakMap<HTMLImageElement, Texture>();

// Scale factor from viewport coords → display buffer pixels (computed once)
const TILE_RASTER_SCALE = (() => {
  const dpr = window.devicePixelRatio || 1;
  return (DISPLAY_W * dpr) / VIEWPORT_W;
})();

function getOrCreateTexture(img: HTMLImageElement): Texture {
  let tex = tileTextureCache.get(img);
  if (tex) return tex;

  // Re-rasterize SVG image at display resolution to avoid GPU upscale blur.
  // The SVG source in the HTMLImageElement gets re-rasterized by the browser
  // at the target canvas size, giving us full-resolution pixels.
  const w = Math.ceil(img.naturalWidth * TILE_RASTER_SCALE);
  const h = Math.ceil(img.naturalHeight * TILE_RASTER_SCALE);
  const offscreen = document.createElement('canvas');
  offscreen.width = w;
  offscreen.height = h;
  const ctx = offscreen.getContext('2d')!;
  ctx.drawImage(img, 0, 0, w, h);

  const source = new ImageSource({ resource: offscreen, scaleMode: 'linear' });
  tex = new Texture({ source });
  tileTextureCache.set(img, tex);
  return tex;
}

// ── Sprite Pool (lightweight, for tile sprites) ────────────────
class TileSpritePool {
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
}

// ── Sky gradient helper ────────────────────────────────────────
// Render a 3-stop vertical gradient to a 1x256 canvas, then upload as texture.
let skyCanvas: HTMLCanvasElement | null = null;
let skyTexture: Texture | null = null;
let lastSkyKey = '';

function getSkyTexture(sky: { top: string; mid: string; bot: string }): Texture {
  const key = `${sky.top}|${sky.mid}|${sky.bot}`;
  if (key === lastSkyKey && skyTexture) return skyTexture;

  if (!skyCanvas) {
    skyCanvas = document.createElement('canvas');
    skyCanvas.width = 1;
    skyCanvas.height = 256;
  }
  const ctx = skyCanvas.getContext('2d')!;
  const grad = ctx.createLinearGradient(0, 0, 0, 256);
  grad.addColorStop(0, sky.top);
  grad.addColorStop(0.6, sky.mid);
  grad.addColorStop(1, sky.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1, 256);

  // Destroy old texture source if it exists
  if (skyTexture) {
    skyTexture.source.destroy();
  }
  const source = new ImageSource({ resource: skyCanvas, scaleMode: 'linear' });
  skyTexture = new Texture({ source });
  lastSkyKey = key;
  return skyTexture;
}

// ── Dungeon mountain (simple Canvas2D gradient → Pixi graphics) ──
// For wave dungeon mountains, we draw simple gradient polygons
function drawDungeonMountainsToGraphics(
  g: Graphics,
  camX: number,
  colors: { back: string; front: string },
  worldYOffset: number,
): void {
  const parallax = camX * 0.3;
  const gy = GROUND_Y + worldYOffset;

  // Back range
  g.fill({ color: colors.back, alpha: 0.6 });
  g.moveTo(-10, gy);
  for (let x = -10; x <= VIEWPORT_W + 10; x += 40) {
    const wx = x + parallax;
    const h = 60 + Math.sin(wx * 0.003) * 25 + Math.sin(wx * 0.007 + 1) * 15;
    g.lineTo(x, gy - h);
  }
  g.lineTo(VIEWPORT_W + 10, gy);
  g.closePath();
  g.fill();

  // Front range
  g.fill({ color: colors.front, alpha: 0.8 });
  g.moveTo(-10, gy);
  for (let x = -10; x <= VIEWPORT_W + 10; x += 30) {
    const wx = x + parallax * 1.2;
    const h = 40 + Math.sin(wx * 0.005 + 2) * 20 + Math.sin(wx * 0.012 + 3) * 10;
    g.lineTo(x, gy - h);
  }
  g.lineTo(VIEWPORT_W + 10, gy);
  g.closePath();
  g.fill();
}

// ── Main environment layer ─────────────────────────────────────

export class PixiEnvironmentLayer {
  readonly container: Container;

  // Sub-containers
  private skySprite: Sprite;
  private mountainContainer: Container;
  private treelineContainer: Container;
  private groundContainer: Container;
  private sanctuarySprite: Sprite;
  private dungeonMtnGraphics: Graphics;

  // Sprite pools for tile layers
  private mountainPool: TileSpritePool;
  private treelinePool: TileSpritePool;
  private groundPool: TileSpritePool;

  constructor() {
    this.container = new Container();

    // Sky (stretched 1px gradient)
    this.skySprite = new Sprite();
    this.skySprite.width = VIEWPORT_W;
    this.skySprite.height = VIEWPORT_H;
    this.container.addChild(this.skySprite);

    // Dungeon mountain graphics (only visible in wave dungeon)
    this.dungeonMtnGraphics = new Graphics();
    this.dungeonMtnGraphics.visible = false;
    this.container.addChild(this.dungeonMtnGraphics);

    // Parallax tile layers
    this.mountainContainer = new Container();
    this.treelineContainer = new Container();
    this.groundContainer = new Container();
    this.container.addChild(this.mountainContainer, this.treelineContainer, this.groundContainer);

    this.mountainPool = new TileSpritePool(this.mountainContainer);
    this.treelinePool = new TileSpritePool(this.treelineContainer);
    this.groundPool = new TileSpritePool(this.groundContainer);

    // Sanctuary (static SVG tile)
    this.sanctuarySprite = new Sprite();
    this.sanctuarySprite.visible = false;
    this.container.addChild(this.sanctuarySprite);
  }

  render(
    camX: number,
    currentZone: number,
    inDungeon: boolean,
    dungeonType: string | undefined,
    tileCache: TileCache,
  ): void {
    const isDungeon = inDungeon;
    const isTimedDung = isDungeon && dungeonType === 'timed';
    const isWaveDung = isDungeon && dungeonType === 'wave';

    // ── Resolve sky colors ──
    let sky: { top: string; mid: string; bot: string };
    let primaryBiome: Biome;
    let secondaryBiome: Biome | null = null;
    let blendPrimaryOp = 1;
    let blendSecondaryOp = 0;

    if (isTimedDung) {
      sky = DUNGEON_COLORS.timed.sky;
      primaryBiome = 'cave';
    } else if (isWaveDung) {
      sky = DUNGEON_COLORS.wave.sky;
      primaryBiome = 'cave';
    } else {
      const blend = computeBiomeBlend(camX, VIEWPORT_W);
      primaryBiome = blend.primary;
      secondaryBiome = blend.secondary;
      const blendFactor = blend.blendFactor;
      blendPrimaryOp = 1 - blendFactor;
      blendSecondaryOp = blendFactor;

      if (secondaryBiome && blendFactor > 0.01) {
        sky = lerpColorObj(BIOME_COLORS[primaryBiome].sky, BIOME_COLORS[secondaryBiome].sky, blendFactor);
      } else {
        sky = BIOME_COLORS[primaryBiome].sky;
        secondaryBiome = null;
      }
    }

    // Ensure tiles are loading
    tileCache.ensureVisible(camX, primaryBiome, secondaryBiome);

    // ── 1. Sky ──
    this.skySprite.texture = getSkyTexture(sky);

    // ── 2. Mountains ──
    this.mountainPool.reset();
    this.dungeonMtnGraphics.visible = false;

    if (isWaveDung) {
      this.dungeonMtnGraphics.visible = true;
      this.dungeonMtnGraphics.clear();
      drawDungeonMountainsToGraphics(
        this.dungeonMtnGraphics, camX,
        DUNGEON_COLORS.wave.mtn, WORLD_Y_OFFSET,
      );
    } else if (!isTimedDung) {
      this.drawTileLayer('mountain', camX, primaryBiome, blendPrimaryOp, tileCache, this.mountainPool, 0.3, MTN_TILE_H, WORLD_Y_OFFSET, 6400);
      if (secondaryBiome) {
        this.drawTileLayer('mountain', camX, secondaryBiome, blendSecondaryOp, tileCache, this.mountainPool, 0.3, MTN_TILE_H, WORLD_Y_OFFSET, 6400);
      }
    }

    // ── 3. Treeline ──
    this.treelinePool.reset();
    if (!isDungeon) {
      this.drawTileLayer('treeline', camX, primaryBiome, blendPrimaryOp, tileCache, this.treelinePool, 0.55, TREE_TILE_H, WORLD_Y_OFFSET, 12000);
      if (secondaryBiome) {
        this.drawTileLayer('treeline', camX, secondaryBiome, blendSecondaryOp, tileCache, this.treelinePool, 0.55, TREE_TILE_H, WORLD_Y_OFFSET, 12000);
      }
    }

    // ── 4. Ground ──
    this.groundPool.reset();
    if (!isDungeon) {
      this.drawGroundLayer(camX, primaryBiome, blendPrimaryOp, tileCache);
      if (secondaryBiome) {
        this.drawGroundLayer(camX, secondaryBiome, blendSecondaryOp, tileCache);
      }
    }
    // Dungeon ground is drawn by Canvas2D overlay (procedural gradients)

    // ── 5. Sanctuary ──
    if (!isDungeon) {
      const sanctImg = tileCache.getSanctuaryImage();
      if (sanctImg) {
        this.sanctuarySprite.visible = true;
        this.sanctuarySprite.texture = getOrCreateTexture(sanctImg);
        this.sanctuarySprite.position.set(-15 - camX, (GROUND_Y - 85) + WORLD_Y_OFFSET);
        this.sanctuarySprite.width = 200;
        this.sanctuarySprite.height = 110;
      } else {
        this.sanctuarySprite.visible = false;
      }
    } else {
      this.sanctuarySprite.visible = false;
    }
  }

  private drawTileLayer(
    layer: 'mountain' | 'treeline',
    camX: number,
    biome: Biome,
    opacity: number,
    tileCache: TileCache,
    pool: TileSpritePool,
    parallax: number,
    tileH: number,
    worldYOffset: number,
    worldMax: number,
  ): void {
    if (opacity < 0.01) return;
    const px = camX * parallax;
    const startIdx = Math.floor(px / TILE_W) - 1;
    const endIdx = Math.ceil((px + VIEWPORT_W) / TILE_W) + 1;

    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0 || i * TILE_W >= worldMax) continue;
      const img = tileCache.getTile(layer, biome, i);
      if (!img) continue;

      const s = pool.get();
      s.texture = getOrCreateTexture(img);
      s.position.set(i * TILE_W - px, worldYOffset);
      s.width = TILE_W;
      s.height = tileH;
      s.alpha = opacity;
    }
  }

  private drawGroundLayer(
    camX: number,
    biome: Biome,
    opacity: number,
    tileCache: TileCache,
  ): void {
    if (opacity < 0.01) return;
    const startIdx = Math.floor(camX / TILE_W) - 1;
    const endIdx = Math.ceil((camX + VIEWPORT_W) / TILE_W) + 1;

    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0) continue;
      const img = tileCache.getTile('ground', biome, i);
      if (!img) continue;

      const s = this.groundPool.get();
      s.texture = getOrCreateTexture(img);
      s.position.set(i * TILE_W - camX, GND_TILE_Y0 + WORLD_Y_OFFSET);
      s.width = TILE_W;
      s.height = GND_TILE_H;
      s.alpha = opacity;
    }
  }
}
