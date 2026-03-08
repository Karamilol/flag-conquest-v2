import { COLORS } from '../../constants';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  isAttacking: boolean;
  zone?: number;
  bleedStacks?: number;
  bossType?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  summonCooldown?: number;
  howlCooldown?: number;
  enrageTriggered?: boolean;
  pullTimer?: number;
  cleaveCooldown?: number;
  bodyOnly?: boolean;
}

export default function PixelBoss({ x, y, health, maxHealth, frame, isAttacking, zone, bleedStacks, bossType, lastDamageTime = 0, showHpNumbers, summonCooldown = 0, howlCooldown = 0, enrageTriggered = false, pullTimer = 0, cleaveCooldown = 0, bodyOnly = false }: Props) {
  const bobOffset = Math.sin(frame * 0.1) * 3;
  const attackPulse = isAttacking ? Math.sin(frame * 0.5) * 2 : 0;
  // Damage flash
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  // Wild Huntsman variant (bossType === 1)
  if (bossType === 1) {
    const sway = Math.sin(frame * 0.06) * 1.5;
    const cloakOuter = hitFlash ? '#4a5a3a' : '#2a3a1a';
    const cloakInner = hitFlash ? '#3a4a2a' : '#1a2a0a';
    const hoodFill = hitFlash ? '#3a4a2a' : '#1a2a0a';
    const faceFill = hitFlash ? '#2a3a1a' : '#1a1a0a';
    const skinFill = hitFlash ? '#8a7a6a' : '#6a5a4a';
    const bowColor = hitFlash ? '#8a6a3a' : '#6a4a2a';
    const bowString = '#ccc';
    const quiverColor = hitFlash ? '#5a4a2a' : '#3a2a1a';
    // Bow draw animation
    const bowPull = isAttacking ? Math.sin(frame * 0.4) * 4 : 0;
    // Leaf particles drifting around
    const lf1X = 10 + Math.sin(frame * 0.07) * 18;
    const lf1Y = -5 + Math.cos(frame * 0.05) * 8;
    const lf2X = 55 + Math.sin(frame * 0.09 + 2) * 12;
    const lf2Y = 10 + Math.cos(frame * 0.06 + 1) * 6;

    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        {(bleedStacks ?? 0) > 0 && (
          <text x={32} y={-55} fontSize="15" textAnchor="middle" fill="#ff0000">
            🩸{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
          </text>
        )}
        {/* Shadow */}
        <ellipse cx={32} cy={82} rx={22} ry={7} fill="rgba(20,40,10,0.4)" />

        {/* Legs */}
        <rect x={20} y={62} width={8} height={18} fill="#2a2a1a" rx={1} />
        <rect x={36} y={62} width={8} height={18} fill="#2a2a1a" rx={1} />
        {/* Boots */}
        <rect x={18} y={76} width={12} height={5} fill="#3a2a1a" rx={2} />
        <rect x={34} y={76} width={12} height={5} fill="#3a2a1a" rx={2} />

        {/* Cloak / Body */}
        <path d="M12,25 Q8,45 14,75 L50,75 Q56,45 52,25 Z" fill={cloakOuter} />
        <path d="M16,30 Q12,48 18,70 L46,70 Q52,48 48,30 Z" fill={cloakInner} />
        {/* Vine accents on cloak */}
        <path d={`M18,40 Q22,50 20,60`} stroke="#3a6a2a" strokeWidth="1.5" fill="none" opacity={0.5} />
        <path d={`M44,38 Q40,50 42,62`} stroke="#3a6a2a" strokeWidth="1.5" fill="none" opacity={0.4} />
        {/* Leaf patches on cloak */}
        <ellipse cx={20} cy={50} rx={4} ry={2} fill="#3a6a2a" opacity={0.4} />
        <ellipse cx={44} cy={55} rx={3} ry={1.5} fill="#2a5a1a" opacity={0.3} />

        {/* Quiver on back */}
        <rect x={48} y={18} width={8} height={30} fill={quiverColor} rx={2} />
        {/* Arrow shafts poking out */}
        <line x1={50} y1={18} x2={50} y2={10} stroke="#8b7355" strokeWidth="1.5" />
        <line x1={52} y1={18} x2={52} y2={12} stroke="#8b7355" strokeWidth="1.5" />
        <line x1={54} y1={18} x2={54} y2={9} stroke="#8b7355" strokeWidth="1.5" />
        {/* Arrowheads */}
        <polygon points="49,10 50,7 51,10" fill="#888" />
        <polygon points="51,12 52,9 53,12" fill="#888" />
        <polygon points="53,9 54,6 55,9" fill="#888" />

        {/* Massive longbow (behind arm) */}
        <g transform="translate(-2, 5)">
          <path d={`M0,10 Q-10,30 0,55`} stroke={bowColor} strokeWidth="4" fill="none" strokeLinecap="round" />
          <path d={`M0,10 Q-8,30 0,55`} stroke="#8a6a3a" strokeWidth="2" fill="none" opacity={0.4} />
          {/* Vine wrapped around bow */}
          <path d={`M-1,15 Q-6,20 -3,25 Q-8,30 -4,35 Q-8,40 -3,45`} stroke="#3a7a2a" strokeWidth="1" fill="none" opacity={0.5} />
          {/* Bowstring */}
          <line x1={0} y1={10} x2={bowPull + 10} y2={30} stroke={bowString} strokeWidth="1" />
          <line x1={bowPull + 10} y1={30} x2={0} y2={55} stroke={bowString} strokeWidth="1" />
          {/* Nocked arrow when attacking */}
          {isAttacking && (
            <>
              <line x1={bowPull + 10} y1={30} x2={bowPull - 12} y2={30} stroke="#8b7355" strokeWidth="2" />
              <polygon points={`${bowPull - 12},28 ${bowPull - 17},30 ${bowPull - 12},32`} fill="#aaa" />
            </>
          )}
        </g>

        {/* Arms - left arm grips bow */}
        <rect x={-4} y={28} width={14} height={7} fill={skinFill} rx={2} />
        {/* Right arm draws string */}
        <rect x={50} y={28} width={12} height={7} fill={skinFill} rx={2} />

        {/* Head - deep hood */}
        <path d={`M16,5 Q32,${-12 + sway} 48,5 L48,25 L16,25 Z`} fill={hoodFill} />
        {/* Face shadow */}
        <rect x={20} y={10} width={24} height={14} fill={faceFill} rx={2} />

        {/* Glowing green eyes */}
        <circle cx={26} cy={16} r={3.5} fill="#44ff44" opacity={0.9} />
        <circle cx={38} cy={16} r={3.5} fill="#44ff44" opacity={0.9} />
        <circle cx={26} cy={16} r={1.5} fill="#fff" />
        <circle cx={38} cy={16} r={1.5} fill="#fff" />
        {/* Eye glow aura */}
        <circle cx={26} cy={16} r={6} fill="#44ff44" opacity={0.1 + Math.sin(frame * 0.15) * 0.06} />
        <circle cx={38} cy={16} r={6} fill="#44ff44" opacity={0.1 + Math.sin(frame * 0.15 + 1) * 0.06} />

        {/* Attack wind-up glow */}
        {isAttacking && (
          <>
            <circle cx={-2 + bowPull + 10} cy={35} r={6 + Math.sin(frame * 0.6) * 2} fill="#44ff22" opacity={0.3} />
            <circle cx={-2 + bowPull + 10} cy={35} r={3} fill="#88ff66" opacity={0.5} />
          </>
        )}

        {/* Floating leaf particles */}
        <ellipse cx={lf1X} cy={lf1Y} rx={2.5} ry={1.5} fill="#3a7a2a" opacity={0.6}
                 transform={`rotate(${frame * 2 % 360}, ${lf1X}, ${lf1Y})`} />
        <ellipse cx={lf2X} cy={lf2Y} rx={2} ry={1.2} fill="#2a5a1a" opacity={0.5}
                 transform={`rotate(${frame * 1.5 % 360}, ${lf2X}, ${lf2Y})`} />

        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-18} y={-10} width={80} height={95} fill="#ff0000" opacity={0.12} rx={4} />}

        {!bodyOnly && <>
          {/* Health bar */}
          <rect x={-10} y={-30} width={84} height={10} fill={COLORS.healthBg} rx={2} />
          <rect x={-8} y={-28} width={Math.max(0, (health / maxHealth) * 80)} height={6}
                fill="#44aa22" rx={1} />
          <text x={32} y={-34} fill="#66cc44" fontSize="11" textAnchor="middle" fontWeight="bold">
            🏹 WILD HUNTSMAN #{zone !== undefined ? zone + 1 : ''}
          </text>
          {showHpNumbers && (
            <text x={32} y={-42} fontSize="10" textAnchor="middle" fill="#fff" fontWeight="bold">
              {health}/{maxHealth}
            </text>
          )}
        </>}
      </g>
    );
  }

  // Wraith King (bossType === 2) — stationary ranged AOE boss
  if (bossType === 2) {
    const floatY = Math.sin(frame * 0.08) * 4;
    const sway = Math.sin(frame * 0.05) * 2;
    // Spectral body colors
    const robeOuter = hitFlash ? '#5a3a6a' : '#2a1a3a';
    const robeInner = hitFlash ? '#4a2a5a' : '#1a0a2a';
    const crownColor = hitFlash ? '#8a6aaa' : '#6a4a8a';
    const crownGem = '#44ffcc';
    const eyeGlow = '#44ffdd';
    const wispColor = '#8844cc';
    // Cast animation — arms thrust forward with energy pulse
    const castPulse = isAttacking ? Math.sin(frame * 0.5) * 8 : 0;
    const castGlow = isAttacking ? 0.4 + Math.sin(frame * 0.6) * 0.2 : 0;
    // Ethereal wisps
    const w1X = 8 + Math.sin(frame * 0.09) * 15;
    const w1Y = 10 + Math.cos(frame * 0.07) * 12;
    const w2X = 56 + Math.sin(frame * 0.11 + 2) * 12;
    const w2Y = 0 + Math.cos(frame * 0.08 + 1) * 10;
    const w3X = 32 + Math.sin(frame * 0.07 + 4) * 20;
    const w3Y = -10 + Math.cos(frame * 0.06 + 3) * 8;
    // Ghost trail below body
    const trailAlpha = 0.15 + Math.sin(frame * 0.1) * 0.05;

    return (
      <g transform={`translate(${x}, ${y + floatY})`}>
        {(bleedStacks ?? 0) > 0 && (
          <text x={32} y={-60} fontSize="15" textAnchor="middle" fill="#ff0000">
            🩸{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
          </text>
        )}
        {/* Ghost shadow - faint purple pool */}
        <ellipse cx={32} cy={82} rx={28} ry={8} fill="rgba(80,30,120,0.3)" />

        {/* Ethereal trail / wispy bottom (no legs - ghostly) */}
        <path d={`M18,60 Q12,72 8,85 Q14,80 20,82 Q26,85 32,80 Q38,85 44,82 Q50,80 56,85 Q52,72 46,60 Z`}
              fill={robeOuter} opacity={trailAlpha + 0.3} />
        <path d={`M22,62 Q16,74 14,82 Q20,78 26,80 Q32,76 38,80 Q44,78 50,82 Q48,74 42,62 Z`}
              fill={wispColor} opacity={trailAlpha} />
        {/* Inner wispy tendrils */}
        <path d={`M24,65 Q20,75 18,85`} stroke={wispColor} strokeWidth="2" fill="none" opacity={0.2 + Math.sin(frame * 0.12) * 0.1} />
        <path d={`M40,65 Q44,75 46,85`} stroke={wispColor} strokeWidth="2" fill="none" opacity={0.2 + Math.sin(frame * 0.12 + 1) * 0.1} />
        <path d={`M32,62 Q32,76 32,86`} stroke="#6633aa" strokeWidth="1.5" fill="none" opacity={0.15 + Math.sin(frame * 0.1 + 2) * 0.08} />

        {/* Main robe / body */}
        <path d={`M10,20 Q6,40 12,62 L52,62 Q58,40 54,20 Z`} fill={robeOuter} />
        <path d={`M14,24 Q10,42 16,58 L48,58 Q54,42 50,24 Z`} fill={robeInner} />
        {/* Spectral chain / emblem on chest */}
        <circle cx={32} cy={38} r={6} fill="none" stroke="#6644aa" strokeWidth="1.5" opacity={0.6} />
        <circle cx={32} cy={38} r={3} fill={crownGem} opacity={0.4 + Math.sin(frame * 0.12) * 0.15} />
        {/* Tattered edges */}
        <path d={`M12,58 Q10,62 8,60 Q12,64 14,62`} fill={robeOuter} opacity={0.7} />
        <path d={`M50,58 Q54,62 56,60 Q52,64 50,62`} fill={robeOuter} opacity={0.7} />

        {/* Arms — thrust forward when casting */}
        <g transform={`rotate(${-15 + sway + (isAttacking ? -10 : 0)}, 14, 28)`}>
          <path d={`M14,28 Q0,24 ${-14 - castPulse * 0.5},22`}
                stroke={robeOuter} strokeWidth="8" fill="none" strokeLinecap="round" />
          {/* Ghostly clawed hand */}
          <path d={`M${-14 - castPulse * 0.5},22 L${-20 - castPulse * 0.5},18 M${-14 - castPulse * 0.5},22 L${-20 - castPulse * 0.5},24 M${-14 - castPulse * 0.5},22 L${-18 - castPulse * 0.5},28`}
                stroke="#5a3a6a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {/* Cast energy at hands */}
          {isAttacking && <circle cx={-16 - castPulse * 0.5} cy={22} r={5 + castPulse * 0.3} fill="#8844cc" opacity={castGlow} />}
          {isAttacking && <circle cx={-16 - castPulse * 0.5} cy={22} r={3} fill="#44ffdd" opacity={castGlow * 0.8} />}
        </g>
        <g transform={`rotate(${15 - sway + (isAttacking ? 10 : 0)}, 50, 28)`}>
          <path d={`M50,28 Q64,24 ${78 + castPulse * 0.5},22`}
                stroke={robeOuter} strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d={`M${78 + castPulse * 0.5},22 L${84 + castPulse * 0.5},18 M${78 + castPulse * 0.5},22 L${84 + castPulse * 0.5},24 M${78 + castPulse * 0.5},22 L${82 + castPulse * 0.5},28`}
                stroke="#5a3a6a" strokeWidth="2" fill="none" strokeLinecap="round" />
          {isAttacking && <circle cx={80 + castPulse * 0.5} cy={22} r={5 + castPulse * 0.3} fill="#8844cc" opacity={castGlow} />}
          {isAttacking && <circle cx={80 + castPulse * 0.5} cy={22} r={3} fill="#44ffdd" opacity={castGlow * 0.8} />}
        </g>

        {/* Head - hooded spectral face */}
        <path d={`M16,2 Q32,${-14 + sway} 48,2 L50,22 L14,22 Z`} fill={robeOuter} />
        {/* Dark face void */}
        <rect x={18} y={6} width={28} height={15} fill="#0a0014" rx={3} />

        {/* Glowing cyan eyes */}
        <circle cx={25} cy={12} r={4} fill={eyeGlow} opacity={0.9} />
        <circle cx={39} cy={12} r={4} fill={eyeGlow} opacity={0.9} />
        <circle cx={25} cy={12} r={2} fill="#fff" />
        <circle cx={39} cy={12} r={2} fill="#fff" />
        {/* Eye glow aura - pulsing */}
        <circle cx={25} cy={12} r={7} fill={eyeGlow} opacity={0.12 + Math.sin(frame * 0.15) * 0.08} />
        <circle cx={39} cy={12} r={7} fill={eyeGlow} opacity={0.12 + Math.sin(frame * 0.15 + 1) * 0.08} />

        {/* Spectral crown */}
        <path d={`M14,2 L18,-8 L24,-2 L28,-10 L32,-4 L36,-10 L40,-2 L46,-8 L50,2 Z`}
              fill={crownColor} stroke="#9a7aba" strokeWidth="0.5" />
        {/* Crown gems */}
        <circle cx={24} cy={-2} r={2} fill={crownGem} opacity={0.8 + Math.sin(frame * 0.2) * 0.15} />
        <circle cx={32} cy={-5} r={2.5} fill={crownGem} opacity={0.9 + Math.sin(frame * 0.2 + 0.5) * 0.1} />
        <circle cx={40} cy={-2} r={2} fill={crownGem} opacity={0.8 + Math.sin(frame * 0.2 + 1) * 0.15} />

        {/* Floating spectral wisps */}
        <circle cx={w1X} cy={w1Y} r={3} fill={wispColor} opacity={0.25 + Math.sin(frame * 0.1) * 0.1} />
        <circle cx={w2X} cy={w2Y} r={2.5} fill="#6633aa" opacity={0.2 + Math.sin(frame * 0.12 + 1) * 0.08} />
        <circle cx={w3X} cy={w3Y} r={2} fill={eyeGlow} opacity={0.15 + Math.sin(frame * 0.09 + 2) * 0.08} />

        {/* Spectral casting aura during attack */}
        {isAttacking && (
          <>
            <ellipse cx={32} cy={30} rx={25 + castPulse} ry={30 + castPulse * 0.5} fill="#8844cc" opacity={castGlow * 0.3} />
            <ellipse cx={32} cy={30} rx={15 + castPulse * 0.5} ry={18 + castPulse * 0.3} fill="#44ffdd" opacity={castGlow * 0.15} />
          </>
        )}

        {/* Spectral aura around whole body */}
        <ellipse cx={32} cy={35} rx={30} ry={35} fill={wispColor} opacity={0.04 + Math.sin(frame * 0.08) * 0.02} />

        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-20} y={-15} width={104} height={105} fill="#ff0000" opacity={0.12} rx={4} />}

        {/* Health bar */}
        <rect x={-10} y={-35} width={84} height={10} fill={COLORS.healthBg} rx={2} />
        <rect x={-8} y={-33} width={Math.max(0, (health / maxHealth) * 80)} height={6}
              fill="#8844cc" rx={1} />
        <text x={32} y={-39} fill="#bb88ee" fontSize="11" textAnchor="middle" fontWeight="bold">
          👻 WRAITH KING #{zone !== undefined ? zone + 1 : ''}
        </text>
        {showHpNumbers && (
          <text x={32} y={-47} fontSize="10" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // Broodmother (bossType === 3)
  if (bossType === 3) {
    const legSway = Math.sin(frame * 0.12) * 3;
    const eggPulse = 1 + Math.sin(frame * 0.07) * 0.04;
    const jawDrop = isAttacking ? Math.sin(frame * 0.5) * 6 : 0;
    const howlGlow = summonCooldown > 155 ? 0.3 + Math.sin(frame * 0.4) * 0.15 : 0;
    const bodyColor = hitFlash ? '#5a2a12' : '#3d1a0a';
    const bellyColor = hitFlash ? '#6a3a1a' : '#5a2a12';
    const eggColor = hitFlash ? '#9a7a3a' : '#8a6a2a';
    const eyeColor = '#ffaa00';
    // Paw orbit wisps
    const paw1X = 32 + Math.cos(frame * 0.06) * 35;
    const paw1Y = 20 + Math.sin(frame * 0.06) * 18;
    const paw2X = 32 + Math.cos(frame * 0.06 + 2.1) * 35;
    const paw2Y = 20 + Math.sin(frame * 0.06 + 2.1) * 18;
    const paw3X = 32 + Math.cos(frame * 0.06 + 4.2) * 35;
    const paw3Y = 20 + Math.sin(frame * 0.06 + 4.2) * 18;

    return (
      <g transform={`translate(${x}, ${y + bobOffset})`}>
        {(bleedStacks ?? 0) > 0 && (
          <text x={32} y={-55} fontSize="15" textAnchor="middle" fill="#ff0000">
            {'\u{1FA78}'}{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
          </text>
        )}
        {/* Ground shadow */}
        <ellipse cx={40} cy={78} rx={40} ry={10} fill="rgba(60,20,0,0.4)" />

        {/* Howl aura warning */}
        {howlGlow > 0 && <ellipse cx={32} cy={35} rx={45} ry={35} fill="#cc4400" opacity={howlGlow} />}

        {/* Back legs */}
        <g transform={`translate(0, ${legSway * 0.5})`}>
          <path d="M50,52 Q62,60 68,72 Q70,76 66,74 L54,62 Z" fill={bodyColor} />
          <path d="M55,54 Q66,62 72,70 Q74,74 70,72 L58,60 Z" fill={bodyColor} />
        </g>
        <g transform={`translate(0, ${-legSway * 0.5})`}>
          <path d="M14,52 Q2,60 -4,72 Q-6,76 -2,74 L10,62 Z" fill={bodyColor} />
          <path d="M10,54 Q-2,62 -8,70 Q-10,74 -6,72 L6,60 Z" fill={bodyColor} />
        </g>

        {/* Front legs */}
        <g transform={`translate(0, ${-legSway * 0.3})`}>
          <path d="M18,48 Q8,56 2,68 Q0,72 4,70 L16,58 Z" fill={bodyColor} />
        </g>
        <g transform={`translate(0, ${legSway * 0.3})`}>
          <path d="M46,48 Q56,56 62,68 Q64,72 60,70 L48,58 Z" fill={bodyColor} />
        </g>

        {/* Underbelly */}
        <ellipse cx={38} cy={48} rx={22} ry={12} fill={bellyColor} />

        {/* Main torso */}
        <ellipse cx={38} cy={42} rx={32} ry={22} fill={bodyColor} stroke="#4a2a1a" strokeWidth="1" />

        {/* Fur texture */}
        <path d="M18,30 Q22,26 26,30" stroke="#4a2a1a" strokeWidth="1" fill="none" opacity={0.5} />
        <path d="M36,28 Q40,24 44,28" stroke="#4a2a1a" strokeWidth="1" fill="none" opacity={0.5} />
        <path d="M50,34 Q54,30 58,34" stroke="#4a2a1a" strokeWidth="1" fill="none" opacity={0.4} />

        {/* Egg sac bumps */}
        <ellipse cx={38} cy={26} rx={10 * eggPulse} ry={8 * eggPulse} fill={eggColor} opacity={0.9} />
        <ellipse cx={24} cy={30} rx={8 * eggPulse} ry={6 * eggPulse} fill="#7a5a20" opacity={0.8} />
        <ellipse cx={52} cy={30} rx={8 * eggPulse} ry={6 * eggPulse} fill="#7a5a20" opacity={0.8} />
        {/* Egg sheen */}
        <ellipse cx={36} cy={24} rx={4} ry={3} fill="#aa8a3a" opacity={0.3} />

        {/* Neck + Head (low-slung wolf head) */}
        <ellipse cx={6} cy={44} rx={16} ry={12} fill={bodyColor} stroke="#4a2a1a" strokeWidth="1" />

        {/* Maw / jaw */}
        <rect x={-12} y={48 + jawDrop * 0.5} width={22} height={7 + jawDrop * 0.3} fill="#2a0a0a" rx={2} />
        {/* Teeth */}
        <polygon points="-6,48 -4,52 -2,48" fill="#ddd" opacity={0.8} />
        <polygon points="0,48 2,52 4,48" fill="#ddd" opacity={0.8} />
        <polygon points="6,48 8,52 10,48" fill="#ddd" opacity={0.8} />

        {/* Eyes */}
        <circle cx={0} cy={40} r={4} fill={eyeColor} opacity={0.9} />
        <circle cx={12} cy={40} r={4} fill={eyeColor} opacity={0.9} />
        <circle cx={0} cy={40} r={2} fill="#fff" />
        <circle cx={12} cy={40} r={2} fill="#fff" />
        {/* Eye glow */}
        <circle cx={0} cy={40} r={6} fill={eyeColor} opacity={0.12 + Math.sin(frame * 0.15) * 0.06} />
        <circle cx={12} cy={40} r={6} fill={eyeColor} opacity={0.12 + Math.sin(frame * 0.15 + 1) * 0.06} />

        {/* Ear */}
        <polygon points="-4,32 2,22 8,34" fill={bodyColor} stroke="#4a2a1a" strokeWidth="0.5" />

        {/* Paw orbit wisps */}
        <text x={paw1X} y={paw1Y} fontSize="9" textAnchor="middle" opacity={0.35}>{'\u{1F43E}'}</text>
        <text x={paw2X} y={paw2Y} fontSize="8" textAnchor="middle" opacity={0.3}>{'\u{1F43E}'}</text>
        <text x={paw3X} y={paw3Y} fontSize="7" textAnchor="middle" opacity={0.25}>{'\u{1F43E}'}</text>

        {/* Attack glow */}
        {isAttacking && (
          <>
            <circle cx={6} cy={44} r={18 + Math.sin(frame * 0.6) * 4} fill="#cc4400" opacity={0.2} />
            <circle cx={6} cy={44} r={8} fill="#ff6600" opacity={0.3} />
          </>
        )}

        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-20} y={-15} width={100} height={100} fill="#ff0000" opacity={0.12} rx={4} />}

        {/* Health bar */}
        <rect x={-10} y={-30} width={84} height={10} fill={COLORS.healthBg} rx={2} />
        <rect x={-8} y={-28} width={Math.max(0, (health / maxHealth) * 80)} height={6}
              fill="#cc4400" rx={1} />
        <text x={32} y={-34} fill="#ff8844" fontSize="11" textAnchor="middle" fontWeight="bold">
          {'\u{1F43A}'} BROODMOTHER #{zone !== undefined ? zone + 1 : ''}
        </text>
        {showHpNumbers && (
          <text x={32} y={-42} fontSize="10" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // Dungeon Lich (bossType === 4) — 2x scaled regular lich with crown
  if (bossType === 4) {
    const floatOffset = Math.sin(frame * 0.08) * 3;
    const eyePulse = 0.6 + Math.sin(frame * 0.12) * 0.3;
    const auraIntensity = 0.2 + (isAttacking ? 0.15 : 0);
    const wispSpeed = isAttacking ? 0.25 : 0.12;
    const crownColor = hitFlash ? '#ffee88' : '#ffcc22';
    const crownGem = '#44ff44';

    return (
      <g transform={`translate(${x}, ${y + floatOffset}) scale(2)`}>
        {(bleedStacks ?? 0) > 0 && (
          <text x={15} y={-32} fontSize="8" textAnchor="middle" fill="#ff0000">
            {'\u{1FA78}'}{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
          </text>
        )}
        {/* Ground shadow */}
        <ellipse cx={15} cy={42} rx={16} ry={5} fill="rgba(0,60,0,0.35)" />
        {/* Necromantic ground aura */}
        <ellipse cx={15} cy={42} rx={18} ry={6} fill="#44ff44" opacity={auraIntensity} />

        {/* Robe */}
        <path d="M3,40 Q0,22 8,10 L12,8 L18,8 L22,10 Q30,22 27,40 Q20,44 15,42 Q10,44 3,40"
          fill={hitFlash ? '#2a1a3e' : '#0e0e1e'} stroke={hitFlash ? '#4a3a5e' : '#1a1a3a'} strokeWidth="1" />
        {/* Inner robe detail */}
        <path d="M8,38 Q7,24 12,14 L15,12 L18,14 Q23,24 22,38"
          fill="#080818" opacity={0.7} />

        {/* Hood */}
        <path d="M6,12 Q6,0 15,-2 Q24,0 24,12 Q20,16 15,15 Q10,16 6,12"
          fill={hitFlash ? '#2a1a3e' : '#0e0e1e'} stroke={hitFlash ? '#4a3a5e' : '#1a1a3a'} strokeWidth="1" />

        {/* Skull face */}
        <ellipse cx={15} cy={8} rx={6} ry={6} fill={hitFlash ? '#eeddcc' : '#d4c8b0'} />
        <ellipse cx={15} cy={10} rx={4} ry={3} fill={hitFlash ? '#ddccbb' : '#c4b8a0'} />
        {/* Hollow eye sockets */}
        <ellipse cx={12} cy={6} rx={2.5} ry={2} fill="#111" />
        <ellipse cx={18} cy={6} rx={2.5} ry={2} fill="#111" />
        {/* Green eye glow */}
        <circle cx={12} cy={6} r={1.5} fill="#44ff44" opacity={eyePulse} />
        <circle cx={18} cy={6} r={1.5} fill="#44ff44" opacity={eyePulse} />
        {/* Nose hole */}
        <circle cx={15} cy={9} r={1} fill="#8a7a60" />
        {/* Jaw line */}
        <rect x={11} y={12} width={8} height={2} fill="#baa890" rx={1} />

        {/* === CROWN === */}
        <rect x={7} y={-5} width={16} height={3} fill={crownColor} rx={1} />
        <polygon points="7,-5 9,-10 11,-5" fill={crownColor} />
        <polygon points="13,-5 15,-11 17,-5" fill={crownColor} />
        <polygon points="19,-5 21,-10 23,-5" fill={crownColor} />
        <circle cx={9} cy={-8} r={1} fill={crownGem} opacity={0.8 + Math.sin(frame * 0.12) * 0.2} />
        <circle cx={15} cy={-9} r={1.2} fill={crownGem} opacity={0.9 + Math.sin(frame * 0.1) * 0.1} />
        <circle cx={21} cy={-8} r={1} fill={crownGem} opacity={0.8 + Math.sin(frame * 0.12 + 1) * 0.2} />

        {/* Staff */}
        <g transform="translate(26, -8)">
          <rect x={0} y={6} width={3} height={44} fill="#5a4a35" />
          <rect x={0.5} y={6} width={2} height={44} fill="#6b5a45" opacity={0.6} />
          <ellipse cx={1.5} cy={4} rx={4} ry={4} fill="#c8bca0" />
          <circle cx={0} cy={3} r={1.2} fill="#111" />
          <circle cx={3} cy={3} r={1.2} fill="#111" />
          <circle cx={1.5} cy={4} r={6} fill="#44ff44" opacity={0.08 + Math.sin(frame * 0.1) * 0.04} />
        </g>

        {/* Soul wisps orbiting */}
        <circle cx={15 + Math.sin(frame * wispSpeed) * 18} cy={20 + Math.cos(frame * wispSpeed) * 12}
          r={2} fill="#44ff44" opacity={0.5} />
        <circle cx={15 + Math.sin(frame * wispSpeed + 2.1) * 16} cy={18 + Math.cos(frame * wispSpeed + 2.1) * 10}
          r={1.5} fill="#66ff66" opacity={0.4} />
        <circle cx={15 + Math.sin(frame * wispSpeed + 4.2) * 14} cy={22 + Math.cos(frame * wispSpeed + 4.2) * 8}
          r={1.8} fill="#33dd33" opacity={0.35} />

        {/* Hit flash */}
        {recentlyHit && hitFlash && (
          <rect x={0} y={-4} width={30} height={48} fill="#00ff00" opacity={0.1} rx={4} />
        )}

        {/* Casting aura */}
        {isAttacking && (
          <circle cx={15} cy={20} r={20 + Math.sin(frame * 0.4) * 3} fill="#44ff44" opacity={0.12} />
        )}

        {/* Health bar */}
        <rect x={-2} y={-16} width={34} height={4} fill="#333" rx={1} />
        <rect x={-2} y={-16} width={34 * Math.max(0, health / maxHealth)} height={4} fill="#44cc44" rx={1} />
        <text x={15} y={-19} fill="#44ff44" fontSize="5" textAnchor="middle" fontWeight="bold">
          {'\u{1F451}'} DUNGEON LICH
        </text>
        {showHpNumbers && (
          <text x={15} y={-23} fontSize="5" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // Ice Conjurer (bossType === 5) — Frost mage
  if (bossType === 5) {
    const robeBase = hitFlash ? '#4a5a8a' : '#2a3a6a';
    const robeLight = hitFlash ? '#5a6a9a' : '#3a4a7a';
    const hoodDark = hitFlash ? '#2a3a5a' : '#1a2a4a';
    const iceGlow = '#44ddff';
    const frostAccent = '#aaddff';
    const staffColor = hitFlash ? '#6a5a4a' : '#4a3a2a';
    const castPulse = isAttacking ? Math.sin(frame * 0.8) * 3 : 0;
    const auraIntensity = enrageTriggered ? 0.12 : 0.04;

    return (
      <g transform={`translate(${x - 25}, ${y - 12})`}>
        {/* Shadow */}
        <ellipse cx={25} cy={88} rx={22} ry={4} fill="#000" opacity={0.15} />

        {/* Frost aura (stronger when enraged) */}
        <ellipse cx={25} cy={50} rx={35} ry={40} fill={iceGlow} opacity={auraIntensity + Math.sin(frame * 0.06) * 0.02} />

        {/* Robe body */}
        <polygon points="10,40 5,85 45,85 40,40" fill={robeBase} />
        <polygon points="15,42 8,82 25,82 22,42" fill={robeLight} opacity={0.3} />
        {/* Robe bottom trim */}
        <line x1={5} y1={85} x2={45} y2={85} stroke={frostAccent} strokeWidth={1.5} opacity={0.5} />

        {/* Frost rune patterns on robe */}
        {[0, 1, 2].map(i => (
          <circle key={`rune${i}`} cx={18 + i * 7} cy={60 + i * 6} r={2} fill={iceGlow} opacity={0.2 + Math.sin(frame * 0.1 + i) * 0.1} />
        ))}

        {/* Staff (right hand) */}
        <line x1={38} y1={20} x2={40} y2={80} stroke={staffColor} strokeWidth={3} strokeLinecap="round" />
        <line x1={38} y1={20} x2={40} y2={80} stroke="#5a4a3a" strokeWidth={1.5} strokeLinecap="round" />
        {/* Staff crystal */}
        <polygon points="38,12 34,20 38,22 42,20" fill={iceGlow} opacity={0.8} />
        <polygon points="38,12 34,20 38,22 42,20" fill="#fff" opacity={0.3} />
        {/* Crystal glow */}
        <circle cx={38} cy={18} r={6 + castPulse} fill={iceGlow} opacity={0.15 + (isAttacking ? 0.15 : 0)} />

        {/* Arms */}
        <rect x={6} y={42} width={8} height={4} fill={robeBase} rx={2} /> {/* left arm */}
        <rect x={36} y={42} width={8} height={4} fill={robeBase} rx={2} /> {/* right arm holding staff */}
        {/* Hands */}
        <circle cx={8} cy={46} r={3} fill="#88aacc" />
        <circle cx={40} cy={46} r={3} fill="#88aacc" />

        {/* Hood */}
        <ellipse cx={25} cy={30} rx={16} ry={14} fill={robeBase} />
        <ellipse cx={25} cy={28} rx={14} ry={11} fill={hoodDark} />
        {/* Hood point */}
        <polygon points="22,16 25,8 28,16" fill={robeBase} />

        {/* Eyes (glowing from shadow of hood) */}
        <circle cx={20} cy={32} r={2} fill={iceGlow} opacity={0.9} />
        <circle cx={30} cy={32} r={2} fill={iceGlow} opacity={0.9} />
        <circle cx={20} cy={32} r={1} fill="#fff" />
        <circle cx={30} cy={32} r={1} fill="#fff" />
        {/* Eye glow halo */}
        <circle cx={20} cy={32} r={4} fill={iceGlow} opacity={0.1} />
        <circle cx={30} cy={32} r={4} fill={iceGlow} opacity={0.1} />

        {/* Casting sparkles */}
        {isAttacking && (
          <>
            <circle cx={8 + Math.sin(frame * 0.5) * 5} cy={40 + Math.cos(frame * 0.4) * 3} r={1.5} fill={frostAccent} opacity={0.6} />
            <circle cx={42 + Math.cos(frame * 0.6) * 4} cy={38 + Math.sin(frame * 0.5) * 4} r={1.5} fill={iceGlow} opacity={0.6} />
            <circle cx={25 + Math.sin(frame * 0.7) * 8} cy={35 + Math.cos(frame * 0.3) * 5} r={1} fill="#fff" opacity={0.5} />
          </>
        )}

        {/* Enrage visual: cracked ice ground */}
        {enrageTriggered && (
          <>
            <line x1={5} y1={86} x2={15} y2={88} stroke={iceGlow} strokeWidth={1} opacity={0.3} />
            <line x1={20} y1={87} x2={30} y2={86} stroke={iceGlow} strokeWidth={1} opacity={0.3} />
            <line x1={35} y1={86} x2={45} y2={88} stroke={iceGlow} strokeWidth={1} opacity={0.3} />
            <ellipse cx={25} cy={50} rx={30} ry={35} fill={iceGlow} opacity={0.04 + Math.sin(frame * 0.15) * 0.03} />
          </>
        )}

        {/* Frost mist particles at feet */}
        {[0, 1, 2, 3].map(i => (
          <circle key={`mist${i}`} cx={10 + i * 10 + Math.sin(frame * 0.04 + i * 2) * 5} cy={84 + Math.cos(frame * 0.05 + i) * 2} r={2 + Math.sin(frame * 0.03 + i) * 1} fill={frostAccent} opacity={0.12} />
        ))}

        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-5} y={10} width={60} height={78} fill="#ff0000" opacity={0.12} rx={4} />}

        {/* Health bar */}
        <rect x={-5} y={-5} width={60} height={8} fill={COLORS.healthBg} rx={2} />
        <rect x={-3} y={-3} width={Math.max(0, (health / maxHealth) * 56)} height={4} fill="#44ddff" rx={1} />
        <text x={25} y={-9} fill="#44ddff" fontSize="9" textAnchor="middle" fontWeight="bold">
          ❄️ ICE CONJURER #{zone !== undefined ? zone + 1 : ''}
        </text>
        {showHpNumbers && (
          <text x={25} y={-17} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // White Ninja (bossType === 6) — stationary ninja with shurikens + teleport assassinate
  if (bossType === 6) {
    const clothBase = hitFlash ? '#ffffff' : '#eeeee8';
    const clothDark = hitFlash ? '#dddddd' : '#ccccbb';
    const sashColor = hitFlash ? '#cc4444' : '#aa2222';
    const skinColor = hitFlash ? '#ffddcc' : '#eeccaa';
    const eyeColor = '#222';

    // Animation
    const throwArm = isAttacking ? Math.sin(frame * 0.8) * 6 : 0;
    const sway = Math.sin(frame * 0.06) * 1;

    return (
      <g transform={`translate(${x - 25}, ${y - 12 + bobOffset})`}>
        {/* Shadow */}
        <ellipse cx={25} cy={88} rx={18} ry={4} fill="#000" opacity={0.15} />

        {/* Legs */}
        <rect x={17} y={68} width={5} height={17} fill={clothBase} rx={1} />
        <rect x={28} y={68} width={5} height={17} fill={clothBase} rx={1} />
        {/* Sandals */}
        <rect x={16} y={84} width={7} height={3} fill="#665544" rx={1} />
        <rect x={27} y={84} width={7} height={3} fill="#665544" rx={1} />

        {/* Body — gi/tunic */}
        <polygon points="14,38 10,70 40,70 36,38" fill={clothBase} />
        <polygon points="24,38 22,70 28,70 26,38" fill={clothDark} opacity={0.2} />
        {/* Sash/belt */}
        <rect x={12} y={55} width={26} height={4} fill={sashColor} rx={1} />
        {/* Sash knot */}
        <polygon points="38,55 42,57 38,59" fill={sashColor} />

        {/* Arms */}
        <line x1={14} y1={42} x2={6 - throwArm} y2={55 + sway} stroke={clothBase} strokeWidth={4} strokeLinecap="round" />
        <line x1={36} y1={42} x2={44 + throwArm} y2={55 + sway} stroke={clothBase} strokeWidth={4} strokeLinecap="round" />
        {/* Hands */}
        <circle cx={5 - throwArm} cy={56 + sway} r={2.5} fill={skinColor} />
        <circle cx={45 + throwArm} cy={56 + sway} r={2.5} fill={skinColor} />

        {/* Head wrap / hood */}
        <ellipse cx={25} cy={28} rx={11} ry={10} fill={clothBase} />
        <ellipse cx={25} cy={26} rx={10} ry={8} fill={clothDark} opacity={0.15} />
        {/* Mask — covers lower face */}
        <rect x={16} y={30} width={18} height={6} fill={clothDark} rx={2} />

        {/* Eyes — narrow slits */}
        <line x1={19} y1={27} x2={23} y2={27} stroke={eyeColor} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={27} y1={27} x2={31} y2={27} stroke={eyeColor} strokeWidth={1.5} strokeLinecap="round" />

        {/* Headband */}
        <rect x={14} y={22} width={22} height={3} fill={sashColor} rx={1} />
        {/* Headband tails */}
        <line x1={36} y1={23} x2={42} y2={28} stroke={sashColor} strokeWidth={2} strokeLinecap="round" />
        <line x1={36} y1={24} x2={40} y2={31} stroke={sashColor} strokeWidth={1.5} strokeLinecap="round" />

        {/* Shuriken in hand when attacking */}
        {isAttacking && (
          <>
            <polygon points={`${3 - throwArm},${52 + sway} ${5 - throwArm},${48 + sway} ${7 - throwArm},${52 + sway} ${5 - throwArm},${56 + sway}`}
              fill="#ccc" stroke="#999" strokeWidth={0.5} />
            <polygon points={`${43 + throwArm},${52 + sway} ${45 + throwArm},${48 + sway} ${47 + throwArm},${52 + sway} ${45 + throwArm},${56 + sway}`}
              fill="#ccc" stroke="#999" strokeWidth={0.5} />
          </>
        )}

        {/* Damage flash */}
        {recentlyHit && hitFlash && <rect x={-2} y={15} width={54} height={72} fill="#ff0000" opacity={0.12} rx={4} />}

        {/* Health bar */}
        <rect x={-5} y={-5} width={60} height={8} fill={COLORS.healthBg} rx={2} />
        <rect x={-3} y={-3} width={Math.max(0, (health / maxHealth) * 56)} height={4} fill="#eeeeee" rx={1} />
        <text x={25} y={-9} fill="#eee" fontSize="9" textAnchor="middle" fontWeight="bold">
          🥷 SNOW NINJA #{zone !== undefined ? zone + 1 : ''}
        </text>
        {showHpNumbers && (
          <text x={25} y={-17} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // Infernal General (bossType === 7) — demonic armored commander with fire aura
  if (bossType === 7) {
    const fireFlicker = Math.sin(frame * 0.15) * 0.08;
    const armorBase = hitFlash ? '#6a2210' : '#3a1008';
    const armorLight = hitFlash ? '#8a3218' : '#5a2010';
    const skinDark = hitFlash ? '#4a1a0a' : '#2a0a00';
    const fireColor = '#ff4400';
    const fireGlow = '#ff8800';
    const hornColor = hitFlash ? '#4a3a2a' : '#2a1a0a';
    const eyeColor = '#ffcc00';
    const sway = Math.sin(frame * 0.05) * 1.5;
    const armSwing = isAttacking ? Math.sin(frame * 0.6) * 8 : 0;
    const enrageGlow = enrageTriggered ? 0.15 + Math.sin(frame * 0.1) * 0.05 : 0.05;
    const isPulling = pullTimer > 0;
    const pullGlow = isPulling ? 0.3 + Math.sin(frame * 0.4) * 0.15 : 0;

    return (
      <g transform={`translate(${x - 25}, ${y - 16 + bobOffset})`}>
        {(bleedStacks ?? 0) > 0 && (
          <text x={25} y={-60} fontSize="15" textAnchor="middle" fill="#ff0000">
            {'\u{1FA78}'}{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
          </text>
        )}
        {/* Shadow */}
        <ellipse cx={25} cy={92} rx={24} ry={6} fill="rgba(100,20,0,0.4)" />

        {/* Pull warning aura */}
        {isPulling && (
          <ellipse cx={25} cy={50} rx={60 + Math.sin(frame * 0.5) * 10} ry={45} fill={fireColor} opacity={pullGlow} />
        )}

        {/* Fire aura (stronger when enraged) */}
        <ellipse cx={25} cy={45} rx={35} ry={40} fill={fireColor} opacity={enrageGlow + fireFlicker} />

        {/* Legs — armored greaves */}
        <rect x={15} y={72} width={7} height={18} fill={armorBase} rx={1} />
        <rect x={28} y={72} width={7} height={18} fill={armorBase} rx={1} />
        {/* Boots */}
        <rect x={13} y={87} width={11} height={5} fill={armorLight} rx={2} />
        <rect x={26} y={87} width={11} height={5} fill={armorLight} rx={2} />
        {/* Knee guards */}
        <rect x={14} y={72} width={9} height={4} fill={armorLight} rx={1} />
        <rect x={27} y={72} width={9} height={4} fill={armorLight} rx={1} />

        {/* Body — heavy demonic plate armor */}
        <polygon points="8,40 4,72 46,72 42,40" fill={armorBase} />
        <polygon points="12,42 8,70 25,70 22,42" fill={armorLight} opacity={0.25} />
        {/* Chest plate details */}
        <path d="M18,48 L25,44 L32,48" stroke={fireColor} strokeWidth={1} fill="none" opacity={0.4} />
        <circle cx={25} cy={52} r={3} fill={fireColor} opacity={0.3 + Math.sin(frame * 0.12) * 0.15} />
        {/* Belt */}
        <rect x={8} y={62} width={34} height={4} fill={armorLight} rx={1} />
        <circle cx={25} cy={64} r={2.5} fill={fireGlow} opacity={0.5} />

        {/* Pauldrons (shoulder armor) */}
        <ellipse cx={8} cy={42} rx={8} ry={5} fill={armorLight} stroke={armorBase} strokeWidth={1} />
        <ellipse cx={42} cy={42} rx={8} ry={5} fill={armorLight} stroke={armorBase} strokeWidth={1} />
        {/* Spikes on pauldrons */}
        <polygon points="4,38 2,30 8,37" fill={hornColor} />
        <polygon points="46,38 48,30 42,37" fill={hornColor} />

        {/* Arms */}
        <g transform={`rotate(${-5 + sway - armSwing * 0.5}, 8, 42)`}>
          <rect x={-4} y={42} width={6} height={20} fill={armorBase} rx={2} />
          <circle cx={-1} cy={64} r={3} fill={skinDark} />
        </g>
        <g transform={`rotate(${5 - sway + armSwing}, 42, 42)`}>
          <rect x={40} y={42} width={6} height={20} fill={armorBase} rx={2} />
          <circle cx={43} cy={64} r={3} fill={skinDark} />
          {/* Flaming sword in right hand */}
          <line x1={43} y1={60} x2={43} y2={38} stroke="#666" strokeWidth={2.5} strokeLinecap="round" />
          <line x1={43} y1={38} x2={43} y2={28} stroke={fireColor} strokeWidth={2} strokeLinecap="round" />
          <circle cx={43} cy={28} r={3} fill={fireGlow} opacity={0.4 + Math.sin(frame * 0.2) * 0.2} />
        </g>

        {/* Head — demonic helm */}
        <ellipse cx={25} cy={30} rx={12} ry={11} fill={armorBase} />
        <rect x={16} y={32} width={18} height={5} fill={armorLight} rx={1} /> {/* visor */}
        {/* Face behind visor */}
        <rect x={17} y={30} width={16} height={6} fill={skinDark} rx={1} />

        {/* Glowing eyes */}
        <circle cx={21} cy={32} r={2.5} fill={eyeColor} opacity={0.95} />
        <circle cx={29} cy={32} r={2.5} fill={eyeColor} opacity={0.95} />
        <circle cx={21} cy={32} r={1.2} fill="#fff" />
        <circle cx={29} cy={32} r={1.2} fill="#fff" />
        {/* Eye glow aura */}
        <circle cx={21} cy={32} r={5} fill={eyeColor} opacity={0.12 + Math.sin(frame * 0.15) * 0.06} />
        <circle cx={29} cy={32} r={5} fill={eyeColor} opacity={0.12 + Math.sin(frame * 0.15 + 1) * 0.06} />

        {/* Horns — large curved demonic horns */}
        <path d={`M14,26 Q8,14 4,4 Q2,0 6,6 Q10,12 15,22`} fill={hornColor} stroke="#1a0a00" strokeWidth={0.5} />
        <path d={`M36,26 Q42,14 46,4 Q48,0 44,6 Q40,12 35,22`} fill={hornColor} stroke="#1a0a00" strokeWidth={0.5} />
        {/* Horn glow tips */}
        <circle cx={5} cy={5} r={2} fill={fireColor} opacity={0.3 + fireFlicker} />
        <circle cx={45} cy={5} r={2} fill={fireColor} opacity={0.3 + fireFlicker} />

        {/* Fire particles rising */}
        {[0, 1, 2, 3].map(i => {
          const px = 10 + i * 10 + Math.sin(frame * 0.08 + i * 1.5) * 6;
          const py = 30 - ((frame * 0.5 + i * 40) % 50);
          const pr = 1.5 + Math.sin(frame * 0.1 + i) * 0.5;
          return <circle key={`fire${i}`} cx={px} cy={py} r={pr} fill={i % 2 === 0 ? fireColor : fireGlow} opacity={0.3 - py * 0.003} />;
        })}

        {/* Attack glow */}
        {isAttacking && (
          <>
            <circle cx={43} cy={40} r={12 + Math.sin(frame * 0.6) * 4} fill={fireColor} opacity={0.2} />
            <circle cx={43} cy={40} r={6} fill={fireGlow} opacity={0.35} />
          </>
        )}

        {/* Cleave warning (when pull is about to start) */}
        {cleaveCooldown > 1200 && !isPulling && (
          <text x={25} y={-8} fontSize="8" textAnchor="middle" fill="#ffaa00" opacity={0.5 + Math.sin(frame * 0.3) * 0.3}>
            ⚠️
          </text>
        )}

        {/* Damage overlay */}
        {recentlyHit && hitFlash && <rect x={-5} y={0} width={60} height={95} fill="#ff0000" opacity={0.12} rx={4} />}

        {/* Health bar */}
        <rect x={-5} y={-15} width={60} height={8} fill={COLORS.healthBg} rx={2} />
        <rect x={-3} y={-13} width={Math.max(0, (health / maxHealth) * 56)} height={4} fill={fireColor} rx={1} />
        <text x={25} y={-19} fill="#ff4400" fontSize="9" textAnchor="middle" fontWeight="bold">
          🔥 INFERNAL GENERAL #{zone !== undefined ? zone + 1 : ''}
        </text>
        {showHpNumbers && (
          <text x={25} y={-27} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    );
  }

  // Forest Guardian (bossType === 0)
  const trunkOuter = hitFlash ? '#5a4a3a' : '#3a2a1a';
  const trunkInner = hitFlash ? '#6a5a4a' : '#4a3a2a';
  const barkDetail = hitFlash ? '#4a3a2a' : '#2a1a0a';
  const leafColor = hitFlash ? '#4a8a3a' : '#2a6a1a';
  const leafDark = hitFlash ? '#3a6a2a' : '#1a4a0a';
  const mossColor = hitFlash ? '#5a9a4a' : '#3a7a2a';
  const eyeColor = '#ffaa00';
  const branchColor = hitFlash ? '#6a5040' : '#4a3020';
  // Branch arm reach during attack
  const branchReach = isAttacking ? Math.sin(frame * 0.5) * 6 : 0;
  // Gentle sway
  const sway = Math.sin(frame * 0.06) * 2;
  // Leaf particles
  const leaf1X = 15 + Math.sin(frame * 0.08) * 20;
  const leaf1Y = -15 + Math.cos(frame * 0.06) * 8;
  const leaf2X = 50 + Math.sin(frame * 0.1 + 2) * 15;
  const leaf2Y = -5 + Math.cos(frame * 0.07 + 1) * 10;
  const leaf3X = 5 + Math.sin(frame * 0.09 + 4) * 18;
  const leaf3Y = 5 + Math.cos(frame * 0.08 + 3) * 6;

  return (
    <g transform={`translate(${x}, ${y + bobOffset})`}>
      {(bleedStacks ?? 0) > 0 && (
        <text x={32} y={-45} fontSize="15" textAnchor="middle" fill="#ff0000">
          🩸{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
        </text>
      )}
      {/* Ground shadow */}
      <ellipse cx={32} cy={72} rx={35} ry={10} fill="rgba(20,40,10,0.4)" />

      {/* Root legs - gnarled roots */}
      <path d={`M14,55 Q5,62 -4,70 Q-8,72 -2,72 L14,65 Z`} fill={trunkOuter} />
      <path d={`M22,58 Q18,66 12,72 Q8,74 14,73 L24,63 Z`} fill={trunkOuter} />
      <path d={`M42,58 Q46,66 52,72 Q56,74 50,73 L40,63 Z`} fill={trunkOuter} />
      <path d={`M50,55 Q59,62 68,70 Q72,72 66,72 L50,65 Z`} fill={trunkOuter} />

      {/* Main trunk body */}
      <path d={`M14,55 Q8,35 12,10 Q16,0 32,-5 Q48,0 52,10 Q56,35 50,55 Z`}
            fill={trunkOuter} stroke={barkDetail} strokeWidth="1" />
      {/* Inner trunk texture */}
      <path d={`M18,50 Q14,32 18,14 Q22,5 32,2 Q42,5 46,14 Q50,32 46,50 Z`}
            fill={trunkInner} />

      {/* Bark texture lines */}
      <path d="M20,48 Q22,35 20,20" stroke={barkDetail} strokeWidth="1.5" fill="none" opacity={0.6} />
      <path d="M30,50 Q32,30 30,12" stroke={barkDetail} strokeWidth="1" fill="none" opacity={0.5} />
      <path d="M42,48 Q40,35 42,18" stroke={barkDetail} strokeWidth="1.5" fill="none" opacity={0.6} />

      {/* Moss patches */}
      <ellipse cx={20} cy={25} rx={5} ry={3} fill={mossColor} opacity={0.6} />
      <ellipse cx={44} cy={35} rx={4} ry={2.5} fill={mossColor} opacity={0.5} />
      <ellipse cx={25} cy={45} rx={6} ry={2} fill={mossColor} opacity={0.4} />

      {/* Branch arms */}
      <g transform={`rotate(${-10 + sway - branchReach}, 14, 22)`}>
        <path d={`M14,22 Q-2,18 ${-18 - branchReach},24 Q${-24 - branchReach},26 ${-20 - branchReach},28`}
              stroke={branchColor} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={`M${-18 - branchReach},24 Q${-22 - branchReach},18 ${-26 - branchReach},16`}
              stroke={branchColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={`M${-14 - branchReach},23 Q${-16 - branchReach},28 ${-20 - branchReach},32`}
              stroke={branchColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        {/* Tiny leaves on branch tips */}
        <ellipse cx={-26 - branchReach} cy={16} rx={3} ry={2} fill={leafColor} opacity={0.7} />
        <ellipse cx={-20 - branchReach} cy={32} rx={2.5} ry={1.5} fill={leafDark} opacity={0.6} />
      </g>
      <g transform={`rotate(${10 - sway + branchReach}, 50, 22)`}>
        <path d={`M50,22 Q66,18 ${82 + branchReach},24 Q${88 + branchReach},26 ${84 + branchReach},28`}
              stroke={branchColor} strokeWidth="6" fill="none" strokeLinecap="round" />
        <path d={`M${82 + branchReach},24 Q${86 + branchReach},18 ${90 + branchReach},16`}
              stroke={branchColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <path d={`M${78 + branchReach},23 Q${80 + branchReach},28 ${84 + branchReach},32`}
              stroke={branchColor} strokeWidth="3" fill="none" strokeLinecap="round" />
        <ellipse cx={90 + branchReach} cy={16} rx={3} ry={2} fill={leafColor} opacity={0.7} />
        <ellipse cx={84 + branchReach} cy={32} rx={2.5} ry={1.5} fill={leafDark} opacity={0.6} />
      </g>

      {/* Face area - dark hollow in bark */}
      <ellipse cx={32} cy={12} rx={12} ry={10} fill={barkDetail} opacity={0.7} />

      {/* Glowing eyes */}
      <circle cx={25} cy={10} r={4} fill={eyeColor} opacity={0.9} />
      <circle cx={39} cy={10} r={4} fill={eyeColor} opacity={0.9} />
      <circle cx={25} cy={10} r={2} fill="#fff" />
      <circle cx={39} cy={10} r={2} fill="#fff" />
      {/* Eye glow aura */}
      <circle cx={25} cy={10} r={6} fill={eyeColor} opacity={0.15 + Math.sin(frame * 0.15) * 0.08} />
      <circle cx={39} cy={10} r={6} fill={eyeColor} opacity={0.15 + Math.sin(frame * 0.15 + 1) * 0.08} />

      {/* Mouth - dark crack */}
      <path d="M26,18 Q32,22 38,18" stroke={barkDetail} strokeWidth="2" fill="none" />

      {/* Leafy crown / canopy */}
      <ellipse cx={32} cy={-8 + sway * 0.5} rx={22} ry={12} fill={leafColor} />
      <ellipse cx={22} cy={-6 + sway * 0.3} rx={12} ry={9} fill={leafDark} />
      <ellipse cx={42} cy={-6 + sway * 0.7} rx={12} ry={9} fill={leafDark} />
      <ellipse cx={32} cy={-12 + sway * 0.5} rx={15} ry={8} fill={mossColor} opacity={0.7} />
      {/* Crown highlights */}
      <ellipse cx={28} cy={-14 + sway * 0.4} rx={5} ry={3} fill="#4aaa3a" opacity={0.5} />
      <ellipse cx={38} cy={-10 + sway * 0.6} rx={4} ry={2.5} fill="#4aaa3a" opacity={0.4} />

      {/* Floating leaf particles */}
      <ellipse cx={leaf1X} cy={leaf1Y} rx={2.5} ry={1.5} fill={leafColor} opacity={0.7}
               transform={`rotate(${frame * 2 % 360}, ${leaf1X}, ${leaf1Y})`} />
      <ellipse cx={leaf2X} cy={leaf2Y} rx={2} ry={1.2} fill={mossColor} opacity={0.6}
               transform={`rotate(${frame * 1.5 % 360}, ${leaf2X}, ${leaf2Y})`} />
      <ellipse cx={leaf3X} cy={leaf3Y} rx={2.2} ry={1.3} fill={leafDark} opacity={0.5}
               transform={`rotate(${frame * 1.8 % 360}, ${leaf3X}, ${leaf3Y})`} />

      {/* Attack glow - green energy at branch tips */}
      {isAttacking && (
        <>
          <circle cx={-20 - branchReach} cy={24} r={8 + Math.sin(frame * 0.6) * 3} fill="#44ff22" opacity={0.25} />
          <circle cx={-20 - branchReach} cy={24} r={4} fill="#88ff66" opacity={0.5} />
          <circle cx={84 + branchReach} cy={24} r={8 + Math.sin(frame * 0.6) * 3} fill="#44ff22" opacity={0.25} />
          <circle cx={84 + branchReach} cy={24} r={4} fill="#88ff66" opacity={0.5} />
        </>
      )}

      {/* Damage overlay */}
      {recentlyHit && hitFlash && <rect x={-30} y={-25} width={124} height={100} fill="#ff0000" opacity={0.12} rx={4} />}

      {/* Health bar */}
      <rect x={-10} y={-30} width={84} height={10} fill={COLORS.healthBg} rx={2} />
      <rect x={-8} y={-28} width={Math.max(0, (health / maxHealth) * 80)} height={6}
            fill="#44aa22" rx={1} />
      <text x={32} y={-34} fill="#88dd44" fontSize="11" textAnchor="middle" fontWeight="bold">
        🌳 FOREST GUARDIAN #{zone !== undefined ? zone + 1 : ''}
      </text>
      {showHpNumbers && (
        <text x={32} y={-42} fontSize="10" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
