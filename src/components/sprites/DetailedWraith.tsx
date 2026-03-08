import { memo } from 'react';
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
}

function DetailedWraith({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const isAttacking = attackCooldown < 10;
  const attackPhase = isAttacking ? attackCooldown / 10 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Throttled frame for JS animations (tendrils, claws, particles) — every 3 ticks
  const tf = Math.floor(frame / 3) * 3;
  const t1 = Math.sin(tf * 0.15) * 3;
  const t2 = Math.sin(tf * 0.12 + 1) * 2.5;
  const t3 = Math.sin(tf * 0.18 + 2) * 4;
  const t4 = Math.sin(tf * 0.1 + 3) * 2;
  const t5 = Math.sin(tf * 0.14 + 4) * 3;
  const attackReach = isAttacking ? (1 - attackPhase) * -8 : 0;
  const eyeR = isAttacking ? 3 + (1 - attackPhase) * 1.5 : 2.8;
  // Claw flex — staggered sine, creepy grasping
  const clawFlex1 = Math.sin(tf * 0.08) * 2;
  const clawFlex2 = Math.sin(tf * 0.08 + 1.2) * 2;
  const clawFlex3 = Math.sin(tf * 0.08 + 2.4) * 2;
  const clawFlex4 = Math.sin(tf * 0.08 + 3.6) * 1.5;
  // CSS animation desync based on position
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  // Colors
  const robeOuter = '#1a0a2e';
  const robeInner = '#0d0518';
  const robeMid = '#140820';
  const robeHighlight = '#2a1a4e';
  const spectral = '#4a2a6e';
  const eyeColor = '#ff00ff';
  const eyeCore = '#ffaaff';
  const boneColor = '#b8a898';
  const boneDark = '#7a6a5a';
  const soulFire = '#8844aa';

  // Center x=15
  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
    <g className="sprite-wraith-float" style={delayStyle}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={15} cy={15} r={22} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={15} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === SHADOW === */}
      <ellipse cx={15} cy={46} rx={12} ry={3.5} fill="rgba(80,0,120,0.3)" />

      {/* === TENDRILS (lower body dissolves — start inside body for seamless attach) === */}
      {/* Thick main tendrils */}
      <path d={`M8,26 Q${5 + t1},34 ${7 + t1 * 0.3},40 Q${8 + t1 * 0.1},44 ${7},47`}
        stroke={robeOuter} strokeWidth={3.5} fill="none" opacity={0.55} />
      <path d={`M12,27 Q${12 + t2},35 ${11 + t2 * 0.4},42 Q${12},46 ${12},48`}
        stroke={robeOuter} strokeWidth={2.5} fill="none" opacity={0.4} />
      <path d={`M18,27 Q${18 + t5},35 ${19 + t5 * 0.3},42 Q${18},46 ${18},48`}
        stroke={robeOuter} strokeWidth={2.5} fill="none" opacity={0.4} />
      <path d={`M22,26 Q${25 + t3 * 0.3},34 ${23 + t3 * 0.2},40 Q${22 + t3 * 0.1},44 ${23},47`}
        stroke={robeOuter} strokeWidth={3.5} fill="none" opacity={0.55} />
      {/* Thin wisps */}
      <path d={`M10,26 Q${6 + t4},35 ${8 + t4 * 0.2},43`}
        stroke={spectral} strokeWidth={0.8} fill="none" opacity={0.2} />
      <path d={`M20,26 Q${24 - t4},35 ${22 - t4 * 0.2},43`}
        stroke={spectral} strokeWidth={0.8} fill="none" opacity={0.2} />
      <path d={`M15,28 Q${15 + t1 * 0.3},37 ${15 + t1 * 0.1},45`}
        stroke={spectral} strokeWidth={0.6} fill="none" opacity={0.15} />

      {/* === MAIN BODY — broad shoulders, tapers to dissolving bottom === */}
      <g className="sprite-wraith-body">
        {/* Outer robe — wide angular shoulders → narrow waist → ragged dissolve */}
        <path d="M3,8 L1,10 L2,16 L5,22 L8,28 Q12,30 15,30 Q18,30 22,28 L25,22 L28,16 L29,10 L27,8 L23,6 Q19,3 15,2 Q11,3 7,6 Z"
          fill={robeOuter} />
        {/* Mid layer — angular inner */}
        <path d="M5,9 L4,14 L6,20 L9,26 Q12,28 15,28 Q18,28 21,26 L24,20 L26,14 L25,9 L22,7 Q18,4.5 15,4 Q12,4.5 8,7 Z"
          fill={robeMid} />
        {/* Inner void — deep darkness */}
        <path d="M8,10 L7,16 L9,22 Q12,25 15,25 Q18,25 21,22 L23,16 L22,10 Q19,6 15,5.5 Q11,6 8,10"
          fill={robeInner} opacity={0.85} />

        {/* Shoulder spikes / angular protrusions */}
        <polygon points="3,8 1,6 4,7 7,6" fill={robeOuter} />
        <polygon points="27,8 29,6 26,7 23,6" fill={robeOuter} />

        {/* Vertical fold creases */}
        <line x1={11} y1={8} x2={10} y2={28} stroke={robeHighlight} strokeWidth={0.5} opacity={0.2} />
        <line x1={19} y1={8} x2={20} y2={28} stroke={robeHighlight} strokeWidth={0.5} opacity={0.2} />
        <line x1={15} y1={6} x2={15} y2={28} stroke={robeInner} strokeWidth={0.6} opacity={0.25} />
        {/* Diagonal shoulder folds */}
        <line x1={5} y1={9} x2={10} y2={16} stroke={robeHighlight} strokeWidth={0.4} opacity={0.15} />
        <line x1={25} y1={9} x2={20} y2={16} stroke={robeHighlight} strokeWidth={0.4} opacity={0.15} />
      </g>

      {/* === LEFT ARM (attack arm) === */}
      <g>
        {/* Sleeve */}
        <path d={`M3,10 Q${0 + attackReach * 0.3},14 ${-3 + attackReach * 0.6},17 L${-5 + attackReach},20`}
          stroke={robeOuter} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d={`M3,10 Q${0 + attackReach * 0.3},14 ${-3 + attackReach * 0.6},17`}
          stroke={robeMid} strokeWidth={2} fill="none" strokeLinecap="round" />
        {/* Tattered cuff */}
        <path d={`M${-4 + attackReach},18 L${-6 + attackReach},21 L${-3 + attackReach},19 L${-2 + attackReach},22`}
          stroke={robeOuter} strokeWidth={0.8} fill="none" opacity={0.5} />

        {/* Skeletal hand */}
        <g transform={`translate(${attackReach}, 0)`}>
          {/* Spectral glow around hand */}
          <ellipse cx={-7} cy={19} rx={5} ry={4} fill={eyeColor} opacity={0.04} />
          {/* Wrist bones — two parallel lines */}
          <line x1={-4} y1={19} x2={-6} y2={20} stroke={boneColor} strokeWidth={1.2} />
          <line x1={-4} y1={20} x2={-6} y2={21} stroke={boneDark} strokeWidth={1} />
          {/* Palm — small bone shape */}
          <ellipse cx={-7} cy={20} rx={2} ry={1.8} fill={boneColor} opacity={0.7} />
          <ellipse cx={-7} cy={20} rx={1.5} ry={1.2} fill={boneDark} opacity={0.3} />
          {/* Fingers — long curved bones, staggered flex */}
          <path d={`M-8,18.5 Q${-10 + clawFlex1 * 0.5},${16 + clawFlex1} ${-12 + clawFlex1},${14 + clawFlex1}`} stroke={boneColor} strokeWidth={1} fill="none" />
          <path d={`M-8.5,19.5 Q${-11 + clawFlex2 * 0.5},${17.5 + clawFlex2} ${-13 + clawFlex2},${16 + clawFlex2}`} stroke={boneColor} strokeWidth={1} fill="none" />
          <path d={`M-8.5,20.5 Q${-11 + clawFlex3 * 0.5},${19 + clawFlex3} ${-13 + clawFlex3},${18.5 + clawFlex3}`} stroke={boneColor} strokeWidth={0.9} fill="none" />
          <path d={`M-8,21.5 Q${-10 + clawFlex4 * 0.5},${21 + clawFlex4} ${-12 + clawFlex4},${21 + clawFlex4}`} stroke={boneColor} strokeWidth={0.8} fill="none" />
          {/* Sharp claw tips */}
          <path d={`M${-12 + clawFlex1},${14 + clawFlex1} L${-13 + clawFlex1},${12.5 + clawFlex1} L${-11.5 + clawFlex1},${13.5 + clawFlex1}`} fill={boneDark} stroke={boneDark} strokeWidth={0.3} />
          <path d={`M${-13 + clawFlex2},${16 + clawFlex2} L${-14 + clawFlex2},${14.5 + clawFlex2} L${-12.5 + clawFlex2},${15.5 + clawFlex2}`} fill={boneDark} stroke={boneDark} strokeWidth={0.3} />
          <path d={`M${-13 + clawFlex3},${18.5 + clawFlex3} L${-14 + clawFlex3},${17 + clawFlex3} L${-12.5 + clawFlex3},${18 + clawFlex3}`} fill={boneDark} stroke={boneDark} strokeWidth={0.3} />
          <path d={`M${-12 + clawFlex4},${21 + clawFlex4} L${-13 + clawFlex4},${20 + clawFlex4} L${-11.5 + clawFlex4},${20.5 + clawFlex4}`} fill={boneDark} stroke={boneDark} strokeWidth={0.3} />
          {/* Knuckle joints */}
          <circle cx={-8.2} cy={18.8} r={0.6} fill={boneColor} opacity={0.5} />
          <circle cx={-8.8} cy={19.8} r={0.6} fill={boneColor} opacity={0.5} />
          <circle cx={-8.5} cy={20.8} r={0.6} fill={boneColor} opacity={0.4} />
        </g>
      </g>

      {/* === RIGHT ARM (trailing) === */}
      <g>
        {/* Sleeve */}
        <path d="M27,10 Q30,14 32,18 L33,21"
          stroke={robeOuter} strokeWidth={4} fill="none" strokeLinecap="round" />
        <path d="M27,10 Q30,14 32,18"
          stroke={robeMid} strokeWidth={2} fill="none" strokeLinecap="round" />
        <path d="M32,19 L34,22 L35,19 L36,21" stroke={robeOuter} strokeWidth={0.8} fill="none" opacity={0.5} />

        {/* Skeletal hand */}
        {/* Spectral glow */}
        <ellipse cx={37} cy={20} rx={4} ry={3.5} fill={eyeColor} opacity={0.03} />
        {/* Wrist */}
        <line x1={34} y1={20} x2={36} y2={20.5} stroke={boneColor} strokeWidth={1.2} opacity={0.7} />
        <line x1={34} y1={21} x2={36} y2={21.5} stroke={boneDark} strokeWidth={1} opacity={0.6} />
        {/* Palm */}
        <ellipse cx={37} cy={21} rx={1.8} ry={1.5} fill={boneColor} opacity={0.6} />
        {/* Fingers — staggered flex (offset phase from left hand) */}
        <path d={`M38,19.5 Q${40 - clawFlex2 * 0.5},${18 + clawFlex2} ${42 - clawFlex2},${16.5 + clawFlex2}`} stroke={boneColor} strokeWidth={0.9} fill="none" opacity={0.6} />
        <path d={`M38.5,20.5 Q${41 - clawFlex3 * 0.5},${19 + clawFlex3} ${43 - clawFlex3},${18 + clawFlex3}`} stroke={boneColor} strokeWidth={0.9} fill="none" opacity={0.6} />
        <path d={`M38.5,21.5 Q${41 - clawFlex4 * 0.5},${21 + clawFlex4} ${42 - clawFlex4},${20.5 + clawFlex4}`} stroke={boneColor} strokeWidth={0.8} fill="none" opacity={0.5} />
        <path d={`M38,22 Q${40 - clawFlex1 * 0.5},${22 + clawFlex1} ${41 - clawFlex1},${22.5 + clawFlex1}`} stroke={boneColor} strokeWidth={0.7} fill="none" opacity={0.5} />
        {/* Claw tips */}
        <path d={`M${42 - clawFlex2},${16.5 + clawFlex2} L${43 - clawFlex2},${15 + clawFlex2} L${41.5 - clawFlex2},${16 + clawFlex2}`} fill={boneDark} stroke={boneDark} strokeWidth={0.3} opacity={0.6} />
        <path d={`M${43 - clawFlex3},${18 + clawFlex3} L${44 - clawFlex3},${16.5 + clawFlex3} L${42.5 - clawFlex3},${17.5 + clawFlex3}`} fill={boneDark} stroke={boneDark} strokeWidth={0.3} opacity={0.6} />
        <path d={`M${42 - clawFlex4},${20.5 + clawFlex4} L${43 - clawFlex4},${19.5 + clawFlex4} L${41.5 - clawFlex4},${20 + clawFlex4}`} fill={boneDark} stroke={boneDark} strokeWidth={0.3} opacity={0.5} />
      </g>

      {/* === HEAD / HOOD — big angular, menacing === */}
      <g className="sprite-wraith-head">
        {/* Hood — wide, pointed peak, angular jaw */}
        <path d="M6,4 L5,0 L7,-4 L11,-8 L15,-10 L19,-8 L23,-4 L25,0 L24,4 L22,7 L18,8 L15,9 L12,8 L8,7 Z"
          fill={robeOuter} />
        {/* Inner void */}
        <path d="M8,2 L8,-1 L10,-4 L14,-7 L16,-7 L20,-4 L22,-1 L22,2 Q21,6 18,7 L15,7.5 L12,7 Q9,6 8,2"
          fill={robeInner} />
        {/* Hood rim — sharp edge */}
        <path d="M7,3 L7,0 L9,-3.5 Q15,-8 21,-3.5 L23,0 L23,3"
          stroke={robeHighlight} strokeWidth={0.8} fill="none" opacity={0.3} />
        {/* Hood peak */}
        <path d="M13,-8 L15,-10 L17,-8" stroke={robeHighlight} strokeWidth={0.6} fill="none" opacity={0.25} />
        {/* Angular cheek edges */}
        <line x1={8} y1={3} x2={10} y2={6} stroke={robeHighlight} strokeWidth={0.5} opacity={0.2} />
        <line x1={22} y1={3} x2={20} y2={6} stroke={robeHighlight} strokeWidth={0.5} opacity={0.2} />

        {/* Skull hints */}
        <path d="M10,0 Q15,-1 20,0" stroke={boneColor} strokeWidth={0.6} fill="none" opacity={0.1} />

        {/* Eyes — large, menacing */}
        <circle cx={12} cy={1} r={eyeR + 1.5} fill={eyeColor} opacity={0.14} />
        <circle cx={18} cy={1} r={eyeR + 1.5} fill={eyeColor} opacity={0.14} />
        <circle cx={12} cy={1} r={eyeR} fill={eyeColor} opacity={0.9 *0.9} />
        <circle cx={18} cy={1} r={eyeR} fill={eyeColor} opacity={0.9 *0.9} />
        <circle cx={12} cy={1} r={1.3} fill={eyeCore} />
        <circle cx={18} cy={1} r={1.3} fill={eyeCore} />
        <circle cx={11.2} cy={0.2} r={0.5} fill="#fff" opacity={0.6} />
        <circle cx={17.2} cy={0.2} r={0.5} fill="#fff" opacity={0.6} />

        {/* Mouth void */}
        <ellipse cx={15} cy={5} rx={2.5} ry={1} fill={robeInner} opacity={0.7} />
      </g>

      {/* === SOUL PARTICLES === */}
      {[0, 1, 2, 3, 4, 5].map(i => {
        const px = 5 + i * 5 + Math.sin(frame * 0.1 + i * 2.3) * 3;
        const py = 5 - ((frame * 0.25 + i * 10) % 28);
        const po = Math.max(0, 1 - ((frame * 0.25 + i * 10) % 28) / 28) * 0.4;
        const pr = 0.6 + Math.sin(i * 2.7) * 0.3;
        return <circle key={i} cx={px} cy={py} r={pr} fill={soulFire} opacity={po} />;
      })}

      {/* === WISPS FROM HOOD === */}
      <path d={`M11,-8 Q${9 + t2 * 0.2},-12 ${10 + t2 * 0.3},-16`}
        stroke={spectral} strokeWidth={0.7} fill="none" opacity={0.2} />
      <path d={`M19,-8 Q${21 - t1 * 0.2},-12 ${20 - t1 * 0.3},-16`}
        stroke={spectral} strokeWidth={0.7} fill="none" opacity={0.2} />

      {/* === ATTACK PULSE === */}
      {isAttacking && attackPhase < 0.4 && (
        <circle cx={15} cy={15} r={20} fill={eyeColor} opacity={0.1} />
      )}

      {/* === HIT FLASH === */}
      {recentlyHit && (
        <rect x={-4} y={-10} width={38} height={45} fill="#ff0000" opacity={0.12} rx={4} />
      )}

      {/* === HEALTH BAR === */}
      <rect x={0} y={-14} width={30} height={4} fill="#333" rx={1} />
      <rect x={0} y={-14} width={Math.max(0, 30 * (health / maxHealth))} height={4} fill="#8844aa" rx={1} />
      {showHpNumbers && (
        <text x={15} y={-16} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
    </g>
  );
}

// Float/sway is CSS-driven. JS animations (tendrils, claws) use throttled frame.
export default memo(DetailedWraith, (prev, next) => {
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
  // Re-render for throttled JS animations (tendrils, claws) every 3 frames
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
