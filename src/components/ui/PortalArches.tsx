// ── Fractured World: Floating Magic Mirror Portals (viewport-fixed) ──
// Oval portals showing a biome preview inside — harder portals look more menacing.

import { useState, useEffect, useRef, useCallback } from 'react';
import type { PortalChoiceData } from '../../types';
import { getModifierDef, getCurseDef } from '../../modifiers';
import { BIOME_COLORS } from '../../biomeUtils';
import type { Biome } from '../../constants';
import type { Regalia, RegaliaSlot } from '../../regalias';
import { RARITY_COLORS, SLOT_ICONS, getModDisplayText } from '../../regalias';

const AUTO_PORTAL_KEY = 'flag-conquest-auto-portal';
type AutoPortalPref = 'off' | 'easy' | 'medium' | 'hard';
const AUTO_TIMER_SECONDS = 60;

function loadAutoPortalPref(): AutoPortalPref {
  try { return (localStorage.getItem(AUTO_PORTAL_KEY) as AutoPortalPref) || 'off'; } catch { return 'off'; }
}
function saveAutoPortalPref(pref: AutoPortalPref) {
  try { localStorage.setItem(AUTO_PORTAL_KEY, pref); } catch { /* noop */ }
}

const DIFF_CONFIG: Record<string, {
  label: string; color: string; glow: string; borderColor: string;
  enemyCount: number; fog: number;
}> = {
  easy:   { label: 'STABLE',   color: '#4aff4a', glow: 'rgba(74,255,74,0.3)',  borderColor: '#3a8a3a', enemyCount: 0, fog: 0 },
  medium: { label: 'WARPED',   color: '#ffcc44', glow: 'rgba(255,204,68,0.3)', borderColor: '#8a7a2a', enemyCount: 2, fog: 0.1 },
  hard:   { label: 'VOLATILE', color: '#ff4444', glow: 'rgba(255,68,68,0.3)',  borderColor: '#8a2a2a', enemyCount: 4, fog: 0.2 },
};

const BIOME_LABELS: Record<string, string> = {
  forest: 'Ancient Forest',
  cave: 'Crystal Caverns',
  nordic: 'Frozen Highlands',
  volcanic: 'Volcanic Wastes',
  final: 'The Void',
};

const MTN_PATHS: Record<string, string> = {
  forest:   'M0,50 L8,28 L14,35 L22,18 L30,30 L38,12 L46,25 L54,20 L62,32 L70,15 L78,28 L86,22 L94,30 L100,50 Z',
  cave:     'M0,50 L5,42 L12,38 L18,44 L25,30 L32,40 L40,26 L48,36 L56,28 L64,38 L72,24 L80,34 L88,40 L95,36 L100,50 Z',
  nordic:   'M0,50 L6,22 L12,30 L20,10 L28,25 L36,8 L44,20 L52,14 L60,26 L68,6 L76,22 L84,16 L92,28 L100,50 Z',
  volcanic: 'M0,50 L10,30 L18,35 L26,20 L34,28 L42,14 L50,25 L58,18 L66,30 L74,22 L82,32 L90,26 L100,50 Z',
  final:    'M0,50 L8,20 L16,30 L24,8 L32,22 L40,12 L50,5 L60,14 L68,8 L76,24 L84,18 L92,28 L100,50 Z',
};

// Rune positions along the oval border (angle in radians)
const RUNE_ANGLES = [
  -Math.PI * 0.4, -Math.PI * 0.2, 0, Math.PI * 0.2, Math.PI * 0.4,
  Math.PI * 0.6, Math.PI * 0.8, Math.PI, -Math.PI * 0.8, -Math.PI * 0.6,
];

// Enemy silhouette SVG shapes
function EnemySilhouettes({ count, color }: { count: number; color: string }) {
  if (count === 0) return null;
  const positions = [
    { x: 20, s: 0.9 }, { x: 72, s: 0.85 }, { x: 45, s: 1.0 }, { x: 58, s: 0.8 },
    { x: 12, s: 0.75 }, { x: 82, s: 0.7 },
  ].slice(0, count);

  return (
    <svg viewBox="0 0 100 50" style={{
      position: 'absolute', bottom: '8%', left: 0, right: 0, width: '100%', height: '40%',
      pointerEvents: 'none',
    }}>
      {positions.map((p, i) => (
        <g key={i} transform={`translate(${p.x}, ${50 - 10 * p.s}) scale(${p.s})`} opacity={0.7 - i * 0.05}>
          <ellipse cx="0" cy="-8" rx="3" ry="3.5" fill={color} />
          <rect x="-2.5" y="-5" width="5" height="6" rx="1" fill={color} />
          <rect x="-3.5" y="0" width="2" height="3" fill={color} />
          <rect x="1.5" y="0" width="2" height="3" fill={color} />
          {i % 2 === 0 ? (
            <rect x="3" y="-12" width="1" height="10" fill={color} opacity="0.8" />
          ) : (
            <rect x="-4" y="-7" width="1.2" height="6" fill={color} opacity="0.8" transform="rotate(-20, -4, -7)" />
          )}
          <circle cx="-1" cy="-9" r="0.6" fill="#ff4444" opacity="0.9" />
          <circle cx="1" cy="-9" r="0.6" fill="#ff4444" opacity="0.9" />
        </g>
      ))}
    </svg>
  );
}

// Light rays for stable portals
function LightRays({ color }: { color: string }) {
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', borderRadius: 'inherit', pointerEvents: 'none' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          position: 'absolute',
          top: '5%', left: `${25 + i * 20}%`, width: '8%', height: '60%',
          background: `linear-gradient(180deg, ${color}20 0%, transparent 100%)`,
          transform: `rotate(${-10 + i * 10}deg)`,
          transformOrigin: 'top center',
          opacity: 0.6,
          animation: `lightRay 4s ease-in-out ${i * 0.8}s infinite`,
        }} />
      ))}
      {/* Sparkles */}
      {[0, 1, 2, 3, 4].map(i => (
        <div key={`s-${i}`} style={{
          position: 'absolute',
          left: `${15 + i * 17}%`, top: `${20 + (i % 3) * 18}%`,
          width: '2px', height: '2px', borderRadius: '50%',
          background: '#ffffff', boxShadow: `0 0 3px ${color}`,
          animation: `sparkle 2s ease-in-out ${i * 0.4}s infinite`,
        }} />
      ))}
    </div>
  );
}

// Curse drip/bleed effect all around the border
function CurseDrips() {
  const drips = [
    // Top and upper sides
    { angle: -Math.PI * 0.75, len: 12, delay: 0, w: 2 },
    { angle: -Math.PI * 0.55, len: 16, delay: 0.6, w: 2.5 },
    { angle: -Math.PI * 0.35, len: 20, delay: 1.2, w: 2 },
    { angle: -Math.PI * 0.15, len: 14, delay: 0.3, w: 1.5 },
    { angle: Math.PI * 0.05, len: 18, delay: 0.9, w: 2.5 },
    { angle: Math.PI * 0.25, len: 22, delay: 1.5, w: 2 },
    { angle: Math.PI * 0.45, len: 15, delay: 0.2, w: 3 },
    { angle: Math.PI * 0.65, len: 12, delay: 1.0, w: 2 },
    // Lower sides — shorter drips
    { angle: Math.PI * 0.85, len: 8, delay: 0.5, w: 1.5 },
    { angle: -Math.PI * 0.9, len: 10, delay: 1.3, w: 2 },
    // Extra top center drips
    { angle: -Math.PI * 0.48, len: 24, delay: 0.7, w: 3 },
    { angle: -Math.PI * 0.25, len: 16, delay: 1.8, w: 2 },
  ];
  return (
    <>
      {drips.map((d, i) => {
        const x = 50 + 49 * Math.cos(d.angle);
        const y = 50 + 49 * Math.sin(d.angle);
        return (
          <div key={i} style={{
            position: 'absolute',
            left: `${x}%`, top: `${y}%`,
            width: `${d.w}px`, height: `${d.len}px`,
            background: 'linear-gradient(180deg, #ff2244cc 0%, #ff224440 60%, #ff224400 100%)',
            borderRadius: '1px',
            transform: 'translateX(-50%)',
            animation: `curseDrip 2.5s ease-in ${d.delay}s infinite`,
            opacity: 0.8,
          }} />
        );
      })}
    </>
  );
}

// Big boss silhouette for cursed portals
function BossSilhouette({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 100 60" style={{
      position: 'absolute', bottom: '4%', left: '10%', right: '10%', width: '80%', height: '50%',
      pointerEvents: 'none',
    }}>
      {/* Large menacing figure — centered */}
      <g transform="translate(50, 55) scale(1.8)" opacity="0.8">
        {/* Horned head */}
        <ellipse cx="0" cy="-14" rx="4" ry="4.5" fill={color} />
        <polygon points="-4,-16 -7,-24 -3,-18" fill={color} /> {/* left horn */}
        <polygon points="4,-16 7,-24 3,-18" fill={color} /> {/* right horn */}
        {/* Broad body */}
        <rect x="-5" y="-10" width="10" height="10" rx="1.5" fill={color} />
        {/* Shoulders */}
        <rect x="-8" y="-10" width="3" height="5" rx="1" fill={color} />
        <rect x="5" y="-10" width="3" height="5" rx="1" fill={color} />
        {/* Legs */}
        <rect x="-4" y="-1" width="3" height="5" fill={color} />
        <rect x="1" y="-1" width="3" height="5" fill={color} />
        {/* Weapon — great axe */}
        <rect x="7" y="-20" width="1.5" height="18" fill={color} opacity="0.9" />
        <ellipse cx="9" cy="-19" rx="4" ry="2.5" fill={color} opacity="0.8" />
        {/* Glowing eyes */}
        <circle cx="-1.5" cy="-15" r="0.8" fill="#ff2244" />
        <circle cx="1.5" cy="-15" r="0.8" fill="#ff2244" />
        {/* Eye glow halos */}
        <circle cx="-1.5" cy="-15" r="1.8" fill="#ff2244" opacity="0.2" />
        <circle cx="1.5" cy="-15" r="1.8" fill="#ff2244" opacity="0.2" />
      </g>
    </svg>
  );
}

// Biome scene rendered inside the portal oval
function BiomeScene({ biome, difficulty, hasCurse }: { biome: string; difficulty: string; hasCurse: boolean }) {
  const biomeKey = (biome === 'final' ? 'volcanic' : biome) as Biome;
  const colors = BIOME_COLORS[biomeKey] || BIOME_COLORS.forest;
  const cfg = DIFF_CONFIG[difficulty] || DIFF_CONFIG.easy;
  const mtnPath = MTN_PATHS[biome] || MTN_PATHS.forest;
  const silhouetteColor = hasCurse ? '#1a0008' : '#0a0a0a';
  const isStable = difficulty === 'easy';

  return (
    <div style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', overflow: 'hidden' }}>
      {/* Sky gradient */}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(180deg, ${colors.sky.top} 0%, ${colors.sky.mid} 40%, ${colors.sky.bot} 70%, ${colors.gnd.top} 90%, ${colors.gnd.bot} 100%)`,
      }} />

      {/* Mountains (back layer) */}
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{
        position: 'absolute', bottom: '15%', left: 0, right: 0, width: '100%', height: '55%',
        opacity: 0.6,
      }}>
        <path d={mtnPath} fill={colors.mtn.back} />
      </svg>

      {/* Mountains (front layer) */}
      <svg viewBox="0 0 100 50" preserveAspectRatio="none" style={{
        position: 'absolute', bottom: '10%', left: 0, right: 0, width: '100%', height: '45%',
        opacity: 0.8,
      }}>
        <path d={mtnPath} fill={colors.mtn.front} transform="translate(10,5) scale(0.9,0.85)" />
      </svg>

      {/* Ground strip */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '15%',
        background: `linear-gradient(180deg, ${colors.gnd.top}, ${colors.gnd.bot})`,
      }} />

      {/* Grass tufts */}
      <div style={{
        position: 'absolute', bottom: '13%', left: 0, right: 0, height: '4%',
        background: colors.grass, opacity: 0.5,
      }} />

      {/* Stable: light rays + sparkles (peaceful) */}
      {isStable && !hasCurse && <LightRays color={colors.sky.bot} />}

      {/* Enemy silhouettes for harder portals */}
      <EnemySilhouettes count={hasCurse ? 3 : cfg.enemyCount} color={silhouetteColor} />
      {/* Cursed: big boss silhouette on top of the little guys */}
      {hasCurse && <BossSilhouette color={silhouetteColor} />}

      {/* Volcanic: lava glow */}
      {(biome === 'volcanic' || biome === 'final') && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '20%',
          background: 'linear-gradient(180deg, transparent, rgba(180,40,0,0.3))',
        }} />
      )}

      {/* Fog/darkness overlay for difficulty */}
      {cfg.fog > 0 && (
        <div style={{ position: 'absolute', inset: 0, background: `rgba(0,0,0,${cfg.fog})` }} />
      )}

      {/* Curse overlay: red tint + pulsing vignette */}
      {hasCurse && (
        <>
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 30%, rgba(120,0,0,0.3) 100%)',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'radial-gradient(ellipse at center, transparent 40%, rgba(200,0,30,0.15) 100%)',
            animation: 'cursePulse 2s ease-in-out infinite',
          }} />
        </>
      )}

      {/* Ripple distortion overlay */}
      <div style={{
        position: 'absolute', inset: 0, borderRadius: 'inherit',
        background: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(255,255,255,0.015) 4px, rgba(255,255,255,0.015) 5px)',
        animation: 'ripple 3s linear infinite',
        pointerEvents: 'none',
      }} />

      {/* Shimmer sweep */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 40%, transparent 60%, rgba(255,255,255,0.03) 100%)',
        animation: 'shimmer 3s ease-in-out infinite',
      }} />
    </div>
  );
}

const SLOTS: RegaliaSlot[] = ['sword', 'shield', 'necklace'];

function EquippedRegaliaStrip({ equipped }: { equipped: Record<RegaliaSlot, Regalia | null> }) {
  const [hovered, setHovered] = useState<RegaliaSlot | null>(null);

  return (
    <div style={{
      position: 'absolute', bottom: '13%', left: '50%', transform: 'translateX(-50%)',
      display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'auto', zIndex: 25,
    }}>
      <span style={{
        fontSize: 6, fontFamily: '"Press Start 2P", monospace',
        color: '#666', marginRight: 2, whiteSpace: 'nowrap',
      }}>GEAR:</span>
      {SLOTS.map(slot => {
        const reg = equipped[slot];
        const rarityColor = reg ? RARITY_COLORS[reg.rarity] : '#333';
        const isHov = hovered === slot;
        return (
          <div
            key={slot}
            style={{ position: 'relative' }}
            onMouseEnter={() => setHovered(slot)}
            onMouseLeave={() => setHovered(null)}
          >
            <div style={{
              width: 22, height: 22,
              border: `1.5px solid ${reg ? rarityColor : '#333'}`,
              borderRadius: 3,
              background: reg
                ? `linear-gradient(135deg, ${rarityColor}18, ${rarityColor}08)`
                : 'rgba(10,8,20,0.6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11,
              boxShadow: reg ? `0 0 6px ${rarityColor}55` : 'none',
              opacity: reg ? 1 : 0.4,
              cursor: reg ? 'default' : 'default',
              transition: 'box-shadow 0.15s',
              ...(isHov && reg ? { boxShadow: `0 0 10px ${rarityColor}88` } : {}),
            }}>
              {SLOT_ICONS[slot]}
            </div>

            {/* Hover tooltip */}
            {isHov && reg && (
              <div style={{
                position: 'absolute', bottom: '110%', left: '50%',
                transform: 'translateX(-50%)',
                width: 160, padding: '6px 8px',
                background: 'linear-gradient(180deg, rgba(12,8,25,0.97) 0%, rgba(6,4,14,0.97) 100%)',
                border: `1.5px solid ${rarityColor}55`,
                borderRadius: 6,
                boxShadow: `0 0 10px ${rarityColor}33, 0 4px 12px rgba(0,0,0,0.7)`,
                zIndex: 40, pointerEvents: 'none',
              }}>
                <div style={{
                  color: rarityColor, fontSize: 6,
                  fontFamily: '"Press Start 2P", monospace',
                  marginBottom: 2, lineHeight: 1.4,
                }}>
                  {reg.name}
                </div>
                <div style={{
                  color: rarityColor, fontSize: 5, opacity: 0.7, marginBottom: 4,
                  textTransform: 'uppercase', letterSpacing: '0.5px',
                }}>
                  {reg.rarity} · Lv{reg.level} · Zone {reg.zone}
                </div>
                <div style={{ width: '100%', height: 1, background: `${rarityColor}22`, marginBottom: 4 }} />
                {reg.modifiers.map((m, i) => (
                  <div key={i} style={{
                    color: '#ccc', fontSize: 5.5, marginBottom: 2,
                    lineHeight: 1.3,
                  }}>
                    · {getModDisplayText(m, reg.level)}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  portals: PortalChoiceData[];
  onSelect: (portal: PortalChoiceData) => void;
  equippedRegalias?: Record<RegaliaSlot, Regalia | null>;
}

export function PortalArches({ portals, onSelect, equippedRegalias }: Props) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [autoPref, setAutoPref] = useState<AutoPortalPref>(loadAutoPortalPref);
  const [timer, setTimer] = useState(AUTO_TIMER_SECONDS);
  const selectedRef = useRef(false);
  const count = portals.length;

  const handlePrefChange = useCallback((pref: AutoPortalPref) => {
    setAutoPref(pref);
    saveAutoPortalPref(pref);
    setTimer(AUTO_TIMER_SECONDS); // reset timer on change
  }, []);

  // Auto-select countdown
  useEffect(() => {
    if (autoPref === 'off' || selectedRef.current) return;
    const iv = setInterval(() => {
      setTimer(t => {
        if (t <= 1) {
          clearInterval(iv);
          // Find best match for preference
          const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
          const prefRank = diffOrder[autoPref] ?? 0;
          // Sort portals by closeness to preference, then prefer exact match
          const ranked = [...portals].sort((a, b) => {
            const da = Math.abs((diffOrder[a.difficulty] ?? 0) - prefRank);
            const db = Math.abs((diffOrder[b.difficulty] ?? 0) - prefRank);
            if (da !== db) return da - db;
            return (diffOrder[a.difficulty] ?? 0) - (diffOrder[b.difficulty] ?? 0);
          });
          if (ranked.length > 0 && !selectedRef.current) {
            selectedRef.current = true;
            onSelect(ranked[0]);
          }
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [autoPref, portals, onSelect]);

  const sorted = [...portals].map((p, i) => ({ p, i }));
  const diffOrder: Record<string, number> = { easy: 0, medium: 1, hard: 2 };
  sorted.sort((a, b) => (diffOrder[a.p.difficulty] ?? 1) - (diffOrder[b.p.difficulty] ?? 1));

  const POSITIONS: Record<number, { left: number; top: number }[]> = {
    1: [{ left: 50, top: 21.5 }],
    2: [{ left: 50, top: 21.5 }, { left: 73, top: 27.5 }],
    3: [{ left: 27, top: 27.5 }, { left: 50, top: 21.5 }, { left: 73, top: 27.5 }],
  };
  const slots = POSITIONS[count] || POSITIONS[3];

  return (
    <div style={{
      position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20,
    }}>
      {/* Title */}
      <div style={{
        position: 'absolute', top: '10.5%', left: '50%', transform: 'translateX(-50%)',
        color: '#d4a0ff', fontSize: '12px', fontFamily: '"Press Start 2P", monospace',
        textShadow: '0 0 12px rgba(168,85,247,0.6), 0 2px 4px rgba(0,0,0,0.8)',
        letterSpacing: '2px', whiteSpace: 'nowrap', pointerEvents: 'none',
        animation: 'titlePulse 4s ease-in-out infinite',
      }}>
        CHOOSE YOUR PATH
      </div>

      {sorted.map((entry, slotIdx) => {
        const portal = entry.p;
        const originalIdx = entry.i;
        const slot = slots[slotIdx];
        const cfg = DIFF_CONFIG[portal.difficulty] || DIFF_CONFIG.easy;
        const hasCurse = !!portal.curse;
        const curseDef = hasCurse ? getCurseDef(portal.curse!) : null;
        const accentColor = hasCurse ? '#ff2244' : cfg.color;
        const glowColor = hasCurse ? 'rgba(255,34,68,0.35)' : cfg.glow;
        const isHovered = hoveredIdx === originalIdx;

        const posMods = portal.modifiers.filter(id => getModifierDef(id)?.category === 'positive');
        const negMods = portal.modifiers.filter(id => getModifierDef(id)?.category === 'negative');
        const biomeLabel = BIOME_LABELS[portal.biome] || portal.biome;

        return (
          <div
            key={originalIdx}
            style={{
              position: 'absolute',
              left: `${slot.left}%`,
              top: `${slot.top}%`,
              transform: `translateX(-50%) scale(${isHovered ? 1.08 : 1})`,
              transition: 'transform 0.2s ease-out',
              pointerEvents: 'auto',
              cursor: 'pointer',
            }}
            onMouseEnter={() => setHoveredIdx(originalIdx)}
            onMouseLeave={() => setHoveredIdx(null)}
            onClick={() => onSelect(portal)}
          >
            {/* Floating container */}
            <div style={{
              width: '90px', height: '115px', position: 'relative',
              animation: `portalFloat${slotIdx} 3s ease-in-out infinite`,
            }}>
              {/* Outer glow */}
              <div style={{
                position: 'absolute', inset: '-8px',
                borderRadius: '50%',
                background: `radial-gradient(ellipse, ${glowColor} 0%, transparent 70%)`,
                opacity: isHovered ? 1 : 0.5,
                transition: 'opacity 0.2s',
                filter: 'blur(6px)',
              }} />

              {/* Portal oval frame */}
              <div style={{
                position: 'absolute', inset: 0,
                borderRadius: '50%',
                border: `3px solid ${hasCurse ? '#6a1a2a' : cfg.borderColor}`,
                boxShadow: `0 0 ${isHovered ? '18px' : '8px'} ${glowColor}, inset 0 0 ${isHovered ? '14px' : '6px'} ${glowColor}`,
                transition: 'box-shadow 0.2s',
                overflow: 'hidden',
              }}>
                {/* Biome scene inside */}
                <BiomeScene biome={portal.biome} difficulty={portal.difficulty} hasCurse={hasCurse} />

                {/* Vortex edge — dark swirl where frame meets scene */}
                <div style={{
                  position: 'absolute', inset: 0, borderRadius: 'inherit',
                  boxShadow: 'inset 0 0 14px 6px rgba(0,0,0,0.6)',
                  pointerEvents: 'none',
                }} />
              </div>

              {/* Rune dots along the border */}
              {RUNE_ANGLES.map((angle, i) => {
                const rx = 50 + 49 * Math.cos(angle);
                const ry = 50 + 49 * Math.sin(angle);
                return (
                  <div key={`rune-${i}`} style={{
                    position: 'absolute',
                    left: `${rx}%`, top: `${ry}%`,
                    width: '3px', height: '3px', borderRadius: '50%',
                    background: accentColor,
                    transform: 'translate(-50%, -50%)',
                    animation: `runeGlow 2.5s ease-in-out ${i * 0.25}s infinite`,
                    boxShadow: `0 0 4px ${accentColor}`,
                  }} />
                );
              })}

              {/* Curse drips from border */}
              {hasCurse && <CurseDrips />}
            </div>

            {/* Difficulty label */}
            <div style={{
              textAlign: 'center', marginTop: '2px',
              fontSize: '7px', fontFamily: '"Press Start 2P", monospace',
              color: accentColor, letterSpacing: '1px',
              textShadow: `0 0 6px ${accentColor}`,
            }}>
              {hasCurse ? 'CURSED' : cfg.label}
            </div>

            {/* Biome sublabel */}
            <div style={{
              textAlign: 'center', marginTop: '1px',
              fontSize: '6px', fontFamily: '"Press Start 2P", monospace',
              color: '#8888aa', opacity: 0.7,
            }}>
              {biomeLabel}
            </div>

            {/* Hover tooltip */}
            {isHovered && (
              <div style={{
                position: 'absolute', top: '108%', left: '50%',
                transform: 'translateX(-50%)',
                width: '180px', padding: '6px 8px',
                background: hasCurse
                  ? 'linear-gradient(180deg, rgba(60,8,20,0.96) 0%, rgba(25,4,10,0.96) 100%)'
                  : 'linear-gradient(180deg, rgba(15,10,30,0.96) 0%, rgba(8,5,18,0.96) 100%)',
                border: `1.5px solid ${hasCurse ? '#ff224480' : cfg.borderColor}`,
                borderRadius: '6px',
                boxShadow: `0 0 10px ${glowColor}, 0 4px 12px rgba(0,0,0,0.6)`,
                zIndex: 30, pointerEvents: 'none',
              }}>
                {portal.modifiers.length === 0 && !hasCurse && (
                  <div style={{ color: '#555', fontSize: '8px', fontStyle: 'italic', textAlign: 'center', padding: '2px 0' }}>
                    No modifiers
                  </div>
                )}

                {posMods.map(id => {
                  const def = getModifierDef(id);
                  if (!def) return null;
                  return (
                    <div key={id} style={{ marginBottom: '2px' }}>
                      <div style={{ color: '#4aff4a', fontSize: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span>{def.icon}</span>
                        <span style={{ fontWeight: 'bold' }}>{def.name}</span>
                      </div>
                      <div style={{ color: '#3acc3a', fontSize: '5.5px', paddingLeft: '12px', opacity: 0.85 }}>
                        {def.description}
                      </div>
                    </div>
                  );
                })}

                {negMods.length > 0 && posMods.length > 0 && (
                  <div style={{ width: '50%', height: '1px', background: 'rgba(255,100,100,0.15)', margin: '2px auto' }} />
                )}

                {negMods.map(id => {
                  const def = getModifierDef(id);
                  if (!def) return null;
                  return (
                    <div key={id} style={{ marginBottom: '2px' }}>
                      <div style={{ color: '#ff6666', fontSize: '6px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                        <span>{def.icon}</span>
                        <span style={{ fontWeight: 'bold' }}>{def.name}</span>
                      </div>
                      <div style={{ color: '#cc5555', fontSize: '5.5px', paddingLeft: '12px', opacity: 0.85 }}>
                        {def.description}
                      </div>
                    </div>
                  );
                })}

                {hasCurse && curseDef && (
                  <div style={{
                    marginTop: '3px', padding: '3px 4px', borderRadius: '3px',
                    background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,34,68,0.2)',
                  }}>
                    <div style={{ color: '#ff2244', fontSize: '6px', fontWeight: 'bold', marginBottom: '1px' }}>
                      {curseDef.icon} {curseDef.name}
                    </div>
                    <div style={{ color: '#ff8888', fontSize: '5.5px', lineHeight: '1.3' }}>{curseDef.downside}</div>
                    <div style={{ color: '#88ff88', fontSize: '5.5px', lineHeight: '1.3' }}>{'\u2728'} {curseDef.reward}</div>
                  </div>
                )}

                <div style={{
                  textAlign: 'center', marginTop: '4px', padding: '2px 0',
                  color: accentColor, fontSize: '6px', letterSpacing: '1px',
                  fontFamily: '"Press Start 2P", monospace', opacity: 0.7,
                }}>
                  CLICK TO ENTER
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* CSS animations */}
      <style>{`
        @keyframes shimmer {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
        @keyframes ripple {
          0% { transform: translateY(0); }
          100% { transform: translateY(5px); }
        }
        @keyframes cursePulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 0.8; }
        }
        @keyframes curseDrip {
          0% { transform: translateX(-50%) translateY(-4px); opacity: 0; }
          15% { opacity: 0.8; }
          100% { transform: translateX(-50%) translateY(12px); opacity: 0; }
        }
        @keyframes runeGlow {
          0%, 100% { opacity: 0.2; box-shadow: 0 0 2px currentColor; }
          50% { opacity: 0.9; box-shadow: 0 0 6px currentColor; }
        }
        @keyframes lightRay {
          0%, 100% { opacity: 0.3; transform: rotate(var(--r, 0deg)) scaleY(0.8); }
          50% { opacity: 0.7; transform: rotate(var(--r, 0deg)) scaleY(1.1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1.2); }
        }
        @keyframes titlePulse {
          0%, 100% { text-shadow: 0 0 12px rgba(168,85,247,0.6), 0 2px 4px rgba(0,0,0,0.8); }
          50% { text-shadow: 0 0 20px rgba(168,85,247,0.8), 0 0 40px rgba(168,85,247,0.3), 0 2px 4px rgba(0,0,0,0.8); }
        }
        @keyframes portalFloat0 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes portalFloat1 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes portalFloat2 {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>

      {/* Equipped regalia strip */}
      {equippedRegalias && (
        <EquippedRegaliaStrip equipped={equippedRegalias} />
      )}

      {/* Auto-select preference bar */}
      <div style={{
        position: 'absolute', bottom: '22%', left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
        pointerEvents: 'auto', zIndex: 25,
      }}>
        {autoPref !== 'off' && (
          <div style={{
            fontSize: 8, fontFamily: '"Press Start 2P", monospace',
            color: timer <= 10 ? '#ff6666' : '#aaa',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            animation: timer <= 10 ? 'pulse 1s infinite' : undefined,
          }}>
            Auto-selecting {{ easy: 'STABLE', medium: 'WARPED', hard: 'VOLATILE' }[autoPref] || autoPref.toUpperCase()} in {timer}s
          </div>
        )}
        <div style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
          <span style={{
            fontSize: 7, fontFamily: '"Press Start 2P", monospace',
            color: '#888', marginRight: 2,
          }}>AUTO:</span>
          {(['off', 'easy', 'medium', 'hard'] as AutoPortalPref[]).map(pref => {
            const active = autoPref === pref;
            const colors: Record<string, string> = { off: '#888', easy: '#4aff4a', medium: '#ffcc44', hard: '#ff4444' };
            const labels: Record<string, string> = { off: 'OFF', easy: 'STABLE', medium: 'WARPED', hard: 'VOLATILE' };
            return (
              <button
                key={pref}
                onClick={() => handlePrefChange(pref)}
                style={{
                  padding: '3px 6px', fontSize: 7,
                  fontFamily: '"Press Start 2P", monospace',
                  background: active ? 'rgba(138,74,223,0.4)' : 'rgba(20,15,30,0.7)',
                  border: `1px solid ${active ? colors[pref] : '#444'}`,
                  borderRadius: 3, cursor: 'pointer',
                  color: active ? colors[pref] : '#666',
                  transition: 'all 0.15s',
                }}
              >
                {labels[pref]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
