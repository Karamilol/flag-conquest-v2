// ── Fractured World: Portal Arch Detail Panel ─────────────────────
// Compact info card shown when a portal arch is clicked in-world.

import { COLORS } from '../../constants';
import type { PortalChoiceData } from '../../types';
import { getModifierDef, getCurseDef } from '../../modifiers';

const DIFF_CONFIG: Record<string, { label: string; color: string; border: string }> = {
  easy:   { label: 'STABLE',   color: '#4aff4a', border: '#2a8a2a' },
  medium: { label: 'WARPED',   color: '#ffcc44', border: '#8a7a2a' },
  hard:   { label: 'VOLATILE', color: '#ff4444', border: '#8a2a2a' },
};

const BIOME_LABELS: Record<string, string> = {
  forest: 'Ancient Forest',
  cave: 'Crystal Caverns',
  nordic: 'Frozen Highlands',
  volcanic: 'Volcanic Wastes',
  final: 'The Void',
};

interface Props {
  portal: PortalChoiceData;
  onEnter: () => void;
  onClose: () => void;
}

export function PortalArchDetail({ portal, onEnter, onClose }: Props) {
  const cfg = DIFF_CONFIG[portal.difficulty] || DIFF_CONFIG.easy;
  const curseDef = portal.curse ? getCurseDef(portal.curse) : null;
  const hasCurse = !!curseDef;
  const biomeLabel = BIOME_LABELS[portal.biome] || portal.biome;
  const accentColor = hasCurse ? '#ff2244' : cfg.color;

  const posMods = portal.modifiers.filter(id => getModifierDef(id)?.category === 'positive');
  const negMods = portal.modifiers.filter(id => getModifierDef(id)?.category === 'negative');

  return (
    <div
      style={{
        position: 'absolute', bottom: '6px', left: '50%', transform: 'translateX(-50%)',
        zIndex: 25, pointerEvents: 'auto',
        width: '280px', maxHeight: '200px',
        background: hasCurse
          ? 'linear-gradient(180deg, rgba(60,8,20,0.96) 0%, rgba(25,4,10,0.96) 100%)'
          : 'linear-gradient(180deg, rgba(15,10,30,0.96) 0%, rgba(8,5,18,0.96) 100%)',
        border: `1.5px solid ${hasCurse ? '#ff2244' : cfg.border}`,
        borderRadius: '8px',
        padding: '8px 10px 6px',
        boxShadow: `0 0 12px ${accentColor}30, 0 4px 16px rgba(0,0,0,0.5)`,
        overflowY: 'auto',
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            display: 'inline-block', padding: '1px 5px', borderRadius: '3px',
            background: accentColor + '20', border: `1px solid ${accentColor}40`,
            color: accentColor, fontSize: '6px', letterSpacing: '1px',
            textTransform: 'uppercase',
          }}>
            {hasCurse ? '\u26A7 CURSED' : cfg.label}
          </span>
          <span style={{ color: '#8888aa', fontSize: '7px' }}>{biomeLabel}</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: 'none', color: '#666', fontSize: '12px',
            cursor: 'pointer', padding: '0 2px', fontFamily: 'inherit', lineHeight: 1,
          }}
        >
          x
        </button>
      </div>

      {/* Divider */}
      <div style={{ width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)', marginBottom: '5px' }} />

      {/* Modifiers */}
      {portal.modifiers.length === 0 && !hasCurse && (
        <div style={{ color: '#555', fontSize: '8px', fontStyle: 'italic', padding: '4px 0', textAlign: 'center' }}>
          No modifiers — vanilla zone
        </div>
      )}

      {posMods.map(id => {
        const def = getModifierDef(id);
        if (!def) return null;
        return (
          <div key={id} style={{ marginBottom: '3px' }}>
            <div style={{ color: '#4aff4a', fontSize: '7px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{def.icon}</span>
              <span style={{ fontWeight: 'bold' }}>{def.name}</span>
            </div>
            <div style={{ color: '#3acc3a', fontSize: '6px', paddingLeft: '14px', opacity: 0.85 }}>
              {def.description}
            </div>
          </div>
        );
      })}

      {negMods.length > 0 && posMods.length > 0 && (
        <div style={{ width: '50%', height: '1px', background: 'rgba(255,100,100,0.12)', margin: '3px auto' }} />
      )}

      {negMods.map(id => {
        const def = getModifierDef(id);
        if (!def) return null;
        return (
          <div key={id} style={{ marginBottom: '3px' }}>
            <div style={{ color: '#ff6666', fontSize: '7px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              <span>{def.icon}</span>
              <span style={{ fontWeight: 'bold' }}>{def.name}</span>
            </div>
            <div style={{ color: '#cc5555', fontSize: '6px', paddingLeft: '14px', opacity: 0.85 }}>
              {def.description}
            </div>
          </div>
        );
      })}

      {/* Curse */}
      {hasCurse && curseDef && (
        <div style={{
          marginTop: '3px', padding: '3px 4px', borderRadius: '3px',
          background: 'rgba(255,0,0,0.1)', border: '1px solid rgba(255,34,68,0.2)',
        }}>
          <div style={{ color: '#ff2244', fontSize: '7px', fontWeight: 'bold', marginBottom: '1px' }}>
            {curseDef.icon} {curseDef.name}
          </div>
          <div style={{ color: '#ff8888', fontSize: '6px', lineHeight: '1.3' }}>{curseDef.downside}</div>
          <div style={{ color: '#88ff88', fontSize: '6px', lineHeight: '1.3' }}>{'\u2728'} {curseDef.reward}</div>
        </div>
      )}

      {/* Enter button */}
      <button
        onClick={onEnter}
        style={{
          display: 'block', width: '100%', marginTop: '6px', padding: '5px 0',
          background: `${accentColor}18`, border: `1px solid ${accentColor}35`,
          borderRadius: '4px', cursor: 'pointer',
          color: accentColor, fontSize: '8px', letterSpacing: '2px',
          fontFamily: '"Press Start 2P", monospace',
          transition: 'background 0.15s',
        }}
      >
        ENTER PORTAL
      </button>
    </div>
  );
}
