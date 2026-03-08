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
  lungeTimer?: number;
  recoveryTimer?: number;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

function DetailedHound({ x, y, health, maxHealth, frame, lungeTimer = 0, recoveryTimer = 0, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const isLunging = lungeTimer > 0;
  const isRecovering = recoveryTimer > 0;

  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  // Throttled frame for JS animations
  const tf = Math.floor(frame / 3) * 3;

  // Animation phases
  const legPhase = Math.sin(frame * 0.4) * 4;
  const legPhase2 = Math.sin(frame * 0.4 + Math.PI) * 4;
  const pantOffset = isRecovering ? Math.sin(frame * 0.3) * 1.5 : 0;
  const tailWag = Math.sin(frame * 0.2) * 3;
  const tailWag2 = Math.sin(frame * 0.15) * 2;

  // Ear flicker — independent twitch per ear
  const earFlick1 = Math.sin(tf * 0.2) * 2;
  const earFlick2 = Math.sin(tf * 0.25 + 1.5) * 1.5;

  // Hackle height — raised more during lunge
  const hackleRise = isLunging ? 2 : 0;

  // Breathing — subtle ribcage expand
  const breathe = isRecovering ? Math.sin(tf * 0.08) * 1 : Math.sin(tf * 0.04) * 0.3;

  // Lunge stretch
  const scaleX = isLunging ? 1.3 : 1;
  const scaleY = isLunging ? 0.8 : 1;

  // Idle bob — CSS handles it when not lunging/recovering
  const state = health <= 0 ? 'die' : (isLunging || isRecovering) ? 'none' : 'idle';

  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);

  // Colors
  const fur = '#2a1a1a';
  const furLight = '#3a2a20';
  const furDark = '#1a0e0a';
  const furStroke = '#4a2a2a';
  const snout = '#1a0e0e';
  const nose = '#111';
  const gum = '#6a2222';
  const tooth = '#ddd';
  const collar = '#555';
  const collarSpike = '#aaa';
  const clawColor = '#444';
  const eyeGlow = isLunging ? '#ff2200' : '#ff6600';

  // Animation desync
  const delayStyle = { animationDelay: `${(x % 200) * 0.005}s` };

  // Drool drops during recovery
  const droolDrop1Y = isRecovering ? ((frame * 0.8) % 12) : 0;
  const droolDrop2Y = isRecovering ? ((frame * 0.8 + 6) % 12) : 0;

  return (
    <g transform={`translate(${x}, ${y})${eliteVariantId ? ` scale(${eliteScale})` : ''}`}>
      <g className={state !== 'none' ? `sprite-${state}` : undefined} style={state !== 'none' ? delayStyle : undefined}>

      {/* === ELITE === */}
      {isElite && eliteGlow && (
        <circle cx={12} cy={10} r={16} fill={eliteGlow} opacity={0.15} />
      )}
      {eliteVariantId && (
        <text x={12} y={-18} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}

      {/* === SHADOW === */}
      <ellipse cx={12} cy={24} rx={isLunging ? 16 : 12} ry={isLunging ? 3 : 4} fill="rgba(0,0,0,0.25)" />

      <g transform={`scale(${scaleX}, ${scaleY})`} style={{ transformOrigin: '12px 12px' }}>

        {/* === LUNGE GLOW === */}
        {isLunging && (
          <ellipse cx={12} cy={12} rx={18} ry={14} fill="#ff4400" opacity={0.12} />
        )}

        {/* === TAIL === */}
        <path
          d={`M22,10 Q${26 + tailWag},6 ${24 + tailWag2},2`}
          stroke={furStroke} strokeWidth={2.5} fill="none" strokeLinecap="round"
        />
        {/* Tail fur tuft */}
        <path
          d={`M${24 + tailWag2},2 L${23 + tailWag2},0 M${24 + tailWag2},2 L${25 + tailWag2},0.5 M${24 + tailWag2},2 L${24 + tailWag2},-0.5`}
          stroke={furDark} strokeWidth={1} strokeLinecap="round"
        />

        {/* === BACK LEGS === */}
        <g>
          {/* Back-left leg */}
          <line x1={18} y1={16} x2={20 + (isRecovering ? 0 : legPhase2)} y2={20}
            stroke={furStroke} strokeWidth={3} strokeLinecap="round" />
          <line x1={20 + (isRecovering ? 0 : legPhase2)} y1={20} x2={20 + (isRecovering ? 0 : legPhase2) + 1} y2={22}
            stroke={furDark} strokeWidth={2.5} strokeLinecap="round" />
          {/* Paw */}
          <ellipse cx={20 + (isRecovering ? 0 : legPhase2) + 1} cy={22.5} rx={2.5} ry={1.5} fill={furDark} />
          <line x1={19 + (isRecovering ? 0 : legPhase2)} y1={23} x2={19 + (isRecovering ? 0 : legPhase2)} y2={22} stroke={clawColor} strokeWidth={0.6} />
          <line x1={21 + (isRecovering ? 0 : legPhase2)} y1={23.5} x2={21 + (isRecovering ? 0 : legPhase2)} y2={22.3} stroke={clawColor} strokeWidth={0.6} />
          <line x1={22.5 + (isRecovering ? 0 : legPhase2)} y1={23} x2={22.5 + (isRecovering ? 0 : legPhase2)} y2={22} stroke={clawColor} strokeWidth={0.6} />

          {/* Back-right leg */}
          <line x1={16} y1={16} x2={18 + (isRecovering ? 0 : legPhase)} y2={20}
            stroke={furStroke} strokeWidth={3} strokeLinecap="round" />
          <line x1={18 + (isRecovering ? 0 : legPhase)} y1={20} x2={18 + (isRecovering ? 0 : legPhase) + 1} y2={22}
            stroke={furDark} strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={18 + (isRecovering ? 0 : legPhase) + 1} cy={22.5} rx={2.5} ry={1.5} fill={furDark} />
        </g>

        {/* === BODY (breathing) === */}
        {/* Main body shape — muscular ellipse */}
        <ellipse cx={12} cy={12} rx={10 + breathe} ry={7 + breathe * 0.5} fill={fur} />
        {/* Underbelly — slightly lighter */}
        <ellipse cx={12} cy={14.5} rx={8 + breathe * 0.7} ry={4 + breathe * 0.3} fill={furLight} opacity={0.4} />
        {/* Ribcage definition */}
        <path d="M8,9 Q10,14 8,17" fill="none" stroke={furLight} strokeWidth={0.6} opacity={0.3} />
        <path d="M11,8 Q13,14 11,17" fill="none" stroke={furLight} strokeWidth={0.6} opacity={0.25} />
        <path d="M14,8.5 Q16,14 14,17" fill="none" stroke={furLight} strokeWidth={0.6} opacity={0.2} />
        {/* Body outline */}
        <ellipse cx={12} cy={12} rx={10} ry={7} fill="none" stroke={furStroke} strokeWidth={0.8} />

        {/* === HACKLES (raised fur on spine — rise during lunge) === */}
        <polygon points={`6,5 8,${2 - hackleRise} 10,5`} fill={furDark} />
        <polygon points={`9,4.5 11,${1.5 - hackleRise} 13,5`} fill={furDark} />
        <polygon points={`12,5 14,${2 - hackleRise} 16,5`} fill={furDark} />
        <polygon points={`15,5.5 17,${3 - hackleRise} 18,6`} fill={furDark} />
        {/* Hackle highlights */}
        <line x1={8} y1={2.5 - hackleRise} x2={9} y2={4.5} stroke={furLight} strokeWidth={0.4} opacity={0.3} />
        <line x1={11} y1={2 - hackleRise} x2={12} y2={4.5} stroke={furLight} strokeWidth={0.4} opacity={0.3} />
        <line x1={14} y1={2.5 - hackleRise} x2={15} y2={5} stroke={furLight} strokeWidth={0.4} opacity={0.3} />

        {/* === SPIKED COLLAR === */}
        <rect x={3} y={9} width={6} height={3} fill={collar} rx={1} />
        <rect x={3} y={9} width={6} height={0.8} fill="#777" opacity={0.3} rx={0.5} />
        {/* Spikes */}
        <polygon points="4,9 4.8,6.5 5.6,9" fill={collarSpike} />
        <polygon points="6,9 6.8,7 7.6,9" fill={collarSpike} />
        {/* Spike highlights */}
        <line x1={4.4} y1={7} x2={4.8} y2={9} stroke="#ccc" strokeWidth={0.3} opacity={0.5} />
        <line x1={6.4} y1={7.5} x2={6.8} y2={9} stroke="#ccc" strokeWidth={0.3} opacity={0.5} />

        {/* === FRONT LEGS === */}
        <g>
          {/* Front-left leg */}
          <line x1={6} y1={16} x2={4 + (isRecovering ? 0 : legPhase)} y2={20}
            stroke={furStroke} strokeWidth={3} strokeLinecap="round" />
          <line x1={4 + (isRecovering ? 0 : legPhase)} y1={20} x2={4 + (isRecovering ? 0 : legPhase) - 0.5} y2={22}
            stroke={furDark} strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={4 + (isRecovering ? 0 : legPhase) - 0.5} cy={22.5} rx={2.5} ry={1.5} fill={furDark} />
          <line x1={2.5 + (isRecovering ? 0 : legPhase)} y1={23} x2={2.5 + (isRecovering ? 0 : legPhase)} y2={22} stroke={clawColor} strokeWidth={0.6} />
          <line x1={4 + (isRecovering ? 0 : legPhase)} y1={23.5} x2={4 + (isRecovering ? 0 : legPhase)} y2={22.3} stroke={clawColor} strokeWidth={0.6} />
          <line x1={5.5 + (isRecovering ? 0 : legPhase)} y1={23} x2={5.5 + (isRecovering ? 0 : legPhase)} y2={22} stroke={clawColor} strokeWidth={0.6} />

          {/* Front-right leg */}
          <line x1={8} y1={16} x2={6 + (isRecovering ? 0 : legPhase2)} y2={20}
            stroke={furStroke} strokeWidth={3} strokeLinecap="round" />
          <line x1={6 + (isRecovering ? 0 : legPhase2)} y1={20} x2={6 + (isRecovering ? 0 : legPhase2) - 0.5} y2={22}
            stroke={furDark} strokeWidth={2.5} strokeLinecap="round" />
          <ellipse cx={6 + (isRecovering ? 0 : legPhase2) - 0.5} cy={22.5} rx={2.5} ry={1.5} fill={furDark} />
        </g>

        {/* === HEAD === */}
        <g>
          {/* Skull — angular, wolf-like */}
          <ellipse cx={3} cy={9 + pantOffset} rx={5.5} ry={5} fill={fur} />
          {/* Cheek fur */}
          <ellipse cx={5} cy={11 + pantOffset} rx={3} ry={2.5} fill={furLight} opacity={0.3} />
          {/* Head outline */}
          <ellipse cx={3} cy={9 + pantOffset} rx={5.5} ry={5} fill="none" stroke={furStroke} strokeWidth={0.7} />

          {/* === SNOUT === */}
          <ellipse cx={-1} cy={10.5 + pantOffset} rx={3.5} ry={2.8} fill={snout} />
          {/* Snout bridge highlight */}
          <ellipse cx={-0.5} cy={9.5 + pantOffset} rx={2} ry={1} fill={furLight} opacity={0.15} />
          {/* Nose */}
          <ellipse cx={-3.5} cy={9.8 + pantOffset} rx={1.5} ry={1.2} fill={nose} />
          <ellipse cx={-3.8} cy={9.5 + pantOffset} rx={0.6} ry={0.4} fill="#333" opacity={0.4} />

          {/* === MOUTH / FANGS === */}
          {/* Upper jaw line */}
          <line x1={-4} y1={10.5 + pantOffset} x2={2} y2={11 + pantOffset} stroke={furDark} strokeWidth={0.6} />
          {/* Lower jaw (slightly open when lunging/recovering) */}
          {(isLunging || isRecovering) ? (
            <g>
              {/* Open mouth */}
              <path d={`M-3,${11 + pantOffset} Q0,${14 + pantOffset} 3,${12 + pantOffset}`}
                fill={gum} stroke={furDark} strokeWidth={0.5} />
              {/* Tongue */}
              {isRecovering && (
                <ellipse cx={0} cy={13.5 + pantOffset} rx={2} ry={1.2} fill="#cc5555" opacity={0.7} />
              )}
              {/* Upper fangs */}
              <polygon points={`-2,${10.5 + pantOffset} -1.5,${13 + pantOffset} -1,${10.5 + pantOffset}`} fill={tooth} />
              <polygon points={`1,${11 + pantOffset} 1.5,${13.5 + pantOffset} 2,${11 + pantOffset}`} fill={tooth} />
              {/* Lower fangs */}
              <polygon points={`-1,${13.5 + pantOffset} -0.5,${11 + pantOffset} 0,${13.5 + pantOffset}`} fill={tooth} opacity={0.8} />
            </g>
          ) : (
            <g>
              {/* Closed mouth — small fang tips poking out */}
              <polygon points={`-2,${10.5 + pantOffset} -1.7,${12 + pantOffset} -1.2,${10.5 + pantOffset}`} fill={tooth} opacity={0.7} />
              <polygon points={`1,${11 + pantOffset} 1.3,${12.5 + pantOffset} 1.6,${11 + pantOffset}`} fill={tooth} opacity={0.7} />
            </g>
          )}

          {/* === EYES === */}
          {/* Eye socket shadow */}
          <ellipse cx={1} cy={7.5 + pantOffset} rx={2.2} ry={1.8} fill={furDark} />
          {/* Glowing eye */}
          <ellipse cx={1} cy={7.5 + pantOffset} rx={isLunging ? 2 : 1.8} ry={isLunging ? 1.6 : 1.4} fill={eyeGlow} opacity={0.9} />
          {/* Pupil — slit when lunging */}
          {isLunging ? (
            <ellipse cx={0.5} cy={7.5 + pantOffset} rx={0.4} ry={1.3} fill="#000" />
          ) : (
            <circle cx={0.8} cy={7.5 + pantOffset} r={0.8} fill="#000" opacity={0.7} />
          )}
          {/* Eye highlight */}
          <circle cx={1.5} cy={7 + pantOffset} r={0.5} fill="#fff" opacity={0.6} />

          {/* === EARS (two pointed, wolf-like — independent flicker) === */}
          {/* Left ear (near) — flickers */}
          <polygon points={`${0 + earFlick1 * 0.3},${4 + pantOffset} ${2 + earFlick1 * 0.5},${0 + pantOffset - Math.abs(earFlick1) * 0.3} ${4 + earFlick1 * 0.2},${4 + pantOffset}`} fill={fur} stroke={furStroke} strokeWidth={0.6} />
          <polygon points={`${1.2 + earFlick1 * 0.3},${4 + pantOffset} ${2 + earFlick1 * 0.4},${1.5 + pantOffset - Math.abs(earFlick1) * 0.2} ${3 + earFlick1 * 0.2},${4 + pantOffset}`} fill={gum} opacity={0.3} />
          {/* Right ear (far) — flickers independently */}
          <polygon points={`${4 + earFlick2 * 0.2},${3.5 + pantOffset} ${6 + earFlick2 * 0.4},${0 + pantOffset - Math.abs(earFlick2) * 0.2} ${7 + earFlick2 * 0.15},${4.5 + pantOffset}`} fill={furDark} stroke={furStroke} strokeWidth={0.5} />
          <polygon points={`${4.8 + earFlick2 * 0.2},${3.8 + pantOffset} ${5.8 + earFlick2 * 0.3},${1.2 + pantOffset - Math.abs(earFlick2) * 0.15} ${6.3 + earFlick2 * 0.15},${4.2 + pantOffset}`} fill={gum} opacity={0.2} />

          {/* === WHISKER DOTS === */}
          <circle cx={-3} cy={11 + pantOffset} r={0.4} fill={furLight} opacity={0.3} />
          <circle cx={-2.5} cy={12 + pantOffset} r={0.4} fill={furLight} opacity={0.3} />
        </g>

        {/* === FUR TEXTURE on body === */}
        <line x1={5} y1={7} x2={4} y2={5.5} stroke={furLight} strokeWidth={0.5} opacity={0.2} />
        <line x1={19} y1={8} x2={20} y2={6.5} stroke={furLight} strokeWidth={0.5} opacity={0.2} />
        <line x1={16} y1={17} x2={17} y2={18} stroke={furDark} strokeWidth={0.5} opacity={0.3} />
        <line x1={8} y1={17} x2={7} y2={18} stroke={furDark} strokeWidth={0.5} opacity={0.3} />

        {/* === SCARS (battle-worn) === */}
        <line x1={14} y1={9} x2={17} y2={12} stroke={furLight} strokeWidth={0.7} opacity={0.25} />
        <line x1={14.5} y1={9.5} x2={17} y2={11} stroke={furLight} strokeWidth={0.4} opacity={0.15} />

        {/* === DROOL during recovery === */}
        {isRecovering && (
          <g>
            <line x1={-1} y1={13 + pantOffset} x2={-2} y2={13 + pantOffset + droolDrop1Y}
              stroke="#8af" strokeWidth={0.8} opacity={Math.max(0, 0.5 - droolDrop1Y / 16)} strokeLinecap="round" />
            <circle cx={-2} cy={13 + pantOffset + droolDrop1Y} r={0.8}
              fill="#8af" opacity={Math.max(0, 0.4 - droolDrop1Y / 16)} />
            <line x1={0.5} y1={13.5 + pantOffset} x2={0} y2={13.5 + pantOffset + droolDrop2Y}
              stroke="#8af" strokeWidth={0.6} opacity={Math.max(0, 0.4 - droolDrop2Y / 16)} strokeLinecap="round" />
          </g>
        )}

        {/* === SPEED BLUR during lunge === */}
        {isLunging && (
          <g>
            <line x1={24} y1={7} x2={34} y2={7} stroke="#ff4400" strokeWidth={1.5} opacity={0.4} strokeLinecap="round" />
            <line x1={24} y1={11} x2={36} y2={11} stroke="#ff4400" strokeWidth={1.2} opacity={0.3} strokeLinecap="round" />
            <line x1={24} y1={15} x2={32} y2={15} stroke="#ff4400" strokeWidth={1} opacity={0.25} strokeLinecap="round" />
            <line x1={22} y1={4} x2={28} y2={4} stroke="#ff6600" strokeWidth={0.8} opacity={0.2} strokeLinecap="round" />
          </g>
        )}
      </g>

      {/* === HIT FLASH === */}
      {recentlyHit && (
        <rect x={-4} y={-2} width={32} height={28} fill="#ff0000" opacity={0.12} rx={2} />
      )}

      {/* === HEALTH BAR === */}
      <rect x={0} y={-8} width={24} height={5} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-7} width={Math.max(0, (health / maxHealth) * 22)} height={3}
            fill="#cc4400" rx={1} />
      {showHpNumbers && (
        <text x={12} y={-10} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
      </g>
    </g>
  );
}

export default memo(DetailedHound, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  if (prev.lungeTimer !== next.lungeTimer) return false;
  if (prev.recoveryTimer !== next.recoveryTimer) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isElite !== next.isElite) return false;
  if (prev.eliteVariantId !== next.eliteVariantId) return false;
  // Re-render for leg/tail animations — throttle to every 3 frames
  if (Math.floor(prev.frame / 3) !== Math.floor(next.frame / 3)) return false;
  return true;
});
