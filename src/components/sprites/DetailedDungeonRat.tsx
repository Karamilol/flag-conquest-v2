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

// Color palette — matted dungeon rodent
const FUR_DARK = '#3a2210';
const FUR_MID = '#5a3a1a';
const FUR_LIGHT = '#7a5a3a';
const BELLY = '#9a7a5a';
const EAR_PINK = '#b06060';
const EYE_RED = '#dd2222';
const TAIL_COLOR = '#4a2a14';
const TOOTH_WHITE = '#ddd';

function DetailedDungeonRat({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const tf = Math.floor(frame / 3) * 3;

  const isAttacking = attackCooldown < 10;
  const attackPhase = isAttacking ? attackCooldown / 10 : 0;
  // Bite lunge: head darts forward, mouth opens
  const biteLunge = isAttacking ? (1 - attackPhase) * -4 : 0;
  const jawOpen = isAttacking ? (1 - attackPhase) * 3 : 0;

  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  // Scurry offset — fast lateral jitter
  const scurry = Math.sin(tf * 0.4) * 2;
  // Fast bob — quick vertical bounce
  const bobOffset = Math.sin(tf * 0.3) * 1.5;

  // Whisker twitch
  const whiskerTwitch = Math.sin(tf * 0.5) * 3;

  // Leg scurry phases (alternating pairs)
  const frontLegRot = Math.sin(tf * 0.4) * 20;
  const backLegRot = Math.sin(tf * 0.4 + Math.PI) * 20;

  // Tail wave — sinusoidal multi-segment
  const tailWave1 = Math.sin(tf * 0.2) * 3;
  const tailWave2 = Math.sin(tf * 0.25) * 2;
  const tailWave3 = Math.sin(tf * 0.18) * 1.5;

  // Ear wiggle
  const earWiggle = Math.sin(tf * 0.35) * 2;

  // Nose twitch — rapid small movements
  const noseTwitch = Math.sin(tf * 0.6) * 0.5;

  // Body compression during lunge — crouches then springs
  const bodySquash = isAttacking ? (1 - attackPhase) * 0.8 : 0;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // CSS animation desync
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  return (
    <g transform={`translate(${x + scurry}, ${y + bobOffset}) scale(${eliteVariantId ? eliteScale : 1.35})`}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={8} cy={8} r={14} fill={eliteGlow} opacity={0.12 + Math.sin(tf * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={8} y={-14} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === SHADOW === */}
      <ellipse cx={8} cy={18} rx={6 + Math.abs(scurry) * 0.3} ry={2} fill="rgba(0,0,0,0.22)" />

      {/* Head group — sniffing animation / bite lunge */}
      <g className={isAttacking ? undefined : "sprite-goblin-head"} style={delayStyle} transform={isAttacking ? `translate(${biteLunge}, 0)` : undefined}>

        {/* === TAIL (behind body) === */}
        <path
          d={`M15,10 Q${18 + tailWave1},${7 + tailWave2} ${20 + tailWave2},${5 + tailWave3} Q${22 + tailWave3},${3 + tailWave1} ${23 + tailWave2},${4 + tailWave3}`}
          fill="none" stroke={TAIL_COLOR} strokeWidth={2} strokeLinecap="round"
        />
        {/* Tail mid segment — thinner */}
        <path
          d={`M${20 + tailWave2},${5 + tailWave3} Q${22 + tailWave3},${3 + tailWave1} ${23 + tailWave2},${4 + tailWave3}`}
          fill="none" stroke={FUR_DARK} strokeWidth={1.2} strokeLinecap="round"
        />
        {/* Tail tip — thinnest */}
        <line
          x1={23 + tailWave2} y1={4 + tailWave3}
          x2={24.5 + tailWave3} y2={3.5 + tailWave1 * 0.5}
          stroke={FUR_DARK} strokeWidth={0.7} strokeLinecap="round"
        />

        {/* === BACK LEGS === */}
        {/* Back-left leg */}
        <g transform={`rotate(${backLegRot}, 12, 14)`}>
          <line x1={12} y1={14} x2={13} y2={18} stroke={FUR_DARK} strokeWidth={2} strokeLinecap="round" />
          <ellipse cx={13} cy={18.5} rx={1.5} ry={1} fill={FUR_DARK} />
          {/* Claws */}
          <line x1={12} y1={19} x2={11.5} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={13} y1={19.2} x2={13} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={14} y1={19} x2={14.5} y2={18} stroke="#333" strokeWidth={0.5} />
        </g>
        {/* Back-right leg */}
        <g transform={`rotate(${-backLegRot}, 11, 14)`}>
          <line x1={11} y1={14} x2={10} y2={18} stroke={FUR_MID} strokeWidth={1.8} strokeLinecap="round" />
          <ellipse cx={10} cy={18.5} rx={1.3} ry={0.9} fill={FUR_MID} />
          <line x1={9} y1={19} x2={8.5} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={10} y1={19.2} x2={10} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={11} y1={19} x2={11.5} y2={18} stroke="#333" strokeWidth={0.5} />
        </g>

        {/* === BODY (compresses during lunge) === */}
        {/* Main body — dark outer */}
        <ellipse cx={8} cy={10 + bodySquash * 0.5} rx={8 + bodySquash * 0.5} ry={5 - bodySquash * 0.6} fill={FUR_MID} />
        {/* Body inner — lighter */}
        <ellipse cx={8} cy={10.5 + bodySquash * 0.4} rx={6.5 + bodySquash * 0.3} ry={3.8 - bodySquash * 0.4} fill={FUR_LIGHT} opacity={0.4} />
        {/* Belly highlight */}
        <ellipse cx={7} cy={12.5 + bodySquash * 0.3} rx={5 + bodySquash * 0.2} ry={2 - bodySquash * 0.3} fill={BELLY} opacity={0.3} />
        {/* Body outline */}
        <ellipse cx={8} cy={10 + bodySquash * 0.5} rx={8 + bodySquash * 0.5} ry={5 - bodySquash * 0.6} fill="none" stroke={FUR_DARK} strokeWidth={0.6} />

        {/* === FUR TEXTURE — back ridge strokes === */}
        <line x1={4} y1={6} x2={3.5} y2={5} stroke={FUR_DARK} strokeWidth={0.8} strokeLinecap="round" />
        <line x1={6} y1={5.5} x2={5.8} y2={4.5} stroke={FUR_DARK} strokeWidth={0.8} strokeLinecap="round" />
        <line x1={8} y1={5.2} x2={8} y2={4} stroke={FUR_DARK} strokeWidth={0.8} strokeLinecap="round" />
        <line x1={10} y1={5.5} x2={10.3} y2={4.5} stroke={FUR_DARK} strokeWidth={0.8} strokeLinecap="round" />
        <line x1={12} y1={6} x2={12.5} y2={5} stroke={FUR_DARK} strokeWidth={0.7} strokeLinecap="round" />
        <line x1={14} y1={7} x2={14.5} y2={6} stroke={FUR_DARK} strokeWidth={0.6} strokeLinecap="round" />
        {/* Side fur hash marks */}
        <line x1={3} y1={12} x2={2} y2={12.5} stroke={FUR_DARK} strokeWidth={0.5} opacity={0.4} />
        <line x1={13} y1={12} x2={14} y2={12.5} stroke={FUR_DARK} strokeWidth={0.5} opacity={0.4} />
        <line x1={4} y1={13} x2={3} y2={14} stroke={FUR_DARK} strokeWidth={0.5} opacity={0.3} />
        <line x1={12} y1={13} x2={13} y2={14} stroke={FUR_DARK} strokeWidth={0.5} opacity={0.3} />

        {/* === FRONT LEGS === */}
        {/* Front-left leg */}
        <g transform={`rotate(${frontLegRot}, 4, 14)`}>
          <line x1={4} y1={14} x2={3} y2={18} stroke={FUR_DARK} strokeWidth={2} strokeLinecap="round" />
          <ellipse cx={3} cy={18.5} rx={1.5} ry={1} fill={FUR_DARK} />
          <line x1={2} y1={19} x2={1.5} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={3} y1={19.2} x2={3} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={4} y1={19} x2={4.5} y2={18} stroke="#333" strokeWidth={0.5} />
        </g>
        {/* Front-right leg */}
        <g transform={`rotate(${-frontLegRot}, 5, 14)`}>
          <line x1={5} y1={14} x2={5.5} y2={18} stroke={FUR_MID} strokeWidth={1.8} strokeLinecap="round" />
          <ellipse cx={5.5} cy={18.5} rx={1.3} ry={0.9} fill={FUR_MID} />
          <line x1={4.5} y1={19} x2={4} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={5.5} y1={19.2} x2={5.5} y2={18} stroke="#333" strokeWidth={0.5} />
          <line x1={6.5} y1={19} x2={7} y2={18} stroke="#333" strokeWidth={0.5} />
        </g>

        {/* === HEAD === */}
        {/* Head shape — pointed snout */}
        <ellipse cx={1} cy={8} rx={4.5} ry={3.5} fill={FUR_LIGHT} />
        <ellipse cx={1} cy={8} rx={4.5} ry={3.5} fill="none" stroke={FUR_DARK} strokeWidth={0.5} />
        {/* Snout — elongated */}
        <ellipse cx={-2.5} cy={8.8} rx={2.8} ry={2} fill={FUR_MID} />
        {/* Snout highlight */}
        <ellipse cx={-2} cy={7.8} rx={1.5} ry={0.8} fill={BELLY} opacity={0.2} />
        {/* Nose tip — twitches */}
        <ellipse cx={-4.5 + noseTwitch} cy={8.5 + noseTwitch * 0.3} rx={1} ry={0.8} fill="#222" />
        <ellipse cx={-4.7 + noseTwitch} cy={8.2 + noseTwitch * 0.2} rx={0.4} ry={0.3} fill="#444" opacity={0.5} />

        {/* === TEETH (jaw opens during bite) === */}
        {/* Upper teeth */}
        <rect x={-4.2} y={9} width={1} height={1.5 + jawOpen * 0.2} fill={TOOTH_WHITE} rx={0.2} />
        <rect x={-3} y={9} width={1} height={1.3 + jawOpen * 0.2} fill={TOOTH_WHITE} rx={0.2} />
        {/* Lower jaw drops during bite */}
        {isAttacking && (
          <>
            <ellipse cx={-2.5} cy={9.5 + jawOpen} rx={2.5} ry={1.5} fill={FUR_MID} />
            <rect x={-4} y={9.5 + jawOpen * 0.5} width={0.8} height={1 + jawOpen * 0.15} fill={TOOTH_WHITE} rx={0.2} />
            <rect x={-3} y={9.5 + jawOpen * 0.5} width={0.8} height={0.8 + jawOpen * 0.15} fill={TOOTH_WHITE} rx={0.2} />
          </>
        )}

        {/* === WHISKERS (3 per side) === */}
        {/* Left side whiskers */}
        <line x1={-4} y1={7.5} x2={-8 - whiskerTwitch * 0.3} y2={6.5 + whiskerTwitch * 0.2}
          stroke="#888" strokeWidth={0.4} opacity={0.6} />
        <line x1={-4} y1={8.5} x2={-8.5 - whiskerTwitch * 0.2} y2={8.5}
          stroke="#888" strokeWidth={0.4} opacity={0.6} />
        <line x1={-4} y1={9.2} x2={-7.5 - whiskerTwitch * 0.3} y2={10 - whiskerTwitch * 0.2}
          stroke="#888" strokeWidth={0.4} opacity={0.5} />
        {/* Right side whiskers (shorter, further back) */}
        <line x1={-3} y1={7} x2={-5.5 - whiskerTwitch * 0.2} y2={5.5 + whiskerTwitch * 0.15}
          stroke="#888" strokeWidth={0.35} opacity={0.4} />
        <line x1={-3.5} y1={8} x2={-6 - whiskerTwitch * 0.15} y2={7.8}
          stroke="#888" strokeWidth={0.35} opacity={0.4} />
        <line x1={-3} y1={9.5} x2={-5.5 - whiskerTwitch * 0.2} y2={10.5 - whiskerTwitch * 0.15}
          stroke="#888" strokeWidth={0.35} opacity={0.4} />

        {/* === EYES (widen during bite) === */}
        {/* Eye socket */}
        <ellipse cx={0} cy={6.8} rx={1.5} ry={isAttacking ? 1.5 : 1.2} fill={FUR_DARK} />
        {/* Beady red eye */}
        <ellipse cx={0} cy={6.8} rx={1.2} ry={isAttacking ? 1.3 : 1} fill={isAttacking ? '#ff3333' : EYE_RED} />
        {/* Pupil */}
        <circle cx={-0.3} cy={6.8} r={0.5} fill="#000" opacity={0.8} />
        {/* Highlight */}
        <circle cx={0.4} cy={6.3} r={0.4} fill="#fff" opacity={0.7} />
        {/* Second eye (far side, partially hidden) */}
        <ellipse cx={2.2} cy={6.5} rx={0.9} ry={0.7} fill={FUR_DARK} />
        <ellipse cx={2.2} cy={6.5} rx={0.7} ry={0.55} fill={EYE_RED} opacity={0.7} />
        <circle cx={2.5} cy={6.2} r={0.3} fill="#fff" opacity={0.5} />

        {/* === EARS === */}
        {/* Left ear */}
        <ellipse cx={0 + earWiggle * 0.2} cy={4} rx={2} ry={2.5} fill={FUR_LIGHT}
          transform={`rotate(${-15 + earWiggle}, 0, 4)`} />
        <ellipse cx={0 + earWiggle * 0.2} cy={4} rx={1.2} ry={1.6} fill={EAR_PINK} opacity={0.5}
          transform={`rotate(${-15 + earWiggle}, 0, 4)`} />
        {/* Right ear */}
        <ellipse cx={3 + earWiggle * 0.15} cy={3.5} rx={1.8} ry={2.2} fill={FUR_MID}
          transform={`rotate(${10 - earWiggle * 0.8}, 3, 3.5)`} />
        <ellipse cx={3 + earWiggle * 0.15} cy={3.5} rx={1} ry={1.4} fill={EAR_PINK} opacity={0.35}
          transform={`rotate(${10 - earWiggle * 0.8}, 3, 3.5)`} />

        {/* === HEAD FUR DETAIL === */}
        <line x1={-1} y1={6} x2={-1.5} y2={5} stroke={FUR_DARK} strokeWidth={0.5} opacity={0.3} />
        <line x1={1} y1={5.5} x2={1.2} y2={4.5} stroke={FUR_DARK} strokeWidth={0.5} opacity={0.3} />
      </g>

      {/* === HIT FLASH === */}
      {recentlyHit && (
        <rect x={-6} y={-2} width={24} height={22} fill="#ff0000" opacity={0.15} rx={2} />
      )}

      {/* === HEALTH BAR === */}
      <rect x={0} y={-6} width={16} height={3} fill="#333" rx={1} />
      <rect x={0} y={-6} width={Math.max(0, 16 * (health / maxHealth))} height={3} fill="#aa4422" rx={1} />
      {showHpNumbers && (
        <text x={8} y={-8} fill="#fff" fontSize="6" textAnchor="middle">{health}/{maxHealth}</text>
      )}
    </g>
  );
}

export default memo(DetailedDungeonRat, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAtk = (prev.attackCooldown ?? 99) < 10;
  const nextAtk = (next.attackCooldown ?? 99) < 10;
  if (prevAtk !== nextAtk) return false;
  if (prevAtk && prev.attackCooldown !== next.attackCooldown) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
