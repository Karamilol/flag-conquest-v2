import { memo } from 'react';
import { COLORS } from '../../constants';
import { initGoblinSpriteCache, IDLE_FRAME_COUNT } from './goblinSpriteCache';
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
  bleedStacks?: number;
  isElite?: boolean;
  eliteVariantId?: string;
}

// How many game frames each idle animation frame lasts
// 8 frames × 25 ticks = 200 ticks = ~3.3s full cycle at 60fps
const IDLE_TICKS_PER_FRAME = 25;

function CachedGoblin({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, bleedStacks, isElite }: Props) {
  const cache = initGoblinSpriteCache();

  const isAttacking = attackCooldown < 8;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;

  const state = health <= 0 ? 'die' : isAttacking ? 'attack' : 'idle';

  // Select cached bitmap
  let spriteUrl: string;
  if (isAttacking) {
    spriteUrl = cache.attack[attackCooldown];
  } else {
    // Cycle through idle frames; offset by x position so goblins desync
    const offset = Math.floor(Math.abs(x) * 3);
    const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % IDLE_FRAME_COUNT;
    spriteUrl = cache.idle[idleIndex];
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className={state === 'die' ? 'sprite-die' : 'sprite-idle'}>

        {/* Cached body bitmap — replaces ~80 SVG elements with 1 <image> */}
        <image
          href={spriteUrl}
          x={-14}
          y={-16}
          width={48}
          height={48}
        />

        {/* === Dynamic overlays (kept as live SVG — only a few elements) === */}

        {/* Attack flash */}
        {isAttacking && attackCooldown < 3 && (
          <g className="sprite-sword-flash">
            <line x1={-4} y1={-6} x2={-10} y2={6} stroke="#ff8" strokeWidth={2} opacity={0.6} strokeLinecap="round" />
          </g>
        )}

        {/* Hit flash overlay */}
        {recentlyHit && (
          <rect x={-4} y={-6} width={32} height={34} fill="#ff0000" opacity={0.15} rx={2} />
        )}

        {/* Elite glow */}
        {isElite && (
          <circle cx={12} cy={10} r={18} fill="#ff4444" opacity={0.1} />
        )}

        {/* Bleed */}
        {(bleedStacks ?? 0) > 0 && (
          <text x={12} y={-16} fontSize="10" textAnchor="middle" fill="#ff0000">
            🩸{(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
          </text>
        )}

        {/* Health bar */}
        <rect x={0} y={-10} width={24} height={5} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-9} width={Math.max(0, (health / maxHealth) * 22)} height={3}
              fill={COLORS.healthRed} rx={1} />
        {showHpNumbers && (
          <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    </g>
  );
}

export default memo(CachedGoblin, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAttacking = (prev.attackCooldown ?? 99) < 8;
  const nextAttacking = (next.attackCooldown ?? 99) < 8;
  if (prevAttacking || nextAttacking) {
    if (prev.attackCooldown !== next.attackCooldown) return false;
  }
  if (prevAttacking !== nextAttacking) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.bleedStacks !== next.bleedStacks) return false;
  if (prev.isElite !== next.isElite) return false;
  // Allow re-render for idle animation frame changes (~every 25 ticks)
  if (!prevAttacking && !nextAttacking) {
    const prevIdlePhase = Math.floor(prev.frame / IDLE_TICKS_PER_FRAME);
    const nextIdlePhase = Math.floor(next.frame / IDLE_TICKS_PER_FRAME);
    if (prevIdlePhase !== nextIdlePhase) return false;
  }
  return true;
});
