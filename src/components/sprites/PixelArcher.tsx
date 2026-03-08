import { COLORS } from '../../constants';
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

export default function PixelArcher({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const bobOffset = Math.sin(frame * 0.12 + x) * 1;
  const isAttacking = attackCooldown < 10;
  const attackPhase = isAttacking ? attackCooldown / 10 : 0;
  const stringPull = isAttacking ? (1 - attackPhase) * -6 : 0;
  // Damage flash
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x}, ${y + bobOffset})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {isElite && eliteGlow && (
        <circle cx={12} cy={12} r={18} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Shadow */}
      <ellipse cx={12} cy={28} rx={10} ry={3} fill="rgba(0,0,0,0.3)" />

      {/* Body - darker/cloaked */}
      <rect x={6} y={8} width={12} height={14} fill={hitFlash ? '#6a5a5a' : '#3a4a3a'} />

      {/* Hood/Head */}
      <rect x={4} y={0} width={16} height={12} fill={hitFlash ? '#5a4a4a' : '#2a3a2a'} />
      <rect x={8} y={4} width={3} height={3} fill="#ff4" />
      <rect x={13} y={4} width={3} height={3} fill="#ff4" />

      {/* Bow */}
      <ellipse cx={-4} cy={12} rx={3} ry={12} fill="#8b5a2a" stroke="#5a3a1a" strokeWidth={1} />
      <line x1={-4} y1={0} x2={-4 + stringPull} y2={12} stroke="#aaa" strokeWidth={1} />
      <line x1={-4 + stringPull} y1={12} x2={-4} y2={24} stroke="#aaa" strokeWidth={1} />
      {/* Arrow nocked when attacking */}
      {isAttacking && <line x1={-4 + stringPull} y1={12} x2={-14} y2={12} stroke="#8b5a2a" strokeWidth={1.5} />}
      {/* Release flash */}
      {isAttacking && attackPhase < 0.3 && <circle cx={-14} cy={12} r={4} fill="#ffaa00" opacity={0.6} />}

      {/* Legs */}
      <rect x={6} y={22} width={4} height={6} fill="#2a2a2a" />
      <rect x={14} y={22} width={4} height={6} fill="#2a2a2a" />

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-6} y={-2} width={30} height={32} fill="#ff0000" opacity={0.15} rx={2} />
      )}

      {/* Health bar */}
      <rect x={0} y={-10} width={24} height={5} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-9} width={Math.max(0, (health / maxHealth) * 22)} height={3}
            fill="#ffaa00" rx={1} />
      {showHpNumbers && (
        <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
