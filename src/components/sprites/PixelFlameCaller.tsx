import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

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

export default function PixelFlameCaller({ x, y, health, maxHealth, frame, isCasting, castTimer, castTargetX, castTargetY, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const bobOffset = Math.sin(frame * 0.08) * 1.5;
  const castProgress = isCasting ? castTimer / 270 : 0; // 0 to 1

  const eliteGlowColor = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Meteor position: falls from sky as cast progresses
  const meteorRelX = castTargetX - x;
  const meteorLandY = 30; // Land at foot level (relative to sprite origin)
  const meteorStartY = meteorLandY - 250;
  const meteorCurrentY = meteorStartY + (meteorLandY - meteorStartY) * castProgress;

  return (
    <g transform={`translate(${x}, ${y + bobOffset})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {isElite && eliteGlowColor && (
        <circle cx={12} cy={14} r={18} fill={eliteGlowColor} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}

      {eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlowColor || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* Ambient heat shimmer */}
      <circle cx={12} cy={14} r={16 + Math.sin(frame * 0.12) * 2} fill="#ff4400" opacity={0.04 + Math.sin(frame * 0.08) * 0.02} />

      {/* Shadow */}
      <ellipse cx={12} cy={30} rx={10} ry={3} fill="rgba(180,60,0,0.5)" />

      {/* Robe - dark volcanic with glowing trim */}
      <path d="M3,12 L12,3 L21,12 L23,28 L1,28 Z" fill={hitFlash ? '#6a2a10' : '#2a0800'} stroke="#4a1a0a" strokeWidth="0.8" />
      {/* Lava cracks on robe */}
      <line x1={7} y1={16} x2={9} y2={24} stroke="#ff4400" strokeWidth="0.8" opacity={0.4 + Math.sin(frame * 0.06) * 0.2} />
      <line x1={17} y1={14} x2={15} y2={22} stroke="#ff6600" strokeWidth="0.8" opacity={0.3 + Math.sin(frame * 0.07 + 1) * 0.2} />
      <line x1={11} y1={18} x2={13} y2={26} stroke="#ff4400" strokeWidth="0.6" opacity={0.3 + Math.sin(frame * 0.09 + 2) * 0.15} />

      {/* Hood - deep crimson */}
      <path d="M4,13 Q12,1 20,13 L18,17 L6,17 Z" fill={hitFlash ? '#5a2010' : '#1a0500'} stroke="#4a1a0a" strokeWidth="0.5" />
      {/* Hood horns */}
      <line x1={5} y1={8} x2={3} y2={3} stroke="#3a1a0a" strokeWidth="2" strokeLinecap="round" />
      <line x1={19} y1={8} x2={21} y2={3} stroke="#3a1a0a" strokeWidth="2" strokeLinecap="round" />
      <circle cx={3} cy={3} r={1.5} fill="#ff4400" opacity={0.5 + Math.sin(frame * 0.15) * 0.3} />
      <circle cx={21} cy={3} r={1.5} fill="#ff4400" opacity={0.5 + Math.sin(frame * 0.15 + 1) * 0.3} />

      {/* Eyes - burning embers */}
      <circle cx={8} cy={12} r={2.5} fill="#ff2200" opacity={0.9} />
      <circle cx={8} cy={12} r={1.5} fill="#ffcc00" opacity={isCasting ? 1 : 0.7} />
      <circle cx={8} cy={12} r={0.7} fill="#ffffff" opacity={isCasting ? 0.9 : 0.4} />
      <circle cx={16} cy={12} r={2.5} fill="#ff2200" opacity={0.9} />
      <circle cx={16} cy={12} r={1.5} fill="#ffcc00" opacity={isCasting ? 1 : 0.7} />
      <circle cx={16} cy={12} r={0.7} fill="#ffffff" opacity={isCasting ? 0.9 : 0.4} />

      {/* Staff - gnarled with ember top */}
      <line x1={-3} y1={5} x2={-3} y2={28} stroke="#3a1a08" strokeWidth="3" strokeLinecap="round" />
      <line x1={-3} y1={5} x2={-3} y2={28} stroke="#5a2a10" strokeWidth="2" strokeLinecap="round" />
      {/* Staff ember crown */}
      <circle cx={-3} cy={3} r={4} fill="#ff4400" opacity={isCasting ? 0.9 : 0.5 + Math.sin(frame * 0.15) * 0.15} />
      <circle cx={-3} cy={3} r={2.5} fill="#ffaa00" opacity={isCasting ? 0.9 : 0.5 + Math.sin(frame * 0.2) * 0.15} />
      <circle cx={-3} cy={3} r={1.2} fill="#ffee88" opacity={isCasting ? 1 : 0.6} />

      {/* Casting: staff fire erupts upward */}
      {isCasting && (
        <>
          <circle cx={-3 + Math.sin(frame * 0.6) * 3} cy={-2 - castTimer * 0.03} r={2} fill="#ff4400" opacity={0.7} />
          <circle cx={-3 + Math.cos(frame * 0.5) * 4} cy={-5 - castTimer * 0.04} r={1.5} fill="#ffaa00" opacity={0.5} />
          <circle cx={-3 + Math.sin(frame * 0.7) * 2} cy={-8 - castTimer * 0.02} r={1} fill="#ffee00" opacity={0.4} />
        </>
      )}

      {/* Floating embers around body */}
      <circle cx={-1 + Math.sin(frame * 0.1) * 8} cy={8 + Math.cos(frame * 0.13) * 6} r={1} fill="#ff6600" opacity={0.4} />
      <circle cx={25 + Math.cos(frame * 0.12) * 6} cy={12 + Math.sin(frame * 0.11) * 5} r={0.8} fill="#ff4400" opacity={0.3} />
      <circle cx={5 + Math.sin(frame * 0.09 + 2) * 7} cy={4 + Math.cos(frame * 0.14) * 4} r={0.7} fill="#ffaa00" opacity={0.35} />

      {/* === METEOR ATTACK ANIMATION === */}
      {isCasting && castTimer > 30 && (
        <>
          {/* Warning circle on ground — grows and pulses */}
          <ellipse cx={meteorRelX} cy={meteorLandY + 2} rx={25 + castProgress * 35} ry={6 + castProgress * 4}
            fill="#ff4400" opacity={0.08 + castProgress * 0.12}
            stroke="#ff6600" strokeWidth="1.5"
            strokeDasharray={`${4 + castProgress * 8} 3`} />
          <ellipse cx={meteorRelX} cy={meteorLandY + 2} rx={15 + castProgress * 20} ry={4 + castProgress * 2}
            fill="#ff8800" opacity={0.06 + castProgress * 0.1} />

          {/* Meteor rock falling from sky */}
          <g transform={`translate(${meteorRelX}, ${meteorCurrentY})`}>
            {/* Meteor trail */}
            <line x1={0} y1={0} x2={3} y2={-20 - (1 - castProgress) * 30} stroke="#ff6600" strokeWidth="3" opacity={0.4 + castProgress * 0.3} />
            <line x1={0} y1={0} x2={1} y2={-15 - (1 - castProgress) * 25} stroke="#ffaa00" strokeWidth="2" opacity={0.3 + castProgress * 0.2} />
            <line x1={0} y1={0} x2={-1} y2={-10 - (1 - castProgress) * 20} stroke="#ffee00" strokeWidth="1" opacity={0.2 + castProgress * 0.15} />

            {/* Trail sparks */}
            <circle cx={2 + Math.sin(frame * 0.8) * 3} cy={-8 + Math.cos(frame * 0.6) * 4} r={1.5} fill="#ff4400" opacity={0.5} />
            <circle cx={-1 + Math.cos(frame * 0.7) * 4} cy={-14 + Math.sin(frame * 0.9) * 3} r={1} fill="#ffaa00" opacity={0.4} />

            {/* Meteor body — fiery rock */}
            <circle cx={0} cy={0} r={6 + castProgress * 4} fill="#882200" />
            <circle cx={0} cy={0} r={5 + castProgress * 3} fill="#aa3300" />
            <circle cx={-1} cy={-1} r={3 + castProgress * 2} fill="#ff4400" opacity={0.8} />
            <circle cx={0} cy={0} r={2 + castProgress} fill="#ffaa00" opacity={0.7} />
            <circle cx={1} cy={1} r={1} fill="#ffee88" opacity={0.9} />

            {/* Outer glow */}
            <circle cx={0} cy={0} r={10 + castProgress * 6} fill="#ff4400" opacity={0.15 + castProgress * 0.1} />
          </g>
        </>
      )}

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-4} y={0} width={28} height={30} fill="#ff0000" opacity={0.15} rx={2} />
      )}

      {/* Health bar */}
      <rect x={0} y={-10} width={24} height={4} fill="#333" rx={1} />
      <rect x={0} y={-10} width={24 * (health / maxHealth)} height={4} fill="#ff4400" rx={1} />
      {isCasting && <rect x={0} y={-5} width={24 * castProgress} height={2} fill="#ffaa00" rx={1} opacity={0.8} />}
      {showHpNumbers && (
        <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
