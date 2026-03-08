import { memo } from 'react';
import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';
import './sprite-animations.css';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  stealthTimer: number;
  visibleTimer: number;
  attackCooldown?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

function DetailedShadowAssassin({ x, y, health, maxHealth, frame, stealthTimer, visibleTimer, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const isCloaked = stealthTimer > 0;
  const isAttacking = attackCooldown < 8;
  const attackPhase = isAttacking ? attackCooldown / 8 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  // Throttled frame for JS anims
  const tf = Math.floor(frame / 3) * 3;

  // Stealth opacity — shimmer effect when cloaked
  const opacity = isCloaked ? 0.15 + Math.sin(tf * 0.08) * 0.05 : 1;
  // Uncloaking flash — brief bright flash when going visible
  const justUncloaked = !isCloaked && visibleTimer > 175; // first ~5 frames of being visible (180 total)

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Colors
  const cloakDark = hitFlash ? '#3a1a4a' : '#0e0418';
  const cloakMid = hitFlash ? '#4a2a5a' : '#1a0a2e';
  const cloakLight = hitFlash ? '#5a3a6a' : '#2a1040';
  const skinDark = '#2a1a2a';
  const eyeColor = '#cc44ff';
  const eyeCore = '#ff88ff';
  const blade = '#c0c0c8';
  const bladeEdge = '#e8e8f0';
  const wrap = '#3a2a40';

  // Dagger slash angle
  const slashAngle = isAttacking ? -40 + (1 - attackPhase) * 80 : 15;

  // Breathing — subtle body pulse
  const breathe = Math.sin(tf * 0.05) * 0.4;

  // Idle knife fidget — small wrist rotation when not attacking
  const knifeFidget = isAttacking ? 0 : Math.sin(tf * 0.07) * 4;

  // Shadow drip particles — falling from cloak
  const drip1Y = ((tf * 0.2) % 18);
  const drip2Y = ((tf * 0.2 + 7) % 18);
  const drip3Y = ((tf * 0.2 + 13) % 18);

  // Cloak edge flutter
  const cloakFlutter = Math.sin(tf * 0.06) * 1;

  // CSS desync
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`} opacity={opacity}>
    <g className="sprite-idle" style={delayStyle}>

      {/* Elite */}
      {isElite && eliteGlow && (
        <circle cx={12} cy={12} r={18} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* Shadow */}
      <ellipse cx={12} cy={27} rx={isCloaked ? 6 : 9} ry={isCloaked ? 2 : 3} fill="rgba(80,0,120,0.35)" />

      {/* Uncloak flash */}
      {justUncloaked && (
        <circle cx={12} cy={12} r={16} fill="#cc44ff" opacity={0.2} />
      )}

      {/* === LEGS — wrapped in cloth bindings === */}
      <rect x={7} y={21} width={3} height={6} fill={cloakDark} rx={0.5} />
      <rect x={14} y={21} width={3} height={6} fill={cloakDark} rx={0.5} />
      {/* Leg wraps */}
      <line x1={7} y1={22} x2={10} y2={22.5} stroke={wrap} strokeWidth="0.6" opacity={0.5} />
      <line x1={7} y1={24} x2={10} y2={24.5} stroke={wrap} strokeWidth="0.6" opacity={0.5} />
      <line x1={14} y1={23} x2={17} y2={23.5} stroke={wrap} strokeWidth="0.6" opacity={0.5} />
      <line x1={14} y1={25} x2={17} y2={25.5} stroke={wrap} strokeWidth="0.6" opacity={0.5} />
      {/* Feet/tabi */}
      <path d="M6,26 L8,27 L10,26" fill={skinDark} />
      <path d="M14,26 L16,27 L18,26" fill={skinDark} />

      {/* === BODY — lean, angular torso under cloak (breathing) === */}
      {/* Inner body — dark tight-fitting garment */}
      <path d={`M7,${10 - breathe * 0.3} L8,22 L16,22 L17,${10 - breathe * 0.3} Q14,8 12,8 Q10,8 7,${10 - breathe * 0.3}`}
        fill={skinDark} />

      {/* === CLOAK — flowing, angular, wraps around body === */}
      {/* Back cloak panel */}
      <path d="M4,7 L3,22 L6,24 L8,22 L7,8 Q9,6 12,5 L4,7"
        fill={cloakDark} />
      <path d="M20,7 L21,22 L18,24 L16,22 L17,8 Q15,6 12,5 L20,7"
        fill={cloakDark} />

      {/* Front cloak — open in center, angular edges (flutter) */}
      <path d={`M5,8 L${4 - cloakFlutter},20 L${7 - cloakFlutter * 0.5},22 L9,14 L9,10 Z`}
        fill={cloakMid} />
      <path d={`M19,8 L${20 + cloakFlutter},20 L${17 + cloakFlutter * 0.5},22 L15,14 L15,10 Z`}
        fill={cloakMid} />
      {/* Cloak collar — high, stiff */}
      <path d="M5,8 Q8,5 12,4 Q16,5 19,8 L17,10 Q14,7 12,7 Q10,7 7,10 Z"
        fill={cloakLight} />

      {/* Chest wrap / belt */}
      <line x1={8} y1={15} x2={16} y2={15} stroke={wrap} strokeWidth="1" opacity={0.6} />
      <line x1={8} y1={17} x2={16} y2={17} stroke={wrap} strokeWidth="0.8" opacity={0.4} />
      {/* Belt buckle / clasp */}
      <rect x={11} y={14.5} width={2} height={1.5} fill="#555" rx={0.3} />

      {/* === HOOD — angular, ninja-style mask underneath === */}
      <path d="M4,9 Q4,1 12,-1 Q20,1 20,9 Q18,13 15,12 Q12,13 9,12 Q6,13 4,9"
        fill={cloakMid} stroke={cloakDark} strokeWidth="0.5" />
      {/* Hood inner shadow */}
      <path d="M6,8 Q6,3 12,1 Q18,3 18,8 Q16,11 12,10 Q8,11 6,8"
        fill={cloakDark} opacity={0.7} />

      {/* Face mask — lower face covered */}
      <rect x={7} y={7} width={10} height={4} fill={skinDark} rx={1} />
      {/* Mask wrapping lines */}
      <line x1={7} y1={8} x2={17} y2={8} stroke={wrap} strokeWidth="0.5" opacity={0.4} />
      <line x1={7} y1={9.5} x2={17} y2={9.5} stroke={wrap} strokeWidth="0.4" opacity={0.3} />

      {/* Eyes — narrow, glowing slits */}
      <ellipse cx={9} cy={5.5} rx={2} ry={1} fill="#111" />
      <ellipse cx={15} cy={5.5} rx={2} ry={1} fill="#111" />
      <ellipse cx={9} cy={5.5} rx={1.5} ry={0.7} fill={eyeColor} opacity={isCloaked ? 0.4 : 0.85} />
      <ellipse cx={15} cy={5.5} rx={1.5} ry={0.7} fill={eyeColor} opacity={isCloaked ? 0.4 : 0.85} />
      {/* Eye highlights */}
      <circle cx={8.3} cy={5.2} r={0.4} fill={eyeCore} opacity={0.6} />
      <circle cx={14.3} cy={5.2} r={0.4} fill={eyeCore} opacity={0.6} />
      {/* Eye glow haze */}
      {!isCloaked && (
        <>
          <ellipse cx={9} cy={5.5} rx={3} ry={1.5} fill={eyeColor} opacity={0.06} />
          <ellipse cx={15} cy={5.5} rx={3} ry={1.5} fill={eyeColor} opacity={0.06} />
        </>
      )}

      {/* === DAGGER ARM (left — attack side, fidgets when idle) === */}
      <g transform={`translate(3, 14) rotate(${slashAngle + knifeFidget}, 0, 0)`}>
        {/* Forearm */}
        <line x1={0} y1={0} x2={-5} y2={4} stroke={skinDark} strokeWidth="2" strokeLinecap="round" />
        {/* Dagger handle */}
        <rect x={-7} y={3} width={3} height={1.5} fill="#4a3a3a" rx={0.3} />
        {/* Dagger guard */}
        <rect x={-8} y={3.5} width={5} height={0.8} fill="#666" rx={0.2} />
        {/* Blade */}
        <path d="M-8,3 L-14,4 L-8,5" fill={blade} stroke={bladeEdge} strokeWidth="0.3" />
        {/* Blade edge gleam */}
        <line x1={-9} y1={3.8} x2={-13} y2={4} stroke="#fff" strokeWidth="0.3" opacity={0.4} />
      </g>

      {/* === OFF-HAND — small kunai/shuriken pouch visible === */}
      <g>
        <line x1={20} y1={14} x2={22} y2={18} stroke={skinDark} strokeWidth="1.5" strokeLinecap="round" />
        {/* Small pouch on belt */}
        <rect x={17} y={16} width={2.5} height={2} fill="#2a1a2a" rx={0.5} stroke={wrap} strokeWidth="0.3" />
      </g>

      {/* === ATTACK SLASH TRAIL === */}
      {isAttacking && attackPhase < 0.4 && (
        <>
          <path d={`M0,10 Q-6,14 -2,20`} stroke={eyeColor} strokeWidth="1.5" fill="none" opacity={0.4} />
          <path d={`M-1,12 Q-8,15 -4,22`} stroke="#fff" strokeWidth="0.5" fill="none" opacity={0.25} />
        </>
      )}

      {/* === SHADOW DRIP PARTICLES — falling from cloak edges === */}
      <circle cx={4 + Math.sin(tf * 0.05) * 1} cy={22 + drip1Y} r={0.6} fill="#1a0a2e" opacity={Math.max(0, 0.3 - drip1Y / 18 * 0.3)} />
      <circle cx={20 + Math.sin(tf * 0.06 + 1) * 1} cy={22 + drip2Y} r={0.5} fill="#2a1040" opacity={Math.max(0, 0.25 - drip2Y / 18 * 0.25)} />
      <circle cx={12 + Math.sin(tf * 0.04 + 2) * 0.5} cy={22 + drip3Y} r={0.4} fill="#1a0a2e" opacity={Math.max(0, 0.2 - drip3Y / 18 * 0.2)} />

      {/* === STEALTH PARTICLES — wisps of shadow === */}
      {isCloaked && (
        <>
          <circle cx={4 + Math.sin(tf * 0.12) * 5} cy={4 + Math.cos(tf * 0.15) * 4} r={1} fill={eyeColor} opacity={0.15} />
          <circle cx={20 + Math.cos(tf * 0.1) * 4} cy={8 + Math.sin(tf * 0.13) * 5} r={0.8} fill={eyeColor} opacity={0.12} />
          <circle cx={12 + Math.sin(tf * 0.09 + 2) * 6} cy={2 + Math.cos(tf * 0.11 + 1) * 3} r={0.6} fill="#8844aa" opacity={0.1} />
        </>
      )}

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-2} y={-2} width={28} height={30} fill="#ff00ff" opacity={0.12} rx={2} />
      )}

      {/* Health bar — only when visible */}
      {!isCloaked && (
        <>
          <rect x={0} y={-8} width={24} height={4} fill="#333" rx={1} />
          <rect x={0} y={-8} width={24 * (health / maxHealth)} height={4} fill="#aa44ff" rx={1} />
          {showHpNumbers && (
            <text x={12} y={-10} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
              {health}/{maxHealth}
            </text>
          )}
        </>
      )}
    </g>
    </g>
  );
}

export default memo(DetailedShadowAssassin, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.stealthTimer !== next.stealthTimer) return false;
  if (prev.visibleTimer !== next.visibleTimer) return false;
  const prevAttacking = (prev.attackCooldown ?? 99) < 8;
  const nextAttacking = (next.attackCooldown ?? 99) < 8;
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
