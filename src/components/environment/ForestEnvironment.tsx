import { GROUND_Y, VIEWPORT_W } from '../../constants';

// ── Colors ──────────────────────────────────────────────────────
const GRASS_DARK = '#2a5a1a';
const GRASS_MID = '#3a6a2a';
const GRASS_LIGHT = '#4a7a3a';
const BARK_DARK = '#3a2a1a';
const BARK_MID = '#5a3a1a';
const BARK_LIGHT = '#6a4a2a';
const CANOPY_DARK = '#1a4a18';
const CANOPY_MID = '#2a5a28';
const CANOPY_LIGHT = '#3a6a38';
const CANOPY_HIGHLIGHT = '#4a7a48';
const DIRT_MID = '#5a4a3a';
const DIRT_LIGHT = '#6a5a4a';
const STONE_MID = '#6a6a6a';
const STONE_LIGHT = '#7a7a7a';
const TOPSOIL = '#3a5a2a';
const SUBSOIL = '#5a4a30';
const CLAY = '#6a5a40';
const FLOWER_COLORS = ['#ff6688', '#ffaa44', '#dddd44', '#ff88bb', '#88bbff', '#ff7766', '#cc88ff'];
const MUSHROOM_CAP = '#c4785a';
const MUSHROOM_STEM = '#e8d8c0';
const FERN_GREEN = '#2a6a28';
const FERN_LIGHT = '#3a7a38';
const BERRY_RED = '#cc3344';
const BERRY_BLUE = '#4466cc';
const MOSS = '#5a8a3a';

const GY = GROUND_Y;
const FOREST_END = 5400;

// ── Seeded pseudo-random for deterministic placement ────────────
function seeded(i: number, salt = 0): number {
  return ((Math.sin((i + salt) * 12.9898 + salt * 78.233) * 43758.5453) % 1 + 1) % 1;
}

// ── Ridge interpolation (matches GameCanvas mountain ridge) ─────
const RIDGE_PTS: [number, number][] = [
  [0,300],[150,220],[300,270],[450,200],[600,260],[750,210],[900,270],
  [1050,220],[1200,300],[1400,220],[1600,270],[1800,220],[2000,300],
  [2200,220],[2400,270],[2600,200],[2800,260],[3000,210],[3200,270],
  [3400,220],[3600,300],[3800,220],[4000,270],[4200,200],[4400,260],
  [4600,210],[4800,270],[5000,220],[5200,300],[5400,220],[5600,270],
  [5800,220],[6000,300],[6200,220],[6400,300],
];

function ridgeY(x: number): number {
  for (let j = 1; j < RIDGE_PTS.length; j++) {
    if (x <= RIDGE_PTS[j][0]) {
      const [x0, y0] = RIDGE_PTS[j - 1];
      const [x1, y1] = RIDGE_PTS[j];
      return y0 + (y1 - y0) * ((x - x0) / (x1 - x0));
    }
  }
  return 300;
}

// ════════════════════════════════════════════════════════════════
// 1. GRASS BLADE EDGE — fixed world-space segments, short blades
// ════════════════════════════════════════════════════════════════
const GRASS_SEG_W = 500;
const GRASS_SEGS = Math.ceil(FOREST_END / GRASS_SEG_W);
const GRASS_LAYERS: { color: string; opacity: number; heightMul: number; offset: number }[] = [
  { color: GRASS_DARK, opacity: 0.8, heightMul: 1.0, offset: 0 },
  { color: GRASS_MID, opacity: 0.6, heightMul: 0.7, offset: 2 },
  { color: GRASS_LIGHT, opacity: 0.4, heightMul: 0.5, offset: 1 },
];

function renderGrassEdge(): JSX.Element {
  return (
    <g>
      {Array.from({ length: GRASS_SEGS }, (_, seg) => {
        const segStart = seg * GRASS_SEG_W;
        const segEnd = Math.min(segStart + GRASS_SEG_W, FOREST_END);
        return GRASS_LAYERS.map((layer, li) => {
          let pts = `${segStart},${GY + 2} `;
          for (let x = segStart; x <= segEnd; x += 4) {
            const s = seeded(x + layer.offset, li);
            // Short blades: 2-8px tall
            const bladeH = (2 + s * 6) * layer.heightMul;
            const tipX = x + (s - 0.5) * 2;
            pts += `${tipX},${GY - bladeH} ${x + 2},${GY - bladeH * 0.3} `;
          }
          pts += `${segEnd},${GY + 2}`;
          return <polygon key={`ge${seg}_${li}`} points={pts} fill={layer.color} opacity={layer.opacity} />;
        });
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// 2. GROUND CROSS-SECTION — topsoil, subsoil, stones, roots
// ════════════════════════════════════════════════════════════════
function renderGroundLayers(worldEnd: number): JSX.Element {
  const forestEnd = Math.min(worldEnd, FOREST_END + 50);
  const totalStones = Math.ceil(forestEnd / 80);
  const totalRoots = Math.ceil(forestEnd / 200);

  return (
    <g>
      <rect x={0} y={GY} width={forestEnd} height={6} fill={TOPSOIL} opacity={0.5} />
      <rect x={0} y={GY + 6} width={forestEnd} height={8} fill={SUBSOIL} opacity={0.3} />
      <rect x={0} y={GY + 14} width={forestEnd} height={16} fill={CLAY} opacity={0.2} />

      {/* Embedded stones */}
      {Array.from({ length: totalStones }, (_, i) => {
        const sx = i * 80 + seeded(i, 50) * 40;
        if (sx > FOREST_END) return null;
        const sy = GY + 4 + seeded(i, 51) * 12;
        const sw = 4 + seeded(i, 52) * 6;
        const sh = 3 + seeded(i, 53) * 3;
        return (
          <g key={`st${i}`}>
            <ellipse cx={sx} cy={sy} rx={sw} ry={sh} fill={STONE_MID} opacity={0.35} />
            <ellipse cx={sx - 1} cy={sy - 0.5} rx={sw * 0.7} ry={sh * 0.6} fill={STONE_LIGHT} opacity={0.15} />
          </g>
        );
      })}

      {/* Worn dirt path */}
      <rect x={0} y={GY - 1} width={forestEnd} height={3} fill={DIRT_MID} opacity={0.12} rx={1} />

      {/* Root tendrils */}
      {Array.from({ length: totalRoots }, (_, i) => {
        const rx = i * 200 + seeded(i, 60) * 120;
        if (rx > FOREST_END) return null;
        const rLen = 8 + seeded(i, 61) * 12;
        return (
          <g key={`rt${i}`} opacity={0.3}>
            <path d={`M${rx},${GY + 1} Q${rx + rLen * 0.4},${GY - 2} ${rx + rLen},${GY + 3}`}
              stroke={BARK_DARK} strokeWidth={1.5} fill="none" />
            <path d={`M${rx + 3},${GY + 2} Q${rx + rLen * 0.6},${GY - 1} ${rx + rLen + 4},${GY + 4}`}
              stroke={BARK_MID} strokeWidth={1} fill="none" />
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// 3. GROUND DECORATIONS — 6 types, every ~80px
// ════════════════════════════════════════════════════════════════

function renderWildflower(x: number, i: number): JSX.Element {
  const col = FLOWER_COLORS[i % FLOWER_COLORS.length];
  const h = 6 + seeded(i, 10) * 8;
  const petalR = 1.5 + seeded(i, 11) * 1;
  const lean = (seeded(i, 12) - 0.5) * 3;
  return (
    <g>
      <line x1={x} y1={GY - 1} x2={x + lean} y2={GY - h} stroke={GRASS_DARK} strokeWidth={1} />
      <ellipse cx={x + 2} cy={GY - h * 0.4} rx={2.5} ry={1} fill={GRASS_MID} opacity={0.7}
        transform={`rotate(-20, ${x + 2}, ${GY - h * 0.4})`} />
      {[0, 72, 144, 216, 288].map((angle, pi) => {
        const rad = (angle + seeded(i, 13 + pi) * 15) * Math.PI / 180;
        const cx = x + lean + Math.cos(rad) * petalR * 1.2;
        const cy = GY - h + Math.sin(rad) * petalR * 1.2;
        return <circle key={pi} cx={cx} cy={cy} r={petalR} fill={col} opacity={0.75} />;
      })}
      <circle cx={x + lean} cy={GY - h} r={petalR * 0.5} fill="#ffdd44" opacity={0.9} />
    </g>
  );
}

function renderMushroomCluster(x: number, i: number): JSX.Element {
  const count = 2 + Math.floor(seeded(i, 20) * 2);
  return (
    <g>
      {Array.from({ length: count }, (_, mi) => {
        const mx = x + mi * 5 - 2 + seeded(i, 21 + mi) * 3;
        const mh = 4 + seeded(i, 22 + mi) * 5;
        const capW = 3 + seeded(i, 23 + mi) * 3;
        const capH = 2 + seeded(i, 24 + mi) * 1.5;
        const isRed = seeded(i, 25 + mi) > 0.5;
        return (
          <g key={mi}>
            <rect x={mx - 1} y={GY - mh} width={2} height={mh} fill={MUSHROOM_STEM} opacity={0.85} rx={0.5} />
            <ellipse cx={mx} cy={GY - mh} rx={capW} ry={capH} fill={isRed ? '#cc4433' : MUSHROOM_CAP} opacity={0.85} />
            <ellipse cx={mx - 0.5} cy={GY - mh - capH * 0.3} rx={capW * 0.5} ry={capH * 0.4} fill="#fff" opacity={0.15} />
            {isRed && <>
              <circle cx={mx - 1} cy={GY - mh - 0.5} r={0.6} fill="#fff" opacity={0.5} />
              <circle cx={mx + 1.5} cy={GY - mh + 0.3} r={0.4} fill="#fff" opacity={0.4} />
            </>}
          </g>
        );
      })}
    </g>
  );
}

function renderFern(x: number, i: number): JSX.Element {
  const fronds = 3 + Math.floor(seeded(i, 30) * 3);
  return (
    <g>
      {Array.from({ length: fronds }, (_, fi) => {
        const angle = -40 + fi * (80 / (fronds - 1));
        const len = 6 + seeded(i, 31 + fi) * 6;
        const rad = angle * Math.PI / 180;
        const endX = x + Math.sin(rad) * len;
        const endY = GY - Math.cos(rad) * len;
        return (
          <g key={fi}>
            <line x1={x} y1={GY - 1} x2={endX} y2={endY}
              stroke={FERN_GREEN} strokeWidth={1} opacity={0.75} />
            {[0.3, 0.5, 0.7, 0.9].map((t, li) => {
              const lx = x + (endX - x) * t;
              const ly = GY - 1 + (endY - GY + 1) * t;
              const side = li % 2 === 0 ? 1 : -1;
              const leafLen = 2 + seeded(i, 35 + fi * 4 + li) * 2;
              return (
                <ellipse key={li} cx={lx + side * leafLen * 0.5 * Math.cos(rad)}
                  cy={ly + side * leafLen * 0.5 * Math.sin(rad)}
                  rx={leafLen} ry={0.8}
                  fill={li < 2 ? FERN_GREEN : FERN_LIGHT} opacity={0.6}
                  transform={`rotate(${angle + side * 40}, ${lx}, ${ly})`} />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}

function renderMossRock(x: number, i: number): JSX.Element {
  const w = 8 + seeded(i, 40) * 8;
  const h = 4 + seeded(i, 41) * 4;
  return (
    <g>
      <ellipse cx={x + w * 0.5} cy={GY + 1} rx={w * 0.6} ry={1.5} fill="#000" opacity={0.12} />
      <ellipse cx={x + w * 0.5} cy={GY - h * 0.5} rx={w * 0.5} ry={h * 0.5}
        fill={STONE_MID} opacity={0.7} />
      <ellipse cx={x + w * 0.4} cy={GY - h * 0.65} rx={w * 0.3} ry={h * 0.25}
        fill={STONE_LIGHT} opacity={0.25} />
      <ellipse cx={x + w * 0.3} cy={GY - h * 0.7} rx={w * 0.25} ry={h * 0.2}
        fill={MOSS} opacity={0.5} />
      <ellipse cx={x + w * 0.65} cy={GY - h * 0.6} rx={w * 0.2} ry={h * 0.15}
        fill={GRASS_MID} opacity={0.4} />
    </g>
  );
}

function renderBerryBush(x: number, i: number): JSX.Element {
  const w = 10 + seeded(i, 50) * 5;
  const h = 6 + seeded(i, 51) * 4;
  const berryCol = seeded(i, 52) > 0.5 ? BERRY_RED : BERRY_BLUE;
  return (
    <g>
      <ellipse cx={x + w * 0.5} cy={GY - h * 0.3} rx={w * 0.5} ry={h * 0.5}
        fill={GRASS_DARK} opacity={0.65} />
      <ellipse cx={x + w * 0.4} cy={GY - h * 0.45} rx={w * 0.35} ry={h * 0.35}
        fill={GRASS_MID} opacity={0.5} />
      <ellipse cx={x + w * 0.6} cy={GY - h * 0.5} rx={w * 0.3} ry={h * 0.3}
        fill={GRASS_LIGHT} opacity={0.4} />
      {[0.2, 0.4, 0.55, 0.75, 0.85].map((t, bi) => {
        if (seeded(i, 55 + bi) < 0.3) return null;
        const bx = x + w * t;
        const by = GY - h * (0.3 + seeded(i, 56 + bi) * 0.4);
        return (
          <g key={bi}>
            <circle cx={bx} cy={by} r={1.2} fill={berryCol} opacity={0.8} />
            <circle cx={bx - 0.3} cy={by - 0.3} r={0.3} fill="#fff" opacity={0.3} />
          </g>
        );
      })}
    </g>
  );
}

function renderTreeStump(x: number, i: number): JSX.Element {
  const w = 7 + seeded(i, 60) * 4;
  const h = 4 + seeded(i, 61) * 3;
  return (
    <g>
      <ellipse cx={x + w * 0.5} cy={GY + 1} rx={w * 0.6} ry={1.5} fill="#000" opacity={0.1} />
      <rect x={x} y={GY - h} width={w} height={h} fill={BARK_MID} opacity={0.8} rx={1} />
      <line x1={x + 1} y1={GY - h} x2={x + 1} y2={GY} stroke={BARK_DARK} strokeWidth={0.5} opacity={0.4} />
      <line x1={x + w - 1} y1={GY - h} x2={x + w - 1} y2={GY} stroke={BARK_DARK} strokeWidth={0.5} opacity={0.4} />
      <ellipse cx={x + w * 0.5} cy={GY - h} rx={w * 0.5} ry={1.5} fill={BARK_LIGHT} opacity={0.7} />
      <ellipse cx={x + w * 0.5} cy={GY - h} rx={w * 0.35} ry={1} fill={DIRT_LIGHT} opacity={0.4} />
      <ellipse cx={x + w * 0.5} cy={GY - h} rx={w * 0.2} ry={0.6} fill={BARK_LIGHT} opacity={0.3} />
      {seeded(i, 63) > 0.4 && (
        <g>
          <line x1={x + w * 0.6} y1={GY - h} x2={x + w * 0.6 + 1} y2={GY - h - 4}
            stroke={GRASS_DARK} strokeWidth={0.8} />
          <ellipse cx={x + w * 0.6 + 2} cy={GY - h - 4} rx={2} ry={1}
            fill={GRASS_LIGHT} opacity={0.7} />
        </g>
      )}
    </g>
  );
}

const DECOR_RENDERERS = [renderWildflower, renderMushroomCluster, renderFern, renderMossRock, renderBerryBush, renderTreeStump];

function renderGroundDecorations(camX: number, worldEnd: number): JSX.Element {
  const decorCount = Math.ceil(Math.min(worldEnd, FOREST_END) / 80);
  return (
    <g>
      {Array.from({ length: decorCount }, (_, i) => {
        const dx = i * 80 + 30 + (i * 17) % 40;
        if (dx > FOREST_END) return null;
        if (dx < camX - 40 || dx > camX + VIEWPORT_W + 40) return null;
        const type = i % 6;
        return (
          <g key={`fd${i}`}>
            {DECOR_RENDERERS[type](dx, i)}
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// 4. MOUNTAIN TREES — multi-layer canopy, trunks, varied species
// ════════════════════════════════════════════════════════════════
function renderMountainTrees(): JSX.Element {
  return (
    <g>
      {Array.from({ length: 70 }, (_, i) => {
        const tx = i * 90 + 20;
        const baseY = ridgeY(tx % 2000) + 12;
        const h = 35 + (i * 13) % 25;
        const w = 12 + (i * 7) % 8;
        const isConifer = seeded(i, 70) < 0.4;

        if (isConifer) {
          return (
            <g key={`mt${i}`} opacity={0.75}>
              <rect x={tx - 1.5} y={baseY - h * 0.3} width={3} height={h * 0.3}
                fill={BARK_DARK} opacity={0.8} />
              <polygon points={`${tx},${baseY - h * 0.35} ${tx - w},${baseY} ${tx + w},${baseY}`}
                fill={CANOPY_DARK} />
              <polygon points={`${tx},${baseY - h * 0.7} ${tx - w * 0.75},${baseY - h * 0.25} ${tx + w * 0.75},${baseY - h * 0.25}`}
                fill={CANOPY_MID} />
              <polygon points={`${tx},${baseY - h} ${tx - w * 0.45},${baseY - h * 0.5} ${tx + w * 0.45},${baseY - h * 0.5}`}
                fill={CANOPY_LIGHT} />
            </g>
          );
        }

        const canopyR = w * 0.8;
        const canopyY = baseY - h * 0.55;
        return (
          <g key={`mt${i}`} opacity={0.75}>
            <rect x={tx - 2} y={canopyY + canopyR * 0.3} width={4} height={h * 0.5}
              fill={BARK_DARK} opacity={0.8} />
            <line x1={tx - 0.5} y1={canopyY + canopyR * 0.3} x2={tx - 0.5} y2={baseY}
              stroke={BARK_MID} strokeWidth={0.5} opacity={0.3} />
            <ellipse cx={tx - 2} cy={canopyY + 2} rx={canopyR * 0.9} ry={canopyR * 0.7}
              fill={CANOPY_DARK} />
            <ellipse cx={tx} cy={canopyY} rx={canopyR} ry={canopyR * 0.75}
              fill={CANOPY_MID} />
            <ellipse cx={tx + canopyR * 0.2} cy={canopyY - canopyR * 0.15}
              rx={canopyR * 0.6} ry={canopyR * 0.45}
              fill={CANOPY_LIGHT} opacity={0.6} />
            <ellipse cx={tx + canopyR * 0.1} cy={canopyY - canopyR * 0.3}
              rx={canopyR * 0.3} ry={canopyR * 0.2}
              fill={CANOPY_HIGHLIGHT} opacity={0.3} />
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// 5. FOREGROUND — sparse, short grass tufts in front of units
// ════════════════════════════════════════════════════════════════
function renderForeground(camX: number): JSX.Element {
  const SPACING = 120;
  const totalClumps = Math.ceil(FOREST_END / SPACING);
  const cullLeft = camX - 40;
  const cullRight = camX + VIEWPORT_W + 40;

  return (
    <g>
      {Array.from({ length: totalClumps }, (_, i) => {
        const baseX = i * SPACING + seeded(i, 80) * 50;
        if (baseX > FOREST_END || baseX < cullLeft || baseX > cullRight) return null;
        const bladeCount = 3 + Math.floor(seeded(i, 81) * 3);

        return (
          <g key={`fg${i}`} opacity={0.35}>
            {Array.from({ length: bladeCount }, (_, bi) => {
              const bx = baseX + bi * 4 - bladeCount * 2;
              // Short blades so they don't obscure units
              const bh = 6 + seeded(i * 10 + bi, 82) * 8;
              const lean = (seeded(i * 10 + bi, 83) - 0.5) * 5;
              const col = bi % 2 === 0 ? GRASS_DARK : GRASS_MID;
              return (
                <polygon key={bi}
                  points={`${bx - 1},${GY + 2} ${bx + lean},${GY - bh} ${bx + 1},${GY + 2}`}
                  fill={col} />
              );
            })}
            {seeded(i, 85) > 0.7 && (
              <g>
                <circle cx={baseX + 2} cy={GY - 10 - seeded(i, 86) * 4} r={1.5}
                  fill={FLOWER_COLORS[i % FLOWER_COLORS.length]} opacity={0.6} />
                <line x1={baseX + 2} y1={GY - 8 - seeded(i, 86) * 4}
                  x2={baseX + 2} y2={GY + 1}
                  stroke={GRASS_DARK} strokeWidth={0.7} opacity={0.4} />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

// ════════════════════════════════════════════════════════════════
// EXPORTS
// ════════════════════════════════════════════════════════════════
export function ForestGroundSurface({ camX: _camX, worldEnd: _worldEnd }: { camX: number; worldEnd: number }): JSX.Element {
  return (
    <g>
      {renderGrassEdge()}
    </g>
  );
}

export function ForestGroundDecorations({ camX, worldEnd }: { camX: number; worldEnd: number }): JSX.Element {
  return renderGroundDecorations(camX, worldEnd);
}

export function ForestMountainTrees(): JSX.Element {
  return renderMountainTrees();
}

export function ForestForeground({ camX }: { camX: number }): JSX.Element {
  return renderForeground(camX);
}
