import { COLORS } from '../../constants';
import type { Hero } from '../../types';

const SHEET_URL = 'sprites/WarlordWalkSheet.png';
const FRAME_COUNT = 4;
const COLS = 2;
const ROWS = 2;
const SHEET_W = 80;
const SHEET_H = 80;
const FRAME_W = SHEET_W / COLS; // 40
const FRAME_H = SHEET_H / ROWS; // 40
const SCALE = 1.0; // 40px sprite matches game scale
const RENDER_W = FRAME_W * SCALE;
const RENDER_H = FRAME_H * SCALE;

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
  skinColors?: Record<string, string>;
}

export default function PixelHeroSprite({ x, y, health, maxHealth, isAttacking, attackCooldown, frame, lastDamageTime = 0, hideHealth }: Props) {
  // Walk animation: cycle 4 frames at ~8fps (every 7.5 game frames at 60fps)
  const animFrame = Math.floor(frame / 8) % FRAME_COUNT;
  const justSwung = isAttacking && attackCooldown < 6;
  const attackOffset = justSwung ? 4 : 0;
  const timeSinceHit = frame - lastDamageTime;
  const recentlyHit = lastDamageTime > 0 && timeSinceHit >= 0 && timeSinceHit < 12;
  const hitFlash = recentlyHit && Math.floor(frame * 0.5) % 2 === 0;

  const clipId = `warlord-clip-${Math.floor(x)}`;
  const hpPct = Math.max(0, health / maxHealth);

  // 2x2 grid: frame 0=top-left, 1=top-right, 2=bottom-left, 3=bottom-right
  const col = animFrame % COLS;
  const row = Math.floor(animFrame / COLS);

  return (
    <g transform={`translate(${x + attackOffset},${y})`} opacity={hitFlash ? 0.5 : 1}>
      {/* Clip to show only 1 frame */}
      <defs>
        <clipPath id={clipId}>
          <rect x={0} y={0} width={RENDER_W} height={RENDER_H} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image
          href={SHEET_URL}
          x={-col * RENDER_W}
          y={-row * RENDER_H}
          width={SHEET_W * SCALE}
          height={SHEET_H * SCALE}
          style={{ imageRendering: 'pixelated' }}
        />
      </g>

      {/* HP bar */}
      {!hideHealth && (
        <g>
          <rect x={-2} y={-4} width={RENDER_W + 4} height={4} fill="#333" rx={1} />
          <rect x={-1} y={-3} width={(RENDER_W + 2) * hpPct} height={2} fill={hpPct > 0.5 ? COLORS.healthGreen : hpPct > 0.2 ? '#ff8800' : '#ff2222'} rx={1} />
        </g>
      )}
    </g>
  );
}
