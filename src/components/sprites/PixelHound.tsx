import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  lungeTimer?: number;
  recoveryTimer?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

export default function PixelHound({ x, y, health, maxHealth, frame, lungeTimer = 0, recoveryTimer = 0, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const isLunging = lungeTimer > 0;
  const isRecovering = recoveryTimer > 0;
  // Damage flash
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  // Running leg animation (fast cycle)
  const legPhase = Math.sin(frame * 0.4) * 4;
  const legPhase2 = Math.sin(frame * 0.4 + Math.PI) * 4;
  // Panting during recovery
  const pantOffset = isRecovering ? Math.sin(frame * 0.3) * 1.5 : 0;
  // Lunge stretch effect
  const scaleX = isLunging ? 1.3 : 1;
  const scaleY = isLunging ? 0.8 : 1;
  // Eye glow
  const eyeGlow = isLunging ? '#ff2200' : '#ff6600';
  const eyeSize = isLunging ? 3 : 2.5;
  // Body color
  const bodyColor = hitFlash ? '#5a3030' : '#2a1a1a';
  const bodyStroke = hitFlash ? '#aa6644' : '#4a2a2a';

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {isElite && eliteGlow && (
        <circle cx={12} cy={10} r={16} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Shadow */}
      <ellipse cx={12} cy={22} rx={isLunging ? 16 : 12} ry={4} fill="rgba(100,40,0,0.4)" />
      <g transform={`scale(${scaleX}, ${scaleY})`} style={{ transformOrigin: '12px 12px' }}>
        {/* Lunge invulnerability glow */}
        {isLunging && (
          <ellipse cx={12} cy={12} rx={18} ry={14} fill="#ff4400" opacity={0.15 + Math.sin(frame * 0.6) * 0.08} />
        )}
        {/* Back legs */}
        <line x1={18} y1={16} x2={20 + (isRecovering ? 0 : legPhase2)} y2={22} stroke={bodyStroke} strokeWidth="2.5" strokeLinecap="round" />
        <line x1={16} y1={16} x2={18 + (isRecovering ? 0 : legPhase)} y2={22} stroke={bodyStroke} strokeWidth="2.5" strokeLinecap="round" />
        {/* Front legs */}
        <line x1={6} y1={16} x2={4 + (isRecovering ? 0 : legPhase)} y2={22} stroke={bodyStroke} strokeWidth="2.5" strokeLinecap="round" />
        <line x1={8} y1={16} x2={6 + (isRecovering ? 0 : legPhase2)} y2={22} stroke={bodyStroke} strokeWidth="2.5" strokeLinecap="round" />
        {/* Body */}
        <ellipse cx={12} cy={12} rx={10} ry={7} fill={bodyColor} stroke={bodyStroke} strokeWidth="1" />
        {/* Head */}
        <ellipse cx={3} cy={9 + pantOffset} rx={5} ry={4.5} fill={bodyColor} stroke={bodyStroke} strokeWidth="1" />
        {/* Snout */}
        <ellipse cx={-1} cy={10 + pantOffset} rx={3} ry={2.5} fill={hitFlash ? '#4a2828' : '#1a0e0e'} />
        {/* Eyes - glowing */}
        <circle cx={2} cy={7 + pantOffset} r={eyeSize} fill={eyeGlow} opacity={0.9} />
        <circle cx={2} cy={7 + pantOffset} r={1} fill="#fff" />
        {/* Ears (pointed) */}
        <polygon points={`1,${4 + pantOffset} 4,${1 + pantOffset} 5,${5 + pantOffset}`} fill={bodyColor} stroke={bodyStroke} strokeWidth="0.5" />
        {/* Tail */}
        <path d={`M22,10 Q${26 + Math.sin(frame * 0.2) * 3},${6} ${24 + Math.sin(frame * 0.15) * 2},${3}`}
          stroke={bodyStroke} strokeWidth="2" fill="none" />
        {/* Recovery panting indicator */}
        {isRecovering && frame % 20 < 10 && (
          <text x={-3} y={16 + pantOffset} fontSize="7" fill="#aaa" opacity={0.7}>💨</text>
        )}
        {/* Speed blur during lunge */}
        {isLunging && (
          <>
            <line x1={24} y1={8} x2={32} y2={8} stroke="#ff4400" strokeWidth="1" opacity={0.5} />
            <line x1={24} y1={12} x2={34} y2={12} stroke="#ff4400" strokeWidth="1" opacity={0.4} />
            <line x1={24} y1={16} x2={30} y2={16} stroke="#ff4400" strokeWidth="1" opacity={0.3} />
          </>
        )}
      </g>
      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-2} y={0} width={28} height={22} fill="#ff0000" opacity={0.2} rx={3} />
      )}
      {/* Health bar */}
      <rect x={0} y={-6} width={24} height={3} fill="#333" rx={1} />
      <rect x={0} y={-6} width={24 * (health / maxHealth)} height={3} fill="#cc4400" rx={1} />
      {showHpNumbers && (
        <text x={12} y={-8} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
