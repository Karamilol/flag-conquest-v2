import { GROUND_Y } from '../../constants';

const GY = GROUND_Y;

// Warm stone palette
const STONE = '#7a6a5a';
const STONE_DARK = '#5a4a3a';
const STONE_LIGHT = '#9a8a7a';
const STONE_ACCENT = '#8a7a6a';
const MORTAR = '#4a4030';
const MOSS = '#4a7a3a';
const MOSS_LIGHT = '#5a8a4a';
const WOOD = '#6a4a2a';
const WOOD_DARK = '#4a3018';
const WOOD_LIGHT = '#8a6a3a';
const ROPE = '#8a7a5a';
const FIRE_CORE = '#ffcc44';
const FIRE_MID = '#ff8833';
const FIRE_EDGE = '#ff5511';
const EMBER = '#ffaa33';
const RUNE = '#66bbff';
const BANNER_COL = '#3a5a9a';
const BANNER_TRIM = '#cc9933';
const METAL = '#8a8a9a';
const METAL_DARK = '#5a5a6a';
const LANTERN = '#ffdd66';
const HIDE = '#6a5a48';

export default function HomeSanctuary({ frame }: { frame: number }): JSX.Element {
  const flicker = 0.7 + Math.sin(frame * 0.12) * 0.15 + Math.sin(frame * 0.19 + 1) * 0.1;
  const flicker2 = 0.6 + Math.sin(frame * 0.15 + 2) * 0.2;
  const pulse = 0.5 + Math.sin(frame * 0.04) * 0.3;
  const bannerSway = Math.sin(frame * 0.03) * 2;
  const lanternSwing = Math.sin(frame * 0.035) * 1.5;
  const lanternGlow = 0.5 + Math.sin(frame * 0.08) * 0.15;

  return (
    <g>
      {/* ══ GROUND EFFECTS ══ */}
      <ellipse cx={50} cy={GY + 2} rx={55} ry={5} fill="#000" opacity={0.15} />
      {/* Campfire glow radius */}
      <ellipse cx={62} cy={GY} rx={35} ry={10} fill={FIRE_MID} opacity={flicker * 0.05} />
      {/* Worn ground/dirt patch around camp */}
      <ellipse cx={50} cy={GY - 1} rx={48} ry={4} fill="#5a4a3a" opacity={0.12} />

      {/* ══ STONE FOUNDATION ══ */}
      {/* Raised stone platform */}
      <polygon points={`-5,${GY} 0,${GY - 6} 105,${GY - 6} 110,${GY} 110,${GY + 3} -5,${GY + 3}`}
        fill={STONE_DARK} opacity={0.7} />
      <rect x={0} y={GY - 5} width={105} height={3} fill={STONE} opacity={0.45} rx={0.5} />
      {/* Step at front edge */}
      <rect x={35} y={GY - 3} width={25} height={3} fill={STONE_ACCENT} opacity={0.4} rx={0.5} />
      {/* Cracks in foundation */}
      <line x1={20} y1={GY - 5} x2={30} y2={GY - 1} stroke="#3a3028" strokeWidth={0.7} opacity={0.3} />
      <line x1={70} y1={GY - 6} x2={78} y2={GY - 2} stroke="#3a3028" strokeWidth={0.5} opacity={0.25} />
      <line x1={50} y1={GY - 4} x2={55} y2={GY} stroke="#3a3028" strokeWidth={0.4} opacity={0.2} />

      {/* ══ BACK WALL (ruined, tall) ══ */}
      {/* Main wall section */}
      <polygon points={`0,${GY - 6} 0,${GY - 65} 6,${GY - 70} 14,${GY - 68} 20,${GY - 72} 28,${GY - 66} 35,${GY - 70} 42,${GY - 64} 45,${GY - 6}`}
        fill={STONE_DARK} opacity={0.6} />
      {/* Wall lighter face */}
      <polygon points={`3,${GY - 6} 3,${GY - 62} 10,${GY - 67} 18,${GY - 64} 22,${GY - 68} 30,${GY - 6}`}
        fill={STONE} opacity={0.25} />
      {/* Mortar block lines */}
      {[-55, -45, -35, -25, -16].map((dy, i) => (
        <line key={`mh${i}`} x1={2} y1={GY + dy} x2={43} y2={GY + dy}
          stroke={MORTAR} strokeWidth={0.5} opacity={0.3} />
      ))}
      {[10, 22, 33].map((dx, i) => (
        <g key={`mv${i}`}>
          <line x1={dx} y1={GY - 55} x2={dx} y2={GY - 45} stroke={MORTAR} strokeWidth={0.4} opacity={0.25} />
          <line x1={dx + 6} y1={GY - 35} x2={dx + 6} y2={GY - 25} stroke={MORTAR} strokeWidth={0.4} opacity={0.25} />
        </g>
      ))}
      {/* Rune carved into wall */}
      <circle cx={22} cy={GY - 40} r={3} fill={RUNE} opacity={pulse * 0.4} />
      <circle cx={22} cy={GY - 40} r={7} fill={RUNE} opacity={pulse * 0.05} />
      {/* Second rune (dimmer) */}
      <circle cx={38} cy={GY - 30} r={2} fill={RUNE} opacity={pulse * 0.25} />
      <circle cx={38} cy={GY - 30} r={5} fill={RUNE} opacity={pulse * 0.03} />
      {/* Moss patches on wall */}
      <ellipse cx={6} cy={GY - 12} rx={4} ry={2} fill={MOSS} opacity={0.45} />
      <ellipse cx={35} cy={GY - 10} rx={3} ry={1.5} fill={MOSS} opacity={0.35} />
      <ellipse cx={15} cy={GY - 55} rx={3} ry={1} fill={MOSS_LIGHT} opacity={0.3} />
      {/* Vine growing up wall */}
      <path d={`M8,${GY - 8} Q6,${GY - 20} 10,${GY - 35} Q12,${GY - 45} 8,${GY - 55}`}
        stroke="#3a5a2a" strokeWidth={1} fill="none" opacity={0.4} />
      <ellipse cx={9} cy={GY - 28} rx={2} ry={1} fill={MOSS} opacity={0.3} />
      <ellipse cx={10} cy={GY - 42} rx={1.5} ry={0.8} fill={MOSS} opacity={0.25} />

      {/* ══ LEFT PILLAR (tall, intact) ══ */}
      <rect x={-2} y={GY - 75} width={8} height={75} fill={STONE} opacity={0.8} />
      <rect x={-1} y={GY - 75} width={5} height={75} fill={STONE_LIGHT} opacity={0.1} />
      {/* Pillar capital (ornate top) */}
      <rect x={-5} y={GY - 79} width={14} height={5} fill={STONE_LIGHT} opacity={0.65} rx={1} />
      <rect x={-4} y={GY - 82} width={12} height={4} fill={STONE} opacity={0.6} rx={1} />
      {/* Crack down pillar */}
      <line x1={2} y1={GY - 60} x2={3} y2={GY - 40} stroke="#3a3028" strokeWidth={0.7} opacity={0.35} />
      {/* Rune on pillar */}
      <line x1={2} y1={GY - 50} x2={2} y2={GY - 44} stroke={RUNE} strokeWidth={0.8} opacity={pulse * 0.5} />
      <line x1={0} y1={GY - 47} x2={4} y2={GY - 47} stroke={RUNE} strokeWidth={0.6} opacity={pulse * 0.4} />

      {/* ══ RIGHT BROKEN PILLAR ══ */}
      <rect x={98} y={GY - 40} width={8} height={40} fill={STONE} opacity={0.7} />
      <rect x={99} y={GY - 40} width={5} height={40} fill={STONE_LIGHT} opacity={0.08} />
      {/* Jagged broken top */}
      <polygon points={`98,${GY - 40} 99,${GY - 44} 101,${GY - 41} 103,${GY - 46} 105,${GY - 42} 106,${GY - 40}`}
        fill={STONE} opacity={0.7} />
      {/* Moss on broken pillar */}
      <ellipse cx={102} cy={GY - 20} rx={2} ry={1} fill={MOSS} opacity={0.35} />
      {/* Fallen chunks from pillar */}
      <rect x={108} y={GY - 4} width={6} height={5} fill={STONE_DARK} opacity={0.4} rx={1}
        transform={`rotate(15, 111, ${GY - 1})`} />
      <rect x={112} y={GY - 2} width={4} height={3} fill={STONE} opacity={0.3} rx={0.5}
        transform={`rotate(-10, 114, ${GY})`} />
      <circle cx={118} cy={GY - 1} r={1.5} fill={STONE_DARK} opacity={0.25} />

      {/* ══ LEAN-TO ROOF (larger) ══ */}
      {/* Main beam — pillar to right support */}
      <line x1={2} y1={GY - 72} x2={95} y2={GY - 45}
        stroke={WOOD} strokeWidth={3} strokeLinecap="round" opacity={0.8} />
      {/* Right support post */}
      <line x1={95} y1={GY - 45} x2={95} y2={GY - 5}
        stroke={WOOD_DARK} strokeWidth={2.5} opacity={0.65} />
      {/* Cross brace */}
      <line x1={85} y1={GY - 5} x2={95} y2={GY - 30}
        stroke={WOOD_DARK} strokeWidth={1.5} opacity={0.4} />
      {/* Hide/canvas covering — larger */}
      <polygon points={`2,${GY - 69} 92,${GY - 43} 92,${GY - 35} 2,${GY - 60}`}
        fill={HIDE} opacity={0.45} />
      {/* Canvas shade variation */}
      <polygon points={`2,${GY - 66} 88,${GY - 42} 88,${GY - 38} 2,${GY - 62}`}
        fill="#7a6a58" opacity={0.2} />
      {/* Patch on canvas */}
      <rect x={40} y={GY - 56} width={10} height={7} fill="#5a4838" opacity={0.3} rx={1}
        transform="rotate(-18, 45, 268)" />
      {/* Rope lashings */}
      <line x1={18} y1={GY - 69} x2={20} y2={GY - 66} stroke={ROPE} strokeWidth={0.8} opacity={0.5} />
      <line x1={45} y1={GY - 59} x2={47} y2={GY - 56} stroke={ROPE} strokeWidth={0.8} opacity={0.5} />
      <line x1={72} y1={GY - 50} x2={74} y2={GY - 47} stroke={ROPE} strokeWidth={0.8} opacity={0.5} />

      {/* ══ BANNER (larger, hanging from pillar) ══ */}
      <line x1={2} y1={GY - 80} x2={2} y2={GY - 82} stroke={WOOD_DARK} strokeWidth={1.5} opacity={0.6} />
      {/* Banner pole */}
      <line x1={-3} y1={GY - 80} x2={7} y2={GY - 80} stroke={WOOD} strokeWidth={1.2} opacity={0.6} />
      {/* Banner fabric */}
      <polygon points={`-2,${GY - 80} 6,${GY - 80} ${5 + bannerSway},${GY - 58} ${-1 + bannerSway},${GY - 58}`}
        fill={BANNER_COL} opacity={0.8} />
      {/* Banner bottom trim (pointed) */}
      <polygon points={`${-1 + bannerSway},${GY - 58} ${2 + bannerSway},${GY - 53} ${5 + bannerSway},${GY - 58}`}
        fill={BANNER_COL} opacity={0.75} />
      {/* Gold border */}
      <line x1={-2} y1={GY - 80} x2={6} y2={GY - 80} stroke={BANNER_TRIM} strokeWidth={1.2} opacity={0.7} />
      <line x1={-2} y1={GY - 80} x2={-1 + bannerSway} y2={GY - 58} stroke={BANNER_TRIM} strokeWidth={0.6} opacity={0.4} />
      <line x1={6} y1={GY - 80} x2={5 + bannerSway} y2={GY - 58} stroke={BANNER_TRIM} strokeWidth={0.6} opacity={0.4} />
      {/* Banner emblem — diamond with inner cross */}
      <polygon points={`${2 + bannerSway * 0.5},${GY - 74} ${-0.5 + bannerSway * 0.3},${GY - 69} ${2 + bannerSway * 0.5},${GY - 64} ${4.5 + bannerSway * 0.7},${GY - 69}`}
        fill={BANNER_TRIM} opacity={0.7} />
      <line x1={2 + bannerSway * 0.5} y1={GY - 73} x2={2 + bannerSway * 0.5} y2={GY - 65}
        stroke={BANNER_COL} strokeWidth={0.6} opacity={0.5} />
      <line x1={0 + bannerSway * 0.35} y1={GY - 69} x2={4 + bannerSway * 0.65} y2={GY - 69}
        stroke={BANNER_COL} strokeWidth={0.6} opacity={0.5} />

      {/* ══ CAMPFIRE (bigger, center) ══ */}
      <g>
        {/* Fire pit — ring of stones */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
          const rad = angle * Math.PI / 180;
          const cx = 60 + Math.cos(rad) * 7;
          const cy = GY - 3 + Math.sin(rad) * 2.5;
          return <ellipse key={`fs${i}`} cx={cx} cy={cy} rx={2} ry={1.2} fill={STONE} opacity={0.5} />;
        })}
        {/* Ash bed */}
        <ellipse cx={60} cy={GY - 2} rx={5} ry={2} fill="#3a3030" opacity={0.4} />
        {/* Logs */}
        <line x1={56} y1={GY - 2} x2={64} y2={GY - 5} stroke={WOOD_DARK} strokeWidth={2.5} strokeLinecap="round" opacity={0.7} />
        <line x1={57} y1={GY - 5} x2={63} y2={GY - 1} stroke={WOOD_DARK} strokeWidth={2} strokeLinecap="round" opacity={0.6} />
        <line x1={58} y1={GY - 1} x2={62} y2={GY - 4} stroke="#3a2010" strokeWidth={1.5} strokeLinecap="round" opacity={0.5} />
        {/* Fire layers */}
        <ellipse cx={60} cy={GY - 7} rx={4.5} ry={7} fill={FIRE_EDGE} opacity={flicker * 0.45} />
        <ellipse cx={60} cy={GY - 8} rx={3} ry={5.5} fill={FIRE_MID} opacity={flicker * 0.65} />
        <ellipse cx={60} cy={GY - 9} rx={1.8} ry={4} fill={FIRE_CORE} opacity={flicker * 0.8} />
        <ellipse cx={60} cy={GY - 10} rx={0.8} ry={2} fill="#fff" opacity={flicker * 0.2} />
        {/* Sparks rising */}
        {[0, 1, 2, 3].map(si => {
          const sx = 59 + Math.sin(frame * 0.1 + si * 2) * 3;
          const sy = GY - 15 - ((frame * 0.15 + si * 5) % 12);
          const op = Math.max(0, 0.5 - ((frame * 0.15 + si * 5) % 12) * 0.04);
          return <circle key={`sp${si}`} cx={sx} cy={sy} r={0.5} fill={EMBER} opacity={op * flicker2} />;
        })}
        {/* Warm glow */}
        <circle cx={60} cy={GY - 6} r={18} fill={FIRE_CORE} opacity={flicker * 0.04} />
        <circle cx={60} cy={GY - 6} r={30} fill={FIRE_MID} opacity={flicker * 0.015} />
      </g>

      {/* ══ COOKING SPIT over fire ══ */}
      {/* Two forked sticks */}
      <line x1={53} y1={GY - 2} x2={53} y2={GY - 18} stroke={WOOD_DARK} strokeWidth={1.2} opacity={0.6} />
      <line x1={52} y1={GY - 17} x2={54} y2={GY - 19} stroke={WOOD_DARK} strokeWidth={0.8} opacity={0.5} />
      <line x1={67} y1={GY - 2} x2={67} y2={GY - 16} stroke={WOOD_DARK} strokeWidth={1.2} opacity={0.6} />
      <line x1={66} y1={GY - 15} x2={68} y2={GY - 17} stroke={WOOD_DARK} strokeWidth={0.8} opacity={0.5} />
      {/* Cross bar */}
      <line x1={53} y1={GY - 17} x2={67} y2={GY - 15} stroke={WOOD} strokeWidth={1} opacity={0.6} />
      {/* Pot hanging from spit */}
      <ellipse cx={60} cy={GY - 14} rx={3.5} ry={1} fill={METAL_DARK} opacity={0.5} />
      <path d={`M56.5,${GY - 14} Q56,${GY - 10} 60,${GY - 9} Q64,${GY - 10} 63.5,${GY - 14}`}
        fill={METAL_DARK} opacity={0.55} />
      {/* Steam from pot */}
      <path d={`M59,${GY - 15} Q58,${GY - 18} 60,${GY - 20}`}
        stroke="#aaa" strokeWidth={0.5} fill="none" opacity={0.1 + flicker * 0.05} />

      {/* ══ WEAPON RACK (right side, bigger) ══ */}
      {/* Frame */}
      <line x1={80} y1={GY - 5} x2={80} y2={GY - 30} stroke={WOOD} strokeWidth={2} opacity={0.7} />
      <line x1={90} y1={GY - 5} x2={90} y2={GY - 30} stroke={WOOD} strokeWidth={2} opacity={0.7} />
      <line x1={79} y1={GY - 26} x2={91} y2={GY - 26} stroke={WOOD} strokeWidth={1.2} opacity={0.6} />
      <line x1={79} y1={GY - 15} x2={91} y2={GY - 15} stroke={WOOD} strokeWidth={1.2} opacity={0.6} />
      {/* Sword */}
      <line x1={83} y1={GY - 28} x2={83.5} y2={GY - 10} stroke={METAL} strokeWidth={1.5} opacity={0.55} />
      <line x1={81} y1={GY - 28} x2={86} y2={GY - 28} stroke={METAL} strokeWidth={1.2} opacity={0.45} />
      <circle cx={83.5} cy={GY - 28} r={0.8} fill={BANNER_TRIM} opacity={0.4} />
      {/* Axe */}
      <line x1={87} y1={GY - 27} x2={87.5} y2={GY - 10} stroke={WOOD_LIGHT} strokeWidth={1.2} opacity={0.5} />
      <polygon points={`85,${GY - 26} 87,${GY - 28} 89,${GY - 26} 88,${GY - 23}`}
        fill={METAL} opacity={0.45} />
      {/* Shield leaning against rack */}
      <ellipse cx={92} cy={GY - 14} rx={4} ry={7} fill="#4a5a7a" opacity={0.45} />
      <ellipse cx={92} cy={GY - 14} rx={2} ry={4} fill="#5a6a8a" opacity={0.3} />
      <line x1={92} y1={GY - 20} x2={92} y2={GY - 8} stroke="#3a4a6a" strokeWidth={0.6} opacity={0.3} />
      <line x1={88.5} y1={GY - 14} x2={95.5} y2={GY - 14} stroke="#3a4a6a" strokeWidth={0.6} opacity={0.3} />

      {/* ══ HANGING LANTERN (from beam) ══ */}
      <g transform={`translate(${35 + lanternSwing}, 0)`}>
        {/* Chain */}
        <line x1={0} y1={GY - 56} x2={0} y2={GY - 48} stroke={METAL_DARK} strokeWidth={0.5} opacity={0.5} />
        {/* Lantern frame */}
        <rect x={-2} y={GY - 48} width={4} height={6} fill={METAL_DARK} opacity={0.5} rx={0.5} />
        {/* Lantern glow */}
        <rect x={-1.5} y={GY - 47} width={3} height={4} fill={LANTERN} opacity={lanternGlow * 0.6} rx={0.5} />
        <circle cx={0} cy={GY - 45} r={6} fill={LANTERN} opacity={lanternGlow * 0.04} />
      </g>

      {/* ══ SUPPLIES & CAMP LIFE ══ */}
      {/* Bedroll */}
      <ellipse cx={22} cy={GY - 5} rx={8} ry={2.5} fill="#5a4a3a" opacity={0.5} />
      <ellipse cx={22} cy={GY - 5} rx={6} ry={2} fill="#6a5a4a" opacity={0.35} />
      <ellipse cx={15} cy={GY - 5} rx={2.5} ry={2.5} fill="#5a4a3a" opacity={0.45} />
      {/* Crate */}
      <rect x={38} y={GY - 12} width={8} height={8} fill={WOOD_DARK} opacity={0.55} rx={0.5} />
      <rect x={39} y={GY - 11} width={6} height={6} fill={WOOD} opacity={0.3} rx={0.3} />
      <line x1={42} y1={GY - 12} x2={42} y2={GY - 4} stroke={WOOD_DARK} strokeWidth={0.5} opacity={0.3} />
      <line x1={38} y1={GY - 8} x2={46} y2={GY - 8} stroke={WOOD_DARK} strokeWidth={0.5} opacity={0.3} />
      {/* Barrel */}
      <ellipse cx={48} cy={GY - 8} rx={4} ry={3} fill={WOOD_DARK} opacity={0.5} />
      <rect x={44} y={GY - 14} width={8} height={9} fill={WOOD} opacity={0.5} rx={1} />
      <ellipse cx={48} cy={GY - 14} rx={4} ry={2} fill={WOOD_LIGHT} opacity={0.35} />
      <line x1={44} y1={GY - 11} x2={52} y2={GY - 11} stroke={METAL_DARK} strokeWidth={0.6} opacity={0.3} />
      <line x1={44} y1={GY - 8} x2={52} y2={GY - 8} stroke={METAL_DARK} strokeWidth={0.6} opacity={0.3} />
      {/* Supply sack */}
      <ellipse cx={34} cy={GY - 5} rx={3.5} ry={3} fill="#7a6a4a" opacity={0.45} />
      <line x1={34} y1={GY - 7} x2={34} y2={GY - 9} stroke={ROPE} strokeWidth={0.7} opacity={0.4} />

      {/* ══ SCATTERED RUBBLE ══ */}
      <circle cx={-8} cy={GY - 1} r={2} fill={STONE_DARK} opacity={0.3} />
      <rect x={-12} y={GY - 2} width={4} height={3} fill={STONE} opacity={0.25} rx={0.5}
        transform={`rotate(20, -10, ${GY})`} />
      <circle cx={115} cy={GY - 1} r={1.5} fill={STONE_DARK} opacity={0.25} />
      <circle cx={120} cy={GY} r={1} fill={STONE} opacity={0.2} />
      {/* Small rubble near wall */}
      <circle cx={46} cy={GY - 5} r={1} fill={STONE_DARK} opacity={0.2} />
      <rect x={6} y={GY - 5} width={3} height={2} fill={STONE} opacity={0.2} rx={0.3} />

      {/* ══ FLOOR RUNE (ancient, faded) ══ */}
      <ellipse cx={50} cy={GY - 4} rx={18} ry={4} fill="none"
        stroke={RUNE} strokeWidth={0.6} opacity={pulse * 0.15}
        strokeDasharray="3 5" strokeDashoffset={frame * 0.12} />
      <ellipse cx={50} cy={GY - 4} rx={10} ry={2.5} fill={RUNE} opacity={pulse * 0.03} />
    </g>
  );
}
