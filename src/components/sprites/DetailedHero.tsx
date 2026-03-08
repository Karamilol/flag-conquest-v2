import { memo } from 'react';
import { COLORS } from '../../constants';
import type { Hero } from '../../types';
import './sprite-animations.css';

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

// Sword swing angle per attackCooldown frame (5=start → 0=end)
// Arc: wind-up behind (-30°) → forward slash (+55°) → return to rest
const SWING_ANGLES = [10, 35, 55, 15, -30, -20];

function DetailedHero({ x, y, health, maxHealth, isAttacking, attackCooldown, frame, lastDamageTime = 0, hideHealth, skinColors }: Props) {
  const justSwung = isAttacking && attackCooldown < 6;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 12;

  const state = health <= 0 ? 'die' : justSwung ? 'attack' : 'idle';

  // JS-computed sword rotation — reliable pivot at shoulder (26, 6)
  const weaponAngle = justSwung ? (SWING_ANGLES[attackCooldown] ?? 0) : 0;
  // Lunge forward during swing peak
  const lungeX = justSwung ? Math.sin((1 - attackCooldown / 5) * Math.PI) * 3 : 0;
  // Slash trail visibility — show during the forward part of the swing
  const showSlash = justSwung && attackCooldown <= 3 && attackCooldown >= 1;

  // Skin color overrides
  const armor = skinColors?.armor || '#3a5a9f';
  const armorLight = skinColors?.accent || '#4a6abf';
  const armorDark = skinColors?.armor ? '#2a3a6f' : '#2a3a6f';
  const cape = skinColors?.cape || '#8b2222';
  const capeDark = skinColors?.cape || '#6b1111';
  const crest = skinColors?.accent || '#cc3333';
  const metal = '#8a8a9a';
  const metalLight = '#aaaabc';
  const metalDark = '#5a5a6a';
  const skin = '#f0c8a0';
  const eyeColor = '#4af';
  const gold = '#c8a83e';
  const goldLight = '#e8c85e';
  const leather = '#5a4a3a';
  const leatherDark = '#3a2a1a';

  return (
    <g transform={`translate(${x + lungeX}, ${y})`}>
      <g className={`sprite-${state}`}>

        {/* === SHADOW === */}
        <ellipse cx={16} cy={36} rx={14} ry={4} fill="rgba(0,0,0,0.25)" />

        {/* === CAPE (behind everything) === */}
        <g className="sprite-cape">
          <polygon points="6,6 3,34 -1,36 0,32 4,10" fill={cape} />
          <polygon points="8,6 5,33 3,34 6,10" fill={capeDark} />
          <polygon points="5,12 3,28 4,28 6,12" fill={cape} opacity={0.6} />
          <polygon points="3,32 -1,36 1,35 4,33" fill={capeDark} opacity={0.8} />
          <polygon points="1,34 -2,37 0,36 2,34" fill={cape} opacity={0.5} />
        </g>

        {/* === BACK LEG === */}
        <g className="sprite-leg-back sprite-part" style={{ transformOrigin: '11px 26px' }}>
          <rect x={9} y={26} width={6} height={5} fill={metalDark} />
          <rect x={8} y={30} width={7} height={3} fill={metal} rx={1} />
          <rect x={9} y={32} width={6} height={4} fill={metalDark} />
          <rect x={8} y={35} width={8} height={3} fill={leatherDark} rx={1} />
          <rect x={14} y={36} width={3} height={2} fill={leatherDark} rx={1} />
        </g>

        {/* === TORSO === */}
        <g className="sprite-torso">
          <rect x={10} y={4} width={12} height={4} fill={metal} rx={1} />
          <rect x={7} y={7} width={18} height={16} fill={armor} rx={1} />
          <rect x={14} y={8} width={4} height={12} fill={armorLight} rx={1} />
          <polygon points="16,10 19,14 16,18 13,14" fill={armorLight} opacity={0.5} />
          <polygon points="16,11 18,14 16,17 14,14" fill={armor} opacity={0.7} />
          <rect x={7} y={7} width={18} height={1} fill={armorLight} opacity={0.4} />
          <rect x={7} y={22} width={18} height={1} fill={armorDark} opacity={0.5} />
          <circle cx={9} cy={9} r={0.8} fill={metalLight} />
          <circle cx={23} cy={9} r={0.8} fill={metalLight} />
          <circle cx={9} cy={20} r={0.8} fill={metalLight} />
          <circle cx={23} cy={20} r={0.8} fill={metalLight} />
          <rect x={6} y={23} width={20} height={3} fill={leather} />
          <rect x={14} y={23} width={4} height={3} fill={gold} rx={1} />
          <rect x={15} y={23.5} width={2} height={2} fill={goldLight} />
          <rect x={7} y={23} width={4} height={3} fill={leatherDark} rx={1} />
          <rect x={21} y={23} width={4} height={3} fill={leatherDark} rx={1} />
        </g>

        {/* === FRONT LEG === */}
        <g className="sprite-leg-front sprite-part" style={{ transformOrigin: '19px 26px' }}>
          <rect x={17} y={26} width={6} height={5} fill={metal} />
          <rect x={16} y={30} width={7} height={3} fill={metalLight} rx={1} />
          <circle cx={19.5} cy={31.5} r={1.5} fill={metal} />
          <rect x={17} y={32} width={6} height={4} fill={metal} />
          <rect x={19} y={32} width={1} height={4} fill={metalLight} opacity={0.5} />
          <rect x={16} y={35} width={8} height={3} fill={leather} rx={1} />
          <rect x={22} y={36} width={3} height={2} fill={leather} rx={1} />
          <rect x={23} y={36} width={2} height={2} fill={metalDark} rx={1} />
        </g>

        {/* === SHIELD ARM (left side) === */}
        <g className="sprite-shield-arm sprite-part" style={{ transformOrigin: '6px 6px' }}>
          <rect x={0} y={5} width={10} height={5} fill={metal} rx={2} />
          <rect x={1} y={6} width={8} height={3} fill={metalLight} rx={1} />
          <rect x={2} y={7} width={6} height={2} fill={metalDark} rx={1} />
          <rect x={2} y={10} width={6} height={5} fill={armor} />
          <rect x={1} y={14} width={7} height={5} fill={metal} rx={1} />
          <rect x={2} y={15} width={5} height={1} fill={metalLight} opacity={0.4} />
          <rect x={2} y={17} width={5} height={1} fill={metalLight} opacity={0.4} />
          <polygon points="-6,8 -6,22 -1,26 6,22 6,8" fill={armor} />
          <polygon points="-5,9 -5,21 -1,24 5,21 5,9" fill={armorLight} />
          <rect x={-2} y={12} width={4} height={1} fill={gold} />
          <rect x={-1} y={10} width={2} height={6} fill={gold} />
          <line x1={-6} y1={8} x2={6} y2={8} stroke={metalLight} strokeWidth={0.8} opacity={0.5} />
          <line x1={-3} y1={14} x2={-1} y2={18} stroke={armorDark} strokeWidth={0.6} opacity={0.4} />
          <line x1={3} y1={11} x2={4} y2={13} stroke={armorDark} strokeWidth={0.5} opacity={0.3} />
        </g>

        {/* === WEAPON ARM — JS rotation around shoulder (26,6) === */}
        <g transform={`translate(26, 6) rotate(${weaponAngle}) translate(-26, -6)`}>
          {/* CSS idle sway only when NOT attacking */}
          <g className={!justSwung ? 'sprite-weapon-arm' : ''}>
            {/* Pauldron */}
            <rect x={22} y={5} width={10} height={5} fill={metal} rx={2} />
            <rect x={23} y={6} width={8} height={3} fill={metalLight} rx={1} />
            <rect x={24} y={7} width={6} height={2} fill={metalDark} rx={1} />
            {/* Upper arm */}
            <rect x={24} y={10} width={6} height={5} fill={armor} />
            {/* Forearm / gauntlet */}
            <rect x={24} y={14} width={7} height={5} fill={metal} rx={1} />
            <rect x={25} y={15} width={5} height={1} fill={metalLight} opacity={0.4} />
            {/* Hand */}
            <rect x={28} y={8} width={4} height={4} fill={skin} rx={1} />

            {/* === SWORD === */}
            {/* Pommel */}
            <circle cx={30} cy={20} r={2} fill={gold} />
            <circle cx={30} cy={20} r={1} fill={goldLight} />
            {/* Grip */}
            <rect x={29} y={12} width={3} height={8} fill={leather} rx={0.5} />
            <rect x={29} y={13} width={3} height={1} fill={leatherDark} opacity={0.5} />
            <rect x={29} y={15} width={3} height={1} fill={leatherDark} opacity={0.5} />
            <rect x={29} y={17} width={3} height={1} fill={leatherDark} opacity={0.5} />
            {/* Crossguard */}
            <rect x={25} y={10} width={11} height={3} fill={gold} rx={1} />
            <rect x={26} y={11} width={9} height={1} fill={goldLight} />
            {/* Blade */}
            <rect x={28} y={-12} width={5} height={22} fill={metalLight} />
            <rect x={29.5} y={-10} width={2} height={18} fill={metal} />
            <rect x={28} y={-12} width={1} height={22} fill="#ccd" opacity={0.6} />
            <rect x={32} y={-12} width={1} height={22} fill="#dde" opacity={0.4} />
            {/* Blade tip */}
            <polygon points="28,-12 33,-12 30.5,-16" fill={metalLight} />
            <polygon points="29,-12 32,-12 30.5,-15" fill="#dde" opacity={0.4} />
          </g>
        </g>

        {/* === SLASH TRAIL — arc following blade path === */}
        {showSlash && (
          <g opacity={0.7 - (3 - attackCooldown) * 0.2}>
            {/* Curved slash arc — transforms with the weapon angle */}
            <g transform={`translate(26, 6) rotate(${weaponAngle}) translate(-26, -6)`}>
              <line x1={30} y1={-14} x2={32} y2={-18} stroke="#fff" strokeWidth={3} opacity={0.8} strokeLinecap="round" />
              <line x1={29} y1={-12} x2={33} y2={-17} stroke={armorLight} strokeWidth={1.5} opacity={0.5} strokeLinecap="round" />
            </g>
            {/* Static arc trail showing the sweep path */}
            <path
              d={`M ${38} ${-8} Q ${42} ${6}, ${36} ${18}`}
              fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.4}
              strokeLinecap="round"
            />
            <path
              d={`M ${36} ${-6} Q ${40} ${6}, ${34} ${16}`}
              fill="none" stroke={armorLight} strokeWidth={1.5} opacity={0.25}
              strokeLinecap="round"
            />
          </g>
        )}

        {/* === HEAD + HELMET === */}
        <g className="sprite-head">
          <rect x={8} y={-1} width={16} height={8} fill={skin} rx={1} />
          <g className="sprite-eyes sprite-part" style={{ transformOrigin: '16px 2px' }}>
            <rect x={11} y={1} width={3} height={2} fill={eyeColor} />
            <rect x={18} y={1} width={3} height={2} fill={eyeColor} />
            <rect x={11} y={1} width={3} height={2} fill="#fff" opacity={0.3} />
            <rect x={18} y={1} width={3} height={2} fill="#fff" opacity={0.3} />
          </g>
          <rect x={6} y={-4} width={20} height={8} fill={metal} rx={2} />
          <rect x={8} y={-7} width={16} height={5} fill={metalLight} rx={2} />
          <rect x={6} y={-1} width={20} height={3} fill={metalDark} />
          <rect x={10} y={0} width={12} height={1.5} fill="#1a1a2e" />
          <rect x={15} y={-1} width={2} height={4} fill="#1a1a2e" />
          <circle cx={8} cy={-2} r={0.7} fill={metalLight} />
          <circle cx={24} cy={-2} r={0.7} fill={metalLight} />
          <circle cx={12} cy={-5} r={0.7} fill={metalLight} />
          <circle cx={20} cy={-5} r={0.7} fill={metalLight} />
          <rect x={7} y={-4} width={18} height={2} fill={metal} rx={1} />
          <rect x={8} y={-4} width={16} height={1} fill={metalLight} opacity={0.3} />
          <polygon points="7,-3 3,-6 6,-1" fill={metalDark} />
          <polygon points="25,-3 29,-6 26,-1" fill={metalDark} />
          {/* Plume */}
          <g className="sprite-plume sprite-part">
            <rect x={13} y={-9} width={6} height={3} fill={crest} rx={1} />
            <rect x={12} y={-14} width={4} height={6} fill={crest} rx={1} />
            <rect x={14} y={-17} width={4} height={9} fill={crest} rx={1} />
            <rect x={16} y={-15} width={3} height={7} fill={crest} rx={1} />
            <rect x={13} y={-13} width={2} height={4} fill="#dd5555" opacity={0.5} />
            <rect x={15} y={-16} width={2} height={6} fill="#dd5555" opacity={0.4} />
          </g>
        </g>

        {/* === DAMAGE FLASH OVERLAY === */}
        {recentlyHit && (
          <rect x={-8} y={-18} width={52} height={58} fill="#ff0000" opacity={0.1} rx={3} />
        )}

        {/* === HEALTH BAR === */}
        {!hideHealth && (
          <g>
            <rect x={-2} y={-24} width={36} height={7} fill={COLORS.healthBg} rx={2} />
            <rect x={-1} y={-23} width={Math.max(0, (health / maxHealth) * 34)} height={5}
                  fill={health > maxHealth * 0.3 ? COLORS.healthGreen : COLORS.healthRed} rx={1} />
            <text x={16} y={-28} fontSize="10" textAnchor="middle" fill="#fff" fontWeight="bold">
              {health}/{maxHealth}
            </text>
          </g>
        )}
      </g>
    </g>
  );
}

export default memo(DetailedHero, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAttacking = prev.isAttacking && prev.attackCooldown < 6;
  const nextAttacking = next.isAttacking && next.attackCooldown < 6;
  // During attack, re-render each frame for the swing animation
  if (prevAttacking || nextAttacking) {
    if (prev.attackCooldown !== next.attackCooldown) return false;
  }
  if (prevAttacking !== nextAttacking) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 12;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 12;
  if (prevHit !== nextHit) return false;
  if (prev.hideHealth !== next.hideHealth) return false;
  return true;
});
