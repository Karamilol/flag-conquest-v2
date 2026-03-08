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

function DetailedCorruptedSentinel({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const isAttacking = attackCooldown < 12;
  const attackPhase = isAttacking ? attackCooldown / 12 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Throttled frame for corruption pulsing — every 3 ticks
  const tf = Math.floor(frame / 3) * 3;
  const atkI = isAttacking ? 1.6 : 1;
  const pulse1 = (Math.sin(tf * 0.1) * 0.5 + 0.5) * atkI;
  const pulse2 = (Math.sin(tf * 0.12 + 1.5) * 0.5 + 0.5) * atkI;
  const pulse3 = (Math.sin(tf * 0.08 + 3.0) * 0.5 + 0.5) * atkI;
  const pulse4 = (Math.sin(tf * 0.14 + 4.5) * 0.5 + 0.5) * atkI;

  // Shield slam: shield thrusts forward during attack
  const shieldSlam = isAttacking ? (1 - attackPhase) * -6 : 0;
  // Body lean forward during attack
  const bodyLean = isAttacking ? (1 - attackPhase) * -2 : 0;

  // Idle weight shift — heavy rocking
  const weightShift = isAttacking ? 0 : Math.sin(tf * 0.03) * 0.8;

  // Breathing — heavy armor chest expand
  const breathe = Math.sin(tf * 0.04) * 0.3;

  // Eye flicker intensity
  const eyeFlicker = isAttacking ? 1.0 : 0.5 + Math.sin(tf * 0.15) * 0.3;

  // Mist particles — rising from shoulders/shield
  const mist1Y = 4 - ((tf * 0.15) % 14);
  const mist1X = -2 + Math.sin(tf * 0.06) * 1.5;
  const mist1O = Math.max(0, 0.3 - ((tf * 0.15) % 14) / 14 * 0.3);
  const mist2Y = 2 - ((tf * 0.12 + 5) % 16);
  const mist2X = 28 + Math.sin(tf * 0.07 + 2) * 1.5;
  const mist2O = Math.max(0, 0.25 - ((tf * 0.12 + 5) % 16) / 16 * 0.25);
  const mist3Y = 6 - ((tf * 0.1 + 9) % 12);
  const mist3X = 6 + Math.sin(tf * 0.09 + 4) * 1;
  const mist3O = Math.max(0, 0.2 - ((tf * 0.1 + 9) % 12) / 12 * 0.2);

  // CSS animation desync based on position
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  // Named color constants
  const steelDark = '#3a3a4a';
  const steelMid = '#4e4e5e';
  const steelLight = '#626272';
  const steelHighlight = '#7a7a8e';
  const steelDeep = '#2a2a38';
  const corruptPurple = '#9944cc';
  const corruptMagenta = '#cc44aa';
  const corruptGlow = '#aa55dd';
  const eyePurple = '#bb66ff';
  const eyeCore = '#eeccff';
  const visorDark = '#0a0a14';
  const rivetColor = '#555566';

  // Center around x=14, width ~28, height ~36
  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
    <g className="sprite-idle" style={delayStyle}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={14} cy={14} r={24} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={14} y={-20} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === SHADOW (large for tank) === */}
      <ellipse cx={14} cy={38} rx={14} ry={4} fill="rgba(40,20,60,0.35)" />

      {/* === LEGS — heavy armored greaves === */}
      {/* Left leg */}
      <rect x={7} y={28} width={6} height={10} fill={steelDark} rx={1} />
      <rect x={7.5} y={28.5} width={5} height={9} fill={steelMid} rx={0.5} />
      {/* Left knee plate */}
      <rect x={6.5} y={28} width={7} height={3.5} fill={steelDark} rx={1} />
      <line x1={7} y1={29.5} x2={13} y2={29.5} stroke={steelHighlight} strokeWidth={0.5} opacity={0.4} />
      {/* Left boot */}
      <rect x={6.5} y={35} width={7} height={3} fill={steelDeep} rx={1} />
      <line x1={7} y1={35.5} x2={13} y2={35.5} stroke={steelHighlight} strokeWidth={0.4} opacity={0.3} />

      {/* Right leg */}
      <rect x={15} y={28} width={6} height={10} fill={steelDark} rx={1} />
      <rect x={15.5} y={28.5} width={5} height={9} fill={steelMid} rx={0.5} />
      {/* Right knee plate */}
      <rect x={14.5} y={28} width={7} height={3.5} fill={steelDark} rx={1} />
      <line x1={15} y1={29.5} x2={21} y2={29.5} stroke={steelHighlight} strokeWidth={0.5} opacity={0.4} />
      {/* Right boot */}
      <rect x={14.5} y={35} width={7} height={3} fill={steelDeep} rx={1} />
      <line x1={15} y1={35.5} x2={21} y2={35.5} stroke={steelHighlight} strokeWidth={0.4} opacity={0.3} />

      {/* Leg corruption vein */}
      <line x1={10} y1={30} x2={9.5} y2={36} stroke={corruptPurple} strokeWidth={0.6} opacity={0.25 + pulse3 * 0.3} />
      <line x1={18} y1={31} x2={18.5} y2={35} stroke={corruptMagenta} strokeWidth={0.5} opacity={0.2 + pulse4 * 0.25} />

      {/* === TOWER SHIELD (left side — slams forward during attack) === */}
      <g className={isAttacking ? undefined : "sprite-shield-arm"} transform={isAttacking ? `translate(${shieldSlam}, 0)` : undefined}>
        {/* Shield body — large rectangular */}
        <rect x={-4} y={6} width={10} height={22} fill={steelDark} rx={1.5} />
        {/* Shield mid layer */}
        <rect x={-3} y={7} width={8} height={20} fill={steelMid} rx={1} />
        {/* Shield inner panel */}
        <rect x={-2} y={8} width={6} height={18} fill={steelDeep} rx={0.5} />

        {/* Shield edge highlights */}
        <line x1={-4} y1={7} x2={-4} y2={27} stroke={steelHighlight} strokeWidth={0.6} opacity={0.4} />
        <line x1={6} y1={7} x2={6} y2={27} stroke={steelHighlight} strokeWidth={0.4} opacity={0.25} />
        <line x1={-3} y1={6.5} x2={5} y2={6.5} stroke={steelHighlight} strokeWidth={0.5} opacity={0.35} />
        <line x1={-3} y1={27.5} x2={5} y2={27.5} stroke={steelHighlight} strokeWidth={0.4} opacity={0.2} />

        {/* Shield boss (center circle) */}
        <circle cx={1} cy={17} r={3} fill={steelDark} stroke={steelHighlight} strokeWidth={0.6} />
        <circle cx={1} cy={17} r={1.8} fill={steelDeep} />
        <circle cx={1} cy={17} r={1} fill={corruptGlow} opacity={0.3 + pulse1 * 0.4} />

        {/* Shield corruption vein — central crack */}
        <path d="M1,8 Q0.5,12 1.5,17 Q0.5,22 1,26" stroke={corruptPurple} strokeWidth={0.8} fill="none" opacity={0.35 + pulse2 * 0.35} />
        {/* Branch cracks */}
        <path d="M1.5,12 L3,10" stroke={corruptMagenta} strokeWidth={0.5} fill="none" opacity={0.2 + pulse2 * 0.2} />
        <path d="M0.5,21 L-1.5,23" stroke={corruptMagenta} strokeWidth={0.5} fill="none" opacity={0.2 + pulse3 * 0.2} />

        {/* Shield rivets */}
        <circle cx={-2} cy={9} r={0.6} fill={rivetColor} />
        <circle cx={4} cy={9} r={0.6} fill={rivetColor} />
        <circle cx={-2} cy={25} r={0.6} fill={rivetColor} />
        <circle cx={4} cy={25} r={0.6} fill={rivetColor} />
      </g>

      {/* === TORSO — MASSIVE plate armor (leans during attack, shifts weight idle) === */}
      <g transform={`translate(${bodyLean + weightShift}, ${-Math.abs(breathe) * 0.3})`}>
      {/* Outer plate */}
      <path d="M4,8 L3,12 L3,24 L6,28 L22,28 L25,24 L25,12 L24,8 Q20,5 14,4 Q8,5 4,8 Z"
        fill={steelDark} />
      {/* Mid plate */}
      <path d="M5.5,9 L5,13 L5,23 L7,27 L21,27 L23,23 L23,13 L22.5,9 Q19,6.5 14,5.5 Q9,6.5 5.5,9 Z"
        fill={steelMid} />
      {/* Inner dark layer */}
      <path d="M7,10 L7,14 L7,22 L8.5,26 L19.5,26 L21,22 L21,14 L21,10 Q18,8 14,7 Q10,8 7,10 Z"
        fill={steelDeep} opacity={0.7} />

      {/* Chest plate center ridge */}
      <line x1={14} y1={8} x2={14} y2={26} stroke={steelHighlight} strokeWidth={0.7} opacity={0.3} />
      {/* Horizontal plate lines */}
      <line x1={6} y1={14} x2={22} y2={14} stroke={steelHighlight} strokeWidth={0.5} opacity={0.2} />
      <line x1={5} y1={20} x2={23} y2={20} stroke={steelHighlight} strokeWidth={0.5} opacity={0.2} />

      {/* Torso rivets — along armor edges */}
      <circle cx={6} cy={10} r={0.5} fill={rivetColor} />
      <circle cx={22} cy={10} r={0.5} fill={rivetColor} />
      <circle cx={5} cy={16} r={0.5} fill={rivetColor} />
      <circle cx={23} cy={16} r={0.5} fill={rivetColor} />
      <circle cx={5.5} cy={22} r={0.5} fill={rivetColor} />
      <circle cx={22.5} cy={22} r={0.5} fill={rivetColor} />
      <circle cx={7} cy={27} r={0.5} fill={rivetColor} />
      <circle cx={21} cy={27} r={0.5} fill={rivetColor} />
      {/* Mid rivets */}
      <circle cx={10} cy={8} r={0.4} fill={rivetColor} />
      <circle cx={18} cy={8} r={0.4} fill={rivetColor} />

      {/* Corruption veins across chest plate */}
      <path d={`M7,12 Q10,${14 + pulse1 * 0.5} 14,13 Q18,${12 - pulse1 * 0.5} 21,14`}
        stroke={corruptPurple} strokeWidth={0.7} fill="none" opacity={0.3 + pulse1 * 0.35} />
      <path d={`M8,19 Q11,${20 + pulse2 * 0.4} 14,20 Q17,${19 - pulse2 * 0.4} 20,21`}
        stroke={corruptMagenta} strokeWidth={0.6} fill="none" opacity={0.25 + pulse2 * 0.3} />
      <path d={`M10,24 Q12,${23 - pulse3 * 0.3} 14,24 Q16,${25 + pulse3 * 0.3} 18,23`}
        stroke={corruptPurple} strokeWidth={0.5} fill="none" opacity={0.2 + pulse3 * 0.25} />
      {/* Branching crack from main veins */}
      <path d="M14,13 L15,17 L13,20" stroke={corruptGlow} strokeWidth={0.4} fill="none" opacity={0.15 + pulse1 * 0.15} />

      {/* === PAULDRONS — large curved shoulder plates === */}
      {/* Left pauldron */}
      <path d="M0,6 Q1,3 4,4 L7,6 L6,10 L3,11 Q0,10 0,6 Z" fill={steelDark} />
      <path d="M1,6.5 Q2,4 4.5,5 L6,7 L5.5,9.5 L3.5,10 Q1.5,9 1,6.5 Z" fill={steelMid} />
      {/* Left pauldron edge highlight */}
      <path d="M0.5,6 Q1.5,3.5 4,4.5" stroke={steelHighlight} strokeWidth={0.6} fill="none" opacity={0.4} />
      {/* Left pauldron spike/ridge */}
      <polygon points="1,4 2,1.5 3,4" fill={steelDark} stroke={steelHighlight} strokeWidth={0.3} />
      <polygon points="4,3.5 5,1 6,4" fill={steelDark} stroke={steelHighlight} strokeWidth={0.3} />
      {/* Left pauldron rivet */}
      <circle cx={3.5} cy={7} r={0.5} fill={rivetColor} />

      {/* Right pauldron */}
      <path d="M28,6 Q27,3 24,4 L21,6 L22,10 L25,11 Q28,10 28,6 Z" fill={steelDark} />
      <path d="M27,6.5 Q26,4 23.5,5 L22,7 L22.5,9.5 L24.5,10 Q26.5,9 27,6.5 Z" fill={steelMid} />
      {/* Right pauldron edge highlight */}
      <path d="M27.5,6 Q26.5,3.5 24,4.5" stroke={steelHighlight} strokeWidth={0.6} fill="none" opacity={0.4} />
      {/* Right pauldron spikes */}
      <polygon points="25,4 26,1.5 27,4" fill={steelDark} stroke={steelHighlight} strokeWidth={0.3} />
      <polygon points="22,3.5 23,1 24,4" fill={steelDark} stroke={steelHighlight} strokeWidth={0.3} />
      {/* Right pauldron rivet */}
      <circle cx={24.5} cy={7} r={0.5} fill={rivetColor} />

      {/* === HELMET — wide bucket helm === */}
      {/* Main helm shape */}
      <path d="M5,0 L4,-2 L5,-5 L8,-8 L14,-10 L20,-8 L23,-5 L24,-2 L23,0 L22,3 L20,4 L14,5 L8,4 L6,3 Z"
        fill={steelDark} />
      {/* Helm mid layer */}
      <path d="M6.5,-0.5 L6,-2 L7,-5 L9.5,-7 L14,-8.5 L18.5,-7 L21,-5 L22,-2 L21.5,-0.5 L20.5,2.5 L19,3.5 L14,4 L9,3.5 L7.5,2.5 Z"
        fill={steelMid} />
      {/* Helm top band */}
      <rect x={6} y={-6} width={16} height={2} fill={steelDark} rx={0.5} />
      <line x1={6.5} y1={-5} x2={21.5} y2={-5} stroke={steelHighlight} strokeWidth={0.5} opacity={0.3} />

      {/* Visor slit — narrow horizontal */}
      <rect x={7} y={-1} width={14} height={2.5} fill={visorDark} rx={0.5} />
      {/* Visor edge */}
      <line x1={7} y1={-1} x2={21} y2={-1} stroke={steelHighlight} strokeWidth={0.4} opacity={0.3} />
      <line x1={7} y1={1.5} x2={21} y2={1.5} stroke={steelHighlight} strokeWidth={0.4} opacity={0.2} />

      {/* Glowing purple eyes behind visor — flicker */}
      <ellipse cx={10.5} cy={0.2} rx={2} ry={0.9} fill={eyePurple} opacity={eyeFlicker * (0.5 + pulse1 * 0.4)} />
      <ellipse cx={17.5} cy={0.2} rx={2} ry={0.9} fill={eyePurple} opacity={eyeFlicker * (0.5 + pulse1 * 0.4)} />
      <ellipse cx={10.5} cy={0.2} rx={1} ry={0.5} fill={eyeCore} opacity={eyeFlicker * (0.7 + pulse1 * 0.3)} />
      <ellipse cx={17.5} cy={0.2} rx={1} ry={0.5} fill={eyeCore} opacity={eyeFlicker * (0.7 + pulse1 * 0.3)} />
      {/* Eye glow bleeding outside visor */}
      <ellipse cx={10.5} cy={0.2} rx={3} ry={1.8} fill={corruptGlow} opacity={eyeFlicker * (0.06 + pulse1 * 0.06)} />
      <ellipse cx={17.5} cy={0.2} rx={3} ry={1.8} fill={corruptGlow} opacity={eyeFlicker * (0.06 + pulse1 * 0.06)} />

      {/* Angular jaw guard */}
      <path d="M7,2 L6,4 L8,5 L14,6 L20,5 L22,4 L21,2" fill={steelDark} />
      <line x1={7} y1={3} x2={21} y2={3} stroke={steelHighlight} strokeWidth={0.4} opacity={0.2} />
      {/* Jaw guard rivets */}
      <circle cx={9} cy={4} r={0.4} fill={rivetColor} />
      <circle cx={19} cy={4} r={0.4} fill={rivetColor} />

      {/* Helmet scratches/dents */}
      <line x1={8} y1={-7} x2={10} y2={-4} stroke={steelLight} strokeWidth={0.3} opacity={0.3} />
      <line x1={17} y1={-8} x2={19} y2={-5} stroke={steelLight} strokeWidth={0.3} opacity={0.25} />
      <line x1={12} y1={-3} x2={14} y2={-1.5} stroke={steelLight} strokeWidth={0.25} opacity={0.2} />
      {/* Dent on helmet */}
      <ellipse cx={18} cy={-3} rx={1.2} ry={0.8} fill={steelDeep} opacity={0.3} />

      {/* Helmet center crest */}
      <line x1={14} y1={-10} x2={14} y2={-5} stroke={steelHighlight} strokeWidth={0.8} opacity={0.3} />

      {/* === RIGHT ARM (visible side) === */}
      {/* Upper arm armor */}
      <path d="M23,8 L26,10 L27,14 L26,18 L24,19 L22,16 L22,10 Z" fill={steelDark} />
      <path d="M23.5,9 L25.5,10.5 L26,14 L25,17 L23.5,18 L22.5,15 L22.5,10.5 Z" fill={steelMid} />
      {/* Elbow joint */}
      <circle cx={25} cy={18} r={2} fill={steelDark} />
      <circle cx={25} cy={18} r={1.2} fill={steelDeep} />
      {/* Forearm armor */}
      <rect x={23} y={19} width={4.5} height={8} fill={steelDark} rx={1} />
      <rect x={23.5} y={19.5} width={3.5} height={7} fill={steelMid} rx={0.5} />
      {/* Gauntlet */}
      <rect x={22.5} y={25} width={5.5} height={3} fill={steelDeep} rx={1} />
      <line x1={23} y1={26} x2={27.5} y2={26} stroke={steelHighlight} strokeWidth={0.4} opacity={0.25} />
      {/* Arm corruption vein */}
      <line x1={24} y1={11} x2={25} y2={17} stroke={corruptPurple} strokeWidth={0.5} opacity={0.2 + pulse4 * 0.25} />
      </g>{/* close torso lean group */}

      {/* === CORRUPTION MIST PARTICLES === */}
      <circle cx={mist1X} cy={mist1Y} r={1.5} fill={corruptGlow} opacity={mist1O} />
      <circle cx={mist2X} cy={mist2Y} r={1.2} fill={corruptPurple} opacity={mist2O} />
      <circle cx={mist3X} cy={mist3Y} r={1} fill={corruptMagenta} opacity={mist3O} />

      {/* === SHIELD SLAM IMPACT === */}
      {isAttacking && attackPhase < 0.2 && (
        <>
          <circle cx={-4 + shieldSlam} cy={17} r={8} fill={corruptGlow} opacity={0.2 * (1 - attackPhase * 5)} />
          <circle cx={-4 + shieldSlam} cy={17} r={4} fill={corruptMagenta} opacity={0.15 * (1 - attackPhase * 5)} />
          {/* Ground crack lines */}
          <line x1={-8 + shieldSlam} y1={28} x2={-12 + shieldSlam} y2={30} stroke={corruptPurple} strokeWidth={1.5} opacity={0.3 * (1 - attackPhase * 5)} />
          <line x1={-6 + shieldSlam} y1={28} x2={-10 + shieldSlam} y2={32} stroke={corruptPurple} strokeWidth={1} opacity={0.2 * (1 - attackPhase * 5)} />
          <line x1={-4 + shieldSlam} y1={29} x2={-7 + shieldSlam} y2={33} stroke={corruptMagenta} strokeWidth={0.8} opacity={0.15 * (1 - attackPhase * 5)} />
          {/* Ground tremor wave */}
          <ellipse cx={-4 + shieldSlam} cy={38} rx={16 * (1 - attackPhase * 5)} ry={2} fill="none" stroke={corruptGlow} strokeWidth={1.2} opacity={0.2 * (1 - attackPhase * 5)} />
        </>
      )}

      {/* === HIT FLASH === */}
      {recentlyHit && (
        <rect x={-5} y={-12} width={38} height={52} fill="#cc2266" opacity={0.15} rx={3} />
      )}

      {/* === HEALTH BAR (wider for tank, purple-ish) === */}
      <rect x={-2} y={-14} width={32} height={4} fill="#333" rx={1} />
      <rect x={-2} y={-14} width={Math.max(0, 32 * (health / maxHealth))} height={4} fill="#8866aa" rx={1} />
      {showHpNumbers && (
        <text x={14} y={-16} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
    </g>
  );
}

export default memo(DetailedCorruptedSentinel, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAtk = (prev.attackCooldown ?? 99) < 12;
  const nextAtk = (next.attackCooldown ?? 99) < 12;
  if (prevAtk !== nextAtk) return false;
  if (prevAtk && prev.attackCooldown !== next.attackCooldown) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
