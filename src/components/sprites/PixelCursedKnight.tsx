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

export default function PixelCursedKnight({ x, y, health, maxHealth, frame, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const bobOffset = Math.sin(frame * 0.08) * 1;
  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);
  const cursePulse = 0.3 + Math.sin(frame * 0.05) * 0.15;

  return (
    <g transform={`translate(${x}, ${y + bobOffset}) scale(${eliteVariantId ? eliteScale : 1.1})`}>
      {isElite && eliteGlow && <circle cx={12} cy={14} r={20} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />}
      {eliteVariantId && (
        <text x={15} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Cursed aura */}
      <circle cx={12} cy={14} r={16} fill="#6622aa" opacity={cursePulse * 0.08} />
      {/* Legs — armored */}
      <rect x={6} y={22} width={4} height={8} fill={hitFlash ? '#fff' : '#2a2030'} />
      <rect x={14} y={22} width={4} height={8} fill={hitFlash ? '#fff' : '#2a2030'} />
      {/* Knee guards */}
      <rect x={5} y={24} width={6} height={3} fill={hitFlash ? '#fff' : '#3a2a40'} rx={1} />
      <rect x={13} y={24} width={6} height={3} fill={hitFlash ? '#fff' : '#3a2a40'} rx={1} />
      {/* Body — dark armor */}
      <rect x={4} y={8} width={16} height={15} fill={hitFlash ? '#fff' : '#1a1020'} rx={2} />
      {/* Chest plate */}
      <rect x={6} y={10} width={12} height={10} fill={hitFlash ? '#fff' : '#2a1a30'} rx={1} />
      {/* Purple rune on chest */}
      <line x1={12} y1={12} x2={12} y2={18} stroke="#8844cc" strokeWidth={1} opacity={0.6 + Math.sin(frame * 0.06) * 0.3} />
      <line x1={9} y1={15} x2={15} y2={15} stroke="#8844cc" strokeWidth={1} opacity={0.6 + Math.sin(frame * 0.06) * 0.3} />
      {/* Shoulders */}
      <rect x={1} y={8} width={6} height={5} fill={hitFlash ? '#fff' : '#2a1a30'} rx={2} />
      <rect x={17} y={8} width={6} height={5} fill={hitFlash ? '#fff' : '#2a1a30'} rx={2} />
      {/* Shoulder spikes */}
      <polygon points="2,8 4,3 6,8" fill={hitFlash ? '#fff' : '#3a2a40'} />
      <polygon points="18,8 20,3 22,8" fill={hitFlash ? '#fff' : '#3a2a40'} />
      {/* Helmet */}
      <rect x={5} y={0} width={14} height={10} fill={hitFlash ? '#fff' : '#1a1020'} rx={3} />
      {/* Visor slit — glowing purple eyes */}
      <rect x={7} y={4} width={10} height={2} fill="#110818" rx={0.5} />
      <circle cx={9} cy={5} r={1} fill="#aa44ff" opacity={0.7 + Math.sin(frame * 0.1) * 0.3} />
      <circle cx={15} cy={5} r={1} fill="#aa44ff" opacity={0.7 + Math.sin(frame * 0.1) * 0.3} />
      {/* Helmet crest */}
      <rect x={10} y={-3} width={4} height={5} fill={hitFlash ? '#fff' : '#3a2a40'} rx={1} />
      {/* Sword in right hand */}
      <rect x={21} y={6} width={2} height={14} fill={hitFlash ? '#fff' : '#555'} rx={0.5} />
      <rect x={20} y={18} width={4} height={3} fill={hitFlash ? '#fff' : '#3a2a18'} rx={1} />
      {/* Shield in left hand */}
      <rect x={-2} y={10} width={6} height={10} fill={hitFlash ? '#fff' : '#2a1a30'} rx={2} />
      <circle cx={1} cy={15} r={2} fill="#6622aa" opacity={0.5} />
      {/* Health bar */}
      <rect x={0} y={-8} width={24} height={4} fill="#333" rx={1} />
      <rect x={0} y={-8} width={24 * (health / maxHealth)} height={4} fill="#8844cc" rx={1} />
      {showHpNumbers && <text x={12} y={-10} fill="#fff" fontSize="6" textAnchor="middle">{health}/{maxHealth}</text>}
    </g>
  );
}
