import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  activeSkeletons?: number;
  lastDamageTime?: number;
  passiveSummonTimer?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

export default function PixelLich({ x, y, health, maxHealth, frame, activeSkeletons = 0, lastDamageTime = 0, passiveSummonTimer = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const floatOffset = Math.sin(frame * 0.08) * 3;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const eyePulse = 0.6 + Math.sin(frame * 0.12) * 0.3;
  // Summon warning: aura intensifies in last 60 frames before passive summon
  const skelCap = eliteVariantId === 'archlich' ? 6 : 3;
  const summonCharging = passiveSummonTimer > 420 && activeSkeletons < skelCap;
  const auraIntensity = summonCharging ? 0.4 + Math.sin(frame * 0.3) * 0.2 : 0.15 + activeSkeletons * 0.04;
  const wispSpeed = summonCharging ? 0.25 : 0.12;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x}, ${y + floatOffset})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {isElite && eliteGlow && (
        <circle cx={15} cy={15} r={22} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={12} y={-16} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Ground shadow */}
      <ellipse cx={15} cy={42} rx={16} ry={5} fill="rgba(0,60,0,0.35)" />

      {/* Necromantic ground aura */}
      <ellipse cx={15} cy={42} rx={14 + activeSkeletons * 2} ry={4 + activeSkeletons}
        fill="#44ff44" opacity={auraIntensity} />

      {/* Robe - wide flowing cloak */}
      <path d="M3,40 Q0,22 8,10 L12,8 L18,8 L22,10 Q30,22 27,40 Q20,44 15,42 Q10,44 3,40"
        fill={hitFlash ? '#2a1a3e' : '#0e0e1e'} stroke={hitFlash ? '#4a3a5e' : '#1a1a3a'} strokeWidth="1" />
      {/* Inner robe detail */}
      <path d="M8,38 Q7,24 12,14 L15,12 L18,14 Q23,24 22,38"
        fill="#080818" opacity={0.7} />

      {/* Hood */}
      <path d="M6,12 Q6,0 15,-2 Q24,0 24,12 Q20,16 15,15 Q10,16 6,12"
        fill={hitFlash ? '#2a1a3e' : '#0e0e1e'} stroke={hitFlash ? '#4a3a5e' : '#1a1a3a'} strokeWidth="1" />

      {/* Skull face */}
      <ellipse cx={15} cy={8} rx={6} ry={6} fill={hitFlash ? '#eeddcc' : '#d4c8b0'} />
      <ellipse cx={15} cy={10} rx={4} ry={3} fill={hitFlash ? '#ddccbb' : '#c4b8a0'} />
      {/* Hollow eye sockets */}
      <ellipse cx={12} cy={6} rx={2.5} ry={2} fill="#111" />
      <ellipse cx={18} cy={6} rx={2.5} ry={2} fill="#111" />
      {/* Green eye glow */}
      <circle cx={12} cy={6} r={1.5} fill="#44ff44" opacity={eyePulse} />
      <circle cx={18} cy={6} r={1.5} fill="#44ff44" opacity={eyePulse} />
      {/* Nose hole */}
      <circle cx={15} cy={9} r={1} fill="#8a7a60" />
      {/* Jaw line */}
      <rect x={11} y={12} width={8} height={2} fill="#baa890" rx={1} />

      {/* Staff */}
      <g transform="translate(26, -8)">
        {/* Staff pole */}
        <rect x={0} y={6} width={3} height={44} fill="#5a4a35" />
        <rect x={0.5} y={6} width={2} height={44} fill="#6b5a45" opacity={0.6} />
        {/* Staff skull ornament */}
        <ellipse cx={1.5} cy={4} rx={4} ry={4} fill="#c8bca0" />
        <circle cx={0} cy={3} r={1.2} fill="#111" />
        <circle cx={3} cy={3} r={1.2} fill="#111" />
        {/* Staff glow */}
        <circle cx={1.5} cy={4} r={6} fill="#44ff44" opacity={0.08 + Math.sin(frame * 0.1) * 0.04} />
      </g>

      {/* Soul wisps orbiting */}
      <circle
        cx={15 + Math.sin(frame * wispSpeed) * 18}
        cy={20 + Math.cos(frame * wispSpeed) * 12}
        r={2} fill="#44ff44" opacity={0.5} />
      <circle
        cx={15 + Math.sin(frame * wispSpeed + 2.1) * 16}
        cy={18 + Math.cos(frame * wispSpeed + 2.1) * 10}
        r={1.5} fill="#66ff66" opacity={0.4} />
      <circle
        cx={15 + Math.sin(frame * wispSpeed + 4.2) * 14}
        cy={22 + Math.cos(frame * wispSpeed + 4.2) * 8}
        r={1.8} fill="#33dd33" opacity={0.35} />

      {/* Hit flash: green sparks */}
      {recentlyHit && hitFlash && (
        <>
          <circle cx={8 + ((frame * 7) % 14)} cy={(frame * 13) % 30} r={2} fill="#44ff44" opacity={0.6} />
          <circle cx={8 + ((frame * 11 + 5) % 14)} cy={((frame * 17 + 9) % 30)} r={1.5} fill="#88ff88" opacity={0.5} />
          <rect x={0} y={-4} width={30} height={48} fill="#00ff00" opacity={0.1} rx={4} />
        </>
      )}

      {/* Summon charge visual */}
      {summonCharging && (
        <circle cx={15} cy={20} r={20 + Math.sin(frame * 0.4) * 3} fill="#44ff44" opacity={0.08} />
      )}

      {/* Active skeleton count skulls */}
      {activeSkeletons > 0 && (
        <text x={15} y={-18} fontSize="9" textAnchor="middle">
          {'💀'.repeat(activeSkeletons)}
        </text>
      )}

      {/* Health bar - green for Lich */}
      <rect x={0} y={-12} width={30} height={4} fill="#333" rx={1} />
      <rect x={0} y={-12} width={30 * Math.max(0, health / maxHealth)} height={4} fill="#44cc44" rx={1} />
      {showHpNumbers && (
        <text x={15} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
