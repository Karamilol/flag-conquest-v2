import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

export default function PixelCorruptedSentinel({ x, y, health, maxHealth, frame, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const bobOffset = Math.sin(frame * 0.06) * 0.5; // Very slow bob for heavy unit
  const armorColor = hitFlash ? '#7a7a8a' : '#3a3a4a';
  const armorStroke = hitFlash ? '#9a9aaa' : '#5a5a6a';
  const corruptGlow = '#662266';

  const eliteGlowColor = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x}, ${y + bobOffset})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {isElite && eliteGlowColor && (
        <circle cx={14} cy={16} r={22} fill={eliteGlowColor} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={15} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlowColor || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Shadow — larger for big unit */}
      <ellipse cx={14} cy={36} rx={14} ry={4} fill="rgba(40,0,60,0.4)" />

      {/* Body — massive armored torso */}
      <rect x={4} y={8} width={20} height={20} fill={armorColor} stroke={armorStroke} strokeWidth="1" rx={2} />

      {/* Corruption veins on armor */}
      <line x1={8} y1={10} x2={10} y2={18} stroke={corruptGlow} strokeWidth="1" opacity={0.5 + Math.sin(frame * 0.08) * 0.2} />
      <line x1={18} y1={12} x2={16} y2={20} stroke={corruptGlow} strokeWidth="1" opacity={0.5 + Math.sin(frame * 0.08 + 1) * 0.2} />

      {/* Helmet */}
      <rect x={6} y={0} width={16} height={12} fill={armorColor} stroke={armorStroke} strokeWidth="1" rx={2} />
      {/* Visor slit */}
      <rect x={8} y={5} width={12} height={3} fill="#1a0a2a" rx={1} />
      {/* Glowing eyes behind visor */}
      <circle cx={11} cy={6.5} r={1.5} fill="#aa44ff" opacity={0.8 + Math.sin(frame * 0.12) * 0.2} />
      <circle cx={17} cy={6.5} r={1.5} fill="#aa44ff" opacity={0.8 + Math.sin(frame * 0.12 + 0.5) * 0.2} />

      {/* Tower shield (left side) */}
      <rect x={-6} y={4} width={10} height={24} fill="#4a4a5a" stroke="#6a6a7a" strokeWidth="1" rx={2} />
      <line x1={-1} y1={6} x2={-1} y2={26} stroke={corruptGlow} strokeWidth="1.5" opacity={0.4 + Math.sin(frame * 0.1) * 0.2} />

      {/* Pauldrons */}
      <ellipse cx={4} cy={10} rx={4} ry={3} fill={armorColor} stroke={armorStroke} strokeWidth="0.5" />
      <ellipse cx={24} cy={10} rx={4} ry={3} fill={armorColor} stroke={armorStroke} strokeWidth="0.5" />

      {/* Legs — heavy armored */}
      <rect x={6} y={28} width={6} height={8} fill={armorColor} stroke={armorStroke} strokeWidth="0.5" />
      <rect x={16} y={28} width={6} height={8} fill={armorColor} stroke={armorStroke} strokeWidth="0.5" />

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-8} y={-2} width={36} height={40} fill="#ff00ff" opacity={0.15} rx={2} />
      )}

      {/* Health bar — wider for tank */}
      <rect x={-2} y={-10} width={32} height={5} fill="#333" rx={1} />
      <rect x={-2} y={-10} width={32 * (health / maxHealth)} height={5} fill="#8866aa" rx={1} />
      {showHpNumbers && (
        <text x={14} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
