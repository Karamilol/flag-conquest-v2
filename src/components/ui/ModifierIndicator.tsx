// ── Active Modifier Indicator ────────────────────────────────────────
// Small HUD element showing active zone modifiers + curse during gameplay.

import { useState } from 'react';
import type { GameState } from '../../types';
import { getModifierDef, getCurseDef } from '../../modifiers';

interface Props {
  gameRef: React.MutableRefObject<GameState>;
  frame: number; // triggers re-render
}

export function ModifierIndicator({ gameRef }: Props) {
  const [expanded, setExpanded] = useState(false);
  const game = gameRef.current;
  if (!game) return null;

  const mods = game.activeModifiers || [];
  const curse = game.activeCurse;
  if (mods.length === 0 && !curse) return null;

  const posMods = mods.filter(id => getModifierDef(id)?.category === 'positive');
  const negMods = mods.filter(id => getModifierDef(id)?.category === 'negative');
  const curseDef = curse ? getCurseDef(curse) : null;

  return (
    <div
      onClick={() => setExpanded(e => !e)}
      style={{
        position: 'absolute', top: '4px', right: '4px', zIndex: 15,
        background: 'rgba(10,5,20,0.85)', border: '1px solid rgba(138,74,223,0.3)',
        borderRadius: '6px', padding: expanded ? '5px 7px' : '3px 5px',
        cursor: 'pointer', maxWidth: expanded ? '180px' : '90px',
        transition: 'max-width 0.2s, padding 0.2s',
      }}
    >
      {/* Collapsed: just icons */}
      {!expanded && (
        <div style={{ display: 'flex', gap: '2px', alignItems: 'center', flexWrap: 'wrap' }}>
          {posMods.map(id => {
            const def = getModifierDef(id);
            return def ? <span key={id} style={{ fontSize: '9px' }} title={def.name}>{def.icon}</span> : null;
          })}
          {negMods.map(id => {
            const def = getModifierDef(id);
            return def ? <span key={id} style={{ fontSize: '9px' }} title={def.name}>{def.icon}</span> : null;
          })}
          {curseDef && <span style={{ fontSize: '9px' }} title={curseDef.name}>{curseDef.icon}</span>}
        </div>
      )}

      {/* Expanded: full details */}
      {expanded && (
        <div>
          <div style={{ color: '#a855f7', fontSize: '7px', letterSpacing: '1px', marginBottom: '3px' }}>
            ZONE MODIFIERS
          </div>
          {posMods.map(id => {
            const def = getModifierDef(id);
            if (!def) return null;
            return (
              <div key={id} style={{ marginBottom: '2px' }}>
                <div style={{ color: '#4aff4a', fontSize: '8px' }}>
                  {def.icon} {def.name}
                </div>
                <div style={{ color: '#3acc3a', fontSize: '7px', paddingLeft: '12px', opacity: 0.8 }}>
                  {def.description}
                </div>
              </div>
            );
          })}
          {negMods.map(id => {
            const def = getModifierDef(id);
            if (!def) return null;
            return (
              <div key={id} style={{ marginBottom: '2px' }}>
                <div style={{ color: '#ff6666', fontSize: '8px' }}>
                  {def.icon} {def.name}
                </div>
                <div style={{ color: '#cc5555', fontSize: '7px', paddingLeft: '12px', opacity: 0.8 }}>
                  {def.description}
                </div>
              </div>
            );
          })}
          {curseDef && (
            <div style={{ marginTop: '3px', padding: '2px 3px', borderRadius: '3px', background: 'rgba(255,0,0,0.1)' }}>
              <div style={{ color: '#ff2244', fontSize: '8px', fontWeight: 'bold' }}>
                {curseDef.icon} {curseDef.name}
              </div>
              <div style={{ color: '#ff8888', fontSize: '7px' }}>{curseDef.downside}</div>
              <div style={{ color: '#88ff88', fontSize: '7px' }}>{'\u{2728}'} {curseDef.reward}</div>
            </div>
          )}
          <div style={{ color: '#555', fontSize: '6px', marginTop: '3px', textAlign: 'center' }}>
            click to collapse
          </div>
        </div>
      )}
    </div>
  );
}
