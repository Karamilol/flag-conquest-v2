import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  stealthTimer: number;
  visibleTimer: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

export default function PixelShadowAssassin({ x, y, health, maxHealth, frame, stealthTimer, visibleTimer, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const isCloaked = stealthTimer > 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const bobOffset = Math.sin(frame * 0.15) * 1.5;
  // Fade in/out based on stealth
  const opacity = isCloaked ? 0.20 + Math.sin(frame * 0.1) * 0.05 : 1;
  const bodyColor = hitFlash ? '#6a3a6a' : '#1a0a2a';
  const cloakColor = hitFlash ? '#8a4a8a' : '#2a1040';

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x}, ${y + bobOffset})${eliteVariantId ? ` scale(${eliteScale})` : ''}`} opacity={opacity}>
      {isElite && eliteGlow && (
        <circle cx={12} cy={12} r={18} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Shadow */}
      <ellipse cx={12} cy={26} rx={8} ry={3} fill="rgba(80,0,120,0.4)" />

      {/* Cloak body */}
      <path d="M4,8 L12,2 L20,8 L18,24 L6,24 Z" fill={cloakColor} stroke="#3a1a50" strokeWidth="0.5" />

      {/* Inner body */}
      <rect x={8} y={10} width={8} height={12} fill={bodyColor} />

      {/* Hood */}
      <path d="M5,10 Q12,0 19,10 L17,14 L7,14 Z" fill={cloakColor} stroke="#3a1a50" strokeWidth="0.5" />

      {/* Eyes - glowing purple */}
      <circle cx={9} cy={10} r={1.5} fill="#cc44ff" opacity={isCloaked ? 0.5 : 0.9} />
      <circle cx={15} cy={10} r={1.5} fill="#cc44ff" opacity={isCloaked ? 0.5 : 0.9} />

      {/* Dagger (right hand) */}
      <line x1={2} y1={16} x2={-4} y2={20} stroke="#aaa" strokeWidth="2" strokeLinecap="round" />
      <line x1={-4} y1={20} x2={-6} y2={22} stroke="#ddd" strokeWidth="1.5" />

      {/* Stealth particles */}
      {isCloaked && frame % 15 < 8 && (
        <>
          <circle cx={6 + Math.sin(frame * 0.2) * 4} cy={5 + Math.cos(frame * 0.3) * 3} r={1} fill="#aa44ff" opacity={0.3} />
          <circle cx={18 + Math.cos(frame * 0.25) * 3} cy={8 + Math.sin(frame * 0.2) * 4} r={1} fill="#aa44ff" opacity={0.2} />
        </>
      )}

      {/* Legs */}
      <rect x={7} y={22} width={3} height={5} fill="#1a0a1a" />
      <rect x={14} y={22} width={3} height={5} fill="#1a0a1a" />

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={0} y={0} width={24} height={28} fill="#ff00ff" opacity={0.15} rx={2} />
      )}

      {/* Health bar — only show when visible */}
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
  );
}
