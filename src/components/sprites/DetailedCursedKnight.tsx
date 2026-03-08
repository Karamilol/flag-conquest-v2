import { memo } from 'react';
import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';
import './sprite-animations.css';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  attackCooldown?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

function DetailedCursedKnight({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const isAttacking = attackCooldown < 12;
  const attackPhase = isAttacking ? attackCooldown / 12 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Throttled frame for JS animations — every 3 ticks
  const tf = Math.floor(frame / 3) * 3;

  // Breathing — heavy armor heave
  const breathe = Math.sin(tf * 0.04) * 0.4;

  // Curse pulse animations — intensify during attack
  const atkI = isAttacking ? 1.5 : 1;
  const cursePulse = (0.5 + Math.sin(tf * 0.08) * 0.3) * atkI;
  const runeGlow = (0.4 + Math.sin(tf * 0.06) * 0.25) * atkI;
  const eyePulse = isAttacking ? 1.0 : 0.7 + Math.sin(tf * 0.1) * 0.3;
  const swordGlow = isAttacking ? 0.8 : 0.3 + Math.sin(tf * 0.09) * 0.2;

  // Sword slash arc: raised → forward slash
  const swordAngle = isAttacking ? -45 + (1 - attackPhase) * 75 : 0;

  // Floating curse particles (4 orbiting)
  const p1x = 12 + Math.sin(tf * 0.05) * 10;
  const p1y = 8 + Math.cos(tf * 0.05) * 12;
  const p2x = 12 + Math.sin(tf * 0.05 + 1.57) * 11;
  const p2y = 10 + Math.cos(tf * 0.05 + 1.57) * 10;
  const p3x = 12 + Math.sin(tf * 0.05 + 3.14) * 9;
  const p3y = 6 + Math.cos(tf * 0.05 + 3.14) * 13;
  const p4x = 12 + Math.sin(tf * 0.05 + 4.71) * 12;
  const p4y = 12 + Math.cos(tf * 0.05 + 4.71) * 8;

  // Wisp rise offsets
  const wisp1 = Math.sin(tf * 0.07) * 2;
  const wisp2 = Math.sin(tf * 0.09 + 1) * 2;

  // CSS animation desync based on position
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  // ---- Colors ----
  const armorDark = '#0e0816';       // Deepest armor core
  const armorMid = '#1a1028';        // Mid plate
  const armorOuter = '#241838';      // Outer plate / pauldrons
  const armorHighlight = '#3a2850';  // Edge highlights
  const armorEdge = '#4a3860';       // Brightest edge strokes
  const curseColor = '#8844cc';      // Primary curse purple
  const curseBright = '#aa66ee';     // Bright curse accents
  const curseCore = '#cc88ff';       // Eye/rune cores
  const curseAura = '#6622aa';       // Aura glow
  const swordSteel = '#2a2a3a';      // Dark blade steel
  const swordEdge = '#444458';       // Blade edge
  const shieldFace = '#1a1028';      // Shield surface

  // Center around x=12
  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ' scale(1.1)'}`}>
    <g className="sprite-idle" style={delayStyle}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={12} cy={14} r={22} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={12} y={-20} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === GROUND SHADOW === */}
      <ellipse cx={12} cy={33} rx={10} ry={3} fill="rgba(60,0,100,0.25)" />

      {/* === CURSED AURA (background glow) === */}
      <circle cx={12} cy={14} r={16} fill={curseAura} opacity={cursePulse * 0.06} />

      {/* === LEGS — heavy armored greaves === */}
      {/* Left leg */}
      <rect x={6} y={23} width={4.5} height={9} fill={armorMid} rx={1} />
      <rect x={6.5} y={23.5} width={3.5} height={8} fill={armorDark} rx={0.5} />
      {/* Left knee guard */}
      <path d="M5.5,24.5 L6,23 L11,23 L11.5,24.5 L10.5,26 L6.5,26 Z" fill={armorOuter} />
      <line x1={6.5} y1={23.5} x2={6.5} y2={25.5} stroke={armorHighlight} strokeWidth={0.4} opacity={0.4} />
      {/* Left greave edge highlight */}
      <line x1={6} y1={26} x2={6} y2={31} stroke={armorHighlight} strokeWidth={0.4} opacity={0.3} />
      {/* Left boot */}
      <path d="M5.5,30 L5,32 L11,32 L10.5,30" fill={armorOuter} />

      {/* Right leg */}
      <rect x={13.5} y={23} width={4.5} height={9} fill={armorMid} rx={1} />
      <rect x={14} y={23.5} width={3.5} height={8} fill={armorDark} rx={0.5} />
      {/* Right knee guard */}
      <path d="M12.5,24.5 L13,23 L18.5,23 L19,24.5 L18,26 L13.5,26 Z" fill={armorOuter} />
      <line x1={18} y1={23.5} x2={18} y2={25.5} stroke={armorHighlight} strokeWidth={0.4} opacity={0.4} />
      {/* Right greave edge highlight */}
      <line x1={18} y1={26} x2={18} y2={31} stroke={armorHighlight} strokeWidth={0.4} opacity={0.3} />
      {/* Right boot */}
      <path d="M13,30 L12.5,32 L18.5,32 L18,30" fill={armorOuter} />

      {/* === BODY / TORSO — heavy layered plate (breathing) === */}
      {/* Outer plate — broad angular */}
      <path d={`M3,${8 - breathe * 0.3} L2,12 L3,18 L5,22 L8,24 Q12,25 16,24 L19,22 L21,18 L22,12 L21,${8 - breathe * 0.3} L18,${6 - breathe * 0.2} Q15,${4.5 - breathe * 0.1} 12,${4.5 - breathe * 0.1} Q9,${4.5 - breathe * 0.1} 6,${6 - breathe * 0.2} Z`}
        fill={armorOuter} />
      {/* Mid plate */}
      <path d="M5,9 L4.5,13 L5,18 L7,22 Q10,23.5 12,23.5 Q14,23.5 17,22 L19,18 L19.5,13 L19,9 L17,7 Q14,5.5 12,5.5 Q10,5.5 7,7 Z"
        fill={armorMid} />
      {/* Dark core */}
      <path d="M7,10 L6.5,14 L7,19 Q10,22 12,22 Q14,22 17,19 L17.5,14 L17,10 Q15,7 12,7 Q9,7 7,10"
        fill={armorDark} opacity={0.9} />

      {/* Chest plate detail lines */}
      <line x1={9} y1={8} x2={8} y2={20} stroke={armorHighlight} strokeWidth={0.5} opacity={0.2} />
      <line x1={15} y1={8} x2={16} y2={20} stroke={armorHighlight} strokeWidth={0.5} opacity={0.2} />
      <line x1={12} y1={6} x2={12} y2={22} stroke={armorEdge} strokeWidth={0.3} opacity={0.15} />
      {/* Diagonal chest folds */}
      <line x1={5} y1={9} x2={9} y2={15} stroke={armorHighlight} strokeWidth={0.4} opacity={0.15} />
      <line x1={19} y1={9} x2={15} y2={15} stroke={armorHighlight} strokeWidth={0.4} opacity={0.15} />

      {/* === CURSE RUNE CROSS on chest === */}
      <line x1={12} y1={11} x2={12} y2={19} stroke={curseColor} strokeWidth={1.2} opacity={runeGlow} />
      <line x1={9} y1={15} x2={15} y2={15} stroke={curseColor} strokeWidth={1.2} opacity={runeGlow} />
      {/* Rune glow bloom */}
      <line x1={12} y1={11} x2={12} y2={19} stroke={curseBright} strokeWidth={2.5} opacity={runeGlow * 0.15} />
      <line x1={9} y1={15} x2={15} y2={15} stroke={curseBright} strokeWidth={2.5} opacity={runeGlow * 0.15} />
      {/* Rune center dot */}
      <circle cx={12} cy={15} r={1} fill={curseCore} opacity={runeGlow * 0.6} />

      {/* === LEFT SHOULDER PAULDRON (with spike) === */}
      <path d="M2,7 L1,9 L2,13 L5,13 L6,9 L5,6 Z" fill={armorOuter} />
      <path d="M2.5,8 L2,10 L2.5,12.5 L4.5,12.5 L5,10 L4.5,7 Z" fill={armorMid} />
      <line x1={2} y1={8} x2={2} y2={12.5} stroke={armorHighlight} strokeWidth={0.5} opacity={0.3} />
      {/* Left spike */}
      <polygon points="3,7 3.5,2 4.5,7" fill={armorOuter} />
      <line x1={3.5} y1={2.5} x2={3.5} y2={6.5} stroke={armorHighlight} strokeWidth={0.4} opacity={0.3} />
      {/* Spike curse glow */}
      <line x1={3.5} y1={2.5} x2={3.5} y2={5} stroke={curseColor} strokeWidth={0.6} opacity={runeGlow * 0.3} />

      {/* === RIGHT SHOULDER PAULDRON (with spike) === */}
      <path d="M18,6 L19,9 L22,9 L23,13 L20,13 L18,9 Z" fill={armorOuter} />
      <path d="M19,7 L19.5,10 L21.5,10 L22,12.5 L20,12.5 L19,10 Z" fill={armorMid} />
      <line x1={22} y1={8} x2={22} y2={12.5} stroke={armorHighlight} strokeWidth={0.5} opacity={0.3} />
      {/* Right spike */}
      <polygon points="19.5,7 20.5,2 21,7" fill={armorOuter} />
      <line x1={20.5} y1={2.5} x2={20.5} y2={6.5} stroke={armorHighlight} strokeWidth={0.4} opacity={0.3} />
      {/* Spike curse glow */}
      <line x1={20.5} y1={2.5} x2={20.5} y2={5} stroke={curseColor} strokeWidth={0.6} opacity={runeGlow * 0.3} />

      {/* === LEFT ARM — SHIELD ARM (brace during attack) === */}
      <g className={isAttacking ? undefined : "sprite-shield-arm"} transform={isAttacking ? 'translate(-2, -1)' : undefined}>
        {/* Upper arm armor */}
        <path d="M1,10 L-1,13 L-1,18 L1,20 L3,18 L3,13 Z" fill={armorMid} />
        <line x1={-0.5} y1={11} x2={-0.5} y2={19} stroke={armorHighlight} strokeWidth={0.4} opacity={0.25} />

        {/* Shield — angular dark shield */}
        <path d="M-5,10 L-6,14 L-5,21 L-1,23 L2,21 L3,14 L2,10 Z" fill={shieldFace} stroke={armorOuter} strokeWidth={0.8} />
        {/* Shield inner plate */}
        <path d="M-4,11.5 L-4.5,14.5 L-4,19.5 L-1,21 L1.5,19.5 L2,14.5 L1.5,11.5 Z" fill={armorMid} opacity={0.7} />
        {/* Shield cursed emblem — pulsing purple circle */}
        <circle cx={-1.5} cy={16} r={3} fill="none" stroke={curseColor} strokeWidth={0.8} opacity={cursePulse * 0.7} />
        <circle cx={-1.5} cy={16} r={1.5} fill={curseColor} opacity={cursePulse * 0.4} />
        <circle cx={-1.5} cy={16} r={0.6} fill={curseCore} opacity={cursePulse * 0.6} />
        {/* Shield edge highlight */}
        <path d="M-4.5,11 L-5.5,14 L-4.5,20.5" stroke={armorEdge} strokeWidth={0.5} fill="none" opacity={0.3} />
        {/* Shield rim rivets */}
        <circle cx={-4} cy={12.5} r={0.4} fill={armorHighlight} opacity={0.4} />
        <circle cx={-5} cy={15} r={0.4} fill={armorHighlight} opacity={0.4} />
        <circle cx={-4} cy={19} r={0.4} fill={armorHighlight} opacity={0.4} />
      </g>

      {/* === RIGHT ARM (stays in place, hand open when sword detaches) === */}
      <g className={isAttacking ? undefined : "sprite-weapon-arm"}>
        {/* Upper arm armor */}
        <path d="M21,10 L22,13 L22,18 L21,20 L19.5,18 L19.5,13 Z" fill={armorMid} />
        <line x1={21.5} y1={11} x2={21.5} y2={19} stroke={armorHighlight} strokeWidth={0.4} opacity={0.25} />
        {/* Gauntlet / hand */}
        <rect x={20} y={18} width={4} height={3} fill={armorOuter} rx={1} />
        <line x1={20.5} y1={19} x2={23.5} y2={19} stroke={armorHighlight} strokeWidth={0.3} opacity={0.3} />
        {/* Pommel (stays in hand when not attacking) */}
        {!isAttacking && <circle cx={22} cy={20.5} r={1} fill={armorOuter} />}
        {!isAttacking && <circle cx={22} cy={20.5} r={0.4} fill={curseColor} opacity={0.4} />}
      </g>

      {/* === CURSED SWORD (detaches and flies toward enemy during attack) === */}
      <g transform={isAttacking
        ? `translate(${-12 * (1 - attackPhase)}, ${2 * Math.sin((1 - attackPhase) * Math.PI)}) rotate(${-60 + (1 - attackPhase) * 120}, 22, 10)`
        : undefined
      }>
        {/* Crossguard */}
        <rect x={19.5} y={17.5} width={5} height={1.5} fill={armorOuter} rx={0.5} />
        <line x1={20} y1={17.8} x2={24} y2={17.8} stroke={armorEdge} strokeWidth={0.3} opacity={0.4} />

        {/* Blade — long dark steel */}
        <path d="M21,17.5 L21,3 L22,1 L23,3 L23,17.5" fill={swordSteel} />
        <line x1={21.2} y1={17} x2={21.2} y2={3} stroke={swordEdge} strokeWidth={0.5} opacity={0.5} />
        <line x1={22.8} y1={17} x2={22.8} y2={3} stroke={swordEdge} strokeWidth={0.5} opacity={0.4} />
        <line x1={22} y1={16} x2={22} y2={3} stroke={armorDark} strokeWidth={0.6} opacity={0.5} />
        <path d="M21.2,3 L22,0.5 L22.8,3" fill={swordEdge} />

        {/* Purple curse energy along blade edge — intensified during attack */}
        <line x1={21} y1={16} x2={21} y2={4} stroke={curseColor} strokeWidth={isAttacking ? 1.2 : 0.8} opacity={swordGlow * 0.7} />
        <line x1={23} y1={16} x2={23} y2={4} stroke={curseColor} strokeWidth={isAttacking ? 1.2 : 0.8} opacity={swordGlow * 0.6} />
        <line x1={22} y1={14} x2={22} y2={2} stroke={curseBright} strokeWidth={isAttacking ? 4 : 3} opacity={swordGlow * (isAttacking ? 0.15 : 0.08)} />
        <line x1={21.5} y1={8} x2={22.5} y2={8} stroke={curseCore} strokeWidth={0.4} opacity={swordGlow * 0.5} />
        <line x1={21.5} y1={12} x2={22.5} y2={12} stroke={curseCore} strokeWidth={0.4} opacity={swordGlow * 0.4} />

        {/* Curse trail when sword is flying */}
        {isAttacking && (
          <>
            <line x1={22} y1={18} x2={22 + 6 * attackPhase} y2={18 - 3 * attackPhase} stroke={curseBright} strokeWidth={1.5} opacity={0.3 * (1 - attackPhase)} strokeLinecap="round" />
            <circle cx={22} cy={10} r={3 + (1 - attackPhase) * 3} fill={curseColor} opacity={0.1 * (1 - attackPhase)} />
          </>
        )}

        {/* Pommel */}
        <circle cx={22} cy={20.5} r={1} fill={armorOuter} />
        <circle cx={22} cy={20.5} r={0.4} fill={curseColor} opacity={0.4} />
      </g>

      {/* === HELMET — angular menacing with pointed visor === */}
      <g>
        {/* Main helmet dome */}
        <path d="M5,2 L4,-1 L5,-4 L8,-6 L12,-7.5 L16,-6 L19,-4 L20,-1 L19,2 L18,5 L15,6.5 L12,7 L9,6.5 L6,5 Z"
          fill={armorOuter} />
        {/* Mid helmet layer */}
        <path d="M6.5,1 L6,-1 L7,-3.5 L9.5,-5.5 L12,-6.5 L14.5,-5.5 L17,-3.5 L18,-1 L17.5,1 L17,4 L14.5,5.5 L12,6 L9.5,5.5 L7,4 Z"
          fill={armorMid} />
        {/* Inner helmet shadow */}
        <path d="M8,0 L7.5,-1.5 L9,-4 L12,-5.5 L15,-4 L16.5,-1.5 L16,0 L15.5,3 L13.5,4.5 L12,5 L10.5,4.5 L8.5,3 Z"
          fill={armorDark} opacity={0.8} />

        {/* Helmet edge highlights */}
        <path d="M5.5,1 L5,-1 L6,-3.5 L8.5,-5.5" stroke={armorEdge} strokeWidth={0.5} fill="none" opacity={0.35} />
        <path d="M18.5,1 L19,-1 L18,-3.5 L15.5,-5.5" stroke={armorEdge} strokeWidth={0.5} fill="none" opacity={0.35} />

        {/* Helmet center ridge */}
        <line x1={12} y1={-7} x2={12} y2={2} stroke={armorHighlight} strokeWidth={0.6} opacity={0.3} />

        {/* Pointed visor */}
        <path d="M7,2 L6.5,3 L8,5 L12,6.5 L16,5 L17.5,3 L17,2 L14,3.5 L12,4 L10,3.5 Z"
          fill={armorDark} />
        {/* Visor slit */}
        <path d="M8,3 L12,4.5 L16,3" stroke="#050208" strokeWidth={1.5} fill="none" />

        {/* Glowing purple eyes in visor slit */}
        {/* Left eye glow bloom */}
        <circle cx={9.5} cy={3.2} r={2} fill={curseColor} opacity={eyePulse * 0.12} />
        <circle cx={9.5} cy={3.2} r={1} fill={curseColor} opacity={eyePulse * 0.7} />
        <circle cx={9.5} cy={3.2} r={0.5} fill={curseCore} opacity={eyePulse} />
        {/* Right eye glow bloom */}
        <circle cx={14.5} cy={3.2} r={2} fill={curseColor} opacity={eyePulse * 0.12} />
        <circle cx={14.5} cy={3.2} r={1} fill={curseColor} opacity={eyePulse * 0.7} />
        <circle cx={14.5} cy={3.2} r={0.5} fill={curseCore} opacity={eyePulse} />
        {/* Eye specular highlights */}
        <circle cx={9} cy={2.8} r={0.3} fill="#fff" opacity={0.4} />
        <circle cx={14} cy={2.8} r={0.3} fill="#fff" opacity={0.4} />

        {/* === HELMET CREST / PLUME === */}
        <g className="sprite-plume">
          {/* Crest base */}
          <path d="M10,-6 L11,-8 L12,-10 L13,-8 L14,-6" fill={armorOuter} />
          {/* Crest mid */}
          <path d="M10.5,-6.5 L11.5,-8.5 L12,-10.5 L12.5,-8.5 L13.5,-6.5" fill={armorMid} />
          {/* Crest edge highlight */}
          <line x1={12} y1={-10} x2={12} y2={-6.5} stroke={armorEdge} strokeWidth={0.4} opacity={0.35} />
          {/* Crest curse glow at tip */}
          <circle cx={12} cy={-10} r={1} fill={curseColor} opacity={runeGlow * 0.25} />
        </g>

        {/* Helmet side flanges */}
        <path d="M5,0 L3.5,-1 L4.5,1" fill={armorOuter} />
        <path d="M19,0 L20.5,-1 L19.5,1" fill={armorOuter} />
      </g>

      {/* === CURSE WISPS rising from shoulders === */}
      <path d={`M4,7 Q${3 + wisp1},3 ${4 + wisp1 * 0.5},-1`}
        stroke={curseColor} strokeWidth={0.7} fill="none" opacity={0.2} />
      <path d={`M20,7 Q${21 + wisp2},3 ${20 + wisp2 * 0.5},-1`}
        stroke={curseColor} strokeWidth={0.7} fill="none" opacity={0.2} />
      {/* Additional thin wisps */}
      <path d={`M6,6 Q${5 + wisp2 * 0.5},2 ${6 + wisp2 * 0.3},-2`}
        stroke={curseBright} strokeWidth={0.4} fill="none" opacity={0.12} />
      <path d={`M18,6 Q${19 - wisp1 * 0.5},2 ${18 - wisp1 * 0.3},-2`}
        stroke={curseBright} strokeWidth={0.4} fill="none" opacity={0.12} />

      {/* === ORBITING CURSE PARTICLES === */}
      <circle cx={p1x} cy={p1y} r={0.8} fill={curseBright} opacity={cursePulse * 0.5} />
      <circle cx={p2x} cy={p2y} r={0.6} fill={curseColor} opacity={cursePulse * 0.4} />
      <circle cx={p3x} cy={p3y} r={0.7} fill={curseCore} opacity={cursePulse * 0.35} />
      <circle cx={p4x} cy={p4y} r={0.5} fill={curseBright} opacity={cursePulse * 0.3} />
      {/* Particle glow blooms */}
      <circle cx={p1x} cy={p1y} r={2} fill={curseColor} opacity={cursePulse * 0.06} />
      <circle cx={p3x} cy={p3y} r={1.8} fill={curseColor} opacity={cursePulse * 0.05} />

      {/* === SWORD SLASH TRAIL === */}
      {isAttacking && attackPhase < 0.5 && (
        <g transform="translate(22, 12)">
          <path d={`M0,-2 Q${-8 + swordAngle * 0.2},${-12} ${-14 + swordAngle * 0.15},${-6}`}
            stroke={curseBright} strokeWidth={2} fill="none" opacity={0.4 * (1 - attackPhase * 2)} strokeLinecap="round" />
          <path d={`M0,-2 Q${-6 + swordAngle * 0.15},${-10} ${-12 + swordAngle * 0.12},${-5}`}
            stroke={curseCore} strokeWidth={1} fill="none" opacity={0.3 * (1 - attackPhase * 2)} strokeLinecap="round" />
        </g>
      )}

      {/* === ATTACK IMPACT FLASH === */}
      {isAttacking && attackPhase < 0.15 && (
        <circle cx={18} cy={14} r={6} fill={curseBright} opacity={0.2} />
      )}

      {/* === HIT FLASH === */}
      {recentlyHit && (
        <rect x={-6} y={-12} width={30} height={48} fill="#ff0000" opacity={0.12} rx={3} />
      )}

      {/* === HEALTH BAR === */}
      <rect x={0} y={-14} width={24} height={4} fill="#333" rx={1} />
      <rect x={0} y={-14} width={Math.max(0, 24 * (health / maxHealth))} height={4} fill="#8844cc" rx={1} />
      {showHpNumbers && (
        <text x={12} y={-16} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
    </g>
  );
}

export default memo(DetailedCursedKnight, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAtk = (prev.attackCooldown ?? 99) < 12;
  const nextAtk = (next.attackCooldown ?? 99) < 12;
  if (prevAtk !== nextAtk) return false;
  if (prevAtk && prev.attackCooldown !== next.attackCooldown) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
