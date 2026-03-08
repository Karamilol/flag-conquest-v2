import { COLORS, UNIT_STATS } from '../../constants';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  unitType?: string;
  attackCooldown?: number;
  attackRate?: number;
  isRoyalGuard?: boolean;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isFriendlySlime?: boolean;
  isCourier?: boolean;
  isGiant?: boolean;
  skinColors?: Record<string, string>;
}

export default function PixelAlly({ x, y, health, maxHealth, frame, unitType = 'soldier', attackCooldown = 99, attackRate = 30, isRoyalGuard, lastDamageTime = 0, showHpNumbers, isFriendlySlime, isCourier, isGiant, skinColors }: Props) {
  const bobOffset = Math.sin(frame * 0.18 + x) * 1.5;
  const stats = UNIT_STATS[unitType as keyof typeof UNIT_STATS] as any;
  const baseColor: string = stats?.color || '#4a7fff'; // original color, always used for HP bars
  const color: string = skinColors?.body || baseColor;
  // "just attacked" when cooldown was recently reset (< 10 frames ago)
  const isAttacking = attackCooldown < 10;
  const attackPhase = isAttacking ? attackCooldown / 10 : 0; // 0..1, 0=just swung
  // Damage flash
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  // Friendly Slime — small green blob
  if (isFriendlySlime) {
    const squish = Math.sin(frame * 0.12 + x) * 1.5;
    const slimeFill = hitFlash ? '#88ff88' : '#44cc44';
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={8} cy={18} rx={6} ry={2} fill="rgba(0,0,0,0.2)" />
        <ellipse cx={8} cy={12 + squish * 0.5} rx={7 + squish * 0.3} ry={8 - squish * 0.3} fill={slimeFill} opacity={0.85} />
        <ellipse cx={8} cy={10 + squish * 0.5} rx={5} ry={5} fill="#66dd66" opacity={0.5} />
        <circle cx={5} cy={9} r={1.5} fill="#fff" />
        <circle cx={11} cy={9} r={1.5} fill="#fff" />
        <circle cx={5} cy={9.5} r={0.8} fill="#222" />
        <circle cx={11} cy={9.5} r={0.8} fill="#222" />
        {recentlyHit && hitFlash && <ellipse cx={8} cy={12} rx={9} ry={10} fill="#ff0000" opacity={0.15} />}
        {/* HP bar above slime */}
        <rect x={-1} y={-4} width={18} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={0} y={-3} width={Math.max(0, (health / maxHealth) * 16)} height={2} fill="#44ff44" rx={1} />
        {showHpNumbers && (
          <text x={8} y={-6} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // Courier — slow mailman
  if (isCourier) {
    const walkCycle = Math.sin(frame * 0.12 + x) * 2;
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        {/* Shadow */}
        <ellipse cx={10} cy={24} rx={8} ry={2.5} fill="rgba(0,0,0,0.25)" />
        {/* Legs (walk cycle) */}
        <rect x={5} y={16} width={4} height={6 + walkCycle} fill="#3a3a5a" />
        <rect x={11} y={16} width={4} height={6 - walkCycle} fill="#3a3a5a" />
        {/* Body — blue mailman uniform */}
        <rect x={3} y={6} width={14} height={11} fill={hitFlash ? '#8888ff' : '#4455aa'} rx={1} />
        {/* Belt */}
        <rect x={3} y={15} width={14} height={2} fill="#8b6914" />
        {/* Button line */}
        <rect x={9} y={7} width={2} height={9} fill={hitFlash ? '#aaaaff' : '#5566bb'} />
        {/* Head */}
        <rect x={4} y={-1} width={12} height={8} fill={hitFlash ? '#ffddbb' : '#eebb88'} rx={1} />
        {/* Eyes */}
        <rect x={6} y={1} width={2} height={2} fill="#333" />
        <rect x={11} y={1} width={2} height={2} fill="#333" />
        {/* Mailman cap */}
        <rect x={3} y={-3} width={14} height={4} fill={hitFlash ? '#6666cc' : '#3344aa'} rx={1} />
        <rect x={2} y={0} width={16} height={2} fill={hitFlash ? '#6666cc' : '#3344aa'} />
        {/* Cap brim */}
        <rect x={14} y={-1} width={5} height={2} fill={hitFlash ? '#5555bb' : '#223399'} rx={1} />
        {/* Mail satchel on back */}
        <rect x={-3} y={5} width={7} height={9} fill="#8b6914" rx={1} />
        <rect x={-2} y={8} width={5} height={1} fill="#ffd700" />
        {/* Letter sticking out */}
        <rect x={-2} y={5} width={4} height={3} fill="#fff" />
        {/* Damage flash */}
        {recentlyHit && hitFlash && <rect x={-4} y={-4} width={24} height={28} fill="#ff0000" opacity={0.15} rx={2} />}
        {/* HP bar */}
        <rect x={0} y={-8} width={20} height={3} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-7} width={Math.max(0, (health / maxHealth) * 18)} height={1.5} fill="#4455aa" rx={1} />
        {showHpNumbers && (
          <text x={10} y={-10} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'archer') {
    // Bow pull animation: string bends back when attacking
    const stringPull = isAttacking ? (1 - attackPhase) * 6 : 0;
    const archerColor = isRoyalGuard ? '#ffd700' : color;
    const hoodColor = isRoyalGuard ? '#b8860b' : (skinColors?.accent || '#3a5a3a');
    const bodyFill = hitFlash ? (isRoyalGuard ? '#ffaa66' : '#ff8888') : archerColor;
    const faceFill = hitFlash ? '#ffaaaa' : '#ffcc99';
    const hoodFill = hitFlash ? (isRoyalGuard ? '#aa6a3a' : '#6a4a3a') : hoodColor;
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
        <rect x={4} y={6} width={12} height={10} fill={bodyFill} />
        <rect x={2} y={0} width={16} height={8} fill={faceFill} />
        <rect x={4} y={2} width={2} height={2} fill="#333" />
        <rect x={12} y={2} width={2} height={2} fill="#333" />
        {/* Hood */}
        <rect x={0} y={-2} width={20} height={6} fill={hoodFill} />
        {/* Crown for Royal Guard */}
        {isRoyalGuard && <>
          <polygon points="2,-8 5,-4 8,-7 10,-4 12,-7 15,-4 18,-8 18,-4 2,-4" fill="#ffd700" />
          <rect x={6} y={-7} width={2} height={2} fill="#ff4444" />
        </>}
        {/* Quiver on back */}
        <rect x={-2} y={4} width={4} height={12} fill={isRoyalGuard ? '#8b6914' : '#5a3a1a'} />
        <line x1={-1} y1={4} x2={-1} y2={0} stroke="#8b5a2a" strokeWidth={1.5} />
        <line x1={1} y1={4} x2={1} y2={1} stroke="#8b5a2a" strokeWidth={1.5} />
        <line x1={0} y1={4} x2={2} y2={-1} stroke="#8b5a2a" strokeWidth={1.5} />
        {/* Bow */}
        <ellipse cx={20} cy={10} rx={3} ry={10} fill={isRoyalGuard ? '#b8860b' : '#8b5a2a'} stroke="#5a3a1a" strokeWidth={1} />
        <line x1={20} y1={0} x2={20 - stringPull} y2={10} stroke="#aaa" strokeWidth={1} />
        <line x1={20 - stringPull} y1={10} x2={20} y2={20} stroke="#aaa" strokeWidth={1} />
        {/* Arrow nocked when attacking */}
        {isAttacking && <line x1={20 - stringPull} y1={10} x2={28} y2={10} stroke="#8b5a2a" strokeWidth={1.5} />}
        {/* Attack flash */}
        {isAttacking && attackPhase < 0.3 && <circle cx={28} cy={10} r={4} fill={archerColor} opacity={0.6} />}
        {/* Legs + boots */}
        <rect x={4} y={16} width={4} height={4} fill="#4a3a2a" />
        <rect x={12} y={16} width={4} height={4} fill="#4a3a2a" />
        <rect x={3} y={20} width={6} height={3} fill="#3a2a1a" />
        <rect x={11} y={20} width={6} height={3} fill="#3a2a1a" />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-4} y={-4} width={36} height={30} fill="#ff0000" opacity={0.15} rx={2} />}
        <rect x={0} y={isRoyalGuard ? -16 : -12} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={isRoyalGuard ? -15 : -11} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill={isRoyalGuard ? '#ffd700' : baseColor} rx={1} />
        {showHpNumbers && (
          <text x={10} y={isRoyalGuard ? -18 : -14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'knight') {
    // Sword swing: rotate forward when attacking
    const swordAngle = isAttacking ? -40 * (1 - attackPhase) : 0;
    const capeWave = Math.sin(frame * 0.15) * 2;
    const armorOuter = hitFlash ? '#aa6666' : (skinColors?.accent || '#888');
    const armorInner = hitFlash ? '#ff8888' : color;
    const helmetOuter = hitFlash ? '#886666' : '#666';
    const helmetInner = hitFlash ? '#664444' : '#444';
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={12} cy={28} rx={10} ry={4} fill="rgba(0,0,0,0.3)" />
        {/* Cape (animated) */}
        <polygon points={`4,8 -2,${24 + capeWave} -4,${26 + capeWave} 6,10`} fill="#3a3a6a" />
        <polygon points={`4,8 -3,${25 + capeWave} -2,${24 + capeWave} 5,10`} fill="#4a4a8a" />
        {/* Armored body */}
        <rect x={4} y={6} width={16} height={14} fill={armorOuter} />
        <rect x={6} y={8} width={12} height={10} fill={armorInner} />
        {/* Helmet */}
        <rect x={2} y={-2} width={20} height={12} fill={helmetOuter} />
        <rect x={6} y={2} width={12} height={6} fill={helmetInner} />
        <rect x={8} y={4} width={3} height={2} fill="#fff" />
        <rect x={13} y={4} width={3} height={2} fill="#fff" />
        {/* Sword (rotates on attack) */}
        <g transform={`translate(24, 4) rotate(${swordAngle}, 0, 9)`}>
          <rect x={0} y={0} width={4} height={18} fill="#aaa" />
          <rect x={-2} y={-2} width={8} height={4} fill={armorInner} />
        </g>
        {/* Attack flash */}
        {isAttacking && attackPhase < 0.3 && (
          <line x1={24} y1={-4} x2={34} y2={16} stroke="#fff" strokeWidth={2} opacity={0.8} strokeLinecap="round" />
        )}
        {/* Shield */}
        <rect x={-4} y={6} width={10} height={14} fill="#4a4a8a" />
        <rect x={-2} y={8} width={6} height={10} fill="#6a6aaa" />
        {/* Shield emblem */}
        <line x1={1} y1={10} x2={1} y2={16} stroke="#aaa" strokeWidth={1} />
        <line x1={-1} y1={13} x2={3} y2={13} stroke="#aaa" strokeWidth={1} />
        {/* Legs + boots */}
        <rect x={4} y={20} width={6} height={4} fill="#4a3a2a" />
        <rect x={14} y={20} width={6} height={4} fill="#4a3a2a" />
        <rect x={3} y={24} width={8} height={3} fill="#3a2a1a" />
        <rect x={13} y={24} width={8} height={3} fill="#3a2a1a" />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-6} y={-4} width={44} height={34} fill="#ff0000" opacity={0.15} rx={2} />}
        <rect x={0} y={-14} width={24} height={5} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-13} width={Math.max(0, (health / maxHealth) * 22)} height={3} fill={baseColor} rx={1} />
        {showHpNumbers && (
          <text x={12} y={-17} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'halberd') {
    // Polearm thrust: weapon extends forward on attack, sweep arc for cleave
    const thrustOffset = isAttacking ? (1 - attackPhase) * 10 : 0;
    const sweepOpacity = isAttacking && attackPhase < 0.4 ? 0.5 : 0;
    const bodyOuter = hitFlash ? '#aa5a4a' : '#8b5a2a';
    const bodyInner = hitFlash ? '#ff8888' : color;
    const faceFill = hitFlash ? '#ffaaaa' : '#ffcc99';
    const shoulderFill = hitFlash ? '#aa5a4a' : '#8b5a2a';
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={10} cy={26} rx={9} ry={3} fill="rgba(0,0,0,0.3)" />
        {/* Body - brown/orange armor */}
        <rect x={3} y={6} width={14} height={12} fill={bodyOuter} />
        <rect x={5} y={8} width={10} height={8} fill={bodyInner} />
        {/* Shoulder guards */}
        <rect x={0} y={4} width={6} height={6} fill={shoulderFill} />
        <rect x={14} y={4} width={6} height={6} fill={shoulderFill} />
        {/* Head */}
        <rect x={3} y={-2} width={14} height={8} fill={faceFill} />
        <rect x={5} y={0} width={2} height={2} fill="#333" />
        <rect x={13} y={0} width={2} height={2} fill="#333" />
        {/* Helmet - simpler than knight, open face */}
        <rect x={1} y={-4} width={18} height={4} fill={hitFlash ? '#8a5a4a' : '#7a5a3a'} />
        <rect x={3} y={-6} width={14} height={4} fill={hitFlash ? '#9b6b5a' : '#8b6b4a'} />
        {/* Polearm staff (long vertical, thrusts forward) */}
        <rect x={18 + thrustOffset} y={-12} width={3} height={32} fill="#5a3a1a" />
        {/* Blade tip */}
        <polygon points={`${19 + thrustOffset},-12 ${21 + thrustOffset},-12 ${22 + thrustOffset},-20 ${18 + thrustOffset},-20`} fill="#bbb" />
        <line x1={20 + thrustOffset} y1={-20} x2={20 + thrustOffset} y2={-12} stroke="#ddd" strokeWidth={1} />
        {/* Blade edge glint */}
        {Math.floor(frame * 0.02) % 3 === 0 && (
          <line x1={20 + thrustOffset} y1={-19} x2={20 + thrustOffset} y2={-15} stroke="#fff" strokeWidth={1.5} opacity={0.6} />
        )}
        {/* Cleave sweep arc */}
        {sweepOpacity > 0 && (
          <path d={`M ${10 + thrustOffset} -2 Q ${26 + thrustOffset} 6, ${10 + thrustOffset} 16`} fill="none" stroke={color} strokeWidth={3} opacity={sweepOpacity} />
        )}
        {/* Legs + boots */}
        <rect x={4} y={18} width={5} height={4} fill="#4a3a2a" />
        <rect x={11} y={18} width={5} height={4} fill="#4a3a2a" />
        <rect x={3} y={22} width={7} height={3} fill="#3a2a1a" />
        <rect x={10} y={22} width={7} height={3} fill="#3a2a1a" />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-2} y={-8} width={28} height={36} fill="#ff0000" opacity={0.15} rx={2} />}
        {/* Health bar */}
        <rect x={0} y={-14} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-13} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill={baseColor} rx={1} />
        {showHpNumbers && (
          <text x={10} y={-16} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'conjurer') {
    // Archaic stone mage — channeling pose, bright mineral colors, orbiting crystal shards
    const channelPulse = Math.sin(frame * 0.1) * 0.15;
    const armRaise = Math.sin(frame * 0.06) * 2; // slow channeling bob
    const robeFill = hitFlash ? '#ff8866' : '#dd8833'; // amber/orange stone robe
    const robeInner = hitFlash ? '#cc7744' : '#aa6622';
    const hoodFill = hitFlash ? '#66ccaa' : '#44aa88'; // teal hood
    const faceFill = hitFlash ? '#ffccaa' : '#e8c8a0'; // weathered skin
    const crystalColor = '#55ddcc'; // bright teal crystal
    const crystalGlow = '#88ffee';
    // Orbiting crystal shard positions
    const shard1X = 10 + Math.sin(frame * 0.08) * 14;
    const shard1Y = 4 + Math.cos(frame * 0.08) * 8;
    const shard2X = 10 + Math.sin(frame * 0.08 + 2.1) * 12;
    const shard2Y = 6 + Math.cos(frame * 0.08 + 2.1) * 6;
    const shard3X = 10 + Math.sin(frame * 0.08 + 4.2) * 13;
    const shard3Y = 2 + Math.cos(frame * 0.08 + 4.2) * 7;
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
        {/* Channeling aura — bright teal ground ring */}
        <ellipse cx={10} cy={24} rx={12 + Math.sin(frame * 0.12) * 2} ry={4}
          fill={crystalColor} opacity={0.08 + channelPulse} />
        {/* Robe body — long, archaic, layered stone-colored */}
        <rect x={1} y={4} width={18} height={16} fill={robeFill} />
        <rect x={3} y={6} width={14} height={12} fill={robeInner} />
        {/* Robe trim — bright teal runes/accents */}
        <rect x={1} y={18} width={18} height={2} fill={hoodFill} />
        <rect x={9} y={6} width={2} height={12} fill={hoodFill} opacity={0.5} />
        {/* Stone/gem belt */}
        <rect x={2} y={14} width={16} height={3} fill="#7a6a4a" />
        <rect x={6} y={14} width={3} height={3} fill={crystalColor} opacity={0.8} />
        <rect x={11} y={14} width={3} height={3} fill="#dd6633" opacity={0.8} />
        {/* Arms raised channeling */}
        <rect x={-4} y={4 + armRaise} width={6} height={3} fill={robeFill} />
        <rect x={-4} y={5 + armRaise} width={3} height={2} fill={faceFill} />
        <rect x={18} y={4 - armRaise} width={6} height={3} fill={robeFill} />
        <rect x={21} y={5 - armRaise} width={3} height={2} fill={faceFill} />
        {/* Head — weathered, aged face */}
        <rect x={3} y={-3} width={14} height={8} fill={faceFill} />
        <rect x={5} y={-1} width={2} height={2} fill="#333" />
        <rect x={13} y={-1} width={2} height={2} fill="#333" />
        {/* Bushy eyebrows */}
        <rect x={4} y={-2} width={4} height={1} fill="#888" />
        <rect x={12} y={-2} width={4} height={1} fill="#888" />
        {/* Short beard */}
        <rect x={6} y={4} width={8} height={3} fill="#aaa" />
        <rect x={8} y={6} width={4} height={2} fill="#999" />
        {/* Archaic hood — wide, ancient */}
        <path d="M0,-6 Q2,-12 10,-14 Q18,-12 20,-6 L20,-2 L0,-2 Z" fill={hoodFill} />
        <path d="M2,-5 Q4,-10 10,-12 Q16,-10 18,-5 L18,-2 L2,-2 Z" fill={hitFlash ? '#88ddcc' : '#55bb99'} />
        {/* Stone circlet on hood — bright orange/amber gems */}
        <rect x={2} y={-6} width={16} height={2} fill="#8a7a5a" />
        <rect x={5} y={-7} width={3} height={3} fill="#ff8844" />
        <rect x={12} y={-7} width={3} height={3} fill={crystalColor} />
        {/* Orbiting crystal shards — bright floating rocks */}
        <polygon
          points={`${shard1X},${shard1Y - 4} ${shard1X - 2.5},${shard1Y} ${shard1X},${shard1Y + 4} ${shard1X + 2.5},${shard1Y}`}
          fill={crystalColor} opacity={0.8}
        />
        <polygon
          points={`${shard2X},${shard2Y - 3} ${shard2X - 2},${shard2Y} ${shard2X},${shard2Y + 3} ${shard2X + 2},${shard2Y}`}
          fill="#ff8844" opacity={0.7}
        />
        <polygon
          points={`${shard3X},${shard3Y - 3.5} ${shard3X - 2},${shard3Y} ${shard3X},${shard3Y + 3.5} ${shard3X + 2},${shard3Y}`}
          fill={crystalGlow} opacity={0.6}
        />
        {/* Crystal glow trails */}
        <circle cx={shard1X} cy={shard1Y} r={3} fill={crystalGlow} opacity={0.15} />
        <circle cx={shard2X} cy={shard2Y} r={2.5} fill="#ffaa66" opacity={0.12} />
        {/* Channeling flash when placing turret */}
        {isAttacking && attackPhase < 0.5 && (
          <>
            <circle cx={10} cy={4} r={16} fill={crystalGlow} opacity={0.2 * (1 - attackPhase)} />
            <line x1={-4} y1={4 + armRaise} x2={10} y2={-4} stroke={crystalColor} strokeWidth={1.5} opacity={0.6} />
            <line x1={24} y1={4 - armRaise} x2={10} y2={-4} stroke={crystalColor} strokeWidth={1.5} opacity={0.6} />
          </>
        )}
        {/* Legs + wrapped sandals — archaic */}
        <rect x={4} y={20} width={4} height={2} fill="#5a4a3a" />
        <rect x={12} y={20} width={4} height={2} fill="#5a4a3a" />
        <rect x={3} y={22} width={6} height={2} fill="#4a3a2a" />
        <rect x={11} y={22} width={6} height={2} fill="#4a3a2a" />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-6} y={-16} width={32} height={44} fill="#ff0000" opacity={0.15} rx={2} />}
        {/* Health bar */}
        <rect x={0} y={-18} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-17} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill={crystalColor} rx={1} />
        {showHpNumbers && (
          <text x={10} y={-20} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'bombard') {
    // Hand-cannon artillery soldier — armored, carrying a portable bombard
    const recoil = isAttacking && attackPhase < 0.4 ? (1 - attackPhase / 0.4) * 6 : 0;
    const fuseSpark = Math.sin(frame * 0.3) > 0;
    const armorFill = hitFlash ? '#ccaa44' : '#8b6914';
    const armorDark = hitFlash ? '#aa8833' : '#6a5010';
    const metalFill = hitFlash ? '#bbbbbb' : '#666';
    const faceFill = hitFlash ? '#ffccaa' : '#e8c0a0';
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
        {/* Body — heavy leather armor */}
        <rect x={3} y={4} width={14} height={14} fill={armorFill} />
        <rect x={5} y={6} width={10} height={10} fill={armorDark} />
        {/* Shoulder plates */}
        <rect x={0} y={3} width={6} height={4} fill={metalFill} rx={1} />
        <rect x={14} y={3} width={6} height={4} fill={metalFill} rx={1} />
        {/* Belt with ammo pouches */}
        <rect x={2} y={15} width={16} height={3} fill="#5a4a2a" />
        <circle cx={6} cy={16} r={2} fill="#444" />
        <circle cx={10} cy={16} r={2} fill="#444" />
        <circle cx={14} cy={16} r={2} fill="#444" />
        {/* Hand-cannon — thick barrel extending forward */}
        <g transform={`translate(${-recoil}, 0)`}>
          <rect x={16} y={7} width={16} height={5} fill="#555" rx={1} />
          <rect x={17} y={8} width={14} height={3} fill="#444" />
          <rect x={30} y={6} width={3} height={7} fill="#666" rx={1} />
          {/* Fuse at the top */}
          {fuseSpark && <circle cx={28} cy={6} r={1.5} fill="#ff8800" />}
          {fuseSpark && <circle cx={28} cy={5} r={1} fill="#ffcc00" />}
        </g>
        {/* Head — helmeted */}
        <rect x={4} y={-4} width={12} height={8} fill={faceFill} />
        <rect x={5} y={-2} width={2} height={2} fill="#333" />
        <rect x={13} y={-2} width={2} height={2} fill="#333" />
        {/* Helmet */}
        <rect x={2} y={-7} width={16} height={5} fill={metalFill} rx={1} />
        <rect x={4} y={-8} width={12} height={3} fill="#777" rx={1} />
        <rect x={2} y={-3} width={16} height={1} fill="#888" />
        {/* Firing flash */}
        {isAttacking && attackPhase < 0.2 && (
          <>
            <circle cx={33 - recoil} cy={10} r={8} fill="#ff8800" opacity={0.4} />
            <circle cx={33 - recoil} cy={10} r={5} fill="#ffcc00" opacity={0.6} />
          </>
        )}
        {/* Legs + boots */}
        <rect x={4} y={18} width={4} height={4} fill="#4a3a2a" />
        <rect x={12} y={18} width={4} height={4} fill="#4a3a2a" />
        <rect x={3} y={22} width={6} height={2} fill="#3a2a1a" />
        <rect x={11} y={22} width={6} height={2} fill="#3a2a1a" />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-4} y={-10} width={40} height={38} fill="#ff0000" opacity={0.15} rx={2} />}
        {/* HP bar */}
        <rect x={0} y={-12} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-11} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill={baseColor} rx={1} />
        {showHpNumbers && (
          <text x={10} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'wizard') {
    // Staff glow pulses on cast
    const orbRadius = isAttacking ? 5 + (1 - attackPhase) * 4 : 5;
    const orbGlow = isAttacking ? 0.9 : 0.6;
    const robeFill = hitFlash ? '#ff6688' : color;
    const robeInner = hitFlash ? '#aa5a7a' : '#7a3aaa';
    const faceFill = hitFlash ? '#ffaaaa' : '#ffcc99';
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
        {/* Robe body */}
        <rect x={2} y={4} width={16} height={14} fill={robeFill} />
        <rect x={4} y={6} width={12} height={10} fill={robeInner} />
        {/* Face */}
        <rect x={4} y={-2} width={12} height={8} fill={faceFill} />
        <rect x={6} y={0} width={2} height={2} fill="#333" />
        <rect x={12} y={0} width={2} height={2} fill="#333" />
        {/* Apprentice hat */}
        <polygon points="10,-16 0,-2 20,-2" fill={robeFill} />
        <rect x={0} y={-4} width={20} height={4} fill={robeInner} />
        {/* Star on hat */}
        <text x={10} y={-8} fontSize="7" textAnchor="middle" fill="#ffff00">★</text>
        {/* Staff */}
        <rect x={20} y={-8} width={3} height={28} fill="#5a3a1a" />
        <circle cx={21} cy={-10} r={orbRadius} fill="#aa55ff" opacity={orbGlow} />
        <circle cx={21} cy={-10} r={Math.min(orbRadius - 2, 3)} fill="#dd88ff" />
        {/* Orbiting sparkle */}
        <circle
          cx={21 + Math.sin(frame * 0.12) * 7}
          cy={-10 + Math.cos(frame * 0.12) * 7}
          r={1.5}
          fill="#ffff00"
          opacity={0.4 + Math.sin(frame * 0.2) * 0.2}
        />
        {/* Cast flash */}
        {isAttacking && attackPhase < 0.4 && (
          <circle cx={21} cy={-10} r={orbRadius + 4} fill="#dd88ff" opacity={0.3} />
        )}
        {/* Legs + boots */}
        <rect x={4} y={18} width={4} height={3} fill="#4a3a2a" />
        <rect x={12} y={18} width={4} height={3} fill="#4a3a2a" />
        <rect x={3} y={21} width={6} height={2} fill="#3a2a1a" />
        <rect x={11} y={21} width={6} height={2} fill="#3a2a1a" />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={0} y={-18} width={26} height={44} fill="#ff0000" opacity={0.15} rx={2} />}
        {/* Health bar */}
        <rect x={0} y={-20} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-19} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill={baseColor} rx={1} />
        {showHpNumbers && (
          <text x={10} y={-22} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'cleric') {
    // Staff orb pulses gently when healing
    const healFlash = isAttacking && attackPhase < 0.5;
    const orbGlow = healFlash ? 0.9 : 0.7;
    const robeFill = hitFlash ? '#ff6666' : '#ff88cc';
    const robeInner = hitFlash ? '#ffaaaa' : '#ffccee';
    const hoodFill = hitFlash ? '#ff6666' : '#ff88cc';
    const faceFill = hitFlash ? '#ffaaaa' : '#ffcc99';
    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
        {/* Healing aura pulse */}
        <circle
          cx={10}
          cy={12}
          r={14 + Math.sin(frame * 0.08) * 2}
          fill="#4aff4a"
          opacity={0.04 + Math.sin(frame * 0.06) * 0.02}
        />
        {/* Robe body */}
        <rect x={2} y={4} width={16} height={14} fill={robeFill} />
        <rect x={4} y={6} width={12} height={10} fill={robeInner} />
        {/* Hood / veil */}
        <rect x={0} y={-4} width={20} height={8} fill={hoodFill} />
        <rect x={2} y={-2} width={16} height={4} fill={hitFlash ? '#ffaaaa' : '#ffaadd'} />
        {/* Face */}
        <rect x={4} y={0} width={12} height={6} fill={faceFill} />
        <rect x={6} y={2} width={2} height={2} fill="#333" />
        <rect x={12} y={2} width={2} height={2} fill="#333" />
        {/* Staff */}
        <rect x={20} y={-6} width={3} height={26} fill="#8b7355" />
        {/* Glowing green orb on staff */}
        <circle cx={21} cy={-8} r={4} fill="#4aff4a" opacity={orbGlow} />
        <circle cx={21} cy={-8} r={2} fill="#aaffaa" />
        {healFlash && <circle cx={21} cy={-8} r={7} fill="#4aff4a" opacity={0.5} />}
        {/* Legs + boots */}
        <rect x={4} y={18} width={4} height={3} fill="#4a3a2a" />
        <rect x={12} y={18} width={4} height={3} fill="#4a3a2a" />
        <rect x={3} y={21} width={6} height={2} fill="#3a2a1a" />
        <rect x={11} y={21} width={6} height={2} fill="#3a2a1a" />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-2} y={-6} width={28} height={32} fill="#ff0000" opacity={0.15} rx={2} />}
        {/* Health bar */}
        <rect x={0} y={-16} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-15} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill={baseColor} rx={1} />
        {showHpNumbers && (
          <text x={10} y={-18} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  if (unitType === 'skeleton') {
    // Risen skeleton ally — bony, ghostly green glow, slow shamble
    const swordOffset = isAttacking ? (1 - attackPhase) * 8 : 0;
    const boneColor = hitFlash ? '#eee8dd' : '#ccc8bb';
    const boneDetail = hitFlash ? '#bbb8aa' : '#aaa898';
    const eyeGlow = '#44ff44';
    const shamble = Math.sin(frame * 0.08 + x) * 2; // slower bob than normal
    return (
      <g transform={`translate(${x}, ${y + shamble})`}>
        {/* Ghostly green aura */}
        <circle cx={10} cy={12} r={16} fill="#44ff88" opacity={0.06 + Math.sin(frame * 0.06) * 0.03} />
        <ellipse cx={10} cy={26} rx={8} ry={3} fill="rgba(0,0,0,0.25)" />
        {/* Rib cage body */}
        <rect x={4} y={6} width={12} height={12} fill={boneColor} />
        <rect x={6} y={7} width={8} height={2} fill={boneDetail} />
        <rect x={6} y={10} width={8} height={2} fill={boneDetail} />
        <rect x={6} y={13} width={8} height={2} fill={boneDetail} />
        {/* Skull head */}
        <rect x={2} y={-2} width={16} height={10} fill={boneColor} rx={2} />
        {/* Eye sockets with green glow */}
        <rect x={4} y={1} width={4} height={4} fill="#222" />
        <rect x={12} y={1} width={4} height={4} fill="#222" />
        <circle cx={6} cy={3} r={1.5} fill={eyeGlow} opacity={0.7 + Math.sin(frame * 0.1) * 0.3} />
        <circle cx={14} cy={3} r={1.5} fill={eyeGlow} opacity={0.7 + Math.sin(frame * 0.1 + 1) * 0.3} />
        {/* Jaw */}
        <rect x={6} y={6} width={8} height={3} fill={boneDetail} />
        <rect x={7} y={7} width={2} height={1} fill="#444" />
        <rect x={11} y={7} width={2} height={1} fill="#444" />
        {/* Rusty sword */}
        <rect x={16 + swordOffset} y={-2} width={2} height={16} fill="#7a6a55" />
        <rect x={14 + swordOffset} y={-4} width={6} height={4} fill="#887766" />
        {/* Attack flash */}
        {isAttacking && attackPhase < 0.3 && (
          <line x1={18 + swordOffset} y1={-4} x2={24 + swordOffset} y2={8} stroke="#44ff88" strokeWidth={2} opacity={0.6} strokeLinecap="round" />
        )}
        {/* Bony legs */}
        <rect x={5} y={18} width={3} height={5} fill={boneDetail} />
        <rect x={12} y={18} width={3} height={5} fill={boneDetail} />
        <rect x={4} y={23} width={5} height={2} fill={boneColor} />
        <rect x={11} y={23} width={5} height={2} fill={boneColor} />
        {/* Green wisps rising */}
        <circle cx={2 + Math.sin(frame * 0.05) * 3} cy={-4 + Math.cos(frame * 0.07) * 3} r={1} fill="#44ff88" opacity={0.3} />
        <circle cx={18 + Math.cos(frame * 0.06) * 3} cy={-2 + Math.sin(frame * 0.08) * 3} r={1} fill="#44ff88" opacity={0.25} />
        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-3} y={-4} width={30} height={30} fill="#44ff44" opacity={0.15} rx={2} />}
        {/* Health bar — green tinted */}
        <rect x={0} y={-12} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-11} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill="#44dd44" rx={1} />
        {showHpNumbers && (
          <text x={10} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // Default soldier - sword thrust forward on attack
  const swordOffset = isAttacking ? (1 - attackPhase) * 8 : 0;
  const bodyFill = hitFlash ? '#ff8888' : color;
  const faceFill = hitFlash ? '#ffaaaa' : '#ffcc99';
  return (
    <g transform={`translate(${x}, ${y + bobOffset})`}>
      <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
      <rect x={4} y={6} width={12} height={10} fill={bodyFill} />
      {/* Belt */}
      <rect x={4} y={14} width={12} height={2} fill="#8a7a4a" />
      <rect x={2} y={0} width={16} height={8} fill={faceFill} />
      <rect x={4} y={2} width={2} height={2} fill="#333" />
      <rect x={12} y={2} width={2} height={2} fill="#333" />
      {/* Small shield */}
      <rect x={-1} y={6} width={6} height={10} fill={hitFlash ? '#6a4a6a' : (skinColors?.accent || '#4a4a8a')} />
      <rect x={0} y={7} width={4} height={8} fill={hitFlash ? '#8a6a8a' : (skinColors?.accent || '#5a5a9a')} />
      {/* Shield glint */}
      {Math.floor(frame * 0.015) % 4 === 0 && (
        <line x1={1} y1={8} x2={3} y2={14} stroke="#fff" strokeWidth={1} opacity={0.5} />
      )}
      {/* Sword (thrusts forward on attack) */}
      <rect x={16 + swordOffset} y={-4} width={2} height={20} fill="#8b7355" />
      <rect x={14 + swordOffset} y={-8} width={6} height={6} fill="#aaa" />
      {/* Attack flash */}
      {isAttacking && attackPhase < 0.3 && (
        <line x1={18 + swordOffset} y1={-8} x2={24 + swordOffset} y2={4} stroke="#fff" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
      )}
      {/* Legs + boots */}
      <rect x={4} y={16} width={4} height={4} fill="#4a3a2a" />
      <rect x={12} y={16} width={4} height={4} fill="#4a3a2a" />
      <rect x={3} y={20} width={6} height={3} fill="#3a2a1a" />
      <rect x={11} y={20} width={6} height={3} fill="#3a2a1a" />
      {/* Damage overlay */}
      {recentlyHit && hitFlash && <rect x={-3} y={-4} width={30} height={30} fill="#ff0000" opacity={0.15} rx={2} />}
      <rect x={0} y={-12} width={20} height={4} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-11} width={Math.max(0, (health / maxHealth) * 18)} height={2} fill={COLORS.healthGreen} rx={1} />
      {showHpNumbers && (
        <text x={10} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
