/** Inline SVG map icon — used in both HTML and SVG contexts. */

/** For use inside HTML (buttons, panels, etc.) */
export function MapIconHTML({ size = 16 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <MapIconGuts />
    </svg>
  );
}

/** Raw SVG elements — use inside an existing <svg> or <g> with a transform for positioning/scaling. */
export function MapIconGuts() {
  return (
    <>
      {/* Parchment base */}
      <path d="M5,4 L22,2 L27,4 L27,27 L10,29 L5,27 Z" fill="#d4be8a" />
      <path d="M5,4 L22,2 L27,4 L27,27 L10,29 L5,27 Z" fill="none" stroke="#8a7040" strokeWidth={0.8} />
      {/* Parchment fold shadow */}
      <path d="M22,2 L22,26 L27,27 L27,4 Z" fill="#c4a870" />
      <line x1={22} y1={2} x2={22} y2={26} stroke="#8a7040" strokeWidth={0.5} opacity={0.4} />
      {/* Worn edges */}
      <path d="M5,4 Q6,5.5 5,7" fill="none" stroke="#b8a070" strokeWidth={0.6} opacity={0.5} />
      <path d="M10,29 Q9,27.5 10,26" fill="none" stroke="#b8a070" strokeWidth={0.6} opacity={0.5} />
      {/* Route line */}
      <path d="M9,22 Q12,18 11,14 Q10,10 14,8 Q18,6 20,10" fill="none" stroke="#884422" strokeWidth={1.2} strokeLinecap="round" strokeDasharray="2.5 1.5" />
      {/* Flag marker at start */}
      <rect x={8} y={20} width={1.2} height={5} fill="#5a4a3a" />
      <polygon points="9.2,20 14,21 14,23.5 9.2,22.5" fill="#44aa44" />
      {/* Flag marker at end */}
      <rect x={19} y={7} width={1.2} height={5} fill="#5a4a3a" />
      <polygon points="20.2,7 25,8 25,10.5 20.2,9.5" fill="#cc3333" />
      {/* X mark */}
      <line x1={14} y1={12} x2={17} y2={15} stroke="#cc3333" strokeWidth={1.2} strokeLinecap="round" />
      <line x1={17} y1={12} x2={14} y2={15} stroke="#cc3333" strokeWidth={1.2} strokeLinecap="round" />
      {/* Compass rose (tiny) */}
      <circle cx={24} cy={23} r={2.5} fill="#c4a870" stroke="#8a7040" strokeWidth={0.5} />
      <line x1={24} y1={21} x2={24} y2={25} stroke="#8a7040" strokeWidth={0.5} />
      <line x1={22} y1={23} x2={26} y2={23} stroke="#8a7040" strokeWidth={0.5} />
      <polygon points="24,21 23.5,22.5 24.5,22.5" fill="#cc3333" />
    </>
  );
}
