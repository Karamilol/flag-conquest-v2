/**
 * PixiTextureCache — Converts existing HTMLImageElement sprite caches
 * and blob URL images into Pixi Textures for GPU-accelerated rendering.
 *
 * Wraps the existing imageCache pattern: blob URL → HTMLImageElement → PIXI.Texture
 */

import { Texture, ImageSource } from 'pixi.js';

// Global texture cache: blob URL → Pixi Texture
const textureCache = new Map<string, Texture>();
const pendingLoads = new Set<string>();

/**
 * Get or create a Pixi Texture from a blob URL.
 * Returns null if the image hasn't loaded yet (same pattern as Canvas2D getImage).
 */
export function getTexture(url: string): Texture | null {
  if (!url) return null;

  const cached = textureCache.get(url);
  if (cached) return cached;
  if (pendingLoads.has(url)) return null;

  // Load image and create texture on completion
  pendingLoads.add(url);
  const img = new Image();
  img.onload = () => {
    const source = new ImageSource({ resource: img, alphaMode: 'premultiply-alpha-on-upload', scaleMode: 'nearest' });
    const texture = new Texture({ source });
    textureCache.set(url, texture);
    pendingLoads.delete(url);
  };
  img.onerror = () => pendingLoads.delete(url);
  img.src = url;
  return null;
}

/**
 * Create a Pixi Texture from an already-loaded HTMLImageElement.
 * Useful for tile cache entries that are already loaded.
 */
export function textureFromImage(img: HTMLImageElement, cacheKey?: string): Texture {
  if (cacheKey) {
    const cached = textureCache.get(cacheKey);
    if (cached) return cached;
  }

  const source = new ImageSource({ resource: img, alphaMode: 'premultiply-alpha-on-upload' });
  const texture = new Texture({ source });

  if (cacheKey) {
    textureCache.set(cacheKey, texture);
  }
  return texture;
}

/**
 * Check if a texture is ready (loaded and cached).
 */
export function hasTexture(url: string): boolean {
  return textureCache.has(url);
}

/**
 * Get total number of cached textures (for diagnostics).
 */
export function textureCount(): number {
  return textureCache.size;
}
