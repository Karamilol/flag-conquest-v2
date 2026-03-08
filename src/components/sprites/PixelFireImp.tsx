import { getEliteGlow, getEliteName, getEliteScale } from './eliteVisuals';

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

export default function PixelFireImp({ x, y, health, maxHealth, frame, isCasting, castTimer, castTargetX, castTargetY, lastDamageTime = 0, showHpNumbers, isElite, eliteVariantId }: Props) {
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 10;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;
  const bobOffset = Math.sin(frame * 0.12) * 2;
  const eliteGlow = getEliteGlow(eliteVariantId);
  const eliteScale = getEliteScale(eliteVariantId);
  const castPulse = isCasting ? 0.5 + Math.sin(frame * 0.2) * 0.5 : 0;

  return (
    <g transform={`translate(${x}, ${y + bobOffset}) scale(${eliteVariantId ? eliteScale : 1.35})`}>
      {isElite && eliteGlow && <circle cx={10} cy={10} r={16} fill={eliteGlow} opacity={0.12 + Math.sin(frame * 0.2) * 0.06} />}
      {eliteVariantId && (
        <text x={10} y={-16} fontSize="7" textAnchor="middle" fill={eliteGlow || '#ff4444'} fontWeight="bold" stroke="#000" strokeWidth="0.5">
          {getEliteName(eliteVariantId)}
        </text>
      )}
      {/* Fire glow when casting */}
      {isCasting && <circle cx={10} cy={6} r={14 + castPulse * 4} fill="#ff4400" opacity={castPulse * 0.15} />}
      {/* Body — small red creature */}
      <ellipse cx={10} cy={12} rx={6} ry={7} fill={hitFlash ? '#fff' : '#cc3311'} />
      {/* Belly */}
      <ellipse cx={10} cy={14} rx={4} ry={4} fill={hitFlash ? '#fff' : '#ff6633'} />
      {/* Head */}
      <circle cx={10} cy={5} r={5} fill={hitFlash ? '#fff' : '#dd4422'} />
      {/* Eyes — glowing */}
      <circle cx={8} cy={4} r={1.5} fill="#ffcc00" />
      <circle cx={12} cy={4} r={1.5} fill="#ffcc00" />
      <circle cx={8} cy={4} r={0.7} fill="#fff" />
      <circle cx={12} cy={4} r={0.7} fill="#fff" />
      {/* Horns */}
      <polygon points="6,2 5,-3 8,1" fill={hitFlash ? '#fff' : '#881100'} />
      <polygon points="14,2 15,-3 12,1" fill={hitFlash ? '#fff' : '#881100'} />
      {/* Flame wisps floating around */}
      {[0, 1, 2].map(i => {
        const a = (frame * 0.06 + i * 2.1) % (Math.PI * 2);
        const fr = 10 + Math.sin(frame * 0.08 + i) * 3;
        const fx = 10 + Math.cos(a) * fr;
        const fy = 8 + Math.sin(a) * fr * 0.6;
        return <circle key={i} cx={fx} cy={fy} r={1.5} fill="#ff8844" opacity={0.4 + Math.sin(frame * 0.1 + i * 2) * 0.3} />;
      })}
      {/* Arms raised when casting */}
      {isCasting && (
        <>
          <line x1={4} y1={10} x2={0} y2={4} stroke="#cc3311" strokeWidth={2} strokeLinecap="round" />
          <line x1={16} y1={10} x2={20} y2={4} stroke="#cc3311" strokeWidth={2} strokeLinecap="round" />
          <circle cx={0} cy={3} r={2} fill="#ff6600" opacity={castPulse} />
          <circle cx={20} cy={3} r={2} fill="#ff6600" opacity={castPulse} />
        </>
      )}
      {/* === FIREBALL PROJECTILE ANIMATION === */}
      {isCasting && castTimer > 15 && (() => {
        const castTime = 120; // matches UNIT_STATS.fireImp.castTime
        const castProgress = Math.min(castTimer / castTime, 1);
        const sc = eliteVariantId ? eliteScale : 1.35; // must match outer scale
        const fireRelX = (castTargetX - x) / sc;
        const fireRelY = ((castTargetY || 0) - y - bobOffset) / sc;
        // Fireball arcs from imp hands to target
        const startX = 10;
        const startY = 4;
        const t = Math.min((castTimer - 15) / (castTime - 15), 1);
        const fbX = startX + (fireRelX - startX) * t;
        const arcHeight = -40 * Math.sin(t * Math.PI); // arc up then down
        const fbY = startY + (fireRelY - startY) * t + arcHeight;
        return (
          <>
            {/* Warning circle on ground at target */}
            <ellipse cx={fireRelX} cy={fireRelY + 2} rx={15 + castProgress * 25} ry={4 + castProgress * 3}
              fill="#ff4400" opacity={0.06 + castProgress * 0.1}
              stroke="#ff6600" strokeWidth="1" strokeDasharray={`${3 + castProgress * 5} 2`} />
            {/* Fireball */}
            {t < 1 && (
              <g transform={`translate(${fbX}, ${fbY})`}>
                {/* Trail */}
                <circle cx={2 + Math.sin(frame * 0.8) * 2} cy={3} r={2} fill="#ff6600" opacity={0.3} />
                <circle cx={-1 + Math.cos(frame * 0.7) * 2} cy={5} r={1.5} fill="#ffaa00" opacity={0.25} />
                {/* Core */}
                <circle cx={0} cy={0} r={4 + castProgress * 2} fill="#ff4400" opacity={0.8} />
                <circle cx={0} cy={0} r={2.5 + castProgress} fill="#ffaa00" opacity={0.7} />
                <circle cx={0} cy={0} r={1.2} fill="#ffee88" opacity={0.9} />
                {/* Outer glow */}
                <circle cx={0} cy={0} r={7 + castProgress * 3} fill="#ff4400" opacity={0.12} />
              </g>
            )}
          </>
        );
      })()}

      {/* Legs */}
      <rect x={6} y={18} width={2.5} height={4} fill="#aa2211" rx={1} />
      <rect x={11} y={18} width={2.5} height={4} fill="#aa2211" rx={1} />
      {/* Health bar */}
      <rect x={0} y={-8} width={20} height={3} fill="#333" rx={1} />
      <rect x={0} y={-8} width={20 * (health / maxHealth)} height={3} fill="#ff6633" rx={1} />
      {showHpNumbers && <text x={10} y={-10} fill="#fff" fontSize="6" textAnchor="middle">{health}/{maxHealth}</text>}
    </g>
  );
}
