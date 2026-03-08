import type { GameState, Flag, Chest, Banner, Barricade, IceWall, Boss } from '../types';
import { GROUND_Y, VIEWPORT_W, VIEWPORT_H, GAME_HEIGHT, FLAG_HEIGHT, COLORS } from '../constants';
import {
  buildingSVG, BLDG_VB_X, BLDG_VB_Y, BLDG_VB_W, BLDG_VB_H,
  BLDG_SCALE, BLDG_IMG_W, BLDG_IMG_H,
} from './flagSVG';

const WORLD_Y_OFFSET = VIEWPORT_H - GAME_HEIGHT; // same offset as canvasRenderer

// ── Building sprite cache ────────────────────────────────────────
// Key: "type:active" → cached HTMLImageElement
const buildingCache = new Map<string, HTMLImageElement | null>();
const buildingLoading = new Set<string>();

function getBuildingImage(type: string, active: boolean): HTMLImageElement | null {
  const key = `${type}:${active ? 1 : 0}`;
  const cached = buildingCache.get(key);
  if (cached !== undefined) return cached;
  if (buildingLoading.has(key)) return null;

  const svgStr = buildingSVG(type, active);
  if (!svgStr) { buildingCache.set(key, null); return null; }

  buildingLoading.add(key);
  const blob = new Blob([svgStr], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.onload = () => {
    URL.revokeObjectURL(url);
    buildingCache.set(key, img);
    buildingLoading.delete(key);
  };
  img.onerror = () => {
    URL.revokeObjectURL(url);
    buildingCache.set(key, null);
    buildingLoading.delete(key);
  };
  img.src = url;
  return null;
}

// Building draw position offsets (relative to flag group origin at flag.x, GROUND_Y - FLAG_HEIGHT)
const BLDG_DRAW_OFFSET_X = -50 + BLDG_VB_X * BLDG_SCALE; // -50 - 20.4 = -70.4
const BLDG_DRAW_OFFSET_Y = (FLAG_HEIGHT - 32 * BLDG_SCALE) + BLDG_VB_Y * BLDG_SCALE; // -48.8 - 51 = -99.8

// ── Flags ─────────────────────────────────────────────────────────
function drawFlag(ctx: CanvasRenderingContext2D, flag: Flag, camX: number, frame: number): void {
  const sx = flag.x - camX;
  const gy = GROUND_Y + WORLD_Y_OFFSET;
  const poleH = FLAG_HEIGHT;
  const isContesting = flag.contested && !flag.captured;
  const active = flag.captured && !flag.corrupted && !isContesting;

  // === LAYER 1: Building structure (behind everything) ===
  if (flag.buildingType && !flag.corrupted) {
    const img = getBuildingImage(flag.buildingType, active);
    if (img) {
      const bx = sx + BLDG_DRAW_OFFSET_X;
      const by = (gy - poleH) + BLDG_DRAW_OFFSET_Y;
      ctx.drawImage(img, bx, by, BLDG_IMG_W, BLDG_IMG_H);
    }
  }

  // === LAYER 2: Ground mound at pole base ===
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#2a2a22';
  ctx.beginPath();
  ctx.ellipse(sx + 2, gy + 2, 9, 3.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a3a30';
  ctx.beginPath();
  ctx.ellipse(sx + 2, gy + 1, 7, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#4a4a3a';
  ctx.beginPath();
  ctx.ellipse(sx + 2, gy, 5, 1.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Small stones
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#3a3a30';
  ctx.beginPath();
  ctx.arc(sx - 4, gy + 1, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#2a2a22';
  ctx.beginPath();
  ctx.arc(sx + 7, gy + 2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // Zone indicators
  if (!flag.captured && !flag.corrupted) {
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = flag.isBossFlag ? '#8a0a8a' : COLORS.flagEnemy;
    ctx.beginPath();
    ctx.ellipse(sx + 2, gy + 4, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  if (flag.corrupted) {
    ctx.globalAlpha = 0.15 + Math.sin(frame * 0.033) * 0.05;
    ctx.fillStyle = '#6622aa';
    ctx.beginPath();
    ctx.ellipse(sx + 2, gy + 4, 20, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // === LAYER 3: Pole with wood grain, binding rings, finial ===
  const poleMain = flag.corrupted ? '#222' : flag.isBossFlag ? '#5a3a1a' : COLORS.flagPole;
  const poleLight = flag.corrupted ? '#333' : flag.isBossFlag ? '#7a5a3a' : '#9b8365';
  const poleDark = flag.corrupted ? '#111' : flag.isBossFlag ? '#3a2a10' : '#5a4a30';
  const finialColor = flag.corrupted ? '#333' : flag.isBossFlag ? '#aa7722' : flag.captured ? '#ddc040' : '#888';

  // Main shaft
  ctx.fillStyle = poleMain;
  ctx.fillRect(sx, gy - poleH + 2, 4, poleH - 2);
  // Highlight strip
  ctx.globalAlpha = 0.3;
  ctx.fillStyle = poleLight;
  ctx.fillRect(sx + 0.5, gy - poleH + 2, 1, poleH - 2);
  // Dark edge
  ctx.globalAlpha = 0.25;
  ctx.fillStyle = poleDark;
  ctx.fillRect(sx + 3, gy - poleH + 2, 0.8, poleH - 2);
  ctx.globalAlpha = 1;
  // Wood grain lines
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = poleDark;
  ctx.lineWidth = 0.4;
  ctx.beginPath(); ctx.moveTo(sx + 2.5, gy - poleH + 12); ctx.lineTo(sx + 2.5, gy - poleH + 22); ctx.stroke();
  ctx.globalAlpha = 0.15;
  ctx.lineWidth = 0.3;
  ctx.beginPath(); ctx.moveTo(sx + 1.2, gy - poleH + 30); ctx.lineTo(sx + 1.2, gy - poleH + 42); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(sx + 2.8, gy - poleH + 44); ctx.lineTo(sx + 2.8, gy - poleH + 52); ctx.stroke();
  ctx.globalAlpha = 1;
  // Binding rings
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = poleDark;
  ctx.fillRect(sx - 0.5, gy - poleH + 3, 5, 1.8);
  ctx.fillRect(sx - 0.5, gy - poleH + 27, 5, 1.8);
  ctx.globalAlpha = 1;
  // Finial — brass ball at top
  ctx.fillStyle = finialColor;
  ctx.beginPath();
  ctx.arc(sx + 2, gy - poleH - 1, 3.5, 0, Math.PI * 2);
  ctx.fill();
  // Finial highlight
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(sx + 1.2, gy - poleH - 2, 1.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  // === LAYER 4: Flag cloth with folds ===
  const w = Math.sin(frame * 0.083 + flag.id) * 3;
  const clothColor = flag.corrupted ? '#1a1a1a' : (flag.isBossFlag && !flag.captured) ? '#8a0a8a'
    : isContesting ? '#ffffff' : flag.captured ? COLORS.flagFriendly : COLORS.flagEnemy;
  const flagDark = isContesting ? '#cccccc' : flag.corrupted ? '#0a0a0a' : flag.captured ? '#2a9a2a' : '#aa2222';
  const flagLight = isContesting ? '#ffffff' : flag.corrupted ? '#2a2a2a' : flag.captured ? '#5aee5a' : '#ff5555';

  // Flag shadow
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#000';
  ctx.beginPath();
  ctx.moveTo(sx + 5, gy - poleH + 5);
  ctx.lineTo(sx + 35 + w, gy - poleH + 13);
  ctx.lineTo(sx + 33 + w, gy - poleH + 21);
  ctx.lineTo(sx + 5, gy - poleH + 29);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Main cloth body
  ctx.fillStyle = clothColor;
  ctx.beginPath();
  ctx.moveTo(sx + 4, gy - poleH + 4);
  ctx.lineTo(sx + 34 + w, gy - poleH + 12);
  ctx.lineTo(sx + 32 + w, gy - poleH + 20);
  ctx.lineTo(sx + 4, gy - poleH + 28);
  ctx.closePath();
  ctx.fill();

  // Top fold highlight
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = flagLight;
  ctx.beginPath();
  ctx.moveTo(sx + 4, gy - poleH + 4);
  ctx.lineTo(sx + 34 + w, gy - poleH + 12);
  ctx.lineTo(sx + 33 + w, gy - poleH + 9);
  ctx.lineTo(sx + 4, gy - poleH + 1);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Bottom fold shadow
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = flagDark;
  ctx.beginPath();
  ctx.moveTo(sx + 4, gy - poleH + 26);
  ctx.lineTo(sx + 32 + w, gy - poleH + 19);
  ctx.lineTo(sx + 32 + w, gy - poleH + 20);
  ctx.lineTo(sx + 4, gy - poleH + 28);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Boss skull icon on cloth
  if (flag.isBossFlag && !flag.captured && !flag.corrupted) {
    const skullX = sx + 12 + w * 0.5;
    const skullY = gy - poleH + 8;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(skullX + 6, skullY + 6, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#000';
    ctx.fillRect(skullX + 3, skullY + 4, 2, 2);
    ctx.fillRect(skullX + 7, skullY + 4, 2, 2);
    ctx.fillRect(skullX + 4, skullY + 8, 4, 1);
  }

  // Corrupted cracks
  if (flag.corrupted) {
    ctx.strokeStyle = '#6622aa';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.moveTo(sx + 10, gy - poleH + 8);
    ctx.lineTo(sx + 20 + w * 0.3, gy - poleH + 16);
    ctx.stroke();
    ctx.globalAlpha = 0.4;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(sx + 15, gy - poleH + 12);
    ctx.lineTo(sx + 25 + w * 0.3, gy - poleH + 20);
    ctx.stroke();
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#8844cc';
    ctx.beginPath();
    ctx.arc(sx + 18 + w * 0.3, gy - poleH + 14, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // === LAYER 5: Labels ===
  if (flag.isBossFlag && !flag.captured && !flag.corrupted) {
    ctx.fillStyle = '#ff3333';
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('BOSS', sx + 2, gy - poleH - 8);
    ctx.textAlign = 'left';
  }
  if (flag.corrupted) {
    ctx.fillStyle = '#8844cc';
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('💀', sx + 2, gy - poleH - 8);
    ctx.textAlign = 'left';
  }
  if (isContesting) {
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    const timer = Math.ceil(((flag as any).contestTimer || 0) / 60);
    ctx.fillText(`${timer}s`, sx + 2, gy - poleH - 8);
    ctx.textAlign = 'left';

    // Contest gold pulse
    const pulse = 0.5 + Math.sin(frame * 0.15) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(sx - 8, gy - poleH - 6, 28, poleH + 8);
    ctx.globalAlpha = 1;
  }
}

// ── Chests ─────────────────────────────────────────────────────────

const TIER_COLORS = {
  common: { body: '#6a6a7e', lid: '#8a8a9e', lock: '#aaa', glow: '#aaa' },
  rare: { body: '#2a4a8e', lid: '#3a6aae', lock: '#4a9fff', glow: '#4a9fff' },
  legendary: { body: '#8B6914', lid: '#B8860B', lock: '#FFD700', glow: '#FFD700' },
};

function getTier(type: string): 'common' | 'rare' | 'legendary' {
  if (type.endsWith('Legendary')) return 'legendary';
  if (type.endsWith('Rare')) return 'rare';
  return 'common';
}

// Helper: draw an ellipse
function fillEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill();
}

function strokeEllipse(ctx: CanvasRenderingContext2D, cx: number, cy: number, rx: number, ry: number): void {
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();
}

// Helper: draw a polygon from points array [[x,y], ...]
function fillPolygon(ctx: CanvasRenderingContext2D, points: number[][]): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
}

function strokePolygon(ctx: CanvasRenderingContext2D, points: number[][]): void {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.stroke();
}

// Helper: draw a rounded rect
function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

// ── Relic chest: Ancient urn ─────────────────────────────────────
function drawRelicChest(ctx: CanvasRenderingContext2D, chest: Chest, ox: number, oy: number): void {
  const tier = getTier(chest.type);
  const tc = TIER_COLORS[tier];
  const bob = Math.sin(chest.age * 0.07) * 1.5;
  const y = oy + bob;

  // Shadow
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.25;
  fillEllipse(ctx, ox + 10, oy + 20, 12, 4);
  ctx.globalAlpha = 1;

  // Glow for rare/legendary
  if (tier !== 'common') {
    ctx.fillStyle = tc.glow;
    ctx.globalAlpha = 0.1 + Math.sin(chest.age * 0.08) * 0.06;
    fillEllipse(ctx, ox + 10, oy + 20, 16, 7);
    ctx.globalAlpha = 1;
  }

  // Urn body (path approximation)
  ctx.beginPath();
  ctx.moveTo(ox + 4, y + 8);
  ctx.quadraticCurveTo(ox + 2, y + 12, ox + 3, y + 17);
  ctx.quadraticCurveTo(ox + 5, y + 20, ox + 10, y + 20);
  ctx.quadraticCurveTo(ox + 15, y + 20, ox + 17, y + 17);
  ctx.quadraticCurveTo(ox + 18, y + 12, ox + 16, y + 8);
  ctx.closePath();
  ctx.fillStyle = tc.body;
  ctx.fill();
  ctx.strokeStyle = tc.glow;
  ctx.lineWidth = tier === 'common' ? 0.5 : 1.2;
  ctx.stroke();

  // Neck
  roundRect(ctx, ox + 6, y + 4, 8, 5, 1);
  ctx.fillStyle = tc.lid;
  ctx.fill();

  // Rim
  roundRect(ctx, ox + 5, y + 3, 10, 2, 1);
  ctx.fillStyle = tc.lock;
  ctx.fill();

  // Belt
  roundRect(ctx, ox + 4, y + 13, 12, 1.5, 0.5);
  ctx.fillStyle = tc.lock;
  ctx.globalAlpha = 0.5;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Diamond glyph
  ctx.globalAlpha = 0.6 + Math.sin(chest.age * 0.12) * 0.3;
  ctx.fillStyle = tc.lock;
  fillPolygon(ctx, [[ox + 8, y + 10], [ox + 10, y + 8], [ox + 12, y + 10], [ox + 10, y + 12]]);
  ctx.globalAlpha = 1;

  // Orbiting particles for rare/legendary
  if (tier !== 'common') {
    for (let i = 0; i < 2; i++) {
      const px = i === 0
        ? ox - 1 + Math.sin(chest.age * 0.15) * 5
        : ox + 21 + Math.cos(chest.age * 0.18) * 4;
      const py = i === 0
        ? y + 6 + Math.cos(chest.age * 0.12) * 4
        : y + 10 + Math.sin(chest.age * 0.14) * 3;
      const op = i === 0
        ? 0.3 + Math.sin(chest.age * 0.2) * 0.3
        : 0.3 + Math.cos(chest.age * 0.22) * 0.3;
      ctx.fillStyle = tc.glow;
      ctx.globalAlpha = op;
      ctx.beginPath();
      ctx.arc(px, py, 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

// ── Artifact chest: Ornate chest with lock ───────────────────────
function drawArtifactChest(ctx: CanvasRenderingContext2D, chest: Chest, ox: number, oy: number): void {
  const tier = getTier(chest.type);
  const tc = TIER_COLORS[tier];
  const bob = Math.sin(chest.age * 0.06) * 2;
  const y = oy + bob;

  // Shadow
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.3;
  fillEllipse(ctx, ox + 10, oy + 22, 14, 5);
  ctx.globalAlpha = 1;

  // Legendary glow
  if (tier === 'legendary') {
    ctx.fillStyle = tc.glow;
    ctx.globalAlpha = 0.12 + Math.sin(chest.age * 0.08) * 0.08;
    fillEllipse(ctx, ox + 10, oy + 22, 18, 8);
    ctx.globalAlpha = 1;
  }

  // Chest body
  roundRect(ctx, ox - 2, y + 6, 24, 16, 2);
  ctx.fillStyle = tc.body;
  ctx.fill();
  ctx.strokeStyle = tc.glow;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Corner filigree (L-shaped corners)
  ctx.strokeStyle = tc.lock;
  ctx.lineWidth = 1.5;
  // Top-left
  ctx.beginPath(); ctx.moveTo(ox - 2, y + 6); ctx.lineTo(ox + 2, y + 6); ctx.lineTo(ox + 2, y + 10); ctx.stroke();
  // Top-right
  ctx.beginPath(); ctx.moveTo(ox + 22, y + 6); ctx.lineTo(ox + 18, y + 6); ctx.lineTo(ox + 18, y + 10); ctx.stroke();
  // Bottom-left
  ctx.beginPath(); ctx.moveTo(ox - 2, y + 22); ctx.lineTo(ox + 2, y + 22); ctx.lineTo(ox + 2, y + 18); ctx.stroke();
  // Bottom-right
  ctx.beginPath(); ctx.moveTo(ox + 22, y + 22); ctx.lineTo(ox + 18, y + 22); ctx.lineTo(ox + 18, y + 18); ctx.stroke();

  // Lid
  roundRect(ctx, ox - 2, y + 4, 24, 6, 2);
  ctx.fillStyle = tc.lid;
  ctx.fill();

  // Lid highlight
  roundRect(ctx, ox - 2, y + 4, 24, 2, 2);
  ctx.fillStyle = tc.lock;
  ctx.globalAlpha = 0.2;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Lock plate
  roundRect(ctx, ox + 6, y + 9, 8, 7, 1);
  ctx.fillStyle = tc.body;
  ctx.fill();
  ctx.strokeStyle = tc.lock;
  ctx.lineWidth = 1;
  ctx.stroke();

  // Keyhole
  ctx.fillStyle = tc.lock;
  ctx.globalAlpha = 0.8 + Math.sin(chest.age * 0.15) * 0.2;
  ctx.beginPath();
  ctx.arc(ox + 10, y + 12.5, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.fillStyle = tc.lock;
  ctx.globalAlpha = 0.6;
  ctx.fillRect(ox + 9, y + 12.5, 2, 3);
  ctx.globalAlpha = 1;

  // Crown decoration on lid
  ctx.beginPath();
  ctx.moveTo(ox + 6, y + 2); ctx.lineTo(ox + 7, y + 5); ctx.lineTo(ox + 8.5, y + 3);
  ctx.lineTo(ox + 10, y + 5.5); ctx.lineTo(ox + 11.5, y + 3); ctx.lineTo(ox + 13, y + 5); ctx.lineTo(ox + 14, y + 2);
  ctx.strokeStyle = tc.lock;
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Orbiting particles
  for (let i = 0; i < 3; i++) {
    const px = ox + 10 + Math.sin(chest.age * 0.12 + i * 2.1) * (14 + i * 2);
    const py = y + 10 + Math.cos(chest.age * 0.15 + i * 2.1) * (8 + i * 2);
    const r = tier === 'legendary' ? 1.5 : 1;
    ctx.fillStyle = tc.glow;
    ctx.globalAlpha = 0.3 + Math.sin(chest.age * 0.2 + i * 2) * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Shard chest: Floating crystal cluster ────────────────────────
function drawShardChest(ctx: CanvasRenderingContext2D, chest: Chest, ox: number, oy: number): void {
  const bob = Math.sin(chest.age * 0.08) * 2.5;
  const spin = chest.age * 0.03;

  // Shadow
  ctx.fillStyle = '#6a1aaa';
  ctx.globalAlpha = 0.25;
  fillEllipse(ctx, ox + 10, oy + 20, 10, 4);
  ctx.globalAlpha = 1;

  // Glow
  ctx.fillStyle = '#a855f7';
  ctx.globalAlpha = 0.1 + Math.sin(chest.age * 0.08) * 0.06;
  fillEllipse(ctx, ox + 10, oy + 20, 14, 6);
  ctx.globalAlpha = 1;

  const by = oy + bob;

  // Main crystal
  ctx.fillStyle = '#9a44ee';
  fillPolygon(ctx, [[ox + 10, by - 2], [ox + 14, by + 6], [ox + 12, by + 16], [ox + 8, by + 16], [ox + 6, by + 6]]);
  ctx.strokeStyle = '#c088ff';
  ctx.lineWidth = 0.8;
  strokePolygon(ctx, [[ox + 10, by - 2], [ox + 14, by + 6], [ox + 12, by + 16], [ox + 8, by + 16], [ox + 6, by + 6]]);

  // Main crystal highlight
  ctx.fillStyle = '#b866ff';
  ctx.globalAlpha = 0.7;
  fillPolygon(ctx, [[ox + 10, by - 2], [ox + 14, by + 6], [ox + 10, by + 5]]);
  ctx.globalAlpha = 1;

  // Left crystal
  ctx.fillStyle = '#7a33cc';
  fillPolygon(ctx, [[ox + 3, by + 6], [ox + 5, by + 2], [ox + 7, by + 6], [ox + 6, by + 12], [ox + 4, by + 12]]);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 0.5;
  strokePolygon(ctx, [[ox + 3, by + 6], [ox + 5, by + 2], [ox + 7, by + 6], [ox + 6, by + 12], [ox + 4, by + 12]]);
  ctx.fillStyle = '#9955dd';
  ctx.globalAlpha = 0.6;
  fillPolygon(ctx, [[ox + 5, by + 2], [ox + 7, by + 6], [ox + 5, by + 5]]);
  ctx.globalAlpha = 1;

  // Right crystal
  ctx.fillStyle = '#7a33cc';
  fillPolygon(ctx, [[ox + 13, by + 5], [ox + 15, by + 1], [ox + 17, by + 5], [ox + 16, by + 11], [ox + 14, by + 11]]);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 0.5;
  strokePolygon(ctx, [[ox + 13, by + 5], [ox + 15, by + 1], [ox + 17, by + 5], [ox + 16, by + 11], [ox + 14, by + 11]]);
  ctx.fillStyle = '#9955dd';
  ctx.globalAlpha = 0.6;
  fillPolygon(ctx, [[ox + 15, by + 1], [ox + 17, by + 5], [ox + 15, by + 4]]);
  ctx.globalAlpha = 1;

  // Inner glow
  ctx.fillStyle = '#d4aaff';
  ctx.globalAlpha = 0.15 + Math.sin(chest.age * 0.12) * 0.1;
  fillEllipse(ctx, ox + 10, by + 8, 3, 5);
  ctx.globalAlpha = 1;

  // Orbiting particles
  for (let i = 0; i < 3; i++) {
    const px = ox + 10 + Math.sin(spin + i * 2.09) * 12;
    const py = by + 8 + Math.cos(spin + i * 2.09) * 6;
    ctx.fillStyle = '#d4aaff';
    ctx.globalAlpha = 0.4 + Math.sin(chest.age * 0.15 + i) * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, 1.2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Regalia chest: Slot-specific weapon/shield/necklace ──────────
function drawRegaliaChest(ctx: CanvasRenderingContext2D, chest: Chest, ox: number, oy: number): void {
  const rd = chest.regaliaData;
  const rarity = rd?.rarity || 'common';
  const rc = { common: '#cc88ff', rare: '#4a9fff', legendary: '#ffd700' }[rarity];
  const isLeg = rarity === 'legendary';
  const isRare = rarity === 'rare';
  const pulse = Math.sin(chest.age * 0.12) * 0.3;
  const bob = Math.sin(chest.age * 0.06) * 2;
  const slot = rd?.slot || 'sword';
  const y = oy + bob;

  // Ground glow
  ctx.fillStyle = rc;
  ctx.globalAlpha = 0.15 + pulse * 0.1;
  fillEllipse(ctx, ox + 10, oy + 20, isLeg ? 22 : 16, isLeg ? 9 : 6);
  ctx.globalAlpha = 1;

  // Aura ring for rare/legendary
  if (isLeg || isRare) {
    ctx.strokeStyle = rc;
    ctx.lineWidth = 0.5;
    ctx.globalAlpha = 0.2 + pulse * 0.15;
    strokeEllipse(ctx, ox + 10, y + 10, 18, 14);
    ctx.globalAlpha = 1;
  }

  if (slot === 'sword') {
    // Blade
    roundRect(ctx, ox + 8, y - 6, 4, 22, 1);
    ctx.fillStyle = '#c0c0c0';
    ctx.fill();
    // Blade tip color
    roundRect(ctx, ox + 8, y - 6, 4, 4, 1);
    ctx.fillStyle = rc;
    ctx.globalAlpha = 0.9;
    ctx.fill();
    ctx.globalAlpha = 1;
    // Guard
    roundRect(ctx, ox + 3, y + 12, 14, 3, 1);
    ctx.fillStyle = isLeg ? '#8B6914' : isRare ? '#3a5a8e' : '#5a4a6e';
    ctx.fill();
    // Grip
    ctx.fillStyle = isLeg ? '#654321' : '#3a3a3a';
    ctx.fillRect(ox + 8.5, y + 15, 3, 5);
    // Pommel gem
    ctx.fillStyle = rc;
    ctx.globalAlpha = 0.8 + pulse * 0.2;
    ctx.beginPath();
    ctx.arc(ox + 10, y - 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else if (slot === 'shield') {
    // Shield shape
    ctx.beginPath();
    ctx.moveTo(ox + 10, y - 4);
    ctx.lineTo(ox + 20, y + 2);
    ctx.lineTo(ox + 18, y + 16);
    ctx.lineTo(ox + 10, y + 20);
    ctx.lineTo(ox + 2, y + 16);
    ctx.lineTo(ox + 0, y + 2);
    ctx.closePath();
    ctx.fillStyle = isLeg ? '#8B6914' : isRare ? '#2a3a6e' : '#4a3a5e';
    ctx.fill();
    ctx.strokeStyle = rc;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Cross
    ctx.strokeStyle = rc;
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(ox + 10, y); ctx.lineTo(ox + 10, y + 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox + 3, y + 8); ctx.lineTo(ox + 17, y + 8); ctx.stroke();
    ctx.globalAlpha = 1;
    // Center gem
    ctx.fillStyle = rc;
    ctx.globalAlpha = 0.8 + pulse * 0.2;
    ctx.beginPath();
    ctx.arc(ox + 10, y + 8, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  } else {
    // Necklace chain
    ctx.beginPath();
    ctx.moveTo(ox + 3, y - 2);
    ctx.quadraticCurveTo(ox + 10, y - 8, ox + 17, y - 2);
    ctx.strokeStyle = isLeg ? '#B8860B' : '#888';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // Pendant
    ctx.fillStyle = isLeg ? '#8B6914' : isRare ? '#2a3a6e' : '#4a3a5e';
    fillPolygon(ctx, [[ox + 10, y], [ox + 15, y + 8], [ox + 10, y + 18], [ox + 5, y + 8]]);
    ctx.strokeStyle = rc;
    ctx.lineWidth = 1.5;
    strokePolygon(ctx, [[ox + 10, y], [ox + 15, y + 8], [ox + 10, y + 18], [ox + 5, y + 8]]);
    // Center gem
    ctx.fillStyle = rc;
    ctx.globalAlpha = 0.8 + pulse * 0.2;
    ctx.beginPath();
    ctx.arc(ox + 10, y + 8, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    // Legendary extra gem
    if (isLeg) {
      ctx.fillStyle = '#ff88cc';
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(ox + 10, y + 14, 1.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Orbiting particles (4 for regalia)
  for (let i = 0; i < 4; i++) {
    const px = ox + 10 + Math.sin(chest.age * 0.1 + i * 1.57) * (12 + i * 3);
    const py = y + 8 + Math.cos(chest.age * 0.13 + i * 1.57) * (8 + i * 2);
    const r = isLeg ? 1.5 : 1;
    ctx.fillStyle = rc;
    ctx.globalAlpha = 0.3 + Math.sin(chest.age * 0.2 + i * 2) * 0.3;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Consumable chest: Leather satchel ────────────────────────────
function drawConsumableChest(ctx: CanvasRenderingContext2D, chest: Chest, ox: number, oy: number): void {
  const bob = Math.sin(chest.age * 0.09) * 1;
  const cId = chest.consumableId;
  const isPotion = cId === 'healingPotion';
  const isKey = cId === 'artifactKey' || cId === 'regaliaKey' || cId === 'challengeKey';
  const accent = isPotion ? '#ff5555' : isKey ? '#ffcc33' : '#44ffaa';
  const bodyCol = isPotion ? '#4a1a1a' : isKey ? '#4a3a1a' : '#1a3a2a';
  const lidCol = isPotion ? '#6a2a2a' : isKey ? '#6a5a2a' : '#2a5a3a';
  const y = oy + bob;

  // Shadow
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.2;
  fillEllipse(ctx, ox + 10, oy + 20, 10, 3.5);
  ctx.globalAlpha = 1;

  // Satchel body
  ctx.beginPath();
  ctx.moveTo(ox + 3, y + 8);
  ctx.quadraticCurveTo(ox + 1, y + 12, ox + 2, y + 18);
  ctx.quadraticCurveTo(ox + 4, y + 21, ox + 10, y + 21);
  ctx.quadraticCurveTo(ox + 16, y + 21, ox + 18, y + 18);
  ctx.quadraticCurveTo(ox + 19, y + 12, ox + 17, y + 8);
  ctx.closePath();
  ctx.fillStyle = bodyCol;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Flap
  ctx.beginPath();
  ctx.moveTo(ox + 3, y + 8);
  ctx.quadraticCurveTo(ox + 4, y + 5, ox + 10, y + 4);
  ctx.quadraticCurveTo(ox + 16, y + 5, ox + 17, y + 8);
  ctx.lineTo(ox + 16, y + 10);
  ctx.quadraticCurveTo(ox + 10, y + 8, ox + 4, y + 10);
  ctx.closePath();
  ctx.fillStyle = lidCol;
  ctx.fill();
  ctx.strokeStyle = accent;
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Clasp
  roundRect(ctx, ox + 8, y + 9, 4, 3, 0.5);
  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.7;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Type-specific detail
  if (isPotion) {
    // Small potion bottle
    ctx.fillStyle = '#ff5555';
    ctx.globalAlpha = 0.8;
    roundRect(ctx, ox + 7, y + 13, 6, 5, 1);
    ctx.fill();
    ctx.fillStyle = '#aa2222';
    ctx.fillRect(ox + 8, y + 11, 4, 3);
    ctx.globalAlpha = 1;
  } else if (isKey) {
    // Key shape
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(ox + 10, y + 13, 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(ox + 9.5, y + 14.5, 1, 4);
    ctx.fillRect(ox + 10, y + 17, 2, 1);
    ctx.globalAlpha = 1;
  } else {
    // Scroll lines
    ctx.fillStyle = accent;
    ctx.globalAlpha = 0.4;
    roundRect(ctx, ox + 7, y + 13, 6, 1, 0.5); ctx.fill();
    ctx.globalAlpha = 0.3;
    roundRect(ctx, ox + 7, y + 15, 4, 1, 0.5); ctx.fill();
    roundRect(ctx, ox + 7, y + 17, 5, 1, 0.5); ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Floating particles
  for (let i = 0; i < 2; i++) {
    const px = i === 0
      ? ox - 1 + Math.sin(chest.age * 0.15) * 4
      : ox + 21 + Math.cos(chest.age * 0.18) * 3;
    const py = i === 0
      ? y + 6 + Math.cos(chest.age * 0.12) * 3
      : y + 10 + Math.sin(chest.age * 0.14) * 3;
    const op = i === 0
      ? 0.3 + Math.sin(chest.age * 0.2) * 0.3
      : 0.3 + Math.cos(chest.age * 0.22) * 0.3;
    ctx.fillStyle = accent;
    ctx.globalAlpha = op;
    ctx.beginPath();
    ctx.arc(px, py, 0.8, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Gold chest: Wooden treasure chest ────────────────────────────
function drawGoldChest(ctx: CanvasRenderingContext2D, chest: Chest, ox: number, oy: number): void {
  // Shadow
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.2;
  fillEllipse(ctx, ox + 10, oy + 21, 12, 4);
  ctx.globalAlpha = 1;

  // Body
  roundRect(ctx, ox + 1, oy + 8, 18, 13, 2);
  ctx.fillStyle = '#6B3410';
  ctx.fill();

  // Wood grain lines
  ctx.strokeStyle = '#5a2a08';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(ox + 3, oy + 12); ctx.lineTo(ox + 17, oy + 12); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ox + 3, oy + 16); ctx.lineTo(ox + 17, oy + 16); ctx.stroke();
  ctx.globalAlpha = 1;

  // Top band
  roundRect(ctx, ox, oy + 8, 20, 2, 1);
  ctx.fillStyle = '#8B7355';
  ctx.fill();

  // Bottom band
  roundRect(ctx, ox, oy + 19, 20, 2, 1);
  ctx.fillStyle = '#8B7355';
  ctx.fill();

  // Lid
  roundRect(ctx, ox, oy + 5, 20, 5, 2);
  ctx.fillStyle = '#8B5E3C';
  ctx.fill();

  // Lid highlight
  roundRect(ctx, ox, oy + 5, 20, 2, 2);
  ctx.fillStyle = '#A07040';
  ctx.globalAlpha = 0.6;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Lock plate
  roundRect(ctx, ox + 7, oy + 9, 6, 5, 1);
  ctx.fillStyle = '#5a3a0a';
  ctx.fill();
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Keyhole
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(ox + 10, oy + 11.5, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(ox + 9.5, oy + 11.5, 1, 2.5);

  // Coin peeking from lid
  ctx.fillStyle = '#FFD700';
  fillEllipse(ctx, ox + 13, oy + 5.5, 2, 1.2);
  ctx.strokeStyle = '#DAA520';
  ctx.lineWidth = 0.4;
  strokeEllipse(ctx, ox + 13, oy + 5.5, 2, 1.2);

  // Gold glow
  ctx.fillStyle = '#FFD700';
  ctx.globalAlpha = 0.06 + Math.sin(chest.age * 0.1) * 0.04;
  fillEllipse(ctx, ox + 10, oy + 21, 10, 3);
  ctx.globalAlpha = 1;
}

// ── Gem chest: Crystal-encrusted violet chest ────────────────────
function drawGemChest(ctx: CanvasRenderingContext2D, chest: Chest, ox: number, oy: number): void {
  // Shadow
  ctx.fillStyle = '#2a0a4a';
  ctx.globalAlpha = 0.3;
  fillEllipse(ctx, ox + 10, oy + 21, 12, 4);
  ctx.globalAlpha = 1;

  // Glow
  ctx.fillStyle = '#a855f7';
  ctx.globalAlpha = 0.08 + Math.sin(chest.age * 0.09) * 0.04;
  fillEllipse(ctx, ox + 10, oy + 21, 12, 5);
  ctx.globalAlpha = 1;

  // Body
  roundRect(ctx, ox + 1, oy + 8, 18, 13, 2);
  ctx.fillStyle = '#2a1248';
  ctx.fill();
  ctx.strokeStyle = '#6a3a9e';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Body divider
  ctx.strokeStyle = '#4a2a6e';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(ox + 1, oy + 14); ctx.lineTo(ox + 19, oy + 14); ctx.stroke();
  ctx.globalAlpha = 1;

  // Lid
  roundRect(ctx, ox, oy + 5, 20, 5, 2);
  ctx.fillStyle = '#4a2278';
  ctx.fill();
  ctx.strokeStyle = '#8a5ac8';
  ctx.lineWidth = 0.8;
  ctx.stroke();

  // Lid highlight
  roundRect(ctx, ox, oy + 5, 20, 2, 2);
  ctx.fillStyle = '#6a3aa8';
  ctx.globalAlpha = 0.4;
  ctx.fill();
  ctx.globalAlpha = 1;

  // Center diamond gem
  ctx.globalAlpha = 0.8 + Math.sin(chest.age * 0.12) * 0.2;
  ctx.fillStyle = '#c088ff';
  fillPolygon(ctx, [[ox + 10, oy + 9], [ox + 12.5, oy + 11.5], [ox + 10, oy + 14], [ox + 7.5, oy + 11.5]]);
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 0.8;
  strokePolygon(ctx, [[ox + 10, oy + 9], [ox + 12.5, oy + 11.5], [ox + 10, oy + 14], [ox + 7.5, oy + 11.5]]);
  ctx.globalAlpha = 1;

  // Side gems
  ctx.globalAlpha = 0.6;
  ctx.fillStyle = '#ff55aa';
  fillPolygon(ctx, [[ox + 3, oy + 11], [ox + 4.5, oy + 10], [ox + 6, oy + 11], [ox + 4.5, oy + 12.5]]);
  ctx.fillStyle = '#55aaff';
  fillPolygon(ctx, [[ox + 14, oy + 11], [ox + 15.5, oy + 10], [ox + 17, oy + 11], [ox + 15.5, oy + 12.5]]);
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = '#55ffaa';
  fillPolygon(ctx, [[ox + 3, oy + 16], [ox + 4.5, oy + 15], [ox + 6, oy + 16], [ox + 4.5, oy + 17.5]]);
  ctx.fillStyle = '#ffaa55';
  fillPolygon(ctx, [[ox + 14, oy + 16], [ox + 15.5, oy + 15], [ox + 17, oy + 16], [ox + 15.5, oy + 17.5]]);
  ctx.globalAlpha = 1;

  // Crystal spikes on top
  ctx.fillStyle = '#c088ff';
  ctx.globalAlpha = 0.7;
  fillPolygon(ctx, [[ox + 7, oy + 5], [ox + 8, oy + 1], [ox + 9, oy + 5]]);
  ctx.fillStyle = '#d4aaff';
  ctx.globalAlpha = 0.8;
  fillPolygon(ctx, [[ox + 10, oy + 5], [ox + 11, oy - 1], [ox + 12, oy + 5]]);
  ctx.fillStyle = '#aa66ee';
  ctx.globalAlpha = 0.6;
  fillPolygon(ctx, [[ox + 13, oy + 5], [ox + 14, oy + 2], [ox + 15, oy + 5]]);
  ctx.globalAlpha = 1;

  // Top crystal glow
  ctx.fillStyle = '#d4aaff';
  ctx.globalAlpha = 0.1 + Math.sin(chest.age * 0.1) * 0.08;
  ctx.beginPath();
  ctx.arc(ox + 11, oy + 1, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ── Main chest dispatch ──────────────────────────────────────────
function drawChest(ctx: CanvasRenderingContext2D, chest: Chest, camX: number, _frame: number): void {
  const ox = chest.x - camX;
  const oy = chest.y + WORLD_Y_OFFSET;

  ctx.save();

  if (chest.type.startsWith('relic')) {
    drawRelicChest(ctx, chest, ox, oy);
  } else if (chest.type.startsWith('artifact')) {
    drawArtifactChest(ctx, chest, ox, oy);
  } else if (chest.type === 'shard') {
    drawShardChest(ctx, chest, ox, oy);
  } else if (chest.type === 'regalia') {
    drawRegaliaChest(ctx, chest, ox, oy);
  } else if (chest.type === 'consumable') {
    drawConsumableChest(ctx, chest, ox, oy);
  } else if (chest.type === 'gem') {
    drawGemChest(ctx, chest, ox, oy);
  } else {
    drawGoldChest(ctx, chest, ox, oy);
  }

  ctx.restore();
}

// ── Banners ───────────────────────────────────────────────────────
function drawBanner(ctx: CanvasRenderingContext2D, banner: Banner, camX: number, frame: number): void {
  const sx = banner.x - camX;
  const gy = GROUND_Y + WORLD_Y_OFFSET;

  // Pole
  ctx.fillStyle = '#C8A96E';
  ctx.fillRect(sx, gy - 40, 2, 40);

  // Banner cloth (golden, waving)
  const wave = Math.sin(frame * 0.07 + banner.x * 0.02) * 2;
  ctx.fillStyle = '#ffd700';
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(sx + 2, gy - 38);
  ctx.lineTo(sx + 16, gy - 36 + wave);
  ctx.lineTo(sx + 16, gy - 24 + wave);
  ctx.lineTo(sx + 2, gy - 26);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Aura circle on ground
  const radius = banner.radius;
  const t = frame * 0.04;
  ctx.strokeStyle = '#ffd700';
  ctx.globalAlpha = 0.15 + Math.sin(t) * 0.08;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(sx, gy + 2, radius, 6, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}

// ── Barricades ────────────────────────────────────────────────────
function drawBarricade(ctx: CanvasRenderingContext2D, barr: Barricade, camX: number): void {
  const sx = barr.x - camX;
  const sy = barr.y + WORLD_Y_OFFSET;
  const w = 16;
  const h = 24;
  const hpFrac = barr.health / barr.maxHealth;

  // Stone tower body
  ctx.fillStyle = '#6a6a7a';
  ctx.fillRect(sx, sy - h, w, h);

  // Battlements
  ctx.fillStyle = '#7a7a8a';
  for (let i = 0; i < 3; i++) {
    ctx.fillRect(sx + i * 6, sy - h - 4, 4, 4);
  }

  // Damage cracks
  if (hpFrac < 0.5) {
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy - h + 4);
    ctx.lineTo(sx + 8, sy - h / 2);
    ctx.lineTo(sx + 6, sy - 4);
    ctx.stroke();
  }

  // HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(sx, sy - h - 8, w, 3);
  ctx.fillStyle = hpFrac > 0.5 ? '#4a8' : hpFrac > 0.25 ? '#ca4' : '#c44';
  ctx.fillRect(sx, sy - h - 8, w * hpFrac, 3);
}

// ── Ice Walls ─────────────────────────────────────────────────────
function drawIceWall(ctx: CanvasRenderingContext2D, wall: IceWall, camX: number, frame: number): void {
  const sx = wall.x - camX;
  const sy = wall.y + WORLD_Y_OFFSET;
  const w = 12;
  const h = 20;
  const hpFrac = wall.health / wall.maxHealth;
  const shimmer = 0.6 + Math.sin(frame * 0.08 + wall.x * 0.05) * 0.15;

  // Ice block
  ctx.globalAlpha = shimmer;
  ctx.fillStyle = '#88ccff';
  ctx.fillRect(sx, sy - h, w, h);

  // Highlight
  ctx.fillStyle = '#bbddff';
  ctx.fillRect(sx + 2, sy - h + 2, 3, h - 4);
  ctx.globalAlpha = 1;

  // HP bar
  ctx.fillStyle = '#333';
  ctx.fillRect(sx, sy - h - 6, w, 3);
  ctx.fillStyle = '#66aadd';
  ctx.fillRect(sx, sy - h - 6, w * hpFrac, 3);
}

// ── Boss ──────────────────────────────────────────────────────────
function drawBoss(ctx: CanvasRenderingContext2D, boss: Boss, camX: number, frame: number): void {
  const sx = boss.x - camX;
  const sy = boss.y + WORLD_Y_OFFSET;
  const size = 40;
  const hpFrac = boss.health / boss.maxHealth;
  const bobY = Math.sin(frame * 0.04) * 2;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx + size / 2, sy + 4, size / 2, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyColor = boss.bossType === 0 ? '#4a2a1a' : '#2a1a4a';
  ctx.fillStyle = bodyColor;
  ctx.fillRect(sx + 4, sy - size + bobY + 8, size - 8, size - 8);

  // Head
  ctx.fillStyle = boss.bossType === 0 ? '#5a3a2a' : '#3a2a5a';
  ctx.beginPath();
  ctx.arc(sx + size / 2, sy - size + bobY + 6, 10, 0, Math.PI * 2);
  ctx.fill();

  // Eyes (red, glowing)
  const eyeGlow = 0.7 + Math.sin(frame * 0.1) * 0.3;
  ctx.fillStyle = `rgba(255,50,50,${eyeGlow})`;
  ctx.fillRect(sx + 14, sy - size + bobY + 3, 3, 3);
  ctx.fillRect(sx + 23, sy - size + bobY + 3, 3, 3);

  // Crown/horns
  if (boss.bossType === 0) {
    // Shooter boss — horns
    ctx.fillStyle = '#8B6914';
    ctx.beginPath();
    ctx.moveTo(sx + 10, sy - size + bobY - 2);
    ctx.lineTo(sx + 14, sy - size + bobY + 6);
    ctx.lineTo(sx + 8, sy - size + bobY + 6);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(sx + 30, sy - size + bobY - 2);
    ctx.lineTo(sx + 26, sy - size + bobY + 6);
    ctx.lineTo(sx + 32, sy - size + bobY + 6);
    ctx.fill();
  } else {
    // Laser mage — wizard hat
    ctx.fillStyle = '#4a2a6a';
    ctx.beginPath();
    ctx.moveTo(sx + size / 2, sy - size + bobY - 12);
    ctx.lineTo(sx + size / 2 + 10, sy - size + bobY + 2);
    ctx.lineTo(sx + size / 2 - 10, sy - size + bobY + 2);
    ctx.closePath();
    ctx.fill();
    // Hat star
    ctx.fillStyle = '#ffd700';
    ctx.font = '6px sans-serif';
    ctx.fillText('★', sx + size / 2 - 3, sy - size + bobY - 3);
  }

  // Attack indicator
  if (boss.isAttacking) {
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.6 + Math.sin(frame * 0.3) * 0.3;
    ctx.beginPath();
    ctx.arc(sx + size / 2, sy - size / 2 + bobY, size / 2 + 4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Laser warning
  if (boss.laserWarning > 0) {
    const warningAlpha = 0.3 + Math.sin(frame * 0.4) * 0.2;
    ctx.fillStyle = `rgba(255,100,255,${warningAlpha})`;
    ctx.fillRect(sx - 200, sy - size / 2 + bobY - 2, 600, 4);
  }

  // HP bar (wide, above boss)
  const barW = 50;
  const barX = sx + size / 2 - barW / 2;
  const barY = sy - size + bobY - 16;
  ctx.fillStyle = '#333';
  ctx.fillRect(barX, barY, barW, 4);
  ctx.fillStyle = hpFrac > 0.5 ? '#cc2222' : hpFrac > 0.25 ? '#cc6622' : '#ffcc00';
  ctx.fillRect(barX, barY, barW * hpFrac, 4);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(barX, barY, barW, 4);

  // Boss name
  ctx.fillStyle = '#ff8888';
  ctx.font = 'bold 7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(boss.bossType === 0 ? 'WARLORD' : 'HUNTSMAN', sx + size / 2, barY - 3);
  ctx.textAlign = 'left';
}

// ── Portal ────────────────────────────────────────────────────────
function drawPortal(ctx: CanvasRenderingContext2D, x: number, camX: number, frame: number): void {
  const sx = x - camX;
  const gy = GROUND_Y + WORLD_Y_OFFSET;
  const py = gy - 40;
  const rotation = frame * 2;
  const pulse = 0.7 + Math.sin(frame * 0.08) * 0.3;

  // Outer glow
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#aa44ff';
  ctx.beginPath(); ctx.ellipse(sx, py, 40 * pulse, 45 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#8822dd';
  ctx.beginPath(); ctx.ellipse(sx, py, 30 * pulse, 35 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Swirling arcs
  for (let i = 0; i < 4; i++) {
    const angle = (rotation + i * 90) * Math.PI / 180;
    const r = 22;
    const ax = sx + Math.cos(angle) * r;
    const ay = py + Math.sin(angle) * r * 0.8;
    ctx.save();
    ctx.globalAlpha = 0.4 + i * 0.1;
    ctx.fillStyle = '#cc66ff';
    ctx.beginPath(); ctx.arc(ax, ay, 4 - i * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Inner vortex rings (dashed, spinning)
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#aa44ff';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = frame * 0.8;
  ctx.beginPath(); ctx.ellipse(sx, py, 20, 24, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#cc66ff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -frame * 1.2;
  ctx.beginPath(); ctx.ellipse(sx, py, 14, 17, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Core
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#220044';
  ctx.beginPath(); ctx.ellipse(sx, py, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#110022';
  ctx.beginPath(); ctx.ellipse(sx, py, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Floating rune particles
  for (let i = 0; i < 5; i++) {
    const a = (frame * 0.03 + i * 1.26) % (Math.PI * 2);
    const dr = 18 + Math.sin(frame * 0.05 + i) * 6;
    const rx = sx + Math.cos(a) * dr;
    const ry = py + Math.sin(a) * dr * 0.7;
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(frame * 0.1 + i * 2) * 0.3;
    ctx.fillStyle = '#dd88ff';
    ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Label
  ctx.save();
  ctx.globalAlpha = 0.7 + Math.sin(frame * 0.06) * 0.3;
  ctx.fillStyle = '#dd88ff';
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('ANCIENT DUNGEON', sx, py - 32);
  ctx.restore();

  ctx.setLineDash([]);
}

// ── Home/Retreat Portal ──────────────────────────────────────────
function drawHomePortal(ctx: CanvasRenderingContext2D, x: number, camX: number, frame: number): void {
  const sx = x - camX;
  const gy = GROUND_Y + WORLD_Y_OFFSET;
  const portalSpin = frame * 1.5;
  const pulse = 0.85 + Math.sin(frame * 0.05) * 0.15;
  const floatY = Math.sin(frame * 0.04) * 3;

  // Ground glow ellipse
  ctx.fillStyle = 'rgba(168,85,247,0.15)';
  ctx.beginPath();
  ctx.ellipse(sx, gy + 1, 30 * pulse, 10 * pulse, 0, 0, Math.PI * 2);
  ctx.fill();

  // Outer swirl ring (filled)
  ctx.fillStyle = 'rgba(168,85,247,0.25)';
  ctx.beginPath();
  ctx.ellipse(sx, gy - 1, 25, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Dashed spinning rings
  ctx.save();
  ctx.strokeStyle = 'rgba(168,85,247,0.5)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = portalSpin;
  ctx.beginPath();
  ctx.ellipse(sx, gy - 1, 18, 6, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(200,130,255,0.6)';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.lineDashOffset = -portalSpin * 0.7;
  ctx.beginPath();
  ctx.ellipse(sx, gy - 1, 12, 4.5, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Inner filled core
  ctx.fillStyle = 'rgba(168,85,247,0.8)';
  ctx.beginPath();
  ctx.ellipse(sx, gy - 1, 10, 4, 0, 0, Math.PI * 2);
  ctx.fill();

  // Core glow
  ctx.fillStyle = 'rgba(220,180,255,0.6)';
  ctx.beginPath();
  ctx.ellipse(sx, gy - 1, 6, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Vertical beam from icon to portal
  ctx.strokeStyle = 'rgba(168,85,247,0.25)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx, gy - 72 + floatY);
  ctx.lineTo(sx, gy - 6);
  ctx.stroke();

  // Floating icon above portal
  ctx.fillStyle = 'rgba(168,85,247,0.3)';
  ctx.beginPath();
  ctx.arc(sx, gy - 82 + floatY, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(120,60,200,0.6)';
  ctx.beginPath();
  ctx.arc(sx, gy - 82 + floatY, 7, 0, Math.PI * 2);
  ctx.fill();
  // Spiral emoji
  ctx.fillStyle = '#ddb8ff';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u{1F300}', sx, gy - 78 + floatY);

  // "PORTAL" label
  ctx.fillStyle = '#a855f7';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.fillText('PORTAL', sx, gy + 15);
  ctx.textAlign = 'left';

  ctx.setLineDash([]);
}

// ── Timed Dungeon Portal (fiery orange) ──────────────────────────
function drawTimedDungeonPortal(ctx: CanvasRenderingContext2D, x: number, camX: number, frame: number, timerTicks: number): void {
  const sx = x - camX;
  const gy = GROUND_Y + WORLD_Y_OFFSET;
  const py = gy - 40;
  const rotation = frame * 2.5;
  const pulse = 0.7 + Math.sin(frame * 0.09) * 0.3;

  // Outer glow (fiery)
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#ff6633';
  ctx.beginPath(); ctx.ellipse(sx, py, 40 * pulse, 45 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = '#cc4411';
  ctx.beginPath(); ctx.ellipse(sx, py, 30 * pulse, 35 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Swirling flame arcs
  for (let i = 0; i < 4; i++) {
    const angle = (rotation + i * 90) * Math.PI / 180;
    const r = 22;
    const ax = sx + Math.cos(angle) * r;
    const ay = py + Math.sin(angle) * r * 0.8;
    ctx.save();
    ctx.globalAlpha = 0.4 + i * 0.1;
    ctx.fillStyle = '#ff8844';
    ctx.beginPath(); ctx.arc(ax, ay, 4 - i * 0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Inner vortex rings (dashed, spinning)
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#ff6633';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.lineDashOffset = frame * 0.9;
  ctx.beginPath(); ctx.ellipse(sx, py, 20, 24, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#ff8844';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([6, 4]);
  ctx.lineDashOffset = -frame * 1.3;
  ctx.beginPath(); ctx.ellipse(sx, py, 14, 17, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Core
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#441100';
  ctx.beginPath(); ctx.ellipse(sx, py, 8, 10, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#220800';
  ctx.beginPath(); ctx.ellipse(sx, py, 5, 6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Floating ember particles
  for (let i = 0; i < 5; i++) {
    const a = (frame * 0.035 + i * 1.26) % (Math.PI * 2);
    const dr = 18 + Math.sin(frame * 0.05 + i) * 6;
    const rx = sx + Math.cos(a) * dr;
    const ry = py + Math.sin(a) * dr * 0.7;
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(frame * 0.1 + i * 2) * 0.3;
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath(); ctx.arc(rx, ry, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Labels
  ctx.save();
  ctx.globalAlpha = 0.7 + Math.sin(frame * 0.06) * 0.3;
  ctx.fillStyle = '#ff8844';
  ctx.font = 'bold 9px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('REGALIA DUNGEON', sx, py - 32);
  ctx.restore();

  // Timer countdown
  const timerSec = Math.ceil(timerTicks / 60);
  ctx.save();
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.08) * 0.3;
  ctx.fillStyle = '#ff6633';
  ctx.font = '8px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`TAP TO ENTER (${timerSec}s)`, sx, py + 38);
  ctx.textAlign = 'left';
  ctx.restore();

  ctx.setLineDash([]);
}

// ── Mining Camp (wave dungeon) ────────────────────────────────────
function drawMiningCamp(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  baseX: number,
  camX: number,
  frame: number,
): void {
  const gy = GROUND_Y + WORLD_Y_OFFSET;
  const sx = baseX - camX;
  const pickSwing = Math.sin(frame * 0.1) * 35;
  const miningMax = Math.max(3600, 5400 - ((game as any).dungeonMetaUpgrades?.efficientMining || 0) * 60);
  const miningPct = Math.min(1, ((game as any).dungeonMiningTimer || 0) / miningMax);
  const nearComplete = miningPct > 0.8;
  const glowPulse = nearComplete ? 0.15 + Math.sin(frame * 0.06) * 0.1 : 0.05;

  // Ground glow under camp
  ctx.save();
  ctx.globalAlpha = glowPulse;
  ctx.fillStyle = '#aa44ff';
  ctx.beginPath();
  ctx.ellipse(sx + 35, gy - 2, 50, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Mine entrance (arch)
  ctx.fillStyle = '#2a1a0a';
  roundRect(ctx, sx - 5, gy - 55, 45, 55, 2);
  ctx.fill();
  // Arch top (dark)
  ctx.fillStyle = '#1a0a00';
  ctx.beginPath();
  ctx.ellipse(sx + 17, gy - 55, 22, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // Inner arch (darker)
  ctx.fillStyle = '#0f0508';
  ctx.beginPath();
  ctx.ellipse(sx + 17, gy - 55, 18, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wooden beam supports
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(sx - 2, gy - 56, 4, 56);
  ctx.fillRect(sx + 37, gy - 56, 4, 56);
  // Cross beam
  ctx.fillStyle = '#7a5230';
  roundRect(ctx, sx - 4, gy - 58, 48, 5, 2);
  ctx.fill();

  // Lantern on beam
  ctx.fillStyle = '#8a6a30';
  roundRect(ctx, sx + 1, gy - 68, 5, 6, 1);
  ctx.fill();
  // Lantern glow
  const lanternAlpha = 0.5 + Math.sin(frame * 0.07) * 0.3;
  ctx.save();
  ctx.globalAlpha = lanternAlpha;
  ctx.fillStyle = '#ffaa22';
  ctx.beginPath();
  ctx.arc(sx + 3.5, gy - 62, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.06 + Math.sin(frame * 0.07) * 0.04;
  ctx.beginPath();
  ctx.arc(sx + 3.5, gy - 62, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Ore cart
  const cartX = sx + 50;
  const cartY = gy - 12;
  ctx.fillStyle = '#4a3a2a';
  roundRect(ctx, cartX, cartY + 4, 20, 8, 2);
  ctx.fill();
  // Wheels
  ctx.fillStyle = '#5a4a3a';
  ctx.strokeStyle = '#3a2a1a';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cartX + 3, cartY + 14, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cartX + 17, cartY + 14, 3, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  // Glowing fragments in cart
  const fragColors = ['#bb66ff', '#9944dd', '#aa55ee'];
  const fragPoints = [[4,2, 7,0, 6,4], [10,1, 13,0, 12,4], [15,2, 18,0, 16,3]];
  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.globalAlpha = 0.7 + Math.sin(frame * (0.04 + i * 0.01) + i) * 0.3;
    ctx.fillStyle = fragColors[i];
    const p = fragPoints[i];
    ctx.beginPath();
    ctx.moveTo(cartX + p[0], cartY + p[1]);
    ctx.lineTo(cartX + p[2], cartY + p[3]);
    ctx.lineTo(cartX + p[4], cartY + p[5]);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // Miner
  const minerX = sx + 20;
  const minerY = gy - 22;
  // Body
  ctx.fillStyle = '#8b7355';
  roundRect(ctx, minerX, minerY + 6, 10, 14, 2);
  ctx.fill();
  // Belt
  ctx.fillStyle = '#5a4a3a';
  ctx.fillRect(minerX, minerY + 12, 10, 2);
  // Head
  ctx.fillStyle = '#deb887';
  ctx.beginPath(); ctx.arc(minerX + 5, minerY + 3, 5, 0, Math.PI * 2); ctx.fill();
  // Hard hat
  ctx.fillStyle = '#ddaa22';
  ctx.beginPath(); ctx.ellipse(minerX + 5, minerY, 6, 3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#cc9911';
  roundRect(ctx, minerX - 1, minerY - 1, 12, 2, 1);
  ctx.fill();
  // Eyes
  ctx.fillStyle = '#333';
  ctx.beginPath(); ctx.arc(minerX + 3, minerY + 3, 0.8, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(minerX + 7, minerY + 3, 0.8, 0, Math.PI * 2); ctx.fill();
  // Legs
  ctx.fillStyle = '#5a4a3a';
  roundRect(ctx, minerX + 1, minerY + 20, 3, 5, 1); ctx.fill();
  roundRect(ctx, minerX + 6, minerY + 20, 3, 5, 1); ctx.fill();
  // Pickaxe (animated swing)
  ctx.save();
  ctx.translate(minerX + 10, minerY + 10);
  ctx.rotate(pickSwing * Math.PI / 180);
  ctx.strokeStyle = '#7a6a5a';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -14); ctx.stroke();
  ctx.fillStyle = '#8899aa';
  ctx.beginPath(); ctx.moveTo(10, -16); ctx.lineTo(14, -12); ctx.lineTo(12, -18); ctx.closePath(); ctx.fill();
  ctx.restore();

  // Friendly dungeon flag (purple themed)
  const flagX = sx + 75;
  const flagY = gy - 40;
  ctx.fillStyle = '#6a4a8a';
  ctx.fillRect(flagX, flagY, 2, 40);
  // Flag cloth
  const flagWave = Math.sin(frame * 0.04) * 2;
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#8a44cc';
  ctx.beginPath();
  ctx.moveTo(flagX + 2, flagY + 2);
  ctx.lineTo(flagX + 22 + flagWave, flagY + 8);
  ctx.lineTo(flagX + 20 + flagWave, flagY + 14);
  ctx.lineTo(flagX + 2, flagY + 20);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Near-complete sparkles
  if (nearComplete) {
    for (let i = 0; i < 3; i++) {
      const spX = sx + 15 + Math.sin(frame * 0.03 + i * 2.1) * 20;
      const spY = gy - 40 - Math.abs(Math.sin(frame * 0.04 + i * 1.7)) * 25;
      ctx.save();
      ctx.globalAlpha = 0.3 + Math.sin(frame * 0.08 + i * 2) * 0.3;
      ctx.fillStyle = '#cc88ff';
      ctx.beginPath(); ctx.arc(spX, spY, 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  // Mining progress bar
  const barW = 70;
  const barX = sx;
  const barY = gy - 85;
  // Background
  ctx.fillStyle = '#1a0a2a';
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 0.5;
  roundRect(ctx, barX, barY, barW, 7, 3);
  ctx.fill(); ctx.stroke();
  // Fill
  if (miningPct > 0) {
    ctx.fillStyle = nearComplete ? '#cc66ff' : '#aa44ff';
    roundRect(ctx, barX, barY, barW * miningPct, 7, 3);
    ctx.fill();
  }
  // Text
  ctx.fillStyle = '#fff';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(`\u26CF ${Math.floor(miningPct * 100)}%`, barX + barW / 2, barY + 5.5);

  // Label
  ctx.fillStyle = '#aa66dd';
  ctx.font = 'bold 8px "Press Start 2P", monospace';
  ctx.fillText('MINING CAMP', sx + 35, gy - 95);

  // Ally spawn portal (rally point)
  const portalX = sx + 80;
  const portalY = gy - 20;
  const pp = 0.5 + Math.sin(frame * 0.06) * 0.3;
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#4488ff';
  ctx.beginPath(); ctx.ellipse(portalX, portalY, 18 * pp, 22 * pp, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Outer ring
  ctx.save();
  ctx.globalAlpha = 0.4;
  ctx.strokeStyle = '#6688ff';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 3]);
  ctx.lineDashOffset = frame * 0.6;
  ctx.beginPath(); ctx.ellipse(portalX, portalY, 12, 16, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  // Inner ring
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#88aaff';
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 3]);
  ctx.lineDashOffset = -frame * 0.9;
  ctx.beginPath(); ctx.ellipse(portalX, portalY, 7, 9, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();
  // Core
  ctx.save();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#112244';
  ctx.beginPath(); ctx.ellipse(portalX, portalY, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  // Label
  ctx.save();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#88aaff';
  ctx.font = '6px "Press Start 2P", monospace';
  ctx.fillText('RALLY', portalX, portalY - 20);
  ctx.restore();

  ctx.setLineDash([]);
  ctx.textAlign = 'left';
}

// ── Enemy Portal (wave dungeon) ──────────────────────────────────
function drawEnemyPortal(
  ctx: CanvasRenderingContext2D,
  px: number,
  camX: number,
  frame: number,
): void {
  const gy = GROUND_Y + WORLD_Y_OFFSET;
  const sx = px - camX;
  const py = gy - 35;
  const rot = frame * 2.5;
  const pulse = 0.6 + Math.sin(frame * 0.07) * 0.3;

  // Ground glow
  ctx.save();
  ctx.globalAlpha = 0.08 + Math.sin(frame * 0.04) * 0.04;
  ctx.fillStyle = '#ff2244';
  ctx.beginPath(); ctx.ellipse(sx, gy - 2, 30, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Outer dark glow
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#880022';
  ctx.beginPath(); ctx.ellipse(sx, py, 35 * pulse, 40 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.12;
  ctx.fillStyle = '#aa0033';
  ctx.beginPath(); ctx.ellipse(sx, py, 26 * pulse, 30 * pulse, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Swirling arcs
  for (let i = 0; i < 5; i++) {
    const angle = (rot + i * 72) * Math.PI / 180;
    const r = 18;
    const ax = sx + Math.cos(angle) * r;
    const ay = py + Math.sin(angle) * r * 0.8;
    ctx.save();
    ctx.globalAlpha = 0.35 + i * 0.08;
    ctx.fillStyle = '#ff4466';
    ctx.beginPath(); ctx.arc(ax, ay, 3 - i * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Inner vortex rings
  ctx.save();
  ctx.globalAlpha = 0.45;
  ctx.strokeStyle = '#cc2244';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 5]);
  ctx.lineDashOffset = frame * 0.9;
  ctx.beginPath(); ctx.ellipse(sx, py, 16, 20, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = '#ff4466';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([5, 4]);
  ctx.lineDashOffset = -frame * 1.3;
  ctx.beginPath(); ctx.ellipse(sx, py, 10, 13, 0, 0, Math.PI * 2); ctx.stroke();
  ctx.restore();

  // Dark core
  ctx.save();
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#1a0008';
  ctx.beginPath(); ctx.ellipse(sx, py, 7, 9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.95;
  ctx.fillStyle = '#0a0004';
  ctx.beginPath(); ctx.ellipse(sx, py, 4, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Floating embers
  for (let i = 0; i < 4; i++) {
    const a = (frame * 0.035 + i * 1.57) % (Math.PI * 2);
    const dr = 15 + Math.sin(frame * 0.05 + i) * 5;
    const ex = sx + Math.cos(a) * dr;
    const ey = py + Math.sin(a) * dr * 0.7 - Math.abs(Math.sin(frame * 0.04 + i * 0.8)) * 8;
    ctx.save();
    ctx.globalAlpha = 0.4 + Math.sin(frame * 0.1 + i * 2) * 0.3;
    ctx.fillStyle = '#ff6644';
    ctx.beginPath(); ctx.arc(ex, ey, 1.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  // Label
  ctx.save();
  ctx.globalAlpha = 0.6 + Math.sin(frame * 0.05) * 0.2;
  ctx.fillStyle = '#ff6666';
  ctx.font = 'bold 7px "Press Start 2P", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('\u{1F480} ENEMY PORTAL', sx, py - 30);
  ctx.textAlign = 'left';
  ctx.restore();

  ctx.setLineDash([]);
}

// ── Master draw function ──────────────────────────────────────────
export function drawWorldObjects(
  ctx: CanvasRenderingContext2D,
  game: GameState,
  camX: number,
  frame: number,
): void {
  const cullLeft = camX - 60;
  const cullRight = camX + VIEWPORT_W + 60;

  // Home/retreat portal (behind flags, always visible except in wave dungeon)
  if (!game.inDungeon || (game as any).dungeonType === 'timed') {
    const portalFlagIdx = game.portalFlagIndex ?? 0;
    const pX = portalFlagIdx >= 0 ? (game.flags[portalFlagIdx]?.x || 40) : 40;
    if (pX > cullLeft && pX < cullRight) {
      drawHomePortal(ctx, pX, camX, frame);
    }
  }

  // Banners (behind everything else)
  for (const banner of (game.banners || [])) {
    if (banner.x > cullLeft && banner.x < cullRight) {
      drawBanner(ctx, banner, camX, frame);
    }
  }

  // Barricades
  for (const barr of (game.barricades || [])) {
    if (barr.x > cullLeft && barr.x < cullRight) {
      drawBarricade(ctx, barr, camX);
    }
  }

  // Ice walls
  for (const wall of (game.iceWalls || [])) {
    if (wall.x > cullLeft && wall.x < cullRight) {
      drawIceWall(ctx, wall, camX, frame);
    }
  }

  // Flags (hidden in wave dungeon, shown in timed dungeon + main game)
  if (!game.inDungeon || (game as any).dungeonType === 'timed') {
    for (const flag of game.flags) {
      if (flag.x > cullLeft && flag.x < cullRight) {
        drawFlag(ctx, flag, camX, frame);
      }
    }
  }

  // Wave dungeon: mining camp + enemy portal
  if (game.inDungeon && (game as any).dungeonType === 'wave') {
    const arenaLeft = (game as any).dungeonArenaLeftX || 200;
    if (arenaLeft > cullLeft - 100 && arenaLeft < cullRight + 100) {
      drawMiningCamp(ctx, game, arenaLeft, camX, frame);
    }
    const spawnX = (game as any).dungeonArenaSpawnX || 800;
    if (spawnX > cullLeft - 60 && spawnX < cullRight + 60) {
      drawEnemyPortal(ctx, spawnX, camX, frame);
    }
  }

  // Chests
  for (const chest of (game.chests || [])) {
    if (chest.x > cullLeft && chest.x < cullRight) {
      drawChest(ctx, chest, camX, frame);
    }
  }

  // Boss
  if (game.boss && game.boss.health > 0) {
    if (game.boss.x > cullLeft - 40 && game.boss.x < cullRight) {
      drawBoss(ctx, game.boss, camX, frame);
    }
  }

  // Dungeon portal (spawns near a captured flag)
  if (!game.inDungeon && (game as any).dungeonPortalTimer > 0 && (game as any).dungeonPortalFlagId >= 0) {
    const portalFlag = game.flags.find(f => f.id === (game as any).dungeonPortalFlagId);
    if (portalFlag) {
      const portalX = portalFlag.x + 40;
      if (portalX > cullLeft && portalX < cullRight) {
        drawPortal(ctx, portalX, camX, frame);
      }
    }
  }

  // Timed dungeon portal (fiery orange vortex)
  if (!game.inDungeon && (game as any).timedDungeonPortalFlagId >= 0 && (game as any).timedDungeonPortalTimer > 0) {
    const portalFlag = game.flags.find(f => f.id === (game as any).timedDungeonPortalFlagId);
    if (portalFlag) {
      const portalX = portalFlag.x + 40;
      if (portalX > cullLeft && portalX < cullRight) {
        drawTimedDungeonPortal(ctx, portalX, camX, frame, (game as any).timedDungeonPortalTimer);
      }
    }
  }
}
