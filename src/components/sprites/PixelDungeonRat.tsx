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

export default function PixelDungeonRat({ x, y, health, maxHealth, frame, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  // Fast scurrying bob
  const bobOffset = Math.sin(frame * 0.3) * 1.5;
  const scurry = Math.sin(frame * 0.4) * 2;
  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  return (
    <g transform={`translate(${x + scurry}, ${y + bobOffset}) scale(${eliteVariantId ? eliteScale : 1.35})`}>
      {isElite && eliteGlow && <circle cx={8} cy={8} r={14} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />}
      {eliteVariantId && (
        <text x={8} y={-14} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Body — small brown oval */}
      <ellipse cx={8} cy={10} rx={7} ry={5} fill={hitFlash ? '#fff' : '#6a4a2a'} />
      {/* Head */}
      <ellipse cx={2} cy={7} rx={4} ry={3.5} fill={hitFlash ? '#fff' : '#7a5a3a'} />
      {/* Eyes */}
      <circle cx={0} cy={6} r={1} fill="#ff3333" />
      {/* Ears */}
      <circle cx={1} cy={3.5} r={2} fill={hitFlash ? '#fff' : '#8a6a4a'} />
      <circle cx={4} cy={3.5} r={2} fill={hitFlash ? '#fff' : '#8a6a4a'} />
      {/* Tail */}
      <path d={`M15,10 Q20,${6 + Math.sin(frame * 0.2) * 3} 22,${8 + Math.sin(frame * 0.25) * 2}`}
        fill="none" stroke="#5a3a1a" strokeWidth={1.5} strokeLinecap="round" />
      {/* Legs (scurrying) */}
      <rect x={3} y={14} width={2} height={3} fill="#5a3a1a" rx={0.5}
        transform={`rotate(${Math.sin(frame * 0.4) * 15}, 4, 14)`} />
      <rect x={10} y={14} width={2} height={3} fill="#5a3a1a" rx={0.5}
        transform={`rotate(${Math.sin(frame * 0.4 + 1.5) * 15}, 11, 14)`} />
      {/* Health bar */}
      <rect x={0} y={-6} width={16} height={3} fill="#333" rx={1} />
      <rect x={0} y={-6} width={16 * (health / maxHealth)} height={3} fill="#aa4422" rx={1} />
      {showHpNumbers && <text x={8} y={-8} fill="#fff" fontSize="6" textAnchor="middle">{health}/{maxHealth}</text>}
    </g>
  );
}
