import { memo } from 'react';
import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';
import './sprite-animations.css';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  isCasting: boolean;
  castTimer: number;
  castTargetX: number;
  castTargetY: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

// Named color palette — fiery imp tones
const SKIN = '#cc3311';
const SKIN_DARK = '#991a08';
const SKIN_LIGHT = '#dd4422';
const BELLY = '#ff6633';
const BELLY_HIGHLIGHT = '#ff8855';
const HORN_BASE = '#771100';
const HORN_TIP = '#aa4422';
const EYE_YELLOW = '#ffdd00';
const EYE_WHITE = '#ffffaa';
const FIRE_ORANGE = '#ff6600';
const FIRE_RED = '#ff3300';
const FIRE_BRIGHT = '#ffcc44';
const EMBER = '#ff4400';

function DetailedFireImp({ x, y, health, maxHealth, frame, isCasting, castTimer, castTargetX, castTargetY, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  // Throttled frame for JS animations
  const tf = Math.floor(frame / 3) * 3;

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Animation values
  const castPulse = isCasting ? 0.5 + Math.sin(tf * 0.2) * 0.5 : 0;
  const earWiggle = Math.sin(tf * 0.15) * 1.5;
  const tailCurl = Math.sin(tf * 0.1) * 8;
  const tailFlick = Math.sin(tf * 0.18) * 3;
  const legScurry = Math.sin(tf * 0.2) * 2;
  const bodyLean = isCasting ? 2 : 0;
  const mouthOpen = isCasting ? 2.5 : 1;
  const eyeGlow = isCasting ? 1 : 0.7 + Math.sin(tf * 0.12) * 0.2;
  const wingSpread = isCasting ? 6 + Math.sin(tf * 0.4) * 2 : 1;
  const hornFlame1 = 0.5 + Math.sin(tf * 0.25) * 0.4;
  const hornFlame2 = 0.5 + Math.sin(tf * 0.25 + 1.5) * 0.4;

  // CSS animation desync
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  // Casting fireball position between hands
  const castBallSize = isCasting ? 2 + castPulse * 3 : 0;

  return (
    <g transform={`translate(${x}, ${y}) scale(${eliteVariantId ? eliteScale : 1.35})`}>
      {/* Fast jittery bob for imps */}
      <g className="sprite-idle" style={{ ...delayStyle, animationDuration: '0.9s' }}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={10} cy={10} r={18} fill={eliteGlow} opacity={0.12 + Math.sin(tf * 0.2) * 0.06} />
      )}
      {eliteVariantId && (
        <text x={10} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === GROUND SHADOW (fiery tint) === */}
      <ellipse cx={10} cy={22} rx={8} ry={2.5} fill="rgba(50,10,0,0.3)" />
      <ellipse cx={10} cy={22} rx={6} ry={1.8} fill={EMBER} opacity={0.08} />

      {/* === FIRE RUNE CIRCLE (casting) === */}
      {isCasting && (
        <g>
          <ellipse cx={10} cy={22} rx={10 + castPulse * 2} ry={3 + castPulse}
            fill="none" stroke={FIRE_ORANGE} strokeWidth={0.8}
            strokeDasharray={`${2 + castPulse * 3} 2`} opacity={0.4 + castPulse * 0.3} />
          <ellipse cx={10} cy={22} rx={7} ry={2}
            fill={FIRE_RED} opacity={0.08 + castPulse * 0.06} />
          {/* Rune marks */}
          {[0, 1, 2, 3].map(i => {
            const ra = (tf * 0.08 + i * Math.PI / 2);
            const rx2 = 10 + Math.cos(ra) * 9;
            const ry2 = 22 + Math.sin(ra) * 2.5;
            return <circle key={`rune${i}`} cx={rx2} cy={ry2} r={0.8} fill={FIRE_BRIGHT} opacity={0.5 + castPulse * 0.3} />;
          })}
        </g>
      )}

      {/* === CASTING GLOW === */}
      {isCasting && <circle cx={10} cy={8} r={14 + castPulse * 5} fill={FIRE_RED} opacity={castPulse * 0.12} />}

      {/* === TAIL (behind body) === */}
      <g>
        <path
          d={`M${7},${16} Q${4 - tailFlick},${18 + tailCurl * 0.3} ${2 - tailFlick},${14} Q${0 - tailFlick},${10} ${1 - tailFlick * 0.5},${8}`}
          fill="none" stroke={hitFlash ? '#fff' : SKIN_DARK} strokeWidth={1.8} strokeLinecap="round"
        />
        {/* Spade tip */}
        <polygon
          points={`${1 - tailFlick * 0.5},${8} ${-1 - tailFlick * 0.5},${6} ${3 - tailFlick * 0.5},${6} ${1 - tailFlick * 0.5},${9}`}
          fill={hitFlash ? '#fff' : SKIN_DARK}
        />
        {/* Tail tip ember glow */}
        <circle cx={1 - tailFlick * 0.5} cy={7} r={2} fill={FIRE_ORANGE} opacity={0.2 + Math.sin(tf * 0.15) * 0.15} />
      </g>

      {/* === WINGS (small vestigial, behind body) === */}
      <g>
        {/* Left wing */}
        <g transform={`translate(5, 8) rotate(${isCasting ? -30 - wingSpread : -15 + earWiggle * 0.5})`}>
          {/* Membrane segments */}
          <path d={`M0,0 L${-3 - wingSpread},${-2} L${-2 - wingSpread * 0.7},${1} L${-3.5 - wingSpread},${3} L${-1},${2} Z`}
            fill={hitFlash ? '#fff' : SKIN_DARK} opacity={0.8} />
          {/* Veins */}
          <line x1={0} y1={0} x2={-3 - wingSpread} y2={-2} stroke={HORN_BASE} strokeWidth={0.4} opacity={0.6} />
          <line x1={0} y1={0} x2={-2 - wingSpread * 0.7} y2={1} stroke={HORN_BASE} strokeWidth={0.3} opacity={0.5} />
          <line x1={0} y1={0} x2={-3.5 - wingSpread} y2={3} stroke={HORN_BASE} strokeWidth={0.4} opacity={0.6} />
          {/* Wing membrane translucency */}
          <path d={`M0,0 L${-3 - wingSpread},${-2} L${-2 - wingSpread * 0.7},${1} Z`}
            fill={SKIN_LIGHT} opacity={0.15} />
        </g>
        {/* Right wing */}
        <g transform={`translate(15, 8) rotate(${isCasting ? 30 + wingSpread : 15 - earWiggle * 0.5})`}>
          <path d={`M0,0 L${3 + wingSpread},${-2} L${2 + wingSpread * 0.7},${1} L${3.5 + wingSpread},${3} L${1},${2} Z`}
            fill={hitFlash ? '#fff' : SKIN_DARK} opacity={0.8} />
          <line x1={0} y1={0} x2={3 + wingSpread} y2={-2} stroke={HORN_BASE} strokeWidth={0.4} opacity={0.6} />
          <line x1={0} y1={0} x2={2 + wingSpread * 0.7} y2={1} stroke={HORN_BASE} strokeWidth={0.3} opacity={0.5} />
          <line x1={0} y1={0} x2={3.5 + wingSpread} y2={3} stroke={HORN_BASE} strokeWidth={0.4} opacity={0.6} />
          <path d={`M0,0 L${3 + wingSpread},${-2} L${2 + wingSpread * 0.7},${1} Z`}
            fill={SKIN_LIGHT} opacity={0.15} />
        </g>
      </g>

      {/* === BODY (hunched, leaning forward when casting) === */}
      <g transform={`translate(${bodyLean}, 0)`}>
        {/* Outer body / skin */}
        <ellipse cx={10} cy={14} rx={6} ry={6.5} fill={hitFlash ? '#fff' : SKIN} />
        {/* Shoulder scale texture */}
        <circle cx={6} cy={11} r={1} fill={SKIN_DARK} opacity={0.4} />
        <circle cx={7.5} cy={10} r={0.8} fill={SKIN_DARK} opacity={0.35} />
        <circle cx={14} cy={11} r={1} fill={SKIN_DARK} opacity={0.4} />
        <circle cx={12.5} cy={10} r={0.8} fill={SKIN_DARK} opacity={0.35} />
        <circle cx={6.5} cy={13} r={0.7} fill={SKIN_DARK} opacity={0.3} />
        <circle cx={13.5} cy={13} r={0.7} fill={SKIN_DARK} opacity={0.3} />
        {/* Belly (lighter) */}
        <ellipse cx={10} cy={15} rx={4} ry={4.5} fill={hitFlash ? '#fff' : BELLY} />
        {/* Belly highlight */}
        <ellipse cx={10} cy={14} rx={2.5} ry={2.5} fill={hitFlash ? '#fff' : BELLY_HIGHLIGHT} opacity={0.4} />

        {/* === LEGS (digitigrade / demon bent) === */}
        {/* Left leg */}
        <g>
          {/* Upper leg */}
          <line x1={7} y1={19} x2={5.5 + legScurry * 0.5} y2={22} stroke={hitFlash ? '#fff' : SKIN} strokeWidth={2.5} strokeLinecap="round" />
          {/* Lower leg (bent backward) */}
          <line x1={5.5 + legScurry * 0.5} y1={22} x2={7 + legScurry} y2={21} stroke={hitFlash ? '#fff' : SKIN_DARK} strokeWidth={2} strokeLinecap="round" />
          {/* Foot / claws */}
          <line x1={7 + legScurry} y1={21} x2={5.5 + legScurry} y2={22.5} stroke={HORN_BASE} strokeWidth={1} strokeLinecap="round" />
          <line x1={7 + legScurry} y1={21} x2={7.5 + legScurry} y2={22.5} stroke={HORN_BASE} strokeWidth={1} strokeLinecap="round" />
          <line x1={7 + legScurry} y1={21} x2={9 + legScurry} y2={22} stroke={HORN_BASE} strokeWidth={1} strokeLinecap="round" />
        </g>
        {/* Right leg */}
        <g>
          <line x1={13} y1={19} x2={14.5 - legScurry * 0.5} y2={22} stroke={hitFlash ? '#fff' : SKIN} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={14.5 - legScurry * 0.5} y1={22} x2={13 - legScurry} y2={21} stroke={hitFlash ? '#fff' : SKIN_DARK} strokeWidth={2} strokeLinecap="round" />
          <line x1={13 - legScurry} y1={21} x2={11 - legScurry} y2={22.5} stroke={HORN_BASE} strokeWidth={1} strokeLinecap="round" />
          <line x1={13 - legScurry} y1={21} x2={13.5 - legScurry} y2={22.5} stroke={HORN_BASE} strokeWidth={1} strokeLinecap="round" />
          <line x1={13 - legScurry} y1={21} x2={14.5 - legScurry} y2={22} stroke={HORN_BASE} strokeWidth={1} strokeLinecap="round" />
        </g>

        {/* === ARMS / HANDS === */}
        {isCasting ? (
          <>
            {/* Casting: arms thrust forward, palms open, leaning eagerly */}
            {/* Left arm */}
            <line x1={5} y1={11} x2={-1} y2={7} stroke={hitFlash ? '#fff' : SKIN} strokeWidth={2} strokeLinecap="round" />
            <line x1={-1} y1={7} x2={1} y2={4} stroke={hitFlash ? '#fff' : SKIN_LIGHT} strokeWidth={1.8} strokeLinecap="round" />
            {/* Left hand fingers spread */}
            <line x1={1} y1={4} x2={-1} y2={2} stroke={SKIN_LIGHT} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={1} y1={4} x2={0} y2={1} stroke={SKIN_LIGHT} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={1} y1={4} x2={2} y2={1.5} stroke={SKIN_LIGHT} strokeWidth={0.8} strokeLinecap="round" />
            {/* Finger sparks */}
            <circle cx={-1} cy={1.5} r={0.7} fill={FIRE_BRIGHT} opacity={castPulse * 0.8} />
            <circle cx={2} cy={1} r={0.6} fill={FIRE_ORANGE} opacity={castPulse * 0.7} />

            {/* Right arm */}
            <line x1={15} y1={11} x2={21} y2={7} stroke={hitFlash ? '#fff' : SKIN} strokeWidth={2} strokeLinecap="round" />
            <line x1={21} y1={7} x2={19} y2={4} stroke={hitFlash ? '#fff' : SKIN_LIGHT} strokeWidth={1.8} strokeLinecap="round" />
            {/* Right hand fingers spread */}
            <line x1={19} y1={4} x2={21} y2={2} stroke={SKIN_LIGHT} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={19} y1={4} x2={20} y2={1} stroke={SKIN_LIGHT} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={19} y1={4} x2={18} y2={1.5} stroke={SKIN_LIGHT} strokeWidth={0.8} strokeLinecap="round" />
            {/* Finger sparks */}
            <circle cx={21} cy={1.5} r={0.7} fill={FIRE_BRIGHT} opacity={castPulse * 0.6} />
            <circle cx={18} cy={1} r={0.6} fill={FIRE_ORANGE} opacity={castPulse * 0.9} />

            {/* Fire gathering between hands */}
            <circle cx={10} cy={3} r={castBallSize} fill={FIRE_RED} opacity={0.7 + castPulse * 0.2} />
            <circle cx={10} cy={3} r={castBallSize * 0.6} fill={FIRE_ORANGE} opacity={0.8} />
            <circle cx={10} cy={3} r={castBallSize * 0.3} fill={FIRE_BRIGHT} opacity={0.9} />
            <circle cx={10} cy={3} r={castBallSize + 2} fill={EMBER} opacity={0.1 + castPulse * 0.08} />
          </>
        ) : (
          <>
            {/* Idle: small clawed hands at sides */}
            {/* Left arm */}
            <line x1={5} y1={11} x2={2} y2={15} stroke={hitFlash ? '#fff' : SKIN} strokeWidth={2} strokeLinecap="round" />
            {/* Left claw fingers */}
            <line x1={2} y1={15} x2={0} y2={16} stroke={SKIN_DARK} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={2} y1={15} x2={1} y2={17} stroke={SKIN_DARK} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={2} y1={15} x2={3} y2={17} stroke={SKIN_DARK} strokeWidth={0.8} strokeLinecap="round" />
            {/* Right arm */}
            <line x1={15} y1={11} x2={18} y2={15} stroke={hitFlash ? '#fff' : SKIN} strokeWidth={2} strokeLinecap="round" />
            {/* Right claw fingers */}
            <line x1={18} y1={15} x2={20} y2={16} stroke={SKIN_DARK} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={18} y1={15} x2={19} y2={17} stroke={SKIN_DARK} strokeWidth={0.8} strokeLinecap="round" />
            <line x1={18} y1={15} x2={17} y2={17} stroke={SKIN_DARK} strokeWidth={0.8} strokeLinecap="round" />
          </>
        )}

        {/* === HEAD (oversized, impish) === */}
        <g>
          {/* Head base */}
          <ellipse cx={10} cy={5} rx={5.5} ry={5} fill={hitFlash ? '#fff' : SKIN_LIGHT} />
          {/* Forehead */}
          <ellipse cx={10} cy={3} rx={4.5} ry={3} fill={hitFlash ? '#fff' : SKIN} opacity={0.5} />
          {/* Pointed chin */}
          <polygon points="8,9 10,11 12,9" fill={hitFlash ? '#fff' : SKIN_LIGHT} />

          {/* === HORNS (curved, ridged) === */}
          {/* Left horn */}
          <path d="M6,2 Q4,-1 3,-4 Q2.5,-5 3.5,-6" fill="none" stroke={hitFlash ? '#fff' : HORN_BASE} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M6,2 Q4,-1 3,-4 Q2.5,-5 3.5,-6" fill="none" stroke={HORN_TIP} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
          {/* Horn ridges */}
          <line x1={4.5} y1={-1} x2={5.5} y2={-0.5} stroke={HORN_BASE} strokeWidth={0.5} opacity={0.6} />
          <line x1={3.8} y1={-3} x2={4.8} y2={-2.5} stroke={HORN_BASE} strokeWidth={0.5} opacity={0.5} />
          <line x1={3.2} y1={-4.5} x2={4} y2={-4} stroke={HORN_TIP} strokeWidth={0.4} opacity={0.5} />
          {/* Horn tip flames */}
          <circle cx={3.5} cy={-6.5} r={1.2} fill={FIRE_ORANGE} opacity={hornFlame1} />
          <circle cx={3} cy={-7.5} r={0.8} fill={FIRE_BRIGHT} opacity={hornFlame1 * 0.7} />

          {/* Right horn */}
          <path d="M14,2 Q16,-1 17,-4 Q17.5,-5 16.5,-6" fill="none" stroke={hitFlash ? '#fff' : HORN_BASE} strokeWidth={2.2} strokeLinecap="round" />
          <path d="M14,2 Q16,-1 17,-4 Q17.5,-5 16.5,-6" fill="none" stroke={HORN_TIP} strokeWidth={1} opacity={0.4} strokeLinecap="round" />
          {/* Horn ridges */}
          <line x1={15.5} y1={-1} x2={14.5} y2={-0.5} stroke={HORN_BASE} strokeWidth={0.5} opacity={0.6} />
          <line x1={16.2} y1={-3} x2={15.2} y2={-2.5} stroke={HORN_BASE} strokeWidth={0.5} opacity={0.5} />
          <line x1={16.8} y1={-4.5} x2={16} y2={-4} stroke={HORN_TIP} strokeWidth={0.4} opacity={0.5} />
          {/* Horn tip flames */}
          <circle cx={16.5} cy={-6.5} r={1.2} fill={FIRE_ORANGE} opacity={hornFlame2} />
          <circle cx={17} cy={-7.5} r={0.8} fill={FIRE_BRIGHT} opacity={hornFlame2 * 0.7} />

          {/* === EARS (large, bat-like) === */}
          {/* Left ear */}
          <polygon
            points={`4,4 ${0 - earWiggle},${2 + earWiggle * 0.3} ${1},${5}`}
            fill={hitFlash ? '#fff' : SKIN_DARK}
          />
          <polygon
            points={`4,4 ${1 - earWiggle * 0.7},${2.5 + earWiggle * 0.2} ${1.5},${4.5}`}
            fill={BELLY} opacity={0.5}
          />
          {/* Right ear */}
          <polygon
            points={`16,4 ${20 + earWiggle},${2 + earWiggle * 0.3} ${19},${5}`}
            fill={hitFlash ? '#fff' : SKIN_DARK}
          />
          <polygon
            points={`16,4 ${19 + earWiggle * 0.7},${2.5 + earWiggle * 0.2} ${18.5},${4.5}`}
            fill={BELLY} opacity={0.5}
          />

          {/* === EYES (large, glowing, cat-like slits) === */}
          {/* Eye whites / glow */}
          <ellipse cx={7.5} cy={4.5} rx={2} ry={1.8} fill={EYE_YELLOW} opacity={eyeGlow} />
          <ellipse cx={12.5} cy={4.5} rx={2} ry={1.8} fill={EYE_YELLOW} opacity={eyeGlow} />
          {/* Slit pupils */}
          <ellipse cx={7.5} cy={4.5} rx={0.6} ry={1.5} fill="#220000" />
          <ellipse cx={12.5} cy={4.5} rx={0.6} ry={1.5} fill="#220000" />
          {/* Eye shine */}
          <circle cx={8} cy={3.8} r={0.5} fill={EYE_WHITE} opacity={0.7} />
          <circle cx={13} cy={3.8} r={0.5} fill={EYE_WHITE} opacity={0.7} />
          {/* Outer glow when casting */}
          {isCasting && (
            <>
              <ellipse cx={7.5} cy={4.5} rx={3} ry={2.5} fill={EYE_YELLOW} opacity={0.15} />
              <ellipse cx={12.5} cy={4.5} rx={3} ry={2.5} fill={EYE_YELLOW} opacity={0.15} />
            </>
          )}

          {/* === MOUTH (wicked grin with teeth) === */}
          {/* Mouth opening */}
          <path d={`M6.5,${7.5} Q10,${7.5 + mouthOpen} 13.5,${7.5}`}
            fill="#330000" stroke={SKIN_DARK} strokeWidth={0.4} />
          {/* Sharp teeth — tiny white triangles along mouth */}
          <polygon points={`7,${7.5} 7.5,${7.5 + mouthOpen * 0.5} 8,${7.5}`} fill="#eeddcc" />
          <polygon points={`8.5,${7.5} 9,${7.5 + mouthOpen * 0.6} 9.5,${7.5}`} fill="#eeddcc" />
          <polygon points={`10,${7.5} 10.4,${7.5 + mouthOpen * 0.5} 10.8,${7.5}`} fill="#eeddcc" />
          <polygon points={`11.5,${7.5} 12,${7.5 + mouthOpen * 0.6} 12.5,${7.5}`} fill="#eeddcc" />
          {/* Bottom teeth (fewer) */}
          <polygon points={`8,${7.5 + mouthOpen} 8.5,${7.5 + mouthOpen * 0.5} 9,${7.5 + mouthOpen}`} fill="#ddccbb" opacity={0.8} />
          <polygon points={`11,${7.5 + mouthOpen} 11.5,${7.5 + mouthOpen * 0.5} 12,${7.5 + mouthOpen}`} fill="#ddccbb" opacity={0.8} />
        </g>
      </g>

      {/* === IDLE FLAME WISPS (orbiting particles) === */}
      {[0, 1, 2].map(i => {
        const a = (tf * 0.06 + i * 2.1) % (Math.PI * 2);
        const fr = 10 + Math.sin(tf * 0.08 + i) * 3;
        const fx = 10 + Math.cos(a) * fr;
        const fy = 10 + Math.sin(a) * fr * 0.6;
        return (
          <g key={`wisp${i}`}>
            <circle cx={fx} cy={fy} r={1.5} fill={FIRE_ORANGE} opacity={0.35 + Math.sin(tf * 0.1 + i * 2) * 0.25} />
            <circle cx={fx} cy={fy} r={0.7} fill={FIRE_BRIGHT} opacity={0.3 + Math.sin(tf * 0.12 + i) * 0.2} />
          </g>
        );
      })}

      {/* === RISING HEAT PARTICLES (casting only) === */}
      {isCasting && [0, 1, 2, 3, 4].map(i => {
        const hx = 5 + (i * 3) + Math.sin(tf * 0.15 + i * 1.3) * 2;
        const hy = 20 - ((tf * 0.3 + i * 7) % 25);
        return (
          <circle key={`heat${i}`} cx={hx} cy={hy} r={0.8 + Math.sin(tf * 0.2 + i) * 0.3}
            fill={i % 2 === 0 ? FIRE_ORANGE : FIRE_BRIGHT}
            opacity={Math.max(0, 0.4 - (20 - hy) * 0.02)} />
        );
      })}

      {/* === FIREBALL PROJECTILE ANIMATION === */}
      {isCasting && castTimer > 15 && (() => {
        const castTime = 120;
        const castProgress = Math.min(castTimer / castTime, 1);
        const sc = eliteVariantId ? eliteScale : 1.35;
        const fireRelX = (castTargetX - x) / sc;
        const fireRelY = ((castTargetY || 0) - y) / sc;
        const startX = 10;
        const startY = 3;
        const t = Math.min((castTimer - 15) / (castTime - 15), 1);
        const fbX = startX + (fireRelX - startX) * t;
        const arcHeight = -40 * Math.sin(t * Math.PI);
        const fbY = startY + (fireRelY - startY) * t + arcHeight;
        return (
          <>
            {/* Warning circle on ground at target */}
            <ellipse cx={fireRelX} cy={fireRelY + 2} rx={15 + castProgress * 25} ry={4 + castProgress * 3}
              fill={EMBER} opacity={0.06 + castProgress * 0.1}
              stroke={FIRE_ORANGE} strokeWidth="1" strokeDasharray={`${3 + castProgress * 5} 2`} />
            {/* Fireball */}
            {t < 1 && (
              <g transform={`translate(${fbX}, ${fbY})`}>
                {/* Trail */}
                <circle cx={2 + Math.sin(tf * 0.8) * 2} cy={3} r={2} fill={FIRE_ORANGE} opacity={0.3} />
                <circle cx={-1 + Math.cos(tf * 0.7) * 2} cy={5} r={1.5} fill={FIRE_BRIGHT} opacity={0.25} />
                <circle cx={Math.sin(tf * 0.6) * 1.5} cy={4} r={1} fill={FIRE_RED} opacity={0.2} />
                {/* Core */}
                <circle cx={0} cy={0} r={4 + castProgress * 2} fill={EMBER} opacity={0.8} />
                <circle cx={0} cy={0} r={2.5 + castProgress} fill={FIRE_ORANGE} opacity={0.7} />
                <circle cx={0} cy={0} r={1.2} fill={FIRE_BRIGHT} opacity={0.9} />
                {/* Outer glow */}
                <circle cx={0} cy={0} r={7 + castProgress * 3} fill={EMBER} opacity={0.12} />
              </g>
            )}
          </>
        );
      })()}

      {/* === HIT FLASH OVERLAY === */}
      {recentlyHit && (
        <rect x={-2} y={-10} width={24} height={36} fill="#ff0000" opacity={0.12} rx={3} />
      )}

      {/* === HEALTH BAR === */}
      <rect x={0} y={-8} width={20} height={3} fill="#333" rx={1} />
      <rect x={0} y={-8} width={Math.max(0, 20 * (health / maxHealth))} height={3} fill={FIRE_ORANGE} rx={1} />
      {showHpNumbers && (
        <text x={10} y={-10} fill="#fff" fontSize="6" textAnchor="middle">{health}/{maxHealth}</text>
      )}

      </g>
    </g>
  );
}

export default memo(DetailedFireImp, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  if (prev.isCasting !== next.isCasting) return false;
  if (prev.castTimer !== next.castTimer) return false;
  if (prev.castTargetX !== next.castTargetX) return false;
  if (prev.castTargetY !== next.castTargetY) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
