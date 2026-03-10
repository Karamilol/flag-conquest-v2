// ── Fractured World: Portal Selection Overlay ───────────────────────

import { COLORS } from '../../constants';
import type { PortalChoiceData } from '../../types';
import { getModifierDef, getCurseDef } from '../../modifiers';

const DIFF_CONFIG: Record<string, { label: string; color: string; border: string; bg: string }> = {
  easy: { label: 'SAFE PATH', color: '#4aff4a', border: '#2a8a2a', bg: 'rgba(20,60,20,0.95)' },
  medium: { label: 'BALANCED', color: '#ffcc44', border: '#8a7a2a', bg: 'rgba(60,50,15,0.95)' },
  hard: { label: 'DANGEROUS', color: '#ff4444', border: '#8a2a2a', bg: 'rgba(60,15,15,0.95)' },
};

const BIOME_LABELS: Record<string, string> = {
  forest: 'Ancient Forest',
  cave: 'Crystal Caverns',
  nordic: 'Frozen Highlands',
  volcanic: 'Volcanic Wastes',
  final: 'The Void',
};

interface Props {
  portals: PortalChoiceData[];
  onSelect: (portal: PortalChoiceData) => void;
}

export function PortalSelect({ portals, onSelect }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'linear-gradient(135deg, rgba(10,5,25,0.97) 0%, rgba(20,8,40,0.97) 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      zIndex: 30, padding: '8px 10px',
    }}>
      <div style={{ color: '#a855f7', fontSize: '14px', marginBottom: '2px', textAlign: 'center', letterSpacing: '2px' }}>
        {'\u{1F30A}'} PORTAL RIFT
      </div>
      <div style={{ color: COLORS.text, fontSize: '11px', marginBottom: '12px', textAlign: 'center', opacity: 0.8 }}>
        Choose your path through the fracture
      </div>

      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', maxWidth: '560px' }}>
        {portals.map((portal, idx) => {
          const cfg = DIFF_CONFIG[portal.difficulty] || DIFF_CONFIG.easy;
          const curseDef = portal.curse ? getCurseDef(portal.curse) : null;
          const hasCurse = !!curseDef;
          const biomeLabel = BIOME_LABELS[portal.biome] || portal.biome;

          const posMods = portal.modifiers.filter(id => getModifierDef(id)?.category === 'positive');
          const negMods = portal.modifiers.filter(id => getModifierDef(id)?.category === 'negative');

          return (
            <button key={idx} onClick={() => onSelect(portal)} style={{
              padding: '10px 8px 8px', textAlign: 'center', fontFamily: 'inherit',
              background: hasCurse
                ? 'linear-gradient(180deg, rgba(80,10,30,0.95) 0%, rgba(40,5,15,0.95) 100%)'
                : `linear-gradient(180deg, ${cfg.bg} 0%, rgba(15,8,25,0.95) 100%)`,
              border: `2px solid ${hasCurse ? '#ff2244' : cfg.border}`,
              borderRadius: '10px', cursor: 'pointer',
              width: '170px', minHeight: '140px',
              transition: 'border-color 0.15s, box-shadow 0.15s, transform 0.1s',
              boxShadow: hasCurse
                ? '0 0 16px rgba(255,34,68,0.4), inset 0 0 8px rgba(255,34,68,0.1)'
                : `0 0 8px ${cfg.color}20`,
              display: 'flex', flexDirection: 'column', alignItems: 'center',
            }}>
              {/* Difficulty badge */}
              <div style={{
                display: 'inline-block', padding: '1px 6px', borderRadius: '3px',
                background: cfg.color + '25', border: `1px solid ${cfg.color}50`,
                color: cfg.color, fontSize: '7px', letterSpacing: '1.5px',
                textTransform: 'uppercase', marginBottom: '3px',
              }}>
                {cfg.label}
              </div>

              {/* Biome */}
              <div style={{ color: '#8888aa', fontSize: '8px', marginBottom: '6px' }}>
                {biomeLabel}
              </div>

              {/* Divider */}
              <div style={{ width: '80%', height: '1px', background: 'rgba(255,255,255,0.08)', marginBottom: '6px' }} />

              {/* Modifiers with descriptions */}
              <div style={{ flex: 1, width: '100%' }}>
                {portal.modifiers.length === 0 && !hasCurse && (
                  <div style={{ color: '#555', fontSize: '9px', fontStyle: 'italic', padding: '8px 0' }}>
                    Vanilla zone — no modifiers
                  </div>
                )}

                {posMods.map(id => {
                  const def = getModifierDef(id);
                  if (!def) return null;
                  return (
                    <div key={id} style={{ marginBottom: '4px', textAlign: 'left', padding: '0 2px' }}>
                      <div style={{
                        color: '#4aff4a', fontSize: '8px',
                        display: 'flex', alignItems: 'center', gap: '3px',
                      }}>
                        <span style={{ flexShrink: 0 }}>{def.icon}</span>
                        <span style={{ fontWeight: 'bold' }}>{def.name}</span>
                      </div>
                      <div style={{ color: '#3acc3a', fontSize: '7px', paddingLeft: '14px', opacity: 0.85 }}>
                        {def.description}
                      </div>
                    </div>
                  );
                })}

                {negMods.length > 0 && posMods.length > 0 && (
                  <div style={{ width: '60%', height: '1px', background: 'rgba(255,100,100,0.15)', margin: '3px auto' }} />
                )}

                {negMods.map(id => {
                  const def = getModifierDef(id);
                  if (!def) return null;
                  return (
                    <div key={id} style={{ marginBottom: '4px', textAlign: 'left', padding: '0 2px' }}>
                      <div style={{
                        color: '#ff6666', fontSize: '8px',
                        display: 'flex', alignItems: 'center', gap: '3px',
                      }}>
                        <span style={{ flexShrink: 0 }}>{def.icon}</span>
                        <span style={{ fontWeight: 'bold' }}>{def.name}</span>
                      </div>
                      <div style={{ color: '#cc5555', fontSize: '7px', paddingLeft: '14px', opacity: 0.85 }}>
                        {def.description}
                      </div>
                    </div>
                  );
                })}

                {/* Curse */}
                {hasCurse && curseDef && (
                  <div style={{
                    marginTop: '4px', padding: '4px 5px', borderRadius: '4px',
                    background: 'rgba(255,0,0,0.12)', border: '1px solid rgba(255,34,68,0.25)',
                    textAlign: 'left',
                  }}>
                    <div style={{
                      color: '#ff2244', fontSize: '8px', fontWeight: 'bold',
                      marginBottom: '2px', letterSpacing: '0.5px',
                    }}>
                      {curseDef.icon} {curseDef.name}
                    </div>
                    <div style={{ color: '#ff8888', fontSize: '7px', marginBottom: '2px', lineHeight: '1.3' }}>
                      {curseDef.downside}
                    </div>
                    <div style={{ color: '#88ff88', fontSize: '7px', lineHeight: '1.3' }}>
                      {'\u{2728}'} {curseDef.reward}
                    </div>
                  </div>
                )}
              </div>

              {/* Enter button */}
              <div style={{
                marginTop: '8px', padding: '4px 12px', borderRadius: '4px',
                background: hasCurse ? 'rgba(255,34,68,0.2)' : `${cfg.color}18`,
                border: `1px solid ${hasCurse ? 'rgba(255,34,68,0.3)' : cfg.color + '30'}`,
                color: hasCurse ? '#ff6688' : cfg.color,
                fontSize: '9px', letterSpacing: '1.5px',
              }}>
                ENTER
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
