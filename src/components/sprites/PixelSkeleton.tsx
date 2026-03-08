import { memo } from 'react';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  bleedStacks?: number;
  attackCooldown?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
}

function PixelSkeleton({ x, y, health, maxHealth, frame, bleedStacks, attackCooldown = 99, lastDamageTime = 0, showHpNumbers }: Props) {
  const bobOffset = Math.sin(frame * 0.15 + x) * 1.5;
  const isAttacking = attackCooldown < 8;
  const attackPhase = isAttacking ? attackCooldown / 8 : 0;
  const weaponSwing = isAttacking ? (1 - attackPhase) * -35 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const eyeGlow = 0.4 + Math.sin(frame * 0.1) * 0.2;

  const bone = hitFlash ? '#f0ece4' : '#d8d0c4';
  const boneDark = hitFlash ? '#ddd6cc' : '#b0a898';

  return (
    <g transform={`translate(${x}, ${y + bobOffset})`} opacity={0.85}>
      {/* Bleed indicator */}
      {(bleedStacks ?? 0) > 0 && (
        <text x={12} y={-16} fontSize="11" textAnchor="middle" fill="#ff0000">
          🩸{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
        </text>
      )}
      {/* Shadow — faint green */}
      <ellipse cx={12} cy={26} rx={8} ry={2.5} fill="rgba(0,100,0,0.2)" />

      {/* Necromantic inner glow — see-through body effect */}
      <circle cx={12} cy={12} r={10} fill="#44ff44" opacity={0.05} />

      {/* Spine — the backbone everything hangs off */}
      <line x1={12} y1={8} x2={12} y2={21} stroke={bone} strokeWidth="1.5" />

      {/* Individual ribs — curved lines, NOT a filled rect */}
      <path d="M12,9 Q16,10 18,9" fill="none" stroke={bone} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12,9 Q8,10 6,9" fill="none" stroke={bone} strokeWidth="1.2" strokeLinecap="round" />
      <path d="M12,11.5 Q16,12.5 18,11.5" fill="none" stroke={bone} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M12,11.5 Q8,12.5 6,11.5" fill="none" stroke={bone} strokeWidth="1.1" strokeLinecap="round" />
      <path d="M12,14 Q15.5,15 17,14" fill="none" stroke={bone} strokeWidth="1" strokeLinecap="round" />
      <path d="M12,14 Q8.5,15 7,14" fill="none" stroke={bone} strokeWidth="1" strokeLinecap="round" />
      <path d="M12,16.5 Q15,17.5 16,16.5" fill="none" stroke={boneDark} strokeWidth="0.9" strokeLinecap="round" />
      <path d="M12,16.5 Q9,17.5 8,16.5" fill="none" stroke={boneDark} strokeWidth="0.9" strokeLinecap="round" />

      {/* Pelvis */}
      <path d="M8,19 Q12,22 16,19" fill="none" stroke={bone} strokeWidth="1.2" />

      {/* Leg bones — thin with joint circles */}
      <line x1={9} y1={20} x2={8} y2={24} stroke={bone} strokeWidth="1.5" strokeLinecap="round" />
      <line x1={15} y1={20} x2={16} y2={24} stroke={bone} strokeWidth="1.5" strokeLinecap="round" />
      {/* Knee joints */}
      <circle cx={8.5} cy={22} r={1} fill={boneDark} />
      <circle cx={15.5} cy={22} r={1} fill={boneDark} />
      {/* Feet — small */}
      <line x1={6} y1={25} x2={10} y2={25} stroke={boneDark} strokeWidth="1.2" strokeLinecap="round" />
      <line x1={14} y1={25} x2={18} y2={25} stroke={boneDark} strokeWidth="1.2" strokeLinecap="round" />

      {/* Shoulder joints */}
      <circle cx={6} cy={8.5} r={1.8} fill={bone} />
      <circle cx={18} cy={8.5} r={1.8} fill={bone} />

      {/* Left arm — just bones */}
      <line x1={6} y1={9} x2={3} y2={14} stroke={bone} strokeWidth="1.3" strokeLinecap="round" />
      <circle cx={3} cy={14} r={1} fill={boneDark} />
      <line x1={3} y1={14} x2={2} y2={18} stroke={bone} strokeWidth="1.2" strokeLinecap="round" />

      {/* Skull */}
      <ellipse cx={12} cy={4} rx={6.5} ry={5} fill={bone} />
      {/* Jaw — thin line, no big ellipse */}
      <path d="M8,7 Q12,9 16,7" fill="none" stroke={boneDark} strokeWidth="1" />
      {/* Eye sockets */}
      <ellipse cx={9} cy={3} rx={2.2} ry={1.8} fill="#1a1a1a" />
      <ellipse cx={15} cy={3} rx={2.2} ry={1.8} fill="#1a1a1a" />
      {/* Green eye glow */}
      <circle cx={9} cy={3} r={1.2} fill="#44ff44" opacity={eyeGlow} />
      <circle cx={15} cy={3} r={1.2} fill="#44ff44" opacity={eyeGlow} />
      {/* Faint green glow haze around eyes */}
      <circle cx={12} cy={3} r={5} fill="#44ff44" opacity={0.06} />
      {/* Nose hole */}
      <circle cx={12} cy={5.5} r={0.7} fill="#8a7a60" />
      {/* Nose to jaw line */}
      <line x1={12} y1={6} x2={12} y2={7.5} stroke={boneDark} strokeWidth="0.5" opacity={0.4} />

      {/* Weapon arm + rusty sword (swings on attack) */}
      <g transform={`translate(18, 8) rotate(${weaponSwing}, 0, 4)`}>
        {/* Upper arm bone */}
        <line x1={0} y1={0} x2={2} y2={6} stroke={bone} strokeWidth="1.3" strokeLinecap="round" />
        {/* Elbow */}
        <circle cx={2} cy={6} r={1} fill={boneDark} />
        {/* Forearm */}
        <line x1={2} y1={6} x2={1} y2={11} stroke={bone} strokeWidth="1.2" strokeLinecap="round" />
        {/* Rusty sword */}
        <rect x={-0.5} y={10} width={3} height={1.5} fill="#5a4a35" rx={0.3} />
        <rect x={0} y={11} width={1.8} height={7} fill="#7a7a7a" />
        <rect x={0.3} y={11} width={1} height={7} fill="#8a8a8a" opacity={0.4} />
      </g>

      {/* Attack flash — green tinted */}
      {isAttacking && attackPhase < 0.3 && (
        <line x1={20} y1={2} x2={27} y2={14} stroke="#aaffaa" strokeWidth={1.5} opacity={0.5} strokeLinecap="round" />
      )}

      {/* Damage flash overlay — green */}
      {recentlyHit && hitFlash && (
        <rect x={0} y={-3} width={24} height={30} fill="#00ff00" opacity={0.1} rx={2} />
      )}

      {/* Health bar */}
      <rect x={0} y={-10} width={24} height={4} fill="#333" rx={1} />
      <rect x={0} y={-10} width={24 * Math.max(0, health / maxHealth)} height={4} fill="#aaaaaa" rx={1} />
      {showHpNumbers && (
        <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}

export default memo(PixelSkeleton, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  const prevAttacking = (prev.attackCooldown ?? 99) < 8;
  const nextAttacking = (next.attackCooldown ?? 99) < 8;
  if (prevAttacking !== nextAttacking) return false;
  if (prevAttacking && prev.attackCooldown !== next.attackCooldown) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  // Bob uses frame — throttle to every 4 frames
  if (Math.floor(prev.frame / 4) !== Math.floor(next.frame / 4)) return false;
  return true;
});
