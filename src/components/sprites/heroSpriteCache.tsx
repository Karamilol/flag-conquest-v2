import { renderToStaticMarkup } from 'react-dom/server';

// ============================================================
// HERO SPRITE CACHE — Pre-renders Warlord & Ranger hero poses
// as SVG blob URLs. Replaces 80+ live SVG elements per hero
// with a single <image> tag. Same approach as goblinSpriteCache.
// ============================================================

// --- Warlord ViewBox ---
const W_VB_X = -12;
const W_VB_Y = -22;
const W_VB_W = 58;
const W_VB_H = 66;

// --- Ranger ViewBox ---
const R_VB_X = -16;
const R_VB_Y = -14;
const R_VB_W = 56;
const R_VB_H = 56;

// Sword swing angles per attackCooldown frame (5=start -> 0=end)
const SWING_ANGLES = [10, 35, 55, 15, -30, -20];

export const HERO_IDLE_FRAME_COUNT = 8;

// --- Warlord Colors ---
const armor = '#3a5a9f';
const armorLight = '#4a6abf';
const armorDark = '#2a3a6f';
const cape = '#8b2222';
const capeDark = '#6b1111';
const crest = '#cc3333';
const metal = '#8a8a9a';
const metalLight = '#aaaabc';
const metalDark = '#5a5a6a';
const skin = '#f0c8a0';
const eyeColor = '#4af';
const gold = '#c8a83e';
const goldLight = '#e8c85e';
const leather = '#5a4a3a';
const leatherDark = '#3a2a1a';

// --- Ranger Colors ---
const rHood = '#2a4a2a';
const rHoodDark = '#1a3a1a';
const rHoodLight = '#3a5a3a';
const rCloak = '#3a5a3a';
const rCloakDark = '#2a4a2a';
const rLeather = '#5a4a3a';
const rLeatherDark = '#3a2a1a';
const rLeatherLight = '#6a5a4a';
const rBowWood = '#8b5a2a';
const rBowLight = '#a87040';
const rString = '#bbb';
const rSkin = '#e8c0a0';
const rMetal = '#888';

// ============================================================
// WARLORD BODY
// ============================================================

interface WarlordProps {
  weaponAngle: number;
  capeSkew: number;
  shieldRot: number;
  eyeScaleY: number;
  plumeSkew: number;
  showSlash: boolean;
  slashOpacity: number;
}

function WarlordBody({ weaponAngle, capeSkew, shieldRot, eyeScaleY, plumeSkew, showSlash, slashOpacity }: WarlordProps) {
  const capeTransform = capeSkew !== 0 ? `translate(5, 6) skewX(${capeSkew}) translate(-5, -6)` : undefined;
  const shieldTransform = shieldRot !== 0 ? `translate(6, 5) rotate(${shieldRot}) translate(-6, -5)` : undefined;
  const eyeTransform = eyeScaleY !== 1 ? `translate(16, 2) scale(1, ${eyeScaleY}) translate(-16, -2)` : undefined;
  const plumeTransform = plumeSkew !== 0 ? `translate(15.5, -7) skewX(${plumeSkew}) translate(-15.5, 7)` : undefined;

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={16} cy={36} rx={14} ry={4} fill="rgba(0,0,0,0.25)" />

      {/* Cape */}
      <g transform={capeTransform}>
        <polygon points="6,6 3,34 -1,36 0,32 4,10" fill={cape} />
        <polygon points="8,6 5,33 3,34 6,10" fill={capeDark} />
        <polygon points="5,12 3,28 4,28 6,12" fill={cape} opacity={0.6} />
        <polygon points="3,32 -1,36 1,35 4,33" fill={capeDark} opacity={0.8} />
        <polygon points="1,34 -2,37 0,36 2,34" fill={cape} opacity={0.5} />
      </g>

      {/* Back Leg */}
      <g>
        <rect x={9} y={26} width={6} height={5} fill={metalDark} />
        <rect x={8} y={30} width={7} height={3} fill={metal} rx={1} />
        <rect x={9} y={32} width={6} height={4} fill={metalDark} />
        <rect x={8} y={35} width={8} height={3} fill={leatherDark} rx={1} />
        <rect x={14} y={36} width={3} height={2} fill={leatherDark} rx={1} />
      </g>

      {/* Torso */}
      <g>
        {/* Gorget */}
        <rect x={10} y={4} width={12} height={4} fill={metal} rx={1} />
        {/* Main armor */}
        <rect x={7} y={7} width={18} height={16} fill={armor} rx={1} />
        <rect x={14} y={8} width={4} height={12} fill={armorLight} rx={1} />
        {/* Diamond */}
        <polygon points="16,10 19,14 16,18 13,14" fill={armorLight} opacity={0.5} />
        <polygon points="16,11 18,14 16,17 14,14" fill={armor} opacity={0.7} />
        {/* Highlight / shadow */}
        <rect x={7} y={7} width={18} height={1} fill={armorLight} opacity={0.4} />
        <rect x={7} y={22} width={18} height={1} fill={armorDark} opacity={0.5} />
        {/* Rivets */}
        <circle cx={9} cy={9} r={0.8} fill={metalLight} />
        <circle cx={23} cy={9} r={0.8} fill={metalLight} />
        <circle cx={9} cy={20} r={0.8} fill={metalLight} />
        <circle cx={23} cy={20} r={0.8} fill={metalLight} />
        {/* Belt */}
        <rect x={6} y={23} width={20} height={3} fill={leather} />
        <rect x={14} y={23} width={4} height={3} fill={gold} rx={1} />
        <rect x={15} y={23.5} width={2} height={2} fill={goldLight} />
        <rect x={7} y={23} width={4} height={3} fill={leatherDark} rx={1} />
        <rect x={21} y={23} width={4} height={3} fill={leatherDark} rx={1} />
      </g>

      {/* Front Leg */}
      <g>
        <rect x={17} y={26} width={6} height={5} fill={metal} />
        <rect x={16} y={30} width={7} height={3} fill={metalLight} rx={1} />
        <circle cx={19.5} cy={31.5} r={1.5} fill={metal} />
        <rect x={17} y={32} width={6} height={4} fill={metal} />
        <rect x={19} y={32} width={1} height={4} fill={metalLight} opacity={0.5} />
        <rect x={16} y={35} width={8} height={3} fill={leather} rx={1} />
        <rect x={22} y={36} width={3} height={2} fill={leather} rx={1} />
        <rect x={23} y={36} width={2} height={2} fill={metalDark} rx={1} />
      </g>

      {/* Shield Arm */}
      <g transform={shieldTransform}>
        {/* Pauldron */}
        <rect x={0} y={5} width={10} height={5} fill={metal} rx={2} />
        <rect x={1} y={6} width={8} height={3} fill={metalLight} rx={1} />
        <rect x={2} y={7} width={6} height={2} fill={metalDark} rx={1} />
        {/* Upper arm */}
        <rect x={2} y={10} width={6} height={5} fill={armor} />
        {/* Forearm / gauntlet */}
        <rect x={1} y={14} width={7} height={5} fill={metal} rx={1} />
        <rect x={2} y={15} width={5} height={1} fill={metalLight} opacity={0.4} />
        <rect x={2} y={17} width={5} height={1} fill={metalLight} opacity={0.4} />
        {/* Shield */}
        <polygon points="-6,8 -6,22 -1,26 6,22 6,8" fill={armor} />
        <polygon points="-5,9 -5,21 -1,24 5,21 5,9" fill={armorLight} />
        <rect x={-2} y={12} width={4} height={1} fill={gold} />
        <rect x={-1} y={10} width={2} height={6} fill={gold} />
        <line x1={-6} y1={8} x2={6} y2={8} stroke={metalLight} strokeWidth={0.8} opacity={0.5} />
        <line x1={-3} y1={14} x2={-1} y2={18} stroke={armorDark} strokeWidth={0.6} opacity={0.4} />
        <line x1={3} y1={11} x2={4} y2={13} stroke={armorDark} strokeWidth={0.5} opacity={0.3} />
      </g>

      {/* Weapon Arm — rotated around shoulder (26, 6) */}
      <g transform={`translate(26, 6) rotate(${weaponAngle}) translate(-26, -6)`}>
        <g>
          {/* Pauldron */}
          <rect x={22} y={5} width={10} height={5} fill={metal} rx={2} />
          <rect x={23} y={6} width={8} height={3} fill={metalLight} rx={1} />
          <rect x={24} y={7} width={6} height={2} fill={metalDark} rx={1} />
          {/* Upper arm */}
          <rect x={24} y={10} width={6} height={5} fill={armor} />
          {/* Forearm / gauntlet */}
          <rect x={24} y={14} width={7} height={5} fill={metal} rx={1} />
          <rect x={25} y={15} width={5} height={1} fill={metalLight} opacity={0.4} />
          {/* Hand */}
          <rect x={28} y={8} width={4} height={4} fill={skin} rx={1} />
          {/* Pommel */}
          <circle cx={30} cy={20} r={2} fill={gold} />
          <circle cx={30} cy={20} r={1} fill={goldLight} />
          {/* Grip */}
          <rect x={29} y={12} width={3} height={8} fill={leather} rx={0.5} />
          <rect x={29} y={13} width={3} height={1} fill={leatherDark} opacity={0.5} />
          <rect x={29} y={15} width={3} height={1} fill={leatherDark} opacity={0.5} />
          <rect x={29} y={17} width={3} height={1} fill={leatherDark} opacity={0.5} />
          {/* Crossguard */}
          <rect x={25} y={10} width={11} height={3} fill={gold} rx={1} />
          <rect x={26} y={11} width={9} height={1} fill={goldLight} />
          {/* Blade */}
          <rect x={28} y={-12} width={5} height={22} fill={metalLight} />
          <rect x={29.5} y={-10} width={2} height={18} fill={metal} />
          <rect x={28} y={-12} width={1} height={22} fill="#ccd" opacity={0.6} />
          <rect x={32} y={-12} width={1} height={22} fill="#dde" opacity={0.4} />
          {/* Blade tip */}
          <polygon points="28,-12 33,-12 30.5,-16" fill={metalLight} />
          <polygon points="29,-12 32,-12 30.5,-15" fill="#dde" opacity={0.4} />
        </g>
      </g>

      {/* Slash Trail */}
      {showSlash && (
        <g opacity={slashOpacity}>
          <g transform={`translate(26, 6) rotate(${weaponAngle}) translate(-26, -6)`}>
            <line x1={30} y1={-14} x2={32} y2={-18} stroke="#fff" strokeWidth={3} opacity={0.8} strokeLinecap="round" />
            <line x1={29} y1={-12} x2={33} y2={-17} stroke={armorLight} strokeWidth={1.5} opacity={0.5} strokeLinecap="round" />
          </g>
          <path d="M 38 -8 Q 42 6, 36 18" fill="none" stroke="#fff" strokeWidth={2.5} opacity={0.4} strokeLinecap="round" />
          <path d="M 36 -6 Q 40 6, 34 16" fill="none" stroke={armorLight} strokeWidth={1.5} opacity={0.25} strokeLinecap="round" />
        </g>
      )}

      {/* Head + Helmet */}
      <g>
        {/* Face */}
        <rect x={8} y={-1} width={16} height={8} fill={skin} rx={1} />
        {/* Eyes */}
        <g transform={eyeTransform}>
          <rect x={11} y={1} width={3} height={2} fill={eyeColor} />
          <rect x={18} y={1} width={3} height={2} fill={eyeColor} />
          <rect x={11} y={1} width={3} height={2} fill="#fff" opacity={0.3} />
          <rect x={18} y={1} width={3} height={2} fill="#fff" opacity={0.3} />
        </g>
        {/* Helmet body */}
        <rect x={6} y={-4} width={20} height={8} fill={metal} rx={2} />
        <rect x={8} y={-7} width={16} height={5} fill={metalLight} rx={2} />
        <rect x={6} y={-1} width={20} height={3} fill={metalDark} />
        {/* Visor slit */}
        <rect x={10} y={0} width={12} height={1.5} fill="#1a1a2e" />
        <rect x={15} y={-1} width={2} height={4} fill="#1a1a2e" />
        {/* Rivets */}
        <circle cx={8} cy={-2} r={0.7} fill={metalLight} />
        <circle cx={24} cy={-2} r={0.7} fill={metalLight} />
        <circle cx={12} cy={-5} r={0.7} fill={metalLight} />
        <circle cx={20} cy={-5} r={0.7} fill={metalLight} />
        {/* Helmet band */}
        <rect x={7} y={-4} width={18} height={2} fill={metal} rx={1} />
        <rect x={8} y={-4} width={16} height={1} fill={metalLight} opacity={0.3} />
        {/* Wing spikes */}
        <polygon points="7,-3 3,-6 6,-1" fill={metalDark} />
        <polygon points="25,-3 29,-6 26,-1" fill={metalDark} />
        {/* Plume */}
        <g transform={plumeTransform}>
          <rect x={13} y={-9} width={6} height={3} fill={crest} rx={1} />
          <rect x={12} y={-14} width={4} height={6} fill={crest} rx={1} />
          <rect x={14} y={-17} width={4} height={9} fill={crest} rx={1} />
          <rect x={16} y={-15} width={3} height={7} fill={crest} rx={1} />
          <rect x={13} y={-13} width={2} height={4} fill="#dd5555" opacity={0.5} />
          <rect x={15} y={-16} width={2} height={6} fill="#dd5555" opacity={0.4} />
        </g>
      </g>
    </g>
  );
}

// ============================================================
// RANGER BODY — detailed forest ranger with ornate longbow
// ============================================================

interface RangerProps {
  stringPull: number;   // 0 = rest, 7 = full draw
  capeSkew: number;
  eyeScaleY: number;
  showArrow: boolean;
  releaseFlash: boolean;
}

function RangerBody({ stringPull, capeSkew, eyeScaleY, showArrow, releaseFlash }: RangerProps) {
  const capeTransform = capeSkew !== 0 ? `translate(18, 8) skewX(${capeSkew}) translate(-18, -8)` : undefined;
  const eyeTransform = eyeScaleY !== 1 ? `translate(14, 2) scale(1, ${eyeScaleY}) translate(-14, -2)` : undefined;

  // Bow geometry
  const bowX = 26;
  const bowTopY = 0;
  const bowBotY = 24;
  const stringMidX = bowX - stringPull;
  const stringMidY = 12;

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={14} cy={34} rx={12} ry={3.5} fill="rgba(0,0,0,0.25)" />

      {/* Cloak tail */}
      <g transform={capeTransform}>
        <polygon points="4,8 0,32 -2,34 6,10" fill={rCloakDark} />
        <polygon points="5,8 1,31 0,33 6,10" fill={rCloak} opacity={0.7} />
        <polygon points="1,30 -2,34 0,33 2,31" fill={rCloakDark} opacity={0.6} />
      </g>

      {/* Quiver on back */}
      <rect x={-2} y={2} width={5} height={16} fill="#4a3a2a" rx={1} />
      <rect x={2} y={2} width={1} height={16} fill={rLeatherDark} rx={0.5} />
      {/* Quiver strap */}
      <line x1={0} y1={2} x2={12} y2={8} stroke={rLeather} strokeWidth={1.5} />
      <line x1={0} y1={2} x2={12} y2={8} stroke={rLeatherLight} strokeWidth={0.5} opacity={0.4} />
      {/* Arrow shafts */}
      <line x1={-1} y1={2} x2={-1.5} y2={-5} stroke={rBowWood} strokeWidth={1} />
      <line x1={0.5} y1={2} x2={0} y2={-6} stroke={rBowWood} strokeWidth={1} />
      <line x1={2} y1={2} x2={2} y2={-4.5} stroke={rBowWood} strokeWidth={1} />
      {/* Fletchings */}
      <polygon points="-2,-5 -1.5,-5 -1,-7 -2,-6.5" fill="#888" opacity={0.7} />
      <polygon points="0,-6 0.5,-6 1,-8 0,-7.5" fill="#888" opacity={0.7} />
      <polygon points="1.5,-4.5 2,-4.5 2.5,-6.5 1.5,-6" fill="#888" opacity={0.7} />

      {/* Back Leg */}
      <g>
        <rect x={7} y={20} width={5} height={6} fill={rCloakDark} />
        <rect x={6} y={25} width={6} height={3} fill={rLeather} rx={1} />
        <rect x={6} y={27} width={7} height={2} fill={rLeatherDark} rx={1} />
        <line x1={6} y1={26} x2={12} y2={25} stroke={rLeatherLight} strokeWidth={0.5} opacity={0.4} />
      </g>

      {/* Torso — layered leather */}
      <g>
        <rect x={4} y={6} width={16} height={14} fill={rCloak} rx={1} />
        <rect x={5} y={7} width={14} height={12} fill={rLeather} opacity={0.6} />
        {/* Stitching */}
        <line x1={12} y1={7} x2={12} y2={19} stroke={rLeatherDark} strokeWidth={0.8} opacity={0.4} />
        {/* Leather texture */}
        <rect x={6} y={9} width={5} height={1} fill={rLeatherLight} opacity={0.15} />
        <rect x={6} y={12} width={5} height={1} fill={rLeatherLight} opacity={0.15} />
        <rect x={13} y={10} width={5} height={1} fill={rLeatherLight} opacity={0.15} />
        <rect x={13} y={13} width={5} height={1} fill={rLeatherLight} opacity={0.15} />
        {/* Belt */}
        <rect x={3} y={18} width={18} height={2.5} fill={rLeather} />
        <rect x={3} y={18} width={18} height={0.5} fill={rLeatherLight} opacity={0.3} />
        <rect x={10} y={18} width={4} height={2.5} fill={rMetal} rx={0.5} />
        {/* Belt pouches */}
        <rect x={5} y={18.5} width={3} height={2} fill={rLeatherDark} rx={0.5} />
        <rect x={16} y={18.5} width={3} height={2} fill={rLeatherDark} rx={0.5} />
      </g>

      {/* Front Leg */}
      <g>
        <rect x={13} y={20} width={5} height={6} fill={rCloak} />
        <rect x={13} y={21} width={5} height={2.5} fill={rLeather} rx={0.5} />
        <rect x={12} y={25} width={6} height={3} fill={rLeather} rx={1} />
        <rect x={12} y={27} width={7} height={2} fill={rLeatherDark} rx={1} />
        <rect x={17} y={28} width={2} height={1} fill={rLeatherDark} rx={0.5} />
      </g>

      {/* Draw Arm (right — pulls string) */}
      <g>
        <rect x={16} y={5} width={5} height={4} fill={rCloak} rx={1} />
        <rect x={16} y={8} width={4} height={5} fill={rCloak} />
        <rect x={17} y={11} width={4} height={3} fill={rLeather} rx={0.5} />
        {showArrow ? (
          <rect x={stringMidX - 1} y={stringMidY - 1} width={3} height={3} fill={rLeatherDark} rx={0.5} />
        ) : (
          <rect x={17} y={14} width={3} height={2} fill={rSkin} rx={0.5} />
        )}
      </g>

      {/* Bow Arm (left) */}
      <g>
        <rect x={4} y={5} width={5} height={4} fill={rCloak} rx={1} />
        <rect x={2} y={8} width={5} height={5} fill={rCloakDark} />
        {/* Bracer */}
        <rect x={1} y={11} width={5} height={3} fill={rLeather} rx={0.5} />
        <rect x={1} y={12} width={5} height={0.8} fill={rLeatherLight} opacity={0.3} />
        {/* Metal stud */}
        <circle cx={3.5} cy={12.5} r={0.6} fill={rMetal} />
        {/* Hand */}
        <rect x={0} y={10} width={3} height={4} fill={rSkin} rx={0.5} />
      </g>

      {/* Longbow — curved limbs */}
      <path
        d={`M${bowX},${bowTopY} C${bowX + 6},${bowTopY + 6} ${bowX + 6},${bowBotY - 6} ${bowX},${bowBotY}`}
        fill="none" stroke={rBowWood} strokeWidth={2.5} strokeLinecap="round"
      />
      <path
        d={`M${bowX},${bowTopY + 1} C${bowX + 5},${bowTopY + 6} ${bowX + 5},${bowBotY - 6} ${bowX},${bowBotY - 1}`}
        fill="none" stroke={rBowLight} strokeWidth={0.8} opacity={0.4}
      />
      {/* Grip wrap */}
      <rect x={bowX - 1} y={10} width={4} height={4} fill={rLeather} rx={1} />
      <line x1={bowX - 1} y1={11} x2={bowX + 3} y2={10.5} stroke={rLeatherDark} strokeWidth={0.5} opacity={0.5} />
      <line x1={bowX - 1} y1={12.5} x2={bowX + 3} y2={12} stroke={rLeatherDark} strokeWidth={0.5} opacity={0.5} />
      {/* Nock tips */}
      <circle cx={bowX} cy={bowTopY} r={1} fill={rBowWood} />
      <circle cx={bowX} cy={bowBotY} r={1} fill={rBowWood} />
      {/* Decorative tip wraps */}
      <rect x={bowX - 1} y={bowTopY - 1} width={2} height={2} fill={rLeatherDark} rx={0.5} />
      <rect x={bowX - 1} y={bowBotY - 1} width={2} height={2} fill={rLeatherDark} rx={0.5} />

      {/* Bowstring */}
      <line x1={bowX} y1={bowTopY} x2={stringMidX} y2={stringMidY} stroke={rString} strokeWidth={0.8} />
      <line x1={stringMidX} y1={stringMidY} x2={bowX} y2={bowBotY} stroke={rString} strokeWidth={0.8} />

      {/* Arrow nocked */}
      {showArrow && (
        <g>
          <line x1={stringMidX} y1={stringMidY} x2={bowX + 14} y2={12} stroke={rBowWood} strokeWidth={1.5} />
          <polygon points={`${bowX + 14},10.5 ${bowX + 14},13.5 ${bowX + 17},12`} fill={rMetal} />
          <polygon points={`${stringMidX - 1},11 ${stringMidX - 1},13 ${stringMidX + 2},12`} fill="#777" opacity={0.6} />
        </g>
      )}

      {/* Release flash */}
      {releaseFlash && (
        <circle cx={bowX + 14} cy={12} r={5} fill="#ffaa00" opacity={0.5} />
      )}

      {/* Head */}
      <g>
        {/* Face in shadow */}
        <rect x={5} y={-1} width={14} height={8} fill={rHoodDark} rx={1} />
        <rect x={7} y={2} width={10} height={4} fill={rSkin} opacity={0.3} rx={1} />

        {/* Hood */}
        <polygon points="3,-7 21,-7 23,1 19,5 3,5 1,1" fill={rHood} />
        <polygon points="5,-7 19,-7 17,-9 7,-9" fill={rHoodDark} />
        {/* Hood front overhang */}
        <polygon points="3,-1 21,-1 19,3 5,3" fill={rHood} opacity={0.85} />
        <rect x={3} y={-1} width={18} height={1.5} fill={rHoodDark} rx={0.5} />
        {/* Hood folds */}
        <line x1={5} y1={-6} x2={4} y2={2} stroke={rHoodDark} strokeWidth={0.8} opacity={0.5} />
        <line x1={19} y1={-6} x2={20} y2={2} stroke={rHoodDark} strokeWidth={0.8} opacity={0.5} />
        {/* Hood top highlight */}
        <rect x={8} y={-8} width={8} height={2} fill={rHoodLight} opacity={0.2} rx={1} />

        {/* Eyes under hood */}
        <g transform={eyeTransform}>
          <rect x={6} y={1} width={3} height={2} fill="#ffdd00" rx={0.5} />
          <rect x={15} y={1} width={3} height={2} fill="#ffdd00" rx={0.5} />
          <rect x={6} y={1} width={3} height={2} fill="#ffff44" opacity={0.3} rx={0.5} />
          <rect x={15} y={1} width={3} height={2} fill="#ffff44" opacity={0.3} rx={0.5} />
        </g>

        {/* Face wrap / mask */}
        <rect x={5} y={4} width={14} height={2.5} fill={rHoodDark} rx={1} />
        <line x1={5} y1={5} x2={19} y2={5} stroke={rHood} strokeWidth={0.5} opacity={0.3} />
      </g>
    </g>
  );
}

// ============================================================
// MAGE BODY — arcane spellcaster with staff and crystal orb
// ============================================================

// --- Mage ViewBox ---
const M_VB_X = -10;
const M_VB_Y = -22;
const M_VB_W = 56;
const M_VB_H = 66;

// --- Mage Colors ---
const mRobe = '#5a3a8a';
const mRobeLight = '#7a5aaa';
const mRobeDark = '#3a1a6a';
const mSash = '#cc9900';
const mSashLight = '#e8b830';
const mHat = '#4a2a7a';
const mHatDark = '#2a1050';
const mHatLight = '#6a4a9a';
const mStaffWood = '#6b4226';
const mStaffLight = '#8b6246';
const mCrystal = '#8855cc';
const mCrystalBright = '#aa77ee';
const mSkin = '#f0c8a0';
const mMetal = '#888';

interface MageProps {
  staffAngle: number;      // staff tilt
  robeSkew: number;        // robe flutter
  eyeScaleY: number;       // blink
  crystalGlow: number;     // 0-1
  castPhase: number;       // 0=none, 1-6=casting
  hatSkew: number;         // hat tip sway
}

function MageBody({ staffAngle, robeSkew, eyeScaleY, crystalGlow, castPhase, hatSkew }: MageProps) {
  const robeTransform = robeSkew !== 0 ? `translate(16, 28) skewX(${robeSkew}) translate(-16, -28)` : undefined;
  const eyeTransform = eyeScaleY !== 1 ? `translate(16, 2) scale(1, ${eyeScaleY}) translate(-16, -2)` : undefined;
  const hatTransform = hatSkew !== 0 ? `translate(16, -4) skewX(${hatSkew}) translate(-16, 4)` : undefined;
  const isCasting = castPhase > 0;
  const castGlow = isCasting ? 0.5 + castPhase * 0.08 : 0;

  return (
    <g>
      {/* Shadow */}
      <ellipse cx={16} cy={36} rx={12} ry={3.5} fill="rgba(0,0,0,0.25)" />

      {/* Robe back flap */}
      <g transform={robeTransform}>
        <polygon points="8,22 4,36 2,37 6,24" fill={mRobeDark} />
        <polygon points="10,22 6,35 4,36 8,24" fill={mRobe} opacity={0.7} />
        <polygon points="5,34 2,37 4,36 6,35" fill={mRobeDark} opacity={0.6} />
      </g>

      {/* Back Leg */}
      <g>
        <rect x={9} y={28} width={5} height={5} fill={mRobeDark} />
        <rect x={8} y={32} width={6} height={4} fill={mHatDark} rx={1} />
        <rect x={7} y={35} width={7} height={3} fill={mHatDark} rx={1} />
      </g>

      {/* Robe body */}
      <g>
        {/* Main robe */}
        <rect x={7} y={7} width={18} height={18} fill={mRobe} rx={1} />
        {/* Inner robe panel */}
        <rect x={13} y={8} width={6} height={14} fill={mRobeLight} rx={1} opacity={0.5} />
        {/* Collar */}
        <rect x={9} y={4} width={14} height={5} fill={mRobeLight} rx={2} />
        <rect x={10} y={5} width={12} height={3} fill={mRobe} rx={1} />
        {/* Stitch lines */}
        <line x1={13} y1={8} x2={13} y2={22} stroke={mRobeDark} strokeWidth={0.6} opacity={0.4} />
        <line x1={19} y1={8} x2={19} y2={22} stroke={mRobeDark} strokeWidth={0.6} opacity={0.4} />
        {/* Rune on chest */}
        <polygon points="16,11 18,14 16,17 14,14" fill={mCrystal} opacity={0.4} />
        <polygon points="16,12 17,14 16,16 15,14" fill={mCrystalBright} opacity={0.3} />
        {/* Highlight / shadow */}
        <rect x={7} y={7} width={18} height={1} fill={mRobeLight} opacity={0.3} />
        <rect x={7} y={24} width={18} height={1} fill={mRobeDark} opacity={0.5} />
        {/* Sash belt */}
        <rect x={6} y={22} width={20} height={3} fill={mSash} />
        <rect x={14} y={22} width={4} height={3} fill={mSashLight} rx={1} />
        <rect x={7} y={22} width={4} height={3} fill={mSash} opacity={0.8} />
        <rect x={21} y={22} width={4} height={3} fill={mSash} opacity={0.8} />
      </g>

      {/* Front Leg */}
      <g>
        <rect x={17} y={28} width={5} height={5} fill={mRobe} />
        <rect x={16} y={32} width={6} height={4} fill={mHatDark} rx={1} />
        <rect x={15} y={35} width={8} height={3} fill={mHatDark} rx={1} />
      </g>

      {/* Left arm (spell hand) */}
      <g>
        {/* Shoulder */}
        <rect x={1} y={6} width={8} height={4} fill={mRobeLight} rx={2} />
        {/* Upper arm sleeve */}
        <rect x={2} y={10} width={6} height={5} fill={mRobe} />
        {/* Forearm sleeve */}
        <rect x={1} y={14} width={6} height={4} fill={mRobeLight} rx={1} />
        {/* Hand */}
        <rect x={0} y={17} width={5} height={4} fill={mSkin} rx={1} />
        {/* Cast glow in hand */}
        {isCasting && (
          <>
            <circle cx={2} cy={19} r={5} fill={mCrystal} opacity={castGlow * 0.3} />
            <circle cx={2} cy={19} r={3} fill={mCrystalBright} opacity={castGlow * 0.5} />
          </>
        )}
      </g>

      {/* Staff arm (right side) — rotated around shoulder */}
      <g transform={`translate(26, 6) rotate(${staffAngle}) translate(-26, -6)`}>
        {/* Shoulder */}
        <rect x={22} y={6} width={8} height={4} fill={mRobeLight} rx={2} />
        {/* Upper arm */}
        <rect x={24} y={10} width={6} height={5} fill={mRobe} />
        {/* Forearm */}
        <rect x={24} y={14} width={6} height={4} fill={mRobeLight} rx={1} />
        {/* Hand gripping staff */}
        <rect x={26} y={10} width={4} height={4} fill={mSkin} rx={1} />

        {/* Staff shaft */}
        <rect x={28.5} y={-14} width={3} height={48} fill={mStaffWood} rx={1} />
        <rect x={29.5} y={-12} width={1} height={44} fill={mStaffLight} opacity={0.3} />
        {/* Staff head mount */}
        <rect x={27} y={-14} width={6} height={3} fill={mMetal} rx={1} />
        <rect x={27.5} y={-13} width={5} height={1} fill="#aaa" opacity={0.4} />
        {/* Crystal orb */}
        <circle cx={30} cy={-18} r={5} fill={mCrystal} opacity={0.7 + crystalGlow * 0.3} />
        <circle cx={30} cy={-18} r={3.5} fill={mCrystalBright} opacity={0.5 + crystalGlow * 0.3} />
        <circle cx={29} cy={-20} r={1.5} fill="#fff" opacity={0.4 + crystalGlow * 0.2} />
        {/* Crystal glow bloom */}
        <circle cx={30} cy={-18} r={7} fill={mCrystal} opacity={crystalGlow * 0.15} />
        {/* Staff base cap */}
        <rect x={27.5} y={32} width={5} height={3} fill={mMetal} rx={1} />
      </g>

      {/* Cast flash — big burst when casting */}
      {isCasting && castPhase <= 2 && (
        <g>
          <circle cx={30} cy={-18} r={10} fill={mCrystalBright} opacity={0.3} />
          <circle cx={2} cy={19} r={8} fill={mCrystalBright} opacity={0.25} />
        </g>
      )}

      {/* Head */}
      <g>
        {/* Face */}
        <rect x={8} y={-1} width={16} height={8} fill={mSkin} rx={1} />
        {/* Eyes */}
        <g transform={eyeTransform}>
          <rect x={11} y={1} width={3} height={2} fill="#8855cc" />
          <rect x={18} y={1} width={3} height={2} fill="#8855cc" />
          <rect x={11} y={1} width={3} height={2} fill="#fff" opacity={0.3} />
          <rect x={18} y={1} width={3} height={2} fill="#fff" opacity={0.3} />
          {/* Arcane eye glow when casting */}
          {isCasting && (
            <>
              <rect x={10} y={0} width={5} height={4} fill={mCrystalBright} opacity={0.15} rx={1} />
              <rect x={17} y={0} width={5} height={4} fill={mCrystalBright} opacity={0.15} rx={1} />
            </>
          )}
        </g>

        {/* Wizard hat */}
        <g transform={hatTransform}>
          {/* Brim */}
          <rect x={4} y={-2} width={24} height={4} fill={mHat} rx={2} />
          <rect x={5} y={-1} width={22} height={2} fill={mHatLight} opacity={0.15} />
          {/* Hat body */}
          <rect x={7} y={-7} width={18} height={7} fill={mHat} rx={1} />
          {/* Cone */}
          <polygon points="10,-7 16,-18 22,-7" fill={mHat} />
          <polygon points="12,-7 16,-16 20,-7" fill={mHatDark} opacity={0.3} />
          {/* Hat band */}
          <rect x={7} y={-7} width={18} height={2} fill={mSash} rx={1} />
          <rect x={8} y={-7} width={16} height={1} fill={mSashLight} opacity={0.3} />
          {/* Star ornament */}
          <circle cx={16} cy={-14} r={2} fill="#ffdd44" opacity={0.8} />
          <circle cx={16} cy={-14} r={1} fill="#fff" opacity={0.5} />
          {/* Hat tip — slight curl */}
          <circle cx={16} cy={-18} r={1.5} fill={mHatLight} opacity={0.6} />
        </g>
      </g>
    </g>
  );
}

// ============================================================
// RENDER HELPERS
// ============================================================

function renderWarlordPose(props: WarlordProps): string {
  const markup = renderToStaticMarkup(<WarlordBody {...props} />);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${W_VB_X} ${W_VB_Y} ${W_VB_W} ${W_VB_H}">${markup}</svg>`;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

function renderRangerPose(props: RangerProps): string {
  const markup = renderToStaticMarkup(<RangerBody {...props} />);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${R_VB_X} ${R_VB_Y} ${R_VB_W} ${R_VB_H}">${markup}</svg>`;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

function renderMagePose(props: MageProps): string {
  const markup = renderToStaticMarkup(<MageBody {...props} />);
  const svgStr = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${M_VB_X} ${M_VB_Y} ${M_VB_W} ${M_VB_H}">${markup}</svg>`;
  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  return URL.createObjectURL(blob);
}

// ============================================================
// CACHE
// ============================================================

export interface HeroSpriteCache {
  idle: string[];
  attack: string[];
  vbX: number;
  vbY: number;
  vbW: number;
  vbH: number;
}

let warlordCache: HeroSpriteCache | null = null;
let rangerCache: HeroSpriteCache | null = null;
let mageCache: HeroSpriteCache | null = null;

// Idle frame animation parameters (8 phases, cycle ~3.3s at 25 ticks/frame)
//
// Phase:        0     1     2     3     4     5     6     7
// Cape skew:    0     1.5   3     1.5   0    -1    -2    -1
// Shield rot:   0    -0.3  -0.6  -0.3   0     0.3   0.6   0.3
// Eye scaleY:   1     1     1     0.1   1     1     1     1
// Plume skew:   0     2     4     2     0    -1.5  -3    -1.5
// Weapon rot:   0     0.5   1     1.5   2     1.5   1     0.5

const IDLE_CAPE   = [0, 1.5, 3, 1.5, 0, -1, -2, -1];
const IDLE_SHIELD = [0, -0.3, -0.6, -0.3, 0, 0.3, 0.6, 0.3];
const IDLE_EYE    = [1, 1, 1, 0.1, 1, 1, 1, 1];
const IDLE_PLUME  = [0, 2, 4, 2, 0, -1.5, -3, -1.5];
const IDLE_WEAPON = [0, 0.5, 1, 1.5, 2, 1.5, 1, 0.5];

export function initWarlordSpriteCache(): HeroSpriteCache {
  if (warlordCache) return warlordCache;

  const idle: string[] = [];
  for (let i = 0; i < HERO_IDLE_FRAME_COUNT; i++) {
    idle.push(renderWarlordPose({
      weaponAngle: IDLE_WEAPON[i],
      capeSkew: IDLE_CAPE[i],
      shieldRot: IDLE_SHIELD[i],
      eyeScaleY: IDLE_EYE[i],
      plumeSkew: IDLE_PLUME[i],
      showSlash: false,
      slashOpacity: 0,
    }));
  }

  const attack = SWING_ANGLES.map((angle, cd) => {
    const showSlash = cd <= 3 && cd >= 1;
    const slashOpacity = showSlash ? 0.7 - (3 - cd) * 0.2 : 0;
    return renderWarlordPose({
      weaponAngle: angle,
      capeSkew: 2,          // cape flutter during swing
      shieldRot: -3,        // brace shield
      eyeScaleY: 1,
      plumeSkew: 3,         // plume whips forward
      showSlash,
      slashOpacity,
    });
  });

  warlordCache = { idle, attack, vbX: W_VB_X, vbY: W_VB_Y, vbW: W_VB_W, vbH: W_VB_H };
  return warlordCache;
}

export function initRangerSpriteCache(): HeroSpriteCache {
  if (rangerCache) return rangerCache;

  const idle: string[] = [];
  for (let i = 0; i < HERO_IDLE_FRAME_COUNT; i++) {
    idle.push(renderRangerPose({
      stringPull: 0,
      capeSkew: IDLE_CAPE[i],
      eyeScaleY: IDLE_EYE[i],
      showArrow: false,
      releaseFlash: false,
    }));
  }

  // Ranger attack: 6 frames (cd 5=start -> 0=end), string pull increases then releases
  const RANGER_PULL = [7, 5.8, 4.7, 3.5, 2.3, 1.2];
  const attack = RANGER_PULL.map((pull, cd) => {
    return renderRangerPose({
      stringPull: pull,
      capeSkew: 1,
      eyeScaleY: 1,
      showArrow: cd > 0,           // arrow disappears on release (cd=0)
      releaseFlash: cd === 0,
    });
  });

  rangerCache = { idle, attack, vbX: R_VB_X, vbY: R_VB_Y, vbW: R_VB_W, vbH: R_VB_H };
  return rangerCache;
}

// Idle mage animation parameters
const IDLE_STAFF  = [0, 0.5, 1, 1.5, 2, 1.5, 1, 0.5];
const IDLE_ROBE   = [0, 1, 2, 1, 0, -0.8, -1.5, -0.8];
const IDLE_HAT    = [0, 0.8, 1.5, 0.8, 0, -0.6, -1.2, -0.6];
const IDLE_GLOW   = [0.3, 0.4, 0.5, 0.6, 0.7, 0.6, 0.5, 0.4];

export function initMageSpriteCache(): HeroSpriteCache {
  if (mageCache) return mageCache;

  const idle: string[] = [];
  for (let i = 0; i < HERO_IDLE_FRAME_COUNT; i++) {
    idle.push(renderMagePose({
      staffAngle: IDLE_STAFF[i],
      robeSkew: IDLE_ROBE[i],
      eyeScaleY: IDLE_EYE[i],
      crystalGlow: IDLE_GLOW[i],
      castPhase: 0,
      hatSkew: IDLE_HAT[i],
    }));
  }

  // Mage attack: 6 frames (cd 5=start -> 0=end) — staff raises, crystal flares, burst
  const CAST_STAFF = [5, 12, 18, 12, 6, 0];
  const CAST_GLOW  = [0.4, 0.7, 1.0, 0.8, 0.5, 0.2];
  const CAST_PHASE = [6, 5, 3, 2, 1, 0];
  const attack = CAST_STAFF.map((angle, cd) => {
    return renderMagePose({
      staffAngle: angle,
      robeSkew: cd < 4 ? 2 : 0,
      eyeScaleY: 1,
      crystalGlow: CAST_GLOW[cd],
      castPhase: CAST_PHASE[cd],
      hatSkew: cd < 4 ? 1.5 : 0,
    });
  });

  mageCache = { idle, attack, vbX: M_VB_X, vbY: M_VB_Y, vbW: M_VB_W, vbH: M_VB_H };
  return mageCache;
}

export function initHeroSpriteCache(heroClass: string): HeroSpriteCache {
  if (heroClass === 'ranger') return initRangerSpriteCache();
  if (heroClass === 'mage') return initMageSpriteCache();
  return initWarlordSpriteCache();
}
