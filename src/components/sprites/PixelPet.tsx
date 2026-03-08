// Pet companion sprites — small SVG creatures that follow the hero

interface Props {
  x: number;
  y: number;
  frame: number;
  petType: string;
  isActive: boolean; // effect firing animation
}

export default function PixelPet({ x, y, frame, petType, isActive }: Props) {
  const bob = Math.sin(frame * 0.12) * 1.5;
  const activePulse = isActive ? 0.6 + Math.sin(frame * 0.3) * 0.4 : 0;

  return (
    <g transform={`translate(${x}, ${y + bob})`}>
      {isActive && <circle cx={6} cy={6} r={10} fill="#fff" opacity={activePulse * 0.08} />}
      {renderPet(petType, frame, isActive)}
    </g>
  );
}

function renderPet(type: string, frame: number, isActive: boolean) {
  switch (type) {
    case 'woodland_sprite': return <WoodlandSprite frame={frame} />;
    case 'wolf_pup': return <WolfPup frame={frame} />;
    case 'phantom_wisp': return <PhantomWisp frame={frame} />;
    case 'spiderling': return <Spiderling frame={frame} />;
    case 'bone_kitty': return <BoneKitty frame={frame} />;
    case 'frost_fairy': return <FrostFairy frame={frame} />;
    case 'shadow_clone': return <ShadowClone frame={frame} />;
    case 'mimic': return <Mimic frame={frame} />;
    case 'unicorn': return <Unicorn frame={frame} isActive={isActive} />;
    case 'vampire_bat': return <VampireBat frame={frame} />;
    case 'goose': return <Goose frame={frame} isActive={isActive} />;
    case 'slime': return <Slime frame={frame} />;
    default: return <circle cx={6} cy={6} r={4} fill="#888" />;
  }
}

// ---- Boss Pets ----

function WoodlandSprite({ frame }: { frame: number }) {
  const wingFlap = Math.sin(frame * 0.25) * 15;
  return (
    <g>
      {/* Wings */}
      <ellipse cx={2} cy={4} rx={4} ry={2} fill="#88ee88" opacity={0.6} transform={`rotate(${wingFlap}, 2, 4)`} />
      <ellipse cx={10} cy={4} rx={4} ry={2} fill="#88ee88" opacity={0.6} transform={`rotate(${-wingFlap}, 10, 4)`} />
      {/* Body */}
      <ellipse cx={6} cy={6} rx={3} ry={4} fill="#44cc44" />
      {/* Face */}
      <circle cx={5} cy={5} r={0.8} fill="#000" />
      <circle cx={7} cy={5} r={0.8} fill="#000" />
      {/* Sparkle */}
      {Math.floor(frame * 0.05) % 3 === 0 && <circle cx={6 + Math.sin(frame * 0.1) * 4} cy={2} r={0.8} fill="#fff" opacity={0.7} />}
    </g>
  );
}

function WolfPup({ frame }: { frame: number }) {
  const tailWag = Math.sin(frame * 0.2) * 10;
  const trot = Math.abs(Math.sin(frame * 0.15)) * 1;
  return (
    <g transform={`translate(0, ${trot})`}>
      {/* Tail */}
      <line x1={0} y1={6} x2={-3} y2={3} stroke="#888" strokeWidth={2} strokeLinecap="round" transform={`rotate(${tailWag}, 0, 6)`} />
      {/* Body */}
      <ellipse cx={6} cy={8} rx={5} ry={3} fill="#999" />
      {/* Head */}
      <circle cx={11} cy={6} r={3} fill="#aaa" />
      {/* Ears */}
      <polygon points="9,3 10,0 11,3" fill="#888" />
      <polygon points="11,3 12,0 13,3" fill="#888" />
      {/* Eyes */}
      <circle cx={12} cy={5.5} r={0.7} fill="#333" />
      {/* Nose */}
      <circle cx={13.5} cy={6.5} r={0.5} fill="#333" />
      {/* Legs */}
      <rect x={3} y={10} width={1.5} height={3} fill="#888" />
      <rect x={8} y={10} width={1.5} height={3} fill="#888" />
    </g>
  );
}

function PhantomWisp({ frame }: { frame: number }) {
  const drift = Math.sin(frame * 0.08) * 2;
  const pulse = 0.4 + Math.sin(frame * 0.12) * 0.2;
  return (
    <g transform={`translate(${drift}, 0)`}>
      {/* Outer glow */}
      <circle cx={6} cy={6} r={7} fill="#aaccff" opacity={pulse * 0.15} />
      {/* Core orb */}
      <circle cx={6} cy={6} r={4} fill="#88aadd" opacity={0.6} />
      <circle cx={6} cy={6} r={2.5} fill="#bbddff" opacity={0.8} />
      <circle cx={6} cy={5} r={1} fill="#fff" opacity={0.6} />
      {/* Trail wisps */}
      <circle cx={6} cy={10} r={2} fill="#88aadd" opacity={0.3} />
      <circle cx={6} cy={13} r={1.2} fill="#88aadd" opacity={0.15} />
    </g>
  );
}

function Spiderling({ frame }: { frame: number }) {
  const legWiggle = Math.sin(frame * 0.2) * 3;
  return (
    <g>
      {/* Legs — 4 per side */}
      <line x1={3} y1={6} x2={-1} y2={4 + legWiggle * 0.5} stroke="#444" strokeWidth={0.8} />
      <line x1={3} y1={7} x2={-1} y2={8 - legWiggle * 0.5} stroke="#444" strokeWidth={0.8} />
      <line x1={9} y1={6} x2={13} y2={4 - legWiggle * 0.5} stroke="#444" strokeWidth={0.8} />
      <line x1={9} y1={7} x2={13} y2={8 + legWiggle * 0.5} stroke="#444" strokeWidth={0.8} />
      {/* Body */}
      <ellipse cx={6} cy={7} rx={4} ry={3} fill="#3a2a3a" />
      {/* Head */}
      <circle cx={6} cy={4} r={2.5} fill="#4a3a4a" />
      {/* Eyes (8 tiny dots) */}
      <circle cx={5} cy={3.5} r={0.5} fill="#ff4444" />
      <circle cx={7} cy={3.5} r={0.5} fill="#ff4444" />
      <circle cx={4.5} cy={4.2} r={0.4} fill="#ff2222" />
      <circle cx={7.5} cy={4.2} r={0.4} fill="#ff2222" />
    </g>
  );
}

function BoneKitty({ frame }: { frame: number }) {
  const tailFlick = Math.sin(frame * 0.15) * 15;
  return (
    <g>
      {/* Tail */}
      <line x1={1} y1={8} x2={-2} y2={4} stroke="#ddd" strokeWidth={1.5} strokeLinecap="round" transform={`rotate(${tailFlick}, 1, 8)`} />
      {/* Body */}
      <ellipse cx={6} cy={8} rx={4} ry={2.5} fill="#ddd" />
      {/* Ribs */}
      <line x1={4} y1={7} x2={4} y2={9} stroke="#bbb" strokeWidth={0.5} />
      <line x1={6} y1={7} x2={6} y2={9} stroke="#bbb" strokeWidth={0.5} />
      <line x1={8} y1={7} x2={8} y2={9} stroke="#bbb" strokeWidth={0.5} />
      {/* Head */}
      <circle cx={10} cy={5} r={3} fill="#eee" />
      {/* Ears */}
      <polygon points="8,2 9,-1 10,2" fill="#ddd" />
      <polygon points="10,2 11,-1 12,2" fill="#ddd" />
      {/* Eye sockets — glowing */}
      <circle cx={9} cy={4.5} r={1} fill="#000" />
      <circle cx={11} cy={4.5} r={1} fill="#000" />
      <circle cx={9} cy={4.5} r={0.5} fill="#44ff44" opacity={0.6 + Math.sin(frame * 0.1) * 0.3} />
      <circle cx={11} cy={4.5} r={0.5} fill="#44ff44" opacity={0.6 + Math.sin(frame * 0.1) * 0.3} />
      {/* Legs */}
      <rect x={3} y={10} width={1} height={3} fill="#ddd" />
      <rect x={8} y={10} width={1} height={3} fill="#ddd" />
    </g>
  );
}

function FrostFairy({ frame }: { frame: number }) {
  const wingFlap = Math.sin(frame * 0.3) * 12;
  const sparklePhase = Math.floor(frame * 0.08) % 4;
  return (
    <g>
      {/* Crystal wings */}
      <polygon points="2,4 -2,0 0,7" fill="#88ddff" opacity={0.5} transform={`rotate(${wingFlap}, 2, 4)`} />
      <polygon points="10,4 14,0 12,7" fill="#88ddff" opacity={0.5} transform={`rotate(${-wingFlap}, 10, 4)`} />
      {/* Body */}
      <ellipse cx={6} cy={6} rx={2.5} ry={3.5} fill="#aaeeff" />
      {/* Face */}
      <circle cx={5} cy={5} r={0.6} fill="#2266aa" />
      <circle cx={7} cy={5} r={0.6} fill="#2266aa" />
      {/* Ice crown */}
      <polygon points="4,1 6,-1 8,1" fill="#ccf0ff" />
      {/* Snowflake particles */}
      {sparklePhase === 0 && <circle cx={1} cy={2} r={0.6} fill="#fff" opacity={0.5} />}
      {sparklePhase === 2 && <circle cx={11} cy={8} r={0.6} fill="#fff" opacity={0.5} />}
    </g>
  );
}

function ShadowClone({ frame }: { frame: number }) {
  const flicker = 0.3 + Math.sin(frame * 0.15) * 0.15;
  return (
    <g opacity={flicker}>
      {/* Body — dark silhouette */}
      <rect x={3} y={4} width={6} height={8} fill="#222" rx={1} />
      {/* Head + mask */}
      <circle cx={6} cy={3} r={3} fill="#1a1a1a" />
      {/* Eyes */}
      <circle cx={5} cy={2.5} r={0.6} fill="#ff4444" opacity={0.8} />
      <circle cx={7} cy={2.5} r={0.6} fill="#ff4444" opacity={0.8} />
      {/* Headband */}
      <rect x={3} y={1.5} width={6} height={1} fill="#333" />
      {/* Shuriken idle */}
      <g transform={`translate(10, 4) rotate(${frame * 3}, 0, 0)`}>
        <polygon points="0,-2 1,0 0,2 -1,0" fill="#888" />
        <polygon points="-2,0 0,1 2,0 0,-1" fill="#888" />
      </g>
      {/* Legs */}
      <rect x={4} y={12} width={1.5} height={2} fill="#222" />
      <rect x={6.5} y={12} width={1.5} height={2} fill="#222" />
    </g>
  );
}

// ---- Store Pets ----

function Mimic({ frame }: { frame: number }) {
  const lidFlap = Math.abs(Math.sin(frame * 0.08)) * 8;
  return (
    <g>
      {/* Box body */}
      <rect x={1} y={5} width={10} height={7} fill="#8a6a2a" rx={1} />
      <rect x={2} y={6} width={8} height={5} fill="#aa8a3a" />
      {/* Clasp */}
      <rect x={5} y={5} width={2} height={2} fill="#ffd700" rx={0.5} />
      {/* Lid */}
      <rect x={0} y={3} width={12} height={3} fill="#9a7a3a" rx={1} transform={`rotate(${-lidFlap}, 0, 5)`} />
      {/* Eyes inside */}
      <circle cx={4} cy={7} r={1} fill="#ff4444" />
      <circle cx={8} cy={7} r={1} fill="#ff4444" />
      <circle cx={4} cy={6.8} r={0.4} fill="#fff" />
      <circle cx={8} cy={6.8} r={0.4} fill="#fff" />
    </g>
  );
}

function Unicorn({ frame, isActive }: { frame: number; isActive: boolean }) {
  const trot = Math.abs(Math.sin(frame * 0.15)) * 1.5;
  const maneColors = ['#ff4444', '#ffaa00', '#44ff44', '#4488ff', '#aa44ff'];
  const maneIdx = Math.floor(frame * 0.05) % maneColors.length;
  return (
    <g transform={`translate(0, ${trot})`}>
      {/* Body */}
      <ellipse cx={6} cy={8} rx={5} ry={3} fill="#fff" />
      {/* Head */}
      <circle cx={11} cy={5} r={2.5} fill="#fff" />
      {/* Horn */}
      <polygon points="11,2 10.5,0 11.5,-2 12,0" fill="#ffd700" />
      {/* Eye */}
      <circle cx={12} cy={4.5} r={0.7} fill="#6644aa" />
      {/* Rainbow mane */}
      <rect x={8} y={3} width={1.5} height={4} fill={maneColors[maneIdx]} rx={0.5} />
      <rect x={6} y={4} width={1.5} height={3} fill={maneColors[(maneIdx + 1) % maneColors.length]} rx={0.5} />
      {/* Tail */}
      <rect x={0} y={6} width={2} height={3} fill={maneColors[(maneIdx + 2) % maneColors.length]} rx={0.5} />
      {/* Legs */}
      <rect x={3} y={10} width={1} height={3} fill="#eee" />
      <rect x={8} y={10} width={1} height={3} fill="#eee" />
      {/* Sparkle when active */}
      {isActive && <circle cx={6 + Math.sin(frame * 0.2) * 5} cy={12} r={1} fill="#ffd700" opacity={0.6} />}
    </g>
  );
}

function VampireBat({ frame }: { frame: number }) {
  const wingFlap = Math.sin(frame * 0.3) * 20;
  return (
    <g>
      {/* Wings */}
      <polygon points="4,5 -3,2 -1,8" fill="#3a2a3a" transform={`rotate(${wingFlap}, 4, 5)`} />
      <polygon points="8,5 15,2 13,8" fill="#3a2a3a" transform={`rotate(${-wingFlap}, 8, 5)`} />
      {/* Body */}
      <ellipse cx={6} cy={6} rx={3} ry={3} fill="#4a3a4a" />
      {/* Ears */}
      <polygon points="4,2 3,-1 5,2" fill="#3a2a3a" />
      <polygon points="8,2 9,-1 7,2" fill="#3a2a3a" />
      {/* Eyes */}
      <circle cx={5} cy={5} r={0.8} fill="#ff2222" />
      <circle cx={7} cy={5} r={0.8} fill="#ff2222" />
      {/* Fangs */}
      <rect x={5} y={7} width={0.6} height={1.2} fill="#fff" />
      <rect x={6.5} y={7} width={0.6} height={1.2} fill="#fff" />
    </g>
  );
}

function Goose({ frame, isActive }: { frame: number; isActive: boolean }) {
  const walkBob = Math.abs(Math.sin(frame * 0.15)) * 1;
  return (
    <g transform={`translate(-3, ${walkBob - 5}) scale(1.6)`}>
      {/* Body */}
      <ellipse cx={5} cy={8} rx={4} ry={3} fill="#fff" />
      {/* Neck */}
      <rect x={8} y={3} width={2} height={6} fill="#fff" rx={1} />
      {/* Head */}
      <circle cx={9} cy={2} r={2.5} fill="#fff" />
      {/* Eye — angry */}
      <circle cx={10} cy={1.5} r={0.7} fill="#000" />
      <line x1={9} y1={0.5} x2={11} y2={0.8} stroke="#000" strokeWidth={0.6} />
      {/* Beak */}
      <polygon points="11,2 14,2.5 11,3" fill="#ff8800" />
      {/* KNIFE in mouth */}
      <g transform="translate(13, 1.5) rotate(20)">
        <rect x={0} y={0} width={5} height={1} fill="#ccc" rx={0.3} />
        <rect x={-1} y={-0.5} width={2} height={2} fill="#8b6914" rx={0.3} />
      </g>
      {/* Legs */}
      <rect x={3} y={10} width={1} height={2.5} fill="#ff8800" />
      <rect x={6} y={10} width={1} height={2.5} fill="#ff8800" />
      {/* Feet */}
      <rect x={2} y={12} width={2.5} height={1} fill="#ff8800" rx={0.5} />
      <rect x={5} y={12} width={2.5} height={1} fill="#ff8800" rx={0.5} />
      {/* Honk effect */}
      {isActive && (
        <>
          <text x={14} y={0} fontSize="5" fill="#ff8800" fontWeight="bold" opacity={0.8}>!</text>
        </>
      )}
    </g>
  );
}

function Slime({ frame }: { frame: number }) {
  const jiggle = Math.sin(frame * 0.15) * 0.5;
  const squash = 1 + Math.sin(frame * 0.12) * 0.08;
  return (
    <g transform={`scale(${1 / squash}, ${squash})`}>
      {/* Body */}
      <ellipse cx={6} cy={8} rx={5 + jiggle} ry={4} fill="#44dd44" opacity={0.7} />
      <ellipse cx={6} cy={8} rx={3.5 + jiggle * 0.5} ry={2.8} fill="#66ff66" opacity={0.5} />
      {/* Eyes */}
      <circle cx={4} cy={6} r={1.2} fill="#fff" />
      <circle cx={8} cy={6} r={1.2} fill="#fff" />
      <circle cx={4.3} cy={6.2} r={0.6} fill="#222" />
      <circle cx={8.3} cy={6.2} r={0.6} fill="#222" />
      {/* Highlight */}
      <ellipse cx={4} cy={5} rx={1} ry={0.6} fill="#fff" opacity={0.3} />
    </g>
  );
}
