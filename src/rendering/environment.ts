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

  // Animation parameters (matching v1)
  const flicker = 0.7 + Math.sin(frame * 0.12) * 0.15 + Math.sin(frame * 0.19 + 1) * 0.1;
  const flicker2 = 0.6 + Math.sin(frame * 0.15 + 2) * 0.2;
  const pulse = 0.5 + Math.sin(frame * 0.04) * 0.3;
  const bannerSway = Math.sin(frame * 0.03) * 2;
  const lanternSwing = Math.sin(frame * 0.035) * 1.5;
  const lanternGlow = 0.5 + Math.sin(frame * 0.08) * 0.15;

  // Campfire glow on ground
  ctx.fillStyle = '#ff8833';
  ctx.globalAlpha = flicker * 0.05;
  ctx.beginPath();
  ctx.ellipse(sx, gy, 35, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  // ══ FIRE LAYERS ══
  const fireX = sx;
  const fireY = gy - 3;

  // Outer fire
  ctx.fillStyle = '#ff5511';
  ctx.globalAlpha = flicker * 0.45;
  ctx.beginPath();
  ctx.ellipse(fireX, fireY - 4, 4.5, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  // Mid fire
  ctx.fillStyle = '#ff8833';
  ctx.globalAlpha = flicker * 0.65;
  ctx.beginPath();
  ctx.ellipse(fireX, fireY - 5, 3, 5.5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Core fire
  ctx.fillStyle = '#ffcc44';
  ctx.globalAlpha = flicker * 0.8;
  ctx.beginPath();
  ctx.ellipse(fireX, fireY - 6, 1.8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  // White hot center
  ctx.fillStyle = '#fff';
  ctx.globalAlpha = flicker * 0.2;
  ctx.beginPath();
  ctx.ellipse(fireX, fireY - 7, 0.8, 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sparks rising
  for (let i = 0; i < 4; i++) {
    const sparkX = fireX - 1 + Math.sin(frame * 0.1 + i * 2) * 3;
    const sparkY = gy - 12 - ((frame * 0.15 + i * 5) % 12);
    const op = Math.max(0, 0.5 - ((frame * 0.15 + i * 5) % 12) * 0.04);
    ctx.fillStyle = '#ffaa33';
    ctx.globalAlpha = op * flicker2;
    ctx.beginPath();
    ctx.arc(sparkX, sparkY, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Warm glow halos
  ctx.fillStyle = '#ffcc44';
  ctx.globalAlpha = flicker * 0.04;
  ctx.beginPath();
  ctx.arc(fireX, gy - 3, 18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ff8833';
  ctx.globalAlpha = flicker * 0.015;
  ctx.beginPath();
  ctx.arc(fireX, gy - 3, 30, 0, Math.PI * 2);
  ctx.fill();

  // ══ STEAM FROM POT ══
  ctx.strokeStyle = '#aaa';
  ctx.lineWidth = 0.5;
  ctx.globalAlpha = 0.1 + flicker * 0.05;
  ctx.beginPath();
  ctx.moveTo(fireX - 1, gy - 12);
  ctx.quadraticCurveTo(fireX - 2, gy - 15, fireX, gy - 17);
  ctx.stroke();

  // ══ GLOWING RUNES (wall) ══
  // Main rune (cx=22)
  const runeX = 22 - camX;
  ctx.fillStyle = '#66bbff';
  ctx.globalAlpha = pulse * 0.4;
  ctx.beginPath();
  ctx.arc(runeX, gy - 37, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = pulse * 0.05;
  ctx.beginPath();
  ctx.arc(runeX, gy - 37, 7, 0, Math.PI * 2);
  ctx.fill();
  // Second rune (cx=38)
  const rune2X = 38 - camX;
  ctx.globalAlpha = pulse * 0.25;
  ctx.beginPath();
  ctx.arc(rune2X, gy - 27, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = pulse * 0.03;
  ctx.beginPath();
  ctx.arc(rune2X, gy - 27, 5, 0, Math.PI * 2);
  ctx.fill();

  // Pillar rune (cross shape at x=2)
  const pillarRuneX = 2 - camX;
  ctx.fillStyle = '#66bbff';
  ctx.globalAlpha = pulse * 0.5;
  ctx.fillRect(pillarRuneX - 0.4, gy - 47, 0.8, 6);
  ctx.globalAlpha = pulse * 0.4;
  ctx.fillRect(pillarRuneX - 2, gy - 44, 4, 0.6);

  // ══ FLOOR RUNE (pulsing dashed circle) ══
  const floorRuneX = 50 - camX;
  ctx.strokeStyle = '#66bbff';
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = pulse * 0.15;
  ctx.setLineDash([3, 5]);
  ctx.lineDashOffset = -(frame * 0.12);
  ctx.beginPath();
  ctx.ellipse(floorRuneX, gy - 1, 18, 4, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#66bbff';
  ctx.globalAlpha = pulse * 0.03;
  ctx.beginPath();
  ctx.ellipse(floorRuneX, gy - 1, 10, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();

  // ══ BANNER (swaying, hanging from pillar) ══
  const bannerBaseX = -2 - camX;
  const bannerTopY = gy - 77;
  const bannerBotY = gy - 55;
  const bannerTipY = gy - 50;
  // Banner fabric
  ctx.fillStyle = '#3a5a9a';
  ctx.globalAlpha = 0.8;
  ctx.beginPath();
  ctx.moveTo(bannerBaseX, bannerTopY);
  ctx.lineTo(bannerBaseX + 8, bannerTopY);
  ctx.lineTo(bannerBaseX + 7 + bannerSway, bannerBotY);
  ctx.lineTo(bannerBaseX + 1 + bannerSway, bannerBotY);
  ctx.closePath();
  ctx.fill();
  // Banner pointed bottom
  ctx.globalAlpha = 0.75;
  ctx.beginPath();
  ctx.moveTo(bannerBaseX + 1 + bannerSway, bannerBotY);
  ctx.lineTo(bannerBaseX + 4 + bannerSway, bannerTipY);
  ctx.lineTo(bannerBaseX + 7 + bannerSway, bannerBotY);
  ctx.closePath();
  ctx.fill();
  // Gold border
  ctx.strokeStyle = '#cc9933';
  ctx.lineWidth = 1.2;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(bannerBaseX, bannerTopY);
  ctx.lineTo(bannerBaseX + 8, bannerTopY);
  ctx.stroke();
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.4;
  ctx.beginPath();
  ctx.moveTo(bannerBaseX, bannerTopY);
  ctx.lineTo(bannerBaseX + 1 + bannerSway, bannerBotY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(bannerBaseX + 8, bannerTopY);
  ctx.lineTo(bannerBaseX + 7 + bannerSway, bannerBotY);
  ctx.stroke();
  // Banner emblem (diamond with inner cross)
  const embX = bannerBaseX + 4 + bannerSway * 0.5;
  const embY = gy - 66;
  ctx.fillStyle = '#cc9933';
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.moveTo(embX, embY - 5);
  ctx.lineTo(embX - 2.5, embY);
  ctx.lineTo(embX, embY + 5);
  ctx.lineTo(embX + 2.5, embY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#3a5a9a';
  ctx.lineWidth = 0.6;
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(embX, embY - 4);
  ctx.lineTo(embX, embY + 4);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(embX - 2, embY);
  ctx.lineTo(embX + 2, embY);
  ctx.stroke();

  // ══ HANGING LANTERN (swinging) ══
  const lanternX = 35 - camX + lanternSwing;
  // Lantern glow
  ctx.fillStyle = '#ffdd66';
  ctx.globalAlpha = lanternGlow * 0.6;
  ctx.fillRect(lanternX - 1.5, gy - 44, 3, 4);
  ctx.globalAlpha = lanternGlow * 0.04;
  ctx.beginPath();
  ctx.arc(lanternX, gy - 42, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.globalAlpha = 1;
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
  if (isWaveDung) {
    drawWaveDungeonAtmosphere(ctx, frame);
  } else if (!isDungeon) {
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
  if (isWaveDung) {
    // Wave dungeon uses specific dark purple mountain colors, drawn directly
    drawDungeonMountains(ctx, camX, DUNGEON_COLORS.wave.mtn, WORLD_Y_OFFSET);
  } else if (!isTimedDung) {
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

  // ── 6b. Timed dungeon arena structure (world-space) ──
  if (isTimedDung) {
    drawTimedDungeonArena(ctx, camX, frame);
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

// ── Wave dungeon atmosphere (screen-space: stalactites, crystals, dust) ──

function drawWaveDungeonAtmosphere(ctx: CanvasRenderingContext2D, frame: number) {
  // Stalactites hanging from ceiling
  for (let i = 0; i < 14; i++) {
    const sx = (i * 37 + 12) % VIEWPORT_W;
    const h = 18 + (i * 19) % 35;
    const w = 6 + (i * 11) % 10;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = i % 3 === 0 ? '#120828' : '#0e0520';
    ctx.beginPath();
    ctx.moveTo(sx - w, 0);
    ctx.lineTo(sx + w, 0);
    ctx.lineTo(sx + w * 0.2, h);
    ctx.lineTo(sx - w * 0.2, h * 0.85);
    ctx.closePath();
    ctx.fill();
  }

  // Purple crystals on ceiling (pulsing)
  for (let i = 0; i < 8; i++) {
    const cx = (i * 65 + 20) % VIEWPORT_W;
    const cy = 10 + (i * 23) % 40;
    const pulse = 0.3 + Math.sin(frame * 0.02 + i * 2.8) * 0.2;
    // Glow
    ctx.globalAlpha = pulse * 0.08;
    ctx.fillStyle = '#aa44ff';
    ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();
    // Crystal shape
    ctx.globalAlpha = pulse * 0.6;
    ctx.beginPath();
    ctx.moveTo(cx, cy + 8); ctx.lineTo(cx - 3, cy - 2); ctx.lineTo(cx + 3, cy - 2);
    ctx.closePath(); ctx.fill();
    // Bright tip
    ctx.globalAlpha = pulse * 0.25;
    ctx.fillStyle = '#dd88ff';
    ctx.beginPath(); ctx.arc(cx, cy + 2, 2, 0, Math.PI * 2); ctx.fill();
  }

  // Floating dust motes
  for (let i = 0; i < 12; i++) {
    const dx = (i * 43 + 8) % VIEWPORT_W;
    const dy = 25 + (i * 29) % (VIEWPORT_H * 0.4);
    const drift = Math.sin(frame * 0.007 + i * 2.1) * 10;
    const bob = Math.cos(frame * 0.01 + i * 2.9) * 5;
    const op = 0.06 + Math.sin(frame * 0.018 + i * 3.5) * 0.04;
    ctx.globalAlpha = op;
    ctx.fillStyle = '#cc88ff';
    ctx.beginPath(); ctx.arc(dx + drift, dy + bob, 1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ── Timed dungeon arena structure (world-space: walls, ceiling, torches, vines) ──

function drawTimedDungeonArena(ctx: CanvasRenderingContext2D, camX: number, frame: number) {
  const arenaLeft = -30;
  const arenaRight = 1050;
  const arenaW = arenaRight - arenaLeft;
  const roofY = 220 + WORLD_Y_OFFSET;
  const roofTop = 175 + WORLD_Y_OFFSET;
  const floorY = GROUND_Y + WORLD_Y_OFFSET;

  ctx.save();
  ctx.translate(-camX, 0);

  // Back wall — dark stone
  ctx.globalAlpha = 0.65;
  ctx.fillStyle = '#0d0907';
  ctx.fillRect(arenaLeft, roofTop - 20, arenaW, floorY - roofTop + 25);

  // Back wall brick rows
  ctx.globalAlpha = 0.5;
  const shades = ['#1a1410', '#16110c', '#1e1812', '#14100b'];
  for (let row = 0; row < 7; row++) {
    const by = roofY + 8 + row * 14;
    if (by > floorY - 10) continue;
    const brickW = 35;
    const offsetX = row % 2 === 0 ? 0 : brickW / 2;
    const count = Math.ceil(arenaW / brickW) + 1;
    for (let i = 0; i < count; i++) {
      const bx = arenaLeft + i * brickW + offsetX;
      if (bx > arenaRight) continue;
      ctx.fillStyle = shades[(i + row) % 4];
      ctx.fillRect(bx + 0.5, by + 0.5, brickW - 1, 13);
      ctx.strokeStyle = '#0d0907';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, brickW - 1, 13);
    }
  }

  // Stone ceiling / roof slab
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1c150e';
  ctx.fillRect(arenaLeft, roofTop, arenaW, roofY - roofTop);

  // Ceiling brick rows
  ctx.globalAlpha = 0.85;
  const ceilShades = ['#2e2218', '#261c12', '#332618'];
  for (let row = 0; row < 3; row++) {
    const by = roofTop + row * 15;
    const brickW = 40;
    const offsetX = row % 2 === 0 ? 0 : brickW / 2;
    const count = Math.ceil(arenaW / brickW) + 1;
    for (let i = 0; i < count; i++) {
      const bx = arenaLeft + i * brickW + offsetX;
      if (bx > arenaRight) continue;
      ctx.fillStyle = ceilShades[(i + row) % 3];
      ctx.fillRect(bx + 0.5, by + 0.5, brickW - 1, 14);
      ctx.strokeStyle = '#1a1008';
      ctx.lineWidth = 0.5;
      ctx.strokeRect(bx + 0.5, by + 0.5, brickW - 1, 14);
    }
  }

  // Ceiling crumble edge
  for (let i = 0; i < 28; i++) {
    const cx = arenaLeft + i * (arenaW / 28);
    const h = 4 + Math.sin(i * 2.7) * 5 + Math.sin(i * 4.3) * 2;
    const w = arenaW / 28 + 1;
    ctx.globalAlpha = 0.7 + (i % 3) * 0.1;
    ctx.fillStyle = '#1c150e';
    ctx.fillRect(cx, roofY, w, h);
  }

  // Hanging stone fragments (animated sway)
  const hangXs = [70, 200, 350, 500, 650, 820];
  for (let i = 0; i < hangXs.length; i++) {
    const hx = hangXs[i];
    const hy = roofY + 6 + Math.sin(i * 3.1) * 4;
    const hh = 8 + (i * 7) % 12;
    const hw = 3 + (i * 3) % 4;
    const sway = Math.sin(frame * 0.012 + i * 2.1) * 1.5;
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = '#1c150e';
    ctx.beginPath();
    ctx.moveTo(hx - hw + sway, hy);
    ctx.lineTo(hx + hw + sway, hy);
    ctx.lineTo(hx + sway * 0.5, hy + hh);
    ctx.closePath();
    ctx.fill();
  }

  // Left wall
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1c150e';
  ctx.fillRect(arenaLeft, roofTop, 18, floorY - roofTop);
  for (let i = 0; i < 8; i++) {
    const by = roofY + i * 16;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = i % 2 === 0 ? '#2e2218' : '#261c12';
    ctx.fillRect(arenaLeft + 1, by, 16, 15);
    ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 0.5;
    ctx.strokeRect(arenaLeft + 1, by, 16, 15);
  }

  // Right wall
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#1c150e';
  ctx.fillRect(arenaRight - 18, roofTop, 18, floorY - roofTop);
  for (let i = 0; i < 8; i++) {
    const by = roofY + i * 16;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = i % 2 === 0 ? '#261c12' : '#2e2218';
    ctx.fillRect(arenaRight - 17, by, 16, 15);
    ctx.strokeStyle = '#1a1008'; ctx.lineWidth = 0.5;
    ctx.strokeRect(arenaRight - 17, by, 16, 15);
  }

  // Stone door archway (left side)
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#2e2218';
  ctx.fillRect(arenaLeft + 18, roofY, 12, floorY - roofY);
  ctx.globalAlpha = 0.8;
  ctx.fillRect(arenaLeft + 18, roofY, 50, 10);
  // Arch top
  ctx.globalAlpha = 0.6;
  ctx.strokeStyle = '#3a2e20'; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(arenaLeft + 18, roofY + 10);
  ctx.quadraticCurveTo(arenaLeft + 43, roofY - 5, arenaLeft + 68, roofY + 10);
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.fillStyle = '#2e2218';
  ctx.fillRect(arenaLeft + 56, roofY, 12, floorY - roofY);

  // Stone floor slab
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#2a1e14';
  ctx.fillRect(arenaLeft, floorY - 8, arenaW, 16);
  // Floor tile lines
  ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 0.5; ctx.globalAlpha = 0.4;
  const floorTileCount = Math.ceil(arenaW / 50) + 1;
  for (let i = 0; i < floorTileCount; i++) {
    const tx = arenaLeft + i * 50;
    ctx.beginPath(); ctx.moveTo(tx, floorY - 8); ctx.lineTo(tx, floorY + 8); ctx.stroke();
  }
  ctx.globalAlpha = 0.3;
  ctx.beginPath(); ctx.moveTo(arenaLeft, floorY - 2); ctx.lineTo(arenaRight, floorY - 2); ctx.stroke();

  // Stone pillars along back wall
  const pillarXs = [200, 450, 700, 950];
  for (let i = 0; i < pillarXs.length; i++) {
    const px = pillarXs[i];
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = '#221a10';
    ctx.fillRect(px - 6, roofY, 12, floorY - roofY);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = '#2e2218';
    // Capital
    ctx.fillRect(px - 9, roofY, 18, 6);
    // Base
    ctx.fillRect(px - 9, floorY - 6, 18, 6);
  }

  // Torch sconces on pillars (animated)
  const torchXs = [100, 325, 575, 825, 1000];
  for (let i = 0; i < torchXs.length; i++) {
    const tx = torchXs[i];
    const ty = roofY + 40;
    const flicker = 0.7 + Math.sin(frame * 0.1 + i * 2.3) * 0.2 + Math.sin(frame * 0.17 + i * 4.1) * 0.1;
    const flameH = 12 + Math.sin(frame * 0.13 + i * 1.7) * 4;

    // Wide ambient glow
    ctx.globalAlpha = flicker * 0.04;
    ctx.fillStyle = '#ff8833';
    ctx.beginPath(); ctx.ellipse(tx + 16, ty - 10, 50, 45, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = flicker * 0.06;
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath(); ctx.ellipse(tx + 16, ty - 10, 35, 30, 0, 0, Math.PI * 2); ctx.fill();
    // Ground light pool
    ctx.globalAlpha = flicker * 0.05;
    ctx.fillStyle = '#ff8833';
    ctx.beginPath(); ctx.ellipse(tx + 16, floorY - 2, 40, 6, 0, 0, Math.PI * 2); ctx.fill();

    // Sconce bracket
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = '#3a2a18';
    ctx.fillRect(tx + 8, ty, 8, 3);
    ctx.fillRect(tx + 14, ty - 14, 4, 17);

    // Flame glow
    ctx.globalAlpha = flicker * 0.1;
    ctx.fillStyle = '#ff8833';
    ctx.beginPath(); ctx.ellipse(tx + 16, ty - 18, 16, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = flicker * 0.18;
    ctx.fillStyle = '#ffaa44';
    ctx.beginPath(); ctx.ellipse(tx + 16, ty - 16, 10, 12, 0, 0, Math.PI * 2); ctx.fill();

    // Flame
    ctx.globalAlpha = flicker;
    ctx.fillStyle = '#ff6622';
    ctx.beginPath(); ctx.ellipse(tx + 16, ty - 14 - flameH / 2, 3.5, flameH / 2, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = flicker * 0.85;
    ctx.fillStyle = '#ffcc44';
    ctx.beginPath(); ctx.ellipse(tx + 16, ty - 16 - flameH / 2, 2.5, flameH / 3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = flicker * 0.5;
    ctx.fillStyle = '#fff8dd';
    ctx.beginPath(); ctx.ellipse(tx + 16, ty - 18 - flameH / 3, 1.5, flameH / 4, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Vines hanging from ceiling (animated sway)
  const vineXs = [100, 325, 575, 825, 1000];
  for (let i = 0; i < vineXs.length; i++) {
    const vx = vineXs[i];
    const vineLen = 15 + (i * 11) % 20;
    const sway = Math.sin(frame * 0.008 + i * 1.9) * 3;
    ctx.globalAlpha = 0.4;
    ctx.strokeStyle = '#2a4a1a';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(vx, roofY + 2);
    ctx.quadraticCurveTo(vx + sway, roofY + vineLen * 0.5, vx + sway * 1.5, roofY + vineLen);
    ctx.stroke();
  }

  // Dust motes floating in arena (animated)
  for (let i = 0; i < 15; i++) {
    const dx = arenaLeft + 50 + (i * 73) % (arenaW - 80);
    const baseDy = roofY + 20 + (i * 47) % (floorY - roofY - 40);
    const drift = Math.sin(frame * 0.006 + i * 2.1) * 15;
    const bob = Math.cos(frame * 0.009 + i * 2.9) * 8;
    const op = 0.08 + Math.sin(frame * 0.015 + i * 3.5) * 0.05;
    ctx.globalAlpha = op;
    ctx.fillStyle = '#aa8855';
    ctx.beginPath(); ctx.arc(dx + drift, baseDy + bob, 1.2, 0, Math.PI * 2); ctx.fill();
  }

  // Floor cracks / rubble
  const rubbleXs = [80, 250, 420, 600, 780];
  for (let i = 0; i < rubbleXs.length; i++) {
    const rx = rubbleXs[i];
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#2a2018';
    ctx.fillRect(rx, floorY - 3, 8 + (i * 5) % 10, 3);
    ctx.beginPath(); ctx.arc(rx + 12, floorY - 1, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#221a10';
    ctx.beginPath(); ctx.arc(rx - 3, floorY - 1, 1.5, 0, Math.PI * 2); ctx.fill();
  }

  ctx.restore();
  ctx.globalAlpha = 1;
}

// ── Dungeon mountains (canvas-drawn, not tile-cached) ────────────

function drawDungeonMountains(
  ctx: CanvasRenderingContext2D,
  camX: number,
  mtn: { back: string; front: string },
  yOffset: number,
) {
  const parallaxCamX = camX * 0.3;
  const mtnBaseY = 280 + yOffset; // matches tile mountain base

  // Back range — broad sine-wave silhouettes
  ctx.fillStyle = mtn.back;
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(0, mtnBaseY);
  for (let x = 0; x <= VIEWPORT_W; x += 2) {
    const worldX = x + parallaxCamX;
    const h = 80 * Math.max(0,
      0.45 * Math.sin(worldX * 0.0052 + 1.0) +
      0.30 * Math.sin(worldX * 0.0137 + 1.7) +
      0.15 * Math.sin(worldX * 0.0031 + 0.5) +
      0.10 * Math.sin(worldX * 0.0243 + 2.3)
    );
    ctx.lineTo(x, mtnBaseY - h);
  }
  ctx.lineTo(VIEWPORT_W, mtnBaseY);
  ctx.closePath();
  ctx.fill();

  // Front range — sharper, taller
  ctx.fillStyle = mtn.front;
  ctx.beginPath();
  ctx.moveTo(0, mtnBaseY);
  for (let x = 0; x <= VIEWPORT_W; x += 2) {
    const worldX = x + parallaxCamX;
    const h = 60 * Math.max(0,
      0.45 * Math.sin(worldX * 0.0052 + 3.5) +
      0.30 * Math.sin(worldX * 0.0137 + 5.95) +
      0.15 * Math.sin(worldX * 0.0031 + 1.75) +
      0.10 * Math.sin(worldX * 0.0243 + 8.05)
    );
    ctx.lineTo(x, mtnBaseY - h);
  }
  ctx.lineTo(VIEWPORT_W, mtnBaseY);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

// ── Dungeon ground ──────────────────────────────────────────────

function drawDungeonGround(ctx: CanvasRenderingContext2D, camX: number, _inDungeon: boolean, dungeonType?: string) {
  const isWave = dungeonType === 'wave';
  const colors = isWave ? DUNGEON_COLORS.wave : DUNGEON_COLORS.timed;
  const groundTop = GROUND_Y + WORLD_Y_OFFSET;
  const groundH = VIEWPORT_H - groundTop;

  // Main ground gradient
  const grad = ctx.createLinearGradient(0, groundTop, 0, VIEWPORT_H);
  grad.addColorStop(0, colors.gnd.top);
  grad.addColorStop(1, colors.gnd.bot);
  ctx.fillStyle = grad;
  ctx.fillRect(0, groundTop, VIEWPORT_W, groundH);

  // Grass blade rects (matching v1 — every 60px in world-space)
  ctx.fillStyle = colors.grass;
  ctx.globalAlpha = 0.3;
  const worldEnd = 2000;
  const startI = Math.max(0, Math.floor((camX - 50) / 60));
  const endI = Math.ceil((camX + VIEWPORT_W + 50) / 60);
  for (let i = startI; i <= endI && i < Math.ceil(worldEnd / 60); i++) {
    const bx = i * 60 + 10 - camX;
    ctx.fillRect(bx, groundTop + 5, 40, 3);
  }
  ctx.globalAlpha = 1;

  // Grass top line
  ctx.fillStyle = colors.grass;
  ctx.fillRect(0, groundTop, VIEWPORT_W, 2);

  // Underground cross-section
  const pathBottom = groundTop + 14;
  ctx.fillStyle = '#2a1a2a'; // dark dirt for dungeon
  ctx.fillRect(0, pathBottom, VIEWPORT_W, VIEWPORT_H - pathBottom);
  // Separator line
  ctx.fillStyle = '#000';
  ctx.globalAlpha = 0.2;
  ctx.fillRect(0, pathBottom - 1, VIEWPORT_W, 2);
  ctx.globalAlpha = 1;

  // Depth fade
  const depthGrad = ctx.createLinearGradient(0, groundTop, 0, VIEWPORT_H);
  depthGrad.addColorStop(0, 'rgba(0,0,0,0.05)');
  depthGrad.addColorStop(0.3, 'rgba(0,0,0,0.3)');
  depthGrad.addColorStop(0.7, 'rgba(0,0,0,0.65)');
  depthGrad.addColorStop(1, 'rgba(0,0,0,0.9)');
  ctx.fillStyle = depthGrad;
  ctx.fillRect(0, groundTop, VIEWPORT_W, groundH);
}
