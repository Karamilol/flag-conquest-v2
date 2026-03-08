import { memo } from 'react';
import { COLORS, UNIT_STATS } from '../../constants';
import { initAllySpriteCache, ALLY_IDLE_FRAME_COUNT, ALLY_VB_X, ALLY_VB_Y, ALLY_VB_W, ALLY_VB_H } from './allySpriteCache';
import type { AllySpriteSet } from './allySpriteCache';
import './sprite-animations.css';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  unitType?: string;
  attackCooldown?: number;
  attackRate?: number;
  isRoyalGuard?: boolean;
  lastDamageTime?: number;
  showHpNumbers?: boolean;
  isFriendlySlime?: boolean;
  isCourier?: boolean;
  isGiant?: boolean;
  skinColors?: Record<string, string>;
}

const IDLE_TICKS_PER_FRAME = 25;

function CachedAlly({ x, y, health, maxHealth, frame, unitType = 'soldier', attackCooldown = 99, attackRate = 30, isRoyalGuard, lastDamageTime = 0, showHpNumbers, isFriendlySlime, isCourier, isGiant, skinColors }: Props) {
  const cache = initAllySpriteCache();

  // Friendly slime and courier don't have cached sprites — render inline (simple shapes)
  if (isFriendlySlime) {
    return <SlimeSprite x={x} y={y} health={health} maxHealth={maxHealth} frame={frame} lastDamageTime={lastDamageTime} showHpNumbers={showHpNumbers} />;
  }
  if (isCourier) {
    return <CourierSprite x={x} y={y} health={health} maxHealth={maxHealth} frame={frame} lastDamageTime={lastDamageTime} showHpNumbers={showHpNumbers} />;
  }

  const isAttacking = attackCooldown < 10;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const state = health <= 0 ? 'die' : isAttacking ? 'attack' : 'idle';
  // Map unitType to cache key
  const cacheKey = unitType === 'apprentice' ? 'wizard' : unitType;
  const spriteSet: AllySpriteSet | undefined = (cache as any)[cacheKey];

  // Fallback to soldier if unit type not in cache
  const sprites = spriteSet || cache.soldier;

  // Select frame
  let spriteUrl: string;
  if (isAttacking) {
    const atkIndex = Math.min(
      Math.floor((1 - attackCooldown / 10) * sprites.attack.length),
      sprites.attack.length - 1
    );
    spriteUrl = sprites.attack[Math.max(0, atkIndex)];
  } else {
    const offset = Math.floor(Math.abs(x) * 3);
    const idleIndex = Math.floor((frame + offset) / IDLE_TICKS_PER_FRAME) % ALLY_IDLE_FRAME_COUNT;
    spriteUrl = sprites.idle[idleIndex];
  }

  const stats = UNIT_STATS[unitType as keyof typeof UNIT_STATS] as any;
  const baseColor: string = stats?.color || '#4a7fff';
  const giantScale = isGiant ? 1.4 : 1;

  return (
    <g transform={`translate(${x}, ${y})${isGiant ? ` scale(${giantScale})` : ''}`}>
      <g className={state === 'die' ? 'sprite-die' : 'sprite-idle'}>

        {/* Cached body bitmap */}
        <image
          href={spriteUrl}
          x={ALLY_VB_X}
          y={ALLY_VB_Y}
          width={ALLY_VB_W}
          height={ALLY_VB_H}
        />

        {/* Royal Guard crown overlay (archer only) */}
        {isRoyalGuard && unitType === 'archer' && (
          <g>
            <polygon points="2,-16 5,-12 8,-15 10,-12 12,-15 15,-12 18,-16 18,-12 2,-12" fill="#ffd700" />
            <rect x={6} y={-15} width={2} height={2} fill="#ff4444" />
          </g>
        )}

        {/* Hit flash overlay */}
        {recentlyHit && (
          <rect x={-4} y={-8} width={28} height={36} fill="#ff0000" opacity={0.12} rx={2} />
        )}

        {/* Health bar */}
        <rect x={0} y={-12} width={20} height={4} fill={COLORS.healthBg} rx={1} />
        <rect x={1} y={-11} width={Math.max(0, (health / maxHealth) * 18)} height={2}
              fill={isRoyalGuard ? '#ffd700' : baseColor} rx={1} />
        {showHpNumbers && (
          <text x={10} y={-14} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
            {health}/{maxHealth}
          </text>
        )}
      </g>
    </g>
  );
}

// Simple inline sprites for special unit types that don't need caching

function SlimeSprite({ x, y, health, maxHealth, frame, lastDamageTime, showHpNumbers }: { x: number; y: number; health: number; maxHealth: number; frame: number; lastDamageTime: number; showHpNumbers?: boolean }) {
  const squish = Math.sin(frame * 0.12 + x) * 1.5;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  return (
    <g transform={`translate(${x}, ${y})`} className="sprite-idle">
      <ellipse cx={8} cy={18} rx={6} ry={2} fill="rgba(0,0,0,0.2)" />
      <ellipse cx={8} cy={12 + squish * 0.5} rx={7 + squish * 0.3} ry={8 - squish * 0.3} fill={hitFlash ? '#88ff88' : '#44cc44'} opacity={0.85} />
      <ellipse cx={8} cy={10 + squish * 0.5} rx={5} ry={5} fill="#66dd66" opacity={0.5} />
      <circle cx={5} cy={9} r={1.5} fill="#fff" />
      <circle cx={11} cy={9} r={1.5} fill="#fff" />
      <circle cx={5} cy={9.5} r={0.8} fill="#222" />
      <circle cx={11} cy={9.5} r={0.8} fill="#222" />
      {recentlyHit && hitFlash && <ellipse cx={8} cy={12} rx={9} ry={10} fill="#ff0000" opacity={0.15} />}
      <rect x={-1} y={-4} width={18} height={4} fill={COLORS.healthBg} rx={1} />
      <rect x={0} y={-3} width={Math.max(0, (health / maxHealth) * 16)} height={2} fill="#44ff44" rx={1} />
      {showHpNumbers && (
        <text x={8} y={-6} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}

function CourierSprite({ x, y, health, maxHealth, frame, lastDamageTime, showHpNumbers }: { x: number; y: number; health: number; maxHealth: number; frame: number; lastDamageTime: number; showHpNumbers?: boolean }) {
  const walkCycle = Math.sin(frame * 0.12 + x) * 2;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  return (
    <g transform={`translate(${x}, ${y})`} className="sprite-idle">
      <ellipse cx={10} cy={24} rx={8} ry={2.5} fill="rgba(0,0,0,0.25)" />
      <rect x={5} y={16} width={4} height={6 + walkCycle} fill="#3a3a5a" />
      <rect x={11} y={16} width={4} height={6 - walkCycle} fill="#3a3a5a" />
      <rect x={3} y={6} width={14} height={11} fill={hitFlash ? '#8888ff' : '#4455aa'} rx={1} />
      <rect x={3} y={15} width={14} height={2} fill="#8b6914" />
      <rect x={9} y={7} width={2} height={9} fill={hitFlash ? '#aaaaff' : '#5566bb'} />
      <rect x={4} y={-1} width={12} height={8} fill={hitFlash ? '#ffddbb' : '#eebb88'} rx={1} />
      <rect x={6} y={1} width={2} height={2} fill="#333" />
      <rect x={11} y={1} width={2} height={2} fill="#333" />
      <rect x={3} y={-3} width={14} height={4} fill={hitFlash ? '#6666cc' : '#3344aa'} rx={1} />
      <rect x={2} y={0} width={16} height={2} fill={hitFlash ? '#6666cc' : '#3344aa'} />
      <rect x={14} y={-1} width={5} height={2} fill={hitFlash ? '#5555bb' : '#223399'} rx={1} />
      <rect x={-3} y={5} width={7} height={9} fill="#8b6914" rx={1} />
      <rect x={-2} y={8} width={5} height={1} fill="#ffd700" />
      <rect x={-2} y={5} width={4} height={3} fill="#fff" />
      {recentlyHit && hitFlash && <rect x={-4} y={-4} width={24} height={28} fill="#ff0000" opacity={0.15} rx={2} />}
      <rect x={0} y={-8} width={20} height={3} fill={COLORS.healthBg} rx={1} />
      <rect x={1} y={-7} width={Math.max(0, (health / maxHealth) * 18)} height={1.5} fill="#4455aa" rx={1} />
      {showHpNumbers && (
        <text x={10} y={-10} fontSize="8" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}

export default memo(CachedAlly, (prev, next) => {
  if (Math.abs(prev.x - next.x) > 0.5 || Math.abs(prev.y - next.y) > 0.5) return false;
  if (prev.health !== next.health) return false;
  if (prev.maxHealth !== next.maxHealth) return false;
  if (prev.unitType !== next.unitType) return false;
  const prevAttacking = (prev.attackCooldown ?? 99) < 10;
  const nextAttacking = (next.attackCooldown ?? 99) < 10;
  if (prevAttacking || nextAttacking) {
    if (prev.attackCooldown !== next.attackCooldown) return false;
  }
  if (prevAttacking !== nextAttacking) return false;
  const prevHit = (prev.lastDamageTime ?? 0) > 0 && (prev.frame - (prev.lastDamageTime ?? 0)) < 10;
  const nextHit = (next.lastDamageTime ?? 0) > 0 && (next.frame - (next.lastDamageTime ?? 0)) < 10;
  if (prevHit !== nextHit) return false;
  if (prev.isGiant !== next.isGiant) return false;
  if (prev.isRoyalGuard !== next.isRoyalGuard) return false;
  if (prev.isFriendlySlime !== next.isFriendlySlime) return false;
  if (prev.isCourier !== next.isCourier) return false;
  // Allow idle animation frame changes
  if (!prevAttacking && !nextAttacking) {
    const prevIdlePhase = Math.floor(prev.frame / IDLE_TICKS_PER_FRAME);
    const nextIdlePhase = Math.floor(next.frame / IDLE_TICKS_PER_FRAME);
    if (prevIdlePhase !== nextIdlePhase) return false;
  }
  return true;
});
