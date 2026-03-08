import { memo } from 'react';
import { COLORS } from '../../constants';
import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  attackCooldown?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  bleedStacks?: number;
  isElite?: boolean;
  eliteVariantId?: string;
}

// Club swing angles per attackCooldown frame (7=start -> 0=end)
const SWING_ANGLES = [8, 30, 45, 10, -25, -15, -10, -5];

function DetailedGoblin({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, bleedStacks, isElite, eliteVariantId }: Props) {
  const isAttacking = attackCooldown < 8;
  const weaponAngle = isAttacking ? (SWING_ANGLES[attackCooldown] ?? 0) : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Throttled frame for JS animations — every 3 ticks
  // Per-goblin phase offset so they don't all blink/sniff/sway in unison
  const animOffset = Math.floor(Math.abs(x) * 7) % 200;
  const tf = Math.floor(frame / 3) * 3 + animOffset;

  // --- Idle animations (suppressed during attack) ---
  // Breathing — belly expansion
  const breathe = Math.sin(tf * 0.04) * 0.5;

  // Head sniff — periodic bobbing
  const sniffCycle = Math.sin(tf * 0.05);
  const headOffsetY = isAttacking ? 0 : (sniffCycle > 0.7 ? -1 : sniffCycle < -0.8 ? 0.5 : 0);

  // Eye blink — brief close every ~3s
  const blinkPhase = Math.sin(tf * 0.035);
  const eyeScale = (!isAttacking && blinkPhase > 0.92) ? 0.1 : 1;

  // Arm sway — gentle left arm idle motion
  const armAngle = isAttacking ? 0 : Math.sin(tf * 0.06) * 1.5;

  // Ear twitch — independent flickers
  const earFlick1 = Math.sin(tf * 0.07) * 1.2;
  const earFlick2 = Math.sin(tf * 0.09 + 2) * 1;

  // Toe fidget — slight foot shift
  const toeFidget = Math.sin(tf * 0.05) * 0.4;

  // Weapon idle bob — subtle handle sway when not swinging
  const weaponBob = isAttacking ? 0 : Math.sin(tf * 0.08) * 1.5;

  // Drool drip — periodic drip from mouth
  const dripPhase = (tf * 0.02) % (Math.PI * 2);
  const dripY = Math.max(0, Math.sin(dripPhase) * 6);
  const dripOpacity = dripY > 0.5 ? Math.max(0, 1 - dripY / 6) : 0;

  // Colors
  const skinGreen = '#6a9944';
  const skinDark = '#4a7733';
  const skinLight = '#8ab966';
  const mouthColor = '#3a5522';
  const loincloth = '#7a5a3a';
  const loinclothDark = '#5a3a1a';
  const weaponWood = '#6a4a2a';
  const weaponMetal = '#666';
  const wart = '#5a8833';

  // Arm sway transform (pivot at top-right of arm area)
  const armTransform = armAngle !== 0
    ? `translate(2, 8) rotate(${armAngle}) translate(-2, -8)`
    : undefined;

  const hpFrac = health / maxHealth;

  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      {/* Elite glow */}
      {isElite && eliteGlow && (
        <circle cx={12} cy={10} r={20} fill={eliteGlow} opacity={0.15 + Math.sin(tf * 0.06) * 0.05} />
      )}

      {/* Drop shadow */}
      <ellipse cx={12} cy={26} rx={9 + breathe * 0.3} ry={3} fill="rgba(0,0,0,0.25)" />

      {/* Body — flipped to face LEFT */}
      <g transform="translate(24, 0) scale(-1, 1)">

        {/* Back leg */}
        <g>
          <rect x={6} y={18} width={4} height={5} fill={skinDark} />
          <circle cx={8} cy={20} r={1.5} fill={skinGreen} />
          <rect x={4} y={22} width={6} height={3} fill={skinDark} rx={1} />
          <circle cx={5} cy={25} r={1} fill={skinDark} />
          <circle cx={7} cy={25.5} r={1} fill={skinDark} />
          <circle cx={9} cy={25} r={1} fill={skinDark} />
          <rect x={4.5} y={25} width={1} height={1.5} fill="#aa9" rx={0.3} />
          <rect x={6.5} y={25.5} width={1} height={1.5} fill="#aa9" rx={0.3} />
          <rect x={8.5} y={25} width={1} height={1.5} fill="#aa9" rx={0.3} />
        </g>

        {/* Body torso — with breathing */}
        <rect x={5} y={8 - breathe * 0.3} width={14} height={10 + breathe * 0.3} fill={skinGreen} rx={1} />
        <ellipse cx={12} cy={14} rx={6 + breathe * 0.3} ry={5 + breathe * 0.2} fill={skinLight} opacity={0.4} />
        <rect x={7} y={9} width={8} height={1} fill={skinDark} opacity={0.3} />
        <rect x={7} y={11} width={8} height={1} fill={skinDark} opacity={0.3} />

        {/* Loincloth */}
        <polygon points="5,16 4,22 8,21 7,16" fill={loincloth} />
        <polygon points="7,16 7,22 11,21 10,16" fill={loinclothDark} />
        <polygon points="10,16 10,22 14,21 13,16" fill={loincloth} />
        <polygon points="13,16 13,21 17,22 16,16" fill={loinclothDark} />
        <polygon points="16,16 16,21 19,22 19,16" fill={loincloth} />
        <rect x={4} y={15} width={16} height={2} fill="#8a6a3a" />
        <circle cx={12} cy={16} r={1.5} fill="#aa8a4a" />
        <ellipse cx={7} cy={9} rx={3} ry={2} fill={skinDark} opacity={0.4} />
        <circle cx={17} cy={11} r={1} fill={wart} />
        <circle cx={8} cy={14} r={0.8} fill={wart} />

        {/* Front leg — with toe fidget */}
        <g>
          <rect x={13} y={18} width={4} height={5} fill={skinGreen} />
          <circle cx={15} cy={20} r={1.5} fill={skinLight} />
          <rect x={12} y={22} width={6} height={3} fill={skinGreen} rx={1} />
          <circle cx={13 + toeFidget} cy={25} r={1} fill={skinGreen} />
          <circle cx={15} cy={25.5} r={1} fill={skinGreen} />
          <circle cx={17 - toeFidget * 0.5} cy={25} r={1} fill={skinGreen} />
          <rect x={12.5 + toeFidget} y={25} width={1} height={1.5} fill="#aa9" rx={0.3} />
          <rect x={14.5} y={25.5} width={1} height={1.5} fill="#aa9" rx={0.3} />
          <rect x={16.5 - toeFidget * 0.5} y={25} width={1} height={1.5} fill="#aa9" rx={0.3} />
        </g>

        {/* Left arm (clawed hand) — with idle sway */}
        <g transform={armTransform}>
          <rect x={1} y={8} width={4} height={7} fill={skinDark} />
          <circle cx={3} cy={12} r={1.2} fill={skinGreen} />
          <rect x={0} y={13} width={4} height={5} fill={skinGreen} />
          <rect x={-1} y={17} width={4} height={3} fill={skinGreen} rx={1} />
          <rect x={-2} y={19} width={1} height={2} fill={skinDark} rx={0.3} />
          <rect x={0} y={19.5} width={1} height={2} fill={skinDark} rx={0.3} />
          <rect x={2} y={19} width={1} height={2} fill={skinDark} rx={0.3} />
          <rect x={-2} y={20.5} width={1} height={1} fill="#aa9" rx={0.3} />
          <rect x={0} y={21} width={1} height={1} fill="#aa9" rx={0.3} />
          <rect x={2} y={20.5} width={1} height={1} fill="#aa9" rx={0.3} />
        </g>

        {/* Weapon arm — with rotation + idle bob */}
        <g transform={`translate(20, 8) rotate(${weaponAngle + weaponBob}) translate(-20, -8)`}>
          <g>
            <rect x={18} y={8} width={4} height={6} fill={skinGreen} />
            <rect x={19} y={13} width={4} height={4} fill={skinDark} />
            <rect x={20} y={6} width={3} height={3} fill={skinGreen} rx={0.5} />
            {/* Club handle */}
            <rect x={21} y={-6} width={3} height={16} fill={weaponWood} rx={0.5} />
            <rect x={21} y={6} width={3} height={1} fill="#554422" opacity={0.6} />
            <rect x={21} y={8} width={3} height={1} fill="#554422" opacity={0.6} />
            {/* Crude metal head */}
            <polygon points="20,-6 24,-6 26,-10 25,-12 22,-14 19,-11 18,-8" fill={weaponMetal} />
            <circle cx={22} cy={-9} r={1.5} fill="#8a6644" opacity={0.4} />
            <circle cx={20} cy={-7} r={1} fill="#8a5533" opacity={0.3} />
            <rect x={25} y={-9} width={1} height={2} fill="#555" rx={0.3} />
            <rect x={20} y={-6} width={5} height={2} fill="#8a6a3a" />
            <line x1={20} y1={-5} x2={25} y2={-5} stroke="#6a4a2a" strokeWidth={0.8} />
          </g>
        </g>

        {/* Head (oversized) — with sniff offset */}
        <g transform={headOffsetY !== 0 ? `translate(0, ${headOffsetY})` : undefined}>
          <rect x={3} y={-4} width={18} height={13} fill={skinGreen} rx={3} />
          <rect x={5} y={-4} width={14} height={3} fill={skinDark} rx={2} />
          <rect x={4} y={-1} width={16} height={2} fill={skinDark} rx={1} />

          {/* Eyes — with blink */}
          <g transform={eyeScale !== 1 ? `translate(12, 3) scale(1, ${eyeScale}) translate(-12, -3)` : undefined}>
            <ellipse cx={7} cy={3} rx={3} ry={2.5} fill="#ffe" />
            <ellipse cx={17} cy={3} rx={3} ry={2.5} fill="#ffe" />
            <ellipse cx={8} cy={3} rx={2} ry={2} fill="#ffee00" />
            <ellipse cx={18} cy={3} rx={2} ry={2} fill="#ffee00" />
            <ellipse cx={8} cy={3} rx={0.8} ry={2} fill="#222" />
            <ellipse cx={18} cy={3} rx={0.8} ry={2} fill="#222" />
            <circle cx={7} cy={2} r={0.8} fill="#fff" opacity={0.6} />
            <circle cx={17} cy={2} r={0.8} fill="#fff" opacity={0.6} />
            {/* Eye glow when attacking */}
            {isAttacking && <>
              <circle cx={8} cy={3} r={3} fill="#ffee00" opacity={0.15} />
              <circle cx={18} cy={3} r={3} fill="#ffee00" opacity={0.15} />
            </>}
          </g>

          {/* Nose */}
          <polygon points="11,4 13,4 12,7 10,6" fill={skinDark} />
          <circle cx={11} cy={6} r={0.6} fill={mouthColor} />
          <circle cx={13} cy={6} r={0.6} fill={mouthColor} />

          {/* Mouth — toothy grin */}
          <rect x={6} y={7} width={12} height={3} fill={mouthColor} rx={1} />
          <polygon points="7,7 8,9 9,7" fill="#ddc" />
          <polygon points="9,7 10,8.5 11,7" fill="#eee" />
          <polygon points="13,7 14,9 15,7" fill="#ddc" />
          <polygon points="15,7 16,8.5 17,7" fill="#eee" />
          <polygon points="8,10 9,8 10,10" fill="#ddc" />
          <polygon points="14,10 15,8.5 16,10" fill="#ddc" />

          {/* Drool drip */}
          {dripOpacity > 0 && (
            <circle cx={10} cy={10 + dripY} r={0.6} fill={skinLight} opacity={dripOpacity * 0.6} />
          )}

          {/* Left ear — with twitch */}
          <polygon points={`3,${0 + earFlick1 * 0.3} ${-4 + earFlick1},-2 ${-6 + earFlick1 * 0.5},2 -3,4 3,4`} fill={skinGreen} />
          <polygon points={`2,${0 + earFlick1 * 0.2} ${-3 + earFlick1 * 0.7},-1 ${-4 + earFlick1 * 0.3},2 -2,3 2,3`} fill={skinLight} opacity={0.4} />
          <circle cx={-3 + earFlick1 * 0.5} cy={0} r={1} fill={skinDark} opacity={0.5} />

          {/* Right ear + earring — with twitch */}
          <polygon points={`21,${0 + earFlick2 * 0.3} ${28 - earFlick2},-2 ${30 - earFlick2 * 0.5},2 27,4 21,4`} fill={skinGreen} />
          <polygon points={`22,${0 + earFlick2 * 0.2} ${27 - earFlick2 * 0.7},-1 ${28 - earFlick2 * 0.3},2 26,3 22,3`} fill={skinLight} opacity={0.4} />
          <circle cx={28 - earFlick2 * 0.3} cy={3} r={1} fill="#aa8833" />
          <circle cx={28 - earFlick2 * 0.3} cy={3} r={0.5} fill="#cc9944" />

          {/* Face warts */}
          <circle cx={5} cy={5} r={0.8} fill={wart} />
          <circle cx={16} cy={1} r={0.7} fill={wart} />
        </g>
      </g>

      {/* Attack flash (club swing) */}
      {isAttacking && attackCooldown < 3 && (
        <g opacity={0.6}>
          <line x1={-4} y1={-6} x2={-10} y2={6} stroke="#ff8" strokeWidth={2} strokeLinecap="round" />
        </g>
      )}

      {/* Hit flash overlay */}
      {recentlyHit && (
        <rect x={-4} y={-6} width={32} height={34} fill="white" opacity={0.15} rx={3} />
      )}

      {/* Bleed indicator */}
      {(bleedStacks ?? 0) > 0 && (
        <g>
          <circle cx={24} cy={-2} r={3} fill="#cc2222" opacity={0.7} />
          <text x={24} y={1} fontSize="5" textAnchor="middle" fill="white" fontWeight="bold">{bleedStacks}</text>
        </g>
      )}

      {/* Elite name tag */}
      {isElite && eliteVariantId && (
        <text x={12} y={-18} fontSize="6" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" opacity={0.9}>
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* Health bar */}
      <rect x={0} y={-10} width={24} height={5} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-9} width={Math.max(0, hpFrac * 22)} height={3} fill={COLORS.healthRed} rx={1} />
      {showHpNumbers && (
        <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}

export default memo(DetailedGoblin, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAttacking = (prev.attackCooldown ?? 99) < 8;
  const nextAttacking = (next.attackCooldown ?? 99) < 8;
  if (prevAttacking !== nextAttacking) return false;
  if (prevAttacking && prev.attackCooldown !== next.attackCooldown) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  if (prev.bleedStacks !== next.bleedStacks) return false;
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
