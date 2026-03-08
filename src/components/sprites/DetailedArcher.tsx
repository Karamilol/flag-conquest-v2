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
  attackCooldown?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
  bodyOnly?: boolean;
}

export function DetailedArcher({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId, bodyOnly }: Props) {
  const isAttacking = attackCooldown < 10;
  const attackPhase = isAttacking ? attackCooldown / 10 : 0;
  const stringPull = isAttacking ? (1 - attackPhase) * 7 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  // Archer stays in 'idle' during attack (ranged — bob shouldn't snap)
  const state = health <= 0 ? 'die' : 'idle';

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Throttled frame for JS animations — every 3 ticks
  const tf = Math.floor(frame / 3) * 3;

  // Eye glow pulse — sharper when attacking
  const eyeGlow = isAttacking ? 1.0 : 0.6 + Math.sin(tf * 0.1) * 0.25;

  // Breathing — subtle chest expansion
  const breathe = Math.sin(tf * 0.04) * 0.5;

  // Quiver arrow rattle — slight sway
  const quiverRattle = Math.sin(tf * 0.12) * 0.8;

  // Cloak tail flutter — wind-like motion
  const cloakFlutter1 = Math.sin(tf * 0.06) * 2;
  const cloakFlutter2 = Math.sin(tf * 0.08 + 1) * 1.5;

  // Head scan — subtle left/right look
  const headScan = Math.sin(tf * 0.03) * 0.5;

  // Colors
  const hood = '#2a3a2a';
  const hoodDark = '#1a2a1a';
  const hoodLight = '#3a4a3a';
  const cloak = '#3a4a3a';
  const cloakDark = '#2a3a2a';
  const leather = '#5a4a3a';
  const leatherDark = '#3a2a1a';
  const leatherLight = '#6a5a4a';
  const bowWood = '#8b5a2a';
  const bowWoodLight = '#a87040';
  const string = '#bbb';
  const skin = '#c8a880';
  const metal = '#888';
  const quiverColor = '#4a3a2a';

  // Animation desync based on position
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  // String nock points (top and bottom of bow)
  const bowTopY = 0;
  const bowBotY = 24;
  const bowX = -2;
  // String midpoint (where arrow nocks) — pulled right when attacking
  const stringMidX = bowX + stringPull;
  const stringMidY = 12;

  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      <g className={`sprite-${state}`} style={delayStyle}>

      {/* === ELITE === */}
      {!bodyOnly && isElite && eliteGlow && (
        <circle cx={12} cy={12} r={18} fill={eliteGlow} opacity={0.15} />
      )}
      {!bodyOnly && eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === SHADOW === */}
      <ellipse cx={12} cy={28} rx={10} ry={3} fill="rgba(0,0,0,0.25)" />

      {/* Everything drawn naturally facing LEFT (bow on left side) */}

      {/* === CLOAK TAIL (behind body, trails to right — flutters) === */}
      <polygon points={`16,8 ${20 + cloakFlutter1},24 ${22 + cloakFlutter2},26 18,10`} fill={cloakDark} />
      <polygon points={`17,8 ${21 + cloakFlutter1 * 0.7},23 ${20 + cloakFlutter2 * 0.8},25 18,10`} fill={cloak} opacity={0.7} />
      <polygon points={`${20 + cloakFlutter1},23 ${21 + cloakFlutter2},25 ${22 + cloakFlutter1 * 0.5},24 ${21 + cloakFlutter2 * 0.3},22`} fill={cloakDark} opacity={0.6} />

      {/* === QUIVER (on back — right side) === */}
      <rect x={16} y={2} width={4} height={14} fill={quiverColor} rx={1} />
      <rect x={19} y={2} width={1} height={14} fill={leatherDark} rx={0.5} />
      {/* Quiver strap across chest */}
      <line x1={18} y1={2} x2={8} y2={8} stroke={leather} strokeWidth={1.5} />
      <line x1={18} y1={2} x2={8} y2={8} stroke={leatherLight} strokeWidth={0.5} opacity={0.4} />
      {/* Arrow shafts poking out top — rattle */}
      <line x1={16.5} y1={2} x2={16 + quiverRattle * 0.3} y2={-4} stroke={bowWood} strokeWidth={1} />
      <line x1={18} y1={2} x2={17.5 + quiverRattle * 0.5} y2={-5} stroke={bowWood} strokeWidth={1} />
      <line x1={19.5} y1={2} x2={19.5 + quiverRattle * 0.2} y2={-3.5} stroke={bowWood} strokeWidth={1} />
      {/* Fletchings — rattle with arrows */}
      <polygon points={`${15.5 + quiverRattle * 0.3},-4 ${16 + quiverRattle * 0.3},-4 ${16.5 + quiverRattle * 0.3},-6 ${15.5 + quiverRattle * 0.3},-5.5`} fill="#888" opacity={0.7} />
      <polygon points={`${17 + quiverRattle * 0.5},-5 ${17.5 + quiverRattle * 0.5},-5 ${18 + quiverRattle * 0.5},-7 ${17 + quiverRattle * 0.5},-6.5`} fill="#888" opacity={0.7} />
      <polygon points={`${19 + quiverRattle * 0.2},-3.5 ${19.5 + quiverRattle * 0.2},-3.5 ${20 + quiverRattle * 0.2},-5.5 ${19 + quiverRattle * 0.2},-5`} fill="#888" opacity={0.7} />

      {/* === BACK LEG === */}
      <rect x={8} y={18} width={5} height={6} fill={cloakDark} />
      <rect x={7} y={23} width={6} height={3} fill={leather} rx={1} />
      <rect x={7} y={25} width={7} height={2} fill={leatherDark} rx={1} />
      <line x1={7} y1={24} x2={13} y2={23} stroke={leatherLight} strokeWidth={0.5} opacity={0.4} />

      {/* === TORSO (breathing) === */}
      {/* Leather vest base */}
      <rect x={5} y={6 - breathe * 0.3} width={14} height={12 + breathe * 0.5} fill={cloak} rx={1} />
      {/* Leather chest piece */}
      <rect x={6} y={7 - breathe * 0.2} width={12} height={10 + breathe * 0.4} fill={leather} opacity={0.6} />
      {/* Center stitching */}
      <line x1={12} y1={7} x2={12} y2={17} stroke={leatherDark} strokeWidth={0.8} opacity={0.4} />
      {/* Texture */}
      <rect x={7} y={9} width={4} height={1} fill={leatherLight} opacity={0.15} />
      <rect x={7} y={12} width={4} height={1} fill={leatherLight} opacity={0.15} />
      <rect x={13} y={10} width={4} height={1} fill={leatherLight} opacity={0.15} />
      {/* Belt */}
      <rect x={4} y={16} width={16} height={2} fill={leather} />
      <rect x={4} y={16} width={16} height={0.5} fill={leatherLight} opacity={0.3} />
      <rect x={10} y={16} width={4} height={2} fill={metal} rx={0.5} />

      {/* === FRONT LEG === */}
      <rect x={11} y={18} width={5} height={6} fill={cloak} />
      <rect x={11} y={19} width={5} height={2.5} fill={leather} rx={0.5} />
      <rect x={10} y={23} width={6} height={3} fill={leather} rx={1} />
      <rect x={10} y={25} width={7} height={2} fill={leatherDark} rx={1} />
      <rect x={15} y={26} width={2} height={1} fill={leatherDark} rx={0.5} />

      {/* === DRAW ARM (right side — pulls string, behind bow arm) === */}
      <rect x={14} y={5} width={5} height={4} fill={cloak} rx={1} />
      <rect x={14} y={8} width={4} height={5} fill={cloak} />
      <rect x={15} y={11} width={4} height={3} fill={leather} rx={0.5} />
      {isAttacking ? (
        /* Hand at string position when drawing */
        <rect x={stringMidX - 1} y={stringMidY - 1} width={3} height={3} fill={leatherDark} rx={0.5} />
      ) : (
        <rect x={15} y={14} width={3} height={2} fill={skin} rx={0.5} />
      )}

      {/* === BOW + BOW ARM (left side — faces toward player) === */}
      {/* Shoulder */}
      <rect x={2} y={5} width={5} height={4} fill={cloak} rx={1} />
      {/* Forearm */}
      <rect x={0} y={8} width={5} height={5} fill={cloakDark} />
      {/* Bracer */}
      <rect x={-1} y={11} width={5} height={3} fill={leather} rx={0.5} />
      <rect x={-1} y={12} width={5} height={0.8} fill={leatherLight} opacity={0.3} />
      {/* Hand gripping bow */}
      <rect x={-2} y={10} width={3} height={4} fill={skin} rx={0.5} />

      {/* === THE BOW — curved D-shape path === */}
      {/* Main limbs — a single curved path */}
      <path
        d={`M${bowX},${bowTopY} C${bowX - 6},${bowTopY + 6} ${bowX - 6},${bowBotY - 6} ${bowX},${bowBotY}`}
        fill="none" stroke={bowWood} strokeWidth={2.5} strokeLinecap="round"
      />
      {/* Inner highlight on limbs */}
      <path
        d={`M${bowX},${bowTopY + 1} C${bowX - 5},${bowTopY + 6} ${bowX - 5},${bowBotY - 6} ${bowX},${bowBotY - 1}`}
        fill="none" stroke={bowWoodLight} strokeWidth={0.8} opacity={0.4}
      />
      {/* Grip wrapping at center */}
      <rect x={bowX - 3} y={10} width={4} height={4} fill={leather} rx={1} />
      <line x1={bowX - 3} y1={11} x2={bowX + 1} y2={10.5} stroke={leatherDark} strokeWidth={0.5} opacity={0.5} />
      <line x1={bowX - 3} y1={12.5} x2={bowX + 1} y2={12} stroke={leatherDark} strokeWidth={0.5} opacity={0.5} />
      {/* Nock tips (small) */}
      <circle cx={bowX} cy={bowTopY} r={1} fill={bowWood} />
      <circle cx={bowX} cy={bowBotY} r={1} fill={bowWood} />

      {/* Bowstring */}
      <line x1={bowX} y1={bowTopY} x2={stringMidX} y2={stringMidY} stroke={string} strokeWidth={0.8} />
      <line x1={stringMidX} y1={stringMidY} x2={bowX} y2={bowBotY} stroke={string} strokeWidth={0.8} />

      {/* Arrow nocked when attacking */}
      {isAttacking && (
        <g>
          {/* Arrow shaft — from string to past bow */}
          <line x1={stringMidX} y1={stringMidY} x2={-14} y2={12} stroke={bowWood} strokeWidth={1.5} />
          {/* Arrowhead */}
          <polygon points="-14,10.5 -14,13.5 -17,12" fill={metal} />
          {/* Fletching near string */}
          <polygon points={`${stringMidX - 1},11 ${stringMidX - 1},13 ${stringMidX + 2},12`} fill="#777" opacity={0.6} />
        </g>
      )}

      {/* Release flash */}
      {isAttacking && attackPhase < 0.3 && (
        <circle cx={-14} cy={12} r={4} fill="#ffaa00" opacity={0.5} />
      )}

      {/* === HEAD (subtle scan) === */}
      <g transform={`translate(${headScan}, 0)`}>
        {/* Face in shadow */}
        <rect x={5} y={-1} width={12} height={7} fill={hoodDark} rx={1} />
        <rect x={7} y={2} width={8} height={4} fill={skin} opacity={0.25} rx={1} />

        {/* Hood */}
        <polygon points="4,-6 20,-6 22,2 18,6 4,6 2,2" fill={hood} />
        <polygon points="6,-6 18,-6 16,-8 8,-8" fill={hoodDark} />
        {/* Hood front overhang */}
        <polygon points="4,0 20,0 18,4 6,4" fill={hood} opacity={0.85} />
        <rect x={4} y={0} width={16} height={1.5} fill={hoodDark} rx={0.5} />
        {/* Hood side folds */}
        <line x1={6} y1={-5} x2={5} y2={3} stroke={hoodDark} strokeWidth={0.8} opacity={0.5} />
        <line x1={18} y1={-5} x2={19} y2={3} stroke={hoodDark} strokeWidth={0.8} opacity={0.5} />
        {/* Hood top highlight */}
        <rect x={8} y={-7} width={6} height={2} fill={hoodLight} opacity={0.2} rx={1} />

        {/* Glowing eyes under hood — pulsing */}
        <rect x={6} y={1.5} width={2.5} height={2} fill="#ffdd00" rx={0.5} opacity={eyeGlow} />
        <rect x={13} y={1.5} width={2.5} height={2} fill="#ffdd00" rx={0.5} opacity={eyeGlow} />
        <rect x={6} y={1.5} width={2.5} height={2} fill="#ffff44" opacity={eyeGlow * 0.4} rx={0.5} />
        <rect x={13} y={1.5} width={2.5} height={2} fill="#ffff44" opacity={eyeGlow * 0.4} rx={0.5} />
        {/* Eye glow bloom */}
        <rect x={5} y={0.5} width={4.5} height={4} fill="#ffdd00" opacity={eyeGlow * 0.08} rx={1} />
        <rect x={12} y={0.5} width={4.5} height={4} fill="#ffdd00" opacity={eyeGlow * 0.08} rx={1} />

        {/* Face wrap */}
        <rect x={6} y={4} width={10} height={2.5} fill={hoodDark} rx={1} />
        <line x1={6} y1={5} x2={16} y2={5} stroke={hood} strokeWidth={0.5} opacity={0.3} />
      </g>

      {/* === HIT FLASH === */}
      {!bodyOnly && recentlyHit && (
        <rect x={-6} y={-10} width={32} height={40} fill="#ff0000" opacity={0.12} rx={2} />
      )}

      {/* === HEALTH BAR === */}
      {!bodyOnly && <>
      <rect x={0} y={-12} width={24} height={5} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-11} width={Math.max(0, (health / maxHealth) * 22)} height={3}
            fill="#ffaa00" rx={1} />
      {showHpNumbers && (
        <text x={12} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
      </>}
      </g>
    </g>
  );
}

export default memo(DetailedArcher, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAttacking = (prev.attackCooldown ?? 99) < 10;
  const nextAttacking = (next.attackCooldown ?? 99) < 10;
  if (prevAttacking !== nextAttacking) return false;
  if (prevAttacking && prev.attackCooldown !== next.attackCooldown) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
