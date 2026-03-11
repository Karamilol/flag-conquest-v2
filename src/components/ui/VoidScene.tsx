import { useState, useEffect, useRef } from 'react';
import { VOID_QUIPS, pickVoidQuip, formatQuip, type VoidContext } from '../../voidDialogue';
import { initHeroSpriteCache, HERO_IDLE_FRAME_COUNT } from '../sprites/heroSpriteCache';

interface Props {
  game: {
    playerName?: string;
    bossesDefeated?: number;
    flagsCaptured?: number;
    currentZone?: number;
    enemiesKilled?: number;
    retreated?: boolean;
    heroClass?: string;
    totalGoldEarned?: number;
    goldEarned?: number;
  };
  upgrades: { playerName?: unknown; [key: string]: unknown };
  highestZone: number;
  highestFlags: number;
}

const W = 500;
const H = 350;

export default function VoidScene({ game, upgrades, highestZone, highestFlags }: Props) {
  const [tick, setTick] = useState(0);
  const quipRef = useRef({ index: -1, phaseTick: 0, phase: 'wait' as 'wait' | 'fadeIn' | 'show' | 'fadeOut' | 'gap', gapDuration: 210, lastTick: -1 });
  const voidHeroRef = useRef({ x: W / 2, targetX: W * 0.7, facingRight: true, pauseFrames: 60 });

  useEffect(() => {
    quipRef.current = { index: -1, phaseTick: 0, phase: 'wait', gapDuration: 210, lastTick: -1 };
    const iv = setInterval(() => setTick(t => t + 1), 33);
    return () => clearInterval(iv);
  }, []);

  const ctx: VoidContext = {
    playerName: (game.playerName as string) || (upgrades?.playerName as string) || 'Commander',
    bossesDefeated: game.bossesDefeated || 0,
    flagsCaptured: game.flagsCaptured || 0,
    currentZone: game.currentZone || 0,
    enemiesKilled: game.enemiesKilled || 0,
    retreated: !!game.retreated,
    highestZone: highestZone || 0,
    highestFlags: highestFlags || 0,
    heroClass: game.heroClass || 'warlord',
    goldEarned: game.totalGoldEarned || game.goldEarned || 0,
  };

  // === Quip phase machine ===
  const vq = quipRef.current;
  const elapsed = tick - vq.phaseTick;
  if (tick !== vq.lastTick) {
    vq.lastTick = tick;
    if (vq.phase === 'wait') {
      if (elapsed >= vq.gapDuration) { vq.index = pickVoidQuip(ctx, vq.index); vq.phaseTick = tick; vq.phase = 'fadeIn'; }
    } else if (vq.phase === 'fadeIn') {
      if (elapsed >= 30) { vq.phaseTick = tick; vq.phase = 'show'; }
    } else if (vq.phase === 'show') {
      if (elapsed >= 300) { vq.phaseTick = tick; vq.phase = 'fadeOut'; }
    } else if (vq.phase === 'fadeOut') {
      if (elapsed >= 30) { vq.phaseTick = tick; vq.phase = 'gap'; vq.gapDuration = 660 + Math.floor(Math.random() * 180); }
    } else if (vq.phase === 'gap') {
      if (elapsed >= vq.gapDuration) { vq.index = pickVoidQuip(ctx, vq.index); vq.phaseTick = tick; vq.phase = 'fadeIn'; }
    }
  }

  let quipOpacity = 0;
  let quipText = '';
  if (vq.phase === 'fadeIn') quipOpacity = Math.min(1, elapsed / 30);
  else if (vq.phase === 'show') quipOpacity = 1;
  else if (vq.phase === 'fadeOut') quipOpacity = Math.max(0, 1 - elapsed / 30);
  if (vq.index >= 0 && vq.index < VOID_QUIPS.length && (vq.phase === 'fadeIn' || vq.phase === 'show' || vq.phase === 'fadeOut')) {
    quipText = formatQuip(VOID_QUIPS[vq.index].text, ctx);
  }

  // === Wandering hero ===
  const vh = voidHeroRef.current;
  if (vh.pauseFrames > 0) {
    vh.pauseFrames--;
  } else {
    const dx = vh.targetX - vh.x;
    if (Math.abs(dx) < 5) {
      vh.pauseFrames = 60 + Math.floor(Math.random() * 60);
      vh.targetX = W * 0.15 + Math.random() * W * 0.7;
    } else {
      vh.facingRight = dx > 0;
      vh.x += dx > 0 ? 0.5 : -0.5;
    }
  }
  const heroClass = game.heroClass || 'warlord';
  const heroCache = initHeroSpriteCache(heroClass);
  const heroIdleIndex = Math.floor(tick / 25) % HERO_IDLE_FRAME_COUNT;
  const heroSpriteUrl = heroCache.idle[heroIdleIndex];
  const heroGroundY = heroCache.vbY + heroCache.vbH;
  const heroY = H - 33 - heroGroundY;

  // === Animated values ===
  const floatY = Math.sin(tick * 0.03) * 6;
  const sway = Math.sin(tick * 0.02) * 2;
  const eyeOp = 0.7 + Math.sin(tick * 0.06) * 0.2;
  const auraOp = 0.04 + Math.sin(tick * 0.04) * 0.02;
  const trailOp = 0.15 + Math.sin(tick * 0.05) * 0.05;

  const eX = W / 2;
  const eY = 100;

  return (
    <div style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', background: '#050508' }}>
        <defs>
          <radialGradient id="voidGlow" cx="50%" cy="60%" r="50%">
            <stop offset="0%" stopColor="#120e1a" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#050508" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="voidCenter" cx="50%" cy="55%" r="20%">
            <stop offset="0%" stopColor="#1a1520" stopOpacity="0.5" />
            <stop offset="60%" stopColor="#0e0b12" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#050508" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Background layers */}
        <rect width={W} height={H} fill="url(#voidGlow)" />
        <rect width={W} height={H} fill="url(#voidCenter)" />

        {/* Ambient floating particles */}
        {Array.from({ length: 30 }, (_, i) => {
          const px = (i * 41 + 17) % W;
          const py = (i * 53 + 31) % H;
          const drift = Math.sin(tick * 0.02 + i * 2.1) * 18;
          const bob = Math.cos(tick * 0.015 + i * 2.7) * 12;
          const op = 0.1 + Math.sin(tick * 0.03 + i * 3.3) * 0.07;
          const size = 0.9 + (i % 3) * 0.6;
          return <circle key={`vp${i}`} cx={px + drift} cy={py + bob} r={size} fill={i % 4 === 0 ? '#aa88cc' : i % 5 === 0 ? '#9977bb' : '#665577'} opacity={op} />;
        })}

        {/* Orbiting glow particles around center */}
        {Array.from({ length: 10 }, (_, i) => {
          const cx = W / 2;
          const cy = H * 0.4;
          const angle = tick * 0.008 + i * (Math.PI * 2 / 10);
          const rx = 65 + Math.sin(i * 1.7) * 25;
          const ry = 32 + Math.cos(i * 2.3) * 12;
          const ox = cx + Math.cos(angle) * rx;
          const oy = cy + Math.sin(angle) * ry;
          const op = 0.18 + Math.sin(tick * 0.04 + i * 1.5) * 0.12;
          const sz = 1.4 + Math.sin(tick * 0.05 + i) * 0.6;
          return <circle key={`vo${i}`} cx={ox} cy={oy} r={sz} fill={i % 3 === 0 ? '#cc88ff' : i % 3 === 1 ? '#8866bb' : '#aa77dd'} opacity={op} />;
        })}

        {/* ── Void Entity (mysterious cloaked figure) ── */}
        {/* Entity aura */}
        <ellipse cx={eX} cy={eY + 20 + floatY} rx={35} ry={40} fill="#8844cc" opacity={auraOp} />

        {/* Entity body */}
        <g transform={`translate(${eX - 20 + sway}, ${eY + floatY})`}>
          {/* Shadow below */}
          <ellipse cx={20} cy={58} rx={18} ry={5} fill="rgba(80,30,120,0.2)" />

          {/* Wispy bottom tendrils */}
          <path d="M6,40 Q2,48 0,56 Q6,52 12,54 Q18,56 20,52 Q22,56 28,54 Q34,52 40,56 Q38,48 34,40 Z"
            fill="#1a0e2a" opacity={trailOp + 0.25} />
          <path d="M10,42 Q6,50 5,55 Q10,51 15,53 Q20,50 25,53 Q30,51 35,55 Q34,50 30,42 Z"
            fill="#8844cc" opacity={trailOp * 0.6} />
          {/* Inner tendrils */}
          <path d="M14,44 Q12,50 10,56" stroke="#8844cc" strokeWidth="1.5" fill="none" opacity={0.15 + Math.sin(tick * 0.08) * 0.08} />
          <path d="M26,44 Q28,50 30,56" stroke="#8844cc" strokeWidth="1.5" fill="none" opacity={0.15 + Math.sin(tick * 0.08 + 1) * 0.08} />
          <path d="M20,42 Q20,52 20,58" stroke="#6633aa" strokeWidth="1" fill="none" opacity={0.1 + Math.sin(tick * 0.06 + 2) * 0.06} />

          {/* Cloak body */}
          <path d="M4,8 Q0,24 6,42 L34,42 Q40,24 36,8 Z" fill="#1a0e2a" />
          <path d="M8,12 Q4,26 10,38 L30,38 Q36,26 32,12 Z" fill="#120820" />

          {/* Chest emblem */}
          <circle cx={20} cy={25} r={4} fill="none" stroke="#6644aa" strokeWidth="1" opacity={0.4} />
          <circle cx={20} cy={25} r={2} fill="#aa66dd" opacity={0.3 + Math.sin(tick * 0.08) * 0.1} />

          {/* Hood */}
          <path d={`M6,-2 Q20,${-14 + sway * 0.5} 34,-2 L36,14 L4,14 Z`} fill="#1a0e2a" />
          {/* Face void */}
          <rect x={8} y={2} width={24} height={11} fill="#060010" rx={2} />

          {/* Eyes */}
          <circle cx={14} cy={7} r={2.5} fill="#aa66dd" opacity={eyeOp} />
          <circle cx={26} cy={7} r={2.5} fill="#aa66dd" opacity={eyeOp} />
          <circle cx={14} cy={7} r={1.2} fill="#ddbbff" />
          <circle cx={26} cy={7} r={1.2} fill="#ddbbff" />
          {/* Eye glow aura */}
          <circle cx={14} cy={7} r={5} fill="#cc88ff" opacity={0.08 + Math.sin(tick * 0.07) * 0.05} />
          <circle cx={26} cy={7} r={5} fill="#cc88ff" opacity={0.08 + Math.sin(tick * 0.07 + 1) * 0.05} />
        </g>

        {/* Orbiting wisps */}
        <circle cx={eX + Math.cos(tick * 0.04) * 30} cy={eY + 15 + floatY + Math.sin(tick * 0.04) * 15}
          r={2} fill="#cc88ff" opacity={0.2 + Math.sin(tick * 0.06) * 0.08} />
        <circle cx={eX + Math.cos(tick * 0.03 + 2) * 25} cy={eY + 10 + floatY + Math.sin(tick * 0.03 + 2) * 20}
          r={1.8} fill="#6633aa" opacity={0.15 + Math.sin(tick * 0.07 + 1) * 0.06} />
        <circle cx={eX + Math.cos(tick * 0.05 + 4) * 35} cy={eY + 20 + floatY + Math.sin(tick * 0.05 + 4) * 12}
          r={1.5} fill="#aa66dd" opacity={0.12 + Math.sin(tick * 0.05 + 2) * 0.06} />

        {/* Wandering hero */}
        <g transform={`translate(${vh.facingRight ? vh.x : vh.x + heroCache.vbW}, ${heroY})${vh.facingRight ? '' : ' scale(-1,1)'}`} opacity={0.85}>
          <image href={heroSpriteUrl} x={heroCache.vbX} y={heroCache.vbY} width={heroCache.vbW} height={heroCache.vbH} />
        </g>

        {/* Ground line */}
        <rect x={0} y={H - 40} width={W} height={2} fill="#1a1520" opacity={0.3} />

        {/* Speech bubble */}
        {quipText && quipOpacity > 0 && (() => {
          const charW = 5.4;
          const pad = 4;
          const lineH = 11;
          const maxBubbleW = 210;
          const bubbleW = Math.min(maxBubbleW, quipText.length * charW + pad * 2);
          const bubbleX = eX - bubbleW / 2;
          const bubbleY = 175;
          const chars = Math.max(1, Math.floor((bubbleW - pad * 2) / charW));
          const lines = quipText ? Math.ceil(quipText.length / chars) : 1;
          const bubbleH = lines * lineH + pad * 2;
          const tailX = eX;
          return (
            <g opacity={quipOpacity}>
              {/* Tail pointing up toward entity */}
              <polygon points={`${tailX - 5},${bubbleY} ${tailX + 5},${bubbleY} ${tailX},${bubbleY - 7}`}
                fill="rgba(10,10,15,0.9)" stroke="#8a4adf" strokeWidth={0.8} strokeLinejoin="round" />
              {/* Cover tail bottom stroke */}
              <rect x={tailX - 6} y={bubbleY - 0.5} width={12} height={2} fill="rgba(10,10,15,0.9)" />
              {/* Bubble body */}
              <rect x={bubbleX} y={bubbleY} width={bubbleW} height={bubbleH} rx={5}
                fill="rgba(10,10,15,0.9)" stroke="#8a4adf" strokeWidth={0.8} />
              <foreignObject x={bubbleX + pad} y={bubbleY + pad} width={bubbleW - pad * 2} height={bubbleH - pad * 2}>
                <div style={{ color: '#e0d8f0', fontSize: '8px', lineHeight: '1.3', fontFamily: '"Press Start 2P", "Courier New", monospace', textAlign: 'center' }}>
                  {quipText}
                </div>
              </foreignObject>
            </g>
          );
        })()}
      </svg>
    </div>
  );
}
