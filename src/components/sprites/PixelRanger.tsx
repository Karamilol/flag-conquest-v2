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

export default function PixelRanger({ x, y, health, maxHealth, isAttacking, attackCooldown, frame, lastDamageTime = 0, hideHealth, skinColors }: Props) {
  const bobOffset = Math.sin(frame * 0.2) * 2;
  const justShot = isAttacking && attackCooldown < 6;
  const drawOffset = justShot ? -2 : 0; // bowstring pull
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 12;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  // Skin color overrides
  const tunic = skinColors?.armor || '#3a6f2a';
  const tunicLight = skinColors?.accent || '#5a9f4a';
  const hood1 = skinColors?.cape || '#4a7a3a';
  const hood2 = skinColors?.cape || '#5a8a4a';
  const hoodTop = skinColors?.armor || '#3a6a2a';

  return (
    <g transform={`translate(${x}, ${y + bobOffset})`}>
      {/* Shadow */}
      <ellipse cx={16} cy={34} rx={10} ry={3} fill="rgba(0,0,0,0.3)" />

      {/* Body — tunic */}
      <rect x={8} y={8} width={16} height={18} fill={hitFlash ? '#ff4444' : tunic} />
      <rect x={10} y={10} width={4} height={4} fill={hitFlash ? '#ff6666' : tunicLight} />
      {/* Belt */}
      <rect x={8} y={22} width={16} height={3} fill="#5a4a2a" />

      {/* Head — hooded */}
      <rect x={6} y={0} width={20} height={12} fill={hitFlash ? '#ffaaaa' : '#ffcc99'} />
      <rect x={10} y={2} width={3} height={3} fill="#333" />
      <rect x={18} y={2} width={3} height={3} fill="#333" />
      <rect x={12} y={6} width={6} height={2} fill="#cc9966" />
      {/* Hood */}
      <rect x={4} y={-4} width={24} height={8} fill={hood1} />
      <rect x={6} y={-2} width={20} height={4} fill={hood2} />
      <polygon points="4,-4 16,-8 28,-4" fill={hoodTop} />

      {/* Quiver on back */}
      <rect x={-2} y={6} width={5} height={16} fill="#6a5a3a" />
      <line x1={0} y1={6} x2={0} y2={4} stroke="#8b7a5a" strokeWidth={1} />
      <line x1={2} y1={6} x2={2} y2={3} stroke="#8b7a5a" strokeWidth={1} />

      {/* Bow arm (right) */}
      <rect x={24} y={10} width={10} height={4} fill={hitFlash ? '#ffaaaa' : '#ffcc99'} />
      {/* Bow */}
      <path d={`M${30},${4 + drawOffset} Q${36},${14} ${30},${24 + drawOffset}`}
        fill="none" stroke="#6b4226" strokeWidth={2.5} />
      {/* Bowstring */}
      <line x1={30} y1={4 + drawOffset} x2={justShot ? 26 : 30} y2={14}
        stroke="#aaa" strokeWidth={1} />
      <line x1={justShot ? 26 : 30} y1={14} x2={30} y2={24 + drawOffset}
        stroke="#aaa" strokeWidth={1} />
      {/* Arrow nocked */}
      {justShot && (
        <line x1={26} y1={14} x2={34} y2={14} stroke="#8b7a5a" strokeWidth={1.5} />
      )}
      {/* Shot flash */}
      {justShot && attackCooldown < 3 && (
        <circle cx={34} cy={14} r={4} fill="#4a8f3f" opacity={0.5} />
      )}

      {/* Left arm */}
      <rect x={-2} y={12} width={8} height={4} fill={hitFlash ? '#ffaaaa' : '#ffcc99'} />

      {/* Legs — brown leather */}
      <rect x={8} y={26} width={6} height={8} fill="#5a4a2a" />
      <rect x={18} y={26} width={6} height={8} fill="#5a4a2a" />
      {/* Boots */}
      <rect x={7} y={32} width={8} height={3} fill="#3a2a1a" />
      <rect x={17} y={32} width={8} height={3} fill="#3a2a1a" />

      {/* Damage flash overlay */}
      {recentlyHit && hitFlash && (
        <rect x={-4} y={-8} width={42} height={44} fill="#ff0000" opacity={0.15} rx={2} />
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
