import { memo } from 'react';
import { COLORS } from '../../constants';
import type { Hero } from '../../types';
import { initHeroSpriteCache, HERO_IDLE_FRAME_COUNT } from './heroSpriteCache';
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
  heroClass?: string;
}

const IDLE_TICKS_PER_FRAME = 25;

function CachedHero({ x, y, health, maxHealth, isAttacking, attackCooldown, frame, lastDamageTime = 0, hideHealth, heroClass = 'warlord' }: Props) {
  const cache = initHeroSpriteCache(heroClass);

  const justSwung = isAttacking && attackCooldown < 6;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 12;
  const state = health <= 0 ? 'die' : justSwung ? 'attack' : 'idle';

  // Lunge forward during swing peak
  const lungeX = justSwung ? Math.sin((1 - attackCooldown / 5) * Math.PI) * 3 : 0;

  // Select cached frame
  let spriteUrl: string;
  if (justSwung) {
    spriteUrl = cache.attack[Math.min(attackCooldown, cache.attack.length - 1)];
  } else {
    const offset = Math.floor(Math.abs(x) * 3);
    const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % HERO_IDLE_FRAME_COUNT;
    spriteUrl = cache.idle[idleIndex];
  }

  return (
    <g transform={`translate(${x + lungeX}, ${y})`}>
      <g className={state === 'die' ? 'sprite-die' : 'sprite-idle'}>

        {/* Cached body bitmap */}
        <image
          href={spriteUrl}
          x={cache.vbX}
          y={cache.vbY}
          width={cache.vbW}
          height={cache.vbH}
        />

        {/* Hit flash overlay */}
        {recentlyHit && (
          <rect x={-8} y={-18} width={52} height={58} fill="#ff0000" opacity={0.1} rx={3} />
        )}

        {/* Health bar */}
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

export default memo(CachedHero, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  const prevAttacking = prev.isAttacking && prev.attackCooldown < 6;
  const nextAttacking = next.isAttacking && next.attackCooldown < 6;
  if (prevAttacking || nextAttacking) {
    if (prev.attackCooldown !== next.attackCooldown) return false;
  }
  if (prevAttacking !== nextAttacking) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 12;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 12;
  if (prevHit !== nextHit) return false;
  if (prev.hideHealth !== next.hideHealth) return false;
  if (prev.heroClass !== next.heroClass) return false;
  // Allow idle animation frame changes
  if (!prevAttacking && !nextAttacking) {
    const prevIdlePhase = Math.floor(prev.frame / IDLE_TICKS_PER_FRAME);
    const nextIdlePhase = Math.floor(next.frame / IDLE_TICKS_PER_FRAME);
    if (prevIdlePhase !== nextIdlePhase) return false;
  }
  return true;
});
