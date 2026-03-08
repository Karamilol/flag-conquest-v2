import { COLORS } from '../../constants';
import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  bleedStacks?: number;
  attackCooldown?: number;
  lastDamageTime?: number;
  isLichSkeleton?: boolean;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

export default function PixelEnemy({ x, y, health, maxHealth, frame, bleedStacks, attackCooldown = 99, lastDamageTime = 0, isLichSkeleton, showHpNumbers, isElite, eliteVariantId }: Props) {
  const bobOffset = Math.sin(frame * 0.15 + x) * 1.5;
  const isAttacking = attackCooldown < 8;
  const attackPhase = isAttacking ? attackCooldown / 8 : 0;
  const weaponSwing = isAttacking ? (1 - attackPhase) * -30 : 0;
  // Damage flash
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  // Skeleton colors
  const headColor = isLichSkeleton ? (hitFlash ? '#eee8dd' : '#ddd8cc') : (hitFlash ? '#cccc88' : '#7a9955');
  const bodyColor = isLichSkeleton ? (hitFlash ? '#bbb8b0' : '#aaa8a0') : (hitFlash ? '#ff8888' : COLORS.enemyRed);
  const bodyDetail = isLichSkeleton ? (hitFlash ? '#9a9890' : '#8a8880') : (hitFlash ? '#ff6666' : COLORS.enemyDark);
  const eyeColor = isLichSkeleton ? '#222' : '#ff0';
  const mouthColor = isLichSkeleton ? '#444' : '#5a7935';
  const legColor = isLichSkeleton ? '#8a8880' : '#5a5a3a';
  const healthBarColor = isLichSkeleton ? '#aaaaaa' : COLORS.healthRed;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x}, ${y + bobOffset})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {/* Elite glow */}
      {isElite && eliteGlow && (
        <circle cx={12} cy={10} r={18} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Bleed indicator */}
      {(bleedStacks ?? 0) > 0 && (
        <text x={12} y={-16} fontSize="11" textAnchor="middle" fill="#ff0000">
          🩸{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
        </text>
      )}
      {/* Shadow */}
      <ellipse cx={12} cy={26} rx={10} ry={3} fill="rgba(0,0,0,0.3)" />

      {/* Faint green glow for skeletons */}
      {isLichSkeleton && (
        <circle cx={12} cy={5} r={8} fill="#44ff44" opacity={0.06} />
      )}

      {/* Body */}
      <rect x={4} y={6} width={16} height={14} fill={bodyColor} />
      <rect x={6} y={8} width={4} height={4} fill={bodyDetail} />

      {/* Head */}
      <rect x={2} y={0} width={20} height={10} fill={headColor} />
      <rect x={4} y={2} width={4} height={3} fill={eyeColor} />
      <rect x={14} y={2} width={4} height={3} fill={eyeColor} />
      <rect x={8} y={6} width={8} height={3} fill={mouthColor} />

      {/* Ears - skeletons have no ears */}
      {!isLichSkeleton && (
        <>
          <rect x={-2} y={0} width={6} height={4} fill={headColor} />
          <rect x={20} y={0} width={6} height={4} fill={headColor} />
        </>
      )}

      {/* Skeleton eye glow */}
      {isLichSkeleton && (
        <>
          <circle cx={6} cy={3.5} r={2} fill="#44ff44" opacity={0.15} />
          <circle cx={16} cy={3.5} r={2} fill="#44ff44" opacity={0.15} />
        </>
      )}

      {/* Weapon (swings on attack) */}
      <g transform={`translate(23, 6) rotate(${weaponSwing}, 0, 5)`}>
        <rect x={0} y={0} width={8} height={3} fill="#8b7355" />
        <rect x={6} y={-4} width={6} height={10} fill="#666" />
      </g>
      {/* Attack flash */}
      {isAttacking && attackPhase < 0.3 && (
        <line x1={20} y1={0} x2={30} y2={14} stroke="#fff" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
      )}

      {/* Legs */}
      <rect x={6} y={20} width={4} height={6} fill={legColor} />
      <rect x={14} y={20} width={4} height={6} fill={legColor} />

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-2} y={-2} width={30} height={30} fill="#ff0000" opacity={0.15} rx={2} />
      )}

      {/* Health bar */}
      <rect x={0} y={-10} width={24} height={5} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-9} width={Math.max(0, (health / maxHealth) * 22)} height={3}
            fill={healthBarColor} rx={1} />
      {showHpNumbers && (
        <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
