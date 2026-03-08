import { memo } from 'react';
import { COLORS } from '../../constants';
import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';
import './sprite-animations.css';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  isCasting: boolean;
  castTimer: number;
  castTargetX: number;
  castTargetY: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

// --- Color palette (12 coordinated constants) ---
const VOLCANIC_BLACK = '#0a0608';
const DEEP_CRIMSON = '#3a0a0a';
const DARK_CRIMSON = '#5a1010';
const CRIMSON_MID = '#7a1818';
const EMBER_ORANGE = '#ff6600';
const FIRE_GOLD = '#ffaa00';
const FIRE_WHITE = '#fff4cc';
const LAVA_RED = '#ff2200';
const LAVA_GLOW = '#ff4400';
const ASH_GRAY = '#2a2028';
const HOOD_VOID = '#050208';
const STAFF_WOOD = '#3a2818';
const STAFF_DARK = '#2a1a10';
const RUNE_GOLD = '#ffcc44';

function DetailedFlameCaller({ x, y, health, maxHealth, frame, isCasting, castTimer, castTargetX, castTargetY, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  // Throttle JS animations to every 3 frames
  const tf = Math.floor(frame / 3) * 3;

  const castProgress = isCasting ? castTimer / 270 : 0;

  // Eye glow — brighter when casting
  const eyeBase = isCasting ? 0.85 : 0.5;
  const eyePulse = eyeBase + Math.sin(tf * 0.15) * 0.15;

  // Lava crack pulse
  const lavaPulse = 0.3 + Math.sin(tf * 0.08) * 0.15 + (isCasting ? 0.3 : 0);
  const lavaPulse2 = 0.3 + Math.sin(tf * 0.08 + 1.5) * 0.15 + (isCasting ? 0.3 : 0);
  const lavaPulse3 = 0.3 + Math.sin(tf * 0.08 + 3.0) * 0.15 + (isCasting ? 0.3 : 0);

  // Staff sway
  const staffSway = Math.sin(tf * 0.04) * 1.5;

  // Casting arm raise — arms go from resting (0) to raised (1)
  const armRaise = isCasting ? Math.min(1, castTimer / 40) : 0;

  // Ember orbit positions
  const e1x = 12 + Math.sin(tf * 0.07) * 14;
  const e1y = 18 + Math.cos(tf * 0.07) * 10;
  const e2x = 12 + Math.sin(tf * 0.07 + 2.1) * 12;
  const e2y = 16 + Math.cos(tf * 0.07 + 2.1) * 8;
  const e3x = 12 + Math.sin(tf * 0.07 + 4.2) * 16;
  const e3y = 20 + Math.cos(tf * 0.07 + 4.2) * 6;
  const e4x = 12 + Math.sin(tf * 0.07 + 5.5) * 10;
  const e4y = 14 + Math.cos(tf * 0.07 + 5.5) * 12;

  // Rising heat shimmer particles (when casting)
  const heatY1 = isCasting ? 28 - ((tf * 0.3) % 35) : 28;
  const heatY2 = isCasting ? 26 - ((tf * 0.3 + 8) % 35) : 26;
  const heatY3 = isCasting ? 30 - ((tf * 0.3 + 16) % 35) : 30;
  const heatY4 = isCasting ? 24 - ((tf * 0.3 + 22) % 35) : 24;
  const heatY5 = isCasting ? 27 - ((tf * 0.3 + 30) % 35) : 27;

  // Meteor logic
  const meteorActive = isCasting && castTimer > 30;
  const meteorRelX = castTargetX - x;
  const meteorLandY = 30;
  const meteorStartY = meteorLandY - 250;
  const meteorProgress = meteorActive ? Math.min(1, (castTimer - 30) / 240) : 0;
  const meteorCurrentY = meteorStartY + (meteorLandY - meteorStartY) * meteorProgress;

  // Rune circle rotation
  const runeRotation = tf * 1.2;

  // Staff crown eruption scale when casting
  const crownScale = isCasting ? 1.4 + Math.sin(tf * 0.2) * 0.3 : 1;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  const state = health <= 0 ? 'die' : 'idle';
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      <g className="sprite-wraith-float">
      <g className={`sprite-${state}`} style={delayStyle}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={12} cy={18} r={22} fill={eliteGlow} opacity={0.15} />
      )}
      {eliteVariantId && (
        <text x={12} y={-22} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === GROUND SHADOW (fiery orange tint) === */}
      <ellipse cx={12} cy={42} rx={14} ry={4} fill="rgba(0,0,0,0.3)" />
      <ellipse cx={12} cy={42} rx={12} ry={3} fill={EMBER_ORANGE} opacity={0.08 + (isCasting ? 0.06 : 0)} />

      {/* === RUNE CIRCLE AT FEET (casting) === */}
      {isCasting && (
        <g transform={`translate(12, 42) rotate(${runeRotation})`}>
          <circle cx={0} cy={0} r={16} fill="none" stroke={LAVA_GLOW} strokeWidth={0.8} strokeDasharray="4,3" opacity={0.5 + Math.sin(tf * 0.15) * 0.2} />
          <circle cx={0} cy={0} r={13} fill="none" stroke={EMBER_ORANGE} strokeWidth={0.5} strokeDasharray="2,5" opacity={0.35} />
          {/* Rune marks */}
          <text x={0} y={-11} fontSize="5" textAnchor="middle" fill={RUNE_GOLD} opacity={0.6}>&#x16A0;</text>
          <text x={11} y={2} fontSize="5" textAnchor="middle" fill={RUNE_GOLD} opacity={0.6}>&#x16B7;</text>
          <text x={0} y={14} fontSize="5" textAnchor="middle" fill={RUNE_GOLD} opacity={0.6}>&#x16C1;</text>
          <text x={-11} y={2} fontSize="5" textAnchor="middle" fill={RUNE_GOLD} opacity={0.6}>&#x16DE;</text>
          {/* Inner glow */}
          <circle cx={0} cy={0} r={10} fill={LAVA_RED} opacity={0.04 + castProgress * 0.06} />
        </g>
      )}

      {/* === STAFF (left side, behind body) === */}
      <g transform={`translate(4, 0) rotate(${staffSway}, 4, 40)`}>
        {/* Staff pole */}
        <rect x={2} y={-4} width={2.5} height={48} fill={STAFF_WOOD} rx={1} />
        <rect x={2.5} y={-4} width={1} height={48} fill={STAFF_DARK} opacity={0.4} />
        {/* Wrapping bands */}
        <rect x={1.5} y={16} width={3.5} height={1.2} fill={ASH_GRAY} rx={0.5} />
        <rect x={1.5} y={24} width={3.5} height={1.2} fill={ASH_GRAY} rx={0.5} />
        <rect x={1.5} y={32} width={3.5} height={1.2} fill={ASH_GRAY} rx={0.5} />

        {/* === EMBER CROWN at staff top === */}
        <g transform={`translate(3.25, -6) scale(${crownScale})`}>
          {/* Outer glow */}
          <circle cx={0} cy={0} r={5} fill={LAVA_RED} opacity={0.15 + (isCasting ? 0.15 : 0)} />
          {/* Middle flame */}
          <circle cx={0} cy={0} r={3.2} fill={EMBER_ORANGE} opacity={0.5 + (isCasting ? 0.2 : 0)} />
          {/* Inner core */}
          <circle cx={0} cy={0} r={1.5} fill={FIRE_GOLD} opacity={0.7} />
          <circle cx={0} cy={0} r={0.7} fill={FIRE_WHITE} opacity={0.8} />
          {/* Flame licks */}
          <ellipse cx={-1.5} cy={-2} rx={0.8} ry={2 + Math.sin(tf * 0.3) * 0.6} fill={EMBER_ORANGE} opacity={0.6} />
          <ellipse cx={1.5} cy={-1.8} rx={0.7} ry={1.8 + Math.sin(tf * 0.3 + 1) * 0.5} fill={LAVA_GLOW} opacity={0.5} />
          <ellipse cx={0} cy={-3} rx={0.6} ry={2.2 + Math.sin(tf * 0.3 + 2) * 0.7} fill={FIRE_GOLD} opacity={0.5} />
          {/* Casting eruption — pillar of fire particles */}
          {isCasting && (
            <>
              <ellipse cx={0} cy={-5} rx={1.2} ry={3 + Math.sin(tf * 0.4) * 1} fill={EMBER_ORANGE} opacity={0.5} />
              <ellipse cx={0.5} cy={-8} rx={0.8} ry={2} fill={FIRE_GOLD} opacity={0.4} />
              <ellipse cx={-0.5} cy={-10} rx={0.6} ry={1.5} fill={LAVA_GLOW} opacity={0.3} />
              <circle cx={1} cy={-7} r={0.5} fill={FIRE_WHITE} opacity={0.6} />
              <circle cx={-0.8} cy={-9} r={0.4} fill={FIRE_WHITE} opacity={0.5} />
              {/* Sparks */}
              <circle cx={2 + Math.sin(tf * 0.5) * 1.5} cy={-6 - Math.abs(Math.sin(tf * 0.4)) * 3} r={0.4} fill={FIRE_WHITE} opacity={0.7} />
              <circle cx={-1.5 + Math.cos(tf * 0.5) * 1} cy={-8 - Math.abs(Math.cos(tf * 0.45)) * 2} r={0.3} fill={FIRE_GOLD} opacity={0.6} />
            </>
          )}
        </g>
      </g>

      {/* === ROBE (3 layers, centered at x=12) === */}
      <g className="sprite-wraith-body">
        {/* Outer robe — volcanic black */}
        <path d="M1,40 Q-1,24 5,12 L9,9 L15,9 L19,12 Q25,24 23,40 Q18,44 12,43 Q6,44 1,40"
          fill={VOLCANIC_BLACK} stroke={DEEP_CRIMSON} strokeWidth={0.5} />
        {/* Mid robe — dark crimson */}
        <path d="M4,39 Q3,25 8,14 L12,11 L16,14 Q21,25 20,39 Q16,42 12,41 Q8,42 4,39"
          fill={DEEP_CRIMSON} opacity={0.7} />
        {/* Inner robe shadow */}
        <path d="M7,38 Q6,26 10,16 L12,14 L14,16 Q18,26 17,38"
          fill={HOOD_VOID} opacity={0.5} />

        {/* Robe fold lines */}
        <path d="M7,14 Q6,26 5,38" fill="none" stroke={DARK_CRIMSON} strokeWidth={0.4} opacity={0.4} />
        <path d="M17,14 Q18,26 19,38" fill="none" stroke={DARK_CRIMSON} strokeWidth={0.4} opacity={0.4} />
        <path d="M12,11 Q11.5,26 11,40" fill="none" stroke={DARK_CRIMSON} strokeWidth={0.3} opacity={0.3} />

        {/* === LAVA CRACK LINES (pulse with tf) === */}
        <path d="M6,18 Q8,24 6,32" fill="none" stroke={LAVA_GLOW} strokeWidth={0.6} opacity={lavaPulse} />
        <path d="M18,20 Q16,27 18,34" fill="none" stroke={EMBER_ORANGE} strokeWidth={0.5} opacity={lavaPulse2} />
        <path d="M10,22 Q12,30 10,37" fill="none" stroke={LAVA_RED} strokeWidth={0.5} opacity={lavaPulse3} />
        <path d="M14,16 Q15,22 14,28" fill="none" stroke={EMBER_ORANGE} strokeWidth={0.4} opacity={lavaPulse * 0.7} />

        {/* Ragged hem — jagged points */}
        <polygon points="1,40 -1,44 3,41" fill={VOLCANIC_BLACK} />
        <polygon points="4,41 2,45 6,42" fill={DEEP_CRIMSON} opacity={0.8} />
        <polygon points="8,42 6,46 10,43" fill={VOLCANIC_BLACK} />
        <polygon points="12,43 11,47 14,43.5" fill={DEEP_CRIMSON} opacity={0.7} />
        <polygon points="16,42 18,46 17,42.5" fill={VOLCANIC_BLACK} />
        <polygon points="20,41 22,45 21,41.5" fill={DEEP_CRIMSON} opacity={0.8} />
        <polygon points="23,40 25,44 22,41" fill={VOLCANIC_BLACK} />

        {/* Hem glow */}
        <path d="M1,40 Q6,44 12,43 Q18,44 23,40" fill="none" stroke={LAVA_GLOW} strokeWidth={0.6} opacity={0.15 + (isCasting ? 0.15 : 0)} />
      </g>

      {/* === ARMS === */}
      {/* Left arm (spell arm) */}
      <g>
        {/* Sleeve */}
        {armRaise > 0 ? (
          <>
            {/* Raised arm — sleeve falls back */}
            <path d={`M5,14 Q${2 - armRaise * 4},${14 - armRaise * 10} ${1 - armRaise * 3},${10 - armRaise * 6}`}
              fill="none" stroke={VOLCANIC_BLACK} strokeWidth={4} strokeLinecap="round" />
            <path d={`M5,14 Q${2 - armRaise * 4},${14 - armRaise * 10} ${1 - armRaise * 3},${10 - armRaise * 6}`}
              fill="none" stroke={DEEP_CRIMSON} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
            {/* Gaunt hand — fingers spread with fire */}
            <g transform={`translate(${1 - armRaise * 3}, ${10 - armRaise * 6})`}>
              <line x1={0} y1={0} x2={-2} y2={-3} stroke={ASH_GRAY} strokeWidth={0.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={-3} y2={-1.5} stroke={ASH_GRAY} strokeWidth={0.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={-3} y2={0.5} stroke={ASH_GRAY} strokeWidth={0.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={-2} y2={2} stroke={ASH_GRAY} strokeWidth={0.7} strokeLinecap="round" />
              {/* Fire between fingers */}
              <circle cx={-2} cy={-1} r={2} fill={EMBER_ORANGE} opacity={0.35 * armRaise} />
              <circle cx={-2} cy={-1} r={1} fill={FIRE_GOLD} opacity={0.5 * armRaise} />
              {/* Fire stream to staff crown */}
              <line x1={0} y1={-1} x2={3} y2={-4 - armRaise * 2} stroke={EMBER_ORANGE} strokeWidth={1.2} opacity={0.3 * armRaise} strokeLinecap="round" />
            </g>
          </>
        ) : (
          /* Resting arm — hidden under robe */
          <path d="M5,14 Q3,20 4,26" fill="none" stroke={VOLCANIC_BLACK} strokeWidth={3.5} strokeLinecap="round" />
        )}
      </g>

      {/* Right arm (staff arm) */}
      <g>
        {armRaise > 0 ? (
          <>
            {/* Raised arm */}
            <path d={`M19,14 Q${22 + armRaise * 3},${14 - armRaise * 8} ${21 + armRaise * 2},${10 - armRaise * 5}`}
              fill="none" stroke={VOLCANIC_BLACK} strokeWidth={4} strokeLinecap="round" />
            <path d={`M19,14 Q${22 + armRaise * 3},${14 - armRaise * 8} ${21 + armRaise * 2},${10 - armRaise * 5}`}
              fill="none" stroke={DEEP_CRIMSON} strokeWidth={2.5} strokeLinecap="round" opacity={0.6} />
            {/* Gaunt hand */}
            <g transform={`translate(${21 + armRaise * 2}, ${10 - armRaise * 5})`}>
              <line x1={0} y1={0} x2={2} y2={-3} stroke={ASH_GRAY} strokeWidth={0.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={3} y2={-1.5} stroke={ASH_GRAY} strokeWidth={0.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={3} y2={0.5} stroke={ASH_GRAY} strokeWidth={0.8} strokeLinecap="round" />
              <line x1={0} y1={0} x2={2} y2={2} stroke={ASH_GRAY} strokeWidth={0.7} strokeLinecap="round" />
              {/* Fire glow */}
              <circle cx={2} cy={-1} r={2} fill={EMBER_ORANGE} opacity={0.35 * armRaise} />
              <circle cx={2} cy={-1} r={1} fill={FIRE_GOLD} opacity={0.5 * armRaise} />
              {/* Fire stream upward */}
              <line x1={0} y1={-1} x2={-2} y2={-4 - armRaise * 2} stroke={LAVA_GLOW} strokeWidth={1} opacity={0.3 * armRaise} strokeLinecap="round" />
            </g>
          </>
        ) : (
          /* Resting arm */
          <path d="M19,14 Q21,20 20,26" fill="none" stroke={VOLCANIC_BLACK} strokeWidth={3.5} strokeLinecap="round" />
        )}
      </g>

      {/* === HOOD / HEAD === */}
      {/* Hood outer shape — tall pointed */}
      <path d="M4,14 Q3,4 8,0 L12,-4 L16,0 Q21,4 20,14 Q16,17 12,16 Q8,17 4,14"
        fill={VOLCANIC_BLACK} stroke={DEEP_CRIMSON} strokeWidth={0.5} />
      {/* Hood depth — inner void */}
      <path d="M6,13 Q5.5,5 9,1.5 L12,-2 L15,1.5 Q18.5,5 18,13 Q15,15 12,14.5 Q9,15 6,13"
        fill={HOOD_VOID} />
      {/* Hood peak */}
      <polygon points="10,0 12,-6 14,0" fill={VOLCANIC_BLACK} />
      <line x1={12} y1={-6} x2={12} y2={-2} stroke={DEEP_CRIMSON} strokeWidth={0.3} opacity={0.5} />
      {/* Hood rim highlight */}
      <path d="M5,13.5 Q8,16 12,15.5 Q16,16 19,13.5" fill="none" stroke={CRIMSON_MID} strokeWidth={0.7} opacity={0.5} />
      {/* Hood fold lines */}
      <path d="M7,3 Q6.5,8 7,13" fill="none" stroke={DEEP_CRIMSON} strokeWidth={0.4} opacity={0.3} />
      <path d="M17,3 Q17.5,8 17,13" fill="none" stroke={DEEP_CRIMSON} strokeWidth={0.4} opacity={0.3} />
      <path d="M12,-4 Q11.5,4 12,14" fill="none" stroke={DEEP_CRIMSON} strokeWidth={0.3} opacity={0.2} />

      {/* === BURNING EMBER EYES (3-layer glow) === */}
      {/* Left eye */}
      <circle cx={9.5} cy={8} r={2.2} fill={LAVA_RED} opacity={eyePulse * 0.5} />
      <circle cx={9.5} cy={8} r={1.4} fill={EMBER_ORANGE} opacity={eyePulse * 0.7} />
      <circle cx={9.5} cy={8} r={0.6} fill={FIRE_WHITE} opacity={eyePulse * 0.9} />
      {/* Right eye */}
      <circle cx={14.5} cy={8} r={2.2} fill={LAVA_RED} opacity={eyePulse * 0.5} />
      <circle cx={14.5} cy={8} r={1.4} fill={EMBER_ORANGE} opacity={eyePulse * 0.7} />
      <circle cx={14.5} cy={8} r={0.6} fill={FIRE_WHITE} opacity={eyePulse * 0.9} />
      {/* Eye glow ambient */}
      <circle cx={12} cy={8} r={5} fill={LAVA_RED} opacity={0.06 + (isCasting ? 0.08 : 0)} />

      {/* === FLOATING EMBERS (orbiting body) === */}
      <circle cx={e1x} cy={e1y} r={1.2} fill={EMBER_ORANGE} opacity={0.5 + Math.sin(tf * 0.1) * 0.2} />
      <circle cx={e1x} cy={e1y} r={0.5} fill={FIRE_GOLD} opacity={0.4} />
      <circle cx={e2x} cy={e2y} r={1} fill={LAVA_GLOW} opacity={0.45 + Math.sin(tf * 0.1 + 1) * 0.15} />
      <circle cx={e2x} cy={e2y} r={0.4} fill={FIRE_WHITE} opacity={0.35} />
      <circle cx={e3x} cy={e3y} r={0.9} fill={FIRE_GOLD} opacity={0.4 + Math.sin(tf * 0.1 + 2.5) * 0.15} />
      <circle cx={e4x} cy={e4y} r={1.1} fill={LAVA_RED} opacity={0.4 + Math.sin(tf * 0.1 + 4) * 0.15} />
      <circle cx={e4x} cy={e4y} r={0.45} fill={FIRE_WHITE} opacity={0.3} />

      {/* === RISING HEAT SHIMMER PARTICLES (casting) === */}
      {isCasting && (
        <>
          <circle cx={8} cy={heatY1} r={0.7} fill={EMBER_ORANGE} opacity={heatY1 < 0 ? 0 : 0.5} />
          <circle cx={14} cy={heatY2} r={0.6} fill={FIRE_GOLD} opacity={heatY2 < 0 ? 0 : 0.45} />
          <circle cx={10} cy={heatY3} r={0.8} fill={LAVA_GLOW} opacity={heatY3 < 0 ? 0 : 0.5} />
          <circle cx={16} cy={heatY4} r={0.5} fill={FIRE_WHITE} opacity={heatY4 < 0 ? 0 : 0.4} />
          <circle cx={6} cy={heatY5} r={0.65} fill={EMBER_ORANGE} opacity={heatY5 < 0 ? 0 : 0.45} />
        </>
      )}

      {/* === CASTING BODY GLOW === */}
      {isCasting && (
        <ellipse cx={12} cy={20} r={14 + Math.sin(tf * 0.2) * 2} ry={18} fill={LAVA_RED} opacity={0.05 + castProgress * 0.05} />
      )}

      {/* === METEOR ATTACK (castTimer > 30) === */}
      {meteorActive && (
        <g>
          {/* Warning circle on ground at target */}
          <ellipse cx={meteorRelX} cy={meteorLandY + 8} rx={12 + Math.sin(tf * 0.3) * 2} ry={4} fill={LAVA_RED} opacity={0.15 + meteorProgress * 0.25} />
          <ellipse cx={meteorRelX} cy={meteorLandY + 8} rx={8} ry={2.5} fill={EMBER_ORANGE} opacity={0.1 + meteorProgress * 0.2} />
          {/* Warning cross */}
          <line x1={meteorRelX - 6} y1={meteorLandY + 8} x2={meteorRelX + 6} y2={meteorLandY + 8} stroke={LAVA_RED} strokeWidth={0.6} opacity={0.3 + Math.sin(tf * 0.4) * 0.2} />
          <line x1={meteorRelX} y1={meteorLandY + 4} x2={meteorRelX} y2={meteorLandY + 12} stroke={LAVA_RED} strokeWidth={0.6} opacity={0.3 + Math.sin(tf * 0.4) * 0.2} />

          {/* Meteor body */}
          <g transform={`translate(${meteorRelX}, ${meteorCurrentY})`}>
            {/* Trail */}
            <line x1={0} y1={0} x2={0} y2={-18} stroke={EMBER_ORANGE} strokeWidth={3} opacity={0.3} strokeLinecap="round" />
            <line x1={0} y1={0} x2={0} y2={-12} stroke={FIRE_GOLD} strokeWidth={1.5} opacity={0.4} strokeLinecap="round" />
            {/* Outer glow */}
            <circle cx={0} cy={0} r={7} fill={LAVA_RED} opacity={0.2} />
            {/* Rock body */}
            <circle cx={0} cy={0} r={4} fill={DEEP_CRIMSON} />
            <circle cx={0} cy={0} r={3} fill={DARK_CRIMSON} />
            {/* Lava veins on meteor */}
            <line x1={-2} y1={-1} x2={1} y2={2} stroke={LAVA_GLOW} strokeWidth={0.6} opacity={0.6} />
            <line x1={1} y1={-2} x2={-1} y2={1} stroke={EMBER_ORANGE} strokeWidth={0.5} opacity={0.5} />
            {/* Core glow */}
            <circle cx={0} cy={0} r={1.5} fill={EMBER_ORANGE} opacity={0.6} />
            <circle cx={0} cy={0} r={0.6} fill={FIRE_WHITE} opacity={0.7} />
            {/* Sparks trailing */}
            <circle cx={-2 + Math.sin(tf * 0.6) * 2} cy={-6} r={0.5} fill={FIRE_GOLD} opacity={0.6} />
            <circle cx={1.5 + Math.cos(tf * 0.5) * 1.5} cy={-9} r={0.4} fill={FIRE_WHITE} opacity={0.5} />
            <circle cx={-1 + Math.sin(tf * 0.7) * 1} cy={-13} r={0.35} fill={EMBER_ORANGE} opacity={0.4} />
          </g>
        </g>
      )}

      {/* === HIT FLASH === */}
      {recentlyHit && (
        <rect x={-2} y={-8} width={28} height={54} fill={LAVA_RED} opacity={0.15} rx={3} />
      )}

      {/* === HEALTH BAR (fire orange, 24px wide, at y=-10) === */}
      <rect x={0} y={-10} width={24} height={5} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-9} width={Math.max(0, (health / maxHealth) * 22)} height={3}
            fill={LAVA_GLOW} rx={1} />
      {showHpNumbers && (
        <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}

      {/* === CAST BAR (below health bar) === */}
      {isCasting && (
        <>
          <rect x={0} y={-4} width={24} height={3.5} fill="#1a0a0a" rx={1} stroke={DEEP_CRIMSON} strokeWidth={0.3} />
          <rect x={0.5} y={-3.5} width={Math.max(0, castProgress * 23)} height={2.5}
                fill={EMBER_ORANGE} rx={0.5} />
          <rect x={0.5} y={-3.5} width={Math.max(0, castProgress * 23)} height={1}
                fill={FIRE_GOLD} rx={0.5} opacity={0.4} />
        </>
      )}

      </g>
      </g>
    </g>
  );
}

export default memo(DetailedFlameCaller, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  if (prev.isCasting !== next.isCasting) return false;
  if (prev.castTimer !== next.castTimer) return false;
  if (prev.castTargetX !== next.castTargetX || prev.castTargetY !== next.castTargetY) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  // Re-render every 3 frames for JS animations (embers, pulses, heat shimmer)
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
