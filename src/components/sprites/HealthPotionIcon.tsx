/** Inline SVG health potion icon — used in both HTML and SVG contexts. */

/** For use inside HTML (backpack panel, daily login, etc.) */
export function HealthPotionIconHTML({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <HealthPotionGuts />
    </svg>
  );
}

/** Raw SVG elements — use inside an existing <svg> or <g> with a transform for positioning/scaling. */
export function HealthPotionGuts() {
  return (
    <>
      {/* Cork */}
      <rect x={12} y={3} width={8} height={4} rx={1} fill="#c4984a" />
      <rect x={12} y={3} width={8} height={1.5} rx={1} fill="#d4a85a" opacity={0.5} />
      <rect x={11} y={6} width={10} height={1} fill="#8a7040" />
      {/* Bottle neck */}
      <rect x={13} y={7} width={6} height={4} fill="#88bbdd" opacity={0.35} />
      {/* Bottle body */}
      <path d="M13,11 Q8,13 7,16 L7,25 Q7,28 10,28 L22,28 Q25,28 25,25 L25,16 Q24,13 19,11 Z" fill="#88bbdd" opacity={0.3} />
      <path d="M13,11 Q8,13 7,16 L7,25 Q7,28 10,28 L22,28 Q25,28 25,25 L25,16 Q24,13 19,11 Z" fill="none" stroke="#5588aa" strokeWidth={0.6} opacity={0.5} />
      {/* Red liquid */}
      <path d="M8,16 L8,25 Q8,27 10,27 L22,27 Q24,27 24,25 L24,16 Q23,14 19,12.5 L13,12.5 Q9,14 8,16 Z" fill="#cc2233" />
      <path d="M8.5,16.5 L8.5,24 Q8.5,26 10.5,26 L14,26 L14,16 Q10,14.5 8.5,16.5 Z" fill="#dd3344" opacity={0.35} />
      <rect x={9} y={24} width={14} height={3} rx={2} fill="#991122" opacity={0.3} />
      {/* Bubbles */}
      <circle cx={12} cy={20} r={0.8} fill="#ff6677" opacity={0.4} />
      <circle cx={18} cy={22} r={0.6} fill="#ff6677" opacity={0.3} />
      {/* Glass shine */}
      <path d="M10,15 Q9.5,18 10,23" fill="none" stroke="#ffffff" strokeWidth={0.8} opacity={0.3} strokeLinecap="round" />
      <circle cx={11} cy={14.5} r={0.8} fill="#ffffff" opacity={0.35} />
      {/* Heart emblem */}
      <path d="M16,19 Q14,17 13,18 Q12,19.5 16,23 Q20,19.5 19,18 Q18,17 16,19 Z" fill="#ff4455" opacity={0.7} />
    </>
  );
}
