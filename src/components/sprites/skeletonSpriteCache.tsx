import { renderToStaticMarkup } from 'react-dom/server';

// ============================================================
// SKELETON SPRITE CACHE — Pre-renders lich skeleton poses as
// SVG blob URLs. Bone warrior with green necromantic glow.
// ============================================================

// Bounding box (same size as goblin)
const VB_X = -14;
const VB_Y = -16;
const VB_W = 48;
const VB_H = 48;

export const SKEL_VB_X = VB_X;
export const SKEL_VB_Y = VB_Y;
export const SKEL_VB_W = VB_W;
export const SKEL_VB_H = VB_H;

export const SKEL_IDLE_FRAME_COUNT = 8;

// Weapon swing angles for attack frames (indexed by attackCooldown 0-7)
const SWING_ANGLES = [8, 30, 50, 15, -25, -15, -10, -5];

// Colors
const bone = '#d4c8b0';
const boneDark = '#b8a890';
const boneLight = '#e8dcc8';
const socket = '#111';
const glow = '#44ff44';
const glowDim = '#2a8a2a';
const cloth = '#3a3040';
const clothDark = '#2a2030';
const rust = '#8a6a4a';
const rustDark = '#5a4a3a';
const rustLight = '#9a7a5a';

interface SkeletonProps {
  weaponAngle: number;
  headBob: number;
  eyeGlow: number;
  clothSway: number;
  armAngle: number;
}

function SkeletonBody({ weaponAngle, headBob, eyeGlow, clothSway, armAngle }: SkeletonProps) {
  const armTransform = armAngle !== 0
    ? `translate(2, 8) rotate(${armAngle}) translate(-2, -8)`
    : undefined;

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={12} cy={26} rx={9} ry={3} fill="rgba(0,0,0,0.2)" />

      {/* Body faces LEFT (toward player) */}
      <g transform="translate(24, 0) scale(-1, 1)">

        {/* Green necromantic glow under feet */}
        <ellipse cx={12} cy={25} rx={8} ry={3} fill={glow} opacity={0.06} />

        {/* Back leg — bone */}
        <g>
          <line x1={8} y1={18} x2={7} y2={22} stroke={boneDark} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={7} y1={22} x2={6} y2={25} stroke={bone} strokeWidth={2} strokeLinecap="round" />
          <circle cx={8} cy={18} r={1.2} fill={boneDark} /> {/* knee joint */}
          <circle cx={7} cy={22} r={1} fill={bone} /> {/* ankle joint */}
          {/* Foot bones */}
          <rect x={4} y={24} width={5} height={2} fill={boneDark} rx={0.5} />
        </g>

        {/* Spine — central backbone */}
        <line x1={12} y1={5} x2={12} y2={18} stroke={bone} strokeWidth={2} strokeLinecap="round" />
        {/* Vertebrae bumps */}
        <circle cx={12} cy={6} r={1.2} fill={boneLight} />
        <circle cx={12} cy={9} r={1} fill={boneDark} />
        <circle cx={12} cy={12} r={1} fill={boneDark} />
        <circle cx={12} cy={15} r={1} fill={boneDark} />

        {/* Collar bones */}
        <line x1={5} y1={7} x2={12} y2={5.5} stroke={bone} strokeWidth={1.5} strokeLinecap="round" />
        <line x1={19} y1={7} x2={12} y2={5.5} stroke={bone} strokeWidth={1.5} strokeLinecap="round" />

        {/* Sternum */}
        <line x1={12} y1={6} x2={12} y2={11} stroke={boneLight} strokeWidth={0.8} />

        {/* Ribs — curved bones, no fill, see-through */}
        <path d="M12,7 Q16,9 19,7.5" fill="none" stroke={bone} strokeWidth={1.3} strokeLinecap="round" />
        <path d="M12,7 Q8,9 5,7.5" fill="none" stroke={bone} strokeWidth={1.3} strokeLinecap="round" />
        <path d="M12,9 Q16,11 18.5,9.5" fill="none" stroke={bone} strokeWidth={1.2} strokeLinecap="round" />
        <path d="M12,9 Q8,11 5.5,9.5" fill="none" stroke={bone} strokeWidth={1.2} strokeLinecap="round" />
        <path d="M12,11 Q15.5,13 18,11.5" fill="none" stroke={boneDark} strokeWidth={1.1} strokeLinecap="round" />
        <path d="M12,11 Q8.5,13 6,11.5" fill="none" stroke={boneDark} strokeWidth={1.1} strokeLinecap="round" />
        <path d="M12,13 Q15,15 17,13.5" fill="none" stroke={boneDark} strokeWidth={1} strokeLinecap="round" />
        <path d="M12,13 Q9,15 7,13.5" fill="none" stroke={boneDark} strokeWidth={1} strokeLinecap="round" />

        {/* Pelvis bone */}
        <path d="M7,16 Q12,19 17,16" fill="none" stroke={bone} strokeWidth={1.5} strokeLinecap="round" />
        <path d="M8,16 Q7,17.5 6,18" fill="none" stroke={boneDark} strokeWidth={1.2} strokeLinecap="round" />
        <path d="M16,16 Q17,17.5 18,18" fill="none" stroke={boneDark} strokeWidth={1.2} strokeLinecap="round" />

        {/* Tattered cloth remnants — small wisps */}
        <polygon points={`5,14 3,${20 + clothSway} 7,${19 - clothSway * 0.5} 6,14`} fill={cloth} opacity={0.5} />
        <polygon points={`17,14 19,${20 - clothSway * 0.5} 21,${21 + clothSway} 18,14`} fill={clothDark} opacity={0.4} />
        <polygon points={`10,17 9,${22 + clothSway * 0.3} 13,${21 - clothSway * 0.3} 14,17`} fill={cloth} opacity={0.35} />

        {/* Front leg — bone */}
        <g>
          <line x1={15} y1={18} x2={16} y2={22} stroke={bone} strokeWidth={2.5} strokeLinecap="round" />
          <line x1={16} y1={22} x2={17} y2={25} stroke={boneLight} strokeWidth={2} strokeLinecap="round" />
          <circle cx={15} cy={18} r={1.2} fill={bone} />
          <circle cx={16} cy={22} r={1} fill={boneLight} />
          <rect x={15} y={24} width={5} height={2} fill={bone} rx={0.5} />
        </g>

        {/* Left arm (claw hand) — with idle sway */}
        <g transform={armTransform}>
          {/* Shoulder joint */}
          <circle cx={5} cy={7} r={1.5} fill={bone} />
          {/* Upper arm bone */}
          <line x1={5} y1={7} x2={3} y2={14} stroke={boneDark} strokeWidth={2} strokeLinecap="round" />
          <circle cx={3} cy={14} r={0.8} fill={boneDark} /> {/* elbow */}
          {/* Forearm */}
          <line x1={3} y1={14} x2={1} y2={18} stroke={bone} strokeWidth={1.8} strokeLinecap="round" />
          {/* Bony fingers */}
          <line x1={1} y1={18} x2={-1} y2={20} stroke={boneDark} strokeWidth={0.8} />
          <line x1={1} y1={18} x2={0} y2={21} stroke={boneDark} strokeWidth={0.8} />
          <line x1={1} y1={18} x2={2} y2={20.5} stroke={boneDark} strokeWidth={0.8} />
        </g>

        {/* Weapon arm — with rotation */}
        <g transform={`translate(19, 7) rotate(${weaponAngle}) translate(-19, -7)`}>
          {/* Shoulder joint */}
          <circle cx={19} cy={7} r={1.5} fill={bone} />
          {/* Upper arm */}
          <line x1={19} y1={7} x2={21} y2={14} stroke={bone} strokeWidth={2} strokeLinecap="round" />
          <circle cx={21} cy={14} r={0.8} fill={bone} />
          {/* Forearm */}
          <line x1={21} y1={14} x2={22} y2={19} stroke={bone} strokeWidth={1.8} strokeLinecap="round" />

          {/* Rusty sword — grip at hand, blade extends up */}
          {/* Pommel (bottom) */}
          <circle cx={22.5} cy={23} r={1.4} fill={rustDark} />
          {/* Hilt/handle */}
          <rect x={21.5} y={18.5} width={2} height={5} fill={rustDark} rx={0.3} />
          {/* Hilt wrap detail */}
          <line x1={21.5} y1={20} x2={23.5} y2={20} stroke={rust} strokeWidth={0.5} opacity={0.5} />
          <line x1={21.5} y1={21.5} x2={23.5} y2={21.5} stroke={rust} strokeWidth={0.5} opacity={0.5} />
          {/* Crossguard */}
          <rect x={19} y={17.5} width={7} height={1.8} fill={rustDark} rx={0.5} />
          {/* Blade going up from crossguard */}
          <rect x={21.5} y={4} width={2.2} height={14} fill={rust} rx={0.3} />
          {/* Sword edge highlight */}
          <rect x={22} y={5} width={0.8} height={12} fill={rustLight} opacity={0.3} />
          {/* Rust spots */}
          <circle cx={22.5} cy={8} r={0.8} fill={rustDark} opacity={0.4} />
          <circle cx={22} cy={12} r={0.7} fill={rustDark} opacity={0.3} />
          {/* Notched blade tip */}
          <polygon points="21.5,4 23.7,4 23.2,2 22,1 21.5,3" fill={rust} />

          {/* Bony grip fingers wrapping hilt */}
          <line x1={22} y1={19} x2={24} y2={19.5} stroke={boneDark} strokeWidth={0.9} strokeLinecap="round" />
          <line x1={22} y1={20} x2={24} y2={20.5} stroke={boneDark} strokeWidth={0.8} strokeLinecap="round" />
          <line x1={22} y1={21} x2={23.5} y2={21.5} stroke={boneDark} strokeWidth={0.8} strokeLinecap="round" />
        </g>

        {/* Skull head — with bob */}
        <g transform={headBob !== 0 ? `translate(0, ${headBob})` : undefined}>
          {/* Skull shape */}
          <ellipse cx={12} cy={1} rx={7} ry={6} fill={bone} />
          {/* Forehead */}
          <ellipse cx={12} cy={-2} rx={5} ry={3} fill={boneLight} opacity={0.3} />
          {/* Temporal ridges */}
          <path d="M6,0 Q5,2 6,5" fill="none" stroke={boneDark} strokeWidth={0.5} opacity={0.4} />
          <path d="M18,0 Q19,2 18,5" fill="none" stroke={boneDark} strokeWidth={0.5} opacity={0.4} />
          {/* Cheekbones */}
          <ellipse cx={8} cy={3} rx={2} ry={1.2} fill={boneDark} opacity={0.2} />
          <ellipse cx={16} cy={3} rx={2} ry={1.2} fill={boneDark} opacity={0.2} />
          {/* Skull cracks */}
          <path d="M10,-3 L11,0 L9.5,1" fill="none" stroke={boneDark} strokeWidth={0.4} opacity={0.5} />
          <path d="M15,-2 L14.5,0.5" fill="none" stroke={boneDark} strokeWidth={0.3} opacity={0.4} />

          {/* Eye sockets */}
          <ellipse cx={8} cy={1} rx={2.5} ry={2} fill={socket} />
          <ellipse cx={16} cy={1} rx={2.5} ry={2} fill={socket} />
          {/* Green eye glow */}
          <circle cx={8} cy={1} r={1.5} fill={glow} opacity={eyeGlow * 0.6} />
          <circle cx={16} cy={1} r={1.5} fill={glow} opacity={eyeGlow * 0.6} />
          <circle cx={8} cy={1} r={0.6} fill={glow} opacity={eyeGlow} />
          <circle cx={16} cy={1} r={0.6} fill={glow} opacity={eyeGlow} />

          {/* Nasal cavity */}
          <path d="M11,3 L12,5 L13,3 Z" fill={boneDark} opacity={0.5} />

          {/* Teeth — jagged grin */}
          <rect x={7} y={5} width={10} height={2.5} fill={boneDark} rx={0.5} />
          <polygon points="8,5 9,7 10,5" fill={boneLight} />
          <polygon points="10,5 11,6.5 12,5" fill={bone} />
          <polygon points="12,5 13,7 14,5" fill={boneLight} />
          <polygon points="14,5 15,6.5 16,5" fill={bone} />
          {/* Lower jaw */}
          <path d="M8,7.5 Q12,9 16,7.5" fill="none" stroke={boneDark} strokeWidth={0.6} />

          {/* Green wisp from skull */}
          <path d={`M8,-4 Q6,-7 7,-9`} fill="none" stroke={glowDim} strokeWidth={0.6} opacity={eyeGlow * 0.3} />
          <path d={`M16,-4 Q18,-7 17,-9`} fill="none" stroke={glowDim} strokeWidth={0.6} opacity={eyeGlow * 0.25} />
        </g>
      </g>
    </g>
  );
}

export interface SkeletonSpriteCache {
  idle: string[];
  attack: string[];
}

let cache: SkeletonSpriteCache | null = null;

function renderPose(props: SkeletonProps): string {
  const markup = renderToStaticMarkup(<SkeletonBody {...props} />);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB_X} ${VB_Y} ${VB_W} ${VB_H}">${markup}</svg>`;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

// Idle animation curves (8 phases)
// Phase:       0     1     2     3     4     5     6     7
// Head bob:    0     0     0     0     0    -0.8   0.4  -0.3
// Eye glow:    0.5   0.6   0.7   0.8   0.7   0.6   0.5   0.4
// Cloth sway:  0     0.5   1     0.5   0    -0.5  -1    -0.5
// Arm angle:   0    -0.5  -1    -0.5   0     0.5   1     0.5
const IDLE_HEAD =  [0,    0,    0,    0,    0,   -0.8,  0.4, -0.3];
const IDLE_EYE  =  [0.5,  0.6,  0.7,  0.8,  0.7,  0.6,  0.5,  0.4];
const IDLE_CLOTH = [0,    0.5,  1,    0.5,  0,   -0.5, -1,   -0.5];
const IDLE_ARM  =  [0,   -0.5, -1,   -0.5,  0,    0.5,  1,    0.5];

export function initSkeletonSpriteCache(): SkeletonSpriteCache {
  if (cache) return cache;

  const idleFrames = Array.from({ length: 8 }, (_, i) =>
    renderPose({
      weaponAngle: 0,
      headBob: IDLE_HEAD[i],
      eyeGlow: IDLE_EYE[i],
      clothSway: IDLE_CLOTH[i],
      armAngle: IDLE_ARM[i],
    })
  );

  const attackFrames = SWING_ANGLES.map(angle =>
    renderPose({
      weaponAngle: angle,
      headBob: 0,
      eyeGlow: 0.9,
      clothSway: 0,
      armAngle: 0,
    })
  );

  cache = { idle: idleFrames, attack: attackFrames };
  return cache;
}
