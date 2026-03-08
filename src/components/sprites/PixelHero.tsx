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
}

export default function PixelHero({ x, y, health, maxHealth, isAttacking, attackCooldown, frame, lastDamageTime = 0, hideHealth, skinColors }: Props) {
  const bobOffset = Math.sin(frame * 0.2) * 2;
  const justSwung = isAttacking && attackCooldown < 6;
  const attackOffset = justSwung ? 4 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 12;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const capeWave = Math.sin(frame * 0.15) * 2;

  // Skin color overrides
  const armor = skinColors?.armor || '#3a5a9f';
  const armorLight = skinColors?.accent || '#4a6aaf';
  const armorLighter = skinColors?.accent ? skinColors.accent + '88' : '#5a7abf';
  const cape1 = skinColors?.cape || '#2a4a8f';
  const cape2 = skinColors?.cape ? skinColors.armor || '#3a5aaf' : '#3a5aaf';
  const crest = skinColors?.accent || '#cc3333';
  const crestLight = skinColors?.accent || '#dd4444';
  const shield1 = skinColors?.armor || '#3a5a8f';
  const shield2 = skinColors?.accent || '#4a6a9f';

  return (
    <g transform={`translate(${x}, ${y + bobOffset})`}>
      {/* Shadow */}
      <ellipse cx={16} cy={34} rx={12} ry={4} fill="rgba(0,0,0,0.3)" />

      {/* Cape (behind body) */}
      <polygon points={`4,8 -2,${30 + capeWave} -6,${32 + capeWave} 8,10`} fill={cape1} />
      <polygon points={`4,8 -4,${31 + capeWave} -2,${30 + capeWave} 6,10`} fill={cape2} />

      {/* Body — heavy plate armor */}
      <rect x={8} y={8} width={16} height={18} fill={hitFlash ? '#ff4444' : armor} />
      {/* Chest plate detail */}
      <rect x={10} y={10} width={12} height={8} fill={hitFlash ? '#ff6666' : armorLight} />
      <rect x={14} y={11} width={4} height={6} fill={hitFlash ? '#ff8888' : armorLighter} />
      {/* Belt */}
      <rect x={8} y={22} width={16} height={3} fill="#8a7a4a" />
      <rect x={14} y={22} width={4} height={3} fill="#aa9a5a" />

      {/* Head */}
      <rect x={6} y={0} width={20} height={12} fill={hitFlash ? '#ffaaaa' : '#ffcc99'} />
      <rect x={10} y={2} width={3} height={3} fill="#333" />
      <rect x={18} y={2} width={3} height={3} fill="#333" />
      <rect x={12} y={6} width={6} height={2} fill="#cc9966" />

      {/* Helmet with visor and crest */}
      <rect x={4} y={-2} width={24} height={6} fill="#777" />
      <rect x={6} y={-4} width={20} height={4} fill="#999" />
      {/* Visor slit */}
      <rect x={8} y={0} width={16} height={2} fill="#444" />
      {/* Crest */}
      <rect x={13} y={-8} width={6} height={5} fill={crest} />
      <rect x={14} y={-10} width={4} height={3} fill={crestLight} />

      {/* Shoulder pauldrons */}
      <rect x={-2} y={6} width={10} height={6} fill="#666" rx={1} />
      <rect x={24} y={6} width={10} height={6} fill="#666" rx={1} />
      <rect x={-1} y={7} width={8} height={4} fill="#888" rx={1} />
      <rect x={25} y={7} width={8} height={4} fill="#888" rx={1} />

      {/* Sword arm */}
      <rect x={24 + attackOffset} y={12} width={12} height={4} fill={hitFlash ? '#ffaaaa' : '#ffcc99'} />
      {/* Sword blade */}
      <rect x={32 + attackOffset} y={6} width={4} height={18} fill="#bbb" />
      <rect x={33 + attackOffset} y={7} width={2} height={16} fill="#ddd" />
      {/* Crossguard */}
      <rect x={29 + attackOffset} y={4} width={10} height={4} fill="#aa8833" />
      {/* Attack flash */}
      {justSwung && attackCooldown < 3 && (
        <line x1={34 + attackOffset} y1={4} x2={40 + attackOffset} y2={20} stroke="#fff" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
      )}

      {/* Shield arm */}
      <rect x={-4} y={10} width={8} height={12} fill="#666" />
      {/* Shield with emblem */}
      <rect x={-8} y={8} width={10} height={16} fill={shield1} rx={1} />
      <rect x={-6} y={10} width={6} height={12} fill={shield2} rx={1} />
      {/* Shield emblem — cross */}
      <rect x={-5} y={14} width={4} height={1} fill="#aa9a5a" />
      <rect x={-4} y={12} width={2} height={5} fill="#aa9a5a" />

      {/* Legs — armored greaves */}
      <rect x={8} y={26} width={6} height={8} fill="#555" />
      <rect x={18} y={26} width={6} height={8} fill="#555" />
      {/* Boots */}
      <rect x={7} y={32} width={8} height={3} fill="#444" />
      <rect x={17} y={32} width={8} height={3} fill="#444" />

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-8} y={-10} width={50} height={46} fill="#ff0000" opacity={0.15} rx={2} />
      )}

      {/* Health bar */}
      {!hideHealth && <>
        <rect x={-4} y={-16} width={40} height={8} fill={COLORS.healthBg} rx={2} />
        <rect x={-3} y={-15} width={Math.max(0, (health / maxHealth) * 38)} height={6}
              fill={health > maxHealth * 0.3 ? COLORS.healthGreen : COLORS.healthRed} rx={1} />
        {/* HP text */}
        <text x={16} y={-20} fontSize="11" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      </>}
    </g>
  );
}
