import { GROUND_Y, VIEWPORT_W } from '../../constants';

// ── Colors ──────────────────────────────────────────────────────
const ROCK_DARK = '#2a1a3a';
const ROCK_MID = '#3a2a4a';
const ROCK_LIGHT = '#4a3a5a';
const STONE_DARK = '#1e1428';
const STONE_MID = '#2e2438';
const STONE_LIGHT = '#3e3448';
const CRYSTAL_COLORS = ['#aa44ff', '#4488ff', '#44ddaa', '#ff44aa'];
const MUSHROOM_GLOW = '#88ffaa';
const MUSHROOM_CAP = '#44aa66';
const MUSHROOM_STEM = '#ccddbb';
const MOSS_CAVE = '#3a5a4a';
const WATER_LIGHT = '#4488cc';
const WATER_DARK = '#2266aa';
const BONE_COLOR = '#c8c0b0';

const GY = GROUND_Y;
const CAVE_START = 5200; // slight overlap for blend
const CAVE_END = 9800;

// ── Seeded pseudo-random ────────────────────────────────────────
function seeded(i: number, salt = 0): number {
  return ((Math.sin((i + salt) * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1;
}

// ════════════════════════════════════════════════════════════════
// 1. ROCKY GROUND EDGE — jagged stone surface instead of grass
// ════════════════════════════════════════════════════════════════
const ROCK_SEG_W = 500;
const ROCK_SEGS = Math.ceil((CAVE_END - CAVE_START) / ROCK_SEG_W);

function renderRockyEdge(): JSX.Element {
  return (
    <g>
      {Array.from({ length: ROCK_SEGS }, (_, seg) => {
        const segStart = CAVE_START + seg * ROCK_SEG_W;
        const segEnd = Math.min(segStart + ROCK_SEG_W, CAVE_END);

        // Jagged rocky ground edge — uneven stone surface
        let darkPts = `${segStart},${GY + 2} `;
        let lightPts = `${segStart},${GY + 1} `;
        for (let x = segStart; x <= segEnd; x += 6) {
          const s = seeded(x, 100);
          const rockH = 1 + s * 4; // short jagged rocks (1-5px)
          const tipX = x + (s - 0.5) * 3;
          darkPts += `${tipX},${GY - rockH} ${x + 3},${GY - rockH * 0.2} `;
          // Lighter inner layer offset slightly
          const s2 = seeded(x, 101);
          const rockH2 = 0.5 + s2 * 2.5;
          lightPts += `${x + 1},${GY - rockH2} ${x + 4},${GY - rockH2 * 0.3} `;
        }
        darkPts += `${segEnd},${GY + 2}`;
        lightPts += `${segEnd},${GY + 1}`;

        return (
          <g key={`re${seg}`}>
            <polygon points={darkPts} fill={ROCK_DARK} opacity={0.7} />
            <polygon points={lightPts} fill={ROCK_MID} opacity={0.4} />
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. GROUND LAYERS — cave floor: stone, sediment, embedded gems
// ════════════════════════════════════════════════════════════════
function renderGroundLayers(): JSX.Element {
  const totalStones = Math.ceil((CAVE_END - CAVE_START) / 70);
  const totalCracks = Math.ceil((CAVE_END - CAVE_START) / 120);
  const totalGems = Math.ceil((CAVE_END - CAVE_START) / 200);

  return (
    <g>
      {/* Stone floor layers */}
      <rect x={CAVE_START} y={GY} width={CAVE_END - CAVE_START} height={5} fill={STONE_DARK} opacity={0.4} />
      <rect x={CAVE_START} y={GY + 5} width={CAVE_END - CAVE_START} height={8} fill={STONE_MID} opacity={0.25} />
      <rect x={CAVE_START} y={GY + 13} width={CAVE_END - CAVE_START} height={12} fill={ROCK_DARK} opacity={0.2} />

      {/* Embedded stones / pebbles */}
      {Array.from({ length: totalStones }, (_, i) => {
        const sx = CAVE_START + i * 70 + seeded(i, 110) * 35;
        if (sx > CAVE_END) return null;
        const sy = GY + 3 + seeded(i, 111) * 10;
        const sw = 3 + seeded(i, 112) * 5;
        const sh = 2 + seeded(i, 113) * 2;
        return (
          <g key={`cs${i}`}>
            <ellipse cx={sx} cy={sy} rx={sw} ry={sh} fill={STONE_LIGHT} opacity={0.25} />
            <ellipse cx={sx - 0.5} cy={sy - 0.3} rx={sw * 0.6} ry={sh * 0.5} fill={ROCK_LIGHT} opacity={0.1} />
          </g>
        );
      })}

      {/* Floor cracks */}
      {Array.from({ length: totalCracks }, (_, i) => {
        const cx = CAVE_START + i * 120 + seeded(i, 120) * 60;
        if (cx > CAVE_END) return null;
        const len = 8 + seeded(i, 121) * 15;
        const angle = (seeded(i, 122) - 0.5) * 40;
        return (
          <line key={`ck${i}`}
            x1={cx} y1={GY + 1}
            x2={cx + len * Math.cos(angle * Math.PI / 180)}
            y2={GY + 1 + len * Math.sin(angle * Math.PI / 180) * 0.3}
            stroke="#0a0418" strokeWidth={0.8} opacity={0.3} />
        );
      })}

      {/* Embedded crystal fragments */}
      {Array.from({ length: totalGems }, (_, i) => {
        const gx = CAVE_START + i * 200 + seeded(i, 130) * 120;
        if (gx > CAVE_END) return null;
        const gy = GY + 4 + seeded(i, 131) * 8;
        const col = CRYSTAL_COLORS[i % 4];
        return (
          <g key={`gem${i}`}>
            <polygon points={`${gx},${gy - 2} ${gx - 1.5},${gy + 1} ${gx + 1.5},${gy + 1}`}
              fill={col} opacity={0.35} />
            <circle cx={gx} cy={gy} r={3} fill={col} opacity={0.04} />
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. GROUND DECORATIONS — 6 types, every ~80px
// ════════════════════════════════════════════════════════════════

function renderCrystalCluster(x: number, i: number, frame: number): JSX.Element {
  const col = CRYSTAL_COLORS[i % 4];
  const pulse = 0.4 + Math.sin(frame * 0.02 + i * 3.1) * 0.2;
  const count = 2 + Math.floor(seeded(i, 200) * 3);
  return (
    <g>
      {/* Ground glow */}
      <ellipse cx={x + 4} cy={GY} rx={12} ry={3} fill={col} opacity={pulse * 0.06} />
      {Array.from({ length: count }, (_, ci) => {
        const cx = x + ci * 6 - 3 + seeded(i, 201 + ci) * 4;
        const h = 8 + seeded(i, 202 + ci) * 10;
        const w = 2 + seeded(i, 203 + ci) * 3;
        const tilt = (seeded(i, 204 + ci) - 0.5) * 15;
        return (
          <g key={ci}>
            <polygon
              points={`${cx - w},${GY} ${cx + w},${GY} ${cx + tilt + w * 0.15},${GY - h} ${cx + tilt - w * 0.15},${GY - h * 0.9}`}
              fill={col} opacity={pulse * 0.65} />
            {/* Highlight edge */}
            <line x1={cx + tilt - w * 0.1} y1={GY - h * 0.9}
              x2={cx - w * 0.5} y2={GY}
              stroke="#fff" strokeWidth={0.4} opacity={pulse * 0.2} />
          </g>
        );
      })}
      {/* Bright core */}
      <circle cx={x + 3} cy={GY - 6} r={1.5} fill="#fff" opacity={pulse * 0.25} />
    </g>
  );
}

function renderGlowMushroom(x: number, i: number, frame: number): JSX.Element {
  const count = 2 + Math.floor(seeded(i, 210) * 2);
  const glow = 0.3 + Math.sin(frame * 0.015 + i * 2.3) * 0.15;
  return (
    <g>
      {/* Ground glow pool */}
      <ellipse cx={x + 4} cy={GY} rx={10} ry={3} fill={MUSHROOM_GLOW} opacity={glow * 0.05} />
      {Array.from({ length: count }, (_, mi) => {
        const mx = x + mi * 6 - 1 + seeded(i, 211 + mi) * 3;
        const mh = 4 + seeded(i, 212 + mi) * 6;
        const capW = 3 + seeded(i, 213 + mi) * 2;
        const capH = 2 + seeded(i, 214 + mi) * 1.5;
        const lean = (seeded(i, 215 + mi) - 0.5) * 2;
        return (
          <g key={mi}>
            {/* Stem */}
            <rect x={mx - 0.8 + lean * 0.5} y={GY - mh} width={1.6} height={mh}
              fill={MUSHROOM_STEM} opacity={0.7} rx={0.3} />
            {/* Cap */}
            <ellipse cx={mx + lean} cy={GY - mh} rx={capW} ry={capH}
              fill={MUSHROOM_CAP} opacity={0.8} />
            {/* Glow spots on cap */}
            <ellipse cx={mx + lean - 0.5} cy={GY - mh - capH * 0.2} rx={capW * 0.4} ry={capH * 0.3}
              fill={MUSHROOM_GLOW} opacity={glow * 0.4} />
            {/* Tiny spores */}
            {seeded(i, 216 + mi) > 0.5 && (
              <circle cx={mx + lean} cy={GY - mh - capH - 2 - Math.sin(frame * 0.01 + mi) * 1}
                r={0.6} fill={MUSHROOM_GLOW} opacity={glow * 0.3} />
            )}
          </g>
        );
      })}
    </g>
  );
}

function renderStalagmite(x: number, i: number): JSX.Element {
  const h = 10 + seeded(i, 220) * 12;
  const w = 4 + seeded(i, 221) * 4;
  const hasMoss = seeded(i, 222) > 0.6;
  return (
    <g>
      {/* Shadow */}
      <ellipse cx={x} cy={GY + 1} rx={w * 0.7} ry={1.5} fill="#000" opacity={0.12} />
      {/* Main body */}
      <polygon points={`${x - w},${GY} ${x + w},${GY} ${x + w * 0.1},${GY - h} ${x - w * 0.1},${GY - h * 0.9}`}
        fill={ROCK_MID} opacity={0.75} />
      {/* Highlight edge */}
      <polygon points={`${x + w * 0.5},${GY} ${x + w},${GY} ${x + w * 0.1},${GY - h}`}
        fill={ROCK_LIGHT} opacity={0.2} />
      {/* Moss patch */}
      {hasMoss && (
        <ellipse cx={x - w * 0.3} cy={GY - h * 0.3} rx={w * 0.4} ry={h * 0.08}
          fill={MOSS_CAVE} opacity={0.5}
          transform={`rotate(-10, ${x - w * 0.3}, ${GY - h * 0.3})`} />
      )}
    </g>
  );
}

function renderCaveRock(x: number, i: number): JSX.Element {
  const w = 8 + seeded(i, 230) * 10;
  const h = 4 + seeded(i, 231) * 5;
  const hasVein = seeded(i, 232) > 0.4;
  const veinCol = CRYSTAL_COLORS[i % 4];
  return (
    <g>
      {/* Shadow */}
      <ellipse cx={x + w * 0.5} cy={GY + 1} rx={w * 0.55} ry={1.5} fill="#000" opacity={0.1} />
      {/* Rock body */}
      <ellipse cx={x + w * 0.5} cy={GY - h * 0.4} rx={w * 0.5} ry={h * 0.5}
        fill={STONE_MID} opacity={0.65} />
      {/* Highlight */}
      <ellipse cx={x + w * 0.4} cy={GY - h * 0.55} rx={w * 0.3} ry={h * 0.25}
        fill={STONE_LIGHT} opacity={0.2} />
      {/* Crystal vein */}
      {hasVein && (
        <path d={`M${x + w * 0.2},${GY - h * 0.3} Q${x + w * 0.5},${GY - h * 0.6} ${x + w * 0.8},${GY - h * 0.2}`}
          stroke={veinCol} strokeWidth={1} fill="none" opacity={0.35} />
      )}
    </g>
  );
}

function renderWaterPuddle(x: number, i: number, frame: number): JSX.Element {
  const w = 10 + seeded(i, 240) * 12;
  const shimmer = 0.15 + Math.sin(frame * 0.012 + i * 2.7) * 0.05;
  return (
    <g>
      {/* Dark water body */}
      <ellipse cx={x + w * 0.5} cy={GY} rx={w * 0.5} ry={2.5}
        fill={WATER_DARK} opacity={0.4} />
      {/* Surface highlight / reflection */}
      <ellipse cx={x + w * 0.45} cy={GY - 0.5} rx={w * 0.3} ry={1}
        fill={WATER_LIGHT} opacity={shimmer} />
      {/* Ripple */}
      <ellipse cx={x + w * 0.5 + Math.sin(frame * 0.008 + i) * 2} cy={GY - 0.3}
        rx={w * 0.15} ry={0.5}
        fill="#fff" opacity={shimmer * 0.4} />
    </g>
  );
}

function renderBonePile(x: number, i: number): JSX.Element {
  const count = 2 + Math.floor(seeded(i, 250) * 3);
  return (
    <g>
      {Array.from({ length: count }, (_, bi) => {
        const bx = x + bi * 4 - 2 + seeded(i, 251 + bi) * 3;
        const len = 4 + seeded(i, 252 + bi) * 5;
        const angle = -30 + seeded(i, 253 + bi) * 60;
        const rad = angle * Math.PI / 180;
        return (
          <g key={bi}>
            <line x1={bx} y1={GY - 1}
              x2={bx + Math.cos(rad) * len} y2={GY - 1 - Math.sin(rad) * len}
              stroke={BONE_COLOR} strokeWidth={1.2} opacity={0.5}
              strokeLinecap="round" />
            {/* Bone end knob */}
            <circle cx={bx + Math.cos(rad) * len} cy={GY - 1 - Math.sin(rad) * len}
              r={0.8} fill={BONE_COLOR} opacity={0.4} />
          </g>
        );
      })}
      {/* Skull? Only sometimes */}
      {seeded(i, 258) > 0.7 && (
        <g>
          <circle cx={x + 2} cy={GY - 3} r={2.5} fill={BONE_COLOR} opacity={0.45} />
          <circle cx={x + 1.2} cy={GY - 3.5} r={0.5} fill="#1a0a2e" opacity={0.5} />
          <circle cx={x + 2.8} cy={GY - 3.5} r={0.5} fill="#1a0a2e" opacity={0.5} />
        </g>
      )}
    </g>
  );
}

const DECOR_RENDERERS = [
  (x: number, i: number, f: number) => renderCrystalCluster(x, i, f),
  (x: number, i: number, f: number) => renderGlowMushroom(x, i, f),
  (x: number, i: number, _f: number) => renderStalagmite(x, i),
  (x: number, i: number, _f: number) => renderCaveRock(x, i),
  (x: number, i: number, f: number) => renderWaterPuddle(x, i, f),
  (x: number, i: number, _f: number) => renderBonePile(x, i),
];

function renderGroundDecorations(camX: number, frame: number): JSX.Element {
  const decorCount = Math.ceil((CAVE_END - CAVE_START) / 80);
  return (
    <g>
      {Array.from({ length: decorCount }, (_, i) => {
        const dx = CAVE_START + i * 80 + 30 + (i * 17) % 40;
        if (dx > CAVE_END) return null;
        if (dx < camX - 40 || dx > camX + VIEWPORT_W + 40) return null;
        const type = i % 6;
        return (
          <g key={`cd${i}`}>
            {DECOR_RENDERERS[type](dx, i, frame)}
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. FOREGROUND — sparse cave elements in front of units
// ════════════════════════════════════════════════════════════════
function renderForeground(camX: number, frame: number): JSX.Element {
  const SPACING = 140;
  const totalClumps = Math.ceil((CAVE_END - CAVE_START) / SPACING);
  const cullLeft = camX - 40;
  const cullRight = camX + VIEWPORT_W + 40;

  return (
    <g>
      {Array.from({ length: totalClumps }, (_, i) => {
        const baseX = CAVE_START + i * SPACING + seeded(i, 300) * 60;
        if (baseX > CAVE_END || baseX < cullLeft || baseX > cullRight) return null;
        const type = i % 3;

        if (type === 0) {
          // Small stalagmite tip poking up
          const h = 5 + seeded(i, 301) * 6;
          const w = 2 + seeded(i, 302) * 2;
          return (
            <g key={`cf${i}`} opacity={0.3}>
              <polygon points={`${baseX - w},${GY + 2} ${baseX + w},${GY + 2} ${baseX + 0.3},${GY - h}`}
                fill={ROCK_MID} />
            </g>
          );
        }
        if (type === 1) {
          // Tiny glowing mushroom
          const glow = 0.2 + Math.sin(frame * 0.018 + i * 2.5) * 0.1;
          return (
            <g key={`cf${i}`} opacity={0.35}>
              <rect x={baseX - 0.5} y={GY - 3} width={1} height={3} fill={MUSHROOM_STEM} opacity={0.6} />
              <ellipse cx={baseX} cy={GY - 3} rx={2} ry={1.2} fill={MUSHROOM_CAP} opacity={0.7} />
              <ellipse cx={baseX} cy={GY - 3.2} rx={1.2} ry={0.6} fill={MUSHROOM_GLOW} opacity={glow} />
            </g>
          );
        }
        // Small rubble / pebbles
        return (
          <g key={`cf${i}`} opacity={0.25}>
            <circle cx={baseX} cy={GY + 1} r={1.5} fill={STONE_MID} />
            <circle cx={baseX + 3} cy={GY + 0.5} r={1} fill={STONE_LIGHT} />
            <circle cx={baseX - 2} cy={GY + 1.2} r={0.8} fill={STONE_DARK} />
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════
export function CaveGroundSurface(): JSX.Element {
  return (
    <g>
      {renderRockyEdge()}
    </g>
  );
}

export function CaveGroundDecorations({ camX, frame }: { camX: number; frame: number }): JSX.Element {
  return renderGroundDecorations(camX, frame);
}

export function CaveForeground({ camX, frame }: { camX: number; frame: number }): JSX.Element {
  return renderForeground(camX, frame);
}
