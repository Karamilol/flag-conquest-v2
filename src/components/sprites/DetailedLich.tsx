import { memo } from 'react';
import { COLORS } from '../../constants';
import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';
import './sprite-animations.css';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  activeSkeletons?: number;
  iceballCooldown?: number;
  healCooldown?: number;
  lastDamageTime?: number;
  passiveSummonTimer?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

function DetailedLich({ x, y, health, maxHealth, frame, activeSkeletons = 0, iceballCooldown = 0, healCooldown = 0, lastDamageTime = 0, passiveSummonTimer = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  // Casting states — iceball (fires at 300), heal (fires at 240)
  const isCastingIce = iceballCooldown >= 250;
  const isCastingHeal = !isCastingIce && healCooldown >= 200;
  const isCasting = isCastingIce || isCastingHeal;
  const castProgress = isCastingIce ? (iceballCooldown - 250) / 50 : isCastingHeal ? (healCooldown - 200) / 40 : 0;

  // Throttle JS animations to every 3 frames
  const tf = Math.floor(frame / 3) * 3;

  // Eye pulse — intensify during casting
  const eyePulse = isCasting ? 0.9 + Math.sin(tf * 0.2) * 0.1 : 0.6 + Math.sin(tf * 0.12) * 0.3;

  // Summon aura
  const skelCap = eliteVariantId === 'archlich' ? 6 : 3;
  const summonCharging = passiveSummonTimer > 420 && activeSkeletons < skelCap;
  const auraIntensity = isCasting ? 0.5 : summonCharging ? 0.4 + Math.sin(tf * 0.3) * 0.2 : 0.15 + activeSkeletons * 0.04;
  const wispSpeed = isCasting ? 0.35 : summonCharging ? 0.25 : 0.12;

  // Spell hand raise during casting
  const spellHandRaise = isCasting ? castProgress * -6 : 0;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Colors
  const robe = '#0e0e1e';
  const robeDark = '#060610';
  const robeLight = '#1a1a3a';
  const robeAccent = '#2a1a3e';
  const bone = '#d4c8b0';
  const boneDark = '#b8a890';
  const boneLight = '#e8dcc8';
  const socket = '#111';
  const glow = '#44ff44';
  const glowBright = '#88ff88';
  const staffWood = '#5a4a35';
  const staffLight = '#6b5a45';
  const metal = '#888';
  const castGlowColor = isCastingIce ? '#44aaff' : glow;

  // Wisp positions (throttled)
  const w1x = 15 + Math.sin(tf * wispSpeed) * 18;
  const w1y = 20 + Math.cos(tf * wispSpeed) * 12;
  const w2x = 15 + Math.sin(tf * wispSpeed + 2.1) * 16;
  const w2y = 18 + Math.cos(tf * wispSpeed + 2.1) * 10;
  const w3x = 15 + Math.sin(tf * wispSpeed + 4.2) * 14;
  const w3y = 22 + Math.cos(tf * wispSpeed + 4.2) * 8;

  // Finger flex (subtle)
  const fingerFlex = Math.sin(tf * 0.06) * 1.5;

  // Jaw clatter during casting — rapid open/close
  const jawClatter = isCasting ? Math.sin(tf * 0.4) * 1.5 : 0;

  // Crown jewel pulse
  const crownPulse = 0.4 + Math.sin(tf * 0.08) * 0.2 + (isCasting ? 0.3 : 0);

  const state = health <= 0 ? 'die' : 'idle';
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {/* Use wraith float for the lich too */}
      <g className="sprite-wraith-float">
      <g className={`sprite-${state}`} style={delayStyle}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={15} cy={15} r={22} fill={eliteGlow} opacity={0.15} />
      )}
      {eliteVariantId && (
        <text x={15} y={-20} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === GROUND SHADOW === */}
      <ellipse cx={15} cy={42} rx={16} ry={5} fill="rgba(0,0,0,0.25)" />

      {/* === NECROMANTIC GROUND AURA === */}
      <ellipse cx={15} cy={42} rx={14 + activeSkeletons * 2} ry={4 + activeSkeletons}
        fill={glow} opacity={auraIntensity} />

      {/* === STAFF (behind body) === */}
      <g>
        {/* Staff pole */}
        <rect x={26} y={-2} width={3} height={48} fill={staffWood} rx={1} />
        <rect x={26.5} y={-2} width={1.5} height={48} fill={staffLight} opacity={0.5} />
        {/* Wrapping bands */}
        <rect x={25.5} y={14} width={4} height={1.5} fill={boneDark} rx={0.5} />
        <rect x={25.5} y={20} width={4} height={1.5} fill={boneDark} rx={0.5} />
        <rect x={25.5} y={32} width={4} height={1.5} fill={boneDark} rx={0.5} />
        {/* Rune carvings on staff */}
        <text x={27.5} y={19} fontSize="4" textAnchor="middle" fill={glow} opacity={0.4}>᛭</text>
        <text x={27.5} y={30} fontSize="4" textAnchor="middle" fill={glow} opacity={0.3}>ᛟ</text>

        {/* Staff skull ornament */}
        <ellipse cx={27.5} cy={-4} rx={5} ry={4.5} fill={bone} />
        <ellipse cx={27.5} cy={-3} rx={4} ry={3.5} fill={boneLight} opacity={0.3} />
        {/* Skull eye sockets */}
        <ellipse cx={25.5} cy={-5} rx={1.5} ry={1.2} fill={socket} />
        <ellipse cx={29.5} cy={-5} rx={1.5} ry={1.2} fill={socket} />
        {/* Skull eye glow */}
        <circle cx={25.5} cy={-5} r={0.8} fill={glow} opacity={eyePulse * 0.6} />
        <circle cx={29.5} cy={-5} r={0.8} fill={glow} opacity={eyePulse * 0.6} />
        {/* Skull nose */}
        <path d="M27,-3 L26.5,-1.5 L28,-1.5 Z" fill={boneDark} opacity={0.6} />
        {/* Skull teeth */}
        <rect x={25.5} y={-1} width={1} height={1.2} fill={boneLight} rx={0.3} />
        <rect x={27} y={-1} width={1} height={1.5} fill={boneLight} rx={0.3} />
        <rect x={28.5} y={-1} width={1} height={1.2} fill={boneLight} rx={0.3} />

        {/* Staff glow orb */}
        <circle cx={27.5} cy={-4} r={7} fill={glow} opacity={0.06 + Math.sin(tf * 0.1) * 0.03} />
      </g>

      {/* === ROBE — wide flowing cloak === */}
      {/* Outer robe */}
      <path d="M3,40 Q0,22 8,10 L12,8 L18,8 L22,10 Q30,22 27,40 Q20,44 15,42 Q10,44 3,40"
        fill={robe} stroke={robeLight} strokeWidth={0.5} />
      {/* Inner robe darkness */}
      <path d="M8,38 Q7,24 12,14 L15,12 L18,14 Q23,24 22,38"
        fill={robeDark} opacity={0.8} />
      {/* Robe fold lines */}
      <path d="M10,14 Q9,26 8,38" fill="none" stroke={robeLight} strokeWidth={0.4} opacity={0.3} />
      <path d="M20,14 Q21,26 22,38" fill="none" stroke={robeLight} strokeWidth={0.4} opacity={0.3} />
      <path d="M15,12 Q14,28 13,40" fill="none" stroke={robeLight} strokeWidth={0.3} opacity={0.2} />

      {/* Robe trim / runes along hem */}
      <path d="M3,40 Q10,44 15,42 Q20,44 27,40" fill="none" stroke={robeAccent} strokeWidth={1.2} />
      <circle cx={7} cy={40} r={1} fill={glow} opacity={0.15} />
      <circle cx={15} cy={42} r={1} fill={glow} opacity={0.15} />
      <circle cx={23} cy={40} r={1} fill={glow} opacity={0.15} />

      {/* Tattered bottom edges */}
      <polygon points="3,40 1,43 4,41" fill={robe} />
      <polygon points="6,41 4,44 7,42" fill={robeDark} />
      <polygon points="23,41 25,44 24,41" fill={robeDark} />
      <polygon points="27,40 29,43 26,41" fill={robe} />
      <polygon points="10,43 8,46 11,43.5" fill={robe} opacity={0.7} />
      <polygon points="19,43 21,46 20,43.5" fill={robe} opacity={0.7} />

      {/* Robe chest sigil */}
      <circle cx={15} cy={22} r={3} fill="none" stroke={glow} strokeWidth={0.5} opacity={0.2} />
      <line x1={15} y1={19} x2={15} y2={25} stroke={glow} strokeWidth={0.3} opacity={0.15} />
      <line x1={12} y1={22} x2={18} y2={22} stroke={glow} strokeWidth={0.3} opacity={0.15} />

      {/* === SHOULDER PAULDRONS (bone) === */}
      <ellipse cx={7} cy={12} rx={4} ry={2.5} fill={boneDark} />
      <ellipse cx={7} cy={11.5} rx={3.5} ry={2} fill={bone} opacity={0.5} />
      <ellipse cx={23} cy={12} rx={4} ry={2.5} fill={boneDark} />
      <ellipse cx={23} cy={11.5} rx={3.5} ry={2} fill={bone} opacity={0.5} />

      {/* === LEFT SKELETAL HAND (spell hand — raises during casting) === */}
      <g transform={isCasting ? `translate(${-castProgress * 3}, ${spellHandRaise})` : undefined}>
        {/* Forearm bone */}
        <line x1={5} y1={14} x2={0} y2={24} stroke={boneDark} strokeWidth={2} strokeLinecap="round" />
        <line x1={5} y1={14} x2={0} y2={24} stroke={boneLight} strokeWidth={0.6} opacity={0.3} strokeLinecap="round" />
        {/* Wrist */}
        <circle cx={0} cy={24} r={1.5} fill={bone} />
        {/* Fingers — reaching outward, spread during cast */}
        <line x1={0} y1={24} x2={-3 - fingerFlex - (isCasting ? 1.5 : 0)} y2={22 + (isCasting ? -1 : 0)} stroke={bone} strokeWidth={1} strokeLinecap="round" />
        <line x1={0} y1={24} x2={-4 - fingerFlex - (isCasting ? 2 : 0)} y2={24} stroke={bone} strokeWidth={1} strokeLinecap="round" />
        <line x1={0} y1={24} x2={-3 - fingerFlex - (isCasting ? 1.5 : 0)} y2={26 + (isCasting ? 1 : 0)} stroke={bone} strokeWidth={1} strokeLinecap="round" />
        <line x1={0} y1={24} x2={-2} y2={27} stroke={bone} strokeWidth={0.8} strokeLinecap="round" />
        {/* Claw tips */}
        <circle cx={-3 - fingerFlex} cy={22} r={0.5} fill={boneLight} />
        <circle cx={-4 - fingerFlex} cy={24} r={0.5} fill={boneLight} />
        <circle cx={-3 - fingerFlex} cy={26} r={0.5} fill={boneLight} />
        {/* Spell glow around hand — brighter during casting */}
        <circle cx={-2} cy={24} r={isCasting ? 7 : 5} fill={castGlowColor} opacity={isCasting ? 0.15 + castProgress * 0.15 : 0.08} />
        {/* Casting energy orb gathering at hand */}
        {isCasting && (
          <>
            <circle cx={-3} cy={23} r={2 + castProgress * 2} fill={castGlowColor} opacity={0.3 + castProgress * 0.3} />
            <circle cx={-3} cy={23} r={1 + castProgress} fill={isCastingIce ? '#88ccff' : glowBright} opacity={0.5 + castProgress * 0.3} />
            <circle cx={-3} cy={23} r={0.5} fill="#fff" opacity={castProgress * 0.8} />
          </>
        )}
      </g>

      {/* === RIGHT ARM (holding staff) === */}
      <g>
        {/* Forearm bone reaching to staff */}
        <line x1={24} y1={14} x2={26} y2={18} stroke={boneDark} strokeWidth={2} strokeLinecap="round" />
        <line x1={24} y1={14} x2={26} y2={18} stroke={boneLight} strokeWidth={0.6} opacity={0.3} strokeLinecap="round" />
        {/* Grip hand on staff */}
        <rect x={25} y={16} width={4} height={4} fill={bone} rx={1} />
        <line x1={25} y1={17.5} x2={29} y2={17.5} stroke={boneDark} strokeWidth={0.4} opacity={0.5} />
      </g>

      {/* === HOOD === */}
      <path d="M6,12 Q6,0 15,-2 Q24,0 24,12 Q20,16 15,15 Q10,16 6,12"
        fill={robe} stroke={robeLight} strokeWidth={0.5} />
      {/* Hood depth / inner shadow */}
      <path d="M8,12 Q8,2 15,0 Q22,2 22,12 Q18,14 15,13 Q12,14 8,12"
        fill={robeDark} opacity={0.6} />
      {/* Hood peak */}
      <polygon points="13,-2 15,-5 17,-2" fill={robe} />
      <line x1={15} y1={-5} x2={15} y2={-2} stroke={robeLight} strokeWidth={0.3} opacity={0.4} />
      {/* Hood fold lines */}
      <path d="M9,2 Q8,8 9,12" fill="none" stroke={robeLight} strokeWidth={0.4} opacity={0.25} />
      <path d="M21,2 Q22,8 21,12" fill="none" stroke={robeLight} strokeWidth={0.4} opacity={0.25} />

      {/* === SKULL FACE === */}
      {/* Skull base */}
      <ellipse cx={15} cy={8} rx={6} ry={6} fill={bone} />
      {/* Forehead highlight */}
      <ellipse cx={15} cy={5} rx={4} ry={2.5} fill={boneLight} opacity={0.3} />
      {/* Cheekbones */}
      <ellipse cx={10} cy={10} rx={2} ry={1.5} fill={boneDark} opacity={0.25} />
      <ellipse cx={20} cy={10} rx={2} ry={1.5} fill={boneDark} opacity={0.25} />
      {/* Temporal ridges */}
      <path d="M9,4 Q8,6 9,9" fill="none" stroke={boneDark} strokeWidth={0.5} opacity={0.3} />
      <path d="M21,4 Q22,6 21,9" fill="none" stroke={boneDark} strokeWidth={0.5} opacity={0.3} />

      {/* Skull cracks */}
      <path d="M13,2 L14,5 L12.5,6" fill="none" stroke={boneDark} strokeWidth={0.4} opacity={0.4} />
      <path d="M18,3 L17.5,5.5" fill="none" stroke={boneDark} strokeWidth={0.3} opacity={0.35} />

      {/* Hollow eye sockets */}
      <ellipse cx={12} cy={6} rx={2.8} ry={2.2} fill={socket} />
      <ellipse cx={18} cy={6} rx={2.8} ry={2.2} fill={socket} />
      {/* Socket edge definition */}
      <ellipse cx={12} cy={6} rx={2.8} ry={2.2} fill="none" stroke={boneDark} strokeWidth={0.4} />
      <ellipse cx={18} cy={6} rx={2.8} ry={2.2} fill="none" stroke={boneDark} strokeWidth={0.4} />

      {/* GREEN EYE GLOW */}
      <circle cx={12} cy={6} r={1.8} fill={glow} opacity={eyePulse} />
      <circle cx={18} cy={6} r={1.8} fill={glow} opacity={eyePulse} />
      {/* Eye glow cores */}
      <circle cx={12} cy={6} r={0.8} fill={glowBright} opacity={eyePulse * 0.7} />
      <circle cx={18} cy={6} r={0.8} fill={glowBright} opacity={eyePulse * 0.7} />

      {/* Nasal cavity */}
      <path d="M14,9 L15,10.5 L16,9 Z" fill={boneDark} opacity={0.5} />

      {/* === TEETH (jaw clatters during casting) === */}
      {/* Upper teeth row */}
      <rect x={10.5} y={12} width={1.2} height={1.8} fill={boneLight} rx={0.3} />
      <rect x={12} y={12} width={1} height={2.2} fill={boneLight} rx={0.3} />
      <rect x={13.3} y={12} width={1} height={1.6} fill={boneLight} rx={0.3} />
      <rect x={14.5} y={12} width={1} height={1.6} fill={boneLight} rx={0.3} />
      <rect x={15.8} y={12} width={1} height={2.2} fill={boneLight} rx={0.3} />
      <rect x={17} y={12} width={1} height={1.8} fill={boneLight} rx={0.3} />
      <rect x={18.3} y={12} width={1.2} height={1.6} fill={boneLight} rx={0.3} />
      {/* Jaw — clatters up/down during casting */}
      <path d={`M10,${13.5 + jawClatter} Q15,${16 + jawClatter} 20,${13.5 + jawClatter}`} fill="none" stroke={boneDark} strokeWidth={0.8} />
      {/* Lower teeth visible during jaw open */}
      {isCasting && jawClatter > 0.5 && (
        <>
          <rect x={11} y={13.5 + jawClatter} width={1} height={1} fill={boneLight} rx={0.2} opacity={0.7} />
          <rect x={14} y={13.5 + jawClatter} width={1} height={1.2} fill={boneLight} rx={0.2} opacity={0.7} />
          <rect x={17} y={13.5 + jawClatter} width={1} height={1} fill={boneLight} rx={0.2} opacity={0.7} />
        </>
      )}

      {/* === CROWN / CIRCLET === */}
      <path d="M9,2 L10,0 L12,-2 L13,1 L15,-3 L17,1 L18,-2 L20,0 L21,2"
        fill="none" stroke="#8888aa" strokeWidth={1} />
      {/* Crown jewel — pulses */}
      <circle cx={15} cy={-3} r={1.2 + crownPulse * 0.3} fill={glow} opacity={crownPulse} />
      <circle cx={15} cy={-3} r={0.5} fill={glowBright} opacity={crownPulse * 1.2} />
      <circle cx={15} cy={-3} r={2.5} fill={castGlowColor} opacity={crownPulse * 0.06} />
      {/* Side gems */}
      <circle cx={12} cy={-1.5} r={0.7} fill="#6644aa" opacity={0.6} />
      <circle cx={18} cy={-1.5} r={0.7} fill="#6644aa" opacity={0.6} />

      {/* === SOUL WISPS orbiting === */}
      <circle cx={w1x} cy={w1y} r={2.5} fill={glow} opacity={0.4} />
      <circle cx={w1x} cy={w1y} r={1} fill={glowBright} opacity={0.3} />
      <circle cx={w2x} cy={w2y} r={2} fill="#66ff66" opacity={0.35} />
      <circle cx={w2x} cy={w2y} r={0.8} fill={glowBright} opacity={0.25} />
      <circle cx={w3x} cy={w3y} r={2.2} fill="#33dd33" opacity={0.3} />

      {/* Wisp trails */}
      <line x1={w1x} y1={w1y} x2={w1x + 3} y2={w1y + 2} stroke={glow} strokeWidth={0.6} opacity={0.2} strokeLinecap="round" />
      <line x1={w2x} y1={w2y} x2={w2x - 2} y2={w2y + 3} stroke={glow} strokeWidth={0.5} opacity={0.15} strokeLinecap="round" />

      {/* === HIT FLASH === */}
      {recentlyHit && (
        <rect x={-2} y={-8} width={34} height={54} fill="#00ff00" opacity={0.1} rx={3} />
      )}

      {/* === CASTING RUNE CIRCLE === */}
      {isCasting && (
        <g>
          <ellipse cx={15} cy={42} rx={12 + castProgress * 6} ry={3 + castProgress * 2}
            fill="none" stroke={castGlowColor} strokeWidth={1} opacity={0.3 + castProgress * 0.3}
            strokeDasharray={`${3 + castProgress * 5} 2`} />
          {/* Rune marks around circle */}
          <circle cx={4 + Math.cos(tf * 0.15) * (12 + castProgress * 6)} cy={42} r={1} fill={castGlowColor} opacity={0.4 * castProgress} />
          <circle cx={26 + Math.cos(tf * 0.15 + 3.14) * (12 + castProgress * 6)} cy={42} r={1} fill={castGlowColor} opacity={0.4 * castProgress} />
          {/* Rising energy particles */}
          <circle cx={15 + Math.sin(tf * 0.3) * 4} cy={38 - castProgress * 8} r={1} fill={castGlowColor} opacity={0.3 * castProgress} />
          <circle cx={15 + Math.cos(tf * 0.25) * 6} cy={35 - castProgress * 6} r={0.8} fill={castGlowColor} opacity={0.25 * castProgress} />
        </g>
      )}

      {/* === SUMMON CHARGE === */}
      {summonCharging && !isCasting && (
        <circle cx={15} cy={20} r={20 + Math.sin(tf * 0.4) * 3} fill={glow} opacity={0.08} />
      )}

      {/* === SKELETON COUNT === */}
      {activeSkeletons > 0 && (
        <text x={15} y={-18} fontSize="9" textAnchor="middle">
          {'💀'.repeat(activeSkeletons)}
        </text>
      )}

      {/* === HEALTH BAR === */}
      <rect x={0} y={-12} width={30} height={5} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-11} width={Math.max(0, (health / maxHealth) * 28)} height={3}
            fill="#44cc44" rx={1} />
      {showHpNumbers && (
        <text x={15} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
      </g>
      </g>
    </g>
  );
}

export default memo(DetailedLich, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevCastIce = (prev.iceballCooldown ?? 0) >= 250;
  const nextCastIce = (next.iceballCooldown ?? 0) >= 250;
  if (prevCastIce !== nextCastIce) return false;
  if (prevCastIce && prev.iceballCooldown !== next.iceballCooldown) return false;
  const prevCastHeal = (prev.healCooldown ?? 0) >= 200;
  const nextCastHeal = (next.healCooldown ?? 0) >= 200;
  if (prevCastHeal !== nextCastHeal) return false;
  if (prevCastHeal && prev.healCooldown !== next.healCooldown) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.activeSkeletons !== next.activeSkeletons) return false;
  if (prev.passiveSummonTimer !== next.passiveSummonTimer) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
