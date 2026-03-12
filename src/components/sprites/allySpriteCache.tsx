import { renderToStaticMarkup } from 'react-dom/server';

// ============================================================
// ALLY SPRITE CACHE — Pre-renders all ally unit types as
// SVG blob URLs. Each unit gets detailed art with layered
// armor, weapons, shading, and baked idle/attack animations.
// ============================================================

// ViewBox for all allies (generous, fits the largest unit)
// VB_Y=-22 to accommodate wizard hat tip (y=-18) and conjurer hood (y=-14)
const VB_X = -10;
const VB_Y = -22;
const VB_W = 55;
const VB_H = 54;

export const ALLY_IDLE_FRAME_COUNT = 8;
const IDLE_TICKS_PER_FRAME = 25;

// Shared animation curves (8 idle phases)
const IDLE_BOB    = [0, 0, 0, 0, 0, 0, 0, 0]; // bob handled in component
const IDLE_CAPE   = [0, 1, 2, 1, 0, -0.8, -1.5, -0.8];
const IDLE_ARM    = [0, -0.5, -1, -0.5, 0, 0.5, 1, 0.5];
const IDLE_EYE    = [1, 1, 1, 0.1, 1, 1, 1, 1];

// Shared colors
const skin = '#f0c8a0';
const skinShadow = '#d0a880';

// ============================================================
// SOLDIER BODY — Chainmail tabard, kettle helm, short sword
// ============================================================

interface SoldierProps {
  swordAngle: number;    // swing rotation (0=upright rest, positive=swipe forward)
  armRot: number;        // shield arm sway
  eyeScaleY: number;
  capeSkew: number;
}

function SoldierBody({ swordAngle, armRot, eyeScaleY, capeSkew }: SoldierProps) {
  const chainmail = '#7a7a8a';
  const chainLight = '#9a9aaa';
  const chainDark = '#5a5a6a';
  const tabard = '#4a7fff';
  const tabardDark = '#3a5fcc';
  const met = '#888898';
  const metLight = '#aaabb8';
  const metDark = '#5a5a68';
  const leath = '#5a4a3a';
  const leathDark = '#3a2a1a';
  const leathLight = '#6a5a4a';
  const eyeTransform = eyeScaleY !== 1 ? `translate(10, 1) scale(1, ${eyeScaleY}) translate(-10, -1)` : undefined;
  const shieldTransform = armRot !== 0 ? `translate(3, 6) rotate(${armRot}) translate(-3, -6)` : undefined;
  const capeTransform = capeSkew !== 0 ? `translate(4, 10) skewX(${capeSkew}) translate(-4, -10)` : undefined;

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={10} cy={28} rx={10} ry={3} fill="rgba(0,0,0,0.25)" />
      {/* Tabard tail */}
      <g transform={capeTransform}>
        <polygon points="4,10 2,26 0,27 5,12" fill={tabardDark} />
        <polygon points="5,10 3,25 2,26 4,12" fill={tabard} opacity={0.7} />
      </g>
      {/* Back Leg */}
      <rect x={6} y={20} width={5} height={5} fill={chainDark} />
      <rect x={5} y={24} width={6} height={3} fill={leath} rx={1} />
      <rect x={5} y={26} width={7} height={2} fill={leathDark} rx={1} />
      {/* Torso — chainmail + tabard */}
      <rect x={3} y={6} width={14} height={12} fill={chainmail} rx={1} />
      <rect x={4} y={7} width={12} height={1} fill={chainLight} opacity={0.3} />
      <rect x={4} y={9} width={12} height={1} fill={chainLight} opacity={0.3} />
      <rect x={4} y={11} width={12} height={1} fill={chainLight} opacity={0.3} />
      <rect x={4} y={13} width={12} height={1} fill={chainLight} opacity={0.3} />
      <rect x={4} y={15} width={12} height={1} fill={chainLight} opacity={0.3} />
      <rect x={5} y={7} width={10} height={11} fill={tabard} opacity={0.85} />
      <rect x={9} y={7} width={2} height={11} fill={tabardDark} opacity={0.5} />
      <rect x={5} y={17} width={10} height={1} fill={tabardDark} />
      <rect x={3} y={17} width={14} height={2} fill={leath} />
      <rect x={8} y={17} width={4} height={2} fill="#a89040" rx={0.5} />
      {/* Front Leg */}
      <rect x={11} y={20} width={5} height={5} fill={chainmail} />
      <circle cx={13.5} cy={21} r={2} fill={metDark} />
      <rect x={10} y={24} width={6} height={3} fill={leath} rx={1} />
      <rect x={10} y={26} width={7} height={2} fill={leathDark} rx={1} />
      <rect x={15} y={27} width={2} height={1} fill={leathDark} rx={0.5} />
      {/* Shield Arm */}
      <g transform={shieldTransform}>
        <rect x={0} y={5} width={6} height={4} fill={chainmail} rx={1} />
        <rect x={0} y={8} width={5} height={6} fill={chainDark} />
        <rect x={-1} y={13} width={5} height={3} fill={met} rx={1} />
        <circle cx={0} cy={12} r={5} fill={metDark} />
        <circle cx={0} cy={12} r={4} fill={met} />
        <circle cx={0} cy={12} r={2.5} fill={tabard} />
        <circle cx={0} cy={12} r={1.2} fill={metLight} />
        <circle cx={0} cy={12} r={4.5} fill="none" stroke={metLight} strokeWidth={0.5} opacity={0.4} />
      </g>
      {/* Weapon Arm + Short Sword */}
      <g>
        <rect x={14} y={5} width={6} height={4} fill={chainmail} rx={1} />
        <rect x={15} y={8} width={5} height={6} fill={chainmail} />
        <rect x={16} y={13} width={5} height={3} fill={met} rx={1} />
        <rect x={18} y={6} width={3} height={3} fill={skin} rx={0.5} />
        {/* Sword — rotates around grip for swipe */}
        <g transform={`rotate(${swordAngle}, 19.5, 10)`}>
          <circle cx={19.5} cy={18} r={1.5} fill="#a89040" />
          <rect x={18.5} y={12} width={2.5} height={6} fill={leath} rx={0.5} />
          <rect x={16} y={10} width={8} height={2.5} fill="#a89040" rx={0.5} />
          <rect x={18} y={-6} width={4} height={16} fill={metLight} />
          <rect x={19} y={-4} width={2} height={12} fill={met} />
          <rect x={18} y={-6} width={0.8} height={16} fill="#ccd" opacity={0.5} />
          <polygon points="18,-6 22,-6 20,-9" fill={metLight} />
        </g>
      </g>
      {/* Swipe arc flash */}
      {swordAngle > 40 && (
        <path d={`M 16 2 Q 26 8 22 18`} fill="none" stroke="#fff" strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      )}
      {/* Head */}
      <rect x={4} y={-2} width={12} height={7} fill={skin} rx={1} />
      <g transform={eyeTransform}>
        <rect x={6} y={0} width={2} height={2} fill="#333" />
        <rect x={12} y={0} width={2} height={2} fill="#333" />
      </g>
      <rect x={8} y={4} width={4} height={1} fill={skinShadow} rx={0.5} />
      {/* Kettle helm */}
      <rect x={2} y={-5} width={16} height={5} fill={met} rx={2} />
      <rect x={0} y={-2} width={20} height={2} fill={metDark} rx={1} />
      <rect x={5} y={-7} width={10} height={4} fill={metLight} rx={2} />
      <circle cx={10} cy={-5} r={0.8} fill={metLight} />
      <rect x={3} y={-4} width={14} height={1.5} fill={met} rx={0.5} />
    </g>
  );
}

// ============================================================
// ARCHER BODY — Friendly bowman, leather jerkin, feathered cap, shortbow
// ============================================================

interface ArcherProps {
  stringPull: number;
  armRot: number;
  eyeScaleY: number;
  showArrow: boolean;
  releaseFlash: boolean;
}

function ArcherBody({ stringPull, armRot, eyeScaleY, showArrow, releaseFlash }: ArcherProps) {
  const tunic = '#4a7a3a';
  const tunicDark = '#3a6a2a';
  const tunicLight = '#5a8a4a';
  const leath = '#6a5a3a';
  const leathDark = '#4a3a2a';
  const leathLight = '#8a7a5a';
  const bowWood = '#8b5a2a';
  const bowLight = '#a87040';
  const str = '#ccc';
  const capBrown = '#7a5a30';
  const capDark = '#5a4020';
  const feather = '#cc3333';
  const bowX = -2;
  const bowTopY = 2;
  const bowBotY = 22;
  const stringMidX = bowX + stringPull;
  const stringMidY = 12;
  const eyeTransform = eyeScaleY !== 1 ? `translate(11, 1) scale(1, ${eyeScaleY}) translate(-11, -1)` : undefined;

  return (
    <g transform="translate(20, 0) scale(-1, 1)">
      <ellipse cx={10} cy={27} rx={9} ry={3} fill="rgba(0,0,0,0.25)" />
      {/* Quiver on back */}
      <rect x={15} y={3} width={4} height={12} fill={leathDark} rx={1} />
      <rect x={18} y={3} width={1} height={12} fill="#3a2a1a" rx={0.5} />
      <line x1={17} y1={3} x2={9} y2={8} stroke={leath} strokeWidth={1.5} />
      {/* Arrow shafts poking out */}
      <line x1={16} y1={3} x2={15.5} y2={-3} stroke={bowWood} strokeWidth={1} />
      <line x1={17.5} y1={3} x2={17} y2={-4} stroke={bowWood} strokeWidth={1} />
      <polygon points="15,-3 15.5,-3 16,-5 15,-4.5" fill="#888" opacity={0.7} />
      <polygon points="16.5,-4 17,-4 17.5,-6 16.5,-5.5" fill="#888" opacity={0.7} />
      {/* Back Leg */}
      <rect x={6} y={18} width={4} height={5} fill={tunicDark} />
      <rect x={5} y={22} width={6} height={3} fill={leath} rx={1} />
      <rect x={5} y={24} width={7} height={2} fill={leathDark} rx={1} />
      {/* Torso — leather jerkin over green tunic */}
      <rect x={3} y={6} width={14} height={12} fill={tunic} rx={1} />
      <rect x={5} y={7} width={10} height={10} fill={leath} opacity={0.5} />
      <line x1={10} y1={7} x2={10} y2={14} stroke={leathDark} strokeWidth={0.8} opacity={0.4} />
      {/* Lacing detail */}
      <line x1={9} y1={8} x2={11} y2={9} stroke={leathLight} strokeWidth={0.5} opacity={0.5} />
      <line x1={9} y1={10} x2={11} y2={11} stroke={leathLight} strokeWidth={0.5} opacity={0.5} />
      <line x1={9} y1={12} x2={11} y2={13} stroke={leathLight} strokeWidth={0.5} opacity={0.5} />
      {/* Belt */}
      <rect x={2} y={16} width={16} height={2} fill={leath} />
      <rect x={8} y={16} width={4} height={2} fill="#888" rx={0.5} />
      {/* Front Leg */}
      <rect x={11} y={18} width={5} height={5} fill={tunic} />
      <rect x={10} y={22} width={6} height={3} fill={leath} rx={1} />
      <rect x={10} y={24} width={7} height={2} fill={leathDark} rx={1} />
      <rect x={15} y={25} width={2} height={1} fill={leathDark} rx={0.5} />
      {/* Draw arm (right — pulls string) */}
      <rect x={14} y={5} width={5} height={4} fill={tunic} rx={1} />
      <rect x={14} y={8} width={4} height={5} fill={tunicDark} />
      <rect x={15} y={11} width={4} height={3} fill={leath} rx={0.5} />
      {showArrow ? (
        <rect x={stringMidX - 1} y={stringMidY - 1} width={3} height={3} fill={leathDark} rx={0.5} />
      ) : (
        <rect x={15} y={14} width={3} height={2} fill={skin} rx={0.5} />
      )}
      {/* Bow arm (left — holds bow) */}
      <rect x={0} y={5} width={5} height={4} fill={tunic} rx={1} />
      <rect x={-1} y={8} width={5} height={5} fill={tunicDark} />
      <rect x={-2} y={11} width={5} height={3} fill={leath} rx={0.5} />
      <rect x={-3} y={10} width={3} height={4} fill={skin} rx={0.5} />
      {/* Bow — shorter recurve */}
      <path d={`M${bowX},${bowTopY} C${bowX - 5},${bowTopY + 5} ${bowX - 5},${bowBotY - 5} ${bowX},${bowBotY}`}
        fill="none" stroke={bowWood} strokeWidth={2.5} strokeLinecap="round" />
      <path d={`M${bowX},${bowTopY + 1} C${bowX - 4},${bowTopY + 5} ${bowX - 4},${bowBotY - 5} ${bowX},${bowBotY - 1}`}
        fill="none" stroke={bowLight} strokeWidth={0.8} opacity={0.4} />
      <rect x={bowX - 3} y={10} width={4} height={4} fill={leath} rx={1} />
      <circle cx={bowX} cy={bowTopY} r={1} fill={bowWood} />
      <circle cx={bowX} cy={bowBotY} r={1} fill={bowWood} />
      {/* String */}
      <line x1={bowX} y1={bowTopY} x2={stringMidX} y2={stringMidY} stroke={str} strokeWidth={0.8} />
      <line x1={stringMidX} y1={stringMidY} x2={bowX} y2={bowBotY} stroke={str} strokeWidth={0.8} />
      {/* Nocked arrow */}
      {showArrow && (
        <g>
          <line x1={stringMidX} y1={stringMidY} x2={-14} y2={12} stroke={bowWood} strokeWidth={1.5} />
          <polygon points="-14,10.5 -14,13.5 -17,12" fill="#888" />
        </g>
      )}
      {releaseFlash && <circle cx={-14} cy={12} r={4} fill="#ffaa00" opacity={0.5} />}
      {/* Head — open face, visible features */}
      <rect x={4} y={-1} width={12} height={7} fill={skin} rx={1} />
      {/* Eyes — friendly brown */}
      <g transform={eyeTransform}>
        <rect x={5} y={1} width={2} height={2} fill="#443322" />
        <rect x={13} y={1} width={2} height={2} fill="#443322" />
      </g>
      {/* Mouth — slight grin */}
      <rect x={8} y={4} width={4} height={1} fill={skinShadow} rx={0.5} />
      {/* Feathered cap */}
      <rect x={2} y={-4} width={16} height={4} fill={capBrown} rx={2} />
      <rect x={4} y={-6} width={12} height={4} fill={capBrown} rx={2} />
      <rect x={2} y={-1} width={16} height={1.5} fill={capDark} rx={0.5} />
      {/* Brim folds */}
      <line x1={3} y1={-3} x2={4} y2={-1} stroke={capDark} strokeWidth={0.6} opacity={0.5} />
      <line x1={17} y1={-3} x2={16} y2={-1} stroke={capDark} strokeWidth={0.6} opacity={0.5} />
      {/* Feather — red plume tucked in cap band */}
      <path d="M16,-4 C20,-8 22,-10 18,-12" fill="none" stroke={feather} strokeWidth={1.5} strokeLinecap="round" />
      <path d="M16,-4 C19,-7 21,-9 17,-11" fill="none" stroke="#dd5555" strokeWidth={0.8} opacity={0.6} />
    </g>
  );
}

// ============================================================
// KNIGHT BODY — Full plate, great shield, longsword, cape
// ============================================================

interface KnightProps {
  swordAngle: number;
  shieldRot: number;
  capeSkew: number;
  eyeScaleY: number;
}

function KnightBody({ swordAngle, shieldRot, capeSkew, eyeScaleY }: KnightProps) {
  const plate = '#7a7a8a';
  const plateLt = '#9a9aaa';
  const plateDk = '#5a5a68';
  const armorBlue = '#4a5a8a';
  const armorBlueLt = '#6a7aaa';
  const capeColor = '#3a3a6a';
  const capeDk = '#2a2a4a';
  const leath = '#5a4a3a';
  const leathDk = '#3a2a1a';
  const goldTrim = '#c8a83e';
  const goldLt = '#e8c85e';
  const eyeTransform = eyeScaleY !== 1 ? `translate(12, 4) scale(1, ${eyeScaleY}) translate(-12, -4)` : undefined;
  const shieldXf = shieldRot !== 0 ? `translate(2, 6) rotate(${shieldRot}) translate(-2, -6)` : undefined;
  const capeXf = capeSkew !== 0 ? `translate(4, 8) skewX(${capeSkew}) translate(-4, -8)` : undefined;

  return (
    <g>
      <ellipse cx={12} cy={28} rx={11} ry={4} fill="rgba(0,0,0,0.25)" />
      {/* Cape */}
      <g transform={capeXf}>
        <polygon points="4,8 -2,26 -4,28 6,10" fill={capeColor} />
        <polygon points="5,8 -1,25 -2,26 6,10" fill={capeDk} />
        <polygon points="3,14 0,24 1,24 4,14" fill={capeColor} opacity={0.5} />
      </g>
      {/* Back Leg — full greaves */}
      <rect x={7} y={20} width={5} height={5} fill={plateDk} />
      <rect x={6} y={24} width={6} height={3} fill={plate} rx={1} />
      <rect x={6} y={26} width={7} height={2} fill={leathDk} rx={1} />
      {/* Torso — layered plate */}
      <rect x={4} y={6} width={16} height={14} fill={plate} rx={1} />
      <rect x={6} y={8} width={12} height={10} fill={armorBlue} rx={1} />
      {/* Chest cross emblem */}
      <rect x={10} y={10} width={4} height={1} fill={goldTrim} />
      <rect x={11} y={8} width={2} height={5} fill={goldTrim} />
      {/* Highlight */}
      <rect x={4} y={6} width={16} height={1} fill={plateLt} opacity={0.3} />
      <rect x={4} y={19} width={16} height={1} fill={plateDk} opacity={0.4} />
      {/* Rivets */}
      <circle cx={6} cy={8} r={0.6} fill={plateLt} />
      <circle cx={18} cy={8} r={0.6} fill={plateLt} />
      <circle cx={6} cy={18} r={0.6} fill={plateLt} />
      <circle cx={18} cy={18} r={0.6} fill={plateLt} />
      {/* Belt */}
      <rect x={3} y={18} width={18} height={2.5} fill={leath} />
      <rect x={10} y={18} width={4} height={2.5} fill={goldTrim} rx={0.5} />
      <rect x={11} y={18.5} width={2} height={1.5} fill={goldLt} />
      {/* Front Leg */}
      <rect x={13} y={20} width={5} height={5} fill={plate} />
      <circle cx={15.5} cy={21.5} r={2} fill={plateDk} />
      <rect x={12} y={24} width={6} height={3} fill={plate} rx={1} />
      <rect x={12} y={26} width={7} height={2} fill={leathDk} rx={1} />
      <rect x={17} y={27} width={2} height={1} fill={leathDk} rx={0.5} />
      {/* Shield Arm — great tower shield */}
      <g transform={shieldXf}>
        <rect x={0} y={5} width={6} height={4} fill={plate} rx={1} />
        <rect x={0} y={8} width={5} height={6} fill={plateDk} />
        <rect x={-1} y={13} width={5} height={3} fill={plate} rx={1} />
        {/* Tower shield */}
        <rect x={-8} y={6} width={10} height={16} fill={armorBlue} rx={1} />
        <rect x={-7} y={7} width={8} height={14} fill={armorBlueLt} rx={1} />
        {/* Shield emblem */}
        <rect x={-5} y={11} width={4} height={1} fill={goldTrim} />
        <rect x={-4} y={9} width={2} height={5} fill={goldTrim} />
        {/* Shield rim */}
        <rect x={-8} y={6} width={10} height={1} fill={plateLt} opacity={0.4} />
        <rect x={-8} y={21} width={10} height={1} fill={plateDk} opacity={0.4} />
        <line x1={-8} y1={6} x2={-8} y2={22} stroke={plateLt} strokeWidth={0.5} opacity={0.3} />
      </g>
      {/* Weapon Arm — longsword */}
      <g transform={`translate(20, 8) rotate(${swordAngle}) translate(-20, -8)`}>
        <rect x={16} y={5} width={6} height={4} fill={plate} rx={1} />
        <rect x={17} y={8} width={5} height={6} fill={plate} />
        <rect x={18} y={13} width={5} height={3} fill={plateLt} rx={1} />
        <rect x={20} y={6} width={3} height={3} fill={skin} rx={0.5} />
        {/* Longsword */}
        <circle cx={21.5} cy={18} r={1.5} fill={goldTrim} />
        <rect x={20.5} y={12} width={2.5} height={6} fill={leath} rx={0.5} />
        <rect x={18} y={10} width={8} height={2.5} fill={goldTrim} rx={0.5} />
        <rect x={19} y={11} width={6} height={1} fill={goldLt} />
        <rect x={19.5} y={-8} width={4.5} height={18} fill={plateLt} />
        <rect x={20.5} y={-6} width={2.5} height={14} fill={plate} />
        <rect x={19.5} y={-8} width={1} height={18} fill="#ccd" opacity={0.5} />
        <polygon points={`19.5,-8 24,-8 21.75,-12`} fill={plateLt} />
        <polygon points={`20.5,-8 23,-8 21.75,-11`} fill="#dde" opacity={0.4} />
      </g>
      {/* Head — full-face helm */}
      <rect x={4} y={-2} width={16} height={10} fill={plate} rx={2} />
      <rect x={6} y={0} width={12} height={6} fill={plateDk} rx={1} />
      {/* Visor slit */}
      <rect x={7} y={2} width={10} height={2} fill="#1a1a2e" />
      <g transform={eyeTransform}>
        <rect x={8} y={3} width={3} height={2} fill="#fff" opacity={0.6} />
        <rect x={13} y={3} width={3} height={2} fill="#fff" opacity={0.6} />
      </g>
      {/* Helm crest */}
      <rect x={3} y={-4} width={18} height={3} fill={plate} rx={1} />
      <rect x={5} y={-6} width={14} height={4} fill={plateLt} rx={2} />
      <rect x={9} y={-8} width={6} height={3} fill={armorBlue} rx={1} />
      <rect x={10} y={-9} width={4} height={4} fill={armorBlueLt} rx={1} />
      {/* Helm rivets */}
      <circle cx={6} cy={-3} r={0.6} fill={plateLt} />
      <circle cx={18} cy={-3} r={0.6} fill={plateLt} />
    </g>
  );
}

// ============================================================
// HALBERD BODY — Open-face helm, polearm, shoulder guards
// ============================================================

interface HalberdProps {
  thrustExtend: number;  // 0 in idle, positive slides spear forward during stab
  armRot: number;        // subtle idle arm bob
  eyeScaleY: number;
}

function HalberdBody({ thrustExtend, armRot, eyeScaleY }: HalberdProps) {
  const armorBrown = '#8b6b4a';
  const armorBrownLt = '#ab8b6a';
  const armorBrownDk = '#6b4b2a';
  const leath = '#5a4a3a';
  const leathDk = '#3a2a1a';
  const met = '#888';
  const metLt = '#aaa';
  const eyeTransform = eyeScaleY !== 1 ? `translate(10, 0) scale(1, ${eyeScaleY}) translate(-10, 0)` : undefined;

  // Spear is horizontal at chest height — slides through hands on stab
  const isStabbing = thrustExtend > 5;

  return (
    <g>
      <ellipse cx={10} cy={26} rx={9} ry={3} fill="rgba(0,0,0,0.25)" />
      {/* Back Leg */}
      <rect x={6} y={18} width={4} height={5} fill={armorBrownDk} />
      <rect x={5} y={22} width={6} height={3} fill={leath} rx={1} />
      <rect x={5} y={24} width={7} height={2} fill={leathDk} rx={1} />
      {/* Torso */}
      <rect x={3} y={6} width={14} height={12} fill={armorBrown} rx={1} />
      <rect x={5} y={8} width={10} height={8} fill={armorBrownLt} opacity={0.7} />
      {/* Chest straps */}
      <line x1={5} y1={8} x2={15} y2={12} stroke={leathDk} strokeWidth={1} opacity={0.4} />
      <line x1={5} y1={12} x2={15} y2={8} stroke={leathDk} strokeWidth={1} opacity={0.4} />
      {/* Belt */}
      <rect x={2} y={16} width={16} height={2.5} fill={leath} />
      <rect x={8} y={16} width={4} height={2.5} fill={met} rx={0.5} />
      {/* Front Leg */}
      <rect x={11} y={18} width={5} height={5} fill={armorBrown} />
      <rect x={10} y={22} width={6} height={3} fill={leath} rx={1} />
      <rect x={10} y={24} width={7} height={2} fill={leathDk} rx={1} />
      <rect x={15} y={25} width={2} height={1} fill={leathDk} rx={0.5} />

      {/* Horizontal polearm — slides through hands on stab */}
      <g transform={`translate(${thrustExtend}, 0)`}>
        {/* Shaft — runs horizontally at chest height */}
        <rect x={-4} y={7} width={34} height={3} fill="#5a3a1a" />
        {/* Shaft grain marks */}
        <rect x={5} y={7.5} width={1} height={2} fill="#443322" opacity={0.5} />
        <rect x={15} y={7.5} width={1} height={2} fill="#443322" opacity={0.5} />
        {/* Axe blade — perpendicular near tip */}
        <polygon points="26,4 26,13 29,6 29,11" fill={metLt} />
        <line x1={26} y1={4} x2={26} y2={13} stroke="#ccc" strokeWidth={0.5} />
        {/* Spear tip — sharp point extending right */}
        <polygon points="30,7 30,10 36,8.5" fill={met} />
        <line x1={30} y1={8.5} x2={36} y2={8.5} stroke="#bbb" strokeWidth={0.5} />
        {/* Shaft butt cap (left end) */}
        <rect x={-5} y={6.5} width={2} height={4} fill={met} rx={0.5} />
      </g>

      {/* Stab trail — speed lines */}
      {isStabbing && (
        <g opacity={0.3}>
          <line x1={20} y1={6} x2={30 + thrustExtend} y2={6} stroke="#cc8844" strokeWidth={1.5} strokeLinecap="round" />
          <line x1={20} y1={11} x2={30 + thrustExtend} y2={11} stroke="#cc8844" strokeWidth={1.5} strokeLinecap="round" />
        </g>
      )}

      {/* Left arm — rear grip on shaft */}
      <g transform={armRot !== 0 ? `translate(2, 8) rotate(${armRot}) translate(-2, -8)` : undefined}>
        <rect x={0} y={4} width={6} height={6} fill={armorBrown} rx={1} />
        <rect x={1} y={5} width={4} height={4} fill={armorBrownLt} rx={1} />
        <circle cx={3} cy={5} r={1} fill={met} />
        <rect x={0} y={9} width={5} height={4} fill={armorBrownDk} />
        {/* Left hand gripping shaft */}
        <rect x={0} y={6} width={4} height={4} fill={skin} rx={0.5} />
      </g>
      {/* Right arm — forward grip on shaft */}
      <rect x={14} y={4} width={6} height={6} fill={armorBrown} rx={1} />
      <rect x={15} y={5} width={4} height={4} fill={armorBrownLt} rx={1} />
      <circle cx={17} cy={5} r={1} fill={met} />
      <rect x={15} y={9} width={5} height={4} fill={armorBrown} />
      {/* Right hand gripping shaft */}
      <rect x={17} y={6} width={4} height={4} fill={skin} rx={0.5} />

      {/* Head — open face helm */}
      <rect x={3} y={-2} width={14} height={8} fill={skin} rx={1} />
      <g transform={eyeTransform}>
        <rect x={5} y={0} width={2} height={2} fill="#333" />
        <rect x={13} y={0} width={2} height={2} fill="#333" />
      </g>
      {/* Mouth */}
      <rect x={8} y={4} width={4} height={1} fill={skinShadow} rx={0.5} />
      {/* Helm */}
      <rect x={1} y={-4} width={18} height={4} fill={armorBrown} rx={1} />
      <rect x={3} y={-6} width={14} height={4} fill={armorBrownLt} rx={2} />
      {/* Nose guard */}
      <rect x={9} y={-2} width={2} height={4} fill={met} />
      {/* Cheek guards */}
      <rect x={1} y={-1} width={3} height={4} fill={armorBrownDk} rx={0.5} />
      <rect x={16} y={-1} width={3} height={4} fill={armorBrownDk} rx={0.5} />
      {/* Helm rivets */}
      <circle cx={5} cy={-4} r={0.5} fill={metLt} />
      <circle cx={15} cy={-4} r={0.5} fill={metLt} />
    </g>
  );
}

// ============================================================
// WIZARD BODY — Pointed hat, staff with orb, flowing robe
// ============================================================

interface WizardProps {
  orbPulse: number;    // 0-1 glow intensity
  armRaise: number;    // arm offset
  eyeScaleY: number;
}

function WizardBody({ orbPulse, armRaise, eyeScaleY }: WizardProps) {
  const robe = '#6a3aaa';
  const robeDk = '#4a2a7a';
  const robeLt = '#8a5aca';
  const hatColor = '#5a2a9a';
  const hatLt = '#7a4aba';
  const leath = '#5a4a3a';
  const leathDk = '#3a2a1a';
  const orbColor = '#aa55ff';
  const orbGlow = '#dd88ff';
  const eyeTransform = eyeScaleY !== 1 ? `translate(10, 0) scale(1, ${eyeScaleY}) translate(-10, 0)` : undefined;
  const orbR = 4 + orbPulse * 2;

  return (
    <g>
      <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
      {/* Robe skirt */}
      <polygon points="2,14 0,24 4,24" fill={robeDk} />
      <polygon points="18,14 20,24 16,24" fill={robeDk} />
      {/* Robe body */}
      <rect x={2} y={4} width={16} height={14} fill={robe} rx={1} />
      <rect x={4} y={6} width={12} height={10} fill={robeDk} opacity={0.6} />
      {/* Robe center line */}
      <rect x={9} y={6} width={2} height={12} fill={robeLt} opacity={0.3} />
      {/* Belt */}
      <rect x={2} y={16} width={16} height={2} fill={leath} />
      <rect x={8} y={16} width={4} height={2} fill="#aa8833" rx={0.5} />
      {/* Rune trim */}
      <rect x={2} y={18} width={16} height={1} fill={hatLt} opacity={0.4} />
      {/* Left arm */}
      <rect x={-2} y={4 + armRaise} width={5} height={3} fill={robe} rx={0.5} />
      <rect x={-2} y={6 + armRaise} width={3} height={2} fill={skin} rx={0.5} />
      {/* Right arm */}
      <rect x={17} y={4 - armRaise} width={5} height={3} fill={robe} rx={0.5} />
      <rect x={19} y={6 - armRaise} width={3} height={2} fill={skin} rx={0.5} />
      {/* Staff */}
      <rect x={20} y={-8} width={3} height={28} fill="#5a3a1a" />
      <rect x={20} y={6} width={3} height={1} fill="#443322" opacity={0.5} />
      <rect x={20} y={10} width={3} height={1} fill="#443322" opacity={0.5} />
      {/* Orb */}
      <circle cx={21} cy={-10} r={orbR} fill={orbColor} opacity={0.6 + orbPulse * 0.3} />
      <circle cx={21} cy={-10} r={Math.max(1, orbR - 2)} fill={orbGlow} opacity={0.7} />
      <circle cx={20} cy={-11} r={1} fill="#fff" opacity={0.5} />
      {/* Legs */}
      <rect x={4} y={18} width={4} height={3} fill={leathDk} />
      <rect x={12} y={18} width={4} height={3} fill={leathDk} />
      <rect x={3} y={21} width={6} height={2} fill={leathDk} rx={1} />
      <rect x={11} y={21} width={6} height={2} fill={leathDk} rx={1} />
      {/* Head */}
      <rect x={4} y={-2} width={12} height={8} fill={skin} rx={1} />
      <g transform={eyeTransform}>
        <rect x={6} y={0} width={2} height={2} fill="#333" />
        <rect x={12} y={0} width={2} height={2} fill="#333" />
      </g>
      {/* Wizard hat */}
      <polygon points="10,-18 2,-2 18,-2" fill={hatColor} />
      <rect x={0} y={-4} width={20} height={4} fill={robeDk} rx={1} />
      {/* Hat band */}
      <rect x={1} y={-4} width={18} height={2} fill={hatLt} opacity={0.5} />
      {/* Star emblem */}
      <circle cx={10} cy={-10} r={2} fill="#ffff00" opacity={0.6} />
      <circle cx={10} cy={-10} r={1} fill="#fff" opacity={0.4} />
      {/* Hat tip curl */}
      <circle cx={11} cy={-18} r={1.5} fill={hatColor} />
    </g>
  );
}

// ============================================================
// CLERIC BODY — Vestments, healing staff, hood/veil
// ============================================================

interface ClericProps {
  healGlow: number;   // 0-1 heal pulse intensity
  armRaise: number;
  eyeScaleY: number;
}

function ClericBody({ healGlow, armRaise, eyeScaleY }: ClericProps) {
  const vestment = '#dd88bb';
  const vestDk = '#bb6699';
  const vestLt = '#ffaadd';
  const hoodColor = '#cc77aa';
  const hoodDk = '#aa5588';
  const leath = '#5a4a3a';
  const leathDk = '#3a2a1a';
  const healColor = '#4aff4a';
  const healLt = '#aaffaa';
  const eyeTransform = eyeScaleY !== 1 ? `translate(10, 2) scale(1, ${eyeScaleY}) translate(-10, -2)` : undefined;
  const orbR = 3.5 + healGlow * 1.5;

  return (
    <g>
      <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
      {/* Healing aura */}
      {healGlow > 0.3 && (
        <circle cx={10} cy={12} r={16} fill={healColor} opacity={0.06 * healGlow} />
      )}
      {/* Robe skirt */}
      <polygon points="2,14 0,24 4,24" fill={vestDk} />
      <polygon points="18,14 20,24 16,24" fill={vestDk} />
      {/* Vestment body */}
      <rect x={2} y={4} width={16} height={14} fill={vestment} rx={1} />
      <rect x={4} y={6} width={12} height={10} fill={vestLt} opacity={0.5} />
      {/* Cross emblem */}
      <rect x={8} y={8} width={4} height={1} fill="#fff" opacity={0.5} />
      <rect x={9} y={7} width={2} height={3} fill="#fff" opacity={0.5} />
      {/* Belt — golden sash */}
      <rect x={2} y={16} width={16} height={2} fill="#c8a83e" />
      <rect x={2} y={16} width={16} height={0.5} fill="#e8c85e" opacity={0.4} />
      {/* Left arm */}
      <rect x={-2} y={4 + armRaise} width={5} height={3} fill={vestment} rx={0.5} />
      <rect x={-2} y={6 + armRaise} width={3} height={2} fill={skin} rx={0.5} />
      {/* Right arm */}
      <rect x={17} y={4 - armRaise} width={5} height={3} fill={vestment} rx={0.5} />
      <rect x={19} y={6 - armRaise} width={3} height={2} fill={skin} rx={0.5} />
      {/* Staff */}
      <rect x={20} y={-6} width={3} height={26} fill="#8b7355" />
      <rect x={20} y={4} width={3} height={1} fill="#6a5a3a" opacity={0.5} />
      <rect x={20} y={8} width={3} height={1} fill="#6a5a3a" opacity={0.5} />
      {/* Healing orb */}
      <circle cx={21} cy={-8} r={orbR} fill={healColor} opacity={0.5 + healGlow * 0.4} />
      <circle cx={21} cy={-8} r={Math.max(1, orbR - 1.5)} fill={healLt} opacity={0.6} />
      <circle cx={20} cy={-9} r={0.8} fill="#fff" opacity={0.5} />
      {/* Heal flash */}
      {healGlow > 0.7 && <circle cx={21} cy={-8} r={orbR + 3} fill={healColor} opacity={0.3} />}
      {/* Legs */}
      <rect x={4} y={18} width={4} height={3} fill={leathDk} />
      <rect x={12} y={18} width={4} height={3} fill={leathDk} />
      <rect x={3} y={21} width={6} height={2} fill={leathDk} rx={1} />
      <rect x={11} y={21} width={6} height={2} fill={leathDk} rx={1} />
      {/* Head */}
      <rect x={4} y={0} width={12} height={6} fill={skin} rx={1} />
      <g transform={eyeTransform}>
        <rect x={6} y={2} width={2} height={2} fill="#333" />
        <rect x={12} y={2} width={2} height={2} fill="#333" />
      </g>
      {/* Hood / Veil */}
      <rect x={0} y={-4} width={20} height={8} fill={hoodColor} rx={1} />
      <rect x={2} y={-2} width={16} height={4} fill={hoodDk} opacity={0.5} />
      {/* Hood top */}
      <rect x={3} y={-6} width={14} height={4} fill={hoodColor} rx={2} />
      <rect x={5} y={-7} width={10} height={2} fill={hoodDk} opacity={0.3} rx={1} />
      {/* Holy circlet */}
      <rect x={4} y={-4} width={12} height={1.5} fill="#c8a83e" rx={0.5} />
      <circle cx={10} cy={-3.5} r={1} fill="#e8c85e" />
    </g>
  );
}

// ============================================================
// CONJURER BODY — Stone mage, orbiting crystals, archaic robe
// ============================================================

interface ConjurerProps {
  crystalAngle: number;  // radians for orbiting crystal positions
  armRaise: number;
  eyeScaleY: number;
  channelPulse: number;
}

function ConjurerBody({ crystalAngle, armRaise, eyeScaleY, channelPulse }: ConjurerProps) {
  const robe = '#dd8833';
  const robeDk = '#aa6622';
  const hood = '#44aa88';
  const hoodDk = '#338866';
  const crystal = '#55ddcc';
  const crystalGlow = '#88ffee';
  const leath = '#5a4a3a';
  const eyeTransform = eyeScaleY !== 1 ? `translate(10, -1) scale(1, ${eyeScaleY}) translate(-10, 1)` : undefined;
  const s1x = 10 + Math.sin(crystalAngle) * 14;
  const s1y = 4 + Math.cos(crystalAngle) * 8;
  const s2x = 10 + Math.sin(crystalAngle + 2.1) * 12;
  const s2y = 6 + Math.cos(crystalAngle + 2.1) * 6;
  const s3x = 10 + Math.sin(crystalAngle + 4.2) * 13;
  const s3y = 2 + Math.cos(crystalAngle + 4.2) * 7;

  return (
    <g>
      <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
      {/* Ground ring */}
      <ellipse cx={10} cy={24} rx={12} ry={4} fill={crystal} opacity={0.06 + channelPulse * 0.08} />
      {/* Robe */}
      <rect x={1} y={4} width={18} height={16} fill={robe} rx={1} />
      <rect x={3} y={6} width={14} height={12} fill={robeDk} opacity={0.6} />
      <rect x={1} y={18} width={18} height={2} fill={hood} />
      <rect x={9} y={6} width={2} height={12} fill={hood} opacity={0.5} />
      {/* Belt */}
      <rect x={2} y={14} width={16} height={3} fill="#7a6a4a" />
      <rect x={6} y={14} width={3} height={3} fill={crystal} opacity={0.8} />
      <rect x={11} y={14} width={3} height={3} fill="#dd6633" opacity={0.8} />
      {/* Arms channeling */}
      <rect x={-4} y={4 + armRaise} width={6} height={3} fill={robe} rx={0.5} />
      <rect x={-4} y={5 + armRaise} width={3} height={2} fill={skin} rx={0.5} />
      <rect x={18} y={4 - armRaise} width={6} height={3} fill={robe} rx={0.5} />
      <rect x={21} y={5 - armRaise} width={3} height={2} fill={skin} rx={0.5} />
      {/* Head */}
      <rect x={3} y={-3} width={14} height={8} fill={skin} rx={1} />
      <g transform={eyeTransform}>
        <rect x={5} y={-1} width={2} height={2} fill="#333" />
        <rect x={13} y={-1} width={2} height={2} fill="#333" />
      </g>
      <rect x={4} y={-2} width={4} height={1} fill="#888" />
      <rect x={12} y={-2} width={4} height={1} fill="#888" />
      {/* Beard */}
      <rect x={6} y={4} width={8} height={3} fill="#aaa" />
      <rect x={8} y={6} width={4} height={2} fill="#999" />
      {/* Hood */}
      <path d="M0,-6 Q2,-12 10,-14 Q18,-12 20,-6 L20,-2 L0,-2 Z" fill={hood} />
      <path d="M2,-5 Q4,-10 10,-12 Q16,-10 18,-5 L18,-2 L2,-2 Z" fill={hoodDk} opacity={0.5} />
      {/* Circlet */}
      <rect x={2} y={-6} width={16} height={2} fill="#8a7a5a" />
      <rect x={5} y={-7} width={3} height={3} fill="#ff8844" />
      <rect x={12} y={-7} width={3} height={3} fill={crystal} />
      {/* Crystals */}
      <polygon points={`${s1x},${s1y - 4} ${s1x - 2.5},${s1y} ${s1x},${s1y + 4} ${s1x + 2.5},${s1y}`} fill={crystal} opacity={0.8} />
      <polygon points={`${s2x},${s2y - 3} ${s2x - 2},${s2y} ${s2x},${s2y + 3} ${s2x + 2},${s2y}`} fill="#ff8844" opacity={0.7} />
      <polygon points={`${s3x},${s3y - 3.5} ${s3x - 2},${s3y} ${s3x},${s3y + 3.5} ${s3x + 2},${s3y}`} fill={crystalGlow} opacity={0.6} />
      <circle cx={s1x} cy={s1y} r={3} fill={crystalGlow} opacity={0.15} />
      {/* Legs */}
      <rect x={4} y={20} width={4} height={2} fill="#5a4a3a" />
      <rect x={12} y={20} width={4} height={2} fill="#5a4a3a" />
      <rect x={3} y={22} width={6} height={2} fill={leath} rx={1} />
      <rect x={11} y={22} width={6} height={2} fill={leath} rx={1} />
    </g>
  );
}

// ============================================================
// BOMBARD BODY — Hand-cannon, heavy armor, ammo belt
// ============================================================

interface BombardProps {
  recoil: number;
  fuseOn: boolean;
  eyeScaleY: number;
  flashOpacity: number;
}

function BombardBody({ recoil, fuseOn, eyeScaleY, flashOpacity }: BombardProps) {
  const armorGold = '#8b6914';
  const armorDk = '#6a5010';
  const met = '#666';
  const metLt = '#888';
  const eyeTransform = eyeScaleY !== 1 ? `translate(10, -2) scale(1, ${eyeScaleY}) translate(-10, 2)` : undefined;

  return (
    <g>
      <ellipse cx={10} cy={24} rx={8} ry={3} fill="rgba(0,0,0,0.3)" />
      {/* Body */}
      <rect x={3} y={4} width={14} height={14} fill={armorGold} rx={1} />
      <rect x={5} y={6} width={10} height={10} fill={armorDk} />
      {/* Shoulder plates */}
      <rect x={0} y={3} width={6} height={4} fill={met} rx={1} />
      <rect x={14} y={3} width={6} height={4} fill={met} rx={1} />
      {/* Ammo belt */}
      <rect x={2} y={15} width={16} height={3} fill="#5a4a2a" />
      <circle cx={6} cy={16} r={2} fill="#444" />
      <circle cx={10} cy={16} r={2} fill="#444" />
      <circle cx={14} cy={16} r={2} fill="#444" />
      {/* Hand-cannon */}
      <g transform={`translate(${-recoil}, 0)`}>
        <rect x={16} y={7} width={16} height={5} fill="#555" rx={1} />
        <rect x={17} y={8} width={14} height={3} fill="#444" />
        <rect x={30} y={6} width={3} height={7} fill="#666" rx={1} />
        {fuseOn && <circle cx={28} cy={6} r={1.5} fill="#ff8800" />}
        {fuseOn && <circle cx={28} cy={5} r={1} fill="#ffcc00" />}
      </g>
      {/* Firing flash */}
      {flashOpacity > 0 && (
        <>
          <circle cx={33 - recoil} cy={10} r={8} fill="#ff8800" opacity={flashOpacity * 0.4} />
          <circle cx={33 - recoil} cy={10} r={5} fill="#ffcc00" opacity={flashOpacity * 0.6} />
        </>
      )}
      {/* Head */}
      <rect x={4} y={-4} width={12} height={8} fill={skin} rx={1} />
      <g transform={eyeTransform}>
        <rect x={5} y={-2} width={2} height={2} fill="#333" />
        <rect x={13} y={-2} width={2} height={2} fill="#333" />
      </g>
      {/* Helmet */}
      <rect x={2} y={-7} width={16} height={5} fill={met} rx={1} />
      <rect x={4} y={-8} width={12} height={3} fill={metLt} rx={1} />
      <rect x={2} y={-3} width={16} height={1} fill={metLt} />
      {/* Legs */}
      <rect x={4} y={18} width={4} height={4} fill="#4a3a2a" />
      <rect x={12} y={18} width={4} height={4} fill="#4a3a2a" />
      <rect x={3} y={22} width={6} height={2} fill="#3a2a1a" rx={1} />
      <rect x={11} y={22} width={6} height={2} fill="#3a2a1a" rx={1} />
    </g>
  );
}

// ============================================================
// SKELETON BODY — Risen bones, green glow, rusty sword
// ============================================================

interface SkeletonProps {
  swordOffset: number;
  eyePulse: number;   // 0-1 glow intensity cycle
  eyeScaleY: number;
}

function SkeletonBody({ swordOffset, eyePulse, eyeScaleY }: SkeletonProps) {
  const bone = '#ccc8bb';
  const boneDk = '#aaa898';
  const glow = '#44ff44';
  const eyeTransform = eyeScaleY !== 1 ? `translate(10, 3) scale(1, ${eyeScaleY}) translate(-10, -3)` : undefined;

  return (
    <g>
      {/* Ghostly aura */}
      <circle cx={10} cy={12} r={16} fill="#44ff88" opacity={0.05 + eyePulse * 0.03} />
      <ellipse cx={10} cy={26} rx={8} ry={3} fill="rgba(0,0,0,0.25)" />
      {/* Rib cage */}
      <rect x={4} y={6} width={12} height={12} fill={bone} rx={1} />
      <rect x={6} y={7} width={8} height={2} fill={boneDk} />
      <rect x={6} y={10} width={8} height={2} fill={boneDk} />
      <rect x={6} y={13} width={8} height={2} fill={boneDk} />
      {/* Skull */}
      <rect x={2} y={-2} width={16} height={10} fill={bone} rx={2} />
      <rect x={4} y={1} width={4} height={4} fill="#222" rx={0.5} />
      <rect x={12} y={1} width={4} height={4} fill="#222" rx={0.5} />
      <g transform={eyeTransform}>
        <circle cx={6} cy={3} r={1.5} fill={glow} opacity={0.5 + eyePulse * 0.4} />
        <circle cx={14} cy={3} r={1.5} fill={glow} opacity={0.5 + eyePulse * 0.4} />
      </g>
      {/* Jaw */}
      <rect x={6} y={6} width={8} height={3} fill={boneDk} rx={0.5} />
      <rect x={7} y={7} width={2} height={1} fill="#444" />
      <rect x={11} y={7} width={2} height={1} fill="#444" />
      {/* Rusty sword */}
      <rect x={16 + swordOffset} y={-2} width={2} height={16} fill="#7a6a55" />
      <rect x={14 + swordOffset} y={-4} width={6} height={4} fill="#887766" />
      {swordOffset > 4 && (
        <line x1={18 + swordOffset} y1={-4} x2={24 + swordOffset} y2={8} stroke={glow} strokeWidth={2} opacity={0.5} strokeLinecap="round" />
      )}
      {/* Bony legs */}
      <rect x={5} y={18} width={3} height={5} fill={boneDk} />
      <rect x={12} y={18} width={3} height={5} fill={boneDk} />
      <rect x={4} y={23} width={5} height={2} fill={bone} rx={0.5} />
      <rect x={11} y={23} width={5} height={2} fill={bone} rx={0.5} />
      {/* Green wisps */}
      <circle cx={2} cy={-4} r={1} fill="#44ff88" opacity={0.2 + eyePulse * 0.15} />
      <circle cx={18} cy={-2} r={1} fill="#44ff88" opacity={0.15 + eyePulse * 0.1} />
    </g>
  );
}

// ============================================================
// RENDER HELPER
// ============================================================

function renderAllyPose(body: JSX.Element): string {
  const markup = renderToStaticMarkup(body);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VB_X} ${VB_Y} ${VB_W} ${VB_H}">${markup}</svg>`;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

// ============================================================
// CACHE
// ============================================================

export interface AllySpriteSet {
  idle: string[];
  attack: string[];
}

export interface AllySpriteCache {
  soldier: AllySpriteSet;
  archer: AllySpriteSet;
  knight: AllySpriteSet;
  halberd: AllySpriteSet;
  wizard: AllySpriteSet;
  cleric: AllySpriteSet;
  conjurer: AllySpriteSet;
  bombard: AllySpriteSet;
  skeleton: AllySpriteSet;
}

let cache: AllySpriteCache | null = null;

export const ALLY_VB_X = VB_X;
export const ALLY_VB_Y = VB_Y;
export const ALLY_VB_W = VB_W;
export const ALLY_VB_H = VB_H;

export function initAllySpriteCache(): AllySpriteCache {
  if (cache) return cache;

  // --- Soldier ---
  const soldierIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    soldierIdle.push(renderAllyPose(
      <SoldierBody swordAngle={0} armRot={IDLE_ARM[i]} eyeScaleY={IDLE_EYE[i]} capeSkew={IDLE_CAPE[i]} />
    ));
  }
  // Swipe: wind up slightly back, then swing forward, then recover
  const SOLDIER_SWING = [-10, 15, 45, 75, 90, 65, 30, 5];
  const soldierAtk = SOLDIER_SWING.map(angle =>
    renderAllyPose(<SoldierBody swordAngle={angle} armRot={0} eyeScaleY={1} capeSkew={0} />)
  );

  // --- Archer ---
  const archerIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    archerIdle.push(renderAllyPose(
      <ArcherBody stringPull={0} armRot={IDLE_ARM[i]} eyeScaleY={IDLE_EYE[i]} showArrow={false} releaseFlash={false} />
    ));
  }
  const ARCHER_PULL = [7, 6, 5, 4, 3, 2, 1, 0];
  const archerAtk = ARCHER_PULL.map((pull, i) =>
    renderAllyPose(<ArcherBody stringPull={pull} armRot={0} eyeScaleY={1} showArrow={i < 7} releaseFlash={i === 7} />)
  );

  // --- Knight ---
  const knightIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    knightIdle.push(renderAllyPose(
      <KnightBody swordAngle={IDLE_ARM[i]} shieldRot={-IDLE_ARM[i] * 0.5} capeSkew={IDLE_CAPE[i]} eyeScaleY={IDLE_EYE[i]} />
    ));
  }
  const KNIGHT_SWING = [5, 20, 40, 15, -20, -10, -5, 0];
  const knightAtk = KNIGHT_SWING.map((angle, i) =>
    renderAllyPose(<KnightBody swordAngle={angle} shieldRot={-3} capeSkew={2} eyeScaleY={1} />)
  );

  // --- Halberd ---
  const halberdIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    halberdIdle.push(renderAllyPose(
      <HalberdBody thrustExtend={0} armRot={IDLE_ARM[i]} eyeScaleY={IDLE_EYE[i]} />
    ));
  }
  // Stab animation: pull back → thrust forward → hold → retract
  const HALBERD_THRUST = [-2, -1, 2, 6, 10, 8, 4, 1];
  const halberdAtk = HALBERD_THRUST.map(extend =>
    renderAllyPose(<HalberdBody thrustExtend={extend} armRot={0} eyeScaleY={1} />)
  );

  // --- Wizard ---
  const wizardIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    const pulse = Math.sin(i / ALLY_IDLE_FRAME_COUNT * Math.PI * 2) * 0.5 + 0.5;
    const arm = Math.sin(i / ALLY_IDLE_FRAME_COUNT * Math.PI * 2) * 1.5;
    wizardIdle.push(renderAllyPose(
      <WizardBody orbPulse={pulse * 0.3} armRaise={arm} eyeScaleY={IDLE_EYE[i]} />
    ));
  }
  const wizardAtk = [0, 0.2, 0.5, 0.8, 1.0, 0.8, 0.5, 0.2].map((pulse, i) =>
    renderAllyPose(<WizardBody orbPulse={pulse} armRaise={i < 4 ? -2 : 0} eyeScaleY={1} />)
  );

  // --- Cleric ---
  const clericIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    const pulse = Math.sin(i / ALLY_IDLE_FRAME_COUNT * Math.PI * 2) * 0.5 + 0.5;
    const arm = Math.sin(i / ALLY_IDLE_FRAME_COUNT * Math.PI * 2) * 1;
    clericIdle.push(renderAllyPose(
      <ClericBody healGlow={pulse * 0.2} armRaise={arm} eyeScaleY={IDLE_EYE[i]} />
    ));
  }
  const clericAtk = [0, 0.3, 0.6, 1.0, 0.8, 0.5, 0.3, 0.1].map(glow =>
    renderAllyPose(<ClericBody healGlow={glow} armRaise={glow > 0.5 ? -1.5 : 0} eyeScaleY={1} />)
  );

  // --- Conjurer ---
  const conjurerIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    const angle = (i / ALLY_IDLE_FRAME_COUNT) * Math.PI * 2;
    const arm = Math.sin(angle) * 1.5;
    conjurerIdle.push(renderAllyPose(
      <ConjurerBody crystalAngle={angle} armRaise={arm} eyeScaleY={IDLE_EYE[i]} channelPulse={0.3} />
    ));
  }
  const conjurerAtk = [0, 1, 2, 3, 4, 5, 6, 7].map(i => {
    const angle = (i / 8) * Math.PI * 2;
    return renderAllyPose(
      <ConjurerBody crystalAngle={angle} armRaise={-2} eyeScaleY={1} channelPulse={0.8} />
    );
  });

  // --- Bombard ---
  const bombardIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    const fuse = i % 4 < 2;
    bombardIdle.push(renderAllyPose(
      <BombardBody recoil={0} fuseOn={fuse} eyeScaleY={IDLE_EYE[i]} flashOpacity={0} />
    ));
  }
  const bombardAtk = [0, 2, 5, 6, 4, 2, 1, 0].map((rec, i) =>
    renderAllyPose(<BombardBody recoil={rec} fuseOn={true} eyeScaleY={1} flashOpacity={i < 3 ? 1 - i * 0.3 : 0} />)
  );

  // --- Skeleton ---
  const skeletonIdle: string[] = [];
  for (let i = 0; i < ALLY_IDLE_FRAME_COUNT; i++) {
    const pulse = Math.sin(i / ALLY_IDLE_FRAME_COUNT * Math.PI * 2) * 0.5 + 0.5;
    skeletonIdle.push(renderAllyPose(
      <SkeletonBody swordOffset={0} eyePulse={pulse} eyeScaleY={IDLE_EYE[i]} />
    ));
  }
  const skeletonAtk = [0, 2, 4, 6, 8, 6, 4, 2].map((offset, i) => {
    const pulse = i < 4 ? 0.8 : 0.4;
    return renderAllyPose(<SkeletonBody swordOffset={offset} eyePulse={pulse} eyeScaleY={1} />);
  });

  cache = {
    soldier: { idle: soldierIdle, attack: soldierAtk },
    archer: { idle: archerIdle, attack: archerAtk },
    knight: { idle: knightIdle, attack: knightAtk },
    halberd: { idle: halberdIdle, attack: halberdAtk },
    wizard: { idle: wizardIdle, attack: wizardAtk },
    cleric: { idle: clericIdle, attack: clericAtk },
    conjurer: { idle: conjurerIdle, attack: conjurerAtk },
    bombard: { idle: bombardIdle, attack: bombardAtk },
    skeleton: { idle: skeletonIdle, attack: skeletonAtk },
  };

  return cache;
}
