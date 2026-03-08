// SVG template functions for environment layers
// Generates SVG markup strings that get rendered to bitmap tiles
// Ported faithfully from flag-conquest GameCanvas.tsx SVG rendering

import type { Biome } from '../constants';
import { GROUND_Y, GAME_HEIGHT } from '../constants';
import { BIOME_COLORS, getBiomeAtX, BIOME_BOUNDARIES, BLEND_ZONE } from '../biomeUtils';

export const TILE_W = 1024;
export const MTN_TILE_H = 400;
export const TREE_TILE_H = 400;
export const GND_TILE_H = 100;
export const GND_TILE_Y0 = 300; // viewBox y start for ground tiles

// ── Shared helpers ───────────────────────────────────────────────

function sineHeight(x: number, seed: number, amp: number): number {
  return amp * Math.max(0,
    0.45 * Math.sin(x * 0.0052 + seed) +
    0.30 * Math.sin(x * 0.0137 + seed * 1.7) +
    0.15 * Math.sin(x * 0.0031 + seed * 0.5) +
    0.10 * Math.sin(x * 0.0243 + seed * 2.3)
  );
}

function wrap(content: string, tileX: number, tileW: number, vbY: number, vbH: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tileW}" height="${vbH}" viewBox="${tileX} ${vbY} ${tileW} ${vbH}">${content}</svg>`;
}

// Interpolate y on a piecewise-linear polygon for a given x
function interpPoly(pts: [number, number][], x: number, fallback = 280): number {
  for (let i = 0; i < pts.length - 1; i++) {
    if (x >= pts[i][0] && x <= pts[i + 1][0]) {
      const t = (x - pts[i][0]) / (pts[i + 1][0] - pts[i][0]);
      return pts[i][1] + t * (pts[i + 1][1] - pts[i][1]);
    }
  }
  return fallback;
}

// ── Hardcoded jagged mountain polygon data (from old GameCanvas) ─

const CAVE_BACK_WALL = '0,300 40,210 70,250 110,170 150,230 190,150 230,220 270,180 310,140 350,200 400,160 440,220 480,140 520,190 560,230 600,160 650,200 700,150 740,210 790,170 840,230 890,160 940,200 1000,240 1050,180 1100,220 1150,250 1200,300 1400,210 1500,250 1600,180 1700,230 1800,170 1900,220 2000,250 2200,300 2300,210 2400,250 2500,170 2600,230 2700,150 2800,220 2900,180 3000,140 3100,200 3200,160 3300,220 3400,140 3500,190 3600,230 3700,160 3800,200 3900,150 4000,210 4100,170 4200,230 4300,160 4400,200 4500,240 4600,180 4700,220 4800,250 4900,210 5000,250 5100,180 5200,230 5300,170 5400,220 5500,250 5600,300 5800,210 6000,170 6200,230 6400,300';

const CAVE_FRONT_WALL = '0,300 50,230 80,260 120,200 160,240 200,180 240,230 280,210 320,170 360,220 410,190 450,240 490,180 530,220 570,250 610,200 660,230 710,180 760,240 800,200 850,250 900,190 950,230 1000,260 1050,210 1100,240 1200,300 1400,230 1550,260 1650,200 1800,240 1950,220 2000,260 2200,300 2300,230 2400,260 2500,200 2600,240 2700,180 2800,230 2900,210 3000,170 3100,220 3200,190 3300,240 3400,180 3500,220 3600,250 3700,200 3800,230 3900,180 4000,240 4100,200 4200,250 4300,190 4400,230 4500,260 4600,210 4700,240 4800,300 5000,230 5200,200 5400,240 5600,220 5800,260 6000,240 6200,220 6400,300';

const CAVE_DEPTH_OVERLAY = '0,300 30,250 60,270 100,220 140,255 180,190 210,240 250,210 300,250 340,200 380,240 420,175 460,220 500,260 540,210 590,240 640,190 690,230 740,260 800,220 860,250 920,200 980,240 1050,260 1100,230 1200,300 1400,250 1600,220 1800,190 2000,240 2200,300 2400,250 2600,210 2800,240 3000,175 3200,220 3400,260 3600,210 3800,240 4000,190 4200,230 4400,260 4600,220 4800,250 5000,200 5200,240 5400,260 5600,230 5800,300 6000,240 6200,220 6400,300';

const VOLCANIC_REAR_RANGE = '0,300 30,160 80,200 130,120 180,180 240,100 300,170 370,130 430,190 500,110 560,160 620,130 700,180 770,100 850,150 920,120 1000,190 1080,140 1200,300 1400,160 1550,200 1700,130 1850,180 2000,150 2200,300 2350,170 2500,120 2650,180 2800,130 2950,160 3100,100 3250,170 3400,120 3550,190 3700,110 3850,160 4000,130 4150,180 4300,100 4450,150 4600,120 4750,190 4900,140 5100,180 5300,120 5500,170 5700,200 5900,130 6100,180 6400,300';

const VOLCANIC_FRONT_RIDGE = '0,300 50,240 90,265 130,220 170,250 220,200 260,245 310,225 350,195 400,235 450,210 500,250 540,200 590,235 630,260 680,220 730,245 780,195 830,250 880,215 930,260 980,210 1030,245 1100,270 1150,235 1200,300 1400,245 1550,270 1650,215 1800,255 1950,235 2000,270 2200,300 2300,245 2400,270 2500,215 2600,255 2700,200 2800,245 2900,225 3000,190 3100,235 3200,210 3300,255 3400,200 3500,235 3600,265 3700,215 3800,245 3900,200 4000,255 4100,215 4200,265 4300,210 4400,245 4500,275 4600,225 4700,255 4800,270 4900,235 5100,210 5300,245 5500,265 5700,240 5900,275 6100,250 6400,300';

// Parsed polygon arrays for interpolation
const VOLCANIC_REAR_PTS: [number, number][] = [[0,300],[30,160],[80,200],[130,120],[180,180],[240,100],[300,170],[370,130],[430,190],[500,110],[560,160],[620,130],[700,180],[770,100],[850,150],[920,120],[1000,190],[1080,140],[1200,300],[1400,160],[1550,200],[1700,130],[1850,180],[2000,150],[2200,300],[2350,170],[2500,120],[2650,180],[2800,130],[2950,160],[3100,100],[3250,170],[3400,120],[3550,190],[3700,110],[3850,160],[4000,130],[4150,180],[4300,100],[4450,150],[4600,120],[4750,190],[4900,140],[5100,180],[5300,120],[5500,170],[5700,200],[5900,130],[6100,180],[6400,300]];
const CAVE_BACK_PTS: [number, number][] = [[0,300],[40,210],[70,250],[110,170],[150,230],[190,150],[230,220],[270,180],[310,140],[350,200],[400,160],[440,220],[480,140],[520,190],[560,230],[600,160],[650,200],[700,150],[740,210],[790,170],[840,230],[890,160],[940,200],[1000,240],[1050,180],[1100,220],[1150,250],[1200,300],[1400,210],[1500,250],[1600,180],[1700,230],[1800,170],[1900,220],[2000,250],[2200,300],[2300,210],[2400,250],[2500,170],[2600,230],[2700,150],[2800,220],[2900,180],[3000,140],[3100,200],[3200,160],[3300,220],[3400,140],[3500,190],[3600,230],[3700,160],[3800,200],[3900,150],[4000,210],[4100,170],[4200,230],[4300,160],[4400,200],[4500,240],[4600,180],[4700,220],[4800,250],[4900,210],[5000,250],[5100,180],[5200,230],[5300,170],[5400,220],[5500,250],[5600,300],[5800,210],[6000,170],[6200,230],[6400,300]];
const VOLCANIC_FRONT_PTS: [number, number][] = [[0,300],[50,240],[90,265],[130,220],[170,250],[220,200],[260,245],[310,225],[350,195],[400,235],[450,210],[500,250],[540,200],[590,235],[630,260],[680,220],[730,245],[780,195],[830,250],[880,215],[930,260],[980,210],[1030,245],[1100,270],[1150,235],[1200,300],[1400,245],[1550,270],[1650,215],[1800,255],[1950,235],[2000,270],[2200,300],[2300,245],[2400,270],[2500,215],[2600,255],[2700,200],[2800,245],[2900,225],[3000,190],[3100,235],[3200,210],[3300,255],[3400,200],[3500,235],[3600,265],[3700,215],[3800,245],[3900,200],[4000,255],[4100,215],[4200,265],[4300,210],[4400,245],[4500,275],[4600,225],[4700,255],[4800,270],[4900,235],[5100,210],[5300,245],[5500,265],[5700,240],[5900,275],[6100,250],[6400,300]];

// ══════════════════════════════════════════════════════════════════
// MOUNTAIN LAYER (parallax 0.3x, world coords 0-6400)
// ══════════════════════════════════════════════════════════════════

function smoothMountainPoly(xStart: number, xEnd: number, seed: number, baseY: number, amp: number, step = 20): string {
  let pts = '';
  for (let x = xStart; x <= xEnd; x += step) {
    const h = sineHeight(x, seed, amp);
    pts += `${x},${Math.round(baseY - h)} `;
  }
  pts += `${xEnd},500 ${xStart},500`;
  return pts;
}

// Mountain trees for forest biome
function forestMountainTreesSVG(tileX: number, tileEnd: number): string {
  let svg = '';
  const margin = 60;

  // Back-range trees (tiny, faded) — seed=1.2, baseY=275, amp=150
  for (let i = 0; i < 50; i++) {
    const tx = i * 128 + 20 + (i * 53) % 35;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const baseY = 275 - sineHeight(tx, 1.2, 150) - 1;
    const h = 14 + (i * 9) % 12;
    const w = 3 + (i * 3) % 3;
    const shade = ['#0e220c', '#0a1e0a', '#0c240a', '#102810'][i % 4];
    svg += `<g opacity="0.25">
      <rect x="${tx - 0.7}" y="${baseY}" width="1.4" height="3" fill="#140a04"/>
      <polygon points="${tx - w},${baseY} ${tx},${baseY - h * 0.5} ${tx + w},${baseY}" fill="${shade}"/>
      <polygon points="${tx - w * 0.6},${baseY - h * 0.3} ${tx},${baseY - h * 0.85} ${tx + w * 0.6},${baseY - h * 0.3}" fill="${shade}"/>
    </g>`;
  }

  // Mid-range trees — seed=3.7, baseY=278, amp=140
  for (let i = 0; i < 70; i++) {
    const tx = i * 92 + 30 + (i * 43) % 25;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const baseY = 278 - sineHeight(tx, 3.7, 140) - 1;
    const h = 20 + (i * 11) % 18;
    const w = 5 + (i * 5) % 4;
    const shade = ['#142e12', '#0e260e', '#10300e', '#163214'][i % 4];
    svg += `<g opacity="0.4">
      <rect x="${tx - 1}" y="${baseY}" width="2" height="5" fill="#1a0e06"/>
      <polygon points="${tx - w},${baseY} ${tx},${baseY - h * 0.5} ${tx + w},${baseY}" fill="${shade}"/>
      <polygon points="${tx - w * 0.65},${baseY - h * 0.25} ${tx},${baseY - h * 0.8} ${tx + w * 0.65},${baseY - h * 0.25}" fill="${shade}"/>
      <polygon points="${tx - w * 0.35},${baseY - h * 0.5} ${tx},${baseY - h} ${tx + w * 0.35},${baseY - h * 0.5}" fill="${shade}"/>
    </g>`;
  }

  // Front-range trees — seed=5.4, baseY=285, amp=110
  for (let i = 0; i < 96; i++) {
    const tx = i * 67 + 10 + (i * 31) % 18;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const baseY = 285 - sineHeight(tx, 5.4, 110) - 2;
    const h = 30 + (i * 13) % 28;
    const w = 7 + (i * 7) % 6;
    const shade = ['#1a3a18', '#142e14', '#0e2810', '#1e3e1a'][i % 4];
    const op = (0.6 + (i % 5) * 0.04).toFixed(2);
    svg += `<g opacity="${op}">
      <rect x="${tx - 1.5}" y="${baseY}" width="3" height="7" fill="#2a1a0a" opacity="0.5"/>
      <rect x="${tx - 1.5}" y="${baseY - 6}" width="3" height="8" fill="#2a1a0a" opacity="0.4"/>
      <polygon points="${tx - w},${baseY} ${tx},${baseY - h * 0.45} ${tx + w},${baseY}" fill="${shade}"/>
      <polygon points="${tx - w * 0.72},${baseY - h * 0.22} ${tx},${baseY - h * 0.75} ${tx + w * 0.72},${baseY - h * 0.22}" fill="${shade}"/>
      <polygon points="${tx - w * 0.42},${baseY - h * 0.48} ${tx},${baseY - h} ${tx + w * 0.42},${baseY - h * 0.48}" fill="${shade}"/>
    </g>`;
  }

  return svg;
}

// Mountain trees for nordic biome — snow-dusted
function nordicMountainTreesSVG(tileX: number, tileEnd: number): string {
  let svg = '';
  const margin = 60;

  // Back-range pines
  for (let i = 0; i < 50; i++) {
    const tx = i * 128 + 20 + (i * 53) % 35;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const baseY = 275 - sineHeight(tx, 1.2, 150) - 1;
    const h = 14 + (i * 9) % 12;
    const w = 3 + (i * 3) % 3;
    const shade = ['#0e1a22', '#0c1820', '#101e28', '#0a161e'][i % 4];
    svg += `<g opacity="0.25">
      <rect x="${tx - 0.7}" y="${baseY}" width="1.4" height="3" fill="#1a1418"/>
      <polygon points="${tx - w},${baseY} ${tx},${baseY - h * 0.5} ${tx + w},${baseY}" fill="${shade}"/>
      <polygon points="${tx - w * 0.6},${baseY - h * 0.3} ${tx},${baseY - h * 0.85} ${tx + w * 0.6},${baseY - h * 0.3}" fill="${shade}"/>
      <polygon points="${tx - w * 0.3},${baseY - h * 0.55} ${tx},${baseY - h * 0.9} ${tx + w * 0.3},${baseY - h * 0.55}" fill="#8a9aaa" opacity="0.3"/>
    </g>`;
  }

  // Mid-range pines
  for (let i = 0; i < 70; i++) {
    const tx = i * 92 + 30 + (i * 43) % 25;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const baseY = 278 - sineHeight(tx, 3.7, 140) - 1;
    const h = 20 + (i * 11) % 18;
    const w = 5 + (i * 5) % 4;
    const shade = ['#0e1e28', '#0c1a24', '#10222e', '#081820'][i % 4];
    svg += `<g opacity="0.4">
      <rect x="${tx - 1}" y="${baseY}" width="2" height="5" fill="#1a1418"/>
      <polygon points="${tx - w},${baseY} ${tx},${baseY - h * 0.5} ${tx + w},${baseY}" fill="${shade}"/>
      <polygon points="${tx - w * 0.65},${baseY - h * 0.25} ${tx},${baseY - h * 0.8} ${tx + w * 0.65},${baseY - h * 0.25}" fill="${shade}"/>
      <polygon points="${tx - w * 0.35},${baseY - h * 0.5} ${tx},${baseY - h} ${tx + w * 0.35},${baseY - h * 0.5}" fill="${shade}"/>
      <polygon points="${tx - w * 0.2},${baseY - h * 0.6} ${tx},${baseY - h * 1.02} ${tx + w * 0.2},${baseY - h * 0.6}" fill="#8a9aaa" opacity="0.25"/>
    </g>`;
  }

  // Front-range pines
  for (let i = 0; i < 96; i++) {
    const tx = i * 67 + 10 + (i * 31) % 18;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const baseY = 285 - sineHeight(tx, 5.4, 110) - 2;
    const h = 30 + (i * 13) % 28;
    const w = 7 + (i * 7) % 6;
    const shade = ['#10242e', '#0c1e28', '#0e2030', '#142832'][i % 4];
    const op = (0.6 + (i % 5) * 0.04).toFixed(2);
    svg += `<g opacity="${op}">
      <rect x="${tx - 1.5}" y="${baseY}" width="3" height="7" fill="#1a1820" opacity="0.5"/>
      <rect x="${tx - 1.5}" y="${baseY - 6}" width="3" height="8" fill="#1a1820" opacity="0.4"/>
      <polygon points="${tx - w},${baseY} ${tx},${baseY - h * 0.45} ${tx + w},${baseY}" fill="${shade}"/>
      <polygon points="${tx - w * 0.72},${baseY - h * 0.22} ${tx},${baseY - h * 0.75} ${tx + w * 0.72},${baseY - h * 0.22}" fill="${shade}"/>
      <polygon points="${tx - w * 0.42},${baseY - h * 0.48} ${tx},${baseY - h} ${tx + w * 0.42},${baseY - h * 0.48}" fill="${shade}"/>
      <polygon points="${tx - w * 0.25},${baseY - h * 0.58} ${tx},${baseY - h * 1.02} ${tx + w * 0.25},${baseY - h * 0.58}" fill="#9aaaba" opacity="0.2"/>
      ${i % 3 === 0 ? `<polygon points="${tx - w * 0.5},${baseY - h * 0.28} ${tx},${baseY - h * 0.78} ${tx + w * 0.5},${baseY - h * 0.28}" fill="#8090a0" opacity="0.12"/>` : ''}
    </g>`;
  }

  // Icy rock outcrops
  for (let i = 0; i < 30; i++) {
    const bx = i * 210 + 50 + (i * 47) % 80;
    if (bx < tileX - margin || bx > tileEnd + margin) continue;
    const by = 275 + (i * 31) % 20;
    const h = 12 + (i * 19) % 18;
    const w = 4 + (i * 7) % 5;
    const shade = i % 3 === 0 ? '#1a2530' : i % 3 === 1 ? '#1e2e3a' : '#152028';
    svg += `<g>
      <polygon points="${bx - w},${by} ${bx - 1},${by - h} ${bx + w},${by}" fill="${shade}" opacity="0.4"/>
      ${(i * 13) % 5 < 3 ? `<polygon points="${bx + w + 3},${by} ${bx + w + 1},${by - h * 0.6} ${bx + w * 2 + 2},${by}" fill="${shade}" opacity="0.3"/>` : ''}
    </g>`;
  }

  return svg;
}

// Volcanic mountain decorations — dead trees + volcano silhouettes
function volcanicMountainDecorSVG(tileX: number, tileEnd: number): string {
  let svg = '';
  const margin = 60;

  // Dead trees on distant rear range
  for (let i = 0; i < 35; i++) {
    const tx = i * 183 + 40 + (i * 67) % 55;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const by = interpPoly(VOLCANIC_REAR_PTS, tx, 280) + 4;
    const h = 8 + (i * 11) % 14;
    const trunkW = 0.6 + (i % 3) * 0.2;
    const shade = i % 3 === 0 ? '#1a0e08' : i % 3 === 1 ? '#1e1209' : '#150b06';
    const lean = ((i * 11) % 9 - 4) * 0.25;
    const topX = tx + lean * h * 0.1;
    const op = (0.15 + (i % 3) * 0.05).toFixed(2);
    const seed = (i * 3571 + 211) % 1000;
    const brSide = seed % 2 === 0 ? 1 : -1;
    const brY1 = by - h * (0.4 + (seed % 15) * 0.01);
    const brLen1 = 3 + seed % 5;
    svg += `<g opacity="${op}">
      <line x1="${tx}" y1="${by}" x2="${topX}" y2="${by - h}" stroke="${shade}" stroke-width="${trunkW}" stroke-linecap="round"/>
      <line x1="${tx + lean * (h * 0.4) * 0.1}" y1="${brY1}" x2="${tx + lean * (h * 0.4) * 0.1 + brSide * brLen1}" y2="${brY1 - brLen1 * 0.35}" stroke="${shade}" stroke-width="${trunkW * 0.5}" stroke-linecap="round"/>
    </g>`;
  }

  // Dead trees on mid wall range
  for (let i = 0; i < 45; i++) {
    const tx = i * 142 + 25 + (i * 59) % 50;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const by = interpPoly(CAVE_BACK_PTS, tx, 280) + 4;
    const h = 12 + (i * 11) % 18;
    const trunkW = 0.8 + (i % 3) * 0.3;
    const shade = i % 3 === 0 ? '#140a06' : i % 3 === 1 ? '#180e08' : '#100804';
    const lean = ((i * 9) % 11 - 5) * 0.28;
    const topX = tx + lean * h * 0.1;
    const op = (0.3 + (i % 4) * 0.05).toFixed(2);
    const seed = (i * 3137 + 179) % 1000;
    const brSide = seed % 2 === 0 ? 1 : -1;
    const brY1 = by - h * (0.35 + (seed % 18) * 0.012);
    const brY2 = by - h * (0.6 + (seed % 12) * 0.01);
    const brLen1 = 4 + seed % 6;
    const brLen2 = 3 + (seed * 3) % 5;
    svg += `<g opacity="${op}">
      <line x1="${tx}" y1="${by}" x2="${topX}" y2="${by - h}" stroke="${shade}" stroke-width="${trunkW}" stroke-linecap="round"/>
      <line x1="${tx + lean * (h * 0.35) * 0.1}" y1="${brY1}" x2="${tx + lean * (h * 0.35) * 0.1 + brSide * brLen1}" y2="${brY1 - brLen1 * 0.4}" stroke="${shade}" stroke-width="${trunkW * 0.55}" stroke-linecap="round"/>
      <line x1="${tx + lean * (h * 0.6) * 0.1}" y1="${brY2}" x2="${tx + lean * (h * 0.6) * 0.1 - brSide * brLen2}" y2="${brY2 - brLen2 * 0.45}" stroke="${shade}" stroke-width="${trunkW * 0.45}" stroke-linecap="round"/>
    </g>`;
  }

  // Dead trees on foreground ridge
  for (let i = 0; i < 60; i++) {
    const tx = i * 107 + 15 + (i * 47) % 40;
    if (tx < tileX - margin || tx > tileEnd + margin) continue;
    const by = interpPoly(VOLCANIC_FRONT_PTS, tx, 280) + 3;
    const h = 18 + (i * 13) % 22;
    const trunkW = 1.2 + (i % 3) * 0.4;
    const shade = i % 3 === 0 ? '#0e0604' : i % 3 === 1 ? '#120806' : '#0a0402';
    const lean = ((i * 7) % 11 - 5) * 0.3;
    const topX = tx + lean * h * 0.1;
    const op = (0.5 + (i % 4) * 0.08).toFixed(2);
    const seed = (i * 2971 + 137) % 1000;
    const brSide = seed % 2 === 0 ? 1 : -1;
    const brY1 = by - h * (0.35 + (seed % 20) * 0.015);
    const brY2 = by - h * (0.6 + (seed % 15) * 0.01);
    const brLen1 = 6 + seed % 8;
    const brLen2 = 4 + (seed * 3) % 6;
    svg += `<g opacity="${op}">
      <line x1="${tx}" y1="${by}" x2="${topX}" y2="${by - h}" stroke="${shade}" stroke-width="${trunkW}" stroke-linecap="round"/>
      <line x1="${tx + lean * (h * 0.35) * 0.1}" y1="${brY1}" x2="${tx + lean * (h * 0.35) * 0.1 + brSide * brLen1}" y2="${brY1 - brLen1 * 0.4}" stroke="${shade}" stroke-width="${trunkW * 0.6}" stroke-linecap="round"/>
      <line x1="${tx + lean * (h * 0.6) * 0.1}" y1="${brY2}" x2="${tx + lean * (h * 0.6) * 0.1 - brSide * brLen2}" y2="${brY2 - brLen2 * 0.5}" stroke="${shade}" stroke-width="${trunkW * 0.5}" stroke-linecap="round"/>
      ${seed % 4 === 0 ? `<line x1="${topX}" y1="${by - h}" x2="${topX + brSide * 3}" y2="${by - h - 2}" stroke="${shade}" stroke-width="${trunkW * 0.4}" stroke-linecap="round"/>` : ''}
    </g>`;
  }

  // Volcano silhouettes
  const volcanoes = [
    { ox: 800, h: 120, w: 110, fill: '#1e100a' },
    { ox: 2600, h: 140, w: 130, fill: '#2a1510' },
    { ox: 4700, h: 155, w: 140, fill: '#221008' },
    { ox: 5800, h: 100, w: 100, fill: '#1a0c06' },
  ];
  for (let vi = 0; vi < volcanoes.length; vi++) {
    const v = volcanoes[vi];
    if (v.ox + v.w < tileX - margin || v.ox > tileEnd + margin) continue;
    const cx = v.ox + v.w / 2;
    const baseY = 300;
    const topY = baseY - v.h;
    const craterW = 12 + vi * 3;
    svg += `<g>
      <polygon points="${v.ox},${baseY} ${cx - craterW},${topY} ${cx - craterW * 0.6},${topY - 5} ${cx},${topY - 2} ${cx + craterW * 0.6},${topY - 5} ${cx + craterW},${topY} ${v.ox + v.w},${baseY}" fill="${v.fill}"/>
      <ellipse cx="${cx}" cy="${topY - 1}" rx="${craterW * 0.7}" ry="4" fill="#ff4400" opacity="0.15"/>
      <ellipse cx="${cx}" cy="${topY + 1}" rx="${craterW * 0.4}" ry="3" fill="#ff8800" opacity="0.12"/>
    </g>`;
  }

  return svg;
}

/** Generate a complete SVG for a mountain tile */
export function mountainTileSVG(tileX: number, biome: Biome): string {
  const tileEnd = tileX + TILE_W;
  const margin = 40;
  const xStart = tileX - margin;
  const xEnd = tileEnd + margin;
  const colors = BIOME_COLORS[biome].mtn;

  let content = '';

  if (biome === 'forest' || biome === 'nordic') {
    const isNordic = biome === 'nordic';
    const backPts = smoothMountainPoly(xStart, xEnd, 1.2, 275, 150);
    const midPts = smoothMountainPoly(xStart, xEnd, 3.7, 278, 140);
    const frontPts = smoothMountainPoly(xStart, xEnd, 5.4, 285, 110);

    const snowBackOp = isNordic ? 0.75 : 0.55;
    const snowMidOp = isNordic ? 0.45 : 0.3;
    const snowFrontOp = isNordic ? 0.55 : 0.4;

    content = `<defs>
      <linearGradient id="sB" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="${snowBackOp}"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="sM" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="${snowMidOp}"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <linearGradient id="sF" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#ffffff" stop-opacity="${snowFrontOp}"/>
        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
      </linearGradient>
      <clipPath id="cB"><polygon points="${backPts}"/></clipPath>
      <clipPath id="cM"><polygon points="${midPts}"/></clipPath>
      <clipPath id="cF"><polygon points="${frontPts}"/></clipPath>
    </defs>
    <polygon points="${backPts}" fill="${colors.back}"/>
    <rect x="${xStart}" y="0" width="${xEnd - xStart}" height="215" fill="url(#sB)" clip-path="url(#cB)"/>
    <polygon points="${midPts}" fill="${colors.front}" opacity="0.5"/>
    <rect x="${xStart}" y="0" width="${xEnd - xStart}" height="230" fill="url(#sM)" clip-path="url(#cM)"/>
    <polygon points="${frontPts}" fill="${colors.front}"/>
    <rect x="${xStart}" y="0" width="${xEnd - xStart}" height="250" fill="url(#sF)" clip-path="url(#cF)"/>`;

    // Mountain trees
    content += biome === 'forest'
      ? forestMountainTreesSVG(tileX, tileEnd)
      : nordicMountainTreesSVG(tileX, tileEnd);

  } else if (biome === 'cave') {
    content = `
    <polygon points="${CAVE_BACK_WALL}" fill="${colors.back}" opacity="0.75"/>
    <polygon points="${CAVE_FRONT_WALL}" fill="${colors.front}" opacity="0.65"/>
    <polygon points="${CAVE_DEPTH_OVERLAY}" fill="#1e1008" opacity="0.35"/>`;

  } else {
    // Volcanic
    content = `<defs>
      <linearGradient id="vH" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#ff4400" stop-opacity="0"/>
        <stop offset="40%" stop-color="#ff3300" stop-opacity="0.6"/>
        <stop offset="100%" stop-color="#2a1000" stop-opacity="0"/>
      </linearGradient>
    </defs>
    <polygon points="${VOLCANIC_REAR_RANGE}" fill="#1a0c06"/>
    <rect x="0" y="180" width="6400" height="120" fill="url(#vH)" opacity="0.15"/>
    <polygon points="${CAVE_BACK_WALL}" fill="${colors.back}"/>
    <polygon points="${VOLCANIC_FRONT_RIDGE}" fill="#2a1810"/>
    <rect x="0" y="290" width="6400" height="12" fill="#ff3300" opacity="0.06" rx="2"/>
    <rect x="0" y="294" width="6400" height="8" fill="#ff5500" opacity="0.04" rx="2"/>`;

    content += volcanicMountainDecorSVG(tileX, tileEnd);
  }

  return wrap(content, tileX, TILE_W, 0, MTN_TILE_H);
}

// ══════════════════════════════════════════════════════════════════
// TREELINE LAYER (parallax 0.55x, world coords 0-12000)
// ══════════════════════════════════════════════════════════════════

const TREELINE_WIDTH = 12000;
const TREELINE_BASE_Y = GROUND_Y + 8; // 328
const TREELINE_CEIL_TOP = 45;

function makeCanopyPoly(seed: number, bladeH: number, spacing: number, jitter: number): string {
  let pts = `0,${TREELINE_BASE_Y}`;
  for (let bx = 0; bx < TREELINE_WIDTH; bx += spacing) {
    const s = (bx * seed + 137) % 1000;
    const h = bladeH + (s % Math.floor(bladeH * 0.6));
    const lean = ((s + 50) % Math.floor(jitter * 2 + 1) - jitter) * 0.8;
    pts += ` ${bx + lean},${TREELINE_BASE_Y - h} ${bx + spacing * 0.5},${TREELINE_BASE_Y - h * 0.7}`;
  }
  pts += ` ${TREELINE_WIDTH},${TREELINE_BASE_Y} ${TREELINE_WIDTH},${TREELINE_BASE_Y + 20} 0,${TREELINE_BASE_Y + 20}`;
  return pts;
}

function makeCeilingPoly(seed: number, bladeH: number, spacing: number, jitter: number): string {
  let pts = `0,${TREELINE_CEIL_TOP}`;
  for (let bx = 0; bx < TREELINE_WIDTH; bx += spacing) {
    const s = (bx * seed + 137) % 1000;
    const h = bladeH + (s % Math.floor(bladeH * 0.6));
    const lean = ((s + 50) % Math.floor(jitter * 2 + 1) - jitter) * 0.8;
    pts += ` ${bx + lean},${TREELINE_CEIL_TOP + h} ${bx + spacing * 0.5},${TREELINE_CEIL_TOP + h * 0.7}`;
  }
  pts += ` ${TREELINE_WIDTH},${TREELINE_CEIL_TOP}`;
  return pts;
}

function makeTrunksSVG(seed: number, count: number): string {
  let svg = '';
  for (let i = 0; i < count; i++) {
    const s = (i * seed + 293) % 1000;
    const tx = (i * (TREELINE_WIDTH / count)) + (s % 30 - 15);
    const h = 30 + s % 25;
    const w = 3 + s % 3;
    const shade = s % 3 === 0 ? '#3a2a1a' : s % 3 === 1 ? '#4a3a2a' : '#2a1a0a';
    svg += `<rect x="${tx - w / 2}" y="${TREELINE_BASE_Y - h}" width="${w}" height="${h + 5}" fill="${shade}" opacity="0.5" rx="1"/>`;
  }
  return svg;
}

// Volcanic charred dead trees in treeline
function volcanicTreelineTrees(): string {
  let svg = '';
  const baseY = TREELINE_BASE_Y;
  for (let i = 0; i < 60; i++) {
    const tx = (i * 197 + 43) % 6000 + 50;
    const seed = (i * 31 + 7) % 100;
    const h = 18 + seed % 20;
    const trunkW = 1.2 + (seed % 3) * 0.4;
    const shade = seed % 3 === 0 ? '#1a0e06' : seed % 3 === 1 ? '#140a04' : '#201208';
    const ty = baseY - h;
    svg += `<line x1="${tx}" y1="${baseY}" x2="${tx + (seed % 5 - 2) * 0.5}" y2="${ty}" stroke="${shade}" stroke-width="${trunkW}" opacity="0.7"/>`;
    const branchCount = 2 + seed % 2;
    for (let b = 0; b < branchCount; b++) {
      const by = ty + h * (0.25 + b * 0.25);
      const bLen = 6 + (seed + b * 13) % 8;
      const bDir = (b % 2 === 0 ? -1 : 1) * (0.6 + (seed % 3) * 0.2);
      svg += `<line x1="${tx}" y1="${by}" x2="${tx + bLen * bDir}" y2="${by - bLen * 0.3}" stroke="${shade}" stroke-width="${trunkW * 0.6}" opacity="0.55"/>`;
    }
  }
  return svg;
}

// Pre-compute treeline polygon data (done once, cached)
let _treelinePolys: Record<string, string> | null = null;
function getTreelinePolys() {
  if (_treelinePolys) return _treelinePolys;
  _treelinePolys = {
    forestTrunks: makeTrunksSVG(2971, 80),
    forestBack: makeCanopyPoly(1847, 50, 14, 6),
    forestMid: makeCanopyPoly(3413, 42, 12, 5),
    forestFront: makeCanopyPoly(4789, 35, 10, 4),
    forestHighlight: makeCanopyPoly(6131, 30, 16, 3),
    caveBottom1: makeCanopyPoly(2111, 65, 22, 10),
    caveBottom2: makeCanopyPoly(3777, 50, 18, 7),
    caveBottom3: makeCanopyPoly(5333, 38, 14, 5),
    caveBottom4: makeCanopyPoly(6811, 25, 20, 4),
    caveCeil1: makeCeilingPoly(1337, 80, 20, 12),
    caveCeil2: makeCeilingPoly(4219, 65, 16, 8),
    caveCeil3: makeCeilingPoly(6173, 50, 13, 6),
    caveCeil4: makeCeilingPoly(8011, 35, 18, 5),
    nordicBack: makeCanopyPoly(1999, 48, 16, 8),
    nordicMid: makeCanopyPoly(3571, 38, 13, 6),
    nordicFront: makeCanopyPoly(5111, 30, 11, 4),
    volcanicBack: makeCanopyPoly(2333, 40, 20, 9),
    volcanicMid: makeCanopyPoly(4111, 32, 16, 6),
    volcanicFront: makeCanopyPoly(5777, 25, 13, 5),
    volcanicTrees: volcanicTreelineTrees(),
  };
  return _treelinePolys;
}

/** Generate a complete SVG for a treeline tile */
export function treelineTileSVG(tileX: number, biome: Biome): string {
  const t = getTreelinePolys();
  let content = '';

  switch (biome) {
    case 'forest':
      content = `
        ${t.forestTrunks}
        <polygon points="${t.forestBack}" fill="#0e2a0a" opacity="0.85"/>
        <polygon points="${t.forestMid}" fill="#1a3a12" opacity="0.8"/>
        <polygon points="${t.forestFront}" fill="#2a4a1a" opacity="0.75"/>
        <polygon points="${t.forestHighlight}" fill="#3a6a2a" opacity="0.35"/>`;
      break;
    case 'cave':
      content = `
        <polygon points="${t.caveBottom1}" fill="#1a1008" opacity="0.9"/>
        <polygon points="${t.caveBottom2}" fill="#2a1a10" opacity="0.85"/>
        <polygon points="${t.caveBottom3}" fill="#3a2818" opacity="0.75"/>
        <polygon points="${t.caveBottom4}" fill="#4a3828" opacity="0.3"/>
        <polygon points="${t.caveCeil1}" fill="#0e0804" opacity="0.95"/>
        <polygon points="${t.caveCeil2}" fill="#1a1008" opacity="0.9"/>
        <polygon points="${t.caveCeil3}" fill="#2a1a10" opacity="0.8"/>
        <polygon points="${t.caveCeil4}" fill="#3a2818" opacity="0.4"/>`;
      break;
    case 'nordic':
      content = `
        <polygon points="${t.nordicBack}" fill="#060e14" opacity="0.85"/>
        <polygon points="${t.nordicMid}" fill="#0c1a22" opacity="0.75"/>
        <polygon points="${t.nordicFront}" fill="#14242e" opacity="0.6"/>`;
      break;
    case 'volcanic':
      content = `
        <polygon points="${t.volcanicBack}" fill="#0a0604" opacity="0.9"/>
        <polygon points="${t.volcanicMid}" fill="#1a0e08" opacity="0.8"/>
        <polygon points="${t.volcanicFront}" fill="#2a1810" opacity="0.6"/>
        ${t.volcanicTrees}`;
      break;
  }

  return wrap(content, tileX, TILE_W, 0, TREE_TILE_H);
}

// ══════════════════════════════════════════════════════════════════
// GROUND LAYER (parallax 1.0x, world coords 0-worldEnd)
// ══════════════════════════════════════════════════════════════════

function grassBladeSVG(chunkX: number, chunkW: number, grassColor: string, darkGrass: string, midGrass: string): string {
  // Back blade layer
  let backPts = `${chunkX},${GROUND_Y + 2}`;
  for (let bx = 0; bx < chunkW; bx += 4) {
    const wx = chunkX + bx;
    const seed = (wx * 2971 + 137) % 1000;
    const h = 2 + (seed % 4);
    const lean = ((seed + 50) % 5 - 2) * 0.5;
    backPts += ` ${wx + lean},${GROUND_Y - h} ${wx + 2},${GROUND_Y + 1}`;
  }
  backPts += ` ${chunkX + chunkW},${GROUND_Y + 2}`;

  // Front blade layer
  let frontPts = `${chunkX},${GROUND_Y + 1}`;
  for (let bx = 0; bx < chunkW; bx += 6) {
    const wx = chunkX + bx;
    const seed = (wx * 1847 + 293) % 1000;
    const h = 4 + (seed % 5);
    const lean = ((seed + 30) % 7 - 3) * 0.6;
    frontPts += ` ${wx + 1 + lean},${GROUND_Y - h} ${wx + 3},${GROUND_Y}`;
  }
  frontPts += ` ${chunkX + chunkW},${GROUND_Y + 1}`;

  // Mid blade layer
  let midPts = `${chunkX},${GROUND_Y + 1}`;
  for (let bx = 3; bx < chunkW; bx += 5) {
    const wx = chunkX + bx;
    const seed = (wx * 3413 + 71) % 1000;
    const h = 3 + (seed % 4);
    const lean = ((seed + 80) % 5 - 2) * 0.4;
    midPts += ` ${wx + lean},${GROUND_Y - h} ${wx + 2.5},${GROUND_Y + 0.5}`;
  }
  midPts += ` ${chunkX + chunkW},${GROUND_Y + 1}`;

  return `<polygon points="${backPts}" fill="${darkGrass}" opacity="0.5"/>
    <polygon points="${midPts}" fill="${midGrass}" opacity="0.45"/>
    <polygon points="${frontPts}" fill="${grassColor}" opacity="0.55"/>`;
}

// Per-biome grass shade palettes
const GRASS_SHADES: Record<Biome, { grass: string; dark: string; mid: string }> = {
  forest: { grass: BIOME_COLORS.forest.grass, dark: '#3a6a2a', mid: '#4a7a3a' },
  cave: { grass: BIOME_COLORS.cave.grass, dark: '#2a1a10', mid: '#3a2818' },
  nordic: { grass: BIOME_COLORS.nordic.grass, dark: '#354858', mid: '#3a5060' },
  volcanic: { grass: BIOME_COLORS.volcanic.grass, dark: '#3a1808', mid: '#4a2010' },
};

// Dirt cross-section colors per biome
const DIRT_COLORS: Record<Biome, { dark: string; light: string }> = {
  forest: { dark: '#5a3a1a', light: '#6a4a28' },
  cave: { dark: '#3a2818', light: '#4a3820' },
  nordic: { dark: '#3a3540', light: '#4a4550' },
  volcanic: { dark: '#4a2818', light: '#5a3820' },
};

function groundDecorationSVG(dx: number, biome: Biome, seed: number): string {
  const gy = GROUND_Y;

  if (biome === 'forest') {
    const v = seed % 6;
    if (v <= 1) {
      // Pebble cluster
      const count = 3 + (seed % 3);
      let svg = '';
      for (let p = 0; p < count; p++) {
        const px = dx + (p * 10 - 8) + (seed + p * 7) % 6;
        const rx = 3 + (seed + p * 3) % 4;
        const ry = 1.5 + (seed + p * 5) % 2 * 0.8;
        const shade = p % 3 === 0 ? '#5a5a44' : p % 3 === 1 ? '#4a4a38' : '#6a6a52';
        svg += `<ellipse cx="${px}" cy="${gy + 1}" rx="${rx}" ry="${ry}" fill="${shade}" opacity="${(0.4 + (p % 2) * 0.1).toFixed(2)}"/>`;
      }
      return svg;
    }
    if (v === 2) {
      // Fallen leaves
      return `<ellipse cx="${dx}" cy="${gy + 1}" rx="3.5" ry="2" fill="#8a6a30" opacity="0.35" transform="rotate(${seed % 40 - 20}, ${dx}, ${gy + 1})"/>
        <ellipse cx="${dx + 9}" cy="${gy + 1.5}" rx="3" ry="1.6" fill="#9a7a40" opacity="0.3" transform="rotate(${(seed + 20) % 50 - 25}, ${dx + 9}, ${gy + 1.5})"/>
        <ellipse cx="${dx - 6}" cy="${gy + 1}" rx="2.5" ry="1.4" fill="#7a5a28" opacity="0.3" transform="rotate(${(seed + 40) % 60 - 30}, ${dx - 6}, ${gy + 1})"/>`;
    }
    if (v === 3) {
      // Moss patch
      const w = 12 + seed % 12;
      return `<ellipse cx="${dx}" cy="${gy + 2}" rx="${w}" ry="3" fill="#2a5a1e" opacity="0.3"/>
        <ellipse cx="${dx + 3}" cy="${gy + 1}" rx="${w * 0.6}" ry="2" fill="#3a6a28" opacity="0.22"/>`;
    }
    if (v === 4) {
      // Fallen twig
      const len = 14 + seed % 12;
      const angle = (seed % 60 - 30) * 0.02;
      return `<line x1="${dx}" y1="${gy + 1}" x2="${dx + len * Math.cos(angle)}" y2="${gy + 1 + len * Math.sin(angle)}" stroke="#5a4a30" stroke-width="1.8" opacity="0.35" stroke-linecap="round"/>`;
    }
    // Dirt patch
    return `<ellipse cx="${dx}" cy="${gy + 2}" rx="${10 + seed % 8}" ry="${2.5 + (seed % 3) * 0.5}" fill="#3a3a20" opacity="0.25"/>`;
  }

  if (biome === 'cave') {
    const count = 2 + (seed % 4);
    let svg = '';
    for (let p = 0; p < count; p++) {
      const px = dx + (p * 9 - 6) + (seed + p * 11) % 8;
      const rx = 2 + (seed + p * 3) % 3;
      const ry = 1.2 + (seed + p * 5) % 2 * 0.5;
      const shade = p % 4 === 0 ? '#6a6a6a' : p % 4 === 1 ? '#585858' : p % 4 === 2 ? '#7a7a7a' : '#505050';
      svg += `<ellipse cx="${px}" cy="${gy + 1 + (p % 2) * 1.5}" rx="${rx}" ry="${ry}" fill="${shade}" opacity="${(0.35 + (p % 3) * 0.08).toFixed(2)}"/>`;
    }
    return svg;
  }

  if (biome === 'nordic') {
    const nv = seed % 5;
    if (nv <= 1) {
      const pw = 12 + seed % 14;
      return `<ellipse cx="${dx}" cy="${gy + 1}" rx="${pw}" ry="3" fill="#c8d8e8" opacity="0.15"/>
        <ellipse cx="${dx + 4}" cy="${gy + 1.5}" rx="${pw * 0.5}" ry="2" fill="#d8e4f0" opacity="0.12"/>`;
    }
    if (nv === 2) {
      const h = 5 + (seed * 3 + 1) % 4;
      return `<line x1="${dx}" y1="${gy}" x2="${dx}" y2="${gy - h}" stroke="#88ccff" stroke-width="0.6" opacity="0.5"/>
        <line x1="${dx - 2}" y1="${gy - h * 0.4}" x2="${dx + 2}" y2="${gy - h * 0.6}" stroke="#88ccff" stroke-width="0.6" opacity="0.5"/>
        <line x1="${dx + 2}" y1="${gy - h * 0.3}" x2="${dx - 2}" y2="${gy - h * 0.7}" stroke="#88ccff" stroke-width="0.6" opacity="0.5"/>`;
    }
    if (nv === 3) {
      return `<ellipse cx="${dx}" cy="${gy + 2}" rx="1.5" ry="1" fill="#6a8a9a" opacity="0.4"/>
        <ellipse cx="${dx + 3}" cy="${gy + 3}" rx="1" ry="0.8" fill="#8aaabb" opacity="0.4"/>
        <ellipse cx="${dx - 2}" cy="${gy + 2}" rx="1.2" ry="0.9" fill="#8aaabb" opacity="0.4"/>`;
    }
    return `<ellipse cx="${dx}" cy="${gy + 1}" rx="10" ry="3" fill="#c8d8e8" opacity="0.2"/>`;
  }

  // Volcanic
  const vType = seed % 8;
  const vgy = gy + 3 + (seed % 5);
  if (vType === 0) {
    const h = 4 + seed % 4;
    return `<rect x="${dx - 2}" y="${vgy - h}" width="4" height="${h + 2}" fill="#1a0c06" opacity="0.6" rx="1"/>
      <ellipse cx="${dx}" cy="${vgy}" rx="5" ry="2" fill="#0a0604" opacity="0.2"/>`;
  }
  if (vType === 1) {
    const pw = 14 + seed % 12;
    return `<ellipse cx="${dx}" cy="${vgy}" rx="${pw}" ry="3.5" fill="#0a0604" opacity="0.22"/>`;
  }
  if (vType === 2) {
    const len1 = 12 + seed % 10;
    return `<polyline points="${dx},${vgy} ${dx + 4},${vgy - 1.5} ${dx + len1 * 0.6},${vgy + 1} ${dx + len1},${vgy - 0.5}" fill="none" stroke="#1a0804" stroke-width="1.2" opacity="0.35" stroke-linecap="round"/>`;
  }
  if (vType === 3) {
    const count = 3 + seed % 4;
    let svg = '';
    for (let p = 0; p < count; p++) {
      const ex = dx + (p * 11 - 12) + (seed + p * 7) % 8;
      const ey = vgy + (p % 3) * 1.5 - 1;
      const r = 1 + (seed + p * 3) % 2;
      const glow = p % 3 === 0;
      svg += `<circle cx="${ex}" cy="${ey}" r="${r}" fill="${glow ? '#ff4400' : '#2a1008'}" opacity="${glow ? (0.2 + ((seed + p) % 10) * 0.02).toFixed(2) : '0.25'}"/>`;
    }
    return svg;
  }
  if (vType === 4) {
    return `<polygon points="${dx},${vgy - 6} ${dx - 3},${vgy + 1} ${dx + 3},${vgy + 1}" fill="#1a1014" opacity="0.6"/>
      <ellipse cx="${dx}" cy="${vgy + 1}" rx="5" ry="1.5" fill="#0a0604" opacity="0.18"/>`;
  }
  if (vType === 5) {
    const pw = 18 + seed % 16;
    return `<ellipse cx="${dx}" cy="${vgy + 1}" rx="${pw}" ry="2.5" fill="#1a1410" opacity="0.18"/>`;
  }
  if (vType === 6) {
    return `<line x1="${dx - 5}" y1="${vgy}" x2="${dx + 4}" y2="${vgy + 1}" stroke="#8a7a6a" stroke-width="1.2" opacity="0.25" stroke-linecap="round"/>
      <line x1="${dx - 1}" y1="${vgy - 1}" x2="${dx + 2}" y2="${vgy + 2}" stroke="#7a6a5a" stroke-width="1" opacity="0.2" stroke-linecap="round"/>
      <circle cx="${dx + 6}" cy="${vgy + 1}" r="2" fill="none" stroke="#8a7a6a" stroke-width="0.8" opacity="0.2"/>`;
  }
  const ringR = 6 + seed % 5;
  return `<ellipse cx="${dx}" cy="${vgy + 1}" rx="${ringR}" ry="${ringR * 0.5}" fill="#0e0804" opacity="0.2"/>
    <ellipse cx="${dx}" cy="${vgy + 1}" rx="${ringR * 0.7}" ry="${ringR * 0.35}" fill="none" stroke="#1a0c04" stroke-width="1" opacity="0.25"/>`;
}

/** Generate a complete SVG for a ground tile */
export function groundTileSVG(tileX: number, biome: Biome): string {
  const tileEnd = tileX + TILE_W;
  const colors = BIOME_COLORS[biome];
  const grass = GRASS_SHADES[biome];
  const dirt = DIRT_COLORS[biome];
  const pathBottom = GROUND_Y + 14;

  let content = '';

  // Ground gradient
  content += `<defs>
    <linearGradient id="gG" x1="0" y1="${GROUND_Y}" x2="0" y2="${GROUND_Y + 50}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${colors.gnd.top}"/>
      <stop offset="100%" stop-color="${colors.gnd.bot}"/>
    </linearGradient>
    <linearGradient id="dF" x1="0" y1="${pathBottom}" x2="0" y2="${GAME_HEIGHT}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#000" stop-opacity="0.05"/>
      <stop offset="30%" stop-color="#000" stop-opacity="0.3"/>
      <stop offset="70%" stop-color="#000" stop-opacity="0.65"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.9"/>
    </linearGradient>
  </defs>`;

  // Main ground fill
  content += `<rect x="${tileX}" y="${GROUND_Y}" width="${TILE_W}" height="${GAME_HEIGHT - GROUND_Y}" fill="url(#gG)"/>`;

  // Dirt layer below path
  content += `<rect x="${tileX}" y="${pathBottom}" width="${TILE_W}" height="${GAME_HEIGHT - pathBottom}" fill="${dirt.dark}"/>`;
  // Depth fade
  content += `<rect x="${tileX}" y="${pathBottom}" width="${TILE_W}" height="${GAME_HEIGHT - pathBottom}" fill="url(#dF)"/>`;
  // Path/dirt boundary
  content += `<rect x="${tileX}" y="${pathBottom - 1}" width="${TILE_W}" height="2" fill="#000" opacity="0.2"/>`;

  // Grass blade edge — 80px chunks within this tile
  const chunkW = 80;
  const startChunk = Math.floor(tileX / chunkW);
  const endChunk = Math.ceil(tileEnd / chunkW);
  for (let ci = startChunk; ci <= endChunk; ci++) {
    const cx = ci * chunkW;
    if (cx + chunkW < tileX || cx > tileEnd) continue;
    content += grassBladeSVG(cx, chunkW, grass.grass, grass.dark, grass.mid);
  }

  // Ground decorations — 50px spacing
  const decorSpacing = 50;
  const startDecor = Math.floor(tileX / decorSpacing) - 1;
  const endDecor = Math.ceil(tileEnd / decorSpacing) + 1;
  for (let i = startDecor; i <= endDecor; i++) {
    const seed = (i * 2971 + 137) % 1000;
    const dx = i * decorSpacing + 10 + (seed % 30);
    if (dx < tileX - 40 || dx > tileEnd + 40) continue;
    content += groundDecorationSVG(dx, biome, seed);
  }

  return wrap(content, tileX, TILE_W, GND_TILE_Y0, GND_TILE_H);
}

// ══════════════════════════════════════════════════════════════════
// HOME SANCTUARY (spawn area at world x ~30-120)
// ══════════════════════════════════════════════════════════════════

/** Generate SVG for the Home Sanctuary — drawn once, cached as a single image */
export function homeSanctuarySVG(): string {
  const baseX = 60;
  const gy = GROUND_Y;
  const w = 200; // total width of sanctuary scene
  const h = 80;  // height of content
  const vbX = baseX - 60;
  const vbY = gy - 55;

  let content = `
  <!-- Worn dirt patch -->
  <ellipse cx="${baseX}" cy="${gy + 2}" rx="50" ry="6" fill="#3a3020" opacity="0.3"/>

  <!-- Stone foundation -->
  <rect x="${baseX - 35}" y="${gy - 2}" width="70" height="4" fill="#5a5a5a"/>
  <rect x="${baseX - 30}" y="${gy - 4}" width="60" height="3" fill="#6a6a6a"/>

  <!-- Steps -->
  <rect x="${baseX - 8}" y="${gy - 1}" width="16" height="3" fill="#555"/>
  <rect x="${baseX - 6}" y="${gy + 2}" width="12" height="2" fill="#555"/>

  <!-- Back wall (ruined) -->
  <rect x="${baseX - 28}" y="${gy - 30}" width="56" height="28" fill="#4a4a4a"/>
  <rect x="${baseX - 26}" y="${gy - 28}" width="52" height="24" fill="#5a5a58"/>

  <!-- Mortar lines -->
  <line x1="${baseX - 26}" y1="${gy - 26}" x2="${baseX + 26}" y2="${gy - 26}" stroke="#3a3a38" stroke-width="0.3"/>
  <line x1="${baseX - 26}" y1="${gy - 20}" x2="${baseX + 26}" y2="${gy - 20}" stroke="#3a3a38" stroke-width="0.3"/>
  <line x1="${baseX - 26}" y1="${gy - 14}" x2="${baseX + 26}" y2="${gy - 14}" stroke="#3a3a38" stroke-width="0.3"/>
  <line x1="${baseX - 26}" y1="${gy - 8}" x2="${baseX + 26}" y2="${gy - 8}" stroke="#3a3a38" stroke-width="0.3"/>

  <!-- Moss patches -->
  <ellipse cx="${baseX - 18}" cy="${gy - 10}" rx="4" ry="2" fill="#3a5a2a" opacity="0.4"/>
  <ellipse cx="${baseX + 14}" cy="${gy - 18}" rx="3" ry="1.5" fill="#3a5a2a" opacity="0.4"/>
  <ellipse cx="${baseX - 22}" cy="${gy - 22}" rx="3" ry="2" fill="#3a5a2a" opacity="0.4"/>

  <!-- Left pillar -->
  <rect x="${baseX - 32}" y="${gy - 44}" width="6" height="42" fill="#5a5a5a"/>
  <rect x="${baseX - 34}" y="${gy - 46}" width="10" height="4" fill="#6a6a6a"/>

  <!-- Right broken pillar -->
  <rect x="${baseX + 26}" y="${gy - 28}" width="6" height="26" fill="#5a5a5a"/>
  <polygon points="${baseX + 26},${gy - 28} ${baseX + 27},${gy - 32} ${baseX + 29},${gy - 29} ${baseX + 31},${gy - 34} ${baseX + 32},${gy - 28}" fill="#5a5a5a"/>
  <rect x="${baseX + 34}" y="${gy - 4}" width="4" height="3" fill="#4a4a4a"/>
  <rect x="${baseX + 36}" y="${gy - 2}" width="3" height="2" fill="#4a4a4a"/>

  <!-- Lean-to roof -->
  <line x1="${baseX - 28}" y1="${gy - 30}" x2="${baseX + 8}" y2="${gy - 44}" stroke="#5a4020" stroke-width="2"/>
  <rect x="${baseX + 7}" y="${gy - 44}" width="2" height="42" fill="#5a4020"/>
  <polygon points="${baseX - 28},${gy - 30} ${baseX + 8},${gy - 44} ${baseX + 8},${gy - 34} ${baseX - 28},${gy - 20}" fill="#6a5838" opacity="0.7"/>

  <!-- Banner on pillar -->
  <polygon points="${baseX - 31},${gy - 40} ${baseX - 20},${gy - 38} ${baseX - 20},${gy - 30} ${baseX - 31},${gy - 32}" fill="#8a2244" stroke="#C8A96E" stroke-width="0.5"/>

  <!-- Campfire stone ring -->
  ${[0,1,2,3,4,5,6,7].map(i => {
    const a = (i / 8) * Math.PI * 2;
    const sx = baseX + Math.cos(a) * 6;
    const sy = gy - 5 + Math.sin(a) * 3;
    return `<circle cx="${sx}" cy="${sy}" r="1.5" fill="#5a5a5a"/>`;
  }).join('')}

  <!-- Ash bed -->
  <ellipse cx="${baseX}" cy="${gy - 5}" rx="5" ry="2.5" fill="#3a3030"/>

  <!-- Crossed logs -->
  <line x1="${baseX - 4}" y1="${gy - 4}" x2="${baseX + 4}" y2="${gy - 6}" stroke="#4a3020" stroke-width="1.5"/>
  <line x1="${baseX - 3}" y1="${gy - 6}" x2="${baseX + 3}" y2="${gy - 4}" stroke="#4a3020" stroke-width="1.5"/>

  <!-- Weapon rack -->
  <rect x="${baseX + 18}" y="${gy - 20}" width="2" height="18" fill="#5a4020"/>
  <rect x="${baseX + 26}" y="${gy - 20}" width="2" height="18" fill="#5a4020"/>
  <rect x="${baseX + 18}" y="${gy - 18}" width="10" height="1.5" fill="#5a4020"/>
  <rect x="${baseX + 18}" y="${gy - 12}" width="10" height="1.5" fill="#5a4020"/>
  <!-- Sword on rack -->
  <rect x="${baseX + 21}" y="${gy - 20}" width="1.5" height="14" fill="#aab8cc"/>
  <rect x="${baseX + 20}" y="${gy - 8}" width="4" height="2" fill="#8B6914"/>

  <!-- Barrel -->
  <rect x="${baseX - 38}" y="${gy - 10}" width="8" height="10" fill="#6a4a20"/>
  <rect x="${baseX - 39}" y="${gy - 8}" width="10" height="1.5" fill="#5a3a18"/>
  <rect x="${baseX - 39}" y="${gy - 4}" width="10" height="1.5" fill="#5a3a18"/>

  <!-- Crate -->
  <rect x="${baseX - 42}" y="${gy - 7}" width="7" height="7" fill="#7a5a28" stroke="#5a3a18" stroke-width="0.4"/>
  <line x1="${baseX - 42}" y1="${gy - 3.5}" x2="${baseX - 35}" y2="${gy - 3.5}" stroke="#5a3a18" stroke-width="0.4"/>
  <line x1="${baseX - 38.5}" y1="${gy - 7}" x2="${baseX - 38.5}" y2="${gy}" stroke="#5a3a18" stroke-width="0.4"/>
  `;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="${vbX} ${vbY} ${w} ${h}">${content}</svg>`;
}
