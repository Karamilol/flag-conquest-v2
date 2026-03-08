// Environment renderer — SVG tile-based static layers + canvas animated overlays
// Static elements (mountains, treeline, ground, decorations) are pre-rendered as
// SVG-to-bitmap tiles via tileRenderer.ts. Animated elements (clouds, aurora,
// snowflakes, embers, lava glow, campfire) are drawn directly on canvas per frame.

import { VIEWPORT_W, VIEWPORT_H, GAME_HEIGHT, GROUND_Y } from '../constants';
import { BIOME_COLORS, DUNGEON_COLORS, computeBiomeBlend, lerpColor, lerpColorObj } from '../biomeUtils';
import type { Biome } from '../constants';
import { TileCache } from './tileRenderer';

const WORLD_Y_OFFSET = VIEWPORT_H - GAME_HEIGHT; // -20

// ── Sky gradient (canvas — changes per frame based on biome blend) ───

function drawSky(
  ctx: CanvasRenderingContext2D,
  sky: { top: string; mid: string; bot: string },
) {
  const grad = ctx.createLinearGradient(0, 0, 0, VIEWPORT_H);
  grad.addColorStop(0, sky.top);
  grad.addColorStop(0.6, sky.mid);
  grad.addColorStop(1, sky.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
}

// ── Animated atmosphere overlays (canvas per frame) ──────────────

function drawForestAtmosphere(ctx: CanvasRenderingContext2D, frame: number) {
  // Sun glow
  const drawCircle = (cx: number, cy: number, r: number, color: string, alpha: number) => {
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  };
  drawCircle(80, 45, 40, '#ffe8a0', 0.06);
  drawCircle(80, 45, 28, '#ffdd88', 0.12);
  drawCircle(80, 45, 18, '#fff2c8', 0.35);
  drawCircle(80, 45, 10, '#fff8e0', 0.6);
  ctx.globalAlpha = 1;

  // Drifting clouds
  const clouds = [
    { ox: 140, y: 55, w: 80, h: 22 },
    { ox: 320, y: 30, w: 65, h: 16 },
    { ox: 50, y: 95, w: 70, h: 18 },
    { ox: 400, y: 70, w: 55, h: 14 },
    { ox: 230, y: 48, w: 50, h: 13 },
    { ox: 460, y: 110, w: 60, h: 15 },
  ];
  clouds.forEach((c, i) => {
    const cx = ((c.ox + frame * (0.015 + i * 0.003)) % (VIEWPORT_W + c.w * 2)) - c.w;
    ctx.globalAlpha = 0.12 + (i % 3) * 0.04;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.ellipse(cx, c.y, c.w * 0.5, c.h * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx - c.w * 0.25, c.y + c.h * 0.1, c.w * 0.35, c.h * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(cx + c.w * 0.2, c.y + c.h * 0.05, c.w * 0.3, c.h * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawCaveAtmosphere(ctx: CanvasRenderingContext2D) {
  // Warm backlight glow
  const grad = ctx.createRadialGradient(
    VIEWPORT_W * 0.5, VIEWPORT_H * 0.55, 0,
    VIEWPORT_W * 0.5, VIEWPORT_H * 0.55, VIEWPORT_W * 0.38,
  );
  grad.addColorStop(0, 'rgba(232,216,168,0.22)');
  grad.addColorStop(0.25, 'rgba(200,168,104,0.12)');
  grad.addColorStop(0.55, 'rgba(138,104,48,0.05)');
  grad.addColorStop(1, 'rgba(26,16,8,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);

  // Top darkness
  const topGrad = ctx.createLinearGradient(0, 0, 0, 180);
  topGrad.addColorStop(0, 'rgba(14,8,4,0.95)');
  topGrad.addColorStop(0.4, 'rgba(26,16,8,0.5)');
  topGrad.addColorStop(1, 'rgba(26,16,8,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, VIEWPORT_W, 180);

  // Side wall darkness
  const leftGrad = ctx.createLinearGradient(0, 0, 160, 0);
  leftGrad.addColorStop(0, 'rgba(14,8,4,0.7)');
  leftGrad.addColorStop(0.4, 'rgba(26,16,8,0.15)');
  leftGrad.addColorStop(1, 'rgba(26,16,8,0)');
  ctx.fillStyle = leftGrad;
  ctx.fillRect(0, 0, 160, VIEWPORT_H);

  const rightGrad = ctx.createLinearGradient(VIEWPORT_W, 0, VIEWPORT_W - 160, 0);
  rightGrad.addColorStop(0, 'rgba(14,8,4,0.7)');
  rightGrad.addColorStop(0.4, 'rgba(26,16,8,0.15)');
  rightGrad.addColorStop(1, 'rgba(26,16,8,0)');
  ctx.fillStyle = rightGrad;
  ctx.fillRect(VIEWPORT_W - 160, 0, 160, VIEWPORT_H);
}

function drawNordicAtmosphere(ctx: CanvasRenderingContext2D, frame: number) {
  // Dim stars
  for (let i = 0; i < 20; i++) {
    const sx = (i * 127 + 31) % VIEWPORT_W;
    const sy = (i * 53 + 11) % (VIEWPORT_H * 0.35);
    const r = i % 4 === 0 ? 1.2 : 0.6;
    ctx.globalAlpha = 0.15 + Math.sin(frame * 0.03 + i * 2.1) * 0.12;
    ctx.fillStyle = '#c8d8ff';
    ctx.beginPath();
    ctx.arc(sx, sy, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Pale winter sun
  ctx.globalAlpha = 0.03; ctx.fillStyle = '#dde8f0';
  ctx.beginPath(); ctx.arc(90, 130, 35, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.06; ctx.fillStyle = '#e8eef5';
  ctx.beginPath(); ctx.arc(90, 130, 22, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.12; ctx.fillStyle = '#f0f4f8';
  ctx.beginPath(); ctx.arc(90, 130, 12, 0, Math.PI * 2); ctx.fill();

  // Aurora bands
  const bands = [
    { baseY: 30, amplitude: 18, color: '#44ff88', speed: 0.006, phase: 0, op: 0.04 },
    { baseY: 50, amplitude: 22, color: '#4488ff', speed: 0.005, phase: 2, op: 0.05 },
    { baseY: 40, amplitude: 15, color: '#8844dd', speed: 0.007, phase: 4, op: 0.035 },
    { baseY: 60, amplitude: 20, color: '#44ddaa', speed: 0.004, phase: 6, op: 0.03 },
  ];
  bands.forEach((band, bi) => {
    ctx.globalAlpha = band.op + Math.sin(frame * 0.01 + bi * 1.5) * 0.02;
    ctx.fillStyle = band.color;
    ctx.beginPath();
    for (let x = 0; x <= VIEWPORT_W; x += 4) {
      const y = band.baseY + Math.sin(x * 0.008 + frame * band.speed + band.phase) * band.amplitude
        + Math.sin(x * 0.015 + frame * band.speed * 0.7 + band.phase * 1.5) * (band.amplitude * 0.4);
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    for (let x = VIEWPORT_W; x >= 0; x -= 4) {
      const y = band.baseY + 25 + Math.sin(x * 0.008 + frame * band.speed + band.phase + 0.5) * band.amplitude
        + Math.sin(x * 0.015 + frame * band.speed * 0.7 + band.phase * 1.5 + 0.3) * (band.amplitude * 0.4);
      ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function drawVolcanicAtmosphere(ctx: CanvasRenderingContext2D, frame: number) {
  // Thick smoke haze
  ctx.globalAlpha = 0.6; ctx.fillStyle = '#0a0200';
  ctx.fillRect(0, 0, VIEWPORT_W, 50);
  ctx.globalAlpha = 0.4;
  ctx.fillRect(0, 0, VIEWPORT_W, 30);

  // Blood-red sun
  ctx.globalAlpha = 0.06 + Math.sin(frame * 0.008) * 0.02; ctx.fillStyle = '#ff1100';
  ctx.beginPath(); ctx.arc(120, 55, 30, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.1 + Math.sin(frame * 0.008) * 0.03; ctx.fillStyle = '#ff3300';
  ctx.beginPath(); ctx.arc(120, 55, 18, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 0.15; ctx.fillStyle = '#ff6600';
  ctx.beginPath(); ctx.arc(120, 55, 9, 0, Math.PI * 2); ctx.fill();

  // Horizon lava glow
  ctx.globalAlpha = 0.04 + Math.sin(frame * 0.01) * 0.015;
  ctx.fillStyle = '#ff3300';
  ctx.fillRect(0, 170, VIEWPORT_W, 80);

  // Meteors
  for (let i = 0; i < 8; i++) {
    const cycle = 500 + i * 120;
    const phase = (frame + i * 197) % cycle;
    const t = phase / cycle;
    const angle = (25 + (i % 5) * 10) * Math.PI / 180;
    const startX = -30 + (i * 73) % (VIEWPORT_W + 60);
    const startY = 30 + (i * 19) % 60;
    const dist = 200 + (i % 3) * 60;
    const mx = startX + Math.cos(angle) * t * dist;
    const my = startY + Math.sin(angle) * t * dist;
    if (mx < -30 || mx > VIEWPORT_W + 30 || my > 200) continue;
    const tailLen = 14 + (i % 4) * 4;
    const tx = mx - Math.cos(angle) * tailLen;
    const ty = my - Math.sin(angle) * tailLen;
    const op = Math.sin(t * Math.PI) * 0.5;
    const sz = 1.0 + (i % 3) * 0.3;
    ctx.globalAlpha = op;
    ctx.strokeStyle = '#ff7733'; ctx.lineWidth = sz * 0.7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(mx, my); ctx.stroke();
    ctx.fillStyle = '#ffcc77';
    ctx.beginPath(); ctx.arc(mx, my, sz * 0.6, 0, Math.PI * 2); ctx.fill();
  }

  // Heat shimmer
  for (let i = 0; i < 3; i++) {
    const shimY = 200 + i * 15 + Math.sin(frame * 0.015 + i * 2.1) * 3;
    ctx.globalAlpha = 0.015 + Math.sin(frame * 0.01 + i * 1.5) * 0.008;
    ctx.fillStyle = '#ff4400';
    ctx.fillRect(0, shimY, VIEWPORT_W, 8);
  }
  ctx.globalAlpha = 1;
}

// ── Animated weather particles (canvas per frame) ────────────────

function drawNordicSnowflakes(ctx: CanvasRenderingContext2D, camX: number, frame: number, opacity: number) {
  if (opacity < 0.01) return;
  const NORDIC_START = 9400;
  const NORDIC_END = 14400;
  const SNOW_COUNT = 120;
  const margin = 20;

  ctx.globalAlpha = opacity;
  for (let i = 0; i < SNOW_COUNT; i++) {
    const worldX = NORDIC_START + ((i * 73 + 19) % (NORDIC_END - NORDIC_START));
    if (worldX < camX - margin || worldX > camX + VIEWPORT_W + margin) continue;
    const speed = 0.15 + (i * 7 % 10) * 0.02;
    const wobble = Math.sin(frame * 0.02 + i * 2.3) * 8;
    const sy = ((frame * speed + i * 47) % (VIEWPORT_H + 20)) - 10;
    const r = 0.8 + (i % 3) * 0.5;
    const op = 0.15 + (i % 4) * 0.06;
    ctx.globalAlpha = op * opacity;
    ctx.fillStyle = '#dde8f4';
    ctx.beginPath();
    ctx.arc(worldX - camX + wobble, sy + WORLD_Y_OFFSET, r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawVolcanicParticles(ctx: CanvasRenderingContext2D, camX: number, frame: number, opacity: number) {
  if (opacity < 0.01) return;
  const VOLCANIC_START = 13800;
  const VOLCANIC_END = 18800;
  const ASH_COUNT = 140;
  const EMBER_COUNT = 80;
  const margin = 25;

  // Falling ash
  for (let i = 0; i < ASH_COUNT; i++) {
    const worldX = VOLCANIC_START + ((i * 89 + 31) % (VOLCANIC_END - VOLCANIC_START));
    if (worldX < camX - margin || worldX > camX + VIEWPORT_W + margin) continue;
    const speed = 0.06 + (i * 3 % 7) * 0.01;
    const drift = Math.sin(frame * 0.008 + i * 1.6) * 12;
    const ay = ((frame * speed + i * 41) % (VIEWPORT_H + 20)) - 10;
    const r = 0.7 + (i % 4) * 0.4;
    ctx.globalAlpha = (0.07 + (i % 3) * 0.02) * opacity;
    ctx.fillStyle = '#998877';
    ctx.beginPath();
    ctx.arc(worldX - camX + drift, ay + WORLD_Y_OFFSET, r, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rising embers
  const colors = ['#ff5500', '#ff3300', '#ffaa00', '#ff7700'];
  for (let i = 0; i < EMBER_COUNT; i++) {
    const worldX = VOLCANIC_START + ((i * 113 + 47) % (VOLCANIC_END - VOLCANIC_START));
    if (worldX < camX - margin || worldX > camX + VIEWPORT_W + margin) continue;
    const speed = 0.1 + (i * 5 % 8) * 0.018;
    const drift = Math.sin(frame * 0.014 + i * 2.4) * 7;
    const ey = VIEWPORT_H - ((frame * speed + i * 51) % (VIEWPORT_H + 50));
    const flicker = 0.3 + Math.sin(frame * 0.09 + i * 2.9) * 0.2;
    ctx.globalAlpha = flicker * opacity;
    ctx.fillStyle = colors[i % 4];
    ctx.beginPath();
    ctx.arc(worldX - camX + drift, ey + WORLD_Y_OFFSET, 0.8 + (i % 3) * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Animated campfire for home sanctuary ─────────────────────────

function drawCampfire(ctx: CanvasRenderingContext2D, camX: number, frame: number) {
  const baseX = 60;
  const sx = baseX - camX;
  const gy = GROUND_Y + WORLD_Y_OFFSET;
  if (sx < -80 || sx > VIEWPORT_W + 40) return;

  const fireX = sx;
  const fireY = gy - 5;
  const f1 = Math.sin(frame * 0.12) * 0.15;
  const f2 = Math.sin(frame * 0.18 + 1.5) * 0.1;
  const fireH = 8 + Math.sin(frame * 0.08) * 2;

  // Outer fire
  ctx.fillStyle = '#ff4400';
  ctx.globalAlpha = 0.5 + f1;
  ctx.beginPath();
  ctx.moveTo(fireX - 4, fireY);
  ctx.quadraticCurveTo(fireX + f2 * 4, fireY - fireH, fireX + 4, fireY);
  ctx.closePath();
  ctx.fill();
  // Mid fire
  ctx.fillStyle = '#ff8800';
  ctx.globalAlpha = 0.6 + f2;
  ctx.beginPath();
  ctx.moveTo(fireX - 2.5, fireY);
  ctx.quadraticCurveTo(fireX - f1 * 3, fireY - fireH * 0.7, fireX + 2.5, fireY);
  ctx.closePath();
  ctx.fill();
  // Core
  ctx.fillStyle = '#ffdd44';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(fireX - 1.5, fireY);
  ctx.quadraticCurveTo(fireX, fireY - fireH * 0.4, fireX + 1.5, fireY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;

  // Glow
  ctx.globalAlpha = 0.06 + f1 * 0.02;
  ctx.fillStyle = '#ff8844';
  ctx.beginPath(); ctx.arc(fireX, fireY - 4, 20, 0, Math.PI * 2); ctx.fill();
  ctx.globalAlpha = 1;

  // Sparks
  for (let i = 0; i < 4; i++) {
    const sparkPhase = (frame * 0.04 + i * 1.5) % 3;
    const sparkX = fireX + Math.sin(frame * 0.05 + i * 2.1) * 4;
    const sparkY = fireY - 6 - sparkPhase * 8;
    ctx.fillStyle = '#ffaa44';
    ctx.globalAlpha = Math.max(0, 0.5 - sparkPhase * 0.15);
    ctx.fillRect(sparkX, sparkY, 1, 1);
  }
  ctx.globalAlpha = 1;

  // Glowing runes (animated)
  const runeGlow = 0.3 + Math.sin(frame * 0.03) * 0.15;
  ctx.fillStyle = '#88aaff';
  ctx.globalAlpha = runeGlow;
  ctx.fillRect(sx - 12, gy - 20, 4, 6);
  ctx.fillRect(sx - 13, gy - 18, 6, 2);
  ctx.fillRect(sx + 10, gy - 22, 4, 6);
  ctx.fillRect(sx + 9, gy - 20, 6, 2);
  ctx.globalAlpha = 1;

  // Banner wave
  const bannerWave = Math.sin(frame * 0.06) * 1.5;
  ctx.fillStyle = '#8a2244';
  ctx.beginPath();
  ctx.moveTo(sx - 31, gy - 40);
  ctx.lineTo(sx - 20, gy - 38 + bannerWave);
  ctx.lineTo(sx - 20, gy - 30 + bannerWave);
  ctx.lineTo(sx - 31, gy - 32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#C8A96E';
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

// ── Cave torches (animated) ──────────────────────────────────────

function drawCaveTorches(ctx: CanvasRenderingContext2D, frame: number) {
  const torchXs = [100, 250, 350, 450];
  const groundTop = GROUND_Y + WORLD_Y_OFFSET;

  torchXs.forEach((tx, i) => {
    const wallY = WORLD_Y_OFFSET + 60;
    const flicker1 = Math.sin(frame * 0.08 + i * 2.5) * 0.15;
    const flicker2 = Math.sin(frame * 0.12 + i * 1.8) * 0.1;
    const flameH = 8 + Math.sin(frame * 0.06 + i * 3.1) * 2;

    // Wall glow
    ctx.globalAlpha = 0.05 + flicker1 * 0.02;
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath(); ctx.arc(tx, wallY, 40, 0, Math.PI * 2); ctx.fill();

    // Ground light pool
    ctx.globalAlpha = 0.03 + flicker2 * 0.01;
    ctx.fillStyle = '#ffcc66';
    ctx.beginPath(); ctx.ellipse(tx, groundTop + 4, 30, 5, 0, 0, Math.PI * 2); ctx.fill();

    // Torch mount
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#5a4028';
    ctx.fillRect(tx - 1, wallY - 4, 3, 10);

    // Flame layers
    ctx.fillStyle = '#ff6622'; ctx.globalAlpha = 0.6 + flicker1;
    ctx.beginPath(); ctx.moveTo(tx - 3, wallY - 3);
    ctx.quadraticCurveTo(tx + flicker2 * 3, wallY - 3 - flameH, tx + 3, wallY - 3);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#ffaa22'; ctx.globalAlpha = 0.7 + flicker2;
    ctx.beginPath(); ctx.moveTo(tx - 2, wallY - 3);
    ctx.quadraticCurveTo(tx - flicker1 * 2, wallY - 3 - flameH * 0.8, tx + 2, wallY - 3);
    ctx.closePath(); ctx.fill();

    ctx.fillStyle = '#ffee88'; ctx.globalAlpha = 0.8;
    ctx.beginPath(); ctx.moveTo(tx - 1, wallY - 3);
    ctx.quadraticCurveTo(tx, wallY - 3 - flameH * 0.5, tx + 1, wallY - 3);
    ctx.closePath(); ctx.fill();

    ctx.globalAlpha = 1;
  });
}

// ══════════════════════════════════════════════════════════════════
// MASTER DRAW FUNCTION
// ══════════════════════════════════════════════════════════════════

export function drawEnvironment(
  ctx: CanvasRenderingContext2D,
  camX: number,
  frame: number,
  currentZone: number,
  inDungeon: boolean,
  dungeonType: string | undefined,
  tileCache: TileCache,
): void {
  const isDungeon = inDungeon;
  const isTimedDung = isDungeon && dungeonType === 'timed';
  const isWaveDung = isDungeon && dungeonType === 'wave';

  // Resolve sky colors from biome blend
  let sky: { top: string; mid: string; bot: string };
  let primaryBiome: Biome;
  let secondaryBiome: Biome | null = null;
  let blendFactor = 0;
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
    blendFactor = blend.blendFactor;
    blendPrimaryOp = 1 - blendFactor;
    blendSecondaryOp = blendFactor;

    if (secondaryBiome && blendFactor > 0.01) {
      sky = lerpColorObj(BIOME_COLORS[primaryBiome].sky, BIOME_COLORS[secondaryBiome].sky, blendFactor);
    } else {
      sky = BIOME_COLORS[primaryBiome].sky;
      secondaryBiome = null;
    }
  }

  // Ensure tiles are loaded for visible area
  tileCache.ensureVisible(camX, primaryBiome, secondaryBiome);

  // ── 1. Sky gradient ──
  drawSky(ctx, sky);

  // ── 2. Atmosphere overlays (animated, screen-space) ──
  if (!isDungeon) {
    // Draw atmosphere for each visible biome
    if (blendPrimaryOp > 0.01) {
      ctx.save();
      ctx.globalAlpha = blendPrimaryOp;
      drawAtmosphere(ctx, primaryBiome, frame);
      ctx.restore();
    }
    if (secondaryBiome && blendSecondaryOp > 0.01) {
      ctx.save();
      ctx.globalAlpha = blendSecondaryOp;
      drawAtmosphere(ctx, secondaryBiome, frame);
      ctx.restore();
    }
  }

  // ── 3. Mountains (SVG tiles, parallax 0.3x) ──
  if (!isTimedDung) {
    tileCache.drawMountains(ctx, camX, primaryBiome, blendPrimaryOp, WORLD_Y_OFFSET);
    if (secondaryBiome) {
      tileCache.drawMountains(ctx, camX, secondaryBiome, blendSecondaryOp, WORLD_Y_OFFSET);
    }
  }

  // ── 4. Treeline (SVG tiles, parallax 0.55x) ──
  if (!isDungeon && !isTimedDung) {
    tileCache.drawTreeline(ctx, camX, primaryBiome, blendPrimaryOp, WORLD_Y_OFFSET);
    if (secondaryBiome) {
      tileCache.drawTreeline(ctx, camX, secondaryBiome, blendSecondaryOp, WORLD_Y_OFFSET);
    }
  }

  // ── 5. Weather particles (animated, world-space) ──
  if (!isDungeon) {
    // Nordic snowflakes
    const nordicOp = primaryBiome === 'nordic' ? blendPrimaryOp : secondaryBiome === 'nordic' ? blendSecondaryOp : 0;
    drawNordicSnowflakes(ctx, camX, frame, nordicOp);

    // Volcanic ash + embers
    const volcanicOp = primaryBiome === 'volcanic' ? blendPrimaryOp : secondaryBiome === 'volcanic' ? blendSecondaryOp : 0;
    drawVolcanicParticles(ctx, camX, frame, volcanicOp);
  }

  // ── 6. Ground (SVG tiles, parallax 1.0x) ──
  if (!isDungeon) {
    tileCache.drawGround(ctx, camX, primaryBiome, blendPrimaryOp, WORLD_Y_OFFSET);
    if (secondaryBiome) {
      tileCache.drawGround(ctx, camX, secondaryBiome, blendSecondaryOp, WORLD_Y_OFFSET);
    }
  } else {
    // Dungeon ground — simple canvas fallback
    drawDungeonGround(ctx, camX, isDungeon, dungeonType);
  }

  // ── 7. Home Sanctuary (static SVG tile + animated campfire) ──
  if (!isDungeon) {
    tileCache.drawSanctuary(ctx, camX, WORLD_Y_OFFSET);
    drawCampfire(ctx, camX, frame);
  }

  // ── 8. Cave torches (animated, screen-space) ──
  if (!isDungeon && primaryBiome === 'cave') {
    ctx.save();
    ctx.globalAlpha = blendPrimaryOp;
    drawCaveTorches(ctx, frame);
    ctx.restore();
  } else if (!isDungeon && secondaryBiome === 'cave') {
    ctx.save();
    ctx.globalAlpha = blendSecondaryOp;
    drawCaveTorches(ctx, frame);
    ctx.restore();
  }
}

// ── Helpers ──────────────────────────────────────────────────────

function drawAtmosphere(ctx: CanvasRenderingContext2D, biome: Biome, frame: number) {
  switch (biome) {
    case 'forest': drawForestAtmosphere(ctx, frame); break;
    case 'cave': drawCaveAtmosphere(ctx); break;
    case 'nordic': drawNordicAtmosphere(ctx, frame); break;
    case 'volcanic': drawVolcanicAtmosphere(ctx, frame); break;
  }
}

function drawDungeonGround(ctx: CanvasRenderingContext2D, camX: number, inDungeon: boolean, dungeonType?: string) {
  const isWave = dungeonType === 'wave';
  const isTimed = dungeonType === 'timed';
  const colors = isWave ? DUNGEON_COLORS.wave : DUNGEON_COLORS.timed;
  const groundTop = GROUND_Y + WORLD_Y_OFFSET;
  const groundH = VIEWPORT_H - groundTop;

  const grad = ctx.createLinearGradient(0, groundTop, 0, VIEWPORT_H);
  grad.addColorStop(0, colors.gnd.top);
  grad.addColorStop(1, colors.gnd.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundTop, VIEWPORT_W, groundH);

  // Grass line
  ctx.fillStyle = colors.grass;
  ctx.fillRect(0, groundTop, VIEWPORT_W, 2);

  // Depth fade
  const depthGrad = ctx.createLinearGradient(0, groundTop, 0, VIEWPORT_H);
  depthGrad.addColorStop(0, 'rgba(0,0,0,0.05)');
  depthGrad.addColorStop(0.3, 'rgba(0,0,0,0.3)');
  depthGrad.addColorStop(0.7, 'rgba(0,0,0,0.65)');
  depthGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = depthGrad;
  ctx.fillRect(0, groundTop, VIEWPORT_W, groundH);
}
