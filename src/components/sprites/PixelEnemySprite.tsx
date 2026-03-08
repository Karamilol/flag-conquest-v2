import { COLORS } from '../../constants';

const SHEET_URL = 'sprites/GoblinWalkSheet.png';
const COLS = 2;
const ROWS = 2;
const SHEET_W = 64;
const SHEET_H = 66;
const FRAME_W = SHEET_W / COLS; // 32
const FRAME_H = SHEET_H / ROWS; // 33
const FRAME_COUNT = 4;

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  bleedStacks?: number;
  attackCooldown?: number;
  lastDamageTime?: number;
  isLichSkeleton?: boolean;
  showHpNumbers?: boolean;
  isElite?: boolean;
  eliteVariantId?: string;
}

export default function PixelEnemySprite({ x, y, health, maxHealth, frame, lastDamageTime = 0, showHpNumbers, isElite }: Props) {
  const animFrame = Math.floor(frame / 8) % FRAME_COUNT;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 12;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  const col = animFrame % COLS;
  const row = Math.floor(animFrame / COLS);
  const clipId = `goblin-clip-${Math.floor(x)}-${Math.floor(y)}`;
  const hpPct = Math.max(0, health / maxHealth);

  return (
    <g transform={`translate(${x},${y})`} opacity={hitFlash ? 0.5 : 1}>
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={FRAME_W} height={FRAME_H} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image
          href={SHEET_URL}
          x={-col * FRAME_W}
          y={-row * FRAME_H}
          width={SHEET_W}
          height={SHEET_H}
          style={{ imageRendering: 'pixelated' }}
        />
      </g>

      {/* Elite glow */}
      {isElite && <rect x={-2} y={-2} width={FRAME_W + 4} height={FRAME_H + 4} fill="none" stroke="#ff4444" strokeWidth={1.5} rx={3} opacity={0.6 + 0.3 * Math.sin(frame * 0.1)} />}

      {/* HP bar */}
      <rect x={-2} y={-4} width={FRAME_W + 4} height={4} fill="#333" rx={1} />
      <rect x={-1} y={-3} width={(FRAME_W + 2) * hpPct} height={2} fill={hpPct > 0.5 ? COLORS.enemyRed : '#ff2222'} rx={1} />

      {showHpNumbers && <text x={FRAME_W / 2} y={-6} fill="#ff8888" fontSize="7" textAnchor="middle">{health}/{maxHealth}</text>}
    </g>
  );
}
