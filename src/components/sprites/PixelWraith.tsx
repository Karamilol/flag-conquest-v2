import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

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

export default function PixelWraith({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const floatOffset = Math.sin(frame * 0.1) * 3;
  const isAttacking = attackCooldown < 10;
  const attackPhase = isAttacking ? attackCooldown / 10 : 0;
  // Damage flash
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  // Eye glow intensifies on attack
  const eyeGlow = isAttacking ? 1 : 0.9;
  const eyeR = isAttacking ? 4 + (1 - attackPhase) * 2 : 3;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x}, ${y + floatOffset})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {isElite && eliteGlow && (
        <circle cx={15} cy={15} r={22} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={15} y={-16} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Shadow */}
      <ellipse cx={15} cy={35} rx={14} ry={5} fill="rgba(80,0,120,0.4)" />
      {/* Main body - dark ethereal mass */}
      <path d="M5,30 Q0,15 10,5 Q15,0 20,5 Q30,15 25,30 Q20,35 15,32 Q10,35 5,30"
        fill={hitFlash ? '#3a1a4e' : '#1a0a2e'} stroke={hitFlash ? '#8a4aae' : '#4a2a6e'} strokeWidth="1" />
      {/* Inner darkness swirl */}
      <ellipse cx={15} cy={18} rx={8} ry={10} fill="#0d0518" opacity={0.8} />
      {/* Glowing eyes */}
      <circle cx={10} cy={14} r={eyeR} fill="#ff00ff" opacity={eyeGlow} />
      <circle cx={20} cy={14} r={eyeR} fill="#ff00ff" opacity={eyeGlow} />
      <circle cx={10} cy={14} r={1.5} fill="#fff" />
      <circle cx={20} cy={14} r={1.5} fill="#fff" />
      {/* Attack pulse */}
      {isAttacking && attackPhase < 0.4 && (
        <circle cx={15} cy={18} r={18} fill="#ff00ff" opacity={0.15} />
      )}
      {/* Wispy tendrils */}
      <path d={`M5,30 Q${2 + Math.sin(frame * 0.15) * 3},38 5,45`}
        stroke="#2a1a4e" strokeWidth="3" fill="none" opacity="0.6" />
      <path d={`M15,32 Q15,40 ${15 + Math.sin(frame * 0.12) * 2},48`}
        stroke="#2a1a4e" strokeWidth="3" fill="none" opacity="0.6" />
      <path d={`M25,30 Q${28 + Math.sin(frame * 0.18) * 3},38 25,45`}
        stroke="#2a1a4e" strokeWidth="3" fill="none" opacity="0.6" />
      {/* Particle effects */}
      <circle cx={5 + Math.sin(frame * 0.2) * 5} cy={10} r={2} fill="#8844aa" opacity={0.5} />
      <circle cx={25 + Math.cos(frame * 0.15) * 5} cy={8} r={1.5} fill="#aa44cc" opacity={0.4} />
      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={0} y={0} width={30} height={35} fill="#ff0000" opacity={0.2} rx={4} />
      )}
      {/* Health bar */}
      <rect x={0} y={-8} width={30} height={4} fill="#333" rx={1} />
      <rect x={0} y={-8} width={30 * (health / maxHealth)} height={4} fill="#8844aa" rx={1} />
      {showHpNumbers && (
        <text x={15} y={-10} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
