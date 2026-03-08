import { memo } from 'react';
import { COLORS } from '../../constants';
import { initSkeletonSpriteCache, SKEL_IDLE_FRAME_COUNT, SKEL_VB_X, SKEL_VB_Y, SKEL_VB_W, SKEL_VB_H } from './skeletonSpriteCache';
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
}

const IDLE_TICKS_PER_FRAME = 25;

function CachedSkeleton({ x, y, health, maxHealth, frame, attackCooldown = 99, lastDamageTime = 0, showHpNumbers, bleedStacks }: Props) {
  const cache = initSkeletonSpriteCache();

  const isAttacking = attackCooldown < 8;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const state = health <= 0 ? 'die' : isAttacking ? 'attack' : 'idle';

  let spriteUrl: string;
  if (isAttacking) {
    spriteUrl = cache.attack[Math.min(attackCooldown, cache.attack.length - 1)];
  } else {
    const offset = Math.floor(Math.abs(x) * 3);
    const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % SKEL_IDLE_FRAME_COUNT;
    spriteUrl = cache.idle[idleIndex];
  }

  return (
    <g transform={`translate(${x}, ${y})`}>
      <g className={state === 'die' ? 'sprite-die' : 'sprite-idle'}>
        {/* Cached body bitmap */}
        <image
          href={spriteUrl}
          x={SKEL_VB_X}
          y={SKEL_VB_Y}
          width={SKEL_VB_W}
          height={SKEL_VB_H}
        />

        {/* Attack flash */}
        {isAttacking && attackCooldown < 3 && (
          <g className="sprite-sword-flash">
            <line x1={-4} y1={-6} x2={-10} y2={6} stroke="#8f8" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
          </g>
        )}

        {/* Hit flash overlay */}
        {recentlyHit && (
          <rect x={-4} y={-6} width={32} height={34} fill="#00ff00" opacity={0.12} rx={2} />
        )}

        {/* Faint green aura (necromantic energy) */}
        <circle cx={12} cy={5} r={10} fill="#44ff44" opacity={0.04} />

        {/* Bleed */}
        {(bleedStacks ?? 0) > 0 && (
          <text x={12} y={-16} fontSize="10" textAnchor="middle" fill="#ff0000">
            {(bleedStacks ?? 0) > 1 ? bleedStacks : ''}
          </text>
        )}

        {/* Health bar — gray for skeletons */}
        <rect x={0} y={-10} width={24} height={5} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-9} width={Math.max(0, (health / maxHealth) * 22)} height={3}
              fill="#aaaaaa" rx={1} />
        {showHpNumbers && (
          <text x={12} y={-12} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    </g>
  );
}

export default memo(CachedSkeleton, (prev, next) => {
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
  if (!prevAttacking && !nextAttacking) {
    const prevIdlePhase = Math.floor(prev.frame / IDLE_TICKS_PER_FRAME);
    const nextIdlePhase = Math.floor(next.frame / IDLE_TICKS_PER_FRAME);
    if (prevIdlePhase !== nextIdlePhase) return false;
  }
  return true;
});
