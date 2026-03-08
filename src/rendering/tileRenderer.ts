// SVG-to-bitmap tile cache pipeline
// Converts SVG strings from environmentSVG.ts into cached HTMLImageElements
// that can be drawn to canvas with ctx.drawImage()

import type { Biome } from '../constants';
import { VIEWPORT_W, GROUND_Y } from '../constants';
import {
  TILE_W, MTN_TILE_H, TREE_TILE_H, GND_TILE_H, GND_TILE_Y0,
  mountainTileSVG, treelineTileSVG, groundTileSVG, homeSanctuarySVG,
} from './environmentSVG';

export type LayerKey = 'mountain' | 'treeline' | 'ground';

interface TileEntry {
  img: HTMLImageElement;
  ready: boolean;
}

// Tile key: "layer:biome:tileIndex"
function tileKey(layer: LayerKey, biome: Biome, tileIdx: number): string {
  return `${layer}:${biome}:${tileIdx}`;
}

// Convert an SVG string to a loaded HTMLImageElement
function svgToImage(svgString: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svgString], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load SVG tile'));
    };
    img.src = url;
  });
}

/**
 * TileCache manages pre-rendered environment tile images.
 *
 * Usage:
 *   const cache = new TileCache();
 *   // Each frame, call ensureVisible() to trigger lazy loading of needed tiles
 *   cache.ensureVisible(camX, primaryBiome, secondaryBiome);
 *   // Then draw tiles with drawLayer()
 *   cache.drawMountains(ctx, camX, biome, opacity);
 */
export class TileCache {
  private tiles = new Map<string, TileEntry>();
  private loading = new Set<string>();
  private sanctuary: TileEntry | null = null;
  private sanctuaryLoading = false;

  // Maximum tiles to keep in cache (LRU eviction)
  private maxTiles = 60;

  /** Get a cached tile image, or null if not ready */
  getTile(layer: LayerKey, biome: Biome, tileIdx: number): HTMLImageElement | null {
    const key = tileKey(layer, biome, tileIdx);
    const entry = this.tiles.get(key);
    if (entry && entry.ready) return entry.img;
    return null;
  }

  /** Get the sanctuary image, or null if not ready */
  getSanctuaryImage(): HTMLImageElement | null {
    return this.sanctuary?.ready ? this.sanctuary.img : null;
  }

  /** Start loading a tile if not already cached or loading */
  private loadTile(layer: LayerKey, biome: Biome, tileIdx: number): void {
    const key = tileKey(layer, biome, tileIdx);
    if (this.tiles.has(key) || this.loading.has(key)) return;

    this.loading.add(key);

    // Generate SVG string
    const tileX = tileIdx * TILE_W;
    let svgString: string;
    switch (layer) {
      case 'mountain': svgString = mountainTileSVG(tileX, biome); break;
      case 'treeline': svgString = treelineTileSVG(tileX, biome); break;
      case 'ground': svgString = groundTileSVG(tileX, biome); break;
    }

    svgToImage(svgString).then(img => {
      this.loading.delete(key);
      this.tiles.set(key, { img, ready: true });
      this.evictIfNeeded();
    }).catch(() => {
      this.loading.delete(key);
    });
  }

  /** Evict least recently added tiles if over max */
  private evictIfNeeded(): void {
    if (this.tiles.size <= this.maxTiles) return;
    // Simple FIFO eviction — delete oldest entries
    const excess = this.tiles.size - this.maxTiles;
    const keys = this.tiles.keys();
    for (let i = 0; i < excess; i++) {
      const k = keys.next().value;
      if (k) this.tiles.delete(k);
    }
  }

  /** Ensure tiles for the visible area are loaded */
  ensureVisible(camX: number, primaryBiome: Biome, secondaryBiome: Biome | null): void {
    const biomes = [primaryBiome];
    if (secondaryBiome) biomes.push(secondaryBiome);

    for (const biome of biomes) {
      // Mountain tiles (parallax 0.3x)
      const mtnX = camX * 0.3;
      const mtnStart = Math.floor(mtnX / TILE_W) - 1;
      const mtnEnd = Math.ceil((mtnX + VIEWPORT_W) / TILE_W) + 1;
      for (let i = mtnStart; i <= mtnEnd; i++) {
        if (i >= 0 && i * TILE_W < 6400) this.loadTile('mountain', biome, i);
      }

      // Treeline tiles (parallax 0.55x)
      const treeX = camX * 0.55;
      const treeStart = Math.floor(treeX / TILE_W) - 1;
      const treeEnd = Math.ceil((treeX + VIEWPORT_W) / TILE_W) + 1;
      for (let i = treeStart; i <= treeEnd; i++) {
        if (i >= 0 && i * TILE_W < 12000) this.loadTile('treeline', biome, i);
      }

      // Ground tiles (parallax 1.0x)
      const gndStart = Math.floor(camX / TILE_W) - 1;
      const gndEnd = Math.ceil((camX + VIEWPORT_W) / TILE_W) + 1;
      for (let i = gndStart; i <= gndEnd; i++) {
        if (i >= 0 && i * TILE_W < 20000) this.loadTile('ground', biome, i);
      }
    }

    // Load sanctuary
    if (!this.sanctuary && !this.sanctuaryLoading) {
      this.sanctuaryLoading = true;
      svgToImage(homeSanctuarySVG()).then(img => {
        this.sanctuary = { img, ready: true };
        this.sanctuaryLoading = false;
      }).catch(() => {
        this.sanctuaryLoading = false;
      });
    }
  }

  /** Draw mountain layer for a biome at given opacity */
  drawMountains(
    ctx: CanvasRenderingContext2D,
    camX: number,
    biome: Biome,
    opacity: number,
    worldYOffset: number,
  ): void {
    if (opacity < 0.01) return;
    const parallaxX = camX * 0.3;
    const startIdx = Math.floor(parallaxX / TILE_W) - 1;
    const endIdx = Math.ceil((parallaxX + VIEWPORT_W) / TILE_W) + 1;

    ctx.globalAlpha = opacity;
    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0 || i * TILE_W >= 6400) continue;
      const img = this.getTile('mountain', biome, i);
      if (!img) continue;
      const drawX = i * TILE_W - parallaxX;
      ctx.drawImage(img, drawX, worldYOffset, TILE_W, MTN_TILE_H);
    }
    ctx.globalAlpha = 1;
  }

  /** Draw treeline layer for a biome at given opacity */
  drawTreeline(
    ctx: CanvasRenderingContext2D,
    camX: number,
    biome: Biome,
    opacity: number,
    worldYOffset: number,
  ): void {
    if (opacity < 0.01) return;
    const parallaxX = camX * 0.55;
    const startIdx = Math.floor(parallaxX / TILE_W) - 1;
    const endIdx = Math.ceil((parallaxX + VIEWPORT_W) / TILE_W) + 1;

    ctx.globalAlpha = opacity;
    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0 || i * TILE_W >= 12000) continue;
      const img = this.getTile('treeline', biome, i);
      if (!img) continue;
      const drawX = i * TILE_W - parallaxX;
      ctx.drawImage(img, drawX, worldYOffset, TILE_W, TREE_TILE_H);
    }
    ctx.globalAlpha = 1;
  }

  /** Draw ground layer for a biome at given opacity */
  drawGround(
    ctx: CanvasRenderingContext2D,
    camX: number,
    biome: Biome,
    opacity: number,
    worldYOffset: number,
  ): void {
    if (opacity < 0.01) return;
    const startIdx = Math.floor(camX / TILE_W) - 1;
    const endIdx = Math.ceil((camX + VIEWPORT_W) / TILE_W) + 1;

    ctx.globalAlpha = opacity;
    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0) continue;
      const img = this.getTile('ground', biome, i);
      if (!img) continue;
      const drawX = i * TILE_W - camX;
      // Ground tile viewBox starts at GND_TILE_Y0, so draw at that y + worldYOffset
      ctx.drawImage(img, drawX, GND_TILE_Y0 + worldYOffset, TILE_W, GND_TILE_H);
    }
    ctx.globalAlpha = 1;
  }

  /** Draw home sanctuary */
  drawSanctuary(
    ctx: CanvasRenderingContext2D,
    camX: number,
    worldYOffset: number,
  ): void {
    if (!this.sanctuary || !this.sanctuary.ready) return;
    // Sanctuary SVG viewBox: x=-15, y=GY-85, w=200, h=110
    const drawX = -15 - camX;
    const drawY = (GROUND_Y - 85) + worldYOffset;
    if (drawX > VIEWPORT_W + 60 || drawX + 200 < -60) return;
    ctx.drawImage(this.sanctuary.img, drawX, drawY, 200, 110);
  }

  /** Clear all cached tiles (call on zone change) */
  clear(): void {
    this.tiles.clear();
    this.loading.clear();
    // Keep sanctuary
  }
}
