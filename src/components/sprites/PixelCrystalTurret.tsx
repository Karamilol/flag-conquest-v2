import { COLORS } from '../../constants';

interface Props {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  frame: number;
  duration: number;
  maxDuration: number;
  attackCooldown?: number;
  attackRate?: number;
  showHpNumbers?: boolean;
}

export default function PixelCrystalTurret({ x, y, health, maxHealth, frame, duration, maxDuration, attackCooldown = 99, attackRate = 80, showHpNumbers }: Props) {
  // Floating hover animation
  const hoverOffset = Math.sin(frame * 0.06 + x * 0.1) * 3;
  // Gentle rotation oscillation
  const tiltAngle = Math.sin(frame * 0.04 + x * 0.05) * 8;
  // Firing state
  const isFiring = attackCooldown < 12;
  const firePhase = isFiring ? attackCooldown / 12 : 0;
  // Duration fade — start fading in last 20% of life
  const lifeRatio = duration / maxDuration;
  const fadeWarning = lifeRatio < 0.2;
  const fadeOpacity = fadeWarning ? 0.5 + lifeRatio * 2.5 : 1.0;
  // Core pulse
  const corePulse = 0.6 + Math.sin(frame * 0.12) * 0.2;
  // Crystal colors — bright mineral tones
  const outerColor = '#44aa88'; // teal-green stone
  const midColor = '#55ddcc'; // bright teal crystal
  const coreColor = '#88ffee'; // bright inner glow
  const accentColor = '#ff8844'; // amber accent facets

  return (
    <g transform={`translate(${x}, ${y + hoverOffset})`} opacity={fadeOpacity}>
      {/* Ground shadow — smaller since it floats */}
      <ellipse cx={8} cy={22} rx={7} ry={2.5} fill="rgba(0,0,0,0.25)"
        opacity={0.6 + hoverOffset * 0.05} />

      {/* Arcane ground circle */}
      <ellipse cx={8} cy={22} rx={10} ry={3}
        fill={midColor} opacity={0.06 + Math.sin(frame * 0.08) * 0.03} />

      {/* Main crystal body — diamond shape, rotates slightly */}
      <g transform={`translate(8, 6) rotate(${tiltAngle}, 0, 6)`}>
        {/* Outer stone shell — rough hewn facets */}
        <polygon points="0,-8 -6,2 -5,10 0,14 5,10 6,2" fill={outerColor} />
        {/* Mid crystal layer */}
        <polygon points="0,-6 -4,2 -3,9 0,12 3,9 4,2" fill={midColor} />
        {/* Inner bright core */}
        <polygon points="0,-3 -2,3 -1,7 0,9 1,7 2,3" fill={coreColor} opacity={corePulse} />
        {/* Facet highlight lines — gives stone texture */}
        <line x1={0} y1={-8} x2={-3} y2={4} stroke="#77ccbb" strokeWidth={0.5} opacity={0.4} />
        <line x1={0} y1={-8} x2={3} y2={4} stroke="#77ccbb" strokeWidth={0.5} opacity={0.3} />
        <line x1={-6} y1={2} x2={0} y2={5} stroke="#338877" strokeWidth={0.5} opacity={0.3} />
        <line x1={6} y1={2} x2={0} y2={5} stroke="#338877" strokeWidth={0.5} opacity={0.3} />
        {/* Amber accent chips embedded in stone */}
        <rect x={-4} y={0} width={2} height={2} fill={accentColor} opacity={0.7} />
        <rect x={2} y={4} width={2} height={2} fill={accentColor} opacity={0.6} />
        {/* Top point glint */}
        {Math.floor(frame * 0.02) % 4 === 0 && (
          <circle cx={0} cy={-6} r={1.5} fill="#fff" opacity={0.6} />
        )}
      </g>

      {/* Orbiting energy motes */}
      <circle
        cx={8 + Math.sin(frame * 0.1) * 10}
        cy={8 + Math.cos(frame * 0.1) * 6}
        r={1.2} fill={coreColor} opacity={0.4}
      />
      <circle
        cx={8 + Math.sin(frame * 0.1 + 3.14) * 9}
        cy={8 + Math.cos(frame * 0.1 + 3.14) * 5}
        r={1} fill={accentColor} opacity={0.35}
      />

      {/* Firing flash — energy burst from crystal tip */}
      {isFiring && firePhase < 0.5 && (
        <>
          <circle cx={8} cy={-2 + hoverOffset} r={6 * (1 - firePhase)} fill={coreColor} opacity={0.4} />
          <line x1={8} y1={-2 + hoverOffset} x2={8 + 20} y2={4 + hoverOffset}
            stroke={midColor} strokeWidth={2} opacity={0.6 * (1 - firePhase)} strokeLinecap="round" />
        </>
      )}

      {/* Duration warning — flicker when about to expire */}
      {fadeWarning && Math.floor(frame * 0.15) % 2 === 0 && (
        <polygon
          points="8,-2 2,8 3,16 8,20 13,16 14,8"
          fill="#fff" opacity={0.1}
        />
      )}

      {/* HP bar — teal themed */}
      <rect x={0} y={-12} width={16} height={3} fill={COLORS.healthBg} rx={1} />
      <rect x={0.5} y={-11.5} width={Math.max(0, (health / maxHealth) * 15)} height={2} fill={midColor} rx={1} />
      {showHpNumbers && (
        <text x={8} y={-14} fontSize="7" textAnchor="middle" fill="#fff" fontWeight="bold">
          {health}/{maxHealth}
        </text>
      )}
    </g>
  );
}
