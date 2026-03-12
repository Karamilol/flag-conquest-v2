/** Inline SVG game icons — replaces emoji with hand-crafted pixel-style icons.
 *  Each icon has an HTML wrapper (for buttons/panels) and raw Guts (for SVG embedding). */

// ─── Backpack (🎒) ───────────────────────────────────────────
export function BackpackIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <BackpackIconGuts />
    </svg>
  );
}
export function BackpackIconGuts() {
  return (
    <>
      {/* Shoulder straps */}
      <path d="M10,8 Q10,4 16,3 Q22,4 22,8" fill="none" stroke="#6a5a3a" strokeWidth={2.5} strokeLinecap="round" />
      {/* Main body */}
      <rect x={8} y={10} width={16} height={17} rx={3} fill="#8b6b3a" />
      <rect x={8} y={10} width={16} height={17} rx={3} fill="none" stroke="#6a4a2a" strokeWidth={0.8} />
      {/* Front flap */}
      <path d="M10,14 L22,14 L22,20 Q16,22 10,20 Z" fill="#7a5a2a" />
      {/* Buckle */}
      <rect x={14} y={17} width={4} height={3} rx={0.8} fill="#c8a83e" />
      <rect x={15} y={18} width={2} height={1} fill="#e8c85e" />
      {/* Front pocket */}
      <rect x={11} y={22} width={10} height={4} rx={1.5} fill="#7a5a2a" />
      <line x1={14} y1={23} x2={18} y2={23} stroke="#6a4a2a" strokeWidth={0.5} opacity={0.5} />
      {/* Highlight */}
      <path d="M9,11 L9,18" fill="none" stroke="#a8884a" strokeWidth={0.8} opacity={0.4} strokeLinecap="round" />
    </>
  );
}

// ─── Relics/Urn (🏺) ─────────────────────────────────────────
export function RelicIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <RelicIconGuts />
    </svg>
  );
}
export function RelicIconGuts() {
  return (
    <>
      {/* Handles */}
      <path d="M8,10 Q4,10 4,14 Q4,17 8,17" fill="none" stroke="#b8884a" strokeWidth={1.8} strokeLinecap="round" />
      <path d="M24,10 Q28,10 28,14 Q28,17 24,17" fill="none" stroke="#b8884a" strokeWidth={1.8} strokeLinecap="round" />
      {/* Neck */}
      <rect x={12} y={3} width={8} height={5} rx={1.5} fill="#c8984a" />
      <rect x={11} y={7} width={10} height={2} rx={1} fill="#d4a85a" />
      {/* Lip */}
      <rect x={10} y={2} width={12} height={2.5} rx={1.2} fill="#d4a85a" />
      {/* Body */}
      <path d="M9,9 Q7,16 8,22 Q9,28 16,29 Q23,28 24,22 Q25,16 23,9 Z" fill="#c8984a" />
      <path d="M9,9 Q7,16 8,22 Q9,28 16,29 Q23,28 24,22 Q25,16 23,9 Z" fill="none" stroke="#a87830" strokeWidth={0.7} />
      {/* Decorative band */}
      <rect x={9} y={14} width={14} height={2.5} rx={0.5} fill="#d4a85a" />
      <rect x={9} y={14} width={14} height={1} fill="#e8c86e" opacity={0.5} />
      {/* Greek key pattern (simplified) */}
      <rect x={11} y={18} width={2} height={2} fill="#a87830" opacity={0.4} />
      <rect x={15} y={18} width={2} height={2} fill="#a87830" opacity={0.4} />
      <rect x={19} y={18} width={2} height={2} fill="#a87830" opacity={0.4} />
      {/* Highlight */}
      <path d="M11,10 Q10,16 11,22" fill="none" stroke="#e8c86e" strokeWidth={0.8} opacity={0.35} strokeLinecap="round" />
    </>
  );
}

// ─── Trophy (🏆) ─────────────────────────────────────────────
export function TrophyIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <TrophyIconGuts />
    </svg>
  );
}
export function TrophyIconGuts() {
  return (
    <>
      {/* Left handle */}
      <path d="M8,8 Q3,8 3,13 Q3,17 7,17" fill="none" stroke="#c8a83e" strokeWidth={2} strokeLinecap="round" />
      {/* Right handle */}
      <path d="M24,8 Q29,8 29,13 Q29,17 25,17" fill="none" stroke="#c8a83e" strokeWidth={2} strokeLinecap="round" />
      {/* Cup body */}
      <path d="M7,5 L25,5 L23,19 Q16,23 9,19 Z" fill="#e8c83e" />
      <path d="M7,5 L25,5 L23,19 Q16,23 9,19 Z" fill="none" stroke="#b8982e" strokeWidth={0.7} />
      {/* Rim */}
      <rect x={6} y={4} width={20} height={3} rx={1.5} fill="#f0d84e" />
      <rect x={6} y={4} width={20} height={1.5} rx={1} fill="#ffe86e" opacity={0.5} />
      {/* Star emblem */}
      <polygon points="16,10 17.5,13 21,13.5 18.5,15.5 19.2,19 16,17 12.8,19 13.5,15.5 11,13.5 14.5,13" fill="#f0d84e" />
      <polygon points="16,11 17,13.2 19.5,13.5 17.8,15 18.2,17.5 16,16.2 13.8,17.5 14.2,15 12.5,13.5 15,13.2" fill="#ffe86e" opacity={0.6} />
      {/* Stem */}
      <rect x={14} y={22} width={4} height={4} rx={0.5} fill="#c8a83e" />
      {/* Base */}
      <rect x={10} y={25} width={12} height={3} rx={1.5} fill="#d4b83e" />
      <rect x={10} y={25} width={12} height={1.5} rx={1} fill="#e8c83e" opacity={0.4} />
    </>
  );
}

// ─── Crossed Swords / Units (⚔️) ────────────────────────────
export function SwordsIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <SwordsIconGuts />
    </svg>
  );
}
export function SwordsIconGuts() {
  return (
    <>
      {/* Left sword blade */}
      <rect x={4} y={3} width={4} height={18} rx={1} fill="#b8b8c8" transform="rotate(-30 8 16)" />
      <rect x={5} y={3} width={1.5} height={16} rx={0.5} fill="#d0d0e0" opacity={0.5} transform="rotate(-30 8 16)" />
      <polygon points="6,2 8,2 7,-1" fill="#b8b8c8" transform="rotate(-30 8 16)" />
      {/* Left guard */}
      <rect x={2} y={20} width={10} height={2.5} rx={1} fill="#c8a83e" transform="rotate(-30 8 16)" />
      {/* Left grip */}
      <rect x={5} y={22} width={4} height={5} rx={0.5} fill="#5a4a3a" transform="rotate(-30 8 16)" />
      <circle cx={7} cy={27.5} r={1.5} fill="#c8a83e" transform="rotate(-30 8 16)" />
      {/* Right sword blade */}
      <rect x={24} y={3} width={4} height={18} rx={1} fill="#b8b8c8" transform="rotate(30 24 16)" />
      <rect x={25.5} y={3} width={1.5} height={16} rx={0.5} fill="#d0d0e0" opacity={0.5} transform="rotate(30 24 16)" />
      <polygon points="24,2 28,2 26,-1" fill="#b8b8c8" transform="rotate(30 24 16)" />
      {/* Right guard */}
      <rect x={20} y={20} width={10} height={2.5} rx={1} fill="#c8a83e" transform="rotate(30 24 16)" />
      {/* Right grip */}
      <rect x={23} y={22} width={4} height={5} rx={0.5} fill="#5a4a3a" transform="rotate(30 24 16)" />
      <circle cx={25} cy={27.5} r={1.5} fill="#c8a83e" transform="rotate(30 24 16)" />
    </>
  );
}

// ─── Gold Coins / Income (💰) ────────────────────────────────
export function GoldIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <GoldIconGuts />
    </svg>
  );
}
export function GoldIconGuts() {
  return (
    <>
      {/* Bag body */}
      <path d="M8,14 Q6,20 7,26 Q8,30 16,30 Q24,30 25,26 Q26,20 24,14 Z" fill="#8a7a3a" />
      <path d="M8,14 Q6,20 7,26 Q8,30 16,30 Q24,30 25,26 Q26,20 24,14 Z" fill="none" stroke="#6a5a2a" strokeWidth={0.7} />
      {/* Bag neck/tie */}
      <path d="M10,14 Q16,10 22,14" fill="none" stroke="#6a5a2a" strokeWidth={1.5} />
      <path d="M11,12 Q16,8 21,12" fill="#8a7a3a" stroke="#6a5a2a" strokeWidth={0.7} />
      {/* String tie */}
      <rect x={14} y={12} width={4} height={3} rx={1} fill="#c8a83e" />
      {/* $ symbol on bag */}
      <text x={16} y={25} fill="#c8a83e" fontSize="11" fontWeight="bold" textAnchor="middle" fontFamily="serif">$</text>
      {/* Coins peeking out top */}
      <ellipse cx={12} cy={10} rx={4} ry={2.5} fill="#e8c83e" stroke="#c8a83e" strokeWidth={0.5} />
      <ellipse cx={12} cy={10} rx={2.5} ry={1.5} fill="#f0d84e" opacity={0.5} />
      <ellipse cx={19} cy={9} rx={4} ry={2.5} fill="#e8c83e" stroke="#c8a83e" strokeWidth={0.5} />
      <ellipse cx={19} cy={9} rx={2.5} ry={1.5} fill="#f0d84e" opacity={0.5} />
      {/* Highlight */}
      <path d="M10,16 Q9,22 10,26" fill="none" stroke="#a8984a" strokeWidth={0.8} opacity={0.3} strokeLinecap="round" />
    </>
  );
}

// ─── Portal / Cyclone (🌀) ───────────────────────────────────
export function PortalIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <PortalIconGuts />
    </svg>
  );
}
export function PortalIconGuts() {
  return (
    <>
      {/* Outer glow */}
      <circle cx={16} cy={16} r={14} fill="#2a1a3e" opacity={0.4} />
      {/* Swirl rings */}
      <circle cx={16} cy={16} r={12} fill="none" stroke="#8844dd" strokeWidth={1.5} opacity={0.4} strokeDasharray="6 4" />
      <circle cx={16} cy={16} r={9} fill="none" stroke="#aa55ff" strokeWidth={1.2} opacity={0.5} strokeDasharray="5 3" />
      <circle cx={16} cy={16} r={6} fill="none" stroke="#cc77ff" strokeWidth={1} opacity={0.6} strokeDasharray="3 2" />
      {/* Core */}
      <circle cx={16} cy={16} r={4} fill="#6633aa" opacity={0.8} />
      <circle cx={16} cy={16} r={2.5} fill="#9955dd" opacity={0.7} />
      <circle cx={16} cy={16} r={1.2} fill="#ddbbff" opacity={0.9} />
      {/* Orbiting particles */}
      <circle cx={6} cy={12} r={1.5} fill="#cc66ff" opacity={0.5} />
      <circle cx={24} cy={20} r={1.3} fill="#cc66ff" opacity={0.4} />
      <circle cx={12} cy={26} r={1} fill="#aa44ff" opacity={0.45} />
      <circle cx={22} cy={8} r={1.2} fill="#aa44ff" opacity={0.4} />
    </>
  );
}

// ─── Warlord / Sword & Shield (⚔️) ──────────────────────────
export function WarlordIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <WarlordIconGuts />
    </svg>
  );
}
export function WarlordIconGuts() {
  return (
    <>
      {/* Shield */}
      <path d="M6,6 L18,6 L18,20 L12,26 L6,20 Z" fill="#3a5a9f" />
      <path d="M7,7 L17,7 L17,19 L12,24 L7,19 Z" fill="#4a6abf" />
      <path d="M6,6 L18,6 L18,20 L12,26 L6,20 Z" fill="none" stroke="#2a4a8a" strokeWidth={0.8} />
      {/* Shield cross */}
      <rect x={11} y={9} width={2} height={12} fill="#c8a83e" />
      <rect x={8} y={13} width={8} height={2} fill="#c8a83e" />
      {/* Sword behind shield */}
      <rect x={20} y={1} width={3.5} height={20} rx={0.8} fill="#b8b8c8" />
      <rect x={21} y={2} width={1.5} height={17} rx={0.5} fill="#d0d0e0" opacity={0.5} />
      <polygon points="20,1 23.5,1 21.75,-2" fill="#c8c8d8" />
      {/* Sword guard */}
      <rect x={17} y={20} width={10} height={2.5} rx={1} fill="#c8a83e" />
      {/* Sword grip */}
      <rect x={20} y={22} width={3.5} height={5} rx={0.5} fill="#5a4a3a" />
      <circle cx={21.75} cy={28} r={1.8} fill="#c8a83e" />
    </>
  );
}

// ─── Ranger / Bow (🏹) ──────────────────────────────────────
export function RangerIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <RangerIconGuts />
    </svg>
  );
}
export function RangerIconGuts() {
  return (
    <>
      {/* Bow stave — curves right, opens toward target */}
      <path d="M20,3 Q30,16 20,29" fill="none" stroke="#7a5a3a" strokeWidth={2.8} strokeLinecap="round" />
      <path d="M20,3 Q29,16 20,29" fill="none" stroke="#9a7a5a" strokeWidth={1.2} opacity={0.4} strokeLinecap="round" />
      {/* Bow grip wrap */}
      <rect x={18} y={13} width={4} height={6} rx={1.5} fill="#5a4a3a" opacity={0.7} />
      {/* Bowstring — pulled back left to nock point */}
      <line x1={20} y1={3} x2={14} y2={16} stroke="#c8c8c8" strokeWidth={0.7} />
      <line x1={20} y1={29} x2={14} y2={16} stroke="#c8c8c8" strokeWidth={0.7} />
      {/* Arrow shaft — nocked at pull point, shooting right through bow */}
      <line x1={14} y1={16} x2={30} y2={16} stroke="#7a6a4a" strokeWidth={1.5} />
      {/* Arrow head — pointing right */}
      <polygon points="30,16 26,13 26,19" fill="#b8b8c8" />
      <polygon points="29,16 27,14 27,18" fill="#d0d0e0" opacity={0.5} />
      {/* Arrow fletching at nock */}
      <polygon points="16,16 14,13.5 14,16" fill="#cc3333" opacity={0.8} />
      <polygon points="16,16 14,18.5 14,16" fill="#cc3333" opacity={0.8} />
      {/* Nock point */}
      <circle cx={14} cy={16} r={0.8} fill="#5a4a3a" />
    </>
  );
}

// ─── Mage / Staff (🧙) ──────────────────────────────────────
export function MageIconHTML({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 32 32" width={size} height={size} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <MageIconGuts />
    </svg>
  );
}
export function MageIconGuts() {
  return (
    <>
      {/* Staff */}
      <rect x={14.5} y={8} width={3} height={22} rx={1} fill="#5a4a3a" />
      <rect x={15.5} y={9} width={1} height={20} rx={0.5} fill="#7a6a5a" opacity={0.4} />
      {/* Crystal orb */}
      <circle cx={16} cy={7} r={5.5} fill="#6633aa" />
      <circle cx={16} cy={7} r={4.5} fill="#8855cc" />
      <circle cx={16} cy={7} r={3} fill="#aa77ee" opacity={0.7} />
      <circle cx={16} cy={7} r={1.5} fill="#ddbbff" opacity={0.8} />
      {/* Crystal glow */}
      <circle cx={16} cy={7} r={7} fill="none" stroke="#aa55ff" strokeWidth={0.5} opacity={0.3} />
      {/* Sparkles around crystal */}
      <circle cx={10} cy={4} r={0.8} fill="#ddbbff" opacity={0.6} />
      <circle cx={22} cy={5} r={0.6} fill="#ddbbff" opacity={0.5} />
      <circle cx={13} cy={12} r={0.7} fill="#cc88ff" opacity={0.4} />
      {/* Staff prongs holding crystal */}
      <path d="M13,11 Q12,8 13,5" fill="none" stroke="#5a4a3a" strokeWidth={1.5} strokeLinecap="round" />
      <path d="M19,11 Q20,8 19,5" fill="none" stroke="#5a4a3a" strokeWidth={1.5} strokeLinecap="round" />
      {/* Staff wrapping */}
      <rect x={13.5} y={16} width={5} height={1.5} rx={0.5} fill="#c8a83e" opacity={0.6} />
      <rect x={13.5} y={20} width={5} height={1.5} rx={0.5} fill="#c8a83e" opacity={0.6} />
    </>
  );
}
