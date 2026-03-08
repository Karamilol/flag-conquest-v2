import { memo } from 'react';
import { COLORS } from '../../constants';
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
  skinColors?: Record<string, string>;
}

function DetailedSoldier({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, skinColors }: Props) {
  const isAttacking = attackCooldown < 10;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  const state = health <= 0 ? 'die' : isAttacking ? 'attack' : 'idle';

  // Colors
  const tabard = skinColors?.body || '#4a7fff';
  const tabardDark = skinColors?.accent || '#3a5fcc';
  const chainmail = '#7a7a8a';
  const chainmailLight = '#9a9aaa';
  const chainmailDark = '#5a5a6a';
  const metal = '#888898';
  const metalLight = '#aaabb8';
  const metalDark = '#5a5a68';
  const skin = '#f0c8a0';
  const leather = '#5a4a3a';
  const leatherDark = '#3a2a1a';
  const wood = '#7a5a3a';

  // Animation desync based on position
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className={`sprite-${state}`} style={delayStyle}>

        {/* === SHADOW === */}
        <ellipse cx={10} cy={28} rx={10} ry={3} fill="rgba(0,0,0,0.25)" />

        {/* === TABARD TAIL (behind body) === */}
        <g className="sprite-cape">
          <polygon points="4,10 2,26 0,27 5,12" fill={tabardDark} />
          <polygon points="5,10 3,25 2,26 4,12" fill={tabard} opacity={0.7} />
        </g>

        {/* === BACK LEG === */}
        <g className="sprite-leg-back sprite-part" style={{ transformOrigin: '8px 20px' }}>
          {/* Leg with chainmail */}
          <rect x={6} y={20} width={5} height={5} fill={chainmailDark} />
          {/* Boot */}
          <rect x={5} y={24} width={6} height={3} fill={leather} rx={1} />
          <rect x={5} y={26} width={7} height={2} fill={leatherDark} rx={1} />
        </g>

        {/* === TORSO === */}
        <g className="sprite-torso">
          {/* Chainmail base */}
          <rect x={3} y={6} width={14} height={12} fill={chainmail} rx={1} />
          {/* Chainmail texture (cross-hatch suggestion) */}
          <rect x={4} y={7} width={12} height={1} fill={chainmailLight} opacity={0.3} />
          <rect x={4} y={9} width={12} height={1} fill={chainmailLight} opacity={0.3} />
          <rect x={4} y={11} width={12} height={1} fill={chainmailLight} opacity={0.3} />
          <rect x={4} y={13} width={12} height={1} fill={chainmailLight} opacity={0.3} />
          <rect x={4} y={15} width={12} height={1} fill={chainmailLight} opacity={0.3} />
          {/* Tabard over chainmail */}
          <rect x={5} y={7} width={10} height={11} fill={tabard} opacity={0.85} />
          {/* Tabard center line */}
          <rect x={9} y={7} width={2} height={11} fill={tabardDark} opacity={0.5} />
          {/* Tabard border/trim */}
          <rect x={5} y={17} width={10} height={1} fill={tabardDark} />
          {/* Belt */}
          <rect x={3} y={17} width={14} height={2} fill={leather} />
          <rect x={8} y={17} width={4} height={2} fill="#a89040" rx={0.5} />
        </g>

        {/* === FRONT LEG === */}
        <g className="sprite-leg-front sprite-part" style={{ transformOrigin: '13px 20px' }}>
          {/* Leg with chainmail */}
          <rect x={11} y={20} width={5} height={5} fill={chainmail} />
          {/* Knee pad */}
          <circle cx={13.5} cy={21} r={2} fill={metalDark} />
          {/* Boot */}
          <rect x={10} y={24} width={6} height={3} fill={leather} rx={1} />
          <rect x={10} y={26} width={7} height={2} fill={leatherDark} rx={1} />
          {/* Boot toe */}
          <rect x={15} y={27} width={2} height={1} fill={leatherDark} rx={0.5} />
        </g>

        {/* === SHIELD ARM (left) === */}
        <g className="sprite-shield-arm sprite-part" style={{ transformOrigin: '3px 6px' }}>
          {/* Shoulder */}
          <rect x={0} y={5} width={6} height={4} fill={chainmail} rx={1} />
          {/* Arm */}
          <rect x={0} y={8} width={5} height={6} fill={chainmailDark} />
          {/* Gauntlet */}
          <rect x={-1} y={13} width={5} height={3} fill={metal} rx={1} />
          {/* Buckler shield */}
          <circle cx={0} cy={12} r={5} fill={metalDark} />
          <circle cx={0} cy={12} r={4} fill={metal} />
          <circle cx={0} cy={12} r={2.5} fill={tabard} />
          {/* Shield boss */}
          <circle cx={0} cy={12} r={1.2} fill={metalLight} />
          {/* Shield rim highlight */}
          <circle cx={0} cy={12} r={4.5} fill="none" stroke={metalLight} strokeWidth={0.5} opacity={0.4} />
        </g>

        {/* === WEAPON ARM (right) === */}
        <g className="sprite-weapon-arm sprite-part" style={{ transformOrigin: '18px 6px' }}>
          {/* Shoulder */}
          <rect x={14} y={5} width={6} height={4} fill={chainmail} rx={1} />
          {/* Arm */}
          <rect x={15} y={8} width={5} height={6} fill={chainmail} />
          {/* Gauntlet */}
          <rect x={16} y={13} width={5} height={3} fill={metal} rx={1} />
          {/* Hand */}
          <rect x={18} y={6} width={3} height={3} fill={skin} rx={0.5} />

          {/* === SHORT SWORD === */}
          <g className="sprite-weapon">
            {/* Pommel */}
            <circle cx={19.5} cy={18} r={1.5} fill="#a89040" />
            {/* Grip */}
            <rect x={18.5} y={12} width={2.5} height={6} fill={leather} rx={0.5} />
            {/* Crossguard */}
            <rect x={16} y={10} width={8} height={2.5} fill="#a89040" rx={0.5} />
            {/* Blade */}
            <rect x={18} y={-6} width={4} height={16} fill={metalLight} />
            {/* Fuller */}
            <rect x={19} y={-4} width={2} height={12} fill={metal} />
            {/* Edge highlight */}
            <rect x={18} y={-6} width={0.8} height={16} fill="#ccd" opacity={0.5} />
            {/* Tip */}
            <polygon points="18,-6 22,-6 20,-9" fill={metalLight} />
          </g>
        </g>

        {/* === ATTACK FLASH === */}
        {isAttacking && attackCooldown < 3 && (
          <g className="sprite-sword-flash">
            <line x1={22} y1={-4} x2={28} y2={10} stroke="#fff" strokeWidth={2} opacity={0.7} strokeLinecap="round" />
          </g>
        )}

        {/* === HEAD === */}
        <g className="sprite-head">
          {/* Face */}
          <rect x={4} y={-2} width={12} height={7} fill={skin} rx={1} />
          {/* Eyes */}
          <g className="sprite-eyes sprite-part" style={{ transformOrigin: '10px 1px' }}>
            <rect x={6} y={0} width={2} height={2} fill="#333" />
            <rect x={12} y={0} width={2} height={2} fill="#333" />
          </g>
          {/* Mouth hint */}
          <rect x={8} y={4} width={4} height={1} fill="#c8a080" rx={0.5} />

          {/* Kettle hat / iron helmet */}
          <rect x={2} y={-5} width={16} height={5} fill={metal} rx={2} />
          {/* Hat brim */}
          <rect x={0} y={-2} width={20} height={2} fill={metalDark} rx={1} />
          {/* Hat top */}
          <rect x={5} y={-7} width={10} height={4} fill={metalLight} rx={2} />
          {/* Hat rivet */}
          <circle cx={10} cy={-5} r={0.8} fill={metalLight} />
          {/* Helmet band */}
          <rect x={3} y={-4} width={14} height={1.5} fill={metal} rx={0.5} />
        </g>

        {/* === DAMAGE OVERLAY === */}
        {recentlyHit && (
          <rect x={-6} y={-8} width={32} height={38} fill="#ff0000" opacity={0.1} rx={2} />
        )}

        {/* === HEALTH BAR === */}
        <rect x={0} y={-12} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-11} width={Math.max(0, (health / maxHealth) * 18)} height={2}
              fill={COLORS.healthGreen} rx={1} />
        {showHpNumbers && (
          <text x={10} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    </g>
  );
}

export default memo(DetailedSoldier, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAttacking = (prev.attackCooldown ?? 99) < 10;
  const nextAttacking = (next.attackCooldown ?? 99) < 10;
  if (prevAttacking !== nextAttacking) return false;
  const prevHit = prev.lastDamageTime! > 0 && (prev.frame - prev.lastDamageTime!) < 10;
  const nextHit = next.lastDamageTime! > 0 && (next.frame - next.lastDamageTime!) < 10;
  if (prevHit !== nextHit) return false;
  return true;
});
