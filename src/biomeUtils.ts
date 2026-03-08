import type { Biome } from './constants';
import { VIEWPORT_W } from './constants';

// ── Biome color palettes ──────────────────────────────────────────
export const BIOME_COLORS: Record<Biome, {
  sky: { top: string; mid: string; bot: string };
  mtn: { back: string; front: string };
  gnd: { top: string; bot: string };
  grass: string;
}> = {
  forest: {
    sky: { top: '#1a4a42', mid: '#1a4a3a', bot: '#1a4435' },
    mtn: { back: '#1a3a1a', front: '#2a4a2a' },
    gnd: { top: '#4a6a3a', bot: '#3a5a2a' },
    grass: '#5a8a4a',
  },
  cave: {
    sky: { top: '#1a1008', mid: '#2a1a10', bot: '#3a2818' },
    mtn: { back: '#3a2a1a', front: '#4a3828' },
    gnd: { top: '#4a3a2a', bot: '#3a2a1a' },
    grass: '#5a4a38',
  },
  nordic: {
    sky: { top: '#0a1520', mid: '#152535', bot: '#1a3040' },
    mtn: { back: '#1a2535', front: '#253545' },
    gnd: { top: '#3a4858', bot: '#2a3848' },
    grass: '#4a5868',
  },
  volcanic: {
    sky: { top: '#1a0400', mid: '#3a1000', bot: '#5a2200' },
    mtn: { back: '#4a4038', front: '#5a4a42' },
    gnd: { top: '#3a2010', bot: '#2a1408' },
    grass: '#5a3018',
  },
};

// Dungeon color overrides (not chunk-based, applied globally)
export const DUNGEON_COLORS = {
  timed: {
    sky: { top: '#0e0806', mid: '#1a1008', bot: '#1e150c' },
    mtn: { back: '#1a1208', front: '#251a10' },
    gnd: { top: '#3a2a18', bot: '#2a1a10' },
    grass: '#4a3a28',
  },
  wave: {
    sky: { top: '#0a0518', mid: '#150a28', bot: '#1a0e30' },
    mtn: { back: '#1a0a2a', front: '#251538' },
    gnd: { top: '#3a2a4a', bot: '#2a1a38' },
    grass: '#4a3a5a',
  },
};

// ── Biome boundaries ──────────────────────────────────────────────
export interface BiomeBoundary {
  x: number;
  from: Biome;
  to: Biome;
}

export const BIOME_BOUNDARIES: BiomeBoundary[] = [
  { x: 5300, from: 'forest', to: 'cave' },
  { x: 9700, from: 'cave', to: 'nordic' },
  { x: 14100, from: 'nordic', to: 'volcanic' },
];

export const BLEND_ZONE = 300; // px of gradient transition

// ── Position-based biome lookup ───────────────────────────────────
export function getBiomeAtX(worldX: number): Biome {
  if (worldX < 5300) return 'forest';
  if (worldX < 9700) return 'cave';
  if (worldX < 14100) return 'nordic';
  return 'volcanic';
}

// ── Viewport biome blend ──────────────────────────────────────────
export interface BiomeBlendInfo {
  primary: Biome;
  secondary: Biome | null;
  blendFactor: number; // 0 = fully primary, 1 = fully secondary
}

export function computeBiomeBlend(cameraX: number, viewportW: number): BiomeBlendInfo {
  const camCenter = cameraX + viewportW / 2;
  const halfZone = BLEND_ZONE / 2;

  for (const boundary of BIOME_BOUNDARIES) {
    const dist = camCenter - boundary.x;
    if (dist > -halfZone && dist < halfZone) {
      const t = (dist + halfZone) / BLEND_ZONE; // 0→1 across blend zone
      return { primary: boundary.from, secondary: boundary.to, blendFactor: t };
    }
  }

  return { primary: getBiomeAtX(camCenter), secondary: null, blendFactor: 0 };
}

// ── Color interpolation ──────────────────────────────────────────
export function lerpColor(hex1: string, hex2: string, t: number): string {
  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);
  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Helper: blend a color pair {top,bot} or {back,front} etc.
export function lerpColorObj<K extends string>(
  a: Record<K, string>,
  b: Record<K, string>,
  t: number,
): Record<K, string> {
  const result = {} as Record<K, string>;
  for (const key of Object.keys(a) as K[]) {
    result[key] = lerpColor(a[key], b[key], t);
  }
  return result;
}

// ── Decoration biome with blend-zone mixing ──────────────────────
// Returns a deterministic biome for a decoration at world-x,
// with probabilistic mixing in the blend zone.
export function getDecorationBiome(x: number): Biome {
  const halfZone = BLEND_ZONE / 2;
  for (const boundary of BIOME_BOUNDARIES) {
    if (x > boundary.x - halfZone && x < boundary.x + halfZone) {
      const t = (x - (boundary.x - halfZone)) / BLEND_ZONE;
      // Deterministic pseudo-random from position
      const seed = ((Math.sin(x * 12.9898) * 43758.5453) % 1 + 1) % 1;
      return seed < t ? boundary.to : boundary.from;
    }
  }
  return getBiomeAtX(x);
}
