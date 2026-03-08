import { COLORS } from '../../constants';
import type { Hero } from '../../types';

interface Props {
  x: Hero['x'];
  y: Hero['y'];
  health: Hero['health'];
  maxHealth: Hero['maxHealth'];
  isAttacking: Hero['isAttacking'];
  attackCooldown: Hero['attackCooldown'];
  frame: Hero['frame'];
  lastDamageTime?: number;
  hideHealth?: boolean;
  skinColors?: Record<string, string>;
  channeling?: number;
  manaShieldCharges?: number;
}

export default function PixelMage({ x, y, health, maxHealth, isAttacking, attackCooldown, frame, lastDamageTime = 0, hideHealth, skinColors, channeling = 0, manaShieldCharges = 0 }: Props) {
  const bobOffset = Math.sin(frame * 0.2) * 2;
  const justCast = isAttacking && attackCooldown < 8;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 12;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const isChanneling = channeling > 0;

  // Skin color overrides
  const robe = skinColors?.armor || '#5a3a8a';
  const robeLight = skinColors?.accent || '#7a5aaa';
  const hat = skinColors?.cape || '#4a2a7a';

  // Staff crystal glow pulses
  const crystalGlow = 0.6 + Math.sin(frame * 0.15) * 0.3;
  const crystalColor = isChanneling ? '#ff8844' : justCast ? '#aaddff' : '#8855cc';

  return (
    <g transform={`translate(${x}, ${y + bobOffset})`}>
      {/* Shadow */}
      <ellipse cx={16} cy={34} rx={10} ry={3} fill="rgba(0,0,0,0.3)" />

      {/* Channeling aura */}
      {isChanneling && (
        <>
          <circle cx={16} cy={16} r={20 + Math.sin(frame * 0.2) * 3} fill="none" stroke={crystalColor} strokeWidth={2} opacity={0.4 + Math.sin(frame * 0.15) * 0.2} />
          <circle cx={16} cy={16} r={14 + Math.sin(frame * 0.3) * 2} fill={crystalColor} opacity={0.1} />
        </>
      )}

      {/* Robe body */}
      <rect x={6} y={8} width={20} height={20} fill={hitFlash ? '#ff4444' : robe} />
      {/* Robe trim */}
      <rect x={6} y={24} width={20} height={4} fill={hitFlash ? '#ff6666' : robeLight} />
      {/* Sash */}
      <rect x={8} y={16} width={16} height={2} fill="#cc9900" />

      {/* Head */}
      <rect x={8} y={0} width={16} height={12} fill={hitFlash ? '#ffaaaa' : '#ffcc99'} />
      <rect x={12} y={3} width={3} height={3} fill="#333" />
      <rect x={18} y={3} width={3} height={3} fill="#333" />
      <rect x={14} y={7} width={4} height={2} fill="#cc9966" />

      {/* Pointy hat */}
      <rect x={6} y={-2} width={20} height={6} fill={hat} />
      <polygon points="10,-2 16,-14 22,-2" fill={hat} />
      {/* Hat brim */}
      <rect x={4} y={2} width={24} height={3} fill={hat} />
      {/* Hat star */}
      <circle cx={16} cy={-6} r={2} fill="#ffdd44" opacity={0.8} />

      {/* Staff (right side) */}
      <line x1={28} y1={-4} x2={28} y2={30} stroke="#6b4226" strokeWidth={3} />
      {/* Staff crystal orb */}
      <circle cx={28} cy={-6} r={5} fill={crystalColor} opacity={crystalGlow} />
      <circle cx={28} cy={-6} r={3} fill="#fff" opacity={crystalGlow * 0.6} />
      {/* Cast flash */}
      {justCast && attackCooldown < 4 && (
        <circle cx={28} cy={-6} r={8} fill={crystalColor} opacity={0.4} />
      )}

      {/* Left arm */}
      <rect x={-2} y={12} width={8} height={4} fill={hitFlash ? '#ffaaaa' : '#ffcc99'} />

      {/* Legs/boots */}
      <rect x={8} y={28} width={6} height={6} fill="#3a2a5a" />
      <rect x={18} y={28} width={6} height={6} fill="#3a2a5a" />
      <rect x={7} y={32} width={8} height={3} fill="#2a1a4a" />
      <rect x={17} y={32} width={8} height={3} fill="#2a1a4a" />

      {/* Mana shield orbs */}
      {manaShieldCharges > 0 && (
        <>
          {Array.from({ length: manaShieldCharges }).map((_, i) => {
            const angle = (frame * 0.05) + (i * Math.PI * 2 / 3);
            const orbX = 16 + Math.cos(angle) * 18;
            const orbY = 14 + Math.sin(angle) * 12;
            return (
              <circle key={i} cx={orbX} cy={orbY} r={3.5}
                fill="#8866cc" opacity={0.6 + Math.sin(frame * 0.1 + i) * 0.2}
                stroke="#aa88ee" strokeWidth={0.5} />
            );
          })}
        </>
      )}

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-4} y={-16} width={42} height={52} fill="#ff0000" opacity={0.15} rx={2} />
      )}

      {/* Health bar */}
      {!hideHealth && <>
        <rect x={-4} y={-20} width={40} height={8} fill={COLORS.healthBg} rx={2} />
        <rect x={-3} y={-19} width={Math.max(0, (health / maxHealth) * 38)} height={6}
              fill={health > maxHealth * 0.3 ? COLORS.healthGreen : COLORS.healthRed} rx={1} />
        <text x={16} y={-24} fontSize="11" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      </>}
    </g>
  );
}
